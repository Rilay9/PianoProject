# 05 — Score-follow engine and MIDI

Pure TypeScript, no DOM. Consumes a `ScoreModel` (see `01-architecture.md` §4.1) and a stream
of `EngineInput` events; emits `EngineEvent`s that the Score screen turns into cursor moves,
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

Implemented as small engine plugins sharing the input pipeline:

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
| 5+ | any key, 2 octaves | + syncopation, triplets | HT | melodic contours from a Markov table trained on the `[AUTH]` folk corpus (build-time) |

Deterministic from a seed so a failed sight-read can be retried identically once.

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
