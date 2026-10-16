// Putting the full PDMX set on this phone (owner, 2026-10-15; mockup web/mockups/pdmx-full.html, "Setup"): offered on
// Music's Full PDMX tab while the set isn't here. Two choices: piano + lead sheets + melodies (the pdmx-a zips), or
// everything (+ the pdmx-b zips, which can also be added later). The learner picks the zips they copied to the phone;
// each is copied into the app's storage (library/full.ts) with its own progress, and one that fails is copied again
// on its own next time. Room is checked first (persist(), then estimate()): without it, nothing is copied.

import type { App } from '../app';
import { installed } from '../offline';
import { copy, gb, hasSet, loadState, look, missing, roomFor, type Progress, type SetName, type State } from '../library/full';

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = '') => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };

/** The clean-up risk in a browser tab (owner, 2026-10-15, the reviewer's words); Settings says it too. */
export const CLEANUP = 'Your browser may delete this copy when the phone runs low on space. Installing the app keeps it.';

export interface FullSetup {
  /** Draws the setup into box for what is on the phone; back: a way back to the list (adding the several parts). */
  show(box: HTMLElement, state: State | null, back?: () => void): void;
  /** A copy is running (the phone is kept awake meanwhile). */
  readonly copying: boolean;
}

export function createFullSetup(app: App, deps: { done(): void }): FullSetup {
  const input = Object.assign(document.createElement('input'), { type: 'file', multiple: true, hidden: true, id: 'lib-zip-file' });
  // (zip and octet-stream too: Android may label a .zip either way and grey it out otherwise)
  input.accept = '.zip,application/zip,application/x-zip-compressed,application/octet-stream';
  document.body.append(input);
  let choice: 'a' | 'all' = 'a';
  let copying = false;
  let rows: Progress[] = [];
  let said = '', bad = false;
  let box: HTMLElement | null = null, state: State | null = null, back: (() => void) | undefined;

  /** The sets this pick copies: a; a and b; or only b when a is here already. */
  const sets = (): SetName[] => (hasSet(state, 'pdmx-a') ? ['pdmx-b'] : choice === 'a' ? ['pdmx-a'] : ['pdmx-a', 'pdmx-b']);

  function draw(): void {
    if (!box) return;
    const addingParts = hasSet(state, 'pdmx-a');
    if (state?.want?.includes('pdmx-b') && !addingParts) choice = 'all';
    const out: HTMLElement[] = [];
    out.push(el('div', 'lib-title', addingParts ? 'Add the several-part scores' : 'Put the full PDMX set on this phone'));
    // The copy's progress first, so it is in view while it runs, sideways too (P04).
    const progress = progressOf();
    if (copying || rows.length || said) out.push(...progress);
    // The steps, one a line (P13).
    const steps = el('ol', 'lib-steps');
    for (const t of ['On the PC, Claude makes the zip files.', 'Copy them to this phone (a cable, or Google Drive).', 'Pick them here, once.']) steps.append(el('li', '', t));
    out.push(steps);
    if (addingParts) {
      out.push(el('p', 'note', 'Band and ensemble scores: the pdmx-b zips, about 1.2 GB. Several-part scores open with the usual warning (the top staff is taken as your right hand).'));
    } else {
      const option = (value: 'a' | 'all', title: string, more: string) => {
        const b = el('button', `lib-choice${choice === value ? ' on' : ''}`);
        b.type = 'button';
        b.setAttribute('aria-pressed', String(choice === value));
        b.disabled = copying;
        b.append(el('b', '', title), el('span', '', more));
        b.addEventListener('click', () => { choice = value; draw(); });
        return b;
      };
      out.push(option('a', 'Piano, lead sheets and melodies', 'the pdmx-a zips · about 0.8 GB'),
        option('all', 'Everything, with band and ensemble scores', 'the pdmx-a and pdmx-b zips · about 2.0 GB · several-part scores open with the usual warning'));
    }
    out.push(el('p', 'note', 'Android doesn’t let an app open a picked file again later, so the app keeps its own copy in its storage. You can delete the zips you copied to the phone afterwards. It works offline once copied. It is not in your backup (copy the zips again instead).'));
    // In a browser tab, before copying (owner, 2026-10-15): the browser may clean the copy away; the installed app keeps it.
    if (!installed()) out.push(el('p', 'lib-warn lib-cleanup', CLEANUP));
    const want = sets();
    const left = want.flatMap((s) => missing(state, s));
    const have = Object.keys(state?.zips ?? {});
    if (have.length && left.length) out.push(el('p', 'note lib-setup-left', `Copied: ${have.sort().join(', ')}. Still to copy: ${left.join(', ')}. Pick them (picking all of them again is fine: copied ones are skipped).`));
    const buttons = el('div', 'lib-buttons');
    const pick = el('button', 'btn main', copying ? 'Copying…' : 'Pick the zip files…');
    pick.type = 'button';
    pick.disabled = copying;
    pick.addEventListener('click', () => { input.value = ''; input.click(); });
    buttons.append(pick);
    if (back && !copying) { const b = el('button', 'btn', 'Back to the list'); b.type = 'button'; b.addEventListener('click', back); buttons.append(b); }
    out.push(buttons);
    box.replaceChildren(...out);
    if (copying) box.querySelector('.lib-copies')?.scrollIntoView({ block: 'nearest' });
  }
  /** Each zip's progress, and what was said. */
  function progressOf(): HTMLElement[] {
    const out: HTMLElement[] = [];
    if (rows.length) {
      const list = el('div', 'lib-copies');
      for (const r of rows) {
        const row = el('div', `lib-copy ${r.state}`);
        const pct = r.size ? Math.floor((r.done / r.size) * 100) : 0;
        const what = r.state === 'copying' ? `${pct}%` : r.state === 'copied' ? 'copied ✓' : r.state === 'waiting' ? 'waiting' : r.state === 'skipped' ? 'not copied' : 'failed';
        row.append(el('div', 'lib-copy-line', `${r.name} · ${gb(r.size)} · ${what}`));
        if (r.state === 'copying' || r.state === 'waiting' || r.state === 'copied') {
          const bar = el('div', 'lib-bar');
          const fill = el('i');
          fill.style.width = `${r.state === 'copied' ? 100 : pct}%`;
          bar.append(fill);
          bar.setAttribute('role', 'progressbar');
          bar.setAttribute('aria-valuenow', String(r.state === 'copied' ? 100 : pct));
          row.append(bar);
        }
        if (r.problem) row.append(el('small', '', r.problem));
        list.append(row);
      }
      out.push(list);
    }
    if (said) out.push(el('p', bad ? 'lib-warn' : 'note', said));
    return out;
  }

  input.addEventListener('change', () => {
    const files = [...(input.files ?? [])];
    input.value = '';
    if (files.length) void run(files);
  });

  async function run(files: File[]): Promise<void> {
    if (copying) return;
    copying = true;
    said = ''; bad = false; rows = [];
    draw();
    try {
      const want = sets();
      const picked = await look(files, want);
      const todo = picked.filter((p) => p.facts && !p.problem && !p.skip);
      const bytes = todo.reduce((s, p) => s + p.file.size, 0);
      if (!todo.length) {
        rows = picked.map((p) => ({ name: p.facts?.name ?? p.file.name, done: 0, size: p.file.size, state: 'skipped', problem: p.problem ?? `${p.facts?.name ?? p.file.name} ${p.skip}` }));
        said = 'Nothing to copy from these files.';
        bad = picked.some((p) => p.problem);
        return;
      }
      const noRoom = await roomFor(bytes);
      if (noRoom) { said = noRoom; bad = true; return; }
      app.stayAwake();
      rows = await copy(picked, want, (p) => { rows = p; draw(); });
      const failed = rows.filter((r) => r.state === 'failed');
      state = await loadState();
      const left = want.flatMap((s) => missing(state, s));
      said = failed.length ? `${failed.length === 1 ? 'One zip' : `${failed.length} zips`} could not be copied: pick ${failed.length === 1 ? 'it' : 'them'} again to copy just ${failed.length === 1 ? 'that one' : 'those'}.`
        : left.length ? `Copied. Still to copy: ${left.join(', ')}.` : 'Copied: the full set is on this phone.';
      bad = failed.length > 0;
    } catch (e) {
      said = e instanceof Error ? e.message : String(e);
      bad = true;
    } finally {
      copying = false;
      app.stayAwake();
      draw();
    }
    // (the library shows the list once the pdmx-a zips are all here, or the setup again with what is left)
    if (rows.some((r) => r.state === 'copied')) { if (!bad && hasSet(state, 'pdmx-a')) { rows = []; said = ''; } deps.done(); }
  }

  return {
    show(b, s, goBack) { box = b; if (!copying) state = s; back = goBack; draw(); },
    get copying() { return copying; },
  };
}
