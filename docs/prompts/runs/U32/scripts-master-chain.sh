#!/usr/bin/env bash
# Everything after the interleaved timing pass, in order, one Playwright at a time on port 4473:
# 0. the final build, kept as app/build/u32/dist-final;
# 1. the re-plan watcher and the heap, base and final;
# 2. the before runs (base): the new cases red, the grid;
# 3. the after runs (final): the new cases, the snapshot, the grid, the map's specs;
# 4. the browser mutants 1 and 3: each built, window-rule's two phone-upright shapes run, restored.
W="/c/Users/yalir/repos/Piano Stuff/PianoProject/.claude/worktrees/agent-ae90e835312da8da3"
R="$W/build/u32/run-pw.sh"
L="$W/build/u32/logs"
rm -f "$L/master.all.exit"
cd "$W/app" || exit 1
npm run build:app > "$L/build-final.log" 2>&1; echo "exit=$?" >> "$L/build-final.log"
rm -rf build/u32/dist-final && cp -r dist build/u32/dist-final
cp "$W/app/src/score/WindowRenderer.ts" "$W/build/u32/WindowRenderer.final.ts"
# 1.
cp "$W/docs/prompts/runs/U32/scripts-zz-u32-replan-debug.spec.ts" "$W/app/tests/e2e/zz-u32-replan-debug.spec.ts"
mkdir -p "$W/build/u32/replan"
for pair in base:build/u32/dist-base final:build/u32/dist-final; do
  U32_DIST="${pair#*:}" U32_BUILD_NAME="${pair%%:*}" bash "$R" "replan-${pair%%:*}" playwright.u32-4473.config.ts zz-u32-replan-debug.spec.ts --workers=1
  cp "$W/app/test-results/u32-replan/"*.json "$W/build/u32/replan/" 2>/dev/null
done
rm -f "$W/app/tests/e2e/zz-u32-replan-debug.spec.ts"
# 2. and 3.
bash "$W/build/u32/before-chain.sh"
bash "$W/build/u32/after-chain.sh"
# 4.
for n in 1 3; do
  bash "$W/docs/prompts/runs/U32/scripts-mutants.sh" apply "$n" > "$L/mutant-$n-apply.log" 2>&1
  (cd "$W/app" && npm run build:app > "$L/build-mutant-$n.log" 2>&1; echo "exit=$?" >> "$L/build-mutant-$n.log")
  rm -rf "$W/app/build/u32/dist-mutant-$n" && cp -r "$W/app/dist" "$W/app/build/u32/dist-mutant-$n"
  bash "$W/docs/prompts/runs/U32/scripts-mutants.sh" restore >> "$L/mutant-$n-apply.log" 2>&1
  U32_DIST="build/u32/dist-mutant-$n" bash "$R" "mutant-$n-window-rule" playwright.u32-4473.config.ts score.window-rule.spec.ts --grep "phone-upright-342|phone-upright-390"
done
# app/dist back to the final build.
rm -rf "$W/app/dist" && cp -r "$W/app/build/u32/dist-final" "$W/app/dist"
echo done > "$L/master.all.exit"
