/**
 * The fallback ladder (C6 item 5; backlog L14; the test inventory's Q6 row
 * `fallbackOrder`).
 *
 * When a slot's first claim finds nothing, the next weaker claim is tried, in
 * one stated order — the rung's own option; an item declaring the same target
 * skill; an item carrying the same demand; a prerequisite rung's item; an
 * exposure choice — and the reason line names the claim used. Nothing is ever
 * chosen because its level is within one of the stage number: those windows
 * (`Math.abs(item.level - level) <= 1`, `item.level <= level + 1`,
 * `item.level < level + 2`) were every slot's fallback until C6, and a trap
 * item sits at the stage's level on no rung to prove they are gone.
 *
 * The constructed rung R asks for subdivision; its only exercise that trains it
 * cannot be played. Each case below takes away the candidates of the tiers
 * before it, so the slot has to walk one step further down.
 *
 * The constructed exercises declare their skills and the session reads them
 * with `EVERY_DECLARED_SKILL` (D0): as shipped, the skill step acts on the
 * reading rows' skills only (`skillActivationBoundary.test.ts`), and this file
 * exercises the step itself.
 *
 * **Revised (E0).** The skill and demand steps go through the one gate
 * (`eligibility.ts`): the candidate's notes provide the skill's or the demand's
 * opportunity at a useful density and the learner can cope with every demand it
 * measures. So the constructed exercises carry their measurement
 * (`helpers/measured`), and the vocabulary this file hands the session says its
 * earlier lesson E teaches eighth notes — the constructed curriculum has none of
 * the real rungs `taughtAt` names. Old assumption: a declared skill, or a bare
 * demand id, was enough to be offered.
 */
import { describe, expect, it } from 'vitest';
import { buildSession, FALLBACK_ORDER, type SessionSlot } from '../../src/curriculum/session';
import { indexCatalog } from '../../src/curriculum/selectors';
import { EVERY_DECLARED_SKILL } from '../../src/curriculum/skillActivation';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import { rungState, type RungReading } from '../../src/evidence/rungState';
import { VOCABULARY_V0, type Vocabulary } from '../../src/evidence/vocabulary';
import { measured } from './helpers/measured';

/** Vocabulary v0 with eighth notes taught at the constructed lesson E. */
const VOCABULARY: Vocabulary = {
  ...VOCABULARY_V0,
  demands: VOCABULARY_V0.demands.map((demand) => (demand.id === 'rhythm.eighths' ? { ...demand, taughtAt: ['E'] } : demand)),
};

const TODAY = new Date(2026, 9, 20, 9);

function item(id: string, over: Partial<CatalogItem> = {}): CatalogItem {
  return { id, type: 'exercise', title: id, level: 1.5, hands: 'right', tracks: ['core'], concepts: [], file: `scores/${id}.mxl`, ...over };
}

const lesson = (id: string, title: string, over: Partial<Lesson>): Lesson => ({
  id,
  title,
  concepts: [],
  textFile: `lessons/${id}.md`,
  exerciseOptions: [],
  songOptions: [],
  mastery: { minAccuracy: 0.9, minTempoPct: 0.8 },
  requirements: [{ kind: 'runs', from: 'exercises', count: 1 }],
  ...over,
});

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
          id: 'u',
          title: 'U',
          track: 'core',
          lessons: [
            lesson('E', 'An earlier lesson', { exerciseOptions: ['ex.skill', 'ex.demand', 'ex.expo'] }),
            lesson('P', 'The lesson R builds on', { exerciseOptions: ['ex.pre'] }),
            lesson('R', 'The lesson asking for subdivision', {
              exerciseOptions: ['ex.r1', 'ex.r2'],
              requirements: [{ kind: 'skill', skill: 'subdivision', state: 'familiar' }],
              prerequisites: ['P'],
            }),
          ],
        },
      ],
    },
  ],
};

/** Every candidate, each for one tier; `gone` lists the ones that cannot be played in a case. */
function catalog(gone: readonly string[]): CatalogItem[] {
  const all = [
    // R's own exercise that trains the skill, never playable: the first claim always fails.
    item('ex.r1', { targetSkills: ['subdivision'], file: null, ...measured(['rhythm.eighths']) }),
    item('ex.r2', measured([])),
    item('ex.skill', { targetSkills: ['subdivision'], ...measured(['rhythm.eighths']) }),
    item('ex.demand', measured(['rhythm.eighths'])),
    item('ex.pre', measured([])),
    item('ex.expo', { file: null, drill: { kind: 'scale', params: {} } }),
    // The trap: at the stage's level, on the technique track, on no rung, sharing nothing.
    item('ex.near', { level: 1, tracks: ['technique', 'core'], ...measured([]) }),
    item('song.near', { type: 'song', level: 1, ...measured([]) }),
  ];
  return all.map((one) => (gone.includes(one.id) ? { ...one, file: null, drill: null } : one));
}

