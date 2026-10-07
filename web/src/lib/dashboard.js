import { parse } from '@core/semver.js';

/** Background colour per release type, using the theme's chart palette. */
export const KIND_COLORS = {
  major: 'bg-chart-2',
  minor: 'bg-chart-1',
  patch: 'bg-chart-4',
  pre: 'bg-chart-5',
  none: 'bg-secondary-background',
};

export const ENV_COLORS = {
  production: 'bg-chart-4',
  staging: 'bg-chart-3',
  'github-pages': 'bg-chart-1',
};

export const COMMIT_EXAMPLES = {
  patch: ['fix(api): return 400 for malformed versions', 'docs: explain rollback workflow', 'chore(deps): bump express'],
  minor: ['feat(ui): show release history timeline', 'fix: handle empty changelog', 'test: cover compare endpoint'],
  major: ['feat(api)!: rename /api/semver/next to /api/predict', 'fix: trim commit messages'],
  none: ['docs: update README', 'ci: cache npm dependencies', 'style: format files'],
};

/** Which kind of release a version number represents, judged from its shape. */
export function releaseKind(version) {
  const v = parse(version);
  if (!v) return 'none';
  if (v.prerelease.length) return 'pre';
  if (v.minor === 0 && v.patch === 0) return 'major';
  return v.patch === 0 ? 'minor' : 'patch';
}

/** A version that came out of the release pipeline (not a local development build). */
export function isReleasedVersion(version) {
  const v = parse(version);
  return Boolean(v) && !v.prerelease.includes('development');
}

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export async function getJson(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
}
