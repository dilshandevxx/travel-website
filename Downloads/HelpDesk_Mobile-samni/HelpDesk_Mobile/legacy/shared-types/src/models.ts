import type {
  BookingStatus,
  Currency,
  DisputeStatus,
  DocumentReviewStatus,
  InvoiceStatus,
  ProviderDocumentType,
  ProviderStatus,
  ServiceCategory,
  UserRole,
} from './enums';

/** Database primary key. */
export type Id = number;

/** ISO 8601 date-time string, e.g. "2026-10-13T09:30:00.000Z". Dates travel as strings in JSON. */
export type ISODateString = string;

/** Money amount in Sri Lankan rupees (LKR), up to 2 decimal places. */
export type LkrAmount = number;

interface Timestamps {
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Address {
  id: Id;
  /** e.g. "Home", "Office" */
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  district: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface User extends Timestamps {
  id: Id;
  fullName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
}

export interface CustomerProfile extends Timestamps {
  id: Id;
  userId: Id;
  addresses: Address[];
  defaultAddressId: Id | null;
}

export interface ProviderProfile extends Timestamps {
  id: Id;
  userId: Id;
  status: ProviderStatus;
  categories: ServiceCategory[];
  bio: string | null;
  yearsOfExperience: number;
  hourlyRate: LkrAmount | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  isAvailable: boolean;
  averageRating: number;
  totalReviews: number;
  /** Set when status is REJECTED or SUSPENDED. */
  statusReason: string | null;
}

export interface ProviderDocument {
  id: Id;
  providerId: Id;
  type: ProviderDocumentType;
  fileUrl: string;
  reviewStatus: DocumentReviewStatus;
  reviewedById: Id | null;
  reviewedAt: ISODateString | null;
  rejectionReason: string | null;
  uploadedAt: ISODateString;
}

export interface Booking extends Timestamps {
  id: Id;
  customerId: Id;
  /** Null while the booking is open to any provider in the category. */
  providerId: Id | null;
  category: ServiceCategory;
  title: string;
  description: string;
  photoUrls: string[];
  address: Address;
  scheduledAt: ISODateString | null;
  status: BookingStatus;
  quotedAmount: LkrAmount | null;
  currency: Currency;
  cancellationReason: string | null;
  cancelledById: Id | null;
}

export interface BookingStatusHistory {
  id: Id;
  bookingId: Id;
  /** Null for the first entry, when the booking is created. */
  fromStatus: BookingStatus | null;
  toStatus: BookingStatus;
  changedById: Id;
  note: string | null;
  createdAt: ISODateString;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: LkrAmount;
  total: LkrAmount;
}

export interface Invoice extends Timestamps {
  id: Id;
  bookingId: Id;
  invoiceNumber: string;
  lineItems: InvoiceLineItem[];
  subtotal: LkrAmount;
  platformFee: LkrAmount;
  total: LkrAmount;
  currency: Currency;
  status: InvoiceStatus;
  issuedAt: ISODateString | null;
  paidAt: ISODateString | null;
}

export interface Review {
  id: Id;
  /** One review per completed booking. */
  bookingId: Id;
  customerId: Id;
  providerId: Id;
  /** 1–5 */
  rating: number;
  comment: string | null;
  createdAt: ISODateString;
}

export interface Dispute extends Timestamps {
  id: Id;
  bookingId: Id;
  raisedById: Id;
  reason: string;
  description: string;
  status: DisputeStatus;
  resolution: string | null;
  resolvedById: Id | null;
  resolvedAt: ISODateString | null;
}
