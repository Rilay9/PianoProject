/**
 * The import sheet (X3; E21's workflow, U72; `docs/04` §4): where an import ends, instead of a
 * status line and a note the learner could not act on.
 *
 * Read from the stored row, in order: **what the app read** from the file (the title — the sheet's
 * heading — the composer, the length in bars, the key signature it printed), **what the app guessed**
 * (whose the hands are, the tempo, the key where it was estimated — each with its provenance as the
 * store holds it, `help.whoseFact`, never reworded into certainty), **what the notes ask** (E2's
 * line, unchanged), and then **where it belongs** — the assign sheet's own body, T52's sentence
 * first. Among the guesses, the two corrections the store can take: **the learner's tempo** on the
 * tempo line (X3a), saved through `importStore.stateImportTempo` (E48), which writes it into the
 * score, measures it again and names the learner; and **Swap the hands**, saved through
 * `importStore.correctImportHands`, which makes the corrected score the score and measures it again.
 * Either way the sheet then re-reads the row the store returned.
 *
 * **The tempo line reads one number** (X3c): the tempo the score opens at, its first bar's `<sound tempo>`
 * in quarter notes a minute (`openingTempo`), for the learner's line, the file's and the control's number
 * alike. The file's line adds the first bar's printed mark in its own note where it counts another note
 * (`openingMark`), and says a mark the door read from the file's text (E32) as the store recorded it.
 * Nothing on the line is a later tempo change, and nothing here writes the score.
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
import type { Curriculum, Provenance } from '../curriculum/types';
import type { ImportRow } from '../data/db';
import { loadCurriculum } from '../curriculum/load';
import { composerFromMusicXml, conversionFor, correctImportHands, getImport, ImportError, stateImportTempo } from '../data/importStore';
import { estimateLevelFor } from '../score/estimateImport';
import { DEFAULT_BPM } from '../score/extractScoreModel';
import { noteLengthInQuarters } from '../score/textGlyphs';
import {
  ASSIGN_SENTENCE,
  appendAssignControls,
  conversionCheck,
  conversionGuesses,
  conversionHands,
  notesBlock,
  type AssignOptions,
} from './assignSheet';
import { IMPORT_TEXT, signatureWords, tempoFigure, whoseFact, type Whose } from './help';
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

/** The score's first bar: where the tempo it opens at and the mark it opens with are written. */
function firstBar(xml: string): string {
  return /<measure\b[^>]*>[\s\S]*?<\/measure>/.exec(xml)?.[0] ?? '';
}

/** Whether the score writes a tempo anywhere: a `<sound tempo>` or a `<metronome>` (the store's own test). */
function writesTempo(xml: string): boolean {
  return /<sound\b[^>]*\btempo="/i.test(xml) || /<metronome\b/i.test(xml);
}

/**
 * The tempo the score opens at, in quarter notes a minute, as the score carries it: its first bar's first
 * `<sound tempo>` — where the store writes a learner's stated tempo (`withOpeningTempo`), the door a text
 * mark's reading (E32), and a file its own playback tempo. `undefined` where the first bar sounds none: a
 * later change is never the opening. **The one reader for every quarter-note number the sheet says**
 * (X3c; the X3a and X3b reviews' prune line): the learner's line, the file's line and the number the
 * control starts at. Said to the store's three places, or "about" the whole beat (`help.tempoNumber`).
 */
function openingTempo(xml: string): number | undefined {
  const written = /<sound\b[^>]*\btempo="([\d.]+)"/.exec(firstBar(xml))?.[1];
  const bpm = Number(written);
  return written !== undefined && Number.isFinite(bpm) && bpm > 0 ? bpm : undefined;
}

/** A metronome mark as the page prints it, and the quarter notes a minute it means. */
interface PrintedMark {
  /** The note symbol (`IMPORT_TEXT.noteSymbols`). */
  note: string;
  dots: number;
  perMinute: number;
  /** The mark's number in quarter notes a minute: only to tell whether it and the opening tempo agree. */
  quarters: number;
}

/**
 * The metronome mark the score opens with, as the page prints it (X3c): the first bar's first
 * `<metronome>` — its `<beat-unit>`, `<beat-unit-dot>`s and `<per-minute>`. `undefined` where the first bar
 * prints none, or prints an equation of two notes, a note the sheet has no symbol for, or no number.
 * Read only to say the mark's own note beside the opening tempo, never as a tempo claim of its own: the
 * quarter notes a minute the sheet says are `openingTempo`'s.
 */
