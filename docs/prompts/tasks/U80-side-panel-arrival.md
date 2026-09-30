# U80 — The lesson text beside the score on a tablet arrives after the screen is shown and nothing says when it is decided: the sweep in `side-panel-prose.spec.ts` reads the panel before it is filled and finds none drawn (red on the runner twice and locally), and if the panel arrives after the score's first draw the stage is priced without its column and jumps — measure it, mark the decision, and fill the panel before the fit where it moves the stage

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13; `app/src/ui/screens/ScoreScreen.ts` at `fillSidePanel` (the fill: `loadCurriculum`, `judgingRung` or `proseRungFor`, the lesson's text fetched, then `sidePanel.hidden = false` and `section.dataset.side = 'text'`; on failure `hidden = true` and no mark) and where it is called relative to the first draw and the fit; `app/tests/e2e/side-panel-prose.spec.ts` (`openPiece` waits for the score's svg before reading the panel; the sweep at line 181 does not); `docs/prompts/entry-114.md` (U74: the first frame is the settled layout; `data-settled`); `docs/04-ui-spec.md` §5 at the side panel and the tablet column; `app/src/ui/tablet.ts` (`isTablet`, `sidePanelProse`).

## The goal, in the orchestrator's words

On a tablet the lesson's text sits beside the score in a 320 px column. That column is part of the stage's width, so whether the panel is there decides how big the music can be. The panel is filled after the screen is shown — a curriculum load, a rung lookup, a fetch of the lesson file — and nothing marks the moment it is decided: `data-side` is set when text arrives and never when the panel is left out. The sweep test reads the panel as soon as the screen is visible and, on the runner and on this machine tonight, finds it hidden for every piece, so it fails saying no piece drew a panel while the single-piece cases (which wait for the score's svg first) pass. Two faults may hide there: a spec that reads an undecided state, and a panel that arrives after the score has been fitted without it.

## What is decided

1. **The measurement first.** On the current tree, on a tablet viewport, for the pieces the sweep picks: when the panel is decided (filled or left out) relative to the score's first draw and to `data-settled`, as observed times from the page (performance marks or the order of DOM mutations), before and after the fix; whether the stage's box changes when the panel arrives. The orchestrator's hypothesis: the panel is decided after the screen's `[data-screen="score"]` appears and, on most pieces, after the first draw, because `fillSidePanel` awaits the curriculum and the lesson fetch after the fit was priced; the refuting test is a recording of the decision landing before the first draw on every swept piece — then only the spec is at fault.
2. **The decision marked.** `section.dataset.side` is `'text'` when filled and `'none'` when left out (a piece on no rung, a lesson that will not read), set exactly once per opening and cleared when the screen opens another piece; nothing else about the panel's words or rule changes.
3. **The panel before the fit where it moves the stage.** On a tablet, where the panel's column changes the stage's width, the fit waits for the panel's decision (bounded: the curriculum and the lesson text, both local files; on failure the decision is `'none'` and the fit proceeds) so the first draw is priced with the column it will have — U74's rule extended to the panel. On a phone the panel is not drawn and nothing waits. If the wait would delay the first draw beyond what a learner accepts (state the observed relationship: the panel's decision against the score's first frame, before and after), say so and keep the panel's arrival as a resize after the draw instead, with the reason.
4. **The spec.** The sweep waits for `data-side` to be decided before reading the panel, as `openPiece` waits for the svg; the assertion that at least one piece drew a panel stays. The `openPiece` cases wait on the same mark. No other case changes.
5. **Not U80's:** the panel's words, the rung rule (`judgingRung`, `proseRungFor`, L8), the phone, the score's fit rule, the `score.bar-targets` spec (its runner failure passed locally: runner timing, recorded as a note in the entry, not touched).

## Verification layers

- Unit, red first: a `data-side` case on the screen's panel builder (filled → `'text'`, left out → `'none'`, reopened → cleared then set).
- Browser, on port 4313: `side-panel-prose.spec.ts` whole (the sweep red on the committed tree with the reason captured, green after); `score.window-rule.spec.ts` and `score-fit-paths.spec.ts` preserved (the fit's timing); `wide.spec.ts` tablet cases preserved.
- The product look: a tablet (768 × 1024 and 1024 × 768) opening one swept piece — the first frame and the settled frame, before and after, as pictures; the stage's box in both; nothing heard.

## Rules and files

You own `app/src/ui/screens/ScoreScreen.ts` at `fillSidePanel`, the panel builder and the call order around the fit only (G1a landed; X3 landed; no other builder holds the file tonight), `app/tests/e2e/side-panel-prose.spec.ts`, one unit file, `docs/04` §5 rows as doc rows in the entry. Not `WindowRenderer.ts` (U74's rule is the renderer's; the screen decides what stage it hands over), not `tablet.ts`'s breakpoint, not `docs/08` (a doc row). Playwright on port 4313 through a copy of the config (`docs/prompts/runs/U74/scripts-playwright.u74-4233.config.ts` is the pattern), two workers at most; a `specs-exist` check before the step. A fresh worktree's `npx vitest run` needs `python tools/midi-cleanup/tests/parity_reference.py` and `python tools/content/build.py --offline` first (Q24). Never name an AI model. Never assert a number measured on this machine. Every change red first; no commits, pushes, stashes or checkouts.

## Sequencing

A regression repair under the Score screen's accepted contracts (788427c): dispatched now with a for-information line to the reviewer; the post-build review is the gate. CI's full run on the branch has been red at this spec since at least the tree at 05c9e01.

## When to deviate

If the measurement refutes the hypothesis (the panel is decided before the first draw on every swept piece), fix the spec alone (items 2 and 4), say so, and record what does delay the sweep's reading. If waiting for the panel would hold the first draw behind a network fetch on a served build (the lesson files are served, not bundled), say so and choose the resize path with the reason.

## Report

Judgement first: what a tablet learner sees in the first frame before and after, as observations with the pictures; then Done / Not done / Follow-ups / Questions / Files; the measurement table; the red lines; the tests table; exit codes; unverified beside what passes.

**Landed 2026-09-29** (Entry 125; ba86d75c, merged ebad0720); handoff `handoffs/ba86d75c.md`. U86, U87 recorded.

**Closed 2026-09-29** (`responses/ba86d75c.md`, APPROVE): the ordering contract established; the bounded wait and the per-screen ownership are the constraints; U86 and U87 later waves.

## Record

lane: U80 · closes: U80 · entry: 125
index: The lesson text beside the score on a tablet: when it is decided, marked; filled before the fit where its column moves the stage; the sweep spec waits on the mark (`U80-side-panel-arrival.md`) | CI red at `side-panel-prose.spec.ts` since 05c9e01; the local rerun | `ScoreScreen.ts` at `fillSidePanel` and the call order, the spec, one unit file | **closed 2026-09-29** (`responses/ba86d75c.md`, APPROVE; Entry 125): the wait bounded, the per-screen ownership kept; U86, U87 later waves |
in-flight: dispatched 2026-09-29 (Entry 125, port 4313): the side panel's arrival — `side-panel-prose.spec.ts`'s sweep red on the runner (05c9e01) and locally; the decision marked, the panel before the fit where its column moves the stage; a regression repair under the Score screen's contracts. **Landed** 2026-09-29 (merged ebad0720, chain green); handoff `handoffs/ba86d75c.md`, with the reviewer; the hypothesis held on every opening; U86, U87 recorded. **Closed** 2026-09-29 (`responses/ba86d75c.md`, APPROVE).
state: closed 2026-09-29: APPROVE (`responses/ba86d75c.md`)
