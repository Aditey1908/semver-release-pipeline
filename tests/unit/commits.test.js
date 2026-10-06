import { describe, expect, it } from 'vitest';
import { analyzeCommits, nextVersion, parseCommit, splitCommitLog } from '../../src/core/commits.js';

describe('parseCommit', () => {
  it('parses type, scope and subject', () => {
    expect(parseCommit('feat(api): add compare endpoint')).toMatchObject({
      type: 'feat',
      scope: 'api',
      subject: 'add compare endpoint',
      breaking: false,
      conventional: true,
      releaseType: 'minor',
    });
  });

  it.each([
    ['fix: handle empty input', 'patch'],
    ['perf(core): cache parsed versions', 'patch'],
    ['feat: new thing', 'minor'],
    ['docs: update readme', null],
    ['chore(deps): bump express', null],
    ['ci: cache npm', null],
    ['refactor: extract helper', null],
  ])('%j -> %s', (message, releaseType) => {
    expect(parseCommit(message).releaseType).toBe(releaseType);
  });

  it('treats "!" after the type/scope as a breaking change', () => {
    const commit = parseCommit('feat(api)!: rename endpoint');
    expect(commit).toMatchObject({ breaking: true, breakingNote: 'rename endpoint', releaseType: 'major' });
  });

  it.each(['BREAKING CHANGE', 'BREAKING-CHANGE'])('detects a %s footer, even on a non-feature commit', (keyword) => {
    const commit = parseCommit(`refactor: drop node 20\n\n${keyword}: Node 22 is now required`);
    expect(commit).toMatchObject({ breaking: true, breakingNote: 'Node 22 is now required', releaseType: 'major' });
  });

  it('marks non-conventional messages as not releasable', () => {
    expect(parseCommit('Update stuff')).toMatchObject({ conventional: false, type: null, releaseType: null });
    expect(parseCommit('Merge pull request #4 from feature/x')).toMatchObject({ releaseType: null });
    expect(parseCommit('feat:missing space')).toMatchObject({ conventional: false });
  });

  it('releases git reverts as a patch', () => {
    const message = 'Revert "feat: add thing"\n\nThis reverts commit 1a2b3c4d.';
    expect(parseCommit(message)).toMatchObject({ type: 'revert', releaseType: 'patch', conventional: false });
    expect(parseCommit('revert: feat: add thing\n\nThis reverts commit 1a2b3c4d.').releaseType).toBe('patch');
    // Without the "This reverts commit" trailer it is just another non-release type
    expect(parseCommit('revert: undo something').releaseType).toBeNull();
  });

  it('handles CRLF line endings and empty input', () => {
    expect(parseCommit('fix: a\r\n\r\nBREAKING CHANGE: b').releaseType).toBe('major');
    expect(parseCommit('').releaseType).toBeNull();
    expect(parseCommit(undefined).header).toBe('');
  });
});

describe('analyzeCommits', () => {
  it('uses the highest impact across all commits', () => {
    expect(analyzeCommits(['fix: a', 'feat: b', 'docs: c']).releaseType).toBe('minor');
    expect(analyzeCommits(['fix: a', 'feat!: b']).releaseType).toBe('major');
    expect(analyzeCommits(['docs: a', 'fix: b']).releaseType).toBe('patch');
  });

  it('returns null when nothing is releasable', () => {
    expect(analyzeCommits(['docs: a', 'chore: b']).releaseType).toBeNull();
    expect(analyzeCommits([]).releaseType).toBeNull();
  });
});

describe('nextVersion', () => {
  it('bumps from the current version', () => {
    expect(nextVersion('1.4.2', ['fix: a']).next).toBe('1.4.3');
    expect(nextVersion('1.4.2', ['feat: a', 'fix: b']).next).toBe('1.5.0');
    expect(nextVersion('v1.4.2', ['feat!: a']).next).toBe('2.0.0');
  });

  it('makes the first release 1.0.0, like semantic-release', () => {
    expect(nextVersion(null, ['fix: a'])).toMatchObject({ current: null, next: '1.0.0', releaseType: 'patch' });
  });

  it('returns no next version when there is nothing to release', () => {
    expect(nextVersion('1.0.0', ['docs: a'])).toMatchObject({ next: null, releaseType: null });
  });
});

describe('splitCommitLog', () => {
  it('splits one commit per line', () => {
    expect(splitCommitLog('feat: a\n\n  fix: b  \n')).toEqual(['feat: a', 'fix: b']);
  });

  it('splits on "---" so commits can have bodies', () => {
    const log = 'feat: a\n\nBREAKING CHANGE: x\n---\nfix: b';
    expect(splitCommitLog(log)).toEqual(['feat: a\n\nBREAKING CHANGE: x', 'fix: b']);
  });

  it('handles empty input', () => {
    expect(splitCommitLog('')).toEqual([]);
    expect(splitCommitLog(null)).toEqual([]);
  });
});
