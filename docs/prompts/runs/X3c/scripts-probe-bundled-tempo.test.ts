// @vitest-environment jsdom
/**
 * X3c's second throwaway probe (run from app/tests/unit/ as x3cProbeBundledTempo.test.ts, moved here after
 * the run): two bundled scores whose first <metronome> counts a note other than a quarter
 * (`bundled-marks.txt`), read by the same path as the first probe — OSMD loads the score and the model's
 * first tempo is what the Score screen reads (`importMeasuredTruth.test.ts`'s `playedBpm`). Prints the first
 * mark, the first <sound tempo> and the tempo map; asserts the tempo the file states in quarter notes.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { toMusicXml } from '../../src/score/mxl';
import { installTextMeasurer } from './helpers/scoreCatalog';

// A score with chord symbols needs a text measurer in jsdom (the first run failed on it: Row, Row, Row).
beforeEach(() => installTextMeasurer());

const SCORES = join(process.cwd(), 'public', 'content', 'scores');

async function tempoMap(xml: string): Promise<{ atBeat: number; bpm: number }[]> {
  const [{ OpenSheetMusicDisplay }, { extractScoreModel }] = await Promise.all([import('opensheetmusicdisplay'), import('../../src/score/extractScoreModel')]);
  const osmd = new OpenSheetMusicDisplay(document.createElement('div'), { autoResize: false });
  await osmd.load(xml);
  return extractScoreModel(osmd, { id: 'probe', defaultBpm: 1 }).tempoMap;
}

describe('X3c probe: bundled scores with a mark in another note', () => {
  for (const file of ['authored/song.folk.row-row-row-your-boat.mxl', 'imported/song.classical.pachelbel-canon-d.easy.mxl']) {
    it(file, async () => {
      const xml = toMusicXml(new Uint8Array(readFileSync(join(SCORES, file))));
      const mark = /<metronome\b[^>]*>[\s\S]*?<\/metronome>/.exec(xml)?.[0] ?? 'none';
      const sound = /<sound\b[^>]*\btempo="([^"]*)"/.exec(xml)?.[1];
      const map = await tempoMap(xml);
      console.log(`${file}\n  first mark: ${mark.replace(/\s+/g, ' ')}\n  first <sound tempo>: ${sound ?? 'none'}\n  tempo map (first three): ${JSON.stringify(map.slice(0, 3))}`);
      expect(map[0]?.bpm, file).toBe(Number(sound));
    });
  }
});
