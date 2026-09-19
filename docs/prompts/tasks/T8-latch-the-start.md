# T8 — Start the clock when the player starts, not when the countdown ends

**Read `docs/prompts/working-rules.md` first.**

**Status: built 2026-09-18.** `docs/pending-review.md` Entry 18 reports against every row of
Part 3 and both tables of Part 5. `docs/05` §3b is the design as shipped. Pedal-to-start was
not built (it needs a setting).

## Decided by the owner, 2026-09-18 — do not re-ask

The owner approved every recommendation in this brief ("Sounds good"). In particular:

- **Resume after pause** gets a one-bar count-in, then the Part 2 rule, classified from the
  resume step.
- **After a run finishes, piano keys do not restart it**; the button or Space do, and the
  pedal where enabled.
- **Pulse between count-in and first note**: count in once, silence, metronome restarts in
  phase with the first note (Part 6's recommendation).
- **Key-to-start** as in Part 5: on by default for MIDI, Space for every source, pedal
  opt-in, microphone keeps the button.

Still genuinely open, because nobody has read the code yet: which mode Performance runs in,
whether the PDF screen scores anything, whether Simon's answer is timed, how the chord
window is measured, and whether a run with no notes is saved. Read each; decide within the
approved design; report what was found.

## The request, restated without the owner's words

When a run is timed against the learner and the learner is the one who plays first, the
reference time should be *their* first note, not the end of a timer — so a slightly late
entry cannot poison every judgement after it. The count-in stays: it teaches the tempo.
**And when the app is the one who plays first, the app must still be able to start**, or
the run can never begin.

That last sentence is the owner's, from a second pass, and it is the part a first draft of
this brief missed: it talked about *modes* and never asked *whose note comes first*.

---

## Part 1 — What the code does today, read on 2026-09-18

Every line here was read, not inferred. Where only a grep was run, it says so.

| Fact | Where |
|---|---|
| `start()` stamps `startedAtMs = clock.now()` in every mode | `engine/PracticeEngine.ts` `start()` |
| In the score screen the **count-in is part of the engine's clock** (emitted as tempo ticks; `elapsedMs` is "count-in included") | `ScoreSession.startMetronome` comment; `elapsedMs` doc |
| **The app plays the other hand only in Tempo and Listen** — `if (mode !== 'tempo' && mode !== 'listen') return;` | `ScoreSession`, playback scheduler |
| App playback is **scheduled from `engine.musicMs`** — if the clock does not move, the app's notes are never scheduled | same |
| `playbackHands` is `'non-focused'` (default), `'both'` or `'none'`; with no hand focus, `'non-focused'` plays nothing | `ScoreSession.pitchesToPlay` |
| A step's `expected` is **filtered by the practised hand**, so `isEmpty` means "the learner has nothing here" | `engine/prepareSession.ts` |
| **Resume restarts with no count-in**: `resume()` calls `engine.resume()` and starts the metronome with `countInBars: 0` | `ScoreSession.resume`, `startMetronome` |
| Changing hands mid-run **restarts the run** | `ScoreSession` comment near line 186 |
| Mic input subtracts calibration latency in one place, `PracticeEngine.feedTempo` (`inputLatencyMs`) | `MicSource.ts` comment |
| The count-in click is pitched at **4 kHz or above** so the microphone does not hear it as a note (`05` §11.4) | `audio/Metronome.ts` |
| **Nothing stops the microphone hearing the app's own piano**: `echoCancellation: false` and `noiseSuppression: false` are set deliberately, and the file calls that its most important line | `audio/pitch/MicSource.ts` ~line 384 |
| **Paper measures** each onset against **the nearest click** — per note and phase-relative, so a late entry cannot cascade | `PaperScreen.ts` header |
| **Blind** is "the engraving is hidden, everything else runs" — it runs in **whatever mode was chosen**, Wait included. **Rhythm-only is Tempo-only**. **Performance** is a route flag; which mode it runs in was **not established** | `ScoreScreen.ts` ~lines 169, 180, 1408 |
| `PracticeEngine` is used by **`ScoreScreen` and `DevScoreScreen` only** | grep for `PracticeEngine` |
| The **rhythm drill** pins its start to the metronome's bar 1 beat 1 (`target.startAt(...)` in `onTick`), and the click keeps going | `DrillScreen.ts` ~line 840 |
| The **lab judges nothing** ("Nothing here is judged and nothing here is recorded") | `LabScreen.ts` header |
| The **chord chart** judges the held chord against the *current bar*, which advances on metronome ticks | `ChordChartScreen.ts` header, `onBeat` |
| **Simon** plays its chain at fixed `stepMs` spacing. A grep for timing words found only that spacing and a miss pause — **no evidence the answer is timed**, but this is a grep, not a read | `engine/drills/simon.ts` |

---

## Part 2 — The rule: decide by whose note sounds first

For the region about to be played — the whole piece, a loop, or wherever a restart or
resume begins — compute two onsets from the prepared steps:

- **P**: the first step where the **learner** has a note (first `!isEmpty` step).
- **A**: the first step where the **app** will sound something — the non-practised hand
  under `'non-focused'`, everything under `'both'`, nothing under `'none'` or in Wait mode.

Then exactly one of four cases applies:

| Case | When | Start behaviour | Why |
|---|---|---|---|
| **1. Nothing is measured** | lab, metronome screen, free play (all three verified); PDF (**not read** — one grep hit, check it) | count-in, then go — **unchanged** | there is no judgement to be thrown off |
| **2. The app leads** | Listen; `playbackHands: 'both'`; **A comes before P**; Simon's demonstration | count-in, then go — the app starts itself | the learner's reference is **audible**. They join what they hear, so a late entry is genuinely late, not an offset against a silent timer. This is the case the owner raised |
| **3. The learner leads** | P comes first, **or P and A are at the same onset**, or there is no A | count-in, then **armed**; the first note-on latches the clock | the complaint: the only reference is a timer they cannot hear |
| **4. Wait mode** | Wait | no clock to anchor; **time accounting** starts at the first note | nothing drifts, but seconds spent before the first key are counted as practice today |

**The simultaneous case (P = A) is case 3 on purpose.** The learner's first note-on latches
the clock and **the app's notes at that onset fire on the latch** rather than being
scheduled ahead — like a duet partner who waits for you to breathe in. They will sound
input latency plus output latency after the learner's key: small over MIDI, larger over
the microphone. Say so in the entry; do not claim they are simultaneous.

**Do not "fix" case 2 by letting the app play its lead-in and then freezing at P.** A
lead-in that sets a groove and then stops dead to wait is worse than either rule alone.

### What the screen says while it waits

- **Case 3:** the cursor sits on P with its notes highlighted and a line such as *"Play
  your first note to start"* — with hand focus, *"Your right hand starts"*. Armed must be
  visibly different from running (§2.15, and the `05` §6 ladder fault: a control acting
  with nothing on screen showing its state).
- **Case 2:** *"The app starts — you come in at bar N"* when P is later than bar 1, so the
  learner is not staring at a cursor that has already left.

---

## Part 3 — Every place a run begins, and what each one does

This is the list a partial fix will skip. Report against every row.

| Where | Case | Notes |
|---|---|---|
| Score screen, Tempo, no hand focus | 3 | the main one |
| Score screen, Tempo, hand focus, `'non-focused'` | 2 or 3 by P vs A | **the owner's example**: a left-hand intro while practising the right is case 2 |
| Score screen, Tempo, hand focus, `'none'` | 3 | the silent hand's earlier notes are simply skipped; the clock anchors at P's onset, not bar 1 |
| Score screen, Tempo, `'both'` | 2 | the app is playing the learner's part audibly |
| Score screen, Listen | 2 | unchanged |
| Score screen, Wait | 4 | no playback in Wait, verified |
| Blind | classify by the mode it runs in | verified: blind only hides the engraving, so blind + Wait is case 4 and blind + Tempo is 2 or 3 |
| Rhythm-only | 3 | verified Tempo-only; any key latches, anchored to the first **sounding** onset |
| Performance mode | **check** which mode it runs in, then classify | not established |
| Paper | **unchanged, deliberately** | it measures each onset against the nearest *audible* click, so there is no timeline for a late entry to shift. Latching here would be wrong |
| **Loop start** | classify on the **loop region** | a loop that begins where the app's hand plays first is case 2 even if the piece is not |
| **Loop passes 2, 3, …** | **never re-arm** | continuous time is what a loop is; re-arming breaks the ladder's "clean pass" |
| **Tempo ladder step-up** | never re-arm | same reason |
| **Restart** | re-classify and re-arm | |
| **Change of hand focus** | re-classify | it already restarts the run, and whose note is first can flip |
| **Resume after pause** | **decision for the owner** | today: no count-in, clock continues, learner re-enters cold. Recommendation: a one-bar count-in and re-classify from the resume step. It is the same fault as the start |
| Change of tempo mid-run | **check** whether it restarts | if it does, re-classify |
| Rhythm drill (`DrillScreen`) | 3 | latch maps the first tap to the rhythm's **first sounding onset**, which may not be beat 1 (a rest or pickup) |
| Chord chart | **unchanged, deliberately** | *Corrected while building.* This row first said a late entry turns each bar's cell amber and that latching fixes it — written from the file's header without reading `markMatch`. The chart judges the held chord against the bar **at each moment**, with nothing held reading as idle, not amber; the bar moves on audible clicks, and with comping on the app plays every bar. No timeline for a late start to shift, and a latch would put the chart out of step with the click being heard |
| Simon, demonstration | 2 | the app always plays first |
| Simon, the answer | none, **if** the answer is untimed | confirm by reading `simon.ts`, not grepping it |
| Lab, metronome, free play | 1 | unchanged, verified |
| PDF | 1, **unverified** | read it before claiming this |
| **Trading fours (T2, not built)** | first trade only | coming in on time after the app's four bars **is the skill**; latching there would remove it. Add this to T2's brief |

---

## Part 4 — The latch itself

- **Only a note-on edge latches.** Not a note-off, not the sustain pedal (CC64) or any other
  controller, and not a key already held when arming began.
- **Any pitch latches**, correct or not. Correctness is judged separately. Latching only on
  the right note leaves a learner who fumbles the first note stuck in front of a screen
  that will not move.
- **Anchor to P's musical time, not bar 1 beat 1.** A piece with a pickup, or a region
  starting on a rest, must land the first note where it is written.
- **Early entries.** A note-on during the count-in's last beat, inside the engine's existing
  early tolerance, latches at its real time. Anything earlier is ignored as a stray. Use
  the existing tolerance constant; do not add a new one.
- **A chord as the first event.** The first note to arrive latches. The rest are judged
  against the latched step time — so **check how the chord window is measured**. If it
  runs from the step time, a normally-rolled chord is fine; if it is narrower than a
  typical spread, the chord's own other notes will be marked late.
- **Latency.** The latch time goes through the same `inputLatencyMs` subtraction as every
  other note (`feedTempo`), or every run begins systematically early or late — and that
  will look like the feature working badly rather than like an offset.
- **Two clocks.** MIDI timestamps are `performance.now()`; the metronome and app playback
  run on `AudioContext` time. The drill screen already converts with
  `captureAudioClockAnchor` / `audioTimeToPerformanceMs`; the latch needs both directions.
- **Microphone self-latching.** Nothing pitched may sound while armed, or the microphone
  hears the app and starts the run by itself. Case 3 guarantees this only because the app's
  notes wait for the latch — **keep it that way**, and add a test that asserts nothing is
  scheduled on the piano while armed.

### When the first thing written is a rest

- **A rest before the learner's first note, with nothing sounding** (a piece opening on beat
  2, a pickup, a first bar silent in the practised hand): the latch anchors the first note
  at its **written** position and the rest is absorbed. Nothing audible is skipped, so
  nothing is lost. **Two details:** the cursor must sit on P, not on bar 1 — and when the
  metronome restarts at the latch it takes **P's beat position**, so a first note on beat 2
  is followed by a click on beat 3, not beat 2.
