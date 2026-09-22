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
- If no such step: `wrong` (extra note).
- When the clock passes `tStep[j] + toleranceMs` and a slot in `expected[j]` is unsatisfied →
  `missed`.
- Accuracy = hits / expected slots; timing stats = mean/σ of deltaMs, % early, % late.
  **Pass** needs accuracy ≥ 90 % (setting) at tempoPct ≥ 80 % (setting).

Without any input source, Tempo mode simply plays/moves and asks for the self-report at the end.

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

**Deliberately unchanged:** Paper (it measures each onset against the nearest *audible*
click, so there is no timeline for a late entry to shift), the chord chart (it judges the
held chord against the bar at each moment, and the bar is marked by audible clicks and, with
comping on, the app's own playing), Simon (its answer is judged on pitch order, not time),
the lab, the metronome and free play.

**The rhythm drill** latches too (`RhythmDrill.latchOnFirstTap`): the first tap inside the
first onset's window, or any later one, sets the pattern's start; taps before the count-in
has found the downbeat are strays. The click stops after the count-in's downbeat and comes
back in phase after the first tap.

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
pause lives in `ScoreScreen`, where the status line and the buttons already are. Resume is the
bar's `▶` and restart its `⏮` rather than two new buttons for something that happens once a
session. Wait and Free are left alone — they have no timetable to lose, so the run is exactly
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

**Clearing the loop switches the ladder off.** It is a property of the loop it climbs, and
run state for the same reason the loop is (`04` §5). Left on, the Ladder row disappeared
from the sheet with the toggle still pressed underneath it, and the next loop set — later
that session, on the same piece — started moving the tempo by itself with nothing on screen
having asked. The one control that acts without being asked each time has to be off
whenever nothing shows it on.

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
| `sight-reading` | see §8 | Tempo-mode accuracy on first attempt only |
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

- The rung is found by `lessonForItem(curriculum, itemId)` — the first rung listing the item
  among its options, which is the same lookup the Score screen has always used to choose the
  prose beside a piece.
- `mastery.minAccuracy` is already a fraction. `mastery.minTempoPct` is written as a fraction
  in every one of the ninety-eight rungs (measured 2026-09-21: 0, 0.7, 0.75, 0.8, 0.85, 0.9)
  while the scorer speaks percentages, so a value at or below 1 is read as a fraction and
  anything above 1 as a percentage already.
- A rung stating `0` — Stage 0's checklist, the tour, the improvisation rungs judged by a
  recording — is saying "I have no number of my own" and takes the default, rather than
  passing everything at nought.
- **`master` is not per-rung.** `02` Part G defines it once for the whole plan (97 % at full
  tempo, twice on different days) and no rung carries a second pair of numbers for it.
- The defaults are the learner's own pair from Settings (`04` §7), which therefore still
  governs every run the curriculum says nothing about: a Library piece, an import, paper.
- The run is stored with the rung that judged it (`SessionRow.lessonId`). Older rows keep the
  `passed`/`bestAccuracy`/`bestTempoPct` they were written with; **changing a rung's numbers
  does not re-judge history**, and the numbers needed to re-judge it are in the row.

**The technique measures.** `articulationScore`, `voicingScore` and `shapingScore` (P12a) are
computed for a run of an exercise whose own `drill` block asks for one —
`{ kind: 'articulation', params: { articulation, heldFractionMin/Max } }`,
`{ kind: 'voicing', params: { topNoteRatio } }`, `{ kind: 'shaping', params: { shape,
minVelocityRange } }` — and shown on the summary sheet (`04` §5).

They are **not** accuracy and are not folded into it: a staccato phrase with every right note
and no shortness is a 100 % run and is the thing the exercise exists to catch. Whether missing
one can stop a pass is the rung's business: `demandsTechniqueMeasure` reads
`mastery.custom` for a rule naming the measure with a comparison, the same syntactic test
`demandsMeasuredAccuracy` uses. **No rung states one today**, so the measure is reported and
the pass is decided exactly as it was.

A measure that could not be taken says so rather than reporting nought — the microphone never
sends note-off, and "no note was short enough" is a different answer from "nothing could be
measured".

**Not built:** the half-pedal value scorer (`special.ts`'s `halfPedalResult`, and the
`ccRange` param on `exercise.pedal.half-pedal.a`). `PracticeEngine.feed` reduces CC64 to
`sustainDown = value >= 64` and keeps no value, so measuring depth on the Score screen needs
the raw CC values carried through the engine into `SessionScore`. `technique.7`'s lesson says
the depth is for the ear, which remains true.

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
