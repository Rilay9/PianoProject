### Entry 210 — U125 — a note played in a busy moment is judged in its window again: the cause is U66's own hold, not U119a or U118b

Brief: `docs/prompts/tasks/U125-a-note-in-a-busy-moment-is-judged-in-its-window-again.md`. Base `90b19bee`. Port 5403 from `app/build/u125/` (kept as `scripts-pw.u125-5403.config.ts`). Every number below is this machine's Chromium.

## Judgement

**The brief's hypothesis is refuted, and so is its alternative.** `engine.spec.ts:156` drives `/#/dev/score`, and that page never loads `ScoreScreen.ts`: `DevScoreScreen` does not import it, and the route loads it only for `#/score`. With chunk hashes normalised, the head build, the head with U119a's per-render measurement disabled, the head with U118b's reserve reverted and the `53147902` tree differ only in the `ScoreScreen` chunk and in `index.css`, whose U119a rules sit inside `(orientation: landscape) and (max-height: 500px)` on `.screen--score` classes the dev page does not have (`chunks-compared.txt`). The counts agree: under the same throttling every variant fails, the `53147902` baseline included, and the baseline fails most (table below). **No variant explains it.**

**The cause is a gap in U66's stall hold** (`PracticeEngine.ts`), latent since U66 and exposed by load. After a stall, a tick held only the windows *already over at that tick*, for one tick interval measured from it. Under load the queue a stall builds is not drained by the next tick, and three kinds of window closed while a note stamped inside them was still queued (`timelines.md`, each seen on the head):
1. a window the stalled tick held, closed at a second stalled tick once the first hold had run out (C judged wrong);
2. a window that ended just after the stalled tick, closed at an unstalled tick inside what should have been the hold (D judged wrong: **the CI signature**, the first note right and the second `[62, null, false]`);
3. a held window at the tick straight after the stalled one, exactly one interval later, which is no stall by the contract and no longer inside the hold.

In each, the tick that closed the window was the overdue interval tick or a frame, which runs ahead of the queued note's message; the note then matched nothing and counted as a wrong note on top of the miss. That is the learner fault the brief names: a note played in time, judged wrong because the app was busy.

**The fix is at that mechanism and nowhere else.** The hold is now a span: from a stalled tick to one tick interval after it no window closes, the bound inclusive, and a stalled tick inside the span starts it again. The stamp-trust bound still ends every hold. No timeout was lengthened, no tolerance widened, the test is unchanged.

**The proof** (the verbatim case, `scripts-u66-throttled.generated.spec.ts`, its body copied from `engine.spec.ts:156–225` at run time; fix and head interleaved, `counts-fix-vs-head.tsv`): judged wrong in **1 of 168** runs on the fix against **28 of 168** on the head across three throttle conditions. The one left, and the two in 288 further logged runs (`counts-fix-logged.tsv`), are all notes delivered more than a second after their stamp because the 8× throttle froze the main thread for about a second: U66's stated stamp-trust limit, not this seam's.

**Product, plainly.** In Tempo mode a note played in time on a busy device is now judged in its window when its message was queued behind a stall, including the stalls that come in pairs or end a few milliseconds before a window does. **The cost:** a window can stay open up to a tick interval longer after any stall, and on a device whose every tick comes after a stall, a missed note is marked up to a second late (the stamp-trust bound) where it used to be marked within two ticks. Scoring truth over the timing of a red mark. **Unverified on a phone; nothing heard; no picture looked at** (nothing drawn changes). **Pedagogical verdict:** not applicable to the text taught; the change is to judging, and in the direction of judging a played note by when it was played.

**Technical verdict:** the cause shown by counts and by timelines, the fix red first on the head and green after, under the conditions that showed the failure. Not verified on CI: whether CI's failures had mechanism 2 is inferred from the identical signature; the next runs will say.

## The counts

All runs: the verbatim case, 8 workers, `retries: 0`, CPU throttled through the DevTools protocol. *At run*: throttled from the harness's `startRun` (the page's setup at full speed); *at start*: from before the page loads. *Judged wrong* is a failure at line 215 or after (the notes, hits, wrong notes or timing). *Precondition* is a failure at lines 213–214: the long task did not begin inside the first window, because under heavy throttling the replay's own synchronous start ran past 60 ms; the case then measures nothing, and those runs are left out of the rates. On CI the preconditions held every time (`ci-failures.md`).

**The variants**, 16× at run, two interleaved rounds of 24 each (`counts-variants.tsv`):

| variant | passed | judged wrong (C / D) | precondition | wrong, of runs whose precondition held |
| --- | --- | --- | --- | --- |
| head `90b19bee` | 27 | 12 (8 / 4) | 9 | 12 of 39 |
| head, U119a's `leftGroupIsCut` not called from `fitBarControls` | 21 | 16 (12 / 4) | 10, and 1 setup timeout | 16 of 37 |
| head, U118b's reserve back to `AWAY_PRICED_S = 86_400` | 28 | 11 (6 / 5) | 9 | 11 of 39 |
| `53147902` (`git archive` of `app/`, its vocabulary and `content/sources/opportunity-density.json`, its own `npm ci` and build) | 22 | 19 (7 / 12) | 7 | 19 of 41 |

