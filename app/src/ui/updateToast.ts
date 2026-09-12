/**
 * "A new version is ready — reload" (docs/01 §7, P9).
 *
 * Deliberately a prompt and never automatic. A service worker that swapped
 * itself in mid-practice would reload the page under a running session, and
 * the one moment this app must not interrupt is someone playing a piece. So
 * the new worker waits, this says so, and the learner reloads when they are
 * between things.
 *
 * It never appears when "offline only" is on (`04` §7, `00` D20): that setting
 * means the app is not to check for updates at all, and a toast about one
 * would be a check the owner asked not to happen.
 */
const TOAST_ID = 'update-toast';

import { toastStack } from './toastStack';

export interface UpdatePrompt {
  /** Applies the waiting worker and reloads. */
  apply: () => void;
}

/**
 * Shows the toast, once.
 *
 * `root` must be `document.body` in the running app, and the default is the
 * only value `main.ts` passes. `.update-toast` is `position: absolute` — it
 * was `fixed` until the owner photographed it half under the address bar, and
 * a fixed box is positioned against the layout viewport, which Chrome on
 * Android sizes with the bar retracted. Absolute means it is positioned
 * against the nearest *positioned* ancestor instead, and the stylesheet makes
 * that `body`: `position: relative`, `height: 100dvh`, `overflow: hidden`. So
 * `body` is exactly the box that can be seen, the document never scrolls, and
 * the toast lands on the visible bottom edge.
 *
 * The consequence for this module: passing any other `root` re-anchors the
 * toast to whatever positioned ancestor that element has — a scrolling
 * `.screen-body`, most likely, which would carry the toast away with the list.
 * Nothing here reads the viewport, so there is nothing else to keep in step.
 */
export function showUpdateToast(prompt: UpdatePrompt, root: HTMLElement = document.body): HTMLElement {
  const existing = document.getElementById(TOAST_ID);
  if (existing) return existing;

  const toast = document.createElement('div');
  toast.id = TOAST_ID;
  toast.className = 'update-toast';
  toast.setAttribute('role', 'status');

  const text = document.createElement('span');
  text.textContent = 'A new version is ready.';
  toast.appendChild(text);

  const reload = document.createElement('button');
  reload.type = 'button';
  reload.className = 'button button--primary';
  reload.id = 'update-reload';
  reload.textContent = 'Reload';
  reload.addEventListener('click', () => prompt.apply());
  toast.appendChild(reload);

  const later = document.createElement('button');
  later.type = 'button';
  later.className = 'link-button';
  later.id = 'update-later';
  later.textContent = 'Later';
  later.addEventListener('click', () => toast.remove());
  toast.appendChild(later);

  toastStack(root).appendChild(toast);
  return toast;
}
