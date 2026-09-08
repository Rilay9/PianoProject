# 08 — What the score screen draws, and when

**Status:** specification. Written 2026-09-08 by reading the code at `7f7538f`, the decision
records for P21b–P21e, and `04` §5. Where this document and the code disagree, **this document
is the intent** and the difference is a bug in one of them — that is what it is for.

## 0. How to read this

The score screen is not a view with options. It is a **state machine with one job**: put the
notes you are about to play in front of your eyes, large, still, and early enough to read.
Everything below follows from that sentence, and every rule that looks arbitrary is a rule that
stops something moving under the eye of someone trying to read it.

Four principles decide every question here:

- **P1 — Stillness beats information.** A staff that changes size, position or brightness while
  you are reading costs more than whatever the change was telling you. Anything that can be
  decided once per piece is decided once per piece.
- **P2 — Read-ahead is the product.** A beginner reads about a bar ahead. The screen's purpose
  is to make that bar available *before* it is needed, not as it is needed.
- **P3 — Never lie, and never mark what you do not know.** An overlay pointing at the wrong note
  is worse than no overlay. Where the app cannot place a mark truthfully it draws nothing.
- **P4 — Every state is reachable and every state is leavable.** No screen may be a dead end, a
  black rectangle, or a spinner with no way back. This is what most of §1.5 is about.

§§1–5 define the states. §§6–7 are the matrices. **§8 is the transition table**, **§9 the
invariants** and **§10 the edge cases** — those three are what to diff against the code first,
because they are falsifiable.

**Scope.** This document is the **Score screen**: `ScoreScreen`, `WindowRenderer`, `slots.ts`
and the overlays those three own. It is *not* the drill screen's four-bar notation
(`#drill-notation`) or the PDF viewer, which draw music by different machinery and have their
own rules. Two rules cross all three and are stated here because they have been broken in each:
**dark ink** (§5.15) and **hidden means gone** (§9.11). Where this document says "every visible
`OsmdView`", it means all three.

---

## 1. The state vector

Everything drawn is a pure function of these. Nothing else may influence it, and nothing may
depend on *how* a state was reached except where §8 says so.

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
| `input` | `midi` \| `mic` \| `keys` \| `none` | resolved by priority | `⋯` |
| `loop` | `null` \| printed bar range | `null` | `⋯` / double-tap / section |
| `hearing` | `true` \| `false` | `false` | `Hear it` |
| `hearingBar` | `null` \| printed bar | `null` | long-press |
| `metronomeOn` | `true` \| `false` | `false` | `⋯` |

### 1.3 Settings that change what is drawn

