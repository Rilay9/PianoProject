# L120c — Sixteenths have an owner: core 4.4 teaches written sixteenths as four even subdivisions of the quarter-note beat, technique.6 and ragtime.5 claim what their lessons already teach, the pre-4.4 core options whose sixteenths need that reading are moved, replaced or simplified, and the table's other ownership lines are repaired only where a lesson's text teaches the demand (the reviewer's class 3 on L120a, with the sixteenth placements its ruling names; `responses/0bcd3be0.md`). **Content only; dispatched only after L120b lands.**

**Read first:**
- `docs/prompts/operating-procedure.md` §1–§5 and §11–§13.
- `docs/review/responses/0bcd3be0.md`, on origin only (`git show origin/claude/piano-teaching-app-bo19td:docs/review/responses/0bcd3be0.md`). Its Question 3 and its last two sections are what this lane builds from:
  - **Question 3:** `ragtime.5` owns sixteenth subdivision on its path; `technique.6` can own it *only by making the ownership explicit*; `latin.7` and `holiday.7` are *no separate owner*; the core's first honest owner is 4.4, *with an actual small teaching addition*, and 3.5 gets nothing. The pre-4.4 core options whose sixteenths genuinely need the reading are moved, replaced or simplified, and "taught" is not widened merely to keep those placements.
  - **The nineteen:** they stay not-teaching unless a lesson's text is substantively rewritten.
  - **L120b sequencing:** items 3 and 4, and *re-run the table after each class*.
- `docs/prompts/tasks/L120-untaught-readings-at-their-truth.md` and its **Ruled 2026-09-29** section: where a lesson genuinely teaches a demand, repair the claim or the mapping; a concept is added only where the curriculum owns that ability; there is no escape hatch.
- `docs/prompts/entry-149.md`: follow-up P1 (sixteenths are taught nowhere while the core asks them from 3.5 and 4.4), and the B groups under *H1/H3, split by ownership*.
- L120b's record (Entry 155, `docs/prompts/runs/L120b/ENTRY.md`) and its final table, `runs/L120b/after-gate/untaught-options.txt`. That table is where this lane starts; L120a's numbers below are its predecessor's.
- `docs/prompts/runs/L120a/untaught-options.txt:10-43`, the summary. The ownership lines by demand, counted from it:

  | class | demand | pairs | on rungs |
  | --- | --- | --- | --- |
  | B-claim | `interval.leap` | 14 | 1.5 ×2, `holiday` ×7, `hymns.2` ×5 |
  | B-claim | `metre.compound` | 12 | 2.2, 2.4, `chords-pop.4`, `classical.4.shelf` ×5, `holiday` ×2, `holiday.3`, `technique.4` |
  | B-claim | `pitch.chromatic` | 15 | 3.1, `blues.3` ×6, `chords-pop.3`, `hymns` ×4, `jazz.3` ×3 |
  | B-claim | `rhythm.syncopation` | 2 | `jazz.4` ×2 |
  | B-mapping | `rhythm.sixteenths` | 67 | `ragtime.5`–`9`, `technique.6`–`8`, `latin.7` ×5, `holiday.7` ×5 |

  That is B-claim 43 and B-mapping 67.

**The mapping and `taughtAt`:**
- `tools/content/claims.py:61-84`: `CONCEPT_DEMANDS`. `"eighth-notes": "rhythm.eighths"` is the pattern; no row names sixteenths.
- `claims.py:130-145`: `concepts_naming`. A skill whose opportunity is several demands names none, and `subdivision` is one (`content/curriculum/vocabulary/skills.json:115-124`).
- `claims.py:148-172`: `teaching_rungs`, one teaching rung per path. `:158-160`: `introduces` never makes a teaching rung.
- `claims.py:183-229`: `rung_ancestry`. A track's ancestry holds the core up to its stage. Read at this head, `ragtime.5`, `technique.6`, `latin.7` and `holiday.7` all have 4.4 on their path. `classical.4`, `classical.4.shelf` and `technique.4` do not.
- `content/curriculum/vocabulary/demands.json:13-17`: `taughtAt` is derived from the lessons' concepts, and `validate.py` warns where it differs.
- `demands.json:45-53`: `rhythm.sixteenths` has `taughtAt: []`. Its note names the level-7 reading row on `jazz.8` and `theory.9`.
- `content/curriculum/concepts.json:1225`: the `eighth-notes` entry, the shape to copy. `:3548`: `subdivision`.
- `app/src/curriculum/session.ts:2035-2044`: `readingOptions` holds a demand the rung has not taught out of a reading row's phrase. It is a reader of `taughtAt` beyond the gate.

