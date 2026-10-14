// OWNER: Member 1 - Customer app
// PURPOSE: Routes for the users module: Current user profile, addresses and settings
// TODO: Add request validation; keep paths in sync with packages/shared/src/api

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import * as controller from './users.controller';

export const usersRoutes = Router();

usersRoutes.get('/users/me', requireAuth, controller.getMe);
usersRoutes.patch('/users/me', requireAuth, controller.updateMe);
usersRoutes.get('/users/me/addresses', requireAuth, controller.listAddresses);
usersRoutes.post('/users/me/addresses', requireAuth, controller.createAddress);
usersRoutes.patch('/users/me/addresses/:id', requireAuth, controller.updateAddress);
usersRoutes.delete('/users/me/addresses/:id', requireAuth, controller.deleteAddress);
usersRoutes.get(
  '/users/me/notification-preferences',
  requireAuth,
  controller.getNotificationPreferences,
);
usersRoutes.put(
  '/users/me/notification-preferences',
  requireAuth,
  controller.updateNotificationPreferences,
);
usersRoutes.get('/users/me/app-settings', requireAuth, controller.getAppSettings);
usersRoutes.put('/users/me/app-settings', requireAuth, controller.updateAppSettings);
usersRoutes.post('/users/me/change-password', requireAuth, controller.changePassword);
usersRoutes.delete('/users/me/account', requireAuth, controller.deleteAccount);
