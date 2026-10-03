### Entry 176 — U66 — a stall is not a miss: a note stamped inside its window is judged by its stamp, whatever the main thread was doing

**Base.** 39e67809, origin's head at dispatch. The brief expected 26a913fe. The builder stopped on the mismatch, and the orchestrator confirmed 39e67809: it is two docs-only review commits after 26a913fe (`responses/67fc2523.md` and `responses/questions-26a913fe.md`; nothing under `app/` or in U66's files). It is also the only base that holds `questions-26a913fe.md`, which the dispatch names. The harness removed the unchanged worktree at that stop. The builder recreated it at the same path and branch name from 39e67809 (`git worktree add -b <the same branch> <worktree> 39e67809`, run from the main checkout). That wrote git's worktree metadata only and no file of the main checkout.

## Judgement

**Unverified on a device.** No actor in this process runs the app on a phone under a stall. Everything below was observed in the engine on its injected clock and in Chromium on real timers.

What a learner meets differently when the page stalls mid-run (a window swap, a garbage collection, any long task):

- **A MIDI note played in time during a stall that outlasts the note's remaining tolerance.**
  - Before: the step was painted red as missed, and the key flashed red as an extra wrong note. That was two faults for one note played in time.
  - Now: it is a hit, judged green with the delta its stamp gives. No miss is painted and no extra is counted.
  - Observed live-stamped in U1, on the replay path on the engine clock in U2, and in Chromium with the page busy 400 ms in B1. B1 was red 3/3 on the base and green 1/1 alone, then 5/5.
  - Also observed at the window's inclusive edge (U5) and on a rhythm-only run (U7).
- **The last note of a run.** A stall across the run's end no longer loses it.
  - The end waits for the hold: the finish sheet and the lap's score come at most one tick interval and one tick after the stalled tick, and the note is counted.
  - While the end waits, a note stamped after the last window, one stamped after the run's end, and a wrong key are each dropped, as the finished run always dropped them. None becomes a wrong note.
- **A loop's wrap.** It behaves the same way.
  - The next lap's downbeat moves later by the wait, because the wrap rebases the lap from the clock at the tick that completes it.
  - The lap test pins this: the base's downbeat position reads early by exactly the wait.
  - The stall itself already moved that downbeat before this change; the hold adds at most a tick interval and a tick.
- **When a miss mark lands.**
  - On an unstalled run: on the tick it always did (U8, on 16 ms frames and on the 25 ms interval alone).
  - After a stall, a window nothing arrived for is marked missed on the first tick at least one tick interval after the stalled tick. That is later than before by at most one tick interval and one tick.
  - A jittered interval tick more than 25 ms after the previous one also counts as a stall, at the same bounded cost.
- **An on-screen tap: unchanged.** It is stamped when its handler runs, after the stall, and is judged as before: an extra, with the window missed.
- **The stated limits, as before.**
  - A note that reaches the engine more than a second after its stamp is lost: past the stamp-trust bound, the note is an extra and the window a miss (U4).
  - A note that arrives more than one tick interval after the stalled tick is lost the same way (U4).

**Technical verdict.**
- The seam's claim is shown red on the base and green after, at both layers: unit (U1, U2, U5, U7, the last note, the lap, the short-last-note case) and browser (B1).
- The four named mutants are each caught by the named test, plus two extra mutants for the end.
- The preservation cases (U3, U4, U6, U8, the tap, the stop, the drops, Listen and unjudged runs) are green on the base and after.

**Pedagogical verdict.** What counts as a miss is unchanged:
- the tolerance is unchanged and inclusive;
- `findSlot` and `findRhythmSlot` are untouched;
- nothing painted is ever retracted.

Only *when* a miss is decided moves, and only after a stall. How the slightly later miss mark after a stall reads to a learner is unverified on a device.

**Content: none.** No lesson, curriculum, catalogue, score or screen sentence changed; `docs/05` is a spec row, listed under Doc rows.

## The reproduction, the mechanism and the discriminating test

