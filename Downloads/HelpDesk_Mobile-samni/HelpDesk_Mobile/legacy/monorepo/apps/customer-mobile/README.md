# Customer App (`@helpdesk/customer-mobile`)

**Owner:** Member 1 (M1). Auth/onboarding screens: Member 2 (M2). Booking tracking, chat, review, complaint, AI triage, notifications: Member 3 (M3).

Expo Router app for households: browse categories, find a provider, book, track and review.

```bash
npm run dev:customer   # from the repo root
```

## Layout

| Path                    | What                                       | Owner |
| ----------------------- | ------------------------------------------ | ----- |
| `app/(auth)/`           | welcome, login, register                   | M2    |
| `app/(tabs)/`           | home, bookings, settings, profile          | M1    |
| `app/providers/`        | provider list, detail, map                 | M1    |
| `app/category/[id].tsx` | providers in one category                  | M1    |
| `app/booking/new.tsx`   | create a booking                           | M1    |
| `app/booking/[id]/`     | track, chat, review, complaint             | M3    |
| `app/settings/`         | edit profile, addresses                    | M1    |
| `app/ai-triage.tsx`     | describe a problem, AI suggests a category | M3    |
| `app/notifications.tsx` | notification list                          | M3    |
| `src/components/`       | `CategoryIcon` (M1), `StatusStepper` (M3)  | mixed |
| `src/lib/api.ts`        | API client instance                        | M3    |

## TODO

- [ ] See the M1 checklist in [docs/TEAM.md](../../docs/TEAM.md#member-1-m1-customer-app)
