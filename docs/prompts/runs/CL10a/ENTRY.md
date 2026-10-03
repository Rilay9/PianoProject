### Entry 225 — CL10a

Judgement: learner behaviour has not changed. The first requested causal check is published, but not run; the detector build remains unfinished until that result distinguishes the held tune from a bar with no tune. Nothing has been heard or verified as music.

Base: `9dedcc0560503f46b18387a5eddf6d0274d54fe2`.
Test-only commit: `79c56589fbafecf12390149b6be5e08ec3ee9e11`.

Mechanism inspected: `app/src/demands/detect.ts` leftHandPattern, tune predicate, reads `note.measureIndex === bar` and misses sound held from a prior measure. `app/tests/unit/helpers/phrase.ts` sums a tie's written durations into one note and creates a step at each barline. `app/src/score/types.ts` specifies merged ties as one initial note. The fixture uses those existing contracts, without adding a model field.

Cases: merged C5 tied for two full 6/8 bars over twelve lower-staff eighths; the same texture with separate melody attacks; the same accompaniment with no upper-staff tune in either bar. Only the first is predicted red. R37 is not yet marked reproduced or closed.

Share rule: not implemented. Candidate eligibility is full bars where both melody (including a held tune) and accompaniment sound; silent and accompaniment-only bars and an explicitly marked pickup are excluded. Introduction/ending bars containing both parts remain eligible without a structural annotation that identifies their role. For walking bass, compound bars cannot count as qualifying walks. Majority support could describe a prevailing texture; the decision must still be tested against the actual deferred examples and a long piece with only two walking bars. No threshold has been chosen to empty the table.

Pins and claims: no detector behavior changed, so no pin was moved, no untaught table regenerated, and no rung claim or deferral edited. Corpus gains/losses are unmeasured. The full consumer search of keySig, model copies/serialization, demand outputs, deferrals, rung_audit and level features remains for the implementation round.

Where the brief was wrong: no correction established by this checkpoint. Its explicit first-test dependency requires the orchestrator's result before the implementation proceeds; source inspection predicts that result but is not execution.

Not done: extractor fixture; clef and key map changes; metre correction; share implementation; every other red-first case; corpus/pin/claim comparisons; deferral removals; application code; full runtime checks; implementation mutants. The requested test map now identifies this staged fixture. Records and the working branch are untouched.
