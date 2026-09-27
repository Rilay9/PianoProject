### Entry 87 — H0: suite reliability, test and harness only — the late Tempo run timed on a clock the test holds (Playwright's in the browser, the engine's injected one in a new unit case) with every assertion kept; the sixty-phrase triplet cases given their own budget; the MIDI screen waited for by its mount, the Library by its count line, the density case by the fit's `data-settled`; each old mechanism shown red first, on the engine clock, by an injected stall, or on a page slowed through the DevTools protocol (2026-09-27)

**Judgement.** Nothing about the product changed: no file under `app/src`, no content, no generator, no `docs/08`. Six test and harness files changed, listed under Files. Of the six load-only cases, four have a mechanism shown red and then green by a discriminating test. Two have their failure message explained, but the machine-load version could not be reproduced here:

1. **Q39, `engine.spec.ts` "a late run yields the expected timing statistics": proven.** The replayed notes are *stamped* on the script's schedule (`base + atMs`) but *delivered* by `setTimeout`. The harness ticks the engine from its own 16 ms timer and frame loop. If the page stalls past a window's close (150 ms tolerance, 100 ms late), the tick comes off the queue first and closes the window as a miss. The note then arrives, still stamped inside the window, and is judged wrong: `hits` 1, CI's "expected 2".
   - On the engine's injected clock the same run gives 2 hits when delivered on time, 1 hit when the tick precedes a delivery delayed to 400 ms, and 2 hits when the stall ends inside the window at 140 ms (`red-q39-engine-clock-probe.txt`).
   - In the browser, the committed case's own assertions fail 3 of 3 with "Expected: 2, Received: 1" when the page's main thread is kept busy for 400 ms from about 90 ms after the replay connects. They pass 3 of 3 without the stall (`red-q39-browser-probe.txt`).
   - The browser case now runs on Playwright's clock: installed before the page loads, left running for the load, then paused and run forward through the replay, so every timer fires in its due order. **Its five assertions are unchanged.**
   - A new unit case runs the same run (the fixture's model, 130 %, 150 ms, a real `ReplaySource`, the harness's restart-then-connect) on the engine's `FakeClock`. It asserts the statistic exactly: both notes attributed, the mean the stamps give, 100 % late, 0 % early.
2. **Q37, `sightReadingPromises` "levels 6 and 7 …" (two cases): proven.** Each case generates and parses sixty eight-bar phrases.
   - Alone, the cases took 0.64–0.84 s, 6 of 6 green.
   - Beside two full unit runs, they took 11.2–13.5 s and timed out at vitest's 5 s: 8 of 10 case-runs failed (`q37-load-committed-file-1..3.txt`, `q37-load-generator-L1/L2.txt`).
   - With a 60 s budget owned by the two cases, and the reason at the case: 16 of 16 case-runs green under the same kinds of load, at 3.1–15.0 s where timed (the file lists are in the table).
3. **Q34, `score.density.spec.ts` 900 px: proven on a slowed page.** The C6 chain's message was "Test timeout of 30000ms exceeded" while it waited for `[data-screen="score"]`. The case's own waits say 60 s, but Playwright's default 30 s test timeout cuts them short. On a page throttled 32 times the committed flow failed 3 of 3 the same way; the revised flow passed 3 of 3, at 55–66 s (`red-arrivals-throttle32.txt`).
   - The fixed `waitForTimeout(2_500)` is now a wait on `.score-view[data-settled]`, the renderer's T41 mark.
   - The probe shows why the sleep was a guess (`probe-throttle.txt`). In the page, the fit settled 2.96 s, 7.6 s and 3.0 s after `data-mode` at 8×, 16× and 32×, which is past the 2.5 s sleep. The committed case read after settling only because the test saw `data-mode` late.
