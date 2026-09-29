// @vitest-environment jsdom
/**
 * The import workflow's store side (E2 item 4; E25, E26, E21).
 *
 * - **Each converter names its version.** The app's converter owns `MIDI_CONVERTER_VERSION`
 *   (`import/midi/convert.ts`), which the store re-exports and writes as `converter: { name,
 *   version }`; the command-line converter writes its own into the MusicXML it emits, and an
 *   import of that file reads it back — read here off a file the command-line converter wrote
 *   (`fixtures/imports/stamped-by-the-converter.musicxml`, `tools/midi-cleanup`'s own test holds
 *   the writer's side).
 * - **An import is a candidate like any other** (item 4d): where its file states no tempo, the
 *   tempo-sensitive demands measured on it are listed untrusted, as the build lists a bundled
 *   row's (`docs/03` §4a), so the one gate marks them (E0's `untrusted`).
 * - **Measured once, on the next launch** (E25): a fixture store with a score imported before E0,
 *   a measured MIDI import, a corrected import, a PDF and an unreadable score, measured through the
 *   store's own path — each due row once, not twice; a row converted by an older converter
 *   measured again once, still naming the converter that wrote its notes; a correction and its
 *   provenance kept; an unmeasurable PDF not tried again under the same version (the reviewer's
 *   constraint, `responses/12af708.md`).
 * - **The assign sheet shows the measured truth**, and assignment stays what T52 made it.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MIDI_CONVERTER_VERSION as FROM_THE_CONVERTER } from '../../src/import/midi/convert';
import {
  addImport,
  getImport,
  importSummaries,
  importToCatalogItem,
  measurementDue,
  measureStoredImports,
  MIDI_CONVERTER_VERSION,
  onImportsChange,
  type ImportMeasurement,
} from '../../src/data/importStore';
import { openDatabase, type ImportRow } from '../../src/data/db';
import { eligibleFor } from '../../src/curriculum/eligibility';
import type { Curriculum } from '../../src/curriculum/types';
import { demandsLine, openAssignSheet } from '../../src/ui/assignSheet';
import { clearFakeIndexedDb, fakeFile, useFakeIndexedDb } from './helpers/idb';
import { installTextMeasurer } from './helpers/scoreCatalog';

const FIXTURES = join(process.cwd(), 'tests', 'fixtures', 'imports');

/** A four-bar tune in eighth notes on one staff, with or without a tempo of its own. */
function eighths(withTempo: boolean): string {
  const note = (step: string): string => `<note><pitch><step>${step}</step><octave>4</octave></pitch><duration>1</duration><type>eighth</type></note>`;
  const bar = (n: number): string =>
    `<measure number="${String(n)}">` +
    (n === 1
      ? '<attributes><divisions>2</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>' +
        (withTempo ? '<direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>80</per-minute></metronome></direction-type><sound tempo="80"/></direction>' : '')
      : '') +
    ['C', 'D', 'E', 'F', 'G', 'F', 'E', 'D'].map(note).join('') +
    '</measure>';
  return `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><work><work-title>Eighths</work-title></work><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1">${[1, 2, 3, 4].map(bar).join('')}</part></score-partwise>`;
}

describe('each converter names its version, and the provenance reads it (E26)', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    installTextMeasurer();
  });
  afterEach(() => clearFakeIndexedDb());

  it('the app’s converter owns its version; the store re-exports the same constant', () => {
    expect(FROM_THE_CONVERTER).toBe(MIDI_CONVERTER_VERSION);
    expect(Number.isInteger(FROM_THE_CONVERTER) && FROM_THE_CONVERTER >= 1).toBe(true);
  });

  it('a MIDI file converted in the app names the app’s converter and its version', async () => {
    const row = await addImport(fakeFile('two-hands.mid', new Uint8Array(readFileSync(join(FIXTURES, 'two-hands.mid')))));
    expect(row.provenance?.source).toBe('imported-midi');
    expect(row.provenance?.converter).toEqual({ name: 'app/src/import/midi/convert.ts', version: FROM_THE_CONVERTER });
  });

  it('a MusicXML file the command-line converter wrote names that converter and its version, and says its hands and key were inferred', async () => {
    const xml = readFileSync(join(FIXTURES, 'stamped-by-the-converter.musicxml'), 'utf8');
    const row = await addImport(fakeFile('stamped-by-the-converter.musicxml', xml));
    expect(row.provenance?.source).toBe('imported-musicxml');
    expect(row.provenance?.converter).toEqual({ name: 'tools/midi-cleanup/midi_to_musicxml.py', version: 1 });
    expect(row.provenance?.facts.hands?.kind).toBe('inferred');
    expect(row.provenance?.facts.key?.kind).toBe('inferred');
    // A MusicXML file from anywhere else keeps its staves and signature as its own.
    const plain = await addImport(fakeFile('test-tune.musicxml', readFileSync(join(FIXTURES, 'test-tune.musicxml'), 'utf8')));
    expect(plain.provenance?.converter).toBeUndefined();
    expect(plain.provenance?.facts.hands?.kind).toBe('authored');
  });
});

