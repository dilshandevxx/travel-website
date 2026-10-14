// OWNER: Member 4 - Admin web, auth, database, backend core
// PURPOSE: Runs database seeders (npm run db:seed)
// TODO: Nothing more needed; add seeders to src/db/seeders

import path from 'node:path';
import { Umzug, SequelizeStorage } from 'umzug';
import type { QueryInterface } from 'sequelize';
import { sequelize } from './index';

export const seeder = new Umzug<QueryInterface>({
  migrations: { glob: path.join(__dirname, 'seeders', '*.ts').replace(/\\/g, '/') },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize, modelName: 'SequelizeData' }),
  logger: console,
});

async function main() {
  await seeder.up();
  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
