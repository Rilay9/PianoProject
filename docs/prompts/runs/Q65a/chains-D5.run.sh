#!/usr/bin/env bash
# D5's landing on the merged main checkout (D5 over E2, D4 and the docs commits). By what the seam
# touches: the offline content build (the projection the microscope reads is written by the build),
# the record check, the projection and evaluator tests, typecheck, lint, the three named unit files,
# the app build, the microscope spec on the default port. Not the full suites: CI runs them.
set -u
ROOT="/c/Users/yalir/repos/Piano Stuff/PianoProject"
OUT="/c/Users/yalir/AppData/Local/Temp/claude/C--Users-yalir-repos-Piano-Stuff/9b647b56-e651-4563-9f4f-ce3e1e36a4a2/scratchpad/chainD5"
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
git checkout -- SOURCES.md 2>/dev/null
git status --short >> "$OUT/exit.txt"
step review-check python tools/content/review.py --check
step content-tests python -m unittest tools.content.tests.test_review_record tools.content.tests.test_musical_evaluator tools.content.tests.test_measured_truth
cd "$ROOT/app" || exit 1
step tsc npx tsc -b
step lint npm run lint
step vitest-targeted npx vitest run tests/unit/microscopeLines.test.ts tests/unit/microscopeRoute.test.ts tests/unit/studyEvaluatorTwin.test.ts
step build-app npm run build:app
step e2e-microscope npx playwright test tests/e2e/microscope.spec.ts --workers=2
echo "CHAIN DONE $(date +%H:%M:%S)" >> "$OUT/exit.txt"
