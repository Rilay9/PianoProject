# 04 — UI specification

Phone-first (Galaxy S25, 6.2", 2340×1080, ~412×915 CSS px portrait / 915×412 landscape).
Every screen must be usable one-handed in portrait except the **Score screen**, which is
designed for landscape on a music stand and touched rarely.

Design language: high contrast, large tap targets (≥ 48 px), dark and light themes (system
default), no decorative animation on the score screen (rendering budget). Typography: system
font; notation is SVG from OSMD. Icons: inline SVG (no icon font).

## 0. Rules every screen obeys

Four rules, decided 2026-09-07 after the app was made to photograph itself and the pictures
were read. Reasoning and the per-screen consequences are in
`docs/decisions/2026-09-07-ux-decisions.md`; `00` D26 points here. They exist so that the next
twenty fixes have one taste rather than twenty.

**R1 — The subject first.** A screen's subject — the list, the exercise options, the notation —
starts within the first screenful on the phone, upright. Explanation is one line in the header at
most; the long version lives *behind or below* the thing it explains (a `<details>`, a sheet, a
link), never above it. The one exception is an error's remedy, which appears when the error does
and not before.

**R2 — Two reading distances.** Screens used on the music stand — Score, PDF, Paper practice,
Drill, Metronome — are read at arm's length and stay large. Every other screen is held in the
hand and uses ordinary phone density: a list row is one title line, one line of muted detail, and
badges only when they say something the detail line does not; a settings row is a label and its
control on one line, with the sentence of help — where the label cannot carry the meaning —
underneath both of them, never squeezed beside the control. Targets, so the tour can check them:
a Today or Plan row **≤ 96 px** tall, a settings row **≤ 56 px**, a settings row *with* a
sentence **≤ 100 px**, at least **eight settings** on the first screenful.

The 100 is measured on a 360 px screen and it is a floor, not a preference: the control sets the
height of the first line (40 px for a tick box, 48 for a button — both of them a thumb) and two
lines of sentence under it are 40 more. What breaks it is a third line, so a hint is written to
about **eighty characters**. Anything longer belongs on the screen it explains, not here.

**R5 — Sideways on a phone, the header is one line of 40 px.** A phone held sideways is
780 × 360 and every screen was spending its first 40 % on a header carrying nothing the side
nav does not already say. So: a **tab** screen draws no `h1` — the side nav says which tab
this is, in the same glance, permanently — and its first row is the row that had the
controls. A **pushed** screen (a sub-screen, a lesson, a drill) keeps its title, because
"which drill is this?" is a question only the screen can answer, but on the back link's line
at body size. Cards are full width: a 610 px centred card is a portrait shape on a landscape
screen. A sub-screen with more than one `section.block` lays them in two columns; one block
stays one column, since a column of content beside a column of nothing is the thing being
fixed. Lists whose rows are all the same shape run in two columns — **not** Skills, whose
rows nest drill rows of varying height, and which goes back to one column on the tablet for
the same reason. A grid whose cells are not the same height is worse than a list. Target, so
the tour can check it: the first content within **48 px** of the top, and no `h1` above body
size. Media query: `(orientation: landscape) and (max-height: 500px)`.

**R3 — Weight by frequency.** A filled box is the thing you do on most visits, and there is at
most **one per screen**. An outlined box is something you do often. Plain text is something you do
once per lesson or less — reorder, mark done, register a book, find more. A rare action that needs
several controls (ordering tracks, choosing sections) lives in a sheet behind one text link, not
on the screen it is rarely used on.

**R4 — Nothing dead.** When a screen's subject is missing, it draws the sentence that says so and
the one control that does what the sentence suggests. No furniture: no empty grid, no live toggles
that act on nothing, no "Disconnect" while disconnected, no statistic with no data behind it. A
single-line list is not empty and gets no special treatment.

## 1. Navigation

Bottom tab bar (portrait) / left rail (landscape): **Today · Plan · Library · Progress · Settings**.
Score screen is a full-screen route pushed on top (back gesture returns).

## 2. Today

**§0:** a hand screen (R2) — rows ≤ 96 px. Its one filled box (R3) is **Start session**; *Jump to…* and *Metronome* are text. The session card is the subject and starts within the first screenful (R1).

- Header: minutes this week / weekly goal (no daily-streak guilt), days practised this week,
  **input chip** showing the active follow input (MIDI 🎹 / Mic 🎤 / Timed ⏱ / Manual) —
  tap → Input screen.
- **Session length picker:** 15 · 30 · 60 · 120 min (remembers weekday vs weekend choice).
  Short sessions = technique + review + one new item; long sessions = full template plus a
  repertoire block and, if the jam module is active, a jam block (chord-chart practice).
- **Jump to…** button: opens any stage/unit/lesson directly; and **Review a skill**: opens the
  Skills review screen (§3a).
- **Session card** (auto-built from the template in curriculum Part A §8): Warm-up (1–2
  technique drills in the current keys) · Review (due items) · New (current lesson's chosen
  exercise + song) · Repertoire (a mastered piece) · Free play prompt. Each row: title, level,
  hands, est. minutes, ▶ button. Tapping ▶ opens the Score screen for that item.
- **"Swap this"** on every row — not just the whole-card "shuffle" — offers the alternatives
  for that slot (`00` D21): the other options in the same lesson first, then any catalog item
  at the same level sharing a concept tag, and then the item's own `alternatives[]` if it has
  them. A **"not a song"** filter is on the sheet, because half the point of the exercise
  breadth is that a skill can be practised without a tune attached.
- **An import-only item always shows what to play instead.** A rock-module song you have not
  imported yet is not a dead row: it offers the public-domain vehicle its technique brief
  names ("play Moonlight I — same texture"), taken from the item's `alternatives[]`.
- "Shuffle options" swaps every row at once, as before.
- "Start session" runs the rows in order with a between-item summary.
- **A row the builder cannot fill is dropped, not shown empty** (P7). An empty row is a hole
  the learner has to fill by hand, which is what this card exists to avoid; free play is the
  exception, because it is a prompt and never has an item. On a fresh Stage 0 profile that is
  the difference between a usable card and three filled rows out of nine.
- **The swap sheet has a fourth, loosest tier** after the three above: anything playable of
  the same type within one level. The three tiers genuinely come up empty at Stage 0 — few
  drills, few shared concept tags — and a swap button that offers nothing is a dead button.
  Review and repertoire fall back the same way when nothing is due and nothing is mastered,
  which is what the first week always looks like.

## 2a. Metronome (standalone)

A metronome you can switch on without a score in front of you — for scales, for
counting a piece you are reading from paper, for anything the app does not know about.
Reached from Today's Tools block and, later, from the Score screen's control bar (§5),
which drives the same `audio/Metronome`.

- **Tempo:** a large tabular-numeral bpm readout, a 30–240 slider, ±5 buttons and **tap
  tempo**. Tap tempo averages the last four intervals and restarts after 2.5 s of silence,
  because two taps a minute apart are two attempts and not a 1 bpm tempo.
- **Bar:** 2/4, 3/4, 4/4, 6/8 buttons, one dot per beat, the first accented. **The dot
  lights when the click sounds, not when it is scheduled** — the scheduler runs up to
  100 ms ahead (`01` §4.4), and a flash that early reads as wrong even when the audio is
  exact.
- **Sound:** wood, beep, high. The screen says why "high" exists: it is the 5 kHz click the
  mic detector notches out (`05` §11.4), so it is the one to use when the microphone is
  listening.
- Volume follows the metronome setting in §7. Leaving the screen stops it.
- No count-in here: a count-in belongs to a run of a piece, not to a metronome you are
  using as a clock.

## 3. Plan (curriculum browser)

**§0:** a hand screen (R2). Its one filled box (R3) is the stage being worked on; *Placement test*, *Review a skill* and *Tracks…* are text or chips. Ordering tracks is rare and lives in the **Tracks…** sheet, not on the screen (R3). A lesson card never repeats its unit's title (D26).

- Stage list (0–9) with completion rings; expand → units → lessons.
- Every lesson is openable regardless of status. Lesson page has **"I already know this"**
  (marks self-passed; distinct badge from a measured pass) and **"Quick check"** (a 2–3 minute
  measured test built from the lesson's drills) so the owner can move on fast or confirm.
- Lesson page: concept text (markdown), videos (list of link cards opening YouTube), **Exercise
  options** and **Song options** as cards (title, composer, level, hands, duration, source
  badge, status badge new/started/passed/mastered, "Import needed" for `[IMPORT]`). Any card
  → Score screen. "Mark lesson done manually" (with confirmation) for the no-MIDI honour path.
- **What this rung still needs** (P15, replan §4.2). One line above the options: "This rung
  wants one more song to reach the floor of 3. Find one, or play what is here." The numbers
  are `needs`, written into the built curriculum by `validate.py` — the lesson page reads
  them rather than recounting, so the counting rules (the floor; a song-optional rung
  counting both lists together) live in one place.
- **Find more** opens the finder sheet (`02` terminology): the search line and the chat
  prompt, each with Copy; what the piece must have and what makes one wrong; the examples,
  badged *already yours* or *not found yet*; and the formats line. Both prompts are generated
  at build time and shipped — the sheet presents them and never composes its own wording,
  because the validator only checks the generated one.
- **Import for this rung** goes to `#/library?for=<lessonId>`, opens the file picker, and the
  assign sheet (§4) comes back with that rung already chosen.
- Track chips at the top (Classical, Chords & Pop, Blues…) with toggle "active"; ordering by
  drag.
- Placement test entry (Stage 0.4).

### 3a. Skills review

**§0:** opens on what needs attention (R1): the rusty concepts if there are any, otherwise the current stage and the one below, with *Show all* revealing the rest in pages. *Drill it* is the box; *Find more* is text (R3).

A grid of every concept in the curriculum (from `concepts[]` across lessons), each with its
state (never / self-passed / measured / mastered / rusty = not practised in 30 days) and a
"Drill it" button that launches the concept's drill or a matching short exercise. Filters by
stage and track. This is how "go back and practise old skills" works without navigating the
plan.

**Named, and findable** (P15). Each row shows the concept's *display name* from
`content/curriculum/concepts.json` — the screen used to derive a label from the id, which
gives you `Cc64` and `Ii-v-i` — and carries **Find more**, opening the same finder sheet as a
rung does. A concept finder exists whether or not any rung is short, because "find me more of
this" is a question about the skill and not about the ladder. Six concepts are features of
this app rather than musical skills (wait mode, tempo mode, the review queue,
self-assessment, the placement test, performance mode); they have a name and deliberately no
finder.

### 3b. Chord-chart view (jam module)

A lead-sheet view with big chord symbols per bar, a form tracker (bar/chorus counter), tempo,
count-off, optional backing loop, and swing toggle — used for jamming practice when notation is
not the point. Any item with `<harmony>` data can open in this view; the input chip still
works (mic/MIDI can highlight the chord you actually play vs the chart, amber if different).

## 4. Library

**§0:** the list is the subject and starts within the first screenful (R1). The six filters live behind a **Filter ▾** chip; the count line names any filter that is set, so a hidden filter cannot silently empty the list. *Import a score · Shelf · Score folder* sit as text at the foot of the list.

- Search + filters: type, track, level range, hands, key, time signature, concept tag, status,
  source. Sorting by level/title/recent.
- Imports section: **"Import a score"** — a file picker taking `.musicxml`, `.mxl` **and
  `.pdf`**, plus share-target intents when installed and drag-and-drop on desktop. The list of
  imported items shows the kind, and offers edit (title, level, tags) and delete. A bad file
  fails with one sentence from the parser, not a stack trace (§9).
- **A PDF item is a second-class score on purpose**: it opens in the PDF viewer (§5b), not the
  Score screen, and its card says "pages, not notes" so it is obvious why Wait mode is not
  offered. Anything you want judged has to arrive as MusicXML.
- Item detail sheet: metadata, sections, practice tips, media, "Open".
- **The assign sheet** (P15, replan §4.3). After an import that arrived with a rung in mind —
  an Android share, or **Import for this rung** on a lesson page — a sheet opens by itself
  asking where the piece goes: the rung (pre-selected from `?for=`), the level (the runtime
  estimate from §4.4, shown as `≈` and editable), and the concepts (the rung's). One tap on
  **Save**. From a share that is **two actions in total**, against the eight the old path
  took, and the e2e suite counts them rather than taking the claim on trust.
  - A plain Library import does *not* open it. Importing from the Library screen is filing,
    not answering; a sheet over the list would be covering the list he came to look at. The
    row carries an **Assign** button beside **Edit**, so the sheet is one tap away when he
    does want it — and it is the way back to the sheet for anything already imported.
  - Assigning is optional: "No rung — just put it in my library" is the first choice, and is
    what an import used to be.
  - Typing over the estimate makes the level *judged* rather than *estimated*, so the app
    stops printing the `≈`: the owner is a better source than the model he is overruling.
  - The assignment is what makes the piece an **option of the rung** — `curriculum/load.ts`
    appends it to that lesson's `songOptions` at load, so it counts towards finishing the
    rung, turns up in swaps, and can be chosen by the session builder. It is in the backup.

## 4b. Score folder (browsing files that live on the phone)

**§0:** one state line and the button at the top; the explanation goes in a `<details>` under it (R1). With no folder picked the browse block is not drawn at all (R4).

Added 2026-09-06 (owner: *"I plan on putting the files on my phone… it should ask for folders
with the data anyway and just use the CSV or the generated index to find them, and add other
files too, not just the ones in the archive"*). Decision note:
`docs/decisions/2026-09-06-p14-folder-library.md`.

§4's import is one file at a time, which is the right shape for a score you bought and the
wrong one for 37,261 files sitting in a folder. So there is a second door, reached from
Library → **Browse a score folder** (`#/library/folder`):

- **Pick a folder.** `<input type="file" webkitdirectory>` — the way to hand a folder to a web
  app on Android that is known to work, and the default. **Corrected 2026-09-06 (P19):** MDN
  lists `showDirectoryPicker` from Chrome for Android 132; until the owner confirms it on the
  S25 the app re-picks the folder each time, and the **Remember the score folder** setting
  (Settings → Content, off by default) turns the stored handle on. Everything that can go
  wrong with a handle — no API, a refused permission, a folder that moved — falls back to the
  picker, so the worst case is the behaviour without it.
- **The listing is kept, the files are not.** The folder's rows go into IndexedDB
  (`folderLibraries`), so browsing works with nothing plugged in, months later. Adding asks
  for the folder again — one tap, and only when something is actually wanted — or asks Chrome
  for permission on the stored handle, if there is one.
- **A row is marked *Added* by its file, not its title.** PDMX has six files called *The
  Entertainer*; matching on the title greyed out the other five as soon as one was added
  (P19). An import that came from a folder records where it came from.
- **The folder describes itself.** A `library.json` beside the scores supplies title,
  composer, estimated level, bars and rating; `tools/content/pdmx/manifest.py` writes one.
  Nothing about the format is PDMX-specific, and a folder without one still works — each file
  is listed under its own name and titled from its `<work-title>` when it is added.
- **Search, style, level range, "rated 4+ by 5+ people".** Filtering is synchronous over the
  array; only the drawing is capped (60 rows, then "Show more").
- **The only action on a row is "Add"**, and Add is the ordinary import (§4). After it, the
  piece is a catalog item like any other: levelled, searchable, sessionable, in the backup,
  and working with the folder long gone. Browsing is borrowed; adding is keeping.
- **Levels from a manifest are estimates and say so** on the row (`level 3.3 est.`). They come
  from the CSV proxy, not from the score.
- **A title the manifest got wrong is never written over a good one.** The score's own
  `<work-title>` wins; the manifest's title is used only when the score has none (`Untitled`,
  `New Score`, or a bare CID), and never when the row is flagged `title garbled`.

Not offered, deliberately: opening a score straight out of the folder without adding it. It
would work for as long as the picker's grant lasts and then stop, and a piece you practised
last week vanishing is worse than a tap.

## 4c. Shelf — the books he already owns (P16)

Library → **Shelf** (`#/library/shelf`), from replan §5.1. The app has no copy of these books
and never will; what it holds is a register.

- A **book**: title, author, kind (method / repertoire / other), optionally the owner's own
  PDF of it (`pdfImportId`) and its `barsPerSystem` — stored per book rather than per open,
  because it is a fact about how the book is engraved.
- A **piece** in it: title, page, which rung it answers, concepts, level (`≈` until he types
  one), and optionally a **twin** — a bundled or imported item with the same notes, found by
  search.
- **Everything is typed in.** Nothing is scanned, no OMR runs, no page is inferred. He is
  looking at the paper and reads the number off it, which is the one input that is certainly
  right.
- A registered piece becomes a **`paperOption`** of its rung at runtime (the overlay P15 built
  for imports), so it appears on the lesson page under *From your own books* and can complete
  the rung — see §5d for the terms.
- The twin is what makes paper practice scorable without pretending: with one, "With the
  score" opens a normal measured run; without one, §5d measures only what it can hear.

## 5. Score screen (the core)

**§0:** a stand screen (R2) — it stays large. The control bar reserves its own height rather than floating over the notation, so the space below the last stave belongs to the layout, and it hides itself only where the fit had used every pixel of the stage anyway (decision 5). It holds six controls and a `⋯`; the settings you change once live in the sheet behind it. **Blind mode hides the notation** — `visibility: hidden` on the stage is defeated by `visibility: visible` on the front buffer, so the buffer rule must not be unconditional.

Layout: a **header row** across the top — `← Back`, the piece's name, then the app's own
messages and the mic meter — the notation under it, a **thin control bar** along the bottom,
and the keyboard strip under that. The header is a row in the column, not a line floating over
the notation: three absolutely-positioned lines cost the stage a constant 3 rem upright and
printed the title across bar 1 sideways.

The control bar **auto-hides after 3 s during a run, and only when it is taking room from the
notation** (decision 5, 2026-09-07) — and after 0.7 s at the run's start, because sideways the
three seconds were the lower staff of the first bar hidden behind it, every run. Outside a run the stage reserves the bar's height rather
than being covered by it. **During a run the stage takes the bar's row** (P21d A6, built in
P21e): the sheet is fitted once, at the run's start, to the height without the bar, and when a
tap brings the bar back it overlays the foot of the sheet for three seconds rather than pushing
the music up and down on every tap. What "in the way" means is that the fit used the whole
stage: held sideways it does and the bar goes; held upright the sheet is fitted to the width
and leaves the bottom third of the stage empty, so hiding the controls would buy nothing and
cost a hunt for them. One measurement, when the timer fires — never per frame.

**Sideways on a phone the header row is not drawn** (`04` §0 R5, P21d A6): `← Back`, the
title and the status line sit at the bar's left end instead, mirrored from the header, and the
keyboard strip is 56 px rather than 72. With the bar's row going to the stage during a run, the
music has about 300 of 360 px where it had 194.

**One size for the run** (P21e A2). The fit measures the *piece* — a third, never-shown
engraver draws the whole score once per zoom and the tallest system in it sets the scale — so
a bar with a ledger line is not engraved smaller than a bar without one, and the staves of both
slots sit at the same height in every window — anchored on the stave *lines* from the
engraver's model, not on the drawn group, whose top is wherever the highest fingering landed.
Until that measurement has run (one frame after the first draw) the tallest window seen so far
stands in, held and never released. A run keeps the scale it started at: ink up to a tenth
taller than the fit runs into the margin rather than shrinking the sheet; only ink taller than
that still shrinks it, once.

**Sideways, the sheet is engraved in chunks** (P21e A3): the window, two bars behind it and
two ahead, so the bar being played always has neighbours on both sides to slide against. The
slide holds it a third of the way across from the first chunk swap on, and the swap is
invisible because the same bars sit at the same places on both sheets.

Control bar, in this order and **nothing else**: `▶`/`⏸` · **`Hear it`** · mode selector
(`Wait for me` / `Keep tempo` / `Play it to me` / `Free play`) · hands (`R` `L` `Both`) · the
tempo label (tap opens a sheet with the % slider, 30–130 %, and a typed bpm field) · `⋯`.
These are the things that change during a practice; one row in every form factor, on a phone
either way up and on a tablet.

**`Hear it`** plays the piece — or the loop, if one is set — with both hands through the
current Sound destination, cursor moving, nothing judged; a second tap stops it. It is Listen
mode without having to know Listen mode exists, and it does **not** move the mode selector:
what it interrupts is put back when it ends, and `▶` during one ends it and starts the run
you chose. The screen carries `data-hearing` so the run's mode and the selected mode stay two
facts rather than one.

The modes are named for what they do to *you*, not for the mechanism. `Listen` in a row
beside `R`, `L` and an input setting read as something done with your playing, which is how
the owner came to ask for a way to hear a piece while looking straight at the control that
does it. The ids are unchanged (`wait`, `tempo`, `listen`, `free`).

`⏮ Start again` is **in the `⋯` sheet**, not on the bar. Eight controls come to 444 px of a
390 px row and wrap it onto a second line, taking 40 px off the music; `▶` from stopped
already starts from the beginning, so the glyph was the mid-run case only. The test for the
bar is *do you need it while your hands are on the keys?*

With `R` or `L` chosen and `playbackHands: non-focused`, the status line says `Playing the
left hand for you` **once** when the run starts. The sound is otherwise a note arriving from
nowhere, which on a stand with no piano connected reads as a fault.

`⋯` opens a sheet holding everything else, each with its word beside it: **Input**
(MIDI / Mic / Screen keys / None) · **Section** (only when the piece has named sections) ·
**Loop** (set A/B by tapping bars, or pick a section) · **Metronome** · **Bars in window**
(1–8) · **Size** (zoom ±) · **Layout** (`Window` | `Scroll`, a segment: it is a state, not a
verb) · **Keys** (`Keys` | `Ribbon` | `Off`, a segment) · **Sound** (Phone / Piano / Both) ·
**Blind** · **Perform**.
The controls are moved into the sheet and back, not rebuilt, so each keeps its state and its
id.

Notation area:
- **Window layout, upright — two slots.** The stage holds two systems and they are two
  independent engravings of N/2 bars each, not one window of N. **The slot the cursor is in
  is never re-drawn**; the other shows what comes next and is replaced on idle time after the
  cursor crosses into it — at the latest 100 ms later — fading over ~150 ms. The crossing
  itself is a class toggle: the re-drawing is never on the path between a key and its colour. The eye goes top, bottom,
  top — the arrangement karaoke uses — and the coming bar has been on the screen for a whole
  bar by the time it is played. Not a setting: it is how the window works (P21c A3). A screen
  at least 600 px tall — a tablet either way up, a desktop window — has the two slots
  sideways as well; the single sliding system is for a phone held sideways, where the height
  holds one.

  "What comes next" follows the **playing** order, not the printed one: at a repeat the other
  slot shows the repeat's first bar, and at a first- or second-time ending the ending that
  will actually be played on this pass. At the last bars of a piece the other slot keeps the
  bars just played, as a page would; it does not go blank.

  Both slots are drawn at **one scale** — they are engraved separately, so fitting each to
  its own half would draw a bar of minims larger than a bar of semiquavers.

- **Window layout, sideways — one system.** Nothing to alternate, so the window is N bars
  scaled to fit the width, and the next window is pre-rendered into the spare buffer so a
  swap is a class toggle. A window of one bar is this layout upright too.
- **Scroll layout:** full piece, auto-scroll keeps the cursor between 25–40 % of viewport
  height; manual scroll pauses auto-scroll for 5 s.
- **Cursor:** translucent vertical band over the current step's notes spanning both staves.
- **Note colouring:** upcoming = default black; current step = blue outline; correct = green;
  wrong/missed = red; extra notes played that are not in the score are shown on the keyboard
  strip in red, not on the score. Non-focused hand dims to 35 % opacity.
- **Keyboard strip** (optional, bottom 12 % of height): 88-key mini keyboard, expected keys
  highlighted blue, pressed keys green/red; scrolls to keep expected keys visible. This is the
  no-MIDI learner's main feedback and also the ScreenKeyboardSource input surface (tap to play
  — enabled only in Free/Wait mode when no MIDI input is present).
- **The ribbon** (P21d A6, `keys: 'ribbon'`): the same keys as a 32 px band, one cell per
  semitone over the piece's range, the wanted key in blue with its **name** over it, the next
  one paler, played keys green or red. Not tappable. The strip's information at a third of
  the height, for a player with a piano connected; which of the two he wants is his taste
  (`keys` in §7: `strip` | `ribbon` | `off`).
- **Follow options on a phone** (the owner asked for several): (1) Wait mode with MIDI;
  (2) Wait mode with the microphone; (3) Tempo mode (timed to the song), with or without
  MIDI/mic judging; (4) Manual scroll layout with tap-to-advance (tap right half = next window,
  left half = previous) for playing from paper-like pages. All four use the same window/scroll
  layouts and bars-per-window setting.
- **Mic feedback colours:** correct = green, probable wrong = amber (mic can't be certain),
  missed = grey outline; a small mic-level meter sits in the control bar with a red "clipping"
  or "too quiet" hint.
- **Mode behaviours** are in `05-score-follow-engine.md`.
- End-of-run summary sheet: accuracy, timing (early/late histogram), tempo achieved, wrong-note
  hot spots (bars), pass/master badge, buttons "Again", "Slower (−10 %)", "Faster (+10 %)",
  "Loop the weak bars", "Done". Without MIDI: "How did it go?" (Rough / OK / Clean) self-report.

Gestures: single tap toggles control bar; double-tap a bar sets loop start/end; **long-press a
bar (400 ms) plays that bar**, both hands, once, at the current tempo, band moving, nothing
judged, and puts the run back afterwards — the "show me what this is meant to sound like" for
a bar you are stuck on. (Pinch-to-zoom and a two-finger tap for hands were listed here and never
built; struck — Size and hands have buttons, `08` §11.20.) A drag of more than
12 px is a scroll and cancels the press; less is a finger.

**Bar numbers in a gesture are as printed — 1-based.** `loopFromPrintedBars` looks for
`sourceMeasureIndex === fromBar - 1`, and the fallback that reads the current window returns a
0-based index, so the two have to be converted between. They were not, and since nothing in
the DOM carries `data-measure` the fallback is the only path there is: every loop the
double-tap gesture built asked for bar −1 and got nothing.

**A beat of warning (Tempo and Listen only).** The cursor band marks the current step; a
short line under the stave marks the next one — not a second, paler band, which read as two
cursors — and the keyboard strip shows the next expected key in a paler blue behind the
current one. Wait mode has no clock to be ahead of and draws
neither — a mark on a note nobody is going to reach yet tells a beginner to hurry. The warning
band refuses the nearest-note fallback the cursor uses: a coming step that is not drawn hides
rather than marking a note that is not next.

**You can see the beat.** During the count-in the bar's beats are drawn large over the
notation with the current one lit, counted from the piece's own time signature; during a run a
dot in the header pulses on every beat and brighter on beat 1. Both are off in Wait and Free.
Clicks alone leave the first note unannounced on a phone with the sound low, which is the one
moment a beginner most needs to know when to start.

## 5b. PDF viewer (imported PDFs)

**Dark paper.** Under the dark theme the rendered page and the adjust-mode thumbnail are
inverted (`filter: invert(1) hue-rotate(180deg)`), which is what the score screen and the
drills already do with their notation. A white letter page on a stand in a dark room is the
brightest thing in it. `data-paper="light"` on the screen turns it off for a scan that
inverts badly — a photograph of a page rather than a clean scan comes out a negative.

**The first time a PDF opens upright**, the status line says `Turn the phone sideways for a
bigger page`, once, ever. Fitted to 360 px a letter page's system is 59 % of print size;
fitted to 780 px it is 127 %.

**§0:** a stand screen (R2). A system fitted to the width is as large as it can be drawn; the height left over belongs to the layout, not to black.

**From P16:** the route takes `?page=<n>` (`#/pdf/<importId>?page=12`) and opens at the first
system on that page — a shelf piece knows which page it is on, and opening at page one would
waste the one fact the owner took the trouble to type in. `barsPerSystem` is read from the
linked book rather than being set per open.


The owner buys sheet music as PDF, and a PDF on a phone screen is unreadable at page scale.
This viewer solves exactly that and nothing more: **it shows one system at a time, full
width.** See `docs/decisions/2026-09-05-p4-pdf-sheet-music.md`; the page-cutting is
`app/src/pdf/systems.ts`, written and tested in P4, and the renderer is `pdfjs-dist`.

- **Layout:** the current system fills the width; **the systems after it fill the height,
  greyed** (P21d D1), so the eye always has somewhere to go and the black under the page is
  music. Advancing moves the column up one system. Page and system number in the corner.
- **One row of chrome** (P21d D2): `←` · `◀` `▶` · `Tap` `Timed` `Loop` · metronome · the
  page label · `Adjust cuts` as text. The bpm and bars-per-system fields live in a sheet that
  opens from the `Timed` chip when Timed is already on.
- **Follow modes offered:** *manual tap* (tap right half = next system, left = previous),
  *timed* auto-advance, and *loop a system*. A PDF has no notes, so the app cannot know how
  long a system lasts. **Timed learns it from the last two manual advances** (P21d D3) — the
  gap between two taps of `▶` while playing, between 2 s and 120 s, the way tap-tempo works —
  and falls back to `bars × 4 × 60/bpm` (bars per system default 4) when there have been no
  taps to learn from. The status line says which it is using. The metronome can click
  alongside, from the same `audio/Metronome` as §2a.
- **Wait mode, mic-follow and MIDI-follow are hidden, not disabled**, along with note
  colouring, the keyboard strip and scoring. A PDF has no notes to match, and a greyed-out
  control invites the question "why not?" every time it is seen.
- **Cut correction is required, not optional.** System detection assumes a clean, digitally
  typeset page; a scan or a photo will cut in the wrong place. A "adjust cuts" mode lets the
  learner drag the horizontal cut lines on the page thumbnail, add or remove a system, or
  re-detect one page; the corrections are stored with the item and beat detection from then on.
  Without this, one bad detection makes a file useless. The stored shape is
  `imports.cuts` — fractions of the page height, in `[top, bottom]` pairs; see `01` §4.5 for
  why fractions and why pairs. A page the detector finds nothing on falls back to the whole
  page, never to an empty viewer.
- **No OMR.** Turning a PDF into notes is an offline desktop step (Audiveris, MuseScore); the
  result comes back through the MusicXML import.

## 5d. Paper practice — `#/paper/<bookId>/<pieceId>` (P16)

replan §5.3. The music is in a book on the stand and the app has never read it. The screen is
built around one discipline: **measure what can be heard, say what cannot, and never record an
accuracy.**

- Metronome with the count-in from §7, a tempo box, the keyboard strip, MIDI and microphone
  capture, and a timer.
- **What it measures.** Notes heard, minutes, tempo, and — with the click running and MIDI
  connected — *tempo steadiness*: the standard deviation of onset offset from the nearest
  click. Chords count once (five fingers are one rhythmic event); an onset more than 250 ms
  from every click is a different note rather than a late one and is excluded and counted;
  fewer than twelve usable onsets reports "not measured" rather than a confident number drawn
  from three taps.
- **What it never measures.** Accuracy. The summary ends: *"It cannot see the notes, so
  nothing here says whether they were the right ones. That part is your call."*
- **The three-button self-report** (Rough / OK / Clean) from §5. "Clean" writes a pass, marked
  `selfPassed` and badged the way "I already know this" is. It is never master-eligible:
  mastery needs two measured passes and nothing here was measured.
- The `sessions` row is `mode: 'paper'` with `notesHeard`, `steadinessMs` and `bpm`, and an
  accuracy of 0 that the Progress screen deliberately never prints as a percentage — a zero
  there would read as a verdict instead of an absence.

### 5e. Blind mode and performances (P16)

- **Blind** (`#/score/<id>?blind=1`, replan §8) hides the engraving and changes *nothing else*
  — same model, same expectations, same scoring, keyboard strip and cursor still live. That
  identity is the feature: "blind at 90 % of your sighted run" only means something if both
  were measured the same way. The stage is `visibility: hidden` rather than unmounted so the
  layout does not move when a run starts. Rung 4.7 asks for exactly this.
- **Perform** (`?performance=1`) is one pass through: no restart button, no looping, and the
  run is recorded `performance: true` whatever the accuracy. Progress lists them separately,
  because playing a piece for somebody is a different act from practising it and it is the
  thing that quietly never happens.

## 5c. Drill screen (P8)
**Tips and coaching (P17, replan §6).**

- A collapsible **Tips** block sits under the prompt, from
  `content/tips/<kind>.md`. Same four sections everywhere — *What it's for ·
  How to practise it · Common mistake · How you'll know you've got it* — so the
  advice is always the same shape. Open the first time a kind is met and
  collapsed after (a per-kind `localStorage` flag), because the first run is
  when it is worth reading and the twentieth is when it is in the way.
- **Variants** are chosen by matching a file's `when:` block against the item's
  `drill.params`, most specific first: reading the bass clef is a different
  problem from reading the treble, and tapping a rhythm back is a different
  problem from reading one. The kind file is always a safe fallback.
- The full text appears again on the result sheet, where there is time to read
  it.
- **One coaching sentence** on the result sheet when a rule fires, from
  `engine/drills/coaching.ts` — at most one, because a screen offering four
  observations after a two-minute drill is a screen nobody reads. `null` is the
  common and correct answer. The plateau rule carries a link to `practice.5`.


Drills are not scores (`05` §7), so they get their own screen rather than a mode on §5. One
screen with nineteen faces: the chrome — prompt counter, keyboard strip, right/wrong feedback,
result sheet, progress recording — is written once, and each kind supplies only the thing the
learner looks at.

- **Layout:** counter, the card, one line saying what to do, the controls, and the keyboard
  strip pinned to the bottom. The strip is always there: for a learner with no cable it *is*
  the instrument, and a drill you cannot answer is not a drill.
- **The cards.** *note-flash*: one note on a hand-drawn SVG staff (five lines, a Unicode clef,
  ledger lines, and the accidental the drill's own name uses — E♭ on the E line, never D♯).
  *find-key* and *chord/inversion*: the symbol, as large as the screen allows and nothing
  else. *ear drills*: a headphone glyph and **nothing that names the answer**, with "Play
  again". *rhythm*: a one-line staff of tap heads, filling in as they are caught. *pedal*: a
  lamp that follows CC64 and a line saying how many ms after the chord the lift came. *dynamics*:
  two velocity meters and the ratio against the 1.6× target. *backing-track*: the bar count.
- **It advances itself.** An answer settles the moment it is complete, feedback shows for
  450 ms, and the next card appears — no button between cards, which is the point of a flash
  card. The kinds with no per-answer settle (rhythm, pedal, dynamics, backing-track) get an
  explicit Next/Done.
- **Right and wrong differ by shape, not only colour** (§9): the card's outline goes solid on
  a right answer and dashed on a wrong one.
- **Result sheet:** pass/master against the same accuracy setting a piece uses (§7), the
  kind's own numbers (mean reaction, clean changes, velocity ratio), "Again" for a fresh set,
  and the run recorded through the P7 stores.
- **Sight-reading is not here.** It is generated notation and opens on the Score screen in
  Tempo mode (`05` §8), scored on the first attempt only — after that the material has been
  seen and a second run measures something else.

## 6. Progress

**§0:** the heat map is *Minutes a day, last 13 weeks* and carries a one-line key for its five levels (`0 · <10 · <25 · <45 · 45+ min`).

- Calendar heat-map of practice minutes; streak; weekly minutes vs goal.
- Per-stage completion; per-track completion.
- Repertoire list (mastered) with "last played" and a replay button.
- Session history (table) with per-session detail (accuracy over time chart for an item).
- Export / Import all data (JSON). "Copy debug report".

## 7. Settings (all persisted; defaults in brackets)

**§0:** a hand screen (R2) — a row is a label and its control on one line, ≤ 56 px, with help text under the label only where the label cannot carry the meaning. At least eight settings on the first screenful. Content chips print track *titles*, never ids.

**Practice** — session lengths (weekday default [30], weekend default [60]); weekly goal
minutes [150]; default mode with MIDI or mic [Wait], without [Tempo]; bars per window [2];
layout [Window]; default tempo % for new items [70]; count-in
[1 bar]; metronome sound [wood]; wait-mode strictness [lenient: wrong notes don't block];
tempo-mode timing tolerance ms [±150]; pass criteria (accuracy % [90], tempo % [80]); require 2 songs per
lesson [off]; strict prerequisites [off]; daily goal minutes [30].

**Display** — theme [system]; landscape lock on score screen [on]; zoom [1.0]; show
fingering [on]; show note names in note heads [off; auto-on for Stage ≤ 1]; show chord
symbols [on]; keys under the score [keyboard | ribbon | off, default keyboard]; keep screen
awake [on]; left-handed layout [off].

**Sound** — piano volume; metronome volume; playback plays: both / only the non-focused hand
[non-focused when hand focus set]; **playback destination: phone / piano over MIDI OUT /
both** [phone; auto-suggest "piano" when a MIDI output exists and mic input is active].

**Input** — follow input priority [MIDI → Mic → Timed]; **Microphone:** device (built-in /
USB interface / headset), calibration (run / re-run, shows latency and noise floor), chord
leniency [70 %], strict mic scoring [off], mute playback of expected notes while mic is active
[on]; **MIDI** — input device (auto / list); transpose input semitones [0]; velocity curve
[linear]; treat Note-On velocity 0 as Note-Off [on]; sustain pedal CC [64]; ignore channels;
diagnostics: raw log, latency test (tap a key, see ms), "connected devices".

**Content** — active tracks; show US-only PD items [on]; language [en]; note naming
[letters]; **"Download everything now"** (re-runs the precache and reports total size and
item count); **offline only** [off] (stops the app checking for updates at all — `00` D20);
storage used, with a breakdown by scores / audio / lessons / your imports; reset progress
(double confirm).

### 7c. What §7 actually ships (as of P18, 2026-09-06)

The list above is the target. This is the state, so nobody has to read the code to find out:

**Built and wired to real behaviour** — every Practice setting except the two below; every
Display setting except left-handed layout (show chord symbols reached the engraver only with
the setup tour, 2026-09-09 — it had been a stored value nothing read); every Sound setting; follow-input priority, the four
microphone settings and MIDI input transpose; and in Content: active tracks, show US-only PD
items, "Download everything now", offline only, the storage breakdown and reset progress.
Weekday/weekend session length lives here *and* on Today's picker — one value, two places to
set it.

**Not built, and why:**

| Setting | Status |
|---|---|
| strict prerequisites | **Built (P18)**, off by default. On, a rung whose prerequisites are unfinished shows a badge and a one-line reason naming what would unlock it, `nextRecommended` prefers a rung he can start, and the option cards open behind a confirmation. **Never a disabled card**: `00` D17 promises that moving on is always one tap, and a disabled card tells the learner no and gives him nothing to do about it. "I already know this" on the prerequisite unlocks it. |
| auto-advance to next window lead · half-window scrolling | **Deliberately dropped (P21c A3).** Both described the same thing — when the learner gets to see what is coming — and the answer is now "always, in the other slot", which is not a preference. The stored value of `halfWindowScrolling` is ignored rather than migrated: `parse` reads only the keys it knows. |
| **daily goal minutes** | **Deliberately dropped.** It contradicts the weekly-minutes decision this spec makes twice over (§2 "no daily-streak guilt", `02` Part A §8 "goals are weekly minutes"). Treat the line in §7 as a leftover; the weekly goal is on Progress. |
| left-handed layout | Mirroring the score screen's chrome; low value for one right-handed owner, not free to build. |
| velocity curve · sustain pedal CC · ignore channels · Note-On velocity 0 as Note-Off | The parser already does the right thing with velocity-0; the other three are unexercised on the one piano this app talks to. They belong on the MIDI screen when there is a second device to need them. |
| language · note naming | One user, English, letter names (`00` A7). A localisation table with one locale in it is not a setting. |
| show US-only PD items | **Built** (P7) — nine bundled items are US-only (`00` A4). |
| require 2 songs per lesson | **Built** (P7) — honoured by `lessonComplete`, and never applied to a `songOptional` unit. |

**Built since, in P18** (`docs/decisions/2026-09-06-p18-carry-overs.md`): the mic's amber
state (§5), named sections and their loop picker (§5), drag-to-reorder tracks (§3), the chord
chart's bass-and-drums loop (§3b), and the tablet side panel (§7a; the four-bar default it had went with the multi-slot arrangement, `08` §4.1).

### 7d. The setup tour (`#/settings/setup`)

The first launch of a fresh install lands here rather than on Today — a launch, not a deep
link: a piece, a lesson or a drill opened by its address is left alone. Nine steps, one
screen each, in the order a person meets the app; every control writes straight through to
the same stores Settings writes, so leaving half-way loses nothing and Settings shows what the
tour set. **Skip for now** is on every step and is remembered, as is **Finish**; after either,
the tour is the first row of Settings — *Setup tour · Run again*, with the date it was last
finished or skipped.

| Step | What it does |
|---|---|
| Welcome | Two sentences on what the app does; Start or Skip. |
| Which way will the phone sit? | Two **miniatures of the score screen in this phone's own proportions**, upright and sideways, drawn by the real engraver with the arrangement each way up gets (slots upright, a sliding system sideways), captioned with the fraction of real size they are shown at. A tap chooses; the choice is the score screen's landscape lock. |
| Your piano | *Connect piano* (the same permission prompt and recovery text as the MIDI screen), the inputs to pin, a strip that lights up from the cable or from a tap; *No cable? Use the microphone* folds out the mic's connect, level and a fifteen-second calibration; the follow-input priority. |
| How late is the piano? | The latency test — eight clicks, tap on each — with the median saved as the input latency the moment it ends. Skippable for a mic or the screen keys. |
| Sound | Test sound, the two volumes, the metronome sound, playback plays / destination. |
| The screen | The **miniature the way the phone was chosen to sit** — header, stage, keys and control bar at their real proportions — redrawn as theme, keys, fingering, chord symbols, size, bars per window and layout change, with *Show it sideways / upright* to see the other; landscape lock and keep-awake. |
| How it follows you | The four modes in one line each, *Hear it* and the long-press; the default modes with and without an input, count-in, default tempo, strict Wait, tolerance, the pass criteria. |
| Your practice | Weekday and weekend session lengths, the track chips, strict prerequisites, two songs per lesson. |
| Ready | A summary of what was set, and where to find the tour again. |

The miniature (`ui/devicePreview`) is built from the phone's own short and long sides and the
score screen's chrome at its real heights, scaled as one to the width the card can give it, and
the renderer is told which way up it is (`WindowRenderer`'s `orientation`), so the arrangement
follows the miniature rather than the window it sits in. The latency test and the mic
calibration are the same routines the Diagnostics and Microphone screens run
(`audio/latencyTest`, `audio/pitch/calibrationRun`), so a number measured here is the number
measured there.

## 7b. Diagnostics

One screen, reachable from Settings and from the score screen's ⋯ menu, whose entire purpose
is to be *copied into a message* when something misbehaves. "Copy debug report" puts all of
it on the clipboard as text.

- **Offline and storage** (`00` D20): service-worker state, **precached n of m catalog files**,
  total bytes cached, last successful update check, whether the app is currently online. A
  missing-files list if n < m, because a silently skipped precache (the soundfont exceeding
  Workbox's 2 MB default) is the failure mode this screen exists to catch.
- **MIDI**: connected devices, raw message log (last 200), latency test (tap a key, see ms).
- **Microphone**: level, noise floor, detector confidence histogram, calibration values.
- **Render**: window-swap ms, cursor-update ms, MIDI→colour latency, frame drops — the
  numbers `01` §6 sets budgets for.
- **Content**: catalog item count by type and by track, curriculum stage/unit/lesson counts,
  content build id, and **any lesson whose options fall below the three-alternative rule**
  (`00` D21) — so a thin unit is visible here rather than discovered mid-practice.
- **Errors**: uncaught errors and unhandled rejections this session, with counts.

## 7a. Tablet layout

Breakpoint ≥ 900 CSS px shortest side: bars-per-window default 4; a side panel (collapsible)
shows the lesson text, the chord chart, or the keyboard strip enlarged; Plan/Library become
two-column. Everything else identical.

**Ships as of P18:** all of it. The two-column breakpoint (P7), and now the bars-per-window
default of 4 and a collapsible side panel on the Score screen carrying the lesson text of the
rung the piece belongs to.

Two details worth stating. The test is on the **shortest side**, both dimensions: a phone in
landscape is 915 × 412 and would pass a width-only check while having 412 px of height to put a
panel in. And the default never overrides a number the owner has set — it is a default
for a screen with room for it, not an opinion about what he wants.

E2E at 1024×1000 for the panel and the default, and at 412×915 for the phone, which gets
neither.

## 8. Empty/edge states

**§0 R4 — nothing dead.** When a screen's subject is missing it draws the sentence that says so and the one control that acts on it: no empty grid, no live transport over nothing, no *Disconnect* while disconnected, no statistic with no data behind it. A one-item list is not empty.

Mic permission denied: explain Chrome site settings; fall back to Timed. Mic too noisy (noise
floor above threshold): suggest the USB audio interface path or headphones for playback.
No MIDI: the app never nags; "Connect piano" chip stays grey; Tempo/Listen/Free modes work
fully; Wait mode uses the on-screen keyboard. Permission denied: explain how to re-enable in
Chrome site settings (Chrome ⋮ → Settings → Site settings → MIDI devices). **Offline
(`00` D20): everything works** — scores, drills, playback, progress, import of a file already
on the phone — because the whole library is on the device. Only the teaching-video links show
"needs internet", and they say so before you tap them rather than after. A failed update check
is silent. **First launch is the one moment that needs the network**, and the app says so with
a progress bar for the download rather than appearing to hang. Import failure: show the
parser's message and a "Copy details" button.

## 9. Accessibility

All controls labelled; score screen has a "large cursor" option; colour choices pass WCAG AA
and correct/wrong also differ by shape (✓ / ✗ glyph on the keyboard strip) for colour-blind
users; font scaling respected outside the notation.

**Ships as of P7:** every control has a label or an `aria-label`; list rows that act as buttons
carry `role="button"` and respond to Enter and Space; status regions are `aria-live="polite"`;
and the state badges differ by shape as well as colour (✓ passed, ★ mastered, ! needs
importing, ✓/✗ on the chord-chart cells). **Not verified:** the WCAG AA contrast ratios have
not been measured, and the "large cursor" option is not built. Both belong to P9's on-device
pass, where the colours can be checked on the actual screen.
