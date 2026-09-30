#!/usr/bin/env bash
# scripts-run-e2e.sh <log-name> [--grep <pattern>] <spec paths relative to app/...>
# Checks every named spec file exists and port 4533 is free, then runs them on G85a's port copy
# (`app/playwright.g85a-4533.config.ts`, not for the commit) with two workers. `G85A_DIST` in the
# environment picks the build served (the committed code's app); absent, `app/dist`. The log's first
# line is the command, its last line exit=<code>. Machine paths are left to the sanitiser.
W="$(cd "$(dirname "$0")/../../../.." && pwd)"
log="$W/docs/prompts/runs/G85a/$1"; shift
grep_args=()
if [ "$1" = "--grep" ]; then grep_args=(-g "$2"); shift 2; fi
{
  echo "\$ (cd app) G85A_DIST=${G85A_DIST:-<app/dist>} npx playwright test -c playwright.g85a-4533.config.ts --workers=2 ${grep_args[*]} $*"
  missing=0
  for spec in "$@"; do
    if [ -f "$W/app/$spec" ]; then echo "exists: $spec"; else echo "MISSING: $spec"; missing=1; fi
  done
  if [ "$missing" = 1 ]; then echo "exit=90"; exit 0; fi
  if netstat -ano 2>/dev/null | grep -q ':4533 .*LISTENING'; then echo "port 4533 is in use"; echo "exit=91"; exit 0; fi
  cd "$W/app" && npx playwright test -c playwright.g85a-4533.config.ts --workers=2 "${grep_args[@]}" "$@" 2>&1
  code=$?
  echo "exit=$code"
} > "$log" 2>&1
tail -n 1 "$log"
