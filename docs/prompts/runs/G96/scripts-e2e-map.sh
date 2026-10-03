#!/usr/bin/env bash
# The map's browser specs for G96's changed paths (checks-for-paths.txt), at two workers on port 4573 against
# app/dist (the changed build), as one detached run: writes build/g96/e2e-map.exit when done.
W="$(cd "$(dirname "$0")/../../../.." && pwd)"
rm -f "$W/build/g96/e2e-map.exit"
bash "$W/docs/prompts/runs/G96/scripts-run-e2e.sh" "${1:-e2e-map.txt}" 2 \
  tests/e2e/app-shell.spec.ts tests/e2e/doors.spec.ts tests/e2e/empty-states.spec.ts tests/e2e/feedback-placement.spec.ts \
  tests/e2e/finder.spec.ts tests/e2e/landscape.spec.ts tests/e2e/lesson-flow.spec.ts tests/e2e/library.spec.ts \
  tests/e2e/modes-rhythm-only.spec.ts tests/e2e/progress.hierarchy.spec.ts tests/e2e/progress.spec.ts tests/e2e/projects.spec.ts \
  tests/e2e/today.spec.ts tests/e2e/transfer-offer.spec.ts tests/e2e/wide.spec.ts > "$W/build/g96/e2e-map.exit.tmp" 2>&1
mv "$W/build/g96/e2e-map.exit.tmp" "$W/build/g96/e2e-map.exit"
