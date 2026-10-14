# Backend Modules

Every module has the same three files:

| File                   | Job                                                       |
| ---------------------- | --------------------------------------------------------- |
| `<name>.routes.ts`     | paths, HTTP methods, `requireAuth` / `requireRole` guards |
| `<name>.controller.ts` | read `req`, call the service, send `res`                  |
| `<name>.service.ts`    | business logic and database access (no Express objects)   |

New routers must be registered in [`../routes.ts`](../routes.ts) (ask M4).

| Module          | Owner | Responsibility                                                  |
| --------------- | ----- | --------------------------------------------------------------- |
| `auth`          | M4    | register, login, current user, logout, switch mode              |
| `admin`         | M4    | dashboard stats, users, verification, pricing, complaints       |
| `users`         | M1    | own profile, addresses, preferences, password, account          |
| `catalog`       | M1    | categories, provider search and detail                          |
| `bookings`      | M1    | create, list and get service requests                           |
| `provider`      | M2    | the provider's own profile, verification, pricing, availability |
| `jobs`          | M2    | accept a job, update status, propose cost                       |
| `tracking`      | M3    | customer responds to cost, confirms completion, cancels         |
| `messages`      | M3    | chat on a service request                                       |
| `reviews`       | M3    | create and list reviews, provider responses                     |
| `complaints`    | M3    | customer complaints on a service request                        |
| `notifications` | M3    | list and mark notifications as read                             |
| `ai`            | M3    | Gemini-based problem classification and project plans           |

Full endpoint list: [docs/API-MAPPING.md](../../../docs/API-MAPPING.md).
