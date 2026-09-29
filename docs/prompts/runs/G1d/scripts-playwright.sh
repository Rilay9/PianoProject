#!/bin/sh
# G1d: one Playwright run on port 4413 (app/playwright.g1d-4413.config.ts), its output and exit in a log.
# Usage: scripts-playwright.sh <log> <dist|-> <workers> [playwright args: spec paths, -g ...]
# Every spec path named (an argument ending in .spec.ts) is checked to exist first: a missing path is
# dropped silently by the runner. `<dist>` is a build folder to serve (the committed code's); `-` serves
# app/dist. Playwright's output goes to the scratchpad, never under app/ or docs/.
W="$(cd "$(dirname "$0")/../../../.." && pwd)"
R="$W/docs/prompts/runs/G1d"
LOG="$R/$1"; shift
DIST="$1"; shift
WORKERS="$1"; shift
cd "$W/app" || exit 1
{
  missing=0
  for arg in "$@"; do
    case "$arg" in
      *.spec.ts) if [ -f "$arg" ]; then echo "spec present: $arg"; else echo "SPEC MISSING: $arg"; missing=1; fi ;;
    esac
  done
  if [ "$missing" -ne 0 ]; then echo "exit=2 (a named spec is missing)"; exit 2; fi
} > "$LOG" 2>&1 || { tail -1 "$LOG"; exit 2; }
if [ "$DIST" != "-" ]; then export G1D_DIST="$DIST"; fi
export G1D_OUT="${G1D_OUT:-$TEMP/g1d-pw-out}"
npx playwright test --config playwright.g1d-4413.config.ts --workers="$WORKERS" "$@" >> "$LOG" 2>&1
echo "exit=$?" >> "$LOG"
tail -1 "$LOG"
