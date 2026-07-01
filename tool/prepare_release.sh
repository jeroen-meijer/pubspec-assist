#!/usr/bin/env sh
# Prepare a release PR: changelog, package.json version bump, lint/test/compile, commit, gh pr.
# Usage: ./tool/prepare_release.sh <x.y.z>
# Requires: git, gh, node, npm, awk; run from repo root.
#
# Opens a PR labeled "release". Squash-merge to main triggers publish; the workflow
# tags the merge commit with the version after a successful release.

set -eu

ROOT="$(CDPATH='' cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

CHANGELOG_PATH="CHANGELOG.md"
PACKAGE_PATH="package.json"
CHANGELOG_REWRITE_SCRIPT="$ROOT/tool/rewrite_changelog_for_release.sh"
RELEASE_LABEL="release"

if [ "$#" -ne 1 ]; then
  echo "usage: $0 <x.y.z>" >&2
  exit 2
fi
VERSION="$1"

echo "$VERSION" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+$' || {
  echo "error: version must be semver x.y.z (e.g. 1.3.0)" >&2
  exit 2
}

git fetch origin main --tags

if git ls-remote --exit-code --tags origin "refs/tags/${VERSION}" >/dev/null 2>&1; then
  echo "error: tag ${VERSION} already exists on origin." >&2
  exit 1
fi

if gh release view "$VERSION" >/dev/null 2>&1; then
  echo "error: GitHub release ${VERSION} already exists." >&2
  exit 1
fi

if ! gh label list --json name --jq '.[].name' | grep -qx "$RELEASE_LABEL"; then
  echo "error: GitHub label \"${RELEASE_LABEL}\" not found. Create it in the repo first." >&2
  exit 1
fi

BRANCH="chore/release-${VERSION}"
if git show-ref --verify --quiet "refs/heads/${BRANCH}"; then
  echo "error: branch ${BRANCH} already exists." >&2
  exit 1
fi

git checkout -b "$BRANCH"

"$CHANGELOG_REWRITE_SCRIPT" "$VERSION" \
  "$ROOT/$CHANGELOG_PATH" "$ROOT/$CHANGELOG_PATH"

npm version "$VERSION" --no-git-tag-version --allow-same-version

if ! npm run lint; then
  echo "error: npm run lint failed; fix issues and retry." >&2
  exit 1
fi

if ! npm test; then
  echo "error: npm test failed; fix issues and retry." >&2
  exit 1
fi

if ! npm run compile; then
  echo "error: npm run compile failed; fix issues and retry." >&2
  exit 1
fi

git add "$CHANGELOG_PATH" "$PACKAGE_PATH" package-lock.json
git commit -m "chore: prepare release ${VERSION}"

git push -u origin "$BRANCH"

gh pr create \
  --title "chore: release ${VERSION}" \
  --label "$RELEASE_LABEL" \
  --body "$(cat <<EOF
## Description

This PR prepares release **${VERSION}**: changelog section and \`package.json\` version bump.

Merge with **squash** after CI passes. Merging this PR (with the \`${RELEASE_LABEL}\` label) publishes to the VS Code Marketplace and Open VSX (when configured), creates a GitHub release, and tags \`main\` with \`${VERSION}\`.

To retry a failed publish without merging again: Actions → **Publish Release** → **Run workflow** with version \`${VERSION}\`.
EOF
)"

echo "Created branch ${BRANCH} and opened a release PR (label: ${RELEASE_LABEL})."
