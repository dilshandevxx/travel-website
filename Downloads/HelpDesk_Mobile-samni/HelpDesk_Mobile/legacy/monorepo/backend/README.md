# Backend (`@helpdesk/backend`)

**Owner:** Member 4 (M4) for core, database, auth and admin. Each feature module under `src/modules/` has its own owner (see [src/modules/README.md](src/modules/README.md)).

Express + Sequelize REST API, mounted under `/api`.

```bash
cp backend/.env.example backend/.env   # then fill in values
npm run db:migrate
npm run db:seed
npm run dev:backend
```

## Layout

| Path                 | What                                            | Owner |
| -------------------- | ----------------------------------------------- | ----- |
| `src/server.ts`      | starts the HTTP server                          | M4    |
| `src/app.ts`         | Express app, global middleware                  | M4    |
| `src/routes.ts`      | mounts every module router                      | M4    |
| `src/config/`        | environment loading                             | M4    |
| `src/middleware/`    | `auth.ts` (JWT, roles), `errorHandler.ts`       | M4    |
| `src/db/models/`     | Sequelize models                                | M4    |
| `src/db/migrations/` | schema migrations                               | M4    |
| `src/db/seeders/`    | demo data                                       | M4    |
| `src/modules/`       | feature modules (routes / controller / service) | mixed |
| `src/utils/`         | small helpers                                   | M4    |

## TODO

- [ ] See the checklists in [docs/TEAM.md](../docs/TEAM.md#work-for-each-member)
- [ ] Endpoint list: [docs/API-MAPPING.md](../docs/API-MAPPING.md)
