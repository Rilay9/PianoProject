#!/bin/sh
# G1e (G1d's harness, on port 4443): one Playwright run through app/playwright.g1e-4443.config.ts, its output
# and exit in a log under docs/prompts/runs/G1e/.
# Usage: scripts-playwright.sh <log, relative to runs/G1e> <dist|-> <workers> [playwright args: spec paths, -g ...]
# Every spec path named (an argument ending in .spec.ts) is checked to exist first: a missing path is dropped
# silently by the runner. <dist> is a build folder to serve, relative to app/ (the committed code's is
# ../build/dist-head); `-` serves app/dist. Playwright's own output goes under the worktree's build/.
W="$(cd "$(dirname "$0")/../../../.." && pwd)"
R="$W/docs/prompts/runs/G1e"
LOG="$R/$1"; shift
DIST="$1"; shift
WORKERS="$1"; shift
cd "$W/app" || exit 1
missing=0
: > "$LOG"
for arg in "$@"; do
  case "$arg" in
    *.spec.ts) if [ -f "$arg" ]; then echo "spec present: $arg" >> "$LOG"; else echo "SPEC MISSING: $arg" >> "$LOG"; missing=1; fi ;;
  esac
done
if [ "$missing" -ne 0 ]; then echo "exit=2 (a named spec is missing)" >> "$LOG"; tail -1 "$LOG"; exit 2; fi
if [ "$DIST" != "-" ]; then export G1E_DIST="$DIST"; fi
export G1E_OUT="${G1E_OUT:-$W/build/g1e-pw-out}"
npx playwright test --config playwright.g1e-4443.config.ts --workers="$WORKERS" "$@" >> "$LOG" 2>&1
code=$?
echo "exit=$code" >> "$LOG"
tail -1 "$LOG"
# The script's own exit is Playwright's (it was tail's until the ruling's chain read a 0 over a failed run).
exit $code
