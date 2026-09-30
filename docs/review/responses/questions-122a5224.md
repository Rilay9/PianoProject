# Reviewer response — briefs at `122a5224`

## CL23 — store/schema: performance reach + evidence fold

**APPROVE WITH ONE REQUIRED CHANGE**

L53 is ready as written. The version-10 migration/index, the old-backup restore path, and the dedicated migration/restore tests are the right boundary. Do not use a boolean directly as the IndexedDB key, and do not let the DB bump alter E50c's mastery semantics.

### Required change — do not compact evidence that `demandReadings` can still read

Choose path **(b)** from the brief. A row that is still reachable by `demandReadings`'s current five-read window must retain the step-index arrays that drive rival/alone/selectivity. Folding it to counts would change stored evidence meaning, not merely storage representation.

The protection must follow the **reader's actual reach**, not an age approximation. The handoff already proves why: the last five reads for a rarely revisited item can span beyond the 90-day compaction edge. Therefore no rule of the form “older than N days is safe” is sufficient.

Implement the guard in the data/compaction boundary without changing `demandReadings` semantics: preserve the positional demand detail for every row that could be selected into the current last-five window for its item, and fold only rows proven outside that set. A discriminating case should use at least six reads for one item, with the oldest row that is still inside the five-read set older than the ordinary compaction age: `demandReadings` must be identical before/after compaction for those five, while the sixth/older row may lose its positional arrays.

If the data layer cannot identify that protected set without changing `app/src/evidence/demandReadings.ts` or inventing a new evidence rule, stop and return that architecture choice rather than approximating it.

Once this is folded into the brief, CL23 may dispatch without another semantic review.

## CL15 — generator fixes: family-wide versioning

**APPROVE WITH ONE REQUIRED CHANGE**

Do **not** accept a family-wide identity move for musically unchanged sibling items, and do **not** split the pedagogical families merely to work around coarse version storage. `transfer.ts` reads generator `identity.family` as the family, so a mechanical family split would leak into transfer semantics.

### Required change — preserve unchanged siblings through an explicit generated-identity continuity relation

Use the continuity option, narrowly:

- the third-shape tremolos and pentatonic-form items whose notes actually change get the new current generator identity and **no** former-identity equivalence to their old musical material;
- unchanged octave tremolos and unchanged blues-form siblings keep learner continuity from their old generator identity to the new current identity created only by the family-wide version bump;
- exact review/current identity remains exact; the relation is for learner-material continuity only, as with the reviewed former-identity boundary, never a claim that the changed material is byte/musically identical.

The existing catalogue `formerIdentities` field is file-only today. Do not smuggle generator identities into that file-specific field. Amend the brief to make the small schema/material-reader widening explicit: either a generator-specific former-identity field or a genuinely generic learner-continuity relation whose type admits both identity kinds while preserving the existing exact-review boundary. `types.ts`/`material.ts` may enter this lane for that narrowly stated reason.

Required guards:

1. an unchanged octave sibling's old generator identity resolves to the new row for learner continuity;
2. an unchanged blues-form sibling does the same;
3. an actually changed third-shape/pentatonic old identity does **not** resolve as the new material;
4. the current review identity remains the new exact identity, not the old one;
5. generator family remains the same for transfer/family semantics.

This is preferable to throwing away real learner history or changing the meaning of “family” to accommodate a versioning implementation detail.

The already-folded U68 explicit-hand-role correction and the other CL15 recipe rulings stand. Once this identity correction is in the brief, CL15 may dispatch without another semantic review.