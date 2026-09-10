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
  FolderCancelled,
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
import { addedFiles, looksLikeUnnamedArchive } from '../../src/ui/screens/FolderScreen';
import type { FolderScore } from '../../src/data/db';
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

  it('finds the manifest one folder down, where the phone\'s unzip puts it', async () => {
    // Samsung's Extract makes `pianopath-library/pianopath-library/…`, and
    // the person picks the outer one: every path is a level off the manifest.
    const library = await readFolder([
      folderFile(`Outer/pianopath-library/${MANIFEST_NAME}`, manifest([ROW], FIELDS)),
      folderFile('Outer/pianopath-library/bb/Qm1.mxl', mxlBytes()),
    ]);
    expect(library.scores).toHaveLength(1);
    expect(library.scores[0]?.title).toBe('Paddies Evermore');
    // Where the file is, not where the manifest thought it was.
    expect(library.scores[0]?.file).toBe('pianopath-library/bb/Qm1.mxl');
  });

  it('matches a row by its filename when the folder was flattened', async () => {
    const library = await readFolder([
      folderFile(`Library/${MANIFEST_NAME}`, manifest([ROW], FIELDS)),
      folderFile('Library/Qm1.mxl', mxlBytes()),
    ]);
    expect(library.scores[0]?.title).toBe('Paddies Evermore');
    expect(library.scores[0]?.file).toBe('Qm1.mxl');
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

describe('which folder rows are already in the library (review C4)', () => {
  const score = (file: string, title: string): FolderScore => ({
    file,
    title,
    composer: 'Joplin',
    level: null,
    bars: null,
    status: 'pd',
    style: 'ragtime',
    rating: 0,
    ratings: 0,
    views: 0,
    lyrics: false,
    garbled: false,
    museScore: '',
  });

  const library = {
    id: 'pianopath-library',
    scores: [
      score('a/one.mxl', 'The Entertainer'),
      score('b/two.mxl', 'The Entertainer'),
      score('c/three.mxl', 'Maple Leaf Rag'),
    ],
  };

  it('greys out only the edition that was added', () => {
    // The bug: PDMX has six files called The Entertainer, and matching on the
    // title meant adding one made the other five unaddable.
    const added = addedFiles(
      [{ title: 'The Entertainer', origin: { folder: 'pianopath-library', file: 'a/one.mxl' } }],
      library,
    );
    expect([...added]).toEqual(['a/one.mxl']);
  });

  it('still matches by title for an import that came from a share or the picker', () => {
    const added = addedFiles([{ title: 'the entertainer' }], library);
    expect([...added].sort()).toEqual(['a/one.mxl', 'b/two.mxl']);
  });

  it('ignores an origin from a different folder', () => {
    const added = addedFiles(
      [{ title: 'Something else', origin: { folder: 'another-folder', file: 'a/one.mxl' } }],
      library,
    );
    expect([...added]).toEqual([]);
  });

  it('has nothing to say about an empty library', () => {
    expect([...addedFiles([], library)]).toEqual([]);
  });
});

describe('addFromFolder records where the file came from', () => {
  beforeEach(() => {
    useFakeIndexedDb();
  });

  it('stamps the folder and the file on the import', async () => {
    const library = await readFolder([folderFile('Mine/fur_elise.mxl', mxlBytes())]);
    const row = await addFromFolder(library.id, library.scores[0]!);
    expect(row.origin).toEqual({ folder: 'Mine', file: 'fur_elise.mxl' });
    // And it survives the trip through the store, which is what the folder
    // screen reads on its next visit.
    const stored = (await allImports()).find((candidate) => candidate.id === row.id);
    expect(stored?.origin).toEqual({ folder: 'Mine', file: 'fur_elise.mxl' });
    clearFakeIndexedDb();
  });
});

describe('adding from a listing stored by an older build ("Add" bugging out)', () => {
  beforeEach(() => {
    useFakeIndexedDb();
  });

  /**
   * `buildLibrary` writes `score.file` as the path the file is *actually*
   * at, but a listing saved by a build before that was true kept the
   * manifest's own copy of the path instead — and `reconnectFolder` always
   * rebuilds the connected files keyed by the real tree, so a straight
   * `files.get(score.file)` misses for exactly that stored shape. Before the
   * fallback in `addFromFolder`, this rejected with "is listed but is not in
   * the folder any more"; the fix trusts the filename (a content hash, unique
   * by construction) when the path itself does not match.
   */
  it('still adds the file by name when the stored path is not where the file actually is', async () => {
    const file = folderFile('Anything/nested/bb/Qm1.mxl', mxlBytes());
    connectForTest('mine', new Map([['nested/bb/Qm1.mxl', file]]));
    const staleRow: FolderScore = {
      file: 'bb/Qm1.mxl', // the manifest's own path — not `nested/bb/Qm1.mxl`
      title: 'Paddies Evermore',
      composer: "Chief F. O'Neill",
      level: 3.3,
      bars: 25,
      status: 'pd',
      style: 'folk-hymn-carol',
      rating: 4.5,
      ratings: 12,
      views: 2100,
      lyrics: false,
      garbled: false,
      museScore: '4702198',
    };
    const row = await addFromFolder('mine', staleRow);
    expect(row.title).toBe('Paddies Evermore');
    clearFakeIndexedDb();
  });

  it('still fails obscurely-but-honestly when more than one file shares that name', async () => {
    // The filename fallback is only safe while the name is unique — two
    // files of the same name is not the shape the fallback exists for, and
    // guessing between them would be worse than saying so.
    connectForTest(
      'mine',
      new Map([
        ['a/Qm1.mxl', folderFile('Anything/a/Qm1.mxl', 'x')],
        ['b/Qm1.mxl', folderFile('Anything/b/Qm1.mxl', 'x')],
      ]),
    );
    const staleRow: FolderScore = {
      file: 'somewhere-else/Qm1.mxl',
      title: 'Ambiguous',
      composer: '',
      level: null,
      bars: null,
      status: 'unknown',
      style: '',
      rating: 0,
      ratings: 0,
      views: 0,
      lyrics: false,
      garbled: false,
      museScore: '',
    };
    await expect(addFromFolder('mine', staleRow)).rejects.toThrow(/not in the folder/);
    clearFakeIndexedDb();
  });
});

describe('reading a folder shows progress and can be cancelled', () => {
  it('reports done/total as it works through the files, not only at the end', async () => {
    const files = Array.from({ length: 600 }, (_, i) => folderFile(`Big/${String(i)}.mxl`, 'x'));
    const calls: { done: number; total: number }[] = [];
    const library = await readFolder(files, {
      onProgress: (p) => calls.push({ done: p.done, total: p.total }),
    });
    expect(library.scores).toHaveLength(600);
    // One call per file is what makes "Reading 142 of 900" a real read-out
    // rather than a single call once everything is already done — a spinner
    // in disguise.
    expect(calls.length).toBeGreaterThanOrEqual(600);
    expect(new Set(calls.map((c) => c.done)).size).toBeGreaterThan(50);
    expect(calls[calls.length - 1]).toEqual({ done: 600, total: 600 });
  });

  it('a signal aborted before the read starts cancels it instead of finishing', async () => {
    const files = Array.from({ length: 10 }, (_, i) => folderFile(`Big/${String(i)}.mxl`, 'x'));
    const controller = new AbortController();
    controller.abort();
    await expect(readFolder(files, { signal: controller.signal })).rejects.toBeInstanceOf(FolderCancelled);
  });

  it('a signal aborted partway through stops the read before it finishes building the listing', async () => {
    // Large enough to cross a yield checkpoint, so the cancellation is
    // actually noticed mid-read rather than only at the very start.
    const files = Array.from({ length: 600 }, (_, i) => folderFile(`Big/${String(i)}.mxl`, 'x'));
    const controller = new AbortController();
    let seen = 0;
    await expect(
      readFolder(files, {
        signal: controller.signal,
        onProgress: (p) => {
          seen = p.done;
          if (p.done === 300) controller.abort();
        },
      }),
    ).rejects.toBeInstanceOf(FolderCancelled);
    expect(seen).toBeLessThan(600);
  });
});

describe('a stale listing looks like the archive with no library.json (looksLikeUnnamedArchive)', () => {
  // A real base58 CID never contains '0', 'O', 'I' or 'l' — using a letter
  // for the varying part keeps every generated title inside `looksUnnamed`'s
  // own pattern instead of accidentally testing something looser.
  const hash = (n: number): string => `Qm${'a'.repeat(43)}${String.fromCharCode(98 + n)}`;

  it('is true once most titles are content hashes', () => {
    const scores: FolderScore[] = Array.from({ length: 10 }, (_, i) => ({
      file: `${String(i)}.mxl`,
      title: i < 6 ? hash(i) : `Real Title ${String(i)}`,
      composer: '',
      level: null,
      bars: null,
      status: 'unknown',
      style: '',
      rating: 0,
      ratings: 0,
      views: 0,
      lyrics: false,
      garbled: false,
      museScore: '',
    }));
    expect(looksLikeUnnamedArchive(scores)).toBe(true);
  });

  it('is false for a folder of the owner\'s own scores with a stray untitled one', () => {
    const scores: FolderScore[] = Array.from({ length: 10 }, (_, i) => ({
      file: `${String(i)}.mxl`,
      title: i === 0 ? 'Untitled' : `My Piece ${String(i)}`,
      composer: '',
      level: null,
      bars: null,
      status: 'unknown',
      style: '',
      rating: 0,
      ratings: 0,
      views: 0,
      lyrics: false,
      garbled: false,
      museScore: '',
    }));
    expect(looksLikeUnnamedArchive(scores)).toBe(false);
  });

  it('has nothing to say about an empty listing', () => {
    expect(looksLikeUnnamedArchive([])).toBe(false);
  });
});
