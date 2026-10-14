// REST API mounted at /api by server.ts. See docs/API_SPEC.md for every endpoint.
//
// Conventions:
// - Auth: `Authorization: Bearer <token>` (token from /auth/login or /auth/register).
// - Errors: `{ error: { message, details? } }` with a matching HTTP status.
// - Every write goes through `mutate()` so it is saved and pushed to /api/events listeners.

import crypto from 'node:crypto';
import express, { type NextFunction, type Request, type Response } from 'express';
import type {
  AdminBookingRow,
  AdminComplaintRow,
  AdminDashboardStats,
  AdminUserRow,
  BookingDetail,
  BookingStatus,
  CategorySlug,
  ComplaintStatus,
  Database,
  NotificationType,
  ProviderEarnings,
  ProviderStatus,
  ProviderSummary,
  ServiceRequest,
  StoredUser,
  Urgency,
  UserRole,
  VerificationRequest,
} from '../types/index.ts';
import { ACTIVE_BOOKING_STATUSES, BOOKING_STATUS_LABELS, PLATFORM_COMMISSION_RATE, canTransition } from '../types/index.ts';
import {
  AVATAR_COLORS,
  defaultSettings,
  getDb,
  hashPassword,
  mutate,
  nextId,
  nowIso,
  onChange,
  resetDatabase,
  toPublicUser,
  verifyPassword,
} from './db.ts';
import { classifyProblem, isAiConfigured } from './ai.ts';

export const router = express.Router();

// ---------- Errors & validation ----------

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: { field: string; message: string }[],
  ) {
    super(message);
  }
}

type Body = Record<string, unknown>;

class Validator {
  private errors: { field: string; message: string }[] = [];
  constructor(private body: Body) {}

  string(field: string, opts: { min?: number; max?: number; optional?: boolean } = {}): string | undefined {
    const value = this.body[field];
    if (value === undefined || value === null || value === '') {
      if (!opts.optional) this.errors.push({ field, message: `${field} is required` });
      return undefined;
    }
    if (typeof value !== 'string') {
      this.errors.push({ field, message: `${field} must be text` });
      return undefined;
    }
    const trimmed = value.trim();
    if (opts.min !== undefined && trimmed.length < opts.min) this.errors.push({ field, message: `${field} must be at least ${opts.min} characters` });
    if (opts.max !== undefined && trimmed.length > opts.max) this.errors.push({ field, message: `${field} must be at most ${opts.max} characters` });
    return trimmed;
  }

  number(field: string, opts: { min?: number; max?: number; optional?: boolean; integer?: boolean } = {}): number | undefined {
    const raw = this.body[field];
    if (raw === undefined || raw === null || raw === '') {
      if (!opts.optional) this.errors.push({ field, message: `${field} is required` });
      return undefined;
    }
    const value = typeof raw === 'string' ? Number(raw) : raw;
    if (typeof value !== 'number' || !Number.isFinite(value) || (opts.integer && !Number.isInteger(value))) {
      this.errors.push({ field, message: `${field} must be a${opts.integer ? 'n integer' : ' number'}` });
      return undefined;
    }
    if (opts.min !== undefined && value < opts.min) this.errors.push({ field, message: `${field} must be at least ${opts.min}` });
    if (opts.max !== undefined && value > opts.max) this.errors.push({ field, message: `${field} must be at most ${opts.max}` });
    return value;
  }

  boolean(field: string, opts: { optional?: boolean } = {}): boolean | undefined {
    const value = this.body[field];
    if (value === undefined) {
      if (!opts.optional) this.errors.push({ field, message: `${field} is required` });
      return undefined;
    }
    if (typeof value !== 'boolean') {
      this.errors.push({ field, message: `${field} must be true or false` });
      return undefined;
    }
    return value;
  }

  oneOf<T extends string>(field: string, allowed: readonly T[], opts: { optional?: boolean } = {}): T | undefined {
    const value = this.body[field];
    if (value === undefined || value === null || value === '') {
      if (!opts.optional) this.errors.push({ field, message: `${field} is required` });
      return undefined;
    }
    if (!allowed.includes(value as T)) {
      this.errors.push({ field, message: `${field} must be one of ${allowed.join(', ')}` });
      return undefined;
    }
    return value as T;
  }

  intArray(field: string, opts: { optional?: boolean; minLength?: number } = {}): number[] | undefined {
    const value = this.body[field];
    if (value === undefined) {
      if (!opts.optional) this.errors.push({ field, message: `${field} is required` });
      return undefined;
    }
    if (!Array.isArray(value) || !value.every((v) => Number.isInteger(v))) {
      this.errors.push({ field, message: `${field} must be a list of ids` });
      return undefined;
    }
    if (opts.minLength !== undefined && value.length < opts.minLength) this.errors.push({ field, message: `Choose at least ${opts.minLength}` });
    return value as number[];
  }

  check(): void {
    if (this.errors.length) throw new HttpError(400, 'Validation failed', this.errors);
  }
}

const validate = (req: Request) => new Validator((req.body ?? {}) as Body);

function idParam(req: Request, name = 'id'): number {
  const id = Number(req.params[name]);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(404, 'Not found');
  return id;
}

// ---------- Auth tokens ----------

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function authSecret(): string {
  return process.env.AUTH_SECRET || 'helpdesk-dev-secret';
}

function signToken(userId: number): string {
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp: Date.now() + TOKEN_TTL_MS })).toString('base64url');
  const signature = crypto.createHmac('sha256', authSecret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function readToken(token: string): number | null {
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = crypto.createHmac('sha256', authSecret()).update(payload).digest('base64url');
  if (expected.length !== signature.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null;
  try {
    const { uid, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { uid: number; exp: number };
    return exp > Date.now() ? uid : null;
  } catch {
    return null;
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: StoredUser;
  }
}

function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const userId = header.startsWith('Bearer ') ? readToken(header.slice(7)) : null;
  const user = userId ? getDb().users.find((u) => u.id === userId) : undefined;
  if (!user) throw new HttpError(401, 'Please log in again');
  if (!user.isActive) throw new HttpError(403, 'This account has been deactivated');
  req.user = user;
  next();
}

const requireRole =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) throw new HttpError(403, 'Your account cannot do this');
    next();
  };

const me = (req: Request) => req.user!;

// ---------- Helpers ----------

function notify(db: Database, userId: number, type: NotificationType, title: string, body: string, serviceRequestId: number | null = null) {
  const settings = db.userSettings.find((s) => s.userId === userId);
  if (settings && type === 'MESSAGE' && !settings.notifications.messages) return;
  if (settings && type === 'BOOKING_UPDATE' && !settings.notifications.bookingUpdates) return;
  db.notifications.push({ id: nextId(db, 'notifications'), userId, type, title, body, serviceRequestId, readAt: null, createdAt: nowIso() });
}

