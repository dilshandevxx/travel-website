# Legacy code

Earlier versions of HelpDesk, kept for reference. None of this is part of the current app's install, build or typecheck (the app at the repo root only compiles `src/` and `server.ts`).

| Folder             | What it was                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------- |
| `monorepo/`        | The npm-workspaces scaffold (Expo customer/provider apps, admin web, modular Express + Sequelize backend, `packages/shared`, Playwright e2e, team ownership docs). Replaced by the single-app layout at the root. |
| `backend/`         | First working JavaScript Express + Sequelize API (auth, providers, service requests, reviews) with Jest tests |
| `database/`        | Sequelize migrations/seeders for that API                                                                     |
| `admin-dashboard/` | Empty React folder structure                                                                                  |
| `mobile/`          | Placeholder customer/provider apps                                                                            |
| `shared-types/`    | First draft of the shared types                                                                               |

Copy logic from here if it is useful, and delete the folder once nothing more is needed. Everything also stays in git history.
