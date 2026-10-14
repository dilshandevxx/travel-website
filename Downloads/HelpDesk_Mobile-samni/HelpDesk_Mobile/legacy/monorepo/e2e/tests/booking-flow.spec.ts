// OWNER: Member 2 - Provider app / onboarding / e2e
// PURPOSE: End-to-end test of the full booking flow
// TODO: Customer books -> provider accepts -> status steps -> customer confirms -> review

import { expect, test } from '@playwright/test';

test('API health check responds', async ({ request }) => {
  const res = await request.get('health');
  expect(res.ok()).toBeTruthy();
});

test.fixme('customer books a job and a provider completes it', async () => {
  // 1. Register a customer and a provider (or use seeded demo users)
  // 2. Customer: POST /service-requests
  // 3. Provider: accept -> ON_THE_WAY -> IN_PROGRESS -> propose cost -> AWAITING_CUSTOMER_CONFIRMATION
  // 4. Customer: respond-cost, confirm-completion, leave a review
});
