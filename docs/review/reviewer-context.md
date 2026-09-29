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
`F0 -> C7 -> D0 -> E`, with later G/X consuming D/E truths. F0 and C7 are closed. The frontier moves; this sentence is refreshed with the snapshot below: D0 is built and approved with one required change, D0a, whose ACCEPT releases E0 (brief approved). Verify the current frontier in `docs/review/current.md` and `docs/prompts/tasks/README.md` before every pass.

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

Current snapshot as of 2026-09-27, late afternoon (refreshed by the orchestrator at each handoff push, because the reviewer's tooling commits only under `responses/`; the live pointer is always `docs/review/current.md`):
- The T53 chain (T53, T53b, T53c), F1, Q24 and H0 are closed; every immutable handoff before D0a has a matching response.
- D0 is closed: its architecture approved (`responses/0669117.md`) and its one required change, D0a, accepted (`responses/3b9c37d.md`).
- E0 is closed: approved (`responses/f3b75b7.md`), E0a accepted (`5bfe6d2.md`), E0b accepted (`c95ac32.md`). E1 is approved with one required change (`responses/8326ff3.md`): E1a is accepted (`responses/4f7227d.md`) and E1 is closed; D4 is building (Entry 106) on its approved brief (`responses/612288e.md`), consuming the shared admission; the E2 and F2 briefs are at the gate together (`handoffs/12af708.md`), the first pair under the accelerated cadence of 2026-09-29 (`docs/prompts/plan-2026-09-25.md` §"The accelerated cadence": two builders on file-disjoint seams, builders on targeted suites, the orchestrator's chain and CI on the full ones); D4 dispatches on E1a's acceptance. E1 was built (Entry 101; five excerpts in the Library on no rung) on its approved brief (`responses/bf2666a.md`: the owner supplies neither musical review nor placement, the builder records what the rules establish, placement on a stated non-owner gate); any E1 decision using the rung-claims report uses a build of the combined branch.
- The D2 and D1 briefs are approved (`responses/7ab175a.md`; D2's record contract amended as required) ; D1 is approved with one required change (`responses/b15758e.md`), D1 is closed (D1a accepted, `responses/8a13eb1.md`; version 2 live); D3 (the generated study) is approved with one required change (`responses/ee70b43.md`): D3a is approved with one required change (`responses/c8717be.md`): D3b is approved with one required change (`responses/4478793.md`): D3c is accepted (`responses/e85c162.md`) and D3 is closed in full; D3 closes on D3c's review; D4's brief is approved with one required change, applied (`responses/612288e.md`); implementation after E1 lands; D2 is closed (`responses/7e148e0.md`); U67 (Hear it after a reload) is closed (`responses/deb0b4f.md`); D2a is closed (`responses/b118750.md`); the sequence D2 -> D1 -> E1 -> D3 -> D4 is confirmed, E2 after E1; X/G implementation does not leap ahead of D/E truths.
- The pre-dispatch gate now posts its own handoff file (`docs/review/README.md` §Brief handoffs).
- The owner's open decision: Q47, whether CI downloads the MAESTRO MIDI zip for the converter's real-recording tests; it blocks nothing.

