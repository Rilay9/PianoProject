# U122d — parked 2026-10-03 (the scheduler at 638883e moved Score to Blocker 3)

Branch `claude/blocker1`, from `a9be9b4`. Not merged; not on the working branch. Picked up only if the
representative learner journey (Blocker 2) shows one of these two cells as a live blocker.

## What is built
- **Narrow upright rows (option (b)).** `fitBarControls` no longer falls back to the pre-U122c row
  upright, and R, L and Both are always at the floor (`data-floor` and `data-row='today'` removed).
  Hands goes behind `⋯` where the row cannot hold it with the mode whole. It comes back while a
  sentence asks for a hand, in two parts. First, the row is refitted when the `⋯` sheet closes: a
  refusal made from the sheet was never refitted for. Second, at 342 px the bpm readout gives way while
  the sentence stands. Even with `Hear it` gone, ▶, the mode, Hands at the floor, the bpm and `⋯` were a
  few pixels too wide.
- **The finished verdict.** `#summary-verdict`, one plain sentence under a heading that is not itself a
  verdict (*Run finished*, *Notes ready*), from the facts *To pass* is drawn from
  (`SUMMARY_TEXT.verdict`, `help.ts`).

## Learner-facing text (where, before, after, why)
- Summary sheet, under the heading, on a judged run that missed its standard. Before: nothing. After:
  - *Not a pass: the notes were right, but the tempo was below the 80 % a pass needs.*
  - *Not a pass: fewer than 90 % of the notes were right.*
  - *Not a pass yet: Wait for me does not judge the tempo, and a pass needs one.*
  - and the two-reason forms.

  Why: *Run finished* did not say whether or why the run counted (`responses/3bb9d281.md`). The numbers
  are the standard's, never the run's rounded figure.

## Evidence
- **Red at `a9be9b4`** (`red-at-a9be9b4.txt`): the tightened walk failed at 342 × 740, 360 × 780 and
  1024 × 768 (R and L under the floor, the mode cut, no verdict).
- **Green on the fix:**
  - the U122d upright test (342 × 740, 115 %, wider face);
  - `sessionItemStory.test.ts`;
  - typecheck and lint.
- **Mutants caught:**
  - the verdict not placed (3 unit tests red);
  - no refit on the sheet's close (the browser test red);
  - no named return (the browser test red).
- **Not run on the fix:**
  - the walk cells (`score.task-chrome.spec.ts` subset) — the walk's green on the fix is unobserved;
  - `score.screen.spec.ts`'s sideways rows (edited: the `data-floor` toggle removed);
  - the full Playwright suite;
  - pictures (none taken).

## Not started
U35 (probe written, not run) and U9 (probe written, not run). The probes are in the ignored `app/build/u35/`
and are lost with this container.