`barsPerWindow` (1–8) · `layout` (`window` \| `scroll`) · `zoom` (0.5–2, the owner's multiplier)
· `keys` (`strip` \| `ribbon` \| `off`) · `showFingering` · `showNoteNames` · `showChordSymbols`
· `countInBars` · `waitStrict` · `toleranceMs` · `playbackHands` · `playbackDestination` ·
`landscapeLock` · `keepScreenAwake` · `strictMicScoring` · `micChordLeniencyPct` · theme.

**Which of these re-engrave** (expensive, recreates every note element, must never happen
mid-run): `showFingering`, `showChordSymbols`, `barsPerWindow`, `layout`. **Which are free**
(class or transform only): `zoom`, `keys`, `hands`, `showNoteNames`, theme.

### 1.4 Environment

| Name | Values | Rule |
|---|---|---|
| `orientation` | `upright` \| `sideways` | `innerHeight > innerWidth` |
| `tall` | `true` \| `false` | `innerHeight >= 600` |
| `tablet` | `true` \| `false` | `min(w, h) >= 900` |
| `theme` | `light` \| `dark` | `data-theme` on the root |
| `reducedMotion` | `true` \| `false` | `prefers-reduced-motion` |
| `pageVisible` | `true` \| `false` | `document.visibilityState` |

**Sizes this must be correct at.** Phone upright 360×780 and 412×915; phone sideways 780×360 and
915×412; tablet 900×1200 and 1200×900. **360×780 is the owner's own phone and is the binding
case** for every "does it fit" question in this document.

### 1.5 The screen's lifecycle — before there is a score

A state machine that starts before any of §2–§5 applies. Every terminal state here must say what
happened and leave a way out (**P4**).

```
             ┌──────────► UNKNOWN ITEM   "Unknown item “x”." + Back
             │
  OPENING ───┼──────────► NOT NOTATION   "…is a PDF — open it from Library." + Back
  (Loading…) │            "…has no notation to open." + the import hint
             │
             ├──────────► FAILED         "That score could not be opened: …" (status--error)
             │
             └──────────► READY ─────────► the rest of this document
```

- **OPENING** draws the header, the bar and the empty stage with `Loading…` in the status line.
  The bar is live but a run cannot start; the stage has its final height already, so the fit
  does not move when the score arrives.
- The three terminal states are **not** dead ends: Back is in the header (upright) or the bar's
  left end (sideways), and the status line says which of the three happened and why.
- **Sight-reading** generates fresh material each time the screen is opened — the whole point is
  material never seen before. `Again` on the summary re-runs the *loaded* score rather than
  regenerating, and only the first attempt is recorded.

---

## 2. The arrangement machine

**State:** `arrangement ∈ { slots, chunk, scroll }`, written to `.score-view[data-read-ahead]`
as `slots` \| `single`.

```
              layout = scroll ─────────────────────────► SCROLL
                    │
   layout = window ─┤
                    ├─ barsPerWindow ≥ 2 AND (upright OR tall) ──► SLOTS
                    └─ otherwise ───────────────────────────────► CHUNK
```

- **SLOTS** — two systems stacked, both visible, each holding `max(1, ⌊barsPerWindow / 2⌋)`
  printed bars. Phone upright, and any screen ≥ 600 px tall including a tablet sideways.
- **CHUNK** — one system, engraved with the window **plus two bars behind and two ahead**, slid
  horizontally. Phone sideways, and any screen at `barsPerWindow = 1`.
- **SCROLL** — the whole piece in one column, auto-scrolled. Chosen in `⋯ → Layout`.

**Why height and not orientation.** Two systems need vertical room, not portraitness. A tablet
sideways has 900 px and reading two systems there beats sliding one; a phone sideways has 360,
where a second system halves a staff already at its minimum.

A change of arrangement discards everything drawn (§8.4). The arrangements share no state, and
reusing a slot across the boundary is how a landscape screen ends up with half a portrait layout
in it.

---

## 3. The size machine — the most important state

> **P1.** The size of a staff line is decided once per piece and does not change while the piece
> is being played. This is the rule the screen has broken most often and the one a reader
> notices fastest.

### 3.1 Two independent sizes, constantly confused

- **The engraving zoom** — what OSMD lays out at. Re-renders, recreates every note element,
  destroys the id→element map. Expensive.
- **The drawn scale** — a CSS `transform: scale()` on the slot wrapper. Free, leaves every
  element identical.

The owner's `zoom` setting is a **multiplier on the drawn scale**, never an engraving zoom.
`1.0` means "as large as fits"; the buttons move around that. **The buttons must be monotonic**:
a press of "smaller" must produce a smaller sheet than before it, always. (They once did not:
zoom re-engraved *and* multiplied, and the fit search then climbed back to a different
engraving.)

### 3.2 How the scale is chosen

1. A **probe** engraves the whole score once into a third `OsmdView` that is never shown, on
   idle a frame after the first paint, capped at the first 48 bars.
2. Every drawn element is bucketed to its nearest **system** by y. Each system's extent is
   measured: how far its ink reaches above the top stave line, the staves' own span, how far
   below.
3. The fit targets the **upper quartile** of those extents, not the maximum. One freak bar — two
   ledger lines below, in one measure of an eight-bar song — otherwise costs 40 % of the size
   everywhere, permanently, to spare that bar a single shrink.
4. Until the probe answers, the tallest window seen so far stands in, and **is never released
   upward**: the scale may tighten, never grow.

**Why not eagerly.** Loading the probe eagerly doubled the longest score's open time — 108 s
against a 60 s budget under a fourfold throttle.

### 3.3 When the scale may change

| Event | May the scale change? |
|---|---|
| A new window is drawn | **No.** This is the whole rule. |
| The cursor crosses into the other slot | **No.** |
| The end of the piece is reached | **No.** The other slot fills with the bars behind, at the same size. |
| A loop lap returns to the start | **No.** |
| The probe's measurement arrives | Yes — **but not during a run** (§3.4). |
| The owner presses Size | Yes, immediately. |
| The stage is resized by more than a few px | Yes. |
| The device is rotated | Yes; the frozen scale is released. |
| `barsPerWindow`, `layout`, fingering or chord symbols change | Yes. |
| A different piece is opened | Yes. |

### 3.4 Freezing for a run

Starting a run **freezes the scale**, after a short wait for the stage to settle into the height
the control bar leaves it. A probe measurement arriving mid-run is held and applied at the next
fit after the run — a measurement arriving late is the size change again, just later. A rotation
releases the freeze: the question has genuinely changed.

### 3.5 Placement

Slots are placed on the **stave**, not the ink box. A window with a chord symbol above it and
one without must put their stave lines at the same y; placing on ink makes the staff jump by the
height of whatever happens to be drawn above it. The ink box is still what the **width** fit
uses, because OSMD lays a window out on a page the full width of the container and inks only
part of it — fitting to the page leaves the notation at a fifth of the screen sideways.

Air: **6 px** inset each side and nothing else. OSMD's page margins are zero; the metronome mark
is not drawn here (the bar says the bpm).

---

## 4. The window machine

### 4.1 SLOTS

Slot 0 above slot 1. Exactly one slot holds the cursor and **is never re-drawn while it does**.

```
cursor in slot A showing block k          other slot shows block k+1
        │
        │ cursor's bar enters block k+1 (already drawn in the other slot)
        ▼
cursor slot becomes B — untouched, already on the screen
slot A re-drawn with block k+2, faded ~150 ms, ON IDLE (≤ 100 ms later)
```

- The change of *which slot is current* is a class toggle in the same frame as the step. The
  **re-draw of the vacated slot is deferred to idle** and must never share a frame with
  colouring the note just played.
- The fade is ~150 ms, suppressed under `reducedMotion`. Peripheral vision ignores a fade and
  notices a flash; that is the entire reason it exists.
- **"What comes next" follows the playing order.** The next block holds the bar of the next
  *step*: at a repeat, the repeat's first bar; at a first/second-time ending, the ending that
  will actually be played on this pass.
- **At the end of a piece the other slot shows the bars just played**, not blank. A blank slot
  is half the screen gone black for the last bars of every song, with the final bar alone at the
  bottom — which is what the pictures showed. The bars behind are what a paper page would have
  there, and they are chosen in **playing** order too: at a second-time ending the slot shows the
  bar before the ending, not the first ending printed above it.
- The remaining slot never stretches to fill the space. Its size is the piece's size (§3).
- A piece with **nothing behind and nothing ahead** — a one-bar piece — is the only case that
  leaves a slot genuinely blank.

### 4.2 CHUNK

One system, engraved as the window **plus two behind and two ahead**, so a fresh chunk never
starts at the bar being played.

- Slides **left only**, **by bar, at the barline**. A sheet that moves under a note being read
  is worse than one that jumps once a bar.
- The cursor is held between **25 % and 45 %** of the stage width, targeting a third.
- Never slides past the start: bar 1 sits where it was engraved rather than being pushed into
  the middle of an empty stage.
- The next chunk is pre-rendered **in the same shape**, so the same bars sit at the same x on
  both sheets and the swap is invisible.
- Sideways the width is deliberately **not** a fit constraint: the read-ahead bars run off the
  right edge, which is what there is to slide towards.

### 4.3 SCROLL

The whole piece, one column. Auto-scroll keeps the cursor between **25 % and 40 %** of viewport
height; a manual scroll suspends it for **5 s** so the reader can look ahead without being
yanked back. Under `reducedMotion` the scroll is immediate rather than smooth.

---

## 5. Overlays and effects

Each defined by *when drawn*, *when not*, and *what it must never do*.

### 5.1 The cursor band

A translucent band over the current step's notes, spanning **the stave the note is on** — not
the whole stage. A full-height stripe reads as a rendering fault and crosses the title, the
chord symbols and, sideways, the control bar.

- Drawn whenever a step is current.
- A step with no drawn element (a rest, a tie continuation) borrows the nearest step's position.
  Correct for "you are here".
- **Follows every refit.** A band left at its old position after a rescale points at the wrong
  note (**P3**).

### 5.2 The read-ahead warning

A **line under the stave** beneath the next step — *not* a second band. Two translucent bands of
the same shape at different opacities read as one smeared cursor; the owner reported exactly
that ("two cursors").

- **Tempo and Listen only** (including `Hear it`), where a clock moves whether or not the reader
  is ready.
- **Not in Wait** — no clock to be ahead of, and marking a note nobody will reach yet tells a
  beginner to hurry. **Not in Free** — no expectations.
- Refuses the nearest-element fallback the cursor uses: if the coming step is not drawn, it
  draws **nothing** (**P3**).

### 5.3 Note colouring

Classes on note groups, never a re-render.

| State | Colour | Meaning |
|---|---|---|
| `current` | accent | the step being waited for or played |
| `correct` | green + ✓ | heard and matched |
| `wrong` | red + ✗ | heard and wrong |
| `uncertain` | amber + ? | the microphone's "I may not have heard it" |

`uncertain` is never red. Below the confidence floor the app can say it did not hear what it
expected; it cannot say the learner played the wrong note, and red is the app blaming a person
for its own microphone.

Colours clear at the start of a run **and at the start of each lap** of a loop — last lap's
mistakes read as this lap's.

### 5.4 Hand focus

`R` or `L` dims the other hand's notes (a class on the view, not a re-render). Dimmed, never
hidden: the other hand is context you read past, and removing it changes what the page looks
like.

### 5.5 The keys view

`keys ∈ { strip, ribbon, off }`, under the stage.

- **strip** — the piece's range as keys. 108 px upright, **56 px sideways** where height is
  scarce; the keys stay as wide as before.
- **ribbon** — the same information as a 32 px band with the wanted note's **name** over it
  (`F♯4`). A third of the height, and it names the note — which is what an evening lost to an
  unfindable F♯4 was missing.
- **off** — nothing.

Key states: `next` (paler blue, behind), `expected` (blue), `pressed`, `correct`, `wrong`,
`uncertain`. `next` is applied **before** `expected`, so a key that is both stays the bright
one. `next` follows §5.2's mode rule.

The strip is tappable and feeds the shared screen-keyboard input: with no cable, this *is* the
instrument. It scrolls to keep the wanted note in view, and does nothing when it is already
comfortably visible.

### 5.6 The count-in

Over the notation, during the count-in only: the bar's beats, large, the current one lit,
counted from the **piece's own time signature** (four over a waltz counts a bar that does not
exist). The first step's band is in place from the first click, so the eye is on the note before
the bar starts. Tempo and Listen only.

