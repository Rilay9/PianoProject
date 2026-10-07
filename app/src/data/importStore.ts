/**
 * The owner's own scores (docs/04 §4, P7 step 3).
 *
 * This is the escape hatch the bundled library needs: anything published after
 * 1930, anything the content pipeline could not fetch, anything he simply
 * bought. An imported file becomes a catalog item like any other — searchable,
 * playable, and (for MusicXML) judgeable in every follow mode — so the rest of
 * the app never has to know where a score came from.
 *
 * Two kinds, and the difference is not cosmetic:
 *   - **MusicXML/MXL** has notes. It is a first-class score.
 *   - **PDF** has pixels. It opens in the PDF viewer (`04` §5b), it can be
 *     followed by the clock or by tapping, and it can never be scored. The
 *     app says so on the card rather than greying out controls.
 *
 * Bad files fail with one sentence (`04` §4). The parser's own message is
 * usually a stack-trace fragment, so it is translated here.
 */
import { openDatabase, type ImportKind, type ImportRow } from './db';
import type { CatalogItem, Measurement, Provenance } from '../curriculum/types';
import { isMxl, toMusicXml } from '../score/mxl';
import { toPartwise } from '../score/toPartwise';
import {
  ConvertError,
  convertMidi,
  MIDI_CONVERTER_VERSION,
  titleFromFilename,
  type ConversionReport,
} from '../import/midi/convert';
import { MidiReadError } from '../import/midi/readMidi';
import { mapTextGlyphs, noteLengthInQuarters } from '../score/textGlyphs';
import densityJson from '../../../content/sources/opportunity-density.json';

/** docs/00 D19: this is a personal build, but a 100 MB PDF still helps nobody. */
export const MAX_IMPORT_BYTES = 64 * 1024 * 1024;

/**
 * What the file picker offers.
 *
 * `.mid` and `.midi` are here because the owner asked to pick a MIDI file from
 * the app (2026-09-22): nothing runs on a server, so the conversion the command
 * line did (`tools/midi-cleanup/midi_to_musicxml.py`) happens on the device
 * (`src/import/midi/`). What is stored is the MusicXML it writes, so everything
 * downstream — levelling, the Score screen, every follow mode - treats it as
 * the score it now is.
 */
export const IMPORT_ACCEPT = '.musicxml,.mxl,.xml,.mid,.midi,.pdf';

/** Every imported id starts with this, so an id alone says where to look. */
export const IMPORT_ID_PREFIX = 'import.';

export class ImportError extends Error {}

const listeners = new Set<() => void>();

/** The cached summaries, or `null` when they have to be read again. */
let summaries: Promise<ImportSummary[]> | null = null;

/**
 * The ids imported since this page was loaded.
 *
 * The owner added a score from the score folder, opened the Library, and did
 * not find it: it was there, at whatever position its level put it in a list
 * of two thousand ordered by level, which on his phone was several hundred
 * rows and eighteen presses of *Show 60 more* down. He read that as the score
 * needing a rung before it would appear. The Library's own import path had
 * always answered this for itself — importing a score is a thing you do in
 * order to play it, so it switches to newest-first — and the answer was tied
 * to that one button rather than to the fact. It is the fact now: anything
 * added while the app has been open, wherever it was added from, is what the
 * Library shows first the next time it is opened.
 *
 * Deliberately not persisted. "What I just added" is a thing about this
 * visit; a set written to storage would still be reordering the library
 * a week later, and the ordinary answer to "where is the score I added in
 * March" is the search box.
 */
const addedSinceLoad = new Set<string>();

/** What has been imported since the page was loaded, newest visit only. */
export function importsAddedSinceLoad(): ReadonlySet<string> {
  return addedSinceLoad;
}

/** Test hook: start again as a freshly loaded page would. */
export function forgetAddedSinceLoadForTest(): void {
  addedSinceLoad.clear();
}

export function onImportsChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/**
 * Says the imports have changed: drops the summary cache, then tells the app.
 *
 * Exported because `data/backup.ts` writes this store directly on a restore.
 * Before the cache that was a silent bug — a restore put rows in and no screen
 * redrew; with the cache it would have been a worse one, so the two are the
 * same call.
 */
export function importsChanged(): void {
  summaries = null;
  for (const listener of listeners) listener();
}

const notify = importsChanged;

/** `Fur Elise (2).mxl` -> `import.fur-elise-2`, uniquified against what exists. */
export function importIdFor(title: string, taken: ReadonlySet<string>): string {
  const slug =
    title
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'score';
  let id = `${IMPORT_ID_PREFIX}${slug}`;
  let n = 2;
  while (taken.has(id)) {
    id = `${IMPORT_ID_PREFIX}${slug}-${String(n)}`;
    n += 1;
  }
  return id;
}

/**
 * What a file is, by its name — which is not the same as what it is stored as.
 *
 * A `.mid` is converted on the way in and stored as `musicxml`, because that is
 * what it becomes; `midi` names the *door* it came through, and only
 * `addImport` needs to know.
 */
export type ImportFileKind = ImportKind | 'midi';

export function kindForFilename(name: string): ImportFileKind | null {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return 'pdf';
  if (lower.endsWith('.mid') || lower.endsWith('.midi')) return 'midi';
  if (lower.endsWith('.mxl') || lower.endsWith('.musicxml') || lower.endsWith('.xml')) {
    return 'musicxml';
  }
  return null;
}

/** What the converter decided about one imported MIDI file, and how to say it. */
export interface ConversionNote {
  report: ConversionReport;
  /** The self-check's answer, in a sentence. */
  check: string;
  /** What happened to the hands, in a sentence. */
  hands: string;
  /** True when nothing was lost, nothing added and every bar adds up. */
  passed: boolean;
}

/**
 * The conversion notes for the imports made in this visit, by id.
 *
 * **In memory on purpose.** This is what the assign sheet shows *before the
 * learner agrees to the import* — “here is what the app decided about your
 * file, do you still want it” — which is a fact about this moment and not
 * about the score. Writing it onto the row would mean a database version and a
 * field every other reader of `ImportRow` would have to ignore, for something
 * nothing reads tomorrow.
 */
const conversions = new Map<string, ConversionNote>();

export const conversionFor = (id: string): ConversionNote | undefined => conversions.get(id);

/** Test hook: forget this visit's conversion notes, as a reload would. */
export function forgetConversionsForTest(): void {
  conversions.clear();
}

/** The self-check's answer, in the words the tool itself prints. */
export function checkSentence(report: ConversionReport): string {
  if (report.passed) {
    return (
      `Checked: all ${String(report.notesIn)} notes the reader found are in the score, ` +
      'and every bar adds up.'
    );
  }
  const trouble: string[] = [];
  if (report.lost.length > 0) trouble.push(`${String(report.lost.length)} note(s) lost`);
  if (report.added.length > 0) trouble.push(`${String(report.added.length)} note(s) added`);
  if (report.brokenBars.length > 0) {
    trouble.push(`${String(report.brokenBars.length)} bar(s) that do not add up`);
  }
  if (report.unwritable.length > 0) {
    trouble.push(`${String(report.unwritable.length)} length(s) no note can carry`);
  }
  return (
    `The score was written, but the check found ${trouble.join(', ')}. ` +
    'Read it before trusting it, or convert the file with a different grid on the command line.'
  );
}