**The rungs and their options:**
- `content/curriculum/stage-4.json:288-300`, 4.4: concepts `hanon`, `evenness`, `transposition`; Hanon Nos. 1–5, which the catalogue reads as 2/4 with sixteenths established.
- `content/curriculum/stage-5.json:433`, `ragtime.5`: `exercise.rhythm.sixteenths.4bar` among its options.
- `content/curriculum/stage-6.json:199`, `technique.6`: `exercise.trill.c.4pb.left`, `exercise.syncopation.sixteenth` and Czerny Op. 299.
- `content/curriculum/stage-7.json:385` (`holiday.7`) and `:830` (`latin.7`).
- `content/curriculum/stage-3.json:286` (3.4), `:368` (3.5), `:456` (3.6); `stage-4.json:105` (4.2), `:187` (4.3).

**The lesson text:**
- `content/lessons/4.4.md:12-60`. Nothing on it says what a sixteenth is. Rule 3 is at `:36-37`: set the metronome at 40, raise it only when every note is the same length and volume. Hanon 1 to 5 from 40 to 108 bpm is at `:44-48`.
- `content/lessons/ragtime.5.md:22-26`: the sixteenth–eighth–sixteenth figure, played straight, with even subdivisions. `:39`: "counting sixteenths out loud".
- `content/lessons/technique.6.md:25-27`: measured trills, "four notes to the beat can" be practised evenly. `:45-48`: "a page of sixteenths that stays even only if the hand does".
- `content/lessons/latin.7.md:18`, `:22-25`, `:37-41`: sixteenths as the hands' problem in *El Choclo* and *Asturias*, and in the studies.
- `content/lessons/holiday.7.md:24-26`: the rotation study "in sixteenths".
- `content/lessons/3.5.md:2`, `:17-18`: the sustain pedal, and legato pedalling, "sometimes called syncopated pedalling".
- `content/lessons/2.2.md:12-21`: eighths, "1 and 2 and", subdivision. `:43-47`: *Alouette* "in 6/8", counted "1 2 3 4 5 6".
- `content/lessons/1.5.md:22-24`: a leap "this rung only introduces", and the next rung practises it.

**The record and the pin:**
- `tools/content/untaught_options.py:162-182`: `READ_NOT_TEACHING`, the nineteen.
- `tools/content/tests/fixtures/untaught_on_rung.json` and `tools/content/tests/test_measured_demands.py:148-165`: D0's record. It holds the Hanon family's sixteenths on 4.4, `classical.4`–`8`, `ragtime.6`–`8`, `technique.4`–`5`, and the other families' on `technique.6`–`8`, `latin.7`, `holiday.7`, `ragtime.5`, `ragtime.9` and `blues.5`.
- `tools/content/tests/test_untaught_options.py`: the pin as L120b left it.
- `docs/prompts/runs/L120a/scripts-zzL120aProbe.test.ts`, or L120b's copy of it.
- `docs/prompts/backlog-2026-09-25.md:389`: L124, re-run the probe and record the difference.

## What is decided

