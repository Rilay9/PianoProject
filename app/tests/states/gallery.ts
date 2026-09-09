// Shooting a cell, checking it against `docs/08` §9, and building the sheet.

import { mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { Page } from '@playwright/test';
import { probeState, type StateRecord } from './probe';

export const STATES_DIR = resolve('../build/states');

/** Which branch of the tree in `docs/08` §1 a cell belongs to. */
export type Branch =
  | '1-can-i-read-it'
  | '2-where-am-i'
  | '3-what-comes-next'
  | '4-how-am-i-doing'
  | '5-what-can-i-change'
  | '6-what-if-it-goes-wrong';

export interface Shot {
  cell: string;
  branch: Branch;
  /** What the cell is meant to show, in one line, for the sheet. */
  says: string;
  file: string;
  state: StateRecord;
  /** Invariants that failed here, by their number in `08` §9. */
  broke: string[];
}

const shots: Shot[] = [];

/**
 * Every invariant from `08` §9 that can be decided from one still.
 *
 * Deliberately not thrown: a cell that breaks an invariant should still be
 * photographed, because the picture is how you find out *why*. They are
 * collected, printed at the end, and the run fails on the total.
 */
function check(state: StateRecord, cell: string): string[] {
  const broke: string[] = [];
  const say = (n: number, what: string): void => {
    broke.push(`§9.${String(n)} ${what}`);
  };

  // 9 — exactly one cursor band, at most one read-ahead line.
  if (state.bands.cursors > 1) say(9, `${String(state.bands.cursors)} cursor bands`);
  if (state.bands.nextLines > 1) say(9, `${String(state.bands.nextLines)} read-ahead lines`);

  // 23 — the control bar is one row.
  if (state.bar.scrollHeight > 60) {
    say(23, `the bar is ${String(state.bar.scrollHeight)}px (wrapped)`);
  }

  // 13 — Free marks nothing.
  if (state.screen.mode === 'free') {
    if (state.bands.cursors > 0) say(13, 'Free draws a cursor band');
    if (state.bands.nextLines > 0) say(13, 'Free draws a read-ahead line');
    if (state.keys.expected.length > 0) say(13, 'Free marks expected keys');
    if (state.notes.correct + state.notes.wrong > 0) say(13, 'Free colours notes');
  }

  // 11 — the read-ahead is Tempo and Listen only.
  //
  // `hearing` counts as clocked: `Hear it` is a Listen run that deliberately
  // leaves the mode select where it was (`08` §7.1), so `data-mode` still says
  // Wait and only `data-hearing` knows. Reading the mode alone reported a
  // Listen run's read-ahead as a violation — which is exactly the confusion
  // the two attributes exist to prevent.
  const clocked =
    state.screen.mode === 'tempo' ||
    state.screen.mode === 'listen' ||
    state.screen.hearing === 'true';
  if (!clocked && state.bands.nextLines > 0 && state.screen.running === 'true') {
    say(11, `a read-ahead line in ${state.screen.mode}`);
  }
  if (!clocked && state.keys.next.length > 0) {
    say(11, `next keys marked in ${state.screen.mode}`);
  }

  // 12 — the strip and the band agree.
  if (state.keys.expected.length > 0 && state.currentMidis.length > 0) {
    const a = state.keys.expected.join(',');
    const b = state.currentMidis.join(',');
    if (a !== b) say(12, `strip wants ${a}, cursor is on ${b}`);
  }

  // 35 — upright, at least half the stage is music: the height the width
  // fit leaves over buys more slots, not black (`08` §3.2, §4.1). Two slots
  // measured 42 % on the phone and 18 % on a tablet; the arrangement now
  // holds as many systems as fit at the width-limited size.
  if (
    state.arrangement === 'slots' &&
    state.layout === 'window' &&
    state.screen.running === 'true' &&
    state.musicShare > 0 &&
    state.musicShare < 0.5
  ) {
    say(35, `music is ${String(Math.round(state.musicShare * 100))}% of the stage`);
  }

  // 2 — the staves sit at one height, and every drawn slot shares one scale.
  const drawn = state.slots.filter((s) => s.drawn && !s.hidden && s.scale > 0);
  const scales = [...new Set(drawn.map((s) => s.scale))];
  if (scales.length > 1) say(2, `slots drawn at ${scales.join(' and ')}`);

  // The arrangement rule from §4.1, which is height and not orientation.
  const tallEnough = state.viewport.h >= 600;
  const upright = state.viewport.h > state.viewport.w;
  if (state.layout === 'window' && state.arrangement !== '') {
    const wanted = upright || tallEnough ? 'slots' : 'single';
    // Only when the window can be halved; at one bar there is nothing to
    // alternate and `single` is right either way.
    if (state.arrangement !== wanted && !cell.includes('bars1')) {
      broke.push(
        `§4.1 ${state.arrangement} at ${String(state.viewport.w)}×${String(state.viewport.h)}, wanted ${wanted}`,
      );
    }
  }

  return broke;
}

export async function shoot(
  page: Page,
  branch: Branch,
  cell: string,
  says: string,
): Promise<Shot> {
  const state = await probeState(page);
  const file = join(STATES_DIR, branch, `${cell}.png`);
  mkdirSync(dirname(file), { recursive: true });
  await page.screenshot({ path: file });
  const shot: Shot = { cell, branch, says, file, state, broke: check(state, cell) };
  shots.push(shot);
  return shot;
}

export function reset(): void {
  if (existsSync(STATES_DIR)) rmSync(STATES_DIR, { recursive: true, force: true });
  mkdirSync(STATES_DIR, { recursive: true });
}

/** The numbers, for reading without opening a picture. */
export function saveRecords(): void {
  mkdirSync(STATES_DIR, { recursive: true });
  writeFileSync(join(STATES_DIR, 'states.json'), JSON.stringify(shots, null, 2), 'utf8');
}

/** One page, grouped by branch, each cell with what it is meant to show. */
export function writeSheet(): void {
  const byBranch = new Map<string, Shot[]>();
  for (const shot of shots) {
    const list = byBranch.get(shot.branch) ?? [];
    list.push(shot);
    byBranch.set(shot.branch, list);
  }
  const esc = (t: string): string =>
    t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const sections = [...byBranch.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([branch, list]) => {
      const cells = list
        .map((shot) => {
          const bad = shot.broke.length
            ? `<p class="broke">${shot.broke.map(esc).join('<br>')}</p>`
            : '';
          const facts = [
            `music ${String(Math.round(shot.state.musicShare * 100))}% of stage`,
            shot.state.arrangement,
            `${String(shot.state.viewport.w)}×${String(shot.state.viewport.h)}`,
            shot.state.screen.mode,
            shot.state.screen.running === 'true' ? 'running' : 'idle',
            `bar ${String(shot.state.bar.scrollHeight)}px`,
          ].join(' · ');
          return `<figure class="${shot.broke.length ? 'bad' : ''}">
  <img src="${esc(branch)}/${esc(shot.cell)}.png" alt="${esc(shot.cell)}" loading="lazy">
  <figcaption><b>${esc(shot.cell)}</b><br>${esc(shot.says)}<br><span class="facts">${esc(facts)}</span>${bad}</figcaption>
</figure>`;
        })
        .join('\n');
      return `<section><h2>${esc(branch)}</h2><div class="grid">${cells}</div></section>`;
    })
    .join('\n');

  const broken = shots.filter((s) => s.broke.length).length;
  const html = `<!doctype html><meta charset="utf-8"><title>Score screen states</title>
<style>
 body { background:#111; color:#eee; font:14px system-ui; margin:0; padding:24px; }
 h1 { font-size:1.3rem; } h2 { font-size:1rem; color:#9ab; margin-top:32px; }
 .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:20px; }
 figure { margin:0; background:#1a1a1a; border:1px solid #333; border-radius:8px; padding:8px; }
 figure.bad { border-color:#a33; }
 img { width:100%; height:auto; border-radius:4px; background:#000; }
 figcaption { font-size:12px; line-height:1.4; margin-top:8px; }
 .facts { color:#89a; }
 .broke { color:#f77; margin:6px 0 0; }
 .sum { color:#9ab; }
</style>
<h1>Score screen — one picture per state</h1>
<p class="sum">${String(shots.length)} cells · ${String(broken)} breaking an invariant from
<code>docs/08</code> §9. Numbers in <code>states.json</code>.</p>
${sections}`;
  mkdirSync(STATES_DIR, { recursive: true });
  writeFileSync(join(STATES_DIR, 'index.html'), html, 'utf8');
}

/**
 * Divergences `docs/08` §11 already records, with the entry that records them.
 *
 * A suite that is permanently red is a suite nobody reads. These are things
 * the document says are true of the code today and not of the intent, so the
 * gallery still marks them on the sheet — the picture is the argument for
 * fixing them — and still goes green, because it is watching for *new*
 * breakage. Deleting an entry here is how a fix gets its test.
 */
const KNOWN: { match: RegExp; why: string }[] = [
  {
    match: /Free draws a cursor band/,
    why: '§11.10 — Free is specified to draw no cursor and to advance on the notes played; not built yet',
  },
];

function knownReason(line: string): string | null {
  return KNOWN.find((k) => k.match.test(line))?.why ?? null;
}

export function summarise(): { total: number; broken: Shot[]; known: string[] } {
  const known = new Set<string>();
  const broken: Shot[] = [];
  for (const shot of shots) {
    const fresh = shot.broke.filter((line) => {
      const why = knownReason(line);
      if (why === null) return true;
      known.add(`${shot.cell}: ${line} — ${why}`);
      return false;
    });
    if (fresh.length > 0) broken.push({ ...shot, broke: fresh });
  }
  return { total: shots.length, broken, known: [...known].sort() };
}
