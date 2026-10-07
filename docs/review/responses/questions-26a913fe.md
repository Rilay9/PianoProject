# Reviewer response — second read and decisions at `26a913fe`

## Overall

The second read did what it was supposed to do: it found places where a mechanically plausible required change would have crossed into a new product rule or where my earlier scope was too broad/narrow.

The five questions below are ruled as follows. These rulings supersede the narrower earlier wording where they conflict; they do **not** reopen the settled seam decisions themselves.

## 1. U32 question 2 — own pre-reviewed brief

**Yes. Question 2 gets its own brief and must not ride the U32a fast path.**

U32a should build only the already-settled implementation consequences:

- Q1: probe → side-effect-free price → load only the sheets the settled shape needs, with re-price/load while stopped and never a mid-run reshape;
- Q3: a run that starts before later sheets land keeps the arrangement it started with;
- Q4: rewrite the arrange-race oracle so the playable window must agree while the extra grey look-ahead row may differ under the accepted Q3 timing.

Q2 is different. The current product contract gives the hard ordering (no distortion → frozen run → look-ahead → requested count) and a hard provisional staff floor, but it does not define a second “comfortable” threshold at which the chooser should sacrifice requested bars even though the hard floor is not yet reached. Choosing that threshold/rule changes every piece, not only long-piece loading.

The new brief should therefore present measured examples at the canonical phone dimensions, especially Bars 8, and ask one product question: **when both choices are above the hard readability floor, should extra readable look-ahead outrank satisfying the requested bar count, and by what observable rule?** Do not invent a comfort number in code before that ruling.

## 2. G101 — preserve the invariant, not “three lines”

The prior “three lines” wording was too specific. The invariant is **the identifying title stays whole**.

The builder’s current instruction is correct:

- measure the longest ending-distinguishing Library titles at 342 × 740 at both 100 % and 115 % text;
- use the smallest **Library-only** rule that keeps the identifying ending visible;
- guard the longest adversary at 115 %;
- leave Folder/other lists unchanged unless their own evidence requires a change.

If the measurement says four lines are required, four is acceptable. If a clamp still cuts a meaningful ending and no clamp is the smallest honest rule, no clamp is acceptable. This does **not** need a new pre-review merely because it deviates from my earlier three-line estimate: the product decision was already “do not cut the identity,” and the measurement is choosing the minimum implementation that satisfies it.

Stop and re-review only if the fix has to change another product truth (for example shrinking/removing actions, globally changing row density, or altering other lists) rather than merely allowing the Library title the measured height it needs.

## 3. E59 — P2, and split it from E57

**Lower E59 to P2. Also split E59 back out of E57.**

The second read materially changes the basis of my earlier combined-seam ruling:

- the app’s learner score surfaces set `drawMetronomeMarks: false`, so E59 is not currently a learner-visible printed `quarter = 96` lie;
- its actual PDMX scope is 169 defaulted rows, not the 69 identities from X40’s narrower table;
- correcting it therefore carries much larger identity/re-proof surface than the evidence lane first suggested.

E57 remains **P1** because it loses authored later tempo changes and can make playback wrong (the Rondo case is sufficient). Its brief must count all converter inputs that can exhibit that fault, including PDMX rather than assuming the X40 table was exhaustive.

E59 is a separate **P2 converter/data-fidelity seam**: decide the representation of a suggested/default playback tempo when no edition tempo exists, while preserving the fact that the tempo is defaulted rather than authored. Its 169-file identity consequences must be explicit before build.

Same converter file is not enough reason to couple a P1 authored-tempo-loss fix to a much larger P2 default-representation cleanup.

## 4. E50b — stored derivations remain history

**Yes. Keep the stored progress derivations as history. Do not rewrite or retract them.**

`status`, `passedOn`, `masteredOn` and `bestTempoPct` were derived when those runs were recorded. The store already has the durable-history rule that a mastered row is not taken back merely because a later rule changes. E50b should preserve that architecture.

The boundary is strict:

- an old run/old derived progress row remains an honest record of what the app concluded then;
- a **current tempo-dependent standard** for the repaired material may not use that old derivation as proof of the corrected standard;
- E50b’s guard therefore belongs wherever the current standard is evaluated from runs/material/base tempo;
- no migration rewrites old runs or progress rows to pretend they were played against the repaired tempo.

This means a historical `passed`/`mastered` state may continue to appear in Progress/Library and may continue to drive historical lifecycle features such as G96’s *Keep it playable*. It does **not** satisfy a newly evaluated repaired-tempo requirement by itself.

One wording guard for the landing: a historical `bestTempoPct` must not be presented as though it were a percentage of the **new repaired written tempo** unless the surface also has the old base and says what it means. List the readers at the handoff as planned so the review can check that distinction rather than silently changing history.

The second-read implementation details are also accepted:

- the class is eight items, including the Wabash cut;
- catalogue provenance must distinguish repair aliases from ordinary dated former identities so the app can apply the guard narrowly;
- a run with insufficient material/base-tempo provenance is refused for the repaired-tempo standard rather than guessed;
- the cut relation records/restores the historical creating system for exact re-proof; E55 remains its own broader excerpt-writer problem.

## 5. L120e — include excerpts and reconcile the docs

**Yes. Include `excerpts.candidate_rungs` in L120e, and reconcile the L120b documentation in the same fast-path lane.**

This is entailed by the required change’s reason, not a new product choice. `study.candidate_rungs` and `excerpts.candidate_rungs` both make a placement/candidate decision through the same `untaught_on(..., curriculum)` truth; both therefore need to expose when eligibility came only from fixed-position coping rather than from interval-reading teaching.

The output must flag the route without turning it into evidence or changing `interval.leap.taughtAt`.

For docs/02, apply only L120b’s still-pending **material-reading** facts, then reconcile the two now-false sentences into the current single rule. Do not land wording that says fixed positions are recorded only on `interval.skip`, and do not describe the leap support as a later predicate extension when L120d now stores the same declarations on `interval.leap` itself.

This stays inside L120e. No extra brief is needed for the excerpt flag or those documentation reconciliations.

## G96a / G102 interaction

G96a is reviewed separately in `responses/67fc2523.md` and may close.

For the follow-up: G102 should be the P1 **level-provenance truth** row (computed estimate vs placeholder/default vs owner judgement), not a catch-all for every PDF/import metadata observation. The PDF `Hands: Hands together` false claim is a separate learner-facing metadata truth. The `item.type` consumers that have not yet been shown to produce a concrete wrong learner outcome remain observations until verified, rather than becoming speculative rows.

## Other recorded findings

No change to the orchestrator’s handling of G103, U111 or L130 from this response. They remain separate recorded findings at their stated priority/scope.

The U66 caveats from the second read are correctly in the brief: deferral must include `completeLap`; a note stamped after the last window remains out of the run; a deferred wrap rebases the next lap’s downbeat. No new product decision is introduced there.

There is no listening packet from this process. Anything previously marked **unverified as music** stays that way unless the owner supplies a musical/listening review; code/notation review must not silently promote it to heard musical approval.

## Dispatch summary

- **U32a:** continue Q1/Q4 only; Q2 gets a new pre-reviewed product brief.
- **G101:** continue with measurement; identifying title whole is the invariant, not three lines.
- **E57:** P1, own converter seam, broaden the inventory beyond the X40 table before build.
- **E59:** P2, separate seam, 169-PDMX/default-representation scope explicit.
- **E50b:** continue with historical derivations preserved and the current-standard guard.
- **L120e:** include study + excerpt route flags and the reconciled L120b/L120d docs.
