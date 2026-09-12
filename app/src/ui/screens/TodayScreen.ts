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
 *
 * ## What this screen is for, in order
 *
 * The same pass the Plan screen had, with the same four weights. Read back off
 * the phone at 342 px the card said everything at one volume: five identical
 * cards, each with a badge repeating the words its own second line opened with
 * (`Warm-up` over "Warm-up in the keys you are working in"), each with the
 * title — the name of the thing you would play — cut to `Posture and
 * hand-shape …` so that `Swap` and `▶` could sit beside it, and the one filled
 * button on the screen 679 px down a 740 px phone.
 *
 *  1. **The session, in order, and the button that starts it.** *Start
 *     session* is the one filled box (`04` §0 R3) and it is now above the card
 *     rather than under five rows of it — it was off the bottom of the screen
 *     both ways round, which is a strange place for the thing you came to do.
 *  2. **Each row's name.** The title takes a second line rather than an
 *     ellipsis. Half a title is not a name, and this is the row you tap.
 *  3. **What it costs and what it is for** — `Warm-up · 8 min · L0.1`, one
 *     muted line. The slot kind moved off its own badge line and into the
 *     front of this one: it was a badge on every single row, which is a badge
 *     that distinguishes nothing, and it cost the row the line the title now
 *     has. A badge is left for what the line does *not* say — that you have
 *     started or passed this, or that it needs importing.
 *  4. **Why it is here, and the ways to change the day** — the reason line,
 *     *Shuffle options*, *Jump to…*, *Metronome*, which move below the card
 *     the way Plan's occasional links moved below its list.
 */
