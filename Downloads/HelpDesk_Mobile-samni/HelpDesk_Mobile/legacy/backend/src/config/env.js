/**
 * Loads environment variables from backend/.env and exposes the values the
 * app needs in one place. Import this before anything that reads process.env.
 */
const path = require('path');
const dotenv = require('dotenv');

// Existing environment variables (e.g. set by Render or the test runner) win over .env
dotenv.config({ path: path.join(__dirname, '../../.env'), quiet: true });

const nodeEnv = process.env.NODE_ENV || 'development';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not set. Copy backend/.env.example to backend/.env and fill it in.');
}

module.exports = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  isTest: nodeEnv === 'test',
  port: Number(process.env.PORT) || 5000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  corsOrigins: (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};
