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
  CONVERTER_STAMPS,
  converterStampOf,
  getImport,
  importSummaries,
  importToCatalogItem,
  measurementDue,
  measureStoredImports,
  MIDI_CONVERTER_VERSION,
  onImportsChange,
  stateImportTempo,
  withMeasurement,
  type ImportMeasurement,
} from '../../src/data/importStore';
import { fingerprintOf, MEASURING_DEFINITIONS, measuringFingerprint } from '../../src/data/measuringFingerprint';
import { openDatabase, type ImportRow } from '../../src/data/db';
import { eligibleFor } from '../../src/curriculum/eligibility';
import type { Curriculum } from '../../src/curriculum/types';
import { demandsLine, openAssignSheet } from '../../src/ui/assignSheet';
import { clearFakeIndexedDb, fakeFile, useFakeIndexedDb } from './helpers/idb';
import { installTextMeasurer } from './helpers/scoreCatalog';

const FIXTURES = join(process.cwd(), 'tests', 'fixtures', 'imports');
/** The app's measuring fingerprint (E40), as a row measured under the current definitions carries it. */
const FINGERPRINT = measuringFingerprint();

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

/**
 * E42: the MusicXML door reads a converter's stamp where the converter's format names it in the encoding
 * block — hands and key `inferred`, the converter named — from a table of stamps, each read off a file that
 * converter wrote. Where the block names no converter it recognises (MuseScore's own name, which its
 * exports carry whether a person engraved the score or its MIDI import made it; music21's alone; nothing),
 * `authored` stays and the provenance says what the block names and that the door does not know whether an
 * edition or a converter from MIDI wrote the staves. Nothing is ever read up from `inferred` to `authored`.
 */
