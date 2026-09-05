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

/** A one-line status region screens write progress and errors into. */
export function statusLine(id: string): HTMLElement {
  return el('p.status', { id, role: 'status', 'aria-live': 'polite' });
}
