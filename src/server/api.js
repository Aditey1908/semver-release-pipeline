import { Router } from 'express';
import { nextVersion, splitCommitLog } from '../core/commits.js';
import { bump, compare, isValid, parse, RELEASE_TYPES } from '../core/semver.js';

const MAX_COMMITS = 500;

class BadRequest extends Error {
  status = 400;
}

function requireVersion(value, name) {
  if (!isValid(value)) throw new BadRequest(`"${name}" must be a valid semantic version (e.g. 1.4.2)`);
  return value;
}

function readCommits(input) {
  const commits = typeof input === 'string' ? splitCommitLog(input) : input;
  if (!Array.isArray(commits) || commits.length === 0 || !commits.every((c) => typeof c === 'string')) {
    throw new BadRequest('"commits" must be a non-empty array of commit messages (or a newline-separated string)');
  }
  if (commits.length > MAX_COMMITS) throw new BadRequest(`"commits" accepts at most ${MAX_COMMITS} entries`);
  return commits;
}

export function createApiRouter({ buildInfo, releases, environment, startedAt }) {
  const router = Router();

  router.get('/version', (_req, res) => {
    res.json({
      ...buildInfo,
      environment,
      node: process.version,
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    });
  });

  router.get('/releases', (_req, res) => {
    res.json({ count: releases.length, releases });
  });

  router.get('/releases/:version', (req, res) => {
    const version = req.params.version.replace(/^v/, '');
    const release = releases.find((r) => r.version === version);
    if (!release) return res.status(404).json({ error: `Release ${version} not found` });
    res.json(release);
  });

  // Predict the next release from a list of commit messages
  router.post('/semver/next', (req, res) => {
    const { current = null, commits } = req.body ?? {};
    if (current !== null) requireVersion(current, 'current');
    res.json(nextVersion(current, readCommits(commits)));
  });

  router.get('/semver/bump', (req, res) => {
    const { version, type, preid } = req.query;
    requireVersion(version, 'version');
    if (!RELEASE_TYPES.includes(type)) throw new BadRequest(`"type" must be one of: ${RELEASE_TYPES.join(', ')}`);
    try {
      res.json({ version, type, next: bump(version, type, { preid }) });
    } catch (error) {
      throw new BadRequest(error.message);
    }
  });

  router.get('/semver/parse', (req, res) => {
    requireVersion(req.query.version, 'version');
    res.json(parse(req.query.version));
  });

  router.get('/semver/compare', (req, res) => {
    const { a, b } = req.query;
    requireVersion(a, 'a');
    requireVersion(b, 'b');
    const result = compare(a, b);
    res.json({ a, b, result, relation: ['lower', 'equal', 'higher'][result + 1] });
  });

  return router;
}
