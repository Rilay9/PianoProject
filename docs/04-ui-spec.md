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

**Exception, upright, for the two lists of archive titles** (Library and the score
folder; owner, 2026-09-12). R2 assumes a row's words are a name someone chose —
"Mary Had a Little Lamb". These two carry whatever 37,261 files in an archive
happen to be called: "Billie Eilish - all the good girls go to hell", four of
which begin with the same eleven characters. Held upright, 96 px buys about half
a row of words beside two buttons, and every row reads as an ellipsis. So there
the words take the full width and the buttons drop to a line of their own at
full size, costing about 35 px. The owner asked for exactly that trade in these
words: *"make the rows larger in portrait so that the buttons AND the full names
can be seen"*. It is affordable in a list you scroll and is **not** affordable on
a card that has to hold the whole day, which is why Today is unchanged and still
measured against 96. Sideways is untouched, because width is the one thing a
phone on its side has.

**Narrowed, and extended, 2026-09-12** — from the pass that ranked the four tab
screens. The trade the owner asked for is "the buttons **and** the full names",
so it buys a row nothing when the row has one text link on it, and every bundled
catalog row has exactly that: a single *Details* beside a title somebody chose
and wrote down, in a list of 1,533. Measured at 342 px those stood at 101 px
each with about 45 of them a blank band under the words, which is four and a half
rows a screenful. So in the **Library** the exception applies only to rows
carrying more than one action — an imported score, which is where the archive
titles and the *Edit · Assign · Details* strip both are — and an ordinary row
keeps its words on the same line as its one link. The **score folder** stays
unconditional: every one of its rows carries two buttons. And the **Shelf's
piece rows** join the exception for the reason it was written — a piece carries
up to four ways in (*Practise*, *With the score*, *Open the PDF*, *Edit*), which
upright left the words about a third of the row, `No. 12 — Stud…` over
`page 14 · for Right h`.

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

**R6 — A message appears where the thing that caused it is, and its colour belongs to it.**
Added 2026-09-11, from three faults of one shape. A screen's status line is the *last* element in
the body on Plan, Progress, Settings and Drill, so *Saved.* for a toggle near the top of Settings
and *Weekly goal set* for a control at the very top of Progress both landed thousands of pixels
below the finger that caused them — the same fault as "Add flashes and does nothing", where the
reason was written at the top of a list scrolled thousands of rows down. Where a message answers
one control or one row, it goes beside that control or that row (the score folder's failed *Add*
now does). And `status--error` is a property of the *message*: every screen added it and none ever
removed it, so one microphone that would not open left every later *Saved.* printed in red.
`statusLine()` clears it whenever a new message is written, which is the rule stated once instead
of at fifteen call sites.

Done 2026-09-11, and both move layout, so the gallery cells for Settings and Drill are new
pictures:

- **Settings** writes the sentence into the row whose control caused it — a quiet line inside
  `.setting-row`, one at a time, `Saved.` or the toggle's own sentence. The screen's status line
  keeps a copy (it is the one `aria-live` region, and it is what announces) and moves up beside
  the *Download everything now* row, whose progress is the one message on this screen that
  belongs to no single control. The note takes the **hint's** line rather than adding a third
  one, so a row with a sentence is no taller while it shows — the hint says what the control
  does and the owner has just done it. A row with *no* hint grows by that one line, about 18 px,
  for as long as the confirmation is up: that is over R2's 56 px for a bare row and is the
  price of R6 on this screen. The tour's row-height audit does not see it, because no scene
  changes a setting; a scene that does should read a row carrying a `.setting-note` against the
  100 px budget, not the 56.
- **Drill** moves its status line out of the bottom of the body to under the prompt and above the
  buttons, in the same column as the prompt when the phone is sideways. That is where the rhythm
  count-in and "playback is muted while the microphone is listening" are read; sideways the line
  gives up its own height first and scrolls inside it, because the buttons must not be pushed out
  of the scrolling body.
- **Progress** writes *Weekly goal set…* into a line of its own beside the weekly-goal control, at
  the top of the screen where the control is — not the screen's bottom status line, which used to
  print it below the heat map, the repertoire list, twenty performances and thirty sessions. See
  §6.
- **Plan's Tracks… sheet** (§3) writes "The core path is always on — it is what the stages are"
  into a status line of its own inside the sheet, not the Plan screen's status line: the sheet is
  modal and puts everything behind it `inert`, so a message written to the screen's own line was
  both invisible and unreachable to a screen reader for as long as the sheet stayed open. Added
  2026-09-11.

## 1. Navigation

Bottom tab bar (portrait) / left rail (landscape): **Today · Plan · Library · Progress · Settings**.
Score screen is a full-screen route pushed on top (back gesture returns).

## 2. Today

**§0:** a hand screen (R2) — rows ≤ 96 px. Its one filled box (R3) is **Start session**; *Shuffle options*, *Jump to…* and *Metronome* are text. The session card is the subject and starts within the first screenful (R1).

