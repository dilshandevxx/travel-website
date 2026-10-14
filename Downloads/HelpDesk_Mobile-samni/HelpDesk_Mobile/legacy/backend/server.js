/**
 * Entry point: checks the database connection, then starts the HTTP server.
 *
 *   npm run dev   (auto-restarts on file changes)
 *   npm start
 */
const env = require('./src/config/env');
const app = require('./src/app');
const { sequelize } = require('./src/models');

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}/api (${env.nodeEnv})`);
  });

  const shutdown = () => {
    server.close(async () => {
      await sequelize.close();
      process.exit(0);
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

start();
