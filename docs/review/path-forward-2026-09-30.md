# Path forward from 2026-09-30

This is the reviewer's proposed execution plan for the remainder of the PianoProject overhaul. It is written for the current operating reality: **2–4 Claude builders at a time**, reviewer turnaround available at each real decision gate, a large audit matrix whose row count overstates the amount of distinct work, and a goal of finishing a genuinely good learner-facing piano teacher rather than mechanically closing backlog rows.

## Executive decision

Do **not** continue treating the remaining backlog as a FIFO queue of individual seams.

The next major step after the current in-flight work is a **backlog convergence pass** that turns the 342 nominal open P0–P2 rows into a much smaller set of current, non-duplicative, buildable problem clusters.

The current counts are useful as an alarm, not as a work estimate:

- ~112 open P0–P2 rows already have some ruling/decision;
- ~230 P0–P2 rows from the 2026-09-25 audit have never been properly triaged against the substantially different app that exists now;
- many rows are older descriptions of problems later architecture has changed, duplicates of later rows, product hypotheses that need a read rather than a build, or sub-findings that should close together under one seam.

The project should therefore proceed in this order:

1. **Finish and close the current frontier.**
2. **Re-triage the remaining audit against the current tree.**
3. **Convert the surviving P0/P1/P2 work into dependency-ordered clusters, not one-row lanes.**
4. **Build the highest-value learner-facing clusters with 2–3 implementation builders at a time.**
5. **Run the final H reliability/device/learner-validation waves only after the product stops moving materially.**
6. **Use H findings to fix real final defects, then stop.**

That is the fastest path that does not trade away quality.

---

# 1. Operating principles from here

## 1.1 Optimize for information and learner value, not row throughput

A row is bookkeeping. A seam is justified only when it changes a coherent product truth.

Prefer one domain-complete seam that closes 4–10 tightly related rows over five tiny seams that repeatedly make a builder reread the same files, rerun the same chain, and ask the reviewer the same architectural question.

But do **not** combine work merely because it is nearby in the backlog. Combine only when the rows share:

- the same product decision;
- the same ownership boundary;
- the same implementation mechanism;
- and the same useful verification.

If one row can invalidate another row's oracle or design, keep them separate and ordered.

## 1.2 Use 2–3 builders for production work; treat the fourth slot as elastic

The default should be:

- **Builder A:** product/content/learning-system lane;
- **Builder B:** independent UI/interaction/device lane;
- **Builder C:** independent tooling/content-pipeline lane;
- **Builder D, when available:** read-only triage, musical/source investigation, brief preparation, or a truly disjoint small build.

Do not automatically keep four production builders busy. We already have evidence that heavy parallel builders create memory/load flakes that waste verification time. A fourth builder is valuable when it increases information throughput without competing for the same machine/browser/files.

Use four production builders only when the lanes are demonstrably disjoint and their verification will not saturate the same resource.

## 1.3 Preserve strict gates where mistakes are expensive; remove ritual everywhere else

Be strict for:

- stored learner truth;
- curriculum ownership/prerequisites;
- evidence and skill-state semantics;
- material identity/history compatibility;
- automatic content eligibility;
- deployment safety;
- migrations and destructive changes;
- changes that redefine a shared architectural boundary.

Be lightweight for:

- wording corrections whose truth is already ruled;
- mechanical test-map additions;
- small styling fixes under an already-reviewed product decision;
- required-change fix-forwards where the reviewer already specified the exact correction.

The newly approved required-change fast path should be used aggressively when its conditions hold. A reviewer-required correction that preserves the accepted design goes back to the same builder/worktree; the reviewer verdict is the reviewed brief. It still gets a new immutable head, targeted verification, handoff, and post-build review.

## 1.4 Testing cadence

Per builder:

- red-first discriminating test;
- targeted unit/content/browser checks named by the changed boundary;
- local type/lint/build checks where relevant.

Per landing batch:

