/**
 * The session builder (docs/02 Part A §8, docs/04 §2).
 *
 * "What should I practise today" is a judgement, and a judgement nobody can
 * inspect is a judgement nobody can fix — so it lives in pure functions and
 * these tests pin down the parts that are easy to get quietly wrong: the
 * templates matching the curriculum, no item appearing twice, an unfillable
 * row being dropped rather than shown empty, and the swap sheet never coming
 * back empty.
 */
import { describe, expect, it } from 'vitest';
import {
  SESSION_TEMPLATES,
  buildSession,
  nextRecommended,
  playInstead,
  playable,
  swapOptions,
  templateFor,
  type BuildInput,
} from '../../src/curriculum/session';
import { indexCatalog } from '../../src/curriculum/selectors';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';

function item(id: string, over: Partial<CatalogItem> = {}): CatalogItem {
  return {
    id,
    type: 'exercise',
    title: id,
    level: 1,
    hands: 'both',
    tracks: ['core'],
    concepts: ['c'],
    file: `scores/${id}.mxl`,
    ...over,
  };
}

function lesson(id: string, over: Partial<Lesson> = {}): Lesson {
  return {
    id,
    title: `Lesson ${id}`,
    concepts: ['c'],
    textFile: `lessons/${id}.md`,
    exerciseOptions: ['ex.a', 'ex.b', 'ex.c'],
    songOptions: ['song.a', 'song.b'],
    mastery: { exercisesRequired: 1, songsRequired: 1, minAccuracy: 0.9, minTempoPct: 0.8 },
    ...over,
  };
}

const ITEMS: CatalogItem[] = [
  item('ex.a'),
  item('ex.b'),
  item('ex.c', { tracks: ['technique'] }),
  item('song.a', { type: 'song' }),
  item('song.b', { type: 'song' }),
  item('song.c', { type: 'song', level: 1.5 }),
  item('jam.a', { tracks: ['blues-boogie'], type: 'song' }),
  item('import.needed', { type: 'song', file: null, alternatives: ['song.c'] }),
];

const CURRICULUM: Curriculum = {
  version: 1,
  tracks: [{ id: 'core', title: 'Core', description: '', startsAtStage: 0 }],
  stages: [
    {
      number: 1,
      title: 'One',
      summary: '',
      units: [
        {
          id: 'u1',
          title: 'Unit',
          track: 'core',
          lessons: [
            lesson('1.1'),
            // Different options, or passing 1.1 would silently pass 1.2 too.
            lesson('1.2', { exerciseOptions: ['ex.b', 'ex.c'], songOptions: ['song.b', 'song.c'] }),
          ],
        },
      ],
    },
  ],
};

function input(over: Partial<BuildInput> = {}): BuildInput {
  return {
    curriculum: CURRICULUM,
    catalog: indexCatalog(ITEMS),
    items: ITEMS,
    records: [],
    dueForReview: [],
    mastered: [],
    activeTracks: ['core'],
    minutes: 30,
    ...over,
  };
}

describe('the templates', () => {
  it('are the four in docs/02 Part A §8, with the stated minutes', () => {
    expect(SESSION_TEMPLATES.map((t) => t.minutes)).toEqual([15, 30, 60, 120]);
    expect(templateFor(15).slots.map((s) => `${s.kind}:${String(s.minutes)}`)).toEqual([
      'technique:4',
      'review:4',
      'new:7',
    ]);
    // The 120 is two halves with a break between, second half repertoire-heavy.
    const long = templateFor(120);
    expect(long.breakAfterSlot).toBe(6);
    expect(long.slots.slice(6).map((s) => s.kind)).toEqual(['repertoire', 'jam', 'sightreading']);
  });

  it('falls back to 30 minutes for an unknown length', () => {
    expect(templateFor(45).minutes).toBe(30);
  });
});

