// OWNER: Member 4 - Admin web, auth, database, backend core
// PURPOSE: Starts the HTTP server
// TODO: Add graceful shutdown (close server + sequelize) and decide whether to fail fast when the DB is down

import { app } from './app';
import { env } from './config/env';
import { sequelize } from './db';

async function main() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
  } catch (err) {
    console.warn('Database not reachable - API will start anyway:', (err as Error).message);
  }

  app.listen(env.port, () => {
    console.log(`HelpDesk API listening on http://localhost:${env.port}/api`);
  });
}

void main();
