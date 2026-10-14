// JSON-file database. The whole database is one document (see `Database` in src/types)
// kept in memory and written to disk after every change. Good for a demo / prototype;
// database/migrations has the equivalent SQL schema for moving to PostgreSQL later.
//
// Run `npm run db:reset` to rewrite data/helpdesk-db.json with fresh demo data.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import type {
  Address,
  Category,
  Database,
  PricingRule,
  ProviderProfile,
  Review,
  ServiceRequest,
  StatusHistory,
  StoredUser,
  User,
  UserRole,
  UserSettings,
} from '../types/index.ts';
import { SERVICE_CATEGORIES } from '../types/index.ts';

const DB_FILE = path.resolve(process.env.DB_FILE ?? 'data/helpdesk-db.json');

let cache: Database | null = null;
const listeners = new Set<(version: number) => void>();

export function nowIso(): string {
  return new Date().toISOString();
}

// ---------- Passwords ----------

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 32).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 32);
  const expected = Buffer.from(hash, 'hex');
  return expected.length === candidate.length && crypto.timingSafeEqual(candidate, expected);
}

// ---------- Load / save ----------

function load(): Database {
  if (!fs.existsSync(DB_FILE)) {
    const seeded = createSeedDatabase();
    write(seeded);
    console.log(`[db] created ${path.relative(process.cwd(), DB_FILE)} with demo data`);
    return seeded;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) as Database;
}

function write(db: Database): void {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  // Write to a temp file and rename so a crash never leaves half a file behind.
  const tmp = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2) + '\n');
  fs.renameSync(tmp, DB_FILE);
}

/** Read-only access to the current database. Do not modify the result; use `mutate`. */
export function getDb(): Database {
  cache ??= load();
  return cache;
}

/**
 * Runs `fn` against the database, then saves it and tells live listeners.
 * Node runs one request handler at a time, so check-then-write inside `fn` is atomic
 * (this is what makes "first provider to accept wins" safe).
 * `fn` works on a copy, so if it throws nothing it changed is kept.
 */
export function mutate<T>(fn: (db: Database) => T): T {
  const draft = structuredClone(getDb());
  const result = fn(draft);
  draft.version += 1;
  write(draft);
  cache = draft;
  for (const listener of listeners) listener(draft.version);
  return result;
}

