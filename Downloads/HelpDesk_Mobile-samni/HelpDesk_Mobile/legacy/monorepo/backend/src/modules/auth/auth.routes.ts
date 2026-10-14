// OWNER: Member 4 - Admin web, auth, database, backend core
// PURPOSE: Routes for the auth module: Registration, login and session
// TODO: Add request validation; keep paths in sync with packages/shared/src/api

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import * as controller from './auth.controller';

export const authRoutes = Router();

authRoutes.post('/auth/register', controller.register);
authRoutes.post('/auth/login', controller.login);
authRoutes.get('/auth/me', requireAuth, controller.me);
authRoutes.post('/auth/logout', requireAuth, controller.logout);
authRoutes.post('/auth/switch-mode', requireAuth, controller.switchMode);
