# 08 — What the score screen draws, and when

**Status:** specification. Written 2026-09-08 against the code at `7f7538f`, the decision records
for P21b–P21e, and `04` §5. Where this document and the code disagree, **this document is the
intent** and one of the two is a bug — that is what it is for.

---

## 0. The method, and why the document is shaped like this

Earlier drafts were a list of things the screen draws, extended each time somebody noticed
another one. A list has no completion test: you cannot look at it and see what is missing.

This one is a **tree**. It starts from the single act the screen exists for and branches by
asking, at each node, *what does the reader need next?* — until the leaves are concrete drawn
things. Completeness becomes structural: an unexplored branch is visible as a branch with
nothing under it.

At every leaf the same six questions are asked, and the ones with non-obvious answers written
down:

| | |
|---|---|
| **Exists?** | when it is in the document at all |
| **Where?** | what it is anchored to |
| **How big?** | what decides its size |
| **How does it look?** | its states, and what they mean |
| **When does it change?** | the events that move it |
| **What if it cannot be known?** | the degenerate case — and the answer is almost always *draw nothing* |

**The root.** *A person is reading music while playing it.* Every rule below descends from that
sentence. Four principles decide what the tree does not:

- **P1 — Stillness beats information.** A staff that changes size, position or brightness while
  you read costs more than whatever the change was telling you.
- **P2 — Read-ahead is the product.** A beginner reads about a bar ahead; the screen's job is to
  have that bar there *before* it is needed.
- **P3 — Never mark what you do not know.** An overlay pointing at the wrong note is worse than
  no overlay.
- **P4 — Every state is leavable.** No dead ends, no black rectangles, no spinner with no way
  back.

**Scope.** The Score screen: `ScoreScreen`, `WindowRenderer`, `slots.ts` and the overlays those
own. Not the drill screen's four-bar notation or the PDF viewer, which draw music by other
machinery. Two rules cross all three because each has broken in each: **dark ink** (§3.4.2) and
**hidden means gone** (§9.20).

---

## 1. The tree

```
A person reading music while playing it
│
├── 1  Can I read it at all?                     → §3
│   ├── 1.1 Is the piece here?                     lifecycle, failures
│   ├── 1.2 Is it big enough?                      the size machine
│   ├── 1.3 Does it hold still?                    what may change size, and when
│   └── 1.4 Is it legible?                         theme, what is drawn and what is not
│
├── 2  Where am I?                               → §4
│   ├── 2.1 …in the piece                          arrangement: slots / chunk / scroll
│   ├── 2.2 …in the bar                            the cursor band
│   ├── 2.3 …on the keyboard                       the keys view
│   └── 2.4 …in the piece as a whole               nothing draws this — §11.1
│
├── 3  What comes next?                          → §5
│   ├── 3.1 The next bar                           read-ahead, per arrangement
│   ├── 3.2 The next note                          the read-ahead line, the next key
│   └── 3.3 The next beat                          count-in, beat dot
│
├── 4  How am I doing?                           → §6
│   ├── 4.1 …on this note                          note colouring
│   ├── 4.2 …on this run                           the summary sheet
│   └── 4.3 What is the app saying?                status line, waiting line
│
├── 5  What can I change?                        → §7
│   ├── 5.1 …while my hands are on the keys        the control bar
│   ├── 5.2 …rarely                                the ⋯ sheet
│   ├── 5.3 …by touching the music                 gestures
│   └── 5.4 …how the app follows me                the modes
│
└── 6  What if something goes wrong?             → §8
    ├── 6.1 The frame is mis-ordered               draw / fit / place
    ├── 6.2 The run is interrupted                 stop, finish, lap, pause
    ├── 6.3 The device changes                     rotation, resize, the page hidden
    ├── 6.4 I leave                                disposal — why it shows as two cursors
    └── 6.5 I cannot see it, or cannot see colour  accessibility
```

---

## 2. The state space

Axes are independent unless said otherwise. A reviewer checking coverage should be able to pick
a cell and find it decided.

### 2.1 Axes

