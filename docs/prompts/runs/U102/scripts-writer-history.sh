#!/bin/sh
# For every commit that touched DrillScreen.ts, print the general drill writer's accuracy, wrongNotes
# and missed lines (the recordRun block whose mode is `drill:${result.kind}`), and whether a going-over
# returns before it. Run from the worktree root.
out=build/u102/hist/all
mkdir -p "$out"
git log --format="%h %ad" --date=short -- app/src/ui/screens/DrillScreen.ts > "$out/commits.txt"
while read -r sha day; do
  git show "$sha:app/src/ui/screens/DrillScreen.ts" > "$out/D.ts" 2>/dev/null || { echo "$sha $day (file absent)"; continue; }
  start=$(grep -n 'mode: `drill:${result.kind}`' "$out/D.ts" | head -1 | cut -d: -f1)
  if [ -z "$start" ]; then echo "$sha $day NO GENERAL WRITER"; continue; fi
  acc=$(sed -n "${start},$((start+16))p" "$out/D.ts" | grep -E '^\s*accuracy:' | head -1 | sed 's/^ *//')
  wrong=$(sed -n "${start},$((start+16))p" "$out/D.ts" | grep -E '^\s*wrongNotes:' | head -1 | sed 's/^ *//')
  miss=$(sed -n "${start},$((start+16))p" "$out/D.ts" | grep -E '^\s*missed:' | head -1 | sed 's/^ *//')
  writers=$(grep -c 'mode: `drill:' "$out/D.ts")
  review=$(grep -c 'if (reviewing)' "$out/D.ts")
  results=$(grep -c 'const result = drill.result()' "$out/D.ts")
  echo "$sha $day | $acc | $wrong | $miss | general writers: $writers | reviewing guards: $review | 'const result = drill.result()': $results"
done < "$out/commits.txt"
rm -f "$out/D.ts"
