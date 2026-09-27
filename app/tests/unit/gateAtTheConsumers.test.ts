/**
 * The one gate at the consumers (E0 item 4; Part 23's activation condition, L36):
 * once every piece carries measured demands, C6's dormant demand tier and the
 * repertoire slot's demand claim go live — and they go live only through the gate.
 *
 * Written against the consumers' own signatures (`tieredAlternatives`,
 * `swapOptions`, `buildSession`), with constructed items carrying the measurement
 * the build writes, so the same file runs on the code before E0 and shows the traps
 * it springs there: a candidate sharing a demand incidentally, an unmeasured
 * same-lesson option, a declared skill the notes do not carry, a level-close
 * candidate the learner is not ready for, a declared large-hand voicing, and a
 * repertoire piece whose new demand is only incidental.
 */
import { describe, expect, it } from 'vitest';
import { buildSession } from '../../src/curriculum/session';
import { indexCatalog, tieredAlternatives } from '../../src/curriculum/selectors';
import { EVERY_DECLARED_SKILL } from '../../src/curriculum/skillActivation';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import type { SessionRow } from '../../src/data/db';
import { EVIDENCE_DEFINITIONS, type MeasuredEvidence } from '../../src/evidence/evidence';
import { rungState } from '../../src/evidence/rungState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';

/** The build's measurement of a constructed item: `established` at a useful density, the rest incidental. */
function measured(demands: string[], established: string[] = demands): Partial<CatalogItem> {
  const bars = 16;
  return {
    demands,
    measurement: {
      status: 'measured',
      definitions: 3,
      located: Object.fromEntries(demands.map((d) => [d, established.includes(d) ? bars : 1])),
      bars,
      steps: bars * 4,
      notes: bars * 4,
      established,
    },
  };
}

function song(id: string, over: Partial<CatalogItem> = {}): CatalogItem {
  return { id, type: 'song', title: id, level: 2, hands: 'both', tracks: ['core'], concepts: [], file: `scores/${id}.mxl`, ...over };
}

const lesson = (id: string, over: Partial<Lesson> = {}): Lesson => ({
  id,
  title: `Lesson ${id}`,
  concepts: [],
  textFile: `lessons/${id}.md`,
  exerciseOptions: [],
  songOptions: [],
  mastery: { minAccuracy: 0.9, minTempoPct: 0.8 },
  requirements: [{ kind: 'runs', from: 'songs', count: 1 }],
  ...over,
});

/** A learner whose lessons have taught steps and skips. */
const LEARNER = { taught: (demand: string) => demand === 'interval.step' || demand === 'interval.skip' };

describe('the swap sheet’s tiers', () => {
  const curriculum: Curriculum = {
    version: 1,
    tracks: [],
    stages: [{ number: 1, title: 'One', summary: '', units: [{ id: 'u', title: 'U', track: 'core', lessons: [lesson('1.5', { songOptions: ['song.source', 'song.unmeasured-option'] })] }] }],
  };
  const catalog = indexCatalog([
    song('song.source', { targetSkills: ['interval-reading'], ...measured(['interval.step', 'interval.skip'], ['interval.skip']) }),
    // Same lesson, never measured: not an equivalent option.
    song('song.unmeasured-option', { demands: 'unmeasured', measurement: { status: 'unmeasured', reason: 'constructed' } }),
    // Shares a step, which every piece has, and nothing the row is for.
    song('song.shares-a-step', { level: 2, ...measured(['interval.step']) }),
    // Declares the row's skill and its notes carry none of that skill's opportunity at density.
    song('song.declares-but-lacks', { level: 2, targetSkills: ['interval-reading'], ...measured(['interval.step', 'interval.skip'], []) }),
    // At the row's level, provides skips, and brings a leap the learner has not met.
    song('song.close-not-ready', { level: 2, ...measured(['interval.step', 'interval.skip', 'interval.leap']) }),
    // Three levels away and clean.
    song('song.far-clean', { level: 5, ...measured(['interval.step', 'interval.skip']) }),
    // A declared large-hand voicing, its alternative not yet shown to the learner.
    song('song.large-hand', {
      level: 2,
      ...measured(['interval.step', 'interval.skip']),
      provenance: { source: 'generated', facts: {}, review: { score: null, teaching: null }, physical: { prerequisite: 'a ninth', alternative: 'the root in the left hand' } },
    }),
  ]);
  const tiers = () =>
    (tieredAlternatives as (...args: unknown[]) => ReturnType<typeof tieredAlternatives>)(
      { itemId: 'song.source', lessonId: '1.5', limit: 50 },
      curriculum,
      catalog,
      EVERY_DECLARED_SKILL,
      LEARNER,
    );

  it('offers only the clean candidate that provides the demand the row exists for', () => {
    expect(tiers().map((one) => [one.item.id, one.tier])).toEqual([['song.far-clean', 'demand']]);
  });

  it('never offers an incidental sharer, an unmeasured option, a declaration the notes lack, an unready candidate or a large-hand voicing', () => {
    const ids = tiers().map((one) => one.item.id);
    for (const refused of ['song.shares-a-step', 'song.unmeasured-option', 'song.declares-but-lacks', 'song.close-not-ready', 'song.large-hand']) {
      expect(ids, refused).not.toContain(refused);
    }
  });
});