### 5.7 The beat dot

In the header, pulsing each beat, brighter on beat 1 — how a player checks the tempo without
hearing the click, which next to a piano is most of the time. Tempo and Listen only; suppressed
under `reducedMotion`.

### 5.8 The control bar

**One row, in every form factor.** A hard constraint: at 360 px the row's `scrollHeight` equals
one row's height. It has broken twice.

`▶`/`⏸` · `Hear it` · mode · hands · tempo label · `⋯`. Below 400 px the modes shorten to one
word and the tempo label drops the percentage. `Start again` is in `⋯` — the test for the bar is
*do you need this while your hands are on the keys?*

Auto-hide: hides 3 s into a run **only where it would otherwise take room from the music**.
Upright, where the sheet does not reach the bottom of the stage, it stays. During a run the
stage takes the bar's row; the bar overlays the bottom of the sheet when asked back, which is
acceptable at the moment you asked for it.

### 5.9 The status line, and the waiting line

**Two elements, not one**, and they say different kinds of thing.

- **The status line** is the app's own voice about the *session*: that a hand is being played
  for you (**once** per run), that a run was paused and for how long, that a bar is being
  demonstrated, that the microphone failed and the clock is standing in, why the screen is
  blind, and errors. It must never still say `Playing` over a finished run.
