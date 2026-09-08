# 08 — What the score screen draws, and when

**Status:** specification. Written 2026-09-08 by reading the code at `7f7538f`, the decision
records for P21b–P21e, and `04` §5. Where this document and the code disagree, **this document
is the intent** and the difference is a bug in one of them — that is what it is for.

## 0. How to read this

The score screen is not a view with options. It is a **state machine with one job**: put the
notes you are about to play in front of your eyes, large, still, and early enough to read.
Everything below follows from that sentence, and every rule here that looks arbitrary is a rule
that stops something moving under the eye of someone trying to read it.

Three principles decide every question in this document:

- **P1 — Stillness beats information.** A staff that changes size, position, or brightness
  while you are reading it costs more than whatever the change was telling you. Anything that
  can be decided once per piece is decided once per piece.
- **P2 — Read-ahead is the product.** A beginner reads roughly one bar ahead. The screen's
  purpose is to make that bar available *before* it is needed, not as it is needed.
- **P3 — Never lie, and never mark what you do not know.** An overlay that points at the wrong
  note is worse than no overlay. When the app cannot place a mark truthfully, it draws nothing.

Sections 1–5 define the states. Section 6–7 are the matrices. **Section 8 is the transition
table** and **section 9 is the list of invariants** — those two are what a reviewer should diff
against the code first, because they are falsifiable.

---

## 1. The state vector

Everything drawn is a pure function of these. Nothing else may influence it; in particular
nothing may depend on *how* a state was reached, except where §8 says so explicitly.

### 1.1 Route and item

| Name | Values | Source |
|---|---|---|
| `itemId` | catalog id | route |
| `blind` | `true` \| `false` | `?blind=1` |
| `performance` | `true` \| `false` | `?performance=1` |
| `sightReading` | `true` \| `false` | derived from the item |

### 1.2 Chosen on the screen

| Name | Values | Default | Where |
|---|---|---|---|
| `mode` | `wait` \| `tempo` \| `listen` \| `free` | from settings | bar |
| `hands` | `R` \| `L` \| `both` | `both` | bar |
| `tempoPct` | 30–130 | `defaultTempoPct` | bar → sheet |
| `input` | `midi` \| `mic` \| `keys` \| `none` | resolved | `⋯` |
| `loop` | `null` \| printed bar range | `null` | `⋯` / double-tap |
| `hearing` | `true` \| `false` | `false` | `Hear it` |
| `hearingBar` | `null` \| printed bar | `null` | long-press |

### 1.3 Settings that change what is drawn

