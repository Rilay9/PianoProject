# 05 — Score-follow engine and MIDI

Pure TypeScript, no DOM. Consumes a `ScoreModel` (see `01-architecture.md` §4.1) and a stream
of `EngineInput` events (from MIDI, microphone, screen keyboard, or replay — each with a
`confidence`, MIDI = 1.0); emits `EngineEvent`s that the Score screen turns into cursor moves,
note colours, and sounds. **All timing uses an injected `Clock`** so tests are deterministic.

## 1. Preprocessing the ScoreModel for a session

Given session options `{ hands: 'R'|'L'|'both', loop?: {fromStep, toStep}, tempoPct, transposeSemis }`:

1. **Expected set per step:** `expected[k] = step.notes.filter(n => hands==='both' || n.hand===hands).map(n => n.midi + transposeSemis)`.
   Steps whose expected set becomes empty (e.g. LH-only step while practising RH) are
   **skipped in Wait mode** and are **silent placeholders in Tempo mode** (cursor still passes
   through them so the display stays aligned with the music).
2. **Tied notes:** already merged by the extractor; a tied continuation is not re-expected.
3. **Grace notes / ornaments:** excluded from expected sets (setting `includeGraceNotes`
   [off]); trills are matched on their main note only.
4. **Repeated pitches in one step** (unison across staves): expected set is a *multiset* only
   if the two notes are in different hands; otherwise deduplicate (one key can only go down once).
5. **Timing:** `tStep[k] = model.beatToMs(step.onset, tempoPct/100)`; `durStep[k] = tStep[k+1]-tStep[k]`.
6. **Swing** (`EngineOptions.swing`, built 2026-09-21): where the score carries a *swing* or
   *shuffle* direction, an eighth written on the off-beat is expected where a shuffle puts
   it, not where it is printed. `onset` is replaced by `swungOnset(onset)` before step 5:
   a plain off-beat (`x.5`) moves to `x + SWING_OFFBEAT`, and nothing else moves.

   `SWING_OFFBEAT` is 2/3, and it lives in `audio/backingLoop.ts`, which is what the app
   already swings its own backing loops by — the convention a swing marking states is that
   the pair of eighths is played as the first and third of a triplet. Taking the number
   from there rather than writing it twice is what keeps the app's playing and the app's
   judging in agreement.

   **Only a written off-beat eighth.** A triplet already sits at `x + 1/3` and `x + 2/3`
   and is notated deliberately; a sixteenth inside a swung beat has no agreed placement at
   all. A swing marking is a convention about eighths, so reading it as a statement about
   anything else would be inventing a rule and then judging somebody against it.

   Because this changes only `tStep`, every mode gets it for free: Wait, Tempo, *Rhythm
   only*, `deltaMs`, the histogram and the hot spots all read that one number and needed
   no second code path. **Why it matters:** before this, a correctly swung player was late
   on every off-beat by a sixth of a beat, which at anything under about 100 bpm is outside
   `toleranceMs` — so playing a shuffle correctly scored worse than playing it straight,
   while four lessons said the app judged the shuffle.

   The host sets the flag from the piece's measured `notation.swungMark` (`build.py`'s
   `attach_notation`), never from a genre, a title or a rung (`00` §1a). Fifteen of the
   2,054 catalog rows carry it, measured 2026-09-21.

## 2. Wait mode (default with MIDI) — "the score waits for you"

State: `k` (current step), `pressed: Set<midi>` (currently held keys), `satisfied: Set<midi>`
(expected pitches struck since the step became current), `wrongCount`.

On `noteOn(m)`:
- if `m ∈ expected[k]` and `m ∉ satisfied`: add to `satisfied`, emit `noteJudged{ok:true, noteId}`.
- else if `m ∈ expected[k+1]` and setting `lookahead` [on] and `satisfied` is non-empty: treat as
  early arrival for the next step — buffer it (`earlyBuffer`) rather than calling it wrong
  (learners often roll chords or anticipate).
- else: `wrongCount++`, emit `noteJudged{ok:false, midi:m}`. In **strict** mode the step also
  resets `satisfied` (must replay the chord cleanly). In **lenient** mode (default) nothing else.

When `satisfied ⊇ expected[k]` (all struck; **release is not required** — matching on strike
is what learners expect, and the HP-130 like all pianos may send Note-Off late with pedal):
- emit `stepAdvanced{from:k,to:k+1}`; `k++`; move `earlyBuffer` hits into `satisfied` of the
  new step; if `k` past the loop end → loop or `finished`.
- **Chord tolerance:** notes of a chord may arrive up to `chordWindowMs` [80] apart; the
  engine does not wait for the window to close if all are present.

Sustain pedal (CC64) is recorded for the pedal drill scorer but never blocks advancement.

Accuracy for the run: `correctSteps / totalSteps` where a step is "correct" if it was completed
with zero wrong notes *and* ≤ 1 retry. Also report `wrongNotesTotal`.

**Wait mode measures no tempo (2026-09-25, T37).** The page holds until the note arrives, so
no lateness is recorded (`deltas` is written only in the Tempo path) and the run's `tempoPct`
is the slider's setting. `evaluateOutcome` reports `tempoMeasured: false` for it: a Wait run
meets a criterion only where the criterion asks for no tempo, and is never master-eligible.
It is honest evidence of the notes and none of the pulse; the record and the sheet say which.

## 3. Tempo mode (default without MIDI; also the "performance" mode) — "the clock drives"

The clock advances the cursor: at `tStep[k]` emit `stepAdvanced` regardless of input. A count-in
of one bar (metronome clicks) precedes **the run's first step** — for a loop, the loop's own first
step, not step 0. Metronome ticks emitted as `tempoTick{beat, bar}`, numbered from the run's
first bar. (Until T8 the count-in led into step 0 wherever the run began, so the first pass of
a loop at bar 20 sat silent through bars 1–19 and marked its own first note wrong: `tStep` is
measured from the top of the piece.)

Judging input (only if any input source is active):
- A `noteOn(m)` at time `t` is matched to the nearest step `j` with `m ∈ expected[j]` and
  `|t − tStep[j]| ≤ toleranceMs` [150], preferring unsatisfied slots; mark it `hit` with
  `deltaMs = t − tStep[j]` (negative = early).
- If no such step: `wrong` (extra note) — **unless it is the right pitch, early** (2026-09-25,
  T37): a pitch the next not-yet-open step expects, struck less than a beat before that step
  and outside its window, is held against that step. If the same pitch then arrives inside
  the window, the on-time one is the hit and the early one was an extra (`wrong`); if the
  window closes without it, the early one *was* the note, and it is counted once as
  `early` — not a hit, not a miss, its negative `deltaMs` in the timing. It used to be a
  wrong note and then a miss: one early note, two faults, neither of them "early". A beat or
  more ahead it is that pitch struck somewhere else, and still an extra note; a rhythm-only
  run keeps the rule below unchanged.
- When the clock passes `tStep[j] + toleranceMs` and a slot in `expected[j]` is unsatisfied →
  `missed`.
- Accuracy = hits / expected slots; timing stats = mean/σ of deltaMs, % early, % late.
  **Pass** needs accuracy ≥ 90 % (setting) at tempoPct ≥ 80 % (setting) — or at the rung's
  own pair where the item is on a rung (`02` Part G, `selectors.masteryCriteriaFor`).
- `correctSteps` counts the steps every pitch of which arrived inside its window, which is
  the step-shaped reading of the same run. It is counted at the note that finishes a step
  (`feedTempo`), not when the window closes: a slot is deleted the moment its last pitch
  lands, so a count at the closer could never fire and every Tempo run reported nought
  until T24 (found by playing all 1,982 catalog scores perfectly and reading the number).
  It is not the accuracy — Tempo's unit is the note — and nothing passes on it; it is the
  field `SessionScore` has always documented and never filled.

Without any input source, Tempo mode simply plays/moves and asks for the self-report at the end.
**What decides "no input" at the end is what was heard** (2026-09-25, T40): a run whose
`SessionScore.notes` is empty — no note reached the engine from any source — is *not
measured*. The sheet prints no accuracy, misses, tempo or weak bars (`04` §5), and the run is
recorded only with the learner's answer. It reads the notes and not the input selector, since
a learner with a piano selected can still play nothing; on the screen as it stands, a run with
an input chosen cannot end with nothing heard (Keep tempo holds for the first note, §3b), so the
one way to such a sheet is a run with nothing listening.

**Nothing judges a run nothing listens to (2026-09-26, C3, L42).** The engine closed every window
as a miss whatever was listening — it cannot tell, since no note arrives either way — and the
session painted each note red and flashed its key behind the *Not measured* sheet. Listen had the
same fault on its clock while its input path judged nothing, so `Hear it` painted the piece red as
it played it. The host now says so: `PracticeEngineOptions.judging` (`PracticeEngine.ts`), which
the Score screen sets to `false` when the input is *None*. With it off — and always in Listen —
the clock drives the cursor, the count-in and the end exactly as before; no note fed is judged, a
window that closes is not a miss, and the score keeps no step outcomes (nothing was decided at any
step). Wait and Free are untouched: they have no clock to close a window on. Seen on the glass at
390 × 844: the notes stay black behind the sheet and during `Hear it`, and the band still moves.

Playback in Tempo mode: the app plays **the non-focused hand** (or nothing / everything —
setting) through the Web Audio piano, scheduled ahead on the AudioContext clock from the same
`tStep` table so audio and cursor never drift (both derive from `t0 + tStep[k]`; cursor moves
are scheduled via `requestAnimationFrame` comparing `audioContext.currentTime` to targets).

## 3a. Rhythm first — "any key, the right moment"

**Ships as of P21f.** A way to practise the rhythm of a piece before its notes:
`EngineOptions.rhythmOnly`, the Score screen's **Rhythm only** toggle in the `⋯` sheet
(`04` §5). Tempo mode only.

The rule is one line: *a note-on lands on the nearest step still waiting inside
`toleranceMs`, whatever pitch it carries, and that one strike settles the whole step.*
Everything else in §3 is unchanged — the clock still drives the cursor, early and late are
still `deltaMs` from `tStep[j]`, a strike outside every open window is still an extra note,
and a slot whose window closes unsatisfied is still `missed`.

Three consequences, each deliberate:

- **A chord is one tap.** The learner was asked for the rhythm and a rhythm has one event
  where the score has three notes, so the strike closes the slot rather than removing one
  pitch from it. `hits` rises by the number of slots the strike filled, not by one, so the
  accuracy this produces is the same kind of number an ordinary run reports — the share of
  the piece the learner was in time for — and the two are comparable. One `deltaMs` is
  recorded, because one thing was played: three would let a chord shout down the rest of
  the timing histogram.
