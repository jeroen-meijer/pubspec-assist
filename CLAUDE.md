# Pubspec Assist

VS Code extension for adding and updating Dart/Flutter `pubspec.yaml` dependencies via [pub.dev](https://pub.dev/) — fuzzy search, comma-separated multi-package add, auto-sort, and version resolution without leaving the editor.

## Tech Stack

- TypeScript 5, ESLint 9 (flat config), Mocha 11
- `yaml` v2 for pubspec parsing/serialization
- `fuse.js` for fuzzy package search
- npm for installs, scripts, and CI
- VS Code engine `^1.90.0`
- `@vscode/vsce` for packaging and Marketplace publish

## Key Paths

- `src/extension.ts` — activation, command registration
- `src/functions/addDependency.ts` — add/update dependency flow
- `src/functions/sortAllDependencies.ts` — sort pubspec dependencies
- `src/helper/yamlDependencies.ts` — YAML dependency map helpers (unit-testable)
- `src/helper/gitIssue.ts` — Git-hosted dependency detection
- `src/model/pubApi.ts` — pub.dev API client (`fetch`)
- `tool/check_changelog_pr.sh` — CI: verify prepended `## Upcoming` entries
- `tool/rewrite_changelog_for_release.sh` — insert version section on release
- `tool/prepare_release.sh` — open a release PR (changelog + version bump)
- `tool/verify_release_publish.sh` — sanity checks before publish
- `.github/actions/setup-node-deps` — Node install + npm/ESLint caches
- `.github/workflows/ci.yml` — lint + test on PRs
- `.github/workflows/changelog.yml` — changelog enforcement on PRs
- `.github/workflows/semantic-pull-request.yml` — semantic PR title check
- `.github/workflows/publish.yml` — merged release PR → Marketplace + GitHub release + tag

## Common Commands

```bash
npm install
npm run compile
npm run watch
npm run lint
npm test
npm run package          # build .vsix locally
npm run vscode:publish   # publish to Marketplace (requires VSCE_PAT)
```

Press **F5** in VS Code to launch an Extension Development Host.

## Workflow Rules

- **`main` is protected:** no direct pushes (including admins); changes land via **squash-merge PR** only.
- Required PR checks: **Lint**, **Test**, **Changelog updated**, **Validate PR Title**.
- CI runs on pull requests only, not on pushes to `main`.
- Run `npm run lint` and `npm test` before pushing.

## Git Conventions

Conventional commits, optional scope:

- `feat: ...` / `feat(search): ...`
- `fix: ...`
- `perf: ...`
- `refactor: ...`
- `docs: ...`
- `style: ...`
- `chore: ...`
- `ci: ...`

Branches: `feat/<description>`, `fix/<description>`, `chore/<description>`. Release branches: `chore/release-X.Y.Z`.

PR titles must use the same types (enforced by CI).

**PR body** — use this structure (see `.github/pull_request_template.md`):

```markdown
## Description

This PR <terse description of what the PR does>.
```

Start with “This PR …” in one clear sentence. Add bullets or notes below only when something else is important (breaking changes, follow-ups, manual steps).

## Changelog Workflow

- [CHANGELOG.md](CHANGELOG.md) follows [Keep a Changelog](https://keepachangelog.com/) with a preamble and `## Upcoming` section.
- All user-visible changes go under `## Upcoming`.
- New entries are **prepended** at the top of the Upcoming list (above existing bullets). CI enforces this (`tool/check_changelog_pr.sh`). Nested sub-bullets (`  - `) are allowed.
- Release branches `chore/release-*` are exempt from changelog CI.
- On release, `tool/rewrite_changelog_for_release.sh` inserts `## X.Y.Z - YYYY-MM-DD` under `## Upcoming` and moves current bullets into that section.

## Release Workflow

1. Add bullets under `## Upcoming` in `CHANGELOG.md`.
2. Merge feature PRs to `main` after CI passes.
3. Run `./tool/prepare_release.sh X.Y.Z` → release PR on `chore/release-X.Y.Z` with the **`release`** label.
4. Squash-merge the release PR → **Publish Release** publishes to VS Code Marketplace, creates a GitHub release with the `.vsix`, and tags `main` with `X.Y.Z`. Open VSX is updated separately via [Eclipse auto-publish](https://github.com/EclipseFdn/open-vsx.org/wiki/Auto-Publishing-Extensions).
5. If publish fails after merge: Actions → **Publish Release** → **Run workflow** with the same version.

## Project-Specific Guardrails

- IMPORTANT: YAML round-trip via the `yaml` library **loses comments** in `pubspec.yaml`. Do not claim comment preservation.
- IMPORTANT: `pubspec.yaml` must be a valid YAML map at the root. Malformed files can crash the extension — handle errors gracefully when touching parsing code.
- IMPORTANT: Package search requires network access to pub.dev.
- Do not use deprecated `workspace.rootPath` — use `workspace.workspaceFolders` for multi-root workspaces.
- IMPORTANT: Runtime deps (`fuse.js`, `yaml`) are NOT bundled into `out/` (plain `tsc`, no bundler) — `vsce package`/`vsce publish` must run *without* `--no-dependencies`, or the VSIX ships without `node_modules` and the extension fails to activate on install.

## Secrets

- `VSCE_PAT` — Azure DevOps PAT with Marketplace **Manage** scope (GitHub Actions secret).
- `OVSX_PAT` — Open VSX token (GitHub Actions secret, optional; reserved for future direct publish — not used by CI while auto-publish mirrors Marketplace releases).
- Local copies live in `.ci.env` (gitignored). Never commit secrets.

## What Not to Add

- No secrets, tokens, or `.env` files in the repo.
- No graphify or other local-only tooling in CI.
