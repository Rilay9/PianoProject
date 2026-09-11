/**
 * The frame every full tab screen in P7 shares: a heading, an optional
 * sub-line, and a body that scrolls.
 *
 * Separate from the `.card` shape the sub-screens use, because these screens
 * are lists rather than cards — the body has to be the scroll container, or a
 * 570-row Library scrolls the whole shell and loses the tab bar on the way.
 */
import { el } from '../widgets';

export interface ScreenFrame {
  section: HTMLElement;
  header: HTMLElement;
  body: HTMLElement;
}

export function screenFrame(id: string, title: string, subtitle?: string): ScreenFrame {
  const header = el('header.screen-header', {}, el('h1', { text: title }));
  if (subtitle) header.append(el('p.muted', { text: subtitle }));
  const body = el('div.screen-body');
  const section = el('section.screen.screen--list', { 'data-screen': id }, header, body);
  return { section, header, body };
}

/**
 * A one-line status region screens write progress and errors into.
 *
 * `status--error` belongs to a *message*, and every screen in the app added it
 * and none of them ever took it off. One microphone that would not open, one
 * download that stopped on a train, and from then until the screen was rebuilt
 * every `Saved.` on Settings and every `Backup saved` on Progress was printed
 * in the error colour. The owner is then being told something went wrong by the
 * line that is telling them it went right.
 *
 * Fixed here rather than at fifteen call sites, because the rule is about the
 * line and not about any one of them: **writing a new message clears the last
 * one's colour.** Every error path in the app sets the text and then adds the
 * class, in that order, so an error still arrives red — it just stops staying
 * red after it has been replaced.
 */
export function statusLine(id: string): HTMLElement {
  const node = el('p.status', { id, role: 'status', 'aria-live': 'polite' });
  // Through `Reflect` on the prototype, so this is the ordinary `textContent`
  // with one line added and not a reimplementation of it — a status line that
  // had children appended to it would still read back correctly.
  Object.defineProperty(node, 'textContent', {
    configurable: true,
    get(this: HTMLElement): string | null {
      return Reflect.get(Node.prototype, 'textContent', this);
    },
    set(this: HTMLElement, value: string | null): void {
      Reflect.set(Node.prototype, 'textContent', value, this);
      this.classList.remove('status--error');
    },
  });
  return node;
}
