# P1 — MIDI + audio foundation  ·  Intended model: **Opus 5**  ·  Branch: `feat/p1-midi-audio`

(Include `_COMMON-HEADER.md`.)

Read: `docs/01-architecture.md` §4.3, §4.4, §10; `docs/05-score-follow-engine.md` §9;
`docs/04-ui-spec.md` §7 (MIDI, Sound), §8; `docs/07-midi-hp130-notes.md`.

## Build

1. `app/src/midi/`: `MidiSource` interface exactly as in `01` §4.3; `WebMidiSource` (Web MIDI,
   every input subscribed, hot-plug via `onstatechange`, velocity-0 ⇒ Note-Off, ignore
   0xF8/0xFE without logging at full rate, ring buffer of 500 parsed + raw messages, uses
   `event.timeStamp`), `ScreenKeyboardSource`, `ReplaySource` (JSON script with relative ms).
   A pure `parseMidiMessage(bytes, t)` function with unit tests (Note On/Off, velocity 0, CC64/
   66/67/123, channel extraction, realtime bytes, malformed input).
2. `app/src/audio/`: `Piano` on `smplr` with a **bundled** piano soundfont under
   `app/public/content/audio/` (choose a freely-licensed one ≤ 20 MB, commit its license file,
   document the choice in `docs/decisions/`); `Metronome` with look-ahead scheduling and
   count-in; `AudioEngine` singleton that creates/resumes the AudioContext on first gesture.
3. UI: **MIDI screen** (explainer text about the Chrome permission prompt → "Connect piano"
   button → device list → pick/pin input → test area showing last notes; error states for
   "Web MIDI unsupported", "permission denied" with the re-enable path) and **Diagnostics
   screen** (raw log with timestamps and hex, parsed view, latency test: metronome clicks, the
   learner taps a key on each click, report mean/σ; render-timing log hook for P2; "Copy debug
   report" building a text block with UA, device list, last 100 messages, settings). Reachable
   from Settings for now.
4. **Keyboard strip component** (`ui/KeyboardStrip`): 88 keys, horizontally scrollable, props
   for expected/pressed/correct/wrong sets, emits touch input when interactive; must render at
   60 fps while updating a few keys (update by class toggles, not re-render).
5. Playwright fixture `tests/e2e/fixtures/midiMock.ts` that installs a fake
   `navigator.requestMIDIAccess` returning a fake input whose messages a test can inject; e2e
   test: connect → inject C4 Note-On → strip shows C4 pressed → Note-Off clears it.

## Acceptance
Unit + e2e green; desktop Chrome with any real MIDI device (if you have one) or the mock;
audio plays a C major chord on a button press; bundle size delta reported.

## Owner follow-up (put in the report)
Ask the owner to run the checklist in `docs/07-midi-hp130-notes.md` and paste the debug report.
