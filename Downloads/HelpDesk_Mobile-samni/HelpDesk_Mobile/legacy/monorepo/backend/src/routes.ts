// OWNER: Member 4 - Admin web, auth, database, backend core
// PURPOSE: Mounts every module router under /api
// TODO: Register new module routers here. Order matters: /providers/me must come before /providers/:id

import { Router } from 'express';
import { authRoutes } from './modules/auth/auth.routes';
import { adminRoutes } from './modules/admin/admin.routes';
import { usersRoutes } from './modules/users/users.routes';
import { providerRoutes } from './modules/provider/provider.routes';
import { reviewsRoutes } from './modules/reviews/reviews.routes';
import { catalogRoutes } from './modules/catalog/catalog.routes';
import { bookingsRoutes } from './modules/bookings/bookings.routes';
import { jobsRoutes } from './modules/jobs/jobs.routes';
import { trackingRoutes } from './modules/tracking/tracking.routes';
import { messagesRoutes } from './modules/messages/messages.routes';
import { complaintsRoutes } from './modules/complaints/complaints.routes';
import { notificationsRoutes } from './modules/notifications/notifications.routes';
import { aiRoutes } from './modules/ai/ai.routes';

export const routes = Router();

routes.get('/health', (_req, res) => {
  res.json({ ok: true });
});

routes.use(authRoutes);
routes.use(adminRoutes);
routes.use(usersRoutes);
routes.use(providerRoutes); // before catalog so /providers/me is not read as /providers/:id
routes.use(reviewsRoutes);
routes.use(catalogRoutes);
routes.use(bookingsRoutes);
routes.use(jobsRoutes);
routes.use(trackingRoutes);
routes.use(messagesRoutes);
routes.use(complaintsRoutes);
routes.use(notificationsRoutes);
routes.use(aiRoutes);
