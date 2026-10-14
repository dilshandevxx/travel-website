// OWNER: Member 3 - Tracking, chat, reviews, complaints, notifications, AI, shared
// PURPOSE: User, address and auth response types
// TODO: Add fields as the users/auth modules are built

import type { UserRole } from '../constants/roles.js';
import type { ISODateString } from './common.js';

export interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  roles: UserRole[];
  /** The role the user is currently acting as (see POST /auth/switch-mode). */
  activeRole: UserRole;
  isActive: boolean;
  createdAt: ISODateString;
}

export interface Address {
  id: number;
  userId: number;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  district: string;
  latitude: number | null;
  longitude: number | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}
