# Admin Web (`@helpdesk/admin-web`)

**Owner:** Member 4 (M4)

Vite + React dashboard for platform staff: verify providers, oversee bookings, resolve complaints, manage users and pricing rules.

```bash
npm run dev:admin   # from the repo root
```

## Layout

| Path                          | What                                                                                          |
| ----------------------------- | --------------------------------------------------------------------------------------------- |
| `src/main.tsx`, `App.tsx`     | entry point and app shell                                                                     |
| `src/router.tsx`              | page routes                                                                                   |
| `src/layouts/AdminLayout.tsx` | sidebar + header                                                                              |
| `src/lib/api.ts`              | API client instance                                                                           |
| `src/pages/`                  | Login, Dashboard, VerificationQueue, Bookings, BookingDetail, Complaints, Users, PricingRules |

## TODO

- [ ] See the M4 checklist in [docs/TEAM.md](../../docs/TEAM.md#member-4-m4-admin-auth--database)
