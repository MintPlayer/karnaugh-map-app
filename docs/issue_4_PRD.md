# Product Requirements Document: Nx 24 / Angular 22 / Playwright 1.65 upgrade + CI & VPS deploy

**Issue**: #4
**Title**: CI fails on ubuntu-latest (Ubuntu 26.04): Playwright 1.57.0 cannot install browsers
**Status**: Draft
**Created**: 2026-11-13
**Last Updated**: 2026-11-13

---

## Summary

We fix the failure class instead of only pinning the runner:

- **Upgrade the stack.** Nx 22.3.3 → 24.0.6, migrated in two steps (23 first, then 24). The second step brings Angular 22 and TypeScript 6. Playwright goes to 1.65; Ubuntu 26.04 support starts at 1.61.
- **Decouple browsers from the runner OS.** E2E runs inside the Playwright Docker image that matches the lockfile version, and only chromium runs. Runners are pinned to `ubuntu-26.04`, and CI and every Docker image move to Node 24.
- **Replace the deploy.** The Sliplane hook is gone. Its replacement is the SSH + docker compose + Traefik VPS deploy that mintplayer-ng-bootstrap already uses, serving `karnaugh.mintplayer.com`.

The load-bearing trade-off is scope. A two-major framework upgrade, a CI rewrite and a new deploy path all land in one PR, because the user's rule is one PR per task. To keep it reviewable, each step is its own commit.

---

## Overview

The `main` check (required by the merge queue) fails at "Install Playwright browsers" because `ubuntu-latest` became Ubuntu 26.04 and Playwright 1.57.0 refuses to install there. At the same time, the workspace is two Nx majors and one Angular major behind. The publish workflow's deploy hook points at a Sliplane service that no longer exists.

---

## Goals & Objectives

### Primary Goals
- Unblock the merge queue: `main` green on PRs, and PR #3 merges.
- Bring the workspace to the latest Nx (24.0.6) and Angular (22.x) without losing the `~`/`^` range style in `package.json`.
- Make CI immune to GitHub runner-image OS changes for browser installs.
- Restore automatic deployment on push to `main`, now to the VPS.

### Success Metrics
- `main` check green on this PR and on PR #3 in the queue.
- `publish` workflow green end to end on the merge commit, including `deploy`.
- `https://karnaugh.mintplayer.com` serves the app after merge.

---

## Chosen Design

Design fan-out not run: this is a mechanical dependency and pipeline upgrade with no new code interface. The CI and deploy shapes are copied from a proven sibling repository (mintplayer-ng-bootstrap), so there is no plausible second shape worth exploring.

Decisions resolved during grilling (2026-11-13):

| # | Decision | Chosen | Rejected (why) |
|---|---|---|---|
| D1 | Migrate mode | **Gradual**: `nx migrate 23`, run, commit; then `nx migrate latest`, run, commit | Direct 22→24 in one pass: a failure could come from any of ~70 migrations, and Nx itself warns against skipping a major. |
| D2 | Runner image | **Pin `ubuntu-26.04`** in `ci.yml` and `publish.yml` | `ubuntu-latest`: the silent drift that caused this issue. `ubuntu-24.04`: an older OS the upgraded stack doesn't need, retired sooner. |
| D3 | Browsers | **Chromium only**: e2e configs reduced to the `chromium` project | Keep all and install explicitly: slowest, most to break. Leave as is: msedge/chrome stay dependent on the runner image. |
| D4 | Node | **24 everywhere**: CI `node-version: 24`, and the root, `apps/shop` and `apps/api` Dockerfiles pinned to `node:24(-alpine)` | 22 in CI only: Node 22 is EOL in April 2027 and the images stay unpinned. 24 in CI only: CI and shipped images could differ. |
| D5 | Deploy | **Remove Sliplane; add a VPS deploy in this PR**, modelled on mintplayer-ng-bootstrap `publish-master.yml` (`appleboy/ssh-action`, org `VPS_*` secrets, `/var/www/karnaugh`, `docker compose pull && up -d`) | Separate issue: the user no longer deploys to Sliplane and pointed at the ng-bootstrap workflows as the model. |
| D6 | Domain | **`karnaugh.mintplayer.com`**, image `ghcr.io/mintplayer/karnaugh-map-app:main` | n/a |
| D7 | E2E browsers source | **Playwright Docker image** `mcr.microsoft.com/playwright:v<lockfile version>-noble`, resolved by a `playwright-image` job (as in ng-bootstrap `pull-request.yml`) | `npx playwright install --with-deps chromium` on the runner: still apt- and OS-dependent, which is exactly the failure being fixed. |

