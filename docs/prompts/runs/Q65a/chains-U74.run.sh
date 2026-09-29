#!/usr/bin/env bash
# U74's landing on the merged main checkout (renderer only): typecheck, lint, the new unit file with
# the fit and window tests, the app build, the window-rule, fit-paths, Today and sight-reading specs.
set -u
ROOT="/c/Users/yalir/repos/Piano Stuff/PianoProject"
OUT="/c/Users/yalir/AppData/Local/Temp/claude/C--Users-yalir-repos-Piano-Stuff/9b647b56-e651-4563-9f4f-ce3e1e36a4a2/scratchpad/chainU74"
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
cd "$ROOT/app" || exit 1
step tsc npx tsc -b
step lint npm run lint
step vitest-targeted npx vitest run tests/unit/windowRendererStage.test.ts tests/unit/autoFit.test.ts tests/unit/fitDetail.test.ts tests/unit/firstContactOnTheScore.test.ts tests/unit/transferOfferOnTheRun.test.ts
step build-app npm run build:app
step e2e-fit npx playwright test tests/e2e/score.window-rule.spec.ts tests/e2e/score-fit-paths.spec.ts tests/e2e/today.spec.ts tests/e2e/sight-reading.spec.ts --workers=2
echo "CHAIN DONE $(date +%H:%M:%S)" >> "$OUT/exit.txt"
