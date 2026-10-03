#!/usr/bin/env bash
# U63: the twelve specs the map names for TodayScreen.ts, and projects.spec.ts, each checked to exist first
# (a missing path is dropped silently), at two workers on port 4673 against the prebuilt dist.
cd "$(dirname "$0")/../.." || exit 2
SPECS="tests/e2e/app-shell.spec.ts tests/e2e/doors.spec.ts tests/e2e/first-day.spec.ts tests/e2e/lab.spec.ts tests/e2e/lesson-flow.spec.ts tests/e2e/modes-free-play.spec.ts tests/e2e/modes-placement.spec.ts tests/e2e/progress.hierarchy.spec.ts tests/e2e/progress.spec.ts tests/e2e/session-run.spec.ts tests/e2e/today.spec.ts tests/e2e/transfer-offer.spec.ts tests/e2e/projects.spec.ts"
missing=0
count=0
for s in $SPECS; do
  count=$((count + 1))
  if [ ! -f "$s" ]; then
    echo "MISSING $s"
    missing=1
  fi
done
echo "checked $count spec paths, missing=$missing"
if [ "$missing" != 0 ]; then exit 3; fi
U63_DIST=dist npx playwright test --config build/u63/playwright.u63-4673.config.ts --workers=2 $SPECS
echo "exit $?"