- **`noteJudged` carries the step's own note ids**, not the pitch that was pressed, so the
  cursor, the colours and the keyboard strip behave exactly as they do in an ordinary Tempo
  run. This is not a fifth mode and not a second screen; the only thing it does differently
  is stop asking which key.
- **It forgives the note, never the moment.** That is what makes the run worth recording at
  all: something real was measured. What was *not* measured is whether the learner can play
  the piece.

**Which runs measure what (2026-09-25, T37).** A Keep tempo run measures the notes and the
tempo; a rhythm-only run the tempo and not the notes; a Wait run the notes and not the tempo
(§2); Listen and Free neither. The Score screen records `tempoMeasured` on the session row
from the same rule (and `false` for a run the app heard nothing of, T40), and a tempo nobody
played to never becomes an item's best tempo.

**`SessionScore.rhythmOnly`** carries that last fact out. Its own field rather than a
flavour of `accuracyEstimated`, because the two say opposite things — an estimated accuracy
is the same claim measured less certainly, this is a different claim measured exactly. The
Score screen reads it and refuses the run `passed` and `masterEligible` whatever the
numbers came out at (`04` §5); the minutes and the attempt are recorded as normal, because
the practice was real. The field is absent rather than `false` on an ordinary run, so a
score written before it existed reads the same as one written after.

**Why Tempo only.** Wait has no clock to be inside, Listen judges nothing and Free marks
nothing, so anywhere else the toggle would be a control that changes nothing (`04` §0 R4).
The engine refuses it at construction rather than trusting the caller. A **blind** run and
a **performance** ignore it for a different reason: both are claims about playing the
piece, and they are settled by the route rather than by a toggle, so the toggle gets no say.

## 3b. The first note starts the clock (T8)

**Ships as of T8** (`docs/prompts/tasks/T8-latch-the-start.md`). A Tempo run the learner
leads does not start its clock at the end of the count-in: the count-in teaches the tempo,
and the learner's first note then *defines* when the first step sounds. Everything after is
timed from that note, so a late entry cannot displace every judgement behind it.

`EngineOptions.latchStart`, Tempo only. The engine does not decide whether a run is
learner-led — it does not know what the app will play — so `ScoreSession` does, with
`learnerLeads`, from the same `appPitches` the playback uses:

| Case | Start |
|---|---|
| The learner's first note comes before anything the app plays, or with it | **holds** for the first note |
| The app sounds first (a left-hand intro while the right is practised; `playbackHands: both`) | starts itself, as before — the learner joins what they can hear |
| Listen, Wait, Free | never latch |
| No input source | never latches — nothing could play the first note, and Tempo is the mode meant to work without one. A microphone that fails to connect restarts the run with no input, for the same reason |
| A ladder restart between passes | never latches — the practice is continuing, not starting |

The mechanism, all in `PracticeEngine`:

- **Holding (`armed`).** When the count-in ends with nothing played, the clock stops: `musicMs`
  is fixed on the learner's first note, no ticks, no windows close, the cursor sits on that note
  and `armed` is emitted. It holds at the **count's end**, not at the note, so a silence before
  the learner's first note — a rest, or the other hand's intro with nothing playing it — is
  skipped rather than counted through. A screen must say so — a holding run looks exactly like
  a frozen one.
- **The latch.** Any note-on while holding, or a note-on within the tolerance before the
  count's end, sets the clock so that note *is* the first step, latency removed
  exactly as `feedTempo` removes it; the note is then judged normally, at `deltaMs` 0.
  `latched` is emitted with the note's corrected time.
- **Strays.** A note before the first note's window, while counting in, is ignored — not
  judged, not a wrong note — and the latch keeps waiting. (Before T8 it was a wrong note.)
- **No click while holding** — including a run that holds from its first moment (no
  count-in), and one resumed while holding.
- **Nothing pitched sounds while holding.** `holdingFrom` gates playback from the first note
  on, so the app's note on that beat sounds on the learner's key (`ScoreSession.onLatched`),
  and a microphone — echo cancellation is deliberately off — cannot start the run on the
  app's own sound. The metronome stops at `armed` and restarts at `latched` on the next beat
  of the run's grid, with the accent where that beat falls (`BeatScheduler.firstBeatInBar`).
- **Practice time** does not include holding. The music clock and the run's duration are
  separate fields: `clockOriginMs` is moved by laps, resumes and the latch; `durationMs`
  counts from the run's start less pauses and holding. They used to be one field, so every
  lap restarted the duration — thirty seconds of looping recorded −40 ms.
- **Loops latch once.** Later laps keep time; re-arming would stop a loop being a loop.
- **Wait and Free** have no clock to set, but their practice time now starts at the first
  note rather than at Start.

