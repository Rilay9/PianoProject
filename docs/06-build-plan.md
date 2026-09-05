# 06 — Build plan, model assignment, acceptance criteria

## 1. How to run this plan

One phase = one Claude Code session (sometimes two). Paste the matching `prompts/P<n>-*.md`
into a fresh session on branch `main` (or a feature branch per phase, merged by PR). Each prompt
tells the model what to read, what to build, how to prove it works, and what to report. Run
phases in order; P4/P5 (content) can run in parallel with P2/P3 (engine) because they touch
different directories.

**Model choice rule of thumb**

| Use **Opus 5** when… | Use **Sonnet 5** when… |
|----------------------|------------------------|
| the task has design freedom or hidden edge cases (ScoreModel extraction, engine matching, windowed rendering sync, MIDI robustness, performance debugging, on-device bug hunts from logs) | the spec is precise and the work is volume (screens from `04-ui-spec.md`, settings plumbing, tests from a listed matrix, CI/workflows, ABC tune authoring, lesson prose from outlines, curriculum JSON entry, catalog metadata, review of preview PNGs) |
| a Sonnet phase produced something that doesn't pass acceptance after one retry | you need many similar items (60 tunes, 30 lessons) |
| reviewing/refactoring a large diff for correctness before merge | polishing copy, docs, README |

Both models get the same prompts; the prompt header states the intended model. If Sonnet
stalls on a phase, hand the same prompt plus its partial branch to Opus.

**Every session must** (these lines are in every prompt): read `docs/00-overview.md` and the
docs named in the prompt; work on the named branch; run the checks; commit with conventional
messages; end with a report (what was done, what was verified how, what is left, questions).

## 2. Phases

### P0 — Repository bootstrap · Sonnet · ~1 session
Deliverables: `app/` Vite + TypeScript + strict ESLint/Prettier; Vitest; Playwright (Chromium
from `/opt/pw-browsers` if present, else installed); `vite-plugin-pwa` with manifest/icons;
app shell with the five tabs and routing; theme; `.github/workflows/ci.yml` (lint, typecheck,
unit, e2e) and `pages.yml` (content build + app build + deploy); `tools/content/build.py`
skeleton that already copies `content/catalog.schema.json`-valid empty catalog; README dev
instructions. Acceptance: `npm run lint && npm run typecheck && npm run test && npm run e2e &&
npm run build` all pass locally and in CI; Pages workflow succeeds (owner enables Pages once);
the shell opens on the phone and installs.

### P1 — MIDI + audio foundation · Opus · 1 session
Deliverables per `01-architecture.md` §4.3–4.4 and `05` §9: `MidiSource` + `WebMidiSource`,
`ScreenKeyboardSource`, `ReplaySource`; `audio/Piano` (smplr with a **bundled** soundfont —
choose, vendor, license file), `audio/Metronome`; **Diagnostics screen** (device list, raw
message log with timestamps, latency test, "copy debug report"); **MIDI screen** with the
permission explainer; keyboard-strip component (render + input). Playwright e2e uses a mocked
`requestMIDIAccess`. Acceptance: unit tests for the parser (velocity-0, running-status-free
sequences, CC64, all-notes-off), e2e shows injected notes on the strip, audio plays on a
gesture; owner test on the phone: Diagnostics shows messages when keys are pressed (or shows
"no inputs" — either way the report is useful; see `07-midi-hp130-notes.md`).

### P2 — Score rendering + ScoreModel · Opus · 1–2 sessions
Deliverables per `01` §4.1: OSMD wrapper; `extractScoreModel(osmd)` with golden tests on ≥ 10
fixtures (use `tools/content/generate_exercises.py --quick` output + hand-written edge cases:
ties, chords, 2 voices, grace notes, repeats with endings, pickup, cross-staff, tempo change,
6/8, triplets); `WindowRenderer` (window + scroll layouts, double-buffered pre-render, zoom,
bars-per-window, hand dimming); cursor overlay; `noteId → SVG` map; a dev route `/dev/score`
that loads any bundled or dropped MusicXML and lets you step the cursor with arrow keys.
Acceptance: golden tests pass; step count == OSMD cursor count for every fixture; e2e
screenshot tests for window sizes 1/2/4 in landscape+portrait; render timing logged < 150 ms
for 2 bars on desktop Chromium (phone verified in P9).

