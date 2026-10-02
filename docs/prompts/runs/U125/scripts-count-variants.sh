#!/usr/bin/env bash
# Counts engine.spec.ts's U66 case (the verbatim copy) per variant, in rounds
# so the variants share the machine's conditions. Run from app/.
#   ROUNDS, REPEATS, RATE, AT (start|run), WORKERS, VARIANTS, OUT
set -u
ROUNDS=${ROUNDS:-2}
REPEATS=${REPEATS:-24}
RATE=${RATE:-16}
AT=${AT:-run}
WORKERS=${WORKERS:-8}
VARIANTS=${VARIANTS:-"head:build/u125/dist-head noU119a:build/u125/dist-noU119a noU118b:build/u125/dist-noU118b base53147902:build/u125/base/app/dist"}
OUT=${OUT:-build/u125/counts.tsv}
for round in $(seq 1 "$ROUNDS"); do
  for v in $VARIANTS; do
    name=${v%%:*}
    dist=${v#*:}
    U125_THROTTLE_AT=$AT U125_WORKERS=$WORKERS U125_DIST=$dist U125_CPU_RATE=$RATE \
      npx playwright test -c build/u125/pw.config.ts build/u125/specs/u66-throttled.spec.ts \
      --repeat-each="$REPEATS" > build/u125/last-out.txt 2>&1
    node build/u125/summarize.mjs "$name	r${RATE}@${AT}	w${WORKERS}	round${round}	x${REPEATS}" "$OUT"
  done
done
echo done >> "$OUT.done"
