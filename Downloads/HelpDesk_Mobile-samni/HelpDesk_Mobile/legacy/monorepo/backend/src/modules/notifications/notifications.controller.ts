// OWNER: Member 3 - Tracking, chat, reviews, complaints, notifications, AI, shared
// PURPOSE: HTTP handlers for the notifications module
// TODO: Parse the request, call notifications.service and send the response. Every handler returns 501 until built

import { notImplemented } from '../../utils/notImplemented';

/** GET /api/notifications */
export const listNotifications = notImplemented('notifications.listNotifications');

/** PATCH /api/notifications/read-all */
export const markAllRead = notImplemented('notifications.markAllRead');

/** PATCH /api/notifications/:id/read */
export const markRead = notImplemented('notifications.markRead');
