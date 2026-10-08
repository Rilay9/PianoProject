<!-- reviewer-closure-v1 -->
# Response: the proving run of the 53 EXISTS rows (the reviewer, relayed by the owner in chat, 2026-10-07)

Transcribed verbatim from the owner's paste; the reviewer did not push a file. Verdict: **APPROVE WITH REQUESTED CHANGES**, stated by the reviewer as a provisional review ruling (the script not executed, not every disagreeing score inspected). The ledger lines are mine, one per requested change.

REVIEW-OPEN: CPR-six-feature-rows-partly | The six rows citing difficulty.features change from EXISTS to PARTLY: the implementation is real, its catalogue coverage is zero.
REVIEW-OPEN: CPR-generated-key-semantics | generated.spec-declared keeps the raw generator parameter separate from its musical interpretation; key is sometimes a tonic or root, not a key signature.
REVIEW-OPEN: CPR-tempo-partial | Tempo coverage is marked partial where it applies, and the 174 defaulted-tempo provenance flags are preserved.
REVIEW-OPEN: CPR-walking-bass-adjudicate | The walking-bass disagreements are adjudicated against the examples' actual onsets, pitches and harmonic movement and a researched definition; the detector is not changed to agree with the witness.
REVIEW-OPEN: CPR-syncopation-adjudicate | The 83 syncopation disagreements are inspected bar by bar on a representative set, pickups first, before any ruling on the detector; the detector is not changed to agree with the witness.
REVIEW-OPEN: CPR-render-gap | integrity.render's gap against the catalogue (1,975 of 2,020 reported) is explained before the row is treated as fully established.

---

The model-name trailer is a separate owner decision. I wouldn't rewrite and force-push an otherwise valid commit just to remove it, particularly when that triggers a deployment.

The classifier proving-run handoff, however, is reviewer work. I'll inspect that request and its evidence independently, rather than wait for Claude to summarize it.

The handoff already exposes several significant findings:

* Six `EXISTS` rows appear to rely on difficulty features that never run over the catalogue.

* The generated `key` parameter does not consistently mean musical key.

* The walking-bass detector appears to accept repeated-note pulses and stride patterns.

* The proving run explicitly distinguishes independent MusicXML witnesses from checks that merely reproduce existing build arithmetic.

Those are useful findings, but I won't yet certify the detector disagreements as defects: the witness and detector may be using different definitions. The actual score examples and reported discrepancies matter.

### Reviewer verdict: APPROVE WITH REQUESTED CHANGES

The proving run is useful and its evidence should be accepted as diagnostic evidence, not as proof that all 53 EXISTS claims are correct.

My ruling on the three questions:

1\. Change the six difficulty-feature rows from EXISTS to PARTLY. The implementation exists, but it has zero catalogue coverage. Don't mark them MISSING, because the feature implementation is real. Clarify `generated.spec-declared`: a generator parameter named `key` sometimes means tonic/root, not a key signature. Keep the raw parameter separate from its musical interpretation. Mark tempo coverage as partial where applicable, and preserve the 174 defaulted-tempo provenance flags.

2\. Walking bass is a likely over-match, not yet a certified defect. Repeated clave pulses and stride patterns are compelling adversarial cases. Check the actual onset, pitch and harmonic movement of those examples, then apply a researched definition. For syncopation, inspect the 83 mismatches bar by bar on a representative set, particularly pickups, before ruling on the detector. Do not change either detector simply to agree with the new witness.

3\. Do not block the 42 direct-reading rows on every unfinished witness. First resolve the six false EXISTS statuses, the generated-key semantics, and any disagreements affecting existing placement claims. Independent regeneration, integrity, metadata and render witnesses can be tracked separately, provided none is silently called verified.

One further concern: `integrity.render` reports 1,975 of 2,020, so the remaining 45 items need an explicit explanation before that row is treated as fully established.

The next action should be a focused discrepancy-resolution pass, not a new general architecture exercise and not implementation of all 42 extractors. Preserve the raw results, adjudicate consequential mismatches against actual scores, update the ontology with documented reasons, and only then proceed.

I have reviewed the handoff and generated report, but have not independently executed the script or inspected all disagreeing MusicXML examples. This is therefore a provisional review ruling, not a claim that the detector discrepancies have been independently reproduced.