- **A rest in the learner's part while the app plays**: A comes before P, so the app leads
  (case 2). Nothing new.
- **A loop that starts on a rest**: pass 1 absorbs it; passes 2 onward play it in time,
  because a loop is continuous after the first entry. That is consistent, but say so in the
  lesson copy or it will look like a bug.
- **Rests in the middle of a piece are never re-latched.** Counting rests is part of
  playing, and the audible answer to a long silent rest is the metronome. The one case
  worth a later look is a multi-bar rest with no app part and no metronome; the
  recommendation is still not to re-latch.

## Part 5 — The keyboard as the start button

The owner, 2026-09-18: pressing a key to start could be **the general way to begin**,
rather than taking a hand off the piano to hit a small button. It fits the latch and
simplifies it.

### How it combines with the latch

The Count-in bars setting already exists, 0 to 4 (`SettingsScreen.ts:216`). So:

| Count-in | What the learner does | Presses |
|---|---|---|
| **0** | plays their first note; that **is** the start **and** the latch | **one** — exactly the owner's first description |
| **1 or more** | presses any key → the count-in plays → then the who-leads rule (Part 2) | two: *ready*, then the first note |

The line on screen follows the setting: *"Play your first note to start"* at 0, *"Press any
key to count in"* otherwise. With count-in on, pressing the start key is like nodding to
the drummer — it is not a note of the piece.

