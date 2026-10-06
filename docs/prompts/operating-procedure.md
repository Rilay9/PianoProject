# Operating procedure

How work is decided, done and reported here, for the orchestrating session and for every
agent it briefs. Written 2026-09-25 from an outside audit of this repository's working
method (`audit-2026-09-25-outside.md`) and the owner's endorsement of it. It replaces the
eight-question checklist as the thing to run before reporting; `working-rules.md` keeps
the failure stories the rules came from and is still worth reading once.

The audit's diagnosis, in one line: the harness had become very good at proving the work
was not misreported and not equally good at deciding what the work should be. So this
document puts judgement first and evidence discipline in its service.

---

## 0. The north star

The work is not complete when the architecture is correct. It is complete when the
learner experience is substantially better: an app a competent piano teacher could look
at and say the material is musically sensible, the teaching progression makes sense, the
feedback is honest, the practice adapts to the learner, and the interface supports
actually learning to play. Every wave is judged against that sentence, and the master
backlog (`backlog-2026-09-25.md`) is how no part of it drops out of the plan.

## 1. The five rules everything else serves

1. **Solve the actual problem, not the literal request.** Restate the goal without the
   requester's words and check the plan against that. Examples in a request are examples.
2. **Understand the existing system before changing it.** Which subsystem owns this, what
   it assumes, who depends on the assumption, whether the request is a local fix or a
   symptom of the model being wrong.
3. **Form and test a causal model rather than patching a symptom.** What is wrong, what
   mechanism produces it, what evidence supports that mechanism, what else could, and what
   minimal test tells them apart. Then fix the mechanism.
4. **Verify the user-visible result, not the implementation.** A learner sees a screen,
   hears music, reads a sentence. Look at that. Green tests and valid XML are not the
   result.
5. **Be precise about evidence without letting verification replace judgement.** State
   what was observed, what was inferred and what is unverified, in one pass, and move on.

## 2. The hierarchy

Four kinds of concern used to be weighed as equals. They are not. When they conflict, the
higher tier wins, and a lower tier never interrupts a higher one.

**Tier 1, product truth.** Does this make the piano app teach better? Is the music
readable at every size, undistorted, with the next music in view? Is the intended skill
actually the one being trained? Is the learner given an appropriate next experience? Does
the screen behave as a person expects? Is the music itself right? The standing product
invariants live here: *eye over spec*, *fill with music not space*, *readability and
look-ahead paramount*, *never teach wrong*, *no internal ids on screen*, `04` §0 R1–R7.

**Tier 2, technical correctness.** Is the logic right, are the state transitions right,
do the data contracts hold, are every field's consumers handled, do the tests pass.

**Tier 3, evidence discipline.** What was observed, what was inferred, what remains
unverified. A claim's scope matches its search. Nothing about music that has not been
heard is verified; say so once and continue.

**Tier 4, process hygiene.** Hooks, commits, agent mechanics, token budget, wording,
report format. Necessary, never the reason a turn is spent.

## 3. Hypotheses are allowed

Uncertainty is not a reason to stop reasoning. The expected shape is:

> The evidence suggests X causes Y. Alternative: Z. The test that distinguishes them is T.
> I will run T, then change the mechanism the result points at.

Not: "I cannot say X causes Y because causality is not established." A named hypothesis
with its test is engineering; a refusal to name one is bookkeeping. `verifying.md` §4
still applies in full: a mechanism that explains the symptom is not yet the cause, and
the measurement that would show it wrong has to be taken before "fixed" is written.

## 4. When to ask the owner, and when not to

Ask only when the unresolved choice changes product behaviour, pedagogy or architecture
in a way that cannot reasonably be inferred from what is already written down. Otherwise
choose a defensible option, say in one line why, and continue. Do not ask about
implementation details; do not silently take a major product or pedagogical decision
either. The owner does no manual work: nothing routes to "needs a musician" or "the owner
decides" that two readers with the notation and the code could decide.

If a request addresses a symptom, say so once and keep building: "I can do that; the
deeper problem is X, and doing only this leaves Y." Then do the requested thing unless
the owner redirects.

## 5. Implemented is not solved

Compiles, renders, validates, passes, generates and displays are all necessary. None is
the goal. Ask, and report separately:

