// @vitest-environment jsdom
/**
 * PF5's model dump: what the app's score model reads for each printed bar, staff and voice of one catalogue item's
 * built file, under the compatibility default (the item's declared hand, no verified hand rows) and as the Score
 * screen plays it (with the item's current rows). This is the proof route HD2's `hand` rows use (the evidence files
 * `docs/prompts/runs/CD1/evidence/crave-40.txt` and `solace-22.txt` are dumps of the same kind): a hand row says what
 * the hand is, and the dump is what lets a reader see the model's default agree or disagree with it. A row whose
 * default reading is already right is a confirming row (PF5, `PF1-authored-hand-proof`).
 *
 * How to run, from `app/` with the built content in `app/public/content` (PF5_ITEM names the item; PF5_OUT the file):
 *   PF5_ITEM=exercise.blues.twelve-bar-shuffle.c PF5_OUT=../docs/prompts/runs/PF1/evidence/hand-dump-shuffle-c.txt \
 *     npx vitest run --config ../docs/prompts/runs/PF1/vitest.config.ts
 *
 * Output: one line per printed bar and (staff, voice): the notes it holds and the hand the default reading gives
 * them and the hand the applied rows give them. It asserts nothing; a throwaway reader, never part of a suite.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'vitest';
import { OpenSheetMusicDisplay } from '../../../../app/node_modules/opensheetmusicdisplay';
import { declaredHandOf } from '../../../../app/src/curriculum/declaredHand';
import { verifiedHandsOption } from '../../../../app/src/curriculum/verifiedFacts';
import { extractScoreModel } from '../../../../app/src/score/extractScoreModel';
import { toMusicXml } from '../../../../app/src/score/mxl';
import type { ScoreModel } from '../../../../app/src/score/types';
import { catalog, CONTENT_DIR, installTextMeasurer } from '../../../../app/tests/unit/helpers/scoreCatalog';

const ITEM = process.env.PF5_ITEM ?? 'exercise.blues.twelve-bar-shuffle.c';
const OUT = process.env.PF5_OUT;

async function model(item: ReturnType<typeof catalog>[number] & { file: string }, applied: boolean) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  try {
    const osmd = new OpenSheetMusicDisplay(container, { autoResize: false, backend: 'svg' });
    const musicXml = toMusicXml(new Uint8Array(readFileSync(resolve(CONTENT_DIR, item.file))));
    await osmd.load(musicXml);
    const declaredHand = declaredHandOf(item);
    const built: ScoreModel = extractScoreModel(osmd, {
      id: item.id,
      musicXml,
      ...(declaredHand === undefined ? {} : { declaredHand }),
      ...(applied ? verifiedHandsOption(item) : {}),
    });
    const numbers = (osmd.Sheet as unknown as { SourceMeasures: { MeasureNumber: number }[] }).SourceMeasures.map((m) => m.MeasureNumber);
    return { built, numbers };
  } finally {
    container.remove();
  }
}

describe('PF5 model dump', () => {
  it(`dumps ${ITEM}`, async () => {
    installTextMeasurer();
    const item = catalog().find((row) => row.id === ITEM);
    if (item === undefined || typeof item.file !== 'string') throw new Error(`${ITEM}: not in the built catalogue, or no file`);
    const withFile = item as typeof item & { file: string };
    const lines: string[] = [
      `item ${item.id}; file ${item.file}; identity ${JSON.stringify(item.provenance?.identity)}`,
      'bar = the printed measure number; default = the compatibility reading (no verified hand rows); applied = with the item\'s current rows',
    ];
    const [base, applied] = [await model(withFile, false), await model(withFile, true)];
    const key = (n: { sourceMeasureIndex: number; staff: number; voice: number }, numbers: number[]) =>
      `bar ${String(numbers[n.sourceMeasureIndex] ?? n.sourceMeasureIndex + 1)} staff ${String(n.staff)} voice ${String(n.voice)}`;
    const tally = new Map<string, { notes: number; def: Set<string>; app: Set<string> }>();
    for (const step of base.built.steps) {
      for (const note of step.notes) {
        const k = key(note, base.numbers);
        const row = tally.get(k) ?? { notes: 0, def: new Set<string>(), app: new Set<string>() };
        row.notes += 1;
        row.def.add(note.hand);
        tally.set(k, row);
      }
    }
    for (const step of applied.built.steps) {
      for (const note of step.notes) {
        const k = key(note, applied.numbers);
        const row = tally.get(k);
        if (row !== undefined) row.app.add(note.hand);
      }
    }
    for (const [k, row] of [...tally].sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))) {
      lines.push(`${k}: ${String(row.notes)} notes; default ${[...row.def].join('/')}; applied ${[...row.app].join('/')}`);
    }
    lines.push(`hands present (default): ${JSON.stringify(base.built.handsPresent)}`);
    const text = lines.join('\n') + '\n';
    if (OUT !== undefined) {
      mkdirSync(dirname(resolve(OUT)), { recursive: true });
      writeFileSync(resolve(OUT), text);
    }
    console.log(text);
  }, 120_000);
});
