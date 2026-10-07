### Entry 219 — CL11a: Keep tempo charges a wrong key and charges a late right note once; a microphone pass counts on Today; Progress keeps the learner's word as theirs

Lane CL11a, lane 1 of CL11 (L10, U126, U127); brief `docs/prompts/tasks/CL11a-keep-tempo-charges-a-wrong-key.md`; the design `docs/design/evidence-truth.md` (*The build*, lane 1), approved in `docs/review/responses/1afa30d3.md` §2. Base `ee62c06c`. App code, its tests and its specs; no content, no stored row re-judged. The evidence beside this entry is in `docs/prompts/runs/CL11a/`, the pictures in `docs/prompts/pictures/cl11a/`.

## Judgement

What a learner meets, and nothing else:

- **A key the music does not ask for costs a note in Keep tempo.** A run with a wrong key beside every right note scored 100 % and passed; it now scores 0 and does not. One stray key in a ten-note passage is 90 %, the figure Wait for me gives the same playing. A chord with one note missed keeps two thirds of its credit, as before. Rhythm only is unchanged (it asks no key).
- **A right note played late costs once, as the miss.** It was a miss and a wrong key at once. The sheet's *Wrong notes* now counts wrong keys only.
- **The exemption has a bound, and the bound is the hard half.** A strike forgives a missed note only when it is *that note, late*: a pitch some opened step asks for, past its window by more than the tolerance and by less than a beat, whose note is still unplayed, and that no earlier late strike has stood for. At most one late strike per missed note. A second strike of the pitch, a pitch already played at its step, one a beat or more behind, one no step asks for, and a microphone guess the engine is not sure of are all wrong keys and cost one. Where the same pitch could be early for the step ahead and late for the step behind (a repeated note), it belongs to the nearer in time.
- **A microphone pass counts on Today.** An estimated measured pass is `passed-full`, so Today's row reads *done* where it read *played*. An estimated failure keeps the session's caution (`unknown`).
- **Progress shows the learner's word as theirs.** *N passed* and *Pieces you have passed, not yet projects* count and offer measured passes only; the word (*I already know this*, a Clean self-report, a paper Clean) stays on the lesson badge and the Library, as before.
- **Before playing, the Keep tempo card says what counts.** *Accuracy is the written notes you play right in time; each wrong note costs as much as a note you miss.* The sentence has one cost, seen in the pictures: on a phone held sideways the first-meeting card was already taller than the screen, and two more lines put its *Start* wholly below the fold (it scrolls; *Close* is at the top).

**Technical verdict:** done; the cases below are red on the base and green after, every mechanism has a mutant that fails a test, and the one fault the change exposed (where an early extra key is put on the record) is fixed at its cause. **Pedagogical verdict: unverified as teaching.** Whether 90 % net of wrong keys is the right bar is a teaching standard; the authored number is the rung's and is unchanged. **Nothing was heard.** Whether the microphone's estimate is good enough on a real piano to count at all is a fact about the detector: *no one in this process can decide this*, and this change aligns the readers on the rule already in force, it does not certify the detector. The pictures were looked at (see their section); nothing about how it sounds was.

## The mechanism, by file

