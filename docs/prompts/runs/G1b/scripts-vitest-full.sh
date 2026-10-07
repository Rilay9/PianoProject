#!/bin/sh
# G1b: the whole unit suite on this tree, with its exit, detached (Git Bash's background dies at ten minutes).
W="$(cd "$(dirname "$0")/../../../.." && pwd)"  # the worktree, from this script's own place (it ran with the path written out)
R="$W/docs/prompts/runs/G1b"
cd "$W/app" || exit 1
npx vitest run > "$R/vitest-full.txt" 2>&1
echo "exit=$?" >> "$R/vitest-full.txt"
echo done > "$R/vitest-full-done.txt"
