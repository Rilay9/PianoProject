#!/usr/bin/env bash
# F3a's verification chain after the edits and the offline build. Each run's capture starts with its
# command and ends with exit=<code>. No content build inside it, and nothing on port 4173.
set -u
WT="C:/Users/yalir/repos/Piano Stuff/PianoProject/.claude/worktrees/agent-afcfb0e95fe66221d"
R="$WT/build/f3a/runs"
mkdir -p "$R"
cd "$WT"
rm -f build/f3a/chain.exit

run() {  # name, dir, command...
  local name=$1 dir=$2; shift 2
  echo "\$ (cd $dir) $*" > "$R/$name.txt"
  (cd "$WT/$dir" && "$@") >> "$R/$name.txt" 2>&1
  local code=$?
  echo "exit=$code" >> "$R/$name.txt"
  echo "$name $code" >> "$R/summary.txt"
}
: > "$R/summary.txt"
run validate . python tools/content/validate.py --allow-nc --personal
run review-check . python tools/content/review.py --check
run content-tests . python -m unittest discover -s tools/content/tests -t tools/content
run vitest-all app npx vitest run
run e2e app npx playwright test tests/e2e/lesson-flow.spec.ts tests/e2e/lesson-tools.spec.ts tests/e2e/plan.spec.ts tests/e2e/side-panel-prose.spec.ts tests/e2e/start-and-return.spec.ts tests/e2e/tips.spec.ts --config=playwright.f3a-4493.config.ts --workers=2
echo done > build/f3a/chain.exit
