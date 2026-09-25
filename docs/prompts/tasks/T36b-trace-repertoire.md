# T36b — One quarried piece followed from the archive to progress, and every definition of difficulty compared

**Read-only.** You edit nothing under `app/`, `content/` or `tools/`. Your output is one
file: `docs/prompts/traces/2026-09-25-repertoire.md`.

**Read first:** `docs/prompts/operating-procedure.md` whole. Then
`docs/prompts/audit-2026-09-25-outside.md` message 1, points 2, 4, 5, 11, 13, 15 and 16.

## The goal, in the orchestrator's words

Follow one real piece from the archive to the learner's progress and report what each
stage knows about it, what it throws away, and how many different numbers claim to be its
difficulty; then try the audit's excerpt idea on that one piece so the owner can judge it
on evidence rather than argument.

## The object

One song quarried from PDMX that sits on a rung between Stage 3 and Stage 5 with
`levelSource: "estimated"`. Find it in `content/sources/pdmx.json` and the built
`content/catalog.json`; name the id, the rung and the file at the top of your report.
Also name one *judged* song on the same rung for comparison.

## The stages, and the six questions at each

Archive row → quarry and shortlist → extraction and conversion → features → estimated
level → catalog row → rung placement and the lesson prose that names it → the Library,
Plan and Lesson screens → the Score screen → the run → grading against the rung's
numbers → the feedback the learner reads → the progress row and whatever evidence is
kept → **the next recommendation**. Do not stop at placement or at grading: the
architectural question is whether the learner's performance on this piece produces
evidence that changes the learner model and therefore the next experience, and whether
the answer for a repertoire piece differs from the answer for a generated exercise.

At each stage: the data structure; the source of truth; what is lost; what is assumed;
whether the next stage gets enough; whether the concept is recomputed elsewhere.

Where to look: `tools/content/pdmx/` (`quarry.py`, `shortlist.py`, `extract.py`,
`commit.py`, `README.md`), `tools/content/import_pdmx.py`, `convert.py` (the note-loss
gate), `difficulty.py` (`features`, `estimate`, `FEATURE_NAMES`, `MONOTONE_SIGNS`),
`content/sources/level-model.json`, `fit_level_model.py`, `candidates.py`, `build.py`
(`attach_notation`), `validate.py` (`notation_requirements`, `levelBand`), the stage JSON
for the rung, the lesson file, `docs/03-content-pipeline.md` §3, `docs/decisions/2026-09-
06-p14-pdmx-quarry.md`, `2026-09-15-pedagogical-quarry.md`, `pending-review.md` Entries 51,
53 and 56 (the difficulty instrument's correction and what it found). In the app:
`app/src/score/difficulty.ts` and `estimateImport.ts`, `app/src/data/levelOverrides.ts`,
`app/src/curriculum/selectors.ts` (`levelConfidence`, `masteryCriteriaFor`,
`alternativesFor`), `session.ts`, `app/src/ui/screens/LibraryScreen.ts`, `PlanScreen.ts`,
`LessonScreen.ts`, `ShelfScreen.ts` (`levelBand`), `ScoreScreen.ts` (the side panel's
prose, the summary), `Scoring.ts`, `progressStore.ts`.

Do not read the 37,261-score archive. One piece, its rows, and the code that carries it.
`tools/content/archive_notation.py` and `dump_score.py` read one score directly.

## Questions the trace must answer explicitly

1. **Every definition of difficulty in play, in one table.** Candidates the orchestrator
   knows of: `level` (stage.decimal), `levelSource` judged/estimated, `abrsmGradeApprox`,
   the nineteen features and the one number the model makes of them (Python), the
   TypeScript port and its agreement test, `levelBand` on a rung, `levelOverrides`, PDMX's
   own `complexity`, and the rung's `mastery` numbers against the single global master
   rule. For each: where it is computed, who reads it, and whether two of them can
   disagree about one piece today. If they can, that is a P1 with the audit's wording:
   "there are two definitions of X"; recommend which is the source of truth.
2. **What the features know that the number forgets.** Take this piece's feature vector
   and say which dimensions a teacher would care about separately (reading, rhythm, range,
   hand independence, leaps, texture, physical demand) and which of them the single level
   hides. Is there a place in the app where a two-dimensional answer ("easy to read, hard
   for the left hand") would change what a learner is offered?
3. **Placement.** Is the piece where a teacher would put it, judged from the notation and
   the rung's lesson? Compare with the judged song on the same rung. What does the
   `requires` rule and `notation_requirements` actually check, and what do they miss?
4. **Can the data model represent an excerpt at all?** First the architectural fact:
   is a PDMX source forced into being a whole-piece repertoire item, or does anything in
   the catalog schema, the curriculum schema, `teaching.sections`, the Score screen's loop
   or the engine already let a 4–8 bar range stand as a learning experience of its own
   with its own level and concepts? Say what the current model can and cannot represent,
   with the schema lines. Then, as evidence for a later decision and not as a design: cut
   this piece (on paper, in your report) into two or three 4–8 bar excerpts, and for each
   say what it would teach, at what level, and whether a Stage 2–3 learner could use it
   although the whole piece is above them. Do not propose an excerpt-mining pipeline.
5. **What the app learns from a run of this piece** and how it changes what comes next:
   the fields written, their readers, and whether the rung's own numbers are the ones a
   run is judged by (`masteryCriteriaFor`).
6. **The genre corrections of 2026-09-17** (`pending-review.md`, the standing context at
   the top of the working period beginning 2026-09-17): rock as a style, the earliest
   honest stage, the public build carrying the personal items. For each, is it done, half
   done, or not done, with the evidence.

## Hypothesis status

The orchestrator's hypotheses H1, H3, H4, H6 and H8 in `plan-2026-09-25.md` touch this
trace. For each one your trace meets, report it as **supported by observed evidence**,
**contradicted by observed evidence**, or **unresolved**, and say what you observed. A
code path consistent with a hypothesis does not confirm it. This is an investigation, not
a confirmation exercise; if the evidence points at a different architectural problem,
that is the finding.

## The source-of-truth rows

For each of these that your trace touches, fill a row: **concept | current source of
truth | major consumers | competing definitions?** — learner level, difficulty, skill,
mastery, performance evidence, repertoire level, curriculum stage. Your question 1 is
most of the difficulty and repertoire-level rows. Leave rows you did not touch blank
rather than guessing; the orchestrator merges the three traces' tables.

## Findings

P0 / P1 / P2 / P3 as `operating-procedure.md` §8 defines them, each with current
implementation and lines, why it matters to a learner, evidence, recommended direction,
and local fix versus model change. Rank your top three. Record adjacent problems without
following them.

## Rules

Builder tier only. No edits outside `docs/prompts/traces/`. No browser, no builds. Never
name an AI model. An absence carries the scope of its search, after a second search shaped
differently. Do not imply broader verification than you did. Name hypotheses and their
tests. What cannot be judged without hearing the piece is said in those words, once.

## Report

Judgement first: in five lines, how many difficulties this piece has today and which one
a teacher would trust. Then the trace, the six questions, the findings, what is
unverified, files read.
