#!/usr/bin/env bash
# Q88: runs the deploy guard on one built content directory, as the Pages step runs it, into runs/Q88/<name>.txt
# with the command on the first line and the exit code on the last. Run from the worktree root.
# Usage: bash docs/prompts/runs/Q88/scripts-guard.sh <name> <content dir, relative to the worktree root>
name="$1"
dir="$2"
out="docs/prompts/runs/Q88/$name.txt"
echo "\$ python tools/content/deploy_guard.py --dir $dir" > "$out"
PYTHONIOENCODING=utf-8 python tools/content/deploy_guard.py --dir "$dir" >> "$out" 2>&1
code=$?
echo "exit $code" >> "$out"
cat "$out"
