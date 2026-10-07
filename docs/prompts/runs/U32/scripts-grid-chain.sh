#!/usr/bin/env bash
# Item 9 and item 10 for one build: the long pieces' pictures, the state gallery, the corpus legs of the
# two long pieces, and perf.spec whole. Usage: grid-chain.sh <phase: before|after> <dist folder under app/>
W="/c/Users/yalir/repos/Piano Stuff/PianoProject/.claude/worktrees/agent-ae90e835312da8da3"
R="$W/build/u32/run-pw.sh"
phase="$1"; dist="$2"
rm -f "$W/build/u32/logs/grid-$phase.all.exit"
export U32_DIST="$dist"
# The long pieces' pictures (lane-only probe, copied in for the run).
cp "$W/docs/prompts/runs/U32/scripts-zz-u32-pictures.spec.ts" "$W/app/tests/e2e/zz-u32-pictures.spec.ts"
U32_PHASE="$phase" bash "$R" "pictures-$phase" playwright.u32-4473.config.ts zz-u32-pictures.spec.ts --workers=2
mkdir -p "$W/build/u32/pictures"
rm -rf "$W/build/u32/pictures/$phase"
cp -r "$W/app/test-results/u32-pictures/$phase" "$W/build/u32/pictures/$phase"
rm -f "$W/app/tests/e2e/zz-u32-pictures.spec.ts"
# The state gallery, serve only, one worker (its own config).
rm -rf "$W/build/states"
bash "$R" "gallery-$phase" playwright.states.u32-4473.config.ts
rm -rf "$W/build/u32/states-$phase"
cp -r "$W/build/states" "$W/build/u32/states-$phase"
# The corpus legs of the two long pieces.
rm -rf "$W/build/corpus"
CORPUS=song.classical.chopin-nocturne-op48-1.nifc,song.classical.chopin-scherzo-2.nifc bash "$R" "corpus-$phase" playwright.corpus.u32-4473.config.ts corpus.spec.ts
rm -rf "$W/build/u32/corpus-$phase"
cp -r "$W/build/corpus" "$W/build/u32/corpus-$phase"
# perf.spec whole, one worker, so the throttled budgets do not share the machine with a second browser.
bash "$R" "perf-$phase" playwright.u32-4473.config.ts perf.spec.ts --workers=1
echo done > "$W/build/u32/logs/grid-$phase.all.exit"
