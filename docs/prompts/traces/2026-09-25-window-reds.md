# The window reds, classified before anyone fixes them (T35, 2026-09-25)

Read-only. Nothing under `app/src/`, `content/` or `tools/` was changed. What was run: the
nine specs the brief names, the 16-cell T34 sheet (every PNG opened), and a temporary probe
spec (deleted) that read `data-window-*`, `data-fit`, `debugFit()` and the drawn rows at each
state. Every number below was measured on this machine, once, and is given as an observation
or a relationship between two measurements of the same screen, not as a threshold.

## Judgement

- **R1 (`score.layout`, 1 and 2 bars asked ink the same three bars at 880 × 412):
  incorrect or outdated spec.** Sideways the count yields by design (`04` §5) and the row
  says so; no count can change what that stage shows. The renderer's *sentence* at that cell
  is wrong, a separate and smaller fault.
- **R2 (`score.screen`, Size + draws a smaller staff): implementation bug.** Size's 100 % is
  priced from a prediction that sits below the scale actually drawn, so 110 % draws fewer
  bars *and* smaller notes. `08` §9 invariant 3 (zoom is monotonic) and the owner's rule 6
  are broken.
- **R3 (`score.rotate`, un-run since T34): red, 7 of 10, and not because of `data-fit=size`.**
  Mostly an outdated spec (two pre-T34 assumptions), with one real renderer fault underneath
  it that the spec catches under a stale rule: a greyed look-ahead row wider than the window
  sets the window's scale.

**The baseline is not sound to build on for the score window.** R2 and the price behind R1's
yield come from one mechanism (the `naturalBar` ratchet, below), which also draws a tablet
sideways four-bar window at rest a third as wide as the stage allows. Two more renderer
faults turned up on the way: the look-ahead row is priced into the window's width, and a
look-ahead slot was wrapped onto two systems and justified. And the unit every "staff" check
reads is not the five lines. `score.window-rule` is green over all of it.

## The one mechanism under R2 and most of R1

`chooseWindowShape` prices a bar at `naturalBar.width`: the running maximum, per engraving
zoom, of *(a drawn row's ink width ÷ the bars in that row)* (`fitSlots`, the loop after
`drawnRowPx`). Two properties make it wrong:

1. **It carries the system's opening.** A row's ink includes its clef, key and time
   signature. Divided over one bar that opening is all charged to that bar, so a one-bar row
   reports the widest "natural bar" of all.
2. **It only goes up, and it is fed by sheets that are not on the glass.** It is released
   only by a change of engraving zoom. At the default viewport the first value was exactly
   half the ink width of a slot that had since been blanked (ink 655 wide, where the two bars
   on the glass measured 554); why that sheet was wider was not traced.

So any visit to a one-bar window (every test helper steps down to 1 and back up; so does a
learner who tries 1) inflates the price of every later window at that zoom, and the price is
never corrected by what is then drawn. `scaleFor`, meanwhile, sizes the window from the ink
actually drawn. **The chooser and the fit disagree, and the chooser is the one that is
wrong.**

The cleanest natural experiment is on the sheet's tablet sideways, Twinkle, 4 bars
(replayed by the probe): at rest, after the stepper passed through 1 bar, `naturalBar` rose
by 38 % (the one-bar row with its opening), the four bars were priced as four of those, and
the chooser split them into **two rows filling about a third of the width each**. Pressing
Play changed the engraving zoom, which reset `naturalBar`; the same window was then re-chosen
as **one row filling 88 % of the width**. Same bars, same stage shape; the only difference
was the ratchet.

## R1 — `score.layout`: "the window really holds more bars as the setting goes up"

**Red line** (this run): `1 bar drew 3, 2 bars drew 3` — the count of `.vf-measure` in the
front sheet.

