# CL11c check request

## Red
- `app/tests/unit/loopScoresOnePopulation.test.ts` at `fd3e315f4e4c048ee95b04797f9dda9def1c0f0d` — expect red.
  - `each completed lap is its own population…` must fail because lap two still carries lap one's hits.
  - `Stop after completed looping reports and saves the last completed lap…` must fail because the completed lap/Stop score still carries the cumulative population.
  - `a non-looped Keep tempo run keeps the existing one-pass population` must pass.

## Round two — implementation head `feca88db498c9561327a58027f75cb9a3a175b11`

No pass is claimed. From `app/`, run:

```sh
npx vitest run tests/unit/loopScoresOnePopulation.test.ts tests/unit/engineTempo.test.ts tests/unit/keepTempoChargesAWrongKey.test.ts tests/unit/scoreTourRoute.test.ts tests/unit/evidenceByDemand.test.ts tests/unit/evidenceOnlyMeasured.test.ts tests/unit/evidenceProperty.test.ts
npx tsc -b
```

Expected green: completed lap counts remain lap-local; Stop preserves the whole active duration; the late-D case reads the completed lap; ScoreScreen builds and records a failed measured RunResult from the stopped engine score. The evidence files exercise the shared observation helper’s use of the final stopped score.

Run these checks at `feca88db498c9561327a58027f75cb9a3a175b11`, the implementation commit immediately before this request-only update. Publish results against that exact head. No CI wait or mutants requested.
