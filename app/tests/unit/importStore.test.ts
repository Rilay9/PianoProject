/**
 * Importing the owner's own scores (docs/04 §4).
 *
 * The failure cases matter as much as the happy one: the spec asks for "one
 * sentence from the parser, not a stack trace", and a wrong sentence sends
 * someone to re-export a file that was fine.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { zipSync, strToU8 } from 'fflate';
import {
  ImportError,
  addImport,
  allImports,
  deleteImport,
  importIdFor,
  importToCatalogItem,
  kindForFilename,
  titleFromMusicXml,
  updateImport,
} from '../../src/data/importStore';
import { clearFakeIndexedDb, fakeFile, useFakeIndexedDb } from './helpers/idb';

const MUSICXML = `<?xml version="1.0"?>
<score-partwise version="4.0">
  <work><work-title>Prelude in C</work-title></work>
  <identification><creator type="composer">J. S. Bach</creator></identification>
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
  <part id="P1"><measure number="1"/></part>
</score-partwise>`;

function mxlBytes(): Uint8Array {
  return zipSync({
    'META-INF/container.xml':
      strToU8('<container><rootfiles><rootfile full-path="score.xml"/></rootfiles></container>'),
    'score.xml': strToU8(MUSICXML),
  });
}

/** A PDF header is all the importer checks, and all a viewer needs to try. */
function pdfBytes(): Uint8Array {
  return strToU8('%PDF-1.7\n1 0 obj\n<<>>\nendobj\ntrailer\n%%EOF\n');
}

beforeEach(() => {
  useFakeIndexedDb();
});

describe('kindForFilename', () => {
  it('recognises the three extensions the picker offers', () => {
    expect(kindForFilename('a.mxl')).toBe('musicxml');
    expect(kindForFilename('a.MusicXML')).toBe('musicxml');
    expect(kindForFilename('a.xml')).toBe('musicxml');
    expect(kindForFilename('a.pdf')).toBe('pdf');
  });

  it('rejects anything else', () => {
    expect(kindForFilename('a.mid')).toBeNull();
    expect(kindForFilename('a.png')).toBeNull();
    expect(kindForFilename('noextension')).toBeNull();
  });
});

describe('importIdFor', () => {
  it('slugs the title', () => {
    expect(importIdFor('Für Elise (easy)', new Set())).toBe('import.f-r-elise-easy');
  });

  it('never collides with an id already taken', () => {
    const taken = new Set(['import.prelude', 'import.prelude-2']);
    expect(importIdFor('Prelude', taken)).toBe('import.prelude-3');
  });

  it('falls back to a name when the title has no usable characters', () => {
    expect(importIdFor('***', new Set())).toBe('import.score');
  });
});

describe('titleFromMusicXml', () => {
  it('prefers <work-title>', () => {
    expect(titleFromMusicXml(MUSICXML, 'whatever.xml')).toBe('Prelude in C');
  });

  it('falls back to <credit-words>', () => {
    const xml = '<score-partwise><credit><credit-words>Moonlight</credit-words></credit></score-partwise>';
    expect(titleFromMusicXml(xml, 'x.xml')).toBe('Moonlight');
  });

  it('falls back to the filename without its extension', () => {
    expect(titleFromMusicXml('<score-partwise/>', 'my-piece.mxl')).toBe('my-piece');
  });
});

describe('addImport', () => {
  it('stores plain MusicXML with its title and composer', async () => {
    const row = await addImport(fakeFile('anything.musicxml', MUSICXML));
    expect(row.kind).toBe('musicxml');
    expect(row.title).toBe('Prelude in C');
    expect(row.tags).toEqual(['J. S. Bach']);
    expect(row.id).toBe('import.prelude-in-c');
    expect(row.data).toContain('score-partwise');
  });

  it('unpacks a .mxl archive', async () => {
    const row = await addImport(fakeFile('compressed.mxl', mxlBytes()));
    expect(row.kind).toBe('musicxml');
    expect(row.title).toBe('Prelude in C');
  });

  it('stores a PDF as bytes', async () => {
    const row = await addImport(fakeFile('Sonata.pdf', pdfBytes()));
    expect(row.kind).toBe('pdf');
    expect(row.title).toBe('Sonata');
    expect(row.data).toBeInstanceOf(ArrayBuffer);
  });

  it('rejects an unknown extension with a sentence naming the file', async () => {
    await expect(addImport(fakeFile('song.mid', 'x'))).rejects.toThrow(ImportError);
    await expect(addImport(fakeFile('song.mid', 'x'))).rejects.toThrow(/song\.mid is not a score/);
  });

  it('rejects a .pdf that is not a PDF', async () => {
    await expect(addImport(fakeFile('fake.pdf', 'hello'))).rejects.toThrow(/does not contain a PDF/);
  });

  it('rejects XML that is not MusicXML, and points at MuseScore', async () => {
    await expect(addImport(fakeFile('notes.xml', '<html><body>no</body></html>'))).rejects.toThrow(
      /does not look like MusicXML/,
    );
  });

  it('rejects an empty file', async () => {
    await expect(addImport(fakeFile('empty.mxl', new Uint8Array()))).rejects.toThrow(/is empty/);
  });

  it('says so rather than losing the file when there is no database', async () => {
    clearFakeIndexedDb();
    await expect(addImport(fakeFile('a.musicxml', MUSICXML))).rejects.toThrow(/not storing data/);
  });
});

describe('the imported library', () => {
  it('lists, edits and deletes', async () => {
    const row = await addImport(fakeFile('a.musicxml', MUSICXML));
    expect((await allImports()).map((r) => r.id)).toEqual([row.id]);

    const edited = await updateImport(row.id, { title: 'Renamed', level: 3.5, tags: ['jazz'] });
    expect(edited?.title).toBe('Renamed');
    expect(edited?.level).toBe(3.5);

    await deleteImport(row.id);
    expect(await allImports()).toEqual([]);
  });

  it('keeps corrected PDF cut lines with the item', async () => {
    const row = await addImport(fakeFile('b.pdf', pdfBytes()));
    await updateImport(row.id, { cuts: { 0: [100, 240, 380] } });
    const [stored] = await allImports();
    expect(stored?.cuts).toEqual({ 0: [100, 240, 380] });
  });
});

describe('importToCatalogItem', () => {
  it('marks the item imported, licensed to the user, and of its kind', () => {
    const item = importToCatalogItem({
      id: 'import.x',
      kind: 'pdf',
      title: 'X',
      data: new ArrayBuffer(1),
      tags: [],
      addedAt: '2026-09-05T00:00:00.000Z',
    });
    expect(item.imported).toBe(true);
    expect(item.kind).toBe('pdf');
    expect(item.source?.license).toBe('user-imported');
    expect(item.tracks).toEqual(['imported']);
  });

  it('defaults an unlabelled score above the beginner stages, not below them', () => {
    const item = importToCatalogItem({
      id: 'import.y',
      kind: 'musicxml',
      title: 'Y',
      data: '<score-partwise/>',
      tags: [],
      addedAt: '2026-09-05T00:00:00.000Z',
    });
    expect(item.level).toBe(5);
  });
});
