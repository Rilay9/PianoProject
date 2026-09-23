// The shipped catalog and its score files, loaded the way the app loads them.
//
// `catalog.json` is read rather than a fixture, for `drillFromCatalog.test.ts`'s
// reason: the scores are **content** and change without the code changing, so a
// file the engine cannot follow has to fail here and not on somebody's phone.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import type { CatalogItem, Curriculum } from '../../../src/curriculum/types';
import { extractScoreModel } from '../../../src/score/extractScoreModel';
import { toMusicXml } from '../../../src/score/mxl';
import type { ScoreModel } from '../../../src/score/types';

export const CONTENT_DIR = resolve('public', 'content');

export function catalog(): CatalogItem[] {
  return JSON.parse(readFileSync(resolve(CONTENT_DIR, 'catalog.json'), 'utf8')) as CatalogItem[];
}

export function curriculum(): Curriculum {
  return JSON.parse(readFileSync(resolve(CONTENT_DIR, 'curriculum.json'), 'utf8')) as Curriculum;
}

/** Every catalog row that carries a score file — what the Score screen can open. */
export function itemsWithScores(
  items: CatalogItem[] = catalog(),
): (CatalogItem & { file: string })[] {
  return items.filter((item): item is CatalogItem & { file: string } => typeof item.file === 'string' && item.file.length > 0);
}

/**
 * Round-robin over the id-sorted list.
 *
 * Sharding exists because the whole catalog is minutes of OSMD parsing and the
 * unit suite is seconds; splitting it across files lets the runner's workers
 * carry it in parallel. Round-robin rather than by leading id, because the
 * expensive files are the imported and public-domain songs and those sit
 * together under one prefix — shards split that way would be one long pole and
 * several idle ones.
 */
export function shard<T extends { id: string }>(items: T[], index: number, count: number): T[] {
  const sorted = [...items].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return sorted.filter((_, i) => i % count === index);
}

/**
 * Lets OSMD's graphic layer measure text under jsdom.
 *
 * `osmd.load()` builds a `GraphicalMusicSheet` before returning, and any sheet
 * with a chord symbol on it asks VexFlow for the width of that text — through
 * a canvas 2D context, which jsdom does not implement, so `load()` throws
 * `Cannot set properties of null (setting 'font')` on real repertoire. The
 * hand-written fixtures have no chord symbols, which is why nothing has needed
 * this before.
 *
 * Nothing here is read by anything this file returns: the model comes from
 * `osmd.Sheet`, which the reader builds from the MusicXML before the graphic
 * layer exists. The stub is what a browser would have supplied, so it removes
 * an obstacle to running the app's own parse in Node rather than standing in
 * for any part of it.
 */
export function installTextMeasurer(): void {
  const context = {
    font: '10px Arial',
    measureText: (text: string) => ({ width: text.length * 6 }),
    fillText: () => undefined,
    save: () => undefined,
    restore: () => undefined,
  };
  HTMLCanvasElement.prototype.getContext = (() =>
    context) as unknown as HTMLCanvasElement['getContext'];
}

/**
 * The score model the app builds for this item.
 *
 * `osmd.load` then `extractScoreModel`, exactly as `helpers/fixtures.ts` does
 * it for the golden models — the same two calls the Score screen makes.
 */
export async function modelForItem(item: CatalogItem & { file: string }): Promise<ScoreModel> {
  const bytes = new Uint8Array(readFileSync(resolve(CONTENT_DIR, item.file)));
  const container = document.createElement('div');
  document.body.appendChild(container);
  try {
    const osmd = new OpenSheetMusicDisplay(container, { autoResize: false, backend: 'svg' });
    await osmd.load(toMusicXml(bytes));
    return extractScoreModel(osmd, { id: item.id });
  } finally {
    container.remove();
  }
}
