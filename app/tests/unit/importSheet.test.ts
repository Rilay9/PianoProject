// @vitest-environment jsdom
/**
 * The import sheet (X3; E21, U72; the brief approved with one required change, `responses/ef80e86.md`).
 *
 * An import used to end in a status line and, for a MIDI file, the assign sheet with a note about the
 * conversion the learner could not act on. The import sheet says, from the stored row, what the app
 * read from the file and what it guessed — each guess with its provenance as the store holds it —
 * offers the one correction the store can take (the hands, through `correctImportHands`), keeps
 * E2's *What the notes ask*, and then asks where the piece belongs with the assign sheet's own body
 * and T52's sentence.
 *
 * - **Provenance, never reworded into certainty**: an `inferred` fact is said as the app's guess, an
 *   `authored` one as the file's, and the learner's correction or stated tempo as theirs.
 * - **The conversion note follows the correction (U72)**: derived from the row at render, on both
 *   sheets; the converter's wording only while its guess stands.
 * - **The swap is source truth**: the corrected MusicXML is saved through the store, which measures
 *   it again; the sheet re-reads the row the store returns.
 * - **The UI opens the sheet and the store opens none**, and nothing the sheet does writes a run:
 *   importing, correcting, assigning and closing create no evidence; a run is what the Score screen
 *   records when the learner plays.
 * - **The learner states the tempo** (X3a; E48): where the tempo is the app's guess or the file's, a
 *   number field and *Use this tempo* on the tempo line call `importStore.stateImportTempo` — which
 *   writes the tempo into the score, measures it again and names the learner — and the sheet re-reads
 *   the row the store returned: "You stated ♩ = N", *yours*, no control. A tempo the store refuses is
 *   refused in the store's words, never clamped by the sheet. The number on the line is the one the
 *   stored score now opens at: the store's tempo fact names the learner and carries no number.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Estimating a level parses the score for the level model, which is not what is tested here (as in
// `assignmentIsNotEvidence.test.ts`). The measurement of the notes is the store's own, through OSMD.
vi.mock('../../src/score/estimateImport', () => ({
  estimateLevelFor: () => Promise.resolve(undefined),
  loadLevelModel: () => Promise.resolve(null),
}));

// The store's own `stateImportTempo`, watched: every call goes through to the real operation, so a
// case can read the arguments the sheet passed and the row the store wrote (X3a).
vi.mock('../../src/data/importStore', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../src/data/importStore')>();
  return { ...original, stateImportTempo: vi.fn(original.stateImportTempo) };
});

import type { ImportRow } from '../../src/data/db';
import type { Curriculum, Measurement, Provenance } from '../../src/curriculum/types';
import { addImport, forgetConversionsForTest, getImport, measureImport, stateImportTempo, withOpeningTempo } from '../../src/data/importStore';
import { convertMidi } from '../../src/import/midi/convert';
import { allProgress, recordRun, resetProgressForTest, walkSessions } from '../../src/data/progressStore';
import { demandsLine, openAssignSheet } from '../../src/ui/assignSheet';
import { IMPORT_TEXT, importStateWords } from '../../src/ui/help';
import { openImportSheet, swapHands } from '../../src/ui/importSheet';
import { clearFakeIndexedDb, fakeFile, useFakeIndexedDb } from './helpers/idb';
import { installTextMeasurer } from './helpers/scoreCatalog';

const FIXTURES = join(process.cwd(), 'tests', 'fixtures', 'imports');
const midi = (name: string): File => fakeFile(name, new Uint8Array(readFileSync(join(FIXTURES, name))));

const CURRICULUM: Curriculum = {
  version: 1,
  tracks: [],
  stages: [{ number: 1, title: 'One', units: [{ id: 'u', title: 'U', lessons: [{ id: '1.1', title: 'First steps', concepts: [] }] }] }],
} as unknown as Curriculum;

const T52 =
  'Assigning it to a rung makes it one of that rung’s practice options. The app can suggest it there, and qualifying practice can count toward that rung’s requirements.';

/**
 * Two bars on a piano's two staves, the key signature, the mode and the tempo as asked: the printed
 * mark `tempo` in its `beatUnit` (a quarter unless asked), playing at `sound` quarter notes a minute
 * (the mark's own number unless asked), in bar `tempoBar` (the first unless asked).
 */
