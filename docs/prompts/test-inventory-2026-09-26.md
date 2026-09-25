# The test-suite inventory, 2026-09-26 (AT-15): every test file classified by the assumption it encodes

Task C0b (`tasks/C0b-test-inventory.md`); backlog area 11, rows Q1–Q17. The companion
`test-inventory-2026-09-26.csv` has one row per test file and one more per test that differs
from its file's class: **740 rows for 383 files**. This document holds the judgement, the
statistics, the four lists the brief asks for, and what the reading turned up on the way.

**What this is and is not.** A reading of the tests, not a run of them: nothing here says a
test passes, and nothing says an invariant holds. The classes are judgements about what each
assertion protects and what it assumes. The test folders were read at the tree of `6eeb6d5`
(T40's five edited test files were on disk when read and were committed unchanged at 18:00;
no test file changed after 17:44). Nothing was heard, no screen was opened, no suite was run.

---

## 1. The judgement, in five lines

1. **Most of the suite protects the product, not the old model.** By literal test calls, 3,181
   of 3,778 (84 %) guard invariants that survive the rebuild: conversion fidelity, engine
   judging and timing, the state machines, data integrity, the screen contracts and the truth
   rule; 292 of 357 test files are `preserve` at file level. The content pipeline and the engine
   are the most solid ground.
2. **The old model is concentrated, and it is mixed with real invariants.** About 417 tests
   (11 %: 168 to replace or delete, 249 to revise for C–X) encode the stage as level, the
   item-flag pass, `lessonComplete`'s count, first-incomplete-rung selection, declared levels
   and bands, and the ≥ 3-options rule. They touch 98 files, 39 of them holding a test to
   replace or delete (selectors, session, progress store, rung mastery, placement, levels, the
   pass frame inside the truth tests, first-day, lesson-flow, Today, Plan, thirteen
   lesson-claim tests), and those files also hold invariants a wave must carry over rather
   than delete (the swap sheet never offers the item it replaces, mastery on two days, local
   day keys).
3. **Proxy one, the window judged by the renderer's own numbers.** `score.window-rule` now reads
   drawn bar widths, but the natural width it compares them with is the renderer's own table,
   a sheet missing from it is skipped silently, and `data-stretch`/`data-fit` still decide
   exemptions; the state gallery checks no spacing and no floor at all, so a stretched bar
   passes all its cells, and the corpus still uses the next-bar check that `sequence` replaced
   after it passed a bar 400 px off the edge.
4. **Proxy two, tests that take the answer from the app.** Drill and score tests play whatever
   the app says it expects (`data-expects`, the debug hook, `playInTime` striking the run's
   own expected notes), so a drill or a score expecting the wrong notes passes; one unit test
   locks in a wrong note name (an E♭ named D♯ on the Wait-mode status line).
5. **Proxy three, sentences read from code instead of the glass.** 288 assertions in 46 files
   take a sentence from source text or a module function instead of the rendered screen:
   63 lesson-claim rows pass if the sentence exists anywhere in `ScoreScreen.ts`, and the
   truth-rule wording ("not measured", "kept as recorded") is checked as function returns, so
   a sheet that stopped printing it would leave the suite green.

---

## 2. How to read the lists and the CSV

**Classes** are the reviewer's five: `preserve` (a genuine invariant that survives), `revise`
(the behaviour stays important; the assertion encodes the old implementation or a proxy),
`replace` (the concern survives, the frame does not), `delete` (locks in obsolete behaviour or
a known bug, and nothing it protects survives), and `add` (missing coverage; §7). No row is
left unclassified.

**A file's class is its main class.** Where some of its tests differ, the file row says
`mixed = yes` and each differing test has its own row, named `file › test name`. So a file can
be `replace` and still hold `preserve` tests (`curriculumSelectors`, `progressStore`,
`session`): **before deleting or replacing a file, a wave looks up its single tests in §4 and
carries the preserve ones over.**

**CSV columns**: the brief's eight (`file`, `suite`, `protects`, `assumption`, `reads`
(outcome, or `proxy: <kind> — <what>`), `class`, `wave`, `notes`), then `invariant` (the
group codes of §4), `outcome_instead` (for proxy rows, what to read instead), `n_tests`,
`machine_literals`, `code_strings`, `fixed_waits` and `mixed`. Suites are `unit`, `e2e`,
`states`, `tour`, `content`, `converter`; `-helper` marks a non-test file (fixtures, harnesses,
probes, photographers' helpers), which still gets a row because several carry assumptions of
their own. **Waves**: `B done` (revised in Wave B), `C`, `D`, `E`, `F`, `G`, `X`, `H`, or `—`
when no planned change touches the test.

**How the reading was done.** Nine readers, each given a disjoint list of files and one shared
rubric (the classes, the old-model assumptions with their waves, the proxy kinds, the counting
rules, the invariant codes). Each reported reading every file on its list in full; each
checked its own rows against its list and every per-test name against the source. The
coordinator merged the fragments, confirmed by script that every one of the 383 files has
exactly one file row, reviewed every row in compact form and a dozen in full, verified six
findings at the source lines (marked verified in §8), and changed two rows (`selectorsCacheInvariant`
from delete to revise, because backlog Q5 names it as a data-integrity invariant; `dark-ink`'s
wave, because B fixed its race and not its proxy), filling nine empty `outcome_instead` cells.
Every change is marked `Coordinator:` in the row's notes.

---

## 3. Statistics

**Files per class.** Test files by their main class; non-test files counted apart.

| suite | test files | preserve | revise | replace | delete | helpers (non-test files) |
|---|---|---|---|---|---|---|
| unit | 208 | 183 | 16 | 9 | 0 | 11 (preserve 10, revise 1) |
| e2e | 105 | 76 | 26 | 3 | 0 | 5 (revise 2, preserve 3) |
| states | 1 | 0 | 1 | 0 | 0 | 3 (preserve 1, revise 2) |
| tour | 7 | 0 | 5 | 0 | 2 | 5 (revise 4, preserve 1) |
| content | 35 | 32 | 1 | 2 | 0 | 1 (preserve 1) |
| converter | 1 | 1 | 0 | 0 | 0 | 1 (preserve 1) |
| **all** | **357** | **292** | **49** | **14** | **2** | **26** |

| suite | tests (literal calls) | preserve | revise | replace | delete |
|---|---|---|---|---|---|
| unit | 2130 | 1853 | 171 | 106 | 0 |
| e2e | 680 | 497 | 170 | 11 | 2 |
| states | 1 | 0 | 1 | 0 | 0 |
| tour | 15 | 0 | 9 | 0 | 6 |
| content | 927 | 807 | 77 | 43 | 0 |
| converter | 25 | 24 | 1 | 0 | 0 |
| **all** | **3778** | **3181** | **429** | **160** | **8** |

| suite | machine-literal assertions (files) | code-string assertions (files) | fixed waits, readers (files) |
|---|---|---|---|
| unit | 142 (18) | 267 (40) | 23 (8) |
| e2e | 109 (41) | 4 (2) | 171 (42) |
| states | 6 (2) | 0 (0) | 17 (1) |
| tour | 22 (4) | 0 (0) | 49 (9) |
| content | 12 (5) | 17 (4) | 1 (1) |
| converter | 0 (0) | 0 (0) | 0 (0) |
| **all** | **291 (70)** | **288 (46)** | **261 (61)** |

The second table counts literal `test(`/`it(`/`def test_` calls, each given its file's class
unless a per-test row moves it. A call inside a loop counts once however many tests it
generates (`lessonClaimsAboutApp`'s 13 calls generate about 275 tests, by its reader's
count), so the proportions are of written tests, not of executed ones. Split by what the
non-preserve tests assume: **168 replace or delete** (the old frame), **249 revise because a
C–X change reshapes them** (the old model, mostly), **180 revise for a proxy or a score UX rule
alone** (waves H, B done or none).

**Literal numbers measured on a machine: 291 assertions in 70 files.** What they are:

- 87 in two unit files are numbers a lesson states about the built content (58 in
  `lessonClaimsAboutApp`, 29 in `lessonClaimsAboutMusic`). They are meant to go red when the
  content changes, which forces the lesson to be rewritten; they are claims, not machine
  measurements, but they are counts of today's content and every one moves with Wave E or F.
- At least 29 are spec-owned numbers on a machine-measured quantity: `01` §6's budgets (7 in
  `perf`), R2's 96 px and R4's 40 px in the hierarchy and setup specs, `05` §11's detector
  thresholds (11 in `pitchDetector`). The project's rules allow them; they are still measured on
  the runner, and `04`'s own text asks 48 px of a button where the tests hold 40 (§8, N11).
- The rest (about 175) are chosen fractions of the viewport, built-content counts used as
  preconditions (`chartDoor` needs an unmeasured row to exist, `planNoUnobtainableRungs` more
  than 50 rungs, `score.spec` 42 fixtures, `offline` items > 500, `sightReadingPromises`
  exactly nine rows), audio thresholds on rendered-soundfont fixtures (`micCalibration`,
  `pitchDetector`), and a few milliseconds (`perf`'s 60 s and 8 ms, `score.spec`'s 16.7 ms on a
  harness `perf.spec` itself says times the wrong span). The engine and timing unit tests take
  every millisecond they assert from a fake clock the test owns; those are not counted.

**Strings read from code rather than the glass: 288 assertions in 46 files.** Roughly a hundred
read source text (`lessonClaimsAboutApp` 63 rows, `lessonShape` 11, `test_pdmx` 6, `__doc__` checks 7,
`test_tips` 4, `labPresets` 3, and the regex gates in `help`, `labHelp`, `noGenreSelection`,
`selectorsCacheInvariant`). About 190 take a user-facing sentence from a module function instead
of the rendered screen (`techniqueMeasures` 15, `folderLibrary` 13, `midiHands` 11,
`coaching` 9, `compositionStatus` 8, `progressRanking` 8, `storagePersistence` 7,
`halfPedalDepth` 7, `lessonSongEmpty` 7, and twenty-three smaller files). A few of the source reads
are joins by design (`docsConsistency`, the lab presets' two copies, the tips' drill kinds) and
are gates, not proxies; the rest could pass over a screen that no longer says the sentence.

**Fixed waits instead of a state: 261 by the readers' count, in 61 files.** e2e 171 in 42
files, tour 49 in 9, the state gallery 17, unit 23 in 8 (21 of them zero-delay `setTimeout`
flushes, two real sleeps of 600 and 700 ms), content 1. A mechanical count agrees in shape:
192 `waitForTimeout` calls in 42 e2e files, 48 in 9 tour files, 17 in the gallery spec, one
`time.sleep`. The readers did not count a key held down for a duration (that is the input,
not a wait) and did count a timeout-only poll. `score.states.spec.ts` alone holds 65. Two
patterns account for many: **`data-measured` does not mean settled** (it is set in
`measureLoaded`, `WindowRenderer.ts:3910`, and the re-plan runs after it), so Wave B's two
revisions in `score.screen` padded it with `waitForTimeout(500)`; and T40's committed edits add
three more (`score.screen` one of 1 s before asserting nothing was saved, `score.states` two of
300 ms) plus `lab.spec`'s one-second waits before counting an absence. Both want the page to
publish a state ("fit settled", "write committed") that a test can wait on.

**What CI does not run.** CI runs the content tests, the unit tests and `app/tests/e2e` only
(`.github/workflows/ci.yml` 55, 78, 86). The state gallery, the tour and corpus, and the MIDI
converter's harness are never run there, so the invariants they alone hold (the converter's
note count from the file's own bytes; the corpus's "the notes coloured current are the notes the
run waits for") are not gates. Inside CI, three kinds of test skip silently: the content tests
run before `build.py`, so every test that needs built content or a gitignored edition skips
(`score_checks`' nine known items, the real-curriculum `technique_units`, the Cleopha and
`school.krn` editions, the built-content checks in `tips`, `finder`, `validate_p11`,
`validate_reach`, `pdmx`); `midiParity` compares against references under the gitignored
`build/`, so only its fallback runs; and the screenshot comparisons in `score.spec` and
`score.layout` are skipped in CI.

---

## 4. The invariant list (Q5): every preserve test, by the invariant it protects

**309 files and 82 single tests** carry a genuine invariant (one of the files, an environment
shim, is in no group). A file appears under every group
it carries, so the groups overlap. "Single tests" are `preserve` tests inside files whose main
class is something else: they are the ones most at risk, because the file around them is due
to be replaced. Before a wave deletes or replaces any file, it checks the file against this
list and the CSV's `invariant` column, and says in its report where each invariant it touched
is now asserted.

Five cautions go with the list:

- **Preserve means the invariant, not every line.** Many preserve files also carry a proxy
  (their `reads` column says which, and §5 lists them): the invariant stays, the assertion may
  still need revising.
- **The truth rule lives in today's frame.** The T37 and T40 tests (`recordTruth`,
  `scoreSummaryTruth`, `engineScoring`'s "measured no tempo", `score.run`, `score.screen`,
  `score.states`' T40 test, `lab`) are preserve for the rule (nothing displayed or recorded that was not
  measured) while asserting through `passed`, `masterEligible`, `status` and `masteredOn`, which
  Wave C replaces. C rewrites the frame and keeps each rule, test for test.
- **Some invariants are read from the drawn page in only a few places.** "The next bar is on
  the glass" is read from the page only by e2e and tour specs (`score.layout`'s test of that
  name, `score.window-rule`'s rule on the next bar, the tour's `sequence`), all three classed
  `revise` for the proxies beside it; the unit window arithmetic (`slots`, `readAheadScale`,
  `autoFit`) reads function returns. If Wave H rewrites those specs and keeps only the units, a
  screen without its next bar would pass.
- **Not every invariant here is a gate** (§3, what CI does not run): the converter harness, the
  corpus, the sequence and the gallery run only locally.
- **DISTORT is the thinnest group** (9 files, 12 single tests): most of the window's specs are
  `revise` because they read a proxy beside the drawn outcome, so the outcome checks inside
  them (the drawn bar width against natural, the five-line staff on the glass, the ink against
  the stage) are the invariant, and a rewrite keeps those while it drops the flags.

**XML, MusicXML and render validity, conversion fidelity** (60 files, 8 single tests inside other files)

Files: `bisect-render.spec.ts`, `carry-overs.spec.ts`, `content-render.spec.ts`, `converted-import.spec.ts`, `midi-import.spec.ts`, `modes-engraving.spec.ts`, `score.spec.ts`, `accents.test.ts`, `accompanimentLab.test.ts`, `answerSheet.test.ts`, `engineScoring.test.ts`, `harmony.test.ts`, `fixtures.ts`, `golden.ts`, `perfectRun.ts`, `scoreCatalog.ts`, `lessonClaimsAboutMusic.test.ts`, `midiHandSplit.test.ts`, `midiHands.test.ts`, `midiImport.test.ts`, `midiParity.test.ts`, `midiParse.test.ts`, `midiQuantise.test.ts`, `midiRhythm.test.ts`, `midiWriter.test.ts`, `perfectPerformance.1.test.ts`, `perfectPerformance.2.test.ts`, `perfectPerformance.3.test.ts`, `perfectPerformance.4.test.ts`, `perfectPerformance.5.test.ts`, `perfectPerformance.6.test.ts`, `perfectPerformance.7.test.ts`, `perfectPerformance.test.ts`, `scoreModel.test.ts`, `scoreModelKnownIssues.test.ts`, `scoreSmoke.test.ts`, `sightReadingPromises.test.ts`, `trimMusicXml.test.ts`, `mxlutil.py`, `test_abc_tools.py`, `test_author.py`, `test_bar_splits.py`, `test_convert.py`, `test_convert_cache.py`, `test_export_durations.py`, `test_fingering.py`, `test_generator.py`, `test_generator_invariants.py`, `test_hanon.py`, `test_harmony_families.py`, `test_loose_attributes.py`, `test_note_loss.py`, `test_render_check.py`, `test_renumber.py`, `test_score_checks.py`, `test_silent_staff.py`, `test_truncation_scan.py`, `test_validate_sections.py`, `converter/parity_reference.py`, `converter/test_converter.py`.

Single tests: `difficulty.test.ts` › counts a repeated bar once, however many passes the player makes; `difficulty.test.ts` › gives a lead sheet the melody it has, not the chords it names; `sightReading.test.ts` › drives a perfect Wait run to the finish; `sightReading.test.ts` › escapes a title that would otherwise break the XML; `sightReading.test.ts` › maps durations onto note types, dots included; `sightReading.test.ts` › writes a two-staff measure with a backup between the staves; `slots.test.ts` › never asks the engraver for a block that starts on bar 1; `slots.test.ts` › shows the second ending as the repeat comes round.

**DET, deterministic generation where intended** (16 files, 2 single tests inside other files)

Files: `engine.spec.ts`, `lab.spec.ts`, `accompanimentLab.test.ts`, `drillFromCatalog.test.ts`, `drillTheory.test.ts`, `drills.test.ts`, `harmonyDrills.test.ts`, `labBothWays.test.ts`, `labRoute.test.ts`, `midiQuantise.test.ts`, `sightReadingPromises.test.ts`, `simonDrill.test.ts`, `tradingFours.test.ts`, `test_convert_cache.py`, `test_generator.py`, `test_pdmx.py`.

Single tests: `sightReading.test.ts` › is deterministic and differs between seeds; `sightReading.test.ts` › stays inside [0, 1).

**NOTES, note, pitch, spelling, chord and fingering correctness** (61 files, 4 single tests inside other files)

