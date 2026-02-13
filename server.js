require('dotenv').config();
const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');

const config = require('./config.json');
const { pool, initDatabase } = require('./handlers/database');
const { registerUser, loginUser, getUserByUsername, regenerateApiKey, requireAuth, requireAdmin } = require('./handlers/auth');
const { loadCommands, getAPIs, getAPIsByCategory, getStats, getTotalApiCalls, getTotalUsers } = require('./handlers/apiLoader');
const { setupApiRoutes } = require('./handlers/apiRouter');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views/pages'));
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

const sessionMiddleware = session({
  store: new PgSession({
    pool: pool,
    tableName: 'session',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || require('crypto').randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  }
});
app.use(sessionMiddleware);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { status: false, error: 'Too many attempts, try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: { status: false, error: 'Rate limit exceeded. Try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false
});

function getBaseUrl(req) {
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

function getViewData(req) {
  return {
    config,
    user: req.session?.user || null,
    categories: getAPIsByCategory(),
    baseUrl: getBaseUrl(req)
  };
}

app.get('/', async (req, res) => {
  const apiStats = getStats();
  const totalCalls = await getTotalApiCalls();
  const totalUsers = await getTotalUsers();
  res.render('landing', {
    ...getViewData(req),
    title: 'Home',
    stats: {
      ...apiStats,
      totalCalls,
      totalUsers
    }
  });
});

app.get('/login', (req, res) => {
  if (req.session?.user) return res.redirect('/user/' + req.session.user.username);
  res.render('login', { ...getViewData(req), title: 'Login', error: null });
});

app.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.render('login', { ...getViewData(req), title: 'Login', error: 'All fields are required' });
    }
    const user = await loginUser(email, password);
    req.session.user = user;
    res.redirect('/user/' + user.username);
  } catch (err) {
    res.render('login', { ...getViewData(req), title: 'Login', error: err.message });
  }
});

app.get('/register', (req, res) => {
  if (req.session?.user) return res.redirect('/user/' + req.session.user.username);
  res.render('register', { ...getViewData(req), title: 'Register', error: null });
});

