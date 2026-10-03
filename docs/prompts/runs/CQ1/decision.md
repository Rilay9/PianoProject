# CQ1: the evidence and the decision

## Evidence

Two bounded agents gathered it; the foreman checked the line references.

### 1. Where the named styles get positive authority, and where only the broad demand does

**The named concepts reach the broad demands only in `tools/content`.** The app has no
copy of `CONCEPT_DEMANDS` and never reads a named concept.

**Named-style grants:**
- `claims.py:274–275` (`rung_claims_of`): a lesson concept found in `CONCEPT_DEMANDS` becomes
  a rung "demand" claim, "from: concept X".
- `claims.py:311–327` (`status_of`): that claim counts as *established* when an option's
  `measurement.established` holds the broad demand. The named concept itself is never
  tested.
- `validate.py:1556–1620` (`concept_claim_findings`): it passes when the broad flag holds.
- `excerpt_proposer.py:873–880` (`seed_works_for`): a shared demand pulls in seed works for
  every named style that maps to it.

**Grants by the broad demand alone** (no named-style word reaches the learner):
- `eligibility.ts:151–170`: an item "practises" the demand.
- `selectors.ts:241`: the demand tier offers such items.
- `eligibilityCore.ts:294–316`.
- `transfer.ts:82`: the texture dimension of a transfer relationship.
- `evidence.ts:394–400`: hand-independence evidence counts these steps.
- `readingControls.ts:367–394`.
- `skills.json:238–246`.

**Restrictions:**
- `eligibilityCore.ts:182–193` (`uncoped`) and `claims.untaught_on`: both read the hand-set
  `taughtAt` in `demands.json` (`["3.6"]` for the left-hand pattern;
  `["jazz.6","blues.6","jam.6"]` for the walking bass). Neither reads `CONCEPT_DEMANDS`.
- The E0b validators.
- `excerpts.concepts_for`: its shared-demand guard.

**Removing the eight mapping rows:**
- leaves `taughtAt` untouched, because it is hand-set data;
- leaves `validate.py` silent: E0b's `if concepts and …` is skipped, and the derived list is
  empty, so no warning fires;
- leaves the prerequisite gate unchanged.

### 2. `walkingBass` on two-hand exercises

Measured on 43 golden models with `node`: 0 scales, arpeggios, Hanon, five-finger or
inversion models read as `walkingBass`. In the same run, `leftHandPattern` is true on 12
scale, 4 arpeggio and **4 inversion** models; the inversion models are four beyond the
appendix's 16.

The scope is the golden models only. The walking-bass misreads E22 records are stride and
clave, not two-hand exercises.

## Decision: NARROW CLAIM

**What changes:**
- **The eight rows go.** Remove the eight named-style rows from `CONCEPT_DEMANDS`: `alberti`,
  `alberti-bass`, `broken-chord-accompaniment`, `waltz-bass`, `oom-pah-bass`, `boogie-bass`,
  `stride-bass` and `walking-bass`.
- **Their rungs claim nothing measured.** Each concept then falls into the "claims no
  detector measures" group, which grants nothing and blocks nothing. It stays there until
  its own figure slice (CQ2+) supplies a sourced, independently checked matcher.
- **The record.** A named, commented constant records this, so a later slice re-enables one
  figure at a time.

**What does not change:**
- `demands.json`, including its hand-set `taughtAt` and therefore the prerequisite gate;
- the detectors;
- any app file;
- `pending-detect.patch`.

**Why the broad demand's app grants are out of this slice.** Those grants never name a
style; they are the general-accompaniment question. They are recorded below as
dependencies, so they are not lost.

## Dependencies recorded for later slices (not done here)

- **D1, general accompaniment.** `leftHandPattern` grants "practises a moving left-hand
  pattern", transfer and hand-independence credit on two-hand scales, arpeggios and
  inversion drills (the golden count above). That is the general-accompaniment slice.
- **D2, the walking-bass figure slice.** The `texture.walking-bass` demand's own display
  word is the named style ("A walking bass"). Its app grants rest on the unsourced
  `walkingBass` heuristic, with E22's stride and clave misreads.
- **D3, CL12a's seam.** `session.ts:2754` keys `clef.bass` on the named concepts
  `accompaniment-patterns` and `walking-bass`. That is CL12a's file: reported, not touched.
