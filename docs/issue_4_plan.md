# Development Plan: Issue #4

**Issue**: #4
**Title**: CI fails on ubuntu-latest (Ubuntu 26.04): Playwright 1.57.0 cannot install browsers
**Type**: Chore (dependency upgrade + CI/CD)
**Priority**: High: the required `main` check is red, so nothing merges through the queue.

## Executive Summary

CI broke when `ubuntu-latest` moved to Ubuntu 26.04, because Playwright 1.57.0 has no browser builds for it. We fix the problem class rather than the symptom:

1. Migrate Nx 22.3.3 → 24.0.6 in two steps. Nx 24 brings Angular 22 and TypeScript 6.
2. Upgrade Playwright to 1.65.
3. Run e2e inside the official Playwright Docker image, so the runner OS no longer decides which browsers can install.
4. Pin the runners and Node.
5. Replace the dead Sliplane deploy hook with the SSH + docker compose VPS deploy that mintplayer-ng-bootstrap already uses.

---

## Problem Statement

### Current Behavior
- `ci.yml` runs on `ubuntu-latest` (now 26.04) with Node 20. `npx playwright install --with-deps chromium firefox webkit` fails: `Playwright does not support chromium on ubuntu26.04-x64`.
- The lockfile resolves `@playwright/test` / `playwright` / `playwright-core` 1.57.0 (single copy, no newer nested version). `nx migrate latest` does **not** bump Playwright.
- `publish.yml` ends with a Sliplane deploy hook that returns 404 `SERVICE_NOT_FOUND`. The app no longer runs on Sliplane; it runs on the VPS.

### Expected Behavior
- The `main` check passes on PRs and in the merge queue. PR #3 merges.
- CI, publish and the Docker images all run Node 24. CI runners are pinned to `ubuntu-26.04`.
- A push to `main` builds the image, pushes it to GHCR and deploys it to the VPS at `karnaugh.mintplayer.com`.

### Impact
Nothing can merge today. After this, a GitHub runner-image change can no longer break browser installation silently.

---

## Technical Analysis

### Investigation results (team of 3, 2026-11-13)

| Area | Finding |
|---|---|
| `nx migrate latest` | Nx 22.3.3 → 24.0.6. Moves Angular to 22.1.8 / CLI 22.1.9, TypeScript `~5.9.2` → 6.0.3, vite → 8.3.8, angular-eslint 22.6.0, ng-packagr 22.1.1, `@analogjs/*` 2.2.0 → 2.7.5, zone.js 0.16.3. Warns about multi-major. ~70 migrations, 12 of them AI-prompt migrations under `tools/ai-migrations/`. |
| Range prefixes | The migrate strips `~`/`^` from bumped entries. Restore: `ng-packagr ~`, `typescript ~`, `typescript-eslint ^`, `@typescript-eslint/utils ^`, `verdaccio ^`, `vite ^`, `@swc-node/register ~`, `@swc/core ~`, `@swc/helpers ~`. Entries that were exact stay exact. |
| Playwright | Untouched by the migrate. Ubuntu 26.04 support starts in **1.61.0**: the `ubuntu26.04` platform string is in `playwright-core` from 1.61.0 on. Latest is **1.65.0**. `@nx/playwright` 24 peers `@playwright/test ^1.36.0`. `eslint-plugin-playwright` 1.8.3 → latest **2.12.2** (major). |
| Angular 22 ecosystem | `@angular/compiler-cli` 22 requires TS `>=6.0 <6.1`. `@mintplayer/ng-bootstrap` **22.35.0** exists (peers `@angular/* ^22`, `@angular/cdk ^22`, `@mintplayer/ng-animations ^22.1.1`, `ng-click-outside ^22.2.1`, `ng-focus-on-load ^22.1.2`, `ui-core ^1.9`, `pagination ^2.5.1`). It is **not** bumped by the migrate. vitest 4.0.9 stays (accepted by `@analogjs/vitest-angular`). |
| Node | Angular CLI 22 engines: `^22.22.3 \|\| ^24.15.0 \|\| >=26`, so Node 20 is out. Dockerfiles: root `node:latest`, `apps/shop` `node:22-alpine`, `apps/api` `node:lts-alpine`. |
| E2E configs | `karnaugh-demo-e2e`: chromium, firefox, webkit, Mobile Chrome, Mobile Safari, msedge, chrome. `shop-e2e`: chromium, Mobile Chrome, Mobile Safari, msedge, chrome. The branded channels only work because the runner image happens to have them. |
| VPS secrets | `VPS_HOST`, `VPS_PORT`, `VPS_USERNAME`, `VPS_SSH_KEY`, `VPS_SSH_KEY_PASSPHRASE` are **organization** secrets that this repo can already use. `SLIPLANE_DEPLOY_HOOK` is a repo secret (to delete). |