| Where | Change |
| --- | --- |
| `app/src/engine/PracticeEngine.ts` `feedTempo` (:1079; the reading of a strike that matched no window at :1121–1158), `findLateStep` (:1349), `closeSlotAsMissed` (:1590), state at :393 and :399 | A strike that matches no window is read as early (the existing rule) or late (new) where the source is sure of the key and the run judges pitch. `missedPitches` (by step, pitch: what a closed window found unplayed) and `lateStruck` (what a late strike has stood for) are per lap and per run (`completeLap`, `resetRunTotals`) and forgotten at a recount (`recountFrom`: the clock is rewound, the count must not match a note from before the pause). The late strike is recorded as played with no step, as a wrong key is, and emitted `ok: false`. |
| same, :1242–1256 | **An early strike that turns out to be an extra is put against the step nearest the moment it was struck, as every wrong key is, not the step the on-time note later matched.** Found by the run (below); it is what makes the evidence rule correct. |
| `app/src/engine/Scoring.ts` :232–239 | Keep tempo accuracy is `max(0, hits − wrongNotesTotal) / expectedNotes`; Wait and rhythm only as before (`ScoreInput.rhythmOnly`, passed by the engine). `hits` is still the observed count; `measuresOf`'s `pitch.right` is that count and its doc says it is not the verdict. |
| `app/src/data/db.ts` :138, `app/src/evidence/measurement.ts` :136, :168–180 | `OBSERVATION_DEFINITIONS` 2, known set {1, 2}. Under 2, a Keep tempo step with a wrong key in `steps.wrong` is not right on the pitch channel (`{right: false, mixed: false, uniform: false}`, as `w`); timing still reads the right note's onset. Definitions-1 rows read exactly as before; an unknown version is still refused. |
| `app/src/data/sessionRun.ts` :562 | `scoreOutcome`: an estimated pass is `passed-full`, an estimated failure `unknown`. The self-report, rhythm-only, repeated-phrase, tempo-not-measured and nothing-heard exclusions are before it and unchanged. |
| `app/src/ui/screens/ProgressScreen.ts` :340, :452 | *N passed* and the pieces-passed offers read `selfPassed`. |
| `app/src/ui/help.ts` :119, `docs/04` §5f | `MODE_HELP.tempo.counts` says what the accuracy counts. |

Specs that follow the code: `docs/02-curriculum.md` Part G (what accuracy is; who counts as having passed; the Wait sentence), `docs/05` §2, §3 (the late rule, the accuracy), §9a, §11.4, `docs/04` §5f, §6 and the §3f line, the module note of `rungState.ts`, comments in `engine/types.ts`, `docs/08-test-map.md`.

## Counts re-derived at this tree

- **No rung asks for no tempo.** The built curriculum has 109 rungs with a `mastery` block; 11 state `minTempoPct: 0` (0.1–0.4, theory.3–5, improv.3–5, rock.overview) and take the Settings pair, which `coerceSettings` keeps between 30 and 130 (`settingsStore.ts:226`). So no criterion a rung produces has a tempo floor of nought. This agrees with the design's counts; the build is this worktree's own (`tools/content/build.py --offline`).
- **Where the old behaviour was asserted.** Found by running the whole unit suite on the changed source (338 files, 7,763 tests) and by reading the browser specs for wrong-note and accuracy assertions (`wrong`, `Wrong notes`, `wrongNotes`). The design's scan found one block; there were more, because it looked for an accuracy assertion beside a nonzero wrong count, and these assert the wrong count alone:

