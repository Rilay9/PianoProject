#!/usr/bin/env bash
# E2a's landing on the merged main checkout (E2a over Q47, F2, D4a, D5, E2, D4). By what the seam
# touches: the offline content build (build.py passes the seed concepts at the concept prompts, so
# the built curriculum's prompts change; validate.finder_errors holds them), the finder and
# measured-truth tests, the validator; typecheck, lint; the gate's files with every consumer and
# D4's, E2's and F2's app files; the app build; the Today, lesson-tools and start-and-return specs.
set -u
ROOT="/c/Users/yalir/repos/Piano Stuff/PianoProject"
OUT="/c/Users/yalir/AppData/Local/Temp/claude/C--Users-yalir-repos-Piano-Stuff/9b647b56-e651-4563-9f4f-ce3e1e36a4a2/scratchpad/chainE2a"
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
step content-tests python -m unittest tools.content.tests.test_finder tools.content.tests.test_measured_truth tools.content.tests.test_technique_units
step content-validate python tools/content/validate.py --allow-nc --personal
cd "$ROOT/app" || exit 1
step tsc npx tsc -b
step lint npm run lint
step vitest-targeted npx vitest run tests/unit/oneGateBoundary.test.ts tests/unit/eligibility.test.ts tests/unit/materialLayer.test.ts tests/unit/gateAtTheConsumers.test.ts tests/unit/excerptItems.test.ts tests/unit/lessonPagePicksPassTheAdmission.test.ts tests/unit/importOverlay.test.ts tests/unit/skillActivationBoundary.test.ts tests/unit/session.test.ts tests/unit/transferOffer.test.ts tests/unit/transferOfferOnTheRun.test.ts tests/unit/taughtByAncestry.test.ts tests/unit/sightReadingPromises.test.ts tests/unit/importMeasuredTruth.test.ts
step build-app npm run build:app
step e2e-consumers npx playwright test tests/e2e/today.spec.ts tests/e2e/lesson-tools.spec.ts tests/e2e/start-and-return.spec.ts --workers=2
echo "CHAIN DONE $(date +%H:%M:%S)" >> "$OUT/exit.txt"
