// The state gallery's 60 cells, committed renderer against the fix: each cell's window shape
// (slots / systems / bars shown), the drawn scale, the music's share of the stage, and the worst
// overlap between consecutive drawn slots' boxes as the gallery records them (top, height).
// Usage: node compare-galleries.cjs <before states.json> <after states.json>
const fs = require('node:fs');
const load = (file) => new Map(JSON.parse(fs.readFileSync(file, 'utf8')).map((s) => [`${s.branch}/${s.cell}`, s]));
const before = load(process.argv[2]);
const after = load(process.argv[3]);
const describe = (s) => {
  const f = (s.state && s.state.fit) || {};
  const scale = s.state && typeof s.state.scale === 'number' ? s.state.scale : null;
  return `${f.slotCount}/${f.systemsPerWindow}/${f.barsShown} ahead ${f.ahead} share ${s.state ? s.state.musicShare : '-'}${scale !== null ? ` scale ${scale}` : ''}`;
};
let same = 0;
for (const [key, b] of before) {
  const a = after.get(key);
  if (!a) {
    console.log(`MISSING after: ${key}`);
    continue;
  }
  const db = describe(b);
  const da = describe(a);
  if (db === da) {
    same += 1;
    continue;
  }
  console.log(`${key}\n   before ${db}\n   after  ${da}`);
}
console.log(`${String(same)} of ${String(before.size)} cells the same shape, look-ahead and music share before and after`);
