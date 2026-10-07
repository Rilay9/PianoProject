// PH2's legibility census, summarised (the reviewer's `PH2-position-preserving-fallback`,
// `docs/review/responses/ph2-look.md`): every split or conflicted bar of every bundled chart that has one
// (`charts.table.ts` lists them), opened in the browser at each device width (`pictures.spec.ts`, the `census`
// tests), and how the screen drew it, by tier:
//   boxes   - each symbol in its own proportional box, at the cell's size (20px) or a step smaller down to 16px;
//   placed  - the boxes a proportional rule, each symbol with a leader from its foot to the rule at the place its
//             chord starts (straight down, or at a slant where the symbol stands to one side), on 1 line, 2 lines,
//             or 3 or more (a staircase at most), 16px down to 12px;
//   refused - the chart failed closed for that item at that width, with the reason it states.
// "positions kept" is checked in the rendered geometry of every drawn bar: a symbol in each box, or one leader
// per segment leaving its own symbol and meeting the rule within a pixel of its box's left edge, the symbols
// starting left to right in the order their chords come, no two symbols overlapping, no leader passing through
// another symbol, no two leaders crossing.
// Run: node docs/prompts/runs/PH2/legibility.mjs <folder holding census-<device>.json>
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const dir = process.argv[2] ?? path.join('build', 'ph2', 'pictures-out');
const tierOf = (row) => (row.layout === 'fit' ? 'boxes' : row.rows <= 1 ? 'placed, 1 line' : row.rows === 2 ? 'placed, 2 lines' : 'placed, 3 or more lines');
for (const name of readdirSync(dir).filter((n) => /^census-.*\.json$/.test(n)).sort()) {
  const { rows, refused } = JSON.parse(readFileSync(path.join(dir, name), 'utf8'));
  const device = name.replace(/^census-|\.json$/g, '');
  const charts = new Set([...rows.map((r) => r.id), ...refused.map((r) => r.id)]);
  console.log(`${device}: ${String(charts.size)} charts with a split or conflicted bar; ${String(charts.size - refused.length)} drawn, ${String(refused.length)} refused`);
  const tiers = new Map();
  for (const row of rows) {
    const tier = tierOf(row);
    const entry = tiers.get(tier) ?? { bars: 0, kept: 0, slanted: 0, items: new Set(), sizes: new Map() };
    entry.bars += 1;
    if ((row.slanted ?? 0) > 0) entry.slanted += 1;
    if (row.faults.length === 0) entry.kept += 1;
    entry.items.add(row.id);
    entry.sizes.set(row.size, (entry.sizes.get(row.size) ?? 0) + 1);
    tiers.set(tier, entry);
  }
  for (const tier of ['boxes', 'placed, 1 line', 'placed, 2 lines', 'placed, 3 or more lines']) {
    const e = tiers.get(tier);
    if (!e) {
      console.log(`  ${tier}: 0 bars`);
      continue;
    }
    const sizes = [...e.sizes.entries()].sort((a, b) => Number.parseFloat(b[0]) - Number.parseFloat(a[0])).map(([s, n]) => `${s} ${String(n)}`).join(', ');
    const slant = tier === 'boxes' ? '' : `, ${String(e.slanted)} with a slanted leader`;
    console.log(`  ${tier}: ${String(e.bars)} bars in ${String(e.items.size)} items, positions kept in ${String(e.kept)}${slant} (sizes: ${sizes})`);
    if (tier === 'placed, 3 or more lines') console.log(`    items: ${[...e.items].sort().join(', ')}`);
  }
  const faulty = rows.filter((r) => r.faults.length > 0);
  for (const row of faulty) console.log(`  POSITION FAULT ${row.id} bar ${String(row.bar)}: ${row.faults.join('; ')}`);
  for (const r of refused) console.log(`  refused: ${r.id}: "${r.reason}"`);
}
