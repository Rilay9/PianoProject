# Reviewer response — plan amendments at `b96a36c8`

## Overall verdict

**APPROVE ALL SIX AMENDMENTS WITH THE BOUNDARIES BELOW.**

The direction is correct: reduce reviewer latency where the answer is already entailed, keep context resident on hot files, bring musical evidence forward when it gates work, stop follow-up inflation, and stop paying a 25–30 minute integration tax on every seam.

These amendments modify the operating procedure. They do **not** weaken the product/architecture truth gates.

---

## 1. Orchestrator may settle decisions that are already entailed

**APPROVE, with a narrow jurisdiction.**

A pre-review is no longer required for an implementation choice when the answer is already determined by one of:

- an existing reviewer/owner ruling;
- an invariant or operating rule already accepted;
- the current code contract plus a discriminating test;
- a purely mechanical implementation choice with no product-semantic consequence.

The brief/record must say:

> `Decided by the orchestrator: <decision>. Reason: <ruling / invariant / code fact / test>.`

The builder may then dispatch without waiting for a new reviewer round. The ordinary post-build seam review still occurs.

### Still requires reviewer pre-review

Do **not** use this fast path for a choice that changes any of:

- learner-visible product behavior or curriculum;
- pedagogy or musical interpretation;
- ownership/architecture or a new cross-cutting abstraction;
- evidence, competence, material identity, history, or stored-data meaning;
- migrations or destructive/irreversible state changes;
- release/deployment availability or an external contract;
- privacy, security, accessibility, licensing, or safety;
- an explicit owner preference.

If two technically plausible implementations produce observably different learner or data semantics, it is not a code-settled choice.

This is an intentional exception to the recent “every brief is pre-reviewed” rule: **consequential briefs remain pre-reviewed; entailed/mechanical briefs may self-dispatch with the recorded reason.** The reviewer may overturn a misuse at the next checkpoint, but “reviewable later” is not permission to make a consequential decision first.

---

## 2. Resident owner for hot files

**APPROVE as scheduling.**

Keeping one builder resident on `session.ts` / stage / eligibility work after L120d, and similarly on the score-window area after U32, should save repeated rereads, setup and broad reruns.

Guardrails:

- residency is **one of the 2–4 active lanes**, not an extra lane;
- the resident owns context, not a giant permanent scope;
- each cluster still gets its own stated scope, implementation HEAD and immutable handoff;
- do not amend earlier implementation commits or merge unrelated product decisions into one review seam;
- 2–3 compatible seams may share one integration chain/batch, while preserving their individual heads and evidence;
- if a seam blocks on a decision, the resident may move to another independent cluster in that same file area instead of idling.

This should be the default for genuinely hot files until the RE-CHECK population there collapses.

---

## 3. Early musical sample before final H2

**APPROVE.**

Do not postpone musical evidence that determines Tier-1/Tier-2 work until the final acceptance evening.

Treat this as an **early musical-read packet**, not “H2 completed early.” Prepare a bounded list of the highest-leverage items from the current READ rows, especially R6, R9, S9, M2 and Q57, with the exact score/audio, the specific question, and the possible dispositions already stated. The owner should spend time listening/playing, not reconstructing why each item matters.

Prefer roughly 8–12 representative/high-consequence decisions in the first sitting rather than attempting the entire musical backlog. Record the decisions as source evidence for their clusters. The final H2 musical/learner acceptance sample remains later and must include a fresh end-to-end sample of the product as it then exists.

Where a question needs a pianist/teacher rather than owner/learner taste, keep the T54 expert boundary.

---

## 4. Which build H2 uses

**OWNER/PRODUCT DECISION: the strict public build is the canonical H2 and release-validation build.**

Reason: this repository is intended to be a public/open-source product, and the strict public build is the product another user can actually receive without the owner’s private/non-redistributable corpus. A full learner walk on the personal build would validate a richer owner-specific product while leaving the released product’s thin-rung/fallback experience under-tested.

Use this split:

1. **Primary H2 device + learner walks:** strict public build.
2. **Primary release-readiness:** strict public build.
3. **Personal build:** a short **delta-only smoke/listening pass** for behaviors that exist only because of owner/imported/personal content. Do not duplicate the complete H2 walk there.

The project record has previously treated the phone path as the public/licence-strict build, but do **not** infer what artifact is literally installed on the phone on the day of H2. At session start, record the build/flavour actually installed. If it is personal, install/open the strict public build for the canonical walk.

I5 is therefore decided: the public curriculum/release must stand on the strict build; private/imported material enriches the owner’s library but is not a dependency of the canonical curriculum.

---

## 5. Anti-loop rule for follow-ups

**APPROVE, with “product truth” interpreted broadly enough to include real invariants.**

A seam does not earn a new backlog row merely because it noticed something adjacent.

Default disposition for a follow-up:

1. attach it to an existing convergence cluster if that cluster owns the same product truth;
2. otherwise open a new cluster/row only if there is a concrete learner, correctness, data-integrity, accessibility, safety, security, licensing, release-reliability, or maintainability invariant that would justify building it;
3. otherwise keep it as an observation until the next convergence checkpoint;
4. if still unclaimed then, close it as **not worth building now**, with that reason preserved.

A bare P3 implementation edge, aesthetic preference, speculative refactor, or test nicety does not perpetually reproduce itself into the control backlog.

Do not silently erase the observation. Closing with the reason is the evidence.

This rule should also apply to reviewer follow-ups. The reviewer should not create debt merely because a minor imperfection can be named.

---

## 6. Leaner landing chains

**APPROVE, and make the tiers explicit.**

The current per-seam broad rerun pattern is wasting machine time and causing load-sensitive reds without adding proportional confidence.

### A. Per seam

Run only:

- the discriminating tests for the changed behavior;
- the changed-area unit/spec files;
- path/check-map-required tests that are genuinely mapped to the touched files;
- typecheck/lint where the changed language/area requires them;
- targeted content validation only when that seam changes content truth.

The seam must still prove its specific claim red/green. “Lean” does not mean skipping the test that distinguishes the fix.

### B. Integration batch

After **2–3 compatible seams**, or sooner when two seams share an architectural boundary, run the broad integration set once:

- full unit suite once;
- union of the relevant targeted browser/e2e specs;
- one full content build/validate only if any seam in the batch changed content, curriculum, converter, catalogue, generator, demands, or the content pipeline.

A pure app/UI/data seam does not owe a content build merely because prior seams did.

### C. CI / push

CI remains the broad independent proof on every push. Do not repeat a locally green whole suite after CI merely for symmetry. If CI exposes a real interaction/load failure, fix forward and add the smallest durable regression coverage at the owning boundary.

For expensive content chains, batch content-changing seams when file ownership/dependencies allow it rather than rebuilding the identical corpus after each independent commit.

At H1 and release checkpoints, run the intentionally broad suite again under the final tree.

---

## E50a landing fix-forward

**APPROVE as a required-change fast-path repair. No new brief cycle is needed.**

The reviewer explicitly allowed six concrete 2026-09-30 identities to be deliberately added at landing. A bound test that still hard-stops at 2026-09-29 is therefore stale relative to that accepted ruling.

The test repair is correct **only if** it encodes the actual historical exception:

- the six exact proven identities may carry the 2026-09-30 landing-day bound;
- no future date is accepted because the calendar advances;
- no synthetic range through later dates is introduced;
- all other former identities remain bounded by the proven historical set.

A constant/explicit recorded landing day for those six is fine. A dynamic `today()` upper bound is not.

Resume the E50a chain from the first affected integration stage rather than rerunning already-proven earlier work.

---

## Operating consequence

These amendments should materially reduce latency:

- entailed technical decisions stop waiting for a reviewer round;
- hot-file builders retain context;
- musical reads happen before they block builds;
- trivial follow-ups stop reproducing the backlog;
- broad test/content work is paid once per meaningful integration batch rather than once per seam.

Keep the 2–4 substantial-lane cap. Optimize for **useful independent progress per machine/reviewer cycle**, not maximum simultaneous occupancy.
