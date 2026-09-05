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

export interface UpdatePrompt {
  /** Applies the waiting worker and reloads. */
  apply: () => void;
}

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

  root.appendChild(toast);
  return toast;
}
