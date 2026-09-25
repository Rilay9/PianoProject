# T36a — One generated exercise followed from the generator to the next recommendation

**Read-only.** You edit nothing under `app/`, `content/` or `tools/`. Your output is one
file: `docs/prompts/traces/2026-09-25-generated-exercise.md`.

**Read first:** `docs/prompts/operating-procedure.md` whole (it is short; §5–§9 are the
lens for this task). Then `docs/prompts/audit-2026-09-25-outside.md` message 1, points
2, 3, 4, 6, 7, 11, 13, 15 and 16, which are the questions this trace exists to answer
against the real repository.

## The goal, in the orchestrator's words

Find out what the app actually learns about a student from one exercise and how that
changes what the student gets next, by following one real exercise through every stage
with the data in hand, and report what is lost, assumed or recomputed along the way,
classified so the owner can decide what to fix.

## The object

Choose **two** exercises a learner meets early, from different families, and follow each:
one technique family (a five-finger pattern or a scale on a Stage 1–2 rung) and one
reading or coordination family (`make_interval_reading` on 1.5, `make_coordination`, or
`make_position_shift` on 2.5). Name the item ids at the top of your file.

## The stages, and the six questions at each

**Start inside the generator, not at its output** (the reviewer's point 2 in
`audit-2026-09-25-outside.md` Part 2): generator inputs → the intended target skill and
where it is represented → the generation algorithm → the generated musical structure →
the `confirm_*` validation → difficulty assignment (measured from the notation, inferred
from parameters, or simply declared?) → catalog metadata → what is discarded after
generation → the curriculum rung → the day's session or the lesson page → the Score
screen → the engine's prepared steps → grading → the summary the learner reads → the
progress row → the review queue → **the next recommendation**. Do not stop at selection
or at grading: the architectural question is whether the learner's performance produces
evidence that changes the learner model and therefore the next experience.

Where the exercise is named by a lesson, also read the lesson's prose about it and say
whether the writing teaches the musical idea the exercise is for, explains the app, or
promises something the notation does not contain.

At each stage write: what data structure carries it; what the source of truth is; what
information is lost; what assumption is introduced; whether the next stage receives
enough; whether the same concept is recalculated differently elsewhere.

Where to look (start here; follow imports):
- `tools/content/generate_exercises.py` (`make_*`, `catalog_entry`, the `confirm_*`
  checks, `scale_level` and friends: how the level is assigned), `tools/content/build.py`
  (`attach_notation`, what the build derives), `tools/content/validate.py`
  (`notation_requirements`, the three-alternatives rule), `content/catalog.static.json`
  or the built `content/catalog.json` row, `content/curriculum/stage-1.json` and
  `stage-2.json` (the rung that lists it, its `mastery`, `concepts`, `requires`), the
  lesson `content/lessons/<rung>.md`.
- `app/src/curriculum/load.ts`, `selectors.ts` (`lessonForItem`, `masteryCriteriaFor`,
  `lessonComplete`, `alternativesFor`), `session.ts` (`nextRecommended`, `fillSlot`,
  `buildSession`, `swapOptions`), `prerequisites.ts`, `tips.ts`.
- `app/src/ui/screens/TodayScreen.ts`, `LessonScreen.ts`, `ScoreScreen.ts` (how a run
  starts, what the summary sheet shows), `app/src/score/ScoreSession.ts`.
- `app/src/engine/PracticeEngine.ts` (prepared steps, what a miss is), `Scoring.ts`
  (`buildScore`, `evaluateOutcome`, `hotSpots`, `weakBarsLoop`, the technique measures),
  `app/src/data/progressStore.ts` (`RunResult`, the row written, `reviewQueue`),
  `skillsStore.ts`, `db.ts` (`ProgressRow`, `SessionRow`).
- `docs/02-curriculum.md` Part A and Part G, `docs/05-score-follow-engine.md` §9a,
  `docs/04-ui-spec.md` §2 and §5.

