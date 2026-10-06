// @vitest-environment jsdom
/**
 * 3/4 is one vocabulary fact taught at 1.4, and the generator writes it only where the hold permits (SR2; the
 * reviewer's ruling on SR1, `docs/review/responses/sr1-sightreading-quality.md` §1: "Add a vocabulary demand for
 * the thing actually taught at 1.4 and let the generator hold follow that demand").
 *
 * Over every core rung: the reader's row as a fresh learner meets it (`readingOffer`, the daily read; the
 * unanchored row at 1.1-1.2 with its hold), every move the reader can ask for there (`readingMoves`, which
 * offers `on` only for a demand the learner's rung has taught: recipe moves stand over the hold by design, so
 * no hand-made recipe is driven here), seeds 1-30, written by the Score screen's function (`phraseOptions`).
 * A phrase's metre is read from the MusicXML it writes (every `<time>`), not from the options. Nothing heard.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { phraseOptions, readingMoves, readingOffer, taughtAtRung, type LessonPosition, type ReadingOffer } from '../../src/curriculum/session';
import { defaultActiveTracks } from '../../src/curriculum/tracks';
import { rungForSlot } from '../../src/ui/screens/TodayScreen';
import { generateSightReading, SightReadingRefusal, type SightReadingOptions } from '../../src/engine/sightReading';
import { heldToRung, READING_CONTROLS } from '../../src/engine/readingControls';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';

const CONTENT = join(process.cwd(), 'public', 'content');
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const core: Lesson[] = curriculum.stages.flatMap((stage) => stage.units.filter((unit) => unit.track === 'core').flatMap((unit) => unit.lessons));
const SEEDS = Array.from({ length: 30 }, (_, i) => i + 1);
const row = (id: string): CatalogItem => catalog.find((item) => item.id === id) as CatalogItem;
const taught = (rung: string) => taughtAtRung(curriculum, rung, VOCABULARY_V0) as (demand: string) => boolean;

/** Every metre the phrase's MusicXML writes, as `beats/beat-type`. */
function metresWritten(options: SightReadingOptions): string[] | 'refused' {
  let xml: string;
  try {
    xml = generateSightReading(options).musicXml;
  } catch (cause: unknown) {
    if (cause instanceof SightReadingRefusal) return 'refused';
    throw cause;
  }
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  return Array.from(doc.querySelectorAll('time')).map(
    (time) => `${time.querySelector('beats')?.textContent ?? '?'}/${time.querySelector('beat-type')?.textContent ?? '?'}`,
  );
}

function daily(rung: Lesson): ReadingOffer | null {
  return readingOffer({
    curriculum,
    items: catalog,
    position: { lesson: rung } as LessonPosition,
    activeTracks: defaultActiveTracks(curriculum),
    rows: [],
    today: new Date(2026, 10, 2, 12),
    purpose: 'daily',
  });
}

/** A row with its own params changed, as SR1's A stratum asked it (the params pass through the hold). */
function asking(id: string, params: Record<string, unknown>): CatalogItem {
  const item = row(id);
  return { ...item, drill: { ...item.drill, params: { ...(item.drill?.params ?? {}), ...params } } } as CatalogItem;
}

