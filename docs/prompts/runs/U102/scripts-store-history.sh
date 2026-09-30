#!/bin/sh
# How recordRun built the stored row at every version of progressStore.ts: the lines that set accuracy,
# wrongNotes and missed on the session, or the generic copy (sessionRowFor). Run from the worktree root.
out=build/u102/hist/all
mkdir -p "$out"
git log --format="%h %ad" --date=short -- app/src/data/progressStore.ts > "$out/pscommits.txt"
while read -r sha day; do
  git show "$sha:app/src/data/progressStore.ts" > "$out/P.ts" 2>/dev/null || { echo "$sha absent"; continue; }
  generic=$(grep -c 'function sessionRowFor' "$out/P.ts")
  fields=$(grep -n -E '^\s*(accuracy|wrongNotes|missed): (result|r)\.' "$out/P.ts" | tr -s ' ' | tr '\n' ' ')
  spread=$(grep -n -E '\.\.\.result\b|\.\.\.rest\b' "$out/P.ts" | head -3 | tr -s ' ' | tr '\n' ' ')
  echo "$sha $day | sessionRowFor: $generic | explicit fields: ${fields:-none} | spreads: ${spread:-none}"
done < "$out/pscommits.txt"
rm -f "$out/P.ts"
