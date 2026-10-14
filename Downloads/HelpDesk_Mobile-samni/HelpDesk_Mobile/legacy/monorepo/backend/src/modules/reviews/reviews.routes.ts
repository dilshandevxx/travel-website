// OWNER: Member 3 - Tracking, chat, reviews, complaints, notifications, AI, shared
// PURPOSE: Routes for the reviews module: Reviews of completed jobs and provider responses
// TODO: Add request validation; keep paths in sync with packages/shared/src/api

import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import * as controller from './reviews.controller';

export const reviewsRoutes = Router();

reviewsRoutes.post(
  '/service-requests/:id/reviews',
  requireAuth,
  requireRole('CUSTOMER'),
  controller.createReview,
);
reviewsRoutes.get('/providers/:id/reviews', controller.listProviderReviews);
reviewsRoutes.post(
  '/providers/reviews/:id/respond',
  requireAuth,
  requireRole('PROVIDER'),
  controller.respondToReview,
);
