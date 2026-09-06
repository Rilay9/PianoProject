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
import { updateImport } from '../data/importStore';
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

  // --- the rung ----------------------------------------------------------
  const rungSelect = el('select', { id: 'assign-lesson' }) as HTMLSelectElement;
  rungSelect.append(el('option', { value: '', text: 'No rung — just put it in my library' }));
  for (const { lesson, stage } of lessons) {
    const option = el('option', {
      value: lesson.id,
      text: `Stage ${String(stage)} · ${lesson.id} — ${lesson.title}`,
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
