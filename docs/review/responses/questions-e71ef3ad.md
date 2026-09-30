# Reviewer response — briefs and re-check at `e71ef3ad`

## CL05 — practice lifecycle

**APPROVE FOR DISPATCH**

The four-screen boundary is correct: hidden/background time must not advance practice state, page turns, drill clocks or audio, and per-attempt duration must count active time only. Keeping Score and the session-instance cursor out of this lane preserves the existing ownership split.

The separate `screenLifecycle.ts` active-time primitive is acceptable here. It is a screen-attempt clock, not the session-wide stored clock. Keep the semantics aligned by tests; extraction of `sessionRunner.ts` onto a shared helper can wait for a seam that owns both files.

**Simon-chain question:** when hiding interrupts the prompt playback, **return visible silently and require the learner to ask to hear the prompt again; when they do, replay it from the start.** Do not auto-replay sound merely because visibility returned. A partial Simon prompt is not resumable musical continuity, and unexpected audio on unlock/background return is the worse product behavior. Preserve the card/chain state needed to offer replay; do not score the interrupted prompt as an attempt.

X16, U19 and U39 remain open as the brief states.

## CL15 — generator fixes

**APPROVE WITH ONE REQUIRED CHANGE**

The tremolo, naming, duration, canonical-role and starting-note fixes are well scoped. G54’s contract should name a canonical key the plan actually ships; the note-changing families must bump their versions and identity pins exactly as the brief says.

### Required change — U68 must not infer hand from clef

The conditional U68 fallback currently says that, if a one-staff bass-clef score reads as hand `R`, `extractScoreModel.ts` should infer **bass clef ⇒ left hand**. Do not build that branch.

That directly contradicts the standing U68 boundary: **hand identity is never inferred from clef or silence.** A bass-clef one-staff score can still be a right-hand part; clef is notation, not hand ownership.

Run the planned probe first. If a one-staff left-hand generator item already comes through as `L`, the generator-only fix is fine. If it comes through as `R`, choose one of these explicit-truth paths instead:

- have the writer emit an explicit staff/hand-role marker that the model reader consumes; or
- keep the current two-staff representation until that explicit writer/model contract is built.

It is acceptable for that explicit marker’s reader to live in `extractScoreModel.ts` if the probe requires it, but the discriminator must be authored/generated hand-role truth, not bass clef, staff silence or “only staff present.” Add the adversary: a one-staff bass-clef score explicitly assigned to the right hand must remain right-hand.

Once that branch is corrected, the brief may dispatch without another semantic review.

### G51 recipe questions

1. **Broken-sevenths repeat seam:** leave the tenth-in-a-sixteenth seam unchanged in this lane. The physical gate already measured the leap with its available time and did not refuse it; there is no stronger musical/teacher evidence here that justifies inventing an octave-or-smaller cap. Keep it explicitly unverified as music and bring it back only with a notation/teacher read that says the seam is actually awkward.
2. **Walking-bass ending:** a finite exercise that is not explicitly marked as a loop should **resolve to the tonic**. An approach note that only makes sense when the item repeats belongs in an explicitly looped/repeating variant, not in the default standalone ending.
3. **Tie-drill density:** one tied-across-bar event in four bars is an example, not practice. Use **at least two independent across-bar ties in a four-bar drill** as the first density rule (roughly every other bar); do not require one in every bar. The family contract/test should express the minimum opportunity count, not a visual pattern that accidentally forces identical bars.

## CL01 — lesson truth

**APPROVE WITH ONE REQUIRED CHANGE**

The two live lesson corrections are real, `improv.8` is a justified absolute, and keeping T53/T54 outside this lean lane is correct.

### Required change — T48’s coverage record must cover all twelve gates

The proposed record says T48’s gap is answered while mechanically recording only gates 1–6 and 9–11, with 7/8/12 discussed outside the table. That would recreate the same absence problem in a new format.