### Rules for the start key

- **It is not a played note.** It is not scored, does not latch, and its note-off during the
  count-in is ignored. If the learner holds it down, the latch needs a **new** note-on.
- **Only from the ready state.** During a run, keys are music; stopping stays on the button.
- **After a run finishes, keys do not restart it.** People carry on playing after the last
  bar, and that would restart the run under them. Button or Space instead, or the pedal
  where it is enabled.
  *(A decision for the owner; this is the recommendation.)*
- **The play button stays** — for touch, for the microphone, and as the thing a new learner
  looks for.

### By input source — the owner's point that this is really a MIDI feature

| Source | Key to start? | Why |
|---|---|---|
| **MIDI keyboard** | **yes, default on** | a note-on is exact and cannot come from the room. On a digital piano the start key sounds; on a controller with no sound of its own it is silent — either is fine |
| **Sustain pedal (MIDI)** | **opt-in, off by default** | the events do arrive (CC64 is recorded for the pedal drill, `engine/types.ts`). Silent and hands-free — **but a pedal pressed in preparation starts the run**, and many pieces open with the pedal already down. It can never latch; only a note-on latches |
| **On-screen keyboard** | yes | it is already a note-on source (`screenKeyboardSource`) |
| **Computer keyboard: Space** | yes, for every source | the fallback for microphone users on a laptop. **Ignore it while any control has focus**: the browser already activates a focused button on Space, so a global handler would start a run twice from a focused *Start again*. Today the only Space handler on the score screen is the tempo label's own, focus-scoped (`ScoreScreen.ts` ~line 751) |
| **Microphone** | **no by default, the button stays** | the mic hears the room, with echo cancellation deliberately off — talking, a cough or the app's own piano would start it. **The latch fixes most of the complaint anyway**: tap play, return your hands during the count-in, and a slightly late entry no longer matters. A later option could accept only a confident pitched onset (`MicSource` reports `onsetStrength`), but speech is pitched too, so it should stay opt-in |

