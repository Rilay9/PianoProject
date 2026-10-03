#!/usr/bin/env bash
# Q47's landing on the merged main checkout. By what the seam touches: the converter harness with
# and without CI=1 (the recordings exist under build/midi-real here, so both pass; the failure rule
# is exercised by the builder's own red and by CI), the fetch script's tests, the reference writer
# (with CI=1: eight references), the CI-order test and the technique-units test, typecheck, lint,
# the parity unit file. No content build (no content change). CI on the push is the real proof.
set -u
ROOT="/c/Users/yalir/repos/Piano Stuff/PianoProject"
OUT="/c/Users/yalir/AppData/Local/Temp/claude/C--Users-yalir-repos-Piano-Stuff/9b647b56-e651-4563-9f4f-ce3e1e36a4a2/scratchpad/chainQ47"
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
step harness python -m unittest discover -s tools/midi-cleanup/tests -v
step harness-ci env CI=1 python -m unittest discover -s tools/midi-cleanup/tests -v
step parity-reference-ci env CI=1 python tools/midi-cleanup/tests/parity_reference.py
step content-tests python -m unittest tools.content.tests.test_ci_order tools.content.tests.test_technique_units
cd "$ROOT/app" || exit 1
step tsc npx tsc -b
step lint npm run lint
step vitest-parity npx vitest run tests/unit/midiParity.test.ts
echo "CHAIN DONE $(date +%H:%M:%S)" >> "$OUT/exit.txt"
