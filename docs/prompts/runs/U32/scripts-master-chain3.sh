#!/usr/bin/env bash
# Three last looks: the screenshot specs against references this worktree's base writes (they are
# gitignored, so a fresh worktree has none); the gallery again on the final build (its end-of-piece
# cell); the 390 x 844 Bars 1 cell in the pictures probe's own flow (the MIDI mock), base and final.
W="/c/Users/yalir/repos/Piano Stuff/PianoProject/.claude/worktrees/agent-ae90e835312da8da3"
R="$W/build/u32/run-pw.sh"
L="$W/build/u32/logs"
rm -f "$L/master3.all.exit"
U32_DIST=build/u32/dist-base bash "$R" screenshots-base playwright.u32-4473.config.ts tests/e2e/score.spec.ts tests/e2e/score.layout.spec.ts --grep "screenshots" --workers=2
U32_DIST=build/u32/dist-final bash "$R" screenshots-final playwright.u32-4473.config.ts tests/e2e/score.spec.ts tests/e2e/score.layout.spec.ts --grep "screenshots" --workers=2
rm -rf "$W/build/states"
U32_DIST=build/u32/dist-final bash "$R" gallery-after2 playwright.states.u32-4473.config.ts
rm -rf "$W/build/u32/states-after2"; cp -r "$W/build/states" "$W/build/u32/states-after2"
cp "$W/docs/prompts/runs/U32/scripts-zz-u32-cell-debug.spec.ts" "$W/app/tests/e2e/zz-u32-cell-debug.spec.ts"
mkdir -p "$W/build/u32/cell-midi"
for pair in base-midi:build/u32/dist-base final-midi:build/u32/dist-final; do
  U32_MIDI=1 U32_DIST="${pair#*:}" U32_BUILD_NAME="${pair%%:*}" bash "$R" "cell-${pair%%:*}" playwright.u32-4473.config.ts zz-u32-cell-debug.spec.ts --workers=2
  cp "$W/app/test-results/u32-cell/"*.json "$W/build/u32/cell-midi/" 2>/dev/null
done
rm -f "$W/app/tests/e2e/zz-u32-cell-debug.spec.ts"
echo done > "$L/master3.all.exit"
