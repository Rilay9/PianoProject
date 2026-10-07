# Holistic reassessment doctrine

This is a standing working posture for the PianoProject orchestrator, builders, and reviewer. It exists because a well-tested local premise can still be the wrong frame for the product.

## The principle

**Do not treat an accepted premise, boundary, brief, abstraction, or prior ruling as permission to stop thinking about whether the overall approach is still right.**

At any meaningful point in the work, use the evidence accumulated so far to step back and reassess the whole problem at the level the learner actually meets it. A design can be technically coherent, thoroughly tested, and faithful to previous decisions while still optimizing the wrong shape of solution.

The central questions are not a checklist to satisfy once. They are questions to return to whenever the work gives a reason:

- What are we actually trying to improve for the learner?
- Is the current approach still the simplest and best way to achieve that outcome?
- Which assumptions, boundaries, ownership decisions, or product shapes are we preserving only because earlier work preserved them?
- Has new evidence changed what we should believe about the problem?
- Is complexity increasing because the domain is genuinely complex, or because we are forcing the product through the wrong decomposition?
- If we ignored the current implementation for a moment, would we naturally design the same thing again?
- Are we proving the chosen approach, or testing whether it deserves to remain the chosen approach?

## When to step back

There is deliberately **no numeric trigger** and no fixed ritual. Reassessment is appropriate whenever it could materially change the decision. Common signals include, but are not limited to:

- repeated fixes on the same user-visible experience;
- a growing collection of exceptions, clipping rules, special states, adapters, or compensating logic;
- a design discussion that spends more effort preserving a container than serving its purpose;
- tests becoming increasingly elaborate around one awkward behavior;
- a new finding that makes an older architectural assumption less convincing;
- a solution that is locally elegant but awkward when viewed across the whole learner journey;
- a reviewer or builder finding themselves asking only “does this implementation satisfy the brief?” rather than “is this still the right brief?”;
- a simple product alternative that was never considered because the implementation vocabulary constrained the discussion.

These are prompts to think, not automatic redesign commands. A reassessment can legitimately conclude that the current approach is still right.

## What reassessment is allowed to reopen

When the evidence warrants it, reassessment may reopen:

- the scope of the seam;
- which surface owns information or controls;
- module or state ownership;
- the abstraction being optimized;
- whether information should be persistent, transient, hidden, moved, or removed;
- whether a prior local invariant was actually a product invariant or merely an implementation consequence;
- whether several “independent” defects are symptoms of one wrong model;
- whether the task should be deleted, merged, reframed, or replaced by a different solution.

Prior review still matters: do not casually overturn settled product truth, pedagogy, evidence semantics, safety/accessibility requirements, or owner decisions. But prior implementation shape and local layout/architecture choices are not sacred simply because they were previously accepted.

## Product-level comparison before implementation cleverness

When more than one plausible approach exists, compare them first by the learner-facing outcome and the whole-system consequences. Only then optimize implementation details.

For interface work this means looking at the complete screen and task, not just the failing row or widget. For architecture it means following the truth through its consumers, not merely making the owning module internally neat. For teaching/content it means following the learning loop, not merely satisfying the generator or validator.

A solution that needs more machinery to preserve an inherited boundary must earn that boundary again.

## Reviewer posture

The reviewer is responsible for challenging the *shape of the question*, not merely checking the answer. A review can reject or widen a brief even when every stated requirement is internally coherent, if those requirements are optimizing a product shape that no longer appears justified.

The reviewer should continually ask whether accumulating evidence changes the earlier judgement. Approval is not a promise never to revisit the premise; it is a judgement made from the evidence available at that point.

## Builder/orchestrator posture

Builders and the orchestrator should not treat reviewer approval as a shield against product judgement. If implementation work exposes a simpler or more coherent product shape, stop long enough to surface it instead of faithfully completing an increasingly awkward approved plan.

Likewise, do not manufacture alternatives merely to demonstrate compliance. The goal is active judgement, not a required number of options.

## Canonical failure example: landscape Score chrome

Hiding the full landscape Score header to recover scarce height for notation was a defensible decision. Over time, the process implicitly converted that local decision into a stronger premise: because the full header is hidden, nearly all context, status, and controls must fit in the bottom bar. Multiple lanes then became increasingly sophisticated at fitting that premise.

The mistake was not insufficient testing of the bottom bar. The mistake was failing to step back and ask whether the information still belonged in that one surface at all.

That is the class of failure this doctrine is intended to prevent.