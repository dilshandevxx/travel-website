// Types shared by the browser app (src/components, src/services) and the server (src/server).
// Keep this file free of runtime imports so both sides can use it.

/** ISO 8601 date-time string. Dates travel as strings in JSON. */
export type ISODateString = string;
/** Amount in Sri Lankan rupees. */
export type LkrAmount = number;

export const CURRENCY = 'LKR';
/** Share of each completed job the platform keeps. */
export const PLATFORM_COMMISSION_RATE = 0.1;

// ---------- Roles & statuses ----------

export const UserRole = {
  CUSTOMER: 'CUSTOMER',
  PROVIDER: 'PROVIDER',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ProviderStatus = {
  NOT_SUBMITTED: 'NOT_SUBMITTED',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED',
} as const;
export type ProviderStatus = (typeof ProviderStatus)[keyof typeof ProviderStatus];

export const BookingStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  ON_THE_WAY: 'ON_THE_WAY',
  IN_PROGRESS: 'IN_PROGRESS',
  AWAITING_CUSTOMER_CONFIRMATION: 'AWAITING_CUSTOMER_CONFIRMATION',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

/**
 * PENDING -> ACCEPTED -> ON_THE_WAY -> IN_PROGRESS -> AWAITING_CUSTOMER_CONFIRMATION -> COMPLETED
 * Cancellation is allowed until work starts. The customer can send a job back to IN_PROGRESS
 * instead of confirming. COMPLETED and CANCELLED are final.
 */
export const BOOKING_STATUS_TRANSITIONS: Readonly<Record<BookingStatus, readonly BookingStatus[]>> = {
  PENDING: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['ON_THE_WAY', 'CANCELLED'],
  ON_THE_WAY: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['AWAITING_CUSTOMER_CONFIRMATION'],
  AWAITING_CUSTOMER_CONFIRMATION: ['COMPLETED', 'IN_PROGRESS'],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return BOOKING_STATUS_TRANSITIONS[from].includes(to);
}

/** The steps shown by the customer tracker (CANCELLED is not a step). */
export const BOOKING_TRACKER_STEPS: readonly BookingStatus[] = [
  'PENDING',
  'ACCEPTED',
  'ON_THE_WAY',
  'IN_PROGRESS',
  'AWAITING_CUSTOMER_CONFIRMATION',
  'COMPLETED',
];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: 'Finding a provider',
  ACCEPTED: 'Provider assigned',
  ON_THE_WAY: 'On the way',
  IN_PROGRESS: 'Work in progress',
  AWAITING_CUSTOMER_CONFIRMATION: 'Awaiting your confirmation',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

/** Statuses in which a job still needs someone to act. */
export const ACTIVE_BOOKING_STATUSES: readonly BookingStatus[] = [
  'PENDING',
  'ACCEPTED',
  'ON_THE_WAY',
  'IN_PROGRESS',
  'AWAITING_CUSTOMER_CONFIRMATION',
];

export type Urgency = 'LOW' | 'NORMAL' | 'URGENT';

// ---------- Categories ----------

export const SERVICE_CATEGORIES = [
  { slug: 'plumbing', name: 'Plumbing' },
  { slug: 'electrical', name: 'Electrical' },
  { slug: 'ac-refrigeration', name: 'AC & Refrigeration' },
  { slug: 'carpentry', name: 'Carpentry' },
  { slug: 'masonry', name: 'Masonry' },
  { slug: 'painting', name: 'Painting' },
  { slug: 'appliance-repair', name: 'Appliance Repair' },
  { slug: 'cleaning', name: 'Cleaning' },
  { slug: 'gardening', name: 'Gardening' },
  { slug: 'other', name: 'Other' },
] as const;
export type CategorySlug = (typeof SERVICE_CATEGORIES)[number]['slug'];

export interface Category {
  id: number;
  slug: CategorySlug;
  name: string;
  description: string;
  isActive: boolean;
}

export interface PricingRule {
  id: number;
  categoryId: number;
  /** Visit / call-out fee. */
  baseFee: LkrAmount;
  minHourlyRate: LkrAmount;
  maxHourlyRate: LkrAmount;
  updatedAt: ISODateString;
}

// ---------- Users ----------

export interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  avatarColor: string;
  createdAt: ISODateString;
}

/** A user row as stored on the server (never sent to clients). */
export interface StoredUser extends User {
  passwordHash: string;
}

export interface NotificationPreferences {
  bookingUpdates: boolean;
  messages: boolean;
  promotions: boolean;
}

export interface UserSettings {
  userId: number;
  notifications: NotificationPreferences;
  language: 'en' | 'si' | 'ta';
}

