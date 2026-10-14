// OWNER: Member 4 - Admin web, auth, database, backend core
// PURPOSE: Routes for the admin module: Admin dashboard, user management, provider verification, pricing rules and complaints
// TODO: Add request validation; keep paths in sync with packages/shared/src/api

import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import * as controller from './admin.controller';

export const adminRoutes = Router();

adminRoutes.get('/admin/dashboard', requireAuth, requireRole('ADMIN'), controller.dashboard);
adminRoutes.get('/admin/users', requireAuth, requireRole('ADMIN'), controller.listUsers);
adminRoutes.patch(
  '/admin/users/:id/status',
  requireAuth,
  requireRole('ADMIN'),
  controller.updateUserStatus,
);
adminRoutes.get(
  '/admin/providers/pending',
  requireAuth,
  requireRole('ADMIN'),
  controller.listPendingProviders,
);
adminRoutes.patch(
  '/admin/providers/:id/verification',
  requireAuth,
  requireRole('ADMIN'),
  controller.verifyProvider,
);
adminRoutes.get(
  '/admin/pricing-rules',
  requireAuth,
  requireRole('ADMIN'),
  controller.listPricingRules,
);
adminRoutes.post(
  '/admin/pricing-rules',
  requireAuth,
  requireRole('ADMIN'),
  controller.createPricingRule,
);
adminRoutes.patch(
  '/admin/pricing-rules/:id',
  requireAuth,
  requireRole('ADMIN'),
  controller.updatePricingRule,
);
adminRoutes.get('/admin/complaints', requireAuth, requireRole('ADMIN'), controller.listComplaints);
adminRoutes.patch(
  '/admin/complaints/:id',
  requireAuth,
  requireRole('ADMIN'),
  controller.updateComplaint,
);
