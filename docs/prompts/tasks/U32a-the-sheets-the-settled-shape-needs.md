# U32a — a long piece loads the sheets its settled shape needs, never the whole document inside a run (U32's required change under the fast path; the race pinned to Bars 4, T60 with it)

**A fast-path lane** (`operating-procedure.md` §11: a required change returns to a builder without a second brief review; the verdict is the pre-reviewed brief by construction). The brief is the original one — `U32-long-pieces-keep-a-look-ahead-row.md` — plus the reviewer's required change in `docs/review/responses/2f67b047.md` (§One required change), whose words govern. The dispatch message carried both, the base and the harness.

## What is decided

After the first paint and measurement the settled shape is computed without extra engravers and only the sheet count it needs is loaded; a later stopped-state bar-count change may load one more sheet and re-plan before the next run; never a whole-document load inside an active run; the priority order kept (no distortion, readable current music, useful look-ahead, the requested count where compatible). Bars 8: the same chooser for every piece, look-ahead outranking the count. A run started before later sheets exist freezes with what it has. The arrange-race case pinned to Bars 4; T60's header corrected with it. No per-sheet document cut. If the pricing pass needs document slicing or new renderer ownership, stop and brief.

## Rules and files

The original brief's owned files and boundaries hold; nothing outside the required change. Deviate only where a premise is wrong at the line, saying so and recording why. Adjacent problems recorded and classified, never fixed on the spot. Content and corrections itemised (§12) where a content byte or a taught sentence changes.

**Base.** 827289d0, origin's head at dispatch. **Entry.** 180; the run files under `docs/prompts/runs/U32a/`, the entry at `docs/prompts/runs/U32a/ENTRY.md`.

## Record

lane: U32a · closes: T60 · entry: 180
index: U32's required change: provision the sheets the settled shape needs after the first paint, never `MAX_SLOTS` by default and never a whole-document load inside a run; Bars 8 by the chooser; the race pinned to Bars 4 (T60) (`responses/2f67b047.md`) | app | dispatched 2026-09-30 at 827289d0 (`U32a-the-sheets-the-settled-shape-needs.md`); Entry 180 |
in-flight: dispatched 2026-09-30 (`U32a-the-sheets-the-settled-shape-needs.md`): U32's required change under the fast path: the sheets the settled shape needs, loaded after the first paint, one more on a stopped-state bar change before the next run, never inside a run; Bars 8 by the chooser's priority; the arrange-race case pinned to Bars 4, T60's header with it (`responses/2f67b047.md`); building (Entry 180)
state: dispatched 2026-09-30: dispatched at 827289d0, building (Entry 180)
