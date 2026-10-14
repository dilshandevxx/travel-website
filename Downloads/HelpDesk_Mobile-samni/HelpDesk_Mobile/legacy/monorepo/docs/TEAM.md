# Team & Ownership

Every source file starts with an `// OWNER:` header. If this table and a file header ever disagree, the file header wins; then fix this table. GitHub enforces the same split through [`.github/CODEOWNERS`](../.github/CODEOWNERS).

Short codes M1–M4 mean Member 1–4. Each member's tasks are below; the ownership matrix is in [OWNERSHIP.md](OWNERSHIP.md); the endpoint-to-owner map is in [API-MAPPING.md](API-MAPPING.md).

## Members

| Member   | Area                                                                                    | Branch prefix    |
| -------- | --------------------------------------------------------------------------------------- | ---------------- |
| Member 1 | Customer app: browsing, booking, settings                                               | `feature/m1-...` |
| Member 2 | Provider app, onboarding/login screens (both apps), end-to-end tests                    | `feature/m2-...` |
| Member 3 | Live tracking, chat, reviews, complaints, notifications, AI features, `packages/shared` | `feature/m3-...` |
| Member 4 | Admin web, authentication, database, backend core, repo config                          | `feature/m4-...` |

## Ownership by path

| Path                                                                                                                 | Owner                                        |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Root config (`package.json`, `tsconfig.base.json`, ESLint, Prettier, `.github/`)                                     | Member 4                                     |
| `backend/src/server.ts`, `app.ts`, `routes.ts`, `config/`, `middleware/`, `utils/`                                   | Member 4                                     |
| `backend/src/db/` (models, migrations, seeders)                                                                      | Member 4                                     |
| `backend/src/modules/auth/`, `backend/src/modules/admin/`                                                            | Member 4                                     |
| `backend/src/modules/users/`, `catalog/`, `bookings/`                                                                | Member 1                                     |
| `backend/src/modules/provider/`, `jobs/`                                                                             | Member 2                                     |
| `backend/src/modules/tracking/`, `messages/`, `reviews/`, `complaints/`, `notifications/`, `ai/` (incl. `gemini.ts`) | Member 3                                     |
| `packages/shared/` (types, constants, API client)                                                                    | Member 3                                     |
| `packages/shared/src/auth/` (`AuthProvider.tsx`, `useAuth.ts`)                                                       | Member 4                                     |
| `apps/admin-web/`                                                                                                    | Member 4                                     |
| `apps/customer-mobile/app/_layout.tsx`, `index.tsx`, `(auth)/`                                                       | Member 2                                     |
| `apps/customer-mobile/app/(tabs)/`, `category/`, `providers/`, `booking/new.tsx`, `settings/`                        | Member 1                                     |
| `apps/customer-mobile/src/components/CategoryIcon.tsx`                                                               | Member 1                                     |
| `apps/customer-mobile/app/ai-triage.tsx`, `notifications.tsx`, `booking/[id]/` (track, chat, review, complaint)      | Member 3                                     |
| `apps/customer-mobile/src/components/StatusStepper.tsx`, `src/lib/api.ts`                                            | Member 3                                     |
| `apps/provider-mobile/` (everything not listed below)                                                                | Member 2                                     |
| `apps/provider-mobile/app/job/[id]/chat.tsx`, `notifications.tsx`                                                    | Member 3                                     |
| `e2e/`                                                                                                               | Member 2                                     |
| `docs/`                                                                                                              | Everyone (keep it current with your changes) |

## Work for each member

Tick items off in your own pull requests. Member 4's auth and database work unblocks everyone else, so Member 4 starts with steps 1–3 and the others start with their screens using placeholder data.

### Member 1 (M1): Customer App

**You build:** the customer's browsing, booking and account screens, and the backend modules behind them.

**Screens** (`apps/customer-mobile/`)

