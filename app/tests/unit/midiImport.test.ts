/**
 * A MIDI file picked from the app itself (T29 part 4).
 *
 * The owner, 2026-09-22: "ideally I could select a file from the app." Nothing
 * runs on a server, so the whole conversion happens here — this is the door it
 * comes through, from the file the picker offers to the row the Library lists
 * and the note the assign sheet shows before he agrees to any of it.
 *
 * The fixture is `tests/fixtures/imports/two-hands.mid`, four bars of C major
 * written byte by byte by the script beside it, with **a track per hand** —
 * which is what a file downloaded from the web carries, and which the
 * converter therefore keeps as recorded rather than deciding the hands for
 * itself. The rule itself, and the fixture that can tell it from the
 * voice-leading split, are `midiHands.test.ts`.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  IMPORT_ACCEPT,
  ImportError,
  addImport,
  conversionFor,
  forgetAddedSinceLoadForTest,
  forgetConversionsForTest,
  importsAddedSinceLoad,
  kindForFilename,
} from '../../src/data/importStore';
import { clearFakeIndexedDb, fakeFile, useFakeIndexedDb } from './helpers/idb';

const FIXTURES = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'fixtures',
  'imports',
);
const TWO_HANDS = new Uint8Array(readFileSync(path.join(FIXTURES, 'two-hands.mid')));

beforeEach(() => {
  useFakeIndexedDb();
  forgetAddedSinceLoadForTest();
  forgetConversionsForTest();
});

describe('the picker', () => {
  it('offers .mid and .midi beside the score formats', () => {
    for (const extension of ['.mid', '.midi', '.musicxml', '.mxl', '.pdf']) {
      expect(IMPORT_ACCEPT.split(',')).toContain(extension);
    }
  });

  it('knows a MIDI file by either spelling of its extension', () => {
    expect(kindForFilename('practice.mid')).toBe('midi');
    expect(kindForFilename('practice.midi')).toBe('midi');
  });
});

describe('importing a MIDI file', () => {
  it('stores the MusicXML the converter wrote, as a score like any other', async () => {
    const row = await addImport(fakeFile('two-hands.mid', TWO_HANDS));
    expect(row.kind).toBe('musicxml');
    // `my-piece_2.mid` reads as `my piece 2`; a title is what the Library lists
    // the row under.
    expect(row.title).toBe('two hands');
    // A score is text; a PDF import is an ArrayBuffer, and reading one as the
    // other is how an import ends up unreadable.
    expect(typeof row.data).toBe('string');
    const xml = row.data as string;
    expect(xml).toContain('<score-partwise');
    // One instrument on two staves, which is what a piano is. Two parts would
    // be two instruments and the app reads the hand off the printed staff.
    expect(xml).toContain('<staves>2</staves>');
    expect(xml.match(/<score-part /g)).toHaveLength(1);
  });

  it('is in the Library at once, as anything added in this visit is', async () => {
    const row = await addImport(fakeFile('two-hands.mid', TWO_HANDS));
    expect(importsAddedSinceLoad().has(row.id)).toBe(true);
  });

  it('leaves a note saying what the converter decided', async () => {
    const row = await addImport(fakeFile('two-hands.mid', TWO_HANDS));
    const note = conversionFor(row.id);
    expect(note).toBeDefined();
    expect(note?.passed).toBe(true);
    // The self-check's own sentence: every note the reader found is in the
    // score and every bar adds up.
    expect(note?.check).toMatch(/^Checked: all \d+ notes/);
    expect(note?.check).toContain('every bar adds up');
    // Sixteen is the fixture's own number — eleven right-hand notes and five
    // left, counted in the script that writes it — not a measurement of this
    // machine, and a converter that dropped one would fail here.
    expect(note?.report.notesIn).toBe(16);
    expect(note?.report.lost).toEqual([]);
    expect(note?.report.added).toEqual([]);
    expect(note?.report.brokenBars).toEqual([]);
  });

  it('keeps the two tracks the file was written with as the two hands', async () => {
    const row = await addImport(fakeFile('two-hands.mid', TWO_HANDS));
    const report = conversionFor(row.id)?.report;
    expect(report?.noteTracks).toBe(2);
    expect(report?.noteTrackNames).toEqual(['Right hand', 'Left hand']);
    // Two note tracks are an arrangement someone gave hands to, so the app
    // keeps them: first track the upper staff, second the lower. That this
    // fixture's tracks happen to be what the split would also produce is why
    // `midiHands.test.ts` uses a crossed one to tell the two rules apart.
    expect(report?.hands).toBe('2 as recorded');
    expect(report?.parts).toEqual(['Right hand', 'Left hand']);
  });

  it('says on the sheet that the hands came from the file, not from the app', async () => {
    const row = await addImport(fakeFile('two-hands.mid', TWO_HANDS));
    const note = conversionFor(row.id);
    expect(note?.hands).toContain('kept as recorded');
    expect(note?.hands).toContain('the arrangement’s own answer');
    expect(note?.hands).not.toContain('merged into one line first');
  });

  it('reads the metre and the tempo out of the file', async () => {
    const row = await addImport(fakeFile('two-hands.mid', TWO_HANDS));
    expect(conversionFor(row.id)?.report.timeSignature).toBe('4/4');
    const xml = row.data as string;
    expect(xml).toContain('<beats>4</beats>');
    expect(xml).toContain('<sound tempo=');
  });

  it('says what is wrong with a MIDI file that has no notes in it', async () => {
    // A tempo map and nothing else: a real export mistake, and the sentence
    // has to say what to do about it rather than leaving an empty score.
    const header = [0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 1, 0, 1, 1, 0xe0];
    const track = [
      0x4d, 0x54, 0x72, 0x6b, 0, 0, 0, 0x0b,
      0x00, 0xff, 0x51, 0x03, 0x07, 0xa1, 0x20,
      0x00, 0xff, 0x2f, 0x00,
    ];
    const bytes = new Uint8Array([...header, ...track]);
    await expect(addImport(fakeFile('silent.mid', bytes))).rejects.toThrow(ImportError);
    await expect(addImport(fakeFile('silent.mid', bytes))).rejects.toThrow(
      /silent\.mid: this MIDI file has no notes in it/,
    );
    await expect(addImport(fakeFile('silent.mid', bytes))).rejects.toThrow(
      /Export it again with the piano part in it/,
    );
  });

  it('stores nothing when the conversion refuses the file', async () => {
    const bytes = new TextEncoder().encode('not a MIDI file at all');
    await expect(addImport(fakeFile('wrong.mid', bytes))).rejects.toThrow(ImportError);
    // Validation happens before the write, so a file that cannot be read never
    // becomes a row to delete by hand.
    expect(importsAddedSinceLoad().size).toBe(0);
    clearFakeIndexedDb();
  });
});