app.post('/register', authLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.render('register', { ...getViewData(req), title: 'Register', error: 'All fields are required' });
    }
    if (username.length < 3 || username.length > 30) {
      return res.render('register', { ...getViewData(req), title: 'Register', error: 'Username must be 3-30 characters' });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.render('register', { ...getViewData(req), title: 'Register', error: 'Username can only contain letters, numbers, and underscores' });
    }
    if (password.length < 6) {
      return res.render('register', { ...getViewData(req), title: 'Register', error: 'Password must be at least 6 characters' });
    }
    const user = await registerUser(username, email, password);
    req.session.user = user;
    res.redirect('/user/' + user.username);
  } catch (err) {
    res.render('register', { ...getViewData(req), title: 'Register', error: err.message });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.get('/user/:username', requireAuth, async (req, res) => {
  try {
    const dashUser = await getUserByUsername(req.params.username);
    if (!dashUser || dashUser.username !== req.session.user.username) {
      return res.status(404).render('404', { ...getViewData(req), title: '404' });
    }
    const apiStats = getStats();
    res.render('dashboard', {
      ...getViewData(req),
      title: 'Dashboard',
      dashUser,
      apis: getAPIs(),
      stats: apiStats
    });
  } catch (err) {
    res.status(500).render('404', { ...getViewData(req), title: 'Error' });
  }
});

app.post('/user/:username/regenerate-key', requireAuth, async (req, res) => {
  try {
    if (req.params.username !== req.session.user.username) {
      return res.status(403).redirect('/');
    }
    const newKey = await regenerateApiKey(req.session.user.id);
    req.session.user.api_key = newKey;
    res.redirect('/user/' + req.params.username);
  } catch (err) {
    res.redirect('/user/' + req.params.username);
  }
});

app.get('/korekong/admin/login', (req, res) => {
  if (req.session?.isAdmin) return res.redirect('/korekong/admin');
  res.render('admin-login', { ...getViewData(req), title: 'Admin Login', error: null });
});

app.post('/korekong/admin/login', authLimiter, async (req, res) => {
  const { username, password } = req.body;
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  const usernameMatch = username === adminUser;
  const passwordMatch = password === adminPass;
  if (usernameMatch && passwordMatch) {
    req.session.isAdmin = true;
    return res.redirect('/korekong/admin');
  }
  await new Promise(r => setTimeout(r, 1000));
  res.render('admin-login', { ...getViewData(req), title: 'Admin Login', error: 'Invalid credentials' });
});

app.get('/korekong/admin', requireAdmin, async (req, res) => {
  try {
    const usersResult = await pool.query('SELECT id, username, email, api_calls, created_at FROM users ORDER BY created_at DESC');
    const apiStats = getStats();
    const totalCalls = await getTotalApiCalls();
    const totalUsers = await getTotalUsers();
    res.render('admin', {
      ...getViewData(req),
      title: 'Admin Panel',
      users: usersResult.rows,
      apis: getAPIs(),
      stats: {
        ...apiStats,
        totalCalls,
        totalUsers
      }
    });
  } catch (err) {
    res.status(500).render('404', { ...getViewData(req), title: 'Error' });
  }
});

app.get('/korekong/admin/logout', (req, res) => {
  req.session.isAdmin = false;
  res.redirect('/');
});

app.get('/api/ping', (req, res) => {
  res.json({ pong: true, timestamp: Date.now() });
});

app.get('/api/user/stats', requireAuth, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT api_calls FROM users WHERE id = $1',
      [req.session.user.id]
    );
    const apiStats = getStats();
    const totalCalls = await getTotalApiCalls();
    res.json({
      userCalls: userResult.rows[0]?.api_calls || 0,
      totalAPIs: apiStats.totalAPIs,
      deadAPIs: apiStats.deadAPIs,
      totalCalls
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.get('/api/notifications', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const result = await pool.query(`
      SELECT n.id, n.sender, n.title, n.message, n.created_at,
        CASE WHEN nr.id IS NOT NULL THEN true ELSE false END as is_read
      FROM notifications n
      LEFT JOIN notification_reads nr ON nr.notification_id = n.id AND nr.user_id = $1
      WHERE n.target_all = true OR n.target_user_id = $1
      ORDER BY n.created_at DESC
      LIMIT 50
    `, [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.post('/api/notifications/:id/read', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const check = await pool.query(
      'SELECT id FROM notifications WHERE id = $1 AND (target_all = true OR target_user_id = $2)',
      [req.params.id, userId]
    );
    if (check.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await pool.query(
      'INSERT INTO notification_reads (notification_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.params.id, userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

app.post('/api/notifications/read-all', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    await pool.query(`
      INSERT INTO notification_reads (notification_id, user_id)
      SELECT n.id, $1 FROM notifications n
      LEFT JOIN notification_reads nr ON nr.notification_id = n.id AND nr.user_id = $1
      WHERE (n.target_all = true OR n.target_user_id = $1) AND nr.id IS NULL
    `, [userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

app.post('/api/admin/notify', requireAdmin, async (req, res) => {
  try {
    const { title, message, targetUserId } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }
    if (targetUserId && targetUserId !== 'all') {
      await pool.query(
        'INSERT INTO notifications (title, message, target_user_id, target_all) VALUES ($1, $2, $3, false)',
        [title, message, parseInt(targetUserId)]
      );
    } else {
      await pool.query(
        'INSERT INTO notifications (title, message, target_all) VALUES ($1, $2, true)',
        [title, message]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  const totalCalls = await getTotalApiCalls();
  const totalUsers = await getTotalUsers();
  res.json({ totalCalls, totalUsers });
});

async function start() {
  try {
    await initDatabase();
    loadCommands();

    const apiRouter = setupApiRoutes();
    app.use(apiLimiter, apiRouter);

    app.use((req, res) => {
      res.status(404).render('404', { ...getViewData(req), title: '404' });
    });

    const PORT = process.env.PORT || config.port || 5000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[BILYABITS-RAPI] Server running on port ${PORT}`);
      console.log(`[BILYABITS-RAPI] Version ${config.version}`);
      console.log(`[BILYABITS-RAPI] ${getAPIs().length} API(s) loaded`);
    });
  } catch (err) {
    console.error('[FATAL]', err);
    process.exit(1);
  }
}

start();
