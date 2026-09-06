# PianoProject — PianoPath planning package

An all-in-one piano-teaching app for an Android phone (Samsung Galaxy S25) that shows real
sheet music, moves through it as you play (MIDI from a Roland HP-130) or on a clock when MIDI
is unavailable, and carries a complete study plan from first notes to advanced repertoire
across classical, chords/pop, blues/boogie, jazz, ragtime, and theory/ear training.

**Status (2026-09-06): P0 through P7 are built.** The app runs end to end — you can open it,
be given a practice session, play a piece with the sheet music following your hands (MIDI, the
microphone, the on-screen keys or the clock), have the run scored and recorded, and see it come
back for review, and every drill has a screen. What is left is **P10** (content for Stages 6–9)
and the parts of P9 that can only happen on the phone — building and installing the APK, and
the on-device checks in `docs/OWNER-GUIDE.md`.

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
| P10 | Stages 6–9 content | built · 802 items, stacked at Stages 6–9 |
| P11–P17 | the replan: pipeline robustness, a generated backbone at every level, the PDMX quarry, finders, the shelf, drill tips | **next: `prompts/P11-pipeline-robustness.md`** — see `docs/decisions/2026-09-06-p11-replan.md` and `docs/06-build-plan.md` §2 |

Each phase is built by a Claude Code session (Opus 5 / Sonnet 5) from one prompt in
`prompts/`, so progress can be staggered and the model switched between phases. Decisions taken
mid-phase are written up in `docs/decisions/`.

## How to use this repository

1. Read `docs/00-overview.md` — decisions, assumptions, and the owner's answers.
2. Enable
   **GitHub Settings → Pages → Source: GitHub Actions** — the app deploys on every push to
   `claude/piano-teaching-app-bo19td` (this repo's actual default branch; see
   `docs/decisions/2026-09-05-default-branch.md`) and installs on the phone from the Pages
   URL via Chrome's "Add to Home screen" — no app-store account of any kind, and the installed
   app works fully offline (see `app/README.md`'s "Deploying" section).
3. Start the next Claude Code session on this repo, paste `prompts/_COMMON-HEADER.md` followed
   by the next phase prompt — **`prompts/P11-pipeline-robustness.md`** as of 2026-09-06 — using
   the model named in its title. The order and the one phase that must run on the owner's
   own machine (P14, the PDMX quarry) are in `docs/06-build-plan.md` §2.
4. Use `prompts/PR-review.md` with Opus after any Sonnet phase that touches `engine/` or
   `score/`.

For day-to-day app development commands (install, dev server, tests, build), see `app/README.md`.

## Contents

| Path | What |
|------|------|
| `docs/00-overview.md` | vision, decisions (D1–D21), assumptions (A1–A8), open questions |
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