**The fix against the head**, interleaved (`counts-fix-vs-head.tsv`):

| condition | fix: passed / wrong / precondition | head: passed / wrong (C / D) / precondition |
| --- | --- | --- |
| 16× at run, 2 × 24 | 38 / **0** / 10 | 25 / 15 (13 / 2) / 8 |
| 8× at run, 3 × 24 | 66 / **1** (D) / 5 | 60 / 6 (5 / 1) / 6 |
| 16× at start, 2 × 24 | 43 / **0** / 5 | 40 / 7 (7 / 0) / 1 |

The fix's one, and its two in `counts-fix-logged.tsv` (8× at run, timers logged, 3 × 96: 261 passed, 25 precondition, 2 wrong), were each delivered past the stamp-trust bound: D 1026 ms after its stamp; C about 1.97 s and D about 1.77 s in the other (`timelines.md`, last section). The 168-run fix line's own D failure was not logged; it is read as the same limit by analogy, unverified.

**The instrumented harness** (`scripts-u66-diag.spec.ts`, the same steps, every task logged, 8× at run) loads the page more, and separates the two builds further: the head judged a note wrong in **38 of 96** runs, 37 of them with every note delivered inside the stamp-trust bound, and in the 38th D judged wrong inside it beside a C delivered past it (`scripts-classify-diag.mjs`); the fix in **1 of 384**, a C delivered 1.4 s after its stamp.

