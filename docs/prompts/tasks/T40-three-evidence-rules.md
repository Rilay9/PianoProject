# T40 — Three evidence rules the reviewer asked for before C0

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13;
`docs/prompts/audit-2026-09-25-outside.md` Part 6 (the reviewer's verdict on Wave B and the
three decisions this task carries out); `docs/pending-review.md` Entries 66 and 67 (what
T37 and T33 built in the files you are about to touch); the matrix rows L40 and S19 in
`docs/prompts/backlog-2026-09-25.md`. Code: `app/src/ui/screens/ScoreScreen.ts` (the
summary sheet near 2980–3090, the first-attempt rule near 2852–2870, the record call near
2900, the input selector near 135 and 370), `app/src/score/ScoreSession.ts` (the run set
aside under a demonstration, near 164–320 and 697), `app/src/data/progressStore.ts`
(`RunResult`, `recordRun`), `app/src/engine/Scoring.ts` (`evaluateOutcome`, the
`tempoMeasured` flag T37 added), `docs/02-curriculum.md` Part G, `docs/04-ui-spec.md` §5
and §5e, `docs/05-score-follow-engine.md` §3a and §8.

## The goal, in the orchestrator's words

Wave B established that the sheet and the record say only what was measured. Three cases
still break that rule, and the reviewer asked for them before the next wave: a run nobody
listened to reports an accuracy; a sight-read the learner has already heard is recorded as
a first reading; a performance the app demonstrated part of is recorded as an independent
performance. After this task each says what it is.

## What is decided (the reviewer, relayed by the owner, 2026-09-25)

1. **No input, no accuracy.** When a run ends and no note event reached the engine from any
   source (no MIDI, no microphone estimate, no screen key), the sheet does not print
   *Accuracy 0 %* or *Missed N*: it says the run was not measured, in the app's voice, and
   offers the self-report Part G provides for a run without an instrument. Nothing is
   recorded as a measured run; a self-report, if given, is recorded as T37 records it. A
   run in which *some* notes arrived is measured as today: the rule is about a run with
   nothing heard, not a run played badly. Find where the count of heard notes lives
   (`notesHeard`, or the engine's recorded notes) and decide from it, not from the input
   selector, since a learner with MIDI selected can still play nothing.
2. **A sight-read heard before its first run is not a first attempt.** T33 already
   refuses to record a sight-read whose phrase was demonstrated *mid-run*; extend the same
   rule to a demonstration *before* the run starts: the phrase is no longer unseen, so the
   run that follows is recorded as practice, not as the first reading, and the sheet says
   so in the sentence T33 wrote. The learner can still get a fresh phrase; make sure the
   way to one is on the sheet or the screen, and say which.
3. **A performance with a demonstration inside it is not an independent performance.**
   When the learner uses *Hear it* during a Perform run, the run keeps going as T33 built
   it, but its record is not flagged `performance: true`; the sheet's *Changed* line
   already names the demonstration and its bar, and the heading says the take was
   demonstrated. Do not refuse *Hear it* during a performance (the reviewer chose "not
   an undemonstrated performance", not "refused"); the performance history and
   the *No performances yet* sentence read the flag, so check what each shows.

## What is the agent's judgement

The words on the sheet for each case, in the app's voice, added where T37 put its
(`help.ts`'s `SUMMARY_TEXT` or the sheet's own strings) and to `04` §5; whether "not
measured" is a heading or a line; the exact place the heard-count is read.

## Hypotheses you inherit as questions

- That a run with no input ends at all (the count-in may hold for a first note; a run may
  end only by the learner stopping it): reproduce the no-input case on the screen keys
  path with nothing pressed and see what the sheet shows before changing anything.
- That T33's set-aside mechanism exposes "a demonstration happened during this run" to
  the record call; if it only reaches the *Changed* line, thread it through.

## Rules and files

You own `app/src/ui/screens/ScoreScreen.ts`, `app/src/score/ScoreSession.ts`,
`app/src/ui/help.ts`, `app/src/data/progressStore.ts` (a field at most), `app/src/data/db.ts`
(only if a stored row changes shape; no version bump unless a store changes), the unit and
e2e tests that read the summary or the record (`score.run`, `score.screen`, `score.states`,
`modes-*`, `first-day`, `lesson-flow`, `progress`, the `recordTruth` and
`scoreSummaryTruth` unit files), `docs/02` Part G, `docs/04` §5 and §5e, `docs/05` §3a and
§8, `docs/08-test-map.md`. Not the renderer, the generator or content. No commits, no push,
no stash, never `git add -A`. Never name an AI model. Never assert a number measured on
this machine. Every change ships with a test seen red on the committed code; every test
you revise, delete or replace is classified in the report with the assumption the old
assertion encoded. Your entry goes to your scratch folder as `ENTRY.md`, not to
`docs/pending-review.md`.

Playwright: from `app/`, one config at a time, port 4173; stop the preview server before
`npm run build:app`; never build during a run; two workers; unpiped runs; give every wait a
timeout. Two read-only agents work beside you in `docs/` and `tools/` and start no browser.

## When to deviate

If case 1 turns out to be impossible to reach (no run can end with nothing heard), say so
with the reproduction and leave it. If case 3's flag has a reader you cannot satisfy
without a schema change, record the run with the flag and a `demonstrated: true` beside
it, and say why. If any words would read as a failure over a run that was not one, change
the words, not the rule.

## Report

Judgement first: what each of the three cases now tells a learner, and what a teacher
would say of it. Then Done / Not done / Follow-ups / Questions / Files; per case the
reproduction, the red line, the words; the tests table; exit codes from unpiped runs
(`tsc -b`, lint, vitest, and the specs you touched one at a time); unverified beside what
passes, including what you did not see on the glass.