**Observed** (Twinkle RH, 880 × 412, stage 880 × 304, probe read after each setting, both
the spec's way and after the measurement had landed):

- `data-window-bars` is **1 for asked 1, 2, 3 and 4**; `data-window-asked` follows the
  stepper. The `⋯` row says *"N asked, 1 shown: N would be too small here"* for 2, 3, 4.
- The drawn scale is identical at every asked count, `data-fit="height"`; the engraved chunk
  is bars 1–3 at every count (window of 1 + two bars ahead), page far wider than the stage.
- On the glass at every count: bars 1 and 2 wholly inside the stage, bar 3's first notes
  inside, the rest off the right edge.
- No `is-ahead` anywhere: `updateSlotClasses` greys only in the slot arrangement.
- On a **fresh page, measured, never stepped**, the same stage says `data-window-bars=2`,
  engraves bars 1–4 and the row is silent. One stepper press later it says 1 shown and the
  sentence appears. The glass is the same in both.

**Mechanism.** Sideways, `chooseWindowShape` computes the bars that reach across the stage
at the height's scale, `room = (width − margin) / (naturalBar × scale)`, and keeps a whole bar
of room for the next one: `fits = floor(room − 1)`. Here `room` came out at 2.34 bars, so
`fits` is 1 and every asked count yields to 1. `windowFor` strides by the shown count, so
the chunk is identical and the spec counts the same three measures. The sideways *scale*
never depends on the count (`scaleFor` sideways uses the height and `readAheadScale` only),
so no count can change what this stage shows.

**The brief's hypotheses.** (a) is refuted: the attribute does *not* differ while the ink
stays the same, and there is no greying sideways. (b) holds: the count yields. (c) is refuted
for Twinkle: the height term binds (the read-ahead term allowed a scale 1.7 times larger).
On Hot Cross Buns at the same viewport the read-ahead term does bind, and `room` came out at
1.8. When that term binds, the widest bar takes most of the stage's width at that scale by
definition, so sideways the count can rarely be above 1 there. (d), found: the yield is priced by rules
the rest of the renderer does not use. It reserves a *whole bar* for the next one where
`08` §4.1 CHUNK and `NEXT_NOTE_PEEK_STAVES` promise its *first note*. It also prices bars at the
ratcheted `naturalBar`, which sat a third above the engraver's own widest bar here. Priced by
the first-note rule, two bars fit, and that is what the glass shows.

**Why the verdict is "outdated spec", not "renderer bug".** Priced correctly, asked 2 would
show 2 and the first assertion would pass. But asked 4 would still show 2 (2.3 bars reach
across at the height's scale), and `four > two` would still be red. The stale sentence is the
test's premise: *"a window that draws one bar when it says four. Counted rather than looked
at."* Since T32 the count yields sideways with the row saying so (`04` §5: "the count is
honoured up to as many as reach across the stage at the size the height gives"), and T34
kept that. The catastrophe it guards, a silent different number, is now guarded by the
sentence and by `score.window-rule` (d). **It should assert:** per setting, `data-window-bars`
rises with the asked count, **or** the row says *"N asked, M shown"* with M equal to
`data-window-bars`. It should also check that the glass carries the shown bars and the next
bar's first note (the spec's own `expectNextBarOnGlass` already does the second, and passes).

**Faults the red does not measure but the probe showed** (P2: the screen says something
untrue, and the notation is right):
- *"2 would be too small here"* is false twice. Nothing would be drawn smaller (the scale is
  the same at every count), and two bars with the next bar's opening are on the glass.
  Sideways the honest sentence is "about 2 fit across at this size".
- The sideways shape is chosen before the probe's measurement lands (the unmeasured branch
  returns the asked count) and is not re-chosen when it lands (`fitSlots` re-shapes only the
  slot arrangement). So the row's sentence depends on history: silent at open, present after
  any stepper press, and flipping at Play. The sheet shows the Nocturne sideways as *"2 asked,
  1 shown"* and *"4 asked, 4 shown"* on the same stage, with the same picture.

