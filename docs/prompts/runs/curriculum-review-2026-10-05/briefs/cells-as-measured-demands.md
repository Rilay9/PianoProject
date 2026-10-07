# Brief: the habanera and tresillo cells as measured demands (seam CD1; 2026-10-06)

**What governs:** FABLE §2 step 3 (the Bizet / latin.4 slice), §5 and §7 (an independent witness by representation; a library before custom code), §10 (one brief per seam, its finish and stop conditions). Read first: Entry 241 in `docs/pending-review.md`, whose "Stopped" paragraph is why this seam exists.

**FABLE §10 line.** *Learner need:* latin.4 has to be a rung whose claim, "these items carry the habanera and the tresillo", the build can check, so that placement, the generated pair and the later task line rest on a measured fact and not on a title. *Current tool limitation:* the concepts `habanera` and `tresillo` (`content/curriculum/concepts.json:4431`, `:4448`) map to no demand. No detector in `app/src/demands/detect.ts` finds either cell, so `excerpts.py --candidate-rungs` cannot list latin.4 for any item (Entry 241, reason 2). *Smallest capability:* one detector per cell in the existing detector module; one vocabulary entry per cell; one concept mapping; a partitura witness that reads the same files independently. *Concrete consumers:* latin.4's placement (the rung's claims become checkable); G13's checker (`GENERATOR-ADDENDUM.md` `<a id="G13">`, `:356`, which needs the same onset check on its generated pair); the latin.6 and latin.7 task line drafted in Entry 241 (its answer key is the bars where each piece's left hand holds or leaves a cell); A7c.1's record (`docs/chains/A7c.1.yaml:243-246`, whose `checker` and `musical_properties` will cite the witness once G13 lands).

**Not a learner-facing ability brief.** It carries no `ability:` line, no instructional chain, no failure route and no independence test. It is a measurement seam, and its consumers carry those headings.

## Decision rationale (operating-procedure §10b)

1. **Learner problem.** A learner reaching latin.4 should meet items that really carry the two cells, and should never be refused an item because of a rhythm they can already read.
2. **Solution classes considered.**
   - (a) An app detector per cell, with a build-side witness. **Chosen.**
   - (b) A curated passage record only. The excerpt's approved `targets` name the cell, the witness checks it at merge, and there is no app detector. This is the charter's "a real excerpt practises X: curated passage record".
   - (c) No change: latin.4 claims nothing measured, and placement rests on the curated teaching-use record alone.
   - (d) Extending an existing demand (syncopation, or the left-hand pattern) to cover the cells.
3. **Why (a).**
   - The rung-claims machinery reads measured demands only. That machinery is `claims.rung_claims_of`, `status_of`, `teaching_rungs`, `validate.concept_claim_findings` and `excerpts.candidate_rungs`, and it is what latin.4's placement runs through.
   - (b) needs a second claim path through `claims.py`, `validate.py` and the app's question 2. That is more machinery than two detectors. It also leaves the two whole pieces with no claim: Por Una Cabeza and Solace.
   - (c) leaves Entry 241's stop line where it is.
   - (d) is CQ1's broad-flag-for-a-named-figure fault (`docs/prompts/runs/CQ1/decision.md`). It would also break `concepts_naming` (D4 below).
   - The charter gate's answer is **Verify narrowly**: a sourced definition, a structural checker independent of the app's reading, and a near-miss that goes red.
   - This is not CQ2. CQ2 re-admits CQ1's eight figures (`claims.NAMED_FIGURES_AWAITING_A_SOURCED_CHECK`), and neither cell is one of them.
   - The cost: the charter's number 3 (custom musical-semantic code) rises by two detectors and one witness module. No library classifies a rhythm cell; the onset reading itself is a library's on the witness side.
4. **What would reverse it.**
   - If the reviewer rules that a named figure's claim must be a curated passage record (charter table, row 5), (b) replaces (a). The witness module and its tests carry over unchanged; the app detector, the vocabulary rows and D5 are dropped. That is why the witness is built first.
   - If the reviewer rules that a cell is a reading demand of its own, D5 is reversed (see D5 for the cost).
5. **Real problem or proxy.** This is a proxy for part of the need: it establishes what the notes contain. It cannot establish that the learner plays the cell with its feel. The ±150 ms window cannot resolve the cell at speed (`MODE-SHEET.md` §2, "Cannot establish" (ii); `ABILITY-MAP.md:422`), and the seam's skill says so (D4).
6. **Remaining uncertainty.** The exact app counts per item are not known until the build runs. The figures below are a raw estimate, scope stated. The Bizet left-hand cut is a one-staff file, and the model marks it as the right hand (Entry 241, Defects). See D2 and "Could not establish".

## 1. What exists (VERIFIED at the lines, 2026-10-06, this checkout)

**The detectors** (`app/src/demands/detect.ts`):
- Nineteen detector ids (`:39-57`). They read the score model, never the MusicXML, and the module note says nothing else in the tree may define the same fact again (`:1-36`).
- `barStarts` (`:148`) puts a pickup bar where a full bar would have started.
- `metreAt` (`:117`) and `barLength` (`:140`) give a bar's metre and length.
- `ScoreNote.hand` is set from the voice's home staff, so a cross-staff note keeps its hand (`app/src/score/types.ts:34-38`, `extractScoreModel.ts:454`). A one-staff file's notes are all `R`.
- A tie chain is one note (`tiedDurations`), and grace notes are left out (`placed`).

