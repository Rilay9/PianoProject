// @vitest-environment jsdom
/**
 * HD2's corpus diff: every note of the built catalogue whose `hand` or `crossStaff` changes between the
 * voice-home rule (the extractor at e7cf920c) and the printed-staff rule (the worktree's), classified.
 *
 * How to run, from `app/` with the built content in `app/public/content`:
 *   git show e7cf920c:app/src/score/extractScoreModel.ts \
 *     | sed "s#from './tempoFromXml'#from '../../src/score/tempoFromXml'#; s#from './types'#from '../../src/score/types'#" \
 *     > build/HD2/extractScoreModel.base.ts
 *   npx vitest run --config ../docs/prompts/runs/HD2/vitest.config.ts
 * It writes `app/build/HD2/corpus-diff.shard-<n>.json` per shard; `python docs/prompts/runs/HD2/classify.py` (from the
 * repository root) classifies them into `docs/prompts/runs/HD2/corpus-diff.txt`.
 *
 * Each row with a score file is read as the unit helper `scoreCatalog.modelForItem` reads it (OSMD under
 * jsdom with the text measurer, the row's declared hand by `declaredHandOf`), and both extractors run on
 * the one parsed sheet. The steps and note ids must agree; only `hand` and `crossStaff` may differ.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { declaredHandOf } from '../../../../app/src/curriculum/declaredHand';
import { extractScoreModel } from '../../../../app/src/score/extractScoreModel';
import { toMusicXml } from '../../../../app/src/score/mxl';
import type { ScoreModel, ScoreNote } from '../../../../app/src/score/types';
import { loadFixture } from '../../../../app/tests/unit/helpers/fixtures';
import { catalog, CONTENT_DIR, installTextMeasurer, itemsWithScores, shard } from '../../../../app/tests/unit/helpers/scoreCatalog';
// The base extractor, copied from e7cf920c by the recipe above (gitignored).
import { extractScoreModel as extractBase } from '../../../../app/build/HD2/extractScoreModel.base';

const SHARDS = 4;
/** The shards' raw lists run to megabytes: they stay in the worktree's gitignored build folder; `classify.py` writes the kept summary. */
const OUT_DIR = resolve('build', 'HD2');

export interface ChangedNote {
  ids: string[];
  file: string;
  bar: number;
  sourceMeasureIndex: number;
  measureIndex: number;
  sourceOnset: number;
  midi: number;
  staff: 1 | 2;
  voice: number;
  before: string;
  after: string;
  /** The voice's printed staves in this bar, in order of onset (the new model's notes, a chord as `1+2`). */
  barLine: string;
  /** Whether the voice sounds on both staves at one onset in this bar (two lines under one number). */
  simultaneous: boolean;
  staves: number;
  declared: string;
}

const tag = (note: ScoreNote): string => `${note.hand}${note.crossStaff === true ? '/x' : ''}`;

function barLineOf(model: ScoreModel, note: ScoreNote): { barLine: string; simultaneous: boolean } {
  const byOnset = new Map<number, Set<number>>();
  for (const step of model.steps) {
    if (step.measureIndex !== note.measureIndex) continue;
    for (const other of step.notes) {
      if (other.voice !== note.voice) continue;
      const here = byOnset.get(other.onset) ?? new Set<number>();
      here.add(other.staff);
      byOnset.set(other.onset, here);
    }
  }
  const onsets = [...byOnset.keys()].sort((a, b) => a - b);
  const parts = onsets.map((onset) => [...(byOnset.get(onset) ?? [])].sort().join('+'));
  return { barLine: parts.join(' '), simultaneous: parts.some((p) => p.includes('+')) };
}

/** `HD2_SHARDS=0,1` runs those shards only (two processes share the work); `HD2_LIMIT` caps the files, for a trial. */
const ONLY = process.env.HD2_SHARDS?.split(',').map(Number);
const LIMIT = Number(process.env.HD2_LIMIT ?? 'Infinity');

describe.each(Array.from({ length: SHARDS }, (_, index) => index).filter((index) => ONLY === undefined || ONLY.includes(index)))('HD2 corpus diff, shard %i', (index) => {
  it('compares the two rules on every score file of the shard', async () => {
    installTextMeasurer();
    const rows = itemsWithScores(catalog());
    const byFile = new Map<string, { id: string; file: string; declared: ReturnType<typeof declaredHandOf> }[]>();
    for (const row of rows) {
      const declared = declaredHandOf(row);
      const key = `${row.file}|${String(declared)}`;
      const list = byFile.get(key) ?? [];
      list.push({ id: row.id, file: row.file, declared });
      byFile.set(key, list);
    }
    const units = shard(
      [...byFile.entries()].map(([key, list]) => ({ id: key, list })),
      index,
      SHARDS,
    ).slice(0, LIMIT);
    const changed: ChangedNote[] = [];
    const failures: string[] = [];
    let notes = 0;
    let files = 0;
    for (const unit of units) {
      const first = unit.list[0];
      if (!first) continue;
      const path = resolve(CONTENT_DIR, first.file);
      try {
        const osmd = await loadFixture(path);
        const musicXml = toMusicXml(new Uint8Array(readFileSync(path)));
        const options = { id: first.id, musicXml, ...(first.declared === undefined ? {} : { declaredHand: first.declared }) };
        const before = extractBase(osmd, options);
        const after = extractScoreModel(osmd, options);
        const staves = (osmd.Sheet.Staves as unknown[]).length;
        const numbers = osmd.Sheet.SourceMeasures.map((m) => m.MeasureNumber);
        files += 1;
        expect(after.steps.length, first.file).toBe(before.steps.length);
        after.steps.forEach((step, s) => {
          const old = before.steps[s];
          expect(step.notes.map((n) => n.id), `${first.file} step ${String(s)}`).toEqual(old?.notes.map((n) => n.id));
          step.notes.forEach((note, n) => {
            notes += 1;
            const was = old?.notes[n];
            if (!was) return;
            if (was.hand === note.hand && (was.crossStaff === true) === (note.crossStaff === true)) return;
            changed.push({
              ids: unit.list.map((row) => row.id),
              file: first.file,
              bar: numbers[note.sourceMeasureIndex] ?? -1,
              sourceMeasureIndex: note.sourceMeasureIndex,
              measureIndex: note.measureIndex,
              sourceOnset: note.sourceOnset,
              midi: note.midi,
              staff: note.staff,
              voice: note.voice,
              before: tag(was),
              after: tag(note),
              ...barLineOf(after, note),
              staves,
              declared: String(first.declared),
            });
          });
        });
      } catch (error) {
        failures.push(`${first.file}: ${error instanceof Error ? error.message.split('\n')[0] ?? '' : String(error)}`);
      } finally {
        // `loadFixture` leaves its container in the page: two thousand of them would hold every sheet.
        document.body.innerHTML = '';
      }
    }
    writeFileSync(
      resolve(OUT_DIR, `corpus-diff.shard-${String(index)}.json`),
      `${JSON.stringify({ files, notes, failures, changed })}\n`,
      'utf8',
    );
  }, 3_600_000);
});
