#!/usr/bin/env bash
# D4's landing on the merged main checkout (da9d0e7: D4 over the held docs commits). By what the seam
# touches: the content build (provenance.identity on every row is the build's), the material-identity
# and measured-truth tests, the validator and the record check; typecheck, lint; the five new unit files
# with the session, gate, ladder, evidence-job, diary and excerpt consumers; the app build; the Today
# and transfer-offer specs on the default port; then the builder's pictures probe rerun on the merged
# build (the offer look at 342 x 740), copied into tests/e2e for the run and removed after. Not the
# full unit or content suites: the builder ran them on the same code and CI runs them on the push.
set -u
ROOT="/c/Users/yalir/repos/Piano Stuff/PianoProject"
OUT="/c/Users/yalir/AppData/Local/Temp/claude/C--Users-yalir-repos-Piano-Stuff/9b647b56-e651-4563-9f4f-ce3e1e36a4a2/scratchpad/chainD4"
PROBE="/c/Users/yalir/AppData/Local/Temp/claude/C--Users-yalir-repos-Piano-Stuff/9b647b56-e651-4563-9f4f-ce3e1e36a4a2/scratchpad/D4/pw/pictures/zz-d4-pictures.spec.ts"
LOOK="C:/Users/yalir/AppData/Local/Temp/claude/C--Users-yalir-repos-Piano-Stuff/9b647b56-e651-4563-9f4f-ce3e1e36a4a2/scratchpad/chainD4/look"
mkdir -p "$OUT" "$LOOK"
: > "$OUT/exit.txt"
step() {
  local name="$1"; shift
  echo "== $name  $(date +%H:%M:%S)" >> "$OUT/exit.txt"
  "$@" > "$OUT/$name.log" 2>&1
  local code=$?
  echo "$name exit=$code" >> "$OUT/exit.txt"
  return $code
}
cd "$ROOT" || exit 1
step content-build python tools/content/build.py --offline
git checkout -- SOURCES.md 2>/dev/null
git status --short >> "$OUT/exit.txt"
step content-tests-measured-truth python -m unittest tools.content.tests.test_measured_truth
step content-validate python tools/content/validate.py --allow-nc --personal
step review-check python tools/content/review.py --check
cd "$ROOT/app" || exit 1
step tsc npx tsc -b
step lint npm run lint
step vitest-targeted npx vitest run tests/unit/materialOnTheRecord.test.ts tests/unit/materialIdentity.test.ts tests/unit/contactNovelty.test.ts tests/unit/transferOffer.test.ts tests/unit/transferRelationship.test.ts tests/unit/session.test.ts tests/unit/gateAtTheConsumers.test.ts tests/unit/eligibility.test.ts tests/unit/excerptItems.test.ts tests/unit/masteryLadder.test.ts tests/unit/skillsReadTheLadder.test.ts tests/unit/evidenceJobRecomputes.test.ts tests/unit/firstThirtyDaysOnTheLadder.test.ts tests/unit/slotsFromEvidence.test.ts tests/unit/todaySessionLength.test.ts tests/unit/lessonPagePicksPassTheAdmission.test.ts
step build-app npm run build:app
step e2e-today-transfer npx playwright test tests/e2e/today.spec.ts tests/e2e/transfer-offer.spec.ts --workers=2
cp "$PROBE" tests/e2e/zz-d4-pictures.spec.ts
export D4_PICTURES="$LOOK"
export D4_PHASE="merged"
step e2e-pictures npx playwright test tests/e2e/zz-d4-pictures.spec.ts --workers=1
rm -f tests/e2e/zz-d4-pictures.spec.ts
echo "CHAIN DONE $(date +%H:%M:%S)" >> "$OUT/exit.txt"