import type { Router } from '../../router';
import { allItems, loadCurriculum } from '../../curriculum/load';
import { indexCatalog, type CatalogIndex } from '../../curriculum/selectors';
import { activeTracksFor } from '../../curriculum/tracks';
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
import { badge, button, chip, el, handsLabel, levelLabel, listRow, openSheet, shortHandsLabel } from '../widgets';
import { openItem } from '../openItem';
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

  // Which day this screen's session length belongs to, decided once and held
  // for the screen's whole life rather than re-asked of the clock on every
  // read. Without this, a screen opened Friday night and left open (the tab
  // kept in the background, not rebuilt) drifted past midnight: `minutes` was
  // still the weekday figure, but a tap on a length chip re-read `new Date()`
  // at click time and filed that weekday figure under `weekendSessionMinutes`
  // — the day the practice session started, not the day the tap landed. One
  // `now`, read once, is what the screen's chips and its write agree on.
  const now = new Date();

  let curriculum: Curriculum | null = null;
  let catalog: CatalogIndex | null = null;
  let items: CatalogItem[] = [];
  let progress: ProgressRow[] = [];
  let minutes = readSessionLength(now);
  let seed = 0;
  let slots: SessionSlot[] = [];
  let actionsDrawn = false;
  let breakAfter: number | undefined;

  const goalLine = el('p.today-goal', { id: 'today-goal' });
  const inputChip = chip('…', {
    id: 'today-input',
    onClick: () => router.navigate('settings', activeInputLabel().sub),
  });
  function showInput(): void {
    inputChip.textContent = activeInputLabel().label;
  }

  const lengthRow = el('div.filter-row', { id: 'today-lengths' });
  for (const template of SESSION_TEMPLATES) {
    lengthRow.append(
      chip(`${String(template.minutes)} min`, {
        id: `today-length-${String(template.minutes)}`,
        pressed: template.minutes === minutes,
        onClick: () => {
          minutes = template.minutes;
          writeSessionLength(minutes, now);
          rebuild();
        },
      }),
    );
  }

  const card = el('div.list', { id: 'today-card' });
  const actions = el('div.row.today-start-row', { id: 'today-actions' });
  // The three that change the day rather than start it. Below the card, the
  // way Plan's placement test and how-to-practise links moved below its list:
  // read occasionally, and none of them the reason the screen is open.
  const tools = el('div.plan-links', { id: 'today-tools' });

  // Title and the input chip share a line; the goal and the length chips take
  // one each under it. Three short rows rather than four wrapping ones, so the
  // session card — the subject — starts inside the first screenful (`04` §0 R1).
  header.querySelector('h1')?.classList.add('today-title');
  const titleRow = el('div.today-titlerow');
  const heading = header.querySelector('h1');
  if (heading) titleRow.append(heading, inputChip);
  header.prepend(titleRow);
  header.append(goalLine, lengthRow);
  // The thing you came to do, then the card that says what it will be, then
  // the message about it, then the three ways to change the day.
  //
  // `Start session` used to be under the card: 679 px down a 740 px phone
  // upright, and off the bottom entirely sideways. The one filled box on the
  // screen the app opens on (`04` §0 R3) was the one thing you had to scroll
  // to find. The card still starts inside the first screenful (R1) — the
  // button is one row of 40 px, and the card was starting at 198.
  body.append(actions, card, status, tools);

  // --- rows ---------------------------------------------------------------

  const open = (target: CatalogItem): void => void openItem(router, target);

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
            meta: `${levelLabel(option.level, option.levelSource)} · ${handsLabel(option.hands)} · ${option.type}`,
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
      // The free-play prompt, and it is a prompt rather than a row.
      //
      // It was a `listRow` — the same card, the same border, the same size as
      // the four above it — with no `onClick`, no actions and nothing to
      // press. That is the Plan screen's dead-control fault in its quietest
      // form: a thing drawn exactly like four tappable things, which does
      // nothing at all when tapped. Every word it carried is still here; what
      // has gone is the costume.
      return el(
        'div.today-prompt',
        { 'data-slot': slot.kind },
        el('div.today-prompt__title', { text: SLOT_LABELS[slot.kind] }),
        el('p.today-prompt__text', { text: `${String(slot.minutes)} min · ${slot.reason}` }),
      );
    }

    const item = slot.item;
    const substitute = curriculum && catalog ? playInstead(item, curriculum, catalog) : undefined;
    // Only what the detail line does not already say (`04` §0 R2). The slot
    // kind is the first fact *on* that line now; as a badge as well it was on
    // every row of the card — a mark that never distinguishes one row from
    // another — and it took the fourth line that the title needed in order to
    // stop being cut in half.
    const badges: HTMLElement[] = [];
    const row = progress.find((candidate) => candidate.itemId === item.id);
    if (row && row.status !== 'new') badges.push(badge(row.status, row.status));
    if (substitute) badges.push(badge('import needed', 'warn'));

    const actionButtons: HTMLElement[] = [
      button('Swap', () => showSwapSheet(slotIndex), { variant: 'quiet' }),
    ];
    if (substitute) {
      // Not a dead row: the item's own alternatives name what to play instead.
      actionButtons.push(
        button(`Play ${substitute.title}`, () => open(substitute), { variant: 'secondary' }),
      );
    } else {
      actionButtons.push(
        // Not primary: R3 wants one thing to do on a screen, and with a blue
        // button on every row "Start session" was the fifth blue thing on
        // Today rather than the first.
        button('▶', () => open(item), { ariaLabel: `Open ${item.title}` }),
      );
    }

    return listRow({
      title: item.title,
      subtitle: slot.reason,
      // `04` §0 R2: one line that fits. "Hands together" on every row is three
      // words that never distinguish anything, so it leaves and the line stops
      // wrapping. The slot kind leads, because a row's first question is what
      // it is *for* — and because it used to be a badge on a line of its own,
      // on every row, saying the same word the reason line under the title
      // opens with.
      meta: [
        SLOT_LABELS[slot.kind],
        `${String(slot.minutes)} min`,
        levelLabel(item.level, item.levelSource),
        shortHandsLabel(item.hands),
      ]
        .filter(Boolean)
        .join(' · '),
      badges,
      actions: actionButtons,
      onClick: substitute ? () => open(substitute) : () => open(item),
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
          if (first?.item) open(first.item);
          else status.textContent = 'Nothing in the card to start yet.';
        },
        { id: 'today-start', variant: 'primary' },
      ),
    );
    // `04` §0 R3, weight by frequency: one filled box on the screen, and text
    // for the rest. `Review a skill` and `How to practise` have left for Plan,
    // which is where they belong and where they already are — six boxes of
    // equal weight is no weighting. `Shuffle options` was the last of these
    // still drawn as a box; it is done once in a while, on a card you have
    // already been given, so it reads as text like the other two.
    tools.replaceChildren(
      button(
        'Shuffle options',
        () => {
          seed += 1;
          rebuild();
        },
        { id: 'today-shuffle', variant: 'quiet' },
      ),
      el('span.plan-sep', { text: '·', 'aria-hidden': 'true' }),
      button('Jump to…', () => router.navigate('plan'), { id: 'today-jump', variant: 'quiet' }),
      el('span.plan-sep', { text: '·', 'aria-hidden': 'true' }),
      button('Metronome', () => router.navigate('today', 'metronome'), {
        id: 'today-metronome',
        variant: 'quiet',
      }),
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
      // The same active set Plan and Settings show, so the three screens
      // cannot disagree about what is switched on.
      const active = activeTracksFor(plan, curriculum as Curriculum);
      const built = buildSession({
        curriculum: curriculum as Curriculum,
        catalog: catalog as CatalogIndex,
        items,
        records,
        dueForReview: reviewQueue(progress).map((entry) => entry.itemId),
        mastered: progress.filter((row) => row.status === 'mastered').map((row) => row.itemId),
        activeTracks: active,
        minutes,
        seed,
        requireTwoSongs: getSettings().requireTwoSongs,
        strictPrerequisites: getSettings().strictPrerequisites,
      });
      slots = built.slots;
      breakAfter = built.template.breakAfterSlot;
      drawCard();
      // Once, after the first session exists. Nothing in the row depends on
      // the session, so redrawing it on every rebuild only threw away whichever
      // button a finger had just landed on — but drawing it *before* the first
      // build put `Start session` on screen with nothing to start.
      if (!actionsDrawn) {
        drawActions();
        actionsDrawn = true;
      }

      const position = nextRecommended(curriculum as Curriculum, records, active, {
        requireTwoSongs: getSettings().requireTwoSongs,
        strictPrerequisites: getSettings().strictPrerequisites,
      });
      // The rung's name, not its id. `lesson 0.1` is an internal key that means
      // nothing to a person, and it was printed here beside the unit's title —
      // which on all but two rungs in the curriculum is the lesson's title
      // again (`00` D26). One name, no id; the Plan screen says the same thing
      // the same way on its `Next up` card.
      status.textContent = position
        ? `Working on Stage ${String(position.stageNumber)} · ${position.lesson.title}`
        : 'Every lesson in the plan is complete. Pick anything from Library.';
      // The rung's id in data, where a test can read it and a learner cannot.
      //
      // It used to be in the sentence above, which is why it was removed. But a
      // test did need it: `today.spec`'s "keeps recommending after the core
      // path" finished every core lesson and then checked that what Today
      // offered next was *not* one of them, and the only way it could name the
      // recommendation was to parse `lesson 0.1` out of the prose. Taking the
      // id off the screen broke it. An id belongs in an attribute, and a test
      // that reads one is not depending on wording.
      if (position) status.dataset.lesson = position.lesson.id;
      else delete status.dataset.lesson;
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
    // Short enough not to wrap at 360 px (`04` §0 R2). Progress says it in
    // full; this is the glance version, above four chips and a session card.
    goalLine.textContent = `${String(Math.round(week.minutes))} / ${String(
      streak.weeklyGoalMinutes,
    )} min this week · ${String(week.days)} day${week.days === 1 ? '' : 's'}`;
    showInput();
    rebuild();
  }


  void load().catch((cause: unknown) => {
    status.textContent = `Today could not be built: ${String(cause)}`;
    status.classList.add('status--error');
  });

  /**
   * The chip follows the piano, instead of guessing once and being wrong.
   *
   * `autoConnectMidi()` is started and not awaited (`main.ts`), and it awaits a
   * permission query and then the MIDI access itself — so on a cold start with
   * the HP-130 plugged in and permission long since granted, `webMidiSource`
   * has no inputs yet at the moment this screen reads it. The chip then said
   * **Timed** or **Screen keys** for the whole visit over a connected piano,
   * and tapping it went to the wrong settings page. No test can see it: there
   * is no Web MIDI in jsdom or in a headless runner, so the fixture always
   * takes the "no input" branch and the race does not exist there.
   */
  const stopWatchingInput = [
    webMidiSource.onStateChange(() => showInput()),
    micSource.onStateChange(() => showInput()),
  ];
  onScreenDispose(section, () => {
    for (const stop of stopWatchingInput) stop();
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
