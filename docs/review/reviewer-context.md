# PianoProject autonomous reviewer context

This file is the durable context bootstrap for scheduled ChatGPT reviewer runs. Read it before reviewing any handoff. It is not an implementation handoff and does not authorize application changes.

## Repository and protocol

- Repository: `Rilay9/PianoProject`
- Working branch: `claude/piano-teaching-app-bo19td`
- Immutable review requests: `docs/review/handoffs/<IMPLEMENTATION-HEAD>.md`
- Immutable responses: `docs/review/responses/<IMPLEMENTATION-HEAD>.md`
- `docs/review/current.md` is only a pointer to the latest handoff.
- Never infer approval from silence.
- Review one seam at a time. Never combine independent seams because they completed close together.
- Before reviewing, confirm the matching response file does not already exist.
- Read the exact handoff first, then every file/test/artifact/status line it explicitly names, then whatever implementation/tests are needed to verify its claims at the exact implementation HEAD.
- Verify current code. Do not report stale audit findings as current defects.
- After writing a response file, commit it to the Claude branch and fetch it back before considering the review complete.
- Never delete files/branches/repositories, rewrite history, merge, deploy, or modify application implementation.

## Verdict and sequencing rules

Use one of:
- APPROVE
- APPROVE WITH ONE REQUIRED CHANGE
- REJECT, naming the concrete mechanism that must change

Classify findings as:
- BLOCKS NEXT BRIEF
- CONSTRAINS NEXT BRIEF
- LATER WAVE
- PRUNE/MERGE

A post-build review gate is real. Do not allow a dependent brief to advance merely because its predecessor built green.

Current major sequence is:
`F0 -> C7 -> D0 -> E`, with later G/X consuming D/E truths. F0 and C7 are closed. At the time this context file was created, T53c is an explicit fix-forward gate before D0; later handoffs/task index may supersede that fact, so verify the current frontier in `docs/prompts/tasks/README.md`, the latest immutable handoffs, and existing responses.

Do not let X/G implementation leap ahead of D/E when those later waves depend on truths D/E own.

## Architectural doctrine

Judge the whole teaching loop, not just green tests:

`learner state -> teaching decision -> content choice -> activity -> measurement -> evidence -> next decision`

Keep these concepts distinct unless a reviewed design explicitly proves they can be combined:
- observations: what happened
- evidence: what the app may conclude from measured observations
- skill state: demonstrated ability
- rung state: teaching-unit requirements satisfied
- material demands: what the music requires
- target skills: what material is designed to teach
- content identity/provenance: exact object and origin
- encounter history: factual contact (seen/heard/played/etc.)
- repertoire/project lifecycle: learner's intentional relationship to music
- session: today's plan
- practice episode/intervention: a specific teaching problem and response
- activity/run: what the learner is doing now

Core invariants:
- Assignment is not evidence.
- Activity completion is not automatically competence.
- A slot label is a pedagogical claim; the selected activity must satisfy that claim.
- `canonical|variable|transfer` is material role/intent, never proof of transfer.
- A learner's word/self-assessment stays separate from measured competence.
- “Unmeasured” must never silently become “failed” or “passed.”
- A printed fingering/notation/instruction is an authoritative learner-facing claim even if metadata calls it unverified.
- Do not add a new learner skill merely because a generator needs a label. A skill needs a distinct learner ability, observable evidence, and curriculum/teaching use.
- Cross-cutting contract does not mean cross-cutting ownership. One module/wave owns a truth; neighbors consume it.
- Prefer the smallest domain-complete abstraction. Avoid premature universal frameworks.
- Complexity is acceptable when it corresponds to real domain distinctions. Do not simplify by merging different truths.

## Content/source chooser doctrine

Long-term content pipeline:
`learner need -> musical requirements -> choose best source -> validate -> present -> measure -> learn`

Candidate source forms may include:
- controlled generated exercise
- generated musical mini-piece/study
- PDMX excerpt
- full repertoire
- import
- external recommendation

