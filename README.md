# PianoProject — PianoPath planning package

An all-in-one piano-teaching app for an Android phone (Samsung Galaxy S25) that shows real
sheet music, moves through it as you play (MIDI from a Roland HP-130) or on a clock when MIDI
is unavailable, and carries a complete study plan from first notes to advanced repertoire
across classical, chords/pop, blues/boogie, jazz, ragtime, and theory/ear training.

**Status:** planning package complete; **P0 (repository bootstrap) built** — see `app/` for the
PWA shell. The rest of the app is built phase by phase by Claude Code sessions (Opus 5 /
Sonnet 5), one prompt at a time from `prompts/`, so progress can be staggered and the model
switched between phases.

## How to use this repository

1. Read `docs/00-overview.md` — decisions, assumptions, and the owner's answers.
2. Merge `feat/p0-bootstrap` (already built) into the default branch, then enable
   **GitHub Settings → Pages → Source: GitHub Actions** — the app deploys on every push to
   `claude/piano-teaching-app-bo19td` (this repo's actual default branch; see
   `docs/decisions/2026-09-05-default-branch.md`) and installs on the phone from the Pages
   URL via Chrome's "Add to Home screen" — no app-store account of any kind, and the installed
   app works fully offline (see `app/README.md`'s "Deploying" section).
3. Start the next Claude Code session on this repo, paste `prompts/_COMMON-HEADER.md` followed
   by the next phase prompt (`prompts/P1-midi-audio.md`), using the model named in its title.
4. Continue with P2, P3, … one at a time, in order (P4/P5 may run in parallel with P2/P3). Use
   `prompts/PR-review.md` with Opus after any Sonnet phase that touches `engine/` or `score/`.

For day-to-day app development commands (install, dev server, tests, build), see `app/README.md`.

## Contents

| Path | What |
|------|------|
| `docs/00-overview.md` | vision, decisions (D1–D14), assumptions (A1–A8), open questions |
| `docs/01-architecture.md` | PWA stack (Vite + TS, OpenSheetMusicDisplay, Web MIDI, Web Audio), module contracts, data model, deployment |
| `docs/02-curriculum.md` | the full study plan: Stages 0–9, lessons for the core path, genre tracks, technique syllabus, master song list with public-domain sources |
| `docs/03-content-pipeline.md` | content sources, licensing rules, conversion/validation pipeline, authoring conventions |
| `docs/04-ui-spec.md` | every screen, setting, and interaction |
| `docs/05-score-follow-engine.md` | ScoreModel, Wait/Tempo/Listen/Free modes, matching and scoring, drills, sight-reading generator, MIDI adapter |
| `docs/06-build-plan.md` | phases P0–P10, model assignment, acceptance criteria, test strategy |
| `docs/07-midi-hp130-notes.md` | short MIDI notes and the deferred checklist |
| `prompts/` | paste-ready prompts per phase (P0–P10, P3b microphone detection, PR-review) |
| `content/*.schema.json` | JSON schemas for the catalog and curriculum data |
| `tools/content/generate_exercises.py` | working music21 generator for scales, arpeggios, inversions, five-finger patterns, Hanon No. 1 |

## Try the generator

```bash
python3 -m venv .venv && . .venv/bin/activate
pip install -r tools/content/requirements.txt
python tools/content/generate_exercises.py --quick --out build/generated --catalog build/generated/catalog.gen.json
```
