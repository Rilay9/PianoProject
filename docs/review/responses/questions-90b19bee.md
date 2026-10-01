# Reviewer answers from the surviving-work reconciliation at `90b19bee`

These answers apply `docs/review/product-convergence-current.md`: the purpose is to collapse or defer work, not turn each finding into a new lane. Do not create a new row merely because this response names a rule. Reuse the owning seam when and only when the current product needs the change.

## 1. G30 — unsourced printed fingering

**Build the learner-truth correction; do not invent another identity system.**

The current problem is concrete: the generated score prints fingering as learner-facing instruction while the family contracts themselves say the convention is not sourced. The existing ruling to print none until sourced therefore still stands.

For identity, keep the distinctions already established by CL15:

- exact/current artifact identity remains exact — the regenerated artifact is a changed artifact;
- learner-material continuity may bridge old -> new **only where the musical material the learner practised is unchanged** and the change is removal of the unsupported fingering annotation;
- do not reset prior encounter/competence merely because an unsupported annotation was removed;
- do not claim byte identity or musical-notation identity between the artifacts;
- do not add a new schema/relation if the generated learner-continuity relation CL15 already built can express this case.

Before applying the bridge, check the consumers once: if any evidence/requirement actually measures or depends on the printed fingering itself, return that consumer as the exception instead of carrying its evidence blindly. Do not open a general identity-design lane unless such a consumer proves the existing relation insufficient.

This should be a narrow never-teach-wrong seam, not a reopening of CL15.

## 2. S38 — what `seen` means for sight-reading

`seen` is **contact novelty**, so it should follow the learner-visible musical phrase, not the generator's provenance coordinates.

Keep seed + generator version as provenance/reproduction identity. Do not use a version bump by itself to make unchanged music novel again.

For encounter novelty:

- if the phrase the learner reads is materially the same after a generator-version change, it remains seen;
- if the learner-facing/judged musical phrase changes, it is unseen even if the seed happens to be the same.

Prefer a canonical fingerprint/identity of the generated phrase's learner-relevant musical content (the representation from which the score/judged phrase is produced), excluding provenance-only fields such as generator version. Do not substitute a screenshot/layout hash. If there is no existing canonical representation from which this can be derived without creating a second interpretation of the phrase, return that narrow model gap before implementing it.

**Do not dispatch S38 as a standalone migration just because the rule is now known.** Consume this rule when a justified generator behaviour change (for example a future G37 change that actually changes output) would otherwise create false novelty. If the current product already has mixed-version history that produces false novelty today, then it is a current defect and may be fixed directly.

## 3. X37 versus R1 / CL17

**X37 waits for R1/CL17's already-ruled level model to land.**

The surviving-work read shows X37's expensive action is a placement read triggered by crossing the current authored `levelBand`, while R1's accepted direction removes that band as authored truth/gating and makes the scalar a derived projection. Spending a read on every piece that crosses a gate scheduled to disappear is exactly the kind of stale-premise work the new convergence posture forbids.

After R1/CL17 lands, re-run the quarry/placement question against the new analysis and only read pieces whose placement is still genuinely ambiguous or learner-consequential. Do not preserve X37's old “review every band crossing” procedure merely because it once had a ruling.

## 4. CL17 / R1

**Confirmed: the product/model choice is already made. Do not re-decide `The Level`.**

What remains is implementation/reconciliation of the existing ruling:

- authoritative multidimensional analysis/provenance is the underlying truth;
- a scalar level may remain as a derived sort/display/search projection where useful;
- `levelBand` is not authored teaching truth and should not continue as a gate merely because old code still reads it;
- G6 follows that model rather than reopening whether a generator number is “judged” versus some competing canonical scalar.

Before building, inventory the live consumers of `level`, `levelSource`, `levelBand` and related fields and classify each as underlying analysis, derived presentation, or obsolete gate. Then make the smallest coherent change that causes those consumers to agree. This is one model migration, not a sequence of local fixes and not a new product-design debate.

## 5. R23 is not ready to dispatch yet — the amended brief is internally contradictory

The required-change section was added, but the same brief still retains the old premise later as a governing constraint/hypothesis:

- `"Strong" is claims.py's established classification`; and
- the hypothesis that redefining strong as `status_of(...) == "established"` is sufficient.

Those statements directly conflict with `responses/71730e65.md`, which says established opportunity is necessary evidence but **not** a synonym for a strong application.

Before dispatch, delete/rewrite the superseded constraint, hypothesis, tests and build steps so there is one coherent brief. The read-only report may determine whether the repository already composes application target + measured opportunity + teaching-use/admission truth. If not, it stops and returns the model gap. The bounded missing-`required_songs` consistency fix may still proceed independently.

Do not dispatch a brief that contains both the corrected model and the premise it supersedes; that is a predictable fix-forward loop.

## 6. The personal-build phone route is not an owner decision

Do not ask the owner to choose a delivery path. The repository already has the current route:

1. build personal content (`tools/content/build.py --offline --personal` as documented);
2. build the app for root serving;
3. serve it from the owner's laptop over HTTPS with `packaging/serve-lan.py` / D25;
4. install or update it on the phone and use the installed PWA/TWA path offline after first load.

`README.md`, `docs/01-architecture.md`, `packaging/serve-lan.py`, and the prior reviewer answer `responses/questions-eebafb5e.md` already establish this. Only return to the owner if current H2 evidence shows that route itself is unusable or if there is a genuine preference between two materially different working experiences.

## Consequence for the immediate queue

- Continue U122a / the whole-Score evidence work, with the upright/tablet CL07 coverage folded into the same product decision.
- Continue the representative whole-product walk and the first real T62 sharded-CI read-back as evidence.
- G30 may be briefed as the narrow current never-teach-wrong seam above.
- R23 does **not** dispatch until its contradictory old premise is removed from the brief.
- S38 does not become a standalone lane unless false novelty is a current mixed-version defect; otherwise it is a rule consumed by the next justified generator-output change.
- X37 waits for the CL17/R1 migration.
- CL17 implements the existing ruling; it does not reopen the scalar-level decision.

The purpose of these answers is fewer live concepts and fewer lanes, not a more elaborate queue.