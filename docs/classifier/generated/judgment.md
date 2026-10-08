# JUDGMENT rows, each split

Generated; do not edit. The 7 rows whose decision is JUDGMENT, each split into the evidence code
establishes first and the smaller question left to an agent. The agent's packet is the measured rows and
the residual question only, never the whole score with an open question.

**7 is not a ceiling** (the reviewer, 2026-10-07). These are the named terminal judgments of this
ontology. A SOURCED_RULE or CALIBRATED_MODEL row may keep ambiguity after it is built (harmony from the notes,
phrase segmentation, voice independence, style, fingering demand, form); it then answers UNKNOWN for that
item, with its confidence, and an UNKNOWN never becomes FITS. Nothing here claims the rest settles objectively.

## `form.sonata`: sonata or sonatina form

- measurable first: `key.change` (INFERRED/CALIBRATED_MODEL, PARTLY), `form.sections` (EXACT/DIRECT, PARTLY), `melody.motif-repetition` (EXACT/SOURCED_RULE, PARTLY)
- residual: whether the key plan and thematic returns the code finds amount to sonata form

## `target.representativeness`: a normal example of the thing taught, not an edge case

- measurable first: `target.prevalence` (EXACT/DIRECT, EXISTS), `target.salience` (EXACT/SOURCED_RULE, PARTLY), `target.isolation` (EXACT/DIRECT, PARTLY)
- residual: whether the located instances are the typical form of the pattern (the matcher's own definition is the first witness; near-miss fixtures the second)

## `integrity.arrangement-fidelity`: the upload represents the real piece

- measurable first: `integrity.duplicate-version` (INFERRED/SOURCED_RULE, PARTLY), `integrity.truncation` (INFERRED/SOURCED_RULE, EXISTS), `integrity.key-consistency` (INFERRED/SOURCED_RULE, PARTLY), `integrity.title-structure` (EXTERNAL/SOURCED_RULE, EXISTS)
- residual: where uploads of the same work disagree, or only one exists, whether this one is a faithful arrangement (EXTERNAL where a reference edition or recording can be compared; judgment otherwise)

## `style.good-example`: a good teaching example of style X

- measurable first: `style.evidence` (INFERRED/CALIBRATED_MODEL, PARTLY), `harmony.voicing` (EXACT/SOURCED_RULE, MISSING), `harmony.rhythm` (EXACT/DIRECT, PARTLY), `hands.per-bar-range` (EXACT/DIRECT, EXISTS), `target.prevalence` (EXACT/DIRECT, EXISTS)
- residual: whether what the code found is idiomatic for the style (the agent gets the measured voicings, attack rhythm, register and spacing, and answers only that)

## `quality.coherence`: the item hangs together as music

- measurable first: `quality.phrase-shape` (EXACT/SOURCED_RULE, PARTLY), `quality.contour` (EXACT/SOURCED_RULE, PARTLY), `melody.motif-repetition` (EXACT/SOURCED_RULE, PARTLY), `quality.cadence-close` (EXACT/SOURCED_RULE, PARTLY), `harmony.cadence` (INFERRED/SOURCED_RULE, PARTLY), `quality.reference-distribution` (INFERRED/CALIBRATED_MODEL, MISSING)
- residual: whether the measured phrase, motif and cadence facts add up to music worth playing; stated as 'unverified as music', never heard

## `quality.idiomatic`: idiomatic for the instrument and style

- measurable first: `technique.playability` (EXACT/SOURCED_RULE, PARTLY), `technique.span` (EXACT/DIRECT, PARTLY), `hands.per-bar-range` (EXACT/DIRECT, EXISTS), `style.evidence` (INFERRED/CALIBRATED_MODEL, PARTLY)
- residual: whether a playable, in-style passage is how a pianist would write it

## `quality.pedagogical-fit`: a good introduction, consolidation or transfer item for this rung

- measurable first: `prereq.untaught-demands` (EXACT/DIRECT, EXISTS), `difficulty.level` (INFERRED/CALIBRATED_MODEL, PARTLY), `target.prevalence` (EXACT/DIRECT, EXISTS), `target.salience` (EXACT/SOURCED_RULE, PARTLY), `target.isolation` (EXACT/DIRECT, PARTLY), `item.continuity` (INFERRED/SOURCED_RULE, PARTLY), `role.suitability` (EXACT/SOURCED_RULE, MISSING)
- residual: given every measured fact inside the rung's rule, whether this item is the one to teach with; the agent sees the facts and the open fields only

