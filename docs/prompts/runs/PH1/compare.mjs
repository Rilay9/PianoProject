// PH1's differential comparison: two outputs of differential.table.ts (before and after), compared per file.
//   node compare.mjs <before.jsonl> <after.jsonl>
// For every file in both (by content sha256): the tempo events serialised byte for byte, and today's chartBars
// serialised byte for byte. Files in only one output (a fixture PH1 added) are listed, not compared.
import { readFileSync } from 'node:fs';

const [beforePath, afterPath] = process.argv.slice(2);
const read = (path) =>
  new Map(
    readFileSync(path, 'utf8')
      .trim()
      .split('\n')
      .map((line) => {
        const row = JSON.parse(line);
        return [row.sha256, { row, tempo: JSON.stringify(row.tempo), bars: JSON.stringify(row.bars), unreadable: row.unreadable }];
      }),
  );
const before = read(beforePath);
const after = read(afterPath);
let compared = 0;
let tempoFiles = 0;
let tempoEvents = 0;
let harmonyFiles = 0;
let bars = 0;
let unreadable = 0;
const tempoChanged = [];
const barsChanged = [];
for (const [sha, b] of before) {
  const a = after.get(sha);
  if (!a) continue;
  compared += 1;
  if (b.unreadable !== undefined || a.unreadable !== undefined) {
    unreadable += 1;
    if (b.unreadable !== a.unreadable) tempoChanged.push(`${b.row.paths[0]}: readable changed`);
    continue;
  }
  if (b.row.tempo.length > 0) tempoFiles += 1;
  tempoEvents += b.row.tempo.length;
  if (b.row.symbols > 0) harmonyFiles += 1;
  bars += b.row.bars.length;
  if (b.tempo !== a.tempo) tempoChanged.push(b.row.paths[0]);
  if (b.bars !== a.bars) barsChanged.push(b.row.paths[0]);
}
const onlyBefore = [...before.keys()].filter((sha) => !after.has(sha)).map((sha) => before.get(sha).row.paths.join(' '));
const onlyAfter = [...after.keys()].filter((sha) => !before.has(sha)).map((sha) => after.get(sha).row.paths.join(' '));
console.log(`files compared (distinct contents in both): ${String(compared)} (unreadable in both: ${String(unreadable)})`);
console.log(`only before: ${onlyBefore.length ? onlyBefore.join('; ') : 'none'}`);
console.log(`only after: ${onlyAfter.length ? onlyAfter.join('; ') : 'none'}`);
console.log(`tempoEvents: ${String(tempoFiles)} files stating a tempo, ${String(tempoEvents)} events; files whose serialised events differ: ${String(tempoChanged.length)}`);
for (const path of tempoChanged) console.log(`  tempo changed: ${path}`);
console.log(`chartBars: ${String(harmonyFiles)} files with symbols, ${String(bars)} bars over all files; files whose serialised bars differ: ${String(barsChanged.length)}`);
for (const path of barsChanged) console.log(`  bars changed: ${path}`);
