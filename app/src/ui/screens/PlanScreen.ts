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
import { nextRecommended } from '../../curriculum/session';
import type { Curriculum, Lesson, PassRecord, Stage } from '../../curriculum/types';
import { allProgress } from '../../data/progressStore';
import { getPlan, updatePlan } from '../../data/planStore';
import { onScreenDispose } from '../screenLifecycle';
import { badge, button, chip, el, listRow } from '../widgets';
import { screenFrame, statusLine } from './screenFrame';

/** Stages the learner has expanded, kept across a redraw within one visit. */
const expanded = new Set<number>();

function completion(stage: Stage, records: PassRecord[]): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const unit of stage.units) {
    for (const lesson of unit.lessons) {
      total += 1;
      if (lessonComplete(lesson, records)) done += 1;
    }
  }
  return { done, total };
}

export function PlanScreen(router: Router): HTMLElement {
  const { section, header, body } = screenFrame('plan', 'Plan', 'Stages, units and lessons — open any of them.');
  const status = statusLine('plan-status');
  const trackRow = el('div.filter-row', { id: 'plan-tracks' });
  const list = el('div.list', { id: 'plan-list' });

  let curriculum: Curriculum | null = null;
  let records: PassRecord[] = [];
  let activeTracks: string[] = [];

  header.append(trackRow);
  body.append(list, status);

  function lessonRow(lesson: Lesson, unitTitle: string): HTMLElement {
    const done = lessonComplete(lesson, records);
    const badges: HTMLElement[] = [];
    if (done) badges.push(badge('complete', 'passed'));
    if (lesson.songOptional) badges.push(badge('no song needed'));
    return listRow({
      title: `${lesson.id} · ${lesson.title}`,
      subtitle: unitTitle,
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
    const recommended = nextRecommended(curriculum, records, activeTracks);
    list.replaceChildren();

    for (const stage of curriculum.stages) {
      const { done, total } = completion(stage, records);
      const open = expanded.has(stage.number);
      const head = listRow({
        title: `Stage ${String(stage.number)} · ${stage.title}`,
        subtitle: stage.summary,
        meta: `${String(done)} of ${String(total)} lessons${
          stage.approxDuration ? ` · ${stage.approxDuration}` : ''
        }`,
        badges: done === total && total > 0 ? [badge('complete', 'passed')] : [],
        actions: [button(open ? 'Hide' : 'Open', () => {
          if (open) expanded.delete(stage.number);
          else expanded.add(stage.number);
          draw();
        }, { variant: 'quiet' })],
        onClick: () => {
          if (open) expanded.delete(stage.number);
          else expanded.add(stage.number);
          draw();
        },
        dataset: { 'data-stage': stage.number, 'data-open': open },
      });
      list.append(head);
      if (!open) continue;

      for (const unit of stage.units) {
        if (activeTracks.length > 0 && unit.track !== 'core' && !activeTracks.includes(unit.track)) continue;
        list.append(el('p.plan-unit.muted', { text: `${unit.id} · ${unit.title} — ${unit.track}` }));
        for (const lesson of unit.lessons) list.append(lessonRow(lesson, unit.title));
      }
    }

    status.textContent = recommended
      ? `Next up: lesson ${recommended.lesson.id} — ${recommended.lesson.title}.`
      : 'Every lesson is complete.';
  }

  function drawTracks(): void {
    if (!curriculum) return;
    trackRow.replaceChildren();
    for (const track of curriculum.tracks) {
      const on = activeTracks.includes(track.id);
      trackRow.append(
        chip(track.title, {
          id: `plan-track-${track.id}`,
          pressed: on,
          onClick: () => {
            // `core` is the spine of the stages; switching it off would empty
            // the plan, so it is not a toggle.
            if (track.id === 'core') {
              status.textContent = 'The core path is always on — it is what the stages are.';
              return;
            }
            activeTracks = on
              ? activeTracks.filter((id) => id !== track.id)
              : [...activeTracks, track.id];
            void updatePlan({ trackOrder: activeTracks });
            drawTracks();
            draw();
          },
        }),
      );
    }
    trackRow.append(
      button('Placement test', () => router.navigateLesson('0.4'), { id: 'plan-placement', variant: 'quiet' }),
      button('Review a skill', () => router.navigate('plan', 'skills'), { id: 'plan-skills', variant: 'quiet' }),
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
    activeTracks =
      plan.trackOrder.length > 1
        ? plan.trackOrder
        : loaded.tracks.filter((track) => track.defaultActive !== false).map((track) => track.id);
    // Expand the stage being worked on, so the screen opens where the learner is.
    const recommended = nextRecommended(loaded, records, activeTracks);
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
