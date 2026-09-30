# Addendum to `path-forward-2026-09-30.md`

This addendum changes two points in the main path-forward document. Treat it as part of that proposal when reviewing the plan.

## 1. Do not stop all production for backlog convergence

The main roadmap says, near the concrete schedule, to pause new product dispatch for one short convergence checkpoint after L120d/E50/current UI work lands.

**Replace that with a rolling pipeline.**

Once the current frontier begins freeing slots, run convergence and implementation in parallel:

- with 4 agents: normally 2 implementation + 2 reconciliation, or 3 implementation + 1 reconciliation when the next three seams are truly independent and already decided;
- with 3 agents: 2 implementation + 1 reconciliation;
- with 2 agents: 1 implementation + 1 reconciliation until the canonical P0/P1 queue is reliable, then 2 implementation when dependencies make that the better use of capacity.

Do not wait for all ~230 old rows to be classified before using the results. As soon as a reconciliation batch identifies a current high-value P0/P1 cluster with settled ownership, brief/review/build it while the next batch continues.

Have one **short synthesis checkpoint** after the first meaningful batch, not a stop-the-world audit. The checkpoint approves:

- corrected severity counts;
- rows already closed/stale/duplicated;
- the first canonical clusters;
- decision/read blockers;
- the next 3–6 implementation seams.

Then continue the rolling pipeline and refresh the cluster map every 5–8 landed clusters.

### Reason

The audit is stale enough that it must be reconciled, but triage itself does not improve the learner. Keeping at least one implementation lane active preserves visible progress and shortens total elapsed time without increasing architectural risk.

---

## 2. Add a bounded open-source release-readiness seam after H2 blockers

The app is intended to be open source. After H2 identifies and closes its release blockers, run one small release-readiness seam before freezing the overhaul.

This is **not another feature wave**. It is a clean-clone/public-repository acceptance check.

Verify:

1. a clean clone can install, build, test, and run using documented steps;
2. README/status/setup instructions describe the app that actually exists now;
3. PDMX, Mutopia, MuseTrainer, imported/user-owned content, and any other source are documented with the correct redistribution/licensing boundary;
4. no private local archive, owner-specific absolute path, secret, or machine-only cache is required for the public project to function in its supported mode;
5. generated artifacts/caches that should not be committed are excluded, while required generated records are reproducible;
6. Pages/PWA install, update, offline behavior, and the deploy guard are documented at the level a contributor needs;
7. the contribution/test-map workflow is understandable from the repository rather than from chat history;
8. known limitations that remain after H2 are stated honestly.

### Reason

The project can be learner-correct and still be a poor open-source repository if it only works because of the owner's machine state or undocumented content sources. This seam catches that class of failure without turning release preparation into another architectural rebuild.

---

## 3. Small additions to H2

The main roadmap's H2 learner walk should explicitly include:

- backup/export -> restore -> continue learning;
- installed PWA offline reopen and later update;
- one case where internal content is unavailable and the app should honestly use/import/recommend an external option rather than fabricate a fit;
- representative content from all five supply paths where applicable: generated, PDMX/repertoire, excerpt, import, external recommendation/fallback.

These are product acceptance checks, not reasons to pre-build new abstractions before H2.
