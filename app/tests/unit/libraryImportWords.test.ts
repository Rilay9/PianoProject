// @vitest-environment jsdom
/**
 * The Library's words for an import, and for a piece it wants and does not bundle (X3; U75, E45).
 *
 * - **An import's row says its state in words**: the hands guessed or corrected; measured, or not
 *   yet; the tempo guessed — and, on the detail line in place of "song", read from the file or
 *   converted from MIDI. From the row's provenance, the same facts the import sheet renders.
 * - **The placeholder sheet prints what a learner can do** and never an id or a track name: it printed
 *   "What it trains: import-only" and "Tracks: film-game" (U75). `importHint` stays the source of the
 *   piece's own words.
 * - **The UI caller opens the import sheet from the row `addImport` returned** — the Library's picker,
 *   through the real screen — and the row's `Assign` opens the same sheet; a plain score whose staves
 *   and signature are the file's files quietly, as the assign sheet's rule has always had it.
 * - **E45**: the rock-module frame leaves the two sentences it survived in.
 * - **A PDF's Details says what its provenance holds** (G96a): an estimated level, never one the app
 *   guessed from the music (it reads no notes from a PDF), and the type *PDF*, never *song*.
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CatalogItem, Measurement, Provenance } from '../../src/curriculum/types';
import type { Router } from '../../src/router';
import { clearFakeIndexedDb, fakeFile, useFakeIndexedDb } from './helpers/idb';
import { installTextMeasurer } from './helpers/scoreCatalog';

const { placeholders } = vi.hoisted(() => ({
  placeholders: [
    {
      // The shape of the seven rock rows in `catalog.static.json`.
      id: 'song.rock.lp-final-masquerade',
      type: 'song',
      title: 'Final Masquerade',
      composer: 'Linkin Park',
      level: 4.3,
      hands: 'both',
      tracks: ['film-game'],
      concepts: ['import-only'],
      file: null,
      tags: [],
      importHint:
        'Buy the MusicXML from a retailer that exports it, or transcribe it in MuseScore and export MusicXML, then add it on the Library import screen.',
      source: { name: 'Not bundled — obtain the MusicXML yourself', license: 'copyright, not redistributable', url: null },
      alternatives: [],
    },
    {
      id: 'song.core.playable',
      type: 'song',
      title: 'A playable song',
      level: 1.1,
      hands: 'both',
      tracks: ['core', 'film-game'],
      concepts: [],
      file: 'x.musicxml',
      tags: [],
    },
  ],
}));

vi.mock('../../src/curriculum/load', () => ({
  // The catalogue the screen reads: the bundled rows above and whatever the store holds now.
  allItems: async () => {
    const store = await import('../../src/data/importStore');
    return [...placeholders, ...(await store.importedCatalogItems())];
  },
  loadCurriculum: () =>
    Promise.resolve({
      version: 1,
      tracks: [{ id: 'core', title: 'Core' }],
      stages: [{ number: 1, title: 'One', units: [{ id: 'u', title: 'U', lessons: [{ id: '1.1', title: 'First steps', concepts: [] }] }] }],
    }),
}));
vi.mock('../../src/score/estimateImport', () => ({
  estimateLevelFor: () => Promise.resolve(undefined),
  loadLevelModel: () => Promise.resolve(null),
}));

const { LibraryScreen } = await import('../../src/ui/screens/LibraryScreen');
const { addImport, importToCatalogItem, forgetConversionsForTest, updateImport } = await import('../../src/data/importStore');
const { importSourceWords, importStateWords, IMPORT_TEXT } = await import('../../src/ui/help');

const FIXTURES = join(process.cwd(), 'tests', 'fixtures', 'imports');
const router = { navigate: vi.fn(), navigateScore: vi.fn() } as unknown as Router;

async function mount(): Promise<HTMLElement> {
  const section = LibraryScreen(router);
  document.body.replaceChildren(section);
  await vi.waitFor(() => {
    expect(section.querySelector(`[data-item="${placeholders[0]?.id ?? ''}"]`)).not.toBeNull();
  });
  return section;
}

/** The picker, given files the way a person choosing them does. */
function pick(section: HTMLElement, files: File[]): void {
  const picker = section.querySelector('#library-file') as HTMLInputElement;
  Object.defineProperty(picker, 'files', { value: files, configurable: true });
  picker.dispatchEvent(new Event('change'));
}

