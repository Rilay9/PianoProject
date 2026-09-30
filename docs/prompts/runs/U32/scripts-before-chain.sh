#!/usr/bin/env bash
# The before runs on the base build, with the specs as they will land: the new browser cases (red on
# the base), then the grid (pictures, gallery, corpus legs, perf). One Playwright at a time, port 4473.
W="/c/Users/yalir/repos/Piano Stuff/PianoProject/.claude/worktrees/agent-ae90e835312da8da3"
R="$W/build/u32/run-pw.sh"
L="$W/build/u32/logs"
rm -f "$L/before.all.exit"
export U32_DIST=build/u32/dist-base
bash "$R" red-e2e-base-final playwright.u32-4473.config.ts score.window-rule.spec.ts score.arrange-race.spec.ts --grep "phone-upright-342|phone-upright-390|mid-run, every bar|a run started at once"
bash "$W/build/u32/grid-chain.sh" before build/u32/dist-base
echo done > "$L/before.all.exit"
