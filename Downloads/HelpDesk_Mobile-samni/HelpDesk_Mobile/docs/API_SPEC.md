# API Specification

REST API served by `server.ts` (handlers in `src/server/routes.ts`). Request and response types are in `src/types/index.ts`; the browser client is `src/services/api.ts`.

**Base URL:** `http://localhost:3000/api`

## Conventions

- **Auth:** `Authorization: Bearer <token>` from `/auth/login` or `/auth/register`. Tokens last 7 days.
- **Bodies** are JSON. Amounts are whole LKR. Dates are ISO 8601 strings.
- **Errors:** `{ "error": { "message": "...", "details": [{ "field": "title", "message": "..." }] } }`. `details` only appears for validation errors (400).

| Code | Meaning |
| ---- | ------- |
| 200 / 201 | OK / created |
| 400 | Invalid input (see `details`) |
| 401 | Missing, invalid or expired token |
| 403 | Logged in, but your role or account state can't do this (e.g. unverified provider, deactivated user) |
| 404 | Not found, or not visible to you |
| 409 | Conflict: wrong status for this action, job already taken, already reviewed, email taken |
| 500 | Server error |

- **IDs** are integers. A provider is always identified by their **user id** (`providerId`, `/providers/:id`, `/admin/providers/:id`).
- **Roles:** `CUSTOMER`, `PROVIDER`, `ADMIN`.

## Endpoint summary

| Method | Path | Auth | Purpose |
| ------ | ---- | ---- | ------- |
| GET | `/health` | — | `{ ok, ai, version }` |
| GET | `/events` | — | Server-sent events: `{ version }` on every data change |
| POST | `/auth/register` | — | Create a customer or provider account |
| POST | `/auth/login` | — | Log in |
| GET | `/auth/me` | any | Current user + provider profile |
| PATCH | `/users/me` | any | Update `fullName`, `phone` |
| POST | `/users/me/change-password` | any | `currentPassword`, `newPassword` |
| GET / PATCH | `/users/me/settings` | any | Notification preferences and language |
| GET / POST | `/users/me/addresses` | any | List / add an address |
| PATCH | `/users/me/addresses/:id/default` | any | Make default |
| DELETE | `/users/me/addresses/:id` | any | Delete |
| GET | `/categories` | — | Active categories + pricing rules |
| GET | `/providers?categoryId=&city=` | — | Approved providers |
| GET | `/providers/:id` | — | Provider + reviews |
| POST | `/ai/classify` | any | AI triage of a problem description |
| POST | `/service-requests` | customer | Create a booking |
| GET | `/service-requests` | any | My bookings (customer), my jobs (provider), everything (admin) |
| GET | `/service-requests/:id` | any | One booking (`BookingDetail`) |
| POST | `/service-requests/:id/cancel` | any party / admin | Cancel |
| POST | `/service-requests/:id/respond-cost` | customer | Approve or decline a quote |
| POST | `/service-requests/:id/confirm-completion` | customer | Confirm the job, or send it back |
| POST | `/service-requests/:id/review` | customer | Rate a completed job (once) |
| POST | `/service-requests/:id/complaints` | customer / provider | Report a problem |
| GET / POST | `/service-requests/:id/messages` | parties | Chat |
| GET / PATCH | `/provider/me` | provider | Profile, availability, services |
| POST | `/provider/me/verification` | provider | Submit verification details |
| GET | `/provider/jobs/available` | provider | Job radar |
| POST | `/service-requests/:id/accept` | provider | Accept (first wins) |
| POST | `/service-requests/:id/decline` | provider | Decline a direct request |
| PATCH | `/service-requests/:id/status` | provider | `ON_THE_WAY`, `IN_PROGRESS`, `AWAITING_CUSTOMER_CONFIRMATION` |
| POST | `/service-requests/:id/propose-cost` | provider | Send a quote |
| GET | `/provider/earnings` | provider | Earnings summary |
| GET | `/provider/reviews` | provider | My reviews |
| POST | `/reviews/:id/respond` | provider | Reply to a review |
| GET | `/notifications` | any | Last 50 + unread count |
| PATCH | `/notifications/:id/read` | any | Mark read |
| PATCH | `/notifications/read-all` | any | Mark all read |
| GET | `/admin/dashboard` | admin | Stats |
| GET | `/admin/users` | admin | Users |
| PATCH | `/admin/users/:id/status` | admin | `{ isActive }` |
| GET | `/admin/verifications` | admin | Providers who submitted details |
| PATCH | `/admin/providers/:id/verification` | admin | `{ status: APPROVED \| REJECTED \| SUSPENDED, note? }` |
| GET | `/admin/bookings` | admin | All bookings with names |
| GET | `/admin/complaints` | admin | All complaints |
| PATCH | `/admin/complaints/:id` | admin | `{ status, resolution }` |
| GET | `/admin/pricing-rules` | admin | Pricing per category |
| PATCH | `/admin/pricing-rules/:id` | admin | `baseFee`, `minHourlyRate`, `maxHourlyRate` |
| GET | `/admin/audit-logs` | admin | Last 100 admin actions |
| POST | `/admin/reset-demo` | admin | Restore demo data |

