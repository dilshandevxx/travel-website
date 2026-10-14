// OWNER: Member 3 - Tracking, chat, reviews, complaints, notifications, AI, shared
// PURPOSE: The API client instance for this app
// TODO: Pass getToken from the auth context/SecureStore once auth is built

import { createHelpDeskApi } from '@helpdesk/shared';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export const api = createHelpDeskApi({ baseUrl: API_URL });