describe('an import is a candidate like any other: its inferred tempo marks its tempo-sensitive demands (item 4d)', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    installTextMeasurer();
  });
  afterEach(() => clearFakeIndexedDb());

  it('lists them untrusted where the file states no tempo, and the gate says so; a file with a tempo trusts them', async () => {
    const bare = await addImport(fakeFile('bare.musicxml', eighths(false)));
    expect(bare.measurement?.status, JSON.stringify(bare.measurement)).toBe('measured');
    expect(bare.demands).toEqual(expect.arrayContaining(['rhythm.eighths']));
    expect(bare.provenance?.facts.tempo?.kind).toBe('inferred');
    expect(bare.provenance?.facts.demands?.untrusted).toEqual(['rhythm.eighths', 'rhythm.shorter-than-quarter']);
    expect(eligibleFor(importToCatalogItem(bare), { taught: () => true }, { for: 'demand', demand: 'rhythm.eighths' })).toMatchObject({
      verdict: 'eligible',
      untrusted: ['rhythm.eighths', 'rhythm.shorter-than-quarter'],
    });

    const timed = await addImport(fakeFile('timed.musicxml', eighths(true)));
    expect(timed.provenance?.facts.tempo?.kind).toBe('authored');
    expect(timed.provenance?.facts.demands?.untrusted).toBeUndefined();
  });
});

