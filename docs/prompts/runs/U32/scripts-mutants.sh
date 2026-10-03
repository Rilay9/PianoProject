#!/usr/bin/env bash
# U32 item 11: the four mutants, each applied to WindowRenderer.ts, the stage unit file run, the file
# restored byte for byte from its copy. Writes build/u32/mutants/<name>.txt and a summary line each.
# Usage: scripts-mutants.sh            (unit runs only)
#        scripts-mutants.sh apply <n>  (leave mutant n applied, for a browser build; restore with `restore`)
#        scripts-mutants.sh restore
W="/c/Users/yalir/repos/Piano Stuff/PianoProject/.claude/worktrees/agent-ae90e835312da8da3"
F="$W/app/src/score/WindowRenderer.ts"
KEEP="$W/build/u32/WindowRenderer.u32.ts"
OUT="$W/build/u32/mutants"
mkdir -p "$OUT"

apply() {
  case "$1" in
    1) # the cap restored: create's two sheets, and nothing made after them
       sed -i 's/    return Math.max(0, MAX_SLOTS - this.buffers.length);/    return 0; \/\/ U32 mutant 1/' "$F" ;;
    2) # the idle layout skipped: the idle callback never makes or loads a sheet
       sed -i 's/      void this.loadNextSheet().then(() => this.sheetLanded());/      this.publishSettled(); \/\/ U32 mutant 2/' "$F" ;;
    3) # the look-ahead row dropped for a piece past the probe's reach
       sed -i 's/^      chosen.toMeasure < pieceBars - 1 &&$/      pieceBars <= PROBE_MAX_BARS \&\& chosen.toMeasure < pieceBars - 1 \&\& \/\/ U32 mutant 3/' "$F" ;;
    4) # the order reversed: every sheet made in create
       sed -i 's/    const views = options.model.sourceMeasureCount > PROBE_MAX_BARS ? FIRST_PAINT_SHEETS : MAX_SLOTS;/    const views = MAX_SLOTS; \/\/ U32 mutant 4/' "$F" ;;
  esac
  grep -c "U32 mutant $1" "$F"
}

if [ "$1" = "apply" ]; then cp "$F" "$KEEP"; apply "$2"; exit 0; fi
if [ "$1" = "restore" ]; then cp "$KEEP" "$F"; cmp "$F" "$KEEP" && echo restored; exit 0; fi

cp "$F" "$KEEP"
: > "$OUT/summary.txt"
for n in 1 2 3 4; do
  cp "$KEEP" "$F"
  hits=$(apply "$n")
  if [ "$hits" != "1" ]; then echo "mutant $n: the edit did not apply ($hits)" >> "$OUT/summary.txt"; continue; fi
  (cd "$W/app" && npx vitest run tests/unit/windowRendererStage.test.ts > "$OUT/mutant-$n.txt" 2>&1)
  code=$?
  failed=$(grep -E '^\s+× ' "$OUT/mutant-$n.txt" | sed -E 's/^\s+× //; s/ [0-9]+ms$//' | tr '\n' ';')
  echo "mutant $n: exit $code; failed: ${failed:-none}" >> "$OUT/summary.txt"
done
cp "$KEEP" "$F"
cmp "$F" "$KEEP" && echo "WindowRenderer.ts restored" >> "$OUT/summary.txt"
cat "$OUT/summary.txt"
