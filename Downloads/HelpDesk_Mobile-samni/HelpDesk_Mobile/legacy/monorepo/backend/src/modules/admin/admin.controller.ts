// OWNER: Member 4 - Admin web, auth, database, backend core
// PURPOSE: HTTP handlers for the admin module
// TODO: Parse the request, call admin.service and send the response. Every handler returns 501 until built

import { notImplemented } from '../../utils/notImplemented';

/** GET /api/admin/dashboard */
export const dashboard = notImplemented('admin.dashboard');

/** GET /api/admin/users */
export const listUsers = notImplemented('admin.listUsers');

/** PATCH /api/admin/users/:id/status */
export const updateUserStatus = notImplemented('admin.updateUserStatus');

/** GET /api/admin/providers/pending */
export const listPendingProviders = notImplemented('admin.listPendingProviders');

/** PATCH /api/admin/providers/:id/verification */
export const verifyProvider = notImplemented('admin.verifyProvider');

/** GET /api/admin/pricing-rules */
export const listPricingRules = notImplemented('admin.listPricingRules');

/** POST /api/admin/pricing-rules */
export const createPricingRule = notImplemented('admin.createPricingRule');

/** PATCH /api/admin/pricing-rules/:id */
export const updatePricingRule = notImplemented('admin.updatePricingRule');

/** GET /api/admin/complaints */
export const listComplaints = notImplemented('admin.listComplaints');

/** PATCH /api/admin/complaints/:id */
export const updateComplaint = notImplemented('admin.updateComplaint');
