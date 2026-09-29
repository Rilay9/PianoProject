# G87 — The project sheet's date box wears the sheet's own style, and a project stage's *Start* line no longer calls a piece *the first thing on this rung* (G1b's follow-ups 3 and 7; P3)

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13; `docs/prompts/entry-138.md` (G1b: the sheet; follow-up 3 — the date box beside *I performed it* is the browser's own unstyled control; follow-up 6 — only the history's last line is shown; follow-up 7 — the Stage 9 page's *Start* line still says *the first thing on this rung*) and `docs/prompts/entry-139.md` (G1c: Plan stops presenting Stage 9 as rungs; `isProjectStage`); `app/src/ui/projectSheet.ts` at the date input (about 135: `el('input', { id: 'project-performed-on', type: 'date', value: today, max: today })`) and the sheet's layout; `app/src/style.css` at `.sheet` (about 3780) and the sheet's inputs and buttons (find the rules the sheet's other controls use; U92's rule for `#skills-list` stands at the end of the file — do not append there, put a sheet rule beside the sheet's rules); `app/src/ui/screens/LessonScreen.ts` at the *Start* line (about 755–766: *Opens "X", the first thing on this rung.* when the target is the rung's first option) and `isProjectStage` (about 201 onward); `app/src/ui/help.ts` at `PROJECT_TEXT`; `app/tests/e2e/projects.spec.ts` (the sheet's cases and pictures); `app/tests/unit/projectSheet.test.ts` and `planProjectStage.test.ts`; `docs/04-ui-spec.md` on the project sheet and the Stage 9 page.

## The goal, in the orchestrator's words

Two small things a learner meets on the project sheet and the Stage 9 page. The date box beside *I performed it* is the browser's raw control, alone among the sheet's styled inputs. And a Stage 9 page's *Start* line can say *Opens "X", the first thing on this rung* where the page itself says there is no rung to pass: a sentence that contradicts the one above it. After G87 the date box looks like the sheet's other controls, and a project stage's Start line names what it opens and no more.

## What is decided

1. **The date box.** One rule for `#project-performed-on` (or the class the sheet's inputs share, if it has one) so the date control takes the sheet's font, padding, border and radius; native pickers keep their behaviour. Placed beside the sheet's rules in `style.css`, never at the file's end. Pictured at 342 × 740 before and after, in the app's stack.
2. **The Start line.** For a stage in `PROJECT_STAGES` the line is *Opens "X".* — never *the first thing on this rung* — read through `isProjectStage`, the same fact G1c reads; every other stage's line unchanged byte for byte.
3. **Not G87's:** the history view (follow-up 6 stays recorded; a learner has not asked), the sheet's actions and states, `projectStore.ts`, Plan, the Library (G85, another builder), the session.
4. **Red first, unit:** the Stage 9 page's Start line for a project stage never contains *the first thing on this rung* and a Stage 1 page's still does (the pattern of `planProjectStage.test.ts` for a screen test); a unit check that the date input carries the sheet's class or id the rule targets.
5. **Red first, browser** (`projects.spec.ts` at 342 × 740): the sheet's date box's computed font and border match the sheet's other input's; the Stage 9 page's Start line words. Pictures under `docs/prompts/pictures/g87/`.

## Verification layers

- Unit, red first: item 4; `npx vitest run` on the project-sheet, lesson-page and Plan files; `npx tsc -b`; `npm run lint`.
- Browser, on port 4463 through a copy of `app/playwright.config.ts` as `app/playwright.g87-4463.config.ts` (not for the commit), `--workers=2` at most, files checked to exist: `projects.spec.ts` and `lesson-flow.spec.ts` whole, and the specs the map names for the files you touch.
- The map: `python tools/docs/checks_for_paths.py <changed paths>`.

## Rules and files

You own `app/src/ui/projectSheet.ts` at the date input only (a class if needed), `app/src/style.css` at one sheet rule beside the sheet's rules, `app/src/ui/screens/LessonScreen.ts` at the Start line only, the tests named, the pictures; `docs/04` rows in the entry's `## Doc rows`. Not `LibraryScreen.ts` (G85), not `session.ts` (G1e), not `SkillsScreen.ts`, not `DrillScreen.ts`/`sessionRunner.ts` (U96), not `tools/content/**`. Never name an AI model. Never assert a number measured on this machine. No commits, pushes, stashes or checkouts. Temp state under the worktree's own gitignored `build/`. A fresh worktree's `npx vitest run` needs `python tools/midi-cleanup/tests/parity_reference.py` and `python tools/content/build.py --offline` first (Q24); if the offline build cannot produce `app/public/content`, copy that folder from `C:\Users\yalir\repos\Piano Stuff\PianoProject\app\public\content` and say so; `npm ci` in `app/`. Nothing on ports 4173, 4413, 4423, 4433, 4443, 4453.

## Sequencing

G1b's follow-ups 3 and 7 (P3), released by G1b's acceptance; a narrow fix-forward under 788427c with a for-information line; its own short handoff when it lands.

## Report

Judgement first: the sheet's date box and the Stage 9 Start line before and after at 342 × 740; then Done / Not done / Follow-ups / Questions / Files; the red lines; the tests table; exit codes; unverified beside what passes. Entry 153; every run file under `docs/prompts/runs/G87/`; the entry as `docs/prompts/runs/G87/ENTRY.md`, starting `### Entry 153 — G87`.

**Brief approved 2026-09-29** (`responses/questions-ea14b1fe.md`).
