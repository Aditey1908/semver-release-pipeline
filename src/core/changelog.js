/**
 * Parses the CHANGELOG.md that semantic-release generates into structured
 * release history, which the dashboard and the /api/releases endpoint show.
 *
 * Release headings look like:
 *   ## [1.2.0](https://github.com/owner/repo/compare/v1.1.0...v1.2.0) (2026-10-06)
 *   ## 1.0.0 (2026-10-06)
 */
const RELEASE_HEADING_RE =
  /^#{1,2} \[?(?<version>\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)\]?(?:\([^)\s]*\))?(?: \((?<date>\d{4}-\d{2}-\d{2})\))?\s*$/;
const SECTION_HEADING_RE = /^### (?<title>.+?)\s*$/;
const ITEM_RE = /^[*-] (?<text>.+)$/;
const COMMIT_LINK_RE = /\s*\(\[(?<sha>[0-9a-f]{7,40})\]\([^)]*\)\)/;
const SCOPE_RE = /^\*\*(?<scope>[^*]+?):\*\* /;
const MARKDOWN_LINK_RE = /\[([^\]]+)\]\([^)]*\)/g;

function parseItem(raw) {
  let text = raw;
  const commit = COMMIT_LINK_RE.exec(text)?.groups.sha ?? null;
  text = text.replace(COMMIT_LINK_RE, '');

  const scope = SCOPE_RE.exec(text)?.groups.scope ?? null;
  text = text.replace(SCOPE_RE, '');

  // Keep link text, drop URLs (e.g. ", closes [#12](https://...)")
  text = text.replace(MARKDOWN_LINK_RE, '$1').trim();
  return { scope, text, commit };
}

export function parseChangelog(markdown) {
  const releases = [];
  let release = null;
  let section = null;

  for (const line of String(markdown ?? '').replace(/\r\n/g, '\n').split('\n')) {
    const heading = RELEASE_HEADING_RE.exec(line);
    if (heading) {
      release = { version: heading.groups.version, date: heading.groups.date ?? null, sections: [] };
      releases.push(release);
      section = null;
      continue;
    }
    if (!release) continue;

    const sectionHeading = SECTION_HEADING_RE.exec(line);
    if (sectionHeading) {
      // Strip emoji/symbols such as "⚠ BREAKING CHANGES"
      const title = sectionHeading.groups.title.replace(/^[^A-Za-z0-9]+/, '');
      section = { title, items: [] };
      release.sections.push(section);
      continue;
    }

    const item = ITEM_RE.exec(line);
    if (item && section) section.items.push(parseItem(item.groups.text));
  }

  return releases;
}
