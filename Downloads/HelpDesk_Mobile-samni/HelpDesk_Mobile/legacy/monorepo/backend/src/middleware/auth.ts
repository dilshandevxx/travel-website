// OWNER: Member 4 - Admin web, auth, database, backend core
// PURPOSE: JWT authentication and role checks
// TODO: Load the user from the DB (isActive check) and handle provider/customer mode switching

import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { UserRole } from '@helpdesk/shared';
import { env } from '../config/env';
import { HttpError } from './errorHandler';

export interface AuthUser {
  id: number;
  role: UserRole;
}

export interface JwtPayload {
  sub: string;
  role: UserRole;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

/** Rejects the request with 401 unless it has a valid "Authorization: Bearer <jwt>" header. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new HttpError(401, 'Missing bearer token');

  try {
    const payload = jwt.verify(header.slice(7), env.jwtSecret) as JwtPayload;
    req.user = { id: Number(payload.sub), role: payload.role };
  } catch {
    throw new HttpError(401, 'Invalid or expired token');
  }
  next();
}

/** Use after requireAuth. Rejects with 403 unless the user has one of the given roles. */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new HttpError(401, 'Not authenticated');
    if (!roles.includes(req.user.role)) throw new HttpError(403, 'Forbidden');
    next();
  };
}
