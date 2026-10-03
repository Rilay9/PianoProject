#!/usr/bin/env bash
# U105: the map's e2e specs, each checked to exist first, at two workers on port 4773.
# Run from anywhere; works in the worktree's app/.
cd "$(dirname "$0")/../../app" || exit 2
SPECS=$(grep '^e2e' ../build/u105/checks-for-paths.txt | tr ' \t' '\n\n' | grep 'spec.ts$')
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
npx playwright test --config build/u105/playwright.u105-4773.config.ts $SPECS
code=$?
echo "exit $code"
exit $code