4. **Q44, `midi.spec.ts` "the pinned input survives a reload": proven on a slowed page.** The C7 chain's message was `.screen h1` "MIDI" not found in 5000 ms, the expect default used as a boot budget. At 32× the committed flow failed 2 of 3, once with that exact message and once on the 30 s test timeout.
   - The revised flow waits for the screen's `data-screen` mount, with the test's own budget. It passed 10 of 10 at 32× (5 reload, 5 unsupported) once the reload case owned 60 s for its two cold boots.
   - Before that budget, one run in three ran out at 30 s with the page already right. Its page snapshot, read at the time, showed "2 inputs" and "Other device" checked; later runs cleared that `test-results/` folder.
5. **Q44, `midi.spec.ts` "an unsupported browser says so …": mechanism shared with 4, not reproduced for this case.** The committed flow passed 3 of 3 even at 32×. It goes through the same arrival helper, so it gets the same revised wait. No second mechanism was found for its one failure when run alone.
6. **Q44 with Q34, `doors.spec.ts` "Duet opens with a hand chosen …": not reproduced, and slowness alone does not fit.** The C7 chain saw no Library row for a whole minute. Here the first row arrived:
   - 0.18–0.24 s after `goto` on a quiet machine;
   - 1.0–1.6 s beside two full unit runs, with no difference between the service worker allowed and blocked;
   - 6.8 s on a page slowed 32 times.

   So a failed load, a stall, or a network cause is as likely as slowness. The list has no `data-settled`, and none was added: the count line ("Loading your library…" until `draw` writes "N of M items") is the list's own published drawn state, and the status line names a failed read. The shared `findRow` now waits for either, so a failed load fails in the screen's own words at once, not as a missing row a minute later. The 60 s budget is unchanged. This tells the next occurrence apart. It does not claim to prevent it.

**The product was not looked at the way a learner meets it, and there was nothing to look at:** no screen, sound or sentence changed. As a teacher's reading, nothing here touches the music.

One product-side observation, not acted on (Follow-ups): the engine judges a Tempo note against a window that its own tick may already have closed while the note waited behind a long task. On a phone, a render stall longer than the note's remaining tolerance would mark an in-time note wrong and its slot missed. This was reasoned from the code and shown only on the engine clock and in a test page. It is unverified on a device.

## The mechanism, and the test that told it from the alternatives

**Q39.**
- *Hypothesis:* the count depends on the order of the harness's tick and the replay's delivery timer. The alternatives:
  - the stamps are wrong: the stamps were identical in every run of the probe;
  - background-timer throttling: the config's launch flags turn it off, and the stall was injected directly;
  - the run's zero and the script's zero apart: the harness restarts the run as the source connects, and the probe's clock runs show both at one instant.
- *Discriminating test:* the same run with and without a stall that crosses the window's close, on the engine clock (`h0-probe-q39.test.ts`) and in the browser on real timers and on Playwright's clock (`h0-probe-q39.spec.ts`). Only the order changed, and only the order changed the count.
- *Change:* the clock, not the tolerance. The browser case keeps `toleranceMs: 150` and every assertion.

**Q37.**
- *Hypothesis:* uniform CPU cost scaled by the machine's load. The alternative is a seed that is slow or hangs: alone, all sixty seeds ran in under a second, and the loaded durations scale with load and nothing else.
- *Change:* a local `{ timeout }` on the two cases, with the reason at the case. There is no global `testTimeout`, and the other cases in the file are untouched.

**Q34 (density) and Q44 (MIDI).**
- *Hypothesis:* the arrival comes later than a fixed budget on a slow page: the 5 s expect default for the MIDI heading, and the 30 s test default under the density case's 60 s waits.
- *Discriminating test:* the committed and revised flows copied verbatim side by side, on a page whose CPU is throttled through the DevTools protocol (`Emulation.setCPUThrottlingRate`, as `mic.spec.ts` does). Machine load could not reproduce these: beside two full unit runs every old case passed 5 of 5 (`pw-old-vs-new-load.txt`). A throttled page is a reproducible stand-in for it.
- *The mount is settled, not only present.* In every throttled run, at 1×, 8×, 16× and 32×, the MIDI screen's Connect button was already disabled, the error box already said so and the keyboard strip was already visible at the moment `data-screen="midi"` appeared (`atMount` in `probe-throttle.txt`). This is what the code says: `MidiScreen` builds everything in one synchronous call before the shell mounts it.

