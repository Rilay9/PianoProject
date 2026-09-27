# Reviewer response — F0 handoff `e5cb2fe`

Reviewed handoff: `e5cb2fe980a18eda19eee726421f906467b40db9`  
Implementation under review: `b8f713c68652bafc4a234cb4ac5b997d32af44d1`

## Verdict

**APPROVE WITH ONE REQUIRED FIX-FORWARD.**

F0's main learner-truth corrections are sound and the implementation matches the brief closely enough to advance. The rhythm relation, single-dot limitation, anacrusis convention/counterexample, half-pedal mechanism, app-range wording, theory corrections, swing framing, old-audit reconciliation, diagnostic absolutes lint, and the new truth-vs-app distinction in tests are all materially better than the prior state.

The one required fix-forward is the remaining unsourced medical threshold in `content/lessons/practice.4.md`. It does not block T53 dispatch, but it must be reconciled before F0 is treated as fully closed / before C7 is pushed as the accepted frontier.

## Verified findings

### 1. ACCEPT — the four headline factual corrections are real in learner-facing content

- `1.2.md` now correctly says the printed 1/2/4 values double going downward and halve relative to the value below.
- `1.4.md` explicitly limits the add-half rule to one dot and gives the second-dot arithmetic.
- `1.4.md` frames the shortened final bar as a common convention, not a law, and uses the bundled *When the Saints* score as the counterexample.
- `technique.7.md` no longer teaches the old “treble clears while bass rings” model. It describes damper-string interaction and the later quieter free decay instead.
- `lessonClaimsNeverTeachWrong.test.ts` adds non-vacuous arithmetic and half-pedal truth checks rather than merely checking agreement with the app.

I also independently checked the Lehtonen/Askenfelt/Välimäki 2009 paper abstract/full-text availability. Its reported three-phase part-pedaling behavior (free vibration → damper-string interaction with rapid decay → later free vibration with lower decay rate) supports the lesson's revised physical model. The lesson should continue to avoid a simplified register-specific claim.

### 2. FIX-FORWARD — `practice.4` still teaches an unsourced medical threshold

Current learner-facing sentence:

> “Pain that lasts more than a couple of days, or any numbness or tingling, is a reason to see a doctor or a physiotherapist…”

Entry 82 itself lists this threshold under “outside expert” / unsourced safety advice. F0's own contract says remaining factual/safety claims are sourced, honestly uncertain, or removed. A precise “couple of days” referral threshold therefore should not survive F0 as written.

Required disposition:
- remove the precise time threshold unless a suitable clinical source supports it; or
- replace it with appropriately non-precise language that does not invent a clinical cutoff.

Do not expand F0 into a medical-guidance rewrite. This is a narrow truth/sourcing correction.

**Status:** FIX-FORWARD, required before F0 is fully closed.  
**Does not block:** T53.

### 3. ACCEPT — old-audit reconciliation is not a disposal pile

`f0-disposition-85.md` contains all 87 unticked boxes. The 39 deferrals within the original requested set are classified, and the extra outside-the-85 judgement explains the apparent 40th “deferred to F” row. No deferred row is left without a reason/category.

The category set is adequate. For Wave F sequencing, handle in this priority:
1. factual/safety or contested claims that need truth resolution,
2. outside-expert technique/history claims,
3. musical/pedagogical judgements,
4. voice-only absolutism/superlatives.

Do not collapse “contested fact” and “outside expert”; they can overlap but answer different questions.

### 4. ACCEPT — half-pedal register should remain out of the lesson

Do **not** add a simple “bass rings longer than treble” rule merely because a source can be found. The cited acoustics are register- and mode-dependent and more nuanced than that sentence would imply. The present “find by ear where they catch on your piano” is pedagogically safer and truer.

If Wave F later adds register detail, it should be because the detail serves a teaching purpose and can be stated with the source's actual nuance, not to fill a perceived factual gap.

### 5. T53 GATE — APPROVE; dispatch now / in parallel with C7 if capacity exists

The generator fault is real.

At the F0 implementation state, `make_arpeggio()` constructs multi-octave fingering by repeating `table[:3]` and appending the table's last finger. For a white-root LH table `[5,3,2,1]`, two octaves become `5-3-2-5-3-2-1`, which creates the exact impossible octave join F0 reported. The same construction also makes the black-root RH table repeat finger 2 across the octave join.

T53 is correctly scoped as a small P0 truth repair and is file-disjoint from C7's competence-state migration. It does not need to wait for C7 to finish.

**T53 verdict: APPROVE AS WRITTEN**, with this interpretation of its tests:
- source-backed expected fingering sequences / per-key contracts are the truth where available;
- mechanical adversaries such as “same finger on two different adjacent pitches” are useful guards, not substitutes for a fingering source;
- if a shape cannot be honestly sourced, omit fingering rather than inventing one.

The lesson 4.3 warning is an acceptable temporary stopgap only until T53 lands.

### 6. CI / verification note

The handoff reports the orchestrator chain green, including the full default Playwright run (791 passed, 7 skipped). GitHub exposes no workflow/check status for `b8f713c`, so I cannot independently corroborate CI from GitHub Actions for that commit. This is not a blocker because the handoff records the explicit local chain and the code/tests inspected support the claims above.

## Sequencing / disposition

- F0: **APPROVE WITH REQUIRED FIX-FORWARD** on the `practice.4` threshold.
- T53: **APPROVED TO DISPATCH NOW**; it may run while C7 finishes.
- C7: may continue building, but before it is pushed as the accepted frontier, reconcile the F0 safety fix-forward and rerun any affected chain.
- D0 remains behind C7.
- No owner decision required.

## Do not reopen

Do not reopen Parts 12–27, C6, or T52 from this response. The findings above are specific to F0/T53.
