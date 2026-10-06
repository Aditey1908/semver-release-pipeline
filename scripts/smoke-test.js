#!/usr/bin/env node
/**
 * Post-deployment smoke test. Verifies a running deployment is healthy and is
 * serving the version that was just released.
 *
 *   node scripts/smoke-test.js <base-url> [--expect-version 1.4.2] [--retries 20] [--interval 3]
 *
 * Exits non-zero if any check fails, which fails the pipeline stage.
 */
import { appendFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    'expect-version': { type: 'string' },
    retries: { type: 'string', default: '20' },
    interval: { type: 'string', default: '3' },
  },
});

const baseUrl = (positionals[0] ?? 'http://localhost:3000').replace(/\/+$/, '');
const expected = values['expect-version']?.replace(/^v/, '');
const retries = Number(values.retries);
const intervalMs = Number(values.interval) * 1000;
const results = [];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(urlPath, init) {
  const res = await fetch(`${baseUrl}${urlPath}`, { ...init, signal: AbortSignal.timeout(10_000) });
  const type = res.headers.get('content-type') ?? '';
  const body = type.includes('json') ? await res.json() : await res.text();
  return { status: res.status, type, body };
}

/** Retry a check until it passes (deployments take a moment to become ready). */
async function waitFor(name, check) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const detail = await check();
      results.push({ name, ok: true, detail });
      console.log(`  ✔ ${name} — ${detail}`);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        console.log(`  … ${name}: ${error.message} (attempt ${attempt}/${retries}, retrying in ${intervalMs / 1000}s)`);
        await sleep(intervalMs);
      }
    }
  }
  results.push({ name, ok: false, detail: lastError.message });
  console.log(`  ✘ ${name} — ${lastError.message}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

console.log(`Smoke testing ${baseUrl}${expected ? ` (expecting v${expected})` : ''}`);

await waitFor('Health endpoint', async () => {
  const { status, body } = await request('/health');
  assert(status === 200 && body.status === 'ok', `GET /health returned ${status}`);
  return 'status ok';
});

await waitFor('Deployed version', async () => {
  const { status, body } = await request('/api/version');
  assert(status === 200, `GET /api/version returned ${status}`);
  assert(!expected || body.version === expected, `serving v${body.version}, expected v${expected}`);
  return `v${body.version} (${body.commit}) in "${body.environment}"`;
});

await waitFor('Dashboard page', async () => {
  const { status, type } = await request('/');
  assert(status === 200 && type.includes('text/html'), `GET / returned ${status} ${type}`);
  return 'HTML served';
});

await waitFor('Semver API', async () => {
  const { status, body } = await request('/api/semver/next', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ current: '1.4.2', commits: ['feat: smoke test'] }),
  });
  assert(status === 200 && body.next === '1.5.0', `expected 1.5.0, got ${status} ${JSON.stringify(body)}`);
  return 'feat on 1.4.2 -> 1.5.0';
});

const failed = results.filter((r) => !r.ok);

if (process.env.GITHUB_STEP_SUMMARY) {
  const rows = results.map((r) => `| ${r.ok ? '✅' : '❌'} | ${r.name} | ${r.detail} |`).join('\n');
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `### Smoke test: ${baseUrl}\n\n| | Check | Result |\n|---|---|---|\n${rows}\n\n`,
  );
}

console.log(failed.length ? `\n${failed.length} check(s) failed` : '\nAll smoke checks passed');
process.exit(failed.length ? 1 : 0);
