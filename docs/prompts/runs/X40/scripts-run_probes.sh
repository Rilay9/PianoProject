#!/usr/bin/env bash
# X40: the check against folders it must fail on (never skip). Output: the failing test names and assertion lines.
W="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$W/docs/prompts/runs/X40/nonvacuous.txt"
: > "$OUT"
cd "$W/app" || exit 2
for probe in missing no-maple one-short personal-gap; do
  if [ "$probe" = missing ]; then dir="$W/build/x40/probes/does-not-exist"; else dir="$W/build/x40/probes/$probe"; fi
  echo "=== probe: $probe (PIANOPATH_TEMPO_CHECK_CONTENT=build/x40/probes/$( [ "$probe" = missing ] && echo does-not-exist || echo "$probe" ))" >> "$OUT"
  PIANOPATH_TEMPO_CHECK_CONTENT="$dir" npx vitest run tests/unit/tempoSoundAgainstMark.test.ts > "$W/build/x40/probe-$probe.log" 2>&1
  code=$?
  grep -E "^ +(×|✓)|AssertionError|^\+ +\"|^\- +\"|Tests +[0-9]" "$W/build/x40/probe-$probe.log" | sed 's/\x1b\[[0-9;]*m//g' >> "$OUT"
  echo "exit $code" >> "$OUT"
done
cat "$OUT"
