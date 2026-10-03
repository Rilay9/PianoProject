# Standing anti-drift checklist (the owner, 2026-10-03)

**Preflight.** Before acting, name five things:

1. the current plan step;
2. the unit of work;
3. the learner problem;
4. the ownership/reuse disposition;
5. the finish condition.

If you cannot state all five in five short lines, do not act. After finishing, stop rather than selecting another task.

Apply the checklist below before every substantive action, again whenever new evidence changes the problem, and once more before reporting completion.

1. **Intent.**
   - What is the owner trying to achieve for the learner?
   - Am I solving that, or the wording of an old task, audit row, test, brief or document?
   - Is this action necessary for the current approved plan?
   - If I do nothing, what learner-facing problem remains?

   If there is no concrete answer, stop. Do not invent work.

2. **Plan lock.**
   - Which numbered step of the approved plan am I executing, and does this action belong to it?
   - Has the plan authorised implementation, or only research, planning or review?
   - Am I starting work from an older queue, branch, brief or audit just because it exists?
   - Am I advancing to the next step without the required handback?

   An action outside the current step is not done. A newly discovered issue is evidence, not a task.

3. **Unit of work.** State it in one sentence.
   - Good: "verify generated eighth-note exercises as a class"; "find suitable real-music transfer for this learner need".
   - Bad: "review every item in rung 2.3"; "fix the next failing song"; "continue down the audit table".

   Look at an individual piece only when needed to choose or verify a small candidate set. Never turn examples into a queue. Never continue just because another piece remains.

4. **Systemic or instance.** Before fixing a defect, ask:
   - Is it one bad item, or a class?
   - Can the class be checked mechanically?
   - Can one upstream fix prevent many downstream defects?
   - Can a standard, library or source remove the responsibility?
   - Would editing the one item hide the systemic problem?

   If it is systemic, fix or delegate the mechanism once, then measure its breadth. Never one task per affected item.

5. **Ownership and reuse.** Ask:
   - Should PianoProject own this at all?
   - Is the truth defined by a standard?
   - Is there published data, a maintained library or a reference implementation?
   - What are its known problems for this exact use?
   - Can an independent mechanism verify the result?
   - What custom code or maintenance would reuse delete? If nothing, why add it?
   - Is the rest mechanical truth or musical/pedagogical judgement?

   Choose KEEP, DELEGATE, CURATE, VERIFY NARROWLY, ADVISORY ONLY or UNKNOWN. "There is a library" never starts a migration by itself.

6. **Evidence.** Ask:
   - What current evidence proves the problem, and is it from the current tree?
   - Does it establish the defect or only suggest it?
   - Could later work have made it stale?
   - Can I reproduce the smallest discriminating case first?
   - What evidence would change my solution?

   Never implement from an old finding without checking that it still matters.

7. **Authority.** Keep four propositions apart:
   - this music contains X;
   - it is suitable practice for X;
   - the learner demonstrated X;
   - it belongs at this curriculum point.

   And:
   - A detector finds candidates; it does not grant pedagogy.
   - A generator never certifies itself.
   - Catalogue metadata nominates; it does not approve.
   - A published curriculum is evidence, not universal truth.
   - Unknown is not absent.
   - Inability to verify never justifies inventing a heuristic.

8. **Research before invention.** Before creating or retuning any of these:
   - a detector;
   - a threshold;
   - a classifier;
   - a generator rule;
   - a curriculum rule;
   - a difficulty measure;
   - a musical-quality score;

   ask whether there is already a published definition, established practice, research, software, a standard dataset or known counterexamples. Research only enough to change the decision. No giant surveys.

9. **Complexity.** Before adding code, state, schema, tests or docs, ask:
   - What responsibility does this remove, and does the whole get simpler?
   - Are exceptions multiplying?
   - Am I keeping an inherited architecture only because it is there?
   - Would I design the same thing from scratch?
   - Is deleting or weakening the claim simpler than supporting it?

   If complexity rises without removing more, stop and reassess.

10. **"Million rules" warning.** Another exception, per-piece rule, state taxonomy, special threshold, compatibility adapter, document about documents, or test that only preserves an awkward detail: pause and ask whether the model is wrong. Repeated sophisticated local fixes are evidence for reassessment.

11. **Test oracle.** Ask:
    - What independent truth makes the expected result correct?
    - Is the test checking domain truth or freezing today's implementation?
    - Did the test and the code come from the same invented premise?
    - Can a standard, library, reference or counterexample be the oracle?

    Use property or adversarial tests where they replace repetitive examples. Green tests do not prove musical or pedagogical correctness.

12. **Content.**
    - **Generated material:** a sourced contract, then the generator, then an independent checker, then property/adversarial verification. Musical judgement only where needed.
    - **Real repertoire:** the learner need, then source research, then a small candidate set, then the actual score and passage inspected, then a curated teaching-use decision.
    - **Lessons:** a fact is sourced; an unsupported claim is sourced, weakened or removed; a judgement is curated explicitly.

    "The AI thinks it sounds appropriate" is never authority.

13. **Scope creep.** Before touching an adjacent issue, ask:
    - Does the approved step require it?
    - Would leaving it make the current result false or unusable?
    - Is another seam responsible for it?

    If not, record it as evidence if useful, and leave it alone.

14. **Dirty tree.** Before tests or conclusions, ask:
    - Is the tree in a known state?
    - Are generated files being rewritten?
    - Are unrelated experimental edits present?
    - Am I mixing evidence from two branches or builds?

    If so, clean or isolate first. Never read a full-suite count from a tree that was being changed while the suite ran.

15. **Test cost.** Run the smallest test that could change the decision. Batch expensive suites once related changes have stabilised. Never rerun a giant suite out of ritual. Never skip broader verification when a change crosses boundaries.

16. **Before committing.**
    - State:
      - the learner problem solved;
      - the mechanism changed;
      - why this was the smallest sufficient change;
      - what was deliberately not changed;
      - the reuse/ownership decision;
      - the evidence before and after;
      - what remains unknown.
    - Check that no unrelated generated reports, fixtures or docs changed.
    - Check that no follow-ups were created just because I noticed things.
    - Check that the commit holds only the approved step.

17. **Before declaring completion.** Check the approved finish condition literally. Then ask:
    - Did I solve the learner problem, or only make tests green?
    - Did I inspect the learner-facing result where judgement matters?
    - Did unsupported authoritative claims decrease?
    - Did custom responsibility decrease or stay justified?
    - Did active work shrink?
    - Did I create more follow-ups than I closed?

    If the work grew the project without product benefit, it is not convergence.

18. **No automatic next task.** After the current step, STOP. Do not:
    - advance to the next rung;
    - pick the next audit finding;
    - start the next family;
    - clean up an adjacent subsystem;
    - launch an "obvious" follow-up;
    - use the remaining time on something else.

    Hand back. The next step comes from the approved plan or the owner, not momentum.

19. **Correction rule.** When corrected:
    - name the underlying process failure;
    - change future behaviour;
    - check nearby work for the same mistake.

    Examples: corrected for reviewing pieces individually, stop item-by-item progression, not just the current piece; corrected for trusting a detector, revisit the authority boundary, not only its threshold.

20. **Final stupidity check.** Would a competent project lead, knowing the goal and everything learned, see this as redundant, premature, overengineered or aimed at the wrong level? Is there a simpler way to the same confidence or learner outcome? If yes, do the simpler thing.
