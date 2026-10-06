import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/server/app.js';

const buildInfo = { name: 'semver-release-pipeline', version: '1.4.2', commit: 'abc1234', buildDate: '2026-10-06T10:00:00Z' };
const releases = [
  { version: '1.4.2', date: '2026-10-06', sections: [{ title: 'Bug Fixes', items: [{ scope: null, text: 'x', commit: 'abc1234' }] }] },
  { version: '1.4.1', date: '2026-10-01', sections: [] },
];

const staticDir = mkdtempSync(path.join(tmpdir(), 'dashboard-'));
writeFileSync(path.join(staticDir, 'index.html'), '<!doctype html><title>dashboard</title>');
afterAll(() => rmSync(staticDir, { recursive: true, force: true }));

const app = createApp({ buildInfo, releases, environment: 'test', staticDir, startedAt: Date.now() - 5000 });

describe('health and metadata', () => {
  it('GET /health reports ok with the running version', async () => {
    const res = await request(app).get('/health').expect(200);
    expect(res.body).toEqual({ status: 'ok', version: '1.4.2' });
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('GET /api/version returns build metadata and runtime details', async () => {
    const res = await request(app).get('/api/version').expect(200);
    expect(res.body).toMatchObject({ ...buildInfo, environment: 'test', node: process.version });
    expect(res.body.uptimeSeconds).toBeGreaterThanOrEqual(5);
  });

  it('GET /api/releases lists the release history', async () => {
    const res = await request(app).get('/api/releases').expect(200);
    expect(res.body).toEqual({ count: 2, releases });
  });

  it('GET /api/releases/:version finds a release with or without "v"', async () => {
    await request(app).get('/api/releases/v1.4.1').expect(200, releases[1]);
    await request(app).get('/api/releases/1.4.2').expect(200, releases[0]);
    const res = await request(app).get('/api/releases/9.9.9').expect(404);
    expect(res.body.error).toMatch(/9\.9\.9/);
  });

  it('sets security headers and hides the framework', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
    expect(res.headers['content-security-policy']).not.toContain('upgrade-insecure-requests');
  });
});

describe('POST /api/semver/next', () => {
  it('predicts the next version from commit messages', async () => {
    const res = await request(app)
      .post('/api/semver/next')
      .send({ current: '1.4.2', commits: ['fix: a', 'feat(ui): b'] })
      .expect(200);
    expect(res.body).toMatchObject({ current: '1.4.2', releaseType: 'minor', next: '1.5.0' });
    expect(res.body.commits).toHaveLength(2);
  });

  it('accepts a newline-separated log and no current version', async () => {
    const res = await request(app).post('/api/semver/next').send({ commits: 'docs: a\nfix: b' }).expect(200);
    expect(res.body).toMatchObject({ current: null, next: '1.0.0', releaseType: 'patch' });
  });

  it('reports when nothing would be released', async () => {
    const res = await request(app).post('/api/semver/next').send({ current: '2.0.0', commits: ['chore: x'] }).expect(200);
    expect(res.body).toMatchObject({ next: null, releaseType: null });
  });

  it.each([
    [{ current: '1.4', commits: ['fix: a'] }, /current/],
    [{ current: '1.0.0' }, /commits/],
    [{ current: '1.0.0', commits: [] }, /commits/],
    [{ current: '1.0.0', commits: [42] }, /commits/],
    [{ current: '1.0.0', commits: Array.from({ length: 501 }, () => 'fix: a') }, /at most 500/],
  ])('rejects invalid body %#', async (body, message) => {
    const res = await request(app).post('/api/semver/next').send(body).expect(400);
    expect(res.body.error).toMatch(message);
  });

  it('rejects malformed JSON with 400', async () => {
    const res = await request(app)
      .post('/api/semver/next')
      .set('content-type', 'application/json')
      .send('{"current":')
      .expect(400);
    expect(res.body.error).toBeTruthy();
  });

  it('rejects a missing body with 400', async () => {
    await request(app).post('/api/semver/next').expect(400);
  });
});

describe('GET /api/semver/bump and /compare', () => {
  it('bumps a version', async () => {
    await request(app).get('/api/semver/bump?version=1.4.2&type=major').expect(200, { version: '1.4.2', type: 'major', next: '2.0.0' });
    const res = await request(app).get('/api/semver/bump?version=1.4.2&type=prerelease&preid=beta').expect(200);
    expect(res.body.next).toBe('1.4.3-beta.1');
  });

  it('validates bump input', async () => {
    await request(app).get('/api/semver/bump?version=abc&type=patch').expect(400);
    await request(app).get('/api/semver/bump?version=1.0.0&type=huge').expect(400);
    const res = await request(app).get('/api/semver/bump?version=1.0.0&type=prerelease&preid=1x').expect(400);
    expect(res.body.error).toMatch(/pre-release identifier/);
  });

  it('compares versions by precedence', async () => {
    const res = await request(app).get('/api/semver/compare?a=1.10.0&b=1.9.0').expect(200);
    expect(res.body).toEqual({ a: '1.10.0', b: '1.9.0', result: 1, relation: 'higher' });
    const pre = await request(app).get('/api/semver/compare?a=1.0.0-rc.1&b=1.0.0').expect(200);
    expect(pre.body.relation).toBe('lower');
  });

  it('validates compare input', async () => {
    const res = await request(app).get('/api/semver/compare?a=1.0.0').expect(400);
    expect(res.body.error).toMatch(/"b"/);
  });
});

describe('static dashboard and fallbacks', () => {
  it('serves the dashboard', async () => {
    const res = await request(app).get('/').expect(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });

  it('returns JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/nope').expect(404);
    expect(res.body).toEqual({ error: 'Not Found', path: '/nope' });
  });

  it('works without a static directory', async () => {
    const bare = createApp({ buildInfo, environment: 'test' });
    await request(bare).get('/').expect(404);
    await request(bare).get('/api/releases').expect(200, { count: 0, releases: [] });
  });

  it('hides internal error details behind a generic 500', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const broken = createApp({
      buildInfo,
      releases: {
        get length() {
          throw new Error('secret detail');
        },
      },
    });
    const res = await request(broken).get('/api/releases').expect(500);
    expect(res.body).toEqual({ error: 'Internal Server Error' });
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
