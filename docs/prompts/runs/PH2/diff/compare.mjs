// PH2's before/after differential: the browser dumps of CB1's spec (`chart-backing.spec.ts`, CB1_OUT) and MT1's
// spec (`chart-metre.spec.ts`, MT1_OUT), run on the base build (`base-*`, the code before PH2) and on PH2's
// (`ph2-*`), the spec files identical in both runs. Run: node docs/prompts/runs/PH2/diff/compare.mjs
//
// Compared: every count and the chips byte for byte; the grid as drawn (CB1 dumps); every start's kind in order,
// the clicks' audio-clock times relative to the first click exactly, and the kit's and the piano's relative times
// within the run-to-run jitter that the same code shows against itself (case A run twice, A vs A2).
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (dir, name) => JSON.parse(readFileSync(path.join(here, dir, name), 'utf8'));

function relative(starts) {
  const first = starts.find(([k]) => k === 'accent' || k === 'click');
  const t0 = first ? first[1] : 0;
  return starts.map(([k, w]) => [k, Math.round((w - t0) * 1e6) / 1e6]);
}

function compareStarts(a, b) {
  const A = relative(a);
  const B = relative(b);
  const of = (list, kinds) => list.filter(([k]) => kinds.includes(k));
  const clicks = ['click', 'accent'];
  const kit = ['bass', 'kick', 'snare', 'hat'];
  const piano = ['piano'];
  const maxDiff = (x, y) => {
    let m = 0;
    x.forEach(([, w], i) => {
      m = Math.max(m, Math.abs(w - (y[i]?.[1] ?? Number.NaN)));
    });
    return Number.isNaN(m) ? 'length differs' : Math.round(m * 1e4) / 1e4;
  };
  return {
    clicks: of(A, clicks).length,
    clicksIdentical: JSON.stringify(of(A, clicks)) === JSON.stringify(of(B, clicks)),
    kit: `${String(of(A, kit).length)} vs ${String(of(B, kit).length)}`,
    kitKindsIdentical: JSON.stringify(of(A, kit).map(([k]) => k)) === JSON.stringify(of(B, kit).map(([k]) => k)),
    maxKitWhenDiffSec: maxDiff(of(A, kit), of(B, kit)),
    pianoSamples: `${String(of(A, piano).length)} vs ${String(of(B, piano).length)}`,
    maxPianoWhenDiffSec: maxDiff(of(A, piano), of(B, piano)),
  };
}

const counts = ({ starts: _s, grid: _g, ...rest }) => rest;

console.log("CB1's spec (Blue Bossa bars 1-4, the twelve-bar shuffle in C bars 1-4, Blue Bossa to bar 17), base vs PH2:");
for (const name of readdirSync(path.join(here, 'base-cb1')).sort()) {
  const base = read('base-cb1', name);
  const ph2 = read('ph2-cb1', name);
  console.log(`  ${name.replace('.json', '')}`);
  const same = JSON.stringify(counts(base)) === JSON.stringify(counts(ph2));
  console.log(`    counts and chips byte-identical: ${String(same)}  ${JSON.stringify(counts(base))}`);
  if (!same) console.log(`    PH2:                                    ${JSON.stringify(counts(ph2))}`);
  if (base.bassHz.length && JSON.stringify(base.bassHz) !== JSON.stringify(ph2.bassHz)) {
    const changed = base.bassHz.map((hz, i) => [i, hz, ph2.bassHz[i]]).filter(([, a, b]) => a !== b);
    console.log(`    bass notes that differ (bar = index / 2 + 1, beat 1 or 3): ${changed.map(([i, a, b]) => `bar ${String(Math.floor(i / 2) + 1)} beat ${i % 2 === 0 ? '1' : '3'}: ${String(a)} Hz -> ${String(b)} Hz`).join('; ')}`);
  }
  console.log(`    grid identical: ${String(base.grid === ph2.grid)}`);
  if (base.grid !== ph2.grid) {
    const cells = (grid) => grid.split(/(?=<div class="chart-cell)/).slice(1);
    const a = cells(base.grid);
    const b = cells(ph2.grid);
    console.log(`    cells: ${String(a.length)} vs ${String(b.length)}; the cells that differ:`);
    a.forEach((cell, i) => {
      if (cell !== b[i]) console.log(`      ${cell.replace(/<\/div>$/, '')}  ->  ${(b[i] ?? '(none)').replace(/ style="[^"]*"/g, '')}`);
    });
  }
  console.log(`    starts: ${JSON.stringify(compareStarts(base.starts, ph2.starts))}`);
}
console.log('The same code against itself (case A run twice in one test, A vs A2), base and PH2:');
for (const dir of ['base-cb1', 'ph2-cb1']) {
  const a = read(dir, 'A backing on, comp on.json');
  const a2 = read(dir, 'A2 backing on, comp on.json');
  console.log(`  ${dir}: ${JSON.stringify(compareStarts(a.starts, a2.starts))}`);
}
console.log("MT1's spec (non-4/4 charts, Bella Ciao with a pickup, Mr Lawrence 3/4 to 4/4), base vs PH2:");
for (const name of readdirSync(path.join(here, 'base-metre')).sort()) {
  const base = read('base-metre', name);
  const ph2 = read('ph2-metre', name);
  const same = JSON.stringify(counts(base)) === JSON.stringify(counts(ph2));
  console.log(`  ${name.replace('.json', '')}: summary byte-identical: ${String(same)}  ${JSON.stringify(counts(base))}`);
  if (!same) console.log(`    PH2: ${JSON.stringify(counts(ph2))}`);
  if (base.starts && ph2.starts) console.log(`    starts: ${JSON.stringify(compareStarts(base.starts, ph2.starts))}`);
}
