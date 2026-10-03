# The anti-drift checklist (the reviewer, adopted by the owner, 2026-10-03)

The five-line preflight at the top of `CLAUDE.md` is the part to run every time. This list is the full version behind it: use it before a substantive action, again when new evidence changes the problem, and once before reporting.

1. **Intent.** What is the owner trying to achieve for the learner? Am I solving that, or satisfying the wording of an old task, audit row, test or brief? If I do nothing, what learner-facing problem remains? With no concrete answer, stop.
2. **Plan lock.** Which numbered step of the approved plan is this? Does the action belong to it? Is implementation authorised yet? Am I starting from an older queue or audit because it exists? A new discovery is evidence, not a task.
3. **Unit of work, in one sentence.** Good: "verify generated eighth-note exercises as a class". Bad: "review every item in rung 2.3", "fix the next failing song". Never continue piece by piece because another piece remains.
4. **Systemic or instance.** Is this one bad item, or a class? Can one upstream fix, or a standard, library or source, remove the class? Fix the mechanism once and measure its breadth; never one task per item.
5. **Ownership and reuse:** the charter's gate and `CLAUDE.md`'s *Reuse before reinvention*. Decide KEEP, DELEGATE, CURATE, VERIFY NARROWLY, ADVISORY ONLY or UNKNOWN. "There is a library" is never by itself a migration.
6. **Evidence.** What current evidence, from the current tree, proves the problem? Could later work have made it stale? Reproduce the smallest discriminating case first.
7. **Authority.** "Contains X", "is suitable practice for X", "the learner demonstrated X" and "belongs at this curriculum point" are four propositions. Detectors find candidates. Generators never certify themselves. Metadata nominates. Published curricula are evidence. Unknown is not absent.
8. **Research before invention** of any detector, threshold, classifier, generator rule, curriculum rule, difficulty measure or quality score. Research only enough to change the decision.
9. **Complexity.** What responsibility does new machinery remove? Are exceptions growing? Would I design this without the inherited vocabulary? Is weakening a claim simpler than supporting it?
10. **Too many rules.** Another exception, per-device rule, taxonomy, threshold, adapter or meta-document means: ask whether the model is wrong.
11. **Test oracle.** What independent truth makes the expected result correct? Is the test freezing today's implementation? Green tests do not prove musical or pedagogical truth.
12. **Content paths.**
    - **Generated material:** sourced contract, then generator, then independent checker, then property tests.
    - **Real music:** learner need, source research, a small candidate set, the actual passages inspected, a curated decision.
    - **Lessons:** source a fact; source, weaken or remove an unsupported claim; curate a judgement.
13. **Scope creep.** Does the approved step need this adjacent fix? If not, record it as evidence if useful and leave it.
14. **Dirty tree.** Is the tree known and isolated? Never read a full-suite count from a tree being rewritten underneath it.
15. **Test cost.** Run the smallest test that can change the decision now. Batch the expensive suites, but never skip them when a change crosses boundaries.
16. **Before committing,** state:
    - the learner problem;
    - the mechanism changed;
    - why this is the smallest sufficient change;
    - what was deliberately not changed;
    - the reuse decision;
    - the evidence before and after;
    - what is unknown.

    The commit contains only the approved step.
17. **Before declaring completion,** check the finish condition literally:
    - Did unsupported claims decrease?
    - Did custom responsibility decrease or stay justified?
    - Did active work shrink?
18. **No automatic next task.** Stop and hand back. The next step comes from the plan, the owner or the reviewer, never from momentum.
19. **On correction,** fix the process failure behind the instance, and check nearby work for the same mistake.
20. **The final check.** Would a competent project lead, knowing everything already learned, call this redundant, premature, over-engineered or aimed at the wrong level? Is there a simpler way to the same confidence or outcome?
