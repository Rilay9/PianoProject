### Entry 203 — U118a — a hand changed mid-run: the test raced the run's start fold, and no lane's code broke the screen

Brief: debug and fix the runner-only red of CI run 36834528688 on `43e450a8`, `tests/e2e/score.run.spec.ts:248` *changing hands mid-run restarts it without a summary or a recorded run*. Base `43e450a8` (`git log -1 --format=%h` in the worktree before anything else). The lane keeps its name: the cause is neither U119's nor X45's, and it is not U118's either (below).

## Judgement

**Unverified on a device**: this is Chromium on this machine, with a mouse, on the app's own face and on the wider face (Verdana, which stands in for the runner's DejaVu Sans; DejaVu Sans is absent here). **Nothing was heard.** **Pedagogical verdict: not applicable**: nothing taught, judged or recorded changes. This lane changes one test and one test-map line; the screen is the same before and after.

**What a learner meets, before and after (the same).** Hot Cross Buns, Wait mode, right hand. ▶, then E and D played. 0.7 s after ▶ the chrome folds: the bar goes and the stage takes its row. To change hands the learner taps the sheet. That tap lands on the stage, even where Both was, and brings the bar back; it changes nothing else. The second tap, on Both, restarts the run at its first note, with no summary and nothing recorded. Observed here with a mouse at Both's own place on the folded screen: the first tap left the hand at R with the chrome open, and Both then gave both hands at step 0 (`probe-steps.txt`, the `learner` rows).