`barsPerWindow` (1–8) · `layout` (`window` \| `scroll`) · `zoom` (0.5–2, the owner's multiplier)
· `keys` (`strip` \| `ribbon` \| `off`) · `showFingering` · `showNoteNames` · `showChordSymbols`
· `countInBars` · `playbackHands` · `playbackDestination` · `landscapeLock` · theme.

### 1.4 Environment

| Name | Values | Rule |
|---|---|---|
| `orientation` | `upright` \| `sideways` | `innerHeight > innerWidth` |
| `tall` | `true` \| `false` | `innerHeight >= 600` |
| `tablet` | `true` \| `false` | `min(w, h) >= 900` |
| `theme` | `light` \| `dark` | `data-theme` on the root |
| `reducedMotion` | `true` \| `false` | `prefers-reduced-motion` |

**Sizes this must be correct at.** Phone upright 360×780 and 412×915; phone sideways 780×360
and 915×412; tablet 900×1200 and 1200×900. 360×780 is the owner's own phone and is the binding
case for every "does it fit" question in this document.

---

## 2. The arrangement machine

**State:** `arrangement ∈ { slots, chunk, scroll }`. Written to `.score-view[data-read-ahead]`
as `slots` \| `single`, with `chunk` a sub-state of `single`.

```
              layout = scroll ─────────────────────────► SCROLL
                    │
   layout = window ─┤
                    ├─ barsPerWindow ≥ 2 AND (upright OR tall) ──► SLOTS
                    └─ otherwise ───────────────────────────────► CHUNK
```

- **SLOTS** — two systems stacked, both visible, each holding `max(1, ⌊barsPerWindow / 2⌋)`
  printed bars. Upright on a phone, and on any screen ≥ 600 px tall including a tablet
  sideways and a desktop.
- **CHUNK** — one system, engraved with the window plus **two bars behind and two ahead**, slid
  horizontally. A phone sideways (< 600 px tall), and any screen at `barsPerWindow = 1`, where
  there is nothing to alternate.
- **SCROLL** — the whole piece, one column, auto-scrolled. Chosen explicitly in `⋯ → Layout`.

**Why the 600 px line and not orientation.** Two systems need vertical room, not portraitness. A
tablet held sideways has 900 px of height and reading two systems there is strictly better than
sliding one. A phone sideways has 360 px, where a second system would halve a staff that is
already the smallest it may be.

**Transitions.** The arrangement is re-derived on every step and on every resize. A change to it
discards everything drawn (§8.4) — the two arrangements share no state, and reusing a slot
across the boundary is how a landscape screen ends up with half a portrait layout in it.

---

## 3. The size machine — the single most important state

> **P1.** The size of a staff line is decided once per piece and does not change while the piece
> is being played. This is the rule the screen has broken most often and the one a reader
> notices fastest.

### 3.1 Two independent sizes

They are constantly confused and must not be:

- **The engraving zoom** — what OSMD lays the score out at. Changing it re-renders and
  recreates every note element. Expensive, and destroys the id→element map.
- **The drawn scale** — a CSS `transform: scale()` on the slot wrapper. Free, and leaves every
  element identical.

The owner's `zoom` setting is a **multiplier on the drawn scale**, never an engraving zoom.
`1.0` means "as large as fits"; the buttons move around that.

### 3.2 How the scale is chosen

1. **A probe engraves the whole score once**, into a third `OsmdView` that is never shown, on
   idle a frame after the first paint, capped at the first 48 bars.
2. Every drawn element is bucketed to its nearest **system** by y. For each system, measure how
   far its ink reaches above the top stave line, the staves' own span, and how far below.
3. The fit targets the **upper quartile** of those extents, not the maximum. A single freak bar
   — two ledger lines below in one measure of an eight-bar song — otherwise costs 40 % of the
   size everywhere, permanently, to spare one bar a single shrink.
4. Until the probe has answered, the tallest window seen so far stands in. That stand-in is
   **never released upward**: the scale may tighten, never grow.

### 3.3 When the scale may change

| Event | May the scale change? |
|---|---|
| A new window is drawn | **No.** This is the whole rule. |
| The cursor crosses into the other slot | **No.** |
| A slot goes blank at the end of the piece | **No.** The remaining slot keeps its size. |
| The probe's measurement arrives | Yes — but not during a run (§3.4). |
| The owner presses Size | Yes, immediately. |
| The stage is resized by more than a few px | Yes. |
| The device is rotated | Yes. The frozen scale is released. |
| `barsPerWindow` or `layout` changes | Yes. |
| A different piece is opened | Yes. |

### 3.4 Freezing for a run

Starting a run **freezes the scale**, after a short wait for the stage to settle into whatever
height the control bar leaves it. A probe measurement that arrives mid-run is held and applied
at the next fit after the run. A rotation releases the freeze — the question has genuinely
changed.

### 3.5 Placement

Slots are placed on the **stave**, not on the ink box. A window with a chord symbol above it and
one without must put their stave lines at the same y; placing on the ink makes the staff jump by
the height of whatever happens to be drawn above it. The ink box is still what the *width* fit
uses, because OSMD lays a window out on a page the full width of the container and inks only
part of it — fitting to the page leaves the notation at a fifth of the screen sideways.

Air: **6 px** inset on every side, and nothing else. OSMD's own page margins are zero and the
metronome mark is not drawn on this screen — the bar already says the bpm.

---

## 4. What is on the screen — the window machine

### 4.1 SLOTS

Slot 0 is above slot 1. Exactly one slot holds the cursor; that slot is **never re-drawn while
it holds it**.

```
cursor in slot A, showing block k        other slot shows block k+1
        │
        │ cursor's bar enters block k+1 (which the other slot already holds)
        ▼
cursor slot becomes B (untouched, already drawn)
slot A is re-drawn with block k+2, faded in over ~150 ms, on idle (≤ 100 ms later)
```

- The swap of *which slot is current* is a class toggle and happens in the same frame as the
  step. The **re-draw of the vacated slot is deferred to idle** — it must never share a frame
  with colouring the note just played.
- The fade is ~150 ms and is suppressed under `reducedMotion`. Peripheral vision ignores a fade
  and notices a flash; that is the entire reason it exists.
- **"What comes next" follows the playing order, not the printed order.** The next block is the
  block containing the bar of the next *step*. At a repeat that is the repeat's first bar; at a
  first/second-time ending it is the ending that will actually be played on this pass.
- The last bars of a piece leave the other slot **blank** — not a repeat of bars already
  played, and not stretched to fill the space.

### 4.2 CHUNK

One system. The engraved range is the window **plus two bars behind and two ahead**, so a fresh
chunk never starts at the bar being played.

- The sheet slides **left only**, by bar, **at the barline**. A sheet that moves under a note
  being read is worse than one that jumps once a bar.
- The cursor is held between **25 % and 45 %** of the stage width, targeting a third.
- The sheet never slides past the start of the piece: bar 1 sits where it was engraved rather
  than being pushed into the middle of an empty stage.
- The next chunk is pre-rendered into the spare view **in the same shape**, so the swap is a
  class toggle and the same bars sit at the same x on both sheets — the swap is invisible.
- Sideways the width is deliberately **not** a fit constraint: the read-ahead bars run off the
  right edge, which is what there is to slide towards.

### 4.3 SCROLL

The whole piece in one column. Auto-scroll keeps the cursor between **25 % and 40 %** of the
viewport height. A manual scroll suspends auto-scroll for **5 s**, so the reader can look ahead
without being yanked back.

---

## 5. Overlays and effects

Each is defined by *when it is drawn*, *when it is not*, and *what it must never do*.

### 5.1 The cursor band

A translucent vertical band over the current step's notes, spanning the **stave the note is
on** — not the whole stage. A full-height stripe reads as a rendering fault; it also crosses the
title, the chord symbols and, sideways, the control bar.

- Drawn whenever a step is current, in every mode including Free.
- A step with no drawn element — a rest, a tie continuation — borrows the nearest step's
  position. This is correct for "you are here".
- Follows a refit: a band left at its old position after the sheet is rescaled is pointing at
  the wrong note (**P3**).

### 5.2 The read-ahead warning

A **line under the stave** beneath the next step — *not* a second band. Two translucent bands of
the same shape at different opacities read as one smeared cursor; the owner saw exactly that.

- Drawn only in **Tempo** and **Listen** (including a `Hear it` run), where a clock moves
  whether or not the reader is ready.
- **Not** drawn in Wait — there is no clock to be ahead of, and marking a note nobody is going
  to reach yet tells a beginner to hurry.
- **Not** drawn in Free — there are no expectations.
- Refuses the nearest-element fallback the cursor uses. If the coming step is not drawn (past
  the end of the other slot), it draws **nothing** (**P3**).

### 5.3 Note colouring

Classes on note groups, never a re-render.

| State | Colour | Meaning |
|---|---|---|
| `current` | accent | the step being waited for or played |
| `correct` | green + ✓ | heard and matched |
| `wrong` | red + ✗ | heard and wrong |
| `uncertain` | amber + ? | the microphone's "I may not have heard it" |

`uncertain` is never red. Below the confidence floor the app can say it did not hear what it
expected; it cannot say the learner played the wrong note, and painting that red is the app
blaming a person for its own microphone.

Colours clear at the start of a run and at the start of each **lap** of a loop — last lap's
mistakes read as this lap's.

### 5.4 The keys view

`keys ∈ { strip, ribbon, off }`, under the stage.

- **strip** — the piece's range as keys. 108 px upright, **56 px sideways**, where height is the
  scarce thing and the keys are as wide as before.
- **ribbon** — the same information as a 32 px band with the wanted note's **name** over it
  (`F♯4`). A third of the height, and it names the note, which is what an evening lost to an
  unfindable F♯4 was missing.
- **off** — nothing.

Key states: `next` (paler blue, behind), `expected` (blue), `pressed`, `correct`, `wrong`,
`uncertain`. `next` is applied **before** `expected`, so a key that is both stays the bright
one. The `next` key follows the same mode rule as §5.2.

The strip is tappable and feeds the shared screen-keyboard input: for a learner with no cable,
this *is* the instrument.

### 5.5 The count-in

Drawn over the notation during the count-in only: the bar's beats, large, current one lit,
counted from the **piece's own time signature** (counting four over a waltz is counting a bar
that does not exist). The first step's band is in place from the first click, so the eye is
already on the note when the bar starts.

