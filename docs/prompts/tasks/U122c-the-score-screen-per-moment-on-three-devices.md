# U122c — the Score screen shows each moment what it needs, designed for phone sideways, phone upright and tablet (a build)

Labels: **VERIFIED** (the orchestrator checked it at the source), **SETTLED** (a ruling; do not re-prove), **HYPOTHESIS**, **OPEN** (yours to decide), **OUT OF SCOPE**.

## Problem

A learner on the Score screen meets six moments: at rest, the count-in, playing, paused, a refusal, finished. Today the screen draws one static set of chrome and folds it on a timer. So a paused learner is told to tap ▶ with no ▶ on the glass (walk finding 5). The count-in's numerals sit on the notes the learner must read to come in (walk finding 8). Sideways, everything fights for one strip: U120's refusal leaves the window, U121's mode reads *Wa*. The finished sheet hides its next action below the figures. Each moment should show what its task needs and nothing that competes with the music. The screen should be designed on its own terms for each device (`docs/04-ui-spec.md` §0 R7).

## Current evidence

- **SETTLED, the invariant** (`responses/911f8c82-correction-1.md`, the owner's direction): information earns screen space from the learner's current task, not because it exists in the Score model. Its per-state table is the acceptance description, mapped onto the states the app already has. It is not a new state taxonomy. U122b mapped it (`docs/design/score-bar-layout.md` §9.1).
- **SETTLED, sideways phone: c6** (`responses/911f8c82.md`). A thin top line holds the name and `bar n / m`; one bottom row holds the controls; a refusal takes the title's place while it stands. U122b probed it per state and found three rules it lacked (`responses/e070d238.md`, approved):
  1. the fold keys on playing, not on a run existing, and leaves a direct ⏸ in ▶'s place; paused and refused reopen the row;
  2. the count-in leaves the notation stage: no wash, no numerals over notes;
  3. the row's painted area ends at its controls.

  Also carried:
  - the top line is as tall at rest as a run's band, so ▶ moves nothing;
  - no stale chip over the finished sheet;
  - cause-bearing paused notes (`pauseNote`, the away note) may take the title, a generic pause may not (semantic, never string-parsed);
  - the large count numerals sit beside ⏸, fitted at 568 × 320 / 115 % / the wider face, with the top-line count as the fallback.
- **SETTLED, finished** (`responses/e070d238.md` required change; `responses/52363ba7.md` Q1). The initial finished view shows one truthful outcome for this run, as X46's sheet now states it, and the primary next action that follows. The standard retry is reachable when recommended. Secondary figures and actions may scroll. Do not reorder or rewrite X46's outcome semantics to fit a layout.
- **VERIFIED** (the orchestrator, at this tree):
  - `showBar` (`ScoreScreen.ts`, near :3636) folds the chrome whenever `session.running`, which a paused run keeps;
  - `.score-bar[data-visible='false']` (`style.css`, near :3006) hides the bar in every orientation;
  - only the header's fold skips the tablet (`:not([data-tablet='true'])`, near :3022).

  So finding 5 (paused with no ▶) follows from the code on every device. Finding 8 (the count over the notes) was measured sideways only; on upright and tablet it is a **HYPOTHESIS** for your trace.
- **SETTLED, U124:** Back, ▶ and ⋯ are at least 40 px in both dimensions whenever they are shown, at 90 % text too. Widened by U122b: every control a learner-facing sentence names meets the same floor. U122b measured `Hear it` at 36 px tall at 90 %, and Hands R and L at 16–24 px wide at every size.
- **HYPOTHESIS, not yet looked at:** upright and tablet need the state rules but not c6's surfaces. U122a found no chrome candidate changes the upright or tablet music (`score-bar-layout.md` §8.0, the CL07 line). Upright, c6 and U122b were never measured (§9.7).

## What to build

**SETTLED, every device: the state rules.** Each moment shows what the table says it shows, on every device:

- a direct pause while counting in, holding for the first note and playing;
- a direct ▶ and the setup controls while paused or refused;
- the count-in off the notation;
- the finished view's outcome and next action, with no in-run chrome over it.

**OPEN:** how the state machine expresses this. The fold timer, the pause's direct control, and the count's place each lie in code you will read.

**SETTLED, phone sideways (568 × 320, 780 × 360): c6 per state,** with the three rules and the carried items above. U120 and U121 are its acceptance cases. Their standalone reproducer enters the normal suite green when this lands (`responses/759596b4.md`).

**OPEN, phone upright (342 × 740, 360 × 780) and tablet (1024 × 768, 1366 × 1024, both ways): the design.** For each, first trace what each moment shows today after the state rules, then decide on that device's own terms (R7). Keep today's surfaces where they meet every moment's need. Change a surface only where a moment's action is hidden, its notation covered, or the music moves on a transition. A rule tuned for the sideways phone is carried only with its own reason. The tablet uses the room it has; it does not inherit the phone's compromises. State each device's design in the design note before building it.

**Acceptance, by layer:**

- **Unit:** the state-to-chrome mapping, wherever it is pure.
- **Browser, per state, per cell:**
  - the moment's action is shown and hit at the tap floor;
  - nonessential chrome is hidden;
  - the music's top edge and stave size are unchanged across rest → count-in → playing → paused → refusal → finished, except where a device's design says why;
  - no chrome box crosses the ink the moment needs.

  Cells:
  - R7's eight, at 90, 100 and 115 % text, on both of U122's faces, with Hot Cross Buns and Moonlight III;
  - U110's 360 × 780 cell, acceptance only;
  - the finished state wherever the piece can finish.
- **Pictures:** every changed state on each device (`docs/prompts/pictures/u122c/`).

## Hypothesis and falsifier

**HYPOTHESIS:** one change to when the chrome folds and what stays (keyed on the task, not on a run existing) fixes findings 5 and 8 on every device. On top of it:

- c6's surfaces fit the sideways phone;
- upright and tablet need at most the count's and the finished view's placement, not a new decomposition.

**Falsifier:** an upright or tablet moment whose need the existing surfaces cannot meet even after the state rules. Or a sideways cell where c6 per state fails a check U122b passed, on the real build rather than the probe's injection. Either one is a finding: measure it and design that device's surface, or stop (below).

## Scope and ownership

**Expected ownership, a starting boundary:**

- `app/src/ui/screens/ScoreScreen.ts`, `app/src/style.css`;
- the summary sheet's module, `help.ts` (the away note only, itemised);
- the Score's unit and browser suites;
- `docs/04-ui-spec.md`'s Score section, `docs/08-test-map.md`;
- `docs/design/score-bar-layout.md` §10, the three designs and the results;
- `docs/prompts/runs/U122c/`.

If the truth lives elsewhere, follow it and say so.

**OUT OF SCOPE:**

- U110's row-overlap fix (landed; its cell is acceptance only);
- the Moonlight two-outcome freeze (U35 under CL07);
- the window rule, the bar count and U5's tablet look-ahead;
- X46's completion semantics;
- CL11's evidence rules;
- reopening the six-layout comparison or adding another probe lane.

## Do not solve it by

- adding a state enum, a status-to-top-line pipeline or a pause taxonomy, or parsing message strings to place them;
- overlaying the score's foot, washing the stage, or keeping a magic gap (the current `6vw`) as doctrine;
- moving the mode, Hands or tempo behind ⋯ at rest or paused (the selected mode must stay readable: U121);
- copying a phone rule to the tablet, or a sideways rule upright, without its own reason;
- making a test pass by measuring the stave lines instead of the ink (`working-rules.md`).

## Stop and hand back if

- the finished view cannot hold the outcome and its next action in the initial view at 568 × 320 / 115 % without changing X46's semantics: give the measurements and the options;
- a device's design needs a product trade, such as a control leaving the screen, the music shrinking toward the 22-px floor, or the look-ahead lost: state the trade and what a learner meets under each option, and land the rest only if it stands alone;
- another active seam owns the defect.

## Handoff

Lead with the judgement: what a learner now meets in each moment on each device, and what changed per device and why. Then:

- every acceptance cell's result, counted mechanically;
- the scope of every "all" or "none";
- where the brief was wrong: the brief said X, the evidence showed Y, so Z;
- learner-facing text itemised (where, before, after, why);
- unverified on a device, and nothing heard.

`operating-procedure.md` §14. Port **5453**, from a config copy under `app/build/u122c/`; `--workers=2`. Never name an AI model in any file.

## Record

lane: U122c · closes: U122, U120, U121, U124 · entry: 216
index: The Score screen shows each moment what it needs, designed for phone sideways, phone upright and tablet: the fold keyed on the task with a direct pause, the count-in off the notes, the finished view's outcome and next action, c6 sideways, upright and tablet on their own terms (`U122c-the-score-screen-per-moment-on-three-devices.md`) | build | drafted 2026-10-02 (`U122c-the-score-screen-per-moment-on-three-devices.md`); Entry 216
in-flight: drafted 2026-10-02 (`U122c-the-score-screen-per-moment-on-three-devices.md`): a build; the per-state table on every device, c6 sideways with U122b's rules, upright and tablet traced and designed on their own terms; walk findings 5 and 8, U120, U121, U124 as acceptance (Entry 216)
state: with-reviewer 2026-10-02: for pre-dispatch review (Entry 216)
