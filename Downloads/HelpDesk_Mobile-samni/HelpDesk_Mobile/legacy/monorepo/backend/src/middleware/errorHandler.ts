// OWNER: Member 4 - Admin web, auth, database, backend core
// PURPOSE: Turns thrown errors into JSON responses
// TODO: Map Sequelize validation/unique errors to 400/409 and add error logging

import type { NextFunction, Request, Response } from 'express';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function notFound(req: Request, res: Response) {
  res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