**The vocabulary** (`content/curriculum/vocabulary/demands.json`, nineteen demands):
- Every entry has a `detector`, a `copedWithBy` and a `taughtAt`.
- `validate.py:1415-1426` refuses a `copedWithBy` whose skill does not name the demand in its `opportunity`, unless that opportunity is `every-step`.
- `taught_at_findings` (`:1460`) errors on a listed rung whose concepts do not name the demand, or on two listed rungs on one path. It warns on a derived teaching rung that the list omits.

**Concept mapping** (`tools/content/claims.py`):
- `CONCEPT_DEMANDS` (`:61`).
- `concepts_naming` (`:145`) maps a concept to a demand through that table, or through a skill whose opportunity is that one demand alone. A skill over several demands names none of them.
- `rung_claims_of` (`:263`) turns a mapped concept into a claim.
- `validate.concept_claim_findings` (`:1541`) **fails the build** when a rung's concepts name a measurable demand and no checked option establishes it.

**The coping question:**
- In the app: `eligibilityCore.uncoped` (`:182`) asks `demandsAsked` (`:138`), the row's `demands` less a key signature located nowhere. An uncoped demand makes the item `ineligible` / `untaught` (`:285`).
- The build's twin is `claims.asked_of` (`:373`) with `untaught_on` (`:430`).
- `untaught_options.py` reads the same rows. `tests/test_untaught_options.py:55` pins the app's probe, `docs/prompts/runs/W1b/probe-refusals.txt`: 215 `untaught` lines, 290 lines in all.
- Two more readers of `taughtAt`: the proposer's `excerpt_proposer.untaught` (`:661`) and the test helper `untaughtChecks` (`app/tests/unit/helpers/promises.ts:303`, used by `sightReadingPromises.test.ts`).

**Measurement and evidence:**
- `tools/content/demands.py` keeps no definitions. It runs the app's detectors through `app/tests/unit/demandsOfFiles.test.ts`, and it re-measures every score when a file in `DEFINITION_FILES` (`:145`) changes.
- Per printed bar, `positions` gives the upper-staff and lower-staff counts.
- Density is decided by `content/sources/opportunity-density.json`, one rule per demand, read by `build.established_by_density` (`:520`) and by the app.
- `evidence.ts:205` holds `EVIDENCE_DEFINITIONS = 6`. A demand whose `copedWithBy` skill has a precision is a rhythm demand at its steps (`:485-510`).

**The witness that exists:** `build/probe/cellcheck.py` (gitignored, in this checkout).
- It has two readers: partitura, and a raw ElementTree walk.
- It classifies a staff's onsets per bar, as fractions of the bar, by exact equality with {0, 3/8, 1/2, 3/4} for the habanera or {0, 3/8, 3/4} for the tresillo.
- Its numbers, recorded in Entry 241 with both readers agreeing in every bar:
  - Por Una Cabeza: 56 of 66 bars habanera on staff 2. Printed bars 1-14 are all habanera; the first measure is a pickup numbered 0.
  - The Crave: 27 of 53 bars tresillo, including all of bars 21-26.
  - The Bizet parent `QmVw…`: 85 of 90 bars habanera. The left-hand cut, bars 1-12, is all habanera, with no bar matching the tresillo.
- partitura is pinned at 1.9.0 in `tools/content/requirements.txt`.
- The existing partitura witness test is `tools/content/tests/test_contrary_scales_unison.py`.

**The tresillo exercises:** `make_tresillo` (`generate_exercises.py:5789`) writes eight 4/4 bars per key.
- The left hand plays 1.5, 1.5 and 1.0, so its onsets are {0, 3/8, 3/4} of the bar. The right hand holds a whole-bar chord.
- The exercise is listed on 3.6 and on latin.3.

**Where the concepts are named today:**
- latin.3 and latin.6 name `tresillo`. Neither rung is on the other's path: latin.3 has no prerequisites, and latin.6 stands on `latin` and 4.5.
- ragtime.7 names `habanera`. Its lesson, `ragtime.7.md:25-27`, gives Solace as "built on a habanera rhythm" with the cell spelled out.

## 2. What the seam settles (each with the option not taken)

**D1. The demand ids and their definition (SETTLED).**
- The ids are `rhythm.habanera` and `rhythm.tresillo`, dimension `rhythm`. The detectors are `habaneraCell` and `tresilloCell`.
- Displays: "The habanera rhythm in the left hand" and "The tresillo rhythm in the left hand".
- **Definition:** a bar holds the cell when the left hand's sounded onsets in that bar, as fractions of the bar from its start, are exactly the cell's set:
  - the habanera: {0, 3/8, 1/2, 3/4};
  - the tresillo: {0, 3/8, 3/4}.
