// OWNER: Member 4 - Admin web, auth, database, backend core
// PURPOSE: Placeholder handler that answers 501 for routes nobody has built yet
// TODO: Delete once every controller is implemented

import type { Request, Response } from 'express';

export function notImplemented(name: string) {
  return (req: Request, res: Response) => {
    res
      .status(501)
      .json({ error: 'Not implemented', handler: name, route: `${req.method} ${req.originalUrl}` });
  };
}