**Ranked, 2026-09-12** (the pass the Plan screen had; see `TodayScreen.ts`). The card said everything at one volume: five identical rows, each badged with the slot kind — a mark on every row, which distinguishes nothing — over a reason line opening with the same word, and each with the *title* cut to `Posture and hand-shape …` so that *Swap* and *▶* could sit beside it. So:

- **Start session moves above the card.** It was under five rows of it: 679 px down a 740 px phone upright and off the bottom entirely sideways, which is a strange place for the one filled box on the screen the app opens on. The card still starts inside the first screenful — the button is one row of 40 px and the card was starting at 198.
- **The slot kind leaves its badge and leads the detail line** (`Warm-up · 8 min · L0.1`). A badge is left for what that line does *not* say: that you have started or passed this, or that it needs importing.
- **A row's title takes a second line** rather than an ellipsis, paid for by the badge line — **except where the row carries a badge**, and then it is one. A Today row is four lines deep (title, reason, detail, badges) and 96 px is one title line plus the other three; both at once is 116. Where there is a badge it is the news and the title is a name already on the card.
- **Free play is a prompt, not a row.** It was a `listRow` — same border, surface and height as the four tappable cards above it — with no click handler, no actions and nothing to press. Every word it carried is still there; the costume is gone.
- *Shuffle options* was the last of the three day-changing actions still drawn as a box; all three are text now, under the card.
- The "Working on…" line names the rung rather than printing `lesson 0.1` beside a unit title that is the same words.

- Header: minutes this week / weekly goal (no daily-streak guilt), days practised this week,
  **input chip** showing the active follow input (MIDI 🎹 / Mic 🎤 / Timed ⏱ / Manual) —
  tap → Input screen. **The chip follows the piano rather than guessing once.** MIDI
  auto-connect is started and not awaited at boot, and it waits on a permission query and then
  on the MIDI access itself, while the router mounts Today on the next line — so on a cold
  start with the HP-130 plugged in and permission granted a year ago, the chip read *Timed* or
  *Screen keys* for the whole visit and a tap on it went to the wrong settings page. It
  subscribes to the MIDI and microphone sources and redraws. Nothing in the suite could see
  this: there is no Web MIDI in jsdom or on a headless runner, so every fixture takes the
  no-input branch.
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
  because two taps a minute apart are two attempts and not a 1 bpm tempo. Two taps the
  clock cannot separate are one tap: keeping both put a zero in the interval average, and
  four steady taps half a second apart then read 160 bpm rather than 120 and stayed wrong
  until the duplicate fell out of the window.
- **Bar:** 2/4, 3/4, 4/4, 6/8 buttons, one dot per beat, the first accented. **The dot
  lights when the click sounds, not when it is scheduled** — the scheduler runs up to
  100 ms ahead (`01` §4.4), and a flash that early reads as wrong even when the audio is
  exact. Those late paints are cancelled by Stop and by leaving the screen: a dot that
  lit a window after the metronome stopped, and stayed lit, was the visible half of the
  same timers going on painting a detached screen.
- **A meter changed while it is clicking takes effect on the next click**, which becomes
  a downbeat — the bar in progress is cut short rather than renumbered, since the beats
  inside the look-ahead window have already been given their accent. Until this worked,
  `setBeatsPerBar` reached only the *next* `start()`: tapping 3/4 on a running metronome
  redrew three dots while the click went on accenting every fourth beat, and on the beats
  the old meter numbered 4 no dot lit at all.
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

**§0:** the list is the subject and starts within the first screenful (R1). The six filters live behind a **Filter ▾** chip; the count line names any filter that is set, so a hidden filter cannot silently empty the list. *Import a score · Shelf · Score folder* sit as one line of text in the header, above the search box — text rather than boxes (R3), but at the top: at the foot of the list they were 4,325 px down with the default sixty rows drawn. The header does not scroll, so the list runs under them.

**Ranked, 2026-09-12.** Two faults, both "the same thing on every row". The detail line said `Hands together` on very nearly all 1,533 of them — three words in the middle of the line that is supposed to tell rows apart, which never tell any two apart, and which pushed the type off the end; it is `RH`/`LH` where the fact is news and silent otherwise, with the full sentence still on the item's detail sheet. And **the drop target is the list itself**: when the import heading and its buttons moved into the header they left an empty `div.block` under the list — no text, no control, but a rule across the screen and seventeen pixels of nothing (R4: no furniture), for a gesture that does not exist on a phone. The listeners moved onto the list, which is also the better desktop target: you drop the file on the thing you are dropping it into.

