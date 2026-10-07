#!/usr/bin/env bash
# X3c's capture helper (X3a's and X3b's pattern): one command into docs/prompts/runs/X3c/<name>.txt, the
# first line the exact command (and the folder it ran in), the last line exit=<code>.
# Usage: bash scripts-run.sh <capture-name> <folder relative to the worktree root> <command...>
ROOT="/c/Users/yalir/repos/Piano Stuff/PianoProject/.claude/worktrees/agent-ac2ac291c6ad0a550"
NAME="$1"; shift
DIR="$1"; shift
OUT="$ROOT/docs/prompts/runs/X3c/$NAME.txt"
cd "$ROOT/$DIR" || exit 99
{
  echo "$* (in ${DIR})"
  "$@" 2>&1
  code=$?
  echo "exit=$code"
} > "$OUT"
tail -n 1 "$OUT"
