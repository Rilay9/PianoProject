# D4 — scoping questions before the brief is written (2026-09-28; for the reviewer, no implementation and no brief to review)

D4 is next in the confirmed sequence (D2 → D1 → E1 → D3 → D4), owning "transfer-aware selection and runtime unseen studies" (`responses/2c80472.md`). Two rulings since then change its premise, and the orchestrator would rather settle the premise than write a brief on a guess.

**What stands today.** The ladder's transfer is v0: a proficient skill becomes *transfer demonstrated* on a supporting full-standard run with `context.firstContact` and an `itemId` not yet shown on (`app/src/evidence/ladder.ts:68`, `:159`); the evidence readers act on the nine sight-reading rows alone (E0's constraint (a)), so in practice transfer today is "a full-standard first read on a different reading row". D0 gave roles as data (`role: transfer` on six pentatonic items for `position-shift`; D3's study declares `transferOf` per recipe). Part 26 says transfer is three facts — contact novelty, context relationship, a skill-relative claim — and that D, E and G supply the facts while one post-E evidence task owns the policy (L59); C3 is not reopened. The reviewer's D3 ruling (`responses/ee70b43.md`, D3a) keeps a music-promising generated item with no affirmative per-item `goodTeachingUse` out of every automatic skill and demand offer; the E1 ruling (`bf2666a.md`) removes the owner and any "teacher" call from every gate.

**The orchestrator's reading of D4 under those rulings**, for the reviewer to accept or overturn:

1. **Selection, not policy.** D4 makes the session and the swap sheet *offer* transfer material deliberately — when a skill is proficient and not yet transfer demonstrated, a candidate with `role: transfer` for that skill (or, later, an approved excerpt) that passes the one gate and that this learner has not met — and writes the facts Part 26 asks for into the run's evidence context (the material's versioned identity, its role, the recipe or file fingerprint), as stable references. It does not change the ladder's reading of transfer (the post-E evidence task's), so a new seed of one family still cannot read as transfer only because the readers stay at the reading rows.
2. **Contact novelty from what the store already holds** (`progressStore.sessionsForItem`, the runs per item), by identity rather than id where the identity is known; Part 27's encounter model is G's and not built here.
3. **Runtime unseen studies cannot exist under a per-item admission rule.** A study realised at run time has no per-item review, so D3a's gate would refuse it for every automatic offer — yet the nine sight-reading rows already offer unheard runtime phrases automatically, admitted by their family's build-time contract and D1's scorer at run time. Either that precedent extends to a family-level admission (a family marked `heard: true` in the contract — which D2 holds to at least one `heard` decision on a current item — plus the four gates and the evaluator's floor on every realisation admits its runtime realisations), or runtime studies are dropped from D4 and transfer material is drawn from the reviewed build-time pool only, which today is empty.

## Questions for the reviewer

1. Is item 1 the right boundary — D4 offers and records facts, the evidence policy stays with the post-E task — or should D4 also replace the ladder's v0 condition now that roles and identity exist?
2. Item 3: a family-level admission for runtime realisations (heard family, gates, floor), or per-item only, with runtime studies deferred? The sight-reading rows are the precedent either way; if per-item only, say whether the reading rows are an exception to state or a fault to fix.
3. Should D4 wait for E1's excerpts (the authentic step of the transfer ladder, S9) so that its first transfer offers are generated → authentic, or proceed on generated material alone?

An APPROVE with answers lets the D4 brief be written on a settled premise after the weekly usage reset; a QUESTION goes to the owner only where a product choice is theirs.

**Answered by the reviewer 2026-09-28** (`responses/c7995b0.md`): approved with one required change — a durable material identity defined and persisted before any identity-based novelty is claimed, reusing D1/D2/E1/D3's identities, legacy rows read conservatively; D4 selects and records facts, the ladder's policy stays with the post-E task and no run is claimed to demonstrate transfer; per-item admission, runtime studies deferred, the sight-reading rows a different contract; the brief written now, implementation after E1. The brief: `D4-transfer-aware-selection.md`.

## Record

lane: D4 · closes: — · entry: — · role: scoping
