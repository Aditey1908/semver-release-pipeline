/**
 * Enforces Conventional Commits (https://www.conventionalcommits.org).
 * The commit type decides the next semantic version:
 *   fix / perf / revert -> PATCH    feat -> MINOR    "!" or BREAKING CHANGE -> MAJOR
 */
export default {
  extends: ['@commitlint/config-conventional'],
  // Release commits are written by semantic-release and contain long generated notes
  ignores: [(message) => message.startsWith('chore(release):')],
  rules: {
    // Bodies often contain URLs or Dependabot tables; warn instead of failing
    'body-max-line-length': [1, 'always', 100],
    'footer-max-line-length': [1, 'always', 100],
  },
};