/**
 * What happened to the hands, in a sentence — and it has to be the true one.
 *
 * Two note tracks are **kept as recorded**, so the sentence says so and names
 * nothing about a split; one track is split, and three or more are merged and
 * then split. Saying "merged" over a file whose hands were kept would tell him
 * the app decided something it did not, and saying "kept" over a split would
 * hide the one decision he most needs to check.
 */
export function handsSentence(report: ConversionReport): string {
  const parts: string[] = [];
  if (report.hands !== 'split into two') {
    if (report.noteTracks === 2) {
      parts.push(
        `The file’s two tracks were kept as recorded: the first (${report.parts[0] ?? '?'}) ` +
          `is the upper staff, the second (${report.parts[1] ?? '?'}) the lower. ` +
          'Which hand plays what is the arrangement’s own answer, not one the app made.',
      );
    } else {
      parts.push(`The file’s own parts were kept as recorded: ${report.parts.join(', ')}.`);
    }
    return parts.join(' ');
  }
  if (report.noteTracks > 1) {
    parts.push(
      `The ${String(report.noteTracks)} tracks with notes in them ` +
        `(${report.noteTrackNames.join(', ')}) are more than a piano’s two staves, ` +
        'so they were merged into one line first.',
    );
  }
  const right = report.handMedian.right;
  const left = report.handMedian.left;
  parts.push(
    'The hands were split by the shape of the lines rather than at a fixed middle C' +
      (right !== undefined && left !== undefined
        ? `, and the right hand’s middle note sits ${String(right - left)} semitones above the left’s.`
        : '.'),
  );
  parts.push('A crossing of the hands is where this is most often wrong — check those bars.');
  return parts.join(' ');
}

/** `%PDF-` — the magic every PDF starts with. */
function isPdf(bytes: Uint8Array): boolean {
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
}

/**
 * Reads the title out of MusicXML so an import is not called `score-3.mxl`.
 *
 * `<work-title>` first (what the publisher meant), then the first
 * `<credit-words>` (what is printed at the top of the page), then the filename.
 * Regex rather than DOMParser because this also runs in Node tests.
 */
export function titleFromMusicXml(xml: string, fallback: string): string {
  const work = /<work-title>([^<]+)<\/work-title>/i.exec(xml)?.[1]?.trim();
  if (work) return work;
  const credit = /<credit-words[^>]*>([^<]+)<\/credit-words>/i.exec(xml)?.[1]?.trim();
  if (credit) return credit;
  return fallback.replace(/\.[a-z0-9]+$/i, '');
}

export function composerFromMusicXml(xml: string): string | null {
  const creator = /<creator\b[^>]*type="composer"[^>]*>([^<]+)<\/creator>/i.exec(xml)?.[1]?.trim();
  return creator ?? null;
}

/**
 * Every import **with its file in it**.
 *
 * There are two readers left for this and both of them want the bytes: the
 * storage report, which adds them up, and the backup, which writes them out.
 * Everything else — the Library list, the folder's already-added index, the
 * catalog overlay every screen loads — wants a title and a level, and calling
 * this for that reads every score on the phone out of IndexedDB to throw it
 * away again. Use `importSummaries` for those, and `getImport` for the one row
 * that is actually being opened.
 */
export async function allImports(): Promise<ImportRow[]> {
  const db = await openDatabase();
  const rows = (await db?.getAll('imports')) ?? [];
  return rows.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}

/**
 * How many bytes a stored file really is.
 *
 * `String.length` is UTF-16 code units, not bytes, and the storage report puts
 * its total beside `navigator.storage.estimate()`, which is bytes — so a score
 * full of accented composer names was under-reported against a real
 * measurement. Encoded rather than guessed at.
 */
export function byteSizeOf(data: string | ArrayBuffer): number {
  return typeof data === 'string' ? new TextEncoder().encode(data).length : data.byteLength;
}

/** An import without its file: everything a list, a filter or a badge needs. */
export type ImportSummary = Omit<ImportRow, 'data'>;

/**
 * The imports, newest first, without their contents — and read once.
 *
 * This is the answer to a fault of exactly the shape this app keeps finding:
 * work proportional to the whole collection on a path that only wants a name.
 * `allItems()` is loaded by Today, Plan, Library, Drill, the score screen and
 * the session builder, and each of those used to pull every imported file's
 * bytes out of IndexedDB — a MusicXML score is 50–200 KB, so a hundred pieces
 * added from the folder is 5–20 MB decoded and discarded on every screen the
 * owner opens. A test fixture with two imports in it cannot see that at all.
 *
 * Two halves to the fix. The rows come back stripped, so nothing downstream
 * holds a file it did not ask for; and the result is cached until something
 * writes to the store, so navigating between screens re-reads nothing. The
 * cache is the promise rather than the value, so two screens loading at once
 * share one read instead of racing to start two.
 */
export function importSummaries(): Promise<ImportSummary[]> {
  summaries ??= allImports().then((rows) =>
    rows.map(({ data, ...rest }) => ({
      ...rest,
      // Filled in here for a row written before `bytes` existed. This is the
      // one place the file is in hand anyway, so it costs nothing — and it
      // means the storage report never has to load a file to size it.
      bytes: rest.bytes ?? byteSizeOf(data),
    })),
  );
  return summaries;
}

/** Test hook: forget the cached summaries, as a fresh database would. */
export function resetImportCacheForTest(): void {
  summaries = null;
}

export async function getImport(id: string): Promise<ImportRow | undefined> {
  const db = await openDatabase();
  return db?.get('imports', id);
}

/**
 * The version of what the app's MIDI converter decides, stamped on an imported score's
 * provenance (E0; R35). The converter owns it since E2 (`import/midi/convert.ts`, E26);
 * re-exported here, where its callers have always found it.
 */
export { MIDI_CONVERTER_VERSION };

/** The app's converter, as an import's provenance names it. */
const APP_CONVERTER = 'app/src/import/midi/convert.ts';

/**
 * The converters whose MusicXML names them in its encoding block, and what each converted from (E26, E42):
 * a `<software>` line matching `pattern`, its first group the converter's name and its second the version.
 * An entry is added only for a stamp read off a file that converter wrote (`importMeasuredTruth.test.ts`
 * holds each against its fixture). The command-line converter writes
 * `<software>tools/midi-cleanup/midi_to_musicxml.py v.N</software>` beside music21's own. MuseScore is
 * not here: its exports name MuseScore whether a person engraved the score or its MIDI import made it,
 * so its name says nothing about whose the staves are (the raw PDMX exports name "MuseScore 3.6.2", a
 * `<source>` and nothing of an import).
 */
export const CONVERTER_STAMPS: readonly { pattern: RegExp; from: string }[] = [
  { pattern: /^\s*(\S*midi_to_musicxml\.py)\s+v\.(\d+)\s*$/, from: 'a MIDI file' },
];

/** Every `<software>` line of the file's encoding block, as written. */
function softwareOf(xml: string): string[] {
  const encoding = /<encoding>([\s\S]*?)<\/encoding>/.exec(xml)?.[1] ?? '';
  return [...encoding.matchAll(/<software>([^<]*)<\/software>/g)].map((match) => (match[1] ?? '').trim()).filter((one) => one.length > 0);
}

