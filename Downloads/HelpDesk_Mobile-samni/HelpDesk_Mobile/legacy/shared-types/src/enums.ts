/**
 * Enums are written as `as const` objects plus a matching union type instead of
 * TypeScript `enum`s. They work the same in the API, Vite and Expo (Metro/Babel)
 * and serialise to plain strings in JSON.
 *
 *   const role: UserRole = UserRole.CUSTOMER; // 'CUSTOMER'
 */

type ValueOf<T> = T[keyof T];

export const CURRENCY = 'LKR' as const;
export type Currency = typeof CURRENCY;

export const UserRole = {
  CUSTOMER: 'CUSTOMER',
  PROVIDER: 'PROVIDER',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = ValueOf<typeof UserRole>;

export const ProviderStatus = {
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED',
} as const;
export type ProviderStatus = ValueOf<typeof ProviderStatus>;

export const BookingStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  ON_THE_WAY: 'ON_THE_WAY',
  IN_PROGRESS: 'IN_PROGRESS',
  AWAITING_CUSTOMER_CONFIRMATION: 'AWAITING_CUSTOMER_CONFIRMATION',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type BookingStatus = ValueOf<typeof BookingStatus>;

export const ServiceCategory = {
  PLUMBING: 'PLUMBING',
  ELECTRICAL: 'ELECTRICAL',
  AC_REFRIGERATION: 'AC_REFRIGERATION',
  CARPENTRY: 'CARPENTRY',
  MASONRY: 'MASONRY',
  PAINTING: 'PAINTING',
  APPLIANCE_REPAIR: 'APPLIANCE_REPAIR',
  CLEANING: 'CLEANING',
  GARDENING: 'GARDENING',
  OTHER: 'OTHER',
} as const;
export type ServiceCategory = ValueOf<typeof ServiceCategory>;

/** Display names for the UI. */
export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  PLUMBING: 'Plumbing',
  ELECTRICAL: 'Electrical',
  AC_REFRIGERATION: 'AC & Refrigeration',
  CARPENTRY: 'Carpentry',
  MASONRY: 'Masonry',
  PAINTING: 'Painting',
  APPLIANCE_REPAIR: 'Appliance Repair',
  CLEANING: 'Cleaning',
  GARDENING: 'Gardening',
  OTHER: 'Other',
};

export const ProviderDocumentType = {
  NIC_FRONT: 'NIC_FRONT',
  NIC_BACK: 'NIC_BACK',
  POLICE_CLEARANCE: 'POLICE_CLEARANCE',
  TRADE_CERTIFICATE: 'TRADE_CERTIFICATE',
  OTHER: 'OTHER',
} as const;
export type ProviderDocumentType = ValueOf<typeof ProviderDocumentType>;

export const DocumentReviewStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type DocumentReviewStatus = ValueOf<typeof DocumentReviewStatus>;

export const InvoiceStatus = {
  DRAFT: 'DRAFT',
  ISSUED: 'ISSUED',
  PAID: 'PAID',
  VOID: 'VOID',
} as const;
export type InvoiceStatus = ValueOf<typeof InvoiceStatus>;

export const DisputeStatus = {
  OPEN: 'OPEN',
  UNDER_REVIEW: 'UNDER_REVIEW',
  RESOLVED: 'RESOLVED',
  REJECTED: 'REJECTED',
} as const;
export type DisputeStatus = ValueOf<typeof DisputeStatus>;
