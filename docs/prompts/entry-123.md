### Entry 123 — F2b: `practice.1` stands on 1.1, so How to practise opens from the second rung of Stage 1 and its false untaught rows are gone; the beginner's leap (a fourth or fifth, introduced at 1.5, taught at 2.1) is its own concept `leap`, split from the advanced `leaps` ("Wide leaps", an octave or more, on `blues.7` and `ragtime.9` only), with the detector reading both as the one leap demand (2026-09-29)

A fix-forward that finishes F2a ([Entry 117](../../entry-117.md)). It is the reviewer's required change (`docs/review/responses/fc91e5a.md`, both parts), built on base `76d557a` under the brief `docs/prompts/tasks/F2b-practice-floor-and-the-two-leaps.md`. Captures are in `docs/prompts/runs/F2b/`: each `.txt` starts with its command and ends with `exit=<code>`. Pictures are in `docs/prompts/pictures/f2b/`.

## Judgement

I looked at the Skills screen at 342 × 740, filtered to Stage 2 and to Stage 7, before and after, with each entry's finder sheet open. I also looked at Today with the learner placed at 1.1 and at 1.2 (after only). The text of every entry, sheet and row is recorded in `before-look.txt` and `after-look.txt`. Nothing was played or heard.

- **What a learner at 2.1 reads when they open the leap entry.**
  - **Before:** one entry, "Leaps", filed under "Stage 2, 7, 9" and "Taught in Hands together: the left hand holds". Its Drill it opened the oom-pah bass at the octave (L4.2), with "Show all 12", which includes the stride exercises at L7.3. Its finder asked for "advanced, Grade 5 to 6" and "leaps of an octave or more".
  - **After:** "Leaps: a fourth or fifth", filed under "Stage 2 · core · 0 to practise", "not judged by the app", "Taught in Hands together: the left hand holds". Its finder reads "What this needs: reading and playing a jump of a fourth or fifth without feeling for it", "Level: easy, elementary", must have "a few leaps of a fourth or fifth in a stepwise melody", avoid "octave leaps". Nothing on the entry or its sheet speaks of an octave or more, or of a Grade.
  - **The advanced jump:** its own entry, "Wide leaps", filed under "Stage 7, 9 · blues-boogie, ragtime". It says "Taught in The leaping left hand and the two bars that send you back", and keeps its twelve oom-pah and stride exercises and its finder (Grade 5 to 6, octave or more).
  - Over every stage, exactly two entries have "leaps" in their name, and neither is called just "Leaps".
- **A teacher's reading, from the notation and the words (unverified as teaching).** A fourth or fifth in a stepwise tune is the right first leap, and it is what 2.1's left hand does (C to F, C to G). A stride jump belongs years later. So the entry a 2.1 learner meets now describes their skill.
  - The beginner entry has nothing to drill ("0 to practise", Find more only). That is honest: before, the one drill it offered was the advanced one.
  - No catalogue item carries the new concept. Follow-up 2.
