#!/bin/sh
# G1d: the checks the map names only because the lane's Playwright config (app/playwright.g1d-4413.config.ts)
# matches no pattern (its fallback, the full required suites), beside the ones already run on their own
# logs (parity reference, content build, tsc, lint, the unit suite, the app build). Each check's output
# and exit in its own log. Run from anywhere; paths derive from this script's place.
W="$(cd "$(dirname "$0")/../../../.." && pwd)"
R="$W/docs/prompts/runs/G1d"
cd "$W" || exit 1
python -m unittest discover -s tools/midi-cleanup/tests -v > "$R/fallback-converter-harness.txt" 2>&1; echo "exit=$?" >> "$R/fallback-converter-harness.txt"
python tools/content/validate.py > "$R/fallback-content-validate.txt" 2>&1; echo "exit=$?" >> "$R/fallback-content-validate.txt"
python tools/content/review.py --check > "$R/fallback-review-check.txt" 2>&1; echo "exit=$?" >> "$R/fallback-review-check.txt"
python -m unittest discover -s tools/content/tests -t tools/content > "$R/fallback-content-tests.txt" 2>&1; echo "exit=$?" >> "$R/fallback-content-tests.txt"
for f in converter-harness content-validate review-check content-tests; do printf "%s " "$f"; tail -1 "$R/fallback-$f.txt"; done
