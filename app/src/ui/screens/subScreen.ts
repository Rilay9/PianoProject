// Shared chrome for a screen pushed on top of a tab (docs/04-ui-spec.md §1:
// "Score screen is a full-screen route pushed on top (back gesture returns)").
// P1's MIDI and Diagnostics screens use the same shape.

import type { Router, TabId } from '../../router';

export interface SubScreenParts {
  section: HTMLElement;
  card: HTMLElement;
}

export function createSubScreen(
  router: Router,
  options: { id: string; title: string; backTo: TabId; backLabel: string },
): SubScreenParts {
  const section = document.createElement('section');
  section.className = 'screen';
  section.dataset.screen = options.id;

  const card = document.createElement('div');
  card.className = 'card';

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'link-button back-link';
  back.textContent = `← ${options.backLabel}`;
  back.addEventListener('click', () => router.navigate(options.backTo));
  card.appendChild(back);

  const h1 = document.createElement('h1');
  h1.textContent = options.title;
  card.appendChild(h1);

  section.appendChild(card);
  return { section, card };
}

/** A labelled block inside a sub-screen card. */
export function addSection(card: HTMLElement, heading: string): HTMLElement {
  const block = document.createElement('section');
  block.className = 'block';
  const h2 = document.createElement('h2');
  h2.textContent = heading;
  block.appendChild(h2);
  card.appendChild(block);
  return block;
}

export function addParagraph(parent: HTMLElement, text: string, className?: string): HTMLElement {
  const p = document.createElement('p');
  p.textContent = text;
  if (className) p.className = className;
  parent.appendChild(p);
  return p;
}

export function addButton(
  parent: HTMLElement,
  label: string,
  onClick: () => void,
  options: { id?: string; variant?: 'primary' | 'secondary' } = {},
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `button button--${options.variant ?? 'secondary'}`;
  if (options.id) button.id = options.id;
  button.textContent = label;
  button.addEventListener('click', onClick);
  parent.appendChild(button);
  return button;
}
