// OWNER: Member 3 - Tracking, chat, reviews, complaints, notifications, AI, shared
// PURPOSE: Routes for the complaints module: Customers and providers raise complaints about a booking
// TODO: Add request validation; keep paths in sync with packages/shared/src/api

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import * as controller from './complaints.controller';

export const complaintsRoutes = Router();

complaintsRoutes.post('/service-requests/:id/complaints', requireAuth, controller.createComplaint);
