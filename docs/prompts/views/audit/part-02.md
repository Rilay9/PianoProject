===== PART 2: THE REVIEWER'S NOTES ON THE PLAN (2026-09-25, relayed by the owner) =====

Verdict: the direction is right; no wholesale rethink. Keep diagnosis-then-stop as the
first move and make it stricter: **Wave A modifies no production code.** The purpose is
to establish what is true before the eight hypotheses become architectural assumptions.
The process must be hypothesis → trace → evidence → confirm or refute → only then design.

The correction, in the reviewer's words (lightly compressed):

1. The three traces (generated exercise, repertoire/PDMX, sight-reading) are appropriate.
   Each must follow the object far enough to answer: source → analysis → catalog →
   selection → session → rendering → performance → scoring → feedback → progress/evidence
   → next recommendation. The architectural question is whether learner performance
   produces useful evidence that changes the learner model and therefore the next
   experience, and whether the answer differs by content type.
2. T36a traces the exercise back through the generator: inputs, intended target skill,
   generated structure, validation, difficulty assignment, catalog metadata, curriculum
   selection. Determine whether the generator guarantees the intended skill is present,
   what unintended skills it introduces, and whether its difficulty is measured, inferred
   or declared. Also inspect the exercise's relationship with lesson content and
   instructional writing where applicable.
3. T36b determines whether PDMX is modelled only as whole-piece repertoire or whether the
   architecture can represent meaningful excerpts independently. No excerpt mining yet;
   establish what the current data model can and cannot represent.
4. T36c distinguishes generator constraints from pedagogical difficulty. Document what
   "level" actually controls in the sight-reading generator and whether that value is
   then treated as learner ability, exercise difficulty, or both. "Level 4 → range X, leap
   Y, rhythm Z" does not by itself mean "appropriate for a level-4 learner".
5. A hypothesis that survives a trace is not proven, only supported by the inspected
   evidence. Report each as supported by observed evidence / contradicted by observed
   evidence / unresolved, and say what was observed. "Is stageNumber used as level?" is
   already known; the causal question is whether that substitution produces incorrect
   selection under real learner states.
6. After the traces, a small cross-cutting source-of-truth table: learner level,
   difficulty, skill, mastery, performance evidence, repertoire level, curriculum stage.
   For each: current source of truth, major consumers, competing definitions. Fix nothing.
7. The eight hypotheses must not constrain the audit so that contradictory evidence is
   overlooked. The traces are an investigation, not a confirmation exercise; a different
   architectural problem, if the evidence points there, is recorded.
8. The two red window-fit specs are not "known red that T35 will fix". Classify each as
   implementation bug / incorrect or outdated spec / test bug / intentional behaviour
   requiring a changed invariant, before any fix, and do not assume the current
   hypothesis is correct. A knowingly broken baseline before an audit is not to become
   normal workflow.
9. Wave A read-only. The deliverable is a factual diagnosis the owner reviews before
   implementation.

What the reviewer wants to see next from the assistant: hold a hypothesis loosely, trace
the actual code, discover something that contradicts the initial model, and change the
model. Increasingly elaborate evidence that the original hypotheses were right is the
failure to watch for. Preserved as good: stopping at the review gate the owner asked for,
and writing the correction into memory.
