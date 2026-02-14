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

<h2>Demo Site: https://bilyabits-rapi.onrender.com</h2>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-deployment">Deployment</a> •
  <a href="#-adding-api-commands">Adding APIs</a> •
  <a href="#-environment-variables">Configuration</a> •
  <a href="#-project-structure">Structure</a> •
  <a href="#-faq">FAQ</a>
</p>

---

## Features

### Core Platform
- **Modular API Command System** — Drop a `.js` file into `/commands/` and it auto-loads as a new API endpoint on server start. No router edits needed.
- **User Authentication** — Secure registration and login with bcrypt password hashing, session management, and persistent login state.
- **API Key Management** — Every registered user receives a unique API key. Keys can be regenerated at any time from the dashboard.
- **Password-Protected API Key Viewing** — API keys are blurred by default on the dashboard. Users must re-enter their password to reveal the key, preventing shoulder-surfing.

### Rate Limiting & Usage Tracking
- **Daily API Rate Limiting** — Each API key is limited to **200 requests per day** for key-required endpoints. When the limit is reached, a **12-hour cooldown** period is enforced before the key can be used again.
- **API Call Tracking** — Every API call is logged with the user, route, status code, and response time. Total and daily call counts are tracked per user.
- **Real-Time Usage Dashboard** — The user dashboard displays current daily usage (e.g., "42/200 today"), total lifetime API calls, and a warning banner when rate-limited. Stats auto-refresh every 5 seconds.

### Dashboard & API Tester
- **Built-in API Tester** — Select any loaded API command from a dropdown, fill in parameters, and test it directly from the dashboard. Results display in a formatted JSON viewer.
- **Auto-Generated Copyable URLs** — The API tester automatically builds the full request URL (using the correct public domain) with all parameters filled in. One-click copy to clipboard.
- **Skeleton Loading** — Dashboard elements show animated skeleton placeholders while data loads, providing a polished user experience.
- **Latency Monitor** — Real-time server latency displayed on the dashboard, measured via ping endpoint.

### Admin Panel
- **Full Admin Dashboard** — Accessible at `/korekong/admin` with separate admin login. Displays total users, API calls, active/dead API counts, and real-time stats.
- **Enhanced User Management** — Card-based user list showing username, email, blurred password hash (toggle to reveal), account creation date/time, total API calls, daily usage out of 200, and a "Rate Limited" badge when applicable.
- **Notification Sender** — Send messages to all users or target a specific user by username. Messages support rich formatting.

### Notification System
- **Real-Time Notifications** — Users receive notifications via a bell icon with unread count badge. Notifications poll the server every 3 seconds for real-time delivery.
- **Modal Preview** — Click any notification to open a full modal with formatted content. Closing the modal automatically marks it as read.
- **Rich Formatting** — Notification messages support `**bold**`, `*italic*`, `` `code` ``, and URLs are automatically converted to clickable links.
- **Broadcast & Targeted** — Admin can send to all users (including future accounts) or to a specific user.

### Design & Compatibility
- **Mobile-First Responsive Design** — Fully responsive UI with side drawer navigation on mobile, optimized for all screen sizes.
- **Multi-Host Compatible** — Deploy on Replit, Render, Railway, Vercel, Hostinger, VPS, or any Node.js hosting provider.
- **Custom Color Palette** — Themed with a distinctive green-yellow palette: Deep Green `#114232`, Lime Green `#87A922`, Yellow `#FCDC2A`, Light Yellow `#F7F6BB`.

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express 5.x |
| Templates | EJS + TailwindCSS (CDN) |
| Database | PostgreSQL (default) |
| Auth | bcryptjs + express-session |
| Session Store | connect-pg-simple |
| HTTP Client | axios |
| Security | helmet, express-rate-limit, CORS |

---

## Quick Start

### Prerequisites

- **Node.js** 18 or higher
- **PostgreSQL** database (local or cloud-hosted)
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

The server starts at `http://localhost:5000`. The database tables are created automatically on first run — no manual migration needed.

### 5. Access the Platform

- **Landing Page**: `http://localhost:5000`
- **Register**: `http://localhost:5000/register`
- **Login**: `http://localhost:5000/login`
- **Admin Panel**: `http://localhost:5000/korekong/admin/login`
  - Default credentials: whatever you set in `ADMIN_USERNAME` and `ADMIN_PASSWORD` (defaults to `admin` / `admin123` if not set)

---

## Deployment

### Deploy on Replit

