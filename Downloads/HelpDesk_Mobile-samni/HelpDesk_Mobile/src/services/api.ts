// Browser API client for the HelpDesk server (/api). Each app (customer, provider, admin)
// has its own login, so the client is created per app with that app's token.

import { useEffect, useState } from 'react';
import type {
  Address,
  AdminBookingRow,
  AdminComplaintRow,
  AdminDashboardStats,
  AdminUserRow,
  AiClassification,
  AppNotification,
  AuditLog,
  AuthResponse,
  BookingDetail,
  BookingStatus,
  Category,
  ComplaintStatus,
  Complaint,
  MeResponse,
  Message,
  PricingRule,
  ProviderEarnings,
  ProviderProfile,
  ProviderStatus,
  ProviderSummary,
  Review,
  User,
  UserRole,
  UserSettings,
  Urgency,
  VerificationRequest,
} from '../types';

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    message: string,
    public details: { field: string; message: string }[] = [],
  ) {
    super(message);
  }

  /** The message for one form field, if the server rejected it. */
  fieldError(field: string): string | undefined {
    return this.details.find((d) => d.field === field)?.message;
  }
}

export type ReviewWithName = Review & { customerName: string };

async function request<T>(path: string, token: string | null, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: init.method ?? 'GET',
      headers: {
        ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiRequestError(0, 'Cannot reach the HelpDesk server. Is it running?');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = (data as { error?: { message?: string; details?: { field: string; message: string }[] } }).error;
    throw new ApiRequestError(res.status, error?.message ?? `Request failed (${res.status})`, error?.details);
  }
  return data as T;
}

