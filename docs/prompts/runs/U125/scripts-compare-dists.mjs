// Compares each variant's built chunks with the chunk hashes in their names
// normalised away, so a chunk that differs only by what it imports compares
// equal. Run from app/.
import { readdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const dists = ['build/u125/dist-head', 'build/u125/dist-noU119a', 'build/u125/dist-noU118b', 'build/u125/base/app/dist', ...process.argv.slice(2)];
const norm = (s) => s.replace(/-[A-Za-z0-9_-]{8}\.(js|css)/g, '-H.$1');
const table = {};
for (const d of dists) {
  const dir = path.join(d, 'assets');
  let files;
  try {
    files = readdirSync(dir);
  } catch {
    continue;
  }
  for (const f of files) {
    if (!/\.(js|css)$/.test(f)) continue;
    const key = norm(f);
    const h = createHash('md5').update(norm(readFileSync(path.join(dir, f), 'utf8'))).digest('hex').slice(0, 10);
    (table[key] ??= {})[d] = h;
  }
}
for (const [k, v] of Object.entries(table)) {
  const hs = new Set(Object.values(v));
  if (hs.size > 1 || Object.keys(v).length !== dists.length) {
    console.log(k.padEnd(40), dists.map((d) => (v[d] ?? '-').padEnd(11)).join(' '));
  }
}
console.log('(only chunks that differ are listed; columns:', dists.join(' | '), ')');