describe('the stored imports measured once on the next launch (E25), through the store', () => {
  const CURRENT = MIDI_CONVERTER_VERSION;
  const SCORE = '<score-partwise version="3.1"><part-list/><part id="P1"/></score-partwise>';
  const CORRECTED = '<score-partwise version="3.1"><!-- the learner moved the falling bars back to the right hand --><part-list/><part id="P1"/></score-partwise>';
  /** What the detectors say of each file, by its bytes: the measurement the job is handed. */
  const readings = new Map<string, ImportMeasurement>([
    [SCORE, { demands: ['interval.step', 'clef.bass'], measurement: { status: 'measured', definitions: 3, located: { 'interval.step': 12, 'clef.bass': 4 }, bars: 4, steps: 16, notes: 16, established: ['interval.step'] } }],
    [CORRECTED, { demands: ['interval.step'], measurement: { status: 'measured', definitions: 3, located: { 'interval.step': 12 }, bars: 4, steps: 16, notes: 16, established: ['interval.step'] } }],
    ['<unreadable/>', { demands: 'unmeasured', measurement: { status: 'unmeasured', reason: 'the app could not read the score’s notes (Error: no parts)' } }],
  ]);
  const measured: string[] = [];
  const measure = (xml: string, id: string): Promise<ImportMeasurement> => {
    measured.push(id);
    return Promise.resolve(readings.get(xml) ?? { demands: 'unmeasured', measurement: { status: 'unmeasured', reason: 'the score could not be read here: no document to parse it in' } });
  };
  const at = '2026-09-20T08:00:00.000Z';
  const base = (id: string, over: Partial<ImportRow>): ImportRow => ({ id, kind: 'musicxml', title: id, data: SCORE, tags: [], addedAt: at, ...over });
  const measuredProvenance = (over: Partial<NonNullable<ImportRow['provenance']>> = {}): NonNullable<ImportRow['provenance']> => ({
    source: 'imported-midi',
    edition: null,
    converter: { name: 'app/src/import/midi/convert.ts', version: 1 },
    facts: {
      demands: { kind: 'measured', via: 'app/src/demands/detect.ts' },
      hands: { kind: 'inferred', via: 'the converter split one line by the shape of its voices' },
      tempo: { kind: 'authored', via: 'the file’s tempo map' },
    },
    review: { score: null, teaching: null },
    ...over,
  });
  const rows: ImportRow[] = [
    // Imported before E0: nothing measured, no provenance.
    base('import.before-e0', { lessonIds: ['1.3'], level: 2.5, levelSource: 'estimated' }),
    // Converted by the app's converter since E0, measured then.
    base('import.midi-measured', { ...readings.get(SCORE), provenance: measuredProvenance() }),
    // Corrected by the learner: the stored score is theirs, and the provenance says so.
    base('import.corrected', {
      data: CORRECTED,
      level: 3,
      levelSource: 'judged',
      ...readings.get(CORRECTED),
      provenance: measuredProvenance({
        facts: {
          demands: { kind: 'measured', via: 'app/src/demands/detect.ts, on the corrected score' },
          hands: { kind: 'authored', via: 'the learner’s correction, 2026-09-25' },
          tempo: { kind: 'authored', via: 'the file’s tempo map' },
        },
      }),
    }),
    // A PDF imported before E0, and one imported since.
    base('import.pdf-before-e0', { kind: 'pdf', data: new ArrayBuffer(8) }),
    base('import.pdf-since-e0', {
      kind: 'pdf',
      data: new ArrayBuffer(8),
      demands: 'unmeasured',
      measurement: { status: 'unmeasured', reason: 'a PDF: the app reads no notes from it' },
      provenance: { source: 'imported-pdf', edition: null, facts: { demands: { kind: 'unmeasured', why: 'a PDF: the app reads no notes from it' } }, review: { score: null, teaching: null } },
    }),
    // A score the app could not read at import.
    base('import.unreadable', {
      data: '<unreadable/>',
      ...readings.get('<unreadable/>'),
      provenance: { source: 'imported-musicxml', edition: null, facts: { demands: { kind: 'unmeasured', why: 'the app could not read the score’s notes (Error: no parts)' } }, review: { score: null, teaching: null } },
    }),
    // Measured where there was no document to parse it in (a reason that no longer holds in the page);
    // the test's detectors have no document for it either, so each launch tries it and learns nothing.
    base('import.no-document', {
      data: '<needs-a-document/>',
      demands: 'unmeasured',
      measurement: { status: 'unmeasured', reason: 'the score could not be read here: no document to parse it in' },
      provenance: { source: 'imported-musicxml', edition: null, facts: { demands: { kind: 'unmeasured', why: 'the score could not be read here: no document to parse it in' } }, review: { score: null, teaching: null } },
    }),
  ];

  beforeEach(async () => {
    useFakeIndexedDb();
    measured.length = 0;
    const db = await openDatabase();
    for (const row of rows) await db?.put('imports', row);
  });
  afterEach(() => clearFakeIndexedDb());

  it('says which rows are due and why, before anything is measured', async () => {
    const due = Object.fromEntries((await importSummaries()).map((row) => [row.id, measurementDue(row, CURRENT) ?? 'not due']));
    expect(due).toEqual({
      'import.before-e0': 'never-measured',
      'import.midi-measured': 'not due',
      'import.corrected': 'not due',
      'import.pdf-before-e0': 'never-measured',
      'import.pdf-since-e0': 'not due',
      'import.unreadable': 'not due',
      'import.no-document': 'unreadable-here',
    });
  });

  it('measures each due row once and writes it through the store; a second launch measures nothing; the screens hear of it once', async () => {
    const heard = vi.fn();
    const stop = onImportsChange(heard);
    const first = await measureStoredImports({ measure, current: CURRENT });
    // The PDF is never handed to the detectors: its verdict is the PDF's, written with the version.
    expect(measured.sort()).toEqual(['import.before-e0', 'import.no-document']);
    expect(first).toMatchObject({ state: 'done', measured: 1, unmeasurable: 1, pending: 1 });
    expect(heard).toHaveBeenCalledTimes(1);

    const before = (await getImport('import.before-e0')) as ImportRow;
    expect(before.demands).toEqual(['interval.step', 'clef.bass']);
    expect(before.measurement?.status).toBe('measured');
    expect(before.provenance?.facts.demands).toMatchObject({ kind: 'measured' });
    expect(before.provenance?.facts.measuredUnder?.value).toBe(String(CURRENT));
    // What was on the row stays: its rung, its level and where the level came from.
    expect([before.lessonIds, before.level, before.levelSource]).toEqual([['1.3'], 2.5, 'estimated']);
    // The door it came through is not on the row, so its hands and key are claimed by nobody.
    expect(before.provenance?.facts.hands).toBeUndefined();
    expect(before.provenance?.facts.key).toBeUndefined();
    // The screens read the measured truth: the summaries the Library reads were dropped and read again.
    expect((await importSummaries()).find((row) => row.id === 'import.before-e0')?.demands).toEqual(['interval.step', 'clef.bass']);

    const pdf = (await getImport('import.pdf-before-e0')) as ImportRow;
    expect(pdf.demands).toBe('unmeasured');
    expect(pdf.provenance?.facts.measuredUnder).toMatchObject({ kind: 'unmeasured', value: String(CURRENT) });

    measured.length = 0;
    heard.mockClear();
    const second = await measureStoredImports({ measure, current: CURRENT });
    // Only the row that was unreadable here is tried again, and nothing is written for it.
    expect(measured).toEqual(['import.no-document']);
    expect(second).toMatchObject({ measured: 0, unmeasurable: 0 });
    expect(heard).not.toHaveBeenCalled();
    stop();
  });

  it('never tries an unmeasurable PDF or an unreadable score again under the same version, and tries each once when the version moves', async () => {
    await measureStoredImports({ measure, current: CURRENT });
    const next = CURRENT + 1;
    measured.length = 0;
    const moved = await measureStoredImports({ measure, current: next });
    // The unreadable score is tried again (the PDFs are not handed to the detectors at all), with
    // the rows the older converter wrote (the next case) and the one unreadable here.
    expect(measured.sort()).toEqual(['import.corrected', 'import.midi-measured', 'import.no-document', 'import.unreadable']);
    expect(moved.unmeasurable).toBe(3);
    for (const id of ['import.pdf-before-e0', 'import.pdf-since-e0', 'import.unreadable']) {
      expect((await getImport(id))?.provenance?.facts.measuredUnder?.value, id).toBe(String(next));
    }
    measured.length = 0;
    await measureStoredImports({ measure, current: next });
    expect(measured).toEqual(['import.no-document']);
  });

  it('measures a row converted by an older converter once, on the stored score, and it goes on naming the converter that wrote its notes', async () => {
    const next = CURRENT + 1;
    const due = await importSummaries();
    expect(measurementDue(due.find((row) => row.id === 'import.midi-measured') as ImportRow, next)).toBe('converter');
    await measureStoredImports({ measure, current: next });
    expect(measured).toContain('import.midi-measured');
    const row = (await getImport('import.midi-measured')) as ImportRow;
    expect(row.provenance?.converter).toEqual({ name: 'app/src/import/midi/convert.ts', version: 1 });
    expect(row.provenance?.facts.measuredUnder?.value).toBe(String(next));
    measured.length = 0;
    await measureStoredImports({ measure, current: next });
    expect(measured).not.toContain('import.midi-measured');
  });

  it('keeps a corrected import’s score, its correction provenance and its judged level when it is measured again', async () => {
    const next = CURRENT + 1;
    await measureStoredImports({ measure, current: next });
    expect(measured).toContain('import.corrected');
    const row = (await getImport('import.corrected')) as ImportRow;
    expect(row.data).toBe(CORRECTED);
    expect(row.demands).toEqual(['interval.step']);
    expect(row.provenance?.facts.hands).toEqual({ kind: 'authored', via: 'the learner’s correction, 2026-09-25' });
    expect(row.provenance?.facts.demands?.via).toBe('app/src/demands/detect.ts, on the corrected score');
    expect([row.level, row.levelSource]).toEqual([3, 'judged']);
  });

  it('writes nothing over a row whose score changed while it was being measured, and nothing over an assignment saved meanwhile', async () => {
    const db = await openDatabase();
    const racing = async (xml: string, id: string): Promise<ImportMeasurement> => {
      const now = (await db?.get('imports', id)) as ImportRow;
      // The learner saves the assign sheet (a rung) while the old score is measured…
      await db?.put('imports', { ...now, lessonIds: ['2.1'] });
      return measure(xml, id);
    };
    await measureStoredImports({ measure: racing, current: CURRENT });
    const assigned = (await getImport('import.before-e0')) as ImportRow;
    expect(assigned.lessonIds).toEqual(['2.1']);
    expect(assigned.demands).toEqual(['interval.step', 'clef.bass']);

    // …and a correction lands while another row is measured: the correction's own measurement stands.
    const correcting = async (xml: string, id: string): Promise<ImportMeasurement> => {
      const now = (await db?.get('imports', id)) as ImportRow;
      await db?.put('imports', { ...now, data: CORRECTED, demands: ['interval.step'] });
      return measure(xml, id);
    };
    await measureStoredImports({ measure: correcting, current: CURRENT + 1 });
    const corrected = (await getImport('import.midi-measured')) as ImportRow;
    expect(corrected.data).toBe(CORRECTED);
    expect(corrected.provenance?.facts.measuredUnder).toBeUndefined();
  });
});