Make the 109-lesson record explicitly contain **all twelve gate columns/statuses**. A gate may say `covered by <entry>`, `not yet read`, `belongs to T16`, `belongs to CL19`, or another precise disposition, but it may not disappear because another seam owns the eventual work. In particular:

- gate 8 may point to T16 and remain open;
- gate 7 may point to the lesson-shape/CL19 work if that ownership is what the read establishes;
- gate 12 is `covered` only for lessons/sentences actually subjected to the teacher test by an existing review; otherwise it is `not yet read`.

The coverage record is an inventory of evidence, not a claim that every gate has already been satisfied.

### Sentence pre-check

Use narrower wording than the two draft candidates:

- `improv.3`: **“For pitch, any of these five notes can work here: over each of the three chords, each note is either a chord tone or a step from one.”** This says exactly what the worked check proves and avoids preserving the ambiguous/false-sounding clause that “all five notes belong to all three chords.”
- `ragtime.9`: **“If you memorise mistakes at full tempo, they can be hard to unlearn.”** This preserves the practice advice without claiming that fast memorisation necessarily contains errors or that errors are permanent.

`improv.8` stays unchanged.

### T16 sequencing

Do **not** run a separate 109-lesson T16 sweep and then reread the same lessons for T48. After this lane, make the next content slot the **first bounded batch of a combined per-lesson read**: T48’s still-unread truth gates plus T16’s gates 8/10 against the settled claims/concepts/stage data. Continue in bounded batches. This gets one reading pass per lesson while keeping the work reviewable.

## Re-check after E50a/E50b

### R1 — one level and one analysis

The surviving item-level scalar is **`levelEstimate`**, a derived/versioned difficulty estimate used for sorting/tie-breaking only.

- The model writes `{ value, provenance: { from: 'model', version } }` (shape may follow the project’s existing provenance conventions rather than this exact syntax).
- A human judgement may replace the estimate for sorting/calibration, with who/when provenance; it is not learner ability or curriculum address.
- Generated items do **not** write `judged`; they are model-derived like other files. This resolves G6 once R1 is implemented.
- Item `abrsmGradeApprox` is removed; a person’s grade is a judgement/calibration input, while stage-level descriptive ABRSM text may remain.
- `levelBand` stops being authored truth or an eligibility/build gate. Needs/demands versus taught material own eligibility. A derived band may remain only as a report/display artifact if useful.
- Learner-facing screens stop presenting the scalar as “the piece’s truth”; show actionable demands/rung context instead. Existing `level` may exist only as a migration/compatibility shim during the change, never as a second canonical value.

This is consistent with the convergence contract: one level with a stated derivation, and learner-facing reasons in demands rather than “5.2 learner versus 5.1 piece.”

### L53 + L69 / CL23

**Yes. Make L53 and L69 the next CL23 pre-reviewed brief together.** They share the persistence/progress owner and are both now unblocked. Keep them as two separately tested invariants inside one storage seam:

- L53 owns the `DB_VERSION` bump/index or equivalent migration needed to find performance rows beyond the 2,200 reach;
- L69 owns compaction of `byDemand`/`otherDemands` without losing the counts the evidence readers need.

Do not let the version bump become a reason to change L69’s evidence semantics, and itemise the migration/backup compatibility separately in the handoff.

### X37

X37 is buildable, but **run it after the current E57/E59 converter work**. Otherwise the PDMX quarry/re-measure can be made stale immediately by the converter corrections and needlessly run twice. Its placement decisions remain unverified as music until each moved out-of-band piece gets the required musical/content read.

### G71

Still waits on CL05 as the re-check says. CL05 may now dispatch under the ruling above; G71’s separate familiarity/product decision follows after that lifecycle seam lands.

### E50 row

Do not mark the whole E50 chain closed yet. The core repair and E50b lineage guard landed, but this reviewer required E50c so a historical incomparable mastery day cannot participate in a **new** mastery award. Close the chain only after E50c lands and is accepted; historical mastery itself still remains history.
