// OWNER: Member 4 - Admin web, auth, database, backend core
// PURPOSE: Runs database migrations (npm run db:migrate)
// TODO: Add migration files to src/db/migrations named YYYYMMDDHHMM-description.ts

import path from 'node:path';
import { Umzug, SequelizeStorage } from 'umzug';
import type { QueryInterface } from 'sequelize';
import { sequelize } from './index';

export const migrator = new Umzug<QueryInterface>({
  migrations: { glob: path.join(__dirname, 'migrations', '*.ts').replace(/\\/g, '/') },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize, modelName: 'SequelizeMeta' }),
  logger: console,
});

async function main() {
  const direction = process.argv[2] ?? 'up';
  if (direction === 'down') await migrator.down();
  else await migrator.up();
  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
