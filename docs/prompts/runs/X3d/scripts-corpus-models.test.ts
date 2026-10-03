// @vitest-environment jsdom
/**
 * X3d's corpus probe through the real extraction (not a test of the suite; run from app/tests/unit/ as
 * x3dCorpusModels.test.ts after the change, then moved to docs/prompts/runs/X3d/ as
 * scripts-corpus-models.test.ts, with x3dCommittedExtract.ts, the committed extractor's text copied by
 * `git show HEAD:app/src/score/extractScoreModel.ts`, its one import repointed). For every score the bundled
 * catalogue names, OSMD loads it once and both extractors build its model: the committed one (the tempo from
 * OSMD's iterator) and this seam's (the tempo from `tempoFromXml`). Counts the scores whose Score-screen
 * label at the first step (`bpmAt` at its onset, rounded as the label rounds it) moves, and lists them with
 * both numbers, to the file `X3D_MODELS_OUT` names. Asserts nothing.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { it } from 'vitest';
import { toMusicXml } from '../../src/score/mxl';
import { bpmAt, type ScoreModel } from '../../src/score/types';
import { installTextMeasurer } from './helpers/scoreCatalog';
import { extractScoreModel as committedExtract } from './x3dCommittedExtract';

const CONTENT = join(process.cwd(), 'public', 'content');
const label = (model: ScoreModel): number => Math.round(bpmAt(model.tempoMap, model.steps[0]?.onset ?? 0));

it('compares every bundled score’s opening tempo, committed and now', { timeout: 3_600_000 }, async () => {
  installTextMeasurer();
  const [{ OpenSheetMusicDisplay }, { extractScoreModel }] = await Promise.all([import('opensheetmusicdisplay'), import('../../src/score/extractScoreModel')]);
  const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as { id: string; file?: string; tempoBpm?: number | null }[];
  let compared = 0;
  let sameLabel = 0;
  const moved: string[] = [];
  const failed: string[] = [];
  for (const item of catalog) {
    if (!item.file || !/\.(mxl|musicxml|xml)$/.test(item.file)) continue;
    try {
      const xml = toMusicXml(new Uint8Array(readFileSync(join(CONTENT, item.file))));
      const osmd = new OpenSheetMusicDisplay(document.createElement('div'), { autoResize: false });
      await osmd.load(xml);
      const before = committedExtract(osmd, { id: item.id });
      const now = extractScoreModel(osmd, { id: item.id, musicXml: xml });
      compared += 1;
      const [was, is] = [label(before), label(now)];
      if (was === is) sameLabel += 1;
      else moved.push(`${item.id}\t${String(was)} → ${String(is)} bpm\tcatalogue ${String(item.tempoBpm ?? null)}\tentries ${String(before.tempoMap.length)} → ${String(now.tempoMap.length)}`);
    } catch (cause) {
      failed.push(`${item.id}: ${String(cause).slice(0, 100)}`);
    }
  }
  const rows = [
    `scores compared: ${String(compared)}; the label at the first step unchanged: ${String(sameLabel)}; moved: ${String(moved.length)}; not built: ${String(failed.length)}`,
    '',
    'moved (id, the label before → after at 100 %, the catalogue tempoBpm, tempo-map entries before → after):',
    ...moved,
    '',
    'not built:',
    ...failed,
  ];
  const out = process.env.X3D_MODELS_OUT;
  if (out) writeFileSync(out, `${rows.join('\n')}\n`);
  console.log(rows[0]);
});
