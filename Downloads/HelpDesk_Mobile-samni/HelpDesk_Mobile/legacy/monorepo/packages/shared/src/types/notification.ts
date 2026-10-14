// OWNER: Member 3 - Tracking, chat, reviews, complaints, notifications, AI, shared
// PURPOSE: In-app notification types
// TODO: Extend NotificationType as new events are added

import type { ISODateString } from './common.js';

export type NotificationType =
  'BOOKING_UPDATE' | 'NEW_JOB' | 'COST_PROPOSAL' | 'MESSAGE' | 'REVIEW' | 'VERIFICATION' | 'SYSTEM';

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  readAt: ISODateString | null;
  createdAt: ISODateString;
}
