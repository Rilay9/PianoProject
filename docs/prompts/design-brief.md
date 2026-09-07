# Design brief — the questions the screenshots raised

*This is not a build task. Nothing here needs code written; what is needed are
**decisions**, written down where the next person can find them, so that
twenty small fixes add up to one app rather than twenty opinions.*

*Companion to the P20 prompt (the first-run setup), which is separate work and
can proceed independently. An addendum once circulated with P20 saying the
landscape width problem was an OpenSheetMusicDisplay limitation. It was not — it
was two bugs in this codebase's own fitting, and it is fixed. That addendum is
deliberately not in this repository; if a copy reaches you, ignore it.*

## Why this exists

The app now photographs itself: `npm run tour` drives every screen and state on
a Galaxy S25 and a 10-inch tablet, both ways up, and writes
`build/tour/index.html` with the four side by side. It also audits each screen
for the mechanical faults — a control off the right edge, a control nothing
scrolls to, a native input painted for the wrong theme, `(s)` where a plural
belongs, a tap target too small for a thumb.

That machinery handles anything with a right answer, and about twenty such
defects have been found and fixed this way. What it cannot do is judge. The
questions below are all of the form *"this is not broken, but is it right?"*,
and answering them one at a time as they come up is how an app ends up feeling
like it was designed by a committee of one person in twenty moods.

## What is already decided, and must be reconciled with

`docs/prompts/known-problems.md` lists what is broken and unfixed, including the three items
below that are described there in more detail: question 5 (dead space), question 6b (Skills at
266 rows) and question 9 (the clock).

Read these first. Several questions below may already be answered there, and
"the spec already says so" is the best possible answer to any of them:

- `docs/04-ui-spec.md` — the screen-by-screen spec. §7c is unusually useful: it
  says what actually shipped versus what was planned, and why each gap exists.
- `docs/00-overview.md` — the standing decisions. D17 (never a disabled card),
  D19 (one owner, one phone), D20 (offline first), D21 (three alternatives per
  rung) all bear on what follows.
- `docs/decisions/2026-09-07-the-ux-tour.md` — the measurements behind the
  layout questions, so none of them need re-deriving.

## Before answering, and before reporting

`docs/prompts/verifying.md` — short, and the reason several statements in the first draft of
this brief were wrong. Question 9 in particular was written up twice with the wrong cause.

## What is wanted back

For each question: **a decision, a sentence of reasoning, and where it should
be written down.** Not a mock-up and not code. If a rule you give resolves
several questions at once, say that — a rule is worth more than five answers.

Where the honest answer is "ask the owner", say so and give him the two
options in a sentence each; there is a page at `build/tour/choices.html` for
exactly that.

---

## 1. What earns a place above the fold

The one rule that would settle four of these. Three screens open with a block
of explanation above their content:

| Screen | Above the fold | Below it |
|---|---|---|
| Library | title, search, six filters, "Your own scores" heading, two lines of prose, three buttons | all 1,533 items |
| Score folder | title, "Where the scores are" heading, four lines of prose, two buttons | the browse list |
| A lesson page | title, status, "I already know this", "Quick check", "Mark lesson done", the needs line, "Find more", "Import for this rung", "I have this on paper", a paper hint | the exercise options |

Each block is defensible on its own. Together they mean the thing the screen is
*for* is off the bottom on a phone, every visit, for ever.

**Question:** what is the rule? Some candidates, none of them obviously right:

- The content starts at the top; explanation collapses to one line with a way
  to expand it.
