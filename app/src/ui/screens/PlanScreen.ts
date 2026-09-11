/**
 * Plan (docs/04 §3): the curriculum, browsable end to end.
 *
 * Every lesson is openable regardless of status. The whole point of a personal
 * build is that the owner can skip ahead, and a plan that locks him out of
 * Stage 4 until Stage 3 is ticked would be the app arguing with him. Strict
 * prerequisites exist as a setting for anyone who wants the argument.
 */
import type { Router } from '../../router';
import { allItems, loadCurriculum } from '../../curriculum/load';
import { lessonComplete } from '../../curriculum/selectors';
import { getSettings } from '../../data/settingsStore';
import { nextRecommended } from '../../curriculum/session';
import { activeTracksFor } from '../../curriculum/tracks';
import { indexAtPoint, isDrag, moveDown, moveItem, moveUp } from '../reorder';
import type { Curriculum, Lesson, PassRecord, Stage } from '../../curriculum/types';
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

function completion(
  stage: Stage,
  records: PassRecord[],
  options: { requireTwoSongs?: boolean },
): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const unit of stage.units) {
    for (const lesson of unit.lessons) {
      total += 1;
      if (lessonComplete(lesson, records, options)) done += 1;
    }
  }
  return { done, total };
}

export function PlanScreen(router: Router): HTMLElement {
  const { section, header, body } = screenFrame('plan', 'Plan');
  const status = statusLine('plan-status');
  const trackRow = el('div.filter-row', { id: 'plan-tracks' });
  const list = el('div.list', { id: 'plan-list' });

  let curriculum: Curriculum | null = null;
  let records: PassRecord[] = [];
  /** Set by a drag so the click it produced does not also toggle the track. */
  let suppressClickFor: string | null = null;
  let activeTracks: string[] = [];

  const linkRow = el('div.plan-links', { id: 'plan-links' });
  header.append(trackRow, linkRow);
  body.append(list, status);

  function lessonRow(lesson: Lesson): HTMLElement {
    const done = lessonComplete(lesson, records, { requireTwoSongs: getSettings().requireTwoSongs });
    const badges: HTMLElement[] = [];
    if (done) badges.push(badge('complete', 'passed'));
    if (lesson.songOptional) badges.push(badge('no song needed'));
    // No subtitle. It was the unit's title, printed under a card whose own
    // title usually *is* the unit's title, under a heading that says it a third
    // time — three sizes of the same words for a third of the screen
    // (`04` §3, `00` D26).
    return listRow({
      title: `${lesson.id} · ${lesson.title}`,
      meta: `${String(lesson.exerciseOptions.length)} exercises · ${String(
        lesson.songOptions.length,
      )} songs${lesson.estimatedDays ? ` · ~${String(lesson.estimatedDays)} days` : ''}`,
      badges,
      onClick: () => router.navigateLesson(lesson.id),
      dataset: { 'data-lesson': lesson.id },
    });
  }

  function draw(): void {
    if (!curriculum) return;
    const recommended = nextRecommended(curriculum, records, activeTracks, {
      requireTwoSongs: getSettings().requireTwoSongs,
      strictPrerequisites: getSettings().strictPrerequisites,
    });
    list.replaceChildren();

    for (const stage of curriculum.stages) {
      const { done, total } = completion(stage, records, {
        requireTwoSongs: getSettings().requireTwoSongs,
      });
      const open = expanded.has(stage.number);
      const head = listRow({
        title: `Stage ${String(stage.number)} · ${stage.title}`,
        subtitle: stage.summary,
        meta: `${String(done)} of ${String(total)} lessons${
          stage.approxDuration ? ` · ${stage.approxDuration}` : ''
        }`,
        badges: done === total && total > 0 ? [badge('complete', 'passed')] : [],
        // The row is the toggle, so the button beside it was a second way to
        // do the same thing taking a tap target's worth of width. A chevron
        // says which way it will go without claiming to be pressable itself.
        actions: [el('span.plan-chevron', { text: open ? '⌄' : '›', 'aria-hidden': 'true' })],
        onClick: () => {
          if (open) expanded.delete(stage.number);
          else expanded.add(stage.number);
          draw();
        },
        dataset: { 'data-stage': stage.number, 'data-open': open },
      });
      list.append(head);
      if (!open) continue;

      let drawn = 0;
      for (const unit of stage.units) {
        if (activeTracks.length > 0 && unit.track !== 'core' && !activeTracks.includes(unit.track)) continue;
        drawn += unit.lessons.length;
        // The unit heading earns its line only when it is not simply the
        // lesson's title again: a unit of one lesson with the same name says
        // nothing twice.
        const echoes =
          unit.lessons.length === 1 &&
          unit.lessons[0]?.title.trim().toLowerCase() === unit.title.trim().toLowerCase();
        if (!echoes) {
          list.append(
            el('p.plan-unit.muted', { text: `${unit.id} · ${unit.title} — ${unit.track}` }),
          );
        }
        for (const lesson of unit.lessons) list.append(lessonRow(lesson));
      }

      // `04` §0 R4. Stages 5 to 9 have no `core` units at all — every one of
      // them belongs to a side track — so switching off the four tracks that
      // are on by default leaves them expanding to nothing at all, under a
      // header still counting "3 of 12 lessons" because completion is counted
      // over the whole stage and not over what is on screen. An empty
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

    status.textContent = recommended
      ? `Next up: lesson ${recommended.lesson.id} — ${recommended.lesson.title}.`
      : 'Every lesson is complete.';
  }

  /**
   * Commits a new order and tells everything that reads it.
   *
   * `trackOrder` is what the session builder walks, so a reorder changes what
   * the app recommends next — which is the whole point of the gesture and the
   * reason it is worth confirming on screen.
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
   */
  function makeDraggable(node: HTMLElement, trackId: string): void {
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
        // toggle the track off.
        upEvent.preventDefault();
        suppressClickFor = trackId;
        commitOrder(activeTracks);
      };

      node.addEventListener('pointermove', move);
      node.addEventListener('pointerup', up);
      node.addEventListener('pointercancel', up);
    });
  }

  /**
   * The header: the tracks he is on, and one chip that opens the rest.
   *
   * It used to be all fifteen tracks as chips with a pair of ▲▼ beside each
   * active one — about 470 px of a 780 px screen, so Stage 0 began below the
   * fold. Choosing and ordering tracks is done once and then not again for
   * months (`04` §0 R3), so it moves into a sheet and the daily screen keeps
   * only the answer.
   */
  function drawTracks(): void {
    if (!curriculum) return;
    trackRow.replaceChildren();
    // A bounded answer, not a list. Fifteen tracks switched on would be fifteen
    // chips and six rows of header, which is the problem this change exists to
    // remove — so the header names the first few and the chip counts the rest.
    const SHOWN = 3;
    for (const id of activeTracks.slice(0, SHOWN)) {
      const track = curriculum.tracks.find((candidate) => candidate.id === id);
      if (!track) continue;
      trackRow.append(
        // A different id from the sheet's chip for the same track: both are on
        // the page while the sheet is open, and two elements cannot share one.
        chip(track.title, {
          id: `plan-active-${track.id}`,
          pressed: true,
          // `data-track` says which; `data-order` belongs to the sheet, which
          // is where the order is set and the only place it should be read.
          dataset: { 'data-track': track.id },
        }),
      );
    }
    const hidden = Math.max(0, activeTracks.length - SHOWN);
    trackRow.append(
      chip(hidden > 0 ? `Tracks… +${String(hidden)}` : 'Tracks…', {
        id: 'plan-tracks-open',
        onClick: () => openTracksSheet(),
      }),
    );

    // One line of links rather than three boxes on two rows. All three are read
    // occasionally and none is the thing the screen is for (`04` §0 R3), and as
    // boxes they took eighty-eight pixels off the top of the stage list.
    // `How to practise` is here because it left Today, where it was one of six
    // boxes of equal weight on the screen opened every day.
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

  /** Every track, its switch, and the order — behind one chip. */
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

    const redraw = (): void => {
      listEl.replaceChildren();
      for (const track of curriculum?.tracks ?? []) {
        const on = activeTracks.includes(track.id);
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
              status.textContent = 'The core path is always on — it is what the stages are.';
              return;
            }
            commitOrder(
              on ? activeTracks.filter((candidate) => candidate !== track.id) : [...activeTracks, track.id],
            );
            redraw();
          },
        });
        if (on && track.id !== 'core') makeDraggable(node, track.id);
        const row = el('div.track-row', { 'data-row-track': track.id });
        row.append(node);
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
        listEl.append(row);
      }
    };

    redraw();
    sheet.body.append(
      el('p.muted', { text: 'Switch a track on or off, and drag or use the arrows to order them.' }),
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
