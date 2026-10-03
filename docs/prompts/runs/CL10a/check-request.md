# CL10a — first dependency: R37

Test-only commit: `04c51da8d8826b7bab38a01c2ad9ec0bf1476265` (copied from the published commit result and fetched back).
Base: `9dedcc0560503f46b18387a5eddf6d0274d54fe2`.

From `app/`, at the test-only commit:

```bash
npx vitest run tests/unit/cl10aHeldTune.test.ts
```

Predicted, not observed: the merged-tie case is red at the presence assertion; the two-new-attacks control and tune-ending-at-barline refusal are green. The tied tune lasts six quarter-note beats in two 6/8 bars. Its sole attack is in bar zero; the second bar has six left-hand eighths and no upper-staff attack. This distinguishes duration overlap from onset presence. The existing phrase helper creates the same merged-tie shape as the extractor; this checkpoint does not test the extractor itself.

Publish the actual output under this lane before the next build round. If the held case passes, R37 is not reproduced; keep the fixture and report that. If it fails at the predicted assertion with both controls passing, proceed with overlap-based tune reading in the subsequent fix, then request the full lane's red-first cases before implementation.

No runtime checks have been run here. No green implementation head exists in this checkpoint. No mutants are claimed: none of the app's mechanisms has changed. The eventual held-overlap mutant must replace the overlap predicate with same-measure onset membership and turn the held case red, while preserving the two controls.

Deferred until the actual build: clef/change, key-in-force, simple-metre walk, share/eligible-bar cases; corpus pin and rung-claim comparisons; one exact mutant per implemented mechanism; `npx tsc -b` and lint from app; from the root `python tools/content/build.py --offline`, `python tools/content/validate.py --allow-nc --personal`, `python -m unittest discover -s tools/content/tests -t tools/content`.

The later implementation/check request must use SHAs from the published commit records. This request deliberately names the immutable test commit rather than its own documentation commit.
