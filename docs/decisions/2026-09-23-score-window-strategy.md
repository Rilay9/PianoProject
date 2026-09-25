# What the score window should show — a gallery, the faults, and three rules to choose between

**Status (2026-09-23, T32): the owner has chosen and the rule is built.** §5 at the foot has
the rule, the new fault table beside the old one, and what is still red. Everything above §5 is
left exactly as it was written, because it is the evidence the choice was made on.

**The status while it was a draft, kept for the record: a draft awaiting the owner's choice.
Nothing here is built.** The three rules in
§3 were each put into the renderer for long enough to photograph and then taken out again;
`app/src` is byte-identical to `HEAD` (`git diff --stat` empty, checked after the last
probe). `docs/00-invariants.md` §1 says eye over spec: the pictures are in the gallery and
the numbers are under them, and the choice is the owner's.

The owner, 2026-09-23: *"We've got to find the balance between showing the music to be as
big as possible without distorting it, showing upcoming music, and following user options.
If you do a screenshot tour of phone, tablet, in both landscape and portrait, with different
bars-shown options selected, you'll see that things don't look right. You either can't see
the next music, or nothing changes, or it's too small, or it's nonsensical in that you
choose x bars shown but a different number is shown."*

All four are reproduced below, with counts.

---

## 1. The gallery

**Where it is.** `build/tour/T30/index.html` (gitignored), with the pictures under
`build/tour/T30/<shape>/<slug>.png`, one JSON record per cell under
`build/tour/T30/cells/`, and the fault table as `build/tour/T30/faults.md`. Open the
`index.html` from the file manager.

**How to shoot it again** — after a rule is chosen, this is what says whether it worked:

```bash
cd app
npm run build:app
npx playwright test --config playwright.tour.config.ts t30-window --workers=4 --fully-parallel
node tests/tour/t30-sheet.mjs ../build/tour/T30
```

About a quarter of an hour. `npm run tour` names its own spec files and does not pick these
up. A candidate rule goes in the renderer, and `T30_STRATEGY=<name> npx playwright test
--config playwright.tour.config.ts t30-strategy` shoots §3's 36-cell comparison against it.

**639 cells: 495 against the build in the tree, 144 against §3's three probe builds. Five
not-shot lines, each with its reason.** The camera writes the tour's own file layout
(`<orientation>/<slug>.png`, sha1 per shot) so a slug names one picture for good; the sheet
is T30's own because the tour's contact sheet has nowhere to put a measurement, and the
measurement is the claim here. Shot at a device pixel ratio of 2 rather than the tour's 3 —
every number below is in CSS pixels and does not depend on that.

**What each caption carries, measured on the live screen, never asserted:**

| in the caption | how it is measured |
| --- | --- |
| bars actually drawn | the distinct `data-bar` values of note elements whose own box lies inside the stage's box, in buffers that `checkVisibility` says are on the glass |
| the drawn size | the engraver's zoom (`debugFit().zoom`) × the CSS scale on the cursor's wrapper, as `pending-review` Entry 58 measures it — the product is what the eye sees |
| the stave | the shortest `.staffline` group's height on the glass, which is the unit `MIN_STAFF_PX` is written in |
| the fill | `score.fill.spec.ts`'s own measure — the inked width over the stage's width — and its vertical twin |
| the next music | the highest visible bar minus the bar the run is on |
| the stepper against the screen | `#score-bars`'s own text against the drawn count |

