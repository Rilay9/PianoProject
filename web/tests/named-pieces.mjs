// The pieces content can name (shared by tests/activity.mjs and tests/path.mjs): the app's own scores
// (public/scores/index.json) and, since 2026-10-15, a catalogue piece by the id it gets when added, "u-" + its
// catalogue id (public/catalogue/index.json). `problem(id, bars)` is '' when the piece is there and the bars fall inside
// it, else the reason. An app score's bars are its printed measure numbers (the highest); a catalogue piece's are the
// index's bar count (bars as printed, read by the app's own reader), which for a file whose pickup is numbered 0 is one
// more than its last bar's number: this check is that much looser there.
import { readFileSync } from 'node:fs';

const pub = (p) => new URL(`../public/${p}`, import.meta.url);

export function namedPieces() {
  const scores = new Map(JSON.parse(readFileSync(pub('scores/index.json'), 'utf8')).map((p) => [p.id, p.file]));
  const cat = JSON.parse(readFileSync(pub('catalogue/index.json'), 'utf8'));
  const at = (name) => cat.fields.indexOf(name);
  const catBars = new Map(cat.rows.map((r) => [`u-${r[at('id')]}`, r[at('bars')]]));
  const printedBars = (file) => Math.max(0, ...[...readFileSync(pub(`scores/${file}`), 'utf8').matchAll(/<measure\b[^>]*\bnumber="(\d+)"/g)].map((m) => Number(m[1])));
  /** How many bars the piece has, and where that number came from; null when no piece has this id. */
  function barsOf(id) {
    if (scores.has(id)) return { bars: printedBars(scores.get(id)), from: 'the app\'s scores' };
    if (id.startsWith('u-') && catBars.has(id)) return { bars: catBars.get(id), from: 'the catalogue' };
    return null;
  }
  function problem(id, bars) {
    const p = barsOf(id);
    if (!p && catBars.has(`u-${id}`)) return `"${id}" is not a piece; the catalogue piece is named "u-${id}"`;
    if (!p) return `"${id}" is neither in public/scores/index.json nor in the catalogue index`;
    if (bars && (bars[0] < 1 || bars[1] > p.bars)) return `bars ${bars.join('-')} are not inside "${id}" (it has ${p.bars} bars, from ${p.from})`;
    return '';
  }
  return { barsOf, problem, catalogueIds: [...catBars.keys()] };
}