function twoStaves({
  tempo,
  fifths = 1,
  mode,
  beatUnit = 'quarter',
  sound = tempo,
  tempoBar = 1,
}: { tempo?: number; fifths?: number; mode?: string; beatUnit?: string; sound?: number; tempoBar?: number } = {}): string {
  const note = (step: string, octave: number, staff: 1 | 2): string =>
    `<note><pitch><step>${step}</step><octave>${String(octave)}</octave></pitch><duration>4</duration><voice>${staff === 1 ? '1' : '5'}</voice><type>whole</type><staff>${String(staff)}</staff></note>`;
  const attributes =
    `<attributes><divisions>1</divisions><key><fifths>${String(fifths)}</fifths>${mode ? `<mode>${mode}</mode>` : ''}</key>` +
    '<time><beats>4</beats><beat-type>4</beat-type></time><staves>2</staves>' +
    '<clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef></attributes>';
  const metronome =
    tempo === undefined
      ? ''
      : `<direction placement="above"><direction-type><metronome><beat-unit>${beatUnit}</beat-unit><per-minute>${String(tempo)}</per-minute></metronome></direction-type><staff>1</staff><sound tempo="${String(sound)}"/></direction>`;
  const bar = (n: number): string =>
    `<measure number="${String(n)}">${n === 1 ? attributes : ''}${n === tempoBar ? metronome : ''}${note('E', 4, 1)}<backup><duration>4</duration></backup>${note('C', 3, 2)}</measure>`;
  return (
    '<?xml version="1.0" encoding="UTF-8"?><score-partwise version="4.0"><work><work-title>Two staves</work-title></work>' +
    '<identification><creator type="composer">A. Composer</creator></identification>' +
    `<part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1">${bar(1)}${bar(2)}</part></score-partwise>`
  );
}

const MEASURED: Measurement = { status: 'measured', definitions: 3, located: {}, bars: 2, steps: 2, notes: 4, established: [] };

function provenance(source: Provenance['source'], facts: Provenance['facts']): Provenance {
  return { source, edition: null, facts, review: { score: null, teaching: null } };
}

function row(over: Partial<ImportRow>): ImportRow {
  return {
    id: 'import.two-staves',
    kind: 'musicxml',
    title: 'Two staves',
    data: twoStaves(),
    tags: [],
    addedAt: '2026-09-29T08:00:00.000Z',
    demands: ['interval.step', 'clef.bass'],
    measurement: { ...MEASURED },
    ...over,
  };
}

/** A MIDI file whose one line the converter split, whose file states no tempo and whose key it estimated. */
const INFERRED = row({
  provenance: provenance('imported-midi', {
    demands: { kind: 'measured', via: 'app/src/demands/detect.ts' },
    hands: { kind: 'inferred', via: 'the converter split one line by the shape of its voices' },
    key: { kind: 'inferred', via: 'estimated from the notes' },
    tempo: { kind: 'inferred', via: 'no tempo in the file: the app’s default' },
  }),
  data: twoStaves(),
});

/** A MusicXML edition: its staves, its signature and its tempo are the file's. */
const AUTHORED = row({
  data: twoStaves({ tempo: 96, fifths: 1, mode: 'minor' }),
  provenance: provenance('imported-musicxml', {
    demands: { kind: 'measured', via: 'app/src/demands/detect.ts' },
    hands: { kind: 'authored', via: 'the file’s staves' },
    key: { kind: 'authored', via: 'the file’s signature' },
    tempo: { kind: 'authored', via: 'the file' },
  }),
});

const PDF = row({
  id: 'import.pages',
  kind: 'pdf',
  title: 'Pages',
  data: new ArrayBuffer(8),
  demands: 'unmeasured',
  measurement: { status: 'unmeasured', reason: 'a PDF: the app reads no notes from it' },
  provenance: provenance('imported-pdf', { demands: { kind: 'unmeasured', why: 'a PDF: the app reads no notes from it' } }),
});

const text = (selector: string): string => document.querySelector(selector)?.textContent ?? '';

function sectionOrder(): string[] {
  return [...document.querySelectorAll('#assign-sheet h3')].map((heading) => heading.textContent ?? '');
}