**Exploration, before the counts** (head only, `counts-explore.tsv` and below): throttling alone at 4× and 8× from the start, 12 and 24 runs, and 20 busy processes on the machine's 20 logical processors without throttling, 24 runs: no failure. At 12× and 16× from the start the page's setup outlasted the default 5 s expect timeout; the config copy raises the test and expect timeouts (only the setup polls; the case's own assertions read values once). Throttling from the run's start produced the failure at every rate tried (4×, 6×, 8×, 12×, 16×).

**The first fix and why it grew.** The first change re-armed a held window at a second stalled tick (mechanism 1 alone): the verbatim case at 16× at run, 48 runs, 1 judged wrong (`counts-first-fix-vs-head.tsv`). In the instrumented harness (16×, throttled once the page had loaded, 48 runs) it left 4: mechanism 2 three times and one note delivered past the stamp-trust bound. The span fixed mechanism 2; its residue there (48 runs, 2 wrong) was mechanism 3 once and one note delivered at the edge of the bound. With the inclusive bound, the same 48 runs: none wrong. Every mechanism has a unit case.

## The mechanism, in the code

`PracticeEngine.ts`:
- `stallHoldUntilMs`: the clock one tick interval after the last stalled tick, set in `tick()` on every stall, reset at `start()`.
- `holdsForStall(index, pastEndMs, now)`: a window the clock has passed stays open while `now <= stallHoldUntilMs` and it has been over no longer than `STAMP_TRUST_MS`; it is marked in `heldUntil` as before, so the resume, the recount and `stop()` treat it as they did.
- `holdsTheEnd(musicMs, endMs, now)`: the end, reached inside the span, holds every open window to the span's end, and never once the end is more than `STAMP_TRUST_MS` behind (with re-arming, an unbounded end would wait for ever on a thread that never frees up).
- The `stalled` parameter left the four private methods that no longer read it.

Before, `holdsForStall` held only on a stalled tick, and a window with a hold closed at the first tick at or past `stalled tick + 25 ms`, stalled or not; `holdsTheEnd` held only on a stalled tick, and never renewed a hold.

## Tests

| test | class | old assumption |
| --- | --- | --- |
| `engineTempo.test.ts` *a second stall inside the hold holds the window again: the note queued behind both is a hit (U125)* | add | the next tick after a stall drains its queue |
| *after two stalls, a window nothing arrived for is marked missed on the first tick a tick interval after the second* | add | (the miss's timing under the new rule) |
| *a window that ends just after the stalled tick, inside its hold, waits for the note the stall queued* | add | only windows over at the stalled tick can be owed a note |
| *and with nothing queued for it, that window is missed on the first tick past the hold* | add | (the miss's timing) |
| *the tick exactly one tick interval after the stalled one is no stall and still inside the hold* | add | a tick at one interval fell due after the queued message |
| *stalls never hold a window past the stamp-trust bound* | add | (pins the cost: a thread that never frees up has its miss on the first tick past a second) |
| *a second stall before the window closes holds the end again* (the U111 short last note) | add | the end's hold is never renewed |
| the 84 existing cases of the file, the U66 block and `engineRhythmOnly.test.ts`'s U66 pair | preserve | — |
| `engine.spec.ts:156` | preserve, unchanged | — |

**Red first:** the seven new cases run against `90b19bee`'s `PracticeEngine.ts` (`git show`, swapped in and back): **7 failed, 84 passed**; with the fix, 99 passed in the two files. The browser red is the head column above.

## Exit codes

- `npx vitest run tests/unit/engineTempo.test.ts tests/unit/engineRhythmOnly.test.ts`: 0, 99 passed.
- `npx vitest run` (the whole suite): 1, 6 failed of 7605. Four are this worktree's setup, identical on the head's engine: `midiParity` (no parity reference: the fresh-worktree step `parity_reference.py` was not run), `taughtByAncestry` (`build/rung-claims.json` absent), two in `lessonClaimsAboutApp` (built content copied from the main checkout, not built at this tree). Two (`expectedNote`, `tempoSoundAgainstMark`) timed out at 5 s under the full run's load and pass alone, on the fix and on the head.
- `npx tsc -b`: 0. `npm run build:app`: 0.
- `npm run lint`: 0 (after the lane's `app/build/u125` scratch was deleted; with it present it reports the built dists and scripts, which `eslint.config.js` does not ignore).
- `engine.spec.ts`, the whole file, unthrottled, 5 repeats, 4 workers: 0, 75 passed.
- The Score screen's Tempo paths on the fix, with content copied from the main checkout: `score.latch`, `score.countin`, `score.run`, `score.rhythm-ladder`, `modes-rhythm-only`, `session-run`: 0, 38 passed.

## Not done

- **Not verified on CI or a phone.** CI's failures are matched to mechanism 2 by their signature only; no CI trace was read.
- **U119a's acceptance rows** (`score.screen.spec.ts`, sideways) not run: the brief asks for them if U119a is the cause, it is not, and `ScoreScreen.ts` and `style.css` are untouched.
- **The full browser suite** not run; CI runs it. The engine is shared by every Tempo run; the six Tempo-path specs and `engine.spec.ts` are what this seam touches in a browser.
- **The fresh-worktree setup's Python steps** (`parity_reference.py`, the content build) not run: this lane needs neither; the content for the Score-screen specs was copied read-only instead, which is where the four setup failures above come from.
- **The full CI logs** (2.3 MB each) and the per-run diagnostic JSON not kept; job ids in `ci-failures.md`, the shapes in `timelines.md`.

## Follow-ups

- **A config copy on another port loses the storage fixture.** `storageState.json` is keyed to `http://localhost:4173`; on 5403 the tour-skip and first-sight flags were not read, and the Score-screen specs failed 29 of 38 behind the first-sight card until the copy's origin was rewritten (`scripts-pw.u125-5403.config.ts`). §14 could say so for every lane on its own port.
- **The case's precondition is sensitive to throttling.** Lines 213–214 fail when the replay's synchronous start is slow; it held on CI. No change proposed.
- **U122a**: nothing here touches the Score chrome.

## Files

- `app/src/engine/PracticeEngine.ts` — the hold as a span (`stallHoldUntilMs`), inclusive, renewed by a stall, bounded by stamp trust; the U66 comment extended with U125's paragraph.
- `app/tests/unit/engineTempo.test.ts` — seven cases.
- `docs/05-score-follow-engine.md` §3 — the miss rule: a stalled tick inside the wait starts it again (2026-10-02, U125).
- `docs/08-test-map.md` — `engineTempo.test.ts`'s line.
- `docs/prompts/runs/U125/` — this entry, `ci-failures.md`, `timelines.md`, the count tables, `chunks-compared.txt`, the harness as `scripts-*`.

**Orchestrator's note at the landing (2026-10-01).** U125's worktree committed by name (6d01204b) and merged (b58c25bb). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/U125/map-min.txt`), typecheck, lint, the whole unit suite, the app build, the spec names checked, then the specs the map's minimum names on the default port (map-tests 0; map-min 0; tsc 0; lint 0; vitest-all 1; build-app 0; specs-exist 0; e2e-targeted 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; `runs/U125/orchestrator-exit.txt`). Dispatched under the reviewer's reading of the T62 working-branch read-back (`responses/9e14839e.md` section 1: `engine.spec.ts:156` is a current correctness regression of the U66 invariant, not a one-off flaky observation, so U125 is justified only as a narrow U66 regression follow-up: establish the introducing mechanism with the variant and throttling counts, fix that mechanism, and do not loosen the timing window; the U119a suspicion stays a hypothesis until the variants discriminate it). The brief's own rules (`U125-a-note-in-a-busy-moment-is-judged-in-its-window-again.md`): the hypothesis U119a's per-render `leftGroupIsCut` measurement, the alternative U118b's folded-reserve candidates, the refuting test the repeat-and-throttle counts on the head, on the head without each, and on `53147902` as the baseline, with the instruction to say no variant explains it if none does; fix the mechanism and not the test, lengthen no timeout, loosen no window; red first on the head; this lane's own port 5403 from a config copy under `app/build/u125/`; keep the fix small and local so it does not pre-empt U122a's chrome design. The brief's own stop condition was exercised: the hypothesis and its alternative were both refuted by the counts, and the fix went where the counts and the timelines pointed, into U66's hold. Base: the brief names `90b19bee`; the worktree was cut there; merged onto `99a8092f` with `docs/08-test-map.md` the only path the lane touched that changed in between. U125 landed: the engine's stall hold now spans one tick interval from the last stalled tick, so a note played in time on a busy device is judged in its window; the U119a hypothesis was refuted by variant counts, the gap pre-existing at 53147902