describe('nextRecommended', () => {
  it('is the first lesson that is not complete', () => {
    expect(nextRecommended(CURRICULUM, [])?.lesson.id).toBe('1.1');
  });

  it('moves on once a lesson is complete', () => {
    const records = [
      { itemId: 'ex.a', passed: true },
      { itemId: 'song.a', passed: true },
    ];
    expect(nextRecommended(CURRICULUM, records)?.lesson.id).toBe('1.2');
  });

  it('skips a track the learner switched off, but never the core path', () => {
    const withTrack: Curriculum = {
      ...CURRICULUM,
      stages: [
        {
          ...(CURRICULUM.stages[0] as Curriculum['stages'][number]),
          units: [
            { id: 'u2', title: 'Blues', track: 'blues-boogie', lessons: [lesson('B.1')] },
            { id: 'u1', title: 'Unit', track: 'core', lessons: [lesson('1.1')] },
          ],
        },
      ],
    };
    expect(nextRecommended(withTrack, [], ['core'])?.lesson.id).toBe('1.1');
    expect(nextRecommended(withTrack, [], ['core', 'blues-boogie'])?.lesson.id).toBe('B.1');
  });
});

describe('buildSession', () => {
  it('fills the template in order and never repeats an item', () => {
    const { slots } = buildSession(input());
    const ids = slots.map((slot) => slot.item?.id).filter(Boolean);
    expect(new Set(ids).size).toBe(ids.length);
    expect(slots.some((slot) => slot.kind === 'free')).toBe(true);
  });

  it('drops a row it cannot fill rather than showing an empty one', () => {
    // Only one playable item in the whole catalog: everything after the
    // warm-up has nothing left to offer.
    const only = [item('ex.a')];
    const { slots } = buildSession(
      input({ items: only, catalog: indexCatalog(only), minutes: 30 }),
    );
    for (const slot of slots) {
      if (slot.kind === 'free') continue;
      expect(slot.item).toBeDefined();
    }
  });

  it('never offers a row you would have to import first', () => {
    const { slots } = buildSession(input());
    for (const slot of slots) {
      if (slot.item) expect(playable(slot.item)).toBe(true);
    }
  });

  it('puts a due item in the review row and says so', () => {
    const { slots } = buildSession(input({ dueForReview: ['song.b'] }));
    const review = slots.find((slot) => slot.kind === 'review');
    expect(review?.item?.id).toBe('song.b');
    expect(review?.reason).toContain('Due for review');
  });

  it('a different seed gives a different card', () => {
    const first = buildSession(input({ seed: 0 })).slots.map((s) => s.item?.id);
    const second = buildSession(input({ seed: 1 })).slots.map((s) => s.item?.id);
    expect(second).not.toEqual(first);
  });
});

describe('swapOptions', () => {
  it('offers the lesson’s other options first', () => {
    const { slots } = buildSession(input());
    const slot = slots.find((s) => s.kind === 'new');
    expect(slot).toBeDefined();
    const options = swapOptions(slot as never, slots, CURRICULUM, indexCatalog(ITEMS), {
      items: ITEMS,
    });
    expect(options.length).toBeGreaterThan(0);
    // Nothing already in today's card.
    const inCard = new Set(slots.map((s) => s.item?.id));
    for (const option of options) expect(inCard.has(option.id)).toBe(false);
  });

  it('the "not a song" filter removes songs', () => {
    const { slots } = buildSession(input());
    const slot = slots.find((s) => s.kind === 'new');
    const options = swapOptions(slot as never, slots, CURRICULUM, indexCatalog(ITEMS), {
      excludeSongs: true,
      items: ITEMS,
    });
    expect(options.every((option) => option.type !== 'song')).toBe(true);
  });

  it('falls back to something at the same level rather than coming back empty', () => {
    // A lesson with one option and no shared concepts anywhere.
    const lonely = [item('only.one', { concepts: ['unique'] }), item('near.by', { concepts: ['other'] })];
    const slot = { kind: 'technique' as const, minutes: 5, item: lonely[0], reason: '' };
    const options = swapOptions(slot, [slot], CURRICULUM, indexCatalog(lonely), { items: lonely });
    expect(options.map((option) => option.id)).toEqual(['near.by']);
  });
});

describe('playInstead', () => {
  it('points an un-imported item at the vehicle its alternatives name', () => {
    const needed = ITEMS.find((i) => i.id === 'import.needed') as CatalogItem;
    expect(playInstead(needed, CURRICULUM, indexCatalog(ITEMS))?.id).toBe('song.c');
  });

  it('says nothing about an item you can already play', () => {
    expect(playInstead(ITEMS[0] as CatalogItem, CURRICULUM, indexCatalog(ITEMS))).toBeUndefined();
  });
});
