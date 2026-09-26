# The C4.5 checkpoint, 2026-09-27: does the reader now adapt to what the evidence supports, and admit when it cannot?

The second learner-facing stop, after the reviewer's verdict on the first (Part 8 of
`audit-2026-09-25-outside.md`). It answers the six verifications the reviewer set, with the
evidence each rests on, and reads the reruns as a teacher would. The record behind it is
Entries 74–77 in `docs/pending-review.md`; the diaries are `checkpoint-2026-09-27-diary.md`
(against the first, `checkpoint-2026-09-26-diary.md`); the open problems are rows in
`backlog-2026-09-25.md`, named below. The reviewer said they would go to the files and tests
first; the tests to start from are `readerMovesTheDemand`, `readerAdversarial`,
`firstThirtyDays`, `demandReadings`, `evidenceByDemand`, `evidenceAdversarial`,
`generatorContract` and `sightReadingOptions` under `app/tests/unit/`, and the C4 cases in
`app/tests/e2e/today.spec.ts` whose rows now come from the real evidence path.

## 1. What C4.5 built, in learner terms

- **T42.** A loop pass nothing listened to no longer moves the tempo ladder; the status line
  says "Nothing listening — staying at 40 %". The old test had relied on every note being
  judged missed with no input, which was the fault C3 fixed; it now misses under a judging
  input, and a case asserts the hold.
- **C4a.** The evidence keeps what happened at each demand's opportunities — the skips went
  0 of 7 while the steps went 10 of 10 — with the overlap between demands recorded as a fact
  and no field naming a cause. Three readings over the recent phrases say `pattern`,
  `isolated` or `ambiguous`; the thresholds are named hypotheses. The evidence carries its own
  version, and rows stored under the old one contribute nothing until something recomputes
  them (the recompute exists; its trigger does not).
- **C4b.** The generator gained ties, dotted quarters, ledger range, leaps, sixteenths and the
  left-hand pattern as controls, and an "off" for every demand; a golden of phrase hashes
  proves it unchanged when none is asked. A control map in app code says which option moves
  each musical demand. A contract test walks every core rung and every taught demand, on and
  off, and holds the impossible moves to a declared list of nine.
- **C4c.** The reader moves the control of the demand the reads single out and keeps the rest;
  when nothing is singled out it holds, offers the easy read and says it is not sure; a step up
  brings the next taught demand the generator can write, only once every demand already in the
  phrase has held; a key is named, never "now", never ranked; the easy read and the step
  counts are one explicit policy object. C4's hand-written dimension table is gone.

## 2. The reruns, read as a teacher

**The skip learner** (the same learner and calendar as the first diary).

- **Days 3–8.** Two clean days, then both hands. Skips misread on days 3–6. Day 6 used to say
  "This one right hand only"; it now says "This one by step only — skips went wrong in
  3 phrases", and on the glass the phrase keeps both hands and moves by step over whole-note
  roots. Day 7 holds; day 8 says "Now with skips" after two clean days. That is what a teacher
  does: take out the thing that keeps going wrong, keep what goes well, bring it back when the
  learner is secure.
- **Days 11–20.** The plateau is gone. Day 11 says "This lesson's phrases can reach beyond C
  position" (the rung changed; one thing changes that day). Day 12 "Now with dotted quarters";
  day 15 "Now with tied notes"; the easy reads take one of them away for a day. "The next step
  waits for a later lesson" appears only on days 19–20, when everything rungs 2.1–2.5 taught is
  in the phrase, which is true.
- **Days 21–30.** "A key signature to read: F major, one flat" on day 21; an easy one back in C;
  "Now with a note outside the key" on day 24; "Another like it: G major, one sharp" on day 25.
  No key is called harder than another.
- **What a teacher would still question.** By day 26 the phrase holds both hands, dotted
  quarters, ties, a key signature, an accidental and a leap: each taught and shown, but dense
  for early 3.1. "Now with a leap" on day 26 brings back a demand taught at 1.5 as if new,
  because the five-read window held too few phrases with a leap (L75). And some of those
  composed phrases miss a promised demand (§3, verification 4).

**The mixed-demand ambiguity learner** (every note that is a skip and an eighth at once
misread, on 2.5).

- **The reviewer's profile.** Days 1–2 misread; day 3 "An easy one: in C position — not sure yet
  what went wrong". From day 3 skips in quarters and steps in eighths succeed and the
  skip-eighths still fail; over ten days no demand is ever singled out, no step down happens,
  and the line keeps saying it is not sure. Honest.