beforeEach(() => {
  useFakeIndexedDb();
  installTextMeasurer();
  resetProgressForTest();
  forgetConversionsForTest();
  vi.mocked(stateImportTempo).mockClear();
  document.body.replaceChildren();
});
afterEach(() => {
  clearFakeIndexedDb();
  document.body.replaceChildren();
});

describe('the import sheet says what the app read and what it guessed, from the stored row', () => {
  it('three sections in order, then where it belongs, with the assign sheet’s body and T52’s sentence', () => {
    openImportSheet(INFERRED, CURRICULUM);
    const sheet = document.getElementById('assign-sheet');
    expect(sheet?.dataset.sheet).toBe('import');
    const order = sectionOrder();
    const at = (heading: string): number => order.indexOf(heading);
    expect(at('What the app read')).toBe(0);
    expect(at('What the app guessed')).toBeGreaterThan(at('What the app read'));
    expect(at('What the notes ask')).toBeGreaterThan(at('What the app guessed'));
    expect(at('Where does it belong?')).toBeGreaterThan(at('What the notes ask'));
    expect(at('Which rung')).toBeGreaterThan(at('Where does it belong?'));
    // T52's sentence is the sheet's first paragraph of its own, as on the assign sheet.
    expect(text('#assign-sheet .sheet__body > p')).toBe(T52);
    expect(text('#assign-demands')).toBe(demandsLine(INFERRED));
    // Never "approved", never "counts": the piece is the learner's own material, measured.
    expect(sheet?.textContent ?? '').not.toMatch(/approved|counts? towards|finishing the rung/i);
    expect(text('#import-own')).toMatch(/your own/i);
    expect(text('#import-own')).toMatch(/measures/);
  });

  it('what the app read: the title, the composer, the length in bars and the key signature it printed', () => {
    openImportSheet(AUTHORED, CURRICULUM);
    expect(document.querySelector('#assign-sheet h2')?.textContent).toBe('Two staves');
    const read = text('#import-read');
    expect(read).toContain('A. Composer');
    expect(read).toContain('2 bars');
    // The signature the file printed, and the mode it states.
    expect(read).toContain('E minor: one sharp');
  });

  it('an inferred guess is said as the app’s guess: the hands split by shape, the tempo the app chose, the key it estimated', () => {
    openImportSheet(INFERRED, CURRICULUM);
    expect(text('#import-hands')).toContain('the app’s guess');
    expect(text('#import-hands')).toContain('Split by the shape of the lines');
    expect(text('#import-tempo')).toContain('the app’s guess');
    expect(text('#import-tempo')).toContain('The file states no tempo, so the app chose ♩ = 100.');
    expect(text('#import-key')).toContain('the app’s guess');
    expect(text('#import-key')).toContain('Estimated from the notes');
    // With no mode in the file, the signature alone: which key it names is not the file's to say.
    expect(text('#import-read')).toContain('one sharp');
    expect(text('#import-read')).not.toContain('major');
  });

  it('an authored fact is the file’s, and there is no key line where nothing was estimated', () => {
    openImportSheet(AUTHORED, CURRICULUM);
    expect(text('#import-hands')).toContain('from the file');
    expect(text('#import-hands')).toContain('The file’s own staves.');
    expect(text('#import-tempo')).toContain('from the file');
    expect(text('#import-tempo')).toContain('The file says ♩ = 96.');
    expect(document.getElementById('import-key')).toBeNull();
  });

  it('a tempo the learner stated is theirs (the store operation is E-tail’s; the words follow the row)', () => {
    const stated = row({
      data: twoStaves({ tempo: 72 }),
      provenance: provenance('imported-midi', {
        hands: { kind: 'authored', via: 'the file’s own tracks, kept as recorded' },
        tempo: { kind: 'authored', via: 'the learner stated this tempo, 2026-09-29', value: '72' },
      }),
    });
    openImportSheet(stated, CURRICULUM);
    expect(text('#import-tempo')).toContain('yours');
    expect(text('#import-tempo')).toContain('♩ = 72');
    expect(text('#import-tempo')).not.toContain('the app’s guess');
  });

  it('a PDF: the app reads no notes from it, guesses nothing about them, and offers no hands to swap', () => {
    openImportSheet(PDF, CURRICULUM);
    expect(text('#import-read')).toContain('the app reads no notes from it');
    expect(document.getElementById('import-swap')).toBeNull();
    expect(text('#assign-demands')).toBe('A PDF: the app reads no notes from it, so nothing is measured.');
    expect(text('#import-own')).not.toMatch(/measures its notes/);
  });

});

