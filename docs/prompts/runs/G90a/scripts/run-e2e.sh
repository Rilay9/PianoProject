#!/bin/bash
# usage: run-e2e.sh <log file> <dist: final|base> <spec patterns...>
# Takes the shared lock, runs the lane's Playwright on port 5463 with one worker, and always releases the lock.
LOG="$1"; WHICH="$2"; shift 2
ROOT="<worktree>"
LOCK=<home>/repos/pw-lock
cleanup() { rmdir "$LOCK" 2>/dev/null; }
until mkdir "$LOCK" 2>/dev/null; do sleep 20; done
trap cleanup EXIT INT TERM
cd "$ROOT/app" || exit 2
if [ "$WHICH" = "base" ]; then export G90A_DIST="$ROOT/build/g90a/base/app"; fi
rm -rf build/g90a/test-results
{
  echo "# $WHICH dist, $*"
  npx playwright test -c build/g90a/playwright.g90a.config.ts "$@" --workers=1
  echo "exit $?"
} > "$LOG" 2>&1
