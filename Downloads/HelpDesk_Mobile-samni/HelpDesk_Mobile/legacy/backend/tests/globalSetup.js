/**
 * Runs once before all tests: rebuilds the TEST database from the real
 * migrations, so tests also prove the migrations and models agree.
 */
const path = require('path');
const { execSync } = require('child_process');

module.exports = async () => {
  process.env.NODE_ENV = 'test';
  require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });

  if (!process.env.DB_TEST_NAME || process.env.DB_TEST_NAME === process.env.DB_NAME) {
    throw new Error('Set DB_TEST_NAME to a separate database. Tests delete all of its data.');
  }

  const run = (command) =>
    execSync(`npx sequelize-cli ${command}`, {
      cwd: path.join(__dirname, '..'),
      env: process.env,
      stdio: 'pipe',
    });

  run('db:migrate:undo:all');
  run('db:migrate');
};
