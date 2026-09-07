# P21 — The UX pass: four rules on every screen, the clock, and a tour that proves its pictures

## Common header (unchanged, applies to everything below)

Work on the branch `claude/piano-teaching-app-bo19td`. Commit early and often, conventional
commit messages. **Never name an AI model in a commit message, a comment, a doc or code.**
Verify by commands you actually ran and paste the exact output — do not claim something works
because it should; `docs/prompts/verifying.md` is the concrete version of that rule and is
short. Keep scope; anything you notice and do not do goes under **Follow-ups**. Where a decision
has no obvious default, pick the simpler option and say that you did. Report as **Done · Not
done/blocked · Follow-ups · Questions for the owner · Files touched**. Any deviation from the
docs gets a note in `docs/decisions/<date>-<topic>.md`.

## What this is

`docs/prompts/design-brief.md` asked nine questions and got no answers. The answers are now in
**`docs/decisions/2026-09-07-ux-decisions.md`** — read it first, all of it, and then this. This
prompt is that document turned into work: the decisions are made, so do not re-open them; where
the decision says "ask the owner", leave it alone.

Four things, in this order, each committed on its own:

- **§A** — write the four rules into the docs and apply them screen by screen.
- **§B** — the score screen's control bar becomes the bar-and-menu that `04` §5 always specified,
  and blind mode hides the score, which it has never done.
- **§C** — the clock: pause when hidden, tick from a timer, and the three flaky Tempo tests stop
  flaking *inside the full suite*.
- **§D** — the tour proves each picture is what its caption says, and turns the four rules into
  checks.

Read before you start: `docs/decisions/2026-09-07-ux-decisions.md`,
`docs/decisions/2026-09-07-the-ux-tour.md`, `docs/prompts/known-problems.md`,
`docs/prompts/verifying.md`, `docs/04-ui-spec.md` §0 (which you will create), §2, §3, §3a, §4,
§5, §6, §8, `docs/00-overview.md` D17, D19, D21. The pictures are in `build/tour/`; look at the
ones the decisions document names before touching the screen they show — it is faster than
reading the code.

Size: about two sessions. §A is the volume; §B and §C are the design work; §D is small.

---

## §A — The four rules, in the docs and on the screens

### A0 — Write them down first

