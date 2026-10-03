### Entry 161 — U96a — answered means answered: the drill sheet's *Answered N of M* counts the set's cards closed as answers, a skipped card among them as the drill counts it, with how many were right left to *Accuracy*; a rhythm sheet prints no *Answered* row, because its count is taps; the placement question screen's one-filled-box check counts the app's own class and goes red when Fail is filled (the U96 review's required change and U103, `responses/c48857ca.md`) (2026-09-29)

Built on base `f6d36ee9` (origin's head at dispatch; it holds U96's merge `ee481854` and G85's `760b8f61`) in the worktree `agent-a50b601552cff1f0d`, under the brief `docs/prompts/tasks/U96a-answered-means-answered.md` (copied into this tree unchanged). Every capture is in `docs/prompts/runs/U96a/`: each run's `.txt` starts with its command and ends with `exit=<code>`, except `mutant-apply.txt`, `mutant-restore.txt` (script output; the restore's exit appended) and `git-diff-drillscreen-after-restore.txt` (the diff itself). The pictures are in `docs/prompts/pictures/u96a/`, named `<before|after>-<scene>-342x740.png`. Nothing committed, staged, stashed or checked out. **Nothing was heard**: every browser answer is a tap on the screen keys, every unit answer a screen-key event, and nothing here is music.

## Judgement

I looked at every sheet at 342 × 740, before (the committed build) and after (this tree's), and read every picture.

- **Four answered, three right** (`*-flash-four-answered-three-right-*`). Before: *Accuracy 75%*, *Answered 3 of 10*. That row said three cards were answered when four were. After: *Accuracy 75%*, *Answered 4 of 10*. The two lines now say two different things, and both are true: four of the ten were attempted, and three of those four were right.
- **A skipped card** (`*-flash-skip-right-wrong-*`: one skipped, one right, one wrong, then *End drill*). Before: *Accuracy 33%*, *Answered 1 of 10*, and *Go over the 2 you missed*. After: *Answered 3 of 10*. The skip is an answer the drill marks wrong (`PromptDrill.next`), so it is counted, as the record already counted it (`missed 7` in both runs).
- **Every card skipped** (`*-flash-every-card-skipped-*`). Before: *Accuracy 0%*, *Answered 0 of 10*, beside *Go over the 10 you missed*. The sheet said nothing was answered and ten were missed. After: *Answered 10 of 10*, which agrees with the button and with the record (`missed 0`, `wrongNotes 10`). Whether *Answered 10 of 10* reads right to a learner who pressed *Skip* ten times is **unverified as copy**: it is the drill's own count, and the heading says *Not passed yet* with *Accuracy 0%*, but "answered" for a skip is the app's word, not the learner's.
- **Rhythm** (`*-rhythm-tapped-*`). Before: *Accuracy 33%*, *Answered 2 of 6*, *Taps too many 3*. The *2* is the onsets hit; the model's own `answered` for that run was hits plus extra taps, two and three. After: the *Answered* row is gone. *Accuracy* (the onsets hit, over the pattern) and *Taps too many* stay. In jsdom, four taps on a two-onset pattern with one hit stored `wrongNotes 3` (`answered − correct`), so the model's count was four over two (`probe-compare.txt`, *rhythm-tapped*): the *Answered 4 of 2* this avoids.
- **Simon** (`*-simon-one-right-then-wrong-*`, on *Ear only*: one chain right, then a wrong note). Before: *Answered 1 of 12* (the chain). After: *Answered 2 of 12*, the two cards played, with *Longest chain 1* and the chain line unchanged.
- **The placement question screen** (`*-placement-question-*`): byte-identical before and after (the same sha256), for the record: *1 of 8*, the question, *Be strict*, a filled **Pass**, an outlined *Fail*.

**Item 3, in one line: rhythm prints no *Answered* row, answered or not, because its `answered` counts taps (the onsets hit plus every extra tap) over the pattern's onsets, and two numbers that count different things are not a fraction. Simon was moved across to item 2: the brief's premise that its attempts can pass the cap is refuted at `simon.ts` `next()` (`if (this.answers.length >= this.chain.length) return null;`, the card budget), so its `answered` is cards spent over its card budget.** That is the one deviation from the brief, taken under its §7 and recorded below. Reversing it is one condition in `statSheet`.

**U103's red line:** the corrected check against a lane-only mutant (Fail built with `variant: 'primary'`): `Error: the placement question has one filled box … Expected: 1 Received: 2` (`red-u103-mutant.txt`). The committed check, run against the same mutant, passed (`placebo-committed-check-on-mutant.txt`). That is the placebo shown.

**As a teacher would read it, as observations against the rules.** The row a learner reads as *how much of the set did I do* now says that, and *Accuracy* says how much was right. The two used to be one number printed twice, under two names. Two things on these sheets are still worth a look, and neither is U96a's:
- **Simon:** *Accuracy 8%* sits beside *Answered 2 of 12*. Simon's accuracy is the chain over the cap, not right answers over answered cards. So once the row counts cards, a learner can read 8% as a share of the two cards. Before, the two lines agreed only because *Answered* printed the chain. `04` §5c already says Simon is scored on its chain, not on an accuracy (Follow-up 3).
- **The coaching line** says *Fast, but 0% right … speed built on guessing* on a set of ten skips, and *Fast, but 33% right* on the rhythm set. It reads a mean reaction time of nought, or rhythm's mean offset, as speed (Follow-up 2).

**The mechanism.** The hypothesis was one field in one row: `statSheet` read `result.correct` where the model already carries `result.answered` (`DrillScreen.ts` 2659 at base). The discriminating tests: each adversary is red on the committed `statSheet` at exactly the right-answer count, and green after, with the record probe identical on both sides. Each kind's `result()` was read for whether its `answered` counts the set's cards and is bounded by `total`:
- `PromptDrill`: one answer per card, and a skip pushes a wrong answer (`next`, 72–82).
- `ChordDictationDrill`: one per progression scored in `next`, plus the one in flight if something was heard.
- `PedalDrill`: one per chord after the first, pushed in `next`, a chord with nothing played an unclean change. The screen never calls `next` after it returns null (the controls go with `finish`).
- `DynamicsDrill`: groups played, of two.
- `SimonDrill`: `answers.length`, capped at the chain's length by `next`, with retried misses and a skip each spending a card.
- `RhythmDrill`: `correct + this.extras` (`special.ts` 177), unbounded by the pattern.

The half-pedal result (`answered: held`, pedal readings) is built by nothing: `fromCatalog` `buildPedal` passes no `halfPedalRange`, and `halfPedalRange` appears nowhere in `app/src` outside `special.ts` (a search of `app/src`). It was left, and the comment says so.

## Done

1. **The goal (item 1).** *Answered* counts answers, *Accuracy* how many were right, and a row whose two numbers count different things is not printed.
2. **The numerator (item 2).** `statSheet` reads `result.answered` of `result.total || result.answered`. The denominator, *Accuracy* and U96's unanswered branch are unchanged. Confirmed at each `result()`, above.
   - `PromptDrill` (every prompt kind), `ChordDictationDrill`, `PedalDrill` and `DynamicsDrill`, as the brief listed.
   - **Simon added (deviation, brief §7).** The brief held that Simon's attempts can pass the cap. `SimonDrill.next` refuses a card once `answers.length >= this.chain.length`. Its own comment calls the chain's length the number of cards the game has to spend, and the running counter already prints `at of total` for Simon from the same two numbers. So *Answered* over Simon's total counts cards over cards. The brief's own rule (a kind in item 3 whose model counts the set's prompts, readable without new arithmetic: move it across, give the line) applies. The orchestrator flagged item 3 to the reviewer, so this is said first in the report.
3. **No *Answered* row where the count is not cards (item 3).** Rhythm prints none, answered or not. An unanswered rhythm set is *Not measured*, the reason, and no number. The half-pedal result is unreachable and left (said above and in the comment).
4. **Red first, unit (item 4)**, in `drillSheetsSayWhatWasMeasured.test.ts`'s harness, soft assertions, `N` read off the running counter:
   - (1) four answered, three right: `4 of N` and `75%`, and the record's `missed` N − 4, `wrongNotes` 1, `accuracy` 0.75;
   - (2) nothing answered: U96's first case, kept as it is (green on the committed code by design, and after);
   - (3) one skipped, one right, one wrong: `3 of N`, `33%`, and the record's `missed` N − 3 and `wrongNotes` 2. Then every card skipped until the set runs out: `N of N`, `0%`, *Not passed yet*, recorded by itself with `missed` 0 and `wrongNotes` N;
   - Simon, in its item-2 place: a skipped first card reads `1 of N` (record `missed` N − 1, `wrongNotes` 1), and one chain right then a skip reads `2 of N` with `data-chain` 1;
   - rhythm: no *Answered* row tapped (two taps more than the onsets) or not, with *Accuracy* and *Taps too many* still there. The harness drives rhythm: jsdom has no audio, so the count-in fails over to "your first tap starts it" (T8), as the screen's own `catch` says;
   - **the record unchanged**: a probe (`scripts-zzU96aRecordProbe.test.ts`, the same harness, run from `app/tests/unit/` and removed) kept what `keep` handed the record writer for eight cases: each adversary, both rhythm cases and both Simon cases, with a *Count this set* where the set was stopped. On the committed `DrillScreen.ts` and on the change the records are identical in every case, the duration blanked (`probe-compare.txt`, exit 0).
5. **Tests that read the old numerator, revised (item 5).**
   - `:272` `/^[01] of \d+$/` became `1 of N` (N read off the counter). It is green on the committed code too, since the one answer is right, so there `correct` and `answered` agree.
   - `:260` Simon's `['answered']` is **kept**, not made `[]`: Simon is in item 2 (the deviation, item 2). An unanswered Simon set still reads *Answered 0 of N* alone.
   - `drills-review.spec.ts:482` is **revised, not removed**: the row now reads the cards answered, `^4 of \d+$` for three chains played back and the note that broke the fourth (`chains.length + 1`). The chain stays asserted by `data-chain` above it.
   - Kept as they are: `session-run.spec.ts:223`, `backingTrackSheet.test.ts:129`, `drills.spec.ts:161`.
   - **The search, repeated on this base:** `app/tests` for `data-stat="answered"`, `'answered']`, `Answered`, `drill-stats|data-stat|dataset.stat` and `drill-summary`. Readers of the drill sheet's *Answered* row: U96's file (:220, :251, :260, :272 at base), `drills-review.spec.ts:482`, `session-run.spec.ts:223`, `backingTrackSheet.test.ts:129` and `drills.spec.ts:161`, as the brief said. `tour.spec.ts`'s scene *41-drill-result* pictures the sheet (a set answered wrong, which now reads *Answered N of N*) and asserts nothing about it; not run (Not done).
6. **U103: the placebo corrected, not removed (item 6).** `modes-placement.spec.ts` › *the question is the screen…* now asserts exactly one visible `.button--primary` in `section[data-screen="drill"]`, that it is `#drill-placement-pass`, and that `#drill-placement-fail` has `button--secondary`, with the comment saying so and naming U103.
   - On the unmutated app the count is one (the picture spec's log and `e2e-map.txt`, *ok 87*).
   - Against the mutant it is red on the count (above). The mutant was put back by sha256 (`mutant-restore.txt`: matches), and `git diff` on `DrillScreen.ts` then shows one hunk, `statSheet` and its comment (`git-diff-drillscreen-after-restore.txt`).
   - *1 of 8*, *Be strict* (:79 at base) and the spacing between the transition and *Start here* are untouched.
   - The search for the two ids, repeated (`app/tests`, `drill-placement-(pass|fail)`): the other hits click them or wait for them to be visible (`drills.spec.ts`, `first-day.spec.ts`, `placement-branches.spec.ts`, `session-run.spec.ts`, `tour.spec.ts`, U96's unit file), and none asserts their weight.
7. **The hypothesis (item 7).** It held for the numerator. For Simon it was refuted at the line, and the kind was moved (item 2). No kind in item 2 passes its `total` in a reachable run, from reading each `result()` and the screen's calls into `next`. That is *inferred from the code*, not measured over every kind in a browser.
8. **Not U96a's (item 8), untouched:** `keep()`, `drillOutcome`, `drillOutcomeOf`, `finish()`, `finishPlacement`, `sessionRunner.ts`, `help.ts` (no new words), `engine/drills/**`, and the other builders' files. `git diff --stat -- app/src` is `DrillScreen.ts` alone, 30 insertions and 8 deletions.

## Not done

- **The revised `drills-review.spec.ts:482` against the committed build.** It ran green on the change (`e2e-map.txt`, *ok 11*). It was not run on a committed bundle, because the committed bundle had been replaced by the mutant's and the change's by then. The same claim is red on the committed code at unit level (Simon, `1 of 12` expected `2 of 12`).
- **The tour** (`tests/tour/`, whose scene *41-drill-result* pictures a sheet that now reads *Answered N of N*) and `guide-shots.spec.ts`: not named by the map; not run. What they now picture is unverified.
- **768 × 1024 and sideways pictures:** not asked; not taken.
- **The unit suite's 65 content failures on a full catalogue:** not rerun. They fail with the same names on the committed source in this tree (`vitest-compare.txt`). They are in files that read the built content: `lessonClaimsAboutApp` (23, Entry 101's line-ending pair among them), `lessonClaimsAboutMusic` (29), `firstThirtyDaysOnTheLadder` (5), `everyOptionOpens` (2), and one each in `curriculumIntegrity`, `legacyStorage`, `lessonClaims`, `materialOnTheRecord`, `planNoUnobtainableRungs` and `scoreModelTempo`. This tree's offline build wrote a 1,864-item catalogue, where the main checkout's has 2,092. That the missing items cause them is *inferred* from the file names and the first messages; the full catalogue was not built here.

## Follow-ups (recorded, not fixed)

1. **For U102's lane (record truth): a rhythm set's record undercounts misses.** `missed` is `max(0, total − answered)` (`keep`), and rhythm's `answered` includes extra taps. The probe's *rhythm-tapped* case, four taps on two onsets with one hit, stores `missed 0` and `wrongNotes 3`, though one onset was missed and the three "wrong notes" are extra taps (`probe-compare.txt`). The half-pedal comment's claim that the screen prints `correct of answered` (`special.ts` 357–359) was never true: it printed `correct of total`, and now prints `answered of total`. The result is unreachable.
2. **P3 (feedback truth, coaching): *Fast, but N% right … speed built on guessing* on sets where nothing was fast.** `coach`'s `fast-and-wrong` rule reads `meanReactionMs <= FAST_MS`. A set of skips has no timed answer, so the mean is nought (*every card skipped*, before and after). Rhythm's `meanReactionMs` is its mean offset from the beat, which can be negative (*rhythm-tapped*, before and after). Both sheets tell the learner to slow down. Not U96a's (`engine/drills/coaching.ts`).
3. **P3 (sheet, Simon): *Accuracy* beside *Answered* on a Simon sheet.** Simon's accuracy is the chain over the cap (`simon.ts` `result`), so *Accuracy 8%* sits beside *Answered 2 of 12*. `04` §5c says Simon is scored on its chain, not on an accuracy, which suggests the *Accuracy* row is the line to drop on a Simon sheet. Before U96a the two agreed only because *Answered* printed the chain. Left for a sheet pass: the brief kept *Accuracy* unchanged.
4. **Observed, not classified: the keys under the Simon sheet are labelled *C1* and *C2*** (before and after; the drill is *the white keys around middle C*). Whether the strip is scrolled to its bottom octave after the game or labels the keys wrongly was not checked. If it is the second, it is a *never teach wrong* fault.
5. **Adjacent (lane scaffolding): a config copy in `app/` fails `npm run lint`,** as `entry-152.md` Follow-up 6 recorded. Lint was run with it moved aside (`lint-without-config-copy.txt`, `lint-final-without-config-copy.txt`, exit 0).

## Questions

1. **For the reviewer (the orchestrator's flagged decision, as built):** is omitting *Answered* on a rhythm sheet right, or should rhythm show its onsets as cards (for example the onsets hit plus the onsets missed, which is new arithmetic the brief ruled out)? And is Simon's move to item 2 accepted, on the card budget at `simon.ts` `next()`? The brief is not reopened by either; both are one condition in `statSheet`.

## Files

- **Changed:**
  - `app/src/ui/screens/DrillScreen.ts`: `statSheet` and its comment only;
  - `app/tests/unit/drillSheetsSayWhatWasMeasured.test.ts`: the header, the rhythm item, the helpers (`stat`, `end`, `skip`, `setSize`, `answer`, `nextCard`, `lastRecord`), the rhythm unanswered case, the revised `:272`, and the new describe block;
  - `app/tests/e2e/modes-placement.spec.ts`: the one-filled-box check and its comment (:69–77);
  - `app/tests/e2e/drills-review.spec.ts`: the *Answered* assertion and its comment (:482–484).
- **Added:**
  - `docs/prompts/tasks/U96a-answered-means-answered.md`: the brief, copied unchanged;
  - `docs/prompts/pictures/u96a/`: twelve PNGs, six scenes before and after;
  - `docs/prompts/runs/U96a/`: this entry, the captures in the table, the probe's two JSON files, and the scripts: `scripts-run.sh`, `scripts-run-e2e.sh` (checks each named spec exists and port 4543 is free), `scripts-zz-u96a-pictures.spec.ts` (copied into `app/tests/e2e/` for its two runs and removed), `scripts-zzU96aRecordProbe.test.ts` (copied into `app/tests/unit/` for its two runs and removed), `scripts-compare-probe.py`, `scripts-mutant-u103.py`, `scripts-summarise-vitest.py`, `scripts-compare-fails.py` and `scripts-sanitise.py` (machine paths in the captures replaced by `<worktree>`, `<main checkout>`, `<temp>`, `<home>`).
- **Not for the commit:** the port copy `playwright.u96a-4543.config.ts`, which serves the bundle already built, and `build/u96a/storageState-4543.json`, the fixture re-keyed to 4543. The copy ran from `app/` and now sits in `build/u96a/`, so lint on this tree is clean; copy it back to `app/` to rerun.
- **Cleaned up:** `app/dist`, `app/test-results`, the generated `app/public/content` (the tracked `audio/` kept), `app/public/icons`, `app/public/dev`, the content build's caches under `build/`, the specs' `build/staff` and `build/simon`, and the lane's temporary copies. The whole-suite log (about 1 MB) was not kept; its summary is.
- **Environment:**
  - `npm ci` exit 0;
  - `parity_reference.py` exit 0 (three MAESTRO files skipped by design);
  - `build.py --offline` exit 1 (validation, the offline libraries absent). It wrote `app/public/content` (1,864 items), which was used, not copied from the main checkout;
  - `docs/prompts/inventory.md`, `docs/prompts/rung-claims.md` and `content/scores/imported/SOURCES.md` were snapshotted before the build and restored after, and `git status` shows none of them.

## The red lines

- **Unit, the new cases on the committed `DrillScreen.ts`** (`red-unit-committed.txt`, exit 1; 7 failed, 7 passed):
  - `the right answers printed under Answered: expected '3 of 10' to be '4 of 10'`;
  - `a skip is an answer the drill marks wrong (PromptDrill.next): expected '1 of 10' to be '3 of 10'`;
  - `every card closed as an answer: expected '0 of 10' to be '10 of 10'`;
  - `the chain printed under Answered: expected '0 of 12' to be '1 of 12'`;
  - `expected '1 of 12' to be '2 of 12'`;
  - `taps printed as a count of the set: expected '1 of 2' to be undefined`, and `expected 'Not passed yetkeep goingAccuracy50%An…' not to contain 'Answered'`;
  - `a count of taps under Answered: expected [ 'answered' ] to deeply equal []`, and `expected 'Not measuredNothing was answered, so …' not to contain 'Answered'`.

  The seven that passed are U96's seven cases, the one-answer case among them with `:272` revised. The record assertions inside the red cases (`missed`, `wrongNotes`, `accuracy`) did not fail on the committed code: the record is unchanged.
- **Unit, the first draft** (`red-unit-committed-draft1.txt`): the same reds, plus a harness fault. The rhythm case waited for a status line that the piano's own failure message overwrites. It was rewritten to let the audio fail first and to rely on the heading, and rerun red.
- **U103** (`red-u103-mutant.txt`, one worker, exit 1): `Error: the placement question has one filled box … Expected: 1 Received: 2`. The committed check on the same mutant (`placebo-committed-check-on-mutant.txt`): exit 0, *1 passed*.
- **After:** `unit-fixed.txt` (the two named files, 17 passed); `probe-compare.txt` (records identical).

## Tests

| Test | Class | Old assumption | Committed | Change |
| --- | --- | --- | --- | --- |
| unit › four answered, three right | add | — | red (`3 of 10`) | green |
| unit › a skipped card … Answered 3 of N | add | — | red (`1 of 10`) | green |
| unit › every card skipped … N of N | add | — | red (`0 of 10`) | green |
| unit › Simon, a skipped first card | add | — | red (`0 of 12`) | green |
| unit › Simon, one chain right then a skip | add | — | red (`1 of 12`) | green |
| unit › rhythm tapped, no *Answered* row | add | — | red (`1 of 2` printed) | green |
| unit › rhythm unanswered, no number | add | — | red (`['answered']`) | green |
| unit › one answer (`:272`) | revise | `/^[01] of \d+$/` let the numerator be the right answers | green | green |
| unit › U96's unanswered note-flash (adversary 2) | preserve | — | green | green |
| unit › Simon unanswered, `['answered']` | preserve (the brief said revise; the Simon deviation) | — | green | green |
| unit › dynamics unanswered, `['answered']` | preserve | — | green | green |
| `drills-review.spec.ts` › Simon … ends on the note that breaks it (`:482`) | revise (the brief said remove; the Simon deviation) | the row printed the chain | not run | green |
| `modes-placement.spec.ts` › the question is the screen | revise (U103) | counted `btn--primary`, which nothing gives | green on the mutant (the placebo) | red on the mutant, green unmutated |
| `session-run.spec.ts:223`, `backingTrackSheet.test.ts:129`, `drills.spec.ts:161` | preserve | — | — | green |

| Step (file in `runs/U96a/`) | Exit | Note |
| --- | --- | --- |
| `npm-ci.txt` | 0 | — |
| `parity-reference.txt` | 0 | three MAESTRO files skipped by design |
| `content-build-offline.txt` | 1 | validation, the offline libraries absent; `app/public/content` written and used |
| `tsc-committed-src-new-tests.txt` | 0 | the committed sources build with the new tests |
| `red-unit-committed-draft1.txt`, `red-unit-committed.txt` | 1, 1 | the unit red (above) |
| `probe-record-committed.txt`, `probe-record-changed.txt`, `probe-compare.txt` | 0, 0, 0 | records identical in eight cases |
| `build-app-committed.txt` | 0 | the committed bundle, for the before pictures |
| `pictures-before.txt` | 0 | 6 passed; the sheets' rows printed in the log |
| `unit-fixed.txt` | 0 | the two named files, 17 passed |
| `mutant-apply.txt`, `build-mutant.txt` (`vite build`) | 0, 0 | — |
| `red-u103-mutant.txt` | 1 | the corrected check, red |
| `placebo-committed-check-on-mutant.txt` | 0 | the committed check, green on the same mutant |
| `mutant-restore.txt`, `git-diff-drillscreen-after-restore.txt` | 0, — | sha256 matches; one hunk, `statSheet` |
| `tsc.txt` | 0 | — |
| `lint-without-config-copy.txt` | 0 | the config copy and the picture spec moved aside |
| `build-app-changed.txt` | 0 | — |
| `pictures-after.txt` | 0 | 6 passed |
| `e2e-map.txt` (the map's seven specs, port 4543, two workers, each file checked to exist) | 1 | 99 passed, 2 failed: `drills-harmony` › harmonic dictation (the counter read `0 right` after a chord played under load) and `session-run` › the main run (the Score summary read *Run finished* after a played piece). Neither reads the drill sheet's *Answered* row |
| `e2e-map-reds-rerun.txt` | 0 | both passed alone, one worker |
| `vitest-all-summary.txt` (`npx vitest run`, the whole unit suite; the full log, about 1 MB, was not kept) | 1 | 66 failed in 11 files of 6,905 (5 skipped); 2 files never started (*Failed to start forks worker … Timeout waiting for worker to respond*) |
| `vitest-not-started-rerun.txt` (`materialLayer`, `firstContactOnTheScore`) | 0 | 61 passed, 1 todo |
| `vitest-failing-files-rerun-changed.txt` (the 11 failing files alone, on the change) | 1 | 65 failed in 10; `observationsFromRun` passed alone (its whole-suite failure was a `vi.waitFor` for the screen to start running, load) |
| `vitest-failing-files-committed-src.txt` (the same 11, `DrillScreen.ts` put back to HEAD, then the change restored by sha256) | 1 | 65 failed in 10 |
| `vitest-compare.txt` | 0 | the 65 names alone on the change and on the committed source are the same set: none is the change's |
| `checks-for-paths.txt` | 0 | the map, for the final paths |
| `tsc-final.txt`, `lint-final-without-config-copy.txt`, `unit-final.txt`, `build-app-final.txt` | 0, 0, 0, 0 | the final bytes: after the browser runs, one word was added to `statSheet`'s comment (*per dynamic played*, since `DynamicsDrill` counts the dynamics played, not the ones asked). The code is unchanged, and the bundle carries no comments; the two unit files 17 passed |

- **Unverified:** what a real phone draws (Chromium at 342 × 740, the app's font stack); CI's result on this change; whether *Answered 10 of 10* after ten skips reads right to a learner (copy); the tour's and the guide's drill pictures; the Simon keys' *C1*/*C2* (Follow-up 4). Nothing heard.

**Orchestrator's note at the landing (2026-09-29).** U96a's worktree committed by name (0685c9e2) and merged (dec467c1). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/U96a/map-min.txt`), typecheck, lint, the whole unit suite, the app build, the spec names checked, then the specs the map's minimum names on the default port (map-tests 0; map-min 0; content-build 0; content-validate 0; review-check 0; content-tests 0; vitest-all 1; build-app 0; specs-exist 0; e2e-targeted 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; `runs/U96a/orchestrator-exit.txt`). Your required change on U96 (`responses/c48857ca.md`: the Answered numerator must count answered cards; U103's placebo assertion replaced or corrected). Landed in one chain with F3a and G86 under your batching conditions: the map's minimum over the union of the three merges' paths (ee11f118 to 212891b5); tsc and lint from the content chain's steps, the unit suite red only on the recorded pair, the app build, the specs the map named for the three seams' paths (403 passed).

## Doc rows

- **`docs/04-ui-spec.md` §5c, the *Result sheet* bullet**, after U96's pending sentence group (*No answer, no number*, ending "…the session reads an unanswered set as no outcome (`drillOutcomeOf`), as before."), a new sentence group:
  "**Answered counts answers** (U96a, 2026-09-29). *Answered N of M* is the drill's own count of the set's cards closed as answers, over the set's cards. A skipped card is among them wherever the drill counts a skip as a wrong answer (every prompt kind, and Simon), which is also what the record keeps: `missed` is the set's cards less the answered ones. How many were right is *Accuracy*'s. So four answered with three right reads *Answered 4 of 10* and *Accuracy 75%*, and every card skipped reads *Answered 10 of 10*, *Accuracy 0%* and *Not passed yet*. Simon's *M* is its card budget, the chain's length, which a retried miss spends too (`SimonDrill.next`). A rhythm sheet prints no *Answered* row: its count is taps, the onsets hit and every extra tap, over the pattern's onsets, and two numbers that count different things are not a fraction. Its *Accuracy* (the onsets hit, over the pattern) and *Taps too many* say what it measured."
- **`docs/04-ui-spec.md` §5c, U96's pending sentence** "The sheet prints *Answered 0 of N* and nothing else:", inserted after *nothing else*: "(on a rhythm set, not even that: the heading and the reason; U96a)".
- **`docs/04-ui-spec.md` §5f, U96's pending bullet** *A drill set nobody answered*, appended before "(§5c)": "; a rhythm set prints no number at all (U96a)".
- **`docs/08-test-map.md`, the `modes-placement.spec.ts` line** (:295 at base), appended:
  "; the question screen's one filled box is Pass (`button--primary`), with Fail outlined (`button--secondary`). Until U96a (U103) this counted `btn--primary`, a class nothing gives, and could not fail; it is red on a mutant with Fail filled."
- **`docs/08-test-map.md`, U96's pending unit line** (`drillSheetsSayWhatWasMeasured.test.ts`), appended:
  "U96a adds the review's three adversaries. Four answered with three right reads *Answered 4 of N* and *Accuracy 75%*. Nothing answered keeps *Answered 0 of N* and no *Accuracy* (U96's case). A skipped card is answered, wrong: one skipped, one right and one wrong reads *Answered 3 of N* and *33%* with the record's `missed` N − 3, and every card skipped reads *Answered N of N*, *0%* and *Not passed yet*, recorded with `missed` 0 and `wrongNotes` N. Simon counts its cards the same way (a skipped first card is *Answered 1 of N*). A rhythm set prints no *Answered* row, tapped or not. `N` is read off the screen."
- **`docs/08-test-map.md`, the `drills-review.spec.ts` line** (:247 at base), appended: "; Simon's sheet reads *Answered* as the cards answered, the three chains and the note that broke the fourth (U96a)".
