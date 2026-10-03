// U32 item 3: summarises the timing probe's JSON files, per build and piece, as this run's figures.
//   node scripts-timing-summary.mjs <dir-of-json> > timing-summary.txt
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
const files = readdirSync(dir).filter((n) => n.endsWith('.json')).sort();
const rows = files.map((n) => JSON.parse(readFileSync(join(dir, n), 'utf8')));
const short = (p) => (p.includes('scherzo') ? 'scherzo' : p.includes('nocturne') ? 'nocturne' : p);
const r0 = (n) => (n === null || n === undefined ? '-' : String(Math.round(n)));
const groups = new Map();
for (const row of rows) {
  const key = `${row.build} ${short(row.piece)} ${row.open !== undefined ? 'rest' : row.run !== undefined ? 'run' : 'tap'}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(row);
}
console.log('U32 item 3: this machine, x4 CPU throttle, 342 x 740, one worker; page time in ms from navigation.');
console.log('Relationships only: none of these figures is a phone figure.\n');
for (const [key, list] of [...groups].sort()) {
  console.log(`== ${key} (${String(list.length)})`);
  for (const row of list) {
    const u = row.u32;
    const after = (u.longtasks ?? []).filter((t) => u.firstInk !== null && t.start >= u.firstInk);
    const longest = after.reduce((m, t) => Math.max(m, t.duration), 0);
    const total = after.reduce((s, t) => s + t.duration, 0);
    // The first sheet's wrapper is put on the stage as `create` starts loading it: from there to the
    // first bar is the renderer's part of the first window, without the fetch and the model's own load.
    const firstSheet = (u.sheetsAdded ?? [])[0] ?? null;
    const gaps = (u.sheetsAdded ?? []).slice(1).map((t, i) => r0(t - u.sheetsAdded[i]));
    const renderer = `first sheet made ${r0(firstSheet)} -> first bar +${r0(firstSheet === null ? null : u.firstInk - firstSheet)}, gaps between sheets made ${gaps.join('/') || '-'}; `;
    if (row.tap !== undefined) {
      // Play tapped at the first ink from inside the page; the first notes 300 ms after the tap.
      const t = u.tap ?? {};
      const inWindow = (u.longtasks ?? []).filter((x) => t.clickedAt !== null && x.start + x.duration > t.clickedAt && x.start < row.frozenSeenAt);
      const busy = inWindow.reduce((s, x) => s + Math.min(x.start + x.duration, row.frozenSeenAt) - Math.max(x.start, t.clickedAt), 0);
      const madeInRun = (u.sheetsAdded ?? []).filter((x) => t.clickedAt !== null && x > t.clickedAt).map((x) => r0(x - t.clickedAt));
      console.log(
        `  tap ${String(row.tap)}: first bar ${r0(u.firstInk)}, ${renderer}tap taken +${r0(t.clickedAt - u.firstInk)} after the first bar, run on at the note ${String(t.running)}, ` +
          `note intended to taken ${r0(t.takenAt - t.intended)}, intended to painted ${r0(t.paintedAt - t.intended)}; ` +
          `tap to freeze seen ${r0(row.frozenSeenAt - t.clickedAt)}: long tasks ${String(inWindow.length)}, longest ${r0(inWindow.reduce((m, x) => Math.max(m, x.duration), 0))}, busy ${r0(busy)}; ` +
          `sheets made after the tap at +${madeInRun.join('/') || 'none'}; frozen ${row.fit.frozen ? `measured=${String(row.fit.frozen.measured)}` : 'no'}, data-slots ${String(row.fit.dataSlots)}, sheets ${JSON.stringify(row.fit.sheets ?? row.fit.sheetsMade)}`,
      );
      continue;
    }
    if (row.open !== undefined) {
      const seen = (u.shapes ?? []).filter((s) => u.settledAt === null || s.at <= u.settledAt + 1);
      console.log(
        `  rest ${String(row.open)}: first bar ${r0(u.firstInk)}, ${renderer}settled ${r0(u.settledAt)} (+${r0(u.settledAt - u.firstInk)}), ` +
          `long tasks after the first bar: ${String(after.length)}, longest ${r0(longest)}, sum ${r0(total)}; ` +
          `pictures first ink..settled ${String(seen.length)}: ${seen.map((s) => `[${r0(s.at - u.firstInk)}] ${s.key}`).join('  ->  ')}; ` +
          `final slots ${String(row.fit.slotCount)} systems ${String(row.fit.systemsPerWindow)} shown ${String(row.fit.barsShown)} sheets ${String(row.fit.sheetsMade)} ${JSON.stringify(row.fit.sheets)}`,
      );
    } else {
      const noteAt = row.noteAt?.at ?? null;
      const colour = row.toColour?.mean ?? null;
      const overlap = (u.longtasks ?? []).filter((t) => noteAt !== null && t.start < noteAt + (colour ?? 0) && t.start + t.duration > noteAt);
      // The run's freeze window, Play to the freeze seen taken: how much of it the main thread was in long tasks.
      const inWindow =
        row.frozenSeenAt !== undefined
          ? (u.longtasks ?? []).filter((t) => t.start + t.duration > row.playAt && t.start < row.frozenSeenAt)
          : [];
      const busy = inWindow.reduce((s, t) => s + Math.min(t.start + t.duration, row.frozenSeenAt) - Math.max(t.start, row.playAt), 0);
      const windowLine =
        row.frozenSeenAt !== undefined
          ? `freeze window ${r0(row.frozenSeenAt - row.playAt)}: long tasks ${String(inWindow.length)}, longest ${r0(inWindow.reduce((m, t) => Math.max(m, t.duration), 0))}, busy ${r0(busy)}; `
          : '';
      console.log(
        `  run ${String(row.run)}: first bar ${r0(u.firstInk)}, ${renderer}Play at ${r0(row.playAt)}, note taken at ${r0(noteAt)} (+${r0(noteAt - row.playAt)} after Play), ` +
          (row.queuedMs !== undefined ? `sent to taken ${r0(row.queuedMs)}, sent to painted ${r0(row.toPaintMs)}, ` : '') +
          windowLine +
          `input.toColour ${colour === null ? 'none' : `${String(colour)} (n=${String(row.toColour.n)})`}, long tasks over the note: ${overlap.map((t) => `${r0(t.start)}+${r0(t.duration)}`).join(', ') || 'none'}; ` +
          `frozen ${row.fit.frozen ? `measured=${String(row.fit.frozen.measured)}` : 'no'}, data-slots ${String(row.fit.dataSlots)}, sheets ${String(row.fit.sheetsMade)}; ` +
          `osmd.sheet.load ${row.sheetLoad ? `${String(row.sheetLoad.mean)} (n=${String(row.sheetLoad.n)})` : 'none'}`,
      );
    }
  }
}
