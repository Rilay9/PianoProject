// Prints one line per load from the U110 probe's JSON: shape, overlap, the ladder, and each row's
// slot top, ink extent and slot pitch. Usage: node summarise.cjs <probe folder> [<probe folder> ...]
const fs = require('node:fs');
const path = require('node:path');
for (const dir of process.argv.slice(2)) {
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
    const loads = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    if (!(loads[0] && 'load' in loads[0] && 'rows' in loads[0] && 'shapeChanges' in loads[0])) continue;
    for (const l of loads) {
      const rows = l.rows
        .map((r) => `${r.ahead ? 'G' : 'W'}[top ${r.slotTop} pitch ${r.pitchPx ?? '-'} ink ${r.inkTop}..${r.inkBottom} priced ${r.pricedPx}]`)
        .join(' ');
      console.log(
        `${path.basename(dir)} ${file.replace('.json', '')} ${String(l.load).padEnd(9)} slots ${l.slots} systems ${l.systems} shown ${l.shown} ahead ${l.ahead} overlap ${l.overlapPx} ladder ${l.shapeChanges ? l.shapeChanges.n : '-'} grants ${(l.log || []).filter((e) => e && e.ahead === true && 'rowHeight' in e).length} ${rows}`,
      );
    }
  }
}