1. **What the lane is for, and its order.**
   - **In the reviewer's words:** B ownership fixes, including `ragtime.5`, `technique.6` and core 4.4 sixteenth ownership, then only after the recompute the genuine leftovers; *re-run the table after each class*.
   - **In mine:** the curriculum teaches sixteenths honestly, once, at the first core rung where a learner is working on a stream of them at a metronome, and every rung that already teaches them says so. The core options that ask sixteenths before that rung stop asking them there. No other truth is bent to make a line disappear.
   - **The order:** items 2–7 (ownership), then a re-run. Then item 8 (the sixteenth placements the ruling names), then a re-run. Item 9 (the other B repairs) runs with items 2–7 and its result is in the first re-run.

2. **The concept and its mapping** (the brief's choice; overturnable). A concept `sixteenth-notes` goes into `concepts.json`, shaped like `eighth-notes` (`:1225`): display "Sixteenth notes", with a finder. One `CONCEPT_DEMANDS` row goes in: `"sixteenth-notes": "rhythm.sixteenths"`. Reason: `subdivision` names three demands, and `concepts_naming` maps none of them from a multi-demand skill (`claims.py:130-145`), so a `subdivision` claim would reach no `taughtAt`. The row is the one non-content line this lane writes, in the build's own mapping table.

3. **4.4's teaching addition.** A short paragraph goes into `content/lessons/4.4.md`, near rule 3 or *What to do at the piano*. It says what the Hanon page's written sixteenths are: four even subdivisions of the quarter-note beat. It says how to count them, and to keep them even at the metronome. The rest of the lesson is not rewritten, and `sixteenth-notes` goes into 4.4's `concepts` (`stage-4.json:290-294`).
   - **Every word must be true of the app's Hanon 1–5 as printed.** Read the generated files for the metre, the values and the beaming, and the tempo item's click at the bpm the lesson names, before any sentence says what the click is.
   - **It must be true of the app**, as `lessonClaimsAboutApp` holds lessons to be.
   - **The claim rule:** an option at 4.4 establishes `rhythm.sixteenths` (`docs/prompts/rung-claims.md` after the build). If none does, stop and report.
   - **The words are learner-facing and unverified as music.** They are shown in the report in full.

4. **`technique.6` claims what it teaches.** `sixteenth-notes` goes into its `concepts`, as the explicit claim the reviewer asked for. Its text is not changed: "four notes to the beat" (`:25-27`) and "a page of sixteenths" (`:45-48`) already teach it. The claim rule applies, and its options measure sixteenths.

5. **`ragtime.5` claims what it teaches.** `sixteenth-notes` goes into its `concepts`. Its text is not changed (`:22-26`, `:39`). The claim rule applies.

6. **No other claim.** `latin.7` and `holiday.7` get no claim; they inherit. 3.5 gets nothing. Descendant rungs are not declared owners.

7. **`taughtAt` follows the lessons.**
   - `rhythm.sixteenths`'s `taughtAt` becomes what `claims.teaching_rungs` derives, and its `taughtAtNote` is rewritten. `validate.py`'s derivation warning must be clean for it.
   - The brief expects `["4.4"]` alone. `ragtime.5` and `technique.6` stand on 4.4, and one teaching rung is kept per path (`claims.py:148-172`, `:183-229`). Their claims are then ownership records that move no gate verdict, and `latin.7` and `holiday.7` inherit through 4.4.
   - If the derivation gives more, say which rung and why.
   - **The other reader of `taughtAt`:** `readingOptions` holds untaught demands out of reading-row phrases (`session.ts:2035-2044`), so a row whose params ask sixteenths on a rung standing on 4.4 may now write them. Run the promise and reading tests the map names, and say which rows' phrases change.

8. **The pre-4.4 core sixteenth placements, after the first re-run.**
   - **Which options:** every core option before 4.4 still refused for `rhythm.sixteenths`. L120a's table names *Canon in D (easy)* at 3.5, 3.6 and 4.3, and *Für Elise (beginner)* at 3.4 and 4.2. The latter is written in 3/8 with sixteenths the catalogue reads as established, and after L120b it is a sixteenth line like any other.
   - **Each is read at its notation.** If its measured sixteenths survive L120b's corrected reading and ask the reading, it is:
     - moved to the nearest core rung whose path teaches sixteenths (4.4 or later), where it serves that rung's lesson;
     - or replaced with an option that serves the rung's own lesson without them (3.5 is the pedal lesson);
     - or simplified to an arrangement without them.
   - **Never:** widen "taught" to keep a placement (the reviewer); drop the piece from the Library; or force a song onto a rung (rungs are curated).
   - **One option per decision**, each with an evidence line: the notation read, the rung's lesson, and where the option goes and why there.
   - **One fact in every place it is stated.** A lesson that names a moved piece is changed in the same change, as are the stage file and any generator table naming it.
   - Then re-run.

9. **The other ownership lines are repaired only where a lesson's text teaches the demand.**
   - **Which lines:** from the table above, B-claim 43 and B-mapping 67, recounted at L120b's head (L120b moves some). The B-mapping lines are all sixteenths and are resolved by items 2–7, or left with a reason.
   - **Each B-claim group is classified at the lesson text** of the rung at or below that names the demand, never by keyword.
     - A lesson that teaches the demand as a skill gets the claim: at the earliest such rung, one per path, under the claim rule.
     - A lesson that introduces, names or describes the demand gets no claim. Its pairs are re-read as placements, recorded, and not moved here.
   - **Two readings to take with care.**
     - 1.5's text says it "only introduces" the leap (`1.5.md:22-24`), and F2 made that an `introduces`, which never makes a teaching rung (`claims.py:158-160`).
     - A claim on 2.2's *Alouette* paragraph (`2.2.md:43-47`) would move compound time's taught rung on the core from 4.5 to 2.2, for every 6/8 option after it.
   - **A repair that moves a demand's first taught rung on the core path earlier** is held as a Question for the reviewer, not made (the brief's choice; overturnable — such a claim frees every later option on the path at once, and the reviewer ruled on an owner only for sixteenths). The Question carries the sentence it rests on and every option it would free.

