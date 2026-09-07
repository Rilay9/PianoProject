# Reviewing the look of it by looking at it

2026-09-07. The owner sent two photographs of his phone and said *"I think they can look a
little better."* He was right, and there was no way for either of us to check the other eighty
screens without him opening every one of them on the S25 and telling me what he saw.

So: **a tour**. `npm run tour` drives the app with a spoofed piano through every screen and
every state worth looking at, on a Galaxy S25 in both orientations, and writes
`build/tour/index.html` — portrait beside landscape, with a box to type into under each pair
and a button that collects the notes into text he can send back.

## What it is not

It is not a test. `app/playwright.tour.config.ts` is a separate config precisely so that
`npm run e2e` and CI never touch it: a screenshot review that can fail the build is a build that
fails on a font hint, and the pixel baselines this replaces did exactly that (P19 §A, and the
three `*-linux.png` files deleted with it).

It asserts one thing only — that the screen it is about to photograph actually arrived. A
photograph of a blank screen is worse than no photograph, because it looks like an answer. A
scene that cannot be reached is recorded as a **gap** and printed at the end rather than failing
the run: one broken screen should not cost the other seventy.

## What "comprehensive" turned out to mean

Seventy-odd scenes, in four groups:

- **A phone out of the box** — every tab on a profile with nothing in it, because that is what a
  first launch looks like and it is the state nobody ever reviews.
- **Every feature**: the score screen in all four modes, blind, performance, sections, looping,
  the bar hidden mid-run, the strip off, one bar and four; **all twenty-three drill kinds**, one
  real id each, drawn out of `catalog.json` rather than guessed; the chart with chords and
  without; the PDF viewer and its system adjustment; imports, the assign sheet, item details, a
  placeholder row.
- **The same app, used** — `tests/tour/seed.ts` puts a fortnight of practice, a book with two
  pieces, an import, a PDF and all 37,261 folder rows behind it, then shoots Today, Progress, the
  shelf, paper practice and the folder again. Half of what a screen looks like is what is in it.
- **Edge states** — a locked rung with strict prerequisites on, and a link to nothing.

The seeds go through the app's own hooks where they exist (`__pianopath.recordRun`), through the
store where the UI cannot reach (37,261 rows), and **through the UI where the app mints its own
ids** — the shelf, whose piece ids are generated inside it. Guessing at those from outside is
how a seed rots six weeks later.

## The other half: the questions that are his to answer

`npm run choices` shoots the same screen several ways and writes `build/tour/choices.html` as
A/B/C with radio buttons. Four questions that are matters of taste about his reading, not facts
about the code: how much music in the window sideways, how much upright, the on-screen keys on
or off, and whether the app should name the note it is waiting for. Guessing at these wastes his
time twice — once when I guess wrong and once when he has to say so.

`npm run review` does both and opens the two pages.

## Disposable on purpose

Three files and three scripts. The owner said the non-calibration scripts can be removed once
the look has settled; deleting them is deleting `app/tests/tour/`,
`app/playwright.tour.config.ts`, `app/scripts/open-tour.mjs` and four lines of `package.json`.
Nothing in `app/src` depends on any of it.

## What the first full tour showed, and what was done about it

**The message line was sitting on the music.** Upright, the sheet fills the width, and
`.score-status` — the app's own line, top right — printed *Suo Gan - Welsh Traditional Lullaby*
across the first bar and its chord symbol, wrapped onto two lines to do it. It is now one line
cut with an ellipsis, and upright the stage starts below it. Sideways it is left alone: the sheet
is far narrower than the screen there, the corner is empty, and height is the scarce thing.

**The sheet was never grown, only shrunk.** `WindowRenderer.fit` applied its scale only when it
was below 1, so a sheet smaller than the stage was left small with the rest of the screen black.
It now scales either way. Because it takes the smaller of the two axis ratios, filling one axis
still cannot overflow the other.