**What would refute the verdict:** a sideways count that changes the glass at this viewport
without shrinking below the height's scale (not possible while `scaleFor` ignores the count
sideways and the chunk runs past the right edge), or a yield with a silent row. The row was
silent only on the never-stepped page, where the renderer had not yielded.

## R2 — `score.screen`: Size + drew a smaller staff

**Red line** (this run): the staff read `269.99` before and `250.60` after one press of `+`,
at the default 1280 × 720 viewport (stage 1040 × 511, capped), on Hot Cross Buns, 2 bars.

**Observed** (probe, run twice, the second time alone: identical numbers):

| Size | shown | `data-fit` | drawn scale, relative to 100 % | row |
| --- | --- | --- | --- | --- |
| 100 % | 2 of 2, one row | width | 1 | — |
| 110 % | 1 of 2 | size | **0.930** | *at 110 % only 1 of 2 fit here* |
| 120 % | 1 of 2 | size | **0.923** | *at 120 % only 1 of 2 fit here* |
| back to 110 % | 1 of 2 | size | **0.846** | same |
| back to 100 % | 2 of 2 | width | 1 | — |

The engraving zoom never moved, so the CSS scale is the drawn size. The spec's own reading
fell by 0.928, the scale by 0.930: **the test measured the scale faithfully**, so this is not a
test bug. Its "staff" is the staff-line group's box, not the five lines (see D below), but the
same bar dominated it before and after.

**Mechanism.** Over 100 % the target is `sizeTargetAbs = u × base × zoom`, and `base` is the
chooser's **prediction** of the asked window's fit, `(width − margin) / (2 × naturalBar)`,
not the scale `scaleFor` drew. At 100 % the fit came from the two bars' real ink. The
prediction priced them at the ratcheted `naturalBar`, first from the blanked slot's 655-wide
sheet and then, once the one-bar window had been drawn, from bar 1 with its opening. It sat
**15 % and then 23 % below the drawn fit**. So `u × base` was below the 100 % scale for u =
1.1 and 1.2. The chooser compares the asked shape's prediction with u × itself, so two bars
always "fail" over 100 %. The count yields a bar that buys nothing, and `scaleFor` draws the
one-bar window at `u × base`: fewer bars and a smaller staff. `sizeTargetAbs` is also
recomputed on `fitSlots`' closing chooser pass, after the one-bar row has raised
`naturalBar`, so the same setting draws two sizes (110 % first time, 110 % on the way back).

**Evidence.** `sizeTargetAbs ÷ zoom` equals `u × 1028 / (2 × naturalBar)` to four digits at
all three over-100 % states, with `naturalBar` as `debugFit` reported it just before each
press, and the drawn scale equals it. The hypotheses in the brief: the count does yield,
but the smaller scale is not a row split's (one row both before and after).
`FROZEN_HEIGHT_HOLD` is not involved (no run, `frozen` null). The look-ahead row's pricing
(`drawnRowPx`) is not involved (no look-ahead row at this stage).

**Alternative still open:** none that fits the numbers. At 390 × 844 the same press made the
staff *grow*: one bar a row, width-bound, and there the prediction and the drawn scale were
both set by the same widest row, so `u × base` sat above the 100 % scale. At 880 × 412 it
left the scale unchanged and yielded a bar (read-ahead-bound).
So the fault shows wherever the prediction undershoots the drawn fit, which the ratchet makes
likely after any one-bar visit.

**Smallest fix** (not made): price Size's 100 % from the scale the asked window was actually
drawn at, not from the prediction. For example, in `setZoom` keep `currentScale() / before`
when the drawn window is the asked one, and use `max(prediction, that)` as `base`. Hold
`sizeTargetAbs` fixed per Size step, asked count, zoom and stage width, so a later pass cannot
lower it. And over 100 % refuse any shape whose drawn scale is not above the 100 % scale. It
serves the first good (each bar as readable as the setting asks) and the owner's rule 6 (Size
re-fits and does what it says). **Root fix, recommended with it:** measure a bar's natural
width without the system's opening, from rows on the glass only, and release the maximum
when the asked count changes.