10. **The nineteen stay.** Every `READ_NOT_TEACHING` reading stays, unless a lesson's text is substantively rewritten (the reviewer). This lane rewrites none of their lessons. If an edit here touches a listed (rung, demand), say so.

11. **The table, its pin and the record, re-run and recorded.**
   - **The two runs:** after items 2–7 and 9, under `docs/prompts/runs/L120c/after-ownership/`; after item 8, under `after-placement/`. Each run is the offline content build, the app's probe and the table, with a difference file against the previous run: every pair that left or changed class, by demand and rung, and the new summary.
   - **The pin** (L124). `PROBE` points at the final snapshot, `RECORDED_DIFFERENCES` and the count follow it, and the docstring says so. Nothing is forced equal.
   - **D0's record.** The rows the new `taughtAt` removes come out of `untaught_on_rung.json`, each named in the entry. The brief expects every sixteenth row whose rung has 4.4 on its path to go, and those on `classical.4` and `technique.4` to stay. A row added is a finding.

12. **The hypothesis, and what refutes it.**
   - After the ownership run, B-mapping is zero, and every sixteenth pair on a rung with 4.4 on its path has left.
   - What remains for sixteenths is the pre-4.4 core options (until item 8) and the tracks whose paths do not reach 4.4 (`classical.4.shelf`, `classical.4`, `technique.4`), now `C-elsewhere`.
   - **Refuted if:** a sixteenth pair on a rung with 4.4 on its path stays; `taughtAt` derives a second rung that no off-path claim explains; or a pair of another demand moves without a repair from item 9. A refutation is reported with its cause.

