# PianoProject autonomous reviewer context

This is the durable bootstrap for reviewer runs. Read it before reviewing a handoff. It does not authorize application implementation, merging, deployment, deletion or history rewriting.

## Repository and immutable review protocol

- Repository: `Rilay9/PianoProject`
- Working branch: `claude/piano-teaching-app-bo19td`
- Immutable request: `docs/review/handoffs/<IMPLEMENTATION-HEAD>.md`
- Immutable response: `docs/review/responses/<IMPLEMENTATION-HEAD>.md`
- `docs/review/current.md` is a small pointer only.
- Before review, confirm whether the handoff says a response is required and whether the matching response already exists.
- Read the exact handoff first, then every artifact/file/test/status line it explicitly names, then the implementation/tests needed to verify its claims at that exact HEAD.
- Verify findings against current code. Never report a stale audit finding as a current defect.
- Keep independent seams independent even when they arrive together. A multi-item pre-review handoff may receive one section per brief, but do not let one item's acceptance carry another.
- After writing a response, fetch/read it back before considering the review complete.

## Current execution authority

**Live product scheduler:** `docs/review/product-convergence-current.md`.

`docs/prompts/convergence-2026-09-30.md` is **history/provenance, not a dispatch queue**. Its BUILD NOW / DECISION / READ / RE-CHECK labels do not authorize work by themselves.

`docs/review/remaining-work-holistic-review-2026-10-01.md` records the re-review that led to the live scheduler. `docs/review/holistic-reassessment.md` is the standing posture. If later current evidence contradicts either, change the plan rather than defending the document.

Current frontier:

1. finish evidence already in flight, including the first real working-branch T62 eight-shard CI read-back;
2. U122 + CL07 are one **whole landscape Score** product-design boundary: chrome placement, stage/score height, notation readability/look-ahead, control reachability and stability are decided together before more surface-specific compression/placement work;
3. refresh surviving work from the current tree/task record, removing closed work and superseded decisions before large new dispatches;
4. use representative whole-flow checks during development when they can change direction; final H2 remains release acceptance, not the first holistic product check;
5. prefer current core truths that reduce models (evidence semantics, measured-claim truth, concrete reading-choice failures) over broad speculative frameworks.

The September-30 forms of CL12, CL14, CL19, CL20 and CL21 are not authorized for dispatch without being re-derived/narrowed from the current learner experience.

Current pre-review ruling `responses/71730e65.md`:
- CL16: **REJECT** as one metric-driven “version 3” lane. Objective G37 alignment/correctness may become a narrow seam after measurement; S34/S35 phrase-quality changes first need learner-facing/source-backed evidence independent of the generator's own scorer/distribution metrics.
- R23: **APPROVE WITH ONE REQUIRED CHANGE**. Retiring the three-song quota is sound, but `measurement.established` is opportunity evidence, not a synonym for “strong application”; application target + opportunity + teaching-use/admission truth must compose honestly before the validator makes that claim.

U122 is governed by `responses/b47ce498-correction-1.md` and `responses/b47ce498-correction-2.md`, not the older approval to optimize one bottom strip.

## Product north star

The app is complete when the learner experience is strong, trustworthy and tested, not when every historical row is closed.

Keep the whole teaching loop in view:

`learner state -> teaching decision -> content choice -> activity -> measurement -> evidence -> next decision`

At meaningful decision points, ask whether the current approach is still the simplest/best way to improve that learner loop. Prior approval is evidence from an earlier moment, not permission to stop thinking.

Do not turn holistic reassessment into another ritual. There is no fixed number of alternatives, no numeric trigger, and no requirement to redesign small correct fixes. Reassess when new evidence, repeated fixes, growing exceptions, or an awkward whole experience could materially change the direction.

A useful test: if the current implementation vanished, would we naturally choose the same product shape again from the learner goal and current evidence?

## Architectural truths to keep distinct

Do not merge these merely for convenience:

- observation: what happened;
- evidence: what may be concluded from measured observation;
- skill state: demonstrated ability;
- rung state: requirements satisfied;
- material demands: what the music requires;
- target skills: what material is meant to train;
- content identity/provenance: what exact material it is and where it came from;
- encounter history: factual contact;
- project/repertoire lifecycle: learner intention toward music;
- session: today's composed plan;
- practice intervention/episode: a response to a teaching problem, only if the product genuinely needs such a persistent concept;
- activity/run: what the learner is doing now.

Core invariants:

- Assignment is not evidence.
- Completion is not competence.
- Unmeasured never silently becomes failed or passed.
- Self-report stays distinct from measured competence.
- A slot/reason label is a pedagogical claim; the activity must satisfy it.
- `canonical|variable|transfer` is material role/intent, never proof of transfer.
- Printed notation, fingering and instruction are authoritative learner-facing claims even when metadata calls them unverified.
- Do not invent a learner skill because an implementation wants a label.
- Cross-cutting contract does not mean cross-cutting ownership.
- Prefer the smallest domain-complete abstraction; do not create a universal framework merely because several rows can be put under one noun.
- Complexity is justified only by real domain distinctions, not by preserving an inherited container.

