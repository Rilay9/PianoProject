#!/usr/bin/env bash
set -u
WT="C:/Users/yalir/repos/Piano Stuff/PianoProject/.claude/worktrees/agent-afcfb0e95fe66221d"
MAIN="C:/Users/yalir/repos/Piano Stuff/PianoProject"
cd "$WT"
LOG=build/f3a/setup.log
mkdir -p build/f3a/snap
: > $LOG
cp content/scores/imported/SOURCES.md build/f3a/snap/SOURCES.md
cp docs/prompts/inventory.md build/f3a/snap/inventory.md
cp docs/prompts/rung-claims.md build/f3a/snap/rung-claims.md
echo "snap done" >> $LOG
for d in kern musetrainer mutopia; do
  cp -r "$MAIN/content/scores/imported/$d" content/scores/imported/ || { echo "cp $d failed" >> $LOG; echo 90 > build/f3a/setup.exit; exit 90; }
done
mkdir -p build/cache
cp -r "$MAIN/build/cache/." build/cache/ || { echo "cp cache failed" >> $LOG; echo 91 > build/f3a/setup.exit; exit 91; }
echo "copy done" >> $LOG
python tools/midi-cleanup/tests/parity_reference.py >> $LOG 2>&1
echo "parity exit $?" >> $LOG
python tools/content/build.py --offline > build/f3a/build-initial.log 2>&1
B=$?
echo "build exit $B" >> $LOG
cp build/f3a/snap/SOURCES.md content/scores/imported/SOURCES.md
cp build/f3a/snap/inventory.md docs/prompts/inventory.md
cp build/f3a/snap/rung-claims.md docs/prompts/rung-claims.md
echo "restored" >> $LOG
echo $B > build/f3a/setup.exit
