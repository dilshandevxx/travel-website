// OWNER: Member 3 - Tracking, chat, reviews, complaints, notifications, AI, shared
// PURPOSE: Provider profile, category and pricing types
// TODO: Add verification document types when the upload flow is designed

import type { ProviderStatus } from '../constants/providerStatus.js';
import type { CategorySlug } from '../constants/categories.js';
import type { LkrAmount } from './common.js';

export interface Category {
  id: number;
  slug: CategorySlug;
  name: string;
}

export interface ProviderProfile {
  id: number;
  userId: number;
  status: ProviderStatus;
  bio: string | null;
  yearsOfExperience: number;
  categoryIds: number[];
  isAvailable: boolean;
  averageRating: number;
  totalReviews: number;
  latitude: number | null;
  longitude: number | null;
}

export interface PricingRule {
  id: number;
  categoryId: number;
  /** Visit / call-out fee */
  baseFee: LkrAmount;
  minHourlyRate: LkrAmount;
  maxHourlyRate: LkrAmount;
}