function audit(db: Database, actorId: number, action: string, entity: string, entityId: number, details: string) {
  db.auditLogs.push({ id: nextId(db, 'auditLogs'), actorId, action, entity, entityId, details, createdAt: nowIso() });
}

function providerSummary(db: Database, userId: number, includePhone = false): ProviderSummary | null {
  const profile = db.providerProfiles.find((p) => p.userId === userId);
  const user = db.users.find((u) => u.id === userId);
  if (!profile || !user) return null;
  return { ...profile, fullName: user.fullName, avatarColor: user.avatarColor, ...(includePhone ? { phone: user.phone } : {}) };
}

function findRequest(db: Database, id: number): ServiceRequest {
  const request = db.serviceRequests.find((r) => r.id === id);
  if (!request) throw new HttpError(404, 'Booking not found');
  return request;
}

/** Can this user see the booking? Providers can see open jobs they could accept. */
function canView(db: Database, user: StoredUser, request: ServiceRequest): boolean {
  if (user.role === 'ADMIN' || request.customerId === user.id || request.providerId === user.id) return true;
  if (user.role === 'PROVIDER' && request.status === 'PENDING') {
    const profile = db.providerProfiles.find((p) => p.userId === user.id);
    if (!profile || profile.status !== 'APPROVED') return false;
    return request.requestedProviderId ? request.requestedProviderId === user.id : profile.categoryIds.includes(request.categoryId);
  }
  return false;
}

function bookingDetail(db: Database, request: ServiceRequest, viewer: StoredUser): BookingDetail {
  const customer = db.users.find((u) => u.id === request.customerId)!;
  const isParty = viewer.role === 'ADMIN' || viewer.id === request.customerId || viewer.id === request.providerId;
  const active = ACTIVE_BOOKING_STATUSES.includes(request.status);
  const shareContact = isParty && active;
  return {
    ...request,
    // Providers browsing open jobs only see the area, not the exact address.
    address: isParty ? request.address : request.city,
    category: db.categories.find((c) => c.id === request.categoryId)!,
    customer: { id: customer.id, fullName: customer.fullName, avatarColor: customer.avatarColor, phone: shareContact || viewer.role === 'ADMIN' ? customer.phone : null },
    provider: request.providerId ? providerSummary(db, request.providerId, shareContact || viewer.role === 'ADMIN') : null,
    history: db.statusHistory.filter((h) => h.serviceRequestId === request.id),
    costProposals: db.costProposals.filter((p) => p.serviceRequestId === request.id),
    review: db.reviews.find((r) => r.serviceRequestId === request.id) ?? null,
    complaints: isParty ? db.complaints.filter((c) => c.serviceRequestId === request.id) : [],
  };
}

function setStatus(db: Database, request: ServiceRequest, to: BookingStatus, actorId: number, note: string | null = null) {
  if (!canTransition(request.status, to)) {
    throw new HttpError(409, `Cannot move a booking from "${BOOKING_STATUS_LABELS[request.status]}" to "${BOOKING_STATUS_LABELS[to]}"`);
  }
  const now = nowIso();
  db.statusHistory.push({ id: nextId(db, 'statusHistory'), serviceRequestId: request.id, fromStatus: request.status, toStatus: to, changedById: actorId, note, createdAt: now });
  request.status = to;
  request.updatedAt = now;
  if (to === 'ACCEPTED') request.acceptedAt = now;
  if (to === 'ON_THE_WAY') request.onTheWayAt = now;
  if (to === 'IN_PROGRESS' && !request.startedAt) request.startedAt = now;
  if (to === 'AWAITING_CUSTOMER_CONFIRMATION') request.invoicedAt = now;
  if (to === 'COMPLETED') request.completedAt = now;
  if (to === 'CANCELLED') request.cancelledAt = now;
}

function pricingFor(db: Database, categoryId: number) {
  return db.pricingRules.find((r) => r.categoryId === categoryId);
}

function emailTaken(db: Database, email: string) {
  return db.users.some((u) => u.email === email);
}

// ---------- Health & live updates ----------

router.get('/health', (_req, res) => {
  res.json({ ok: true, ai: isAiConfigured(), version: getDb().version });
});

/**
 * Server-sent events. Sends `{ version }` every time the database changes so open apps
 * refetch. Carries no data, so it needs no auth (EventSource cannot send headers).
 */
router.get('/events', (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  res.flushHeaders();
  const send = (version: number) => res.write(`data: ${JSON.stringify({ version })}\n\n`);
  send(getDb().version);
  const unsubscribe = onChange(send);
  const keepAlive = setInterval(() => res.write(': ping\n\n'), 25_000);
  req.on('close', () => {
    clearInterval(keepAlive);
    unsubscribe();
  });
});

// ---------- Auth ----------

router.post('/auth/register', (req, res) => {
  const v = validate(req);
  const fullName = v.string('fullName', { min: 2, max: 100 });
  const email = v.string('email', { max: 255 })?.toLowerCase();
  const password = v.string('password', { min: 8, max: 72 });
  const phone = v.string('phone', { optional: true, max: 20 });
  const role = v.oneOf('role', ['CUSTOMER', 'PROVIDER'] as const, { optional: true }) ?? 'CUSTOMER';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Validation failed', [{ field: 'email', message: 'Enter a valid email address' }]);
  v.check();

  const user = mutate((db) => {
    if (emailTaken(db, email!)) throw new HttpError(409, 'An account with this email already exists');
    const id = nextId(db, 'users');
    const stored: StoredUser = {
      id,
      fullName: fullName!,
      email: email!,
      phone: phone ?? null,
      role,
      isActive: true,
      avatarColor: AVATAR_COLORS[(id - 1) % AVATAR_COLORS.length],
      createdAt: nowIso(),
      passwordHash: hashPassword(password!),
    };
    db.users.push(stored);
    db.userSettings.push(defaultSettings(id));
    if (role === 'PROVIDER') {
      db.providerProfiles.push({
        id: nextId(db, 'providerProfiles'),
        userId: id,
        status: 'NOT_SUBMITTED',
        bio: '',
        yearsOfExperience: 0,
        categoryIds: [],
        hourlyRate: 1500,
        city: 'Colombo',
        latitude: 6.9271,
        longitude: 79.8612,
        isAvailable: false,
        averageRating: 0,
        totalReviews: 0,
        completedJobs: 0,
        nicNumber: null,
        verificationNote: null,
        submittedAt: null,
        verifiedAt: null,
      });
    }
    notify(db, id, 'SYSTEM', 'Welcome to HelpDesk', role === 'PROVIDER' ? 'Submit your verification details to start receiving jobs.' : 'Describe a problem or pick a service to get started.');
    return stored;
  });
  res.status(201).json({ token: signToken(user.id), user: toPublicUser(user) });
});

