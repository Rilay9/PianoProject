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
and wrote down, in a list the size of the catalog. Measured at 342 px those stood at 101 px
each with about 45 of them a blank band under the words, which is four and a half
rows a screenful. So in the **Library** the exception applies only to the
**imported** rows — which is where the archive titles and the *Edit · Assign ·
Details* strip both are — and an ordinary row keeps its words on the same line
as its links. (Until 2026-09-16 that was written as "rows carrying more than one
action", which was the same question only while an ordinary row had exactly one
link; §4's *Open as…* gave every playable row a `⋯`, so the row says which it is
instead of the stylesheet counting its buttons.) The **score folder** stays
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

**§0:** a hand screen (R2) — rows ≤ 96 px. Its one filled box (R3) is **Start session**; the two lines of links under the card — *Shuffle options · Jump to…*, and the five doors below them — are text. The session card is the subject and starts within the first screenful (R1).

**The doors (added 2026-09-16).** The owner, after a week in which Simon, the accompaniment lab and the free-play screen were built: *"We'd want to have some way of accessing these new modes… how are people going to open it up? There's got to be a link somewhere."* They are on Today because it is the screen the app opens on and the only one reached without deciding anything first. **Two rows, not one:** the first holds the two actions that act on the card directly above it (*Shuffle options*, *Jump to…*) and the second the five that open something else — *Metronome · Free play · Sight-read · Simon · Accompaniment lab*. Seven `·`-separated links on one line is a wall, and the wall would have hidden exactly the new things it exists to advertise.

- **Each separator belongs to the link before it** (`.plan-pair`). Five doors do not fit one line at 342 px, and a loose separator is as likely to start the next line as to end the last: at 100 % the second line opened with a dot, which reads as a bullet for a list that has none.
- ***Sight-read* is the daily card's own open**, seed and all (`openDailyRead`), not a second reading exercise. A door that gave a fresh phrase would be a second daily read, and it would not tick the day. With no reading exercise in the build there is no card and no door (R4).
- ***Simon* is `simonForStage`**: `drill.ear.simon-c-major` below Stage 4 and `drill.ear.simon-chromatic` from Stage 4 on. That is not a rule this door invents — it is where the curriculum already puts the two items, and `simonDrill.test.ts` derives the stage from the built curriculum rather than restating it. The door is not drawn if the item is not in the build.
- ***Accompaniment lab* keeps its full name here too**, for the reason §3c and §4 give: "Chord lab" is shorter, and it would be a second name for one screen.
- None of them is filled. *Start session* is still the screen's one box (R3).

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

**Today's sight-read** (added 2026-09-15). One card under the session card, its own row and
not a sixth row of that one: it is there whatever session length was chosen, it is the same
three minutes every day, and it is the only thing on this screen counted in **days in a row**
rather than minutes this week. Putting it inside the card would also have made it swappable,
and a daily read you can swap for something else is not a daily read.

- It opens the reading exercise for the learner's stage — the hardest one at or below it, the
  easiest one if the stage is below all of them. Deliberately not a random pick: the day's
  variation is the seed's job, and an item that moved as well would change two things at once
  for no reason.
- **The seed is a hash of the local date**, so the day has one phrase and tomorrow has another,
  and re-opening today's card gives the same phrase back rather than a fresh one. It reaches
  the generator as `#/score/<id>?seed=<n>` — the same mechanism `blind`, `mode` and `loop`
  already use, and the alternative was a catalog item per day, which is 365 rows a year for one
  number. A hash of the date string rather than the date's number, because `seed + 1` through
  `makeRng` is a near neighbour of `seed` and a week of daily reads would have been seven takes
  of one phrase.
- **The run of days** is on the detail line — `Day 4 · L2.2 · 4 bars` — and a tick badge
  appears once today's is done. A day that is *not over yet* does not break the run: three days
  behind and nothing read this morning still reads `Day 3`, because the alternative is the
  daily-streak guilt the weekly header exists to avoid. A real gap resets it to nought.
- **Nothing new records it.** The Score screen records every run through `recordRun`, which
  notifies Today; the card reads "the daily item was last practised today" off the progress row
  that is already on its way, and writes the day down itself. The days live in the `settings`
  store under `pianopath.dailyRead` rather than in `StreakRow`, which would have cost a schema
  version bump for one array of date strings.
- With no reading exercises in the build there is no card at all, rather than an empty one
  (R4). The day is ticked by the progress store when a run carrying the day's seed is recorded (`recordRun` → `markDailyRead`), so the same exercise opened from Plan or the Library — a different phrase — does not count, and a day already ticked stays ticked when the stage moves on (2026-09-16).

## 2a. Metronome (standalone)

A metronome you can switch on without a score in front of you — for scales, for
counting a piece you are reading from paper, for anything the app does not know about.
Reached from Today's row of doors (§2) and, later, from the Score screen's control bar (§5),
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

## 2b. Free play — `#/play` (added 2026-09-16)

The owner: *"you could have a button somewhere that says free play that just tracks your
notes."* That is the whole screen. The keys you are holding light up, they are named, and
three or more of them are named as a chord. Nothing is judged, nothing is recorded, and
there is no run to start or stop.

**Not the same thing as the Score screen's `Free play` mode**, which turns the pages of a
piece on your own notes. This has no piece. The two share a name because they are the same
promise — the app is not marking you — and the name is the owner's word for it.

- **Reached from Today's tools row** (§2), and pushed over Today the way the lab is pushed
  over Library: not a tab, and Back returns to Today.
- **The readout is a panel**: the chord large, the note names under it. The chord line is
  empty until three keys are down and its height is *reserved*, because a readout that
  grows on the third note of a chord moves the keyboard under the hand playing it. The
  panel carries the same surface and border as the keys below, so an empty line inside it
  reads as a display waiting rather than as something that failed to draw.
- **The chord naming is `nameHeldChord`** (`engine/drills/theory.ts`), over
  `CHORD_QUALITIES`' own intervals — one table of what a chord is, with the words and a
  preference order added. The lowest key is asked first, because several chords are
  genuinely the same set of notes and only the bass decides: {C E G A} is C6 over a C and
  A minor 7th over an A. An inversion is named after its root and says what is underneath
  — `C major / E`. Fewer than three different pitch classes is not a chord and gets no
  name rather than a guess.
- **The keys are the strip the Score screen and the drills use**, full 88, scrolled to
  middle C one frame after mount — before that every key is at offset 0 and "middle C"
  resolves to the bottom of the keyboard. They are **taller here than anywhere else**
  (148 px, 96 sideways): under a score the strip is squeezed into what the notation can
  spare, and on this screen it is the subject.
- **Every input at once**: MIDI, the microphone if something already has it open, and taps
  on the strip. A tap *sounds* through the piano samples; a note arriving over MIDI does
  not, because it has already been played on a real instrument.
- **R4, with nothing connected**: the line under the readout says *"No piano and no
  microphone — tap the keys below, or connect one:"* and offers **MIDI settings** and
  **Microphone**. The strip stays, and stays playable — for a learner with no cable it is
  the instrument, which is why the drill screen draws one too. With something connected
  the same line names what is being listened to.

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
- **The placement starts the plan** (built 2026-09-21). Both the placement drill's *Start
  here* and a lesson page's *Start here* write `placement.unitId` into the plan row, and
  both said *"Placement recorded. Today will build from here."* Nothing read the field —
  every reader of the plan row used `trackOrder` through `activeTracksFor` — so the plan
  carried on recommending `0.1`. Now `nextRecommended` takes a `startAt` and Plan, Today and
  Skills all pass it, so the three screens cannot disagree about where the learner is.

  Rungs **behind** the placement are held back, not discarded: the learner said where to
  start, not what they have done. If everything from the placement onwards is complete the
  first incomplete rung behind it is recommended after all — an empty plan would be a worse
  answer than an early rung, which is the same reasoning the strict-prerequisite fallback
  already uses. `startAt` matches a unit id **or** a rung id, because the drill names a unit
  (`failUnit`) and the lesson page names the rung the reader is on, and both are right about
  their own screen. A `startAt` the curriculum does not have is ignored rather than holding
  every rung back.

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

**Two doors, added 2026-09-21.** Until then there were none: `#/chart/<itemId>` parsed and
`router.navigateChart` compiled, and nothing in the app called either — the screen was
reachable only by typing its URL, while `jam`'s lesson described it. So:

- a **Chart** action on a lesson page's option row, beside ▶ and *Know it*; and
- a **Chord chart** row in the Score screen's `⋯` sheet, beside *Section* and *Rhythm only*.

Both are drawn only where the piece is known to carry chord symbols
(`openItem.ts`'s `hasChordSymbols`, reading the build's measured `notation.chordCount`) — a
chart of a piece with none is four empty bars under a count-off, which is the dead control
§0 R4 forbids, and the screen itself already refuses that case. A row the build never
measured is not offered one either: unknown is not yes. An **import** is, because the chart
screen reads the chords out of the imported bytes itself and the build never saw them.

