#!/usr/bin/env bash
# D4a's landing on the merged main checkout (D4a over D5, E2 and D4). By what the seam touches
# (app code only: no content change): typecheck, lint; the three new unit files with the excerpt,
# D4, E2 material-layer, session and gate-consumer files; the app build; the transfer-offer and
# Today specs on the default port. Not the full suites: CI runs them on the push.
set -u
ROOT="/c/Users/yalir/repos/Piano Stuff/PianoProject"
OUT="/c/Users/yalir/AppData/Local/Temp/claude/C--Users-yalir-repos-Piano-Stuff/9b647b56-e651-4563-9f4f-ce3e1e36a4a2/scratchpad/chainD4a"
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
step vitest-targeted npx vitest run tests/unit/offerSnapshot.test.ts tests/unit/todayOfferSnapshot.test.ts tests/unit/transferOfferOnTheRun.test.ts tests/unit/excerptItems.test.ts tests/unit/materialIdentity.test.ts tests/unit/transferOffer.test.ts tests/unit/materialOnTheRecord.test.ts tests/unit/transferRelationship.test.ts tests/unit/contactNovelty.test.ts tests/unit/materialLayer.test.ts tests/unit/session.test.ts tests/unit/gateAtTheConsumers.test.ts tests/unit/router.test.ts tests/unit/todayCardRanking.test.ts tests/unit/scoreSummaryTruth.test.ts
step build-app npm run build:app
step e2e-today-transfer npx playwright test tests/e2e/today.spec.ts tests/e2e/transfer-offer.spec.ts --workers=2
echo "CHAIN DONE $(date +%H:%M:%S)" >> "$OUT/exit.txt"
