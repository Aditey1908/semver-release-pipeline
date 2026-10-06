#!/usr/bin/env node
/**
 * Application build: produces dist/, a self-contained static site that is
 * served by the Express container and also published to GitHub Pages.
 *
 *   dist/index.html, css/, js/   frontend (from public/)
 *   dist/js/core/                semver engine shared with the server (from src/core/)
 *   dist/build-info.json         version, commit and build date baked into this build
 *   dist/releases.json           release history parsed from CHANGELOG.md
 *
 * Build metadata comes from the environment when the pipeline provides it
 * (APP_VERSION, GIT_SHA, BUILD_DATE, SOURCE_URL) and falls back to local values.
 */
import { execFileSync } from 'node:child_process';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseChangelog } from '../src/core/changelog.js';
import { isValid } from '../src/core/semver.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.resolve(root, process.env.BUILD_OUT_DIR || 'dist');

function git(...args) {
  try {
    return execFileSync('git', args, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return null;
  }
}

function repositoryUrl() {
  if (process.env.SOURCE_URL) return process.env.SOURCE_URL;
  const remote = git('remote', 'get-url', 'origin');
  if (!remote) return null;
  // git@github.com:owner/repo.git -> https://github.com/owner/repo
  return remote.replace(/^git@([^:]+):/, 'https://$1/').replace(/\.git$/, '');
}

const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const version = process.env.APP_VERSION || pkg.version;
if (!isValid(version)) {
  console.error(`Build failed: "${version}" is not a valid semantic version`);
  process.exit(1);
}

const buildInfo = {
  name: pkg.name,
  version,
  commit: (process.env.GIT_SHA || git('rev-parse', 'HEAD') || 'unknown').slice(0, 7),
  buildDate: process.env.BUILD_DATE || new Date().toISOString(),
  repository: repositoryUrl(),
};

const changelog = await readFile(path.join(root, 'CHANGELOG.md'), 'utf8').catch(() => '');
const releases = parseChangelog(changelog);

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
await cp(path.join(root, 'public'), outDir, { recursive: true });
await cp(path.join(root, 'src/core'), path.join(outDir, 'js/core'), { recursive: true });
await writeFile(path.join(outDir, 'build-info.json'), `${JSON.stringify(buildInfo, null, 2)}\n`);
await writeFile(path.join(outDir, 'releases.json'), `${JSON.stringify(releases, null, 2)}\n`);

console.log(`Built ${buildInfo.name} v${buildInfo.version} (${buildInfo.commit}) -> ${path.relative(root, outDir) || '.'}`);
console.log(`  ${releases.length} release(s) in history, built at ${buildInfo.buildDate}`);