router.post('/auth/login', (req, res) => {
  const v = validate(req);
  const email = v.string('email')?.toLowerCase();
  const password = v.string('password');
  v.check();
  const user = getDb().users.find((u) => u.email === email);
  if (!user || !verifyPassword(password!, user.passwordHash)) throw new HttpError(401, 'Wrong email or password');
  if (!user.isActive) throw new HttpError(403, 'This account has been deactivated. Contact support.');
  res.json({ token: signToken(user.id), user: toPublicUser(user) });
});

router.get('/auth/me', requireAuth, (req, res) => {
  const user = me(req);
  res.json({ user: toPublicUser(user), providerProfile: getDb().providerProfiles.find((p) => p.userId === user.id) ?? null });
});

// ---------- Users (any role) ----------

router.patch('/users/me', requireAuth, (req, res) => {
  const v = validate(req);
  const fullName = v.string('fullName', { optional: true, min: 2, max: 100 });
  const phone = v.string('phone', { optional: true, max: 20 });
  v.check();
  const user = mutate((db) => {
    const user = db.users.find((u) => u.id === me(req).id)!;
    if (fullName) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    return user;
  });
  res.json({ user: toPublicUser(user) });
});

router.post('/users/me/change-password', requireAuth, (req, res) => {
  const v = validate(req);
  const currentPassword = v.string('currentPassword');
  const newPassword = v.string('newPassword', { min: 8, max: 72 });
  v.check();
  if (!verifyPassword(currentPassword!, me(req).passwordHash)) throw new HttpError(400, 'Validation failed', [{ field: 'currentPassword', message: 'Current password is wrong' }]);
  mutate((db) => {
    db.users.find((u) => u.id === me(req).id)!.passwordHash = hashPassword(newPassword!);
  });
  res.json({ ok: true });
});

router.get('/users/me/settings', requireAuth, (req, res) => {
  const db = getDb();
  res.json({ settings: db.userSettings.find((s) => s.userId === me(req).id) ?? defaultSettings(me(req).id) });
});

router.patch('/users/me/settings', requireAuth, (req, res) => {
  const body = (req.body ?? {}) as Body;
  const v = validate(req);
  const language = v.oneOf('language', ['en', 'si', 'ta'] as const, { optional: true });
  v.check();
  const prefs = (body.notifications ?? {}) as Record<string, unknown>;
  const settings = mutate((db) => {
    let settings = db.userSettings.find((s) => s.userId === me(req).id);
    if (!settings) {
      settings = defaultSettings(me(req).id);
      db.userSettings.push(settings);
    }
    for (const key of ['bookingUpdates', 'messages', 'promotions'] as const) {
      if (typeof prefs[key] === 'boolean') settings.notifications[key] = prefs[key] as boolean;
    }
    if (language) settings.language = language;
    return settings;
  });
  res.json({ settings });
});

router.get('/users/me/addresses', requireAuth, (req, res) => {
  res.json({ addresses: getDb().addresses.filter((a) => a.userId === me(req).id) });
});

router.post('/users/me/addresses', requireAuth, (req, res) => {
  const v = validate(req);
  const label = v.string('label', { min: 1, max: 40 });
  const line1 = v.string('line1', { min: 5, max: 255 });
  const city = v.string('city', { min: 2, max: 100 });
  const district = v.string('district', { optional: true, max: 100 }) ?? city;
  const latitude = v.number('latitude', { optional: true, min: -90, max: 90 }) ?? 6.9271;
  const longitude = v.number('longitude', { optional: true, min: -180, max: 180 }) ?? 79.8612;
  v.check();
  const address = mutate((db) => {
    const mine = db.addresses.filter((a) => a.userId === me(req).id);
    const address = { id: nextId(db, 'addresses'), userId: me(req).id, label: label!, line1: line1!, city: city!, district: district!, latitude, longitude, isDefault: mine.length === 0 };
    db.addresses.push(address);
    return address;
  });
  res.status(201).json({ address });
});

router.patch('/users/me/addresses/:id/default', requireAuth, (req, res) => {
  const id = idParam(req);
  mutate((db) => {
    const mine = db.addresses.filter((a) => a.userId === me(req).id);
    if (!mine.some((a) => a.id === id)) throw new HttpError(404, 'Address not found');
    for (const a of mine) a.isDefault = a.id === id;
  });
  res.json({ ok: true });
});

router.delete('/users/me/addresses/:id', requireAuth, (req, res) => {
  const id = idParam(req);
  mutate((db) => {
    const index = db.addresses.findIndex((a) => a.id === id && a.userId === me(req).id);
    if (index === -1) throw new HttpError(404, 'Address not found');
    const [removed] = db.addresses.splice(index, 1);
    const next = db.addresses.find((a) => a.userId === me(req).id);
    if (removed.isDefault && next) next.isDefault = true;
  });
  res.json({ ok: true });
});

// ---------- Catalog (public) ----------

router.get('/categories', (_req, res) => {
  const db = getDb();
  res.json({ categories: db.categories.filter((c) => c.isActive), pricingRules: db.pricingRules });
});

router.get('/providers', (req, res) => {
  const db = getDb();
  const categoryId = req.query.categoryId ? Number(req.query.categoryId) : null;
  const city = typeof req.query.city === 'string' ? req.query.city.toLowerCase() : null;
  const providers = db.providerProfiles
    .filter((p) => p.status === 'APPROVED' && db.users.find((u) => u.id === p.userId)?.isActive)
    .filter((p) => !categoryId || p.categoryIds.includes(categoryId))
    .filter((p) => !city || p.city.toLowerCase() === city)
    .map((p) => providerSummary(db, p.userId)!)
    .sort((a, b) => Number(b.isAvailable) - Number(a.isAvailable) || b.averageRating - a.averageRating);
  res.json({ providers });
});

router.get('/providers/:id', (req, res) => {
  const db = getDb();
  const id = idParam(req);
  const provider = providerSummary(db, id);
  if (!provider || provider.status !== 'APPROVED') throw new HttpError(404, 'Provider not found');
  const reviews = db.reviews
    .filter((r) => r.providerId === id)
    .map((r) => ({ ...r, customerName: db.users.find((u) => u.id === r.customerId)?.fullName ?? 'Customer' }))
    .reverse();
  res.json({ provider, reviews });
});

// ---------- AI ----------

router.post('/ai/classify', requireAuth, async (req, res) => {
  const v = validate(req);
  const description = v.string('description', { min: 5, max: 2000 });
  v.check();
  const db = getDb();
  const rules = db.pricingRules.map((rule) => ({ slug: db.categories.find((c) => c.id === rule.categoryId)!.slug as CategorySlug, rule }));
  const result = await classifyProblem(description!, rules);
  const category = db.categories.find((c) => c.slug === result.categorySlug)!;
  res.json({ classification: result, categoryId: category.id });
});

// ---------- Bookings (customer side) ----------