describe('the generator writes 3/4 only where metre.three-four is taught', () => {
  it('over every core rung’s reader, every move it offers, seeds 1-30', () => {
    const wrong: string[] = [];
    const where34: string[] = [];
    let phrases = 0;
    for (const rung of core) {
      const offer = daily(rung);
      if (offer === null) continue;
      const judging = rungForSlot(curriculum, offer.item, offer.lessonId);
      const rungs = { ...(judging === undefined ? {} : { judging }), ...(offer.hold === undefined ? {} : { hold: offer.hold }) };
      const holdRung = offer.hold ?? judging ?? rung.id;
      const moves = readingMoves({ curriculum, item: offer.item, recipe: offer.recipe, rung: rung.id, hold: holdRung });
      for (const recipe of [offer.recipe, ...moves.map((move) => move.recipe)]) {
        for (const seed of SEEDS) {
          const metres = metresWritten(phraseOptions(curriculum, offer.item, recipe, seed, rungs));
          if (metres === 'refused') continue;
          phrases += 1;
          if (!metres.includes('3/4')) continue;
          const label = `${rung.id} ${offer.item.id} ${JSON.stringify(recipe.moved ?? {})} seed ${String(seed)} (held at ${holdRung})`;
          if (!taught(holdRung)('metre.three-four')) wrong.push(label);
          else where34.push(label);
        }
      }
    }
    expect(phrases).toBeGreaterThan(1000);
    expect(wrong).toEqual([]);
    // And the move does reach a learner where it is taught (S8 c): some phrase on the ladder is in 3/4.
    expect(where34.length).toBeGreaterThan(0);
  }, 600_000);

  it('the left-hand row asked for 3/4 at 1.3 is held to 4/4; at 1.4, which teaches it, it writes 3/4', () => {
    const asked = asking('drill.reading.sight-reading-1-left', { timeSig: '3/4' });
    for (const seed of SEEDS) {
      expect(metresWritten(phraseOptions(curriculum, asked, undefined, seed, { judging: '1.3' })), `1.3 seed ${String(seed)}`).toEqual(['4/4']);
      expect(metresWritten(phraseOptions(curriculum, asked, undefined, seed, { judging: '1.4' })), `1.4 seed ${String(seed)}`).toEqual(['3/4']);
    }
  });

  it('the unanchored daily row is never asked for 3/4 before 1.4: its phrases at 1.1 and 1.2 are 4/4', () => {
    for (const id of ['1.1', '1.2']) {
      const offer = daily(core.find((one) => one.id === id) as Lesson) as ReadingOffer;
      for (const seed of SEEDS) {
        expect(metresWritten(phraseOptions(curriculum, offer.item, offer.recipe, seed, { judging: '1.5', hold: id })), `${id} ${String(seed)}`).toEqual(['4/4']);
      }
    }
  });

  // SR2 finish item 8 reverted (H8 refuted: with ["4/4","3/4"] the row's notes a bar fell under its 3.78 floor,
  // 3.55 at 2.2 and 3.58 at 2.5 over its 150 row seeds; the bound is not moved). The row as it stands writes 4/4;
  // 3/4 reaches it only as the reader's move, where 1.4 is behind the learner.
  it('the right-hand level-2 row as it stands writes 4/4 at 2.2 and 2.5 (its metre change reverted)', () => {
    const item = row('drill.reading.sight-reading-2-right');
    for (const rung of ['2.2', '2.5']) {
      const metres = SEEDS.map((seed) => metresWritten(phraseOptions(curriculum, item, undefined, seed, { judging: rung })));
      expect(metres.every((m) => m !== 'refused' && m.length === 1 && m[0] === '4/4'), rung).toBe(true);
    }
  });

  // SR2, the orchestrator's decision 1 (within the ruling's §3: 3/4 enters only where the predeclared contracts still
  // pass): on a row whose phrase has a left-hand part the reader offers no 3/4, because 3/4 under a broken-chord left
  // hand writes what the detector reads as a walking bass (170 reachable recipes on 3.6-4.7) and 3/4 on `-3` lost a
  // promised dotted quarter (2); a single-hand row offers it where it is taught.
  it('the reader offers 3/4 on a single-hand row where it is taught, and never on a two-hand row', () => {
    const offered = (id: string, rung: string): boolean =>
      readingMoves({ curriculum, item: row(id), recipe: { row: id }, rung }).some((move) => move.demand === 'metre.three-four' && move.direction === 'on');
    expect(offered('drill.reading.sight-reading-1-left', '1.4'), '-1-left at 1.4').toBe(true);
    expect(offered('drill.reading.sight-reading-2-right', '2.2'), '-2-right at 2.2').toBe(true);
    expect(offered('drill.reading.sight-reading-3', '4.5'), '-3 at 4.5').toBe(false);
    expect(offered('drill.reading.sight-reading-2', '3.4'), '-2 at 3.4').toBe(false);
    expect(offered('drill.reading.sight-reading-4', '4.6'), '-4 at 4.6').toBe(false);
  });

  it('heldToRung applied twice equals once for the new control (its cases above)', () => {
    const cases: [SightReadingOptions, string][] = [
      [phraseOptions(curriculum, asking('drill.reading.sight-reading-1-left', { timeSig: '3/4' }), undefined, 7, {}), '1.3'],
      [phraseOptions(curriculum, asking('drill.reading.sight-reading-1-left', { timeSig: '3/4' }), undefined, 7, {}), '1.4'],
      [phraseOptions(curriculum, row('drill.reading.sight-reading-2-right'), undefined, 7, {}), '1.3'],
      [phraseOptions(curriculum, row('drill.reading.sight-reading-2-right'), undefined, 7, {}), '2.2'],
      [phraseOptions(curriculum, row('drill.reading.sight-reading-1'), undefined, 7, {}), '1.1'],
    ];
    const control = READING_CONTROLS['metre.three-four'];
    expect(control).toBeDefined();
    for (const [options, rung] of cases) {
      const once = heldToRung(options, taught(rung));
      expect(heldToRung(once, taught(rung)), rung).toEqual(once);
      expect(control?.mayWrite(once), `${rung}: 3/4 after the hold`).toBe(taught(rung)('metre.three-four') && control?.mayWrite(options));
    }
  });
});