describe('the learner states the tempo (X3a; E48’s stateImportTempo)', () => {
  const field = (): HTMLInputElement => document.getElementById('import-tempo-bpm') as HTMLInputElement;
  const use = (): HTMLButtonElement => document.getElementById('import-tempo-use') as HTMLButtonElement;
  /** Types a tempo into the field and presses *Use this tempo*. */
  function state(value: string): void {
    field().value = value;
    use().click();
  }

  /** A row whose tempo the learner has stated, as the store writes it: `authored`, the learner in `via`. */
  const STATED = row({
    data: withOpeningTempo(twoStaves(), 72),
    provenance: provenance('imported-midi', {
      hands: { kind: 'authored', via: 'the file’s own tracks, kept as recorded' },
      tempo: { kind: 'authored', via: 'the learner’s stated tempo, 72 quarter notes a minute, 2026-09-29' },
    }),
  });

  it('the app’s guess and the file’s tempo offer a number field and Use this tempo on the tempo line; a stated tempo and a PDF offer none', () => {
    openImportSheet(INFERRED, CURRICULUM);
    const control = document.getElementById('import-tempo-set');
    expect(control, 'no control under the app’s guess').not.toBeNull();
    // On the tempo line: the control follows it, before anything else the section says.
    expect(document.getElementById('import-tempo')?.nextElementSibling).toBe(control);
    expect(field().type).toBe('number');
    expect(use().textContent).toBe('Use this tempo');
    expect(IMPORT_TEXT.tempoUse).toBe('Use this tempo');
    // The field starts at the number the line names: the one a learner who knows better corrects.
    expect(field().value).toBe('100');
    expect(control?.textContent).toContain(IMPORT_TEXT.tempoField);
    document.body.replaceChildren();

    openImportSheet(AUTHORED, CURRICULUM);
    expect(document.getElementById('import-tempo-set'), 'no control under the file’s tempo').not.toBeNull();
    expect(field().value).toBe('96');
    document.body.replaceChildren();

    openImportSheet(STATED, CURRICULUM);
    expect(text('#import-tempo')).toContain('yours');
    expect(document.getElementById('import-tempo-set'), 'a control under the learner’s own tempo').toBeNull();
    expect(document.querySelector('#import-guessed input')).toBeNull();
    document.body.replaceChildren();

    openImportSheet(PDF, CURRICULUM);
    expect(document.getElementById('import-tempo-set')).toBeNull();
  });

  it('Use this tempo calls stateImportTempo with the row’s id and the number, and the sheet re-reads the row: “You stated ♩ = N”, yours, no control, the row’s state “tempo yours”', async () => {
    const imported = await addImport(midi('left-hand-first.mid'));
    openImportSheet(imported, CURRICULUM);
    expect(text('#import-tempo')).toContain('The file states no tempo, so the app chose ♩ = 100.');

    state('72');
    await vi.waitFor(() => {
      expect(text('#import-tempo')).toContain('yours');
    });

    // One call, the arguments the sheet passed: the id, the number as typed, now, and the level's
    // estimate (the store estimates an estimated level again from the stated score, as for the swap).
    const calls = vi.mocked(stateImportTempo).mock.calls;
    expect(calls).toHaveLength(1);
    const [id, bpm, now, options] = calls[0] ?? [];
    expect(id).toBe(imported.id);
    expect(bpm).toBe(72);
    expect(now).toBeInstanceOf(Date);
    expect(typeof options?.estimate).toBe('function');

    // The line, from the row the store returned.
    expect(text('#import-tempo')).toContain('You stated ♩ = 72.');
    expect(text('#import-tempo')).not.toContain('the app’s guess');
    expect(document.getElementById('import-tempo-set')).toBeNull();

    // The stored row is the store's: the score states the tempo (the sheet never edits the XML), the
    // fact names the learner, and the demands are the measurement of the stated score.
    const stored = (await getImport(imported.id)) as ImportRow;
    expect(stored.data).toBe(withOpeningTempo(imported.data as string, 72));
    expect(stored.provenance?.facts.tempo?.kind).toBe('authored');
    expect(stored.provenance?.facts.tempo?.via).toMatch(/learner/);
    expect(stored.demands).toEqual((await measureImport(stored.data as string, stored.id)).demands);
    // What the Library row says of it.
    expect(importStateWords(stored)).toContain('tempo yours');
    expect(importStateWords(stored)).not.toContain('tempo guessed');
  });

  it('a tempo outside the store’s bounds is refused in the store’s own words, never clamped, and the row is as it was', async () => {
    const imported = await addImport(midi('left-hand-first.mid'));
    const reasonFor = (bpm: number): Promise<string> =>
      stateImportTempo(imported.id, bpm).then(
        () => '',
        (cause: unknown) => (cause instanceof Error ? cause.message : String(cause)),
      );
    const tooFast = await reasonFor(500);
    const tooSlow = await reasonFor(5);
    expect(tooFast).toMatch(/500/);
    vi.mocked(stateImportTempo).mockClear();
    openImportSheet(imported, CURRICULUM);

    state('500');
    await vi.waitFor(() => {
      expect(text('#import-tempo-said')).toBe(tooFast);
    });
    // The number as typed went to the store: not clamped to its bound.
    expect(vi.mocked(stateImportTempo).mock.calls[0]?.[1]).toBe(500);
    expect(field().value).toBe('500');

    state('5');
    await vi.waitFor(() => {
      expect(text('#import-tempo-said')).toBe(tooSlow);
    });
    expect(vi.mocked(stateImportTempo).mock.calls[1]?.[1]).toBe(5);

    // Nothing written: the score, the fact and the line are as they were, and the control is still there.
    const stored = (await getImport(imported.id)) as ImportRow;
    expect(stored.data).toBe(imported.data);
    expect(stored.provenance?.facts.tempo).toEqual(imported.provenance?.facts.tempo);
    expect(text('#import-tempo')).toContain('the app’s guess');
    expect(document.getElementById('import-tempo-set')).not.toBeNull();
    expect(use().disabled).toBe(false);
  });

  it('one change at a time: the hands cannot be swapped while the tempo is being saved, nor the tempo stated while the hands are', async () => {
    // Two writers on one sheet: a swap computed from the score before the statement would save a score
    // without the stated tempo under a fact that says it is the learner's.
    const imported = await addImport(midi('left-hand-first.mid'));
    openImportSheet(imported, CURRICULUM);
    const swap = (): HTMLButtonElement => document.getElementById('import-swap') as HTMLButtonElement;
    expect(swap().disabled).toBe(false);
    state('72');
    expect(swap().disabled, 'Swap open while the tempo is being saved').toBe(true);
    await vi.waitFor(() => {
      expect(text('#import-tempo')).toContain('yours');
    });
    expect(swap().disabled).toBe(false);
    document.body.replaceChildren();

    const plain = await addImport(fakeFile('plain.musicxml', twoStaves()));
    openImportSheet(plain, CURRICULUM);
    expect(use().disabled).toBe(false);
    swap().click();
    expect(use().disabled, 'Use this tempo open while the hands are being swapped').toBe(true);
    await vi.waitFor(() => {
      expect(text('#import-swap-said')).toMatch(/swapped/i);
    });
    expect(use().disabled).toBe(false);
  });

  // The store's tempo fact names the learner and carries no number (E48), so the line reads the number
  // where the store wrote it: the tempo the stored score now opens at, in quarter notes a minute.
  it('the line says the tempo the learner stated in quarter notes, not the number a half-note mark prints', async () => {
    // A cut-time mark, a half note = 60, which plays 120 quarter notes a minute: stated as 100, the
    // store prints the half note at 50 and plays 100.
    const cut = await addImport(fakeFile('cut-time.musicxml', twoStaves({ tempo: 60, beatUnit: 'half', sound: 120 })));
    openImportSheet(cut, CURRICULUM);
    state('100');
    await vi.waitFor(() => {
      expect(text('#import-tempo')).toContain('yours');
    });
    expect(text('#import-tempo')).toContain('You stated ♩ = 100.');
  });

  it('the line says the tempo the piece now opens at, not a later mark the file prints', async () => {
    // A mark only in the second bar, a later change the store leaves as the file's: stated as 72, the
    // piece opens at 72.
    const later = await addImport(fakeFile('later-mark.musicxml', twoStaves({ tempo: 132, tempoBar: 2 })));
    openImportSheet(later, CURRICULUM);
    state('72');
    await vi.waitFor(() => {
      expect(text('#import-tempo')).toContain('yours');
    });
    expect(text('#import-tempo')).toContain('You stated ♩ = 72.');
  });
});

