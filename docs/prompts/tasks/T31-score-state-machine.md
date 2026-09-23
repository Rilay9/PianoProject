# T31 — The score screen's state machine, as it is and as it should be

**Read `docs/prompts/working-rules.md`, `docs/00-invariants.md` (§1: nothing acts unasked;
a control that looks pressable and is not is a bug), the checklist in `CLAUDE.md`,
`docs/05-score-follow-engine.md` §2–§6 (Wait, Tempo, rhythm first, the first-note latch,
Listen, Free, loops and the ladder), `docs/08-score-render-states.md`, `docs/04-ui-spec.md`
§5 and §5f (the state line), `app/src/score/ScoreSession.ts`, `app/src/engine/
PracticeEngine.ts` (the mode machines), the control handlers in
`app/src/ui/screens/ScoreScreen.ts` (play/pause, stop, *Hear it*, mode, hands, loop,
section, tempo, ladder, metronome, input, *Perform*, *Blind*, rotation, page hidden,
back), `app/tests/e2e/score.fuzz.spec.ts` (its action list and invariants are the closest
thing to a transition explorer), and `docs/pending-review.md` Entries 42, 49, 54 and 58
first. Read sections, not whole files.**

## Why

The owner (2026-09-23): "re-examine the state machines for playing, listening and other
stuff from stop, start and option changes. It's very confusing what happens and I don't
think it's been fully explored." The fuzz walks random paths and checks invariants; nobody
has written down the whole table, and the screen's words, the engine's state and the
learner's expectation are three things that have drifted apart one fix at a time.

## Do

1. **The table as it is.** Rows: every state the screen can be in, including the ones the
   code keeps implicitly: idle at bar 1; idle with a run left half-way (the resume offer);
   armed waiting for the first note (T8's latch); counting in; running in each mode
   (Wait, Tempo, rhythm-only, Perform, Blind); paused; loop running; ladder step; hearing
   (*Hear it*) from idle and from a run; page hidden mid-run; summary; the sideways twin
   where it differs. Columns: every event: each control on the bar and in the `⋯` sheet,
   a MIDI note (expected, wrong, early), a mic note, the metronome tick, the loop end, the
   piece end, page hidden and shown, rotation, back, reopening the piece. Each cell: the
   resulting state and what the screen says, with the file:line that decides it. Mark
   cells that are **undefined** (no code path), **surprising** (the state changes but no
   word on screen says so), **inconsistent** (the strip's state line, the button's label
   and the engine's state disagree), or **lossy** (a run's progress is thrown away without
   saying so). Produce it by reading the code and by driving the screen with a probe
   spec that fires each event in each state and records the state line, the button
   labels and `session` fields, so the table is measured, not recalled; say which cells
   came from which.
2. **Compare with the documents.** Where `docs/05`, `04` §5f and the table disagree, say
   which is right by `00` §1 and by what a learner at the piano would expect, and mark
   the cell.
3. **The machine as it should be.** One diagram (Mermaid in the doc) and the same table
   filled in with the intended result, under stated principles: nothing starts or restarts
   unasked; an option changed mid-run either applies live, restarts with a count-in, or is
   refused until the run stops, and in every case the state line says which in words; a
   run's progress is never lost silently; *Hear it* and a run are never both going; the
   button that stops a thing is the one that started it. For each option (mode, hands,
   loop, section, tempo, ladder, metronome, input, layout, bars, size, keys, sound, duet,
   perform, blind) say which of the three it should be and why.
4. **Fix what is a bug by the principles** (undefined, inconsistent and lossy cells whose
   right answer is not a design choice), each with a test seen red, in `ScoreScreen.ts`,
   `ScoreSession.ts` or the engine, and update `docs/05` and `04` §5f in the same step.
   List the cells that are **design choices** for the owner separately, with the two or
   three answers each could take and what each costs the learner; build none of those.
5. Write the table, the diagram, the fixes and the choices as
   `docs/decisions/2026-09-23-score-state-machine.md`, and point to it from `docs/05`.
   Run `score.fuzz` (2 workers, twice), `score.screen`, `score.run`, `score.latch`,
   `start-and-return`, `score.head-height` one at a time after `build:app`; `tsc -b`,
   lint, vitest with exit codes stated from unpiped runs.

## Rules

- Files: `app/src/ui/screens/ScoreScreen.ts`, `app/src/score/ScoreSession.ts`,
  `app/src/engine/**` for fixes with red tests, `app/tests/**`, `docs/05`, `docs/04`, the
  decision document, `docs/08-test-map.md`, one appended entry in `docs/pending-review.md`
  (next free number; check the tail). Never name an AI model. Commit nothing. An absence
  needs two searches; a plural is several claims; a state read off the DOM is a proxy for
  what the learner sees. Keep `HANDOFF.md` current in your scratch folder after each
  numbered item; never stop silently.

## Final message

The table's size and the counts of undefined, surprising, inconsistent and lossy cells;
the fixes with their red lines; the design choices listed for the owner; exit codes; what
is unverified.