/** The recognised converter a file names, with what it converted from; `undefined` for none. */
function recognisedConverterOf(xml: string): { name: string; version: number; from: string } | undefined {
  for (const line of softwareOf(xml)) {
    for (const stamp of CONVERTER_STAMPS) {
      const match = stamp.pattern.exec(line);
      if (match?.[1] && match[2]) return { name: match[1], version: Number(match[2]), from: stamp.from };
    }
  }
  return undefined;
}

/**
 * The converter a MusicXML file names in its encoding block (`CONVERTER_STAMPS`), read back so an import of
 * its output names the converter and the version that inferred its hands and key; `undefined` for a file
 * that names none the app recognises.
 */
export function converterStampOf(xml: string): { name: string; version: number } | undefined {
  const found = recognisedConverterOf(xml);
  return found ? { name: found.name, version: found.version } : undefined;
}

/**
 * What a MusicXML file's encoding block says of whose its staves are, where it names no converter the app
 * recognises (E42): the software it does name, or that it names none — and so the door does not know
 * whether an edition or a converter from MIDI wrote them.
 */
function unknownOrigin(xml: string): string {
  const named = softwareOf(xml);
  return named.length > 0
    ? `its encoding block names ${named.join(' and ')}, none a converter the app recognises: the door does not know whether an edition or a converter from MIDI wrote them`
    : 'its encoding block names no software: the door does not know whether an edition or a converter from MIDI wrote them';
}

/** The tempo-sensitive demands (the density file's `tempoSensitive`, the build's list too). */
const TEMPO_SENSITIVE = new Set((densityJson as unknown as { tempoSensitive: string[] }).tempoSensitive);

/**
 * How an import's demands are known, as the build writes a bundled row's (`build.attach_provenance`,
 * `docs/03` §4a): measured by the detectors, and — where the file states no tempo — the
 * tempo-sensitive ones among them listed `untrusted`, measured in the notation with their
 * difficulty resting on the app's default tempo (R11). The import path never listed them before
 * E2, so an import was the one notated candidate whose inferred tempo the gate could not see.
 */
function demandsFact(measured: ImportMeasurement, tempoInferred: boolean, via: string): Provenance['facts'][string] {
  if (measured.measurement.status !== 'measured') {
    return { kind: 'unmeasured', why: measured.measurement.status === 'unmeasured' ? measured.measurement.reason : 'not notation' };
  }
  const untrusted = tempoInferred && Array.isArray(measured.demands) ? measured.demands.filter((demand) => TEMPO_SENSITIVE.has(demand)) : [];
  return {
    kind: 'measured',
    via,
    ...(untrusted.length > 0 ? { untrusted, why: 'their difficulty depends on a tempo the app supplied, not one the score states' } : {}),
  };
}

/**
 * What the app measured a row under (E25, E40): the app's converter version in force then, and — where the
 * detectors measured the score — the measuring fingerprint (`data/measuringFingerprint.ts`: the detectors,
 * the model, the vocabulary, the density file, the engraver), written as `"<version>;<fingerprint>"`. An
 * unmeasurable verdict carries the version alone, so a PDF is not tried again launch after launch, only
 * when the version moves (the reviewer's constraint, `responses/12af708.md`): the definitions never decide
 * a file the detectors did not read. Not the converter that wrote the notes: that stays `converter`.
 */
function measuredUnderFact(measured: ImportMeasurement, version: number, fingerprint?: string): Provenance['facts'][string] {
  const read = measured.measurement.status === 'measured';
  return {
    kind: read ? 'measured' : 'unmeasured',
    via: read && fingerprint
      ? 'app/src/data/importStore.ts: the app’s converter version in force when the notes were measured, and the measuring fingerprint (data/measuringFingerprint.ts)'
      : 'app/src/data/importStore.ts: the app’s converter version in force when the notes were measured',
    value: read && fingerprint ? `${String(version)};${fingerprint}` : String(version),
  };
}

/** The app's measuring fingerprint (E40), loaded where a score is measured and nowhere else. */
async function currentFingerprint(): Promise<string> {
  return (await import('./measuringFingerprint')).measuringFingerprint();
}

/** A measured score's demands, or why they could not be measured. */
export interface ImportMeasurement {
  demands: string[] | 'unmeasured';
  measurement: Measurement;
}

/**
 * What the app's own detectors measure on an imported MusicXML score (E0 item 1):
 * the same implementation the build uses (`demands/detect.ts`, over the model OSMD
 * makes of the file), the located counts, and the demands the score provides at a
 * useful density (`eligibility.usefulDensity`, the build's rule). Parsed in a
 * detached element and never drawn, as `estimateImport` does, and reached through
 * dynamic imports so the Library does not carry OSMD for a list.
 *
 * Best-effort by design, like the level estimate: a score the app cannot read still
 * imports, and says so — `demands: 'unmeasured'` with the reason, never an empty list.
 */
export async function measureImport(xml: string, id: string): Promise<ImportMeasurement> {
  const unmeasured = (reason: string): ImportMeasurement => ({ demands: 'unmeasured', measurement: { status: 'unmeasured', reason } });
  if (typeof document === 'undefined') return unmeasured('the score could not be read here: no document to parse it in');
  try {
    const [{ OpenSheetMusicDisplay }, { extractScoreModel }, detectors, { usefulDensity }, { VOCABULARY_V0 }, { EVIDENCE_DEFINITIONS }] = await Promise.all([
      import('opensheetmusicdisplay'),
      import('../score/extractScoreModel'),
      import('../demands/detect'),
      import('../curriculum/eligibility'),
      import('../evidence/vocabulary'),
      import('../evidence/evidence'),
    ]);
    const host = document.createElement('div');
    const osmd = new OpenSheetMusicDisplay(host, { autoResize: false, drawingParameters: 'compact' });
    await osmd.load(xml);
    const model = extractScoreModel(osmd, { id, musicXml: xml });
    const located: Record<string, number> = {};
    for (const demand of VOCABULARY_V0.demands) {
      const n = detectors.detect(model, demand.detector).at.length;
      if (n > 0) located[demand.id] = n;
    }
    const misread = clefMisread(xml);
    const spoilt = new Set<string>(misread === undefined ? [] : CLEF_MISREAD);
    return {
      demands: detectors.measuredDemands(model, VOCABULARY_V0.demands),
      measurement: {
        status: 'measured',
        definitions: EVIDENCE_DEFINITIONS,
        located,
        bars: model.measureCount,
        steps: model.steps.length,
        notes: detectors.soundedNotes(model).length,
        // A reading known to be wrong on this file never establishes an opportunity.
        established: usefulDensity(located, model.measureCount).filter((demand) => !spoilt.has(demand)),
        ...(misread === undefined ? {} : { misread: { demands: [...CLEF_MISREAD], why: misread } }),
      },
    };
  } catch (cause) {
    return unmeasured(`the app could not read the score's notes (${String(cause).slice(0, 120)})`);
  }
}

/** The two readings the detectors' clef assumption spoils (`build.CLEF_MISREAD`). */
export const CLEF_MISREAD = ['clef.bass', 'pitch.ledger'] as const;

/**
 * Why the clef-dependent readings of a score are unreliable, or `undefined`: the
 * detectors read staff 1 as the treble clef (`detect.ts`'s module note), so an upper
 * staff written in the bass clef — a one-staff part, or an upper staff that moves into
 * it — reads wrong for the bass staff and the ledger lines. Found from the file's own
 * `<clef>` signs, as `build.clef_misread` does for the bundled scores; marked, never
 * corrected (the detectors' readings are E22's).
 */
