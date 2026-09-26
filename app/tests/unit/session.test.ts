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
  REPERTOIRE_WINDOW_DAYS,
  swapOptions,
  templateFor,
  type BuildInput,
} from '../../src/curriculum/session';
import { indexCatalog } from '../../src/curriculum/selectors';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import type { SessionRow } from '../../src/data/db';
import { rungState, type RungStates } from '../../src/evidence/rungState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';

/**
 * Where the learner is, from runs each judged by the rung named with its item
 * (C5): `rungState` over the rows, where these tests handed a list of passed
 * items before.
 */
function statesOf(curriculum: Curriculum, runs: [itemId: string, rung: string][] = []): RungStates {
  const rows: SessionRow[] = runs.map(([itemId, lessonId]) => ({
    itemId,
    lessonId,
    mode: 'tempo',
    tempoPct: 100,
    tempoMeasured: true,
    accuracy: 1,
    accuracyEstimated: false,
    wrongNotes: 0,
    missed: 0,
    durationMs: 1000,
    at: '2026-10-01T10:00:00.000Z',
  }));
  return rungState(rows, curriculum, VOCABULARY_V0, new Date('2026-10-02T10:00:00Z'));
}

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
    mastery: { minAccuracy: 0.9, minTempoPct: 0.8 }, requirements: [{ kind: 'runs', from: 'exercises', count: 1 }, { kind: 'runs', from: 'songs', count: 1 }],
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
            // Its options overlap 1.1's (ex.b, song.b): since C5 a run judged
            // by 1.1 never meets 1.2, so the overlap is harmless — it was the
            // reason these options differed.
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
    states: statesOf(CURRICULUM),
    learned: [],
    activeTracks: ['core'],
    minutes: 30,
    today: new Date('2026-10-02T10:00:00Z'),
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

  it('adds up to the length it claims', () => {
    // The templates are what the Today screen budgets against, so one that
    // sums to 31 quietly overruns every session the owner plans around it.
    for (const template of SESSION_TEMPLATES) {
      const total = template.slots.reduce((sum, slot) => sum + slot.minutes, 0);
      expect(total, `${String(template.minutes)}-minute template`).toBe(template.minutes);
    }
  });

  it('the 30 and the 60 each get three minutes of sight-reading (P12b)', () => {
    for (const minutes of [30, 60]) {
      const slots = templateFor(minutes).slots.filter((s) => s.kind === 'sightreading');
      expect(slots.map((s) => s.minutes), `${String(minutes)}-minute template`).toEqual([3]);
    }
  });
});

describe('nextRecommended', () => {
  // Revised (C5): the rung is met by runs judged by it, where it was two
  // passed flags; the assertions stand.
  it('is the first rung the evidence has not met', () => {
    expect(nextRecommended(CURRICULUM, statesOf(CURRICULUM))?.lesson.id).toBe('1.1');
  });

  it('moves on once a rung is met', () => {
    expect(nextRecommended(CURRICULUM, statesOf(CURRICULUM, [['ex.a', '1.1'], ['song.a', '1.1']]))?.lesson.id).toBe('1.2');
  });

  it('does not move on for passes of the rung’s items judged by another rung, or by none', () => {
    // Added (C5, L8): ex.b and song.b are 1.2's too; run from 1.2 they meet
    // nothing of 1.1, and run from nowhere they meet nothing at all.
    const elsewhere = statesOf(CURRICULUM, [['ex.b', '1.2'], ['song.b', '1.2']]);
    expect(nextRecommended(CURRICULUM, elsewhere)?.lesson.id).toBe('1.1');
    expect(elsewhere.byRung.get('1.2')?.status).toBe('met');
  });

  it('sets a rung aside on the learner’s word, and comes back to it when nothing else is left', () => {
    // Added (C5): the word is kept apart from the evidence — the rung is not
    // met — and the recommendation skips it as it skips a rung behind a placement.
    const said = rungState([], CURRICULUM, VOCABULARY_V0, new Date('2026-10-02T10:00:00Z'), {
      words: { '1.1': { kind: 'known', at: '2026-10-01T10:00:00.000Z' } },
    });
    expect(nextRecommended(CURRICULUM, said)?.lesson.id).toBe('1.2');
    const bothSaid = rungState([], CURRICULUM, VOCABULARY_V0, new Date('2026-10-02T10:00:00Z'), {
      words: { '1.1': { kind: 'known', at: '2026-10-01T10:00:00.000Z' }, '1.2': { kind: 'done', at: '2026-10-01T10:00:00.000Z' } },
    });
    expect(nextRecommended(CURRICULUM, bothSaid)?.lesson.id).toBe('1.1');
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
    expect(nextRecommended(withTrack, statesOf(withTrack), ['core'])?.lesson.id).toBe('1.1');
    expect(nextRecommended(withTrack, statesOf(withTrack), ['core', 'blues-boogie'])?.lesson.id).toBe('B.1');
  });
});

