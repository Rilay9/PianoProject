# CL12a — boundary tests and purpose handback

Base: `d1b40b9828eeeaf62889d9509effddd05f32cb51`. This is a test-only checkpoint, not the slice-A implementation.

Read `ENTRY.md` for the brief-required handback: the no-due rung fallback does not retain the objective needed to distinguish Learn from Apply. Recommended disposition: ambiguous new rows retain reason/minutes and no purpose badge; intent remains absent. Do not change L96 selection. Please publish the disposition with the checks so the build can continue without inventing pedagogy.

With built content from the base, from `app/`:

```sh
npx vitest run tests/unit/cl12aForwardBoundary.test.ts --reporter=verbose
```

Predicted: behind-placement exhaustion and carry-over debt are red; unknown placement, strict blocked-ahead recommendation and genuine core exhaustion green. All five preserve the existing evidence object. No observed pass is claimed. The test-only checkpoint covers neither the full intent contract nor the five-learner replay or browser layouts; those will accompany the implementation after disposition. Existing diary tests remain unmodified.

Commit ids are obtained from repository commit records, not a claimed local git log. No CI reading or waiting is requested.
