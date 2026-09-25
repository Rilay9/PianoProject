# C0a — The vocabulary design: seven things that are one field today, designed apart, for review before anything is built

**Read-only.** You edit nothing under `app/`, `content/` or `tools/`. Your output is one
document: `docs/prompts/design-2026-09-26-vocabulary.md`.

**Read first:** `docs/prompts/operating-procedure.md` whole; `docs/prompts/audit-2026-09-25-
outside.md` Part 4 (the reviewer's two disagreements: on D2 and on D4) and Part 6; the
diagnosis `docs/prompts/diagnosis-2026-09-25.md` D2, D4 and D5; the matrix
`docs/prompts/backlog-2026-09-25.md` rows R1, G1, G2, S5, G6, G12, L10, L11, L21, L24, T11,
G25 (your scope); the four traces under `docs/prompts/traces/` where they touch these rows
(the repertoire trace's Q1 table and Q2; the generated-exercise trace's Q4 and Q7; the
sight-reading trace's Q1); the full audit `audit-2026-09-25-outside-full.md` N-76 §2–§7,
§34–§36, N-117 §B, §E, §F, N-170 §2–§3, §8–§9, §12, N-180 (Piece / Excerpt /
LearningExperience; the teaching-plan fields). Code: `content/catalog.schema.json`,
`content/curriculum.schema.json`, `content/curriculum/concepts.json`, `app/src/curriculum/
types.ts`, `app/src/data/db.ts` (the row types), `app/src/engine/Scoring.ts`
(`SessionScore`, `MasteryCriteria`, the technique measures), `app/src/data/progressStore.ts`
(`RunResult`), `tools/content/difficulty.py` (`FEATURE_NAMES`), `tools/content/
generate_exercises.py` (`catalog_entry`, two families' docstrings), `docs/02-curriculum.md`
Part A, Part E2 and Part G, `docs/03-content-pipeline.md` §4.

## The goal, in the orchestrator's words

Design, and do not build, the vocabulary the next waves will write content and code
against: what a piece or exercise *demands*, what skill it *practises*, what it *needs*
first, what the learner *can do*, where a thing sits in the *curriculum*, what a run
*observed*, what that observation is *evidence* of, and what a *teaching plan* holds. Seven
things are one `level` field and a bag of tags today. The reviewer's warning governs the
design: do not recreate one level as seven little numbers, and never turn an unmeasured
property into evidence.

## What the design must answer, in this order

1. **The concepts, each with one sentence, one writer, and its readers.** Material demand
   (the musical properties present: a stride pattern, syncopated sixteenths, octave
   displacement, simultaneous chord tones, a leap of a sixth; measured from notation,
   never declared); performance demand (what this run asked: tempo, hands, mode, unseen or
   not); skill prerequisites (what the ladder must have taught before this is honest to
   offer); skill practised (pedagogical: read skips by interval; hold an accompaniment
   under a melody); learner ability (evidence about capabilities, per skill, with recency
   and context, never a number per dimension); curriculum address (the rung, and only the
   rung); evidence (what an observation supports, derived, never stored as a flag); the
   teaching plan (concept, whyItMatters, notice, do, avoid, example, guidedPractice,
   independentPractice, transfer, successCriteria, commonMisconceptions).
2. **Demand versus skill are different ontologies.** Show it with three items from the
   catalog (a five-finger pattern, Anh. 113, a level-4 sight-reading phrase): their demands
   as properties, their skills as pedagogy, and why neither can be derived from the other
   alone.
3. **The observation shape.** What a run writes, by its own definitions: mode; pitch
   accuracy and which definition (Wait steps, Tempo notes); whether tempo was measured
   and at what; per-bar misses and wrongs; timing per note; first attempt; hands; the
   item; the context that opened it; what the engine measured that is not yet kept (the
   technique measures, continuity, pedal). Where `SessionRow` already holds a field, say so.
4. **Evidence from observations, and the rule against inference.** For each skill an item
   practises, which observation can be evidence of it and which cannot: an exercise that
   demands rhythm gives rhythm evidence only when timing was measured. Write the rule
   that stops "the item contains X" becoming "the learner can X". One performance may
   yield evidence for several skills; say how the weighting is bounded by what was
   measured.
5. **The mastery ladder** (introduced → practised → familiar → proficient → transfer
   demonstrated → retained → mastered) as states of evidence, not of items; what moves a
   skill between them; what "transfer" and "retained" require (a different context; time).
6. **Where `level` goes.** A derived, versioned scalar for sorting and display, its
   derivation stated, or dropped from screens: recommend one, and list every reader of
   `level` today (the repertoire trace's Q1 table is the start) with what each would read
   instead. Say what happens to `levelSource`, `abrsmGradeApprox`, `levelBand`,
   `levelOverrides`, the quarry band and the folder proxy.
7. **Generated items.** How a family declares `targetSkills` (validated against the
   vocabulary), how its `demands` are measured rather than declared, and canonical /
   variable / transfer as a field, with one family worked through.
8. **The excerpt** as D5 defines it, in this vocabulary: an item with a source and range
   whose demands are the slice's, with its own skills, needs, context and evidence, and
   its relation to the parent. Fields only; no mining.
9. **Genre and style.** Descriptive metadata; never a demand or a skill dimension; where
   style constraints for generated music would live instead (a style is a set of demands
   and a vocabulary, not a tag).
10. **Migration in the smallest steps**, each with its consumers named: what C builds
    first (observations stored; evidence keyed to skills; the first reader), what D and E
    add, what F needs before lessons are rewritten. Each step names the tests that would
    become obsolete (AT-15's classes) and the test that proves it.
11. **What stays a choice** for the owner and the reviewer, and your recommendation for
    each: the dimensions' names; whether a scalar is shown; whether a person's grade
    remains an input; how visible adaptation is.

## Rules

Builder tier only. No edits outside `docs/prompts/`. No browser, no builds. Never name an
AI model. An absence carries the scope of its search, after a second search shaped
differently. Do not imply broader verification than you did. This is a design for review,
not a schema to ship: say where you are unsure, and prefer the smallest model that makes
the truth rule enforceable over the most complete one. Length: what the questions need and
no more; a reader must be able to disagree with each answer.

## Report

Judgement first: the one sentence each concept is, and the two places the design is
least sure. Then the document's outline, the choices left to the owner, and the files
read.