router.post('/service-requests', requireAuth, requireRole('CUSTOMER'), (req, res) => {
  const v = validate(req);
  const categoryId = v.number('categoryId', { integer: true });
  const title = v.string('title', { min: 3, max: 150 });
  const description = v.string('description', { min: 10, max: 2000 });
  const addressId = v.number('addressId', { integer: true });
  const requestedProviderId = v.number('requestedProviderId', { integer: true, optional: true });
  const preferredDate = v.string('preferredDate', { optional: true });
  const urgency = v.oneOf<Urgency>('urgency', ['LOW', 'NORMAL', 'URGENT'], { optional: true }) ?? 'NORMAL';
  const aiSummary = v.string('aiSummary', { optional: true, max: 1000 });
  v.check();

  const detail = mutate((db) => {
    const category = db.categories.find((c) => c.id === categoryId && c.isActive);
    if (!category) throw new HttpError(400, 'Validation failed', [{ field: 'categoryId', message: 'Choose a service' }]);
    const address = db.addresses.find((a) => a.id === addressId && a.userId === me(req).id);
    if (!address) throw new HttpError(400, 'Validation failed', [{ field: 'addressId', message: 'Choose one of your addresses' }]);
    if (requestedProviderId) {
      const provider = db.providerProfiles.find((p) => p.userId === requestedProviderId);
      if (!provider || provider.status !== 'APPROVED' || !provider.categoryIds.includes(category.id)) {
        throw new HttpError(400, 'Validation failed', [{ field: 'requestedProviderId', message: 'This provider does not offer that service' }]);
      }
    }
    const now = nowIso();
    const baseFee = pricingFor(db, category.id)?.baseFee ?? 1500;
    const request: ServiceRequest = {
      id: nextId(db, 'serviceRequests'),
      customerId: me(req).id,
      requestedProviderId: requestedProviderId ?? null,
      providerId: null,
      categoryId: category.id,
      title: title!,
      description: description!,
      address: address.line1,
      city: address.city,
      latitude: address.latitude,
      longitude: address.longitude,
      preferredDate: preferredDate ?? null,
      urgency,
      status: 'PENDING',
      estimatedCost: urgency === 'URGENT' ? Math.round(baseFee * 1.25) : baseFee,
      finalCost: null,
      aiSummary: aiSummary ?? null,
      cancellationReason: null,
      cancelledById: null,
      createdAt: now,
      updatedAt: now,
      acceptedAt: null,
      onTheWayAt: null,
      startedAt: null,
      invoicedAt: null,
      completedAt: null,
      cancelledAt: null,
    };
    db.serviceRequests.push(request);
    db.statusHistory.push({ id: nextId(db, 'statusHistory'), serviceRequestId: request.id, fromStatus: null, toStatus: 'PENDING', changedById: me(req).id, note: null, createdAt: now });

    const targets = requestedProviderId
      ? [requestedProviderId]
      : db.providerProfiles.filter((p) => p.status === 'APPROVED' && p.isAvailable && p.categoryIds.includes(category.id)).map((p) => p.userId);
    for (const userId of targets) {
      notify(db, userId, 'NEW_JOB', requestedProviderId ? 'New job request for you' : `New ${category.name} job nearby`, `${request.title} in ${request.city}`, request.id);
    }
    return bookingDetail(db, request, me(req));
  });
  res.status(201).json({ booking: detail });
});

/** "My bookings": customers see their own, providers their assigned jobs, admins everything. */
router.get('/service-requests', requireAuth, (req, res) => {
  const db = getDb();
  const user = me(req);
  const requests = db.serviceRequests.filter((r) => user.role === 'ADMIN' || r.customerId === user.id || r.providerId === user.id);
  res.json({ bookings: requests.map((r) => bookingDetail(db, r, user)).reverse() });
});

router.get('/service-requests/:id', requireAuth, (req, res) => {
  const db = getDb();
  const request = findRequest(db, idParam(req));
  if (!canView(db, me(req), request)) throw new HttpError(404, 'Booking not found');
  res.json({ booking: bookingDetail(db, request, me(req)) });
});

router.post('/service-requests/:id/cancel', requireAuth, (req, res) => {
  const v = validate(req);
  const reason = v.string('reason', { optional: true, max: 500 });
  v.check();
  const booking = mutate((db) => {
    const request = findRequest(db, idParam(req));
    const user = me(req);
    const isCustomer = request.customerId === user.id;
    const isProvider = request.providerId === user.id;
    if (!isCustomer && !isProvider && user.role !== 'ADMIN') throw new HttpError(404, 'Booking not found');
    if (isProvider && !isCustomer && request.status === 'PENDING') throw new HttpError(409, 'You have not accepted this job');
    if (request.status === 'IN_PROGRESS' || request.status === 'AWAITING_CUSTOMER_CONFIRMATION') {
      throw new HttpError(409, 'Work has already started. Raise a complaint instead of cancelling.');
    }
    setStatus(db, request, 'CANCELLED', user.id, reason ?? null);
    request.cancellationReason = reason ?? null;
    request.cancelledById = user.id;
    const who = user.role === 'ADMIN' ? 'HelpDesk support' : user.fullName;
    const others = [request.customerId, request.providerId].filter((id): id is number => id !== null && id !== user.id);
    for (const userId of others) notify(db, userId, 'BOOKING_UPDATE', 'Booking cancelled', `${who} cancelled "${request.title}".`, request.id);
    if (user.role === 'ADMIN') audit(db, user.id, 'CANCEL_BOOKING', 'ServiceRequest', request.id, reason ?? '');
    return bookingDetail(db, request, user);
  });
  res.json({ booking });
});

router.post('/service-requests/:id/respond-cost', requireAuth, requireRole('CUSTOMER'), (req, res) => {
  const v = validate(req);
  const proposalId = v.number('proposalId', { integer: true });
  const accept = v.boolean('accept');
  v.check();
  const booking = mutate((db) => {
    const request = findRequest(db, idParam(req));
    if (request.customerId !== me(req).id) throw new HttpError(404, 'Booking not found');
    const proposal = db.costProposals.find((p) => p.id === proposalId && p.serviceRequestId === request.id);
    if (!proposal) throw new HttpError(404, 'Cost proposal not found');
    if (proposal.status !== 'PENDING') throw new HttpError(409, 'You already answered this proposal');
    proposal.status = accept ? 'ACCEPTED' : 'REJECTED';
    proposal.respondedAt = nowIso();
    if (accept) request.finalCost = proposal.amount;
    request.updatedAt = nowIso();
    notify(db, proposal.providerId, 'COST_PROPOSAL', accept ? 'Quote accepted' : 'Quote declined', `${me(req).fullName} ${accept ? 'accepted' : 'declined'} your quote of LKR ${proposal.amount.toLocaleString()} for "${request.title}".`, request.id);
    return bookingDetail(db, request, me(req));
  });
  res.json({ booking });
});

