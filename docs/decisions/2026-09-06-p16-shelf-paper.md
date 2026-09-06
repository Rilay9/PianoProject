# The shelf, practice against paper, and blind mode

2026-09-06, P16. Implements replan §5 (all) and the two rows of §8 marked P16.

## The problem

The owner has method books and sheet music on paper, and a PDF viewer that had never been
connected to the curriculum. The app behaved as though the only music in the room was music it
held. This makes the shelf a thing the app knows about, without pretending it can read it.

## The discipline the paper screen is built on

Measure what can actually be heard, say what cannot, and never record an accuracy.

That last one is the whole design. The obvious version of this feature is a timer that lets
you tick "done", which measures nothing and slowly teaches you to distrust the app's numbers.
The honest version measures one real thing and is explicit about the hole.

**What it measures.** Notes heard, minutes, tempo, and — with the click running and MIDI
connected — *tempo steadiness*: the standard deviation of onset offset from the nearest click.
Three decisions inside that, each because the naive version would be quietly wrong:

- **A chord counts once.** Five fingers are one rhythmic event; counting five onsets would
  weight that beat five times as heavily as a melody note. The window is 60 ms.
- **An onset more than 250 ms from every click is excluded**, and the count of exclusions is
  kept. Half a beat at ♩=120 is 250 ms; beyond that "nearest click" stops being a meaningful
  reference and folding it in would report a wobble that is arithmetic rather than playing.
- **Below twelve usable onsets it reports "not measured"** rather than a confident ±4 ms drawn
  from three taps.

The standard deviation is the population one, not the sample one: this is a description of the
run that happened, not an estimate of a wider population of runs.

**What it never measures.** Accuracy. The summary's last line is fixed and tested:

> It cannot see the notes, so nothing here says whether they were the right ones. That part is
> your call.

The `sessions` row carries `accuracy: 0` because the field is not optional, and the Progress
screen therefore never prints a percentage for a paper run — a zero there would read as a
verdict rather than as an absence.

## What a self-assessed pass is allowed to finish

"Clean" writes a pass marked `selfPassed`, with the badge "I already know this" already had.
It completes a rung whose mastery rule does not demand a measurement, and does not complete one
that does — `dynamics-contrast>=1.6` is a claim about something the app measured, and accepting
"that felt fine" for it would be recording a number nobody took.

The test is syntactic — a comparison against a number in `mastery.custom` — rather than a list
of rung ids, because a list would go stale the first time a rung was added. A *measured* paper
pass (a piece with a twin, run properly on the Score screen) counts everywhere any other
measured run does.

## Blind mode is the same run with the picture off

`?blind=1` hides the engraving and changes nothing else: same model, same expectations, same
scoring, cursor and keyboard strip still live. The identity is the feature. "Blind at 90 % of
your sighted run" only means something if both were measured the same way, and a separate
"memory mode" with its own scoring would have made the comparison meaningless.

The stage is `visibility: hidden` rather than unmounted, so the renderer keeps its box and the
layout does not jump when a run starts. It is a route rather than a toggle, so a blind run
survives a reload and a rung can link to one. Rung **4.7, "Learning it from memory"** asks for
two clean sighted passes and then blind at ≥ 0.9.

## Deliberate limits

- **`paperHint` is required on 29 rungs and optional elsewhere.** Every Stage 1–5 core rung and
  every classical rung: those are the ones a method book or a graded album certainly covers.
  Nothing in a method book trains tritone substitution, and a hint on the jazz rungs would be
  filling a field rather than answering a question. `validate.py` enforces exactly that set.
- **Nothing is scanned.** No OMR, no page detection, no inference. The owner reads the page
  number off the paper in front of him, which is the one input that is certainly right.
- **A paper run is never master-eligible.** Mastery needs two measured passes on different
  days, and nothing here was measured.
- **`barsPerSystem` lives on the book**, not on the opening: it is a fact about how the book is
  engraved.

## A bug the e2e found

The Progress history printed `book.my-book/study` where a title belonged, because a book piece
is not in the catalog — the app has no copy of it — and the screen resolved titles only through
`allItems()`. Fixed by giving Progress the shelf as well.

## What could not be checked here

Both are on the owner's checklist in `OWNER-GUIDE.md` §8:

1. **Steadiness against a real HP-130 with the pedal down.** Every number in
   `steadiness.test.ts` comes from scripted onsets. A pedalled chord arriving as several
   onsets should collapse to one (60 ms window) and a rolled chord should not read as lateness;
   neither has met a real piano.
2. **Whether the self-report feels honest in use.** "Clean" writes a pass in his own name.
   Nobody can test from here whether that is a question he will answer truthfully at eleven at
   night. If he finds himself tapping Clean to make a rung go green, the fix is to stop letting
   it complete a rung — not to reword the button.

## Numbers

`books` store at DB_VERSION 5, upgrade tested from a real version-3 database · 29 paperHints ·
steadiness in 15 unit tests on scripted onsets · 1239 unit tests · 210 e2e.
