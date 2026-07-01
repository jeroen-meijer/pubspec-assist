#!/usr/bin/env sh
# Verify a PR prepends new bullets under ## Upcoming (see CHANGELOG workflow in CLAUDE.md).
#
# Usage:
#   ./tool/check_changelog_pr.sh [<base-ref>]
#
# Default base ref: origin/main (or GITHUB_BASE_REF when set by Actions).
# Exempt: branches chore/release-* (prepare_release.sh rewrites the Upcoming section).

set -eu

ROOT="$(CDPATH='' cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

CHANGELOG="CHANGELOG.md"
BASE_REF="${1:-${GITHUB_BASE_REF:-main}}"
# Actions provides short ref name; resolve to origin/main when needed.
case "$BASE_REF" in
  main | master) BASE_REF="origin/$BASE_REF" ;;
esac

BRANCH="${GITHUB_HEAD_REF:-$(git branch --show-current)}"
case "$BRANCH" in
  chore/release-*)
    echo "skip: release branch $BRANCH (changelog rewritten by prepare_release.sh)"
    exit 0
    ;;
esac

if ! git rev-parse --verify "$BASE_REF" >/dev/null 2>&1; then
  git fetch origin "${BASE_REF#origin/}" --depth=1 2>/dev/null || git fetch origin main --depth=50
fi

if ! git rev-parse --verify "$BASE_REF" >/dev/null 2>&1; then
  echo "error: base ref $BASE_REF not found" >&2
  exit 1
fi

if ! git cat-file -e "$BASE_REF:$CHANGELOG" 2>/dev/null; then
  echo "error: $CHANGELOG missing on $BASE_REF" >&2
  exit 1
fi

# Extract non-empty lines in ## Upcoming until the next ## x.y.z version heading.
extract_upcoming_from_git() {
  git show "$1:$CHANGELOG" | awk '
    BEGIN { in_up = 0 }
    /^## Upcoming$/ { in_up = 1; next }
    in_up && /^## [0-9]+\.[0-9]+\.[0-9]+/ { exit }
    in_up && /^## / { exit }
    in_up && NF { print }
  '
}

extract_upcoming_from_file() {
  awk '
    BEGIN { in_up = 0 }
    /^## Upcoming$/ { in_up = 1; next }
    in_up && /^## [0-9]+\.[0-9]+\.[0-9]+/ { exit }
    in_up && /^## / { exit }
    in_up && NF { print }
  ' "$CHANGELOG"
}

BASE_LINES="$(extract_upcoming_from_git "$BASE_REF" || true)"
# Working tree matches the PR head commit in CI after checkout.
HEAD_LINES="$(extract_upcoming_from_file || true)"

if [ -z "$HEAD_LINES" ] && [ -n "$BASE_LINES" ]; then
  echo "error: $CHANGELOG ## Upcoming has no entries on this branch." >&2
  echo "Add new bullets at the top of the Upcoming list (below the header)." >&2
  exit 1
fi

if [ "$HEAD_LINES" = "$BASE_LINES" ]; then
  echo "error: $CHANGELOG ## Upcoming was not updated in this PR." >&2
  echo "Prepend at least one new bullet under ## Upcoming." >&2
  exit 1
fi

# HEAD upcoming must be: [new lines...] + [exact prior upcoming lines in order]
if [ -z "$BASE_LINES" ]; then
  echo "ok: new Upcoming section entries added"
  exit 0
fi

BASE_COUNT="$(printf '%s\n' "$BASE_LINES" | wc -l | tr -d ' ')"
HEAD_COUNT="$(printf '%s\n' "$HEAD_LINES" | wc -l | tr -d ' ')"
NEW_COUNT=$((HEAD_COUNT - BASE_COUNT))

if [ "$NEW_COUNT" -lt 1 ]; then
  echo "error: no new lines were added under ## Upcoming." >&2
  exit 1
fi

# Tail of HEAD must match all BASE lines (old entries stay below new ones).
TAIL_START=$((NEW_COUNT + 1))
HEAD_TAIL="$(printf '%s\n' "$HEAD_LINES" | tail -n +"$TAIL_START")"

if [ "$HEAD_TAIL" != "$BASE_LINES" ]; then
  echo "error: new changelog entries must be prepended at the top of ## Upcoming." >&2
  echo "Do not reorder or edit existing Upcoming bullets; add new lines above them." >&2
  exit 1
fi

NEW_LINES="$(printf '%s\n' "$HEAD_LINES" | head -n "$NEW_COUNT")"
# Allow top-level bullets (- ), indented sub-bullets (  - ), and blank lines.
BAD="$(printf '%s\n' "$NEW_LINES" | grep -vE '^(- |  -|$)' || true)"
if [ -n "$BAD" ]; then
  echo "error: expected new Upcoming lines to be bullets (- ) or indented sub-bullets (  - )" >&2
  printf '%s\n' "$BAD" | sed 's/^/  /' >&2
  exit 1
fi

echo "ok: $NEW_COUNT new Upcoming entr$( [ "$NEW_COUNT" = 1 ] && echo y || echo ies ) prepended"