- **The waiting line** names the note being waited for — `Waiting for D4` — and exists only
  when `showNoteNames` is on **and** the mode is Wait **and** a run is going. In a clock-driven
  mode nothing is ever waited for and a line saying otherwise describes a different app. It is
  hidden, not blank, when it has nothing to say, so it costs no height.

Sideways on a phone the header row is not drawn and both are **mirrored into the control bar's
left end**, kept in sync with the originals. The originals remain the source of truth; anything
writing to the mirror instead will be overwritten.

### 5.10 Things that are audible and change nothing drawn

Listed so a reviewer does not go looking for a visual for them.

- **The metronome** (`⋯ → Metronome`) is sound only. It does not draw the beat dot — that
  follows the mode's clock and appears in Tempo and Listen whether or not the click is audible,
  which is the point of it.
- **Playback of the other hand** is sound only; the notes are not coloured as though played.
- **Input transposition** shifts what arrives from the piano before it is matched. The score is
  drawn **as written**, always. A transposed input that matches is coloured correct on the
  printed note.
- **The playback destination** (phone / piano / both) changes where sound goes, never the page.

### 5.11 The microphone meter

A level bar, drawn only while the mic is the active input. If the mic cannot be opened the run
does not fail: it falls back to the clock and the status line says so.

### 5.12 The summary sheet

A bottom sheet over the stage at the end of a run. While it is open the keys view is hidden —
the run is over and the sheet is the subject.

Contents: the stats, hot-spot bars, a pass/master badge, and `Again · Slower (−10 %) · Faster
(+10 %) · Loop the weak bars · Done`. **With no judging input** it asks rather than shows:
`How did it go?` (Rough / OK / Clean), because a number nobody measured is a number nobody
earned.

Opened by a **finish**, never by a stop (§8.5).

### 5.13 The `⋯` sheet

Everything not on the bar, each with its word beside it. Opening it does not pause a run — it is
a sheet over a screen that keeps working — but it does hold the bar visible while open. Sideways
it must fit on the screen without scrolling: a sheet nobody can scroll to the end of hides its
last rows from someone who does not know they are there.

### 5.14 Blind mode

The engraving is laid out and **hidden**, never skipped. Model, expectations, scoring and keys
are identical, so a blind run and a sighted run are comparable — which is the feature. The
status line says why the screen is empty, or a black rectangle reads as broken.

