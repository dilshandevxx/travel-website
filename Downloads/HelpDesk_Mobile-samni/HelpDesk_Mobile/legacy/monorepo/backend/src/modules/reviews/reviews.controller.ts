// OWNER: Member 3 - Tracking, chat, reviews, complaints, notifications, AI, shared
// PURPOSE: HTTP handlers for the reviews module
// TODO: Parse the request, call reviews.service and send the response. Every handler returns 501 until built

import { notImplemented } from '../../utils/notImplemented';

/** POST /api/service-requests/:id/reviews */
export const createReview = notImplemented('reviews.createReview');

/** GET /api/providers/:id/reviews */
export const listProviderReviews = notImplemented('reviews.listProviderReviews');

/** POST /api/providers/reviews/:id/respond */
export const respondToReview = notImplemented('reviews.respondToReview');