Files: `chart.spec.ts`, `doors.spec.ts`, `drills-review.spec.ts`, `drills.spec.ts`, `lab.spec.ts`, `midi.spec.ts`, `modes-chart-from-a-lesson.spec.ts`, `modes-free-play.spec.ts`, `score.pickup-numbers.spec.ts`, `score.readahead.spec.ts`, `score.run.spec.ts`, `score.screen.spec.ts`, `score.spec.ts`, `score.strip-span.spec.ts`, `Piano.test.ts`, `accents.test.ts`, `accompanimentLab.test.ts`, `answerSheet.test.ts`, `backingLoop.test.ts`, `chordChart.test.ts`, `drillFromCatalog.test.ts`, `drillParamsRead.test.ts`, `drillTheory.test.ts`, `drills.test.ts`, `engineWait.test.ts`, `harmony.test.ts`, `harmonyDrills.test.ts`, `heldChord.test.ts`, `perfectRun.ts`, `labBothWays.test.ts`, `lessonClaimsAboutMusic.test.ts`, `micCalibration.test.ts`, `midiHandSplit.test.ts`, `midiHands.test.ts`, `midiParity.test.ts`, `midiParse.test.ts`, `midiRhythm.test.ts`, `midiWriter.test.ts`, `parseMidiMessage.test.ts`, `pitchDetector.test.ts`, `pitchDsp.test.ts`, `scoreModel.test.ts`, `scoreTypes.test.ts`, `simonDrill.test.ts`, `staffCard.test.ts`, `stripRange.test.ts`, `tradingFours.test.ts`, `test_abc_tools.py`, `test_author.py`, `test_convert.py`, `test_fingering.py`, `test_generator.py`, `test_generator_fingering.py`, `test_generator_invariants.py`, `test_hanon.py`, `test_harmony_families.py`, `test_import_kern.py`, `test_loose_attributes.py`, `test_score_checks.py`, `converter/parity_reference.py`, `converter/test_converter.py`.

Single tests: `difficulty.test.ts` › counts sharps and flats from the stored name; `difficulty.test.ts` › gives a lead sheet the melody it has, not the chords it names; `difficulty.test.ts` › reads every name the model can actually store; `sightReading.test.ts` › spells accidentals to match the key.

**TIMING, timing, judging and event ordering** (65 files, 1 single tests inside other files)

Files: `drills-review.spec.ts`, `engine.spec.ts`, `feedback-placement.spec.ts`, `generate-audio-fixtures.spec.ts`, `metronome.spec.ts`, `mic.spec.ts`, `modes-trading-fours.spec.ts`, `score.blind.spec.ts`, `score.countin.spec.ts`, `score.latch.spec.ts`, `score.readahead.spec.ts`, `score.rhythm-ladder.spec.ts`, `score.run.spec.ts`, `trading-fours.spec.ts`, `BeatScheduler.test.ts`, `Metronome.test.ts`, `accents.test.ts`, `articulationVoicingShaping.test.ts`, `backingLoop.test.ts`, `chordChart.test.ts`, `countIn.test.ts`, `drillAfterAMiss.test.ts`, `drillTheory.test.ts`, `drills.test.ts`, `engineEarlyNote.test.ts`, `engineMic.test.ts`, `engineRhythmOnly.test.ts`, `engineScoring.test.ts`, `engineTempo.test.ts`, `engineWait.test.ts`, `harmonyDrills.test.ts`, `engineHarness.ts`, `perfectRun.ts`, `runDetector.ts`, `inputSources.test.ts`, `labBothWays.test.ts`, `latency.test.ts`, `loopbackLatency.test.ts`, `metronomeScreenStop.test.ts`, `micLatencyOnce.test.ts`, `micSourceConnect.test.ts`, `pdfTiming.test.ts`, `perfectDrills.test.ts`, `perfectPerformance.1.test.ts`, `perfectPerformance.2.test.ts`, `perfectPerformance.3.test.ts`, `perfectPerformance.4.test.ts`, `perfectPerformance.5.test.ts`, `perfectPerformance.6.test.ts`, `perfectPerformance.7.test.ts`, `perfectPerformance.test.ts`, `pitchDetector.test.ts`, `rhythmCountIn.test.ts`, `scoreModel.test.ts`, `scoreSession.test.ts`, `scoreTypes.test.ts`, `stats.test.ts`, `steadiness.test.ts`, `swingJudging.test.ts`, `tapTempo.test.ts`, `techniqueMeasures.test.ts`, `tempoLadder.test.ts`, `tradingFours.test.ts`, `converter/test_converter.py`, `playInTime.ts`.

Single tests: `perf.spec.ts` › a cold 2-bar window renders inside the first-render budget.

**STATE, the state-machine tables** (90 files, 23 single tests inside other files)

Files: `app-shell.spec.ts`, `carry-overs.spec.ts`, `chart.spec.ts`, `doors.spec.ts`, `drills-review.spec.ts`, `drills.spec.ts`, `engine.spec.ts`, `help-strip.spec.ts`, `lab-both-ways.spec.ts`, `lab.spec.ts`, `lesson-tools.spec.ts`, `metronome.spec.ts`, `midi.unplug.spec.ts`, `modes-chart-from-a-lesson.spec.ts`, `modes-chart-from-the-score.spec.ts`, `modes-dictation.spec.ts`, `modes-duet.spec.ts`, `modes-free-play.spec.ts`, `modes-hold-the-chords.spec.ts`, `modes-lab-unlock.spec.ts`, `modes-ladder.spec.ts`, `modes-play-the-tune.spec.ts`, `modes-simon.spec.ts`, `modes-trading-fours.spec.ts`, `mounted-once.spec.ts`, `pdf.spec.ts`, `plan.spec.ts`, `score.blind.spec.ts`, `score.countin.spec.ts`, `score.hearbar.spec.ts`, `score.ladder-route.spec.ts`, `score.latch.spec.ts`, `score.rhythm-ladder.spec.ts`, `score.run.spec.ts`, `score.screen.spec.ts`, `score.spec.ts`, `score.stepper-limits.spec.ts`, `setup-layout.spec.ts`, `setup.spec.ts`, `shelf.spec.ts`, `start-and-return.spec.ts`, `sweeps.spec.ts`, `tour-practice-modes.spec.ts`, `trading-fours.spec.ts`, `update.tab-nav.spec.ts`, `AudioEngine.test.ts`, `Metronome.test.ts`, `boot.test.ts`, `chordChart.test.ts`, `contentFetchTimeout.test.ts`, `countIn.test.ts`, `drillAfterAMiss.test.ts`, `drillNotation.test.ts`, `drillStaffPolicy.test.ts`, `drillWalkthrough.test.ts`, `dynamicsDrillCard.test.ts`, `engineTempo.test.ts`, `engineWait.test.ts`, `errorBoundary.test.ts`, `folderAssign.test.ts`, `folderReopen.test.ts`, `halfPedalDepth.test.ts`, `engineHarness.ts`, `labRoute.test.ts`, `labToolFields.test.ts`, `labVerdictOnStop.test.ts`, `ladderTool.test.ts`, `lazyScreenOrphan.test.ts`, `lessonPaperBookPicker.test.ts`, `metronomeScreenStop.test.ts`, `midiConnectInFlight.test.ts`, `pdfSystemPlan.test.ts`, `perfectDrills.test.ts`, `planStageChevron.test.ts`, `planTracksSheet.test.ts`, `reorder.test.ts`, `router.test.ts`, `scoreMidRunSettings.test.ts`, `scoreSession.test.ts`, `scoreSheetRows.test.ts`, `scoreSummaryTruth.test.ts`, `scoreTourRoute.test.ts`, `settingsDownload.test.ts`, `setupProgress.test.ts`, `sheetIsolation.test.ts`, `simonDrill.test.ts`, `simonTurnCue.test.ts`, `tempoLadder.test.ts`, `todayInputChip.test.ts`, `tracks.test.ts`.

Single tests: `finder.spec.ts` › copies the prompt to the clipboard; `modes-rhythm-only.spec.ts` › the row is gone in a mode with no clock, which is where it would be dead; `score.head-height.spec.ts` › the hands control is reachable during a run when the bar has sent it to the shee; `score.states.spec.ts` › T40: a performance with Hear it inside it is kept as practice; `tips.spec.ts` › is collapsed during a set, on the first meeting and after; `today.spec.ts` › starting the session opens the first row; `autoFit.test.ts` › leaves the engraving alone when only the height changed during a run; `autoFit.test.ts` › searches again when the width changed — the phone was turned; `curriculumSelectors.test.ts` › drops songs when asked, which is the "not a song" filter; `curriculumSelectors.test.ts` › honours the limit; `curriculumSelectors.test.ts` › never offers the item you are replacing; `curriculumSelectors.test.ts` › never returns the same item twice; `curriculumSelectors.test.ts` › skips what is already in the session; `prerequisites.test.ts` › never locks anything when the setting is off; `prerequisites.test.ts` › returns the same shape whether it is off or open, so a caller cannot confuse the; `session.test.ts` › drops a row it cannot fill rather than showing an empty one; `session.test.ts` › fills the template in order and never repeats an item; `session.test.ts` › the "not a song" filter removes songs; `sightReading.test.ts` › drives a perfect Wait run to the finish; `slots.test.ts` › clips the last system at the window, so the count is exact; `slots.test.ts` › is the bar that will be played, not the bar printed after; `slots.test.ts` › never asks the engraver for a block that starts on bar 1; `slots.test.ts` › never re-draws the slot the cursor is in.

**DISTORT, no distortion, measured on the drawn outcome; next music visible** (9 files, 12 single tests inside other files)

Files: `modes-engraving.spec.ts`, `score.screen.spec.ts`, `score.spec.ts`, `tour/t30.ts`, `pdfPageCache.test.ts`, `pdfSystems.test.ts`, `pieceExtent.test.ts`, `systemPlan.test.ts`, `tablet.test.ts`.

Single tests: `score.slide.spec.ts` › holds the cursor a third across once the piece is under way; `score.window-rule.spec.ts` › mid-run on a phone sideways, the folded chrome leaves the music on the stage; `score.window-rule.spec.ts` › the window never shrinks as the stage widens across the look-ahead breakpoint; `autoFit.test.ts` › leaves the engraving alone when only the height changed during a run; `autoFit.test.ts` › searches again when the width changed — the phone was turned; `slots.test.ts` › a cold draw at the end fills the screen from behind, not from black; `slots.test.ts` › always has the bar after the cursor on the screen, until the last; `slots.test.ts` › clips the last system at the window, so the count is exact; `slots.test.ts` › is the bar that will be played, not the bar printed after; `slots.test.ts` › never re-draws the slot the cursor is in; `slots.test.ts` › shows the second ending as the repeat comes round; `slots.test.ts` › walks a pickup piece with the bar after the cursor always on the screen.

**DATA, persistence and data integrity** (67 files, 15 single tests inside other files)

Files: `app-shell.spec.ts`, `content-render.spec.ts`, `converted-import.spec.ts`, `drills-review.spec.ts`, `drills.spec.ts`, `folder.add.spec.ts`, `folder.spec.ts`, `lab.spec.ts`, `library.spec.ts`, `mic.spec.ts`, `midi-import.spec.ts`, `midi.spec.ts`, `midi.unplug.spec.ts`, `mounted-once.spec.ts`, `pdf-paper.spec.ts`, `pdf.spec.ts`, `progress.spec.ts`, `setup.spec.ts`, `shelf.spec.ts`, `start-and-return.spec.ts`, `update.tab-nav.spec.ts`, `RingBuffer.test.ts`, `backup.test.ts`, `backupStreaming.test.ts`, `dailyReadStreak.test.ts`, `dbUpgrades.test.ts`, `drillWalkthrough.test.ts`, `folderAssign.test.ts`, `folderHandles.test.ts`, `folderLibrary.test.ts`, `folderListing.test.ts`, `folderManifestFirst.test.ts`, `folderReopen.test.ts`, `folderScreenAtScale.test.ts`, `folderStorage.test.ts`, `folderWalkWorker.test.ts`, `golden.ts`, `idb.ts`, `importOverlay.test.ts`, `importStore.test.ts`, `importSummaries.test.ts`, `lessonPaperBookPicker.test.ts`, `levelOverrides.test.ts`, `micCalibrationStore.test.ts`, `midiImport.test.ts`, `pdfScreenDetection.test.ts`, `persist.test.ts`, `planTracksGrouped.test.ts`, `progressAtScale.test.ts`, `recordTruth.test.ts`, `reorder.test.ts`, `scoreTypes.test.ts`, `sessionRetention.test.ts`, `settingsRoundTrip.test.ts`, `setupProgress.test.ts`, `shelf.test.ts`, `stats.test.ts`, `storagePersistence.test.ts`, `systemPlan.test.ts`, `tips.test.ts`, `todaySessionLength.test.ts`, `wavEncode.test.ts`, `test_convert_cache.py`, `test_import_musetrainer.py`, `test_note_loss.py`, `test_pdmx.py`, `test_technique_units.py`.

Single tests: `finder.spec.ts` › an import with no rung still works and belongs to none; `today.spec.ts` › remembers the session length across a reload; `today.spec.ts` › the tracks the data switches on are on before he touches a chip (C2); `legacyStorage.test.ts` › adopts a folder listing stored in the old inline shape; `legacyStorage.test.ts` › carries no step count on any stored row, which is why the engine fix is safe; `legacyStorage.test.ts` › fills an import’s size from the file rather than reporting nought; `legacyStorage.test.ts` › keeps every stored pass a pass, with the numbers it was passed on; `legacyStorage.test.ts` › reads the stored weekly goal rather than the default; `legacyStorage.test.ts` › restores the settings it can only find in the database; `prerequisites.test.ts` › indexes every lesson in the curriculum; `progressStore.test.ts` › accumulates practice minutes; `progressStore.test.ts` › counts the last seven days, not the calendar week; `progressStore.test.ts` › does not let a worse run lower the best numbers; `progressStore.test.ts` › leaves the day alone for a run with no seed or another seed; `progressStore.test.ts` › ticks the day when the run carries the day's seed.

**SCREEN, `04` §0 screen contracts, no ids on screen, nothing dead** (111 files, 21 single tests inside other files)

Files: `app-shell.spec.ts`, `carry-overs.spec.ts`, `chart.spec.ts`, `doors.spec.ts`, `drills-review.spec.ts`, `drills.spec.ts`, `empty-states.spec.ts`, `feedback-placement.spec.ts`, `folder.add.spec.ts`, `folder.manifest.spec.ts`, `folder.readable.spec.ts`, `folder.spec.ts`, `guide.spec.ts`, `help-strip.spec.ts`, `keyboard-strip.spec.ts`, `lab-both-ways.spec.ts`, `lab.spec.ts`, `lesson-tools.spec.ts`, `library.spec.ts`, `metronome.spec.ts`, `midi.spec.ts`, `modes-chart-from-a-lesson.spec.ts`, `modes-chart-from-the-score.spec.ts`, `modes-dictation.spec.ts`, `modes-duet.spec.ts`, `modes-engraving.spec.ts`, `modes-free-play.spec.ts`, `modes-hold-the-chords.spec.ts`, `modes-lab-unlock.spec.ts`, `modes-ladder.spec.ts`, `modes-play-the-tune.spec.ts`, `modes-simon.spec.ts`, `modes-technique-measure.spec.ts`, `modes-trading-fours.spec.ts`, `pdf-paper.spec.ts`, `pdf.spec.ts`, `plan.hierarchy.spec.ts`, `plan.spec.ts`, `progress.hierarchy.spec.ts`, `progress.spec.ts`, `score.blind.spec.ts`, `score.countin.spec.ts`, `score.pickup-numbers.spec.ts`, `score.readahead.spec.ts`, `score.screen.spec.ts`, `score.spec.ts`, `score.stepper-limits.spec.ts`, `score.strip-span.spec.ts`, `settings-rules.spec.ts`, `setup-layout.spec.ts`, `shelf.spec.ts`, `side-panel-prose.spec.ts`, `start-and-return.spec.ts`, `sweeps.spec.ts`, `tour-practice-modes.spec.ts`, `wide.spec.ts`, `states/audit.ts`, `alphaRail.test.ts`, `chartDoor.test.ts`, `chordChart.test.ts`, `devicePreview.test.ts`, `dictationCard.test.ts`, `drillNotation.test.ts`, `drillPrompts.test.ts`, `el.test.ts`, `errorBoundary.test.ts`, `everyOptionOpens.test.ts`, `fitDetail.test.ts`, `folderAssign.test.ts`, `folderListing.test.ts`, `folderReopen.test.ts`, `folderScreenAtScale.test.ts`, `labHelp.test.ts`, `labToolFields.test.ts`, `ladderTool.test.ts`, `lessonSongEmpty.test.ts`, `lessonVideos.test.ts`, `libraryRowRanking.test.ts`, `markdown.test.ts`, `metronomeScreenStop.test.ts`, `micScreenRefusal.test.ts`, `midiScreenDevices.test.ts`, `paperScreenTwin.test.ts`, `pdfScreenDetection.test.ts`, `planHierarchy.test.ts`, `planStageChevron.test.ts`, `planTracksGrouped.test.ts`, `planTracksSheet.test.ts`, `plural.test.ts`, `progressRanking.test.ts`, `progressScreenRepertoireAndGoal.test.ts`, `scoreMidRunSettings.test.ts`, `scoreSheetRows.test.ts`, `scoreSummaryTruth.test.ts`, `scoreTourRoute.test.ts`, `settingsDownload.test.ts`, `sheetIsolation.test.ts`, `shelfRanking.test.ts`, `shelfScreenRedraw.test.ts`, `shelfTwinSearch.test.ts`, `simonTurnCue.test.ts`, `spaFallback.test.ts`, `staffCard.test.ts`, `statusLine.test.ts`, `stripRange.test.ts`, `tablet.test.ts`, `toastStack.test.ts`, `todayCardRanking.test.ts`, `test_finder.py`, `test_validate.py`, `test_validate_tools.py`.

