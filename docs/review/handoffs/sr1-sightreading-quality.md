# Reviewer handoff — SR1, the sight-reading quality lane (FABLE §2 step 6): the findings, and a correction that needs a ruling before it is built

**Scoreboard: 0 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 91, MISSING 10.**

Implementation HEAD: `117788af` (Entry 251, research artefacts only; no app or content change). Respond in `responses/sr1-sightreading-quality.md`. Response required for §2; the rest is evidence. Nothing heard: every musical statement below is about notation read by two independent readers.

## 1. What the lane did (the brief: `docs/prompts/runs/curriculum-review-2026-10-05/briefs/sightreading-quality.md`; the record: Entry 251 in `docs/pending-review.md`; the files: `docs/prompts/runs/sightreading-quality/`)

- `LEVEL-SPEC.md`: the seven levels, dimension by dimension, against the ABRSM, RCM and Faber cells already recorded in `SOURCE-CHECK-reading.md`. No PDF was fetched (a download, no approval that session), so cells that file did not record say "not read".
- A corpus of 374 items frozen in `MANIFEST.json` before generation (strata O 120, BC 28, BL 98, A 26 written and 6 refused, C 96), exported through the app's own `readingOptions`, `readingOffer` and `generateSightReading` (`app/tests/research/`, outside CI). partitura and musicxml-io disagree on 0 of 368 files, with a perturbation confirming the comparison bites. Properties P1-P6 pass on every written item; P9 determinism 374/374; every predicted WRITE wrote; every KNOWN-DEFECT failed property 7 as predicted.
- One brief premise refuted and corrected in the method: the brief held the anchored row at the learner's rung; Today opens the daily read at `rungForSlot`'s rung (`TodayScreen.ts`), never at the learner's. Stratum BC was built as Today builds it.

## 2. What needs your ruling before the correction is built (Entry 251, "Drafted, not built")

The correction (3/4 on the `-2-right`, `-2`, `-3`, `-4` rows and key signatures ±1 on the last three; `drafts/correction.diff` with a red-first progression test, seven cases red on the base catalogue) was built, rerun (the 290 items whose options did not change stayed byte-identical), and reverted because six contract tests went red. The blockers are not the diff's; they are conflicts already in the tree:

1. **Triple metre.** The generator contract's promise "4/4 only (before 4.5)" (`app/tests/unit/helpers/promises.ts:324`, keyed on `metre.compound` untaught, read by `generatorContract.test.ts`) holds every phrase before 4.5 to 4/4, while `content/lessons/1.4.md:23` teaches 3/4 and the dotted half. One fact in two places. The orchestrator's lean: 1.4 teaches 3/4, so a `metre.triple` demand taught at 1.4 belongs in the vocabulary, with the compound-metre boundary staying at 4.5; the contract test then follows the vocabulary. Say if you read the lesson and the sources otherwise. This is a pedagogy fact, so the owner decides if you and I disagree.
2. **The daily read's hold.** Learners at 0.1-1.2 get skips (and at 0.1 steps) their rung has not taught, because the unanchored daily read opens at rung 1.5's hold; 12 corpus items fail property 7 for that one reason. The lane drafted "the hold at the learner's rung" as a class-3 change and did not build it. Is this a defect of the offer (build it, bounded to `rungForSlot`'s choice for the daily read) or a placement choice the curriculum made?
3. **The G/F position at 3.4** is reached by an undeclared, undoable move, and `-2` at 3.4's one-contour share falls to 0.75-0.87 under its 0.9 bound once 3/4 is allowed. The lane's reading: the bound is calibrated on 4/4 phrases; recalibrate or narrow the row. Your call on which.
4. `sightReadingUnchanged` pins the rows' params byte for byte; any row change re-pins it. Information.

The other class-3 drafts (T37 named for mixed-metre lists; L6-L7 left-hand voice leading, where the left hand jumps 14-16 semitones at bar lines on 44 items; `heldToRung` to a fixed point; the broken and walking left hands in 3/8 writing 24 divisions into an 18-division bar) are recorded, not built; none is on the Bizet path. The orchestrator will brief the L6-L7 voice-leading one after the Bizet slice as the first generator-contract follow-up, unless you rank another higher.

## 3. PACKET-TRACE edits the lane proposed (its numbers are file lines of `docs/prompts/PACKET-TRACE.md`), not applied

Line 93: L5-L7 do have consumers (the row says otherwise). Lines 128-130: the lane calls them satisfied; the orchestrator keeps them PARTIAL, because the lane's checks are research outside CI and FABLE §8 makes SATISFIED need an acceptance test; say if a research check with a frozen manifest counts. Lines 68, 69, 70, 74, 75, 116, 131: PARTIAL with the evidence advanced. These become status edits after your answer.
