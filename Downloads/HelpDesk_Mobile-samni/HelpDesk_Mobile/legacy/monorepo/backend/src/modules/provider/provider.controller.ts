// OWNER: Member 2 - Provider app / onboarding / e2e
// PURPOSE: HTTP handlers for the provider module
// TODO: Parse the request, call provider.service and send the response. Every handler returns 501 until built

import { notImplemented } from '../../utils/notImplemented';

/** GET /api/providers/me */
export const getMyProfile = notImplemented('provider.getMyProfile');

/** PATCH /api/providers/me */
export const updateMyProfile = notImplemented('provider.updateMyProfile');

/** GET /api/providers/me/verification */
export const getVerification = notImplemented('provider.getVerification');

/** POST /api/providers/me/verification */
export const submitVerification = notImplemented('provider.submitVerification');

/** GET /api/providers/me/category-pricing */
export const getCategoryPricing = notImplemented('provider.getCategoryPricing');

/** PUT /api/providers/me/category-pricing */
export const updateCategoryPricing = notImplemented('provider.updateCategoryPricing');

/** PUT /api/providers/me/availability */
export const updateAvailability = notImplemented('provider.updateAvailability');
