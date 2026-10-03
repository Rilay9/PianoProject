// U32a: the look probe's JSON per cell, summarised (not for the commit).
//   node look-summary.mjs <dir> [<dir>...]
import { readdirSync, readFileSync } from 'node:fs';
import { join, basename } from 'node:path';

for (const dir of process.argv.slice(2)) {
  console.log(`== ${basename(dir)}`);
  for (const name of readdirSync(dir).filter((n) => n.endsWith('.json')).sort()) {
    const d = JSON.parse(readFileSync(join(dir, name), 'utf8'));
    const f = d.first;
    const s = d.settled;
    const st = d.state;
    const sheets = (x) => (typeof x === 'object' && x !== null ? `${x.made}/${x.loaded}/${x.pending}` : String(x));
    const rows = (x) => (x.rows ?? []).map((r) => `${r.bars}${r.ahead ? '~' : ''}`).join(',');
    let pictures = 0;
    let last = '';
    const changes = [];
    for (const fr of st.frames) {
      const parts = fr.key.split(' | ');
      const pic = `${parts[0]} | ${parts[1]}`;
      if (pic !== last && fr.at <= st.settledAt + 1) {
        pictures += 1;
        changes.push(`+${Math.round(fr.at - st.firstInk)} ${parts[0].replace('rows ', '')} ${parts[1].replace(/.*scale\(([\d.]+)\).*/, 's$1')} ${parts[2]} ${parts[5]}`);
      }
      last = pic;
    }
    console.log(
      `${name.replace('.json', '')}: first [${rows(f)}] staff ${f.staffPx} sheets ${sheets(f.sheets)} | settled [${rows(s)}] staff ${s.staffPx} ink ${s.inkShare} free ${s.freeBelow} rowPx ${s.rowPx} slots ${s.slotCount} sys ${s.systemsPerWindow} shown ${s.barsShown}/${s.barsAsked} why ${s.windowWhy} sheets ${sheets(s.sheets)} | heap ${d.heap.used === null ? '-' : Math.round(d.heap.used / 1e6)} MB | settled +${Math.round(st.settledAt - st.firstInk)} ms after first ink | pictures ${pictures}`,
    );
    for (const c of changes) console.log(`    ${c}`);
  }
}
