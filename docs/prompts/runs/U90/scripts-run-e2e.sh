#!/usr/bin/env bash
# U90's browser step: every named spec file must exist before Playwright runs (a path that resolves to no
# file is dropped silently and the step passes on the rest), then the U90 override on port 4383, two
# workers at most. Usage: scripts-run-e2e.sh <log name> [--grep <pattern>] -- <spec path relative to app/> ...
# The log starts with the command and ends with exit=<code>.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
APP="$(cd "$HERE/../../../../app" && pwd)"
LOG="$HERE/$1"
shift
EXTRA=()
while [ "$#" -gt 0 ] && [ "$1" != "--" ]; do EXTRA+=("$1"); shift; done
[ "$#" -gt 0 ] && shift
{
  echo "\$ (app/) npx playwright test --config playwright.u90-4383.config.ts --workers=2 ${EXTRA[*]:-} $*"
  missing=0
  for spec in "$@"; do
    if [ -f "$APP/$spec" ]; then echo "exists: $spec"; else echo "MISSING: $spec"; missing=1; fi
  done
  if [ "$missing" -ne 0 ]; then echo "a named spec is missing; not running"; echo "exit=2"; exit 2; fi
  if (echo > /dev/tcp/127.0.0.1/4383) 2>/dev/null; then echo "port 4383 is taken; not running"; echo "exit=3"; exit 3; fi
  cd "$APP" || exit 4
  npx playwright test --config playwright.u90-4383.config.ts --workers=2 "${EXTRA[@]}" "$@"
  echo "exit=$?"
} > "$LOG" 2>&1
tail -n 25 "$LOG"
