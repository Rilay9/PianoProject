/**
 * What the app does with `levelSource` (replan §1.4).
 *
 * The field only earns its place if it changes two things the learner can
 * see: how a level is printed, and which alternative is offered first. Both
 * are here.
 */
import { describe, expect, it } from 'vitest';
import {
  alternativesFor,
  indexCatalog,
  levelConfidence,
  type CatalogItem,
  type Curriculum,
} from '../../src/curriculum';
import { levelLabel } from '../../src/ui/widgets';

function item(id: string, over: Partial<CatalogItem> = {}): CatalogItem {
  return {
    id,
    type: id.startsWith('song') ? 'song' : 'exercise',
    title: id,
    level: 7.0,
    hands: 'both',
    tracks: ['classical'],
    concepts: ['etude'],
    ...over,
  };
}

const emptyCurriculum: Curriculum = { version: 1, tracks: [], stages: [] };

describe('levelLabel', () => {
  it('prints a judged level plainly', () => {
    expect(levelLabel(7.1, 'judged')).toBe('L7.1');
  });

  it('marks an estimate with a squiggle', () => {
    expect(levelLabel(7.1, 'estimated')).toBe('≈ L7.1');
  });

  it('treats an unknown source as judged', () => {
    // An import, or a catalog built before P11: showing every older item as an
    // estimate would be a claim nobody made.
    expect(levelLabel(7.1)).toBe('L7.1');
  });
});

describe('levelConfidence', () => {
  it('ranks judged above estimated', () => {
    expect(levelConfidence(item('a', { levelSource: 'judged' }))).toBeGreaterThan(
      levelConfidence(item('b', { levelSource: 'estimated' })),
    );
  });

  it('counts a missing source as judged', () => {
    expect(levelConfidence(item('a'))).toBe(levelConfidence(item('b', { levelSource: 'judged' })));
  });
});

describe('alternativesFor', () => {
  it('prefers a judged level over an estimated one at the same distance', () => {
    const catalog = indexCatalog([
      item('song.source', { level: 7.0, levelSource: 'judged' }),
      item('song.estimated', { level: 7.2, levelSource: 'estimated' }),
      item('song.judged', { level: 7.2, levelSource: 'judged' }),
    ]);
    const found = alternativesFor({ itemId: 'song.source' }, emptyCurriculum, catalog);
    expect(found.map((i) => i.id)).toEqual(['song.judged', 'song.estimated']);
  });

  it('still puts the nearer level first when the distances differ', () => {
    // Confidence is the tie-break, not the sort: a judged 8.0 is not a better
    // swap for a 7.0 than an estimated 7.1.
    const catalog = indexCatalog([
      item('song.source', { level: 7.0, levelSource: 'judged' }),
      item('song.near', { level: 7.1, levelSource: 'estimated' }),
      item('song.far', { level: 7.4, levelSource: 'judged' }),
    ]);
    const found = alternativesFor({ itemId: 'song.source' }, emptyCurriculum, catalog);
    expect(found.map((i) => i.id)).toEqual(['song.near', 'song.far']);
  });
});