**Reproduction first, on the base** (the brief's: `melody`, 60 bpm, no count-in, tolerance 150; `start()`, `advance(90)`, `clock.set(400)`, `tick()`, `play(60, {atMs: 100})`). The file is `red-reproduction-base.txt`, from a probe test that was run once and removed:

```
REPRO {"hits":0,"missedTotal":1,"wrongNotesTotal":1,"notes":[{"midi":60,"stepIndex":null,"ok":false}],"missed":[{"stepIndex":0,"tMs":400}]}
```

The `missed` event's `tMs` is 400, the stalled tick, before the note was fed. So the slot was deleted before the stamped note arrived: the hypothesis holds. The brief's refuting condition was "the slot still open at delivery and the miss still counted"; it did not occur.

**Mechanism.** The chain has three links:
1. `tick()` closed windows by comparing their end with the tick's own music time (`closeWindowsUpTo`).
2. After a long task, the tick due first came off the queue before the MIDI message that had waited behind the same task, and deleted the slot (`closeSlotAsMissed`).
3. The message was judged by its stamp (`feedTempo` → `toMusicTime` → `findSlot`), found no slot, and counted as a wrong note.

The stamp half of the row's framing was already true (premise 2). The defect was the slot's removal.

**The rule chosen: (b), stall-aware.**
- A tick more than `TICK_BUDGET_MS` after the previous one follows a stall. The previous reading is the last tick, or the run's start or a resume.
- Each window that tick finds ended is held in `heldUntil`, not closed, until a tick at least one tick interval after the stalled tick. A held window hit in the meantime is deleted at once.
- A held window closes at once when it has been over for longer than `STAMP_TRUST_MS`, since no note stamped inside it could then be trusted and judged in it.
- An unstalled tick never starts a hold, so an unstalled run closes every window on the tick it always did.

The two bounds are the engine's existing contracts, and no new duration was added:
- `TICK_BUDGET_MS = 25` is the session's `TICK_INTERVAL_MS`, stated in the engine because the engine now relies on it. A test pins the two equal (`engineTempo.test.ts`, "the tick budget is the session's tick interval").
- `STAMP_TRUST_MS = 1000` is the literal `toMusicTime` and `latch` already used, now named.

(a) was not taken: it would land every miss mark later, on every device, stalled or not.

**The assumption the bound rests on, said once.** The engine cannot see the page's queue. It relies on the page running what the stall queued before a timer that fell due after the stall. Chromium does, as B1 shows: the harness's tick was due first after the long task, and the replayed note, stamped inside its window, was then judged in it. On a phone this is unverified.

**Discriminating tests.**
- U1 and U2 differ from the base only in the hold.
- M2, which removes the hold and closes up to the tick, returns the base's result (U1 and U2 red).
- M1, which judges by the clock instead of the stamp, also returns it (U1 and U2 red).
- So both the stamp and the hold are necessary. Neither alone makes the note a hit.

## Item by item

1. **Keep the stamp. Done.** `feedTempo`'s `at = toMusicTime(tMs, music)` is unchanged; M1 is caught by U1, U2 and more.
2. **Close a window as a miss only when no note stamped inside it can still arrive. Done: rule (b).** `holdsForStall`, called from `closeWindowsUpTo` (`PracticeEngine.ts`:1382–1418); the tick measures the gap (:697–702).
3. **The bound's readers agree. Done.**
   - `resumeStep` counts a held window as over (:598), so it is never where the learner picks up (U6, M4).
   - `recountFrom` closes held windows as misses, including when the count goes back to a step before them (:617). Otherwise the rewound clock would have made a window the base had closed playable again.
   - `findRhythmSlot` and `findSlot`: no code change. Both search the open windows, the held ones among them, and measure the note's own stamp against the same inclusive tolerance (U7).
   - **The last step and the lap wrap** hold on the same rule:
     - `holdsTheEnd` (:1362): an end reached by a stalled tick holds every window still open, including the one the end cuts short. An end also waits while any hold is pending.
     - The deferral holds back `completeLap` itself (:1338–1348), so `running` stays true and `feed` still accepts notes.
     - During the deferral, only a note stamped before the run's end that matches a window still open is judged. Anything else, including a note stamped after the last window, is dropped, never counted wrong (`feedTempo`, :1064–1067).
     - A deferred wrap rebases the next lap from `clock.now()` at the completing tick, so that lap's downbeat moves by the wait. It is said in the code comment and pinned by the lap test.
     - No beat is emitted past a held end (:715).
4. **The tolerance's meaning is unchanged. Done.** `findSlot` and `findRhythmSlot` keep `<= toleranceMs` from the stamp (M3 is caught by U3). `05` :118–120 is unchanged; :130–131 gains the one sentence.
5. **Wait, Listen and Keep tempo are unaffected. Done.**
   - Wait's tick returns before any of the new code.
   - Listen and an unjudged Keep tempo run hold nothing (`!this.judging`), and their end comes on the stalled tick as before (test "Listen and a Keep tempo run nothing judges hold nothing").
   - `engineWait.test.ts` is unchanged and green, 26/26 (U9).

**The transitions, traced in code and tested where they change:**

| Transition | What happens to a hold | Test |
| --- | --- | --- |
| start / restart | `heldUntil` cleared, the end released, the gap measured from the start | every case starts one; U2 restarts |
| tick, unstalled | never starts a hold; ends one whose time is up | U8, "after a stall, a window nothing arrived for…" |
| tick, stalled | holds the windows it finds ended | U1, U2, U5 |
| pause | tick returns early; the hold stays | U6 |
| resume, plain | the gap re-measured from the resume (a pause is not a stall); a lapsed hold closes on the next tick | covered by the code path; the existing "a plain resume carries on exactly as before" stays green |
| resume with a recount | held windows closed as misses; the target is the base's | U6, M4 |
| armed (holding for the first note) | the gap is read on every armed tick, so a long hold is not taken for a stall | the latch cases (T8) stay green |
| stop | held windows closed as the misses they were; every open window when the end is held | "a stop inside the hold…" |
| finish (the last lap) | waits for the hold; `completeLap` held back | "the last note…", the short-last-note pair |
| lap wrap | waits for the hold; the next downbeat moves by the wait | "a lap…" |

**U111 (a last note shorter than the tolerance ends the run early): not fixed, and not changed.**
- On an unstalled run the end path runs as before: every open window closed, then `completeLap`.
- On a stalled end, the window the end cuts short is held for the tick interval. A note stamped before the run's end is judged, and a note stamped after the end is dropped, exactly as the run with no stall drops it.
- The pair "a last note shorter than the tolerance (U111 left as it is)" pins this, comparing the stalled run with an unstalled twin.

## Not done

Nothing in the brief is left undone.

## Deviations

- **The worktree was recreated** after the stop on the base mismatch (above).
- **Port 5166, not the brief's 5173.** The dispatch asked for a port of the builder's own; 5173 is Vite's default dev port, which another lane's server may hold.
  - The config copy is `app/build/u66/playwright.u66.config.ts`. It imports `app/playwright.config.ts` and overrides:
    - `testDir` and `outputDir` (`app/build/u66/test-results`), both absolute;
    - `use.baseURL` → `http://localhost:5166/PianoProject/`;
    - `use.storageState` → an absolute path to a copy of `storageState.json` whose origin is `http://localhost:5166`;
    - `webServer` → `npm run build:app && npx vite preview --port 5166 --strictPort`, `cwd` `app`, `reuseExistingServer: false`.
  - The config and the storage-state copy are deleted at the end.
- **The red browser run on the base built with `vite build` alone** (`U66_VITE_ONLY=1` in the copy). That tree carries the new tests, which import the not-yet-written `TICK_BUDGET_MS`, so `tsc -b` inside `build:app` refuses it. The green runs used `build:app`.
- **`stop()` closes held windows as misses.** The brief's reader list does not name `stop`. Without this, a stop inside a hold would have finished with a miss the base counted and the new code dropped.
- **No beat past a held end.** The run is over while its end waits, so a `tempoTick` there would be a beat after the last bar.
- **The engine carries its own copy of the tick interval.** `ScoreSession.ts` is read-only here, so it cannot import the engine's constant; a test pins the two equal. See Follow-ups.
- **The brief's line references have drifted.** Backlog Q39 is at :785, not :767; the `docs/08` rows are at :255, :437 and :440, not :253 and :431. The rows edited are the ones the brief meant.
- **U6 is an equality with the base,** so it is green on the base by design; M4 is what it catches.

## Follow-ups

Classified under operating-procedure §11's anti-loop rule. None is fixed here.

- **On-screen keys are stamped at handler time.** `KeyboardStrip.ts`:413–422 passes no event time, and `ScreenKeyboardSource.ts`:64 stamps `this.now()`, so a tap during a stall is stamped after it and this fix cannot help it. The pointer event's own `timeStamp` would be the stamp. It attaches to SG02's product truth. The files belong to U105's lane and the strip, outside this one.
- **The device observation.** Does a phone's render stall outlast a note's remaining tolerance at practice tempi, and does the queue-before-later-timer ordering hold there? No one in this process can observe it; the item stays open.
- **One fact, two places.** `TICK_INTERVAL_MS` (`ScoreSession.ts`:116) and `TICK_BUDGET_MS` (`PracticeEngine.ts`:89) are pinned equal by a test. `ScoreSession` should import the engine's constant. This is a P3 maintainability observation for the session's next seam.
- **A lap's metronome is not re-synced** (pre-existing observation). The metronome runs on the audio clock across laps, while the engine rebases each lap from the tick that completes it. That tick is already late by up to a tick, and by a whole stall on a stalled wrap; the hold adds at most a tick interval and a tick.
- **A stop inside a held wrap does not count that lap in `loops`** (the base counted it at the stalled tick). The hits and misses are the same either way. P3 observation.
- **Harness: two `lessonClaimsAboutApp` cases fail in this checkout.**
  - The cases are `blues.3` "two tool buttons" and `4.7` "blind hides the score".
  - Their patterns carry `\n` literals, such as `"menuRow(\n    'Rhythm only'"` and `'.score-stage--blind {\n  visibility: hidden;\n}'`. They read files that a Windows checkout with `core.autocrlf=true` writes with CRLF.
  - They fail identically with the base engine swapped in (`lessonClaims-with-base-engine.txt`), so they are not this seam's. P3 test fragility.
- **`app/tests/e2e/fixtures/devScore.ts`'s `EngineScore` mirror has no `notes`.** B1 casts locally rather than editing a fixture outside the lane. P3 observation.

## Questions

None. The rule adds no new duration, so there is no product trade to put. The end-of-run case is handled as the approval requires.

## Files

- `app/src/engine/PracticeEngine.ts`:
  - `STAMP_TRUST_MS` (the literal named) and `TICK_BUDGET_MS`;
  - `lastTickAtMs`, `heldUntil` and `endHeldAtMusicMs`;
  - the stalled-tick read in `tick()`;
  - `holdsForStall` and `holdsTheEnd`;
  - `closeWindowsUpTo(musicMs, now, stalled)` and `advanceClockTo(musicMs, now, stalled)`;
  - the readers `resumeStep` and `recountFrom`, and `stop`;
  - the end gate in `feedTempo`;
  - `heldUntil` cleared where a slot goes (hit, closed, the wrap, the start).
- `app/tests/unit/engineTempo.test.ts`: the Q39 helper gains an optional stall; 18 cases added.
- `app/tests/unit/engineRhythmOnly.test.ts`: 2 cases added (U7).
- `app/tests/e2e/engine.spec.ts`: 1 case added (B1).
- `docs/05-score-follow-engine.md`:130–136; `docs/08-test-map.md`:255, :437, :440.
- `docs/prompts/runs/U66/`: this entry and the logs named below.

`docs/prompts/checks.json` is unchanged: no spec file was added, and `engine.spec.ts` is already mapped (:20).

## Red and green lines

All logs sit beside this entry, with machine paths replaced by `<worktree>` and `<home>`.

- **The reproduction on the base** (`red-reproduction-base.txt`): `hits 0, missedTotal 1, wrongNotesTotal 1`, the note `{midi 60, stepIndex null, ok false}`, and `missed` at the stalled tick.
- **Unit, red on the base** (`red-unit-base.txt`): 9 failing, 83 passing in the two changed files.
  - U1: "expected +0 to be 1" (hits).
  - U2: "expected 1 to be 2".
  - U5: "expected +0 to be 1".
  - U7: "expected +0 to be 1".
  - The last note: "expected [ { kind: 'finished', … } ] to deeply equal []".
  - The lap: the same.
  - The short last note stamped before the end: "expected 1 to be 2".
  - The miss after a stall: "expected [ { kind: 'missed', … } ] to deeply equal []".
  - The pin: "expected undefined to be 25".
  - The first red run also showed U3 red. That was the test's fault, not the base's: its horizon passed D's window too. It was rewritten to half a beat, and U3 is green on the base, as a preservation case should be.
- **Unit, green after** (`green-six-engine-files.txt`): the six engine files 165/165 (`engine-file-counts.txt`).
- **B1 red on the base** (`red-b1-base.txt`): 3/3 failed on `expect(run.notes)`, with `[60, 0, true]` expected and `[60, null, false]` received. The stall's two relations (it began before the first window closed and ended after it) held in each run, so the red is the fault, not a missed stall.
- **B1 green after:** alone 1/1 (`green-b1-alone.txt`), then `--repeat-each=5` 5/5 (`green-b1-repeat5.txt`).

## Tests

| Test | Class | Old assumption / what it holds | Base | After |
| --- | --- | --- | --- | --- |
| Q39 helper `replayOnTheEngineClock` | revise (helper) | a message is always delivered at its due time; now an optional stall, and the clock never set backwards | existing case green | existing case green, unchanged |
| U2 the replay under a stall | add | — | red | green |
| the tick budget pin | add | the engine's budget is the session's interval | red | green |
| U1 the reproduction | add | — | red | green |
| U3 stamped past the window, no stall | add (preserve) | a late note is an extra and a miss | green | green |
| U4 past the stamp-trust bound | add (preserve) | the stated limit | green | green |
| U4 delivered after the hold | add (preserve) | the stated limit | green | green |
| the miss mark after a stall | add | when the miss lands after a stall | red | green |
| U5 at the window's edge | add | — | red | green |
| U6 pause inside the hold | add (preserve) | the resume target is the base's | green | green |
| U8 unstalled | add (preserve) | the miss on the base's tick (16 ms and 25 ms) | green | green |
| the on-screen tap | add (preserve) | handler-time stamp judged as before | green | green |
| a stop inside the hold | add (preserve) | the held window counts as a miss | green | green |
| the last note | add | — | red | green |
| drops while the end is held | add (preserve) | nothing after the end is a wrong note | green | green |
| short last note, stamped before the end | add | — | red | green |
| short last note, stamped after the end | add (preserve) | U111 left as it is | green | green |
| the lap, the downbeat moved | add | — | red | green |
| Listen and unjudged hold nothing | add (preserve) | end on the stalled tick | green | green |
| U7 rhythm only, inside | add | — | red | green |
| U7 rhythm only, outside | add (preserve) | a strike outside the window refused | green | green |
| B1 (`engine.spec.ts`) | add | — | red 3/3 | green 1/1 + 5/5 |
| every other case in the six engine files | preserve | — | green | green, unchanged |

No existing assertion needed revision. `missed` appears in the brief's counted lines of `engineTempo`, `engineEarlyNote`, `engineRhythmOnly` and `engineScoring`; every one of those cases passes unchanged. The rest of the unit suite also needed no revision.

## Mutants

Each was applied to the final code, run against `engineTempo` and `engineRhythmOnly`, and reverted. The file was byte-compared with the kept copy afterwards (`mutants.txt`).

| Mutant | Catching tests (the brief's named ones first) | Red line |
| --- | --- | --- |
| M1 stamp ignored (`at = music`) | U1, U2; also U5, U7, the last note, the lap, the short last note, and three existing latency / repeated-note cases | "expected +0 to be 1"; U2 "expected 1 to be 2" |
| M2 bound removed (close up to the tick) | U1, U2; also U5, U7, the last note, the lap, the short last note, the miss after a stall | "expected +0 to be 1"; U2 "expected 1 to be 2" |
| M3 tolerance widened (`findSlot` against `toleranceMs + TICK_BUDGET_MS`) | U3; also the drops while the end is held | U3 "expected 1 to be +0" |
| M4 a held window read as open by `resumeStep` | U6 | "expected 1 to be 2" (`resumesAt`) |
| M5 (extra) the end not held | the last note, the lap, the short last note stamped before the end | "expected [ { kind: 'finished', … } ] to deeply equal []" |
| M6 (extra) no drop while the end is held | the drops while the end is held; the short last note stamped after the end | "…to have a length of 3 but got 6"; "expected 2 to be 1" |

## Counts and exit codes

**Counts.**
- The six engine files: 145 before, 165 after.
  - `engineTempo` 66 → 84
  - `engineRhythmOnly` 6 → 8
  - `engineEarlyNote` 5, `engineScoring` 37, `engineWait` 26 and `countIn` 5, each unchanged
- The five browser spec files: 39 passed (`e2e-five-specs.txt`): `engine.spec` 15, `score.run` 8, `score.latch` 8, `score.countin` 4, `modes-rhythm-only` 4.

| Command | Exit |
| --- | --- |
| `npm ci` | 0 |
| `npx vitest run` on the six engine files | 0 |
| `npx vitest run` (whole suite, final) | 1: 7471 passed, 2 failed (the two `lessonClaimsAboutApp` cases under Follow-ups, failing identically with the base engine), 5 skipped, 1 todo |
| `npx tsc -b` | 0 |
| `npm run lint` | 0 |
| `npm run build:app` | 0 |
| `python tools/docs/checks_for_paths.py …` | 0 |
| Playwright B1 alone, then `--repeat-each=5`, `--workers=2` | 0, 0 |
| Playwright on the five named spec files, `--workers=2` | 0 |
| The mutant script | 0 (each mutant red as tabled) |

The first whole-suite run had two more failures, both harness artefacts of a fresh worktree:
- `midiParity`, with no reference written;
- `taughtByAncestry`, with no `build/rung-claims.json`.

The builder wrote the reference (`python tools/midi-cleanup/tests/parity_reference.py`, into the worktree's `build/`) and copied `build/rung-claims.json` read-only from the main checkout. Both files then pass (`unit-harness-artefacts-rerun.txt`, `unit-full-first-summary.txt`). The full logs are not kept; they exceed 300 KB. The summaries and failing names are.

**Harness.**
- `app/public/content` was copied read-only from the main checkout, leaving out `audio/`, which the worktree tracks.
- The main checkout was never written; its working tree and HEAD are untouched.

## Not run as the map writes it

The map (`checks.json`:20, `app/src/engine/**`) names 14 specs. Run: `engine.spec.ts`, `score.run`, `score.latch`, `score.countin` and `modes-rhythm-only`, each checked to exist first. Not run:
- `mic.spec.ts`
- `score.screen.spec.ts`
- `score.rhythm-ladder.spec.ts`
- `score.readahead.spec.ts`
- `modes-ladder.spec.ts`
- `lesson-flow.spec.ts`
- `first-day.spec.ts`
- `lab.spec.ts`
- `modes-technique-measure.spec.ts`

## Unverified

- **On a device:** whether a phone's stall ever outlasts a remaining tolerance at practice tempi, and whether its event loop delivers queued MIDI before a timer that fell due after the stall.
- **How the later miss mark after a stall reads to a learner.**
- **Real MIDI input.** Web MIDI's `event.timeStamp` taken on arrival is premise 4, read in the code, not measured here. B1 drives the replay path, whose stamps come from its schedule and whose deliveries are timers.

**Orchestrator's note at the landing (2026-09-30).** U66's worktree committed by name (342e88e7) and merged (8a1e407e). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/U66/map-min.txt`), typecheck, lint, the whole unit suite, the app build, the spec names checked, then the specs the map's minimum names on the default port (map-tests 0; map-min 0; tsc 0; lint 0; vitest-all 1; build-app 0; specs-exist 0; e2e-targeted 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; `runs/U66/orchestrator-exit.txt`). The reviewer's approval of the brief with one required change (`responses/questions-eebafb5e.md`: APPROVE FOR DISPATCH WITH ONE REQUIRED BRIEF CHANGE — the final-step close and lap-wrap cleanup must use the same bounded stall-safe rule as ordinary windows; do not reopen an already-painted miss, do not widen the musical tolerance, do not help on-screen keys by pretending their handler-time stamp was captured during the stall; a new arbitrary duration stops and reports instead of smuggling in another magic number), queued under the reviewer's priority ruling that put SG02/U66 next after CL04 (`responses/questions-53670d2a.md`:340: SG02 / U66 — render stall must not create a miss, a real scoring correctness defect with no dependency). Landed: a note stamped inside its window is a hit whatever the main thread was doing — a tick more than the tick budget after the previous one follows a stall, and the windows it finds ended are held until a tick at least one interval later or closed once no stamp inside them could be trusted; the last step and the lap wrap wait on the same rule; the chain's unit reds are the known CRLF pair; the map's fourteen specs green.

## Doc rows

- `docs/05-score-follow-engine.md` §3, the `missed` bullet (:130–136). One sentence was added on when a miss is decided:

  > The miss is decided on the first tick past that time, unless that tick follows a stall — a gap longer than the tick contract allows a free main thread (25 ms, the session's interval) — in which case the window stays open for a note stamped inside it until a tick one tick interval later, and never once a stamp inside it could no longer be trusted (1 s), so a note played in time and delivered late by the stall is still judged by its stamp, and the run's end and a loop's wrap wait the same way (2026-09-30, U66).

  :118–120 (the match rule) is unchanged.
- `docs/08-test-map.md`:
  - :255 `engine.spec.ts`: B1 added.
  - :437 `engineRhythmOnly.test.ts`: the pair across a stall.
  - :440 `engineTempo.test.ts`: the U66 cases, in one sentence.
