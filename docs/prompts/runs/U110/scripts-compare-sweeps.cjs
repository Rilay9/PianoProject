// Every sweep load whose shape (slots / systems / bars shown) or staff-bearing scale differs
// between two sweep folders, and the ladder counts side by side. Usage: node compare-sweeps.cjs <before> <after>
const fs = require('node:fs');
const path = require('node:path');
const read = (dir) => {
  const out = new Map();
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    for (const r of JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))) {
      out.set(`${file.replace('.json', '')} bars ${r.bars} ${r.load}`, r);
    }
  }
  return out;
};
const before = read(process.argv[2]);
const after = read(process.argv[3]);
let same = 0;
for (const [key, b] of [...before.entries()].sort()) {
  const a = after.get(key);
  if (!a) {
    console.log(`MISSING after: ${key}`);
    continue;
  }
  const shapeB = `${b.slots}/${b.systems}/${b.shown}`;
  const shapeA = `${a.slots}/${a.systems}/${a.shown}`;
  const rowsSame = JSON.stringify(b.rows) === JSON.stringify(a.rows);
  if (shapeB === shapeA && rowsSame) {
    same += 1;
    continue;
  }
  console.log(`${key}: shape ${shapeB} -> ${shapeA}, ladder ${b.ladder} -> ${a.ladder}, overlap ${b.overlapPx} -> ${a.overlapPx}${rowsSame ? '' : `\n   before ${b.rows.join(' ')}\n   after  ${a.rows.join(' ')}`}`);
}
console.log(`${String(same)} of ${String(before.size)} loads drew the same shape and the same rows before and after`);
