/**
 * Browsing a folder of scores on the phone (docs/04 §4b).
 *
 * The two things worth pinning down are the ones that would be silently wrong:
 * that a manifest is read by *field name* rather than by column position, so a
 * writer adding a column does not shift every title one to the left; and that
 * the folder's files decide what is listed, so a row can never be offered that
 * cannot then be added.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { zipSync, strToU8 } from 'fflate';
import {
  FolderError,
  MANIFEST_NAME,
  addFromFolder,
  connectForTest,
  disconnectForTest,
  folderNameOf,
  isScoreFile,
  looksUnnamed,
  parseManifest,
  readFolder,
  relativePath,
  titleFromFilename,
} from '../../src/data/folderLibrary';
import { allImports } from '../../src/data/importStore';
import { clearFakeIndexedDb, useFakeIndexedDb } from './helpers/idb';

const MUSICXML = `<?xml version="1.0"?>
<score-partwise version="4.0">
  <work><work-title>Untitled</work-title></work>
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1"><measure number="1"/></part>
</score-partwise>`;

function mxlNamed(xml: string): Uint8Array {
  return zipSync({
    'META-INF/container.xml':
      strToU8('<container><rootfiles><rootfile full-path="score.xml"/></rootfiles></container>'),
    'score.xml': strToU8(xml),
  });
}

function mxlBytes(): Uint8Array {
  return mxlNamed(MUSICXML);
}

/** A `File` that reports a `webkitRelativePath`, which the picker sets and we cannot. */
function folderFile(path: string, contents: string | Uint8Array): File {
  const bytes = typeof contents === 'string' ? new TextEncoder().encode(contents) : contents;
  const file = new File([bytes as BlobPart], path.slice(path.lastIndexOf('/') + 1));
  Object.defineProperty(file, 'webkitRelativePath', { value: path });
  return file;
}

function manifest(rows: unknown[], fields: string[]): string {
  return JSON.stringify({
    kind: 'pianopath-score-folder',
    version: 1,
    source: { name: 'PDMX' },
    fields,
    scores: rows,
  });
}

const FIELDS = [
  'file',
  'title',
  'composer',
  'level',
  'bars',
  'status',
  'style',
  'rating',
  'ratings',
  'views',
  'lyrics',
  'garbled',
  'museScore',
];

const ROW = ['bb/Qm1.mxl', 'Paddies Evermore', "Chief F. O'Neill", 3.3, 25, 'pd', 'folk-hymn-carol', 4.5, 12, 2100, 0, 0, '4702198'];

describe('reading a folder', () => {
  it('strips the picked folder name off every path', () => {
    expect(relativePath(folderFile('Library/bb/Qm1.mxl', 'x'))).toBe('bb/Qm1.mxl');
    expect(folderNameOf([folderFile('Library/bb/Qm1.mxl', 'x')])).toBe('Library');
  });

  it('knows a score file from anything else', () => {
    expect(isScoreFile('a.mxl')).toBe(true);
    expect(isScoreFile('A.MusicXML')).toBe(true);
    expect(isScoreFile('a.pdf')).toBe(false);
    expect(isScoreFile('library.json')).toBe(false);
  });

  it('makes a filename readable when there is nothing better', () => {
    expect(titleFromFilename('fur_elise-easy.mxl')).toBe('fur elise easy');
  });

  it('takes titles from the manifest', async () => {
    const library = await readFolder([
      folderFile(`Library/${MANIFEST_NAME}`, manifest([ROW], FIELDS)),
      folderFile('Library/bb/Qm1.mxl', mxlBytes()),
    ]);
    expect(library.id).toBe('Library');
    expect(library.source).toBe('PDMX');
    expect(library.scores).toHaveLength(1);
    expect(library.scores[0]?.title).toBe('Paddies Evermore');
    expect(library.scores[0]?.level).toBe(3.3);
    expect(library.scores[0]?.rating).toBe(4.5);
  });

  it('reads columns by name, so a new column shifts nothing', () => {
    // The same row with a column inserted in the middle: a positional reader
    // would put the composer in the level and the level in the bars.
    const fields = [...FIELDS];
    fields.splice(3, 0, 'arranger');
    const row = [...ROW];
    row.splice(3, 0, 'somebody');
    const { scores } = parseManifest(manifest([row], fields));
    expect(scores[0]?.composer).toBe("Chief F. O'Neill");
    expect(scores[0]?.level).toBe(3.3);
    expect(scores[0]?.bars).toBe(25);
  });

  it('refuses a manifest from a version it does not understand', () => {
    const text = JSON.stringify({ kind: 'pianopath-score-folder', version: 99, fields: [], scores: [] });
    expect(() => parseManifest(text)).toThrow(/version 99/);
  });

  it('refuses something that is not a manifest at all', () => {
    expect(() => parseManifest('{"kind":"shopping list"}')).toThrow(FolderError);
    expect(() => parseManifest('not json')).toThrow(/not valid JSON/);
  });

  it('lists a folder with no manifest, by filename', async () => {
    const library = await readFolder([folderFile('Mine/fur_elise.mxl', mxlBytes())]);
    expect(library.source).toBeNull();
    expect(library.scores[0]?.title).toBe('fur elise');
    expect(library.scores[0]?.level).toBeNull();
  });

  it('drops a manifest row whose file is not there', async () => {
    const gone = ['bb/missing.mxl', 'Not here', '', 1, 1, 'pd', 'classical', 0, 0, 0, 0, 0, ''];
    const library = await readFolder([
      folderFile(`Library/${MANIFEST_NAME}`, manifest([ROW, gone], FIELDS)),
      folderFile('Library/bb/Qm1.mxl', mxlBytes()),
    ]);
    expect(library.scores.map((s) => s.file)).toEqual(['bb/Qm1.mxl']);
  });

  it('keeps a file the manifest never mentioned', async () => {
    const library = await readFolder([
      folderFile(`Library/${MANIFEST_NAME}`, manifest([ROW], FIELDS)),
      folderFile('Library/bb/Qm1.mxl', mxlBytes()),
      folderFile('Library/my-own-arrangement.mxl', mxlBytes()),
    ]);
    expect(library.scores.map((s) => s.title).sort()).toEqual([
      'Paddies Evermore',
      'my own arrangement',
    ]);
  });

  it('knows a placeholder title from a real one', () => {
    expect(looksUnnamed('Untitled')).toBe(true);
    expect(looksUnnamed('  ')).toBe(true);
    expect(looksUnnamed('New Score')).toBe(true);
    expect(looksUnnamed('QmbyQiyHSuzfTXfQVM23iKUmNQEi3sCp9GiY1MKJtA4Szj')).toBe(true);
    expect(looksUnnamed('Untitled Ballad')).toBe(false);
    expect(looksUnnamed('Scores of Kilkenny')).toBe(false);
  });

  it('says so when the folder holds no scores', async () => {
    await expect(readFolder([folderFile('Photos/holiday.jpg', 'x')])).rejects.toThrow(/no MusicXML/);
  });
});