- union of mapped checks;
- broader unit/app build when the changed paths justify it;
- browser union where screen-level paths are involved.

Full expensive suites should happen at **integration points**, not because every five-line seam exists:

- after a meaningful 2–3 seam landing batch;
- before/after a structural migration;
- at the end of each convergence phase;
- and in H1.

A test rerun that cannot change confidence is overhead, not safety.

## 1.5 Never let audit language outrank current product truth

Every old finding must be checked against the current tree before it becomes work.

The audit matrix remains the control document in the sense that rows may not silently disappear. It does **not** mean an old diagnosis remains true forever. A row may close as:

- already fixed by later work;
- superseded by a better architectural solution;
- duplicate of another current row;
- rejected after product review;
- still real and buildable;
- still real but needing musical/device/source evidence first.

That distinction is the next major planning job.

---

# 2. Phase A — close the current frontier first

Do not interrupt the work already in flight merely to start the convergence audit.

## Current frontier

Finish, land, and review:

- **L120c** — honest sixteenth-note ownership;
- **E50a** — deterministic conversion with historical learner-identity compatibility;
- **U32** — long-piece look-ahead without delaying first paint or reshaping an active run;
- **G96** — honest no-project offers and reusable focus restoration;
- **U63** — Today reason readability plus G94 lifecycle labels;
- **Q88** — deploy guard; approved to push, then read one healthy Pages run.

Then, in dependency order:

- **L120d** after L120c, because they share the refusal table/fixture;
- **E50** after E50a, because its tempo reconversions depend on the identity compatibility contract;
- **record-generation tooling seam** approved by the reviewer, because reducing mirror maintenance pays back immediately for the remaining project.

### Why finish this group before re-triage

These lanes change several facts the audit will otherwise misclassify:

- content eligibility and curriculum ownership;
- conversion/material identity behavior;
- score rendering/read-ahead behavior;
- project-state UI truth;
- Today density/readability;
- deployment completeness.

Triaging old rows against the tree before those land would deliberately create stale decisions.

### Concurrency for Phase A

Until the current five finish, do not add more implementation lanes merely to keep utilization at 100%.

As slots free:

1. L120d occupies the content/curriculum slot after L120c;
2. E50 occupies the converter/content slot after E50a;
3. record-generation tooling may occupy an independent tooling slot;
4. spare capacity begins **read-only convergence preparation**, not another random P2 build.

---

# 3. Phase B — backlog convergence, before another large build queue

This should be added explicitly to the plan. It is now necessary.

The ~230 never-triaged P0–P2 audit rows cannot responsibly be appended behind the ~112 decided rows. The app has changed too much since 2026-09-25.

## Goal

Produce one current **convergence map** in which every open P0–P2 row is assigned to exactly one of:

1. **CLOSE — already fixed/superseded**;
2. **MERGE — duplicate/sub-finding of another current cluster**;
3. **BUILD NOW — current defect with decision already sufficient**;
4. **DECISION — current product/architecture choice needed before build**;
5. **READ — musical/source/device/learner evidence needed before deciding**;
6. **DEFER TO H — only meaningful in final integrated/device/learner validation**;
7. **REJECT — not worth building, with reason.**

No production code changes during this pass except a genuinely discovered P0 correctness defect that is unsafe to leave running.

## How to run it with 2–4 builders

Use **three read-only triage builders in parallel**, divided by ownership rather than arbitrary row numbers:

### Triage A — learning system, curriculum, pedagogy

Rows primarily in C/D/F/G/L/S/T/M that concern:

- learner evidence and rung state;
- curriculum claims/prerequisites;
- generated content purpose/quality;
- lesson truth and pedagogy;
- musicianship/transfer.

### Triage B — content/repertoire/import/identity

Rows primarily in E/R/Q and relevant G that concern:

- repertoire and excerpts;
- PDMX/source quality;
- MusicXML/MIDI conversion;
- provenance, identity, caching;
- content validation/deployment tooling.

### Triage C — UI/device/interaction/system behavior

