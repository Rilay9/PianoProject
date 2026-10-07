### Entry 187 — CL05 — a hidden page is not practice: Drill, PDF, Chord Chart and Lab stop what advances and what sounds while the phone is locked or the app is behind another, come back where they were, and a card's recorded time counts visible time only (backlog X15, in part; convergence CL05; U19 and U39 named, not closed; app only) (2026-09-30)

Base: `122a5224` (origin's head at dispatch). The brief is `docs/prompts/tasks/CL05-practice-lifecycle.md`, approved for dispatch by `docs/review/responses/questions-e71ef3ad.md` §CL05, with the Simon-chain ruling and the second read's notes folded in. Its line numbers were read at `43278119` and held at the base: every premise was checked at the lines before the build. Five source files changed. `ScoreScreen.ts`, `sessionRunner.ts` and `sessionRun.ts` are untouched.

## Judgement

**Layers.** Everything below was observed in the unit layer: jsdom, the real screens, a faked clock and a forged `document.visibilityState`. No browser case was added and no device was used. Nothing here was heard. No actor in this process can hear, and no musical claim is made: this seam changes interaction and timing, not musical content. The resume points and the count-in on return are interaction choices, listed under *Judgement calls* below.

**What a learner now meets, per screen.**

- **Drill.**
  - **Recorded time counts visible time only.** This holds on all four rows the screen writes: a drill set, the checklist, the placement test and the tour. Play 20 s, lock the phone for 5 min, play 10 s, and the row says 30 s. It used to say 330 s.
  - **The backing loop with its chart.** While hidden, the chart holds its bar and the loop is silent. On return, loop and chart resume together from the downbeat of the bar they were in: that bar's chord sounds again, and the chart is neither ahead nor back at bar 1.
  - **A Simon chain cut off by hiding** sounds nothing more while hidden. It comes back silent, and the status line reads *Interrupted — press ▶ Play again to hear the chain.* instead of the stale *Listen — the app is playing.* A key pressed before ▶ Play again is not scored, and the card is not moved on. ▶ Play again replays the chain from its first note, and after that a key is an answer again. A drill opened while the page is already hidden behaves the same way.
  - **A right/wrong pause that is running when the page hides** no longer runs out into the next card and its sound. On return the card is held with *Tap the card to move on.* A tap moves on, and only then does the next prompt sound.
  - **Harmonic dictation.** Its ticker does not run while hidden and starts again on return. **Premise 9's learner-visible consequence was not reproduced.** The silence rule reads the input timeline, where a hidden span is silence either way. The ticker never changes the length of `chordsHeard`, so what the learner sees is segmented the same before and after. The only change is that nothing ticks while hidden.
- **PDF.**
  - **Timed turns no pages while hidden** and fires no queued turn on waking. On return, the system on screen gets its whole interval again. 20 s, hidden 5 min, 10 s at ten seconds a system is 3 turns; it used to be 33.
  - **The 🥁 click**, if it is on, stops while hidden and starts again on return. This is beyond the brief's PDF bullet: see *Judgement calls*.
- **Chord Chart.**
  - **While hidden**, the click, the bass and drums and the comp chord stop, and the chart holds its bar.
  - **On return** it counts in again, with the learner's own count-in, as *Count off ▶* does. It then resumes on the bar that was sounding, from its downbeat. It never shows *Bar 1 · chorus 1* on return, and never choruses ahead. 20 s, hidden 5 min, 10 s reads *Bar 4 of 4 · chorus 4*; it used to read *Bar 2 of 4 · chorus 42*.
- **Lab (trading fours).**
  - **While hidden**, the loop, the bed and the app's call stop, and notes played to the hidden page are not collected.
  - **On return** it counts in, then plays the cut bar from its downbeat. A call that was cut off carries on from that bar.
  - **The learner's window is their bars as heard.** It moves with the bars, and whatever was played in the cut bar goes with it.
  - **A hidden phone is never charged *You did not come in*** for bars it did not show. The committed screen printed exactly that line after a hidden span.

**Counts.**

- **Tests:** 34 cases added in 5 new files, 0 replaced, 0 deleted; every existing test is unchanged.
- **Red at HEAD:** 23 of the 25 screen cases (`unit-red-committed.txt`). The two that pass on both are guards on the resume path: the PDF click stays off on return when it was off, and Stop followed by hide and show starts nothing on the Chord Chart. The 9 primitive cases test new exports, so there is no committed behaviour for them to be red against.
- **Mutants:** 14 applied, 14 killed (`mutants.txt`): the brief's 8 and 6 more.
- **Exit codes:**
  - `npx tsc -b`: 0.
  - `npm run lint`: 0.
  - `npx vitest run`: 1. 2 of 7,576 fail. Both are environment, not this change: `lessonClaimsAboutApp.test.ts` matches `\n` literals against `ScoreScreen.ts` and `style.css`, which this worktree checked out as CRLF. Both predicates are true on the LF blobs git commits (`chain.txt`).
  - `npm run build:app`: 0.
  - `checks_for_paths.py`: 0. It maps 21 browser specs to these paths, which were not run here: see *Not done*.

**The three open questions, stated as questions.**

1. **X16:** which non-verbal audio cue — ready, complete, next, or none — should mark a suspend or a resume, now that the suspended state exists on these four screens? That choice can be made in text. Whether a cue is heard as distinct from the click and the piano, which X16's row asks to test at the instrument, is something no one in this process can decide, so that part stays open.
2. **U19:** should the on-screen keyboard hide while playing unless the mode needs it, with a thin tappable status strip — and on which screens?
3. **U39:** does any of Drill, PDF, Chord Chart or Lab restart a run with nothing said when an option changes mid-run, the way Score's settings do? What was read here is scoped, not a search of every option handler:
   - Lab's pickers stop the jam and say *Settings changed — press Jam it again to hear them* (`LabScreen.ts` `redraw`).
   - The Chord Chart's bpm field sets the metronome's tempo live, with no restart.
   - PDF's bpm and bars fields re-arm Timed from the system on screen. The interval starts again and nothing is said.
   - The Simon help chips replay the chain on the learner's own tap.

**The map's proof line, as stated** (`convergence-2026-09-30.md`:172). The fake-clock case (play 20 s, hidden 5 min, play 10 s, counted about 30 s) is met on each screen, and each case was red at HEAD. The figures come off the faked clock, not measurements:

| Screen | After the fix | At HEAD |
| --- | --- | --- |
| Drill: the four recorded rows | 30 000 ms each | 330 000 ms |
| Drill: the form chart | reads 30 s in | *Bar 2 of 4 · pass 42* |
| PDF | 3 turns | 33 turns |
| Chord Chart | bar 16 of the run | *chorus 42* |
| Lab | bar 16 of the run, with trades | *pass 21* |

The repeated hide-and-show case is on the Chord Chart: three visible spans with three different hidden ones count exactly the 20 s shown, with one metronome started once per return. Against the committed screen it read *Bar 1 of 4 · chorus 101*. The shared clock also has a four-cycle case (`screenLifecycle.test.ts`).

**Judgement calls made in the build**, for the reviewer to confirm or overturn:

1. **Drill's backing loop resumes its sound on return, with its chart.** The brief says the form ticker resumes on show, and the screen's own rule is that the chart follows the sound. The brief also has Chord Chart and Lab resume their audio. The alternative, silence until ▶ Play again, would restart the loop from bar 1.
2. **The resume point is the downbeat of the bar that was sounding**, not the exact beat. This holds on Drill's loop, the Chord Chart and the Lab, so no material is skipped. Chord Chart and Lab count in first, with the learner's count-in setting. Part 20 §4's *count-ins under one documented policy* is not decided here.
3. **A card whose pause was running waits for a tap on return** rather than re-arming the pause. Re-arming would start the next prompt's sound unasked, which is the reason the ruling gives for Simon.
4. **The PDF click stops and restarts with the page.** It is not in the brief's PDF bullet, but it is the same fault: unattended sound into a hidden page, which the brief's shared hypothesis names for metronomes.
5. **Lab drops what was played in the cut bar and over the resume's count-in.** Everything played earlier moves along with the window.

**Verdicts.** *Technical:* the four screens now implement one suspend/resume contract through `screenLifecycle.ts`, and the per-attempt duration counts active time only. The contract is proved red then green per screen, with every mutant killed. *Pedagogical:* not applicable. Nothing taught or judged changes, beyond not judging bars nobody could see.

## Per screen: the mechanism, the discriminating test, the red line

**The shared primitive.** It lives in `app/src/ui/screenLifecycle.ts`.

- `pageHidden()` (:46).
- `watchVisibility` (:59). It is driven by `visibilitychange`, with `pagehide` as a second hidden (the pair `sessionRunner.ts` listens for) and `pageshow` as a return. It fires hidden once per hidden span, and never fires visible while the document still says hidden.
- `onScreenSuspend(el, { onHidden, onVisible })` (:102). It is unsubscribed with the screen.
- `activeClock(el?)` (:141): visible-only milliseconds, with `restart` and `dispose`. It uses the session clock's accounting but is a separate instance, as the brief decided and the reviewer accepted.

A new case runs both clocks over one sequence: `sessionClock.test.ts`'s 10 s / 30 min / 5 s, then the map's 20 s / 5 min / 10 s. Both count the same 45 s. This is the reviewer's *keep the semantics aligned by tests*.

**Drill** (`DrillScreen.ts`).

- **Mechanism, duration.** `attemptClock` (:427) replaces `startedAtMs`. The four `Date.now() - startedAtMs` reads and the five restarts now go through it.
- **Mechanism, `suspendDrill` (:1593).** In order:
  - It bumps `suspensions`. Sound whose samples were still loading when the page hid is then never scheduled: the three `getPiano().then` blocks check it.
  - It keeps the loop's place floored to its bar (`loopHeld`).
  - It cancels every `playbackTimers` entry and stops the form ticker and the dictation ticker.
  - It takes down Simon's lights, name and staff.
  - For a chain still sounding (`performance.now() < simonAnswerFromMs`), it holds the gate at `Number.POSITIVE_INFINITY` and writes `SIMON_INTERRUPTED`. It never zeroes the gate, as `clearPlayback` would, and never calls `advance()`, so `SimonDrill.next()` does not score the unanswered chain.
  - It turns a running `feedbackTimer` into a tap hold (`holdAwaitsTap`; `cardHeld()`, :1385, now answers the three places that read the timer).
- **Mechanism, `resumeDrill` (:1644).** It replays the loop through `playPrompt(prompt, fromMs)`, which starts the chart at the same offset, and restarts the dictation ticker. The Simon chain and the held card wait for the learner.
- **Mechanism, opened while hidden.** `playPromptWithHelp` ends with `if (pageHidden()) suspendDrill()` (:1140), so a card that opens behind a locked phone is suspended from its first moment.
- **Discriminating tests and red lines at HEAD:**
  - Duration: *expected 330000 to be 30000*, on each of the four rows.
  - The chart held: *the chart moved while the page was hidden: expected { bar: 4, pass: 38 } to deeply equal { bar: 2, pass: 1 }*.
  - Simon sound while hidden: *the chain kept sounding into a hidden page: … called 1 times*.
  - The interruption: *expected 'Your turn — play it back.' to match /interrupted/i*. Its no-score assertion is red under the gate-zero mutant (*the interrupted chain was scored: expected 'wrong' to be ''*), and its silence assertion under the auto-replay mutant (*sound on return, with nothing asked for: … called 2 times*).
  - The feedback path: *the pause advanced to the next card while hidden: expected [ 72, 60 ] to deeply equal [ 72 ]*.
  - Opened while hidden: *the first chain sounded into a hidden page*.
  - Dictation: *the dictation clock advanced while the page was hidden: … called 5000 times*.

**PDF** (`PdfScreen.ts`).

- **Mechanism.** `onScreenSuspend` (:724): hidden calls `disarm()` and `metronome?.stop()`; visible calls `arm()` if the mode is not manual, and `startClick()` if the click was on. `arm()` refuses while hidden (:271). `startClick()` (:350) is the click's start, shared by the chip and the return. It checks disposal, the chip and visibility after the audio has started.
- **Red lines:** *the hidden span turned pages: expected 35 to be 5*; *a page turned while nobody was reading: expected 33 to be 3*; *the click kept going into a hidden page: expected [ 'start' ] to deeply equal [ 'start', 'stop' ]*.

**Chord Chart** (`ChordChartScreen.ts`).

- **Mechanism.**
  - `suspend()` (:302) keeps `running`, stores `barOffset`, the held bar of the run, and stops the metronome, the kit and the comp's piano.
  - `resume()` (:320) awaits `audioEngine.ensureStarted()`, because the platform suspends the audio context on a locked phone. It re-makes the kit, clears `barStarted` so that the resumed bar draws and comps, and calls `metronome.start()`. It does not call `start()`, which resets `bar`, `chorus` and `barStarted`.
  - `onBeat` reads `barAt(beat.bar + barOffset, …)` (:222).
  - `start()` and `stop()` reset the offset and a `resumeSeq` guard, so a slow resume cannot land after a Stop or a new count-off.
  - A start whose audio answers after the page hid suspends itself (:294).
- **Red lines:** *expected 'Bar 2 of 4 · chorus 42' to be 'Bar 4 of 4 · chorus 4'*; *the click kept going into a hidden page*; *expected 'Bar 1 of 4 · chorus 101' to be 'Bar 3 of 4 · chorus 3'* (repeated); *the count-in moved the chart*; *the click started into a hidden page*.
- **The naive-wiring mutant** (`onHidden: stop, onVisible: start`) reds all six cases, the count-in one with *the count-in moved the chart: expected 'Bar 1 of 4 · chorus 1'*.

**Lab** (`LabScreen.ts`).

- **Mechanism, `suspendJam` (:745)** keeps `running`, holds the bar, remembers its downbeat on the input timeline (`heldBar`), and stops the metronome, the kit and the piano. `collectNote` ignores notes while suspended (:988).
- **Mechanism, `resumeJam` (:767)** re-reads the clock anchor (the audio clock may have stood still), re-makes the kit and starts the metronome.
- **Mechanism, `resumeOnDownbeat` (:718).** At the first downbeat after a return:
  - It keeps the trade's notes played before the cut bar and moves them, and the window's start, on by exactly how far that bar's downbeat moved.
  - It drops what was played in the cut bar and over the count-in.
  - A call cut off is replayed from the cut bar, with its notes' beats re-based.
- **Wiring.** `onBeat` reads `barAt(beat.bar + barOffset, …)` (:683), and trades run on the bar of the run. `startJam`, `stopJam` and a picker's `redraw` reset everything, as before.
- **Red lines:** *expected 'Bar 6 of 8 · pass 21' to be 'Bar 8 of 8 · pass 2'*; ***hidden bars were judged: expected 'You did not come in' to match /^In on your own bars/***; *the call was left ringing*; *the loop started into a hidden page*. The window-unshifted mutant gives *expected 'Not inside your own bars' to match /^In on your own bars · 1 of 1/*.

## Tests

All 34 cases are class **add**. None was replaced: no existing test asserted the old behaviour.

| File | Cases | The committed screen's assumption each one refutes |
| --- | --- | --- |
| `app/tests/unit/screenLifecycle.test.ts` | 9: 20 s / 5 min / 10 s = 30 s; repeated spans add up visible time only; a pagehide after hidden is one span; restart and dispose; made while hidden; goes with its screen; suspend fires once per span and not after disposal; never visible while still hidden; agrees with the session clock over one sequence | (new API) |
| `app/tests/unit/drillLifecycle.test.ts` | 11: four duration rows; chart at 30 s; chart and loop held and resumed on the bar; dictation ticker idle while hidden; Simon silent while hidden; Simon interruption (silent, truthful line, no score, same card, replay from the first note); opened while hidden; a feedback pause running out while hidden | duration is wall-clock; the loop and its chart run on a clock that includes hidden time; scheduled notes play whether or not anyone is there; a chain's end opens the answer whenever it falls; a pause's timer always advances |
| `app/tests/unit/pdfLifecycle.test.ts` | 4: 20 s / 5 min / 10 s = 3 turns; nothing turns while hidden or on waking, and the system gets its whole interval; the click stops and returns; the click stays off if it was off (guard) | Timed's timer runs regardless; the click runs regardless |
| `app/tests/unit/chordChartLifecycle.test.ts` | 6: 20 s / 5 min / 10 s; silent and held, back on the bar; repeated hide-and-show; count-in on return holds the bar; a count-off whose audio arrives after hiding; Stop then hide and show starts nothing (guard) | the transport runs regardless; the only restart is `start()`, which rewinds |
| `app/tests/unit/labLifecycle.test.ts` | 4: 20 s / 5 min / 10 s; never charged for hidden bars, and the cut bar's notes dropped; a jam whose audio arrives after hiding; a call cut off resumes from its bar | the jam and its trades run regardless; the answer window is wall time |

**The test doubles.** The Chord Chart and Lab files use a metronome double that keeps time on the faked clock, with the real one's numbering, read from `Metronome.ts` and `BeatScheduler.ts`: count-in bars are 0, −1, …; bar 1 beat 1 is the first downbeat after them; every `start()` numbers from there again; and the first beat comes on the scheduler's next wake, never inside `start()`. The double first emitted beat 1 inside `start()`, which the real one does not. That surfaced a comp played twice on bar 1, a false fault; the double was corrected to match the real one before any red run was recorded. `chordChart.test.ts`'s hand-fired double is unchanged: it proves the first-bar comp, and it cannot show time passing while hidden.

**Preserved.** The neighbouring suites were run beside the new files, green (`unit-green.txt`): `chordChart`, `pdfScreenDetection`, `labVerdictOnStop`, `simonTurnCue`, `simonDrill`, `sessionClock`, `drillWalkthrough`, `dictationCard` and `drillAfterAMiss`. So was `lessonClaimsAboutApp`, which reads `LabScreen.ts` and `DrillScreen.ts` as text; its only failures are the two CRLF claims.

## What passes, and what is unverified beside it

- **Passes:** every case above, in jsdom with a faked clock; the full unit suite, bar the two CRLF claims; typecheck, lint and the app build.
- **Unverified on a device.** It is unobserved whether Android or iOS resumes the audio context on return without a gesture. Chord Chart, Lab, the PDF click and the Drill loop all call `ensureStarted()` or `getPiano()` on return. If a platform refuses and leaves the context suspended, the metronome's scheduler reads a clock that does not move. The chart or the jam would then stay held and silent, with *Count off ▶* or *Jam it* starting again from the top. That is read in the code, not observed.
- **Unverified in a browser.** The 21 specs the check map names were not run. That headless Chromium reports these pages visible is inferred, not checked: Score's own hidden handler and the session clock already sit under specs in that suite.
- **Unverified as copy:** *Interrupted — press ▶ Play again to hear the chain.* It was not rendered at 342 px, and it names no note, as the other two Simon lines do.
- **Not heard:** nothing. No musical claim is made, and none rests on this seam.

## Done

1. **The shared suspend/resume contract** for Drill, PDF, Chord Chart and Lab: `onScreenSuspend` over `visibilitychange`, `pagehide` and `pageshow`.
2. **The active-time primitive** is `activeClock`, written fresh in `screenLifecycle.ts`, as the orchestrator decided and the reviewer accepted. It is aligned with the session clock by a test.
3. **Drill's wiring**, per the brief: `formTimer`, `dictationTimer`, `playbackTimers` and `feedbackTimer` on hide. The form and dictation tickers resume fresh; the loop resumes with its chart (*Judgement call* 1). The duration sites use the active clock: four reads, five restarts.
4. **The Simon ruling** and the second read's notes, each proved:
   - The gate is held shut and never zeroed.
   - `advance()` is never called on hide, so `next()` never scores the chain.
   - The feedback path is closed.
   - The status line is truthful.
   - ▶ Play again replays from the first note.
5. **PDF**: `disarm()` on hide and `arm()` on show, plus the click (*Judgement call* 4).
6. **Chord Chart and Lab** resume their audio without `start()` or `startJam()` resetting `bar`, `chorus` or `tradeIndex`. Lab's trade clock stops while hidden and its window is visible bars only.
7. **Red first:** every case the brief names was seen red on the committed screens, quoted above.
8. **Mutants:** the brief's 8 each killed, plus 6 for the added guards.
9. **The repeated hide-and-show proof**, on the Chord Chart and on the primitive.
10. **The entry**, the kept logs and the proposed doc rows.

## Not done

- **The map's 21 browser specs** (`checks_for_paths.py`: `app-shell`, `chart`, `drills*`, `lab*`, `pdf*`, `trading-fours`, `session-run` and the rest). Not run: the dispatch allows Playwright here only if a mutant survives jsdom, and none did. They stay with the landing chain.
- **The whole unit suite green.** 2 of 7,576 fail: the CRLF claims described above, which hold on the LF form (as Entry 165 found for the same two).
- **The device check.** Not done; there is no device here. See *Unverified*.

## Follow-ups (recorded, not built)

1. **Drill's rhythm card** keeps its click and its judged grid running while hidden. Stopping the click without re-anchoring the drill's origin would change what the taps are judged against. Restart against resume, and the count-in, are Part 20 §4's explicit choices, attached to X15.
2. **Drill's reaction times** (`meanReactionMs`, from the engine's own clock) still include hidden time on the card the page hid on. It is not one of the four duration sites. Attached to X15.
3. **An ear prompt other than Simon's cut off by hiding** comes back silent with ▶ Play again available. No line says it was cut off, and those kinds have no answer gate, so a key is still an answer. The ruling covers Simon. Observation for X15.
4. **Keys and MIDI arriving while hidden** are still fed to a Drill card, except a cut-off Simon chain. The Lab now ignores them. Observation.
5. **`sessionRunner.ts` adopting `activeClock`** is left for a seam that owns both files, as the brief records.

## Questions

The three open questions above (X16, U19, U39). Nothing else needs an answer before landing. The five *Judgement calls* are for the post-build review to confirm or overturn.

## Doc rows (proposed, not written)

**`docs/04-ui-spec.md` §0, a new rule after R6:**

> **R7 — Hidden is suspended (X15, CL05, 2026-09-30).** A practice screen whose page is hidden — the phone locked, another app in front, the tab in the background — stops everything that moves on or sounds by itself. Nothing advances a card, a page, a bar or a trade while nobody can see it, and hidden time is never counted as practice. Visible puts the screen back where it was: the bar that was sounding, from its downbeat, after a count-in where the screen counts in; the system that was on screen, with its whole interval. Nothing is skipped, nothing is caught up, and nothing sounds on return unless it was already sounding as accompaniment. A prompt the learner was being asked to hear back waits to be asked for, and is not scored until it has been heard. Disposal stays terminal. Drill, PDF, Chord Chart and Lab share `screenLifecycle.ts`'s `onScreenSuspend` and `activeClock`; Score keeps its own handler, and the session clock in `sessionRunner.ts` its own accounting, aligned by test.

**`docs/08-test-map.md`, a row in *The pieces*:**

> | **A practice screen while hidden** (X15, in part; CL05): `ui/screenLifecycle.ts` (`pageHidden`, `onScreenSuspend`, `activeClock`); the suspend and resume paths of `DrillScreen.ts`, `PdfScreen.ts`, `ChordChartScreen.ts` and `LabScreen.ts` | hidden time counted as a card's practice; a chart, a page, a chorus or a trade advancing while hidden; sound into a hidden page; a chart rewound to bar 1 on return; a queued page turn on waking; a cut-off Simon chain replayed unasked or scored before it is heard again; a feedback pause running out into the next prompt; a hidden phone charged for bars it did not show | `tests/unit/screenLifecycle.test.ts`, `drillLifecycle.test.ts`, `pdfLifecycle.test.ts`, `chordChartLifecycle.test.ts`, `labLifecycle.test.ts` (added) — red first; 14 mutants caught | done (CL05, Entry 187); nothing heard; no device; X16, U19 and U39 open |

**One line each under *Every spec file*, in alphabetical place:**

> - `chordChartLifecycle.test.ts` — the chart while hidden: silent and held, back on its bar after a count-in, never rewound; repeated hide-and-show counts visible time only (X15).
> - `drillLifecycle.test.ts` — the drill while hidden: a card's time is visible time; the loop and its chart held and resumed on the bar; no sound into a hidden page; a cut-off Simon chain silent and unscored until *▶ Play again* (X15, the reviewer's ruling).
> - `labLifecycle.test.ts` — trading fours while hidden: the trade clock stops, the window is the bars as heard, no *You did not come in* for hidden bars, a cut-off call resumes on its bar (X15).
> - `pdfLifecycle.test.ts` — Timed while hidden: no turn while hidden or on waking, the system's whole interval on return, the click stopped and restored (X15).
> - `screenLifecycle.test.ts` — the shared suspended state and the attempt clock, which agrees with the session clock over one sequence (X15).

## Content

Nothing under `content/` or `scores/` changes, and no lesson, curriculum, catalogue or score byte is touched. There is no `*.content.md` to itemise.

## Post-action gate

The intent was that a backgrounded phone never advances practice or counts as practice on these four screens. It is met at the unit layer on each screen, red then green.

- **Rulings.** No owner or reviewer decision is contradicted: the Simon ruling is implemented in its own words, and Score, the session clock and the session instance are untouched.
- **Side effects.** Learner truth changes in one direction only: recorded durations get shorter where time was hidden. Evidence, material identity and curriculum are unchanged.
- **Nothing added to the backlog.** The five follow-ups are observations attached to X15, not new rows.
- **Status.** VERIFIED: the unit cases, the mutants and the chain above. NOT YET VERIFIED: the browser set and a device. HYPOTHESIS: that headless Chromium keeps these pages visible in the e2e suite.

## Files

- `app/src/ui/screenLifecycle.ts` (modified)
- `app/src/ui/screens/DrillScreen.ts` (modified)
- `app/src/ui/screens/PdfScreen.ts` (modified)
- `app/src/ui/screens/ChordChartScreen.ts` (modified)
- `app/src/ui/screens/LabScreen.ts` (modified)
- `app/tests/unit/screenLifecycle.test.ts` (new)
- `app/tests/unit/drillLifecycle.test.ts` (new)
- `app/tests/unit/pdfLifecycle.test.ts` (new)
- `app/tests/unit/chordChartLifecycle.test.ts` (new)
- `app/tests/unit/labLifecycle.test.ts` (new)
- `docs/prompts/runs/CL05/ENTRY.md`, `unit-red-committed.txt`, `unit-green.txt`, `mutants.txt`, `chain.txt` (new; every kept log is under 300 KB, with machine paths replaced by `<worktree>` and `<home>`)
