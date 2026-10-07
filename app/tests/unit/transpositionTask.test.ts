/**
 * Wave 1(b): the early-core transposition task (`briefs/wave1b-transposition.md`).
 *
 * Two things live here. **The content check** the brief names after its 2026-10-05 correction: the
 * target spans D4 to D5 and a G five-finger position (G A B C D) does not hold the lower D, so
 * `2.5.md` and `practice.5.md` name the reach below the position, and neither says the position
 * "holds all of it" or that the fingers are "the same". **One measurement, reported and not fixed**:
 * putting `song.classical.ode-to-joy.g` on 2.5's options also puts it in the pool *Today* draws from,
 * so a learner could be handed the edition with the page showing before doing the task from their own
 * working-out. Keeping it off the card would be a product decision outside the lane; this test says
 * whether the card does it, and on which slot, for a learner placed at 2.5, and pins the answer so a
 * change in it is seen. The swap sheet is not measured here.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildSession } from '../../src/curriculum/session';
import { indexCatalog } from '../../src/curriculum/selectors';
import { rungState } from '../../src/evidence/rungState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import type { CatalogItem, Curriculum } from '../../src/curriculum/types';

const LESSONS = join(process.cwd(), '..', 'content', 'lessons');
const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const G = 'song.classical.ode-to-joy.g';

const body = (id: string): string => readFileSync(join(LESSONS, `${id}.md`), 'utf8').replace(/\s+/g, ' ');

describe('the 2.5 task teaches the range the target has', () => {
  it('2.5 names the lower D and the reach below the position; practice.5 names the reach below the position', () => {
    expect(body('2.5')).toContain('lands on the lower D');
    expect(body('2.5')).toContain('to the D below the position');
    expect(body('practice.5')).toContain('the one reach below the position');
  });

  it('neither says the position holds all of it or that the fingers are the same', () => {
    for (const id of ['2.5', 'practice.5']) {
      expect(body(id), id).not.toContain('holds all of it');
      expect(body(id), id).not.toContain('same fingers');
    }
  });

  it('2.5 offers the G edition, and its blind tool opens that edition', () => {
    const rung = curriculum.stages.flatMap((s) => s.units.flatMap((u) => u.lessons)).find((l) => l.id === '2.5');
    expect(rung?.songOptions).toContain(G);
    expect(rung?.tools).toEqual([{ kind: 'blind', item: G, label: 'Check your G version, page hidden' }]);
  });
});

describe('measured, not fixed: can Today hand the G edition to a learner placed at 2.5?', () => {
  it('records every card slot that offers it, over thirty mornings at each session length', () => {
    const index = indexCatalog(catalog);
    const offered = new Set<string>();
    const rungsSeen = new Set<string>();
    const itemsSeen = new Set<string>();
    // Two learners: one with no runs, and one who played the rung's other two songs the day before,
    // so the repertoire row has a reason to move off them.
    const playedYesterday = (today: Date): Map<string, string> => {
      const yesterday = new Date(today.getTime() - 24 * 3600 * 1000).toISOString();
      return new Map([
        ['song.classical.ode-to-joy.full', yesterday],
        ['song.classical.beethoven-ode-to-joy.easy', yesterday],
      ]);
    };
    for (let day = 0; day < 30; day += 1) {
      const today = new Date(2026, 9, 6 + day, 8);
      for (const [learner, lastPlayed] of [['fresh', new Map<string, string>()], ['played the other two', playedYesterday(today)]] as const) {
        for (const minutes of [15, 30, 60, 120]) {
          const { slots } = buildSession({
            curriculum,
            catalog: index,
            items: catalog,
            // Placed at 2.5: the rungs behind the placement reached, none met.
            states: rungState([], curriculum, VOCABULARY_V0, today),
            rows: [],
            learned: [],
            lastPlayed,
            activeTracks: ['core'],
            minutes,
            startAt: '2.5',
            today,
          });
          for (const slot of slots) {
            if (slot.item?.id === G) offered.add(`${learner}, ${String(minutes)} min: ${slot.kind}`);
            if (slot.lessonId !== undefined) rungsSeen.add(slot.lessonId);
            if (slot.item !== undefined) itemsSeen.add(`${slot.kind}:${slot.item.id}`);
          }
        }
      }
    }
    const found = [...offered].sort();
    // The answer observed when this lane landed; see the record entry. A change here means the card's
    // choice moved, and whether Today may hand this edition to a 2.5 learner is a product decision.
    console.log(`Today offers ${G} to a learner placed at 2.5 on: ${found.length === 0 ? 'no slot' : found.join('; ')}`);
    console.log(`rungs the cards drew from: ${[...rungsSeen].sort().join(', ')}`);
    console.log(`items the cards offered: ${[...itemsSeen].sort().join(', ')}`);
    // The measurement reaches the rung: the cards draw from 2.5 itself, so "no slot" is not a learner placed elsewhere.
    expect(rungsSeen.has('2.5')).toBe(true);
    expect(found).toEqual(OBSERVED);
  });
});

/**
 * Observed on 2026-10-06, for these two learners only: no card slot offered it. The repertoire row
 * offered the rung's other two songs on every card, the played-yesterday learner included. A learner
 * with other histories, other tracks or the swap sheet is not covered.
 */
const OBSERVED: string[] = [];