const facts = (source: Provenance['source'], over: Provenance['facts']): Provenance => ({
  source,
  edition: null,
  facts: over,
  review: { score: null, teaching: null },
  ...(source === 'imported-midi' ? { converter: { name: 'app/src/import/midi/convert.ts', version: 1 } } : {}),
});
const MEASURED: Measurement = { status: 'measured', definitions: 3, located: {}, bars: 4, steps: 4, notes: 4, established: [] };

beforeEach(() => {
  useFakeIndexedDb();
  installTextMeasurer();
  forgetConversionsForTest();
});
afterEach(() => {
  clearFakeIndexedDb();
  document.body.replaceChildren();
});

describe('an import’s row says its state in words', () => {
  it('from the row’s provenance: whose the hands are, measured or not, the tempo; where the notes came from beside the level', () => {
    const item = (over: Partial<CatalogItem>): Pick<CatalogItem, 'kind' | 'demands' | 'measurement' | 'provenance'> => ({
      kind: 'musicxml',
      demands: ['interval.step'],
      measurement: { ...MEASURED },
      ...over,
    });
    const edition = item({ provenance: facts('imported-musicxml', { hands: { kind: 'authored', via: 'the file’s staves' }, tempo: { kind: 'authored', via: 'the file' } }) });
    expect(importSourceWords(edition)).toBe('read from the file');
    expect(importStateWords(edition)).toBe('measured');
    expect(importStateWords(item({ provenance: facts('imported-musicxml', { hands: { kind: 'authored', via: 'the file’s staves' }, tempo: { kind: 'inferred', via: 'no tempo in the file: the app’s default' } }) }))).toBe(
      'measured · tempo guessed',
    );
    const corrected = item({ provenance: facts('imported-midi', { hands: { kind: 'authored', via: 'the learner’s correction, 2026-09-29' }, tempo: { kind: 'authored', via: 'the file’s tempo map' } }) });
    expect(importSourceWords(corrected)).toBe('converted from MIDI');
    expect(importStateWords(corrected)).toBe('hands corrected · measured');
    expect(importStateWords(item({ provenance: facts('imported-midi', { hands: { kind: 'inferred', via: 'the converter split one line by the shape of its voices' }, tempo: { kind: 'inferred', via: 'no tempo in the file: the app’s default' } }) }))).toBe(
      'hands guessed · measured · tempo guessed',
    );
    // A tempo the learner stated (the store operation is E-tail's; the words follow the row).
    expect(importStateWords(item({ provenance: facts('imported-midi', { tempo: { kind: 'authored', via: 'the learner stated this tempo, 2026-09-29' } }) }))).toBe('measured · tempo yours');
    // Imported before the app measured demands: nothing is known but that.
    const beforeE0 = item({ demands: undefined, measurement: undefined, provenance: undefined });
    expect(importStateWords(beforeE0)).toBe('not measured yet');
    expect(importSourceWords(beforeE0)).toBe('');
    // A PDF says what it is on its badge; its row carries no second line saying it again.
    const pdf = item({ kind: 'pdf', demands: 'unmeasured', measurement: { status: 'unmeasured', reason: 'a PDF' } });
    expect(importStateWords(pdf)).toBe('');
    expect(importSourceWords(pdf)).toBe('');
  });

  it('on the row itself, for the score just imported: the source on the detail line, the state under it', async () => {
    const section = await mount();
    pick(section, [fakeFile('left-hand-first.mid', new Uint8Array(readFileSync(join(FIXTURES, 'left-hand-first.mid'))))]);
    const state = await vi.waitFor(() => {
      const found = section.querySelector('[data-item="import.left-hand-first"] .library-import-state');
      expect(found).not.toBeNull();
      return found as HTMLElement;
    });
    expect(state.textContent).toBe('measured · tempo guessed');
    expect(section.querySelector('[data-item="import.left-hand-first"] .list-row__metatext')?.textContent).toMatch(/· converted from MIDI$/);
  });
});

