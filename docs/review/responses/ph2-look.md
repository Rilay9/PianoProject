# Review response — PH2 positioned-harmony look / pre-ship design gate

**Verdict: APPROVE WITH ONE REQUIRED CHANGE**

<!-- reviewer-closure-v1 -->
REVIEW-OPEN: PH2-position-preserving-fallback | Every Chord-chart layout used for playable positioned harmony must preserve when each symbol begins; the current sequence fallback may not ship where it reduces a bar to ordered labels without recoverable start positions.

The existing `PH2-source-measure-direct` requirement remains OPEN until the held implementation itself is pushed and reviewed. This response does not close code that is not on the branch.

I read the immutable handoff first, then the committed chart census, legibility census, before/after differentials, screenshot harness and device/state inventory. The repository connector available in this review cannot decode the committed PNG bytes themselves, so I am **not** claiming a pixel-level visual read. The design ruling below is based on the rendered layout measurements and the semantic job of the Chord chart. Nothing heard.

## 1. Core PH2 model — keep it

The held implementation's intended model is right:

- one displayed chart bar per **source measure**, in source order;
- each source measure takes its own metre directly;
- every harmony event is retained at its written offset;
- a carried harmony fills only until the first new event;
- comp, backing and live matching all follow the harmony sounding at that instant;
- exact same-offset duplicates may merge; incompatible same-offset symbols remain an explicit conflict and may not silently pick one.

That is the model the earlier PH2 ruling required.

The differential evidence is also the right shape:
- one-chord charts stay unchanged;
- Blue Bossa changes only where the old one-chord reduction was wrong: bar 16 gains its second-half G7, and the bass changes there from the old A♭ consequence to G;
- MT1's metre cases remain unchanged, including the pickup case;
- 99 legacy extra bars disappear because the source measures, not printed-number/grid inference, own the bar sequence.

The implementation still has to come back after it is pushed before `PH2-source-measure-direct` closes.

## 2. The visual rule — boxes and placed labels approved; sequence-without-position is not

The first two layout stages stand:

1. **proportional boxes**, shrinking only within the declared readable range;
2. **placed labels over a proportional rule**, still tied to each harmony's actual start.

Both preserve the fact PH2 exists to teach: **when the chord changes inside the bar**.

The third fallback cannot merely preserve symbol order.

On the 342×740 phone, the census puts **108 bars across 22 different items** into the current `sequence` fallback. This is not just Czerny. It includes real chart/repertoire material such as *Hark! The Herald Angels Sing*, *Lullaby of Birdland*, *Let It Snow*, *Rose Room*, *Aunt Hagar's Blues*, *Riverside Blues*, *Margie* and others.

Therefore a global rule like “hide every chart with four chords” is wrong, and an item-specific Czerny exception alone is also wrong.

Required product boundary:

> A playable Chord chart may compress or wrap labels, but it must leave each label's **start position recoverable from the display**.

The builder may satisfy that with the smallest visual mechanism that works — for example leader/tick marks from wrapped labels back to the proportional beat rule, or another compact representation whose geometry still identifies each onset. I am not prescribing that exact drawing.

What is not acceptable is a wrapped ordered list where the learner can tell **which chord comes next** but no longer **where in the bar it begins**.

If a particular item still cannot be rendered positionally at the minimum readable size after that correction, fail closed on the Chart door for that item rather than showing a misleading “positioned” chart. Do **not** create a chord-count threshold in advance; use the actual renderer/eligibility result, and generalise only if repeated learner-facing cases justify it.

That is `PH2-position-preserving-fallback`.

## 3. Czerny — do not invent a global ban

The dense Czerny examples are useful adversaries, not a new taxonomy.

Do not add “classical étude” or “more than N chords per bar” as a product exclusion. The census proves legitimate lead-sheet material can also carry four changes in a bar.

Use Czerny 8/10 to prove the fallback fails closed or stays positionally legible. If after the corrected fallback those exact items still cannot communicate positions readably on the narrow-phone design, their Chart door may be withheld for this release with the reason recorded. That is a consequence of the general position-preservation rule, not an item-name special case.

## 4. Pickup clock — current choice stands

Keep the pickup inside a full metronome bar with the notated pickup music occupying the final portion of that clock bar.

That preserves the next complete measure's downbeat and keeps MT1's established click/bar semantics. Treating the pickup itself as a short accented bar would change the metronome model for a problem PH2 does not need to solve.

The existing Bella Ciao differential staying byte-identical is the right guard.

## 5. Comp articulation — 0.75 of the segment may stand

The exact `0.75` factor is an implementation/articulation choice, not a curriculum truth.

The semantic contract is:
- a comp chord starts at the written harmony change;
- it ends before the next change;
- it never ties through a later chord merely because the symbol is repeated;
- very short segments still schedule without crossing their boundary.

The current 75% hold satisfies that boundary and may stand. Do not elevate the numeric factor into learner-facing doctrine.

## 6. Timing anchor — bar callback clock stands

Anchor the segment positions to the same bar/scheduler time base that drives comp and backing, rather than independently re-deriving them from the click.

That keeps the split-bar chord, bass and live state on one clock and avoids a small flam at the harmony boundary.

Acceptance should pin:
- the second Blue Bossa segment begins on the written second-half boundary;
- comp and bass change together there;
- the live cell switches to the same segment;
- click cadence remains the MT1 cadence.

## 7. Same-offset conflicts — fail closed

Keep the held design's treatment of incompatible symbols at the same source position:
- show the conflict honestly;
- do not choose one symbol for comp/backing;
- do not judge the learner against one guessed chord.

A visible ambiguity is better than invented harmony.

## 8. checks.json additions — approved

Add `app/tests/e2e/chart-segments.spec.ts` to the test-map/check rows for the PH2 consumers it actually protects:
- `ChordChartScreen.ts`
- `app/src/score/harmony.ts`
- the screen/frame route only where that test genuinely exercises the leave/re-enter behavior.

Do not add it mechanically to unrelated files.

## 9. Ship gate

PH2 code may now be revised in the builder worktree under this ruling, then pushed.

The landing handoff must show:
- the source-measure consumer actually landed;
- the position-preserving fallback correction;
- Blue Bossa bar 16 display/comp/backing/live-match at the second segment;
- a legitimate dense lead-sheet example through the corrected fallback;
- a pathological dense example proving the fail-closed boundary if it cannot render;
- the one-chord and MT1 differentials still green;
- the test-map additions.

Only then can `PH2-source-measure-direct` and `PH2-position-preserving-fallback` close.

No owner/device check is requested.
