# HelpDesk

On-demand home-services platform for Sri Lanka. Customers book verified plumbers, electricians, AC technicians and other tradespeople; providers accept and complete jobs; admins verify providers and resolve complaints. All prices are in LKR.

This repo runs the **customer app, provider app and admin dashboard in one simulator**: the two mobile apps appear as phones side by side (Dual View), backed by a single Express server and a JSON-file database, with live sync between them.

## Quick start

Requirements: Node.js 20.19+ (22 or 24 recommended).

```bash
npm install
cp .env.example .env      # optional: add GEMINI_API_KEY for AI triage
npm run dev
```

Open http://localhost:3000. The API is at http://localhost:3000/api (try `/api/health`).

With [Bun](https://bun.sh) instead: `bun install` then `bun run dev`.

### Demo accounts

Password for every customer/provider: `password123`

| App      | Account                                    | Situation                         |
| -------- | ------------------------------------------ | --------------------------------- |
| Customer | nimal@example.com                          | Has an accepted AC booking        |
| Customer | shanika@example.com                        | Waiting for an electrician        |
| Provider | ruwan@example.com (AC & appliances)        | Has Nimal's job                   |
| Provider | sunil@example.com (electrical)             | Shanika's job is on his radar     |
| Provider | kamal@example.com (plumbing)               | —                                 |
| Provider | priya@example.com (cleaning, gardening)    | —                                 |
| Provider | dinesh@example.com (carpentry, painting)   | Awaiting admin verification       |
| Admin    | admin@helpdesk.lk / `admin123`             | —                                 |

The welcome screens have one-tap buttons for these.

### Try the whole flow

1. **Dual View** → customer: log in as Shanika → describe a problem ("my socket is sparking") → book.
2. Provider: log in as Sunil → the job appears on the radar instantly → accept.
3. Provider: *Start journey* (the customer's map shows them moving) → *Start work* → send a quote.
4. Customer: approve the quote. Provider: *Job done – send invoice*. Customer: confirm and review.
5. **Admin Dashboard**: see stats, approve Dinesh, resolve complaints, edit pricing.

## Scripts

| Command             | What it does                                                          |
| ------------------- | --------------------------------------------------------------------- |
| `npm run dev`       | Server + Vite (hot reload) on port 3000                               |
| `npm run build`     | Builds the web app into `dist/`                                       |
| `npm start`         | Production server (serves `dist/` and the API)                        |
| `npm run typecheck` | TypeScript check of the app and server                                |
| `npm run test:e2e`  | Full booking flow against the API on a throwaway database (`test-e2e.js`) |
| `npm run db:reset`  | Rewrites `data/helpdesk-db.json` with fresh demo data (restart the server after) |

Admins can also reset the demo data from the dashboard sidebar.

## Configuration (`.env`)

| Variable         | Default                   | Purpose                                                                 |
| ---------------- | ------------------------- | ----------------------------------------------------------------------- |
| `PORT`           | `3000`                    | Server port                                                             |
| `AUTH_SECRET`    | dev value                 | Signs login tokens. **Set a long random value outside local dev.**      |
| `GEMINI_API_KEY` | empty                     | Enables Gemini for AI triage. Without it a keyword classifier is used.  |
| `GEMINI_MODEL`   | `gemini-2.5-flash`        | Gemini model                                                            |
| `DB_FILE`        | `data/helpdesk-db.json`   | Path of the JSON database                                               |

The Gemini key is only ever read by the server.

## Project layout

See [docs/PROJECT_FILES.md](docs/PROJECT_FILES.md) for every file, [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how it fits together and [docs/API_SPEC.md](docs/API_SPEC.md) for the REST API.

```
server.ts                 Express entry: /api + Vite (dev) or dist/ (prod)
src/server/               routes.ts (API), db.ts (JSON database + seed), ai.ts (Gemini triage)
src/components/           customer/, provider/, admin/, sync/ (Dual View), mobile/ (phone frame), common/
src/context/AuthContext   per-app login state
src/services/api.ts       typed API client + live-update hooks
src/types/index.ts        types shared by server and browser
data/helpdesk-db.json     the database (committed with demo data)
database/                 PostgreSQL migration + seeder for moving off the JSON file
legacy/                   earlier versions of the project, for reference only
```

## Notes

- `data/helpdesk-db.json` changes as you use the app. Run `npm run db:reset` (or `git checkout data/`) before committing if you don't want to commit demo activity.
- The JSON database suits a demo or prototype on one server. For production, move to PostgreSQL using `database/` (see ARCHITECTURE.md).
