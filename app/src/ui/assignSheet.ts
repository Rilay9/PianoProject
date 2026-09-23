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
import { button, el, openSheet } from './widgets';

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
  const lessons = allLessons(curriculum);
  const preselected = new Set(options.preselect ? [options.preselect] : []);

  sheet.body.append(
    el('p.muted', {
      text: 'Assigning it to a rung makes it one of that rung’s song options — it counts towards finishing the rung, and it turns up when you ask for something else to play.',
    }),
  );

  // --- what the conversion decided ---------------------------------------
  // Looked up here rather than passed in, because every screen that can reach
  // this sheet reaches *this function* — the Library calls it directly, the
  // share path and the lesson page through `openAssignSheetFor` — and a note
  // shown by one door and not the others is the fault this sheet exists to
  // avoid.
  const conversion = options.conversion ?? conversionFor(row.id);
  if (conversion) {
    const block = el('section.block', { id: 'assign-conversion' });
    block.append(el('h3', { text: 'Converted from MIDI' }));
    const check = el('p', {
      id: 'assign-conversion-check',
      text: conversion.check,
      className: conversion.passed ? 'muted' : 'status--error',
    });
    block.append(check);
    block.append(el('p.muted', { id: 'assign-conversion-hands', text: conversion.hands }));
    block.append(
      el('p.muted', {
        id: 'assign-conversion-guesses',
        text:
          `Written in ${conversion.report.timeSignature}, key of ${conversion.report.key} ` +
          `(${conversion.report.keyFrom}), on a grid of ${conversion.report.grid} chosen bar by bar. ` +
          'Those three are guesses; the notes and their timing are not.',
      }),
    );
    sheet.body.append(block);
  }

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
  const estimated = options.estimated;
  if (estimated !== undefined) levelInput.value = String(estimated);
  else if (row.level !== undefined) levelInput.value = String(row.level);

  const levelHint = el('p.muted', {
    id: 'assign-level-hint',
    text:
      estimated === undefined
        ? 'No estimate — the app could not read the notes. Type a level if you know one.'
        : `≈ ${String(estimated)}, estimated from the notes. Change it if it feels wrong.`,
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
  return sheet;
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
