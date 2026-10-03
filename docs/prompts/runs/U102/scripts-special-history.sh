#!/bin/sh
# For every commit that touched special.ts: the backing track's result() accuracy line, and the rhythm
# result's answered/accuracy lines (read, not relied on: rhythm keeps its legacy reading). Run from the worktree root.
out=build/u102/hist/all
mkdir -p "$out"
while read -r sha day; do
  git show "$sha:app/src/engine/drills/special.ts" > "$out/S.ts" 2>/dev/null || { echo "$sha absent"; continue; }
  start=$(grep -n 'class BackingTrackDrill' "$out/S.ts" | head -1 | cut -d: -f1)
  bt="(no BackingTrackDrill)"
  if [ -n "$start" ]; then
    bt=$(sed -n "${start},\$p" "$out/S.ts" | grep -n -m1 -A 8 'result(): DrillResult' | grep -E 'accuracy:|correct:' | tr -s ' ' | tr '\n' ' ')
  fi
  kinds=$(grep -c "kind: 'backing-track'\|readonly kind = 'backing-track'\|'backing-track' as const" "$out/S.ts")
  echo "$sha $day | backing track: $bt | backing-track kind sites: $kinds"
done < build/u102/hist/special-commits.txt
rm -f "$out/S.ts"
