# 04 — UI specification

Phone-first (Galaxy S25, 6.2", 2340×1080, ~412×915 CSS px portrait / 915×412 landscape).
Every screen must be usable one-handed in portrait except the **Score screen**, which is
designed for landscape on a music stand and touched rarely.

Design language: high contrast, large tap targets (≥ 48 px), dark and light themes (system
default), no decorative animation on the score screen (rendering budget). Typography: system
font; notation is SVG from OSMD. Icons: inline SVG (no icon font).

## 1. Navigation

Bottom tab bar (portrait) / left rail (landscape): **Today · Plan · Library · Progress · Settings**.
Score screen is a full-screen route pushed on top (back gesture returns).

## 2. Today

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
- **The assign sheet** (P15, replan §4.3). After *any* import — the picker, a drag, or an
  Android share — a sheet opens by itself asking where the piece goes: the rung (pre-selected
  from `?for=`), the level (the runtime estimate from §4.4, shown as `≈` and editable), and
  the concepts (the rung's). One tap on **Save**. From a share that is **two actions in
  total**, against the eight the old path took, and the e2e suite counts them rather than
  taking the claim on trust.
  - Assigning is optional: "No rung — just put it in my library" is the first choice, and is
    what an import used to be.
  - Typing over the estimate makes the level *judged* rather than *estimated*, so the app
    stops printing the `≈`: the owner is a better source than the model he is overruling.
  - The assignment is what makes the piece an **option of the rung** — `curriculum/load.ts`
    appends it to that lesson's `songOptions` at load, so it counts towards finishing the
    rung, turns up in swaps, and can be chosen by the session builder. It is in the backup.

## 4b. Score folder (browsing files that live on the phone)

Added 2026-09-06 (owner: *"I plan on putting the files on my phone… it should ask for folders
with the data anyway and just use the CSV or the generated index to find them, and add other
files too, not just the ones in the archive"*). Decision note:
`docs/decisions/2026-09-06-p14-folder-library.md`.

§4's import is one file at a time, which is the right shape for a score you bought and the
wrong one for 37,261 files sitting in a folder. So there is a second door, reached from
Library → **Browse a score folder** (`#/library/folder`):

- **Pick a folder.** `<input type="file" webkitdirectory>` — the only way to hand a folder to
  a web app on Android; `showDirectoryPicker()` does not exist there, so there is no stored
  permission and no re-reading the folder later.
- **The listing is kept, the files are not.** The folder's rows go into IndexedDB
  (`folderLibraries`), so browsing works with nothing plugged in, months later. Adding asks
  for the folder again — one tap, and only when something is actually wanted.
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

Layout (landscape): notation fills the screen; a **thin control bar** auto-hides after 3 s
and returns on tap.

Control bar: ⏮ restart · ▶/⏸ · **input selector (MIDI / Mic / Screen keys / None)** ·
mode selector (Wait / Tempo / Listen / Free) · tempo % slider
(30–130 %) with tap-to-type bpm · hands (R / L / Both) · loop (set A/B by tapping bars, or
pick a named section) · metronome on/off · count-in on/off · bars-per-window stepper (1–8) ·
zoom ± · layout (Window / Scroll) · ⋯ menu (transpose ±, show fingering, show note names,
show chord symbols, keyboard strip on/off, diagnostics).

Notation area:
- **Window layout:** exactly N bars of the grand staff, scaled to fit width (landscape) or
  height (portrait). The window advances when the cursor leaves the last bar (or, setting
  "half-window scrolling": when it reaches bar N/2+1, the next N/2 bars slide in so the
  learner always sees ahead). Pre-rendered next window ⇒ no flicker.
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

Gestures: single tap toggles control bar; double-tap a bar sets loop start/end; long-press a
bar plays it (Listen) ; pinch = zoom; two-finger tap = toggle hands focus.

## 5b. PDF viewer (imported PDFs)

**From P16:** the route takes `?page=<n>` (`#/pdf/<importId>?page=12`) and opens at the first
system on that page — a shelf piece knows which page it is on, and opening at page one would
waste the one fact the owner took the trouble to type in. `barsPerSystem` is read from the
linked book rather than being set per open.


The owner buys sheet music as PDF, and a PDF on a phone screen is unreadable at page scale.
This viewer solves exactly that and nothing more: **it shows one system at a time, full
width.** See `docs/decisions/2026-09-05-p4-pdf-sheet-music.md`; the page-cutting is
`app/src/pdf/systems.ts`, written and tested in P4, and the renderer is `pdfjs-dist`.

- **Layout:** the current system fills the width; the next system is shown greyed below it if
  it fits, so the eye has somewhere to go. Page and system number in the corner.
- **Follow modes offered:** *manual tap* (tap right half = next system, left = previous),
  *timed* auto-advance at a bpm the learner sets, and *loop a system*. A PDF has no notes, so
  the app cannot know how long a system lasts: timed mode asks for the bpm **and the bars per
  system** (default 4) and advances every `bars × 4 × 60/bpm` seconds. The metronome can click
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

Drills are not scores (`05` §7), so they get their own screen rather than a mode on §5. One
screen with twelve faces: the chrome — prompt counter, keyboard strip, right/wrong feedback,
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

- Calendar heat-map of practice minutes; streak; weekly minutes vs goal.
- Per-stage completion; per-track completion.
- Repertoire list (mastered) with "last played" and a replay button.
- Session history (table) with per-session detail (accuracy over time chart for an item).
- Export / Import all data (JSON). "Copy debug report".

## 7. Settings (all persisted; defaults in brackets)

**Practice** — session lengths (weekday default [30], weekend default [60]); weekly goal
minutes [150]; default mode with MIDI or mic [Wait], without [Tempo]; bars per window [2];
half-window scrolling [off]; layout [Window]; default tempo % for new items [70]; count-in
[1 bar]; metronome sound [wood]; wait-mode strictness [lenient: wrong notes don't block];
tempo-mode timing tolerance ms [±150]; auto-advance to next window lead [when cursor enters
last bar's last beat]; pass criteria (accuracy % [90], tempo % [80]); require 2 songs per
lesson [off]; strict prerequisites [off]; daily goal minutes [30].

**Display** — theme [system]; landscape lock on score screen [on]; zoom [1.0]; show
fingering [on]; show note names in note heads [off; auto-on for Stage ≤ 1]; show chord
symbols [on]; keyboard strip [on]; keep screen awake [on]; left-handed layout [off].

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

### 7c. What §7 actually ships (as of P7, 2026-09-06)

The list above is the target. This is the state, so nobody has to read the code to find out:

**Built and wired to real behaviour** — every Practice setting except the two below; every
Display setting except left-handed layout; every Sound setting; follow-input priority, the four
microphone settings and MIDI input transpose; and in Content: active tracks, show US-only PD
items, "Download everything now", offline only, the storage breakdown and reset progress.
Weekday/weekend session length lives here *and* on Today's picker — one value, two places to
set it.

**Not built, and why:**

| Setting | Status |
|---|---|
| strict prerequisites | Nothing enforces prerequisites anywhere yet, so the toggle would be a lie. Needs the advisory-lock UI on lesson options first (`00` D17 says prerequisites are advisory by default, so this is opt-in strictness with no default behaviour behind it). |
| auto-advance to next window lead | The renderer's rule is fixed; making it a setting is engine work, not a control. |
| **daily goal minutes** | **Deliberately dropped.** It contradicts the weekly-minutes decision this spec makes twice over (§2 "no daily-streak guilt", `02` Part A §8 "goals are weekly minutes"). Treat the line in §7 as a leftover; the weekly goal is on Progress. |
| left-handed layout | Mirroring the score screen's chrome; low value for one right-handed owner, not free to build. |
| velocity curve · sustain pedal CC · ignore channels · Note-On velocity 0 as Note-Off | The parser already does the right thing with velocity-0; the other three are unexercised on the one piano this app talks to. They belong on the MIDI screen when there is a second device to need them. |
| language · note naming | One user, English, letter names (`00` A7). A localisation table with one locale in it is not a setting. |
| show US-only PD items | **Built** (P7) — nine bundled items are US-only (`00` A4). |
| require 2 songs per lesson | **Built** (P7) — honoured by `lessonComplete`, and never applied to a `songOptional` unit. |

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

**Ships as of P7:** the two-column breakpoint, with an e2e test at 1024×1000 that checks it and
one at 412×915 that checks the phone stays one column and never scrolls sideways. The
bars-per-window default and the side panel are **not built** — both are score-screen work
rather than CSS, and the owner has a phone, not a tablet (`00` A5: this exists so it works *if*
a tablet ever appears).

## 8. Empty/edge states

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