export interface Address {
  id: number;
  userId: number;
  label: string;
  line1: string;
  city: string;
  district: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

// ---------- Providers ----------

export interface ProviderProfile {
  id: number;
  userId: number;
  status: ProviderStatus;
  bio: string;
  yearsOfExperience: number;
  categoryIds: number[];
  hourlyRate: LkrAmount;
  city: string;
  latitude: number;
  longitude: number;
  isAvailable: boolean;
  averageRating: number;
  totalReviews: number;
  completedJobs: number;
  nicNumber: string | null;
  verificationNote: string | null;
  submittedAt: ISODateString | null;
  verifiedAt: ISODateString | null;
}

/** Public view of a provider: profile plus the user's display fields. */
export interface ProviderSummary extends ProviderProfile {
  fullName: string;
  avatarColor: string;
  /** Only filled in for parties to an active booking. */
  phone?: string | null;
}

// ---------- Bookings ----------

export interface ServiceRequest {
  id: number;
  customerId: number;
  /** Set when the customer picked a provider (direct request); otherwise open to all. */
  requestedProviderId: number | null;
  /** Null until a provider accepts the job. */
  providerId: number | null;
  categoryId: number;
  title: string;
  description: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  preferredDate: ISODateString | null;
  urgency: Urgency;
  status: BookingStatus;
  estimatedCost: LkrAmount;
  finalCost: LkrAmount | null;
  aiSummary: string | null;
  cancellationReason: string | null;
  cancelledById: number | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  acceptedAt: ISODateString | null;
  onTheWayAt: ISODateString | null;
  startedAt: ISODateString | null;
  invoicedAt: ISODateString | null;
  completedAt: ISODateString | null;
  cancelledAt: ISODateString | null;
}

export interface StatusHistory {
  id: number;
  serviceRequestId: number;
  fromStatus: BookingStatus | null;
  toStatus: BookingStatus;
  changedById: number;
  note: string | null;
  createdAt: ISODateString;
}

export type CostProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface CostProposal {
  id: number;
  serviceRequestId: number;
  providerId: number;
  amount: LkrAmount;
  note: string;
  status: CostProposalStatus;
  createdAt: ISODateString;
  respondedAt: ISODateString | null;
}

export interface Message {
  id: number;
  serviceRequestId: number;
  senderId: number;
  body: string;
  createdAt: ISODateString;
}

export interface Review {
  id: number;
  serviceRequestId: number;
  customerId: number;
  providerId: number;
  /** 1-5 */
  rating: number;
  comment: string;
  providerResponse: string | null;
  createdAt: ISODateString;
}

export type ComplaintStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';

export interface Complaint {
  id: number;
  serviceRequestId: number;
  raisedById: number;
  reason: string;
  description: string;
  status: ComplaintStatus;
  resolution: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type NotificationType =
  | 'BOOKING_UPDATE'
  | 'NEW_JOB'
  | 'COST_PROPOSAL'
  | 'MESSAGE'
  | 'REVIEW'
  | 'VERIFICATION'
  | 'COMPLAINT'
  | 'SYSTEM';

export interface AppNotification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  body: string;
  serviceRequestId: number | null;
  readAt: ISODateString | null;
  createdAt: ISODateString;
}

export interface AuditLog {
  id: number;
  actorId: number;
  action: string;
  entity: string;
  entityId: number;
  details: string;
  createdAt: ISODateString;
}

/** Everything a party to a booking needs to render it. */
export interface BookingDetail extends ServiceRequest {
  category: Category;
  customer: Pick<User, 'id' | 'fullName' | 'phone' | 'avatarColor'>;
  provider: ProviderSummary | null;
  history: StatusHistory[];
  costProposals: CostProposal[];
  review: Review | null;
  complaints: Complaint[];
}

// ---------- The JSON database ----------

export interface Database {
  version: number;
  counters: Record<string, number>;
  users: StoredUser[];
  userSettings: UserSettings[];
  addresses: Address[];
  categories: Category[];
  pricingRules: PricingRule[];
  providerProfiles: ProviderProfile[];
  serviceRequests: ServiceRequest[];
  statusHistory: StatusHistory[];
  costProposals: CostProposal[];
  messages: Message[];
  reviews: Review[];
  complaints: Complaint[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];
}

// ---------- API payloads ----------

export interface ApiError {
  error: { message: string; details?: { field: string; message: string }[] };
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface MeResponse {
  user: User;
  providerProfile: ProviderProfile | null;
}

export interface AiClassification {
  categorySlug: CategorySlug;
  title: string;
  summary: string;
  urgency: Urgency;
  estimatedCostRange: { min: LkrAmount; max: LkrAmount };
  safetyTips: string[];
  /** 'gemini' when the model answered, 'fallback' when the keyword classifier did. */
  source: 'gemini' | 'fallback';
}

export interface ProviderEarnings {
  completedJobs: number;
  grossEarnings: LkrAmount;
  commission: LkrAmount;
  netEarnings: LkrAmount;
  thisWeekNet: LkrAmount;
  recent: { serviceRequestId: number; title: string; completedAt: ISODateString; net: LkrAmount }[];
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalCustomers: number;
  totalProviders: number;
  pendingVerifications: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  openComplaints: number;
  grossBookingValue: LkrAmount;
  platformRevenue: LkrAmount;
  bookingsByStatus: Record<BookingStatus, number>;
  bookingsByCategory: { categoryId: number; name: string; count: number }[];
}

export interface AdminUserRow extends User {
  providerStatus: ProviderStatus | null;
  bookingCount: number;
}

export interface AdminBookingRow extends ServiceRequest {
  customerName: string;
  providerName: string | null;
  categoryName: string;
}

export interface AdminComplaintRow extends Complaint {
  raisedByName: string;
  bookingTitle: string;
}

export interface VerificationRequest extends ProviderSummary {
  email: string;
  categoryNames: string[];
}
