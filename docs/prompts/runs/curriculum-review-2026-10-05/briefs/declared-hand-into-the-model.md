# Brief: a one-staff item's declared hand reaches the score model (HD1; 2026-10-06)

**What governs:** the outside reviewer's ruling in `docs/review/responses/3a9684d5.md` §2-§5 (read it whole; it is the specification), FABLE §6 (the app never pretends) and §10. Entry 243 traced the defect: `app/src/score/extractScoreModel.ts` gives a note its hand from the voice's home staff alone (`home === 2 ? 'L' : 'R'`), OSMD numbers a lone staff 1, so any one-staff score reads as the right hand whatever its clef, pinned by `oneStaffHand.test.ts` under CL15 (hand never inferred from clef or silence). The Bizet left-hand cut (`excerpt.classical.bizet-l-amour-est-un-oiseau-rebelle.pdmx.b1-12.lh`, catalogue `hands: left`) is in the Library today with its hand focus, hands-separate playback, render diagnostic and future demand detection all treating its staff as the right hand. This seam is the immediate next landing; placement of the cut and its use as app-side proof wait on it.

**The ruling, as the contract (candidate (b); not an empty treble staff):** carry the catalogue item's declared hand into model extraction for a one-staff item, as an explicit semantic input, never a MusicXML parser rule. Narrow:
- an optional declared-hand input on the extraction or load path, sourced from the catalogue or content object where that value is authoritative; name it for the semantic declaration (`declaredHand` or equivalent), never `staff`;
- applied only to a **one-staff** model whose declaration is a single hand (`left` or `right`): the physical `staff` number from OSMD is preserved; the semantic `hand`, and therefore `handsPresent`, is overridden;
- a one-staff right-hand item declared right stays right even in bass clef; a one-staff left-hand item declared left becomes left although OSMD calls its staff 1; no clef inference;
- with no authoritative declaration, today's CL15 behaviour, no guess;
- a `both` declaration never manufactures a missing second hand: a one-staff file declared both is a mismatch to report or validate, never two hands;
- two-staff scores keep the existing voice-home-staff and cross-staff logic; catalogue metadata never flattens a real two-staff score's per-note hands.

**Consumers that move together (the seam is complete only when the declared fact reaches every path that needs the model's hand):** normal Score loading (`OsmdView.extractModel`); the evidence and recompute path that extracts models off-screen (`evidenceJob` or wherever `extractScoreModel` runs without a screen); the build and demand bridge that measures catalogue files; DevScore and the render diagnostic (`render_check.py`, `DevScoreScreen`) that compare model hands with catalogue hands; an import path only where its `hands` value is authoritative (never promote a guess into an override). Trace each call site of `extractScoreModel` and say for each whether the declaration reaches it and from where.

**Finish condition: the seven adversaries, each a test named by file, red first where it can be red:**
1. the same one-staff bass-clef bytes with declared `left`: notes hand L, `handsPresent {R: false, L: true}`;
2. the same bytes with declared `right`: R;
3. no declaration: today's CL15 result, R (the existing `oneStaffHand.test.ts` case, kept and extended, never deleted);
4. a right-hand bass-clef fixture is never flipped by its clef;
5. a normal two-staff score and a cross-staff note remain semantically equivalent to before (a snapshot of the model's hands before and after);
6. a one-staff `both` mismatch is refused or explicitly reported, never silently read as one hand;
7. the Bizet cut itself, through the real catalogue entry and the built file: catalogue left, model left, Score hand focus and duet behaviour left-hand correct, and the render diagnostic no longer reports the mismatch (`render_check.py` on the lane's own port, with `--workers=2`; the content build once, before the browser run, never during it).
Plus `npx tsc -b`, `npx vitest run` on the changed files and the full unit suite once; `docs/05` or `docs/04` where the hand rule is documented gains the rule with its reason and the CL15 amendment; `docs/08-test-map.md`'s one-staff-hand row names the seven cases.

**Stop conditions:** a call site where the catalogue's `hands` is not authoritative and no other authoritative source exists (report it; do not guess); a two-staff behaviour change in case 5 (stop and report; never "fix" the two-staff logic here); the declaration needing a storage change (report; no `DB_VERSION` bump without the reason stated and the migration rule followed).

## Files owned

`app/src/score/extractScoreModel.ts` and its options type; the call sites named above (`OsmdView.ts`, the evidence or recompute job, the build or demand bridge, `DevScoreScreen.ts`); `tools/content/render_check.py` only if its comparison needs the declaration; `app/tests/unit/oneStaffHand.test.ts` (extended) and the new unit tests; the one browser spec the render diagnostic needs; `docs/04-ui-spec.md` or `docs/05-score-follow-engine.md` (the rule), `docs/08-test-map.md` (the row). Not the cutter, not the catalogue data, not the demand detectors (the measured-cells seam follows this one).

Harness: `operating-procedure.md` §14. No commit, push, stash, checkout or reset; never name an AI model; park temporary files under `build/` in the worktree. Reply in at most ten lines: each call site and where its declaration comes from; the seven cases' results, red first where red; the suites' totals; the docs rows; a draft record entry (where, what, before, after, why); anything not done, by name.