- The definition rests on onsets and is independent of the written durations. That is the map's L1 amendment (`ABILITY-MAP.md:419`): Por Una Cabeza writes a quarter, an eighth rest, an eighth, a quarter and a quarter where the doubled cell has a dotted quarter.
- **Source:**
  - the upgrade's cell: "dotted eighth, sixteenth, eighth, eighth in 2/4 … compared with the tresillo (3+3+2)" (`CURRICULUM-UPGRADE.md:21`);
  - Wikipedia's Tresillo and Habanera pages, as secondary sources ("the habanera is the tresillo plus the second main beat", `latin.md:16-17`);
  - CK-5 (`ABILITY-MAP.md:906-909`, block A7c.1 `:408-424`).
- The primary printed habanera, Bizet (IM-3), has now been read by tool: Entry 241's H2.
- **Exact equality is the cross-failure.** A tresillo bar lacks the 1/2 onset, and a habanera bar has one more. A habanera whose sixteenth is tied over the half bar has onsets {0, 3/8, 3/4}, so it reads as a tresillo. That is the definition working, not a defect.
- **Not taken:**
  - a superset or "contains" match, which would make every habanera bar a tresillo bar and kill the cross-failure;
  - one demand for both cells, which cannot tell them apart;
  - a `texture.*` id, which implies a bass role (root and fifth) that the demand does not check. G13's own contract checks the pitches.
- **A stated limit:** in 4/4 the doubled habanera is also the common dotted-quarter, eighth, quarter, quarter bass. The demand records the onsets, never the style. A placement still needs the curated teaching-use record (CK-4).

**D2. The detector (SETTLED; `app/src/demands/detect.ts`).**
- Add two entries to `DETECTOR_IDS` and `DETECTORS`, sharing one private helper. For each unrolled measure:
  - (i) Read the bar only when its metre is 2/4, 4/4 or 2/2. Those are the metres where the published cell (2/4) or its doubled form (4/4 or 2/2, the form the map reads in Por Una Cabeza) is a fraction of the bar.
  - (ii) Never read a pickup bar (`model.pickup` and measure 0).
  - (iii) Take the bar's left-hand notes (`note.hand === 'L'`). Merge chords and voices into their distinct onsets, measured from `barStarts` over `barLength`, and compare with `EPSILON`.
  - (iv) Locate one note per onset, the lowest left-hand note there. A cell bar then locates exactly 4 (habanera) or 3 (tresillo) places, so a density can be written in cells.
- **Not taken:**
  - **staff 2 alone.** It loses a cross-staff left-hand note. For a one-staff left-hand file it reads nothing, as the hand rule does today.
  - **every staff.** By the raw estimate below, 17 one-staff right-hand melodies would carry the doubled habanera, along with the clave lines. 2.2's `exercise.rhythm.dotted-quarter-eighth.4bar` would carry it at a useful density, a dotted-quarter drill claiming the habanera.
  - **any simple or compound metre.** A 3/8 fraction of a 3/4 bar has no published cell, and in 6/8 the 3+3 is the beat itself.
  - **a half-bar reading of 4/4,** two 2/4 cells per bar. CK-5 and G13 define the set on the bar, and no named consumer needs it.
  - **every note of a chord located.** Counts would then depend on the voicing.
- A whole bar of sixteenths grouped 3+3+2 by accent, like the secondary rag in *Elite Syncopations* (`ragtime.7.md:36-38`), sounds every sixteenth. It is no tresillo by onsets, and a test says so.
- **One-staff left-hand cuts:** the model marks the Bizet cut's notes `R` (Entry 241, Defects; brief DF2 item (2), `cutter-carries-the-tempo.md`). Until the model marks a one-staff left-hand item's notes `L`, this detector finds no cell in that cut. This seam does not change the model.

**D3. The build-side twin: the independent witness (SETTLED; new `tools/content/cells.py`).**
- **Promote** the probe's partitura reader.
- `bar_cells(path, staff=2)` returns, per printed bar, the bar's index in order and its MusicXML `number`, the onset fractions and the cell (`habanera`, `tresillo` or none). It applies the same metre rule and pickup rule as D2. Onsets are measured from the bar's start over the time signature's full bar, notes are tie-merged (`notes_tied`), and grace notes are left out.
- `staff` is the caller's choice, so the witness reads a one-staff left-hand cut with `staff=1`. The caller knows the hand from the catalogue's `hands`.
- A file with more than one part is refused with its reason, never read as "no cell". The four named files are one part each (checked here).
- **Independence:**
  - The app reads OpenSheetMusicDisplay's parse through `extractScoreModel`. The witness reads partitura's parse of the same bytes, and the two share only the file.
  - music21 wrote the tresillo exercises and is never their witness: no read-back.
  - The cell sets are stated twice on purpose, in `detect.ts` and in `cells.py`, each from the cited definition. An oracle that imported the app's constants would not be independent. The sourced fixtures and the differential (tests T5 and T6) are what hold the two statements equal.
  - The witness never writes a demand, a claim or a catalogue field. The build still reads only the app's measurement (`demands.py`'s rule), and `cells.py`'s docstring says why it is not a second definition.
- **Not taken:**
  - committing the raw ElementTree walk. That would be a third reader of custom XML code. Its one job in the probe was checking partitura's tie merge, which T5's tie fixture now does.
  - music21. It is the generator's own library.

