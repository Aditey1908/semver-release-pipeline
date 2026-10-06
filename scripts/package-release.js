#!/usr/bin/env node
/**
 * Packages dist/ as a versioned release asset with a SHA-256 checksum.
 * semantic-release runs this during "prepare" and uploads the files in
 * release/ to the GitHub Release.
 *
 *   node scripts/package-release.js 1.4.2
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isValid } from '../src/core/semver.js';

const version = process.argv[2];
if (!isValid(version)) {
  console.error('Usage: node scripts/package-release.js <semver>');
  process.exit(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const releaseDir = path.join(root, 'release');
const archive = `semver-release-pipeline-v${version}.tar.gz`;

await rm(releaseDir, { recursive: true, force: true });
await mkdir(releaseDir);
execFileSync('tar', ['-czf', path.join(releaseDir, archive), '-C', path.join(root, 'dist'), '.'], { stdio: 'inherit' });

const digest = createHash('sha256').update(await readFile(path.join(releaseDir, archive))).digest('hex');
await writeFile(path.join(releaseDir, 'SHA256SUMS.txt'), `${digest}  ${archive}\n`);
console.log(`Packaged ${archive} (sha256 ${digest.slice(0, 12)}…)`);
