// OWNER: Member 4 - Admin web, auth, database, backend core
// PURPOSE: The API client instance for the admin web
// TODO: Pass getToken from localStorage once auth is built

import { createHelpDeskApi } from '@helpdesk/shared';

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export const api = createHelpDeskApi({ baseUrl: API_URL });
