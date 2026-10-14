// OWNER: Member 3 - Tracking, chat, reviews, complaints, notifications, AI, shared
// PURPOSE: Small helper types used by the other type files
// TODO: Add pagination / API error shapes when the API is designed

/** ISO 8601 date-time string. Dates travel as strings in JSON. */
export type ISODateString = string;
/** Amount in Sri Lankan rupees (LKR). */
export type LkrAmount = number;

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