The door is on the *piece*, not in the rung's `tools`: `jam` and `jazz.5` are rungs of
chord-symbol songs, and a tool entry would have to name one of them and be silent about the
rest.

### 3d. Ways to play this — a rung's tools, as controls (added 2026-09-18)

Sixty lessons gained a **Tools for this rung** paragraph in `b4fb15b` and a paragraph
cannot be tapped. `chords-pop.3` tells the learner to *"Pick D, take I–IV–V–I"* in the
accompaniment lab — which is now a single preset chip the lesson had no way to open — and
duet, blind, Simon and free play were in the same position: built, described, unreachable
from the rung whose material they suit.

A lesson may now carry a **`tools`** array, drawn as a block of controls headed *Ways to
play this*.

- **Above the options, not below.** A mode is a way of playing what is on this rung, so it
  is read *before* choosing which option to play. It sits under the status line and the
  rung's own actions, and above *Exercise options*.
- **It costs the options some height, and R1 still holds.** On a 360×780 phone one tool
  moves *Exercise options* from about 250 to about 330 px. R1 asks that the options *start
  within the first screenful*, and the first option row still does; the e2e checks exactly
  that (`plan.spec.ts`), not a pixel line. Chosen by the owner on 2026-09-19 over moving the
  tools below the options or into the actions row.
- **Hidden entirely when the rung names none**, which is most of them. An empty heading
  would be dead space above the thing the page is for (`00-invariants` §1, §0 R4).
- **The prose stays.** A button opens a mode; it cannot say *why* that mode suits this
  rung, and that sentence is the teaching.
- **A rung may name `lab` twice**, added 2026-09-21: once with a preset and once without.
  A preset fixes what makes it that style, which is the design (`pending-review` Entry 5) and
  is also why eight rungs' lessons told the learner to change a control their own lab button
  had disabled. The second button carries no preset, so nothing is locked, and a `label`
  tells the two apart. The first button of a kind keeps the id every test and stylesheet
  already names; the second gets a suffix.
- **Only modes with an address.** `lab` (with or without a preset), `duet`, `blind`, `simon`,
  `play` and, since 2026-09-22, `ladder`. **Rhythm-only is still deliberately absent**: it is
  a remembered setting the Library writes before navigating, so it cannot be reached by a
  route and a button for it would be a control that opens the wrong thing. It keeps its
  paragraph.
- **A Score-screen mode needs a piece.** A rung may name one with `item`; otherwise the
  button takes the rung's **first playable song**, because "play this rung's material as a
  duet" is the instruction and any of its songs satisfies it. Where the rung has no playable
  song the button is not drawn at all.
- **`validate.py` refuses two ways of pointing at nothing**: a lab preset the lab does not
  have, and an `item` that is not among this rung's own song options — a lesson sending the
  learner to a piece it does not offer is the `blues.3` fault wearing a control.

#### `ladder`, and why it was absent until it was not (2026-09-22)

The tempo ladder is run state scoped to a loop (`05` §6), so it had no address and this list
excluded it — which left **seven rungs naming no mode at all**: `4.1`–`4.4` and `technique.4`,
`.6`, `.7`, the scales, arpeggios, Hanon and octaves. What they want is evenness under speed,
and the ladder is the app's answer to exactly that. (Duet was on them and was removed, because
duet plays the hand you are *not* playing and masks the thing a scale rung is measuring;
`pending-review` Entry 16 has that reasoning.)

The blocker looked circular — the ladder needs a loop, and clearing the loop switches it off,
so opening with it on seemed to need a loop out of nowhere. **The circle only exists for
repertoire.** On these rungs the whole item *is* the loop: they are two to thirty bars and
they repeat by nature, so looping one is not a choice about which bars matter, it is what the
exercise already is. So **`?ladder=1` sets the loop to the whole item and turns the ladder on,
in that order, as one action**, and both controls then show their state — the Loop control
names the bars, the Ladder row shows the toggle pressed. That is what `05` §6's invariant is
protecting; the fault it records is a ladder on with *nothing on screen having asked*.

Four things keep it that way rather than clever:

- **The tool is for exercises.** A whole-piece loop is sensible for a scale and absurd for a
  prelude, so the seven rungs above are the whole permitted set and are scales-and-Hanon by
  construction. A future rung wanting the ladder over repertoire must name bars, and that is
  a different feature.
- **It fails closed.** No resolvable whole-item loop, a mode the hash named that has no tempo
  to move, or a performance: the screen does **nothing** rather than turning the ladder on and
  hoping. Where the hash names no mode it brings Tempo with it, since the ladder moves a clock
  and the other modes have none.
- **Clearing the loop still switches the ladder off.** The route gets no exception; the
  exception is the fault `05` §6 describes.
- **It takes no `item`.** It opens the rung's **first exercise that is notation** — `4.3` leads
  with `drill.chord.inversions`, which has no file and opens as a drill, so the button skips it
  — and where a rung offers no such exercise the button is not drawn. `validate.py` checks an
  `item` against a rung's *song* options, so one written on a `ladder` tool is refused rather
  than honoured.

The e2e asserts the *destination*, not the button: the lab tool must arrive with
`data-preset` set and the locked pickers disabled, and the duet tool must open a piece the
rung actually lists. Proved red by making the duet open a fixed off-rung piece. The ladder
button carries `data-item`, the exercise it claims it will open, for the same comparison, and
its destination is asserted in `score.ladder-route.spec.ts`.

### 3c. Accompaniment lab — `#/lab` (added 2026-09-15)

§3b plays the chords a *piece* already has. This is the other half: pick the chords yourself,
and either have them written out to read or have them kept in time to play over. Two things a
learner wants from a progression, and the app could do neither — while the generator already
knew every accompaniment shape (`05` §8, levels 4–7) and the chart already knew how to hold a
bar count against a drum loop.

**Reached from Library**, in the line of doors beside *Import a score · Shelf · Score folder*, and
from Today's own row of doors since 2026-09-16 (§2), under the same name in both places —
it belongs to the same question those three answer, *where does something to play come from*,
and it is the one that makes a score rather than finding one. It does not fit on that line at
342 px and takes a second one; the full name is kept anyway, because the screen it opens is
called the accompaniment lab and a shorter label here would be a second name for one thing.

**The settings.** Key (the twelve majors and nine minors), progression (I–IV–V–I, I–V–vi–IV,
ii–V–I, I–vi–IV–V, the 12-bar blues, or roman numerals typed), left-hand pattern (the five the
generator writes, plus none), right hand (chord tones, melody, none), bars and tempo.

- **A minor key gets its own numerals, not the major set transposed.** I–V–vi–IV has no
  minor-key form: the chords that make it are the major scale's. What a minor key does with
  the same sound is i–♭VII–♭VI–♭VII, and writing that down is more honest than naming three
  chords nobody plays there. The flat and sharp prefixes are the lab's own addition to the
  numeral reader the roman-numeral drill already uses — `♭VI` in A minor is F, and there is no
  unaltered numeral that says F from A.
- **The blues brings its own bar counts.** Twelve does not divide into eight, so choosing it
  replaces the 4 · 8 · 16 chips with 12 · 24 rather than leaving chips that are pressable and
  impossible (R4). A form shorter than the bar count repeats rather than stretching: eight bars
  of a four-bar progression is that progression twice.
- **A numeral it cannot read is named**, on the status line beside the button that found it
  (R6), and nothing is built.

**Read it** writes the exercise out and opens it on the Score screen. It goes in as an
**import**: the Score screen builds a sight-read from the catalog row's own drill parameters
and knows nothing about a harmony somebody typed, and an import is the door that already
exists for notation the app did not ship. The exercise's **title is its settings** — `Lab:
I–V–vi–IV in G major · alberti + melody · 8 bars at 92` — so the same choices give the same
title, the same id and the same row, replaced where it stands; a different combination is a
different exercise and gets its own. The rows are tagged `Accompaniment lab`, filed at level 3
marked estimated. The Library keeps only the newest few lab builds (`LAB_IMPORTS_KEPT` in
`LabScreen.ts`; the oldest go when the next is written), because every new combination is
a row of its own and an evening of trying progressions was filling the Library with scratch
exercises nobody would open again. **The cleaner hook, when somebody is next in that file:** two lines in
`ScoreScreen.ts` reading a lab build out of a module the lab writes — `#/score/lab` resolving
against a single in-memory exercise — which would cost no library row at all and no delete on
the way in. The import was chosen because `ScoreScreen.ts` could not be edited in the change
that built this, not because it is the better door.

