#!/usr/bin/env bash
# perf.spec whole, base and final interleaved twice, one worker: the before/after pair taken back to
# back, since the single before and after runs were an hour apart on a machine whose load drifts.
W="/c/Users/yalir/repos/Piano Stuff/PianoProject/.claude/worktrees/agent-ae90e835312da8da3"
R="$W/build/u32/run-pw.sh"
rm -f "$W/build/u32/logs/perf-chain.exit"
for i in 1 2; do
  U32_DIST=build/u32/dist-base bash "$R" "perf-pair-base-$i" playwright.u32-4473.config.ts perf.spec.ts --workers=1
  U32_DIST=build/u32/dist-final bash "$R" "perf-pair-final-$i" playwright.u32-4473.config.ts perf.spec.ts --workers=1
done
echo done > "$W/build/u32/logs/perf-chain.exit"
