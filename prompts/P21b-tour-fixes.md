# P21b — What the tour showed, round one

## Common header (unchanged, applies to everything below)

Work on the branch `claude/piano-teaching-app-bo19td`. Commit early and often, conventional
commit messages. **Never name an AI model in a commit message, a comment, a doc or code — and
that includes a `Co-Authored-By` trailer.** Verify by commands you actually ran and paste the
exact output — do not claim something works because it should; `docs/prompts/verifying.md` is
the concrete version of that rule. Keep scope; anything you notice and do not do goes under
**Follow-ups**. Report as **Done · Not done/blocked · Follow-ups · Questions for the owner ·
Files touched**.

## What this is

The tour was run on commit `b4c47ed` (plus the then-uncommitted `style.css` edit) at 20:12 on
2026-09-07: 325 pictures, 0 gaps, 0 identical, the seven mechanical checks clean. Then a person
read about forty-five of the pictures. This is what the person found, ordered by how much it
matters, each with the scene it is in so you can look before you touch. When a fix is done,
reshoot that scene and look at it; the whole tour once at the end.

**What is right and must not regress:** Today, Plan, Library and the lesson page (`01`, `03`,
`06`, `12`) are now exactly what `04` §0 asks for. Blind mode hides the score (`29`), a wrong
note goes red on the strip (`23`, `27`), the library item sheet is a two-column grid (`62`), the
microphone screen no longer contradicts itself (`53`), the chart with no chords draws one button
(`65`), the score bar is one row everywhere and the Controls sheet reads as a settings page
(`31`, `36`). The drill screen sideways puts the buttons beside the prompt instead of behind the
keys (`40-drill-five-finger`, `40-drill-note-flash`). Do not undo any of it while fixing the
rest.

---

## A. The score screen

**A1 — The ink-fit leaves no margin.** `20` in portrait, landscape and tablet-landscape, and
`34`: the final barline of the window sits on the stage's border, and on a grand staff (`34`)
the brace at the left edge is cut in half. It reads as clipped even where it is not. Inset the
fitted ink by 6 px on each side (scale to `stageWidth − 12`), and finish the brace fix that was
in flight. Add to the tour's audit: the ink box of `#score-stage svg` is at least 4 px inside
the stage on the left and right in every score scene.

**A2 — The Controls sheet's toggles do not agree with each other** (`31`, `36`): Loop says
`Off`, Metronome says `Off`, Keys says `On` and is highlighted, Blind says `Blind`, Perform says
`Perform`. One convention: every toggle reads `On` or `Off`, and `On` is the highlighted
state — Blind and Performance included, since they are states of the run even though they are
routes. Section and Input are selects and stay as they are.

**A3 — The tablet side panel is open and empty** (`tablet-landscape/20`): *Suo Gân* has no
lesson text, and "Lesson notes" still takes a quarter of the width to show nothing (R4). Do
not build the panel when there is nothing to put in it; the stage takes the width.

**A4 — The run summary is a full black page** (`35`, both orientations): a heading, three
lines and five buttons in the top third, nothing below. Decision 5 in
`docs/decisions/2026-09-07-ux-decisions.md` §2 says a bottom sheet over the score, so "Loop
the weak bars" can be chosen while looking at the bars. Do that; the `summary-sheet` class
exists.

## B. Drills

**B1 — Sideways, the prompt is under the keyboard.** `landscape/40-drill-transposition`: only
the top half of the four-bar prompt is visible, the rest behind the keys. `landscape/40-drill-
rhythm`: the `▼ Tips` line is cut through the middle. The keyboard is fixed at the bottom; the
column above it must either fit or scroll, and a prompt card must never be laid out into the
keyboard's box. Add to the audit: in every drill scene, no element inside `.drill-stage`,
`#drill-prompt` or `#drill-tips` (or whatever the ids are) intersects the strip's bounding box.

**B2 — Tips are open during a set** (`40-drill-ear-interval` upright, `40-drill-rhythm`
sideways). `docs/decisions/2026-09-07-ux-decisions.md` §2: collapsed during a set, open on the
result. The result screen (`41`) already shows them; the set should not.