export function createApiClient(getToken: () => string | null) {
  const get = <T>(path: string) => request<T>(path, getToken());
  const send = <T>(method: string, path: string, body?: unknown) => request<T>(path, getToken(), { method, body: body ?? {} });

  return {
    auth: {
      login: (email: string, password: string) => send<AuthResponse>('POST', '/auth/login', { email, password }),
      register: (body: { fullName: string; email: string; password: string; phone?: string; role: Exclude<UserRole, 'ADMIN'> }) =>
        send<AuthResponse>('POST', '/auth/register', body),
      me: () => get<MeResponse>('/auth/me'),
    },
    users: {
      update: (body: { fullName?: string; phone?: string }) => send<{ user: User }>('PATCH', '/users/me', body),
      changePassword: (currentPassword: string, newPassword: string) => send<{ ok: true }>('POST', '/users/me/change-password', { currentPassword, newPassword }),
      settings: () => get<{ settings: UserSettings }>('/users/me/settings'),
      updateSettings: (body: Partial<Omit<UserSettings, 'userId'>>) => send<{ settings: UserSettings }>('PATCH', '/users/me/settings', body),
      addresses: () => get<{ addresses: Address[] }>('/users/me/addresses'),
      addAddress: (body: { label: string; line1: string; city: string; district?: string }) => send<{ address: Address }>('POST', '/users/me/addresses', body),
      setDefaultAddress: (id: number) => send<{ ok: true }>('PATCH', `/users/me/addresses/${id}/default`),
      deleteAddress: (id: number) => send<{ ok: true }>('DELETE', `/users/me/addresses/${id}`),
    },
    catalog: {
      categories: () => get<{ categories: Category[]; pricingRules: PricingRule[] }>('/categories'),
      providers: (categoryId?: number) => get<{ providers: ProviderSummary[] }>(`/providers${categoryId ? `?categoryId=${categoryId}` : ''}`),
      provider: (id: number) => get<{ provider: ProviderSummary; reviews: ReviewWithName[] }>(`/providers/${id}`),
    },
    ai: {
      classify: (description: string) => send<{ classification: AiClassification; categoryId: number }>('POST', '/ai/classify', { description }),
    },
    bookings: {
      create: (body: {
        categoryId: number;
        title: string;
        description: string;
        addressId: number;
        requestedProviderId?: number;
        preferredDate?: string;
        urgency?: Urgency;
        aiSummary?: string;
      }) => send<{ booking: BookingDetail }>('POST', '/service-requests', body),
      list: () => get<{ bookings: BookingDetail[] }>('/service-requests'),
      get: (id: number) => get<{ booking: BookingDetail }>(`/service-requests/${id}`),
      cancel: (id: number, reason?: string) => send<{ booking: BookingDetail }>('POST', `/service-requests/${id}/cancel`, { reason }),
      respondCost: (id: number, proposalId: number, accept: boolean) => send<{ booking: BookingDetail }>('POST', `/service-requests/${id}/respond-cost`, { proposalId, accept }),
      confirmCompletion: (id: number, confirmed: boolean, note?: string) => send<{ booking: BookingDetail }>('POST', `/service-requests/${id}/confirm-completion`, { confirmed, note }),
      review: (id: number, rating: number, comment: string) => send<{ review: Review }>('POST', `/service-requests/${id}/review`, { rating, comment }),
      complain: (id: number, reason: string, description: string) => send<{ complaint: Complaint }>('POST', `/service-requests/${id}/complaints`, { reason, description }),
      messages: (id: number) => get<{ messages: Message[] }>(`/service-requests/${id}/messages`),
      sendMessage: (id: number, body: string) => send<{ message: Message }>('POST', `/service-requests/${id}/messages`, { body }),
    },
    provider: {
      me: () => get<{ profile: ProviderProfile }>('/provider/me'),
      update: (body: Partial<Pick<ProviderProfile, 'bio' | 'yearsOfExperience' | 'hourlyRate' | 'city' | 'isAvailable' | 'categoryIds'>>) =>
        send<{ profile: ProviderProfile }>('PATCH', '/provider/me', body),
      submitVerification: (body: { nicNumber: string; categoryIds: number[]; yearsOfExperience: number; bio: string; city: string }) =>
        send<{ profile: ProviderProfile }>('POST', '/provider/me/verification', body),
      availableJobs: () => get<{ bookings: BookingDetail[] }>('/provider/jobs/available'),
      accept: (id: number) => send<{ booking: BookingDetail }>('POST', `/service-requests/${id}/accept`),
      decline: (id: number) => send<{ ok: true }>('POST', `/service-requests/${id}/decline`),
      setStatus: (id: number, status: Extract<BookingStatus, 'ON_THE_WAY' | 'IN_PROGRESS' | 'AWAITING_CUSTOMER_CONFIRMATION'>, finalCost?: number) =>
        send<{ booking: BookingDetail }>('PATCH', `/service-requests/${id}/status`, { status, finalCost }),
      proposeCost: (id: number, amount: number, note: string) => send<{ booking: BookingDetail }>('POST', `/service-requests/${id}/propose-cost`, { amount, note }),
      earnings: () => get<{ earnings: ProviderEarnings }>('/provider/earnings'),
      reviews: () => get<{ reviews: ReviewWithName[] }>('/provider/reviews'),
      respondToReview: (reviewId: number, response: string) => send<{ review: Review }>('POST', `/reviews/${reviewId}/respond`, { response }),
    },
    notifications: {
      list: () => get<{ notifications: AppNotification[]; unread: number }>('/notifications'),
      markRead: (id: number) => send<{ ok: true }>('PATCH', `/notifications/${id}/read`),
      markAllRead: () => send<{ ok: true }>('PATCH', '/notifications/read-all'),
    },
    admin: {
      dashboard: () => get<{ stats: AdminDashboardStats }>('/admin/dashboard'),
      users: () => get<{ users: AdminUserRow[] }>('/admin/users'),
      setUserActive: (id: number, isActive: boolean) => send<{ user: User }>('PATCH', `/admin/users/${id}/status`, { isActive }),
      verifications: () => get<{ providers: VerificationRequest[] }>('/admin/verifications'),
      setVerification: (userId: number, status: Extract<ProviderStatus, 'APPROVED' | 'REJECTED' | 'SUSPENDED'>, note?: string) =>
        send<{ profile: ProviderProfile }>('PATCH', `/admin/providers/${userId}/verification`, { status, note }),
      bookings: () => get<{ bookings: AdminBookingRow[] }>('/admin/bookings'),
      complaints: () => get<{ complaints: AdminComplaintRow[] }>('/admin/complaints'),
      updateComplaint: (id: number, status: Exclude<ComplaintStatus, 'OPEN'>, resolution?: string) =>
        send<{ complaint: Complaint }>('PATCH', `/admin/complaints/${id}`, { status, resolution }),
      pricingRules: () => get<{ pricingRules: (PricingRule & { categoryName: string })[] }>('/admin/pricing-rules'),
      updatePricingRule: (id: number, body: Partial<Pick<PricingRule, 'baseFee' | 'minHourlyRate' | 'maxHourlyRate'>>) =>
        send<{ pricingRule: PricingRule }>('PATCH', `/admin/pricing-rules/${id}`, body),
      auditLogs: () => get<{ auditLogs: (AuditLog & { actorName: string })[] }>('/admin/audit-logs'),
      resetDemo: () => send<{ ok: true }>('POST', '/admin/reset-demo'),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

// ---------- Live updates ----------

let source: EventSource | null = null;
let currentVersion = 0;
const subscribers = new Set<(version: number) => void>();

function ensureSource() {
  if (source || typeof EventSource === 'undefined') return;
  source = new EventSource('/api/events');
  source.onmessage = (event) => {
    const { version } = JSON.parse(event.data) as { version: number };
    currentVersion = version;
    for (const fn of subscribers) fn(version);
  };
}

/**
 * Returns a number that changes whenever anything in the database changes. Put it in a
 * `useEffect` dependency list to refetch, so every open app (e.g. both phones in Dual View)
 * stays in sync. One shared EventSource serves all components.
 */
export function useLiveVersion(): number {
  const [version, setVersion] = useState(currentVersion);
  useEffect(() => {
    ensureSource();
    subscribers.add(setVersion);
    return () => {
      subscribers.delete(setVersion);
    };
  }, []);
  return version;
}

/**
 * Loads data with `load` and reloads it whenever the database changes (and when `deps`
 * change). Keeps showing the previous data while reloading, so screens don't flicker.
 */
export function useLiveData<T>(load: (() => Promise<T>) | null, deps: unknown[] = []) {
  const version = useLiveVersion();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (!load) return;
    let cancelled = false;
    load()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError(null);
      })
      .catch((err: Error) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [version, reloadCount, ...deps]);

  return { data, error, loading: data === null && error === null, reload: () => setReloadCount((n) => n + 1) };
}

// ---------- Formatting helpers ----------

export function formatLkr(amount: number | null | undefined): string {
  return `LKR ${(amount ?? 0).toLocaleString('en-LK')}`;
}

export function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days < 7 ? `${days} d ago` : new Date(iso).toLocaleDateString('en-LK', { day: 'numeric', month: 'short' });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-LK', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}
