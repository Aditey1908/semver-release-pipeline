/**
 * Semantic Versioning 2.0.0 (https://semver.org): parse, compare and bump versions.
 *
 * This module has no imports so it runs unchanged in Node.js and in the browser.
 */

// Official pattern from semver.org, with an optional leading "v" (Git tag style)
const SEMVER_RE =
  /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

const PREID_RE = /^[a-zA-Z][0-9a-zA-Z-]*$/;

export const RELEASE_TYPES = Object.freeze(['major', 'minor', 'patch', 'prerelease']);

/**
 * Parse a version string ("1.2.3", "v2.0.0-beta.1+build.7") into its parts.
 * Returns null when the input is not a valid semantic version.
 */
export function parse(input) {
  if (typeof input !== 'string') return null;
  const match = SEMVER_RE.exec(input.trim());
  if (!match) return null;

  const [major, minor, patch] = match.slice(1, 4).map(Number);
  if (![major, minor, patch].every(Number.isSafeInteger)) return null;

  return {
    major,
    minor,
    patch,
    prerelease: match[4] ? match[4].split('.').map((id) => (/^\d+$/.test(id) ? Number(id) : id)) : [],
    build: match[5] ? match[5].split('.') : [],
  };
}

export function isValid(input) {
  return parse(input) !== null;
}

/** Turn parsed parts back into a canonical version string (no "v" prefix). */
export function format({ major, minor, patch, prerelease = [], build = [] }) {
  let version = `${major}.${minor}.${patch}`;
  if (prerelease.length) version += `-${prerelease.join('.')}`;
  if (build.length) version += `+${build.join('.')}`;
  return version;
}

function toParsed(version) {
  const parsed = typeof version === 'string' ? parse(version) : version;
  if (!parsed) throw new TypeError(`Invalid semantic version: ${JSON.stringify(version)}`);
  return parsed;
}

function compareIdentifiers(a, b) {
  const aNum = typeof a === 'number';
  const bNum = typeof b === 'number';
  if (aNum && bNum) return Math.sign(a - b);
  // Numeric identifiers always have lower precedence than alphanumeric ones
  if (aNum) return -1;
  if (bNum) return 1;
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Compare two versions by SemVer precedence (spec item 11).
 * Returns -1 if a < b, 0 if equal, 1 if a > b. Build metadata is ignored.
 */
export function compare(a, b) {
  const va = toParsed(a);
  const vb = toParsed(b);

  for (const key of ['major', 'minor', 'patch']) {
    if (va[key] !== vb[key]) return va[key] > vb[key] ? 1 : -1;
  }

  // A normal version has higher precedence than any of its pre-releases
  const pa = va.prerelease;
  const pb = vb.prerelease;
  if (!pa.length && !pb.length) return 0;
  if (!pa.length) return 1;
  if (!pb.length) return -1;

  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    // A shorter set of identifiers has lower precedence when all others are equal
    if (pa[i] === undefined) return -1;
    if (pb[i] === undefined) return 1;
    const result = compareIdentifiers(pa[i], pb[i]);
    if (result !== 0) return result;
  }
  return 0;
}

/**
 * Return the next version for a release type.
 *
 *   bump('1.2.3', 'patch')                       -> '1.2.4'
 *   bump('1.2.3', 'minor')                       -> '1.3.0'
 *   bump('1.2.3', 'major')                       -> '2.0.0'
 *   bump('1.2.3', 'prerelease', { preid: 'beta' }) -> '1.2.4-beta.1'
 *   bump('1.2.4-beta.1', 'prerelease')           -> '1.2.4-beta.2'
 *   bump('2.0.0-beta.3', 'major')                -> '2.0.0'  (promote the pre-release)
 */
export function bump(version, type, { preid } = {}) {
  const v = toParsed(version);
  const isPre = v.prerelease.length > 0;
  const { major, minor, patch } = v;

  switch (type) {
    case 'major':
      return isPre && minor === 0 && patch === 0 ? `${major}.0.0` : `${major + 1}.0.0`;
    case 'minor':
      return isPre && patch === 0 ? `${major}.${minor}.0` : `${major}.${minor + 1}.0`;
    case 'patch':
      return isPre ? `${major}.${minor}.${patch}` : `${major}.${minor}.${patch + 1}`;
    case 'prerelease': {
      if (preid !== undefined && !PREID_RE.test(preid)) {
        throw new TypeError(`Invalid pre-release identifier: ${JSON.stringify(preid)}`);
      }
      const [currentId, currentNumber] = v.prerelease;
      const id = preid ?? (typeof currentId === 'string' ? currentId : 'rc');
      if (isPre && currentId === id && v.prerelease.length === 2 && typeof currentNumber === 'number') {
        return format({ major, minor, patch, prerelease: [id, currentNumber + 1] });
      }
      // Moving from a stable version starts a pre-release of the next patch
      return format({ major, minor, patch: isPre ? patch : patch + 1, prerelease: [id, 1] });
    }
    default:
      throw new RangeError(`Unknown release type: ${JSON.stringify(type)} (expected one of ${RELEASE_TYPES.join(', ')})`);
  }
}
