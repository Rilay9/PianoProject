# P21d — Sideways on the phone, and what round two left

## Common header (unchanged, applies to everything below)

Work on the branch `claude/piano-teaching-app-bo19td`. Commit early and often, conventional
commit messages. **Never name an AI model in a commit message, a comment, a doc or code — and
that includes a `Co-Authored-By` trailer.** Verify by commands you actually ran and paste the
exact output; `docs/prompts/verifying.md` is the concrete version of that rule. Keep scope;
anything you notice and do not do goes under **Follow-ups**. Report as **Done · Not
done/blocked · Follow-ups · Questions for the owner · Files touched**.

## What this is

The second tour, run on `bbedf84` (P21b complete) at 22:38 on 2026-09-07, then read by a
person: every landscape scene, and every portrait scene P21b touched. Run **after P21c**, which
owns the score screen until it lands; §A6 below is the one item that touches it, and it goes
last.

**What is right and must not regress.** Everything P21b set out to do is done and looks it: the
ink margin (`34`), the Controls sheet's toggles (`31`), the tablet's empty side panel gone
(`tablet-landscape/20`), the summary as a sheet over the score (`35`), drill prompts clear of
the keyboard sideways (`40-drill-transposition`, `40-drill-rhythm`), tips closed during a set,
badges on their own line, Skills opening on `12 of 266 · stage 0`, one filled box per screen,
the shelf and folder starting on their subject, the chart's sentence before its button, settings
rows at 87–99 px, and paper practice telling the truth about its metronome (`74`). 0 gaps, 0
identical pictures. Keep all of it.

**Answers to the two questions in the P21b report.** A row keeps both its subtitle and its
badge; the rule is *a row is at most three lines* — title, one detail line, one line of badges
or actions — and that is what fixes the folder row (§B1). A settings row with a hint is
budgeted at **100 px**; the arithmetic in `docs/decisions/2026-09-07-settings-row-budget.md`
is right and `04` §0 R2 keeps both numbers.

---

## §A — Sideways on the phone: the header is one line

The owner: *"the landscape on phone I feel like could be way better use of the space."* He is
right, and it is one rule applied everywhere. A phone held sideways is 780 × 360. Every screen
spends its first 40 % on a header that carries nothing the side nav does not already say:

| Scene | Rows before the content | What is in them |
|---|---|---|
| `01` Today | 3 (title · week line · length chips) | the title; 1½ cards fit under it |
| `03` Plan | 3 (title · track chips · links) | the title |
| `06` Library | 3 (title · search · filter row) | the title |
| `50` Skills, `70` Shelf, `80` Folder, `51` Metronome | 2 (← Back · title), inside a 610 px card with dead margins either side | the title, a back link and 170 px of empty margin |
| `12` Lesson, `40-*` Drills | 2 (← Back · h1) | the lesson or drill name, at h1 size |
| `20` Score | header 40 + bar 48 + keys 72 = 160 of 360 | the title and Back on a row of their own while the bar's left third is empty |

**The rule (`04` §0, a new R5):** *sideways on a phone, the header is one line of 40 px.* The
side nav already says which tab this is, so a tab screen's `h1` goes and its first row is the
row that had the controls: `0 / 150 min this week · 0 days` with the four length chips
right-aligned (Today); the track chips with `Placement test · Review a skill · How to practise`
right-aligned (Plan); search with `Filter · Only mine · 1533 of 1533` on the same line
(Library); the section heading (Settings, Progress). A sub-screen's `← Back` and its title share
one line at body size, the way the score screen's already do. Sub-screen cards are full width
sideways: the 610 px centred card is a portrait shape on a landscape screen.

**A1 — Tab screens** (`TodayScreen`, `PlanScreen`, `LibraryScreen`, `ProgressScreen`,
`SettingsScreen`): under `@media (orientation: landscape) and (max-height: 500px)` the `h1` is
hidden and the header's control row becomes the first row, laid out as one flex line.

**A2 — Sub-screens** (`screenFrame`/`subScreen`, so it is one change): the card's `max-width`
lifts sideways and `← Back` sits on the title line. Lifting the width is not enough on its own:
the content inside is one left-aligned column, so the right half stays empty (`51` Metronome
is the clearest — `80 bpm` and three buttons on the left, nothing on the right; `53` Mic, `52`
MIDI and `54` Diagnostics are the same shape). Sideways, a sub-screen with more than one
`section.block` lays its blocks out in two columns: the metronome's tempo on the left with its
beat pattern and sound on the right; the microphone's connection on the left with its level
meter and calibration on the right; diagnostics' devices on the left with the latency test and
the report on the right. A screen with one block (the chart, paper practice) stays one column
at full width.