**The Duet door.** No reproduction, so no mechanism is claimed. The one experiment that could have told slowness from failure was the chain's own trace, and it is gone (it was written to the main checkout's `test-results/`, since cleared).

## Done

1. **`engineTempo.test.ts`: added** "Tempo mode — the harness's late replay, on the engine's clock (Q39)".
   - It runs the golden Tempo-change model (the extractor's pinned output) at 130 %, with 150 ms tolerance and no count-in.
   - The run is started, aged 250 ms, then restarted as a real `ReplaySource` connects. The source's `schedule`, `cancel` and `now` are the engine's `FakeClock`.
   - Each message is delivered at its due time, with a tick every 16 ms in between.
   - It asserts: the second step at 1000/1.3 ms; hits 2, missed 0, wrong 0; `timing.n` 2; mean equal to (100 + (869 − step 1)) / 2; late 100; early 0; each note on its own step, with deltas 100 and 869 − step 1.
2. **`engine.spec.ts` "a late run yields the expected timing statistics": revised, the clock only.**
   - `page.clock.install()` before `openDevScore`, then `pauseAt(now + 1 s)` after the fixture loads.
   - The replay is dispatched, and the test waits for the second `started` event, which is the restart that makes the run's zero the script's.
   - `runFor(869 + 250 + 16)` runs to the replay's own end.
   - The five assertions are the committed ones, word for word.
3. **`sightReadingPromises.test.ts` levels 6 and 7: revised, timeout only.** `SIXTY_PHRASES_MS = 60_000` is on those two `it`s, with the reason above it.
4. **`midi.spec.ts`: revised.**
   - `openMidiScreen` waits for `[data-screen="midi"]` (`BOOT_MS`, the test's own 30 s), then asserts the heading.
   - The reload case waits for the same mark after `page.reload()`, and owns `test.setTimeout(2 * BOOT_MS)` for its two cold boots, with the reason at the case.
   - Every case using `openMidiScreen` now waits this way.
5. **`doors.spec.ts`: revised.** `findRow` waits for `libraryDrawn`: the count line's drawn state, or the status line's failed-load sentence, which then fails at once in those words. The budget is still 60 s. The `Open as…` cases share the helper.
6. **`score.density.spec.ts`: revised.** `drawn()` waits for `.score-view[data-settled]` in place of `waitForTimeout(2_500)`. The file's four cases own `test.describe.configure({ timeout: 120_000 })`, with the reason above it.
7. **The engine's injected clock** is used where the engine allows it (the unit case). The browser case cannot inject into `DevScoreScreen`'s `new PracticeEngine(model, options)` without a product change, so it fakes the page's timers instead, which is the same clock as far as the engine can tell.
8. **No test-hook attribute was added to any screen.** The MIDI screen's `data-screen` and the Library's `#library-count` and `#library-status` already publish the states needed.

## The red lines

All captured beside this entry.

- **`red-q39-engine-clock-probe.txt`** (`h0-probe-q39.test.ts`, run once from `tests/unit` and removed): `expect(score.hits).toBe(2)` → "expected 1 to be 2" for the stall 90 → 400 ms; green on time and for the stall 90 → 140 ms. The failing run's notes: `{midi 60, stepIndex null, ok false}`, `{midi 62, stepIndex 1, ok true, deltaMs 99.77}`.
- **`red-q39-browser-probe.txt`** (`h0-probe-q39.spec.ts`, 3 repetitions each):
  - `wall` 3/3 green;
  - `wall-stalled` 3/3 red "Expected: 2 / Received: 1";
  - `clock` 3/3 green, with deltas exactly 100 and 99.769;
  - `clock-stalled` 3/3 red "Received: 1", which shows the unchanged assertions still catch the mis-scoring on the new clock.
- **`q37-load-committed-file-1.txt`, `-2.txt`**: both triplet cases "Test timed out in 5000ms", at 12.5/13.5 s and 11.2/11.6 s. **`q37-load-generator-L1.txt`, `-L2.txt`**: the same two cases fail inside both full runs.
- **`red-arrivals-throttle32.txt`** (`h0-probe-redgreen.spec.ts`, 32×, 3 repetitions):
  - committed density: 3/3 "Test timeout of 30000ms exceeded";
  - committed reload: 2/3 (`.screen h1` / "MIDI" / Timeout 5000ms / element(s) not found; and a test timeout);
  - committed unsupported: 3/3 green;
  - revised density: 3/3 green;
  - revised reload before its budget: 2/3, with the page right when time ran out.

  **`green-midi-throttle32.txt`**: the revised MIDI flows with the budget, 10/10 green.
- The engine unit case cannot be red on the committed tree: it asserts what the engine already does on its own clock, and the probe is its red line.

## Tests touched

| Test | Class | Old assumption | Now |
| --- | --- | --- | --- |
| `engineTempo.test.ts` › "the harness's late replay, on the engine's clock (Q39)" › "a run 100 ms late on both notes: two hits, both late, and the mean is the stamps' own" | add | — | the browser case's run on the injected clock, the statistic exact |
| `engine.spec.ts` › Tempo mode end to end › "a late run yields the expected timing statistics" | revise (clock only) | each replayed note is delivered before the harness's next tick passes its window | the run on Playwright's clock, timers in due order; assertions unchanged |
| `sightReadingPromises.test.ts` › "levels 6 and 7 write a rest inside a triplet as a triplet rest" › level 6, level 7 | revise (timeout only) | sixty phrases fit vitest's 5 s on any machine | a 60 s budget owned by the two cases, reason at the case |
| `midi.spec.ts` › every case through `openMidiScreen` (10 mocked-device cases, the reload case, 3 error-state cases) | revise (arrival wait) | the shell mounts within the 5 s expect default | waits for `data-screen="midi"`, the whole screen at once, within the test's budget |
| `midi.spec.ts` › "the pinned input survives a reload" | revise (wait and timeout) | the click after `reload()` finds a mounted screen; one cold boot's budget covers two | the mount waited for after the reload; 60 s for two boots |
| `midi.spec.ts` › Diagnostics screen (6 cases) | preserve, untouched | — | same 5 s arrival shape on `.screen h1` "Diagnostics" (Follow-ups) |
| `doors.spec.ts` › `findRow` users: "the four modes …", "Rhythm only …", "and any other choice …", "Duet opens …", "Blind hides …", "the control is only on rows …" | revise (wait) | a visible first row is the only sign the list is drawn, and a missing one says nothing | the count line's drawn state or the load failure's sentence; 60 s unchanged |
| `doors.spec.ts` › every other case | preserve, untouched | — | green in the file run |
| `score.density.spec.ts` › phone, 900 px, 1512 px | revise (wait and timeout) | the fit and the probe land within 2.5 s of `data-mode`; 30 s covers a cold engraving | `data-settled`; 120 s for the file |
| `score.density.spec.ts` › "a narrow system on a phone is centred, not pinned left" | revise (timeout only) | — | 120 s; skipped by its own precondition in the file run, as its code allows |

## Every case: the old wait or measure, the new one, the reason, and the counts

Counts are case-runs: green over run. "Load" means beside two full `npx vitest run`s on the same machine. The browser runs are two workers, on port 4183, against this worktree's build.

| Case | Old | New | Reason | Quiet, repeated | Under load | Discriminating |
| --- | --- | --- | --- | --- | --- | --- |
| Q39 `engine.spec` late run | real page timers | Playwright's clock, run in due order; the same 5 assertions | the count depends on tick versus delivery order | old 3/3 (probe `wall`); new 5/5 (`run-pw-touched-repeat5.txt`) plus 1 file run | old 5/5, new 5/5 (`pw-old-vs-new-load.txt`) | injected stall: old 3/3 red, clock 3/3 green, clock stalled 3/3 red |
| Q39 unit (new) | — | engine `FakeClock`, `ReplaySource` on it | the statistic exact where the clock is the test's | 1/1 (file run), 1/1 final full run | 3/3 file runs, 5/5 full runs | probe: on time green, stall red, stall inside window green |
| Q37 level 6 and level 7 | vitest's 5 s | 60 s, owned by the two cases | same work; the machine's share of a processor changes | old 6/6 (3 runs, 0.64–0.84 s); new 2/2 final full run | old 2/10 case-runs green; new 16/16 green | durations: 11.2–13.5 s under load against 5 s |
| Q44 MIDI reload | `.screen h1` in 5 s; after the reload, the click's own wait | `data-screen="midi"` within 30 s, before and after the reload; 60 s case budget | the arrival is a cold boot, not an assertion | new 5/5 plus 1 file run | old 5/5, new 5/5 | 32×: old 1/3 green; new 10/10 counting the unsupported case (5/5 reload) |
| Q44 MIDI unsupported | `.screen h1` in 5 s | `data-screen="midi"` within 30 s | as above; the mount carries its error state | new 5/5 plus 1 file run | old 5/5, new 5/5 | 32×: old 3/3 green (not reproduced); new 5/5 plus 3/3 |
| Q44 Duet door | first `#library-list .list-row` visible in 60 s | the count line drawn, or the load failure said; 60 s | the list's own published state; a failure names itself | new 5/5 plus 1 file run | old 5/5, new 5/5 | not reproduced: first row at 0.18–0.24 s quiet, 1.0–1.6 s loaded (service worker on or off), 6.8 s at 32× |
| Q34 density 900 px | 60 s waits inside a 30 s test, then `waitForTimeout(2_500)` | `data-settled`; 120 s for the file | the fit's own done-state; a cold engraving's real cost | new 5/5 plus 1 file run | old 5/5, new 5/5 | 32×: old 0/3 (test timeout), new 3/3; in-page mode→settled past 2.5 s at 8×, 16×, 32× |

## Checks (unpiped; exit codes read)

From `app/`, in the worktree:

- **`npm ci`: exit 0** (`run-npm-ci.txt`). `node_modules` was absent.
- **Content** (an input to both suites; this worktree had none): `python tools/content/build.py --offline`, **exit 0** (`run-content-build.txt`): 2061 catalog items; 1176 generated; "content validation OK".
  - This was done as Entry 85 did it. The main checkout's `kern` and `musetrainer` libraries were copied in without their version-control folders (`copy_imports.py`, `copy-imports.txt`).
  - The conversion cache was copied in too, 3529 complete pairs, with `convert.py` and `abc_tools.py` sha256-identical in both trees (`copy_convert_cache.py`, `copy-convert-cache.txt`).
  - `content/scores/imported/SOURCES.md`, which the offline fetch rewrites, was restored to the checkout's bytes. `git status` lists only the six test files.
- **`npx tsc -b`: exit 0** (`run-tsc.txt`).
- **`npm run lint`: exit 0** (`run-lint.txt`).
- **`npx vitest run`: exit 1.** 4 failed, 5,978 passed and 2 skipped of 5,984, in 259 files (`run-vitest.txt`, 954 s). None of the four is a file this change touches:
  - `lessonClaimsAboutApp.test.ts` › *blues.3 …* and › *4.7 …*: Entry 85's diagnosis, the CRLF checkout. It is the same two tests and the same `expected false to be true`, and they read `ScoreScreen.ts` and `style.css`. This entry did not re-run Entry 85's discriminating check.
  - `expectedNote.test.ts` › *every black key in every fixture …* and `sightReading.test.ts` › *levels 5-7 … lands the right hand on a chord tone …*: "Test timed out in 5000ms". This is Q37's shape in files not in this brief (Follow-ups).
  - `sightReadingPromises.test.ts` (51) and `engineTempo.test.ts` (66) passed.
- **`npm run build:app`: exit 0** (`run-build-app.txt`), with no preview running. Precache: 2192 entries, 22.7 MB. No file under `app/src` changed afterwards; only tests did.
- **Preview:** `npx vite preview --port 4183 --strictPort`, started by hand from this worktree (`preview-4183.log`).
- **Playwright:** one config at a time, two workers.
  - The default config pins port 4173, so every run used `playwright.h0-4183.config.ts` beside this entry. It changes the port in `baseURL` and `webServer.url`, and changes `storageState` to the same file with its origin's port changed (`storageState-4183.json`). Without that, localStorage is keyed to the origin, and every test would open on the first-launch tour.
  - Its `webServer` serves and never builds. `testDir`, `outputDir` and `cwd` are absolute because the file lives outside `app/`. Everything else is the default config's.
  - A `package.json` with `"type": "module"` sits beside it: without it the config loaded as CommonJS, and `mic.spec.ts`'s ESM import of `fixtures/chromium` failed at collection. That only mattered for the full run; the filtered runs before it never loaded `mic.spec.ts`.
  - The four touched spec files in full: **exit 0**, 59 passed, 1 skipped (`run-pw-touched-files.txt`). The skip is the narrow-system case's own `test.skip(spare <= 0.25)`.
  - The five touched browser cases × 5: **exit 0**, 25 passed (`run-pw-touched-repeat5.txt`).
  - **The full default configuration, once, on this build: see below.**

**The full default configuration, once, two workers, this build, port 4183: exit 1.** 773 passed, 20 failed, 7 skipped, 800 tests, 38.8 min (`run-pw-full-default.txt`). **None of the 20 is in a file this change touches**, and every case in the four touched spec files passed inside it, apart from the narrow-system case's own skip. The 20, each classified from its message (`failure_reasons.py`):

- **15 are missing local screenshot baselines:** `score.spec.ts` (12) and `score.layout.spec.ts` (3), "A snapshot doesn't exist at … -win32.png". A fresh worktree has none: they are gitignored, and only the Linux references are committed. Playwright wrote them and failed, as it always does the first time. The written files were then deleted from the worktree.
- **1 is a port artefact:** `audio.spec.ts` expects the literal `http://localhost:4173/…` and received `…4183…`.
- **4 are timing, in untouched files, and they also failed when rerun on their own** (`run-pw-full-failures-rerun.txt` at two workers, `run-pw-three-alone.txt` at one):
  - `offline.spec.ts:53`: "Checking…", not "Currently offline", in 30 s;
  - `perf.spec.ts:151`: the 780-bar score's first window at 84 s, then 77 s and 42.7 s alone, against a 60 s budget. The last passed;
  - `score.window-rule.spec.ts:794`: "the run never got past the first window";
  - `wide.spec.ts:582`: test timeout.

  **The machine had slowed.** The C7 chain passed all four at 10–20 s each (perf's first window in 17.9 s). By the end of this session the same machine, idle by its own processor-load reading (2–3 %), ran the triplet cases alone in 2.9 and 3.8 s, against 0.64–0.84 s at the start (`q37-alone-new-late.txt`). That is a machine several times slower than when the session began; the cause was not identified. A slower machine fits all four, but no mechanism is claimed for any of them. They are not this change's: no file under `app/src` changed, and none of them imports a changed file.

## Unverified, beside what passes

1. **The Duet door's minute.** Not reproduced, and not explained. The new wait separates a slow list from a failed one the next time, and that is all it claims.
2. **Throttling as a stand-in for load.** A page slowed through the DevTools protocol reproduced the density and MIDI-reload failure messages. Two full unit runs of machine load did not. Whether CI's runner fails in the same way is inferred from the messages matching, not observed.
3. **The CI runner itself.** Nothing here ran on CI. The 60 s and 120 s budgets are chosen from the waits the cases already stated and from this machine's throttled runs, not from CI timings.
4. **The product observation** about ticks closing windows before a delayed note is read from the code and shown in a test page and on the engine clock only, never on a phone.
5. **Playwright's clock:** the browser case relies on its documented behaviour (timers fire in due order when run forward). The case was seen green 5/5 quiet, 5/5 under load and 5/5 at 6×, and the stalled variant red 3/3.
6. **The machine's speed moved during the session.** The same unit cases alone went from 0.64–0.84 s to 2.9–3.8 s. So "quiet" means no other test process of mine, not a fixed speed. The durations in this entry describe this machine at the time they were taken and nothing about the product.

Nothing was played or heard. No screen was looked at beyond the page snapshots Playwright wrote on failure.

## Not done

- **A red line under machine load for the MIDI unsupported case and the Duet door.** Neither failed, in 5 old runs each beside two full unit runs, nor at 32× for the unsupported case. The Duet door was not tried throttled beyond the arrival probe, since the list arrived in 6.8 s at 32×.
- **Q39 reproduced by throttling alone.** At 6× both versions passed 5/5; at 16× both failed first inside the fixture's own `openDevScore` arrival wait ("Score renderer (dev)" in the 5 s default, `red-q39-throttle16.txt`), which is not this seam's file. The injected stall is the red line.
- **An injected clock for `DevScoreScreen`'s engine.** That would be a product change. The page clock does the same job without one.
- **`docs/08-test-map.md` and the test inventory:** not this seam's to edit.

Every other item in the brief is done.

## Follow-ups

- **P2, the same 5 s shape in unit files not in this brief (Q37's family).** Under one or two extra unit runs these timed out at 5 s (the `pw-load-vitest-*.txt`, `q37-load-*.txt` and final runs):
  - `competenceSurvivesPruning.test.ts` (1), (3), (4);
  - `legacyStorage.test.ts` (Skills; Plan);
  - `pitchDetector.test.ts` (up to five cases);
  - `difficulty.test.ts` (hanon.01 agreement);
  - `scoreModel.test.ts` (hanon.01 golden);
  - `expectedNote.test.ts` (black keys);
  - `sightReading.test.ts` (levels 5-7, chord tone);
  - `unmeasuredConceptsSaySo.test.ts` (two);
  - `folderStorage.test.ts` at its own 30 s.

  Two of them, `expectedNote` and `sightReading`, failed in the final single full run. Each wants its cost measured and, where genuinely expensive, a local budget with the reason, as here.
- **P2, `fixtures/devScore.ts` › `openDevScore`:** it waits for `.card h1` "Score renderer (dev)" with the 5 s expect default, before its own 60 s waits. It failed 10/10 at 16× throttle. Every dev-harness spec opens through it. Same fix shape as the MIDI screen: the lazy screen's mount, within the test's budget.
- **P3, `midi.spec.ts` › Diagnostics screen:** the `beforeEach` waits for `.screen h1` "Diagnostics" within 5 s. Same shape; not a named case; not changed.
- **P3, `midi.spec.ts` › `connect()`:** it passes on the transient "Waiting for the browser's permission prompt…" status, not on the published `data-midi-connected="true"`. No failure was seen, because the mock resolves on a microtask. Recorded, not changed.
- **P2, product, Tempo judging (Tier 2):** `closeWindowsUpTo` runs on every tick from the clock's `now`, so a note stamped inside its window but delivered after a main-thread stall finds the window closed: it is judged wrong and its slot missed. On a phone a window swap that stalls past the note's remaining tolerance would do this to a learner. What the product would need, as the reviewer's choice: close windows only up to `now − a delivery grace`, or drain queued input before closing. It is unverified on a device.
- **P3, the service worker in every test context:** each fresh context precaches 2192 files (22.7 MB). At two workers under unit-run load the Library arrived no slower with the worker than with it blocked. So it is not shown to matter here; the full four-worker suite is untried. `serviceWorkers: 'block'` for specs not about offline would be a config decision, outside this seam.
- **P2, watch: the four timing failures of the final full run** (`offline.spec.ts:53`, `perf.spec.ts:151`, `score.window-rule.spec.ts:794`, `wide.spec.ts:582`). They failed here, alone as well, while the machine ran several times slower than at the start, and they passed in the C7 chain. The next chain on a machine at its usual speed decides whether any is more than that.
- **P3, `audio.spec.ts`** asserts the literal `http://localhost:4173/…` soundfont URL, so it fails on any other port. That is a port artefact of this run, not a product fault.
- **P3, record:** matrix rows Q34, Q37, Q39 and Q44 to built with these counts; the test map and the inventory rows for the six files.

## Questions

None that block. For the reviewer: whether the two local budgets here (the MIDI reload's 60 s, the density file's 120 s) should instead be one stated arrival budget in the Playwright config for cold engravings and cold boots. That would be a config change and a decision about every spec, so it was not made here.

## Files

- `app/tests/unit/engineTempo.test.ts` (one `describe` added at the end, with imports)
- `app/tests/e2e/engine.spec.ts` (one case's clock)
- `app/tests/unit/sightReadingPromises.test.ts` (two cases' timeout)
- `app/tests/e2e/midi.spec.ts` (the arrival helper, the reload case)
- `app/tests/e2e/doors.spec.ts` (`findRow`'s first wait)
- `app/tests/e2e/score.density.spec.ts` (`drawn()`'s sleep, the file's timeout)

Beside this entry:

- **Red lines:** `red-q39-engine-clock-probe.txt`, `red-q39-browser-probe.txt`, `red-arrivals-throttle32.txt`, `red-q39-throttle16.txt`, `red-q39-throttle6.txt`, `q37-load-committed-file-1..3.txt`, `q37-load-generator-L1.txt`, `q37-load-generator-L2.txt`.
- **Greens and counts:**
  - `green-midi-throttle32.txt`, `run-engineTempo-new.txt`;
  - `q37-alone-committed-1..3.txt`, `q37-load-new-file-1..3.txt`, `q37-load-new-L3.txt`, `q37-load-new-L4.txt`;
  - `pw-old-vs-new-load.txt`, `pw-load-vitest-1..3.txt`;
  - `run-pw-touched-files.txt`, `run-pw-touched-repeat5.txt`.
  - `q37-load-committed-A.txt` and `-B.txt` are excluded from the counts: the revised file was on disk for about 24 s while they started, so which version they loaded is unknown.
- **Probes:** `probe-arrivals-quiet.txt`, `probe-arrivals-load.txt`, `probe-throttle.txt`, and `summarise_arrivals.py`.
- **Transient files:** `h0-probe-q39.test.ts`, `h0-probe-q39.spec.ts`, `h0-probe-arrivals.spec.ts`, `h0-probe-throttle.spec.ts`, `h0-probe-redgreen.spec.ts`, `h0-probe-q39-throttle.spec.ts`, each copied into `app/tests` to run and removed. Committed copies of the four specs were placed in `tests/e2e` as `h0-old-*.spec.ts` for the old-against-new runs and removed.
- **Runs:**
  - `run-npm-ci.txt`, `run-content-build.txt`, `run-tsc.txt`, `run-lint.txt`, `run-vitest.txt`, `run-build-app.txt`;
  - `run-pw-full-default.txt`, `run-pw-full-failures-rerun.txt`, `run-pw-three-alone.txt`, `run-pw-perf-alone.txt`, `q37-alone-new-late.txt`;
  - `preview-4183.log`, `failure_reasons.py`.
- **Config:** `playwright.h0-4183.config.ts`, `storageState-4183.json`, `package.json`.
- **Scripts:** `copy_imports.py`, `copy_convert_cache.py`, `crlf.py` (the six files are kept in the checkout's CRLF).
- **Snapshots:** `head/` (the six files as committed), `after/` (as changed), `h0.diff`.
