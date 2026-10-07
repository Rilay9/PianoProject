# Reviewer handoff — PH2 landed with the position-preserving fallback; one door question

**Scoreboard: 1 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 96, MISSING 5.** A7b.1 stays `draft` until you read PH2's learner-facing consequences (its steps 10 and 16 need the split bars).

The commit carrying this handoff. Respond in `responses/ph2-landing.md`. Nothing heard. Read `docs/pending-review.md` Entry 281 and `docs/prompts/runs/PH2/legibility.txt`.

## 1. What changed since your look ruling

The "in order" fallback is gone. Every layout ties each symbol to its start: boxes where they fit; otherwise labels placed over their starts, on as many lines as needed, each with a leader line down to its start on the bar's rule; an arrangement is refused if symbols leave left-to-right order, touch, or a leader crosses another leader or symbol. Where no arrangement fits a screen, the chart refuses with "‹Title› has more chord changes in bar ‹n› than this screen is wide enough to show at their places in the bar." and offers Open on the Score screen. The census, over 1,212 split bars in 128 charts at eight sizes, finds no bar whose start cannot be read; refusals run from 8 charts at the 342px phone to none at the two largest tablets. The one-chord differential stays null.

## 2. Asked

1. **The door.** Your ruling said an item that cannot be drawn positionally has its Chart door fail closed. The refusal happens on the chart screen, because whether a chart fits depends on the screen's width, which the door's build-time data does not have. Either accept the screen's refusal (one sentence and the Score screen, nothing wrong shown) as failing closed, or say what the door should know.
2. **Rose Room**, a jazz.6 song, refuses at every size measured except the two largest tablets (bar 16: four quarter-note chords whose last two symbols are wider than the room to the barline). The jazz.6 lesson names it as the song with the fewest changes to comp, without sending the learner to its chart. Say whether that is acceptable or the lesson should say its chart needs a wide screen.
3. **The checks map:** `app/tests/e2e/chart-segments.spec.ts` was added to the `screenFrame.ts` row as you asked, though the spec does not leave and re-enter the screen; keep it there or not.

## Clause map

| Clause | Implementation | Test | CI path |
| --- | --- | --- | --- |
| PH2-source-measure-direct: bars are source measures in source order, none past the end; each bar's metre from its own source measure | `app/src/ui/screens/ChordChartScreen.ts` | `app/tests/e2e/chart-segments.spec.ts` | ci.yml, E2E tests |
| The model keys bars by source measure | `app/src/score/harmony.ts` | `app/tests/unit/positionedHarmony.test.ts` | ci.yml, Content and unit tests |
| Comp, bass and the live cell change together at a split bar's written beat | `app/src/ui/screens/ChordChartScreen.ts` | `app/tests/unit/chordChart.test.ts` | ci.yml, Content and unit tests |
| PH2-position-preserving-fallback: every layout keeps each symbol's start | `app/src/ui/screens/ChordChartScreen.ts` | `app/tests/e2e/chart-segments.spec.ts` | ci.yml, E2E tests |
| Where no positional layout fits, the chart refuses with a stated reason | `app/src/ui/screens/ChordChartScreen.ts` | `app/tests/e2e/chart-segments.spec.ts` | ci.yml, E2E tests |
