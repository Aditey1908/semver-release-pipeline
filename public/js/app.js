import { nextVersion, splitCommitLog } from './core/commits.js';
import { isValid, parse } from './core/semver.js';

const $ = (id) => document.getElementById(id);

const EXAMPLES = {
  patch: ['fix(api): return 400 for malformed versions', 'docs: explain rollback workflow', 'chore(deps): bump express'],
  minor: ['feat(ui): show release history timeline', 'fix: handle empty changelog', 'test: cover compare endpoint'],
  major: ['feat(api)!: rename /api/semver/next to /api/predict', 'fix: trim commit messages'],
  none: ['docs: update README', 'ci: cache npm dependencies', 'style: format files'],
};

/** Create an element with text content only (never innerHTML), so data can't inject markup. */
function el(tag, { className, text } = {}, children = []) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  node.append(...children);
  return node;
}

async function getJson(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function renderBuildInfo(build, live) {
  const version = `v${build.version}`;
  document.title = `${version} · SemVer Release Pipeline`;
  $('current-version').textContent = version;
  $('info-version').textContent = version;
  $('info-commit').textContent = build.commit;
  $('info-built').textContent = formatDate(build.buildDate);

  const environment = live ? live.environment : 'github-pages';
  $('env-badge').textContent = environment;
  $('env-badge').dataset.env = environment;
  $('info-runtime').textContent = live ? `Container · Node ${live.node}` : 'Static site';

  const isRelease = isValid(build.version) && !build.version.includes('development');
  $('hero-meta').textContent = isRelease
    ? `Built from commit ${build.commit} on ${formatDate(build.buildDate)}`
    : 'Development build — no release has been cut from this checkout';

  if (build.repository) {
    $('repo-link').href = build.repository;
    $('repo-link').hidden = false;
    if (isRelease) {
      $('release-link').href = `${build.repository}/releases/tag/${version}`;
      $('release-link').hidden = false;
    }
  }
}

function renderHistory(releases) {
  $('history-empty').hidden = releases.length > 0;
  $('history').replaceChildren(
    ...releases.map((release) => {
      const parsed = parse(release.version);
      const kind = !parsed ? '' : parsed.prerelease.length ? 'pre' : parsed.minor === 0 && parsed.patch === 0 ? 'major' : parsed.patch === 0 ? 'minor' : 'patch';
      const sections = release.sections.map((section) =>
        el('div', { className: 'release__section' }, [
          el('h4', { text: section.title }),
          el('ul', {}, section.items.map((item) =>
            el('li', {}, [
              ...(item.scope ? [el('span', { className: 'scope', text: item.scope })] : []),
              document.createTextNode(item.text),
              ...(item.commit ? [el('span', { className: 'sha mono', text: item.commit })] : []),
            ]),
          )),
        ]),
      );
      return el('li', { className: `release release--${kind}` }, [
        el('div', { className: 'release__head' }, [
          el('span', { className: 'release__version mono', text: `v${release.version}` }),
          el('span', { className: `tag tag--${kind}`, text: kind === 'pre' ? 'pre-release' : kind }),
          el('time', { className: 'muted', text: release.date ?? '' }),
        ]),
        ...sections,
      ]);
    }),
  );
}

function renderCalculator() {
  const current = $('calc-current').value.trim();
  const commits = splitCommitLog($('calc-commits').value);
  const table = $('calc-table');

  if (current && !isValid(current)) {
    $('calc-next').textContent = '—';
    $('calc-summary').textContent = `"${current}" is not a valid semantic version (expected MAJOR.MINOR.PATCH).`;
    table.replaceChildren();
    return;
  }

  const result = nextVersion(current || null, commits);
  $('calc-next').textContent = result.next ? `v${result.next}` : 'no release';
  $('calc-next').dataset.type = result.releaseType ?? 'none';
  $('calc-summary').textContent = !commits.length
    ? 'Add some commit messages to see the next version.'
    : result.next
      ? `${result.releaseType.toUpperCase()} release${current ? ` from v${current}` : ' (first release)'}`
      : 'None of these commits trigger a release.';

  table.replaceChildren(
    ...result.commits.map((commit) =>
      el('tr', {}, [
        el('td', {}, [el('span', { className: `tag tag--${commit.releaseType ?? 'none'}`, text: commit.releaseType ?? '—' })]),
        el('td', { className: 'mono', text: commit.header }),
      ]),
    ),
  );
}

function setupCalculator(currentVersion) {
  const stable = parse(currentVersion);
  $('calc-current').value = stable && !stable.prerelease.length ? currentVersion : '1.4.2';
  $('calc-commits').value = EXAMPLES.minor.join('\n');
  $('calc-form').addEventListener('input', renderCalculator);
  document.querySelectorAll('[data-example]').forEach((button) =>
    button.addEventListener('click', () => {
      $('calc-commits').value = EXAMPLES[button.dataset.example].join('\n');
      renderCalculator();
    }),
  );
  renderCalculator();
}

async function main() {
  const build = await getJson('./build-info.json');
  // The live API only exists when served by the container; GitHub Pages is static
  const live = await getJson('./api/version').catch(() => null);
  renderBuildInfo(build, live);
  setupCalculator(build.version);
  renderHistory(await getJson('./releases.json').catch(() => []));
}

main().catch((error) => {
  $('hero-meta').textContent = `Could not load build information: ${error.message}`;
});
