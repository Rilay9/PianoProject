/**
 * The import sheet (X3; E21's workflow, U72; `docs/04` §4): where an import ends, instead of a
 * status line and a note the learner could not act on.
 *
 * Read from the stored row, in order: **what the app read** from the file (the title — the sheet's
 * heading — the composer, the length in bars, the key signature it printed), **what the app guessed**
 * (whose the hands are, the tempo, the key where it was estimated — each with its provenance as the
 * store holds it, `help.whoseFact`, never reworded into certainty), **what the notes ask** (E2's
 * line, unchanged), and then **where it belongs** — the assign sheet's own body, T52's sentence
 * first. Under the guesses, the one correction the store can take: **Swap the hands**, saved through
 * `importStore.correctImportHands`, which makes the corrected score the score and measures it again;
 * the sheet then re-reads the row the store returned.
 *
 * **The UI opens this; the store never does** (the reviewer's required change,
 * `responses/ef80e86.md`). `addImport` parses, measures, stores and returns the row; the Library's
 * picker, its drop target, the share path and the row's `Assign` — the UI callers that receive a
 * row — open the sheet from it. No data-store module imports this file, and the store's other
 * callers (the folder, the Lab, the tests) keep what they had.
 *
 * **Nothing here is evidence or an offer.** Importing, correcting, assigning, viewing and closing
 * write no run; the piece is the learner's own material, measured, and the only way it is practised
 * is the learner opening it. The sheet adds no path to Today's card or a rung's controls (L113 is
 * X1's).
 *
 * The sheet keeps the id the assign sheet has always had, `assign-sheet`, with `data-sheet="import"`
 * to tell the two apart: it ends in the assign sheet's body, and every door, style rule and test
 * that finds the sheet by that id finds the one a learner now meets after an import. The folder's
 * `Assign` still opens the plain assign sheet (`FolderScreen.ts`, which X3 does not touch).
 */
import type { Curriculum } from '../curriculum/types';
import type { ImportRow } from '../data/db';
import { loadCurriculum } from '../curriculum/load';
import { composerFromMusicXml, conversionFor, correctImportHands, getImport, ImportError } from '../data/importStore';
import { estimateLevelFor } from '../score/estimateImport';
import { DEFAULT_BPM } from '../score/extractScoreModel';
import {
  ASSIGN_SENTENCE,
  appendAssignControls,
  conversionCheck,
  conversionGuesses,
  conversionHands,
  notesBlock,
  type AssignOptions,
} from './assignSheet';
import { IMPORT_TEXT, signatureWords, whoseFact, type Whose } from './help';
import { button, el, openSheet, type Sheet } from './widgets';

export type ImportSheetOptions = Omit<AssignOptions, 'conversion'>;

// --- the swap ------------------------------------------------------------------------------------

/**
 * A piano score with its two staves' notes exchanged: every `<note>` (and `<forward>`) on staff 1
 * moves to staff 2 and the other way round, so what the upper staff held the left hand now plays
 * and the other way round. **Each staff keeps its clef**: the clef belongs to the staff, and the
 * case this correction is for — a file whose first track was the left hand's, which the converter
 * puts on the treble staff because it keeps tracks in file order — is put right exactly by that.
 * Directions stay where they were drawn. Swapping twice gives the same bytes back.
 *
 * Refused, with the reason in the learner's words, where there is not one part on two staves with
 * every note's staff written: one staff has no other hand, separate parts are not a piano's staves,
 * and a note with no staff cannot be moved without guessing where it was.
 */
export function swapHands(xml: string): { xml: string } | { refused: string } {
  const parts = xml.match(/<part\s+id=/g)?.length ?? 0;
  if (parts > 1) return { refused: IMPORT_TEXT.swapParts };
  if (!/<staves>\s*2\s*<\/staves>/.test(xml)) return { refused: IMPORT_TEXT.swapOneStaff };
  const blocks = /<(note|forward)\b[^>]*>[\s\S]*?<\/\1>/g;
  let unmarked = false;
  const swapped = xml.replace(blocks, (block, tag: string) => {
    const staff = /<staff>\s*([12])\s*<\/staff>/.exec(block);
    if (!staff) {
      if (tag === 'note') unmarked = true;
      return block;
    }
    return block.replace(staff[0], `<staff>${staff[1] === '1' ? '2' : '1'}</staff>`);
  });
  if (unmarked) return { refused: IMPORT_TEXT.swapUnmarked };
  return { xml: swapped };
}