describe('adding one score out of a folder', () => {
  beforeEach(() => {
    useFakeIndexedDb();
  });

  it('falls back to the manifest title when the score has none of its own', async () => {
    const library = await readFolder([
      folderFile(`Library/${MANIFEST_NAME}`, manifest([ROW], FIELDS)),
      folderFile('Library/bb/Qm1.mxl', mxlBytes()),
    ]);
    const score = library.scores[0];
    expect(score).toBeDefined();
    const row = await addFromFolder(library.id, score!);
    // The file inside says `Untitled`, which is a placeholder and not a title.
    expect(row.title).toBe('Paddies Evermore');
    expect(row.level).toBe(3.3);
    expect(row.tags).toEqual(["Chief F. O'Neill"]);
    expect((await allImports()).map((r) => r.title)).toEqual(['Paddies Evermore']);
    clearFakeIndexedDb();
  });

  it("keeps the score's own title over the manifest's, which came through the CSV", async () => {
    const named = MUSICXML.replace('Untitled', 'Paddies Evermore (air)');
    const library = await readFolder([
      folderFile(`Library/${MANIFEST_NAME}`, manifest([ROW], FIELDS)),
      folderFile('Library/bb/Qm1.mxl', mxlNamed(named)),
    ]);
    const row = await addFromFolder(library.id, library.scores[0]!);
    expect(row.title).toBe('Paddies Evermore (air)');
    clearFakeIndexedDb();
  });

  it('never overwrites a real title with a mojibake one', async () => {
    const garbled = [...ROW];
    garbled[1] = 'PÃ¤ddies';
    garbled[11] = 1;
    const library = await readFolder([
      folderFile(`Library/${MANIFEST_NAME}`, manifest([garbled], FIELDS)),
      folderFile('Library/bb/Qm1.mxl', mxlBytes()),
    ]);
    const row = await addFromFolder(library.id, library.scores[0]!);
    expect(row.title).toBe('Untitled');
    clearFakeIndexedDb();
  });

  it('asks for the folder again rather than failing obscurely', async () => {
    const library = await readFolder([folderFile('Mine/fur_elise.mxl', mxlBytes())]);
    disconnectForTest(library.id);
    await expect(addFromFolder(library.id, library.scores[0]!)).rejects.toThrow(/pick the mine folder again/i);
    clearFakeIndexedDb();
  });

  it('says so when the listing has a score the folder no longer does', async () => {
    const library = await readFolder([folderFile('Mine/fur_elise.mxl', mxlBytes())]);
    connectForTest(library.id, new Map());
    await expect(addFromFolder(library.id, library.scores[0]!)).rejects.toThrow(/not in the folder/);
    clearFakeIndexedDb();
  });
});
