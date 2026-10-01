### Entry 206 — U122 — the Score bar gets one layout model

Lane U122, a design lane (no app source, style or committed test changed). Brief: `docs/prompts/tasks/U122-the-sideways-score-bar-gets-one-layout-model.md`, approved as written (`docs/review/responses/b47ce498.md` §1, with its scope clarification on U118's chip). Base `842157ef`. Deliverable: `docs/design/score-bar-layout.md`. Port 5353, config copy under `app/build/u122/` (deleted at the end).

## Judgement

**Unverified on a device** (this machine's Chromium only; the app's own face is this machine's system stack, the wider face Verdana forced from the first paint). **Pedagogical verdict: not applicable**, except where a control's place changes what a learner can do (Hands or `Hear it` one tap further away at some upright sizes; back on the bar at others). Nothing was heard. Every number is this machine's.

**The redesign hypothesis holds; the acceptance is (a).** The bar's rules do not derive from one priority order with stated minimums: CSS flex weights, two symptom predicates and a width threshold each decide part of what yields, and only the location has a minimum. Three faults the missing minimums cause, measured and invisible to the existing predicates: the mode select is cut in 500 of 556 sideways states (every width probed, the owner's 780 × 360 included: *Wa*), so U121 is the sideways default, not a narrow edge; the refusal sentence becomes a column of characters (up to 31 lines, a 554 px bar in a 264 px room) and leaves the window in four cells, so U120 is four cells, 667 × 375 among them; and below 100 % text ▶ and ⋯ are 36 px, which the loop checks in pixels and can never fix, so it sends Hands and `Hear it` behind ⋯ at every width.

**The model in a paragraph.** Each item is priced once per geometry at the widest thing it can show in the piece (▶ and ⋯ at 40 px; the mode select's long and short forms at their widest labels; the tempo label with and without its percentage at its widest digits; `Hear it` at the wider of *Hear it* and *Stop*; Hands; sideways Back and the widest `bar m / m`). One order says what gives first: the name, the tempo's percentage, the mode's sentence, the ordinary status line (holding its existing 28vw band before any long word), Hands, `Hear it`; ▶, ⋯, the mode's word, the bpm, Back and the location never give. The first configuration that fits is the bar; the status line and the name share what is left, each at least its first letter and a whole ellipsis or nothing. No input is the run's state, so no control moves mid-piece. A refusal is drawn whole, by the same status element, on a line of its own across the top of the bar; the row under it does not change. **It replaces fourteen of forty inventoried rules** with one function and five declarations; twenty-six are kept.

**Measured, applied in the page:** 608 states of 202 cells (U119a's 64 sideways cells paused and through six refusal states, 48 upright, 16 at 880 × 412 and 1200 × 360, 10 at 90 % text), no invariant failing in any, the configuration identical across every state of every cell; the arithmetic rebuilds today's own row within 0.07 px over 530 states. U120: bars of 71–83 px where today's are 412–554 px, ▶ and the sentence inside the window. U121: *Wait* whole where today reads *Wa*.

**One product choice stops at the reviewer, not chosen** (design §5.5): where the row cannot hold Hands or `Hear it` with every label whole, a refusal of that control names a control behind ⋯ (39 and 8 cells under the model, 42 and 13 today). Options: pin it while the refusal stands; name the sheet in the sentence; accept. **Four choices made inside the model are put for confirmation** (§5.4): the refusal's own line (against `bb271f4a`'s "no third status surface"), the status band before long words (measured against the opposite order: the paused line at 2 characters or fewer in 3 cells against 13), a whole mode label before Hands or `Hear it` upright (13 cells), and the yielding-text floor.

## The mechanism, the discriminating tests, before and after

- **The refuting test** (the brief's): do the inventoried rules derive from one priority order with stated minimums? Read at the lines (design §1): no — three mechanisms decide, and only the location states a minimum. What tells "no model" from "a model missing inputs" is what absorbs a shortfall: measured, it is whichever item has no floor — the select, drawn short of its label by exactly the row's shortfall in every cell where the model sends a control away instead (`shortfall.txt`), and under a refusal the sentence. No predicate sees either, so adding inputs to the predicates would not reach them.
- **Today's bar measured as drawn, every item measured on its own** (`scripts-probe.spec.ts`): per state, the bar as drawn and each item's own width on an unseen copy in its own parent. The model's arithmetic rebuilds today's row from today's drawn widths within 0.07 px (`accounting.txt`), which is what makes the predictions computable from the items' widths.
- **The model applied in the page** (`U122_PROTO=1`): the same elements moved, their styles set to the priced widths, the refusal's element moved to the bar's first line, then measured and put back (`outcomes-*.txt`), and for the pictures left applied (`pictures/*-model.png`).
- **Before and after, measured the same way**, side by side per state in `outcomes-*.txt`; the refusal placements in `placement.txt`; the two orders in `orders.txt`; the hidden-control cells in `hidden.txt`.

## Premises found wrong, and the path taken

- **U121's premise** ("at narrow sideways widths"): the select is cut in 500 of 556 sideways states, at every width probed, and in 13 of 52 upright; its own test's instrument (`scrollWidth > clientWidth`) cannot see a select's cut label (49 = 49 where the label needs 125). The model treats it as the bar's default fault.
- **U120's premise** (568 × 320): four cells, one at 667 × 375.
- **The brief's invariant "a selected value readable"** cannot be satisfied by "readable" alone without a number; the model uses "whole" (the bar-targets spec's own stated intent) and puts the upright trade it causes to the reviewer.
- **A first ordering (long words before the status line) was measured and dropped**: it left the paused line unreadable in 13 of 64 cells (today 4); the recommended order leaves 3. Both runs are kept (`outcomes-wordsfirst-paused.txt`, `orders.txt`).
- **The probe's own faults, found and fixed before the final pass**: the tempo label first priced at three digits for every piece (now the piece's own count); the group's box read once and then moved by the prototype (now read live); a sub-pixel overflow read as a flush cut where Chromium draws the ellipsis (now read from the text's own width); the prototype's group at its content basis wrapped the row under the refusal's line at 568 × 320 (now a zero basis, which is the model's). Each was a probe fault, not the bar's; the final pass (`f-`) carries all four fixes.

## Done

- The inventory: forty rules, CSS and script, at file and line, each with its lane (`blame.txt`) and its invariant or *none named* (design §1); U118's chip checked for a shared allocation dependency and none found, with the lines (§1).
- The invariants stated once with their rulings (fourteen, four added by the inventory), and five conflicts named (§2).
- The model: items with minimums and preferred widths, one priority order, one allocation function, the refusal's place decided by measurement of both options (§3).
- The mapping: every inventoried rule kept, subsumed or deleted (§4).
- The predicted outcomes on U105d's, U119's and U119a's grids (all inside the 64-cell grid) and U120's and U121's cells, computed from widths measured in the browser and then applied and measured in the page; every changed cell listed by kind with the learner's gain and loss (§5).
- The build plan for one lane: files, the oracle (each changed assertion named with its class), new rows, eight mutants each with the row that kills it, the docs to update (§6).
- Harness per §14: `npm ci`, content copied read-only from the main checkout's `app/public/content` (this worktree holds only the committed audio there), `npm run build:app`, port 5353 from `app/build/u122/playwright.u122-5353.config.ts` with its own storage state by absolute path.
- Cleanup: `app/dist`, the copied content, the config copy under `app/build/u122/` (with its `test-results`) and the worktree's `build/u122/` deleted; `app/node_modules` kept.

## Not done

- **No device check.** None available.
- **The existing suites were not run.** The probe measured the same cells the committed rows run, and no code changed; CI is the full run. U120's reproducer was not rerun as a test: its two cells are in the refusal grid (today's bar 514–554 px and 412–428 px there).
- **During a demonstration and after a tempo change, state independence is by construction, not measured** (both labels priced at their widest). The design's state-independence row is the build's test for it.
- **The mid-run width changes today** (the tempo label's digits, *Hear it*/*Stop*) and **the refusal growth never given back to the stage** are read in the code, not reproduced (design §7).
- **The pieces probed are two** (and When the Saints at two widths); other titles change only the yielding text, other bpm digit counts only the tempo label's price, by the model's construction.
- **880 × 412 and 1200 × 360 were probed paused only**, not through the refusal states.

## Follow-ups (recorded, not fixed)

1. U121's row: its scope is every sideways width probed and some upright ones, not a narrow cell; the build's oracle needs the select's own width, not `scrollWidth`.
2. U120's row: four cells (568 × 320 at 100 % and 115 %, 667 × 375 at 115 %), not one.
3. Text below 100 %: ▶ and ⋯ at 36 px and both optional controls sent away at every width (a new finding; attaches to U122's cluster, fixed by the model's floor in pixels).
4. Observation, not a row: *Nothing for the left hand in this piece — choose R or Both* names Hands' controls, which can be behind ⋯, and is cut as ordinary status.

## Questions

1. **For the reviewer (stop, §5.5):** where the row cannot hold Hands or `Hear it` with every label whole, a refusal of that control names a control behind ⋯. (a) pin it on the bar while the refusal stands, (b) name the sheet in the sentence (*tap Hear it in ⋯ again*, a copy change), or (c) accept?
2. **For the reviewer (§5.4):** confirm or overturn the four choices: the refusal's own line as the same surface (not a third one under `bb271f4a`); the status line's 28vw band before long words; a whole mode label before Hands or `Hear it` on the bar upright; the yielding-text floor.

## Files

- `docs/design/score-bar-layout.md` (new).
- `docs/prompts/runs/U122/`: this entry; `scripts-probe.spec.ts`, `scripts-playwright.u122-5353.config.ts`, `scripts-run-proto.ps1`, `scripts-model.py` (the model's reference arithmetic and option A), `scripts-outcomes.py`, `scripts-accounting.py`, `scripts-orders.py`, `scripts-placement.py`, `scripts-hidden.py`, `scripts-shortfall.py`, `scripts-blame.py`, `scripts-keep.py`; tables `outcomes-{paused,refusal,upright,extra,small,smallup}.txt`, `outcomes-wordsfirst-paused.txt`, `accounting.txt`, `orders.txt`, `placement.txt`, `hidden.txt`, `shortfall.txt`, `blame.txt`; run logs `run-*.txt`, `npm-ci.txt`, `build-app.txt`; `cells/` (seven cells' full JSON); `pictures/` (seven cells, today and the model). Machine paths are `<worktree>`/`<home>`; no kept file is over 300 KB.

## Exit codes

| Step | Exit | Counts |
| --- | --- | --- |
| `npm ci` | 0 | |
| `npm run build:app` (base `842157ef`) | 0 | |
| probe, final pass (`f-`): paused, refusal, upright, extra, small, small upright | 0 each | 64, 64, 48, 16, 6, 4 passed |
| probe, the band order without the floor (`m-`, superseded by `f-`) | 0 each | 202 passed |
| probe, the words-first order (`p-`, kept for `orders.txt`) | 0 each | 202 passed; an earlier attempt of it, before the tempo-pricing fix, had one setup failure (the score never loaded in 60 s at its first test) and was discarded with its outputs |
| probe, exploratory runs before the prototype (today and the items only) | 0 each | 202 passed; outputs superseded, logs not kept |

## Content

Nothing under `content/` or `scores/` changes; no sentence's wording changes. The §12 itemisation list is empty.

**Orchestrator's note at the landing (2026-10-01).** U122's worktree committed by name (00f549d9) and merged (d0c79a77). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/U122/map-min.txt`), typecheck, lint, the whole unit suite, the app build, the spec names checked, then the specs the map's minimum names on the default port (map-tests 0; map-min 0; tsc 0; lint 0; vitest-all 1; build-app 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; `runs/U122/orchestrator-exit.txt`). Dispatched under the reviewer's own APPROVE on the brief (`responses/b47ce498.md` §1: dispatch U122 as written — at `b47ce498` the bar already has separate decision predicates for row/tap-minimum overflow and for the left group's semantic minimum, and independent CSS rules for no-wrap, group clipping, title shrink, status shrink/ellipsis and a refusal-state exception, “enough evidence to justify a design read before U120 or U121 receives another local rule”), itself answering the reviewer's own trajectory review naming this strip the project's one hotspot (`docs/review/trajectory-2026-10-01.md`, cited by the brief and by the backlog's own U122 row: “too many independently reasonable layout rules are accumulating in one mechanism”). The brief's own rules: inventory every rule that decides what the bar shows, at file and line, each with its lane and its invariant or none named; state the invariants once, flagging any two that conflict; propose one priority order with stated minimums and preferred widths, and one allocation function, deciding where the refusal sentence lives by measuring both placements against the invariants rather than choosing one; map every inventoried rule as kept, subsumed or deleted; predict outcomes on the existing grids (U105d's, U119's, U119a's 64 paused and 40 refusal cells, U120's and U121's own cells) from widths measured in the browser, not estimated; a build plan for one lane. Not allowed: any change to app source, styles or committed tests — this lane designs, the build lane that follows it builds. Stop conditions, both exercised: the inventory refuting the hypothesis (it does not: report held, as above); no allocation meeting every invariant at some cell (§5.5's own stop, reported with options, not chosen). Base `842157ef`, Entry 206. One scope clarification from the ruling, not a required brief change: U118's folded chip is adjacent geometry, to be absorbed only on a shown shared allocation dependency; none found, with the lines (design §1: the chip and the bar share content, not room — the chip is drawn only while the bar itself is `opacity: 0`, `inert` and measured at 0).. a design lane, docs only: the chain ran the map, typecheck, lint, the whole unit suite (the known blues.3/4.7 pair only) and the build; the map names no browser spec for docs; the build it specified is superseded by the reviewer's correction (responses/b47ce498-correction-1.md), carried by U122a

## Doc rows (proposed, not applied; the brief owns none of these files)

- `docs/prompts/backlog-2026-09-25.md`, U120: "four cells, not one: 568 × 320 at 100 % (wider face, Moonlight III) and 115 % (both pieces), and 667 × 375 at 115 % (wider face, Moonlight III); U122 measured" — and U121: "sideways the select is cut in 500 of 556 states probed, every width; upright 13 of 52 cells; `score.bar-targets`' instrument cannot see it (U122)".
- The build lane's own doc rows are listed in the design's §6.