### Where a key before the run already means something

This is the clash that would make key-to-start confusing. Report against each:

| Screen | Clash | Recommendation |
|---|---|---|
| Drill cards answered **by** playing a note (note-flash and the like) | the key **is** the answer | no key-to-start; these have no run to start. **Check which drill kinds these are by reading `DrillScreen`, not from the drill names** |
| Simon's answer phase | a key is an answer | key-to-start only for the first chain, before any demonstration |
| Chord chart | holding a chord before starting names it | key-to-start **off**, or the learner cannot look up a chord without starting the chart. Pedal and Space still work |
| Paper | its measurement counts notes against clicks | the start key must be **excluded** from that count |
| Free play | there is no run | not applicable |
| **Pedal drill** | the pedal **is** what is scored | pedal-to-start off here regardless of the setting |
| Lab | none — nothing is judged | yes |
| Score screen, every mode | none | yes |

**Accidental starts** (resting hands on the keys, finding position) cost a count-in at worst.
Under the learner-leads case nothing is judged until the latch, so the only real annoyance
is case 2, where the app begins playing. That is acceptable; say so rather than adding a
confirmation.

## Part 6 — The pulse between the count-in and the first note

The one genuinely open design question. Recommendation first:

- **Recommended: count in once, then silence until the latch, then the metronome (if on)
  restarts in phase with the learner's first note.** No grid is sounding that the learner
  could be judged against, so nothing contradicts the latch.
- *Loop the count-in until the first note.* Keeps the pulse alive, but a learner entering
  off the click means the click must jump phase at the latch — an audible stumble.
- *Keep clicking as before.* Reintroduces the fault: the click becomes the grid and the
  latched clock disagrees with it.

Whichever is chosen, **the metronome must be re-anchored at the latch.** `BeatScheduler`
fixes beat 0 at construction; a metronome that keeps its old phase will click against the
clock the learner is now being judged on.

## Part 7 — Consumers of the start time (§2.15)

`startedAtMs` and `elapsedMs` are read by more than the judge. Grep every reader and say in
the entry what each does. Known already:

- `elapsedMs` → `durationMs` on the saved score → weekly practice minutes. **Armed time
  must not count.** A bug of exactly this family is recorded in the `elapsedMs` comment.
- App playback scheduling (`musicMs`).
- Slot opening and the tempo ticks.
- **A run abandoned while armed** has no notes. Check whether today a run with no notes is
  saved as a 0 % result; if it is, armed-and-abandoned must not add one.

## Traps

- Three separate start paths exist — score, drill, chord chart — and only the score path
  has an engine. Decide deliberately between score-only, a shared arming
  helper, or neither; do not fold arming into `Metronome`, because the metronome screen
  wants plain count-in-then-go.
- The engine ignores input before `start()`. **Arming must not be implemented as "not yet
  started"**, or the latching note is dropped.
- The fade the owner likes: confirm it is tied to the count-in and not to `started`, or it
  fades onto a screen that is still waiting.

## Done

`npx tsc -b`, `npm run lint`, `npx vitest run`, the score specs one at a time on 4173.
`PracticeEngine`'s state machine has tests: **extend them**, and assert transitions — armed
→ running on a note-on, no piano notes scheduled while armed, the P = A notes firing at the
latch, loops not re-arming, the start key not being scored or latching, keys not restarting
from the summary, and the microphone not starting a run by itself — never a duration measured on this machine (`00-invariants`
§1). One entry in `docs/pending-review.md` that **reports against every row of Part 3 and both tables of Part 5**,
saying which now latch, which deliberately do not, and which were not touched.