router.post('/service-requests/:id/confirm-completion', requireAuth, requireRole('CUSTOMER'), (req, res) => {
  const v = validate(req);
  const confirmed = v.boolean('confirmed');
  const note = v.string('note', { optional: true, max: 500 });
  v.check();
  const booking = mutate((db) => {
    const request = findRequest(db, idParam(req));
    if (request.customerId !== me(req).id) throw new HttpError(404, 'Booking not found');
    if (confirmed) {
      setStatus(db, request, 'COMPLETED', me(req).id, note ?? null);
      const profile = db.providerProfiles.find((p) => p.userId === request.providerId);
      if (profile) profile.completedJobs += 1;
      notify(db, request.providerId!, 'BOOKING_UPDATE', 'Job completed', `${me(req).fullName} confirmed "${request.title}" is done. LKR ${(request.finalCost ?? 0).toLocaleString()} added to your earnings.`, request.id);
    } else {
      setStatus(db, request, 'IN_PROGRESS', me(req).id, note ?? 'Customer says the work is not finished');
      notify(db, request.providerId!, 'BOOKING_UPDATE', 'Customer says the job is not finished', note ?? `Please check "${request.title}" again.`, request.id);
    }
    return bookingDetail(db, request, me(req));
  });
  res.json({ booking });
});

router.post('/service-requests/:id/review', requireAuth, requireRole('CUSTOMER'), (req, res) => {
  const v = validate(req);
  const rating = v.number('rating', { integer: true, min: 1, max: 5 });
  const comment = v.string('comment', { optional: true, max: 1000 }) ?? '';
  v.check();
  const review = mutate((db) => {
    const request = findRequest(db, idParam(req));
    if (request.customerId !== me(req).id) throw new HttpError(404, 'Booking not found');
    if (request.status !== 'COMPLETED') throw new HttpError(409, 'You can review a job once it is completed');
    if (db.reviews.some((r) => r.serviceRequestId === request.id)) throw new HttpError(409, 'You already reviewed this job');
    const review = { id: nextId(db, 'reviews'), serviceRequestId: request.id, customerId: me(req).id, providerId: request.providerId!, rating: rating!, comment, providerResponse: null, createdAt: nowIso() };
    db.reviews.push(review);
    const profile = db.providerProfiles.find((p) => p.userId === request.providerId)!;
    profile.averageRating = Math.round(((profile.averageRating * profile.totalReviews + rating!) / (profile.totalReviews + 1)) * 10) / 10;
    profile.totalReviews += 1;
    notify(db, request.providerId!, 'REVIEW', `New ${rating}-star review`, comment || `${me(req).fullName} rated "${request.title}".`, request.id);
    return review;
  });
  res.status(201).json({ review });
});

router.post('/service-requests/:id/complaints', requireAuth, (req, res) => {
  const v = validate(req);
  const reason = v.string('reason', { min: 3, max: 100 });
  const description = v.string('description', { min: 10, max: 2000 });
  v.check();
  const complaint = mutate((db) => {
    const request = findRequest(db, idParam(req));
    const user = me(req);
    if (request.customerId !== user.id && request.providerId !== user.id) throw new HttpError(404, 'Booking not found');
    if (!request.providerId) throw new HttpError(409, 'No provider has been assigned yet. Cancel the request instead.');
    const now = nowIso();
    const complaint = { id: nextId(db, 'complaints'), serviceRequestId: request.id, raisedById: user.id, reason: reason!, description: description!, status: 'OPEN' as ComplaintStatus, resolution: null, createdAt: now, updatedAt: now };
    db.complaints.push(complaint);
    for (const admin of db.users.filter((u) => u.role === 'ADMIN')) {
      notify(db, admin.id, 'COMPLAINT', 'New complaint', `${user.fullName}: ${reason} ("${request.title}")`, request.id);
    }
    return complaint;
  });
  res.status(201).json({ complaint });
});

// ---------- Messages ----------

router.get('/service-requests/:id/messages', requireAuth, (req, res) => {
  const db = getDb();
  const request = findRequest(db, idParam(req));
  const user = me(req);
  if (user.role !== 'ADMIN' && request.customerId !== user.id && request.providerId !== user.id) throw new HttpError(404, 'Booking not found');
  res.json({ messages: db.messages.filter((m) => m.serviceRequestId === request.id) });
});

router.post('/service-requests/:id/messages', requireAuth, (req, res) => {
  const v = validate(req);
  const body = v.string('body', { min: 1, max: 1000 });
  v.check();
  const message = mutate((db) => {
    const request = findRequest(db, idParam(req));
    const user = me(req);
    if (request.customerId !== user.id && request.providerId !== user.id) throw new HttpError(404, 'Booking not found');
    if (!request.providerId) throw new HttpError(409, 'Chat opens once a provider accepts the job');
    const message = { id: nextId(db, 'messages'), serviceRequestId: request.id, senderId: user.id, body: body!, createdAt: nowIso() };
    db.messages.push(message);
    const otherId = user.id === request.customerId ? request.providerId : request.customerId;
    notify(db, otherId, 'MESSAGE', `Message from ${user.fullName}`, body!.slice(0, 120), request.id);
    return message;
  });
  res.status(201).json({ message });
});

// ---------- Provider ----------

function myProfile(db: Database, req: Request) {
  const profile = db.providerProfiles.find((p) => p.userId === me(req).id);
  if (!profile) throw new HttpError(404, 'Provider profile not found');
  return profile;
}

function requireApproved(db: Database, req: Request) {
  const profile = myProfile(db, req);
  if (profile.status !== 'APPROVED') throw new HttpError(403, 'Your account must be verified before you can take jobs');
  return profile;
}

router.get('/provider/me', requireAuth, requireRole('PROVIDER'), (req, res) => {
  res.json({ profile: myProfile(getDb(), req) });
});

router.patch('/provider/me', requireAuth, requireRole('PROVIDER'), (req, res) => {
  const v = validate(req);
  const bio = v.string('bio', { optional: true, max: 1000 });
  const yearsOfExperience = v.number('yearsOfExperience', { optional: true, integer: true, min: 0, max: 80 });
  const hourlyRate = v.number('hourlyRate', { optional: true, min: 0, max: 100_000 });
  const city = v.string('city', { optional: true, max: 100 });
  const isAvailable = v.boolean('isAvailable', { optional: true });
  const categoryIds = v.intArray('categoryIds', { optional: true, minLength: 1 });
  v.check();
  const profile = mutate((db) => {
    const profile = myProfile(db, req);
    if (categoryIds) {
      if (!categoryIds.every((id) => db.categories.some((c) => c.id === id))) throw new HttpError(400, 'Validation failed', [{ field: 'categoryIds', message: 'Unknown service' }]);
      profile.categoryIds = categoryIds;
    }
    if (bio !== undefined) profile.bio = bio;
    if (yearsOfExperience !== undefined) profile.yearsOfExperience = yearsOfExperience;
    if (hourlyRate !== undefined) profile.hourlyRate = hourlyRate;
    if (city !== undefined) profile.city = city;
    if (isAvailable !== undefined) {
      if (isAvailable && profile.status !== 'APPROVED') throw new HttpError(403, 'You can go online once your account is verified');
      profile.isAvailable = isAvailable;
    }
    return profile;
  });
  res.json({ profile });
});

