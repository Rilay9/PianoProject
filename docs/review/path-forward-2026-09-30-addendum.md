# Addendum to `path-forward-2026-09-30.md`

This addendum changes and clarifies the main path-forward document. It is the authoritative execution correction where the main roadmap or later reviewer responses conflict with it.

The strategic shape of the roadmap stands: use the convergence map rather than the raw backlog, keep useful implementation moving while reconciliation happens, schedule by learner consequence and dependencies, finish with H1 and H2, and stop when the product is good rather than when every historical row is closed.

## 1. Do not stop all production for backlog convergence

The main roadmap says, near the concrete schedule, to pause new product dispatch for one short convergence checkpoint after L120d/E50/current UI work lands.

**Replace that with a rolling pipeline.**

Once the current frontier begins freeing slots, run convergence and implementation in parallel:

- with 4 agents: normally 2 implementation + 2 reconciliation, or 3 implementation + 1 reconciliation when the next three seams are truly independent and already decided;
- with 3 agents: 2 implementation + 1 reconciliation;
- with 2 agents: 1 implementation + 1 reconciliation until the canonical P0/P1 queue is reliable, then 2 implementation when dependencies make that the better use of capacity.

Do not wait for all old rows to be classified before using the results. As soon as a reconciliation batch identifies a current high-value cluster with settled ownership, it may proceed while the next batch continues.

The first convergence pass has now happened. `docs/prompts/convergence-2026-09-30.md`, as amended by its reviewer responses, is the current scheduler. The main roadmap's Phase A/Phase B and "pause for convergence" schedule are now historical explanation, not live dispatch instructions.

Refresh the convergence map when enough product truth has changed to make the refresh useful. The earlier suggestion of every 5 to 8 landed clusters is a heuristic, not a quota. Refresh earlier if a major landing collapses many RE-CHECK rows, and later if several small landings do not change queued truth.

## 2. Personal product first; strict/public is a delta and release gate

The app's owner-facing product is the **personal build**, which is the broad content superset. The strict build uses the same application and curriculum machinery while replacing content that cannot be publicly redistributed with placeholders.

Therefore:

1. **Primary H2 device/interaction session:** personal build.
2. **Primary H2 musical/learner session:** personal build.
3. **Strict/public build:** a focused delta and release-readiness pass covering behavior that can differ because material is absent/placeheld or because the deployment path differs.

The strict delta should cover:

- known availability-dependent curriculum or claim gaps;
- representative placeholder, import-your-own-copy and fallback behavior;
- representative Today/lesson/rung paths where the personal build has material strict lacks;
- Pages/PWA install, update and offline reopen;
- the deploy guard and healthy public artifact path;
- licensing/release checks proving personal-only material is not bundled.

Do not duplicate the whole MIDI walk, score-window gallery, backup/restore flow, device matrix or broad musical sample on strict when those code paths are identical. Re-run a full path on strict only when the flavour actually changes what the learner encounters.

The open-source release-readiness seam remains useful because the owner intends the repository to be open source, but it is **secondary acceptance of the distributable subset**, not a reason to distort the personal product or to make the strict subset the primary learner-validation environment.

This section supersedes the strict-primary H2 ruling in `responses/questions-b96a36c8.md`; `responses/questions-b96a36c8-i5-correction.md` records the same correction.

## 3. Small additions to H2

The learner walk should explicitly include:

- backup/export -> restore -> continue learning;
- installed PWA offline reopen and later update;
- one case where internal content is unavailable and the app honestly uses/imports/recommends an external option rather than fabricating fit;
- representative content from all five supply paths where applicable: generated, PDMX/repertoire, excerpt, import, external recommendation/fallback.

These are acceptance checks, not reasons to pre-build abstractions before H2.

## 4. Mandatory pre-action gate

Before a builder, orchestrator or reviewer dispatches work, searches for evidence, makes a decision or expands scope, apply this gate:

1. **Actual intent:** what decision or product problem is really being solved?
2. **Accumulated context:** what current owner/reviewer rulings, project purpose and recent work already bear on it?
3. **Project-specific purpose before generic norms:** do not substitute a generic open-source, software-engineering, UI or pedagogy convention for this project's established intent.
4. **Decision authority:** is this an implementation/mechanical choice, reviewer product/architecture choice, musical/pedagogical read, or genuine owner preference?
5. **Minimum sufficient evidence:** what evidence could actually change the decision? Do not gather interesting but non-discriminating evidence.
6. **Relevance/stupidity check:** would someone who has followed the project consider the proposed action obviously beside the point, redundant or already settled?
7. **Success condition:** state what observable result would make the action complete before doing it.

If the answer is already entailed by a current ruling, invariant or code contract and has no product-semantic consequence, use the approved orchestrator fast path rather than creating another review cycle.

If the proposed work survives only because an old audit row says so, re-check the current tree first.

## 5. Mandatory post-action gate

A green test, completed tool call or landed commit is not by itself success. After each meaningful action or seam:

1. **Read back the destination/result.** External mutation is not successful until the actual destination is verified.
2. **Compare with original intent.** Did the action solve the problem that justified it, or merely complete the prescribed mechanics?
3. **Check project context again.** Did the result contradict or silently override an owner/reviewer decision or the personal-first product purpose?
4. **Check semantic side effects.** Did it alter learner truth, evidence, material identity, curriculum, device behavior or another contract outside the intended boundary?
5. **Check for unnecessary new work.** A discovered imperfection does not automatically become a new backlog obligation.
6. **Re-evaluate the next step.** If the landing closed, merged, invalidated or reprioritized queued work, update/collapse that work before dispatching it.
7. **Report verification honestly.** Keep VERIFIED, NOT YET VERIFIED and HYPOTHESIS distinct; absence of evidence is not a causal explanation.

This post-action gate is required for the resident hot-file workflow too. Familiarity with a file area gives a builder context, not permanent scope or decision authority. After each landing, re-check whether residency still saves work before keeping that builder there.

## 6. Cadences and counts are heuristics, not rituals

Several planning numbers were useful estimates and must not become literal process rules.

- **2 to 4 substantial lanes** is the operating envelope, not a utilization target. Use fewer when dependencies, machine load or reviewer/read constraints make that faster.
- **2 to 3 seams per integration batch** is a useful default, not a requirement. Integrate sooner when boundaries interact or risk is high; batch more when changes are truly independent and the broad proof would otherwise be identical.
- **5 to 8 clusters per convergence refresh** is a heuristic as described in section 1.
- The early musical packet has **no required item count**. Choose the smallest set of musical reads that unlocks the next important decisions. The earlier "roughly 8 to 12" language is only an upper-shape example, not a target.
- Cluster counts and row counts are not percent-complete measures.

The controlling question is always: **what evidence or process step would materially improve confidence or unblock valuable work?** Skip steps that would not.

## 7. Correct the familiarity/exploration rule

The earlier convergence response set a soft 70/30 familiar-to-exploratory target. That number was not grounded in owner preference or project evidence and should not become curriculum truth.

Replace it with an adaptive objective:

- maintain enough familiar/application material for continuity, consolidation and projects;
- introduce enough exploratory/diagnostic/new material to keep progression and breadth alive;
- shift the balance according to the learner's current purpose, evidence freshness, project demands, stale domains and availability of appropriate material;
- never insert an exploratory item merely to satisfy arithmetic, and never suppress needed new learning because a numerical target was reached.

If later learner use shows that an explicit preference/control or measured range is useful, decide it from that evidence. Until then there is **no fixed percentage**.

This supersedes the numeric I3 ruling in `responses/questions-53670d2a.md`.

## 8. Follow-ups: do not turn anti-loop discipline into information loss

The anti-loop rule stands, but its disposal rule needs nuance.

A seam follow-up should:

1. attach to an existing convergence cluster when that cluster owns the same product truth;
2. open a new current row/cluster only for a concrete learner, correctness, data-integrity, accessibility, safety, security, licensing, release-reliability or recurring-maintainability truth;
3. otherwise remain an observation until the next convergence checkpoint.

At the checkpoint:

- if the observation is false, superseded, duplicate or genuinely not worth doing, close it with the reason;
- if it is a real but non-urgent improvement, move/park it in the ordinary future backlog rather than pretending it is false or deleting it;
- do not let a bare P3 implementation edge, aesthetic preference, speculative refactor or test nicety reproduce itself as overhaul-critical debt.

Preserve the observation and the disposition. The goal is to stop process inflation, not to erase legitimate future ideas.

## 9. Decision fast path must not hide product decisions

The orchestrator may settle a choice without pre-review only when one answer is actually entailed by a current ruling, invariant, code contract plus discriminating test, or purely mechanical implementation fact.

If two plausible choices would produce different learner behavior, pedagogy, stored/data meaning, architecture ownership, licensing/release behavior, accessibility/safety outcome or owner experience, the choice is not "code-settled" merely because either can be implemented.

Before using the fast path, record the decision and the specific fact that entails it. Post-action review may catch misuse, but the fast path is not permission to make consequential product choices first and justify them later.

## 10. Testing cadence follows risk and information value

Keep the lean-chain amendment, with one additional interpretation:

- per seam, run the discriminating proof and changed-boundary checks;
- run integration when interacting boundaries, accumulated changes or risk make broader evidence useful, not merely because a counter reached 2 or 3;
- run the full content build only when content/curriculum/pipeline truth changed or when a cross-seam interaction requires it;
- CI remains the broad independent proof on pushes;
- H1 and release checkpoints intentionally run broad final verification.

Never skip a cross-boundary test that could materially change confidence just because the nominal batch size has not been reached. Never rerun an expensive suite merely because a cadence number says to when nothing relevant changed.

## 11. Current precedence and stopping rule

For execution, read the plan in this order:

1. current owner decisions and explicit corrections;
2. current reviewer responses for the affected boundary;
3. this addendum;
4. the latest convergence map and its current dispositions;
5. the main path-forward document for strategic rationale;
6. older wave plans and audit rows for provenance only.

The main path-forward's success criteria remain, interpreted against **current re-checked truth**, not historical labels. A surviving P1 matters because the current product problem is real, not because an old row still says P1.

The overhaul is done when the personal learner experience is strong, trustworthy and tested; the strict/public subset is independently honest and releasable; the final suite is trustworthy; and remaining work is ordinary future backlog rather than hidden architectural or teaching debt.