**The letter rail** (`ui/alphaRail.ts`, the same component the score folder uses) sits beside the
list **only under the title sort** and only when there is more than one page: the default sort is
by level, which is a teaching order, and a letter over that points wherever the letter happens to
fall. It moves the window rather than growing the list, and its letters describe the filtered
list rather than the drawn page — see §4b, where both rules and the reasons for them are written
out.

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
  lists `showDirectoryPicker` from Chrome for Android 132. **Updated 2026-09-12:** it is
  confirmed shipped there, and Chromium's own intent-to-ship records that opening very large
  folders can make the browser unresponsive — which is the freeze the owner reported, at this
  archive's size. Separately, **installed PWAs persist File System Access grants
  automatically** from Chrome 122, without the three-way prompt a plain tab gets; this app is
  installed, so one grant should carry across launches. On that basis **Remember the score
  folder** (Settings → Content) now defaults **on**, at the owner's word: off, every visit
  re-picks the folder and re-reads 37,261 files, which is the whole of what he reported.
  Everything that can go wrong with a handle — no API, a refused permission, a folder that
  moved — still falls back to the picker, so the worst case is the behaviour without it. The
  one fact still unverified is whether the S25 keeps the grant across a relaunch; only the
  phone can answer it.
- **The listing is kept, the files are not.** The folder's rows go into IndexedDB, so browsing
  works with nothing plugged in, months later. Adding asks for the folder again — one tap, and
  only when something is actually wanted — or asks Chrome for permission on the stored handle,
  if there is one.

  **Changed 2026-09-12.** The listing used to be *one* record (`folderLibraries.scores`), and
  IndexedDB can read or write only whole records — so every operation cost the whole listing:
  opening this screen deserialized all 37,261 objects to draw sixty, adding one piece rewrote
  all of them, and a rescan replaced the listing wholesale. It is now one record per score
  (`folderScores`, keyed `[folder, file]`, indexed on the folded title) plus one small record
  per folder holding the arrays this screen filters over (`folderIndexes`), with the folder's
  own row left small. **Opening the screen reads the index and not the rows**; the full rows
  are fetched by key for the page about to be drawn; adding one piece writes one record; and a
  rescan diffs in one transaction — a path that is still there keeps its identity, so a piece
  already added stays added, a new path is inserted, and a row whose file has gone is *marked*
  rather than deleted, because a rescan run with the card out must not be able to destroy a
  listing. See `01-architecture.md` §4.5 for the stores and the migration.
- **A row is marked *Added* by its file, not its title.** PDMX has six files called *The
  Entertainer*; matching on the title greyed out the other five as soon as one was added
  (P19). An import that came from a folder records where it came from.
- **The folder describes itself, and that description *is* the listing.** A `library.json`
  beside the scores supplies title, composer, estimated level, bars and rating;
  `tools/content/pdmx/manifest.py` writes one. Nothing about the format is PDMX-specific, and
  a folder without one still works — each file is listed under its own name and titled from
  its `<work-title>` when it is added.

  **Changed 2026-09-12.** This used to read "a manifest describes the files; the files decide
  what is listed", so the app enumerated all 37,261 directory entries to find out what existed
  and used the manifest only to decorate what it found. That made every permission grant cost
  an archive read, which is the fault the owner reported. It is reversed: each manifest row's
  first field is the file's path relative to the manifest — the same string the add path
  descends — so one file both lists the archive and can reach any piece in it. When a
  `library.json` is found, that file is the library: no directory is enumerated at all.

  The walk is now the **fallback**, for a folder with no manifest and for an explicit rescan.
  It opens no files, works one top-level folder at a time, writes rows as it goes so browsing
  can start early, and resumes where it stopped if the app is killed.

  Two consequences are the trade, and both are said on screen rather than left implicit: a
  score added to the folder *since* the manifest was written is invisible until a rescan, and
  a manifest row whose file has gone is only discovered when Add reaches for it, at which
  point the row is removed and a rescan offered.
- **Search, style, level range, "rated 4+ by 5+ people".** Filtering is synchronous over
  parallel arrays — one folded haystack, letter, level, style id and rated flag per row — and
  those arrays are read from `folderIndexes` rather than folded out of the rows on load. Only
  the drawing is capped (60 rows, then "Show more"). The filter itself is unchanged and is
  deliberately not a worker and not a virtual list: 37,000 rows over typed arrays filter in a
  few milliseconds, and the cost was never the filtering.
