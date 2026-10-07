<!-- reviewer-closure-v1 -->
# Response: the gap table with evidence and decision separated (the reviewer, relayed by the owner in chat, 2026-10-07)

Transcribed verbatim from the owner's paste; the reviewer did not push a file. Verdict: yes to the proving run (step 2), before any new extractor, with the modifications below. The ledger lines are mine, one per requirement, from the text below.

REVIEW-OPEN: CGT2-proving-three-proofs | The proving run establishes, for every row claimed EXISTS: the code path runs in the real build; its output is produced for the expected population; the output means what the characteristic claims (checked against an independent witness of the claim, not only that the code returns a value).
REVIEW-OPEN: CGT2-proving-read-only | The proving run is read-only with respect to the ontology: no status, class, definition or row changes during or because of the run; it produces evidence, and discrepancies are reviewed before anything changes.
REVIEW-OPEN: CGT2-counts-no-authority | The counts by decision method (91 / 74 / 29 / 7) and by status are bookkeeping hypotheses until reviewed, never cited as established.
REVIEW-OPEN: CGT2-rule-definitions-fit | Each SOURCED_RULE needs a definition suited to the pedagogical distinction being drawn, with positive examples and near-misses (Alberti versus a generic broken chord), not only a published definition.
REVIEW-OPEN: CGT2-calibration-ground-truth | Each CALIBRATED_MODEL states what its ground truth represents before a dataset is chosen; a grade-labelled corpus may calibrate overall difficulty and not coordination difficulty.

---

Yes—this is a much better response from Claude, and the self-correction at the end is exactly the behavior we need.

The important thing is that Claude is not claiming the table solves classification. It is correctly distinguishing four states:

- Structurally complete: apparently yes, according to its mechanical coverage checks.
- Factually verified: no. This is the major remaining review job.
- Right architecture: yes.
- Ready to classify content: emphatically no.

I also agree with its proposed next step, with one modification. Do the proving run before building any new extractors. That's higher-value than adding the 42 missing direct readings right now. We need to establish whether the supposed existing foundation actually exists and produces sane results.

But I wouldn't merely test "does every EXISTS row's cited code execute?" The proving run should establish three things for every claimed EXISTS characteristic:

code path actually runs in the real build → output is actually produced for the expected population → output means what the characteristic claims it means.

That last part matters. Otherwise maxSpan successfully returning 7 could mechanically "prove" a characteristic even if the table has incorrectly characterized what maxSpan establishes.

I particularly like the final correction from 49 → 42. It caught precisely the distinction I was worried about: something can be computable without being a direct reading. harmony.chromatic-share, for example, depends on prior interpretation of harmony/key; calling the final arithmetic exact doesn't make the whole chain exact.

There is one thing I would not accept yet:

> "Direct reading | 91"

Given that it just found another seven mistakes itself, 91 is still a hypothesis, not a trusted count. Same for 74/29/7. Those are useful bookkeeping counts but shouldn't acquire any authority until review.

And Claude is right that there's a second enormous missing job after this table: the definitions and calibration evidence. The 74 quoted-rule rows are potentially where we could accidentally encode another generation of Claude's musical guesses. "Find a published definition" isn't sufficient by itself either: for each rule we need a definition suitable for the pedagogical distinction we're making, plus positive examples and near-misses. Alberti versus generic broken chord is a perfect example.

Likewise the 29 calibrated-model rows need more than "find a dataset." We need to decide what the ground truth actually represents. A grade-labelled corpus may calibrate overall repertoire difficulty reasonably while being useless for calibrating "coordination difficulty" independently.

So the actual dependency chain now looks sensible:

verify inventory → prove existing capabilities → fill direct observations → research/validate rule definitions → establish calibration references → finish curriculum/rung purposes → write placement rules → classify → inspect differential → agent-review only UNKNOWN/judgment residue.

That is finally aligned with what you originally wanted.

I would tell Claude yes to step 2, but explicitly make the proving run read-only with respect to the ontology. Don't let a failed proof silently cause Claude to "fix" statuses or definitions during the run. Produce the evidence first, then we review discrepancies. That avoids the audit changing its own answer while supposedly testing it.