describe('the conversion note follows the correction (U72)', () => {
  it('says the converter’s split only while it stands, on the import sheet and on the assign sheet', async () => {
    const imported = await addImport(midi('two-hands.mid'));
    openImportSheet(imported, CURRICULUM);
    expect(text('#assign-conversion-hands')).toContain('kept as recorded');
    document.body.replaceChildren();

    // The same row once the learner has corrected the hands, rendered from the row: the note for the
    // visit is still in memory, and it no longer describes the score.
    const corrected: ImportRow = {
      ...imported,
      provenance: {
        ...(imported.provenance as Provenance),
        facts: { ...imported.provenance?.facts, hands: { kind: 'authored', via: 'the learner’s correction, 2026-09-29' } },
      },
    };
    openImportSheet(corrected, CURRICULUM);
    expect(text('#assign-conversion-hands')).toContain('the hands are yours');
    expect(text('#assign-conversion-hands')).not.toContain('kept as recorded');
    expect(text('#import-hands')).toContain('yours');
    document.body.replaceChildren();

    openAssignSheet(corrected, CURRICULUM);
    expect(text('#assign-conversion-hands')).toContain('the hands are yours');
    expect(text('#assign-conversion-hands')).not.toContain('kept as recorded');
    // What the conversion decided that the learner did not change is still said.
    expect(text('#assign-conversion-check')).toContain('every bar adds up');
    expect(text('#assign-conversion-guesses')).toContain('guesses');
  });
});