Rows primarily in U/X/H and relevant Q/G that concern:

- score rendering;
- phone/tablet/desktop layout;
- navigation and sheets;
- audio/MIDI interaction;
- accessibility and device behavior;
- session experience outside pure curriculum logic.

A fourth agent, if available, acts as **cross-checker/synthesizer**, looking specifically for:

- duplicate rows across domains;
- rows already closed by C/D/E/F/G/X work;
- contradictory decisions;
- clusters that would otherwise touch the same files.

## Required output

Create a generated/reviewable table with one line per currently open P0–P2 row:

`row | current truth | disposition | cluster id | dependency | evidence needed | owner/files`

Then synthesize it into **10–25 clusters**, not hundreds of tasks.

That cluster count is a target, not a quota. If 40 genuinely independent high-value clusters survive, keep 40. But if 230 rows become 180 seams, the triage has failed to merge the audit into current product work.

## First triage sanity check

Recompute the stated "1 open P0" from the current tree. The backlog contains historical P0 rows that are visibly already built/closed, so the numeric summary must not be trusted until row status is normalized.

A P0 that is truly open after this pass preempts the normal cluster order.

---

# 4. Phase C — execute the surviving clusters in priority order

After convergence, stop thinking in old wave letters as the primary scheduler. Keep the wave labels for provenance, but schedule by **learner consequence + dependency**.

Use this priority stack.

## Tier 0 — correctness and irreversible truth

First:

- any genuine open P0;
- learner-state/evidence corruption;
- wrong curriculum prerequisites that cause the app to assign impossible/untaught material;
- identity/history bugs;
- destructive migrations;
- deployment/content integrity faults.

These may be architecturally small but have disproportionate cost if left underneath later testing.

## Tier 1 — core teaching loop

Next, anything that materially changes:

`learner need -> chosen experience -> material -> performance -> feedback -> evidence -> next choice`

Prioritize clusters that affect **what the learner is asked to do next** or whether the feedback is pedagogically useful.

This is where remaining old H1/H2-style concerns belong if any survive current C/D work:

- evidence actually changing future selection;
- useful diagnostic feedback rather than score-only feedback;
- well-rounded choice rather than narrow remediation;
- honest content ownership and progression.

## Tier 2 — content quality and coverage

Then:

- generated exercise musical/pedagogical quality;
- PDMX/excerpt mining quality;
- missing honest repertoire/content;
- content-source/read/import quality;
- external recommendation path where the app cannot supply appropriate material.

The criterion is not "more content." It is **better next material for a stated learner need**.

Every content cluster should answer:

1. what learner need is this serving?
2. why generated vs excerpt vs repertoire vs import vs external recommendation?
3. what validates the choice structurally, pedagogically, and musically?
4. how does the resulting performance feed back into learner state?

## Tier 3 — interaction and usability defects that interfere with practice

Then:

- score readability and look-ahead;
- session control flow;
- audio/MIDI recovery;
- navigation/sheet lifecycle;
- Today/Plan clarity;
- accessibility in active practice.

P2 cosmetics that do not affect comprehension, control, or practice should not outrun unresolved teaching/content P1s.

## Tier 4 — polish and optional breadth

Only after the above:

- low-value wording/style consistency;
- developer-only niceties without recurring cost savings;
- marginal browse/filter improvements;
- P3s unless they naturally ride in an owning seam.

---

# 5. Builder scheduling after convergence

Use a rolling **three-lane board** rather than a giant queue.

At any moment maintain:

### Lane A — learning/content

Highest-value buildable cluster involving curriculum, evidence, lessons, generators, or repertoire.

### Lane B — interaction/device

Highest-value independent UI/score/audio/session cluster.

### Lane C — pipeline/tooling

Highest-value independent converter/import/identity/tooling cluster.

### Optional Lane D

Use for one of:

- read-only musical/source investigation required for the next decision;
- device investigation;
- backlog cluster preparation;
- a tiny required-change fast path;
- a truly disjoint build with cheap verification.

