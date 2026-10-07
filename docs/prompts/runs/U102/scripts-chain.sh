#!/usr/bin/env bash
# The end-of-lane chain, detached (a background shell dies at ten minutes): the whole unit suite (the full log
# under build/u102/, too large to keep), then the map's browser specs on the port copy at two workers.
# Writes build/u102/chain.exit when done.
W="$(cd "$(dirname "$0")/../../../.." && pwd)"
R="$W/docs/prompts/runs/U102"
rm -f "$W/build/u102/chain.exit"
{
  echo "\$ (cd app) npx vitest run"
  cd "$W/app" && npx vitest run 2>&1
  echo "exit=$?"
} > "$W/build/u102/unit-all.log" 2>&1
bash "$R/scripts-run-e2e.sh" e2e-map.txt 2 \
  tests/e2e/app-shell.spec.ts tests/e2e/competence.spec.ts tests/e2e/converted-import.spec.ts \
  tests/e2e/drills-harmony.spec.ts tests/e2e/drills-review.spec.ts tests/e2e/drills.spec.ts \
  tests/e2e/empty-states.spec.ts tests/e2e/feedback-placement.spec.ts tests/e2e/first-day.spec.ts \
  tests/e2e/help-strip.spec.ts tests/e2e/lab.spec.ts tests/e2e/landscape.spec.ts tests/e2e/lesson-flow.spec.ts \
  tests/e2e/library.spec.ts tests/e2e/midi-import.spec.ts tests/e2e/modes-ladder.spec.ts \
  tests/e2e/progress.hierarchy.spec.ts tests/e2e/progress.spec.ts tests/e2e/projects.spec.ts \
  tests/e2e/score.ladder-route.spec.ts tests/e2e/score.screen.spec.ts tests/e2e/score.states.spec.ts \
  tests/e2e/session-run.spec.ts tests/e2e/tips.spec.ts tests/e2e/today.spec.ts tests/e2e/transfer-offer.spec.ts \
  tests/e2e/wide.spec.ts
echo done > "$W/build/u102/chain.exit"