- **A letter rail down the side** (`ui/alphaRail.ts`, shared with Library's list). A to Z is
  always drawn, so the rail is a shape that can be learned. A tap **moves the window** — the page
  starts at that letter — rather than growing the list to reach it: growing it drew 4,860 rows in
  2.7 s on 5,000 scores, which on 37,261 is some thirty-six thousand. The count line therefore
  says *where* the rows are ("showing 1,201–1,260"), and the window goes back to the top whenever
  the question changes.
  **The letters describe the listing, not the drawn page.** After a jump the sixty rows on screen
  are all one letter, and a rail reading only its rows dimmed the other twenty-six over a folder
  with something under every one of them — the rail contradicting itself one tap after it was
  obeyed. The screen hands over the set of letters its current filters leave something under
  (computed in the same pass as the filtering; the letter of every row is folded once, when the
  folder is *scanned*, and stored in `folderIndexes` — `letterFor` normalises, and doing 37,261
  of them per keystroke is the sluggishness this list keeps being fixed for). With no filters
  set, a jump asks the database where a letter starts instead: the `byTitle` index is keyed on
  the folded title, so it is a count of the key range below that letter and no record is read.
  The answer is *checked* against the stored index before it is used — a row marked missing is
  in the store and not in the index, which would shift it — and anything that does not check
  out falls back to the walk over the current matches, which is also what a filtered list has
  to do, since the stored order knows nothing about the search box. A letter with nothing under it anywhere is dimmed
  **and takes no tap**, which is the one honest thing to do with it.
- **One folder is shown: the one picked last.** The screen holds a single listing, and
  `getAll` hands rows back in key order — the key being the folder's own name. So a `Download`
  picked once by mistake sorted ahead of `pianopath-library` and became the folder the app showed
  on every launch, with the archive invisible and the one *Forget this folder* button pointed at
  the folder worth keeping. `savedFolders()` is newest-first now, the screen prefers a folder that
  is still open and otherwise takes the newest, and any other listings are **named** under *How
  this works* with a Forget for each — one archive listing is about 6 MB, so a folder picked by
  mistake must not be able to sit in the database unreachable.
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

**§0:** a hand screen (R2), with the portrait exception above for its piece rows. **No filled box**
(R3): R3 lists "register a book" among the things done once per lesson or less, so *Add a book* is
text and *Add a piece* keeps its outline. The pieces are the subject and start within the first
screenful (R1).

**Ranked, 2026-09-12** (see `ShelfScreen.ts`). Photographed at 342 px this screen had every one of
the Plan screen's faults at once, and all five fixes are in that pass:

- **No `BOOKS YOU OWN` heading.** It sat in the muted section-label capitals directly under an `h1`
  reading **Shelf**, over a card saying much the same — the same thing announced twice, and the
  heading was the half taking the room. The screen's title is the heading; the one line of
  explanation and the folded long version stay.
- **A book's name is a name.** It was an `h2` inside a `.block`, which in this app is the
  section-label style, so "Czerny, Practical Method for Beginners on the Pianoforte Op. 599" was
  three lines of grey capitals and the loudest thing on a screen whose subject is the pieces under
  it. Ordinary case and colour, two lines, one weight heavier than its rows — and its kind, author
  and **how many pieces it holds** share the one quiet line the author used to have alone.
- **A piece's title gets the room**, two lines rather than `No. 12 — Stud…`. That heading was drawn
  in full while the rows you tap were cut, which is backwards.
- **The rung is named, not numbered.** The row read `page 14 · ≈ 1.1 · rung 1.1` — an internal key
  beside a bare level that was the same figure by coincidence, one meaning a difficulty and the
  other a lesson. The level is `levelLabel` like everywhere else, and the rung takes the row's
  sentence line (`for Landmark notes`) because `fitDetail` drops whole tokens and a rung's title is
  long enough to be dropped whole.
- **Nothing is filled.** *Add a book* was a filled box at the top, above every book — the rarest
  action on the screen wearing its loudest weight.

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
  score" opens a normal measured run; without one, §5d measures only what it can hear. The
  search for a twin is debounced, stops once it has six matches instead of filtering the whole
  catalog, and matches the composer as well as the title — the row it draws shows both.
- **A twin is checked, not assumed, wherever it is offered** (2026-09-11). Deleting the import or
  bundled item behind an `itemId` leaves the id on the piece; both the Shelf row and the
  practice screen (§5d) look it up before showing "With the score" / "Practise with the score",
  so a stale twin is dropped from the button rather than opening to "unknown item".
- Saving a piece redraws only that piece's row (a book's whole section when the save added or
  removed one), not the whole shelf, so the scroll position and every other book on the page
  survive an edit.
- **"I have this on paper"**, reached from a lesson page, files the piece into the owner's one
  book with no extra tap; with more than one book registered it asks which book first, since
  filing it into whichever one sorts first is a silent mistake the owner would only notice by
  opening the Shelf.

## 5. Score screen (the core)

**§0:** a stand screen (R2) — it stays large. The control bar reserves its own height rather than floating over the notation, so the space below the last stave belongs to the layout, and it hides itself only where the fit had used every pixel of the stage anyway (decision 5). It holds six controls and a `⋯`; the settings you change once live in the sheet behind it. **Blind mode hides the notation** — `visibility: hidden` on the stage is defeated by `visibility: visible` on the front buffer, so the buffer rule must not be unconditional. **And hides nothing else (2026-09-12):** the visible count-in, the beat dot and the corner readout are children of that stage, and `visibility` inherits, so they went with it. Every one of them exists *because* the notation might not be there — the dot is the one thing that must be visible while the clock runs, the corner says which bar when the chrome has folded, and the count-in was built because the sound is usually turned down on a music stand. A blind run in Tempo mode counted itself in invisibly, on a screen with nothing else on it at all. The notation is the buffers; hiding those is all blind mode ever meant to do.

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
(1–8) · **Size** (zoom ±, with the percentage between the buttons) · **Layout** (`Window` |
`Scroll`, a segment: it is a state, not a verb) · **Keys** (`Keys` | `Ribbon` | `Off`, a
segment) · **Sound** (Phone / Piano / Both) · **Blind** · **Perform**.

