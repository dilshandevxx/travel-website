// OWNER: Member 4 - Admin web, auth, database, backend core
// PURPOSE: HTTP handlers for the auth module
// TODO: Parse the request, call auth.service and send the response. Every handler returns 501 until built

import { notImplemented } from '../../utils/notImplemented';

/** POST /api/auth/register */
export const register = notImplemented('auth.register');

/** POST /api/auth/login */
export const login = notImplemented('auth.login');

/** GET /api/auth/me */
export const me = notImplemented('auth.me');

/** POST /api/auth/logout */
export const logout = notImplemented('auth.logout');

/** POST /api/auth/switch-mode */
export const switchMode = notImplemented('auth.switchMode');
