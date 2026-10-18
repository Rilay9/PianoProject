// Small helpers for the screens built in code (the shell, the lesson page and its blocks).

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

export function button(text: string, cls: string, run: () => void): HTMLButtonElement {
  const b = el('button', cls, text);
  b.type = 'button';
  b.addEventListener('click', run);
  return b;
}

/** "today", "yesterday", "3 days ago", or the date. */
export function ago(iso: string | undefined, now = new Date()): string {
  if (!iso) return '';
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return '';
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((day(now) - day(t)) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  return t.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/** "all 3 steps", or (a lesson with one) "its one step": never "all 1 steps" (lesson 2, 2026-10-18). */
export const allSteps = (n: number): string => (n === 1 ? 'its one step' : `all ${n} steps`);
/** "steps", or "step" for one ("0 of 1 step done"). */
export const stepsWord = (n: number): string => (n === 1 ? 'step' : 'steps');
