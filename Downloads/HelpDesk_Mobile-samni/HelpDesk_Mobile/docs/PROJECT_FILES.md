# Project files

What every file does. Older versions of the project are in `legacy/` and are not part of the app.

## Root

| File | Purpose |
| ---- | ------- |
| `server.ts` | Express entry point: JSON body parsing, `/api` router, Vite middleware in dev or `dist/` in production. |
| `index.html` | HTML shell loaded by Vite; mounts `src/main.tsx`. |
| `package.json` | Scripts and dependencies (npm or Bun). |
| `bun.lock` | Bun lockfile. |
| `tsconfig.json` | One TypeScript config for the browser code and the server. |
| `vite.config.ts` | React + Tailwind plugins, `@/` alias, ignores `data/` so database writes don't reload the page. |
| `metadata.json` | App name and description (Google AI Studio format). |
| `.env.example` | Environment variables; copy to `.env`. |
| `test-e2e.js` | Starts a server on a throwaway database and tests the full booking flow through the API. |

## `data/`

| File | Purpose |
| ---- | ------- |
| `helpdesk-db.json` | The database: one JSON document with every collection. Committed with demo data; `npm run db:reset` restores it. |

## `database/`

| File | Purpose |
| ---- | ------- |
| `migrations/20261009000001-create-helpdesk-tables.cjs` | Sequelize migration creating the equivalent PostgreSQL schema. |
| `seeders/20261009000001-seed-demo-data.cjs` | Loads `data/helpdesk-db.json` into that schema. |

## `src/server/` (runs in Node)

| File | Purpose |
| ---- | ------- |
| `routes.ts` | Every API endpoint, validation, token auth, role checks, notifications, audit log. |
| `db.ts` | JSON database: load, atomic `mutate()`, change listeners, ids, password hashing, demo seed, `--reset` CLI. |
| `ai.ts` | Gemini problem triage with a keyword-based fallback. |

## `src/` (runs in the browser)

| File | Purpose |
| ---- | ------- |
| `main.tsx` | React entry. |
| `App.tsx` | Top bar + switch between Dual View, Customer, Provider and Admin. |
| `index.css` | Tailwind import, brand colours, scrollbar and radar animation styles. |
| `types/index.ts` | Shared types and constants (also imported by the server). |
| `services/api.ts` | Typed API client, `useLiveVersion` / `useLiveData` live hooks, formatters. |
| `context/AuthContext.tsx` | Per-app login state (`scope`: customer, provider, admin). |

### `src/components/`

| Folder / file | Purpose |
| ------------- | ------- |
| `common/PlatformSwitcher.tsx` | Top navigation between the simulator views. |
| `common/WelcomeScreen.tsx` | Onboarding, login, registration and demo-account buttons for both mobile apps. |
| `common/NavigationHeader.tsx` | Back-button header for pushed screens. |
| `common/NotificationsModal.tsx` | Notification panel and `useUnreadCount()`. |
| `common/ActionButton.tsx` | Button with variants and a loading state. |
| `common/CategoryIcons.tsx` | Icon and colours for each service category. |
| `mobile/MobileAppContainer.tsx` | Phone frame around an app. |
| `mobile/AndroidStatusBar.tsx` | Fake status bar with a live clock. |
| `mobile/CustomerMobileHeader.tsx` | Customer greeting, city and notification bell. |
| `mobile/ProviderMobileHeader.tsx` | Provider name, rating, online/offline switch and bell. |
| `customer/CustomerApp.tsx` | Customer tabs (home with AI triage, bookings, account), category and provider screens, booking form. |
| `customer/BookingProgressScreen.tsx` | Booking tracker, quotes, confirmation, review, complaints, and `BookingChat` (also used by providers). |
| `customer/LiveServiceTracker.tsx` | Simulated live map while the provider is on the way. |
| `customer/CustomerSettings.tsx` | Profile, addresses, notification settings, password, logout. |
| `provider/ProviderApp.tsx` | Provider tabs (radar, my jobs, earnings, profile) and the job workflow screen. |
| `provider/ProviderVerificationPendingScreen.tsx` | Verification form and "under review" / suspended states. |
| `admin/AdminDashboard.tsx` | Admin login and sections: overview, verification, bookings, users, complaints, pricing, audit log. |
| `sync/DualView.tsx` | Customer and provider phones side by side with live sync. |

## `docs/`

| File | Purpose |
| ---- | ------- |
| `ARCHITECTURE.md` | How the pieces fit, booking lifecycle, live sync, moving to PostgreSQL. |
| `API_SPEC.md` | Every endpoint and its rules. |
| `PROJECT_FILES.md` | This file. |
