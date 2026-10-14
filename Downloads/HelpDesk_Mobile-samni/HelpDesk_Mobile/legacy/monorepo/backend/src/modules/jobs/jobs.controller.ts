// OWNER: Member 2 - Provider app / onboarding / e2e
// PURPOSE: HTTP handlers for the jobs module
// TODO: Parse the request, call jobs.service and send the response. Every handler returns 501 until built

import { notImplemented } from '../../utils/notImplemented';

/** POST /api/service-requests/:id/accept */
export const acceptJob = notImplemented('jobs.acceptJob');

/** PATCH /api/service-requests/:id/status */
export const updateJobStatus = notImplemented('jobs.updateJobStatus');

/** POST /api/service-requests/:id/propose-cost */
export const proposeCost = notImplemented('jobs.proposeCost');
