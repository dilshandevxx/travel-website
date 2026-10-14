// OWNER: Member 3 - Tracking, chat, reviews, complaints, notifications, AI, shared
// PURPOSE: Provider verification status
// TODO: Keep in sync with the provider_profiles.status column

export const ProviderStatus = {
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED',
} as const;
export type ProviderStatus = (typeof ProviderStatus)[keyof typeof ProviderStatus];
