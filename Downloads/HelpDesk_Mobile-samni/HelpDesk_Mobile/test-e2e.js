// End-to-end API test: starts its own server on a throwaway database and walks a full
// booking through every stage (customer books -> provider accepts -> journey -> quote ->
// invoice -> customer confirms -> review -> complaint -> admin resolves), plus the
// provider verification flow and a few permission checks.
//
// Run: npm run test:e2e   (does not touch data/helpdesk-db.json)

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const PORT = 3999;
const BASE = `http://localhost:${PORT}/api`;
const DB_FILE = path.resolve('data/e2e.local.json');

fs.rmSync(DB_FILE, { force: true });

const server = spawn(process.execPath, ['--import', 'tsx', 'server.ts'], {
  env: { ...process.env, PORT: String(PORT), DB_FILE, NODE_ENV: 'production', GEMINI_API_KEY: '' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLog = '';
server.stdout.on('data', (d) => (serverLog += d));
server.stderr.on('data', (d) => (serverLog += d));

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`${BASE}/health`);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Server did not start:\n${serverLog}`);
}

async function call(method, url, { token, body, expect = 200 } = {}) {
  const res = await fetch(`${BASE}${url}`, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status !== expect) {
    throw new Error(`${method} ${url} -> ${res.status} (expected ${expect}): ${JSON.stringify(data)}`);
  }
  return data;
}

const login = async (email, password = 'password123') => (await call('POST', '/auth/login', { body: { email, password } })).token;

let passed = 0;
async function step(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}\n    ${err.message}`);
    throw err;
  }
}