Do not fill D merely to maximize concurrency.

## Dispatch rule

When a lane frees, choose the next cluster by:

1. severity;
2. dependency unblock value;
3. learner-facing consequence;
4. confidence that the problem is current;
5. independence from active lanes;
6. verification cost.

A slightly lower-severity independent cluster may run before a higher one if the higher one is blocked on a decision/read and leaving the slot idle would gain nothing.

---

# 6. Brief/review policy for the remaining work

## Full pre-review brief required when

- design freedom remains;
- the seam changes shared truth/architecture;
- multiple defensible product choices exist;
- it changes learner records or compatibility;
- it changes deployment/migration behavior;
- musical or pedagogical ownership is being asserted.

## Lightweight pre-review packet sufficient when

- the design is already ruled;
- the seam combines several rows under one previously accepted mechanism;
- the only open question is verification/scope.

## No new brief cycle for exact required-change fast paths

Use the reviewer verdict itself as the fix-forward brief under the approved conditions.

## Reviewer packets should get shorter

A handoff should contain:

- implementation head;
- what learner/system behavior changed;
- exact deviations/questions;
- discriminating evidence;
- failures/not-run that matter;
- files to inspect.

Do not repeat pages of already-approved architecture unless the implementation departed from it.

The goal is to make review more rigorous by making the signal easier to see, not by maximizing packet length.

---

# 7. Add two explicit final waves to the plan: H1 and H2

The existing plan already gestures toward H as the final audit. It should now be made explicit as **two different gates**, because they answer different questions.

## H1 — reliability and suite rebuild

Run after the substantive P0/P1 and selected P2 product clusters are finished and the app has stopped changing materially.

H1 does:

- repeat/update AT-15 against the final architecture;
- delete/replace obsolete tests rather than keeping compatibility fossils;
- verify checks-map completeness;
- attack flakes and timing-dependent assertions;
- full CI under realistic parallelism;
- clean-worktree builds;
- offline/fetch-degraded builds and deployment behavior;
- migration/backup/restore coverage;
- performance budgets by device class;
- accessibility automation where meaningful;
- verify generated views/records are reproducible.

H1's success condition is **a suite we trust**, not merely a green run.

Do not do H1 too early. Rebuilding the suite while product semantics are still changing is repeated work.

## H2 — learner walk / real product validation

This is the true final product gate.

Run several end-to-end learner journeys through the actual app, including at least:

- a new learner from placement/onboarding into the first sessions;
- a learner progressing through several rungs with mixed success;
- a learner returning after days/weeks for review/retention;
- project/repertoire use;
- sight-reading;
- generated practice;
- an excerpt/repertoire/import path;
- ear/theory/free-play where included in the intended finished curriculum.

For each journey inspect:

- what the app asks next and why;
- whether the material is appropriate and musical;
- whether feedback explains something useful;
- whether evidence changes the future sensibly;
- whether the session remains well-rounded instead of becoming remediation-only;
- whether controls/readability are good on actual target devices.

H2 also includes the **real-device matrix** that automation cannot prove:

- phone portrait and landscape;
- tablet;
- laptop/desktop;
- real MIDI keyboard;
- lock/suspend/resume audio behavior;
- 100% and increased text size;
- light/dark where relevant.

This is where recorded "unverified on device", "nothing heard", and subjective musical/UI findings are finally discharged.

### H2 rule

Every H2 finding must be classified:

- blocks release;
- meaningful fix before release;
- acceptable limitation/document;
- future enhancement.

Do not restart the entire architecture because one learner walk finds polish. Fix the smallest owning boundary.

---

# 8. Add one missing plan item: musical-quality signoff

A persistent project-level risk remains: many structural/content decisions have been proven from notation and code, while multiple handoffs explicitly say **nothing was heard** or **unverified as music**.

Before final release, add a bounded **musical-quality signoff** inside H2, not as a new giant wave.

