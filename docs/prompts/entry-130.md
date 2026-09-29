### Entry 130 — F2c: the advanced `leaps` no longer maps to the fourth-or-wider leap detector, so `blues.7`'s and `ragtime.9`'s octave-or-more leap reads as a concept no detector measures, the false shared-detector note is gone with the lines it sat on, and a primer fourth satisfies no claim of either rung (2026-09-29)

The F2b review's required change (`docs/review/responses/ddba53e9.md`), built on base `a81702b7` under the brief `docs/prompts/tasks/F2c-advanced-leap-unmapped.md`. Captures are in `docs/prompts/runs/F2c/`: each `.txt` starts with its command and ends with `exit=<code>`. No browser run and no pictures: nothing the app reads changed (below).

## Judgement

I read the rung-claims report's two rows before and after, the two candidate reports, the two lessons' leap sentences and F2b's recorded look at the Skills entry. Nothing was played or heard, and no screen was looked at in this seam.

- **The two rows in the rung-claims report** ("Every rung, claim by claim"; `rung-claims-diff.txt`):
  - `blues.7`, before: `| blues.7 | 8 | a leap (a fourth or wider) (interval.leap) 7/8 | stride, turnaround, boogie, shuffle, shell-voicings |`.
  - `blues.7`, after: `| blues.7 | 8 | — | stride, turnaround, boogie, shuffle, shell-voicings, leaps |`.
  - `ragtime.9`, before: `| ragtime.9 | 8 | a leap (a fourth or wider) (interval.leap) 7/7 | memorising, multi-strain-form, performance-mode, secondary-rag |`.
  - `ragtime.9`, after: `| ragtime.9 | 8 | — | memorising, multi-strain-form, performance-mode, secondary-rag, leaps |`.
  - What the rows say now:
    - Before, the report said 7 of `blues.7`'s 8 options keep the rung's leap claim. But the claim it checked was "a fourth or wider", so the shell-voicing exercise and the walking bass in F counted as proof of a leaping left hand.
    - After, the report says it cannot check the claim. `leaps` sits with the rung's other concepts that need a person's judgement.
    - Both rungs now have no measurable claim at all: every concept they name is beyond the detectors.
    - The E♭ Pinetop boogie exercise was listed among the options that establish none of their rung's claims. It has none left to establish, so it leaves that list.
- **What a learner at `blues.7` is told about the leap: unchanged.**
  - The Skills entry, as F2b recorded it at 342 × 740 (`pictures/f2b/after-look.txt`): "Wide leaps", "Stage 7, 9 · blues-boogie, ragtime", "not judged by the app", "Taught in The leaping left hand and the two bars that send you back". Its Drill it lists the oom-pah bass exercises "the chord at the octave" (L4.2), with "Show all 12".
  - Its finder asks for "jumping accurately to a note you cannot feel for", "advanced, Grade 5 to 6", "leaps of an octave or more".
  - The lesson's own leap is the stride move: "Bass note, chord, tenth, chord. One leap a bar".
  - Why it is unchanged: every file under `app/public/content` is byte-identical before and after (`manifest-compared.txt`), and no app code changed. The Skills screen judges a concept only from the vocabulary's skills with an observable (`SkillsScreen.buildConcepts`), never from `claims.CONCEPT_DEMANDS`, so the entry said "not judged" before and says it now.
  - So the false credit never reached the learner. It lived in the build's reports and the candidate lists that F reads for placement. There, a Bach menuet's fourths and the 2.1 studies read as material for a stride rung.
- **A teacher's reading, from the words and the notation's readings (unverified as teaching).**
  - An octave-or-more jump in a stride or oom-pah left hand is a different skill from a fourth in a stepwise tune.
  - A detector that fires on a fourth cannot vouch for it. "No detector measures it" is the honest status until one can.
  - Whether any of `blues.7`'s options actually carries an octave-or-more leap is now unmeasured, which is the point.

**The orchestrator's hypothesis, tested before building.** The hypothesis: removing the mapping moves exactly the two advanced rungs' leap rows from established to unmeasured, and changes no other count, no diary morning and no beginner claim. The refuting tests: any other row moving, or the validator refusing a rung whose concept maps to no demand.

