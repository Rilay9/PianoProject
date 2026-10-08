# The convergence charter (adopted by the owner, 2026-10-03)

This replaces `docs/prompts/content-queue.md`, CT1 and CL10a's direction as the governing plan. It defines responsibilities, not tasks.

**The target:** a trustworthy adaptive piano teacher. Its judgement comes from a deliberately chosen curriculum and trusted content and evidence. Its intelligence decides the next useful experience. It never claims to know more about the music or the learner's playing than it does.

## The gate before any lane touches code

**Should PianoProject own this responsibility at all?** Answer with exactly one of these:
- **Delegate:** a standard or mechanical fact. Use an established library or dataset, after a parity check.
- **Curate:** a teaching or content judgement. Write it as an explicit record with its source.
- **Verify narrowly:** generated material. Work from a sourced definition, through the generator's contract, to an independent structural checker. A generator saying it made Alberti is not proof.
- **Advisory only:** a fuzzy classifier may find candidates and grants no authority.
- **Unknown:** the app does not claim to know.
- **Keep:** the existing code is already the simplest trustworthy solution.

Implementation begins only after this decision.

**Published curricula (RCM, ABRSM, Faber) are inputs, not an oracle.** The path runs from the published sources, to evidence that keeps its provenance, to an explicit PianoProject teaching decision. Where sources disagree, keep the disagreement and decide deliberately. Never average them, and never let an agent decide silently.

## Where authority lives (the one disposition pass; nothing beyond these systems)

| Responsibility | Final authority | Today | Disposition |
| --- | --- | --- | --- |
| MusicXML interpretation | library | custom and parser mix | parity, then delegate where safer |
| Interval, key and chord facts | libraries | custom rules | delegate selectively |
| A rung teaches X | curated curriculum | lessons plus derived claims | make it explicit |
| A generated drill contains X | sourced checker | the generator, or a detector | verify narrowly |
| A real excerpt practises X | curated passage record | detector inference | curate |
| An arbitrary imported score contains X | unknown or advisory | broad detectors | demote |
| MIDI note and timing performance | measured | the evidence system | keep |
| Musical quality and style mastery | a human, or unknown | inference | never automatic credit |

## The freeze (in force now)

- **No new work of these kinds:** no CQ2, no detector audit, no corpus sweep, no responsibility audit of every function, no while-we're-here refactor.
- **CQ1:** a tiny cleanup if cheap, otherwise discarded. Then it stops.
- **CL12a:** kept only if it is near completion and materially improves the learner's experience; otherwise parked. No sunk cost.
- **CL17's broad migration, FSRS, generator rewrites, library migrations, curriculum reordering:** frozen until this charter's boundary is in place.
- **At most ten active blockers.** A new discovery becomes a task only if it causes a demonstrated learner-facing failure or corrupts saved state, or if it lets something be simplified. Otherwise it displaces a lower blocker or goes to the archive.

## The convergence test (every change, every week)

These four numbers must only go down:
1. responsibilities PianoProject owns that it should not;
2. learner-facing decisions that rest on unsupported inference;
3. custom musical-semantic code where a library or source could serve;
4. core learner flows left unfinished.

A change that adds classifiers, evidence types or follow-ups fails almost automatically. Convergence looks like this:
- deleting home-grown theory code behind a parity test;
- replacing "a detector says this piece teaches X" with a curated passage record;
- saying "we cannot know this for imports, so we stop claiming it".

## Then, back to the product

Once the boundary holds, effort returns to the learner's experience:
- Today behaving like a teacher;
- the Score screen excellent on a phone;
- Simon, the Lab and Jam used for a purpose;
- real-repertoire transfer;
- good lessons;
- useful progress feedback.

The house rules still apply: `CLAUDE.md`, *Reuse before reinvention*, and `docs/prompts/content-mistakes.md`.
