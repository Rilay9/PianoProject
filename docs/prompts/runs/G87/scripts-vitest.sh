#!/bin/sh
# G87: vitest on the files named (or the whole suite with none), exit in the log.
# Usage: scripts-vitest.sh <log> [file...]
W="$(cd "$(dirname "$0")/../../../.." && pwd)"
R="$W/docs/prompts/runs/G87"
LOG="$R/$1"; shift
cd "$W/app" || exit 1
{
  echo "files: $*"
  npx vitest run "$@"
  echo "exit=$?"
} > "$LOG" 2>&1
tail -1 "$LOG"