**Fill the width with music, not with space (owner, 2026-09-12).** *"We don't want
to stretch the music bar out to where it doesn't look natural. At the extreme, when
there's room for two bars it should show two bars not stretch one to fill."* This is
the rule the bars-in-window setting has to serve, and it settles what that setting
means: it is the number of bars you want **at least**, not a ceiling the fit may not
pass. Two halves follow.

*Do not stretch past natural.* `mayStretch` already refuses to stretch a system once
a bar would exceed `MAX_BAR_WIDTH_IN_STAVES` (8) staff-heights across, and
`CENTRE_WHEN_SPARE` centres what is left rather than pushing it to one edge. That
came from the same owner's earlier report — notes so spread out you had to look
across the screen to find the next one in a bar.

*What to do with the room that is left.* **Clarified by the owner, same day:** showing
another bar is one good answer, not a requirement — *"I didn't mean you HAVE to show
two bars. Centered instead of stretching is fine. I just meant BE SMART and ux
oriented!"* So the binding rule is the first half: never stretch past natural
spacing. What to do with the spare width after that is a judgement, and centring a
naturally-spaced system is a perfectly good one. Filling the width is not a goal in
itself, and a rule that forced a second bar would be the same mistake as a rule that
forced a stretch — a number winning over how it reads.

A note for whoever writes the test: **a check that drawn ink fills some share of the
stage width cannot tell these apart.** One stretched bar scores exactly as well as two
natural ones, so `score.fill.spec`'s floor needs a companion that pins bar count or
note spacing, or it will push the code the wrong way.

**Both steppers say where they are and where they stop (2026-09-12).** `Bars in window` always
read `2 bars` between its buttons; `Size` said nothing at all, so it could be pressed a dozen
times without ever admitting where it had got to — and "put it back how it was" had no target.
Both now grey the button out at the end of the range, because a lit button that absorbs a
press reads as a broken control on a phone, where a tap has no other feedback. A press that
cannot change anything now does nothing at all: it used to write the setting, re-seat the
renderer and, since a re-engraving invalidates a run's judgements, **restart the run** — so a
tap that changed nothing threw away the pass you were in the middle of.
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
  highlighted blue, the ones after in a paler blue; a hit flashes its key green and a miss red
  **for under a second** (`KEY_FLASH_MS`, 900 ms), then the key goes back to what the score
  wants. Decided 2026-09-09: verdicts used to stay for the whole run, so a beginner who missed
  early was looking at a keyboard that stayed red, which says nothing about what to press next.
  The notation keeps its colours; the strip is about the next key. Scrolls to keep expected keys visible.
  Three settings under Display (2026-09-09, the owner's ask): **Keys guide** [the note it waits
  for | that and the one after | off] — with two notes ahead, the paler blue is shown in every
  mode, Wait included; **Finger numbers on the keys** [on] — the score's finger number printed
  on each marked key, and after the note's name on the ribbon; **Flash a hit green and a miss
  red** [on]. Any of the three works alone: a guide with no verdicts, verdicts with no guide. This is the
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
- **Only the page being opened is detected before the viewer draws anything** (2026-09-11).
  Detection is a rendered page plus a pixel-by-pixel scan of it, seconds of work on a phone once a
  book runs into the hundreds of pages; finding every page first used to make a 400-page book
  make the reader wait to see the one page they asked for. The rest is detected afterward, in the
  background, nearest the opening page first, and the result is written back to the import once —
  before this, nothing but "Adjust cuts"' own Save button ever persisted an auto-detected cut, so
  a book the reader never corrected paid the full cost again on every open. Adjusting cuts on a
  page other than the one being read (flipping back to fix an earlier page while reading ahead)
  keeps the reading position on the same system rather than a raw index that drifts when an
  earlier page's system count changes. The rendered-page cache (three pages) never evicts a page
  a draw currently needs, even when more read-ahead is wanted at once than the cache's target
  size. A page number past the end of the file (a stale page on a shelf piece, or a typo) says so
  rather than silently opening at page 1.
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

- **Layout:** counter, the card, one line saying what to do, the hint, **the status line**, the
  controls, and the keyboard strip pinned to the bottom. The strip is always there: for a
  learner with no cable it *is* the instrument, and a drill you cannot answer is not a drill.
  The status line is with the card and above the buttons rather than at the foot of the body
  (R6, 2026-09-11): it carries the rhythm count-in, "playback is muted while the microphone is
  listening" and a microphone that would not open, and at the foot of the body sideways all
  three were below the fold. Sideways it is in the words column and scrolls inside its own
  three lines, because a hundred-character sentence there must not push the buttons out.