Single tests: `folder.rail-cost.spec.ts` › a letter the search has emptied is dimmed and dead; `landscape.spec.ts` › a sub-screen card uses the width sideways; `landscape.spec.ts` › a sub-screen puts Back and its title on one line; `modes-rhythm-only.spec.ts` › the row is gone in a mode with no clock, which is where it would be dead; `modes-rhythm-only.spec.ts` › the sheet says what every choice does before one tap opens the piece; `score.head-height.spec.ts` › the hands control is reachable during a run when the bar has sent it to the shee; `score.layout.spec.ts` › the notation still has most of the height with the strip showing; `score.window-rule.spec.ts` › mid-run on a phone sideways, the folded chrome leaves the music on the stage; `tips.spec.ts` › is collapsed during a set, on the first meeting and after; `today.spec.ts` › a row is one line of detail and no taller than 96 px (R2); `today.spec.ts` › one filled button on the screen, and it is Start session (R3); `today.spec.ts` › the tracks the data switches on are on before he touches a chip (C2); `curriculumSelectors.test.ts` › gives an un-imported song something to point at; `lessonShape.test.ts` › does not cite the repository at a learner; `lessonShape.test.ts` › does not name a field, a flag or a file at a learner; `lessonShape.test.ts` › points at other modules by their name, not by their slug; `session.test.ts` › drops a row it cannot fill rather than showing an empty one; `session.test.ts` › never offers a row you would have to import first; `session.test.ts` › points an un-imported item at the vehicle its alternatives name; `session.test.ts` › says nothing about an item you can already play; `slots.test.ts` › a cold draw at the end fills the screen from behind, not from black.

**TRUTH, nothing displayed or recorded that was not measured** (57 files, 8 single tests inside other files)

Files: `drills.spec.ts`, `engine.spec.ts`, `lab.spec.ts`, `mic.spec.ts`, `midi-import.spec.ts`, `modes-hold-the-chords.spec.ts`, `modes-play-the-tune.spec.ts`, `modes-technique-measure.spec.ts`, `modes-trading-fours.spec.ts`, `offline.report.spec.ts`, `plan.spec.ts`, `score.rhythm-ladder.spec.ts`, `score.run.spec.ts`, `score.screen.spec.ts`, `shelf.spec.ts`, `sweeps.spec.ts`, `trading-fours.spec.ts`, `accents.test.ts`, `articulationVoicingShaping.test.ts`, `coaching.test.ts`, `dictationCard.test.ts`, `drillAfterAMiss.test.ts`, `drillStaffPolicy.test.ts`, `drills.test.ts`, `dynamicsDrillCard.test.ts`, `engineEarlyNote.test.ts`, `engineMic.test.ts`, `engineRhythmOnly.test.ts`, `engineScoring.test.ts`, `engineTempo.test.ts`, `engineWait.test.ts`, `folderListing.test.ts`, `halfPedalDepth.test.ts`, `help.test.ts`, `importOverlay.test.ts`, `inputPolicy.test.ts`, `labVerdictOnStop.test.ts`, `levelSource.test.ts`, `loopbackLatency.test.ts`, `midiHands.test.ts`, `midiWriter.test.ts`, `offlineStatus.test.ts`, `progressAtScale.test.ts`, `recordTruth.test.ts`, `scoreSummaryTruth.test.ts`, `serviceWorkerUpdates.test.ts`, `shelf.test.ts`, `shelfRanking.test.ts`, `sightReadingPromises.test.ts`, `simonTurnCue.test.ts`, `statusLine.test.ts`, `steadiness.test.ts`, `storagePersistence.test.ts`, `techniqueMeasures.test.ts`, `todayInputChip.test.ts`, `tradingFours.test.ts`, `test_render_check.py`.

Single tests: `score.states.spec.ts` › T40: a performance with Hear it inside it is kept as practice; `legacyStorage.test.ts` › carries no step count on any stored row, which is why the engine fix is safe; `legacyStorage.test.ts` › keeps every stored pass a pass, with the numbers it was passed on; `lessonClaimsAboutApp.test.ts` › 0.3: both modes score the notes, and only a Keep tempo run measures tempo and ca; `progressStore.test.ts` › leaves the day alone for a run with no seed or another seed; `progressStore.test.ts` › needs two passes on different days to master (docs/02 Part G); `progressStore.test.ts` › passes an item without a run and says it was self-assessed; `progressStore.test.ts` › ticks the day when the run carries the day's seed.

**TEACH, never teach wrong: claims hold** (17 files, 9 single tests inside other files)

Files: `drills-review.spec.ts`, `lesson-tools.spec.ts`, `modes-dictation.spec.ts`, `chartDoor.test.ts`, `drillParamsRead.test.ts`, `harmony.test.ts`, `heldChord.test.ts`, `help.test.ts`, `lessonClaims.test.ts`, `lessonClaimsAboutMusic.test.ts`, `markdown.test.ts`, `sightReadingPromises.test.ts`, `swingJudging.test.ts`, `test_generator.py`, `test_generator_invariants.py`, `test_harmony_families.py`, `test_tips.py`.

Single tests: `lessonClaimsAboutApp.test.ts` › 0.3: both modes score the notes, and only a Keep tempo run measures tempo and ca; `lessonClaimsAboutApp.test.ts` › every rung: a lab tool that opens on Hold the chords names a preset with a left-; `lessonClaimsAboutApp.test.ts` › every rung: a lab tool that opens on Play the tune names a preset that has a rig; `lessonClaimsAboutApp.test.ts` › every rung: a rung that carries tools has a Tools for this rung paragraph that n; `lessonClaimsAboutApp.test.ts` › every rung: no lesson names a button its own rung does not draw; `lessonClaimsAboutApp.test.ts` › gives a rung with two lab buttons two different things to open; `lessonClaimsAboutApp.test.ts` › names only presets the lab has, and the free lab has no preset; `lessonClaimsAboutApp.test.ts` › never frees a picker the rung own preset does not lock; `lessonShape.test.ts` › matches the rung, wherever a lesson states the number.

**GATE, build gates: licensing, validators, docs against code, catalog integrity** (50 files, 3 single tests inside other files)

Files: `audio.spec.ts`, `bisect-render.spec.ts`, `content-render.spec.ts`, `guide.spec.ts`, `midi.spec.ts`, `offline.spec.ts`, `sweeps.spec.ts`, `curriculumIntegrity.test.ts`, `docsConsistency.test.ts`, `drillFromCatalog.test.ts`, `everyOptionOpens.test.ts`, `help.test.ts`, `scoreCatalog.ts`, `importStore.test.ts`, `labHelp.test.ts`, `labPresets.test.ts`, `lessonClaims.test.ts`, `lessonVideos.test.ts`, `midiImport.test.ts`, `midiParse.test.ts`, `noGenreSelection.test.ts`, `perfectDrills.test.ts`, `perfectPerformance.1.test.ts`, `perfectPerformance.2.test.ts`, `perfectPerformance.3.test.ts`, `perfectPerformance.4.test.ts`, `perfectPerformance.5.test.ts`, `perfectPerformance.6.test.ts`, `perfectPerformance.7.test.ts`, `perfectPerformance.test.ts`, `planNoUnobtainableRungs.test.ts`, `test_author.py`, `test_export_durations.py`, `test_finder.py`, `test_generator_invariants.py`, `test_hanon.py`, `test_import_kern.py`, `test_import_musetrainer.py`, `test_licensing.py`, `test_note_loss.py`, `test_pdmx.py`, `test_render_check.py`, `test_score_checks.py`, `test_tips.py`, `test_truncation_scan.py`, `test_validate.py`, `test_validate_p11.py`, `test_validate_sections.py`, `test_validate_tools.py`, `test_validate_videos.py`.

Single tests: `lessonClaimsAboutApp.test.ts` › gives a rung with two lab buttons two different things to open; `lessonClaimsAboutApp.test.ts` › names only presets the lab has, and the free lab has no preset; `lessonClaimsAboutApp.test.ts` › never frees a picker the rung own preset does not lock.

**INPUT, device and input robustness** (45 files, 0 single tests inside other files)

Files: `audio.spec.ts`, `converted-import.spec.ts`, `doors.spec.ts`, `drills.spec.ts`, `empty-states.spec.ts`, `generate-audio-fixtures.spec.ts`, `library.spec.ts`, `mic.spec.ts`, `midi-import.spec.ts`, `midi.spec.ts`, `midi.unplug.spec.ts`, `modes-dictation.spec.ts`, `modes-free-play.spec.ts`, `modes-simon.spec.ts`, `mounted-once.spec.ts`, `score.latch.spec.ts`, `AudioEngine.test.ts`, `WebMidiSource.test.ts`, `articulationVoicingShaping.test.ts`, `diagnosticsMicRelease.test.ts`, `engineMic.test.ts`, `folderHandles.test.ts`, `halfPedalDepth.test.ts`, `fakeMidiAccess.ts`, `runDetector.ts`, `signals.ts`, `wav.ts`, `inputPolicy.test.ts`, `inputSources.test.ts`, `latency.test.ts`, `lazyScreenOrphan.test.ts`, `loopbackLatency.test.ts`, `micCalibration.test.ts`, `micLatencyOnce.test.ts`, `micScreenRefusal.test.ts`, `micSourceConnect.test.ts`, `midiConnectInFlight.test.ts`, `midiScreenDevices.test.ts`, `parseMidiMessage.test.ts`, `pitchDetector.test.ts`, `pitchDsp.test.ts`, `techniqueMeasures.test.ts`, `todayInputChip.test.ts`, `wavEncode.test.ts`, `midiMock.ts`.

**PWA, offline, service worker, updates, the shell** (20 files, 0 single tests inside other files)

Files: `app-shell.spec.ts`, `audio.spec.ts`, `feedback-placement.spec.ts`, `offline.report.spec.ts`, `offline.spec.ts`, `progress.spec.ts`, `update.tab-nav.spec.ts`, `Piano.test.ts`, `boot.test.ts`, `contentFetchTimeout.test.ts`, `folderWalkWorker.test.ts`, `labRoute.test.ts`, `offlineStatus.test.ts`, `router.test.ts`, `serviceWorkerUpdates.test.ts`, `settingsDownload.test.ts`, `spaFallback.test.ts`, `storagePersistence.test.ts`, `tips.test.ts`, `test_serve_lan.py`.

**BOUND, boundedness and cost as relationships** (27 files, 2 single tests inside other files)

Files: `folder.spec.ts`, `keyboard-strip.spec.ts`, `mic.spec.ts`, `offline.spec.ts`, `score.spec.ts`, `RingBuffer.test.ts`, `WebMidiSource.test.ts`, `backingLoop.test.ts`, `backupStreaming.test.ts`, `drillNotation.test.ts`, `errorLogOverflow.test.ts`, `folderManifestFirst.test.ts`, `folderReopen.test.ts`, `folderStorage.test.ts`, `folderWalkWorker.test.ts`, `importSummaries.test.ts`, `logsAreBounded.test.ts`, `offlineStatus.test.ts`, `pdfDetectionOrder.test.ts`, `pdfPageCache.test.ts`, `pdfScreenDetection.test.ts`, `progressAtScale.test.ts`, `progressScreenRepertoireAndGoal.test.ts`, `sessionRetention.test.ts`, `shelfScreenRedraw.test.ts`, `shelfTwinSearch.test.ts`, `trimMusicXml.test.ts`.

Single tests: `perf.spec.ts` › a cold 2-bar window renders inside the first-render budget; `perf.spec.ts` › the Library answers every genre filter, and the search box, inside the first-pai.

---

## 5. The proxy list (Q2): tests that pass or fail on something other than the learner-facing result

**300 rows** (files and single tests) read a proxy somewhere; each is listed once, under its
first-named kind, with its class and the outcome to read instead (the CSV holds the full text
where the table shortens it). "(rows)" in the last column means the file's single-test rows
carry the detail. Matrix Q2 had three diagnosed (the window's `data-stretch`, the staff measured
as the staffline box, the summary's strings read from code); all three are now in this list or
closed by B, and the rest are audited here.

The ones that most need changing before a wave leans on the suite, in order:

1. **The window's natural widths and exemptions come from the renderer** (`score.window-rule`,
   `wide`'s sparse-bar test still on `data-stretch='natural'`, `score.rotate` and
   `score.arrange-race` on `data-read-ahead`/`data-slots`/`data-fit`), and **the state gallery
   checks no spacing and no five-line floor** (`states/gallery.ts`, `probe.ts`), so a stretched
   bar passes every cell. Read natural spacing from an independent engraving and the arrangement
   from the drawn systems, as `tour/t30.ts`'s `measure()` already does on the glass.
2. **The answer key is the app's own** (`drills-harmony`, the "keys answer" tests in
   `modes-dictation` and `modes-simon` via `data-expects`; `first-day` playing what the debug
   hook says it expects; `playInTime` striking the run's own expected notes). Derive the
   expected notes from the rendered prompt or a table written in the test, as the blues test in
   `drills-review` does, and assert that a wrong answer counts wrong.
