# Review response — eeff22fe

**Verdict: APPROVE WITH ONE REQUIRED CHANGE**

Scoreboard remains **0 / 28 MUST abilities shipped**. This response does not move A7c.1 out of `draft`.

Reviewed the immutable handoff at `eeff22fe`, Entry 240/RG1a, Entry 241/BZ1, the probe record and its corrections, current FABLE, the current claim/ancestry rules, the measured-cells proposal promised by this handoff, and the cutter/hand facts later isolated by DF2. Nothing was heard.

## 1. Placement ruling — approve `4.4` and `latin.3` as prerequisites of `latin.4`

**APPROVE.** The cut genuinely carries `rhythm.sixteenths`; suppressing that demand to make placement pass would make the gate less truthful. A Stage-4 track rung inherits the core only through the previous stage unless an explicit prerequisite brings later core work onto its path, so `4.4` is the honest way to say that the learner must already be able to read the sixteenth figure this MODEL prints. `latin.3` is likewise the honest prerequisite for the tresillo side of the contrast: it is where the existing track first names and practises the tresillo.

Do not move `latin.4` to Stage 5 merely to manufacture ancestry. The pedagogical sequence belongs in Stage 4; the prerequisites should express the actual preparation it needs.

The placement seam should prove, rather than assume:
- the new prerequisites create no cycle;
- `claims.rung_ancestry(latin.4)` includes both `4.4` and `latin.3` and their ancestry;
- the Bizet cut and the intended tresillo controls no longer fail the coping question for those already-taught demands;
- nothing unrelated becomes newly taught merely because the rung gained those parents.

## 2. Measured cells — yes, with a strict semantic boundary

**YES: the capability is not wrong-headed.** A narrow structural detector for the two cells is useful because the current placement/claim machinery otherwise has no objective fact corresponding to the concepts, and the same structural fact is needed by G13 and later transfer checks.

The detector may establish only this proposition:

> the left hand contains the declared **onset cell** in the stated metre/bar representation.

It does **not** establish that the piece is a habanera or tresillo style, that the learner recognises the cell, that the learner can play it with the intended feel, or that a matching passage is pedagogically suitable. The probe already demonstrates why this boundary matters: unrelated repertoire can share the same onset mask. Curated teaching-use/intake evidence therefore remains necessary for MODEL/TRANSFER placement; the detector must never become a style oracle by side effect.

The proposed independent Partitura witness is the right shape: app extraction and Partitura independently read the same bytes, with fixed positive/near-miss fixtures holding the duplicated cell definition together. No music21 self-readback for music21-authored tresillo exercises.

The detailed D5/density ruling is in the separate response to `530963de`.

## 3. RG1a — accepted

Entry 240 is the required completion of the earlier range seam: a new row explicitly marked `wholeItem: false` must not count toward **any** `runs` requirement, named or unnamed, while an older row with no fact keeps the compatibility policy. That closes the live unnamed-pool leak without retroactively inventing coverage facts for old rows.

## 4. Cutter lane — tempo boundary approved; the known hand defect remains blocking for this cut

The tempo hold and the cutter lane's narrow boundary are **APPROVED**. A left-hand cut must carry the tempo that is in force in the source passage rather than silently falling back to the converter default when the staff carrying the printed mark is removed. A cut whose source genuinely supplies no mark may keep the existing defaulted-tempo truth and provenance.

It was also correct not to hide a multi-consumer hand-semantics change inside that tempo fix once tracing showed that the one-staff mismatch is the established CL15 model rule rather than one local render typo.

**Required change:** the Bizet cut must not be treated as learner-ready while its catalogue says `hands: left` but the app model, playback controls and demand detectors treat the only staff as the right hand. Keeping it off `latin.4` is not sufficient protection because an admitted catalogue item is still visible in the Library. The hand-truth seam is therefore a prerequisite to using this cut as A7c.1's MODEL. If that seam is the immediate next landing, do not create churn merely to withdraw/re-add the approval; but do not dispatch placement or claim the cut usable until the hand fix is in the same deployed lineage. If another deploy would expose the broken cut first, hold/suppress its catalogue export again.

The actual one-staff-hand ruling is in `responses/3a9684d5.md`.

## 5. Dispatch consequence

Proceed with the prerequisites/placement seam and with the cell-detector design subject to the separate density correction. Proceed with the one-staff hand fix before learner use of the Bizet cut. A7c.1 remains `draft`, and **0 / 28** remains the honest scoreboard until the complete chain and its acceptance path ship.