### Files to Modify
- `package.json`, `package-lock.json`, plus every file the Nx/Angular migrations touch (`nx.json`, `project.json`s, `tsconfig*.json`, `vite.config.*`, `eslint.config.mjs`s).
- `apps/karnaugh-demo-e2e/playwright.config.ts`, `apps/shop-e2e/playwright.config.ts`: chromium only.
- `apps/*-e2e/eslint.config.mjs`: only if `eslint-plugin-playwright` 2.x renamed `flat/recommended`.
- `.github/workflows/ci.yml`: runner, Node, Playwright image container.
- `.github/workflows/publish.yml`: runner, action versions, deploy job.
- `docker-compose.yml` (new): Traefik service for `karnaugh.mintplayer.com`.
- `Dockerfile`, `apps/shop/Dockerfile`, `apps/api/Dockerfile`: Node 24.
- `.gitignore`: whatever the Nx migrations add.

### Dependencies
- npm registry (Nx 23.x / 24.0.6, Angular 22, `@mintplayer/*` 22.x, Playwright 1.65).
- `mcr.microsoft.com/playwright:v1.65.0-noble` image.
- The VPS (Docker + Traefik with the external `web` network, as for ng-bootstrap). A DNS record for `karnaugh.mintplayer.com`.

### Architecture Considerations
- Follow the existing automated path in `.github/workflows/nx-migrate.yml`: `nx migrate <to> --include=all`, install, `nx migrate --run-migrations`, relock.
- The CI and deploy shapes are copied from `C:\Repos\mintplayer-ng-bootstrap\.github\workflows\pull-request.yml` (playwright-image job + container) and `publish-master.yml` (make-public + `deploy` via `appleboy/ssh-action`), adapted to branch `main`.

---

## Implementation Plan

### Phase 1: Nx 22 → 23 (gradual step 1)
1. `npx nx migrate 23` (latest 23.x) and record which versions it picked.
2. Restore the `~`/`^` prefixes on every entry the migrate changed, using the list above plus any new ones.
3. `npm install`, then `npx nx migrate --run-migrations`.
4. Review the diff, delete `migrations.json`, and run a type-check (`npx nx run-many -t typecheck`).
5. Commit: `chore: migrate Nx 22 → 23`.

### Phase 2: Nx 23 → 24 + Angular 22 + TypeScript 6 (gradual step 2)
1. `npx nx migrate latest` (24.0.6).
2. Restore the prefixes again. `typescript` becomes `~6.0.3`.
3. `npm install`, then `npx nx migrate --run-migrations`.
4. Work through each prompt in `tools/ai-migrations/`, including `@nx/playwright` `finish-inferred-conversion` and `@nx/vite` `create-ai-instructions-for-vite-8`. Then delete the folder.
5. Check that the `remove-deprecated-executors` migrations converted every target. Fix any leftover executor targets by hand.
6. Fix TS 6 / Angular 22 compile errors (`@angular/core` 22 migrations: `strict-templates-default`, `change-detection-eager`, …). Type-check.
7. Commit: `chore: migrate Nx 23 → 24, Angular 22, TypeScript 6`.

### Phase 3: Non-Nx dependency bumps
1. `@mintplayer/ng-bootstrap` `^21.6.0` → `^22.35.0`. Bump its peers (`@angular/cdk`, `@mintplayer/ng-animations`, `ng-click-outside`, `ng-focus-on-load`, `ui-core`, `pagination`) to the ranges listed above, adding them to `package.json` where npm needs them declared. Keep `^`.
2. `@playwright/test` `^1.36.0` → `^1.65.0`. Confirm `package-lock.json` resolves `playwright`/`playwright-core` 1.65.x, because the lockfile decides what runs.
3. `eslint-plugin-playwright` `^1.6.2` → `^2.12.2`. Check that `configs['flat/recommended']` still exists and adjust both e2e eslint configs if it doesn't.
4. `npm install`, then type-check and lint the e2e projects. Commit.

### Phase 4: E2E configs → chromium only
1. In both `playwright.config.ts` files, keep only the `chromium` project. Remove firefox, webkit, Mobile Chrome, Mobile Safari, msedge and chrome.
2. Commit.

### Phase 5: CI workflow
1. `ci.yml`: add a `playwright-image` job that reads `node_modules/@playwright/test` version from `package-lock.json` and outputs `mcr.microsoft.com/playwright:v<version>-noble`.
2. The existing job keeps the **name `main`** (it is the required check). Changes:
   - `runs-on: ubuntu-26.04` and `needs: playwright-image`.
   - `container: { image: <output>, options: --user 1001 }`.
   - `setup-node` with `node-version: 24`.
   - Drop the `playwright install` step.
