#!/usr/bin/env bash
# The fix's proof: the verbatim U66 case, fix and head interleaved, under the
# conditions that showed the failure. Run from app/; writes counts-final.tsv.
cd "$(dirname "$0")/../.." || exit 1
rm -f build/u125/counts-final.tsv build/u125/counts-final.tsv.done
V="fix:build/u125/dist-fix head:build/u125/dist-head"
OUT=build/u125/counts-final.tsv VARIANTS="$V" ROUNDS=2 REPEATS=24 RATE=16 AT=run bash build/u125/count-variants.sh
OUT=build/u125/counts-final.tsv VARIANTS="$V" ROUNDS=3 REPEATS=24 RATE=8 AT=run bash build/u125/count-variants.sh
OUT=build/u125/counts-final.tsv VARIANTS="$V" ROUNDS=2 REPEATS=24 RATE=16 AT=start bash build/u125/count-variants.sh
echo all > build/u125/counts-final.all-done
