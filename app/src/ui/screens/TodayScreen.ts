/**
 * Today (docs/04 §2): the screen the app opens on, and the one that answers
 * "what should I practise right now".
 *
 * The header measures the week, never the day. A daily streak punishes the
 * weekday the owner does not touch the piano, and the curriculum is explicit
 * that missing weekdays never breaks anything (docs/02 Part A §8) — so the
 * number on this screen is minutes this week against a weekly goal.
 *
 * Every row can be swapped, not just the whole card. That is the visible half
 * of `00` D21: a skill has several vehicles, some of them not songs, and being
 * told to play one particular tune is the thing that stalls a practice
 * session.
 */
import type { Router } from '../../router';
import { allItems, loadCurriculum } from '../../curriculum/load';
import { indexCatalog, type CatalogIndex } from '../../curriculum/selectors';
import type { CatalogItem, Curriculum, PassRecord } from '../../curriculum/types';
import {
  SESSION_TEMPLATES,
  buildSession,
  nextRecommended,
  playInstead,
  swapOptions,
  type SessionSlot,
} from '../../curriculum/session';
import {
  allProgress,
  getStreak,
  onProgressChange,
  reviewQueue,
  weekSoFar,
} from '../../data/progressStore';
import { getPlan } from '../../data/planStore';
import { getSettings, updateSettings } from '../../data/settingsStore';
import type { ProgressRow } from '../../data/db';
import { webMidiSource, micSource } from '../../app/services';
import { onScreenDispose } from '../screenLifecycle';
import { badge, button, chip, el, handsLabel, levelLabel, listRow, openSheet } from '../widgets';
import { screenFrame, statusLine } from './screenFrame';

const SLOT_LABELS: Record<SessionSlot['kind'], string> = {
  technique: 'Warm-up',
  review: 'Review',
  new: 'New',
  repertoire: 'Repertoire',
  jam: 'Jam',
  free: 'Free play',
  sightreading: 'Sight-reading',
};

function isWeekend(now = new Date()): boolean {
  const day = now.getDay();
  return day === 0 || day === 6;
}

/**
 * The session length for today (docs/04 §2: "remembers weekday vs weekend
 * choice").
 *
 * Stored in `PracticeSettings` rather than in a key of its own, so the picker
 * here and the two controls in Settings → Practice are the same value and not
 * two that drift apart.
 */
export function readSessionLength(now = new Date()): number {
  const settings = getSettings();
  return isWeekend(now) ? settings.weekendSessionMinutes : settings.weekdaySessionMinutes;
}

function writeSessionLength(minutes: number, now = new Date()): void {
  updateSettings(
    isWeekend(now) ? { weekendSessionMinutes: minutes } : { weekdaySessionMinutes: minutes },
  );
}

/** The follow input the app would use right now, for the chip (docs/04 §2). */
export function activeInputLabel(): { label: string; sub: 'midi' | 'mic' } {
  if (webMidiSource.inputs.length > 0) return { label: '🎹 MIDI', sub: 'midi' };
  if (micSource.state.connected) return { label: '🎤 Mic', sub: 'mic' };
  const settings = getSettings();
  return settings.defaultModeWithoutInput === 'wait'
    ? { label: '⌨ Screen keys', sub: 'midi' }
    : { label: '⏱ Timed', sub: 'midi' };
}

