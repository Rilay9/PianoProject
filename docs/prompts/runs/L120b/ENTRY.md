### Entry 155 — L120b — the reading and the gate: 3/8 read as simple triple at the detector, a key signature that alters no sounding note left off the coping question, the two 3/8 doubts removed from the table, and before 1.5 a skip wholly inside a taught five-finger position coped with by the note reading that position taught; the table re-run after each class — 388 options and 641 pairs at the base, 386 and 632 after the reading, 378 and 618 after the gate; the app's probe 389, 387, 379; class A 14, 3, 3 (2026-09-29)

**Judgement.** Nothing was looked at on a screen and nothing was heard. Every musical reading here comes from the notation, the lessons' text and the build's facts, and none is verified as music. The gate's changes are technical and measured. Their pedagogy is the reviewer's ruling (`responses/0bcd3be0.md`) applied at the line. The observations below are unverified as pedagogy.

- **What a learner now meets differently.** Rung-own options the one gate stops refusing, from the app's probe at each re-run:
  - **After class 1 (2):**
    - 1.1 *G major five-finger pattern — right* (`exercise.five-finger.g-major.right`). Its one untaught demand was the key signature. G A B C D and back never sound an F, so the learner plays every written note right without applying the sharp.
    - 2.1 *coordination in G, hold* (`exercise.coordination.g.hold`). Same shape over a held left-hand G.
  - **After class 2 (8):**
    - 1.1: *Mary Had a Little Lamb*, *Merrily We Roll Along*, *Au Clair de la Lune*.
    - 1.2 and 1.4: *Lightly Row*.
    - practice.1 and practice.2: *Steps and Skips in C*.
    - practice.3: *Mary*.

    In each of these the right hand stays inside C4–G4. 1.1 teaches that position by note name ("right thumb on middle C, D E F G above it"), and 1.5 says what came before was reading "by name". So a third inside it is read by letter, never by interval.
  - **Refusals narrowed but kept:**
    - Class 1: five items, seven rung listings, lose one demand and keep another. They are G five-finger left at 1.3, G five-finger both at practice.5, *Swing Low* at 2.2 and hymns.2, *Für Elise* (beginner) at 3.4 and 4.2, and *Mariage d'Amour* at `classical.4.shelf`.
    - Class 2: three items, six rung listings, lose the skip and keep another. *Hot Cross Buns* at 1.1 and practice.1/3/4 keeps the eighths; *Jingle Bells* chorus at 1.2 keeps the leap; *When the Saints* at 1.4 keeps the leap and syncopation.
  - **Beyond a rung's own options.** The same gate reads every consumer.
    - The D and E minor pentatonics carry a signature that alters no note they sound.
    - On the shipped curriculum they are now offered as skill-tier swaps at 2.5 (`skillActivationBoundary.test.ts` had flagged exactly these as untaught).
    - In `transferOffer.test.ts`'s constructed learner, the D pentatonic becomes the next transfer offer once the A pentatonic is met.
    - Those tests' assertions of the old reading are revised (Deviation 3).
- **Why each is honest.** The notation fact is kept. The row still lists `key.signature`, and `interval.skip` stays measured and still taught at 1.5 (`taughtAt` unmoved). The predicate names no skill, so no run of these items becomes interval-reading evidence (the fourth adversary, pinned). A skip that leaves the position still refuses, as does a hand whose position is not yet taught:
  - *Kum Ba Yah* at 1.1 (G4–E5);
  - *Frère Jacques* at 1.2 (down to G3);
  - *Hot Cross Buns* at 0.3.
