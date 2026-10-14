// OWNER: Member 3 - Tracking, chat, reviews, complaints, notifications, AI, shared
// PURPOSE: Review and complaint types
// TODO: Add attachment/evidence fields to Complaint if needed

import type { ISODateString } from './common.js';

export interface Review {
  id: number;
  serviceRequestId: number;
  customerId: number;
  providerId: number;
  /** 1-5 */
  rating: number;
  comment: string | null;
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
}