- **Is the practice row on Today at 1.1 and at 1.2?**
  - At 1.1 it is absent. The card is 1.1's own: the right-hand five-finger walk (warm-up), note flash (review), *Hot Cross Buns* (new), *Mary Had a Little Lamb* (repertoire).
  - At 1.2 it is there: "C major five-finger pattern — right", "How to practise asks for it", in the New slot.
  - The session case holds both, and 1.5 unchanged (F2's floor case), and none at 2.1.
  - **Observation, not F2b's:** at 1.2 the practice row takes the day's New slot with 1.1's pattern, so 1.2's own new material is not the New row on a 30-minute card. This is the strands' order (F2, C6), not the prerequisite. Follow-up 4.

**Mechanism.**

- **Part 1.** `practice.1` had no core prerequisite, so the ancestry walk (`claims.rung_ancestry`, `session.rungAncestry`) stopped its path at Stage 0. The floor's 1.1 material therefore read as untaught, although a learner there stands on 1.1.
  - The test that tells this cause apart: a rung's path, and what it has taught. `test_the_floor_stands_on_1_1` went red with `None != ['1.1']` and `taughtByAncestry` with `practice.1's Stage 1 path: expected [] to deeply equal [ '1.1' ]`.
  - The change is the prerequisite itself, and the gate (`strandsOf`) and the report both follow from it.
- **Part 2.** One concept id carried two meanings. The Skills screen builds one entry per id (`buildConcepts`) and takes its name and finder from `concepts.json`. So whatever id 2.1 named decided what the 2.1 learner read.
  - The change gives the beginner's meaning its own id.
  - It also teaches the claims layer that the new id is the leap demand (see "The brief's premise, tested").

**The orchestrator's hypothesis, tested before any change.** The hypothesis: no rung below Stage 4 names the advanced `leaps`. The refuting test is to list every rung that names it (`grep -rn '"leaps"' content/curriculum`).

- The rungs were `1.5` (`introduces`), `2.1` (`concepts`), `blues.7` and `ragtime.9` (`concepts`), and `concepts.json`'s own entry.
- The only Stage 1–3 rungs naming it were 1.5 and 2.1, the beginner meaning. The hypothesis stands.
- 1.5 and 2.1 moved to `leap`; `blues.7` and `ragtime.9` keep `leaps`.
- No technique rung below Stage 4 names it, so "When to deviate"'s first clause had nothing to act on.

**The brief's premise, tested and refuted.** The premise: `demands.json`'s `taughtAt` "re-derives to `["2.1"]` unchanged" with `claims.py` untouched. The test: rename 2.1's concept and run `test_taught_at` before touching `claims.py` (`red-premise-claims.txt`). It went red:

- The validator refused 2.1 as the leap's teaching rung: `vocabulary: demand interval.leap is taught at '2.1', whose concepts name none of leaps, and its taughtAtNote does not name 2.1 with the reading`.
- The derivation fell back to `['blues.7', 'ragtime.9']`.
- The content build would have failed.

The reason: the concept-to-demand map lives in `claims.CONCEPT_DEMANDS`, and the brief withheld that file. I added one line, `"leap": "interval.leap"`, with a comment, and kept `"leaps": "interval.leap"`. Keeping it holds the census exactly, as the brief expected.

## Done

1. **`practice.1` on 1.1 (item 1).**
   - **Technical.**
     - `stage-1.json`: `practice.1` gains `"prerequisites": ["1.1"]` after its `requirements`, spliced as text (`splice_item1.py`, three lines added, CRLF kept).
     - Every practice rung's path now holds 1.1 and no later Stage 1 rung, in the build and in the app (the ancestry-equality case is green).
     - `practice.2`–`.5` stay chained through the practice rung before.
     - The named cases:
       - `test_taught_at`'s practice case gains the 1.1 ancestry. Steps are taught on the floor; the study's skips are untaught there and taught at 1.5.
       - `taughtByAncestry` is its app-side twin.
       - F2's `today.spec` floor case at 1.5 is unchanged and green.
       - The session-build case (practice row absent at 1.1, there at 1.2, the same at 1.5, none at 2.1) is written in `taughtByAncestry.test.ts` without `session.ts`.
     - D0's record loses the four step combinations F2a's 1.1 scenario measured (`question-practice-scenarios.txt`: `practice.1`, `practice.3` and `practice.5` five-finger steps, `practice.5` scale steps). Spliced as text (`splice_record.py`); the report says the record matches.
   - **Pedagogical.** The floor's five-finger pattern, *Hot Cross Buns* and *Ode to Joy* are now read at 1.1, which teaches them. The one untaught row left is the study's skips, which is true for a learner at 1.2–1.4. How to practise waits one rung, which is D8a's new wording. Unverified as teaching.
2. **Two concepts, one meaning each (item 2).**
   - **Technical.**
     - `concepts.json` gains `leap` ("Leaps: a fourth or fifth"), with the finder, level words, constraint, avoid and shared formats line the brief decided, in id order before `leaps`.
     - 1.5's `introduces` and 2.1's `concepts` name `leap` (`splice_item2.py`).
     - `leaps` keeps its id, finder and Grades 5–6 words. It is named on `blues.7` and `ragtime.9` only, the technique rungs that named it.
     - `claims.CONCEPT_DEMANDS` maps both ids to `interval.leap`, so `teaching_rungs` gives `["2.1"]` and `demands.json` is untouched. The skill vocabulary is untouched.
     - The validator prints no taught-at warning.
     - The browser case (`plan.spec.ts`, "the two leaps on Skills (F2b)") shows:
       - the entry filed under Stage 2 is the fourth-or-fifth one, taught in 2.1;
       - its sheet never says "octave or more" or "Grade";
       - the advanced entry is not filed under Stage 2;
       - the advanced entry opens its own finder from Stage 7;
       - both names are read whole at 342;
       - across all stages, the entries with "leaps" in their name are exactly the two.
   - **The advanced entry's name** was my call; the brief fixed only the beginner's.
     - A bare "Leaps" beside "Leaps: a fourth or fifth" reads as the general entry. So I first gave it "Leaps: an octave or more".
     - The look showed that name cut to "Leaps: an o…" beside Drill it and Find more (`pictures/f2b` at the first after-run; the red `the advanced name is cut beside Drill it and Find more`, `red-name-cut-e2e.txt`).
     - It is now "Wide leaps" (`splice_item2b.py`), which is read whole there. The finder still says "leaps of an octave or more".
   - **Pedagogical.** As in the judgement. "Wide leaps" as a teacher's name for an octave-or-more jump is unverified as teaching.
3. **The consequences held (item 3).**
   - The census before and after (below): item 1 removes exactly the practice track's false rows; item 2 changes no count.
   - The five diaries were rerun and compared: all five byte-identical (`diaries-compared.txt`).
     - No diary learner stands on 1.1–1.5 (they cover 2.2–4.6), so item 1 has no morning there to explain.
     - Its mornings at 1.1, 1.2 and 1.5 are the session case and the Today pictures.
   - The rung-claims report and the inventory were regenerated by the build.
     - `rung-claims.md` changes by exactly the practice rows and the record line.
     - `inventory.md`'s content is unchanged; its working copy differs from the index only in line endings.
     - `SOURCES.md` was not rewritten.
4. **Record (item 4).** `docs/02` changes:
   - D8a: its heading, its opening sentence, and a paragraph "The floor on 1.1".
   - The practice-module sentence near line 440, both places now reading "from the second rung of Stage 1".
   - Part C at 1.5 and 2.1, which name the concept and the split.
   - The doc rows for `docs/08` and `docs/03` are at the end. `docs/03` has no concept table; its excerpt-concept rule changes by one clause.
5. **Consumers checked.**
   - The excerpt candidate report (`excerpts.candidate_rungs`) marks a claim reached through a demand several concepts share with `sharedBy`. The leap is now such a demand.
     - Its seven lines at `blues.7` and `ragtime.9`, all through `concept leaps`, now carry `sharedBy: ['leap', 'leaps']` (`leap-candidates.txt`). None reaches 2.1.
     - That note is true: those excerpts' fourths are not the octave-or-more jump those rungs mean.
     - `test_measured_truth`'s case that held the left-hand pattern to be the only shared demand was revised to hold every shared demand to its concepts (red first: `red-sharedby-measured-truth.txt`).
   - `excerpts.concepts_for` now names no concept for an excerpt targeting `interval.leap`. `excerpts.json` has no such target, so nothing built changed.
   - The Skills screen lists every concept in `concepts.json` (`unmeasuredConceptsSaySo`, green): `leap` shows "not judged" and "Taught in Hands together: the left hand holds".

## Not done

- **The literal collision case ("no two displays collide" over all of `concepts.json`), written as scoped.** It is red on the committed data for ten pre-existing pairs that F2b does not own. Each pair is two ids sharing one name, both named by lessons, so Skills lists two entries under one name. The pairs: `alberti`/`alberti-bass`, `broken-chord`/`broken-chords`, `call-and-response`/`call-response`, `contrary`/`contrary-motion`, `key-signature`/`key-signatures`, `open-voicing`/`open-voicings`, `slash-chord`/`slash-chords`, `sus`/`sus-chords`, `CC64`/`sustain-pedal`, `trill`/`trills`.
  - The case instead asserts that neither leap entry shares a name with anything, that none is called just "Leaps", and that the shared names are exactly the recorded ten. It fails on a new collision, or on one of the ten being fixed without the line.
  - Merging them is Follow-up 1.
- **The full browser suite** was not run (the brief's rule; CI is the full run). The four named specs were run.
- **Known local-only failures, not this seam's.**
  - The two `lessonClaimsAboutApp` line-ending assertions (Entry 101), `blues.3` and `4.7`.
  - In the full unit run, five tests failed only under load and pass alone (`vitest-rerun-five.txt`). Their files are `expectedNote`, `firstContactOnTheScore` (two), `libraryImportWords` and `simonTurnCue`; none reads the practice track or a concept.
  - In the content suite:
    - Two errors were `No space left on device` (`test_finder`, `test_family_contracts`' mutation census); both pass on rerun (`content-rerun-disk.txt`).
    - `test_checks_for_paths` fails because the test map's `app/tests/fixtures/**` e2e set does not name `import-experience.spec.ts`, which X3 (`070a6f7`) added as a reader. Pre-existing and outside F2b's files. Follow-up 5.

## Follow-ups

1. **P3, ten concept names shared by two ids, each listed twice on Skills** (the list above). A curriculum-data decision per pair: merge the ids across lessons and generators, or give each display its own words. The recorded list in `test_taught_at.TestTheTwoLeapsAreTwoConcepts.KNOWN_COLLISIONS` shrinks as each is settled.
2. **P3, the beginner leap has nothing to drill.** No catalogue item carries `leap`.
   - 2.1's generated coordination exercises with a changing left hand (C / G, Part C) are the nearest candidates; Skills lists exercises, never songs. Whether they carry the leap at density, and tagging them, is the generator's concept list (`generate_exercises.py`), a claim decision.
   - Once the row gains a Drill it button, "Leaps: a fourth or fifth" will be cut at 342 the way "Leaps: an octave or more" was. The Skills title is one line with an ellipsis (`style.css` `.list-row__title`), where Plan and the Library clamp to two lines. Many Skills names are already cut ("Shifting pos…"): a UI row for the Skills screen.
3. **P3, `00-tracks.json`'s practice description** says it "Runs alongside everything else from Stage 1". That is true at the stage's grain, and D8a now says the second rung. Aligning the words is a one-line data change outside F2b's files.
4. **P2, for X1 or the chooser: on a 30-minute card at 1.2 the practice row takes the New slot** with 1.1's five-finger pattern (the strand played least lately goes first). 1.2's own new material is then not the day's New row. Observed at 1.2 only.
5. **P3, the test map's `app/tests/fixtures/**` e2e set** should name `import-experience.spec.ts` (`test_checks_for_paths`). This is a test-map change, so it goes to the reviewer first.

## Questions

1. **Should the advanced `leaps` keep mapping to the fourth-or-wider detector?**
   - F2b kept `"leaps": "interval.leap"` so that no count moved.
   - The detector cannot tell a fourth from an octave. So `blues.7`'s and `ragtime.9`'s "leaps" claim is checked by a weaker fact, and primer material with a held C–F root motion reads as a candidate for those rungs:
     - the Bach menuet excerpt's line at `blues.7`, now marked shared;
     - the 2.1 studies F2's record noted at `blues.7` and `ragtime.9`.
   - Unmapping would make the claim unmeasurable on those two rungs. Both would leave the checkable claims, and the census would change.
   - It is a claim decision. My recommendation: unmap, since a claim no detector can establish should read as unmeasured, not as established by a nearer fact.

## The census

This is the report's functions on this tree's builds, printed by `census.py` (`census-before.txt`, `census-item1.txt`, `census-after.txt`, `census-final.txt`). "Notated" means measured and not written by a generator family. The counts are in the captures; here are the relationships.

- **Before equals F2a's landed state** on every count line F2a's `census-after.txt` printed.
- **Item 1.**
  - Unchanged: checkable claims, established, not established, kept by no option (the five deferrals), introduced (three) and options serving none.
  - Untaught rows fall on the practice track and nowhere else; every other track's count, all and notated, is equal:
    - `practice.1` keeps only the study's skips; its five-finger pattern and *Ode to Joy* rows, and the study's step, go (both are read at 1.1 now).
    - `practice.3` loses *Mary Had a Little Lamb*'s row (read at 1.1) and the both-hands pattern's step.
    - `practice.5` loses its two rows' steps.
  - Generated combinations: those four step combinations go and none is new. The record was rewritten to match.
  - The after counts equal, on every count, what F2a's `question-practice-scenarios.txt` measured for "practice1-1.1".
- **Item 2.** Every count is equal to item 1's, and the report's markdown is unchanged by it. What moved:
  - the sources of the leap claim, 2.1 `concept leap` and 1.5 `introduces leap`;
  - the rungs naming each id: `leap` on 1.5 and 2.1, `leaps` on `blues.7` and `ragtime.9`.
  - `blues.7` and `ragtime.9` still claim the demand through `concept leaps`, with the same established-of-checked as before.
- **The advanced entry's rename** changed no count (`census-final.txt` equals `census-after.txt` below its label).

## The red lines

Each was seen before the change it proves.

- **Item 1, on the committed stage file** (`red-item1-taught-at.txt`, `red-item1-measured-truth.txt`, `red-item1-app.txt`):
  - `test_the_floor_stands_on_1_1`: `AssertionError: None != ['1.1']`.
  - `test_the_floor_s_shared_options_are_read_where_the_track_first_meets_them` (revised), for the five-finger pattern and for *Ode*: `'practice.1' unexpectedly found in {'1.1', 'practice.1'} : practice.1 stands on 1.1, which lists it`.
  - `test_the_practice_floor_stands_on_1_1_and_its_false_rows_are_gone`: `None != ['1.1']`.
  - `taughtByAncestry`: `practice.1's Stage 1 path: expected [] to deeply equal [ '1.1' ]`, and `placed at 1.1: practice.1 waits for 1.1: expected [ Array(1) ] to deeply equal []` (the committed card had the practice row at 1.1).
- **Item 2, on the item-1 tree** (`red-item2-taught-at.txt`, `red-item2-measured-truth.txt`, `red-item2-e2e.txt`):
  - `'leap' not found in ['leaps'] : 1.5 introduces the leap`.
  - `Lists differ: ['1.5', '2.1', 'blues.7', 'ragtime.9'] != ['blues.7', 'ragtime.9']`.
  - `KeyError: 'leap'`, twice (the entry was absent).
  - `None != 'interval.leap' : the leap demand's concept is the beginner's`.
  - `'introduces leaps' != 'introduces leap'`.
  - `plan.spec`: `locator('#skills-list .list-row[data-concept="leap"]') … element(s) not found`.
- **The premise, data changed and `claims.py` not** (`red-premise-claims.txt`): seven reds. Among them are `vocabulary: demand interval.leap is taught at '2.1', whose concepts name none of leaps …` and `['blues.7', 'ragtime.9'] != ['2.1']`.
- **The consumer, the old sharedBy case on the new map** (`red-sharedby-measured-truth.txt`): `'sharedBy' unexpectedly found in {'kind': 'demand', 'id': 'interval.leap', 'from': 'concept leaps', 'sharedBy': ['leap', 'leaps']} : excerpt.classical.bach-menuet-bwv-anh-113.pdmx.b25-32 at blues.7`.
- **The name, "Leaps: an octave or more"** (`red-name-cut-e2e.txt`, `red-name-taught-at.txt`):
  - `Error: the advanced name is cut beside Drill it and Find more … Expected: true Received: false`.
  - `'Leaps: an octave or more' != 'Wide leaps'`.

## Tests touched

| Test | Class | Old assumption | Now |
| --- | --- | --- | --- |
| `test_taught_at.py` › `TestThePracticeTrackWalksItsOwnRungs.test_the_floor_stands_on_1_1` | add | — | `practice.1` names 1.1; every practice rung's Stage 1 path is 1.1 alone; steps taught on the floor, the study's skips not, taught at 1.5 |
| › `test_the_floor_s_shared_options_are_read_where_the_track_first_meets_them` | revise | the five-finger pattern first met on `practice.1` | the pattern and *Ode* read at 1.1; the study still first met on `practice.1`, not `practice.2` |
| › `TestTheCoreTeachesWhereAnOptionEstablishes.test_the_leap_is_untaught_after_1_5_and_taught_from_2_1` | revise | 1.5 and 2.1 name `leaps` | they name `leap`; the demand's path cases unchanged |
| › `TestTheTwoLeapsAreTwoConcepts` (5) | add | — | `leap` on 1.5 (introduces) and 2.1 only; `leaps` on `blues.7` and `ragtime.9` only, no Stage 1–3 rung; each entry's words (the advanced keeps finder and Grades 5–6, is called "Wide leaps"); neither name shared, none is just "Leaps", the shared names exactly the recorded ten; `CONCEPT_DEMANDS['leap']` and the derivation `["2.1"]` |
| `test_measured_truth.py` › `test_the_practice_floor_stands_on_1_1_and_its_false_rows_are_gone` | add | — | on the build: the pattern, *Hot Cross Buns* and *Ode* not read at `practice.1`; its one untaught row the study's skips; no practice rung reads a step untaught |
| › `test_the_leap_is_introduced_at_1_5_and_taught_where_2_1_s_options_establish_it` | revise (added lines) | — | the introduction and the claim come from `leap`; `blues.7` and `ragtime.9` still claim through `leaps` |
| › `TestExcerptsOnTheBuild.test_the_candidate_rungs_say_where_one_detector_answers_for_several_concepts` | revise | the left-hand pattern is the only shared demand | every demand several concepts share carries exactly those concepts on its concept-reached lines; the leap is `["leap", "leaps"]` |
| `fixtures/untaught_on_rung.json` | revise | the four practice step combinations | gone; the comment names F2b |
| `app/tests/unit/taughtByAncestry.test.ts` › `the practice floor stands on 1.1 (F2b)` (2) | add | — | every practice rung's Stage 1 path is 1.1; step taught and skip not at `practice.1`; the session: no practice row at 1.1, `new exercise.five-finger.c-major.right (practice.1)` at 1.2 and 1.5, none at 2.1 |
| `app/tests/e2e/plan.spec.ts` › `the two leaps on Skills (F2b)` | add | — | as in Done 2, at 342 × 740 |
| `app/tests/e2e/today.spec.ts` › `placeAt`'s comment | revise (comment) | How to practise beside 1.1 | not beside it at 1.1 since F2b; no assertion changed |
| every other test run | preserve | — | see the runs |

## Checks and exit codes

| Run | Exit | What it said |
| --- | --- | --- |
| `copy.txt` (kern, musetrainer, `build/cache/convert`, `build/midi-real`, the three caches, copied from the main checkout read-only); `npm-ci.txt`; `parity.txt` | 0 (robocopy 1 each); 0; 0 | — |
| `content-build-before.txt` | 0 | reports and validation OK; the regenerated reports equal the committed ones but for line endings |
| `content-build-item1.txt`, `content-build-after.txt`, `content-build-final.txt` | 0, 0, 0 | validation OK each |
| `red-*` (the red lines) | 1 each | as above |
| `green-item1-content.txt` | 1 | only `rung-claims.md is stale: rebuild`: the record had been spliced after that build; green after the rebuild |
| `green-item1-app.txt`, `green-item2-taught-at.txt`, `content-measured-truth.txt` | 0, 0, 0 | — |
| `content-suite.txt` (the whole Python suite, after item 2, before the rename) | 1 | three: two full-disk errors (rerun green, `content-rerun-disk.txt`, 0) and the pre-existing `test_checks_for_paths` map row |
| `content-final.txt` (`test_taught_at`, `test_measured_truth`, `test_validate_claims`, `test_measured_demands`, `test_excerpts`, `test_excerpt_proposer`, `test_finder`, final tree) | 0 | OK |
| `validate.txt`, `validate-final.txt` | 0, 0 | OK; the pre-existing excerpt-staleness, rung-claims and five deferral warnings; no taught-at warning |
| `review-check.txt`, `review-check-final.txt` | 0, 0 | — |
| `tsc.txt`, `tsc-final.txt` (`npx tsc -b`) | 0, 0 | — |
| `lint-touched.txt`, `lint-taught-final.txt`, `lint-final.txt` (`npm run lint`, whole app, after the config copy left `app/`) | 0, 0, 0 | — |
| `unit-named.txt`, `unit-final.txt` (`taughtByAncestry`, `lessonClaimsAboutApp`, `unmeasuredConceptsSaySo`; final adds `skillsReadTheLadder`, `oneSkillState`) | 1, 1 | only the two known line-ending assertions |
| `vitest-all.txt` (whole unit suite, final build) | 1 | the two known, and five that pass alone (`vitest-rerun-five.txt`, 0) |
| `diaries-before.txt`, `diaries-after.txt`, `diaries-compared.txt` | 0, 0, 0 | all five diaries byte-identical |
| `build-app-item1.txt`, `build-app-after-oom-under-content-suite.txt`, `build-app-after.txt`, `build-app-final.txt` | 0, 134, 0, 0 | the 134 was a heap failure while the content suite ran on a nearly full disk; the same code built green once it finished |
| `specs-exist-red.txt`, `specs-exist.txt`, `specs-exist-final.txt` | 0 each | every spec and the config named, present |
| `e2e-after.txt`, `e2e-final.txt` (`today`, `plan`, `competence`, `finder` specs, port 4323, two workers) | 0, 0 | every test passed, F2's floor case and the new case among them; the final run after the rename |
| `look-before.txt`, `look-after.txt` (the probe, port 4323) | 0, 0 | the pictures and text records |
| `leap-candidates.txt` | 0 | seven candidate lines through the leap, all at `blues.7` and `ragtime.9`, each marked shared |

Port 4323 was checked free before the browser steps. The config copy lived at `app/playwright.f2b-4323.config.ts` during the runs. It is now `runs/F2b/playwright.f2b-4323.config.ts` (U74's pattern), and its output folder was removed.

## Unverified, beside what passes

1. **Nothing was heard.** The finder words, "Wide leaps" and the reading of 2.1's left hand are from the notation and the words. They are unverified as teaching.
2. **Looked at:** the Skills screen at Stages 2 and 7, both finder sheets, and Today at 1.1 and 1.2, at 342 × 740.
   - Not looked at: other widths, Today at 1.3–1.5 (1.5 is F2's spec and the unit case), the Library.
   - "Placed from 2.1 on, no practice row": measured at 2.1 (the unit case, and F2a's probe). Beyond 2.1 it is inferred from `strandsOf` (every practice rung is behind the placement).
3. **The full browser suite was not run**; CI is the full run. The whole unit and content suites were run, with the failures classified above.
4. **The disk was nearly full during the runs.** That is the inferred cause of the two disk errors and the one heap failure, each green on rerun. Other worktrees share the disk.

## Files

In the worktree, uncommitted:

- `content/curriculum/stage-1.json`: `practice.1`'s prerequisite; 1.5's `introduces`. Spliced.
- `content/curriculum/stage-2.json`: 2.1's `concepts`. Spliced.
- `content/curriculum/concepts.json`: the `leap` entry; `leaps` renamed "Wide leaps". Spliced.
- `tools/content/claims.py`: `"leap": "interval.leap"` and its comment. **Outside the brief's list.** The premise test shows the build fails without it.
- `tools/content/tests/test_taught_at.py`, `test_measured_truth.py`, `fixtures/untaught_on_rung.json` (spliced).
- `app/tests/unit/taughtByAncestry.test.ts`, `app/tests/e2e/plan.spec.ts`, `app/tests/e2e/today.spec.ts` (comment only).
- `docs/02-curriculum.md`: D8a, the practice-module sentence, Part C at 1.5 and 2.1.
- `docs/prompts/rung-claims.md`: regenerated. `docs/prompts/inventory.md`: regenerated, content unchanged (line endings only).
- `docs/prompts/runs/F2b/` (the captures, the splice and census scripts, the diaries, the config copy, the look probe's copy, this entry) and `docs/prompts/pictures/f2b/` (the before and after pictures and look records).
- Not touched: `validate.py`, `build.py`, the skill vocabulary, `demands.json`, app code, `session.ts`, `content/lessons/2.1.md`. Its sentence says "leaps" as a word, never the display, so it needed no change.

**Orchestrator's note at the landing (2026-09-29).** F2b's worktree committed by name (ddba53e9) and merged (51fd9e6c). The chain on the merged main checkout: the content build offline (the reports compared), the validator, the record check, the whole content suite, the map's test and its minimum for the merged files (`runs/F2b/map-min.txt`: no e2e line), typecheck, lint, the whole unit suite, the app build, the spec names checked, and the Today, lesson, plan, competence, start-and-return and placement-branches specs on the default port (content-build 0; content-validate 0; review-check 0; content-tests 0; map-tests 0; map-min 0; tsc 0; lint 0; vitest-all 1; build-app 0; specs-exist 0; e2e-targeted 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; `runs/F2b/orchestrator-exit.txt`). The reviewer's two parts as ruled: `practice.1` on 1.1 with D8a's sentence, the census moving only on the practice track; the beginner's leap its own concept, the advanced one named only on its two rungs. Two of the brief's premises were wrong and the builder said so: the teaching rung could not stay 2.1 without one mapping line in `claims.py` (outside the list; added, no census count moved), and "no two concept names collide" is false for ten pairs outside this seam (L116, recorded; the case scoped). The builder's naming of the advanced entry ("Wide leaps", since "Leaps: an octave or more" was cut at 342 px) is unverified as a teacher's word; the reviewer's question 1 — whether the advanced `leaps` should stop mapping to the fourth-or-wider detector, which cannot tell a fourth from an octave — is a claim decision (L117). Nothing heard; the Skills and Today pictures at 342 × 740 are the observations.


## Doc rows

**`docs/08-test-map.md`.**

- **The F2 row's status cell.** In F2a's proposed wording, replace "the practice track walks its own rungs, its core prerequisite an open question;" with "the practice track walks its own rungs; F2b (Entry 123): `practice.1` stands on 1.1 (the track opens from the second rung of Stage 1), and the beginner's leap is its own concept `leap`, the advanced `leaps` ("Wide leaps") named on `blues.7` and `ragtime.9` only, both read as `interval.leap`;". If F2a's wording was not applied, append that F2b clause to the cell.
- **File lines.**
  - `test_taught_at.py`: append "; since F2b `practice.1` stands on 1.1 (the floor's steps taught, the study's skips not), and the two leaps are two concepts (`leap` on 1.5 and 2.1, `leaps` on `blues.7` and `ragtime.9`), no leap name shared, the shared concept names exactly the recorded ten".
  - `test_measured_truth.py`: append "; since F2b the practice floor's one untaught row is the study's skips and no practice rung reads a step untaught, the leap's sources are `leap` and `leaps`, and every demand several concepts share is marked on the candidate-rungs lines (the leap among them)".
  - `taughtByAncestry.test.ts`: append "; since F2b the practice floor stands on 1.1 and Today's practice row is absent at 1.1, there at 1.2 and 1.5, absent at 2.1 (a session build)".
  - `plan.spec.ts`: append "; since F2b the two leaps on Skills at 342 × 740: the Stage 2 entry is the fourth or fifth, taught in 2.1, with its own finder; the advanced "Wide leaps" from Stage 7 with its own; each name read whole; no entry called just "Leaps"".
  - `today.spec.ts`: no line change (a comment only).

**`docs/03-content-pipeline.md`.**

- In the excerpt row's sentence "`concepts` the targets' where the vocabulary names them once (the left-hand pattern, one detector for seven concepts, names none)", after "names none", add "; since F2b the leap too, one detector for the beginner's `leap` and the advanced `leaps`".
- In the "Unplaced" item, after "a claim one detector answers for several concepts marked † with the concepts named", add "(the left-hand pattern, and since F2b the leap)".