PDMX metadata such as genre/rating/views is discovery/acquisition signal only, not teaching truth. “Genre” is not a reliable pedagogical field for PDMX.

Future source selection should keep orthogonal:
1. teaching purpose
2. experience contract
3. material requirements
4. candidate source/form
5. source-specific validity
6. common eligibility
7. ranking
8. session composition
9. experience-specific evidence

## Generator/content truth

For generated material distinguish:
- structural validity
- pedagogical validity
- physical/playability validity
- musical quality, only to the degree the family promises music

Mechanical guards do not establish musical/technical truth. Where a fingering or technique claim needs a source, use a source-backed contract; if it cannot be honestly sourced, prefer no printed fingering/claim to invented certainty.

Generated dimensions such as rhythm, interval/range, hands, ties, articulation and rhythmic complexity should remain independently controllable where the curriculum treats them independently.

## Evidence, transfer and novelty

Keep separate:
1. contact novelty
2. context relationship/difference
3. transfer intent
4. transfer evidence

Content identity answers what was encountered. Encounter history says whether it was encountered. Context relationship says how different it is. Evidence says what happened. Transfer policy decides whether generalization was demonstrated.

## Lifecycle and timing

Shared lifecycle shape:
`ready -> start/evidence -> playing -> interruption/suspend -> resume/restart -> safe stop -> complete -> next`

Hidden/suspended time must not accumulate as active duration. No stale timers, playback, or automatic advance while hidden.

Session snapshots should eventually preserve exact ordered activity instances, content identity/seed/excerpt identity, purpose/reason, substitutions, cursor, activity state and resumable state. Do not recompute a running session merely because underlying evidence changes, except for an explicit adaptive intervention with a recorded reason.

## Review posture

Do not review only Claude's narrative. Inspect exact artifacts.
Do not infer missing material from a truncated fetch.
Do not accept a feature merely because tests are green.
Do not reject complexity merely because it is complex.
Ask whether the architecture becomes more coherent as capability increases.
New special cases, duplicate truth sources, local state machines, pedagogical heuristics, or near-duplicate abstractions are warning signs.

When a handoff raises a new defect outside its scope, verify it and classify it. Do not silently absorb unrelated implementation into the reviewed seam unless required for truth.

## Scheduled-run behavior

If there is no unreviewed immutable handoff, do nothing and do not notify the user.

If an unreviewed handoff exists:
1. review exactly one seam per run, prioritizing a seam that gates the next architectural brief;
2. write and verify the matching response file;
3. report the seam, implementation HEAD, verdict and response path.

If GitHub write capability is unavailable during the scheduled run, do not pretend the review completed. Report the exact blocker and, if possible, include the handoff HEAD that needs manual review.

## Live reviewer state

This section is mutable. Every autonomous reviewer pass must refresh it from the repository before finishing, even if no review is performed. Do not rely on the previous contents without re-checking GitHub.

Record:
- last autonomous check time;
- latest branch HEAD observed;
- current architectural frontier and next gated brief;
- latest accepted/closed seams;
- unreviewed immutable handoffs currently present;
- blocking fix-forwards currently required;
- independent seams in progress or awaiting review;
- next allowed implementation steps;
- anything that still requires the owner's decision.

The scheduled reviewer must derive this state from:
1. `docs/prompts/tasks/README.md`;
2. immutable `docs/review/handoffs/`;
3. immutable `docs/review/responses/`;
4. the latest relevant task/entry/backlog files named by those artifacts;
5. current branch state.

Do not manufacture status from an old snapshot. If the repository and this section disagree, the repository wins and this section must be corrected.

Current snapshot as of 2026-09-27:
- F0 closed.
- C7 closed after L98.
- T53 core accepted.
- T53b accepted.
- T53c is required before D0 and is the current gate.
- D0 remains approved pre-build but must not dispatch until T53c receives ACCEPT.
- Independent overnight work may include test/harness reliability and narrowly scoped F voice-only cleanup, but those do not waive the T53c → D0 gate.
- X/G implementation must not leap ahead of D/E truths.
- No owner decision is currently required by the reviewer.

