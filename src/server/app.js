import express from 'express';
import helmet from 'helmet';
import { createApiRouter } from './api.js';

/**
 * Build the Express application. Everything it needs is passed in, so tests
 * can create an app with fixture data and no filesystem or network access.
 */
export function createApp({
  buildInfo,
  releases = [],
  environment = 'development',
  staticDir = null,
  startedAt = Date.now(),
}) {
  const app = express();
  app.disable('x-powered-by');

  app.use(
    helmet({
      // The app is often served over plain HTTP (local, staging container), so
      // don't ask browsers to upgrade asset requests to HTTPS.
      contentSecurityPolicy: { directives: { upgradeInsecureRequests: null } },
    }),
  );
  app.use(express.json({ limit: '100kb' }));

  // Liveness probe used by Docker HEALTHCHECK, Compose --wait and smoke tests
  app.get('/health', (_req, res) => {
    res.set('Cache-Control', 'no-store').json({ status: 'ok', version: buildInfo.version });
  });

  app.use('/api', createApiRouter({ buildInfo, releases, environment, startedAt }));

  // Dashboard built by scripts/build.js
  if (staticDir) app.use(express.static(staticDir));

  app.use((req, res) => {
    res.status(404).json({ error: 'Not Found', path: req.path });
  });

  // Express 5 forwards thrown errors (including invalid JSON bodies) here
  app.use((err, _req, res, _next) => {
    const status = err.status ?? err.statusCode ?? 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ error: status >= 500 ? 'Internal Server Error' : err.message });
  });

  return app;
}