Do not read the archive or the whole catalog; two items and the code that carries them.

## Questions the trace must answer explicitly

1. **What does the system learn from this run?** List every field written after a run
   and every reader of each field. If the answer is "pass or fail, best accuracy, best
   tempo, and a calendar", say so as an architectural limitation (P1), with the lines.
2. **What stands in for the learner's ability?** Find every place a stage number, an
   item level or a rung's position is used as the learner's level (the orchestrator's
   reading of `session.ts` `fillSlot` found `level = position.stageNumber`; confirm or
   refute, and find the others).
3. **The fallback ladder.** For each slot kind in `fillSlot` and for `swapOptions`, write
   the actual order of fallbacks and compare it with the honest order in
   `operating-procedure.md` §7. Where the code is blunter, say how blunt, with an example
   of what a Stage 1 learner could be handed.
4. **Competing definitions.** Does *exercise* mean one thing (catalog `type`, `[GEN]`,
   drill kind, `exerciseOptions`)? Does *pass* mean one thing across `02` Part G, the
   rung's `mastery`, `masteryCriteriaFor`, Settings and self-report? Name each definition
   with its line and say whether they agree.
5. **The teacher's read, per exercise.** What ability is this exercise for? Is that
   ability actually present in the notation? What else does it demand (leaps, stretches,
   rhythm, reading) that its rung has not taught? Is the level honest for the rung it sits
   on? What would a competent teacher change, if anything? Answer from the notation
   (`tools/content/dump_score.py` prints it; note it hides tuplets, ties and graces) and
   say what you could not judge without hearing it, in those words.
6. **The feedback the learner reads.** After a run with three wrong notes and a rushed
   bar, what does the summary say? Does it say what happened, what it probably means, and
   what to do next? Quote the actual strings.

7. **Does the generator guarantee the target skill?** For each of your two families:
   the declared target skill (in the docstring, the concept tags, the lesson, wherever
   it lives); whether anything checks the notation for it; the other skills the artifact
   requires; how the level number was assigned and whether it was measured, inferred or
   declared; what the catalog keeps of all this and what it throws away.

## Hypothesis status

The orchestrator's hypotheses H1–H5 and H7 in `plan-2026-09-25.md` touch this trace. For
each one your trace meets, report it as **supported by observed evidence**,
**contradicted by observed evidence**, or **unresolved**, and say what you observed. A
code path consistent with a hypothesis does not confirm it: "stage number is used as
level" is already known; the question is whether that substitution produces a wrong
selection under a real learner state, and you should construct one such state from the
progress rows and walk `fillSlot` with it. This is an investigation, not a confirmation
exercise; if the evidence points at a different architectural problem, that is the
finding.

## The source-of-truth rows

For each of these that your trace touches, fill a row: **concept | current source of
truth | major consumers | competing definitions?** — learner level, difficulty, skill,
mastery, performance evidence, repertoire level, curriculum stage. Leave the rows you did
not touch blank rather than guessing; the orchestrator merges the three traces' tables.

## Findings

Classify each P0 (objectively wrong), P1 (works, but the model will stop the intended
product from working well), P2 (the architecture supports it, the content or design
should improve), P3 (polish). For each: current implementation with file and line, why it
is a problem for a learner, the evidence, the recommended direction, and whether it is a
local fix or a model change. Rank your top three. Record adjacent problems you notice
without following them.

## Rules

Builder tier only. No edits outside `docs/prompts/traces/`. No browser, no Playwright, no
builds. Never name an AI model. An absence carries the scope of the search that found it
("no reader of `hotSpots` under `app/src` outside `ScoreScreen.ts`", after a second
search shaped differently). Do not imply broader verification than you did. Hypotheses
are welcome: name the mechanism you suspect and the test that would settle it, even when
you cannot run the test here.

## Report

Judgement first: in five lines, what the app learns from an exercise today and what it
would need to learn. Then the trace, the six questions, the findings, and what is
unverified. Files read, listed.
