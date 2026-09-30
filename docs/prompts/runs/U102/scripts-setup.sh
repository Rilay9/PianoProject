#!/usr/bin/env bash
# The fresh-worktree setup (the brief's *Rules and files*), as one detached chain:
# snapshot the four generated docs, npm ci, the parity reference, the offline content build, then restore the
# snapshots. Each step logs through scripts-run.sh; the chain writes build/u102/setup.exit when it is done.
W="$(cd "$(dirname "$0")/../../../.." && pwd)"
R="$W/docs/prompts/runs/U102/scripts-run.sh"
S="$W/build/u102/snap"
mkdir -p "$S"
rm -f "$W/build/u102/setup.exit"
for f in docs/prompts/inventory.md docs/prompts/rung-claims.md content/scores/imported/SOURCES.md docs/generated/ladder.md; do
  mkdir -p "$S/$(dirname "$f")"
  cp "$W/$f" "$S/$f"
done
bash "$R" npm-ci.txt app npm ci --no-audit --no-fund
bash "$R" parity-reference.txt . python tools/midi-cleanup/tests/parity_reference.py
bash "$R" content-build-offline.txt . python tools/content/build.py --offline
for f in docs/prompts/inventory.md docs/prompts/rung-claims.md content/scores/imported/SOURCES.md docs/generated/ladder.md; do
  cp "$S/$f" "$W/$f"
done
echo done > "$W/build/u102/setup.exit"
