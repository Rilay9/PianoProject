# T33 — The five state-machine choices, decided and built

**Read `docs/prompts/working-rules.md`, `docs/00-invariants.md` §1, the checklist in
`CLAUDE.md`, `docs/decisions/2026-09-23-score-state-machine.md` §5 and §7 in full, the
handlers they name in `app/src/ui/screens/ScoreScreen.ts` and `ScoreSession.ts`, and
`app/tests/e2e/score.states.spec.ts` first.**

## The owner's word (2026-09-23)

"Do what you think is best." Decided by the document's own principles (nothing starts or
restarts unasked; nothing lost silently; *Hear it* and a run never both going; the state
line says what the run is doing) and the standing order that the learner is never
surprised:

- **C1, *Hear it* during a run**: the run pauses, the demonstration plays, and when it ends
  the run is back where it was, paused, with the state line saying *Paused at bar 12 —
  press ▶ to carry on*. Nothing is thrown away. If the demonstration is stopped early the
  same applies.
- **C2, an option changed while paused**: the run restarts at bar 1 **and stays paused**;
  the state line says *Restarted at bar 1 with the left hand — press ▶ when ready*. The
  next thing that happens is the learner's.
- **C3, the metronome in Free play (and the other refusals §7 names)**: a refused control
  reads as refused. The row shows *Off* with the reason beside it (*no clock in Free play*)
  and is disabled while the reason holds (`04` §0 R4); it never reads *On* over nothing.
- **C4, Blind and Perform mid-run**: refused until the run stops, the toggle disabled with
  the reason (*stop the run first*), as §5's table recommends. The resume offer stays as
  the net for any other way out.
- **C5, the summary over changed settings**: the summary names what changed during the
  run in one line (*mode changed to Keep tempo at bar 5; tempo 70 → 80 %*) so the score
  it shows is read against the run that produced it. Read §7's C5 for the cases and cover
  each.

The decisions for C3 and C5 were taken from the document's headings and §5 table, not
from their full text. If §7's text for either describes a case the decision above does
not fit, decide that case by the same principles, say so in the entry, and do not stall.

## Build

Each choice with a test seen red in `score.states.spec.ts` (or its sibling), the state
line's words in `help.ts` / `04` §5f, `docs/05` where the mode machine is described, the
decision document's §7 updated from "choices" to "decided, and why", and one appended
entry in `docs/pending-review.md` (next free number; check the tail). Chain: `build:app`,
then `score.states`, `score.screen`, `score.fuzz` (two workers, twice), `start-and-return`,
`score.head-height` one at a time; `tsc -b`, lint, vitest, exit codes from unpiped runs.

## Rules

Files: `app/src/ui/screens/ScoreScreen.ts`, `app/src/score/ScoreSession.ts`, `app/src/
engine/**` only if a choice needs it, `app/src/ui/help.ts`, `app/tests/**`, `docs/04`,
`docs/05`, the decision document, `docs/08-test-map.md`, the entry. Never name an AI
model. Commit nothing. An absence needs two searches; a plural is several claims; nothing
is heard. **The weekly usage window is nearly spent**: keep `HANDOFF.md` current after
every step; never stop silently. Do not touch `app/src/score/autoFit.ts` or
`WindowRenderer.ts` (another task owns them).

## Final message

Per choice: what was built, the red line, the words on screen; exit codes; what is
unverified.