| Test | Assumption it held | Class and reason |
| --- | --- | --- |
| `engineTempo.test.ts` "200 ms late…" | four right notes late are four wrong keys | replace: the design's own; they are 0, its accuracy of 0 stands |
| `engineTempo.test.ts` U3 and "an on-screen tap…" (U66's two) | a right note stamped past its window is an extra | replace: the fence they hold (not rescued as a hit without a stall) is unchanged; the cost is once |
| `engineEarlyNote.test.ts` "played early and again on time" | (no accuracy asserted) | add: accuracy ¾ |
| `engine.spec.ts` "a note far outside the tolerance is wrong" | the first step's own pitch, 400 ms late, is wrong | replace by two: the right note is charged once; a key the piece does not ask for is wrong |
| `sessionAdaptation.test.ts` | an estimated pass is `unknown` | replace: passed-full; the failure stays unknown; a test title that named "estimated" among the unknowns |
| `evidenceOnlyMeasured.test.ts` | 2 is the example of an observation version no build reads | replace: 3; versions 1 and 2 are read |
| `observationsFromRun.test.ts` | the stamp is 1 | replace: 2 |
| `tests/e2e/fixtures/reader-learners.json` (held equal to what `readerMovesTheDemand.test.ts` makes) | rows under definitions 1 | regenerated with `C4C_WRITE_E2E_ROWS=1`: the diff is the stamp 1 → 2 on every row, the accuracies down by the wrong keys, and on one row one wrong key fewer (a misread key whose pitch an adjacent missed step asked for within a beat, read as that step's late note) |

## The cases

`app/tests/unit/keepTempoChargesAWrongKey.test.ts` (29 cases: 21 red on the base, 8 guards red under neither; each guard is red under a mutant), `definitionsTwoReadsAWrongKey.test.ts` (9: 6 red on the base), `todayCountsAMicrophonePass.test.ts` (6: 3 red), `progressKeepsTheLearnersWord.test.ts` (4: 3 red, the fourth a guard that a word later played at the standard counts), `help.test.ts` (one case, red), and the replaced cases above. Base: 42 red in the 15 files run, 2 of them `lessonClaimsAboutApp.test.ts` (red on the base too, below); the red record is `red-on-base.txt` with its first assertion, the browser's in `browser-red-engine-on-base.txt`. Lane: the same files green except those 2.

| Row of the design's table | Case | Base | Lane |
| --- | --- | --- | --- |
| a stray key with every note | accuracy 0, `evaluateOutcome` not passed, hits 4 and wrong 4 kept | red (accuracy 1) | green |
| the same playing in Wait | Wait 0 and `wwww`; Keep tempo equal to it | red | green |
| one stray among ten | 90 % both modes | red | green |
| floor | 4 right, 9 wrong: 0 | red | green |
| late D, quarter beat | wrong 0, missed 1, `hmhh`, no wrong mark, accuracy ¾ | red | green |
| four notes 200 ms late | wrong 0, accuracy 0 | red | green |
| a second late strike | the second is wrong | red | green |
| a late strike before its window's tick has run | the same late note | red | green |
| early then on time | wrong 1, accuracy ¾ | red | green |
| repeated same-pitch steps | the late C is the nearer step's, not early for the next; two late Cs stand for two missed Cs, a third is wrong | red | green |
| partial chord | the late note once; a second, and one of a pitch already played, wrong | red | green |
| unrelated key never forgiven | missed a beat earlier; already played; asked for only beyond the early reach; asked for by no step | red | green |
| each lap its own | a late D on both laps of a loop | red | green |
| where an extra is put | an early extra is against the step it was struck at, a stray against the nearest | red | green |
| mic | a sure key costs a note; a low-confidence guess is amber and spends nothing | red | green |
| rhythm only | an extra tap costs no accuracy; the right pitch after its window is still an extra | green | green |
| definitions 2 | a step with a wrong key is not right on pitch, neighbours are; timing untouched; Wait and a clean run read as under 1; 3 refused | red | green |
| definitions 1 | the same row stamped 1 reads right and counts right in its evidence | red | green |
| `scoreOutcome` | estimated pass `passed-full`, failure `unknown`, the exclusions hold; the card reads *done* / *played* through the state machine | red | green |
| Progress | measured pass counted and offered; the word and a Clean self-report neither; a word later played counts | red | green |
| the card | says what accuracy counts | red | green |

Browser, base build against lane build, port 5513, one worker: `engine.spec.ts` "a right note far outside the tolerance is not a hit… charged once" **red on the base** (wrongNotesTotal 1), green on the lane; its sibling (a key the piece does not ask for, far outside, is wrong) green on both.

## Mutants

19, `mutants.txt`: each is one line of one source file, restored from a byte copy after (checked), run against the unit files that hold its mechanism. **All 19 killed.** Net accuracy (M1); rhythm-only netted (M2); the exemption's four bounds — spent once (M3), a beat's reach (M4), the note still unplayed (M5), per lap (M6); nearer in time (M7); the confidence gate (M8) and the rhythm-only gate (M9); the early extra's placement (M10); the definitions-2 rule (M11), its guard for definitions 1 (M12), the known set (M13) and the stamp (M14); `scoreOutcome` both ways (M15, M16); Progress's totals and offers (M17, M18); the card (M19). M8 and M9 survived the first run; the two cases that kill them (a guess that spends nothing; the right pitch after its window in a rhythm-only run) were added and the whole set re-run.

## Checks

| Check | Result |
| --- | --- |
| `npx tsc -b` (app) | exit 0 |
| `npm run lint` (app), with the gitignored `app/build/` out of the way | exit 0 |
| `npx vitest run`, whole suite, exit 1 | 338 files, 7,763 tests: 7,755 passed, 5 skipped, 1 todo, **2 failed, both red on the base** (`unit-final.txt`: the run also held one throwaway probe file, since deleted, with one passing test, so its totals read 339 and 7,764) |
| `npm run build:app` | exit 0 |
| `python tools/docs/record_mirrors.py --check`; `test_record_mirrors.py` | fresh and 36 tests OK before this entry existed; with it, `--check` reports `stale-record` (the brief's `## Record` block still ends at *drafted* while an Entry 219 exists): the landing's record line, which the orchestrator's record script appends, was not written here |
| Playwright, 19 specs, 155 cases, port 5513, one worker, from a config copy, exit 1 | 153 passed, 2 failed (below) (`browser-green-targeted.txt`) |

The specs run: `engine`, `lesson-flow` (a pass played in Keep tempo, Progress *1 passed*), `progress`, `progress.hierarchy`, `projects`, `today`, `session-run`, `modes-ladder`, `modes-rhythm-only`, `score.rhythm-ladder`, `score.run`, `score.states`, `score.latch`, `score.ladder-route`, `mic`, `competence`, `transfer-offer`, `first-day`, `help-strip`: the ones that play a Keep tempo run or read a count, a pass, a card or a stored row this change moves. **Not run:** the other 12 the map names for `app/src/**` (`app-shell`, `converted-import`, `empty-states`, `feedback-placement`, `landscape`, `lab`, `library`, `midi-import`, `score.countin`, `score.readahead`, `score.screen`, `wide`): no Score-screen, layout or library code changed, and CI runs them.

- `progress.spec.ts:85` (a drill set ended with nothing answered, a 30 s wait for the drill to run): **red on the base build too** (`browser-two-failures-on-base.txt`). A drill screen; not this change.
- `today.spec.ts:670` (the held line in two lines, `lineRatio` NaN): passed on the base build, **failed once in the batch on the lane build and passed alone on it** (`browser-held-line-alone.txt`). A layout measurement of one row of text; not reproduced, not understood. It reads nothing this change touches.
- `lessonClaimsAboutApp.test.ts` (2 cases: blues.3's tool buttons; 4.7 blind): red on the base with this worktree's content build; not this lane's, cause not looked for.
- `expectedNote.test.ts` timed out at five seconds in the first whole run and passed on both later ones: load.

## Pictures

`docs/prompts/pictures/cl11a/`, taken by `pictures.spec.ts` (kept beside this entry; run from a config copy, not committed) on the lane build at phone upright 360 × 780, phone sideways 780 × 360 and tablet 1024 × 768. Every file was opened and looked at.

- `sheet-<shape>-top.png`, `sheet-<shape>-numbers.png`: the Keep tempo sheet after Hot Cross Buns played in time with a key the piece never asks for struck beside three of its notes (on the one pointer, after the written note is let go, inside its window). *Run finished*, **Accuracy 82 %** (14 of 17), **Wrong notes 3**, **Missed 0**, the *To pass* line naming the 90 % and the 80 % tempo. Every note on the staff is green, because the staff paints no mark for a key no step asks for (the strip flashes it for a moment): the reason for 82 % is the line two below it. On the base the same playing was 100 % and *Passed* (red case 1). Upright and tablet: the numbers are above the fold. Sideways: the sheet shows its first seven lines and scrolls, as it does for any run.
- `card-<shape>.png`: the Keep tempo card on first meeting, with the new sentence. Upright and tablet: the whole card and *Start* are on the screen. **Sideways (780 × 360) the card is taller than the screen on the base too**: a probe of both builds put *Start*'s top at 336 of 360 on the base and at 378 with the longer sentence (`card-geometry.txt`). The sheet scrolls on both (one wheel scroll brings *Start* to 295, and it is clicked on both builds) and *Close* stays at the top. So the sentence moves *Start* from a sliver on the screen to wholly below it at that shape: a cost of the sentence there and not a block; the sheet is `widgets.openSheet`'s, outside this lane.
- `progress-<shape>-top.png`, `progress-<shape>-pieces.png`: the totals line *1 started · 1 passed · 0 mastered* and, under *Pieces you have passed, not yet projects*, Hot Cross Buns alone. The same store held a measured pass (Hot Cross Buns), a piece the learner only said they know (a stored `selfPassed` row, Ode to Joy) and a piece started; the word is on neither line.
- `today-<shape>.png`: Today after the third activity of a session, the piece, was played in time on the screen keys: *Hot Cross Buns* wears *✓ done*, the two drills ended early *played*, the next row *next*. **This is the row a microphone pass now leaves, not a microphone pass**: no microphone run was driven through the Score screen (below).

## Learner-facing text, itemised

| Where | Before | After | Why |
| --- | --- | --- | --- |
| Keep tempo card and its first-sight card, *What counts?* (`help.ts:119`, `docs/04` §5f) | A pass needs both the accuracy and the share of the written tempo, in one run: the lesson’s numbers where it states them, otherwise the ones set in Settings. | the same, then: *Accuracy is the written notes you play right in time; each wrong note costs as much as a note you miss.* | the card is where what counts is told before the run; the design's optional line, which the response asks for |
| the sheet's *Accuracy*, Keep tempo (no new words: the number) | right notes in time, of the written | the same, less one note per wrong key, never below 0 | L10 |
| the sheet's *Wrong notes*, Keep tempo (the number) | counted a right note played late | wrong keys only | a late note is charged once, as the miss |
| Today's row for a microphone pass (`SESSION_TEXT.statePlayed` → `stateDone`: *played* → *done*) | played | done | the run counted on the lesson page; the word is the existing one |
| Progress totals line, *N passed* (the number) | counted the learner's word | measured passes only | the word is theirs |
| Progress *Pieces you have passed, not yet projects* (the list) | offered pieces the learner only said they know | measured passes and masteries only | as above |

No lesson text, vocabulary, score or curriculum row changed, so there is no content itemisation.

## Where the brief or the note was wrong, and what the run showed

1. **The note's scan for old assertions found one block; there were eight places** (table above). It looked for an accuracy assertion beside a nonzero wrong count; U66's two late-note fences and a browser case assert the wrong count alone.
2. **The note did not say where a wrong key lands, and the evidence rule makes that load-bearing.** The engine put an early extra (an early strike, then the same pitch on time) against the step the on-time note matched. Under definitions 2 that charges a step the learner read right: a misread of one note whose key is the next note's pitch cost the *next* step its pitch verdict. It showed as five cases in three existing files going red (`evidenceByDemand`, `recommendRespondsToEvidence`, `readerMovesTheDemand`), whose phrases are exactly that case. Fixed at the cause (the extra is put where it was struck); mutant M10 and a case of its own hold it.
3. **The note's "late strikes need the same treatment as early ones" is not enough when a pitch repeats.** The early rule alone takes any right pitch within a beat before an unopened step, so a C played 250 ms after its own step in a C-C passage was held as 750 ms early for the next C. The exemption needed a nearer-in-time choice between the two homes (M7).
4. **`rungState` needs no change, as the note says**, and rows judged under 2 meet it through the stored accuracy. **`measuresOf`'s raw hit count has no reader that treats it as accuracy** (a search of `app/src` for readers of a row's `pitch`: `evidenceJob` reads `pitch.of`, `measurement` reads `pitch.estimated`; none reads `right`), and a case holds `right` and the verdict apart.
5. **Adjacent findings, recorded and not fixed.** (a) *A looped Keep tempo run's accuracy saturates*: `hits` sums every lap and `expectedNotes` is one lap's, so after the first lap any slack makes it 100 % (observed at the engine: 4 hits of 2 expected, one wrong key, accuracy 1). The Score screen passes the engine's cumulative score to the sheet and the record, and nothing in it reads `score.loops`; not traced to a stored pass. Pre-existing at `ee62c06c` (the base's `hits / expectedNotes` has the same sum; not bisected). **P0 candidate** (a loop can pass with misses), owner of the Score recording; this change swallows a wrong key in a loop the way a miss is. (b) A wrong key struck nearest a step with nothing for the learner (the other hand's step, a rest) costs accuracy and has no step to carry the evidence verdict. P3. (c) Wait's step-clean rule and Keep tempo's note rule give the same figure only for a single line; a chord with one wrong key costs a whole step in Wait and one note in Keep tempo (the design's unit choice, restated).

## Not done, and open

- **Before pictures** (the base's sheet, card and Progress) were not taken: the base's numbers are the red runs'; the pictures are of the lane build.
- **Today's row was pictured for a MIDI-style pass played on the screen keys**, which is the same row a microphone pass now leaves: no microphone run was driven through the Score screen, so the browser did not exercise a detector. The unit cases carry the outcome (`scoreOutcome`, `cameTo`, the state machine).
- **Open, no one in this process can decide it:** whether the microphone's sure wrong keys (confidence 1, `wrongNoteConfidence`) are rare enough on a real piano for net accuracy to be fair to an estimated run.
- **Unverified as teaching:** the 90 % bar net of wrong keys; whether the card's sentence reads right to a learner (a copy judgement).
- The late-note reach is a beat, the early rule's own: a product choice, chosen because it is the reach already defended and the music's unit. A second reviewer may prefer a tolerance multiple; the case set pins the bound either way.

## Question for the reviewer

Progress now leaves self-passed pieces out of *Pieces you have passed, not yet projects*, as `1afa30d3.md` §2 says. `projectStore.passedOnRecord` (G96 item 9, `responses/questions-71bd6cee.md`) still counts the learner's word as passed for the project sheet's *Keep it playable* offer, so the two readers of the word now differ. The design note allowed the other shape (list the piece with *you said you can play it*). Which does the reviewer want for the list, given a learner who told the app they know a piece and can no longer start its project from Progress, only from the lesson or the Library?

## Files changed

Source: `app/src/engine/PracticeEngine.ts`, `engine/Scoring.ts`, `engine/types.ts` (comments), `app/src/data/db.ts`, `data/sessionRun.ts`, `app/src/evidence/measurement.ts`, `evidence/rungState.ts` (module note), `app/src/ui/screens/ProgressScreen.ts`, `app/src/ui/help.ts`. Specs: `docs/02-curriculum.md`, `docs/04-ui-spec.md` (§5f, §3f, §6: the spec's printed copy of the card and the lines this changes, which `help.test.ts` compares), `docs/05-score-follow-engine.md`, `docs/08-test-map.md`. Tests: new `keepTempoChargesAWrongKey`, `definitionsTwoReadsAWrongKey`, `todayCountsAMicrophonePass`, `progressKeepsTheLearnersWord` (unit); changed `engineTempo`, `engineEarlyNote`, `sessionAdaptation`, `evidenceOnlyMeasured`, `observationsFromRun`, `help`, `helpers/observed.ts` (a `strayKeys` plan option), `tests/e2e/engine.spec.ts`, and the regenerated `tests/e2e/fixtures/reader-learners.json`. Evidence: `docs/prompts/pictures/cl11a/` (18 pictures: sheet, card, Progress and Today on each of the three shapes, the sheet and Progress with two views each) and, in `docs/prompts/runs/CL11a/`: `red-on-base.txt`, `green-on-lane.txt`, `unit-final.txt`, `mutants.txt` with the script that ran it (`mutants.ps1`), `browser-green-targeted.txt`, `browser-red-engine-on-base.txt`, `browser-two-failures-on-base.txt`, `browser-held-line-alone.txt`, `card-geometry.txt`, and the specs and runner that took the pictures and the geometry (`pictures.spec.ts`, `pictures-helpers.ts`, `card-geometry-probe.spec.ts`, `playwright.cl11a.config.ts`, `pw-run.sh`; paths scrubbed to `<worktree>` and `<home>`, none of them for the commit's suites). At the end the worktree's `app/dist`, `app/build/` (the config copies and the base build), `build/` (logs and copies), the copied imported-score folders and the content build were deleted; `app/node_modules` stays.

Not touched, as the brief asks: `session.ts`, `evidence.ts`, `ladder.ts`, `transferPolicy.ts`, `demandReadings.ts`, `readingState.ts`, `skills.json`, `validate.py`, `ScoreScreen.ts`, `style.css`.

**Orchestrator's note at the landing (2026-10-02).** CL11a's worktree committed by name (26733bcb) and merged (0eca83a1). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/CL11a/map-min.txt`), typecheck, lint, the whole unit suite, the app build, the spec names checked, then the specs the map's minimum names on the default port (map-tests 0; map-min 0; tsc 0; lint 0; vitest-all 1; build-app 0; specs-exist 0; e2e-targeted 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; `runs/CL11a/orchestrator-exit.txt`). Dispatched at `ee62c06c`; the design approved with its two lanes (`responses/1afa30d3.md` §2), so no pre-build review.. CL11a landed: Keep tempo charges a wrong key; a microphone pass counts; Progress keeps the learner's word
