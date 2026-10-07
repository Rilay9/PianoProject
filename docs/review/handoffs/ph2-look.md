# Reviewer handoff — PH2 built, held unpushed: choose the split-bar look from the pictures

**Scoreboard: 1 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 96, MISSING 5.** A7b.1 stays `draft`.

The commit carrying this handoff. Respond in `responses/ph2-look.md`. Response required before PH2 ships: your ruling (`responses/g6-ph-briefs-cb1.md` §3) holds the dense-bar look until you choose it from pictures, and every push deploys, so the PH2 code is held in its builder's worktree and only its evidence is committed here. Nothing heard.

## 1. What PH2 does (code held, evidence committed)

The chord chart's grid, Comp, Bass + drums and live cell read positioned harmony: every chord at its place in the bar; Comp strikes each at its written beat; the bass follows the chord sounding at each beat; the live cell judges the chord sounding when a note is struck; true same-offset conflicts are stacked and suspend Comp, bass and the verdict; only real source measures are drawn (99 charts lose bars drawn past the end); the printed-number lookup is gone. On Blue Bossa only bar 16 changes (its G7 shown, struck and judged; bar 16 beat 3's bass from A♭ to G); one-chord charts are unchanged in counts and click times (`docs/prompts/runs/PH2/diff/compare.txt`). The repaired screen-leave test now runs.

## 2. The look, in order of fallback

Boxes at the cell's size (down to 16px); then "placed", each symbol over the beat it starts on, one or two lines (16 to 13px) over a proportional rule; then "in order", the symbols in sequence, wrapped (14px), over the same rule. No symbol is cut. Across the 1,212 split bars in 128 charts at the 342px phone (`legibility.txt`): of 984 two-chord bars, 627 boxes and 357 placed; of 213 bars with three or more, 24 boxes, 81 placed, 108 in order.

Pictures: `docs/prompts/runs/PH2/pictures/<device>/`, eight sizes. My read of two at `phone-upright-342x740`: `blue-bossa-bar16-playing-second-segment.png` reads well (Dmi7b5 over the start, G7 beneath, the sounding half of the rule filled); `czerny10-bars17-20-six-in-a-bar-and-conflicts.png` becomes a tall stacked list that keeps the order but loses where each chord falls, and its dashed conflict boxes are hard to tell apart.

## 3. Asked

1. **Choose the look**, or name what to change, from the pictures.
2. **Should a chart door open at all** for pieces whose chord symbols are dense harmonic analysis (Czerny Op. 299 Nos. 8 and 10, six symbols to a bar)? The densest bars are almost all such pieces; a lead sheet rarely has more than two chords to a bar.
3. **`docs/prompts/checks.json`:** add `app/tests/e2e/chart-segments.spec.ts` to the rows for `ChordChartScreen.ts`, `app/src/score/harmony.ts` and `screenFrame.ts` (a test-map change, so asked first).
4. Four OPEN choices the builder made, each with the alternative rejected: a pickup counted as a full metronome bar with its music in the bar's last quarters (rejected: a short bar, which accents the pickup and needs metronome changes); a segment held for 0.75 of its length (rejected: the full length, which ties a restated chord); positions anchored to the bar's callback lead (rejected: anchoring to the click, which flams split-bar comp against the bass); and the look above.

## Clause map

No ruling closes in this handoff.
