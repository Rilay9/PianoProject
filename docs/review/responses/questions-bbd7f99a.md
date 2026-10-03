# Reviewer response — briefs and decisions at bbd7f99a

## L120c brief

**APPROVE FOR DISPATCH, with one guard on scope.**

The brief follows the L120a/L120b sequence correctly: ownership first, recompute, then move only the remaining genuinely premature material.

Keep these decisions:
- add an explicit `sixteenth-notes` concept mapped to `rhythm.sixteenths`;
- make 4.4 the first honest core owner with actual learner-facing instruction;
- make ragtime.5 and technique.6 explicit owners where their existing lessons already teach the material;
- do not add fake ownership at latin.7, holiday.7, or 3.5;
- after ownership, recompute before moving any pre-4.4 pieces;
- keep the nineteen “mention but not teaching” readings unchanged.

The one guard: **item 9 must not expand into a broad curriculum rewrite.** For the other B-claim groups, classify each case, repair only claims/mappings whose lesson text already clearly teaches the demand, and stop for reviewer word before any change that moves a demand's first core teaching rung earlier. That stop line in the brief is correct and mandatory.

The proposed 4.4 wording should be judged against the actual Hanon files, but the concept itself is sound. If the notation or click does not support “four even subdivisions of the quarter-note beat,” stop and report rather than teaching around the file.

L120c may dispatch after L120b lands.

## E51a brief

**APPROVE FOR DISPATCH, and fold in the second checks-map gap now.**

The required E51 closure work is exactly right:
- map `tools/content/excerpts.py` to the existing `app/tests/e2e/excerpts.spec.ts`;
- splice the `superseded` schema explanation into the committed `content/sources/excerpts.json` comment without renewing any approval.

Also include the second map correction the builder found:

- `content/sources/excerpts.json` is itself consumed by `excerpts.spec.ts`, so changes to that path should name the same spec in the checks map.

This is not scope creep. E51a is already the map/comment repair, and leaving a known direct consumer unmapped would knowingly ship the same class of defect one line away.

Keep it e2e-specific. Do not add the whole browser suite.

E51a may dispatch.

## E50 brief

**APPROVE THE TEMPO REPAIR, BUT DO NOT DISPATCH UNTIL CONVERSION-DATE CHURN IS PINNED FIRST.**

The seven rows are a legitimate source/conversion repair. Reconstructing a real metronome mark from the plain “= N” text belongs in conversion/normalisation, not in app tempo heuristics.

But the brief has identified a dangerous unrelated side effect: changing the converter fingerprint would re-convert every converted score merely because music21 emits a fresh `<encoding-date>`. That would change file identities and make existing runs appear unmet even where the music is byte-for-byte semantically unchanged.

Do **not** accept that churn as collateral damage for seven tempo rows.

Before E50's reconversion:
1. make conversion output deterministic with respect to `encoding-date` (pin, remove, or normalise it to a stable value at the converter boundary);
2. prove that a no-semantic-change reconversion of a representative corpus file is byte-stable after that fix;
3. then reconvert the seven intended rows and verify only their genuine semantic/file changes move identity;
4. reapply and test Weary Blues' Entry 34 hand repair as the brief already requires.

That deterministic-output prerequisite can be a tiny pre-seam if needed, but E50 should not dispatch until it is in place or explicitly folded into E50's brief.

The Wabash excerpt becoming stale by provenance is expected and should go through E51's explicit renewal path. Do not auto-renew it.

## U102 brief

**REVISE BEFORE DISPATCH.**

The durable new-row contract is correct:
- zero answered -> store `accuracy: 'not measured'` and explicit `answered: 0`;
- one or more answered -> measured normally;
- Progress/evidence readers consume that distinction;
- no database-version bump is needed for an optional field.

The problem is the proposed **legacy inference**:

> accuracy 0 with wrong notes 0 means nothing was answered

That is not safe enough as a historical truth rule. A learner can genuinely attempt a drill and miss every target without producing “wrong notes” in the particular counter used by that drill. Absence of wrong notes is not proof of absence of answers.

Do not rewrite or reinterpret old rows as “not measured” from that two-field pattern alone.

Preferred compatibility order:
1. new rows: explicit `answered` is authoritative;
2. old rows with some existing field that directly records attempts/answered count: use that;
3. old rows whose mode/kind has an invariant that *provably* distinguishes zero attempts may use that narrow kind-specific invariant;
4. otherwise leave the old 0% as legacy ambiguity rather than manufacture “not measured.”

If no safe legacy discriminator exists for a drill kind, tolerate the old row as-is and fix truth going forward. Historical uncertainty is better than a false retrospective correction.

The U104 rhythm miss-count repair may be included only if it is truly at the same write boundary and has its own adversary showing extra taps do not erase missed onsets. Do not let it widen U102 into a general rhythm-scoring rewrite.

After the legacy rule is narrowed, U102 may dispatch.

## Decisions since prior responses

- Pre-review-before-dispatch is the correct rule. Keep it.
- Batched landing of F3a + U96a + G86 is acceptable under the existing seam/evidence conditions.
- The L120b findings about fixed-position support should come back in its own handoff; do not pre-answer the leap/bass-clef questions from aggregate counts.
- The backlog-id collision assertion is a good record-integrity guard and should stay.