Sample, do not exhaustively listen to everything:

- representative generated exercises from each active family and difficulty band;
- the newly admitted excerpts;
- pieces whose source/conversion/tempo/fingering changed;
- representative accompaniment/ear/theory material;
- any item specifically flagged "unverified as music" by a P0/P1 seam.

The listener's question is simple:

> Would a competent piano teacher willingly put this in front of the intended learner, at this point, for the claimed purpose?

Failures go back to the generator/content/source boundary that owns them. Do not invent another generic "music score" number.

---

# 9. What not to do

## Do not estimate remaining time from 342 rows × historical seam rate

That assumes every old row is current and independent, which is exactly what has not been established.

After the convergence pass, estimate from surviving clusters.

## Do not finish all decided P2s before triaging old P1s

A never-triaged P1 may dominate ten already-decided cosmetic P2s. Severity and learner consequence outrank paperwork maturity.

## Do not launch a 230-row implementation wave

The audit matrix is evidence inventory, not a sprint backlog.

## Do not run H1/H2 while major semantics are still moving

Use targeted checks now; save the expensive final suite rebuild and learner/device validation for a stable product.

## Do not require every historical uncertainty to be reconstructed

For example, U102 correctly preserves ambiguous legacy rows rather than spending days proving historical states that may not exist on the owner's device. Apply the same standard elsewhere: investigate historical compatibility when real data or a high-risk invariant requires it.

## Do not equate maximum builder occupancy with speed

Four builders producing merge conflicts, memory failures, and duplicated verification are slower than three clean lanes plus one analyst.

---

# 10. Concrete next schedule

## Now

Continue the current five builders and Q88 landing. No need to reshuffle them.

## As the first slots free

- content/curriculum slot -> **L120d** after L120c;
- converter/content slot -> **E50** after E50a;
- tooling slot -> **record-generation seam**;
- any additional free slot -> start a **read-only backlog convergence agent**, not another arbitrary P2.

## Once L120d/E50/current UI lanes land

Pause new product dispatch for one short convergence checkpoint while three read-only agents classify the open P0–P2 rows against the current tree.

The synthesizer returns:

- corrected open counts;
- the genuinely open P0s;
- surviving P1/P2 clusters;
- dependencies/file ownership;
- decision/read blockers;
- rows closed/merged/rejected with reasons;
- proposed first three implementation lanes.

Reviewer + owner approve that cluster map once.

## Then

Run the rolling three-lane board until the substantive cluster list is exhausted.

Every 5–8 landed clusters, do a short convergence checkpoint:

- did any later build close/obsolete queued clusters?
- did H-like integration findings appear early enough to change priority?
- are we spending time on polish while teaching-loop P1s remain?

No giant re-plan unless product truth actually changes.

## Endgame

1. H1 suite/reliability rebuild.
2. H2 learner/device/musical walk.
3. Fix H blockers and meaningful defects in small owning seams.
4. One final integration chain/CI/deploy/device smoke.
5. Freeze the overhaul and move remaining non-blocking rows to a normal future backlog.

---

# 11. Success criteria for "done"

The overhaul is done when all of these are true, not when the matrix says 693/693:

- no open P0;
- every surviving P1 is closed, explicitly rejected, or consciously deferred with a defensible product reason;
- the core teaching loop responds sensibly to evidence while remaining well-rounded;
- automatic material is honestly prepared for the learner;
- generated/excerpt/repertoire content is pedagogically and musically defensible;
- stored learner/project/material identity is trustworthy;
- phone/tablet/laptop practice is readable and controllable;
- real MIDI/audio/device behavior has been exercised;
- the final suite is trustworthy and reproducible;
- the learner walk finds no release-blocking teaching or interaction defect;
- the remaining P2/P3 list is ordinary product backlog, not hidden architectural debt.

That is a substantially better stopping rule than "close every audit row," and it matches the project's stated north star: **the learner experience is substantially better, not merely the architecture.**
