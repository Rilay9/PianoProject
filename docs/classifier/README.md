# Placement classifier and verifier: the gap analysis (the owner, 2026-10-07)

**The goal** (`docs/prompts/inputs-2026-10-07/classifier-review.md`): minimise what agents have to judge when generated exercises and noisy PDMX scores are classified and placed in the curriculum. Code establishes everything it reliably can; an agent judges only the residue, with the code's evidence in front of it; no human is a gate (FABLE §5). Rules first, then code. This folder is the gap analysis. **It places nothing and designs nothing.**

## The files

| File | What | Written by |
| --- | --- | --- |
| `characteristics.yaml` | the table's source: every characteristic placement needs, with its area, the placement question it serves, pipeline, evidence class, decision method, dependency chain, current code (file:line), EXISTS / PARTLY / MISSING, gap; JUDGMENT rows carry their split | hand |
| `concepts.yaml` | the 286 concept names the rungs use, each mapped onto the characteristics it reads, or marked as not an item property; a name is not a detector | hand |
| `places.yaml` | what today's definitions of the 15 tracks, 10 stages and 28 abilities read; current claims, none sourced | hand |
| `generated/table.md` | **the deliverable**: CHARACTERISTIC \| NEEDED FOR \| GEN/PDMX/BOTH \| EVIDENCE \| DECISION \| CHAIN \| CURRENT CODE \| STATUS \| GAP | `tools/classifier/build_matrix.py` |
| `generated/judgment.md` | every JUDGMENT row split into measurable evidence and the residual question | the same |
| `generated/rungs.md` | per rung, which characteristics its concepts read, by class and status | the same |
| `generated/research.md` | what no code can decide yet: definitions to quote, inference methods, outside sources, residuals, ambiguous names | the same |
| `generated/summary.md` | the counts | the same |

`build_matrix.py` fails on any rung concept, track, stage or ability missing or extra against its source list; on a row with a missing or illegal field; on EXISTS without code; on a JUDGMENT row without a split or whose split names another JUDGMENT row. `--check` fails when `generated/` is stale. It is not in CI (a workflow change goes to the reviewer first).

## Evidence, decision, chain (the reviewer's correction, 2026-10-07)

"The observations are exact" and "the characteristic is settled" are different claims, and one class conflated them (`item.progression`: the demand positions are exact, "starts simple and adds demands" is a rule). So every row carries two fields and a chain:

| Evidence: what the observations are | Decision: how the characteristic is settled from them |
| --- | --- |
| EXACT: deterministic from the MusicXML or the generator's state | DIRECT: the observation is the characteristic |
| INFERRED: an estimate, with a confidence and an ambiguity path (UNKNOWN, never a guess) | SOURCED_RULE: a quoted rule over the observations; `src` names the definition still to quote |
| EXTERNAL: needs another source (an edition, a graded list, a composer table) | CALIBRATED_MODEL: a model fitted or calibrated against an outside set; `from` names its inputs |
| | JUDGMENT: an agent decides the residual, after the split's measurable rows |

`from` is the dependency chain: raw fact → derived feature → sourced rule or model → placement conclusion. `difficulty.coordination` reads `coordination.synchrony-share`, `coordination.rhythmic-independence` and `coordination.unequal-rates` (all EXACT, DIRECT) and is itself EXACT evidence settled by a CALIBRATED_MODEL. Only the DIRECT column is settled by the observations alone. The script rejects a CALIBRATED_MODEL row without `from`, a SOURCED_RULE row without `src`, and a circular chain.

EXISTS is written only where the named code has run on real catalogue items (the build measured 2,020 of 2,100 items on 2026-10-07). PARTLY: code exists for part of it or for one pipeline. MISSING: no code.

**The JUDGMENT count is not a ceiling.** The rows whose decision is JUDGMENT are the named terminal judgments of this ontology. A SOURCED_RULE or CALIBRATED_MODEL row may keep ambiguity after it is built (harmony from the notes, phrase segmentation, voice independence, style, fingering demand, form); it then answers UNKNOWN for that item with its confidence, and an UNKNOWN never becomes FITS. Nothing here claims the rest settles objectively once code exists.

**Coordination was passed deliberately** (the reviewer): single-hand characteristics do not compose into two-hand difficulty, so the `coordination` area holds the relationships between the two streams as rows of their own: synchrony share, rhythmic independence, unequal rates, cross-rhythms (`texture.polyrhythm`), motion between the hands, hand alternation, one hand sustaining while the other moves, different articulations at once, melody-over-accompaniment balance, register overlap, pedal against hand motion, and the interaction and load models that read them.

## Two pipelines

- **Generated.** The generator's declared spec is the intent (`generated.spec-declared`). The generated MusicXML is still read by the same independent analysers as PDMX (`generated.spec-vs-actual`): today the app's detectors check the demand vocabulary against the family contract; range, phrase structure and harmonic plan are neither declared nor checked for most families.
- **PDMX.** Nothing is declared. Integrity checks run first (`integrity.*`; five of them run in the build today; the music21 key analysis is skipped there). Every extracted value carries its provenance: *exact*, *two witnesses*, *one witness*, *inferred* (with confidence), or *metadata only*. Two witnesses that disagree give UNKNOWN for that item, listed.

## The three placement questions

Every row serves one: **cope** (can the learner cope: prerequisites, nothing untaught, difficulty by component), **exercises** (does it exercise the target: how much, where, how concentrated, how salient, what else at the same time), or **material** (is it good material for the job: quality, representativeness, playability, fit). The existing machinery serves the first; the second is largely derivable from a cache the build already writes (`build/positions-cache.json`) but not computed; the third is where the JUDGMENT rows live.

## The agent's packet

An agent never receives a whole score and an open question. It receives the code-established rows for that item, with their provenance, and the named unresolved fields, and judges only those. `generated/judgment.md` is the list of what those fields can be.

## One definition per fact

A characteristic the app also uses lives in `app/src/demands/detect.ts` with a library witness, as the rhythm cells do (`onedef: detect.ts` in the yaml). Never a second definition in Python.

## How the table is used, in order

1. The reviewer reads it for omissions and challenges every JUDGMENT row again.
2. Code is built from it, in order: the EXACT / DIRECT rows, then SOURCED_RULE rows as each definition is quoted, then CALIBRATED_MODEL rows as each calibration set exists. Not before the review (`responses/classifier-gap-table.md`, CGT-no-extractors-yet).
3. The extraction table: one row per catalogue item, every value with its provenance, row count asserted equal to the item count.
4. Rung rules, written after the curriculum review says what each rung is trying to accomplish (`research.md` §7); a rule reads rows of this table and nothing else, and quotes its source.
5. Classify every item against every place: FITS, DOES NOT FIT with the failing clause, or UNKNOWN. An UNKNOWN never becomes FITS.
6. The differential against today's placement, itemised where/what/before/after/why, becomes the moves.

## What no one in this process can decide

Whether an arrangement is faithful to the real piece where no reference exists, and anything that needs listening. Those rows stay JUDGMENT with their residual stated, marked "unverified as music".