**The shapes** (five, the brief's): phone upright 342×740 and 390×844, phone sideways
740×342, tablet upright 768×1024, tablet sideways 1024×768.

**The pieces** (six, chosen off `content/catalog.json`'s measured `notation` fields and not
off their titles, per `00-invariants` §1a):

| id | why it is here | bars / staves / metre |
| --- | --- | --- |
| `exercise.five-finger.c-major.right` | one hand, few notes a bar — the sparsest thing the window is asked to hold | 3 / 2 / 4/4 |
| `song.folk.twinkle.ht` | the simple two-hand song | 12 / 2 / 4/4 |
| `song.classical.chopin-nocturne-op48-1.nifc` | dense two hands, wide chords, many notes a bar | 81 / 2 / 4/4 |
| `song.classical.chopin-nocturne-op9-2` | a compound, long metre | 38 / 2 / 12/8 |
| `exercise.articulation.c.legato.right` | a generated technique exercise | 4 / 2 / 4/4 |
| `drill.pedal.changes` | the drill that draws a stave — `STAFF_POLICY.pedal` is `always` (`app/src/engine/drills/types.ts:90`) | a drill card |

**The grids.**

- **A — the core.** 5 shapes × 5 score pieces × *Bars in window* 1, 2, 3, 4, 6, 8 ×
  {before the run at bar 1, mid-run past the first window}, `Window`, Size at its
  default. 300 cells.
- **B — `Scroll`.** 5 shapes × 3 pieces × counts 1, 4, 8 × both moments. 90 cells.
- **C — `Size`.** One step down and one step up (the stepper's own 10 %), 5 shapes ×
  2 pieces × counts 2, 4. 40 cells.
- **D — the run modes.** *Wait for me*, *Keep tempo*, rhythm-only, Perform and Blind,
  mid-run, on phone upright 342×740 and tablet sideways, 2 pieces, counts 1, 2, 4.
  60 cells.
- **E — the drill.** `drill.pedal.changes` on all five shapes. 5 cells.

**Not shot, with the reason** (5 lines, one per shape): the option grid on the Drill
screen. The Drill screen has no *Bars in window*, no *Layout* and no *Size* control, so
there is nothing to vary; each shape carries one picture of the card instead.

**Reduced crossings, and why — the reasons are in the code, and each is checked rather than
asserted.**

- *Size* is not crossed with the whole of grid A, on the reading that `setZoom` writes
  `userZoom` and calls `fitSlots()` — it never re-engraves and never reaches
  `chooseSlotCount` (`app/src/score/WindowRenderer.ts:1561`) — so it should not be able to
  move a bar count. **Grid C checked that reading and it is not quite true.** In 36 of its
  40 cells the drawn count at one step down and one step up is the count at the default; in
  **four** it is not: phone sideways Nocturne op. 48 no. 1 at 4 bars, one step up, 5 bars
  against 6; phone sideways Twinkle at 4 bars, one step down, 6 against 5; and tablet
  sideways Twinkle and Nocturne op. 48 no. 1 at 4 bars, one step up, **4 bars against 2**.
  `fitSlots` feeds `held`, and `chooseSlotCount` reads `held` on the next pass, so Size
  reaches the count by that path. The four cells are in the gallery as `c-*`; what carries
  the change was not traced further.
- `Scroll` is shot at three counts rather than six, because the question there is whether
  the count does anything at all. It does not: across the 30 (shape × piece × moment)
  groups, the engraving zoom, the CSS scale and the stave height are the same at 1, 4 and
  8 in **all 30**, and 18 of the 30 groups are byte-identical pictures. The one group whose
  bar count differs — phone upright 390×844, Twinkle, mid-run — differs because the run
  stopped on a different bar (2 against 5), at the same zoom and the same 91.7 px stave.

**How the mid-run moment was reached.** *Wait for me* with a MIDI mock, fed note by note
until the cursor is past the first window, so the moment is a state and not a race with a
clock.

---

## 2. The fault table

Counts are over the 483 cells of grids A–C and E plus grid D's non-Blind cells. Blind's
12 cells are excluded from all four groups and counted separately: the stage is dark there
by design (`04` §5e), and the gallery confirms it — `d-twinkle-4bar-blind` at 342×740 shows
`bar 6 / 12`, the keyboard strip and nothing else.

| the owner's group | cells | where they concentrate |
| --- | --- | --- |
| **the chosen count is not the drawn count** | **266** | every shape: phone upright 342 → 62, phone sideways → 57, tablet sideways → 57, phone upright 390 → 46, tablet upright → 44 |
| **nothing changes when the option changes** | **89** groups of two or more counts with a byte-identical picture | tablet sideways 26, phone upright 342 → 22, tablet upright 17, phone upright 390 → 14, phone sideways 10 |
| **cannot see the next music** | **82** | tablet sideways 45, phone upright 342 → 16, phone upright 390 → 12, tablet upright 7, phone sideways 2 |
| **too small** | **59** | tablet sideways 50, phone sideways 7, phone upright 342 → 2 |

The full list, one line per cell with its shape, piece, options, measurement and rule, is
`build/tour/T30/faults.md`.

### 2.1 The chosen count is not the drawn count — 266 cells

**The rule that produces it.** Upright and on any stage 600 px or taller the arrangement is
SLOTS (`updateReadAhead`, `WindowRenderer.ts:1297`, and `TWO_SYSTEMS_MIN_PX` at
`:495`). Each slot holds `barsPerSlot(n) = max(1, ⌊n / 2⌋)` bars (`slots.ts:28`) and
`chooseSlotCount()` returns 1 to 4 from the room (`WindowRenderer.ts:1393`, `MAX_SLOTS` at
`:172`). What is on the glass is therefore **slots × ⌊n/2⌋**, which equals *n* only by
coincidence. Sideways the arrangement is the sliding chunk and `slideRangeFor`
(`WindowRenderer.ts:1085`) engraves the window plus two bars behind and two ahead
(`SLIDE_BEHIND_BARS` `:146`, `SLIDE_READ_AHEAD_BARS` `:101`), so the drawn count there is
up to *n* + 4.

Measured, both directions:

- *Tablet upright 768×1024, Nocturne op. 9 no. 2, `Window`, 6 bars, before the run:*
  **13 bars drawn** in four systems — `a-nocturne-9-2-window-6bar-before`.
- *Phone upright 342×740, Nocturne op. 48 no. 1, `Window`, 8 bars, before the run:*
  **4 bars drawn**, one to a system — `a-nocturne-48-window-8bar-before`.
- *Tablet sideways 1024×768, Twinkle, `Window`, 2 bars, before the run:* **1 bar drawn** —
  `a-twinkle-window-2bar-before`.

`docs/08-score-render-states.md` §4.1 already calls this arithmetic *"the open question,
not a settled rule"*, and `docs/handoff-2026-09-09.md` §4b lists three ways out. This
document is that decision, with the grid behind it.

### 2.2 Nothing changes when the option changes — 89 groups

Two distinct settings, one byte-identical photograph. The largest classes:

- **1, 2 and 3 are one setting.** `⌊n/2⌋` is 1 for all three. On the five-finger exercise
  the picture is identical at 1, 2 and 3 on four of the five shapes (phone upright 342
  sha1 `a7b91038ac`, phone upright 390 `38ac1cb6f3`, tablet sideways `393a5ef1ae`, tablet
  upright `9801558638`).
- **6 and 8 are one setting** wherever the piece runs out first (⌊6/2⌋ = 3 and ⌊8/2⌋ = 4,
  but a 3-bar exercise has neither): tablet sideways `4090128c6d`, tablet upright
  `ca5091871d`, phone upright 342 mid-run `140aeb9831`.
- **Sideways, all six counts are one setting** on the five-finger exercise: the chunk is
  the whole three-bar piece whatever is asked (phone sideways before the run sha1
  `7275b2cdac`, mid-run `bec7145dc0`).
- **In `Scroll` the control does nothing at all.** `ensureScrollRender`
  (`WindowRenderer.ts:1842`) draws the range `0..Infinity` and never reads
  `barsPerWindow`. Measured above: same zoom, same CSS scale, same stave at 1, 4 and 8 in
  all 30 groups. The `⋯` sheet shows the stepper live and lit in `Scroll`, which
  `00-invariants` §1 calls a dead control.

### 2.3 Cannot see the next music — 82 cells

Cells where the highest visible bar is the bar being played, with the cursor not on the
last bar of the piece (the last bar legitimately has no next music, and `04` §5 says the
other slot then keeps the bars just played). It concentrates where the count collapses to
one system of one bar:

- *Tablet sideways 1024×768, five-finger, 1 and 2 bars, mid-run:* one bar on the glass,
  ink 32 % of the width, the rest dark.
- *Phone upright 342×740, Nocturne op. 48 no. 1, 6 bars, mid-run:* bars 1–3 drawn, the
  cursor on bar 3, one slot — nothing after it.
- *Tablet upright 768×1024, five-finger and legato at 1–4 bars, mid-run:* one slot, one bar.

The rule: `chooseSlotCount` counts **down** from the most the buffers allow and takes the
first count whose stave clears `MIN_STAFF_PX` (40 px, `:98`) **and** whose system spans
`SLOT_WIDTH_FLOOR` (0.6) of the stage's width (`:1443`); when none does it returns 1
(`:1447`), and one slot has no preview. `08` §4.1 describes this branch under the name
`ONE_SYSTEM_GAIN` and says it is taken when two systems would cost a quarter of the size.
**That constant is not in the code.** Two searches, both reported: `grep -rn
"ONE_SYSTEM_GAIN" app/src/` returns nothing, and `grep -rn "GAIN|oneSystem|one system"
app/src/score/*.ts` returns only prose in comments. The live rule is the width floor.
`08` §4.1 needs correcting whatever the owner chooses.

### 2.4 Too small — 59 cells

Two measures, kept apart:

- **Under the readability floor the code itself names.** Four cells, all on the owner's
  342×740 phone with the dense pieces at 8 bars: `a-nocturne-9-2-window-8bar-before`
  **38.7 px**, `a-nocturne-48-window-8bar-mid` **39.1 px**,
  `a-nocturne-9-2-window-8bar-mid` 42.0 px, `a-nocturne-48-window-8bar-before` 40.8 px.
  `MIN_STAFF_PX` is 40, so the first two are under the floor the fit is supposed to hold.
- **Under `score.fill`'s own 55 % width floor.** 55 cells, 50 of them tablet sideways. The
  worst: five-finger at 1 bar mid-run, **32 %** of the width inked; Twinkle at 2 bars,
  **49 %**; Nocturne op. 48 no. 1 at 2 bars, **42 %**. These are not small staves — the
  Twinkle cell's stave is 182.6 px — they are one bar sitting in a quarter of a large
  screen with the rest dark, which is the same complaint from the other end.

### 2.5 The run modes (grid D)

Blind and Perform aside, no mode changes the window on its own — with one measured
exception and one thing the harness could not reach.

- **The exception.** Phone upright 342×740, Twinkle, 4 bars, mid-run: *Wait for me* draws
  2 bars in **1** slot at a 132.3 px stave; **Perform** draws 6 bars in **3** slots at an
  81.6 px stave. Same piece, same shape, same setting, different arrangement. The
  arrangement is chosen at the first fit and frozen for the run, and the freeze waits for
  the piece's measurement up to `FREEZE_WAIT_FOR_MEASURE_MS`; a mode that starts its run at
  a different moment lands on a different side of that race, which is the race
  `tests/e2e/score.arrange-race.spec.ts` exists for. **Named as a plausible cause, not
  verified.**
- **Blind.** All 12 Blind cells draw nothing: the stage is dark and only `bar n / m` and the
  keyboard strip remain. Correct per `04` §5e, and recorded here because it is a mode
  changing the window.
- **Not reached.** In *Keep tempo* the cursor stayed on the first bar in all 12 cells, and
  in rhythm-only it reached bar 2 in 3 of 12, through 18 fed steps each. Those cells are
  therefore the window **at the start of a run**, not mid-run, and are labelled so in the
  gallery. Whether the tempo clock does not latch onto the mock's notes or something else
  holds it was **not investigated**.

### 2.6 One thing noticed in passing, not investigated

The header of `song.classical.chopin-nocturne-op9-2` reads `bar 0 / 37` before a run, where
Twinkle's reads `bar 1 / 12` and the catalog row gives the piece 38 bars. `04` §5 says bar
numbers in the interface are as printed and 1-based. Not chased; it is a header, not the
window.

---

## 3. Three rules to choose between

Each was put into the renderer on its own, built, photographed on **two shapes** (phone
upright 342×740, tablet sideways 1024×768) × **three pieces** (five-finger, Twinkle,
Nocturne op. 48 no. 1) × **counts 2, 3, 4** × both moments — 36 cells a rule, `p-A-*`,
`p-B-*`, `p-C-*` in the gallery, with `p-today-*` shot the same way for comparison. Then
the renderer was put back.

### The four sets of 36, side by side

| | drawn = asked | median stave | smallest stave | ink under 55 % of the width | mid-run with nothing ahead |
| --- | --- | --- | --- | --- | --- |
| **today** | 11 / 36 | 124.4 px | 54.2 px | 13 / 36 | 6 / 18 |
| **(A)** | 25 / 36 (11 over) | 78.3 px | 39.1 px | 4 / 36 | 3 / 18 |
| **(B)** | **36 / 36** | 105.2 px | 39.1 px | 3 / 36 | 3 / 18 |
| **(C)** | 19 / 36 (15 over, 2 under) | 76.4 px | 39.1 px | **1 / 36** | **2 / 18** |

"drawn = asked" counts a cell as right when the drawn bars equal the number asked, or equal
what is left of the piece where the piece is shorter than the window.

---

### (A) *Bars in window* is the least the window will hold

> Pick how many bars you want to see at a time. The app will show you at least that many,
> and it will keep showing you the system that comes next whenever the screen has room for
> it, so there is always music ahead of your hands. On a small screen or a dense piece the
> notes get smaller to pay for it.

*In the code:* one system holds the number asked (`barsPerSlot(n) = n`), and a second slot
survives on readability alone — the width floor only decides three systems against two.

*How it behaves.* **Phone upright:** the number is honoured and often exceeded — Twinkle at
4 bars mid-run drew **8**, in two systems. **Phone sideways:** untouched; the chunk rule is
unchanged. **Tablet upright and sideways:** the overshoot is largest, because the room buys
more systems — Twinkle at 4 bars on tablet sideways mid-run drew **12 bars**, the whole
piece, at a 96.1 px stave. **`Scroll`:** unchanged, so the control still does nothing there.
**Read-ahead:** best of the three at the *start* of a window; cells with nothing ahead fell
from 6 to 3 of 18. **The frozen size:** unchanged — the count and the scale are still taken
at the first fit and held for the run.

*What it costs.* The number on the stepper stops being a count of anything on the screen:
"4 bars" drew 12. And on a dense piece on the owner's phone the stave falls to **39.1 px**,
under `MIN_STAFF_PX`.

### (B) The count is exact, and the size follows

> Pick how many bars you want to see at a time and that is exactly what you get. The app
> makes them as large as they will go in the space, and if that means the notes come out
> small for the number you asked for, it says so and offers to show fewer.

*In the code:* the slot count is restricted to counts that divide the window exactly, and
each slot holds `n / count`; where none divides, one system holds the whole window.

*How it behaves.* **Phone upright:** exact everywhere — Nocturne op. 48 no. 1 at 2 / 3 / 4
bars drew 2 / 3 / 4 bars at staves of 54.2 / 54.2 / 40.7 px. **Phone sideways:** untouched
(the chunk still engraves two bars either side, so sideways is not exact; that is work this
probe did not do). **Tablet upright and sideways:** exact — Twinkle at 2 / 3 / 4 drew
2 / 3 / 4 bars at 154.5 / 154.5 / 147.1 px, against today's 1 / 1 / 2 bars.
**`Scroll`:** unchanged; the control would have to be hidden there or given a meaning.
**Read-ahead:** an even count still splits into two systems and previews; an **odd** count
gives one system, and when the cursor reaches its last bar nothing is ahead. At 1 bar there
is no preview at all. **The frozen size:** unchanged.

*What it costs.* The read-ahead is a by-product of the count rather than a promise, so odd
counts and 1 lose it. And the warning the rule promises does not exist yet: on the owner's
phone the dense piece at 4 bars is already **40.7 px**, at the floor, with nothing on screen
saying so.

### (C) The app chooses, and the stepper overrides it

> The app looks at how busy the piece is and how big your screen is, and picks how much
> music to show so the notes stay a comfortable size. If you want a different amount, the
> stepper still sets it, and the sheet says the app would have shown a different number.

*In the code:* the piece's own widest bar and stave height (both already measured by the
probe) are scaled so the stave lands at one and a half times the readable floor, and the
bars that fit across the stage at that size become the count; the setting is used instead
whenever the learner has moved it off its default of 2.

*How it behaves.* **Phone upright:** at the default it drew the whole 3-bar exercise at a
74–92.8 px stave where today draws one bar, and 4 bars of Twinkle where today draws 2.
**Tablet sideways:** the best single cell in the whole comparison — the five-finger exercise
at **3 bars, 140 px stave, 99 % of the width**, against today's 1 bar at 48 %. But Twinkle at
the default drew **8 bars** at an 81.2 px stave. **Tablet upright:** the same shape of
answer, one step more music. **`Scroll`:** unchanged. **Read-ahead:** best of the three, 2
of 18 cells with nothing ahead. **The frozen size:** unchanged; the automatic count is taken
at the first fit and then held, so it cannot move mid-run.

*What it costs.* The stepper's number means two different things — at 2 it is ignored, at
anything else it is obeyed — so the control the owner asked to be followed is the one
setting that does nothing. Overridden, C is mostly A: of the 24 cells at 3 and 4 bars, 20
have the same bars, stave and slot count under both, and the four that differ are Twinkle
on tablet sideways, where C draws the number asked (3 bars at a 200.9 px stave; 4 at 147.1)
and A draws double it (6 bars at 137.5 px; 8 at 121.5). And a second sentence has to be
written and fitted on the sheet.

---

### The recommendation: (B), with one amendment

**(B), because it is the only rule that makes the stepper mean what it says, and it does not
pay for that in size.** The measurements, all from the 36-cell comparison above:

1. **36 of 36** cells drew the number asked, against 25 for (A), 19 for (C) and 11 today.
   That is the owner's fourth complaint closed outright, on both shapes and all three
   pieces.
2. It is **not** the small option. Its median stave, 105.2 px, is a third larger than (A)'s
   78.3 and (C)'s 76.4. Today's median is higher still at 124.4 px, but today buys that by
   drawing one bar where two were asked: today has **13 of 36** cells inked under 55 % of
   the stage's width and (B) has **3**.
3. It fixes the "too small" complaint in its tablet form, which is where 50 of the 59 cells
   are: Twinkle at 3 bars on tablet sideways goes from one bar at 49 % of the width to three
   bars at **99 %**, at a 154.5 px stave.
4. It halves the blind cells, 6 of 18 to 3 of 18, without being the rule that optimises for
   that. (C) reaches 2 of 18 — one cell better — and pays with a stepper that ignores its
   own default.

**The amendment, and it is the part of (B) that is not built.** The preview must be a
promise of its own rather than a by-product of whether the count happens to be even. State
it as: *the window is exactly the bars you asked for, and where the screen has room the app
draws the next bars after it as a further system.* That keeps (A)'s read-ahead without
(A)'s arithmetic, and it is the only way (B) is safe at 1 bar and at odd counts — neither of
which this probe covers, because the strategy grid was shot at 2, 3 and 4.

**And the warning (B) promises needs building**, because the gallery has the cells it is for:
the owner's phone at 4 bars on a dense piece is already at the floor. One line in the `⋯`
sheet under the stepper — *four bars leaves the notes smaller than is comfortable here* —
with the count still obeyed, because `00-invariants` §1 says a control that looks pressable
must do something.

**Two things any choice has to settle, because they are not in the three rules:**

- **`Scroll`.** The stepper is live and dead there under all three rules. Either hide the
  row in `Scroll` (`04` §0 R4) or give the number a meaning — how much of the sheet is kept
  above the cursor, say.
- **Sideways.** The chunk rule adds two bars either side (`WindowRenderer.ts:1085`) under
  all three, so the count is never exact on a phone held sideways. Whether the owner reads
  those as "the window" or as scenery decides whether that is a fault.

---

## 4. What is unverified

- The mid-run moment in *Keep tempo*, rhythm-only and Perform was reached only in
  *Wait for me* and Perform; the tempo-clocked cells sit on the first bar (§2.5). Everything
  said about those modes is about the start of a run.
- The three probe builds were shot at counts 2, 3 and 4 only, on two shapes and three
  pieces. **1, 6 and 8 were not shot under any of them**, and 1 is where (B)'s read-ahead is
  weakest.
- Nothing here has been seen on the owner's device; every number is this machine's, and the
  ones stated are relationships between two measurements of the same screen rather than
  thresholds (`00-invariants` §2). The two literals quoted — 40 px and 55 % — are the code's
  and the spec's own.
- The bars a cell reports are bars with an **inked note** inside the stage. A bar of rests
  has no note element and is not counted; no piece in the gallery opens with one, but that
  was not checked bar by bar.
- Grid D's Perform-against-Wait difference (§2.5) has a named plausible cause and no
  measurement of that cause.
- `08` §4.1's `ONE_SYSTEM_GAIN` is stale against the code (§2.3) and is left for the change
  that follows the owner's choice, per `00-invariants` §4 — the spec is corrected in the
  commit that moves the code, with the reason beside it.

---

## 5. The rule that was built (T32, 2026-09-23)

**The owner's answer to the three rules above was none of them.** *"Do what you think is best.
Just remember that readability without distortion and being able to look ahead are paramount."*
That orders the goods, and the rule is the order:

1. **Never distort.** A bar is drawn at the width its music needs; a system that is not full is
   never stretched; the staff never falls under `MIN_STAFF_PX`.
2. **Always look ahead.** The next bar after the window's last is on the stage, drawn as the
   following system — given up only where keeping it would break 1, which is `08` invariant 7's
   own exception.
3. **Then the count.** *Bars in window* exactly, when 1 and 2 allow it; otherwise as many as
   fit, with the `⋯` row saying so in words — *4 asked, 2 shown: 4 would be too small here* —
   and the stepper still live.

**In the code.** Windows tile the piece in the asked number of bars, and inside a window the
bars are split over `systemsPerWindow` systems of `⌈shown / systems⌉`, the last clipped at the
window's end, so three over two is 2 + 1 (`slots.rangeAt`, `slots.barsPerSlot`).
`WindowRenderer.chooseWindowShape` prices every (systems on the stage, systems in the window,
bars shown) at the scale the fit will apply and takes the largest that clears the floor with a
system to spare for the look-ahead. `SLOT_WIDTH_FLOOR` is **gone** — it is the rule `08` §4.1
called `ONE_SYSTEM_GAIN`, a name that was never in the code, and it is what produced §2.3.
Sideways, `windowFor` strides by the bars actually shown rather than the bars asked.

### The fault table, before and after

Not the 639-cell gallery: `tests/e2e/score.window-rule.spec.ts`, **60 cells** — the same five
shapes, three of the six pieces (five-finger, Twinkle, Nocturne op. 48 no. 1), *Bars in window*
1, 2, 4 and 8, before the run — run once against the build in the tree and once against the
rule. Every line is a relation measured on the same screen; the only literals are the code's
own 40 px and eight staff-heights.

| group | before | after |
| --- | --- | --- |
| **the chosen count is not the drawn count** (and the row is silent about it) | **28** | **0** |
| **cannot see the next music** | **40** | **21** |
| **under the readable floor** | **2** | **16** |
| **a bar stretched past eight staff-heights** | **2** | **6** |
| total | **72** | **43** |

By shape, after: phone upright 342 → 13, phone upright 390 → 13, **phone sideways → 0**,
tablet upright → 10, tablet sideways → 7.

### Where it still fails, and whether it is the floor speaking

- **The count group is closed outright**, on all five shapes and all three pieces. That is the
  owner's fourth complaint, and the second one with it: the shape is now a function of the
  asked number, so no two settings draw the same picture.
- **The 21 "cannot see the next music" are two cases.** Thirteen are **one-bar windows**: with
  the window at one bar the stage collapses to a single system and there is no second one to
  preview into. Eight are the Nocturne on the two phones, where the same thing happens for the
  same reason — the floor takes the second system away. Both are `08` invariant 7's exception,
  and both are **readability winning over the look-ahead, which is the order the owner set**.
  What would close them is drawing the next bar *on the same system*, sideways-fashion, which
  the brief allows ("or, sideways with room, on the same system") and this change did not
  build: it needs the cursor slot's drawn range to reach past the window.
- **The 16 under the floor are one piece**, Chopin's Nocturne op. 48 no. 1, on all four upright
  and tall shapes at every count: 26.8 to 36.9 px against a floor of 40. **This is worse than
  before** — T30 measured 39.1 to 40.8 px on the same piece — and it is a regression against
  the first of the three goods, so it is stated here rather than in a footnote. The six
  "stretched" lines are the same cells: the measure is the system's ink over the bars in it
  against the staff, so a staff a third too small makes an ordinary bar read as stretched.
- **The cause is named and not proved.** `scaleFor` sizes a window against the **piece's widest
  system** — `pieceInk.width`, which is the page the probe engraved on — and not against the
  bars the window actually holds, so on a dense grand staff the page caps the drawn scale
  whatever the window is reduced to. Two things were tried and neither moved it: predicting the
  scale the way `scaleFor` computes it rather than from the bars across
  (`chooseWindowShape.scaleAt`), and letting the drawn-stave correction fire before the probe
  has measured. **Not fixed, and it should be the next piece of work on this screen.**

**One more measurement, after the table was written.** All 21 of the "cannot see the next
music" cells are upright or tall, and every one of them is the state where the window is using
**every system the stage holds**, which is
`08` invariant 7's own exception and the order the owner set. The spec therefore does not count
them as faults, and its remaining red is the Nocturne's floor alone: **16 cells under the floor
and the 6 stretched lines they produce, on one piece.** The raw count of 21 is kept in the table
because it is what the glass showed. The exemption is written to apply **only in the slot
arrangement**: sideways there is one sliding system by construction and the chunk engraves bars
to slide towards, so the look-ahead is checked there and passes on all 12 sideways cells.

**Built (T34, 2026-09-23):** the rule built is T34's — rows engraved at natural widths, one scale for the window as large as the stage allows times the Size setting (100 % = that fit), rows in reading order, rows split by the largest scale, the next bar a greyed row below only when it costs the window nothing, the count yielding with its sentence (`docs/prompts/tasks/T34-window-fit.md`, `pending-review` Entry 63).

## 6. What T38 changed in the rule, and what it measured (2026-09-25)

T34's rule stands as built; T38 fixed the mechanisms under it that the T35 trace classified
(`docs/prompts/traces/2026-09-25-window-reds.md`), each seen red first and measured again
the same way afterwards (`pending-review`, the T38 entry, has the numbers).

- **Priced as drawn (fault A).** The chooser priced every bar at a running maximum of row
  ink ÷ bars that carried the row's opening and only a zoom change released. It now prices
  each candidate on its own window from the engraver's natural bar widths (the probe's
  `begin + minimumStaffEntriesWidth + end`), the opening once per row, the ink past the lines
  measured from the rows on the glass. Size's 100 % is the asked window's own fit, every step
  a fixed multiple of it, and over 100 % a bar is given up only for a window drawn larger.
