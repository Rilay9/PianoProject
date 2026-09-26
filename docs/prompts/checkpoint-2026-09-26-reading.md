# The C4 checkpoint, 2026-09-26: does the app now teach reading better, or is it only more careful?

This is the learner-facing stop the reviewer asked for after C4. It is written for the owner and
the reviewer, and it starts from what a learner meets, not from the code. The record behind it
is Entries 70–73 in `docs/pending-review.md`; the diary is
`docs/prompts/checkpoint-2026-09-26-diary.md`; the open problems are rows in
`docs/prompts/backlog-2026-09-25.md`, named below.

## 1. What changed for a learner between 2026-09-25 and now

- **Every run leaves a record of what it measured**, and marks what it did not. The history
  says "tempo not judged" for a Wait run, "Not judged · 42 notes played" for a jam, "not first
  sight" for a phrase the learner had heard. It used to print "88% at 70%" for all of them.
- **Nothing is marked wrong when nothing is listening.** A run with no input used to paint
  every note red behind a sheet saying "Not measured". The notes stay black now.
- **Black keys are named as the score writes them** on the status line and the key ribbon
  (E♭, not D♯, in F major).
- **The keys guide is off for sight-reading by default**, and every run records what the keys
  showed.
- **The sheet says what it could not judge**, citing the run: "Not judged — timing: Wait for
  me keeps no clock"; "you played the right hand alone".
- **The daily read and the session's reading slot are chosen from the learner's reads**, not
  from the stage number. One dimension moves at a time (hands, range, rhythm, key, metre,
  syncopation), gated by what the rung has taught; a phrase already on the record is never
  offered; one read in four is deliberately easy; the Today line says why in the app's words,
  or claims nothing when there is no evidence.
- **Today's runs are judged by the rung Today chose**, which rides the route and the record.

Underneath, by the reviewer's decisions: a vocabulary of sixteen reading skills and nineteen
demands, nineteen detectors with one definition, a build that refuses a rung no run can
evidence, a pure evidence function whose only route to "supports" is a measurement taken
under the skill's conditions at the places the phrase contains the demand, and a ladder read
from evidence and never stored.

## 2. The thirty-day diary, read as a teacher would read it

One constructed learner: rung 2.2 for days 1–10, 2.5 for 11–20, 3.1 for 21–30; misreads every
skip as a step on days 3–6; otherwise plays cleanly with a little unevenness. Each morning the
real code chose the phrase from the rows the store held; each evening the real engine and the
real store wrote the run. The diary is one line per day in the app's own words.

**What a teacher would recognise.**
- Two clean days, then "Now with both hands". Two bad days, then "This one right hand only".
  The month gets harder only after clean days and easier after bad ones.
- "An easy one, for fluency" every fourth day, and it is easier.
- Keys arrive at 3.1 and not before: "Now in G major" on day 22, F on day 24, an easy one back
  in C on day 25.
- No phrase is repeated. The line never claims a reason it does not have: day one says "One
  phrase you have never seen, once, slowly" and nothing else.

**What a teacher would not do.**
- **Days 3–6.** The learner misread every skip. The app took the left hand away, because the
  left hand was the last thing it had added. It could not see the skips: evidence is counted
  per skill, and "interval reading" fell, so it stepped down the dimension it had last moved.
  The line says "14 of 20 right and in time yesterday" and can never say "the skips". A teacher
  would have given skip practice, in one hand, and said so. This is the largest gap (L64).
- **Days 11–20.** Ten days on rung 2.5 reading the same kind of phrase, with "The next step
  waits for a later lesson" on six of them. The rung's next rhythms (ties, dotted quarters) are
  taught at 2.4, but the generator only writes them at higher levels, so the reader had nothing
  to move. A proficient reader was held for a fortnight by the generator, not by the evidence
  (S25).
- **Day 24.** "Now in F major" after G says "now" as if F were harder. It is a different key,
  not a harder one (U52).

## 3. Three mornings on the glass

Pictures are in the session's scratch folder; the owner can see four of them in the
conversation. The orchestrator looked at day 3's phrase and sheet, day 22's phrase and Today,
the three learners' Today cards and day 6's Today; the rest are C4's.

