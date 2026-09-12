/**
 * Plan (docs/04 §3): the curriculum, browsable end to end.
 *
 * Every lesson is openable regardless of status. The whole point of a personal
 * build is that the owner can skip ahead, and a plan that locks him out of
 * Stage 4 until Stage 3 is ticked would be the app arguing with him. Strict
 * prerequisites exist as a setting for anyone who wants the argument.
 *
 * ## What this screen is for, in order
 *
 * Photographed on the phone and read back, the screen said everything at the
 * same volume: a row of chips, a row of links, ten stage cards, and between
 * them a shouty all-caps line per unit —
 * `CLASSICAL.5.1 · CLASSICAL: SONATINA FORM AND ROMANTIC MINIATURES —
 * CLASSICAL` — over a card repeating the same title, truncated. Three
 * announcements of one rung, two of them carrying an internal id, and the one
 * you actually tap was the one cut short.
 *
 * So the screen now ranks what it draws, and the ranking is the design:
 *
 *  1. **What to practise next.** One filled card at the top (`04` §0 R3's one
 *     box per screen), naming the rung, where it sits and what it costs. This
 *     is the question the screen is opened to answer, so it is inside the
 *     first screenful whatever stage the learner is on (R1) — the stage list
 *     alone could not manage that, because the stage being worked on is the
 *     sixth row down.
 *  2. **The stage being worked on, and the rungs inside it.** Stage rows are
 *     headings with a completion bar; the current one is marked. Inside an
 *     open stage the rungs are grouped by *track*, with the track named once
 *     over its group rather than once per rung — which is what the all-caps
 *     line was doing, badly, and with the track name printed twice.
 *  3. **Everything else, available but quiet.** Which tracks are on (one
 *     chip, one sheet), the placement test, skills review and how to
 *     practise — all read occasionally, none of them the reason the screen is
 *     open, so they are a chip in the header and a line of text below the
 *     list (R3).
 *
 * A unit no longer gets a line of its own unless it has more than one lesson
 * in it, which two units in the whole curriculum do. Everywhere else the unit
 * and the lesson are the same rung under two names, and printing both was the
 * duplication (`00` D26).
 */
import type { Router } from '../../router';
import { allItems, loadCurriculum } from '../../curriculum/load';
import { lessonComplete } from '../../curriculum/selectors';
import { getSettings } from '../../data/settingsStore';
import { nextRecommended } from '../../curriculum/session';
import { activeTracksFor } from '../../curriculum/tracks';
import { indexAtPoint, isDrag, moveDown, moveItem, moveUp } from '../reorder';
import type { Curriculum, Lesson, PassRecord, Stage, Track, Unit } from '../../curriculum/types';
import { allProgress } from '../../data/progressStore';
import { getPlan, updatePlan } from '../../data/planStore';
import { onScreenDispose } from '../screenLifecycle';
import { badge, button, chip, el, listRow, openSheet } from '../widgets';
import { screenFrame, statusLine } from './screenFrame';

/**
 * Stages the learner has expanded.
 *
 * Module-level, so it survives leaving the tab and coming back — which is what
 * you want: you open Stage 3, tap into a lesson, come back, and Stage 3 is
 * still open. It is reset only by a reload.
 */
const expanded = new Set<number>();

/**
 * The four families the sixteen tracks fall into.
 *
 * Sixteen tracks in one flat list is the "organise all the different genres"
 * problem: a jazz ladder that runs from Stage 5 to Stage 9 and a one-rung
 * holiday module were the same kind of thing on screen, so choosing between
 * them meant reading all sixteen descriptions.
 *
 * Two of the families are named here because they are an editorial judgement
 * and should read as one — the spine of the plan, and the three that run
 * *beside* whatever else is on. The other two are read off the curriculum:
 * a track with one unit in the whole plan is a mini-module, and a track with
 * more than one is a ladder. That is why a new track added to
 * `content/curriculum/00-tracks.json` lands somewhere sensible without this
 * file being edited, and why deleting rungs from a track can move it — the
 * rock module became a mini-module the day its seven import-only briefs went.
 */