### P3 — Practice engine · Opus · 1–2 sessions
Deliverables per `05`: `PracticeEngine` with Wait/Tempo/Listen/Free, loops, scoring, drills
framework (§7) and the runtime sight-reading generator (§8, levels 1–4 minimum), all with the
§10 test matrix. Wire to the P2 dev route so a mocked MIDI script can drive a run end-to-end.
Acceptance: all §10 tests; e2e: scripted perfect run in Wait mode reaches `finished`; scripted
late run in Tempo mode reports the expected timing stats.

### P3b — Microphone note/chord detection · Opus · 1–2 sessions
Deliverables per `05` §11 and `01` §4.7: `AudioWorklet` DSP (FFT, spectral flux, harmonic
templates with inharmonicity, octave guard) as pure functions + worklet wrapper; `MicSource`
implementing `InputSource` with `setExpectations()`; calibration routine and storage; device
picker with the line-input preset; synthesised-audio test suite (offline soundfont rendering →
detector → recall/precision/onset-timing assertions); Diagnostics: mic level, noise floor,
latency, 20-s WAV capture for owner recordings. Acceptance: the §11.6 thresholds on synthetic
fixtures; e2e: a synthetic recording drives a Wait-mode run to `finished` through the mic path
(Playwright with a fake `getUserMedia` fed from a WAV); CPU per hop measured and reported.

### P4 — Content pipeline · Sonnet (convert edge cases → Opus) · 1–2 sessions
Deliverables per `03`: `fetch.py` (GitHub sources first; graceful offline), `convert.py`
(kern/ABC/LilyPond/MusicXML → normalised 2-staff MXL), `author.py`, `validate.py`,
`render_check.py`, `build.py`; extend `generate_exercises.py` (Hanon 2–20 from a PD edition,
verify the VERIFY fingerings, chromatic scale, dominant/diminished 7th arpeggios, rhythm
drills, five-finger in all keys); import the `[MT]` library and the `[KERN]` repos listed in
the curriculum with provenance in `SOURCES.md`. Acceptance: `python tools/content/build.py`
produces a schema-valid catalog; every item renders (headless OSMD) and yields ≥ 1 step;
preview PNGs reviewed and broken files excluded with a note.

### P5 — Authored content & curriculum data · Sonnet · 2–3 sessions
Deliverables: ABC files for **all** Part F tunes (simple + full variants where specified),
lead sheets for the jazz/blues/latin lists (melody + chord symbols + a written-out simple LH),
`content/lessons/*.md` for every lesson in Stages 0–4 and for track rungs 3–5, `content/
curriculum/stage-0..4.json` + track files, all validated. Videos: find the actual free URLs
(Bill Hilton playlist items, Hoffman, Lypur, Aimee Nolte, etc.), record teacher + title.
Acceptance: `validate.py` passes; every lesson has ≥ 2 exercise and ≥ 3 song options that
exist; spot-check 10 random tunes by rendering and by listening (Listen mode) for wrong notes.

### P5b — Exercise breadth, alternatives, offline-first content · Sonnet (Opus for fingering) · 1 session
Deliverables: the `02` Part E2 generator families (coordination, cadence, accompaniment
patterns, interval reading, position shift, pedal, shuffle, rhythm in 3/4 and 6/8, five-finger
hands-separately, 2-octave contrary); `alternatives[]` in the catalog schema and `songOptional`
in the curriculum schema, both validated; the three-alternatives rule enforced by `validate.py`
and the eleven thin units backfilled; a unit test per family; the curriculum selectors taught
`songOptional`; the precache re-measured against `01` §6. Acceptance: content build with
`--render` clean, `validate.py` green with the rule on, app tests green, and an offline e2e that
opens a score, a generated exercise and a lesson with the network off.

### P5c — Standalone metronome · Sonnet · part of a session
Deliverables: the metronome screen in `04` §2a on top of P1's `audio/Metronome` — bpm
readout, slider, ±5, tap tempo, meter buttons with beat dots, sound picker, start/stop —
reached from Today's Tools block. Acceptance: unit tests for the tap-tempo arithmetic, e2e
for the screen including that starting it really runs the scheduler and that leaving stops
it. **Done 2026-09-05**, out of order because the owner asked for it and the engine already
existed.

