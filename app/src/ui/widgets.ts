/**
 * The handful of DOM shapes every P7 screen builds out of.
 *
 * No framework: the app is one bundle on one phone, and a list of 570 catalog
 * rows is faster to build by hand than to diff. What these do buy is
 * consistency — one definition of what a chip, a row and a bottom sheet are,
 * so five screens do not each invent their own.
 */

type Attrs = Record<string, string | number | boolean | undefined>;

/** `el('button.button--primary', { id: 'go' }, 'Start')`. */
export function el<K extends keyof HTMLElementTagNameMap>(
  spec: K | string,
  attrs: Attrs = {},
  ...children: (Node | string | null | undefined)[]
): HTMLElement {
  const [tag = 'div', ...classes] = spec.split('.');
  const node = document.createElement(tag);
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
  options: { id?: string; variant?: 'primary' | 'secondary' | 'quiet'; title?: string } = {},
): HTMLButtonElement {
  const node = el('button', {
    type: 'button',
    className:
      options.variant === 'quiet' ? 'link-button' : `button button--${options.variant ?? 'secondary'}`,
    ...(options.id ? { id: options.id } : {}),
    ...(options.title ? { title: options.title } : {}),
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

/** One item in a list: title, a line of metadata, badges, and buttons. */
export function listRow(options: RowOptions): HTMLElement {
  const text = el('div.list-row__text', {}, el('div.list-row__title', { text: options.title }));
  if (options.subtitle) text.append(el('div.list-row__sub', { text: options.subtitle }));
  if (options.meta) text.append(el('div.list-row__meta.muted', { text: options.meta }));
  if (options.badges?.length) {
    const strip = el('div.list-row__badges');
    for (const b of options.badges) strip.append(b);
    text.append(strip);
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

/** "3.2" -> "Stage 3, unit 2" is overkill; the screens just want "L3.2". */
export function levelLabel(level: number): string {
  return `L${level.toFixed(1)}`;
}

export function handsLabel(hands: string): string {
  return hands === 'both' ? 'Hands together' : hands === 'right' ? 'Right hand' : 'Left hand';
}

export function minutesLabel(minutes: number): string {
  const whole = Math.round(minutes);
  if (whole < 60) return `${String(whole)} min`;
  return `${String(Math.floor(whole / 60))} h ${String(whole % 60)} min`;
}
