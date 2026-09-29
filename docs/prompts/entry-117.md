### Entry 117 — F2a: the leap taught at 2.1 and the note outside the key at 3.3, where options on those rungs establish them, with 1.5 and 3.1 introducing them and no hand reading left; the practice track walking its own rungs; the practice floor's core prerequisite stopped under "When to deviate", since every Stage 1 choice closes the track for part of Stage 1 (2026-09-29)

A fix-forward on [Entry 108](../../entry-108.md) (F2). It is the reviewer's required change (`docs/review/responses/b41e19e.md`), built on base `02f9862` under the brief `docs/prompts/tasks/F2a-core-truth-and-practice-ancestry.md`.

**Judgement.** I read four things. First, the report regenerated on this tree's build. Second, Today with the learner placed at 1.5 and at 2.1, at 342 × 740, before and after, as pictures and as DOM records of every row and every row's swap sheet (`pictures/f2a/before|after`, `compared.txt`). Third, the five diaries (110 mornings). Fourth, the left hand of 2.1's four hands-together songs, read from their files. Nothing was played or heard, so every musical sentence here is unverified as music.

- **Today at 1.5.** The card is identical before and after: every row and every swap sheet. The rows are the 2nd-or-3rd ear drill, *Steps and Skips in C*, the right-hand five-finger pattern (practice), *Old MacDonald* and sight-reading level 1. The lesson now has one sentence on the leap: "A leap is a 4th or wider: this rung only introduces it, since the songs here have just the odd one, and the next rung practises it, where the left hand moves from C to F and to G." The odd ones are *Old MacDonald* and *The Water Is Wide*, which carry the leap only incidentally.
- **Today at 2.1.** The rows are identical. On the *Ode to Joy* (new) and *Twinkle* (repertoire) rows, the swap sheet's demand tier now reads "Also practises leaps" where it read "both hands together". The option under it is the same one, Mozart's K.331 theme (L2.5). The tier names the first demand 2.1 teaches that the option establishes, and the leap now comes first in that order.
  - 2.1's lesson names the leaps: "Its moves from C to F and from C to G are leaps, a fourth and a fifth, each wider than a skip, and this rung is where you practise them."
  - From the files, the four songs' left hands move C3–G3 and C3–F3.
  - A teacher would recognise I–IV–V roots as a first leap. That judgement is from the notation and is unverified as teaching.
- **The reader, in the diaries.** 8 of 110 mornings changed:
  - The skip learner at 3.1, days 24–30. On day 24 the daily read no longer asks for "a note outside the key"; the reader says the next step waits, and the later phrases differ from there on (a leap is added on day 26).
  - The intermediate learner at 3.3, day 3, in the swap lines only. A new tier, "Also practises the notes outside the key", offers blues scales, a chromatic scale, *Whispering*, *12 Bar Blues* and tremolo drills, because 3.3 now teaches the demand. A teacher might not pick a blues or chromatic scale as a swap in an A minor lesson; unverified as teaching.
- **The practice floor.** `practice.2`–`practice.5` now stand on the practice rung before. The floor's options are read at `practice.1`, where the track first meets them, and there they still read as untaught (Question 1). Today's practice row at 1.5 is unchanged.

**The two parts, before and after** (built on this tree; `census-before.txt`, `census-after.txt`, `census-part1-only.txt`):

| | Before | After |
| --- | --- | --- |
| 1.5 | claims the leap through a hand reading in `taughtAt`; 0 of 9 checked options establish it | introduces `leaps` and claims nothing of it; one lesson sentence |
| 2.1 | makes no leap claim; 6 of 10 options establish it | names `leaps`; the derived and listed teaching rung |
| 3.1 | claims the note outside the key through a hand reading; 0 of 11 options | introduces `accidentals`; one lesson sentence (no song on the rung has one) |
| 3.3 | makes no claim; 4 of 7 options establish it | names `accidentals`; lesson unchanged (it already teaches the raised seventh as an accidental) |
| `demands.json` | leap `["1.5"]`, chromatic `["3.1"]`, two hand-reading notes | `["2.1"]`, `["3.3"]`; both notes removed; no warning on the build |
| `practice.2`–`.5` prerequisites | none | the practice rung before each |
| `practice.1` | its path is Stage 0; 3 rows untaught | unchanged (Question 1) |
| Ancestry | — | only `practice.2`–`.5` changed; no rung off the track stands on a practice rung |

