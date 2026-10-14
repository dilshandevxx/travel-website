// OWNER: Member 3 - Tracking, chat, reviews, complaints, notifications, AI, shared
// PURPOSE: Routes for the tracking module: Customer-side job progress: respond to cost, confirm completion, cancel
// TODO: Add request validation; keep paths in sync with packages/shared/src/api

import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import * as controller from './tracking.controller';

export const trackingRoutes = Router();

trackingRoutes.post(
  '/service-requests/:id/respond-cost',
  requireAuth,
  requireRole('CUSTOMER'),
  controller.respondToCost,
);
trackingRoutes.post(
  '/service-requests/:id/confirm-completion',
  requireAuth,
  requireRole('CUSTOMER'),
  controller.confirmCompletion,
);
trackingRoutes.post('/service-requests/:id/cancel', requireAuth, controller.cancelServiceRequest);