## Landscape: measured, and not guessed at

Sideways, a two-bar window uses about 40% of the width. The numbers, from the tour's own probe on
a 780 × 197 stage: OSMD drew the SVG 778 px wide — the whole screen — but put the two bars on
**two systems**, each inking 316 px of it, and the fit then scaled the whole sheet by 0.42 to
make the height fit. So the width is lost inside the engraving, not in the fitting.

Three attempts to make the engraver fill that width, each measured and each reverted:

| Tried | Result |
|---|---|
| `StretchLastSystemLine = true` | No change. Nothing was stretched, so there was never a short last line to stretch. |
| `RenderXMeasuresPerLineAkaSystem = <bars>` | No change. It only forces *extra* breaks; it cannot merge two systems that OSMD has already decided to split. |
| `CompactMode = false`, `LastSystemMaxScalingFactor = 8` | No change, and the first was slightly worse. |

What does fill the width is **one bar in the window**: a single system is drawn the full width of
the page, and the screenshot of it is far and away the best landscape picture of the four. That
is not a change to make from here, though — one bar means no read-ahead at all, which is a real
cost to a reader and a matter of his taste, not of correctness. It is question 1 on
`build/tour/choices.html` with the pictures beside it, and the recommendation now has a
measurement behind it rather than an opinion.

## Two flakes, fixed at the cause rather than retried away

`CI=1 npx playwright test` came back green with two flaky tests. Both turned out to be hiding
something worth having.

**The PDF viewer, stuck on "Loading…".** The failure's own snapshot is the diagnosis: the page
showed nothing but a heading reading *Loading…*, beside a `SyntaxError: Unexpected end of JSON
input`. `mountLazyScreen` did `void load().then(…)` with no rejection handler, so a chunk or a
content file that came back truncated left that card up for ever — no message, no way out, and an
unhandled rejection nobody sees on a phone with no console. A dropped connection on the way to a
lesson is enough to cause it. It now says what happened and offers **Try again**, and the failure
is recorded where Diagnostics can see it.

The other half is `curriculum/load.ts`. `response.json()` on a truncated body throws a bare
`SyntaxError` naming neither the file nor the reason; it reads the text and parses it itself, so
the message says which file and how many bytes arrived. And it reads a second time before giving
up — which is what the comment beside `loadCatalog` has claimed since P7 ("a failure here is
almost always a first launch that lost the network mid-precache, and it is fixed by trying
again") without anything ever trying again.

**The window-swap budget, measuring the wrong thing.** One sample came back at 21.1 ms against a
16.7 ms budget. The interesting part is not the 21.1 — it is what was being timed. `timeShowStep`
wraps the whole of `showStep`, which also runs `positionBand` and forces a layout, so the number
asserted was never the one `01` §6 budgets. Worse, it could not tell a fast swap from a call that
swapped nothing at all: `tempo-change` has three bars, so at one bar to a window there were two
swaps in the whole piece, and a fixture with two bars would have given one.

The test now walks Hanon No. 1 — twenty-nine bars — and reads the renderer's own `window.swap`
samples, which are recorded only when a prepared buffer is actually brought forward. It requires
at least eight of them, so a double buffer that quietly stopped pre-rendering fails the test
instead of passing it. Nineteen samples, **median 0.40 ms** under a ×4 throttle, against the
unchanged 16.7 ms budget.

## Two more the screenshots found

**The drill result was cut off.** Every statistic went into one `dl.kv`, which is a flex row built
for a single term and value — so *Accuracy*, *Answered* and *Mean reaction* were laid side by side
and the last was sliced off at the edge of a 360 px screen. A two-column grid, one statistic to a
line.

**And in landscape it was not on the screen at all.** The sheet is appended to the bottom of a
body with a keyboard under it, so the whole result — score, advice, and both buttons — landed
below the fold with nothing to say it was there. The set ended and the screen looked unchanged.
It scrolls itself into view now.
