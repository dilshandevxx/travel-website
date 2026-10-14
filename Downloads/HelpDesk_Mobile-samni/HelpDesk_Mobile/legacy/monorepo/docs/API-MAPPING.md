# API Module Mapping

Which backend module serves each endpoint, who owns it, which `@helpdesk/shared` client file calls it, and which screens use it.

- All paths are mounted under `/api` (see [`backend/src/routes.ts`](../backend/src/routes.ts)).
- Every module has the same three files: `<module>.routes.ts` (paths + auth guards), `<module>.controller.ts` (reads `req`, sends `res`), `<module>.service.ts` (logic + database, no Express objects).
- Routes are declared already; controllers return "not implemented" until the owner fills them in.
- Request/response conventions (envelope, errors, status codes) are in [API_SPEC.md](API_SPEC.md).

**Owner codes:** M1 = Member 1 (Customer app), M2 = Member 2 (Provider app, onboarding, tests), M3 = Member 3 (Tracking, messaging, AI, shared), M4 = Member 4 (Admin, auth, database).

## Module overview

| Backend module  | Owner | Shared client file     | Main consumers                                   |
| --------------- | ----- | ---------------------- | ------------------------------------------------ |
| `auth`          | M4    | `api/auth.ts`          | Login/register screens in both apps, admin login |
| `users`         | M1    | `api/users.ts`         | Customer settings, profile, addresses            |
| `catalog`       | M1    | `api/providers.ts`     | Customer home, category, providers list/detail   |
| `provider`      | M2    | `api/providers.ts`     | Provider profile, pricing, verification          |
| `bookings`      | M1    | `api/bookings.ts`      | Customer new booking, bookings tab               |
| `jobs`          | M2    | `api/bookings.ts`      | Provider radar, jobs, job detail, propose cost   |
| `tracking`      | M3    | `api/bookings.ts`      | Customer `booking/[id]/track`                    |
| `messages`      | M3    | `api/messages.ts`      | Chat screens in both apps                        |
| `reviews`       | M3    | `api/reviews.ts`       | Customer review screen, provider reviews         |
| `complaints`    | M3    | `api/complaints.ts`    | Customer complaint screen                        |
| `notifications` | M3    | `api/notifications.ts` | Notifications screens in both apps               |
| `ai`            | M3    | `api/ai.ts`            | Customer `ai-triage`                             |
| `admin`         | M4    | `api/admin.ts`         | All admin-web pages                              |

## Endpoints by module

### auth (M4)

| Method | Path                | Used by                                 |
| ------ | ------------------- | --------------------------------------- |
| POST   | `/auth/register`    | `(auth)/register.tsx` (both apps)       |
| POST   | `/auth/login`       | `(auth)/login.tsx` (both apps), `Login` |
| GET    | `/auth/me`          | `AuthProvider` on app start             |
| POST   | `/auth/logout`      | Settings / profile logout               |
| POST   | `/auth/switch-mode` | Customer ↔ provider mode switch         |

### users (M1)

| Method | Path                                 | Used by                  |
| ------ | ------------------------------------ | ------------------------ |
| GET    | `/users/me`                          | `(tabs)/profile.tsx`     |
| PATCH  | `/users/me`                          | `settings/profile.tsx`   |
| GET    | `/users/me/addresses`                | `settings/addresses.tsx` |
| POST   | `/users/me/addresses`                | `settings/addresses.tsx` |
| PATCH  | `/users/me/addresses/:id`            | `settings/addresses.tsx` |
| DELETE | `/users/me/addresses/:id`            | `settings/addresses.tsx` |
| GET    | `/users/me/notification-preferences` | `(tabs)/settings.tsx`    |
| PUT    | `/users/me/notification-preferences` | `(tabs)/settings.tsx`    |
| GET    | `/users/me/app-settings`             | `(tabs)/settings.tsx`    |
| PUT    | `/users/me/app-settings`             | `(tabs)/settings.tsx`    |
| POST   | `/users/me/change-password`          | `(tabs)/settings.tsx`    |
| DELETE | `/users/me/account`                  | `(tabs)/settings.tsx`    |

### catalog (M1)

| Method | Path             | Used by                                         |
| ------ | ---------------- | ----------------------------------------------- |
| GET    | `/categories`    | `(tabs)/home.tsx`, `CategoryIcon`               |
| GET    | `/providers`     | `providers/index.tsx`, `category/[id].tsx`, map |
| GET    | `/providers/:id` | `providers/[id].tsx`                            |

### provider (M2)

