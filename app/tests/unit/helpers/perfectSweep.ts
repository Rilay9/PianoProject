// One shard of the perfect-performance sweep (T24).
//
// The body is here and the shards are thin files beside it, because a runner
// worker is per *file*: the catalog is minutes of OSMD parsing and the unit
// suite is seconds, so the only way to have both is to let several workers
// carry it at once. Every shard is the same code over a different slice, and
// `shard()` says why the slice is round-robin rather than alphabetical.

import { describe, expect, it } from 'vitest';
import { DEFAULT_MASTERY, evaluateOutcome } from '../../../src/engine/Scoring';
import { masteryCriteriaFor } from '../../../src/curriculum/selectors';
import type { CatalogItem, Curriculum } from '../../../src/curriculum/types';
import {
  faultIn,
  modelFaults,
  perfectTempoRun,
  perfectWaitRun,
  tempoOptions,
  waitOptions,
} from './perfectRun';
import {
  catalog,
  curriculum,
  installTextMeasurer,
  itemsWithScores,
  modelForItem,
  shard,
} from './scoreCatalog';

/** Long enough for the largest public-domain score in the catalog to parse. */
const PER_ITEM_TIMEOUT_MS = 120_000;

/**
 * How many files the sweep is split across.
 *
 * Measured rather than chosen: the whole catalog in one file is minutes of
 * OSMD parsing, and the runner gives a file one worker. The number is a
 * division of the work and not a fact about this machine (`00` §2) — more
 * shards than cores costs nothing but a few worker starts.
 */
export const PERFECT_SHARDS = 8;

/**
 * The two imported files that ask for keys a piano does not have.
 *
 * Recorded on 2026-09-09 (`docs/handoff-2026-09-09.md` item 12: *"Two imported
 * scores ask for keys the piano does not have and the importer lets them
 * through where the generator refuses… `validate.py` prints the note and
 * passes"*) and still in the files — read out of the MusicXML on 2026-09-22,
 * not inferred from the model: `mariage-damour.alt2` writes D8 three times, one
 * of them a tie continuation the extractor merges, so two steps want it;
 * `bach-toccata-fugue-bwv565` writes G♯0 once.
 *
 * It matters because `stripRange` clamps the on-screen keyboard to
 * `LOWEST_KEY`..`HIGHEST_KEY` (`ui/KeyboardStrip.ts`): in **Wait for me** the
 * run stops on that step for anybody without a key that does not exist, and a
 * synthetic performance cannot see it, because a synthetic performer can press
 * anything. That is the whole reason `modelFaults` is asked before the run.
 *
 * The lines are exact, so this fails in **both** directions: a file that gets
 * worse, and a file that gets fixed — and the second is the one worth having,
 * because it is how the row stops outliving its reason (working-rules §2.8).
 * Content is another agent's to change; T24 records and does not edit it.
 */
const KNOWN_KEYS_A_PIANO_DOES_NOT_HAVE: Readonly<Record<string, readonly string[]>> = {
  'song.beautiful.mariage-damour.alt2': [
    'model: step 608 (bar 45) wants MIDI 110, which is not a key',
    'model: step 1090 (bar 81) wants MIDI 110, which is not a key',
  ],
  'song.classical.bach-toccata-fugue-bwv565': [
    'model: step 598 (bar 29) wants MIDI 20, which is not a key',
  ],
};

/**
 * Every item, or the slice named by `PERFECT_ONLY`.
 *
 * The filter is for reading a failure, not for reporting: a shard run with it
 * set covers what it names and nothing else, and the sweep's claim is the
 * unfiltered run.
 */
function itemsFor(index: number, count: number): (CatalogItem & { file: string })[] {
  const only = process.env.PERFECT_ONLY;
  const all = shard(itemsWithScores(catalog()), index, count);
  if (!only) return all;
  return all.filter((item) => item.id.includes(only));
}

export function sweepShard(index: number, count: number): void {
  installTextMeasurer();
  const items = itemsFor(index, count);
  const plan: Curriculum = curriculum();

  describe(`perfect performance — shard ${String(index + 1)} of ${String(count)}`, () => {
    it('has items to run, so a green shard means something', () => {
      expect(items.length).toBeGreaterThan(0);
    });

    it.each(items.map((item) => ({ id: item.id, item })))(
      '$id: every note at its own time, to the end, in Keep tempo and in Wait for me',
      async ({ item }) => {
        const model = await modelForItem(item);
        // The score's own swing marking, from the file and never from a genre
        // or a title (`00` §1a) — the same field `ScoreScreen` reads.
        const swing = item.notation?.swungMark === true ? { swing: true } : {};
        // The model first: a perfect performance of a wrong model is perfect,
        // so the questions a run cannot ask are asked before the run.
        const faults: string[] = modelFaults(model).map((line) => `model: ${line}`);

        const tempo = perfectTempoRun(model, tempoOptions(swing));
        const tempoFault = faultIn(tempo, 'Keep tempo');
        if (tempoFault) faults.push(tempoFault);

        // Revised (C5): under the numbers of every rung that lists the item —
        // a run is judged by the rung that opened it, which can be any of
        // them — and the learner's defaults where none does. It was the first
        // rung listing the item, the lookup C5 removed as a judge.
        if (tempo.score) {
          const listing = plan.stages.flatMap((stage) =>
            stage.units.flatMap((unit) =>
              unit.lessons.filter((lesson) => lesson.exerciseOptions.includes(item.id) || lesson.songOptions.includes(item.id)),
            ),
          );
          for (const rung of listing.length > 0 ? listing : [undefined]) {
            const criteria = masteryCriteriaFor(rung, DEFAULT_MASTERY);
            const outcome = evaluateOutcome(tempo.score, criteria);
            if (!outcome.passed) {
              faults.push(
                `Keep tempo: not a pass at accuracy ${outcome.accuracy.toFixed(4)} / tempo ${String(outcome.tempoPct)} % against ${String(criteria.passAccuracy)} / ${String(criteria.passTempoPct)} %${rung ? ` (${rung.id})` : ''}`,
              );
            }
          }
        }

        const wait = perfectWaitRun(model, waitOptions(swing));
        const waitFault = faultIn(wait, 'Wait for me');
        if (waitFault) faults.push(waitFault);

        const recorded = KNOWN_KEYS_A_PIANO_DOES_NOT_HAVE[item.id];
        if (recorded) {
          expect(
            faults,
            `${item.id}: the file's out-of-range notes have changed — if they were fixed, delete this row from KNOWN_KEYS_A_PIANO_DOES_NOT_HAVE`,
          ).toEqual([...recorded]);
          return;
        }

        expect(faults, `${item.id} (${item.file})`).toEqual([]);
      },
      PER_ITEM_TIMEOUT_MS,
    );
  });
}
