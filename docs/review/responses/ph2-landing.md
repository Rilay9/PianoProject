# Review response — PH2 positioned-harmony landing

**Verdict: APPROVE**

<!-- reviewer-closure-v1 -->
REVIEW-CLOSE: PH2-source-measure-direct | impl=app/src/ui/screens/ChordChartScreen.ts, app/src/score/harmony.ts | test=app/tests/e2e/chart-segments.spec.ts, app/tests/unit/positionedHarmony.test.ts, app/tests/unit/chordChart.test.ts | The chart now consumes chartSegments(symbols, measures) directly in source-measure order, derives each bar's metre from those same source measures, and its split-bar display/comp/backing/live verdict all use the positioned segments.
REVIEW-CLOSE: PH2-position-preserving-fallback | impl=app/src/ui/screens/ChordChartScreen.ts | test=app/tests/e2e/chart-segments.spec.ts | Every accepted layout keeps each symbol tied to its written start, including leader lines to the proportional rule; if no collision-free positional arrangement fits the viewport, the chart refuses instead of degrading to order-only labels.

**Scoreboard: 1 / 28 MUST abilities shipped.** A7b.1 may now proceed out of its PH2 hold under its already-established zero-preflight requirement; this response itself does not change the chain status.

I read the immutable handoff first at implementation head `cc9c56295480d53c54b4d9b1166eccafe1d1260b`, then the PH2 task record, the legibility census, `ChordChartScreen.ts`, the positioned-harmony model and unit tests, the chart segment browser spec, the jazz.6 lesson and the test-map row. Nothing heard.

The handoff names `docs/pending-review.md` Entry 281, but Entry 281 is not present there at this head; the durable PH2 record is in `docs/prompts/tasks/PH2-chart-positioned-harmony.md` / the generated task index. This bookkeeping mismatch does not affect the implementation verdict.

The first CI attempt on the PH2 deploy did not reach the PH2 unit/browser work because my later reviewer response introduced duplicate ledger IDs. That reviewer bookkeeping defect is fixed separately at `36d87c77aea878969d8b670bc43ffa8930d0507d`. I therefore do not describe PH2's original main-CI run as a product-code failure. The PH2 landing record's local evidence remains: full Python suite 2,062 pass; 46/46 targeted browser tests pass; unit suite clean apart from the already-known blues.3 case.

## 1. Source-measure consumer — APPROVE / close

The old compatibility adapter is no longer the chart's model input.

The screen now does:

- `readHarmony(xml)` → `symbols, measures`;
- `chartSegments(symbols, measures).bars`;
- `chartTiming(measures.map(...))`.

That gives one bar per source measure in source order and makes printed measure numbers display/provenance rather than bar identity.

The positioned-harmony tests preserve the important adversaries:
- repeated/suffixed/lettered printed numbers do not merge or reorder source measures;
- Blue Bossa bar 16 is Dø7 then G7 at beat 3;
- Insensatez's second-half dominant is retained;
- backup/multivoice movement does not move a harmony;
- grace/chord notes do not advance the walk, forward does;
- exact same-position duplicates merge, conflicts remain conflicts;
- bars without a new symbol carry honestly;
- the one-chord case stays the old simple cell;
- the browser case pins Blue Bossa to 32 actual source measures, none past the end.

Comp, bass and the live-cell verdict also move from the same segment clock. The unit test pins Blue Bossa's beat-3 G7 boundary across all three rather than merely checking the grid text.

This closes `PH2-source-measure-direct`.

## 2. Position-preserving fallback — APPROVE / close

The previous bad fallback — preserve chord order but lose where the changes occur — is gone.

The current tiers are acceptable:

1. proportional segment boxes while every full symbol fits;
2. labels placed over the proportional rule, with one leader per symbol landing on that chord's exact start;
3. more rows/smaller text within the declared readable floor;
4. refusal when no arrangement can keep the starts unambiguous.

The placement search rejects:
- symbols out of left-to-right onset order;
- same-line label collisions;
- a leader through another symbol;
- crossed leaders.

The browser spec independently measures the rendered geometry on the 342 px phone:
- the leader endpoint must coincide with the segment box's left/start;
- labels/leaders count must match segments;
- the rendered arrangement must not contain the prohibited collisions.

It also pins a real refusal (Rose Room) and a synthetic impossible layout, both with no Start control and a Score-screen way out.

The corpus census is the right safety argument: the fallback is not keyed to “four chords” or “classical étude”; it tries the actual geometry across 1,212 split bars / 128 charts and refuses only the viewports where positional meaning cannot be retained.

This closes `PH2-position-preserving-fallback`.

## 3. Door versus screen refusal — accept the screen refusal

My earlier phrase “Chart door fail closed” was about the product consequence, not a requirement that the Library/lesson row somehow predict runtime text metrics.

Whether a layout fits depends on:
- current viewport width;
- actual rendered symbol widths/font;
- the particular bar.

Those facts exist only on the chart screen.

So the current behavior is the correct fail-closed boundary:

- the Chart door may open;
- before offering transport or playable feedback, the chart measures the actual layout;
- if it cannot preserve positions, it shows no misleading chart, removes transport/instrument affordances, explains the exact bar/width problem, and offers **Open on the Score screen**.

Do not add a build-time “chart allowed” flag or a chord-count threshold to simulate viewport knowledge the door does not have.

A future resize/recovery polish is not a PH2 blocker unless a concrete learner route shows the refusal trapping a now-fit viewport; do not create that work from inference alone.

## 4. Rose Room — refusal is acceptable; no lesson warning

Leave the jazz.6 lesson alone.

Its Rose Room claim is comparative repertoire guidance — it has the fewest chord symbols of the six — and does not instruct the learner to open Rose Room's Chord chart.

On devices where the chart cannot preserve bar 16's positions, the chart gives an honest refusal and the Score screen remains available. Adding “needs a wide screen” to the lesson would make a device/layout implementation detail part of music instruction for a route the lesson does not ask the learner to take.

If a future chain explicitly assigns Rose Room's Chord chart on a narrow device, that chain must account for the refusal then. No speculative warning now.

## 5. checks.json — keep chart-segments on screenFrame.ts

Keep it.

The `screenFrame.ts` row is explicitly the **union of browser specs named by screens that import the frame**. `ChordChartScreen.ts` imports `screenFrame`, and its own PH2 behavior is now protected by `chart-segments.spec.ts`.

Therefore this row includes the spec because of the map's union invariant, not because `chart-segments.spec.ts` independently proves leave/re-enter behavior in `screenFrame.ts`.

Removing it would make the frame's declared union incomplete and fight the checker that enforces that architecture.

## 6. A7b.1 consequence

PH2 no longer blocks the Blue Bossa split-bar steps:

- bar 16's later G7 is visible at its written second-half start;
- Comp/backing/live matching follow that same change;
- Insensatez's positioned harmony is likewise available;
- the chart fails closed rather than teaching a wrong location if a different score cannot fit.

The prior A7b.1 PF1 review already reached zero FAIL before this landing. The orchestrator may rerun PF1 against the landed tree and, if it remains zero and no newer requirement has appeared, move A7b.1 through its normal reviewed gate. Do not invent an owner/device check.

No further PH2 seam is required.
