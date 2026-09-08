/**
 * The handful of DOM shapes every P7 screen builds out of.
 *
 * No framework: the app is one bundle on one phone, and a list of 570 catalog
 * rows is faster to build by hand than to diff. What these do buy is
 * consistency — one definition of what a chip, a row and a bottom sheet are,
 * so five screens do not each invent their own.
 */
import type { LevelSource } from '../curriculum/types';

type Attrs = Record<string, string | number | boolean | undefined>;

/** `el('button.button--primary', { id: 'go' }, 'Start')`. */
export function el<K extends keyof HTMLElementTagNameMap>(
  spec: K | string,
  attrs: Attrs = {},
  ...children: (Node | string | null | undefined)[]
): HTMLElement {
  // `div.row.wide`, and `input#folder-search`. The id was *not* understood
  // until P19: `el('input#folder-search')` created an element whose tag name
  // was the whole string, so the folder screen's search box, style select,
  // level boxes and rated checkbox were not form controls at all — no value,
  // nothing to type into, and `search.value` reading undefined. It looked
  // right on the screen because an unknown element with a placeholder
  // attribute renders as an empty inline box.
  const [head = 'div', ...classes] = spec.split('.');
  const [tag = 'div', id] = head.split('#');
  const node = document.createElement(tag);
  if (id) node.id = id;
  if (classes.length) node.className = classes.join(' ');
  for (const [key, value] of Object.entries(attrs)) {
    // Only `undefined` means "not set". `false` is a value: `aria-pressed` and
    // `data-*` have to be written as "false" rather than left off, or an
    // unpressed chip has no pressed state at all — which reads as "not a
    // toggle" to a screen reader and matches nothing in a test.
    if (value === undefined) continue;
    if (key.startsWith('data-') || key === 'role' || key.startsWith('aria-')) {
      node.setAttribute(key, String(value));
    } else if (value === false) {
      // A DOM property, so `false` is simply assigned — except `class`, where
      // an empty string is what "no class" means.
      (node as unknown as Record<string, unknown>)[key] = false;
    } else if (key === 'text') {
      node.textContent = String(value);
    } else {
      (node as unknown as Record<string, unknown>)[key] = value;
    }
  }
  for (const child of children) {
    if (child === null || child === undefined) continue;
    node.append(child);
  }
  return node;
}

export function button(
  label: string,
  onClick: () => void,
  options: {
    id?: string;
    variant?: 'primary' | 'secondary' | 'quiet';
    title?: string;
    /**
     * What a screen reader should say, when the label is a glyph.
     *
     * `title` is not enough: the accessible name comes from the content
     * first, so a button whose content is "▶" is announced as "black
     * right-pointing triangle" however good the tooltip is.
     */
    ariaLabel?: string;
    /** Extra class, for the few buttons that need a shape of their own. */
    className?: string;
  } = {},
): HTMLButtonElement {
  const node = el('button', {
    type: 'button',
    className: [
      options.variant === 'quiet' ? 'link-button' : `button button--${options.variant ?? 'secondary'}`,
      options.className ?? '',
    ]
      .filter(Boolean)
      .join(' '),
    ...(options.id ? { id: options.id } : {}),
    ...(options.title ? { title: options.title } : {}),
    ...(options.ariaLabel ? { 'aria-label': options.ariaLabel } : {}),
    text: label,
  }) as HTMLButtonElement;
  node.addEventListener('click', onClick);
  return node;
}

/** A small toggle-able pill. Selection is `aria-pressed`, which tests can read. */
export function chip(
  label: string,
  options: { pressed?: boolean; onClick?: () => void; id?: string; dataset?: Attrs } = {},
): HTMLButtonElement {
  const node = el('button.chip', {
    type: 'button',
    text: label,
    'aria-pressed': options.pressed ?? false,
    ...(options.id ? { id: options.id } : {}),
    ...(options.dataset ?? {}),
  }) as HTMLButtonElement;
  if (options.onClick) node.addEventListener('click', options.onClick);
  return node;
}

