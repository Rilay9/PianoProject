# Finders on every rung, and the two-tap import

2026-09-06, P15. Implements replan §4 (all four parts).

## What changed

Every rung and every concept now carries a **finder**: what music would train it, in words a
search engine and a chatbot understand. `tools/content/finder.py` generates a search line and
a chat prompt from it at build time. The lesson page says what the rung is short of and hands
both over. An imported file reaches the right rung in two of the owner's actions.

## Two deviations from the spec, both deliberate

### `finder` is required except on an options-exempt rung

§4.1 says the block is "required (from P15)". It is required on 83 of the 87 lessons. The
four Stage 0 rungs — *Your instrument and your body*, *Keyboard geography*, *How the app works*,
*Placement test* — are `optionsExempt`: they are single things by nature with no alternatives
to offer. A finder for the placement test would be a required field filled with fiction, and
the schema now says so with `if/then/else` rather than by having me write four prompts nobody
should ever paste.

The same reasoning gives six of the 254 concepts a display name and no finder: `wait-mode`,
`tempo-mode`, `review-queue`, `self-assessment`, `placement`, `performance-mode` are features
of this app, not musical skills. `validate.py` requires a finder on everything else and refuses
a concept that is neither.

### `levelWords` on a concept is derived, not authored

Every other finder field is authored. A concept's level words come from the stage the concept
is taught at, through one table. 254 hand-written level descriptions would have drifted from
the curriculum the first time a lesson moved, and the stage is already the truth about where a
skill sits.

## What the validator checks, and why each rule exists

Four rules, each because shipping the opposite is easy and silent:

1. **900 characters.** A prompt nobody can paste is a prompt nobody uses. The longest lesson
   prompt is 886; concepts top out at 631. Getting there meant trimming the fixed sentences
   rather than the authored content — eleven rungs were over before that.
2. **Every constraint survives into the prompt.** The author writes `constraints`; the
   generator builds a sentence from them. A wording change that dropped one would have the
   rung quietly asking for the wrong music.
3. **The `00` D18 sentence is present.** The prompt *states* where the owner stands on
   copyright — "Music still in copyright is fine — I am finding it for myself and will buy it
   or use a licensed source" — rather than pretending the question does not arise.
4. **Nothing asks for a download.** `download`, `free pdf`, `torrent`, `for free`. The app
   never fetches a copyrighted transcription and never tells anyone else to.

## The levelling port, and three bugs it caught

`app/src/score/difficulty.ts` is `difficulty.py` measured off the `ScoreModel`, so a score
imported on the phone gets the number the quarry would have given it. The test that holds them
together runs both over all 41 score fixtures at a tolerance of 0.2 of a stage. Writing it was
worth it immediately — it failed on seven fixtures, and every failure was a real bug in the
port:

- **The key signature was read from the major table whatever the mode**, so every A-minor
  exercise got three sharps it does not have. Worth 0.53 of a stage on its own, which is most
  of the budget.
- **The hands were split by `hand` rather than by staff.** Python reads music21 parts, which
  are staves; the model's `hand` deliberately differs from the staff for a cross-staff note,
  so following it swapped the two hands' ranges on exactly the fixtures that test cross-staff
  writing.
- **The time signature was read through a `numerator` field the type does not have**, so every
  compound-time score was silently treated as 4/4.

Four fixtures still measure a *feature* differently and the module says which and why: ties
(music21 counts a tied continuation, the model merges them), grace notes, two voices sharing a
staff, and one key music21 infers where OSMD reports none. None moves the level past the
tolerance, and the test is what would notice if that changed.

`ornaments` and `handCrossings` are not computed at all — the model has no ornament data — and
both carry a weight of exactly zero in the fitted model. If a refit gives them a weight, the
agreement test fails, which is the right place to find out.

## Two taps, counted rather than claimed

The old path was share → PianoPath → find the Library row → Edit → level → tags → Save → Plan →
find the lesson. The new one is share → Save.

That is a claim about screens in sequence, so it is asserted in Playwright by counting the
actions a person takes (`finder.spec.ts`, "two taps from a share to a rung"). The rung rides in
the hash as `#/library?for=<lessonId>`; `share-target.js` carries the query through its
redirect when one is present; Library opens the picker on arrival and the assign sheet on
completion, with the rung selected, the level estimated and the concepts taken from the rung.

Assigning is optional — "No rung — just put it in my library" is the first choice, and is what
an import used to be. What assignment buys is `curriculum/load.ts`'s runtime overlay, which
appends the piece to that lesson's `songOptions`; every reader downstream — `lessonComplete`,
`alternativesFor`, the session builder, the lesson page — needed no change at all, because they
all read `songOptions`.

## What could not be checked here

**A real Android share.** The e2e suite simulates one with a file drop into
`#/library?for=…`, which exercises everything except Android handing the file to the service
worker. It is on the owner's checklist in `OWNER-GUIDE.md` §8 with the exact screen to expect
and the three ways it could be wrong.

## Numbers

83 lesson finders · 254 concepts, 248 of them with finders · longest prompt 886 characters ·
41 fixtures agreeing within 0.2 of a stage · 2 taps.