- **Technical:** the XML is valid, the transitions are right, the consumers are handled.
- **Pedagogical:** would a competent piano teacher consider the exercise, excerpt,
  progression, feedback or notation musically sensible? Does the exercise isolate the skill
  it is for, or does it drag in leaps, syncopation or a stretch the learner has not met?
  Does the lesson teach a musical idea, or explain the app?

When the pedagogical question cannot be answered from the code or the notation, mark it
unverified in those words rather than letting a structural test stand in for it. Do not
solve a content problem with more content until sequencing, prerequisites, difficulty,
feedback, transfer and selection have been ruled out as the cause.

## 6. The system is a learning system

The model to reason in is *learning objective → musical experience → performance →
evidence → updated skill state → next appropriate experience*, not *lesson → item →
completion*. When touching curriculum, progression, recommendation, mastery, scoring or a
generator, ask what the app learns about the student from the interaction and how that
changes what comes next. If the answer is "only that the item was completed", that is an
architectural limitation and is reported as one, not hidden.

Two corollaries. A stage number or an item level is not a learner's ability; be suspicious
wherever one stands in for the other. Difficulty has dimensions (reading, rhythm, range,
hand independence, leaps, texture, harmony, physical demand, visual density, memory,
interpretation, style), and a piece easy in one can be hard in another.

## 7. Fallbacks and competing definitions

A fallback keeps a screen from being empty; it must not quietly become the curriculum.
When an item cannot be found, the honest search order is: same learning objective, same
skill, same concept, same prerequisite, same musical context, the weakness the last runs
showed, similar style, and only then "anything near this level". If the code does
something blunter, name it.

When two parts of the tree define level, mastery, difficulty, skill, progression,
exercise, lesson, sight-reading or performance evidence differently, do not add a
conversion. Report "there are two definitions of X", recommend which becomes the source of
truth, and what downstream would change.

## 8. Findings are classified

- **P0** a concrete bug: the behaviour is objectively wrong.
- **P1** an architectural limitation: it works, and the model will stop the intended
  product from working well.
- **P2** a pedagogical or content improvement the architecture already supports.
- **P3** polish.

P3 never displaces P0 or P1 in a plan. Adjacent problems found mid-task are recorded,
classified and related to the task, and the task continues unless they block it.

## 9. Work incrementally; trace real data

For anything large: the underlying issue, the smallest architectural change that
establishes the right model, built, tested, its downstream consequences inspected, then
the next step. When auditing, follow one representative object through the whole pipeline
(a generated exercise from generator to next recommendation; a repertoire piece from
source to progress; a sight-reading run from level request to next assignment) and at
each stage ask: what structure, what source of truth, what is lost, what is assumed, is
the next stage given enough, is the same concept recomputed elsewhere. This finds more
than reading files in isolation.

## 10. Preserve what works

The deterministic generators, the levelling model, the catalog, the engine and the
render pipeline are substantial and mostly right. Better metadata, validation, selection
and learner modelling on top of them beats replacing them. Before replacing a subsystem,
write down what it does well.

## 10a. The first decision for every piece of work (the owner, 2026-10-03)

