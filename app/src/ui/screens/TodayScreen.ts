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
import type { Router, TodaySlot } from '../../router';
import { allItems, loadCurriculum } from '../../curriculum/load';
import { findLesson, indexCatalog, type CatalogIndex } from '../../curriculum/selectors';
import { activeTracksFor } from '../../curriculum/tracks';
import type { CatalogItem, Curriculum } from '../../curriculum/types';
import { loadRungStates } from '../../data/rungStates';
import {
  SESSION_TEMPLATES,
  buildSession,
  contactAssumption,
  nextRecommended,
  playInstead,
  readerPosition,
  readingOffer,
  swapOptions,
  type ReadingOffer,
  type SessionSlot,
} from '../../curriculum/session';
import {
  allProgress,
  contactSummaries,
  dailyReadDays,
  dailyReadStreak,
  dayKey,
  getStreak,
  onProgressChange,
  readToday,
  learnedPieces,
  rungRows,
  sessionsForItem,
  weekSoFar,
  type ContactHistory,
} from '../../data/progressStore';
import { allEncounters } from '../../data/encounterStore';
import { allProjects, projectIn, type ProjectRow } from '../../data/projectStore';
import { isSightReading } from '../../engine/drills/fromCatalog';
import { simonForStage } from '../../engine/drills/simon';
import { getPlan } from '../../data/planStore';
import { clearOfferSnapshot, newOfferToken, writeOfferSnapshot } from '../../data/offerSnapshot';
import { materialOfItem } from '../../curriculum/material';
import { getSettings, updateSettings } from '../../data/settingsStore';
import type { ProgressRow, SessionRow } from '../../data/db';
import {
  applySessionEvent,
  closeSessionRun,
  compositionVersion,
  isOpen,
  newRun,
  onSessionRunChange,
  plannedMinutes,
  readSessionRun,
  startSessionRun,
  withdrawnOf,
  type ActivityEntry,
  type OutsideEntry,
  type RunActivity,
  type SessionRun,
} from '../../data/sessionRun';
import { cameTo, minutesOf, newActivityToken, openActivity, openOutside, settleHeld, showsReason } from '../sessionRunner';
import { cardLine, PROJECT_TEXT, readingReason, readingTitle, SESSION_TEXT, swapChoiceWords, swapTierWords } from '../help';
import { webMidiSource, micSource } from '../../app/services';
import { onScreenDispose } from '../screenLifecycle';
import { badge, button, chip, el, handsLabel, levelLabel, listRow, openSheet, shortHandsLabel } from '../widgets';
import { openItem, targetFor } from '../openItem';
import type { TodayCardView } from '../../app/testHooks';
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
 * A swap option's project state (G94), in the project sheet's words — *Paused*, *Put away* — with the state in
 * `data-project`. The Library's badge (G85, `LibraryScreen.projectBadge`) in shape: plain, not `passed`, since a
 * ✓ beside a stated intention would say the learner achieved something.
 */
function lifecycleBadge(project: ProjectRow): HTMLElement {
  const node = badge(PROJECT_TEXT.states[project.state], 'project');
  node.dataset.project = project.state;
  return node;
}

/**
 * A row of the session card as Today draws it (U63; the reviewer's ruling on the row budget,
 * `responses/questions-71bd6cee.md`).
 *
 * At 342 px the reason was one line cut after about thirty characters, and the cut fell on the clause that
 * decides it (*Keeping this piece playable —…*, *Next lesson — this one waits f…*), because the claim comes
 * first and the detail after the dash. Now it takes up to two compact lines (`.today-row__reason`). The line it
 * needs comes from the badge, which leaves its own line under the detail and sits above *Swap* and ▶ instead
 * (`.today-row__side`): *✓ passed* or *Next* is context, and the ruling ranks it below the row's name and its
 * reason. The title keeps its two lines.
 *
 * Today's own arrangement of `listRow`'s parts, nothing else's: the Library and Progress rows keep their badge
 * line. The badge stays out of `.list-row__actions`, so a tap on it is a tap on the row, as before.
 */
