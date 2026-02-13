<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/PostgreSQL-15+-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="TailwindCSS">
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License">
</p>

<h1 align="center">BILYABITS-RAPI</h1>

<p align="center">
  <strong>Open-source REST API platform with a modular command system, user authentication, admin panel, and built-in API tester.</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-deployment">Deployment</a> •
  <a href="#-adding-api-commands">Adding APIs</a> •
  <a href="#-environment-variables">Configuration</a> •
  <a href="#-project-structure">Structure</a>
</p>

---

## Features

- **Modular API Command System** — Drop a `.js` file into `/commands/` and it auto-loads as a new API endpoint
- **User Authentication** — Secure registration, login, and session management with bcrypt password hashing
- **API Key Management** — Each user gets a unique API key with one-click regeneration
- **Built-in API Tester** — Test any loaded API directly from the dashboard with auto-generated copyable URLs
- **Admin Panel** — Manage users, view platform stats, and send notifications from `/korekong/admin`
- **Notification System** — Admin can broadcast messages to all users or target specific ones; users see real-time notifications with modal previews
- **Rate Limiting** — Built-in protection against abuse on auth and API endpoints
- **API Call Tracking** — Every API call is logged and counted per user
- **Mobile-First Design** — Responsive UI with side drawer navigation, optimized for all screen sizes
- **Multi-Host Compatible** — Deploy on Replit, Render, Railway, Vercel, Hostinger, VPS, or any Node.js host

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express 5.x |
| Templates | EJS + TailwindCSS (CDN) |
| Database | PostgreSQL |
| Auth | bcryptjs + express-session |
| Session Store | connect-pg-simple |
| HTTP Client | axios |
| Security | helmet, express-rate-limit, CORS |

---

## Quick Start

### Prerequisites

- **Node.js** 18 or higher
- **PostgreSQL** database (local or cloud)
- **npm** or **yarn**

### 1. Clone the Repository

```bash
git clone https://github.com/carljohnvillavito/bilyabits-rapi.git
cd bilyabits-rapi
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
PORT=5000
NODE_ENV=production
BASE_URL=https://your-domain.com
DB_TYPE=postgresql
DATABASE_URL=postgresql://user:password@localhost:5432/bilyabits
SESSION_SECRET=your-random-secret-key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
```

### 4. Start the Server

```bash
npm start
```

The server starts at `http://localhost:5000`

---

## Deployment

### Deploy on Replit

