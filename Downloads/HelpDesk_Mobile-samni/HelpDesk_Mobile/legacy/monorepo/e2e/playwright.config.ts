// OWNER: Member 2 - Provider app / onboarding / e2e
// PURPOSE: Playwright configuration for end-to-end tests
// TODO: Add webServer entries to start the backend and admin web automatically

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: process.env.E2E_API_URL ?? 'http://localhost:4000/api',
  },
});
