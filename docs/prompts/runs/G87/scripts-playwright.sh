#!/bin/sh
# G87: Playwright on port 4463 through app/playwright.g87-4463.config.ts, two workers, after checking
# that every spec file named exists (a missing path is dropped silently and the step passes on the
# rest). Usage: scripts-playwright.sh <log> <dist|-> <spec...> [-- extra playwright args]
# `-` serves app/dist; otherwise the folder named (the committed code's build). Playwright's output
# goes to the worktree's gitignored build/test-results-g87.
W="$(cd "$(dirname "$0")/../../../.." && pwd)"
R="$W/docs/prompts/runs/G87"
LOG="$R/$1"; shift
DIST="$1"; shift
cd "$W/app" || exit 1
SPECS=""
EXTRA=""
while [ $# -gt 0 ]; do
  if [ "$1" = "--" ]; then shift; EXTRA="$*"; break; fi
  SPECS="$SPECS $1"; shift
done
{
  echo "specs:$SPECS"
  missing=0
  for s in $SPECS; do
    f="${s%%:*}"
    if [ -f "$f" ]; then echo "exists: $f"; else echo "MISSING: $f"; missing=1; fi
  done
  if [ "$missing" = 1 ]; then echo "exit=2 (a spec file is missing; nothing run)"; exit 2; fi
  if [ "$DIST" != "-" ]; then export G87_DIST="$DIST"; fi
  # shellcheck disable=SC2086
  npx playwright test -c playwright.g87-4463.config.ts --workers=2 $SPECS $EXTRA
  echo "exit=$?"
} > "$LOG" 2>&1
tail -1 "$LOG"
