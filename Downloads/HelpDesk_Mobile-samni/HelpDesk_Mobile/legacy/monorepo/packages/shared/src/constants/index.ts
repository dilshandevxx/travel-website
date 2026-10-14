// OWNER: Member 3 - Tracking, chat, reviews, complaints, notifications, AI, shared
// PURPOSE: Barrel file for constants
// TODO: Re-export new constants files here

export * from './roles.js';
export * from './providerStatus.js';
export * from './bookingStatus.js';
export * from './categories.js';

/** All prices on the platform are in Sri Lankan rupees. */
export const CURRENCY = 'LKR' as const;
