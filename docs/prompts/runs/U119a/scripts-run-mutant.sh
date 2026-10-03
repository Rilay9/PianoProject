#!/usr/bin/env bash
# U119a: one mutant — apply, build with vite alone, run the U119a rows of score.screen.spec.ts, restore.
# bash run-mutant.sh <m1..m6> [grep]
set -u
here="$(cd "$(dirname "$0")" && pwd)"
app="$here/../../app"
m="$1"
grep_for="${2:-sideways}"
python "$here/mutant.py" apply "$m" > "$here/$m-apply.txt" 2>&1 || { cat "$here/$m-apply.txt"; exit 9; }
cd "$app" || exit 9
rm -rf dist
npx vite build > "$here/build-$m.txt" 2>&1
echo "exit $?" >> "$here/build-$m.txt"
npx playwright test -c build/u119a/playwright.u119a-5333.config.ts tests/e2e/score.screen.spec.ts -g "$grep_for" > "$here/$m-run.txt" 2>&1
echo "exit $?" >> "$here/$m-run.txt"
python "$here/mutant.py" restore >> "$here/$m-apply.txt" 2>&1
PYTHONIOENCODING=utf-8 python "$here/failures.py" "$here/$m-run.txt" > "$here/$m-failures.txt"
cat "$here/$m-apply.txt"
tail -1 "$here/build-$m.txt"
tail -1 "$here/$m-failures.txt"
