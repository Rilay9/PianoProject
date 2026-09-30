### Entry 162 — U102: an unanswered drill set is not measured on the record either

Built on base `6cf1daff` (origin's head at dispatch: U96a and the revised brief) in the worktree `agent-a46fbdac26027e48f`, under `docs/prompts/tasks/U102-an-unanswered-set-is-not-measured.md`. Item 7(k) was read as the coordinator corrected it (the fix is on origin at `cbdb1c24`; this tree's copy still attaches the proof to the wrong bullet): a **new** row with `answered: 0` reads *not measured* unconditionally; the **legacy** note-flash row reads *not measured* only with a proof over every historical writer. The proof holds (below), so it does. Browser runs used port **4593**, the orchestrator's instruction, in place of the brief's 4637. Every capture is in `docs/prompts/runs/U102/`: each `.txt` starts with its command and ends with `exit=<code>`, except `build-committed-swap.txt` and `legacy-proof-evidence.txt` (script output). Nothing committed, staged, stashed, reset or checked out. **Nothing was heard**: every answer is a screen-key event or a tap, and nothing here is music.

## Judgement

- **Progress after a set answered not at all, at 342 × 740** (`docs/prompts/pictures/u102/`). A note-flash set ended with *End drill* before any answer, then *Count this set*, then Progress. Before (the committed bundle): the history row reads *Note flash — treble C4 to G4 · … · Drill*, and under it **0% · 0 min** (`before-progress-history-after-unanswered-342x740.png`). After: **Not measured · 0 min** (`after-…`). The drill sheet is unchanged, for the record: *Not measured*, *Nothing was answered, so there is nothing to mark.*, *Answered 0 of 10* (`before-`/`after-drill-sheet-ended-unanswered-342x740.png`). The two sheet pictures differ only inside the keyboard strip under the sheet (pixel difference bounded to y 607–671, where the keys sit a few pixels apart); U102 changes no code that draws the strip. Now the sheet and the history say one thing about one event.
- **What the record stores.**
  - The unanswered set: `accuracy: 'not measured'`, `answered: 0`, `wrongNotes: 0`, `missed` = the set's count (10 here), `passed: false`, `masterEligible: false`. It was `accuracy: 0` with no answered count (U96's probe, and R1 below).
  - A rhythm set of eight onsets, six hit, four extra taps: accuracy 0.75 (onsets hit over the pattern, unchanged), `wrongNotes` 4 (the extra taps, unchanged), **`missed` 2** (the onsets not hit; it was 0), `answered` 10 (the model's count). Three taps off the beat and no hit is a measured 0 %, `missed` 8 (it was 5).
  - One answer or more is measured exactly as before, with `answered` added; ten skips stay a measured 0 % (U96's reading).
- **The stored reading's three answers** (`app/src/data/accuracyReading.ts`, `accuracyReading`): *measured* with the accuracy; *nothing answered*; *not judged*. Its readers: Progress's `historyDetail`, the rung state's `measured` (so `meetsStandard`), and the drill's coaching history in `showCoaching`. The session's outcome reads the live half, `setMeasured`, through `drillOutcomeOf`, unchanged in behaviour. `recordRun`'s best is untouched: it already skips `not measured`.
- **The tolerance's scope**, as `git log -S` bounds it (`legacy-proof-evidence.txt`): an old row with no `answered` reads *nothing answered* only when it is `drill:note-flash` with accuracy 0 and `wrongNotes` 0. For note-flash that pair is proved equivalent to nothing answered, which is exactly `missed === total`, at every version that could have written such a row. Every other kind's old 0 % stays a measured 0 %, legacy ambiguity, never reinterpreted. No field on an older judged drill row records answers directly. Old backing-track rows read *not judged*, as the history has read them since C1; the model's accuracy is the constant 0 at every version of `BackingTrackDrill.result`.
- **Placement: a module of its own**, `app/src/data/accuracyReading.ts`, not `db.ts`. It holds a domain rule with a per-kind history, and the list of kinds that judge nothing. `DrillScreen`, `ProgressScreen`, `rungState` and `sessionRun` import that list and that rule without reaching into the store module. `db.ts` stays the schema, and it gains only the optional field. The data layer imports no screen, and `engine/drills/**` is untouched.
- **Pedagogy:** nothing here changes what is taught. The product change: a learner who stopped a set before answering no longer sees a *0%* in their history, beside a sheet that told them nothing was marked.

## Done

1. **The contract** (item 1): zero answered is stored as `accuracy: 'not measured'` beside `answered: 0`. One answer or more is measured. Progress, the rung state, the coaching history and the session read one interpretation. No `DB_VERSION` change, no upgrade, no row rewritten.
2. **Premises checked at the line** (item 2).
   - `keep()` decided on `judged` alone, and an unanswered set is judged (`drillOutcome`). The brief's line numbers sit about eight lines early at this base (`keep` at :2642 before the change); the code is as described.
   - The stored row carries no `total`, and it carries no `passed` either: `sessionRowFor` strips `passed`, `masterEligible` and `selfPassed`. The `passed: false` in U96's probe is the payload `recordRun` receives, not a stored field.
   - My own reader search found nothing beyond the brief's list. Scope: `app/src`, grep for `.accuracy`, `.missed` and `.wrongNotes` read off a row, and every file that names `SessionRow` beside `accuracy`. The only stored-`missed` reader is `rungState`'s `done`.
3. **The durable shape** (item 3).
   - `answered?: number` on `RunResult` (`progressStore.ts`) and `SessionRow` (`db.ts`), with its meaning and unit in the comment.
   - `drillRecordCounts(result, outcome)`: an exported pure mapping beside `drillOutcome`, which `keep()` spreads.
   - `accuracyReading` and `setMeasured` in the new module. `UNJUDGED_DRILL_KINDS` moved there and imported back by `DrillScreen` for `measuresARun` and `drillOutcome`.
   - The readers: `historyDetail`, `rungState.measured`, the `showCoaching` filter, `drillOutcomeOf`.
4. **Rhythm's misses at the same write** (item 4). A rhythm row's `missed` is `total − correct`. `wrongNotes` and the accuracy are unchanged. Other kinds keep `total − answered`. The adversaries: (d) eight onsets, six hit, four extra taps gives missed 2; (f) three taps off the beat and no hit gives missed 8; the screen case (more taps than onsets) gives missed = onsets − hits. No other rhythm scoring was touched.
5. **The compatibility order** (item 5), in `accuracyReading` alone:
   - (1) `answered` present on a judged drill row is authoritative;
   - (2) no older field records answers: the field inventory is in the module note;
   - (3) note-flash's invariant, proved below;
   - (4) otherwise the stored number.
   The adversaries are in the new file: a new row with `answered: 0`; `answered: 3` with accuracy 0; old 0/0 rows of seven other kinds (still 0 %); the old note-flash 0/0 row (not measured, the proof cited in the test's comment); a legacy measured failure. Backups restore rows whole (`backup.ts`, untouched), so a restored old row goes through the same function.
6. **Progress's words** (item 6): *Not measured · N min*, no `%` (`HISTORY_TEXT.notMeasured`, T40's word). *Not judged* stays for a kind that judges nothing. No new word. The one `help.ts` change is the comment on `HISTORY_TEXT.notMeasured`, widened to say it also heads an unanswered drill set. The words test stays green.
7. **Red first, unit** (item 7): `app/tests/unit/unansweredSetOnTheRecord.test.ts`, with the harness pattern copied from U96's file (not edited), and the history cases in `progressHistoryLines.test.ts`. The red lines and guards are below.
8. **The browser case and the pictures** (item 8): `progress.spec.ts` gains *a drill set ended with nothing answered and counted reads Not measured in the history, not 0% (U102)*. The pictures come from the lane-only `scripts-zz-u102-pictures.spec.ts`, copied into `app/tests/e2e/` for its two runs and removed.
9. **Tests encoding the old record** (item 9). Scope searched: `app/tests/**/*.ts`, for an exact `accuracy: 0` (or `accuracy).toBe(0)`) within ten lines of the word `drill`, and for *Not judged* anywhere.
   - Found: model-level `result.accuracy` assertions (`articulationVoicingShaping`, `drillAfterAMiss`), which are results, not records; a comment in `drills.test.ts`; and a backing track's *Not judged* in `progressHistoryLines.test.ts`, which is a kind that judges nothing.
   - Nothing encodes an unanswered judged drill row as 0 %, so nothing was revised.
   - U96a's record assertions (`drillSheetsSayWhatWasMeasured.test.ts` :372–375, :391–392, :406–407, :421) hold unchanged. Class: *preserve*.
10. **Not touched** (item 10): `statSheet`, `finish()`'s heading and note, `engine/drills/**`, `help.ts` words, `coach()`, `sessionRunner.ts`, the evidence functions, `recordRun`'s logic, `DB_VERSION`, `backup.ts`, `ScoreScreen.ts`, `LibraryScreen.ts`, and U96a's harness file.
11. **The hypothesis** (item 11) held. 7(i) is red on the committed arithmetic (R1: `expected +0 to be 'not measured'`), matching U96's probe on the committed code. Deviations, each with its reason:
    - The legacy backing-track reading moved into the one reading. The rung state now shares it, so a pre-C1 jam's constant 0 is *not judged* there too. On the shipped content this changes no rung. Scope: every `content/curriculum/*.json`, scanned for requirement `accuracy` and rung `minAccuracy`. No requirement states an accuracy of 0, and a rung's `minAccuracy` 0 means the default pass accuracy (`masteryCriteriaFor`).
    - For the same reason, case (m) needs an explicit requirement accuracy of 0 to discriminate. A 0 never met any higher bar on the committed code, so "meetsStandard is false" was already true there for any bar above 0.

## Not done

- Nothing decided is left undone.
- Not attempted (by the brief's rule, a kind without a proof keeps its legacy reading): proofs for kinds other than note-flash. Their old 0 % rows print *0%*.

## Follow-ups (recorded, not fixed)

1. **P3 (record truth): Simon's `missed` counts unspent attempts, not rounds never reached.** Evidence: `SimonDrill.next` stops at `answers.length >= chain.length`. On the ear-first rung, where a miss is retried, a game that spends four attempts on the third chain ends four chains short with `answered` equal to `total`. So the record stores `missed 0` for rounds never asked. Inferred from the model, not probed.
2. **U104's other items**, as recorded and not U102's:
   - the coaching line *Fast, but N% right … speed built on guessing* on a set of skips (mean reaction 0) and on rhythm, whose `meanReactionMs` is the offset from the beat;
   - Simon's *Accuracy* line beside *Answered*, though `04` §5c says Simon is not scored on accuracy;
   - the keys under the Simon sheet read *C1/C2*.
3. **Other kinds' legacy rows.** The same proof method (`scripts-legacy-proof.sh`) could extend the invariant to the other `PromptDrill` kinds, which share the class and the writer. It needs each kind's construction sites bounded by `git log -S`, as note-flash's were. Rhythm, dynamics, Simon, pedal and harmonic dictation have their own models, and each would need its own proof. Worth doing only if old unanswered rows of those kinds matter on the owner's device.
4. **Observed, not classified:** a set ended at once prints *0 min* (a few seconds, rounded down) on the history line, before and after.

## Questions

None. No word is needed: *Not measured* is T40's, already printed in `04` §6.

## Files

Changed:
- `app/src/data/db.ts`: `SessionRow.answered`, with its comment.
- `app/src/data/progressStore.ts`: `RunResult.answered`.
- `app/src/data/sessionRun.ts`: `drillOutcomeOf` through `setMeasured`.
- `app/src/evidence/rungState.ts`: `measured` through `accuracyReading`.
- `app/src/ui/help.ts`: one comment line.
- `app/src/ui/screens/DrillScreen.ts`: `drillRecordCounts`, `keep()`, the coaching filter, the kinds list imported.
- `app/src/ui/screens/ProgressScreen.ts`: `historyDetail`.
- `app/tests/unit/progressHistoryLines.test.ts`: one case added.
- `app/tests/e2e/progress.spec.ts`: one case added.
- `docs/01-architecture.md`, `docs/04-ui-spec.md`, `docs/08-test-map.md`: the doc rows below, applied.

Added:
- `app/src/data/accuracyReading.ts`
- `app/tests/unit/unansweredSetOnTheRecord.test.ts`
- `docs/prompts/pictures/u102/before-progress-history-after-unanswered-342x740.png`, `after-progress-history-after-unanswered-342x740.png`, `before-drill-sheet-ended-unanswered-342x740.png`, `after-drill-sheet-ended-unanswered-342x740.png`
- `docs/prompts/runs/U102/`: this entry; the captures in the table below; the scripts `scripts-run.sh`, `scripts-run-e2e.sh`, `scripts-setup.sh`, `scripts-chain.sh`, `scripts-build-committed.sh`, `scripts-compare-failing.sh`, `scripts-docs-check.sh`, `scripts-legacy-proof.sh`, `scripts-writer-history.sh`, `scripts-builder-history.sh`, `scripts-store-history.sh`, `scripts-special-history.sh`, `scripts-session-writers.sh` and `scripts-zz-u102-pictures.spec.ts`; and `legacy-proof-evidence.txt`.

Not for the commit: `build/u102/playwright.u102-4593.config.ts`, the port copy that serves a built bundle with `vite preview` on 4593; and `build/u102/storageState-4593.json`, the fixture re-keyed to 4593.

Cleaned up after the runs:
- `app/node_modules`, `app/dist`, `app/test-results` and the `tsbuildinfo` files;
- the generated `app/public/content` (the tracked `audio/` kept), `app/public/icons` and `app/public/dev`;
- the content build's caches under `build/`, and the specs' `build/simon`, `build/staff` and `build/wide`;
- the lane's temporary copies under `build/u102/`, among them the committed bundle and the whole-suite log.

Every log kept here is under 300 KB.

## The mechanism and the discriminating tests

**Mechanism.** `keep()` chose between measured and not measured on `judged` alone: `accuracy: judged ? result.accuracy : NOT_MEASURED`. An unanswered set is judged (`drillOutcome`: `answered === 0` gives `judged: true`), so the model's "no answers" accuracy, `PromptDrill.result`'s `answered > 0 ? correct / answered : 0`, went on the record as a measured 0. Every reader downstream took a number for a measurement: `historyDetail` printed it, `rungState.measured` counted it, and the coaching filter kept it. The rhythm undercount came from the same write. `missed` was `total − answered`, and a rhythm model's `answered` includes its extra taps.

**The discriminating tests**, run three ways:
- **R0**, `red-unit-committed.txt`: the committed tree, untouched, with the new tests.
- **R1**, `red-unit-committed-behaviour-extracted.txt`: the committed behaviour extracted verbatim, before the fix. `keep()`'s three lines moved into an exported `drillRecordCounts`, the kinds list moved, and a scaffold reading returned C1's `historyDetail` decision. No reader was changed. It is behaviour-identical: U96/U96a's harness file and `sessionAdaptation.test.ts` are green on it.
- **Green**, `unit-named.txt`: the change.

R0's red lines:
- `progressHistoryLines.test.ts`: `a new unanswered set: expected 'Not judged · 1 min' to be 'Not measured · 1 min'`, and `a legacy unanswered note-flash set: expected '0% · 1 min' to be 'Not measured · 1 min'`.
- The new file failed to load: `Failed to resolve import "../../src/data/accuracyReading"`. The one reading did not exist.

R1's red lines, 17 tests failed and 39 passed:

| case | red line on the committed behaviour |
| --- | --- |
| (a) note flash, none answered | `a share of nothing: expected +0 to be 'not measured'`; `expected undefined to be +0` (answered) |
| (b) four answered, three right | `expected undefined to be 4`. Only the new field is red: accuracy, wrong notes and missed are green (the guard) |
| (c) ten skipped | `expected undefined to be 10`. Only the new field; the measured 0 %, 10 wrong and 0 missed are green |
| (d) rhythm, 6 of 8 hit, 4 extra | `extra taps do not erase missed onsets: expected +0 to be 2`; `expected undefined to be 10` |
| (e) rhythm, no tap | `expected +0 to be 'not measured'`; answered undefined |
| (f) rhythm, 3 extra, no hit | `expected 5 to be 8` (missed); answered undefined |
| (g) dynamics and Simon, nothing answered | `expected +0 to be 'not measured'`, twice; answered undefined, twice |
| (i) *End drill*, *Count this set* | `a 0 % for a set nobody answered: expected +0 to be 'not measured'`; answered undefined |
| (j) loud and soft run out | `expected +0 to be 'not measured'`; answered undefined |
| four answered, through the screen | `expected undefined to be 4`. Only the new field |
| rhythm, more taps than onsets, through the screen | `extra taps do not erase missed onsets: expected +0 to be 1`; `expected undefined to be 4` |
| (k) new row by its answered count | `expected { kind: 'not judged' } to deeply equal { kind: 'nothing answered' }` |
| (k) a run about to be stored | `expected { kind: 'measured', accuracy: +0 } to deeply equal { kind: 'nothing answered' }` |
| (k) legacy note-flash 0/0 | `expected { kind: 'measured', accuracy: +0 } to deeply equal { kind: 'nothing answered' }` |
| (m) the rung state, at a bar of 0 | `a legacy unanswered note-flash row: expected true to be false` (`meetsStandard`), and `expected true to be false` (the requirement held) |
| (n) the coaching history | `only the runs that measured an accuracy: expected [ { accuracy: +0, …(1) }, …(2) ] to deeply equal [ { accuracy: +0, …(1) }, …(1) ]` (the legacy unanswered 0 was handed to the plateau rule) |
| (l) Progress's line | as in R0 |

Green by design in R1 and after (the guards):
- (h) the backing track;
- (k) the legacy measured failure, seven other kinds' legacy 0/0 rows, the four not-judged rows, and a Score-screen run at 0;
- (m) a new unanswered row at a bar of 0 (already `not measured`), a measured 0 % clearing a bar of 0 (new and legacy), and `done` unheld;
- in (l), the measured zeros and the jam.

The final test file differs from R1's in two harness lines only. `recordOf` reads `drillRecordCounts` directly: R1's version reached it through a cast, so the file could run where the export was absent. `drillRow` also drops an `as SessionRow` that lint called unnecessary. No assertion changed.

## The legacy proofs

Evidence: `legacy-proof-evidence.txt`, from `scripts-legacy-proof.sh` at HEAD `6cf1daff`, with every bound a `git log -S`/`-G` or a per-version table.

**Note-flash: proved.** An old `drill:note-flash` row with accuracy 0 and `wrongNotes` 0 was written only when no card was answered, which is exactly `missed === total`.

1. *Which code wrote such a row.*
   - The drill writer's mode template, ``mode: `drill:${result.kind}` ``, entered at `5941b644` and never changed count (`git log -S` finds that one commit).
   - No literal `drill:note-flash` exists anywhere in `app/src`'s history (`git log -S` finds none).
   - Every commit whose diff touched the string `'sessions'` shows the same session-store writers:
     - `recordRun`'s `add`;
     - the evidence patch, which rewrites only `evidence`, `evidenceDefinitions` and `evidenceRecompute`;
     - the backup restore, which puts rows written elsewhere by the same writers.
   - A row a test writes through the test hook is a test's fixture, not a learner's.
2. *What the store kept.* At all 17 versions of `progressStore.ts`, `recordRun` stored `accuracy`, `wrongNotes` and `missed` as given: explicit copies before C1, then `sessionRowFor`'s copy. Compaction swaps `steps` for `bars` only.
3. *What the writer wrote.* At all 36 versions of `DrillScreen.ts` it wrote `accuracy: result.accuracy` (behind `judged` since C1), `wrongNotes: Math.max(0, result.answered - result.correct)` and `missed: Math.max(0, result.total - result.answered)`, with `result` from `drill.result()`. The going-over arrived at `b2138f82` together with its `if (reviewing)` return before any record, so a going-over round never wrote a row.
4. *Which model a note-flash result came from.* One construction site with `kind: 'note-flash'` ever: `factories.ts` `noteFlashDrill`, entered at `4398199b`. At all ten versions of the two builders it returns `new PromptDrill({ kind: 'note-flash', … })`, and `fromCatalog`'s `'note-flash'` case calls `buildNoteFlash`.
5. *What that model counts.* At all three versions of `PromptDrill.ts`:
   - `answered = answers.length`;
   - `correct` is a filter of `answers`, with revealed cards left out since `b2138f82`, so `correct ≤ answered`;
   - `accuracy = answered > 0 ? correct / answered : 0`;
   - at most one answer per card: `next()` pushes a skipped card only when `!answeredCurrent`, `settle` runs only when `!answeredCurrent` and sets it, and neither pushes past the last card. So `answered ≤ total`.
6. *Therefore.* If `answered ≥ 1` and the accuracy is 0, then `correct = 0` and `wrongNotes = answered ≥ 1`. So accuracy 0 beside `wrongNotes` 0 means `answered = 0`, which gives `missed = total`. Conversely, `answered = 0` gives accuracy 0, `wrongNotes` 0 and `missed = total`. The reader tests the pair it can see, since `total` is not stored.

**Backing track: proved (C1's existing reading, now the rung state's too).** At all ten versions of `special.ts`, `BackingTrackDrill.result` returns `correct: 0` and `accuracy: 0`, constants. `readonly kind = 'backing-track' as const` is its one construction, and `git log -S"kind: 'backing-track'"` finds none elsewhere. Its 0 was never a measurement.

**Every other judged kind: not attempted, so legacy.** An old 0 % stays a measured 0 %. This matches the reviewer's rule: absence of wrong notes is no proof there, and nothing is manufactured.

## Tests

| test | class | old assumption |
| --- | --- | --- |
| `unansweredSetOnTheRecord.test.ts` (a), (e), (g), (i), (j), and the reading's (k) new-row, run-about-to-be-stored and legacy note-flash cases | add | an unanswered set is a measured 0 |
| (d), (f), and the screen rhythm case | add | `missed = total − answered` for rhythm too, so extra taps erased missed onsets |
| (b), (c), the four-answered screen case | add (a guard, but for the new field) | none: measured as before |
| (h); (k) legacy failure, other kinds, not judged, Score run | add (guard) | none |
| (m) the rung state at a bar of 0; (n) the coaching history | add | a stored 0 is a measurement |
| (m) a measured 0 % clears a bar of 0; `done` unheld | add (guard) | none |
| `progressHistoryLines.test.ts`, the U102 case | add | Progress printed an unanswered set as *0%*, or as *Not judged* once stored `not measured` |
| `progressHistoryLines.test.ts`, existing cases and the words test | preserve | none |
| `drillSheetsSayWhatWasMeasured.test.ts` (U96a's record assertions among them) | preserve | none |
| `sessionAdaptation.test.ts` (`drillOutcomeOf`) | preserve | none |
| `progress.spec.ts`, the U102 case | add | Progress printed an unanswered, counted set as *0%* |

## Exit codes

| capture | exit | note |
| --- | --- | --- |
| `npm-ci.txt` | 0 | |
| `parity-reference.txt` | 0 | three MAESTRO files skipped by design |
| `content-build-offline.txt` | 1 | validation, the offline libraries absent. It wrote `app/public/content` (1,974 items), which was used, not copied from the main checkout. The four generated docs were snapshotted and restored, and `git status` shows none of them |
| `red-unit-committed.txt` | 1 | R0, the red lines above |
| `red-unit-committed-behaviour-extracted.txt` | 1 | R1: 17 failed, 39 passed; U96/U96a's harness and `sessionAdaptation` green |
| `tsc.txt` | 0 | `npx tsc -b`, final bytes |
| `lint.txt` | 0 | `npm run lint`, final bytes; no port config inside `app/` |
| `unit-named.txt` | 0 | the four named files: 56 passed |
| `build-committed-swap.txt`, `build-app-committed.txt` | 0 | the committed bundle for the before pictures. The seven changed sources were set aside and the committed bytes written in their place; the build ran; the sources were restored, and all seven matched the set-aside copies by sha256 |
| `build-app-changed.txt` | 0 | `npm run build:app` on the change (the map's `build-app`) |
| `pictures-before.txt`, `pictures-after.txt` | 0, 0 | one worker, port 4593; the line text printed in each log |
| `checks-for-paths.txt` | 0 | the map over the final paths. `help.ts`'s comment brings five specs beyond the brief's list: `app-shell`, `empty-states`, `help-strip`, `landscape`, `wide` |
| `legacy-proof-evidence.txt` | 0 | the proofs' evidence |
| `unit-all-summary.txt` | 1 | the whole unit suite on the change: 61 failed, 7,032 passed, 5 skipped, 1 todo; 11 of 318 files failing. The full log (about 0.9 MB) was not kept; its summary and the failing names are. Each failure is attributed below |
| `compare-failing-swap.txt`, `vitest-failing-files-committed-src.txt`, `vitest-failing-files-rerun-changed.txt` | —, 1, 1 | the 11 failing files, on the committed source (the seven changed sources set aside and restored, sha256-identical) and again on the change. The same 58 tests fail in both, name for name, and in the whole-suite run: `lessonClaimsAboutMusic` 27, `lessonClaimsAboutApp` 20, `firstThirtyDaysOnTheLadder` 5, `everyOptionOpens` 2, and one each in `curriculumIntegrity`, `materialOnTheRecord`, `planNoUnobtainableRungs` and `scoreModelTempo`. They read the built content, and their messages name pieces this offline build lacks (*song.ragtime.joplin-entertainer has no score file*, *no catalog row song.classical.chopin-prelude-op28-7.nifc*, and more). That the missing pieces cause all 58 is inferred from those messages and the file names; the full catalogue was not built here |
| `vitest-alone-expectedNote.txt`, `vitest-alone-oneSkillState.txt`, `vitest-alone-simonTurnCue.txt` | 0, 0, 0 | the other three whole-suite failures: two 5 s timeouts, and Simon's turn cue read `correct` before it cleared. Each passes alone, and in both 11-file runs: load |
| `e2e-map.txt` | 1 | the map's 27 specs, each file checked to exist, port 4593, two workers: 310 passed, 2 failed. The new U102 case in `progress.spec.ts` passed. The two failures: `projects.spec.ts:135` (*song.classical.chopin-ballade-1 has no file identity*) and `score.screen.spec.ts:808` (a 60 s wait for the score of `song.classical.chopin-scherzo-2.nifc`, which is not in this tree's offline catalogue). Neither reads a drill record or the history line |
| `e2e-map-reds-rerun.txt`, `e2e-map-reds-committed-bundle.txt` | 1, 1 | the two failures alone at one worker, on the change and on the committed bundle: the same errors on both — the offline catalogue, not this change |

## Unverified

- What a real phone draws (Chromium at 342 × 740, the app's font stack).
- CI's result on this change.
- The owner's device: whether it holds old unanswered rows of other kinds, which still print *0%*.
- Simon's `missed` follow-up, which is inferred from the model.

Nothing was heard.

**Orchestrator's note at the landing (2026-09-29).** U102's worktree committed by name (35efb10e) and merged (a0a8039b). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/U102/map-min.txt`), typecheck, lint, the whole unit suite, the app build, the spec names checked, then the specs the map's minimum names on the default port (map-tests 0; map-min 0; tsc 0; lint 0; vitest-all 1; build-app 0; specs-exist 0; e2e-targeted 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; `runs/U102/orchestrator-exit.txt`). Your ruling that U102 is a real P2 (`responses/970fd770.md`) and your approval of the brief after the proof-dependent legacy case (`responses/questions-ecccffb7.md`). Landed in one chain with G86a (Entry 165), the reviewer's batching note allowing it: the chain's merge range 2da6b8ef..a0a8039b covers both merges, its minimum the union of both merges' map rows; the whole unit suite showed only the known CRLF pair; 459 browser cases passed over the union.

## Doc rows

Applied in this tree, as written below, on the coordinator's word (`docs/01-architecture.md`, `docs/04-ui-spec.md`, `docs/08-test-map.md`; the map over the final paths, docs included, is `checks-for-paths-with-docs.txt`, its browser list unchanged; the doc-reading unit files after, `docs-tests.txt`).

- **`docs/01-architecture.md` :260** (the `sessions` row of the stores table), after "…marked `not measured` (below)": "; since U102 a judged drill set carries `answered`, and a set with nothing answered stores its accuracy as `not measured` beside `answered: 0` — every reader takes a run's accuracy through one reading, `data/accuracyReading.ts`".
- **`docs/01-architecture.md` :308–310**, *Not measured is a value*, appended: "A drill set of a kind that judges, with nothing answered, is the same: its accuracy is `not measured`, beside `answered: 0` and its unanswered count in `missed` (U102). It was stored as 0 while its sheet said *Not measured*. Rows stored before U102 have no `answered` and are never rewritten. One reading (`accuracyReading`) reads them by the reviewer's compatibility order: the row's own `answered`, else a field that records answers (none exists), else a kind whose rows provably tell zero answers apart (note-flash alone: accuracy 0 beside wrong notes 0, proved at every writer, Entry 162), else the stored number as legacy. A rhythm row's `missed` is the onsets not hit (its `answered` counts extra taps too)."
- **`docs/04-ui-spec.md` §6** (*What a history line says*, :3602–3610), after "…*Not judged · 42 notes played · 3 min* — it printed "0%" too.": "A drill set in which nothing was answered: *Not measured · 3 min*, as its sheet heads it — it printed "0%" (U102); an older such row reads so only where its kind proves it (note-flash), and any other kind's old 0 % stays *0%*."
- **`docs/08-test-map.md`**:
  - **:24**, the *What a run leaves behind* row's last column, appended: "; since U102 an unanswered drill set stores `not measured` beside `answered: 0`, a rhythm row's `missed` is the onsets not hit, and one reading serves the history, the rung state and the coaching history (`unansweredSetOnTheRecord.test.ts`, `progressHistoryLines.test.ts`, `progress.spec.ts`)".
  - **:312**, `progress.spec.ts`, appended: "; a drill set ended with nothing answered and counted reads *Not measured* in the history, with no `%` (U102)".
  - **:556**, `progressHistoryLines.test.ts`, appended: "; a drill set with nothing answered reads *Not measured*, new rows by their answered count and a legacy note-flash row by its proven invariant, while a measured 0 %, a legacy 0 % of any other kind and a jam are unchanged (U102)".
  - **New bullet before :675** (`unmeasuredConceptsSaySo.test.ts`): "- `unansweredSetOnTheRecord.test.ts` — an unanswered drill set on the record (U102). The mapping on model results: nothing answered stores `not measured`, `answered: 0`, no wrong notes and the set's count missed; four answered with three right is measured as before; ten skips stay a measured 0 %; rhythm's misses are the onsets not hit, whatever the extra taps; dynamics and Simon with nothing answered are not measured; a backing track stays not judged. Through the screen: *End drill* then *Count this set*, and loud and soft run out, each stored as not measured; four answered carries `answered` 4; more taps than onsets keeps the missed onsets. The one reading: a new row by its answered count, a legacy note-flash 0/0 row not measured (the proof cited), other kinds' legacy 0 % kept, the not-judged kinds, a Score run at 0 measured. The readers: the rung state at a bar of 0 and `done`, and the coaching history."

**Amended at the reviewer's acceptance (2026-09-30; `responses/35efb10e.md`, APPROVE; U102 closes).** The durable truth is in the right place and the compatibility order is honoured: a judged drill with `answered: 0` reads accuracy not measured; one or more answers are measured normally, a true 0 % included; unjudged drill kinds remain not judged; rhythm miss accounting counts missed onsets independently of extra taps. `accuracyReading` is a good boundary: it centralises the stored-row interpretation without pulling screen code into the data layer, and `db.ts` gains only the optional field, not the policy. Explicit `answered` wins for new rows; note-flash alone gets the historical inference because that invariant was proved across every relevant writer version; other old 0 % drill rows stay 0 % rather than being reclassified from guesswork. Other drill kinds are not proved or reclassified now for symmetry: a legacy-kind proof is added only if the owner's real stored data holds such ambiguous rows and the distinction matters, or a later product task directly needs that historical interpretation. Both deviations are approved: the backing-track reading shared by rung state (a stored backing-track zero was never an accuracy measurement; the shipped curriculum impact is nil; the tests keeping a measured drill 0 % and an unjudged backing-track zero distinct are kept), and the explicit requirement accuracy 0 in case (m), the discriminating test. *Not measured* is the right history line for a judged set with nothing answered; the *0 min* observation (follow-up 4) is separate UI/product debt and does not reopen U102. U107 and U104's remaining items stay separate.
