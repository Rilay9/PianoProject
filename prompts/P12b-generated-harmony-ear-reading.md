# P12b — The generated backbone, part 2: harmony, ear, reading, and the rungs that stop at Stage 5  ·  Intended model: **Opus 5**  ·  Branch: `feat/p12b-harmony-ear`

(Include `_COMMON-HEADER.md`. The default branch is `claude/piano-teaching-app-bo19td`; there is no `main`.)

Read: `docs/decisions/2026-09-06-p11-replan.md` §3.2 (the P12b list), §8;
`docs/02-curriculum.md` Parts D2–D4, D6, D7 and Part A §8; `docs/05-score-follow-engine.md`
§7–§8; `content/catalog.static.json`; `app/src/engine/drills/*`,
`app/src/engine/sightReading.ts`, `app/src/curriculum/session.ts`;
`docs/decisions/2026-09-06-p8-drills-ui.md` ("What is not done").

## Why

Five tracks end at Stage 5 — jazz has three items in the whole catalog — and the skills the
theory and chords lessons *describe* (modes, transposition, the four-chord loop in every key)
have no exercise. This phase builds the harmony and ear families and writes the missing
rungs so every track reaches Stage 9 with three-plus options per rung.

Runs in the container. Needs no PDMX.

## Build / verify

1. **Notation families (generator):** seventh-chord voicings in all keys (close, shell,
   rootless A and B); ii–V–I in twelve keys; the four-chord loop in twelve keys with
   inversions; slash-chord stepwise bass lines; walking bass over a 12-bar blues and over a
   ii–V–I; comping rhythm rows; stride LH (bass–chord–tenth–chord); turnarounds; tritone
   substitutions; quartal voicings; sus2/sus4/add9 open voicings; boogie variants (Pinetop,
   Yancey); each with `<harmony>` chord symbols so the chord-chart view works on them. Unit
   test per family; every item reachable from a lesson.
2. **Runtime drills (`catalog.static.json` + engine):** modes (play the named mode from the
   given root), secondary dominants and modulation (ear-progression with the new sequences),
   **harmonic dictation as chords** — implement the chord-boundary rule P8 left open: a chord
   is complete when no new note arrives for 120 ms or the next expected pitch set begins;
   unit tests with staggered chords —, extended chords 9/11/13, chord-scale (play the scale
   that fits the shown chord), transposition (four printed bars, play them in the named key:
   expectation = transposed model; uses the sight-reading writer), Roman-numeral reading, and
   `ear-tune` (four bars played, reconstructed phrase by phrase with a hint button).
   `theory.ts` grows what it needs and still returns null rather than guessing;
   `drillFromCatalog.test.ts` continues to read the shipped catalog so every new drill builds.
3. **Sight-reading levels 5–7** in `sightReading.ts` (§3.2): keys to four accidentals, two
   octaves, syncopation, triplets, LH from the accompaniment patterns, chord-tone targeting
   on strong beats; deterministic from the seed; golden tests. Drop the Markov note from
   `05` §8 (the decision doc says why). The 30- and 60-minute session templates gain a
   3-minute `sightreading` slot (`02` Part A §8 and `session.ts` together; tests).
4. **The missing rungs.** Units and lesson text for jazz 6–9, blues 6–9, chords-pop 6–9,
   theory-ear 6–9, improv-compose 6–9, in the house lesson format (the four closing sections),
   each with ≥ 3 exercise and ≥ 3 song-or-exercise options built from the new families and
   `songOptional` where honest. The `02` Part D tables for those tracks describe *focus* only;
   options come from the catalog (P14 generates the report).
5. **Hymns, holiday, latin:** leave as mini-modules; add the harmony families to their
   options so each has ≥ 5.
6. **Validate:** orphans are errors (if P12a did not already); the estimated-per-stage and
   exercises-per-level lines are printed; no lesson thin.

## Acceptance

- `build.py --offline --render` clean; every new item renders.
- Python tests green (one per family); app unit tests green including the chord-boundary
  rule and the sight-reading goldens; e2e green with one new spec per new drill kind
  (scripted input through the mock).
- `validate.py --strict-license` green; paste its per-stage/per-level lines.
- Report: per-track rung counts before/after (every track must reach Stage 9), families and
  drill kinds added with item counts, anything you could not make honest.

**Cannot be checked in the container:** the harmonic-dictation chord boundary on a real
piano with pedal held; include it in the owner checklist.
