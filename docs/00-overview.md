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
| D10a | **Amended 2026-09-05 (owner):** the app is for the owner alone, so a **personal build** may also bundle **CC BY-NC** editions — which is what most scholarly encodings are (see `docs/decisions/2026-09-05-p4-content-licensing.md`). The default build stays NC-free; `--allow-nc` opts in. **A build made with `--allow-nc` must not be published to a public URL**, because putting it on GitHub Pages *is* redistribution however few people visit. | The owner asked for the repertoire and is the only user; the licence still binds the deployment, not the listening. |
| D11 | **One canonical internal "ScoreModel"** (notes with onset/duration in beats, MIDI pitch, staff/hand, measure index, cursor step) extracted from OSMD's parsed sheet after `load()`. The follow engine works on ScoreModel only. | Decouples matching/scoring logic from rendering; unit-testable in Node. |
| D12 | **Practice modes: Wait, Tempo, Listen, Free** (see `05-score-follow-engine.md`). Wait mode is the default when MIDI is present; Tempo mode (auto-advance on a clock) is the default when it is not. | Matches the owner's requirement for "moves as I play, or as the timing requires if MIDI doesn't work". |
| D13 | **Curriculum as data** (`content/curriculum/*.json`), not code. Lessons, options, and prerequisites are JSON validated by a schema. | Lets Sonnet sessions add content without touching the engine; lets the owner edit the plan by hand. |
| D15 | **Three follow inputs, one engine.** The score can be driven by (a) **MIDI** from the piano, (b) the **microphone** (score-informed pitch/chord detection — see `05` §11), or (c) **the clock** (timed) / **manual scrolling**. All three feed the same `PracticeEngine` through a common `InputSource` interface with a per-event confidence. The learner picks the input on the Score screen; the app auto-picks MIDI when present, else microphone if permission was granted, else timed. | The owner wants the best possible use of a small screen: the sheet must move with the playing even when MIDI fails. Mic detection is *not* general polyphonic transcription — because we always know which notes are expected next, we only ask the mic "did these notes just start?", which is tractable in real time on a phone. Ambiguity is resolved in favour of the score. |
| D16 | **Playback goes to the phone speaker/Bluetooth by default; a toggle sends it to the piano over MIDI OUT instead (or both).** | Owner asked for both. |
| D17 | **No gating by default.** Every lesson, item, and drill is openable at any time; "I already know this" marks a lesson as self-passed; the placement test is optional; a **Skills review** screen lets the learner drill any earlier concept. Strict prerequisite mode exists as an opt-in. | The owner reads basic notation and plays some chords already, plateaued after a few lessons, and asked that the app never assume a level — just make moving forward and backward easy. |
| D18 | **Copyrighted band repertoire (Avenged Sevenfold, Linkin Park, Sleep Token, film/game/modern pop) is taught as *technique* on public-domain material plus an import path for the actual songs.** A "Rock & metal piano" module and a "Beautiful pieces" collection are part of the curriculum. | Legal; and the techniques (minor ostinatos, octave bass, sus chords, ambient pedal textures, reductions of band arrangements) are exactly what those songs need. |
| D14 | **Model assignment:** Opus 5 for architecture/algorithms/debugging-on-device; Sonnet 5 for well-specified UI, data entry, tests, docs, and content authoring from templates. | Spelled out per task in `06-build-plan.md`. |

## 4. Assumptions (stated because the owner could not be asked mid-task)

| # | Assumption | If wrong… |
|---|-----------|-----------|
| A1 | ~~Absolute beginner~~ **Answered:** reads basic sheet music, plays a couple of chords, had a few lessons, plateaued early. The app makes **no level assumption**: everything is open, moving on or going back is one tap (D17). The Stage 1–2 material stays in the plan as a quick review the owner can skim or self-pass. | — |
| A2 | ~~Classical + chords first~~ **Answered:** classical first and "all beautiful songs"; rock/metal piano (Avenged Sevenfold, Linkin Park, Sleep Token) via import + a technique module; **blues and jazz to play with a friend**; pop/chords to play along for himself. Default active tracks: `classical`, `blues-boogie`, `jazz`, `chords-pop`, plus the `rock-metal` and `jam` modules. | — |
| A3 | ~~30 min/day~~ **Answered:** 20–30 min every couple of weekdays, hours at weekends. The session builder has **15/30/60/120-minute templates**; weekdays default to short (technique + review), weekends to long (new material + repertoire + jam practice). Goals are **weekly minutes**, not daily streaks. | — |
| A4 | The owner is in the **United States**, so "public domain" means US public domain (works published ≤ 1930 as of 2026, plus later works whose copyright was not renewed/registered). | For other countries the "life + 70" rule applies; a `pd_region` field in the catalog flags US-only items so they can be excluded. |
| A5 | **Answered:** phone only, landscape for reading; a **tablet layout** (more bars per window, lesson text beside the score) is implemented as a responsive breakpoint so it works if a tablet ever appears. Several phone follow options exist: MIDI-follow, mic-follow, timed, and manual scroll. | — |
| A6 | **Answered:** public GitHub repo is OK for now → GitHub Pages hosting. **Note (2026-09-05):** this is what limits D10a. A public Pages deploy may only carry the default, NC-free content build; a personal `--allow-nc` build has to be installed from a local `npm run build` or a private host. | — |
| A7 | **English UI, letter note names (C D E…)**, not solfège. | One localisation table; solfège toggle is a listed backlog item. |
| A8 | The Roland HP-130 sends **standard MIDI 1.0** on its 5-pin DIN MIDI OUT (Note On/Off with velocity, sustain pedal CC64). It is a 1990s digital piano; there is no proprietary "old Roland protocol" involved in note data (Roland's pre-MIDI DCB bus was 1982–83 synthesizers only). The "doesn't work with Skoove" symptom is therefore almost certainly the **cable or the phone-side setup**, not the piano. | Even if some quirk exists, the fallback modes make the app fully usable, and the MIDI monitor tool (Phase 1) shows raw bytes so any quirk can be diagnosed later. |

## 5. Owner's answers so far and remaining open questions

Answered (2026-09-05): level = reads basic notation, some chords, plateaued early, wants free
navigation both ways · genres = classical + beautiful pieces, rock/metal via import, blues &
jazz for jamming with a friend, pop/chords for himself · time = 20–30 min some weekdays, hours
at weekends · public repo OK · phone only with a tablet mode · wants mic-based note/chord
recognition as the MIDI backup, favouring the score's notes when ambiguous · playback both to
phone and to the piano (toggle).

Still open (defaults in brackets; answer whenever):

1. ~~Friend's instrument~~ **Answered: guitar** → jam keys E, A, G, D (and C).
2. ~~Target songs~~ **Answered:** Avenged Sevenfold — Seize the Day, Dear God, So Far Away,
   Fiction; Linkin Park — Final Masquerade, Waiting for the End, Shadow of the Day. Import-only;
   the rock/metal module writes a technique brief per song. Sleep Token picks still open.
3. **A wired audio path instead of the mic?** (owner is looking into it) The HP-130 has a headphone/line output. A
   class-compliant **USB audio interface** (e.g. a Behringer UCA202, ~$30) plugged into the
   S25 through the OTG adapter gives the app a clean line-level signal through the same
   microphone API — far more reliable than the phone mic in a room. Not required; mic works
   first. [Plan for both; mic is the default.]
4. MIDI cable details remain deferred to the P1 checklist (`07-midi-hp130-notes.md`).

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