**D4. The vocabulary entries (SETTLED).**
- **`demands.json`:** two rows as in D1. `copedWithBy` is `habanera-and-tresillo`. `taughtAt` is set as in D6, and `notAsked` as in D5. The schema gains the optional `notAsked` string (minLength 10) with its description, and `Demand` in `app/src/demands/vocabulary.ts` gains `notAsked?: string`.
- **`skills.json`:** one new skill, `habanera-and-tresillo`:
  - `newId: true`; kind `rhythm`; opportunity `["rhythm.habanera", "rhythm.tresillo"]`; observable `none`; no precision; standards `{practice: [], full: []}`; no `transfer`;
  - display "The habanera and the tresillo";
  - `unobserved`: the cell's identity at tempo (the ±150 ms window, `MODE-SHEET.md` §2 (ii)), and telling the two apart by ear, which is self-checked (A7c.1's `never_credits`).
  - The schema requires a `copedWithBy`, and this skill is what makes "no run is evidence of the cell" a vocabulary fact.
  - **Not taken:**
    - `syncopation`. Its opportunity would become three demands, so the concept `syncopation` would stop naming `rhythm.syncopation` in `concepts_naming`, and the teaching-rung derivation for syncopation would empty silently.
    - `subdivision`. The 4/4 tresillo's dotted quarters would become subdivision opportunities at a precision of 1/6 beat, which changes evidence for a skill the cells do not teach.
    - two skills named `habanera` and `tresillo`. Those turn concepts into abilities that a requirement could name.
- **`opportunity-density.json`:** two rules, each **derived from the calibration set in D4a** and written only after the calibration record exists. No threshold is chosen by hand, and none is marked `hypothesis: true` in place of a calibration (FABLE §5; `responses/530963de.md` §2).
  - Neither demand is added to `tempoSensitive`. The speed of the cell's notes is already carried by `rhythm.sixteenths` and `rhythm.shorter-than-quarter`.

