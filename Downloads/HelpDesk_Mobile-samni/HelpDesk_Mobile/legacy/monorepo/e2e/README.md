# End-to-end tests (Member 2)

[Playwright](https://playwright.dev) tests that drive the real backend API (and later the admin web).

```bash
npm run dev:backend          # in one terminal
npx playwright install       # first time only, downloads browsers
npm run test:e2e             # from the repo root
```

- `tests/booking-flow.spec.ts` - the full booking flow (stub, marked `fixme`)
- Set `E2E_API_URL` to point at a different backend (default `http://localhost:4000/api`)
- For the mobile apps, consider adding [Maestro](https://maestro.mobile.dev) flows in `e2e/mobile/`