// --- what the file says ---------------------------------------------------------------------------

/** The tempo the file writes, rounded to a whole beat per minute, or `undefined`. */
function fileTempo(xml: string): number | undefined {
  const written = /<per-minute>\s*([\d.]+)\s*<\/per-minute>/.exec(xml)?.[1] ?? /<sound[^>]*\btempo="([\d.]+)"/.exec(xml)?.[1];
  const bpm = Number(written);
  return written !== undefined && Number.isFinite(bpm) && bpm > 0 ? Math.round(bpm) : undefined;
}

/** The key signature the score printed first, with the mode where the file states one. */
function printedSignature(xml: string): string | undefined {
  const key = /<key\b[^>]*>([\s\S]*?)<\/key>/.exec(xml)?.[1];
  const fifths = Number(/<fifths>\s*(-?\d+)\s*<\/fifths>/.exec(key ?? '')?.[1]);
  if (!key || !Number.isInteger(fifths)) return undefined;
  return signatureWords(fifths, /<mode>\s*([a-z]+)\s*<\/mode>/.exec(key)?.[1]);
}

/** Bars: the measurement's count where the notes were measured, else the first part's measures. */
function barCount(row: ImportRow, xml: string): number | undefined {
  if (row.measurement?.status === 'measured') return row.measurement.bars;
  const first = /<part\b[^>]*>([\s\S]*?)<\/part>/.exec(xml)?.[1];
  const count = first?.match(/<measure\b/g)?.length ?? 0;
  return count > 0 ? count : undefined;
}

// --- the sections ------------------------------------------------------------------------------

function kv(rows: [string, string][]): HTMLElement {
  const list = el('dl.kv.kv--rows');
  for (const [term, value] of rows) list.append(el('dt', { text: term }), el('dd', { text: value }));
  return list;
}

/** One guess: its name, whose it is, and what it is — the whose beside it, never folded into the words. */
function guessLine(id: string, name: string, whose: Whose, words: string | Node): HTMLElement {
  return el(
    'p',
    { id, 'data-whose': whose },
    el('strong', { text: name }),
    ' · ',
    el('span.muted', { text: IMPORT_TEXT.whose[whose] }),
    ' — ',
    words,
  );
}

function readSection(row: ImportRow): HTMLElement {
  const section = el('section.block', { id: 'import-read' }, el('h3', { text: IMPORT_TEXT.read }));
  if (row.kind === 'pdf' || typeof row.data !== 'string') {
    section.append(el('p.muted', { text: IMPORT_TEXT.pdfRead }));
    return section;
  }
  const xml = row.data;
  const rows: [string, string][] = [];
  const composer = composerFromMusicXml(xml);
  if (composer) rows.push([IMPORT_TEXT.composer, composer]);
  const bars = barCount(row, xml);
  if (bars !== undefined) rows.push([IMPORT_TEXT.length, IMPORT_TEXT.bars(bars)]);
  const signature = printedSignature(xml);
  if (signature) rows.push([IMPORT_TEXT.signature, signature]);
  section.append(kv(rows));
  // The converter's self-check, for a MIDI file converted in this visit: what it read, checked.
  const note = conversionFor(row.id);
  if (note) section.append(conversionCheck(note));
  return section;
}