type FamilyId = 'path' | 'alongside' | 'ladder' | 'module';

const PATH_TRACKS = new Set(['core', 'practice']);
const ALONGSIDE_TRACKS = new Set(['technique', 'theory-ear', 'improv-compose']);

const FAMILY_ORDER: FamilyId[] = ['path', 'alongside', 'ladder', 'module'];

const FAMILY_TITLES: Record<FamilyId, string> = {
  path: 'The path itself',
  alongside: 'Alongside everything',
  ladder: 'Style ladders',
  module: 'Mini-modules — one rung each',
};

/** How many units each track owns, across every stage. */
function unitsPerTrack(curriculum: Curriculum): Map<string, number> {
  const counts = new Map<string, number>();
  for (const stage of curriculum.stages) {
    for (const unit of stage.units) counts.set(unit.track, (counts.get(unit.track) ?? 0) + 1);
  }
  return counts;
}

function familyOf(trackId: string, units: number): FamilyId {
  if (PATH_TRACKS.has(trackId)) return 'path';
  if (ALONGSIDE_TRACKS.has(trackId)) return 'alongside';
  return units > 1 ? 'ladder' : 'module';
}

/**
 * Whether a unit is on a track the learner has switched on.
 *
 * `core` is never filtered out: it is the spine the stages are built on and it
 * cannot be switched off, so a stage's own rungs are always there.
 */
function onActiveTrack(unit: Unit, activeTracks: string[]): boolean {
  return unit.track === 'core' || activeTracks.length === 0 || activeTracks.includes(unit.track);
}

/**
 * How much of a stage is done — counting only what is on screen.
 *
 * It used to count every unit in the stage whatever the learner had switched
 * on, so a stage showing three rungs was headed "3 of 12 lessons" and the
 * other nine were nowhere. A fraction whose denominator names rows that are
 * not there is worse than no fraction.
 */
function completion(
  stage: Stage,
  records: PassRecord[],
  activeTracks: string[],
  options: { requireTwoSongs?: boolean },
): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const unit of stage.units) {
    if (!onActiveTrack(unit, activeTracks)) continue;
    for (const lesson of unit.lessons) {
      total += 1;
      if (lessonComplete(lesson, records, options)) done += 1;
    }
  }
  return { done, total };
}

