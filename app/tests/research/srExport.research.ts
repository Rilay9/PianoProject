/**
 * The sight-reading quality lane's export (docs/prompts/runs/sightreading-quality,
 * brief `sightreading-quality.md` §2). Research tooling, never CI.
 *
 * Every phrase goes through the app's own code path: `readingOptions` (the one
 * writer of a phrase's options, `session.ts`), `readingOffer` (Today's daily read),
 * `sightReadingOptionsFor` (a row's params), `withoutDemand` (a reader move), and
 * `generateSightReading`. Nothing under `src/` is changed or reimplemented, with one
 * exception named where it stands: `rungForSlot` (`TodayScreen.ts:1462`), six lines
 * copied because the screen module needs a browser to import.
 *
 * Modes (env):
 * - `SR_MODE=taught`: every rung's taught set, as data, to `SR_OUT/taught.json`.
 * - `SR_MODE=plan`: each manifest item's resolved options and `unrealisable()`
 *   reasons, to `SR_OUT/plan.json`. No phrase is generated.
 * - `SR_MODE=generate`: each item generated twice (determinism), the MusicXML to
 *   `SR_OUT/items/<id>.musicxml`, the result fields to `SR_OUT/results.json`.
 *
 * `SR_MANIFEST` is the manifest (JSON with an `items` list).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  dailySeed,
  generateSightReading,
  sightReadingOptionsFor,
  SightReadingRefusal,
  unrealisable,
  type SightReadingOptions,
} from '../../src/engine/sightReading';
import { withoutDemand } from '../../src/engine/readingControls';
import { readingOffer, readingOptions, taughtAtRung, type LessonPosition } from '../../src/curriculum/session';
import { defaultActiveTracks } from '../../src/curriculum/tracks';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';

const MODE = process.env.SR_MODE ?? '';
const OUT = process.env.SR_OUT ?? '';
const MANIFEST = process.env.SR_MANIFEST ?? '';

const CONTENT = join(process.cwd(), 'public', 'content');
const SOURCE = join(process.cwd(), '..', 'content');
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const readers = (JSON.parse(readFileSync(join(SOURCE, 'catalog.static.json'), 'utf8')) as CatalogItem[]).filter(
  (row) => row.drill?.kind === 'sight-reading',
);
const vocabulary = JSON.parse(readFileSync(join(SOURCE, 'curriculum', 'vocabulary', 'demands.json'), 'utf8')) as {
  demands: { id: string }[];
};

interface Build {
  via: 'readingOptions' | 'readingOffer' | 'optionsFor';
  row?: string;
  rung?: string;
  /** Params spliced over the row's own (C, A) or the whole params (optionsFor). */
  params?: Record<string, unknown>;
  withoutDemand?: string;
  learnerRung?: string;
  day?: string;
}

interface Item {
  id: string;
  stratum: string;
  build: Build;
  seed: number;
}

const lessons: Lesson[] = curriculum.stages.flatMap((stage) => stage.units.flatMap((unit) => unit.lessons));
const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
const rowById = new Map(readers.map((row) => [row.id, row]));

/** `TodayScreen.ts:1462`, copied (the screen module needs a browser to import). */
function rungForSlot(item: CatalogItem, offeredFrom?: string): string | undefined {
  const lists = (lesson: { exerciseOptions: string[]; songOptions: string[] }): boolean =>
    lesson.exerciseOptions.includes(item.id) || lesson.songOptions.includes(item.id);
  const offered = offeredFrom === undefined ? undefined : lessonById.get(offeredFrom);
  if (offered && lists(offered)) return offered.id;
  const listing = lessons.filter(lists);
  return listing.length === 1 ? listing[0]?.id : undefined;
}

function rowWith(id: string, params: Record<string, unknown> | undefined): CatalogItem {
  const row = rowById.get(id);
  if (!row) throw new Error(`no reading row ${id}`);
  if (!params) return row;
  return { ...row, drill: { ...row.drill, params: { ...(row.drill?.params ?? {}), ...params } } } as CatalogItem;
}

function localDay(day: string): Date {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d, 12, 0, 0);
}

interface Resolved {
  options: SightReadingOptions;
  /** The rung whose taught set held the options (null: unheld). */
  heldAt: string | null;
  row: string | null;
  offer?: { item: string; lessonId: string | null; anchored: boolean; seed: number };
}

