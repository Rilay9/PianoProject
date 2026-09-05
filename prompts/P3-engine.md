# P3 — Practice engine  ·  Intended model: **Opus 5**  ·  Branch: `feat/p3-engine`

(Include `_COMMON-HEADER.md`.)

Read: `docs/05-score-follow-engine.md` (all); `docs/01-architecture.md` §4.2; `docs/02-curriculum.md` Part G.

## Build

1. `engine/PracticeEngine.ts` implementing §1–§6 with an injectable `Clock`; events as in
   `01` §4.2. Wait mode (lenient/strict, chord window, look-ahead early buffer, hand filter,
   skip empty steps, loops), Tempo mode (count-in, nearest-slot matching within tolerance,
   missed detection, timing stats, input latency compensation), Listen, Free (recording).
2. `engine/Scoring.ts`: accuracy, timing histogram, hot-spot bars, pass/master evaluation from
   settings (curriculum Part G).
3. `engine/drills/`: the framework + kinds in §7 (`note-flash`, `find-key`, `chord`,
   `inversion`, `ear-interval`, `ear-chord`, `ear-progression`, `rhythm`, `pedal`, `dynamics`,
   `call-response`, `backing-track`) — logic only, UI comes in P8. Each drill: `next()`,
   `feed(input)`, `result()`.
4. `engine/sightReading.ts`: §8 generator levels 1–4, seeded PRNG, emits MusicXML (write a
   tiny MusicXML writer for single-part/2-staff, notes/rests/ties/time/key/tempo) and verify
   it loads in OSMD (e2e) and extracts to a ScoreModel.
5. Tests: the whole §10 matrix, plus property tests; wire the engine into the P2 dev route so
   a `ReplaySource` script can drive Wait and Tempo runs end-to-end (e2e).

## Acceptance
All tests green; e2e: perfect scripted Wait run finishes; late Tempo run yields expected
stats; sight-reading level 1–4 output renders.