- **The variant** (every eighth misread from day 3): day 4 "This one without eighth notes — the
  eighth notes went wrong in 3 phrases"; the skips stay unnamed. The readings discriminate when
  the observations allow it and refuse when they do not.
- **What a teacher would do differently.** Ten days of "not sure yet" is honest and not
  helpful. A teacher would set a discriminating read on purpose — skips in quarters only, then
  eighths by step only — to separate the demands. That is a policy the reader does not have
  (L76), and it is the one question this checkpoint puts to the reviewer.

## 3. The reviewer's six verifications, answered with evidence

1. **Selective skip failure changes a relevant demand, not an unrelated dimension: yes.** The
   day-6 move rests on the skips being a `pattern` (0 of 26 across the five reads; 7 of 9 wrong
   where the hands were not together) while the bass staff and hands together are `ambiguous`.
   One caveat: in a two-hand phrase the left hand holds a whole note under every right-hand
   note, so the hands-together opportunity sits on every wrong skip, and the skips are singled
   out only after a one-hand read (here the easy read on day 4). A two-hand skip learner who
   never reads one-handed hears "not sure yet" until one comes (L72, P1).
2. **Overlapping demands produce no unjustifiably specific diagnosis: yes.** The reviewer's
   profile names nothing in ten days; the one-note-under-four-demands case stays `ambiguous`
   on one day and on two; the variant names only the eighths.
3. **The proficient 2.5 learner receives the next taught rhythmic demand: yes.** Dotted
   quarters on day 12, ties on day 15; "waits" only when everything taught is in the phrase.
4. **Every legal adaptive reading move is generatable and detector-confirmed: partly.** Single
   moves hold: the reader never asks for a move the generator declares impossible, and every
   move the diaries asked for writes its demand in all twelve seeds and brings nothing untaught.
   Composed recipes do not all hold: the 3.1 working recipe with dotted quarters, ties, a key and
   an accidental together misses one of them at 5 of 12 seeds, and day 28's phrase has no tie.
   C4b's contract is proven per single move, not per composed recipe (S29, P1; the seeds are
   listed in `firstThirtyDays` as known broken, not hidden).
5. **Reason text claims only what the evidence establishes: yes.** All fifty lines of both
   diaries are checked by a test against the evidence each cites.
6. **Old item-completion semantics cannot contradict the evidence-derived rung state: not yet,
   by design; C5 owns it.** The old path still decides: the learner's rung comes from the pass
   records, and the reader's row and taught-at gate rest on it; a pass still credits every rung
   that lists the item (L8); completion is still a count over mixed lists (L9); sight-reading is
   still recorded like a piece (S8).

## 4. Decisions taken by the orchestrator, for the reviewer to overturn

- A step up requires every demand already in the phrase to have held in the proving reads;
  without it the ambiguity learner was moved up on day 7 while still missing every skip-eighth.
- On the day a learner's rung changes, the reader holds and says the lesson's line, so only
  one thing changes that day.
- The easy read's fallback follows C4's documented order (range, then hands).
- C4b's `leaps` control and an "off" for every demand, beyond the brief's list; S16 held in the
  reader rather than the row (lesson 2.5's sentence about the row is true); row 7 drops
  sixteenths until a rung teaches them.

## 5. What goes before C5, and the question

Two P1 findings are one follow-up before C5, because the reader now composes recipes for a
live learner: **S29** (the contract test composes moves as the reader composes them, and the
generator honours composed promises) and **L72** (the hands-together opportunity is where the
hands move together or the left hand changes, not every held note). Both are bounded; neither
touches the evidence rule or the reader's policy.

The question for the reviewer: should the reader get a **discriminating read** policy — when a
demand stays ambiguous for a number of reads, set a phrase that isolates one of the overlapping
demands — or is "not sure yet" the right answer until the learner's own reads separate them?

Then C5 as the reviewer set it: L8, L9 and S8 closed by one authoritative path from evidence to
rung state, the old completion machinery retired, and the other learner trajectories.

## 6. What was not verified

Nothing was heard by anyone. The learners are constructed; the thresholds, the reader's four
numbers and the easy-read cadence are hypotheses. One size, one theme, desktop Chromium; not the
owner's phone. For a real learner, rows stored before C4a's stamp contribute nothing until
recomputed. `pattern` is an association across phrases, never a cause; the construct-validity
list of Entry 72 stands. The chain over C4c's tree and CI on its push are recorded in the matrix
rows when they land (CI on the two previous pushes failed only on the Today case C4c rebuilt, and
the tempo ladder is green there).