### 5.15 Dark theme

Notation inverts (`invert(1) hue-rotate(180deg)`) wherever an `OsmdView` is visible: the score
slots, the drill's notation, the PDF page and its adjust thumbnail. Everywhere — the one that is
missed becomes the brightest thing in a dark room.

### 5.16 The tablet side panel

≥ 900 px on the short side: a 320 px column of the lesson's prose beside the stage. Built
hidden, revealed only when there is text. A piece with no lesson gets no empty column and the
stage takes the width.

### 5.17 Gestures

Gestures change state, so they belong in a rendering spec. **Built** and **specified but not
built** are marked, because `04` §5 lists two that do not exist and a reviewer should not go
looking for them.

| Gesture | Does | Status |
|---|---|---|
| Single tap on the stage | toggles the control bar | built |
| Single tap, SCROLL, not running | advances a step (right half) or goes back (left half) | built |
| Double-tap a bar | sets loop start, then loop end | built |
| Long-press a bar, 400 ms | plays that bar once, both hands, nothing judged | built |
| Drag over 12 px | is a scroll and cancels a pending long-press | built |
| Pinch | zoom | **not built** |
| Two-finger tap | toggle hands focus | **not built** |

A tap that has become a long press must not also toggle the bar: the click that follows the
press is swallowed.

### 5.18 The loop, while it is running

**Gap — nothing on the stage says a loop is running.** Today the only indication is inside the
`⋯` sheet: the Loop row's button reads the section's name or the bar range and carries
`is-selected`. From the stage, a looped run is a cursor that inexplicably jumps backwards every
few bars.

What it should be: the looped bars marked on the sheet itself — a rule under the looping bars,
or their barlines emphasised — so that the jump back is visibly the loop doing its job and not
the app losing its place. The status line says the range when the loop is *set*; it should not
have to be the only record of it.

### 5.19 Stacking order

Lowest to highest. A new overlay must be placed in this list deliberately.

| z | What |
|---|---|
| — | the slots |
| 2 | black keys within the strip |
| 3 | the cursor band and the read-ahead line |
| 3 | the count-in (over the notation, under the chrome) |
| 20 | the score screen's own chrome (header, bar, keys) |
| 5 | the summary sheet *within* the screen |
| 40 | the `⋯` and tempo sheets |
| 60 | the update toast |

---

## 6. Mode × overlay

| | Wait | Tempo | Listen / `Hear it` | Free |
|---|---|---|---|---|
| Cursor band | ✓ | ✓ | ✓ | **—** |
| Read-ahead line | — | ✓ | ✓ | — |
| `next` key | — | ✓ | ✓ | — |
| `expected` key | ✓ | ✓ | ✓ | — |
| Count-in | — | ✓ | ✓ | — |
| Beat dot | — | ✓ | ✓ | — |
| Note colouring | ✓ | ✓ | — | — |
| Advances on | your notes | the clock | the clock | your notes |
| Summary at the end | ✓ | ✓ | — | — |
| Playback of the other hand | ✓ | ✓ | both hands | — |

### 6.1 Free play — the page turns, nothing is marked

**Decided 2026-09-08 by the owner.** Free play draws **no cursor** and **advances on the notes
you play**. It is the page-turner: you play, the page keeps up, and nothing is judged, coloured,
counted or recorded.

That is a change. Today the engine records what is played with no step index and returns, so no
`stepAdvanced` is ever emitted, the window never moves and the band sits on the first note for
the whole session — a stuck cursor over a page that never turns.

What Free must do:

| | |
|---|---|
| Advance | when the played notes match the current step, by the same matching Wait uses |
| A wrong note | **nothing happens.** No colour, no reset, no advance, no record. It is not wrong; it is not what the page is on. |
| Not playing | nothing moves. The page waits, indefinitely, without comment. |
| Cursor band | not drawn |
| Read-ahead line | not drawn |
| `expected` / `next` keys | not drawn — showing what to play next is the opposite of free |
| Note colouring | none |
| Count-in, beat dot | none |
| Summary | none, and nothing recorded |
| Windows and slots | exactly as every other mode — the read-ahead is the point |

**Why no cursor.** A band is the app saying *play this now*. In every other mode that is true and
useful; in Free it is an instruction nobody asked for, and it is the one mode where the player,
not the app, decides what happens next. Removing it leaves the window as the only feedback — and
the window moving *is* the feedback that the app is following you.

**The one thing to get right.** Free must not advance on a note that is merely *near* the
expected one, or the page runs away from an improviser. Match exactly as strictly as Wait does,
and when in doubt do not move: a page that stays put is a page you can still read.

**Open within this decision** (§11.5): whether the very first step should carry a one-off mark
so the player knows where the piece begins, clearing on the first note. A page with nothing on
it does not say where to start.

