// OWNER: Member 3 - Tracking, chat, reviews, complaints, notifications, AI, shared
// PURPOSE: Routes for the ai module: AI problem classification and project planning (Gemini, server-side only)
// TODO: Add request validation; keep paths in sync with packages/shared/src/api

import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import * as controller from './ai.controller';

export const aiRoutes = Router();

aiRoutes.post('/ai/classify', requireAuth, controller.classify);
aiRoutes.post('/ai/project-plan', requireAuth, controller.projectPlan);