1. Fork or import this repository on [Replit](https://replit.com)
2. Replit automatically provides a PostgreSQL database via `DATABASE_URL`
3. Set your secrets in the Secrets tab: `SESSION_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`
4. Click **Run** — the app starts automatically on port 5000

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

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Auto-provided by Render when you link the DB |
| `DB_SSL` | `true` (required for Render PostgreSQL) |
| `SESSION_SECRET` | A random string (e.g., generate with `openssl rand -hex 32`) |
| `ADMIN_USERNAME` | Your admin username |
| `ADMIN_PASSWORD` | Your admin password |
| `BASE_URL` | Your Render app URL (e.g., `https://myapp.onrender.com`) |
| `NODE_ENV` | `production` |

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/carljohnvillavito/bilyabits-rapi)

---

### Deploy on Railway

1. Create a new project on [Railway](https://railway.app)
2. Add a **PostgreSQL** plugin
3. Deploy from GitHub
4. Set environment variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Auto-provided by Railway |
| `DB_SSL` | `true` |
| `SESSION_SECRET` | A random string |
| `ADMIN_USERNAME` | Your admin username |
| `ADMIN_PASSWORD` | Your admin password |
| `BASE_URL` | Your Railway app URL |
| `NODE_ENV` | `production` |

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template?referralCode=bilyabits)

---

### Deploy with Supabase Database