**Could a hands change mid-run hang on a phone?** Not by this mechanism, before or after. The CI hang was Playwright's. Its click waits for a target it can hit and never taps the sheet, so the bar never comes back. A finger's tap is not held back that way: it lands on the sheet, and the sheet unfolds the chrome (`ScoreScreen.ts`, the stage's click handler, `08` §9.34). A phone, and touch, were not tried.

**Technical verdict.** The test passed only while its click on Both beat a 0.7 s timer. Each time the timer won, the test failed exactly as CI did. The test now meets the screen a learner meets mid-run, folded, and presses Both the way a person does. It also asserts what its name claims and never did: the hand changed, and the run went back to its first note.

## The premise found wrong

**The brief read "not visible, enabled and stable" as a box that never settles.** The CI call log says something else. On every one of the 330 retries, Playwright found the element *visible, enabled and stable* and then refused the click: *`<div data-slot="0" … class="score-buffer is-front is-cursor">` from `<div … id="score-stage" … data-settled="true" …>` subtree intercepts pointer events* (`ci-36834528688-failure.txt`). The box was still. Something else held the point.

**Both of the brief's hypotheses are refuted.**
- **A layout loop from U118's band.**
  - In every probe run, the Both button's box held one position for 500 ms (`probe-steps.txt`, `probe-margins.txt`: "box positions 1").
  - In M1's 333 checks below, Playwright reported the box stable every time.
  - At the fold, U118's `placeSlots` writes the slot's box a few times within a few milliseconds and then stops; no slot write followed for as long as the probe watched (`probe-slot-writes-at-the-fold.txt`).
- **U119's clip moving Hands.**
  - U119's rule sits inside `@media (orientation: landscape) and (max-height: 500px)`, and the test runs at 1280 × 720.
  - There the computed `overflow-x` of `#score-bar-left` is `visible` (the probe's `barLeftOverflowX`).
  - With `style.css` as at `f11db71a` the button's box is the same, and so is the margin (below).

## The mechanism

- **The run arms the fold.** `startRun` calls `showBar(CONTROL_BAR_START_HIDE_MS)`, 700 ms, in place since `b272dce7` (2026-09-08).
- **Folded means gone.** The bar is `inert` with `pointer-events: none`. The stage took the bar's row when the run started (`[data-running='true'] .score-stage { margin-bottom: 0 }`), so its front slot is what lies under Both.
- **The test assumed the bar was still up.** Since `7f7538f9` (2026-09-08) it clicked `#score-hands-both` straight after ▶ and two key presses, with no reveal.
- **When the timer wins, nothing brings the bar back.** Playwright's click retries a hit test that fails until the test's timeout. Only a tap on the sheet unfolds the chrome, and nothing taps it. `scoreControls.ts` names this failure class: `score.rotate.spec` and the fuzz walk each spent their whole budget the same way, and `revealBar`/`pressControl` are the fix both took.

**Reproduced, three ways, on base:**
1. An 800 ms wait before the click. The chrome is folded at the attempt, the hit at the button's centre is `div.score-buffer is-front is-cursor`, and the click times out (`probe-steps.txt`, `delay800`).
2. CPU throttled ×16 through CDP, no wait. The fold comes before the click and the same failure follows (`probe-steps.txt`, `wider-cpu16` and `old-cpu16`).
3. Deterministically, as mutant M1 below. The call log matches CI's line for line: *2 ×, 2 ×, 329 × waiting for element to be visible, enabled and stable* (CI: 330, then 328 on the retry), the same intercepting slot, and the same stage attributes (`data-slots="1" data-ahead="none" data-fit="width" data-window-bars="2" data-settled="true"`) (`mutant-M1-old-click.txt`).

**The wider face alone does not reproduce it.** Unthrottled on Verdana, the click lands with the chrome open, well inside the 0.7 s (`probe-steps.txt`, `base-wider`).

**The margin is the whole story.** The margin is the start fold's due time minus the moment the Both click reaches the page (`probe-margins.txt`; every number in it is this machine's). It shrinks with the renderer's speed:
- At the throttle where the probe's duration matches this test's green durations on the runner (×4; `ci-green-history.txt`), the click arrives with about half the timer to spare.
- At twice that throttle the margin sits near zero, and both outcomes occurred across the runs.
- At four times that throttle the fold won in all four runs.

**The three lanes, reverted in turn** (wider face, ×4 and ×8, six runs each; `scripts-variant-run.sh`):
- **U118** (`ScoreScreen.ts` and `WindowRenderer.ts` as at `f11db71a`). With U118's code in, the margin is a little smaller: under a tenth of it at ×4, and near zero either way at ×8. On this path U118 adds `placeSlots()` on every `showBar`, which forces a layout on every tap of a bar control; the ones in ▶'s tap come before the timer is armed, and which work falls inside the window is not attributed to a line.
- **U119** (`style.css` as at `f11db71a`). No change beyond run-to-run noise. Its rule is not applied at this viewport.
- **X45** (`DrillScreen.ts`). Not reverted. `openRhythmCard` runs only on a rhythm drill card. `ScoreScreen.ts` does not import `DrillScreen`, and the Score route never calls it. This is inferred from the code, not measured.

**Why the runner lost on both tries on `43e450a8`, and won on the four green runs read, is not established.**
- In the failed run, this file's other seven tests ran as long as on the green runs (`ci-36834528688-failure.txt` against `ci-green-history.txt`). On the first try, 607 ran beside 608 (*Hear it reaching the end*), the same pairing as on the green runs. The runner was not slower overall.
- U118's measured cost is small against the margin at the runner-matched throttle.
- The renderer's speed inside that window on the runner could not be measured. CI uploads no Playwright trace, so the state at the click was never seen there.
- Established: the test passes only while it beats a 0.7 s timer, and every time it loses it fails as CI did.

## The fix

**The test, not the screen** (`app/tests/e2e/score.run.spec.ts`:248; class *revise*).
- **Why not the screen.** The 0.7 s start fold, the fold being unconditional, and one tap bringing the bar back are specified behaviour: `04` §5, `08` §9.20 and §9.34, and the owner's *just always fade it*, recorded at `measureBar`. Changing any of them is a product choice. The screen did what it is specified to do; the test assumed a bar the specification does not promise.
- **The premise was wrong, so the better path was taken** (`operating-procedure.md` §13). The brief said "fix the mechanism, not the test", but the mechanism is in the test.

The revised case:
- **Before the hand changes** it polls `__pianopath.scoreRun().step` to 2. The two notes were taken, so a later 0 means a restart.
- **It waits for `data-chrome="folded"`**, the state a learner is in mid-run, so it can never race the timer.
- **It presses through `pressControl('#score-hands-both')`**: a tap on the sheet, then the control, retried once if the bar folds in between. This is the helper's documented recovery, already used by `score.fuzz`, `lab`, `score.blind` and `score.head-height`.
- **It asserts:**
  - `#score-stage[data-hands="both"]`: the hand changed. The old test never asserted it.
  - `data-running="true"`.
  - `scoreRun().step` back to 0: *restarts*, which the old test's name claimed and never asserted.
  - The summary hidden.
  - No session recorded.

**Record.**
- `docs/08-test-map.md`, the `score.run.spec.ts` line: the hand change, how it is pressed, what it asserts, and why.
- The test's own comment carries the reason and the run id.

## Discriminating tests

| Case | Result | File |
| --- | --- | --- |
| **M1** (test mutant): the revised case with the old bare `click()` on Both after the fold | **red**, CI's call log line for line | `mutant-M1-old-click.txt` |
| The revised case, three times | green, 3 of 3 | `revised-248-x3.txt` |
| **M2** (app mutant): a tap on the folded sheet returns without `showBar()` | **red** in seconds (`pressControl`'s second click, 3 s timeout), the slot intercepting | `mutant-M2-folded-tap-does-nothing.txt` |
| `score.run.spec.ts`, the whole file | green, 8 of 8 | `e2e-score-run.txt` |
| Probe: the revised steps at ×16, where the old steps fail | land: both hands, step 0, the summary hidden | `probe-steps.txt` (`revised-cpu16`, `old-cpu16`) |

M1 is the red-first case: the old form fails on any machine once it meets the fold. M2 shows the revised case now guards the learner's way back. The old case, which on this machine never met the fold, would not have caught M2. Mutants were built with `vite build` and the source restored by `scripts-mutate.py`, which checks its own marker. The final dist was rebuilt with `npm run build:app`.

## Done

- The CI log read. The premise found wrong, from the log's own words.
- The CI failure reproduced on base three ways, the third deterministic and identical to CI's.
- Each lane reverted in turn where it could touch the Score screen (U118, U119), and the margin measured. X45 excluded from the code.
- The button's box and the slots' style writes recorded around the fold: no loop.
- The test revised, red first (M1), green, and the app mutant M2 killed.
- The learner's two-tap path observed in Chromium with a mouse.
- The test-map line updated.
- `npx tsc -b`, `npm run lint`, the unit suite, the map's checks for the two paths (`tools/docs/checks_for_paths.py`), and `score.run.spec.ts` whole. All browser runs used port 5341 from a config copy under `app/build/u118a/`, never 4173.

## Not done

- **A phone, and touch.** Not tried: there is no device here. *Unverified on a device.*
- **U118's window-rule and unit cases, and U119's sideways rows.** Not run. This lane changes no app code, so nothing those cases test is touched. The map names only `score.run.spec.ts` for the two paths.
- **X45 reverted.** Not done, for the reason above.
- **The runner's own conditions, exactly.** DejaVu Sans is absent here (Verdana stood in). CDP throttling slows the renderer only, not Playwright's process or a second worker. CI's two workers and one retry were not run across the whole suite: that is a run of tens of minutes, and the mechanism reproduces deterministically without it.
- **Why the runner lost on both tries on `43e450a8` and not before.** Not established (above).
- **A fresh content build.** Not run. `app/public/content` was copied read-only from the main checkout, whose build may be from another head. For the unit rerun, `build/rung-claims.json` and `build/midi-parity` were copied the same way. All three were deleted at the end.

## Follow-ups (observations, none fixed)

1. **U118's `placeSlots()` runs on every `showBar`**: one forced layout per tap of a bar control, unfolded or not. Measured here as a small cost. An observation until a device says otherwise.
2. **Siblings.** A literal scan of `app/tests/e2e/*.spec.ts` looked for a bare `page.locator('#score-…').click(` within ten lines after a bare `page.locator('#score-play').click(` (`scripts-scan_bare_clicks.py`). It found none besides this one. Clicks through variables or helpers were not covered.
3. **CI keeps no Playwright trace on failure** (`ci.yml` uploads only `content-previews`). A trace would have shown `data-chrome` at the click. This is a workflow change, so it is for the reviewer, and it stays an observation here.

## Questions

None.

## Files

- `app/tests/e2e/score.run.spec.ts`: the revised case, and `pressControl` imported.
- `docs/08-test-map.md`: the `score.run.spec.ts` line.
- `docs/prompts/runs/U118a/`:
  - this entry;
  - the CI excerpt and the green history;
  - the probe's records (`probe-raw.txt`) and their summaries;
  - the mutants and the chain's outputs;
  - every script used (`scripts-*`), with machine paths replaced.

## Tests, by class

| Test | Class | The old assumption |
| --- | --- | --- |
| `score.run.spec.ts`:248 *changing hands mid-run restarts it …* | **revise** | The control bar is still up when Both is clicked straight after ▶ and two notes. It is, only while the click beats the run's 0.7 s start fold. Also never asserted: that the hand changed, and that the run restarted. |

## Exit codes

| Check | Exit | Note |
| --- | --- | --- |
| `npx tsc -b` (after the edit; again on the final tree) | 0, 0 | `tsc.txt` |
| `npm run lint` | 0 | `lint.txt` |
| `npx vitest run` (whole suite) | 1 | 4 failures, none reading a changed path. 2 are `lessonClaimsAboutApp`'s recorded line-ending assertions (Entry 101's diagnosis; U118's chain records them failing here and passing on the runner). `midiParity` and `taughtByAncestry` lacked setup inputs (`build/midi-parity`, `build/rung-claims.json`). Rerun with those copied read-only from the main checkout: both pass, and only the line-ending pair fails (`unit-all-summary.txt`, `unit-three-rerun.txt`). |
| `npm run build:app` | 0 | `build-app.txt` |
| `python tools/docs/record_mirrors.py --check` | 0 | the map's `record-mirrors` check run in its non-writing form (`record-mirrors.txt`) |
| `test_record_mirrors` (content-tests) | 0 | `content-tests.txt` |
| `playwright … score.run.spec.ts` (port 5341) | 0 | 8 passed |
| `playwright … score.run.spec.ts:248 --repeat-each=3` | 0 | 3 passed |
| M1 | 1 | expected red |
| M2 | 1 | expected red |

`git status --short` at the end:

```
 M app/tests/e2e/score.run.spec.ts
 M docs/08-test-map.md
?? docs/prompts/runs/U118a/
```

Base: `43e450a8`.
