# Shared Package (`@helpdesk/shared`)

**Owner:** Member 3 (M3). `src/auth/`: Member 4 (M4).

Code used by more than one app. Built to `dist/` on `npm install`; run `npm run dev:shared` to rebuild on change.

| Path              | What                                        | Import from                          |
| ----------------- | ------------------------------------------- | ------------------------------------ |
| `src/types/`      | TypeScript types for every API object       | `@helpdesk/shared`                   |
| `src/constants/`  | roles, statuses, categories                 | `@helpdesk/shared`                   |
| `src/api/`        | typed API client, one file per backend area | `@helpdesk/shared`                   |
| `src/utils/`      | pure helpers (formatting, validation)       | `@helpdesk/shared` (TODO: re-export) |
| `src/components/` | React components shared by several apps     | TODO: add a `./components` export    |
| `src/auth/`       | `AuthProvider`, `useAuth`                   | `@helpdesk/shared/auth`              |

## TODO

- [ ] See the M3 checklist in [docs/TEAM.md](../../docs/TEAM.md#member-3-m3-tracking-messaging-ai--shared)