/** The hands as the row now stands: the conversion's own sentence while its guess stands (U72). */
function handsWords(row: ImportRow): { whose: Whose; words: string | Node } {
  const fact = row.provenance?.facts.hands;
  const whose = whoseFact(fact);
  const note = conversionFor(row.id);
  if (note) return { whose, words: el('span', { id: 'assign-conversion-hands', text: conversionHands(note, row) }) };
  if (whose === 'yours') return { whose, words: IMPORT_TEXT.handsYours };
  if (whose === 'unknown') return { whose, words: IMPORT_TEXT.handsUnknown };
  const source = row.provenance?.source;
  if (whose === 'guess') return { whose, words: source === 'imported-midi' ? IMPORT_TEXT.handsSplit : IMPORT_TEXT.handsStamped };
  return { whose, words: source === 'imported-midi' ? IMPORT_TEXT.handsTracks : IMPORT_TEXT.handsStaves };
}

function tempoWords(row: ImportRow, xml: string): { whose: Whose; words: string } {
  const fact = row.provenance?.facts.tempo;
  const written = fileTempo(xml);
  // A row with no tempo fact (imported before the app kept one) is said from the file itself: a
  // tempo written in it is the file's, and none written is the app's choice.
  const whose = fact ? whoseFact(fact) : written === undefined ? 'guess' : 'file';
  if (whose === 'yours') {
    const stated = Number(fact?.value);
    return { whose, words: IMPORT_TEXT.tempoYours(Number.isFinite(stated) && stated > 0 ? Math.round(stated) : written) };
  }
  if (whose === 'file' && written !== undefined) return { whose, words: IMPORT_TEXT.tempoFile(written) };
  return { whose: 'guess', words: IMPORT_TEXT.tempoChosen(DEFAULT_BPM) };
}

function guessedSection(row: ImportRow): HTMLElement {
  const section = el('section.block', { id: 'import-guessed' }, el('h3', { text: IMPORT_TEXT.guessed }));
  if (row.kind === 'pdf' || typeof row.data !== 'string') {
    section.append(el('p.muted', { text: IMPORT_TEXT.pdfGuessed }));
    return section;
  }
  const xml = row.data;
  const hands = handsWords(row);
  section.append(guessLine('import-hands', IMPORT_TEXT.hands, hands.whose, hands.words));
  const tempo = tempoWords(row, xml);
  section.append(guessLine('import-tempo', IMPORT_TEXT.tempo, tempo.whose, tempo.words));
  // The key only where it was estimated. While this visit's conversion note stands its sentence says
  // the key with the metre and the grid; after it, the provenance does.
  const note = conversionFor(row.id);
  const key = row.provenance?.facts.key;
  if (note) section.append(conversionGuesses(note));
  else if (key?.kind === 'inferred') {
    const stamped = row.provenance?.source === 'imported-musicxml';
    section.append(
      guessLine('import-key', IMPORT_TEXT.key, 'guess', stamped ? IMPORT_TEXT.keyStamped : IMPORT_TEXT.keyEstimated(printedSignature(xml) ?? 'no key signature')),
    );
  }
  // **Set the tempo: held, not built (X3; E48).** A learner's stated tempo needs one store
  // operation that owns the whole mutation — the tempo fact `authored` with the learner in `via`,
  // every tempo-sensitive demand measured again under the stated tempo, `measuredUnder`, only the
  // `untrusted` facts the new measurement resolves cleared, and no stale background measurement
  // writing over the learner's newer word (`responses/ef80e86.md`). `importStore.ts` has no such
  // operation in this tree, and `updateImport` patches metadata only and is not widened from here,
  // so no control is drawn: the tempo line says whose the tempo is and invites nothing the app
  // cannot do. When the operation lands, its control sits beside Swap and its row renders through
  // `tempoWords`, which already reads a learner's tempo as theirs.
  //
  // **No key control** (the reviewer, question 2; E49): a key correction is a semantic correction
  // path like the hands', not a confirmation button, and it is a later row.
  return section;
}

// --- the sheet ------------------------------------------------------------------------------------

/**
 * Opens the import sheet on a stored row (see the module note). Returns the sheet so a caller and a
 * test can drive it; Swap writes through the store at once, Save writes the assignment and closes.
 */