- **The window's scale from the window's rows (fault B).** The greyed next row no longer
  sizes the window. When it is wider than the stage at the window's scale it is drawn one of
  two ways, both built and photographed on T34's sixteen cells and on a sweep of Hot Cross
  Buns at rest from 360 to 1000 px wide: **run-off**, the default, draws it whole and lets the
  stage's edge cut it; **compact** cuts it inside the stage between two note columns with a
  fade. The pictures chose run-off: on the two Nocturne cells where the treatment shows
  mid-run, compact's cut fell inside a beamed group — there is no gap between columns that a
  beam does not cross — and left a stub of beam in the fade, which reads as a rendering fault,
  while run-off reads as the edge of a page and shows more of the next bar; on Hot Cross Buns
  the two read alike. Neither made the window's size move across the sweep (asserted,
  `score.window-rule`). The switch stays for one wave: `localStorage['pianopath.lookAhead']`,
  `run-off` or `compact`.
- **Natural in outcome (fault C).** A row's page is at least its bars' natural width with
  slack, the draw is read back from the engraver's layout, and `data-stretch` says what came
  out. This also ended a squeeze nobody had named: a dense bar wider than a stage's width per
  bar was engraved narrower than its natural spacing (Hot Cross Buns' eight quavers on a
  360 px phone at 0.79 of natural); it is now drawn at natural spacing and smaller.