`Hear it` is a Listen run that **does not move the mode select**: what it interrupts is restored
when it ends, and `▶` during one ends it and starts the run you chose. A long-pressed bar is a
one-bar Listen run that stops after one pass and puts the screen back.

**Performance** (`?performance=1`): one pass, no restart offered, no loop, and it is listed
apart from practice in history. Offering a restart during one would be offering to make it not a
performance.

---

## 7. Orientation × size

| | Phone upright 360×780 | Phone sideways 780×360 | Tablet upright 900×1200 | Tablet sideways 1200×900 |
|---|---|---|---|---|
| Arrangement | SLOTS | CHUNK | SLOTS | SLOTS |
| Header row | drawn | **not drawn** — Back, title and status mirror into the bar's left end | drawn | drawn |
| Bars per window | 2 | 2 | 4 | as many as fill the height |
| Keys | strip 108 px | strip 56 / ribbon 32 | strip | strip |
| Side panel | — | — | ✓ | ✓ |
| Bar auto-hides | no | yes | no | no |

**The tablet rule.** The window holds as many bars as fill the stage's height at the
width-limited size, rather than a fixed four. A number the owner has set always wins; the rule
is the default under it.

**Orientation lock.** With `landscapeLock` on, opening the score screen asks for landscape. The
request may be refused (a tablet, a desktop, a browser that does not implement it) and refusal
is not an error — the screen works either way and says nothing.

**Wake lock.** A run holds the screen awake while `keepScreenAwake` is on, and releases it when
the run ends or the screen is left.

---

## 8. Transitions

### 8.1 A step advances within the window

Class toggles only. Band moves, notes repaint, keys repaint. **No engraving, no fit, no
transform write.**

### 8.1a The order of work within a frame

Fixed, and getting it wrong is how bands end up pointing at nothing:

```
draw (engrave)  →  annotate (tag elements)  →  fit (scale)  →  place bands  →  paint colours
```

**No fit may be triggered from inside a draw.** Re-entering a draw from within itself leaves the
buffers half-written and renders nothing at all; a fit that wants to re-engrave schedules itself
for after the browser has painted, once, guarded so the redraw it causes cannot ask for another.
Bands are placed **after** the fit, never before, or they are positioned against a sheet that is
about to move.

### 8.2 A step advances across a window boundary

- **SLOTS:** cursor slot changes (class toggle, same frame). Vacated slot re-drawn **on idle,
  ≤ 100 ms**, faded. Scale unchanged.
- **CHUNK:** prepared → class toggle and a slide; otherwise draw in place. Scale unchanged. A
  prepared swap must not force a layout.

### 8.3 A run starts

Freeze the scale (after the stage settles) → clear colours → count-in overlay if the mode has
one → status says which hand is played, once → bar arms its auto-hide → wake lock.

### 8.4 The arrangement changes (rotation, layout, bars)

Discard both slots' ranges and elements, release the frozen scale, re-derive the arrangement,
draw from the current step. Nothing is carried across. A rotation **during a count-in** keeps
counting: the clock is not the layout's business.

### 8.5 Stop vs finish

**Different events. Conflating them is what recorded half-runs as failures.**

| | Stop | Finish |
|---|---|---|
| Caused by | restarting with new options (mode, hands, loop), `Hear it` ending, leaving the screen | reaching the last step |
| Summary sheet | **no** | yes |
| Recorded | **no** | yes |
| Colours | cleared | kept until the sheet closes |

A **lap** of a loop is neither: the engine moves back, **the cursor must be told**, colours
clear, and no summary opens.

### 8.6 A refit happens

Every band and every overlay anchored to a note is repositioned, or hidden if its anchor is gone.

### 8.7 The page is hidden

- **Tempo and Listen** pause. The clock kept running would score a performance that did not
  happen. On return the status says how long you were away and offers `▶` and `Start again`.
- **Wait** is untouched — it has no timetable to lose.
- Background timers are throttled to ~1/s by the browser; nothing may depend on frame timing
  while hidden.

### 8.8 A setting changes mid-run

The free ones (§1.3) apply immediately. The re-engraving ones — bars per window, layout,
fingering, chord symbols — restart the run rather than re-engrave underneath it, because a
re-engrave recreates every note element and the run's judgements are keyed to them.

### 8.9 Leaving the screen

Everything the screen started must stop. In order: the run stops (a stop, not a finish, §8.5);
the wake lock and any orientation lock are released; the session is disposed; and the renderer
releases **the resize observer, the pre-render frame, the fit frame, the freeze timer, the
settle timer, the idle measurement, all three `OsmdView`s and the band elements**.

