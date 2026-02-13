# BILYABITS-RAPI

## Overview
Open-source REST API platform built with Node.js, Express, EJS, and TailwindCSS. Uses PostgreSQL for user authentication, API key storage, and call tracking.

## Recent Changes
- 2026-02-13: Added notification system (admin can message all/specific users, realtime polling)
- 2026-02-13: Converted mobile burger menu to left side drawer
- 2026-02-13: Fixed API call counting and added skeleton loading
- 2026-02-13: Initial build - full platform with auth, dashboard, admin panel, API command system

## Project Architecture

### Tech Stack
- **Backend**: Node.js + Express
- **Templates**: EJS with TailwindCSS (CDN)
- **Database**: PostgreSQL (Replit built-in)
- **Auth**: bcryptjs + express-session with PgSession store
- **Security**: helmet, rate limiting, CSRF-safe session cookies

### Folder Structure
```
/commands         - API tool command files (modular, auto-loaded)
/handlers         - Core logic (database, auth, API loader/router)
/views/pages      - EJS page templates
/views/partials   - Shared EJS components (head, header, footer)
/public           - Static assets
server.js         - Main Express server
config.json       - App configuration (colors, socials, version)
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
- `config.json` - App settings, colors, socials
- Environment variables: DATABASE_URL, SESSION_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD

## User Preferences
- Mobile-first responsive design
- Color palette: #114232, #87A922, #FCDC2A, #F7F6BB