- [ ] `app/(tabs)/home.tsx`: category grid using `src/components/CategoryIcon.tsx`, search bar, link to AI triage
- [ ] `app/category/[id].tsx`: providers in one category
- [ ] `app/providers/index.tsx`: provider list with filters (rating, price, distance)
- [ ] `app/providers/map.tsx`: providers on a map
- [ ] `app/providers/[id].tsx`: provider detail, pricing, reviews, "Book" button
- [ ] `app/booking/new.tsx`: booking form (category, address, description, preferred time)
- [ ] `app/(tabs)/bookings.tsx`: active and past bookings, each linking to `booking/[id]/track`
- [ ] `app/(tabs)/profile.tsx`: account summary
- [ ] `app/(tabs)/settings.tsx`: notification preferences, app settings, change password, logout, delete account
- [ ] `app/settings/profile.tsx` and `app/settings/addresses.tsx`: edit profile, manage saved addresses

**Backend** (`backend/src/modules/`)

- [ ] `users/`: profile, addresses, notification preferences, app settings, change password, delete account
- [ ] `catalog/`: list categories, search providers, provider detail
- [ ] `bookings/`: create, list and get service requests

**Ask others for:** columns on `User`, `Address`, `Category`, `ServiceRequest` (M4); typed functions in `api/users.ts`, `api/providers.ts`, `api/bookings.ts` (M3).

**Done when:** a customer can browse categories, pick a provider, create a booking and see it in the Bookings tab.

### Member 2 (M2): Provider App, Onboarding & Tests

**You build:** onboarding/login for both apps, the whole provider app (except chat and notifications), and the end-to-end tests.

**Onboarding** (both `apps/customer-mobile/` and `apps/provider-mobile/`)

- [ ] `app/(auth)/welcome.tsx`, `login.tsx`, `register.tsx` using `useAuth` from M4
- [ ] `app/_layout.tsx` and `app/index.tsx`: redirect logged-out users to welcome, logged-in users to the tabs

**Provider screens** (`apps/provider-mobile/`)

- [ ] `app/verification/upload.tsx`: upload ID and qualification documents
- [ ] `app/verification-pending.tsx`: waiting for admin approval
- [ ] `app/(tabs)/radar.tsx`: online/offline toggle and incoming job requests with accept button
- [ ] `app/(tabs)/jobs.tsx`: accepted, active and past jobs
- [ ] `app/(tabs)/earnings.tsx`: earnings summary
- [ ] `app/(tabs)/profile.tsx`: provider profile
- [ ] `app/job/[id].tsx`: job detail and status actions (on the way, started, completed)
- [ ] `app/job/[id]/propose-cost.tsx`: send a cost proposal
- [ ] `app/profile/pricing.tsx` and `app/profile/reviews.tsx`: category pricing, reviews with replies
- [ ] `src/components/`: job card, status badge and other provider-only UI

**Backend** (`backend/src/modules/`)

- [ ] `provider/`: own profile, verification upload, category pricing, availability
- [ ] `jobs/`: accept a job, update status, propose cost

**Tests** (`e2e/`)

- [ ] `tests/booking-flow.spec.ts`: register → book → accept → complete → review

**Ask others for:** `ProviderProfile`, `CostProposal`, `StatusHistory` columns (M4); typed functions in `api/providers.ts`, `api/bookings.ts` (M3).

**Done when:** a provider can register, get verified, go online, accept a job and complete it, and the e2e booking flow passes.

### Member 3 (M3): Tracking, Messaging, AI & Shared

**You build:** everything that happens after a booking is made, the AI feature, and the shared package every app uses.

**Shared package** (`packages/shared/src/`)

- [ ] `api/*.ts`: typed client functions for every endpoint (see [API-MAPPING.md](API-MAPPING.md))
- [ ] `types/` and `constants/`: keep in sync with M4's models
- [ ] `utils/`: formatting and validation helpers, re-exported from `index.ts`
- [ ] `components/`: components used by more than one app, plus a `./components` export in `package.json`

**Customer screens** (`apps/customer-mobile/`)