export function clefMisread(xml: string): string | undefined {
  const staves = Number(/<staves>\s*(\d+)\s*<\/staves>/.exec(xml)?.[1] ?? '1');
  const upper = [...xml.matchAll(/<clef(?:\s+number="(\d)")?[^>]*>\s*<sign>([A-Z]+)<\/sign>/g)]
    .filter((match) => match[1] === undefined || match[1] === '1')
    .map((match) => match[2]);
  if (!upper.includes('F')) return undefined;
  return staves === 1 && upper[0] === 'F'
    ? 'one staff in the bass clef: the detectors read staff 1 as the treble clef (detect.ts’s clef assumption)'
    : 'the upper staff moves into the bass clef: the detectors read staff 1 as the treble clef throughout (detect.ts’s clef assumption)';
}

/** Whether a MusicXML score writes a tempo of its own, one the player reads: a `<sound tempo>` or a `<metronome>`. */
function writesTempo(xml: string): boolean {
  return /<sound[^>]*\btempo="/i.test(xml) || /<metronome\b/i.test(xml);
}

/** A metronome mark the file prints only as text, read at import (E32). */
export interface TextTempo {
  /** The score with a `<sound tempo>` beside each mark's direction, which the player reads. */
  xml: string;
  /** The first mark's tempo in quarter notes a minute: the score's opening tempo. */
  bpm: number;
  /** The first mark as printed, its private-use glyph mapped ("♩ = 132"). */
  text: string;
  /** True where the mark's note glyph is missing and the metre's beat was read as its note. */
  glyphMissing: boolean;
  /** The note the number counts: the glyph's, or the metre's beat where the glyph is missing ("quarter"). */
  unit: string;
}

const UNIT_WORDS: Readonly<Record<number, string>> = { 4: 'whole note', 2: 'half', 1: 'quarter', 0.5: 'eighth', 0.25: 'sixteenth' };

/** A metronome mark as text: an optional note (and dot), "=", an optional "ca.", a number, and nothing else. */
const TEXT_MARK = /^\s*\(?\s*(?:(\S)\s*(\.)?\s*)?=\s*(?:c(?:a)?\.?\s*)?(\d{2,3}(?:\.\d+)?)\s*\)?\s*$/u;

function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_m, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_m, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&amp;/g, '&');
}

/**
 * The metronome marks a MusicXML file prints only as `<words>` (E32; Wabash Blues prints "= 120", the note
 * glyph MuseScore's export dropped), read as the score's tempo — or `undefined` where the file writes a
 * tempo of its own (a `<sound tempo>` or a `<metronome>`: the file's word stands) or no mark can be read.
 * The note is the mark's glyph, mapped from SMuFL's private-use code point (`textGlyphs.ts`); where the
 * glyph is missing, the metre's beat, when the metre's beat is a quarter or a half (x/4, x/2) — in any other
 * metre a missing glyph could be a dotted quarter or an eighth, and nothing is read. A mark gains a
 * `<sound tempo>` beside its direction, in quarter notes a minute, which the player reads; the printed
 * mark is left as it was.
 */
export function textTempoOf(xml: string): TextTempo | undefined {
  if (writesTempo(xml)) return undefined;
  const time = /<time\b[^>]*>\s*<beats>\s*(\d+)\s*<\/beats>\s*<beat-type>\s*(\d+)\s*<\/beat-type>/.exec(xml);
  const beatType = time ? Number(time[2]) : undefined;
  const metreBeat = beatType === 4 ? 1 : beatType === 2 ? 2 : undefined;
  let first: Omit<TextTempo, 'xml'> | undefined;
  const out = xml.replace(/<direction\b[^>]*>[\s\S]*?<\/direction>/g, (direction) => {
    if (/<sound\b/.test(direction)) return direction;
    for (const [, raw] of direction.matchAll(/<words\b[^>]*>([^<]*)<\/words>/g)) {
      const text = mapTextGlyphs(decodeEntities(raw ?? '')).trim();
      const mark = TEXT_MARK.exec(text);
      if (!mark) continue;
      const [, note, dot, number] = mark;
      const glyph = note === undefined ? undefined : noteLengthInQuarters(note);
      if (note !== undefined && glyph === undefined) continue;
      const unit = glyph ?? metreBeat;
      if (unit === undefined) continue;
      const bpm = Math.round(Number(number) * unit * (dot ? 1.5 : 1) * 1000) / 1000;
      if (!(bpm >= 20 && bpm <= 400)) continue;
      first ??= { bpm, text, glyphMissing: glyph === undefined, unit: `${dot ? 'dotted ' : ''}${UNIT_WORDS[unit] ?? 'note'}` };
      // Beside the direction, in the measure: OSMD reads a `<sound tempo>` there, and reads none inside a
      // direction whose only content is words.
      return `${direction}<sound tempo="${String(bpm)}"/>`;
    }
    return direction;
  });
  return first ? { xml: out, ...first } : undefined;
}

/**
 * An imported score's provenance (E0 item 2; R35, Part 21 §B): what came from the
 * file, what the converter inferred and by which version, what the app measured.
 * The learner's corrections are written over it by `correctImportHands`.
 */
export function importProvenance(
  kind: 'midi' | 'musicxml' | 'pdf',
  measured: ImportMeasurement,
  xml: string | null,
  report: ConversionReport | null,
  textTempo?: Omit<TextTempo, 'xml'>,
  fingerprint?: string,
): Provenance {
  const facts: Provenance['facts'] = {};
  facts.demands = demandsFact(measured, xml !== null && !writesTempo(xml), 'app/src/demands/detect.ts');
  facts.level = { kind: 'inferred', via: 'the runtime level estimate, until the learner types one' };
  // A MusicXML file the command-line converter wrote says so (E26): its staves and key are that
  // converter's decisions, not an edition's, and the provenance names the converter and its version.
  const recognised = kind === 'musicxml' && xml !== null ? recognisedConverterOf(xml) : undefined;
  const stamped = recognised ? { name: recognised.name, version: recognised.version } : undefined;
  if (kind === 'midi' && report) {
    facts.hands =
      report.hands === 'split into two'
        ? { kind: 'inferred', via: 'the converter split one line by the shape of its voices' }
        : { kind: 'authored', via: 'the file’s own tracks, kept as recorded' };
    facts.key = { kind: report.keyFrom === 'chosen' ? 'authored' : 'inferred', via: report.keyFrom };
    facts.timeSig = { kind: 'inferred', via: 'the file’s meta events, or the converter’s default' };
    facts.grid = { kind: 'inferred', via: `quantised to ${report.grid}` };
  } else if (kind === 'musicxml' && recognised) {
    const by = `${recognised.name} v.${String(recognised.version)}`;
    facts.hands = { kind: 'inferred', via: `the staves ${by} wrote from ${recognised.from}: its tracks kept as recorded, or one line split by the shape of its voices — the file does not say which` };
    facts.key = { kind: 'inferred', via: `${by}: estimated from the notes unless a key was chosen — the file does not say which` };
  } else if (kind === 'musicxml') {
    // E42: the file's own, as a file claims them — and what the door could not tell, said beside it.
    const origin = xml === null ? 'the door does not know whether an edition or a converter from MIDI wrote them' : unknownOrigin(xml);
    facts.hands = { kind: 'authored', via: `the file’s staves — ${origin}` };
    facts.key = { kind: 'authored', via: `the file’s signature — ${origin}` };
  }
  if (xml !== null) {
    facts.tempo = textTempo
      ? {
          kind: 'authored',
          via:
            `the metronome mark printed in the file as text ("${textTempo.text}"` +
            (textTempo.glyphMissing ? `, its note glyph missing: read as a ${textTempo.unit}, the metre’s beat` : '') +
            `), written into the score as its tempo at import (${String(textTempo.bpm)} quarter notes a minute)`,
        }
      : writesTempo(xml)
        ? { kind: 'authored', via: kind === 'midi' ? 'the file’s tempo map' : 'the file' }
        : { kind: 'inferred', via: 'no tempo in the file: the app’s default' };
  }
  facts.measuredUnder = measuredUnderFact(measured, MIDI_CONVERTER_VERSION, fingerprint);
  return {
    source: kind === 'midi' ? 'imported-midi' : kind === 'pdf' ? 'imported-pdf' : 'imported-musicxml',
    edition: null,
    ...(kind === 'midi' ? { converter: { name: APP_CONVERTER, version: MIDI_CONVERTER_VERSION } } : stamped ? { converter: stamped } : {}),
    facts,
    review: { score: null, teaching: null },
  };
}

