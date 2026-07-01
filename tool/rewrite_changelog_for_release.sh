#!/usr/bin/env sh
# Insert a new ## <version> - <date> section under ## Upcoming (per CHANGELOG release workflow).
# Usage:
#   ./tool/rewrite_changelog_for_release.sh <x.y.z> <input.md>           # write to stdout
#   ./tool/rewrite_changelog_for_release.sh <x.y.z> <input.md> <output.md>  # write to file (atomically)
# Requires: awk

set -eu

if [ "$#" -ne 2 ] && [ "$#" -ne 3 ]; then
  echo "usage: $0 <x.y.z> <input.md> [<output.md>]" >&2
  exit 2
fi

VERSION="$1"
INPUT="$2"
RELEASE_DATE="$(date +%Y-%m-%d)"

echo "$VERSION" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+$' || {
  echo "error: version must be semver x.y.z (e.g. 1.3.0)" >&2
  exit 2
}

if ! grep -q '^## Upcoming$' "$INPUT"; then
  echo "error: $INPUT must contain a ## Upcoming section" >&2
  exit 1
fi

run_awk() {
  awk -v ver="$VERSION" -v date="$RELEASE_DATE" '
/^## Upcoming$/ {
  print "## Upcoming"
  print ""
  print "## " ver " - " date
  print ""
  in_release = 1
  skip_blank = 1
  next
}
in_release && skip_blank && /^$/ {
  next
}
in_release && /^## [0-9]+\.[0-9]+\.[0-9]+/ {
  print
  in_release = 0
  next
}
in_release {
  skip_blank = 0
  print
  next
}
{ print }
  ' "$INPUT"
}

if [ "$#" -eq 2 ]; then
  run_awk
else
  OUTPUT="$3"
  TMP="${OUTPUT}.tmp.$$"
  run_awk >"$TMP"
  mv "$TMP" "$OUTPUT"
fi