Every piece of this project is one of four things:
- **predefined:** a standard or a definition (MusicXML, MIDI, music-theory concepts, graded syllabi);
- **published:** findable data or content (public-domain scores, syllabus repertoire, theory texts' examples);
- **already built:** a maintained library (music21, a renderer, pitch detection, spaced repetition);
- **impossible here:** it needs a human ear or a teacher's judgement.

Before designing or building anything, say which, with a source a reader can check by one search, and act on it:
- use the standard;
- use the published source;
- use the library;
- claim less.

Hand-build only when the search shows nothing exists, and show the search. This decision comes before every other rule in this file, and a brief or a review without it is incomplete. The full rule, with its six searches and its preference order, is the first section of `CLAUDE.md` (*Reuse before reinvention*). The project-wide map is `docs/prompts/runs/CT1/reuse-map.md` (CT1 part zero).

## 10b. The solution-class gate (the owner via the reviewer, 2026-10-05)

A finding is not a task. **Do not convert a finding into an implementation task until at least one materially different solution class has been considered and the chosen class is explained.** The failure this stops is implementation-first work: turning findings into tasks for closure, keeping the existing shape because it exists, and treating green tests as proof that the product decision was good.

Before any nontrivial curriculum, content, generator or product change is dispatched, the brief answers, in a short **decision rationale** at its head:

1. **Learner problem.** What capability or experience should improve, in product words, not "row 12 says MUST".
2. **Solution classes considered.** From: existing real repertoire or excerpt; a further content quarry; a lesson or text change; a task or requirement change; reuse of an existing drill; extension of an existing generator; an external library or dataset; app behaviour or code; an external recommendation; no change.
3. **Chosen path, and why it beats the alternatives.** In particular: why generated rather than real music; why bespoke code rather than a library; why a new rung rather than a task, a transfer requirement or a lesson edit.
4. **What evidence would reverse the decision.** No answer means the first plausible idea is being implemented.
5. **Real problem or proxy.** Whether this solves the learner problem or the easiest measurable stand-in for it.
6. **Remaining uncertainty**, stated as such. *Unresolved* is an acceptable state when the learning need is known and the best implementation is not; a content search that fails does not erase the need.

Rules that follow from it:
- Real inspected music beats generated pseudo-music when both can do the same teaching job; generated drills serve controlled acquisition, real repertoire serves transfer.
- Reuse a library or dataset when it meaningfully deletes bespoke machinery; not because it exists.
- Do not preserve an existing architecture merely because it exists; do not create a new rung when a task, a transfer requirement or a lesson edit is enough.
- Do not call generator output music until the actual generated artefact has been reviewed by a reader; the owner is not that reader.
- Tests verify an implementation against its specification; they do not validate that the specification was a good product decision.
- A sample stays a sample; a sampled review is never generalised to a family or a curriculum without its denominator.
- After every research or content review, ask explicitly whether the governing plan should change before continuing the old plan.

Roles under this gate: the drafting and implementing agents write briefs and code; the orchestrator's job is decision quality and stopping implementation momentum from standing in for judgement; the outside reviewer reads the musical and curricular artefacts; the owner makes only genuine owner decisions. The loop is: find the problem, research if needed, enumerate solution classes, quarry or reuse before inventing, choose, write the rationale, implement, test, inspect the real artefact, update the plan.

## 11. Before reporting

Five questions, in tier order. A correction is owed only where the answer would change
what the owner or the next agent does; wording alone never earns a turn.

1. **Product.** Did I look at the result the way a learner meets it (the screen, the
   music, the sentence), and what would a piano teacher say about it? If I did not look or
   cannot judge, that is said in the report's first lines.
2. **Mechanism.** What caused the fault, which test distinguished that cause from the
   alternatives, and did the change act on the mechanism rather than the symptom?
3. **Evidence.** Which claims are observed and which inferred; for every "all", "none" or
   "both", what scope was actually examined and what is unchecked; for an absence ("not on
   this machine", "no such file"), the place the record says it lives, looked at, and the
   item tested directly (`test -e`, the exact path), never read off a listing; output cut by
   `head` or a limit is a sample, never grounds for "none" or "all" (a truncated listing,
   2026-10-02); what has not been heard.
4. **Consumers and record.** Who else reads what changed and what each does with it; the
   spec, test map and record updated in the same change, with the reason.
5. **Addressee.** For every request, question or claim in a paste, a brief or a report: who
   acts on it, and can they? The actors and what each can do are fixed: the owner decides
   product, pedagogy and architecture questions put in one line, relays pastes, and supplies
   no musical review and no listening; the reviewer reads text on origin and rules, checks a
   fact or a claim as written, and cannot hear, run or look; a builder builds, runs and
   measures in its worktree and cannot hear; the orchestrator briefs, judges and records and
   cannot hear; the second reader reads code against a required change. A capability no actor
   has is stated as *no one in this process can decide this* and the item stays open — never
   moved to a later actor, phase or session. A paragraph its addressee does nothing with is
   cut. An internal rule is recorded here, never announced to another actor. After the owner
   corrects something, the correction is applied and confirmed by the change itself, in one
   line, with no explanation and no apology unless asked; the owner's tokens are not spent on
   agreement.

A green suite is not evidence when its assertions encode the model being replaced: a wave
that changes behaviour deletes or replaces the tests that asserted the old behaviour, in
the same change, with the reason and the class from the test inventory
(`backlog-2026-09-25.md` area 11), and adds the test for the learner-facing result.

The technical rules that still bite every week: never assert a number measured on this
machine; never name an AI model anywhere; the specs serve the code; one Playwright suite
at a time on port 4173; `npx tsc -b`, not `tsc --noEmit -p`; commit named paths only, and
agents never commit; before re-serialising JSON compare a round-trip against the raw bytes
and splice text if it differs.
A Playwright config copy kept outside `app/` resolves `use.storageState` against the working
directory (`app/`), not the config's folder, so it names the storage state by an absolute
path (E51a, Entry 164, `responses/70043128.md`). The stored state is keyed to
`localhost:4173`, so on a lane's own port the copy rewrites its origin to that port, or the
first-sight and tour-skip flags go unread and Score specs fail behind the first-sight card (U125).
A new browser spec that imports a shared test helper (`scoreControls.ts`, `fixtures/playInTime.ts`,
`fixtures/midiMock.ts` and the like) joins that helper's reader list in `docs/prompts/checks.json`
in the same change: `test_checks_for_paths` holds every importer, and three landings in a row
missed it (G90, U122c, G90a; 2026-10-02).

**Two finished seams may share one landing chain** (the reviewer's batching rule, approved with conditions 2026-09-29, `responses/questions-b11e4f89.md`) when each keeps its own implementation HEAD, entry and handoff. The chain records the exact union of changed paths (the map's minimum over the diff from the pre-merge head to the last merge); the seam-specific targeted tests still run where the map requires them; a failure is attributed to the seam or the shared interaction that caused it, never inferred green for one seam because the combined chain passed; a shared-file merge is inspected and both contracts kept. Never batched: a workflow or deploy-gate seam awaiting review, or two seams where one's fix changes the other's expected test oracle.

**A required change may return to the same builder without a second brief review** (the reviewer's fast path, approved with a narrow definition of *required change* 2026-09-30, `responses/questions-70656183.md`) when all five hold: (1) the reviewer verdict is `APPROVE WITH ONE REQUIRED CHANGE` (or equivalent) on a seam that is otherwise accepted; (2) the required change preserves the already-reviewed architecture/product decision rather than changing it; (3) the same builder/worktree still has the seam's context and can make the fix without taking ownership of unrelated files; (4) the reviewer response itself is copied verbatim into the lane as the fix-forward instruction; (5) the fix gets a new immutable implementation HEAD, entry, handoff and post-build review exactly as today. Then the reviewer verdict is the pre-reviewed brief by construction, and no further drafting/pre-review cycle restates the same required change (the right shape: a missing guard, one wrong sentence, one test-map row, one mechanical boundary the verdict already specified). Never used when the required change opens a product choice, changes ownership/architecture, widens scope, or requires resolving new questions: those remain new lanes with a normal brief and pre-review. The builder may reuse its existing worktree and context, but seam provenance is preserved: the old implementation commit is never amended, and the first landing and the fix-forward are never blurred into one historical event.

The task index's live table and `in-flight.md`'s lane lines are generated by `tools/docs/record_mirrors.py` from the `## Record` block at the end of each brief (T58, Entry 171): a lane's status is written once there, never in the mirrors, which `--check`, `test_record_mirrors` and `docs-integrity.yml` refuse when they differ; a record script appends an event line to the block and reruns the generator; `current.md` stays a pointer.

**The orchestrator may settle a decision that is already entailed** (the reviewer's amendment 1, approved with a narrow jurisdiction 2026-09-30, `responses/questions-b96a36c8.md`; kept narrow by the addendum §9, `docs/review/path-forward-2026-09-30-addendum.md`): no pre-review is required for an implementation choice whose one answer is already determined by an existing reviewer/owner ruling, an invariant or operating rule already accepted, the current code contract plus a discriminating test, or a purely mechanical implementation choice with no product-semantic consequence. The brief/record says `Decided by the orchestrator: <decision>. Reason: <ruling / invariant / code fact / test>.`, naming the specific fact that entails it; the builder may then dispatch without a new reviewer round, and the ordinary post-build seam review still occurs. Never used for a choice that changes learner-visible product behaviour or curriculum; pedagogy or musical interpretation; ownership/architecture or a new cross-cutting abstraction; evidence, competence, material identity, history or stored-data meaning; migrations or destructive/irreversible state changes; release/deployment availability or an external contract; privacy, security, accessibility, licensing or safety; or an explicit owner preference. If two plausible choices would produce different learner behaviour, pedagogy, stored/data meaning, architecture ownership, licensing/release behaviour, accessibility/safety outcome or owner experience, it is not a code-settled choice merely because either can be implemented. This is an intentional exception to the rule that every brief is pre-reviewed: consequential briefs remain pre-reviewed; the reviewer may overturn a misuse at the next checkpoint, but *reviewable later* is not permission to make a consequential decision first.

**A follow-up does not earn a backlog row merely because a seam noticed something adjacent** (the reviewer's anti-loop rule, amendment 5, approved 2026-09-30, `responses/questions-b96a36c8.md`, *product truth* read broadly enough to include real invariants; its disposal corrected by the addendum §8, `docs/review/path-forward-2026-09-30-addendum.md`). A follow-up (1) attaches to an existing convergence cluster when that cluster owns the same product truth; (2) otherwise opens a new current row/cluster only for a concrete learner, correctness, data-integrity, accessibility, safety, security, licensing, release-reliability or recurring-maintainability truth; (3) otherwise remains an observation until the next convergence checkpoint. At the checkpoint an observation that is false, superseded, duplicate or genuinely not worth doing closes with the reason; a real but non-urgent improvement is parked in the ordinary future backlog, never pretended false or deleted; a bare P3 implementation edge, aesthetic preference, speculative refactor or test nicety never reproduces itself as overhaul-critical debt. The observation and its disposition are preserved: the goal is to stop process inflation, not to erase legitimate future ideas. The rule applies to the reviewer's follow-ups too.

**Landing chains are tiered, and their cadence follows risk and information value** (the reviewer's amendment 6, approved 2026-09-30, `responses/questions-b96a36c8.md`; its counts heuristics per the addendum §6 and §10, `docs/review/path-forward-2026-09-30-addendum.md`). *Per seam*: the discriminating tests for the changed behaviour, the changed-area unit/spec files, the path/check-map-required tests genuinely mapped to the touched files, typecheck/lint where the changed language/area requires them, and targeted content validation only when the seam changes content truth; the seam still proves its specific claim red/green, since lean never means skipping the test that distinguishes the fix. *Integration*: when interacting boundaries, accumulated changes or risk make broader evidence useful — 2–3 compatible seams a useful default, not a requirement, sooner when boundaries interact or risk is high, more when changes are truly independent and the broad proof would be identical — the broad set runs once: the full unit suite, the union of the relevant targeted browser/e2e specs, and one full content build/validate only when content, curriculum, converter, catalogue, generator, demands or pipeline truth changed or a cross-seam interaction requires it (a pure app/UI/data seam owes no content build because prior seams did). A cross-boundary test that could materially change confidence is never skipped because the nominal batch size has not been reached, and an expensive suite is never rerun because a cadence number says so when nothing relevant changed. *CI / push*: CI remains the broad independent proof on every push; a locally green whole suite is not repeated after CI for symmetry; a real interaction/load failure CI exposes is fixed forward with the smallest durable regression coverage at the owning boundary; content-changing seams are batched where file ownership and dependencies allow, rather than the identical corpus rebuilt after each independent commit. At H1 and release checkpoints the intentionally broad suite runs again under the final tree.

**The pre-action gate is mandatory** (the reviewer's addendum §4, `docs/review/path-forward-2026-09-30-addendum.md`): before a builder, the orchestrator or the reviewer dispatches work, searches for evidence, makes a decision or expands scope, seven questions — (1) the actual intent: what decision or product problem is really being solved; (2) the accumulated context: the current owner/reviewer rulings, the project's purpose and the recent work that bear on it; (3) the project's own purpose before generic norms, never a generic open-source, software-engineering, UI or pedagogy convention substituted for its established intent; (4) the decision authority: an implementation/mechanical choice, a reviewer product/architecture choice, a musical/pedagogical read or a genuine owner preference; (5) the minimum sufficient evidence: only what could actually change the decision, never interesting but non-discriminating evidence; (6) the relevance check: would someone who has followed the project consider the action obviously beside the point, redundant or already settled; (7) the success condition: the observable result that would make the action complete, stated before doing it. An answer already entailed by a current ruling, invariant or code contract with no product-semantic consequence takes the orchestrator's fast path, not another review cycle; work that survives only because an old audit row says so is re-checked against the current tree first. The gate is answered in one paragraph of the brief, never a new document or review round.

**Every task goes to the cheapest actor that can do it** (the owner's rule, 2026-09-30). What is
deterministic is a script (the record scripts, the content itemiser, the views and the mirrors).
Rote reading and checking — a landing's model-name and machine-path scan, log sizes, exit codes
present, cited files in the tree — is one cheap reader per landing, batched, never one agent per
grep. Drafting from a source — the handoff paragraphs and the entry from a builder's report, a
row from a finding — is a mid-tier writer whose draft the orchestrator reads and judges. Building,
reviewing and the second read are the strong tier. The orchestrator's own tokens buy the brief's
decisions, the judgement at a landing and what goes to the reviewer or the owner, plus a
one-command check where an agent's overhead would cost more than the command. Nothing a builder,
a chain or a script already ran is run again to reassure; its output is read.

**A required change gets a second read** (the owner's rule, 2026-09-30). A reviewer response that
plainly approves needs nothing more. One that requires a change, or that makes or requires a change
to content (a lesson sentence, a placement, a tempo, a taught claim), is read once more against the
code by a second reader before it is trusted: does the requirement hold at the lines, is it the
smallest correct change, does it contradict a prior ruling or an invariant, and is the content fact
right. The second read is recorded with the verdict. **The reviewer's verdict is evidence, not a gate**
(the owner, 2026-10-02): it is there to catch the orchestrator's blind spots. On design the orchestrator
weighs what it said against the situation, chooses the best way and goes on. A disagreement is decided,
with its reason written in the next handoff; it is never a silent override, and never a landing held for
a round trip. The read may run while
a builder already works on the change; it is not a reason to delay the dispatch.

**Keep judging whether the approach is still right** (the reviewer's doctrine, `docs/review/holistic-reassessment.md`, and `responses/b47ce498-correction-2.md`, 2026-10-01, after the landscape Score chrome failure). An accepted premise, boundary, brief, abstraction or prior ruling is never permission to stop thinking about whether the overall approach is still the right one for the learner. Step back whenever the evidence, the complexity, the learner's experience or a newly visible alternative could change the decision: state the goal without the current implementation's nouns, name the boundary being preserved and what makes it necessary, and compare a materially different shape where one plausibly exists. A solution that needs more machinery to keep an inherited boundary must earn that boundary again. This is a posture, not a gate: no count, no required number of alternatives, no pass state, and it may confirm the current approach. A builder or the orchestrator who finds the brief itself is the wrong shape says so instead of completing it; reviewer approval is the best judgement on the evidence at the time, not a shield. The two rules below are signals read under it, never rituals.

**A hotspot gets a model check** (from the reviewer's trajectory review, approved with its rewrite 2026-10-01, `responses/b47ce498.md` §2). When one surface has had three or more fix-forward lanes and a new defect appears on it, no next local fix is dispatched until its brief checks the model: are the defects accumulating around the same allocation, state or ownership mechanism, or are they independent faults that share a screen? A shared mechanism gathering special cases makes the next lane a model lane (inventory, one model, a measured migration plan). A coherent model already in place, or a defect with an independent cause, leaves a bounded local fix allowed. The count is the alarm; the shared mechanism is the reason to redesign (U122 is the first).

**A new row says where it came from** (same ruling). A row that could plausibly be related to recent work records one of: *pre-existing at `<named baseline>`*, *introduced by `<named seam>`*, *unknown*, or *not applicable*, citing the comparison when one was made. Reproducing on the immediate predecessor proves only that the newest seam did not introduce it. Content, product and design findings where tree reproduction means nothing are *not applicable*. When a historical reproduction or bisect would not change ownership, priority or the next action, the row says *unknown* with the evidence actually checked; no task is opened to earn a label.

**The post-action gate is mandatory** (the reviewer's addendum §5, `docs/review/path-forward-2026-09-30-addendum.md`): a green test, a completed tool call or a landed commit is not by itself success; after each meaningful action or seam, seven checks — (1) read back the destination or result, an external mutation not successful until the actual destination is verified; (2) compare with the original intent: the problem that justified the action solved, not merely the prescribed mechanics completed; (3) check the project context again: no owner/reviewer decision or the personal-first product purpose contradicted or silently overridden; (4) check semantic side effects on learner truth, evidence, material identity, curriculum, device behaviour or another contract outside the intended boundary; (5) check for unnecessary new work: a discovered imperfection does not automatically become a backlog obligation; (6) re-evaluate the next step: queued work the landing closed, merged, invalidated or reprioritised is updated or collapsed before it is dispatched; (7) report verification honestly, VERIFIED, NOT YET VERIFIED and HYPOTHESIS kept distinct, absence of evidence never a causal explanation. It binds the resident hot-file workflow too: familiarity with a file area gives a builder context, not permanent scope or decision authority, and after each landing residency is re-checked for whether it still saves work. The gate is answered in one paragraph of the handoff, never a new document or review round.

**Plan precedence** (the reviewer's addendum §11, `docs/review/path-forward-2026-09-30-addendum.md`): never by document type alone — the latest explicit ruling that actually owns the boundary, with explicit supersession statements honoured: (1) current owner decisions and explicit owner corrections; (2) the latest explicit correction or supersession for the affected boundary, the addendum's own included; (3) the latest reviewer response that owns the boundary and has not been superseded; (4) the latest convergence map and current dispositions; (5) the main path-forward document, for strategic rationale; (6) older wave plans and audit rows, for provenance only. Two current-looking instructions that still conflict after that stop the specific decision until the contradiction is resolved, never settled by whichever file is newer or more convenient. Under it the addendum supersedes the 70/30 familiar-to-exploratory target of `responses/questions-53670d2a.md` (§7: an adaptive objective, no fixed percentage until learner use gives a reason; backlog I3) and the strict-primary H2 split of `responses/questions-b96a36c8.md` §4 (§2: the personal build is the primary product and H2 environment, the strict build a focused delta and release gate; `responses/questions-b96a36c8-i5-correction.md` records the same correction).

## 12. The report

Judgement first, then Done / Not done / Follow-ups / Questions / Files. Under Done,
technical and pedagogical verdicts stated separately where both apply. What is unverified
sits beside what passes, not at the end. Per fix: the mechanism, the discriminating test,
the before and after measured the same way, and the red line that proves the test.

**A builder's own tests prove intent, not correctness** (the owner, 2026-10-03: "flawed tests don't tell us if a flawed process is correct"). Red-then-green on the builder's fixtures shows only that the code does what the builder meant, and so does every red and green predicted exactly. Acceptance includes an oracle the builder did not choose:
- real items picked by the orchestrator or the brief from both sides of the line;
- corpus counts by family;
- the field's established definitions;
- pictures looked at.

CL10a's fixtures were all as predicted, while its corpus diff showed scales and Hanon reading as accompaniment.

**Content and corrections are itemised** (the owner's rule, 2026-09-30). A seam that changes
what a learner is taught or hears — a lesson's text, a curriculum table, a vocabulary entry, a
score's bytes, an edition note, a catalogue fact — lists every such change for the reviewer,
one item per line: the file and line or row, the text or value before and after, and the
reason. A prose summary does not stand in for the list. The list lives beside the handoff
(`docs/review/handoffs/<impl>.content.md`, generated from the seam's diff over `content/` and
`scores/`, annotated where the diff does not say why) and the entry cites it. Batching is
fine — one file lists every item of the seam — and nothing content-side is entailed and
skipped: a correction the orchestrator makes at a landing is itemised the same way. The reviewer
checks each item as a fact or a claim in text — a lesson sentence as taught, a table entry, a
tempo as a reading of what the edition prints — and its verdict names the items it did not
check. No one in this process hears the music: not the reviewer, not an agent, and the owner
supplies no musical review (the early listening packet was withdrawn on 2026-09-30). A musical
question is settled from the notation, the edition's text and the record's rules where those
suffice; otherwise it stays open, marked *unverified as music*, and nothing is taught on it.

**Real music before generated music, where it fits.** (the owner's rule, approved by the reviewer 2026-10-01, `responses/questions-e9aa51ae.md`). Any brief that adds or keeps generated material for a musical skill states whether a **score-verified, legally usable real excerpt** teaches the same thing at that level, and why generation wins if it is kept. General knowledge may discover candidates; the score/content evidence verifies the teaching claim. Prefer repertoire first for groove, syncopation, walking bass, accompaniment, phrasing, progressions and other style/application work; prefer generation where exact constraints, graduated variation, transfer testing, availability/licensing or the learner's measured need make control more valuable. The public build ships only public-domain or appropriately licensed score material. A verified real excerpt means the actual score or cut has been checked for the teaching feature and level, not a song reputed to contain it. This is a selection rule, not a ban on generators: a mechanical drill whose value is exact control may keep generation after a short documented comparison. Existing generated material is not reopened wholesale; the rule applies when a lane adds, materially changes, or affirmatively keeps generated material for a musical skill.

## 13. What a brief carries

Every brief written here states: the goal in the writer's own words and the owner's, and
which is which; what is decided and what is the agent's judgement; the files owned and the
files not to touch; the hypothesis the writer holds and the test that would refute it, so
the agent inherits a question and not a conclusion; when to deviate from the brief (when
the premise is found wrong, say so and take the better path, recording why); and this
document's §11 and §12 by reference.


**Another approach first, for agents too (the owner, 2026-10-05).** The §10b gate binds every agent, not only the orchestrator. A brief that asks an agent to decide anything (a wording, a placement, a mapping, a classification) tells it to write, beside each decision, one materially different approach it considered and why that one loses; an agent that cannot name one hands the decision back instead of taking the first plausible idea. A builder applies its contract exactly and never widens it because nearby code is easy to fix; where a before-block does not match, it stops that edit and reports. The failure this stops is the one visible across the project's audits: rabbit holes on details while the forest goes unseen.

**Actor by kind of work (the owner, 2026-10-05).** Before dispatch, split the work by kind and give each kind to the cheapest actor that can do it: scripts for counts, shape checks and denominators; a small model for rote verification against a list; a mid model for fact-gathering (code or sources into a fact sheet), exact before-and-after text corrections and narrow ruled lanes; a large model only for judgement-heavy synthesis or a build with design in it; the orchestrator for the decision and the citation checks that drive it, never for long drafting. A document with a fact-gathering half and a judgement half is two agents. A fan-out multiplies the shared reading by its width: pre-cut each agent's inputs, group lanes, and count the overhead before launching. Every brief is saved and pushed for the outside reviewer before dispatch.

## 14. The builder's harness

A builder works in its own worktree, cut from origin's head at dispatch (the brief states
the sha), set up as the *Fresh-worktree setup* in `tasks/G86a-*.md`: `npm ci` in `app/`,
the content copied read-only from the main checkout when the lane needs it. It never
commits, pushes, stashes, resets or checks out, and never writes in the main checkout or
in another lane's worktree. Browser tests run on the lane's own port from a config copy
under the worktree's `app/build/<lane>/`, never on 4173. Temp files go under the
worktree's `build/`; no kept log over 300 KB; machine paths in kept files replaced by
`<worktree>` and `<home>`. At the end it deletes `app/dist`, `app/test-results`, the
copied caches and the config copy; `app/node_modules` stays until the orchestrator removes
the worktree, so a rework or a question needs no reinstall. It never names an AI model and
never asserts a number measured on this machine as general. Every item is done or gets an
explicit not-done line; a premise found wrong is said, and the better path taken.

A brief cites this section instead of restating it and adds only what its lane changes: a
port, a clone, a cache path. Every other rule in a brief protects something the lane can
break. The reviewer reads a brief for its product, mechanism and evidence claims, not for
its hygiene lines, so a rule copied from an earlier brief is re-read here, before the brief
goes to the reviewer, for what it protects and what it costs the builder; a rule that
protects nothing is cut.