3. **Sentences from code** (§3's 288). Where a sentence is a promise to the learner (the truth
   rule's "not measured", the hands sentence, the durability sentence, the composition line),
   read it off the rendered screen; the jsdom tests (`scoreSummaryTruth`, `dictationCard`,
   `lessonSongEmpty`) show it costs little.
4. **Vacuous or self-fulfilling checks** that cannot fail: `modes-placement`'s R3 count of a
   class the app does not use (`btn--primary`), `finder`'s id regex that can never match,
   `carry-overs`' "some chip has order 0", the prerequisite and `?page=` tests that assert the
   URL they navigated to, `audio.spec` accepting running or suspended, `diagnosticsMicRelease`
   asserting the starting zeros after a fixed flush, `modes-rhythm-only`'s run that ends on the
   clock whatever was played, and the "leaving stops it" tests that read the new screen rather
   than the scheduler (`metronome`, `lab`, `trading-fours`).
5. **Waits that stand in for a state** (§3): `data-measured` padded with 500 ms; the letter-rail
   tests in `folder.rail-cost`, `folder.spec` and `library` read the row count after 300–400 ms,
   when the count is already one page before the jump lands, so the 4,860-row fault they were
   written for would pass.

#### intent-flag (63)

| test | class | also | reads instead |
|---|---|---|---|
| `audio.spec.ts` | preserve | machine-literal | the app's own AudioContext state and a spy on scheduled sources (three notes C4 E4 G4) |
| `audio.spec.ts` › pressing "Test sound" starts the AudioContext and plays a C major chord | revise | structural | read the app's own AudioContext state and the scheduled buffer sources (pitches C4 E4 G4) |
| `carry-overs.spec.ts` › shows the side panel and opens at two bars | revise | — | count drawn bars per slot in the rendered notation at 1024x1000 |
| `chart.spec.ts` | preserve | — | tablet: two row boxes side by side at the same y; swing: scheduled comp/click onsets |
| `chart.spec.ts` › offers swing and comp toggles | revise | — | scheduled comp events present when on, long-short eighth ratio when swing is on |
| `dark-ink.spec.ts` | revise | — | contrast of drawn note heads/stave lines against the card in a screenshot of the front buffer (or the computed colour after filter), in both drill and score |
| `doors.spec.ts` | preserve | — | (rows) the judged result of a wrong-pitch key in time; the stage covered; left-hand notes scheduled |
| `doors.spec.ts` › Blind hides the score and leaves the rest of the run alone | revise | — | the engraving is not visible (stage computed visibility hidden / no notehead ink visible) while the mode select stays enabled |
| `doors.spec.ts` › Duet opens with a hand chosen and the app on the other one | revise | — | playback schedules the left staff's notes and none of the right's during a run |
| `doors.spec.ts` › Rhythm only opens a rhythm run, in the one mode that has a clock | revise | — | a wrong-pitch key played in time counts as a hit (or the run's score carries rhythmOnly) |
| `doors.spec.ts` › and any other choice afterwards is not a rhythm run | revise | — | a wrong-pitch key in time is judged wrong in the later Keep tempo run |
| `drills-harmony.spec.ts` | revise | race | derive the answer from the rendered prompt (e.g. 'D dorian' → D E F G A B C; the drawn transposition moved to the asked key) and play it; assert a wrong answer counts wrong; wait on a chord-boundary state |
| `drills-review.spec.ts` | preserve | code-string | (rows) noteheads counted in the staff SVG; expected names from a table written in the test |
| `drills-review.spec.ts` › plays a missed chain back lit, then asks for the same chain again | revise | code-string | noteheads counted in the staff SVG; names from a test-owned table |
| `drills-review.spec.ts` › shows the chain on the keys, one at a time, with its name on the card | revise | code-string | noteheads counted in #drill-simon-staff's SVG per sample; expected names from a hand-written spelled table as the blues test does |
| `drills.spec.ts` | preserve | race, machine-literal, structural | (rows) |
| `drills.spec.ts` › a note-flash card draws the note on a staff and takes the key | revise | — | the notehead's vertical position against the drawn staff lines maps to the pitch that answers |
| `drills.spec.ts` › every item it can end on names a unit that exists | revise | — | Start here lands on a rung Plan then names (as first-day.spec does) |
| `first-day.spec.ts` | revise | structural | compare the rung title Today and Plan render as text; in C, the evidence the Keep-tempo observation yields as Progress/Plan show it |
| `guide-shots.spec.ts` | revise | race | wait on each screen's settled state (engraving present, run step advanced, summary visible) before each shutter; play notes read from the lit strip |
| `lab.spec.ts` | preserve | race, machine-literal | (rows) the written score's measures/key/figure; the daily tick from a played read |
| `lab.spec.ts` › Read it lands on the Score screen with the bars that were chosen | revise | machine-literal | the stored/loaded score has 8 measures, a one-sharp key signature and an Alberti left hand (model summary or drawn measures) |
| `lab.spec.ts` › ticks and starts counting once the day is read | revise | — | play today's phrase in time (playInTime) and read the card's tick and streak |
| `modes-chart-from-a-lesson.spec.ts` | preserve | structural | the cell's computed colour/class for the verdict; play the bar's chord → yes and a foreign chord → no |
| `modes-dictation.spec.ts` | preserve | — | the scheduled playback equals the expected pitches, and a wrong phrase counts wrong |
| `modes-duet.spec.ts` | preserve | — | (rows) left-hand notes scheduled by playback during a run |
| `modes-duet.spec.ts` › the button opens one of the rung’s own pieces, with a hand chosen | revise | — | during a run the playback scheduler plays the left staff's notes and none of the right's |
| `modes-duet.spec.ts` › the button still means it after the Duet row has been switched off once | revise | — | left-hand notes scheduled after re-entering by the rung's button |
| `modes-lab-unlock.spec.ts` | preserve | — | (row) |
| `modes-lab-unlock.spec.ts` › the freed picker reaches the loop, not just the label | revise | — | the cells' drawn chord symbols change and the scheduled chord events follow the new progression |
| `modes-placement.spec.ts` | replace | structural | the rung Plan and Today name (their titles) equals the placement's named unit, via the evidence the placement yields |
| `modes-rhythm-only.spec.ts` | revise | race, structural | the summary's hit count or accuracy is non-zero after wrong-pitch taps in time (and zero after mistimed taps) |
| `modes-simon.spec.ts` | preserve | — | chain growth read from the drawn/sounded chain (card names on the lit rung or scheduled notes) rather than data-expects |
| `placement-branches.spec.ts` | replace | — | in C, the observation each branch yields and the starting rung/skill state the learner then meets on Today/Plan (rendered) |
| `plan.hierarchy.spec.ts` | preserve | machine-literal | R3: compare computed background of every control against a known quiet control (as shelf.spec does) rather than a class |
| `plan.spec.ts` › lists every concept with a state and a way to drill it | replace | — | the rendered state wording on the row, derived from evidence in C |
| `progress.hierarchy.spec.ts` | preserve | machine-literal | R3: computed background of controls vs a quiet control; line counts on real rows once a fixture produces them |
| `score.arrange-race.spec.ts` | revise | — | count the systems with ink on the stage and their drawn five-line staff height in the eager and the patient run and compare those |
| `score.layout.spec.ts` | revise | internal-count, race | per setting, count distinct bars with visible inked notes in the window rows (not look-ahead) and compare with asked and with the row's words; wait on a settled transform, not 300-500 ms |
| `score.renderer.fuzz.spec.ts` | revise | internal-count, race | wait for the renderer's settle as a published state; judge arrangement and size from the drawn systems' five-line staff heights |
| `score.rotate.spec.ts` | revise | internal-count, race | after each turn, the drawn five-line staff and the window rows' ink against the new stage (fills width or height, inside it, over the code's floor imported, not mirrored), and a note head's x across steps for 'slides', instead of data-read-ahead/data-fit |
| `score.screen.spec.ts` › bars per window steps between 1 and 8 and redraws | revise | — | after each press, the window's inked bars on the glass change or the ⋯ row says why (as score.spec's revised count test) |
| `score.slide.spec.ts` | revise | internal-count | count bars with visible inked notes right of the window's last bar inside the stage; track a note head's x across steps for slides / does not slide |
| `score.slots.spec.ts` | revise | internal-count | note-head positions of the cursor bar unchanged across its steps; the next bar's visible note heads inside the stage; equal five-line staff heights across slots |
| `score.spec.ts` › bars per window changes what the window holds, or says why not | revise | — | read the ⋯ row's words for the reason (as score.layout does) |
| `score.window-rule.spec.ts` | revise | internal-count, race | drop data-stretch and data-fit from the verdict; take natural width from an independent measure (the probe engraving on the glass, or a natural-spacing engraving at the same zoom) and fail when a sheet has no measured bars; derive 'bound by height or … |
| `setup.spec.ts` › every step is reachable, sets what it says, and Finish is remembered | revise | — | measure the miniature's drawn systems (one sliding system vs stacked slots) from svg geometry |
| `today.spec.ts` › Today keeps recommending after the core path, from a track he never turned on | replace | internal-count | after evidence meets the core rungs' requirements, Today renders a next rung (title) outside core |
| `today.spec.ts` › one filled button on the screen, and it is Start session (R3) | preserve | — | compare computed backgrounds of Today's controls against a quiet control |
| `wide.spec.ts` | preserve | internal-count, race | (score scenes) gutters and cap measured on the engraving's ink; (Q17) wait on the SW claim and the lazy chunk's placeholder state, failing with which one stalled |
| `wide.spec.ts` › a laptop draws the bar at its natural width; a phone fills the width | revise | race | each bar's drawn stave width divided by the sheet scale against an independent natural width (window-rule (a)); on the phone, window-rule (b) as big as allowed |
| `states/gallery.ts` | revise | internal-count | count the systems stacked with ink on the stage for the arrangement; take music share and width from the ink extent as app/tests/tour/t30.ts measure does; judge the theme by the notation's ink colour against the stage; measure each bar's note spacing on … |
| `states/probe.ts` | revise | internal-count | count systems and bars by ink inside the stage with checkVisibility, and read the five-line staff and ink height, as t30.ts measure does; check a key's colour only on keys inside the strip's visible box. |
| `states/score.states.spec.ts` | revise | race, structural | wait for the fit to settle (t30.ts settle, or .score-view[data-measured]) before shooting; assert each caption on the glass: the cursor band's height share in scroll, the other hand's note opacity, no inked notation in Blind, no restart control in a … |
| `tour/choices.spec.ts` | delete | — | bars inked inside the stage (t30.ts measure), if a bar-count picture is ever wanted again. |
| `tour/corpus.spec.ts` | revise | internal-count, machine-literal | next bar = its first note's box inside the stage (sequence.spec.ts nextBarVisible); stave y and size from the five drawn lines (t30.ts stavePx); scroll width from ink; read-ahead as drawn before the step that needs it, without a ms literal. |
| `tour/sequence.spec.ts` | revise | internal-count, race, machine-literal | stave y and size from the five drawn lines on the glass (t30.ts stavePx and line ys); start the run on the fit hook's measured state rather than after 2.5 s. |
| `tour/t34-sheet.spec.ts` | revise | — | shown bars = bars inked inside the stage; stretch = note spacing on the glass against the engraver's natural spacing; look-ahead = the next row's ink against the stage edge. |
| `dictationCard.test.ts` | preserve | — | for the flag tests: the rendered card text, as the screen tests already read |
| `lessonClaimsAboutApp.test.ts` | revise | code-string | for source rows: the rendered screen (jsdom or e2e) showing the sentence or doing the behaviour; for all rows: claims keyed to F's structured lesson schema |
| `test_generator_invariants.py` › test_a_direction_is_printed_above_the_staff | revise | — | On the rendered page, no direction's text box intersects a barline, the brace or a staff. |
| `test_generator_invariants.py` › test_the_exported_musicxml_carries_the_placement | revise | — | On the rendered page, no direction's text box intersects a barline, the brace or a staff. |
| `devScore.ts` | revise | race | publish and wait on a 'fit settled' state after the measurement's re-plan has drawn (or poll the drawn transform and staff until stable, as score.spec's revised count test does) |

#### internal-count (63)

| test | class | also | reads instead |
|---|---|---|---|
| `bisect-render.spec.ts` | preserve | — | the same verdict content-render uses (and drawn noteheads per slice if the check moves to ink) so verdicts transfer |
| `carry-overs.spec.ts` › moves a chip to the front and stores the new order | revise | — | the classical chip is drawn first in the sheet after the tap (order read off the rendered list) |
| `carry-overs.spec.ts` › stops when the screen is left | revise | race | after navigating away, no notes are scheduled/sounded on the audio clock (event log empty) |
| `content-render.spec.ts` | preserve | machine-literal, structural | noteheads drawn in the preview window, plus cursor steps equal model steps (already reported for render_check.py) |
| `feedback-placement.spec.ts` › are engraved once per card and survive the answer | revise | — | a MutationObserver on #drill-notation sees no svg replacement between answer and next card, and the drawn bars' bbox stays non-empty |
| `keyboard-strip.spec.ts` | preserve | structural | (test 2) a MutationObserver over the live MIDI path: zero childList mutations and the same key nodes before and after |
| `lesson-flow.spec.ts` | replace | — | after the Keep-tempo run, the evidence the rung names shows on Progress/Plan; review surfaced from skill state, read off the rendered screen |
| `mounted-once.spec.ts` | preserve | — | one played input yields one response and at most one recorded run after each door (the consequence Entry 52 names) |
| `offline.report.spec.ts` › "Last update check" is never until a check has reached the server | revise | race | the Diagnostics line after the offline boot still shows the planted/never value, with the absence shown by no update request in the network log |
| `offline.spec.ts` › the whole app works with the network off after one online launch | revise | race, machine-literal | open the authored score and generated exercise on the Score screen offline and see drawn notation (svg note heads) |
| `perf.spec.ts` | revise | race, machine-literal | keep the spec-owned relations; replace the 60 s and 8 ms with relations (first window of the longest score vs a short piece's; frame cost vs the idle frame) and wait on the timing log's sample count instead of 500 ms |
| `progress.spec.ts` › records a run and shows it in the history and the heat-map | revise | — | an observation recorded through a run shows in history and shades today's cell; totals derived from evidence |
| `score.density.spec.ts` | revise | race | wait on data-measured plus a settled transform; take natural spacing from an independent engraving at the same zoom (the probe's SVG measured on the glass), not the renderer's table |
| `score.fuzz.spec.ts` | revise | race, machine-literal | after each action wait for a published settled state; read the size as the drawn five-line staff and the next bar as visible note heads inside the stage |
| `score.head-height.spec.ts` | revise | race | measure the drawn five-line staff and a note head's position before and after the stage change |
| `score.rhythm-ladder.spec.ts` | preserve | — | (the pass check) what the learner later sees: no pass evidence or observation recorded, rung and Progress unchanged |
| `score.screen.spec.ts` › the zoom buttons still do something, now that the fit does the work | revise | race, machine-literal | the five-line staff height (as 'Size steps are monotone' reads it) after a settled transform |
| `score.spec.ts` › window layout draws only the window | revise | — | visible inked notes' bars in the window rows against the asked window (as the revised count test) |
| `today.spec.ts` | revise | machine-literal | the session's rows as rendered against the practice intent X defines (what each row is and why), not counts per template |
| `tour/seed.ts` | revise | — | seed observations in C's schema, or play the runs through the MIDI mock so each record is what a run measured. |
| `autoFit.test.ts` | revise | — | the drawn five-line staff height and its share of the stage, measured on the rendered sheet at each device cell before and after a refit |
| `curriculumSelectors.test.ts` | replace | — | rung state derived from the evidence the rung names (Plan shows a rung complete only when its evidence exists) |
| `difficulty.test.ts` | revise | — | one level derivation checked against judged anchor pieces, and an import landing on the rung the corpus gives the same piece |
| `drillNotation.test.ts` | preserve | — | the printed bars' SVG nodes kept and visible across the answer in a real browser; the status line's rendered box between prompt and buttons |
| `drillWalkthrough.test.ts` › finishes, records the run, and starts from the top the next time | revise | — | an observation (tour completed) yielding the evidence rung 0.3 names |
| `engineMic.test.ts` › widens the tempo tolerance to ±200 ms | revise | — | a strike about 180 ms off its step is a hit under MIC_ENGINE_OPTIONS and a miss without them |
| `perfectSweep.ts` | revise | — | the evidence the rung names, derived from the perfect run's observations (new model), instead of the item's passed flag |
| `importOverlay.test.ts` › lets an imported piece complete the rung | replace | — | an observation on the import yields the evidence its rung names |
| `lessonClaimsAboutApp.test.ts` › 0.4: a placement start holds the rungs behind it back and gives them back when n | replace | — | placement observations yield skill state and the curriculum decision Today and Plan show |
| `lessonClaimsAboutApp.test.ts` › 0.4: your plan begins at the placed unit from then on | replace | — | placement observations yield skill state and the curriculum decision Today and Plan show |
| `lessonClaimsAboutApp.test.ts` › 1.1: this rung's own pass is the 90 % and 80 % the lesson quotes | replace | — | the rung requirement applied to evidence (a run below it yields no evidence for the rung) |
| `lessonClaimsAboutApp.test.ts` › 1.3: this rung's own pass is the 90 % and 80 % the lesson quotes | replace | — | the rung requirement applied to evidence (a run below it yields no evidence for the rung) |
| `lessonClaimsAboutApp.test.ts` › 1.4: this rung asks for 85 % of tempo, which is what its lesson now quotes | replace | — | the rung requirement applied to evidence (a run below it yields no evidence for the rung) |
| `lessonClaimsAboutApp.test.ts` › 1.4: this rung asks for a tempo of its own, and the scorer uses it | replace | — | the rung requirement applied to evidence (a run below it yields no evidence for the rung) |
| `lessonClaimsAboutApp.test.ts` › 2.1: this rung's own pass is the 90 % and 80 % the lesson quotes | replace | — | the rung requirement applied to evidence (a run below it yields no evidence for the rung) |
| `lessonClaimsAboutApp.test.ts` › 2.5: a rung that asks for 95 % is judged at 95 %, not at 90 % | replace | — | the rung requirement applied to evidence (a run below it yields no evidence for the rung) |
| `lessonClaimsAboutApp.test.ts` › 3.4: the daily read is the right-hand level-2 phrase at Stage 3 and the two-hand | replace | — | the sight-reading constraints chosen from skill state (C reader) and what the phrase contains |
| `lessonClaimsAboutApp.test.ts` › 4.4: this rung asks for more accuracy than the app-wide pass | replace | — | the rung requirement applied to evidence (a run below it yields no evidence for the rung) |
| `lessonClaimsAboutApp.test.ts` › 4.7: the rung's blind rule is a string nothing measures, and completion is one p | replace | code-string | the rung requirement stated as evidence the app measures, or labelled unmeasured |
| `lessonClaimsAboutMusic.test.ts` › classical.4: none of its five songs carries an ABRSM grade, while the Library ho | revise | — | none: the row goes with abrsmGradeApprox in Wave E |
| `lessonClaimsAboutMusic.test.ts` › holiday.3: God Rest Ye prints E minor and B seven under a one-sharp signature an | revise | — | the measured demands that make it the easiest option |
| `lessonClaimsAboutMusic.test.ts` › rock.overview: the easy Canon in D is the highest-levelled of the rung's four an | revise | — | the measured demands that make it the hardest option |
| `lessonCompletePerf.test.ts` | replace | — | the rung-state derivation walks observations a bounded number of times per Plan draw |
| `placementStartsThePlan.test.ts` | replace | — | placement observations yield skill state; Today's curriculum decision shown from it; skipped rungs carry no evidence |
| `prerequisites.test.ts` › ignores prerequisites when gating is off | replace | — | the curriculum decision derived from skill state, shown on Today |
| `prerequisites.test.ts` › recommends a locked rung rather than nothing when everything left is locked | replace | — | the curriculum decision derived from skill state, shown on Today |
| `prerequisites.test.ts` › skips a locked rung for the first one he can start | replace | — | the curriculum decision derived from skill state, shown on Today |
| `progressStore.test.ts` | replace | — | observations stored per run; evidence and skill state derived; review decided from skill state |
| `readAheadScale.test.ts` | revise | — | the next bar's first note measured on the rendered glass while the widest bar is played, per device cell |
| `rungMastery.test.ts` | replace | — | a rung requirement applied to evidence from the observation of the run the rung opened |
| `session.test.ts` | replace | — | the curriculum decision from skill state with honest reason lines, shown on Today |
| `sightReadingSlot.test.ts` | replace | — | the sight-reading constraints chosen from skill state and the phrase's content, shown in Today's reading row |
| `simonDrill.test.ts` › gives a learner below both of them the one they will meet first | replace | — | the chain chosen from ear-training skill state, shown on Today |
| `simonDrill.test.ts` › offers whichever of the two the plan would offer at that stage | replace | — | the chain chosen from ear-training skill state, shown on Today |
| `simonDrill.test.ts` › passes on the chain rather than on a share of the cards | replace | — | a Simon observation (chain reached) yielding evidence at the rung's level |
| `skillsFromPractice.test.ts` | replace | — | skill state derived only from measured evidence, shown on Skills and Progress |
| `slots.test.ts` › always has the bar after the cursor on the screen, until the last | preserve | — | the next bar's first note measured on the rendered glass at every step (score.layout.spec.ts; the sequence's nextBarVisible) |
| `slots.test.ts` › shows the second ending as the repeat comes round | preserve | — | the next bar's first note measured on the rendered glass at every step (score.layout.spec.ts; the sequence's nextBarVisible) |
| `slots.test.ts` › walks a pickup piece with the bar after the cursor always on the screen | preserve | — | the next bar's first note measured on the rendered glass at every step (score.layout.spec.ts; the sequence's nextBarVisible) |
| `tracks.test.ts` › stops Today recommending nothing once the core path is finished | revise | — | the curriculum decision over the active tracks, shown on Today |
| `test_generator_invariants.py` › test_no_direction_is_longer_than_that_in_any_key_the_family_is_written_in | revise | — | The rendered direction's box inside the page in the longest key name, measured on the drawn score. |
| `test_generator_invariants.py` › test_no_direction_is_longer_than_the_longest_one_that_survived | revise | — | The rendered direction's box lies inside the page and clear of staff, brace and barlines, measured on the drawn score. |
| `test_validate.py` › test_the_default_threshold_is_three | revise | — | The rung requirement the owner decides, asserted through validate_curriculum on a fixture lesson. |

#### code-string (56)