describe('other converters’ stamps, and what the door does not know (E42)', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    installTextMeasurer();
  });
  afterEach(() => clearFakeIndexedDb());

  const withSoftware = (xml: string, ...software: string[]): string =>
    xml.replace(/<identification>[\s\S]*?<\/identification>/, '').replace(/(<score-partwise[^>]*>)/, `$1<identification><encoding>${software.map((one) => `<software>${one}</software>`).join('')}<encoding-date>2026-09-01</encoding-date></encoding></identification>`);

  it('every recognised stamp is read off a file its converter wrote, and names what it converted from', () => {
    const stamped = readFileSync(join(FIXTURES, 'stamped-by-the-converter.musicxml'), 'utf8');
    expect(converterStampOf(stamped)).toEqual({ name: 'tools/midi-cleanup/midi_to_musicxml.py', version: 1 });
    expect(CONVERTER_STAMPS.map((one) => one.from)).toEqual(['a MIDI file']);
    for (const stamp of CONVERTER_STAMPS) {
      expect([...stamped.matchAll(/<software>([^<]*)<\/software>/g)].some((match) => stamp.pattern.test(match[1] ?? '')), stamp.from).toBe(true);
    }
  });

  it('a file whose encoding block names only an engraver or a toolkit keeps its staves and signature authored, and says the door does not know', async () => {
    const tune = readFileSync(join(FIXTURES, 'test-tune.musicxml'), 'utf8');
    const muse = await addImport(fakeFile('muse.musicxml', withSoftware(tune, 'MuseScore 3.6.2')));
    expect(muse.provenance?.converter).toBeUndefined();
    expect(muse.provenance?.facts.hands?.kind).toBe('authored');
    expect(muse.provenance?.facts.hands?.via).toBe('the file’s staves — its encoding block names MuseScore 3.6.2, none a converter the app recognises: the door does not know whether an edition or a converter from MIDI wrote them');
    expect(muse.provenance?.facts.key?.kind).toBe('authored');
    expect(muse.provenance?.facts.key?.via).toMatch(/^the file’s signature — its encoding block names MuseScore 3\.6\.2, .*the door does not know/);
    // The command-line converter's output from before it stamped itself: music21's name alone.
    const older = await addImport(fakeFile('converted-from-midi.musicxml', readFileSync(join(FIXTURES, 'converted-from-midi.musicxml'), 'utf8')));
    expect(older.provenance?.facts.hands?.kind).toBe('authored');
    expect(older.provenance?.facts.hands?.via).toMatch(/names music21 v\.10\.5\.0, none a converter the app recognises: the door does not know/);
  });

  it('a file whose encoding block names nothing says so', async () => {
    const plain = await addImport(fakeFile('test-tune.musicxml', readFileSync(join(FIXTURES, 'test-tune.musicxml'), 'utf8')));
    expect(plain.provenance?.facts.hands).toEqual({
      kind: 'authored',
      via: 'the file’s staves — its encoding block names no software: the door does not know whether an edition or a converter from MIDI wrote them',
    });
  });

  it('never reads a converter’s inferred staves up to authored when the score is measured again', async () => {
    const stamped = await addImport(fakeFile('stamped-by-the-converter.musicxml', readFileSync(join(FIXTURES, 'stamped-by-the-converter.musicxml'), 'utf8')));
    expect(stamped.provenance?.facts.hands?.kind).toBe('inferred');
    const again = withMeasurement(stamped, { demands: ['interval.step'], measurement: { status: 'measured', definitions: 3, located: {}, bars: 1, steps: 1, notes: 1, established: [] } }, MIDI_CONVERTER_VERSION, FINGERPRINT);
    expect([again.provenance?.facts.hands?.kind, again.provenance?.facts.key?.kind]).toEqual(['inferred', 'inferred']);
    // A score stored before E0 claims no hands or key unless a stamp says whose they are — MuseScore's name says neither.
    const bare = { ...stamped, data: withSoftware(readFileSync(join(FIXTURES, 'test-tune.musicxml'), 'utf8'), 'MuseScore 3.6.2') };
    delete (bare as Partial<ImportRow>).provenance;
    const measuredLater = withMeasurement(bare, { demands: ['interval.step'], measurement: { status: 'measured', definitions: 3, located: {}, bars: 1, steps: 1, notes: 1, established: [] } }, MIDI_CONVERTER_VERSION, FINGERPRINT);
    expect(measuredLater.provenance?.facts.hands).toBeUndefined();
    expect(measuredLater.provenance?.facts.key).toBeUndefined();
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

/**
 * E32: a metronome mark the file prints only as text — MuseScore writes a staff text's note glyph as a
 * private-use character of its text font, or drops it (Wabash Blues prints "= 120") — is read at import:
 * the `<sound tempo>` or `<metronome>` where the file has one, else the text, its glyph mapped (a quarter
 * where the glyph is missing and the metre's beat is a quarter or a half). The mark becomes the score's
 * tempo (a `<sound tempo>` in its own direction, which the player reads), the tempo fact says where it was
 * read, and the tempo-sensitive demands are not listed untrusted. Where no mark is read, nothing changes.
 */
describe('an import reads a metronome mark printed as text (E32)', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    installTextMeasurer();
  });
  afterEach(() => clearFakeIndexedDb());

  /** The eighth-note tune with one direction in bar 1, in the time given. */
  function marked(direction: string, beats = 4, beatType = 4): string {
    return eighths(false)
      .replace('<beats>4</beats><beat-type>4</beat-type>', `<beats>${String(beats)}</beats><beat-type>${String(beatType)}</beat-type>`)
      .replace('</attributes>', `</attributes>${direction}`);
  }
  const words = (text: string, attributes = ''): string =>
    `<direction placement="above"><direction-type><words${attributes}>${text}</words></direction-type></direction>`;
  /** The tempo the player gets from the stored score: the model's first tempo, as the Score screen reads it. */
  async function playedBpm(xml: string): Promise<number | undefined> {
    const [{ OpenSheetMusicDisplay }, { extractScoreModel }] = await Promise.all([import('opensheetmusicdisplay'), import('../../src/score/extractScoreModel')]);
    const osmd = new OpenSheetMusicDisplay(document.createElement('div'), { autoResize: false });
    await osmd.load(xml);
    return extractScoreModel(osmd, { id: 'probe', defaultBpm: 1, musicXml: xml }).tempoMap[0]?.bpm;
  }

  it('reads the Wabash Blues shape — "= 120", the note glyph missing — as a quarter at 120, the score’s tempo', async () => {
    const row = await addImport(fakeFile('wabash.musicxml', marked(words(' = 120', ' enclosure="rectangle" font-family="MuseJazz" font-style="italic"'))));
    // A <sound tempo> beside the mark's direction, in the measure, where the engraver reads it (inside a words
    // direction it reads none); the mark itself is printed as it was.
    expect(row.data).toMatch(/<words[^>]*> = 120<\/words><\/direction-type><\/direction><sound tempo="120"\/>/);
    expect(await playedBpm(row.data as string)).toBe(120);
    expect(row.provenance?.facts.tempo).toMatchObject({ kind: 'authored' });
    expect(row.provenance?.facts.tempo?.via).toMatch(/printed in the file as text.*= 120.*glyph missing.*a quarter/);
    expect(row.provenance?.facts.demands?.untrusted).toBeUndefined();
  });

  it('reads the note glyph where the file writes it as the MuseScore text font’s private-use character', async () => {
    const quarter = await addImport(fakeFile('quarter.musicxml', marked(words('\uECA5 = 132'))));
    expect(quarter.data).toContain('<sound tempo="132"/>');
    expect(quarter.provenance?.facts.tempo?.via).toMatch(/printed in the file as text.*♩ = 132/);
    expect(quarter.provenance?.facts.tempo?.via).not.toMatch(/glyph missing/);
    const eighth = await addImport(fakeFile('eighth.musicxml', marked(words('\uECA7 = 120'))));
    expect(eighth.data).toContain('<sound tempo="60"/>');
    const dotted = await addImport(fakeFile('dotted.musicxml', marked(words('\uECA5\uECB7 = 80'))));
    expect(dotted.data).toContain('<sound tempo="120"/>');
    const half = await addImport(fakeFile('half.musicxml', marked(words('= 60'), 2, 2)));
    expect(half.data).toContain('<sound tempo="120"/>');
  });

  it('leaves a file with a tempo of its own as it is, and reads nothing it cannot tell', async () => {
    // A <metronome> alone, and a <sound tempo>: the file's own tempo, the bytes untouched.
    const metronome = marked('<direction><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>72</per-minute></metronome></direction-type></direction>' + words('= 120'));
    const kept = await addImport(fakeFile('metronome.musicxml', metronome));
    expect(kept.data).toBe(metronome);
    expect(kept.provenance?.facts.tempo).toMatchObject({ kind: 'authored', via: 'the file' });
    // A glyph missing in a compound metre (a dotted quarter or an eighth?), a tempo word, a number that is not a mark: not read.
    for (const [name, xml] of [
      ['compound.musicxml', marked(words('= 120'), 6, 8)],
      ['word.musicxml', marked(words('Allegro'))],
      ['bar.musicxml', marked(words('bars 1 = 12'))],
    ] as const) {
      const row = await addImport(fakeFile(name, xml));
      expect(row.data, name).toBe(xml);
      expect(row.provenance?.facts.tempo?.kind, name).toBe('inferred');
      expect(row.provenance?.facts.demands?.untrusted, name).toEqual(expect.arrayContaining(['rhythm.eighths']));
    }
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
  // Measured since E0 under the definitions in force (E40 writes the fingerprint beside the version; a row
  // measured before E40 carries none and is due once — the E40 block below holds that case).
  const UNDER = { kind: 'measured' as const, via: 'app/src/data/importStore.ts', value: `${String(CURRENT)};${FINGERPRINT}` };
  const measuredProvenance = (over: Partial<NonNullable<ImportRow['provenance']>> = {}): NonNullable<ImportRow['provenance']> => ({
    source: 'imported-midi',
    edition: null,
    converter: { name: 'app/src/import/midi/convert.ts', version: 1 },
    facts: {
      demands: { kind: 'measured', via: 'app/src/demands/detect.ts' },
      hands: { kind: 'inferred', via: 'the converter split one line by the shape of its voices' },
      tempo: { kind: 'authored', via: 'the file’s tempo map' },
      measuredUnder: UNDER,
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
          measuredUnder: UNDER,
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
    expect(before.provenance?.facts.measuredUnder?.value).toBe(`${String(CURRENT)};${FINGERPRINT}`);
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
    expect(row.provenance?.facts.measuredUnder?.value).toBe(`${String(next)};${FINGERPRINT}`);
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
    expect(corrected.provenance?.facts.measuredUnder, "the job wrote nothing: the fixture's own stamp stands").toEqual(UNDER);
  });
});

/**
 * E40, E41: the app's measuring fingerprint — the detectors, the model they read, the vocabulary, the
 * density file and the engraver's release (`data/measuringFingerprint.ts`) — is written into
 * `facts.measuredUnder` beside the converter version whenever the detectors measure a score, and the
 * launch re-measures a stored import measured under other definitions (E40), or under none (E0's and
 * E2's code), and one whose file states no tempo that carries no `untrusted` list (E41) — each once, not
 * twice; a PDF, never handed to the detectors, is not retried when only the definitions move.
 */
describe('the measuring fingerprint and the untrusted list, on the launch (E40, E41)', () => {
  const CURRENT = MIDI_CONVERTER_VERSION;
  const SCORE = '<score-partwise version="3.1"><part-list/><part id="P1"/></score-partwise>';
  const EIGHTHS = '<score-partwise version="3.1"><!-- eighths, no tempo --><part-list/><part id="P1"/></score-partwise>';
  const readings = new Map<string, ImportMeasurement>([
    [SCORE, { demands: ['interval.step'], measurement: { status: 'measured', definitions: 3, located: { 'interval.step': 12 }, bars: 4, steps: 16, notes: 16, established: ['interval.step'] } }],
    [EIGHTHS, { demands: ['rhythm.eighths', 'interval.step'], measurement: { status: 'measured', definitions: 3, located: { 'rhythm.eighths': 32, 'interval.step': 28 }, bars: 4, steps: 32, notes: 32, established: ['rhythm.eighths', 'interval.step'] } }],
  ]);
  const measured: string[] = [];
  const measure = (xml: string, id: string): Promise<ImportMeasurement> => {
    measured.push(id);
    return Promise.resolve(readings.get(xml) as ImportMeasurement);
  };
  const under = (value: string): NonNullable<ImportRow['provenance']>['facts'][string] => ({ kind: 'measured', via: 'app/src/data/importStore.ts', value });
  const provenance = (facts: NonNullable<ImportRow['provenance']>['facts']): NonNullable<ImportRow['provenance']> => ({
    source: 'imported-musicxml',
    edition: null,
    facts: { hands: { kind: 'authored', via: 'the file’s staves' }, tempo: { kind: 'authored', via: 'the file' }, ...facts },
    review: { score: null, teaching: null },
  });
  const row = (id: string, over: Partial<ImportRow>): ImportRow => ({ id, kind: 'musicxml', title: id, data: SCORE, tags: [], addedAt: '2026-09-20T08:00:00.000Z', ...readings.get(SCORE), ...over });
  const rows: ImportRow[] = [
    // Measured under the definitions in force: not due.
    row('import.current', { provenance: provenance({ demands: { kind: 'measured', via: 'app/src/demands/detect.ts' }, measuredUnder: under(`${String(CURRENT)};${FINGERPRINT}`) }) }),
    // Measured under other definitions (a detector, the density file or the vocabulary moved since).
    row('import.old-definitions', { provenance: provenance({ demands: { kind: 'measured', via: 'app/src/demands/detect.ts' }, measuredUnder: under(`${String(CURRENT)};0123456789abcdef`) }) }),
    // Measured by E2's code: the converter version and no fingerprint.
    row('import.e2-measured', { provenance: provenance({ demands: { kind: 'measured', via: 'app/src/demands/detect.ts' }, measuredUnder: under(String(CURRENT)) }) }),
    // Measured by E0's code: no measuredUnder at all; the file states no tempo and the row lists nothing untrusted.
    row('import.e0-no-untrusted', {
      data: EIGHTHS,
      ...readings.get(EIGHTHS),
      provenance: provenance({ demands: { kind: 'measured', via: 'app/src/demands/detect.ts' }, tempo: { kind: 'inferred', via: 'no tempo in the file: the app’s default' } }),
    }),
    // Under the current fingerprint, yet no untrusted list under an inferred tempo (E41's own rule).
    row('import.current-no-untrusted', {
      data: EIGHTHS,
      ...readings.get(EIGHTHS),
      provenance: provenance({
        demands: { kind: 'measured', via: 'app/src/demands/detect.ts' },
        tempo: { kind: 'inferred', via: 'no tempo in the file: the app’s default' },
        measuredUnder: under(`${String(CURRENT)};${FINGERPRINT}`),
      }),
    }),
    // A PDF: its verdict written with the version; the definitions never decide it.
    row('import.pdf', {
      kind: 'pdf',
      data: new ArrayBuffer(8),
      demands: 'unmeasured',
      measurement: { status: 'unmeasured', reason: 'a PDF: the app reads no notes from it' },
      provenance: { source: 'imported-pdf', edition: null, facts: { demands: { kind: 'unmeasured', why: 'a PDF: the app reads no notes from it' }, measuredUnder: { kind: 'unmeasured', via: 'app/src/data/importStore.ts', value: String(CURRENT) } }, review: { score: null, teaching: null } },
    }),
  ];

  beforeEach(async () => {
    useFakeIndexedDb();
    measured.length = 0;
    const db = await openDatabase();
    for (const one of rows) await db?.put('imports', one);
  });
  afterEach(() => clearFakeIndexedDb());

  it('says which rows are due and why', async () => {
    const due = Object.fromEntries((await importSummaries()).map((one) => [one.id, measurementDue(one, CURRENT, FINGERPRINT) ?? 'not due']));
    expect(due).toEqual({
      'import.current': 'not due',
      'import.old-definitions': 'definitions',
      'import.e2-measured': 'definitions',
      'import.e0-no-untrusted': 'definitions',
      'import.current-no-untrusted': 'untrusted',
      'import.pdf': 'not due',
    });
  });

  it('measures each once, writes the fingerprint beside the version and the untrusted list, and a second launch measures nothing', async () => {
    await measureStoredImports({ measure, current: CURRENT, fingerprint: FINGERPRINT });
    expect(measured.sort()).toEqual(['import.current-no-untrusted', 'import.e0-no-untrusted', 'import.e2-measured', 'import.old-definitions']);
    for (const id of ['import.old-definitions', 'import.e2-measured', 'import.e0-no-untrusted', 'import.current-no-untrusted']) {
      expect((await getImport(id))?.provenance?.facts.measuredUnder?.value, id).toBe(`${String(CURRENT)};${FINGERPRINT}`);
    }
    for (const id of ['import.e0-no-untrusted', 'import.current-no-untrusted']) {
      expect((await getImport(id))?.provenance?.facts.demands?.untrusted, id).toEqual(['rhythm.eighths']);
    }
    expect((await getImport('import.pdf'))?.provenance?.facts.measuredUnder?.value).toBe(String(CURRENT));
    measured.length = 0;
    await measureStoredImports({ measure, current: CURRENT, fingerprint: FINGERPRINT });
    expect(measured).toEqual([]);
  });

  it('re-measures every measured row once when the definitions move, and never hands the PDF to the detectors', async () => {
    await measureStoredImports({ measure, current: CURRENT, fingerprint: FINGERPRINT });
    measured.length = 0;
    const moved = 'fedcba9876543210';
    await measureStoredImports({ measure, current: CURRENT, fingerprint: moved });
    expect(measured.sort()).toEqual(['import.current', 'import.current-no-untrusted', 'import.e0-no-untrusted', 'import.e2-measured', 'import.old-definitions']);
    expect((await getImport('import.current'))?.provenance?.facts.measuredUnder?.value).toBe(`${String(CURRENT)};${moved}`);
    measured.length = 0;
    await measureStoredImports({ measure, current: CURRENT, fingerprint: moved });
    expect(measured).toEqual([]);
  });

  it('computes the app’s own fingerprint when none is handed in', async () => {
    await measureStoredImports({ measure, current: CURRENT });
    expect((await getImport('import.e2-measured'))?.provenance?.facts.measuredUnder?.value).toBe(`${String(CURRENT)};${FINGERPRINT}`);
  });

  it('the fingerprint moves with any file it covers, and covers every build definition the app’s measurement reads (appFingerprintCoversTheBuilds)', () => {
    expect(FINGERPRINT).toMatch(/^[0-9a-f]{16}$/);
    expect(fingerprintOf(MEASURING_DEFINITIONS)).toBe(FINGERPRINT);
    for (const [index, [path]] of MEASURING_DEFINITIONS.entries()) {
      const touched = MEASURING_DEFINITIONS.map(([p, text], i) => [p, i === index ? `${text} ` : text] as const);
      expect(fingerprintOf(touched), path).not.toBe(FINGERPRINT);
    }
    // Line endings never move it (a Windows checkout and CI's agree).
    const lf = (text: string): string => text.replace(/\r\n/g, '\n');
    expect(fingerprintOf(MEASURING_DEFINITIONS.map(([p, text]) => [p, lf(text).replace(/\n/g, '\r\n')] as const))).toBe(FINGERPRINT);
    expect(fingerprintOf(MEASURING_DEFINITIONS.map(([p, text]) => [p, lf(text)] as const))).toBe(FINGERPRINT);
    // The build's own list (`demands.DEFINITION_FILES`), read from its source: each file the app's measurement
    // reads is covered; the build's harness spec and its lockfile have the app's own stand-ins (the engraver's release).
    const demandsPy = readFileSync(join(process.cwd(), '..', 'tools', 'content', 'demands.py'), 'utf8');
    const block = /DEFINITION_FILES = \(([\s\S]*?)\)/.exec(demandsPy)?.[1] ?? '';
    const buildFiles = [...block.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
    expect(buildFiles.length).toBeGreaterThan(0);
    const standIns = new Set(['app/tests/unit/demandsOfFiles.test.ts', 'app/package-lock.json']);
    const covered = new Set(MEASURING_DEFINITIONS.map(([path]) => path));
    expect(buildFiles.filter((file) => !standIns.has(file ?? '') && !covered.has(file ?? ''))).toEqual([]);
    expect(covered.has('content/sources/opportunity-density.json')).toBe(true);
  });
});

/**
 * E48 (the reviewer's decision on the X3 brief, `responses/ef80e86.md` question 1): the learner states an
 * import's tempo through one store operation, which owns the whole mutation — the stated tempo written into
 * the stored score (the player reads it), the tempo fact `authored` with the learner named as its source,
 * the score measured again under it, `measuredUnder` written, only the `untrusted` entries the stated tempo
 * resolves cleared — and a launch measurement that began before it never writes over it.
 */
describe('the learner states an import’s tempo (E48)', () => {
  beforeEach(() => {
    useFakeIndexedDb();
    installTextMeasurer();
  });
  afterEach(() => clearFakeIndexedDb());

  async function playedBpm(xml: string): Promise<number | undefined> {
    const [{ OpenSheetMusicDisplay }, { extractScoreModel }] = await Promise.all([import('opensheetmusicdisplay'), import('../../src/score/extractScoreModel')]);
    const osmd = new OpenSheetMusicDisplay(document.createElement('div'), { autoResize: false });
    await osmd.load(xml);
    return extractScoreModel(osmd, { id: 'probe', defaultBpm: 1, musicXml: xml }).tempoMap[0]?.bpm;
  }
  const NOW = new Date('2026-09-29T10:00:00.000Z');

  it('writes the stated tempo into the score, names the learner, measures again and clears the untrusted list', async () => {
    const bare = await addImport(fakeFile('bare.musicxml', eighths(false)));
    expect(bare.provenance?.facts.demands?.untrusted).toEqual(['rhythm.eighths', 'rhythm.shorter-than-quarter']);
    const stated = (await stateImportTempo(bare.id, 100, NOW)) as ImportRow;
    expect(await playedBpm(stated.data as string)).toBe(100);
    expect(stated.provenance?.facts.tempo).toEqual({ kind: 'authored', via: 'the learner’s stated tempo, 100 quarter notes a minute, 2026-09-29' });
    expect(stated.provenance?.facts.demands?.kind).toBe('measured');
    expect(stated.provenance?.facts.demands?.untrusted).toBeUndefined();
    expect(stated.measurement?.status).toBe('measured');
    expect(stated.demands).toEqual(bare.demands);
    expect(stated.provenance?.facts.measuredUnder?.value).toBe(`${String(MIDI_CONVERTER_VERSION)};${FINGERPRINT}`);
    // Stored, and what the Library reads.
    expect((await getImport(bare.id))?.provenance?.facts.tempo?.kind).toBe('authored');
    // Everything else on the row is as it was: the hands, the title, the rung.
    expect(stated.provenance?.facts.hands).toEqual(bare.provenance?.facts.hands);
    expect(stated.title).toBe(bare.title);
  });

  it('replaces a tempo the file states, the printed mark with it', async () => {
    const timed = await addImport(fakeFile('timed.musicxml', eighths(true)));
    expect(await playedBpm(timed.data as string)).toBe(80);
    const stated = (await stateImportTempo(timed.id, 66, NOW)) as ImportRow;
    expect(await playedBpm(stated.data as string)).toBe(66);
    expect(stated.data).toContain('<per-minute>66</per-minute>');
    expect(stated.data).not.toContain('<per-minute>80</per-minute>');
  });

  it('clears only the untrusted entries the stated tempo resolves', async () => {
    const bare = await addImport(fakeFile('bare.musicxml', eighths(false)));
    const db = await openDatabase();
    const stored = (await db?.get('imports', bare.id)) as ImportRow;
    const facts = stored.provenance?.facts ?? {};
    // An entry a tempo cannot resolve (not tempo-sensitive), on a demand the notes still carry.
    await db?.put('imports', { ...stored, provenance: { ...(stored.provenance as NonNullable<ImportRow['provenance']>), facts: { ...facts, demands: { ...facts.demands, kind: 'measured', untrusted: ['rhythm.eighths', 'interval.step'] } } } });
    const stated = (await stateImportTempo(bare.id, 100, NOW)) as ImportRow;
    expect(stated.provenance?.facts.demands?.untrusted).toEqual(['interval.step']);
  });

  it('is never written over by a launch measurement that began before it', async () => {
    const bare = await addImport(fakeFile('bare.musicxml', eighths(false)));
    const db = await openDatabase();
    const stored = (await db?.get('imports', bare.id)) as ImportRow;
    // Due for the launch: measured under other definitions.
    await db?.put('imports', { ...stored, provenance: { ...(stored.provenance as NonNullable<ImportRow['provenance']>), facts: { ...stored.provenance?.facts, measuredUnder: { kind: 'measured', via: 'x', value: '1;0123456789abcdef' } } } });
    const racing = async (_xml: string, id: string): Promise<ImportMeasurement> => {
      // The learner states the tempo while the launch measures the old score…
      await stateImportTempo(id, 90, NOW);
      return { demands: ['interval.step'], measurement: { status: 'measured', definitions: 3, located: { 'interval.step': 1 }, bars: 4, steps: 4, notes: 4, established: [] } };
    };
    await measureStoredImports({ measure: racing, fingerprint: FINGERPRINT });
    const after = (await getImport(bare.id)) as ImportRow;
    // …and the learner's statement stands: its score, its tempo fact, its measurement.
    expect(await playedBpm(after.data as string)).toBe(90);
    expect(after.provenance?.facts.tempo?.via).toMatch(/learner’s stated tempo, 90/);
    expect(after.demands).toEqual(bare.demands);
  });

  it('refuses what it cannot state: no such score, a PDF, a tempo no piece is played at', async () => {
    expect(await stateImportTempo('import.nothing', 100, NOW)).toBeUndefined();
    const db = await openDatabase();
    await db?.put('imports', { id: 'import.pdf', kind: 'pdf', title: 'pdf', data: new ArrayBuffer(8), tags: [], addedAt: '2026-09-20T08:00:00.000Z' });
    expect(await stateImportTempo('import.pdf', 100, NOW)).toBeUndefined();
    const bare = await addImport(fakeFile('bare.musicxml', eighths(false)));
    await expect(stateImportTempo(bare.id, 5, NOW)).rejects.toThrow(/between 20 and 400/);
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
