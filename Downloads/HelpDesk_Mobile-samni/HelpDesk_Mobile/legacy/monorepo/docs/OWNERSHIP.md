# Ownership & Responsibilities

Who builds what. The exact file-by-file path table and team rules are in [TEAM.md](TEAM.md); GitHub enforces them through [`.github/CODEOWNERS`](../.github/CODEOWNERS).

| Code | Member   | Area                                                                        | Branch prefix    |
| ---- | -------- | --------------------------------------------------------------------------- | ---------------- |
| M1   | Member 1 | Customer app                                                                | `feature/m1-...` |
| M2   | Member 2 | Provider app, onboarding (login/register in both apps), end-to-end tests    | `feature/m2-...` |
| M3   | Member 3 | Tracking, messaging, reviews, complaints, notifications, AI, shared package | `feature/m3-...` |
| M4   | Member 4 | Admin web, auth, database, backend core, repo config                        | `feature/m4-...` |

File headers use the long form, e.g. `// OWNER: Member 1 - Customer app`. "M1" and "Member 1" mean the same person.

## Ownership matrix

**O** = owns and writes it. **C** = consumes it / must be consulted on changes.

| Area                                                                           | M1  | M2  | M3  | M4  |
| ------------------------------------------------------------------------------ | :-: | :-: | :-: | :-: |
| `apps/customer-mobile` screens (tabs, browse, booking)                         |  O  |     |  C  |     |
| `apps/customer-mobile` auth/onboarding screens                                 |  C  |  O  |     |  C  |
| `apps/customer-mobile/app/booking/[id]/*`, `ai-triage`, `notifications`        |  C  |     |  O  |     |
| `apps/provider-mobile` (except chat/notifications)                             |     |  O  |  C  |     |
| `apps/provider-mobile` chat + notifications                                    |     |  C  |  O  |     |
| `apps/admin-web`                                                               |     |     |     |  O  |
| `backend` core (`server`, `app`, `routes`, `middleware`, `config`)             |  C  |  C  |  C  |  O  |
| `backend/src/db` (models, migrations, seeders)                                 |  C  |  C  |  C  |  O  |
| `modules/auth`, `modules/admin`                                                |     |     |     |  O  |
| `modules/users`, `catalog`, `bookings`                                         |  O  |     |     |  C  |
| `modules/provider`, `jobs`                                                     |     |  O  |     |  C  |
| `modules/tracking`, `messages`, `reviews`, `complaints`, `notifications`, `ai` |     |     |  O  |  C  |
| `packages/shared` (types, constants, api, utils, components)                   |  C  |  C  |  O  |  C  |
| `packages/shared/src/auth`                                                     |  C  |  C  |  C  |  O  |
| `e2e`                                                                          |  C  |  O  |  C  |  C  |
| `docs`                                                                         |  O  |  O  |  O  |  O  |

## Module responsibilities

### M1: Customer app

- **Screens:** `(tabs)/home`, `bookings`, `settings`, `profile`; `providers/` (list, detail, map); `category/[id]`; `booking/new`; `settings/` (profile edit, addresses); `src/components/CategoryIcon`.
- **Backend:** `users` (profile, addresses, preferences, password, account deletion), `catalog` (categories, provider search), `bookings` (create/list/get service requests).
- **Done when:** a customer can browse categories, pick a provider, create a booking and see it in the Bookings tab.

### M2: Provider app, onboarding & tests

- **Screens:** both apps' `_layout.tsx`, `index.tsx`, `(auth)/` (welcome, login, register); provider `(tabs)/` (radar, jobs, earnings, profile), `job/[id]`, `job/[id]/propose-cost`, `verification/`, `verification-pending`, `profile/` (pricing, reviews), `src/components/`.
- **Backend:** `provider` (own profile, verification upload, category pricing, availability), `jobs` (accept, status updates, propose cost).
- **Tests:** `e2e/tests/booking-flow.spec.ts` and any further Playwright specs.
- **Done when:** a provider can register, upload verification, go online, accept a job and move it to completion, and the e2e booking flow passes.

### M3: Tracking, messaging, AI & shared

- **Screens:** customer `booking/[id]/` (track, chat, review, complaint), `ai-triage`, `notifications`; provider `job/[id]/chat`, `notifications`; customer `StatusStepper`, `src/lib/api.ts`.
- **Backend:** `tracking` (respond to cost, confirm completion, cancel), `messages`, `reviews`, `complaints`, `notifications`, `ai` (Gemini in `ai/gemini.ts`).
- **Shared:** every type, constant, API client function, util and shared component in `packages/shared`.
- **Done when:** both sides can chat on a job, the customer can follow status live, review and complain, notifications arrive, and AI triage suggests a category.

### M4: Admin, auth & database

- **Admin web:** `Login`, `Dashboard`, `VerificationQueue`, `Bookings`, `BookingDetail`, `Complaints`, `Users`, `PricingRules`, layout, router.
- **Backend:** `server.ts`, `app.ts`, `routes.ts`, `config/`, `middleware/auth.ts`, `middleware/errorHandler.ts`, `modules/auth`, `modules/admin`.
- **Database:** every model in `backend/src/db/models/` (User, ProviderProfile, Category, ServiceRequest, StatusHistory, CostProposal, Message, Review, Complaint, Notification, Address, PricingRule, AuditLog, Transaction), migrations and seeders.
- **Shared auth:** `packages/shared/src/auth/` (`AuthProvider`, `useAuth`).
- **Done when:** users can register/log in with JWT, migrations create every table, seed data loads, and an admin can verify providers and resolve complaints.

## Checklists

Each member's full task checklist is in [TEAM.md → Work for each member](TEAM.md#work-for-each-member).
