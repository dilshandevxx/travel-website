// HelpDesk server: one Express process serves the REST API under /api and the React app.
// In development Vite runs inside this process as middleware (hot reload included);
// in production (`npm run build && npm start`) the built files in dist/ are served.

import 'dotenv/config';
import path from 'node:path';
import express from 'express';
import { router } from './src/server/routes.ts';
import { getDb } from './src/server/db.ts';
import { isAiConfigured } from './src/server/ai.ts';

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

async function main() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  // Load (or create) the JSON database before the first request.
  getDb();

  app.use('/api', router);

  if (isProduction) {
    const dist = path.resolve('dist');
    app.use(express.static(dist));
    app.get('/{*splat}', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`HelpDesk running at http://localhost:${PORT} (${isProduction ? 'production' : 'development'})`);
    console.log(`API health check: http://localhost:${PORT}/api/health`);
    if (!isAiConfigured()) console.log('GEMINI_API_KEY not set - AI triage uses the built-in keyword classifier.');
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
