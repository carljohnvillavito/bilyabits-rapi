# BILYABITS-RAPI

## Overview
Open-source REST API platform built with Node.js, Express, EJS, and TailwindCSS. Supports multiple database types (PostgreSQL, MongoDB, Supabase) for user authentication, API key storage, and call tracking. Compatible with any hosting provider.

## Recent Changes
- 2026-02-14: Added API key rate limiting (200/day, 12h cooldown) with dashboard status display
- 2026-02-14: Enhanced admin users table with card layout (email, password hash, date, daily usage, rate limit status)
- 2026-02-14: Added notification modal popup with read/unread tracking and message formatting
- 2026-02-14: Fixed API tester URL to use correct public domain (BASE_URL / x-forwarded-host)
- 2026-02-14: Made project compatible with any hosting provider (PORT, DB_SSL, proxy support)
- 2026-02-14: Created comprehensive README.md with deployment guides and one-click buttons
- 2026-02-14: Added SMS Bomber API command with 5 providers
- 2026-02-13: Added auto-generated URL in API tester with copy feature
- 2026-02-13: Added multi-database support (DB_TYPE env var), .env.example, moved admin creds to env vars
- 2026-02-13: Added GLM AI Chat command with drawer auto-select feature
- 2026-02-13: Added notification system (admin can message all/specific users, realtime polling)
- 2026-02-13: Converted mobile burger menu to left side drawer
- 2026-02-13: Fixed API call counting and added skeleton loading
- 2026-02-13: Initial build - full platform with auth, dashboard, admin panel, API command system

## Project Architecture

### Tech Stack
- **Backend**: Node.js + Express
- **Templates**: EJS with TailwindCSS (CDN)
- **Database**: PostgreSQL (default), with support structure for MongoDB and Supabase
- **Auth**: bcryptjs + express-session with PgSession store
- **Security**: helmet, rate limiting, CSRF-safe session cookies
- **HTTP Client**: axios (for API tool commands)

### Folder Structure
```
/commands         - API tool command files (modular, auto-loaded)
/handlers         - Core logic (database, auth, API loader/router)
/views/pages      - EJS page templates
/views/partials   - Shared EJS components (head, header, footer)
/public           - Static assets
server.js         - Main Express server
config.json       - App configuration (colors, socials, version)
.env.example      - Environment variable template
README.md         - Comprehensive project documentation
```

### Key Routes
- `/` - Landing page (SaaS MVP)
- `/login`, `/register` - User auth
- `/user/:username` - User dashboard with API tester
- `/korekong/admin/login` - Admin login
- `/korekong/admin` - Admin panel (with notification sender)
- `/:category/:route` - Dynamic API endpoints
- `/api/notifications` - User notifications (GET)
- `/api/admin/notify` - Send notification (POST, admin only)

### Adding New API Commands
Create a `.js` file in `/commands/` with the `importAsset` pattern:
```js
const { importAsset } = require('../handlers/apiLoader');
const api = { name, description, route, params, category, 'api-key': true/false };
importAsset(api, async (params) => { return result; });
```

### Config
- `config.json` - App settings, colors, socials (no credentials)
- Environment variables: PORT, BASE_URL, DB_TYPE, DATABASE_URL, DB_SSL, SESSION_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD
- See `.env.example` for all supported variables

### Database Support
- `DB_TYPE=postgresql` (default) - Uses built-in Replit PostgreSQL
- `DB_TYPE=mongodb` - Requires MONGODB_URI (structure ready, implementation pending)
- `DB_TYPE=supabase` - Requires SUPABASE_URL + SUPABASE_KEY (structure ready, implementation pending)
- `DB_SSL=true` - Enable for cloud-hosted PostgreSQL (auto-detected for Render/Neon)

### Hosting Compatibility
- Server respects `PORT` env var (defaults to 5000)
- `BASE_URL` env var controls generated API URLs
- Auto-detects domain from `x-forwarded-host` / `x-forwarded-proto` headers
- `trust proxy` enabled for reverse proxy deployments
- Session `proxy: true` for HTTPS behind load balancers
- SSL auto-detection for cloud PostgreSQL providers

## User Preferences
- Mobile-first responsive design
- Color palette: #114232, #87A922, #FCDC2A, #F7F6BB
- API tool keys: Keep API keys directly inside command files (not in env secrets)
- Notifications: Must work for both existing and newly created accounts, with modal preview
- Admin credentials: Store in environment variables, not in config files
