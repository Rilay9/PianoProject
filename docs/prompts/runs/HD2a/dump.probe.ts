// @vitest-environment jsdom
/**
 * HD2a's model dump: the app's current score model of each listed catalogue item, note by note, as JSON, for
 * `signature.py` to read. The model is built as the Score screen builds it (the calls of
 * `scoreCatalog.modelForItem`, through `loadFixture` as HD2's probe: OSMD under jsdom, the item's declared hand and its current verified hands), so a dump of an item
 * that already has rows shows them applied.
 *
 * How to run, from `app/` with the built content in `app/public/content`:
 *   HD2A_IDS=<file of catalogue ids, one per line> npx vitest run --config ../docs/prompts/runs/HD2a/vitest.config.ts dump
 * It writes `app/build/HD2a/models/<id>.json`: the file, every catalogue id that ships the same file, the
 * catalogue's identity and the sha256 of the bytes read, the printed bar number of every source measure, and
 * the notes (repeats unrolled, as the model holds them).
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'vitest';
import { declaredHandOf } from '../../../../app/src/curriculum/declaredHand';
import { verifiedHandsOption } from '../../../../app/src/curriculum/verifiedFacts';
import { extractScoreModel } from '../../../../app/src/score/extractScoreModel';
import { toMusicXml } from '../../../../app/src/score/mxl';
import { loadFixture } from '../../../../app/tests/unit/helpers/fixtures';
import { catalog, CONTENT_DIR, installTextMeasurer, itemsWithScores } from '../../../../app/tests/unit/helpers/scoreCatalog';

/** `HD2A_WITHHOLD=1` builds the models without the verified hand rows (the calibration on HD2's five bars). */
const WITHHOLD = process.env.HD2A_WITHHOLD === '1';
const OUT_DIR = resolve('build', 'HD2a', WITHHOLD ? 'models-withheld' : 'models');
const IDS = readFileSync(process.env.HD2A_IDS ?? '', 'utf8')
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line.length > 0);

describe('HD2a model dump', () => {
  it('dumps every listed item', async () => {
    installTextMeasurer();
    mkdirSync(OUT_DIR, { recursive: true });
    const rows = itemsWithScores(catalog());
    const failures: string[] = [];
    for (const id of IDS) {
      const row = rows.find((r) => r.id === id);
      if (!row) {
        failures.push(`${id}: no catalogue row with a score file`);
        continue;
      }
      try {
        const path = resolve(CONTENT_DIR, row.file);
        const bytes = new Uint8Array(readFileSync(path));
        const osmd = await loadFixture(path);
        const musicXml = toMusicXml(bytes);
        const declaredHand = declaredHandOf(row);
        const verified = WITHHOLD ? {} : verifiedHandsOption(row);
        const model = extractScoreModel(osmd, {
          id: row.id,
          musicXml,
          ...(declaredHand === undefined ? {} : { declaredHand }),
          ...verified,
        });
        const numbers = osmd.Sheet.SourceMeasures.map((m) => m.MeasureNumber);
        const notes = model.steps.flatMap((step) =>
          step.notes.map((n) => ({
            bar: numbers[n.sourceMeasureIndex] ?? -1,
            smi: n.sourceMeasureIndex,
            mi: n.measureIndex,
            on: n.onset,
            son: n.sourceOnset,
            dur: n.duration,
            midi: n.midi,
            st: n.staff,
            v: n.voice,
            h: n.hand,
            x: n.crossStaff === true,
            g: n.graceNote === true,
          })),
        );
        const identity = (row as { provenance?: { identity?: unknown } }).provenance?.identity ?? null;
        writeFileSync(
          resolve(OUT_DIR, `${id}.json`),
          JSON.stringify({
            id,
            file: row.file,
            sharing: rows.filter((r) => r.file === row.file).map((r) => r.id),
            identity,
            sha256: createHash('sha256').update(bytes).digest('hex'),
            staves: (osmd.Sheet.Staves as unknown[]).length,
            declared: String(declaredHand),
            verified,
            numbers,
            notes,
          }),
          'utf8',
        );
      } catch (error) {
        failures.push(`${id}: ${error instanceof Error ? (error.message.split('\n')[0] ?? '') : String(error)}`);
      } finally {
        // `loadFixture` leaves its container in the page.
        document.body.innerHTML = '';
      }
    }
    writeFileSync(resolve('build', 'HD2a', 'dump-failures.txt'), `${failures.join('\n')}\n`, 'utf8');
  }, 3_600_000);
});
