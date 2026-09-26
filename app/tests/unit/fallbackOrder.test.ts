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
 */
import { describe, expect, it } from 'vitest';
import { buildSession, FALLBACK_ORDER, type SessionSlot } from '../../src/curriculum/session';
import { indexCatalog } from '../../src/curriculum/selectors';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import { rungState } from '../../src/evidence/rungState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';

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
    item('ex.r1', { targetSkills: ['subdivision'], file: null }),
    item('ex.r2'),
    item('ex.skill', { targetSkills: ['subdivision'] }),
    item('ex.demand', { demands: ['rhythm.eighths'] }),
    item('ex.pre'),
    item('ex.expo', { file: null, drill: { kind: 'scale', params: {} } }),
    // The trap: at the stage's level, on the technique track, on no rung, sharing nothing.
    item('ex.near', { level: 1, tracks: ['technique', 'core'] }),
    item('song.near', { type: 'song', level: 1 }),
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
        }).slots;
        for (const slot of slots) {
          expect(['ex.near', 'song.near'], `${slot.kind} at ${String(minutes)} min, gone ${gone.join(',')}`).not.toContain(slot.item?.id);
        }
      }
    }
  });
});