- **The card is engraved once.** A transposition prompt is four bars of music, so its host
  element is kept across the redraws of that card and re-appended — `draw()` runs at least
  twice per card, and rebuilding the host meant the bars blanking and re-parsing 450 ms after
  the answer, while the learner was reading them (handoff §5j).
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
- **Three faces are not prompt loops at all.** A `checklist` is ticked prose, a `placement`
  test is a self-judged pass/fail branch, and a `walkthrough` is a few sentences per step that
  hand the learner to another screen. None of them has expected pitches or a keyboard strip, so
  none goes through `drillFromCatalog`; each drives the same counter, prompt, hint, status line,
  controls and result sheet by hand, so the screen still looks like one screen. **A face with
  nothing to draw hides the card area rather than leaving it empty.** `.drill-stage` is
  `flex: 1` upright and spans the words column's five rows sideways, because every other kind
  puts the thing to look at in it — an empty one started the sentence a walkthrough step exists
  to be read three-quarters of the way down a 342x740 screen, under a void.

### 5c-1. The guided tour of the practice modes

`drill.tour.app-basics`, the exercise for `02` Stage 0.3, whose mastery is "tour completed".
Three steps — **Wait mode · Tempo mode · loops** — and each one says in two sentences what the
mode is for and then opens **the real Score screen** on Hot Cross Buns already in it:
`#/score/<song>?mode=wait`, `?mode=tempo`, `?mode=wait&loop=1-2`, each carrying
`&tour=drill.tour.app-basics`.

**Why not a tour that draws its own score.** A second, smaller imitation of §5 inside the drill
would have drifted from the real one the first time either changed, and it would teach a screen
the learner never uses again. The cost of opening the real one is three query parameters, which
is the mechanism `blind=1` and `performance=1` already use, and they reach §5 at the two points
where it already decides those things: the line that picks a default mode, and the line that
sets a loop.

- **`?mode=`** beats the learner's own default for this visit only; the select stays live, so a
  step about Wait mode cannot be read in Tempo mode by accident and can still be changed on
  purpose.
- **`?loop=1-2`** arrives with those bars already looping — printed bar numbers, the ones on the
  page and on the Loop control, converted at the edge because the loop machinery counts from
  one and a pickup bar is printed 0. A range the piece does not have is dropped rather than
  drawn. Refused outright in a performance, which is one pass by definition. A step that opened
  the screen and then asked the learner to discover the double-tap gesture would have taught
  nothing.
- **`?tour=<drill id>`** is where Back goes. All three exits from §5 use it — Back in the
  header, its twin at the bar's left end sideways, and Done on the summary sheet — because a
  tour the learner loses by finishing a run is not repeatable. Blind and Perform are routes, so
  they carry all three parameters through, or pressing either would drop the learner out of the
  tour silently. An id that is not a catalog id is dropped and Back goes to the tab, since the
  only thing the id is used for is a navigation target.

