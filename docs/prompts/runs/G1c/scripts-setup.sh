#!/bin/sh
# G1c setup (G1b's, adapted): npm ci in app/; copy the content build's inputs from the main checkout
# (read only, without .git); the parity reference and the offline content build (Q24). Each step's
# exit is written to its log; `setup-done.txt` is written last.
W="$(cd "$(dirname "$0")/../../../.." && pwd)"  # the worktree, from this script's own place
M="$(cd "$W/../../.." && pwd)"                  # the main checkout the worktree lives under
R="$W/docs/prompts/runs/G1c"
cd "$W" || exit 1
(cd "$W/app" && npm ci > "$R/npm-ci.log" 2>&1; echo "exit=$?" >> "$R/npm-ci.log")
{
  echo "copies from the main checkout (read only), without .git"
  mkdir -p build/cache content/scores/imported
  for f in build/positions-cache.json build/demands-cache.json build/notation-cache.json; do
    cp "$M/$f" "$W/$f"; echo "cp $f exit=$?"
  done
  for d in build/cache/convert build/midi-real content/scores/imported/kern content/scores/imported/musetrainer; do
    mkdir -p "$W/$d"
    (cd "$M/$d" && tar --exclude=.git -cf - .) | (cd "$W/$d" && tar -xf -); echo "tar $d exit=$?"
  done
} > "$R/copy.txt" 2>&1
python tools/midi-cleanup/tests/parity_reference.py > "$R/parity.log" 2>&1; echo "exit=$?" >> "$R/parity.log"
python tools/content/build.py --offline > "$R/content-build.log" 2>&1; echo "exit=$?" >> "$R/content-build.log"
echo done > "$R/setup-done.txt"