| Axis | Values |
|---|---|
| Lifecycle | `opening` · `unknown` · `not-notation` · `failed` · `ready` |
| Run | `idle` · `counting-in` · `running` · `paused` · `stopped` · `finished` |
| Mode | `wait` · `tempo` · `listen` · `free` |
| Overlay mode | *(none)* · `hearing` · `hearingBar` |
| Arrangement | `slots` · `chunk` · `scroll` |
| Orientation | `upright` · `sideways` |
| Height class | `short` (< 600) · `tall` (≥ 600) |
| Device class | `phone` · `tablet` (min side ≥ 900) |
| Hands | `R` · `L` · `both` |
| Input | `midi` · `mic` · `keys` · `none` |
| Keys view | `strip` · `ribbon` · `off` |
| Loop | `none` · `bars` · `section` |
| Theme | `light` · `dark` |
| Motion | `full` · `reduced` |
| Special | `blind` · `performance` · `sightReading` |

### 2.2 The cross-products that matter

Most cells are independent. These interact, and each has been got wrong before:

| Pair | Where |
|---|---|
| Arrangement × orientation × height | §4.1 — the rule is height, not orientation |
| Mode × read-ahead | §5.2 — Tempo and Listen only |
| Mode × cursor | §7.4 — Free draws none |
| Run × size | §3.3 — a run freezes the scale |
| Loop × run-end | §8.2 — a lap is neither a stop nor a finish |
| Blind × everything | §3.4.4 — hides, never skips |
| Overlay mode × mode select | §7.1 — a demonstration never moves it |

### 2.3 Sizes this must be correct at

Phone upright **360×780** and 412×915 · phone sideways **780×360** and 915×412 · tablet 900×1200
and 1200×900. **360×780 is the owner's own phone and is the binding case** for every "does it
fit" question here.

---

## 3. Branch 1 — Can I read it at all?

### 3.1 Is the piece here? (the lifecycle)

```
             ┌──────────► UNKNOWN        "Unknown item “x”."
             │
  OPENING ───┼──────────► NOT NOTATION   "…is a PDF — open it from Library."
  (Loading…) │            "…has no notation to open." + the import hint
             │
             ├──────────► FAILED         "That score could not be opened: …"
             │
             └──────────► READY ─────────► everything below
```

- **OPENING** draws the header, the bar and an empty stage. The stage already has its final
  height, so the fit does not move when the score arrives.
- Every terminal state names what happened **and offers Back** (**P4**) — in the header upright,
  in the bar's left end sideways.
- **Sight-reading** generates fresh material on every open; that is the point. `Again` on the
  summary re-runs the *loaded* score rather than regenerating, and only the first attempt is
  recorded.

### 3.2 Is it big enough? (the size machine)

> **P1.** The size of a staff line is decided once per piece and does not change while the piece
> is being played. This is the rule the screen has broken most often and the one a reader
> notices fastest.

**Two sizes, constantly confused.**

| | What it is | Cost |
|---|---|---|
| Engraving zoom | what OSMD lays out at | re-renders, recreates every element, destroys the id→element map |
| Drawn scale | a CSS `transform: scale()` on the wrapper | free; every element survives |

The owner's `zoom` is a **multiplier on the drawn scale**, never an engraving zoom. `1.0` is "as
large as fits". **The buttons must be monotonic** — a press of "smaller" always yields a smaller
sheet. (They once did not: zoom re-engraved *and* multiplied, and the fit search climbed back to
a different engraving.)

**How the scale is chosen.**

