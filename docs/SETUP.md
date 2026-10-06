# One-time setup

The pipeline works as soon as the repository is on GitHub: CI, versioning, tags, GitHub Releases, the GHCR image and the staging deployment need no configuration. The production targets are switched on with the steps below.

Commands use the [GitHub CLI](https://cli.github.com). Replace `OWNER/REPO` with your repository, or set them once:

```bash
export REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
```

## 1. Create the repository and push

```bash
gh repo create semver-release-pipeline --public --source=. --remote=origin --push
```

Use a **public** repository. GitHub Pages, environment approval rules and free GHCR pulls all work on the free plan only for public repositories.

The push to `main` starts the **Release** workflow. If the history contains a `feat` or `fix` commit, it publishes **v1.0.0**.

## 2. Environments

`staging` and `production` are created automatically the first time a job uses them. To make production deploys wait for a manual approval, which is the release-management gate, add yourself as a required reviewer:

```bash
gh api -X PUT "repos/$REPO/environments/staging"
gh api -X PUT "repos/$REPO/environments/production" --input - <<EOF
{ "reviewers": [ { "type": "User", "id": $(gh api user -q .id) } ] }
EOF
```

After this, each production deployment pauses until you click **Review deployments → Approve** on the workflow run.

## 3. GitHub Pages (release dashboard)

```bash
gh api -X POST "repos/$REPO/pages" -f build_type=workflow
gh variable set DEPLOY_PAGES --body true
```

Every stable release is then published to `https://OWNER.github.io/REPO/`. That copy is static, so the dashboard shows "Static site" as its runtime and the calculator runs in the browser.

## 4. Make the container image public

After the first release, open **Your profile → Packages → semver-release-pipeline → Package settings → Change visibility → Public**. Anyone, including Render, can then pull it:

```bash
docker run -p 3000:3000 ghcr.io/OWNER/REPO:latest
```

## 5. Render: production container hosting (optional, free)

1. Sign in at [render.com](https://render.com) with GitHub.
2. Choose **New → Web Service → Existing image**. Enter `ghcr.io/OWNER/REPO:latest` and pick the **Free** instance type.
3. Under **Environment**, add `APP_ENV=production`. Render sets `PORT` itself, and the app reads it.
4. Under **Settings → Health Check Path**, enter `/health`.
5. Copy the **Deploy Hook** URL from **Settings**, then give the pipeline the hook and the service URL:

```bash
gh secret set RENDER_DEPLOY_HOOK_URL --env production    # paste the hook URL when prompted
gh variable set PRODUCTION_URL --body "https://<your-service>.onrender.com"
```

From then on, each release calls the hook with `imgURL=ghcr.io/OWNER/REPO:X.Y.Z`, so Render runs exactly the version that was released. The smoke test then polls `PRODUCTION_URL` until `/api/version` reports that version, waiting up to 10 minutes. Free Render instances sleep when idle and take about a minute to wake.

If these values are not set, the production job still runs. It acts as the approval gate and publishes Pages, and it leaves a notice that the Render step was skipped.

## 6. Pre-release channel (optional)

```bash
git switch -c beta && git push -u origin beta
```

Commits pushed to `beta` release as `X.Y.Z-beta.N`. They are tagged `:beta` in GHCR and deployed to staging only. Merge `beta` into `main` to promote them to a stable release.

## 7. Branch protection (optional)

To require pull requests and passing checks on `main`, use **Settings → Rules → Rulesets → New branch ruleset** and target `main`:

- **Require a pull request before merging**
- **Require status checks to pass**: add `Lint & test (Node 22)`, `Lint & test (Node 24)`, `Conventional commits`, `Docker build & container smoke test` and `Build application`

The release job pushes the `chore(release)` commit to `main`, and a ruleset blocks that push for the default `GITHUB_TOKEN`. To allow it:

1. Add **Repository admin** to the ruleset's bypass list.
2. Create a fine-grained personal access token for an admin with **Contents: read and write** on this repository.
3. Store the token:

```bash
gh secret set RELEASE_TOKEN
```

`release.yml` uses `RELEASE_TOKEN` automatically when it exists.

## Reference: configuration used by the workflows

| Name | Kind | Where | Purpose |
|---|---|---|---|
| `GITHUB_TOKEN` | automatic | — | Tags, releases, GHCR push, Pages |
| `RELEASE_TOKEN` | secret (optional) | repository | Only needed with branch protection |
| `RENDER_DEPLOY_HOOK_URL` | secret (optional) | `production` environment | Triggers the Render deployment |
| `PRODUCTION_URL` | variable (optional) | repository | Production smoke test and environment link |
| `DEPLOY_PAGES` | variable (optional) | repository | `true` publishes the dashboard to Pages |
