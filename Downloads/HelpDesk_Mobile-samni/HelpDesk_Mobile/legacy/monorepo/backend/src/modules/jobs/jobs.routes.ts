// OWNER: Member 2 - Provider app / onboarding / e2e
// PURPOSE: Routes for the jobs module: Provider job actions: accept (atomic lock), status updates, cost proposals
// TODO: Add request validation; keep paths in sync with packages/shared/src/api

import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import * as controller from './jobs.controller';

export const jobsRoutes = Router();

jobsRoutes.post(
  '/service-requests/:id/accept',
  requireAuth,
  requireRole('PROVIDER'),
  controller.acceptJob,
);
jobsRoutes.patch(
  '/service-requests/:id/status',
  requireAuth,
  requireRole('PROVIDER'),
  controller.updateJobStatus,
);
jobsRoutes.post(
  '/service-requests/:id/propose-cost',
  requireAuth,
  requireRole('PROVIDER'),
  controller.proposeCost,
);