**Jam it** — the chord DJ — starts the chart's own bass-and-drums bed for the same progression
and tempo, shows the chord symbols bar by bar with the current one marked, and lights the
bar's chord tones on the keyboard strip as a guide. **Nothing is judged and nothing is
recorded**: playing along is the whole point and the app is only keeping time and saying where
you are. Changing a setting under a running loop *stops* it and says so, rather than leaving a
chart on the screen whose bars are not the bars it is playing. Stop leaves the chart standing —
it is a chord chart, and reading one is what somebody stopped the loop to do.

**Trading fours (added 2026-09-21).** A row of chips under the two buttons — *Off · 2 bars
each · 4 bars each* — that changes what *Jam it* does: the app plays a phrase over the bed for
its bars, then leaves the learner theirs, round and round. Four rungs' plans ask for it
(`blues.5`, `blues.7`, `jazz.4`, `improv.4`) and it is the teaching device for blues and for
jazz. The five decisions behind it, because each could have gone another way:

- **It is a setting on *Jam it*, not a drill and not a screen.** It is the same loop, the same
  bed, the same chart and the same keys; only the turn-taking is new, and a second transport
  button would have been a second name for one thing (`00` §1). The alternative — a new
  `DrillKind` — needs a row in the **closed** enum in `content/catalog.schema.json`, a row in
  `STAFF_POLICY`, and a catalog item to hang it on, and the same reasoning as `handoff` §5ar:
  reuse the thing that exists rather than widen a closed set for one mode. A new `tools` kind
  was not available either — `curriculum.schema.json` closes that enum and sets
  `additionalProperties: false` — so a rung reaches this through the **`lab` tool it already
  has**, which is why `blues.7` gained one. There is deliberately **no route parameter**: a
  `#/lab?trade=` nothing can link to would be a door only a typed URL opens, which is the fault
  §3b's chart had until 2026-09-21.
- **The app leads, always**, which makes this T8's case 2 and means there is **no first-note
  latch anywhere in this mode**. Every entry after the first comes off four bars the app has
  just played in audible time, and coming in on time there *is* the skill; latching the clock
  to the learner's first note would quietly remove it.
- **The call is generated from the loop's own chords**, not lifted out of a piece: the lab has
  a key, a progression and a tempo and no piece at all. A chord tone on each downbeat, a scale
  note within a fourth everywhere else, and the **last beat of the call is a rest** — a call
  with no breath at the end gives the learner nowhere to come in from. A call taken out of the
  tune on the rung is a different exercise and belongs on §3b's chart screen, where the piece
  is; it is not built.
- **Two things are measured and nothing is marked.** Whether the learner came in inside their
  own bars (a pick-up of up to half a beat still counts), and how many of their notes were in
  the scale the rung teaches — the twelve-bar form counts against the blues scale, every other
  progression against the key's own. Both are said on a quiet line at the hand-over back, and
  **nothing is written to the practice history and nothing here can be passed or failed**, so
  §3c's promise above still holds: this screen does not record and does not grade. Matching the
  call note for note is deliberately *not* judged — the answer to a phrase is your own phrase,
  and a mode that scored imitation would teach the opposite of the thing.
- **The strip answers as well as lights.** A trade the learner cannot play is not a trade, and
  on a machine with no MIDI attached the on-screen keys are the only instrument there is. Notes
  go through the shared input source, the shape `#/play` already uses.

**Both ways round (added 2026-09-22).** The owner: the lab *"doesn't have enough
documentation"*, and he wants it to *"play chords while the user plays the melody, so it'd go
both ways"*. Until now *Jam it* played bass and drums and nothing else — so "play the tune
over it" asked the learner to supply the harmony they were meant to be playing over, and the
other direction did not exist at all. A row of chips, **What the app plays**, sits beside the
trading-fours row: *Bed only · Hold the chords · Play the tune*.

- **Hold the chords** adds a chord voice to the bed, in the pattern the **left-hand picker**
  names — the same six words, so the loop comps in the shape the screen says it will.
  `barSchedule` had no chord voice before this and one was added to it; the chord chart passes
  nothing and its bed is unchanged, note for note. `walking` is the one pattern that is not
  its left-hand namesake: the walk is already the bass's, so the comp takes the chord on the
  backbeat rather than laying a second walking line on top of the first.
- **Play the tune** is the reverse — the app takes the right hand and the learner comps
  underneath. It plays **the right hand these settings write**, from the same generator and
  the same seed as *Read it*, so the tune under the learner's hands is the tune the page would
  have shown. That means *Chord tones* is what it plays when the right hand is set to chord
  tones; it is the picker's answer and not a second one.
- **Exclusive with trading fours**, in both directions: trading fours *is* the bed taking its
  own bars, so "and hold the chords as well" would be two settings claiming the same four
  bars. Pressing either turns the other off.
- **Fail closed** (§0 R4). *Play the tune* with the right hand set to *None* has nothing to
  play, and *Hold the chords* with the left hand set to *None* has no pattern to comp in.
  Both are `disabled`, visibly greyed, with the reason **on the screen** under the row rather
  than in a `title` — a phone has no tooltip. A preset that opens on one and a picker later
  set to *None* falls back to *Bed only* rather than keeping a pressed chip that cannot run.
- **Two counts and no mark**, the same contract trading fours has. At the end of every time
  round a quiet line says what it was worth: under *Hold the chords* how many of the notes
  were in the scale the progression teaches, under *Play the tune* how many were a chord tone
  of the bar they were played over. Which one is *said* differs because only one of them is
  honest per mode — a learner playing a line is not aiming at the bar's chord, and a learner
  comping is. **Nothing is written to the practice history and nothing here can be passed or
  failed.** The bar a note counts against is the bar the loop was on when the key went down,
  which is coarse by a fraction of a beat and is the reason this is a count and not a score.
- **Reached from a rung through the preset its `lab` tool already names.**
  `curriculum.schema.json` closes a `tools` item to `kind`, `preset`, `item` and `label` with
  `additionalProperties: false`, so a `bed` field on the tool entry is not available today;
  the preset carries the default instead. That means every rung on one preset gets the same
  answer, and where a rung's lesson wants the other way round it says so in prose and waits
  for a field of its own.

**What every control says it does (added 2026-09-22).** A grep of `LabScreen.ts` for
`help|explain|tip|hint` on 2026-09-21 returned the file comment and nothing else: six
pickers, two buttons and two chip rows stood on the screen with only their labels. Each now
carries one line under it, in the learner's terms. **The lines live in one table in the
code** — `LAB_HELP` in `engine/sightReading.ts` — and the table below is that table;
`labHelp.test.ts` fails when the two stop agreeing, so the screen and this section cannot
drift the way a sentence copied into a spec does.

| control | the line under it |
|---|---|
| The two buttons | Read it writes these settings out as a score you can read. Jam it plays them as a loop you can play over. |
| Start from | A style to start from, instead of six empty pickers. Free leaves every setting to you. |
| What the app plays | Bed only is bass and drums. Hold the chords adds the harmony underneath, so the tune is yours. Play the tune gives the app the right hand, so the chords are yours. |
| Trading fours | The app plays a few bars, then leaves you the same number, round and round. |
| Key | Which key it is all written and played in. |
| Progression | Which chords, written as numerals so the same choice works in any key. |
| Your numerals | One per bar — I, vi, V7, ♭VII, iiø7. |
| Left hand | The shape the left hand plays the chords in, and the shape Hold the chords comps in. |
| Right hand | What goes above the chords, and what Play the tune plays for you. |
| Bars | How long one time round is. A shorter progression repeats rather than stretching. |
| Tempo | Beats per minute. |

A **preset's** own line is its `blurb`, and it is drawn under the preset's name once that
preset is on. The six are not all printed under the chip row at once on purpose: six lines
above the two buttons would push the subject of the screen out of the first screenful, which
is the rule (R1) the preset panel was placed to satisfy in the first place.

**Presets — a way in, before the pickers (added 2026-09-18).** The owner: *"as opposed to
just messing around in the lab, you're like, all right, we're doing jazz here — this is
some jazz backing, without all the options to start from scratch."* Six pickers and no
starting point asks a beginner to know the answer before they arrive, which is the fault
*Show me* and *Hear it* fixed on §5c: a lab you can only configure cannot start you.

- **A row of chips, `Start from`, above everything else** — *Free · Primary chords · Pop ·
  Ballad · Blues · Jazz · Rock*, one label each because the row has to fit 342 px. The full
  name and a line saying what it is for appear once one is on, above the settings summary
  (R1: a learner who arrived from a rung came for "jazz"; the settings line is the detail).
