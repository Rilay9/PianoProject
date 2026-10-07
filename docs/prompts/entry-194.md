### Entry 194 — CL05a — hidden is not practice, finished for Drill: a rhythm card's click and judged grid stop while the phone is locked and come back on the same point of the same grid, a card's time to answer counts no hidden time, and a key, a MIDI note or the pedal sent to a hidden page feeds no card (CL05's required change, `responses/4923be59.md`; X15, in part; app only) (2026-09-30)

Base: `fadafbfa` (origin's head at dispatch). The brief is `docs/prompts/tasks/CL05a-hidden-is-not-practice-for-drill.md`, CL05's required change under the fast path, with the second read's notes folded in. Its premises were read at `2c87b682`. Every file they cite is unchanged from there to the base (`git diff --stat 2c87b682 fadafbfa` over those paths is empty), so its line numbers hold. Each premise was read at its lines before the build. Six source files and one test file changed. `screenLifecycle.ts`, the PDF, Chord Chart and Lab screens, `ScoreScreen.ts` and `sessionRunner.ts` are untouched.

## Judgement

**Layers.** Everything below was observed in the unit layer: jsdom, the real Drill screen, a faked clock, a forged `document.visibilityState`, and the real `Metronome` playing into the smallest audio context that records when each click was scheduled and whether it was stopped before it sounded. No browser case and no device were used. Nothing was heard, and no one in this process can hear. **Pedagogical verdict: not applicable.** This is an interaction and timing fix; nothing taught or judged changes, beyond not judging what nobody could see. The figures below come from the faked clock; they are test inputs, not measurements.

**What a learner meets when the phone locks in the middle of a rhythm card.**

- **Before:** on a phone that keeps its audio running, the click went on clicking into the locked phone. Every tap or key that reached the page while it was locked was charged as an extra tap. On return, the grid the taps were judged against was as far behind as the lock was long, so every tap after the return missed. In the proof case (two onsets tapped, locked for five minutes with eight taps sent, then the remaining six onsets tapped on time), the card read 2 of 8 with 14 extra taps. On a phone that suspends its audio, the taps after the return were still judged against the old grid: the tap on the next onset missed.
- **Now:** the click stops with the lock, including a click already scheduled and not yet heard. Nothing sent to the locked page counts. On return the pattern carries on from where it stopped: the next onset is the same distance away as it was when the phone locked (300 ms in the proof case), and the click comes back on that beat and every beat after it. The card reads 8 of 8 with no extra taps, and its recorded time counts only what was on screen (CL05's clock, now proved for this card too).
- **Locked during the count-in.**
  - **Before the count named the downbeat:** the count used to run on into the locked phone. Now it stops with the lock, and on return the card counts in again from the top. A card that opened behind a locked phone starts no count until the return. Either way, a hand finding its place during the new count is still not read as the first tap.
  - **After the count named the downbeat, before any tap:** a tap sent while locked used to start the pattern on the spot. Now it does nothing. On return the downbeat is as far ahead as it was when the phone locked, and a tap before it is still a stray. No second count is run over a downbeat already named.
  - **After the downbeat, before the first tap:** a tap sent while locked used to start the pattern on the spot; now it does nothing. The click was already quiet, waiting for the first tap, and it stays quiet after the return until that tap starts the pattern and the click on the tap's grid, as before.

**Any Drill card.**

- A key on the screen keyboard, a MIDI key or the sustain pedal sent while the page is hidden feeds, scores and moves on no card, of any kind. The card is still open on return, and the first key after it is its answer.
- *Average time to answer* on the end sheet no longer counts the lock. A card shown for 1 s, locked for 5 min and answered 400 ms after the return reads **1400 ms**. It used to read 301 400 ms. This is proved on the screen for a note-flash card. In the engine it is proved for each class that times an answer: the prompt-and-answer drill nine kinds share, Simon, dictation, and the pedal change, whose lift is judged clean or not on visible time.

**Counts.**

- **Tests:** 18 cases added to `app/tests/unit/drillLifecycle.test.ts`, 0 replaced, 0 deleted. Every CL05 case is unchanged and green.
- **Red at the base:** 17 of the 18 (`unit-red-committed.txt`). The 18th, a dictation progression finished before the hide, is a guard: the base was already right there, and the case exists to catch the naive fix (it kills mutant `dictation-heard-unmoved`).
- **Mutants:** 18 applied, 18 killed (`mutants.txt`): the brief's three and fifteen more.
- **Exit codes:** see *Tests and exit codes* below.

**The two playability questions, carried unresolved.**

1. The exact-span re-anchor restarts the judged grid the instant the page is visible again, with no lead-in: in the proof case the next onset falls 300 ms after the return, and the click comes back on that same beat. Should a lead-in, such as the count-in bar Chord Chart and Lab play on return, come before the resumed grid?
2. If the audio context is not running on return — a platform that will not resume it without a gesture, and no tap since — the re-anchored grid judges taps against a click the learner cannot hear. Should the card hold its grid until the audio is confirmed running, or until the first tap, rather than go on as it does now?

## Mechanism, per residue

**The shared shape.** The suspension boundary in `DrillScreen.ts` owns all three residues. The drill owns its moments, and the screen only says when, as `screenLifecycle.ts` puts it.

- `suspendDrill` sets a `suspended` flag and holds one reading of the moment the page hid (`hiddenAtMs`), on the first suspend of a span only.
- `resumeDrill` clears the flag and hands the span to the drill.

**Residue 1: the rhythm card's click and judged grid.**

- **Hide.** `suspendDrill` remembers whether the click was sounding and calls `metronome?.stop()`. `Metronome.stop()` already cancels clicks scheduled and not yet heard.
- **Return, the grid.** `RhythmDrill.excludeHidden` moves the grid on by the whole span through its own `startAt`, as the second read decided. The first-tap stamp moves with it.
  - It is a whole shift, not a clamp: a downbeat the count has named can lie ahead of the moment the page hid.
  - Before the count has named a downbeat, and before any tap, it moves nothing. The start is then only the moment the card appeared, and `startAt` would clear the drill's wait for the count. That wait is what keeps a stray from being read as the first onset.
- **Return, the click** (`resumeRhythmClick`).
  - If the count has not named the downbeat, the card counts in again (`startCountIn`).
  - Otherwise it awaits `audioEngine.ensureStarted()` and reads both clocks again (`clickAnchor = captureAudioClockAnchor(context)`).
  - If the click was sounding, it starts it on the next beat of the moved grid through `clickFromBeat`. That function holds `resumeClickAfterFirstTap`'s own arithmetic, extracted and shared. Before the first tap, that next beat is the downbeat, where the count-in's listener quiets it as it always has.
- **The two traps.**
  - *A card opened while hidden starting its click.* `startCountIn`'s continuation now returns on `suspended || asked !== suspensions`, the existing `suspensions` guard shape. `suspendDrill` runs before `ensureStarted()` resolves.
  - *The stray tap.* `downbeatKnown` moved from `startCountIn`'s closure to the screen (`countInDownbeatKnown`), so the return can tell a card still counting in from one past its named downbeat. Only the first counts in again.

**Residue 2: `meanReactionMs` and hidden time.**

- **The method.** An optional `excludeHidden(hiddenAtMs, visibleAtMs)` on `Drill`, on the precedent of `reveal?()`, as the second read decided. `resumeDrill` calls `drill?.excludeHidden?.(hiddenAtMs, now)` once per span.
- **`pastHidden`** (`engine/drills/types.ts`) states where a recorded moment lands:
  - before the span, it moves on by all of it;
  - inside the span, it moves to the span's end, where the learner first saw the card (a card opened while hidden);
  - after the span, it stays.
- **Per kind:**
  - `PromptDrill` and `SimonDrill` move `promptAtMs`.
  - `ChordDictationDrill` moves `promptAtMs`, `lastNoteMs` and every heard chord's `atMs`. The prompt alone would not do: a progression finished before the hide would come back answered in nought (mutant `dictation-heard-unmoved`).
  - `PedalDrill` moves the chord, lift and press moments.
  - `RhythmDrill`: residue 1.
  - `DynamicsDrill` holds no time. `BackingTrackDrill` times no answer. Neither has the method.

**Residue 3: input sent to a hidden page.**

- **Where.** `onNote` (keys, MIDI, the microphone) and `onControl` (CC64) return at their top while `suspended`, before any per-kind rule. The existing stronger rules are left alone: `answeredCurrent` and Simon's answer gate.
- **The flag, not `pageHidden()`.** A `pagehide` suspends without making the page read hidden. A case proves it: mutant `flag-read-as-pageHidden` is red.
- **The same flag in `playPromptWithHelp`.** A card that opens after a `pagehide` is suspended too: `pageHidden() || suspended` where CL05 had `pageHidden()`. That case was red at the base.

**The stop condition is not met.** No new state or owner was needed:

- The drill still owns its grid and its moments.
- The screen holds one hide time, the same kind of local as `loopHeld`.
- `countInDownbeatKnown` is the existing closure flag, made readable by the return.

## Tests and exit codes

| Case (all class **add**) | The committed screen's assumption it refutes | Red at the base |
| --- | --- | --- |
| A live rhythm card: no click and no judged tap while hidden; the grid moved by the span; the remaining onsets on time; the click back on the next beat of the moved grid; visible time recorded | the click and the grid run on wall time; a tap to a hidden page is an extra tap | *the click kept sounding into a hidden page: expected [ Array(600) ] to deeply equal []*; *a tap to a hidden page was judged: expected 10 to be 2*; *expected 2100 to be 302100*; *the taps after the return missed the grid: expected 2 to be 8*; *taps were counted extra: expected 14 to be +0* |
| The audio clock stood still while hidden: the click comes back on the grid, read through fresh clocks | the count-in's single clock reading holds across a hidden span | *the tap on the next onset was not judged on time: expected 2 to be 3* |
| A rhythm card opened while hidden: no click until the return; then a count from the top that still refuses a stray | the count-in's continuation starts the click whatever the page is | *the click started into a hidden page: expected "start" to not be called at all, but actually been called 1 times* |
| Hidden mid-count, before the downbeat is named: the count stops, starts again from the top on return, and refuses a stray | the count runs on its own clock whatever the page is | *the count went on into a hidden page: expected [ 0.6, 1.1, 1.6 ] to deeply equal []* |
| Hidden after the downbeat, before any tap: a hidden tap does nothing; quiet until the first tap after the return; the click on that tap's grid | nothing stands between a hidden tap and the latch | *a tap to a hidden page started the rhythm: expected 3400 to be null* |
| A tap sent to a hidden page after the count named the downbeat; the downbeat back as far ahead as it was; no second count | nothing stands between a hidden tap and the latch | *a tap to a hidden page started the rhythm: expected 2525 to be null*; *the downbeat did not move past the hidden span: expected 2525 to be 302100* |
| A note-flash card: 1 s, hidden 5 min, answered 400 ms after the return, reads *1400 ms* | a card's answer time is wall time | *expected '301400 ms' to be '1400 ms'* |
| An open card is not answered from the screen keyboard while hidden | input reaches the card whatever the page is | *a key to a hidden page answered the card: expected 'correct' to be ''* |
| …nor from a MIDI piano | the same | *the card moved on while hidden: expected '2 of 10 · 1 right' to be '1 of 10 · 0 right'* |
| A `pagehide` with the page still reading visible refuses a key until `pageshow` | (the flag's own reason) | *a key after pagehide answered the card: expected 'correct' to be ''* |
| A card that opens after a `pagehide` sounds nothing | a card opened while suspended is re-suspended only when the page reads hidden | *the first chain sounded after the page was hidden: … called 1 times* |
| The pedal sent to a hidden page reaches no pedal card | the same as the keys | *the pedal fed a card on a hidden page: … called 2 times* |
| Engine, a prompt card: hidden time leaves the answer's time; a card opened while hidden is timed from the return | (new method) | *expected [ 302400, 300400 ] to deeply equal [ 2400, 400 ]* |
| Engine, a Simon card | (new method) | *expected 302400 to be 2400* |
| Engine, dictation: hidden time between two chords | (new method) | *expected 302500 to be 2500* |
| Engine, dictation: a progression finished before the hide keeps its time (guard) | — | green at the base; killed by `dictation-heard-unmoved` |
| Engine, a pedal change: a lift after the return judged on visible time | (new method) | *expected 300100 to be 100* |
| Engine, a rhythm grid moved by the whole span; nothing moved before a downbeat is named | (new method) | *expected 1000 to be 301000* |

**The audio double.** `audio.available` is false for every case but the six rhythm ones, so jsdom's own answer stands everywhere else: `ensureStarted` refuses, and the rhythm card takes its no-metronome path. The CL05 cases therefore run exactly as before. The double is a context with the six factory methods the real `Metronome` calls. A source node's `start(when)` is a click; the metronome's `stop(now)` before `when` cancels it. Its clock is the faked one, and a case can stand it still. The `webMidiSource` subscriptions are spied, so a case can play a MIDI key and the pedal.

**Mutants, 18 of 18 killed** (`mutants.txt`; each applied to the fixed source, the final file of 29 cases run, the source restored and byte-compared):

| Mutant | Killed by |
| --- | --- |
| `click-not-stopped` | the live card; mid-count; the stray tap |
| `grid-not-moved` | the live card; the frozen clock; the stray tap; the engine rhythm case |
| `click-never-returns` | the live card; the frozen clock; the stray tap |
| `no-count-on-return` | opened while hidden; mid-count |
| `reaction-not-excluded` (the screen never asks) | 1400 ms; the rhythm cases |
| `prompt-unmoved` | 1400 ms; the engine prompt case |
| `simon-unmoved` | the engine Simon case |
| `dictation-heard-unmoved` | the dictation guard |
| `pedal-chord-unmoved` | the engine pedal case |
| `clamp-removed` | the card opened while hidden |
| `key-input-not-refused` | both open-card routes; the pagehide key; the live card; after the downbeat; the stray tap |
| `pedal-input-not-refused` | the pedal case |
| `flag-read-as-pageHidden` | the pagehide key |
| `opened-after-pagehide` | the card opened after a pagehide |
| `count-in-starts-hidden` | opened while hidden |
| `recount-on-every-return` | after the downbeat; the stray tap (*a second count moved the downbeat: expected 303625 to be 302100*) |
| `rhythm-provisional-moved` | opened while hidden (*expected 300025 to be null*); mid-count; the engine rhythm case |
| `stale-anchor` | the frozen clock (*the click did not come back on the grid: expected undefined*) |

The brief's three are `click-not-stopped`, `reaction-not-excluded` and `key-input-not-refused`.

**Exit codes** (`chain.txt`):

- `npx tsc -b`: 0.
- `npm run lint`: 0.
- `npx vitest run tests/unit/drillLifecycle.test.ts`: 0, 29 of 29 (`unit-green.txt`).
- `npx vitest run`, the whole unit suite: 1. 5 of 7,545 failed, none in a file this seam touches. This ran before the last two rhythm cases were added. Those two touch only the lifecycle file, which was then run alone (29 of 29), as were typecheck and lint.
  - Two are the CRLF-only `lessonClaimsAboutApp` claims CL05 recorded (blues.3 and 4.7). They read `ScoreScreen.ts` and `style.css`, both untouched here and checked out CRLF in this worktree.
  - Three are a fresh worktree's environment: `midiParity` has no reference, `taughtByAncestry` has no `build/rung-claims.json`, and `tempoSoundAgainstMark` hit its 5 s limit under the whole suite's load. After `parity_reference.py` and a read-only copy of the main checkout's `build/rung-claims.json`, the three files run alone: 0.
- The neighbouring suites, with the main checkout's content copied read-only: 1, 720 passed, and the same two CRLF claims.
- `npm run build:app`: 0.
- `checks_for_paths.py` over the seven paths: 0. It maps `tsc`, `lint`, `unit`, `build-app` and 22 browser specs.

## What passes, and what is unverified beside it

- **Passes:** every case above, in jsdom with a faked clock and the real `Metronome`; CL05's cases unchanged; the neighbouring Drill, metronome, count-in and lifecycle suites (`unit-green.txt`).
- **Unverified on a device:** whether a phone keeps the `Metronome`'s timer and the audio clock running while hidden, throttles them or suspends them. Both are modelled by the double (a running clock, and one that stands still); neither was observed on a device. Whether a platform resumes the audio context on return without a gesture is the subject of question 2.
- **Unverified in a browser:** the 22 specs the check map names were not run. No mutant survived jsdom, so the dispatch allowed none.
- **One count click can be lost.** A lock within the scheduler's look-ahead before the count-in's last click cancels that click with the hide, and it is not played on return. The return then starts the click at the moved downbeat. The real `Metronome` cannot start part-way through a count-in: `BeatScheduler` numbers count-in beats by index, so a count started on its last beat would number bar 1 as count-in too. The stray-tap case is in exactly this window, and its silence assertion covers it.
- **Not heard:** nothing. No musical claim is made.

## Deviations from the brief

1. **The method takes the span, not a delta:** `excludeHidden(hiddenAtMs, visibleAtMs)`. A card opened inside the span has to be timed from its end. A delta from one held hide time overshoots such a card into a negative time, clamped to nought (`clamp-removed`).
2. **Dictation moves more than `promptAtMs`**, and **the pedal drill has the method.** Premise 14 names `promptAtMs` in three files. The dictation answer's time is the last chord's minus the prompt's, so the chords move too. The pedal lift is judged clean on its time from the chord, so a change the page hid in the middle of was judged on hidden time.
3. **`RhythmDrill.excludeHidden` moves the first-tap stamp as well as the grid.** The grid moves through `startAt`, as decided. The stamp is read only as a null check once the latch is spent; it moves so the card's moments stay one consistent set.
4. **`playPromptWithHelp` re-suspends on the flag**, beyond the brief's owned functions. It is the same reason premise 15 gives for the input guard, and a case that was red at the base proves it.

## Done

1. **The rhythm card's click and judged grid stop while hidden and come back on the same point of the same grid.** This goes through `startAt`/`startedAt` with one held hide time. The clock reading is taken again on return, and the count runs again only before it has named a downbeat.
2. **`meanReactionMs` excludes the hidden span on every kind that times an answer**, through the optional `Drill.excludeHidden`.
3. **Hidden key, MIDI, microphone and pedal input is refused** at `onNote`/`onControl` by the flag `suspendDrill` sets and `resumeDrill` clears.
4. **The traps**, each proved by a case red at the base and a killed mutant:
   - the stray tap;
   - a card opened while hidden starting its click;
   - `clickAnchor` recaptured.
5. **An audio/metronome double** so jsdom can prove silence: the real `Metronome`, a minimal context.
6. **The stop condition was checked and is not met** (*Mechanism*).
7. **Red first**, quoted; CL05's cases unchanged; 18 mutants killed.
8. **This entry**, the kept logs and the proposed doc rows.

## Not done

- **The 22 browser specs `checks_for_paths.py` maps** to these paths. Not run: the dispatch allows Playwright only if a mutant survives jsdom, and none did. They stay with the landing chain.
- **The device check.** There is no device here. See *Unverified*.
- **The two playability questions.** Recorded as questions, not decided.

## Follow-ups (recorded, not built)

1. **The downbeat click is silent until the first tap, on every rhythm card.**
   - At bar 1 beat 1, with no tap yet, the count-in's listener calls `metronome?.stop()`. Its comment says *The downbeat, already scheduled, still sounds*.
   - Since `Metronome.stop()` cancels clicks scheduled and not yet heard (its own comment at `Metronome.ts` records that change), the downbeat click is cancelled instead.
   - Observed in this file's click record, on the committed code: the stray-tap case's heard clicks at the base run 1.6 s (the count's last click), then 3.025 s (the click the hidden tap restarted). The downbeat at 2.1 s is absent (`unit-red-committed.txt`).
   - It is unrelated to hiding. Observation for T8/X15.
2. ***Listen back* after a hidden span plays the span as silence.** `BackingTrackDrill` records each note's input time, and `playRecording` plays the gaps as they are. This is not a time to answer, so it is outside the required change. Observation for X15.
3. **CL05's follow-ups 3 and 5** (the non-Simon ear prompt's interruption notice; `sessionRunner.ts` adopting `activeClock`) stay as CL05 recorded them. X16, U19 and U39 stay open.

## Questions

The two playability questions above. Nothing else needs an answer before landing.

**Orchestrator's note at the landing (2026-09-30).** CL05a's worktree committed by name (8764c643) and merged (83c8655b). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/CL05a/map-min.txt`), typecheck, lint, the whole unit suite, the app build, the spec names checked, then the specs the map's minimum names on the default port (map-tests 0; map-min 0; tsc 0; lint 0; vitest-all 1; build-app 0; specs-exist 0; e2e-targeted 0; vitest-timeouts-rerun 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; the other failures were load and pass alone (`vitest-timeouts-rerun`); `runs/CL05a/orchestrator-exit.txt`). CL05's review, approved with one required change (`responses/4923be59.md`): the handoff's own follow-up list exposes one unfinished part of the seam's core invariant on Drill — while hidden, a rhythm card can still click/judge, reaction time can still include the hidden span, and hidden key/MIDI input can still reach a Drill card. Required change, quoted at length: *A rhythm card must not keep its click/judged grid advancing while hidden. If simply stopping its clock would shift the scoring origin, suspend and re-anchor that origin on return so the same visible-time relationship is preserved. Do not leave the judged clock running merely because re-anchoring takes work. `meanReactionMs` must exclude the hidden span for the card that was interrupted. Hidden wall time is not learner reaction time. Key/MIDI events received while the Drill screen is hidden must not feed, score or advance a Drill card. The suspension boundary, not the individual drill kind, should own that refusal unless a card has a stronger existing rule ... This is a required-change fast path: it does not introduce a new product choice.* Dispatched under the fast path this response opens, closing CL05's own follow-ups 1, 2 and 4 (`runs/CL05/ENTRY.md`, Follow-ups section).. hidden is not practice for Drill finished: the rhythm card re-anchors by the hidden span, hidden input refused, hidden time excluded from every timed answer; two playability questions and two new rows (X43, X44) with the reviewer

## Doc rows (proposed, not written)

**`docs/04-ui-spec.md` §0 R7** (CL05's proposed rule, still unwritten). Add after *…hidden time is never counted as practice.*:

> Nothing sent to a hidden page — a key, a MIDI note, the pedal — feeds, scores or moves on a card, and a card's time to answer counts no hidden time (CL05a). A rhythm card's click and the grid its taps are judged on stop with the page and come back on the same point of the same grid, with the clock reading taken again; a count-in that had not yet named its downbeat counts in again from the top.

**`docs/08-test-map.md`, CL05's proposed row *A practice screen while hidden*.** Add to the pieces: `engine/drills/types.ts` (`Drill.excludeHidden`, `pastHidden`) and each drill's `excludeHidden`. Add to what it guards:

> a rhythm card's click or judged grid running on while hidden, or coming back off its grid; a tap to a hidden page started or judged; a second count over a downbeat already named; hidden time in a card's time to answer or a pedal lift; a key, a MIDI note or the pedal fed to a card while hidden, including after a `pagehide` that leaves the page reading visible

Its tests cell becomes `drillLifecycle.test.ts` (29: 11 CL05, 18 CL05a), red first; 18 more mutants caught (CL05a, Entry 194).

## Content

Nothing under `content/` or `scores/` changes. This seam changes interaction and timing only. The one learner-facing change is the one itemised under *Judgement*.

## Files

- `app/src/ui/screens/DrillScreen.ts`
- `app/src/engine/drills/types.ts`
- `app/src/engine/drills/special.ts`
- `app/src/engine/drills/PromptDrill.ts`
- `app/src/engine/drills/harmony.ts`
- `app/src/engine/drills/simon.ts`
- `app/tests/unit/drillLifecycle.test.ts`
- `docs/prompts/runs/CL05a/` (this entry, `unit-red-committed.txt`, `unit-green.txt`, `mutants.txt`, `chain.txt`)