- **Counts, measured the same way at each re-run** (the table over the offline build; the probe from `app/.probe`):

  | | base (= L120a's table and probe, `before-equals-L120a.txt`) | after class 1 | after class 2 |
  | --- | --- | --- | --- |
  | table: options, pairs | 388, 641 | 386, 632 | 378, 618 |
  | A / B-claim / B-mapping | 14 / 43 / 67 | 3 / 42 / 67 | 3 / 42 / 67 |
  | C-later / C-elsewhere / C-nowhere | 246 / 134 / 137 | 246 / 134 / 140 | 238 / 128 / 140 |
  | app's probe `untaught` | 389 | 387 | 379 |
  | only the probe has | 2.2's reading row | 2.2's reading row | 2.2's reading row |

- **The hypothesis held.**
  - Class 1 left A holding only 1.3's three clef-assumption ledger pairs. The six key-signature pairs and the two 3/8 metre pairs left. The three 3/8 sixteenth pairs became C-nowhere.
  - The metre fix moved one more pair: *Mariage d'Amour*'s compound time (B-claim), on a row whose `timeSig` says 4/4 and whose notation holds a 3/8 bar. No syncopation or dotted-quarter pair moved in the table. The catalogue moved both on the 23 rows with a 3/8 bar (below).
  - Class 2 removed 14 of the 19 skip pairs and moved nothing else. *Hot Cross Buns* at 0.3 and *Kum Ba Yah* at 1.1 stayed.
  - Nothing refuted it.

## Done

1. **The order, and a re-run after each class (item 1, item 6).**
   - Class 1 (items 2–4) was built, tested red then green, and built offline, then the probe and the table were run: `after-reading/`.
   - Class 2 (item 5) followed with the same three: `after-gate/`.
   - Each class has a `difference.txt`: class 1 against L120a's table (the base's table and probe are identical to L120a's), class 2 against class 1. Each also has `table-difference.txt` (pair by pair, and the tool against its probe) and `catalog-diff.txt`.

2. **3/8 is not compound, at the detector (item 2).**
   - `detect.ts` `isCompound` requires `beatType === 8`, `beats > 3` and `beats % 3 === 0`. That is 6/8, 9/8, 12/8, 15/8 and 18/8.
   - `beatLength`, and with it `syncopation` and `dottedQuarters`, now read a 3/8 bar as three eighth-note beats. The two comments are rewritten.
   - `demandDetectors.test.ts:198-199`'s "3/8 counts as one compound beat" is replaced by M1, with the reason. M2–M5 are added. M6 is in `test_excerpt_proposer.py`, and `excerpt_proposer.py:594` takes the same rule.
   - `EVIDENCE_DEFINITIONS` moved to 4, with its line, as C4d moved it.
   - The catalogue (`after-reading/catalog-diff.txt`), 23 rows with a 3/8 bar, 4 of them with `timeSig` 3/8:
     - all 23 moved, and no other row did;
     - `metre.compound` left all 23;
     - `rhythm.dotted-quarter` entered 15 and moved count on 5 (established on 7 more);
     - `rhythm.syncopation` left 2 and moved count on 11 (established on 4 fewer).
   - Nothing the app generates is in 3/8: the reading rows' params, the generated rows' `timeSig` and the study and generator metre literals were grepped. So the generator's and importer's copies are left and listed (Follow-up 1).
   - Technically done. Pedagogically, 3/8 as simple triple is the reviewer's ruling; the moved dotted-quarter and syncopation readings on those pieces are unverified as music.

3. **A key signature that alters no sounding note is not asked (item 3).**
   - `eligibilityCore.demandsAsked` leaves out `key.signature` when `measurement.located` lacks it. `claims.asked_of` is the build's twin, and `untaught_on` reads it. Only the key signature, and only on a measured row. The notation fact, question 2 and provenance are unchanged.
   - All four build readers of `untaught_on` take it: the rung-claims report, `excerpts.py:816`, `study.py:1325` and the table. The older tests that call it without the curriculum read no position, as before. What each shows differently (`after-*/report-rung-claims.md.diff`, `candidate-rungs.txt`):
     - the report's untaught column, class 1: the key signature leaves *Swing Low* (2.2, hymns.2) and four generated rows, and compound time leaves *Für Elise* (beginner) and *Mariage d'Amour*;
     - the same column, class 2: the skip leaves *Mary*, *Merrily*, *Au Clair*, *Lightly Row*, *Jingle Bells*, *When the Saints*, *Steps and Skips in C* and the falling riff;
     - no excerpt's or study's candidate rungs moved in either class (5 excerpts, 24 studies).
   - Technically done. Pedagogically it is the ruling, unverified as pedagogy beyond it.

4. **Written sixteenths in 3/8 are sixteenths (item 4).**
   - `SIXTEENTHS_IN_THREE_EIGHT` and `THREE_EIGHT` are removed. `reading_doubts` keeps `NOWHERE`, and the docstring says why.
   - L120a's test of the three doubts is replaced by S1–S3, with the reason.
   - The three *Für Elise* sixteenth pairs are now C-nowhere (L120c's).

5. **Before 1.5, a skip inside a taught fixed position (item 5).**
   - **The positions** are on `interval.skip` in `demands.json`, with its schema and `Demand`: `fixedPositions` holds `C-position` R 60–67 and `LH-C-position` L 48–55.
   - **The row's range:** `build.span_of` gives `measurement.span`, each sounding hand's lowest and highest MIDI over the piece, from the bridge's per-bar `hands` (`catalog.schema.json`, `Measurement`). 2013 measured rows carry it; the bridge and the detectors are unchanged.
   - **The predicate:** `eligibilityCore.inTaughtPosition` in `uncoped`, beside `supported` and `taught`. Every sounding hand must lie inside its own position, and that position's concept must be named in `concepts` by a lesson on the rung's path or a reached rung.
   - **Threading:**
     - `session.positionTaughtAtRung` and `taughtForLearner` build `Learner.positionTaught` from the same rung, ancestry and reached set as `taught`.
     - The session's two Learner builds (`learnerAt`, `swapOptions`) use them.
     - The brief's third site, `ScoreScreen.ts:4605`, and `evidenceJob.ts:110` build generator holds, not a Learner, so they are untouched.
     - `selectors`' default `{}` has no rung and gets no exemption.
   - **The Python mirror:** `claims.untaught_on(..., curriculum)` with `in_taught_position` and `concepts_by_rung`. Every build reader passes the curriculum.
   - `taughtAt`, the `skips` detector, `copedWithBy` and its six readers, `evidence.ts`'s rules and `ladder.ts` are unchanged.
   - **The clef-assumption rows:** 1.3's *Hot Cross Buns* and *Mary* (left hand) put a left-hand part on an upper staff in the bass clef. The model gives the hand by its staff, so each reads as the right hand at 48–52 and 48–55, outside right-hand C position, and the predicate fell to refusal. No special case.
   - Technically done. Pedagogically it is the reviewer's first adversary, and the reading of each song's range is from its notation, unverified as music.

6. **The pin and D0's record (item 6).**
   - `test_untaught_options.py`'s `PROBE` is `runs/L120b/after-gate/probe-refusals.txt` (379). `RECORDED_DIFFERENCES` holds 2.2's reading row alone, now that the two Q76 options are in both. The count is the snapshot's, and the docstring says how the probe is re-run.
   - `untaught_on_rung.json` loses 5 rows; none was added:
     - key.signature on coordination at 2.1 and on five_finger at 1.1, 1.3 and practice.5 (class 1);
     - interval.skip on riff at 1.1, the falling riff in C, R 60–65 (class 2).
   - `test_measured_demands.py` now reads each planned row as the build records it, with the curriculum. The rung-claims report and the record agree at 82.

7. **The validator's warning (item 7).** `validate.untaught_options_warnings` warns and never fails. In the after-gate build's validation (`checks/content-validate.txt:24-25`):

   > WARNING (untaught rung-own options, L120b): 378 rung-own options on 80 rungs are refused `untaught` at their own rung (618 option-demand pairs: A 3, B-claim 42, B-mapping 67, C-later 238, C-elsewhere 128, C-nowhere 140); `python tools/content/untaught_options.py` lists and classifies them (A reading, B ownership, C placement).

   A second line lists the 15 runtime reading rows on rungs as not read. The app's probe refusal among them is recorded in the test. Tested in `TheValidatorsWarning`.

8. **Mutants (item 5).** 15 mutants, 0 surviving, against unmutated controls that turn nothing red (`mutants.txt`, below).

9. **Leaps inside a taught position (item 9, for information).** 20 `interval.leap` pairs in the after-gate table; 5 lie on rows wholly inside the positions taught at their rung (`leaps-in-position.txt`): *Jingle Bells* chorus at 1.2 and holiday, the hands-together *Jingle Bells* at holiday, and *When the Saints* at 1.4 and hymns.2. None is exempted (Question 1).

**Deviations** (§13; each where the code refuted a premise or a consumer needed it):

1. **`candidates.ts` `unpreparedDemands`.** It asks the coping question of a synthetic item carrying every demand with `located: {}`. Under the key-signature rule `key.signature` would silently drop out of every unmeasured item's `unknown-forbidden` list. The synthetic item now locates every demand once. `eligibility.test.ts`'s adversary 8 pins it (mutant `ts-unprepared-located-empty`, red).
2. **The evidence version's consumers.**
   - `score-fit-paths.spec.ts` and `transfer-offer.spec.ts` seeded evidence stamped with a literal 3. At 4 a reader takes it as nothing until the evidence job recomputes it, so they now read the version from `evidence.ts`, as `competence.spec.ts` does.
   - `tests/e2e/fixtures/reader-learners.json` was rewritten by its own test's switch (`C4C_WRITE_E2E_ROWS=1`). Only its seven `evidenceDefinitions` stamps moved, 3 to 4.
3. **Tests that asserted the replaced readings, revised with the reason** (§11):
   - `test_measured_truth.py`'s practice-floor test held the study's skips as the floor's one untaught row.
   - `skillActivationBoundary.test.ts` read "untaught" as every listed demand; it now asks the gate's `uncoped` for the learner the session builds.
   - Three adversaries in `transferOffer.test.ts` assumed the D minor pentatonic refused for its signature. Each still pins the pentatonic in A. Adversary 2 now pins the blues scale's refusal.
4. **A guard the brief did not list.** The literal "no hand check" mutant reads a hand against the other hand's position. None of the guards the brief names touches it: its one red in `mutants.txt` is the added guard. So a guard was added, in both languages: the left hand playing in 60–67 at 1.2 stays uncoped. The brief's other reading of the mutant, the right hand alone, is a second mutant.
5. **The e2e config copy's storage state.** The committed `storageState.json` names origin localhost:4173. On 4474 the setup tour and first-sight cards showed, and two `score.ladder-route` tests failed behind a card, in the full run (`checks/e2e-run1-origin-4173-state.txt`) and again alone (`checks/e2e-ladder-route-alone.txt`). A 4474 copy in `app/.probe` fixed it: all 16 specs, 121 tests, passed (`checks/e2e.txt`).

## Not done

- **The generator's and importer's 3/8 rules:**
  - `readingControls.ts:87`;
  - `sightReading.ts:659`, `:684`, `:1929`;
  - `sightReadingScore.ts:123`;
  - `readMidi.ts:78`;
  - `musical_evaluator.py:190`.

  Not this lane's (item 2). Nothing generated is in 3/8. Follow-up 1.
- **The committed reports.**
  - The build rewrote `rung-claims.md`, `inventory.md` and `SOURCES.md`. All three were restored from the snapshot, and their diffs are kept (`after-reading/report-*.diff`, `after-gate/report-*.diff`).
  - `test_measured_truth.TestTheReports.test_the_committed_markdown_is_this_catalogues` is red on both reports until the landing commits the regenerated ones.
  - With the regenerated reports in place it passes (checked, then restored).
  - `SOURCES.md`'s diff is the fetch-date lines alone, the same at the base (`restore-before.txt`).
- **The validator's warning as an error.** Not this lane's (item 7).
- **The excerpt proposer's own coping question.** `excerpt_proposer.untaught` reads a window's demands with neither rule. It is conservative: it refuses more, never less. Follow-up 2.
- **An import's span.** `importStore.measureImport` writes no `span`, so an import's skips are never exempted. That is the refusal staying, the safe direction. Follow-up 3.
- **Anything heard or seen.** No screen was opened.

## Follow-ups

1. **P3, one fact in several places.** The generator's and importer's compound-time rules still include 3/8. Nothing generated is in 3/8 today. A 3/8 recipe would write "compound" where the detector now reads simple triple.
2. **P3.** `excerpt_proposer.untaught` is a second copy of the coping question. It takes neither the key-signature rule nor the positions.
3. **P3.** Imports carry no `measurement.span`, so the predicate never applies to one.
4. **P3, with the clef assumption.** A one-staff left-hand part written in the bass clef is the right hand to the model. 1.3's two left-hand arrangements keep their skip refused for it.
5. **P3, cost.** `demands.json` is in the measurement fingerprint, so adding `fixedPositions` re-measures every file on each checkout's next build, after `detect.ts` did the same.
6. **Observation, unverified as pedagogy.** The G five-finger pattern at 1.1 now passes the gate. No demand in the vocabulary says whether a G position, as opposed to C, is taught at 1.1.
7. **P3.** The table's rendered title still says "(L120a)".

## Questions

1. **A leap inside a taught position.** Is it coped with by the note reading the position taught, as the skip is? There are 5 pairs (item 9). The skip's predicate and its guard deliberately exclude leaps (mutant `ts-extended-to-leaps`, red).
2. **1.3's left-hand arrangements.** Should the predicate read a one-staff bass-clef part as the left hand? That would clear both skips at 1.3, where left-hand C position is taught. It stands on the clef assumption, on which there is no ruling.

## Files

- **Changed:**
  - app, source: `app/src/demands/detect.ts`, `app/src/evidence/evidence.ts`, `app/src/curriculum/eligibilityCore.ts`, `app/src/curriculum/candidates.ts`, `app/src/curriculum/session.ts`, `app/src/curriculum/types.ts`, `app/src/demands/vocabulary.ts`;
  - app, tests: `app/tests/unit/demandDetectors.test.ts`, `app/tests/unit/skillActivationBoundary.test.ts`, `app/tests/unit/transferOffer.test.ts`, `app/tests/e2e/score-fit-paths.spec.ts`, `app/tests/e2e/transfer-offer.spec.ts`, `app/tests/e2e/fixtures/reader-learners.json`;
  - content: `content/catalog.schema.json`, `content/curriculum/vocabulary/demands.json`, `content/curriculum/vocabulary/demands.schema.json`;
  - tools: `tools/content/build.py`, `tools/content/claims.py`, `tools/content/excerpt_proposer.py`, `tools/content/excerpts.py`, `tools/content/study.py`, `tools/content/untaught_options.py`, `tools/content/validate.py`;
  - tools, tests: `tools/content/tests/fixtures/untaught_on_rung.json`, `tools/content/tests/test_excerpt_proposer.py`, `tools/content/tests/test_measured_demands.py`, `tools/content/tests/test_measured_truth.py`, `tools/content/tests/test_taught_at.py`, `tools/content/tests/test_untaught_options.py`.
- **Added:** `app/tests/unit/copingQuestion.test.ts`, `docs/prompts/tasks/L120b-the-reading-and-the-gate.md` (the brief, copied unchanged).
- **The run folder `docs/prompts/runs/L120b/`:**
  - this entry;
  - `before-equals-L120a.txt`, `content-build-before.txt`, `restore-before.txt`, `parity-reference.txt`, `copy.txt`, `npm-ci.txt`;
  - `after-reading/` and `after-gate/`, each with: `content-build.txt`, `probe-refusals.txt`, `probe-uncoped.txt`, `probe.txt`, `untaught-options.txt`, `untaught-options-run.txt`, `table-difference.txt`, `catalog-diff.txt`, `difference.txt`, `restore.txt`, `report-SOURCES.md.diff`, `report-inventory.md.diff`, `report-rung-claims.md.diff`;
  - `red-green/` (the red and green runs named below);
  - `mutants.txt`, `candidate-rungs.txt`, `leaps-in-position.txt`, `checks-for-paths.txt`, `chain-checks-exit.txt`, `e2e-exit.txt`;
  - `checks/`: `build-app.txt`, `content-measured-truth-2.txt`, `content-tests.txt`, `content-validate.txt`, `e2e.txt`, `e2e-run1-origin-4173-state.txt`, `e2e-ladder-route-alone.txt`, `lint.txt`, `lint-2.txt`, `review-check.txt`, `tsc.txt`, `tsc-2.txt`, `unit-summary.txt`, `unit-2-summary.txt`, `unit-failures-alone.txt`, `unit-2-failures-alone.txt`;
  - the scripts: `scripts-chain-setup.ps1`, `scripts-rerun.ps1`, `scripts-chain-checks.ps1`, `scripts-e2e.ps1`, `scripts-catalog-diff.py`, `scripts-table-diff.py`, `scripts-candidate-rungs.py`, `scripts-leaps-in-position.py`, `scripts-mutants.py`, `scripts-zzL120bProbe.test.ts`, `scripts-vitest.l120b.config.ts`.
- **Not to commit (restored):** `content/scores/imported/SOURCES.md`, `docs/prompts/inventory.md`, `docs/prompts/rung-claims.md`. The regenerated versions' diffs are in the run folder.
- **Gitignored, outside the record:**
  - removed at the end: `app/.probe/` (the probes, the mutant configs, the Playwright config copy and its storage state), `app/test-results`, `app/dist` and the copied Kern, MuseTrainer and Mutopia caches;
  - kept: `build/` (the snapshot, the three builds' catalogues and tables, the mutant copies, the raw logs), `app/node_modules`, `app/public/content`.

## The red lines

Each is red on the code before its class, from `red-green/`:

- `red-demandDetectors.txt`, 4 failed of 85: M1, M3, M4 ("in 3/8 a quarter entering on the second eighth is on a beat — no syncopation there") and M5 ("in 3/8 a written dotted quarter is a dotted quarter"). The M4 and M5 guards and M2 pass.
- `red-test_excerpt_proposer-M6.txt`: `AssertionError: 'metre.compound' unexpectedly found in ['interval.step', 'metre.compound'] : 3/8 is simple triple`.
- `red-copingQuestion-K.txt`, 2 failed of 7: K1 and K6. The K6 assertion that fails is "the key signature altering no sounding note is not"; its guard half passes, as do K2–K5.
- `red-test_taught_at-K.txt`:
  - `test_k1…: Lists differ: ['key.signature'] != []`;
  - `test_k6…: Lists differ: ['key.signature', 'pitch.chromatic'] != ['pitch.chromatic']`.
- `red-test_untaught_options-S.txt`:
  - S1 `('A', ['in 3/8 counted in eighths, …']) != ('C-nowhere', [])`;
  - S2 `('A', ['3/8 is read as compound time …']) != ('C-later', [])`;
  - S3: the key-signature line still present. Its NOWHERE half is the guard.
- `red-copingQuestion-class2.txt`, 6 failed of 23, on class 1's code: the positions recorded; (1); (1) on the floor; the leap case's skip half; (4)'s in-position line; a reached rung. Its assertion, for example: `expected [ 'interval.skip' ] to deeply equal []`. Every guard passes.
- `red-test_taught_at-class2.txt`, on class 1's `claims.py`: `TypeError: untaught_on() got an unexpected keyword argument 'curriculum'` (3), and the positions test fails.
- `red-test_taught_at-class2-no-positions.txt`, with `claims.py` complete and the vocabulary without positions:
  - `test_1…: ['interval.skip'] != []`;
  - `test_2…: 'interval.skip' unexpectedly found in ['interval.leap', 'interval.skip']`;
  - `[] != ['interval.skip']`.

## The mutants

`mutants.txt`, `scripts-mutants.py`. The copies are under `build/l120b-mutants/`; the TypeScript ones are aliased in by a config in the gitignored `app/.probe`, and the Python ones are loaded as `claims`. The controls (unmutated copies through the same harness) turn 0 tests red. Each mutant's reds are counted beyond the control. 15 mutants, 0 survived:

| Mutant | Guard(s) it turned red |
| --- | --- |
| ts/py right hand alone (no hand check) | practice.1 with a left-hand note |
| ts/py no hand equality (no hand check) | the left hand at 60–67 at 1.2 |
| ts/py left position from 1.1 | the left hand inside 48–55 at 1.2; practice.1 with a left-hand note |
| ts/py extended to leaps | the leap inside 60–67 at 1.2 |
| ts as a supported interval-reading state; py read as interval reading | 9 TS guards, among them *Kum Ba Yah*'s shape, the leap, the familiar learner, (4); the Python twin of (2) |
| ts/py the position a skip's only route | (3) at 1.5 and 2.1, the familiar learner, and a further 17 TS and 3 Python tests where a taught skip is refused |
| ts/py the key rule for every demand | K4 (and S3 in Python) |
| ts the unknown item locating nothing | `eligibility.test.ts` adversary 8 |

## Tests

| Step | Exit | Note |
| --- | --- | --- |
| `parity_reference.py` (`parity-reference.txt`) · copies (`copy.txt`) · `npm ci` (`npm-ci.txt`) | 0 · 1 each (robocopy: copied) · 0 | the fresh-worktree steps; the three MAESTRO recordings absent, skipped |
| `build.py --offline --out <abs>`, base (`content-build-before.txt`) | 0 | table and probe identical to L120a's |
| red runs (above) | 1 each | as listed |
| `build.py --offline --out <abs>`, after class 1 (`after-reading/content-build.txt`) | 0 | every file re-measured (`detect.ts`) |
| probe, after class 1 (L120a's script) · table | 0 · 0 | 387 · 386 options, 632 pairs |
| `build.py --offline --out <abs>`, after class 2 (`after-gate/content-build.txt`) | 0 | every file re-measured (`demands.json`); validation OK, the new warning at lines 24–25 |
| probe, after class 2 (L120b's script) · table | 0 · 0 | 379 · 378 options, 618 pairs |
| green runs (`red-green/green-*.txt`) | 0 | the class tests: TS 346 passed over 7 files, Python 89 |
| mutants (`mutants.txt`) | 0 | 15 of 15 red beyond the controls |
| `checks_for_paths.py` (`checks-for-paths.txt`) | 0 | 32 of 32 matched; content-build, content-validate, review-check, content-tests, tsc, lint, unit, build-app, e2e (16 specs) |
| `validate.py --allow-nc --personal` (`checks/content-validate.txt`) | 0 | the warning quoted under Done 7 |
| `review.py --check` (`checks/review-check.txt`) | 0 | — |
| `unittest discover -s tools/content/tests -t tools/content` (`checks/content-tests.txt`) | 1 | 1,493 tests, 4 skipped; 3 failures. The practice-floor test, since revised (Deviation 3; `content-measured-truth-2.txt`: that file then fails only the next item). The committed-reports pair, red by the restore protocol and passing with the regenerated reports in place. |
| `npx tsc -b` (`tsc.txt`, `tsc-2.txt`) · `npm run lint` (`lint.txt`, `lint-2.txt`) | 0 · 0 | after the chain, and again after the test revisions |
| `npx vitest run`, first (`checks/unit-summary.txt`) | 1 | 12 failed in 7 files. The recorded `lessonClaimsAboutApp` line-ending pair (blues.3, 4.7; Entry 101). Three files read the replaced readings, since revised (`readerMovesTheDemand`'s fixture, `skillActivationBoundary`, `transferOffer`). `expectedNote`, `libraryImportWords` and `simonTurnCue` pass alone (`unit-failures-alone.txt`: only the recorded pair fails), read as load. |
| `npx vitest run`, second (`checks/unit-2-summary.txt`) | 1 | 3 failed: the recorded pair, and `firstContactOnTheScore` (a `waitFor`), which passes alone (`unit-2-failures-alone.txt`). Read as load. |
| `npm run build:app` (`checks/build-app.txt`) | 0 | — |
| the map's 16 e2e specs, 2 workers, port 4474, config copy (`checks/e2e.txt`) | 0 | 121 passed. The first run, on the committed storage state's 4173 origin, failed 2 `score.ladder-route` tests behind a first-sight card (Deviation 5). |

Unverified:
- every musical reading, as music;
- the positions' pedagogy beyond the reviewer's ruling;
- the moved syncopation and dotted-quarter readings on the 3/8 pieces.

## Doc rows

- **`docs/02`, after *The untaught rung-own options, read before any refusal reads them (L120a)*.** A new paragraph:

  > **The reading and the gate corrected (L120b, 2026-09-29).** Two faults that were not the curriculum's are corrected where they live, under the reviewer's order *material reading → teaching ownership → placement* (`responses/0bcd3be0.md`), the table re-run after each.
  >
  > The material reading:
  > - 3/8 is simple triple at the detector (`detect.ts`'s `isCompound`: more than one beat of three eighths), so compound time, syncopation and the dotted quarter read a 3/8 bar as three eighth-note beats. The evidence version moved to 4.
  > - A key signature that alters no sounding note is not asked on the coping question (`eligibilityCore.demandsAsked`, `claims.asked_of`). The notation fact stays on the row.
  > - A written sixteenth in 3/8 is a sixteenth.
  >
  > The gate's support model: before 1.5, a skip wholly inside a taught fixed position is coped with by the note reading that position taught. Right-hand C position (1.1's `C-position`) and the left hand's (1.3's `LH-C-position`) are recorded once, on `interval.skip`'s `fixedPositions`. The row's range is `measurement.span`, and where each position is taught comes from the lessons' `concepts` under the ancestry (`session.positionTaughtAtRung`, `taughtForLearner`; `claims.untaught_on` with the curriculum). `taughtAt` and `copedWithBy` do not move, and the predicate names no skill, so no fixed-position run is interval-reading evidence.
  >
  > The table went from 388 options (641 pairs, A 14) to 386 (632, A 3) to 378 (618, A 3); the validator warns with its count and never fails.

- **`docs/03`, §3 step 8a (reports).** Append:

  > "Since L120b `validate.py` warns, never fails, with `untaught_options.table`'s count of rung-own options refused `untaught` and lists the runtime reading rows it does not read. `build.attach_demands` writes `measurement.span` (each sounding hand's lowest and highest MIDI over the piece, `span_of` the bridge's per-bar `hands`). `demands.json`'s `fixedPositions` is in the measurement fingerprint, so a change to it re-measures every file."

- **`docs/08`.** A new row:
  - Row name: **What the coping question asks, and what copes with it** (L120b).
  - What it covers: 3/8 read as simple triple by every detector that reads a beat (M1–M6); a key signature located nowhere not asked, the notation fact kept (K1–K6); the fixed-position predicate for `interval.skip` before 1.5 and its four adversaries; the build's mirror (`claims.untaught_on` with the curriculum); the table's doubts (S1–S3); the validator's warning.
  - What it guards against:
    - a hand read outside its own position;
    - the left position read from 1.1;
    - the predicate extended to leaps;
    - the position turned into interval-reading support;
    - the predicate made a skip's only route;
    - the key signature's rule widened to other demands;
    - the unknown item losing the key signature from unknown-forbidden.
  - Tests:
    - `app/tests/unit/copingQuestion.test.ts` (24);
    - `app/tests/unit/demandDetectors.test.ts` (M1–M5);
    - `tools/content/tests/test_taught_at.py` (`TestAKeySignatureAlteringNoSoundingNoteIsNotAsked` 7, `TestASkipInsideATaughtFixedPosition` 5);
    - `tools/content/tests/test_untaught_options.py` (S1–S3, `TheValidatorsWarning`);
    - `tools/content/tests/test_excerpt_proposer.py` (M6).
  - Status: done (L120b); pinned by 15 mutants; unverified as music.

  And the file lines:
  - "`copingQuestion.test.ts` — the coping question's material reading and support model: a key signature located nowhere not asked; a skip inside a taught fixed position coped with before 1.5; the four adversaries (L120b)";
  - `test_untaught_options.py`'s line gains "pinned to L120b's final probe (379), the runtime reading row the one recorded difference".