**Refuting test:** with `base` from the drawn 100 % scale, 110 % here must draw the one-bar
window larger than the two-bar one (the stage allows it by a wide margin). If a patched build
still draws it smaller, the mechanism is not this one.

## R3 — `score.rotate`, run for the first time since T34

**Result:** exit 1; 7 of 10 red; 3 green (Hot Cross Buns two bars, Scroll, the miniature).
**The brief's worry is refuted:** `data-fit="size"` is written only when the Size setting is
over 100 % (`scaleFor`: `target < stageFit`). This spec never touches Size, its storage
fixture carries no zoom, and no red line mentions the fit.

The red lines, by cause (probe replays of four of the cells read each row's bars, scale,
`is-ahead` and width):

1. **"the engraver's page is still the sideways chunk's 360 px on a 360 px stage"** (5 reds,
   both pieces). Outdated spec. The stale sentence is `SlotShot.pageWidth`'s *"Set only on the
   sliding path … a page wider than the stage is the slide's signature"*. T34 rule 1 made every
   upright row engrave at natural width on a page of `bars × stage width` (`drawInto`: `natural
   = sliding || readAhead === 'slots'`), so a one-bar row has an inline page exactly the stage's
   width. It should assert: the page is not wider than `stage width × bars in that slot's range`
   (the sideways chunk is 3 or more bars of the *old* width).
2. **"slot 1 fills 73 % / 77 % of the width"** (Ode to Joy two bars; the two-turns test). Outdated
   spec. Slot 1 is the greyed look-ahead row (bars 3–4, or bar 2), narrower at the window's one
   scale, which T34 rule 1 allows ("a row that is not full is left as it is"). `FILLS_WIDTH`
   per slot predates natural widths. It should assert: the widest *window* row reaches the width
   (or the fit says height), no row runs past the right edge, and look-ahead rows are exempt
   from the fill.
