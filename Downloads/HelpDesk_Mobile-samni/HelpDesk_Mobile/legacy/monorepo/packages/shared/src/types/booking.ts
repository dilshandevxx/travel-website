// OWNER: Member 3 - Tracking, chat, reviews, complaints, notifications, AI, shared
// PURPOSE: Service request (booking), status history, cost proposal and chat message types
// TODO: Add fields as the bookings/jobs/tracking/messages modules are built

import type { BookingStatus } from '../constants/bookingStatus.js';
import type { ISODateString, LkrAmount } from './common.js';
import type { Address } from './user.js';

export interface ServiceRequest {
  id: number;
  customerId: number;
  /** Null until a provider accepts the job. */
  providerId: number | null;
  categoryId: number;
  description: string;
  photoUrls: string[];
  address: Address;
  scheduledAt: ISODateString | null;
  status: BookingStatus;
  createdAt: ISODateString;
  updatedAt: ISODateString;
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
  currency: 'LKR';
  note: string | null;
  status: CostProposalStatus;
  createdAt: ISODateString;
}

export interface Message {
  id: number;
  serviceRequestId: number;
  senderId: number;
  body: string;
  createdAt: ISODateString;
}
