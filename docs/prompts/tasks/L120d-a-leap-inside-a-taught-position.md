# L120d — A leap wholly inside a taught fixed position is coped with by that position's note reading, as a skip is: the same predicate, reached by recording on `interval.leap` the `fixedPositions` `interval.skip` carries, under the reviewer's five constraints as adversaries in both languages; `interval.leap.taughtAt` stays at 2.1; L120b's *extended to leaps* guard is inverted into one that a leap outside the position still refuses; the table and the app's probe are re-run once, the five in-position leap pairs leave and nothing else moves, and the pin follows (the reviewer's Question 1 on L120b, `responses/c8680b70.md`:18–34; its Question 2 recorded here, never built; Entry 167; the vocabulary, its wording and the tests; sent to the reviewer before dispatch; its builder starts only on the reviewer's word (the owner's rule of 2026-09-30: every brief reviewed first))

**Read first:**
- **Procedure.** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13.
- **The ruling.** `docs/review/responses/c8680b70.md`:
  - :18–34, Question 1, quoted in item 1;
  - :36–48, Question 2, quoted in item 1;
  - :54, the three class-A rows tied to hand and clef stay visible.
- **What L120b built** (`docs/prompts/entry-155.md`):
  - item 5 (:77–89): the positions on `interval.skip`, `measurement.span`, `inTaughtPosition` in `uncoped`, the threading, the Python mirror, the clef-assumption rows;
  - item 6 (:91–96): the pin and D0's record;
  - item 8 (:104) and the mutants table (:199–226), among them the pair *extended to leaps* (:208);
  - item 9 (:106): the five leap pairs;
  - Follow-ups 2–5 (:144–147) and Questions 1–2 (:151–154).
- **The predicate's shape and its reasons:** `docs/prompts/tasks/L120b-the-reading-and-the-gate.md`, *What is decided* item 5: a narrow contextual predicate in `uncoped` beside `supported` and `taught`, not a richer coping relation; it names no skill, so no evidence reader can credit a run to it; *every demand but `interval.skip`, including … a leap inside the position* gets nothing. That exclusion is what the ruling now lifts for the leap.
- **The five pairs:** `docs/prompts/runs/L120b/leaps-in-position.txt`, from `scripts-leaps-in-position.py`. The script reads `interval.skip`'s positions for the leap (:25–32), for information only. Of the 20 `interval.leap` pairs in L120b's after-gate table, 5 lie on rows wholly inside the positions taught at their rung:

  | rung | item | span | class |
  |---|---|---|---|
  | 1.2 | `song.holiday.jingle-bells.rh` | R 60–67 | C-later |
  | 1.4 | `song.folk.when-the-saints.alternating` | R 60–67, L 48–55 | C-later |
  | holiday | `song.holiday.jingle-bells.rh` | R 60–67 | B-claim |
  | holiday | `song.holiday.jingle-bells.ht` | R 60–67, L 48–55 | B-claim |
  | hymns.2 | `song.folk.when-the-saints.alternating` | R 60–67, L 48–55 | B-claim |

  In L120b's probe (`runs/L120b/after-gate/probe-refusals.txt`, lines 5, 13, 59, 60, 66), the three *Jingle Bells* options are refused for `interval.leap` alone. The two *When the Saints* options are refused for `interval.leap` and `rhythm.syncopation`.
