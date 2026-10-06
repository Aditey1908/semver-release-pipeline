#!/usr/bin/env node
/**
 * Release preview: predicts the next version from the commits since the
 * latest Git tag, using the app's own Conventional Commits engine.
 *
 *   npm run release:preview            human-readable table
 *   npm run release:preview -- --json  machine-readable output
 *
 * In GitHub Actions it also writes a job summary, so every pull request
 * shows which version it will produce once merged.
 */
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { nextVersion } from '../src/core/commits.js';

function git(...args) {
  return execFileSync('git', args, { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
}

let lastTag = null;
try {
  lastTag = git('describe', '--tags', '--abbrev=0', '--match', 'v[0-9]*').trim();
} catch {
  // No release tag yet: the first release will be 1.0.0
}

const RECORD = '\x1e';
const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
const log = git('log', range, `--format=%h %B${RECORD}`);
const entries = log
  .split(RECORD)
  .map((entry) => entry.trim())
  .filter(Boolean)
  .map((entry) => ({ sha: entry.slice(0, entry.indexOf(' ')), message: entry.slice(entry.indexOf(' ') + 1) }));

const current = lastTag ? lastTag.replace(/^v/, '') : null;
const result = nextVersion(current, entries.map((e) => e.message));
const impact = (c) => (c.releaseType ? c.releaseType.toUpperCase() : '—');

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ lastTag, ...result }, null, 2));
} else {
  console.log(`Latest release tag : ${lastTag ?? '(none)'}`);
  console.log(`Commits since tag  : ${entries.length}\n`);
  result.commits.forEach((c, i) => console.log(`  ${impact(c).padEnd(6)} ${entries[i].sha}  ${c.header}`));
  console.log(
    result.next
      ? `\nNext release       : v${result.next} (${result.releaseType})`
      : '\nNext release       : none — no feat, fix, perf or breaking commits since the last tag',
  );
}

if (process.env.GITHUB_STEP_SUMMARY) {
  const headline = result.next
    ? `Merging this will release **v${result.next}** (${result.releaseType}) — previous: ${lastTag ?? 'none'}`
    : `No release will be created — no \`feat\`, \`fix\`, \`perf\` or breaking commits since ${lastTag ?? 'the start'}.`;
  const rows = result.commits.map((c, i) => `| \`${entries[i].sha}\` | ${impact(c)} | ${c.header.replace(/\|/g, '\\|')} |`);
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `### 🔖 Release preview\n\n${headline}\n\n| Commit | Impact | Message |\n|---|---|---|\n${rows.join('\n')}\n`,
  );
}
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `next_version=${result.next ?? ''}\nrelease_type=${result.releaseType ?? ''}\n`);
}
