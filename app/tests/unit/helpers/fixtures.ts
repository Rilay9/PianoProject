// Loading score fixtures into OSMD for Node-side tests.
//
// OSMD parses MusicXML happily under jsdom; it cannot *render* there, because
// VexFlow measures text through a canvas 2D context that jsdom does not
// implement. That split is why the model tests live in Vitest (parse only)
// while anything involving the drawn cursor or SVG lives in Playwright.
//
// Files that use this must opt into jsdom with a `@vitest-environment jsdom`
// docblock; the default environment for this project is node.

import { readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { toMusicXml } from '../../../src/score/mxl';

// Anchored to the working directory rather than `import.meta.url`: under the
// jsdom environment `import.meta.url` is an http:// URL, which `fileURLToPath`
// rejects. Vitest always runs with `app/` as the cwd (vitest.config.ts lives
// there), so this is stable.
export const FIXTURES_ROOT = join(process.cwd(), 'tests', 'fixtures', 'scores');
export const EDGE_DIR = join(FIXTURES_ROOT, 'edge');
export const GENERATED_DIR = join(FIXTURES_ROOT, 'generated');
export const GOLDEN_DIR = join(FIXTURES_ROOT, 'golden');

export interface Fixture {
  /** Stable name used for the golden file and the test title. */
  name: string;
  path: string;
}

function listFixtures(dir: string, extensions: string[]): Fixture[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries
    .filter((f) => extensions.some((ext) => f.endsWith(ext)))
    .sort()
    .map((f) => ({ name: basename(f).replace(/\.(musicxml|mxl|xml)$/, ''), path: join(dir, f) }));
}

/** The hand-written edge cases: ties, voices, repeats, pickups, and so on. */
export function edgeFixtures(): Fixture[] {
  return listFixtures(EDGE_DIR, ['.musicxml', '.xml']);
}

/** The music21-generated technique exercises (compressed MusicXML). */
export function generatedFixtures(): Fixture[] {
  return listFixtures(GENERATED_DIR, ['.mxl']);
}

export function allFixtures(): Fixture[] {
  return [...edgeFixtures(), ...generatedFixtures()];
}

export function readMusicXml(path: string): string {
  return toMusicXml(new Uint8Array(readFileSync(path)));
}

/**
 * Parses a fixture and returns the OSMD instance. `autoResize: false` keeps
 * OSMD from attaching a resize listener to a jsdom window that never resizes.
 */
export async function loadFixture(path: string): Promise<OpenSheetMusicDisplay> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const osmd = new OpenSheetMusicDisplay(container, { autoResize: false, backend: 'svg' });
  await osmd.load(readMusicXml(path));
  return osmd;
}
