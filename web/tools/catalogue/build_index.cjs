// Step 3 of building the catalogue: the index the app reads (web/public/catalogue/index.json) and its files.
// Every chosen file is read by the app's own facts reader (src/library/facts.ts, through the built app's
// window.__pianoDebug.readScore, in a real browser), so the catalogue shows exactly what the library would read from
// the file if you added it by hand; where it disagrees with scan.py's reading, the row is reported, and a file the
// app wouldn't call piano or a lead sheet is left out.
//
//   node build_index.cjs <chosen dir (from select_pieces.py)> <served app url, e.g. http://localhost:5192/PianoProject/>
//
// Writes web/public/catalogue/index.json and copies the files to web/public/catalogue/.
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const { chromium } = require('playwright');

const [dir, url] = process.argv.slice(2);
const OUT = path.join(__dirname, '..', '..', 'public', 'catalogue');
// PDMX's licence codes, in words (the uploader's licence for the transcription, not the composition's).
const LICENCE = { publicdomain: 'Public Domain Mark', 'cc-zero': 'CC0' };

async function xmlOf(file) {
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  const container = await zip.file('META-INF/container.xml')?.async('string');
  const named = container?.match(/full-path="([^"]+)"/)?.[1];
  const entry = (named && zip.file(named)) || zip.file(/^(?!META-INF\/).*\.(musicxml|xml)$/i)[0];
  return entry.async('string');
}

(async () => {
  const chosen = JSON.parse(fs.readFileSync(path.join(dir, 'chosen.json'), 'utf8'));
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto(url);
  await p.waitForFunction(() => window.__pianoDebug?.readScore, null, { timeout: 30000 });
  fs.mkdirSync(OUT, { recursive: true });
  for (const f of fs.readdirSync(OUT)) if (f.endsWith('.mxl')) fs.unlinkSync(path.join(OUT, f)); // a rebuild starts clean
  const fields = ['id', 'file', 'title', 'composer', 'kind', 'fifths', 'mode', 'keyChanges', 'time', 'timeChanges', 'bars', 'low', 'high', 'chords', 'views', 'group', 'licence', 'bytes'];
  const rows = [], differ = [], dropped = [];
  for (const c of chosen) {
    const xml = await xmlOf(path.join(dir, 'files', c.file));
    const r = await p.evaluate(([xml, name]) => { try { return window.__pianoDebug.readScore(xml, name); } catch (e) { return { error: String(e.message ?? e) }; } }, [xml, c.file]);
    if (r.error || !['piano', 'lead'].includes(r.facts.kind)) { dropped.push(`${c.file} ${c.title}: ${r.error ?? r.facts.kind}`); continue; }
    const x = r.facts;
    const diff = ['bars', 'fifths', 'time', 'low', 'high'].filter((k) => (x[k] ?? null) !== (c[k] ?? null));
    if (x.kind !== c.kind) diff.push('kind');
    if (diff.length) differ.push(`${c.file} ${c.title}: ${diff.map((k) => `${k} app=${x[k]} scan=${c[k]}`).join(', ')}`);
    fs.copyFileSync(path.join(dir, 'files', c.file), path.join(OUT, c.file));
    rows.push([c.sha256.slice(0, 12), c.file, c.title, c.composerChecked, x.kind, x.fifths, x.mode, x.keyChanges ? 1 : 0, x.time, x.timeChanges ? 1 : 0, x.bars, x.low, x.high, x.chords ? 1 : 0, c.views, c.group, LICENCE[c.licence] ?? c.licence, c.size]);
  }
  const version = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify({ version, source: 'PDMX (MuseScore uploads), read by web/tools/catalogue', fields, rows }));
  console.log(`${rows.length} rows written, ${dropped.length} left out, ${differ.length} where scan.py and the app's reader differ`);
  for (const d of dropped.slice(0, 20)) console.log('  left out:', d);
  for (const d of differ.slice(0, 20)) console.log('  differs:', d);
  await b.close();
})();
