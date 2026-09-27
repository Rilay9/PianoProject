/**
 * An alternative is an alternative because it trains the same thing (C6 item 6;
 * backlog L12's third reader, L36).
 *
 * `alternativesFor`'s third tier was "anything within half a level sharing a
 * concept tag", and `repertoire` is a tag on every quarried piece and on nothing
 * else, so for a PDMX piece it was a level window over 542 pieces (the
 * repertoire trace, P1-4). Now the tiers are claims: the same lesson; a stand-in
 * the item's author named; an item sharing a target skill; an item carrying a
 * measured demand it carries. A shared concept tag matches nothing. The swap
 * sheet reads the same tiers and prints which one each option came from, and
 * its last resort is no longer "the same type within one level" but the same
 * kind of exercise, or a song, from the lessons the learner has reached.
 *
 * **Revised (E0).** C6 tested overlap by set intersection — any shared declared skill,
 * any shared measured demand — which was right while no piece carried a demand and a
 * trap once every piece does: everything shares a step. The tiers now go through the
 * one gate (`eligibility.ts`): the skill tier offers an item declaring the row's target
 * skill whose notes provide its opportunity at a useful density; the demand tier an
 * item providing, at that density, a demand the row exists to practise; neither offers
 * what the learner cannot cope with, and the lesson's options and the named stand-ins
 * pass the same gate. The constructed items carry their measurement (`helpers/measured`)
 * and the tiers are asked with a learner.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { alternativesFor, indexCatalog, tieredAlternatives } from '../../src/curriculum/selectors';
import { EVERY_DECLARED_SKILL } from '../../src/curriculum/skillActivation';
import { swapOptions, type SessionSlot } from '../../src/curriculum/session';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import type { Learner } from '../../src/curriculum/eligibility';
import { swapTierWords } from '../../src/ui/help';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import { measured } from './helpers/measured';

function item(id: string, over: Partial<CatalogItem> = {}): CatalogItem {
  return { id, type: 'song', title: id, level: 5, hands: 'both', tracks: ['classical'], concepts: ['repertoire'], file: `scores/${id}.mxl`, ...measured(['interval.step']), ...over };
}

/** A learner whose lessons have taught steps, skips and eighth notes, and nothing later. */
const LEARNER: Learner = { taught: (demand) => ['interval.step', 'interval.skip', 'rhythm.eighths', 'rhythm.shorter-than-quarter'].includes(demand) };