**The census** (the report's functions on the built content):

| | Before | Part 1 alone | After (both parts) |
| --- | --- | --- | --- |
| Checkable claims / not established / established | 546 / 314 / 232 | — | 550 / 304 / 246 |
| Rung claims kept by no option | 7 | — | 5 (the five deferrals) |
| Concepts introduced | 1 | — | 3 |
| Untaught rows (all) | 349 | 353 | 347 |
| Notated untaught rows (distinct items) | 253 (238) | 254 (239) | 251 (239) |
| Notated rows with the leap untaught / with the note outside the key untaught | 6 / 10 | 16 / 19 | 16 / 19 |
| Generated combinations (D0's record) | 91 | 95 | 91 (4 gone, 4 new; `record-moves.txt`) |

- **Part 1 alone gives 253 → 254**, as F2's S4 predicted.
- **The chain takes three notated rows off.** `practice.2`'s study and *Ode to Joy*, and `practice.5`'s *Ode to Joy*, are now read at `practice.1`.
- **Where the new leap and accidental rows are** (`census-rows-compared.txt`):
  - 1.5: *Old MacDonald* and *The Water Is Wide*.
  - 3.1: the A blues pentatonic.
  - Tracks whose paths leave the core before 2.1: `holiday` (six rows, *Jingle Bells* hands together new) and `hymns.2` (four).
  - Tracks whose paths leave the core before 3.3: `blues.3` (three blues scales new, three songs), `hymns` (three) and `jazz.3` (three).
- **Per-track counts outside the practice track:** equal with and without the chain. From Part 1, `blues-boogie` goes 13 → 16 and `holiday` 25 → 26.

## Done

1. **The core's teaching truth (item 1).**
   - Technically: the stage files hold the lists as above. `taughtAt` is the E0b derivation, and `teaching_rungs` now gives exactly `["2.1"]` and `["3.3"]` (before, it gave blues.7, ragtime.9 and technique.4). The validator prints no taught-at warning. No option was added anywhere.
   - `accidentals` had no entry in `concepts.json`, since the vocabulary skill was new because no concept named it. I added one (display name and finder), because the validator refuses a concept without one. `chromatic` would have named chromatic movement, the wrong fact.
   - Pedagogically: the three sentences say what each rung does, and each was checked against the notation and the report (the songs' leaps and the left hand's moves; 3.1's songs with no note outside the key). They are unverified as teaching.
2. **The consequences held (item 2).** The build's path cases and the app's cover the same ground:
   - An option carrying the leap is untaught at 1.4, 1.5 and on `holiday`, and taught from 2.1.
   - An option carrying the note outside the key is untaught at 3.1, 3.2 and on `blues.3`, and taught from 3.3 and at `technique.4`.
   - `targetDemandsFor` moved from 1.5 and 3.1 to 2.1 and 3.3.
   - The reading hold: row 2 opened from 1.5 holds its leaps out, and row 4 opened from 3.1 holds its accidentals out.
   - `sightReadingPromises` is green with `PROMISED_OFF_THE_PATH` still empty.
   - The census is above.
   - **The generator contract's declaration (the same fact in a third place; added to this seam's files by the coordinator).**
     - `UNREALISABLE_AT` in `app/src/engine/readingControls.ts` declared the leap unrealisable at 1.5 and 2.1, because "1.5 teaches the leap in its song".
     - After the data change, `generatorContract` went red: "declared, but the move is made (or never asked): `['1.5 interval.leap on']`". At 1.5 nothing asks for the leap any more.
     - The entry now names 2.1 alone, where the reader's row is still 1.5's level-1 row and its "only steps and skips" promise holds. Its reason says so.
     - `docs/05` line 751's table row says the same.
     - The reader reads only the rung list, never the reason's words (`session.ts:2187`), so nothing learner-facing changed.
     - `generatorContract` is green: 21 passed.
3. **The practice track's ancestry (item 3), its track half.** The four prerequisites are in place, and D21's three exercise options still hold on every practice rung. No other track's ancestry or counts changed. `taughtAtRung` reads the new walk (the unit case), and the build and the app agree on every rung's ancestry (the existing case, green on the new build). The fallback ladder's prerequisite step reads `prerequisites` directly (`session.ts:978`), so for `practice.2` it would now draw `practice.1`'s options. That is inferred from the code and not exercised. The core half is Question 1.
4. **Record (item 4).**
   - The rung-claims report and the inventory were regenerated (`build.step_reports`, after the D0 record was rewritten).
   - D0's record was rewritten from the report's functions, after a byte round-trip check (`roundtrip.txt`).
   - `docs/02`: Part C 1.5, 2.1, 3.1 and 3.3; the practice module; D8a's ancestry note. Two sentences outside C and D stated the replaced model, so they were revised too: E2's F2 note on the hand readings and Part H's declared-gap sentence.
   - `docs/05` line 751, as above.
   - The diaries were rerun and compared (`diaries-compared.txt`), with every changed morning explained above. After the `UNREALISABLE_AT` change, all five diary files are byte-identical to that run (`cont-diaries.txt`).
   - `SOURCES.md` was not rewritten by the builds.

## Not done

- **`practice.1`'s core prerequisite and `practice.3`–`.5`'s core rungs (item 3's core half).** Stopped under "When to deviate", and left as it is (none) on the coordinator's decision: the choice sets truthful ancestry against D8a's practice row from Stage 1, so it goes to the reviewer. See Question 1.
- **Known local-only failures, not this seam's.** Two `lessonClaimsAboutApp` assertions match a literal LF in `ScoreScreen.ts` and `style.css`, which are CRLF in this checkout; they have been recorded since D0 and are green in CI:
  - `the 2026-09-19 lesson corrections, second-read and under test: the app > blues.3: the rung carries two tool buttons, the lab and Simon, and Rhythm only is not one of them`
  - `… > 4.7: blind hides the score and the cursor and leaves the count-in and the beat dot`

## Follow-ups

- **P2, claims on the tracks that lost the hand readings' credit.** Five of `holiday`'s nine options establish the leap, its carols with 2.1's C–F–G left hand, and six of `blues.3`'s twelve establish the note outside the key (the blue notes its `blue-note` concept names). Both now read the demand as untaught on their own paths. Naming it there (`leaps` on `holiday`; `accidentals` on `blues.3`, or `blue-note` mapped in `claims.CONCEPT_DEMANDS`) would make each its path's teaching rung, as E0b did for `holiday`'s hands together. That is a claim decision.
- **P2, two meanings under one id.** The `leaps` concept names both the reading leap (a fourth or wider, 2.1) and the jump at `blues.7` and `ragtime.9` (its finder: "leaps of an octave or more", "advanced, Grade 5 to 6"). `buildConcepts` reads lesson concepts in stage order, so the Skills screen's Leaps entry should now open at Stage 2, next to oom-pah and stride exercises at levels 4.2–7.3 and that finder. This is inferred from the code; the Skills screen was not looked at. A separate id for the technique jump would settle it (`claims.py` and `concepts.json`).
- **P3, the new entry's finder.** The Skills screen gains an Accidentals entry (3.3) whose finder is new. Not looked at.

## Questions

1. **Where does the practice floor stand on the core?**
   - The floor holds 1.1's material (the five-finger pattern, *Ode to Joy*, the five-finger drill), 1.2's rhythm drill and 1.5's steps-and-skips study. The one prerequisite that makes all of it taught on `practice.1`'s path is 1.5.
   - The mechanism: `strandsOf` opens a track rung only once each of its prerequisites is met, set aside or behind the placement (`session.ts:587–590`). The rung the learner stands on is none of these.
   - Measured in a session build (`question-practice-opens.txt`):
     - As shipped, the practice row is there at 1.1, 1.2 and 1.5.
     - On 1.1, it is gone at 1.1 and there at 1.2 and 1.5.
     - On 1.5, it is gone at all three. As today, there is none for a learner placed at 2.1, where the placement puts the track behind.
   - The report (`question-practice-scenarios.txt`):
     - 1.1 leaves one row, the study's skips on `practice.1`, which is true for a learner at 1.2–1.4.
     - 1.5 clears the floor.
     - Either leaves every other track's counts equal.
   - `docs/02` D8a says the track runs "from Stage 1", so this is a product choice:
     - (a) 1.5: the report is clean, and there is no practice track in Stage 1.
     - (b) 1.1: the track opens at the second rung, and the study's skips stay reported, truthfully.
     - (c) No core prerequisite. The study's place on the floor is settled by the practice lists' decision (L112). The five-finger and *Ode to Joy* rows then stay: they read untaught only because a Stage 1 track rung's ancestry stops at Stage 0, while a learner there stands on 1.1, which the app's gate counts as reached.
   - **Recommendation: (b).** How to practise is worth having from the first pieces, the delay is one rung, and the row left is true. D8a would need to read "from the second rung of Stage 1".
   - **The one-line change that would apply (b):** in `content/curriculum/stage-1.json`, `practice.1` gains `"prerequisites": ["1.1"]` after its `requirements`, as `practice.2`–`.5` carry theirs. The consequences would then follow:
     - `test_taught_at`'s and `taughtByAncestry`'s practice cases gain the 1.1 case.
     - F2's `today.spec` floor case stays true at 1.5.
     - D8a's sentence changes.
     - D0's record loses the combinations measured in `question-practice-scenarios.txt`.
   - The same clause stopped `practice.3`–`.5`'s "core rung its material assumes". That would be 2.1 for the both-hands five-finger pattern and 3.6 for the level-4.1 contrary scale, which would close those rungs until Stage 2 or 3.

## The red lines

Each was seen on the committed data, or on the baseline build, before the change it proves (`red-content.txt`, `red-app.txt`, `red-generator-contract.txt`):

- **`test_taught_at`, 12 red.** Among them:
  - `'leaps' not found in [] : 1.5 introduces the leap`.
  - `['blues.7', 'ragtime.9'] != ['2.1']`.
  - `Lists differ: ["WARNING (taught at, E0b): demand interva…"] != []`.
  - `pitch.chromatic at 3.1, which introduces accidentals: no note makes it a teaching rung; got []`.
  - `holiday`'s `[] != ['interval.leap']`.
  - `'practice.1' not found in []` for `practice.2`–`.5`.
  - `'practice.2' unexpectedly found` among the first listings.
- **`test_measured_truth.TestPlacementReconciled`, 9 red:**
  - `('demand', 'interval.leap') unexpectedly found … : 1.5 claims no leap`.
  - The same for 3.1's `pitch.chromatic`.
  - The kept-by-none set holding the two hand readings.
  - `None != ['practice.1']` and the other prerequisite cases.
  - `practice.2`'s and `practice.4`'s rows still read untaught there.
- **`taughtByAncestry`, 5 red:**
  - `interval.leap at 1.5, which introduces it: expected true to be false`.
  - `pitch.chromatic at 3.1 …: expected true to be false`.
  - `targetDemandsFor` at 1.5 `expected [ 'interval.leap' ]`.
  - `row 2 opened from 1.5: interval.leap not held out: expected undefined to be false`.
  - `practice.2 stands on practice.1: expected false to be true`.
- **Reds after the change, which name the old model:**
  - `composedContract`: `3.1 did not reach {"hands":"both","dottedQuarters":true,"ties":true,"fifths":[1,-1],"accidentals":true}`. The pin was revised.
  - `generatorContract`, on F2a's data with `UNREALISABLE_AT` unchanged: `declared, but the move is made (or never asked): expected [ '1.5 interval.leap on' ] to deeply equal []`, 1 of 21 failed. It went green after the declaration change.

## Tests touched

| Test | Class | Old assumption | Now |
| --- | --- | --- | --- |
| `test_taught_at.py` › `test_a_hand_reading_the_note_writes_down_warns_instead` | revise | the committed 3.1 is a hand reading | built on 3.2, warned or failed by its note; 3.1, which introduces accidentals, refused whatever its note |
| › `test_the_committed_lists_are_the_lessons_readings` | revise | two warnings (1.5's leap, 3.1's accidentals) | none; `["2.1"]`, `["3.3"]`; no note reads 1.5 or 3.1 by hand |
| › `test_the_rungs_whose_concepts_name_a_demand_one_per_path` | revise (two lines) | — | the derivation gives 2.1 and 3.3 |
| › `TestTheCoreTeachesWhereAnOptionEstablishes` (3), `TestThePracticeTrackWalksItsOwnRungs` (3) | add | — | untaught after the introduction and taught from the teaching rung, on the core and on `holiday` and `blues.3`; the chain, no rung off the track on it, the first listings |
| `test_measured_truth.py` › `TestPlacementReconciled.HAND_READINGS`, `test_every_claim_no_option_keeps_is_accounted_for` | revise | two stopped hand readings among the claims no option keeps | empty: introduced or deferred |
| › `test_the_leap_is_introduced_at_1_5…`, `test_accidentals_are_introduced_at_3_1…`, `test_the_practice_track_walks_its_own_rungs_and_keeps_its_floor` | add | — | the report's introduced and claimed rows, the lesson sentences, D21's three on every practice rung, `practice.2`/`.4` read nothing untaught |
| `fixtures/untaught_on_rung.json` | revise | 91, `practice.2`/`.4` five-finger combinations | 91: those 4 gone, 4 new (`blues.3`, `holiday`, `hymns.2`, 3.1) |
| `taughtByAncestry.test.ts` › `the core teaches the leap at 2.1 and the note outside the key at 3.3 (F2a)` (5) | add | — | as in Done 2, and the practice chain in the app's ancestry |
| `composedContract.test.ts` › `it reaches accumulated recipes…` | revise | the diary's 3.1 recipes carry `accidentals: true` | the diary's recipes now; no 3.1 recipe asks for accidentals |
| `generatorContract.test.ts` › `the moves that cannot be made are exactly UNREALISABLE_AT, with its reasons` | preserve (the declaration it reads changed, not the test) | — | red on F2a's data while `UNREALISABLE_AT` named 1.5; green with 2.1 alone |
| every other test run | preserve | — | see the runs |

## Checks (unpiped; `runs/F2a/`)

| Run | Exit | What it said |
| --- | --- | --- |
| `npm ci`; the copies; `parity_reference.py` | 0; robocopy 1 each; 0 | eight reference files |
| content build, baseline / after | 0 / 0 | "546 checkable claims on 1015 options: 314 not established, 7 kept by no option" / "550 … 304 … 5"; validation OK |
| `build.step_reports` after the record rewrite | 0 | the record and the build match |
| diaries, before / after | 0 / 0 | 25 passed each; 8 of 110 mornings differ |
| content reds (`test_taught_at`, `TestPlacementReconciled`) | 1, 1 | the red lines |
| app red (`taughtByAncestry`) | 1 | 5 failed |
| `test_taught_at`, `test_measured_truth`, `test_validate_claims`, `test_technique_units`, `test_measured_demands` (the record's other reader) | 0 each | 24, 57, 11, 7, 8 OK |
| `validate.py` | 0 | OK; warnings: the rung-claims line and the five deferrals, no taught-at warning |
| `review.py --check` | 0 | — |
| `npx tsc -b`; `eslint` on the two touched test files (before the `UNREALISABLE_AT` change) | 0; 0 | — |
| unit, before the `UNREALISABLE_AT` change: `taughtByAncestry`, `sightReadingPromises`, `lessonClaimsAboutApp`, `lessonShape`, `generatorContract`, `readerMovesTheDemand`, `materialLayer`, `alternativesShareASkill`, `lessonClaimsAboutMusic` | 1 | 609 passed, 3 failed: `generatorContract` (the declaration, since fixed) and the two known local-only `lessonClaimsAboutApp` assertions |
| `composedContract` (revised pin) | 0 | 6 passed |
| `generatorContract` with the needed patch as a probe | 0 | 21 passed; restored, then applied for real below |
| `npx vitest run tests/unit/generatorContract.test.ts`, before the declaration change (`red-generator-contract.txt`) | 1 | 1 of 21 failed: `1.5 interval.leap on` declared and never asked |
| after the `UNREALISABLE_AT` change and `docs/05` line 751: `npx vitest run tests/unit/generatorContract.test.ts` (`cont-generator-contract.txt`) | **0** | 21 passed |
| `npx vitest run` `taughtByAncestry`, `sightReadingPromises`, `lessonClaimsAboutApp` (`cont-named-units.txt`) | 1 | 362 passed, 2 failed: exactly the two known local-only `lessonClaimsAboutApp` assertions named under Not done |
| the two diary files (`cont-diaries.txt`) | 0 | 25 passed; all five diaries byte-identical to the after run |
| `composedContract`, which imports `UNREALISABLE_AT` (`cont-composed-contract.txt`) | 0 | 6 passed |
| `npx tsc -b` (`cont-tsc.txt`) | 0 | — |
| `npm run lint`, the whole app with `--max-warnings=0` (`cont-lint.txt`) | 0 | — |
| `npm run build:app`, before state / after | 0 / 0 | — |
| look, before / after, port 4253 | 0 / 0 | 2 passed each; nothing on 4253 before either run, nor after the last |
| `today.spec.ts`, port 4253, one worker | **0** | **17 passed** (F2's floor case among them) |

## Unverified, beside what passes

1. **Nothing was heard.** The three lesson sentences and the leaps in 2.1's left hand are from the notation and the detectors, and are unverified as music and as teaching.
2. **Not looked at:** the rung pages of 1.5, 2.1 and 3.1, where the sentences show; the Skills screen; Today anywhere but at 1.5 and 2.1.
3. **The "before" pictures were served from the committed vocabulary and the baseline build's curriculum**, swapped in and restored byte for byte, rather than from a rebuilt tree. The catalogue is the same in both states. The "before" DOM record does not name the swap options, but the 2.1 demand option is inferred to be the same one, since each sheet had one demand option.
4. **The full unit, content and browser suites were not run** (the brief's rule), and CI is the full run.
   - `today.spec` and the look ran before the `UNREALISABLE_AT` change. The change alters only which rungs the reader skips a leap move at (1.5 no longer listed, where nothing asks for one), so the specs are inferred unaffected. They were not rerun.
   - Other unit files also read `taughtAt` or the built curriculum and were not run: `gateAtTheConsumers`, `eligibility`, `session`, `sightReadingDistribution`, `readingState`, `fallbackOrder`, `parallelStrands` and `recommendRespondsToEvidence` among them. They are unchecked, so a red there is possible and not ruled out.

## Files

In the worktree, uncommitted and not added to the index:

- **Changed:**
  - `content/curriculum/stage-1.json`, `stage-2.json` and `stage-3.json`, re-serialised after a byte round-trip check (identical).
  - `content/curriculum/concepts.json` (`accidentals`; also round-trip identical).
  - `content/curriculum/vocabulary/demands.json`, spliced as text.
  - `content/lessons/1.5.md`, `2.1.md` and `3.1.md`.
  - `tools/content/tests/test_taught_at.py`, `test_measured_truth.py` and `fixtures/untaught_on_rung.json`.
  - `app/tests/unit/taughtByAncestry.test.ts` and `composedContract.test.ts`.
  - `app/src/engine/readingControls.ts`, at `UNREALISABLE_AT`'s leap entry only (rungs and reason).
  - `docs/02-curriculum.md`.
  - `docs/05-score-follow-engine.md`, line 751 only.
  - `docs/prompts/rung-claims.md` and `inventory.md` (regenerated).
- **Outside the brief's list, and why:**
  - `concepts.json`: a named concept needs an entry.
  - `composedContract.test.ts`: it pinned the replaced model.
  - `docs/02`'s E2 and H sentences: they stated the replaced model.
  - `readingControls.ts` and `docs/05`: the same fact in a third place. They were added to this seam's files by the coordinator's decision on the report.
- **Captures:** `docs/prompts/runs/F2a/`, with `*.txt` summaries beside raw `*.log`s. Among them:
  - The census (before, after, Part 1 alone, the rows compared).
  - The question's scenarios and probe.
  - The record moves; the diaries before, after and compared.
  - The red lines; `needed-readingControls.patch`.
  - Pictures in `docs/prompts/pictures/f2a/before|after` (Today at 1.5 and 2.1, full page, swap sheets, DOM records) and `compared.txt`.
  - The override config, look spec and probe in `app/.probe/` (gitignored).

**Orchestrator's note at the landing (2026-09-29).** F2a's worktree committed by name (fc91e5a) and merged (067d49a) over E-tail, U74, Q-tooling, G1, E2a, Q47 and F2. The brief withheld all app code, and the same fact lived in a third place: the generator's `UNREALISABLE_AT` still named the leap at 1.5, so `generatorContract` was red; the builder was sent back with that one entry and the `docs/05` line added to its list, applied its own patch red-first, and the file list here is the whole truth. `practice.1`'s core prerequisite is left as none on the orchestrator's decision: the builder measured that 1.5 as the prerequisite closes the practice track for all of Stage 1 and 1.1 for a learner at 1.1, against D8a's "from Stage 1", so the choice sets two product rules against each other and goes to the reviewer (the builder recommends 1.1 with the one-line change written out). The chain on the merged main checkout: the content build offline (the reports rewritten and compared), the validator, the record check, the whole content suite, typecheck, lint, the whole unit suite, the app build, and the Today, start-and-return, plan, placement-branches, lesson-flow and lesson-tools specs on the default port (content-build 0; content-validate 0; review-check 0; content-tests 1; tsc 0; lint 0; content-tests-rerun 0; vitest-all 1; build-app 0; e2e-targeted 0; vitest-vocabulary-rerun 0 — the content suite's one failure was `test_excerpt_proposer`'s gate case, whose premise (the leap taught at 1.5, so a right-hand window with leaps at 1.5 has nothing untaught) is the truth F2a moved; revised at the landing to the new truth (untaught at 1.5, nothing untaught at 2.1) and rerun green (`content-tests-rerun`) — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; its third failure was `vocabulary.test.ts`'s rule that a skill marked `newId` has no concept of its id — F2a added the `accidentals` concept, so the `accidentals` skill's `newId` flag and its note ("new because no concept names it") were the same fact in a third place, aligned at the landing by a text splice of `skills.json` and rerun green (`vitest-vocabulary-rerun`); `runs/F2a/orchestrator-exit.txt`). The three lesson sentences and the 3.3 swap tier that offers blues and chromatic scales for an A minor lesson are unverified as teaching; nothing heard. The doc rows for `docs/08` are in the entry.


## Test map rows for docs/08

The F2 row's status cell: replace " with two questions open: 1.5's leap and 3.1's accidentals stay hand readings, warned;" by "; F2a (Entry 117): 1.5 and 3.1 introduce the leap and accidentals and 2.1 and 3.3 teach them, the practice track walks its own rungs, its core prerequisite an open question;".

File lines:

- `taughtByAncestry.test.ts`: append "and since F2a the leap at 2.1 and the note outside the key at 3.3 (untaught at 1.5, 3.1, 3.2, `holiday`, `blues.3`), `targetDemandsFor` and the reading hold there, and the practice track's chain".
- `test_taught_at.py`: append "since F2a no hand reading is left (the leap `["2.1"]`, the note outside the key `["3.3"]`), the path cases on the core, and the practice chain touching no other rung".
- `test_measured_truth.py`: append "and since F2a the leap and accidentals introduced at 1.5 and 3.1 and taught where 2.1's and 3.3's options establish them, and the practice track's D21 floor".
- `composedContract.test.ts`: append "3.1's diary recipes carry no accidental since F2a (3.3 teaches it)".
- `generatorContract.test.ts`: append "since F2a the leap-on declaration names 2.1 alone (1.5 only introduces the leap)".
