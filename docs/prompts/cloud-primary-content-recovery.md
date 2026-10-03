# Cloud-primary content recovery

Use this when local-agent quota is scarce. The cloud session is allowed to orchestrate, but the repository — not chat memory — is the source of truth.

## Roles

### Cloud foreman

One long-lived cloud session owns sequencing. It may launch subagents, but it does not let them create new roadmaps.

The foreman:
- reads `CLAUDE.md`, `docs/prompts/content-recovery-foundation.md`, `docs/prompts/content-queue.md`, and `docs/prompts/content-mistakes.md` first;
- maintains the current slice and evidence in the repository;
- writes a self-contained brief before delegating;
- launches subagents only for bounded evidence gathering, implementation, testing, or independent review;
- reconciles subagent outputs against repository evidence before accepting them;
- advances exactly one queue slice at a time;
- stops for an owner decision only when the evidence leaves a real product choice that cannot be resolved from existing requirements.

The foreman does **not** start a second content workstream because a subagent notices something interesting. It records it for the owning future slice.

### Cloud subagents

A subagent receives one narrow brief. It may not widen scope, rewrite the roadmap, or launch sibling projects. It returns evidence or a candidate implementation to the foreman.

Use cheap/research agents for:
- exact repository inventories;
- source/library searches for a stated gap;
- corpus measurements;
- independent oracle/counterexample construction;
- test execution and diff accounting.

Use a stronger builder only after the evidence brief is frozen.

Use a **separate cloud reviewer context** after implementation. The reviewer reads the immutable slice brief, exact changed files, tests/oracles and claim ledger; it does not rely on the builder's narrative.

### Local agent

The local agent is not the orchestrator. Use it only when the cloud cannot access evidence that exists locally, for example the owner's local PDMX archive or other unpushed files.

Its job is to produce a small evidence artifact for a specific cloud slice and push or hand it to the repository. It does not make project-wide decisions or start a second plan.

## One-slice state machine

For each CQ slice:

1. **FOREMAN — brief**
   - state one learner-facing proposition;
   - cite existing repository evidence already known;
   - say what remains unknown;
   - list exact files/seams allowed and forbidden;
   - define independent falsifiers and finish condition;
   - decide which bounded subagents are useful.

2. **RESEARCH/MEASUREMENT subagents**
   - answer only the questions in the brief;
   - search existing repository records before external sources;
   - report contradictions and scope limits;
   - do not write production code.

3. **FOREMAN — evidence decision**
   Choose KEEP / NARROW CLAIM / RETIRE / REPLACE / DEFER before broad implementation.

4. **BUILDER subagent**
   - implements only the decided slice;
   - changes only permitted files;
   - runs the discriminating tests and required catalogue/claim diff;
   - records remaining unknowns.

5. **INDEPENDENT CLOUD REVIEWER**
   - reads the exact brief first;
   - inspects all named artifacts and changed code/tests;
   - checks learner-facing semantics and prior evidence;
   - returns APPROVE / REQUIRED CHANGE / BLOCKING / QUESTIONS ONLY;
   - never expands the slice into a project-wide redesign.

6. **FOREMAN — land or fix-forward**
   - if approved, update convergence counts and advance the queue;
   - if one narrow required change, fix only that and re-review;
   - if blocking because the premise is wrong, discard/re-scope the slice rather than inventing a larger architecture.

## Rules that prevent cloud drift

- The foreman may use many cloud agents; **the unit of progress is still one reviewed slice.**
- More agents may parallelize evidence collection inside that slice, not create parallel product directions.
- Existing repository measurements win over a fresh casual remeasurement unless the new work identifies a concrete defect in the old measurement.
- A library/data candidate is not a mandate to replace working code.
- Do not ask the owner to choose among implementation ideas until repository evidence has eliminated the choices it can eliminate.
- Do not consume local-agent quota for information already available on GitHub or the public web.
- If local-only data is needed, ask for one exact query/output, not a general local audit.
- Every useful result must be written to the repository before the cloud context ends.

## Owner interruption threshold

Do not interrupt the owner for:
- which library to use when one is objectively safer under the project's rules;
- whether to keep correct existing code versus an equivalent replacement;
- source lookup details;
- corpus candidate searches that can be performed from accessible data;
- implementation mechanics covered by established project invariants.

Interrupt only for a genuine product choice with materially different learner behavior after the evidence is presented, such as a curriculum reorder where credible sources disagree and project requirements do not settle it.

## Local-only evidence protocol

When the cloud needs the owner's local PDMX archive or another local file, write a request under the current CQ entry containing:
- exact command/query;
- exact output fields needed;
- why the result can change this slice's decision;
- maximum scope (for example, candidate titles for one concept only).

The local agent runs only that request and returns/pushes the result. No exploratory local research project.

## Current starting point

Start with `docs/prompts/content-queue.md` CQ1. The old giant CT1 session is evidence to salvage, not the active roadmap.
