#!/usr/bin/env bash
# scripts-run-e2e.sh <log-name> [--grep <pattern>] <spec paths relative to app/...>
# Checks every named spec file exists and port 4453 is free, then runs them on U96's port copy with two
# workers. The log's first line is the command, its last line exit=<code>.
W="$(cd "$(dirname "$0")/../../../.." && pwd)"
log="$W/docs/prompts/runs/U96/$1"; shift
grep_args=()
if [ "$1" = "--grep" ]; then grep_args=(-g "$2"); shift 2; fi
{
  echo "\$ (cd app) npx playwright test -c playwright.u96-4453.config.ts --workers=2 ${grep_args[*]} $*"
  missing=0
  for spec in "$@"; do
    if [ -f "$W/app/$spec" ]; then echo "exists: $spec"; else echo "MISSING: $spec"; missing=1; fi
  done
  if [ "$missing" = 1 ]; then echo "exit=90"; exit 0; fi
  if netstat -ano 2>/dev/null | grep -q ':4453 .*LISTENING'; then echo "port 4453 is in use"; echo "exit=91"; exit 0; fi
  cd "$W/app" && npx playwright test -c playwright.u96-4453.config.ts --workers=2 "${grep_args[@]}" "$@" 2>&1
  code=$?
  echo "exit=$code"
} > "$log" 2>&1
tail -n 1 "$log"
