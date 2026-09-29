#!/usr/bin/env bash
# G1's landing on the merged main checkout (G1 over E2a, Q47, F2, D4a, D5, E2, D4). App code only:
# typecheck, lint; the new unit files with the contact, backup, help, observation, rung-state,
# evidence-job, ladder, transfer, session and material consumers; the app build; the sight-reading,
# import, transfer-offer and lab specs on the default port. No content change, so no content build.
set -u
ROOT="/c/Users/yalir/repos/Piano Stuff/PianoProject"
OUT="/c/Users/yalir/AppData/Local/Temp/claude/C--Users-yalir-repos-Piano-Stuff/9b647b56-e651-4563-9f4f-ce3e1e36a4a2/scratchpad/chainG1"
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
step vitest-targeted npx vitest run tests/unit/encounterModel.test.ts tests/unit/encounterRetention.test.ts tests/unit/firstContactOnTheScore.test.ts tests/unit/contactNovelty.test.ts tests/unit/backup.test.ts tests/unit/help.test.ts tests/unit/observationsFromRun.test.ts tests/unit/rungStateFromEvidence.test.ts tests/unit/evidenceJobRecomputes.test.ts tests/unit/masteryLadder.test.ts tests/unit/transferOffer.test.ts tests/unit/transferOfferOnTheRun.test.ts tests/unit/materialOnTheRecord.test.ts tests/unit/materialIdentity.test.ts tests/unit/session.test.ts tests/unit/oneGateBoundary.test.ts tests/unit/materialLayer.test.ts tests/unit/importMeasuredTruth.test.ts tests/unit/scoreSummaryTruth.test.ts tests/unit/legacyStorage.test.ts
step build-app npm run build:app
step e2e-consumers npx playwright test tests/e2e/sight-reading.spec.ts tests/e2e/midi-import.spec.ts tests/e2e/converted-import.spec.ts tests/e2e/transfer-offer.spec.ts tests/e2e/lab.spec.ts --workers=2
echo "CHAIN DONE $(date +%H:%M:%S)" >> "$OUT/exit.txt"
