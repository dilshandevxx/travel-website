// OWNER: Member 4 - Admin web, auth, database, backend core
// PURPOSE: Builds the Express app (middleware + routes)
// TODO: Add request logging and rate limiting

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { routes } from './routes';
import { errorHandler, notFound } from './middleware/errorHandler';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigins }));
app.use(express.json({ limit: '1mb' }));

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);
