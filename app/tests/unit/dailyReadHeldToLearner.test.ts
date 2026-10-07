// @vitest-environment jsdom
/**
 * The daily read is held to the learner's own taught set (SR2; the reviewer's ruling on SR1,
 * `docs/review/responses/sr1-sightreading-quality.md` §2): "the generation hold must be the learner's actual
 * reached/taught set at that moment", while the offered-from/judging rung stays what Today needs.
 *
 * Before any rung lists a reading row (0.1-1.2 on the core path), Today's daily read is the easiest row
 * (`drill.reading.sight-reading-1`), judged by the one rung that lists it, 1.5 (`TodayScreen.rungForSlot`). At
 * the base it was also held at 1.5, so a learner at 1.1 was handed skips (taught at 1.5) and one at 0.1 steps
 * (taught at 1.1): SR1's corpus found every one of its 8 phrases there failing (Entry 251).
 *
 * The phrase is read as the learner is shown it: the offer (`readingOffer`, purpose 'daily'), the route Today
 * builds from it (`rungForSlot` for `rung`, the offer's `hold`), the function the Score screen writes with
 * (`phraseOptions`), the generator, and the app's own detectors over the model the engine plays (OSMD in
 * jsdom). Seeds: the four SR1 BC days' seeds (the day's seed) and seeds 1-30. Nothing heard.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildSession,
  phraseOptions,
  readingOffer,
  taughtAtRung,
  taughtForLearner,
  type LessonPosition,
  type ReadingOffer,
} from '../../src/curriculum/session';
import { indexCatalog } from '../../src/curriculum/selectors';
import { defaultActiveTracks } from '../../src/curriculum/tracks';
import { rungForSlot } from '../../src/ui/screens/TodayScreen';
import { generateSightReading } from '../../src/engine/sightReading';
import { detect } from '../../src/demands/detect';
import { rungState } from '../../src/evidence/rungState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';
import { modelOf } from './helpers/promises';

const CONTENT = join(process.cwd(), 'public', 'content');
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const lessons: Lesson[] = curriculum.stages.flatMap((stage) => stage.units.flatMap((unit) => unit.lessons));
const lesson = (id: string): Lesson => lessons.find((one) => one.id === id) as Lesson;

/** SR1's BC days (MANIFEST.json, stratum BC): the daily read's seed is the day's. */
const DAYS = ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05'];
const SEEDS = Array.from({ length: 30 }, (_, i) => i + 1);
const EMPTY = ['0.1', '0.2', '0.3', '0.4'];
const STEPS_ONLY = ['1.1', '1.2'];

function noonOf(day: string): Date {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d, 12);
}

/** Today's daily read for a fresh learner at `rung` on `day` (no reads yet), the core tracks as a new learner has them. */
function daily(rung: string, day: string, activeTracks: readonly string[] = defaultActiveTracks(curriculum)): ReadingOffer | null {
  return readingOffer({
    curriculum,
    items: catalog,
    position: { lesson: lesson(rung) } as LessonPosition,
    activeTracks,
    rows: [],
    today: noonOf(day),
    purpose: 'daily',
  });
}

/** The route Today builds for the offer (`openDailyRead`): `rung` judges, `hold` holds. */
function route(offer: ReadingOffer): { judging?: string; hold?: string } {
  const judging = rungForSlot(curriculum, offer.item, offer.lessonId);
  return { ...(judging === undefined ? {} : { judging }), ...(offer.hold === undefined ? {} : { hold: offer.hold }) };
}

/** Every demand outside `taught` the phrase holds, by the app's detectors, with the bars (1-based). */
async function untaughtIn(offer: ReadingOffer, seed: number, taught: (demand: string) => boolean): Promise<string[]> {
  const options = phraseOptions(curriculum, offer.item, offer.recipe, seed, route(offer));
  const model = await modelOf(generateSightReading(options).musicXml, `daily.${String(seed)}`);
  const out: string[] = [];
  for (const demand of VOCABULARY_V0.demands) {
    if (demand.notAsked !== undefined || taught(demand.id)) continue;
    const found = detect(model, demand.detector);
    if (found.present) out.push(`${demand.id} (bars ${[...new Set(found.at.map((a) => a.measure + 1))].join(',')})`);
  }
  return out;
}

describe('before 1.1 teaches steps, there is no daily read yet', () => {
  for (const rung of EMPTY) {
    it(`${rung}: no offer on any of the four days, so no card and no door`, () => {
      for (const day of DAYS) expect(daily(rung, day), `${rung} ${day}`).toBeNull();
    });
  }
});

