# P12a — The generated backbone, part 1: technique families at every level  ·  Intended model: **Opus 5**  ·  Branch: `feat/p12a-technique`

(Include `_COMMON-HEADER.md`. The default branch is `claude/piano-teaching-app-bo19td`; there is no `main`.)

Read: `docs/decisions/2026-09-06-p11-replan.md` §3.1, §3.2 (the P12a list), §7;
`docs/02-curriculum.md` Part E and E2; `docs/05-score-follow-engine.md` §7;
`tools/content/generate_exercises.py` and `tools/content/tests/test_generator.py`;
`app/src/engine/Scoring.ts`, `app/src/engine/drills/special.ts` (the dynamics and pedal
scorers, which two new families extend).

## Why

Exercises stop at level 5 and 225 of them sit at level 4 because the generator hands every
scale a literal `4.1`. This phase fixes the shape and adds the technique families the upper
half of the ladder needs. The rule from the decision doc: generated material is the backbone
because it has no licence, no source and no ceiling.

Runs in the container. Needs no PDMX.

## Build / verify

1. **`LEVELS` table (§3.1).** One table keyed by (family, mode, hands, octaves, motion,
   rhythm) replaces every literal level in `default_plan()`. Item ids do not change. Prove
   with a before/after table of exercise count per level printed by `validate.py` (add that
   line if P11 did not). Level 4 must lose its bulge; no level 1–8 may be empty of exercises.
2. **New notation families**, each a generator function with fingering where fingering means
   anything, a `drill.kind` recording how it was made (extend the schema enum), a catalog
   `concepts[]` naming the skill, a level from the table, and a unit test asserting the
   thing that matters (bar count, meter, the fingering at the position change, the hand):
   - scales 3 and 4 octaves; scales in 3rds and in 6ths (C and G at 7.1, the rest at 7.3);
     octave scales and broken octaves; chromatic 2 octaves;
   - maj7, min7, half-diminished arpeggios; broken-seventh patterns in all keys;
   - **Hanon-style cells** as families, not as Hanon (no reachable edition of 21–60 exists):
     repeated notes (3- and 4-to-a-note with 3-2-1 / 4-3-2-1 fingering), double thirds,
     double sixths, measured trills and mordents (the "how many notes" rule printed as a
     direction), tremolo octaves, wrist rotation; keys C G F first, all keys behind `--full`;
   - articulation pairs: the same four-bar phrase written staccato then legato, with a
     `drill.params.articulation` the engine can score by note-off timing (add the scoring:
     a staccato note is held < 50 % of its value, legato ≥ 90 %, overlap ≤ 1 step; unit tests
     in `Scoring.ts`);
   - hand independence: LH quarters under RH eighths, 3:1, and 2-against-3 both ways;
   - dynamics shaping: a crescendo scale scored by velocity slope (extend `DynamicsDrill`
     or add `ShapingDrill`; the measurable is "velocity rises monotonically over the run
     with a range ≥ 30"); voicing: a chord sequence where the top note must be ≥ 1.4× the
     mean velocity of the others (a `voicing` scorer; unit tests);
   - ties across the bar line and 16th-level syncopation rows; 5/4 and 7/8 rows;
   - `pedal` family variants: held melody over changing harmony, and a half-pedal row scored
     on CC64 value in 32–96 (extend `PedalDrill`; tests).
3. **Wire every family into a lesson.** Every new item must be reachable from at least one
   existing or new lesson; where a lesson does not exist for the level (technique at Stages
   6–8), add `technique.6`–`technique.8` units on the `technique` track with lesson text in
   the house format. Orphans fail `validate.py` from now on (P11 made it a report; make it an
   error).
4. **Skills review lists everything for a concept** (§3.2 last paragraph): `buildConcepts`
   returns every playable exercise and drill per concept sorted by level, and the screen
   shows them under the concept row (collapsed after the first three). E2E.
5. **Payload:** re-measure content size and precache count; record in `01` §6.

## Acceptance

- `python3 tools/content/build.py --offline --render` clean; every new item renders and has
  ≥ 1 step; paste the per-level exercise table before and after.
- Generator tests green, one per family; `Scoring.ts` tests for articulation, shaping,
  voicing; `PedalDrill` half-pedal test.
- `validate.py` green with orphans as errors; no lesson thin.
- `npm run lint && npm run typecheck && npm test && npm run e2e` green.
- Report: families built with item counts, the level table as shipped, payload delta, and
  any family you could not make the engine score honestly (say why rather than shipping a
  fake score).

**Cannot be checked in the container:** whether the articulation and voicing scorers agree
with a human ear on the HP-130. Put a three-item checklist for the owner in the report.
