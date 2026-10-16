// The install card on Home (owner, 2026-10-15): in a browser tab only, never in the installed app. "Install the app to
// keep your files and play offline." with Install and ✕. Install is the browser's own prompt where it offers one
// (Chrome's `beforeinstallprompt`); where it does not, the card names Chrome's menu instead. The card goes once the
// app is installed (`appinstalled`, or running in its own window: offline.ts `installed`) or ✕ is pressed, and never
// comes back after ✕ (hints.ts keeps both).
//
// Chrome's rules (web.dev, "What does it take to be installable?" and "How to provide your own in-app install
// experience", read 2026-10-15): it fires `beforeinstallprompt` only when the app is not installed already, the page is
// served over HTTPS with a manifest giving a name, 192 px and 512 px icons, a start_url and display standalone (ours
// does), and the person has tapped the page at least once and spent at least 30 seconds on it (at any time). Calling
// preventDefault() keeps Chrome's own mini-infobar from showing on a phone; the saved event's prompt() can be called
// only once, from a tap; after "Cancel" the page waits for the event to fire again. `appinstalled` fires however the
// app was installed (the menu too).

import { installed } from './offline';
import { installCardDismissed, installCardGone } from './hints';
import { button, el } from './ui';

interface InstallPrompt extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

let offered: InstallPrompt | null = null;
let card: HTMLElement | null = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); // (our own card instead of Chrome's mini-infobar)
  offered = e as InstallPrompt;
  fill();
});
window.addEventListener('appinstalled', () => {
  offered = null;
  installCardDismissed('installed');
  fill();
});

export const INSTALL_WORDS = 'Install the app to keep your files and play offline.';
export const MENU_WORDS = 'Chrome menu ⋮ → Install app';

/** Shown on Home: the card, or nothing (the installed app, installed from this tab, or ✕ pressed). */
const wanted = () => !installed() && !installCardGone();

function fill(): void {
  if (!card) return;
  if (!wanted()) { card.remove(); card = null; return; }
  const how = offered
    ? button('Install', 'btn main', async () => {
      const p = offered;
      offered = null; // (one prompt per event)
      if (!p) return;
      try { await p.prompt(); await p.userChoice; } catch { /* the browser refused: the menu words show */ }
      fill(); // (accepted: appinstalled takes the card away; Cancel: the menu words until the browser offers again)
    })
    : el('span', 'inst-menu', MENU_WORDS);
  const x = button('✕', 'btn inst-x', () => { installCardDismissed('dismissed'); fill(); });
  x.setAttribute('aria-label', 'Close: don’t show this again');
  const row = el('div', 'inst-how');
  row.append(how);
  card.replaceChildren(el('span', 'inst-text', INSTALL_WORDS), x, row);
}

/** The card for Home, or null when it should not show. */
export function installCard(): HTMLElement | null {
  if (!wanted()) return null;
  card = el('div', 'inst-card');
  card.id = 'install-card';
  card.setAttribute('role', 'note');
  fill();
  return card;
}