Tempo and Listen only. Wait and Free have no count-in.

### 5.6 The beat dot

A small dot in the header that pulses on each beat and brighter on beat 1. How a player checks
the tempo without hearing the click, which next to a piano is most of the time. Tempo and Listen
only; suppressed under `reducedMotion`.

### 5.7 The control bar

**One row, in every form factor.** This is a hard constraint, not a target: at 360 px the row's
`scrollHeight` must equal one row's height. It has broken twice.

Contents, in order: `▶`/`⏸` · `Hear it` · mode · hands (`R` `L` `Both`) · tempo label · `⋯`.
Below 400 px the modes shorten to one word each and the tempo label drops the percentage.
`Start again` is in the `⋯` sheet — the test for the bar is *do you need this while your hands
are on the keys?*

Auto-hide: the bar hides 3 s into a run **only when it would otherwise take room from the
music**. Upright, where the sheet does not reach the bottom of the stage, it stays. During a run
the stage takes the bar's row, and the bar overlays the bottom of the sheet when asked back —
overlapping is acceptable at the moment you asked for it.

### 5.8 The status line

The app's own voice, one line. It says: what it is waiting for (Wait, when note names are on),
that a hand is being played for you (once per run), that a run was paused and for how long, that
a bar is being demonstrated, and errors. It must never still say `Playing` over a finished run.