export function badge(text: string, kind = 'neutral'): HTMLElement {
  return el('span.badge', { text, 'data-kind': kind });
}

export interface RowOptions {
  title: string;
  subtitle?: string;
  meta?: string;
  badges?: HTMLElement[];
  actions?: HTMLElement[];
  onClick?: () => void;
  dataset?: Attrs;
}

/**
 * A detail line cut to length by whole tokens (P21d B3).
 *
 * The line is ` · `-separated facts, and cutting it with `text-overflow`
 * cut it mid-fact: a shelf row read `page 14 · ≈…` and a Skills row
 * `Stage 0 · core · 1 t…`, where the part that was lost — how long it takes,
 * how many are left to practise — is the part the line was for. Half a word
 * says less than one fewer word does.
 *
 * So: drop whole tokens from the end until it fits, and then ellipsise
 * nothing. The first token always survives, however long it is; a row with
 * one very long fact is a different problem and truncating it here would
 * leave the line empty.
 */
export function fitDetail(text: string, maxChars: number): string {
  const tokens = text.split(' · ');
  while (tokens.length > 1 && tokens.join(' · ').length > maxChars) tokens.pop();
  return tokens.join(' · ');
}

/**
 * How many characters a detail line gets before tokens start dropping.
 *
 * A character count rather than a measurement, because the alternative is
 * laying the row out twice for every row on a screen of sixty. Tuned to the
 * narrowest screen the app is built for: at 360 px the text column is about
 * 200 px beside a row of actions, which is a little over forty characters at
 * the detail line's 0.85 rem.
 */
const DETAIL_CHARS = 42;

/** One item in a list: title, a line of metadata, badges, and buttons. */
export function listRow(options: RowOptions): HTMLElement {
  const text = el('div.list-row__text', {}, el('div.list-row__title', { text: options.title }));
  if (options.subtitle) text.append(el('div.list-row__sub', { text: options.subtitle }));
  // The detail line and the badges get a line each.
  //
  // They shared one, to keep a row inside `04` §0 R2's 96 px, and the badges
  // won: the meta is what shrinks, so a shelf row read "page 14 · ≈… and p.."
  // beside an intact "no rung", and a Skills row "Stage 0 · core · 0 to …"
  // beside "never". The line that carries the information was the one being
  // cut. Badges below it, always.
  if (options.meta) {
    text.append(
      el(
        'div.list-row__meta.muted',
        {},
        el('span.list-row__metatext', { text: fitDetail(options.meta, DETAIL_CHARS) }),
      ),
    );
  }
  if (options.badges?.length) {
    const line = el('div.list-row__badges');
    for (const b of options.badges) line.append(b);
    text.append(line);
  }

  const row = el('div.list-row', { ...(options.dataset ?? {}) }, text);
  if (options.actions?.length) {
    const actions = el('div.list-row__actions');
    for (const action of options.actions) actions.append(action);
    // A row is itself clickable, so a click on one of its buttons must not
    // also count as a click on the row — "Edit" would otherwise open the
    // score as well as the editor.
    actions.addEventListener('click', (event) => event.stopPropagation());
    row.append(actions);
  }
  if (options.onClick) {
    row.setAttribute('role', 'button');
    row.tabIndex = 0;
    row.addEventListener('click', options.onClick);
    row.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        options.onClick?.();
      }
    });
  }
  return row;
}

export interface Sheet {
  el: HTMLElement;
  body: HTMLElement;
  close: () => void;
}

/**
 * A bottom sheet — what "Swap this", the item detail and the import editor all
 * are. Modal by convention rather than by `<dialog>`: `<dialog>` on Android
 * WebView still fights the on-screen keyboard, and this needs no focus trap
 * beyond returning focus on close.
 */
