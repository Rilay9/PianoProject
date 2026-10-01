# U125 — a note played in a busy moment is judged in its window again (a debug lane: cause first, then the mechanism)

**The learner problem.** `app/tests/e2e/engine.spec.ts:156` (U66, approved 2026-09-30) proves that in Tempo mode a note played while the main thread is busy across the first note's window is still judged in that window. If it fails, a learner's correctly timed note can be judged late or missed when the app is doing other work. That is scoring truth, the project's top tier.

**The evidence.** It passed first try on CI at 53147902 and in T62's proof run on 1cadc4dc. Since U119a (merged ce7f878b) and U118b (merged b5492930) it failed both attempts on CI at fe53873c (the single job), and failed its first attempt in shard 2 of the eight-shard run at 90b19bee (run 36930562106, a lightly loaded shard) before passing on retry. Locally it failed under the full suite's load and passed alone. Provenance: introduced by a seam between 53147902 and fe53873c, to be confirmed.

## Hypothesis and its refuting test

**Hypothesis.** U119a's `leftGroupIsCut` (called from `fitBarControls`, which runs on every render, `app/src/ui/screens/ScoreScreen.ts`) writes the piece's widest `bar m / m` into the DOM, forces a layout to measure it, and restores it in the same task, on every render during a run; that extra synchronous layout on the input path delays or misorders the stamping or judging of the note the test plays inside the long task. **Alternative:** U118b's change to the folded reserve's candidate texts (more synthetic candidates measured in `cornerTexts`, priced when a size is taken), or something else in the window. **Refuting test:** repeat `engine.spec.ts:156` many times (enough to tell a 1-in-2 failure from a reliable pass) under CPU throttling, on the current head, on the head with U119a's per-render measurement disabled, and on the head with U118b's reserve input reverted; also on 53147902 as the baseline. The cause is the variant whose removal restores the baseline pass rate. Say so with the counts, or say no variant explains it.

## What to build

Only after the cause is shown: fix the mechanism, not the test. If U119a's per-render measurement is the cause, measure the widest location once per piece and per window size, text size or face change (U122's design already prices every item once per window size, `docs/design/score-bar-layout.md`), not on every render; keep U119a's acceptance cases green. If the cause is elsewhere, fix it there. Do not lengthen the test's timeouts or loosen its window. The test must pass reliably under the same repeat-and-throttle conditions that showed the failure, red first on the current head.

## Rules

`operating-procedure.md` §14; this lane's port is **5403** from a config copy under `app/build/u125/`. U122a is designing a new landscape Score chrome that may replace this code; keep the fix small and local so it does not pre-empt that design. Report every item done or a not-done line, judgement first, with the counts per variant.

## Record

lane: U125 · closes: — · entry: 210
index: A note played in a busy moment is judged in its window again: the cause of engine.spec.ts:156's new intermittent red found by variant counts under throttling, then fixed at the mechanism (`U125-a-note-in-a-busy-moment-is-judged-in-its-window-again.md`) | app | drafted 2026-10-02 (`U125-a-note-in-a-busy-moment-is-judged-in-its-window-again.md`); Entry 210
in-flight: drafted 2026-10-02 (`U125-a-note-in-a-busy-moment-is-judged-in-its-window-again.md`): the U66 engine test's new intermittent red, cause first (U119a's per-render measurement suspected), then the mechanism (Entry 210)
state: dispatched 2026-10-02: dispatched at 90b19bee, debugging (Entry 210)