3. Commit.

### Phase 6: Publish + VPS deploy + Node 24 images
1. `publish.yml`:
   - `runs-on: ubuntu-26.04`.
   - Remove the Sliplane step.
   - Add a **make-image-public** step (`gh api --method PATCH /orgs/<owner>/packages/container/<repo> -f visibility=public`, tolerant of failure) and the `artifact-metadata: write` permission.
   - Add a `deploy` job (`needs: build-and-publish`, `if: github.ref == 'refs/heads/main'`) using `appleboy/ssh-action` with the org `VPS_*` secrets. It runs `mkdir -p /var/www/karnaugh`, fetches `docker-compose.yml` from `main`, logs in to GHCR, then runs `docker compose pull`, `docker compose up -d --remove-orphans` and `docker image prune -f`.
2. New `docker-compose.yml`: one service `karnaugh` with image `ghcr.io/mintplayer/karnaugh-map-app:main`. Traefik labels for ``Host(`karnaugh.mintplayer.com`)``, entrypoint `websecure`, certresolver `letsencrypt`, port 80. External network `web`. `restart: unless-stopped`.
3. Dockerfiles:
   - Root `FROM node:latest as node_image` → `FROM node:24 AS node_image`.
   - `apps/shop/Dockerfile` `node:22-alpine` → `node:24-alpine`.
   - `apps/api/Dockerfile` `node:lts-alpine` → `node:24-alpine`.
4. Commit.

### Phase 7: Verification (tests run once, here)
1. Locally: `npx nx run-many -t build`, then `npx nx run-many -t lint test typecheck`, then `npx nx run-many -t e2e --parallel=1`.
2. `docker build .` locally. The image serves the demo on :80.
3. Push and open the PR. The `main` check must be green.
4. After merge: publish is green, the deploy job is green and `https://karnaugh.mintplayer.com` serves the app. Re-queue PR #3.

---

## Test Scenarios

### Scenario 1: CI on Ubuntu 26.04
- **Given**: a PR on this branch
- **When**: `ci.yml` runs
- **Then**: the `main` check passes. Browsers come from the Playwright image with no apt step, and e2e runs chromium only.

### Scenario 2: Lockfile drives the e2e image
- **Given**: `package-lock.json` resolves `@playwright/test` 1.65.x
- **When**: the `playwright-image` job runs
- **Then**: it outputs `mcr.microsoft.com/playwright:v1.65.x-noble`, and that image exists on MCR.

### Scenario 3: Deploy on push to main
- **Given**: this PR merged
- **When**: `publish.yml` runs on `main`
- **Then**: the image is pushed, attested and made public. The deploy job brings up `/var/www/karnaugh`, and `karnaugh.mintplayer.com` returns the demo over HTTPS.

### Scenario 4: App behaviour unchanged after Angular 22
- **Given**: the migrated workspace
- **When**: unit tests and the chromium e2e suites run
- **Then**: all pass with no test edits other than those the migrations require.

---

## Acceptance Criteria

- [ ] Nx 24.0.6, Angular 22.x, TypeScript 6.0.x. Every `~`/`^` prefix from the original `package.json` is preserved.
- [ ] `@playwright/test` resolves ≥ 1.65.0 in `package-lock.json`. `eslint-plugin-playwright` 2.x.
- [ ] `@mintplayer/ng-bootstrap` 22.x and its peers installed with no peer-dependency errors.
- [ ] `ci.yml`: `ubuntu-26.04`, Node 24, e2e in the Playwright image, chromium only, required check still named `main`.
- [ ] `publish.yml`: `ubuntu-26.04`, Sliplane step removed, VPS deploy job added. `docker-compose.yml` added.
- [ ] All three Dockerfiles on Node 24.
- [ ] `main` green on the PR. PR #3 merges via `/queue` after this lands.
- [ ] After merge: `https://karnaugh.mintplayer.com` serves the app.

---

## Build & Test Commands

```bash
npx nx run-many -t build
npx nx run-many -t lint test typecheck
npx nx run-many -t e2e --parallel=1
docker build -t karnaugh-local .
```

---

## Related Files

- `.github/workflows/ci.yml`, `.github/workflows/publish.yml`, `.github/workflows/nx-migrate.yml`
- `package.json`, `package-lock.json`, `nx.json`
- `apps/karnaugh-demo-e2e/playwright.config.ts`, `apps/shop-e2e/playwright.config.ts`
- `Dockerfile`, `apps/shop/Dockerfile`, `apps/api/Dockerfile`
- Reference: `C:\Repos\mintplayer-ng-bootstrap\.github\workflows\pull-request.yml`, `publish-master.yml`, `docker-compose.yml`