router.post('/provider/me/verification', requireAuth, requireRole('PROVIDER'), (req, res) => {
  const v = validate(req);
  const nicNumber = v.string('nicNumber', { min: 10, max: 12 });
  const categoryIds = v.intArray('categoryIds', { minLength: 1 });
  const yearsOfExperience = v.number('yearsOfExperience', { integer: true, min: 0, max: 80 });
  const bio = v.string('bio', { min: 10, max: 1000 });
  const city = v.string('city', { min: 2, max: 100 });
  if (nicNumber && !/^(\d{9}[VvXx]|\d{12})$/.test(nicNumber)) throw new HttpError(400, 'Validation failed', [{ field: 'nicNumber', message: 'Enter a valid NIC number (e.g. 199012345678 or 901234567V)' }]);
  v.check();
  const profile = mutate((db) => {
    const profile = myProfile(db, req);
    if (profile.status === 'APPROVED') throw new HttpError(409, 'Your account is already verified');
    if (profile.status === 'SUSPENDED') throw new HttpError(403, 'Your account is suspended. Contact support.');
    Object.assign(profile, { nicNumber, categoryIds, yearsOfExperience, bio, city, status: 'PENDING_VERIFICATION' as ProviderStatus, submittedAt: nowIso(), verificationNote: null });
    for (const admin of db.users.filter((u) => u.role === 'ADMIN')) {
      notify(db, admin.id, 'VERIFICATION', 'Provider awaiting verification', `${me(req).fullName} submitted their documents.`);
    }
    return profile;
  });
  res.json({ profile });
});

/** The provider's job radar: open jobs in their trades plus requests sent directly to them. */
router.get('/provider/jobs/available', requireAuth, requireRole('PROVIDER'), (req, res) => {
  const db = getDb();
  const profile = myProfile(db, req);
  if (profile.status !== 'APPROVED') return void res.json({ bookings: [] });
  const jobs = db.serviceRequests
    .filter((r) => r.status === 'PENDING' && r.customerId !== profile.userId)
    .filter((r) => (r.requestedProviderId ? r.requestedProviderId === profile.userId : profile.categoryIds.includes(r.categoryId)))
    .map((r) => bookingDetail(db, r, me(req)));
  res.json({ bookings: jobs });
});

router.post('/service-requests/:id/accept', requireAuth, requireRole('PROVIDER'), (req, res) => {
  const booking = mutate((db) => {
    const profile = requireApproved(db, req);
    const request = findRequest(db, idParam(req));
    if (request.status !== 'PENDING') throw new HttpError(409, 'Another provider already took this job');
    if (request.requestedProviderId ? request.requestedProviderId !== profile.userId : !profile.categoryIds.includes(request.categoryId)) {
      throw new HttpError(403, 'This job is not in your services');
    }
    request.providerId = profile.userId;
    setStatus(db, request, 'ACCEPTED', profile.userId);
    notify(db, request.customerId, 'BOOKING_UPDATE', 'Provider assigned', `${me(req).fullName} accepted "${request.title}".`, request.id);
    return bookingDetail(db, request, me(req));
  });
  res.json({ booking });
});

/** A provider turns down a request sent directly to them; it opens up to everyone in that trade. */
router.post('/service-requests/:id/decline', requireAuth, requireRole('PROVIDER'), (req, res) => {
  mutate((db) => {
    const request = findRequest(db, idParam(req));
    if (request.status !== 'PENDING' || request.requestedProviderId !== me(req).id) throw new HttpError(409, 'Only pending requests sent to you can be declined');
    request.requestedProviderId = null;
    request.updatedAt = nowIso();
    const category = db.categories.find((c) => c.id === request.categoryId)!;
    notify(db, request.customerId, 'BOOKING_UPDATE', `${me(req).fullName} is not available`, `We opened "${request.title}" to all ${category.name} providers.`, request.id);
    for (const p of db.providerProfiles.filter((p) => p.status === 'APPROVED' && p.isAvailable && p.userId !== me(req).id && p.categoryIds.includes(request.categoryId))) {
      notify(db, p.userId, 'NEW_JOB', `New ${category.name} job nearby`, `${request.title} in ${request.city}`, request.id);
    }
  });
  res.json({ ok: true });
});

router.patch('/service-requests/:id/status', requireAuth, requireRole('PROVIDER'), (req, res) => {
  const v = validate(req);
  const status = v.oneOf<BookingStatus>('status', ['ON_THE_WAY', 'IN_PROGRESS', 'AWAITING_CUSTOMER_CONFIRMATION']);
  const finalCost = v.number('finalCost', { optional: true, min: 0, max: 10_000_000 });
  v.check();
  const booking = mutate((db) => {
    const request = findRequest(db, idParam(req));
    if (request.providerId !== me(req).id) throw new HttpError(404, 'Job not found');
    if (status === 'AWAITING_CUSTOMER_CONFIRMATION') {
      if (db.costProposals.some((p) => p.serviceRequestId === request.id && p.status === 'PENDING')) {
        throw new HttpError(409, 'Wait for the customer to answer your quote before submitting the invoice');
      }
      const accepted = db.costProposals.filter((p) => p.serviceRequestId === request.id && p.status === 'ACCEPTED').at(-1);
      request.finalCost = accepted?.amount ?? finalCost ?? request.finalCost ?? request.estimatedCost;
    }
    setStatus(db, request, status!, me(req).id);
    const messages: Partial<Record<BookingStatus, [string, string]>> = {
      ON_THE_WAY: ['Your provider is on the way', `${me(req).fullName} is heading to you.`],
      IN_PROGRESS: ['Work has started', `${me(req).fullName} started working on "${request.title}".`],
      AWAITING_CUSTOMER_CONFIRMATION: ['Please confirm the job', `Invoice: LKR ${(request.finalCost ?? 0).toLocaleString()}. Confirm the work is done.`],
    };
    const [title, body] = messages[status!]!;
    notify(db, request.customerId, 'BOOKING_UPDATE', title, body, request.id);
    return bookingDetail(db, request, me(req));
  });
  res.json({ booking });
});

