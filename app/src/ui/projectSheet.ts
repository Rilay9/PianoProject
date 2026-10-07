/**
 * The project sheet (G1b item 5): where the learner says what they are doing with a piece.
 *
 * Opened from the Score screen's finish sheet (*What next with this piece?*, the first door), from a
 * project's row, or a passed piece's *Make it a project*, on Progress (the second), and from a piece's
 * Details in the Library (G85a). It shows the piece's title; its state and since, or that it is not a
 * project yet; the history's last line; what the encounter history says of the piece (read through
 * `encounterStore.familiarity`, never written); the actions offered for the piece now
 * (`projectStore.actionsFor`, over the store's own `readOffer`: from no project, *Keep it playable*
 * only for a piece the record says is passed, G96), drawn once with that line when both reads have
 * answered, so no offer is shown and then taken away; and, once there is a project, R18's three facts
 * as the learner types them. While the piece has no project it listens for the record: the finish
 * sheet is up while its run is still being stored, and a pass that lands then brings *Keep it
 * playable* in. Opening it writes nothing: a project is made only by the learner choosing one of the
 * actions, and every change after that is the learner's too.
 *
 * The one caller of `applyProjectAction` in the app (`projectLifecycle.test.ts` holds it so): no
 * screen, job or reader moves a project by itself.
 */
import { button, el, openSheet, type Sheet } from './widgets';
import { onScreenDispose } from './screenLifecycle';
import { PROJECT_TEXT, playedLine, projectHistoryLine, projectSince, sectionWords } from './help';
import { familiarity } from '../data/encounterStore';
import { dayKey, onProgressChange } from '../data/progressStore';
import {
  actionsFor,
  addProjectSection,
  applyProjectAction,
  readOffer,
  removeProjectSection,
  setProjectNotes,
  type OfferReading,
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
  /**
   * Where focus goes on closing when the screen drew its list again behind the sheet and the control
   * it opened from is gone (G96): the piece's row as that screen's own list shows it now
   * (`widgets.openSheet`'s `refocus`). The Library and Progress, whose lists a write redraws.
   */
  refocus?: () => HTMLElement | null;
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
  const sheet = openSheet(item.title, { id: 'project-sheet', ...(options.refocus ? { refocus: options.refocus } : {}) });
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
  /**
   * Whether the record says the piece is passed, as the store read it with the project (`readOffer`);
   * `undefined` until that read has answered, and nothing is offered before it (G96): a piece never
   * played is never shown *Keep it playable* and then loses it.
   */
  let passed: boolean | undefined;
  /**
   * The newest read or write: a read that answers after a newer one, or after a write, is older than
   * what is drawn, and is not taken.
   */
  let latest = 0;

  const say = status.say;

  /** The store's reading of the offers, taken where nothing newer has answered since it was asked. */
  const read = async (): Promise<void> => {
    const asked = ++latest;
    const reading = await readOffer(target).catch((): OfferReading => ({ project: undefined, passed: false }));
    if (asked !== latest) return;
    project = reading.project;
    passed = reading.passed;
  };

  const changed = (row: ProjectRow): void => {
    latest += 1;
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
      await read();
      draw();
    }
  }

  function drawActions(): void {
    if (project === undefined && passed === undefined) {
      actions.replaceChildren();
      return;
    }
    const offered = actionsFor(project?.state, passed ?? false);
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
            latest += 1;
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
  // The sheet's two reads, drawn together once both have answered: the project with the offers, and
  // what the history says of the piece.
  void Promise.all([
    read(),
    metLine(item, material, bars).then(
      (line) => {
        met.textContent = line;
      },
      () => {
        met.hidden = true;
      },
    ),
  ]).then(draw);

  // The Score screen's finish sheet is up while its run is still being stored (its `save` is not
  // awaited), so its door can open this before the pass is on the record: while the piece has no
  // project, a change to the record reads the offers again (G96; the reviewer's approval, so a
  // just-passed run never misses *Keep it playable*). Heard until the sheet leaves the page, however it
  // closes.
  const stopListening = onProgressChange(() => {
    if (project !== undefined) return;
    void read().then(draw);
  });
  const leaving = new MutationObserver(() => {
    if (sheet.el.isConnected) return;
    stopListening();
    leaving.disconnect();
  });
  leaving.observe(document.body, { childList: true });
  return sheet;
}