function onTheCard(row: HTMLElement): HTMLElement {
  row.classList.add('today-row');
  row.querySelector('.list-row__sub')?.classList.add('today-row__reason');
  const badges = row.querySelector('.list-row__badges');
  const actions = row.querySelector('.list-row__actions');
  if (badges && actions) {
    const side = el('div.today-row__side');
    actions.replaceWith(side);
    side.append(badges, actions);
  }
  return row;
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
  /** The days the daily sight-read has been finished on, newest last. */
  let dailyDays: string[] = [];
  /** Which generated reading exercise today's phrase comes out of. */
  let dailyTarget: CatalogItem | null = null;
  /**
   * Today's read as the reader chose it (C4): the row, the recipe, the day's
   * seed, and why — from the evidence the learner's reads stored.
   */
  let dailyOffer: ReadingOffer | null = null;
  /** The learner's stored runs of the reading rows: what the reader reads (C4). */
  let readingRows: SessionRow[] = [];
  /** The rung the card was built from (C6): what the swap sheet holds its options to. */
  let learnerRung: string | undefined;
  /** The stored runs the card was built from: the learner's skills, the gate's first question on the swap sheet (E0). */
  let learnerRows: SessionRow[] = [];
  // The rungs the learner has reached, as the session read them: their own path, for the sheet's gate (E0a).
  let learnerReached: string[] = [];
  /** The contact history the card was built from (G2 item 6): what a swapped-in item's contact assumption reads (X1). */
  let learnerContact: ContactHistory = {};
  /** The learner's projects the card was built from (G1d): what the swap sheet marks a paused or put-away option by (G94). */
  let learnerProjects: readonly ProjectRow[] = [];
  /**
   * The composed card's offer instance (D4a): minted each time the card is composed and again when its
   * transfer offer's row is swapped away, kept with the offer Today opens (`data/offerSnapshot.ts`) and
   * carried by its route (`?offer=`), so a route issued for one composition never consumes another's
   * relationship. A recomposed card is a new teaching decision even where it lands on the same item.
   */
  let cardToken = '';
  /**
   * Set when the transfer offer is tapped: the snapshot is on its way and the screen is leaving. A
   * composition that lands after that (a rebuild already in flight) must not clear the offer just kept,
   * and a second tap must not open it twice.
   */
  let leaving = false;
  /**
   * Today's session as it is being run (X1, `data/sessionRun.ts`): today's record, open or closed today, or
   * none. While it is open the card is the run's — the composition as it was when *Start session* was pressed,
   * each row with what became of it — never the card composed since, so new evidence never rebuilds a running
   * lesson; the button is *Continue*. Closed today (finished or ended), the finish line says what happened.
   */
  let run: SessionRun | null = null;

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
          // Another length is another card: a running session is closed as recomposed (X1), never rebuilt.
          void recompose().then(rebuild);
        },
      }),
    );
  }

  const card = el('div.list', { id: 'today-card' });
  /**
   * Today's sight-read (`04` §2): one card, one phrase, one run of days.
   *
   * A card of its own rather than a sixth row of the session card, because it
   * is not part of the session: it is there whatever length was chosen, it is
   * the same three minutes every day, and it is the one thing on this screen
   * measured in *days in a row* rather than minutes this week. Putting it in
   * the card would also have made it swappable, and a daily read you can swap
   * for something else is not a daily read.
   */
  const dailyCard = el('div.list', { id: 'today-daily' });
  const actions = el('div.row.today-start-row', { id: 'today-actions' });
  // The two that change the day rather than start it. Below the card, the
  // way Plan's placement test and how-to-practise links moved below its list:
  // read occasionally, and neither of them the reason the screen is open.
  const tools = el('div.plan-links', { id: 'today-tools' });
  /**
   * The doors: the things you can open without a session (`04` §2).
   *
   * The owner, on the modes built this week: *"how are people going to open it
   * up? There's got to be a link somewhere."* They are here because Today is
   * the screen the app opens on and the only one you reach without deciding
   * anything first. A second line rather than seven links on one, because the
   * two above act on the card directly over them and these five do not — one
   * row of seven `·`-separated words is a wall, and the wall would have hidden
   * exactly the new thing it exists to advertise.
   */
  const doors = el('div.plan-links', { id: 'today-doors' });
  /**
   * Which Simon this learner gets — the white keys of C, or every key.
   *
   * `simonForStage` decides it from the same stage number the session card is
   * built against, so the door offers whichever of the two the plan would
   * have offered at this rung (`04` §5c-2).
   */
  let simonId = simonForStage(1);

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
  // the message about it, then the two ways to change the day, then the doors.
  //
  // `Start session` used to be under the card: 679 px down a 740 px phone
  // upright, and off the bottom entirely sideways. The one filled box on the
  // screen the app opens on (`04` §0 R3) was the one thing you had to scroll
  // to find. The card still starts inside the first screenful (R1) — the
  // button is one row of 40 px, and the card was starting at 198.
  body.append(actions, card, dailyCard, status, tools, doors);

  // --- rows ---------------------------------------------------------------

  /**
   * A new offer instance for the card (D4a), and whatever offer was kept before it cleared: the card was
   * composed again, or its transfer row swapped away. Not once the offer has been tapped — the snapshot
   * written then is the one the route about to open names.
   */
  function supersedeOffer(): void {
    if (leaving) return;
    cardToken = newOfferToken();
    void clearOfferSnapshot().catch(() => undefined);
  }

  /**
   * Opens a card's item with the rung the run is for and the slot it fills
   * (C3 item 0b, L50), each its own route parameter and never `from`, which
   * would also send Back to the rung's page. Only the Score screen reads them;
   * a drill or a PDF opens as it always did.
   */
  const open = (target: CatalogItem, slot: SessionSlot): void => {
    // A skill-retention review's phrase (C6): the recipe that writes the skill's demand, held to
    // the learner's rung, which judges it; a fresh seed, as every open of a reading row draws.
    const phrase = slot.phrase && slot.item?.id === target.id ? slot.phrase : undefined;
    if (phrase && targetFor(target) === 'score') {
      router.navigateScore(target.id, {
        ...(phrase.rung === undefined ? {} : { rung: phrase.rung }),
        slot: slot.kind,
        recipe: {
          ...(phrase.recipe.moved === undefined ? {} : { moved: phrase.recipe.moved }),
          ...(phrase.recipe.easy === true ? { easy: true as const } : {}),
        },
      });
      return;
    }
    // The transfer offer (D4): offered from no rung's ask, so no rung judges its run and none is
    // credited by listing it. The offer as shown — the session's own claim, never recomputed — is kept
    // with the card's token before the route opens (D4a), and the route names that offer, so the run
    // records the relationship this card was made on or, where the snapshot is gone, no transfer at all.
    const transfer = slot.claim?.kind === 'transfer' && slot.item?.id === target.id ? slot.claim : undefined;
    if (transfer && targetFor(target) === 'score') {
      if (leaving) return;
      leaving = true;
      const offer = cardToken;
      const material = materialOfItem(target);
      const opening = writeOfferSnapshot({
        token: offer,
        itemId: target.id,
        skill: transfer.skill,
        ...(material === undefined ? {} : { material }),
        relationship: transfer.relationship,
        contact: transfer.contact,
        offeredOn: dayKey(now),
      });
      // Only once it is kept. A write that failed opens nothing (U73): it used to open the route all the
      // same, and the Score screen then said "This offer is no longer on today's card", which was untrue of a
      // write that failed. The error is said here, on Today, and the row can be tapped again.
      void opening.then(
        () => {
          router.navigateScore(target.id, { slot: slot.kind, intent: { intent: 'transfer', skill: transfer.skill, offer } });
        },
        () => {
          leaving = false;
          status.textContent = SESSION_TEXT.offerNotKept;
          status.classList.add('status--error');
        },
      );
      return;
    }
    const rung = transfer ? undefined : curriculum ? rungForSlot(curriculum, target, slot.lessonId) : undefined;
    // A drill carries the rung too (C5): it judges the drill's run.
    if (targetFor(target) === 'drill') {
      if (rung === undefined) router.navigateDrill(target.id);
      else router.navigateDrill(target.id, { rung });
      return;
    }
    if (targetFor(target) !== 'score') {
      void openItem(router, target);
      return;
    }
    // The reading slot's phrase, exactly (C4): its seed and its recipe. Only
    // while the row is the reader's: a swap replaces the item, and a recipe
    // written for one row means nothing on another.
    const reading = slot.reading?.item.id === target.id ? slot.reading : undefined;
    router.navigateScore(target.id, {
      ...(rung === undefined ? {} : { rung }),
      slot: slot.kind,
      ...(reading ? { seed: reading.seed, recipe: routeRecipeOf(reading) } : {}),
    });
  };

  /**
   * The project of an option the learner paused or put away, if it has one (G94; the reviewer's ruling,
   * `responses/9fce3792.md`): looked up as the session, the lesson page and the Library look a piece up, by its
   * material and then its id. Any other state is not marked: the sheet is the learner's own menu, and only a
   * piece no automatic chooser would offer must not look like one.
   */
  function heldProject(choice: CatalogItem): ProjectRow | undefined {
    const project = projectIn(learnerProjects, { itemId: choice.id, material: materialOfItem(choice) });
    return project?.state === 'paused' || project?.state === 'retired' ? project : undefined;
  }

  /**
   * The swap sheet for one row: the live card's (`onCard` its slots) or a running session's activity (X1:
   * the card is the run's, and the choice replaces that activity with a new token). `chosen` does the rest.
   */
  function showSwapSheet(slot: SessionSlot | undefined, onCard: readonly SessionSlot[], chosen: (choice: CatalogItem, tier: Parameters<typeof swapChoiceWords>[0]) => void): void {
    if (!slot?.item || !curriculum || !catalog) return;
    const sheet = openSheet(`Instead of “${slot.item.title}”`, { id: 'today-swap' });
    let notASong = slot.kind === 'technique';

    const list = el('div.list');
    const drawOptions = (): void => {
      const options = swapOptions(slot, [...onCard], curriculum as Curriculum, catalog as CatalogIndex, {
        excludeSongs: notASong,
        items,
        ...(learnerRung === undefined ? {} : { rung: learnerRung }),
        // The learner's skills as well as their rung, so the gate asks both halves of its first question (E0).
        rows: learnerRows,
        reached: learnerReached,
        today: new Date(),
      });
      list.replaceChildren();
      if (options.length === 0) {
        list.append(el('p.muted', { text: 'Nothing else trains the same thing yet.' }));
        return;
      }
      // Each tier's claim once, over the options it gave (C6): the same lesson, trains the same
      // skill, carries the same demand — why each one is an alternative at all.
      let heading = '';
      for (const option of options) {
        const words = swapTierWords(option.tier, option.shared);
        if (words !== heading) {
          heading = words;
          list.append(el('p.muted.today-swap-tier', { text: words, 'data-tier': option.tier }));
        }
        const choice = option.item;
        const held = heldProject(choice);
        list.append(
          listRow({
            title: choice.title,
            meta: `${levelLabel(choice.level, choice.levelSource)} · ${handsLabel(choice.hands)} · ${choice.type}`,
            badges: held ? [lifecycleBadge(held)] : [],
            // The learner's choice, honoured as any swap is: nothing here writes the project (G94).
            dataset: { 'data-swap': choice.id, 'data-tier': option.tier },
            onClick: () => {
              sheet.close();
              chosen(choice, option.tier);
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
    // Done in today's session (X1): a completed activity is never offered as untouched, on a card composed
    // after the session ended or finished. *Done today* only where its run counted (X46, `cameTo`); one a run
    // completed without counting has its item's own state beside it (*started*), which is not untouched either.
    const doneToday = run !== null && run.day === dayKey(now) && run.activities.some((activity) => cameTo(activity) === 'done' && activity.slot.itemId === item.id);
    if (doneToday) badges.push(badge(SESSION_TEXT.doneToday, 'passed'));
    else if (row && row.status !== 'new') badges.push(badge(row.status, row.status));
    if (substitute) badges.push(badge('import needed', 'warn'));

    const actionButtons: HTMLElement[] = [
      button(
        'Swap',
        () =>
          showSwapSheet(slots[slotIndex], slots, (choice, tier) => {
            // The transfer offer swapped away (D4a): no longer on the card, so whatever was kept of
            // it is superseded, and the card's offer instance is another.
            if (slot.claim?.kind === 'transfer') supersedeOffer();
            // The learner's choice, and the claim the option had; what chose the row before no longer applies.
            const { claim: _claim, phrase: _phrase, contact: _contact, ...rest } = slot;
            slots[slotIndex] = { ...rest, item: choice, reason: swapChoiceWords(tier), contact: contactOfChoice(choice, slot.kind) };
            drawCard();
          }),
        { variant: 'quiet' },
      ),
    ];
    if (substitute) {
      // Not a dead row: the item's own alternatives name what to play instead.
      actionButtons.push(
        button(`Play ${substitute.title}`, () => open(substitute, slot), { variant: 'secondary' }),
      );
    } else {
      actionButtons.push(
        // Not primary: R3 wants one thing to do on a screen, and with a blue
        // button on every row "Start session" was the fifth blue thing on
        // Today rather than the first.
        button('▶', () => open(item, slot), { ariaLabel: `Open ${item.title}` }),
      );
    }

    // The reading row plays its recipe's hands, and says so (C4).
    const reading = slot.reading?.item.id === item.id ? slot.reading : undefined;
    const hands = reading?.recipe.moved?.hands ?? item.hands;
    return onTheCard(listRow({
      title: reading ? readingTitle(item.title, item.hands, reading.recipe) : item.title,
      // The composition's words, whole — but the transfer offer's cut at its clause (U71). Up to two lines on
      // the glass (U63, `onTheCard`).
      subtitle: cardLine(slot.reason, slot.claim),
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
        shortHandsLabel(hands),
      ]
        .filter(Boolean)
        .join(' · '),
      badges,
      actions: actionButtons,
      onClick: substitute ? () => open(substitute, slot) : () => open(item, slot),
      dataset: {
        'data-slot': slot.kind,
        'data-item': item.id,
        // What chose it (C6), in data where a test can read it and a learner cannot.
        ...(slot.claim ? { 'data-claim': slot.claim.kind } : slot.reading ? { 'data-claim': 'reader' } : {}),
      },
    }));
  }

  // --- today's session, run (X1) ------------------------------------------

  /** The contact assumption of an item the learner swapped in, through G2's one adapter (`contactAssumption`). */
  function contactOfChoice(choice: CatalogItem, kind: SessionSlot['kind']): SessionSlot['contact'] {
    return contactAssumption({ rows: learnerRows, readingRows, contact: learnerContact }, kind, choice, undefined);
  }

  /**
   * One card row as a session activity: the slot as composed, the route Today would open it by, the
   * composition's own words and its contact assumption. Only the two target forms whose screens have an
   * honest finish are activities (the protocol): a Score-screen run and a drill; anything else — a PDF, a
   * placeholder — is no guided activity and stays outside the cursor.
   */
  function activityEntryFor(slot: SessionSlot, order: number): ActivityEntry | undefined {
    const item = slot.item;
    if (!item || !curriculum) return undefined;
    const target = targetFor(item);
    if (target !== 'score' && target !== 'drill') return undefined;
    // The guided tour's steps leave the drill screen for the Score screen and come back without the token, so
    // the screen that owns its finish cannot report it: no honest completion signal in X1.
    if (item.drill?.kind === 'walkthrough') return undefined;
    const phrase = target === 'score' && slot.phrase && slot.item?.id === item.id ? slot.phrase : undefined;
    const transfer = target === 'score' && slot.claim?.kind === 'transfer' ? slot.claim : undefined;
    const reading = target === 'score' && slot.reading?.item.id === item.id ? slot.reading : undefined;
    const rung = transfer ? undefined : phrase ? phrase.rung : rungForSlot(curriculum, item, slot.lessonId);
    const material = transfer ? materialOfItem(item) : undefined;
    const recipe = phrase
      ? { ...(phrase.recipe.moved === undefined ? {} : { moved: phrase.recipe.moved }), ...(phrase.recipe.easy === true ? { easy: true as const } : {}) }
      : reading
        ? routeRecipeOf(reading)
        : undefined;
    return {
      order,
      token: newActivityToken(),
      slot: {
        kind: slot.kind,
        itemId: item.id,
        title: reading ? readingTitle(item.title, item.hands, reading.recipe) : item.title,
        minutes: slot.minutes,
        ...(slot.claim ? { claim: claimFacts(slot.claim) } : reading ? { claim: { kind: 'reader' } } : {}),
        ...(slot.lessonId === undefined ? {} : { lessonId: slot.lessonId }),
      },
      route: {
        target,
        itemId: item.id,
        ...(rung === undefined ? {} : { rung }),
        ...(reading ? { seed: reading.seed } : {}),
        ...(recipe === undefined || Object.keys(recipe).length === 0 ? {} : { recipe }),
        ...(transfer
          ? { transfer: { skill: transfer.skill, relationship: transfer.relationship, contact: transfer.contact, ...(material === undefined ? {} : { material }) } }
          : {}),
      },
      reason: slot.reason,
      ...(slot.contact ? { contact: { assumed: slot.contact } } : {}),
    };
  }

  /** The live card's slots as a session and its prompts, for *Start session*. */
  async function startSession(): Promise<void> {
    if (leaving) return;
    const entries: ActivityEntry[] = [];
    const outside: OutsideEntry[] = [];
    slots.forEach((slot, order) => {
      const entry = activityEntryFor(slot, order);
      if (entry) entries.push(entry);
      else
        outside.push({
          order,
          kind: slot.kind,
          title: slot.item?.title ?? SLOT_LABELS[slot.kind],
          minutes: slot.minutes,
          words: slot.reason,
          ...(slot.item ? { itemId: slot.item.id } : {}),
        });
    });
    if (entries.length === 0) {
      status.textContent = 'Nothing in the card to start yet.';
      return;
    }
    const fresh = newRun({
      day: dayKey(now),
      sessionId: newActivityToken(),
      version: compositionVersion(slots.map((slot) => ({ kind: slot.kind, minutes: slot.minutes, ...(slot.item ? { itemId: slot.item.id } : {}) }))),
      startedAt: new Date().toISOString(),
      activities: entries,
      outside,
      ...(breakAfter === undefined ? {} : { breakAfter }),
    });
    leaving = true;
    try {
      run = await startSessionRun(fresh);
    } catch (cause: unknown) {
      leaving = false;
      status.textContent = `Today’s session could not be kept: ${String(cause)}`;
      status.classList.add('status--error');
      return;
    }
    await openCurrent(fresh);
  }

  /** Opens the run's current activity; a transfer offer that could not be kept opens nothing, said (U73). */
  async function openCurrent(from: SessionRun): Promise<void> {
    const current = from.current === null ? undefined : from.activities[from.current];
    if (!current) {
      leaving = false;
      redrawSession();
      return;
    }
    leaving = true;
    const opened = await openActivity(router, from, current);
    if (!opened.ok) {
      leaving = false;
      status.textContent = SESSION_TEXT.offerNotKept;
      status.classList.add('status--error');
      redrawSession();
    }
  }

  /** *Continue*: the record read again first (another tab may have moved it on), then its current activity. */
  async function continueSession(): Promise<void> {
    if (leaving) return;
    await loadRun();
    redrawSession();
    if (isOpen(run, now)) await openCurrent(run);
  }

  /** The learner ends the session on purpose: nothing is marked failed, and what waits is said. */
  async function endSession(): Promise<void> {
    if (!isOpen(run, now)) return;
    const current = run.current === null ? undefined : run.activities[run.current];
    const ended = await applySessionEvent({ sessionId: run.sessionId, version: run.version, token: current?.token ?? '' }, { kind: 'end' });
    run = ended.run ?? run;
    redrawSession();
  }

  /**
   * An activity row tapped: made current where it is not (the learner's own order), then opened with its
   * token. A done row opens outside the session, as practice.
   */
  async function playActivity(activity: RunActivity): Promise<void> {
    if (leaving || !isOpen(run, now)) return;
    if (activity.state === 'completed') {
      openOutside(router, activity);
      return;
    }
    let from: SessionRun = run;
    if (from.current !== activity.index) {
      const chosen = await applySessionEvent({ sessionId: from.sessionId, version: from.version, token: activity.token }, { kind: 'choose' });
      if (!chosen.ok) {
        await loadRun();
        redrawSession();
        return;
      }
      from = chosen.run;
      run = from;
    }
    await openCurrent(from);
  }

  /** A running activity swapped on Today: the learner's change, with a new token (a screen of the old item can finish nothing). */
  async function swapActivity(activity: RunActivity, choice: CatalogItem, tier: Parameters<typeof swapChoiceWords>[0]): Promise<void> {
    if (!isOpen(run, now)) return;
    const slot: SessionSlot = {
      kind: activity.slot.kind,
      minutes: activity.slot.minutes,
      item: choice,
      ...(activity.slot.lessonId === undefined ? {} : { lessonId: activity.slot.lessonId }),
      reason: swapChoiceWords(tier),
      contact: contactOfChoice(choice, activity.slot.kind),
    };
    const entry = activityEntryFor(slot, activity.order);
    if (!entry) {
      status.textContent = `${choice.title} opens as pages, so it is not a step of the session; open it from Library.`;
      return;
    }
    const swapped = await applySessionEvent(
      { sessionId: run.sessionId, version: run.version, token: activity.token },
      { kind: 'swap', slot: entry.slot, route: entry.route, reason: entry.reason, ...(entry.contact ? { contact: entry.contact } : {}), token: entry.token },
    );
    if (swapped.ok) run = swapped.run;
    else await loadRun();
    redrawSession();
  }

  /** An activity as the swap sheet reads a row: the composed slot with its catalogue item. */
  function slotOfActivity(activity: RunActivity): SessionSlot | undefined {
    const item = catalog?.byId.get(activity.slot.itemId);
    if (!item) return undefined;
    return {
      kind: activity.slot.kind,
      minutes: activity.slot.minutes,
      item,
      ...(activity.slot.lessonId === undefined ? {} : { lessonId: activity.slot.lessonId }),
      reason: activity.reason,
    };
  }

  /** One row of the running card: the activity as composed, with what became of it. */
  function activityRow(from: SessionRun, activity: RunActivity): HTMLElement {
    const item = catalog?.byId.get(activity.slot.itemId);
    const current = from.current === activity.index;
    const badges: HTMLElement[] = [];
    // The ✓ only on a run that counted (X46, `cameTo`): a warm-up left and an exercise played in Wait for me
    // wore the same mark as the pass beside them.
    const came = cameTo(activity);
    if (came === 'done') badges.push(badge(SESSION_TEXT.stateDone, 'passed'));
    else if (came === 'skipped') badges.push(badge(SESSION_TEXT.stateSkipped));
    else if (current) badges.push(badge(SESSION_TEXT.stateNext));
    else if (came === 'played') badges.push(badge(SESSION_TEXT.statePlayed));
    const play = (): void => {
      void playActivity(activity);
    };
    const actionButtons: HTMLElement[] = [];
    if (activity.state !== 'completed') {
      actionButtons.push(
        button(
          'Swap',
          () => {
            const others = from.activities.map(slotOfActivity).filter((one): one is SessionSlot => one !== undefined);
            showSwapSheet(slotOfActivity(activity), others, (choice, tier) => {
              void swapActivity(activity, choice, tier);
            });
          },
          { variant: 'quiet' },
        ),
      );
    }
    actionButtons.push(button('▶', play, { ariaLabel: `Open ${activity.slot.title}` }));
    // A piece the learner withdrew after *Start session* says so (G90a): Today is the durable view of what the
    // runner did, and the transition said it once. The composition's words ("Keeping this piece playable —
    // last played on 12 Sep") give way to it: they are the reason the activity was ahead, and the learner has
    // withdrawn the piece it was ahead for. Every other row is as it was.
    const withdrawn = withdrawnOf(activity);
    const line = withdrawn === undefined ? (showsReason(activity) ? cardLine(activity.reason, activity.slot.claim) : undefined) : SESSION_TEXT.withheldRow(withdrawn);
    const row = onTheCard(listRow({
      title: activity.slot.title,
      // The composition's words while the activity is ahead; none once it is behind (X46, `showsReason`): the
      // frozen "not counted yet" sat beside the run that had just counted.
      ...(line === undefined ? {} : { subtitle: line }),
      meta: [
        SLOT_LABELS[activity.slot.kind],
        `${String(activity.slot.minutes)} min`,
        item ? levelLabel(item.level, item.levelSource) : '',
        item ? shortHandsLabel(item.hands) : '',
      ]
        .filter(Boolean)
        .join(' · '),
      badges,
      actions: actionButtons,
      onClick: play,
      dataset: {
        'data-slot': activity.slot.kind,
        'data-item': activity.slot.itemId,
        'data-activity': String(activity.index),
        'data-state': activity.state,
        'data-current': String(current),
        ...(activity.slot.claim ? { 'data-claim': activity.slot.claim.kind } : {}),
        // The withdrawn sentence is read whole, on any face (CI3, `style.css`): the mark the rule keys on.
        ...(withdrawn === undefined ? {} : { 'data-withdrawn': withdrawn }),
      },
    }));
    if (current) row.classList.add('today-row--current');
    return row;
  }

  /**
   * A slot outside the cursor (the protocol table): the free prompt, as a prompt; an item whose screen owns no
   * honest finish (the guided tour), as a row that opens it outside the session — never current, never done.
   */
  function outsideRow(one: OutsideEntry): HTMLElement {
    const item = one.itemId === undefined ? undefined : catalog?.byId.get(one.itemId);
    if (!item) {
      return el(
        'div.today-prompt',
        { 'data-slot': one.kind, 'data-outside': 'true' },
        el('div.today-prompt__title', { text: one.title }),
        el('p.today-prompt__text', { text: `${String(one.minutes)} min · ${one.words}` }),
      );
    }
    const open = (): void => {
      void openItem(router, item);
    };
    return onTheCard(listRow({
      title: item.title,
      subtitle: one.words,
      meta: [SLOT_LABELS[one.kind], `${String(one.minutes)} min`, levelLabel(item.level, item.levelSource)].filter(Boolean).join(' · '),
      actions: [button('▶', open, { ariaLabel: `Open ${item.title}` })],
      onClick: open,
      dataset: { 'data-slot': one.kind, 'data-item': item.id, 'data-outside': 'true' },
    }));
  }

  /** The running card: the run's activities and prompts in the card's order. */
  function drawRunCard(from: SessionRun): void {
    const entries = [
      ...from.activities.map((activity) => ({ order: activity.order, node: activityRow(from, activity) })),
      ...from.outside.map((one) => ({ order: one.order, node: outsideRow(one) })),
    ].sort((a, b) => a.order - b.order);
    entries.forEach((entry, at) => {
      card.append(entry.node);
      if (from.breakAfter !== undefined && at === from.breakAfter - 1) {
        card.append(el('p.muted.today-break', { id: 'today-break', text: 'Take a break here — stand up, shake your hands out. The second half is repertoire-heavy.' }));
      }
    });
  }

  /** What each activity came to, and what waits, for the finish line. */
  function finishLine(from: SessionRun): HTMLElement {
    const minutesSpent = minutesOf(from.elapsedMs);
    const ended = from.closed?.why === 'ended';
    // The card's words for what each came to (X46, `cameTo`): *done* only where its run counted.
    const word = (activity: RunActivity): string => {
      const came = cameTo(activity);
      return came === 'done' ? SESSION_TEXT.stateDone : came === 'skipped' ? SESSION_TEXT.stateSkipped : SESSION_TEXT.statePlayed;
    };
    const came = from.activities.filter((activity) => activity.state !== 'pending' && activity.state !== 'active').map((activity) => `${SLOT_LABELS[activity.slot.kind]} ${word(activity)}`);
    const waiting = from.activities.filter((activity) => activity.state === 'pending' || activity.state === 'active').map((activity) => SLOT_LABELS[activity.slot.kind]);
    const detail = [came.join(' · '), waiting.length > 0 ? `${SESSION_TEXT.deferred}: ${waiting.join(', ')}` : ''].filter(Boolean).join(' — ');
    return el(
      'div.today-finish',
      { id: 'today-finish', 'data-closed': from.closed?.why ?? '' },
      el('p.today-finish__head', { text: ended ? SESSION_TEXT.endedHead(minutesSpent) : SESSION_TEXT.finishedHead(minutesSpent) }),
      ...(detail === '' ? [] : [el('p.today-finish__detail.muted', { text: detail })]),
    );
  }

  /** What the actions row last drew, so a rebuild that changes nothing leaves the buttons under a finger alone. */
  let sessionDrawn = '';

  /**
   * The actions row: *Continue* with where the session is while one runs; otherwise the finish line of
   * today's finished or ended session, if any, above *Start session*. One filled box either way (R3).
   */
  function drawSession(): void {
    const open = isOpen(run, now);
    const key = run === null ? 'none' : `${String(open)}:${run.sessionId}:${String(run.current)}:${String(minutesOf(run.elapsedMs))}:${run.closed?.why ?? ''}`;
    if (key === sessionDrawn) return;
    sessionDrawn = key;
    actions.replaceChildren();
    if (isOpen(run, now)) {
      const running = run;
      const current = running.current === null ? undefined : running.activities[running.current];
      actions.dataset.session = 'running';
      actions.append(
        el('p.today-session-line', { id: 'today-continue-line', text: SESSION_TEXT.continueLine(minutesOf(running.elapsedMs), plannedMinutes(running), current?.slot.title) }),
        button(SESSION_TEXT.continue, () => void continueSession(), { id: 'today-continue', variant: 'primary' }),
        button(SESSION_TEXT.endSession, () => void endSession(), { id: 'today-end', variant: 'quiet' }),
      );
      return;
    }
    actions.dataset.session = run?.closed?.why ?? 'none';
    if (run !== null && run.day === dayKey(now) && (run.closed?.why === 'finished' || run.closed?.why === 'ended')) actions.append(finishLine(run));
    actions.append(button('Start session', () => void startSession(), { id: 'today-start', variant: 'primary' }));
  }

  /** Both halves of the screen the session changes. */
  function redrawSession(): void {
    drawSession();
    drawCard();
  }

  /**
   * Today's record, validated: another day's run is closed as not finished, without judgement, when today's
   * card is composed; a corrupt one was discarded by the store.
   */
  async function loadRun(): Promise<void> {
    const read = await readSessionRun().catch(() => ({ kind: 'none' as const }));
    let stored = read.kind === 'run' ? read.run : null;
    if (stored && !stored.closed && stored.day !== dayKey(now)) {
      stored = (await closeSessionRun('not-finished', now).catch(() => null)) ?? stored;
    }
    run = stored !== null && stored.day === dayKey(now) ? stored : null;
    // Read for the card and for *Continue*: the learner's last word on the piece that is next holds (G90).
    // The composition is not touched; a paused piece's turn has come, and it is stepped past, said on the
    // transition and marked on the row.
    if (isOpen(run, now)) run = (await settleHeld(run, now)).run;
  }

  /** The card recomposed on purpose (a length, Shuffle): a running session is closed, never rebuilt in place. */
  async function recompose(): Promise<void> {
    if (!isOpen(run, now)) return;
    run = (await closeSessionRun('recomposed', now, run.sessionId).catch(() => null)) ?? run;
    sessionDrawn = '';
  }

  function drawCard(): void {
    card.replaceChildren();
    if (isOpen(run, now)) {
      drawRunCard(run);
      return;
    }
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

  // --- today's sight-read (`04` §2) ---------------------------------------

  /**
   * Opens today's phrase — the same phrase, from wherever it is asked for.
   *
   * One function rather than a closure in the card, because the tools row
   * below has a *Sight-read* door of its own now and the two must be the same
   * open: the day's seed is what makes the card repeatable, and a second
   * caller that forgot it would hand the reader a different phrase and then
   * fail to tick the day (`04` §2, `markDailyRead`).
   */
  function openDailyRead(): void {
    if (!dailyTarget || !dailyOffer) return;
    // Its slot, and the rung whose row it is (L50); the day's seed, and the
    // recipe the reader chose (C4).
    const rung = curriculum ? rungForSlot(curriculum, dailyTarget, dailyOffer.lessonId) : undefined;
    const slot: TodaySlot = 'daily-read';
    router.navigateScore(dailyTarget.id, {
      seed: dailyOffer.seed,
      ...(rung === undefined ? {} : { rung }),
      // Before any rung lists a reading row, the phrase is held to the learner's own rung, and `rung` still
      // judges it (SR2; `session.readingOffer`'s `hold`).
      ...(dailyOffer.hold === undefined ? {} : { hold: dailyOffer.hold }),
      slot,
      recipe: routeRecipeOf(dailyOffer),
    });
  }

  function drawDaily(): void {
    dailyCard.replaceChildren();
    // `04` §0 R4: no furniture. A build with no reading exercises in it has
    // nothing to offer here, and an empty card saying so would be a hole. The
    // door in the tools row goes with it, for the same reason (`drawDoors`).
    const item = dailyTarget;
    const offer = dailyOffer;
    if (!item || !offer) return;
    const seed = offer.seed;
    const done = readToday(dailyDays, now);
    const streak = dailyReadStreak(dailyDays, now);
    const bars = item.drill?.params?.bars;
    const open = openDailyRead;
    const row = listRow({
        title: "Today's sight-read",
        // Why this phrase, from the reads behind it; the rung's words where
        // no evidence chose it; and once today's phrase is on the record, that
        // it is read and not offered again (C4).
        subtitle: readingReason(offer.why, 'daily', now),
        meta: [
          streak > 0 ? `Day ${String(streak)}` : 'Start a run',
          dailyLevelLabel(item, offer),
          typeof bars === 'number' ? `${String(bars)} bars` : '',
        ]
          .filter(Boolean)
          .join(' · '),
        // The one thing the line above does not say, and only once it is news.
        badges: done ? [badge('✓ read today', 'passed')] : [],
        actions: [
          button('▶', open, { ariaLabel: "Open today's sight-read" }),
        ],
        onClick: open,
        dataset: {
          'data-daily': item.id,
          'data-seed': String(seed),
          'data-why': offer.why.kind,
          'data-streak': String(streak),
          'data-done': String(done),
        },
      });
    // The reason takes a second line here rather than an ellipsis (C4): the
    // card's title is one line and it has no Swap, so the row stays inside
    // `04` §0 R2 with the whole sentence on it. The session rows' reasons take
    // two lines too since U63 (`onTheCard`); this card is not one of them and
    // keeps its own rule and its badge line.
    row.querySelector('.list-row__sub')?.classList.add('today-reason');
    dailyCard.append(row);
  }

  function drawActions(): void {
    // *Start session* opens the session's execution state, not the first row (X1, Part 18's first case): the
    // row is `drawSession`'s, drawn again whenever the session changes.
    drawSession();
    // `04` §0 R3, weight by frequency: one filled box on the screen, and text
    // for the rest. `Review a skill` and `How to practise` have left for Plan,
    // which is where they belong and where they already are — six boxes of
    // equal weight is no weighting. `Shuffle options` was the last of these
    // still drawn as a box; it is done once in a while, on a card you have
    // already been given, so it reads as text like the rest.
    //
    // Two links here and not three: `Metronome` opens a screen rather than
    // changing the day, so it went to the row of doors below (`drawDoors`).
    tools.replaceChildren(
      button(
        'Shuffle options',
        () => {
          seed += 1;
          // A shuffled card is a recomposed one: a running session is closed as recomposed (X1).
          void recompose().then(rebuild);
        },
        { id: 'today-shuffle', variant: 'quiet' },
      ),
      el('span.plan-sep', { text: '·', 'aria-hidden': 'true' }),
      button('Jump to…', () => router.navigate('plan'), { id: 'today-jump', variant: 'quiet' }),
    );
  }

  /**
   * The doors, and only the ones that lead somewhere (`04` §0 R4).
   *
   * Rebuilt rather than hidden in place, because the row is `·`-separated:
   * a door taken away on its own leaves its separator behind, and two dots
   * with nothing between them read as a word that failed to draw.
   *
   * Each separator is tied to the door *before* it, in one flex item that
   * cannot break inside. Five doors do not fit one line at 342 px, and loose
   * separators wrap wherever they fall — at 100 % the second line opened with
   * a full stop of its own, which reads as a bullet for a list that has none.
   *
   * *Accompaniment lab* keeps the name the Library gives it and the name the
   * screen wears. "Chord lab" would have been shorter and would have been a
   * second name for one thing, which is the fault `00` §1 "never say the same
   * thing twice" is the other half of.
   */
  function drawDoors(): void {
    const open: HTMLElement[] = [
      button('Metronome', () => router.navigate('today', 'metronome'), {
        id: 'today-metronome',
        variant: 'quiet',
      }),
      button('Free play', () => router.navigatePlay(), { id: 'today-play', variant: 'quiet' }),
    ];
    // The same phrase the card above opens, seed and all — never a second one.
    if (dailyTarget) {
      open.push(button('Sight-read', openDailyRead, { id: 'today-read', variant: 'quiet' }));
    }
    if (items.some((item) => item.id === simonId)) {
      open.push(
        button('Simon', () => router.navigateDrill(simonId), {
          id: 'today-simon',
          variant: 'quiet',
        }),
      );
    }
    open.push(
      button('Accompaniment lab', () => router.navigateLab(), {
        id: 'today-lab',
        variant: 'quiet',
      }),
    );
    doors.replaceChildren(
      ...open.map((door, index) =>
        index === open.length - 1
          ? door
          : el('span.plan-pair', {}, door, el('span.plan-sep', { text: '·', 'aria-hidden': 'true' })),
      ),
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
    // A generated sight-reading row (C5, S8): never reviewed, never repertoire.
    const generated = (id: string): boolean => {
      const item = catalog?.byId.get(id);
      return item !== undefined && isSightReading(item);
    };
    // Where the learner is comes from the evidence (C5: `rungState`), where it
    // was the items marked passed, counted over each rung; the same rows carry
    // the learner's skills, which the review and the warm-up read (C6).
    // The contact history beside the runs (G2 item 6): encounters and pruned runs' summaries, so a
    // piece heard once or practised and pruned is never offered as new. A store that cannot be read
    // gives none, which reads as the runs alone, as before.
    const contactHistory = Promise.all([allEncounters().catch(() => []), contactSummaries().catch(() => [])]);
    // The learner's projects (G1d; the reviewer's G82 ruling), for two things: the session's automatic
    // eligibility — no automatic chooser offers a piece they paused or put away (G1e, `buildSession`'s one
    // lookup) — and the swap sheet, the learner's own menu, which lists such a piece with its state beside it
    // (G94). Nothing here writes one. A store that cannot be read gives none, which suppresses and marks
    // nothing, as before.
    const projectRows = allProjects().catch(() => []);
    void Promise.all([getPlan(), loadRungStates(curriculum, now), rungRows(), contactHistory, projectRows]).then(([plan, states, rows, [encounters, summaries], projects]) => {
      // The same active set Plan and Settings show, so the three screens
      // cannot disagree about what is switched on.
      const active = activeTracksFor(plan, curriculum as Curriculum);
      learnerRows = rows;
      learnerContact = { encounters, summaries };
      learnerProjects = projects;
      const built = buildSession({
        curriculum: curriculum as Curriculum,
        catalog: catalog as CatalogIndex,
        items,
        states,
        // The pieces learned and when each was last played (C6): the review's
        // repertoire retention and "a piece you know". Pieces only (C5, S8): a
        // generated sight-reading row is never one, whatever an older build
        // wrote on it. The item calendar they replace is gone.
        learned: learnedPieces(progress, generated),
        projects,
        lastPlayed: new Map(progress.map((row) => [row.itemId, row.lastPracticedAt])),
        rows,
        activeTracks: active,
        minutes,
        seed,
        strictPrerequisites: getSettings().strictPrerequisites,
        // "Placement recorded. Today will build from here" — which it now
        // does (`02` Stage 0.4, built 2026-09-21).
        ...(plan.placement === undefined ? {} : { startAt: plan.placement.unitId }),
        // The reading slot's phrase comes from the learner's reads (C4).
        readingRows,
        today: now,
        contact: { encounters, summaries },
      });
      slots = built.slots;
      // A composed card is a new decision (D4a): its offer gets a new instance, and an offer kept from
      // an earlier composition no longer stands for anything on it.
      supersedeOffer();
      learnerReached = built.reached;
      breakAfter = built.template.breakAfterSlot;
      drawCard();
      // Once, after the first session exists: drawing it *before* the first build put `Start session` on
      // screen with nothing to start. The session's half of the row (`drawSession`) is drawn again only when
      // the session itself changed, so a rebuild never throws away the button a finger has just landed on.
      if (!actionsDrawn) {
        drawActions();
        actionsDrawn = true;
      } else {
        drawSession();
      }

      const position = nextRecommended(curriculum as Curriculum, states, active, {
        strictPrerequisites: getSettings().strictPrerequisites,
        // The same `startAt` the session above was built with (T17).
        //
        // It was missing here and nowhere else — `buildSession` had it, Plan's
        // *Next up* had it, Skills had it — so after a placement this screen
        // built a session from the placed rung and then printed *Working on
        // Stage 0 · …* over the top of it. `04` §3 says the three screens
        // cannot disagree about where the learner is; Today disagreed with
        // Plan, and with itself, in the same paint.
        ...(plan.placement === undefined ? {} : { startAt: plan.placement.unitId }),
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
      learnerRung = position?.lesson.id;

      // The daily read and the session's reading slot are one rule, the reader
      // (C4): the rung's reading row, moved by what the learner's reads show.
      // It used to be the hardest row at or below the stage number.
      dailyOffer = readingOffer({
        curriculum: curriculum as Curriculum,
        items,
        // The core path's rung while there is one (C6): the reading rows sit on the spine, and the
        // status line's rung can be a track's in the file's order (`readerPosition`).
        position: readerPosition(curriculum as Curriculum, states, active, {
          strictPrerequisites: getSettings().strictPrerequisites,
          ...(plan.placement === undefined ? {} : { startAt: plan.placement.unitId }),
        }),
        activeTracks: active,
        rows: readingRows,
        today: now,
        purpose: 'daily',
      });
      dailyTarget = dailyOffer?.item ?? null;
      // The day itself is written by the Score screen when the seeded run
      // is recorded (`markDailyRead` there), not read off the item's row.
      drawDaily();
      // The doors hang off the same stage and the same daily item, so they are
      // drawn here rather than with the buttons above: until this line there is
      // no stage to choose a Simon by and no phrase for *Sight-read* to open.
      simonId = simonForStage(position ? position.stageNumber : 1);
      drawDoors();
    });
  }

  async function load(): Promise<void> {
    const [loadedCurriculum, loadedItems, rows, streak, readDays] = await Promise.all([
      loadCurriculum(),
      allItems(),
      allProgress(),
      getStreak(),
      dailyReadDays(),
    ]);
    curriculum = loadedCurriculum;
    items = loadedItems;
    catalog = indexCatalog(loadedItems);
    progress = rows;
    dailyDays = readDays;
    readingRows = await loadReadingRows(loadedItems);
    // Today's session, before the card is drawn: while one runs, the card is the run's (X1).
    await loadRun();

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

  // The card as composed, for the end-to-end tests (D4a): its offer instance and each row's item and
  // claim, so a spec can hold the offer's relationship before opening it and compare the stored run.
  if (window.__pianopath) {
    const readCard = (): TodayCardView => ({
      token: cardToken,
      slots: slots.map((slot) => ({
        kind: slot.kind,
        ...(slot.item ? { itemId: slot.item.id } : {}),
        ...(slot.claim ? { claim: slot.claim } : {}),
      })),
    });
    window.__pianopath.todayCard = readCard;
    onScreenDispose(section, () => {
      if (window.__pianopath?.todayCard === readCard) delete window.__pianopath.todayCard;
    });
  }

  // The session moved on this page (a write elsewhere on it), or in another tab while this one was hidden:
  // the card and the row are drawn from the record again, never from what this view last held (X1).
  const stopWatchingRun = onSessionRunChange((stored) => {
    run = stored !== null && stored.day === dayKey(now) ? stored : null;
    if (catalog) redrawSession();
  });
  const onVisible = (): void => {
    if (document.visibilityState !== 'visible' || !catalog) return;
    void loadRun().then(redrawSession);
  };
  document.addEventListener('visibilitychange', onVisible);
  onScreenDispose(section, () => {
    stopWatchingRun();
    document.removeEventListener('visibilitychange', onVisible);
  });

  const stopWatchingProgress = onProgressChange(() => {
    // The daily days too: the store ticks the day when a seeded run is
    // recorded, and the tick has to reach the card without a reload.
    void Promise.all([allProgress(), dailyReadDays(), loadReadingRows(items)]).then(([rows, days, reads]) => {
      progress = rows;
      dailyDays = days;
      readingRows = reads;
      rebuild();
    });
  });
  onScreenDispose(section, stopWatchingProgress);

  return section;
}

/**
 * How many stored runs of each reading row the reader looks through (C4): the
 * Score screen's own reach for a phrase already played, so the two agree on
 * what is on the record.
 */
const READING_HISTORY = 500;

/** The learner's stored runs of every reading row, for the reader (C4). */
async function loadReadingRows(items: readonly CatalogItem[]): Promise<SessionRow[]> {
  const readers = items.filter((item) => item.drill?.kind === 'sight-reading');
  try {
    return (await Promise.all(readers.map((item) => sessionsForItem(item.id, READING_HISTORY)))).flat();
  } catch {
    // No history to read is a learner who has not read: the rung's own row.
    return [];
  }
}

/**
 * What a session activity keeps of the claim that chose it (X1): the kind, and the demand or skill it names —
 * all the two adaptations read (the easy-success rule compares the named measured demands).
 */
function claimFacts(claim: NonNullable<SessionSlot['claim']>): NonNullable<ActivityEntry['slot']['claim']> {
  switch (claim.kind) {
    case 'demand':
    case 'ready':
      return { kind: claim.kind, demand: claim.demand };
    case 'skill':
    case 'skill-retention':
    case 'transfer':
      return { kind: claim.kind, skill: claim.skill };
    case 'asked':
      return claim.skill === undefined ? { kind: claim.kind } : { kind: claim.kind, skill: claim.skill };
    default:
      return { kind: claim.kind };
  }
}

/** A reader's recipe as the route carries it: what moved, and whether it is the easy one. */
function routeRecipeOf(offer: ReadingOffer): { moved?: NonNullable<ReadingOffer['recipe']['moved']>; easy?: true } {
  return {
    ...(offer.recipe.moved === undefined ? {} : { moved: offer.recipe.moved }),
    ...(offer.recipe.easy === true ? { easy: true as const } : {}),
  };
}

/**
 * The rung a Today card's run is judged by (C3 item 0b, L50; C5).
 *
 * The rung the session builder offered the item from, where that rung lists
 * it: the warm-up, the new piece and the reading row come off the learner's
 * rung, which the builder takes from the derived rung state (`rungState`
 * through `nextRecommended`), so this reads the derived state through the
 * slot. Otherwise the one rung that lists the item, where exactly one does:
 * its standard is the only one the curriculum gives the item. Otherwise none:
 * an item several rungs list, offered from none of them (a review, a
 * repertoire piece, a fallback), is judged by the Settings pair and counts
 * towards no rung's requirement — no rung asked for it, and choosing one of
 * its listings would be the credit by listing C5 removed (L8). It was the
 * first rung listing it, a guess C3 labelled interim.
 */
/**
 * The daily card's level (SR3; the reviewer's ruling on SR2, `docs/review/responses/sr2-landing.md` §2): a hold
 * is part of the material the learner is offered, so while the phrase is held to the learner's rung (the offer's
 * `hold`) the card says that rung's level, `L1.1` over a steps-only phrase, never the row's `L1.5`; with no hold,
 * the row's level as every list row says it. A hold that is not a level-shaped rung id (a track rung's) says no
 * level rather than the row's.
 */
export function dailyLevelLabel(item: Pick<CatalogItem, 'level' | 'levelSource'>, offer: Pick<ReadingOffer, 'hold'>): string {
  if (offer.hold === undefined) return levelLabel(item.level, item.levelSource);
  return /^\d+\.\d$/.test(offer.hold) ? levelLabel(Number(offer.hold)) : '';
}

export function rungForSlot(curriculum: Curriculum, item: CatalogItem, offeredFrom?: string): string | undefined {
  const lists = (lesson: { exerciseOptions: string[]; songOptions: string[] }): boolean =>
    lesson.exerciseOptions.includes(item.id) || lesson.songOptions.includes(item.id);
  const offered = offeredFrom === undefined ? undefined : findLesson(curriculum, offeredFrom);
  if (offered && lists(offered)) return offered.id;
  const listing = curriculum.stages.flatMap((stage) => stage.units.flatMap((unit) => unit.lessons.filter(lists)));
  return listing.length === 1 ? listing[0]?.id : undefined;
}
