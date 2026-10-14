# HelpDesk

On-demand home-services platform for Sri Lanka. Customers book verified plumbers, electricians, AC technicians and other tradespeople; providers accept and complete jobs; admins verify providers and resolve complaints.

Three apps share one backend:

| Folder                 | App                                                               |
| ---------------------- | ----------------------------------------------------------------- |
| `apps/customer-mobile` | Customer mobile app (Expo, React Native, Expo Router)             |
| `apps/provider-mobile` | Provider / technician mobile app (Expo, Expo Router)              |
| `apps/admin-web`       | Admin web dashboard (React, Vite, Tailwind, react-router)         |
| `backend`              | REST API (Express, TypeScript, Sequelize/PostgreSQL, JWT, Gemini) |
| `packages/shared`      | Shared types, constants and API client used by all apps           |
| `e2e`                  | End-to-end tests (Playwright)                                     |

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how it fits together and [docs/TEAM.md](docs/TEAM.md) for who owns what.

> **Status:** scaffold only. Screens are placeholders and API routes return `501 Not Implemented`.

## Requirements

- Node.js **22.12+** (24 recommended) and npm 10+
- PostgreSQL 15+ for the backend
- [Expo Go](https://expo.dev/go) on your phone (SDK 57), or an Android emulator / iOS simulator

## Install

```bash
npm install          # installs every workspace and builds packages/shared
```

Then create the env files from the examples:

```bash
cp backend/.env.example backend/.env
cp apps/admin-web/.env.example apps/admin-web/.env
cp apps/customer-mobile/.env.example apps/customer-mobile/.env
cp apps/provider-mobile/.env.example apps/provider-mobile/.env
```

## Run

| Command                | What it does                                                      |
| ---------------------- | ----------------------------------------------------------------- |
| `npm run dev:backend`  | API on http://localhost:4000/api (try `/api/health`)              |
| `npm run dev:admin`    | Admin web on http://localhost:5173                                |
| `npm run dev:customer` | Expo dev server for the customer app (scan the QR with Expo Go)   |
| `npm run dev:provider` | Expo dev server for the provider app                              |
| `npm run dev:shared`   | Rebuilds `packages/shared` on every change (run while editing it) |

### Backend

1. Create a database: `createdb helpdesk`
2. Set `DATABASE_URL` and `JWT_SECRET` in `backend/.env` (and `GEMINI_API_KEY` for the AI features)
3. `npm run db:migrate` then `npm run db:seed`
4. `npm run dev:backend`

The API starts even if the database is unreachable (it logs a warning), so `/api/health` always works.

### Mobile apps and `EXPO_PUBLIC_API_URL`

The mobile apps call the backend through **`EXPO_PUBLIC_API_URL`** in their `.env`. `localhost` on a phone means the phone, not your computer, so use:

| Where the app runs   | `EXPO_PUBLIC_API_URL`                                                         |
| -------------------- | ----------------------------------------------------------------------------- |
| Real phone (Expo Go) | `http://<your-computer-LAN-IP>:4000/api`, e.g. `http://192.168.1.10:4000/api` |
| Android emulator     | `http://10.0.2.2:4000/api`                                                    |
| iOS simulator        | `http://localhost:4000/api`                                                   |

Phone and computer must be on the same Wi-Fi, and Windows Firewall must allow Node on port 4000. Restart Expo after changing `.env`.

### Admin web

Reads `VITE_API_URL` from `apps/admin-web/.env` (default `http://localhost:4000/api`).

## Other scripts

| Command              | What it does                                          |
| -------------------- | ----------------------------------------------------- |
| `npm run build`      | Builds `packages/shared`, `backend` and `admin-web`   |
| `npm run typecheck`  | Type-checks every workspace                           |
| `npm run lint`       | ESLint across the repo                                |
| `npm run format`     | Prettier on the whole repo                            |
| `npm run db:migrate` | Runs backend migrations                               |
| `npm run db:seed`    | Runs backend seeders (demo data)                      |
| `npm run test:e2e`   | Playwright end-to-end tests (backend must be running) |

## Working together

Read [docs/TEAM.md](docs/TEAM.md) before you start. In short: edit only files you own, shared types/API client changes go through Member 3, database changes go through Member 4, and each member works on their own branch and merges by pull request.
