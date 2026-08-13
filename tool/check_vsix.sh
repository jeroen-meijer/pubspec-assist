#!/usr/bin/env sh
# Verify the packaged VSIX contains the esbuild bundle and not unpacked
# yaml/fuse.js (issue #170: vsce --no-dependencies + tsc left require()s external).
#
# Usage: ./tool/check_vsix.sh [path-to.vsix]
# If no path is given, uses the newest pubspec-assist-*.vsix in the repo root.

set -eu

ROOT="$(CDPATH='' cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ "${1:-}" != "" ]; then
  VSIX="$1"
else
  VSIX="$(ls -1t pubspec-assist-*.vsix 2>/dev/null | head -1 || true)"
fi

if [ -z "${VSIX:-}" ] || [ ! -f "$VSIX" ]; then
  echo "error: no VSIX found (run npm run package first)" >&2
  exit 1
fi

LISTING="$(unzip -Z -1 "$VSIX")"

if ! printf '%s\n' "$LISTING" | grep -qx 'extension/out/extension.js'; then
  echo "error: $VSIX missing extension/out/extension.js" >&2
  exit 1
fi

if printf '%s\n' "$LISTING" | grep -q 'node_modules/yaml\|node_modules/fuse.js'; then
  echo "error: $VSIX still ships unbundled yaml/fuse.js under node_modules" >&2
  exit 1
fi

echo "ok: $VSIX bundles runtime deps"