describe('swapping the hands', () => {
  it('exchanges the two staves’ notes, keeps each staff’s clef, and swapping twice gives the file back', () => {
    const { xml } = convertMidi(new Uint8Array(readFileSync(join(FIXTURES, 'left-hand-first.mid'))), { title: 'Left hand first' });
    const swapped = swapHands(xml);
    if (!('xml' in swapped)) throw new Error(`refused: ${swapped.refused}`);
    const staves = (source: string): string[] => [...source.matchAll(/<note>[\s\S]*?<\/note>/g)].map((note) => /<staff>(\d)<\/staff>/.exec(note[0])?.[1] ?? '');
    expect(staves(swapped.xml)).toEqual(staves(xml).map((staff) => (staff === '1' ? '2' : '1')));
    const clefs = (source: string): string[] => [...source.matchAll(/<clef[^>]*>[\s\S]*?<\/clef>/g)].map((clef) => clef[0]);
    expect(clefs(swapped.xml)).toEqual(clefs(xml));
    const back = swapHands(swapped.xml);
    expect('xml' in back ? back.xml : back.refused).toBe(xml);
  });

  it('refuses what it cannot swap, and says why', () => {
    const oneStaff = twoStaves().replace('<staves>2</staves>', '').replace(/<staff>\d<\/staff>/g, '');
    expect(swapHands(oneStaff)).toEqual({ refused: IMPORT_TEXT.swapOneStaff });
    const twoParts = twoStaves().replace('</part></score-partwise>', '</part><part id="P2"></part></score-partwise>');
    expect(swapHands(twoParts)).toEqual({ refused: IMPORT_TEXT.swapParts });
    const unmarked = twoStaves().replace('<staff>2</staff></note>', '</note>');
    expect(swapHands(unmarked)).toEqual({ refused: IMPORT_TEXT.swapUnmarked });
  });

  it('saves through correctImportHands: the hands become the learner’s, the notes are measured again on the corrected score, and the sheet re-reads the row', async () => {
    const imported = await addImport(midi('left-hand-first.mid'));
    // The bass line on the treble staff and the tune on the bass staff: ledger lines on both.
    expect(imported.demands).toContain('pitch.ledger');
    openImportSheet(imported, CURRICULUM);
    const before = text('#assign-demands');
    expect(text('#assign-conversion-hands')).toContain('the first (Left hand) is the upper staff');

    (document.getElementById('import-swap') as HTMLButtonElement).click();
    await vi.waitFor(() => {
      expect(text('#import-swap-said')).toMatch(/swapped/i);
    });

    const stored = (await getImport(imported.id)) as ImportRow;
    expect(stored.data).not.toBe(imported.data);
    expect(stored.provenance?.facts.hands?.kind).toBe('authored');
    expect(stored.provenance?.facts.hands?.via).toMatch(/learner/);
    expect(stored.provenance?.facts.demands?.via).toMatch(/corrected/);
    // Each hand on its own staff: no ledger line either side.
    expect(stored.demands).not.toContain('pitch.ledger');
    // The sheet reads the row the store returned, not what it held before.
    expect(text('#import-hands')).toContain('yours');
    expect(text('#assign-conversion-hands')).toContain('the hands are yours');
    expect(text('#assign-demands')).toBe(demandsLine(stored));
    expect(text('#assign-demands')).not.toBe(before);
  });
});

