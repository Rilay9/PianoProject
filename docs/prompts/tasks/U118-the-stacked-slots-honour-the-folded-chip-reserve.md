# U118 — the stacked slots honour the folded chip's reserve

**With the reviewer before dispatch, one question** (`docs/review/second-reads/cc45b3a8.md` item 1). The folded reserve is a fixed 22 px: nothing sets `--score-corner-h`, and the renderer copies it as `FOLDED_SHEET_SHIFT_PX = 22`. U105c measured the chip at about 22–25 px tall with one line and 38–42 px with two, and the chip takes two lines with the ordinary paused line, the demonstration line and *Hear it*'s refusal on the wider face. So honouring the existing 22 px reserve leaves a two-line chip over the first system by about 9–16 px, which fails the response's own second check (first-system ink does not intersect the chip). Which reserve: (a) the existing 22 px; (b) room for the tallest chip text, kept from the run's start, which may reach the slot-count trade the response says to stop at; or (c) the chip's measured height, which under a frozen run comes to the same as (b)? And does `tests/states/gallery.ts`'s exclusion of the chip from its overlap audit stay? The figures are U105c's measurements on this machine's two faces, stated as relationships. The fast-path wording below stands for everything except this question.

**A fast-path lane** (`operating-procedure.md` §11, the orchestrator's entailed-decision rule,
`responses/questions-b96a36c8.md`; the ruling that entails it is the reviewer's own,
`docs/review/responses/842ea210.md`, answering U105c's Question 1). No product choice is open on
*whether* to fix this, *where* it is owned, or *what the fix must show* — all three are the
reviewer's explicit direction, quoted in full below. What is open, and left to the builder's own
engineering judgement with a named stop condition, is the exact mechanism, and whether honouring
the reserve costs a measured trade the reviewer asked to be stopped at rather than silently
absorbed.

> ## Folded corner chip
>
> **This does not belong under U105. Put it under the existing fold-and-chip / `08` §5.3 layout
> ownership.**
>
> The evidence makes the ownership unambiguous: the overlap exists with an ordinary paused status
> and even with a one-line chip, without any refusal. U105 merely exposed it. The fault is that
> the folded layout already has a `--score-corner-h` reserve for the corner chip, but the
> stacked/read-ahead slots overwrite their own `top` to `0`, so the reserve never reaches the
> first system.
>
> **Direction: make the stacked slot layout honor the folded chip reserve.** Do not solve this by
> shortening the chip to `bar n / m`; even the one-line chip is already shown to cover
> fingerings, so removing status text does not repair the geometric fault. Do not introduce a new
> permanent status surface merely to work around a reserve that already exists in the layout
> contract.
>
> The discriminating fix should show, on the folded phone layouts that reproduce the fault:
>
> - the cursor/first visible system begins below the chip's actual reserved height;
> - first-system clef, fingering and other top-of-staff ink do not intersect the chip;
> - the existing frozen run scale remains frozen rather than shrinking when the chrome folds;
> - stacked read-ahead keeps its slot ordering and useful next-system visibility;
> - tablet and unfolded layouts remain unchanged.
>
> If honoring the existing reserve in stacked mode reduces usable music height enough to force a
> new slot-count/readability trade, stop at that measured product choice rather than silently
> changing the chooser.

**A citation correction, found while drafting (say so rather than carry it forward silently).**
The response cites "`08` §5.3" as the fold-and-chip's owning section. At this HEAD, body section
`### 5.3` of `docs/08-score-render-states.md` is "The next beat" (the count-in and the beat dot,
`:605–620`) — unrelated. The content the response means — the folded chrome's box and the
`bar n / m` chip's reserve — is written under `### 4.1 In the piece — the arrangement`, in both
the `SLOTS` (`:333–480`) and `CHUNK` (`:481–531`) subsections, specifically the `CHUNK` bullet "A
run is fitted for the folded chrome's box (T38)" (`:506–511`). `SLOTS` has **no** equivalent
bullet — read in full, it says nothing about the fold or the chip at all, which matches the code
fault this brief fixes: the doc is silent on the exact thing the code gets wrong, not merely out
of date about it. Doc rows below cite `§4.1`, not `§5.3`; flag the discrepancy to the reviewer in
the report rather than resolve it unilaterally.

## Read first

- `docs/review/responses/842ea210.md` — the direction, quoted in full above.
- `docs/prompts/entry-193.md` — "Premises found wrong," item 3 (the chip's framing, corrected),
  and Question 1 (the three possible directions named there; this brief builds the first).
- `docs/prompts/runs/U105c/probe-chip.txt` and `probe-chip-reserve.json` — the runtime read: in
  `slots` read-ahead, the three visible (`is-front`) buffers carry inline `top` of `0px`, `169px`
  and `339px`; the two buffers not currently on screen carry no inline `top` and read the CSS
  default, `22px`, confirming the reserve exists for an unused buffer and not for a drawn one.
- `docs/prompts/pictures/u105c/paused-hear-342x740-wider-face-folded-after.png` and the sibling
  `-no-refusal-` pictures — what the overlap looks like: the corner chip's text sits where the
  first system's fingering numbers would otherwise print (compare the second system's own
  fingerings, which print above it unobstructed; the first system's are not visible in these
  pictures because the chip occupies that band).
- `docs/08-score-render-states.md:333–480` (`SLOTS`) and `:481–531` (`CHUNK`, the `sheetShift`
  bullet at `:506–511`) — read together, since the fix brings `SLOTS` to parity with what
  `CHUNK` already does, not a new invention.
- `app/src/style.css:2367–2376` (the folded-chrome rules: `.score-buffer`'s `top` reserve and the
  corner chip's own display rule).
- `app/src/score/WindowRenderer.ts:2097–2102` (`sheetShift`), `:2945–2946` (`perSlot`, already
  calling `sheetShift()` inside the `slots`-mode pricing pass), `:3381–3415` (`packSlots`, the
  unconditional inline `top` write), `:4946–4952` (`FOLDED_SHEET_SHIFT_PX` and its comment),
  `:1742–1775` (`chooseWindowShape`, "the chooser" the stop condition protects), `:3709` and
  `:4102` (`readAhead !== 'slots'` guards nearby, for context only).
- `app/src/ui/screens/ScoreScreen.ts:3407–3421` (`foldChrome`: toggles `dataset.chrome` and
  `bar.inert`, calls only `measureBar` — it does not call into `WindowRenderer` at all).
- `app/src/score/autoFit.ts:95–116` (`refitEngraving`'s own doc comment: "During a run the answer
  is no: the run is holding its size and re-engraving cannot improve on a size that is not
  allowed to change" — the existing guarantee the third discriminating check leans on).
- `docs/prompts/backlog-2026-09-25.md` — the `U106` row (the same symptom, recorded once before
  under a different, then-undiagnosed cause) and the `U117` row (the last id, confirming `U118`
  is next free).
- `operating-procedure.md` §11 (this fast path), §13 (what a brief carries), §14 (the harness).

## Premises at the lines (HEAD `41a5c9e8a1d9acd396f8ac4ae13c163e17199854`, as read while
drafting; the dispatch message states the sha a worktree is actually cut from)

1. **Read.** This HEAD is a descendant of U105c's merge (`f42973ee`), and nothing on the path
   between touches `app/src/style.css` or `app/src/score/WindowRenderer.ts`
   (`git log --oneline f42973ee..HEAD -- <those paths>` is empty). Entry 193's own reading of
   these files, reused below, is still accurate here.
2. **Read.** The CSS reserve is general, not scoped to one layout:
   `.screen--score[data-chrome='folded']:not([data-tablet='true']) .score-buffer { top: var(--score-corner-h, 22px); }`
   (`style.css:2372–2373`) targets every `.score-buffer`, the class both the single sliding sheet
   and every stacked slot share. The corner chip itself,
   `.screen--score[data-chrome='folded']:not([data-tablet='true']) .score-stage__corner`
   (`:2376`), is unclamped and always drawn at the stage's top-left corner regardless of mode.
3. **Read.** In `single` (`CHUNK`) mode, `packSlots` (`WindowRenderer.ts:3386–3391`) *clears* the
   inline `top` on every buffer (`buffer.wrapper.style.top = ''`) when `readAhead !== 'slots'`, so
   the CSS rule above is free to apply through the cascade, unopposed. In `slots` mode, the same
   function (`:3399–3414`) *always* writes an absolute pixel `top` on every buffer it stacks,
   including `0px` on the first (reading-order) slot — an inline style, which wins over the CSS
   rule's `top` by specificity regardless of fold state. This is the fault's exact location: not
   a missing rule, an inline value that always overrides the rule that already exists.
4. **Read, confirmed at runtime.** `probe-chip-reserve.json` (a Wait run, frozen, paused, folded,
   342 × 740, this machine's own face): the three `is-front` buffers read `inlineTop`/
   `computedTop` of `0px`, `169px` and `339px`; the two buffers not currently drawn (no
   `is-front` class) read `inlineTop: ''`, `computedTop: '22px'` — the CSS default, reached only
   because `packSlots` never touches a slot it does not currently place. The reserve is real and
   wired, and only a drawn stacked slot is denied it.
5. **Read.** The fit that decides each slot's share of height already has a hook for exactly this
   subtraction: `perSlot = (available.height - this.sheetShift() - SLOT_GAP_PX * (rows - 1)) / rows`
   (`:2946`), reached for `slots` mode too (`rows` at `:2945` is `this.systemsPerWindow` when
   `readAhead === 'slots'`). But `sheetShift()` itself (`:2097–2102`) returns `0` whenever
   `this.readAhead !== 'single'` — the very first line of the method. So the call at `:2946`
   already executes in `slots` mode and already intends to reserve room; it is handed a function
   that refuses to answer for this mode. This is the second half of the fault: even if `packSlots`
   stacked from a non-zero base, the *scale* chosen for each row would not yet have shrunk to
   leave room for it, which is a second, independent way the reserve could still be missed
   (a correctly offset top with a scale sized as if the offset were zero still pushes the last
   row's music past the stage's bottom — the same class of bug `:2084–2087`'s own comment records
   happening once already, 18 px past the bottom, for the single-sheet case before `sheetShift`
   existed).
6. **Read.** `sheetShift()`'s existing single-mode answer is keyed on `this.running`, not on
   `data-chrome==='folded'` having actually happened yet (`:2101`: `return this.running &&
   not-tablet ? FOLDED_SHEET_SHIFT_PX : 0`). Its own comment explains why: "A run is fitted for
   the folded box from its start... the chrome folds a few seconds after that — moving the sheet
   down without changing the stage's box, so nothing refits. So while a run is on, on a phone, the
   chip's height is kept from the start: one size for the whole run, with the room the fold will
   take already given" (`:2090–2096`). Any slots-mode equivalent has to be keyed the same way —
   on being a run on a phone, not on the fold event — or it would force a re-fit exactly when the
   chrome folds, which is what the third discriminating check forbids.
7. **Read.** `foldChrome` (`ScoreScreen.ts:3407–3421`) only toggles `bar.dataset.visible`,
   `section.dataset.chrome` and `bar.inert`, and calls `requestAnimationFrame(measureBar)` —
   `measureBar` measures the control bar (U105c's own premise 9, reused), not the stage. Folding
   the chrome does not, by itself, call into `WindowRenderer` at all. So nothing today re-fits or
   re-packs the slots when the fold happens; whatever `packSlots` last wrote stands unchanged
   through the fold. A fix that *reacted* to `data-chrome` turning `'folded'` (re-running
   `packSlots` or the fit at that moment) would be a new mechanism this code does not have today,
   and would risk being exactly the re-fit-on-fold the third check rules out; the existing
   single-mode technique (premise 6) avoids this by deciding the room at the run's start instead.
8. **Read.** The slot/system count itself is decided once, before or at the freeze, by
   `chooseWindowShape` (`:1742–1775`): once `this.frozen` is true, or a pending freeze has moved
   past the first step, the method returns the *already-chosen* `slots`/`systems`/`shown` numbers
   unconditionally (`:1756–1762`) — it does not re-price. Before that point, it calls
   `priceWindowShape` (`:1764–1768`), which is where a stage-height input would actually decide
   how many systems fit. "The chooser" the stop condition protects is this pricing pass; it is
   read as a pass that happens once, pre-freeze, on the stage's measured height.
9. **Read.** `refitEngraving` (`app/src/score/autoFit.ts:106–116`) already encodes the guarantee
   the third discriminating check needs in general: height-only changes during a run do not
   trigger a re-fit (`!frozen` gates it, and a height-only, same-width change returns `false`
   outright when `fitted` exists and the rounded heights already match). Its own comment names
   the fold explicitly as an example of a height-only change a run must not react to: "the control
   bar folded away... During a run the answer is no." This is an existing, general mechanism, not
   something this brief has to build; the fix only has to avoid feeding it a height change it did
   not already expect (by deciding the reserve before the freeze, per premise 6, not after).
10. **Read.** `U106` (`docs/prompts/backlog-2026-09-25.md`) already recorded the same visual
    symptom — "the folded corner line... overlaps the top staff's fingering numbers at
    342 × 740" — from G86a's pictures, before this mechanism was read at the lines, and proposed
    "the corner line's row below the fingering" as its own fix direction, filed P3 and parked
    "with the next Score-screen chrome lane." This is that lane for the fingering-overlap half of
    U106; U106's other half (count-in digits left on screen during a pause) is a different,
    untouched mechanism and is not closed by this brief.

**Not verified at a line (say so before building on it):** whether a non-zero `sheetShift()`-style
subtraction for `slots` mode, fed into the pre-freeze pricing pass (premise 8), ever actually
changes which slot/system count `priceWindowShape` would choose for a real piece at a real stage
size — that is exactly the stop condition's own question, and it is the discriminating test's job
to show, not this brief's; and whether `packSlots`'s stacking order (premise 3's `order` array,
sorted by first bar) needs the reserve added once to the running `top` accumulator or to every
slot's base independently — read only as "it always writes an absolute pixel value," not re-read
for which specific line inside the loop the fix touches.

## Hypothesis and its refuting test

**Hypothesis.** Because `slots`-mode positions are renderer-computed pixel values written inline
(premise 3), not CSS-cascade values the way `single` mode's are, a CSS-only fix (a margin or
padding on a slot container) cannot reach this fault on its own: whatever CSS says, `packSlots`
will keep overwriting each slot's `top` with a number computed as if the reserve were zero. The
fix has two parts, mirroring `single` mode's own two-part mechanism (premises 5–6) rather than
inventing a new one:

1. `sheetShift()` (or a parallel read used at the same call site, `:2946`) answers with the
   reserve for `slots` mode too, keyed on `this.running` and not-tablet exactly as `single` mode
   already is — so the pre-freeze pricing pass (premise 8) sees the smaller available height
   *before* the shape and scale are chosen and frozen, not after.
2. `packSlots` adds that same reserve to the stacking origin — not only the first (reading-order)
   slot, since premise 4 shows only the *currently drawn* slots get an inline value at all, and a
   crossing can rotate which physical buffer is "first" — so whichever buffer is placed first in
   reading order begins below the chip's reserved height, and every slot after it is offset by
   the same amount it already stacks from.

**Refuting test, run before any edit (red first).** On the folded phone layouts U105c's own
pictures reproduce (a Wait run on Hot Cross Buns, frozen, paused, chrome folded, 342 × 740, this
machine's own face — no wider-face stand-in needed, since premise 4 shows the fault exists on the
app's own face already), read the first visible system's top (the SVG's or its wrapper's
`getBoundingClientRect().top`, relative to the stage) against the corner chip's own measured
height, and whether the chip's bounding box intersects the first system's clef/fingering ink
(the same `elementFromPoint` technique `score.screen.spec.ts:1487–1493` already uses, pointed at
the chip's text and the first system's glyphs instead). If the system begins at or above the
chip's own bottom edge, the hypothesis holds and the two-part fix above is confirmed as the
mechanism; if adding the reserve to `packSlots` alone (without touching `sheetShift`/the pricing
pass) already clears the overlap with no re-fit and no scale change, part 2 is sufficient and
part 1 is not needed — say so, since a scale-accounting fix that turns out to be unnecessary
should not be added for symmetry alone. If honouring the reserve forces `priceWindowShape` to
choose a different (smaller) slot/system count than it chooses today for some already-measured
case, or forces a visible rescale the moment the chrome folds, the hypothesis's "no product
trade" assumption is refuted — stop there, per the stop condition below, and report the measured
trade rather than resolving it.

## What is decided

- The reviewer's rule, verbatim: "make the stacked slot layout honor the folded chip reserve."
  Not: shorten the chip's text (ruled out explicitly — "even the one-line chip is already shown
  to cover fingerings, so removing status text does not repair the geometric fault"); not: a new
  permanent status surface (ruled out explicitly, "merely to work around a reserve that already
  exists in the layout contract").
- The five discriminating checks are acceptance cases, by layer, all browser (on the folded phone
  layouts U105c's pictures reproduce):
  1. the first visible system begins below the chip's reserved height;
  2. first-system clef, fingerings and top-of-staff ink do not intersect the chip;
  3. the frozen run scale stays frozen when the chrome folds (no rescale at the fold moment);
  4. stacked read-ahead keeps its slot order and useful next-system visibility;
  5. tablet and unfolded layouts are unchanged.
- **The stop condition, in the reviewer's own words, restated as the builder's own line — not
  this brief's, and not the orchestrator's:** *if honouring the existing reserve in stacked mode
  reduces usable music height enough to force a new slot-count/readability trade, I stop at that
  measured product choice rather than silently changing the chooser.* The builder states this
  line itself in the report, true or not reached, rather than paraphrasing it away.
- **Not the builder's to decide (say so and stop, do not choose):** the chooser's own hard
  ordering (no distortion → frozen run → look-ahead → requested count, T32/U113); the chip's text
  or wording; U105's refusal rules (this is a different surface's different cause, per the
  reviewer's own ownership ruling above — a refusal is not involved in reproducing this fault at
  all, premise 4 and the pictures both show it with an *ordinary* paused line).
- The citation correction (the response's "`08` §5.3" naming what this HEAD has at `§4.1`) is
  reported to the reviewer, not corrected in the doc unilaterally by this brief — a correction to
  someone else's citation is their call to confirm, the same posture the project takes toward any
  found-wrong premise in a reviewer's own words.

**Learner-facing change, for itemisation:** on a folded phone, a few seconds into a paused or
playing run, the first system of music now starts low enough that the `bar n / m` status chip no
longer sits on top of its clef and fingering numbers; nothing else about what is drawn, its size,
or its order changes, unless the discriminating test finds the stop condition applies, in which
case nothing in this lane changes and the trade is reported instead. This needs no ear.

## Verification layers

1. The five discriminating checks above, each a discrete assertion, on the folded phone layouts
   U105c's pictures reproduce (Hot Cross Buns, 342 × 740, a Wait run frozen and paused, chrome
   folded) — red first on the committed code (the overlap and the zero-top read, from
   `probe-chip-reserve.json`'s own numbers, reproduced as an assertion rather than a one-off
   probe), green after the fix.
2. The same five checks repeated with an *ordinary* paused line (no refusal at all) — proof the
   fix is about the fold and the chip, not about `data-sound-refused`, matching the reviewer's own
   ownership ruling ("the overlap exists with an ordinary paused status... without any refusal").
3. Tablet and unfolded (chrome open) layouts read unchanged — the fifth check, as its own
   assertion, not inferred from the other four passing.
4. A piece that uses more than one visible stacked slot (so the fix is checked against a real
   crossing, not only the first slot ever drawn) — read-ahead order and next-system visibility
   unchanged from today's committed behaviour, per the fourth check.
5. The frozen run's engraving zoom and cursor-slot transform read identical immediately before
   and immediately after the chrome's fold timer fires — the third check, measured the way
   `score.head-height.spec.ts`'s own cursor-scale read already does for the single-sheet case,
   applied here to confirm `refitEngraving` (premise 9) is in fact not triggered by this change.
6. Mutants: the reserve applied to no slot (today's committed behaviour, confirms the new
   assertions are not vacuously true); the reserve applied unfolded too (should redden the
   "unfolded unchanged" check); the run's scale re-fitted on fold rather than decided before it
   (should redden the frozen-scale check). Each should kill only the check it targets.
7. If the stop condition is reached instead: the measurement that shows the trade (the slot/system
   count or readability measure before and after honouring the reserve, at the stage size where
   it changes), reported rather than built around.

## Rules and files

**Owned.** `app/src/score/WindowRenderer.ts` (`sheetShift` or its slots-mode equivalent,
`packSlots`'s stacking origin — exact lines per the hypothesis, confirmed or revised by the
discriminating test); `app/tests/e2e/` — the new discriminating cases, placed in whichever
existing spec already drives the folded/stacked layout (`score.readahead.spec.ts` or
`score.layout.spec.ts`, read first to judge which; a new file only if neither fits without
distorting its own existing scope).

**Not owned, unless a premise above is found wrong at the line (say so and take the better
path).** `chooseWindowShape`'s own hard ordering and `priceWindowShape`'s pricing rules
(`:1742–2096`), beyond reading what they already do — the chooser is explicitly not this lane's
to change; `app/src/style.css`'s existing fold/reserve rules (`:2372–2376`), read only, since
premise 3 shows the CSS is already correct and the fault is the inline override; the corner
chip's own text or markup (`syncBarLeft`, `ScoreScreen.ts:1181–1193`); anything under U105
(`data-sound-refused`, the refusal exceptions on the header or the bar, U105d); `foldChrome`
itself (`:3407–3421`), read only, since premise 7 shows it need not change for this fix to work.

Adjacent problems recorded, never fixed on the spot.

## Report

**Judgement first:** what the folded, stacked layout looks like before and after, on Hot Cross
Buns at 342 × 740, the way a learner meets it, with and without a refusal showing — *unverified
on a device* stated up front; this is a layout fix only (or a reported trade, if the stop
condition is reached), so the pedagogical verdict is *not applicable*.

**The builder's own line on the stop condition** (quoted above) is stated in the report whether
or not it was reached — reached, with the measurement; or not reached, said so, not merely
omitted.

**The citation correction** (the response's "`08` §5.3" vs. this HEAD's `§4.1`) is carried into
the report as a question for the reviewer, not resolved here.

**Then** Done / Not done / Follow-ups / Questions / Files. Per fix: the mechanism, the
discriminating test, the before-and-after measured the same way, and the red line that proves the
test. The tests table with each test's class (replace, preserve, add) and the old assumption.
Exit codes. What is unverified sits beside what passes, not at the end. §12's itemisation list:
the one learner-facing change named above (or, if the stop condition is reached, say the list is
empty because nothing shipped). `operating-procedure.md` §11 and §12 apply in full.

**Doc rows, proposed not applied** (the consumers of this fix): `docs/08-score-render-states.md`'s
`SLOTS` subsection (`:333–480`) gains the same kind of bullet `CHUNK` already has at `:506–511`
("A run is fitted for the folded chrome's box"), stating what `SLOTS` now does; and
`docs/08-test-map.md`'s row for wherever the new discriminating cases land (per Rules and files,
`score.readahead.spec.ts` or `score.layout.spec.ts`). State the proposed text in the report; the
orchestrator applies it at landing, as with U105b/c, and reconciles `U106`'s own backlog row
against this lane's `closes:` field at the same time.

**Entry 198.** Every run file goes under `docs/prompts/runs/U118/`, entry at
`docs/prompts/runs/U118/ENTRY.md`, starting `### Entry 198 — U118`.

## Harness

As `operating-procedure.md` §14: the builder's own worktree, cut from origin's head at dispatch
(the dispatch message states the sha then, not this brief). Browser tests run on this lane's own
port, **5313**, from a config copy under the worktree's `app/build/u118/` — never port 4173, and
never another lane's port. Everything else in §14 applies as written; nothing in this lane needs
a rule beyond it.

## Record

lane: U118 · closes: — · entry: 198
index: the reviewer's direction on U105c's Question 1 (`responses/842ea210.md`): the stacked read-ahead slots honour the folded chip's height reserve the single sliding sheet already gets (`sheetShift`), so a folded phone's `bar n / m` chip no longer paints over the first system's clef and fingerings, the frozen scale, slot order and tablet/unfolded layouts kept, with a named stop condition at a slot-count trade; the fingering-overlap half of U106 | app | drafted 2026-10-01 (`U118-the-stacked-slots-honour-the-folded-chip-reserve.md`); Entry 198
in-flight: drafted 2026-10-01 (`U118-the-stacked-slots-honour-the-folded-chip-reserve.md`): the folded chip's reserve reaches the stacked layout; with the reviewer before dispatch on the reserve height (a fixed 22 px against a chip of up to two lines) (Entry 198)
state: with-reviewer 2026-10-01: with the reviewer before dispatch, the reserve height (Entry 198)
- approved 2026-10-01: APPROVE FOR DISPATCH with option (b) — reserve room for the tallest allowed folded-chip state (the measured legitimate states show two lines, not the old one-line 22 px constant), from the chip's own line-height/padding contract, before the run's window shape/scale freezes; keep that reserve for the whole frozen run, whether the current chip happens to be one or two lines; stack the first slot below that reserved band and include the same reserve in the pre-freeze slot pricing; never re-fit, re-price or change the slot count when the chip's actual text changes later; the existing stop condition stays — if the two-line pre-reserve changes `priceWindowShape`'s chosen slot/system count for a real measured phone case, stop and return that table before changing the chooser; the gallery's blanket chip exclusion should not stay — once U118 gives the chip owned space, include chip-vs-score-ink/fingering/clef overlap on folded phone states, never flag the chip's own box living inside the stage container, keep tablet and unfolded states excluded; the `08` citation corrected to §4.1 (`SLOTS`, beside the existing `CHUNK` bullet), not §5.3 (`responses/questions-91f683ff.md`)
- dispatched 2026-10-01: dispatched at a969987a with the reviewer's option (b) (`responses/questions-91f683ff.md`), building (Entry 198)
- held 2026-10-01: stopped at its stop condition — the two-line reserve priced before the freeze changes the window shape in 6 of 112 phone cells (three one-bar windows lose their greyed next system; at 115 % text the five-finger exercise drops a system) and the drawn size in 28; nothing in the app changed; the brief's premise that the fold frees no height is wrong upright (folding hides the header row, taller than the reserve on every measured shape), so placement alone clears the chip with no trade except a size re-taken while folded; the option is with the reviewer (Entry 198)
- approved 2026-10-01: APPROVE FOR DISPATCH with option (iii) — placement always: when folded chrome is drawn, stacked slots are placed below the chip's reserved band, and the first visible slot may never start inside that band; do not re-price or re-fit merely because the chrome folds during an already-frozen run, the room the disappearing header releases making placement-only safe on the ordinary path; only when the renderer genuinely takes a new size while the chip is already drawn (a width/orientation re-size that reconstructs/re-prices the frozen presentation) does that sizing pass include the chip reserve in its available height; a status-text change by itself never re-prices the run; the reserve is the maximum allowed chip height at that geometry over every legitimate chip state, not a universal two-line constant, stable across status changes for that fitted geometry until a genuine size/geometry pass occurs; discriminating cases cover both paths (ordinary start → fold with shape/scale unchanged; size taken while already folded → bottom system still inside the usable stage/keyboard boundary); the gallery's blanket chip exclusion still narrows to chip-vs-score-ink/fingering/clef overlap on folded phone states once the chip owns space (`responses/questions-e9aa51ae.md`)
- dispatched 2026-10-01: resumed to build option (iii) (`responses/questions-e9aa51ae.md`) (Entry 198)
