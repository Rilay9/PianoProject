#!/usr/bin/env bash
# The verbatim U66 case on the fix, timers logged, failures kept. Run from app/.
set -u
node build/u125/make-spec.mjs
rm -rf build/u125/diag build/u125/diag-keep
mkdir -p build/u125/diag-keep
for i in 1 2 3; do
  U125_LOG=1 U125_THROTTLE_AT=run U125_WORKERS=8 U125_DIST=build/u125/dist-fix U125_CPU_RATE=8 \
    npx playwright test -c build/u125/pw.config.ts build/u125/specs/u66-throttled.spec.ts \
    --repeat-each=96 > build/u125/last-out.txt 2>&1
  node build/u125/summarize.mjs "fix	r8@run	w8	logged-round$i	x96" build/u125/counts-fix-logged.tsv
  for f in build/u125/diag/verbatim-FAIL-*.json; do
    if [ -f "$f" ]; then mv "$f" "build/u125/diag-keep/r$i-${f##*/}"; fi
  done
done
ls build/u125/diag-keep