- Explanation shows until the thing it explains exists, then collapses for
  good (Library's import block would vanish once anything is imported).
- Explanation moves to a "?" in the header.
- It is fine as it is, because he reads it once and then scrolls past it for
  the rest of his life.

## 2. Density: how much of one screen is one thing

Measured on the S25, 360 × 780:

- **Settings**: one row per ~100 px. Eight of about forty settings visible.
- **Today**: one card per ~370 px. Three and a half visible, and the metadata
  line ("Warm-up · 5 min · L0.1 · Hands together") wraps to two lines in every
  one of them.
- **Plan**: one lesson per ~200 px, of which about half is repetition — see 3.

**Question:** is this the intended reading distance? A phone on a music stand
is further from the eye than a phone in the hand, which argues for large; forty
settings at eight a screen argues for small. If the answer is "it depends on
the screen", say which screens are which and why.

## 3. Plan says everything three times

For each lesson, the Plan screen prints:

```
0.1 · YOUR INSTRUMENT AND YOUR BODY — CORE      ← section heading
0.1 · Your instrument and your body             ← card title
Your instrument and your body                   ← card subtitle
2 exercises · 0 songs · ~2 days
```

The same words, three times, in three type sizes. It is not a bug — each line
is doing a job in isolation — and it is a third of the screen.

**Question:** which of the three survives, and what (if anything) takes the
place of the others? The subtitle field exists and is populated with the title;
if it has no other use, it may want removing from the data rather than hiding
in the view.

## 4. What an empty state is allowed to draw

A chord chart for a piece with no chords in it currently draws: four empty bar
cells with dashes, a Count off button, a Stop button, a bpm field, and Swing /
Comp / Bass+drums toggles — all live — under the sentence *"Hot Cross Buns has
no chord symbols in it — open it on the Score screen instead."*

So it says the screen cannot work and then presents a working-looking screen,
with no way to act on its own advice.

`docs/04` §8 covers empty and edge states but does not settle this.

**Question:** what does a screen do when its subject is missing? Options: draw
nothing but the sentence and a button that does what the sentence suggests;
draw the furniture disabled; or keep it live because the toggles are still
worth having. Whichever it is, it should be a rule — the same question arises
for a PDF with one page, a drill with no items, and a shelf with no books.

## 5. Dead space, when there is nothing more to give

Upright, the Score screen's window is engraved as large as it can be and still
leaves about a third of the height empty below the second stave. That is not a
bug: the notation is at the largest size the engraver will produce for that
width, and the leftover is real.

The **PDF viewer** has the identical shape and is the reason this is a rule and
not a one-off. A system off a letter-size page is wide and short; fitted to the
width of a phone it is about 170 px tall, and the other 1,900 px are black. That
is not a defect — width-fitting *is* the largest that system can be drawn — but
two screens now have the same hole in them and they should answer it the same
way.

**Question:** what happens to it? Centre the sheet vertically so the space is
split and looks deliberate; spread the systems apart to use it; leave it at the
top; or put something in it. Bear in mind it changes with the piece and the
window size, so whatever it is has to look right at one bar and at four.

## 6. Two kinds of button, no visible rule

On a lesson page: *I already know this*, *Quick check*, *Find more* and *Import
for this rung* are outlined boxes. *Mark lesson done* and *I have this on paper*
are plain blue text. Both kinds do things, and both kinds are sometimes the
most important thing on the screen.

**Question:** what distinguishes a button from a link here? "Destructive versus
not", "primary versus secondary", "navigates versus acts" are all plausible and
they give different answers.

## 6b. Skills draws all 266 concepts at once

"Review a skill" renders every concept in the curriculum — 266 rows, **478
interactive elements**. Every other screen in the app is in double figures; the
audit found this one by an order of magnitude.

The Library holds 1,533 items without doing this, so there is a pattern in the
codebase already. It also has three filters at the top of Skills (stage, track,
"rusty only") which nobody has a reason to touch on arrival.

**Question:** what does a screen of 266 things show first? Candidates: the rusty
ones only, with the rest behind a filter; the current stage only; a search box
and nothing until it is used; or all of them, virtualised. This is really
question 1 again — what earns a place above the fold — asked of a list rather
than of a header, so an answer to one should answer the other.

## 7. The reorder arrows, and where a rare action lives

Plan's track chips carried ▲▼ reorder buttons drawn at **14 × 40 px** —
narrower than the error in a thumb, with a twin immediately beside them. The hit
area is now 44 px, which fixes the defect.

The design question underneath it is not fixed: **reordering tracks is probably
a once-a-year action, and it currently costs two buttons beside every chip on a
screen visited daily.** If a rare action can live somewhere else, that rule
would also thin out the lesson page in question 1.

## 8. A heat map with one colour

Progress draws thirteen weeks of squares under "Last three months". A day
practised is one blue; a day not practised is one grey. There is no gradient,
no scale, and no legend, so a twenty-minute day and a two-hour day are the same
square.

**Question:** is it a heat map or a calendar? If it is a heat map it wants a
scale and a key; if it is a calendar of days practised, "last three months" of
squares may be more than the fact needs, and the weekly-minutes decision
(`02` Part A §8) is arguably the thing it should be showing instead.

## 9. What a clock-driven run does when the screen is not being drawn

**This one is not a taste question and it is the most serious thing on the
page.** It is here rather than in a build prompt because the right behaviour is
a decision, and there are three defensible answers.

The tempo clock is driven by `requestAnimationFrame` — `ScoreSession.loop`
calls `engine.tick()` once a frame. A browser stops issuing animation frames
when the page is not being drawn: another app in front, the screen off, the tab
hidden. **There is no `visibilitychange` handling anywhere in the app.**

So a run in Tempo or Listen mode, interrupted by anything that takes the screen,
stops advancing. What happens on return depends on the engine's arithmetic: it
may sit still, or it may see a large elapsed time and jump several bars at once,
marking everything in between as missed.

It is mitigated in practice — `keepScreenAwake` is on by default and a phone on
a stand stays lit — which is exactly why it has not been noticed. It shows up in
the test suite instead: three Tempo tests flake because headless Chromium
starves `requestAnimationFrame` under load, and they were failing outright on a
busy machine before this was understood. Two of four runs of `engine.spec.ts`
still come back with flaky tests.

**Question:** what should a clock-driven run do when the frames stop?

- **Pause and say so.** The run stops on `visibilitychange`, and coming back
  shows "paused — you were away for 40 seconds" with a way to resume. Honest,
  and it never records a bar he did not play.
- **Catch up silently.** Advance by the elapsed time on return. Simple, and it
  marks a whole page as missed for a phone call.
- **Keep the clock off the frame loop entirely.** The metronome already
  schedules on the AudioContext (`01` §6: "never `setTimeout`"), and audio
  keeps running when frames do not. The engine could tick from the same source
  and only *paint* on a frame.

The third is the most correct and the most work. Whichever is chosen should also
say what the practice record is allowed to contain: a run that spent two minutes
in someone's pocket is not two minutes of practice.

---

## Answered already, listed so nobody re-opens them

- **Landscape score width.** Fixed: 41% → 98% of the screen. It was our fitting
  code measuring its own scaled output, not the engraver.
- **The keyboard strip's range.** Fixed in P19b: the piece's range, not 88 keys.
  Paper practice had never been given the same treatment and opened on C1 — the
  bottom two octaves of the piano, for a Czerny study. Fixed.
- **Number of bars in the window.** The owner's call, with pictures, on
  `build/tour/choices.html`. Not a design question; a taste question.
- **The tips block showing the app's own HTML source.** A missing file 404s,
  the host answers with `index.html` and a 200, and it was rendered as prose.
  Fixed and guarded.