describe('the assign sheet shows the measured truth (E21, E25)', () => {
  const CURRICULUM: Curriculum = { version: 1, tracks: [], stages: [] };
  const row = (over: Partial<ImportRow>): ImportRow => ({ id: 'import.x', kind: 'musicxml', title: 'X', data: '', tags: [], addedAt: '2026-09-20T08:00:00.000Z', ...over });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('names what the app read in the notes, in the swap sheet’s words, or why nothing was read', () => {
    expect(demandsLine(row({ demands: ['interval.step', 'interval.skip', 'texture.hands-together'], measurement: { status: 'measured', definitions: 3, located: {}, bars: 4, steps: 4, notes: 4, established: [] } }))).toBe(
      'Measured in the notes: steps, skips and both hands together.',
    );
    expect(demandsLine(row({ demands: ['rhythm.eighths', 'rhythm.shorter-than-quarter'], measurement: { status: 'measured', definitions: 3, located: {}, bars: 4, steps: 4, notes: 4, established: [] } }))).toBe(
      'Measured in the notes: the eighth notes.',
    );
    // A reading the app knows to be wrong on this file (the detectors' clef assumption) is not said as measured.
    expect(
      demandsLine(
        row({
          demands: ['pitch.ledger', 'interval.step'],
          measurement: {
            status: 'measured',
            definitions: 3,
            located: {},
            bars: 4,
            steps: 4,
            notes: 4,
            established: ['interval.step'],
            misread: { demands: ['clef.bass', 'pitch.ledger'], why: 'one staff in the bass clef' },
          },
        }),
      ),
    ).toBe('Measured in the notes: steps. The app misreads this file’s clef, so its bass-staff and ledger-line notes are left out.');
    expect(demandsLine(row({}))).toBe('Not measured yet: the app measures it in the background.');
    expect(demandsLine(row({ kind: 'pdf', demands: 'unmeasured', measurement: { status: 'unmeasured', reason: 'a PDF: the app reads no notes from it' } }))).toBe(
      'A PDF: the app reads no notes from it, so nothing is measured.',
    );
    expect(demandsLine(row({ demands: 'unmeasured', measurement: { status: 'unmeasured', reason: 'the app could not read the score’s notes (Error: no parts)' } }))).toBe(
      'The app could not measure its notes (the app could not read the score’s notes (Error: no parts)).',
    );
  });

  it('draws the line on the sheet, and the sheet still says assignment is an option, never progress (T52)', () => {
    const sheet = openAssignSheet(row({ demands: ['interval.step'], measurement: { status: 'measured', definitions: 3, located: {}, bars: 4, steps: 4, notes: 4, established: ['interval.step'] } }), CURRICULUM);
    expect(document.querySelector('#assign-demands')?.textContent).toBe('Measured in the notes: steps.');
    expect(sheet.body.textContent).toContain('qualifying practice can count toward that rung’s requirements');
    expect(sheet.body.textContent).not.toMatch(/counts? towards? finishing/i);
  });
});
