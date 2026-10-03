# Reviewer response — G85 `ba4c6fea`

Implementation HEAD: `ba4c6fea` (merged at `760b8f61`). Seam reviewed: **G85, Library project state/filter and door to the one project sheet**.

## Verdict

**APPROVE WITH ONE REQUIRED CHANGE**

The state/filter portion is good and should stay:

- the Library reads the one project store rather than manufacturing project truth;
- project identity is resolved through the store's existing identity rule;
- a row with a project shows the same state words as the sheet;
- the project filter consumes the already-built index rather than reopening the store;
- the Library remains a reader, not an actor;
- the plain project badge is correct. A project state is not a passed achievement, so it should not inherit the check-mark styling.

The measured decision not to add another row-level `Project` word is also correct. At phone width it destroys the title column, and preserving the piece's identifying title is more important than exposing a second adjacent text action.

## REQUIRED CHANGE — put the project door in the existing Details sheet

G85's approved product contract was not only “show the state”; the Library should also open **the same one project sheet**.

Do not put a new action beside `Details` or `⋯`, and do not add a new project UI.

Use the existing **Details sheet** as the door:

- for a projectable item, add one clearly named row/action inside Details that opens the existing project sheet for that item's resolved project/material target;
- where a project already exists, the action can use the learner-facing project language already owned by `PROJECT_TEXT` (for example the current state / “Project” entry), but the destination must be the same project sheet Progress and Score use;
- where no project exists, only expose the door if that sheet has an honest action from “no project” for this item. Do not imply a project exists merely because the item is projectable;
- the project sheet remains the sole actor. The Library Details sheet only opens it;
- preserve the one-store-read/index model. Opening Details must not create a second per-row store lookup regime.

This satisfies the original requirement without spending horizontal row width.

Add a browser adversary at 342 px: a project row keeps its identifying title, Details opens the project sheet, an action there changes state, closing back to Library redraws the badge/filter from the one store truth.

## Questions

### 1. Where should the Library door go?

**Details sheet.**

That is the cleanest hierarchy: the row remains browseable and dense; Details owns secondary information/actions; the project sheet remains the single project actor.

Do not use a boxed glyph merely to save characters. A project-management glyph has no obvious universal meaning. Do not make the passive badge itself the only door unless the app establishes badges as interactive controls elsewhere.

### 2. Should Stage 9 rows open the project sheet?

**Yes, but not as a G85 blocker.**

A row that displays a project state should eventually have a discoverable route to that project's sheet. Stage 9 already has width pressure, so use the same product principle: route through an existing secondary/details surface rather than adding another title-row word. G87/G91 may own that follow-up if they already touch the Stage 9 row.

### 3. Filter copy

Keep the current copy for now.

`Project or not` is slightly mechanical, but it correctly means “do not filter on project state,” while `Your projects` clearly means rows with a project. Do not churn the seam for speculative copy. U/H learner-walk testing can decide whether the default phrase needs refinement.

## Performance note

The current O(catalogue songs × projects) index construction is acceptable at the measured project counts, but the recorded hundreds-of-projects growth is a legitimate later optimization point. Do not optimize it in G85 unless H2 demonstrates a real latency problem.

## Classification

- **APPROVED AS BUILT:** one project-store read per load/change, identity-aware index, row badge, Project filter, plain state styling, store-change redraw, Library remains a reader.
- **BLOCKS G85 CLOSURE:** Details must provide the door to the one project sheet without shrinking the row title.
- **LATER:** Stage 9 project-sheet door through an existing secondary surface; possible index optimization only if measured.
