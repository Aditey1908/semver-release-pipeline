import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './server/app.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'dist');

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return null;
  }
}

function log(level, msg, fields = {}) {
  console.log(JSON.stringify({ time: new Date().toISOString(), level, msg, ...fields }));
}

let buildInfo = await readJson(path.join(distDir, 'build-info.json'));
if (!buildInfo) {
  const pkg = await readJson(path.join(root, 'package.json'));
  buildInfo = { name: pkg.name, version: pkg.version, commit: 'unknown', buildDate: null, repository: null };
  log('warn', 'dist/ not found - run "npm run build" to generate the dashboard and build metadata');
}

const releases = (await readJson(path.join(distDir, 'releases.json'))) ?? [];
const environment = process.env.APP_ENV ?? 'development';
const port = Number(process.env.PORT ?? 3000);

const app = createApp({ buildInfo, releases, environment, staticDir: distDir });
const server = app.listen(port, () => {
  log('info', 'server started', { port, version: buildInfo.version, commit: buildInfo.commit, environment });
});

// Containers are stopped with SIGTERM: finish in-flight requests, then exit
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.once(signal, () => {
    log('info', 'shutting down', { signal });
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  });
}
