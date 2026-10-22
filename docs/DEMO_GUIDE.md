# Demo guide

A step-by-step script for demonstrating the pipeline live. It takes about 15 minutes, most of it waiting for workflows to run. Open these tabs beforehand:

- the repository's **Actions**, **Releases** and **Packages** pages
- the live site, https://devopslabca.onrender.com
- a terminal in the project folder

> **Before the demo:** complete [SETUP.md](SETUP.md), make sure at least one release exists, and open the Render URL once so the free instance is awake.

---

## 1. Show the starting point (2 min)

```bash
git log --oneline --decorate -8   # Conventional Commits, release commits, vX.Y.Z tags
git tag --list 'v*'
npm run release:preview           # "Next release: none": nothing unreleased yet
```

Then show, in the browser:

- **Releases** page: notes are generated per version, with the `.tar.gz` and `SHA256SUMS.txt` assets attached.
- **Packages** page: one image with the tags `X.Y.Z`, `X.Y`, `X` and `latest`.
- **Dashboard**: the version shown in the top-left matches the latest tag.

## 2. Commit rules are enforced (1 min)

```bash
git commit --allow-empty -m "updated stuff"      # ✖ rejected by commitlint (commit-msg hook)
git commit --allow-empty -m "Feat: Something."   # ✖ rejected (type case, subject rules)
```

CI checks the same rules again on every pull request, so skipping the hook with `--no-verify` doesn't get a bad message into a reviewed change.

## 3. A feature becomes a MINOR release (6 min)

Create a branch and add a small endpoint that checks whether a version number is valid. Add this route to `src/server/api.js`, next to the other `/semver` routes:

```js
  router.get('/semver/valid', (req, res) => {
    const { version } = req.query;
    if (typeof version !== 'string') throw new BadRequest('"version" is required');
    res.json({ version, valid: isValid(version) });
  });
```

Add a test to the `GET /api/semver/bump and /compare` block in `tests/integration/api.test.js`:

```js
  it('checks whether a version is valid', async () => {
    await request(app).get('/api/semver/valid?version=2.0.0-rc.1').expect(200, { version: '2.0.0-rc.1', valid: true });
    await request(app).get('/api/semver/valid?version=1.2').expect(200, { version: '1.2', valid: false });
    await request(app).get('/api/semver/valid').expect(400);
  });
```

Then:

```bash
git switch -c feat/valid-endpoint
git add -A
git commit -m "feat(api): add version validation endpoint"   # hook runs lint + tests
npm run release:preview        # → Next release: vX.(Y+1).0 (minor)
git push -u origin feat/valid-endpoint
gh pr create --fill
```

On the pull request, show:

- the **CI** checks: commitlint, Node 22 and Node 24 tests, audit, build, Docker smoke test;
- the **Release preview** job summary: *"Merging this will release vX.Y.0 (minor)"*;
- the uploaded artifacts: `dist` and `test-reports`.

Merge with **Rebase and merge**, or **Squash** (the PR title is checked too), then open the **Release** run:

1. **Quality gate**: the same CI runs again on `main`.
2. **Semantic release**: the log shows *"The next release version is X.Y.0"*. A release commit and tag appear in `git log`.
3. **Container image → GHCR**: the summary lists the new tags and the image digest.
4. **Staging**: the image is started with Compose, and the smoke test confirms the version.
5. **Production**: click **Review deployments → Approve** if approval is configured. Render is redeployed, and the smoke test waits until the live URL reports the new version.

Refresh the dashboard to see the new version, the new entry in the release history, and the updated "Released" link.

```bash
git pull && git log --oneline --decorate -3 && cat CHANGELOG.md | head -20
```

## 4. A fix becomes a PATCH, and docs need no release (optional, 3 min)

Push the commit `fix(ui): correct calculator hint text` to get `X.Y.1`. A `docs: improve README` commit runs CI, but the Release run ends with **"No release"** and nothing is deployed.

## 5. Rollback (2 min)

Go to **Actions → Deploy → Run workflow**, enter the *previous* version (for example `1.1.1`) and choose `production`.

The old image is redeployed without a rebuild and verified. Refresh the dashboard to see the old version, then run the workflow again with the latest version to roll forward.

## 6. Breaking change → MAJOR (optional)

```bash
git commit -m "feat(api)!: return compare result as a string" -m "BREAKING CHANGE: /api/semver/compare now returns relation only"
npm run release:preview   # → (X+1).0.0 (major)
```

---

## Questions you may be asked

**Who decides the version number?**
No person does. semantic-release reads the commits since the last `vX.Y.Z` tag. The most significant change sets the version: a breaking change gives major, `feat` gives minor, and `fix`/`perf` give patch.

**Why Git tags?**
A tag permanently marks the exact commit that was released. It makes the history auditable (`git tag`, `git diff v1.1.0 v1.2.0`), and every artifact, including the image, the GitHub Release and the tarball, traces back to it.

**Why doesn't the release commit start the pipeline again?**
Its message contains `[skip ci]`. Also, tags pushed with `GITHUB_TOKEN` don't trigger workflows. That is why image publishing and deployment run as later jobs in the same workflow and use the release job's outputs.

**What stops a broken change from being released?**
The release job `needs` the quality gate: tests on two Node versions, coverage thresholds, lint, a dependency audit, and a Docker build plus smoke test. A failure anywhere stops the run before a version or tag is created. After that, staging must pass a smoke test before production.

**Is what you tested the same as what you deployed?**
Yes. The image is built once, tagged with its version, and *promoted*: staging and production pull the same `ghcr.io/…:X.Y.Z`. The smoke test checks that `/api/version` reports exactly that version.

**How do you roll back?**
Run the Deploy workflow with an earlier version. Every released image stays in GHCR under its version tag, so rolling back is just another deployment.

**What do the `1`, `1.4` and `latest` image tags mean?**
`1.4.2` never changes once published. `1.4` and `1` always point to the newest matching release, so users can choose how much change they accept. `latest` is the newest stable release. Pre-releases only get `X.Y.Z-beta.N` and `beta`.

**How does the PR "release preview" know the version?**
`scripts/next-version.js` runs the app's own commit analyser on the commits since the last tag. It uses the same rules as semantic-release's analyser, and both gave the same result for the patch, minor, major and no-release cases tested.