| Method | Path                             | Used by                                      |
| ------ | -------------------------------- | -------------------------------------------- |
| GET    | `/providers/me`                  | Provider `(tabs)/profile.tsx`                |
| PATCH  | `/providers/me`                  | Provider `(tabs)/profile.tsx`                |
| GET    | `/providers/me/verification`     | `verification-pending.tsx`                   |
| POST   | `/providers/me/verification`     | `verification/upload.tsx`                    |
| GET    | `/providers/me/category-pricing` | `profile/pricing.tsx`                        |
| PUT    | `/providers/me/category-pricing` | `profile/pricing.tsx`                        |
| PUT    | `/providers/me/availability`     | Provider `(tabs)/radar.tsx` (online/offline) |

### bookings (M1)

| Method | Path                    | Used by                                       |
| ------ | ----------------------- | --------------------------------------------- |
| POST   | `/service-requests`     | `booking/new.tsx`                             |
| GET    | `/service-requests`     | Customer `(tabs)/bookings.tsx`, provider jobs |
| GET    | `/service-requests/:id` | `booking/[id]/track.tsx`, provider `job/[id]` |

### jobs (M2)

| Method | Path                                 | Used by                     |
| ------ | ------------------------------------ | --------------------------- |
| POST   | `/service-requests/:id/accept`       | Provider `(tabs)/radar.tsx` |
| PATCH  | `/service-requests/:id/status`       | Provider `job/[id].tsx`     |
| POST   | `/service-requests/:id/propose-cost` | `job/[id]/propose-cost.tsx` |

### tracking (M3)

| Method | Path                                       | Used by                  |
| ------ | ------------------------------------------ | ------------------------ |
| POST   | `/service-requests/:id/respond-cost`       | `booking/[id]/track.tsx` |
| POST   | `/service-requests/:id/confirm-completion` | `booking/[id]/track.tsx` |
| POST   | `/service-requests/:id/cancel`             | `booking/[id]/track.tsx` |

### messages (M3)

| Method | Path                             | Used by                                           |
| ------ | -------------------------------- | ------------------------------------------------- |
| GET    | `/service-requests/:id/messages` | `booking/[id]/chat.tsx`, provider `job/[id]/chat` |
| POST   | `/service-requests/:id/messages` | `booking/[id]/chat.tsx`, provider `job/[id]/chat` |

### reviews (M3)

| Method | Path                             | Used by                                     |
| ------ | -------------------------------- | ------------------------------------------- |
| POST   | `/service-requests/:id/reviews`  | `booking/[id]/review.tsx`                   |
| GET    | `/providers/:id/reviews`         | `providers/[id].tsx`, `profile/reviews.tsx` |
| POST   | `/providers/reviews/:id/respond` | Provider `profile/reviews.tsx`              |

### complaints (M3)

| Method | Path                               | Used by                      |
| ------ | ---------------------------------- | ---------------------------- |
| POST   | `/service-requests/:id/complaints` | `booking/[id]/complaint.tsx` |

### notifications (M3)

| Method | Path                      | Used by                         |
| ------ | ------------------------- | ------------------------------- |
| GET    | `/notifications`          | `notifications.tsx` (both apps) |
| PATCH  | `/notifications/read-all` | `notifications.tsx` (both apps) |
| PATCH  | `/notifications/:id/read` | `notifications.tsx` (both apps) |

### ai (M3)

| Method | Path               | Used by         |
| ------ | ------------------ | --------------- |
| POST   | `/ai/classify`     | `ai-triage.tsx` |
| POST   | `/ai/project-plan` | `ai-triage.tsx` |

### admin (M4)

| Method | Path                                | Used by (admin-web page) |
| ------ | ----------------------------------- | ------------------------ |
| GET    | `/admin/dashboard`                  | `Dashboard`              |
| GET    | `/admin/users`                      | `Users`                  |
| PATCH  | `/admin/users/:id/status`           | `Users`                  |
| GET    | `/admin/providers/pending`          | `VerificationQueue`      |
| PATCH  | `/admin/providers/:id/verification` | `VerificationQueue`      |
| GET    | `/admin/pricing-rules`              | `PricingRules`           |
| POST   | `/admin/pricing-rules`              | `PricingRules`           |
| PATCH  | `/admin/pricing-rules/:id`          | `PricingRules`           |
| GET    | `/admin/complaints`                 | `Complaints`             |
| PATCH  | `/admin/complaints/:id`             | `Complaints`             |

> `Bookings` and `BookingDetail` admin pages have no admin endpoint yet. TODO (M4): add `GET /admin/service-requests` and `GET /admin/service-requests/:id`, or reuse `/service-requests` with an admin role check.

## Adding an endpoint

1. Owner of the module adds the route in `<module>.routes.ts`, a handler in the controller and logic in the service.
2. Member 3 adds the typed function to the matching `packages/shared/src/api/*.ts` file.
3. Add a row to the table above in the same pull request.