You can use [Supabase](https://supabase.com) as your database on any hosting provider (Render, Railway, VPS, etc.). Supabase provides a free PostgreSQL database.

**Setup Steps:**

1. Create a free project on [Supabase](https://supabase.com)
2. Go to **Project Settings > Database**
3. Copy the **Connection string (URI)** — this is your `DATABASE_URL`
4. On your hosting provider, set these environment variables:

| Variable | Value |
|----------|-------|
| `DB_TYPE` | `supabase` |
| `DATABASE_URL` | Your Supabase connection string (copied in step 3) |
| `SESSION_SECRET` | A random string |
| `ADMIN_USERNAME` | Your admin username |
| `ADMIN_PASSWORD` | Your admin password |
| `BASE_URL` | Your app's public URL |
| `NODE_ENV` | `production` |

> **Example Supabase connection string:**
> `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

**Example: Render + Supabase**

1. Create a Web Service on Render, connect your GitHub repo
2. Build Command: `npm install` | Start Command: `npm start`
3. Create a Supabase project, copy the connection string
4. Add the environment variables above to Render
5. Deploy — tables are created automatically on first start

---

### Deploy on Vercel (Serverless)

> **Note**: Vercel runs serverless functions without persistent processes. This app works best on platforms with persistent servers (Render, Railway, Replit, VPS). For Vercel, you may need to adapt the session store to use a stateless approach (e.g., JWT) or an external Redis session store.

---

### Deploy on a VPS (Ubuntu/Debian)

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql -c "CREATE USER bilyabits WITH PASSWORD 'your-db-password';"
sudo -u postgres psql -c "CREATE DATABASE bilyabits OWNER bilyabits;"

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
2. Follow the VPS instructions above to install Node.js, PostgreSQL, and the app
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
| `PORT` | No | `5000` | Port the server listens on |
| `NODE_ENV` | No | — | Set to `production` for secure cookies and HTTPS |
| `BASE_URL` | No | Auto-detected | Public URL of your app (used in generated API URLs). If not set, detected from request headers. |
| `DB_TYPE` | No | `postgresql` | Database type: `postgresql`, `supabase`, or `mongodb` |
| `DATABASE_URL` | Yes* | — | PostgreSQL connection string (e.g., `postgresql://user:pass@host:5432/dbname`) |
| `MONGODB_URI` | Yes* | — | MongoDB connection string (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/dbname`) |
| `DB_SSL` | No | Auto-detected | Set to `true` for cloud-hosted PostgreSQL (Render, Neon, Supabase). Auto-detected for known cloud providers. |
| `SESSION_SECRET` | Yes | Random | Secret key for encrypting session cookies. Use a long random string in production. |
| `ADMIN_USERNAME` | No | `admin` | Username for the admin panel login |
| `ADMIN_PASSWORD` | No | `admin123` | Password for the admin panel login |

> *`DATABASE_URL` is required for PostgreSQL/Supabase. `MONGODB_URI` is required for MongoDB.

### Supabase Configuration

When using `DB_TYPE=supabase`, set `DATABASE_URL` to your Supabase PostgreSQL connection string:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Your Supabase PostgreSQL connection string. Find it in: Supabase Dashboard > Project Settings > Database > Connection string (URI). |

> **Format**: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`
>
> Supabase is PostgreSQL under the hood. By connecting directly to the database, you get full SQL support, automatic table creation, and persistent sessions — exactly like using regular PostgreSQL.
>
> **Note**: `SUPABASE_URL` and `SUPABASE_KEY` alone are not sufficient. This app requires the PostgreSQL connection string (`DATABASE_URL`) for direct database access.

### MongoDB Configuration

When using `DB_TYPE=mongodb`, set `MONGODB_URI` to your MongoDB connection string:

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | Your MongoDB connection string. For MongoDB Atlas: `mongodb+srv://user:password@cluster.mongodb.net/dbname`. For local MongoDB: `mongodb://localhost:27017/bilyabits_rapi`. |

> MongoDB is fully supported with automatic collection creation, indexes, and persistent sessions via `connect-mongo`. All features work identically to the PostgreSQL version — user auth, API key management, rate limiting, notifications, and admin panel.
>
> **Getting a free MongoDB Atlas cluster:**
> 1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free account
> 2. Create a free shared cluster (M0)
> 3. Set up a database user with a password
> 4. Add your server IP to the network access list (or use `0.0.0.0/0` for all IPs)
> 5. Click "Connect" > "Connect your application" > Copy the connection string
> 6. Replace `<password>` with your database user's password in the connection string

---

## Project Structure

```
bilyabits-rapi/
├── commands/               # API command modules (auto-loaded on start)
│   ├── glm.js              # AI Chat (OpenRouter GLM Pony Alpha)
│   ├── smsbomber.js        # Multi-provider SMS tool (5 providers)
│   └── test-api.js         # Test/example API (no key required)
├── handlers/               # Core application logic
│   ├── apiLoader.js        # Command loader & registry
│   ├── apiRouter.js        # Dynamic route builder + rate limit enforcement
│   ├── auth.js             # Authentication helpers (register, login, sessions)
│   └── database.js         # Database connection, schema, & auto-migration
├── views/
│   ├── pages/              # EJS page templates
│   │   ├── landing.ejs     # Home/landing page (SaaS-style MVP)
│   │   ├── login.ejs       # Login page
│   │   ├── register.ejs    # Registration page
│   │   ├── dashboard.ejs   # User dashboard + API tester + stats
│   │   ├── admin.ejs       # Admin panel (users, stats, notifications)
│   │   ├── admin-login.ejs # Admin login page
│   │   └── 404.ejs         # Error/not found page
│   └── partials/           # Shared EJS components
│       ├── head.ejs        # HTML head + TailwindCSS config + color palette
│       ├── header.ejs      # Navigation bar + notification bell + drawer
│       └── footer.ejs      # Footer + notification polling scripts
├── public/                 # Static files (CSS, JS, images)
├── server.js               # Express server entry point
├── config.json             # App configuration (colors, socials, version)
├── .env.example            # Environment variable template
├── package.json            # Dependencies and scripts
└── README.md               # This file
```

---

## Adding API Commands

Create a new `.js` file in the `/commands/` directory. It will be automatically loaded when the server starts — no need to edit any router files.

### Template

```js
const { importAsset } = require("../handlers/apiLoader");
const axios = require("axios");

const api = {
  name: "My API Tool",
  description: "A brief description of what this tool does",
  route: "/my-tool",
  params: {
    "query=": { type: "string", required: true },
    "limit=": { type: "int", required: false },
  },
  category: "Tools",
  "api-key": true,
};

importAsset(api, async (params) => {
  const query = params.query;
  if (!query) {
    throw new Error('Parameter "query" is required');
  }

  // Your logic here — use axios for external HTTP requests
  const response = await axios.get(`https://some-api.com/data?q=${query}`);

  return {
    result: response.data,
  };
});
```

### How It Works

1. **File placed in `/commands/`** — The server scans this folder on startup and loads every `.js` file.
2. **`importAsset(api, handler)`** — Registers the API definition and its handler function into the platform.
3. **Route is auto-generated** — The `category` and `route` are combined. For example, category `AI` + route `/chat` creates the endpoint `/ai/chat`.
4. **Parameters are auto-parsed** — Query parameters matching `params` keys are extracted and passed to the handler.
5. **Appears in dashboard** — The API tool instantly shows up in every user's dashboard API tester dropdown.

### Parameter Types

| Type | Description | Example |
|------|-------------|---------|
| `string` | Text input | `?query=hello+world` |
| `int` | Integer number | `?limit=10` |

### API Key Requirement

| Setting | Behavior |
|---------|----------|
| `"api-key": true` | Users must include `?apikey=their-key` in the request. Calls count toward the 200/day rate limit. |
| `"api-key": false` | Endpoint is publicly accessible without authentication. No rate limiting applied. |

### Convention: Third-Party API Keys

Store third-party API keys (OpenRouter, RapidAPI, etc.) directly inside the command file as constants — not in environment variables. This keeps each command self-contained and portable.

```js
const API_KEY = "sk-your-third-party-key-here";
```

### Example: Simple Text API (No Key Required)

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

### Included API Commands

| Command | Category | Key Required | Description |
|---------|----------|--------------|-------------|
| GLM Pony Alpha | AI | Yes | Chat with an AI assistant via OpenRouter. Supports system prompts and user IDs. |
| SMS Bomber | Tools | Yes | Multi-provider SMS tool with 5 OTP providers (Abenson, Palawan, Toktok, JRS, Transportify). |
| Test API | General | No | Simple test endpoint to verify the system is working. Returns a message and timestamp. |

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
| GET | `/logout` | Logout and destroy session |
| GET | `/api/ping` | Health check endpoint (returns `{ pong: true }`) |

### User Routes (Login Required)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/user/:username` | User dashboard with API tester and stats |
| POST | `/user/:username/regenerate-key` | Regenerate API key (old key is invalidated) |
| POST | `/api/user/verify-password` | Verify password to reveal blurred API key |
| GET | `/api/user/stats` | Get daily usage, rate limit status, and API call stats (JSON) |
| GET | `/api/notifications` | Get user's notifications with read status (JSON) |
| POST | `/api/notifications/:id/read` | Mark a specific notification as read |
| POST | `/api/notifications/read-all` | Mark all notifications as read |

### Admin Routes (Admin Login Required)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/korekong/admin/login` | Admin login page |
| POST | `/korekong/admin/login` | Admin login handler |
| GET | `/korekong/admin` | Admin panel (users, stats, notification sender) |
| GET | `/korekong/admin/logout` | Admin logout |
| GET | `/api/admin/stats` | Real-time admin stats (JSON, auto-refreshes) |
| POST | `/api/admin/notify` | Send notification to all users or a specific user |

### Dynamic API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/:category/:route` | Auto-generated from command files. Example: `/ai/glm?q=hello&apikey=xxx` |

---

## Database Schema

All tables are created automatically on first server start. No manual migration is needed.

### `users`

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL PK | Auto-incrementing user ID |
| `username` | VARCHAR(50) UNIQUE | Login username |
| `email` | VARCHAR(255) UNIQUE | User email address |
| `password` | VARCHAR(255) | Bcrypt-hashed password (10 rounds) |
| `api_key` | VARCHAR(100) UNIQUE | User's API key for authenticated endpoints |
| `api_calls` | INTEGER | Total lifetime API calls |
| `daily_api_calls` | INTEGER | API calls made today (resets every 24 hours) |
| `daily_reset_at` | TIMESTAMP | When the daily counter was last reset |
| `rate_limited_until` | TIMESTAMP | Cooldown expiry time (null if not rate-limited) |
| `created_at` | TIMESTAMP | Account creation date |
| `last_login` | TIMESTAMP | Most recent login date |

### `notifications`

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL PK | Notification ID |
| `sender` | VARCHAR(50) | Sender name (default: "Admin") |
| `target_user_id` | INTEGER FK | Specific target user (null for broadcasts) |
| `target_all` | BOOLEAN | `true` for broadcast to all users |
| `title` | VARCHAR(255) | Notification title |
| `message` | TEXT | Notification body (supports formatting) |
| `created_at` | TIMESTAMP | When the notification was sent |

### `notification_reads`

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL PK | Read record ID |
| `notification_id` | INTEGER FK | References `notifications.id` |
| `user_id` | INTEGER FK | The user who read it |
| `read_at` | TIMESTAMP | When it was marked as read |

### `api_calls_log`

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL PK | Log entry ID |
| `user_id` | INTEGER FK | The user who made the call (null for public endpoints) |
| `api_name` | VARCHAR(100) | Name of the API command called |
| `api_route` | VARCHAR(255) | Full route path |
| `status_code` | INTEGER | HTTP response status code (default: 200) |
| `response_time_ms` | INTEGER | Response time in milliseconds |
| `called_at` | TIMESTAMP | When the call was made |

### `session`

Managed automatically by `connect-pg-simple`. Stores Express session data for persistent login state.

---

## Rate Limiting

### API Key Rate Limiting

| Setting | Value |
|---------|-------|
| Daily limit per key | **200 requests/day** |
| Cooldown when limit hit | **12 hours** |
| Applies to | Endpoints with `"api-key": true` only |
| Counter reset | Automatically after 24 hours or after cooldown expires |

**How it works:**
1. Each API key starts with 0/200 daily calls.
2. Every successful call to a key-required endpoint increments the counter.
3. When 200 calls are reached, the key enters a 12-hour cooldown period.
4. During cooldown, all key-required API calls return a `429 Too Many Requests` error with the cooldown expiry time.
5. After the cooldown expires, the counter resets and the key is usable again.
6. If 24 hours pass without hitting the limit, the counter resets normally.

### Server-Level Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Login / Register | 20 attempts | 15 minutes |
| General API calls | 60 requests | 1 minute |

---

## Notification System

### For Admins

1. Log in to the admin panel at `/korekong/admin`
2. Scroll to the **Send Notification** section
3. Choose a target: **All Users** or enter a specific username
4. Write a title and message body
5. Click **Send Notification**

Messages support rich formatting:

| Syntax | Renders As |
|--------|-----------|
| `**text**` | **Bold text** |
| `*text*` | *Italic text* |
| `` `code` `` | `Inline code` |
| `https://example.com` | Clickable link (auto-detected) |

### For Users

- A **bell icon** in the header shows unread notification count as a red badge.
- Click the bell to open the notification panel showing all recent notifications.
- Click any notification to open a **full modal preview** with formatted content.
- Closing the modal automatically marks that notification as read.
- Use **"Mark all read"** to clear the unread count.
- Notifications poll the server every 3 seconds for real-time delivery.
- Broadcast notifications (sent to "All Users") are visible to all accounts, including those created after the notification was sent.

---

## Security

| Feature | Implementation |
|---------|---------------|
| Password Hashing | bcryptjs with 10 salt rounds |
| Session Cookies | `httpOnly: true`, `sameSite: lax`, `secure: true` in production |
| Security Headers | Helmet.js (XSS protection, content sniffing prevention, etc.) |
| Auth Rate Limiting | 20 login/register attempts per 15 minutes |
| API Rate Limiting | 60 general requests per minute + 200/day per API key |
| API Key Protection | Keys are blurred on dashboard; password re-entry required to reveal |
| Admin Credentials | Stored in environment variables, never in source code |
| Proxy Support | `trust proxy` enabled for correct IP detection behind reverse proxies |
| SSL Auto-Detection | Automatically enables SSL for known cloud PostgreSQL providers |

---

## Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Deep Green | `#114232` | Primary backgrounds, header, footer |
| Lime Green | `#87A922` | Secondary color, accents, badges |
| Yellow | `#FCDC2A` | Highlights, active states, buttons |
| Light Yellow | `#F7F6BB` | Light text, subtle background elements |

---

## FAQ

### General

**Q: Do I need to set up the database tables manually?**
A: No. All tables are created automatically when the server starts for the first time. Just provide a valid `DATABASE_URL` and the app handles the rest.

**Q: What happens if I forget to set `SESSION_SECRET`?**
A: The app will generate a random session secret on startup. However, this means all user sessions will be invalidated every time the server restarts. Always set a fixed `SESSION_SECRET` in production.

**Q: Can I use this with MySQL or SQLite?**
A: PostgreSQL, Supabase, and MongoDB are all fully supported. Set `DB_TYPE` to `postgresql`, `supabase`, or `mongodb` and provide the corresponding connection string. MySQL and SQLite are not on the roadmap, but you could contribute an adapter by modifying `handlers/database.js`.

### Users & Authentication

**Q: How do I register a new account?**
A: Go to `/register`, fill in a username, email, and password. You'll be automatically logged in and redirected to your dashboard.

**Q: How do I see my API key?**
A: On your dashboard, the API key is blurred for security. Click the eye icon and enter your password to reveal it. The key will re-blur when you navigate away.

**Q: Can I regenerate my API key?**
A: Yes. On your dashboard, click the **Regenerate** button. Your old key will stop working immediately, and a new key will be issued.

**Q: What does "Rate Limited" mean?**
A: If you make more than 200 API calls in a single day using key-required endpoints, your key enters a 12-hour cooldown. During this time, all key-required API calls will return a `429` error. Your dashboard will show a warning banner with the exact time your key will be unlocked.

**Q: Does the rate limit affect all endpoints?**
A: No. Only endpoints that require an API key (`"api-key": true` in the command file) count toward your daily limit. Public endpoints (like `/general/test`) have no per-key limit.

### Admin Panel

**Q: How do I access the admin panel?**
A: Go to `/korekong/admin/login` and log in with the credentials set in your `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables. Default is `admin` / `admin123` if not configured.

**Q: Can I see user passwords?**
A: No. The admin panel shows password hashes (bcrypt), not plain-text passwords. These are blurred by default and can be toggled for inspection, but they cannot be reversed.

**Q: How do I send a notification to users?**
A: In the admin panel, use the notification sender form. Select "All Users" to broadcast or enter a specific username. Write a title and message, then click Send. The notification will appear for users within a few seconds.

**Q: Do new users see old broadcast notifications?**
A: Yes. Broadcast notifications (sent to "All Users") are visible to all accounts, including those created after the notification was sent.

### API Commands

**Q: How do I add a new API endpoint?**
A: Create a new `.js` file in the `/commands/` folder following the template in the [Adding API Commands](#-adding-api-commands) section. Restart the server, and it will be automatically loaded and available in the dashboard.

**Q: Where should I store third-party API keys?**
A: Store them directly in the command file as constants (e.g., `const API_KEY = "sk-xxx"`). This keeps each command self-contained and follows the project convention.

**Q: How do I make an endpoint public (no API key needed)?**
A: Set `"api-key": false` in your command's `api` object. The endpoint will be accessible without any authentication.

**Q: Can I have multiple endpoints in one command file?**
A: Each command file should define one endpoint with one `importAsset()` call. For multiple related endpoints, create separate files (e.g., `ai-chat.js`, `ai-translate.js`).

### Deployment & Hosting

**Q: How do I set up Supabase as my database?**
A: Set `DB_TYPE=supabase` and add your Supabase PostgreSQL connection string as `DATABASE_URL`. To find your connection string: go to your Supabase Dashboard > Project Settings > Database > Connection string (URI). The format looks like: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`. Tables are created automatically on first start, just like with regular PostgreSQL.

**Q: I set `SUPABASE_URL` and `SUPABASE_KEY` but the app won't start. Why?**
A: This app needs the Supabase PostgreSQL connection string, not the REST API credentials. Set `DATABASE_URL` to your Supabase PostgreSQL connection string instead. Find it in your Supabase Dashboard under Project Settings > Database > Connection string (URI). The `SUPABASE_URL` and `SUPABASE_KEY` are for client-side apps; this server-side app connects directly to the database for full SQL support.

**Q: Do I need to set `BASE_URL`?**
A: It's recommended for production. If not set, the app auto-detects the public URL from `x-forwarded-host` and `x-forwarded-proto` headers. However, some hosting providers may not send these headers correctly, so setting `BASE_URL` guarantees correct URL generation in the API tester.

**Q: Do I need `DB_SSL=true`?**
A: For cloud-hosted PostgreSQL (Render, Neon, Supabase, etc.), yes. The app auto-detects SSL for known providers, but you can explicitly set `DB_SSL=true` to be safe. For local PostgreSQL, leave it unset.

**Q: Can I run this on a free tier?**
A: Yes. The app runs well on Render's free tier, Railway's free tier, or Replit's free plan. Just note that free-tier servers on Render may spin down after inactivity.

**Q: How do I keep the server running on a VPS?**
A: Use PM2 (process manager): `pm2 start server.js --name bilyabits-rapi`. PM2 will auto-restart on crashes and can be configured to start on system boot with `pm2 startup`.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

### Ways to Contribute

- **Add new API commands** — The easiest way to contribute. Create a new file in `/commands/` following the template above.
- **Add database adapters** — Want MySQL or SQLite support? Add an adapter in `handlers/database.js` following the existing pattern.
- **Improve UI/UX** — Templates are in `/views/pages/` using EJS + TailwindCSS.
- **Add tests** — No test suite exists yet. Adding one would be a great contribution.
- **Documentation** — Improve this README, add code comments, or create a wiki.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>Built with &#10084; by <a href="https://github.com/carljohnvillavito">Carl John Villavito</a></strong>
</p>