export function openImportSheet(row: ImportRow, curriculum: Curriculum, options: ImportSheetOptions = {}): Sheet {
  const sheet = openSheet(row.title, { id: 'assign-sheet' });
  sheet.el.dataset.sheet = 'import';
  let current = row;

  const own = el('p.muted', { id: 'import-own' });
  const lead = el('section.block', {}, own);
  const read = el('div');
  const guessed = el('div');
  const notes = el('div');

  // The one correction the store can take. Drawn once; its state follows the row.
  const swapSaid = el('p.muted', { id: 'import-swap-said', 'aria-live': 'polite' });
  const swap = button(IMPORT_TEXT.swap, () => void swapTheHands(), { id: 'import-swap' });
  const swapBlock = el('div', {}, el('div.row', {}, swap), swapSaid);

  const render = (): void => {
    own.textContent = current.kind === 'pdf' ? IMPORT_TEXT.ownPdf : IMPORT_TEXT.own;
    read.replaceChildren(readSection(current));
    const guesses = guessedSection(current);
    guessed.replaceChildren(guesses);
    if (current.kind === 'musicxml' && typeof current.data === 'string') {
      const can = swapHands(current.data);
      swap.disabled = 'refused' in can;
      // A control that cannot act says why, on the sheet (`04` §0 R4).
      if ('refused' in can) swapSaid.textContent = can.refused;
      else if (!swapSaid.textContent) swapSaid.textContent = IMPORT_TEXT.swapHint;
      guesses.append(swapBlock);
    }
    notes.replaceChildren(notesBlock(current, IMPORT_TEXT.notes));
  };

  async function swapTheHands(): Promise<void> {
    swap.disabled = true;
    swapSaid.textContent = IMPORT_TEXT.swapping;
    try {
      // The stored bytes, read now: the score is whatever the store holds, not what the sheet opened on.
      const stored = await getImport(current.id);
      const can = stored && typeof stored.data === 'string' ? swapHands(stored.data) : undefined;
      if (!can || 'refused' in can) {
        swapSaid.textContent = can && 'refused' in can ? can.refused : IMPORT_TEXT.swapFailed;
        return;
      }
      const saved = await correctImportHands(current.id, can.xml, new Date(), estimateLevelFor);
      if (!saved) {
        swapSaid.textContent = IMPORT_TEXT.swapFailed;
        return;
      }
      current = saved;
      swapSaid.textContent = IMPORT_TEXT.swapped;
      render();
      // The store estimated the level again from the corrected notes; the level box shows it,
      // unless the learner has typed a level of their own.
      if (saved.levelSource !== 'judged' && saved.level !== undefined) controls.setEstimated(saved.level);
    } catch (cause) {
      swapSaid.textContent = cause instanceof ImportError ? cause.message : IMPORT_TEXT.swapFailed;
    } finally {
      swap.disabled = current.kind !== 'musicxml' || typeof current.data !== 'string' || 'refused' in swapHands(current.data);
    }
  }

  render();
  sheet.body.append(lead, read, guessed, notes);

  // --- where it belongs ----------------------------------------------------------------------
  // The assign sheet's body, unchanged, T52's sentence first (a paragraph of the body's own, as on
  // the assign sheet). Its Save writes the assignment; nothing here writes a run.
  sheet.body.append(el('h3', { id: 'import-belongs', text: IMPORT_TEXT.belongs }), el('p.muted', { text: ASSIGN_SENTENCE }));
  // Declared after the swap's handler reads it, which it can only do once the sheet is drawn.
  const controls = appendAssignControls(sheet, row, curriculum, options);
  return sheet;
}

/**
 * The same sheet for a caller holding a stored row and nothing else: the curriculum fetched and the
 * level estimated first, as `openAssignSheetFor` does, so every door opens the same sheet with the
 * same number in it.
 */
export async function openImportSheetFor(row: ImportRow, options: ImportSheetOptions = {}): Promise<Sheet> {
  const curriculum = await loadCurriculum();
  const estimated = row.kind === 'musicxml' ? await estimateLevelFor(row) : undefined;
  return openImportSheet(row, curriculum, { ...options, ...(estimated === undefined ? {} : { estimated }) });
}