export function TodayScreen(router: Router): HTMLElement {
  const { section, header, body } = screenFrame('today', 'Today');
  const status = statusLine('today-status');

  let curriculum: Curriculum | null = null;
  let catalog: CatalogIndex | null = null;
  let items: CatalogItem[] = [];
  let progress: ProgressRow[] = [];
  let minutes = readSessionLength();
  let seed = 0;
  let slots: SessionSlot[] = [];
  let breakAfter: number | undefined;

  const goalLine = el('p.today-goal', { id: 'today-goal' });
  const inputChip = chip('…', {
    id: 'today-input',
    onClick: () => router.navigate('settings', activeInputLabel().sub),
  });
  const lengthRow = el('div.filter-row', { id: 'today-lengths' });
  for (const template of SESSION_TEMPLATES) {
    lengthRow.append(
      chip(`${String(template.minutes)} min`, {
        id: `today-length-${String(template.minutes)}`,
        pressed: template.minutes === minutes,
        onClick: () => {
          minutes = template.minutes;
          writeSessionLength(minutes);
          rebuild();
        },
      }),
    );
  }

  const card = el('div.list', { id: 'today-card' });
  const actions = el('div.row', { id: 'today-actions' });

  header.append(goalLine, el('div.row', {}, inputChip), lengthRow);
  body.append(card, actions, status);

  // --- rows ---------------------------------------------------------------

  function openItem(item: CatalogItem): void {
    if (item.kind === 'pdf') router.navigatePdf(item.id);
    else router.navigateScore(item.id);
  }

  function showSwapSheet(slotIndex: number): void {
    const slot = slots[slotIndex];
    if (!slot?.item || !curriculum || !catalog) return;
    const sheet = openSheet(`Instead of “${slot.item.title}”`, { id: 'today-swap' });
    let notASong = slot.kind === 'technique';

    const list = el('div.list');
    const drawOptions = (): void => {
      const options = swapOptions(slot, slots, curriculum as Curriculum, catalog as CatalogIndex, {
        excludeSongs: notASong,
        items,
      });
      list.replaceChildren();
      if (options.length === 0) {
        list.append(el('p.muted', { text: 'Nothing else at this level trains the same thing yet.' }));
        return;
      }
      for (const option of options) {
        list.append(
          listRow({
            title: option.title,
            meta: `${levelLabel(option.level)} · ${handsLabel(option.hands)} · ${option.type}`,
            dataset: { 'data-swap': option.id },
            onClick: () => {
              slots[slotIndex] = { ...slot, item: option, reason: 'You chose this one' };
              sheet.close();
              drawCard();
            },
          }),
        );
      }
    };

    // docs/04 §2: "half the point of the exercise breadth is that a skill can
    // be practised without a tune attached".
    const filter = chip('Not a song', {
      id: 'today-swap-notasong',
      pressed: notASong,
      onClick: () => {
        notASong = !notASong;
        filter.setAttribute('aria-pressed', String(notASong));
        drawOptions();
      },
    });
    sheet.body.append(el('div.row', {}, filter), list);
    drawOptions();
  }

  function rowFor(slot: SessionSlot, slotIndex: number): HTMLElement {
    if (!slot.item) {
      return listRow({
        title: SLOT_LABELS[slot.kind],
        subtitle: slot.reason,
        meta: `${String(slot.minutes)} min`,
        dataset: { 'data-slot': slot.kind },
      });
    }

    const item = slot.item;
    const substitute = curriculum && catalog ? playInstead(item, curriculum, catalog) : undefined;
    const badges: HTMLElement[] = [badge(SLOT_LABELS[slot.kind], slot.kind)];
    const row = progress.find((candidate) => candidate.itemId === item.id);
    if (row && row.status !== 'new') badges.push(badge(row.status, row.status));
    if (substitute) badges.push(badge('import needed', 'warn'));

    const actionButtons: HTMLElement[] = [
      button('Swap', () => showSwapSheet(slotIndex), { variant: 'quiet' }),
    ];
    if (substitute) {
      // Not a dead row: the item's own alternatives name what to play instead.
      actionButtons.push(
        button(`Play ${substitute.title}`, () => openItem(substitute), { variant: 'secondary' }),
      );
    } else {
      actionButtons.push(button('▶', () => openItem(item), { variant: 'primary' }));
    }

    return listRow({
      title: item.title,
      subtitle: slot.reason,
      meta: `${SLOT_LABELS[slot.kind]} · ${String(slot.minutes)} min · ${levelLabel(
        item.level,
      )} · ${handsLabel(item.hands)}`,
      badges,
      actions: actionButtons,
      onClick: substitute ? () => openItem(substitute) : () => openItem(item),
      dataset: { 'data-slot': slot.kind, 'data-item': item.id },
    });
  }

  function drawCard(): void {
    card.replaceChildren();
    slots.forEach((slot, slotIndex) => {
      card.append(rowFor(slot, slotIndex));
      if (breakAfter !== undefined && slotIndex === breakAfter - 1) {
        card.append(
          el('p.muted.today-break', {
            id: 'today-break',
            text: 'Take a break here — stand up, shake your hands out. The second half is repertoire-heavy.',
          }),
        );
      }
    });
  }

  function drawActions(): void {
    actions.replaceChildren(
      button(
        'Start session',
        () => {
          const first = slots.find((slot) => slot.item);
          if (first?.item) openItem(first.item);
          else status.textContent = 'Nothing in the card to start yet.';
        },
        { id: 'today-start', variant: 'primary' },
      ),
      button(
        'Shuffle options',
        () => {
          seed += 1;
          rebuild();
        },
        { id: 'today-shuffle' },
      ),
      button('Jump to…', () => router.navigate('plan'), { id: 'today-jump' }),
      button('Review a skill', () => router.navigate('plan', 'skills'), { id: 'today-skills' }),
      button('Metronome', () => router.navigate('today', 'metronome'), { id: 'today-metronome' }),
    );
  }

  // --- build --------------------------------------------------------------

  function rebuild(): void {
    if (!curriculum || !catalog) return;
    for (const template of SESSION_TEMPLATES) {
      document
        .getElementById(`today-length-${String(template.minutes)}`)
        ?.setAttribute('aria-pressed', String(template.minutes === minutes));
    }
    const records: PassRecord[] = progress.map((row) => ({
      itemId: row.itemId,
      passed: row.status === 'passed' || row.status === 'mastered',
      mastered: row.status === 'mastered',
    }));
    void getPlan().then((plan) => {
      const built = buildSession({
        curriculum: curriculum as Curriculum,
        catalog: catalog as CatalogIndex,
        items,
        records,
        dueForReview: reviewQueue(progress).map((entry) => entry.itemId),
        mastered: progress.filter((row) => row.status === 'mastered').map((row) => row.itemId),
        activeTracks: plan.trackOrder,
        minutes,
        seed,
        requireTwoSongs: getSettings().requireTwoSongs,
      });
      slots = built.slots;
      breakAfter = built.template.breakAfterSlot;
      drawCard();
      drawActions();

      const position = nextRecommended(curriculum as Curriculum, records, plan.trackOrder, {
        requireTwoSongs: getSettings().requireTwoSongs,
      });
      status.textContent = position
        ? `Working on Stage ${String(position.stageNumber)} · ${position.unit.title} · lesson ${
            position.lesson.id
          }`
        : 'Every lesson in the plan is complete. Pick anything from Library.';
    });
  }

  async function load(): Promise<void> {
    const [loadedCurriculum, loadedItems, rows, streak] = await Promise.all([
      loadCurriculum(),
      allItems(),
      allProgress(),
      getStreak(),
    ]);
    curriculum = loadedCurriculum;
    items = loadedItems;
    catalog = indexCatalog(loadedItems);
    progress = rows;

    const week = weekSoFar(streak);
    goalLine.textContent = `${String(Math.round(week.minutes))} of ${String(
      streak.weeklyGoalMinutes,
    )} minutes this week · ${String(week.days)} day${week.days === 1 ? '' : 's'} practised`;
    const input = activeInputLabel();
    inputChip.textContent = input.label;
    rebuild();
  }

  void load().catch((cause: unknown) => {
    status.textContent = `Today could not be built: ${String(cause)}`;
    status.classList.add('status--error');
  });

  const stopWatchingProgress = onProgressChange(() => {
    void allProgress().then((rows) => {
      progress = rows;
      rebuild();
    });
  });
  onScreenDispose(section, stopWatchingProgress);

  return section;
}