function resolve(item: Item): Resolved {
  const b = item.build;
  if (b.via === 'optionsFor') {
    return { options: sightReadingOptionsFor(b.params ?? {}, item.seed), heldAt: null, row: null };
  }
  if (b.via === 'readingOptions') {
    const row = rowWith(b.row as string, b.params);
    const taught = b.rung === undefined ? undefined : taughtAtRung(curriculum, b.rung);
    let options = readingOptions(row, undefined, item.seed, taught);
    if (b.withoutDemand) {
      const off = withoutDemand(options, b.withoutDemand);
      if (!off) throw new Error(`no off patch for ${b.withoutDemand}`);
      options = off;
    }
    return { options, heldAt: b.rung ?? null, row: row.id };
  }
  // The daily read for a fresh learner (the curriculum's default tracks) at `learnerRung` on `day`, no reads yet.
  const lesson = lessonById.get(b.learnerRung as string);
  if (!lesson) throw new Error(`no rung ${String(b.learnerRung)}`);
  const offer = readingOffer({
    curriculum,
    items: readers,
    position: { lesson } as LessonPosition,
    activeTracks: defaultActiveTracks(curriculum),
    rows: [],
    today: localDay(b.day as string),
    purpose: 'daily',
  });
  if (!offer) throw new Error('no offer');
  const hold = rungForSlot(offer.item, offer.lessonId);
  const taught = hold === undefined ? undefined : taughtAtRung(curriculum, hold);
  const options = readingOptions(offer.item, offer.recipe, offer.seed, taught);
  return {
    options,
    heldAt: hold ?? null,
    row: offer.item.id,
    offer: { item: offer.item.id, lessonId: offer.lessonId ?? null, anchored: offer.anchored, seed: offer.seed },
  };
}

function manifestItems(): Item[] {
  return (JSON.parse(readFileSync(MANIFEST, 'utf8')) as { items: Item[] }).items;
}

describe.runIf(MODE === 'taught')('taught sets', () => {
  it('writes every rung’s taught set', () => {
    const out: Record<string, string[]> = {};
    for (const lesson of lessons) {
      const taught = taughtAtRung(curriculum, lesson.id);
      out[lesson.id] = taught ? vocabulary.demands.map((d) => d.id).filter((id) => taught(id)) : [];
    }
    mkdirSync(OUT, { recursive: true });
    writeFileSync(join(OUT, 'taught.json'), JSON.stringify({ order: lessons.map((l) => l.id), taught: out }, null, 1));
    expect(Object.keys(out).length).toBe(lessons.length);
  });
});

describe.runIf(MODE === 'plan')('plan', () => {
  it('resolves every item without generating', () => {
    const out = manifestItems().map((item) => {
      const r = resolve(item);
      return { id: item.id, ...r, unrealisable: unrealisable(r.options), dailySeedCheck: item.build.day ? dailySeed(item.build.day) : null };
    });
    mkdirSync(OUT, { recursive: true });
    writeFileSync(join(OUT, 'plan.json'), JSON.stringify(out, null, 1));
    expect(out.length).toBeGreaterThan(0);
  });
});

function attempt(options: SightReadingOptions):
  | { outcome: 'WRITE'; xml: string; result: Record<string, unknown> }
  | { outcome: 'REFUSE'; reasons: readonly string[]; result: Record<string, unknown> } {
  try {
    const phrase = generateSightReading(options);
    return {
      outcome: 'WRITE',
      xml: phrase.musicXml,
      result: {
        fifths: phrase.fifths,
        timeSig: phrase.timeSig,
        bars: phrase.bars,
        bpm: phrase.bpm,
        melody: phrase.melody,
        generator: phrase.generator,
        title: phrase.title,
      },
    };
  } catch (cause: unknown) {
    if (!(cause instanceof SightReadingRefusal)) throw cause;
    return {
      outcome: 'REFUSE',
      reasons: cause.reasons,
      result: { fifths: cause.fifths, timeSig: cause.timeSig, attempts: cause.attempts, generator: cause.generator },
    };
  }
}

describe.runIf(MODE === 'generate')('generate', () => {
  it('generates every item twice', () => {
    const dir = join(OUT, 'items');
    mkdirSync(dir, { recursive: true });
    const out = manifestItems().map((item) => {
      const r = resolve(item);
      const first = attempt(r.options);
      const second = attempt(r.options);
      const same =
        first.outcome === second.outcome &&
        (first.outcome === 'WRITE' ? first.xml === (second as { xml: string }).xml : JSON.stringify(first.reasons) === JSON.stringify((second as { reasons: readonly string[] }).reasons));
      if (first.outcome === 'WRITE') writeFileSync(join(dir, `${item.id}.musicxml`), first.xml);
      return {
        id: item.id,
        ...r,
        unrealisable: unrealisable(r.options),
        outcome: first.outcome,
        ...(first.outcome === 'REFUSE' ? { reasons: first.reasons } : {}),
        ...first.result,
        deterministic: same,
      };
    });
    writeFileSync(join(OUT, 'results.json'), JSON.stringify(out, null, 1));
    expect(out.length).toBeGreaterThan(0);
  });
});
