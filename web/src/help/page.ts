// "How the app works" (owner, 2026-10-15): a page over whatever is showing, opened from Settings (from the top) or from
// a screen's "How this screen works" (at that screen's section, marked). It is a full-height dialog, so it pauses what
// runs under it as every panel does (app.ts onPanel), and a place on the stack (nav.ts), so Back and ✕ close it and
// nothing else. Its text is help.md (read.ts says the format), built into the app so it is there offline.

import helpText from './help.md?raw';
import * as nav from '../nav';
import { drawText } from '../lesson/blocks';
import { el } from '../ui';
import { readHelp, type HelpId, type HelpSection } from './read';

let sections: HelpSection[] | null = null;
let problem = '';
try { sections = readHelp(helpText); } catch (e) { problem = e instanceof Error ? e.message : String(e); }

const dialog = () => document.getElementById('help') as HTMLDialogElement;
let built = false;

function build(): void {
  if (built) return;
  built = true;
  const body = document.getElementById('help-body')!;
  if (!sections) { body.replaceChildren(el('p', 'note les-bad', `The help could not be read: ${problem}`)); return; }
  const toc = el('nav', 'help-toc');
  toc.setAttribute('aria-label', 'Sections');
  const out: HTMLElement[] = [toc];
  for (const s of sections) {
    const a = el('button', 'chip', s.title);
    a.type = 'button';
    a.addEventListener('click', () => show(s.id, true));
    toc.append(a);
    const sec = el('section', 'help-sec');
    sec.id = `help-${s.id}`;
    sec.dataset.help = s.id;
    sec.append(el('h3', '', s.title), drawText(s.blocks));
    out.push(sec);
  }
  body.replaceChildren(...out);
  dialog().addEventListener('close', () => nav.closedItself('help'));
}

/** Scrolls to a section and marks it (the screen it was opened from). */
function show(id: string | undefined, smooth = false): void {
  const body = document.getElementById('help-body')!;
  for (const s of body.querySelectorAll('.help-sec.here')) s.classList.remove('here');
  const sec = id ? document.getElementById(`help-${id}`) : null;
  if (!sec) { body.closest('form')?.scrollTo({ top: 0 }); return; }
  sec.classList.add('here');
  sec.scrollIntoView({ block: 'start', behavior: smooth ? 'smooth' : 'auto' });
}

/** Opens the help: from the top (Settings), or at a screen's section ("How this screen works"). */
export function openHelp(id?: HelpId): void {
  build();
  const d = dialog();
  document.getElementById('help-title')!.textContent = id ? 'How this screen works' : 'How the app works';
  // (a panel it was opened from, ⋯ or a screen's settings, goes: the help takes its place)
  for (const other of document.querySelectorAll<HTMLDialogElement>('dialog[open]')) if (other !== d) other.close();
  if (!d.open) {
    d.showModal();
    nav.push({ name: 'help', leave: () => { if (d.open) d.close(); } });
  }
  show(id);
}

/** A "How this screen works" link for a screen with no ⋯ or panel to hold it (the tabs, the metronome). */
export function helpLink(id: HelpId): HTMLButtonElement {
  const b = el('button', 'lnk help-link', 'How this screen works');
  b.type = 'button';
  b.dataset.helpFor = id;
  b.addEventListener('click', () => openHelp(id));
  return b;
}
