/**
 * The assign sheet: where an imported file becomes a rung's option (replan §4.3).
 *
 * The path this replaces was share → PianoPath → find the Library row → Edit →
 * type a level → pick tags → Save → Plan → find the lesson. This is: share →
 * Save. Everything the sheet needs it already knows — the rung came in the
 * hash, the level came from the runtime estimator, the concepts are the
 * rung's — so the owner's only necessary action is to agree.
 *
 * Nothing here is mandatory. A piece can be saved belonging to no rung, which
 * is what an import used to be and is still sometimes what is wanted.
 */
import type { Curriculum, Lesson } from '../curriculum/types';
import type { ImportRow } from '../data/db';
import { loadCurriculum } from '../curriculum/load';
import { conversionFor, updateImport, type ConversionNote } from '../data/importStore';
import { estimateLevelFor } from '../score/estimateImport';
import { DEMAND_WORDS, IMPORT_TEXT, whoseFact } from './help';
import { button, el, openSheet, type Sheet } from './widgets';

export interface AssignResult {
  lessonIds: string[];
  concepts: string[];
  level: number | undefined;
  levelSource: 'estimated' | 'judged';
}

export interface AssignOptions {
  /** The rung to pre-select, from `#/library?for=<lessonId>`. */
  preselect?: string;
  /**
   * What the converter decided, for a file that arrived as MIDI.
   *
   * Shown **before** the learner agrees to the import, because a conversion is
   * a pile of guesses — the grid, the key, which hand played what — and the
   * moment to say so is while they are still looking at the file rather than
   * three screens later when the score reads oddly.
   */
  conversion?: ConversionNote;
  /** The runtime estimate (§4.4), shown as `≈` and editable. */
  estimated?: number;
  onSaved?: (row: ImportRow) => void;
}

/**
 * What the app read in a stored import's notes, in one sentence: its measured demands in the words
 * the swap sheet uses, or why none were read. Nothing here is a judgement of the piece.
 */