**Resuming** (`resume({ recountMs, latch, toStep })`, called by `ScoreSession.resume`): a
clock-driven run counts one bar back in, on its own beat grid, closing as missed any window
left open at the pause. Who leads is decided **from where the music stopped**: if the learner's
next note comes before anything the app plays, the count leads to that note and the run holds
for it; if the app sounds first, the count leads to the app's next note and nothing holds.
(Deciding it from the learner's next note answered "the learner" every time, so an app-led
resume skipped part of the app's part and then froze — found by review.) A pause taken while
holding resumes holding, with no count and no click. A pause takes back the app's notes that
were queued on the audio clock and not yet heard, so they play after the resume rather than
into the pause; and a second pause during a resume's own count measures "where the music
stopped" from where that count was heading, not from its rewound clock. It used to carry on cold, mid-bar, with the
metronome restarted on a fresh grid of its own — so after every pause the clicks and the
judging were out of step.

**Switching the click on mid-run** (`ScoreSession.setMetronome`, added 2026-09-22, T23) uses
the same grid arithmetic a resume uses (`startMetronomeOnGrid`), so a click started in the
middle of a piece agrees with the timetable the notes are being judged on rather than
starting a grid of its own. It refuses the **four** states in which a click would be a pulse
with no music under it, enumerated because the count was first written as three and the
fourth is in the code with a comment of its own (T23, second reading): a run that is not
running (`!state.running`), a paused one (`state.paused`), one still holding for the first
note (`state.armed`) — that one for the reason above, that nothing pitched or metrical may
sound while the microphone is what will end the hold — and **Free play** (`engine.mode ===
'free'`), which has no timetable to click against and which `startRun` refuses the same way
on the way in (`run.mode !== 'free'` on the `startMetronome` line). Until this the Metronome row
restarted the whole run instead, which cost the learner the run to gain a click (`04` §5).
**The row says which of the four it is** (T33, the state-machine document's C3, decided
2026-09-23): Free play is the one true refusal — the row reads *Off*, is disabled while the
mode has no clock, and says *no clock in Free play* — and the other three are waits, not
refusals (the start, the resume and the latch each start the click), so the row stays live and
says when the click will be heard. A paused run no longer hands the piano anything either
(`schedulePlayback` returns while paused): the pause's take-back of queued notes was undone by
the very next frame, because a paused clock stands still inside those notes' look-ahead.

**Deliberately unchanged:** Paper (it measures each onset against the nearest *audible*
click, so there is no timeline for a late entry to shift), the chord chart (it judges the
held chord against the bar at each moment, and the bar is marked by audible clicks and, with
comping on, the app's own playing), Simon (its answer is judged on pitch order, not time),
the lab, the metronome and free play.

**The rhythm drill** latches too (`RhythmDrill.latchOnFirstTap`): the first tap inside the
first onset's window, or any later one, sets the pattern's start; taps before the count-in
has found the downbeat are strays. The click stops after the count-in's downbeat and comes
back in phase after the first tap.

**The whole machine, state by state and event by event**, is written down in
`docs/decisions/2026-09-23-score-state-machine.md` (T31): twenty states, fourteen columns,
which cells were measured by driving the screen and which were read out of the code, the six
faults it found, and the five choices it left for the owner — decided on 2026-09-23 and built
by T33 (§7 there says what and why). Two of them are session machinery: **a run can be set
aside** under a demonstration (`ScoreSession.suspend` / `restoreSuspended`: the engine, its
judgements and its scheduling moved out of the way intact and put back paused, C1), and **a
run can start paused** (`RunOptions.startPaused`: paused before the first frame, so nothing is
scheduled or clicked, for an option changed while the run was paused, C2).

## 4. Listen mode

Tempo mode with all input ignored and both hands played back; the learner watches/listens. Loop
and tempo controls apply. Used for "play this bar for me" long-press.

### When the page is hidden

A browser stops issuing animation frames when the page is not being drawn — another app in
front, the screen off, the tab hidden — and a clock-driven run that ticks only from frames
stops advancing without saying so. Two things follow (`00` D26, decided 2026-09-07):

- **The run pauses and says so.** On `visibilitychange` to hidden a running Tempo or Listen
  run pauses. On return the status line reads *Paused — you were away 40 s*, with **Resume**
  and **Restart**. The away time is not practice: the engine already subtracts pauses from
  elapsed time, and the session's recorded minutes must subtract them too. Never catch up
  silently — a phone call must not become a page of missed bars.
- **The engine ticks from a timer as well as from frames.** The frame loop stays the painter;
  `engine.tick()` is also driven by a short interval. `tick()` is idempotent on the clock, so
  two callers cost nothing, and a starved animation loop then slows the paint and never the
  music.

**Ships as of P21.** The interval is `TICK_INTERVAL_MS` (25 ms) in `score/ScoreSession.ts`; the
pause lives in `ScoreScreen`, where the status line and the buttons already are. **It asks the
run's mode, not the mode selector's** (T31): `Hear it` and the long-press bar preview are
Listen runs under a selector that still says *Wait for me*, and asking the selector let exactly
those two — the two clock-driven runs a learner is most likely to start and then put the phone
down during — carry on into a locked phone, which is the one thing this pause exists to
prevent. Measured by driving a `Hear it` run and hiding the page: it was not paused.
The sentence on return is on the **state line** (`04` §5f) rather than on `#score-status`,
because being paused is a thing the run is doing and there is one line for that; it used to be
on the status line beside a state line still reading *The count-in clicks, then play along*,
and sideways only one of the two is drawn. Resume is the
bar's `▶` and restart the `Start again` row in `⋯` rather than two new buttons for something
that happens once a session (this said `⏮`, a glyph no control wears; T33 corrected it). Wait and Free are left alone — they have no timetable to lose, so the run is exactly
where he left it. Found while checking the minutes: `elapsedMs` returned 0 the instant a run
ended, so every score run had been recorded as `durationMs: 0`.

## 5. Free mode

No cursor logic; input goes to the keyboard strip and is optionally recorded (`sessions` row
with the raw event list) for the improvisation track. A backing-track drill (`[GEN]` kind
`backing-track`) is Free mode plus a looping accompaniment.

## 6. Loops and sections

`loop = {fromStep, toStep}` derived from bar numbers via `model.steps.find(isMeasureStart)`.
On reaching `toStep` the engine emits `finished{loop:true}` and restarts at `fromStep` after a
one-beat gap (Wait) or immediately on the grid (Tempo). "Loop the weak bars" builds a loop from
the bars with the most misses in the last run.

### The tempo ladder (P21f)

The loop repeats the hard bars; the ladder is what turns repetition into practice. With it
on, **each clean pass raises the tempo one notch and each pass with a mistake in it lowers
one**, starting from whatever the tempo is when the toggle is pressed.

The rule is the pure function **`nextLadderTempo`** in `engine/PracticeEngine.ts` — beside
`LOOP_GAP_BEATS`, the other rule about what happens at a lap boundary. The engine does not
apply it: a tempo change re-times the whole session, which means a new run, and starting
runs is the Score screen's business. So the engine states the rule and the screen calls it
at `finished{loop:true}`.

- **The notch is `LADDER_NOTCH_PCT`, ten points.** It came from the summary sheet, whose
  `Slower (−10 %)` and `Faster (+10 %)` have been one rung of this same ladder since the
  sheet was written. Two different steps for one idea would mean the automatic route and
  the manual one disagreed about what "a bit faster" is, and the learner would be the one
  holding both numbers.
- **The range is the tempo slider's own**, `MIN_TEMPO_PCT`..`MAX_TEMPO_PCT` (30–130), not a
  second range invented here.
- **A climbing ladder stops at `LADDER_CEILING_PCT`, the written tempo** — above it the
  learner is racing the piece rather than learning it, and nothing should decide that for
  them. The one exception: a learner who had already asked for more keeps what they asked
  for, so the ceiling is the highest tempo they have chosen for this run by hand. A ladder
  must not overrule a hand on the slider.
- **Clean means nothing missed *and* nothing wrong, in that pass.** A bar played at the right
  moments with the wrong notes in it is not a pass of that bar, and the ladder is the one
  control that acts without being asked each time, so it reads the stricter of the two. The
  engine's totals run for the whole run, not for the lap, so the screen compares each lap's
  finish against the previous one's. Judging on the run's totals instead would let one
  stumble in the first pass follow the learner for the session — and at the floor, where the
  tempo stops moving and the run is never restarted, it could never be climbed out of again.

A pass that cannot move the tempo — at the floor, at the ceiling — leaves the run alone
rather than restarting it, so it costs no count-in and buys an identical pass. A pass that
does move it restarts the run at the new tempo, deferred by a microtask: the engine emits
the lap's `finished` from the middle of `completeLap` and still has the next lap's clock to
rebase afterwards, so tearing it down from inside its own event would leave the new run's
cursor set from a dead engine.

The ladder is ignored during `Hear it`: a demonstration judges nothing, so every lap of one
is trivially clean and the ladder would climb on playing nobody did.

**A pass nothing listened to holds the tempo** (2026-09-26, T42): with no input no miss is
counted (§3, L42), so the comparison above read such a pass as clean and the ladder climbed to
the written tempo on playing nobody did (CI caught it), and the screen now leaves the tempo
where it is, restarts nothing and says *Nothing listening — staying at 40 %*, the reason rather
than a floor (`listening()` in `ScoreScreen.ts` is the one fact behind this hold and the run's
`judging`).

**Clearing the loop switches the ladder off.** It is a property of the loop it climbs, and
run state for the same reason the loop is (`04` §5). Left on, the Ladder row disappeared
from the sheet with the toggle still pressed underneath it, and the next loop set — later
that session, on the same piece — started moving the tempo by itself with nothing on screen
having asked. The one control that acts without being asked each time has to be off
whenever nothing shows it on.

### Opening with it on: `?ladder=1` (2026-09-22)

The ladder had no address, so `04` §3d could not list it among a rung's tools and seven
rungs — the scales, the arpeggios, Hanon and the octaves — named no mode at all. It looked
circular: the ladder needs a loop, and the rule above turns it off with one.

**The circle only exists for repertoire.** On those seven rungs the whole item *is* the loop:
two to thirty bars that repeat by nature, where looping the whole thing is not a choice about
which bars matter. So `?ladder=1` sets that loop and turns the ladder on **in that order, as
one action**, and the paragraph above is satisfied rather than excepted: the Loop control
names the bars and the Ladder row shows the toggle pressed, so two things on screen have
asked.

It **fails closed**, because the failure being avoided is a control acting unasked:

- **no resolvable whole-item loop, no ladder** — and no loop either, since a loop nobody asked
  for is the same fault one step earlier;
- **a mode the hash named that has no tempo to move gets neither**. Where the hash names no
  mode, `?ladder=1` brings Tempo with it, the same way a sight-read is always Tempo (§8);
- **a performance gets neither**, being one pass by definition.

And **clearing the loop still switches the ladder off**: the route is not special-cased to
survive, because an exception there reintroduces exactly the state this section describes.
`ScoreScreen.ts`'s `applyRouteLadder` is the whole of it, and it arms the ladder only when
`ladderApplies()` — the Ladder row's own condition — is already true.

## 7. Drills that are not scores (`type: 'drill'`)

Two different things are easy to confuse and are not the same:

- A **generated exercise** (`type: 'exercise'`) is real notation built at content-build time
  by `tools/content/generate_exercises.py`. It has a `.mxl` file, it opens in the Score
  screen, and every practice mode works on it. Scales, arpeggios, Hanon, and — from P5b —
  coordination, cadences, accompaniment patterns, interval reading and the rest of `02`
  Part E2.
- A **drill** (`type: 'drill'`) has no notation and no file. It is a prompt-and-answer loop
  built at runtime from the `drill.kind` below.

When both could express a skill, prefer the exercise: it is inspectable, it can be practised
slowly in Wait mode, and it renders in the previews so a mistake in it is visible before a
learner meets it.

Drills are implemented as small engine plugins sharing the input pipeline. The engine side is
P3; **P8 adds the screens (`04` §5c) and `engine/drills/fromCatalog.ts`**, which turns a
catalog item's `drill.params` — chord symbols, roman numerals, interval names, note names,
rhythm values — into the MIDI numbers the plugins want. That translation is the reason a new
drill is a content change and not a code change; `theory.ts` beside it does the parsing and
returns null rather than guessing, so an unreadable parameter is a visible failure.

| kind | behaviour | scoring |
|------|-----------|---------|
| `note-flash` | shows one note on a staff (range from params), waits for the key | % correct, mean reaction ms |
| `find-key` | shows a key name, waits | same |
| `chord` / `inversion` | shows symbol (e.g. `F/A`), waits for the exact pitch set (any octave by default) | same |
| `ear-interval` / `ear-chord` / `ear-progression` | plays audio, waits for the learner to play it back (interval: two notes in order; chord: set; progression: sequence of sets) | same |
| `rhythm` | shows a rhythm on one line; learner taps any key; judged like Tempo mode on onsets only | timing accuracy |
| `pedal` | Tempo-mode chord sequence; scores CC64 transitions: a "clean change" = pedal up between 0 and 120 ms *after* the new chord's first Note-On, then down within 250 ms | % clean |
| `dynamics` | asks for p then f phrases; measures mean velocity ratio | ratio ≥ 1.6 |
| `sight-reading` | see §8 | Tempo-mode accuracy on the first attempt only, of a phrase not played to the learner |
| `call-response` | plays 2 bars, expects them back (pitch + rhythm within tolerance) | accuracy |
| `backing-track` | Free mode + loop | none (records) |

**P12b adds seven more**, for the harmony and ear skills `02` Parts D2–D4 name:

| kind | behaviour | scoring |
|------|-----------|---------|
| `mode` | names a root and a mode, waits for one octave ascending, in order | % correct |
| `chord-scale` | shows a chord symbol, waits for the scale that fits it | same |
| `extended-chord` | shows a 9th, 11th or 13th, waits for every note of it | same |
| `roman-numeral` | shows a numeral and a key (`V7/vi` in F), waits for the chord | same |
| `transposition` | prints four bars from the §8 generator, waits for them in the named key; the expectation is the printed model moved by the interval | same |
| `ear-tune` | plays four or eight bars, then takes them back a phrase at a time; the hint names the phrase's first note | same |
| `harmonic-dictation` | plays a progression, waits for it back **as chords** — a chord is complete when nothing new has arrived for `CHORD_BOUNDARY_MS` (120 ms) or a note belonging to the next expected chord arrives | whole progression right or wrong |

The last one is the only drill whose answer is a *series* of pitch sets arriving as one
stream of note-ons, so it is a class of its own rather than a `PromptDrill`, and the screen
has to tick it: the final chord of a progression is followed by no note at all, so the
silence half of the rule needs something other than the next input to notice it.

**Added since**, and in `RUNTIME_DRILL_KINDS` (`engine/drills/fromCatalog.ts`), which is the
list `validate.py` reads for the tips check (`03` §6a):

| kind | behaviour | scoring |
|------|-----------|---------|
| `simon` (2026-09-15, `04` §5c-2, `engine/drills/simon.ts`) | plays one note, waits for it back; then the same note and one more; then three — until the chain breaks. Notes drawn up front from the seed, from a key's degrees or the chromatic scale, never the same note twice running; judged in order *and in the octave played* | the longest chain echoed, as a share of `SIMON_ROUNDS`; the pass is a chain length, not a percentage, and the best chain is read back from the item's best accuracy |

**Two kinds that are not in that list and still run.** `five-finger` and `arpeggio` are
*notation families* — the names `generate_exercises.py` gives exercises that have a file — and
a few catalog rows carry them as `drill.kind` with no file. `fromCatalog.ts` treats any
notation-family kind on a file-less drill row as a **technique pattern** (`buildTechniquePattern`):
a five-finger walk or an accompaniment shape in the row's key and hand, demonstrated and then
played back in order, up to four prompts, scored like `call-response`. They are deliberately
*not* in `RUNTIME_DRILL_KINDS`, so no tips file is required for them and the tips check skips
them; the P8 decision note records the two as probable data mistakes kept alive because a
drill that works beats a dead row.

Drills also listen to the microphone (§11.4). The screen offers it when the owner has put
`mic` in the follow-input priority — never automatically, because opening it raises a
permission prompt — publishes the current card's expected pitches to the detector (§11.1),
ignores any answer below 0.5 confidence rather than marking it wrong, and mutes an ear
drill's own playback while listening, since the phone would otherwise hear itself.

## 8. Runtime sight-reading generator (TypeScript, emits MusicXML)

Because the whole point is *unseen* material, the app generates it on the phone:
`generateSightReading({ level, key, timeSig, bars, hands })` → MusicXML string → normal Score
screen in Tempo mode. Level table (extend as the curriculum grows):

| level | pitch range | rhythms | hands | motion rules |
|------:|-------------|---------|-------|--------------|
| 1 | RH C4–G4 | ♩ 𝅗𝅥 𝅝 | RH | steps only; start/end on C |
| 2 | RH C4–C5, LH C3–G3 | + ♪ pairs, dotted ½ | alternating hands | steps + 3rds |
| 3 | RH C4–C5 + LH C3–C4 together | + ties, rests | HT (LH whole/half notes) | LH roots of I/IV/V; RH chord tones on strong beats |
| 4 | ± ledger lines, keys to 2♯/♭ | + dotted ♩, 6/8 | HT | LH block chords or broken chords |
| 5 | keys to 3♯/♭, 2 octaves | + syncopation | HT | RH chord tones on strong beats; LH Alberti |
| 6 | keys to 4♯/♭, 2 octaves | + triplets | HT | as 5; LH broken chords |
| 7 | keys to 4♯/♭, 2 octaves | + 16ths | HT | as 5; LH walking |

Deterministic from a seed so a failed sight-read can be retried identically once.

**Unseen means unheard as well (2026-09-25, T40).** A run of a phrase the app has played to the
learner — `Hear it`, a held bar, *Play it to me*; any Listen run on it, before the run or during
it — is not a first reading, exactly as a retry is not; since C1 (2026-09-26) both are recorded
as practice, flagged `unseen: false`, and pass nothing (`01` §4.5). The Score screen
keeps that per phrase for the visit (`phraseHeard`, set where a Listen run starts); T33 had it
per run, from the bars of a demonstration inside the run, which a fresh start emptied. The
summary sheet of every sight-read offers **New phrase**: the same row with a fresh seed in the
route, which is how the screen is told to draw one. Not kept across visits: a phrase heard,
left unplayed and opened again is a first reading to the next visit (Today's read, and any
route that carries its seed — *New phrase* writes one — open on the same phrase again).

**What a row asks for reaches the generator (2026-09-25, T37).** `sightReadingOptionsFor`
(`sightReading.ts`) is the one reader of a catalog row's `drill.params`: `level`, `bars`,
`hands`, `bpm`, `fifths` (a number, or a list the seed chooses from), `timeSig` (`"6/8"`, or
a list) and the features a rung promises — `skips`, `eighths`, `syncopation`, `triplets`,
`accidentals`. The Score screen used to pass the level, the hands, the bars and the seed, so
every phrase in the app was C major, 4/4, 72 bpm. A promised feature is both *allowed*
(level 1 may move by a third where `skips` asks) and *guaranteed*: a phrase without it is
drawn again from a seed derived from the first, so the seed still names one phrase. A key or
metre list is chosen from a stream of its own, so the melody a seed writes in the chosen key
is the melody it writes when that key is asked for outright. The nine rows now ask for:

| row | rungs | asks for |
|---|---|---|
| `sight-reading-1` | 1.5 | C, 4/4, `skips` (a step and a third in every phrase, inside C4–G4) |
| `sight-reading-1-left` | 1.3, 1.4 | C, 4/4 |
| `sight-reading-2-right` | 2.2, 2.5 | C, 4/4, `eighths`, `skips` |
| `sight-reading-2` | 3.4, classical.3 | C, 4/4, `eighths` |
| `sight-reading-3` | 4.5, 4.6 | C, 6/8 or 4/4, `syncopation` and `triplets` in the 4/4 phrases |
| `sight-reading-4` | 4.6, technique.5 | C, 4/4, `accidentals` (the raised fourth rising to the fifth) |
| `sight-reading-5` | theory.6 | keys to three accidentals, 4/4, `syncopation` |
| `sight-reading-6` | chords-pop.8, theory.9 | keys to four accidentals, 4/4, `triplets` |
| `sight-reading-7` | jazz.8, theory.9 | keys to four accidentals, 4/4, `triplets`, `sixteenths: false` (C4b, S23: no rung teaches reading sixteenths) |

**Levels 1–4 place every note where its length belongs** (same date): a plain note of length L
starts on a multiple of L, a dotted quarter on a beat, a dotted half on beat one or three; in
6/8 a bar is filled a dotted-quarter beat at a time from the dotted quarter, the
quarter-eighth lilt and three eighths. The old draw put a quarter-or-longer note off the beat
in 74 % of level-2 phrases, 98 % at level 3 and all of level 4 — syncopation three stages
before 4.5 teaches it. Levels 5–7 keep their draw (their syncopation is designed and the
goldens pin it). **A rest inside a triplet keeps the triplet**: it lost its
`<time-modification>` and its bracket's start or stop in 87 % of level-6 and 89 % of level-7
phrases. **Short notes are beamed by the beat** (a quarter; a dotted quarter in 6/8), a
triplet as its own group: nothing was beamed, so every generated eighth carried a flag — on
rung 2.2, whose concepts include `beams`, and in 6/8, whose groups of three are the metre.
Found by looking at the rendered phrases, not by any test. **The accidental** is a short
passing or neighbour note (a quarter or less, off beats one and three) rising a semitone to the
fifth; a first version let it sit for two beats on beat three over the tonic chord.
`sightReadingPromises.test.ts` generates every row and checks each phrase for what its rungs
promise and for nothing the earliest rung listing it has not taught.

**What a phrase demands is measured by one module (2026-09-26, C2).** The checks that test
made (an eighth, a triplet, a skip, syncopation, an accidental, a walking bass) were a dozen
helpers reading the MusicXML string inside the test. They are now `app/src/demands/detect.ts`,
reading the score model the engine plays, which keeps the written parts of a tie chain
(`ScoreNote.tiedDurations`) and the tuplet (`ScoreNote.tuplet`) for them. The taught-at table
is `taughtAt` in `content/curriculum/vocabulary/demands.json`, so the absence check covers
every v0 demand rather than six. Moving them found three things: a melody in the left hand
alone counted as an accompaniment pattern; a broken chord in quarters counted as a walking
bass, which is how level 6 passed theory.9's "walking bass", a sentence about level 7; and
`sight-reading-2-right` writes past C position on 2.2 (S16, recorded in the test, not fixed
here). Two limits the model sets on every detector: it carries no clef (staff 1 is read as
treble, staff 2 as bass, which every generated phrase is) and only the first key signature.

**What comes next is chosen from the reads (2026-09-26, C4; the demand it moves since C4c).**
The row a learner reads used to be a constant per stage. Today's daily read and the session's
reading slot come from one function, `readingOffer` (`curriculum/session.ts`; the rule and its
reason lines are `04` §2): the rung's own row, moved one demand at a time by sight-reading's
evidence stored on the learner's rows (`01` §4.5) and C4a's readings of it per demand (§9b). A
**recipe** is a row's own params with some of them moved, spelled as the params are
(`ReadingMoves`: every option the control map below moves), and `readingOptions(item, recipe,
seed, taught)` is the one writer of a phrase — for Today, the rung page, the Score screen and the
tests: the row's `sightReadingOptionsFor` with the moves laid over it, **held to what the rung
that opened it has taught** (`heldToRung` with the route's rung, C4c: 2.2's row stays inside C
position until 2.5 teaches leaving it, S16), the recipe's own moves standing over the hold (the
reader asked for them, at the learner's rung, which can be later than the row's).

**The reader moves the demand the evidence supports (C4c).** C4 moved six dimensions of its own
(hands, range, rhythm, key, metre, syncopation) and stepped down by backing out whatever it had
added last, so a learner who misread every skip lost the left hand (L64). The six were today's
controls, never the ontology of difficulty (the reviewer's fourth message §4), and the
hand-written table is deleted: the reader asks C4a's readings which demand the reads single out,
and C4b's map (`readingControls.ts`, below) which control changes it.

- **A step down** (two reads against the recipe, `READER_POLICY.stepDownAfter`): the
  sight-reading demand the reads single out (`pattern` or `isolated`; "shorter than a quarter"
  is the eighths, one control), among those the phrase still holds — that demand's control
  **off**, nothing else moved; or, where no control keeps it out at this rung, the recipe held
  and the line says so. Nothing singled out: nothing blamed, the recipe held, the easy read
  (below) where there is one, and the line says the app is not sure yet what went wrong.
- **A step up** (proficient at the recipe, `stepUpAfter` days by the ladder's rule, *and* no
  demand the phrase holds below the support share in those reads, and the read before not an
  easy one): the first demand, in the order the curriculum teaches them (then the vocabulary's),
  that the learner's rung has taught, the phrase does not already promise, the reads have not
  shown (`demandShownAfter` phrases held), whose skill is not failing elsewhere, whose move
  brings nothing untaught — and which C4b declares realisable there (`UNREALISABLE_AT`, and no
  new reason from `unrealisable`). None: the next step waits for a later lesson.
- **The easy read** (after `easyAfter` reads that were not): the newest demand the recipe
  turned on, undone; else C position, then one hand, where the row's promises allow — C4's
  band, one below the recipe, flagged easy.
- **A rung that moves on** (the row's rung has changed since the last read, and its phrases may
  now hold a demand the last read's could not): the recipe is held that day and the line says
  what the lesson adds — one change a day.
- **Keys are not ranked.** The key signature's control is every key the level writes with a
  signature, a set the seed chooses from; the line names the key the phrase is in ("A key
  signature to read: G major, one sharp") and never says "now" of a key.

`READER_POLICY` holds the four numbers (`easyAfter` 3, `stepDownAfter` and `stepUpAfter` the
ladder's 2, `demandShownAfter` 2), each **policy and a hypothesis**, passed in so a later wave
can make them depend on the learner's state without touching the logic. Every move the reader
asks for at a rung listing a reading row is one C4b declares realisable
(`sightReadingFromReadingState.test.ts`); the moves the thirty-day and ambiguity diaries asked
for, and every recipe they read, are generated and read with the detectors
(`firstThirtyDays.test.ts`, demonstration 4).

**The contract over composed recipes (2026-09-27, C4d, S29).** C4c found the reader's composed
recipes missing promises: by 3.1 the diary's learner reads both hands, dotted quarters, ties, a
key set and an accidental at once, and at five of twelve seeds a phrase went out without its tie,
dotted quarter or accidental, silently. Counted before anything changed: every miss was the
redraw budget (64 draws) running out, and the generator's own tally agreed with the detectors at
every seed. All were in G major, where level 2's raised fourth (C sharp) lies at the bottom of the
range: a draw keeps the accidental about once in forty there (once in eight in C, once in five in
F), all five promises about once in two hundred. The budget is now 4096 draws, sized from the
rarest recipe the reader can reach (about once in 370 draws; a seed of it misses a promise about
once in 60,000); the loop stops at the first draw that keeps every promise, so only phrases that
used to go out without one changed (five of the unchanged golden's older-option phrases, each a
phrase that had lost its promised accidental). `composedContract.test.ts` walks what the reader
can offer — from each core rung's row, the reader's step ups in the taught-at order (with the
passes-over it can make: a demand the phrases may already show, or whose skill the row declares),
one step down on a demand the phrase holds and the step ups after it until that demand is back,
and each easy read — about 1,100 recipes, not every combination of controls, and holds each to
the single-move terms over twelve seeds. Two compositions it found are not a budget: a moving
left hand asked for outright is now also a promise that the melody strikes in every bar
(`underTune`; a tie into a 6/8 bar held whole left one bar with the pattern alone, which the
detectors do not read as a pattern under a tune), and the hand held in the key's own position at
levels 2–3 in G major climbs above the level's range (G to D, where 2.5's row stops at C), which
`unrealisable` now declares, so the reader does not offer it: a step up passes to the next move or
the next step waits, a step down holds and says so, as for a single impossible move. None is listed
as unreliable (`COMPOSED_UNRELIABLE` is empty).

**The curriculum–generator contract (2026-09-26, C4b).** On 2.5 the reader had nothing to move
for ten days (the thirty-day diary): ties and dotted quarters are taught at 2.4, and the
generator wrote them only at higher levels. The fix is a contract over the whole reading
curriculum, not a patch for 2.5 (the reviewer, Part 8): at every core rung, every demand the
rung has taught can be written into the rung's reading row, or the reason it cannot is
declared. Three parts:

- **A control for every demand, in app code.** `app/src/engine/readingControls.ts` maps each
  demand of vocabulary v0 to the generator option that writes it (`on`) and the one that keeps
  it out (`off`), whether a phrase of given options may contain it at all (`mayWrite`), and what
  else a move measurably brings. The vocabulary gained only each demand's musical `dimension`
  (`02` Part H); the map is not in it, so a later generator can be unbundled without the
  vocabulary, or the evidence that names its ids, moving. New options, each tri-state (`true`
  promises the demand and redraws a phrase without it, `false` keeps it out, absent is the
  level's own — so every golden and every row's phrase is unchanged with them absent,
  `sightReadingUnchanged.test.ts` against hashes written by the generator before C4b):
  `ties` (only from a note on the beat, so a tie is never syncopation), `dottedQuarters` (in
  simple time, beside a pair of plain eighths where the level writes eighths), `ledger` (the
  right hand down to the A below middle C; `false` holds the range off the ledger lines),
  `leaps` (a fourth or wider; `false` holds the melody to steps and skips), `sixteenths`, and
  `leftHand` (`whole`, `chord`, `alberti`, `broken`, `walking`, with the left-hand range of the
  level that first writes that pattern: an override, the level's own pattern when absent).
  `skips`, `eighths`, `syncopation`, `triplets` and `accidentals` gained `false`;
  `position: false` promises a melody wider than one five-finger position.

  | demand | dimension | on | off |
  |---|---|---|---|
  | `clef.bass` | clef | `hands: 'L'` (level 1: the melody on the bass staff), `hands: 'both'` (2+) | `hands: 'R'` |
  | `pitch.ledger` | range | `ledger: true` | `ledger: false` |
  | `interval.step` | interval | — (in every phrase) | — (none needed or written) |
  | `interval.skip` | interval | `skips: true` | `skips: false` |
  | `interval.leap` | interval | `leaps: true` | `leaps: false` |
  | `rhythm.eighths`, `rhythm.shorter-than-quarter` | rhythm | `eighths: true` | `eighths: false` (the second also `triplets`, `sixteenths: false`) |
  | `rhythm.sixteenths` | rhythm | `sixteenths: true` | `sixteenths: false` |
  | `rhythm.dotted-quarter` | rhythm | `dottedQuarters: true` | `dottedQuarters: false` |
  | `rhythm.ties` | rhythm | `ties: true` | `ties: false` |
  | `rhythm.syncopation` | rhythm | `syncopation: true` | `syncopation: false` (levels 5–7: every note where its length belongs) |
  | `rhythm.triplets` | rhythm | `triplets: true` | `triplets: false` |
  | `metre.compound` | metre | `timeSig: 6/8` | `timeSig: 4/4` |
  | `key.signature` | key | `fifths`: every key with a signature the level writes, sharps and flats, a set the seed chooses from (keys are not ranked) | `fifths: 0` |
  | `pitch.chromatic` | accidental | `accidentals: true` | `accidentals: false` |
  | `range.beyond-position` | range | `position: false` | `position: true` |
  | `texture.hands-together` | texture | `hands: 'both'` | `hands: 'R'` |
  | `texture.left-hand-pattern` | texture | `leftHand: 'broken'` (`'alberti'` where a phrase may be in 6/8) | `leftHand: 'whole'` |
  | `texture.walking-bass` | texture | `leftHand: 'walking'` | `leftHand: 'broken'` |

  Declared as brought, measured: the left hand added at level 2+ brings the bass staff, both
  hands at once, and its roots' leaps; a tie at level 2 can bring a leap (its closing note is
  set after the melody has moved on — a fault of the tie's closing, D's, declared not fixed);
  a moving left-hand pattern brings ledger lines below the bass staff (built from C2).
- **`unrealisable(options)`** (`sightReading.ts`, pure): what the generator cannot write, in
  words, instead of writing something else and letting it pass. The reasons, as printed:
  "Level 1 writes one hand at a time; both hands start at level 2." · "A left-hand pattern is
  written under a melody, so it needs both hands, from level 2." · "From level 2 the left hand
  read alone plays its accompaniment, with no melody for these options to shape." · "Level 1
  writes C major only." / "Level N writes keys up to M sharps or flats; a wider key is written
  in the widest it has." · "A left hand read alone at level 1 starts and ends on the C below
  middle C, too far by step from a ledger line to reach one and come back." · "Held inside one
  five-finger position from middle C, the melody has no ledger line beyond middle C to reach."
  · "Level 1's range is one five-finger position, so its melody cannot leave it." · "Held
  inside the five-finger position from its tonic, a melody in one of these keys would climb
  above the top of the level's range." (C4d, a composition) · "The
  broken-chord and walking left hands move in quarters, which cross the dotted-quarter beat of
  compound time." · "The Alberti, broken-chord and walking left hands are built from the C two
  octaves below middle C, on ledger lines below the bass staff." · "A phrase in compound time
  is not asked for syncopation or triplets: one new metre is enough to read (T37)." · "In
  compound time the dotted quarter is the beat itself, not a dotted note to read." · "Compound
  time at levels 1–4 is written in its three first figures, all of dotted quarters, quarters
  and eighths." · "A tie crosses a bar line, and a phrase of one bar has none." · "A melody
  held to steps cannot leap." · "A tie's closing note is set to the tied pitch after the
  melody has moved on, so the note after it can be a third away / a fourth or wider away." ·
  "From level 5 the melody moves to a chord tone on the strong beats, which can be a third /
  a fourth or wider away." · "The Alberti, broken-chord and walking left hands move by
  thirds." · "The left hand's roots move between I, IV and V, by fourths and fifths." · "The
  syncopation below level 5 is the eighth–quarter–eighth figure." · "A dotted quarter in
  simple time is completed by an eighth." · "From level 5 a syncopated bar opens on an eighth
  rest and leaves an eighth to fill." · "The Alberti left hand is in eighths."
- **The contract test** (`generatorContract.test.ts`): for every core rung from 1.3 to 4.7,
  the reader's row there (`readingOffer`, no reads) held to what the rung has taught
  (`heldToRung`: on 2.2–2.4 the right-hand row inside C position, S16; elsewhere the row as it
  stands), and every taught demand, on and off, over twelve seeds, through the generator,
  OSMD, the extractor and the detectors: the demand in every phrase asked (for syncopation,
  triplets and the dotted quarter, every phrase in simple time), the rung's and the row's
  promises kept (a promise about the demand itself dropped by an "off" is listed, not
  failed), nothing a later rung teaches (nor sixteenths, which no rung teaches), nothing new
  but what the control declares. Where a move cannot be made the reason is declared, and the
  test holds the set to exactly `UNREALISABLE_AT`:

  | rungs (the reader's row) | cannot | why |
  |---|---|---|
  | 1.3–4.7 (every row) | step off | no control: a phrase without a step is neither written nor needed |
  | 1.5, 2.1 (`sight-reading-1`) | leap on | 1.5's drill promises "only steps and skips" |
  | 2.1 (`sight-reading-1`) | hands together on | level 1 writes one hand (2.1 teaches both; the row there cannot) |
  | 3.4–4.4 (`sight-reading-2`) | leap off | the left hand's roots move by fourths and fifths |
  | 4.5–4.7 (`sight-reading-3`) | skip off, leap off | a tie's closing note (and the left hand's roots) |
  | 4.5–4.7 | eighths off, shorter-than-quarter off | the 6/8 figures and the syncopation figure are eighths |
  | 4.5–4.7 | compound time in every phrase | its syncopation and triplets are not asked in 6/8 (T37) |

  Everything else is made, including the S25 moves: ties and dotted quarters from 2.4 on the
  right-hand row, from 3.4 on the two-hand row and on 4.5's; a ledger line beyond middle C on
  3.4's row (S22). The reader asks for them since C4c: the thirty-day learner reaches dotted
  quarters on 2.5's second day and ties three days later (`checkpoint-2026-09-27-diary.md`).

**Unseen, and the seed.** The daily read keeps the day's seed (`dailySeed`), which ticks the day;
the slot draws its own for the day (`dailySeed(day + '#reading')` stepped by Shuffle), and every
phrase the Score screen draws for itself — a fresh open, *New phrase* — is a seed no stored run of
the row carries: the screen reads the row's stored runs before it draws one. *New phrase* keeps
the recipe (`?recipe=`); the run keeps it on the row (`SessionRow.recipe`).

**Tempo mode is applied after the learner's default, not before it** (fixed 2026-09-22).
`ScoreScreen` set `mode = 'tempo'` where the score finished loading and then read
`settings.defaultModeWithInput` / `defaultModeWithoutInput` three hundred lines later, which
overwrote it — so Today's daily sight-read opened in **Wait** mode for every learner whose
applicable default is Wait, and `defaultModeWithInput` ships as Wait.
`pending-review` Entry 29 found it in passing and named it rather than fixing it. An explicit
`?mode=` in the hash still wins over both, because a tour step about Wait mode must teach Wait
mode.

Levels 5–7 originally read "melodic contours from a Markov table trained on the `[AUTH]`
folk corpus (build-time)". Dropped in P12b, on the P11 replan §3.2: a trained table needs a
corpus at build time, ships a model with the app, and buys nothing that the chord-tone rule
above does not — while putting the one property that matters, reproducibility from a seed,
at the mercy of whichever corpus the build happened to see. The rules replacing it are in
the three rows above.

## 9. MIDI adapter details (`midi/WebMidiSource.ts`)

- `connect()` must be called from a user gesture. Request `navigator.requestMIDIAccess({sysex:false})`.
  On Chrome for Android ≥ 124 this shows a permission prompt (**explain it in the UI first**).
- Subscribe to `access.onstatechange` (hot-plug: the OTG cable may be inserted after the app opened).
- Attach `onmidimessage` to **every** input; the diagnostics screen lists them; the setting
  can pin one.
- Parse status bytes: `0x9n` Note-On (velocity 0 ⇒ Note-Off), `0x8n` Note-Off, `0xBn` CC
  (64 sustain, 66 sostenuto, 67 soft, 7 volume, 123 all-notes-off ⇒ clear `pressed`), `0xAn`
  poly aftertouch (ignore), `0xDn` channel pressure (ignore), `0xEn` pitch bend (ignore),
  `0xF8` clock / `0xFE` active sensing (ignore; **do not log them at full rate**: some devices
  send active-sensing every 300 ms).
- Timestamps: use `event.timeStamp` (DOMHighResTimeStamp) not `performance.now()` at handler
  time, to remove JS scheduling jitter.
- Latency compensation setting `inputLatencyMs` [0]: subtracted from `tMs` in Tempo mode.
  For MIDI it stays 0 and should: `clock.ts` already reads `AudioContext.outputLatency` and
  MIDI-in is a few milliseconds, so there is nothing to compensate for. For the microphone the
  Diagnostics screen estimates it by acoustic loopback — a click emitted through the speaker and
  detected on the mic, the machine timing itself. It used to be estimated by asking the learner
  to tap along to a metronome, which measured the human as much as the input path.
  **Fixed 2026-09-10.** A calibrated mic user had the latency taken off twice:
  `MicSource.toPerformanceMs` docked the calibration's own `latencyMs` at the source and
  `PracticeEngine` subtracted `inputLatencyMs` on top, so every note was judged that much early
  in the one mode that scores. `MicSource` reports observed times now, like every other input
  source, and the engine's subtraction is the only one. The saving path used to net the two off
  against each other; that netting is gone with the thing it compensated for, so a calibrated
  microphone and an uncalibrated one store the same figure.
- **Output** (`send`): if an output port exists and the setting "send playback to piano" is
  on, playback Note-On/Off goes to the port with channel 1 and the HP-130 plays it. Also
  send `CC123` on stop.

Robustness against cheap cables: expect occasional dropped Note-Offs ⇒ `pressed` entries older
than 10 s are purged; expect duplicate Note-Ons ⇒ idempotent `satisfied` set; expect the device
to appear with a generic name ⇒ never key settings on the device name alone.

## 9a. Scoring a run against the rung it belongs to (built 2026-09-21)

**The pass thresholds are the rung's, not the app's.** `evaluateOutcome` takes a
`MasteryCriteria`; `curriculum/selectors.ts`'s `masteryCriteriaFor(lesson, defaults)` builds
one. The rule in a sentence: *a run judged for a rung uses that rung's numbers; a run with
no rung uses the defaults.*

- The rung is **the one that opened the screen** (`?from=`), and no other. It was always the
  first listing: a minuet opened from `classical.3` was held to 3.4's numbers and stored as
  3.4's run. T37 made the opening rung win and kept the first listing where none opened the
  screen; since C1 (2026-09-26) a run from nowhere has no rung, is judged by the defaults, and
  is stored with none (the side panel still shows the first listing's prose, as reading).
  **Or the rung a Today card chose** (`?rung=`, with `?slot=`; C3 item 0b, L50): Today names the
  rung it offered the item from where that rung lists it (the warm-up and the new piece), and
  otherwise the first rung listing the item (a review, a repertoire piece, a fallback, the daily
  read) — interim, `TodayScreen.rungForSlot`, until the session builder says which rung each slot
  is for (C4). It judges and is stored as `lessonId` and `opened.rung`, the slot as
  `opened.slot`, and it does not steer Back, which is `from`'s other job. Completion is unchanged: a pass is still a flag on the item, credited on every
  rung listing it (Wave C's business).
- `mastery.minAccuracy` is already a fraction. `mastery.minTempoPct` is written as a fraction
  in **every** rung of the built curriculum (the values in use are 0, 0.7, 0.75, 0.8, 0.85
  and 0.9) while the scorer speaks percentages, so a value at or below 1 is read as a
  fraction and anything above 1 as a percentage already. *(This said "ninety-eight rungs",
  counted on 2026-09-21; eleven rungs have been built since. The rule is "every rung", which
  is what the code relies on and what does not rot — `00-invariants` §2.)*
- A rung stating `0` — Stage 0's checklist, the tour, the improvisation rungs judged by a
  recording — is saying "I have no number of my own" and takes the default, rather than
  passing everything at nought.
- **`master` is not per-rung.** `02` Part G defines it once for the whole plan (97 % at full
  tempo, twice on different days) and no rung carries a second pair of numbers for it. The
  store counts the days the master standard was met (`masteredOn`), apart from pass days; it
  used to grant *mastered* on one such run after any earlier pass (T37).
- The defaults are the learner's own pair from Settings (`04` §7), which therefore still
  governs every run the curriculum says nothing about: a Library piece, an import, paper.
- The run is stored with the rung that judged it (`SessionRow.lessonId`). Older rows keep the
  `passed`/`bestAccuracy`/`bestTempoPct` they were written with; **changing a rung's numbers
  does not re-judge history**, and the numbers needed to re-judge it are in the row.

**What a run records (2026-09-26, C1).** `Scoring.measuresOf` is the one place a run's
measures are defined for the record, beside `buildScore` for the sheet: pitch with its
definition — `wait-steps` (steps completed cleanly, of the steps with something to play) or
`tempo-notes` (expected pitches inside their window, of the expected) — and its denominators,
never one number for both (L10); a rhythm-only run has no pitch and its figure is `rhythm`;
early notes (Keep tempo); the timing summary; the technique measure with *not measured* kept
(`TechniqueMeasure.measured`); the accents where the run's music prints one (*not measured*
where every note arrived at one velocity); the pedal (MIDI only); rolled and lenient chords;
laps. A run nothing heard measured none of them. The engine marks each step where it is decided
(`PracticeEngine.stepMarks`: a hit where a pitch matches, a miss and an early note where a
window closes, a Wait step's cleanliness where it completes), because the miss maps were per bar
and `notes` holds only what was played — so `SessionScore.stepOutcomes` has one code per step
(`h` `p` `m` `e` `w` `l` `-` `.`, `engine/types.ts`), the wrong and early notes against their
steps (a wrong note that matched nothing against the step nearest it in time, as its bar is
found for the hot spots), and every timed note's delta; `judgedUnder` reports the hands, the
grace-note rule, the window, the latency and the range. What is not built: continuity (stops,
gaps, time per step in Wait) has no measure yet, and is not stored ahead of one.

**The technique measures.** `articulationScore`, `voicingScore` and `shapingScore` (P12a) are
computed for a run of an exercise whose own `drill` block asks for one —
`{ kind: 'articulation', params: { articulation, heldFractionMin/Max } }`,
`{ kind: 'voicing', params: { topNoteRatio } }`, `{ kind: 'shaping', params: { shape,
minVelocityRange } }` — and shown on the summary sheet (`04` §5).

They are **not** accuracy and are not folded into it: a staccato phrase with every right note
and no shortness is a 100 % run and is the thing the exercise exists to catch. Whether missing
one can stop a pass is the rung's business: `demandsTechniqueMeasure` reads the rung's
`requirements` for a `measure` requirement naming it (C5; it read `mastery.custom` with a
regular expression, and a rule the app cannot measure is an `unjudged` requirement, which binds
nothing). **No rung states one today**, so the measure is reported and the pass is decided
exactly as it was.

A measure that could not be taken says so rather than reporting nought — the microphone never
sends note-off, and "no note was short enough" is a different answer from "nothing could be
measured".

**The half pedal, built 2026-09-22.** `PracticeEngine.feed` used to reduce CC64 to
`sustainDown = value >= 64` and keep no value, so `exercise.pedal.half-pedal.a` — which opens
here as ordinary notation and states `drill: { kind: 'half-pedal', params: { ccRange } }` — had
nothing on the Score screen to be judged against. Every CC64 value now rides out on
`SessionScore.pedal`, and `techniqueMeasureFor` reports the share of them inside the range.

- **One rule, two callers.** `Scoring.halfPedalScore` is the arithmetic; `special.ts`'s
  `PedalDrill.halfPedalResult` asks it too, so the drill screen and the Score screen cannot
  disagree about what a half pedal is.
- **The share is taken over the messages sent with the pedal down** (2026-09-22 review): from
  the message that takes it off the top to the one that puts it back, that last one excluded,
  which is every value above 0 since 0 is the only fully-up there is. It was every CC64
  message of the run, and `met` asks for nine in ten inside the range — so **lifting the pedal
  counted against the pedalling**, and a clean change is a lift and a return. A run that
  half-pedalled perfectly through four phrases could reach the sheet under the pass on its own
  lifts. Where messages arrived and every one was 0 the sheet says *the pedal never left the
  top*, which is neither the switch sentence nor a nought.
- **The list of values is a run total, gated and cleared like `recorded`** (same review). The
  CC64 branch of `feed` had no `running`/`paused`/`finished` guard and `resetRunTotals` left
  the list standing, so a pedal moved while the run was paused — or before ▶, or after the
  last bar — sat in that denominator. `state.sustain`, the switch the renderer and the keys
  read, is **not** gated: "is the damper down now" is true whatever the transport is doing,
  which is the division `pressed` already makes against `recorded`.
- **A pedal that only ever sends 0 and 127 is a switch**, and many digital actions are. It is
  its own state and the sheet says so, rather than showing a permanent nought.
- `pedal` is optional on `SessionScore` for the reason `rhythmOnly` is: a row stored before the
  field existed must read the same as one stored after it.

**The accent, built 2026-09-22.** `extractScoreModel` reads `<accent>` and `<strong-accent>`
off OSMD's voice entry onto `ScoreNote.accent`; `prepareSession` carries the marked pitches
onto `PreparedStep.accents` with the hand filter and the transposition already applied; and
`Scoring.accentScore` compares the velocity of those notes with the mean of the run's own
unaccented ones (`ACCENT_MIN_RATIO`).

- **Against the learner's own playing, not a MIDI number.** A light player and a heavy one
  accent by the same gesture and land on different velocities.
- **By step and by pitch, never by pitch alone.** A piece accents its first E and not its
  fourth; matching on the pitch judged both, which the `accents.musicxml` fixture caught.
- **It never decides a pass.** No rung's requirements name it, and a leaning
  that is a little shy is not a wrong note.
- Absent rather than `false` where the score prints nothing, which is what keeps every golden
  model of an unaccented score byte-identical.

## 9b. Evidence: what one observation supports about one skill (built 2026-09-26, C3)

`app/src/evidence/` turns one stored observation into evidence about the skills its item
declares, or into a stated refusal, and reads a skill's evidence into a ladder state. C4's
reader selects by the skill-level counts (§8); the per-demand counts and readings below
(C4a) are for the reader to act on (C4c). **What it enforces is evidentiary honesty; it does not prove that a
measurement shows the skill** — right notes in a fixed position are what a note-namer plays as
well as an interval-reader (the reviewer's principle, `audit-2026-09-25-outside.md` Part 7).

**`evidenceFor(observation, played, targetSkills, vocabulary)`** (`evidence.ts`). The notation
played is the score model (the phrase this seed generated, the file); the run's steps are C1's
codes, `from + i` in model step indexes, the same numbers the detectors locate demands at (checked
on a run and on a loop in `evidenceOnlyMeasured.test.ts`). No parameter carries the item's level,
rung or tags. One result per declared skill, decided in this order:

1. **Target** — only `targetSkills`; a skill nobody declared gets nothing.
2. **Channel** — every channel of the skill's `observable` measured (`measurement.ts`): nothing on
   a row with no measures block (a row before C1, and the placeholders `accuracy: 1` and
   `tempoPct: 100` some writers store, L52); pitch where the row's `pitch` is not *not measured*
   and its per-step codes are kept (a row compacted to bars measures nothing here); timing on a
   Keep tempo run that timed a note. `observable: none` is refused outright.
3. **Conditions** — the skill's full standard, else its practice standard, else refused with the
   first practice condition missed. The conditions are `skills.json`'s, and each is read from the
   field its `recordedBy` names: `keep-tempo` from `mode` and `tempoMeasured`, `unseen` from
   `unseen`, `guide-off` from `keys.guide`, `both-hands` from `hands.played`. Sight-reading's
   practice standard includes `unseen` (C3 second pass, reviewer decision 3): a phrase heard or
   read before is no evidence of reading at any standard.
4. **Opportunity** — the skill's demands (or every step with a note for the learner) inside the
   steps the run covered, in the hands it played.
5. **Precision** (reviewer decision 6, S21) — a timing skill counts only the steps where the run's
   window is narrower than the error the skill is about, at the tempo the run kept there
   (`TIMING_PRECISION_QUARTERS`: triplets 1/12 of a quarter, subdivision 1/6, 6/8 1/4, the dotted
   quarter, syncopation and ties 1/2; a skill whose rhythm is the phrase's takes the finest demand
   located at each step, and an eighth where none is). None left, and it is refused. At Anh. 113's
   ♩ = 96 and the rung's 80 % a quarter is 781 ms and the rushed triplet's second note 65 ms early,
   inside ±150: no triplet evidence; a window narrower than that gives it (`tripletPrecision.test.ts`).
   The global window is not changed.

Then attribution: `n` counts the opportunity steps the channels measured, `right` those right on
every channel. C1 keeps a step's code, not which pitch of a chord was missed, so a chord step
partly missed counts in `n` and never in `right` (`context.unattributed` says how many): `right`
is a floor. A refusal is `{skill, reason, cites}` — `not-measured:<channel>`,
`not-measured:observable`, `condition:<id>`, `no-opportunity`, `precision`, `unknown-skill` — and
`cites` names the observation fields it read. A self-reported run (nothing measured, the learner's
answer) is evidence of the class `self-assessed`, which the ladder shows apart and no requirement
accepts. **In the types**, `Evidence` is built only from a `Measurement` and a `Measurement` only
by `takeMeasurements(observation)`; both carry brands with no runtime value, so a detector's
`Opportunity` has no path to evidence (`demandIsNotAbility.test.ts` holds the compiler to it).

**Per demand, with the overlap kept** (C4a, 2026-09-26; L64; the reviewer's Part 8). Each
measured result also splits its counted steps by demand. `byDemand` holds, for each demand the
skill names — every vocabulary demand, for a skill read over every step (sight-reading) — that
the passage contains at measured steps, `{demand, n, right, steps, wrong}`: the opportunities
whose right or wrong the record can tell, the right ones, and which steps, so a later reader can
audit them against the observation. A step that is an opportunity for several demands counts
under each. The skill's own `n` and `right` are unchanged, and the ladder reads only them. Where
a demand sits on some notes of a step that went partly wrong (`p`, `l`, or `e` or `w` on a chord)
the record cannot say which note — C1 keeps the step's code, not which pitch was missed (L56) —
so the step is out of that demand's `n` and listed in `unattributed`; a demand on every note of
the step, or a step where every pitch was missed (`m`), is told (`StepMeasure.uniform`). For a
skill with a demand list, `otherDemands` names the demands it does not count, located on its
counted steps; with the entries' own steps that says where every demand of those steps is, and
`overlapOf(evidence, demand)` derives which other demands shared a demand's steps. Each
(demand, step) is stored once: stored beside every entry, the overlap made the evidence several
times the observation it came from. **No field says which demand caused a miss**: one wrong note
at a skip, in the left hand, during eighths is wrong under all three. A demand with no measured
opportunity is absent, `no-opportunity` stays a skill-level refusal only when none of the skill's
demands had one, and a timing step the window cannot resolve is out of the skill's steps and so
out of every demand's (at 100 % of a phrase written at 72 bpm the eighths drop out of
sight-reading's counts, as the precision rule above already said). One pass over the detectors per run serves every skill.

**Demand readings** (`demandReadings.ts`, C4a). `demandReadings(rows, vocabulary, today)`: per
reading-strand skill and per demand its evidence counted, over the skill's last
`DEMAND_WINDOW_READS` (5) reads stored under the current evidence stamp — `n`, `right`, the
phrases it had an opportunity in and those where its share was below the support share, and one
of three facts:

- **`pattern`** — below the support share over the window and in at least
  `PATTERN_MIN_PHRASES` (2) phrases; for every demand of another skill on any of its wrong steps
  (a *rival*), below the support share also where that rival was absent, over at least
  `MIN_CONTRAST` (2) such opportunities; and *selective*.
- **`isolated`** — below the support share; more than half of its wrong steps, and at least
  `MIN_ALONE_WRONG` (2), carry no demand of another skill; and *selective*.
- **`ambiguous`** — neither: it held, or it fell together with a demand the observations cannot
  tell it from.

*Selective*: every other demand of the skill held (at or above the support share) where this one
was absent, judged wherever it had at least `MIN_CONTRAST` such opportunities, and at least one
such comparison exists. Demands the same skill copes with (`copedWithBy`: the step, skip and
leap; the eighth and "shorter than a quarter") are never rivals of one another — one ability
graded, and "shorter than a quarter" is every eighth over again — but are held to selectivity.
The support share is the ladder's (`SUPPORT_SHARE`, Part G's pass share). **The four constants
and the arithmetic are hypotheses**, not measurements; `basis` on each reading carries the
numbers it was decided on. The worked examples (`demandReadings.test.ts`): five first readings
of 2.2's row with every skip misread give `pattern` for skips under sight-reading and reading by
interval, and not for steps; three good reads then two with the skips misread give it after the
second bad read and not the first; one wrong note carrying a skip, an eighth, the bass staff, the
key signature and the other hand is `ambiguous` under all five, on one day or two; the
**mixed-demand ambiguity adversary** — two phrases whose wrong notes are all skips and eighths at
once — is `ambiguous` for both, and then (a) skips in quarters right and steps in eighths wrong
make the eighths a `pattern` (2 of 8 right where no skip was) and not the skips (4 of 4 right
where no eighth was), while (b) skips in quarters right and eighths in steps right leave both
`ambiguous`: each held without the other, so the failures were at the combination and nothing
is named. The evidence and the readings speak in the vocabulary's demand ids and know nothing of
what a reader can change; the reader maps a supported demand to a control (C4c) and acts only on
`isolated` or `pattern`.

**The evidence's own version** (L66, C4a). `EVIDENCE_DEFINITIONS` (3) in `evidence.ts`, stamped on
the row beside the evidence as `evidenceDefinitions` by the record call (`stampedEvidence`);
`storedEvidence` takes only the current stamp and ignores the observation's `definitions`, which
stays the observation's. Version 1 is C3's per-skill evidence as C4 stored it under the
observation's stamp; version 2 is C4a–C4c's, whose hands-together counts sat on every note over
the other hand's held note: rows under either contribute nothing until the job below brings
them up to date. `recomputeEvidence(row, played, vocabulary)` is what the record call would
store today.

**The recompute job** (C5; L78, L66; `app/src/data/evidenceJob.ts`). On every open, after the
first screen is up, the job looks at every stored run of an item that declares `targetSkills`
whose evidence is under another version (or none) and has not already been kept out under the
version in force. For each, one per idle slice (`requestIdleCallback`, a two-second deadline;
OSMD is loaded only when a row needs a phrase written again, and parses without drawing), it
writes the phrase again from the item, the seed, the recipe and the rung that held it — the
writers the Score screen has used since observations were kept, newest first: held to the rung
(C4c on), with the recipe (C4 on), the row's own params — and uses a candidate only where it
**matches the run's own record**: the same steps with something to play and the same steps
with nothing, bar for bar, the same count of expected notes, and every note heard early one the
phrase asks for at that step. A match gives the evidence the record call gives today, stamped
with the version in force. Otherwise the row is kept out, with the version and the reason on
the row (`evidenceRecompute`), and not tried again until the version moves: `no-steps`
(recorded before C1, or compacted to bars after the observation window), `item-gone`, `no-seed`,
`not-generated`, `phrase-differs` (the generator writes that phrase differently now — C4d's redraw
budget moved some). A kept-out row contributes nothing, as decided at C4d; nothing is estimated.
The limit: a phrase that differs only in pitches where the learner played nothing early would
match, because the generator's version is not on the row (Part 9 §8 of the outside audit wants
it). Progress is on the storage report (`04` §3f). The same job carries the learner's history
from before C5 over once and puts back to practised the reading rows an older build passed or
mastered (S8), before any row.

**Playing hands together is counted where the hands are coordinated** (C4d, L72; the reviewer's
C4.5 review). The `handsTogether` detector's opportunity is a step where a left-hand note strikes
while the right hand sounds — both hands striking together, or the left hand changing under a held
right-hand note — at every note struck there; the demand is still *present* wherever both hands
sound at once. Under whole-note roots the opportunities are the bars' first beats, where the root
changes with the melody, not every melody note over the held root (C2 located every one, so in a
level-2 two-hand phrase playing together sat on every wrong skip and the reads could not tell the
skips from it without a one-hand read); under an Alberti or broken-chord left hand they are every
left-hand note. A clean two-hand read still earns it: on 2.2's row with both hands, four of four
per four-bar phrase where C4c counted every note; on 3.4's row the hands-together skill is
measured and supported. The two-hand skip learner, who never reads one-handed, is singled out the
morning after the second bad read (`readerMovesTheDemand.test.ts`), not after an easy detour.

**`ladderState(evidence, today)`** (`ladder.ts`) — introduced (an exposure), practised (a record of
either outcome), familiar (supporting at the practice standard on a day), proficient (supporting at
the full standard on two days, the most recent full attempt supporting), transfer demonstrated
(then a first reading of another item), retained (then a first attempt of a day supporting at least
21 days after the previous support), mastered (then no full attempt against it among the last two).
Supporting is `right / n` at or above Part G's pass share: v0 skills declare no threshold. Two full
attempts against it in a row put anything from proficient back to familiar; time alone lowers
nothing, and 21 days without support is shown as *not shown recently*. The history is replayed in
order, so the state is derived every time and never stored. Three rules are named and are
hypotheses, not measurements: `RETENTION_DAYS` (21, the review calendar's last step),
`RECENT_ATTEMPTS` (2), and `countsTowardsMovingDown` — **an attempt against on first contact with
material other than where proficiency was shown does not count towards moving down, nor against
mastery** (C3 second pass): a learner proficient at level 2 who reads two level-4 phrases badly at
sight still reads level 2, and the attempts are evidence about the harder material, not transfer.
The Skills screen still reads `skillsStore` and its 30-day rust (C7).

**On the sheet** (`04` §5f): where the run refuses a declared skill, a *Not judged* line says what
and why, citing the record's fields; the *Accents* line reads the recorded accents and says *not
judged* where they are not measured (U46).

## 10. Test plan for the engine (Vitest)

Fixtures: `tests/fixtures/scores/` — 10+ MusicXML files (generated by `tools/content`, plus
hand-written edge cases). For each, a JSON "golden" ScoreModel. Engine tests feed scripted
inputs through a fake clock:

- Wait: perfect run advances exactly `steps.length` times; chord with 3 notes arriving 0/40/70
  ms apart advances once; wrong note counted, no advance (lenient) / reset (strict); early
  arrival buffered; RH-only run skips LH-only steps; loop wraps.
- Tempo: perfect run at 100 % hits all; every note 100 ms late ⇒ all hits with mean +100;
  200 ms late with tolerance 150 ⇒ misses; extra notes ⇒ wrongs; count-in delays step 0.
- Drills: pedal clean-change scoring; ear-interval accepts octave-equivalent answers when set.
- Property test: for any fixture, sum of `durStep` == `beatToMs(lastOnset)`.


## 11. Microphone note and chord detection (the MIDI backup) — score-informed design

### 11.1 Why this is tractable

General polyphonic piano transcription is unsolved in real time on a phone. **We do not need
it.** At every moment the engine knows the small set of pitches expected now (`expected[k]`)
and next (`expected[k+1]`). The detector's job reduces to two questions per audio frame:

1. Did a **note onset** just happen? (energy/spectral-flux rise)
2. For each expected pitch, is its **harmonic template** present with energy above the local
   background? (and, weakly: is some *other* pitch salient instead?)

Because we test only a handful of hypotheses against the spectrum and "favour the score"
(owner's requirement), ambiguous frames resolve towards the expected notes. Wrong notes are
detected only when the evidence is strong (loud onset, expected pitches absent, a different
pitch salient); those are shown **amber "probably wrong"**, never red, and never counted
against a *pass* unless the setting "strict mic scoring" is on.

### 11.2 Signal chain

- `getUserMedia` mono, 44.1/48 kHz, all browser processing **off** (`echoCancellation`,
  `noiseSuppression`, `autoGainControl` = false — they destroy piano transients and harmonics).
  Device picker lists all inputs (phone mic, USB audio interface, Bluetooth headset mic).
- `AudioWorkletProcessor` (runs off the main thread): ring buffer; every hop of 512 samples
  (~11 ms) compute a Hann-windowed FFT of 4096 samples (frequency resolution ~11 Hz, enough
  to separate semitones down to ~C3; for C2–B2 use a 8192 window on the same hop — the low
  range matters for the bass staff). Precompute FFT twiddles; no per-frame allocation.
- Features per frame: log-magnitude spectrum `S[f]`; **spectral flux** `Σ max(0, S_t[f] − S_{t−1}[f])`
  for onsets; per-candidate-pitch **harmonic template score**
  `H(p) = Σ_{h=1..6} w_h · max(S[f near h·f0(p)·(1+β·h²)]) − background(p)` with harmonic
  weights `w = [1, .8, .6, .5, .4, .3]`, inharmonicity `β` per pitch from calibration (default
  0.0004 mid-range, larger in the bass), `background` = median of `S` in a ±2-semitone band
  excluding harmonic bins. Normalise `H` to the frame's loudest expected candidate.
- **Octave/partial confusion guard:** a pitch one octave below an expected pitch shares its
  even harmonics; require energy at the *odd* harmonics (h = 1, 3, 5) of the lower pitch before
  believing it. Same for a fifth above (3rd harmonic coincidence).

### 11.3 Decision logic (in the worklet's companion `MicSource`, main thread)

State per expected pitch: `present`, `presentSince`. Emit `noteOn(p, confidence)` when:
onset detected within the last 60 ms **and** `H(p)` rises above `θ_on` (calibrated, ≈ 6 dB
above background) **and** was below it in the previous 3 frames. Confidence = clamp of the
margin above `θ_on`, scaled by onset strength. Emit `noteOff(p)` when `H(p)` falls below
`θ_off` for 4 consecutive frames (release is unreliable with pedal; the engine already
ignores releases for matching). **Chords:** the same test per pitch; the engine's chord window
(80 ms) absorbs stagger. **Repeated notes:** each onset re-arms detection even if `H(p)` never
dropped (pedal held) — onset + re-rise of `H(p)` by ≥ 3 dB counts.

Unexpected notes: keep a coarse chroma-like scan (the 88 templates evaluated every 4th hop)
and, on a strong onset with no expected pitch rising, report the most salient pitch with
`confidence ≤ 0.5` and `source:'mic'`; the engine colours amber.

### 11.4 Engine adaptations for mic input

- Wait mode: an expected pitch is satisfied at `confidence ≥ 0.5`; the whole step completes
  when all expected pitches are satisfied **or** when ≥ 70 % are satisfied *and* the loudest
  onset in the window was strong (chord with one masked note) — setting `micChordLeniency`.
- Tempo mode: onsets are time-stamped in the worklet (sample-accurate) and reported as observed;
  `PracticeEngine` shifts them by `inputLatencyMs` when it judges them, which is the only place
  that subtraction happens. Tolerance defaults to ±200 ms for mic (vs ±150 for MIDI).
- Accuracy from mic is labelled "estimated"; the summary sheet says so.
- The app playing back the *other* hand through the phone speaker while listening through the
  same phone's mic will contaminate detection. Rules: when mic input is active, playback of
  expected pitches is muted; metronome uses a short high click (≥ 4 kHz) that the detector
  notches out; playback is best sent to the piano over MIDI (D16) or to headphones.

### 11.5 Calibration screen (`MicCalibration`)

Guided 60-second routine: silence (noise floor) → play each C across the keyboard
(gain per octave, inharmonicity fit from partial positions) → play a chromatic scale C3–C5
slowly with the metronome (per-pitch thresholds; latency = onset time − click time, kept as a
record of what was measured by ear rather than as something anything subtracts — the figure the
engine uses comes from the acoustic loopback on Diagnostics) →
play three chords (C, F, G) (chord leniency check). Stores to `micCalibration`. Offers a
"line input" preset when the selected device is not the built-in mic.

### 11.6 Testing without a piano

- **Synthesised fixtures:** render the soundfont piano offline (`OfflineAudioContext`) for
  scripted note lists (single notes across the range, chords, repeated notes with pedal,
  fast scales at 120 bpm 16ths), optionally mix in recorded room noise and apply a mild
  reverb; run the worklet's DSP as plain functions in Vitest (pure TS, `Float32Array` in/out) and
  assert onset timing error < 30 ms and pitch-set recall ≥ 95 % / precision ≥ 90 % for
  monophonic, recall ≥ 85 % for 3-note chords, with the score-informed prior.
- **Owner recordings:** the Diagnostics screen can record 20 s of raw mic audio to a WAV the
  owner shares back; these become regression fixtures for the HP-130 + S25 combination.
- **Optional tier 2 (later):** Spotify's Basic Pitch model via TensorFlow.js for Free-mode
  transcription and for turning a recorded improvisation into notation; not needed for follow.
