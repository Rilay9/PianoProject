/**
 * An imported piece has to become an *option of the rung* (replan §4.3).
 *
 * Before this, a file the owner found was a Library row and nothing else: it
 * could not complete a rung, never appeared in a swap, and the session builder
 * could not pick it. The overlay is one function, and these are the four
 * things that would otherwise silently not work.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { overlayImports } from '../../src/curriculum/load';
import { importToCatalogItem } from '../../src/data/importStore';
import { alternativesFor, indexCatalog } from '../../src/curriculum/selectors';
import type { Curriculum, CatalogItem, Lesson } from '../../src/curriculum/types';
import type { ImportRow, SessionRow } from '../../src/data/db';
import { rungState } from '../../src/evidence/rungState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';

function lesson(over: Partial<Lesson> = {}): Lesson {
  return {
    id: '2.1',
    title: 'Hands together',
    concepts: [],
    textFile: 'lessons/2.1.md',
    exerciseOptions: ['exercise.a', 'exercise.b', 'exercise.c'],
    songOptions: ['song.a', 'song.b'],
    mastery: { minAccuracy: 0.9, minTempoPct: 0.8 }, requirements: [{ kind: 'runs', from: 'exercises', count: 1 }, { kind: 'runs', from: 'songs', count: 1 }],
    ...over,
  };
}

function curriculum(lessons: Lesson[]): Curriculum {
  return {
    version: 1,
    tracks: [],
    stages: [{ number: 2, title: 'Two', units: [{ id: '2.1', track: 'core', lessons }] }],
  } as unknown as Curriculum;
}

function importRow(over: Partial<ImportRow> = {}): ImportRow {
  return {
    id: 'import.my-piece',
    kind: 'musicxml',
    title: 'My piece',
    data: '<score-partwise/>',
    tags: [],
    addedAt: '2026-09-06T00:00:00.000Z',
    lessonIds: ['2.1'],
    ...over,
  };
}

describe('overlayImports', () => {
  it('appends an import to the rung it was assigned to', () => {
    const item = importToCatalogItem(importRow());
    const out = overlayImports(curriculum([lesson()]), [item]);
    const options = out.stages[0]?.units[0]?.lessons[0]?.songOptions;
    expect(options).toEqual(['song.a', 'song.b', 'import.my-piece']);
  });

  it('leaves every other rung alone', () => {
    const item = importToCatalogItem(importRow());
    const other = lesson({ id: '3.1' });
    const out = overlayImports(curriculum([lesson(), other]), [item]);
    expect(out.stages[0]?.units[0]?.lessons[1]?.songOptions).toEqual(['song.a', 'song.b']);
  });

  it('never mutates the cached curriculum', () => {
    // It is shared and it is fetched once. An overlay that wrote into it would
    // add the same import again on every screen change.
    const source = curriculum([lesson()]);
    const before = [...(source.stages[0]?.units[0]?.lessons[0]?.songOptions ?? [])];
    overlayImports(source, [importToCatalogItem(importRow())]);
    expect(source.stages[0]?.units[0]?.lessons[0]?.songOptions).toEqual(before);
  });

  it('does not list the same id twice', () => {
    const item = importToCatalogItem(importRow({ id: 'song.a' }));
    const out = overlayImports(curriculum([lesson()]), [item]);
    expect(out.stages[0]?.units[0]?.lessons[0]?.songOptions).toEqual(['song.a', 'song.b']);
  });

  it('is a no-op when nothing is assigned', () => {
    const item = importToCatalogItem(importRow({ lessonIds: [] }));
    const source = curriculum([lesson()]);
    expect(overlayImports(source, [item])).toBe(source);
  });

  it('puts one import on several rungs when it belongs to several', () => {
    const item = importToCatalogItem(importRow({ lessonIds: ['2.1', '3.1'] }));
    const out = overlayImports(curriculum([lesson(), lesson({ id: '3.1' })]), [item]);
    for (const l of out.stages[0]?.units[0]?.lessons ?? []) {
      expect(l.songOptions).toContain('import.my-piece');
    }
  });
});

describe('what the overlay unlocks', () => {
  let overlaid: Curriculum;
  let item: CatalogItem;

  beforeEach(() => {
    item = importToCatalogItem(importRow());
    overlaid = overlayImports(curriculum([lesson()]), [item]);
  });

  // Replaced (C5): it asserted the import's passed flag counted towards the
  // rung's songs (`lessonComplete`). What counts now is a run of the import
  // judged by the rung it was assigned to, which the overlay makes one of the
  // rung's songs.
  it('lets a run of an imported piece, opened from its rung, count for that rung', () => {
    const run = (itemId: string): SessionRow => ({
      itemId,
      lessonId: '2.1',
      mode: 'tempo',
      tempoPct: 100,
      tempoMeasured: true,
      accuracy: 1,
      accuracyEstimated: false,
      wrongNotes: 0,
      missed: 0,
      durationMs: 1000,
      at: '2026-10-01T10:00:00.000Z',
    });
    const states = rungState([run('exercise.a'), run('import.my-piece')], overlaid, VOCABULARY_V0, new Date('2026-10-02T10:00:00Z'));
    expect(states.byRung.get('2.1')?.status).toBe('met');
    expect(states.byRung.get('2.1')?.requirements[1]?.items).toEqual(['import.my-piece']);
  });

  it('offers it as an alternative to the rung’s other songs', () => {
    const catalog = indexCatalog([
      item,
      { id: 'song.a', type: 'song', title: 'A', level: 2, concepts: [] } as unknown as CatalogItem,
      { id: 'song.b', type: 'song', title: 'B', level: 2, concepts: [] } as unknown as CatalogItem,
    ]);
    const alternatives = alternativesFor({ itemId: 'song.a', lessonId: '2.1' }, overlaid, catalog);
    expect(alternatives.map((a) => a.id)).toContain('import.my-piece');
  });
});

describe('importToCatalogItem', () => {
  it('carries the rungs, the concepts and where the level came from', () => {
    const item = importToCatalogItem(
      importRow({ concepts: ['hands-together'], level: 2.5, levelSource: 'judged' }),
    );
    expect(item.lessonIds).toEqual(['2.1']);
    expect(item.concepts).toEqual(['hands-together']);
    expect(item.level).toBe(2.5);
    expect(item.levelSource).toBe('judged');
  });

  it('calls an unlevelled import estimated, not judged', () => {
    // The default of 5 is a placeholder. Printing it without the `≈` would be
    // the app claiming a judgement nobody made.
    const item = importToCatalogItem(importRow());
    expect(item.level).toBe(5);
    expect(item.levelSource).toBe('estimated');
  });
});