### 5.9 Blind mode

The engraving is laid out and **hidden**, never skipped. The model, the expectations, the
scoring and the keys are identical, so a blind run and a sighted run are comparable — which is
the feature. The status line says why the screen is empty, or a black rectangle reads as broken.

### 5.10 Dark theme

Notation is inverted (`invert(1) hue-rotate(180deg)`) wherever an `OsmdView` is visible: the
score slots, the drill's notation, the PDF page and its adjust thumbnail. Everywhere, or the one
that was missed is the brightest thing in a dark room.

### 5.11 The tablet side panel

≥ 900 px on the short side: a 320 px column of the lesson's prose beside the stage. Built
hidden; revealed only when there is text. A piece with no lesson gets no empty column and the
stage takes the width.

---

## 6. Mode × overlay

| | Wait | Tempo | Listen / `Hear it` | Free |
|---|---|---|---|---|
| Cursor band | ✓ | ✓ | ✓ | ✓ |
| Read-ahead line | — | ✓ | ✓ | — |
| `next` key on the strip | — | ✓ | ✓ | — |
| `expected` key | ✓ | ✓ | ✓ | — |
| Count-in | — | ✓ | ✓ | — |
| Beat dot | — | ✓ | ✓ | — |
| Note colouring | ✓ | ✓ | — | — |
| Advances on | your notes | the clock | the clock | your notes |
| Summary at the end | ✓ | ✓ | — | — |

`Hear it` is a Listen run that **does not move the mode select**: what it interrupts is restored
when it ends, and `▶` during one ends it and starts the run you chose. A long-pressed bar is a
one-bar Listen run that stops after one pass and puts the screen back.

---

## 7. Orientation × size

| | Phone upright 360×780 | Phone sideways 780×360 | Tablet upright 900×1200 | Tablet sideways 1200×900 |
|---|---|---|---|---|
| Arrangement | SLOTS | CHUNK | SLOTS | SLOTS |
| Header row | drawn | **not drawn** — Back, title and status mirror into the bar's left end | drawn | drawn |
| Bars per window | 2 | 2 | 4 | as many as fill the height |
| Keys | strip 108 px | strip 56 px / ribbon 32 px | strip | strip |
| Side panel | — | — | ✓ | ✓ |
| Bar auto-hides | no | yes | no | no |

**The tablet rule.** The window holds as many bars as fill the stage's height at the
width-limited size, rather than a fixed four. A number the owner has set always wins; the rule
is the default under it.

---

## 8. Transitions — what redraws, and when

### 8.1 A step advances within the current window

Class toggles only. Band moves, note states repaint, keys repaint. **No engraving, no fit, no
transform write.**

### 8.2 A step advances across a window boundary

- **SLOTS:** cursor slot changes (class toggle, same frame). Vacated slot re-drawn **on idle,
  ≤ 100 ms**, faded. Scale unchanged.