describe('the UI opens the import sheet from the row addImport returned', () => {
  it('the picker’s import of a MIDI file opens it, the store having opened nothing', async () => {
    const section = await mount();
    pick(section, [fakeFile('left-hand-first.mid', new Uint8Array(readFileSync(join(FIXTURES, 'left-hand-first.mid'))))]);
    const sheet = await vi.waitFor(() => {
      const found = document.querySelector('#assign-sheet[data-sheet="import"]');
      expect(found).not.toBeNull();
      return found as HTMLElement;
    });
    expect(sheet.querySelector('#import-read')).not.toBeNull();
    expect(sheet.querySelector('#import-swap')).not.toBeNull();
    expect(section.querySelector('#library-status')?.textContent).toContain('Imported 1:');
  });

  it('a score whose staves and signature are the file’s files quietly; its row’s Assign opens the same sheet', async () => {
    const section = await mount();
    const xml = readFileSync(join(FIXTURES, 'test-tune.musicxml'), 'utf8');
    pick(section, [fakeFile('test-tune.musicxml', xml)]);
    await vi.waitFor(() => {
      expect(section.querySelector('#library-status')?.textContent).toContain('Imported 1:');
    });
    const row = await vi.waitFor(() => {
      const found = section.querySelector('.list-row[data-kind="musicxml"]');
      expect(found).not.toBeNull();
      return found as HTMLElement;
    });
    expect(document.querySelector('.sheet')).toBeNull();
    const assign = [...row.querySelectorAll('button')].find((button) => button.textContent === 'Assign') as HTMLButtonElement;
    assign.click();
    const sheet = await vi.waitFor(() => {
      const found = document.querySelector('#assign-sheet[data-sheet="import"]');
      expect(found).not.toBeNull();
      return found as HTMLElement;
    });
    expect(sheet.querySelector('#import-hands')?.textContent).toContain('from the file');
    expect(sheet.querySelector('#assign-lesson')).not.toBeNull();
  });
});

describe('the placeholder sheet prints what a learner can do, never an id or a track name (U75)', () => {
  it('the wanted piece’s sheet: the piece’s own words, what the app reads, and the control that imports', async () => {
    const section = await mount();
    const row = section.querySelector(`[data-item="${placeholders[0]?.id ?? ''}"]`) as HTMLElement;
    ([...row.querySelectorAll('button')].find((button) => button.textContent === 'Details') as HTMLButtonElement).click();
    const sheet = document.getElementById('library-detail') as HTMLElement;
    const said = sheet.textContent ?? '';
    expect(said).not.toContain('import-only');
    expect(said).not.toContain('film-game');
    expect(said).not.toContain('Tracks');
    expect(said).not.toContain('What it trains');
    expect(said).toContain(placeholders[0]?.importHint ?? '');
    expect(said).toContain(IMPORT_TEXT.formats);
    expect(sheet.querySelector('#library-detail-import')?.textContent).toBe(IMPORT_TEXT.importButton);
  });

  it('a playable row’s tracks are named by their titles, and an id with no title is left out', async () => {
    const section = await mount();
    const row = section.querySelector('[data-item="song.core.playable"]') as HTMLElement;
    ([...row.querySelectorAll('button')].find((button) => button.textContent === 'Details') as HTMLButtonElement).click();
    const said = document.getElementById('library-detail')?.textContent ?? '';
    expect(said).toContain('Core');
    expect(said).not.toContain('film-game');
  });
});

describe('E45: the rock-module frame leaves the two sentences it survived in', () => {
  it('session.ts’s last-resort sentence and docs/03’s dataset line', () => {
    const session = readFileSync(resolve('src', 'curriculum', 'session.ts'), 'utf8');
    expect(session).not.toMatch(/rock-module/i);
    expect(session).toContain('A song you have not imported yet is not a dead row');
    const pipeline = readFileSync(resolve('..', 'docs', '03-content-pipeline.md'), 'utf8');
    expect(pipeline).not.toContain('the rock-module and *Beautiful* wish-list songs');
    expect(pipeline).toContain("the pieces wanted by name (the owner's requests and the *Beautiful* suggestions)");
  });
});

