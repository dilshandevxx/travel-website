// OWNER: Member 1 - Customer app
// PURPOSE: Routes for the bookings module: Customers create and view service requests
// TODO: Add request validation; keep paths in sync with packages/shared/src/api

import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import * as controller from './bookings.controller';

export const bookingsRoutes = Router();

bookingsRoutes.post(
  '/service-requests',
  requireAuth,
  requireRole('CUSTOMER'),
  controller.createServiceRequest,
);
bookingsRoutes.get('/service-requests', requireAuth, controller.listServiceRequests);
bookingsRoutes.get('/service-requests/:id', requireAuth, controller.getServiceRequest);
