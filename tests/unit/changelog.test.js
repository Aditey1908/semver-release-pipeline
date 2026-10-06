import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseChangelog } from '../../src/core/changelog.js';

// Real output from semantic-release (conventionalcommits preset) for releases 1.0.0 -> 2.0.0
const fixture = readFileSync(new URL('../fixtures/CHANGELOG.md', import.meta.url), 'utf8');

describe('parseChangelog', () => {
  const releases = parseChangelog(fixture);

  it('finds every release, newest first', () => {
    expect(releases.map((r) => r.version)).toEqual(['2.0.0', '1.1.0', '1.0.1', '1.0.0']);
    expect(releases.every((r) => r.date === '2026-10-06')).toBe(true);
  });

  it('reads the first release heading, which has no compare link', () => {
    const first = releases.at(-1);
    expect(first.sections).toEqual([
      {
        title: 'Features',
        items: [
          { scope: 'api', text: 'add express service', commit: '1bb8d61' },
          { scope: 'core', text: 'add semantic version engine', commit: 'ffea6c1' },
        ],
      },
    ]);
  });

  it('extracts breaking changes with the warning symbol stripped', () => {
    const [major] = releases;
    expect(major.sections.map((s) => s.title)).toEqual([
      'BREAKING CHANGES',
      'Features',
      'Bug Fixes',
      'Continuous Integration',
    ]);
    expect(major.sections[0].items[0]).toEqual({ scope: 'api', text: '/api/semver/next is now /api/predict', commit: null });
  });

  it('keeps link text but drops URLs', () => {
    const fix = releases.find((r) => r.version === '1.0.1').sections[0].items[0];
    expect(fix).toEqual({ scope: 'api', text: 'return 400 for malformed versions, closes #12', commit: '82ca7f9' });
  });

  it('handles pre-release versions and missing dates', () => {
    const [release] = parseChangelog('## [1.3.0-beta.2](https://x/compare/a...b)\n\n### Features\n\n- thing');
    expect(release).toEqual({
      version: '1.3.0-beta.2',
      date: null,
      sections: [{ title: 'Features', items: [{ scope: null, text: 'thing', commit: null }] }],
    });
  });

  it('returns an empty list for a changelog without releases', () => {
    expect(parseChangelog('# Changelog\n\nNothing yet.\n* stray bullet')).toEqual([]);
    expect(parseChangelog(undefined)).toEqual([]);
  });
});
