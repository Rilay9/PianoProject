// @vitest-environment jsdom
//
// T24 — a perfect performance through every catalog item with a score file.
//
// `helpers/perfectRun.ts` says what a green run here does and does not prove;
// `helpers/perfectSweep.ts` holds the body, and the shards beside this file
// run the rest of the catalog. This one also carries the inventory, so a sweep
// that silently stopped covering the catalog fails rather than passing on an
// empty list.

import { describe, expect, it } from 'vitest';
import { PERFECT_SHARDS, sweepShard } from './helpers/perfectSweep';
import { catalog, itemsWithScores, shard } from './helpers/scoreCatalog';

describe('the sweep covers the catalog', () => {
  it('runs every item with a score file, once, across the shards', () => {
    const withScores = itemsWithScores(catalog());
    expect(withScores.length).toBeGreaterThan(0);
    const covered: string[] = [];
    for (let i = 0; i < PERFECT_SHARDS; i += 1) {
      covered.push(...shard(withScores, i, PERFECT_SHARDS).map((item) => item.id));
    }
    expect(covered.slice().sort()).toEqual(withScores.map((item) => item.id).sort());
    expect(new Set(covered).size).toBe(withScores.length);
  });

  it('leaves nothing with a score file out of the catalog it was given', () => {
    // The other half of the claim above: `itemsWithScores` is a filter, and a
    // filter that quietly returned nothing would make every assertion here
    // vacuous. Every row it dropped has no `file`.
    const items = catalog();
    const kept = new Set(itemsWithScores(items).map((item) => item.id));
    const dropped = items.filter((item) => !kept.has(item.id));
    expect(dropped.every((item) => !item.file)).toBe(true);
  });
});

sweepShard(0, PERFECT_SHARDS);