3. **"the ink fills 74 % / 78 % of the width"** (Hot Cross Buns, one bar, both sizes). The
   *spec's rule* is the same stale one, but **what it caught is a renderer fault**: the
   measured row is the window row (bar 2, the cursor's), and the scale is set by the greyed
   look-ahead row (bar 3, 1.3 times wider). The window row is drawn at about three quarters
   of its own fit. This is fault B below.

**What would refute:** a failing cell whose red row is a window row not narrowed by a look-ahead
row, or a page wider than `bars × stage width`. The four replays showed neither.

## Found on the way (classified per `operating-procedure.md` §8)

**A. The `naturalBar` ratchet (P0).** Above. Causes R2, the sideways yield's price in R1,
and the tablet sideways four-bar window drawn at rest a third as wide as the stage allows. The
tests' own helpers always step through one bar first, so they exercise the ratcheted state.

**B. The look-ahead row is priced into the window's width (P0).** `fitSlots` hands every
drawn slot, the greyed row included, to `scaleFor`, whose width term is the widest box. The
chooser grants that row on its **height** alone. So a look-ahead bar wider than the window's
bars **shrinks the window**: at 390 × 844 on Hot Cross Buns the scale was exactly
`(width − margin) ÷ the look-ahead row's width`, about 8 % under the window's own fit, and at
360 × 780 about a quarter under. During a run the frozen scale holds instead, and the wider row
**runs off the right edge**: on the sheet's tablet upright Nocturne at 4 bars the probe measured
the greyed row's ink past the stage's right edge, and the tablet sideways Nocturne at 4 bars
shows the greyed row reaching the edge with no closing barline. Both break T34 rule 2 and `08` §9.7 ("the
window's size is never reduced to make room for it"). **Smallest fix:** size the scale from
the window's rows only. Grant the look-ahead row when it fits across at that scale as well as
down; otherwise drop it (rule 2 as written) or let it run off the edge showing its opening. The
second keeps the owner's "at least the beginning of the next music" and costs the window
nothing; choosing between them is a one-line product call.

**C. A look-ahead slot wrapped onto two systems and justified (P0, distortion).** On the sheet's
phone upright Nocturne at 4 bars mid-run, the look-ahead slot holds bars 5–6 on a page twice
the stage's width. At the engraving zoom the run moved to, bars 5 and 6 together are wider
than that page, so the engraver broke the slot onto two systems and **justified bar 5 across
the first**: the screenshot's middle row is one sparse bar spread over the full width. The slot is two systems
tall in a space priced for one. `data-stretch` still says `natural`, because `drawInto` writes
the flag from the intent, not the outcome, so `score.window-rule` (a) cannot see it. Mechanism:
`drawInto`'s page of `bars × stage width` assumes "a bar's width of page per bar is more than
any bar needs", which is false for dense bars on a narrow stage once the zoom search raises
the zoom (it did at Play in four of the seven replayed cells: the stage grows when the bar
folds, and `searchForFit` re-engraves). Smallest fix: size the natural page from the widest natural bar
at the engraving zoom, not from the stage, and write `data-stretch` from what was drawn (one
system or several).

**D. "Staff" is not the five lines anywhere it is checked (P1, two definitions).** The
`.staffline` group OSMD draws holds the notes, stems, ledger lines and fingerings as well as
the lines. Its box, which `score.window-rule` (e), the T30 camera, `score.screen` and
`score.rotate` all read as "the staff", was **1.8 to 2 times the five-line span** on the two
pieces checked. The renderer's own `pieceInk.staff` (OSMD's staff-line box) was **1.8 to 1.9
times** the five lines. `MIN_STAFF_PX` is documented as "five lines with ten between them", so
the floor actually enforced on the five lines is a little over half the stated one. And it moves with the notes
(the same scale gave two different "staff" readings on the sheet when the bars changed).
Recommendation: make the five-line height the source of truth (four staff spaces at the
engraving zoom × the scale), then re-derive the floor's number from screens the owner has
called readable. Do not add a conversion.

**E. Tablet sideways, 2 bars: the bar being played is the last thing on the stage (P1, product).**
Twinkle and the Nocturne both draw one row at the largest scale, cursor on the window's last
bar, **no next bar**, with the lower sixth (Twinkle, plus a fifth of the width beside the row)
to the lower third (Nocturne) of the stage empty. This is T34 rule 2 working as
written: no room for another row at that scale, and the window is never shrunk for it. The
staff there is far above any floor. To the eye it is wrong: the learner reads into the next
window blind at every other bar, on the largest screen the app has. Recommendation: once the
staff is well above the floor, prefer the look-ahead to further growth (the owner's two goods
are "the most important things" together, and T34 turned "maximising readability" into
"maximising size").

**F. The count flips sideways at Play and between settings (P3).** Covered under R1; no
picture changes, only the row's words.

## The sheet: 16 cells, re-shot and opened one by one

"Staff" is the caption's reading, the staff-line group (D), as a share of the stage height
(the stage heights mid-run were read by the probe). "Stretch" is from the picture and, for
the phone upright Nocturne, from the probe's replay.

| cell | bars on the glass (cursor) | staff / stage | next bar visible | stretch | looks right? |
| --- | --- | --- | --- | --- | --- |
| phone upright · Twinkle · 2 | 4 (cursor), 5 greyed below | 21 % | yes | none | yes: bar and next bar, large, reading order right |
| phone upright · Twinkle · 4 | 5–6 (cursor 6), 7–8 | 16 % | yes (7) | none | yes; the bottom third of the stage is empty (no next window) |
| phone upright · Nocturne · 2 | 4 (cursor), 5 greyed | 10 % | yes | none | readable; bottom third empty |
| phone upright · Nocturne · 4 | 3–4 (cursor 4), 5 and 6 greyed on two lines | 7 % | yes | **yes: the greyed bar 5 justified across the row (C)** | **no**: looks like three rows, one a smeared bar |
| phone sideways · Twinkle · 2 | 2–6 (cursor 4 at a third) | 51 % | yes | none | yes; the chunk ends short of the right edge (bar 7 not engraved) |
| phone sideways · Twinkle · 4 | 4–9 (cursor 6) | 47 % | yes | none | yes |
| phone sideways · Nocturne · 2 | 2–6 (cursor 4) | 21 % | yes | none | readable, but small for Chopin on a phone; bottom third empty (read-ahead-bound); row says *2 asked, 1 shown* |
| phone sideways · Nocturne · 4 | 2–6 (cursor 4) | 21 % | yes | none | same picture as the 2-bar cell; row says *4 asked, 4 shown* (A, F) |
| tablet upright · Twinkle · 2 | 4 (cursor), 5 greyed | 21 % | yes | none | yes, very large: one bar a row on a tablet |
| tablet upright · Twinkle · 4 | 5–6 (cursor 6), 7–8 | 22 % | yes (7) | none | yes |
| tablet upright · Nocturne · 2 | 4 (cursor), 5 greyed | 11 % | yes | none | yes; bottom third empty |
| tablet upright · Nocturne · 4 | 3–4 (cursor 4), 5–6 greyed | 11 % | yes | none | **no**: the greyed row runs off the right edge (B) |
| tablet sideways · Twinkle · 2 | 3–4 (cursor 4) | 42 % | **no** | none | **no**: playing the window's last bar with nothing ahead, the stage's lower sixth and right fifth empty (E) |
| tablet sideways · Twinkle · 4 | 5–8 (cursor 6) | 26 % | yes (7) | none | yes mid-run; the same window **at rest** is two small rows a third as wide (A, probe) |
| tablet sideways · Nocturne · 2 | 3–4 (cursor 4) | 21 % | **no** | none | **no**: as Twinkle 2 (E) |
| tablet sideways · Nocturne · 4 | 1–4 (cursor 4), 5–8 greyed | 11 % | yes | none | **no**: the greyed row runs off the right edge (B) |

What a teacher would say is not verified: nobody played from these. The judgements above are
a reader's.

## The nine specs (from `app/`, two workers, one at a time, unpiped; build of this session, no source change since)

| spec | exit | red lines and class |
| --- | --- | --- |
| `score.window-rule` | 0 | none (5 passed). By construction it cannot see A (its (b) accepts a window that touches an edge whether or not another split draws it larger; the at-rest tablet sideways four-bar state touches the height), C (its (a) reads the intent flag) or D (its (e) reads the group box). |
| `score.layout` | 1 | `the window really holds more bars as the setting goes up`: *1 bar drew 3, 2 bars drew 3*. **R1, outdated spec.** The three local screenshot tests passed this run. |
| `score.screen` | 1 | `zoom, keyboard strip and playback destination all respond`: staff 269.99 → 250.60. **R2, implementation bug.** |
| `score.rotate` | 1 | 7 of 10: **R3**, above (5 × page width and 2 × look-ahead fill: outdated spec; 2 × window fill on Hot Cross Buns: fault B). |
| `score.fill` | 0 | none (3 passed) |
| `score.fuzz` | 0 | none (5 passed) |
| `score.head-height` | 0 | none (7 passed) |
| `score.stepper-limits` | 0 | none (4 passed) |
| `score.states` | 0 | none (9 passed) |

## What to change, in the order that serves the owner's goods

1. **A, the ratchet**, with R2's base: bars priced without the system's opening, from rows on
   the glass, released on a change of asked count; Size's 100 % from the drawn scale. This
   closes R2 and the at-rest tablet split, and makes R1's sentence price honestly.
2. **B**: the scale from the window's rows only; the look-ahead row granted across as well as
   down (or allowed to run off the edge, the owner's call in one line).
3. **C**: the natural page sized from the widest bar at the engraving zoom; `data-stretch`
   from the outcome.
4. **Specs, in the same change as the code they follow**: `score.layout`'s count test
   re-pointed (R1); `score.rotate`'s page and per-slot fill checks re-pointed (R3 kinds 1 and
   2); `score.window-rule` (b) compared against the best split and (a) read from the glass.
5. **D**: one definition of staff height (the five lines), then the floor's number
   re-derived.
6. **E**: the look-ahead preferred to further growth once the staff is well above the floor.
   This changes product behaviour on tablets; T34's rule 2 would change with it.

## Unverified

- Nothing was seen on the owner's device. All numbers are this machine's and are stated as
  relationships.
- None of the fixes was made or tried; each "smallest fix" is a reading of the code, and each
  has a refuting test named.
- The five-line measurement takes the thin horizontal strokes inside the staff-line group as
  the stave lines. It found five, evenly spaced at one OSMD space, on the two pieces checked,
  and was not repeated on others.
- Fault B was observed on Hot Cross Buns (two upright widths) and on the Nocturne mid-run
  (two tablet cells); it was not swept across the catalog. Fault C was seen in one cell.
- The sideways shape's history dependence was seen on Twinkle RH at 880 × 412 and on the
  Nocturne at 740 × 342 only.
- The first probe run hung on a locator with no timeout. Stopping its shell did not stop its
  test process, which overlapped the second probe run for about four minutes on the same
  server. R2 was re-run alone and gave identical numbers. R1's numbers were not re-run alone;
  they are geometry read from a settled page, and `score.layout` in the chain reproduced R1's
  red line.

## Files read

`docs/prompts/tasks/T35-window-reds.md`; `docs/prompts/operating-procedure.md` (all);
`docs/prompts/audit-2026-09-25-outside.md` (header, message 5, Parts 2 and 3);
`docs/prompts/tasks/T34-window-fit.md`; `docs/prompts/tasks/T34-HANDOFF.md`;
`docs/pending-review.md` Entry 63; `app/src/score/WindowRenderer.ts` (constants,
`windowFor`, `showStep*`, `slideRangeFor`, `slideToStep`, `updateReadAhead`,
`dropDrawnSheets`, `chooseWindowShape`, `settleShape`, `mayReshape`, `applyWindowShape`,
`setBarsPerWindow`, `setZoom`, `debugFit`, `stageChanged`, `invalidate`, `drawInto`,
`fitSlots`, `packSlots`, `updateSlotClasses`, `fitToStage`, `searchForFit`, `fit`,
`setRunning`, `freezeAfterSettle`, `currentScale`, `scaleFor`, `placement`, `measurePiece`,
`staffLineBoxes`, `staffHeightOf`, `pieceInkOf`, `widestBarOf`, `readAheadScale`);
`app/src/score/slots.ts`; `app/src/ui/screens/ScoreScreen.ts` (the row sentence, `onWindow`,
`scoreFit`); `app/tests/e2e/score.layout.spec.ts`, `score.screen.spec.ts` (the zoom test and
the fill group), `score.rotate.spec.ts`, `score.window-rule.spec.ts`,
`fixtures/storageState.json`; `app/tests/tour/t34-sheet.spec.ts`, `t30.ts` (helpers and
`measure`); `app/playwright.config.ts`, `playwright.tour.config.ts`;
`docs/08-score-render-states.md` §4.1 and §9; `docs/04-ui-spec.md` §5 (the window
paragraphs); `docs/decisions/2026-09-23-score-window-strategy.md` §2.1–2.3, §3's close,
§4, §5; the OSMD bundle's `drawStaffLine` (to see what `.staffline` holds).