export function openSheet(title: string, options: { id?: string } = {}): Sheet {
  const returnFocus = document.activeElement;
  const body = el('div.sheet__body');
  const close = (): void => {
    root.remove();
    if (returnFocus instanceof HTMLElement) returnFocus.focus();
  };
  const head = el(
    'div.sheet__head',
    {},
    el('h2', { text: title }),
    button('Close', close, { variant: 'quiet', id: options.id ? `${options.id}-close` : undefined }),
  );
  const panel = el('div.sheet__panel', { role: 'dialog', 'aria-label': title }, head, body);
  const root = el('div.sheet', { ...(options.id ? { id: options.id } : {}) }, panel);
  root.addEventListener('click', (event) => {
    if (event.target === root) close();
  });
  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });
  document.body.append(root);
  panel.focus();
  return { el: root, body, close };
}

/** A labelled control for the Settings screen's rows. */
export function field(label: string, control: HTMLElement, hint?: string): HTMLElement {
  const text = el('div.setting-row__text', {}, el('div', { text: label }));
  if (hint) text.append(el('div.muted', { text: hint }));
  if (control.id) {
    const labelEl = text.firstElementChild as HTMLElement;
    const real = el('label', { htmlFor: control.id, text: label });
    labelEl.replaceWith(real);
  }
  return el('div.setting-row', {}, text, control);
}

export function selectControl(
  id: string,
  options: { value: string; label: string }[],
  value: string,
  onChange: (value: string) => void,
): HTMLSelectElement {
  const select = el('select', { id }) as HTMLSelectElement;
  for (const option of options) {
    select.append(el('option', { value: option.value, text: option.label }));
  }
  select.value = value;
  select.addEventListener('change', () => onChange(select.value));
  return select;
}

export function numberControl(
  id: string,
  value: number,
  onChange: (value: number) => void,
  options: { min?: number; max?: number; step?: number } = {},
): HTMLInputElement {
  const input = el('input', {
    id,
    type: 'number',
    value: String(value),
    min: String(options.min ?? 0),
    max: String(options.max ?? 999),
    step: String(options.step ?? 1),
  }) as HTMLInputElement;
  input.addEventListener('change', () => {
    const parsed = Number(input.value);
    if (Number.isFinite(parsed)) onChange(parsed);
  });
  return input;
}

export function toggleControl(id: string, value: boolean, onChange: (value: boolean) => void): HTMLInputElement {
  const input = el('input', { id, type: 'checkbox', className: 'toggle', checked: value }) as HTMLInputElement;
  input.addEventListener('change', () => onChange(input.checked));
  return input;
}

/**
 * "3.2" -> "Stage 3, unit 2" is overkill; the screens just want "L3.2".
 *
 * An *estimated* level prints as `≈ L7.1` (replan §1.4). The squiggle is the
 * whole point: the library's levels are mostly banded per opus or computed
 * from features, and a number shown with the same confidence as a judged one
 * invites the owner to trust it. The item sheet says what to do about it.
 */
export function levelLabel(level: number, source?: LevelSource): string {
  return `${source === 'estimated' ? '≈ ' : ''}L${level.toFixed(1)}`;
}

export function handsLabel(hands: string): string {
  return hands === 'both' ? 'Hands together' : hands === 'right' ? 'Right hand' : 'Left hand';
}

/**
 * The same fact in a list row, where the line has to fit (`04` §0 R2).
 *
 * Empty for both hands: a row that says nothing about hands is a row about a
 * piece for both of them, and "Hands together" on every line is three words
 * that never distinguish anything.
 */
export function shortHandsLabel(hands: string): string {
  return hands === 'right' ? 'RH' : hands === 'left' ? 'LH' : '';
}

export function minutesLabel(minutes: number): string {
  const whole = Math.round(minutes);
  if (whole < 60) return `${String(whole)} min`;
  return `${String(Math.floor(whole / 60))} h ${String(whole % 60)} min`;
}
