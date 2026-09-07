# The UX pass: four rules, nine answers, and what the pictures actually show

2026-09-07. The owner had the app photograph itself (`npm run tour`, 82 scenes × 4 form factors)
and asked the builder to review the pictures. That review found the mechanical faults and then
stalled on everything that needed judgement, so it wrote `docs/prompts/design-brief.md`: nine
questions, no answers. This document is the answers, and the review the tour was meant to get.

Method: I read 46 of the 328 pictures by eye — every portrait scene of the five tabs, the score
screen in all its states, six of the twenty-three drills, the sub-screens, and the landscape and
tablet versions of Today, Plan, a lesson, the score and a drill — and read the source behind each
thing I disliked before deciding whether it was taste or a defect. Numbers below are CSS px on the
S25 (360 × 780); the tour's PNGs are that at 3×.

What the owner asked for back: *a decision, a sentence of reasoning, and where it is written
down*, for each question. Four rules do most of the work, so they come first.

---

## 0. The four rules, and the clock

These go into `docs/04-ui-spec.md` as a new §0 ("Rules every screen obeys") and into `00` as
D26, so the next twenty fixes have one taste rather than twenty.

**R1 — The subject first.** A screen's subject — the list, the exercise options, the notation —
starts within the first screenful on the phone, upright. Explanation is one line in the header
at most; the long version lives *behind or below* the thing it explains (a `<details>`, a sheet,
a link), never above it. The one exception is an error's remedy, which appears when the error
does and not before.

**R2 — Two reading distances.** Screens used on the music stand — Score, PDF, Paper practice,
Drill, Metronome — are read at arm's length and stay large. Every other screen is held in the
hand and uses ordinary phone density: a list row is one title line, one line of muted detail,
and badges only when they say something the detail line does not; a settings row is a label and
its control on one line, help text under it only when the label cannot carry the meaning.
Targets, so the tour can check them: a Today or Plan row ≤ 96 px tall, a settings row ≤ 56 px,
at least eight settings on the first screenful.

**R3 — Weight by frequency.** A filled box is the thing you do on most visits, and there is at
most one per screen. An outlined box is something you do often. Plain text is something you do
once per lesson or less — reorder, mark done, register a book, find more. A rare action that
needs several controls (ordering tracks, choosing sections) lives in a sheet behind one text
link, not on the screen it is rarely used on. This is the answer to 6, 6b and 7 at once, and it
thins the lesson page and Today without hiding anything.

**R4 — Nothing dead.** When a screen's subject is missing, it draws the sentence that says so and
the one control that does what the sentence suggests. No furniture: no empty grid, no live
toggles that act on nothing, no "Disconnect" while disconnected, no statistic with no data behind
it. A single-line list is not empty and gets no special treatment.

**The clock (question 9).** A clock-driven run **pauses when the page is hidden and says so on
return**, and the engine **ticks from a timer as well as from frames**, so a starved animation
loop slows the paint and never the music. Detail under 9 below.

---

## 1. The nine questions

### 1. What earns a place above the fold

**Decision.** R1: the subject first; explanation collapses to one line with the rest behind it.
Not the state-dependent variant ("show until the thing exists") — a rule with two states is two
screens to keep right, and the second state is the one nobody reviews.

What it does to the three screens named, and the two the brief missed:

