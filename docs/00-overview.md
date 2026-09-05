# 00 — Overview, Decisions, Assumptions, Open Questions

Working title: **PianoPath** (rename freely; it is a string in one config file).

This repository is a *planning and instruction package*. It was written by Claude Fable 5.1
at the request of the project owner (Yali). The actual code is to be built by Claude Opus 5 /
Claude Sonnet 5 sessions following the numbered prompts in `prompts/`. Every doc in `docs/`
is referenced by those prompts; the prompts are self-contained but assume the builder can read
this repository.

Read order for a human: this file → `02-curriculum.md` → `01-architecture.md` → `06-build-plan.md`.
Read order for a builder model: whatever the prompt tells it to read.

---

## 1. What we are building (one paragraph)

A single, self-contained piano-teaching app that runs on a Samsung Galaxy S25 (Android), works
offline, and covers the whole path from "never touched a piano" to advanced repertoire across
classical, pop/chord-based playing, blues/boogie, jazz, ragtime, and theory/ear-training. It
contains a structured study plan (stages → units → lessons), each lesson offering several
exercises and several songs to choose from. Every exercise and song is shown as real sheet
music (grand staff: treble + bass) on the phone screen, zoomed to a small window of bars
(configurable, default 2), and the window moves through the piece either **as the learner plays**
(when a MIDI connection to the Roland HP-130 works) or **on a clock at the piece's tempo**
(when it doesn't). The app also plays the pieces back, has a metronome, tracks progress, and
never requires an account or a server.

## 2. Non-negotiables (the owner's stated requirements)

1. Runs on the owner's Android phone (Galaxy S25). Tablet/desktop are bonuses, not requirements.
2. Structured study plan with **many song/exercise options per step**, selectable in-app.
3. All sheet music viewable on the phone, zoomed to a configurable number of bars for both
   hands (bass and treble), moving through the piece.
4. Score follows the player via MIDI when possible; falls back to timed auto-advance when not.
5. Covers *all* piano topics and genres over time; open-source / public-domain content and
   free teachers (Bill Hilton and others) are the content base.
6. Thorough, detail-oriented planning, coding, and execution.

## 3. Decisions already made (with the reasoning, so a builder doesn't re-litigate them)

| # | Decision | Why |
|---|----------|-----|
| D1 | **Progressive Web App (PWA)** in Chrome for Android, installed to the home screen. Not a native Kotlin app, not React Native, not Flutter. | Chrome for Android implements the **Web MIDI API** (USB MIDI via the Android host stack) and the Web Audio API, which are exactly the two hardware features we need. A PWA is buildable and *testable* by an AI session using headless Chromium + Playwright, with no Android emulator. It installs with an icon, runs full-screen, and works offline via a service worker. Native would cost weeks of build/test friction for no functional gain. |
| D2 | **Language/tooling: TypeScript, Vite, vanilla DOM + a thin state layer** (no React unless a builder has a strong reason). | Fewer moving parts for the score view, which manipulates SVG directly. Keep the bundle small; the phone must stay responsive while rendering notation. |
| D3 | **Notation renderer: OpenSheetMusicDisplay (OSMD) 2.1.x** (BSD-3, VexFlow-based, MusicXML in, SVG out). | Best-maintained open-source MusicXML renderer for piano grand staff; has a cursor API with per-note timestamps; 2.x doubled rendering speed and supports rendering a measure range, which is exactly our "window of N bars". Version 2.1.2 (Aug 2026) verified on npm. |
| D4 | **Canonical score format: MusicXML** (compressed `.mxl` or plain `.musicxml`). Everything else (ABC, Humdrum `**kern`, LilyPond, music21 generators) is converted to MusicXML at build time by a Python pipeline. | One runtime format keeps the engine simple. MusicXML is what the public-domain libraries provide and what OSMD consumes. |
| D5 | **Content pipeline in Python (music21 10.x + python-ly)**; runtime never converts formats. | music21 parses ABC, kern, MIDI, MusicXML and *generates* scales/arpeggios/Hanon-style patterns programmatically, giving us unlimited technique exercises and sight-reading material in every key. |
| D6 | **Audio: Web Audio API with a sampled piano soundfont** (library `smplr`, MIT) for playback/metronome. | Zero-install, offline, decent piano sound. |
| D7 | **MIDI input: Web MIDI API through a thin adapter interface** (`MidiSource`) with three implementations: real Web MIDI, an on-screen keyboard, and a test/replay source. | Engine and UI never depend on real hardware; every mode can be tested with synthetic input. |
| D8 | **All state on-device** (IndexedDB), with JSON export/import. No backend, no accounts. | Privacy, offline, zero cost, nothing to operate. |
| D9 | **Hosting: GitHub Pages via GitHub Actions** (static site). | Free, HTTPS (required for Web MIDI and service workers), deploys on every push. Alternative if the repo must stay private without GitHub Pro: Cloudflare Pages / Netlify free tier — same static build. |
| D10 | **Bundled content is public-domain or Creative-Commons only.** Copyrighted songs (modern pop, film, game music) are supported only through **user import** of MusicXML files the user obtains legally. Copyrighted *teaching videos* (Bill Hilton, Hoffman Academy, etc.) are **linked**, never copied. | Legal and honest. Also keeps the app shippable. |
| D11 | **One canonical internal "ScoreModel"** (notes with onset/duration in beats, MIDI pitch, staff/hand, measure index, cursor step) extracted from OSMD's parsed sheet after `load()`. The follow engine works on ScoreModel only. | Decouples matching/scoring logic from rendering; unit-testable in Node. |
| D12 | **Practice modes: Wait, Tempo, Listen, Free** (see `05-score-follow-engine.md`). Wait mode is the default when MIDI is present; Tempo mode (auto-advance on a clock) is the default when it is not. | Matches the owner's requirement for "moves as I play, or as the timing requires if MIDI doesn't work". |
| D13 | **Curriculum as data** (`content/curriculum/*.json`), not code. Lessons, options, and prerequisites are JSON validated by a schema. | Lets Sonnet sessions add content without touching the engine; lets the owner edit the plan by hand. |
| D14 | **Model assignment:** Opus 5 for architecture/algorithms/debugging-on-device; Sonnet 5 for well-specified UI, data entry, tests, docs, and content authoring from templates. | Spelled out per task in `06-build-plan.md`. |

## 4. Assumptions (stated because the owner could not be asked mid-task)

| # | Assumption | If wrong… |
|---|-----------|-----------|
| A1 | The owner is an **absolute beginner** who does not yet read music. | The plan has a placement test (Stage 0) so a learner can skip ahead; nothing is lost. |
| A2 | Genre priority order: **classical foundations + chord/pop playing first** (both are needed for everything else), then blues/boogie, then jazz, ragtime, theory/ear as parallel tracks. | Tracks are parallel from Stage 3; the owner can re-order in the app. |
| A3 | About **30 minutes of practice on most days**. Pacing estimates in the curriculum assume this. | Pacing is advisory only; nothing in the app is time-gated. |
| A4 | The owner is in the **United States**, so "public domain" means US public domain (works published ≤ 1930 as of 2026, plus later works whose copyright was not renewed/registered). | For other countries the "life + 70" rule applies; a `pd_region` field in the catalog flags US-only items so they can be excluded. |
| A5 | **Landscape orientation** is the primary score-reading orientation on the phone (more bars per line at readable size); portrait is supported for menus and short windows. | Both are implemented; it's a setting and a rotation. |
| A6 | The GitHub repository can be **public** (needed for free GitHub Pages) — all bundled content is PD/CC so that is fine. | Use Cloudflare Pages / Netlify, or build an APK via Bubblewrap (TWA) and sideload; documented in `01-architecture.md` §9. |
| A7 | **English UI, letter note names (C D E…)**, not solfège. | One localisation table; solfège toggle is a listed backlog item. |
| A8 | The Roland HP-130 sends **standard MIDI 1.0** on its 5-pin DIN MIDI OUT (Note On/Off with velocity, sustain pedal CC64). It is a 1990s digital piano; there is no proprietary "old Roland protocol" involved in note data (Roland's pre-MIDI DCB bus was 1982–83 synthesizers only). The "doesn't work with Skoove" symptom is therefore almost certainly the **cable or the phone-side setup**, not the piano. | Even if some quirk exists, the fallback modes make the app fully usable, and the MIDI monitor tool (Phase 1) shows raw bytes so any quirk can be diagnosed later. |

## 5. Open questions for the owner (answer whenever convenient; defaults are the assumptions above)

1. **Level:** Can you read any sheet music today? Have you ever played another instrument? (A1)
2. **Genres:** Rank these: classical, pop/singer-songwriter (chords), blues/boogie, jazz, ragtime, film/game, worship/gospel, latin. (A2)
3. **Time:** Realistic practice minutes per day and days per week? (A3)
4. **Hosting:** Is a public GitHub repo OK (free GitHub Pages)? If not, do you have a preference for Cloudflare Pages / Netlify, or would you rather sideload an APK? (A6)
5. **Screen:** Phone only, or do you also have a tablet/laptop you'd put on the music stand? (Affects default bars-per-window.)
6. **Copyright stance:** OK that modern copyrighted songs are only available by importing MusicXML you obtain yourself (e.g. purchased from a sheet-music site, or exported from MuseScore)? (D10)
7. **Piano sound:** When the app plays a piece back, should it use the phone speaker/Bluetooth, or would you rather the app send MIDI *to* the piano so the HP-130 plays it (only possible once the cable works in both directions)?
8. **MIDI (deferred, low priority for now):** cable brand/model, whether it has status LEDs, which plug you put in the piano's MIDI OUT, and whether you use a USB-C OTG adapter. We will handle this in Phase 1's MIDI monitor.

## 6. What is in this repository

```
README.md                      – index + how to run the prompts with Opus/Sonnet
docs/00-overview.md            – this file
docs/01-architecture.md        – tech stack, modules, data model, storage, deployment
docs/02-curriculum.md          – the full study plan with repertoire options and free-teacher links
docs/03-content-pipeline.md    – where content comes from, licensing rules, conversion scripts, catalog schema
docs/04-ui-spec.md             – every screen, every setting, every interaction
docs/05-score-follow-engine.md – ScoreModel, practice modes, matching/scoring algorithms, MIDI adapter, fallback
docs/06-build-plan.md          – phases, tasks, model assignment, acceptance criteria, test strategy
docs/07-midi-hp130-notes.md    – short: what we know, what to try, deferred checklist
prompts/P0…P9-*.md             – paste-ready prompts, one per phase
content/catalog.schema.json    – JSON schema for songs/exercises metadata
content/curriculum.schema.json – JSON schema for curriculum data
tools/content/generate_exercises.py – working music21 generator (scales, arpeggios, Hanon-style, chords)
```
