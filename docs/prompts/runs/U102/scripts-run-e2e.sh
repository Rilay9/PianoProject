#!/usr/bin/env bash
# scripts-run-e2e.sh <log-name> <workers> <spec paths relative to app/, each optionally :line>
# Checks every named spec file exists and port 4593 is free, then runs them from app/ on U102's port copy
# (build/u102/playwright.u102-4593.config.ts, which serves the bundle in $U102_DIST, default app/dist, with
# `vite preview` on 4593). Extra environment (U102_PHASE, U102_DIST) passes through. The log's first line is
# the command, its last line exit=<code>.
W="$(cd "$(dirname "$0")/../../../.." && pwd)"
log="$W/docs/prompts/runs/U102/$1"; shift
workers="$1"; shift
{
  echo "\$ (cd app) npx playwright test -c ../build/u102/playwright.u102-4593.config.ts --workers=$workers $*   [U102_DIST=${U102_DIST:-app/dist} U102_PHASE=${U102_PHASE:-}]"
  missing=0
  for spec in "$@"; do
    file="${spec%%:*}"
    if [ -f "$W/app/$file" ]; then echo "exists: $file"; else echo "MISSING: $file"; missing=1; fi
  done
  if [ "$missing" = 1 ]; then echo "exit=90"; exit 0; fi
  if netstat -ano 2>/dev/null | grep -q ':4593 .*LISTENING'; then echo "port 4593 is in use"; echo "exit=91"; exit 0; fi
  cd "$W/app" && npx playwright test -c ../build/u102/playwright.u102-4593.config.ts --workers="$workers" "$@" 2>&1
  code=$?
  echo "exit=$code"
} > "$log" 2>&1
tail -n 1 "$log"