- **The code** (read at 6cf1daff; E51a's merge after it, 7d7d1e9c, touched none of these files):
  - `app/src/curriculum/eligibilityCore.ts`:
    - the module note, :17–18;
    - `Learner.positionTaught`, :43–50;
    - `inTaughtPosition`, :150–173. It reads **the demand's own** `fixedPositions` (:164). It returns false without them, without `learner.positionTaught`, or for a row that is unmeasured or has no `span` (:165–168). Otherwise every sounding hand must lie inside a position of its own hand whose concept is taught (:169–172).
    - `uncoped`, :175–191, the predicate beside `supported` and `taught` at :190.
  - `tools/content/claims.py`:
    - `in_taught_position`, :392–411. It reads `(demand or {}).get("fixedPositions")` (:402), the same per-demand rule.
    - `untaught_on`, :414–433. Its callers all pass the curriculum: the rung-claims report (:473), `excerpts.py`:891, `study.py`:1325 and `untaught_options.py`:301. The L120b brief's :403, :816 and :305 have moved to these.
  - `content/curriculum/vocabulary/demands.json`:
    - the note, :25–32 (*"is on interval.skip alone"*);
    - `interval.skip`, :51–61, with `fixedPositions` at :57–60 (`C-position` R 60–67, `LH-C-position` L 48–55);
    - `interval.leap`, :62: `copedWithBy` `interval-reading`, `taughtAt` `["2.1"]`, no positions.
  - `content/curriculum/vocabulary/demands.schema.json`:33–47. `fixedPositions` is allowed on any demand, and its description names `interval.skip` alone (:34).
  - `app/src/demands/vocabulary.ts`:101–110 (*"Only `interval.skip` has them"*).
  - `app/src/curriculum/session.ts`:2141–2154 (`positionTaughtAtRung`) and :2156–2170 (`taughtForLearner`). The positions come from the vocabulary and no demand is named there, so every Learner that has `positionTaught` today has it for a leap too.
  - `tools/content/demands.py`:141–152. `DEFINITION_FILES` holds `demands.json`, so any edit to it re-measures every file on each checkout's next build (L120b's follow-up 5).
  - `tools/content/untaught_options.py`:13–15, the docstring (*"less a skip wholly inside a fixed position"*).
- **The leap's teaching:**
  - `content/curriculum/stage-1.json`: 1.1 names `C-position` (:20), 1.3 `LH-C-position` (:194), 1.5 `introduces` the leap (:360).
  - `tools/content/tests/test_taught_at.py`:
    - :163, :197 and :385: `interval.leap`'s `taughtAt` is `["2.1"]`;
    - :273–284: the leap is untaught at 1.4 and 1.5 and taught from 2.1;
    - :296–300: holiday's path leaves the core before 2.1.
