// OWNER: Member 3 - Tracking, chat, reviews, complaints, notifications, AI, shared
// PURPOSE: Barrel file for the API client
// TODO: Add new endpoint modules to createHelpDeskApi

import { createApiClient, type ApiClientOptions } from './client.js';
import { authApi } from './auth.js';
import { usersApi } from './users.js';
import { providersApi } from './providers.js';
import { bookingsApi } from './bookings.js';
import { messagesApi } from './messages.js';
import { reviewsApi } from './reviews.js';
import { complaintsApi } from './complaints.js';
import { notificationsApi } from './notifications.js';
import { aiApi } from './ai.js';
import { adminApi } from './admin.js';

export * from './client.js';

/** One object with every endpoint group: `api.auth.login(...)`, `api.bookings.list()`, ... */
export function createHelpDeskApi(options: ApiClientOptions) {
  const client = createApiClient(options);
  return {
    client,
    auth: authApi(client),
    users: usersApi(client),
    providers: providersApi(client),
    bookings: bookingsApi(client),
    messages: messagesApi(client),
    reviews: reviewsApi(client),
    complaints: complaintsApi(client),
    notifications: notificationsApi(client),
    ai: aiApi(client),
    admin: adminApi(client),
  };
}

export type HelpDeskApi = ReturnType<typeof createHelpDeskApi>;
