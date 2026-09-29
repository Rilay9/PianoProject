# G1c — The Plan screen stops presenting Stage 9 as rungs to pass: no rung badge, no *x of y met* in the stage line, the project stage named as what it is — and one constant names the project stages (G83, P1; G84)

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13; `docs/prompts/entry-138.md` (G1b: the Stage 9 page now says *A project: there is no rung to pass here.*, each song a badge of the learner's project state or *not started*; follow-ups 1 and 2; the reviewer's ruling on the G1b brief that Stage 9 presentation must not mutate the rung or evidence model, `docs/review/responses/a96395d.md` second section); `docs/02-curriculum.md` at Stage 9 ("Nothing here is a rung to pass; they are pieces to live with"); `app/src/ui/screens/PlanScreen.ts` at the stage line's count (`done`, `total`, `byWord`, `before` over every unit's lessons, about lines 140–156) and at the rung badge (`rungBadge(state)`, `badge(word, 'passed')`, about lines 224–240); `app/src/data/projectStore.ts` at `PROJECT_STAGES` (exported, the lesson page's) and `app/src/curriculum/session.ts` at its own unexported `PROJECT_STAGES` (line 494 and its two readers); `app/src/ui/screens/LessonScreen.ts` at `isProjectStage` (line 201 onward: how the page decides); `app/tests/e2e/plan.spec.ts` (the Plan cases and their `data-state` reads); `app/tests/unit/parallelStrands.test.ts` at Stage 9; `docs/04-ui-spec.md` on the Plan screen's stage line and rung rows.

## The goal, in the orchestrator's words

G1b made the Stage 9 page truthful: there is no rung to pass there, and each piece shows the learner's own project state. One screen over, Plan still reads Stage 9's units as rungs: the stage line counts them among *x of y* met and each rung row wears a badge from the evidence — *complete* or *in progress* — where the page it opens says no rung exists to complete. A learner sees a stage "complete" that is nothing of the kind, or "0 of 6" pieces to live with. That is a false claim on screen (never teach wrong, P1). Plan reads the same fact the lesson page reads: a project stage's units are pieces, not rungs.

## What is decided

1. **One constant.** `session.ts` drops its own `PROJECT_STAGES` and imports `projectStore.PROJECT_STAGES` (the curriculum does not mark the stage; one fact, one place — G84). Its two readers behave exactly as before; `parallelStrands.test.ts`'s Stage 9 cases stay green untouched.
2. **The stage line.** For a stage in `PROJECT_STAGES`, Plan's stage line counts nothing: no *x of y*, no *by your word*, no *carried*; it says what the stage is in the curriculum's words (from `docs/02`'s Stage 9 heading or `PROJECT_TEXT`, never a new phrase of Plan's own). For every other stage the line is unchanged, byte for byte.
3. **The rung rows.** For a unit of a project stage, each row wears no evidence badge (no *complete*, *in progress*, word or carry-over). Whether the row wears the pieces' project states is decided by what the row is: if a unit lists several pieces, one row cannot wear their several states — say so, wear nothing, and let the page speak; if the design has one piece per unit, the row may wear that piece's state in `PROJECT_TEXT`'s words. Choose from the data (`stage-9.json`) and say why.
4. **Nothing else moves.** `rungState.ts`, the evidence, the session (beyond the import), the lesson page, the badges of every other stage: unchanged. The rung state for Stage 9 units still exists in the data and the evidence (G1b's ruling); Plan stops presenting it.
5. **Red first.** A unit case on the Plan screen's stage line and rows for Stage 9 with a met requirement in the evidence (the state `met`, the page claiming nothing): before, *complete* and *1 of N*; after, no badge and no count. A browser case in `plan.spec.ts` at 342 × 740: the Stage 9 block's line and rows, and one other stage's unchanged.
6. **Not G1c's:** the Stage 9 page (G1b's, done), the project sheet, the Library (G85), Progress, the *Start* line's words on the Stage 9 page (G87).

## Verification layers

- Unit, red first: the Plan case above (the pattern of the existing Plan unit tests); `parallelStrands.test.ts` green; `npx vitest run` on the Plan and session files; `npx tsc -b`; `npm run lint`.
- Browser, on port 4413 through a copy of `app/playwright.config.ts` as `app/playwright.g1c-4413.config.ts`, `--workers=2` at most, with a check that every spec file you name exists: `plan.spec.ts` whole (the new case red first on the committed build); `plan.hierarchy`-style specs if any read the stage line (search `tests/e2e` for `stage-line` or the stage heading's selector and run what you find). Pictures of Plan's Stage 9 block at 342 × 740 before and after under `docs/prompts/pictures/g1c/`.
- The map: `python tools/docs/checks_for_paths.py <changed paths>`.

## Rules and files

You own `app/src/ui/screens/PlanScreen.ts` at the stage line and the rung badge, `app/src/curriculum/session.ts` at the constant only, `app/src/ui/help.ts` only if a sentence is needed and `PROJECT_TEXT` lacks it, the tests named, the pictures; `docs/04` rows in the entry's `## Doc rows`. Not `LessonScreen.ts`, not `projectStore.ts`, not `rungState.ts`. Never name an AI model. Never assert a number measured on this machine. No commits, pushes, stashes or checkouts. A fresh worktree's `npx vitest run` needs `python tools/midi-cleanup/tests/parity_reference.py` and `python tools/content/build.py --offline` first (Q24); if the offline build cannot produce `app/public/content`, copy that folder from `C:\Users\yalir\repos\Piano Stuff\PianoProject\app\public\content` and say so; `npm ci` in `app/`. Nothing on port 4173. One other builder (Q76) works on the content pipeline and the curriculum files; do not touch `tools/content/` or `content/`.

## Sequencing

G1b's follow-up 1, P1 (a false claim on a screen), under G1b's accepted contract: a narrow fix-forward, dispatched now with a for-information line to the reviewer; the post-build review is the gate.

## When to deviate

If Plan's stage line or rows are read by a consumer that needs the count (a test, Today's stage sentence), name it and stop at the finding. If `stage-9.json`'s units each list several pieces, wear no state on the row and say so.

## Report

Judgement first: Plan's Stage 9 block at 342 × 740 before and after, beside one other stage's unchanged block; then Done / Not done / Follow-ups / Questions / Files; the red lines; the tests table; exit codes; unverified beside what passes.
