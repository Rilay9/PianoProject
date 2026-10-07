#!/usr/bin/env bash
# The whole unit suite's failing files, each file's run attributed: first on the committed source (the seven
# changed files set aside, the committed bytes written from HEAD, put back after and compared by sha256, as in
# scripts-build-committed.sh), then alone on the change. No git state is touched.
W="$(cd "$(dirname "$0")/../../../.." && pwd)"
R="$W/docs/prompts/runs/U102/scripts-run.sh"
C="$W/build/u102/changed"
files="app/src/data/db.ts app/src/data/progressStore.ts app/src/data/sessionRun.ts app/src/evidence/rungState.ts app/src/ui/help.ts app/src/ui/screens/DrillScreen.ts app/src/ui/screens/ProgressScreen.ts"
failing="tests/unit/lessonClaimsAboutMusic.test.ts tests/unit/lessonClaimsAboutApp.test.ts tests/unit/scoreModelTempo.test.ts tests/unit/firstThirtyDaysOnTheLadder.test.ts tests/unit/materialOnTheRecord.test.ts tests/unit/simonTurnCue.test.ts tests/unit/curriculumIntegrity.test.ts tests/unit/oneSkillState.test.ts tests/unit/planNoUnobtainableRungs.test.ts tests/unit/everyOptionOpens.test.ts tests/unit/expectedNote.test.ts"
cd "$W" || exit 1
rm -rf "$C"; mkdir -p "$C"
for f in $files; do mkdir -p "$C/$(dirname "$f")"; cp "$f" "$C/$f"; done
( cd "$C" && sha256sum $files ) > "$W/build/u102/changed.sha256"
for f in $files; do git show "HEAD:$f" > "$f"; done
bash "$R" vitest-failing-files-committed-src.txt app npx vitest run $failing
for f in $files; do cp "$C/$f" "$f"; done
echo "restored; sha256 against the set-aside copies:"
sha256sum -c "$W/build/u102/changed.sha256" --quiet && echo "all seven identical"
bash "$R" vitest-failing-files-rerun-changed.txt app npx vitest run $failing
for one in tests/unit/simonTurnCue.test.ts tests/unit/oneSkillState.test.ts tests/unit/expectedNote.test.ts; do
  name=$(basename "$one" .test.ts)
  bash "$R" "vitest-alone-$name.txt" app npx vitest run "$one"
done
