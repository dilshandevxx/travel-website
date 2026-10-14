// OWNER: Member 3 - Tracking, chat, reviews, complaints, notifications, AI, shared
// PURPOSE: HTTP handlers for the tracking module
// TODO: Parse the request, call tracking.service and send the response. Every handler returns 501 until built

import { notImplemented } from '../../utils/notImplemented';

/** POST /api/service-requests/:id/respond-cost */
export const respondToCost = notImplemented('tracking.respondToCost');

/** POST /api/service-requests/:id/confirm-completion */
export const confirmCompletion = notImplemented('tracking.confirmCompletion');

/** POST /api/service-requests/:id/cancel */
export const cancelServiceRequest = notImplemented('tracking.cancelServiceRequest');