- [ ] `app/booking/[id]/track.tsx` with `src/components/StatusStepper.tsx`: live status, accept/reject cost, confirm completion, cancel
- [ ] `app/booking/[id]/chat.tsx`: chat with the provider
- [ ] `app/booking/[id]/review.tsx`: star rating and comment
- [ ] `app/booking/[id]/complaint.tsx`: raise a complaint
- [ ] `app/ai-triage.tsx`: describe a problem, get a suggested category and plan
- [ ] `app/notifications.tsx`
- [ ] `src/lib/api.ts`: API client instance for the customer app

**Provider screens** (`apps/provider-mobile/`)

- [ ] `app/job/[id]/chat.tsx` and `app/notifications.tsx`

**Backend** (`backend/src/modules/`)

- [ ] `tracking/`: respond to cost, confirm completion, cancel
- [ ] `messages/`: list and send chat messages
- [ ] `reviews/`: create and list reviews, provider responses
- [ ] `complaints/`: create complaints
- [ ] `notifications/`: list, mark read, mark all read
- [ ] `ai/` and `ai/gemini.ts`: classify a problem, generate a project plan (key only in `backend/.env`)
- [ ] Decide polling vs. sockets for chat and tracking; record it as an ADR in `docs/decisions/`

**Ask others for:** `Message`, `Review`, `Complaint`, `Notification` columns (M4).

**Done when:** customer and provider can chat on a job, the customer can follow status live, review and complain, notifications arrive, and AI triage suggests a category.

### Member 4 (M4): Admin, Auth & Database

**You build:** the database, authentication, backend core, and the admin web dashboard.

**Database** (`backend/src/db/`), do this first

- [ ] Columns and associations for every model in `models/`: User, ProviderProfile, Category, ServiceRequest, StatusHistory, CostProposal, Message, Review, Complaint, Notification, Address, PricingRule, AuditLog, Transaction
- [ ] Migrations in `migrations/` for every table
- [ ] Demo data in `seeders/`

**Auth & backend core**

- [ ] `modules/auth/`: register, login, me, logout, switch mode
- [ ] `middleware/auth.ts`: `requireAuth`, `requireRole`; `middleware/errorHandler.ts`
- [ ] `packages/shared/src/auth/AuthProvider.tsx` and `useAuth.ts`: token storage and current user for all apps
- [ ] `server.ts`, `app.ts`, `routes.ts`, `config/env.ts`; keep every `.env.example` up to date

**Admin web** (`apps/admin-web/src/pages/`)

- [ ] `Login.tsx`
- [ ] `Dashboard.tsx`: totals for users, providers, bookings, complaints
- [ ] `VerificationQueue.tsx`: approve or reject providers
- [ ] `Bookings.tsx` and `BookingDetail.tsx`: all bookings and their history
- [ ] `Complaints.tsx`: review and resolve complaints
- [ ] `Users.tsx`: activate or suspend users
- [ ] `PricingRules.tsx`: manage pricing rules
- [ ] `modules/admin/`: services and controllers for the pages above, plus new admin endpoints for `Bookings` / `BookingDetail`

**Repo**

- [ ] Replace `@member1`..`@member4` in `.github/CODEOWNERS` with real GitHub usernames

**Done when:** users can register and log in, migrations create every table, seed data loads, and an admin can verify providers and resolve complaints.

## Rules

1. **Only edit files you own.** Ask the owner before changing anything outside your area.
2. **Changes to `packages/shared` types or the API client must go through Member 3.**
3. **Changes to database models or migrations must go through Member 4.**
4. **Work on one branch per member** (for example `feature/m1-customer`) and merge through pull requests.

### Practical notes

- Need a new shared type or endpoint function? Open an issue or PR comment tagging Member 3 and describe the shape you need.
- Need a new column or table? Ask Member 4; they write the migration so the schema stays consistent.
- Run `npm run typecheck` and `npm run lint` before opening a PR.
- Never commit `.env` files or API keys. The Gemini key lives only in `backend/.env`.
