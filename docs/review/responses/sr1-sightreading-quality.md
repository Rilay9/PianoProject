# Review response — SR1 sight-reading quality lane

**Verdict: APPROVE WITH REQUESTED CHANGES**

**Scoreboard: 0 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 91, MISSING 10.**

I read the immutable handoff first, then `LEVEL-SPEC.md`, the drafted correction, the current generator contract/distribution bounds, the 1.4 lesson, `readingOptions`/the taught-set path, and the relevant fixed-corpus evidence. Entry 251 is research only; this response rules the correction before it is built. Nothing heard.

## 1. Triple metre: the current contract is wrong; split 3/4 from compound metre

**Yes, this is a real curriculum-contract defect.** `content/lessons/1.4.md` explicitly teaches 3/4 and the dotted half. The generator promise “4/4 only (before 4.5)” is currently driven by `metre.compound`, so it accidentally treats simple 3/4 as though it were the compound-metre demand first taught at 4.5.

Add a vocabulary demand for the thing actually taught at 1.4 and let the generator hold follow that demand. Keep compound metre's taught-at boundary at 4.5.

One naming boundary: the new demand must mean **the 3/4/simple-triple notation actually taught at 1.4**, not “all metres with three beats.” The lane's research detector is exact 3/4. Do not let a broad id silently authorize 3/8 or another triple metre the lesson did not teach. Prefer an id/definition whose scope makes that explicit (for example a 3/4-specific demand), or document/test `metre.triple` as exactly 3/4 if that name is retained.

The contract tests should then read the vocabulary fact rather than carry a second hard-coded “before 4.5 means 4/4” truth.

## 2. Daily read at 0.1–1.2: defect, not an intentional placement choice

The daily read must not borrow 1.5's taught set merely because `rungForSlot` uses the first listing rung to route/judge the unanchored item. The corpus caught a real learner-facing leak: learners at 0.1–1.2 are offered steps/skips their actual teaching path has not established.

Keep these two concepts separate:

- the **offered-from/judging rung** may remain whatever Today needs for route/evidence semantics;
- the **generation hold** must be the learner's actual reached/taught set at that moment.

Build the bounded correction so the daily-read call supplies the real learner taught set to `readingOptions`/`heldToRung`. Do not change every non-daily reader as collateral.

If no valid phrase can be generated under that set, the honest result is no daily read yet (or another already-defined compatible reading row), not silently reintroducing an untaught demand and not weakening the property check to make a phrase exist.

Add an acceptance case for a learner before 1.1/1.5 proving the offered phrase contains no demand outside that learner's taught set. This is higher priority than cosmetic sight-reading variety because Today reaches the learner every session.

## 3. 3.4: narrow the proposed row; do not recalibrate the bound after seeing it fail

Choose **narrowing**, not post-hoc recalibration.

The `sight-reading-2` contour floor (`unitsOne >= 0.9`) is an existing distribution contract calibrated on the fixed 4/4 population. The proposed 3/4 change makes the same row land at roughly 0.75–0.87. Lowering the bound now because the proposed change missed it would make the bound follow the implementation instead of constrain it.

So split the dimensions:

- after §1, 3/4 may enter on rows/rungs where it is taught **and the existing predeclared phrase/distribution contracts still pass**; the right-hand level-2 row after 1.4 is a legitimate place if its fixed corpus passes;
- keep `sight-reading-2` at 3.4 on the narrower metre set for now rather than weakening its contour contract;
- do not add the G/F key change at 3.4 while it also creates the lane's “undeclared, undoable position move.” A key-signature progression is desirable because 3.1 teaches it, but it must be represented as an explicit reversible/held dimension, not smuggled in as a side effect of `fifths`.

A later 3/4-at-3.4 or key-at-3.4 change may proceed if it has a **predeclared** construction/distribution contract (or a representation that removes the hidden position move) and then passes the fixed corpus. Do not calibrate a new threshold on the same failures it is meant to judge.

This means the first correction may deliberately leave “key signature taught at 3.1, not yet written by a core reading row” as a named PARTIAL gap rather than solving it dishonestly.

## 4. `sightReadingUnchanged`

Repin only the rows intentionally changed by the ruled correction. Preserve the lane's useful differential: options/outputs outside the declared changed population remain byte-identical where the test promises identity. The golden is not authority over the curriculum; it is a blast-radius guard.

## 5. PACKET-TRACE

Keep lines 128–130 **PARTIAL**, not SATISFIED, for now. The frozen research corpus and two-reader differential are strong evidence, but FABLE §8 explicitly requires an acceptance test for SATISFIED. A research script outside CI can justify the correction and advance the row's evidence; it does not by itself make the product requirement permanently enforced.

The proposed edits are otherwise right:

- correct line 93's false “no consumer” statement;
- advance 68, 69, 70, 74, 75, 116 and 131 as PARTIAL with this evidence;
- move a requirement to SATISFIED only when the shipped correction plus a maintained acceptance/contract test closes that requirement, not merely because the research run passed once.

## 6. Work order after this ruling

For the sight-reading lane itself, build the **daily taught-set correction + the 3/4 demand/hold split** first. They are current progression-truth defects found by this lane.

After Bizet, the L6–L7 left-hand voice-leading finding is still the right first **separate generator-quality follow-up** among the recorded class-3 issues: 44 generated items with 14–16-semitone bar-line jumps are a concrete musical-construction problem, not just missing variety. It should not pre-empt the small SR1 corrections above and should not reopen Bizet.

Entry 251's research artefacts are approved as evidence under these rulings.