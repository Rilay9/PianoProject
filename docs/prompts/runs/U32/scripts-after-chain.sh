#!/usr/bin/env bash
# The after runs on the final build (app/build/u32/dist-final): the new browser cases alone, the slot
# snapshot, the grid (pictures, gallery, corpus legs, perf), then every spec the map names plus perf at
# two workers. One Playwright at a time, port 4473.
W="/c/Users/yalir/repos/Piano Stuff/PianoProject/.claude/worktrees/agent-ae90e835312da8da3"
R="$W/build/u32/run-pw.sh"
L="$W/build/u32/logs"
rm -f "$L/after.all.exit"
export U32_DIST=build/u32/dist-final
# 1. The new cases, alone.
bash "$R" after-new-cases playwright.u32-4473.config.ts score.window-rule.spec.ts score.arrange-race.spec.ts --grep "phone-upright-342|phone-upright-390|mid-run, every bar|a run started at once"
# 2. The slot snapshot of the pieces of 48 bars or fewer.
cp "$W/docs/prompts/runs/U32/scripts-slot-snapshot.spec.ts" "$W/app/tests/e2e/zz-u32-slot-snapshot.spec.ts"
bash "$R" snap-after playwright.u32-4473.config.ts zz-u32-slot-snapshot.spec.ts
rm -rf "$W/build/u32/snapshot-after"; mkdir -p "$W/build/u32/snapshot-after"
cp "$W/app/test-results/u32-slot-snapshot/"*.json "$W/build/u32/snapshot-after/"
rm -f "$W/app/tests/e2e/zz-u32-slot-snapshot.spec.ts"
# 3. The grid on the final build.
bash "$W/build/u32/grid-chain.sh" after build/u32/dist-final
# 4. Every spec the map names for the change, plus perf.spec, two workers.
SPECS=$(grep "^e2e" "$W/build/u32/checks-for-paths.txt" | tr ' ' '\n' | grep "spec.ts" | tr '\n' ' ')
# By judgement: the one other spec that opens the two long pieces (the keyboard strip's span).
SPECS="$SPECS tests/e2e/score.strip-span.spec.ts"
bash "$R" after-map playwright.u32-4473.config.ts $SPECS --workers=2
echo done > "$L/after.all.exit"
