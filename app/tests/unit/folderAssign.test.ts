// @vitest-environment jsdom
/**
 * A score added from the folder has to be able to reach a rung (replan §4.3).
 *
 * The bug this pins down is a silence, not a crash. `addFromFolder` runs the
 * ordinary import, and a fresh import has no `lessonIds` — which
 * `curriculum/load.ts` says in its own words means the piece "sits outside the
 * curriculum: it cannot complete a rung, it never appears in a swap, and the
 * session builder cannot pick it". Everything looked like it worked. The
 * score was in the library, it opened, it played, and it counted towards
 * nothing at all, with nothing on any screen saying so.
 *
 * So the first half of this file asserts the gap — an added score contributes
 * nothing to any rung — and the second half drives the way out of it that the
 * folder screen's `Assign` now offers, ending at the same assertion with the
 * opposite answer.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { zipSync, strToU8 } from 'fflate';
import type { Curriculum } from '../../src/curriculum/types';
import type { ImportRow } from '../../src/data/db';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';

/**
 * The rung the piece is going to end up on.
 *
 * A hand-built two-rung curriculum rather than the real `curriculum.json`:
 * this test is about the overlay, and the overlay does not care how many
 * rungs there are. Loading the real one would need a network in jsdom.
 */
const CURRICULUM: Curriculum = {
  version: 1,
  tracks: [],
  stages: [
    {
      number: 1,
      title: 'Stage one',
      summary: '',
      units: [
        {
          id: 'u1',
          title: 'Unit one',
          track: 'core',
          lessons: [
            {
              id: '1.1',
              title: 'Hands together',
              concepts: ['hands-together', 'held-LH'],
              textFile: '1.1.md',
              exerciseOptions: ['drill.a'],
              songOptions: ['song.bundled'],
              mastery: { exercisesRequired: 1, songsRequired: 1, minAccuracy: 90, minTempoPct: 80 },
            },
            {
              id: '1.2',
              title: 'Something else',
              concepts: [],
              textFile: '1.2.md',
              exerciseOptions: [],
              songOptions: [],
              mastery: { exercisesRequired: 1, songsRequired: 1, minAccuracy: 90, minTempoPct: 80 },
            },
          ],
        },
      ],
    },
  ],
};

// The sheet asks the app for the curriculum and for a level estimated from
// the notes. The first is stubbed so no fetch is needed; the second because
// estimating pulls in OpenSheetMusicDisplay, which is not what is being
// tested here and does not render in jsdom. `overlayImports` — the thing
// actually under test — stays the real one.
vi.mock('../../src/curriculum/load', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/curriculum/load')>();
  return { ...actual, loadCurriculum: () => Promise.resolve(CURRICULUM) };
});
vi.mock('../../src/score/estimateImport', () => ({
  estimateLevelFor: () => Promise.resolve(undefined),
  loadLevelModel: () => Promise.resolve(null),
}));

const { overlayImports } = await import('../../src/curriculum/load');
const { addFromFolder, readFolder } = await import('../../src/data/folderLibrary');
const { importedCatalogItems } = await import('../../src/data/importStore');
const { openAssignSheetFor } = await import('../../src/ui/assignSheet');

const MUSICXML = `<?xml version="1.0"?>
<score-partwise version="4.0">
  <work><work-title>Paddies Evermore</work-title></work>
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1"><measure number="1"><note><rest/><duration>4</duration></note></measure></part>
</score-partwise>`;

function folderFile(path: string): File {
  const bytes = zipSync({
    'META-INF/container.xml':
      strToU8('<container><rootfiles><rootfile full-path="score.xml"/></rootfiles></container>'),
    'score.xml': strToU8(MUSICXML),
  });
  const file = new File([bytes], path.slice(path.lastIndexOf('/') + 1));
  Object.defineProperty(file, 'webkitRelativePath', { value: path });
  return file;
}

/** The song options of one rung after the imports have been overlaid. */
function optionsOf(curriculum: Curriculum, lessonId: string): string[] {
  for (const stage of curriculum.stages) {
    for (const unit of stage.units) {
      for (const lesson of unit.lessons) if (lesson.id === lessonId) return lesson.songOptions;
    }
  }
  throw new Error(`no rung ${lessonId}`);
}

async function addOneFromAFolder(): Promise<ImportRow> {
  const library = await readFolder([folderFile('Library/bb/Qm1.mxl')]);
  const score = library.scores[0];
  expect(score).toBeDefined();
  return addFromFolder(library.id, score!);
}

describe('a score added from the folder', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    document.body.replaceChildren();
  });

  it('earns no rung on its own — the silence this is all about', async () => {
    await addOneFromAFolder();
    const items = await importedCatalogItems();
    expect(items).toHaveLength(1);
    expect(items[0]?.lessonIds).toEqual([]);
    // Nothing to overlay, so the overlay hands the curriculum straight back:
    // the piece is in the library and on no rung, and every reader
    // downstream — `lessonComplete`, `alternativesFor`, `buildSession` —
    // reads `songOptions` and therefore cannot see it.
    expect(optionsOf(overlayImports(CURRICULUM, items), '1.1')).toEqual(['song.bundled']);
    clearFakeIndexedDb();
  });

  it('reaches the assign sheet from the folder, and then counts towards the rung', async () => {
    const row = await addOneFromAFolder();

    let resolveSaved: (saved: ImportRow) => void = () => undefined;
    const saved = new Promise<ImportRow>((resolve) => {
      resolveSaved = resolve;
    });
    // Exactly what the folder row's `Assign` does: the sheet, for this
    // import, with no trip through Library to find the row by hand.
    await openAssignSheetFor(row, { onSaved: resolveSaved });

    const sheet = document.getElementById('assign-sheet');
    expect(sheet).not.toBeNull();
    const rungSelect = document.getElementById('assign-lesson');
    expect(rungSelect).toBeInstanceOf(HTMLSelectElement);
    (rungSelect as HTMLSelectElement).value = '1.1';
    // As choosing it does: the rung's concepts are filled in on `change`, and
    // a value set without one is a rung with no concepts behind it.
    rungSelect?.dispatchEvent(new Event('change'));
    (document.getElementById('assign-save') as HTMLButtonElement).click();
    const updated = await saved;
    expect(updated.lessonIds).toEqual(['1.1']);
    // The rung's own concepts came with it, which is what the Skills screen
    // reads.
    expect(updated.concepts).toEqual(['hands-together', 'held-LH']);

    const items = await importedCatalogItems();
    expect(optionsOf(overlayImports(CURRICULUM, items), '1.1')).toEqual([
      'song.bundled',
      row.id,
    ]);
    // And only that rung.
    expect(optionsOf(overlayImports(CURRICULUM, items), '1.2')).toEqual([]);
    clearFakeIndexedDb();
  });

  it('leaves the piece on no rung when the sheet is saved with none chosen', async () => {
    const row = await addOneFromAFolder();
    let resolveSaved: (saved: ImportRow) => void = () => undefined;
    const saved = new Promise<ImportRow>((resolve) => {
      resolveSaved = resolve;
    });
    await openAssignSheetFor(row, { onSaved: resolveSaved });
    // The default option is "No rung — just put it in my library", and
    // nothing here is mandatory: saving it must not invent a rung.
    (document.getElementById('assign-save') as HTMLButtonElement).click();
    expect((await saved).lessonIds).toEqual([]);
    clearFakeIndexedDb();
  });
});