/**
 * Parses and stores one file.
 *
 * Validation happens *before* the write, so a file that cannot be read never
 * becomes a row the learner has to delete by hand. A score is measured by the
 * app's detectors before it is stored and carries its provenance (E0); a PDF is
 * stored as unmeasured, with the reason.
 */
export async function addImport(file: File, now = new Date()): Promise<ImportRow> {
  const kind = kindForFilename(file.name);
  if (!kind) {
    throw new ImportError(
      `${file.name} is not a score the app can read — import a .musicxml, .mxl, .mid or .pdf file.`,
    );
  }
  if (file.size > MAX_IMPORT_BYTES) {
    throw new ImportError(
      `${file.name} is ${String(Math.round(file.size / 1048576))} MB, over the ${String(
        MAX_IMPORT_BYTES / 1048576,
      )} MB limit for one import.`,
    );
  }
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  if (bytes.length === 0) throw new ImportError(`${file.name} is empty.`);

  const db = await openDatabase();
  if (!db) {
    throw new ImportError(
      'This browser is not storing data, so an imported score would vanish on reload.',
    );
  }
  const taken = new Set((await db.getAllKeys('imports')).map(String));

  let row: ImportRow;
  let note: ConversionNote | null = null;
  let textTempo: TextTempo | undefined;
  if (kind === 'midi') {
    const title = titleFromFilename(file.name);
    let conversion;
    try {
      conversion = convertMidi(bytes, { title });
    } catch (cause) {
      // The converter's own sentence, which says what was wrong and what to do.
      // Never a silent failure and never a stack-trace fragment (`04` §4).
      throw new ImportError(
        cause instanceof MidiReadError || cause instanceof ConvertError
          ? `${file.name}: ${cause.message}`
          : `${file.name} could not be converted from MIDI.`,
      );
    }
    note = {
      report: conversion.report,
      check: checkSentence(conversion.report),
      hands: handsSentence(conversion.report),
      passed: conversion.report.passed,
    };
    row = {
      id: importIdFor(title, taken),
      kind: 'musicxml',
      title,
      data: conversion.xml,
      bytes: byteSizeOf(conversion.xml),
      tags: [],
      addedAt: now.toISOString(),
    };
  } else if (kind === 'pdf') {
    if (!isPdf(bytes)) {
      throw new ImportError(`${file.name} is named .pdf but does not contain a PDF.`);
    }
    const title = file.name.replace(/\.pdf$/i, '');
    row = {
      id: importIdFor(title, taken),
      kind: 'pdf',
      title,
      data: buffer,
      bytes: byteSizeOf(buffer),
      tags: [],
      addedAt: now.toISOString(),
    };
  } else {
    let xml: string;
    try {
      xml = toMusicXml(bytes);
    } catch {
      throw new ImportError(
        isMxl(bytes)
          ? `${file.name} is a .mxl archive with no MusicXML inside it.`
          : `${file.name} could not be unpacked.`,
      );
    }
    if (!/<score-partwise|<score-timewise/i.test(xml)) {
      throw new ImportError(
        `${file.name} does not look like MusicXML — if it came from a scan, export it from MuseScore first.`,
      );
    }
    // X3e: the store keeps one form. The engraver loads only partwise and every reader of the stored text
    // walks parts around measures, so a timewise file is kept as its partwise twin (`toPartwise`).
    xml = toPartwise(xml);
    const title = titleFromMusicXml(xml, file.name);
    const composer = composerFromMusicXml(xml);
    // E32: a metronome mark the file prints only as text becomes the score's tempo, in its own direction.
    textTempo = textTempoOf(xml);
    if (textTempo) xml = textTempo.xml;
    row = {
      id: importIdFor(title, taken),
      kind: 'musicxml',
      title,
      data: xml,
      bytes: byteSizeOf(xml),
      tags: composer ? [composer] : [],
      addedAt: now.toISOString(),
    };
  }

  // Measured on the arrangement in the file, before it is stored (E0): the same
  // detectors the build runs, and the provenance of every fact the row carries.
  const measured: ImportMeasurement =
    row.kind === 'pdf' || typeof row.data !== 'string'
      ? { demands: 'unmeasured', measurement: { status: 'unmeasured', reason: 'a PDF: the app reads no notes from it' } }
      : await measureImport(row.data, row.id);
  const fingerprint = measured.measurement.status === 'measured' ? await currentFingerprint() : undefined;
  row = {
    ...row,
    demands: measured.demands,
    measurement: measured.measurement,
    provenance: importProvenance(kind, measured, typeof row.data === 'string' ? row.data : null, note?.report ?? null, textTempo, fingerprint),
  };

  await db.put('imports', row);
  if (note) conversions.set(row.id, note);
  addedSinceLoad.add(row.id);
  notify();
  return row;
}

/**
 * The learner's correction of an imported score's hands, as source truth (E0; R34's
 * truth half, Part 21 §B): the corrected MusicXML becomes the score — what renders,
 * what the detectors measure, what the level is estimated from and what the gate
 * reads — never a visual override on top of the converter's split. The demands are
 * measured again, the provenance says the hands are the learner's, and an estimated
 * level is estimated again from the corrected notes. The screen that lets a learner
 * move notes between the staves is X's (R34's UX half); this is what it saves through.
 *
 * Returns the stored row, or `undefined` when there is no such score or it is a PDF.
 */
