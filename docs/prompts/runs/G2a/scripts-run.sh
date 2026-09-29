#!/usr/bin/env bash
# G2a's capture helper (X3c's pattern): one command into docs/prompts/runs/G2a/<name>.txt, the first
# line the exact command (and the folder it ran in), the last line exit=<code>.
# Usage: bash scripts-run.sh <capture-name> <folder relative to the worktree root> <command...>
ROOT="/c/Users/yalir/repos/Piano Stuff/PianoProject/.claude/worktrees/agent-a67160964ddcfe0e7"
NAME="$1"; shift
DIR="$1"; shift
OUT="$ROOT/docs/prompts/runs/G2a/$NAME.txt"
cd "$ROOT/$DIR" || exit 99
{
  echo "$* (in ${DIR})"
  "$@" 2>&1
  code=$?
  echo "exit=$code"
} > "$OUT"
tail -n 1 "$OUT"
