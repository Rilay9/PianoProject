# Reviewer response — questions at `e9aa51ae`

## U118 — folded corner-chip reserve

**APPROVE FOR DISPATCH with option (iii): placement always; include the reserve in pricing only when the size is taken while the chip is already drawn.**

The new measurements overturn the premise behind my earlier option (b). On an ordinary upright start, the later fold removes a header row that is already taller than the two-line chip reserve, so pre-pricing the chip from run start buys no physical room the folded layout lacks; instead it needlessly changes 6 of 112 window shapes and makes 27 of 28 changed-size cells smaller. That is not an acceptable cost for solving an overlap that placement alone clears in all 112 measured ordinary-start cells.

Use this rule:

1. When folded chrome is drawn, stacked slots are placed below the chip's reserved band. The first visible slot may never start inside that band.
2. Do **not** re-price/re-fit merely because the chrome folds during an already frozen run. The room released by the disappearing header is what makes this placement-only transition safe on the ordinary path.
3. If the renderer genuinely takes a new size while the chip is already drawn — for example after a width/orientation re-size that reconstructs/re-prices the frozen presentation — that sizing pass includes the chip reserve in its available height. This closes option (ii)'s bottom-under-keyboard case instead of pretending the old unfolded geometry still applies.
4. A status-text change by itself never re-prices the run.

The discriminating cases must include both paths: ordinary start → fold with shape/scale unchanged, and size taken while already folded → bottom system still inside the usable stage/keyboard boundary. If the latter produces a new slot-count/readability trade in a measured real-phone case, stop at that product choice rather than silently altering the chooser.

### One-line versus two-line reserve

**No: do not reserve two lines on a geometry where every chip sentence the product can show is proven to fit one line.**

The reserve is the **maximum allowed chip height at that geometry**, not the height of the current sentence and not a universal two-line constant. It must be stable across status changes for that fitted geometry, so determine the maximum over the legitimate chip states at that width/font contract and hold that value until a genuine size/geometry pass occurs. If all legitimate states fit one line there, one-line height is sufficient; if any legitimate state needs two, reserve two.

The earlier gallery ruling still stands: once the chip has owned space, folded-phone state coverage should detect chip-versus-score-ink overlap rather than blanket-excluding the chip.

## U119 — sideways bar text must never cover controls

**APPROVE FOR DISPATCH. The builder may choose H1 or H2 by measurement, with H1 preferred only if it preserves the bar's other required information.**

The invariant is fixed: no left-group text may cover or intercept `▶` or any other control, and the bar remains one row.

Decision rule:

- Try H1 first because containing/clipping the left group is the smaller mechanism.
- H1 is acceptable only if the measured grid still leaves **Back usable and identifiable** and `bar n / m` legible enough to retain its location meaning; the title/status may yield under their existing density rules, but navigation/location cannot disappear merely to protect the controls.
- If H1 cannot satisfy those simultaneously, use H2 and widen the narrow-bar threshold. Derive the threshold from the measured width at which the fixed controls plus the required left-group minimum cease to coexist; do not choose another arbitrary magic breakpoint.
- In either case test the wider face that produces the real 667 × 375 failed click, the app face, the neighboring sideways widths, and 115% text. A real unforced click on every visible control is the acceptance condition, not geometry alone.

No additional reviewer round is needed if one of those two mechanisms satisfies the invariant without introducing a different product trade.

## L134 — `newSeedOf` across a coarse family version bump

**Keep L134 at P2. Reach alone does not raise it.**

Priority follows a verdict the fault can actually change, not merely the fact that a live transfer route traverses the family. The reach check shows:

- unchanged siblings resolve as contact through the reviewed former-generator continuity relation before `newSeedOf` can turn the version change into apparent transfer material;
- changed rows are exactly where version separation is semantically meaningful, which is the second adversary the follow-up must preserve.

So no current transfer verdict is shown to change on the live pentatonic route. Record the relation-aware policy defect and its two adversaries at P2. Raise it only if a concrete route is found where the exact-version clause changes credit/protection/offer behavior despite the continuity relation.

## Procedure — real repertoire before generated material where it teaches the same thing

**APPROVE, with one precision added to the wording.**

The procedure should make real musical material the default candidate for musical/style/application skills when it can teach the same thing at the learner's level, while preserving generation where precise constraints, graduated variation, transfer testing, availability/licensing, or learner-specific targeting make generation better.

Use this line:

> **Real music before generated music, where it fits.** Any brief that adds or keeps generated material for a musical skill states whether a **score-verified, legally usable real excerpt** teaches the same thing at that level, and why generation wins if it is kept. General knowledge may discover candidates; the score/content evidence verifies the teaching claim. Prefer repertoire first for groove, syncopation, walking bass, accompaniment, phrasing, progressions and other style/application work; prefer generation where exact constraints, graduated variation, transfer testing, availability/licensing or the learner's measured need make control more valuable. The public build ships only public-domain or appropriately licensed score material.

Two boundaries matter:

- “verified real excerpt” means the actual score/cut has been checked for the teaching feature and level, not that a famous song is merely reputed to contain it;
- this is a **selection rule**, not a ban on generators. Mechanical drills whose value is exact control may legitimately keep generation after a short documented comparison rather than launching an exhaustive repertoire search.

This rule belongs in the procedure and should be cited by future content/generator briefs. Existing generated material is not reopened wholesale; apply it when a lane adds, materially changes, or affirmatively keeps generated material for a musical skill.