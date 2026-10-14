// OWNER: Member 2 - Provider app / onboarding / e2e
// PURPOSE: Routes for the provider module: Provider self-service profile, verification, pricing and availability
// TODO: Add request validation; keep paths in sync with packages/shared/src/api

import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import * as controller from './provider.controller';

export const providerRoutes = Router();

providerRoutes.get('/providers/me', requireAuth, requireRole('PROVIDER'), controller.getMyProfile);
providerRoutes.patch(
  '/providers/me',
  requireAuth,
  requireRole('PROVIDER'),
  controller.updateMyProfile,
);
providerRoutes.get(
  '/providers/me/verification',
  requireAuth,
  requireRole('PROVIDER'),
  controller.getVerification,
);
providerRoutes.post(
  '/providers/me/verification',
  requireAuth,
  requireRole('PROVIDER'),
  controller.submitVerification,
);
providerRoutes.get(
  '/providers/me/category-pricing',
  requireAuth,
  requireRole('PROVIDER'),
  controller.getCategoryPricing,
);
providerRoutes.put(
  '/providers/me/category-pricing',
  requireAuth,
  requireRole('PROVIDER'),
  controller.updateCategoryPricing,
);
providerRoutes.put(
  '/providers/me/availability',
  requireAuth,
  requireRole('PROVIDER'),
  controller.updateAvailability,
);