- **Day 3** (342 × 740). The card: "Now with both hands — 15 of 15 right and in time
  yesterday". The phrase: right hand in C with eighths, left hand whole-note roots. The sheet
  after a clean run: accuracy, tempo, timing, and one line that reads as noise — "Not judged:
  Shifting position — none in this phrase". The skill was declared on the row; the phrase had no
  shift; a learner does not need to be told that (U50).
- **Day 6.** The diary's line is "This one right hand only — 10 of 14 right and in time
  yesterday": honest, and the wrong remedy (above). The orchestrator's look at this morning's
  picture shows only the top of Today at 60 minutes: the warm-up card holding the rung's
  reading row (L65), then review, new, repertoire and jam; the daily-read card sits below the
  fold, so its line on the glass is C4's report, not the orchestrator's eye.
- **Day 22.** "Now in G major — 12 of 12 right and in time yesterday"; the phrase opens in G
  with both hands; the session card cuts the reason to "12 of 12 ri…" at phone width (U51).
  The same Today shows the sight-reading generator twice for a 2.2 learner: once as the
  warm-up card and once as the daily read, because the warm-up slot takes the rung's reading
  row (L65).

## 4. The answer

**Better in sequencing and in honesty; not yet better in diagnosis.** A learner now gets a
phrase that follows their reads, never a repeat, with an easy day built in, and a line that
tells the truth. What the learner does not yet get is a teacher's eye on what went wrong inside
the phrase, and the middle of the month shows the reader starved by a generator that cannot
write the rung's next rhythm at the rung's level.

Two things the reviewer warned about, checked:
- The evidence machinery did not become an end in itself: it is read by exactly one thing a
  learner meets (the reading strand), and the reason line never overstates. Entry 72 lists the
  skills whose construct validity the function cannot establish; the lines say "right and in
  time", never "you can read intervals".
- The phrases themselves are still the old generator's. Day 3 opened with four C4s in a row.

## 5. Found on the way, not yet fixed

- **CI exposed a product fault C3 uncovered:** the tempo ladder read a pass nothing listened to
  as clean and sped the loop up to 100 %. The old test relied on every note being judged missed
  with no input, which was the fault C3 fixed. T42 (briefed) makes the ladder hold on an
  unjudged pass and revises the test (Q33).
- L64 evidence per demand (P1); S25 the 2.5 plateau (P1, the generator); L65 the warm-up
  taking the reading row; U50 the no-opportunity noise on the sheet; U51 the cut reason lines;
  U52 the key move's words; S24 a guide-on reader never moves up and is not told why.

## 6. Decisions I took, for the reviewer to overturn if wrong

- A heard or re-read phrase is recorded, flagged, and never counts as sight-reading at any
  standard.
- A bad first reading of harder material does not move a skill down.
- Middle C stays out of the ledger-line demand.
- A learner with no reads starts at the rung's own row. This changes day one on 13 core rungs
  (1.3 and 1.4 no longer get 1.5's skips two rungs early; 2.2–2.5 get the level-2 right-hand
  row; 3.4–3.6 level 2; 4.5–4.7 level 3), and it is what the rungs promise.
- One read in four is easy, and the easy read takes precedence over "nothing to move".
- Evidence is computed at record time and stored on the row with its definitions stamp; rows
  written before C4 contribute nothing.

## 7. What I recommend next, and the question

The design's next steps are C5–C7 (requirements as evidence predicates, the other slots, the
Skills screen). The diary says the learner would gain more first from **D's generator
dimensions** (S25, G36) and **evidence per demand** (L64): the only adaptive strand today
plateaus for want of a movable rhythm, and steps down the wrong dimension for want of a
demand-level count. My recommendation is L64 and the generator's rhythm dimension before C5,
then C5–C7. The question for the owner and the reviewer is whether the reading strand as it
stands is the right shape to build the other strands on, or whether §2's two gaps say the
evidence needs to be per demand before anything else reads it.

## 8. What was not verified

Nothing was heard by anyone. The learners are constructed; no real playing has been measured
against this. One size, one theme, desktop Chromium; nothing on the owner's phone. The cost of
the evidence call was measured under jsdom only. The chain over C4's tree and CI on its push
are pending as this is written; the chain's result is recorded in the matrix rows when it
lands.
