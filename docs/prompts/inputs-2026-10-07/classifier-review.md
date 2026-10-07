# Review of the placement classifier architecture (2026-10-07)

**To:** the session that built `docs/classifier/` (`e521937e`).
**From:** the owner's local review session. It combines its own review with the outside reviewer's (ChatGPT's) critique of the first characteristics answer; that critique is kept word for word in `chatgpt-classifier-gap.md`.
**Status:** the owner relays this as direction. FABLE §2 item 7 is to be edited in place to match. No classifier code runs until the owner restarts work.

## Verdict

The shape is right, so keep it:
- the rules come first;
- scripts decide, and no agent decides a placement;
- `UNKNOWN` never becomes `FITS`;
- generated items are checked against their parameters, and imported items get integrity checks first;
- two witnesses must agree;
- the differential against today's placement is check 5.

Do not build from it yet in its current form, though. It answers one question well and two questions not at all. And its source rule blocks everything.

## 1. Every placement asks three questions, not one

Each rule for a place must state which of these its clauses answer:

| Question | What it covers | Today |
|---|---|---|
| **A. Can the learner cope?** | prerequisites; nothing untaught (`claims.py untaught_on`, line 474); difficulty in band | mostly covered |
| **B. Does it exercise the target?** | the target present, and also how much, where, how concentrated, how salient, and what else happens at the same time | covered as density only |
| **C. Is it good material for this job?** | coherence, playability, representativeness, integrity of the arrangement | missing |

For **B**, the item table already stores counts with bar positions. Derive these from the stored values; most need no new detection:
- **prevalence**: the count per bar;
- **distribution**: the spread across the piece;
- **isolation**: what else is demanded in the same bars;
- **progression within the item**: does it start simply?

Salience and representativeness stay `UNKNOWN` unless a definition is found.

For **C**, use the owner's rule (FABLE §5): **no human judgement as a gate**. Establish what can be established:
- integrity checks;
- playability checks: span, leaps, hand distribution;
- features measured against a real-music reference corpus of the same level;
- a curated, verified passage fact where a real piece serves as MODEL or TRANSFER.

Everything else is `UNKNOWN`. An item whose C is `UNKNOWN` may still FIT a CONTROL or consolidation slot if A and B hold. It may not be the first introduction of a concept, or a MODEL, until C is established. The critique proposed "musical integrity: human-reviewed". That is overruled.

## 2. Generated and imported items are two pipelines

The architecture's section A states this. Make it structural in the schema and the item table:

**Generated items.** The generator's declared spec is the source of truth. That spec covers:
- the target;
- the prerequisite vocabulary;
- the number of target opportunities;
- the caps on other demands;
- range, hands and phrase plan;
- the intended role: introduction, repetition, fluency or transfer.

Extraction only validates the output against the spec. A generator family without a declared spec gets one, as its family contract, before its items are classified. Classifying a generated item by detection alone is the weaker path, and is not to be used.

**Imported items (PDMX and repertoire).** Nothing is known in advance:
- every value carries a **confidence and provenance**: exact from the notes, two witnesses agreeing, one witness, inferred, or metadata only;
- duplicate and version clusters are grouped before classification;
- an excerpt is classified as its own item.

## 3. Difficulty is a vector

Store separate components:
- reading;
- rhythm;
- pitch navigation;
- coordination;
- technique: span, leaps, repeated notes, stretches;
- harmonic and cognitive load;
- tempo and endurance.

Derive an overall level only where a rule needs one. A rung's band is stated per component that matters to it: "easy notes, hard rhythm" and "hard notes, easy rhythm" must not land in the same place.

Use the PDMX level estimator (`tools/content/pdmx/index.py`) and any outside graded set (CIPI, PSyllabus) as advisory calibration for the overall level only, never as the rule.

## 4. Sources: the curriculum is the source for rung rules

What a rung asks for is this project's own decision. Its source is the rung's lesson, its taught set, its requirements and its chain record. A rung rule cites those, and needs no outside quote. Outside quoted sources are required only for:
- **musical-pattern definitions**, such as what a habanera, an Alberti bass or a walking bass is;
- **difficulty calibration**.

This removes most of `docs/classifier/generated/research.md` §5. Until a rung's lesson states what it is trying to accomplish clearly enough to write a B clause, that rung stays `UNKNOWN`. Do not invent "X ≥ 7 occurrences" thresholds. Write a threshold only from the rung's own requirement, or from a reference distribution.

## 5. One source of truth per fact

The app's demand detectors (`app/src/demands/detect.ts`, 22 demands) say that no other code defines the same fact. So:
- **A characteristic the app also needs** goes into the demand vocabulary and `detect.ts`. Its second witness is a library reading, partitura or music21, following the rhythm-cell pattern (`cells.py`, `passages.py`).
- **A characteristic only the classifier needs** may live in Python.
- Never two definitions of one fact.

## 6. Generalised extractors, not one detector per concept

286 concept strings do not mean 286 detectors. Group concepts under a small number of general extractors, each returning structured values, not booleans:
- key and mode;
- metre and rhythm vocabulary;
- interval and contour;
- texture and accompaniment figure;
- harmony and chord rhythm;
- phrase and cadence;
- articulation and markings;
- physical gesture.

The 52 "matchers to write" should mostly become parameters of these extractors.

## 7. Genre and track: evidence with confidence, never a single rule

For each style, record evidence: groove, rhythmic cells, swing, accompaniment pattern, harmonic vocabulary and rhythm, form, bass behaviour. Combine that evidence with provenance-weighted metadata. "Tresillo, therefore Latin" is never a rule. A piece can carry a useful blues feature without being catalogued as blues. The matrix's "notes are evidence only" class for tracks is right; extend it to hold that evidence.

## 8. The schema to produce

Extend `characteristics.yaml`. Do not write a new document. Each characteristic gets these fields:
- **pipeline**: generated, imported or both;
- **extractor**: the general extractor it belongs to (§6);
- **current implementation**: file and line, or none;
- **confidence class**;
- **placement question it serves**: A, B or C;
- **which places use it**;
- **missing work**.

`build_matrix.py` checks that every field is present. Its coverage check runs in CI, as the session itself flagged; that is a workflow change, so the reviewer reads it first.

## 9. Order of work (bounded, so value comes before research)

**The point is the owner's question: what can code decide, and what can it not?** Step 1's output is that answer. Step 2 proves the answer's "can" column on real files instead of trusting it. The matrix's first "4 rungs code can decide today" turned out to be an overclaim.

Step 1's deliverable is the can/can't map, read three ways:
- **per characteristic:** the §8 fields;
- **per place** (rung, track, stage, ability): for each of questions A, B and C, one of three states:
  - **decidable by code now**: implemented and witnessed;
  - **decidable with named missing work**: the extractor parameter, or the definition to source;
  - **not decidable by code**: the reason, and what decides it instead (a curated record, a generator spec, or `UNKNOWN`);
- **in total:** the counts of each.

"Decidable now" may be written only after step 2 has run it on real items.

1. **Extend the schema** (§8) and fix the concept mapping:
   - check the 70 not-a-property rows and the 21 ambiguous rows against each rung's lesson text, not the concept names;
   - rename the ambiguous concept ids: "octaves" as keyboard geography versus playing octaves, and the classical versus jazz meanings of "voicing".
2. **Build the item table and run the differential** from what is already measurable (the 67 existing, library and metadata characteristics). Answer A and the countable part of B. The output is an itemised misplacement list, each entry with its deciding clause:
   - untaught demands at the item's rung;
   - integrity failures;
   - difficulty components far outside the band;
   - target absent or present once only.
3. **Apply the clear moves** in reviewed batches, listing where, what, before, after and why for each.
4. **Write a new extractor parameter or a research line only when** the differential shows items whose placement depends on it.
5. **Resume chain work**, with the classifier's A and B verdicts on each chain's items added to the chain preflight.

## What would change this

If the differential in step 2 finds almost nothing misplaced, the placement problem is in the curriculum's own rung goals, not in the items. In that case, rung-goal work comes before any new extractor.