| test | class | also | reads instead |
|---|---|---|---|
| `offline.spec.ts` | preserve | machine-literal | entry chunk's module graph (bundle stats) excludes the engraver and first paint fetches no engraver chunk |
| `Piano.test.ts` | preserve | — | the built service-worker precache manifest lists BUNDLED_PIANO_PATH |
| `Piano.test.ts` › points at a path the Workbox precache glob covers (content/**) | revise | structural | assert the built precache manifest contains the piano file |
| `WebMidiSource.test.ts` | preserve | — | the MIDI/Diagnostics screen text rendered in jsdom (midiScreenDevices.test.ts does this for some states) |
| `coaching.test.ts` | preserve | — | the coaching line as rendered on the drill summary sheet (jsdom DrillScreen) |
| `compositionStatus.test.ts` | revise | — | The rendered Library detail sheet text for a pd, an in-copyright, an unknown and a personal-build item. |
| `drillParamsRead.test.ts` | preserve | — | the prompt text rendered on the drill card (jsdom) |
| `drillPrompts.test.ts` | preserve | — | the drill card's rendered text in jsdom (DrillScreen) for every drillable item |
| `drillStaffPolicy.test.ts` | preserve | — | the pedal card's label read off the rendered Drill screen (jsdom) |
| `drills.test.ts` | preserve | — | for the two label checks: the card text rendered by DrillScreen |
| `expectedNote.test.ts` | revise | — | the rendered status line names the note as the score spells it (step and alter), e.g. E♭4 in B♭ major |
| `folderLibrary.test.ts` › names the handle the browser would not hand over | revise | — | The FolderScreen notice text rendered for rememberNote 'not-remembered'. |
| `folderLibrary.test.ts` › says nothing at all when there is nothing to say | revise | — | The FolderScreen notice hidden for a folder picked with remembering off. |
| `folderLibrary.test.ts` › separates "not stored" from "not remembered", because they end differently | revise | — | The FolderScreen notice text rendered for rememberNote 'not-stored'. |
| `folderLibrary.test.ts` › tells the owner to allow it when it is a permission, and to re-pick when it is g | revise | — | The FolderScreen notice text and its button rendered for 'permission' and 'stale'. |
| `halfPedalDepth.test.ts` | preserve | — | the summary sheet's rendered Half pedal line |
| `harmonyDrills.test.ts` | preserve | — | for the wording: the drill card text rendered by DrillScreen |
| `help.test.ts` | preserve | — | each screen's help panel and summary sheet rendered in jsdom, compared with 04 section 5f |
| `help.test.ts` › has words for every key a drill puts in `detail` | revise | — | run each drill kind to a result and check every rendered detail line on the summary uses a label |
| `inputPolicy.test.ts` | preserve | — | the rendered control-bar hint and sheet accuracy line on a mic run |
| `labHelp.test.ts` | preserve | — | LabScreen rendered in jsdom with the help line collected under each control |
| `labHelp.test.ts` › gives a line to each of the controls the screen draws | revise | — | render the lab in jsdom and pair each control with its help line |
| `labPresets.test.ts` | preserve | — | a shared data file both sides read, so the join compares data rather than a regex over Python |
| `lessonShape.test.ts` | revise | — | quoted numbers read from the constants themselves (import them), not a regex over the file |
| `lessonShape.test.ts` › 0.3.md: after 1, 3, 7 and 21 days | replace | — | the lesson's description of review checked against what C's review decision does |
| `lessonShape.test.ts` › practice.3.md: one, three, seven and twenty-one days after you passed it | replace | — | the lesson's description of review checked against what C's review decision does |
| `lessonShape.test.ts` › theory.9.md: keys with four accidentals, with triplets and a walking bass | replace | — | the rung's promise checked on generated phrases, as sightReadingPromises does |
| `lessonSongEmpty.test.ts` | preserve | — | for the rule half: the sentence rendered per rung |
| `levelSource.test.ts` | preserve | — | the level label rendered on a Library or swap row |
| `loopbackLatency.test.ts` | preserve | — | the Diagnostics screen's rendered reason line |
| `midiHands.test.ts` | preserve | — | the assign sheet's rendered hands line |
| `midiImport.test.ts` | preserve | — | the rendered import sheet and error banner |
| `midiParity.test.ts` | preserve | — | commit reference JSON for the committed fixtures so CI compares the port |
| `midiParity.test.ts` › is missing, and says how to make it | revise | — | commit reference JSON for crossed-hands.mid, two-hands.mid and the rendered exercise so CI compares the port on those |
| `midiParse.test.ts` | preserve | — | the import screen's rendered refusal |
| `noGenreSelection.test.ts` | preserve | — | a behavioural check: permuting genres and tags in the catalog changes no selector output |
| `offlineStatus.test.ts` › distinguishes "installed, one reload away" from "not there" | revise | — | The rendered Diagnostics line for an active, non-controlling worker. |
| `offlineStatus.test.ts` › reports a worker that is controlling the page | revise | — | The rendered Diagnostics line for a controlling worker. |
| `offlineStatus.test.ts` › says "not supported" where there is no service-worker API | revise | — | The rendered Diagnostics line with no serviceWorker on navigator. |
| `offlineStatus.test.ts` › says a new version is waiting, which nothing else on the phone does | revise | — | The rendered Diagnostics line naming the waiting version. |
| `offlineStatus.test.ts` › says the app will not work offline when nothing is registered | revise | — | The rendered Diagnostics service-worker line with no registration. |
| `prerequisites.test.ts` | revise | — | the lock state and reason as rendered on the lesson page, derived from rung state |
| `progressRanking.test.ts` › names every mode the app records, and never with a colon in it | revise | — | The rendered history sub-line for a run of each recorded mode. |
| `rungFor.test.ts` | replace | — | where a piece sits for this learner from its measured demands vs skill state, rendered on the Library row |
| `selectorsCacheInvariant.test.ts` | revise | — | while an identity-keyed cache over the records exists: freeze the records array in tests (or in dev builds) so an in-place mutation throws where it happens, instead of a regex over source |
| `simonDrill.test.ts` | preserve | — | the chip and label text as rendered on the drill screen (jsdom) |
| `storagePersistence.test.ts` › is not alarming while the other copy may still let go | revise | — | The rendered #settings-durability text while the database is blocked but not given up on. |
| `storagePersistence.test.ts` › puts a blocked database ahead of the eviction state, and names the cure | revise | — | The rendered #settings-durability text while the database is blocked and given up on. |
| `storagePersistence.test.ts` › says which of the four states the app is in | revise | — | The rendered #settings-durability text for persisted, best-effort, unavailable and not-yet-known. |
| `techniqueMeasures.test.ts` | preserve | — | the summary sheet's rendered technique line |
| `test_generator_invariants.py` › test_every_maker_has_a_docstring | revise | — | Every family has an intent row in data that the checks read, and none is missing. |
| `test_pdmx.py` › TestAttestation.test_the_quotas_apply_it | revise | — | Run apply_quotas on candidates including an unattested band 1-2 row and assert it is not chosen. |
| `test_pdmx.py` › TestFolderManifest.test_the_app_and_the_writer_agree_on_the_shape | revise | — | An app unit test loads a manifest written by manifest.py (checked-in fixture) through the real reader. |
| `test_pdmx.py` › TestMatchWant.test_every_caller_hands_over_the_composer_column | revise | — | select() and build_index() on a fixture row whose surname is only in composer_name reach its want. |
| `test_tips.py` | preserve | — | none needed for the join, which is a docs-against-code gate by design; read the runtime list from the built bundle rather than by regex if it is kept |
| `test_tips.py` › test_the_plateau_lesson_the_coach_links_to_exists | revise | — | Render the coach's plateau advice in an app unit test and resolve its link against the built lesson list. |

#### race (39)

| test | class | also | reads instead |
|---|---|---|---|
| `app-shell.spec.ts` › the tab bar stays on the bottom of the screen | revise | machine-literal | poll .screen-body scrollTop until it stops changing, then read the tab bar rect and document scroll |
| `carry-overs.spec.ts` › offers bass and drums, and turning it on turns the comp on | revise | — | wait for the chart to render, then assert the backing control is present and drive it |
| `carry-overs.spec.ts` › the order survives a reload, because it is stored | revise | — | wait until the moved chip is drawn first, then reload and read the drawn order |
| `drills-review.spec.ts` › harmonic dictation: nothing until the answer is judged, then the progression | revise | — | wait for the drill to publish that the chord closed before sending the next |
| `drills.spec.ts` › ${id}: its buttons are on the screen | revise | machine-literal | measure after a settled state (data-drill running, card dealt) keeping the relation |
| `engine.spec.ts` | preserve | — | anchor the clock checks on step boundaries published by the harness (engineEvents / engineState) or on a controlled clock, not wall-clock waits |
| `folder.rail-cost.spec.ts` | revise | machine-literal | wait for the first row to start with the letter (or the 'showing' count line), then count rows |
| `folder.spec.ts` › jumps to a letter, and grows the list to reach one that is not drawn yet | revise | — | first row starts with P after the jump and the row count stays one page (as folder.rail-cost) |
| `keys-guide.spec.ts` | revise | — | wait for the run's waiting state (scoreRun().armed / #score-waiting) and for .key.is-expected to be present before asserting what is absent |
| `landscape.spec.ts` | revise | machine-literal | wait on a settled-layout signal (fonts ready, list rendered) then measure; keep the spec's 48 px |
| `library.spec.ts` › waits for the title sort, then moves the window to the letter | revise | — | wait for the first row to start with M, then count rows |
| `metronome.spec.ts` | preserve | machine-literal, structural | (rows) a published beat log |
| `metronome.spec.ts` › a meter chosen while it is running reaches the click | revise | machine-literal | the scheduler's beat indices after the change cycle 1–2–3 (published beat log or dot index sequence) |
| `modes-technique-measure.spec.ts` | preserve | — | poll for lit keys (state) instead of sleeping 100 ms |
| `progress.spec.ts` › a setting survives localStorage being cleared, because IndexedDB has it | revise | — | wait until the mirrored setting is readable from IndexedDB (or a saved signal), then clear and reload |
| `score.bar-targets.spec.ts` | revise | — | wait for data-mode, document.fonts.ready and a settled bar (its children unchanged across frames) before measuring |
| `score.fill.spec.ts` | revise | — | the window rule's (b) on the drawn staff: as big as allowed (touches width or height, or at the Size ceiling) with the five-line staff over the floor, after data-measured and a settled transform |
| `score.screen.spec.ts` › and goes anyway, even when it is covering nothing (decision 5) | revise | machine-literal | a controlled clock for the fold; the premise as a share of the stage |
| `score.screen.spec.ts` › the control bar gets out of the way when it is taking room from the music | revise | — | drive the fold timer with a controlled clock (install, advance past CONTROL_BAR_HIDE_MS) and read data-visible |
| `score.screen.spec.ts` › the ⋯ sheet fits sideways without scrolling (08 §7.2) | revise | — | wait for the window row's words to stop changing (or a published settled state after the re-plan), then read the sheet |
| `score.sheet-rows.spec.ts` | revise | — | wait for data-measured and the row words to settle before judging the rows |
| `score.states.spec.ts` | revise | — | wait on the state each event should produce (expect.poll on scoreRun() or the state line) instead of a fixed pause |
| `scoreControls.ts` | revise | — | reveal by tapping and waiting for #score-bar[data-visible=true]; hold the bar open (test hook or controlled clock) through a sequence of presses |
| `setup.spec.ts` › every step photographed, phone ${orientation} | revise | — | wait for the step's svg/fonts settled before each shot |
| `tour/shoot.ts` | revise | — | wait on the fit hook's settled zoom (t30.ts settle) before the shutter. |
| `tour/t30-window.spec.ts` › the drill that draws a stave | delete | structural | the five-line staff in px measured on the drill card (#drill-stage), if the drill stave is in H's audit. |
| `tour/tour.spec.ts` | revise | structural | fail the run on gaps, redundant scenes and identical pictures; prove each scene by what its caption names on the glass; replace the networkidle wait with the screen's own ready state. |
| `diagnosticsMicRelease.test.ts` | preserve | — | vi.waitFor on the capture having started before disposing |
| `diagnosticsMicRelease.test.ts` › is left alone when something else opened it | revise | — | wait until the capture is recording, then assert disconnects 0 after dispose |
| `dynamicsDrillCard.test.ts` | preserve | — | observe the card across the phrase with a watcher, or advance fake timers past the moment it used to flip, so a late timer cannot pass it |
| `dynamicsDrillCard.test.ts` › stays on the soft phrase until the learner says Next | revise | — | vi.useFakeTimers, advance past FEEDBACK_MS, then read the prompt |
| `pdfScreenDetection.test.ts` › does not re-detect a page whose cuts are already stored | revise | — | Wait on the screen's published idle/settled state (or the background loop's completion) and then assert zero detection-width renders. |
| `persist.test.ts` › writes both stores | revise | — | Poll the settings store for the value (state-based vi.waitFor) or await an exposed write promise. |
| `redrawFailure.test.ts` | revise | — | vi.waitFor on #library-status text and class after the redraw is asked for. |
| `scoreSession.test.ts` › a second pause, during a resume’s count, keeps the learner-led decision | revise | — | the same assertions with the clock advanced by vi.advanceTimersByTime (or an injected clock) to a stated point past the app's note |
| `sessionRetention.test.ts` › recording a run prunes without being asked | revise | — | Await recordRun's own prune (exposed promise or a state poll on sessionCount) with no explicit pruneSessions call. |
| `shelfLoadFailure.test.ts` | revise | — | vi.waitFor on #shelf-status text and class. |
| `simonTurnCue.test.ts` › does not take a key pressed while the app is still playing as the answer | revise | — | fake timers holding the chain mid-play, then assert the cue is absent and the key ignored |
| `simonTurnCue.test.ts` › says it is the learner’s turn once the chain has finished | revise | — | fake timers holding the chain mid-play, then assert the cue is absent and the key ignored |

#### machine-literal (25)

| test | class | also | reads instead |
|---|---|---|---|
| `finder.spec.ts` | revise | structural | the assign sheet opens pre-filled with Save enabled and nothing else required (the action count read from the screen, not a counter) |
| `guide.spec.ts` | preserve | — | each figure decodes on the page (naturalWidth > 0); steps as a relation to the procedure |
| `help-strip.spec.ts` | preserve | structural | compare each line with the mode it names (test 2 already shows listen ≠ wait) rather than non-empty |
| `keyboard-strip.spec.ts` › updating a chord mutates only those keys and keeps every node identical | replace | structural | drive KeyboardStrip through the MIDI mock (the app's setState path) under a MutationObserver: no childList mutations, identical nodes, changed keys per update bounded |
| `mic.spec.ts` | preserve | — | cost as a relation to the hop's duration (kept as spec); physical bounds as relations (noise floor ≤ RMS) |
| `perf.spec.ts` › a cold 2-bar window renders inside the first-render budget | preserve | — | the S25's own measured render time (debug report); in CI keep the throttled relation |
| `perf.spec.ts` › the Library answers every genre filter, and the search box, inside the first-pai | preserve | — | keep the relation; measured in-page to a laid-out first row |
| `plan.spec.ts` › a concept with many exercises reaches the upper levels | revise | — | the skill offers exercises at the learner's measured level range (as rendered) |
| `score.layout.spec.ts` › ${bars} bar${bars === 1 ? '' : 's'} per window, drawn | delete | — | the H state gallery's photographs judged with the window-rule assertions on the same cells |
| `score.screen.spec.ts` › the key it is waiting for is wide enough to hit, and on the screen | revise | — | the expected key against R4's 40 px target (or against the strip's white-key width share) |
| `score.spec.ts` | preserve | — | (fixture counts) compare with the harness's own fixture list instead of 41/42 |
| `score.spec.ts` › ${fixture} · ${bars} bar(s) · ${orientation} | delete | — | the H state gallery's photographs judged with the window-rule assertions |
| `score.spec.ts` › advancing into the pre-rendered next window costs well under a frame | revise | — | the renderer's own window.swap samples (swapTimings), as perf.spec reads them |
| `score.spec.ts` › is reachable from Settings and lists every bundled fixture | revise | — | option count equals the harness's fixtures list length |
| `settings-rules.spec.ts` | preserve | — | keep: spec-owned numbers measured on the drawn rows |
| `setup-layout.spec.ts` | preserve | — | keep: spec-owned floor on the label-credited hit area |
| `sweeps.spec.ts` | preserve | — | counts as relations to the declared content (as the lesson-count check already does) rather than literal floors |
| `today.spec.ts` › a row is one line of detail and no taller than 96 px (R2) | preserve | — | keep: spec-owned number on the drawn rows |
| `tour-practice-modes.spec.ts` | preserve | — | the prose check as 'a sentence naming the mode' rather than 60 characters |
| `tour/t30-sheet.mjs` | revise | — | judge against the floor H chooses and T38's honoured-up-to-fit rule; read bars per piece from content/catalog.json. |
| `chartDoor.test.ts` › stays shut for a row the build never measured, because unknown is not yes | revise | — | hasChordSymbols on a synthetic item with notation undefined, and the lesson row drawing no Chart button for it. |
| `micCalibration.test.ts` | preserve | — | keep the fixture measurements; state thresholds as relationships to the fixture (inside the note's span, within half a semitone) and re-derive on re-render |
| `micSourceConnect.test.ts` | preserve | — | inject a fake performance clock into MicSource and assert the exact stamp |
| `pitchDetector.test.ts` | preserve | — | keep; add recordings of the owner's piano through a phone microphone as fixtures |
| `sightReadingPromises.test.ts` › are nine, each on at least one rung | revise | — | every sight-reading row is on at least one rung (no count) |

#### structural (54)

| test | class | also | reads instead |
|---|---|---|---|
| `carry-overs.spec.ts` › offers a way to the rung that would unlock it | revise | — | the destination lesson's data-lesson equals the named prerequisite and differs from 4.5 |
| `drills.spec.ts` › "Again" starts a fresh set rather than repeating the same cards | revise | — | the second set's card sequence differs from the first (or carries a new seed) |
| `drills.spec.ts` › you can listen back to what you improvised | revise | — | playback schedules the recorded notes (64 then 67, with their gap) |
| `engine.spec.ts` › level ${level} renders and drives a perfect Wait run | revise | — | generate from declared demands (generator intent) and assert the drawn notes carry them (range, rhythm values, key, intervals) on the rendered score |
| `finder.spec.ts` › is reachable from the Skills screen, under a readable name | revise | — | the row's title text differs from its data-concept id (and is the concept's name) |
| `metronome.spec.ts` › leaving the screen stops it | revise | — | no beat scheduled or painted after navigation (a scheduler spy or beat counter that stays still) |
| `modes-placement.spec.ts` › the question is the screen, and the two answers are both on it | revise | — | count .button--primary (or the computed filled background) and assert Pass is the one |
| `pdf.spec.ts` › dragging a cut line moves it and keeps the systems in order | revise | — | the cut's drawn y moved by about the drag distance and all cuts stay ascending (labels still 1/2, 2/2) |
| `progress.spec.ts` › reports the precache, the content counts and the errors | revise | — | parse 'Precached n of m' and assert n = m, as offline.spec does |
| `score.countin.spec.ts` | preserve | — | the beat dot counted against the notated metre while the clock runs, with a watcher installed before Play |
| `score.countin.spec.ts` › the beat dot pulses in Tempo and stays away in Wait | revise | — | record the dot's lit transitions (MutationObserver) against the engine's tempoTick times: one per beat, in phase |
| `score.spec.ts` › OSMD stays out of the entry bundle | revise | — | assert no script fetched on /today carries OSMD (by the build's chunk manifest or a module marker) |
| `score.states.spec.ts` › probe: what each event does in each state | replace | — | a table-driven test asserting each decided cell (state, event -> running, paused, engine mode, transport label, line) from the decision document, each waited for as a state |
| `shelf.spec.ts` › offer no restart, and are listed apart from practice | revise | — | finish a performance run and see it under Performances and not in practice history |
| `shelf.spec.ts` › takes a page in the route | revise | — | open a real imported multi-page PDF with ?page=2 and read 'Page 2' on the label |
| `start-and-return.spec.ts` | preserve | — | each mode's line compared across modes (differs per mode) rather than non-empty |
| `articulationVoicingShaping.test.ts` › accepts a late jump, which is the rule's known weakness | revise | — | a late jump is reported as an accent, not a met crescendo |
| `lessonVideos.test.ts` | preserve | — | a reader's check per video (topic and stage) recorded in the video index; the shared word stays as a cheap floor |
| `lessonVideos.test.ts` › names the rung in the title YouTube gives back, on every video | revise | — | a reader's verdict per video recorded in the index |
| `sightReading.test.ts` › drives a perfect Wait run to the finish | preserve | — | musical checks on the phrase itself (the Q7 gap sightReadingPhraseShape) |
| `sightReadingPromises.test.ts` | preserve | — | the same checks over generator intent as data, plus a per-family musical plausibility reading (D) |
| `techniqueMeasures.test.ts` › lets a late jump through, which is the rule’s recorded weakness | revise | — | a late jump is reported as an accent, not a met crescendo |
| `test_author.py` › test_a_tune_with_no_level_is_refused | revise | — | The catalog row carries the piece's measured demands (from its notes) and the build refuses a row without them. |
| `test_finder.py` › test_it_counts_the_options_inside_the_level_band | replace | — | Count the options whose measured demands meet the rung's stated requirement. |
| `test_generator.py` › test_the_left_hand_holds_whole_notes_under_a_moving_right_hand | revise | — | The exercise's declared demands (hands together, held left hand) checked against its notes. |
| `test_generator_fingering.py` › test_the_quick_plan_has_them_in_c_at_stage_four | revise | — | The rung's requirement names the item (or its demands) and the item exists with those demands. |
| `test_generator_invariants.py` | preserve | — | per family, the declared target skill read from the notation over many seeds (Wave D presence and absence checks), one census row per promise |
| `test_generator_invariants.py` › test_every_family_has_at_least_one_mutation_that_reddens_it | revise | — | Per-promise census: every promise in a family's intent data has a check proved red by a mutation of that promise. |
| `test_harmony_families.py` › test_inversions_are_a_stage_later | revise | — | The ordering of the two items' measured demands (span, voices, rhythm, keys), or the rung requirement each meets. |
| `test_harmony_families.py` › test_it_is_levelled_with_the_sixteenth_syncopation_it_belongs_beside | revise | — | The ordering of the two items' measured demands (span, voices, rhythm, keys), or the rung requirement each meets. |
| `test_harmony_families.py` › test_the_blues_scale_in_g_earns_the_easy_level_its_rule_promises | revise | — | The ordering of the two items' measured demands (span, voices, rhythm, keys), or the rung requirement each meets. |
| `test_harmony_families.py` › test_the_minor_form_is_a_band_above_its_major_twin | revise | — | The ordering of the two items' measured demands (span, voices, rhythm, keys), or the rung requirement each meets. |
| `test_harmony_families.py` › test_the_pulse_costs_a_band | revise | — | The ordering of the two items' measured demands (span, voices, rhythm, keys), or the rung requirement each meets. |
| `test_harmony_families.py` › test_the_rootless_voicings_are_a_stage_higher | revise | — | The ordering of the two items' measured demands (span, voices, rhythm, keys), or the rung requirement each meets. |
| `test_harmony_families.py` › test_the_tenth_is_the_harder_of_the_two | revise | — | The ordering of the two items' measured demands (span, voices, rhythm, keys), or the rung requirement each meets. |
| `test_levels.py` | replace | — | Each exercise's measured demands (keys, hands, span, speed) in the catalog and a rung requirement over them. |
| `test_levels.py` › TestFiveFingerPatternsFollowTheKey.test_a_minor_is_never_easier_than_its_major | revise | — | The same monotone relation over the measured demands E adopts. |
| `test_levels.py` › TestFiveFingerPatternsFollowTheKey.test_a_pattern_is_never_above_its_own_scale | revise | — | The same monotone relation over the measured demands E adopts. |
| `test_levels.py` › TestFiveFingerPatternsFollowTheKey.test_two_hands_are_never_easier_than_one | revise | — | The same monotone relation over the measured demands E adopts. |
| `test_levels.py` › TestTheLadderOnlyGoesUp.test_a_minor_is_never_easier_than_its_major | revise | — | The same monotone relation over the measured demands E adopts. |
| `test_levels.py` › TestTheLadderOnlyGoesUp.test_faster_notes_are_never_easier | revise | — | The same monotone relation over the measured demands E adopts. |
| `test_levels.py` › TestTheLadderOnlyGoesUp.test_more_octaves_is_never_easier | revise | — | The same monotone relation over the measured demands E adopts. |
| `test_levels.py` › TestTheLadderOnlyGoesUp.test_two_hands_is_never_easier_than_one | revise | — | The same monotone relation over the measured demands E adopts. |
| `test_pdmx.py` › TestArchiveIndex.test_a_level_is_always_inside_the_stage_range | replace | — | The piece's measured demands recorded in the index/catalog, and a browse filter over them. |
| `test_pdmx.py` › TestArchiveIndex.test_the_proxy_recovers_a_level_it_was_fitted_on | replace | — | The piece's measured demands recorded in the index/catalog, and a browse filter over them. |
| `test_pdmx.py` › TestArchiveIndex.test_the_shipped_proxy_is_fitted_and_agrees_with_the_real_model | replace | — | The piece's measured demands recorded in the index/catalog, and a browse filter over them. |
| `test_pdmx.py` › TestArchiveIndex.test_without_a_fitted_model_it_says_so_rather_than_guessing_wil | replace | — | The piece's measured demands recorded in the index/catalog, and a browse filter over them. |
| `test_pdmx.py` › TestDifficulty.test_a_feature_whose_weight_comes_out_backwards_is_dropped | replace | — | The piece's measured demands recorded in the index/catalog, and a browse filter over them. |
| `test_pdmx.py` › TestDifficulty.test_the_fallback_table_is_kept_whether_or_not_a_model_is_fitted | replace | — | The piece's measured demands recorded in the index/catalog, and a browse filter over them. |
| `test_pdmx.py` › TestDifficulty.test_the_fit_recovers_a_known_linear_model | replace | — | The piece's measured demands recorded in the index/catalog, and a browse filter over them. |
| `test_pdmx.py` › TestDifficulty.test_the_shipped_model_is_the_one_P14_fitted | replace | — | The piece's measured demands recorded in the index/catalog, and a browse filter over them. |
| `test_validate_p11.py` › TestEstimatedCounts.test_an_item_with_no_level_source_counts_as_judged | replace | — | A report of which catalog levels come from measured demands and which from judgement, under E's one level. |
| `test_validate_p11.py` › TestEstimatedCounts.test_counts_are_grouped_by_stage | replace | — | A report of which catalog levels come from measured demands and which from judgement, under E's one level. |
| `test_validate_reach.py` | replace | — | A rung's pieces have measured demands within the rung's requirement (E's one level). |

---

## 6. The obsolete list by wave (Q3)

For each planned change, the tests it will make obsolete (replace or delete) and the tests whose
assertions it will force to be rewritten (revise). A row can sit under more than one wave. A
wave's brief names these; the wave deletes or replaces them **in the same change** as the
behaviour, with the reason and the class, and adds the outcome test (§7) beside the deletion.
Files marked replace here that also hold preserve single tests are in §4: those tests move, they
do not go.

Notes on the four waves the brief names. **C** retires or rewrites the most: the pass/mastery frame
(`engineScoring`'s thresholds, `rungMastery`, `progressStore`), selection (`curriculumSelectors`,
`session`, `placementStartsThePlan`, `prerequisites`' next-rung tests, and `tracks`' one test to
revise), the review
calendar (`recordTruth`'s two review tests, `progress.spec`'s review test, `lesson-flow`), the
Skills "rusty" state (`skillsFromPractice`, `legacyStorage`'s two), `simonForStage`, and the
lesson-claim rows that quote rung thresholds or the placement start. **D** retires little
outright (the declared-level relations become relations between measured demands) and revises
the generator's structural promises into presence and absence checks. **E** retires the level
model's tests (`test_levels`, `test_validate_reach`, `rungFor`, the PDMX fitted proxy) and
revises the ≥ 3-options rule's nine tests in `test_validate`, a rule the owner may change
(matrix R23). **F** replaces no file
outright, but every claims table and tips test is keyed to today's lesson ids and prose and is
rewritten with the lessons; the claims rule itself stays (§4, TEACH).

**Wave C, observations, evidence, skill state, in-rung selection, fallbacks:** 53 to replace or delete, 45 to revise.

Replace or delete: `lesson-flow.spec.ts` (replace); `modes-placement.spec.ts` (replace); `placement-branches.spec.ts` (replace); `plan.spec.ts` › lists every concept with a state and a way to drill it (replace); `progress.spec.ts` › an item passed yesterday is due for review today (replace); `shelf.spec.ts` › a self-assessed clean run finishes the rung it answers (replace); `today.spec.ts` › Today keeps recommending after the core path, from a track he never turned on (replace); `curriculumSelectors.test.ts` (replace); `engineScoring.test.ts` › honours custom thresholds (replace); `engineScoring.test.ts` › passes at 90 % accuracy and 80 % tempo (replace); `engineScoring.test.ts` › qualifies for mastery at 97 % and full tempo (replace); `importOverlay.test.ts` › lets an imported piece complete the rung (replace); `legacyStorage.test.ts` › Skills draws the stored skill rows in the state they were stored in (replace); `legacyStorage.test.ts` › does not re-judge a pass under a rung that now asks for more (replace); `legacyStorage.test.ts` › keeps the skill rows, and does not let an old date read as rusty on its own (replace); `lessonClaimsAboutApp.test.ts` › 0.4: a placement start holds the rungs behind it back and gives them back when n (replace); `lessonClaimsAboutApp.test.ts` › 0.4: your plan begins at the placed unit from then on (replace); `lessonClaimsAboutApp.test.ts` › 1.1: this rung's own pass is the 90 % and 80 % the lesson quotes (replace); `lessonClaimsAboutApp.test.ts` › 1.3: this rung's own pass is the 90 % and 80 % the lesson quotes (replace); `lessonClaimsAboutApp.test.ts` › 1.4: this rung asks for 85 % of tempo, which is what its lesson now quotes (replace); `lessonClaimsAboutApp.test.ts` › 1.4: this rung asks for a tempo of its own, and the scorer uses it (replace); `lessonClaimsAboutApp.test.ts` › 2.1: this rung's own pass is the 90 % and 80 % the lesson quotes (replace); `lessonClaimsAboutApp.test.ts` › 2.5: a rung that asks for 95 % is judged at 95 %, not at 90 % (replace); `lessonClaimsAboutApp.test.ts` › 3.4: the daily read is the right-hand level-2 phrase at Stage 3 and the two-hand (replace); `lessonClaimsAboutApp.test.ts` › 4.4: this rung asks for more accuracy than the app-wide pass (replace); `lessonClaimsAboutApp.test.ts` › 4.7: the rung's blind rule is a string nothing measures, and completion is one p (replace); `lessonCompletePerf.test.ts` (replace); `lessonShape.test.ts` › 0.3.md: after 1, 3, 7 and 21 days (replace); `lessonShape.test.ts` › practice.3.md: one, three, seven and twenty-one days after you passed it (replace); `placementStartsThePlan.test.ts` (replace); `planHierarchy.test.ts` › counts a stage against the rungs that are on screen, not the ones switched off (replace); `planHierarchy.test.ts` › marks the stage being worked on, and the rung inside it (replace); `planHierarchy.test.ts` › shows how far through a stage is, as a bar as well as a fraction (replace); `prerequisites.test.ts` › ignores prerequisites when gating is off (replace); `prerequisites.test.ts` › recommends a locked rung rather than nothing when everything left is locked (replace); `prerequisites.test.ts` › skips a locked rung for the first one he can start (replace); `progressStore.test.ts` (replace); `recordTruth.test.ts` › in ${tz}: passed at 20:30, not due at 20:45 that evening, due the next morning (replace); `recordTruth.test.ts` › in ${tz}: the three-day step comes on the third calendar day (replace); `rungMastery.test.ts` (replace); `session.test.ts` (replace); `shelf.test.ts` › completes a repertoire rung from a self-assessed paper pass (replace); `shelf.test.ts` › is allowed on a rung whose rule is not a number (replace); `shelf.test.ts` › is allowed on a rung with no measured rule (replace); `sightReadingSlot.test.ts` (replace); `simonDrill.test.ts` › gives a learner below both of them the one they will meet first (replace); `simonDrill.test.ts` › offers whichever of the two the plan would offer at that stage (replace); `simonDrill.test.ts` › passes on the chain rather than on a share of the cards (replace); `skillsFromPractice.test.ts` (replace); `techniqueMeasures.test.ts` › does not fire for a different measure’s rule (replace); `techniqueMeasures.test.ts` › is false where the rung states no rule, which is all four of them today (replace); `techniqueMeasures.test.ts` › is true where a rung names the measure with a number (replace); `test_validate_reach.py` (replace).

Revise: `carry-overs.spec.ts` › offers a way to the rung that would unlock it; `drills.spec.ts` › every item it can end on names a unit that exists; `drills.spec.ts` › finishing records the run and Progress shows it; `drills.spec.ts` › the backing-track drill loops and judges nothing; `empty-states.spec.ts` › a stage with nothing on the tracks you have on says so and offers the tracks; `finder.spec.ts` › is reachable from the Skills screen, under a readable name; `first-day.spec.ts`; `folder.spec.ts` › Details says where the estimated level sits, and what the estimate is worth; `folder.spec.ts` › a score already on a rung is not asked about again; `folder.spec.ts` › assigning it on the folder screen makes the row say so, without a reload; `folder.spec.ts` › says it is on no rung, and opens the assign sheet from the folder row; `lab.spec.ts` › ticks and starts counting once the day is read; `modes-placement.spec.ts` › the question is the screen, and the two answers are both on it; `plan.spec.ts` › "I already know this" records a self-pass with its own badge; `plan.spec.ts` › filters by stage; `plan.spec.ts` › lists every stage with its completion, and expands to lessons; `progress.spec.ts` › records a run and shows it in the history and the heat-map; `score.states.spec.ts`; `today.spec.ts`; `tour/seed.ts`; `tour/tour.spec.ts`; `backup.test.ts` › merges rather than overwriting practice done since the export; `curriculumSelectors.test.ts` › offers the rest of the lesson first; `drillWalkthrough.test.ts` › finishes, records the run, and starts from the top the next time; `folderAssign.test.ts` › reaches the assign sheet from the folder, and then counts towards the rung; `perfectSweep.ts`; `importOverlay.test.ts` › offers it as an alternative to the rung’s other songs; `legacyStorage.test.ts`; `lessonClaimsAboutApp.test.ts`; `levelSource.test.ts` › prefers a judged level over an estimated one at the same distance; `levelSource.test.ts` › still puts the nearer level first when the distances differ; `placementTargets.test.ts`; `planHierarchy.test.ts` › says so on the one line that announces, when there is nothing left; `prerequisites.test.ts`; `progressRanking.test.ts` › does not head the figure with the words the figure ends on; `selectorsCacheInvariant.test.ts`; `session.test.ts` › offers the lesson’s other options first; `sessionRetention.test.ts` › recording a run prunes without being asked; `shelf.test.ts` › appends a registered piece to its rung as a paper option; `simonDrill.test.ts` › survives the round trip through the stored best accuracy; `todayCardRanking.test.ts` › names the rung the learner is on without printing its id; `tracks.test.ts` › stops Today recommending nothing once the core path is finished; `test_technique_units.py` › test_the_ladder_is_chained; `test_tips.py` › test_the_plateau_lesson_the_coach_links_to_exists; `test_validate.py` › test_a_lesson_that_needs_no_songs_is_not_asked_for_three.

**Wave D, generator intent, validators, the sight-reading table:** 7 to replace or delete, 27 to revise.

Replace or delete: `lessonClaimsAboutApp.test.ts` › 2.2: the sight-reading drill on this rung has eighths in its pool from the first (replace); `lessonClaimsAboutApp.test.ts` › 3.4: the daily read is the right-hand level-2 phrase at Stage 3 and the two-hand (replace); `lessonClaimsAboutApp.test.ts` › 3.4: the level-2 phrase spans middle C to the C above and no further (replace); `lessonShape.test.ts` › theory.9.md: keys with four accidentals, with triplets and a walking bass (replace); `test_levels.py` (replace); `test_validate_p11.py` › TestEstimatedCounts.test_an_item_with_no_level_source_counts_as_judged (replace); `test_validate_p11.py` › TestEstimatedCounts.test_counts_are_grouped_by_stage (replace).

Revise: `engine.spec.ts` › level ${level} renders and drives a perfect Wait run; `plan.spec.ts` › a concept with many exercises reaches the upper levels; `sightReading.test.ts`; `sightReadingPromises.test.ts` › are nine, each on at least one rung; `test_generator.py` › test_the_four_four_patterns_kept_their_ids; `test_generator.py` › test_the_left_hand_holds_whole_notes_under_a_moving_right_hand; `test_generator_fingering.py` › test_the_quick_plan_has_them_in_c_at_stage_four; `test_generator_invariants.py` › test_every_family_has_at_least_one_mutation_that_reddens_it; `test_generator_invariants.py` › test_every_maker_has_a_docstring; `test_generator_invariants.py` › test_no_direction_is_longer_than_that_in_any_key_the_family_is_written_in; `test_generator_invariants.py` › test_no_direction_is_longer_than_the_longest_one_that_survived; `test_harmony_families.py` › test_inversions_are_a_stage_later; `test_harmony_families.py` › test_it_is_levelled_with_the_sixteenth_syncopation_it_belongs_beside; `test_harmony_families.py` › test_the_blues_scale_in_g_earns_the_easy_level_its_rule_promises; `test_harmony_families.py` › test_the_minor_form_is_a_band_above_its_major_twin; `test_harmony_families.py` › test_the_pulse_costs_a_band; `test_harmony_families.py` › test_the_rootless_voicings_are_a_stage_higher; `test_harmony_families.py` › test_the_tenth_is_the_harder_of_the_two; `test_import_musetrainer.py` › test_a_placeholder_keeps_the_metadata_the_rung_needs; `test_pdmx.py` › TestBuildItemLevelSource.test_a_row_saying_estimated_is_estimated; `test_pdmx.py` › TestBuildItemLevelSource.test_a_row_saying_judged_reaches_the_catalog; `test_pdmx.py` › TestBuildItemLevelSource.test_a_silent_row_is_estimated; `test_pdmx.py` › TestBuildItemLevelSource.test_a_typo_fails_the_build_rather_than_becoming_an_est; `test_validate_p11.py` › TestCatalogItemRequiresLevelSource.test_a_nonsense_value_is_refused; `test_validate_p11.py` › TestCatalogItemRequiresLevelSource.test_a_writer_must_say_which; `test_validate_p11.py` › TestCatalogItemRequiresLevelSource.test_the_field_reaches_the_item; `devScore.ts`.

**Wave E, demands into the catalog, one level, excerpts:** 14 to replace or delete, 68 to revise.

Replace or delete: `rungFor.test.ts` (replace); `test_finder.py` › test_it_counts_the_options_inside_the_level_band (replace); `test_levels.py` (replace); `test_pdmx.py` › TestArchiveIndex.test_a_level_is_always_inside_the_stage_range (replace); `test_pdmx.py` › TestArchiveIndex.test_the_proxy_recovers_a_level_it_was_fitted_on (replace); `test_pdmx.py` › TestArchiveIndex.test_the_shipped_proxy_is_fitted_and_agrees_with_the_real_model (replace); `test_pdmx.py` › TestArchiveIndex.test_without_a_fitted_model_it_says_so_rather_than_guessing_wil (replace); `test_pdmx.py` › TestDifficulty.test_a_feature_whose_weight_comes_out_backwards_is_dropped (replace); `test_pdmx.py` › TestDifficulty.test_the_fallback_table_is_kept_whether_or_not_a_model_is_fitted (replace); `test_pdmx.py` › TestDifficulty.test_the_fit_recovers_a_known_linear_model (replace); `test_pdmx.py` › TestDifficulty.test_the_shipped_model_is_the_one_P14_fitted (replace); `test_validate_p11.py` › TestEstimatedCounts.test_an_item_with_no_level_source_counts_as_judged (replace); `test_validate_p11.py` › TestEstimatedCounts.test_counts_are_grouped_by_stage (replace); `test_validate_reach.py` (replace).

Revise: `finder.spec.ts`; `folder.spec.ts` › Details says where the estimated level sits, and what the estimate is worth; `plan.spec.ts` › a concept with many exercises reaches the upper levels; `plan.spec.ts` › lists every exercise for a concept, easiest first, collapsed after three; `progress.spec.ts` › reports the precache, the content counts and the errors; `chartDoor.test.ts` › stays shut for a row the build never measured, because unknown is not yes; `curriculumSelectors.test.ts` › counts both lists for a song-optional lesson; `curriculumSelectors.test.ts` › finds a lesson with too few songs; `curriculumSelectors.test.ts` › ignores an exempt lesson; `curriculumSelectors.test.ts` › is empty for a full curriculum; `difficulty.test.ts`; `perfectSweep.ts`; `importStore.test.ts` › defaults an unlabelled score above the beginner stages, not below them; `legacyStorage.test.ts`; `lessonClaimsAboutMusic.test.ts` › classical.4: none of its five songs carries an ABRSM grade, while the Library ho; `lessonClaimsAboutMusic.test.ts` › holiday.3: God Rest Ye prints E minor and B seven under a one-sharp signature an; `lessonClaimsAboutMusic.test.ts` › rock.overview: the easy Canon in D is the highest-levelled of the rung's four an; `levelOverrides.test.ts` › replaces the level and marks the item judged; `levelSource.test.ts` › prefers a judged level over an estimated one at the same distance; `levelSource.test.ts` › still puts the nearer level first when the distances differ; `libraryRowRanking.test.ts` › says nothing about hands when the answer is "both"; `needs.test.ts`; `shelfRanking.test.ts` › writes the level the way every other screen writes one; `test_author.py` › test_a_tune_with_no_level_is_refused; `test_convert.py` › test_missing_tempo_gets_the_default; `test_difficulty.py`; `test_finder.py` › test_a_song_optional_rung_counts_both_lists_together; `test_finder.py` › test_an_exempt_rung_gets_none; `test_finder.py` › test_it_counts_what_is_short_of_the_floor; `test_generator_fingering.py` › test_the_quick_plan_has_them_in_c_at_stage_four; `test_harmony_families.py` › test_inversions_are_a_stage_later; `test_harmony_families.py` › test_it_is_levelled_with_the_sixteenth_syncopation_it_belongs_beside; `test_harmony_families.py` › test_the_blues_scale_in_g_earns_the_easy_level_its_rule_promises; `test_harmony_families.py` › test_the_minor_form_is_a_band_above_its_major_twin; `test_harmony_families.py` › test_the_pulse_costs_a_band; `test_harmony_families.py` › test_the_rootless_voicings_are_a_stage_higher; `test_harmony_families.py` › test_the_tenth_is_the_harder_of_the_two; `test_import_musetrainer.py` › test_a_placeholder_keeps_the_metadata_the_rung_needs; `test_levels.py` › TestFiveFingerPatternsFollowTheKey.test_a_minor_is_never_easier_than_its_major; `test_levels.py` › TestFiveFingerPatternsFollowTheKey.test_a_pattern_is_never_above_its_own_scale; `test_levels.py` › TestFiveFingerPatternsFollowTheKey.test_two_hands_are_never_easier_than_one; `test_levels.py` › TestTheLadderOnlyGoesUp.test_a_minor_is_never_easier_than_its_major; `test_levels.py` › TestTheLadderOnlyGoesUp.test_faster_notes_are_never_easier; `test_levels.py` › TestTheLadderOnlyGoesUp.test_more_octaves_is_never_easier; `test_levels.py` › TestTheLadderOnlyGoesUp.test_two_hands_is_never_easier_than_one; `test_pdmx.py` › TestBuildItemLevelSource.test_a_row_saying_estimated_is_estimated; `test_pdmx.py` › TestBuildItemLevelSource.test_a_row_saying_judged_reaches_the_catalog; `test_pdmx.py` › TestBuildItemLevelSource.test_a_silent_row_is_estimated; `test_pdmx.py` › TestBuildItemLevelSource.test_a_typo_fails_the_build_rather_than_becoming_an_est; `test_pdmx.py` › TestDifficulty.test_a_chord_exercise_has_three_notes_at_a_time; `test_pdmx.py` › TestDifficulty.test_a_scale_has_one_note_at_a_time_and_no_span; `test_pdmx.py` › TestDifficulty.test_every_named_feature_is_returned; `test_pdmx.py` › TestSelection.test_a_bucket_that_cannot_fill_its_share_hands_the_remainder_on; `test_technique_units.py` › test_every_technique_rung_still_has_its_band_and_its_finder; `test_tips.py` › test_all_five_exist_and_are_on_the_practice_track; `test_validate.py` › test_a_full_lesson_passes; `test_validate.py` › test_a_lesson_that_needs_no_songs_is_not_asked_for_three; `test_validate.py` › test_an_exempt_lesson_is_skipped_entirely; `test_validate.py` › test_song_optional_counts_the_two_lists_together; `test_validate.py` › test_song_optional_still_needs_three_exercises; `test_validate.py` › test_the_default_threshold_is_three; `test_validate.py` › test_the_threshold_can_be_turned_off; `test_validate.py` › test_too_few_exercises_is_an_error; `test_validate.py` › test_too_few_songs_is_an_error_and_names_the_way_out; `test_validate_p11.py` › TestCatalogItemRequiresLevelSource.test_a_nonsense_value_is_refused; `test_validate_p11.py` › TestCatalogItemRequiresLevelSource.test_a_writer_must_say_which; `test_validate_p11.py` › TestCatalogItemRequiresLevelSource.test_the_field_reaches_the_item; `test_validate_p11.py` › test_a_technique_rung_exists_for_every_stage_four_to_eight.

**Wave F, the lesson schema:** 0 to replace or delete, 36 to revise.


Revise: `carry-overs.spec.ts` › offers a way to the rung that would unlock it; `finder.spec.ts`; `folder.spec.ts` › a score already on a rung is not asked about again; `folder.spec.ts` › assigning it on the folder screen makes the row say so, without a reload; `folder.spec.ts` › says it is on no rung, and opens the assign sheet from the folder row; `guide-shots.spec.ts`; `modes-duet.spec.ts` › the button opens one of the rung’s own pieces, with a hand chosen; `modes-duet.spec.ts` › the button still means it after the Duet row has been switched off once; `modes-lab-unlock.spec.ts` › the freed picker reaches the loop, not just the label; `offline.spec.ts` › the whole app works with the network off after one online launch; `perf.spec.ts`; `plan.spec.ts` › shows the concept text, the options and the videos; `tips.spec.ts`; `tour/tour.spec.ts`; `curriculumIntegrity.test.ts` › has each lesson claiming the unit that points at it; `curriculumSelectors.test.ts` › counts both lists for a song-optional lesson; `curriculumSelectors.test.ts` › finds a lesson with too few songs; `curriculumSelectors.test.ts` › ignores an exempt lesson; `curriculumSelectors.test.ts` › is empty for a full curriculum; `ladderTool.test.ts` › %s names the ladder and has something to climb; `ladderTool.test.ts` › is on those rungs and no others, because a whole-piece loop suits an exercise; `lessonClaimsAboutApp.test.ts`; `lessonShape.test.ts`; `lessonVideos.test.ts` › names the rung in the title YouTube gives back, on every video; `needs.test.ts`; `planHierarchy.test.ts` › draws a unit line only where a unit is more than one rung; `shelf.test.ts` › appends a registered piece to its rung as a paper option; `test_generator.py` › test_the_lessons_still_say_what_this_builds; `test_technique_units.py` › test_every_rung_says_how_long_it_takes; `test_technique_units.py` › test_every_technique_rung_still_has_its_band_and_its_finder; `test_technique_units.py` › test_the_ladder_is_chained; `test_tips.py` › test_all_five_exist_and_are_on_the_practice_track; `test_tips.py` › test_the_plateau_lesson_the_coach_links_to_exists; `test_tips.py` › test_the_track_is_declared; `test_validate_p11.py` › test_a_technique_rung_exists_for_every_stage_four_to_eight; `test_validate_p11.py` › test_technique_is_a_track_now_that_it_has_a_ladder.

**Wave G, identity and style:** 0 to replace or delete, 16 to revise.


Revise: `carry-overs.spec.ts` › a drag past the threshold reorders; a tap still toggles; `carry-overs.spec.ts` › moves a chip to the front and stores the new order; `carry-overs.spec.ts` › the order survives a reload, because it is stored; `empty-states.spec.ts` › a stage with nothing on the tracks you have on says so and offers the tracks; `plan.hierarchy.spec.ts` › the tracks sheet groups the ones that are off, and orders the ones that are on; `planTracksGrouped.test.ts` › groups the tracks that are off into families; `test_generator.py` › test_the_slow_blues_is_on_the_blues_track; `test_harmony_families.py` › test_every_harmony_item_names_a_track_that_teaches_it; `test_import_musetrainer.py` › test_a_placeholder_keeps_the_metadata_the_rung_needs; `test_pdmx.py` › TestBuildItemOverrides.test_the_bucket_stands_in_when_the_row_is_silent; `test_pdmx.py` › TestBuildItemOverrides.test_the_row_wins_when_it_speaks; `test_pdmx.py` › TestSelection.test_a_bucket_that_cannot_fill_its_share_hands_the_remainder_on; `test_pdmx.py` › TestSelection.test_genre_buckets; `test_tips.py` › test_the_track_is_declared; `test_validate_p11.py` › test_every_track_the_repository_uses_is_defined; `test_validate_p11.py` › test_technique_is_a_track_now_that_it_has_a_ladder.

**Wave X, Today, Plan, Progress, practice intent:** 7 to replace or delete, 38 to revise.

Replace or delete: `lesson-flow.spec.ts` (replace); `modes-placement.spec.ts` (replace); `progress.spec.ts` › an item passed yesterday is due for review today (replace); `planHierarchy.test.ts` › counts a stage against the rungs that are on screen, not the ones switched off (replace); `planHierarchy.test.ts` › shows how far through a stage is, as a bar as well as a fraction (replace); `simonDrill.test.ts` › gives a learner below both of them the one they will meet first (replace); `simonDrill.test.ts` › offers whichever of the two the plan would offer at that stage (replace).

Revise: `carry-overs.spec.ts` › a drag past the threshold reorders; a tap still toggles; `carry-overs.spec.ts` › moves a chip to the front and stores the new order; `carry-overs.spec.ts` › the order survives a reload, because it is stored; `drills.spec.ts` › finishing records the run and Progress shows it; `empty-states.spec.ts` › a stage with nothing on the tracks you have on says so and offers the tracks; `finder.spec.ts` › is reachable from the Skills screen, under a readable name; `first-day.spec.ts`; `guide-shots.spec.ts`; `lab.spec.ts` › ticks and starts counting once the day is read; `library.spec.ts` › waits for the title sort, then moves the window to the letter; `modes-duet.spec.ts` › the button opens one of the rung’s own pieces, with a hand chosen; `modes-duet.spec.ts` › the button still means it after the Duet row has been switched off once; `modes-rhythm-only.spec.ts`; `perf.spec.ts`; `plan.hierarchy.spec.ts` › the tracks sheet groups the ones that are off, and orders the ones that are on; `plan.spec.ts` › filters by stage; `plan.spec.ts` › lists every stage with its completion, and expands to lessons; `progress.hierarchy.spec.ts` › free play is not drawn as one of the rows, because it is not one; `tips.spec.ts`; `today.spec.ts`; `tour/tour.spec.ts`; `compositionStatus.test.ts`; `labHelp.test.ts` › gives a line to each of the controls the screen draws; `legacyStorage.test.ts`; `libraryRowRanking.test.ts` › says nothing about hands when the answer is "both"; `planHierarchy.test.ts` › draws a unit line only where a unit is more than one rung; `planHierarchy.test.ts` › gives the core path no heading — it is the stage, not a side track; `planHierarchy.test.ts` › says so on the one line that announces, when there is nothing left; `planTracksGrouped.test.ts` › groups the tracks that are off into families; `progressRanking.test.ts` › does not head the figure with the words the figure ends on; `progressRanking.test.ts` › keeps the map of the same minutes in the same block, above the goal; `progressStore.test.ts` › starts at the default goal; `session.test.ts` › adds up to the length it claims; `session.test.ts` › are the four in docs/02 Part A §8, with the stated minutes; `session.test.ts` › falls back to 30 minutes for an unknown length; `session.test.ts` › the 30 and the 60 each get three minutes of sight-reading (P12b); `todayCardRanking.test.ts` › names the rung the learner is on without printing its id; `test_technique_units.py` › test_every_rung_says_how_long_it_takes.

**Wave H, the viewport plan and the device audit:** 3 to replace or delete, 49 to revise.

Replace or delete: `score.layout.spec.ts` › ${bars} bar${bars === 1 ? '' : 's'} per window, drawn (delete); `score.spec.ts` › ${fixture} · ${bars} bar(s) · ${orientation} (delete); `tour/t30-window.spec.ts` › the drill that draws a stave (delete).

Revise: `carry-overs.spec.ts` › shows the side panel and opens at two bars; `dark-ink.spec.ts`; `doors.spec.ts` › Blind hides the score and leaves the rest of the run alone; `drills.spec.ts` › ${id}: its buttons are on the screen; `guide-shots.spec.ts`; `landscape.spec.ts`; `score.arrange-race.spec.ts`; `score.bar-targets.spec.ts`; `score.density.spec.ts`; `score.fill.spec.ts`; `score.fuzz.spec.ts`; `score.head-height.spec.ts`; `score.layout.spec.ts`; `score.renderer.fuzz.spec.ts`; `score.rotate.spec.ts`; `score.screen.spec.ts` › bars per window steps between 1 and 8 and redraws; `score.screen.spec.ts` › the zoom buttons still do something, now that the fit does the work; `score.sheet-rows.spec.ts`; `score.slide.spec.ts`; `score.slots.spec.ts`; `score.spec.ts` › bars per window changes what the window holds, or says why not; `score.spec.ts` › window layout draws only the window; `score.window-rule.spec.ts`; `setup.spec.ts` › every step is reachable, sets what it says, and Finish is remembered; `setup.spec.ts` › every step photographed, phone ${orientation}; `wide.spec.ts` › a laptop draws the bar at its natural width; a phone fills the width; `states/gallery.ts`; `states/probe.ts`; `states/score.states.spec.ts`; `tour/audit.ts`; `tour/corpus.spec.ts`; `tour/sequence.spec.ts`; `tour/shoot.ts`; `tour/t30-sheet.mjs`; `tour/t30-window.spec.ts`; `tour/t34-sheet.spec.ts`; `tour/tour.spec.ts`; `autoFit.test.ts`; `pieceExtent.test.ts` › keeps above and below as overhangs of their own, for the placement; `pieceExtent.test.ts` › rounds the quartile up, so two systems give the taller of the two; `pieceExtent.test.ts` › takes the upper quartile of the extents, not the maximum; `readAheadScale.test.ts`; `slots.test.ts`; `tablet.test.ts` › opens a tablet at four bars when the setting was never touched; `test_generator_invariants.py` › test_a_direction_is_printed_above_the_staff; `test_generator_invariants.py` › test_no_direction_is_longer_than_that_in_any_key_the_family_is_written_in; `test_generator_invariants.py` › test_no_direction_is_longer_than_the_longest_one_that_survived; `test_generator_invariants.py` › test_the_exported_musicxml_carries_the_placement; `devScore.ts`.

---

## 7. The gaps against Q6–Q11 (class add): tests to add, one line each

Names are proposals for the wave that builds the behaviour (the row's wave in brackets); each
is written against the learner-facing result, with constructed learner states or seeded
content as fixtures. **41 tests.** None of them exists today as far as these searches go:
every test file on disk was read for this inventory, and a grep of the six test folders for `skillState`, `excerpt`,
`teachingPlan`, `viewportPlan` and `targetSkills` returned no file (`observation` returned one,
`engineEarlyNote`, for an early note; `evidence` returned 22 files, every hit prose in a comment,
a docstring or a test name).

**Q6, the educational truth model (C)**
- `observationsFromRun.test.ts`: a run stores exactly what the engine measured (pitch per step, onset deltas only when timed, hands, first attempt, demonstration inside); a Wait run stores no onset or tempo observation.
- `evidenceOnlyMeasured.test.ts`: an item that demands a skill the run did not measure (evenness of tone on one velocity, tempo in Wait) yields no evidence for that skill, whatever the item's demand says.
- `evidenceTouchesNamedSkills.test.ts`: one performance changes the skills its observations bear on and leaves every other skill in the learner state identical.
- `demandIsNotAbility.test.ts`: passing an item whose material demand is high does not raise ability beyond what the observations support; failing it does not lower an unrelated skill.
- `rungStateFromEvidence.test.ts`: a rung is met only by the evidence its requirement names; a pass of an item shared with a later rung that asks more leaves the later rung unmet (L8), swept over every multi-rung item in the built curriculum.
- `recommendRespondsToEvidence.test.ts`: two constructed learners at the same stage, one failing at 60 % and one who never played, get different next cards; permuting ids or renumbering stages changes nothing (L12).
- `fallbackOrder.test.ts`: when a rung has nothing suitable, the search runs objective, skill, concept, prerequisite, context, weakness, style, level, in that order, and the reason line names the tier used (L14).
- `feedbackFromMeasurements.test.ts`: every sentence on the summary sheet cites an observation field that exists for that run; none is printed without one (L19, M3).
- `summary.diagnosis.spec.ts`: a run whose errors all fall at one transition says so on the rendered sheet and offers that passage, instead of a percentage alone (L19, L29).
- `sightReadingFromReadingState.test.ts`: the next phrase's constraints move one dimension at a time from the reading evidence, not from the stage number (S4, S13).
- `masteryLadder.test.ts`: exposure is not mastery: one pass is "practised"; "transfer" needs evidence on unfamiliar material; "retained" needs a later day (L11, L25).
- `firstThirtyDays.test.ts`: three constructed learners run day by day through the real selection code; no mastered piece offered as new, today's reading always unseen, skills rotate (AT-3, L31).

**Q7, pedagogical intent (D)**
- `test_family_presence.py`: every generator family, thousands of seeds: each exercise contains its declared target skill, read from the notation (AT-4, G3).
- `test_family_absence.py`: the same sweep: no demand beyond what the rung and its prerequisites taught (syncopation, out-of-position notes, leaps past the level, ties across the barline) (G4, S15).
- `test_family_distribution.py`: key, metre, rhythm and range distributions over the sweep match what each family declares, so "73 % in C major" fails (G22).
- `sightReadingPhraseShape.test.ts`: phrases end on a stable degree on a strong beat, stay inside the promised range, and do not oscillate between two notes (S7, S18).
- `test_musical_validator.py`: contour, cadence, range, density and repetition checks, each red on a named bad fixture and green on a named good one, run over every study family (G9, G23).
- `sightReadingRowPerRung.test.ts`: a reading row offered on a rung never exceeds what *that* rung has taught, not only the earliest rung listing it (S16).
- `test_interval_reading_unfakeable.py`: interval-reading melodies start on varied notes and positions, so reading note names cannot pass them (G7, G10).
- `test_fingering_every_family.py`: printed fingering playable in every family, extending the arpeggio, chromatic and walking-bass checks to the rest (G30).

**Q8, repertoire and excerpts (E)**
- `test_excerpt_demands.py`: an excerpt's measured demands are computed from its bar range, not inherited from the piece (R5).
- `test_needs_versus_taught.py`: for every rung, each option's measured needs are within what the rung and its prerequisites teach; replaces the band-fitting gate (R8).
- `test_features_reach_catalog.py`: the measured features reach the catalog row per dimension, and one level is derived from them in one place (R1, R2).
- `test_identity_survives.py`: composition, arrangement, artist and source edition stay distinct from quarry to catalog to the Library sheet (R15).
- `test_conversion_report.py`: a pathological fixture set (pickups, cross-bar ties, voices, graces, tuplets, repeats, endings, clef/key/time changes, pedal, empty bars, malformed files) and the conversion report naming each loss (R27, AT-5).
- `test_tempo_not_invented.py`: a source without a tempo mark converts with none, or with one labelled suggested, never a printed mark (R11, converter half).

**Q9, lessons (F)**
- `lessonExperiencesExist.test.ts`: every experience a lesson's teaching plan names is on its rung and asks what the prose says (T11).
- `lessonPassLines.test.ts`: every pass line a lesson prints equals the rung's enforced requirement (T2).
- `lessonPrerequisiteTerms.test.ts`: every term a lesson uses is introduced in it or in a prerequisite lesson (T16, AT-12).
- `lessonAbsolutes.test.ts`: absolute claims ("always", "never", "no other finger") are listed for a reader and each is either true or reworded (T4).

**Q10, the score across device states (H; B for the outcome checks already built)**
- `viewportPlan.test.ts`: the plan as a pure function of width, height and density, returning arrangement, scale and slots, one case per sheet cell (U23).
- `score.sheet-cells.spec.ts`: every sheet cell (size, orientation, density, at rest and mid-run) read on the drawn outcome: bars at natural spacing, staff over the floor as five lines, next music on the glass (U26, AT-10).
- `score.transitions.spec.ts`: rotate and resize at rest, mid-run and paused: the current system does not move, the preview is replaced, the run keeps its scale or re-fits once (U9, U25, U35).
- `score.interim-draw.spec.ts`: from opening to settled, the sheet grows at most once, observed with a watcher installed before navigation (U42).
- `score.long-piece-lookahead.spec.ts`: a piece over 48 bars upright still shows a look-ahead row (U32).
- `score.help-promise.spec.ts`: wherever the help says the next bar is always there, it is on the glass (U34).

**Q11, repertoire progression and personalisation (G)**
- `repertoireStates.test.ts`: a piece moves discover, try, learn, practise, perform, retain only on evidence, and the state survives backup and restore (R19, I2).
- `exposureBalance.test.ts`: over a simulated month, offers keep the familiar/exploratory ratio and cover each enabled style without selecting by `genres` or `tags` (I3, `noGenreSelection`).
- `reasonLineTrue.test.ts`: every offer's reason names evidence present in the learner state; a reason with nothing behind it fails (I1, R24).
- `repertoireSlotCadence.test.ts`: a mastered piece comes back about monthly, not every session (L17).
- `pieceYouKnowLabel.test.ts`: "a piece you know" labels only pieces with evidence of playing (L18).

---

## 8. What the reading turned up, for the matrix

The backlog's rule is that a task finding a new problem adds a row. This task owns only its two
files, so the rows are proposed here for the orchestrator to enter. **Verified** means the
coordinator read the lines named; **reader** means one reader reported it from the test and the
source, and nobody else has checked it.

| id | finding | evidence | sev | wave |
|---|---|---|---|---|
| N1 | The Wait-mode status line names every black key as a sharp: an E♭ in a flat key reads "Waiting for D♯4". `waitingForLine` spells through `midiToNoteName`, whose table is sharps only; `expectedNote.test.ts` "writes a sharp as a sharp" locks it in, with no flat case. Behind the *Note names* setting, off by default | verified: `app/src/ui/expectedNote.ts:27`, `app/src/midi/parseMidiMessage.ts:256`, `ScoreScreen.ts:3327` | P0 (never teach wrong) | none owns it; the fix is small (spell from the notation's own step and alter) |
| N2 | The backing-track drill's sheet says "Not passed yet" and "Accuracy 0 %" on a drill that measures no accuracy; `drills.spec.ts` asserts both. T40 fixed the same fault on the Score screen only | verified at the test's lines (`drills.spec.ts` near 150–154); the app side is inferred from a test that asserts it | P0 (truth rule) | B+ or C |
| N3 | Two screens print an internal id before a title: the lesson page's lock line (`Usually comes after ${id} ${title}`) and the folder screen's level sentence (`Stage N · ${unit.id} ${unit.title}`). `prerequisites.test.ts` and `rungFor.test.ts` enforce the format | verified: `prerequisites.ts:80`, `LessonScreen.ts:472`, `rungFor.ts:52`, `FolderScreen.ts:1111` | P2 (extends T20) | C |
| N4 | Tests that cannot fail as written: `modes-placement`'s R3 count of `btn--primary` (the class occurs under `app/` only in the spec), and, by the readers, `finder`'s id regex, `carry-overs`' chip order and its "drag past the threshold" that never drags, the URL-it-navigated-to checks, `audio.spec`, `diagnosticsMicRelease`'s negative case, `modes-rhythm-only`'s "any key answers", `drills`' "Again starts a fresh set", `pdf`'s drag order, `shelf`'s "listed apart" on an empty database | verified for `btn--primary`; reader for the rest | P2 | each in its file's wave, or now |
| N5 | The state gallery checks neither natural spacing (§9.38) nor the five-line floor (§9.37), settles on a fixed 2.5 s that its own comment says races a 1.5 s idle callback, and was last edited 2026-09-11, before T34 and T38; the corpus's next-bar check is the one `sequence` replaced after it passed a bar 400 px off the edge; the corpus allows one shrink mid-run where `08` §9.1 says one size per run | reader (T1) | P1 (the instruments H relies on) | H |
| N6 | Two numbers for the five-line floor in the tests: `score.rotate` mirrors `MIN_STAFF_PX` as 40 and `t30-sheet.mjs` states a 40 px floor, where the code and `score.window-rule` use 22 | reader (E1, T1) | P2 | H (with U33) |
| N7 | `data-measured` is set before the re-plan it is waited on for (`WindowRenderer.ts:3910`), so tests pad it with fixed waits; the page publishes no "fit settled" state | reader (E1) | P2 | H, or now as a test hook |
| N8 | Invariants that are not gates: the converter harness never runs in CI; `midiParity` skips there (references under `build/`); content tests needing the build or a gitignored edition skip because CI runs them before `build.py` | verified for `ci.yml` 55/62/78/86; reader for the skips | P2 | T (tooling), now |
| N9 | The test map has drifted: `08` line 83 says Diagnostics never releases the microphone (a test asserts it does); it credits `shelf.spec` with "a blind run is still scored" (no assertion reads a score) and `pdf.spec` with `?page=` (that test is in `shelf.spec` and asserts the URL it set); `midi.unplug`'s header says ten tests, there are nine | reader (U1, E3, E2a) | P3 | H (Q13) |
| N10 | `sessionRetention` prunes session rows by a count; once C derives skill state from stored observations, pruning deletes evidence. The retention rule needs a decision in C. Separately, its "prunes without being asked" test calls `pruneSessions()` itself | reader (U4) | P1 | C |
| N11 | Two numbers for a tap target: `04` asks at least 48 px (line 7; line 67, "48 for a button") where the tests and `00-invariants` §2's example hold 40 | verified: `docs/04-ui-spec.md` 7, 67 | P3 | X or H |
| N12 | Content rules worth an owner's look: `validate_p11`'s orphan rule fails the build for an exercise reachable only from the Library (against "rungs are curated, the Library holds depth"); the PDMX index proxy prints level 4.5 when no model is fitted, a shown level nothing measured | reader (T2) | P2 | E |
| N13 | Nothing measures evenness of tone; evenness of time exists only as steadiness on the Paper screen and the timing spread (G8 restated with the grep: `evenness`, `evenTone`, `velocityEvenness`, "even tone" under `app/src` returned nothing) | reader (U1) | P1 | C, D (G8) |
| N14 | The perfect-performance sweep never plays one hand alone, and its `KNOWN_KEYS` ledger is built to fail when two recorded content faults are fixed (a D8 in `mariage-damour.alt2`, a G♯0 in `bach-toccata`); `staffCard` spells each black key one fixed way, right for a single-note card and wrong the day a card carries a key | reader (U2) | P3 | E (the ledger), D |

---

## 9. Answers to the matrix's test rows

- **Q1** (no inventory): this document and its CSV. The tree holds 208 unit test files and 11
  helpers, 105 e2e specs and 5 helpers, 1 state spec and 3 helpers, 7 tour specs and 5 helpers,
  35 content test files and 1 helper, 1 converter test and its reference writer: 383 files.
  (The matrix's "19 state and tour specs, 45 content and converter tests" counted differently;
  these are the files on disk.)
- **Q2** (tests passing because the implementation is wrong): audited; §5, 300 rows, the worst
  five named at its head, plus N1 and N2, where the test asserts the fault itself.
- **Q3** (tests encoding assumptions about to become obsolete): §6, by wave.
- **Q5** (genuine invariants): §4, 309 files and 82 single tests in fourteen groups;
  `selectorsCacheInvariant`, which Q5 names, kept as revise until the identity cache goes.
- **Q12** (the diff-growth hook will warn on a legitimate replacement): the obsolete list gives
  each wave the files and the class to cite when the hook warns.
- **Q13** (the cleanup pass in H): the statistics above are the baseline to re-run against; the
  CSV's `wave` column says which rows H should find gone.
- **Q17** (`wide.spec`'s phone-landscape case sometimes cannot find the score screen in 60 s on
  CI): the wait that fails is `mounted(page, 'score')`, not the first draw (`waitForSheet` has
  90 s and another message). It waits on a DOM state but runs on a clock: its first 60 s wait
  swallows its own timeout, and the final `toBeVisible({ timeout: 60_000 })` is what reports.
  Before the walk, `stocked()` also swallows its 60 s wait for the service worker, so on a slow
  runner the walk can start while about 1,400 precache requests queue on the same preview
  server, and the score scene is the first load of the largest lazy chunk. **Observe, do not
  lengthen**: make the worker's claim a precondition that fails loudly (or block service workers
  for this layout spec), and wait on the lazy screen's placeholder resolving or failing, so a
  failure says which one stalled. Reader (E1), from the spec's code; not reproduced.
- **Q14–Q16** and **U42–U43**, the worked examples: each is `B done` in the CSV. Two of the
  revisions (the ⋯ sheet and the zoom buttons, both in `score.screen`) added a fixed
  `waitForTimeout(500)` after `data-measured`, which is N7's symptom; the perf, dark-ink, layout,
  `scoreControls` and `score.spec` revisions added none. `dark-ink` still reads the CSS filter,
  not the ink.

---

## 10. Method, scope and what was not done

**Files read, by suite** (each by one reader, in full, as the reader reported): unit 219
(208 tests, 11 helpers); e2e 110 (105 specs; `scoreControls.ts` and four fixtures); states 4
(1 spec, 3 helpers); tour 12 (7 specs, 5 helpers); content 36 (35 tests, `mxlutil.py`);
converter 2 (`test_converter.py`, `parity_reference.py`). **383 files, 740 rows.** Not read as
tests: `app/tests/fixtures/` and `tools/content/tests/fixtures/` (data), the snapshot PNGs, and
`__pycache__`.

**Also read**: `operating-procedure.md`, the outside audit's Parts 2–6, the matrix (every area,
area 11 in full), `08-test-map.md`, `00-invariants.md`, `plan-2026-09-25.md`, the diagnosis's
opening, and the six Wave B test revisions (`git show` of `8ec9db1`, `b0c1001`, `91ccddf`,
`1b124aa`, `eda5696`, and `c56f8c6` for `lessonClaimsAboutApp`).

**Counting conventions** are the rubric's: `n_tests` counts literal calls; `machine_literals`
counts literal numbers compared with a quantity measured at run time, spec-owned numbers
included and marked; `code_strings` counts assertions whose subject is source text or a sentence
taken from a module instead of a rendered screen (jsdom counts as rendered); `fixed_waits` counts
fixed-duration waits used as synchronisation, not fake timers and not key holds. Readers applied
them independently, so a count can differ by a few between groups where a judgement was close
(E3, for example, did not count comparisons with the viewport's edges, and counted chosen
viewport fractions). The mechanical wait count in §3 is the cross-check.

**Not done**: no test was run, so no row says a test passes; no invariant was checked against the
app; nothing was heard; no screen was opened. The classes are judgements from the text; where a
reader or the coordinator read the source to decide, the row's notes say so. The matrix
(`backlog-2026-09-25.md`) and the test map were not edited: §8's rows and §9's answers are for the
orchestrator to enter.