Decisions taken without asking (conventional defaults, open to reversal):
- **`@analogjs/*`**: keep the version `nx migrate` selects (2.7.5) rather than the latest 2.9.7. Nx tested that combination.
- **Upgrades outside the migrate**: also bump `@mintplayer/ng-bootstrap` to 22.x (it's required for Angular 22) and `eslint-plugin-playwright` to 2.x, the latest major.
- **vitest**: stays at 4.0.9 (accepted by `@analogjs/vitest-angular` 2.x). No vitest major bump.

---

## Out of Scope

- Splitting `ci.yml` into parallel/sharded jobs, Nx remote cache, or coverage upload as in ng-bootstrap. *Rationale: only the Playwright-image and deploy patterns are taken over; the rest is an optimisation, not part of the fix.*
- Firefox, WebKit, mobile-emulation and branded (msedge/chrome) e2e coverage. *Rationale: D3, chromium only.*
- Publishing or deploying the `api` and `shop` apps. *Rationale: only the root `Dockerfile` (karnaugh-demo) is published today; their Dockerfiles only get the Node 24 pin (D4).*
- Changing `nx-migrate.yml`, `dependency-apply.yml` or `dependency-lookup.yml`. *Rationale: they belong to the dependency bot from PR #2. The runner pin covers `ci.yml` and `publish.yml` only.*
- The `nginx:latest` base image in the root Dockerfile. *Rationale: not a Node/OS drift problem for this issue.*

---

## Functional Requirements

### Must Have (P0)
- [ ] **FR-1**: Nx 24.0.6, reached via a 23.x step, with all migrations run and committed per step.
- [ ] **FR-2**: Angular 22.x, TypeScript 6.0.x. Workspace builds, lints, type-checks and passes unit tests.
- [ ] **FR-3**: Every `~`/`^` prefix present in the original `package.json` is still present after the migrations (same prefix, new version).
- [ ] **FR-4**: `@playwright/test` ≥ 1.65.0 resolved in `package-lock.json`. `eslint-plugin-playwright` 2.x with working e2e lint.
- [ ] **FR-5**: `@mintplayer/ng-bootstrap` 22.x with its peer packages satisfied.
- [ ] **FR-6**: Both e2e configs run the `chromium` project only.
- [ ] **FR-7**: `ci.yml` keeps the job/check name `main`. It runs on `ubuntu-26.04` inside the Playwright image derived from the lockfile, with Node 24 and no `playwright install` step.
- [ ] **FR-8**: `publish.yml` runs on `ubuntu-26.04`, has no Sliplane step, makes the GHCR image public and deploys to the VPS via SSH + docker compose.
- [ ] **FR-9**: A `docker-compose.yml` at the repo root defines the `karnaugh` service with Traefik labels for `karnaugh.mintplayer.com` on the external `web` network.
- [ ] **FR-10**: The root, `apps/shop` and `apps/api` Dockerfiles use Node 24 images.

### Should Have (P1)
- [ ] **FR-11**: Delete the now-unused `SLIPLANE_DEPLOY_HOOK` repo secret after merge (manual, by the owner).

---

## Timeline & Milestones

### Milestone 1: Nx 22 → 23
- [ ] `nx migrate 23`, restore prefixes, install, run migrations, type-check, commit

### Milestone 2: Nx 23 → 24 + Angular 22 + TS 6
- [ ] `nx migrate latest`, restore prefixes, install, run migrations
- [ ] Apply the AI-prompt migrations (`tools/ai-migrations/`), then delete the folder
- [ ] Fix TS 6 / Angular 22 breakages, type-check, commit

### Milestone 3: Non-Nx bumps
- [ ] ng-bootstrap 22 + peers, Playwright 1.65, eslint-plugin-playwright 2.x, commit

### Milestone 4: E2E chromium only
- [ ] Trim both Playwright configs, commit

### Milestone 5: CI
- [ ] `playwright-image` job + containerised `main` job on `ubuntu-26.04`, Node 24, commit

### Milestone 6: Publish + deploy + images
- [ ] `publish.yml` deploy job, `docker-compose.yml`, Node 24 Dockerfiles, commit

### Milestone 7: Verification
- [ ] Full local build/lint/test/typecheck/e2e + `docker build`. PR green. Post-merge deploy verified.

---

## Open Questions

- [ ] DNS: does `karnaugh.mintplayer.com` already point at the VPS (`VPS_HOST`)? *Assumption: the owner creates or confirms the A record before merge. Traefik's Let's Encrypt challenge fails without it.*
- [ ] Does `/var/www` on the VPS already hold a karnaugh folder with a different name or layout (the owner mentioned one)? *Assumption: the deploy uses `/var/www/karnaugh` and creates it if missing. If an existing folder or container serves the app, the owner renames or removes it so two containers don't claim the same Traefik router.*

---

## Technical Notes (Issue-Specific)

- **The required check is named `main`.** Renaming or splitting the job silently unblocks nothing: the queue keeps waiting for `main`. Any new job (`playwright-image`) is a dependency of `main`, not a replacement.
- **Merge queue trigger.** `ci.yml` triggers on `push` to `main` and `pull_request` only. If the queue runs checks on `merge_group` events, a `merge_group:` trigger is needed. Check the repo ruleset during Milestone 5 and add it only if the queue requires it.
- **Restoring prefixes.** `nx migrate` writes exact versions for bumped entries. Restore the original prefix with the new version, e.g. `"typescript": "~6.0.3"`, `"vite": "^8.3.8"`.
- **Playwright image tag.** Use the `-noble` suffix: the image's own OS is Ubuntu 24.04, independent of the runner's 26.04. The job runs as `--user 1001` so the checked-out workspace stays writable.
- **GHCR visibility.** New org packages default to private, so the VPS `docker compose pull` would fail with `denied` unless it logs in. The deploy logs in with `GITHUB_TOKEN` *and* the make-public step runs, the same as ng-bootstrap.
- **Container image tag.** `docker/metadata-action` tags pushes to `main` as `:main`, which `docker-compose.yml` references.

---

## Related
- Issue #4, PR #3 (onboarding, blocked by this)
- `C:\Repos\mintplayer-ng-bootstrap\.github\workflows\pull-request.yml`, `publish-master.yml`, `docker-compose.yml`
- See CLAUDE.md for: running tasks through `nx`