export function demandsLine(row: Pick<ImportRow, 'kind' | 'demands' | 'measurement'>): string {
  const measurement = row.measurement;
  if (row.kind === 'pdf') return 'A PDF: the app reads no notes from it, so nothing is measured.';
  if (!measurement || row.demands === undefined) return 'Not measured yet: the app measures it in the background.';
  if (measurement.status !== 'measured' || !Array.isArray(row.demands)) {
    return `The app could not measure its notes (${measurement.status === 'unmeasured' ? measurement.reason : 'not notation'}).`;
  }
  // A reading the app knows to be wrong on this file (the detectors' clef assumption, E0) is never
  // said as measured; the sentence says it was left out and why.
  const misread = new Set(measurement.misread?.demands ?? []);
  const demands = row.demands.filter((demand) => !misread.has(demand));
  const leftOut = misread.size > 0 ? ' The app misreads this file’s clef, so its bass-staff and ledger-line notes are left out.' : '';
  // "Shorter than a quarter" is the eighths' and the sixteenths' union: named only where neither is.
  const union = demands.includes('rhythm.eighths') || demands.includes('rhythm.sixteenths');
  const names = [
    ...new Set(
      demands
        .filter((demand) => demand !== 'rhythm.shorter-than-quarter' || !union)
        .map((demand) => (demand === 'rhythm.shorter-than-quarter' ? 'notes shorter than a quarter' : (DEMAND_WORDS[demand]?.name ?? demand))),
    ),
  ];
  if (names.length === 0) return `Measured in the notes: none of the things the app measures.${leftOut}`;
  const list = names.length === 1 ? (names[0] as string) : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1] as string}`;
  return `Measured in the notes: ${list}.${leftOut}`;
}

/** Every rung, flattened, in the order the plan lists them. */
export function allLessons(curriculum: Curriculum): { lesson: Lesson; stage: number }[] {
  const out: { lesson: Lesson; stage: number }[] = [];
  for (const stage of curriculum.stages) {
    for (const unit of stage.units) {
      for (const lesson of unit.lessons) out.push({ lesson, stage: stage.number });
    }
  }
  return out;
}

/** T52's sentence: what assigning a piece to a rung does, and nothing about finishing it. */
export const ASSIGN_SENTENCE =
  'Assigning it to a rung makes it one of that rung’s practice options. The app can suggest it there, and qualifying practice can count toward that rung’s requirements.';

/**
 * The conversion note's hands sentence as the row now stands (U72): the converter's wording only
 * while its guess stands; once the learner has corrected the hands, that they are the learner's.
 * Derived from the row's provenance at render, never kept from the import moment — the note in
 * memory describes the conversion, and after a correction its hands sentence describes a decision
 * the learner has undone.
 */
export function conversionHands(note: ConversionNote, row: Pick<ImportRow, 'provenance'>): string {
  return whoseFact(row.provenance?.facts.hands) === 'yours' ? IMPORT_TEXT.conversionHandsYours : note.hands;
}

/** The self-check's sentence, in red where the check found trouble. */
export function conversionCheck(note: ConversionNote): HTMLElement {
  return el('p', { id: 'assign-conversion-check', text: note.check, className: note.passed ? 'muted' : 'status--error' });
}

/** What the conversion guessed besides the hands: the metre, the key and the grid. */
export function conversionGuesses(note: ConversionNote): HTMLElement {
  return el('p.muted', {
    id: 'assign-conversion-guesses',
    text:
      `Written in ${note.report.timeSignature}, key of ${note.report.key} ` +
      `(${note.report.keyFrom}), on a grid of ${note.report.grid} chosen bar by bar. ` +
      'Those three are guesses; the notes and their timing are not.',
  });
}

/** E2's line under its heading: what the stored row's notes ask, measured. */
export function notesBlock(row: Pick<ImportRow, 'kind' | 'demands' | 'measurement'>, heading = 'What the notes ask'): HTMLElement {
  return el('section.block', {}, el('h3', { text: heading }), el('p.muted', { id: 'assign-demands', text: demandsLine(row) }));
}

/**
 * Opens the sheet for one freshly imported row.
 *
 * Returns the sheet so a caller (and a test) can drive it; the work happens on
 * Save, which writes the assignment onto the import and closes.
 */
export function openAssignSheet(
  row: ImportRow,
  curriculum: Curriculum,
  options: AssignOptions = {},
) {
  const sheet = openSheet(`Where does ${row.title} go?`, { id: 'assign-sheet' });

  sheet.body.append(el('p.muted', { text: ASSIGN_SENTENCE }));

  // --- what the conversion decided ---------------------------------------
  // Looked up here rather than passed in, because a note shown by one door and
  // not the others is the fault this sheet exists to avoid. Since X3 the
  // Library's doors (its picker, the share path, *Import for this rung*, the
  // row's Assign) open the import sheet, which draws the same note from the
  // same helpers; the score folder's Assign still reaches this function
  // through `openAssignSheetFor`. Its hands sentence is derived from the row
  // as it stands (U72).
  const conversion = options.conversion ?? conversionFor(row.id);
  if (conversion) {
    const block = el('section.block', { id: 'assign-conversion' });
    block.append(el('h3', { text: 'Converted from MIDI' }));
    block.append(conversionCheck(conversion));
    block.append(el('p.muted', { id: 'assign-conversion-hands', text: conversionHands(conversion, row) }));
    block.append(conversionGuesses(conversion));
    sheet.body.append(block);
  }

  // --- what the notes ask --------------------------------------------------
  // The stored row's measured demands (E0; E2): what the app's detectors read in the score as
  // it is stored — the learner's corrected one where the hands were corrected — or why nothing
  // was read. A row imported before E0 is measured in the background on the next launch
  // (`importStore.measureStoredImports`), and says so until it has been.
  sheet.body.append(notesBlock(row));

  appendAssignControls(sheet, row, curriculum, options);
  return sheet;
}

/** What the import sheet can change in the controls after a correction re-estimates the level. */
export interface AssignControls {
  /** A new runtime estimate, shown unless the learner has typed a level of their own. */
  setEstimated: (estimated: number | undefined) => void;
}

/**
 * The assign sheet's body after its sentence: the rung, the level, the concepts, Save and Not now —
 * the part the import sheet reuses under *Where does it belong?* (X3), unchanged.
 */
export function appendAssignControls(
  sheet: Sheet,
  row: ImportRow,
  curriculum: Curriculum,
  options: AssignOptions = {},
): AssignControls {
  const lessons = allLessons(curriculum);
  const preselected = new Set(options.preselect ? [options.preselect] : []);

  // --- the rung ----------------------------------------------------------
  const rungSelect = el('select', { id: 'assign-lesson' }) as HTMLSelectElement;
  rungSelect.append(el('option', { value: '', text: 'No rung — just put it in my library' }));
  for (const { lesson, stage } of lessons) {
    const option = el('option', {
      value: lesson.id,
      // The stage and the words, not the id. `Stage 4 · classical.4.1 — Classical:
      // Grade 1 pieces and articulation` is a picker whose first third is an
      // internal identifier, and a `select` on a 342 px phone truncates from the
      // right, so the id ate the beginning of the only words that tell one rung
      // from another. `00` §1: no internal identifiers on screen. The option's
      // `value` is still the id, which is what every test here reads.
      text: `Stage ${String(stage)} · ${lesson.title}`,
    }) as HTMLOptionElement;
    if (preselected.has(lesson.id)) option.selected = true;
    rungSelect.append(option);
  }
  sheet.body.append(
    el('section.block', {}, el('h3', { text: 'Which rung' }), rungSelect),
  );

  // --- the level ---------------------------------------------------------
  const levelInput = el('input', {
    id: 'assign-level',
    type: 'number',
    min: '1',
    max: '9',
    step: '0.1',
  }) as HTMLInputElement;
  let estimated = options.estimated;
  if (estimated !== undefined) levelInput.value = String(estimated);
  else if (row.level !== undefined) levelInput.value = String(row.level);

  const hintFor = (value: number | undefined): string =>
    value === undefined
      ? 'No estimate — the app could not read the notes. Type a level if you know one.'
      : `≈ ${String(value)}, estimated from the notes. Change it if it feels wrong.`;
  const levelHint = el('p.muted', { id: 'assign-level-hint', text: hintFor(estimated) });
  // A level the learner typed is theirs, and a later estimate never writes over it.
  let levelTouched = false;
  levelInput.addEventListener('input', () => {
    levelTouched = true;
  });
  sheet.body.append(
    el('section.block', {}, el('h3', { text: 'Level' }), levelInput, levelHint),
  );

  // --- concepts ----------------------------------------------------------
  const conceptsInput = el('input', {
    id: 'assign-concepts',
    type: 'text',
    placeholder: 'hands-together, held-LH',
  }) as HTMLInputElement;
  const lessonFor = (id: string): Lesson | undefined =>
    lessons.find((entry) => entry.lesson.id === id)?.lesson;
  const fillConcepts = (): void => {
    const lesson = lessonFor(rungSelect.value);
    conceptsInput.value = (lesson?.concepts ?? []).join(', ');
  };
  fillConcepts();
  // The rung's concepts are the right default and the owner rarely wants
  // others, so changing the rung refills them — unless he has typed something,
  // in which case his text is not thrown away.
  let conceptsTouched = false;
  conceptsInput.addEventListener('input', () => {
    conceptsTouched = true;
  });
  rungSelect.addEventListener('change', () => {
    if (!conceptsTouched) fillConcepts();
  });
  sheet.body.append(
    el(
      'section.block',
      {},
      el('h3', { text: 'What it trains' }),
      conceptsInput,
      el('p.muted', { text: 'Taken from the rung. Used by the Skills screen.' }),
    ),
  );

  // --- save --------------------------------------------------------------
  const save = button(
    'Save',
    () => {
      const typed = levelInput.value.trim();
      const level = typed === '' ? undefined : Number(typed);
      const changed = estimated !== undefined && level !== undefined && level !== estimated;
      const result: AssignResult = {
        lessonIds: rungSelect.value ? [rungSelect.value] : [],
        concepts: conceptsInput.value
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
        level: level !== undefined && Number.isFinite(level) ? level : undefined,
        // Typing over the estimate makes it his number, and his number is a
        // judgement (replan §1.4). Leaving the estimate alone leaves it an
        // estimate, and the app keeps printing the `≈`.
        levelSource: changed || estimated === undefined ? 'judged' : 'estimated',
      };
      void (async () => {
        const updated = await updateImport(row.id, {
          lessonIds: result.lessonIds,
          concepts: result.concepts,
          ...(result.level === undefined ? {} : { level: result.level }),
          levelSource: result.levelSource,
        });
        options.onSaved?.(updated ?? row);
        sheet.close();
      })();
    },
    { id: 'assign-save', variant: 'primary' },
  );
  sheet.body.append(
    el('div.row', {}, save, button('Not now', () => sheet.close(), { variant: 'quiet' })),
  );
  return {
    setEstimated: (next) => {
      if (levelTouched) return;
      estimated = next;
      levelInput.value = next === undefined ? (row.level === undefined ? '' : String(row.level)) : String(next);
      levelHint.textContent = hintFor(next);
    },
  };
}

/**
 * The same sheet, for a caller that has an import row and nothing else.
 *
 * The curriculum has to be fetched and the level has to be estimated before
 * the sheet can be honest about either, and estimating means parsing the
 * score — the one slow step in the path. Doing both here means every screen
 * that can reach the sheet reaches the *same* sheet, with the same number in
 * it, rather than each one assembling its own half of the answer.
 *
 * A failed estimate is not an error: `estimateLevelFor` returns `undefined`
 * and the sheet says "no estimate" instead of showing a number nobody
 * computed.
 */
export async function openAssignSheetFor(row: ImportRow, options: AssignOptions = {}) {
  const curriculum = await loadCurriculum();
  const estimated = row.kind === 'musicxml' ? await estimateLevelFor(row) : undefined;
  return openAssignSheet(row, curriculum, {
    ...options,
    ...(estimated === undefined ? {} : { estimated }),
  });
}