- **Six presets**, all on progressions the lab already had: *Primary chords* (I–IV–V–I,
  block chords, opening in D), *Pop* (I–V–vi–IV), *Ballad* (I–vi–IV–V, broken), *Blues*
  (twelve bars, walking), *Jazz* (ii–V–I, walking), *Rock* (i–♭VII–♭VI–♭VII, held roots,
  which is what this screen already makes of I–V–vi–IV in a minor key).
  **Primary chords was added on 2026-09-18 for a reason worth recording**: `chords-pop.3`
  teaches I–IV–V–I and its tool had been pointed at *Pop*, which plays I–V–vi–IV. A button
  that opens the wrong progression is worse than a paragraph telling the learner to set the
  pickers themselves, so the preset was added rather than the lesson reworded. Its key is
  deliberately **unlocked** — that rung's exercise is to play the progression in D and then
  in A, and a preset that locked the key would prevent the lesson it exists for.
- **A preset is a route, `#/lab?preset=<id>`**, the idiom the Score screen already uses for
  `mode`, `loop`, `hands` and `tour`. A chip navigates rather than mutating in place, so
  the preset is in the address, the back gesture leaves it, and a lesson that links to one
  arrives at exactly the screen the chip produces. An id the lab does not know is **dropped
  rather than drawn as an empty banner**, exactly as a `loop` for bars a piece does not have.
- **`locks` is the design, not the settings.** A preset that fixed everything would be an
  exercise wearing the lab's chrome; one that fixed nothing would be a bookmark. Each locks
  only what makes it that style — the progression and the left-hand pattern are what make a
  blues a blues — and leaves key, tempo and bar count alone, because transposing it and
  slowing it down is practising. The blues preset also locks the bar count, because twelve
  does not divide into eight and a "twelve-bar blues" of eight bars is not one.
- **A locked control is `disabled`, visible and greyed — not hidden, and not dimmed only.**
  Hidden, the learner cannot see what the preset chose, which is half of what a preset is
  for. Dimmed only, it is a control that looks pressable and is not, which `00` §1 calls a
  bug rather than a cosmetic. The e2e test presses a locked chip and asserts the setting did
  not move, so a lock that were only an opacity would fail it.
- **The rock preset is `I–V–vi–IV` in a minor key**, which this screen already turns into
  `i–♭VII–♭VI–♭VII` — the same progression the generator writes as `exercise.modal-vamp.*`.
  One sound, stated once.

**§0:** a hand screen (R2). Its one filled box (R3) is **Read it**; *Jam it* and *Stop* are
outlined. One line saying what the two buttons *do*, the line saying what the settings
currently *are*, and the two buttons themselves sit **above** the pickers, in that order — the
first answers "and then what happens", the second answers "to what", and until 2026-09-22 only
the second was on the screen. The two chip rows that change what *Jam it* does (*What the app
plays*, *Trading fours*) sit under the buttons and above the pickers — the same ranking Today's *Start session* got, and the pickers still
begin inside the first screenful (R1). The three short choices are chips with their label
*above* them rather than beside: `field()` gives a control a column of `max-content` next to a
label keeping 9 rem, which is right for a select and leaves six chips about half a phone to
wrap into, three lines tall and well past R2's 56 px. Sideways the pickers run in two columns
and the keys shrink to about two thirds their height, because 108 px of key plus a chart plus a
transport is more than a 342 px-tall body has (R5).

## 4. Library

**§0:** the list is the subject and starts within the first screenful (R1). The six filters live behind a **Filter ▾** chip; the count line names any filter that is set, so a hidden filter cannot silently empty the list. *Import a score · Shelf · Score folder · Accompaniment lab* sit as one line of text in the header, above the search box — text rather than boxes (R3), but at the top: at the foot of the list they were 4,325 px down with the default sixty rows drawn. The header does not scroll, so the list runs under them. The fourth (§3c, added 2026-09-15) does not fit on that line upright and takes a second one; it is kept at its full name anyway, because a shorter label would be a second name for the screen it opens.

**Ranked, 2026-09-12.** Two faults, both "the same thing on every row". The detail line said `Hands together` on very nearly every row of the catalog — three words in the middle of the line that is supposed to tell rows apart, which never tell any two apart, and which pushed the type off the end; it is `RH`/`LH` where the fact is news and silent otherwise, with the full sentence still on the item's detail sheet. And **the drop target is the list itself**: when the import heading and its buttons moved into the header they left an empty `div.block` under the list — no text, no control, but a rule across the screen and seventeen pixels of nothing (R4: no furniture), for a gesture that does not exist on a phone. The listeners moved onto the list, which is also the better desktop target: you drop the file on the thing you are dropping it into.

### Open as… (added 2026-09-16)

The owner: *"from the library you should be able to choose what mode you're going to open a
song in."* Every row that opens on the Score screen carries a **`⋯`** after *Details*, and
it opens a sheet of seven: **Wait for me · Keep tempo · Play it to me · Free play · Rhythm
only · Duet · Blind**, each with the sentence §5 uses for it. One tap opens the piece —
choosing a mode and then pressing Open would be two taps for one decision. A plain tap on
the row opens it exactly as it always did.

- **A glyph, and a boxed one.** `⋯` is the app's own sign for "the other things you can do
  with this" — it opens a subset of the very list §5's own `⋯` holds — and the words would
  have taken the room the title needs (R2). It is the last action, where §5 puts it. It
  carries a border, which no other action on this screen does: `Details ⋯` set as two bare
  text links reads as one link ending in an ellipsis.
- **Only where the modes mean something** (R4): a PDF is pages and not notes, a drill is a
  prompt loop. The test is `targetFor(item) === 'score'`, so a sight-reading drill — which
  *is* notation — gets one.
- **Route fields where the route carries them, the setting where it is a setting.** The
  mode, the hand and blind ride in the hash (`?mode=`, `?hands=`, `?blind=1`), which is the
  mechanism the guided tour already uses. `rhythmOnly` and `playbackHands` are written to
  `settingsStore` *before* the navigation, because that is where §5 keeps them and a second
  copy would be a second answer.
- **`?hands=` is new** (2026-09-16). The hand focus is run state on §5 and starts at `both`;
  a duet is the hand you are *not* playing, so with `both` there is no hand for the app to
  take and the row would have opened a screen where nothing happens. Duet therefore opens
  in Keep tempo — the app only plays under a clock — with `R` chosen and the app on the
  left. The parameter rides through Blind and Perform with the tour's, or either would drop
  the learner's duet silently.
- **Every choice writes `rhythmOnly`, not just *Rhythm only*.** It is a remembered
  preference, so once chosen, every later *Keep tempo* from this sheet would have been a
  rhythm run — the learner asking for one thing and being judged on another, with nothing
  saying so.
- **The portrait tall-row exception is now said by the row, not counted off its buttons.**
  The rule above ("rows with more than one action") was the same question as "is this an
  import" only while an ordinary row had exactly one link. With `⋯` on every playable row
  it would have grown all 1,533 by about 35 px for a glyph 24 px wide. `LibraryScreen`
  marks the rows the exception is *for* (`data-tall`), which is the imports — where the
  archive titles and the *Edit · Assign · Details* strip both are.

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
- **A PDF in the folder is listed beside the scores** (2026-09-15,
  `docs/decisions/2026-09-15-score-folder-index.md`; `folderKind` in `folderLibrary.ts`). The
  owner's folder holds both, and the index has no reason to care about the extension. The row
  carries a *PDF* badge — pages, not notes, worth knowing before tapping Add — and Add hands it
  to the import store as a PDF import, so it opens in §5b; once added, the row gains an **Open**
  beside Add, because a score opens from the Library once it is on a rung and a PDF opens from
  here.
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

