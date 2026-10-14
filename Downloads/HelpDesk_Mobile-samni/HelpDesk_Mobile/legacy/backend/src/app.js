/**
 * Builds the Express app (middleware + routes) without starting a server,
 * so tests can use it directly. server.js starts it.
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Render/AWS put a proxy in front of the app; trust it so client IPs are correct
if (env.isProduction) app.set('trust proxy', 1);

app.use(helmet());
// Only browsers enforce CORS — the mobile apps are not affected by this list
app.use(cors({ origin: env.corsOrigins }));
if (!env.isTest) app.use(morgan(env.isProduction ? 'combined' : 'dev'));
app.use(express.json({ limit: '100kb' }));

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
