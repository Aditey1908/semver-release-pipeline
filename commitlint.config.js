/**
 * Enforces Conventional Commits (https://www.conventionalcommits.org).
 * The commit type decides the next semantic version:
 *   fix / perf / revert -> PATCH    feat -> MINOR    "!" or BREAKING CHANGE -> MAJOR
 */
export default {
  extends: ['@commitlint/config-conventional'],
  ignores: [
    // Release commits are written by semantic-release and contain long generated notes
    (message) => message.startsWith('chore(release):'),
    // Dependabot capitalises its subjects ("fix(deps): Bump express from 5.2.1 to 5.3.0")
    (message) => /^\w+\(deps(-dev)?\): Bump /.test(message),
  ],
  rules: {
    // Bodies often contain URLs or Dependabot tables; warn instead of failing
    'body-max-line-length': [1, 'always', 100],
    'footer-max-line-length': [1, 'always', 100],
  },
};