export async function correctImportHands(
  id: string,
  correctedXml: string,
  now = new Date(),
  estimate: (row: ImportRow) => Promise<number | undefined> = () => Promise.resolve(undefined),
): Promise<ImportRow | undefined> {
  const db = await openDatabase();
  const row = await db?.get('imports', id);
  if (!db || !row || row.kind !== 'musicxml') return undefined;
  if (!/<score-partwise|<score-timewise/i.test(correctedXml)) {
    throw new ImportError('The corrected score is not MusicXML, so it was not saved.');
  }
  // X3e: kept in the one form the door keeps (`toPartwise`).
  const corrected = toPartwise(correctedXml);
  const measured = await measureImport(corrected, id);
  const fingerprint = measured.measurement.status === 'measured' ? await currentFingerprint() : undefined;
  const before = row.provenance ?? importProvenance('musicxml', measured, corrected, null);
  const provenance: Provenance = {
    ...before,
    facts: {
      ...before.facts,
      demands: demandsFact(measured, !writesTempo(corrected), CORRECTED_VIA),
      hands: { kind: 'authored', via: `the learner’s correction, ${now.toISOString().slice(0, 10)}` },
      measuredUnder: measuredUnderFact(measured, MIDI_CONVERTER_VERSION, fingerprint),
    },
  };
  const next: ImportRow = {
    ...row,
    data: corrected,
    bytes: byteSizeOf(corrected),
    demands: measured.demands,
    measurement: measured.measurement,
    provenance,
  };
  if (row.levelSource !== 'judged') {
    const level = await estimate(next);
    if (level !== undefined) {
      next.level = level;
      next.levelSource = 'estimated';
    }
  }
  await db.put('imports', next);
  notify();
  return next;
}

/** How a demands fact names a measurement of the learner's corrected score. */
const CORRECTED_VIA = 'app/src/demands/detect.ts, on the corrected score';

/** The tempos a learner can state, in quarter notes a minute. */
export const STATED_TEMPO_RANGE = { min: 20, max: 400 } as const;

const round3 = (value: number): string => String(Math.round(value * 1000) / 1000);

/**
 * The score with its opening tempo set to `bpm` quarter notes a minute, as a learner states it (E48): in
 * the first bar, every `<sound tempo>` carries it and every `<metronome>` prints it in its own note
 * (a half at half the number, a dotted quarter at two thirds); where the first bar says no tempo, a
 * `<sound tempo>` opens it, which the player reads and nothing prints. Later tempo changes are the file's.
 */