**B3 — `End drill` wraps onto its own line** (`40-drill-ear-interval` upright): `Skip` fits
beside the two boxes and `End drill` does not, so it drops. Keep `Skip · End drill` as one text
group that wraps together.

## C. Lists

**C1 — The badge eats the detail line.** `70` (shelf): `page 14 · ≈…` and `p..` beside a
`no rung` badge. `50` (skills): `Stage 0 · core · 0 to …` beside `never`. `listRow` puts the
badges on the meta line and truncates the meta first, so the line that carries the information
is the one that is cut. Badges go on their own line under the meta, always; check the row stays
under the 96 px budget (a two-line row plus a badge line is about 88 px at this type size).

**C2 — Skills on a tablet is a broken grid** (`tablet-portrait/50`, `tablet-landscape/50`):
the drill rows nested under a concept, and the `Show all 32` link, are laid out as grid cells
beside the concept cards, so "The placement test" becomes one cell 211 px tall and the link
appears mid-grid. Nest the drill rows and the link *inside* the concept card; the grid places
cards only. This is what the audit's ten R2 findings on the tablet are.

**C3 — Skills still opens on all 266** (`50`, every form factor). Decision 6b: open on the
rusty ones if there are any, otherwise the current stage and the one below, with `Show all
266` as text underneath rendering the rest in pages of fifty. The count line says what it is
showing (`12 rusty of 266`).

**C4 — A list of filled buttons** (the audit's R3 line, 8 scenes): `Drill it` ×24 on Skills,
`Add` ×60 on the folder, `Practise` on every shelf piece, `Calibrate` beside `Connect
microphone`, `Copy debug report` beside the latency test, `Report clean` beside `Start` on
paper practice. R3: one filled box per screen. Per-row actions are outlined; the screen's one
filled box is the thing you came for (`Pick the folder`, `Connect microphone`, `Start`).

**C5 — The shelf explains itself above the books** (`70`): four lines of prose and `Add a
book` before the first book, the same shape the folder had. One line and a `<details>`, the
way `80` does it now; `Add a book` stays, as the one filled box.

**C6 — The folder's list starts at 600 px** (`80`, upright): state line, `Pick the folder
again`, `Forget this folder`, `How this works`, `Title or composer`, `Any style`, a year range,
a rating box, a count, and *then* the first score. R1. Search and the style select share one
line; the year range and the rating go behind a `Filter` chip as the Library's do; `Forget this
folder` becomes text inside `How this works`. Add to the audit for `80`: the first `.list-row`
top is inside the viewport upright.

## D. Small

**D1 — Chart with no chords** (`65`): the button is above the sentence. Sentence, then the
one control.

**D2 — Settings rows with hints** (`08`, the audit's five R2 findings): `Playback destination`
is 150 px because the select drops under a two-line hint. Put the control on the label's line
and the hint under both, one line where the words allow; a row with a hint is budgeted at 80 px.

**D3 — Paper practice contradicts itself after a run** (`74`): the status line still says
*Playing. The click is running and the app is counting what it hears* after the run has ended
and the summary is up, and the summary says *Steadiness was not measured: the metronome was
off* under a ticked Metronome box. Two lies. The status must change when the run stops, and
the summary must report the metronome state the run actually used — find which of the box and
the run is wrong, and say which in the report.

---

## E. Prove

- `npm run lint`, `npm run test`, `CI=1 npx playwright test` from `app/`, each captured to a
  file first and the last line and `EXIT=` pasted (`verifying.md` §2).
- `npm run tour`, once, at the end. Zero gaps, zero identical, and the audit's R2 and R3 lines
  empty except what you list as deliberate. Paste the per-form-factor summary.
- Before/after pictures, upright unless said otherwise: `20`, `34`, `70`, `80`, `50` (tablet),
  `40-drill-transposition` (landscape), `74`. One line each on what you see — not what you
  expected.

Then stop; the next round is a person looking again.
