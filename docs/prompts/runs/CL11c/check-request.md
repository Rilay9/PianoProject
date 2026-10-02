# CL11c check request

## Red
- `app/tests/unit/loopScoresOnePopulation.test.ts` at `fd3e315f4e4c048ee95b04797f9dda9def1c0f0d` — expect red.
  - `each completed lap is its own population…` must fail because lap two still carries lap one's hits.
  - `Stop after completed looping reports and saves the last completed lap…` must fail because the completed lap/Stop score still carries the cumulative population.
  - `a non-looped Keep tempo run keeps the existing one-pass population` must pass.

## Round two — check this request’s commit HEAD

No pass is claimed. From `app/`, run:

```sh
npx vitest run tests/unit/loopScoresOnePopulation.test.ts tests/unit/engineTempo.test.ts tests/unit/keepTempoChargesAWrongKey.test.ts tests/unit/scoreTourRoute.test.ts tests/unit/evidenceByDemand.test.ts tests/unit/evidenceOnlyMeasured.test.ts tests/unit/evidenceProperty.test.ts
npx tsc -b
```

Expected green: completed lap counts remain lap-local; Stop preserves the whole active duration; the late-D case reads the completed lap; ScoreScreen builds and records a failed measured RunResult from the stopped engine score. The evidence files exercise the shared observation helper’s use of the final stopped score.

The exact head is the commit containing this request (resolve with `git rev-parse HEAD` on `chatgpt/cl11c`); no self-referential SHA is invented. Publish results against that head. No CI wait or mutants requested.