describe('nothing the sheet does is evidence; a run is what the Score screen records', () => {
  async function runsStored(): Promise<number> {
    let count = 0;
    await walkSessions(() => {
      count += 1;
    });
    return count;
  }

  it('importing, swapping, saving on no rung and closing write no run; the learner’s explicit run is one run and nothing else', async () => {
    const imported = await addImport(midi('left-hand-first.mid'));
    let saved: ImportRow | undefined;
    openImportSheet(imported, CURRICULUM, {
      onSaved: (next) => {
        saved = next;
      },
    });
    (document.getElementById('import-swap') as HTMLButtonElement).click();
    await vi.waitFor(() => {
      expect(text('#import-swap-said')).toMatch(/swapped/i);
    });
    (document.getElementById('assign-save') as HTMLButtonElement).click();
    await vi.waitFor(() => {
      expect(saved).toBeDefined();
    });
    expect(saved?.lessonIds).toEqual([]);
    expect(document.getElementById('assign-sheet')).toBeNull();
    expect(await runsStored(), 'the sheet wrote a run').toBe(0);
    expect((await allProgress()).filter((one) => one.itemId === imported.id)).toEqual([]);

    // The learner opens it and plays: the Score screen hands the store one run, as for any piece.
    await recordRun({
      itemId: imported.id,
      mode: 'tempo',
      tempoPct: 100,
      tempoMeasured: true,
      accuracy: 1,
      accuracyEstimated: false,
      wrongNotes: 0,
      missed: 0,
      durationMs: 60_000,
      passed: true,
      masterEligible: false,
    });
    expect(await runsStored()).toBe(1);
  });
});

describe('the UI opens the sheet; the store opens none (responses/ef80e86.md)', () => {
  it('no data-store module imports or calls a sheet', () => {
    const dir = resolve('src', 'data');
    const offenders = readdirSync(dir)
      .filter((name) => name.endsWith('.ts'))
      .filter((name) => /ui\/importSheet|ui\/assignSheet|openImportSheet|openAssignSheet|openSheet\(/.test(readFileSync(join(dir, name), 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('addImport stores the row and returns it, and opens nothing', async () => {
    const imported = await addImport(midi('left-hand-first.mid'));
    expect(imported.id).toBe('import.left-hand-first');
    expect(document.querySelector('.sheet')).toBeNull();
  });

  it('the sheet adds no automatic path: it reads no session, selector or Today module and writes only through the store', () => {
    const source = readFileSync(resolve('src', 'ui', 'importSheet.ts'), 'utf8');
    const imports = [...source.matchAll(/from '([^']+)'/g)].map((match) => match[1]);
    expect(imports.filter((path) => /session|selectors|Today|progressStore|rungState/.test(path ?? ''))).toEqual([]);
    expect(source).not.toMatch(/\bupdateImport\(/);
    // The stated tempo is the store's whole change (X3a): the sheet writes no score and no row itself.
    expect(source).not.toMatch(/\bwithOpeningTempo\(|\.put\(/);
  });
});
