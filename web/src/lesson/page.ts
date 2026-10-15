// A lesson's page (owner, 2026-10-15; mockup web/mockups/path.html D and E): its title and blocks in the order the
// content gives them (lesson/blocks.ts draws each), a bottom bar that starts the next step not yet done, and after a
// step's run, what happened and its feedback (owner, 2026-10-15: Hard / OK / Easy and an optional note, both skippable), written to the
// practice log with the step, lesson and rung. Steps never lock: every step has its Start, done or not.

import { $, type App } from '../app';
import { button, el } from '../ui';
import type { Activity } from '../activity';
import { entries, putEntry, type LessonRef, type LogEntry } from '../log';
import type { Sound } from '../sound';
import { drawBlock } from './blocks';
import { stopMiniScores } from './miniscore';
import { activityOf, describe, lessonOrder, lessonState, loadPath, nextTodo, placeOf, stepStates, stepsOf, type PathData, type StepBlock } from './path';
import { doneSteps, markDone, markTried, setCurrentLesson } from './progress';
import { checkTarget, type Lesson, type Target } from './read';
import { bestLine, outcome, type StepOutcome } from './result';

export interface LessonDeps {
  app: App;
  sound: Sound;
  prepare: () => Promise<void>;
  /** Opens the step's activity on its screen (one more place on top); false when it could not open. */
  launch: (a: Activity, ref: LessonRef) => Promise<boolean>;
  /** The Switch… sheet, for this lesson. */
  openSwitch: (lessonId: string) => void;
  /** Another lesson in this page's place (the next lesson, or one chosen in Switch…). */
  openLesson: (lessonId: string) => void;
  /** The result after a step is a place of its own over the lesson page (review 2026-10-15, V12: ← and Back from it
   * are the lesson page); pushed only if it is not on top already (Again from the result comes back to it). */
  showResult: () => void;
  /** ← from the result (the same as Back), and then something else (another lesson). */
  back: (then?: () => void) => void;
}


/** A step being played: from when, so its runs (tagged with it in the log) can be found when you come back. */
interface Pending { lesson: string; step: string; ref: LessonRef; since: string; activity: Activity; target?: Target }
/** The result shown after a step: kept until you go on, so its feedback entry is the same one tap after tap. */
interface Shown { pending: Pending; out: StepOutcome; at: string; feedback: { effort?: 'hard' | 'ok' | 'easy'; note?: string };
  /** This step finished the lesson (every step done now, not before), and the lesson to go on to. */
  lessonDone: boolean; nextLesson?: string }

