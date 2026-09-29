# U96 — The session's end sheets say only what was measured: a drill ended before any answer is *Not measured*, not *Accuracy 0%*; the placement test's end sheet in a session has one way forward, not two filled boxes (X1's follow-ups 2 and 4; P3, a false number on screen)

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13; `docs/prompts/entry-134.md` (X1: the transition block on the drill's end sheets; follow-up 2 — a drill set ended before any answer is headed *Not passed yet* over *Accuracy 0%* and *Answered 0 of 4*, a measurement nobody took, `pictures/x1/transition-after-drill-342x740.png`; follow-up 4 — in a session the placement test's end sheet has two filled boxes, *Start here* and the transition's *Start*; follow-up 3 — the fallback's words after *Next:* stay the composition's, ruled, not U96's); `docs/review/responses/aed824a1.md` (the X1 review: the minutes line stays; the other items judged on the phone in one pass); `app/src/ui/screens/DrillScreen.ts` at the pass judgement (about 247–270: `answered === 0` already returns `passed: false, judged: true`) and the end sheet that prints *Accuracy* and *Answered N of M* (find the sheet builder; read how T40's *Not measured* heading is chosen for a run the app heard nothing of); `app/src/ui/help.ts` at `notMeasuredHeading` and `notMeasured` (about 213–222: T40's words — *Not measured*; *The app heard no notes, so there is nothing to mark.*) and `SESSION_TEXT` (about 1180–1210); `app/src/ui/sessionRunner.ts` at the transition block (about 320–375: how it is mounted on the Score summary and the drill and placement end sheets); the placement test's end sheet (search `app/src` for *Start here*); `app/tests/unit/sessionTransition.test.ts` and `app/tests/e2e/session-run.spec.ts` (X1's cases and pictures); `docs/04-ui-spec.md` on the drill end sheet and the placement sheet.

## The goal, in the orchestrator's words

Two small untruths on the session's end sheets. A learner who ends a drill before answering reads *Accuracy 0%*: a number for a measurement nobody took, which the app already refuses to print for a run it heard nothing of (T40). And the placement test's end sheet, inside a session, offers two filled buttons — the sheet's own *Start here* and the transition's *Start* — where a learner should see one way forward. After U96 an unanswered drill is *Not measured* with the reason in the learner's words, and the placement sheet in a session has one primary action.

## What is decided

1. **No answer, no number.** When a drill set ends with `answered === 0`, the end sheet's heading is T40's *Not measured* (`notMeasuredHeading`, reused, never a second wording) and the *Accuracy* line is not printed; *Answered 0 of N* may stay (it is true). The reason line is a new sentence in `help.ts` beside T40's, in its shape, for this case (no answers, not no notes): the learner ended before answering, so there is nothing to mark. *Not passed yet* is not printed either: nothing was judged. The transition block below is unchanged.
2. **One way forward.** On the placement test's end sheet inside a session, the transition's *Start* is the one primary action; the sheet's own *Start here* becomes secondary in the sheet's existing secondary style (or is not shown while the transition block is present — choose by what the sheet does outside a session, where *Start here* must stay primary, and say why). Outside a session nothing changes.
3. **Not U96's:** the fallback's words after *Next:* (ruled: the composition's words stay), the minutes line (ruled), the drill's pass rule, the placement test's own logic, `sessionRunner.ts` beyond how the block is mounted on the placement sheet if item 2 needs it.
4. **Red first, unit:** in `sessionTransition.test.ts`'s pattern (or the drill sheet's own unit test): a drill ended with no answer — before, the sheet's heading is *Not passed yet* and an *Accuracy* line exists; after, *Not measured* and no *Accuracy* line; a drill with one answer — unchanged; the placement sheet in a session — before, two primary buttons; after, one.
5. **Red first, browser** (`session-run.spec.ts`'s cases at 342 × 740): the drill ended early, its sheet's heading and lines; the placement test ended in a session, one primary button. Pictures before and after under `docs/prompts/pictures/u96/`.

## Verification layers

- Unit, red first: item 4; `npx vitest run` on the drill, session-transition and session-run files; `npx tsc -b`; `npm run lint`.
- Browser, on port 4453 through a copy of `app/playwright.config.ts` as `app/playwright.u96-4453.config.ts` (not for the commit), `--workers=2` at most, files checked to exist: `session-run.spec.ts` whole, `modes-placement.spec.ts` and `placement-branches.spec.ts` whole (the sheet outside a session unchanged), the drill specs the map names.
- The map: `python tools/docs/checks_for_paths.py <changed paths>`.

## Rules and files

You own `app/src/ui/screens/DrillScreen.ts` at the end sheet, `app/src/ui/help.ts` at one new sentence, the placement sheet's file at its buttons, `app/src/ui/sessionRunner.ts` only at the placement mount if item 2 needs it, the tests named, the pictures; `docs/04` rows in the entry's `## Doc rows`. Not `session.ts`, `TodayScreen.ts`, `LibraryScreen.ts`, `SkillsScreen.ts`, `style.css` (other builders; if a secondary style is missing, say so and use the existing one), `tools/content/**`. Never name an AI model. Never assert a number measured on this machine. No commits, pushes, stashes or checkouts. Temp state under the worktree's own gitignored `build/`. A fresh worktree's `npx vitest run` needs `python tools/midi-cleanup/tests/parity_reference.py` and `python tools/content/build.py --offline` first (Q24); if the offline build cannot produce `app/public/content`, copy that folder from `C:\Users\yalir\repos\Piano Stuff\PianoProject\app\public\content` and say so; `npm ci` in `app/`. Nothing on ports 4173, 4413, 4423, 4433, 4443.

## Sequencing

X1's follow-ups 2 and 4 (P3), released by X1's acceptance; a narrow fix-forward under 788427c with a for-information line; its own short handoff when it lands.

## Report

Judgement first: the two sheets before and after at 342 × 740; then Done / Not done / Follow-ups / Questions / Files; the red lines; the tests table; exit codes; unverified beside what passes. Entry 152; every run file under `docs/prompts/runs/U96/`; the entry as `docs/prompts/runs/U96/ENTRY.md`, starting `### Entry 152 — U96`.

**Brief approved 2026-09-29** (`responses/questions-ea14b1fe.md`).
