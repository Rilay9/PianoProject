#!/bin/sh
# G87's second browser chain, detached, after item 3 (the coordinator's addition) and after the full
# suite's run: the pictures on the committed code's build again (the probe now takes item 3's paused
# row too); the score screenshots' baseline written from the committed code's build (a fresh worktree
# has no -win32 references, and the full run wrote them from the changed build, which compares a build
# with itself); the app built with item 3; the pictures on it; the map's specs for LessonScreen.ts on
# it; each file the full run failed on a timeout or a full disk, alone; the score screenshots compared
# with the committed code's baseline. Each step's log ends with its exit; chain2-done.txt is last.
W="$(cd "$(dirname "$0")/../../../.." && pwd)"
R="$W/docs/prompts/runs/G87"
cd "$W" || exit 1
cp "$R/scripts-zz-g87-pictures.spec.ts" app/tests/e2e/zz-g87-pictures.spec.ts
G87_TAG=before sh "$R/scripts-playwright.sh" pictures-before-2.txt ../build/dist-head tests/e2e/zz-g87-pictures.spec.ts
sh "$R/scripts-playwright.sh" snapshots-baseline-head.txt ../build/dist-head tests/e2e/score.layout.spec.ts tests/e2e/score.spec.ts -- -g screenshots --update-snapshots
sh "$R/scripts-build_app.sh" build-app-3.txt -
G87_TAG=after sh "$R/scripts-playwright.sh" pictures-after-2.txt - tests/e2e/zz-g87-pictures.spec.ts
rm app/tests/e2e/zz-g87-pictures.spec.ts
sh "$R/scripts-playwright.sh" e2e-lesson-4463.txt - tests/e2e/projects.spec.ts tests/e2e/lesson-flow.spec.ts tests/e2e/lesson-tools.spec.ts tests/e2e/start-and-return.spec.ts tests/e2e/plan.spec.ts
for f in doors score-fit-paths score.arrange-race side-panel-prose; do
  sh "$R/scripts-playwright.sh" "rerun-$f.txt" - "tests/e2e/$f.spec.ts"
done
sh "$R/scripts-playwright.sh" snapshots-compare.txt - tests/e2e/score.layout.spec.ts tests/e2e/score.spec.ts -- -g screenshots
echo done > "$R/chain2-done.txt"
