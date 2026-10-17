// The task line (owner, 2026-10-16, the consistency pass): every screen an activity opens shows what to do there in
// one line of one style (`.step-task`): a lesson step's task (its `about`), else the activity's title. When the learner
// changes what the step set (its set, help level, cards, timing, mode, hands, bars, the way of practising), the line
// stays and says so under it: "Practice now: not counted for the step", with why, from the same rule the step's result
// uses (lesson/result.ts playedAsSet), so the learner knows before playing, not after.

import { stepFor } from '../log';
import { playedAsSet, type Played } from './result';

/**
 * Fills a screen's task line for the activity in force there. live: what the screen would play now, in the log's
 * terms (its set or piece, mode and settings); left out, nothing is compared.
 */
export function fillTaskLine(el: HTMLElement, screen: string, live?: Played): void {
  const a = stepFor(screen);
  const text = a ? a.task || a.title || '' : '';
  const why = a?.lesson && a.activity && live ? playedAsSet(live, a.activity) : '';
  const key = `${text}|${why}`;
  if (el.dataset.k === key) return; // (unchanged: nothing redrawn)
  el.dataset.k = key;
  el.hidden = !text;
  el.classList.add('step-task');
  el.classList.toggle('practice', !!why);
  const t = Object.assign(document.createElement('span'), { className: 't', textContent: text });
  t.title = text; // (the whole task, where the line is cut short)
  el.replaceChildren(t, ...(why ? [Object.assign(document.createElement('span'), { className: 'p', textContent: `Practice now: not counted for the step (${why})` })] : []));
}
