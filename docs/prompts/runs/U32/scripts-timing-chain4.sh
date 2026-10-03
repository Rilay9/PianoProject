#!/usr/bin/env bash
# Item 3, the interleaved pass: the machine's load drifts between passes (the base read about half as
# slow in one pass as in the one before), so the builds are compared within rounds, one after another:
#   rest: base, eager, by need (final) — three rounds, both pieces, one open each per round;
#   tap:  base, by need with the freeze waiting for sheets (4g), by need final (4h) — two rounds, notes
#         300 ms and 2000 ms after the tap.
W="/c/Users/yalir/repos/Piano Stuff/PianoProject/.claude/worktrees/agent-ae90e835312da8da3"
R="$W/build/u32/run-pw.sh"
OUT="$W/build/u32/timing4"
mkdir -p "$OUT"
rm -f "$W/build/u32/logs/timing4.all.exit"
one() { # <build-name> <dist> <log>
  U32_DIST="$2" U32_BUILD_NAME="$1" bash "$R" "$3" playwright.u32-4473.config.ts zz-u32-timing.spec.ts --workers=1
  cp "$W/app/test-results/u32-timing/"*.json "$OUT/" 2>/dev/null
}
for i in 1 2 3; do
  for pair in base:build/u32/dist-base eager:build/u32/dist-eager byneed:build/u32/dist-byneed4h; do
    U32_FROM=$i U32_OPENS=1 U32_RUNS=0 U32_TAPS=0 one "${pair%%:*}" "${pair#*:}" "t4-rest-${pair%%:*}-$i"
  done
done
for i in 1 2; do
  for ms in 300 2000; do
    for pair in base:build/u32/dist-base byneed4g:build/u32/dist-byneed4g byneed4h:build/u32/dist-byneed4h; do
      U32_FROM=$i U32_OPENS=0 U32_RUNS=0 U32_TAPS=1 U32_NOTE_MS=$ms one "${pair%%:*}-n$ms" "${pair#*:}" "t4-tap-${pair%%:*}-n$ms-$i"
    done
  done
done
echo done > "$W/build/u32/logs/timing4.all.exit"
