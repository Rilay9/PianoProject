#!/bin/bash
# run-case.sh <tag> <dist-or-empty> <grep> [repeat]: a committed case from tests/e2e on the lane's port, lock-aware.
tag="$1"; dist="$2"; grep="$3"; rep="${4:-1}"
unset U110B_PROBES
if [ -n "$dist" ]; then export U110B_DIST="$dist"; else unset U110B_DIST; fi
cd "$(dirname "$0")/../.."
bash build/u110b/pw.sh npx playwright test --config build/u110b/playwright.u110b-5473.config.ts score.window-rule --grep "$grep" --repeat-each "$rep" > "build/u110b/case-$tag.out" 2>&1
echo "exit $?" >> "build/u110b/case-$tag.out"
