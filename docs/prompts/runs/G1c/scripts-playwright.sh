#!/bin/sh
# G1c: Playwright on port 4413 through app/playwright.g1c-4413.config.ts, two workers, after checking
# that every spec file named exists (a missing path is dropped silently and the step passes on the
# rest). Usage: scripts-playwright.sh <log> <dist|-> <spec...> [-- extra playwright args]
# `-` serves app/dist; otherwise the folder named (the committed code's build). Playwright's output
# goes to the scratchpad folder in G1C_OUT when set, else app/test-results-g1c.
# To rerun: copy scripts-playwright.g1c-4413.config.ts back to app/playwright.g1c-4413.config.ts (it was
# moved here after the runs so `npm run lint` does not parse a config no tsconfig includes, as G1b did).
W="$(cd "$(dirname "$0")/../../../.." && pwd)"
R="$W/docs/prompts/runs/G1c"
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
  if [ "$DIST" != "-" ]; then export G1C_DIST="$DIST"; fi
  # shellcheck disable=SC2086
  npx playwright test -c playwright.g1c-4413.config.ts --workers=2 $SPECS $EXTRA
  echo "exit=$?"
} > "$LOG" 2>&1
tail -1 "$LOG"
