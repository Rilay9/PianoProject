# U92 — The Skills row's detail line never shows a cut count: the count first, a visible ellipsis where a token is cut, never a number that reads as another number (U90's follow-up 1, P2; the reviewer's ruling)

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13; `docs/prompts/entry-135.md` (U90: the Skills title never cut; follow-up 1 and its pictures under `pictures/u90/` — "Stage 2 · core · 1" standing for "15 to practise" at 342 px on the stack, "Stage 2 · cc" under the wide face); `docs/review/responses/994586f9.md` (the reviewer: a real learner-facing follow-up, repaired separately, never by reopening U90's title rule); `docs/prompts/tasks/U90-skills-title-never-cut.md` (how U90 measured, the spec it added, the wide face); `app/src/ui/screens/SkillsScreen.ts` at the row (about line 314: `listRow({ … meta: \`Stage ${…} · ${…} · ${N} to practise\` })`) and the second `listRow` at about 337; `app/src/ui/widgets.ts` at `listRow` (about 171) and `fitDetail` (about 153: it drops whole tokens to a character budget, and the Skills row does not pass through it); `app/src/style.css` at `.list-row__meta` (about 3713: one line, `nowrap`, `overflow: hidden`), `.list-row__metatext` (about 3741: no ellipsis, by design for lines `fitDetail` already trimmed) and `.list-row__actions`; `docs/04-ui-spec.md` on the Skills screen's rows.

## The goal, in the orchestrator's words

A learner opening Skills at phone width reads *Stage 2 · core · 1* on *Shifting position* where the line says *15 to practise*; on another row *2* stands for 25. The line is cut mid-token beside the buttons and shows no sign of it, so a count reads as a different number — a false fact on screen (never teach wrong). U90 made the title never cut; the reviewer ruled the detail line its own repair. After U92 no row's detail can show a wrong number: the fact the learner needs comes first, and whatever must be cut is visibly cut.

## What is decided

1. **The count first.** The Skills row's detail reads *15 to practise · Stage 2 · core* — the count and its noun first, then the stage(s), then the track(s). The words stay U90's; only the order moves. The second `listRow` (about 337) is read and left as it is unless it carries a count that can be cut the same way — say which.
2. **A cut is visible.** For `#skills-list` only, `.list-row__metatext` shows an ellipsis where it is cut (`text-overflow: ellipsis`); the site-wide rule for `fitDetail`-trimmed lines is untouched, with its comment. Nothing else in `style.css` moves.
3. **The count itself is never cut.** Red first at 342 × 740 on the app's stack: for every Skills row, the detail's first token (the count and *to practise*) is wholly visible — measured, not eyeballed: the row's `.list-row__metatext` `scrollWidth` versus its `clientWidth` says whether anything is cut, and the text up to the first *·* must fit within `clientWidth` (a Range or a span measured with `getBoundingClientRect`). If under U90's wide face (the way U90 emulated it, or the runner's font) the count itself would not fit at 342 px beside the buttons, the Skills detail wraps instead of cutting (`white-space: normal` for `#skills-list` alone) — choose by the measurement and say why; a wrap costs a line, a cut count costs the truth.
4. **Not U92's:** U90's title rule (accepted; do not touch `.list-row__title` or the title's measurement), the Library and Today rows' detail lines (their own rules and comments), the buttons' width, `fitDetail`, the words of the detail beyond their order.
5. **Red first, browser** (the pattern of U90's spec; a copy of its wide-face emulation if it had one): at 342 × 740, every Skills row's count wholly visible and the row's height unchanged from U90's picture unless item 3 chose the wrap; one picture of the same rows U90 pictured (*Shifting position*, *Primary chords with the dominant seventh*) before and after under `docs/prompts/pictures/u92/`, and one under the wide face.
6. **Red first, unit:** the row's meta string order (the count first) in the pattern of the existing Skills screen unit test (search `tests/unit` for `SkillsScreen`); U90's own tests green untouched.

## Verification layers

- Unit, red first: item 6; `npx vitest run` on the Skills files; `npx tsc -b`; `npm run lint`.
- Browser, on port 4423 through a copy of `app/playwright.config.ts` as `app/playwright.u92-4423.config.ts`, `--workers=2` at most, with a check that every spec file you name exists: `plan.spec.ts` whole (U90's case lives in its F2b describe, run twice — on the app's stack and on a wider face by `page.addStyleTag`; the new case beside it, in both passes, red first), `wide.spec.ts`'s phone-portrait Skills scene (its pictures moved with U90's wrap and will move again if item 3 chooses the wrap — rerun and re-picture it), and the specs that open Skills (`competence.spec.ts`, `finder.spec.ts`, `help-strip.spec.ts` — run what exists among them). Pictures as in item 5.
- The map: `python tools/docs/checks_for_paths.py <changed paths>`.

## Rules and files

You own `app/src/ui/screens/SkillsScreen.ts` at the row's `meta` only, `app/src/style.css` at a new `#skills-list` rule only, the tests named, the pictures; `docs/04` rows in the entry's `## Doc rows` (the docs themselves are the next splice's). Not `widgets.ts`, not the title rule, not the Library or Today rows. Never name an AI model. Never assert a number measured on this machine. No commits, pushes, stashes or checkouts. A fresh worktree's `npx vitest run` needs `python tools/midi-cleanup/tests/parity_reference.py` and `python tools/content/build.py --offline` first (Q24); if the offline build cannot produce `app/public/content`, copy that folder from `C:\Users\yalir\repos\Piano Stuff\PianoProject\app\public\content` and say so; `npm ci` in `app/`. Nothing on port 4173 or 4413 (another builder). Two other builders work on `session.ts`/`TodayScreen.ts` and on `tools/content/`; do not touch those.

## Sequencing

U90's follow-up 1 (P2, a false number on screen), ruled its own repair by the reviewer; a narrow fix-forward under 788427c with a for-information line; its own handoff when it lands.

## When to deviate

If the Skills row's meta is built somewhere other than the line named, name it. If the `#skills-list` rule cannot be scoped without touching the shared rule, stop at the finding and say what the shared rule would need. If the count first reads wrongly with several stages (*15 to practise · Stage 2, 3 · core*), keep it and record the observation.

## Report

Judgement first: the two rows U90 pictured, at 342 × 740 before and after, and under the wide face; then Done / Not done / Follow-ups / Questions / Files; the red lines; the tests table; exit codes; unverified beside what passes. Entry 143; every run file under `docs/prompts/runs/U92/`; the entry as `docs/prompts/runs/U92/ENTRY.md`, starting `### Entry 143 — U92`.