/** Two titles that are the same words — the duplication `00` D26 is about. */
function sameWords(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** `1 exercise`, `4 exercises` — and nothing at all for none of them. */
function count(n: number, singular: string, plural = `${singular}s`): string[] {
  if (n <= 0) return [];
  return [`${String(n)} ${n === 1 ? singular : plural}`];
}

/**
 * What a rung costs, as a line: how many ways in, and how long it takes.
 *
 * A zero is left out rather than printed. "2 exercises · 0 songs" was on every
 * orientation rung in Stage 0 — a fact whose only content is an absence, taking
 * a third of the line from the two that say something.
 */
function costLine(lesson: Lesson): string {
  return [
    ...count(lesson.exerciseOptions.length, 'exercise'),
    ...(lesson.songOptional ? ['no song needed'] : count(lesson.songOptions.length, 'song')),
    ...(lesson.estimatedDays ? [`~${String(lesson.estimatedDays)} ${lesson.estimatedDays === 1 ? 'day' : 'days'}`] : []),
  ].join(' · ');
}

export function PlanScreen(router: Router): HTMLElement {
  const { section, header, body } = screenFrame('plan', 'Plan');
  const status = statusLine('plan-status');
  const trackRow = el('div.filter-row', { id: 'plan-tracks' });
  const nextBox = el('div', { id: 'plan-next-slot' });
  const list = el('div.list', { id: 'plan-list' });

  let curriculum: Curriculum | null = null;
  let records: PassRecord[] = [];
  /** Set by a drag so the click it produced does not also toggle the track. */
  let suppressClickFor: string | null = null;
  let activeTracks: string[] = [];

  const linkRow = el('div.plan-links', { id: 'plan-links' });
  header.append(trackRow);
  // The answer first, then the message about it, then the list, then the
  // things read once a month. `04` §0 R1 and R6: the status line sits beside
  // what it is about rather than under ninety rows of stage list, which is
  // where "Next up: …" used to be printed.
  body.append(nextBox, status, list, linkRow);

  function trackById(id: string): Track | undefined {
    return curriculum?.tracks.find((candidate) => candidate.id === id);
  }

  function lessonRow(lesson: Lesson, options: { next: boolean }): HTMLElement {
    const done = lessonComplete(lesson, records, { requireTwoSongs: getSettings().requireTwoSongs });
    // Only what the detail line does not already say (`04` §0 R2). "No song
    // needed" is *in* the detail line, where it replaces the "0 songs" it used
    // to sit beside; as a badge as well it cost the row a fourth line and put
    // two rungs over the 96 px budget.
    const badges: HTMLElement[] = done ? [badge('complete', 'passed')] : [];
    // The title, and nothing else. It used to be `${lesson.id} · ${title}` —
    // `classical.5 · Sonatina form and Romantic…` — so an internal id the
    // learner has no use for took the room that then truncated the words that
    // say what the rung is. The id is still on the row as `data-lesson`,
    // which is where a test wants it and a person does not.
    //
    // No subtitle either. It was the unit's title, printed under a card whose
    // own title usually *is* the unit's title, under a heading that said it a
    // third time — three sizes of the same words for a third of the screen
    // (`04` §3, `00` D26).
    return listRow({
      title: lesson.title,
      meta: costLine(lesson),
      badges,
      onClick: () => router.navigateLesson(lesson.id),
      dataset: { 'data-lesson': lesson.id, ...(options.next ? { 'data-next': true } : {}) },
    });
  }

  /**
   * The one filled box on the screen (`04` §0 R3): what to practise next.
   *
   * The screen is opened to answer one question and the answer used to be a
   * sentence at the very bottom of the body, under every stage and every rung
   * the learner had expanded. It is a card at the top now, and it is the
   * thing you tap.
   */
  function drawNext(recommended: ReturnType<typeof nextRecommended>): void {
    nextBox.replaceChildren();
    if (!recommended) return;
    const { lesson, unit, stageNumber } = recommended;
    const track = trackById(unit.track);
    const where = [
      `Stage ${String(stageNumber)}`,
      ...(track && track.id !== 'core' ? [track.title] : []),
    ].join(' · ');
    const cost = costLine(lesson);
    const card = el(
      'div.plan-next',
      { id: 'plan-next', role: 'button', tabIndex: 0, 'data-lesson-next': lesson.id },
      el('p.plan-next__eyebrow', { text: `Next up · ${where}` }),
      el('p.plan-next__title', { text: lesson.title }),
      el('p.plan-next__meta', { text: cost }),
    );
    const open = (): void => {
      router.navigateLesson(lesson.id);
    };
    card.addEventListener('click', open);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open();
      }
    });
    nextBox.append(card);
  }

  function draw(): void {
    if (!curriculum) return;
    const recommended = nextRecommended(curriculum, records, activeTracks, {
      requireTwoSongs: getSettings().requireTwoSongs,
      strictPrerequisites: getSettings().strictPrerequisites,
    });
    drawNext(recommended);
    list.replaceChildren();

    for (const stage of curriculum.stages) {
      const { done, total } = completion(stage, records, activeTracks, {
        requireTwoSongs: getSettings().requireTwoSongs,
      });
      const open = expanded.has(stage.number);
      const current = recommended?.stageNumber === stage.number;
      const head = listRow({
        title: `Stage ${String(stage.number)} · ${stage.title}`,
        // The summary is not on the row. It was a second muted line — over
        // R2's one — and at this width it was cut to "Sitting, the layout of
        // the keyboard, how…", which is an explanation that has stopped
        // explaining. It moves *below the thing it explains* (R1): in full,
        // wrapping, as the first line inside the stage once it is open.
        meta: `${String(done)} of ${String(total)} lessons${
          stage.approxDuration ? ` · ${stage.approxDuration}` : ''
        }`,
        badges: done === total && total > 0 ? [badge('complete', 'passed')] : [],
        // The row is the toggle; the chevron only says which way a tap will
        // go. It rides in `indicator`, not `actions` — `actions` stops a
        // click from reaching the row (right for a real button beside it,
        // wrong here), which used to swallow exactly the tap a person aims at
        // the chevron once a stage is open and it is pointing at what closes
        // it.
        indicator: el('span.plan-chevron', { text: open ? '⌄' : '›', 'aria-hidden': 'true' }),
        onClick: () => {
          if (open) expanded.delete(stage.number);
          else expanded.add(stage.number);
          draw();
        },
        dataset: { 'data-stage': stage.number, 'data-open': open, 'data-current': current },
      });
      // How far through the stage is, as a bar rather than only as a
      // fraction: it is what makes a column of ten stage rows scannable
      // without reading any of them. Absolutely positioned along the row's
      // bottom edge, so it costs the row no height against `04` §0 R2.
      const fill = el('span.plan-stage-bar__fill');
      fill.style.width = `${String(total > 0 ? Math.round((done / total) * 100) : 0)}%`;
      head.append(el('span.plan-stage-bar', { 'aria-hidden': 'true' }, fill));
      list.append(head);
      if (!open) continue;
      if (stage.summary) {
        list.append(
          el('p.plan-stage-summary.muted', { 'data-summary-for': stage.number, text: stage.summary }),
        );
      }

      // Rungs grouped by track, each track named once over its own group.
      //
      // Grouped by *first appearance*, not resorted: the order the curriculum
      // puts its units in is the order `nextRecommended` walks them in, so
      // resorting here would put a rung above the one the screen is telling
      // him to do next. In practice this only pulls together tracks that have
      // more than one unit in a stage, which is rare.
      const groups: { track: string; units: Unit[] }[] = [];
      for (const unit of stage.units) {
        if (!onActiveTrack(unit, activeTracks)) continue;
        const existing = groups.find((group) => group.track === unit.track);
        if (existing) existing.units.push(unit);
        else groups.push({ track: unit.track, units: [unit] });
      }

      let drawn = 0;
      for (const group of groups) {
        const track = trackById(group.track);
        // `core` gets no heading: it is the stage itself, not a side track,
        // and a line reading "Core path" over the rungs of Stage 1 tells the
        // reader nothing they cannot see. The heading earns its line where it
        // marks a change of direction — Classical, Blues, Technique.
        if (group.track !== 'core') {
          list.append(
            el('p.plan-track', { 'data-track-head': group.track }, // no id, no repeat
              el('span.plan-track__name', { text: track?.title ?? group.track })),
          );
        }
        for (const unit of group.units) {
          drawn += unit.lessons.length;
          // A unit line only where the unit is genuinely more than its
          // lessons: two units in the whole curriculum have more than one
          // lesson, and everywhere else the heading was the card's own title
          // in capitals with an id in front of it. A unit named after its own
          // track — `practice.1.1`, "How to practise" — or after one of its
          // own rungs — `4.6`, "Sight-reading and phrasing capstone" — is the
          // same repetition wearing a different hat (`00` D26).
          const echoes =
            sameWords(unit.title, track?.title) ||
            unit.lessons.some((candidate) => sameWords(unit.title, candidate.title));
          if (unit.lessons.length > 1 && !echoes) {
            list.append(el('p.plan-unit.muted', { 'data-unit': unit.id, text: unit.title }));
          }
          for (const lesson of unit.lessons) {
            list.append(lessonRow(lesson, { next: recommended?.lesson.id === lesson.id }));
          }
        }
      }

      // `04` §0 R4. Stages 5 to 9 have no `core` units at all — every one of
      // them belongs to a side track — so switching off the tracks that are
      // on by default leaves them expanding to nothing at all. An empty
      // accordion is the worst kind of dead: it looks like the app failed.
      if (drawn === 0) {
        list.append(
          el('p.plan-unit.muted', {
            'data-empty-stage': stage.number,
            text: `Nothing in Stage ${String(stage.number)} is on the tracks you have switched on.`,
          }),
          button('Choose tracks', () => openTracksSheet(), {
            id: `plan-stage-tracks-${String(stage.number)}`,
            variant: 'quiet',
          }),
        );
      }
    }

    // The card says what is next, so the line beside it has nothing to add
    // until there is nothing next to say. Writing "Next up: …" here as well
    // would be the same sentence twice, one of them in the one region a
    // screen reader announces on every redraw.
    status.textContent = recommended ? '' : 'Every lesson is complete.';
  }

  /**
   * Commits a new order and tells everything that reads it.
   *
   * Note for whoever picks this up next: `trackOrder` is only ever consumed as
   * a *set* — `activeTracksFor` hands it to `nextRecommended` and to the
   * session builder, both of which do `new Set(activeTracks)`. So switching a
   * track on or off changes what the app recommends and the order does not.
   * `04` §3 asks for "ordering by drag" and this keeps it; whether it should
   * survive is the owner's call, not a thing to delete in a layout pass.
   */
  function commitOrder(next: string[]): void {
    activeTracks = next;
    void updatePlan({ trackOrder: activeTracks });
    drawTracks();
    draw();
  }

  /**
   * Pointer-drag reordering for the track chips (`04` §3, "ordering by drag").
   *
   * A chip is a toggle first: the drag only begins once the pointer has moved
   * past `DRAG_THRESHOLD_PX`, and until then the press is still a tap. Pointer
   * events rather than HTML5 drag-and-drop, which does not exist on touch.
   *
   * `onReorder` lets the caller keep whatever chips this chip lives among in
   * sync with `activeTracks` as it moves — the sheet's own rows, which is
   * where the drag actually happens and where the next move's hit-testing
   * reads their positions from.
   */
  function makeDraggable(node: HTMLElement, trackId: string, onReorder: () => void): void {
    node.addEventListener('pointerdown', (event: PointerEvent) => {
      // Only the tracks that are on can be ordered — the order is the order
      // they are played in, and an inactive track is not in it.
      const from = activeTracks.indexOf(trackId);
      if (from === -1 || trackId === 'core') return;
      const startX = event.clientX;
      const startY = event.clientY;
      let dragging = false;

      const move = (moveEvent: PointerEvent): void => {
        if (!dragging) {
          if (!isDrag(moveEvent.clientX - startX, moveEvent.clientY - startY)) return;
          dragging = true;
          node.setPointerCapture(moveEvent.pointerId);
          node.classList.add('is-dragging');
          trackRow.dataset.reordering = 'true';
        }
        const boxes = activeTracks.map((id) =>
          (document.getElementById(`plan-track-${id}`) ?? node).getBoundingClientRect(),
        );
        const over = indexAtPoint(boxes, moveEvent.clientX, moveEvent.clientY);
        const current = activeTracks.indexOf(trackId);
        if (over !== null && over !== current) {
          activeTracks = moveItem(activeTracks, current, over);
          drawTracks();
          // The header just redrawn is inert and hidden behind this sheet —
          // it is the sheet's own rows the pointer is actually over, and
          // which the next `move` event measures. Without moving them too,
          // `getElementById('plan-track-…').getBoundingClientRect()` keeps
          // answering with wherever they sat before this reorder, and every
          // hit-test after the first is checked against a layout that no
          // longer matches what `activeTracks` says.
          onReorder();
          const moved = document.getElementById(`plan-track-${trackId}`);
          moved?.classList.add('is-dragging');
        }
      };

      const up = (upEvent: PointerEvent): void => {
        node.removeEventListener('pointermove', move);
        node.removeEventListener('pointerup', up);
        node.removeEventListener('pointercancel', up);
        delete trackRow.dataset.reordering;
        if (!dragging) return;
        // A drag consumed the press, so the click that follows must not also
        // toggle the track off. On a mouse, the click a browser synthesises
        // after this `pointerup` is what clears the flag below, from the
        // chip's own handler. Touch does not synthesise one at all once a
        // `pointermove` has happened — nothing was ever going to clear it —
        // so without this timeout the flag stood forever and the next
        // genuine tap on this chip, tomorrow or next week, would be silently
        // swallowed by a suppression meant for a click that already isn't
        // coming. Queued after `commitOrder` so a click that *does* arrive
        // (mouse) still finds the flag set and consumes it first.
        upEvent.preventDefault();
        suppressClickFor = trackId;
        commitOrder(activeTracks);
        setTimeout(() => {
          if (suppressClickFor === trackId) suppressClickFor = null;
        }, 0);
      };

      node.addEventListener('pointermove', move);
      node.addEventListener('pointerup', up);
      node.addEventListener('pointercancel', up);
    });
  }

  /**
   * The header: one line that says which tracks are on and opens the chooser.
   *
   * It was three chips that looked pressable and were not — `chip(..., {
   * pressed: true })` with no handler — followed by a fourth reading
   * `Tracks… +13`, on a second line. Two rows of header for a fact and a
   * door. One chip now, carrying both: the fact is its label and the door is
   * the tap.
   */
  function drawTracks(): void {
    if (!curriculum) return;
    trackRow.replaceChildren();
    const names = activeTracks
      .map((id) => trackById(id)?.title)
      .filter((title): title is string => Boolean(title));
    // Two names and a count, not a list. Fifteen tracks switched on is
    // fifteen chips and six rows of header, which is the problem this exists
    // to remove.
    const SHOWN = 2;
    const rest = Math.max(0, names.length - SHOWN);
    const label =
      names.length === 0
        ? 'Tracks…'
        : `Tracks: ${names.slice(0, SHOWN).join(', ')}${rest > 0 ? ` +${String(rest)}` : ''}`;
    const opener = chip(label, { id: 'plan-tracks-open', onClick: () => openTracksSheet() });
    // The label is a summary, so the accessible name has to be the action.
    opener.setAttribute(
      'aria-label',
      `Choose tracks — ${String(names.length)} of ${String(curriculum.tracks.length)} on`,
    );
    trackRow.append(opener);

    // One line of occasional links, and *below* the list rather than above it
    // (`04` §0 R1, R3). All three are read occasionally and none is the thing
    // the screen is for; two of them — the placement test and how to
    // practise — are rungs that already appear in the list, so at the top
    // they were pushing the subject down to repeat it.
    linkRow.replaceChildren(
      button('Placement test', () => router.navigateLesson('0.4'), {
        id: 'plan-placement',
        variant: 'quiet',
      }),
      el('span.plan-sep', { text: '·', 'aria-hidden': 'true' }),
      button('Review a skill', () => router.navigate('plan', 'skills'), {
        id: 'plan-skills',
        variant: 'quiet',
      }),
      el('span.plan-sep', { text: '·', 'aria-hidden': 'true' }),
      button('How to practise', () => router.navigateLesson('practice.1'), {
        id: 'plan-practice',
        variant: 'quiet',
      }),
    );
  }

  /**
   * Every track, its switch, and the order — behind one chip.
   *
   * Two things about the order of the rows, both of them fixes:
   *
   *  - **The tracks that are on come first, in the order they are stored in.**
   *    The list used to be drawn in curriculum order whatever `activeTracks`
   *    said, so after a drag and any redraw the sheet showed one order and
   *    stored another — the arrows moved rows that snapped back the next time
   *    a chip was tapped.
   *  - **The rest are grouped into families.** Sixteen tracks in one flat
   *    list is the thing that made choosing between them hard; a ladder that
   *    runs from Stage 5 to Stage 9 and a one-rung mini-module are not the
   *    same kind of offer and should not read as one. The families are drawn
   *    only below the active block, so no heading ever falls between two
   *    draggable rows and the drag's hit-testing keeps measuring a contiguous
   *    column.
   */
  function openTracksSheet(): void {
    if (!curriculum) return;
    const sheet = openSheet('Tracks', { id: 'plan-tracks-sheet' });
    // A column of rows, not one wrapping row of everything.
    //
    // The chips and their arrows used to be appended straight into a
    // `.filter-row`, all siblings, so they flowed as a single stream: arrows
    // ended up under the wrong track, some lines carried three pairs of them,
    // and two names shared a line. Each track is its own row now, and the row
    // does not wrap.
    const listEl = el('div.track-list', { id: 'plan-tracks-list' });
    // The one control here that refuses a tap — `core` — has to say so where
    // the tap landed. The screen's own status line is no good for it:
    // `openSheet`'s `isolate()` makes everything outside the sheet `inert`
    // and the sheet covers it besides, so a message written there is both
    // unreachable by a screen reader (`inert` pulls it out of the
    // accessibility tree) and invisible. `statusLine` gives this sheet the
    // same announced, self-clearing line every full screen has.
    const sheetStatus = statusLine('plan-tracks-sheet-status');
    // Which row element belongs to which track, so a drag can move rows
    // around without rebuilding them — see `reorderActiveRows`.
    const rowsByTrack = new Map<string, HTMLElement>();
    const units = unitsPerTrack(curriculum);

    /**
     * Moves each active track's existing row to the slot matching its
     * current place in `activeTracks`, in the existing DOM nodes rather than
     * through `redraw()`.
     *
     * `redraw()` would reorder them too, but it tears every row down and
     * builds new ones — including whichever chip the pointer is presently
     * captured by, and a chip that stops being the element holding that
     * capture mid-drag ends the gesture the finger is still in the middle
     * of. This moves the same elements instead: same listeners, same
     * capture, just re-parented.
     *
     * `listEl`'s children are live, so reading a child's index and then
     * moving a node earlier in the same pass invalidates every index after
     * it. Comment placeholders mark each active row's slot before anything
     * moves, so the slots keep their identity independent of which row ends
     * up filling them.
     */
    const reorderActiveRows = (): void => {
      const slotFor = new Map<string, Comment>();
      for (const id of activeTracks) {
        const row = rowsByTrack.get(id);
        if (!row?.parentElement) continue;
        const marker = document.createComment(id);
        row.replaceWith(marker);
        slotFor.set(id, marker);
      }
      // `slotFor`'s insertion order followed `activeTracks`, not the
      // document — read the markers back out of `listEl` for their real,
      // top-to-bottom order.
      const slotsInOrder = Array.from(listEl.childNodes).filter(
        (child): child is Comment => child instanceof Comment && slotFor.get(child.data) === child,
      );
      activeTracks.forEach((id, index) => {
        const row = rowsByTrack.get(id);
        const slot = slotsInOrder[index];
        if (row && slot) slot.replaceWith(row);
      });
    };

    const rowFor = (track: Track, on: boolean): HTMLElement => {
      const node = chip(track.title, {
        id: `plan-track-${track.id}`,
        pressed: on,
        dataset: {
          'data-track': track.id,
          'data-order': String(activeTracks.indexOf(track.id)),
        },
        onClick: () => {
          if (suppressClickFor === track.id) {
            suppressClickFor = null;
            return;
          }
          // `core` is the spine of the stages; switching it off would empty
          // the plan, so it is not a toggle.
          if (track.id === 'core') {
            sheetStatus.textContent = 'The core path is always on — it is what the stages are.';
            return;
          }
          commitOrder(
            on
              ? activeTracks.filter((candidate) => candidate !== track.id)
              : [...activeTracks, track.id],
          );
          redraw();
        },
      });
      if (on && track.id !== 'core') makeDraggable(node, track.id, reorderActiveRows);
      const row = el('div.track-row', { 'data-row-track': track.id });
      row.append(node);
      rowsByTrack.set(track.id, row);
      if (on && track.id !== 'core') {
        // The fallback. A drag is not reachable from a keyboard and is
        // awkward with a tremor; two buttons are neither.
        const index = activeTracks.indexOf(track.id);
        row.append(
          el(
            'div.track-row__moves',
            {},
            button('▲', () => { commitOrder(moveUp(activeTracks, index)); redraw(); }, {
              id: `plan-track-up-${track.id}`,
              variant: 'quiet',
              className: 'track-move',
              title: `Move ${track.title} earlier`,
            }),
            button('▼', () => { commitOrder(moveDown(activeTracks, index)); redraw(); }, {
              id: `plan-track-down-${track.id}`,
              variant: 'quiet',
              className: 'track-move',
              title: `Move ${track.title} later`,
            }),
          ),
        );
      }
      return row;
    };

    const redraw = (): void => {
      listEl.replaceChildren();
      rowsByTrack.clear();
      const tracks = curriculum?.tracks ?? [];
      const byId = new Map(tracks.map((track) => [track.id, track]));
      // On, in the stored order, and contiguous — see the note on this
      // function about why no heading may fall inside this block.
      for (const id of activeTracks) {
        const track = byId.get(id);
        if (track) listEl.append(rowFor(track, true));
      }
      const off = tracks.filter((track) => !activeTracks.includes(track.id));
      if (off.length === 0) {
        // `04` §0 R4: say so rather than leaving a heading over nothing.
        listEl.append(
          el('p.muted.track-empty', {
            id: 'plan-tracks-all-on',
            text: 'Every track is switched on.',
          }),
        );
        return;
      }
      for (const family of FAMILY_ORDER) {
        const members = off.filter(
          (track) => familyOf(track.id, units.get(track.id) ?? 0) === family,
        );
        if (members.length === 0) continue;
        listEl.append(
          el('p.track-family', { 'data-family': family, text: FAMILY_TITLES[family] }),
        );
        for (const track of members) listEl.append(rowFor(track, false));
      }
    };

    redraw();
    sheet.body.append(
      el('p.muted', {
        text: 'Switch a track on or off. Drag or use the arrows to order the ones that are on.',
      }),
      sheetStatus,
      listEl,
    );
  }

  void (async () => {
    const [loaded, rows, plan] = await Promise.all([loadCurriculum(), allProgress(), getPlan()]);
    curriculum = loaded;
    records = rows.map((row) => ({
      itemId: row.itemId,
      passed: row.status === 'passed' || row.status === 'mastered',
      mastered: row.status === 'mastered',
    }));
    activeTracks = activeTracksFor(plan, loaded);
    // Expand the stage being worked on, so the screen opens where the learner is.
    const recommended = nextRecommended(loaded, records, activeTracks, {
      requireTwoSongs: getSettings().requireTwoSongs,
    });
    if (recommended) expanded.add(recommended.stageNumber);
    drawTracks();
    draw();
    // Keep the catalog warm: the lesson page needs it a tap later.
    void allItems();
  })().catch((cause: unknown) => {
    status.textContent = `The plan could not be loaded: ${String(cause)}`;
    status.classList.add('status--error');
  });

  onScreenDispose(section, () => undefined);
  return section;
}
