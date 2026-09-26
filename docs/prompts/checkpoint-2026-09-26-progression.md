# The C5 stop, 2026-09-26: the curriculum's progression now reads the evidence, and nothing else

The third learner-facing stop. C5 was the reviewer's exit criterion for Wave C's core: L8, L9 and
S8 closed by one authoritative path from evidence to rung state, the old count-and-pass machinery
retired rather than left beside it. The record is Entry 79 in `docs/pending-review.md` (copied in
`entries-74-77.md`, which now holds 74–79); the rows are in `backlog-2026-09-25.md`; the tests to
start from are `rungStateFromEvidence`, `noCompletionBesideTheEvidence`, `requirementsCanBeShown`,
`sightReadingIsNotAPiece`, `evidenceJobRecomputes`, `carryOver`, `firstThirtyDaysOnTheLadder`,
`lessonPageReadsTheEvidence` and `skillsReadTheLadder` under `app/tests/unit/`.

## 1. What changed for a learner

- **The lesson page says what the app counts**, in words: "One exercise from this page at 90 % of
  the notes, in Keep tempo at 85 % of the written tempo or faster (counted: Rhythm reading with
  eighth notes)"; "One song … (not yet)"; "Subdivision: familiar or better, from what your reads
  show wherever you read (not shown yet)"; and the last line, "A run counts for this rung when you
  open it from this page, or from Today's card for this rung." Where a rung's rule cannot be judged
  by the app (nineteen of them), the page prints the lesson's rule and says the app does not judge
  it.
- **Plan** shows the learner's place as continuity, not a reset: a dashed "done before" bar for the
  rungs an earlier build had walked past, a solid "counted since" bar for what the evidence has met,
  and a legend. Rung badges read "done before", "in progress", or nothing.
- **Skills** says "introduced" for the concepts of carried rungs, the ladder's first state, never
  "learning" or "known"; and "introduced" for any skill whose only evidence was refused.
- **Today** offers "A piece you know" only for a piece actually mastered; no generated phrase sits
  on the review calendar; the drill route carries its rung.
- **The storage report** says how many rows' evidence is up to date and which are kept out and why,
  while the recompute job works in idle slices after the first screen.

## 2. Read as a teacher

On an owner-shaped history (passes on 0.1–2.1, three daily reads an older build had passed, the
Petzold mastered from the Library, one compacted read, one run of 2.2's eighths drill opened from
Today's card), the app now says: Stage 2, rung 2.2, in progress, one of three things counted; 2.1
done before; 4.7 no longer complete on the Petzold alone (the old rule had it so). A teacher would
accept the requirements as what each lesson teaches — 1.5 asks for five first readings with the
guide off rather than two ear drills — and would read "done before" as the fair word for work the
app did not itself measure.

What a teacher would still question: nineteen rules the app cannot judge, said honestly, are still
nineteen; the exercise sentence claims Keep tempo even where a drill scores itself (U61); a learner
whose only reads were refused is "introduced" in a skill they may know well.

## 3. The reviewer's exit criterion, answered

- **L8 closed.** No item-level credit exists. `noCompletionBesideTheEvidence` proves, over the
  built curriculum, that a run judged by one rung moves no other rung that lists the item (the
  Petzold at 3.4 completes none of 4.4, 4.6, 4.7; two ear drills do not complete 1.5). Red on the
  committed code: `expected [ '4.7' ] to deeply equal []`.
- **L9 closed.** Requirements are predicates over evidence; `lessonComplete`, `PassRecord` counting,
  `exercisesRequired`, `songsRequired`, `custom`, `requirementTerms` and `gateWaivers` are deleted,
  and a source-level test asserts the retired names are gone from `app/src`.
- **S8 closed.** A generated run never passes, masters or sets a best; the review queue skips it.
- **One path.** `rungState` is the only derivation; `nextRecommended`, placement's floor, Plan,
  Today, the lesson page and Skills read it. Skill evidence is the learner's everywhere; only the
  decision that a rung's requirement is met is scoped to the rung that judged the run.
- **Recomputation.** `evidenceJob` rewrites each stale row's evidence from the regenerated phrase
  only where the phrase matches the run's own record; else the row is kept out with its reason.
- **The other trajectories.** The returning intermediate and the experienced musician, reading
  strand, through the real code on the ladder.

## 4. Decisions taken by the orchestrator, for the reviewer to overturn

- The one-time carry-over (only on a database made before C5; only rungs the old rule had walked
  past; shown apart; never counted as met). Without it the owner's Plan would drop to 0.1.
- Runs opened from no rung between 2026-09-21 and 2026-09-26 count for the first rung listing the
  item, because that rung judged them at the time.
- Carried rungs drawn into the stage bar apart, with a legend, so "0 of 10" does not read as a reset.
- Carried rungs' concepts are ladder exposures ("introduced").
- Placement stays a floor rather than going through the predicates, because its answers are
  self-report.

## 5. Not done, and what follows

`fallbackOrder` (L14's tiered alternatives search) is C6's, as are the reader-policy and
evidence-hygiene rows C5 was scoped away from (L52, L56–L63, L69, L70, L73–L75, L77) and the other
slots; C7 is the Skills store. L76's diagnostic probe stays designed for after C5, as the reviewer set.
The owner's real rows are not in the tree; the carry-over and the job on the owner's phone are the
first real test, and the storage report will say what they did.

## 6. Not verified

Nothing heard. The learners and the owner-shaped history are constructions. Desktop Chromium at
342 × 740, not the phone; the job's pace on a phone. The chain and CI on this push are recorded in the
matrix rows when they land.

## 7. The reviewer's verdict (2026-09-26)

L9 and S8 closed; the one-path architecture accepted; the carry-over decisions stand. Not released to C6/C7 until two boundary defects are fixed: `done` must obey the judging-rung scope like the other requirement kinds (L82), and the evidence job must enumerate stale rows independently of the current catalog so an item-gone row is reported (L83). The `phraseMatches` limitation (L80) stays live at P1 with the generator-version work. The fix-forward is in progress; its result is recorded here when it lands.