/** Subscribe to database changes (used by the /api/events stream). Returns an unsubscribe function. */
export function onChange(listener: (version: number) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

type Collection = Exclude<keyof Database, 'version' | 'counters'>;

export function nextId(db: Database, collection: Collection): number {
  const id = (db.counters[collection] ?? 0) + 1;
  db.counters[collection] = id;
  return id;
}

export function toPublicUser(user: StoredUser): User {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

export const AVATAR_COLORS = ['#2563eb', '#16a34a', '#db2777', '#ea580c', '#7c3aed', '#0891b2', '#ca8a04'];

export function defaultSettings(userId: number): UserSettings {
  return {
    userId,
    notifications: { bookingUpdates: true, messages: true, promotions: false },
    language: 'en',
  };
}

// ---------- Demo data ----------

const CATEGORY_DETAILS: Record<string, { description: string; baseFee: number; min: number; max: number }> = {
  plumbing: { description: 'Leaks, blocked drains, taps, water tanks and pumps', baseFee: 1500, min: 1200, max: 2500 },
  electrical: { description: 'Wiring, sockets, breakers, lights and fans', baseFee: 1500, min: 1200, max: 2800 },
  'ac-refrigeration': { description: 'AC servicing, gas refills, fridge and freezer repair', baseFee: 2500, min: 1800, max: 3500 },
  carpentry: { description: 'Doors, windows, cupboards and furniture repair', baseFee: 1500, min: 1200, max: 2500 },
  masonry: { description: 'Walls, tiling, plastering and small construction', baseFee: 2000, min: 1500, max: 3000 },
  painting: { description: 'Interior and exterior painting, waterproofing', baseFee: 2000, min: 1300, max: 2500 },
  'appliance-repair': { description: 'Washing machines, ovens, TVs and small appliances', baseFee: 2000, min: 1500, max: 3000 },
  cleaning: { description: 'Home deep-cleaning, sofas, carpets and move-out cleans', baseFee: 1000, min: 800, max: 1500 },
  gardening: { description: 'Lawn care, hedge trimming, planting and landscaping', baseFee: 1000, min: 800, max: 1500 },
  other: { description: 'Anything else around the house', baseFee: 1500, min: 1000, max: 2500 },
};

export function createSeedDatabase(): Database {
  const created = '2026-10-01T08:00:00.000Z';
  const counters: Record<string, number> = {};
  const db: Database = {
    version: 1,
    counters,
    users: [],
    userSettings: [],
    addresses: [],
    categories: [],
    pricingRules: [],
    providerProfiles: [],
    serviceRequests: [],
    statusHistory: [],
    costProposals: [],
    messages: [],
    reviews: [],
    complaints: [],
    notifications: [],
    auditLogs: [],
  };

  SERVICE_CATEGORIES.forEach((c) => {
    const details = CATEGORY_DETAILS[c.slug];
    const category: Category = { id: nextId(db, 'categories'), slug: c.slug, name: c.name, description: details.description, isActive: true };
    db.categories.push(category);
    const rule: PricingRule = {
      id: nextId(db, 'pricingRules'),
      categoryId: category.id,
      baseFee: details.baseFee,
      minHourlyRate: details.min,
      maxHourlyRate: details.max,
      updatedAt: created,
    };
    db.pricingRules.push(rule);
  });
  const cat = (slug: string) => db.categories.find((c) => c.slug === slug)!.id;

  const addUser = (fullName: string, email: string, password: string, role: UserRole, phone: string): StoredUser => {
    const id = nextId(db, 'users');
    const user: StoredUser = {
      id,
      fullName,
      email,
      phone,
      role,
      isActive: true,
      avatarColor: AVATAR_COLORS[(id - 1) % AVATAR_COLORS.length],
      createdAt: created,
      passwordHash: hashPassword(password),
    };
    db.users.push(user);
    db.userSettings.push(defaultSettings(id));
    return user;
  };

  addUser('Ayesha Fernando', 'admin@helpdesk.lk', 'admin123', 'ADMIN', '+94 11 234 5678');
  const nimal = addUser('Nimal Perera', 'nimal@example.com', 'password123', 'CUSTOMER', '+94 71 234 5678');
  const shanika = addUser('Shanika Jayawardena', 'shanika@example.com', 'password123', 'CUSTOMER', '+94 76 555 1020');

  const addAddress = (userId: number, label: string, line1: string, city: string, latitude: number, longitude: number) => {
    const address: Address = { id: nextId(db, 'addresses'), userId, label, line1, city, district: 'Colombo', latitude, longitude, isDefault: true };
    db.addresses.push(address);
    return address;
  };
  const nimalHome = addAddress(nimal.id, 'Home', '12 Flower Road, Colombo 07', 'Colombo', 6.9105, 79.8635);
  const shanikaHome = addAddress(shanika.id, 'Home', '45 Stanley Thilakaratne Mw', 'Nugegoda', 6.8721, 79.889);

  const addProvider = (
    fullName: string,
    email: string,
    phone: string,
    profile: Omit<ProviderProfile, 'id' | 'userId' | 'averageRating' | 'totalReviews' | 'completedJobs' | 'submittedAt' | 'verifiedAt' | 'verificationNote'>,
    stats: { averageRating: number; totalReviews: number; completedJobs: number },
  ) => {
    const user = addUser(fullName, email, 'password123', 'PROVIDER', phone);
    db.providerProfiles.push({
      id: nextId(db, 'providerProfiles'),
      userId: user.id,
      ...profile,
      ...stats,
      verificationNote: null,
      submittedAt: created,
      verifiedAt: profile.status === 'APPROVED' ? created : null,
    });
    return user;
  };

  const kamal = addProvider(
    'Kamal Silva',
    'kamal@example.com',
    '+94 77 765 4321',
    { status: 'APPROVED', bio: 'Ten years fixing pipes, pumps and water tanks across Colombo.', yearsOfExperience: 10, categoryIds: [cat('plumbing')], hourlyRate: 1800, city: 'Dehiwala', latitude: 6.8511, longitude: 79.8659, isAvailable: true, nicNumber: '198512345678' },
    { averageRating: 4.8, totalReviews: 23, completedJobs: 41 },
  );
  addProvider(
    'Sunil Bandara',
    'sunil@example.com',
    '+94 71 998 1122',
    { status: 'APPROVED', bio: 'Licensed electrician. House wiring, DB boards, inverters and solar.', yearsOfExperience: 8, categoryIds: [cat('electrical')], hourlyRate: 2000, city: 'Rajagiriya', latitude: 6.91, longitude: 79.895, isAvailable: true, nicNumber: '198798765432' },
    { averageRating: 4.6, totalReviews: 17, completedJobs: 29 },
  );
  const ruwan = addProvider(
    'Ruwan Wijesinghe',
    'ruwan@example.com',
    '+94 75 410 7788',
    { status: 'APPROVED', bio: 'AC installation and servicing, fridge and washing machine repairs.', yearsOfExperience: 6, categoryIds: [cat('ac-refrigeration'), cat('appliance-repair')], hourlyRate: 2500, city: 'Colombo', latitude: 6.9271, longitude: 79.8612, isAvailable: true, nicNumber: '199011223344' },
    { averageRating: 4.7, totalReviews: 12, completedJobs: 20 },
  );
  addProvider(
    'Priya Rathnayake',
    'priya@example.com',
    '+94 70 222 3344',
    { status: 'APPROVED', bio: 'Deep cleaning and garden care. Eco-friendly products on request.', yearsOfExperience: 4, categoryIds: [cat('cleaning'), cat('gardening')], hourlyRate: 1200, city: 'Mount Lavinia', latitude: 6.839, longitude: 79.865, isAvailable: true, nicNumber: '199455667788' },
    { averageRating: 4.9, totalReviews: 31, completedJobs: 52 },
  );
  addProvider(
    'Dinesh Kumara',
    'dinesh@example.com',
    '+94 72 345 6677',
    { status: 'PENDING_VERIFICATION', bio: 'Carpenter and painter. Custom cupboards, doors and repainting.', yearsOfExperience: 5, categoryIds: [cat('carpentry'), cat('painting')], hourlyRate: 1600, city: 'Nugegoda', latitude: 6.8649, longitude: 79.8997, isAvailable: false, nicNumber: '199233445566' },
    { averageRating: 0, totalReviews: 0, completedJobs: 0 },
  );

  const fee = (categoryId: number) => db.pricingRules.find((r) => r.categoryId === categoryId)!.baseFee;
  const addRequest = (r: Partial<ServiceRequest> & Pick<ServiceRequest, 'customerId' | 'categoryId' | 'title' | 'description' | 'status'>, address: Address) => {
    const request: ServiceRequest = {
      id: nextId(db, 'serviceRequests'),
      requestedProviderId: null,
      providerId: null,
      address: address.line1,
      city: address.city,
      latitude: address.latitude,
      longitude: address.longitude,
      preferredDate: null,
      urgency: 'NORMAL',
      estimatedCost: fee(r.categoryId),
      finalCost: null,
      aiSummary: null,
      cancellationReason: null,
      cancelledById: null,
      createdAt: created,
      updatedAt: created,
      acceptedAt: null,
      onTheWayAt: null,
      startedAt: null,
      invoicedAt: null,
      completedAt: null,
      cancelledAt: null,
      ...r,
    };
    db.serviceRequests.push(request);
    return request;
  };
  const addHistory = (serviceRequestId: number, steps: [StatusHistory['fromStatus'], StatusHistory['toStatus'], number, string][]) => {
    for (const [fromStatus, toStatus, changedById, createdAt] of steps) {
      db.statusHistory.push({ id: nextId(db, 'statusHistory'), serviceRequestId, fromStatus, toStatus, changedById, note: null, createdAt });
    }
  };

  // 1. A finished job with a review.
  const done = addRequest(
    {
      customerId: nimal.id,
      providerId: kamal.id,
      categoryId: cat('plumbing'),
      title: 'Kitchen sink leaking',
      description: 'Water is leaking under the kitchen sink, the cabinet floor is wet every morning.',
      status: 'COMPLETED',
      finalCost: 4500,
      createdAt: '2026-10-05T03:10:00.000Z',
      updatedAt: '2026-10-05T07:45:00.000Z',
      acceptedAt: '2026-10-05T03:14:00.000Z',
      onTheWayAt: '2026-10-05T04:00:00.000Z',
      startedAt: '2026-10-05T04:40:00.000Z',
      invoicedAt: '2026-10-05T07:30:00.000Z',
      completedAt: '2026-10-05T07:45:00.000Z',
    },
    nimalHome,
  );
  addHistory(done.id, [
    [null, 'PENDING', nimal.id, '2026-10-05T03:10:00.000Z'],
    ['PENDING', 'ACCEPTED', kamal.id, '2026-10-05T03:14:00.000Z'],
    ['ACCEPTED', 'ON_THE_WAY', kamal.id, '2026-10-05T04:00:00.000Z'],
    ['ON_THE_WAY', 'IN_PROGRESS', kamal.id, '2026-10-05T04:40:00.000Z'],
    ['IN_PROGRESS', 'AWAITING_CUSTOMER_CONFIRMATION', kamal.id, '2026-10-05T07:30:00.000Z'],
    ['AWAITING_CUSTOMER_CONFIRMATION', 'COMPLETED', nimal.id, '2026-10-05T07:45:00.000Z'],
  ]);
  const review: Review = {
    id: nextId(db, 'reviews'),
    serviceRequestId: done.id,
    customerId: nimal.id,
    providerId: kamal.id,
    rating: 5,
    comment: 'Arrived on time, found the cracked trap quickly and cleaned up after. Highly recommend.',
    providerResponse: 'Thank you Nimal, happy to help any time!',
    createdAt: '2026-10-05T08:00:00.000Z',
  };
  db.reviews.push(review);

  // 2. An open request waiting for any electrician.
  const open = addRequest(
    {
      customerId: shanika.id,
      categoryId: cat('electrical'),
      title: 'Power socket sparking',
      description: 'The socket next to the fridge sparks when anything is plugged in and smells of burning.',
      status: 'PENDING',
      urgency: 'URGENT',
      aiSummary: 'Likely a loose or burnt socket terminal. Switch off that circuit at the breaker until it is checked.',
      createdAt: '2026-10-14T02:30:00.000Z',
      updatedAt: '2026-10-14T02:30:00.000Z',
    },
    shanikaHome,
  );
  addHistory(open.id, [[null, 'PENDING', shanika.id, '2026-10-14T02:30:00.000Z']]);

  // 3. An accepted job, ready for the provider to start the journey.
  const accepted = addRequest(
    {
      customerId: nimal.id,
      requestedProviderId: ruwan.id,
      providerId: ruwan.id,
      categoryId: cat('ac-refrigeration'),
      title: 'AC not cooling',
      description: 'Bedroom AC runs but only blows warm air. Last serviced about a year ago.',
      status: 'ACCEPTED',
      createdAt: '2026-10-14T01:00:00.000Z',
      updatedAt: '2026-10-14T01:20:00.000Z',
      acceptedAt: '2026-10-14T01:20:00.000Z',
    },
    nimalHome,
  );
  addHistory(accepted.id, [
    [null, 'PENDING', nimal.id, '2026-10-14T01:00:00.000Z'],
    ['PENDING', 'ACCEPTED', ruwan.id, '2026-10-14T01:20:00.000Z'],
  ]);
  db.messages.push({
    id: nextId(db, 'messages'),
    serviceRequestId: accepted.id,
    senderId: ruwan.id,
    body: 'Hi Nimal, I can come this afternoon. Is the outdoor unit easy to reach?',
    createdAt: '2026-10-14T01:22:00.000Z',
  });

  db.notifications.push({
    id: nextId(db, 'notifications'),
    userId: nimal.id,
    type: 'BOOKING_UPDATE',
    title: 'Provider assigned',
    body: 'Ruwan Wijesinghe accepted "AC not cooling".',
    serviceRequestId: accepted.id,
    readAt: null,
    createdAt: '2026-10-14T01:20:00.000Z',
  });

  return db;
}

/** Replace the database with fresh demo data. */
export function resetDatabase(): Database {
  cache = createSeedDatabase();
  write(cache);
  for (const listener of listeners) listener(cache.version);
  return cache;
}

// `npm run db:reset`
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href && process.argv.includes('--reset')) {
  resetDatabase();
  console.log(`[db] reset ${path.relative(process.cwd(), DB_FILE)} with demo data`);
}