- **The tests L120b wrote:**
  - `app/tests/unit/copingQuestion.test.ts`:
    - :182–183, `LEAP_IN_C` (C4 up to G4, a fifth, with skips back down);
    - :194–208, *the positions are recorded once, on the skip*, asserting `['interval.skip']` alone at :196;
    - :260–264, the guard *an interval.leap inside 60–67 at 1.2 stays uncoped*.
  - `tools/content/tests/test_taught_at.py`:587–659 (`TestASkipInsideATaughtFixedPosition`):
    - :615–625, the skip alone, asserting `[SKIP]` at :616;
    - :647–649, the leap guard.
  - `tools/content/tests/test_untaught_options.py`:
    - the docstring, :10–26 (how the probe is re-run, :18–26);
    - `PROBE`, :50;
    - `RECORDED_DIFFERENCES`, :55–63 (2.2's reading row alone);
    - the count, :103 (379).
  - `tools/content/tests/fixtures/untaught_on_rung.json`: D0's record. Its two leap rows are the `cadence` family at holiday (:76–83) and hymns.2 (:122–129). The table reads `exercise.cadence.c.root` at L 48–65, outside the position.
  - `tools/content/tests/test_measured_demands.py`:148–170, the record's test.
- **The harness to reuse,** under `docs/prompts/runs/L120b/`:
  - the probe, `scripts-zzL120bProbe.test.ts` with `scripts-vitest.l120b.config.ts`, run from the gitignored `app/.probe/`;
  - `scripts-mutants.py` (15 mutants). Its `ts-extended-to-leaps` (:43–46) and `py-extended-to-leaps` (:78–81) are exactly *the predicate reading `interval.skip`'s positions for the leap*;
  - `scripts-table-diff.py`, `scripts-catalog-diff.py`, `scripts-leaps-in-position.py`, `scripts-chain-setup.ps1`, `scripts-rerun.ps1`.

## What is decided

1. **The ruling, verbatim.**

   Question 1 (`responses/c8680b70.md`:20–34):

   > **Yes, use the same alternate coping route, with the same constraints.**
   >
   > A leap is still a real `interval.leap` notation demand. But if every sounding note for that hand stays inside an already-taught fixed position whose notes the learner can identify by name, the learner does not need interval-reading skill merely to execute that material.
   >
   > So extend the contextual fixed-position support to `interval.leap` as well as `interval.skip`, provided:
   >
   > 1. the entire sounding hand span is inside the taught fixed position;
   > 2. the position itself is already taught on that learner/rung path;
   > 3. no interval-reading evidence is inferred or awarded from the exemption;
   > 4. material outside the position still refuses;
   > 5. the demand itself remains measured as a leap.
   >
   > This is the same distinction already established for skips: **material fact stays; alternate coping route changes the gate only.**
   >
   > Do not move `interval.leap.taughtAt` earlier merely because five pairs can be named by note inside C position.

   Question 2 (:38–48):

   > **No. Do not infer hand from clef alone.**
   >
   > Bass clef and left hand are separate truths. A right hand can play bass clef, a left hand can play treble clef, and a one-staff score does not become left-hand material simply because the staff uses bass clef.
   >
   > Therefore the 1.3 cases should remain refused **unless the source/model carries an independent hand assignment** showing that the sounding staff is left hand.
   >
   > The correct precedence is:
   > - explicit hand/staff-role metadata -> may support the left-hand fixed-position predicate;
   > - clef alone -> never supplies hand identity.
   >
   > If the current one-staff importer/model has lost an explicit left-hand designation that existed upstream, repair that representation in a later reading/source seam. Do not encode “bass clef means left hand” in the coping gate.

   The goal in this brief's words: a beginner who reads C position by note name plays *Jingle Bells*' G-down-to-C the way they play its E-up-to-G, by naming each note under a finger that has not moved. So the gate stops refusing that piece for a leap the lesson has not yet named. It says nothing about whether they read intervals, and nothing moves for music that leaves the position. The ruling's words are above.

2. **The same predicate, reached by data: `interval.leap` carries the positions `interval.skip` carries** (the brief's choice; overturnable).
   - **The change.** `demands.json`'s `interval.leap` gains `fixedPositions`, the same two objects as `interval.skip`'s (`C-position` R 60–67, `LH-C-position` L 48–55). No line of the predicate changes in either language.
   - **Why data, not code.**
     - Both predicates already read the demand's own entry (`eligibilityCore.ts`:164, `claims.py`:402). So the leap takes the route in both languages by construction, and the threading is already there: every `positionTaught` is demand-free (`session.ts`:2141–2170).
     - The vocabulary is where each demand's coping routes are declared (`copedWithBy`, `taughtAt`, `fixedPositions`). A reader of `demands.json` then sees that the leap has the route. The ruling is also per demand: *extend … to `interval.leap` as well as `interval.skip`*.
     - The other reading, *the predicate reads `interval.skip`'s positions for the leap*, is L120b's mutant *extended to leaps* written as code (`scripts-mutants.py`:43–46, :78–81). It would couple the two demands in two languages where no data says so.
   - **Its cost.**
     - The two position objects are stated twice. A guard pins them equal (item 3, (6)).
     - `demands.json` is in the measurement fingerprint (`demands.py`:141–152), so the after build re-measures every file. Say so, and give no timing.
     - **The alternative, if the reviewer wants one definition:** the positions defined once in the vocabulary, each demand naming the concepts it may use. That changes the schema, `Demand` and both readers. It is named, not built.
   - **The wording that says "the skip alone" is made true.** This is prose only:
     - the note at `demands.json`:25–32;
     - the schema's description (`demands.schema.json`:34);
     - `vocabulary.ts`:101–109;
     - `eligibilityCore.ts`:17–18, :150–162 and :175–179;
     - `claims.py`:392–401 and :414–424;
     - `untaught_options.py`:13–15.
   - **Not moved:**
     - `taughtAt` for `interval.leap` (`["2.1"]`, the ruling) and for `interval.skip` (`["1.5"]`);
     - `copedWithBy`;
     - the `leaps` and `skips` detectors;
     - `measurement.span` and how the build writes it;
     - `evidence.ts`'s rules and `ladder.ts`;
     - every Learner build.

3. **The five constraints as adversaries, in both languages.** Each is a TS case on `uncoped`, with `eligibleFor` where a verdict matters, in `copingQuestion.test.ts`. Each has a Python twin on `claims.untaught_on` with the curriculum in `test_taught_at.py`. Rows are made as L120b's are: detectors over a hand-made phrase, zero counts dropped, each hand's span. Rungs are the shipped curriculum's.
   - **(1) The span inside the taught position → coped with.**
     - At 1.2, `LEAP_IN_C` (R 60–67) → neither `interval.leap` nor `interval.skip` is uncoped. This inverts :260–264 and :647–649.
     - At 1.4, a two-hand row whose right hand leaps inside 60–67 and whose left hand leaps inside 48–55 (a new phrase, for example C3 up to G3) → nothing uncoped.
     - At practice.1, a right-hand leap inside 60–67 → coped with: the floor stands on 1.1.
     - All three are red on the base.
   - **(2) The position must be taught on that learner's rung path** (guards):
     - at 1.2, a left-hand leap inside 48–55 stays uncoped (the left position is 1.3's);
     - at 0.3, a right-hand leap inside 60–67 stays uncoped;
     - at practice.1, a two-hand leap row stays uncoped (the floor stands on 1.1 alone);
     - at practice.1, the same row for a learner who has reached 1.3 is coped with (`taughtAtRung`'s second reading);
     - a learner built without `positionTaught` gets nothing: the refusal stays, never the reverse.
   - **(3) No interval-reading evidence is inferred or awarded** (guard, TS alone, since the build reads no evidence):
     - L120b's adversary (4) is repeated for the leap: five correct runs of the in-position leap item, declaring no target skill, give no evidence;
     - `interval-reading` stays below `familiar`;
     - an out-of-position leap stays uncoped for that learner;
     - the in-position leap is coped with whatever the skill state, because the predicate reads none.
   - **(4) Material outside the position still refuses.** This is L120b's *extended to leaps* guard inverted: where the old one said a leap inside refuses, the new one says a leap outside refuses. Each case stays uncoped for `interval.leap`:
     - at 1.2, C4 up to A4 (R 60–69, *Kum Ba Yah*'s reach);
     - at 1.2, C4 up to C5 (R 60–72);
     - at 1.2, a left hand leaping inside 60–67, the right hand's position;
     - at 1.4, a two-hand row whose left hand reaches A3 (57);
     - an unmeasured row, a runtime reading row, and a measured row with no `span`.
   - **(5) The demand remains measured as a leap** (guards):
     - the in-position row's `demands` still lists `interval.leap`, and `measurement.located['interval.leap']` is above zero: the detector is unchanged;
     - `interval.leap`'s `taughtAt` is `["2.1"]`, and :163, :197, :385 and :273–284 pass unedited;
     - at 1.5, between the leap's introduction and 2.1, an out-of-position leap stays uncoped.
   - **(6) One fact in two places, pinned** (guard): `interval.leap`'s `fixedPositions` equal `interval.skip`'s, in both languages.
   - **The existing skip cases are unchanged.** Every L120b case passes unedited except the two that asserted the positions are the skip's alone (`copingQuestion.test.ts`:194–208, `test_taught_at.py`:615–625) and the two leap guards inverted above. Each of those is revised in the same change with its class (revise) and the old assumption: *the positions are the skip's alone*, and *a leap inside the position refuses*.

4. **Mutants,** copies under the worktree's `build/`, never the source, through L120b's harness copied to `runs/L120d/`.
   - **Retired: L120b's `ts-extended-to-leaps` and `py-extended-to-leaps`.** Once the leap carries equal positions they are equivalent mutants: they change nothing, so they cannot turn anything red. Say so in the entry.
   - **The replacements,** each turning a guard red in each language where it exists:
     - **(i)** the leap's `fixedPositions` removed: (1) goes red;
     - **(ii)** the leap's right-hand high bound widened to 69: (4)'s *Kum Ba Yah* reach and (6) go red;
     - **(iii)** the bound check skipped for the leap alone: (4) goes red;
     - **(iv)** the leap coped with as a supported `interval-reading` state: (3) goes red;
     - **(v)** `interval.leap`'s `taughtAt` moved to 1.5: (5)'s 1.5 case goes red;
     - **(vi)** the leap's left position read from 1.1: (2)'s left-hand case goes red.
   - **L120b's other 13 mutants** are re-run unchanged: none survives.

5. **The table and the app's probe, re-run once; the difference recorded; the pin moved.**
   - **Before, on the base.** After the setup build, `test_untaught_options.py` runs on the base's built content. Green means the snapshot the base's pin names (`PROBE`) is the base's truth. That is the before; the probe is not run twice.
     - L120c may have landed by dispatch. Then its snapshot is the pin, and the builder re-derives the expected set on the base: the census of `scripts-leaps-in-position.py` over the base's table. Every number below is L120b's and is then replaced by the base's.
     - Also run `untaught_options.py --out` on the before build: it is the build's own tool, cheap.
   - **After, once.**
     - The content build offline with an absolute `--out`. The catalogue diff against the before build is expected empty: the vocabulary is not on a row, and the re-measure reproduces every measurement. A difference is a finding.
     - The probe, from the gitignored `app/.probe/`, kept as `runs/L120d/scripts-zzL120dProbe.test.ts` with its config.
     - The table.
     - All three go under `docs/prompts/runs/L120d/after/`, with a difference file against the before.
   - **The expected difference** (the hypothesis, on L120b's numbers):
     - The five pairs leave the table's `interval.leap` lines (20 → 15; B-claim 42 → 39, C-later 238 → 236; pairs 618 → 613).
     - The three *Jingle Bells* options leave the probe's `untaught` list (379 → 376) and the validator's count (378 → 375).
     - Both *When the Saints* options stay refused, for `rhythm.syncopation` alone.
     - No other line moves.
     - The census re-run on the after build, reading the leap's own positions, finds no in-position leap pair left.
   - **The pin.**
     - `PROBE` points at `runs/L120d/after/probe-refusals.txt`.
     - The count becomes the snapshot's.
     - `RECORDED_DIFFERENCES` keeps only what the probe and the tool read differently (expected: 2.2's reading row alone).
     - The docstring says which snapshot it is and how it is re-run.
     - Nothing is forced equal: a line the two read differently is a finding.
   - **D0's record** (`untaught_on_rung.json`): expected unchanged, since its two leap rows are the cadence family, outside the position. A row removed is named in the entry; a row added is a finding.
   - **The other readers of `untaught_on`:** say what each shows differently.
     - the rung-claims report: its untaught column, and `docs/prompts/rung-claims.md`'s diff against its snapshot;
     - `excerpts.py`:891;
     - `study.py`:1325.
   - **The validator's warning** is quoted before and after.

6. **Question 2, recorded and not built.**
   - **1.3's two left-hand arrangements** (*Hot Cross Buns* and *Mary*, a left-hand part on one bass-clef staff that the model reads as the right hand at 48–52 and 48–55, Entry 155 item 5) stay refused. There is no clef-to-hand inference in either language, and no special case.
   - **The entry records the ruling's precedence** as a follow-up for a later reading or source seam: explicit hand or staff-role metadata may support the left-hand predicate, and clef alone never supplies hand identity. It also records whether any of their refusals is a leap, and how the predicate fell.
   - **The three class-A clef rows** stay visible in the table (:54).

7. **The hypothesis, and what refutes it.**
   - **The hypothesis.** The five pairs leave and the three *Jingle Bells* options become eligible at their rungs. *When the Saints* keeps its syncopation refusal. Nothing else moves in:
     - the probe or the table;
     - D0's record;
     - the catalogue;
     - any skip line.
   - **Refuted if:**
     - a pair of any demand but `interval.leap` moves;
     - a leap pair on a row outside the positions leaves;
     - a skip line moves;
     - a catalogue row changes;
     - D0's record gains or loses a row the census did not predict.

     A refutation is reported with its cause, never forced.

8. **Not L120d's.**
   - **Any `taughtAt`,** `copedWithBy` and `skills.json`.
   - **The detectors** (`detect.ts`), `evidence.ts`, `ladder.ts` and the Learner builds in `session.ts`.
   - **The lessons, the stage files, `concepts.json` and `CONCEPT_DEMANDS`,** and L120c's files.
   - **The clef assumption** (item 6).
   - **Imports:** `importStore.measureImport` writes no `span`, so an import's leaps, like its skips, are never exempted (L120b's follow-up 3).
   - **`excerpt_proposer.untaught`,** the second copy of the coping question, which takes neither rule (L120b's follow-up 2).
   - **The one-definition alternative** of item 2.

## Verification layers

- **Unit, red first, by layer.**
  - TS: `npx vitest run tests/unit/copingQuestion.test.ts` on the base (item 3 (1) red), then green.
  - Python: `python -m unittest discover -s tools/content/tests -t tools/content -p test_taught_at.py` on the base (item 3 (1)'s twins red), then green.
  - The guards are pinned by item 4's mutants (`runs/L120d/mutants.txt`), none surviving, against unmutated controls that turn nothing red.
- **The content suite:** `python -m unittest discover -s tools/content/tests -t tools/content`, after the pin moves.
- **The builds:** `python tools/content/build.py --offline --out <abs>`, before (the setup build) and after, with the catalogue diff. Then `python tools/content/validate.py --dir <out> --allow-nc --personal` (the warning line quoted) and `python tools/content/review.py --check`.
- **The probe and the table** after (item 5).
- **The app:** `npx vitest run`, the whole unit suite on the rebuilt content. Name any load failure as Entry 155 did and rerun those files alone. Then `npm run build:app`. Never `tsc --noEmit -p`.
- **The map:** `python tools/docs/checks_for_paths.py <every path touched>`, and every check it names. Run the browser specs it names at two workers, on port 4477, through a config copy not for the commit, with a storage state copied for that origin (L120b's deviation 5). No port 4173.
- **The product layer.** What a learner meets differently is the three *Jingle Bells* options, which stop being refused at 1.2 and on holiday. Each is honest by the ruling's five constraints, read on its notation's span. Nothing is heard: every musical reading is *unverified as music*.

## Rules and files

**You own:**
- `content/curriculum/vocabulary/demands.json` at `interval.leap`'s `fixedPositions` and the note at :25–32;
- `content/curriculum/vocabulary/demands.schema.json` at `fixedPositions`' description;
- the prose that names the skip alone, and nothing else in those files: `app/src/demands/vocabulary.ts`:101–109, `app/src/curriculum/eligibilityCore.ts`:17–18, :150–162 and :175–179, `tools/content/claims.py`:392–401 and :414–424, `tools/content/untaught_options.py`:13–15;
- `app/tests/unit/copingQuestion.test.ts`, `tools/content/tests/test_taught_at.py`, and `tools/content/tests/test_untaught_options.py` at `PROBE`, the count and the docstring;
- `tools/content/tests/fixtures/untaught_on_rung.json`, only if a row moves;
- `docs/prompts/runs/L120d/`;
- the `docs/02`, `docs/03` and `docs/08` rows in the entry's `## Doc rows`. L120b's rows are still pending in `docs/pending-review.md`; L120d's rows amend them (the leap beside the skip) rather than a doc directly.

**This lane never edits** anything item 8 names. If the code proves a line of the predicate must change, stop and say why before changing it.

**Deviate** when a premise here is wrong at the line: say so, take the better path and record why (§13). An adjacent problem is recorded and classified, never fixed on the spot.

**Base.** Origin's head at dispatch, which holds L120b (`c8680b70`, merged 4ccb7927); say the sha, and whether L120c is in it.

**The rules.**
- Never name an AI model. Never assert a number measured on this machine.
- No commits, pushes, stashes, resets or checkouts. Never write in the main checkout.
- Temp state goes under the worktree's own gitignored `build/` (`build/l120d/`).

**Fresh-worktree setup** as L120b's (`runs/L120b/scripts-chain-setup.ps1`):
- `python tools/midi-cleanup/tests/parity_reference.py`, then the offline build first;
- copy caches read-only from the main checkout;
- `npm ci` in `app/`;
- snapshot and restore the three files the build rewrites (`content/scores/imported/SOURCES.md`, `docs/prompts/inventory.md`, `docs/prompts/rung-claims.md`), keeping each one's diff against its snapshot in the run folder.

**The disk is nearly full.** When the run is over, delete the worktree's `app/.probe/`, `app/dist`, `app/test-results` and `app/node_modules`, the copied caches, the mutant copies and the two build outputs, once their tables and differences are written. Keep no log over 300 KB in the run folder: keep the summary and the failing names, and say the full log was not kept.

§11 and §12 apply by reference.

## Report

**Judgement first:**
- what a learner now meets differently: which rung-own options the gate stops refusing, each with its span and why each is honest under the five constraints;
- that nothing was heard, and every musical reading is *unverified as music*;
- the counts before and after (pairs, options, the pin), on the base's numbers.

**Then** Done / Not done / Follow-ups / Questions / Files. Every item under *What is decided* is either done or has its own not-done line.
- **Follow-ups:** item 6's clef precedence, for a later reading or source seam; imports' `span`; `excerpt_proposer.untaught`.

State the technical and pedagogical verdicts apart. The pedagogical one is the ruling, unverified as pedagogy beyond it.

After that:
- the red lines;
- the mutants, the two retired with the reason;
- the tests table, with each test's class (add, revise, preserve) and the old assumptions;
- exit codes;
- `## Doc rows`.

This is Entry 167: `docs/prompts/runs/L120d/ENTRY.md`, starting `### Entry 167 — L120d`.

## Reviewer's approval and conditions (`responses/questions-f7acb2c0.md`)

**Approved for dispatch 2026-09-30** (`responses/questions-f7acb2c0.md`:57–77, the L120d section). The reviewer's words below, verbatim, are part of this brief's contract: where the text above differs, they govern, and the entry says where. Dispatch waits on the owner's usage reset (the orchestrator's hold; the reviewer: an orchestration choice that changes no review gate).

> **APPROVE FOR DISPATCH.**
>
> The proposed implementation is the cleanest expression of the L120b ruling.
>
> Both the TypeScript and Python gates already read `fixedPositions` from the demand's own vocabulary entry. Therefore adding the same position declarations to `interval.leap` is better than special-casing leaps in code or making the leap reader borrow `interval.skip`'s data implicitly.
>
> Keep the important invariants:
> - `interval.leap` remains a measured leap;
> - `taughtAt` remains `2.1`;
> - `copedWithBy` remains interval reading;
> - fixed-position support changes the coping gate only;
> - no interval-reading evidence is awarded;
> - the whole sounding hand must fit inside its own already-taught position;
> - material outside the position still refuses;
> - bass-clef/hand ambiguity remains untouched.
>
> The duplicated two-position data is acceptable here. A larger shared-position abstraction would cost more schema/readers than it saves for two demand entries. Pinning the two lists equal is enough until a third real consumer appears.
>
> The five-pair expectation is useful as a hypothesis, not an oracle. Re-run against the actual base after L120c if present and report any difference rather than forcing the count.
>
> L120d may dispatch after the owner's usage reset.

**What they settle and ask of the builder:**
- **Item 2's choice stands:** the positions recorded on `interval.leap` as on `interval.skip`, stated twice, and item 3 (6)'s pin is enough until a third real consumer appears; the one-definition alternative stays unbuilt.
- **The eight invariants** are the contract; the report names, for each, the case or mutant that shows it.
- **Item 5's numbers are a hypothesis, not an oracle.** Re-run against the actual base (after L120c, if the base holds it) and report any difference; the count is never forced.

**Landed 2026-09-29** (Entry 167; 4e76c768, merged 712d6321); handoff `handoffs/4e76c768.md`.
## Record

lane: L120d · closes: — · entry: 167
index: A leap inside a taught fixed position takes the skip's alternate coping route (the L120b review's ruling on question 1) | content + app | brief drafted 2026-09-30 (`L120d-a-leap-inside-a-taught-position.md`); with the reviewer before dispatch; Entry 167; **brief approved for dispatch 2026-09-30** (`responses/questions-f7acb2c0.md`); waiting on the usage reset (Entry 167); waits for L120c to land (the shared refusal-table fixtures and derived curriculum truth), per the reviewer (`responses/questions-71bd6cee.md`, the plan and the lane split) |
in-flight: brief drafted 2026-09-30 (`L120d-a-leap-inside-a-taught-position.md`): the L120b review's ruling on question 1 (`responses/c8680b70.md`) — a leap inside a taught fixed position takes the skip's alternate coping route under the same five constraints (the whole sounding hand span inside the taught position; the position taught on the path; no interval-reading evidence inferred; material outside still refuses; the demand still measured as a leap), never `interval.leap.taughtAt` earlier; with the reviewer before dispatch (Entry 167). **Brief approved for dispatch** 2026-09-30 (`responses/questions-f7acb2c0.md`): the positions recorded on `interval.leap` the cleanest expression of the ruling (both gates already read the demand's own `fixedPositions`); the invariants — `interval.leap` still a measured leap, `taughtAt` 2.1, `copedWithBy` interval reading, the coping gate alone changed, no interval-reading evidence awarded, the whole sounding hand inside its own taught position, material outside still refusing, bass-clef/hand ambiguity untouched; the two position lists duplicated and pinned equal until a third real consumer; the five-pair expectation a hypothesis, not an oracle — re-run against the actual base after L120c if present and report any difference. The conditions, verbatim, are in the brief. Waiting on the owner's usage reset (Entry 167). **Waits for L120c to land** 2026-09-30 (`responses/questions-71bd6cee.md`): L120c and L120d stay serialized because both own the same refusal-table fixtures and derived curriculum truth, per the reviewer's plan and lane split; dispatched only after L120c lands. **Landed** 2026-09-29 (merged 712d6321, chain green); handoff `handoffs/4e76c768.md`, with the reviewer.
state: approved 2026-09-30: brief approved for dispatch (`responses/questions-f7acb2c0.md`); waits for L120c to land (`responses/questions-71bd6cee.md`)
- dispatched 2026-09-30: dispatched at b93162ae on L120c's landing, building (Entry 167)
- landed 2026-09-30: merged 712d6321; handoff `handoffs/4e76c768.md`
- verdict 2026-09-30: APPROVE WITH ONE REQUIRED CHANGE — `study.candidate_rungs` flags a rung admitted only by the fixed-position coping route (*eligible by taught-position coping; does not establish interval-reading evidence*), the candidate kept; docs/02: L120b's paragraph applied first, then L120d integrated into one rule (`responses/4e76c768.md`)
- verdict 2026-09-30: the content items checked as facts and claims, no correction required (`responses/questions-827289d0.md`)
