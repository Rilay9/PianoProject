# T3 — Seed Simon from a genre's own scale

**Read `docs/prompts/working-rules.md` first.**

## What

Simon builds its chain from C major or from the chromatic scale. Seed it from a **blues
scale, a clave, a ii–V–I or a gospel walk-up** and the same drill teaches that material by
ear before it is ever read.

**Five rungs in the genre plans ask for it**: `blues.3` (the blues scale), `latin.3` (the
clave), `jazz.6` (guide tones over a two-five-one), `hymns.5` (a walk-up), `improv.5`.

## Why this one matters more than it looks

`docs/02` Part A item 7 is **"ear before theory before name"** — every theory concept gets
an ear drill before the explanation. **No genre rung honours it today.** The blues scale is
introduced as notation, the clave as notation, the shell voicing as notation. This is the
smallest change that makes that principle true anywhere outside the theory track.

## Where it is

`app/src/engine/drills/simon.ts`. It already has a help ladder of three rungs
(`04` §5c-2), an exact step counter, and since 2026-09-16 it draws the chain on a staff.
`simonForStage` in that file decides which of the two existing Simon items a stage gets,
and `simonDrill.test.ts` derives the stage from the **built curriculum** rather than
restating it — so adding items means that test may need a look, not a rewrite.

**All of that is a proxy (§1)**: it is what the file looked like on 2026-09-18. Open it.

## The design questions

1. **A parameter or new items?** `drill.ear.simon-c-major` and `simon-chromatic` are
   catalog rows. A blues-scale Simon is probably a third row with `drill.params` naming the
   scale, not a new kind — which means **no schema enum change**. Check whether
   `catalog.schema.json` constrains the params before assuming.
2. **Which scales.** Minor pentatonic and blues scale are five and six notes and sit in the
   hand; a clave is a **rhythm with no pitches at all** and may not fit Simon's chain
   model. Decide whether the clave version is the same drill or a different one, and say so
   rather than forcing it.
3. **Where the scale comes from.** `BLUES_SCALE_FORMS` in
   `tools/content/generate_exercises.py` already spells the pentatonic and blues scales as
   **named intervals, not semitones** — `d5`, because six semitones above D is A♭ and
   music21 answers G♯, which is a raised fourth and a different degree. If Simon builds its
   own scale, it must spell it the same way or the ear drill and the written exercise will
   disagree about the same note.
4. **What `simonForStage` does with more than two items.** It currently answers a stage
   with one id. A genre-seeded Simon is chosen by *track*, not stage.

## Constraints

- Keep the three-rung help ladder working for the new seeds; it is what makes Simon usable
  at all (`handoff` §5aq).
- An ear drill must not show its answer before it is judged (`04` §5c, `STAFF_POLICY`
  `after-answer`). A blues Simon that prints the scale is a reading drill wearing an ear
  drill's name.
- Every test proved red.

## Done

`npx tsc -b`, `npm run lint`, `npx vitest run` including `simonDrill.test.ts`, the drill
Playwright specs one at a time on 4173, `build.py --offline`, `validate.py`. Update
`docs/04` §5c-2 and `docs/02` Part D6. One entry in `docs/pending-review.md` saying which
seeds were built, which were rejected and why — **and whether the clave fits the chain
model or needed something else**, because that is the question most likely to be answered
by forcing it.