router.post('/service-requests/:id/propose-cost', requireAuth, requireRole('PROVIDER'), (req, res) => {
  const v = validate(req);
  const amount = v.number('amount', { min: 1, max: 10_000_000 });
  const note = v.string('note', { min: 3, max: 500 });
  v.check();
  const booking = mutate((db) => {
    const request = findRequest(db, idParam(req));
    if (request.providerId !== me(req).id) throw new HttpError(404, 'Job not found');
    if (!['ACCEPTED', 'ON_THE_WAY', 'IN_PROGRESS'].includes(request.status)) throw new HttpError(409, 'You can only send a quote while the job is active');
    if (db.costProposals.some((p) => p.serviceRequestId === request.id && p.status === 'PENDING')) throw new HttpError(409, 'The customer has not answered your last quote yet');
    db.costProposals.push({ id: nextId(db, 'costProposals'), serviceRequestId: request.id, providerId: me(req).id, amount: amount!, note: note!, status: 'PENDING', createdAt: nowIso(), respondedAt: null });
    request.updatedAt = nowIso();
    notify(db, request.customerId, 'COST_PROPOSAL', 'New quote to approve', `${me(req).fullName} quoted LKR ${amount!.toLocaleString()}: ${note}`, request.id);
    return bookingDetail(db, request, me(req));
  });
  res.json({ booking });
});

router.get('/provider/earnings', requireAuth, requireRole('PROVIDER'), (req, res) => {
  const db = getDb();
  const done = db.serviceRequests.filter((r) => r.providerId === me(req).id && r.status === 'COMPLETED');
  const net = (r: ServiceRequest) => Math.round((r.finalCost ?? 0) * (1 - PLATFORM_COMMISSION_RATE));
  const gross = done.reduce((sum, r) => sum + (r.finalCost ?? 0), 0);
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const earnings: ProviderEarnings = {
    completedJobs: done.length,
    grossEarnings: gross,
    commission: Math.round(gross * PLATFORM_COMMISSION_RATE),
    netEarnings: done.reduce((sum, r) => sum + net(r), 0),
    thisWeekNet: done.filter((r) => r.completedAt && Date.parse(r.completedAt) > weekAgo).reduce((sum, r) => sum + net(r), 0),
    recent: done
      .slice(-10)
      .reverse()
      .map((r) => ({ serviceRequestId: r.id, title: r.title, completedAt: r.completedAt!, net: net(r) })),
  };
  res.json({ earnings });
});

router.get('/provider/reviews', requireAuth, requireRole('PROVIDER'), (req, res) => {
  const db = getDb();
  const reviews = db.reviews
    .filter((r) => r.providerId === me(req).id)
    .map((r) => ({ ...r, customerName: db.users.find((u) => u.id === r.customerId)?.fullName ?? 'Customer' }))
    .reverse();
  res.json({ reviews });
});

router.post('/reviews/:id/respond', requireAuth, requireRole('PROVIDER'), (req, res) => {
  const v = validate(req);
  const response = v.string('response', { min: 2, max: 1000 });
  v.check();
  const review = mutate((db) => {
    const review = db.reviews.find((r) => r.id === idParam(req) && r.providerId === me(req).id);
    if (!review) throw new HttpError(404, 'Review not found');
    review.providerResponse = response!;
    return review;
  });
  res.json({ review });
});

// ---------- Notifications ----------

router.get('/notifications', requireAuth, (req, res) => {
  const notifications = getDb()
    .notifications.filter((n) => n.userId === me(req).id)
    .slice(-50)
    .reverse();
  res.json({ notifications, unread: notifications.filter((n) => !n.readAt).length });
});

router.patch('/notifications/read-all', requireAuth, (req, res) => {
  mutate((db) => {
    const now = nowIso();
    for (const n of db.notifications) if (n.userId === me(req).id && !n.readAt) n.readAt = now;
  });
  res.json({ ok: true });
});

router.patch('/notifications/:id/read', requireAuth, (req, res) => {
  mutate((db) => {
    const notification = db.notifications.find((n) => n.id === idParam(req) && n.userId === me(req).id);
    if (!notification) throw new HttpError(404, 'Notification not found');
    notification.readAt ??= nowIso();
  });
  res.json({ ok: true });
});

// ---------- Admin ----------

const admin = express.Router();
admin.use(requireAuth, requireRole('ADMIN'));
router.use('/admin', admin);

