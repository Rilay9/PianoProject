#!/bin/sh
# G1c: run vitest on the named files (or the whole suite with none) from app/, into the named log
# under docs/prompts/runs/G1c/, the exit on the last line.  Usage: scripts-vitest.sh <log> [files...]
W="$(cd "$(dirname "$0")/../../../.." && pwd)"
R="$W/docs/prompts/runs/G1c"
LOG="$R/$1"; shift
cd "$W/app" || exit 1
npx vitest run "$@" > "$LOG" 2>&1
echo "exit=$?" >> "$LOG"
tail -1 "$LOG"