**D4a. The density calibration, before the rules are written (SETTLED; the reviewer's required change).**

**Declared positives: the teaching cases each rule must keep.** Each is an item a lesson or the A7c.1 record uses to teach the cell, and is read whole.
- Tresillo:
  - `exercise.tresillo.c`, `.f` and `.g`, the controls on latin.3 and 3.6;
  - The Crave, which `latin.6.md:22-26` teaches as "the tresillo under a whole piece".
- Habanera:
  - Por Una Cabeza: latin.6's MUSIC station, and its bars 1-14 are the map's MODEL;
  - Solace, which `ragtime.7.md:25-27` teaches as "built on a habanera rhythm";
  - the Bizet parent `song.classical.bizet-l-amour-est-un-oiseau-rebelle.pdmx`, which A7c.1's step "Sees and hears the habanera bass under Carmen's tune" plays (`docs/chains/A7c.1.yaml:111-113`).

**Declared counterexamples: they share the onset mask, or come near it, and must not become establishment.**
- Habanera:
  - *Auld Lang Syne* (anonymous edition, two staves, on 4.6 and holiday.5): a folk dotted-quarter bass, the doubled cell by onsets only;
  - Schumann's *A Little Romance*, Op. 68 No. 19;
  - *Sans* (Undertale).
- Tresillo:
  - *All of Me* (John Legend);
  - *Apex of the World* (Fire Emblem);
  - *Mr Blue Sky*.
- At the detector, where they must carry neither demand at all: every `exercise.clave.*` and `exercise.latin-groove.*` item (the cell is in the right hand), and `exercise.rhythm.dotted-quarter-eighth.4bar` (one staff, right hand).

**Undeclared items.** Every other item D8 lists is reported with its result and is neither kept nor rejected by declaration. These include *Carioca*, El Choclo, La Cumparsita (Rodríguez) and Heliotrope Bouquet.

**The rule form.** The density file's own form is `min` located places AND `perBar` located places per bar. With D2's one place per onset, located places are cells × 4 for the habanera and cells × 3 for the tresillo. The values are read from the app's measured build: `measurement.located` and the row's measures. The raw estimate is never used.

**The derivation is fixed in advance, so nothing is tuned.**
- For each cell, the rule is the strictest one that keeps every declared positive:
  - `min` is the smallest `located` among the positives;
  - `perBar` is the smallest located-per-bar among the positives, rounded down at the second decimal.
- That rule is then checked against every declared counterexample.
- If any counterexample would be established, no density rule separates the declared cases. The property stays **UNKNOWN**: the rule is not written, the lane stops, and the record says which case crossed. The positives are never re-declared and the counterexamples never dropped.
- **Not taken:**
  - the most lenient separating rule. It would let an undeclared onset coincidence establish wherever the counterexamples happen not to reach.
  - choosing a value inside the separating interval by judgement.

**Excerpts (`minInWindow`).** No cell excerpt is in the catalogue: the Bizet cut is held, and the Por Una Cabeza and The Crave cuts are latin.4's. The window rule therefore has no declared positive to calibrate on.
- For both demands it is written as `minInWindow` = `min`. The density file never allows it above `min`.
- No four-to-fourteen-bar excerpt can then establish a cell by density. Its cell claim rests on its curated approval record, with `targets` checked by the witness: the reviewer's route 2.
- latin.4's placement seam calibrates the window rule on its own declared excerpts.
- If the schema or `validate.py` refuses `minInWindow` equal to `min`, stop and report. Never invent a smaller value.

**By the raw estimate, a rule separates** (HYPOTHESIS; the app's numbers decide):
- Habanera: positives Por Una Cabeza (56 cell bars, 3.5 places per bar), Solace (49, 2.2) and the Bizet parent (85, 3.8). That gives `min` about 196 and `perBar` about 2.2.
  - *Auld Lang Syne* (12 bars, 2.4 per bar) is rejected by `min` alone, because its share of cell bars is above Solace's.
  - Schumann (6 bars) and *Sans* (4 bars) are rejected.
- Tresillo: positives the controls (8 bars, 3.0 per bar) and The Crave (27, 1.53). That gives `min` about 24 and `perBar` about 1.53.
  - *All of Me* (24 bars, 1.29 per bar) is rejected by `perBar` alone, a narrow margin.
  - *Apex of the World* (30 bars of 200) is rejected.
- **The consequence, stated:**
  - Shorter genuine pieces stay unestablished, reported as undeclared: *Carioca* (22 of 78 bars).
  - A latin.4 excerpt establishes nothing by density in this seam.

**The record.** The builder writes `docs/prompts/runs/CD1/calibration.md` with:
- one row per declared and undeclared item: cell bars, `located`, measures, per bar, and the verdict;
- the derived rule;
- each counterexample's margin.

Each rule's `why` cites that file. Each rule carries a `calibratedBy` note in the row's `why` naming the positives, never `hypothesis: true` alone.

**D5. The coping question does not ask the cells (SETTLED for review; the main reversal point).**
- **The rule:** a demand with `notAsked` is left out of the demands the coping question asks. That applies in four places:
  - `eligibilityCore.demandsAsked` in the app;
  - `claims.asked_of`, the build's twin, through one helper both readers share;
  - `excerpt_proposer.untaught`;
  - `untaughtChecks` in `app/tests/unit/helpers/promises.ts`.
- **The reason, written into both rows** (the reviewer's, `responses/530963de.md` §3):
  - The demand is a descriptive structural fact. It is used for claims, placement evidence and content verification.
  - The difficulties it is made of are already gated by the ordinary reading demands (the dotted quarter, eighths, sixteenths and shorter notes, syncopation) and by the rung's explicit prerequisites.
  - The item may itself be the material that teaches the cell. Asking whether the learner has already coped with the cell would circularly refuse the teaching example.
  - Raw onset coincidences in unrelated music must not become new learner-facing refusals.
  - The key-signature case stays narrow. This is a second explicit exception, declared in data per demand with its reason, and not a generic rule that a mapped or located demand may be ignored.
  - The app does teach the cell's order. The exception does not say the pattern need not be taught.
  - **A known gap, recorded and not fixed:** a 2/4 tresillo's dotted eighths are asked only as notes shorter than a quarter (2.2). No demand reads a dotted eighth.
- **Not taken:** asking the cells like any other demand. By the raw estimate below, that newly refuses about **17 rung-own options at their own rung**, among them:
  - `exercise.tresillo.c` on 3.6, its own home;
  - Por Una Cabeza on latin.6;
  - Solace's tresillo bars on ragtime.7;
  - Auld Lang Syne on 4.6 and holiday.5;
  - All of Me on chords-pop.6;
  - El Choclo on latin.7.

  The untaught-options table and its pin would grow by those lines. That would add learner-facing refusals on an onset inference: the charter's number 2.
- **The existing guard stays exact:** the key-signature rule is not widened (test-map row 33). A demand located nowhere is still asked, as before. The new rule is declared per demand in data, with its reason, and only these two rows carry it.

**D6. The concept mapping and `taughtAt` (SETTLED).**
- `CONCEPT_DEMANDS` gains `"habanera": "rhythm.habanera"` and `"tresillo": "rhythm.tresillo"`, with a comment citing this brief, CK-5 and the witness. Neither concept is shared with another demand, so `excerpts.concepts_for`'s shared-demand guard is untouched.
- **`rhythm.tresillo`** `taughtAt: ["latin.3", "latin.6"]`. These are the derived teaching rungs, one per path. The `taughtAtNote` cites `latin.3.md:36-38` ("the clave's first half … three, three, two") and `latin.6.md:22-26` (The Crave). It also says latin.6 leaves the list if a later seam puts latin.3 on latin.6's path, because `validate.py` then errors "one teaching rung per path".
- **`rhythm.habanera`** `taughtAt: ["ragtime.7"]`, the derived rung. The note cites `ragtime.7.md:25-27` and says the new latin.4 joins the list in its own placement seam. latin.4's path (4.4, latin.3 and the core) does not reach ragtime.7, so the list stays one rung per path.
- **The consequence:**
  - latin.3, latin.6 and ragtime.7 each gain a measured claim, which `concept_claim_findings` now enforces.
  - These claims are acceptable only after D4a's calibration shows that the options establish them under the rule it derives (`responses/530963de.md` §4).
  - `exercise.tresillo.c`, The Crave and Solace are declared positives, so they hold if a rule exists. If D4a ends UNKNOWN, these claims cannot be kept and the lane stops. It never lowers a threshold, never moves a concept to `introduces`, and never re-declares a case.
  - latin.4's claim becomes checkable: test T9.
- **Not taken:** `taughtAt: []` with a note. The build would then warn "a teaching rung taughtAt omits" at all three rungs, and the record would say nothing teaches a cell that two lessons explain.

**D7. The evidence version (SETTLED).**
- `EVIDENCE_DEFINITIONS` becomes 7, with its `- **7**` note.
- Every vocabulary demand is located on every run (`locateDemands`). A run on a cell-bearing item therefore gains per-demand entries and `otherDemands` entries for the cells. Rows stored under 6 lack them and must wait for the recompute job, as every earlier bump did.
- No skill's own `n` or `right` changes: the cells' skill is observable `none` and has no precision.
- **Not taken:** no bump. Stored rows on Por Una Cabeza, The Crave and the rest would silently lack the cells, and the recompute job would never refresh them.

**D8. Which shipped items carry each demand, by estimate (HYPOTHESIS).**
- **Scope of the estimate:**
  - the probe's raw reader over the 2013 built score files that it could parse, out of the catalogue's 2092 entries;
  - staff 2 only, standing in for D2's left hand;
  - bars in 2/4, 4/4 and 2/2;
  - not the app's model.
- The build's own measurement replaces this table. The builder records the app's list, with per-item bar counts, in the entry.
- **`rhythm.habanera`:** present in 26 items; established in 7:
  - Por Una Cabeza: 56 of 66 bars, on latin.6;
  - the Bizet parent: 85 of 90, unlisted;
  - Solace: 49 of 88, on ragtime.7;
  - Nazareth's *Carioca*;
  - Schumann's *A Little Romance*;
  - *Sans* (Undertale);
  - *Auld Lang Syne* (anonymous edition): 12 of 20, on 4.6 and holiday.5.

  It is present without density in El Choclo (latin.7), La Cumparsita (Rodríguez) and seventeen others.
- **The Bizet left-hand cut** (bars 1-12, all habanera by the witness) carries nothing in the app until D2's one-staff caveat is resolved.
- **The Bizet cut is content evidence only.** It is not used as app-side proof, placed on latin.4 or treated as learner-ready until the one-staff hand seam (HD1, `briefs/declared-hand-into-the-model.md`) lands. The witness reading it with `staff=1` is content evidence only, never a sign that the app sees the same hand.
- **The surprising matches are not evidence.** Unrelated songs that share the onset mask are adversaries for D4a, never style or teaching-use evidence (`responses/530963de.md` §4).
- **`rhythm.tresillo`:** present in 19 items; established in 5:
  - `exercise.tresillo.c`, `.f` and `.g`: 8 of 8 each;
  - The Crave: 27 of 53, on latin.6;
  - John Legend's *All of Me*: 24 of 56, on chords-pop.6.

  It is present without density in Heliotrope Bouquet and Solace (ragtime.7), Lullaby of Birdland (jazz.9) and eleven others.
- **The clave items carry neither cell.** The three-side of son clave is the tresillo's onsets, but it is written for the right hand, and D2 reads the left.

**The untaught-options table and its pin.**
- Under D5 the cells never reach the coping question, so the table should be unchanged.
- Re-run the probe at the new head by the recipe in `tests/test_untaught_options.py`'s docstring.
- **Expected:** equal to `W1b/probe-refusals.txt` line for line, with 215 `untaught`.
- Record the re-run, its path and its count in the entry. Leave `PROBE` pointing at W1b's file when the two are equal.
- A difference is a stop line. It is never forced equal, and never re-pinned to pass.

## 3. Acceptance tests (each red first where the code does not exist yet)

**Build order:**
1. The witness (T5-T7), because it survives the main reversal (rationale 4).
2. The detector and the vocabulary, without the density rows.
3. The differential.
4. D4a's calibration on the app's measured build, and its record.
5. Only then the two density rows (T11).

What T1 and T5-T7 prove is that the classification is consistent, never that the density suits teaching.

**T1. `app/tests/unit/demandDetectors.test.ts`:** a `describe` per cell, on hand-made phrases (`helpers/phrase.ts`).
- **Present:**
  - the 2/4 cell as the upgrade writes it;
  - the doubled 4/4 cell;
  - Por Una Cabeza's written form: a quarter, an eighth rest, an eighth, a quarter, a quarter;
  - The Crave's tresillo: dotted quarter, dotted quarter, quarter.
- **Absent:**
  - straight eighths;
  - the dotted-pair near-miss, onsets {0, 3/8, 1/2, 7/8};
  - the same cell in the right hand only;
  - a 3/4 bar and a 6/8 bar holding the same fractions;
  - a pickup bar;
  - a bar entered by a tie from the bar before;
  - the secondary rag's eight sixteenths.
- **Boundary:**
  - **the cross-failure:** every tresillo bar is not a habanera bar, and the reverse;
  - the habanera with its sixteenth tied over reads as a tresillo;
  - a left-hand chord counts one onset and locates its lowest note;
  - a cross-staff left-hand note on staff 1 counts;
  - grace notes are ignored;
  - a habanera bar locates exactly 4 places and a tresillo bar 3.

**T2. `app/tests/unit/vocabulary.test.ts`:**
- the two demands' detectors exist;
- `habanera-and-tresillo` is observable `none` with an `unobserved` reason and `newId` set;
- `notAsked` is on exactly these two rows.

**T3. `app/tests/unit/copingQuestion.test.ts`:** a new class.
- An item whose row carries `rhythm.habanera` and `rhythm.tresillo` is never refused for them: judged at 2.2 with nothing taught, and at latin.6.
- A demand located nowhere other than the key signature is still asked (the class-1 guard, unchanged).

**T4. `app/tests/unit/evidenceByDemand.test.ts`:**
- a cell phrase's evidence lists the cells where C4a's per-demand rules put them;
- `EVIDENCE_DEFINITIONS` is 7;
- on a fixed phrase, every skill's `n` and `right` are equal to their values before the change, recorded in the test.

**T5. `tools/content/tests/test_cells.py`, new: the witness on hand-written MusicXML fixtures** under `tools/content/tests/fixtures/cells/`, never written by music21. The same cases as T1, read by partitura, including the tie merge and the cross-failure. A two-part fixture is refused with its reason.

**T6. `test_cells.py`: the real calibration on the built files.** The witness's staff-2 counts, pinned:
- Por Una Cabeza: 56 of 66 habanera, with MusicXML measure numbers 1-14 all habanera. Mind the pickup numbered 0: the bridge's `positions` count the pickup as bar 1.
- The Crave: 27 of 53 tresillo, including 21-26.
- `exercise.tresillo.c`, `.f` and `.g`: 8 of 8 tresillo, 0 habanera.
- The Bizet parent `QmVw…`: 85 of 90 habanera.
- No bar is classed as both cells in any of them.

**T7. `test_cells.py`: the differential.**
- For each T6 file and for Solace, the app's per-printed-bar lower-staff `positions` must equal the witness's bars. The app's figures come from `demands.measure_opportunities`, the build's bridge to the app.
- A disagreement fails with the bars named, and it is never resolved by editing one side to match the other.

**T8. `tools/content/tests/test_taught_at.py`:**
- each cell's `taughtAt` equals `claims.teaching_rungs`'s derivation, with no new E0b warning;
- `asked_of` leaves out a `notAsked` demand: the twin of T3.

**T9. `test_cells.py`: the latin.4 consumer.**
- A constructed curriculum injects a latin.4, the probe's `build/probe/candidate_latin4.py` shape: concepts `habanera` and `tresillo`; prerequisites 4.4 and latin.3.
- `claims.rung_claims_of` gives both demand claims.
- `status_of` is `established` for Por Una Cabeza (habanera) and for The Crave and `exercise.tresillo.c` (tresillo).
- No file is changed and nothing is placed.

**T11. `tools/content/tests/test_cell_density_calibration.py`, new: the calibration, read from the built catalogue.**
- The two density rows equal the rule D4a derives from the declared positives. The test recomputes the rule: smallest `located`, and smallest per bar rounded down at the second decimal.
- Every declared positive is `established`. No declared counterexample is.
- Every clave, latin-groove and dotted-quarter-drill item carries neither demand.
- `minInWindow` equals `min` for both demands.
- **Boundary cases:**
  - the same rule with `min` one cell above the weakest positive, or `perBar` 0.01 above it, loses that positive (red on tighter);
  - the rule with `perBar` at or below the strongest counterexample's establishes that counterexample (red on looser).
- The declared lists live once, in this test, copied from D4a, and `calibration.md` cites them.

**T10. Existing suites, green without editing their expectations:**
- `tools/content/tests/test_validate_claims.py`: latin.3, latin.6 and ragtime.7 claims are established on the shipped build.
- `tools/content/tests/test_named_figure_containment.py`: the eight stay unmapped.
- `tools/content/tests/test_untaught_options.py`: the pin re-run, as in D8.
- `tools/content/tests/test_excerpt_proposer.py`, extended: the proposer does not count a `notAsked` demand as untaught.
- `app/tests/unit/sightReadingPromises.test.ts`: through `untaughtChecks`.
- `app/tests/unit/demandsOfFiles.test.ts`: the count of vocabulary demands, if it pins one, moves from nineteen to twenty-one, with the reason.

**Checks:**
- the app unit suite;
- `tsc -b --noEmit` (never `-p`);
- the content pipeline tests;
- one full content build, which re-measures every score because `detect.ts` and `demands.json` are in `DEFINITION_FILES`. Expect a long run.

**Mutants** (record each in `docs/prompts/runs/CD1/mutants.txt`, with the test that goes red):
- **M1:** subset instead of equality. Red: T1's cross-failure and T5.
- **M2:** fractions over the beat instead of the bar. Red: the doubled 4/4 in T1, and T6 on Por Una Cabeza.
- **M3:** every staff instead of the left hand. Red: T1's right-hand-only case.
- **M4:** the `notAsked` filter dropped in `demandsAsked`. Red: T3.
- **M5:** the tresillo `perBar` lowered to *All of Me*'s value. Red: T11's counterexample check (a looser threshold).
- **M6:** the habanera `min` raised by one cell above Solace's. Red: T11's positive check (a tighter threshold).

`docs/08-test-map.md` updates its row 58 (vocabulary v0 and the demand detectors) and row 33 (what the coping question asks) to name these tests.

## 3a. Decision after the 33497357 ruling (the orchestrator, 2026-10-06): route 2 for both cells; no density rule

The reviewer's route 2 is taken for the tresillo and, by the orchestrator's decision, for the habanera as well. **No `opportunity-density` row is written for either cell**, with no sentinel and no `hypothesis: true`; the detectors remain exact presence and location facts, independently witnessed by `cells.py`, and establishment comes from two proofs only: the generated family's contract for the CONTROL items (`established_by_contract` once the detector and the witness agree on them), and a first-class, staleable verified passage fact for a MODEL or TRANSFER passage (file identity + exact printed bars + hand + demand id + detector and witness definition and version), counted by `claims.status_of` and `concept_claim_findings` only for the exact item, rung and passage it proves. Passages: the Bizet left-hand cut's bars 1-12 and the parent's bars 1-12 (A7c.1), Por Una Cabeza's printed bars 1-14 (latin.6; the map names them all-habanera), The Crave's bars 21-26 (latin.6, tresillo), and Solace's passage as ragtime.7's lesson names it (if the lesson names none, ragtime.7's claim stays unestablished and says so). Reason: the Bizet chain needs exactly those two proofs and no density rule (FABLE §2's last line: machinery only when a named current item needs it); one claim mechanism for both cells keeps the placement path uniform; the density numbers were measured through the wrong hand model and would need recalibration after HD2 for no consumer; arbitrary-score detection stays advisory (the charter). Option not taken: the habanera on a recalibrated density rule, two mechanisms for one kind of claim. What reverses it: a later named consumer with a predeclared calibration that separates its cases, added then. D4's density bullets and T9/T11/M5/M6 as density tests are superseded by this section; the calibration record stays as evidence of the falsification.

## 4. What the seam does not do

- No generator: G13's `cell` and `timeSig` parameters and the interval-spelling edit are G13's.
- No latin.4 placement: no stage-4 unit, no `latin.4.md`, no `prerequisites` edit, no rung lists.
- No lesson text, and no latin.6 or latin.7 task line.
- No change to the model's hand rule for one-staff files (DF2 item (2)), the cutter, the Bizet approval row, or the A7c.1 record.
- No change to the eight CQ1 figures.
- No change to any other demand's detector, density or `taughtAt`.

## 5. Finish and stop

**Finish condition:**
- T1-T11 green; M1-M6 red;
- the full build green on the whole catalogue;
- the pin re-run recorded;
- `docs/prompts/runs/CD1/calibration.md` written before the density rows;
- a draft entry for `docs/pending-review.md` (where, what, before, after, why) listing the app's measured items per cell with bar counts, and replacing D8's estimate.

**Stop, and report without working around it, when:**
- T7 disagrees on any bar of a named file;
- `concept_claim_findings` fails latin.3, latin.6 or ragtime.7. Never move a concept to `introduces`, and never lower a density, to pass.
- the re-run pin differs from W1b's lines. Never re-pin to pass.
- D4a finds no rule that keeps every declared positive and rejects every declared counterexample. The property stays UNKNOWN, with the record.
- `minInWindow` equal to `min` is refused by the schema or by the validator.
- A claim passes only by weakening a threshold. Never lower a threshold because the claim check is red.
- `sightReadingPromises` or any suite not named above goes red for a reason this brief does not state.

## Files owned

- `app/src/demands/detect.ts`, `app/src/demands/vocabulary.ts`;
- `app/src/curriculum/eligibilityCore.ts`: `demandsAsked` only;
- `app/src/evidence/evidence.ts`: the version constant and its note only;
- `content/curriculum/vocabulary/demands.json`, `demands.schema.json`, `skills.json`;
- `content/sources/opportunity-density.json`: two rules;
- `tools/content/claims.py`: two `CONCEPT_DEMANDS` rows, the shared not-asked helper and `asked_of`;
- `tools/content/excerpt_proposer.py`: `untaught` only;
- the new `tools/content/cells.py` and its fixtures;
- the tests named in §3, and `app/tests/unit/helpers/promises.ts` (`untaughtChecks` only);
- `docs/08-test-map.md`: two rows;
- `docs/prompts/runs/CD1/`;
- the built content the build writes.

**Harness:** `operating-procedure.md` §14. One Playwright at a time; none is needed here. The content build and the quarry never run at the same time. Copy `build/probe/` from the main checkout into your worktree's `build/` before you start. No commit, push, stash, checkout or reset, and never name an AI model.

## Could not establish (for the orchestrator)

- **The Bizet cut is not readable by the app yet.** The detector cannot read the Bizet left-hand cut until the score model marks a one-staff left-hand item as the left hand. Whether DF2's item (2) will do that in the model, or only in the render report, is open. Until then latin.4's claim on that cut rests on the witness (`cells.bar_cells(cut, staff=1)`), and the app measures it on Por Una Cabeza, The Crave and the tresillo exercises.
- **D8's counts are an estimate.** They come from a raw reader, not the app's model. Whether a separating rule exists (D4a) is known only from the app's measured build. The tresillo margin is narrow: The Crave at about 1.53 places per bar against *All of Me* at about 1.29.
- **D5 changes a reviewer ruling.** It extends a ruling the reviewer made narrowly (the key signature alone, L120b), so it needs the reviewer's word before dispatch.
- **Nothing here has been heard.** The cells are established as onsets only: unverified as music.
