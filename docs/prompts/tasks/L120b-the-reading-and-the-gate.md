# L120b — The reading and the gate: the detectors read 3/8 as simple triple, a key signature that alters no sounding note is not asked on the coping question, written sixteenths in 3/8 stay sixteenths, and before 1.5 a skip wholly inside a taught five-finger position is coped with by the note reading that position taught, never by awarding interval reading (the reviewer's classes 1 and 2 on L120a; `responses/0bcd3be0.md`)

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13; `docs/review/responses/0bcd3be0.md` (on origin: `git show origin/claude/piano-teaching-app-bo19td:docs/review/responses/0bcd3be0.md`; approve L120a; Question 1, *a skip inside a taught five-finger position*: keep the material fact, do not change the detector, do not move `taughtAt`, add an alternate-support rule with four adversaries — *a gate/support-model correction, not a claim or placement correction*; Question 2 A, B and C: a key signature with no affected sounding location is not a required coping demand, the notation fact stays; 3/8 is a detector error, fixed at the reading; `SIXTEENTHS_IN_THREE_EIGHT` overturned; *L120b sequencing* items 1–2 and *re-run the table after each class*); `docs/prompts/tasks/L120-untaught-readings-at-their-truth.md` and its **Ruled 2026-09-29** section (incidental is asked; no escape hatch; the order *material reading → teaching ownership → placement*; *the validator's warning is L120b's*); `docs/prompts/entry-149.md` (what L120a built: the table, the A readings, the 19 skip pairs, the pin and its snapshot, follow-ups P2–P3); `docs/prompts/runs/L120a/untaught-options.txt:10-43` (the summary and the per-demand counts: A 14 = `key.signature` 6, `rhythm.sixteenths` 3, `pitch.ledger` 3, `metre.compound` 2; `interval.skip` 19); `docs/prompts/backlog-2026-09-25.md:389` (L124: the pin is a snapshot, re-run the kept probe and record the difference; a runtime reading row needs the app's reading or a recorded exception before the validator reads the table).

The code, at the lines this brief read (local HEAD `ee481854`, origin `a52c6165`):

- **The compound reading.** `app/src/demands/detect.ts:121-124` (`isCompound`: `beatType === 8 && beats % 3 === 0`, commented "the generator's own rule, 3/8 included"); `:126-129` (`beatLength`, which `dottedQuarters` reads at `:346` and `syncopation` at `:367`); `:393-400` (`compoundMetre`, "3/8 by the same rule"); `:10-11` (no other module may define a detector's fact again). The model carries no grouping fact: `app/src/score/types.ts:160-165` (`TimeSignatureEntry` is `atMeasure`, `beats`, `beatType`). The test that pins the old reading: `app/tests/unit/demandDetectors.test.ts:186-199` ("boundary: 3/8 counts as one compound beat"). The same 3/8-inclusive rule elsewhere: `tools/content/excerpt_proposer.py:594-595` (the proposer's prediction of what a cut measures as), and the generator's and importer's own copies `app/src/engine/readingControls.ts:87`, `app/src/engine/sightReading.ts:659`, `:684`, `:1929`, `app/src/engine/sightReadingScore.ts:123`, `app/src/import/midi/readMidi.ts:78`, `tools/content/musical_evaluator.py:190`. The build re-measures every file when `detect.ts` changes: `tools/content/demands.py:145-153`. The evidence version and its precedent: `app/src/evidence/evidence.ts:148-168` (C4d moved it to 3 for a detector's located reading).
- **The key signature's location.** `app/src/demands/detect.ts:402-420` (`keySignature`: present when the key has sharps or flats, located at the sounding notes whose letter the key alters; "a key whose altered letters never sound is present with nowhere to point"); `tools/content/build.py:696` (zero counts are dropped from `measurement.located`) and `:709-721` (the row's `demands` is the detectors' list); `app/src/curriculum/types.ts:203-220` (`Measurement`).
- **The coping relation and `taughtAt`.** `app/src/curriculum/eligibilityCore.ts:37-50` (`Learner`), `:111-124` (`demandsAsked`: a measured row's `demands` list), `:126-136` (`uncoped`: asked, less `supported` — the `copedWithBy` skill at `familiar` — less `taught`), `:227` (question 1); `app/src/curriculum/session.ts:770` (`learnerAt`), `:1733-1737`, `:1959` (`rungAncestry`), `:2001-2031` (`taughtAtRung`, ancestry and reached); `app/src/demands/vocabulary.ts:83-99` (`Demand`, `copedWithBy` at `:91`); `copedWithBy`'s other readers `session.ts:938`, `:1044`, `:2614`, `app/src/evidence/demandReadings.ts:157`, `evidence.ts:450`; `content/curriculum/vocabulary/demands.json:13-17` (how `taughtAt` is derived and warned), `:41` (`interval.skip`: `copedWithBy` `interval-reading`, `taughtAt` `["1.5"]`), `:66` (`metre.compound`), `:67-75` (`key.signature`); `content/curriculum/vocabulary/skills.json:93-102` (`interval-reading`; its note at `:100`: a note-namer in a fixed position plays the same right notes); `app/src/evidence/evidence.ts:17-23` (the same principle, stated for evidence).
- **The build's mirror.** `tools/content/claims.py:121` (`taught_at`), `:130-145` (`concepts_naming`), `:148-172` (`teaching_rungs`), `:183-229` (`rung_ancestry`), `:353-363` (`untaught_on`, the build's coping question) and its callers `:403` (the rung-claims report), `tools/content/excerpts.py:816`, `tools/content/study.py:1325`, `tools/content/untaught_options.py:305`; `tools/content/tests/fixtures/untaught_on_rung.json` and `tools/content/tests/test_measured_demands.py:148-165` (D0's record of generated items' untaught demands; its rows name the `five_finger` family's `key.signature` at 1.1, 1.3 and practice.5, and a `riff` skip at 1.1).
- **The table.** `tools/content/untaught_options.py:36-45` (the docstring's class A), `:101` (`PRESENCE_DOUBTS`: the clef note and the walking-bass caution only), `:105-112` (`NOWHERE`, `THREE_EIGHT`, `SIXTEENTHS_IN_THREE_EIGHT`), `:114-123` (`reading_doubts`), `:162-182` (`READ_NOT_TEACHING`), `:319-320` (class A reads both lists); `tools/content/tests/test_untaught_options.py:44` (`PROBE`, X1's snapshot), `:46-66` (`RECORDED_DIFFERENCES`), `:102-103` (the 387), `:283-300` (the test that pins the three doubts); the probe `docs/prompts/runs/L120a/scripts-zzL120aProbe.test.ts` and `scripts-vitest.l120a.config.ts` (run from the gitignored `app/.probe/`, never among the tests; writes `-refusals.txt` and `-uncoped.txt`).
- **The range the route needs.** `app/tests/unit/demandsOfFiles.test.ts:149-157` (the bridge already returns each printed bar's lowest and highest sounding MIDI per hand, grace notes excluded) and `tools/content/build.py:567`, `:685` (`attach_demands` pops it into `build/positions-cache.json`, off the row); `tools/content/excerpt_proposer.py:586-590` (the proposer already reads it).
- **The positions the curriculum teaches.** `content/curriculum/stage-1.json:20` (1.1 claims `C-position`), `:194` (1.3 claims `LH-C-position`), `:360` (1.5 `introduces` the leap); `content/curriculum/concepts.json:15-21` (`C-position` and `LH-C-position` are "a range it measures"), `:128`, `:246`; `content/lessons/1.1.md:12-13` (right thumb on middle C, D E F G above it: C position), `:40-42` (*Kum Ba Yah* sits above C position, G to the E a sixth above); `content/lessons/1.3.md:14` (left-hand C position is C3–G3); `content/lessons/1.5.md:12-14` ("Up to now you have read notes by name ... From here you read by interval"), `:19-20` (a skip is a 3rd), `:26-28` ("your hand already knows where it is, so all it needs is the distance"), `:42-43` (*Steps and Skips in C*, "the hand never leaves C position"). Interval reading is first declared as a target at 1.5 (`exercise.interval-reading.c-position.right.01`–`03`); no rung-own option before 1.5 declares it.

## What is decided

1. **What the lane is for, and its order.** In the reviewer's words: *material reading → teaching ownership → placement*, and *re-run the table after each class* so *one class cannot hide another*. In mine: before any lesson or placement is changed for sixteenths (L120c), the two faults that are not the curriculum's are corrected where they live — the detectors' reading of 3/8 and the gate's reading of what an item asks — so the table L120c works from reads the notes and the learner as they are. Class 1 (items 2–4) lands in the worktree first and the table is re-run and recorded; class 2 (item 5) follows and the table is re-run and recorded again (item 6).

2. **3/8 is not compound, at the detector.** Compound time requires the 6/8, 9/8, 12/8 family: `beatType === 8` and `beats` a multiple of three greater than three, which also admits the rarer 15/8 and 18/8 (the brief's choice; overturnable — the family is defined by more than one beat of three eighths, not by a list). The model carries no grouping fact (`types.ts:160-165`), so none is read or invented; a /16 metre stays as it reads today and is listed if the corpus has one.
   - **One definition** (the brief's choice; overturnable): change `isCompound` itself (`detect.ts:121-124`), so `beatLength` and with it `syncopation` and `dottedQuarters` read a 3/8 bar as three eighth-note beats too. Reason: the detectors hold one reading of a bar's beat (`detect.ts:10-11`); 3/8 read as simple for compound time and as one dotted-quarter beat for syncopation would be two readings of one bar. The consequence is measured, never assumed: a catalogue diff by item and demand over every row with a 3/8 bar, each move named (expected: `metre.compound` leaves; a quarter entering on the second or third eighth stops reading as syncopation; a written dotted quarter in 3/8 starts reading as `rhythm.dotted-quarter`). The comments at `:121` and `:393` are rewritten.
   - `demandDetectors.test.ts:198-199` asserts the reading being replaced: replaced in the same change, with the reason (§11).
   - `excerpt_proposer.py:594` predicts what a cut will measure as, so it takes the same family rule.
   - **Not moved:** the generator's and importer's copies (`readingControls.ts:87`, `sightReading.ts:659`, `:684`, `:1929`, `sightReadingScore.ts:123`, `readMidi.ts:78`, `musical_evaluator.py:190`). Grep the reading rows' params, the study and generator recipes for a 3/8 metre: if nothing the app generates is in 3/8, leave them and list them as a follow-up (one fact in several places); if something is, stop and report before touching them.
   - **The evidence version** (the brief's choice; overturnable): `EVIDENCE_DEFINITIONS` (`evidence.ts:168`) moves to 4 with its line, as C4d moved it for a detector's located reading (`:161-166`). Reason: evidence stored on 3/8 pieces counted 6/8, syncopation and dotted-quarter opportunities under the old reading.
   - **Red first, unit:** (M1) a phrase all in 3/8 → `compoundMetre` not present, located nowhere; (M2) 6/8, 9/8, 12/8 → present and located at every note, as now (guard, `:189-191`); (M3) 3/8 with one 6/8 bar → present, located only at that bar's notes; (M4) in 3/8 a quarter entering on the second eighth → no syncopation there, and a quarter entering a sixteenth after a beat → syncopation (guard); (M5) in 3/8 a written dotted quarter → `rhythm.dotted-quarter` located, in 6/8 → not (guard); (M6) Python, `window_demands` on a 3/8 window carries no `metre.compound` and on a 6/8 window does (`test_excerpt_proposer.py`). M1, M3, M4's first half, M5's first half and M6's first half are red on the current code.

3. **A key signature that alters no sounding note is not asked on the coping question.** In the gate's reading of a measured row's material demands — `demandsAsked`/`uncoped` (`eligibilityCore.ts:111-136`) and its build mirror `claims.untaught_on` (`claims.py:353-363`) — `key.signature` is not asked when the measurement locates it at no note (`measurement.located['key.signature']` absent or 0; the build drops zero counts, `build.py:696`).
   - **Only `key.signature`** (the reviewer's ruling names it). Any other demand located nowhere stays asked, and stays class A in the table (`NOWHERE`).
   - **The notation fact stays:** the detector's `present` and location rule, the row's `demands` list, `keySig`, provenance, and question 2 (a practice want for `key.signature` still reads the row as `incidental`, located 0) are unchanged.
   - **Every reader of `untaught_on` takes the same rule:** the rung-claims report (`claims.py:403`), `excerpts.py:816`, `study.py:1325` and the table (`untaught_options.py:305`). Say what each shows differently: the report's untaught column, and any excerpt or study rung that moves.
   - **Red first, unit (TS beside `app/tests/unit/eligibility.test.ts`; Python in `tools/content/tests/test_taught_at.py`):** (K1) the G five-finger pattern's shape — `key.signature` in `demands`, located 0 — at 1.1 → not uncoped, and `untaught_on` gives `[]`; (K2) the same key with a sounding F♯ (located 1) at 1.1 → uncoped (guard); (K3) the row keeps `key.signature` in `demands`, and a `{for: 'demand', demand: 'key.signature'}` want reads `incidental`, located 0, as before (guard); (K4) `metre.compound` in `demands` with located 0 → still uncoped at 1.1 (guard: the rule is the key signature's alone); (K5) a runtime reading row whose controls may write a key signature → asked as now (guard); (K6) G major with a written F♮ — the key located 0, `pitch.chromatic` located 1 → the key not asked, the natural asked (guard). K1 is red on the current code in both languages.

4. **Written sixteenths in 3/8 are sixteenths.** Remove `SIXTEENTHS_IN_THREE_EIGHT` (`untaught_options.py:109-112`, `:121-122`). The reviewer calls it a presence doubt; in the code it is one of `reading_doubts`, not `PRESENCE_DOUBTS` (`:101`), and class A reads both (`:319-320`). With the detector corrected, `THREE_EIGHT` (`:107-108`, `:119-120`) goes too. It stood in for the detector's error, and a 3/8 row that still carries `metre.compound` after item 2 carries it from a genuinely compound bar. `reading_doubts` keeps `NOWHERE`, and the docstring (`:36-45`) says so.
   - `test_untaught_options.py:283-300` pins the old doubts: it is replaced, with the reason.
   - **Red first:** (S1) a 3/8 row with sixteenths is classified by ownership and placement. It is `C-nowhere` on a constructed curriculum with no teaching rung, and `B-mapping` where a lesson below names sixteenths. (S2) A row with `timeSig` 3/8 and `metre.compound` is not A. (S3) A demand other than `key.signature` located nowhere is A with `NOWHERE` (guard).
   - Never read a written sixteenth as an eighth to clear it (the reviewer).

5. **Before 1.5, a skip inside a taught fixed position is coped with by that position's note reading.** The reviewer's adversaries, verbatim:
   1. before 1.5, a skip wholly inside an already taught fixed position can be coped with through that earlier note-reading route;
   2. before 1.5, a skip that leaves that known position / otherwise requires interval transfer does **not** get that exemption;
   3. after 1.5, interval-reading support works normally;
   4. evidence for interval-reading is still not inferred from a correct fixed-position run.

   **Not moved:** `taughtAt` for `interval.skip` (`demands.json:41` stays `["1.5"]`); the `skips` detector; `copedWithBy` (one skill, read at `eligibilityCore.ts:130`, `session.ts:938`, `:1044`, `:2614`, `demandReadings.ts:157`, `evidence.ts:450`); `evidence.ts`'s rules and `ladder.ts`.

   **The shape** (the brief's choice; overturnable): a narrow contextual predicate in `uncoped`, beside `supported` and `taught`, not a richer coping relation. Reason: a second coping skill on the demand would be a route evidence could credit, and a change of shape all six readers of `copedWithBy` would see. A predicate names no skill, so no evidence reader can attribute a run to it (adversary 4), and only the coping question reads it.

   **The predicate.** `interval.skip` is coped with at the rung judging a measured row when three things hold:
   - the row carries each sounding hand's range over the whole piece;
   - every hand that sounds lies inside that hand's fixed position, and that position's note reading is taught on the rung's path, or on a rung the learner has reached (`taughtAtRung`'s two readings). The right hand's position is C4–G4 (MIDI 60–67), taught where a lesson claiming `C-position` is on the path (1.1). The left hand's is C3–G3 (48–55), taught where one claiming `LH-C-position` is (1.3).

   These get nothing from the predicate:
   - a hand outside its position;
   - a hand whose position is not taught there: the left hand before 1.3, or on the practice floor, which stands on 1.1 alone;
   - a row with no range (unmeasured, runtime);
   - every demand but `interval.skip`, including a step or a leap inside the position.

   A black key inside a range is the key signature's or the chromatic demand's to refuse (3.1, 3.3). The predicate adds nothing for it.

   **The data.**
   - **The row's range.** The build writes each hand's lowest and highest sounding MIDI over the piece into the measurement (for example `measurement.span`). It computes this from the per-bar `hands` the bridge already returns (`demandsOfFiles.test.ts:149-157`), so the bridge and the detectors do not change for it. `content/catalog.schema.json` and `Measurement` (`types.ts:203-220`) gain the field.
   - **The positions** (the brief's choice; overturnable). They are recorded once, on `interval.skip` in `demands.json`, with its schema and `Demand` (`vocabulary.ts:83-99`): each position's concept, hand and two bounds. Where each is taught is read from the lessons' own `concepts` under the ancestry, never from a second rung list. Reason: the rungs then cannot drift from the lessons' claims.

   **The threading.** Every place that builds a Learner's `taught` from `taughtAtRung` (`session.ts:2019`) supplies the positions from the same rung, ancestry and reached set. The brief found `learnerAt` (`session.ts:770`), `:1733-1737` and `ScoreScreen.ts:4605` (not all of these build a Learner); the builder's grep decides the list. A caller left without the positions gives no exemption (the refusal stays, never the reverse), and the report names it with the reason. The Python mirror `claims.untaught_on` reads the same vocabulary entry and the curriculum's concepts, and all its callers take it.

   The clef-assumption rows (1.3's left-hand arrangements, `measurement.misread`) get no special case: the report says how their hands read and which way the predicate fell.

   **Red first,** each a TS case on `uncoped` and `eligibleFor` with a Python twin on `untaught_on`:
   - **(1)** At 1.2, a measured row with `interval.skip` and the right hand inside 60–67 → not uncoped. At 1.4, a two-hand row inside both positions → not uncoped. Both are red on the current code.
   - **(2)** Each of these stays uncoped (guards):
     - at 1.2, the right hand at 60–69 (*Kum Ba Yah*'s shape);
     - at 1.2, the left hand inside 48–55;
     - at 0.3, where no position is taught;
     - at practice.1, a row with a left-hand note;
     - an unmeasured row, and a runtime reading row;
     - an `interval.leap` inside 60–67 at 1.2.
   - **(3)** At 1.5 and at 2.1, a skip outside every position is taught as now. At 1.2, a learner whose `interval-reading` state is `familiar` is supported as now for an out-of-position skip (guards).
   - **(4)** At 1.2, take a learner whose only runs are correct runs of in-position skip items that declare no `interval-reading` target, as the shipped 1.1–1.4 songs do. That learner has no `interval-reading` state at or above `familiar`, and an out-of-position skip item stays uncoped for them. The predicate reads no skill state and writes no evidence (guard).
   - **Mutants for the guards** (copies under the worktree's `build/`, never the source), each turning a guard red: a predicate with no hand check; one reading the left position from 1.1; one extended to leaps; one implemented as a supported `interval-reading` state; one that makes the predicate a skip's only route, so a taught skip outside every position is refused at 1.5.

6. **The table and its pin, re-run after each class and recorded.**
   - **After class 1:** the content build offline with an absolute `--out` (the first build re-measures every file, since `detect.ts` is in the fingerprint). Then the app's probe: the kept L120a script from the gitignored `app/.probe/` with a config copy, never among the tests. If item 5's Learner needs a field the probe does not pass, update the probe the way the session builds its Learner and keep it as `runs/L120b/scripts-zzL120bProbe.test.ts`. Then the table (`untaught_options.py --out`). Keep all three under `docs/prompts/runs/L120b/after-reading/`, with a difference file against L120a's table:
     - which of the 14 A pairs left A, and where each went;
     - every pair that appeared or left, by demand and rung, including those that moved on 3/8 rows with no `timeSig`;
     - the new summary.
   - **After class 2:** the same, under `runs/L120b/after-gate/`, with its difference against `after-reading`: which of the 19 skip pairs the predicate removed and which stayed, each with its hands' ranges, and any other pair that moved.
   - **The pin** (L124). `test_untaught_options.py`'s `PROBE` points at the final snapshot. `RECORDED_DIFFERENCES` keeps only what the new probe and the tool read differently (expected: 2.2's reading row alone). The count becomes the snapshot's. The docstring says which snapshot it is and how it is re-run. Nothing is forced equal: a line the two read differently is a finding.
   - **D0's record** (`untaught_on_rung.json`). The rows the corrected readings remove come out, each named in the entry. A row added is a finding.

7. **The validator's warning** (the L120 brief's Ruled section: *the validator's warning is L120b's*). `validate.py` warns, and never fails, with the table's count of rung-own options refused `untaught`. It lists the runtime reading rows apart as not read (the recorded exception L124 asks for; one row today). It becomes an error only when the count is zero or every line has a recorded reason, which is not this lane's.

8. **The hypothesis, and what refutes it.**
   - **Class 1** leaves A holding only the three clef-assumption ledger pairs at 1.3, on which there is no ruling. The six key-signature pairs leave the table; the two metre pairs leave; the three 3/8 sixteenth pairs become `C-nowhere`. The metre fix also moves `metre.compound`, syncopation and dotted-quarter pairs on 3/8 rows with no `timeSig`, and the table says how many.
   - **Class 2** removes the in-position skip pairs among the 19, and leaves *Hot Cross Buns* at 0.3 and *Kum Ba Yah* at 1.1.
   - **Refuted if:** an A pair other than the ledger three survives; a pair of any other demand moves in class 1, or of any demand but `interval.skip` in class 2; or either of those two songs leaves. A refutation is reported with its cause, never forced.

9. **Not L120b's:**
   - the lessons, the stage files (concepts and placements), `concepts.json`, `CONCEPT_DEMANDS` and every `taughtAt` value (L120c, then the placement lane);
   - the three ledger pairs read under the clef assumption (no ruling);
   - a leap inside a taught position (not ruled): count those pairs, for information and a Question;
   - the generator's and importer's metre rules (item 2);
   - the nineteen `READ_NOT_TEACHING` readings, which stay;
   - L113's split.

## Verification layers

- **Unit, red first, by layer.**
  - TS: M1–M5 in `demandDetectors.test.ts`; K1–K6 and the predicate's cases in a gate test beside `eligibility.test.ts`. Run `npx vitest run <those files>`, red, then green.
  - Python: M6 in `test_excerpt_proposer.py`; the K and predicate twins in `test_taught_at.py`; S1–S3 in `test_untaught_options.py`. Red, then green.
  - The guards are pinned by the mutants in item 5 (`mutants.txt`), none surviving.
- **The content suite:** `python -m unittest discover -s tools/content/tests -t tools/content`.
- **The builds:** `python tools/content/build.py --offline --out <abs>` before and after each class, with the catalogue diff for 3/8 rows. Then `python tools/content/validate.py --allow-nc --personal` (the new warning's line quoted) and `python tools/content/review.py --check`.
- **The probe and the table** after each class (item 6).
- **The app:** `npx vitest run`, the whole unit suite on the rebuilt content. Name the recorded `lessonClaimsAboutApp` line-ending pair and any load failure as Entry 149 did, and rerun those files alone. Then `npm run build:app`. Never `tsc --noEmit -p`.
- **The map:** `python tools/docs/checks_for_paths.py <every path touched>`, and every check it names. Run only the browser specs it names, at two workers on port 4474 through a config copy not for the commit. No port 4173.

## Rules and files

**You own:**
- `app/src/demands/detect.ts` at `isCompound` and its two comments;
- `app/src/evidence/evidence.ts` at `EVIDENCE_DEFINITIONS` and its line;
- `app/src/curriculum/eligibilityCore.ts` at `Learner`, `demandsAsked` and `uncoped`;
- `app/src/curriculum/session.ts` at `taughtAtRung` and the Learner builds, only to thread the positions (and `ScoreScreen.ts:4605` only if your grep shows it builds a Learner the gate reads);
- `app/src/curriculum/types.ts` at `Measurement`, and `app/src/demands/vocabulary.ts` at `Demand`;
- `content/curriculum/vocabulary/demands.json` at `interval.skip`'s positions, with `demands.schema.json`, and `content/catalog.schema.json` at the measurement;
- `tools/content/build.py` at `attach_demands`;
- `tools/content/claims.py` at `untaught_on` and its docstring, and its callers' arguments (`excerpts.py:816`, `study.py:1325`);
- `tools/content/excerpt_proposer.py:594`;
- `tools/content/untaught_options.py` at `reading_doubts` and the docstring;
- `tools/content/validate.py` at one warning loop;
- the tests named above, `tools/content/tests/fixtures/untaught_on_rung.json`, `docs/prompts/runs/L120b/`, and the `docs/02`, `docs/03` and `docs/08` rows in the entry's `## Doc rows`.

**This lane never edits** a lesson (`content/lessons/**`), a stage file (no concept, no placement), `concepts.json`, `CONCEPT_DEMANDS`, any `taughtAt`, `skills.json`, the ladder, or the generator and importer files listed in item 2.

**Deviate** when a premise here is wrong at the line: say so, take the better path and record why (§13). An adjacent problem is recorded and classified, never fixed on the spot.

Base: origin's head at dispatch, which holds L120a (`0bcd3be0`); say the sha. Never name an AI model. Never assert a number measured on this machine. No commits. Temp state under the worktree's own `build/`.

Fresh-worktree setup as X31's (Q24):
- `python tools/midi-cleanup/tests/parity_reference.py` and the offline build first;
- copy caches read-only from the main checkout;
- `npm ci` in `app/`;
- snapshot and restore the three files the build rewrites (`content/scores/imported/SOURCES.md`, `docs/prompts/inventory.md`, `docs/prompts/rung-claims.md`), keeping each one's diff against its snapshot in the run folder so the landing sees what the regenerated reports carry.

§11 and §12 apply by reference.

## Report

**Judgement first:**
- what a learner now meets differently: which rung-own options the gate stops refusing, and why each is honest;
- that nothing was heard, and every musical reading is unverified as music;
- the counts before and after each re-run.

**Then** Done / Not done / Follow-ups / Questions / Files. Every item under *What is decided* is either done or has its own not-done line; technical and pedagogical verdicts are stated apart. After that: the red lines, the mutants, and the tests table.

This is Entry 155: `docs/prompts/runs/L120b/ENTRY.md`, starting `### Entry 155 — L120b`.

**Brief approved 2026-09-30** (`responses/questions-7fb976cb.md`): the order material reading → gate → ownership; the shared detector fact changed, not the readers; the evidence version bumped; the key-signature exception narrow; the contextual support predicate preferred over widening `copedWithBy`; the hand span a measured material fact; callers without it fail closed; one caution: report 15/8 and 18/8 explicitly if the corpus has them, never a grouped compound reading without grouping evidence.

**Landed 2026-09-29** (Entry 155; c8680b70, merged 4ccb7927); handoff `handoffs/c8680b70.md`.

**Accepted 2026-09-30** (`responses/c8680b70.md`, APPROVE). The two corrections land at the right semantic boundaries: 3/8 is no longer compound merely because it is /8; a key signature that alters no sounding pitch stays a notation fact and is no longer a coping requirement; a fixed-position skip is coped with through already-taught note-name reading without awarding interval-reading skill; skips outside the taught position still refuse; imports without the range facts fail closed; the regenerated evidence and version stamps and the one-location rule for unmeasured demands are legitimate consequences of changing the measured material truth. The merge interaction with G1e is a test-fixture interaction, not a product regression: the revised transfer-offer test pins the intended candidate rather than a previously ineligible pentatonic. Question 1 ruled: a leap inside a taught fixed position takes the same alternate coping route under the same five constraints — the whole sounding hand span inside the taught position, the position taught on that path, no interval-reading evidence inferred, material outside still refusing, the demand still measured as a leap — and `interval.leap.taughtAt` never moves earlier; built as L120d (`tasks/L120d-a-leap-inside-a-taught-position.md`, Entry 167; its brief with the reviewer first). Question 2 ruled: clef alone never supplies hand identity; the 1.3 one-staff bass-clef rows stay refused unless the source or model carries an independent hand assignment, a lost upstream designation repaired in a later reading/source seam (L126). The D/E-minor pentatonic swap is an intended consequence of the corrected key-signature rule; the three class-A rows tied to hand/clef ambiguity stay visible until their hand truth is known. Closed.
