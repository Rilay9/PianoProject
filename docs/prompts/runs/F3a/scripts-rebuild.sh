#!/usr/bin/env bash
# The offline content build after the lesson edits; snapshots and restores the three files it rewrites.
set -u
WT="C:/Users/yalir/repos/Piano Stuff/PianoProject/.claude/worktrees/agent-afcfb0e95fe66221d"
cd "$WT"
TAG="${1:-after}"
rm -f "build/f3a/rebuild-$TAG.exit"
cp content/scores/imported/SOURCES.md build/f3a/snap/SOURCES.md
cp docs/prompts/inventory.md build/f3a/snap/inventory.md
cp docs/prompts/rung-claims.md build/f3a/snap/rung-claims.md
echo "\$ (cd .) python tools/content/build.py --offline" > "build/f3a/build-$TAG.log"
python tools/content/build.py --offline >> "build/f3a/build-$TAG.log" 2>&1
B=$?
echo "exit=$B" >> "build/f3a/build-$TAG.log"
cp build/f3a/snap/SOURCES.md content/scores/imported/SOURCES.md
cp build/f3a/snap/inventory.md docs/prompts/inventory.md
cp build/f3a/snap/rung-claims.md docs/prompts/rung-claims.md
echo $B > "build/f3a/rebuild-$TAG.exit"
