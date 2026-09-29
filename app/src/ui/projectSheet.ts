/**
 * The project sheet (G1b item 5): where the learner says what they are doing with a piece.
 *
 * Opened from the Score screen's finish sheet (*What next with this piece?*, the first door) and
 * from a project's row, or a passed piece's *Make it a project*, on Progress (the second). It shows
 * the piece's title; its state and since, or that it is not a project yet; the history's last line;
 * what the encounter history says of the piece (read through `encounterStore.familiarity`, never
 * written); the actions the state offers (`projectStore.actionsFor`); and, once there is a project,
 * R18's three facts as the learner types them. Opening it writes nothing: a project is made only by
 * the learner choosing one of the actions, and every change after that is the learner's too.
 *
 * The one caller of `applyProjectAction` in the app (`projectLifecycle.test.ts` holds it so): no
 * screen, job or reader moves a project by itself.
 */
import { button, el, openSheet, type Sheet } from './widgets';
import { onScreenDispose } from './screenLifecycle';
import { PROJECT_TEXT, playedLine, projectHistoryLine, projectSince, sectionWords } from './help';
import { familiarity } from '../data/encounterStore';
import { dayKey } from '../data/progressStore';
import {
  actionsFor,
  addProjectSection,
  applyProjectAction,
  projectFor,
  removeProjectSection,
  setProjectNotes,
  type ProjectAction,
  type ProjectRow,
} from '../data/projectStore';
import type { CatalogItem } from '../curriculum/types';
import type { Identity } from '../review/record';

export interface ProjectSheetOptions {
  item: Pick<CatalogItem, 'id' | 'title'>;
  /**
   * The material a run of the piece carries: what the Score screen played (an import's loaded bytes
   * among them), or the catalogue row's (`material.materialOfItem`) from Progress.
   */
  material: Identity | undefined;
  /** The piece's length in printed bars, where known: it bounds the sections. */
  bars?: number;
  /** Called after each write, so the screen underneath can draw its projects again. */
  onChange?: () => void;
  /**
   * The screen that opened the sheet: leaving it closes the sheet, which otherwise stays over
   * whatever screen comes next (the shell swaps the screen, not the body the sheet hangs from).
   */
  owner?: HTMLElement;
}

/**
 * What the history says of the piece, in one line (G1b item 5). With the piece's length in bars a run
 * over every bar is the piece played and a loop is part of it; without it the two cannot be told
 * apart (every Score-screen run names the bars it covered), so either is said as played.
 */
async function metLine(item: Pick<CatalogItem, 'id'>, material: Identity | undefined, bars: number | undefined): Promise<string> {
  const facts = await familiarity({ itemId: item.id, material, ...(bars === undefined ? {} : { extent: bars }) });
  if (facts.attempted !== null) return playedLine(dayKey(new Date(facts.attempted)), false);
  if (facts.partly.attempted !== null) return playedLine(dayKey(new Date(facts.partly.attempted)), bars !== undefined);
  if (facts.heard !== null || facts.partly.heard !== null) return PROJECT_TEXT.heardOnly;
  if (facts.viewed !== null || facts.partly.viewed !== null) return PROJECT_TEXT.viewedOnly;
  return PROJECT_TEXT.never;
}

/**
 * A message line inside the sheet (`04` §0 R6: beside the control that caused it; the sheet is modal,
 * so the screen's own line would be behind it). The screens' `statusLine`, written here because this
 * module is no screen and imports no screen's frame: a new message clears the last one's colour.
 */
function messageLine(id: string): HTMLElement & { say: (text: string, error?: boolean) => void } {
  const node = el('p.status', { id, role: 'status', 'aria-live': 'polite' }) as HTMLElement & { say: (text: string, error?: boolean) => void };
  node.say = (text: string, error = false): void => {
    node.textContent = text;
    node.classList.toggle('status--error', error);
  };
  return node;
}