function warmup(gone: readonly string[]): SessionSlot | undefined {
  const items = catalog(gone);
  return buildSession({
    curriculum: CURRICULUM,
    catalog: indexCatalog(items),
    items,
    // E and P behind the placement: reached, not met — what a learner placed at R has.
    states: rungState([], CURRICULUM, VOCABULARY_V0, TODAY),
    rows: [],
    learned: [],
    lastPlayed: new Map(),
    activeTracks: ['core'],
    minutes: 15,
    startAt: 'R',
    today: TODAY,
    skillActivation: EVERY_DECLARED_SKILL,
    vocabulary: VOCABULARY,
  }).slots.find((slot) => slot.kind === 'technique');
}

describe('the order is stated once', () => {
  it('the rung’s own option, the same target skill, the same demand, a prerequisite, exposure', () => {
    expect(FALLBACK_ORDER).toEqual(['rung', 'skill', 'demand', 'prerequisite', 'exposure']);
  });
});

describe('the warm-up walks the ladder one claim at a time, and the line names the claim', () => {
  it('1. the rung’s own option', () => {
    const slot = warmup([]);
    expect(slot?.item?.id).toBe('ex.r2');
    expect(slot?.claim?.kind).toBe('rung');
    expect(slot?.reason).toMatch(/this lesson/i);
  });

  it('2. an item declaring the same target skill', () => {
    const slot = warmup(['ex.r2']);
    expect(slot?.item?.id).toBe('ex.skill');
    expect(slot?.claim).toMatchObject({ kind: 'skill', skill: 'subdivision' });
    expect(slot?.reason).toMatch(/subdivision/i);
  });

  it('3. an item carrying the same demand', () => {
    const slot = warmup(['ex.r2', 'ex.skill']);
    expect(slot?.item?.id).toBe('ex.demand');
    expect(slot?.claim).toMatchObject({ kind: 'demand', demand: 'rhythm.eighths' });
    expect(slot?.reason).toMatch(/eighth notes/);
  });

  it('4. a prerequisite rung’s item', () => {
    const slot = warmup(['ex.r2', 'ex.skill', 'ex.demand']);
    expect(slot?.item?.id).toBe('ex.pre');
    expect(slot?.claim).toMatchObject({ kind: 'prerequisite', rung: { id: 'P' } });
    expect(slot?.reason).toContain('The lesson R builds on');
  });

  it('5. an exposure choice', () => {
    const slot = warmup(['ex.r2', 'ex.skill', 'ex.demand', 'ex.pre']);
    expect(slot?.item?.id).toBe('ex.expo');
    expect(slot?.claim?.kind).toBe('exposure');
    expect(slot?.reason).toMatch(/scales/i);
  });

  it('then nothing: the row is dropped, never filled by a level window', () => {
    expect(warmup(['ex.r2', 'ex.skill', 'ex.demand', 'ex.pre', 'ex.expo'])).toBeUndefined();
  });

  it('the trap at the stage’s level is never offered, at any step, in any slot', () => {
    const steps = [[], ['ex.r2'], ['ex.r2', 'ex.skill'], ['ex.r2', 'ex.skill', 'ex.demand'], ['ex.r2', 'ex.skill', 'ex.demand', 'ex.pre'], ['ex.r2', 'ex.skill', 'ex.demand', 'ex.pre', 'ex.expo']];
    for (const gone of steps) {
      for (const minutes of [15, 30, 60, 120]) {
        const items = catalog(gone);
        const slots = buildSession({
          curriculum: CURRICULUM,
          catalog: indexCatalog(items),
          items,
          states: rungState([], CURRICULUM, VOCABULARY_V0, TODAY),
          rows: [],
          learned: [],
          lastPlayed: new Map(),
          activeTracks: ['core'],
          minutes,
          startAt: 'R',
          today: TODAY,
          skillActivation: EVERY_DECLARED_SKILL,
          vocabulary: VOCABULARY,
        }).slots;
        for (const slot of slots) {
          expect(['ex.near', 'song.near'], `${slot.kind} at ${String(minutes)} min, gone ${gone.join(',')}`).not.toContain(slot.item?.id);
        }
      }
    }
  });
});

/**
 * Exposure never jumps the ladder (the reviewer's correction to C6, 2026-09-26).
 * The review and the repertoire row took a seven-day exposure choice straight
 * after their own claim (retention; the demand-ready piece), so it ran before
 * the ladder's rung, skill, demand and prerequisite steps ever saw the slot:
 * `FALLBACK_ORDER` said exposure was last and the code put it second. A due
 * retention need may outrank ordinary work (it is forgetting); generic breadth
 * may not. Here a learner with a history, on R (which builds on P), with the
 * classical track beside it (C1 met, C2 next) and a classical piece and a kind
 * of exercise nobody has played for a week or ever: an exposure choice is
 * always available, and whether the ladder has something decides who wins.
 */