- **CHUNK:** if the next chunk is prepared, a class toggle and a slide; otherwise draw in place.
  Scale unchanged. A prepared swap must not force a layout.

### 8.3 A run starts

Freeze the scale (after the stage settles) → count-in overlay if the mode has one → status line
says which hand is played, once → bar arms its auto-hide → colours cleared.

### 8.4 The arrangement changes (rotation, layout, bars)

Discard both slots' ranges and elements, release the frozen scale, re-derive the arrangement,
draw from the current step. Nothing is carried across.

### 8.5 A run stops vs. a run finishes

**These are different events and conflating them is the bug that recorded half-runs as
failures.**

| | Stop | Finish |
|---|---|---|
| Caused by | restarting with new options, `Hear it` ending, leaving | reaching the last step |
| Summary sheet | **no** | yes |
| Recorded | **no** | yes |
| Colours | cleared | kept until the sheet closes |

A **lap** of a loop is neither: the engine moves back, the cursor must be told, colours clear,
and no summary opens.

### 8.6 A refit happens

Every band and every overlay anchored to a note is repositioned. A band that survives a refit
unmoved points at the wrong note.

---

## 9. Invariants

Numbered so a reviewer can cite them. Each is falsifiable and most are already testable.

1. **One size per run.** The drawn scale is identical at every frame between a run starting and
   finishing. *(sequence log: one scale at all frames, both orientations)*
2. **Staves at one height.** The stave lines sit at the same y in every window of a piece.
3. **The cursor's system is never re-drawn.** In SLOTS, the `<svg>` holding the cursor is the
   same DOM node for every step within its block.
4. **The next bar is on the screen.** At every step but the last, the bar of the next step is
   drawn somewhere.
5. **One row.** The control bar's `scrollHeight` is one row's height at 360, 390, 412, 780 and
   1200 px wide.
6. **No overlay outlives its anchor.** After any refit, rotation, or window change, every band
   is over the note it names or hidden.
7. **No mark without knowledge.** The read-ahead line is drawn only when the coming step is
   actually drawn.
8. **A swap costs a frame.** A prepared swap does no engraving, no fit and no forced layout.
9. **A stop is not a finish.** No summary and no recorded run from a stop.
10. **Colour survives no lap.** Judgements clear at the start of every lap.
11. **Hidden means gone.** Anything the code hides has no box — `[hidden]` loses a specificity
    tie to any class rule that sets `display`, and this has cost four screens.
12. **Dark ink everywhere.** Every visible `OsmdView` and the PDF page invert under the dark
    theme.
13. **Blind hides, never skips.** The engraving exists and is laid out; only its visibility
    differs.
14. **The mode select is the mode you chose.** A demonstration never moves it.
15. **Bar numbers are as printed, 1-based**, at every boundary between a gesture and the engine.

---

## 10. Open questions and known divergences

Listed so a reviewer knows what is deliberate and what is not.

1. **Bar numbering.** Authored songs number their first measure `0`, so the sheet prints `0` on
   the first system. Only a pickup may be bar 0. *(P21e A4, open)*
2. **`ink-flush` in the audit** measures the whole sheet, which under CHUNK is wider than the
   stage by design, and reports large negative insets on every sideways score scene. It should
   measure the ink **clipped to the stage**. *(P21e C3, open)*
3. **The folder row** is 102 px against a 96 px budget. *(P21e D1 proposes badges → detail
   tokens)*
4. **`barsPerWindow` stays at 2** upright — one bar per slot, a full bar of warning. The owner
   chooses in first-run setup. *(decided)*
5. **The read-ahead line replaced the second band** after the owner reported "two cursors". This
   document specifies the line; anything still drawing a band is stale.
6. **Free play** currently draws the cursor. Whether a mode with no expectations should mark a
   current note at all is a real question and is not settled here.

---

## 11. What to check first

If a reviewer has an hour, diff in this order — highest yield first:

1. §9 invariants 1, 2, 3 and 4 — the reading experience is these four.
2. §8.5 — the stop/finish table.
3. §5.2 and §6 — whether the read-ahead follows the mode rules, and whether it is a line.
4. §2 — whether the arrangement is derived from height rather than orientation.
5. §3.3 — the table of what may change the scale, against every write of a transform.