describe('at 1.1 and 1.2 the daily read is held to the learner’s taught set, and judged at 1.5', () => {
  for (const rung of STEPS_ONLY) {
    it(`${rung}: the phrase holds no demand the learner has not been taught (four days’ seeds and seeds 1-30)`, async () => {
      const taught = taughtForLearner(curriculum, rung, VOCABULARY_V0).taught as (demand: string) => boolean;
      const found: string[] = [];
      for (const [index, day] of DAYS.entries()) {
        const offer = daily(rung, day);
        expect(offer, `${rung} ${day}: no offer`).not.toBeNull();
        const made = offer as ReadingOffer;
        expect(made.item.id).toBe('drill.reading.sight-reading-1');
        expect(made.anchored).toBe(false);
        expect(made.hold, 'the hold is the learner’s rung').toBe(rung);
        expect(route(made).judging, 'the judging rung is still the row’s').toBe('1.5');
        for (const seed of index === 0 ? [made.seed, ...SEEDS] : [made.seed]) {
          for (const one of await untaughtIn(made, seed, taught)) found.push(`seed ${String(seed)}: ${one}`);
        }
      }
      expect(found).toEqual([]);
    }, 120_000);
  }
  it('the hold is the steps-only phrase: skips kept out, nothing else of the row changed', () => {
    const offer = daily('1.1', DAYS[0] as string) as ReadingOffer;
    const held = phraseOptions(curriculum, offer.item, offer.recipe, offer.seed, route(offer));
    const judged = phraseOptions(curriculum, offer.item, offer.recipe, offer.seed, { judging: '1.5' });
    expect(held).toEqual({ ...judged, skips: false });
  });
});

describe('every other reader is unchanged', () => {
  it('from 1.3 the daily read is anchored on its rung’s row, held and judged there, with no separate hold', () => {
    for (const rung of ['1.3', '1.4', '1.5', '2.2', '3.4', '4.5']) {
      const offer = daily(rung, DAYS[0] as string) as ReadingOffer;
      expect(offer.anchored, rung).toBe(true);
      expect(offer.hold, rung).toBeUndefined();
    }
  });
  it('the session’s slot never carries a hold', () => {
    const offer = readingOffer({
      curriculum,
      items: catalog,
      position: { lesson: lesson('1.1') } as LessonPosition,
      activeTracks: defaultActiveTracks(curriculum),
      rows: [],
      today: noonOf(DAYS[0] as string),
      purpose: 'slot',
    });
    expect(offer?.hold).toBeUndefined();
    expect(offer?.anchored).toBe(false);
  });
});

/**
 * OPEN 3 (the brief): does the session's `reached` change what an unanchored learner has been taught? Measured
 * here for a fresh learner placed at each of 0.1-1.2, with the tracks a new learner has and with every track on.
 * Equal, so the hold reads the learner's rung alone (`readingOffer` has no `reached`); a future early track rung
 * that teaches a demand would turn this red, and the hold would then need the session's `reached` threaded in.
 */
describe('the learner’s rung alone is the learner’s taught set before 1.3 (OPEN 3, pinned)', () => {
  const items = catalog;
  const index = indexCatalog(items);
  const states = rungState([], curriculum, VOCABULARY_V0, noonOf(DAYS[0] as string));
  const everyTrack = curriculum.tracks.map((track) => track.id);
  for (const tracks of [defaultActiveTracks(curriculum), everyTrack]) {
    for (const rung of [...EMPTY, ...STEPS_ONLY]) {
      it(`${rung}, tracks ${tracks.length === everyTrack.length ? 'all' : tracks.join('+')}: taught with and without the session’s reached are equal`, () => {
        const { reached } = buildSession({
          curriculum,
          catalog: index,
          items,
          states,
          rows: [],
          learned: [],
          lastPlayed: new Map(),
          activeTracks: tracks,
          minutes: 15,
          startAt: rung,
          today: noonOf(DAYS[0] as string),
        });
        const alone = taughtAtRung(curriculum, rung, VOCABULARY_V0) as (demand: string) => boolean;
        const withReached = taughtAtRung(curriculum, rung, VOCABULARY_V0, reached) as (demand: string) => boolean;
        const differ = VOCABULARY_V0.demands.map((d) => d.id).filter((id) => alone(id) !== withReached(id));
        expect(differ, `reached: ${reached.join(', ')}`).toEqual([]);
      });
    }
  }
});
