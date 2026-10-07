import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatDate, getJson, isReleasedVersion, KIND_COLORS, releaseKind } from '../../web/src/lib/dashboard.js';

describe('releaseKind', () => {
  it.each([
    ['1.0.0', 'major'],
    ['2.0.0', 'major'],
    ['1.3.0', 'minor'],
    ['1.3.2', 'patch'],
    ['2.0.0-beta.1', 'pre'],
    ['nope', 'none'],
  ])('%s is a %s release', (version, kind) => {
    expect(releaseKind(version)).toBe(kind);
    expect(KIND_COLORS[kind]).toBeTruthy();
  });
});

describe('isReleasedVersion', () => {
  it('distinguishes pipeline releases from local development builds', () => {
    expect(isReleasedVersion('1.4.2')).toBe(true);
    expect(isReleasedVersion('2.0.0-beta.1')).toBe(true);
    expect(isReleasedVersion('0.0.0-development')).toBe(false);
    expect(isReleasedVersion('garbage')).toBe(false);
  });
});

describe('formatDate', () => {
  it('formats ISO timestamps and tolerates missing or invalid values', () => {
    expect(formatDate('2026-10-06T16:56:06Z')).toMatch(/2026/);
    expect(formatDate(null)).toBe('—');
    expect(formatDate('not a date')).toBe('not a date');
  });
});

describe('getJson', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns parsed JSON and bypasses the HTTP cache', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ version: '1.0.0' }) });
    vi.stubGlobal('fetch', fetch);
    await expect(getJson('./build-info.json')).resolves.toEqual({ version: '1.0.0' });
    expect(fetch).toHaveBeenCalledWith('./build-info.json', { cache: 'no-store' });
  });

  it('rejects on HTTP errors so callers can fall back (e.g. no API on GitHub Pages)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    await expect(getJson('./api/version')).rejects.toThrow('HTTP 404');
  });
});