export function openProjectSheet(options: ProjectSheetOptions): Sheet {
  const { item, material, bars } = options;
  const target = { itemId: item.id, material };
  const sheet = openSheet(item.title, { id: 'project-sheet' });
  sheet.el.dataset.item = item.id;
  if (options.owner) {
    onScreenDispose(options.owner, () => {
      if (sheet.el.isConnected) sheet.close();
    });
  }

  const stateLine = el('p.project-sheet__state', { id: 'project-state' });
  const historyLine = el('p.muted', { id: 'project-history', hidden: true });
  const met = el('p.muted', { id: 'project-met', text: PROJECT_TEXT.checking });
  const actions = el('div.row', { id: 'project-actions' });
  // R6: a message beside the controls that caused it, inside the sheet (the sheet is modal).
  const status = messageLine('project-status');
  // A column (the sheet body's own layout): each label over its box, one field under another.
  const notes = el('div.sheet__body', { id: 'project-notes', hidden: true });
  sheet.body.append(stateLine, historyLine, met, actions, status, notes);

  let project: ProjectRow | undefined;
  /** A write has answered: the first read, if it answers later, is older than what is drawn. */
  let written = false;

  const say = status.say;

  const changed = (row: ProjectRow): void => {
    written = true;
    project = row;
    draw();
    options.onChange?.();
  };

  async function act(action: ProjectAction, performedOn?: string): Promise<void> {
    try {
      const row = await applyProjectAction(target, action, performedOn === undefined ? {} : { performedOn });
      changed(row);
      say(`${PROJECT_TEXT.states[row.state]}.`);
    } catch (cause) {
      say(cause instanceof Error ? cause.message : String(cause), true);
      // What is offered now, from the store: a second tap may have come after the first moved it.
      const now = await projectFor(target);
      written = true;
      project = now;
      draw();
    }
  }

  function drawActions(): void {
    const offered = actionsFor(project?.state);
    const nodes: HTMLElement[] = [];
    for (const action of offered) {
      if (action === 'performed') {
        // "I performed it", with the day: the learner's own statement, today unless they change it.
        const today = dayKey(new Date());
        const date = el('input', { id: 'project-performed-on', type: 'date', value: today, max: today }) as HTMLInputElement;
        const label = el('label', { htmlFor: 'project-performed-on', text: PROJECT_TEXT.performedWhen });
        const performed = button(PROJECT_TEXT.actions.performed, () => void act('performed', date.value === '' ? undefined : date.value), {
          id: 'project-action-performed',
          variant: 'quiet',
        });
        performed.dataset.action = 'performed';
        nodes.push(el('span.row', { 'data-performed': 'true' }, performed, label, date));
        continue;
      }
      const node = button(PROJECT_TEXT.actions[action], () => void act(action), { id: `project-action-${action}`, variant: 'quiet' });
      node.dataset.action = action;
      nodes.push(node);
    }
    actions.replaceChildren(...nodes);
  }

  function drawNotes(): void {
    notes.hidden = project === undefined;
    if (!project) {
      notes.replaceChildren();
      return;
    }
    const id = project.id;
    const text = (fieldId: string, label: string, value: string | undefined, key: 'goal' | 'problem'): HTMLElement => {
      const input = el('input', { id: fieldId, type: 'text', value: value ?? '' }) as HTMLInputElement;
      input.addEventListener('change', () => {
        void setProjectNotes(id, { [key]: input.value })
          .then((row) => {
            written = true;
            project = row;
            options.onChange?.();
            say(PROJECT_TEXT.saved);
          })
          .catch((cause: unknown) => {
            say(cause instanceof Error ? cause.message : String(cause), true);
          });
      });
      return el('div.project-sheet__field', {}, el('label', { htmlFor: fieldId, text: label }), input);
    };

    const sectionStatus = messageLine('project-section-status');
    const list = el(
      'div.list',
      { id: 'project-sections' },
      ...((project.sections ?? []).length === 0
        ? [el('p.muted', { text: PROJECT_TEXT.noSections })]
        : (project.sections ?? []).map((section, index) =>
            el(
              'div.row',
              { 'data-section': index },
              el('span', { text: sectionWords(section) }),
              button(PROJECT_TEXT.removeSection, () => {
                void removeProjectSection(id, index).then(changed, (cause: unknown) => {
                  sectionStatus.say(cause instanceof Error ? cause.message : String(cause), true);
                });
              }, { variant: 'quiet' }),
            ),
          )),
    );
    const number = (fieldId: string, label: string, name: string): [HTMLElement, HTMLInputElement] => {
      const input = el('input', { id: fieldId, type: 'number', min: 1, step: 1, ...(bars === undefined ? {} : { max: bars }), inputMode: 'numeric', 'aria-label': name }) as HTMLInputElement;
      input.style.width = '4.5em';
      return [el('label', { htmlFor: fieldId, text: label }), input];
    };
    const [fromLabel, from] = number('project-section-from', PROJECT_TEXT.sectionFrom, PROJECT_TEXT.sectionFirst);
    const [toLabel, to] = number('project-section-to', PROJECT_TEXT.sectionTo, PROJECT_TEXT.sectionLast);
    const name = el('input', { id: 'project-section-label', type: 'text' }) as HTMLInputElement;
    const add = button(
      PROJECT_TEXT.addSection,
      () => {
        void addProjectSection(id, { from: Number(from.value), to: Number(to.value), label: name.value }, bars).then(
          (row) => {
            // The list above shows the new section: no message needed.
            changed(row);
          },
          (cause: unknown) => {
            sectionStatus.say(cause instanceof Error ? cause.message : String(cause), true);
          },
        );
      },
      { id: 'project-section-add', variant: 'quiet' },
    );
    notes.replaceChildren(
      text('project-goal', PROJECT_TEXT.goal, project.goal, 'goal'),
      text('project-problem', PROJECT_TEXT.problem, project.problem, 'problem'),
      el('p.project-sheet__heading', { text: PROJECT_TEXT.sections }),
      list,
      el('div.row', {}, fromLabel, from, toLabel, to),
      el('div.project-sheet__field', {}, el('label', { htmlFor: 'project-section-label', text: PROJECT_TEXT.sectionName }), name),
      el('div.row', {}, add),
      sectionStatus,
    );
  }

  function draw(): void {
    stateLine.textContent = project ? projectSince(project.state, project.since, dayKey) : PROJECT_TEXT.none;
    stateLine.dataset.state = project?.state ?? 'none';
    const line = project ? projectHistoryLine(project.history, dayKey) : null;
    historyLine.hidden = line === null;
    historyLine.textContent = line ?? '';
    drawActions();
    drawNotes();
  }

  draw();
  void projectFor(target).then((row) => {
    if (written) return;
    project = row;
    draw();
  });
  void metLine(item, material, bars).then(
    (line) => {
      met.textContent = line;
    },
    () => {
      met.hidden = true;
    },
  );
  return sheet;
}
