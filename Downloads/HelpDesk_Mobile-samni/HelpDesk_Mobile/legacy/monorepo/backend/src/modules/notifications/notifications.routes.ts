// OWNER: Member 3 - Tracking, chat, reviews, complaints, notifications, AI, shared
// PURPOSE: Routes for the notifications module: In-app notifications
// TODO: Add request validation; keep paths in sync with packages/shared/src/api

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import * as controller from './notifications.controller';

export const notificationsRoutes = Router();

notificationsRoutes.get('/notifications', requireAuth, controller.listNotifications);
notificationsRoutes.patch('/notifications/read-all', requireAuth, controller.markAllRead);
notificationsRoutes.patch('/notifications/:id/read', requireAuth, controller.markRead);
