#!/usr/bin/env bash
# U32 fresh-worktree setup: snapshot four generated docs, copy caches read-only,
# parity reference, offline content build, restore the snapshots.
W="/c/Users/yalir/repos/Piano Stuff/PianoProject/.claude/worktrees/agent-ae90e835312da8da3"
M="/c/Users/yalir/repos/Piano Stuff/PianoProject"
L="$W/build/u32"
S="$L/snap"
rm -f "$L/setup.exit"
for f in docs/prompts/inventory.md docs/prompts/rung-claims.md content/scores/imported/SOURCES.md docs/generated/ladder.md; do
  mkdir -p "$S/$(dirname "$f")"; cp "$W/$f" "$S/$f"
done
{
  echo "copy caches"
  for d in kern musetrainer mutopia; do cp -r "$M/content/scores/imported/$d" "$W/content/scores/imported/$d"; echo "copied content/scores/imported/$d exit $?"; done
  cp -r "$M/build/cache" "$W/build/cache"; echo "copied build/cache exit $?"
  for f in demands-cache.json notation-cache.json positions-cache.json; do cp "$M/build/$f" "$W/build/$f"; echo "copied build/$f exit $?"; done
} > "$L/copy.txt" 2>&1
(cd "$W" && python tools/midi-cleanup/tests/parity_reference.py) > "$L/parity-reference.txt" 2>&1; echo "exit=$?" >> "$L/parity-reference.txt"
(cd "$W" && python tools/content/build.py --offline) > "$L/content-build-offline.txt" 2>&1; echo "exit=$?" >> "$L/content-build-offline.txt"
for f in docs/prompts/inventory.md docs/prompts/rung-claims.md content/scores/imported/SOURCES.md docs/generated/ladder.md; do
  cp "$S/$f" "$W/$f"
done
echo done > "$L/setup.exit"
