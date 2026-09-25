# T41 — A black key named by its key, a drill sheet that stops claiming an accuracy, and a fit that says when it has settled

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13; the test inventory
`docs/prompts/test-inventory-2026-09-26.md` §8 rows N1, N2 and N7 (the three findings this
task closes) and §9's note on the fixed waits Wave B and T40 added; the matrix rows Q18–Q20 in
`docs/prompts/backlog-2026-09-25.md`. Code for each item is named below.

## The goal, in the orchestrator's words

Three small faults, two of them against the app's first rule (never teach wrong; never claim
what was not measured) and one against the test rule (never wait on a transient, observe it).
Each is fixed at its mechanism with a test seen red first, and nothing else changes.

## What is decided

1. **N1, P0: the Wait-mode status line spells every black key as a sharp.** `waitingForLine`
   (`app/src/ui/expectedNote.ts`) names the expected note through `midiToNoteName`
   (`app/src/midi/parseMidiMessage.ts`), whose table is sharps only, so an E♭ in a flat key
   reads "Waiting for D♯4". The owner's rule (2026-09-21): the learner is never told a G♯ is an
   F. Spell from the notation's own step and alter: the score model carries each note's
   MusicXML pitch (find where `extractScoreModel.ts` keeps step, alter and octave, and whether
   `PreparedStep.expected` or the model's notes can reach the status line); the status line
   names the note as the score writes it, including naturals and double accidentals as the
   score has them. Where the same pitch is written two ways in one chord, name each as written.
   `midiToNoteName` stays for the diagnostics log, where it is a MIDI number's name and not a
   note's. Red first: `expectedNote.test.ts` "writes a sharp as a sharp" gains a flat case that
   fails on the committed code, and an e2e case on a piece in a flat key (Anh. 113 or a
   catalog piece in F) reads the line on the glass. Check every other reader of
   `midiToNoteName` under `app/src` (two searches) and say for each whether it names a note a
   learner reads (then it is wrong too) or a MIDI number (then it stays).
2. **N2, P0: the backing-track drill's sheet says "Not passed yet" and "Accuracy 0 %"** on a
   drill that measures no accuracy; `app/tests/e2e/drills.spec.ts` near 150–154 asserts both.
   Apply T40's rule: a drill that measured nothing says so and claims no number; the test is
   revised to read the outcome (class stated). Look at what the drill *does* measure, if
   anything, and print that; if it measures nothing, the sheet says it is practice.
3. **N7, P2: the page publishes no "fit settled" state.** `data-measured` is set before the
   re-plan it triggers finishes (`WindowRenderer.ts` near 3910), so Wave B's and T40's revised
   tests pad it with `waitForTimeout(500)` and the like (`score.screen` twice; T40's 1 s in
   `score.screen` and two 300 ms in `score.states`; `lab.spec`'s one-second waits). Publish
   one state the renderer sets when the fit and the shape are settled after the last
   measurement (`data-settled`, or a counter that changes on every re-plan), set it in the one
   place the re-plan completes, and replace those fixed waits with a wait on that state. Red
   first: a test that reads the state right after `data-measured` and finds the shape still
   changing on the committed code (or, if it cannot be made to fail deterministically, say so
   and show the timing instead). Do not touch the fit's logic; only publish its completion.

## What is the agent's judgement

Where the spelling reaches the status line with the fewest new fields; whether a natural sign
is printed when the key has that note sharp or flat; the name of the settled state; whether
`lab.spec`'s waits are the same state or a different one (say which).

## Rules and files

You own `app/src/ui/expectedNote.ts`, `app/src/ui/screens/ScoreScreen.ts` (the status line
and, for N7, nothing else), `app/src/score/extractScoreModel.ts` and `app/src/engine/types.ts`
only if the spelling needs a field carried, `app/src/score/WindowRenderer.ts` only to publish
the settled state, `app/src/ui/screens/DrillScreen.ts` and its drill kind for N2, the tests
named and any test that reads the fixed waits you replace, `docs/04` §5 and §5c, `docs/08` §9
(the settled state as an invariant), `docs/08-test-map.md`. No commits, no push, no stash,
never `git add -A`. Never name an AI model. Never assert a number measured on this machine.
Every test you revise, delete or replace is classified in the report with the old assumption
named. Your entry goes to your scratch folder as `ENTRY.md`, not to `docs/pending-review.md`.

Playwright: from `app/`, one config at a time, port 4173; stop the preview server before
`npm run build:app`; never build during a run; two workers; unpiped runs; every wait a timeout.
You are the only browser user.

## When to deviate

If N1's spelling cannot reach the status line without a schema change to the prepared steps,
carry the written pitch on the step (it is the same fact the model already holds) and say so.
If N7's settled state would need the fit's logic to change, stop at publishing what can be
published and report the gap. Keep each item local (boundary 8).

## Report

Judgement first: what a learner in a flat key now reads on the status line, and what the
drill sheet now says. Then Done / Not done / Follow-ups / Questions / Files; per item the
mechanism, the red line, before and after; the tests table; exit codes from unpiped runs
(`tsc -b`, lint, vitest, and the specs you touched one at a time); unverified beside what
passes.
