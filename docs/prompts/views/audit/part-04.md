===== PART 4: THE REVIEWER'S GO ON WAVE B, AFTER READING THE DIAGNOSIS AND THE FOUR TRACES (2026-09-25) =====

The reviewer read the branch itself this time: the diagnosis and all four traces. Verdict:
Wave A is substantially successful; the investigation "has crossed the threshold from
audit theatre into real debugging and architectural diagnosis". The strongest findings, in
the reviewer's ranking: (1) the app claims evidence it did not measure; (2) the
sight-reading curriculum's promises are not wired into the generator; (3) the learner
model discards most of the performance evidence it already computes; (4) content
difficulty and learner ability are conflated; (5) the first-tier rung lists are poorly
curated, so fixing fallbacks alone will not fix selection; (6) PDMX carries dimensional
information thrown away at the catalog boundary; (7) the renderer has a demonstrable
stateful pricing bug and a real distortion failure the tests cannot see.

Two disagreements to carry forward. **On D2:** "one performance yields evidence for each
skill the item exercises, weighted by what the item demands" is dangerous; an item can
demand a skill without the app measuring whether the learner showed it. Distinguish item
demand from what the performance actually measured; never turn unmeasured properties into
evidence. **On D4:** the seven-way decomposition is right, but the schema is not known;
material demand should describe musical properties present (a stride pattern, octave
displacement, syncopated sixteenths), skill is pedagogical (read skips by interval; hold
an accompaniment under a melody), and learner skill state is evidence about capabilities,
not seven little numbers that recreate one level. The schema waits for its own review.
**On the window's look-ahead:** prototype both treatments (a clipped, overflowing grey
continuation; a compact "next bar continues") and judge the screenshots; the picture beats
the invariant. Also: the sight-reading trace is the most valuable artefact, and the order
it implies is: can the generator reliably produce what the curriculum says; can the app
measure whether the learner did it; only then can that evidence change what comes next.

The go, with its boundaries:

1. Preserve the causal model: performance → observations → evidence → skill state →
   curriculum decision.
2. Do not let D2 collapse back into item completion; containing a skill is not evidence of
   mastery of it. Distinguish item demand from what the performance measured.
3. Do not design or implement the final D4 schema in Wave B.
4. Do not build the excerpt system in Wave B; D5 is a direction, not a task.
5. For the window, preserve the classifications; implement the demonstrated mechanism
   fixes first; verify the clipped look-ahead at the breakpoint by the rendered result.
6. For the P0 truth fixes: never display or record evidence the engine did not measure;
   Wait-mode observations must not acquire tempo evidence because a slider exists.
7. For sight-reading: wire the promised constraints to the generator, with tests for the
   presence of promised features and the absence of unintended hard ones; do not lower the
   curriculum's claims.
8. Keep Wave B local and causal; no opportunistic refactor of the progress or curriculum
   architecture.

Run the tests, inspect the rendered states where the change is visual, and stop after Wave
B for review. Do not dispatch Wave C.