const lesson = (id: string, over: Partial<Lesson>): Lesson => ({
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

const CURRICULUM: Curriculum = {
  version: 1,
  tracks: [{ id: 'classical', title: 'Classical', description: '', startsAtStage: 3 }],
  stages: [
    {
      number: 3,
      title: 'Three',
      summary: '',
      units: [{ id: 'c3', title: 'C3', track: 'classical', lessons: [lesson('2.2', { songOptions: ['song.source', 'song.same-lesson'] })] }],
    },
  ],
};

const CATALOG = indexCatalog([
  // The row: it targets subdivision, and its notes provide eighths and skips at a useful density.
  item('song.source', {
    targetSkills: ['subdivision'],
    ...measured(['interval.step', 'interval.skip', 'rhythm.eighths']),
    alternatives: ['song.stand-in', 'song.stand-in-untaught'],
  }),
  item('song.same-lesson'),
  item('song.stand-in'),
  // A named stand-in carrying syncopation, which this learner's lessons have not reached: provenance, not immunity.
  item('song.stand-in-untaught', { ...measured(['interval.step', 'rhythm.syncopation']) }),
  item('song.same-skill', { targetSkills: ['subdivision'], ...measured(['interval.step', 'rhythm.eighths']), level: 5.3 }),
  // Declares subdivision, and its eighths are incidental (two in the piece): not practice of subdivision.
  item('song.same-skill-incidental', {
    targetSkills: ['subdivision'],
    ...measured(['interval.step', 'rhythm.eighths'], { established: ['interval.step'], located: { 'interval.step': 30, 'rhythm.eighths': 2 } }),
    level: 5.05,
  }),
  item('song.same-demand', { ...measured(['interval.step', 'rhythm.eighths']), level: 5.1 }),
  // Provides eighths, and brings syncopation: refused however near its level.
  item('song.same-demand-untaught', { ...measured(['interval.step', 'rhythm.eighths', 'rhythm.syncopation']), level: 5 }),
  // Carries skips only incidentally: no claim.
  item('song.skips-incidental', { ...measured(['interval.step', 'interval.skip'], { established: ['interval.step'] }), level: 5 }),
  // Every quarried piece carries the `repertoire` tag; these share it, a level and a step, and nothing else.
  item('song.only-the-tag', { level: 5 }),
  item('song.only-a-concept', { concepts: ['repertoire', 'minuet'], level: 5.2 }),
]);

describe('the tiers are claims, in order, and each option says which', () => {
  // Constructed songs declaring a skill: their declaration is acted on explicitly
  // (D0; as shipped the activation acts on the reading rows'), and the gate still asks
  // the notes for the opportunity and the learner for readiness (E0).
  const tiers = () => tieredAlternatives({ itemId: 'song.source', lessonId: '2.2' }, CURRICULUM, CATALOG, EVERY_DECLARED_SKILL, LEARNER);

  it('the same lesson, a named stand-in, an item that also trains the target skill, one that also practises a target demand', () => {
    expect(tiers().map((one) => [one.item.id, one.tier])).toEqual([
      ['song.same-lesson', 'lesson'],
      ['song.stand-in', 'alternative'],
      ['song.same-skill', 'skill'],
      ['song.same-demand', 'demand'],
    ]);
    expect(tiers().find((one) => one.tier === 'skill')?.shared).toBe('subdivision');
    expect(tiers().find((one) => one.tier === 'demand')?.shared).toBe('rhythm.eighths');
  });

  it('a shared step, the repertoire tag or any concept tag matches nothing; incidental and unready candidates are refused', () => {
    const ids = tiers().map((one) => one.item.id);
    for (const refused of ['song.only-the-tag', 'song.only-a-concept', 'song.same-skill-incidental', 'song.same-demand-untaught', 'song.skips-incidental', 'song.stand-in-untaught']) {
      expect(ids, refused).not.toContain(refused);
    }
  });

  it('with no learner, the practice tiers offer nothing: "the other demands you have met" needs someone to have met them', () => {
    const noLearner = tieredAlternatives({ itemId: 'song.source', lessonId: '2.2' }, CURRICULUM, CATALOG, EVERY_DECLARED_SKILL);
    expect(noLearner.filter((one) => one.tier === 'skill' || one.tier === 'demand')).toEqual([]);
    const ids = alternativesFor({ itemId: 'song.source' }, CURRICULUM, CATALOG).map((one) => one.id);
    expect(ids).not.toContain('song.only-the-tag');
    expect(ids).not.toContain('song.only-a-concept');
  });

  it('the sheet’s words state the strongest fact known: the same lesson, also trains, also practises, with the demands met', () => {
    expect(swapTierWords('lesson')).toBe('From the same lesson');
    expect(swapTierWords('skill', 'subdivision')).toBe('Also trains subdivision, with the other demands you have met');
    expect(swapTierWords('demand', 'interval.skip')).toBe('Also practises skips, with the other demands you have met');
    for (const tier of ['lesson', 'alternative', 'skill', 'demand', 'kind'] as const) {
      expect(swapTierWords(tier, 'interval.skip')).not.toMatch(/similar|difficulty|level/i);
    }
  });
});

describe('the swap sheet reads the same tiers', () => {
  const CONTENT = join(process.cwd(), 'public', 'content');
  const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
  const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
  const index = indexCatalog(catalog);
  const row = (id: string, kind: SessionSlot['kind'], lessonId?: string): SessionSlot => ({
    kind,
    minutes: 5,
    item: index.byId.get(id),
    ...(lessonId === undefined ? {} : { lessonId }),
    reason: '',
  });

  it('every option carries the tier it came from; the lesson’s own first', () => {
    const slot = row('drill.rhythm.eighths', 'technique', '2.2');
    const options = swapOptions(slot, [slot], curriculum, index, { items: catalog, rung: '2.2' });
    expect(options.length).toBeGreaterThan(0);
    expect(options[0]?.tier).toBe('lesson');
    for (const option of options) expect(['lesson', 'alternative', 'skill', 'demand', 'kind']).toContain(option.tier);
  });

  it('a reading row’s swap offers the rows that share its skills, never one carrying what the learner’s lesson has not taught', () => {
    const slot = row('drill.reading.sight-reading-1', 'sightreading', '1.5');
    const ids = swapOptions(slot, [slot], curriculum, index, { items: catalog, rung: '1.5' }).map((one) => one.item.id);
    // The left-hand row shares sight-reading and its bass clef is taught at 1.3: offered.
    expect(ids).toContain('drill.reading.sight-reading-1-left');
    // Syncopation, triplets and 6/8 are taught at 4.5; accidentals and key signatures at 3.1.
    for (const late of ['drill.reading.sight-reading-3', 'drill.reading.sight-reading-4', 'drill.reading.sight-reading-5', 'drill.reading.sight-reading-6', 'drill.reading.sight-reading-7']) {
      expect(ids, `${late} offered to a learner on 1.5`).not.toContain(late);
    }
  });

  // Revised (E0): the scale was one on 2.5, which "shares no target skill and no measured demand with
  // anything" while nothing carried a demand. Now 2.5 teaches the shift beyond the hand and its scales
  // provide it, so its review row has a demand tier. The last resort is shown on a scale whose first
  // rung teaches no demand at all, so no tier of the gate has anything to offer for it.
  it('with no lesson and nothing shared, the last resort is the same kind of exercise from the lessons reached, not a level window', () => {
    const lessons = curriculum.stages.flatMap((s) => s.units.flatMap((u) => u.lessons));
    const teaches = (rung: string): boolean => VOCABULARY_V0.demands.some((d) => d.taughtAt === rung);
    const firstRung = (id: string) => lessons.find((l) => l.exerciseOptions.includes(id) || l.songOptions.includes(id));
    const scale = catalog.find((one) => {
      const rung = firstRung(one.id);
      return one.drill?.kind === 'scale' && rung !== undefined && !teaches(rung.id);
    }) as CatalogItem;
    const rung = (firstRung(scale.id) as Lesson).id;
    // A review row carries no lesson.
    const slot = row(scale.id, 'review');
    const options = swapOptions(slot, [slot], curriculum, index, { items: catalog, rung });
    expect(options.length).toBeGreaterThan(0);
    for (const option of options) {
      expect(option.tier).toBe('kind');
      expect(option.item.drill?.kind).toBe('scale');
    }
  });
});
