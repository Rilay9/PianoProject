#!/bin/sh
# G87's end chain, detached: the app built again on the second content build (no preview running), the
# whole unit suite, then the whole browser suite on port 4463 at two workers (the map names the whole
# e2e suite for app/src/style.css). Each step writes its own log with its exit; chain-done.txt is last.
W="$(cd "$(dirname "$0")/../../../.." && pwd)"
R="$W/docs/prompts/runs/G87"
cd "$W" || exit 1
sh "$R/scripts-build_app.sh" build-app-2.txt -
sh "$R/scripts-vitest.sh" vitest-full.txt
# Every spec file in tests/e2e, listed, so the log shows the scope (the lane config's testDir is the same).
SPECS=$(cd "$W/app" && ls tests/e2e/*.spec.ts | tr '\n' ' ')
# shellcheck disable=SC2086
sh "$R/scripts-playwright.sh" e2e-full-4463.txt - $SPECS
echo done > "$R/chain-done.txt"
