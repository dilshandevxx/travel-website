// OWNER: Member 3 - Tracking, chat, reviews, complaints, notifications, AI, shared
// PURPOSE: Service request (booking) statuses and the allowed transitions between them
// TODO: Confirm the transition rules with the team; backend jobs/tracking modules must use canTransition()

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
export const BOOKING_STATUS_TRANSITIONS: Readonly<Record<BookingStatus, readonly BookingStatus[]>> =
  {
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

/** The 6 steps shown by the customer tracker (CANCELLED is not a step). */
export const BOOKING_TRACKER_STEPS: readonly BookingStatus[] = [
  'PENDING',
  'ACCEPTED',
  'ON_THE_WAY',
  'IN_PROGRESS',
  'AWAITING_CUSTOMER_CONFIRMATION',
  'COMPLETED',
];
