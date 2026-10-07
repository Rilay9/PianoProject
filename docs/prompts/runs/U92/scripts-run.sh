#!/usr/bin/env bash
# U92's step logger: runs one command in a directory of the worktree and writes the command, its output
# and exit=<code> to a log under docs/prompts/runs/U92/.
# Usage: scripts-run.sh <log name> <dir relative to the worktree root> <command...>
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../../../.." && pwd)"
LOG="$HERE/$1"
REL="$2"
shift 2
{
  echo "\$ ($REL) $*"
  cd "$ROOT/$REL" || { echo "exit=4"; exit 4; }
  "$@"
  echo "exit=$?"
} > "$LOG" 2>&1
tail -n 15 "$LOG"
