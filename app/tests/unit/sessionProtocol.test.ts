/**
 * The activity protocol's boundaries and X1's small rows (the brief's table and item 8):
 *
 * - **Target forms.** Every guided slot the composition makes, for a fresh learner placed at every rung of the
 *   built curriculum at every length, opens as a Score-screen run or a drill (`targetFor`) — never a PDF, a
 *   placeholder, the lab or a chart — so every guided slot has a screen with an honest finish; the free slot
 *   has no item; the guided tour (whose steps leave the drill screen) is the one drill kept outside the cursor
 *   by Today (`todaySessionRun.test.ts` holds the PDF and the free prompt outside).
 * - **The route** carries the activity's token on the Score and drill routes (`?session=`), a malformed one
 *   dropped.
 * - **G61**: the jam slot takes chord-and-feel material first, and where it offers anything else its line
 *   names the rung and promises nothing more. **U71**: the transfer offer's card line is its skill and
 *   "something new". **U57**: the reader's kept line says what the app can do.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildSession } from '../../src/curriculum/session';
import { indexCatalog } from '../../src/curriculum/selectors';
import { defaultActiveTracks } from '../../src/curriculum/tracks';
import { rungState } from '../../src/evidence/rungState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import { targetFor } from '../../src/ui/openItem';
import { parseHash, routeToHash } from '../../src/router';
import { cardLine, READING_TEXT, slotReason } from '../../src/ui/help';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import { measured } from './helpers/measured';

const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const TODAY = new Date(2026, 9, 29, 9);

describe('every guided slot the composition makes has a screen with an honest finish', () => {
  it('every rung, every length: each slot with an item opens as a Score-screen run or a drill; the free slot has none', () => {
    const index = indexCatalog(catalog);
    const states = rungState([], curriculum, VOCABULARY_V0, TODAY);
    const forms = new Map<string, number>();
    const tours: string[] = [];
    let slots = 0;
    for (const stage of curriculum.stages) {
      for (const unit of stage.units) {
        for (const lesson of unit.lessons) {
          for (const minutes of [15, 30, 60, 120]) {
            const built = buildSession({
              curriculum,
              catalog: index,
              items: catalog,
              states,
              rows: [],
              readingRows: [],
              learned: [],
              lastPlayed: new Map(),
              activeTracks: [...new Set([...defaultActiveTracks(curriculum), unit.track])],
              minutes,
              startAt: lesson.id,
              today: TODAY,
            });
            for (const slot of built.slots) {
              slots += 1;
              if (slot.kind === 'free') {
                expect(slot.item).toBeUndefined();
                continue;
              }
              // Each slot carries its contact assumption as composed (X1 item 6): the reading slot a first contact.
              expect(slot.contact, `${lesson.id} ${String(minutes)} ${slot.kind}`).toBeDefined();
              if (slot.kind === 'sightreading') expect(slot.contact).toBe('first-contact');
              const form = slot.item ? targetFor(slot.item) : 'none';
              forms.set(form, (forms.get(form) ?? 0) + 1);
              if (slot.item?.drill?.kind === 'walkthrough') tours.push(`${lesson.id} ${String(minutes)}`);
            }
          }
        }
      }
    }
    expect(slots).toBeGreaterThan(1000);
    expect([...forms.keys()].sort()).toEqual(['drill', 'score']);
    // The tour is on 0.3's card; Today keeps it outside the cursor.
    expect(tours.length).toBeGreaterThan(0);
  });
});

describe('the route carries the activity token', () => {
  it('on the Score and drill routes, round trip; a malformed token is dropped', () => {
    const score = parseHash('#/score/song.folk.lightly-row?rung=1.2&slot=new&session=abc123def');
    expect(score).toMatchObject({ score: 'song.folk.lightly-row', scoreRung: '1.2', scoreSlot: 'new', session: 'abc123def' });
    expect(parseHash(routeToHash(score))).toEqual(score);
    const drill = parseHash('#/drill/drill.rhythm.mixed-values?rung=1.2&session=abc123def');
    expect(drill).toMatchObject({ drill: 'drill.rhythm.mixed-values', drillRung: '1.2', session: 'abc123def' });
    expect(routeToHash(drill)).toBe('#/drill/drill.rhythm.mixed-values?rung=1.2&session=abc123def');
    expect(parseHash('#/score/song.a?session=NOT_A_TOKEN').session).toBeUndefined();
    expect(parseHash('#/score/song.a?session=ab').session).toBeUndefined();
  });
});

describe('G61: the jam slot’s own condition', () => {
  const lesson = (id: string, over: Partial<Lesson>): Lesson => ({ id, title: `Rung ${id}`, concepts: [], textFile: `lessons/${id}.md`, exerciseOptions: [], songOptions: [], mastery: { minAccuracy: 0.9, minTempoPct: 0.8 }, requirements: [], ...over });
  const item = (id: string, over: Partial<CatalogItem> = {}): CatalogItem => ({ id, type: 'exercise', title: id, level: 3, hands: 'both', tracks: ['jam'], concepts: [], file: `scores/${id}.mxl`, ...measured([]), ...over });
  function jamOf(options: CatalogItem[]): { item?: string; line: string } {
    const where: Curriculum = {
      version: 1,
      tracks: [
        { id: 'core', title: 'Core', description: '', startsAtStage: 0 },
        { id: 'jam', title: 'Jam', description: '', startsAtStage: 3 },
      ],
      stages: [
        { number: 3, title: 'Three', summary: '', units: [{ id: 'j', title: 'J', track: 'jam', lessons: [lesson('jam.1', { exerciseOptions: options.filter((one) => one.type !== 'song').map((one) => one.id), songOptions: options.filter((one) => one.type === 'song').map((one) => one.id) })] }] },
      ],
    };
    const slot = buildSession({
      curriculum: where,
      catalog: indexCatalog(options),
      items: options,
      states: { byRung: new Map([['jam.1', { rung: where.stages[0]?.units[0]?.lessons[0] as Lesson, status: 'met', judged: true, carried: false, requirements: [] }]]) },
      rows: [],
      learned: [],
      lastPlayed: new Map(),
      activeTracks: ['core', 'jam'],
      minutes: 60,
      today: TODAY,
    }).slots.find((one) => one.kind === 'jam');
    return { ...(slot?.item ? { item: slot.item.id } : {}), line: slot?.reason ?? '' };
  }

  it('a chart to play from comes before transposition pages listed ahead of it, and the line says chords, form and feel', () => {
    // Two pages, so the warm-up's exposure takes one and the jam still has one ahead of the chart in the list.
    const pages = ['a', 'b'].map((one) => item(`ex.transpose.${one}`, { drill: { kind: 'transposition', params: {} }, file: undefined }));
    const chart = item('song.chart', { type: 'song', notation: { chordCount: 12 } } as unknown as Partial<CatalogItem>);
    expect(jamOf([...pages, chart])).toEqual({ item: 'song.chart', line: 'Chords, form and feel: from Rung jam.1' });
  });

  it('with nothing chord-and-feel on the rung, it offers what there is and names only where it is from', () => {
    // Several, since the slots before the jam take theirs from the same reached rung first.
    const pages = ['a', 'b', 'c'].map((one) => item(`ex.transpose.${one}`, { drill: { kind: 'transposition', params: {} }, file: undefined }));
    const jam = jamOf(pages);
    expect(pages.map((one) => one.id)).toContain(jam.item);
    expect(jam.line).toBe('From Rung jam.1');
    expect(slotReason('jam', { kind: 'jam', rung: lesson('x', {}), plain: true }, TODAY)).toBe('From Rung x');
  });
});

describe('U71 and U57, in the learner’s words', () => {
  it('the transfer offer’s card line is its skill and “something new”; every other line is the composition’s, whole', () => {
    const claim = { kind: 'transfer' as const, skill: 'position-shift', relationship: { skill: 'position-shift', shownOn: [], measured: [], differsOn: [] }, contact: { contact: 'unmet' as const, metById: false } };
    const full = slotReason('new', claim, TODAY);
    const line = cardLine(full, claim);
    expect(line).toBe('Shifting position: something new');
    expect(full.startsWith(line)).toBe(true);
    expect(cardLine('This lesson asks for it — not counted yet', { kind: 'asked' })).toBe('This lesson asks for it — not counted yet');
  });

  it('the reader’s kept line says what the app can do about the demand, not what every phrase has', () => {
    expect(READING_TEXT.kept).toBe('and they can’t be left out here');
  });
});
