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
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { alternativesFor, indexCatalog, tieredAlternatives } from '../../src/curriculum/selectors';
import { swapOptions, type SessionSlot } from '../../src/curriculum/session';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import { swapTierWords } from '../../src/ui/help';

function item(id: string, over: Partial<CatalogItem> = {}): CatalogItem {
  return { id, type: 'song', title: id, level: 5, hands: 'both', tracks: ['classical'], concepts: ['repertoire'], file: `scores/${id}.mxl`, ...over };
}

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
      units: [{ id: 'c3', title: 'C3', track: 'classical', lessons: [lesson('classical.3', { songOptions: ['song.source', 'song.same-lesson'] })] }],
    },
  ],
};

const CATALOG = indexCatalog([
  item('song.source', { targetSkills: ['subdivision'], demands: ['rhythm.dotted-quarter'], alternatives: ['song.stand-in'] }),
  item('song.same-lesson'),
  item('song.stand-in'),
  item('song.same-skill', { targetSkills: ['subdivision'], level: 5.3 }),
  item('song.same-demand', { demands: ['rhythm.dotted-quarter'], level: 5.1 }),
  // Every quarried piece carries the `repertoire` tag; these share it and a level, and nothing else.
  item('song.only-the-tag', { level: 5 }),
  item('song.only-a-concept', { concepts: ['repertoire', 'minuet'], level: 5.2 }),
]);

describe('the tiers are claims, in order, and each option says which', () => {
  const tiers = () => tieredAlternatives({ itemId: 'song.source', lessonId: 'classical.3' }, CURRICULUM, CATALOG);

  it('the same lesson, a named stand-in, a shared target skill, a shared measured demand', () => {
    expect(tiers().map((one) => [one.item.id, one.tier])).toEqual([
      ['song.same-lesson', 'lesson'],
      ['song.stand-in', 'alternative'],
      ['song.same-skill', 'skill'],
      ['song.same-demand', 'demand'],
    ]);
    expect(tiers().find((one) => one.tier === 'skill')?.shared).toBe('subdivision');
    expect(tiers().find((one) => one.tier === 'demand')?.shared).toBe('rhythm.dotted-quarter');
  });

  it('the repertoire tag, or any concept tag, matches nothing', () => {
    const ids = alternativesFor({ itemId: 'song.source' }, CURRICULUM, CATALOG).map((one) => one.id);
    expect(ids).not.toContain('song.only-the-tag');
    expect(ids).not.toContain('song.only-a-concept');
  });

  it('the sheet’s words name the tier: the same lesson, trains the same skill, carries the same demand', () => {
    expect(swapTierWords('lesson')).toBe('From the same lesson');
    expect(swapTierWords('skill', 'subdivision')).toBe('Trains the same skill: subdivision');
    expect(swapTierWords('demand', 'rhythm.dotted-quarter')).toBe('Carries the same demand: dotted quarters');
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

  it('with no lesson and nothing shared, the last resort is the same kind of exercise from the lessons reached, not a level window', () => {
    // A review row carries no lesson; a scale shares no target skill and no measured demand with anything.
    const scale = catalog.find((one) => one.drill?.kind === 'scale' && curriculum.stages.some((s) => s.units.some((u) => u.lessons.some((l) => l.id === '2.5' && l.exerciseOptions.includes(one.id))))) as CatalogItem;
    const slot = row(scale.id, 'review');
    const options = swapOptions(slot, [slot], curriculum, index, { items: catalog, rung: '3.1' });
    expect(options.length).toBeGreaterThan(0);
    for (const option of options) {
      expect(option.tier).toBe('kind');
      expect(option.item.drill?.kind).toBe('scale');
    }
  });
});