describe('buildSession', () => {
  it('fills the template in order and never repeats an item', () => {
    const { slots } = buildSession(input());
    const ids = slots.map((slot) => slot.item?.id).filter(Boolean);
    expect(new Set(ids).size).toBe(ids.length);
    // Every slot the session kept is one the template asked for, in order: a
    // row it cannot fill is dropped, never invented. (The fixture catalog has
    // nothing to sight-read, so that row is legitimately missing here.)
    const wanted = templateFor(30).slots.map((slot) => slot.kind);
    let at = 0;
    for (const slot of slots) {
      at = wanted.indexOf(slot.kind, at);
      expect(at, `${slot.kind} is not where the template puts it`).toBeGreaterThanOrEqual(0);
      at += 1;
    }
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

  // Replaced (C6): "puts a due item in the review row and says so" handed the builder a list of
  // item ids due by the calendar and read "Due for review" back. The calendar is retired: a
  // learned piece comes back when it has gone the repertoire window unplayed, and the line is the
  // piece's (`repertoireRetention.test.ts` holds the rule; this is the builder's end of it).
  it('puts a learned piece past the repertoire window in the review row, in the piece’s words', () => {
    const today = new Date('2026-10-20T10:00:00Z');
    const lastPlayed = new Date(today.getTime() - (REPERTOIRE_WINDOW_DAYS + 1) * 86_400_000).toISOString();
    const { slots } = buildSession(input({ learned: [{ itemId: 'song.c', status: 'passed', lastPlayed }], lastPlayed: new Map([['song.c', lastPlayed]]), today }));
    const review = slots.find((slot) => slot.kind === 'review');
    expect(review?.item?.id).toBe('song.c');
    expect(review?.reason).toMatch(/^Keeping this piece playable/);
  });

  // Revised (C6): the seed was an index into the rung's list for every slot; it is Shuffle's turn
  // to the next candidate of the claim that chose each slot. The card still changes.
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
    expect(options[0]?.tier).toBe('lesson');
    // Nothing already in today's card.
    const inCard = new Set(slots.map((s) => s.item?.id));
    for (const option of options) expect(inCard.has(option.item.id)).toBe(false);
  });

  it('the "not a song" filter removes songs', () => {
    const { slots } = buildSession(input());
    const slot = slots.find((s) => s.kind === 'new');
    const options = swapOptions(slot as never, slots, CURRICULUM, indexCatalog(ITEMS), {
      excludeSongs: true,
      items: ITEMS,
    });
    expect(options.every((option) => option.item.type !== 'song')).toBe(true);
  });

  // Replaced (C6): "falls back to something at the same level rather than coming back empty"
  // offered anything of the same type within one level. The last resort is now the same kind of
  // exercise from the lessons reached, said as such; with nothing taught of its kind, nothing.
  it('with no tier to offer, the same kind from the lessons reached, and nothing from no lesson', () => {
    const slot = { kind: 'review' as const, minutes: 5, item: ITEMS[2] as CatalogItem, reason: '' };
    const options = swapOptions(slot, [slot], CURRICULUM, indexCatalog(ITEMS), { items: ITEMS });
    expect(options.map((option) => [option.item.id, option.tier])).toEqual([
      ['ex.b', 'kind'],
      ['ex.a', 'kind'],
    ]);
    const lonely = [item('only.one', { concepts: ['unique'] }), item('near.by', { concepts: ['other'] })];
    const alone = { kind: 'technique' as const, minutes: 5, item: lonely[0], reason: '' };
    expect(swapOptions(alone, [alone], CURRICULUM, indexCatalog(lonely), { items: lonely })).toEqual([]);
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
