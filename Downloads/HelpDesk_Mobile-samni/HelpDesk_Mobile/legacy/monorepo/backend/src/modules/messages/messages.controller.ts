// OWNER: Member 3 - Tracking, chat, reviews, complaints, notifications, AI, shared
// PURPOSE: HTTP handlers for the messages module
// TODO: Parse the request, call messages.service and send the response. Every handler returns 501 until built

import { notImplemented } from '../../utils/notImplemented';

/** GET /api/service-requests/:id/messages */
export const listMessages = notImplemented('messages.listMessages');

/** POST /api/service-requests/:id/messages */
export const sendMessage = notImplemented('messages.sendMessage');
