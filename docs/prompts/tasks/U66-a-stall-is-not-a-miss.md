# U66 - a stall is not a miss: a Tempo note stamped inside its window is judged in it when a long task delays its delivery past the window's end (backlog U66; convergence SG02; queued by `responses/questions-53670d2a.md`:340, reproduction first; engine only)

**Read first:**
- **Procedure.** `docs/prompts/operating-procedure.md` §1-§5, §11-§13.
- **The row and its rulings.** `docs/prompts/backlog-2026-09-25.md`:127 (U66) and :767 (Q39, closed: the mechanism proven); `docs/review/responses/a008ba5.md`:23, :31 (reproduce at the product boundary and choose the rule; a phone observation is not a prerequisite); `docs/prompts/entry-87.md`:5-9, :79 (the probe's red line: `{midi 60, stepIndex null, ok false}`), :199 (the two candidate rules); `docs/prompts/runs/H0/red-q39-engine-clock-probe.txt`, `red-q39-browser-probe.txt`; `docs/prompts/convergence-2026-09-30.md`:360, :636-639.
- **What a miss means.** `docs/05-score-follow-engine.md`:118-120 (a note at `t` matches step `j` when `|t - tStep[j]| <= toleranceMs`), :130-131 (*"When the clock passes `tStep[j] + toleranceMs` ... -> `missed`"*).

## Premises at the lines (HEAD 4f5f9eea; `app/src/engine/PracticeEngine.ts` unless named)

1. **The tick closes on its own time.** `tick()` :624-646 reads `music = this.musicMs` (the clock's `now`, :616-617) and calls `this.closeWindowsUpTo(music)` (:644). `closeWindowsUpTo` :1266-1278 skips a slot only while `musicMs <= step.tMs + toleranceMs` (:1275); otherwise `closeSlotAsMissed` (:1284) deletes the slot (:1287), counts `missedTotal` (:1312) and emits `missed` (:1316).
2. **Delivery is already judged by the stamp.** `feedTempo`: `tMs = rawTMs - inputLatencyMs` (:982), `at = toMusicTime(tMs, music)` (:986), `findSlot(midi, at)` (:991). `findSlot` (:1120) searches only `this.openSlots` with `|at - step.tMs| <= toleranceMs`. No slot -> a wrong note (`wrongNotesTotal`, :1031).
3. **The engine's only late-delivery bound is implicit.** `toMusicTime` (:1357-1363) trusts a stamp within 1000 ms of now (*"One second of slack"*, :1360-1362), else uses now; `latch` the same (:751).
4. **Stamps.** Web MIDI: `event.timeStamp`, taken on arrival (`midi/WebMidiSource.ts`:531-532). Replay: stamped `base + atMs` (`midi/ReplaySource.ts`:108, :112), delivered by `schedule`. On-screen keys: stamped when the handler runs (`midi/ScreenKeyboardSource.ts`:64 `tMs = this.now()`; `ui/KeyboardStrip.ts`:413-422 passes no event time), so a tap during a stall is stamped after it.
5. **Tick drivers.** `score/ScoreSession.ts`:1026-1036 (frame loop) and :579, :823 (`setInterval`, `TICK_INTERVAL_MS` = 25, :116).
6. **Other readers of an open slot.** `resumeStep` :530-545 (an open, untouched slot is where the learner picks up); `recountFrom` :557-559 closes slots before the target as missed; `findRhythmSlot` :1173; the last step closes everything at :1255 before `completeLap`, a lap wrap clears slots at :1382, and `feed` drops notes once `finished` (:680).
7. **Wait and unjudged runs.** Wait's tick returns at :626-629 and closes no window; an unjudged run counts no miss (:1295).
8. **Scoring.** `Scoring.ts` defines no tolerance (its `tolerance`/`window` hits, :106, :134, :144, :271, :302, :351, are outcome comments); the value lives in `types.ts`:248 (150) and :235 (mic, 200).
9. **Tests.** `tests/unit/helpers/engineHarness.ts`:107-146 (`play(midi, {atMs})`, `advance(ms, stepMs)`, `clock.set`); `engineTempo.test.ts`:1027-1114 (the Q39 replay on the `FakeClock`, `schedule` injectable), :268-275 (`missed` by 1.5 beats); `tests/e2e/engine.spec.ts`:112-154 (the late run, on Playwright's clock since H0).

## Hypothesis and its refuting test

**Hypothesis.** The tick closes a window by comparing its end with the tick's own time (:1275), so a note stamped inside the window but delivered after that tick finds its slot deleted: one in-time note becomes a miss plus a wrong note.

**Read at the lines,** half of the row's framing is already true: the stamp *is* compared with the window on delivery (:986, :1120). The defect is the slot's removal (:1287) before a stamped note can arrive. **Refuting test:** if the reproduction shows the slot still open at delivery and the miss still counted, the miss comes from elsewhere; find where and say so before building.

**Reproduction first, red on the base.** `melody`, 60 bpm, no count-in, tolerance 150: `start()`; `advance(90)`; `clock.set(400)` (the long task); `tick()`; `play(60, {atMs: 100})`. Expected on the base: `hits` 0, `missedTotal` 1, `wrongNotesTotal` 1. Capture the red line.

## What to build

1. **Keep the stamp.** Judgement from the stamp (:986) stays; mutant M1 holds it.
2. **Close a window as a miss only when no note stamped inside it can still arrive.** The bound today is implicit (premise 3). Choose from the reproduction; put the reason in the code comment and the entry:
   - **(a)** close up to `music - G`, with `G` a named constant no larger than the 1000 ms trust bound. Every miss mark then lands `G` later on every device.
   - **(b)** stall-aware: a tick whose gap since the previous tick exceeds the ticker's budget defers closing windows that ended inside the gap until input queued in the gap can have arrived (bounded, and stated). An unstalled run closes each window at the tick it closes today.
   - Prefer (b). Take (a) only if (b) cannot be made sound, and then name the delay as the product change in the report's first lines.
   - **Rejected:** (c) reopening a closed miss when a stamped note arrives. It retracts a `missed` the screen has already painted (`ScoreScreen.ts`, U105's).
   - *Draining queued input* is not open to the engine, which cannot see the event queue.
3. **The bound's readers agree.**
   - `resumeStep` and `recountFrom` treat a window past `tStep + toleranceMs` as over. A slot held for the bound is not where the learner picks up.
   - `findRhythmSlot` gets the same rule.
   - The last step (:1255) and a lap wrap (:1382) either wait for the bound, or the report states that a stall across the run's end still loses the note.
4. **The tolerance's meaning is unchanged.** `findSlot` and `findRhythmSlot` keep `<= toleranceMs` from the stamp. `05` :118-120 is unchanged; :130-131 gains one sentence on when a miss is decided.
5. **Wait, Listen and Keep tempo are unaffected** (premise 7).

## Deviations, with reasons

- The row's *"live notes are stamped when they happen"* holds for Web MIDI only. On-screen keys are stamped late (premise 4), so this fix cannot help them. The fix belongs to `KeyboardStrip.ts`/`ScoreScreen.ts` (outside this lane): a Follow-up.
- Stamp-based judgement already exists (premise 2), so the build is the close rule and its readers.
- The browser case runs on real timers because the convergence proof names a busy-thread case. Its stall length is stated relative to the bound, and it asserts relationships, never a timing measured here.

## Verification layers

**Unit, red first on the base, each in `engineTempo.test.ts` unless named:**
- **U1** the reproduction (a live, stamped note): 1 hit, 0 missed, 0 wrong.
- **U2** replayed: the Q39 helper with the first message's delivery held past its window's end by a fake long task (no ticks during it, one tick before delivery). Expect 2 hits, 0 missed, 0 wrong, and the deltas the stamps give.
- **U3** genuinely late: stamped at `tStep + toleranceMs + 1`, delivered at once, no stall. 1 wrong and 1 missed, as on the base.
- **U4** a stall longer than the bound: the miss stands and the note is an extra, as on the base. This is the stated limit.
- **U5** at the limit: stamped exactly at `tStep + toleranceMs` and delivered after a stall: a hit (inclusive, `05` :118-120).
- **U6** a pause inside the bound, then a resume with a recount: the resume target equals the base's.
- **U7** rhythm only (`engineRhythmOnly.test.ts`): the same stall, and the strike counts.
- **U8** an unstalled run: `missed` is emitted on the base's tick under (b), or `G` later under (a). Assert it either way.
- **U9** Wait: `engineWait.test.ts` unchanged and green.
- Every existing miss-timing assertion either passes unchanged or is revised with its class and old assumption. `missed` appears on 28 lines of `engineTempo`, 6 of `engineEarlyNote`, 3 of `engineRhythmOnly` and 1 of `engineScoring`.

**Browser.** B1, in `engine.spec.ts` on real timers: the replay with the main thread kept busy for 400 ms from about 90 ms after it connects (H0's `wall-stalled` probe, red 3/3). Red on the base, green after. Run it alone, then repeat it 5 times.

**Mutants.** Apply each, run, revert, and name the test that caught it:
- **M1** stamp ignored (`at = music` at :986): U1, U2.
- **M2** bound removed (close up to `music`): U1, U2.
- **M3** tolerance widened (`findSlot` against `toleranceMs + bound`): U3.
- **M4** a held window read as open by `resumeStep`: U6.

**Chain.**
- `npx vitest run` on the six engine files (Tempo, EarlyNote, RhythmOnly, Scoring, Wait, `countIn`), then the whole suite.
- `npx tsc -b`, `npm run lint`, `npm run build:app`.
- The map: `python tools/docs/checks_for_paths.py` on the touched paths. `app/src/engine/**` names 14 specs (`docs/prompts/checks.json`:20). Run `engine.spec.ts`, `score.run`, `score.latch`, `score.countin` and `modes-rhythm-only`, each file checked to exist first. List the rest as not run as the map writes it.

**checks.json.** No new spec file is expected; `engine.spec.ts` is already mapped (:20). A new spec file gets its row and its reason.

## Rules and files

**You own:**
- `PracticeEngine.ts`: the close rule and the readers in item 3;
- `engineTempo.test.ts`, `engineRhythmOnly.test.ts` (U7) and `engine.spec.ts` (B1);
- the doc rows: `docs/05-score-follow-engine.md`:130-131 (one sentence); `docs/08-test-map.md`:253 and :431.

**Read only:** `Scoring.ts`, `types.ts`, `ScoreSession.ts`, `midi/*`.

**Not yours:** `ScoreScreen.ts` and `help.ts` (U105); `WindowRenderer.ts` (U32); `KeyboardStrip.ts`, `ScreenKeyboardSource.ts`, `style.css`.

**Harness.**
- Own worktree from origin's head (state the base sha). Fresh-worktree setup as in `tasks/G86a-*.md` "Rules and files". Never commit, push, stash, reset or checkout, and never write in the main checkout. Temp state under the worktree's `build/`. No log over 300 KB (keep the summary and the failing names). At the end, delete `app/dist`, `test-results`, `node_modules`, the copied caches and the config copy.
- Playwright only for B1 and the five specs: a config copy under `app/build/u66/` on port 5173 with an absolute `storageState`. No port 4173.

**Rules.**
- Never name an AI model, and never assert a number measured on this machine.
- Every item done, or an explicit not-done line.
- A premise found wrong: say so, take the better path, record why.

## Report

**Judgement first.** What a learner meets differently on a phone under a stall, each with the observation that proves it (U1-U9, B1):
- an in-time MIDI note during a window-swap stall: now a hit, with no red miss and no extra;
- when a miss mark lands on an unstalled run;
- an on-screen tap: unchanged.

*Unverified on a device* is the first line.

**Then:**
- Done / Not done / Follow-ups (the on-screen stamp; the device observation) / Questions (the rule chosen, if it delays misses; the end-of-run case) / Files;
- per fix: the mechanism, the discriminating test and its red line;
- the tests table (class: add, revise or preserve; old assumption) and the mutant table (mutant, catching test, red line);
- counts per file, and exit codes;
- not run as the map writes it; what is unverified; `## Doc rows`.

State the technical and pedagogical verdicts separately. Pedagogically, what counts as a miss is unchanged; how the new close timing reads to a learner is unverified on a device.

**Entry.** Run files go under `docs/prompts/runs/U66/`, and the entry is `docs/prompts/runs/U66/ENTRY.md`, with its number given at dispatch.

## Record

lane: U66 · closes: U66 · entry: 176
index: A stall is not a miss: the engine's window close follows the note's stamp, not the tick (backlog U66; SG02) | app | brief drafted 2026-09-30 (`U66-a-stall-is-not-a-miss.md`); with the reviewer before dispatch; Entry 176
in-flight: brief drafted 2026-09-30 (`U66-a-stall-is-not-a-miss.md`): a render stall must not create a miss: the engine closes a timing window by its own tick, so a note stamped inside the window but delivered after it is judged against a closed slot; reproduction first, the close rule fixed (SG02, tier 1; the reviewer's queue item 3); with the reviewer before dispatch (Entry 176).
state: with-reviewer 2026-09-30: with the reviewer before dispatch (the morning bundle)