**A mode can also be chosen before this screen opens** (§4's *Open as…*, 2026-09-16). The
mode, the hand and blind arrive on the route — `?mode=`, `?hands=`, `?blind=1`, the
mechanism the guided tour already uses — and `rhythmOnly` and `playbackHands` are written
to the settings first, because on this screen they *are* settings. Nothing here behaves
differently afterwards: the select is live, every `⋯` row is live, and a piece opened as a
duet can be turned into anything else without leaving the stand. `?hands=` is applied where
the screen picks its focus, which is before the renderer is built — a hand applied later
would re-engrave the sheet for nothing.

`⏮ Start again` is **in the `⋯` sheet**, not on the bar. Eight controls come to 444 px of a
390 px row and wrap it onto a second line, taking 40 px off the music; `▶` from stopped
already starts from the beginning, so the glyph was the mid-run case only. The test for the
bar is *do you need it while your hands are on the keys?*

**The keys start a run too** (T8, 2026-09-18) — the same test applied to `▶` itself. With no
run going and the summary closed, a note-on from the piano or the screen keys starts one: with
no count-in to play first (Wait, Free, or Keep tempo counted in from nothing) and the learner
playing first, that key is the run's first note and is played into it — when the app leads,
it only starts the run; with a count-in it starts the count and is not a note
of the piece. `Space` does the same for any input, except while a control or a disclosure
(`summary`) has focus — Space already presses those. **Not after a run has finished by itself** —
a one-bar preview included — until `▶` or `Space` starts the next — people carry on playing after the last bar, and Free,
Listen and `Hear it` end with no summary to stand in the way. **Not under an open sheet** (`⋯`,
tempo). **Not** from the microphone, which hears the room; `▶` stays for all of these. With a
MIDI piano connected, `#score-waiting` says so on the ready screen, in the words the count-in
setting calls for (*Play the first note to start* / *Press any key to count in*); it says
nothing for the other inputs, deliberately — that line's weight was a question put to the
owner. A Keep tempo run the learner leads **holds on its first note** after the count-in
(`05` §3b), and the same line says so; the count-in's wash is cleared as it starts to hold, so
it never sits over the notes the first one is read from. *Pedal-to-start is not built*: it
wants a setting, off by default, because a pedal put down in preparation would start the run.

With `R` or `L` chosen and `playbackHands: non-focused`, the status line says `Playing the
left hand for you` **once** when the run starts. The sound is otherwise a note arriving from
nowhere, which on a stand with no piano connected reads as a fault. Saying it once was the
half of the fix that fitted on the bar; the other half is the **Duet** row in the `⋯` sheet
below, which is where the thing can be turned off.

`⋯` opens a sheet holding everything else, each with its word beside it: **Input**
(MIDI / Mic / Screen keys / None) · **Rhythm only** (only in `Keep tempo`) · **Section**
(only when the piece has named sections) · **Loop** (set A/B by tapping bars, or pick a
section) · **Ladder** (only when a loop is set, in `Keep tempo`) · **Metronome** ·
**Bars in window** (1–8) · **Size** (zoom ±, with the percentage between the buttons) ·
**Layout** (`Window` | `Scroll`, a segment: it is a state, not a verb) · **Keys**
(`Keys` | `Ribbon` | `Off`, a segment) · **Sound** (Phone / Piano / Both) · **Duet** (only
with `R` or `L` chosen, on a piece that has the other hand) · **Blind** · **Perform**.

Three of those come and go. That is `04` §0 R4 and not tidiness — a Ladder with no loop, a
Rhythm only in a mode with no clock and a Duet on a piece written for one hand are all live
controls over nothing. Sideways the sheet is a two-column grid, so a row that does not apply
has to be *gone* rather than empty. **Nothing here is on the bar**: the bar holds the six
things that change while your hands are on the keys and it may not grow (R4/R5, and the
bar's own comments in `style.css`); the sheet is full-screen, explains every control it
holds and already scrolls.

**Rhythm only** (P21f, `05` §3a). Tap the piece's rhythm on any key at all — the strip, or
whatever is under your hand — and be judged on timing alone. Early and late are marked as
they always are; a chord is one tap; a strike outside the window is still wrong, because
rhythm-first forgives the note and never the moment. The row's hint says the last part in
the learner's terms — *One tap per written note or chord; extra keys are wrong* — because a
chord played where one note is written earns two extra-note reds (`05` §3a: the first strike
closes the step, and the other two find no window open), and that surprised on the strip
before anything had explained it. The cursor, the keys and the summary
work exactly as they do in an ordinary `Keep tempo` run, because it *is* one: the only
difference is that the engine stops asking which key. The summary is headed **Rhythm run**
and says so under `Judged`, and the recorded result is tagged so it can never become a pass
or mastery of the piece — the minutes and the attempt count, the claim does not. Remembered
as a setting, because a learner who works this way works this way on every piece. Blind and
performance runs ignore it: both are claims about playing the piece.

**Ladder** (P21f, `05` §6). With a loop set, each clean pass speeds up one notch and each
pass with a mistake slows down one, from wherever the tempo is when it is switched on,
within the slider's own 30–130 % and never above 100 % unless the learner had already asked
for more. The status line says what happened at each pass boundary — *Clean — up to 70 %*,
*A mistake — down to 50 %*, *Clean — staying at 100 %* — and the summary reports where the
ladder ended. The number it moves is the tempo label on the bar, which is underlined while
the ladder is on: a figure that changes by itself reads as a fault unless something says it
is meant to, and the mark belongs on the figure rather than on a second readout competing
for the bar's width.

**Duet** (P21f). The app has played the other hand under the learner since P6 and nobody
could find it, because it lives in Settings — three screens away from the `R`/`L` buttons
that decide which hand it means. The row is the same setting (`playbackHands`), bound a
second time where the question is actually asked, and it names the hand in its own words:
*Duet: the app plays the left hand*. In the label rather than in the hint, because sideways
the sheet hides every hint and a row reading only `Duet` there would have moved the problem
rather than fixed it. No new setting. `playbackHands` has three values and this is a
toggle, so the row reads *both hands* when Settings has been set to `both` and says what
will actually be heard; off writes `none`, and on writes back whatever was playing before
it was switched off — `both` stays `both`, and a learner who has never been to Settings
gets `non-focused`, the setting's own default. (It used to write `non-focused` whatever had
been there, so one Off/On of the row silently undid a choice made in Settings.) That
remembered value is the one piece of state the row keeps, and it is the screen's rather
than a setting: it is what the sentence beside the row promises to bring back.

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
  A rhythm run is headed **Rhythm run** and carries a `Judged` line saying what was and was
  not measured; a run with the ladder on carries a `Ladder` line saying where it ended. The
  ±10 % buttons are one rung of that same ladder, which is where its notch came from.
  A run of a **technique exercise** carries one more line — *Legato*, *Staccato*, *Top note*,
  *Crescendo* — saying what the exercise is actually about (`05` §9a). It is in words rather
  than as a percentage, because a bare number under *Legato* reads as a second accuracy and
  the whole point of these is that they are not one: a staccato phrase of right notes held
  too long is a 100 % run. The line says *"this rung requires it"* only where the rung's
  `mastery.custom` says so, and no rung does yet.
  **Pass and master** are judged against **the rung's** `minAccuracy` and `minTempoPct` where
  the piece is on one, and against the Settings pair (§7) where it is not (`05` §9a).

**The screen's own stylesheet** is `src/ui/screens/ScoreScreen.css`, imported by
`ScoreScreen.ts`. `src/style.css` stays the app's shared sheet with one owner; what belongs
to this screen alone — the two rules the `⋯` rows above needed — lives beside the screen, so
the two files never have to be edited in the same change.

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

**Trading fours is not a drill kind, and the reason belongs here (2026-09-21).** It reads like
one — a prompt the app plays, an answer the learner gives — and it is built as a mode of the
accompaniment lab instead (§3c). Three things decided it. A `DrillKind` is a row in a **closed**
enum in `content/catalog.schema.json` plus a `STAFF_POLICY` row plus a catalog item to hang it
on, which is a wide change for one mode; `handoff` §5ar took the same choice the same way and
reused what existed. A drill is a *prompt loop* with a mark at the end, and this one must not
mark: the answer to a phrase is your own phrase, and `call-response`'s judging — the phrase
back, note for note, in order — is precisely the thing trading fours must never reward. And the
loop it needs is the bed, the bar count and the chart the lab already keeps against a
progression. `call-response` stays what it is: melodic dictation and a five-finger walk.

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
screen with a face for every drill kind — twenty of them, and the number is written here for
orientation, not as a count anything checks: the chrome — prompt counter, keyboard strip, right/wrong feedback,
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
- **How to answer, and a way in (2026-09-15).** Under the hint, one quiet sentence says
  *how* — how many notes, in what order, that the app is listening — for the kinds whose
  card does not make it obvious; "Play B♭ aeolian" named the task and a learner meeting the
  kind for the first time was left guessing. And for the kinds whose answer is a set of
  keys (modes, chord scales, chords, inversions, numerals, note flash, find the key), two
  quiet buttons, **Show me** and **Hear it**, light the answer on the strip or play it —
  a drill that can only test cannot teach. Show me also engraves the answer as one small
  staff under the words (`engine/drills/answerSheet.ts`): a scale as eighths in one bar, a
  chord as a whole note, in the key signature that fits it, so B♭ aeolian prints five flats
  and no accidentals — the name, the lit keys and the staff being the same fact three ways.
  It is a reference line, not a page, so it is drawn smaller than the score screen draws
  and without a tempo mark, and it goes with the prompt. Either forfeits that prompt's mark: the keys
  still go green when it is then played right, and the count does not move, so the score
  keeps meaning what it says. The ear kinds have no Show me; their answer is the sound,
  and *Play again* already repeats it.
- **When each kind draws a staff (2026-09-16).** The owner, on a harmonic-dictation card
  reading `C:I – C:V7/V – G:V – G:I`: *"These kinds of drills can also use a staff. Any time
  you're showing note progressions or chord progressions in these drills, it's useful to
  show it on the staff so I can correlate the notes on the staff with the chord
  progressions — know what chords look like. It's very hard to read chords."* A staff is
  worth having on nearly every card; **when** it may be drawn is a different answer on
  different kinds, because on some of them the staff *is* the answer. That answer is given
  once, per kind, in one table — `STAFF_POLICY` in `engine/drills/types.ts`, exhaustive by
  type so a new kind cannot be added without one — and the screen only obeys it.
  - `never`: **note-flash**, **transposition**, **simon** (each already draws its own notes,
    and a second staff saying the same thing is what §0 and `00` §1 forbid outright);
    **rhythm**, **dynamics** (no pitch in them to draw).
  - `on-reveal`: **find-key**, **mode**, **chord-scale** — naming a key, and the two scale
    kinds. Drawing the notes *is* telling the learner what to play, so it costs what
    *Show me* costs: that prompt's mark. Drawn again on a miss, when the card is held.
    (`mode` and `chord-scale` are the two rows worth arguing about: the ruling below reads
    across to a scale as easily as to a chord, and moving them is one word each.)
  - `after-answer`: **chord**, **inversion**, **extended-chord**, **roman-numeral**,
    **harmonic-dictation**, **ear-progression**, **ear-chord**, **ear-interval**,
    **ear-tune**, **call-response**. Two families, one rule. The ear kinds were heard and
    not seen; the four chord-reading kinds were seen as a symbol and have to be *found* on
    the keys. In both cases the staff drawn before the answer would **be** the answer — an
    ear drill with its notes printed under it is a reading drill, and a chord symbol with
    its notes printed under it is a card that cannot be got wrong — so nothing is drawn
    until the answer is judged. The moment it is, right or wrong, the staff goes up,
    forfeiting nothing, and the card is held so there is time to read it. **Every card, not
    only the ones that were paid for** (the owner's ruling, 2026-09-16): *"know what chords
    look like"* is a thing to be shown each time, and a staff behind a button is a staff
    nobody sees on the cards they got right. The chord kinds keep *Show me* as well — before
    the answer the staff is still the answer, and it still forfeits. A right answer is held
    too, which is the one place this departs from the flash-card rule: a staff on screen for
    the length of a right answer's tick has not been shown to anybody. A tap moves on, as on
    a miss, so nobody who has read it waits. Harmonic dictation has no per-answer settle —
    the learner says when the progression is finished — so its first *Done* judges the card
    and draws the staff, and the second (or a tap) moves on.
  - `always`: **pedal**, **backing-track** — the card names a chord it does not draw and the
    notes are not what is judged. The pedal card said *"Chord 1 — change the pedal cleanly"*
    and the chord it meant was nowhere on the screen; the backing track says *"8 bars"* and
    the loop is nowhere either. Drawn under the card from its first frame, at full size
    rather than the answer staff's, because here it is the card's content and not a
    footnote.
- **A progression is drawn as a progression (2026-09-16).** One chord to the bar as whole
  notes, in the order they sound, with the numeral over the bar it belongs to —
  `progressionSheet` in `engine/drills/answerSheet.ts`. The label goes on as a
  `<direction>`/`<words>` and not as a `<harmony>`, because `V7/V` and `C:I` are analysis and
  MusicXML's `<harmony>` can only say a letter name and a kind: a card that had to print
  `D7` where the lesson says `V7/V` would be teaching something the lesson is not. Two
  staves when the chords cross middle C, split there, and one when they do not — a
  progression written entirely in the bass on a grand staff is a treble stave holding four
  whole rests, and the empty half is then the loudest thing on the card. The key signature
  is chosen from the whole progression, not from its first chord.
- **Sideways, the staff moves rather than pushing the buttons off.** The words column holds
  the counter, the prompt, the status line and the buttons and has nothing spare; the
  picture column beside it is holding one chord symbol in a box 42 vh tall with most of that
  box unused. So on a screen under 520 px high the answer staff is drawn *inside the card*,
  under the symbols, at a smaller size again — which also puts the numerals and the notes in
  one column, which is what the learner is reading against each other. The `always` staff
  has no such room (the pedal lamp and its verdict spend the whole cap) and gives way there
  entirely, the same trade Simon's play-along staff makes (§5c-2). And while a card is held,
  the hint and the how-to sentence give way at every size: they are how to answer a question
  that has just been answered, and they are what the staff is drawn instead of.
- **A miss pauses (2026-09-15).** For those same kinds — the ones with a set of keys to light
  — a wrong answer *keeps* its card: the keys that were played in red, the keys that were
  wanted lit, and the answer on the same small staff *Show me* draws. A tap anywhere on the
  card or the stage moves on sooner, and the status line says so. Before this, the one moment
  in a drill with something to learn from went past at the speed of a right answer — the same
  few hundred milliseconds, and the next card. A right answer is untouched, because a flash
  card is about recall speed and a pause after a hit teaches waiting. The two lengths are one
  decision in `engine/drills/feedback.ts`, not a constant in the screen, and the kinds with a
  flow of their own (rhythm, pedal, dynamics, the backing track, transposition) are
  unchanged: there is nothing on their card to hold it for. Since 2026-09-16 every
  `after-answer` kind is held on a **right** answer too — not because there are keys to
  compare, but because there is now a staff on the card, and a staff is the one thing that
  cannot be read in the length of a tick. The screen decides that from the policy table; the
  two lengths themselves are still `feedback.ts`'s.
- **Going over the ones you missed (2026-09-15).** When a set ends with anything that did not
  count as right, the result sheet offers a second, short round of exactly those prompts —
  outlined, not filled, since *Again* is the sheet's one filled box (§0 R3). It is modelled as
  **a drill, not a mode of the screen**: a `PromptDrill` over the missed prompts with
  `revealed` set from the start (`engine/drills/review.ts`), which is what "this one does not
  count" already means in the engine, so the staff and the keys are up from the first moment of
  each card and nothing in the round can score. The counter reads *"1 of 3 to go over"* and
  carries no score, and the round ends with a line of its own — *"Went over 3"* — and **no
  recording at all**: what was written to the practice history is what the first round came
  to, and a going-over cannot change it. Offered only where the round can be rebuilt as
  prompts, which is every kind the engine drives through `PromptDrill` and none of the four
  that measure something other than pitch.
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
  two velocity meters and the ratio against the 1.6× target. *backing-track*: the bar count,
  or — where the row asks for `chartView` — the **form chart**: the same grid of bars the lab's
  *Jam it* draws, each with its numeral, the sounding one marked, over a *Bar n of N · pass n*
  line. Same classes, same words, because it is the same fact about the same form.

  **Melodic dictation is an ear card** (added 2026-09-21). `call-response` is the one kind
  that is *sometimes* one: the dictation drills' prompt label is the note names of the phrase
  they are about to play, and the five-finger and accompaniment patterns' label is a hand
  position that gives nothing away. So the prompt says which it is — `labelIsAnswer` — and
  a card whose label is the answer draws the headphone glyph until the attempt is judged,
  then the names come back with the staff (`STAFF_POLICY`: `after-answer`). `▶ Play again`
  is the replay and costs nothing: hearing the phrase again is the question being repeated,
  not the answer being given away, and `call-response` is not a revealable kind, so *Show me*
  and *Hear it* are not offered. Before this the drill printed `C4 E4 G4 E4` across the card
  before a key was pressed, which is a reading drill wearing an ear drill's name.
  *simon*: the same headphone glyph, with how *many* notes on the counter and in the hint and
  never which ones — unless the help ladder's top rung is chosen, where the glyph gives way to
  the name of the note that is sounding while the key it is on lights (§5c-2).
- **It advances itself.** An answer settles the moment it is complete, feedback shows for a
  beat (longer on a miss that has an answer to show — see above), and the next card appears — no button between cards, which is the point of a flash
  card. The kinds with no per-answer settle (rhythm, pedal, dynamics, backing-track) get an
  explicit Next/Done.
- **Right and wrong differ by shape, not only colour** (§9): the card's outline goes solid on
  a right answer and dashed on a wrong one.
- **Result sheet:** pass/master against the same accuracy setting a piece uses (§7), the
  kind's own numbers (mean reaction, clean changes, velocity ratio), "Again" for a fresh set,
  *Go over the ones you missed* where there were any, and the run recorded through the P7
  stores. After a backing-track run — the one kind that records what was played — the sheet
  also offers **Listen back**, which plays the learner's own notes through the piano at the
  timing and velocity they were played and keeps nothing afterwards (`DrillScreen`
  `playRecording`; a drill that judges every answer has nothing to play back that the learner
  did not just hear). **Simon is scored on its chain, not on an accuracy**: breaking at the sixth round is
  five chains right out of six, which as a percentage says the same thing as breaking at the
  twelfth, so the sheet says the longest chain and the best chain this item has seen, and the
  pass is a chain rather than a share of the cards (`engine/drills/simon.ts`).
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

### 5c-2. Simon (2026-09-15)

`drill.ear.simon-c-major` and `drill.ear.simon-chromatic`. The app plays one note and the
learner echoes it; then the same note and one more; then three, until the chain breaks. The
score is the longest chain echoed, and the sheet says it beside the best this item has seen.

- **Why it earns a kind of its own.** Every other ear drill asks for a name out of a small set
  — major or minor, a fourth or a fifth — and a good guesser gets a long way on them. A chain
  has nothing to choose from: the only way to play back five notes is to have kept five notes.
- **The notes** come from a range around middle C and either the degrees of a key (the white
  keys of C, in the first item) or the chromatic scale (the second), drawn up front from the
  seed so that the same seed is the same game; no note immediately repeats the one before it,
  because two of the same note in a row are heard as one held note. It is played through the
  same piano the ear drills use, one note at a time.
- **Or from a genre's own scale (2026-09-19).** `drill.ear.simon-blues-c` writes its `steps` as
  intervals above its key — `P1 m3 P4 A4 P5 m7` — rather than as degrees, because an interval
  says which name a black key has and a degree number cannot: six semitones above C is F sharp
  as a raised fourth and G flat as a lowered fifth. The blue note is the raised fourth in every
  key (the owner's decision; `BLUES_SCALE_FORMS`), as the written blues scales and the lessons
  have it. The card names each note from that spelling (in A, **D♯**, where the plain label
  says E♭), and the chain's staff is written in the tonic's minor key with each black key
  spelled as the scale spells it — E flat, F sharp and B flat on one staff in C — rather than
  one preference for flats or sharps, which cannot write that. A rung opens this Simon by naming it on
  its Simon button (`tools[].item`, which `validate.py` requires to be one of the rung's
  exercises); Today's door still chooses by stage (`simonForStage`).
- **Judged in order and in the octave it was played.** Everywhere else in the engine the shape
  is the point and the register is the learner's choice; here the register is part of what was
  heard. A wrong note ends the chain where it fell rather than letting the learner finish a
  chain already lost.
- **The personal best has no store of its own.** A run's accuracy *is* its chain as a share of
  the cap, so the best accuracy `recordRun` already keeps for the item is the longest chain it
  has seen, read back when the screen opens.

**Three levels of help, on the card (2026-09-16).** Simon by ear is the hardest drill in the
list to *start*: a beginner who cannot yet find a heard pitch on the keyboard fails at the
first note and learns nothing from failing, because what beat them was the translation and not
the memory. So the memory task is kept whole and the translation is lent out, in three rungs
(`engine/drills/simon.ts`, `SIMON_HELP_LEVELS`):

1. **Keys shown.** As the chain plays, each key lights on the strip in time with its own sound,
   its name replaces the glyph on the card, and the note lands on a one-bar staff between the
   two. Lit with the strip's existing **expected**
   state — the blue the Score screen already uses for "this is the key that is wanted", because
   that is exactly what it means here and a second blue would be a second thing to learn — one
   key at a time, because the chain is a sequence and a strip showing five at once is a chord.
   The default for `drill.ear.simon-c-major`.
2. **Ear first, keys after a miss.** The chain plays with no lights; a wrong note brings the
   same chain back over the lit, named keys and then **asks for it again**. The chain does not
   grow until it is played right, and the wrong key stays red under the replay — the point of
   it is the difference between what was wanted and what was done. The default for
   `drill.ear.simon-chromatic`.
3. **Ear only.** Sound alone, no lights, no replay: Simon as it was.

**And the chain on a staff, where the keys are lit (2026-09-16).** "Does Simon show the notes on
the staff too?" — it did not, and on the lit rungs it now does. As each note sounds, the key
lights, the card names it and the note is engraved on a staff that builds up left to right, so
sound, key, name and staff position are met as one thing rather than as four facts to be joined
up later — which is the translation this ladder exists to lend out, and the staff is the half of
it a learner will still need when the lights are gone. It is drawn by the same machinery as the
*Show me* answer (`engine/drills/answerSheet.ts`), at the same reference size, with the key
signature, the clef and the note value settled from the finished chain rather than from the notes
on it so far (`wholeRun`) — a staff that re-engraved itself at the fourth note would not be one
staff filling up. It is **one bar, whatever the chain reaches**: past eight notes a growing run is
written in sixteenths rather than spread over bars of quarters, because three bars wrap into two
systems in a host the width of a phone card and the card would grow taller half way through a
chain. The box it is drawn into is a fixed height at both ends as well, so nothing the engraver
does can move the buttons. It sits **on the card, beside the name rather than under it**: this screen has
no spare row — upright at 342x740 the drill body already fills its box to the pixel — and a staff
under the name pushed *Play again*, *Listen*, *Skip* and *End drill* off the bottom four times a
round, with them coming back the moment the chain ended. Beside it the staff costs thirteen
pixels, because an engraved line is shorter than the name is tall, and the name and the note then
say the same thing side by side, which is the teaching. **Under 520 px of height there is no staff
at all**, and the room is not the glyph's to give: the drill grid caps the stage at 42 vh, about
128 px of card, and the three chips take 88 of them in two rows because those three words do not
fit across the picture column in one — so what is left will not hold a stave however small the
name is made, and the half that would be clipped is the chips, which are the controls. A short
screen keeps the lights and the name, which are the drill (`DrillScreen.ts`, `chainStaffFits`),
and the card's *how to answer* line therefore does not mention the staff — a card promising one
that is not there is worse than one that lets it speak for itself. **The staff goes exactly where
the lit, named keys go** — the same timer takes all three away at the end of the chain, so it is up while
the app is playing and gone before the learner's turn. That is what keeps it a teaching display
and not a crib: the memory task is untouched, and it is drawn on the top rung's chain and on the
ear-first rung's lit replay after a miss, and nowhere else. One rule rather than two, and one
walk of the chain (`simonChainSteps`) drives the light, the name and the staff, so the three
cannot drift apart.

- **The rung does not discount the score**, and deliberately so. With the keys lit the chain is
  still gone by the time it is the learner's turn: the lights say which key that sound was, and
  nothing at all about how to hold five of them in order, which is the whole of what this drill
  trains. Scoring the top rung lower would have priced the ease-in out of existence for the only
  people it is for.
- **Three chips on the card**, in ladder order, none filled and the active one pressed (§0 R3 —
  a running drill spends its one filled box on nothing, and a filled chip would make a setting
  look like the thing to press). On the card rather than in the button row because that is where
  the learner is looking when they decide the game is too hard, and because sideways the card has
  its column to itself while the buttons do not. Pressing one replays the current chain under the
  new rung, so the control is never a label; a tap on the chips during a held card does *not*
  also move the card on. The card's "how to answer" line says what the rung does, rather than
  stating "a wrong note ends the chain", which is now true on two rungs of three.
- **The choice is remembered per item**, in `localStorage` beside the checklist's ticks and the
  tour's step — the same shape, for the same reasons. Not `settingsStore`, which is global:
  "keys shown" is right for the white-key game and wrong for the chromatic one on the same day.
  The catalog carries each item's *default* in `drill.params.help`.
- **A miss on the ear-first rung holds the card for as long as the replay takes**, not for the
  fixed beat in `engine/drills/feedback.ts` — a chain of six at half a second a note is three
  seconds of sound, and the fixed beat would cut the help off mid-chain. A tap still ends it
  early, like every other miss pause.
- **The game still ends.** "The chain does not grow until it is played right" needs a floor or a
  learner who never plays it right is in a drill with no end, and the cap already existed: a game
  drawn with twelve notes has twelve *cards* to spend, so four tries at the third chain end the
  game four chains short. That is what the counter has said all along.
- **Still rejected: the held answer staff**, which is what every other missed card gets — the
  chain engraved under the card and left there while the card is held. Here the answer *is* the
  chain, so a staff standing on screen at the moment the learner is being asked for it is the
  question written down. The play-along staff above is the opposite case and the distinction is
  the whole of it: it is up only while the app is playing, and the same timer that puts the
  lights out takes it away. A staff that is gone before your turn has told you what you heard; a
  staff that is still there has answered for you.

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
rhythm only [off] (`rhythmOnly` — the `⋯` sheet's row in §5, remembered as a preference because
a learner who works this way does so on every piece; Blind and Perform ignore it);
tempo-mode timing tolerance ms [±150]; pass criteria (accuracy % [90], tempo % [80]); require 2 songs per
lesson [off]; strict prerequisites [off]; daily goal minutes [30].

**Display** — theme [system]; landscape lock on score screen [on]; zoom [1.0]; show
fingering [on]; *Name the note I am waiting for* [off] (`showNoteNames`; it was written here as
"show note names in note heads, auto-on for Stage ≤ 1" and never did either — it names the
waited-for note in Wait mode's status line, `08-score-render-states` §11.19); show chord
symbols [on]; keys under the score [strip | ribbon | off, default strip] (`keys`, §5); keys guide
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
**remember the score folder** [on] (`folderHandles`, §4b — keeps the picked folder's handle so
Add does not re-ask; the hint says so, or says the browser cannot, and the toggle's own sentence
says what the next pick will do);
storage used, with a breakdown by scores / audio / lessons / your imports; **whether that
storage is safe** (2026-09-12) — one sentence under the usage figure saying what
`navigator.storage.persist()` answered, because everything the app holds is local with no copy
anywhere and IndexedDB starts in best-effort mode, where a device short of space may clear the
lot; the same line is where a *blocked database* is reported, since another copy of the app
holding the old version open means the app is running and saving nothing, and no one could
guess that from anywhere else; reset progress (double confirm).

### 7c. What §7 actually ships (as of P18, 2026-09-06; later entries carry their own dates)

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
link: a piece, a lesson or a drill opened by its address is left alone. Eight steps, one
screen each (nine as first built; the latency step went, see the table), in the order a person meets the app; every control writes straight through to
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

## 7f. MIDI (`#/settings/midi`)

The *MIDI devices* row under Settings → Input; `MidiScreen.ts`. One screen whose job is to
get the cable working and prove it, in the order a person meets the problem — and the
explainer comes *before* the button that raises the prompt, because since Chrome 124 every
`requestMIDIAccess()` call prompts, and a prompt the owner was not expecting gets dismissed,
after which the way back is buried in Chrome's site settings.

- **Connecting your piano**: two sentences (the cable into MIDI OUT and the phone's adapter;
  what Chrome will ask and why it is Chrome's prompt, not the app's), then **Connect piano**
  — the screen's one filled box (R3). Under it the status line (`webMidiSource.state.detail`)
  and, on a refusal, a notice naming the error with the recovery text from `midi/errorHelp.ts`.
  Where Web MIDI is not supported at all the button is disabled and the notice says so.
- **Inputs**: a radio group — *Listen to all inputs*, then one row per input port, named with
  its manufacturer. The app listens to every input by default because cheap adapters report
  names like "USB MIDI Interface"; pinning one is for when something else is sending notes.
  A pinned id that is not plugged in (§8, `05` §9) leaves *Listen to all inputs* selected and a
  line saying why. With nothing plugged in the list is one sentence, and it is a different
  sentence before Connect has been tapped ("tap Connect piano, then plug the cable in") and
  after ("plugging one in is picked up live"), because hot-plug only works once there is an
  access object to hear it.
- **Test**: the keyboard strip, live from the cable *and* tappable, so the screen works with
  no cable at all; a log of the last ten notes (name, velocity, source); **Test sound (C major)**
  with its own status line. A tapped key sounds through the phone as a bonus — the light is
  the test.
- **Open diagnostics →** at the foot, for the raw log and the debug report (§7b).
- Leaving releases the screen keys and the strip; the Web MIDI connection itself is the app's,
  not the screen's, and stays.

## 7g. Microphone (`#/settings/mic`)

The *Microphone* row under Settings → Input; `MicScreen.ts`, `05` §11.5. Connect, watch it
listen, calibrate — and everything the owner needs when it does *not* work, because the
level meter and the noise floor answer "is it hearing anything at all?" before any question
about wrong notes is worth asking. The opening sentence says what the microphone is: the
backup for a piano with no usable MIDI out, never as certain as a cable, so anything it is
unsure about is amber and never counted against you.

- **Connection**: the status line; the input picker (*Default input*, then every device,
  built-in ones marked); the **Line input preset** toggle, for a cable from the piano rather
  than a room mic (lower thresholds, no room noise), switched on by itself when a non-built-in
  device is chosen and not yet touched; **Connect microphone** (filled; reads *Reconnect* once
  connected) and **Disconnect**, drawn only while there is something to disconnect from (R4).
- **A refusal is answered by what can still be done** (§8). A prompt that closed without an
  answer, or a browser that will not say, keeps the button and asks for another tap. A denied
  permission, no microphone at all, or no microphone API is *settled*: the meter, the
  calibration and Connect are taken away and one control remains, **Set up MIDI instead**,
  because a Connect button that can never work over a meter reading `Level: —` is the
  furniture R4 forbids.
- **What it hears**: a level bar and a line — RMS, noise floor, peak — with *clipping, move
  further away* past the peak.
- **Calibration**: what the routine does (silence, every C, a slow chromatic scale with the
  metronome, three chords — how loud each part of the keyboard is to this microphone, how
  sharp the strings are, how late the sound arrives), **Length** (*Full*, about a minute, or
  *Quick*, about fifteen seconds, which measures fewer notes and is enough to prove the
  microphone works), the stage line, **Start calibration** (outlined: connecting is what the
  screen is for, calibrating is what comes after), and what is stored for this input — date,
  latency, noise floor, chords heard, notes not heard. The routine is
  `audio/pitch/calibrationRun`, the same one Diagnostics and the setup tour run, so a number
  measured here is the number measured there.
- **Leaving closes the microphone** (§8): the track, the worklet and the graph — not only the
  raw-audio tap — because this is the screen most likely to be opened to test something and
  walked away from.

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

**Wide screens: a column that stops growing, centred (2026-09-16).** The owner, on a tablet
and a laptop: "No giant stretching, just centering and side to side bars if there's extra
room." Until this the shortest-side breakpoint above was the app's only rule for anything
wider than a phone, and a laptop (1366 × 768) fails its height half — so it fell through to
the phone layout stretched across the whole glass: a Settings row with its label at one edge
and its control at the other, a Library of single-column rows 1,230 px wide, and a bar of
Suo Gân engraved across the screen.

The rule is a cap, not a breakpoint. Three tokens in `style.css` `:root`, kept together so
they can be compared: `--page-max` (1040 px) is a browsing screen — two columns of rows, each
about as wide as a phone's one; `--column-max` (720 px) is one column of settings or prose
(Settings, the Lab, paper practice), the width the sub-screen cards already used; `--stage-max`
(1040 px) is the score's engraving surface, wider than a reading column because staff width is
legibility, and finite because a system stretched past its natural note spacing is harder to
read than a smaller one (`00` §1). Each box is as wide as its container up to its cap and
centred, so the room left over is a bar of page either side, never a bar on the right alone.
The score's cap is on the stage, not the screen, because the stage is the box the renderer
measures and engraves against. The keyboard strip's keys row is centred in its strip for the
same reason: a two-octave range on a laptop used to end two thirds of the way across.

The laptop clause: the two-column browsing grid also applies from 1,100 px wide whatever the
height, because a list of rows needs width and not height, while the side panel and the
bars-per-window default keep the shortest-side test above — a panel is only worth having
with height to put it in. 1,100 is clear of a phone held sideways (915 px at the largest
Display size). The folder and the shelf are excluded from the grid, as the phone-sideways
grid already excludes them: both live in a 640 px card, and two columns of 300 clipped the
folder's composer line mid-word and squeezed the shelf's one book into half its card.

The phone is untouched: every cap is wider than 740 px (and than 915), so at 342 × 740 and
740 × 342 nothing here applies — `wide.spec.ts` carries both as controls.

The cap does not change how many bars a system holds; what it changed, the same day, is
whether a sparse bar is stretched to it. On a stage at least 900 px wide (the tablet number,
which is also a laptop's capped stage) the renderer engraves each slot at its natural width
first and stretches it only if its ink already spans three quarters of the page; a sparser one
keeps its spacing and is centred, so Suo Gân's four-note bar sits in the middle of the stage
with page either side rather than across the whole of it. A phone never enters this path — it
stretches, one engraving, as before. The rule that was meant to do this (eight staff heights
of page per bar) compared the page with the system's ink height and never fired on any
screen; `WindowRenderer` `FILL_SHARE` and `wide.spec` hold the new one.

E2E: `tests/e2e/wide.spec.ts` — seven shapes from 342 × 740 to 1920 × 1080, every screen,
gutters symmetric, content no wider at 1920 than at 1366, pictures under `build/wide/`.

The walk waits for the offline cache to be stocked before it starts, and its wait for a screen
knows about the ones that are fetched on demand. The score, the PDF viewer and the setup tour are
lazy (`ui/AppShell.ts`), so until the chunk lands the screen element does not exist at all and a
wait on it reports "element(s) not found" — which is what CI reported on 2026-09-17, on the first
visit to the largest chunk in the app while the worker was still pulling the whole catalog off the
same server. If that fetch fails rather than queues, the shell draws its own way out and the test
now takes it. Neither half is a bigger number: one waits on the thing that was slow
(`navigator.serviceWorker.controller`, which `clientsClaim` sets when the precache is done), the
other on the thing the shell actually says.

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
