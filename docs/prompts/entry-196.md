### Entry 196 — CL05b — a rhythm card back from a locked phone waits until its click can be heard — saying so, and taking a tap on the card to bring the sound back — counts in once without judging, and then goes on from the note it stopped at (CL05a's required change, `responses/8764c643.md`; point 3 by the reviewer's ruling, `responses/questions-91f683ff.md`; app only) (2026-10-01)

Base: `cc45b3a8`, confirmed with `git log -1 --format=%h` before any edit. The brief is `docs/prompts/tasks/CL05b-a-rhythm-card-resumes-only-after-audible-re-orientation.md`, under the fast path, with the orchestrator's corrections from the second read (`docs/review/second-reads/cc45b3a8.md`, item 3) forwarded during the build. Point 3 was built after the reviewer ruled on it (`responses/questions-91f683ff.md`, "CL05b — non-judged resume action": option (a)), in the same worktree on the same base. Its line numbers held at the base. One source file and one test file changed: `app/src/ui/screens/DrillScreen.ts` and `app/tests/unit/drillLifecycle.test.ts`. `special.ts`, `AudioEngine.ts`, `Metronome.ts`, `screenLifecycle.ts` and every other drill kind's resume are untouched.

## Judgement

**Layers.** Everything below was observed in the unit layer: jsdom, the real Drill screen, a faked clock, a forged `document.visibilityState`, the real `Metronome`, and CL05a's click-record audio double, extended with an engine state the case controls. No browser and no device were used. Nothing was heard, and no one in this process can hear. **Pedagogical verdict: not applicable.** This is an interaction and timing fix. Whether one bar of count-in is enough to find the pulse again after an interruption is a musical judgement no one in this process can make; the reviewer's text rules "one count-in", and that is what is built. The figures come from the faked clock. They are test inputs, not measurements.

**The proof case:** two bars of quarter notes at ♩=120 in 4/4. The learner has tapped the first two notes on time, and the phone locks 200 ms after the second, five minutes long.

**What a learner meets on return.**

- **Before (CL05a, at the base):**
  - The pattern is live the instant the screen lights. The next note is due 300 ms later, and the click comes back on that same beat.
  - If the phone's sound has not come back, taps are still judged, against a click that is not playing. Taps placed where the next notes fall, sent while the sound was still suspended, were scored: the card counted 7 answers where it had 2, and the note that was next at the lock was used up before any sound.
- **Now, once the sound is running:**
  - One bar of count-in: four clicks at the card's tempo, on the card's own beats. The accent and the status line follow where those beats sit in the bar, so in the proof case the line reads *Count-in — 2*, *3*, *4*, *1*, not 1 to 4. The reviewer may prefer a count that always reads 1 to 4; the accent would then sit off the grid's bar line.
  - Then the click goes on with the pattern from the beat the phone locked in. That is beat 2, already played and not judged; the next note is beat 3.
  - Judging starts again at the exact point of the pattern where the lock came, so the third note is the first one judged.
  - A tap while waiting, or during the count, is neither right nor extra.
  - The card ends 8 of 8 with no extra taps. The time it records still counts only what was on screen.
- **Now, while the sound is not running:** nothing on the card moves or counts, and the card says so.
  - The line under the card reads *Sound is paused — tap to continue.* in place of *Tap the rhythm on any key.*, and only while the sound is not running.
  - The card itself is then a button: a tap or a click on it, or Enter or Space once it has the keyboard focus. Its one job is to ask for the sound inside that tap, the only place a phone that suspends sound on a lock honours the ask.
  - If the sound still will not come, the card stays paused and held, and judges nothing. Once it runs, the sentence goes, the card is no longer a button, and the one count-in follows.
  - A key on the screen keyboard or the piano is never the way back. It asks for nothing and is not judged, because it is the answer the learner means next.
  - On a phone whose sound comes back by itself the pause lasts only until the start answers, and the count follows.
  - This covers a start that never answers and a start that answers with the context still suspended.
  - It holds for any length of time: a one-minute wait is not counted, and the note next at the lock is still the next one judged.
