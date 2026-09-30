#!/usr/bin/env bash
# The rest, after the Play-press finding: the long pieces' pictures again, before and after, with the
# probe's single click; a second base gallery (the noise floor for the cells that moved); window-rule
# at all five shapes with the JSON reporter (the notes of passing cells); the map's specs; mutants 1
# and 3 in the browser. One Playwright at a time, port 4473.
W="/c/Users/yalir/repos/Piano Stuff/PianoProject/.claude/worktrees/agent-ae90e835312da8da3"
R="$W/build/u32/run-pw.sh"
L="$W/build/u32/logs"
rm -f "$L/master2.all.exit"
cp "$W/docs/prompts/runs/U32/scripts-zz-u32-pictures.spec.ts" "$W/app/tests/e2e/zz-u32-pictures.spec.ts"
for pair in before:build/u32/dist-base after:build/u32/dist-final; do
  phase="${pair%%:*}"
  U32_DIST="${pair#*:}" U32_PHASE="$phase" bash "$R" "pictures2-$phase" playwright.u32-4473.config.ts zz-u32-pictures.spec.ts --workers=2
  rm -rf "$W/build/u32/pictures2/$phase"; mkdir -p "$W/build/u32/pictures2"
  cp -r "$W/app/test-results/u32-pictures/$phase" "$W/build/u32/pictures2/$phase"
done
rm -f "$W/app/tests/e2e/zz-u32-pictures.spec.ts"
# A second base gallery.
rm -rf "$W/build/states"
U32_DIST=build/u32/dist-base bash "$R" gallery-before2 playwright.states.u32-4473.config.ts
rm -rf "$W/build/u32/states-before2"; cp -r "$W/build/states" "$W/build/u32/states-before2"
# window-rule, every shape, with the notes of the cells that pass.
U32_DIST=build/u32/dist-final PLAYWRIGHT_JSON_OUTPUT_NAME="$W/build/u32/window-rule-after.json" bash "$R" window-rule-json playwright.u32-4473.config.ts score.window-rule.spec.ts --workers=2 --reporter=json
# The map's specs and strip-span, two workers.
SPECS=$(grep "^e2e" "$W/build/u32/checks-for-paths.txt" | tr ' ' '\n' | grep "spec.ts" | tr '\n' ' ')
U32_DIST=build/u32/dist-final bash "$R" after-map playwright.u32-4473.config.ts $SPECS tests/e2e/score.strip-span.spec.ts --workers=2
# Mutants 1 and 3 in the browser (mutant 1's build is kept from before).
U32_DIST=build/u32/dist-mutant-1 bash "$R" mutant-1-window-rule playwright.u32-4473.config.ts score.window-rule.spec.ts --grep "phone-upright-342|phone-upright-390"
bash "$W/docs/prompts/runs/U32/scripts-mutants.sh" apply 3 > "$L/mutant-3-apply.log" 2>&1
(cd "$W/app" && npm run build:app > "$L/build-mutant-3.log" 2>&1; echo "exit=$?" >> "$L/build-mutant-3.log")
rm -rf "$W/app/build/u32/dist-mutant-3" && cp -r "$W/app/dist" "$W/app/build/u32/dist-mutant-3"
bash "$W/docs/prompts/runs/U32/scripts-mutants.sh" restore >> "$L/mutant-3-apply.log" 2>&1
U32_DIST=build/u32/dist-mutant-3 bash "$R" mutant-3-window-rule playwright.u32-4473.config.ts score.window-rule.spec.ts --grep "phone-upright-342|phone-upright-390"
rm -rf "$W/app/dist" && cp -r "$W/app/build/u32/dist-final" "$W/app/dist"
echo done > "$L/master2.all.exit"