**A way out of every step, and repeatable.** *Next*/*Finish* moves on without opening anything;
*Start over* appears the moment there is a step to go back past; the header's **Back leaves the
tour for the tab**, and *not* through `history.back()` as every other drill's does — the tour is
the one drill whose steps leave this screen and are navigated back to, so the entry behind it is
the piece just left, and Back walked into it while §5's own Back came here again. The step to
resume on is written to `localStorage` **before** navigating, so the Android back gesture, §5's
Back and never coming back at all all land on the same step. Reaching the end records the run,
clears that position and offers *Again*, so opening it a second time is opening it from the
beginning.

## 6. Progress

**§0:** a hand screen (R2) — rows ≤ 96 px. The heat map is *Minutes a day, last 13 weeks* and carries a one-line key for its five levels (`0 · <10 · <25 · <45 · 45+ min`). **No filled box** (R3): nothing on this screen is done on most visits. The week's figure is the subject and is the first thing on the screen (R1).

**Ranked, 2026-09-12** (the pass the four tab screens had; see `ProgressScreen.ts`). Four of the Plan screen's six faults were here:

- **`THIS WEEK` over "48 of 150 minutes *this week*"** — a name repeated inside its own heading, and the heading was taking the room while the figure it headed was set at the same weight as the muted line under it. The heading is gone, the figure is the one loud thing on the screen, and "days practised" moves to the quiet line so the headline does not wrap at 342 px.
- **The heat map joins it in the same block.** Minutes a day and minutes this week are one subject and were announced as two, behind a heading and a rule each. The map's own caption stays — it is what tells a reader what the squares are.
- **The weekly goal moves below the map**, with a rule of its own: it is set about once, and it was standing between the figure and the map it belongs to. Its confirmation line stays inside the same block, beside the control (R6).
- **No badge on every row of a list defined by that badge.** `mastered` was on every row under *Repertoire*, `performance` on every row under *Performances*. Each cost its row the line the title needed; the titles now take two lines (one where the row carries a self-report badge, which is the only badge left).
- **A row in any of the three lists opens the piece it names.** Fifty cards — twenty performances and thirty sessions — were drawn with the border, surface and height of the tappable rows with no click handler at all. The repertoire row's `▶` goes with the change: one control instead of two doing the same thing, and a whole row is a bigger target than a 40 px glyph. A run whose item has been deleted since is *not* drawn as a control, and says so in words.
- **No internal identifiers.** The history's second line printed `session.mode` raw, so a week of drills read `drill:walkthrough`; it is words now (*Wait mode*, *Tempo mode*, *From the book*, *Drill*). All three lists used to fall back to `itemId` when the catalog had no entry.
- **Nothing filled, and the text actions are a thumb tall.** *Export everything* was the one filled box, for the rarest action on the screen, at the bottom of fifty rows; it keeps an outline because it is the one action here with a consequence, and *Import a backup* and *Diagnostics* are text. `.link-button`'s own floor is `§9`'s 24 px for a link, which is not enough for a control, so this screen's link buttons are held to R4's 40.

- Calendar heat-map of practice minutes; streak; weekly minutes vs goal.
- Per-stage completion; per-track completion.
- **Repertoire list (mastered)** with "last played", the row itself opening the piece, capped at 20 rows (same
  shape as Skills' concept grid) with a *Show N more* link — the history and the performances are
  already bounded by asking for a bounded number of recent rows, but mastery only grows, so this
  list needed its own way to see the rest rather than one that would eventually make it the
  longest, slowest list on the screen.
- Session history (table) with per-session detail (accuracy over time chart for an item).
- Export / Import all data (JSON). "Copy debug report".
- The weekly-goal number control writes its confirmation to its own line beside it, inside the
  "This week" block — not the screen's bottom status line (`04` §0 R6).

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
symbols [on]; keys under the score [keyboard | ribbon | off, default keyboard]; keys guide
[next | next-two | off, default next]; finger numbers on the keys [on]; flash a hit green and a
miss red [on]; keep screen awake [on]; left-handed layout [off].

**Sound** — piano volume; metronome volume; playback plays: both / only the non-focused hand
[non-focused when hand focus set]; **playback destination: phone / piano over MIDI OUT /
both** [phone; auto-suggest "piano" when a MIDI output exists and mic input is active].

**Input** — follow input priority [MIDI → Mic → Timed]; **Microphone:** device (built-in /
USB interface / headset), calibration (run / re-run, shows latency and noise floor), chord
leniency [70 %], strict mic scoring [off], mute playback of expected notes while mic is active
[on]; **MIDI** — input device (auto / list); transpose input semitones [0]; velocity curve
[linear]; treat Note-On velocity 0 as Note-Off [on]; sustain pedal CC [64]; ignore channels;
diagnostics: raw log, "connected devices". (No latency test: over USB MIDI both halves of the
round trip are already known — `clock.ts` reads `AudioContext.outputLatency` and folds it into
every conversion, and MIDI-in is a few milliseconds — so there is nothing left to measure and
the section is not built for a MIDI user at all.)

**Content** — active tracks; show US-only PD items [on]; language [en]; note naming
[letters]; **"Download everything now"** (re-runs the precache and reports total size and
item count — it counts as it goes, offers **Stop** beside itself while it runs, says so and
fetches nothing when there is no network, gives up after ten refusals in a row, and ends when
the screen is left); **offline only** [off] (stops the app checking for updates at all — `00` D20);
storage used, with a breakdown by scores / audio / lessons / your imports; **whether that
storage is safe** (2026-09-12) — one sentence under the usage figure saying what
`navigator.storage.persist()` answered, because everything the app holds is local with no copy
anywhere and IndexedDB starts in best-effort mode, where a device short of space may clear the
lot; the same line is where a *blocked database* is reported, since another copy of the app
holding the old version open means the app is running and saving nothing, and no one could
guess that from anywhere else; reset progress (double confirm).

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
| ~~How late is the piano?~~ | **Gone.** It asked the learner to tap along to eight clicks, which measures the input path *plus the human*: tapping spread is 20–50 ms and people anticipate a beat by another 20–80, so the noise was an order of magnitude larger than the signal. The tour is eight steps without it. What replaced it, for a microphone user only, is in `7b`. |
| Sound | Test sound, the two volumes, the metronome sound, playback plays / destination. |
| The screen | The **miniature the way the phone was chosen to sit** — header, stage, keys and control bar at their real proportions — redrawn as theme, keys, fingering, chord symbols, size, bars per window and layout change, with *Show it sideways / upright* to see the other; landscape lock and keep-awake. |
| How it follows you | The four modes in one line each, *Hear it* and the long-press; the default modes with and without an input, count-in, default tempo, strict Wait, tolerance, the pass criteria. |
| Your practice | Weekday and weekend session lengths, the track chips, strict prerequisites, two songs per lesson. |
| Ready | A summary of what was set, and where to find the tour again. |

**Back, Skip and Next are pinned** to the foot of the screen on every step, and the step scrolls
under them: sideways on a phone the fold is 360 px and most steps are longer. Sideways the
settings rows run in two columns, as Settings' own do (§0 R5); the prose, the miniatures and
the chips span both.

The miniature (`ui/devicePreview`) is built from the phone's own short and long sides and the
score screen's chrome at its real heights, scaled as one to the width the card can give it, and
the renderer is told which way up it is (`WindowRenderer`'s `orientation`), so the arrangement
follows the miniature rather than the window it sits in. The mic
calibration is the same routine the Diagnostics and Microphone screens run
(`audio/pitch/calibrationRun`), so a number measured here is the number
measured there.

### 7e. The guide (`#/settings/guide`)

Settings → *How PianoPath works*: what the app can do and how to get music into it, in the
app, with pictures of the app. Eleven sections in the order a person needs them — what it
does; connecting the piano (MIDI, the microphone, the setup tour); the score screen; lessons,
drills and skills; finding pieces to add; adding your own scores; a whole folder of scores (the
archive from the laptop, `library.json`, re-picking the folder, `est.` levels); PDF sheet
music; the books you own; progress and backups; offline, updates and diagnostics. The piano is
second because nothing else works until the app can hear you play. Every section that describes
a screen has a button that opens it. The pictures are of the app itself, taken by
`tests/e2e/guide-shots.spec.ts` (`GUIDE_SHOTS=1`) at a phone's size and shipped under
`public/guide/`, precached like everything else; `guide.spec.ts` fails if one the guide names
is missing. The owner guide in `docs/` stays the installer's and builder's manual; this is
the player's.

## 7b. Diagnostics

One screen, reachable from Settings and from the score screen's ⋯ menu, whose entire purpose
is to be *copied into a message* when something misbehaves. "Copy debug report" puts all of
it on the clipboard as text.

- **Offline and storage** (`00` D20): service-worker state, **precached n of m catalog files**,
  total bytes cached, last successful update check, whether the app is currently online. A
  missing-files list if n < m, because a silently skipped precache (the soundfont exceeding
  Workbox's 2 MB default) is the failure mode this screen exists to catch.

  Three rules on the service-worker line, each of them a fault that shipped.
  **"No worker registered" is its own sentence** — "not registered — this app will not work
  offline" — and never "registered but not controlling", which is what the line said for a
  failed registration as well as for a worker one reload away from taking over. **A waiting
  worker is named**: an update is deliberately held back until the page is reloaded (`00` D20),
  so once *Later* has been tapped, or "offline only" has suppressed the toast, this line is the
  only place that says a new version is sitting there. And **"last update check" means a check
  that reached the server** — it is written from the resolution of `registration.update()`, not
  from the app having been opened, because a line whose job is to say how stale the app might be
  must not report "a moment ago" on a phone that has been offline for a month.
- **MIDI**: connected devices, raw message log (last 200). *Connected* means
  `port.state === 'connected'`, not "in `access.inputs`": the Web MIDI API leaves an unplugged
  port in the map with `state: 'disconnected'` so a page can recognise the same device when it
  returns, and reading the map alone made an unplugged piano count as connected for a whole
  session. A port that is listed but gone is shown as such here rather than counted.
- **Latency**, and only when the input is the microphone: a short, sharp click through the
  speaker, heard back on the mic, the gap between the two being the whole round trip — measured
  by the machine in a couple of seconds, with no human in the loop, which is how a DAW does it.
  The output latency the browser already reports is subtracted, so what is saved is the input
  path. A run that does not hear enough of its clicks, or whose readings disagree with each
  other, is refused rather than reported. With a piano connected the section is **not drawn at
  all** — not hidden, not disabled — and says in one sentence why. A hand-set field is there for
  the cases loopback cannot work in: headphones, a denied microphone, echo cancellation that
  swallows the click.
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

Mic permission denied: explain Chrome site settings; fall back to Timed. **A dismissed prompt
is not a denial.** Chrome throws the same `NotAllowedError` for *Block* and for a prompt that
closed without an answer — a notification landing, a hand brushing the screen — and the two are
opposites: a block is remembered and needs a trip through site settings, a dismissal is
remembered by nothing and the next tap asks again. The screen asks
`navigator.permissions.query({ name: 'microphone' })` and only takes the *Connect microphone*
button away when the answer is `denied`; on `prompt`, or where the browser will not say, the
button stays and the sentence says to tap it again. Mic too noisy (noise
floor above threshold): suggest the USB audio interface path or headphones for playback.
**Leaving the Microphone screen closes the microphone**, like the Score and Drill screens: it is
the screen most likely to be opened to test something and walked away from, and a stream left
open is the phone's recording indicator on for the rest of the session.
No MIDI: the app never nags; "Connect piano" chip stays grey; Tempo/Listen/Free modes work
fully; Wait mode uses the on-screen keyboard. Permission denied: explain how to re-enable in
Chrome site settings (Chrome ⋮ → Settings → Site settings → MIDI devices).
**The cable pulled mid-run**: the app stops counting the port as connected, **releases every key
that was held on it** (the Note-Off is on the wire that has just been pulled, so nothing else
ever sends it), and says "MIDI input unplugged — plug the cable back in" rather than "no inputs
found", which is a different problem with a different cure. Plugged back in, the same port is
reopened — a port the browser closed while its device was away delivers nothing until
`onmidimessage` is assigned again. **A pinned input that is not plugged in** means "no filter"
(`05` §9), and the Inputs list says so: *Listen to all inputs* is selected and one line
explains why, rather than a radio group with nothing selected over an app listening to
everything. **Offline
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
