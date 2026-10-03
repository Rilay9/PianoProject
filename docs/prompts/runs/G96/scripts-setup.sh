#!/usr/bin/env bash
# The fresh-worktree setup (the brief's *Rules and files*): the fetched sources and the build cache copied
# from the main checkout (read there, never written), the four generated docs snapshotted, the parity
# reference, the offline content build, then the snapshots put back. npm ci ran first, on its own
# (npm-ci.txt). Writes build/g96/setup.exit when done.
W="$(cd "$(dirname "$0")/../../../.." && pwd)"
M="$(cd "$W/../../.." && pwd)"
R="$W/docs/prompts/runs/G96/scripts-run.sh"
S="$W/build/g96/snap"
mkdir -p "$S"
rm -f "$W/build/g96/setup.exit"
for d in kern musetrainer mutopia; do
  if [ ! -d "$W/content/scores/imported/$d" ]; then cp -r "$M/content/scores/imported/$d" "$W/content/scores/imported/$d"; fi
done
if [ ! -d "$W/build/cache" ]; then mkdir -p "$W/build" && cp -r "$M/build/cache" "$W/build/cache"; fi
for f in docs/prompts/inventory.md docs/prompts/rung-claims.md content/scores/imported/SOURCES.md docs/generated/ladder.md; do
  mkdir -p "$S/$(dirname "$f")"
  cp "$W/$f" "$S/$f"
done
bash "$R" parity-reference.txt . python tools/midi-cleanup/tests/parity_reference.py
bash "$R" content-build-offline.txt . python tools/content/build.py --offline
for f in docs/prompts/inventory.md docs/prompts/rung-claims.md content/scores/imported/SOURCES.md docs/generated/ladder.md; do
  cp "$S/$f" "$W/$f"
done
echo done > "$W/build/g96/setup.exit"
