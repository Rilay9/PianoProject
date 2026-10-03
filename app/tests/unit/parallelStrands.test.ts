/**
 * The card chooses across the strands the learner is on, never from one place
 * in the file's order (C6; the reviewer's parallel-strand finding, 2026-09-26).
 *
 * The curriculum is not one ladder: the core path runs Stages 0–4, tracks run
 * beside it from Stage 3 (How to practise from Stage 1) and alone from Stage 5,
 * and Stage 9 is projects ("Nothing here is a rung to pass; they are pieces to
 * live with"). `nextRecommended` walks every switched-on track in the file's
 * order and returns one first unmet rung, so with the fresh tracks (core,
 * classical, chords-pop, theory-ear, technique, practice) a learner whose core
 * path is at 4.1 and who has How to practise, a classical, a theory and a
 * technique rung open was placed on the first of them in the file. Until C6
 * every slot came off that one rung.
 *
 * What is asserted is which strands the slots served and what the lines said,
 * never which item won; and that reordering the file changes neither.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildSession, nextRecommended, readerPosition, type SessionSlot } from '../../src/curriculum/session';
import { indexCatalog } from '../../src/curriculum/selectors';
import { defaultActiveTracks } from '../../src/curriculum/tracks';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import type { RungReading, RungStates } from '../../src/evidence/rungState';
import { measured } from './helpers/measured';

const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const index = indexCatalog(catalog);
const TODAY = new Date(2026, 9, 20, 9);
const ACTIVE = defaultActiveTracks(curriculum);

/** The rung state of a learner who has met every core rung before 4.1 and nothing else. */
function coreTo41(where: Curriculum): RungStates {
  const byRung = new Map<string, RungReading>();
  for (const stage of where.stages) {
    for (const unit of stage.units) {
      if (unit.track !== 'core' || stage.number > 3) continue;
      for (const rung of unit.lessons) {
        byRung.set(rung.id, {
          rung,
          status: 'met',
          judged: true,
          carried: false,
          requirements: (rung.requirements ?? []).map((requirement) => ({ requirement, holds: requirement.kind === 'unjudged' ? 'unjudged' : true, have: 1, need: 1, items: [] })),
        });
      }
    }
  }
  return { byRung };
}

/** The same curriculum with every stage's track units before its core units: each track's own order kept. */
const REVERSED: Curriculum = {
  ...curriculum,
  stages: curriculum.stages.map((stage) => ({ ...stage, units: [...stage.units.filter((u) => u.track !== 'core'), ...stage.units.filter((u) => u.track === 'core')] })),
};

function card(where: Curriculum): SessionSlot[] {
  return buildSession({
    curriculum: where,
    catalog: index,
    items: catalog,
    states: coreTo41(where),
    learned: [],
    lastPlayed: new Map(),
    activeTracks: ACTIVE,
    minutes: 30,
    today: TODAY,
  }).slots;
}

const trackOf = (rungId: string): string => curriculum.stages.flatMap((s) => s.units).find((u) => u.lessons.some((l) => l.id === rungId))?.track ?? '?';
const titleOf = (track: string): string => curriculum.tracks.find((t) => t.id === track)?.title ?? track;

/** The strand a slot served, from its claim: the rung it asked from or drew from. */
function strandOf(slot: SessionSlot): string | undefined {
  const claim = slot.claim;
  if (!claim) return undefined;
  if (claim.kind === 'asked' || claim.kind === 'rung' || claim.kind === 'prerequisite' || claim.kind === 'jam') return trackOf(claim.rung.id);
  return undefined;
}

