import { describe, expect, it } from 'vitest';
import { bump, compare, format, isValid, parse } from '../../src/core/semver.js';

describe('parse', () => {
  it('parses core, pre-release and build parts', () => {
    expect(parse('1.2.3-beta.11+build.7')).toEqual({
      major: 1,
      minor: 2,
      patch: 3,
      prerelease: ['beta', 11],
      build: ['build', '7'],
    });
  });

  it('accepts a leading "v" as used in Git tags', () => {
    expect(parse('v2.0.0')).toMatchObject({ major: 2, minor: 0, patch: 0 });
  });

  it.each(['1.2', '1.2.3.4', '01.2.3', '1.2.3-', '1.2.3-01', 'latest', '', '1.2.3+', ' ', 'v'])('rejects %j', (input) => {
    expect(parse(input)).toBeNull();
    expect(isValid(input)).toBe(false);
  });

  it('rejects non-strings and numbers beyond safe integer range', () => {
    expect(parse(123)).toBeNull();
    expect(parse(undefined)).toBeNull();
    expect(parse('99999999999999999999.0.0')).toBeNull();
  });
});

describe('format', () => {
  it.each(['1.2.3', '0.0.1-alpha', '1.0.0-rc.1+sha.abc123'])('round-trips %s', (version) => {
    expect(format(parse(version))).toBe(version);
  });

  it('drops the "v" prefix', () => {
    expect(format(parse('v1.0.0'))).toBe('1.0.0');
  });
});

describe('compare', () => {
  it('orders versions by the precedence example in the SemVer spec', () => {
    const ordered = [
      '1.0.0-alpha',
      '1.0.0-alpha.1',
      '1.0.0-alpha.beta',
      '1.0.0-beta',
      '1.0.0-beta.2',
      '1.0.0-beta.11',
      '1.0.0-rc.1',
      '1.0.0',
      '1.0.1',
      '1.1.0',
      '2.0.0',
    ];
    const shuffled = [...ordered].reverse();
    expect(shuffled.sort(compare)).toEqual(ordered);
  });

  it('compares numerically, not lexically', () => {
    expect(compare('1.10.0', '1.9.0')).toBe(1);
    expect(compare('1.0.0-beta.2', '1.0.0-beta.10')).toBe(-1);
  });

  it('ignores build metadata', () => {
    expect(compare('1.0.0+build.1', '1.0.0+build.2')).toBe(0);
    expect(compare('v1.0.0', '1.0.0')).toBe(0);
  });

  it('throws on invalid input', () => {
    expect(() => compare('1.0', '1.0.0')).toThrow(TypeError);
  });
});

describe('bump', () => {
  it.each([
    ['1.2.3', 'patch', '1.2.4'],
    ['1.2.3', 'minor', '1.3.0'],
    ['1.2.3', 'major', '2.0.0'],
    ['0.9.9', 'major', '1.0.0'],
    ['v1.2.3+build.5', 'patch', '1.2.4'],
    // Promoting a pre-release to its stable version
    ['2.0.0-beta.3', 'major', '2.0.0'],
    ['1.3.0-beta.1', 'minor', '1.3.0'],
    ['1.2.4-rc.1', 'patch', '1.2.4'],
    // A pre-release of a lower level still needs a real bump
    ['1.2.4-rc.1', 'minor', '1.3.0'],
    ['1.2.4-rc.1', 'major', '2.0.0'],
  ])('%s + %s -> %s', (version, type, expected) => {
    expect(bump(version, type)).toBe(expected);
  });

  it('starts and increments pre-releases', () => {
    expect(bump('1.2.3', 'prerelease', { preid: 'beta' })).toBe('1.2.4-beta.1');
    expect(bump('1.2.4-beta.1', 'prerelease')).toBe('1.2.4-beta.2');
    expect(bump('1.2.4-beta.9', 'prerelease', { preid: 'beta' })).toBe('1.2.4-beta.10');
    expect(bump('1.2.4-beta.2', 'prerelease', { preid: 'rc' })).toBe('1.2.4-rc.1');
    expect(bump('1.2.3', 'prerelease')).toBe('1.2.4-rc.1');
    expect(bump('1.2.4-0', 'prerelease')).toBe('1.2.4-rc.1');
  });

  it('rejects unknown release types and bad identifiers', () => {
    expect(() => bump('1.0.0', 'huge')).toThrow(RangeError);
    expect(() => bump('1.0.0', 'prerelease', { preid: '1beta' })).toThrow(TypeError);
    expect(() => bump('nope', 'patch')).toThrow(TypeError);
  });
});
