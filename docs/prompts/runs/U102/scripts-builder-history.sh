#!/bin/sh
# For every commit that touched the note-flash builders, print what `noteFlashDrill` returns and what
# fromCatalog's 'note-flash' case calls. Run from the worktree root.
out=build/u102/hist/all
mkdir -p "$out"
git log --format="%h %ad" --date=short -- app/src/engine/drills/factories.ts app/src/engine/drills/fromCatalog.ts > "$out/bcommits.txt"
while read -r sha day; do
  git show "$sha:app/src/engine/drills/factories.ts" > "$out/F.ts" 2>/dev/null || : > "$out/F.ts"
  git show "$sha:app/src/engine/drills/fromCatalog.ts" > "$out/C.ts" 2>/dev/null || : > "$out/C.ts"
  start=$(grep -n 'export function noteFlashDrill' "$out/F.ts" | head -1 | cut -d: -f1)
  ret="(no noteFlashDrill)"
  if [ -n "$start" ]; then
    ret=$(sed -n "${start},$((start+30))p" "$out/F.ts" | grep -E 'return new [A-Za-z]+' | head -1 | sed 's/^ *//')
    kind=$(sed -n "${start},$((start+30))p" "$out/F.ts" | grep -E "kind: 'note-flash'" | head -1 | sed 's/^ *//')
  fi
  case_line=$(grep -n "case 'note-flash':" -A 1 "$out/C.ts" | tail -1 | sed 's/^[0-9]*-\s*//' | sed 's/^ *//')
  echo "$sha $day | noteFlashDrill: $ret $kind | fromCatalog: ${case_line:-(no fromCatalog or case)}"
done < "$out/bcommits.txt"
rm -f "$out/F.ts" "$out/C.ts"