function openingMark(xml: string): PrintedMark | undefined {
  const mark = /<metronome\b[^>]*>([\s\S]*?)<\/metronome>/.exec(firstBar(xml))?.[1];
  if (mark === undefined) return undefined;
  const units = [...mark.matchAll(/<beat-unit>\s*([a-z0-9]+)\s*<\/beat-unit>/g)].map((match) => match[1] ?? '');
  const perMinute = Number(/<per-minute>\s*([\d.]+)\s*<\/per-minute>/.exec(mark)?.[1]);
  if (units.length !== 1 || !Number.isFinite(perMinute) || perMinute <= 0) return undefined;
  const note = (IMPORT_TEXT.noteSymbols as Readonly<Record<string, string | undefined>>)[units[0] ?? ''];
  const length = note === undefined ? undefined : noteLengthInQuarters(note);
  if (note === undefined || length === undefined) return undefined;
  const dots = mark.match(/<beat-unit-dot\s*\/>/g)?.length ?? 0;
  return { note, dots, perMinute, quarters: perMinute * length * (2 - 0.5 ** dots) };
}

/**
 * The metronome mark the door read from the file's text (E32), as the store recorded its reading in the
 * tempo fact: the mark as printed (its glyph mapped) and, where the mark printed no note, the note the app
 * read it as (the metre's beat). `undefined` for a tempo from anywhere else. The sheet reads the store's
 * record of its reading (`importStore.importProvenance`); the reading is the store's (`textTempoOf`).
 */
function textMarkRead(fact: Provenance['facts'][string] | undefined): { text: string; unit?: string } | undefined {
  const via = fact?.via ?? '';
  const text = /printed in the file as text \("([^"]*)"/.exec(via)?.[1];
  if (text === undefined) return undefined;
  const unit = /read as an? ([a-z ]+?), the metre’s beat/.exec(via)?.[1];
  return unit === undefined ? { text } : { text, unit: unit.replace(/ note$/, '') };
}

/**
 * The file's own tempo, as the file writes it (X3c; X24): the tempo the score opens at in quarter notes a
 * minute, with the first bar's printed mark in its own note where it counts another note; the two apart
 * where they disagree, so no conversion is said that the file does not make; a mark the door read from the
 * file's text (E32) as printed and as read; the mark alone where the first bar sounds no tempo; and never
 * a later tempo as the opening. `undefined` where the file writes no tempo at all.
 */
