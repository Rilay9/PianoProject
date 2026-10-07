// MT1's 4/4 differential: base vs MT1 browser dumps (CB1's four Blue Bossa cases, and Bella Ciao).
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

function split(starts) {
  const clicks = starts.filter(([k]) => k === 'click' || k === 'accent');
  const kit = starts.filter(([k]) => k !== 'click' && k !== 'accent');
  return { clicks, kit };
}

function compareStarts(a, b) {
  const A = split(relative(a));
  const B = split(relative(b));
  const clicksIdentical = JSON.stringify(A.clicks) === JSON.stringify(B.clicks);
  const kitKinds = JSON.stringify(A.kit.map(([k]) => k)) === JSON.stringify(B.kit.map(([k]) => k));
  let maxKitDiff = 0;
  A.kit.forEach(([, w], i) => {
    maxKitDiff = Math.max(maxKitDiff, Math.abs(w - (B.kit[i]?.[1] ?? Number.NaN)));
  });
  return { clicks: A.clicks.length, clicksIdentical, kitEvents: A.kit.length, kitKindsInOrderIdentical: kitKinds, maxKitWhenDiffSec: Math.round(maxKitDiff * 1e4) / 1e4 };
}

console.log("CB1's Blue Bossa cases, base vs MT1:");
for (const name of readdirSync(path.join(here, 'base-cb1')).sort()) {
  const base = read('base-cb1', name);
  const mt1 = read('mt1-cb1', name);
  const { starts: bs, ...bc } = base;
  const { starts: ms, ...mc } = mt1;
  console.log(`  ${name.replace('.json', '')}`);
  console.log(`    counts and chips byte-identical: ${JSON.stringify(bc) === JSON.stringify(mc)}  ${JSON.stringify(bc)}`);
  console.log(`    starts: ${JSON.stringify(compareStarts(bs, ms))}`);
}
console.log('Within the base alone, case A run twice (A vs A2), the jitter the kit carries on any code:');
{
  const a = read('base-cb1', 'A backing on, comp on.json');
  const a2 = read('base-cb1', 'A2 backing on, comp on.json');
  console.log(`    starts: ${JSON.stringify(compareStarts(a.starts, a2.starts))}`);
}
// Where the kit's bar starts against the click: each bar's first bass note minus the nearest accent click.
function lead(starts) {
  const clicks = starts.filter(([k]) => k === 'accent' || k === 'click').map(([, w]) => w);
  const offsets = starts
    .filter(([k]) => k === 'bass')
    .map(([, w]) => {
      let best = Number.POSITIVE_INFINITY;
      for (const c of clicks) if (Math.abs(w - c) < Math.abs(best)) best = w - c;
      return Math.round(best * 1000);
    });
  return `${String(Math.min(...offsets))}..${String(Math.max(...offsets))} ms over ${String(offsets.length)} bass notes`;
}
for (const name of ['A backing on, comp on.json', 'B backing on, comp off.json']) {
  console.log(`  ${name}: each bass note minus the nearest click — base ${lead(read('base-cb1', name).starts)}; MT1 ${lead(read('mt1-cb1', name).starts)}`);
}
console.log('Bella Ciao (4/4, a pickup), first five bars and the count-in, base vs MT1:');
{
  const base = read('base-metre', 'Bella_Ciao_4-4.json');
  const mt1 = read('mt1-metre', 'Bella_Ciao_4-4.json');
  console.log(`    bars and counts identical: ${JSON.stringify([base.bars, base.counts]) === JSON.stringify([mt1.bars, mt1.counts])}  ${JSON.stringify(base.counts)} bars ${JSON.stringify(base.bars)}`);
  console.log(`    starts: ${JSON.stringify(compareStarts(base.starts, mt1.starts))}`);
}
