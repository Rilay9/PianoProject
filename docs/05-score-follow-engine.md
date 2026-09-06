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
of one bar (metronome clicks) precedes step 0. Metronome ticks emitted as `tempoTick{beat, bar}`.

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

## 4. Listen mode

Tempo mode with all input ignored and both hands played back; the learner watches/listens. Loop
and tempo controls apply. Used for "play this bar for me" long-press.

## 5. Free mode

No cursor logic; input goes to the keyboard strip and is optionally recorded (`sessions` row
with the raw event list) for the improvisation track. A backing-track drill (`[GEN]` kind
`backing-track`) is Free mode plus a looping accompaniment.

## 6. Loops and sections

`loop = {fromStep, toStep}` derived from bar numbers via `model.steps.find(isMeasureStart)`.
On reaching `toStep` the engine emits `finished{loop:true}` and restarts at `fromStep` after a
one-beat gap (Wait) or immediately on the grid (Tempo). "Loop the weak bars" builds a loop from
the bars with the most misses in the last run.

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
- Latency compensation setting `inputLatencyMs` [0]: subtracted from `tMs` in Tempo mode;
  the diagnostics "latency test" estimates it (metronome click → learner taps → mean delta).
- **Output** (`send`): if an output port exists and the setting "send playback to piano" is
  on, playback Note-On/Off goes to the port with channel 1 and the HP-130 plays it. Also
  send `CC123` on stop.

Robustness against cheap cables: expect occasional dropped Note-Offs ⇒ `pressed` entries older
than 10 s are purged; expect duplicate Note-Ons ⇒ idempotent `satisfied` set; expect the device
to appear with a generic name ⇒ never key settings on the device name alone.

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
- Tempo mode: onsets are time-stamped in the worklet (sample-accurate) and shifted by the
  calibrated input latency; tolerance defaults to ±200 ms for mic (vs ±150 for MIDI).
- Accuracy from mic is labelled "estimated"; the summary sheet says so.
- The app playing back the *other* hand through the phone speaker while listening through the
  same phone's mic will contaminate detection. Rules: when mic input is active, playback of
  expected pitches is muted; metronome uses a short high click (≥ 4 kHz) that the detector
  notches out; playback is best sent to the piano over MIDI (D16) or to headphones.

### 11.5 Calibration screen (`MicCalibration`)

Guided 60-second routine: silence (noise floor) → play each C across the keyboard
(gain per octave, inharmonicity fit from partial positions) → play a chromatic scale C3–C5
slowly with the metronome (per-pitch thresholds; latency = onset time − click time) →
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