1. A **probe** engraves the whole score into a third `OsmdView` that is never shown, on idle a
   frame after the first paint, capped at the first 48 bars. *(Eagerly, it doubled the longest
   score's open time — 108 s against a 60 s budget under a fourfold throttle.)*
2. Elements are bucketed to their nearest **system** by y; a system's extent is how far its ink
   reaches above the top stave line, the staves' own span, and how far below.
3. The fit targets the **upper quartile** of those extents, not the maximum. One freak bar — two
   ledger lines below, once in eight bars — otherwise costs 40 % of the size everywhere,
   permanently, to spare that bar a single shrink.
4. Until the probe answers, the tallest window seen so far stands in and is **never released
   upward**: the scale may tighten, never grow.

**Placement is on the stave, not the ink.** A window with a chord symbol above it and one
without must put their stave lines at the same y; placing on ink makes the staff jump by the
height of whatever happens to be drawn above it. The ink box is still what the **width** fit
uses, because OSMD lays a window out on a page the full width of the container and inks only
part of it.

Air: **6 px** each side and nothing else. OSMD's page margins are zero; the metronome mark is
not drawn here because the bar says the bpm.

### 3.3 Does it hold still?

| Event | May the scale change? |
|---|---|
| A new window is drawn | **No.** This is the whole rule. |
| The cursor crosses into the other slot | **No.** |
| The end of the piece is reached | **No.** The other slot fills with the bars behind, at the same size. |
| A loop lap returns to the start | **No.** |
| The probe's measurement arrives | Yes — **but not during a run**. |
| The owner presses Size | Yes, at once. |
| The stage resizes by more than a few px | Yes. |
| Rotation | Yes; the frozen scale is released. |
| `barsPerWindow`, `layout`, fingering or chord symbols change | Yes. |
| A different piece | Yes. |

**Freezing.** Starting a run freezes the scale, after a short wait for the stage to settle into
the height the control bar leaves it. A probe measurement arriving mid-run is held and applied
at the next fit *after* the run — a measurement arriving late is the size change again, later.

### 3.4 Is it legible?

#### 3.4.1 What is drawn, and what is deliberately not

| Drawn | Not drawn |
|---|---|
| staves, notes, rests, clefs, key and time signatures | title, subtitle, composer, lyricist, credits, part names |
| fingerings, when `showFingering` | the metronome mark (the bar says the bpm) |
| chord symbols, when `showChordSymbols` | page numbers, page margins |

**Open:** lyrics are not among the suppressed, so OSMD draws them. On a two-bar window of a
song that is a second row of text competing with the notes (§11.4).

#### 3.4.2 Dark ink

Notation inverts (`invert(1) hue-rotate(180deg)`) wherever an `OsmdView` is visible — the score
slots, the drill's notation, the PDF page and its adjust thumbnail. Everywhere: the one that is
missed becomes the brightest thing in a dark room.

#### 3.4.3 Hand focus

`R` or `L` **dims** the other hand's notes — a class on the view, never a re-render, never
hidden. The other hand is context you read past; removing it changes what the page looks like.

#### 3.4.4 Blind mode

The engraving is laid out and **hidden**, never skipped. Model, expectations, scoring and keys
are identical, so a blind run and a sighted run are comparable — which is the feature. The
status line says why the screen is empty, or a black rectangle reads as broken.

---

## 4. Branch 2 — Where am I?

### 4.1 In the piece — the arrangement

```
              layout = scroll ─────────────────────────► SCROLL
                    │
   layout = window ─┤
                    ├─ barsPerWindow ≥ 2 AND (upright OR tall) ──► SLOTS
                    └─ otherwise ───────────────────────────────► CHUNK
```

**Height, not orientation.** Two systems need vertical room, not portraitness: a tablet sideways
has 900 px and reading two systems beats sliding one; a phone sideways has 360, where a second
system halves a staff already at its minimum.

#### SLOTS — two systems, karaoke

Slot 0 above slot 1, each holding `max(1, ⌊barsPerWindow / 2⌋)` bars. Exactly one holds the
cursor and **is never re-drawn while it does**.

```
cursor in slot A showing block k          other slot shows block k+1
        │  cursor's bar enters block k+1 (already drawn there)
        ▼
cursor slot becomes B — untouched, already on the screen
slot A re-drawn with block k+2, faded ~150 ms, ON IDLE (≤ 100 ms later)
```

- Which slot is current changes by class toggle in the same frame as the step. The **re-draw of
  the vacated slot is deferred to idle** and must never share a frame with colouring the note
  just played.
- The fade is ~150 ms, suppressed under reduced motion. Peripheral vision ignores a fade and
  notices a flash; that is the whole reason it exists.
- **"Next" follows the playing order.** The next block holds the bar of the next *step*: at a
  repeat, the repeat's first bar; at a first/second-time ending, the ending played on this pass.
- **At the end of a piece the other slot shows the bars just played**, not blank — a blank slot
  is half the screen gone black for the last bars of every song. Chosen in playing order too, so
  at a second-time ending it is the bar *before* the ending, not the first ending printed above.
  A one-bar piece is the only genuinely blank case.

#### CHUNK — one system, sliding

Engraved as the window **plus two bars behind and two ahead**, so a fresh chunk never starts at
the bar being played.

- Slides **left only, by bar, at the barline**. A sheet that moves under a note being read is
  worse than one that jumps once a bar.
- The cursor is held between **25 % and 45 %** of the stage width, targeting a third.
- Never slides past the start: bar 1 sits where it was engraved.
- The next chunk is pre-rendered **in the same shape**, so the same bars sit at the same x on
  both sheets and the swap is invisible.
- Width is deliberately **not** a fit constraint here: the read-ahead bars run off the right
  edge, which is what there is to slide towards.

#### SCROLL — the whole piece

Auto-scroll keeps the cursor between **25 % and 40 %** of viewport height; a manual scroll
suspends it for **5 s**. Under reduced motion the scroll is immediate rather than smooth.

### 4.2 In the bar — the cursor band

| | |
|---|---|
| **Exists** | whenever a step is current, in every mode **except Free** (§7.4) |
| **Where** | over the current step's notes, spanning **the stave the note is on** — not the stage. A full-height stripe reads as a rendering fault and crosses the title, the chord symbols and, sideways, the bar |
| **When it changes** | follows every refit; a band left at its old position after a rescale points at the wrong note |
| **If it cannot be known** | a rest or a tie continuation borrows the nearest step's position — correct for "you are here" |

**Exactly one cursor band exists in the document at any moment.** Two is a leaked renderer
(§8.4), not a drawing bug.

### 4.3 On the keyboard — the keys view

`keys ∈ { strip, ribbon, off }`, under the stage.

| | |
|---|---|
| **strip** | the piece's range as keys — 108 px upright, **56 px sideways** where height is scarce; keys stay as wide |
| **ribbon** | the same information as a 32 px band with the wanted note's **name** over it (`F♯4`) — a third of the height, and it names the note, which is what an evening lost to an unfindable F♯4 was missing |
| **off** | nothing |

States: `next` (paler blue, behind) · `expected` (blue) · `pressed` · `correct` · `wrong` ·
`uncertain`. `next` is applied **before** `expected`, so a key that is both stays the bright one.
The strip is tappable and feeds the shared screen-keyboard input — with no cable, this *is* the
instrument. It scrolls to keep the wanted note in view and does nothing when it is already
comfortably visible.

### 4.4 In the piece as a whole

**Nothing draws this.** In SLOTS you cannot tell bar 3 of 8 from bar 3 of 80: two systems, no
scrollbar, no bar number, no proportion (§11.1).

---

## 5. Branch 3 — What comes next?

### 5.1 The next bar

Whichever arrangement is in force, §4.1's read-ahead is the answer. It is the product (**P2**);
the rest of this branch refines it.

### 5.2 The next note

A **line under the stave** beneath the next step — *not* a second band. Two translucent bands of
the same shape at different opacities read as one smeared cursor; the owner reported exactly
that ("two cursors").

| | |
|---|---|
| **Exists** | Tempo and Listen only (including `Hear it`), where a clock moves whether or not the reader is ready |
| **Not in Wait** | no clock to be ahead of, and marking a note nobody will reach yet tells a beginner to hurry |
| **Not in Free** | no expectations |
| **If it cannot be known** | refuses the nearest-element fallback the cursor uses: if the coming step is not drawn, draw **nothing** (**P3**) |

The strip's `next` key follows the same rule.

### 5.3 The next beat

- **The count-in** — over the notation during the count-in only: the bar's beats, large, the
  current one lit. The first step's band is in place from the first click, so the eye is on the
  note before the bar starts. Tempo and Listen only; nothing at `countInBars: 0`.
  **The count comes from the time signature at the bar the run starts from**, not the piece's
  first — a run beginning at a loop in a different meter counts the wrong bar (§11.2).
- **The beat dot** — in the header, pulsing each beat, brighter on beat 1. How a player checks
  the tempo without hearing the click, which next to a piano is most of the time. Tempo and
  Listen only; suppressed under reduced motion.

Both are independent of whether the **metronome** is audible: the dot follows the mode's clock,
which is the point of having it.

---

## 6. Branch 4 — How am I doing?

### 6.1 On this note — colouring

Classes on note groups, never a re-render.

| State | Colour | Meaning |
|---|---|---|
| `current` | accent | the step being waited for or played |
| `correct` | green + ✓ | heard and matched |
| `wrong` | red + ✗ | heard and wrong |
| `uncertain` | amber + ? | the microphone's "I may not have heard it" |

`uncertain` is **never** red. Below the confidence floor the app can say it did not hear what it
expected; it cannot say the learner played the wrong note, and red is the app blaming a person
for its own microphone.

Colours clear at the start of a run **and at the start of every lap** of a loop — last lap's
mistakes read as this lap's.

### 6.2 On this run — the summary sheet

A bottom sheet over the stage at the end of a run; the keys view is hidden while it is open,
because the run is over and the sheet is the subject.

Stats, hot-spot bars, a pass/master badge, and `Again · Slower (−10 %) · Faster (+10 %) · Loop
the weak bars · Done`. **With no judging input it asks rather than shows** — `How did it go?`
(Rough / OK / Clean) — because a number nobody measured is a number nobody earned.

Opened by a **finish**, never by a stop (§8.2).

### 6.3 What is the app saying?

**Two elements, not one.**

- **The status line** — the session's voice: a hand is being played for you (**once** per run),
  a run was paused and for how long, a bar is being demonstrated, the microphone failed and the
  clock is standing in, why the screen is blind, errors. It must never still say `Playing` over
  a finished run.
- **The waiting line** — names the note being waited for (`Waiting for D4`). Exists only when
  `showNoteNames` is on **and** the mode is Wait **and** a run is going: in a clock-driven mode
  nothing is ever waited for. Hidden, not blank, so it costs no height.

Sideways both are **mirrored into the control bar's left end**; the originals stay the source of
truth.

---

## 7. Branch 5 — What can I change?

### 7.1 While my hands are on the keys — the control bar

**One row, in every form factor.** A hard constraint: at 360 px the row's `scrollHeight` equals
one row. It has broken twice.

`▶`/`⏸` · `Hear it` · mode · hands · tempo label · `⋯`. Below 400 px the modes shorten to one
word and the tempo label drops the percentage. `Start again` is in `⋯` — the test for the bar is
*do you need this while your hands are on the keys?*

**Auto-hide:** hides 3 s into a run **only where it would otherwise take room from the music**.
Upright, where the sheet does not reach the bottom of the stage, it stays. During a run the
stage takes the bar's row; the bar overlays the bottom when asked back, which is acceptable at
the moment you asked for it.

`Hear it` is a Listen run that **does not move the mode select**: what it interrupts is restored
when it ends, and `▶` during one ends it and starts the run you chose.

### 7.2 Rarely — the `⋯` sheet

Everything not on the bar, each with its word beside it. Opening it does not pause a run, but it
does hold the bar visible. Sideways it must fit without scrolling: a sheet nobody can scroll to
the end of hides its last rows from someone who does not know they are there.

### 7.3 By touching the music — gestures

| Gesture | Does | Status |
|---|---|---|
| Single tap on the stage | toggles the control bar | built |
| Single tap, SCROLL, not running | advance (right half) / back (left half) | built |
| Double-tap a bar | sets loop start, then loop end | built |
| Long-press a bar, 400 ms | plays that bar once, both hands, nothing judged | built |
| Drag over 12 px | is a scroll; cancels a pending long-press | built |
| Pinch | zoom | **not built** (`04` §5 says it exists) |
| Two-finger tap | toggle hands focus | **not built** (`04` §5 says it exists) |

A tap that has become a long press must not also toggle the bar: the click after the press is
swallowed.

### 7.4 How the app follows me — the modes

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
| Summary | ✓ | ✓ | — | — |
| Plays for you | the other hand | the other hand | both hands | — |

#### Free play — the page turns, nothing is marked

**Decided 2026-09-08 by the owner.** No cursor; advances on the notes played. It is the
page-turner: you play, the page keeps up, and nothing is judged, coloured, counted or recorded.

That is a change. Today the engine records what is played with no step index and returns, so no
`stepAdvanced` is emitted, the window never moves, and the band sits on the first note for the
whole session — a stuck cursor over a page that never turns.

| | |
|---|---|
| Advance | when the played notes match the current step, by the matching Wait uses |
| A note that is not the one the page is on | **nothing happens.** Not wrong, not a reset, not an advance, not recorded |
| Not playing | nothing moves; the page waits indefinitely, without comment |
| Cursor, read-ahead, `expected`/`next` keys, colour, count-in, beat dot, summary | none |
| Windows and slots | exactly as every other mode — the read-ahead is the point |

**Why no cursor.** A band is the app saying *play this now*. In every other mode that is true;
in Free it is an instruction nobody asked for, and it is the one mode where the player decides
what happens next. The window moving *is* the feedback that the app is following you.

**The thing to get right:** it must not advance on a note merely *near* the expected one, or the
page runs away from an improviser. When in doubt, do not move — a page that stays put is a page
you can still read.

**Performance** (`?performance=1`): one pass, no restart offered, no loop, listed apart from
practice in history. Offering a restart during one would be offering to make it not a
performance.

---

## 8. Branch 6 — What if something goes wrong?

### 8.1 The order of work in a frame

```
draw (engrave) → annotate (tag elements) → fit (scale) → place bands → paint colours
```

**No fit may be triggered from inside a draw.** Re-entering a draw from within itself leaves the
buffers half-written and renders nothing; a fit that wants to re-engrave schedules itself for
after the browser has painted, once, guarded so the redraw it causes cannot ask for another.
Bands are placed **after** the fit, never before.

### 8.2 The run is interrupted

| Within the window | class toggles only — band, colours, keys. No engraving, no fit, no transform write |
|---|---|
| **Across a boundary, SLOTS** | cursor slot changes (class toggle, same frame); vacated slot re-drawn **on idle, ≤ 100 ms**, faded. Scale unchanged |
| **Across a boundary, CHUNK** | prepared → class toggle and a slide; else draw in place. Scale unchanged; a prepared swap must not force a layout |
| **A run starts** | freeze the scale (after the stage settles) → clear colours → count-in → status says which hand is played, once → bar arms auto-hide → wake lock |
| **A seek or restart** | both slots drawn fresh, cursor to slot 0, so the reading order starts at the top rather than wherever the last run left it |

**Stop is not finish.** Conflating them is what recorded half-runs as failures.

| | Stop | Finish |
|---|---|---|
| Caused by | restarting with new options, `Hear it` ending, leaving | reaching the last step |
| Summary | **no** | yes |
| Recorded | **no** | yes |
| Colours | cleared | kept until the sheet closes |

A **lap** of a loop is neither: the engine moves back, **the cursor must be told**, colours
clear, no summary.

### 8.3 The device changes

- **Rotation** — release the frozen scale, re-derive the arrangement, discard both slots, redraw
  from the current step; the run continues. Mid-count-in the count continues: the clock is not
  the layout's business.
- **Resize** — the same, above a few px of tolerance. Below it, nothing: jitter is not a resize.
- **The page is hidden** — Tempo and Listen **pause** (a clock left running scores a performance
  that did not happen); on return the status says how long you were away. **Wait is untouched** —
  it has no timetable to lose. Background timers are throttled to ~1/s; nothing may depend on
  frame timing while hidden.
- **A setting changes mid-run** — the free ones apply at once; the re-engraving ones
  (`barsPerWindow`, `layout`, fingering, chord symbols) **restart the run** rather than re-engrave
  underneath it, because a re-engrave recreates every element and the run's judgements are keyed
  to them.

### 8.4 I leave — disposal

Everything the screen started must stop: the run stops (a **stop**, not a finish); wake lock and
orientation lock released; the session disposed; the renderer releases **the resize observer, the
pre-render frame, the fit frame, the freeze timer, the settle timer, the idle measurement, all
three `OsmdView`s and the band elements**. A queued idle re-draw is cancelled, not left to run
against a disposed renderer.

**"Two cursors" is the symptom of this going wrong.** A renderer that outlives its screen keeps
its band in the document and keeps answering the observer, so the next score opens with the old
one still there. It shows as a duplicate overlay long before it shows as a leak.

### 8.5 I cannot see it, or cannot see colour — accessibility

- **The current slot must be distinguishable to a screen reader.** Today `aria-hidden` follows
  *is it drawn*, so in SLOTS both systems read as present with nothing saying which is current
  (§11.3).
- Every glyph control carries a word: `▶` is announced "Play", not "black right-pointing
  triangle". A `title` is not enough — the accessible name comes from the content first.
- Colour is never the only channel: `correct` and `wrong` carry ✓ and ✗, `uncertain` a `?`.
- Reduced motion removes the slot fade, the beat dot's pulse and smooth scrolling, and never
  removes information.

---

## 9. Invariants

Numbered for citation. Each is falsifiable; most are already testable.

**Size and stillness**
1. One size per run: the drawn scale is identical at every frame between a run starting and
   finishing.
2. Stave lines sit at the same y in every window of a piece.
3. Zoom is monotonic.
4. No fit is triggered from inside a draw; bands are placed after the fit.
5. Nothing re-engraves during a run except by restarting it.

**Position and read-ahead**
6. The cursor's system is never re-drawn: in SLOTS the `<svg>` holding it is the same DOM node
   for every step within its block.
7. The bar of the next step is on the screen at every step but the last.
8. The end of a piece fills both slots wherever there are bars behind to fill them with.
9. Exactly one cursor band, and at most one read-ahead line, exist in the document.
10. No overlay outlives its anchor: after any refit, rotation or window change, every band is
    over the note it names, or hidden.
11. The read-ahead line is drawn only when the coming step is actually drawn.
12. The keys marked `expected` are exactly the notes under the cursor, in the same frame.

**Modes**
13. Free marks nothing — no band, no read-ahead, no expected or next key, no colour, no record —
    and the window still advances as the notes are played.
14. A note that is not the current step does nothing in Free.
15. The mode select is the mode you chose; a demonstration never moves it.

**Lifecycle**
16. A stop is not a finish: no summary, nothing recorded.
17. Judgements clear at the start of every lap.
18. Disposal releases every observer, frame, timer, idle callback, view, band and lock.
19. No dead ends: every terminal lifecycle state names what happened and offers Back.

**Drawing**
20. Hidden means gone: anything hidden has no box. `[hidden]` loses a specificity tie to any
    class rule that sets `display`, and this has cost four screens.
21. Dark ink everywhere: every visible `OsmdView` and the PDF page invert under the dark theme.
22. Blind hides, never skips.
23. The control bar's `scrollHeight` is one row at 360, 390, 412, 780 and 1200 px.
24. Bar numbers are as printed, 1-based, at every boundary between a gesture and the engine.
25. Only built gestures are wired; nothing behaves as though pinch or two-finger tap exists.

**Budgets** (`01` §6)
26. A prepared window swap under **16.7 ms** on a fourfold-throttled CPU.
27. Input-to-colour under **30 ms**.
28. The longest score's first window under **60 s**.

---

## 10. Edge cases, by branch

**Branch 1 — the music itself**

| Case | What must happen |
|---|---|
| One bar | One slot drawn, the other blank — the only case with nothing ahead *and* nothing behind |
| Shorter than two slots | Draw what there is; the second slot takes the bars behind once there are any |
| `barsPerWindow` > the piece | Clamp to the last bar; no empty measures drawn |
| A pickup | The only measure that may be numbered 0 |
| A repeat | The other slot shows the repeat's first bar, not the bar printed after the sign |
| First/second endings | The ending played **on this pass** |
| A meter change mid-piece | The count-in counts the meter **at the run's first bar** (§11.2) |
| A tempo change written in | The bpm label follows it; the scale does not |
| 780 bars | The probe caps at 48; the held sizes cover the rest |
| A rest, or a tie continuation, as the current step | The band borrows the nearest drawn note |
| Notes on both staves in one step | The band spans the stave of the *first* drawn note, not both |
| One staff, not a grand staff | Slots hold one staff each; nothing assumes two |
| No notes at all | Not READY — a terminal state with a reason |

**Branches 2–3 — position and read-ahead**

| Case | What must happen |
|---|---|
| Playing faster than the idle re-draw | Draw in place rather than show a stale bar. The read-ahead may be late; never wrong |
| A loop of one bar | The cursor returns; the slot does not re-draw; colours clear per lap |
| A loop of the whole piece | A piece that never ends; the lap boundary still clears colour |
| A loop set backwards | Normalised to a range, not rejected |
| The same printed bar twice in a loop | The loop is in *steps*, so the two passes are distinct |
| Seeking backwards | Both slots redrawn, cursor to slot 0 |
| Free, playing something not in the piece | Nothing moves, nothing marked |
| Free, playing far ahead | Advances a step at a time as each is matched; never skips to where you are |

**Branches 5–6 — controls, device, failure**

| Case | What must happen |
|---|---|
| `countInBars: 0` | No count-in overlay; the first note is the first beat |
| `Hear it` pressed twice quickly | The second stops; no second run starts |
| Long-press during a run | The run pauses for the bar and resumes after |
| `Hear it` or a bar preview ending | The window returns as a seek; the mode select has not moved |
| Rotating with the summary open | The sheet stays open and re-lays out; the run does not restart |
| The stage measured at zero height | No fit attempted; the previous scale stands |
| The mic fails to open | Fall back to the clock, say so, do not fail the run |
| MIDI disconnected mid-run | The run continues on whatever input remains; say so once |
| Input `none` | The clock drives; nothing is judged wrong for being absent |
| Leaving mid-run | A stop, not a finish; wake lock released; idle re-draws cancelled |
| The probe never finishes | The stand-in scale holds, never released upward |

---

## 11. Divergences and open questions

1. **Nothing says where you are in the piece** (§4.4). In SLOTS, bar 3 of 8 and bar 3 of 80 look
   identical. **Recommend: a bar count, `12 / 48`, in the bar's left end.**
2. **The count-in uses the piece's first time signature**, not the meter at the bar the run
   starts from. A run beginning at a loop in a different meter counts the wrong bar.
3. **`aria-hidden` on a slot follows "drawn", not "current"** (§8.5), so a screen reader gets
   both systems with nothing marking the one being played.
4. **Lyrics are not suppressed** (§3.4.1), so OSMD draws them — a second row of text competing
   with the notes on a two-bar window. Decide.
5. **`showNoteNames` is labelled "Note names in note heads" and puts no names in note heads** on
   this screen; it drives the waiting line in Wait mode. Either the label is wrong or the
   feature is missing.
6. **A running loop is invisible on the stage.** The only indication is inside the `⋯` sheet;
   from the stage a looped run is a cursor that jumps backwards with nothing to explain it.
7. **Pinch and two-finger tap** are documented in `04` §5 and not built. Build them or strike
   them: a documented gesture that does nothing is worse than an undocumented one.
8. **Bar numbering from 0.** Authored songs number the first measure `0`, so the sheet prints `0`
   on the first system. Only a pickup may be bar 0.
9. **`ink-flush` in the audit** measures the whole sheet, which under CHUNK is wider than the
   stage by design, and reports large negative insets on every sideways score scene. It should
   measure the ink **clipped to the stage**.
10. **The first step in Free** — with no cursor, nothing says where the piece begins.
    **Recommend: a one-off "start here" mark, cleared by the first matched note.**
11. **Chord symbols and stave placement.** §3.2 places on the stave, so a chord symbol may sit
    closer to the top edge in one window than another. Accepted: the staff is what is read.

---

## 12. What to check first

1. §9 invariants 1, 2, 6, 7 — the reading experience is those four.
2. §8.2 — the stop/finish table.
3. §7.4 — the mode matrix, and Free in particular: it is specified to change.
4. §4.1 — whether the arrangement is derived from height rather than orientation.
5. §3.3 — the table of what may change the scale, against every write of a transform.
6. §11 — the eleven known divergences, before hunting for new ones.
7. §3.1, §8.3–§8.5, §10 — the states that only appear when something has gone wrong.