13. **Not L120c's:**
   - the other placement lines: the rest of C, the practice floor and `classical.4.shelf` (a later lane, from this lane's final table);
   - app code, the gate, the detectors, `untaught_options.py`'s rules;
   - `latin.7`'s, `holiday.7`'s and 3.5's concepts;
   - L113's split.

## Verification layers

- **Unit, red first.** Written before the content changes, in `tools/content/tests/test_taught_at.py` or a new file beside it. Each case is red on L120b's head:
  - `sixteenth-notes` maps to `rhythm.sixteenths`;
  - its derived teaching rungs are 4.4, with no rung the ancestry puts on 4.4's path;
  - sixteenths are taught at `ragtime.5`–`9`, `technique.6`–`8`, `latin.7`, `holiday.7` and 4.6, and not at 3.5, 4.3, `classical.4.shelf` or `technique.4`;
  - Hanon No. 1 at 4.4 is no longer among the table's lines.
- **The content suite:** `python -m unittest discover -s tools/content/tests -t tools/content`.
- **The builds:** `python tools/content/build.py --offline --out <abs>` for each run. Then `python tools/content/validate.py --allow-nc --personal`, with the `taughtAt` derivation warning clean for `rhythm.sixteenths` and for every demand item 9 repaired, and `python tools/content/review.py --check`.
- **The probe and the table** for each run (item 11).
- **The app:** `npx vitest run` on the rebuilt content. The lesson and curriculum tests read built content, so rebuild before vitest sees an edit. Name the recorded `lessonClaimsAboutApp` pair and any load failure, and rerun those files alone. Then `npm run build:app`.
- **The map:** `python tools/docs/checks_for_paths.py <every path touched>`, and every check it names. Run only the browser specs it names, at two workers on port 4475 through a config copy not for the commit. No port 4173.

## Rules and files

**You own:**
- `content/lessons/4.4.md`, the one addition in item 3, and any lesson that names a piece item 8 moves;
- `content/curriculum/stage-4.json` (4.4's concepts; item 8's placements), `stage-5.json` (`ragtime.5`'s concepts), `stage-6.json` (`technique.6`'s concepts), `stage-3.json` (item 8's placements), and a stage file item 9's classification repairs;
- `content/curriculum/concepts.json`, the new entry;
- `content/curriculum/vocabulary/demands.json` at `rhythm.sixteenths`, and at any demand item 9 repairs;
- `tools/content/claims.py` at `CONCEPT_DEMANDS`, one row;
- the tests named, `tools/content/tests/fixtures/untaught_on_rung.json`, and `docs/prompts/runs/L120c/`;
- the `docs/02`, `docs/03` and `docs/08` rows in the entry's `## Doc rows`.

**Not yours:** `app/src/**`, the detectors, the gate, `untaught_options.py` (its readings stay), `skills.json`, and the concepts of `latin.7`, `holiday.7` and 3.5.

**Deviate** when a premise here is wrong at the line: say so, take the better path and record why (§13). An adjacent problem is recorded and classified, never fixed on the spot.

Base: origin's head at dispatch, which holds L120b's landing; say the sha. Never name an AI model. Never assert a number measured on this machine. No commits. Temp state under the worktree's own `build/`.

Fresh-worktree setup as X31's (Q24):
- `parity_reference.py` and the offline build first;
- copy caches read-only from the main checkout;
- `npm ci` in `app/`;
- snapshot and restore the three files the build rewrites, keeping each one's diff in the run folder.

§11 and §12 apply by reference.

## Report

**Judgement first:**
- the learner-facing words added to 4.4, in full, marked unverified as music;
- what a learner at 3.4–4.3 and on the sixteenth tracks now meets differently, and each moved option's new place with its reason;
- the counts before and after each re-run.

**Then** Done / Not done / Follow-ups / Questions / Files. Every item under *What is decided* is either done or has its own not-done line; technical and pedagogical verdicts are stated apart. After that: every B-claim group's classification, with the sentence it rests on; the red lines; and the tests table.

This is Entry 156: `docs/prompts/runs/L120c/ENTRY.md`, starting `### Entry 156 — L120c`.