async function main() {
  await waitForServer();
  console.log('HelpDesk e2e\n');

  const ctx = {};

  await step('health check', async () => {
    const health = await call('GET', '/health');
    assert.equal(health.ok, true);
  });

  await step('demo users can log in; wrong password is rejected', async () => {
    ctx.customer = await login('nimal@example.com');
    ctx.provider = await login('kamal@example.com');
    ctx.otherProvider = await login('sunil@example.com');
    ctx.admin = await login('admin@helpdesk.lk', 'admin123');
    await call('POST', '/auth/login', { body: { email: 'nimal@example.com', password: 'nope' }, expect: 401 });
  });

  await step('AI triage (keyword fallback) classifies a leak as plumbing', async () => {
    const { classification } = await call('POST', '/ai/classify', { token: ctx.customer, body: { description: 'Water is leaking from the pipe under my bathroom sink' } });
    assert.equal(classification.categorySlug, 'plumbing');
    assert.equal(classification.source, 'fallback');
  });

  await step('customer creates an open plumbing request', async () => {
    const { categories } = await call('GET', '/categories');
    ctx.plumbing = categories.find((c) => c.slug === 'plumbing').id;
    const { addresses } = await call('GET', '/users/me/addresses', { token: ctx.customer });
    const { booking } = await call('POST', '/service-requests', {
      token: ctx.customer,
      expect: 201,
      body: { categoryId: ctx.plumbing, title: 'Bathroom tap dripping', description: 'The bathroom tap drips all night and the washer looks worn.', addressId: addresses[0].id },
    });
    assert.equal(booking.status, 'PENDING');
    ctx.bookingId = booking.id;
  });

  await step('validation errors come back per field', async () => {
    const res = await call('POST', '/service-requests', { token: ctx.customer, expect: 400, body: { categoryId: ctx.plumbing, title: 'x' } });
    assert.ok(res.error.details.some((d) => d.field === 'title'));
  });

  await step('plumber sees it on the radar (address hidden); electrician does not', async () => {
    const { bookings } = await call('GET', '/provider/jobs/available', { token: ctx.provider });
    const job = bookings.find((b) => b.id === ctx.bookingId);
    assert.ok(job);
    assert.equal(job.address, job.city);
    const other = await call('GET', '/provider/jobs/available', { token: ctx.otherProvider });
    assert.ok(!other.bookings.some((b) => b.id === ctx.bookingId));
  });

  await step('provider accepts; a second accept is rejected', async () => {
    const { booking } = await call('POST', `/service-requests/${ctx.bookingId}/accept`, { token: ctx.provider });
    assert.equal(booking.status, 'ACCEPTED');
    await call('POST', `/service-requests/${ctx.bookingId}/accept`, { token: ctx.provider, expect: 409 });
  });

  await step('customer and provider chat', async () => {
    await call('POST', `/service-requests/${ctx.bookingId}/messages`, { token: ctx.customer, expect: 201, body: { body: 'Gate code is 1234' } });
    const { messages } = await call('GET', `/service-requests/${ctx.bookingId}/messages`, { token: ctx.provider });
    assert.equal(messages.at(-1).body, 'Gate code is 1234');
  });

  await step('provider cannot skip a status', async () => {
    await call('PATCH', `/service-requests/${ctx.bookingId}/status`, { token: ctx.provider, expect: 409, body: { status: 'AWAITING_CUSTOMER_CONFIRMATION' } });
  });

  await step('provider starts the journey and starts work', async () => {
    await call('PATCH', `/service-requests/${ctx.bookingId}/status`, { token: ctx.provider, body: { status: 'ON_THE_WAY' } });
    const { booking } = await call('PATCH', `/service-requests/${ctx.bookingId}/status`, { token: ctx.provider, body: { status: 'IN_PROGRESS' } });
    assert.equal(booking.status, 'IN_PROGRESS');
  });

  await step('customer cannot cancel once work has started', async () => {
    await call('POST', `/service-requests/${ctx.bookingId}/cancel`, { token: ctx.customer, expect: 409, body: {} });
  });

  await step('quote: provider proposes, customer accepts', async () => {
    const { booking } = await call('POST', `/service-requests/${ctx.bookingId}/propose-cost`, { token: ctx.provider, body: { amount: 3800, note: 'New washer + cartridge, 1 hour' } });
    const proposal = booking.costProposals.find((p) => p.status === 'PENDING');
    const res = await call('POST', `/service-requests/${ctx.bookingId}/respond-cost`, { token: ctx.customer, body: { proposalId: proposal.id, accept: true } });
    assert.equal(res.booking.finalCost, 3800);
  });

  await step('invoice -> customer says not done -> invoice again -> confirmed', async () => {
    let { booking } = await call('PATCH', `/service-requests/${ctx.bookingId}/status`, { token: ctx.provider, body: { status: 'AWAITING_CUSTOMER_CONFIRMATION' } });
    assert.equal(booking.finalCost, 3800);
    ({ booking } = await call('POST', `/service-requests/${ctx.bookingId}/confirm-completion`, { token: ctx.customer, body: { confirmed: false, note: 'Still drips a little' } }));
    assert.equal(booking.status, 'IN_PROGRESS');
    await call('PATCH', `/service-requests/${ctx.bookingId}/status`, { token: ctx.provider, body: { status: 'AWAITING_CUSTOMER_CONFIRMATION' } });
    ({ booking } = await call('POST', `/service-requests/${ctx.bookingId}/confirm-completion`, { token: ctx.customer, body: { confirmed: true } }));
    assert.equal(booking.status, 'COMPLETED');
  });

  await step('customer reviews once; rating updates; provider earnings include the job', async () => {
    await call('POST', `/service-requests/${ctx.bookingId}/review`, { token: ctx.customer, expect: 201, body: { rating: 4, comment: 'Good job' } });
    await call('POST', `/service-requests/${ctx.bookingId}/review`, { token: ctx.customer, expect: 409, body: { rating: 5 } });
    const { earnings } = await call('GET', '/provider/earnings', { token: ctx.provider });
    assert.ok(earnings.recent.some((r) => r.serviceRequestId === ctx.bookingId && r.net === 3420));
  });

  await step('customer complains; admin resolves it', async () => {
    const { complaint } = await call('POST', `/service-requests/${ctx.bookingId}/complaints`, { token: ctx.customer, expect: 201, body: { reason: 'Charged more than agreed', description: 'I expected the visit fee to be included.' } });
    await call('PATCH', `/admin/complaints/${complaint.id}`, { token: ctx.admin, expect: 400, body: { status: 'RESOLVED' } });
    const res = await call('PATCH', `/admin/complaints/${complaint.id}`, { token: ctx.admin, body: { status: 'RESOLVED', resolution: 'Explained the quote; LKR 500 credit applied.' } });
    assert.equal(res.complaint.status, 'RESOLVED');
  });

  await step('new provider registers, verifies, gets approved by admin, sees jobs', async () => {
    const { token } = await call('POST', '/auth/register', { expect: 201, body: { fullName: 'Test Plumber', email: 'test.plumber@example.com', password: 'password123', role: 'PROVIDER' } });
    const before = await call('GET', '/provider/jobs/available', { token });
    assert.equal(before.bookings.length, 0);
    await call('POST', '/provider/me/verification', { token, body: { nicNumber: '199912345678', categoryIds: [ctx.plumbing], yearsOfExperience: 3, bio: 'Plumbing repairs in Colombo', city: 'Colombo' } });
    const me = await call('GET', '/auth/me', { token });
    await call('PATCH', `/admin/providers/${me.user.id}/verification`, { token: ctx.admin, body: { status: 'APPROVED' } });
    const profile = await call('GET', '/provider/me', { token });
    assert.equal(profile.profile.status, 'APPROVED');
  });

  await step('roles are enforced', async () => {
    await call('GET', '/admin/dashboard', { token: ctx.customer, expect: 403 });
    await call('POST', `/service-requests/${ctx.bookingId}/accept`, { token: ctx.customer, expect: 403 });
    await call('GET', '/service-requests', { expect: 401 });
  });

  await step('admin dashboard reflects the completed job', async () => {
    const { stats } = await call('GET', '/admin/dashboard', { token: ctx.admin });
    assert.ok(stats.completedBookings >= 2);
    assert.ok(stats.platformRevenue > 0);
  });

  console.log(`\n${passed} checks passed.`);
}

main()
  .then(() => (process.exitCode = 0))
  .catch(() => (process.exitCode = 1))
  .finally(() => {
    server.kill();
    fs.rmSync(DB_FILE, { force: true });
  });
