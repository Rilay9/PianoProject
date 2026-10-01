# U122 — the sideways score bar gets one layout model (a design lane: no app code changes)

**Why this lane exists.** Eight lanes have touched one strip of the Score screen in two weeks: U105, U105a, U105b, U105c, U105d, U119, U119a, and U118's folded chip beside it. Two rows are open on the same strip: U120 (at 568 × 320 the sound-refusal sentence grows the bar taller than the window, so ▶ is drawn above the screen) and U121 (the mode menu reads "Wa" for "Wait" at narrow sideways widths). Each fix was right locally and reviewed. The reviewer's trajectory review (`docs/review/trajectory-2026-10-01.md`) names this strip as the project's one hotspot where "too many independently reasonable layout rules are accumulating in one mechanism", and says to redesign the subsystem rather than continue the chain. This lane stops the chain: U120 and U121 are not fixed locally; they become acceptance cases for the model.

## Hypothesis and its refuting test

**Hypothesis.** The bar has no allocation model. It is one flex row in which each child sets its own shrink, clip and wrap behaviour in CSS, and a JS loop (`fitBarControls`) moves controls behind ⋯ by measuring symptoms: a second row (`barIsOverfull`), a clipped edge (`leftGroupIsCut`), a control under the tap minimum. Every new state (refusal, ordinary pause, away, fold) or geometry added a rule rather than an input to one rule.

**Refuting test.** If the inventory below shows the existing rules already derive from one priority order with stated minimum widths, the hypothesis is wrong: report that, and propose only the missing inputs, not a redesign.

## Read first

- `docs/prompts/operating-procedure.md` §11–§14 (§14 is the harness).
- The rulings that set the bar's invariants, each with its handoff: U105 (`responses/f51e8010.md`), U105a (`d0e1b01f.md`), U105b (`6a374f8a.md`), U105c (`842ea210.md`), U105d (`bb271f4a.md`, option (a): the bar may grow while a refusal stands), U119's brief (`questions-e9aa51ae.md`), U119 (`fa4563d1.md`), U119a (`759596b4.md`: the semantic minimum, the character-boundary ellipsis, and "a visible instruction must never direct the learner to a control the same layout has hidden").
- The code: `app/src/ui/screens/ScoreScreen.ts` (`OVERFLOW_ORDER`, `barIsOverfull`, `leftGroupIsCut`, `fitBarControls`, `syncBarLeft`, `drawWhere`, and every caller of `fitBarControls`); `app/src/style.css` (every `.score-bar` rule and every `data-sound-refused` rule, upright and sideways).
- The tests and measurements: `app/tests/e2e/score.screen.spec.ts` (`barLeftAgainstControls` and the sideways matrices), `score.spec.ts`'s one-row cases, the probe tables under `docs/prompts/runs/U105d/`, `U119/` and `U119a/`, and U120's red reproducer `docs/prompts/runs/U119a/scripts-refusal-568.spec.ts`.

## The deliverable: one design document, `docs/design/score-bar-layout.md`

1. **Inventory.** Every rule that decides what the bar shows, CSS and JS, at file and line: what it does, the lane and ruling that added it, and the invariant it protects. A rule whose invariant cannot be named is listed as such.
2. **Invariants, stated once**, each with its ruling: ▶ and ⋯ always visible and tappable; one row of controls; Back usable and the piece's widest `bar m / m` whole; a cut status visibly marked; U105d's refusal sentence whole; a control that visible text tells the learner to tap is itself visible; nothing drawn outside the window (U120); a selected value readable (U121); no control moves mid-piece. Add any the inventory finds; flag any two that conflict.
3. **The model.** One priority order over the bar's items, each with a minimum and a preferred width, and one allocation function from (width, text size, face, state) to which controls stay, which go behind ⋯, and how much room each text item gets. The main design choice is where the refusal sentence lives: inside the bar, growing it as U105d allowed, or in its own surface (a row under the bar, or the sheet). Measure both against the invariants and recommend one, with the trade a learner meets.
4. **The mapping.** Each inventoried rule: kept, subsumed by the model, or deleted.
5. **Predicted outcomes** on the existing grids (U105d's, U119's, U119a's 64 paused and 40 refusal cells, U120's and U121's cells), computed from widths measured in the browser, not estimated. List every cell where the model changes today's outcome, and what a learner gains or loses there.
6. **A build plan for one lane:** the files, the tests that become its acceptance oracle (the existing matrices kept; an assertion changes only where the model deliberately changes an outcome, each one named), and the mutants.

## Rules and files

- **Owned:** `docs/design/score-bar-layout.md` and the run folder `docs/prompts/runs/U122/` (probe scripts and their tables).
- **Allowed:** read the code; run the existing specs and new probe scripts, on this lane's own port, to measure real widths.
- **Not allowed:** any change to app source, styles or committed tests. This lane designs; the build lane that follows it builds.
- **Out of scope:** other screens. The upright bar is in scope only as far as the same functions and rules govern it; report what the model means for it.

## Stop conditions

- The inventory refutes the hypothesis: report it as above.
- No allocation meets every invariant at some cell: report that cell as a product choice, with the options and what a learner meets under each. Do not choose it.

## Report

Judgement first: the model in a paragraph a reviewer can hold in their head, and how many rules it replaces. Then the inventory count, the invariant conflicts, the predicted-outcome table, and the build plan. *Unverified on a device*: Chromium only. Pedagogical verdict: not applicable, except where a hidden control changes what a learner can do.

**Entry 206.** Run files under `docs/prompts/runs/U122/`, the entry at `docs/prompts/runs/U122/ENTRY.md`, starting `### Entry 206 — U122`.

## Harness

As `operating-procedure.md` §14. This lane's port is **5353**, from a config copy under the worktree's `app/build/u122/`.

## Record

lane: U122 · closes: — · entry: 206
index: The sideways score bar gets one layout model: an inventory of every rule, the invariants stated once, one priority-and-width allocation, the refusal sentence's place decided, U120 and U121 as acceptance cases (the reviewer's trajectory review, 2026-10-01) (`U122-the-sideways-score-bar-gets-one-layout-model.md`) | design | drafted 2026-10-01 (`U122-the-sideways-score-bar-gets-one-layout-model.md`); Entry 206
in-flight: drafted 2026-10-01 (`U122-the-sideways-score-bar-gets-one-layout-model.md`): a design lane, no app code; the bar's rules inventoried, one allocation model proposed and measured on the existing grids, U120 and U121 folded in as acceptance cases; with the reviewer before dispatch (Entry 206)
state: with-reviewer 2026-10-01: with the reviewer before dispatch (Entry 206)
