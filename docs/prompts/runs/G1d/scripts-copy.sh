#!/bin/sh
# G1d setup copies (G1c's, narrowed): the build caches and the real MIDI files the parity reference and
# the offline content build read, copied read only from the main checkout without .git. build/ only:
# content/ and tools/content/ belong to another builder in this wave, so nothing is copied into them.
W="$(cd "$(dirname "$0")/../../../.." && pwd)"  # the worktree, from this script's own place
M="$(cd "$W/../../.." && pwd)"                  # the main checkout the worktree lives under
echo "copies from the main checkout (read only), without .git; build/ only"
mkdir -p "$W/build/cache"
for f in build/positions-cache.json build/demands-cache.json build/notation-cache.json; do
  if [ -f "$M/$f" ]; then cp "$M/$f" "$W/$f"; echo "cp $f exit=$?"; else echo "absent in the main checkout: $f"; fi
done
for d in build/cache/convert build/midi-real; do
  if [ -d "$M/$d" ]; then
    mkdir -p "$W/$d"
    (cd "$M/$d" && tar --exclude=.git -cf - .) | (cd "$W/$d" && tar -xf -)
    echo "tar $d exit=$?"
  else
    echo "absent in the main checkout: $d"
  fi
done
