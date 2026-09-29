#!/usr/bin/env bash
# F2's landing on the merged main checkout (F2 over D4a, D5, E2 and D4; F2 was built on a tree
# without D4, so the merged tree is the first run of the combination). A content seam: the offline
# content build, the validator, the content suites the seam touches (measured truth, taught-at, the
# validator's claims check and its siblings, pdmx), the record check; typecheck; the promise,
# lesson-claims, ancestry and lesson-shape unit files with the two diary files; the app build; the
# Today spec on the default port. Not the full suites: CI runs them on the push.
set -u
ROOT="/c/Users/yalir/repos/Piano Stuff/PianoProject"
OUT="/c/Users/yalir/AppData/Local/Temp/claude/C--Users-yalir-repos-Piano-Stuff/9b647b56-e651-4563-9f4f-ce3e1e36a4a2/scratchpad/chainF2"
mkdir -p "$OUT"
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
git checkout -- content/scores/imported/SOURCES.md 2>/dev/null
git status --short >> "$OUT/exit.txt"
step content-validate python tools/content/validate.py --allow-nc --personal
step review-check python tools/content/review.py --check
step content-tests python -m unittest tools.content.tests.test_measured_truth tools.content.tests.test_taught_at tools.content.tests.test_validate_claims tools.content.tests.test_validate tools.content.tests.test_validate_sections tools.content.tests.test_validate_excerpts tools.content.tests.test_pdmx tools.content.tests.test_review_record
cd "$ROOT/app" || exit 1
step tsc npx tsc -b
step lint npm run lint
step vitest-targeted npx vitest run tests/unit/sightReadingPromises.test.ts tests/unit/lessonClaimsAboutApp.test.ts tests/unit/taughtByAncestry.test.ts tests/unit/lessonShape.test.ts tests/unit/gateAtTheConsumers.test.ts tests/unit/eligibility.test.ts tests/unit/session.test.ts tests/unit/lessonPagePicksPassTheAdmission.test.ts tests/unit/transferOffer.test.ts tests/unit/materialLayer.test.ts
step vitest-diaries npx vitest run tests/unit/firstThirtyDays.test.ts tests/unit/firstThirtyDaysOnTheLadder.test.ts
step build-app npm run build:app
step e2e-today npx playwright test tests/e2e/today.spec.ts tests/e2e/start-and-return.spec.ts --workers=2
echo "CHAIN DONE $(date +%H:%M:%S)" >> "$OUT/exit.txt"
