#!/usr/bin/env bash
# scripts-run-e2e.sh <log-name> <workers> [--grep <pattern>] <spec paths relative to app/...>
# Checks every named spec file exists and port 4543 is free, then runs them on U96a's port copy
# (playwright.u96a-4543.config.ts, which serves the bundle already in app/dist). Extra environment
# (U96A_PHASE) passes through. The log's first line is the command, its last line exit=<code>.
W="$(cd "$(dirname "$0")/../../../.." && pwd)"
log="$W/docs/prompts/runs/U96a/$1"; shift
workers="$1"; shift
grep_args=()
if [ "$1" = "--grep" ]; then grep_args=(-g "$2"); shift 2; fi
{
  echo "\$ (cd app) npx playwright test -c playwright.u96a-4543.config.ts --workers=$workers ${grep_args[*]} $*"
  missing=0
  for spec in "$@"; do
    if [ -f "$W/app/$spec" ]; then echo "exists: $spec"; else echo "MISSING: $spec"; missing=1; fi
  done
  if [ "$missing" = 1 ]; then echo "exit=90"; exit 0; fi
  if netstat -ano 2>/dev/null | grep -q ':4543 .*LISTENING'; then echo "port 4543 is in use"; echo "exit=91"; exit 0; fi
  cd "$W/app" && npx playwright test -c playwright.u96a-4543.config.ts --workers="$workers" "${grep_args[@]}" "$@" 2>&1
  code=$?
  echo "exit=$code"
} > "$log" 2>&1
tail -n 1 "$log"
