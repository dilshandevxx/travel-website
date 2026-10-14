// OWNER: Member 3 - Tracking, chat, reviews, complaints, notifications, AI, shared
// PURPOSE: Routes for the messages module: Chat between customer and provider on a booking
// TODO: Add request validation; keep paths in sync with packages/shared/src/api

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import * as controller from './messages.controller';

export const messagesRoutes = Router();

messagesRoutes.get('/service-requests/:id/messages', requireAuth, controller.listMessages);
messagesRoutes.post('/service-requests/:id/messages', requireAuth, controller.sendMessage);
