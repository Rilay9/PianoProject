/**
 * A constructed item's measurement (E0): what the build writes on a bundled item,
 * for tests that build their own catalogue.
 *
 * Since E0 an item's demands are known only from a measurement record, and the one
 * gate (`curriculum/eligibility.ts`) reads the opportunities it establishes, never the
 * bare ids: an item with no record is unmeasured, and an unmeasured item is offered
 * for exploration only. A test that means "this item provides these demands" says so
 * here; one that means "it only contains them" passes `established` without them.
 */
import type { CatalogItem } from '../../../src/curriculum/types';

export function measured(
  demands: string[],
  options: { established?: string[]; located?: Record<string, number>; bars?: number } = {},
): Pick<CatalogItem, 'demands' | 'measurement'> {
  const bars = options.bars ?? 16;
  const located = options.located ?? Object.fromEntries(demands.map((demand) => [demand, bars]));
  return {
    demands,
    measurement: {
      status: 'measured',
      definitions: 3,
      located,
      bars,
      steps: bars * 4,
      notes: bars * 4,
      established: options.established ?? demands,
    },
  };
}

/** A constructed item the detectors could not read (E0): offered for exploration only. */
export function unmeasured(reason = 'constructed: not measured'): Pick<CatalogItem, 'demands' | 'measurement'> {
  return { demands: 'unmeasured', measurement: { status: 'unmeasured', reason } };
}
