// @vitest-environment jsdom
// Independent acceptance items: docs/prompts/runs/CL10a/oracle.md at d1b40b98.
// This first runs unchanged on the existing detector, before any new guard.
import { beforeAll, describe, expect, it } from 'vitest';
import { detect, textureBars } from '../../src/demands/detect';
import { catalog, installTextMeasurer, itemsWithScores, modelForItem } from './helpers/scoreCatalog';

const falseItems = [
  'exercise.scale.a-flat-major.2oct.similar.both.2',
  'exercise.scale.a-flat-major.2oct.contrary.both.2',
  'exercise.hanon.01.both',
  'exercise.arpeggio.a-major.2oct.both',
  'exercise.chromatic.c.2oct.both',
  'exercise.accompaniment.alberti.c-major.left',
  'song.folk.hot-cross-buns.lh',
];
const trueItems = [
  'exercise.accompaniment.alberti.c-major.both',
  'exercise.accompaniment.waltz.c-major.both',
  'song.folk.greensleeves.waltz',
  'song.ragtime.joplin-maple-leaf-rag',
];
const conditionalItems = [
  'exercise.stride.c', 'exercise.oompah.c.octave',
  'song.classical.clementi-sonatina-no-1-muzio-clementi.pdmx',
];
const items = itemsWithScores(catalog());

async function trace(id: string) {
  const item = items.find(row => row.id === id);
  if (!item) throw new Error(`Oracle score missing: ${id}`);
  const model = await modelForItem(item);
  const bars = textureBars(model, 'leftHandPattern');
  const result = detect(model, 'leftHandPattern');
  // Print actual extracted intervals, not a description inferred from the id.
  // Repeated performed bars retain their printed index in the trace.
  console.log('CL10A_TEXTURE_ORACLE', JSON.stringify({ id, present: result.present, ...bars,
    traceScope: 'first four performed bars, including notes held into them',
    notes: model.steps.flatMap(step => step.notes).filter(note => note.measureIndex < 4).map(note => ({
      staff: note.staff, midi: note.midi, onset: note.onset, duration: note.duration,
      bar: note.measureIndex, printedBar: note.sourceMeasureIndex,
    })),
  }));
  return result.present;
}

describe('CL10a: independent real-score texture oracle', () => {
  beforeAll(installTextMeasurer);
  // These traces must be read first: two false exercises and one true Alberti.
  for (const id of falseItems) it(`${id}: no accompanied melody`, async () => {
    expect(await trace(id)).toBe(false);
  }, 120_000);
  for (const id of trueItems) it(`${id}: accompanied melody`, async () => {
    expect(await trace(id)).toBe(true);
  }, 120_000);
  for (const id of conditionalItems) it(`${id}: print intervals for a score reading`, async () => {
    await trace(id);
  }, 120_000);

  for (const family of ['scale', 'hanon', 'arpeggio', 'chromatic']) {
    it(`${family}: no generated family member is accompanied melody`, async () => {
      const members = items.filter(item => item.id.startsWith(`exercise.${family}.`));
      expect(members.length).toBeGreaterThan(0);
      const positives: string[] = [];
      for (const item of members) {
        const model = await modelForItem(item);
        if (detect(model, 'leftHandPattern').present) positives.push(item.id);
      }
      console.log('CL10A_TEXTURE_FAMILY', JSON.stringify({ family, total: members.length, positives }));
      expect(positives).toEqual([]);
    }, 600_000);
  }
});
