import { BookingStatus } from './enums';

/**
 * Booking lifecycle:
 *
 *   PENDING ─► ACCEPTED ─► ON_THE_WAY ─► IN_PROGRESS ─► AWAITING_CUSTOMER_CONFIRMATION ─► COMPLETED
 *      │          │            │                              │
 *      └──────────┴────────────┴─► CANCELLED                  └─► IN_PROGRESS (customer reports the job isn't done)
 *
 * Once work has started a booking can't be cancelled; problems go through a Dispute instead.
 * COMPLETED and CANCELLED are final.
 */
export const BOOKING_STATUS_TRANSITIONS: Readonly<Record<BookingStatus, readonly BookingStatus[]>> = {
  [BookingStatus.PENDING]: [BookingStatus.ACCEPTED, BookingStatus.CANCELLED],
  [BookingStatus.ACCEPTED]: [BookingStatus.ON_THE_WAY, BookingStatus.CANCELLED],
  [BookingStatus.ON_THE_WAY]: [BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED],
  [BookingStatus.IN_PROGRESS]: [BookingStatus.AWAITING_CUSTOMER_CONFIRMATION],
  [BookingStatus.AWAITING_CUSTOMER_CONFIRMATION]: [BookingStatus.COMPLETED, BookingStatus.IN_PROGRESS],
  [BookingStatus.COMPLETED]: [],
  [BookingStatus.CANCELLED]: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return BOOKING_STATUS_TRANSITIONS[from].includes(to);
}

export function isFinalBookingStatus(status: BookingStatus): boolean {
  return BOOKING_STATUS_TRANSITIONS[status].length === 0;
}
