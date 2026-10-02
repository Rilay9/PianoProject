// One gallery cell's slot geometry and scale, from two states.json files side by side.
// Usage: node gallery-cell.cjs <before states.json> <after states.json> <branch/cell>
const fs = require('node:fs');
const find = (file, key) => JSON.parse(fs.readFileSync(file, 'utf8')).find((s) => `${s.branch}/${s.cell}` === key);
for (const file of [process.argv[2], process.argv[3]]) {
  const s = find(file, process.argv[4]);
  if (!s) {
    console.log(`${file}: no such cell`);
    continue;
  }
  const st = s.state || {};
  const f = st.fit || {};
  console.log(file);
  console.log(`  keys: ${Object.keys(st).join(', ')}`);
  console.log(`  shape ${f.slotCount}/${f.systemsPerWindow}/${f.barsShown} zoom ${f.zoom} frozen ${f.frozen ? f.frozen.scale : null} musicShare ${st.musicShare}`);
  console.log(`  slots ${JSON.stringify(st.slots)}`);
  console.log(`  fit.slots ranges ${JSON.stringify((f.slots || []).map((x) => x.range))}`);
}
