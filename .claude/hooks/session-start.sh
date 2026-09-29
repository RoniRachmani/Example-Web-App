#!/bin/bash
# Installs npm dependencies for both apps so tests, lint and builds work in
# Claude Code on the web sessions.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

# npm ci rather than npm install: it installs exactly what the lockfiles pin and
# never rewrites them, which an older npm in the container would otherwise do.
for dir in back-end front-end; do
  (cd "$dir" && npm ci --no-audit --no-fund)
done
