# PianoProject — PianoPath planning package

An all-in-one piano-teaching app for an Android phone (Samsung Galaxy S25) that shows real
sheet music, moves through it as you play (MIDI from a Roland HP-130) or on a clock when MIDI
is unavailable, and carries a complete study plan from first notes to advanced repertoire
across classical, chords/pop, blues/boogie, jazz, ragtime, and theory/ear training.

**Status (2026-09-06): P0 through P19 are built. There are no phases left.** The app runs end
to end — you can open it, be given a practice session, play a piece with the sheet music
following your hands (MIDI, the microphone, the on-screen keys or the clock), have the run
scored and recorded, and see it come back for review; every drill has a screen and its own
advice; every rung says what music would train it and takes a file you found in two taps; a
folder of scores on the phone can be browsed and imported from; and books you own on paper can
be practised against. The catalog is **1,533 items** across **93 lessons** and ten stages.

What is left is not a phase. It is the phone: install the app from this laptop, work through
the checklist in `docs/OWNER-GUIDE.md`, and settle the handful of numbers that were chosen
without a piano in the room.

| Phase | What | State |
|---|---|---|
| P0 | Repository, PWA shell, router, CI | built |
| P1 | Web MIDI, audio engine, metronome, MIDI/mic/diagnostics screens | built · MIDI confirmed on the real HP-130 |
| P2 | OSMD wrapper, ScoreModel, windowed renderer, `/dev/score` | built |
| P3 · P3b | Practice engine, scoring, drills framework · microphone note detection | built |
| P4 · P5 · P5b | Content pipeline · authored library · exercise breadth | built · 573 catalog items, 55 lessons, Stages 0–5 |
| P6 | The Score screen | built |
| P7 | Today / Plan / Library / Progress / Settings, storage, own-score import, PDF viewer | built |
| P8 | Drills UI | built |
| P9 | Performance, error boundary, offline, PWA audit, APK toolchain | built; the APK itself and every on-device check are yours — see `docs/OWNER-GUIDE.md` |
| P10 | Stages 6–9 content | built |
| P11–P14 | the replan: pipeline robustness, one level model, technique and harmony breadth, the PDMX quarry and the folder library | built · see `docs/decisions/2026-09-06-p11-replan.md` |
| P15–P18 | finders on every rung and the two-tap import, the paper shelf and blind mode, drill tips and coaching, the carry-overs | built |
| P19 | the once-over: what the review found, what it missed, and the verification | built · `docs/decisions/2026-09-06-once-over.md` |

Each phase was built from one prompt in `prompts/`, so progress could be staggered. Decisions
taken mid-phase are written up in `docs/decisions/`, which is the honest record of why the
project is shaped the way it is rather than the way `docs/00`–`07` first described.

## How to use this repository

1. Read `docs/00-overview.md` — decisions, assumptions, and the owner's answers.
2. Read `docs/OWNER-GUIDE.md` §1 and install the app. The app is served **from your own
   laptop** over HTTPS (`00` D25): `packaging/serve-lan.py`, a certificate made once with
   mkcert, and the phone on the same Wi-Fi. GitHub Pages still deploys the public build on
   every push to `claude/piano-teaching-app-bo19td` (this repo's actual default branch; see
   `docs/decisions/2026-09-05-default-branch.md`) and is the way to test on the phone while
   the repository is public — but it is not the delivery route, and it stops working the
   moment the repository goes private.
3. Work through the owner's checklist in `docs/OWNER-GUIDE.md` §8. Those are the questions
   only the phone and the piano can answer.
4. Build the content **with `--personal`** before building the app for the phone, or the APK
   gets the public library instead of yours: `python3 tools/content/build.py --offline
   --personal`, then `packaging/build-apk.sh`.

For day-to-day app development commands (install, dev server, tests, build), see `app/README.md`.

## Contents

| Path | What |
|------|------|
| `docs/00-overview.md` | vision, decisions (D1–D25), assumptions (A1–A8), open questions |
| **`docs/OWNER-GUIDE.md`** | **start here to use the app**: install it, connect the piano, import your own scores, back up your history |
| `docs/decisions/` | one file per decision taken mid-phase, dated, with the reasoning |
| `packaging/` | the TWA APK toolchain: Bubblewrap config, build script, Digital Asset Links |
| `docs/01-architecture.md` | PWA stack (Vite + TS, OpenSheetMusicDisplay, Web MIDI, Web Audio), module contracts, data model, deployment |
| `docs/02-curriculum.md` | the full study plan: Stages 0–9, lessons for the core path, genre tracks, technique syllabus, master song list with public-domain sources |
| `docs/03-content-pipeline.md` | content sources, licensing rules, conversion/validation pipeline, authoring conventions |
| `docs/04-ui-spec.md` | every screen, setting, and interaction |
| `docs/05-score-follow-engine.md` | ScoreModel, Wait/Tempo/Listen/Free modes, matching and scoring, drills, sight-reading generator, MIDI adapter |
| `docs/06-build-plan.md` | phases P0–P10, model assignment, acceptance criteria, test strategy |
| `docs/07-midi-hp130-notes.md` | short MIDI notes and the deferred checklist |
| `prompts/` | paste-ready prompts per phase (P0–P10, P3b microphone detection, PR-review) |
| `content/*.schema.json` | JSON schemas for the catalog and curriculum data |
| `tools/content/` | the content pipeline: fetch, convert, author, generate, validate, render-check, build |
| `app/` | the app itself (Vite + TypeScript); see `app/README.md` for the day-to-day commands |

## Try the generator

```bash
python3 -m venv .venv && . .venv/bin/activate
pip install -r tools/content/requirements.txt
python tools/content/generate_exercises.py --quick --out build/generated --catalog build/generated/catalog.gen.json
```