// The import row itself, through the catalogue path every screen reads, carries the provenance the words need.
describe('the catalogue row carries what the state line reads', () => {
  it('importToCatalogItem keeps the provenance, the demands and the measurement', async () => {
    const stored = await addImport(fakeFile('left-hand-first.mid', new Uint8Array(readFileSync(join(FIXTURES, 'left-hand-first.mid')))));
    const item = importToCatalogItem(stored);
    expect(importSourceWords(item)).toBe('converted from MIDI');
    expect(importStateWords(item)).toBe('measured · tempo guessed');
  });
});

// G96a, the reviewer's required change on G96 (`docs/review/responses/48bfc167.md`): a PDF's Details said
// *The app guessed this level from the music itself — change it if it feels wrong.* and *Type: song*. The
// app reads no notes from a PDF and never estimates its level (`estimateLevelFor` runs on MusicXML only):
// its `≈ L5.0` is the import's default, marked estimated (`importToCatalogItem`), and `song` is the type
// every import's catalogue row carries. The rows here come through the real store and catalogue path.
describe('a PDF’s Details says what its provenance holds: an estimated level and a PDF (G96a)', () => {
  const GUESSED = 'The app guessed this level from the music itself — change it if it feels wrong.';
  const ESTIMATED = 'Estimated level — change it if it feels wrong.';
  const pdfFile = (): File => fakeFile('two-systems.pdf', new Uint8Array(readFileSync(join(FIXTURES, 'two-systems.pdf'))));

  /** The Details sheet of the row with this id, opened by the row's own button, as a learner opens it. */
  async function detailsOf(section: HTMLElement, id: string): Promise<HTMLElement> {
    const row = await vi.waitFor(() => {
      const found = section.querySelector(`[data-item="${id}"]`);
      expect(found).not.toBeNull();
      return found as HTMLElement;
    });
    ([...row.querySelectorAll('button')].find((button) => button.textContent === 'Details') as HTMLButtonElement).click();
    return document.getElementById('library-detail') as HTMLElement;
  }
  /** The value beside one term of the sheet's facts. */
  const fact = (sheet: HTMLElement, term: string): string | null | undefined =>
    [...sheet.querySelectorAll('dt')].find((one) => one.textContent === term)?.nextElementSibling?.textContent;

  /** A PDF imported through the Library's picker, and its Details. */
  async function pdfDetails(): Promise<HTMLElement> {
    const section = await mount();
    pick(section, [pdfFile()]);
    return detailsOf(section, 'import.two-systems');
  }

  it('a PDF with no level: the level is estimated, never guessed from the music', async () => {
    const sheet = await pdfDetails();
    expect(fact(sheet, 'Level')).toBe('≈ L5.0');
    expect(sheet.textContent).not.toContain('The app guessed this level');
    expect(sheet.textContent).toContain(ESTIMATED);
  });

  it('a PDF: its type reads PDF, never song', async () => {
    const sheet = await pdfDetails();
    expect(fact(sheet, 'Type')).toBe('PDF');
  });

  it('where the app did estimate from the notes the sentence stays; a PDF level the learner judged says neither', async () => {
    const scored = await addImport(fakeFile('test-tune.musicxml', readFileSync(join(FIXTURES, 'test-tune.musicxml'), 'utf8')));
    // What the import sheet saves when the learner keeps the estimate (`assignSheet`): the estimator's
    // number, read from the notes, marked estimated.
    await updateImport(scored.id, { level: 2.4, levelSource: 'estimated' });
    const pdf = await addImport(pdfFile());
    await updateImport(pdf.id, { level: 4, levelSource: 'judged' });
    const section = await mount();

    const estimated = await detailsOf(section, scored.id);
    expect(estimated.textContent).toContain(GUESSED);
    expect(estimated.textContent).not.toContain(ESTIMATED);
    (document.getElementById('library-detail-close') as HTMLButtonElement).click();
    expect(document.getElementById('library-detail')).toBeNull();

    const judged = await detailsOf(section, pdf.id);
    expect(fact(judged, 'Level')).toBe('L4.0');
    expect(judged.textContent).not.toContain('change it if it feels wrong');
  });
});