describe('four strands with unmet work, and the file order', () => {
  it('the global walk’s one position is a track rung ahead of core 4.1: the old source of the monopoly', () => {
    const position = nextRecommended(curriculum, coreTo41(curriculum), ACTIVE);
    expect(position?.lesson.id).not.toBe('4.1');
    expect(trackOf(position?.lesson.id ?? '')).not.toBe('core');
  });

  for (const [name, where] of [
    ['the file’s order', curriculum],
    ['every stage’s tracks before its core units', REVERSED],
  ] as const) {
    describe(name, () => {
      const slots = (): SessionSlot[] => card(where);
      const served = (): Map<SessionSlot['kind'], string | undefined> => new Map(slots().map((slot) => [slot.kind, strandOf(slot)]));

      it('the warm-up, the new piece and the repertoire do not all come from one strand', () => {
        const three = ['technique', 'new', 'repertoire'].map((kind) => served().get(kind as SessionSlot['kind'])).filter((one): one is string => one !== undefined);
        expect(three.length, JSON.stringify([...served()])).toBeGreaterThanOrEqual(2);
        expect(new Set(three).size, JSON.stringify([...served()])).toBeGreaterThan(1);
      });

      it('the core path, the spine, keeps a slot: its 4.1 asks are on the card', () => {
        const core = slots().filter((slot) => slot.claim?.kind === 'asked' && slot.claim.rung.id === '4.1');
        expect(core.length, slots().map((s) => `${s.kind}: ${s.reason}`).join(' | ')).toBeGreaterThan(0);
        for (const slot of core) expect(slot.reason).toMatch(/^This lesson( asks for it|: \d+ of \d+ counted)/);
      });

      it('a line a track asked for names the track; the core path’s says "this lesson"', () => {
        const tracks = slots().filter((slot) => slot.claim?.kind === 'asked' && trackOf(slot.claim.rung.id) !== 'core');
        expect(tracks.length, slots().map((s) => `${s.kind}: ${s.reason}`).join(' | ')).toBeGreaterThan(0);
        for (const slot of tracks) {
          const claim = slot.claim as Extract<NonNullable<SessionSlot['claim']>, { kind: 'asked' }>;
          expect(slot.reason, slot.kind).toContain(titleOf(trackOf(claim.rung.id)));
          expect(slot.reason, slot.kind).not.toMatch(/^This lesson/);
        }
      });

      it('the reading slot reads from the spine: 3.4’s row, not the level-one row before How to practise', () => {
        expect(slots().find((slot) => slot.kind === 'sightreading')?.item?.id).toBe('drill.reading.sight-reading-2');
      });
    });
  }
});

/**
 * Stage 9 is projects. A strand at Stage 8 whose rung waits on its reads is not
 * offered the project as "the next lesson"; a strand at Stage 9 is offered its
 * project in a project's words, never as a rung to pass.
 */
describe('a project is not the next rung', () => {
  // Revised (X1, L113): measured, as every bundled row is. An unmeasured option on a rung's list is refused
  // as any automatic offer of it is (`oneGateBoundary.test.ts`).
  const item = (id: string, over: Partial<CatalogItem> = {}): CatalogItem => ({ id, type: 'song', title: id, level: 8, hands: 'both', tracks: ['classical'], concepts: [], file: `scores/${id}.mxl`, ...measured([]), ...over });
  const ITEMS = [item('song.eight'), item('song.eight.b'), item('song.project'), item('ex.core', { type: 'exercise' })];
  const lesson = (id: string, title: string, over: Partial<Lesson>): Lesson => ({
    id,
    title,
    concepts: [],
    textFile: `lessons/${id}.md`,
    exerciseOptions: [],
    songOptions: [],
    mastery: { minAccuracy: 0.9, minTempoPct: 0.8 },
    requirements: [{ kind: 'runs', from: 'songs', count: 1 }],
    ...over,
  });
  const where: Curriculum = {
    version: 1,
    tracks: [
      { id: 'core', title: 'Core path', description: '', startsAtStage: 0 },
      { id: 'classical', title: 'Classical', description: '', startsAtStage: 3 },
    ],
    stages: [
      { number: 4, title: 'Four', summary: '', units: [{ id: 'c4', title: 'C4', track: 'core', lessons: [lesson('4.9', 'The last core rung', { exerciseOptions: ['ex.core'], songOptions: [], requirements: [{ kind: 'runs', from: 'exercises', count: 1 }] })] }] },
      {
        number: 8,
        title: 'Eight',
        summary: '',
        units: [
          {
            id: 'k8',
            title: 'K8',
            track: 'classical',
            lessons: [
              lesson('classical.8', 'Advanced classical', {
                songOptions: ['song.eight', 'song.eight.b'],
                requirements: [
                  { kind: 'runs', from: 'songs', count: 1 },
                  { kind: 'skill', skill: 'key-signature', state: 'familiar' },
                ],
              }),
            ],
          },
        ],
      },
      { number: 9, title: 'Projects', summary: 'Nothing here is a rung to pass; they are pieces to live with.', units: [{ id: 'k9', title: 'K9', track: 'classical', lessons: [lesson('classical.9', 'A sonata to live with', { songOptions: ['song.project'] })] }] },
    ],
  };
  const met = (rung: Lesson): RungReading => ({ rung, status: 'met', judged: true, carried: false, requirements: [] });
  const lessons = where.stages.flatMap((s) => s.units.flatMap((u) => u.lessons));
  const byId = (id: string): Lesson => lessons.find((l) => l.id === id) as Lesson;

  it('at Stage 8, waiting on its reads, the new slot does not begin the project', () => {
    // Core done; classical.8's song counted, its key-signature skill not yet shown.
    const eight = byId('classical.8');
    const states: RungStates = {
      byRung: new Map<string, RungReading>([
        ['4.9', met(byId('4.9'))],
        [
          'classical.8',
          {
            rung: eight,
            status: 'in progress',
            judged: true,
            carried: false,
            requirements: [
              { requirement: eight.requirements[0] as Lesson['requirements'][number], holds: true, have: 1, need: 1, items: ['song.eight'] },
              { requirement: eight.requirements[1] as Lesson['requirements'][number], holds: false, have: 0, need: 1, items: [] },
            ],
          },
        ],
      ]),
    };
    const slots = buildSession({ curriculum: where, catalog: indexCatalog(ITEMS), items: ITEMS, states, learned: [], activeTracks: ['core', 'classical'], minutes: 30, today: TODAY }).slots;
    for (const slot of slots) {
      expect(slot.item?.id, `${slot.kind}: ${slot.reason}`).not.toBe('song.project');
      expect(slot.reason, slot.kind).not.toMatch(/Next lesson/);
    }
  });

  it('at Stage 9 the project is offered as a piece to live with, never as a rung that asks', () => {
    const states: RungStates = { byRung: new Map<string, RungReading>([['4.9', met(byId('4.9'))], ['classical.8', met(byId('classical.8'))]]) };
    const slots = buildSession({ curriculum: where, catalog: indexCatalog(ITEMS), items: ITEMS, states, learned: [], activeTracks: ['core', 'classical'], minutes: 30, today: TODAY }).slots;
    const project = slots.find((slot) => slot.item?.id === 'song.project');
    expect(project, slots.map((s) => `${s.kind}: ${s.reason}`).join(' | ')).toBeDefined();
    expect(project?.reason).toBe('Classical: a piece to live with');
    expect(project?.reason).not.toMatch(/asks for|counted/);
  });
});