**A3 — Rows in two columns where they are uniform.** A Today card, a Plan lesson row and a
Library row are 1,650 px wide for three lines of text (`01`, `03`, `06`). Sideways on a phone,
`.list` becomes a two-column grid *for lists whose rows are all the same shape* — Today, Plan
lessons, Library, Folder, Settings. **Not** Skills: its rows nest drill rows of varying height
and the tablet's two columns already leave 330 px voids beside them (`tablet-portrait/50`,
`tablet-landscape/50`); Skills goes back to one column on the tablet as well, at the card's full
width. A grid whose cells are not the same height is worse than a list.

**A4 — Drills sideways**: the `h1` becomes the one-line header with Back; the prompt and its
buttons already sit beside each other (`40-drill-transposition`), so the freed 60 px go to the
stage.

**A5 — Lesson sideways** (`12`): the same header line; the status row (`in progress · I already
know this · Quick check · Mark done`) is already one line.

**A6 — The score screen: the music gets everything that is not needed while playing.** After
P21c has landed, and only then. This is the screen the app exists for, and sideways it gives
the music 194 of 360 px and inks 57 % of that. Four things are competing with it, and the
test for each is *do you need it while your hands are on the keys?*

| Now | px | Needed while playing? | After |
|---|---|---|---|
| Header: `← Back`, title, status line | 40 | No | Gone. `← Back` and the title move to the bar's left end (its left third is empty, `20`); the status line (`Waiting for D4`, `Paused — you were away 40 s`) takes the title's place while it has something to say. |
| Control bar | 48 | Once per run at most | Reserved only while it is showing. During a run it already hides itself (`CONTROL_BAR_HIDE_MS`); now the stage **takes its row** when it hides, and a tap brings it back as an overlay over the bottom of the sheet for 3 s. Overlapping the music is acceptable at that moment because he asked for the bar; decision 5's rule was about overlap while playing. Refit on hide once per run, not per tap: fit the sheet to the bar-hidden height when the run starts and leave it. |
| Keyboard strip | 72 | Feedback only, with a piano connected | 56 px sideways (the keys are as wide as before; height is the scarce thing). And a second form: a **ribbon** — 28 px, the piece's range as a thin band with the expected key as a blue tick under its name (`F♯4`), played keys green, wrong red. It is the same information as the strip at a third of the height, and it names the note, which is the thing the F♯4 evening was missing. It is a matter of his taste which he wants, so `keyboardStrip` becomes `keys: 'strip' \| 'ribbon' \| 'off'` (default `strip`), the ⋯ sheet's `Keys` becomes that three-way, and the tour shoots `20` in all three so he can choose by looking. |
| Inside the engraving | ~45 | No | The tempo mark `♩ = 96` is drawn above the first system and the bar already says `67 bpm`: `drawMetronomeMarks: false`. OSMD's own page margins (`PageTopMargin`, `PageBottomMargin`, `PageLeftMargin`, `PageRightMargin`, `SystemLeftMargin`) are set to 0 and the 6 px ink inset from P21b is the only margin. Measure the ink before and after and put both numbers in the report. |

Net, sideways on the phone: the stage goes from 194 px to about **300 px** with the strip, or
**330 px** with the ribbon — half as much music again before the notation size changes. Upright
the same rules apply and the gain is smaller, because the header there also carries the
waiting line; keep the waiting line above the stage upright, as `style.css` explains.

