// OWNER: Member 4 - Admin web, auth, database, backend core
// PURPOSE: Creates the Sequelize connection and loads the models
// TODO: Tune pool size and SSL settings for the production database

import { Sequelize } from 'sequelize';
import { env } from '../config/env';
import { initModels } from './models';

export const sequelize = new Sequelize(env.databaseUrl, {
  dialect: 'postgres',
  logging: false,
});

initModels(sequelize);

export * from './models';