1. Fork/import this repository on [Replit](https://replit.com)
2. Replit automatically provides a PostgreSQL database via `DATABASE_URL`
3. Set your secrets in the Secrets tab: `SESSION_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`
4. Click **Run** — the app starts automatically

[![Run on Replit](https://replit.com/badge?caption=Run%20on%20Replit)](https://replit.com/github/carljohnvillavito/bilyabits-rapi)

---

### Deploy on Render

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repository
3. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: `Node`
4. Add a **PostgreSQL** database from Render's dashboard
5. Set environment variables:
   - `DATABASE_URL` — Auto-provided by Render if you link the DB
   - `DB_SSL=true` — Required for Render PostgreSQL
   - `SESSION_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`
   - `BASE_URL` — Your Render app URL (e.g., `https://myapp.onrender.com`)
   - `NODE_ENV=production`

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/carljohnvillavito/bilyabits-rapi)

---

### Deploy on Railway

1. Create a new project on [Railway](https://railway.app)
2. Add a **PostgreSQL** plugin
3. Deploy from GitHub
4. Set environment variables:
   - `DATABASE_URL` — Auto-provided by Railway
   - `DB_SSL=true`
   - `SESSION_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`
   - `BASE_URL` — Your Railway app URL
   - `NODE_ENV=production`

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template?referralCode=bilyabits)

---

### Deploy on Vercel (Serverless)

> **Note**: Vercel runs serverless functions. This app works best on platforms with persistent servers (Render, Railway, Replit, VPS). For Vercel, you may need to adapt the session store.

---

### Deploy on a VPS (Ubuntu/Debian)

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Create database
sudo -u postgres createdb bilyabits

# Clone and setup
git clone https://github.com/carljohnvillavito/bilyabits-rapi.git
cd bilyabits-rapi
npm install
cp .env.example .env
nano .env  # Edit your configuration

# Start with PM2 (recommended for production)
npm install -g pm2
pm2 start server.js --name bilyabits-rapi
pm2 save
pm2 startup
```

---

### Deploy on Hostinger VPS

1. SSH into your Hostinger VPS
2. Follow the VPS instructions above
3. Set up a reverse proxy with Nginx:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

4. Enable SSL with Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `5000` | Server port |
| `NODE_ENV` | No | — | Set to `production` for secure cookies |
| `BASE_URL` | No | Auto-detected | Public URL of your app (used in generated API URLs) |
| `DB_TYPE` | No | `postgresql` | Database type (`postgresql`, `mongodb`*, `supabase`*) |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `DB_SSL` | No | Auto-detected | Set to `true` for cloud-hosted PostgreSQL |
| `SESSION_SECRET` | Yes | Random | Secret for session encryption |
| `ADMIN_USERNAME` | No | `admin` | Admin panel login username |
| `ADMIN_PASSWORD` | No | `admin123` | Admin panel login password |

> *MongoDB and Supabase support is planned for future releases.

---

## Project Structure

```
bilyabits-rapi/
├── commands/               # API command modules (auto-loaded)
│   ├── glm.js              # AI Chat (OpenRouter)
│   ├── smsbomber.js        # Multi-provider SMS tool
│   └── test-api.js         # Test/example API
├── handlers/               # Core application logic
│   ├── apiLoader.js        # Command loader & registry
│   ├── apiRouter.js        # Dynamic route builder
│   ├── auth.js             # Authentication helpers
│   └── database.js         # Database connection & schema
├── views/
│   ├── pages/              # EJS page templates
│   │   ├── landing.ejs     # Home/landing page
│   │   ├── login.ejs       # Login page
│   │   ├── register.ejs    # Registration page
│   │   ├── dashboard.ejs   # User dashboard + API tester
│   │   ├── admin.ejs       # Admin panel
│   │   ├── admin-login.ejs # Admin login
│   │   └── 404.ejs         # Error page
│   └── partials/           # Shared EJS components
│       ├── head.ejs        # HTML head + TailwindCSS config
│       ├── header.ejs      # Navigation + notification panel
│       └── footer.ejs      # Footer + notification scripts
├── public/                 # Static files (CSS, JS, images)
├── server.js               # Express server entry point
├── config.json             # App configuration (colors, socials)
├── .env.example            # Environment variable template
├── package.json            # Dependencies and scripts
└── README.md               # This file
```

---

## Adding API Commands

Create a new `.js` file in the `/commands/` directory. It will be automatically loaded on server start.

### Template

```js
const { importAsset } = require("../handlers/apiLoader");
const axios = require("axios");

const api = {
  name: "My API Tool",                    // Display name
  description: "What this tool does",     // Shown in dashboard
  route: "/my-tool",                      // URL path (under category)
  params: {
    "query=": { type: "string", required: true },
    "limit=": { type: "int", required: false },
  },
  category: "Tools",                      // Category grouping
  "api-key": true,                        // Require API key? (true/false)
};

importAsset(api, async (params) => {
  const query = params.query;
  if (!query) {
    throw new Error('Parameter "query" is required');
  }

  // Your logic here
  // Use axios for HTTP requests

  return {
    result: "your data here",
  };
});
```

### Parameter Types

| Type | Description |
|------|-------------|
| `string` | Text input |
| `int` | Integer number |

### Key Notes

- **Route**: Automatically prefixed with the category (e.g., category `AI` + route `/chat` = `/ai/chat`)
- **API Keys**: When `api-key: true`, users must pass `?apikey=their-key` in the request
- **Required/Optional**: Parameters with `required: true` show a red badge; `required: false` shows a gray badge
- **Keep API keys in command files**: Store third-party API keys directly in the command file, not in environment variables (project convention)

### Example: Simple Text API

```js
const { importAsset } = require("../handlers/apiLoader");

const api = {
  name: "Reverse Text",
  description: "Reverses any text input",
  route: "/reverse",
  params: {
    "text=": { type: "string", required: true },
  },
  category: "Tools",
  "api-key": false,
};

importAsset(api, async (params) => {
  if (!params.text) throw new Error("Parameter 'text' is required");
  return {
    original: params.text,
    reversed: params.text.split("").reverse().join(""),
  };
});
```

---

## Routes

### Public Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | Landing page |
| GET | `/login` | Login page |
| POST | `/login` | Login handler |
| GET | `/register` | Registration page |
| POST | `/register` | Registration handler |
| GET | `/logout` | Logout |

### User Routes (Auth Required)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/user/:username` | User dashboard |
| POST | `/user/:username/regenerate-key` | Regenerate API key |
| GET | `/api/user/stats` | Get user stats (JSON) |
| GET | `/api/notifications` | Get notifications (JSON) |
| POST | `/api/notifications/:id/read` | Mark notification as read |
| POST | `/api/notifications/read-all` | Mark all as read |

### Admin Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/korekong/admin/login` | Admin login page |
| POST | `/korekong/admin/login` | Admin login handler |
| GET | `/korekong/admin` | Admin panel |
| POST | `/api/admin/notify` | Send notification |

### API Routes (Dynamic)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/:category/:route` | Dynamic API endpoints |
| GET | `/api/ping` | Health check |

---

## Database Schema

The app automatically creates these tables on first run:

### `users`
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Auto-increment ID |
| username | VARCHAR(50) | Unique username |
| email | VARCHAR(255) | Unique email |
| password | VARCHAR(255) | Bcrypt hashed password |
| api_key | VARCHAR(100) | Unique API key |
| api_calls | INTEGER | Total API calls count |
| created_at | TIMESTAMP | Registration date |
| last_login | TIMESTAMP | Last login date |

### `notifications`
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Auto-increment ID |
| sender | VARCHAR(50) | Sender name (default: Admin) |
| target_user_id | INTEGER FK | Specific user target (nullable) |
| target_all | BOOLEAN | Broadcast to all users |
| title | VARCHAR(255) | Notification title |
| message | TEXT | Notification body |
| created_at | TIMESTAMP | Send date |

### `notification_reads`
Tracks which notifications each user has read.

### `api_calls_log`
Logs every API call with user, route, status code, and response time.

### `session`
Express session storage (managed by connect-pg-simple).

---

## Notification System

### For Admins
- Go to `/korekong/admin` and use the notification sender
- Choose **All Users** or a specific user
- Messages support basic formatting: `**bold**`, `*italic*`, `` `code` ``, and URLs auto-link

### For Users
- Notifications appear in the bell icon (top-right)
- Unread count shown as a red badge
- Click any notification to open a full modal preview
- Closing the modal automatically marks it as read
- "Mark all read" button available

---

## Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Deep Green | `#114232` | Primary / backgrounds |
| Lime Green | `#87A922` | Secondary / accents |
| Yellow | `#FCDC2A` | Accent / highlights |
| Light Yellow | `#F7F6BB` | Light text / subtle elements |

---

## Security

- Passwords hashed with **bcryptjs** (10 rounds)
- Session cookies: `httpOnly`, `sameSite: lax`, `secure` in production
- **Helmet** security headers
- **Rate limiting**: 20 auth attempts / 15 min, 60 API calls / min
- CSRF-safe session cookies
- Admin credentials in environment variables (never in code)
- `trust proxy` enabled for reverse proxy deployments

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

### Adding New API Commands

The easiest way to contribute is by adding new API commands. Just create a new file in `/commands/` following the template above.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>Built with ❤️ by <a href="https://github.com/carljohnvillavito">Carl John Villavito</a></strong>
</p>
