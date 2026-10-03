#!/usr/bin/env bash
# E2's landing on the merged main checkout (E2 over D4 and the held docs commits). By what the
# seam touches: the converter harness and the parity reference (the command-line converter now
# stamps its version), the content build offline (finder.py is called by the build; the builder
# holds that a prompt without a concept is unchanged), the content tests the seam touched, the
# validator; typecheck, lint; the two new unit files with the import, parity, gate-consumer and
# D4 files; the app build; the Today spec (main.ts gained the launch's measurement) and the two
# import specs on the default port. Not the full suites: CI runs them on the push.
set -u
ROOT="/c/Users/yalir/repos/Piano Stuff/PianoProject"
OUT="/c/Users/yalir/AppData/Local/Temp/claude/C--Users-yalir-repos-Piano-Stuff/9b647b56-e651-4563-9f4f-ce3e1e36a4a2/scratchpad/chainE2"
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
step converter-harness python -m unittest discover -s tools/midi-cleanup/tests -v
step parity-reference python tools/midi-cleanup/tests/parity_reference.py
step content-build python tools/content/build.py --offline
git checkout -- SOURCES.md 2>/dev/null
git status --short >> "$OUT/exit.txt"
step content-tests python -m unittest tools.content.tests.test_finder tools.content.tests.test_excerpt_proposer tools.content.tests.test_teaching_repertoire tools.content.tests.test_measured_truth
step content-validate python tools/content/validate.py --allow-nc --personal
cd "$ROOT/app" || exit 1
step tsc npx tsc -b
step lint npm run lint
step vitest-targeted npx vitest run tests/unit/materialLayer.test.ts tests/unit/importMeasuredTruth.test.ts tests/unit/importStore.test.ts tests/unit/importSummaries.test.ts tests/unit/importOverlay.test.ts tests/unit/midiImport.test.ts tests/unit/midiParity.test.ts tests/unit/assignmentIsNotEvidence.test.ts tests/unit/folderAssign.test.ts tests/unit/gateAtTheConsumers.test.ts tests/unit/eligibility.test.ts tests/unit/excerptItems.test.ts tests/unit/lessonPagePicksPassTheAdmission.test.ts tests/unit/transferOffer.test.ts tests/unit/materialOnTheRecord.test.ts tests/unit/session.test.ts
step build-app npm run build:app
step e2e-today-imports npx playwright test tests/e2e/today.spec.ts tests/e2e/midi-import.spec.ts tests/e2e/converted-import.spec.ts --workers=2
echo "CHAIN DONE $(date +%H:%M:%S)" >> "$OUT/exit.txt"