**"Two cursors" is the symptom of this going wrong.** A renderer that outlives its screen keeps
its band in the document and keeps answering the observer, so the next score opens with the old
one still there. Anything that survives disposal shows up as a duplicate overlay before it shows
up as a leak.

An idle re-draw queued for a slot (§4.1) must be cancelled, not left to run against a disposed
renderer.

### 8.10 A seek or a restart

Both slots are drawn from scratch, cursor in slot 0, so the reading order starts at the top
rather than wherever the previous run happened to leave it.

---

## 9. Invariants

Numbered so a reviewer can cite them. Each is falsifiable; most are already testable.

1. **One size per run.** The drawn scale is identical at every frame between a run starting and
   finishing.
2. **Staves at one height.** Stave lines sit at the same y in every window of a piece.
3. **The cursor's system is never re-drawn.** In SLOTS the `<svg>` holding the cursor is the same
   DOM node for every step within its block.
4. **The next bar is on the screen** at every step but the last.
5. **One row.** The control bar's `scrollHeight` is one row's height at 360, 390, 412, 780 and
   1200 px wide.
6. **No overlay outlives its anchor.** After any refit, rotation or window change every band is
   over the note it names, or hidden.
7. **No mark without knowledge.** The read-ahead line is drawn only when the coming step is
   drawn.
8. **A swap costs a frame.** A prepared swap does no engraving, no fit and no forced layout.
9. **A stop is not a finish.** No summary and no recorded run from a stop.
10. **Colour survives no lap.** Judgements clear at the start of every lap.
11. **Hidden means gone.** Anything hidden has no box — `[hidden]` loses a specificity tie to any
    class rule that sets `display`, and this has cost four screens.
12. **Dark ink everywhere.** Every visible `OsmdView` and the PDF page invert under the dark
    theme.
13. **Blind hides, never skips.** The engraving exists and is laid out; only visibility differs.
14. **The mode select is the mode you chose.** A demonstration never moves it.
15. **Bar numbers are as printed, 1-based**, at every boundary between a gesture and the engine.
16. **Zoom is monotonic.** A press of "smaller" always produces a smaller sheet.
17. **No dead ends.** Every terminal state in §1.5 names what happened and offers Back.
18. **The strip and the band agree.** The keys marked `expected` are exactly the notes under the
    cursor, in the same frame.
19. **Budgets** (`01` §6): a prepared window swap under **16.7 ms** on a fourfold-throttled CPU;
    input-to-colour under **30 ms**; the longest score's first window under **60 s**.
20. **Nothing re-engraves during a run** except by restarting it (§8.8).
21. **Free marks nothing.** In Free there is no band, no read-ahead, no expected or next key, no
    colour, no record — and the window still advances as the notes are played.
22. **A wrong note in Free does nothing.** No colour, no reset, no advance, no record.
23. **Only built gestures are wired.** Pinch and two-finger tap are specified in `04` §5 and do
    not exist; nothing may behave as though they do.
24. **Exactly one cursor band exists**, and at most one read-ahead line, in the whole document at
    any moment. Two is a leaked renderer, not a drawing bug.
25. **No fit from inside a draw** (§8.1a), and bands are placed after the fit, never before.
26. **Disposal releases everything** (§8.9): observers, frames, timers, idle callbacks, views,
    band elements, locks.
27. **The end of a piece fills both slots** where there are bars behind to fill them with.

---

## 10. Edge cases

The cases that have broken before, or that the rules above do not obviously cover.

