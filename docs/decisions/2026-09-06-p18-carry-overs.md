# The carry-overs: six things P6–P8 left open

2026-09-06, P18. Each of these was written up honestly as "not done" by an earlier phase and
then never picked up. None is large; together they were a session.

## What strict prerequisites look like — the decision this phase owed

The examination (§4.4) left this open on purpose: building it means deciding what a locked
lesson *looks* like, "a badge and a warning, or a genuinely disabled card".

**A badge, a one-line reason, and a confirmation. Never a disabled card.**

`00` D17 is the governing decision — *no gating by default* — and the reason behind it is the
owner himself: he reads basic notation, plays some chords, and plateaued once already after a
few lessons. An app that told him he was not allowed to look at Stage 4 would be repeating the
thing that stopped him.

So the setting is off unless he turns it on, and when it is on:

- the lesson shows `comes later` and *"Usually comes after 4.2 Flat keys and minor scales."* —
  the rung is named, so the reason is actionable rather than a shrug;
- a **Go to 4.2** button beside it;
- the option cards still open, behind one confirmation: *"4.2 Flat keys and minor scales
  usually comes first. Open this anyway?"* No "are you sure" — he is sure, he tapped it — and
  no tone of disapproval, because skipping ahead is a legitimate thing to do;
- **"I already know this"** on the prerequisite unlocks it, which is the escape he will
  actually use.

A disabled card was rejected because it is a dead end: it says no and offers nothing. The one
thing this curriculum promises is that moving on or going back is one tap.

`nextRecommended` gains one subtlety. With gating on it skips locked rungs — but if
*everything* left is locked, which happens the moment a prerequisite names a rung he has
skipped past, it recommends the first locked one rather than nothing. An empty Today is worse
than a rung with a badge on it.

## Where this differs from `04`

**Named sections are keyed by catalog id in one file**, `content/sources/sections.json`, rather
than living with each item. `teaching.sections` is where they end up, but an item's notes
arrive through three pipelines — authored ABC, an importer, and the PDMX quarry — and sections
are the same kind of fact about the music whichever way the file got here. One file beats three
mechanisms.

**Section bars are 1-based positions in the printed score**, not the model's measure index.
This matters more than it sounds. `loopFromMeasures` works in the *unrolled* index, where the
Minuet in G has 64 bars because both halves repeat, while the page shows 32. Feeding a section
to it would loop the wrong music on any piece with a repeat, so `loopFromPrintedBars` exists
beside it and the Score screen knows which of the two a given loop came from. On a repeated
section it loops the first pass, which is the predictable reading: he asked for bars 17–32 and
gets bars 17–32.

The render check now records `sourceMeasures` — the printed count — so `validate.py` can bound
each section exactly. Against the unrolled count the check would have passed a section running
off the last page, which is precisely the mistake worth catching.

**The tablet test is on the shortest side, both dimensions.** A phone in landscape is 915 × 412
and passes a width-only check while having 412 px of height to put a side panel in.

**The amber state also paints the keyboard strip.** `04` §5 asks for the notation; the strip
showed no judgements at all before this — only what was expected — so a beginner watching the
keys, which is where a beginner is looking, got no feedback. The midi number is the last field
of a note id, so this needed no new bookkeeping.

## The sections themselves

60 across 22 pieces, all read off the files — repeat marks, double barlines, and the first note
of each bar — rather than from what the pieces are usually shaped like:

- **Binary form** where the score says so: both Minuet in G editions have repeats closing bar 16
  and opening bar 17, so "First half (repeated)" and "Second half (repeated)".
- **Return of the opening** where the notes say so: Für Elise's theme comes back note for note
  at bar 14, so 1–9, 10–13, 14–22.
- **The composer's own divisions**: the easy *Ode to Joy* has printed double barlines at 8 and
  12.
- **The twelve-bar form** for the blues shuffles, visible in the left hand: C C C C | F F C C |
  G F C G.
- **Four-bar phrases** for the eight-bar folk tunes, which is all there is to say about them.

## A bug this found

`coerceSettings` copies known keys explicitly — sensible, since settings come back from
localStorage and from an imported backup and are untrusted input. It silently dropped the new
`strictPrerequisites` on every read, so the toggle appeared to work and did nothing. Caught by
the e2e, which is the only place it *could* have been caught: the unit tests call `lockState`
directly.

## What could not be checked here

Both on the owner's checklist in `OWNER-GUIDE.md`:

1. **The amber against the real microphone on the HP-130.** The colour was chosen to be
   distinguishable from the green and the red by hue and for the commonest colour blindness,
   and the keys carry a `?` rather than a `✗` so the mark reads even if the colour does not.
   Whether it fires at the right times is a question about the mic's confidence floor in a real
   room, which no test here can ask.
2. **The backing loop's feel at a real jam.** The pattern is checked — root and fifth on 1 and
   3, kick on 1 and 3, snare on the backbeat, hat on every off-beat, swung to 2/3 when the
   toggle is on. Whether it feels like something to play against is not a property of the
   schedule.

## Numbers

6 items · 60 sections across 22 pieces · 4 note states · 1310 unit tests · 232 e2e.
