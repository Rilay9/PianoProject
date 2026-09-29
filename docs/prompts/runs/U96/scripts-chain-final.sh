#!/usr/bin/env bash
# U96's final chain on the finished tree, detached (PowerShell Start-Process): the typecheck, lint, the app
# build, the browser specs the map names plus the brief's two placement specs on port 4453 with two workers,
# then the whole unit suite. Each step's log is its own file in docs/prompts/runs/U96/; the chain writes
# build/u96/chain-final.exit with each step's exit when it ends.
W="$(cd "$(dirname "$0")/../../../.." && pwd)"
R="$W/docs/prompts/runs/U96"
out="$W/build/u96/chain-final.exit"
rm -f "$out"
steps=()
step() { local name="$1"; shift; "$@" > /dev/null 2>&1; steps+=("$name $(tail -n 1 "$R/$name.txt")"); }
step tsc-final bash "$R/scripts-run.sh" tsc-final.txt app npx tsc -b
step lint-final-without-config-copy bash "$R/scripts-run.sh" lint-final-without-config-copy.txt app npx eslint . --max-warnings=0 --ignore-pattern playwright.u96-4453.config.ts
step build-app-final bash "$R/scripts-run.sh" build-app-final.txt app npm run build:app
step e2e-map-and-placement-final bash "$R/scripts-run-e2e.sh" e2e-map-and-placement-final.txt \
  tests/e2e/session-run.spec.ts tests/e2e/modes-placement.spec.ts tests/e2e/placement-branches.spec.ts \
  tests/e2e/app-shell.spec.ts tests/e2e/drills-harmony.spec.ts tests/e2e/drills-review.spec.ts tests/e2e/drills.spec.ts \
  tests/e2e/empty-states.spec.ts tests/e2e/feedback-placement.spec.ts tests/e2e/help-strip.spec.ts \
  tests/e2e/landscape.spec.ts tests/e2e/tips.spec.ts tests/e2e/wide.spec.ts
step vitest-all bash "$R/scripts-run.sh" vitest-all.txt app npx vitest run
printf '%s\n' "${steps[@]}" > "$out"