describe('the repertoire slot’s claim', () => {
  const TODAY = new Date(2026, 9, 20, 9);
  // One core rung, 1.5, which the vocabulary says teaches skips and leaps.
  const curriculum: Curriculum = {
    version: 1,
    tracks: [{ id: 'core', title: 'Core', description: '', startsAtStage: 0 }],
    stages: [
      {
        number: 1,
        title: 'One',
        summary: '',
        units: [{ id: 'u', title: 'U', track: 'core', lessons: [lesson('1.5', { exerciseOptions: [], songOptions: ['song.rung'], requirements: [{ kind: 'runs', from: 'songs', count: 1 }] })] }],
      },
    ],
  };
  /** A stored run whose evidence supports reading by interval: familiar on one supporting record. */
  const shown: SessionRow = {
    itemId: 'drill.reader',
    mode: 'tempo',
    tempoPct: 100,
    tempoMeasured: true,
    accuracy: 1,
    accuracyEstimated: false,
    wrongNotes: 0,
    missed: 0,
    durationMs: 1000,
    at: new Date(2026, 9, 19, 12).toISOString(),
    evidenceDefinitions: EVIDENCE_DEFINITIONS,
    evidence: [
      {
        kind: 'measured',
        skill: 'interval-reading',
        standard: 'practice',
        n: 8,
        right: 8,
        at: new Date(2026, 9, 19, 12).toISOString(),
        observationId: 1,
        context: { itemId: 'drill.reader', firstContact: true, met: [], unattributed: 0, estimated: false },
        byDemand: [],
      } as unknown as MeasuredEvidence,
    ],
  };
  const repertoireOf = (items: CatalogItem[]) =>
    buildSession({
      curriculum,
      catalog: indexCatalog(items),
      items,
      states: rungState([], curriculum, VOCABULARY_V0, TODAY),
      rows: [shown],
      learned: [],
      lastPlayed: new Map(),
      activeTracks: ['core'],
      minutes: 30,
      today: TODAY,
    }).slots.find((slot) => slot.kind === 'repertoire');

  it('a piece whose new demand is only incidental is not "a piece with skips"', () => {
    const incidental = song('song.skips-incidental', measured(['interval.step', 'interval.skip'], ['interval.step']));
    const rung = song('song.rung', measured(['interval.step']));
    const slot = repertoireOf([rung, incidental]);
    expect(slot?.claim?.kind === 'ready' ? slot.item?.id : undefined).toBeUndefined();
  });

  it('a piece providing the new demand, every demand supported by the reads, is', () => {
    const clean = song('song.skips-clean', measured(['interval.step', 'interval.skip']));
    const rung = song('song.rung', measured(['interval.step']));
    const slot = repertoireOf([rung, clean]);
    expect(slot?.claim).toMatchObject({ kind: 'ready', demand: 'interval.skip' });
    expect(slot?.item?.id).toBe('song.skips-clean');
  });
});