- **Rows.** No row outside `blues.7` and `ragtime.9` moved. The verdict-level comparison (`census-compared.txt`) shows 16 lines gone, all at those two rungs (8 each), and none added.
- **The validator** accepted the tree (`validate.txt`, `validate-final.txt`). For a concept that maps to nothing, `concept_claim_findings.claim_of` returns None and skips it. So "When to deviate" had nothing to act on.
- **Diaries.** Every diary morning is the same.
- **The beginner's claim** is the same: 2.1's leap is still claimed from `concept leap` and established by the same options, and `taughtAt` is still `["2.1"]`.
- **Where "no other count" was incomplete.** Three summary totals the hypothesis did not name also moved, each by exactly those rows:
  - options serving none of their rung's claims (the Pinetop exercise);
  - concept claims no detector measures (`leaps` on each rung);
  - runtime verdicts (the ear drill on `ragtime.9`).

**Words.** The brief says the claim should read *unmeasured*. In the report, "unmeasured" is the status of an option with no measurement. The report's existing place for a claim no detector proves is the "Not measurable" column: "the concepts no detector measures", which "needs a person's judgement". That is where `leaps` now reads. No code was changed to say it: removing the mapping sends the concept down `rung_claims_of`'s existing branch.

## Done

1. **The mapping (item 1).**
   - **Technical.** `claims.CONCEPT_DEMANDS` keeps `"leap": "interval.leap"` and loses `"leaps": "interval.leap"`. The comment above it says why (F2c, the review's reason) and until when (a detector proving octave-or-more material). No new detector was written.
   - **Pedagogical.** The claim is no longer credited by a fourth. As in the judgement: unverified as teaching.
2. **The consequences regenerated (item 2).**
   - **The census** is below: only the two rungs' rows moved.
   - **The rung-claims report** was regenerated by the build (`content-build-after.txt`). Its diff is exactly the summary totals, the two rows and the Pinetop line.
   - **The inventory** was regenerated and its content is unchanged (`inventory-diff.txt`: no line differs). It holds no per-rung concept claim, and its leap rows count what the detector establishes, which did not change. Its working copy differs from the index only in line endings.
   - **D0's record** (`tests/fixtures/untaught_on_rung.json`) is unchanged: the generated untaught combinations did not move, and the report says the record matches, before and after.
   - **The excerpt candidate report**, regenerated before and after (`excerpt-candidate-rungs-before.md`, `excerpt-candidate-rungs.md`, `excerpt-candidates-diff.txt`):
     - The seven leap lines at `blues.7` and `ragtime.9` are gone entirely, not only their note. The rungs have no measurable claim left, so no excerpt is a candidate there.
     - The seven: the Anh. 113 menuet cut (both rungs), the Ode to Joy variation (both), I Got Rhythm (`blues.7`) and Hark the Herald (both).
     - The four "one detector for 2 concepts (leap, leaps)" notes went with them. The left-hand pattern's note stays.
     - Nothing else in the report moved.
   - **The study candidate report**, regenerated the same way (`study-candidate-rungs-before.md`, `study-candidate-rungs.md`, `study-candidates-diff.txt`):
     - All 48 lines at the two rungs are gone. Every one of the 24 studies had been a candidate for both.
     - The G major study written for 3.1 had no other candidate, so it now reads "No rung". Its own rung's claims are not established by it.
     - The 2.1 studies keep `demand interval.leap (concept leap)` at 2.1.
     - Compared as multisets of lines (`study-candidates-diff.txt`): what left was the 48 lines and that study's table header, and one "No rung" line came. The line diff shows some `ragtime.8` lines as changed; that is its ordering, not a change.
   - **The five diaries** were rerun on the after build and compared with F2b's landed diaries (`diaries-compared.txt`): identical but for the checkout's line endings, on every line.
     - Their inputs are the built catalogue and curriculum only. Those are byte-identical before and after this change, so no morning could move.
     - The diaries cover 2.2–4.6. The two rungs are Stages 7 and 9.
   - **Placement of the regenerated reports.** Neither committed candidate report is rewritten by the build. `docs/prompts/runs/D3/candidate-rungs.md` (studies) and `docs/prompts/runs/E1/candidate-rungs.md` (excerpts) are written by `study.py --candidate-rungs` and `excerpts.py --candidate-rungs`.
     - Both were already stale before F2c. The before regeneration differs from each on lines F2, F2a and F2b moved: 2.1's `concept leap`, the holiday rows, technique.5's syncopation, `latin`'s walking bass, Wabash Blues at 3.3.
     - So neither was rewritten in place. The D3 file is outside my files on the brief's own condition ("if the build rewrites it"). See Question 1.
3. **The regression, red first (item 3).**
   - `test_taught_at`: the advanced jump maps to no demand, and a fourth-only reading keeps no claim of either rung while keeping 2.1's.
   - `test_measured_truth` on the built candidate report:
     - The Anh. 113 cut establishes the leap and is a candidate for neither rung. No excerpt is.
     - The leap reaches a rung only through `leap`.
     - The shared-detector case no longer holds the leap shared.
     - The placement case holds that neither rung claims the leap and both list `leaps` as not measurable.
   - `test_study` on the study candidate report: the six 2.1 studies establish the leap and keep 2.1's `concept leap` claim, and no study is a candidate for either rung.
   - Unchanged and still green: 2.1's leap claim is established (`test_the_leap_is_introduced_at_1_5_…`), and `taughtAt` for `interval.leap` is `["2.1"]` (`test_the_detector_reads_the_beginner_leap_…`, `test_the_committed_lists_…`).
   - **The menuet.** The brief names "the menuet's opening". The approved Anh. 113 cut is bars 25–32, the only cut of it, so the case reads that cut, and every excerpt besides.
4. **`docs/02` (item 4).**
   - Part C has no entry for `blues.7` or `ragtime.9`: it covers Stages 0–4. Its one sentence naming them is 1.5's, and its clause "the one detector finds a fourth or wider under both" became false.
   - That clause now says the detector can establish the beginner's leap and cannot tell a fourth from an octave, so `leaps` maps to no demand and on those two rungs the octave-or-more leap is a claim no detector measures yet.
   - The one clause each was placed where the rungs are described, in Part D: D3's Stage 7 row (`blues.7`) and D5's `ragtime.9` sentence. **Outside the brief's literal "Part C"**, which has no place for them. Recorded here as the deviation.
5. **Consumers of the map, each checked** (`consumers.txt` reads each with the mapping as now and with the removed line put back in memory):
   - `concepts_naming("interval.leap")` goes from `leap, leaps` to `leap`.
   - `teaching_rungs` is `["2.1"]` both ways.
   - `validate.taught_at_findings`: no error and no warning, both ways.
   - `excerpts.concepts_for(["interval.leap"])` goes from none to `leap`, since the leap is no longer a shared demand. No approved excerpt targets the leap (`excerpts.json`'s targets are listed there), so no built row changed.
   - `excerpt_proposer.seed_works_for`: no seed work names either leap, both ways.
   - `validate.concept_claim_findings`: `leaps` is skipped as a concept no detector measures.
   - The app: no file it reads changed (`manifest-compared.txt`), and no screen reads the map.
   - Every content test file that imports `claims` was run green: the four named ones, then `test_excerpts`, `test_excerpt_proposer`, `test_generator_invariants`, `test_measured_demands`, `test_review_record` and `test_validate_excerpts`.

## Not done

- **An octave-or-more detector.** Not F2c's (item 5): recorded as Follow-up 1.
- **L116's ten pairs, L118's beginner material, any option or concept change.** Not F2c's (item 5); untouched.
- **The committed candidate reports rewritten in place** (`runs/D3/candidate-rungs.md`, `runs/E1/candidate-rungs.md`). The build does not rewrite them, and each carries pre-F2c drift. Question 1.
- **No browser run.** No Skills case reads the advanced entry's claim, and the built content is byte-identical, so the brief's condition for one did not arise.
- **No full content or unit suite.** The seam touches `claims.py`: every content test reading it was run, plus the two named unit files. CI is the full run.
- **No final rebuild after the last edits.** After the green runs, two comments changed: `claims.py`'s mapping comment and one docstring's wording ("cannot tell a fourth from" for "never"). No code changed. The four named test files, the validator and the record check were rerun after them (`green-content-final.txt`, `validate-final.txt`, `review-check-final.txt`), all 0.

## Follow-ups

1. **P3, an octave-or-more leap detector** (for the detectors' owner, `detect.ts`; a backlog row, id the orchestrator's).
   - The one leap detector finds a fourth or wider.
   - A reading of a leap of an octave or more within a hand, for example the stride and oom-pah bass-to-chord move, would give `leaps` a demand of its own. `blues.7`'s and `ragtime.9`'s claim would then be checkable, and the Skills entry could be judged.
   - Until then, the claim is a person's judgement.
   - Proposed row text: "The advanced `leaps` (an octave or more, `blues.7`, `ragtime.9`) maps to no demand since F2c: no detector tells an octave from a fourth; a wider-leap detector would let the claim be established, not asserted."
2. **P3, the committed candidate reports lag the tree** (Question 1). Both differ from what their commands write today, on lines F2–F2c moved. A reader of `runs/D3/candidate-rungs.md` still sees every study offered to `blues.7` and `ragtime.9`.

## Questions

1. **Should `docs/prompts/runs/D3/candidate-rungs.md` be regenerated in place** from this build (`study-candidate-rungs.md` here is that file)?
   - Its diff would carry F2, F2a and F2b drift beside F2c's 48 lines.
   - `test_study` reads only its opening, which is unchanged either way.
   - My recommendation: yes, as its own named change, so the committed report stops offering primer studies to the stride rungs.
   - The same question for E1's excerpt report, which is E1's run record. I would leave it, since F2c's regenerated copy sits beside this entry.

## The census

This is the rung-claims report's functions on this tree's builds, printed by `census.py` (`census-before.txt`, `census-after.txt`). `compare_census.py` compares them (`census-compared.txt`), down to every option's verdict on every claim. Counts are in the captures; here are the relationships.

- **Before equals the committed report.** The before build's `rung-claims.md` and `inventory.md` differ from the committed files only in line endings.
- **What moved: only `blues.7`'s and `ragtime.9`'s rows.**
  - Each rung's leap claim, from `concept leaps`, leaves the claims.
  - `leaps` joins each rung's not-measurable concepts.
  - Their options' 16 verdicts on it leave the report: 14 established, 1 absent (the E♭ Pinetop exercise on `blues.7`) and 1 runtime (`drill.ear.tune-long` on `ragtime.9`).
  - No verdict at any rung was added or changed.
- **Totals, each moved by exactly those rows.**
  - Option-claim pairs fall by the 16.
  - Checkable pairs fall by the 15 that are not runtime.
  - Established falls by 14; not established and absent by 1; runtime by 1.
  - Options establishing none of their rung's measurable claims fall by 1: the Pinetop exercise now has no claim on its rung.
  - Concept claims no detector measures rise by 2.
- **Unchanged:**
  - the rung claims no option keeps (the five deferrals);
  - the three introductions (1.5's leap from `introduces leap` among them);
  - untaught rows, all and notated, per track;
  - the generated untaught combinations and the record's match;
  - 2.1's leap claim (from `concept leap`, the same established-of-checked);
  - `taughtAt` and the derivation for `interval.leap` (`["2.1"]`);
  - the rungs naming each id (`leap` on 1.5 and 2.1, `leaps` on `blues.7` and `ragtime.9`).

## The red lines

Each was seen on the committed `claims.py` and the committed build, before the mapping changed.

- `red-taught-at.txt`: `AssertionError: 'leaps' unexpectedly found in {… 'leap': 'interval.leap', 'leaps': 'interval.leap', …}`.
- `red-measured-truth.txt` (seven failures):
  - The primer case, per excerpt:
    - `Lists differ: ['blues.7', 'ragtime.9'] != []` for the Anh. 113 cut, the Ode variation and Hark the Herald;
    - `Lists differ: ['blues.7'] != []` for I Got Rhythm.
  - The shared-detector case: `'interval.leap' unexpectedly found in {'interval.leap': ['leap', 'leaps'], 'texture.left-hand-pattern': [...]} : the leap shared with the advanced jump, which no fourth proves`.
  - The placement case: `('demand', 'interval.leap') unexpectedly found in {('demand', 'interval.leap'): {… 'from': 'concept leaps', 'established': 7, 'measurable': 8}} : blues.7 claims the leap demand`, and the same at `ragtime.9`.
- `red-study.txt`: 24 subtest failures, one per study, each `Lists differ: ['blues.7', 'ragtime.9'] != []`. The 2.1 half of the case (the leap established, 2.1's `concept leap` kept) held, as it should: it is the unchanged beginner claim.

## Tests touched

| Test | Class | Old assumption | Now |
| --- | --- | --- | --- |
| `test_taught_at.py` › `TestTheTwoLeapsAreTwoConcepts.test_a_fourth_never_establishes_the_advanced_jump` | add | — | `leaps` not in `CONCEPT_DEMANDS`; `interval.leap` named by `leap` alone; `blues.7` and `ragtime.9` claim no leap demand and list `leaps` as not measurable; a fourth-only reading keeps no claim of either and keeps 2.1's (`concept leap`) |
| `test_measured_truth.py` › `TestExcerptsOnTheBuild.test_the_candidate_rungs_say_where_one_detector_answers_for_several_concepts` | revise | the leap shared by `leap` and `leaps` (F2b) | the leap shared by nothing; the left-hand pattern's lines still carry their note |
| › `TestExcerptsOnTheBuild.test_a_primer_fourth_satisfies_no_claim_of_the_advanced_rungs` | add | — | on the built candidate report: the Anh. 113 cut establishes the leap and is a candidate for neither rung; no excerpt is; the leap reaches a rung only through `leap` |
| › `TestPlacementReconciled.test_the_leap_is_introduced_at_1_5_and_taught_where_2_1_s_options_establish_it` | revise | `blues.7` and `ragtime.9` claim the demand through `concept leaps` (F2b) | neither claims it; `leaps` in both rungs' not-measurable concepts; the 1.5 and 2.1 lines unchanged |
| `test_study.py` › `_study_catalogue` | refactor | — | the study rows the report case built inline, moved unchanged so two cases share them |
| › `TestTheCandidateRungsReport.test_a_primer_fourth_satisfies_no_claim_of_the_advanced_rungs` | add | — | the six 2.1 studies establish the leap and keep 2.1's `concept leap` claim; no study is a candidate for `blues.7` or `ragtime.9` |
| every other test run | preserve | — | see the runs |

## Checks and exit codes

| Run | Exit | What it said |
| --- | --- | --- |
| `copy.txt` (kern, musetrainer, `build/cache/convert`, `build/midi-real`, and the positions, demands and notation caches, copied read-only from the main checkout's inputs); `npm-ci.txt`; `parity.txt` | 0 (robocopy 1 each, files copied); 0; 0 | — |
| `content-build-before.txt`, `content-build-after.txt` (`build.py --offline`) | 0, 0 | validation OK each; the after build's report line moves as the census says |
| `manifest-before.txt`, `manifest-after.txt`, `manifest-compared.txt` | 0, 0, 0 | every file under `app/public/content` byte-identical |
| `census-before.txt`, `census-after.txt`, `census-compared.txt` | 0, 0, 0 | as above |
| `red-taught-at.txt`, `red-measured-truth.txt`, `red-study.txt` | 1, 1, 1 | the red lines |
| `green-content.txt`, `green-content-final.txt` (`test_taught_at`, `test_measured_truth`, `test_validate_claims`, `test_study`) | 0, 0 | OK |
| `consumers-content.txt` (`test_excerpts`, `test_excerpt_proposer`), `consumers-content-2.txt` (`test_generator_invariants`, `test_measured_demands`, `test_review_record`, `test_validate_excerpts`) | 0, 0 | OK |
| `consumers.txt` | 0 | each reader of the map, now and with the line put back |
| `validate.txt`, `validate-final.txt` (`validate.py --allow-nc --personal`) | 0, 0 | OK; the pre-existing warnings (five stale-by-cut-version excerpts, the rung-claims count, the five deferrals); no taught-at warning; the views regenerated with none stale |
| `review-check.txt`, `review-check-final.txt` | 0, 0 | — |
| `unit-named.txt` (`taughtByAncestry`, `sightReadingPromises`) | 0 | all passed |
| `diaries-after.txt`, `diaries-compared.txt` | 0, 0 | five diaries, no line differs from F2b's landed ones |
| `rung-claims-diff.txt`, `inventory-diff.txt`, `excerpt-candidates-{before,after,diff}.txt`, `study-candidates-{before,after,diff}.txt` | 0 each | as in Done 2 |

## Unverified, beside what passes

1. **Nothing was heard, and no screen was looked at.** "Unchanged on Skills" is inferred from identical inputs: the built content is byte-identical and no app code changed. It was not re-observed. The entry's words are F2b's recorded look.
2. **Whether `blues.7`'s and `ragtime.9`'s options carry an octave-or-more leap is unmeasured.** That is the claim's new, honest status. The stride move in the lesson is the lesson's words.
3. **"Every diary morning the same" rests on the diaries' own inputs.** It is not a separate before run: the before build's catalogue and curriculum are byte-identical to the after build's, and the comparison is with F2b's landed diaries.
4. **The full suites were not run**; CI is the full run.

## Files

In the worktree, uncommitted:

- `tools/content/claims.py`: the `"leaps"` line removed; the comment above `"leap"` says why and until when.
- `tools/content/tests/test_taught_at.py`, `test_measured_truth.py`, `test_study.py`: the cases in the table.
- `docs/02-curriculum.md`:
  - Part C at 1.5: the false clause corrected.
  - Part D: D3's Stage 7 row and D5's `ragtime.9` sentence, one clause each (outside the brief's literal Part C).
- `docs/prompts/rung-claims.md`: regenerated.
- `docs/prompts/inventory.md`: regenerated, content unchanged (its working copy differs from the index only in line endings, so there is nothing to commit).
- `docs/prompts/runs/F2c/`:
  - this entry and the captures;
  - the scripts (`cap.sh`, `copy.ps1`, `census.py`, `compare_census.py`, `compare_diaries.py`, `consumers.py`, `content_manifest.py`, `candidate_diff.py`);
  - the regenerated candidate reports, before and after;
  - `diaries-after/`.
- Not touched: `validate.py`, `build.py`, the stage files, the lessons, the vocabulary, `concepts.json`, `demands.json`, D0's record, app code, `runs/D3/candidate-rungs.md`, `runs/E1/candidate-rungs.md`.

**Orchestrator's note at the landing (2026-09-29).** F2c's worktree committed by name (267cac32) and merged (fb89e790). The chain on the merged main checkout: the content build offline (the reports compared), the validator, the record check, the whole content suite, the map's test and its minimum for the merged files (`runs/F2c/map-min.txt`: no e2e line), typecheck, lint, the whole unit suite, the app build, the spec names checked, the plan, competence and Today specs on the default port (content-build 0; content-validate 0; review-check 0; content-tests 0; map-tests 0; map-min 0; tsc 0; lint 0; vitest-all 1; build-app 0; specs-exist 0; e2e-targeted 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; `runs/F2c/orchestrator-exit.txt`). The reviewer's required change as ruled: the advanced `leaps` no longer credited by the fourth-or-wider detector; the two advanced rungs' claim explicitly unmeasured until a detector proves octave-or-more material; the false `sharedBy` gone; the regression that a primer fourth satisfies no advanced claim. The builder's question, whether `runs/D3/candidate-rungs.md` should be regenerated in place, answered no: a run folder is that seam's record at its date, `runs/F2c/study-candidate-rungs.md` is the current report, and the drift since F2 is stated there. The docs/02 Part D clauses (the Stage 7 blues row and the ragtime.9 sentence, outside the brief's literal ownership) were read at the landing and kept: each says what the change made true. The reports the chain's build rewrote differ from the committed ones in line endings only. Meters at 05:57 local as X3c's note has them.Nothing heard.


## Doc rows

**`docs/08-test-map.md`.**

- **The F2 row's status cell.** If F2b's proposed wording was applied, replace its "both read as `interval.leap`" with "only `leap` read as `interval.leap`". Then, either way, append: "F2c (Entry 130): the advanced `leaps` maps to no demand (the leap detector finds a fourth or wider and cannot tell a fourth from an octave), so `blues.7`'s and `ragtime.9`'s octave-or-more leap is a concept no detector measures, and a fourth satisfies no claim of either;".
- **File lines.**
  - `test_taught_at.py`: append "; since F2c the advanced `leaps` maps to no demand: `blues.7` and `ragtime.9` claim no leap, and a fourth-only reading keeps none of their claims and keeps 2.1's".
  - `test_measured_truth.py`: in F2b's proposed clause, replace "(the leap among them)" with "(the left-hand pattern; since F2c not the leap)". Append "; since F2c neither `blues.7` nor `ragtime.9` claims the leap, and no excerpt is a candidate for either (the Anh. 113 cut among them)".
  - `test_study.py`: append "; since F2c no study is a candidate for `blues.7` or `ragtime.9`, and the 2.1 studies keep 2.1's beginner leap".

**`docs/03-content-pipeline.md`.** F2b's two proposed clauses naming the leap as a shared detector are withdrawn: "since F2b the leap too, one detector for the beginner's `leap` and the advanced `leaps`", and "(the left-hand pattern, and since F2b the leap)". Neither is applied at this base; do not apply them. The existing sentences ("the left-hand pattern, one detector for seven concepts, names none"; "a claim one detector answers for several concepts marked †") stay true.
