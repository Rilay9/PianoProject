// Prints one load's pricing log from the U110 load probe as a readable sequence: each fit (stage
// height, rows, scale, engraving zoom), each grant decision (the drawn scale read, the scale the
// rows will draw at, the row height priced, the look-ahead row granted or not), each shape change
// the reshape ladder allowed or refused, and each packing of the slots.
// Usage: node excerpt-log.cjs <probe json> <load index>
const fs = require('node:fs');
const loads = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const load = loads[Number(process.argv[3] ?? 0)];
console.log(`# ${load.load}: slots ${load.slots}, ladder ${load.shapeChanges ? load.shapeChanges.n : '-'}, overlap ${load.overlapPx}`);
for (const e of load.log) {
  if (e.fit) {
    const f = e.fit;
    console.log(`fit    t ${f.t}  stage ${f.availH}  rows ${f.rows}  zoom ${f.zoom}  piece measured at zoom ${f.pieceInkZoom}  scale ${f.scale}  drawnRowPx ${f.drawnRowPx}  slots ${f.boxes.map((b) => `${b.ahead ? 'G' : 'W'}${b.bars}`).join(' ')}`);
  } else if (e.pack) {
    const p = e.pack;
    console.log(`pack   t ${p.t}  ${p.slotCount} slots in ${p.stageHeight}  rows ${p.heights.join('+')} = ${p.total}  ${p.packed ? 'packed' : 'EVEN SHARES (rows taller than their share)'}`);
  } else if (e.settle) {
    console.log(`shape  -> ${e.settle.slots} slots / ${e.settle.systems} systems / ${e.settle.shown} bars: ${e.ladder ? 'allowed' : 'REFUSED, ladder spent'}`);
  } else if ('rowHeight' in e) {
    console.log(`price  t ${e.t}  zoom ${e.zoom}  piece at zoom ${e.pieceInkZoom}  drawn scale read ${e.drawnNow}  rows will draw at ${e.drawn}  row priced ${e.rowHeight}  ahead row priced ${e.aheadHeight}  stage ${e.slotsHeight}  ${e.ahead ? 'GRANTED' : 'none'}  ladder ${e.shapeChanges ? e.shapeChanges.n : '-'}`);
  }
}