describe('exposure comes after the ladder, never ahead of it', () => {
  const TRACKS: Curriculum['tracks'] = [
    { id: 'core', title: 'Core', description: '', startsAtStage: 0 },
    { id: 'classical', title: 'Classical', description: '', startsAtStage: 1 },
  ];
  const W: Curriculum = {
    version: 1,
    tracks: TRACKS,
    stages: [
      {
        number: 1,
        title: 'One',
        summary: '',
        units: [
          {
            id: 'u',
            title: 'U',
            track: 'core',
            lessons: [
              lesson('E', 'An earlier lesson', { exerciseOptions: ['ex.e.scale'], songOptions: ['song.e'] }),
              lesson('P', 'The lesson R builds on', { exerciseOptions: ['ex.p'], songOptions: ['song.p'] }),
              lesson('R', 'This lesson', {
                exerciseOptions: ['ex.r1', 'ex.r2'],
                songOptions: ['song.r1', 'song.r2'],
                requirements: [
                  { kind: 'runs', from: 'exercises', count: 1 },
                  { kind: 'runs', from: 'songs', count: 1 },
                ],
                prerequisites: ['P'],
              }),
            ],
          },
          {
            id: 'k',
            title: 'K',
            track: 'classical',
            lessons: [
              lesson('C1', 'Classical, first', { exerciseOptions: [], songOptions: ['song.c1'], requirements: [{ kind: 'runs', from: 'songs', count: 1 }] }),
              lesson('C2', 'Classical, next', { exerciseOptions: ['ex.c2'], songOptions: ['song.c2', 'song.c2b'], requirements: [{ kind: 'runs', from: 'songs', count: 1 }] }),
            ],
          },
        ],
      },
    ],
  };
  const all = (gone: readonly string[]): CatalogItem[] =>
    [
      item('ex.e.scale', { file: null, drill: { kind: 'scale', params: {} } }),
      item('song.e', { type: 'song' }),
      item('ex.p'),
      item('song.p', { type: 'song' }),
      item('ex.r1'),
      item('ex.r2'),
      item('song.r1', { type: 'song' }),
      item('song.r2', { type: 'song' }),
      item('song.c1', { type: 'song', tracks: ['classical'] }),
      item('ex.c2'),
      item('song.c2', { type: 'song', tracks: ['classical'] }),
      item('song.c2b', { type: 'song', tracks: ['classical'] }),
    ].map((one) => (gone.includes(one.id) ? { ...one, file: null, drill: null } : one));
  const met = (id: string) => {
    const rung = W.stages[0]?.units.flatMap((u) => u.lessons).find((l) => l.id === id) as Lesson;
    const reading: RungReading = { rung, status: 'met', judged: true, carried: false, requirements: [] };
    return [id, reading] as const;
  };
  const tenDaysAgo = new Date(2026, 9, 10, 12).toISOString();
  function card(minutes: number, gone: readonly string[] = []): SessionSlot[] {
    const items = all(gone);
    return buildSession({
      curriculum: W,
      catalog: indexCatalog(items),
      items,
      states: { byRung: new Map([met('E'), met('P'), met('C1')]) },
      rows: [],
      learned: [],
      // A history to balance: the prerequisite's exercise, ten days ago. The scale and the classical
      // piece before C2 have never been played, so each is a seven-day exposure candidate.
      lastPlayed: new Map([['ex.p', tenDaysAgo]]),
      activeTracks: ['core', 'classical'],
      minutes,
      today: TODAY,
    }).slots;
  }
  const slot = (slots: SessionSlot[], kind: SessionSlot['kind']) => slots.find((one) => one.kind === kind);

  it('review: a rung candidate and an exposure candidate — the rung wins, and says nothing is due', () => {
    const review = slot(card(15), 'review');
    expect(review?.claim?.kind, review?.reason).toBe('rung');
    expect(review?.reason).toMatch(/^Nothing due for review — more from/);
  });

  it('review: when the first strand in today’s order has nothing, the next strand’s rung still comes before exposure', () => {
    // Classical, never played, is first in today's order; C2's other options are gone and it builds on
    // nothing. The core path's rung still has an exercise: every strand's rung is tried before exposure.
    const review = slot(card(15, ['ex.c2', 'song.c2b']), 'review');
    expect(review?.claim?.kind, review?.reason).toBe('rung');
    expect(review?.reason).toBe('Nothing due for review — more from this lesson');
  });

  it('review: no rung, prerequisite or other strand has anything — then exposure, said with its family', () => {
    const review = slot(card(15, ['ex.r2', 'song.r1', 'song.r2', 'ex.p', 'song.p', 'ex.c2', 'song.c2b']), 'review');
    expect(review?.claim?.kind, review?.reason).toBe('exposure');
    expect(review?.reason).toMatch(/^Scales, from your lessons — not played yet$/);
  });

  it('repertoire: a rung’s song and a week-unplayed style — the rung’s song wins, with its words', () => {
    const repertoire = slot(card(30), 'repertoire');
    expect(repertoire?.claim?.kind, repertoire?.reason).toBe('rung');
    expect(repertoire?.reason).toMatch(/^More music from /);
    expect(repertoire?.item?.id).not.toBe('song.c1');
  });

  it('repertoire: no rung or prerequisite song is left — then exposure', () => {
    const repertoire = slot(card(30, ['song.r1', 'song.r2', 'song.p', 'song.c2', 'song.c2b']), 'repertoire');
    expect(repertoire?.claim?.kind, repertoire?.reason).toBe('exposure');
    expect(repertoire?.reason).toMatch(/^For variety: /);
  });
});
