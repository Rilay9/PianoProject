/** Summary statistics for the diagnostics latency test. */
export interface Stats {
  n: number;
  mean: number;
  /** Sample standard deviation (n − 1). NaN for fewer than two samples. */
  stdDev: number;
  min: number;
  max: number;
  /** 50th percentile, less sensitive than the mean to one mistimed tap. */
  median: number;
}

/**
 * Mean, sample σ, range and median of `values`.
 *
 * Sample (n − 1) rather than population (n) σ: the taps are a sample of the
 * learner's timing, not the whole population of it, and with the ~8 taps the
 * latency test collects the difference is not negligible.
 */
export function summarise(values: readonly number[]): Stats {
  const n = values.length;
  if (n === 0) {
    return { n: 0, mean: NaN, stdDev: NaN, min: NaN, max: NaN, median: NaN };
  }
  let sum = 0;
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    sum += v;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const mean = sum / n;
  let sq = 0;
  for (const v of values) sq += (v - mean) ** 2;
  const stdDev = n > 1 ? Math.sqrt(sq / (n - 1)) : NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(n / 2);
  const median =
    n % 2 === 1 ? (sorted[mid] ?? NaN) : ((sorted[mid - 1] ?? NaN) + (sorted[mid] ?? NaN)) / 2;
  return { n, mean, stdDev, min, max, median };
}
