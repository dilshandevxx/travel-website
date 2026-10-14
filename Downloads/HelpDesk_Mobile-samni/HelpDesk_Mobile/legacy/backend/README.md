# Backend API

Node.js + Express.js REST API for the Customer App, Provider App and Admin Dashboard.
Owner: Member 3. Endpoint reference: [`docs/API_SPEC.md`](../docs/API_SPEC.md).

## Requirements

- Node.js 20+
- PostgreSQL 14+

## Setup

```bash
cd backend
npm install
cp .env.example .env          # then fill in DB_* and JWT_SECRET
```

Create the databases once (see [`database/README.md`](../database/README.md)), then:

```bash
npm run db:migrate            # create tables
npm run db:seed               # add the 9 service categories
npm run create-admin          # create the first admin from ADMIN_* in .env
npm run dev                   # start with auto-restart → http://localhost:5000/api
```

Check it's running: `GET http://localhost:5000/api/health`

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the server and restart on file changes |
| `npm start` | Start the server (production) |
| `npm test` | Run the API tests against `DB_TEST_NAME` (wipes that database) |
| `npm run db:migrate` | Apply new migrations |
| `npm run db:migrate:undo` | Roll back the last migration |
| `npm run db:seed` | Run seeders (safe to repeat) |
| `npm run create-admin` | Create an admin account |

## Folder Structure

```
backend/
├── server.js              # Entry point: connect to DB, start HTTP server
├── scripts/
│   └── create-admin.js    # One-off admin account creation
├── src/
│   ├── app.js             # Express app: security headers, CORS, JSON, routes, errors
│   ├── config/env.js      # Reads .env in one place
│   ├── routes/            # URL → middleware → controller (no logic)
│   ├── middleware/        # authenticate, authorize(role), validate, error handler
│   ├── validators/        # Input rules (express-validator)
│   ├── controllers/       # Read validated input → call service → send JSON
│   ├── services/          # Business rules and database work
│   │   ├── ai/            #   (future) LLM + vision problem classification
│   │   ├── matching/      #   (future) nearby provider search
│   │   ├── notifications/ #   (future) Firebase push
│   │   └── storage/       #   (future) S3 uploads
│   ├── models/            # Sequelize models + relationships
│   └── utils/             # ApiError, JWT helpers, pagination, slugify
└── tests/                 # Jest + Supertest API tests
```

Database connection settings are shared with sequelize-cli in [`database/config/config.js`](../database/config/config.js).

## Adding an Endpoint

1. **Validator** — add rules in `src/validators/`.
2. **Service** — put the business logic in `src/services/`. Throw `ApiError` for expected failures.
3. **Controller** — call the service with `matchedData(req)` (only validated fields) and send `{ success: true, data }`.
4. **Route** — wire it up with `authenticate`, `authorize('role')` and `validate(rules)`.
5. **Test** — add a case in `tests/`.
6. **Docs** — update `docs/API_SPEC.md`.

## Security Notes

- Passwords are hashed with bcrypt. Password hashes are never returned by the API.
- Login and register are rate-limited (20 requests per 15 minutes per IP).
- Users can't sign up as admin.
- Users get `404` rather than `403` for records they can't see, so record ids can't be probed.
- Only validated fields reach the services. Extra fields such as `role` are dropped.
