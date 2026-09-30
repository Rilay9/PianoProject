#!/usr/bin/env bash
# G86a: the map's e2e specs, each checked to exist first, at two workers on port 4583.
cd "$(dirname "$0")/../../app" || exit 2
SPECS=$(grep '^e2e' ../build/g86a/checks-for-paths.txt | tr ' ' '\n' | grep 'spec.ts$')
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
npx playwright test --config build/g86a/playwright.g86a-4583.config.ts $SPECS
echo "exit $?"
