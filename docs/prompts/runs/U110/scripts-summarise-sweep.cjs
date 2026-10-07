// The U110 sweep as one line per cell and load; the overlapping ones marked. Usage: node summarise-sweep.cjs <dir>
const fs = require('node:fs');
const path = require('node:path');
const dir = process.argv[2];
let cells = 0;
let overlaps = 0;
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
  for (const r of JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))) {
    cells += 1;
    const bad = r.overlapPx > 0.5;
    if (bad) overlaps += 1;
    console.log(`${bad ? 'OVERLAP' : 'ok     '} ${file.replace('.json', '').padEnd(32)} bars ${r.bars} ${r.load.padEnd(6)} slots ${r.slots} systems ${r.systems} shown ${r.shown} ladder ${r.ladder} overlap ${r.overlapPx} ${r.rows.join(' ')}`);
  }
}
console.log(`${String(overlaps)} of ${String(cells)} loads overlap`);