export function withOpeningTempo(xml: string, bpm: number): string {
  const first = /<measure\b[^>]*>[\s\S]*?<\/measure>/.exec(xml);
  if (!first) return xml;
  let bar = first[0]
    .replace(/(<sound\b[^>]*\btempo=")[^"]*(")/g, `$1${round3(bpm)}$2`)
    .replace(/<metronome\b[^>]*>[\s\S]*?<\/metronome>/g, (mark) => {
      const unit = /<beat-unit>\s*([a-z0-9]+)\s*<\/beat-unit>/.exec(mark)?.[1];
      const quarters = { whole: 4, half: 2, quarter: 1, eighth: 0.5, '16th': 0.25 }[unit ?? ''];
      if (quarters === undefined) return mark;
      const dotted = /<beat-unit-dot\s*\/>/.test(mark) ? 1.5 : 1;
      return mark.replace(/(<per-minute>)[^<]*(<\/per-minute>)/, `$1${round3(bpm / (quarters * dotted))}$2`);
    });
  if (!/<sound\b[^>]*\btempo="/.test(bar)) bar = bar.replace(/^(<measure\b[^>]*>)/, `$1<sound tempo="${round3(bpm)}"/>`);
  return xml.slice(0, first.index) + bar + xml.slice(first.index + first[0].length);
}

export interface StateTempoOptions {
  /** The measurement (`measureImport`); a test hands in its own. */
  measure?: (xml: string, id: string) => Promise<ImportMeasurement>;
  /** Estimates the level again for an estimated one, as `correctImportHands` does. */
  estimate?: (row: ImportRow) => Promise<number | undefined>;
  /** The measuring fingerprint in force (`measuringFingerprint()`). */
  fingerprint?: string;
}

/**
 * The learner states an imported score's tempo (E48; the reviewer's decision on the X3 brief,
 * `docs/review/responses/ef80e86.md` question 1), and this owns the whole change, so no screen rebuilds it:
 *
 * - the stated tempo becomes the stored score's opening tempo (`withOpeningTempo`): what the player
 *   reads and what the score is measured under;
 * - the tempo fact is `authored`, its `via` naming the learner and the day (no new kind of fact);
 * - the score is measured again, and `measuredUnder` names the version and the fingerprint it was
 *   measured under;
 * - of the `untrusted` demands, only those the stated tempo resolves are cleared: a tempo-sensitive
 *   demand no longer rests on a tempo the app supplied; any other entry stays while the notes carry it;
 * - it is written only onto the row whose score it read — a correction saved meanwhile is read again and
 *   the statement made on it — and a launch measurement that read the older score writes nothing over it
 *   (`measureStoredImports` writes only onto the score it measured).
 *
 * Returns the stored row; `undefined` for no such score or a PDF (no notes to carry a tempo). A tempo
 * outside `STATED_TEMPO_RANGE` is refused with a sentence.
 */
export async function stateImportTempo(id: string, bpm: number, now = new Date(), options: StateTempoOptions = {}): Promise<ImportRow | undefined> {
  if (!Number.isFinite(bpm) || bpm < STATED_TEMPO_RANGE.min || bpm > STATED_TEMPO_RANGE.max) {
    throw new ImportError(`A tempo is between ${String(STATED_TEMPO_RANGE.min)} and ${String(STATED_TEMPO_RANGE.max)} quarter notes a minute; ${String(bpm)} is not.`);
  }
  const db = await openDatabase();
  if (!db) return undefined;
  const measure = options.measure ?? measureImport;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const row = await db.get('imports', id);
    if (!row || row.kind !== 'musicxml' || typeof row.data !== 'string') return undefined;
    const xml = withOpeningTempo(row.data, bpm);
    const measured = await measure(xml, id);
    const fingerprint = measured.measurement.status === 'measured' ? (options.fingerprint ?? (await currentFingerprint())) : undefined;
    const stated = (base: ImportRow): ImportRow => {
      const previous = base.provenance?.facts.demands;
      // The measurement written as the launch writes one, on the score that now states the tempo: the demands
      // fact (no tempo-sensitive entry rests on the app's tempo any more), `measuredUnder`, and a row from
      // before E0 claiming no hands or key its file does not stamp.
      const remeasured = withMeasurement({ ...base, data: xml, bytes: byteSizeOf(xml) }, measured, MIDI_CONVERTER_VERSION, fingerprint);
      const facts = remeasured.provenance?.facts ?? {};
      // Only what the stated tempo resolves: an entry that is not tempo-sensitive stays while the notes still carry it.
      const kept = (previous?.untrusted ?? []).filter((demand) => !TEMPO_SENSITIVE.has(demand) && Array.isArray(measured.demands) && measured.demands.includes(demand));
      const demands = kept.length > 0 && facts.demands?.kind === 'measured' ? { ...facts.demands, untrusted: kept, ...(previous?.why ? { why: previous.why } : {}) } : facts.demands;
      return {
        ...remeasured,
        provenance: {
          ...(remeasured.provenance as Provenance),
          facts: {
            ...facts,
            ...(demands ? { demands } : {}),
            tempo: { kind: 'authored', via: `the learner’s stated tempo, ${round3(bpm)} quarter notes a minute, ${now.toISOString().slice(0, 10)}` },
          },
        },
      };
    };
    let level: number | undefined;
    if (row.levelSource !== 'judged' && options.estimate) level = await options.estimate(stated(row));
    const tx = db.transaction('imports', 'readwrite');
    const latest = await tx.store.get(id);
    if (latest && sameData(latest.data, row.data)) {
      const next = stated(latest);
      if (level !== undefined && latest.levelSource !== 'judged') {
        next.level = level;
        next.levelSource = 'estimated';
      }
      await tx.store.put(next);
      await tx.done;
      notify();
      return next;
    }
    await tx.done;
  }
  throw new ImportError('The score kept changing while its tempo was being saved; try again.');
}

// --- the launch's measurement of stored imports (E25) ------------------------------------

/**
 * Why a stored import is measured on this launch, or `undefined` when it is not (E25, E26):
 *
 * - `never-measured` — imported before E0: no measurement, no demands or no demands fact;
 * - `unreadable-here` — measured where there was no document to parse it in, a reason that no
 *   longer holds in the page;
 * - `version` — unmeasured (a PDF, a file the app could not read) under an older version than
 *   the one in force: tried once more, and not again until the version moves;
 * - `converter` — converted by an older version of the app's converter and not measured since
 *   the version moved. The stored score is what that converter wrote; the MIDI file is not kept,
 *   so the score is measured again, never converted again, and the row goes on naming the
 *   converter version that wrote its notes.
 */
export type MeasureDue = 'never-measured' | 'unreadable-here' | 'version' | 'converter' | 'definitions' | 'untrusted';

/** `measureImport`'s reason where there is no document to parse a score in. */
const NO_DOCUMENT = 'the score could not be read here: no document to parse it in';

/**
 * What a row was last measured under: the converter version (a row measured before E2 wrote none, and
 * only version 1 existed then) and the measuring fingerprint (a row measured before E40 carries none).
 */
function measuredUnderOf(row: Pick<ImportRow, 'provenance'>): { version: number; fingerprint?: string } | undefined {
  if (!row.provenance) return undefined;
  const [version, fingerprint] = String(row.provenance.facts.measuredUnder?.value ?? '').split(';');
  const number = Number(version);
  return { version: Number.isInteger(number) && number > 0 ? number : 1, ...(fingerprint ? { fingerprint } : {}) };
}

/**
 * Why a stored import is measured on this launch (continued from the type's list above; E40, E41):
 *
 * - `definitions` — a score the detectors measured under other definitions than the app's measuring
 *   fingerprint names now (a detector, the model, the vocabulary, the density file or the engraver moved),
 *   or under none (measured before E40). Only a measured score: the definitions never decide a PDF or a
 *   file the app could not read, which follow the version alone.
 * - `untrusted` — a measured score whose tempo is the app's default and which lists no `untrusted`
 *   demands although it carries a tempo-sensitive one (measured by E0's code, before the import path
 *   wrote the list): measured again, the list is written, and it is not due again.
 *
 * `fingerprint` is the app's measuring fingerprint; without one, `definitions` is not asked.
 */
export function measurementDue(row: ImportSummary, current: number = MIDI_CONVERTER_VERSION, fingerprint?: string): MeasureDue | undefined {
  const measurement = row.measurement;
  if (!row.provenance?.facts.demands || !measurement || row.demands === undefined) return 'never-measured';
  const under = measuredUnderOf(row) ?? { version: 1 };
  if (measurement.status !== 'measured') {
    if (measurement.status === 'unmeasured' && measurement.reason === NO_DOCUMENT) return 'unreadable-here';
    return under.version < current ? 'version' : undefined;
  }
  const converter = row.provenance.converter;
  if (converter?.name === APP_CONVERTER && typeof converter.version === 'number' && converter.version < current && under.version < current) return 'converter';
  if (fingerprint !== undefined && row.kind === 'musicxml' && under.fingerprint !== fingerprint) return 'definitions';
  const facts = row.provenance.facts;
  const sensitive = Array.isArray(row.demands) && row.demands.some((demand) => TEMPO_SENSITIVE.has(demand));
  if (facts.tempo?.kind === 'inferred' && sensitive && !(facts.demands?.untrusted?.length)) return 'untrusted';
  return undefined;
}

/**
 * The row with a fresh measurement written in, and nothing else of it changed: the stored score
 * (the learner's corrected one where they corrected it), its level, its rungs and every fact of
 * its provenance but the demands and the version they were measured under. A row imported before
 * E0 gets the provenance its stored file shows — never the hands or the key as the file's own
 * unless a converter's stamp says whose they are, because a MIDI file's converted score is stored
 * as MusicXML too and the door it came through is not on the row.
 */
export function withMeasurement(row: ImportRow, measured: ImportMeasurement, current: number = MIDI_CONVERTER_VERSION, fingerprint?: string): ImportRow {
  const xml = row.kind === 'musicxml' && typeof row.data === 'string' ? row.data : null;
  let provenance: Provenance;
  if (row.provenance) {
    const corrected = row.provenance.facts.hands?.kind === 'authored' && /learner/.test(row.provenance.facts.hands.via ?? '');
    provenance = {
      ...row.provenance,
      facts: { ...row.provenance.facts, demands: demandsFact(measured, xml !== null && !writesTempo(xml), corrected ? CORRECTED_VIA : 'app/src/demands/detect.ts') },
    };
  } else {
    provenance = importProvenance(row.kind, measured, xml, null);
    if (row.kind === 'musicxml' && (xml === null || converterStampOf(xml) === undefined)) {
      const facts = { ...provenance.facts };
      delete facts.hands;
      delete facts.key;
      provenance = { ...provenance, facts };
    }
  }
  provenance = { ...provenance, facts: { ...provenance.facts, measuredUnder: measuredUnderFact(measured, current, fingerprint) } };
  return { ...row, demands: measured.demands, measurement: measured.measurement, provenance };
}

/** What the launch's measurement of stored imports did. */
export interface ImportMeasureStatus {
  state: 'running' | 'done';
  /** Measured now, and the demands read. */
  measured: number;
  /** Tried now and unmeasurable (a PDF, a file the app cannot read), the verdict written with the version. */
  unmeasurable: number;
  /** Not due: measured under the version in force, or unmeasurable under it. */
  current: number;
  /** Left for the next launch: the store failed, or nothing could be read here. */
  pending: number;
  stopped?: boolean;
}

export interface ImportMeasureOptions {
  /** The measurement (`measureImport`); a test hands in its own. */
  measure?: (xml: string, id: string) => Promise<ImportMeasurement>;
  /** The converter version in force (`MIDI_CONVERTER_VERSION`); a test moves it. */
  current?: number;
  /** Waits for the browser to be idle between rows; resolves at once in a test. */
  idle?: () => Promise<void>;
  /** The measuring fingerprint in force (`measuringFingerprint()`); a test moves it. */
  fingerprint?: string;
}

/**
 * Measures every stored import that is due (E25; `measurementDue`) once, one row per idle slice,
 * through the store: each row is read on its own, measured, and written back in one transaction
 * onto the row as it is then — only if its score is still the one measured, so a correction or an
 * assignment saved meanwhile is never overwritten. The screens hear of it once, at the end, and
 * read the measured truth. Never throws: a store that fails leaves the rest for the next launch.
 */
export async function measureStoredImports(options: ImportMeasureOptions = {}): Promise<ImportMeasureStatus> {
  const measure = options.measure ?? measureImport;
  const current = options.current ?? MIDI_CONVERTER_VERSION;
  const idle = options.idle ?? (() => Promise.resolve());
  const status: ImportMeasureStatus = { state: 'running', measured: 0, unmeasurable: 0, current: 0, pending: 0 };
  let changed = false;
  try {
    const db = await openDatabase();
    const summaries = db ? await importSummaries() : [];
    // The definitions' fingerprint (E40), loaded only when there is a stored import to compare it with.
    const fingerprint = options.fingerprint ?? (summaries.length > 0 ? await currentFingerprint() : undefined);
    const due = summaries.filter((row) => measurementDue(row, current, fingerprint) !== undefined);
    status.current = summaries.length - due.length;
    status.pending = due.length;
    for (const summary of due) {
      await idle();
      const row = await db?.get('imports', summary.id);
      if (!db || !row || measurementDue(row, current, fingerprint) === undefined) {
        status.pending -= 1;
        continue;
      }
      const measured: ImportMeasurement =
        row.kind === 'pdf' || typeof row.data !== 'string'
          ? { demands: 'unmeasured', measurement: { status: 'unmeasured', reason: 'a PDF: the app reads no notes from it' } }
          : await measure(row.data, row.id);
      // Nothing learned where there is no document to parse in: left as it was, for a launch that has one.
      if (measured.measurement.status === 'unmeasured' && measured.measurement.reason === NO_DOCUMENT) continue;
      const tx = db.transaction('imports', 'readwrite');
      const latest = await tx.store.get(row.id);
      if (latest && sameData(latest.data, row.data)) {
        await tx.store.put(withMeasurement(latest, measured, current, fingerprint));
        changed = true;
        if (measured.measurement.status === 'measured') status.measured += 1;
        else status.unmeasurable += 1;
      }
      await tx.done;
      status.pending -= 1;
    }
  } catch {
    status.stopped = true;
  }
  status.state = 'done';
  if (changed) notify();
  return status;
}

/**
 * Whether a stored file is still the one that was measured. A PDF's bytes come back from the store
 * as a new `ArrayBuffer` on every read, so they are compared by content, never by reference.
 */
function sameData(a: ImportRow['data'], b: ImportRow['data']): boolean {
  if (typeof a === 'string' || typeof b === 'string') return a === b;
  if (a.byteLength !== b.byteLength) return false;
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  for (let i = 0; i < x.length; i += 1) if (x[i] !== y[i]) return false;
  return true;
}

/** Resolves when the browser next has nothing to do, or after `timeoutMs` at the latest (as the evidence job waits). */
function whenIdle(timeoutMs = 2000): Promise<void> {
  return new Promise((resolve) => {
    const idle = (globalThis as { requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number }).requestIdleCallback;
    if (typeof idle === 'function') idle(() => resolve(), { timeout: timeoutMs });
    else setTimeout(resolve, 50);
  });
}

let measuring: Promise<ImportMeasureStatus> | null = null;

/**
 * Starts the measurement of stored imports once per open (E25): `delayMs` after the first screen,
 * then one row per idle slice, so it never holds up a screen, a score being drawn or a run being
 * taken. OSMD loads only when a row needs measuring. A second call returns the same run.
 */
export function startImportMeasurement(delayMs = 2000): Promise<ImportMeasureStatus> {
  measuring ??= new Promise<void>((resolve) => setTimeout(resolve, delayMs)).then(() => measureStoredImports({ idle: () => whenIdle() }));
  return measuring;
}

/** Test hook: forget this open's measurement run, as a reload would. */
export function resetImportMeasurementForTest(): void {
  measuring = null;
}

/** Must match `public/share-target.js`. */
const SHARE_CACHE = 'pianopath-shared';

/**
 * Takes anything Android shared into the app while it was closed.
 *
 * The service worker parks shared files in a cache and redirects to the
 * Library; this is the other half. It drains the cache — a file imported twice
 * because the page was reloaded would be a duplicate the owner has to delete.
 */
export async function takeSharedFiles(now = new Date()): Promise<{ added: ImportRow[]; errors: string[] }> {
  const added: ImportRow[] = [];
  const errors: string[] = [];
  if (typeof caches === 'undefined') return { added, errors };
  let cache: Cache;
  try {
    if (!(await caches.has(SHARE_CACHE))) return { added, errors };
    cache = await caches.open(SHARE_CACHE);
  } catch {
    return { added, errors };
  }
  for (const request of await cache.keys()) {
    try {
      const response = await cache.match(request);
      if (!response) continue;
      const name = decodeURIComponent(new URL(request.url).pathname.split('/').pop() ?? 'shared');
      const blob = await response.blob();
      added.push(await addImport(new File([blob], name), now));
    } catch (cause) {
      errors.push(cause instanceof ImportError ? cause.message : 'A shared file could not be read.');
    } finally {
      await cache.delete(request);
    }
  }
  return { added, errors };
}

export async function updateImport(
  id: string,
  patch: Partial<
    Pick<
      ImportRow,
      'title' | 'tags' | 'level' | 'cuts' | 'lessonIds' | 'concepts' | 'levelSource' | 'origin'
    >
  >,
): Promise<ImportRow | undefined> {
  const db = await openDatabase();
  const row = await db?.get('imports', id);
  if (!db || !row) return undefined;
  const next: ImportRow = { ...row, ...patch };
  await db.put('imports', next);
  notify();
  return next;
}

export async function deleteImport(id: string): Promise<void> {
  const db = await openDatabase();
  await db?.delete('imports', id);
  // A score added and then deleted in one visit must not go on steering the
  // Library's order towards a row that is not there any more.
  addedSinceLoad.delete(id);
  notify();
}

/**
 * The catalog rows for the imports, so Library, search and the session builder
 * can treat them exactly like bundled items.
 *
 * `level` defaults to 5 rather than 0: an unlabelled bought score is far more
 * likely to be beyond the current lesson than below it, and putting it at 0
 * would have the session builder offering Rachmaninoff as a warm-up.
 */
export function importToCatalogItem(row: ImportSummary): CatalogItem {
  return {
    id: row.id,
    type: 'song',
    title: row.title,
    level: row.level ?? 5,
    // An estimate is printed as `≈` and says so; a number the owner typed is
    // not an estimate. An import with no level at all is neither, and the
    // default of 5 is a placeholder rather than a judgement — so it is marked
    // estimated, which is the honest of the two.
    levelSource: row.levelSource ?? 'estimated',
    hands: 'both',
    tracks: ['imported'],
    concepts: row.concepts ?? [],
    file: null,
    tags: row.tags,
    composer: row.tags[0] ?? null,
    imported: true,
    kind: row.kind,
    /** The rungs this piece was assigned to (replan §4.3). */
    lessonIds: row.lessonIds ?? [],
    source: { name: 'Imported by you', license: 'user-imported', url: null },
    // What the detectors measured at import (or after the learner's correction), and how each
    // fact is known (E0). A row imported before E0 carries neither and reads as unmeasured.
    ...(row.demands === undefined ? {} : { demands: row.demands }),
    ...(row.measurement === undefined ? {} : { measurement: row.measurement }),
    ...(row.provenance === undefined ? {} : { provenance: row.provenance }),
  };
}

export async function importedCatalogItems(): Promise<CatalogItem[]> {
  // Summaries, not rows: this is the path every screen loads through
  // (`allItems`), and a catalog item has no use for the file's bytes.
  return (await importSummaries()).map(importToCatalogItem);
}