## Auth

### `POST /auth/register`

| Field | Rules |
| ----- | ----- |
| `fullName` | 2–100 chars |
| `email` | valid, unique (stored lowercase) |
| `password` | 8–72 chars |
| `phone` | optional, max 20 |
| `role` | `CUSTOMER` (default) or `PROVIDER` |

`201` → `{ token, user }`. A provider also gets an empty profile with status `NOT_SUBMITTED`. `409` if the email is taken.

### `POST /auth/login`

`{ email, password }` → `{ token, user }`. `401` for a wrong email or password, `403` if deactivated.

### `GET /auth/me`

→ `{ user, providerProfile }` (`providerProfile` is `null` for non-providers).

## Bookings

### `BookingDetail`

A `ServiceRequest` plus `category`, `customer` (`id`, `fullName`, `avatarColor`, `phone`), `provider` (`ProviderSummary` or `null`), `history`, `costProposals`, `review`, `complaints`.

Privacy rules:

- Phone numbers are only shared between the customer and the assigned provider while the booking is active (and always with admins).
- Providers browsing open jobs see the city instead of the street address, and no complaints.

### `POST /service-requests` (customer)

| Field | Rules |
| ----- | ----- |
| `categoryId` | active category |
| `title` | 3–150 chars |
| `description` | 10–2000 chars |
| `addressId` | one of your addresses |
| `requestedProviderId` | optional, an approved provider offering that category → direct request |
| `urgency` | `LOW`, `NORMAL` (default), `URGENT` (+25% visit fee) |
| `preferredDate` | optional ISO date |
| `aiSummary` | optional, from `/ai/classify` |

`201` → `{ booking }`. Matching available providers (or the requested one) get a `NEW_JOB` notification.

### Who can do what

| Action | Who | Allowed when |
| ------ | --- | ------------ |
| accept | approved provider in the category (or the requested provider) | `PENDING` |
| decline | the requested provider | `PENDING` direct request; it then opens to everyone |
| status `ON_THE_WAY` | assigned provider | `ACCEPTED` |
| status `IN_PROGRESS` | assigned provider | `ON_THE_WAY` |
| status `AWAITING_CUSTOMER_CONFIRMATION` | assigned provider | `IN_PROGRESS`, no quote waiting. Body `finalCost` is used if no quote was approved. |
| propose-cost `{ amount, note }` | assigned provider | `ACCEPTED`, `ON_THE_WAY`, `IN_PROGRESS`; one pending quote at a time |
| respond-cost `{ proposalId, accept }` | customer | quote is `PENDING`; accepting sets `finalCost` |
| confirm-completion `{ confirmed, note? }` | customer | `AWAITING_CUSTOMER_CONFIRMATION`; `false` sends it back to `IN_PROGRESS` |
| cancel `{ reason? }` | customer, assigned provider, admin | `PENDING`, `ACCEPTED`, `ON_THE_WAY` |
| review `{ rating 1–5, comment? }` | customer | `COMPLETED`, once; updates the provider's average |
| complaints `{ reason, description }` | customer or assigned provider | a provider is assigned |

Wrong status → `409` with a readable message.

## AI

### `POST /ai/classify`

`{ description }` (5–2000 chars) →

```json
{
  "categoryId": 1,
  "classification": {
    "categorySlug": "plumbing",
    "title": "Leaking kitchen sink",
    "summary": "Likely a worn trap seal...",
    "urgency": "NORMAL",
    "estimatedCostRange": { "min": 2700, "max": 9000 },
    "safetyTips": ["Close the main water valve if the leak is getting worse."],
    "source": "gemini"
  }
}
```

`source` is `fallback` when `GEMINI_API_KEY` is not set or Gemini fails. The cost range is computed from the category's pricing rule, not by the model.

## Provider

### `POST /provider/me/verification`

`{ nicNumber, categoryIds, yearsOfExperience, bio, city }`. The NIC must be 12 digits or 9 digits + V/X. Sets status `PENDING_VERIFICATION` and notifies admins. `409` if already approved, `403` if suspended.

### `GET /provider/earnings`

`{ completedJobs, grossEarnings, commission, netEarnings, thisWeekNet, recent[] }`, with net = gross minus the 10% platform fee.

## Admin

- Rejecting a provider requires a `note`. Approving sets the provider online.
- Resolving or dismissing a complaint requires a `resolution`.
- Deactivating a user also takes a provider offline. Admins can't deactivate themselves.
- Every admin write is recorded in the audit log.
