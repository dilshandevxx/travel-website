# Database

PostgreSQL database managed with **Sequelize ORM** migrations and seeders.

> Owner: Member 4. The current migrations and seeder are **drafts** written by Member 3 (Backend) so the API can run — review and adjust them, keeping `backend/src/models/` in sync.

## Folders

| Path | Purpose |
|---|---|
| `setup.sql` | One-time: creates the database user and the development and test databases. |
| `config/config.js` | Connection settings for each environment, read from `backend/.env`. |
| `migrations/` | Versioned, ordered schema changes. **The source of truth for the schema.** Each migration has `up` and `down`. |
| `seeders/` | Starting data — currently the nine launch service categories. |

The table diagram is in [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md#data-model).

## First-Time Setup

```bash
# 1. Create the user and databases (edit the password in setup.sql first, don't commit it)
psql -U postgres -f database/setup.sql

# 2. Put the same credentials in backend/.env, then from backend/:
cd backend
npm run db:migrate   # create tables
npm run db:seed      # insert service categories
```

## Relationship to the Backend

- **Migrations** (here) define how the schema *changes over time*.
- **Models** (`backend/src/models/`) describe how the application *reads and writes* that schema.

Every model change needs a matching migration.

## Rules

- Never edit a migration that has already been run on a shared database — create a new one instead.
- Never commit database dumps or real user data.
- Database credentials live only in `backend/.env` (see `backend/.env.example`).