**The tablet: the window fills the height.** `tablet-landscape/20` draws four bars on two
systems and leaves the lower half of the stage empty, because the fit is width-limited there
(a system already spans the width at the engraver's zoom cap) and four bars is a fixed number
from `04` §7a. Replace the fixed number with a rule: *the window holds as many bars as fill the
stage's height at the width-limited size*. With P21c's slots that is three slots of two bars
on a 10-inch tablet sideways, two slots of two bars upright on the phone, and the slide
sideways on the phone. `barsPerWindowFor` keeps its promise that a number he has set wins; the
rule is the default under it, and `04` §7a says so.

**What not to do.** Do not shrink the notation to fit more bars; the size is the largest the
fit allows and that stays. Do not overlay the bar while a run is going and the bar has not been
asked for. Do not remove the strip by default: it is the beginner's feedback and the ribbon is
offered beside it, not instead of it.

Reshoot `20`–`33` sideways and upright, plus `20` in the three `keys` states; the audit adds
a line per score scene giving the stage's height as a share of the viewport and the ink's
share of the stage, so the numbers in this section are checked rather than believed.

Tests: an e2e at 780 × 360 for each of Today, Plan, Library, Skills, Shelf, a lesson and a
drill asserting the first content element's top is within 48 px of the viewport top and that
no `h1` is visible; the audit gets the same check as R5, reported per scene like the others.

## §B — Leftovers

**B1 — Folder rows are 121 px** (`80`, all form factors; the audit's one R2 line). Title,
composer, meta and badges are four lines. The composer joins the detail line: `Composer 0 ·
16 bars`. Three lines, under 96.

**B2 — `Edit Remove` on a shelf piece reads as one word** (`70`). Remove belongs in the sheet
Edit opens; the row keeps `Practise` and `Edit`. Same for a book's `Edit · Remove`.

**B3 — Detail lines truncate mid-token** (`70`: `page 14 · ≈…`; `50` sideways: `1 t…`). Drop
whole ` · `-separated tokens from the end until it fits, then ellipsis nothing. A one-line
helper in `widgets.ts` and a unit test.

**B4 — The audit counts the Back link as a button** (`65`, R4 "offers 2 buttons" on a screen
with one). Exclude `a` elements and the back link from the R4 count.

**B5 — Settings sideways** (`08`): five rows visible of forty. With A3's two columns it is ten;
the section headings span both columns.

## §D — The PDF viewer: the same rule, on paper

`66` and `67`, both orientations. The viewer does the one thing it promised — one system, full
width — and then stops using the screen. Upright: two rows of chips, a 170 px system, its
successor dimmed, and **1,000 px of black** before `bpm · bars/system · Adjust cuts` at the
bottom. Sideways: three rows of chrome (toolbar, bpm row, page row in adjust mode) before the
page, whose second system is off the bottom. `04` §5b already says *the height left over
belongs to the layout, not to black*; nothing was done with it.

**D1 — Fill the height with what comes next.** A letter-page system fitted to a phone's width is
about 170 px tall, so upright there is room for three or four. Draw the current system bright
at the top and **as many following systems as fit, dimmed** — not "the next one if it fits".
Advancing moves the column up one system (the current one leaves, the dimmed ones step up,
one more arrives at the bottom). Same slide as P21c A2, vertical: the eye always has two systems
of read-ahead and the music never moves mid-system. The last system of the piece leaves the
space below it empty rather than repeating.

**D2 — One row of chrome.** Sideways and upright: `← · ◀ ▶ · Tap Timed Loop · 🥁 ·
Page 1 · system 1/2` on one line (drop the parentheses). `bpm` and `bars/system` matter only in
Timed and open from the `Timed` chip as a small sheet; `Adjust cuts` is a once-per-import action
and becomes text at the right end of the row (R3). In adjust mode the `◀ Page · Page 1 of 1 ·
2 systems · Page ▶` line is one line too, and the thumbnail starts within 48 px of it.

**D3 — Timed learns from your taps.** `bars × 4 × 60 / bpm` assumes 4/4 and a bars-per-system
he has to count. Simpler and truer: when he switches to Timed, the interval is **the time
between his last two manual advances** (the way tap-tempo works), shown as `every 9.6 s ·
change`; the bpm × bars sheet is the fallback when there have been no taps yet. Say so in `04`
§5b.

**D4 — Dark paper.** The score screen and the drills draw white notation on the dark theme; the
PDF is a white page on a dark stand, the brightest thing in the room. Invert the rendered page
under the dark theme (`filter: invert(1) hue-rotate(180deg)` on the canvas, and the same on the
adjust-mode thumbnail), with a `Paper` toggle in the ⋯/Timed sheet for a scan that inverts
badly. Default inverted, because it is what every other music screen in the app does.

**D5 — Say once that PDFs read best sideways.** Fitted to 360 px a letter page's system is
59 % of print size; fitted to 780 px it is 127 %. The first time a PDF opens upright, the
status line says `Turn the phone sideways for a bigger page` and never again (a settings
flag, like the other one-time hints).

Tests: an e2e upright at 360 × 780 on `two-systems.pdf` asserting two systems are drawn (one
bright, one dimmed) and the chrome is one row; sideways the same; Timed after two manual
advances 3 s apart advances 3 s later without a bpm being set; the inverted canvas has the
`filter` under `prefers-color-scheme: dark`. Reshoot `66` and `67` both ways.

## §C — Prove

`npm run lint`, `npm run test`, `CI=1 npx playwright test` from `app/`, each to a file, last
line and `EXIT=` pasted. `npm run tour` once at the end: zero gaps, zero identical, R2 and R4
empty, R5 empty. Before/after, **sideways**: `01`, `03`, `06`, `12`, `50`, `70`, `80`,
`40-drill-transposition`, `66`, and `20` if A6 was done; upright `66` and `67`. One line each
on what you see.