| Screen | Now above the fold | After |
|---|---|---|
| Library | title, search, six filters, "Your own scores" heading, two lines of prose, three buttons; first item at ~640 px | title, search, one row (`Filter ▾` chip that opens the six selects, plus the `Only mine` toggle), first item at ~170 px. "Your own scores" becomes one text row at the *bottom* of the list: `Import a score · Shelf · Score folder`. The MusicXML/PDF sentence moves into the import sheet, where it is read at the moment it matters. |
| Score folder | title, heading, four lines of prose, "Nothing picked yet", button; browse filters drawn with nothing to browse | title, one line (`37,261 scores in pianopath-library` or `No folder yet`), the button, then the list. The four lines go into a `<details>` labelled "How this works" under the button. With no folder, the browse block is not drawn (R4). |
| A lesson page | title, status, three buttons, a link, the needs line, two buttons, a link, a hint paragraph; "Exercise options" at ~560 px | title, one status line (`in progress · Quick check · I already know this`), then **Exercise options** at ~150 px, then a block "More for this rung" holding the needs line, `Find more · Import for this rung · I have this on paper` as text, and the paper hint, then "From your own books". |
| MIDI (`#/settings/midi`) | two paragraphs of Chrome instructions above `Connect piano` | one line and the button; the "Chrome will ask…" paragraph appears only after the permission prompt is dismissed or denied (R1's exception). |
| Shelf, empty | fine already — sentence and one button | unchanged; it is the model for R4. |

**Why.** He reads the explanation once. The list he reads every day.

**Written where.** `04` §0 R1; §4, §4b, §3 (lesson page) get one line each saying what is above
the fold.

### 2. Density

**Decision.** R2. It depends on the screen and the dependency is the reading distance, not the
amount of content. Score, PDF, Paper, Drill and Metronome are stand screens and stay as they are
(the Metronome's 80 bpm at 64 px is exactly right). Today, Plan, Library, Progress, Settings and
every sub-screen are hand screens and go to phone density.

Concretely on Today: the header is four rows (title, a two-line week sentence, the MIDI chip on
its own line, four length chips) before the first card. It becomes two: title with the MIDI chip
right-aligned, and `0 / 150 min this week · 0 days` with the four length chips on the next line.
The card row loses two of its three repetitions (see 3) and its meta line drops to one line:
`5 min · L0.1 · LH`. Settings rows lose their vertical padding and their help text moves under
the label in the muted size; the two long labels that wrap a select onto its own line ("Default
mode without one") get shorter names ("Default mode, no input").

**Why.** A phone on the stand is a metre away; a phone in the hand is thirty centimetres. Forty
settings at eight to a screen is five screens of scrolling to find one.

**Written where.** `04` §0 R2, with the px targets; `04` §2 and §7 each get the one line that
says which distance they are.

### 3. Plan says everything three times

**Decision.** The unit heading survives (it is the group). The card title is `0.1 · Lesson title`
and the subtitle goes: `PlanScreen.lessonRow` passes the unit title as the subtitle
(`PlanScreen.ts:70`), which is the repetition. Where a unit has exactly one lesson with the same
title as the unit — which is most of Stage 0 — the unit heading is not drawn and the card carries
the unit's track badge instead. The meta line `2 exercises · 0 songs · ~2 days` stays; it is the
only line that says something new.

The `subtitle` field is a view choice, not data: nothing in `curriculum.json` carries a lesson
subtitle, so there is nothing to remove from the build.

**Why.** Three sizes of the same words is a third of the screen saying nothing.

**Written where.** `04` §3 (one line under "Plan").

### 4. What an empty state may draw

**Decision.** R4: the sentence and the one control, nothing else. The chord chart for a piece
with no chord symbols draws `Hot Cross Buns has no chord symbols — open it on the Score screen
instead` and a button `Open on the Score screen`; no grid, no Count off, no toggles. The same
rule, applied where I found it broken: the Score folder with no folder draws no browse filters;
the Microphone screen shows `Disconnect` only while connected and does not print
`Not connected (not connected)`; the run summary hides `Timing 0 ms mean, 0% early` and
`Wrong notes 0` when the run had no hits to measure — a statistic with nothing behind it is a
dead control in a different coat.

**Why.** A screen that says it cannot work and then looks like it works is a lie with buttons.

**Written where.** `04` §8, which covers error states and now covers empty ones.

### 5. Dead space

**Decision.** Anchor the sheet to the **top** and let the leftover be where the control bar and
the keyboard strip live *without covering the music*. The bar keeps its auto-hide, but it hides
only when it would otherwise overlap the notation — in portrait, with a third of the stage
empty, it never needs to. The PDF viewer already puts the next system, dimmed, in its leftover;
that is the same idea and stays.

Not centred: a centred sheet moves every time the window swaps from two systems to one at the
end of a piece, and a score that jumps mid-run is worse than one with a margin under it.

**Why.** Space under the notation is only dead if nothing is allowed to use it; today the bar
floats *over* the notes and then hides itself to get out of the way of a problem the layout
created.

**Written where.** `04` §5 (layout paragraph) and §5b.

### 6. Buttons and links

**Decision.** R3, weight by frequency, and it gives a different answer from every candidate in
the brief. On the lesson page: `Quick check` is an outlined box (most visits); the option cards'
▶ is the one filled box; `I already know this`, `Mark lesson done`, `Find more`, `Import for this
rung`, `I have this on paper` are all text. On Today: `Start session` filled, `Shuffle options`
outlined, `Jump to… · Metronome` as text, and `Review a skill` and `How to practise` leave Today
altogether — both already live on Plan. On the drill screen: `Done`/`Listen` boxes and
`Skip · End drill` text is already right.

**Why.** "Navigates versus acts" puts `Import for this rung` and `Quick check` in different
classes for a reason no user can see. Frequency is the thing a person feels.

**Written where.** `04` §0 R3; `docs/04` §2 and §3 each list their one filled box.

### 6b. Skills draws all 266 concepts

**Decision.** R1 applied to a list: it opens on what needs attention. If anything is rusty, the
rusty filter is on and the count says `12 rusty of 266`; otherwise it shows the current stage and
the one below. Under whichever it shows, one text link — `Show all 266` — renders the rest in
pages of fifty, the way `LibraryScreen` already does with `PAGE_SIZE`. The three filters stay but
share one row with a search box, and `Find more` on every row becomes text (R3); `Drill it`
stays the box.

**Why.** The reason to open Skills is that something has gone rusty, and the screen already knows
which.

**Written where.** `04` §3a.

### 7. The reorder arrows

**Decision.** R3: ordering tracks is a once-a-year action and leaves the daily screen. Plan's
header shows only the *active* tracks as chips, plus one chip `Tracks…` that opens a sheet with
all fifteen toggles and the ▲▼ (and the drag) beside each active one. The `Placement test ·
Review a skill` links stay in the header as text. That takes the header from ~470 px to ~100 px
and puts Stage 0 above the fold.

**Why.** Fifteen chips and eight arrows are the price of a thing he did once, paid every day.

**Written where.** `04` §3.

### 8. The heat map

**Decision.** It is a heat map, and it already is one: the brief's "one colour" is wrong.
`ProgressScreen.heatLevel` buckets minutes into five levels (0, under 10, under 25, under 45,
45 and over) and `style.css` colours each; the used-state picture (`78`) shows two blues side by
side. What is missing is the key and a heading that says what the squares mean. So: keep the
five levels and the thresholds, add a one-line key under the grid (`0 · <10 · <25 · <45 · 45+
min`), and rename `Last three months` to `Minutes a day, last 13 weeks`. Nothing else changes;
the weekly line above it already states the goal and the total.

**Why.** Thirteen weeks of days is the right span for "am I keeping this up", and the chart
already answers it — it just does not say so. Replacing it with weekly bars would be a second
chart of a number the screen already prints.

**Written where.** `04` §6.

### 9. What a clock-driven run does when the frames stop

**Decision.** Two of the three candidates, because they answer two different failures:

1. **Pause and say so** when the page is hidden. On `visibilitychange` → hidden, a running Tempo
   or Listen run pauses (the engine already has `pause()` and `pausedTotalMs`). On return, the
   status line says `Paused — you were away 40 s` with `Resume` and `Restart`. The practice
   record excludes the away time: the engine's elapsed time already subtracts pauses, and the
   session's minutes must too.
2. **Tick from a timer as well as from frames.** `ScoreSession.loop` stays the painter, but
   `engine.tick()` is also driven by a 25 ms interval; `tick()` is idempotent on the clock, so
   two callers cost nothing. This is what removes the flake: under a full parallel Playwright
   run the frames are starved but timers still fire. The `Clock` stays `performance.now()`
   (`engine/types.ts`); the AudioContext clock was the third candidate, and it is not needed
   once hidden pages pause — Android suspends the audio context in the background anyway, so
   it would not have helped.

Not "catch up silently": a phone call must not become a page of missed bars.

The e2e evidence that this is fixed is `tests/e2e/engine.spec.ts` passing inside the full
`CI=1 npx playwright test`, three times, not on its own (`docs/prompts/verifying.md` §3).

**Why.** Honest, cheap, and it fixes the test the same way it fixes the phone.

**Written where.** `05` §3 (a new paragraph "When the page is hidden") and `01` §6, whose
"never `setTimeout`" is about scheduling audio and needs one sentence saying the engine's tick is
not audio and may use a timer.

---

## 2. What the pictures show that the brief did not ask about

All of these are defects or near-defects, not taste. Scene ids are the tour's file names.

**The score screen, upright (`20`–`35`).**

- **Twenty-two controls in five rows**, several unlabelled: `−`/`+` for bars and `－`/`＋` for
  zoom (different glyphs, no label between the pairs), `🎵` for the metronome, `Window` (a state
  shown as a verb), `Keys`, `🔈 Phone`. `04` §5 specifies a thin bar and a **⋯ menu** for the rare
  settings; the menu was never built, so the bar is the menu. Decision: build it. The bar keeps
  ⏮ ▶ · mode · R L Both · the tempo label (tap opens a sheet with the slider and bpm) · ⋯. The
  sheet holds input, loop/section, metronome, `Bars in window − 2 +`, `Size − +`, `Layout
  Window|Scroll`, `Keys`, `Sound Phone|Piano`, `Blind`, `Perform`, each with its word. Upright,
  the bar is one row; sideways, one row.
- **Back is in the bottom bar and the title is top-right.** `← Back` goes top-left with the
  title beside it, which also ends the title overlapping the first bar sideways.
- **A piece with sections (`31`) reflows the bar to six rows** and splits `− 2 bars` from its
  `+`. Goes away with the menu.
- **The summary (`35`) is a full screen with the top 40 % used** and `Timing 0 ms mean, 0%
  early` for a run with no hits. It becomes a bottom sheet over the score (the score stays
  visible for "Loop the weak bars"), and empty statistics are not printed (R4).
- **Blind mode (`29`) shows the score, and always has.** `.score-stage--blind` sets
  `visibility: hidden` on the stage, and `.score-buffer.is-front` sets `visibility: visible` on
  the front buffer inside it (`style.css` ~649). `visibility` is inherited, and an explicit
  `visible` on a descendant wins over a hidden ancestor — so the notation has been drawn in every
  blind run since P16. The button says `Show the score` over a score that is showing. The tour
  photographed the defect and the review did not read the picture; it is one line of CSS
  (`.score-stage--blind .score-buffer { visibility: hidden }`) and an e2e assertion that the
  SVG is not visible in a `?blind=1` run.

**Today (`01`, `02`, `75`).** Four header rows before the first card (see 2). Each card says
`Warm-up` three times — the reason line, the meta line and the badge. The meta drops the kind
(the badge has it) and uses short hand labels. Six action buttons in three rows under the card
become one filled, one outlined and two text (see 6).

**Plan (`03`–`05`).** The chip cloud (see 7) and the triple title (see 3). `Hide`/`Open` on each
stage row is a quiet button on a row that is itself the toggle; the row alone is enough, with a
chevron.

**Library (`06`, `61`–`63`).** See 1. Also the item sheet (`62`): `Level L0.1 Hands Hands together
Type` is one flex row with the last value cut off — the same `dl.kv` fault the drill result had
(`docs/decisions/2026-09-07-the-ux-tour.md`), fixed there and not here. Same fix: a two-column
grid.

**Lesson (`12`–`16`, `90`).** See 1 and 6. The `comes later` line on a locked rung (`90`) is
right and stays as it is.

**Drills (`40-*`, `41`).**

- **The five-finger drill's prompt is its own name**: `Left-hand five-finger walk — 1`.
  `DrillScreen.promptText` has no case for `five-finger`, `arpeggio` or `placement` and falls
  through to `current.label`, which for a generated item is the title plus an index. Each needs
  a sentence (`Listen, then play the five notes back with the left hand`), and a unit test that
  walks every drill kind in `catalog.json` and asserts the prompt is not the label.
- **Tips are open by default during a set** (`40-drill-ear-interval`, `-rhythm`) and sit between
  the controls and the keyboard, which the code's own comment says is the one place they must not
  be. Collapsed during a set, open on the result.

**Settings (`08`, `09`).** Density (see 2). The Content chips print track ids (`chords-pop`,
`improv-compose`, `theory-ear`) where Plan prints titles (`Chords & pop`); use the titles.
`Refresh the numbers` is rare and becomes text (R3).

**Microphone (`53`).** `Not connected (not connected).`; a bare checkbox under the "Line input
preset" paragraph with its label above rather than beside it; `Disconnect` shown while
disconnected. R4 and one label.

**Progress (`07`, `77`, `78`).** See 8. The week line duplicates Today's, which is fine — it is
the same fact in the two places it is wanted.

**Tablet.** The four-bar window sideways (`tablet-landscape/20`) draws four bars on two systems
and leaves half the stage empty; the two-column Today is good; the control bar wraps to two rows
with `Keys · Phone` orphaned on the second. The ⋯ menu fixes the last; the first is the same
question as 5 and gets the same answer.

**Landscape phone.** Good. The score fills 98 % of the width; the side nav is right; a drill's
keyboard fills the width. The only landscape-specific fault is the title over the first bar
(above).

---

## 3. The tour: why it "didn't do too well", and what it becomes

The tour photographed 328 scenes and asserted one thing about each — that the screen arrived.
It did not assert that the scene was in the state its caption claims. Hashing the PNGs finds
**thirteen pairs of scenes that are pixel-identical** while their captions describe different
things:

| Claimed different | Identical in |
|---|---|
| `21-score-wait` / `23-score-wrong` ("Red, and it does not move on") | all four form factors |
| `03-plan` / `05-plan-tracks` ("a track toggled") | all four |
| `77-progress-used` / `78-progress-heatmap` | three of four |
| `01-today-empty` / `02-today-controls` | both tablets |

So the review was being asked to judge a wrong-note screen that showed no wrong note, and a
blind-mode screen that showed the score. Some of these are harmless (the tablet Today does not
scroll, so "scrolled down" is the same picture); the first is not — the spoofed wrong note (C3,
outside the strip's range) produced nothing visible, and the caption said *red*. Whether that is
the tour or the app is exactly what a person looking at the picture cannot tell — and the blind
scene shows the cost of not asking: the picture was right, the caption was wrong, and a real
defect (§2) sat in plain view under a note reading "hidden on purpose".

**What changes** (in P21 §D):

1. **Every scene proves its state.** `scene()` takes a predicate — a selector that must exist
   (`.is-wrong`, `.score-stage--blind`, `[data-open="true"]`) — and a scene whose predicate
   fails is recorded as a **gap**, not photographed. A picture that lies is worse than no
   picture.
2. **Identical pictures are a finding.** The audit hashes every PNG and reports any two scenes
   with the same hash under different slugs. Thirteen today.
3. **The rules are checks.** R1: the first content row's top is within the viewport on every
   list screen, upright. R2: row heights against the targets. R3: at most one filled button per
   screen. R4: a screen whose status line says "no …" has at most one button. Reported per
   scene beside the existing seven checks, so a regression shows up in the same place the
   original defect did.
4. **Single-glyph buttons need a word.** Any button whose text is one character or an emoji and
   has no `aria-label` is a finding; any that has one is listed so the reviewer can decide
   whether the word should be visible.
5. **Only what changed.** `shots.json` keeps each scene's hash; `index.html` gets a "changed
   since last tour" filter, so a reshoot after one screen's fix is a five-minute look, not a
   fifteen-minute one. This is the mechanism behind "reshoot before believing anything in
   `known-problems.md`".

What stays: the seven mechanical checks, the seed, the four form factors, the disposable
design. `choices.html` goes when P20's step 9 exists, as P20 already says.

---

## 4. Ask the owner

Two things are his taste and are not decided here:

- **Bars in the window, upright.** Two bars draw as two one-bar systems, each with its own clef
  and key signature, so half the width of each line is preamble and the notes are huge; one bar
  is the same picture with less read-ahead; four is readable but small. Already on
  `build/tour/choices.html` and P20 step 9. My recommendation, for what it is worth: two, and
  live with the preamble.
- **`Review a skill` and `How to practise` on Today.** R3 says they leave (both are on Plan). If
  he reaches for either from Today most days, they stay as text links. Nothing else in this
  document needs him.

---

## 5. What was not looked at

Seventeen of the twenty-three drill kinds, the chart with chords sideways, the PDF adjust
screen, the folder search results, the used shelf, and every tablet scene not named above. The
audit covered them mechanically; nobody has judged them. P21 §D makes the next look cheaper
than this one was.