admin.get('/dashboard', (_req, res) => {
  const db = getDb();
  const byStatus = Object.fromEntries(
    (['PENDING', 'ACCEPTED', 'ON_THE_WAY', 'IN_PROGRESS', 'AWAITING_CUSTOMER_CONFIRMATION', 'COMPLETED', 'CANCELLED'] as BookingStatus[]).map((s) => [s, 0]),
  ) as Record<BookingStatus, number>;
  for (const r of db.serviceRequests) byStatus[r.status] += 1;
  const completed = db.serviceRequests.filter((r) => r.status === 'COMPLETED');
  const gross = completed.reduce((sum, r) => sum + (r.finalCost ?? 0), 0);
  const stats: AdminDashboardStats = {
    totalUsers: db.users.length,
    totalCustomers: db.users.filter((u) => u.role === 'CUSTOMER').length,
    totalProviders: db.users.filter((u) => u.role === 'PROVIDER').length,
    pendingVerifications: db.providerProfiles.filter((p) => p.status === 'PENDING_VERIFICATION').length,
    activeBookings: db.serviceRequests.filter((r) => ACTIVE_BOOKING_STATUSES.includes(r.status)).length,
    completedBookings: completed.length,
    cancelledBookings: byStatus.CANCELLED,
    openComplaints: db.complaints.filter((c) => c.status === 'OPEN' || c.status === 'UNDER_REVIEW').length,
    grossBookingValue: gross,
    platformRevenue: Math.round(gross * PLATFORM_COMMISSION_RATE),
    bookingsByStatus: byStatus,
    bookingsByCategory: db.categories
      .map((c) => ({ categoryId: c.id, name: c.name, count: db.serviceRequests.filter((r) => r.categoryId === c.id).length }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count),
  };
  res.json({ stats });
});

admin.get('/users', (_req, res) => {
  const db = getDb();
  const users: AdminUserRow[] = db.users.map((u) => ({
    ...toPublicUser(u),
    providerStatus: db.providerProfiles.find((p) => p.userId === u.id)?.status ?? null,
    bookingCount: db.serviceRequests.filter((r) => r.customerId === u.id || r.providerId === u.id).length,
  }));
  res.json({ users });
});

admin.patch('/users/:id/status', (req, res) => {
  const v = validate(req);
  const isActive = v.boolean('isActive');
  v.check();
  const user = mutate((db) => {
    const user = db.users.find((u) => u.id === idParam(req));
    if (!user) throw new HttpError(404, 'User not found');
    if (user.id === me(req).id) throw new HttpError(409, 'You cannot deactivate your own account');
    user.isActive = isActive!;
    if (!isActive) {
      const profile = db.providerProfiles.find((p) => p.userId === user.id);
      if (profile) profile.isAvailable = false;
    }
    audit(db, me(req).id, isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER', 'User', user.id, user.email);
    return user;
  });
  res.json({ user: toPublicUser(user) });
});

admin.get('/verifications', (_req, res) => {
  const db = getDb();
  const requests: VerificationRequest[] = db.providerProfiles
    .filter((p) => p.status !== 'NOT_SUBMITTED')
    .map((p) => {
      const summary = providerSummary(db, p.userId, true)!;
      return {
        ...summary,
        email: db.users.find((u) => u.id === p.userId)!.email,
        categoryNames: p.categoryIds.map((id) => db.categories.find((c) => c.id === id)?.name ?? '?'),
      };
    })
    .sort((a, b) => Number(b.status === 'PENDING_VERIFICATION') - Number(a.status === 'PENDING_VERIFICATION'));
  res.json({ providers: requests });
});

admin.patch('/providers/:id/verification', (req, res) => {
  const v = validate(req);
  const status = v.oneOf<ProviderStatus>('status', ['APPROVED', 'REJECTED', 'SUSPENDED']);
  const note = v.string('note', { optional: true, max: 500 });
  v.check();
  if (status === 'REJECTED' && !note) throw new HttpError(400, 'Validation failed', [{ field: 'note', message: 'Tell the provider why they were rejected' }]);
  const profile = mutate((db) => {
    const profile = db.providerProfiles.find((p) => p.userId === idParam(req));
    if (!profile) throw new HttpError(404, 'Provider not found');
    profile.status = status!;
    profile.verificationNote = note ?? null;
    if (status === 'APPROVED') {
      profile.verifiedAt = nowIso();
      profile.isAvailable = true;
    } else {
      profile.isAvailable = false;
    }
    const titles: Record<string, [string, string]> = {
      APPROVED: ['You are verified!', 'Your account is approved. You are now online and will receive jobs.'],
      REJECTED: ['Verification not approved', note ?? 'Please check your details and submit again.'],
      SUSPENDED: ['Account suspended', note ?? 'Contact HelpDesk support for details.'],
    };
    notify(db, profile.userId, 'VERIFICATION', titles[status!][0], titles[status!][1]);
    audit(db, me(req).id, `PROVIDER_${status}`, 'ProviderProfile', profile.userId, note ?? '');
    return profile;
  });
  res.json({ profile });
});

admin.get('/bookings', (_req, res) => {
  const db = getDb();
  const bookings: AdminBookingRow[] = db.serviceRequests
    .map((r) => ({
      ...r,
      customerName: db.users.find((u) => u.id === r.customerId)?.fullName ?? '?',
      providerName: r.providerId ? (db.users.find((u) => u.id === r.providerId)?.fullName ?? '?') : null,
      categoryName: db.categories.find((c) => c.id === r.categoryId)?.name ?? '?',
    }))
    .reverse();
  res.json({ bookings });
});

admin.get('/complaints', (_req, res) => {
  const db = getDb();
  const complaints: AdminComplaintRow[] = db.complaints
    .map((c) => ({
      ...c,
      raisedByName: db.users.find((u) => u.id === c.raisedById)?.fullName ?? '?',
      bookingTitle: db.serviceRequests.find((r) => r.id === c.serviceRequestId)?.title ?? '?',
    }))
    .reverse();
  res.json({ complaints });
});

admin.patch('/complaints/:id', (req, res) => {
  const v = validate(req);
  const status = v.oneOf<ComplaintStatus>('status', ['UNDER_REVIEW', 'RESOLVED', 'DISMISSED']);
  const resolution = v.string('resolution', { optional: true, max: 1000 });
  v.check();
  if (status !== 'UNDER_REVIEW' && !resolution) throw new HttpError(400, 'Validation failed', [{ field: 'resolution', message: 'Describe how this was resolved' }]);
  const complaint = mutate((db) => {
    const complaint = db.complaints.find((c) => c.id === idParam(req));
    if (!complaint) throw new HttpError(404, 'Complaint not found');
    complaint.status = status!;
    complaint.resolution = resolution ?? complaint.resolution;
    complaint.updatedAt = nowIso();
    notify(db, complaint.raisedById, 'COMPLAINT', `Complaint ${status!.toLowerCase().replace('_', ' ')}`, resolution ?? 'Our team is looking into it.', complaint.serviceRequestId);
    audit(db, me(req).id, `COMPLAINT_${status}`, 'Complaint', complaint.id, resolution ?? '');
    return complaint;
  });
  res.json({ complaint });
});

admin.get('/pricing-rules', (_req, res) => {
  const db = getDb();
  res.json({ pricingRules: db.pricingRules.map((r) => ({ ...r, categoryName: db.categories.find((c) => c.id === r.categoryId)?.name ?? '?' })) });
});

admin.patch('/pricing-rules/:id', (req, res) => {
  const v = validate(req);
  const baseFee = v.number('baseFee', { optional: true, min: 0, max: 1_000_000 });
  const minHourlyRate = v.number('minHourlyRate', { optional: true, min: 0, max: 1_000_000 });
  const maxHourlyRate = v.number('maxHourlyRate', { optional: true, min: 0, max: 1_000_000 });
  v.check();
  const rule = mutate((db) => {
    const rule = db.pricingRules.find((r) => r.id === idParam(req));
    if (!rule) throw new HttpError(404, 'Pricing rule not found');
    const nextMin = minHourlyRate ?? rule.minHourlyRate;
    const nextMax = maxHourlyRate ?? rule.maxHourlyRate;
    if (nextMin > nextMax) throw new HttpError(400, 'Validation failed', [{ field: 'minHourlyRate', message: 'Minimum rate must not be above the maximum' }]);
    Object.assign(rule, { baseFee: baseFee ?? rule.baseFee, minHourlyRate: nextMin, maxHourlyRate: nextMax, updatedAt: nowIso() });
    audit(db, me(req).id, 'UPDATE_PRICING', 'PricingRule', rule.id, `base ${rule.baseFee}, hourly ${nextMin}-${nextMax}`);
    return rule;
  });
  res.json({ pricingRule: rule });
});

admin.get('/audit-logs', (_req, res) => {
  const db = getDb();
  res.json({
    auditLogs: db.auditLogs
      .slice(-100)
      .reverse()
      .map((l) => ({ ...l, actorName: db.users.find((u) => u.id === l.actorId)?.fullName ?? '?' })),
  });
});

/** Put the demo data back (handy before a demo). */
admin.post('/reset-demo', (_req, res) => {
  resetDatabase();
  res.json({ ok: true });
});

// ---------- 404 & error handler ----------

router.use((_req, _res) => {
  throw new HttpError(404, 'API route not found');
});

router.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    return void res.status(err.status).json({ error: { message: err.message, ...(err.details ? { details: err.details } : {}) } });
  }
  if (err instanceof SyntaxError && 'body' in err) {
    return void res.status(400).json({ error: { message: 'Request body is not valid JSON' } });
  }
  console.error('[api]', err);
  res.status(500).json({ error: { message: 'Something went wrong on our side' } });
});
