# T23 — Every mode and drill walked as the learner would, branch by branch in the code

**Read `docs/prompts/working-rules.md`, `docs/00-invariants.md`, the checklist in
`CLAUDE.md`, `docs/04-ui-spec.md` §5 (modes) and §5c (drills), `docs/05-score-follow-engine.md`
§6–§8, `docs/08-test-map.md`, `docs/prompts/tasks/T8-latch-the-start.md`, and
`docs/pending-review.md` Entries 18 (the abrupt start that a learner could not meet, and
how it was fixed), 28, 29, 30, 38, 42 and 47 first.**

## Why

The owner (2026-09-22): "originally the abrupt start was impossible for the user. Double
check usability of everything, thinking through what the user would do and the code logic
branching." T17 drove each mode's happy path. This task is the other thing: what a learner
actually does around a mode, traced through the code's branches, so that no mode has a
moment where the reasonable thing to do leaves the learner stuck, judged unfairly, or
wondering what happened.

## The grid

**Rows**: every way a run starts and judges — Wait, Keep tempo, Listen, Perform, Blind,
Duet, Rhythm only, the ladder, the lab's Read it / Jam it / Hold the chords / Play the tune
/ trading fours, the chord chart's count-off, and every `DrillKind` in `drills/types.ts`
(list them; say how many).

**Columns**: what a learner does —
1. **Starts late or early**: the countdown ends and they have not played; they play before
   the count; they play the wrong first note. Which of T8's cases applies, and what the
   screen says.
2. **Makes a mistake**: wrong note, missed note, extra note, held too long, too early by a
   hair. What is marked, what moves, what the next cue is.
3. **Stops and restarts**: Stop mid-run; Back mid-run; the phone locks; a setting changed
   mid-run (tempo, hands, loop, ladder, the lab's pickers). What state survives, what is
   recorded, whether anything acts unasked (`05` §6's trap).
4. **Finishes**: the last note; a pass; a fail; what the sheet says; what Today shows next;
   whether a pass with the wrong reason is possible (a run that passes on notes while the
   mode was about something else).
5. **Input**: MIDI, the on-screen strip, the microphone. Which cells cannot be judged from
   which input, and whether the screen says so before the learner tries.
6. **Read-ahead and cues**: can the learner see the next thing in time (the next bar, the
   next card, "your turn"), on a 342 px phone and sideways.

For every cell: the code path (file:function:branch), the screen text the learner sees,
and a verdict: **fine / FAULT / unclear**. A FAULT is a moment the reasonable action leaves
the learner stuck, unfairly judged, or uninformed. Trace the code first; drive the screen
only to confirm a FAULT or an unclear.

## Then

Fix each FAULT that is a small change in the screen or the engine, with a test seen red
first (a unit test through the engine with a synthetic performance where possible, as
`swingJudging.test.ts` and `tradingFours.test.ts` do). Record the rest with the size of
the fix. Where the spec disagrees with the better behaviour, change the spec in the same
step with the reason.

## Rules

- Files: `app/src/**`, `app/tests/**`, `docs/04`, `docs/05`, one appended entry in
  `docs/pending-review.md` (Entry 49) carrying the whole grid.
- **No Playwright and no server on port 4173 until the coordinator says the tour has
  finished**; until then, code tracing and unit tests only. Then one spec at a time after
  `npm run build:app`.
- `npx tsc -b`, `npm run lint`, `npx vitest run` for anything changed. Never name an AI
  model. Commit nothing. An absence needs two searches; a plural is several claims;
  nothing is heard. Every cell gets a verdict or a not-traced line. Never stop silently.

## Final message

The grid's FAULT and unclear cells verbatim; fixes with their red lines; what was not
traced; what is unverified.