### P6 — Score screen · Sonnet (Opus review) · 1–2 sessions
Deliverables per `04` §5: full Score screen on top of P2+P3(+P3b), control bar with the input
selector (MIDI / Mic / Screen / None) and the four follow options, amber mic feedback and level
meter, gestures, manual tap-to-advance, summary sheet, settings persistence, landscape lock,
wake lock, playback destination (phone / piano / both). Acceptance: e2e covers every control;
manual checklist in the prompt; Opus reviews the diff for rendering/engine misuse.

### P7 — Today / Plan / Library / Progress / Settings + storage · Sonnet · 1–2 sessions
Deliverables per `04` §2–4 (incl. 3a Skills review and 3b Chord-chart view), §6–7 and `01`
§4.5–4.6: IndexedDB stores, review queue (spaced intervals from curriculum Part G), weekly
goal, session builder with 15/30/60/120 templates, "I already know this" + quick checks,
**first-class score import (MusicXML/MXL *and* PDF, + share target) and the one-system-at-a-time
PDF viewer per `04` §5b on top of the P4 `pdf/systems.ts` spike**, export/import JSON, placement
test flow, tablet breakpoint. Acceptance: e2e for each screen; data survives reload; import of a
`.mxl` and of a `.pdf` from the phone's Downloads works (manual), and the PDF steps between
systems. **Done 2026-09-06** — see `docs/decisions/2026-09-06-p7-screens-storage.md`. The
phone-side manual checks (a real share-target intent from Android, a bought PDF from Downloads,
an APK install) are P9's, since they need the packaged app.

### P8 — Drills UI · Sonnet (+ Opus for ear/rhythm scoring) · 1 session
Deliverables: UI for every drill kind in `05` §7 on top of the P3 framework; audio prompts
for ear drills; result sheets. Acceptance: e2e per drill with scripted input.
**Done 2026-09-06** — see `docs/decisions/2026-09-06-p8-drills-ui.md`. All 43 runtime drills in
the catalog build and honour their parameters, checked by a unit test that reads the shipped
`catalog.json` so a new drill item with an unimplemented parameter fails at build time.

### P9 — On-device QA, performance, offline, packaging · Opus · 1–2 sessions
Deliverables: performance pass to hit `01` §6 budgets on the S25 (measure via the
Diagnostics timing log the owner pastes back), service-worker precache verified offline,
"update available" toast, **full-library precache verified item by item (`00` D20) and an
airplane-mode session from the second launch onwards**, error boundary + report copy,
**the Bubblewrap TWA APK and the
private-repo move (`00` D19) — no longer optional**, final README for the owner. Acceptance:
owner runs the checklist in the prompt on the phone and everything passes; Lighthouse PWA audit
passes; **the signed APK installs on the S25 and Web MIDI still works inside it**.

### P10 — Stages 5–9 content expansion · Sonnet · ongoing
Deliverables: repertoire from Part D ladders imported/authored and slotted into curriculum
JSON for stages 5–9 and all tracks; more sight-reading levels; Hanon 21–60; Czerny op. 599
selections authored; theory lessons from Open Music Theory outlines with attribution.

## 3. Definition of done for the whole project (v1.0)

- Owner installs the **APK**, opens Today, completes a full Stage 1 lesson with the on-screen
  keyboard *and* (if the cable works) with the HP-130, sees progress recorded — and can then
  turn the network off for good and lose nothing but the video links (`00` D20).
- **Every skill the curriculum names has a generated exercise, and every rung offers at least
  three alternatives** (`00` D21), checked by `validate.py` rather than by eye.
- Stages 0–4 fully populated; tracks populated to Stage 5 including the Rock & metal, Jam, and Beautiful-pieces modules; library ≥ 250 items (573 after P5b); mic follow works on the owner's HP-130 + S25 in a quiet room (measured on his recordings).
- CI green; all budgets met on device; no console errors in a 30-minute session.

## 4. Test strategy summary

Unit (Vitest): engine, ScoreModel, curriculum selectors, MIDI parser, storage. E2E (Playwright,
headless Chromium, mocked Web MIDI + fake AudioContext where needed): every screen, every
control, three fixture scores, all drills. Content: schema + render-check + preview review.
Content: also a **unit test per generator family** (fingering at position changes, meter, bar
count, hand) and validator tests for the three-alternatives rule and unresolved
`alternatives[]` references. Offline: an e2e that goes offline after first load and opens a
score, a generated exercise and a lesson (P5b), widened in P9 to a whole session.
Device: owner checklists in P1/P6/P9 with the Diagnostics "copy debug report" as the feedback
channel. Never mark a phase done on a red CI.
