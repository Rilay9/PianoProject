// U32 item 4e: the frames between the first ink and `data-settled`, per open, from the re-plan watcher.
//   node scripts-replan-summary.mjs <dir> > replan-summary.txt
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
console.log('U32 item 4e: the Nocturne at 342 x 740, Bars 4, x4 throttle, this machine; ms after the first ink.');
console.log('Each line is a change on the glass or in what could move it; "picture" marks a change of the rows or the scale.\n');
for (const name of readdirSync(dir).filter((n) => n.endsWith('.json')).sort()) {
  const raw = JSON.parse(readFileSync(join(dir, name), 'utf8'));
  // The cell probe keeps the frames under `state` and the renderer's account under `fit`.
  const data = raw.state ?? raw;
  if (raw.fit) console.log(`${name}: final ${JSON.stringify({ slots: raw.fit.slotCount, systems: raw.fit.systemsPerWindow, rowPx: Math.round(raw.fit.rowPx), stage: Math.round(raw.fit.stage), changes: raw.fit.shapeChanges })}`);
  if (name.startsWith('heap__')) {
    console.log(`${name}: heap used ${data.used === null ? '-' : `${String(Math.round(data.used / 1e6))} MB`}, sheets ${JSON.stringify(data.sheets)}`);
    continue;
  }
  console.log(`== ${name}: first ink ${String(Math.round(data.firstInk))}, settled +${String(Math.round(data.settledAt - data.firstInk))}`);
  let lastPicture = '';
  let pictures = 0;
  for (const frame of data.frames) {
    const parts = frame.key.split(' | ');
    const picture = `${parts[0]} | ${parts[1]}`;
    const isPicture = picture !== lastPicture;
    if (isPicture) pictures += frame.at <= data.settledAt + 1 ? 1 : 0;
    lastPicture = picture;
    console.log(`  [${String(Math.round(frame.at - data.firstInk))}]${isPicture ? ' picture' : ''} ${frame.key}`);
  }
  console.log(`  pictures from the first ink to settled: ${String(pictures)}`);
}
