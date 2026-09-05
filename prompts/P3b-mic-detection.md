# P3b — Microphone note/chord detection  ·  Intended model: **Opus 5**  ·  Branch: `feat/p3b-mic`

(Include `_COMMON-HEADER.md`.)

Read: `docs/05-score-follow-engine.md` §11 (all) and §1–§3; `docs/01-architecture.md` §4.3, §4.7;
`docs/04-ui-spec.md` §5 (mic feedback), §7 (Input settings); `docs/00-overview.md` D15.

## Build
1. `audio/pitch/dsp.ts`: pure functions over `Float32Array` — Hann window, real FFT (write a
   small radix-2 or vendor a tiny MIT one), log-magnitude, spectral flux onset detector with
   adaptive threshold, harmonic-template scorer with inharmonicity and background estimate,
   octave/fifth guard. No allocation inside the per-hop path (preallocate in a context object).
2. `audio/pitch/worklet.ts` (AudioWorkletProcessor) running the DSP per 512-sample hop with a
   4096 window (8192 for candidates below C3); posts compact messages (onset, per-candidate
   scores) to the main thread. Handle 44.1 and 48 kHz.
3. `input/MicSource.ts`: `InputSource` implementation with `setExpectations(current, next)`,
   the §11.3 decision logic, unexpected-note reports at ≤ 0.5 confidence, device enumeration
   and the line-input preset; `getUserMedia` constraints exactly as specified.
4. `audio/pitch/calibration.ts` + a Calibration screen per §11.5; results persisted
   (`micCalibration` store — coordinate with P7's storage module or stub it behind an interface).
5. Engine adaptations per §11.4 (confidence thresholds, chord leniency, ±200 ms tolerance,
   'estimated' accuracy label, mute-expected-playback rule, high-frequency metronome click).
6. Tests: synthesise fixtures with the bundled soundfont through `OfflineAudioContext` in
   Playwright (or pre-render WAVs once and commit them under 5 MB total): single notes C2–C7,
   3-note chords, repeated notes with pedal, a C major scale at 120 bpm 16ths, with and without
   added noise/reverb. Vitest runs the DSP on the decoded PCM and asserts the §11.6 numbers.
   E2E: fake `getUserMedia` returning a MediaStream from a WAV drives a Wait-mode run end-to-end.
7. Diagnostics additions: mic level/noise-floor/latency readouts, 20-second WAV capture with a
   "share" button so the owner can send real HP-130 + S25 recordings back.

## Acceptance
Numbers in §11.6 met on synthetic fixtures; CPU cost per hop reported (target ≤ 3 ms at ×4 CPU
throttling); e2e passes; Calibration screen works with the fake stream.

## Report
State the FFT choice, thresholds chosen, measured precision/recall table, and what the owner
should record first (the calibration routine) so the next session can tune on real audio.
