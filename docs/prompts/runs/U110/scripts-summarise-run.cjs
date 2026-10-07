// One line per read from the U110 run probe: where, slots, chrome, frozen scale, overlap, rows.
// Usage: node summarise-run.cjs <run folder> [...]
const fs = require('node:fs');
const path = require('node:path');
for (const dir of process.argv.slice(2)) {
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
    const reads = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    if (!(reads[0] && 'at' in reads[0])) continue;
    let worst = -Infinity;
    for (const r of reads) {
      worst = Math.max(worst, r.overlapPx);
      const rows = r.rows.map((x) => `${x.ahead ? 'G' : 'W'}${x.bars}[${x.top} ink ${x.inkTop}..${x.inkBottom}]`).join(' ');
      const frozen = r.frozen && typeof r.frozen === 'object' ? Math.round(r.frozen.scale * 1000) / 1000 : '-';
      console.log(`${path.basename(dir)} ${file.replace('.json', '').padEnd(14)} ${String(r.at).padEnd(14)} slots ${r.slots} chrome ${r.chrome ?? '-'} frozen ${frozen} overlap ${r.overlapPx} ${rows}`);
    }
    console.log(`${path.basename(dir)} ${file.replace('.json', '')} WORST overlap ${worst}`);
  }
}