- **A staff is its five lines (fault D).** One measurement for the renderer's floor, the
  read-ahead, every spec and the tour camera. The same mistake had padded every system's
  height reserve with the ink above its stave (Hot Cross Buns reserved 177 px at zoom 2 for
  systems whose ink is 145), so a window the height sizes is now as tall as its ink allows:
  Twinkle's right hand at 880 x 412 went from a 109 px to a 142 px five-line staff and now
  holds one bar and the next one's first note where it held two; Twinkle hands together on a
  tablet held sideways, 113 to 117.
  The floor's number on the new measure is provisional at 22 px (what the old floor enforced
  on a plain staff) and is a question for the owner, with the table: on the 80 upright and
  tall cells of `score.window-rule`'s grid, 22 or 25 px changes no count, 30 px five, the
  documented 40 px nine.
- **Consequences on the sheet and the sweep, stated.** With the reserve exact, a phone's folded
  chrome pushed a sideways sheet's bottom 18 px off the stage mid-run; the fit now keeps the
  fold's room for a run from its start. Splits within a fiftieth of each other now go to the one
  that keeps the next music in view (`SPLIT_TIE`). And one cell moved into E's class: on a tablet upright, Twinkle at two
  bars is one row of two bars drawn 18 % larger than one bar a row, so by rule 2 as written
  there is no room for the next row below — the cell had the next bar before only because the
  old price made the one-row split look smaller than it draws. Whether the look-ahead should
  win there is D7, the owner's. The sweep shows the same rule at a phone's height: Hot Cross
  Buns at rest keeps its greyed next row up to 440 px wide and has none from 480 px, where the
  window's two rows, growing with the width, leave no row's height below them.