function fileTempoWords(fact: Provenance['facts'][string] | undefined, xml: string, opening: number | undefined): string | undefined {
  const text = textMarkRead(fact);
  if (text !== undefined && opening !== undefined) {
    return text.unit === undefined ? IMPORT_TEXT.tempoTextMark(text.text, opening) : IMPORT_TEXT.tempoTextMarkNoNote(text.text, text.unit, opening);
  }
  const mark = openingMark(xml);
  if (mark !== undefined) {
    const printed = IMPORT_TEXT.tempoMark(mark.note, mark.dots, mark.perMinute);
    if (opening === undefined) return IMPORT_TEXT.tempoFileMarkOnly(printed);
    // Agreeing to a hundredth of a beat: a converter's rounding is not a disagreement.
    if (Math.abs(mark.quarters - opening) >= 0.01) return IMPORT_TEXT.tempoFileApart(printed, opening);
    return mark.note === IMPORT_TEXT.noteSymbols.quarter && mark.dots === 0 ? IMPORT_TEXT.tempoFile(opening) : IMPORT_TEXT.tempoFileMark(printed, opening);
  }
  if (opening !== undefined) return IMPORT_TEXT.tempoFile(opening);
  return writesTempo(xml) ? IMPORT_TEXT.tempoFileLater : undefined;
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

/**
 * The tempo line: whose the tempo is, its words, and the number it names in quarter notes a minute, where
 * it names one (the control starts there). Every quarter-note number is `openingTempo`'s (X3c).
 */
function tempoWords(row: ImportRow, xml: string): { whose: Whose; words: string; bpm: number | undefined } {
  const fact = row.provenance?.facts.tempo;
  // A row with no tempo fact (imported before the app kept one) is said from the file itself: a
  // tempo written in it is the file's, and none written is the app's choice.
  const whose = fact ? whoseFact(fact) : writesTempo(xml) ? 'file' : 'guess';
  const opening = openingTempo(xml);
  if (whose === 'yours') {
    // The number where the store wrote it (X3a): the store's fact names the learner and carries no
    // number (E48's `stateImportTempo`), and the stated tempo is what the score now opens at. Never
    // the printed mark's number, which is in the mark's own note (a half note at half the tempo) and
    // may be a later bar's.
    const stated = Number(fact?.value);
    const bpm = opening ?? (Number.isFinite(stated) && stated > 0 ? stated : undefined);
    return { whose, words: IMPORT_TEXT.tempoYours(bpm), bpm };
  }
  if (whose === 'file') {
    const words = fileTempoWords(fact, xml, opening);
    if (words !== undefined) return { whose, words, bpm: opening };
  }
  return { whose: 'guess', words: IMPORT_TEXT.tempoChosen(DEFAULT_BPM), bpm: DEFAULT_BPM };
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
  // **The learner's tempo (X3a; E48)** is drawn by the sheet on this section's tempo line, whoever's
  // the tempo is, the learner's included (X3b; `openImportSheet`): the store's `stateImportTempo` owns
  // the whole change (`responses/ef80e86.md` question 1), and this line then reads the row it returned.
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

  // The learner's tempo (X3a; E48): a number and *Use this tempo*, on the tempo line of every MusicXML
  // score — the store can state a tempo on any of them — including one whose tempo the learner already
  // stated (X3b, `responses/564e8e5f.md`): a learner-authored tempo says whose statement it is and does
  // not make it the last one, so a slip has a way back. Drawn once, like the swap, so a number typed and
  // a refusal said survive a redraw; after a statement it starts again at the tempo the score opens at.
  const tempoField = el('input', { id: 'import-tempo-bpm', type: 'number', step: '1', inputMode: 'numeric' }) as HTMLInputElement;
  const tempoUse = button(IMPORT_TEXT.tempoUse, () => void stateTheTempo(), { id: 'import-tempo-use' });
  const tempoSaid = el('p.muted', { id: 'import-tempo-said', 'aria-live': 'polite', hidden: true });
  const tempoBlock = el('div', { id: 'import-tempo-set' }, el('div.row', {}, el('label', {}, `${IMPORT_TEXT.tempoField} `, tempoField), tempoUse), tempoSaid);
  const sayTempo = (words: string): void => {
    tempoSaid.textContent = words;
    tempoSaid.hidden = words === '';
  };

  const render = (): void => {
    own.textContent = current.kind === 'pdf' ? IMPORT_TEXT.ownPdf : IMPORT_TEXT.own;
    read.replaceChildren(readSection(current));
    const guesses = guessedSection(current);
    guessed.replaceChildren(guesses);
    if (current.kind === 'musicxml' && typeof current.data === 'string') {
      const tempo = tempoWords(current, current.data);
      // Every MusicXML score, the learner's stated tempo included (X3b). It starts at the number the line
      // names, the one a learner who knows better corrects: the tempo the score opens at, as the line says
      // it (X3c: to three places, or the whole beat where the line says "about"). None where the line names
      // no quarter-note number (a mark with no playback tempo, a tempo only after the opening).
      if (tempoField.value === '' && tempo.bpm !== undefined) tempoField.value = String(tempoFigure(tempo.bpm).figure);
      guesses.querySelector('#import-tempo')?.after(tempoBlock);
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
    // And no tempo stated meanwhile (X3a): one change to the score at a time (`stateTheTempo`).
    tempoUse.disabled = true;
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
      tempoUse.disabled = false;
    }
  }

  /**
   * The learner states the tempo through the store, which owns the whole change (E48): the tempo
   * written into the score's first bar, the score measured again, the fact naming the learner, the
   * level estimated again where it is an estimate. The sheet sends the number as typed — the store's
   * bounds decide, in its words, and the sheet clamps nothing — then re-reads the row it returned.
   */
  async function stateTheTempo(): Promise<void> {
    tempoUse.disabled = true;
    // One change at a time: a swap computed from the score before this statement would save a score
    // without the stated tempo under a fact that says it is the learner's.
    swap.disabled = true;
    sayTempo('');
    try {
      const saved = await stateImportTempo(current.id, Number(tempoField.value), new Date(), { estimate: estimateLevelFor });
      if (!saved) {
        sayTempo(IMPORT_TEXT.tempoFailed);
        return;
      }
      current = saved;
      // Seeded again from the row the store returned (X3b): the number the line now names, the tempo the
      // stored score opens at (`openingTempo`, as the line says it: to the store's three places) — never
      // the characters typed. A refusal keeps the field as typed.
      tempoField.value = '';
      render();
      if (saved.levelSource !== 'judged' && saved.level !== undefined) controls.setEstimated(saved.level);
    } catch (cause) {
      sayTempo(cause instanceof ImportError ? cause.message : IMPORT_TEXT.tempoFailed);
    } finally {
      tempoUse.disabled = false;
      swap.disabled = typeof current.data !== 'string' || 'refused' in swapHands(current.data);
    }
  }

  render();
  sheet.body.append(lead, read, guessed, notes);

  // --- where it belongs ----------------------------------------------------------------------
  // The assign sheet's body, unchanged, T52's sentence first (a paragraph of the body's own, as on
  // the assign sheet). Its Save writes the assignment; nothing here writes a run.
  sheet.body.append(el('h3', { id: 'import-belongs', text: IMPORT_TEXT.belongs }), el('p.muted', { text: ASSIGN_SENTENCE }));
  // Declared after the swap's and the tempo's handlers read it, which they can only do once the sheet is drawn.
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
