// @vitest-environment jsdom
/**
 * X3d's bundled probe (not a test of the suite; run from app/tests/unit/ as x3dBundledModel.test.ts, once on
 * the committed code and once after the change, then moved to docs/prompts/runs/X3d/ as
 * scripts-bundled-model.test.ts). For every bundled score in `bundled-list.json` (X3c's two counts, listed by
 * scripts-bundled-list.py) it builds the model through the real extraction and writes the tempo map's first
 * four entries, as JSON lines, to the file `X3D_BUNDLED_OUT` names. It asserts nothing.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { it } from 'vitest';
import { toMusicXml } from '../../src/score/mxl';
import { installTextMeasurer } from './helpers/scoreCatalog';

const RUNS = join(process.cwd(), '..', 'docs', 'prompts', 'runs', 'X3d');
const SCORES = join(process.cwd(), 'public', 'content', 'scores');

it('prints the bundled scores’ tempo maps', { timeout: 600_000 }, async () => {
  installTextMeasurer();
  const [{ OpenSheetMusicDisplay }, { extractScoreModel }] = await Promise.all([import('opensheetmusicdisplay'), import('../../src/score/extractScoreModel')]);
  const list = JSON.parse(readFileSync(join(RUNS, 'bundled-list.json'), 'utf8')) as { file: string }[];
  const lines: string[] = [];
  for (const { file } of list) {
    let row: Record<string, unknown>;
    try {
      const xml = toMusicXml(new Uint8Array(readFileSync(join(SCORES, file))));
      const osmd = new OpenSheetMusicDisplay(document.createElement('div'), { autoResize: false });
      await osmd.load(xml);
      const model = extractScoreModel(osmd, { id: file, musicXml: xml });
      row = { file, map: model.tempoMap.slice(0, 4).map(({ atBeat, bpm }) => ({ atBeat, bpm: Math.round(bpm * 1000) / 1000 })), entries: model.tempoMap.length };
    } catch (cause) {
      row = { file, error: String(cause).slice(0, 160) };
    }
    lines.push(JSON.stringify(row));
  }
  const out = process.env.X3D_BUNDLED_OUT;
  if (out) writeFileSync(out, `${lines.join('\n')}\n`);
});
