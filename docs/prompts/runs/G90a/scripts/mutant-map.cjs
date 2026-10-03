const fs = require('fs');
const text = fs.readFileSync(__dirname + '/mutants.txt', 'utf8').split(/\r?\n/);
const byTest = new Map();
let current = null;
for (const line of text) {
  const head = /^(M\d+)\s/.exec(line);
  if (head) {
    current = head[1];
    continue;
  }
  if (current && /^\s{6}\S/.test(line)) {
    const name = line.trim();
    if (!byTest.has(name)) byTest.set(name, []);
    byTest.get(name).push(current);
  }
}
const rows = [...byTest.entries()].sort((a, b) => a[0].localeCompare(b[0]));
for (const [name, list] of rows) console.log(list.join(','), '<=', name.slice(0, 190));
