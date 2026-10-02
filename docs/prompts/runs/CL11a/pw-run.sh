#!/bin/bash
# usage: pw-run.sh <config> <logfile> <playwright args...>
# Takes the machine's browser lock (the coordinator's rule), runs, releases it whatever happens.
CONFIG="$1"; LOG="$2"; shift 2
LOCK=<home>/repos/pw-lock
until mkdir "$LOCK" 2>/dev/null; do sleep 20; done
trap 'rmdir "$LOCK" 2>/dev/null' EXIT INT TERM
echo "lock taken $(date -Is)" > "$LOG"
cd "<worktree>/app"
npx playwright test -c "$CONFIG" --workers=1 "$@" >> "$LOG" 2>&1
echo "playwright exit $?" >> "$LOG"