- **Locked before the first tap, after the count named the downbeat** (during the count's last beat, or after the downbeat in silence):
  - On return one bar of count-in leads to the downbeat again.
  - It is quiet after the downbeat until the first tap, as on the card's first count, and a tap during the count does not start the pattern.
  - CL05a ran no second count here: the downbeat came about half a second after the screen lit, or the card waited in silence for a first tap with no pulse given.
- **Locked before the count named the downbeat, or opened behind a locked phone:**
  - It counts in from the top, as before, but only once the sound runs.
  - While the start goes unanswered, no tap is judged against the moment the card opened (the second read's case; at the base 4 such taps were scored).
- **Locked again while waiting:** the point in the pattern and the click are the first lock's. Neither lock nor the wait between them is counted.
- **No Web Audio at all:** there is no sound to wait for, and the card has had no click from its first moment ("No metronome — …"). It carries on at once, as CL05a left it. This is a choice, put as question 2.
- **On a phone whose sound needs a fresh tap to come back:** the tap on the paused card is that tap (the reviewer's option (a)). Whether a particular phone honours it is not observed here (*Unverified*).
- **Not looked at:** the card's look while paused. No style was added, so on a desktop the pointer does not change over the card as it does over a held card (`DrillScreen.css`, not owned here; follow-up 4).

**Counts.**

- **Tests:**
  - 9 cases added (6 for points 1, 2 and 4, 3 for point 3) and 4 of CL05a's rewritten to the new rule (the orchestrator's correction 1, each with the assumption it drops below).
  - The other 25 CL05a cases are unmodified and green, including the two count-from-the-top cases (opened while hidden, hidden mid-count), which gain the hold without a changed line.
  - The file holds 38 cases.
- **Red at the base:** 8 of the first 10 added or rewritten cases (`unit-red-committed.txt`). The other two are guards, green at the base by construction (rhythm-only; no Web Audio). Each is killed by its mutant.
- **Red before point 3:** the 3 point-3 cases, with points 1, 2 and 4 already built (`unit-red-point3.txt`).
- **Mutants:** 16 applied, 16 killed (`mutants.txt`): the brief's five, the orchestrator's three for point 3, and eight more.

## Mechanism

**Hypothesis (the brief's), confirmed.** `resumeDrill` cleared `suspended` and the drill's grid was live, with no second gate anywhere. In the refuting case's shape, a tap sent while the engine read `suspended` reached `RhythmDrill.feed` and was scored. Quoted red: *a tap was judged while the sound was suspended: expected 7 to be 2* and *the onset next at the hide was used up while the sound was suspended: expected true to be false*. One assertion of the brief's three, *no new click was scheduled*, is green at the base for a reason that does not refute anything: a suspended context's clock stands still (Web Audio spec), and the double now models that, so the base's click is scheduled but never pulled.

**What changed, in `DrillScreen.ts`.**

1. **A rhythm-only gate** (`rhythmJudgedFromMs`), read in `onNote` beside `suspended`: a rhythm tap whose time is before it is not fed to the drill.
   - It is `+Infinity` from the moment of return.
   - After a count is scheduled, it is the moment judging resumes.
   - At all other times it is `-Infinity`.
   - `suspended` still clears at once, so no other kind's resume changes (case *the hold is the rhythm card's alone*).
   - `onControl` is not gated: `RhythmDrill.feed` reads only `noteOn`, so a gate there would guard nothing.
2. **The hold** (`rhythmHold`, set in `resumeRhythmClick`) records what the count leads back to:
   - `top`: the count never named the downbeat, so it counts in from the top through `startCountIn`, as before;
   - `downbeat`: the downbeat was named and no tap had landed;
   - `grid`: the pattern was running; the hold keeps `pointMs`, the pattern's time at the hide.
   - It also records whether the click was going.
   - It survives a second hide while it still holds, so the point and the click are the first hide's. A hold whose count has run out is dropped.
   - `advance()` releases it. `startCountIn` releases it once the drill's own latch refuses strays.
3. **Waiting for the sound** (`whenSoundRuns`): the engine's `state` decides, the way the Score screen's `withSound` reads it. It is read:
   - at once;
   - when `ensureStarted()` answers or fails;
   - at a 1 s bound (`SOUND_WAIT_MS`, the Score screen's `PLAY_SOUND_WAIT_MS` reason);
   - on every `onStateChange` after that, for however long the sound stays away.
   - It goes ahead only while the card and the visible page are the ones it waited for.
4. **The count and the second re-anchor** (`countInAgain`).
   - It plays the card's own count-in: one bar of `countInBeats`, as `startCountIn` builds it, through a shared `newMetronome`.
   - The bar falls on the grid's own beats and is played by one `Metronome` run, with the accent where the grid's bars fall.
   - The beat after the count's last click is grid beat `b = floor(pointMs / beatMs)`, or the downbeat for `downbeat`.
   - The clock reading is taken again. The grid moves to that beat: `excludeHidden` for a running grid, so the first tap moves with it and the hold and the count are excluded like hidden time; `startAt` for a downbeat, as the first count names one.
   - Judging resumes at `startMs + pointMs`, the exact point the page hid at, which is at least a beat after the count's last click. Before the first tap it resumes at the count's last click, where the drill's own stray rule takes over.
   - After the count the click goes on if it was going. Before the first tap it goes quiet on the downbeat, as on the first count.
5. **Point 3, the paused card** (`showSoundPaused`, `hideSoundPaused`, `wakeSound`), by the reviewer's ruling.
   - When the watch's first reading finds the sound not running, the status line takes `SOUND_PAUSED` (*Sound is paused — tap to continue.*) in place of the card's line.
   - At the same time the stage (`#drill-stage`, the card) takes `role="button"`, `tabindex="0"`, an `aria-label` of the same sentence, a `click` listener and a `keydown` listener for Enter and Space (Space's default prevented, so the page does not scroll). This follows `PlanScreen`'s *Next up* card.
   - Activation calls `audioEngine.ensureStarted()` synchronously inside the gesture, then reads the state again on its answer. The release itself is the watch's existing path: the state reads `running` (by `statechange` or the answer), the watch stops, and the count-in follows.
   - The watch's `stop` takes the pause away whenever the wait ends, so the card's line comes back and every attribute and listener goes. The wait ends on the sound running, a hide, a new card, the end of the drill (`finish` now releases the hold too), or leaving the screen.
   - No control is added, and nothing persists outside the held state: the stop condition is not met.
   - `onNote` is unchanged for point 3. A key while held is refused by the gate and asks for nothing, so key, MIDI and microphone input stay unjudged until judging resumes after the count.

**Ownership is unchanged.** The drill owns its grid; the screen says when. The hold is a screen local beside `countInDownbeatKnown`, and `special.ts` did not change.

**Choices beside the second read's derivation** (orchestrator's correction 3, verified at the lines before adoption):
- **`b = floor`: adopted.** The count's clicks then end at least a beat before judging resumes, so no tap on a count click can ever be judged. With the ceiling, the count's last click can fall within a few milliseconds of the resume point, and a late tap on it would be scored.
- **Judging resumes at the hide point P, not at the first onset at or after P less the tolerance.**
  - It gives the same "nothing judged twice": taps before P are refused, so the onsets in `[b×beatMs, P)` cannot be judged again.
  - It needs nothing private from the drill (`toleranceMs` is private).
  - An onset whose tolerance window straddles P stays judgeable on both sides of the hide, exactly as without one.
  - The cost: a stray tap between P and the next onset's window counts extra, as it would have with no hide.
- **`top` and `downbeat` keep a count into the downbeat** rather than the floor rule. No onset had been judged, so the downbeat is the held point; the floor rule would have given five or six lead clicks.

**Premises found wrong.**
- *"CL05a's 29 cases stay green, unmodified"* (brief, verification layer 2). This is wrong for the cases at :668, :716, :779 and :804. They pinned the instant or count-free return the required change reverses, and are rewritten (the orchestrator's correction 1).
- *"Branch A's own already-correct opened-while-hidden and stray-tap cases."* The stray-tap case (:804) is Branch B (the downbeat was named), and it is one of the four rewritten.
- *Premise 3, "Branch A already matches the rule's shape".* This is not wholly true. A card opened while hidden never armed its latch, so between the return and an unanswered start, taps were judged against the moment it opened (the second read's case 4). `top` is now held too: red at the base (*expected 4 to be +0*), and killed by `opened-hidden-input-open`.
- *Premises 1, 2, 4, 5 and 6* held at the lines.

## Tests and exit codes

| Case | Class | The old assumption it refutes | Red at the base |
| --- | --- | --- | --- |
| A live card: no click or judged tap while hidden; after one count-in, the same point of the same grid; visible time recorded (:668) | **replace** | judging and the click resume the instant the page is visible (CL05a pinned `startedAt` to grid + span and the click to v + 300) | *the grid does not resume where the page hid: expected 302100 to be close to 304600*; *the taps after the return missed the grid: expected 3 to be 8*; *taps were counted extra: expected 5 to be +0* |
| The audio clock stood still while hidden: the count-in and the click come back on the moved grid through fresh clocks (:716) | **replace** | the next onset is due 300 ms after the return, with no count | *the click did not come back on the grid: expected 305100 to be close to 302600* |
| After the downbeat, before any tap: one count names the downbeat again; a tap during it is a stray; quiet after the downbeat until the first tap (:779) | **replace** | quiet after the return with no pulse, and the first tap starts the pattern unprompted | *never happened: the count-in began* |
| A tap to a hidden page after the count named the downbeat is not the first onset; on return one count leads to the downbeat again, past the hidden span and the count (:804) | **replace** | no second count over a downbeat already named; the downbeat comes back as far ahead as it was | *never happened: the count-in reached its third click* |
| **The refuting case, the response's proof shape**, with these steps: hide; return with the start unanswered and the engine suspended, past the 1 s bound; the start answers, still suspended; taps on the would-be onsets are not judged, no click is scheduled and the grid does not move; the sound runs; one count, with a stray on its second click not judged; the next judged onset is the one next at the hide; 8 of 8 | add | the page being visible is enough for a rhythm card to be live | *a tap was judged while the sound was suspended: expected 7 to be 2*; *the onset next at the hide was used up while the sound was suspended: expected true to be false*; *a tap during the count-in was judged: expected 8 to be 2*; *the next judged onset is not where the page hid: expected -4000 to be close to 1000*; *the hold was counted as practice: expected 300000 to be greater than 302300* |
| A long hold, a minute with the start answered and the context suspended: the onset next at the hide is still the next judged | add | hidden time, not held time, is all the grid must skip | *the onset next at the hide fell due in the hold and was missed: expected false to be true* |
| Hidden again while held: the point and the click are the first hide's | add | each return starts from where the card is then | *the second hide moved the held point: expected false to be true* |
| Opened while hidden, the return's start unanswered: no tap judged against the moment it opened; a count from the top once the sound runs | add | a count-from-the-top card is protected by its latch | *a tap was judged against the moment the card opened: expected 4 to be +0* |
| The hold is the rhythm card's alone: a note-flash card back with the sound suspended takes its answer at once | add (guard) | — | green at the base; killed by `hold-every-kind` (*expected '' to be 'correct'*) |
| No Web Audio: the card carries on at once, its taps judged on its moved grid | add (guard) | — | green at the base; killed by `hold-without-web-audio` (*expected 2 to be 3*) |
| **Point 3:** while the sound is paused the card says so and is a keyboard-reachable target; a key on the strip, even as a tap, and a MIDI key ask for no sound and are not judged | add | the held card keeps its own line and is not a control | *the held card does not say the sound is paused: expected 'Tap the rhythm on any key.' to be 'Sound is paused — tap to continue.'*; *the card is not an activation target: expected null to be 'button'*; *the card cannot be reached from the keyboard: expected null to be '0'* |
| **Point 3:** a tap on the card asks for the sound once, inside the tap; once it runs the sentence goes and the card is no target, a second tap asks nothing, and after one count-in the grid goes on where it hid (8 of 8) | add | the sound comes back only on the platform's own | *the tap did not ask for the sound, once, inside itself: expected [] to deeply equal [ true ]*; *never happened: the count-in* |
| **Point 3:** Enter on the card asks the same; with the sound still refused it stays paused and held and judges nothing; Space, where the platform allows it, wakes the sound without scrolling the page | add | — | *Enter on the card did not ask for the sound inside the key: expected [] to deeply equal [ true ]*; *Space on the card scrolled the page: expected false to be true* |
| The other 25 CL05a cases | preserve | — | green, unmodified |

**The double's extension** (the builder's call, stated where the fix reads it).
- The fix reads `audioEngine.supported`, `audioEngine.state` and `audioEngine.onStateChange`, so the mock gains those three, from `audio.available` and a new `audio.engineState`, which is `running` unless a case suspends it.
- `suspendAudio()` sets the state to `suspended` and stands the double's clock still, as a suspended context's does. `resumeAudio()` runs the clock on and fires the state listeners, as `statechange` reaches `onStateChange`.
- `holdStarts` and `releaseStarts()` keep `ensureStarted()` unanswered and then answer it. An answer leaves the state as it is.
- Every existing case reads `running`, so CL05a's cases run as before.
- For point 3, `starts` records every `ensureStarted()` and whether it was asked inside a gesture. `gesture()` marks a tap or a key on the page. With `wakesOnGesture`, a start asked inside a gesture runs the context, as a platform that honours a start only there does. jsdom has no user activation, so this flag is the model of it.

**Mutants, 16 of 16 killed** (`mutants.txt`). Each was applied to the final source; the file of 38 was run; the source was restored and byte-compared.

| Mutant | The change | Killed by |
| --- | --- | --- |
| `resume-without-waiting-for-audio` (brief) | `if (audioEngine.state !== 'running' \|\| !context) return;` → `if (!context) return;` | the refuting case (*a tap was judged while the sound was suspended: expected 3 to be 2*); the long hold; hidden again |
| `resume-without-count-in` (brief) | the grid resumes at the first click, with no bar before it | the refuting case (*the next judged onset is not where the page hid*); the four rewritten; the long hold; hidden again |
| `judge-during-count-in` (brief) | judging reopens as the count is scheduled | the refuting case (*a tap during the count-in was judged: expected 3 to be 2*) |
| `restart-from-bar-1` (brief) | every hold counts in through `startCountIn` | the refuting case (*the onset next at the hide was not the next one judged*); the live card (*taps were counted extra: expected 2 to be +0*); the frozen clock; the long hold; hidden again; downbeat passed; the stray |
| `count-hidden-time-again` (brief) | no second re-anchor for the hold and the count | the long hold (*the onset next at the hide fell due in the hold and was missed*); the refuting case (*the hold was counted as practice*); the live card; the frozen clock; hidden again |
| `input-open-while-waiting` | waits for the sound with input open | the refuting case; hidden again; opened while hidden |
| `proceed-on-start-answer` | a start that answers is taken as running | the refuting case (*the grid moved while it was held*); the long hold; hidden again |
| `opened-hidden-input-open` | a `top` hold leaves input open | opened while hidden |
| `hold-dropped-on-rehide` | a second hide forgets the point and the click | hidden again (*never happened: the count-in and the click after it*) |
| `stale-anchor` | the count is placed through the pre-hide clock reading | the frozen clock (*the click did not come back on the grid: expected 304900 to be close to 302600*); the refuting case; the long hold; hidden again |
| `hold-every-kind` | the hold made on the shared `suspended` flag | the rhythm-only guard; the refuting case; the long hold; hidden again; opened while hidden |
| `hold-without-web-audio` | no Web Audio holds for a sound that cannot come | the no-Web-Audio guard |
| `surface-left-active-after-resume` (orchestrator, point 3) | `hideSoundPaused` leaves the card's role, tabindex, label and listeners | the tap case (*the card is still a target after the sound ran: expected true to be false*; *a tap after the resume asked for the sound again: expected 5 to be 4*) |
| `key-accepted-as-wake` (orchestrator, point 3) | a key refused while held calls `wakeSound` | the paused-card case (*a key asked for the sound: expected 4 to be 3*; *a key woke the sound: expected 'running' to be 'suspended'*) |
| `activation-without-start-attempt` (orchestrator, point 3) | the card's tap reads the state again without calling `ensureStarted()` | the tap case (*the tap did not ask for the sound, once, inside itself: expected [] to deeply equal [ true ]*); the keyboard case |
| `no-keyboard-activation` | the card takes a tap but not Enter or Space | the keyboard case (*Enter on the card did not ask for the sound inside the key*) |

**Exit codes** (`chain.txt`):

| Step | Exit | Result |
| --- | --- | --- |
| `npx vitest run tests/unit/drillLifecycle.test.ts`, the untouched base | 0 | 29 of 29 |
| The same, with the extended test file on the committed source (red) | 1 | 8 failed, 27 passed |
| The point-3 cases on the source with points 1, 2 and 4 built (red) | 1 | 3 failed, 35 passed (`unit-red-point3.txt`) |
| The same file, on the final tree (green) | 0 | 38 of 38 (`unit-green.txt`) |
| `npx tsc -b`, final tree | 0 | |
| `npm run lint`, final tree | 0 | |
| Mutants, final tree | 0 | 16 killed |
| `npx vitest run`, the whole unit suite, final tree, with content copied read-only | 1 | 9 failed in 7 files, none touched here |
| The non-environment failures run alone | 1 | 2 failed (blues.5, rock.7) |
| The content-reading failures with the base `DrillScreen.ts` swapped in | 1 | the same 5 failed |
| `checks_for_paths.py` over the two paths | 0 | |
| `npm run build:app`, final tree | 0 | |
| Playwright | not run | no mutant survived jsdom |

The whole-suite failures on the final tree (the run before point 3 had 8, the same less rock.7 and simonTurnCue, plus oneSkillState's timeout):
- Two are a fresh worktree's environment: `midiParity` has no reference, and `taughtByAncestry` has no `build/rung-claims.json`.
- Two pass alone: `expectedNote` (a 5000 ms timeout) and `simonTurnCue`'s play-along case. That case runs on real timers and took a key as the answer under the suite's load, on a Simon path the rhythm gate never reads (the gate is read only for `drill.kind === 'rhythm'`).
- Five fail alone and fail the same on the base source:
  - `lessonClaimsAboutApp` blues.3 and 4.7, the line-ending claims CL05 and CL05a recorded;
  - `lessonClaimsAboutMusic` blues.5 and rock.7. Rock.7 is new against the first run; inferred, not checked: the main checkout's built content changed between the two copies;
  - `demandsOfFiles` `exercise.syncopation.tied-across-bar`.

## What passes, and what is unverified beside it

- **Passes:** the 38 cases in jsdom, with the real `Metronome` and a faked clock; the 16 mutants; typecheck, lint and the app build.
- **Unverified on a device:**
  - whether a phone's context resumes on return without a gesture;
  - whether `ensureStarted()` outside a gesture answers, hangs or answers still suspended;
  - whether a phone honours the start asked inside the tap on the paused card.
  - All of these are modelled in the double, and none was observed on a device. The hold is built so that each of them holds the card rather than judging it.
- **Keyboard activation in a browser:** jsdom proves the card's role, tabindex and Enter/Space handler, by dispatched events. A real browser's focus order and screen-reader reading of the card were not looked at.
- **Unverified in a browser:** the six specs the check map names (`drills-harmony`, `drills-review`, `drills`, `feedback-placement`, `session-run`, `tips`) were not run. The dispatch allows Playwright only after a jsdom survivor, and there was none. They stay with the landing chain.
- **Not heard:** nothing. No musical claim is made.

## Done

1. **Point 1:** the judged grid does not resume when the page becomes visible. A rhythm card is held from the return. Red, then green, then killed by `resume-without-count-in` and `judge-during-count-in`.
2. **Point 2:** nothing is judged while the sound is unavailable or suspended.
   - The engine's `state` decides, at once, on the start's answer, at the bound and on `statechange`.
   - This holds for a start that never answers, one that answers while still suspended, and a card opened while hidden.
   - Killed by `resume-without-waiting-for-audio`, `proceed-on-start-answer`, `input-open-while-waiting` and `opened-hidden-input-open`.
3. **Point 4:** once the sound runs, the card's own one-bar count-in plays on the grid's beats, and the held grid and its click resume together from the pre-hide point. Hidden and held time are excluded from the grid. Killed by `restart-from-bar-1`, `count-hidden-time-again` and `stale-anchor`.
4. **The second re-anchor**, through the drill's own `excludeHidden` for a running grid, and `startAt` for a downbeat.
5. **The double's extension** in `drillLifecycle.test.ts`.
6. **The four CL05a cases rewritten** to the rule, each with the assumption it drops (the orchestrator's correction 1). The other 25 are unmodified and green.
7. **The hold is rhythm-only,** proved by a guard and the `hold-every-kind` mutant. No other kind's resume changed.
8. **The red-first refuting case,** quoted. The hypothesis is confirmed.
9. **Point 3, by the reviewer's ruling (option (a)).**
   - While held with the sound not running, the card says *Sound is paused — tap to continue.*
   - The card itself is the keyboard-accessible, non-judged resume action, and only then.
   - Its activation asks for the sound inside the gesture, and the release goes through the existing `statechange` path.
   - Key, MIDI and pedal input stay unjudged until the count-in ends.
   - Red first; killed by `surface-left-active-after-resume`, `key-accepted-as-wake`, `activation-without-start-attempt` and `no-keyboard-activation`.
   - The stop condition, a persistent control outside the held state, is not met.
10. **Sixteen mutants killed:** the brief's five, each by a named case; the orchestrator's three for point 3; and eight more.
11. **This entry and the kept logs.**

## Not done

- **The six browser specs the map names.** Not run, per the dispatch, since no mutant survived jsdom.
- **The device check.** There is no device here.
- **The doc rows.** Proposed below, not written: neither file is owned here, and CL05a's rows are still unwritten.

## Follow-ups (recorded, not built)

1. **The resumed count into a downbeat inherits X43.** With no tap yet, the click is stopped on the downbeat, which cancels the downbeat click, exactly as on the card's first count. The rewritten case asserts nothing after the downbeat, so it does not pin X43 either way. This stays X43's.
2. **The first open has the same unarmed-latch gap as the second read's case 4.** Hiding plays no part. If the card's first `ensureStarted()` never answers, `latchOnFirstTap` is never called, and a tap is judged against the moment the card opened. If the start answers while the context is still suspended, the count hangs on a standing clock, and the card refuses every tap. Not a return from a hidden span, so outside this lane. Observation for T8/X15.
3. **Three whole-suite failures fail the same on the base source and are not CL05/CL05a's recorded ones:** `lessonClaimsAboutMusic` blues.5 and rock.7, and `demandsOfFiles` `exercise.syncopation.tied-across-bar`. They ran against the main checkout's built content, which may differ from the base's sources. Not diagnosed here.
4. **The paused card has no visual cue of its own.** A held card's stage takes `cursor: pointer` from `DrillScreen.css` under `[data-paused]`. The paused rhythm card has only its sentence and its role, because the stylesheet is not owned here. Observation for the next pass that owns the stylesheet.

## Questions

1. **Point 3 is answered** by the reviewer's ruling (`responses/questions-91f683ff.md`, option (a)) and built (*Done* 9).
2. **No Web Audio: should the card hold, or carry on at once?** I chose to carry on, as CL05a did, on two precedents: `withSound` acts at once with no Web Audio, and the card's own "No audio is a reason to lose the click, not the drill". With no Web Audio no sound can ever come, and the card has run without a click from its first moment. The cost is point 1's abruptness on such a browser: no count can be played there. A silent alternative, re-latching the next tap to the onset that was next, would be a new drill rule and is not built. The guard case and `hold-without-web-audio` pin the choice, so overturning it changes one early return and that case.

**Orchestrator's note at the landing (2026-10-01).** CL05b's worktree committed by name (1a89de52) and merged (ed196281). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/CL05b/map-min.txt`), typecheck, lint, the whole unit suite, the app build, the spec names checked, then the specs the map's minimum names on the default port (map-tests 0; map-min 0; tsc 0; lint 0; vitest-all 1; build-app 0; specs-exist 0; e2e-targeted 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; `runs/CL05b/orchestrator-exit.txt`). CL05a's review, approved with one required change (`responses/8764c643.md`): the original CL05 required change is correctly built and the four implementation departures stand, but the post-build questions expose one remaining learner-facing consequence — a rhythm card may become judgeable immediately on visibility return before the learner has an audible temporal reference, and may even judge against a click whose audio context has not resumed. Required change, quoted at length: *A rhythm card returning from a hidden span stays held until sound is actually available, then gives the learner one count-in before the held judged grid resumes. The count-in is not a new attempt and is not judged. When it finishes, continue from the same musical/judgement point the exact-span re-anchor preserved; do not restart the card from its beginning and do not skip hidden material. Do not resume the judged grid immediately when visibilityState becomes visible. Do not judge against an inaudible click while AudioContext is still unavailable/suspended. If the platform requires a user gesture before audio can resume, that gesture must be a non-judged resume action; if the existing Drill controls cannot provide such a gesture without inventing a new learner-facing control/state, stop and return that small UI choice instead of guessing. Once audio is available, play the existing count-in policy, then resume the same held grid point and its click together. Hidden time remains excluded from every timing channel. X43 remains separate ... X44 also remains separate as recorded.* Confirmed by the second read's item 3 (`second-reads/cc45b3a8.md`): the mechanism holds at the lines, and no existing Drill control serves as a non-judged gesture without a new state, so the response's stop condition was already met there before this brief dispatched. Point 3 was built after the reviewer ruled on it (`responses/questions-91f683ff.md`, “CL05b — non-judged resume action”: choose option (a), an explicit tap/click on the held rhythm card with a temporary carry-on sentence; do not choose Play again or a piano-key/MIDI tap), in the same worktree on the same base; its line numbers held at the base. Dispatched at `cc45b3a8` (`git log -1 --format=%h` in the worktree before any edit), under the fast path (`operating-procedure.md` §11): a required change returns to the same builder without a second brief review.. a rhythm card resumes only after audible re-orientation, a tap on the held card wakes the sound; X45 opened (the first open's unarmed latch)

## Doc rows (proposed, not written)

**`docs/04-ui-spec.md` §0 R7.** CL05a's proposed sentence on the rhythm card becomes:

> A rhythm card's click and the grid its taps are judged on stop with the page. On return the card judges nothing until its sound is actually running. While it is not, the card says *Sound is paused — tap to continue.* and is itself the one way back: a tap, or Enter or Space, that asks for the sound and is never judged; a key on the keyboard or the piano is never that. Once the sound runs, one bar of the card's own count-in, not judged, leads back to the beat the page hid in. The click and the grid go on together from there, judging resumes at the point the page hid at, and neither the hidden span nor the wait for the sound is counted (CL05b). A count that had not yet named its downbeat counts in again from the top.

**`docs/08-test-map.md`, CL05's proposed row *A practice screen while hidden*.**
- What it guards adds: *a rhythm card judged, or its click restarted, before the sound runs or without a count-in; a tap during the resumed count judged; the held point or the click lost to a second hide; the hold reaching any other kind; the paused card's sentence or its one way back missing, left behind after the sound runs, reachable by a key, or not asking for the sound*.
- Its tests cell becomes `drillLifecycle.test.ts` (38: 11 CL05, 14 CL05a, 4 CL05a rewritten by CL05b, 9 CL05b), red first; 16 more mutants caught (CL05b, Entry 196).

## Content

Nothing under `content/` or `scores/` changes. One line of screen copy is added, itemised:

- `app/src/ui/screens/DrillScreen.ts`, `SOUND_PAUSED`, shown in `#drill-status` and as the card's `aria-label` while a held rhythm card's sound is not running. Before: the card's own line stayed, *Tap the rhythm on any key.* After: *Sound is paused — tap to continue.* Why: the reviewer's ruling gives this sentence as the state ("a state such as"), used as given.

The rest of the learner-facing change is the timing and interaction itemised under *Judgement*.

## Files

- `app/src/ui/screens/DrillScreen.ts`
- `app/tests/unit/drillLifecycle.test.ts`
- `docs/prompts/runs/CL05b/` (this entry, `unit-red-committed.txt`, `unit-red-point3.txt`, `unit-green.txt`, `mutants.txt`, `chain.txt`)
