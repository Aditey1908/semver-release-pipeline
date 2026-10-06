/**
 * Conventional Commits analysis: decides which semantic version a set of
 * commits should produce. The rules mirror the defaults of
 * @semantic-release/commit-analyzer (conventionalcommits preset), so the
 * prediction shown by the app matches what the release pipeline will do.
 */
import { bump } from './semver.js';

// Same header grammar as the conventionalcommits preset: type(scope)!: subject
const HEADER_RE = /^(?<type>\w+)(?:\((?<scope>[^()\r\n]*)\))?(?<bang>!)?: (?<subject>.+)$/;
const BREAKING_NOTE_RE = /^BREAKING[ -]CHANGE: ?(.*)$/m;
const REVERT_RE = /^(?:Revert|revert:)\s"?[\s\S]+?"?\s*This reverts commit \w+\./i;

export const RELEASE_RULES = Object.freeze({ feat: 'minor', fix: 'patch', perf: 'patch' });
const WEIGHT = { major: 3, minor: 2, patch: 1 };

/** Parse one commit message (header + optional body/footers). */
export function parseCommit(message) {
  const text = String(message ?? '').replace(/\r\n/g, '\n').trim();
  const [header = '', ...rest] = text.split('\n');
  const body = rest.join('\n').trim();
  const match = HEADER_RE.exec(header.trim());

  if (!match) {
    // A "git revert" commit is released as a patch even though it is not conventional
    const isRevert = REVERT_RE.test(text);
    return {
      header,
      type: isRevert ? 'revert' : null,
      scope: null,
      subject: header,
      breaking: false,
      breakingNote: null,
      conventional: false,
      releaseType: isRevert ? 'patch' : null,
    };
  }

  const { type, scope, bang, subject } = match.groups;
  const note = BREAKING_NOTE_RE.exec(body);
  const breaking = Boolean(bang || note);

  return {
    header,
    type,
    scope: scope || null,
    subject: subject.trim(),
    breaking,
    breakingNote: note ? note[1].trim() || subject.trim() : bang ? subject.trim() : null,
    conventional: true,
    releaseType: breaking ? 'major' : (RELEASE_RULES[type] ?? (REVERT_RE.test(text) ? 'patch' : null)),
  };
}

/** The highest-impact release type across all commits wins (major > minor > patch). */
export function analyzeCommits(messages) {
  const commits = messages.map(parseCommit);
  const releaseType = commits.reduce(
    (highest, { releaseType: type }) => ((WEIGHT[type] ?? 0) > (WEIGHT[highest] ?? 0) ? type : highest),
    null,
  );
  return { releaseType, commits };
}

/**
 * Predict the next version from the current one and the commits since it.
 * With no current version this is the first release, which is always 1.0.0.
 */
export function nextVersion(current, messages) {
  const { releaseType, commits } = analyzeCommits(messages);
  let next = null;
  if (releaseType) next = current ? bump(current, releaseType) : '1.0.0';
  return { current: current || null, releaseType, next, commits };
}

/**
 * Split pasted text into commit messages. Use a line containing only "---"
 * between commits that have bodies; otherwise every non-empty line is a commit.
 */
export function splitCommitLog(text) {
  const normalised = String(text ?? '').replace(/\r\n/g, '\n');
  const chunks = /^-{3,}$/m.test(normalised) ? normalised.split(/^-{3,}$/m) : normalised.split('\n');
  return chunks.map((chunk) => chunk.trim()).filter(Boolean);
}