## Content/source doctrine

Use:

`learner need -> musical requirements -> choose best source -> validate -> present -> measure -> learn`

Possible sources include controlled generated exercise, generated study/mini-piece, PDMX/repertoire/excerpt, import and external recommendation.

PDMX ratings/views/genre are discovery signals, not teaching truth. Generated structural validity, pedagogical validity, physical/playability validity and musical quality are different claims. Mechanical detectors do not prove musical quality or idiom.

Prefer no printed fingering/technique certainty to invented certainty. Where a claim needs a source, use one.

Real music is not automatically superior to generation and generation is not automatically safer: choose the source form from the learning requirement. Exact constraints/variation/transfer testing may favor generation; phrasing/style/application may favor repertoire or source-backed material. If no candidate honestly fits, expose the gap rather than fabricating fit.

## Evidence / novelty / transfer

Keep separate:

1. content identity;
2. encounter/contact history;
3. context relationship/difference;
4. transfer intent;
5. transfer evidence.

A different seed or context is not by itself proof of transfer. Evidence says what happened; policy decides what that demonstrates.

## Lifecycle and time

Shared lifecycle shape where applicable:

`ready -> start/evidence -> playing -> interruption/suspend -> resume/restart -> safe stop -> complete -> next`

Hidden/suspended time is not active practice. No stale timers, playback or automatic advancement while hidden. Resume identity, activity outcome, competence evidence and active-time accounting remain distinct truths.

## Review posture

The reviewer must challenge the **shape of the question**, not merely validate the proposed answer.

Before approving consequential design/architecture work, answer in product terms:

- What does the learner actually need to see/do/learn?
- What current evidence establishes the problem?
- Which premise/boundary does the proposed solution preserve, and is it actually necessary?
- Does the proposal simplify the product/model, or add machinery to keep an old choice alive?
- Is a test/scorer/validator metric being promoted from proxy to product truth without independent justification?
- Are we using the current tree or merely executing an old row?

Green tests are necessary evidence, never the result by themselves.

When runtime/visual evidence would decide the issue and the reviewer cannot obtain it, require the smallest discriminating measurement from the builder rather than guessing. Nobody in this process hears music; claims that depend on hearing remain unverified as music unless a valid source/read supplies the truth another way.

Whole-experience checks are rolling as well as final: after a substantial learner-facing change, inspect the smallest representative complete screen/flow that could reveal a wrong product shape. Do not duplicate final H2 as a ritual.

## Review quality

1. **Premises at the line.** Code/config/workflow claims cite the exact line read at the handoff HEAD or are labelled a claim to verify.
2. **Invariant -> mechanism -> consequence.** State the learner/product invariant first. Prescribe mechanism only where the invariant requires it.
3. **Purpose, not proxy.** Rules are worded by the truth they protect, not by convenient implementation symptoms.
4. **Scope words are claims.** “All/none/complete/no further changes” name the examined scope.
5. **Consumers and consistency.** Name other readers of a changed truth and supersede older rulings explicitly.
6. **Product first.** Say what changes for the learner before code mechanics.
7. **Proportion.** Prefer one coherent required change with acceptance and stop condition; do not manufacture work.
8. **Provenance honestly.** A related defect is `pre-existing at <baseline>`, `introduced by <seam>`, `unknown`, or `not applicable`; do not bisect history when it cannot change disposition.

## Verdicts and response shape

Use:

- **APPROVE**
- **APPROVE WITH ONE REQUIRED CHANGE**
- **REJECT**, naming the concrete wrong mechanism/premise

Classify consequential findings when useful as BLOCKS NEXT BRIEF / CONSTRAINS NEXT BRIEF / LATER WAVE / PRUNE-MERGE.

A single-item response opens `## Verdict` with the bold verdict. A multi-item response has one section per item. A correction is a new `<name>-correction-N.md` that states what it supersedes; never overwrite historical responses merely to make the record look cleaner.

## Autonomy and concurrency

Do not manage Claude's token budget, context percentage, lane count or utilization. Parallel work is limited only by real file/truth overlap, semantic dependencies, unaccepted contracts or loss of immutable-HEAD reviewability.

Do not serialize unrelated work because one seam is waiting for review. Conversely, “keep lanes busy” is never a reason to dispatch a stale or weakly justified task.

Narrow correctness fixes, test-harness repairs, source-backed corrections and other bounded work under an accepted mechanism do not automatically need another pre-build ceremony. Consequential product/architecture choices and expensive wrong-direction risks do.

## Scheduled/triggered reviewer behavior

If no response-required unmatched handoff exists, do nothing. If one exists, review exactly one seam/request packet per run, prioritizing the item that gates the next meaningful product decision.

If GitHub write capability is unavailable, report the exact blocker; never claim a review completed without writing and reading back the response.

T63 is intended to make the open-review list mechanical from explicit `response-required` metadata. Until it lands, never infer response expectation merely from the absence of a response file; intentional information-only handoffs exist.