export function createLessonPage(d: LessonDeps) {
  const body = $('lesson-body'), where = $('lesson-where'), bar = $('lesson-bar');
  /** The bottom bar (fixed under the page: review 2026-10-15, V28): a note and buttons. */
  function setBar(note: string, buttons: HTMLButtonElement[]): void {
    bar.hidden = false;
    bar.replaceChildren(...(note ? [el('span', 'lesson-bar-note', note)] : []), el('span', 'lab-sp'), ...buttons);
  }
  let data: PathData | null = null, lesson: Lesson | null = null;
  let pending: Pending | null = null, shown: Shown | null = null;
  let drawn = 0; // each drawing's number: an older one finishing late leaves the page alone

  /** Shows the lesson; startStep: then starts that step at once (Start ▶ on Home: you come back here after it). */
  async function show(id: string, startStep?: string): Promise<void> {
    const n = ++drawn;
    data = await loadPath();
    if (n !== drawn) return;
    lesson = data.lessons.get(id) ?? null;
    if (!lesson) { where.textContent = 'Lesson'; body.replaceChildren(el('p', 'note', `There is no lesson "${id}" on the path${data.problems.length ? ` (${data.problems.join('; ')})` : ''}.`)); bar.hidden = true; return; }
    setCurrentLesson(id);
    if (shown && shown.pending.lesson !== id) shown = null;
    render();
    const step = startStep ? stepsOf(lesson).find((s) => s.id === startStep) : undefined;
    if (step) await start(step);
  }

  function render(): void {
    if (!lesson || !data) return;
    stopMiniScores();
    const place = placeOf(data, lesson.id)!;
    where.textContent = `Rung ${place.rungNo} · Lesson ${place.no}`;
    if (shown) { renderResult(); return; }
    const steps = stepsOf(lesson), state = lessonState(lesson);
    const states = stepStates(lesson);
    const ctx = { app: d.app, sound: d.sound, prepare: d.prepare, step: (b: StepBlock) => stepCard(b, steps.indexOf(b) + 1, states.get(b.id)!) };
    const out: HTMLElement[] = [el('h2', 'les-title', lesson.title)];
    for (const b of lesson.blocks) out.push(drawBlock(b, ctx));
    const column = el('div', 'les-column');
    column.append(...out);
    body.replaceChildren(column);
    body.scrollTop = 0;
    // The bottom bar: the next step not done, or the lesson done (and the next lesson, if there is one).
    if (state.next) {
      const go = button(`Start step ${state.nextNo} ▶`, 'btn main', () => void start(state.next!));
      go.id = 'lesson-next';
      setBar(`${state.done} of ${state.total} steps done`, [go]);
    } else {
      const order = lessonOrder(data), at = order.findIndex((x) => x.lesson.id === lesson!.id), after = order[at + 1];
      setBar(state.total ? `Lesson done: all ${state.total} steps` : 'No steps in this lesson', after ? [button('Next lesson ▶', 'btn main', () => d.openLesson(after.lesson.id))] : []);
    }
  }

  /** A step: its state in words (target met, played, tried, skipped, up next, to come), what it is, what "done" means, and its Start (never locked). */
  function stepCard(b: StepBlock, no: number, st: { mark: string; words: string; cls: string; at?: string }): HTMLElement {
    const doneAt = doneSteps(lesson!.id)[b.id];
    const isNext = st.cls.includes('next');
    const card = el('div', `les-step ${st.cls}`.trim());
    card.dataset.step = b.id;
    const mark = el('span', 'les-step-mark', st.mark);
    mark.setAttribute('aria-hidden', 'true');
    const text = el('div', 'les-step-text');
    const what = el('div', 'les-step-what', ' ');
    const date = st.at ? ` · ${new Date(st.at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}` : '';
    text.append(el('div', 'les-step-title', `Step ${no} · ${b.title}`), el('div', `les-step-state ${st.cls}`, `${st.words}${date}`), what);
    if (b.about) text.append(el('div', 'les-step-about', b.about));
    if (b.doneWhen) text.append(el('div', 'les-step-when', `Done when: ${b.doneWhen}`));
    void activityOf(b).then((a) => describe(a, d.app)).then((s) => { what.textContent = s; }, (e) => { what.textContent = `Cannot open: ${e instanceof Error ? e.message : String(e)}`; what.classList.add('les-bad'); });
    card.append(mark, text, button(doneAt ? 'Again ▶' : 'Start ▶', `btn${isNext ? ' main' : ''}`, () => void start(b)));
    return card;
  }

  /** Opens the step's activity; its runs are tagged with the step until you come back. */
  async function start(b: StepBlock): Promise<void> {
    if (!lesson || !data) return;
    let a: Activity, target: Target | undefined;
    try { a = await activityOf(b); target = checkTarget(b, a); } catch (e) {
      d.app.showMessage(`Step “${b.title}” cannot open: ${e instanceof Error ? e.message : String(e)}`);
      return;
    }
    const place = placeOf(data, lesson.id)!;
    const ref: LessonRef = { rung: place.rung.id, lesson: lesson.id, step: b.id };
    shown = null;
    stopMiniScores();
    const mine = { lesson: lesson.id, step: b.id, ref, since: new Date(Date.now() - 1000).toISOString(), activity: a, target };
    pending = mine;
    // (a second Start while this one waits for its piece wins; this one, overtaken, leaves the second's step in place)
    if (!await d.launch(a, ref) && pending === mine) pending = null;
  }

  /** Back from a step's screen: what happened, the step done if it was, and the feedback taps. */
  function returned(): void {
    const p = pending;
    pending = null;
    if (!p || !lesson || p.lesson !== lesson.id) { render(); return; }
    const runs = entries().filter((e) => e.screen !== 'lesson' && e.lesson?.lesson === p.lesson && e.lesson.step === p.step && e.at >= p.since);
    const out = outcome(runs, p.activity, p.target, true);
    const wasDone = !lessonState(lesson).next;
    if (out.done) markDone(p.lesson, p.step, out.met && p.target ? 'target' : out.runs ? 'played' : 'opened');
    else if (out.runs) markTried(p.lesson, p.step);
    // Its last step just done: the lesson you are on moves on to the next with steps to do (Home's Up next follows), and
    // the result says so and offers it (review 2026-10-15, V17).
    const lessonDone = !wasDone && !lessonState(lesson).next;
    const after = lessonDone && data ? nextTodo(data, lesson.id) : undefined;
    if (after) setCurrentLesson(after.id);
    shown = { pending: p, out, at: new Date().toISOString(), feedback: {}, lessonDone, nextLesson: after?.id };
    d.showResult();
    render();
  }

  function renderResult(): void {
    const s = shown!, steps = stepsOf(lesson!), b = steps.find((x) => x.id === s.pending.step);
    if (!b) { shown = null; render(); return; }
    const no = steps.indexOf(b) + 1;
    const card = el('div', 'today les-result');
    const done = doneSteps(lesson!.id)[b.id];
    // This attempt, in its own words; then the step's state; then the best of every attempt so far, kept apart.
    card.append(el('div', 'k', `Step ${no} · ${b.title}`), el('div', 'h', `This time: ${s.out.line}`));
    // The step's state in honest words (review 2026-10-15, V18: a step with nothing to judge is "visited", not ✓).
    const state = s.pending.target
      ? (s.out.met ? `Target met${b.doneWhen ? ` (${b.doneWhen})` : ''}: step done ✓` : `Target${b.doneWhen ? ` (${b.doneWhen})` : ''} not met this time${done ? '; the step was done before' : ''}. You can try again or move on.`)
      : s.out.met ? 'Played through: step done ✓ (it has no target to meet)'
      : s.out.runs ? `Not through yet: the step is tried, not done${done ? ' (it was done before)' : ''}. You can try again or move on.`
      : s.out.done ? 'Visited: nothing here is judged or kept' : 'Nothing was played, so nothing is marked. You can try again or move on.';
    card.append(el('div', 's', state));
    if (s.lessonDone) {
      const nextTitle = s.nextLesson ? data?.lessons.get(s.nextLesson)?.title : undefined;
      card.append(el('div', 'les-done', `Lesson done: all ${steps.length} steps.${nextTitle ? ` Next: ${nextTitle}.` : ''}`));
    }
    const all = entries().filter((e) => e.screen !== 'lesson' && e.lesson?.lesson === s.pending.lesson && e.lesson.step === s.pending.step);
    if (all.length > s.out.runs) { const best = bestLine(all); if (best) card.append(el('div', 's', `Best so far: ${best}`)); }
    // Feedback (owner, 2026-10-15: after every step): taps that go to the practice log with the step.
    const save = () => {
      const f = s.feedback;
      if (f.effort === undefined && !f.note) return;
      const e: LogEntry = { at: s.at, seconds: 0, screen: 'lesson', title: b.title, activity: s.pending.activity.id, lesson: s.pending.ref, settings: {},
        result: { feedback: { ...(f.effort ? { effort: f.effort } : {}), ...(f.note ? { note: f.note } : {}) }, done: s.out.done, runs: s.out.runs, line: s.out.line } };
      putEntry(e);
    };
    const choice = <T,>(options: [T, string][], get: () => T | undefined, set: (v: T | undefined) => void, label: string) => {
      const row = el('div', 'fb');
      row.setAttribute('role', 'group');
      row.setAttribute('aria-label', label);
      for (const [v, text] of options) {
        const btn = button(text, 'fb-b', () => { set(get() === v ? undefined : v); save(); fill(); });
        btn.dataset.v = String(v);
        row.append(btn);
      }
      const fill = () => { for (const btn of row.querySelectorAll<HTMLButtonElement>('button')) btn.setAttribute('aria-pressed', String(btn.dataset.v === String(get()))); };
      fill();
      return row;
    };
    const note = el('textarea', 'fb-note');
    note.placeholder = 'A note for Claude (optional)…';
    note.rows = 2;
    note.value = s.feedback.note ?? '';
    note.addEventListener('input', () => { s.feedback.note = note.value.trim() || undefined; save(); });
    // Again and the way on are always there, in the fixed bar under the page (steps never lock; V28: in view at any size).
    // The way on: the next step; after the lesson's last step, the next lesson (V17).
    const firstLeft = lessonState(lesson!).next; // (after the last step of a lesson not done: the first step left)
    const nextStep = steps[no] ?? (firstLeft && firstLeft.id !== b.id ? firstLeft : undefined);
    const buttons = [button('Again', 'btn', () => void start(b)), button('Lesson', 'btn', () => d.back())];
    buttons[1].setAttribute('aria-label', 'Back to the lesson');
    if (s.lessonDone && s.nextLesson) { const id = s.nextLesson; buttons.push(button('Next lesson ▶', 'btn main', () => d.back(() => d.openLesson(id)))); }
    else if (nextStep) buttons.push(button(`Next: step ${steps.indexOf(nextStep) + 1} ▶`, 'btn main', () => void start(nextStep)));
    setBar('', buttons);
    const column = el('div', 'les-column');
    column.append(card, el('div', 'lbl', 'How was it? (optional)'),
      choice<'hard' | 'ok' | 'easy'>([['hard', 'Hard'], ['ok', 'OK'], ['easy', 'Easy']], () => s.feedback.effort, (v) => { s.feedback.effort = v; }, 'How hard it was'),
      note, el('p', 'note', 'Both are optional. What you tap or write goes in your practice log with this step, for Claude to plan the next lesson from.'));
    body.replaceChildren(column);
    body.scrollTop = 0;
  }

  return {
    show,
    returned,
    /** A step is being played (its screen open). */
    get pending() { return !!pending; },
    /** Leaving the page: what plays stops, the result shown goes. */
    leave(): void { stopMiniScores(); shown = null; drawn++; },
    /** The result's place was taken off (←, Back): the lesson page again. */
    closeResult(): void { shown = null; render(); },
    get lessonId() { return lesson?.id ?? ''; },
  };
}
export type LessonPage = ReturnType<typeof createLessonPage>;