/**
 * The reviewer's boundary (2026-09-26): a rung bypassed by the placement or set
 * aside by the learner's word is not new unmet work because the work ahead of
 * it is done. `nextRecommended` falls back to such rungs once nothing ahead is
 * left (its `firstBehind` and `firstSetAside`, C5's, still read by the status
 * line and Plan); the slots and the reader never do.
 */
describe('a bypassed rung is not new work', () => {
  const CORE = curriculum.stages.flatMap((stage) => stage.units.filter((unit) => unit.track === 'core').flatMap((unit) => unit.lessons));
  const at31 = CORE.findIndex((lesson) => lesson.id === '3.1');
  const behind = new Set(CORE.slice(0, at31).map((lesson) => lesson.id));
  // Placed at 3.1, every core rung from it on met, one rung before it set aside by the learner's word.
  const byRung = new Map<string, RungReading>();
  for (const rung of CORE.slice(at31)) byRung.set(rung.id, { rung, status: 'met', judged: true, carried: false, requirements: [] });
  const known = CORE.find((lesson) => lesson.id === '2.2') as Lesson;
  byRung.set('2.2', { rung: known, status: 'not started', judged: true, carried: false, requirements: [], word: { kind: 'known', at: '2026-10-01T10:00:00.000Z' } });
  const states: RungStates = { byRung };

  it('the global walk still falls back to a bypassed rung (C5’s, reported); the reader and the slots do not', () => {
    expect(behind.has(nextRecommended(curriculum, states, ['core'], { startAt: '3.1' })?.lesson.id ?? '')).toBe(true);
    expect(readerPosition(curriculum, states, ['core'], { startAt: '3.1' })).toBeUndefined();
    const slots = buildSession({ curriculum, catalog: index, items: catalog, states, learned: [], lastPlayed: new Map(), activeTracks: ['core'], minutes: 60, startAt: '3.1', today: TODAY }).slots;
    for (const slot of slots) {
      const claim = slot.claim;
      if (claim?.kind === 'asked' || claim?.kind === 'rung' || claim?.kind === 'prerequisite') {
        expect(behind.has(claim.rung.id) || claim.rung.id === '2.2', `${slot.kind}: ${slot.reason}`).toBe(false);
      }
      expect(slot.reason, slot.kind).not.toMatch(/asks for/);
    }
  });
});
