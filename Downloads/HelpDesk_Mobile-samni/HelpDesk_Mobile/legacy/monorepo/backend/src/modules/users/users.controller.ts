// OWNER: Member 1 - Customer app
// PURPOSE: HTTP handlers for the users module
// TODO: Parse the request, call users.service and send the response. Every handler returns 501 until built

import { notImplemented } from '../../utils/notImplemented';

/** GET /api/users/me */
export const getMe = notImplemented('users.getMe');

/** PATCH /api/users/me */
export const updateMe = notImplemented('users.updateMe');

/** GET /api/users/me/addresses */
export const listAddresses = notImplemented('users.listAddresses');

/** POST /api/users/me/addresses */
export const createAddress = notImplemented('users.createAddress');

/** PATCH /api/users/me/addresses/:id */
export const updateAddress = notImplemented('users.updateAddress');

/** DELETE /api/users/me/addresses/:id */
export const deleteAddress = notImplemented('users.deleteAddress');

/** GET /api/users/me/notification-preferences */
export const getNotificationPreferences = notImplemented('users.getNotificationPreferences');

/** PUT /api/users/me/notification-preferences */
export const updateNotificationPreferences = notImplemented('users.updateNotificationPreferences');

/** GET /api/users/me/app-settings */
export const getAppSettings = notImplemented('users.getAppSettings');

/** PUT /api/users/me/app-settings */
export const updateAppSettings = notImplemented('users.updateAppSettings');

/** POST /api/users/me/change-password */
export const changePassword = notImplemented('users.changePassword');

/** DELETE /api/users/me/account */
export const deleteAccount = notImplemented('users.deleteAccount');
