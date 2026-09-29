#!/bin/sh
# G1b: the offline content build (Q24), alone, with its exit, after the first attempt's log was
# overwritten by a second, refused start (the first build's process kept running and finished).
W="$(cd "$(dirname "$0")/../../../.." && pwd)"  # the worktree, from this script's own place (it ran with the path written out)
R="$W/docs/prompts/runs/G1b"
cd "$W" || exit 1
python tools/content/build.py --offline > "$R/content-build.log" 2>&1
echo "exit=$?" >> "$R/content-build.log"
echo done > "$R/content-build-done.txt"
