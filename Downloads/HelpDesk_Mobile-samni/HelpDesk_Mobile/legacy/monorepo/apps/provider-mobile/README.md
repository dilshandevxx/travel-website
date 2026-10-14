# Provider App (`@helpdesk/provider-mobile`)

**Owner:** Member 2 (M2). Chat and notifications screens: Member 3 (M3).

Expo Router app for skilled workers: onboarding and verification, receiving and running jobs, earnings.

```bash
npm run dev:provider   # from the repo root
```

## Layout

| Path                            | What                           | Owner |
| ------------------------------- | ------------------------------ | ----- |
| `app/(auth)/`                   | welcome, login, register       | M2    |
| `app/(tabs)/`                   | radar, jobs, earnings, profile | M2    |
| `app/job/[id].tsx`              | job detail and status actions  | M2    |
| `app/job/[id]/propose-cost.tsx` | send a cost proposal           | M2    |
| `app/job/[id]/chat.tsx`         | chat with the customer         | M3    |
| `app/verification/`             | upload verification documents  | M2    |
| `app/verification-pending.tsx`  | waiting for admin approval     | M2    |
| `app/profile/`                  | category pricing, reviews      | M2    |
| `app/notifications.tsx`         | notification list              | M3    |
| `src/components/`               | provider-only UI components    | M2    |
| `src/lib/api.ts`                | API client instance            | M2    |

## TODO

- [ ] See the M2 checklist in [docs/TEAM.md](../../docs/TEAM.md#member-2-m2-provider-app-onboarding--tests)
