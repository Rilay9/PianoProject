# The charter's disposition pass (one pass, 2026-10-03)

This pass applies `docs/prompts/charter.md`'s gate to the authority mechanisms already known:
**Keep / Delegate / Curate / Verify narrowly / Advisory only / Unknown**.

**What it draws on.** No new audit was run. It uses:
- the reuse census (`docs/prompts/runs/CT1/reuse-map.md` on `claude/content-truth`, §9);
- CQ1's consumer trace (`docs/prompts/runs/CQ1/decision.md`);
- the CT1 handback (`claude/content-truth:docs/prompts/runs/CT1/HANDOFF.md`);
- the backlog rows cited.

**The base:** `63d9567`.

**The last column** is the work this disposition retires. A blank cell means none.

## By the charter's eight responsibilities

| Responsibility | Mechanism today (file) | Disposition | Work this deletes |
|---|---|---|---|
| **MusicXML interpretation** | OSMD parse → `extractScoreModel.ts`; regex readers `tempoFromXml.ts`, `harmony.ts`, `toPartwise.ts`; Python `convert.py` over music21 | **Keep** OSMD and music21. **Delegate** `toPartwise` to the W3C `timepart.xsl` only if a parity check passes. `tempoFromXml` **Keep** (it works around OSMD) | Any rewrite of the score model |
| **Interval and key facts** | `detect.ts` (13 notation detectors); seven hand key-name functions in `tools/content`; the browser key estimate `import/midi/key.ts` (a port of music21's Aarden–Essen) | Detectors: **Keep**, with music21 parity at build only where a disagreement is reported. Key names: **Delegate** to music21 (one function). Browser key estimate: **Keep** | A detector-by-detector audit; a "replace all with music21" wave |
| **Chord facts** | `harmony.ts` `KINDS` (20 kinds; unlisted ones are matched on a major triad, `:137`); `theory.ts` tables; never identified from notes | `KINDS` fallback: **Unknown**: an unlisted kind claims no match, rather than a wrong triad. Tables: **Keep** until a defect is shown (Tonal is the candidate). Chord identification: **Unknown**, so nothing claims it | Building chord or Roman-numeral detection |
| **A rung teaches X** | Lesson `concepts` → `claims.py` `CONCEPT_DEMANDS` and the rung-claims report; `demands.json` `taughtAt` (hand-set) | **Curate**: `taughtAt` and the lesson concepts are the record. Derived "established" claims stay a report, never authority. CQ1 removed the eight named-style bridges | Re-deriving rung claims through detectors |
| **A generated drill contains X** | The generator's own tables (`generate_exercises.py`, 57 families); `family_contracts.json`; the measured demands | **Verify narrowly**, but only for a family a learner flow needs, by a checker independent of the generator. Spelling through `up()` / `SEMITONE_INTERVAL` (`:3480`) is checked independently only where a family is used | Rewriting 57 families; `study.py`'s grammar (retire, unless a flow needs it) |
| **A real excerpt practises X** | Detector inference over excerpts (`excerpts.py`, `excerpt_proposer.py`) | **Curate**: one passage record per teaching claim. Detectors only **find candidates (Advisory only)** | Matcher research per style (CQ2+ as planned) |
| **An imported score contains X** | `importStore.measureImport` → `detect.ts` → `usefulDensity` | **Advisory only**: it may restrict offers, and it grants no teaching claim and no credit | Making the detectors reliable on arbitrary imports |
| **MIDI note and timing performance** | `PracticeEngine`, `Scoring.ts`, `evidence/*` | **Keep** (measured). Thresholds stay stated hypotheses | Pass and master threshold research |
| **Musical quality and style mastery** | `sightReadingScore.ts`, `musical_evaluator.py` (candidate ranking); the skill ladder's "mastered" | Never automatic credit. **Unknown** to the learner; the ranking stays internal | Quality scorers presented as judgement |

## The live mechanisms named in the CQ1 record (D1–D3)

| Mechanism (file) | Disposition | Work this deletes |
|---|---|---|
| `texture.left-hand-pattern`: `leftHandPattern` (`detect.ts:514`). It grants "practises", transfer (`transfer.ts:82`) and hand-independence opportunity (`skills.json`); two-hand scales, arpeggios and inversion drills read positive on golden models | **Advisory only**: it may keep items out before 3.6 (`taughtAt`) and grants nothing. `pending-detect.patch` stays unapplied | An accompaniment-detector rebuild |
| `texture.walking-bass`: `walkingBass` heuristic; display "A walking bass"; E22's stride and clave misreads | **Advisory only**, the same way: it restricts and never certifies the named style | A walking-bass matcher, unless a learner flow needs one |
| `session.ts:2754` (`clef.bass` keyed on named concepts), and the review pick `due[seed % len]` at `:446`/`:1490` | **Keep**, in CL12a's lane. Reported, not touched here | |

## What this leaves, against the charter's four numbers

1. **Responsibilities owned that should not be.** Four:
   - broad accompaniment certifying;
   - walking-bass certifying;
   - the chord-kind fallback;
   - hand-written key names.

   Each has a disposition above.
2. **Learner-facing decisions on unsupported inference.** Two:
   - the "practises" offers and the transfer through the two texture demands;
   - the major-triad match for unlisted chord kinds.
3. **Custom musical-semantic code where a library serves.** The seven key-name functions
   (music21); `toPartwise` (W3C XSLT), only if parity holds.
4. **Core learner flows unfinished.** Not assessed here; the charter's "back to the product"
   list owns it.

**Proposed first three changes**, for review. None adds a mechanism.
1. **Make the two texture demands restrict-only.** They keep `measurement.demands` for the
   gate and are never listed as `established`.
2. **`harmony.ts`: an unlisted `<kind>` claims no chord match.** Today it claims a major
   triad.
3. **One music21-backed key-name function** replaces the seven hand copies, behind a parity
   test on the catalogue.

**Not implemented.** Nothing is built until this table is reviewed.
