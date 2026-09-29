#!/usr/bin/env bash
# cap.sh NAME DIR CMD...  -> runs CMD in DIR (relative to the worktree), writes
# docs/prompts/runs/F2c/NAME.txt: first line the exact command, last line exit=<code>.
WT="C:/Users/yalir/repos/Piano Stuff/PianoProject/.claude/worktrees/agent-a2a9fff96c03c4b30"
name="$1"; shift
dir="$1"; shift
out="$WT/docs/prompts/runs/F2c/$name.txt"
cd "$WT/$dir" || exit 99
{
  if [ "$dir" = "." ]; then echo "$*"; else echo "(in $dir) $*"; fi
  "$@" 2>&1
  code=$?
  echo "exit=$code"
} > "$out"
tail -n 1 "$out"