| Case | What must happen |
|---|---|
| A piece of **one bar** | One slot drawn, the other blank — the only case with nothing ahead *and* nothing behind. No stretch. |
| A piece **shorter than two slots** | Draw what there is; the second slot takes the bars behind once there are any. |
| `barsPerWindow` **larger than the piece** | The window clamps to the last bar; no empty measures drawn. |
| A **pickup bar** | The only measure that may be numbered 0. |
| A **repeat** | The other slot shows the repeat's first bar, not the bar printed after the sign. |
| **First/second endings** | The other slot shows the ending that will be played *on this pass*. |
| A **loop of one bar** | The cursor returns and the slot does not re-draw; colours clear per lap. |
| **Seeking backwards** | §8.9 — both slots redrawn, cursor to slot 0. |
| A **rest** as the current step | The band borrows the nearest drawn note's position. |
| A **tie continuation** | Same. |
| A step whose notes are **on both staves** | The band spans the stave of the *first* drawn note; it does not span both. |
| **Rotation mid-count-in** | The count continues; only the layout is rebuilt. |
| **Rotation mid-run** | The frozen scale is released, the arrangement re-derived, the run continues. |
| The **mic fails to open** | Fall back to the clock, say so, do not fail the run. |
| **No input at all** (`none`) | The clock drives; nothing is judged as wrong for being absent. |
| The score has **no notes** | Not READY: a terminal state from §1.5 with a reason. |
| The **probe never finishes** | The stand-in scale holds. Never released upward. |
| **`Hear it` pressed twice quickly** | The second press stops; no second run starts. |
| **Long-press that becomes a drag** | Over 12 px is a scroll and cancels the press. |
| **Long-press during a run** | The run is paused for the bar and resumed after. |
| The **summary open** and the device rotates | The sheet stays open and re-lays out; the run does not restart. |
| **Leaving the screen mid-run** | A stop, not a finish (§8.5). Wake lock released. |
| **Free, playing something not in the piece** | Nothing moves and nothing is marked. The page waits. |
| **Free, playing far ahead of the page** | The page advances a step at a time as each step is matched; it does not skip to where you are. |
| **Free, the last step played** | The page stops at the end. No summary, nothing recorded. |
| **A loop of the whole piece** | Behaves as a piece that never ends; the lap boundary still clears colour. |
| **A loop set backwards** (end before start) | Normalised to a range, not rejected. |
| **The same printed bar twice in a loop** (a repeat inside it) | The loop is in *steps*, not printed bars, so the two passes are distinct. |
| **A window whose ink is wider than the stage** upright | The width fit binds; the staff shrinks rather than clipping. |
| **A score with one staff** (not a grand staff) | Slots hold one staff each; nothing assumes two. |
| **`countInBars: 0`** | No count-in overlay at all; the first note is the first beat. |
| **Playing faster than the idle re-draw** | A crossing whose other slot is not yet drawn draws in place rather than showing a stale bar. The read-ahead is late; it is never wrong. |
| **A tempo change written into the score** | The bpm label follows it; the scale does not. |
| **Leaving while an idle re-draw is queued** | Cancelled at disposal (§8.9). |
| **A `Hear it` or bar preview ending** | The window returns to where the run was, as a seek (§8.10), and the mode select has not moved. |
| **Rotating with the summary open** | The sheet stays open and re-lays out; the run does not restart. |
| **The stage at zero height** (mid-layout) | No fit is attempted; the previous scale stands. |

---

## 11. Open questions and known divergences

Deliberate gaps, so a reviewer knows what is not a bug.

1. **Bar numbering.** Authored songs number the first measure `0`, so the sheet prints `0` on the
   first system. Only a pickup may be bar 0. *(P21e A4, open)*
2. **`ink-flush` in the audit** measures the whole sheet, which under CHUNK is wider than the
   stage by design, and reports large negative insets on every sideways score scene. It should
   measure the ink **clipped to the stage**. *(P21e C3, open)*
3. **The folder row** is 102 px against a 96 px budget. *(P21e D1 proposes badges → detail
   tokens)*
4. **`barsPerWindow` stays at 2** upright — one bar per slot, a full bar of warning. The owner
   chooses in first-run setup. *(decided)*
5. **The cursor in Free play — settled 2026-09-08.** No cursor, and the page advances on the
   notes played (§6.1). This is a change to the engine, not only to the drawing: Free emits no
   `stepAdvanced` today. What remains open inside the decision is whether the *first* step
   carries a one-off "start here" mark that clears on the first note — a page with nothing on it
   does not say where to begin. Recommendation: yes, and only until the first matched note.
6. **The read-ahead line replaced the second band** after "two cursors" was reported. This
   document specifies the line; anything still drawing a band is stale.
7. **Chord symbols and the stave placement.** §3.5 places on the stave so a chord symbol does not
   move the staff — which means a chord symbol may sit closer to the top edge in one window than
   another. Accepted: the staff is the thing being read.
8. **A running loop is invisible on the stage** (§5.18). The cursor jumps backwards with nothing
   to explain it. Needs a mark on the looping bars.
9. **Pinch to zoom and two-finger tap to switch hands** are in `04` §5 and are not built
   (§5.17). Either build them or strike them from §5 — a documented gesture that does nothing is
   worse than an undocumented one.
10. **`showNoteNames` is labelled "Note names in note heads" and does not put names in note
    heads** on this screen. It drives the waiting line — `Waiting for D4` — in Wait mode only,
    and on the drill screen it does something else again. Either the label is wrong or the
    feature is missing; they cannot both be right.

---

## 12. What to check first

If a reviewer has an hour, diff in this order — highest yield first:

1. §9 invariants 1, 2, 3, 4 — the reading experience is those four.
2. §8.5 — the stop/finish table.
3. §6 and §6.1 — the mode matrix, and Free in particular: it is specified to change.
4. §2 — whether the arrangement is derived from height rather than orientation.
5. §3.3 — the table of what may change the scale, against every write of a transform.
6. §1.5 and §10 — the states that only appear when something has gone wrong.
