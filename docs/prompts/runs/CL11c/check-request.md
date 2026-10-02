# CL11c check request

## Red
- `app/tests/unit/loopScoresOnePopulation.test.ts` at `930b3b2915518345cbb019ca2eece93dee1f96d2` — expect red.
  - `each completed lap is its own population…` must fail because lap two still carries lap one's hits.
  - `Stop after completed looping reports and saves the last completed lap…` must fail because the completed lap/Stop score still carries the cumulative population.
  - `a non-looped Keep tempo run keeps the existing one-pass population` must pass.

## Green
- `app/tests/unit/loopScoresOnePopulation.test.ts` at final branch HEAD — expect all three cases green.

## Mutants
1. In `PracticeEngine.completeLap`, delete the one line `this.resetRunTotals();`. The first case must turn red on `secondLap.hits === 2` (and the Stop case must also turn red).
2. In `PracticeEngine.stop`, change the condition `this.lastCompletedLoopScore !== null` to `false`. The Stop case must turn red because Stop reports the newly started partial lap instead of the last completed lap.