Add **`docs/04-ui-spec.md` §0 "Rules every screen obeys"** with R1–R4 verbatim from the
decisions document §0 (including R2's pixel targets), and **`docs/00-overview.md` D26** as one
row pointing at §0 and the decisions document. Then, under each of §2, §3, §3a, §4, §4b, §5, §5b,
§6, §7 and §8, add the one or two lines the decisions document says belong there ("Written
where" under each question). Do this *before* the code, so the code is checked against the
doc and not the other way round.

### A1 — Today (`TodayScreen.ts`)

- Header to two rows: title with the MIDI chip right-aligned; `0 / 150 min this week · 0 days`
  and the four length chips on the next line. It must not wrap on 360 px.
- The card row (`rowFor`, ~line 175): subtitle is the reason, one line with an ellipsis; meta is
  `5 min · L0.1 · LH` — the slot kind leaves the meta (the badge has it), hands use the short
  form (`RH`, `LH`, or nothing for both). A row is ≤ 96 px tall on 360 px with a one-line title.
- Actions under the card (R3): `Start session` filled, `Shuffle options` outlined, `Jump to… ·
  Metronome` as text on one line. Remove `Review a skill` and `How to practise` from Today —
  both are on Plan. (`ux-decisions` §4 leaves the owner a way back; note it under Questions.)
- Tests: extend `tests/e2e/today.spec.ts` (or wherever Today is covered) to assert the first
  card's top is within 300 px of the viewport top at 360 × 780, that no `.list-row__meta` in the
  card wraps (its `scrollHeight` equals one line-height), and that exactly one `.button--primary`
  is on the screen.

### A2 — Plan (`PlanScreen.ts`)

- `lessonRow` (~line 63): drop `subtitle: unitTitle`. Where a unit has one lesson whose title
  equals the unit's, do not draw the unit `<p>` and give the card the track badge instead.
- Tracks (R3, decision 7): the header shows the *active* tracks as chips plus one chip
  `Tracks…` that opens a sheet (`openSheet` from `widgets.ts`) holding all fifteen toggles and,
  beside each active non-core one, the existing ▲▼ and drag. Keep `activeTracksFor` and
  `commitOrder` as they are; only where the controls live changes. `Placement test · Review a
  skill` stay in the header as text.
- Stage rows: the row is the toggle; drop the `Hide`/`Open` quiet button and show a chevron
  that turns.
- Tests: Stage 0's row top is within 200 px of the viewport top on 360 × 780 with all tracks
  on; the sheet reorders and the order round-trips through `updatePlan`; no lesson row contains
  its unit's title twice.

### A3 — Library (`LibraryScreen.ts`)

- Header: title, search, then one row: a `Filter ▾` chip that toggles the six selects into view
  (`aria-expanded`), and `Only mine`. The count line shows the active filters in words when
  any is set (`Songs · Passed · Right hand`), so a hidden filter can never silently empty the
  list.
- "Your own scores" (~line 238): the heading and the prose go. At the *bottom* of the list, one
  text row: `Import a score · Shelf · Score folder`. The MusicXML/PDF sentence moves into the
  import flow — show it in the status line the first time the picker opens.
- Item sheet (~line 401): `dl.kv` is a flex row; the drill result's fix (a two-column grid,
  `docs/decisions/2026-09-07-the-ux-tour.md`) applies here. Reuse the class the drill result
  uses rather than adding a second one.
- Tests: first `.list-row` top within 200 px on 360 × 780 with no filters; setting a filter
  behind the chip and collapsing it leaves the count line naming it; the item sheet's last
  `dd` is fully inside the viewport width.

### A4 — Lesson page (`LessonScreen.ts`, ~lines 50–64)

Block order becomes: title · status line (`in progress` badge, `Quick check` outlined, `I
already know this` text) · **Exercise options** · a block headed `More for this rung` with the
needs line, `Find more · Import for this rung · I have this on paper` as text, and the paper
hint · **From your own books**. `Mark lesson done` joins the text in the status line. The
locked-rung line (`90`) stays where it is, above the options.

Tests: on `#/lesson/2.1` at 360 × 780 the `Exercise options` heading's top is within 260 px of
the viewport top; exactly one filled button per option card and none elsewhere; every text
action still works (existing tests cover `I already know this` and `I have this on paper` — keep
them green).

### A5 — Skills (`SkillsScreen.ts`)

- Opens on the rusty ones when there are any (`stateFilter = 'rusty'`, count line `12 rusty of
  266`); otherwise on the current stage and the one below. Under the list, `Show all 266` as
  text, which renders the rest in pages of 50 using the same `PAGE_SIZE`/"Show N more" shape
  as the Library.
- One row for search + the two selects + `Rusty only`; `Find more` on each row becomes text;
  `Drill it` stays the box.
- Tests: with the seed's fortnight of practice the first render has fewer than 60 interactive
  elements (today: 478); `Show all` reaches every concept; the rusty filter is on by default
  when a rusty concept exists and off when none does.

### A6 — Settings (`SettingsScreen.ts`)

- R2 density: a row is label + control on one line, ≤ 56 px; help text under the label in the
  muted size only where the decisions document or `04` §7 says the label cannot carry it. At
  least eight settings on the first screenful at 360 × 780.
- Rename the two labels that wrap their select: `Default mode, with MIDI or mic` and `Default
  mode, no input`.
- Content chips print track titles from `curriculum.tracks`, not ids.
- `Refresh the numbers` becomes text (R3).
- Tests: count of `.settings-row` (or whatever the row class is) whose top is inside the
  viewport ≥ 8; no row taller than 56 px unless it carries help text; every chip's text matches
  a track title.

### A7 — Score folder, Microphone, Chord chart, Progress (R4 and R1)

- **Folder** (`FolderScreen.ts`): one state line + the button at the top; the four-line
  explanation into a `<details>` under the button; with no folder picked, do not draw the browse
  block at all.
- **Microphone** (`MicScreen.ts` ~line 173): never print `Not connected (not connected)` — when
  `state.detail` repeats the state, print the state alone. `Disconnect` is drawn only while
  connected. The line-input checkbox gets its label beside it.
- **Chord chart** (`ChordChartScreen.ts` ~line 276): with no chord symbols, draw the sentence
  and one button `Open on the Score screen` (navigates to `#/score/<id>`), and nothing else —
  no grid, no transport, no toggles.
- **Progress** (`ProgressScreen.ts`): heading `Minutes a day, last 13 weeks`; a one-line key
  under the grid using the five `data-level` colours: `0 · <10 · <25 · <45 · 45+ min`.
- **Run summary** (`ScoreScreen.ts` ~line 813): becomes a bottom sheet over the score (the
  `summary-sheet` class exists; make it one), and statistics with nothing behind them are not
  printed — `Timing` and `Wrong notes` are omitted when the run recorded no hits.
- Tests: chart with `song.folk.hot-cross-buns` (or whichever the tour uses for `65-chart-no-
  chords`) has exactly one button; mic screen disconnected has no `#mic-disconnect`; folder
  empty has no `#folder-search`; the summary after a run with no input has no `dt` reading
  `Timing`.

### A8 — Drills (`DrillScreen.ts`)

- `promptText` (~line 527): a sentence for every kind. `five-finger`: `Listen, then play the
  five notes back with the left hand` (hand from `params.hands`); `arpeggio`: `Play the
  arpeggio — <label>`; `placement`: whatever the placement drill actually asks (read
  `fromCatalog.ts` ~line 534 and say). The `default` branch goes; an unknown kind is a type
  error, not a label.
- Tips: collapsed during a set, open on the result.
- Unit test: for every `drill.kind` present in `public/content/catalog.json`, `promptText` is
  non-empty and is not equal to the item's `title` or to any generated `label`.

---

## §B — The score screen

### B1 — The bar and the menu (`04` §5, never built)

The bar (`ScoreScreen.ts` ~lines 231–410) holds, in this order and nothing else:
`⏮` · `▶/⏸` · mode select · `R L Both` · the tempo label (tap opens a small sheet with the slider
and the bpm field — the `promptForBpm` prompt goes) · `⋯`. `← Back` moves to the top-left with
the title beside it (`.score-status` becomes title + waiting line, left-aligned; sideways this
also ends the title overlapping bar 1).

`⋯` opens a sheet with every remaining control, each with its word: `Input` (select), `Section`
(select, only when the piece has sections) and `Loop`, `Metronome` (toggle), `Bars in window
− 2 +`, `Size − +`, `Layout Window | Scroll` (segmented, a state not a verb), `Keys` (toggle),
`Sound Phone | Piano`, `Blind`, `Perform`. Keep every existing element id — the e2e suite and the
tour use them — and keep `showBar()`/`CONTROL_BAR_HIDE_MS`.

Auto-hide obeys decision 5: the bar hides itself only when its box overlaps the notation's
engraved box. Measure once per fit (the renderer knows the engraved size and the screen writes
`--score-bar-h`), never per frame.

Sideways on the phone the bar is one row; upright, one row; on the tablet, one row. The tour's
`clipped` check must stay clean.

### B2 — Blind mode hides the score

`.score-buffer.is-front { visibility: visible }` defeats `.score-stage--blind { visibility:
hidden }` (`style.css` ~649 and ~2001). Add `.score-stage--blind .score-buffer { visibility:
hidden }` and an e2e test on `#/score/<id>?blind=1` that the stage's SVG is not visible during
a run while the keyboard strip is, and that the run still scores (the existing comparability
promise in `ScoreScreen.ts` ~line 101).

### B3 — Tests

- `tests/e2e/score.spec.ts`: the bar has ≤ 8 children upright and sideways; every control that
  left the bar is reachable through `#score-more` (or whatever you name it) and still does what
  it did (bars up/down, zoom, layout, strip, destination, metronome, section select);
  `#score-back` is in the top 60 px.
- Reshoot `20`–`35` in all four form factors and put the before/after of `20-score` and
  `31-score-sections` (portrait) in your report.

---

## §C — The clock

Decision 9 in the decisions document; `docs/prompts/known-problems.md` §1 for what was tried
and is *not* the answer.

### C1 — Pause when hidden

In `ScoreSession` (or the screen — your call, say which): on `document.visibilitychange` →
`hidden`, a running Tempo or Listen run calls `engine.pause()` and records the wall time. On
`visible`, the status line reads `Paused — you were away 40 s` with `Resume` and `Restart`
(reuse `score-play` for resume). Wait and Free need nothing — they have no timetable — but must
not break. The session's recorded minutes exclude the paused span; `PracticeEngine.elapsedMs`
already subtracts `pausedTotalMs`, so check the place minutes are *saved* uses it.

### C2 — Tick from a timer

`ScoreSession.loop` (~line 337) keeps painting on frames. Add a 25 ms `setInterval` that calls
`engine.tick()` and `schedulePlayback()` while a clock-driven run is live, cleared on stop and
dispose. `tick()` is idempotent on the clock so the double call costs nothing; verify that with
a unit test that ticks twice at the same time and sees one `tempoTick`.

Add one sentence to `docs/01-architecture.md` §6 next to "never `setTimeout`": the rule is about
scheduling *audio*; the engine's tick is not audio and may run from a timer. Add a paragraph
"When the page is hidden" to `docs/05-score-follow-engine.md` §3 describing C1.

### C3 — Prove it the hard way

`verifying.md` §3: a fix for something that fails under load is shown under load.

```
cd app && CI=1 npx playwright test > /tmp/full1.log 2>&1; echo EXIT=$?; tail -20 /tmp/full1.log
```

three times. The report contains the three `EXIT=` lines and the three summary lines, and
`engine.spec.ts` appears in none of the flaky lists. If it still flakes, say so and stop —
"flaky, not fixed" is a legitimate report and a wrong mechanism is not.

Unit tests: hidden → `paused` event with the reason; visible → `resumed` with the away
milliseconds; a run saved after a pause records elapsed minus paused.

---

## §D — The tour proves its pictures

Thirteen of the tour's 328 pictures are pixel-identical to another scene with a different
caption (`ux-decisions` §3). Fix the machine so it cannot happen quietly.

- **D1 — Predicates.** `scene()` in `tests/tour/tour.spec.ts` takes a fourth argument: a
  selector (or a `(page) => Promise<boolean>`) that must hold before the shot. A scene whose
  predicate fails is a **gap** — recorded, not photographed. Give every scene one. The ones the
  decisions document names: `23-score-wrong` → `.is-wrong` present (and play a note the strip
  can show — C3 is outside *Suo Gân*'s range; use one inside it); `29-score-blind` → the SVG
  not visible; `05-plan-tracks` → the tracks sheet open; `78-progress-heatmap` → a
  `data-level` above 0 in view; `02-today-controls` → `#today-start` in view, and on a tablet
  where nothing scrolls, drop the scene rather than shoot a duplicate.
- **D2 — Identical pictures are a finding.** After the run, hash every PNG; any two scenes in
  one form factor with the same hash are printed under `identical:` with the gaps. Zero
  expected after D1.
- **D3 — The rules as checks**, in `tests/tour/audit.ts`, reported per scene like the seven
  that exist: R1 — on a list screen (Today, Plan, Library, Skills, Folder, a lesson) the first
  `.list-row` top is inside the viewport upright; R2 — `.list-row` heights ≤ 96 px and settings
  rows ≤ 56 px; R3 — at most one `.button--primary` per screen; R4 — a screen whose status
  line begins with "No " or contains "has no " shows at most one button. Report, do not fail,
  as today.
- **D4 — Single-glyph buttons.** A button whose text is one character or an emoji and has no
  `aria-label` is a finding; one that has an `aria-label` is listed so a reviewer can decide
  whether the word should be visible.
- **D5 — Only what changed.** `shots.json` stores each scene's hash; the next run marks each
  scene `changed`/`same` against the previous file, and `index.html` gets a filter. The README
  line in `docs/prompts/known-problems.md` §5 ("reshoot before believing") points at it.

Run the full tour once at the end, after §A–§C, and put the gap list, the identical list and the
audit totals per form factor in the report. Spot-check by eye the scenes the decisions document
§2 names (`20`, `31`, `35`, `29`, `40-drill-five-finger`, `62`, `53`, `12`, `06`, `03`, `01`)
and say in one line each what you saw — not what you expected.

---

## What to leave alone

- Bars in the window, upright and sideways, `keyboardStrip`, `showNoteNames`: the owner's, via
  P20 step 9.
- The stand screens' size (Score, PDF, Paper, Drill, Metronome): R2 says large, and they are.
- The engine's scoring, the renderer's double buffer, the fit search: none of this touches
  them. If §B1's auto-hide rule needs the engraved size, read it from the renderer; do not
  refit.
- `docs/prompts/design-brief.md`: add one line at the top pointing at the decisions document;
  do not rewrite it.

## Report

**Done** (per section, each with its command and output) · **Not done / blocked** · **Follow-ups**
· **Questions for the owner** (at least: whether `Review a skill` / `How to practise` should
come back to Today as text) · **Files touched**. Before/after pictures for `20-score`,
`31-score-sections`, `01-today-empty`, `03-plan`, `06-library`, `12-lesson` (portrait) attached
or pathed. The three full-suite `EXIT=` lines from §C3 verbatim.
