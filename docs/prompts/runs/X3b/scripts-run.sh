#!/usr/bin/env bash
# X3b's capture helper (X3a's pattern): one command into docs/prompts/runs/X3b/<name>.txt, the first
# line the exact command (and the folder it ran in), the last line exit=<code>.
# Usage: bash scripts-run.sh <capture-name> <folder relative to the worktree root> <command...>
ROOT="/c/Users/yalir/repos/Piano Stuff/PianoProject/.claude/worktrees/agent-a20bd5674e425dc2c"
NAME="$1"; shift
DIR="$1"; shift
OUT="$ROOT/docs/prompts/runs/X3b/$NAME.txt"
cd "$ROOT/$DIR" || exit 99
{
  echo "$* (in ${DIR})"
  "$@" 2>&1
  code=$?
  echo "exit=$code"
} > "$OUT"
tail -n 1 "$OUT"
