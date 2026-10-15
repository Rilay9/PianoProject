// Browser checks of the races and recoveries ChatGPT's review of 2026-10-14 found (docs/review-2026-10-14.md), run in
// the built app at phone size. Each makes its race happen on purpose (a download slowed, a file's bytes held back, a
// storage that fails to open) and was seen to fail on the build before the fixes.
//
// usage: npm run check:browser              (builds, serves on :5194, runs every case)
//        node tests/browser.mjs --url http://localhost:5196/PianoProject/   (a build served elsewhere: no build, no server)
// PIANO_CHROMIUM names a Chromium when Playwright's own build is not installed (a cloud session: /opt/pw-browsers/chromium).
// Not here: the library store's lost update (F03; shown with the store module through the dev server, 0 of 10 before,
// 10 of 10 after) and the PDF Adjust stale draw (F04; no way found to force it).

import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const urlAt = process.argv.indexOf('--url');
const PORT = 5194;
const BASE = urlAt > 0 ? process.argv[urlAt + 1] : `http://localhost:${PORT}/PianoProject/`;
const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const tmp = mkdtempSync(join(tmpdir(), 'piano-browser-'));

// A 3-page PDF whose pages differ in shape (842×400, 595×842, 842×595), each with two staves: the drawn page's shape
// says which page is on screen.
function threeShapes() {
  const objs = ['<< /Type /Catalog /Pages 2 0 R >>', null], kids = [];
  for (const [W, H] of [[842, 400], [595, 842], [842, 595]]) {
    const ops = ['1.4 w', '0 G'];
    for (const top of [H - 60, H - 160]) for (let i = 0; i < 5; i++) ops.push(`20 ${top - 6 * i} m ${W - 20} ${top - 6 * i} l S`);
    const stream = ops.join('\n'), n = objs.length + 1;
    objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Contents ${n + 1} 0 R /Resources << >> >>`);
    objs.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    kids.push(n);
  }
  objs[1] = `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(' ')}] /Count ${kids.length} >>`;
  let out = '%PDF-1.4\n';
  const offsets = objs.map((body, i) => { const at = out.length; out += `${i + 1} 0 obj\n${body}\nendobj\n`; return at; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return out;
}
const SHAPES = join(tmp, 'three shapes.pdf');
writeFileSync(SHAPES, threeShapes());
const BIG = join(tmp, 'big scan.pdf');
writeFileSync(BIG, readFileSync(here('./fixtures/pdf/scan.pdf'))); // 475 KB
const SCORE = here('../public/scores/mozart-k2.musicxml');
const MIDI = join(tmp, 'two hands.mid');
writeFileSync(MIDI, readFileSync(here('./fixtures/midi/two-hands.mid')));

// A small band file (the band, 2026-10-15): at 120 a minute in 4/4, four bars of a piano's whole-note chords, a bass
// (General MIDI 33) in quarters, a steel-string guitar (25) in halves and a kick drum on every beat: sounds kept in the
// app, so the check needs no network.
function bandMidi() {
  const varlen = (v) => { const o = [v & 0x7f]; for (v >>= 7; v > 0; v >>= 7) o.unshift((v & 0x7f) | 0x80); return o; };
  const chunk = (id, body) => [...Buffer.from(id), (body.length >>> 24) & 255, (body.length >> 16) & 255, (body.length >> 8) & 255, body.length & 255, ...body];
  const track = (events) => { // [tick, bytes]
    let now = 0;
    const body = events.sort((a, b) => a[0] - b[0] || (a[1][0] & 0xf0) - (b[1][0] & 0xf0)).flatMap(([t, bytes]) => { const d = t - now; now = t; return [...varlen(d), ...bytes]; });
    return chunk('MTrk', [...body, 0, 0xff, 0x2f, 0]);
  };
  const notes = (channel, list) => list.flatMap(([t, len, midi]) => [[t, [0x90 | channel, midi, 90]], [t + len, [0x80 | channel, midi, 0]]]);
  const Q = 480;
  return Buffer.from([
    ...chunk('MThd', [0, 1, 0, 5, Q >> 8, Q & 255]),
    ...track([[0, [0xff, 0x58, 4, 4, 2, 24, 8]], [0, [0xff, 0x51, 3, 0x07, 0xa1, 0x20]]]),
    ...track([[0, [0xff, 0x03, 5, ...Buffer.from('Piano')]], ...notes(0, [0, 1, 2, 3].flatMap((b) => [60, 64, 67].map((m) => [b * 4 * Q, 4 * Q, m])))]),
    ...track([[0, [0xff, 0x03, 4, ...Buffer.from('Bass')]], [0, [0xc1, 33]], ...notes(1, Array.from({ length: 16 }, (_, i) => [i * Q, Q - 20, 36]))]),
    ...track([[0, [0xff, 0x03, 6, ...Buffer.from('Guitar')]], [0, [0xc2, 25]], ...notes(2, Array.from({ length: 8 }, (_, i) => [i * 2 * Q, 2 * Q - 20, 52]))]),
    ...track(notes(9, Array.from({ length: 16 }, (_, i) => [i * Q, 60, 36]))),
  ]);
}
const BAND = join(tmp, 'little band.mid');
writeFileSync(BAND, bandMidi());
// A band file with no piano part: bass (33), a rhythm guitar (25, steel) and a lead guitar (24, nylon), and drums.
function rockMidi() {
  const varlen = (v) => { const o = [v & 0x7f]; for (v >>= 7; v > 0; v >>= 7) o.unshift((v & 0x7f) | 0x80); return o; };
  const chunk = (id, body) => [...Buffer.from(id), (body.length >>> 24) & 255, (body.length >> 16) & 255, (body.length >> 8) & 255, body.length & 255, ...body];
  const track = (events) => { let now = 0; return chunk('MTrk', [...events.sort((a, b) => a[0] - b[0]).flatMap(([t, bytes]) => { const d = t - now; now = t; return [...varlen(d), ...bytes]; }), 0, 0xff, 0x2f, 0]); };
  const notes = (channel, list) => list.flatMap(([t, len, midi]) => [[t, [0x90 | channel, midi, 90]], [t + len, [0x80 | channel, midi, 0]]]);
  const name = (n) => [0, [0xff, 0x03, n.length, ...Buffer.from(n)]];
  const Q = 480, beats = (midis) => midis.map((m, i) => [i * Q, Q - 20, m]);
  return Buffer.from([
    ...chunk('MThd', [0, 1, 0, 5, Q >> 8, Q & 255]),
    ...track([[0, [0xff, 0x58, 4, 4, 2, 24, 8]], [0, [0xff, 0x51, 3, 0x07, 0xa1, 0x20]]]),
    ...track([name('Bass'), [0, [0xc1, 33]], ...notes(1, beats([40, 40, 43, 45, 40, 40, 43, 45]))]),
    ...track([name('Rhythm'), [0, [0xc2, 25]], ...notes(2, beats([52, 55, 57, 59, 52, 55, 57, 59]))]),
    ...track([name('Lead'), [0, [0xc3, 24]], ...notes(3, beats([72, 74, 76, 77, 79, 77, 76, 74]))]),
    ...track(notes(9, beats([36, 38, 36, 38, 36, 38, 36, 38]))),
  ]);
}
const ROCK = join(tmp, 'rock tune.mid');
writeFileSync(ROCK, rockMidi());

let server = null, exited = false;
const stop = () => {
  if (!server) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' }); // (waited for: the run exits next, and an unfinished kill left the preview serving, so the next run refused its port; 2026-10-15)
  else try { process.kill(-server.pid, 'SIGTERM'); } catch { /* already gone */ }
};
if (urlAt < 0) {
  try { await fetch(BASE); console.error(`FAIL port ${PORT} is already serving (an earlier run's preview?): stop it and run again.`); process.exit(1); } catch { /* free */ }
  server = spawn(`npx vite preview --port ${PORT} --strictPort`, { shell: true, stdio: 'ignore', detached: process.platform !== 'win32' });
  server.on('exit', () => { exited = true; });
}

const results = [];
const ok = (name, pass, detail = '') => { results.push(pass); console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`); };
let browser;
try {
  let up = false;
  for (let i = 0; i < 75 && !up && !exited; i++) { try { await fetch(BASE); up = true; } catch { await new Promise((r) => setTimeout(r, 200)); } }
  if (!up) throw new Error(exited ? `the preview server stopped before answering (port ${PORT} taken?)` : 'the preview server did not answer within 15 s');
  browser = await chromium.launch(process.env.PIANO_CHROMIUM ? { executablePath: process.env.PIANO_CHROMIUM } : {});

  /** A fresh phone-sized page: offline cache off (it would answer before a slowed route), MIDI allowed. */
  async function fresh(init) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', permissions: ['midi'], acceptDownloads: true });
    const page = await ctx.newPage();
    if (init) await page.addInitScript(init);
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('dialog', (d) => d.accept());
    await page.goto(BASE); await page.waitForTimeout(1500);
    return { ctx, page, errors };
  }
  const more = (page) => page.evaluate(() => { const d = document.getElementById('more'); if (d && !d.open) d.showModal(); });
  const library = async (page) => { await more(page); await page.click('#open-library'); await page.waitForTimeout(600); };
  async function add(page, file) {
    await library(page);
    await page.setInputFiles('#lib-file', file);
    if (file.endsWith('.mid')) { await page.waitForSelector('#lib-midi[open]', { timeout: 20000 }); await page.click('#lib-midi button[value="add"]'); }
    await page.waitForTimeout(1500);
  }
  const message = (page) => page.evaluate(() => document.getElementById('message')?.textContent ?? '');
  function zipNames(buf) {
    const out = []; let i = 0;
    while ((i = buf.indexOf(Buffer.from([0x50, 0x4b, 3, 4]), i)) >= 0) { const n = buf.readUInt16LE(i + 26), x = buf.readUInt16LE(i + 28); out.push(buf.slice(i + 30, i + 30 + n).toString()); i += 30 + n + x; }
    return out;
  }
  async function backup(page) {
    await more(page);
    const download = page.waitForEvent('download', { timeout: 8000 }).catch(() => null);
    await page.click('#backup');
    const d = await download;
    await page.waitForTimeout(800);
    let names = null;
    if (d) { const p = join(tmp, `backup-${Date.now()}.zip`); await d.saveAs(p); names = zipNames(readFileSync(p)); }
    return { names, said: await message(page) };
  }

  // F01: a backup holds every file; a missing file is named; an unreadable library is refused.
  {
    const { ctx, page, errors } = await fresh();
    await add(page, SCORE); await add(page, MIDI);
    const b = await backup(page);
    ok('backup: backup.json, both pieces and the MIDI original', !!b.names && b.names.includes('backup.json') && b.names.filter((n) => n.startsWith('files/')).length === 3, JSON.stringify(b.names));
    await page.evaluate(() => new Promise((resolve) => {
      const r = indexedDB.open('piano-library');
      r.onsuccess = () => { const db = r.result, t = db.transaction('files', 'readwrite'), st = t.objectStore('files'), k = st.getAllKeys(); k.onsuccess = () => st.delete(k.result.find((x) => !String(x).endsWith(':midi'))); t.oncomplete = () => { db.close(); resolve(); }; };
    }));
    const m = await backup(page);
    ok('backup: a piece whose file is gone is left out and named', !!m.names && /Backed up, but without/.test(m.said), `"${m.said}"`);
    ok('backup: no page errors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  {
    const { ctx, page, errors } = await fresh(() => {
      const real = indexedDB.open.bind(indexedDB);
      indexedDB.open = (name, v) => {
        if (name !== 'piano-library') return real(name, v);
        const r = { error: new DOMException('Storage is unavailable', 'UnknownError') };
        setTimeout(() => r.onerror?.(new Event('error')), 0);
        return r;
      };
    });
    const b = await backup(page);
    ok('backup: a library that cannot be read is refused, with the reason', b.names === null && /could not be read/.test(b.said), `zip ${JSON.stringify(b.names)}; "${b.said}"`);
    ok('backup (unreadable): no page errors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  // F02: the big PDF's bytes held back 4 s, so its open ends after Back and another PDF's open.
  {
    const { ctx, page, errors } = await fresh();
    await add(page, BIG); await add(page, SHAPES);
    await page.evaluate(() => {
      const real = Blob.prototype.arrayBuffer;
      Blob.prototype.arrayBuffer = function () { const p = real.call(this); return this.size > 100000 ? p.then((b) => new Promise((r) => setTimeout(() => r(b), 4000))) : p; };
    });
    await page.locator('.lib-row', { hasText: 'big scan' }).first().click();
    await page.waitForTimeout(300);
    await page.evaluate(() => history.back());
    await page.waitForTimeout(800);
    await page.locator('.lib-row', { hasText: 'three shapes' }).first().click();
    await page.waitForTimeout(9000);
    await page.click('#pdf-open-adjust'); await page.waitForTimeout(3000);
    const st = await page.evaluate(() => { const c = document.querySelector('#pdf-adjust-frame canvas'); return { label: document.getElementById('pdf-adjust-label')?.textContent ?? '', title: document.getElementById('pdf-title')?.textContent, shape: c ? c.width / c.height : null }; });
    const want = 842 / 400;
    ok('PDF: a slow open finishing after a newer one does not take over', st.title === 'three shapes' && /of 3/.test(st.label) && st.shape !== null && Math.abs(st.shape - want) / want < 0.05, `"${st.title}", "${st.label}", drawn shape ${st.shape?.toFixed(3)} (page 1: ${want.toFixed(3)})`);

    // V3: an Adjust handle moved with the keyboard.
    let reached = false;
    for (let i = 0; i < 12 && !reached; i++) { await page.keyboard.press('Tab'); reached = await page.evaluate(() => document.activeElement?.dataset?.key === 'cut-0'); }
    const before = Number(await page.evaluate(() => document.activeElement?.getAttribute('aria-valuenow')));
    for (let i = 0; i < 4; i++) { await page.keyboard.press('ArrowDown'); await page.waitForTimeout(700); }
    const after = await page.evaluate(() => ({ key: document.activeElement?.dataset?.key, now: Number(document.activeElement?.getAttribute('aria-valuenow')) }));
    ok('Adjust: Tab reaches a handle, ArrowDown x4 moves it 2% of the page, focus stays', reached && Math.abs(after.now - before - 2) < 0.15 && after.key === 'cut-0', `reached ${reached}, ${before} → ${after.now}, focus ${after.key}`);
    ok('PDF: no page errors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  // The band (owner, 2026-10-15): a MIDI file's other parts play with its score. Imported, opened, played in Watch: the
  // sheet names them, the Tempo panel shows them, and each part is handed its notes as the song's clock reaches them.
  {
    const { ctx, page, errors } = await fresh();
    await library(page);
    await page.setInputFiles('#lib-file', BAND);
    await page.waitForSelector('#lib-midi[open]', { timeout: 20000 });
    await page.waitForFunction(() => /Check/.test(document.getElementById('lib-midi-facts')?.textContent ?? ''), null, { timeout: 20000 });
    const sheet = await page.textContent('#lib-midi-facts');
    await page.click('#lib-midi button[value="add"]'); await page.waitForTimeout(1500);
    ok('band: the import sheet names the band and says the score is the piano part', /BandBass, Guitar, Drums: they play with the score, which is the file’s piano part/.test(sheet ?? ''), (sheet ?? '').slice(0, 400));
    await page.locator('.lib-row', { hasText: 'little band' }).first().click();
    await page.waitForFunction(() => window.__pianoDebug?.state().steps > 0, null, { timeout: 30000 });
    await page.waitForTimeout(1000);
    await page.evaluate(() => document.getElementById('tempo').showModal());
    const panel = await page.evaluate(() => ({ shown: !document.getElementById('t-band-set').hidden, on: document.getElementById('t-band').checked, parts: document.getElementById('t-band-parts').textContent }));
    await page.evaluate(() => document.getElementById('tempo').close());
    ok('band: the Tempo panel shows the band, on, with its parts', panel.shown && panel.on && panel.parts === 'Bass, Guitar, Drums.', JSON.stringify(panel));
    await page.click('#play');
    let played = null;
    for (let i = 0; i < 40; i++) { await page.waitForTimeout(250); played = await page.evaluate(() => window.__pianoDebug.sound()); if (played.playing && played.t > 2600) break; }
    // At 120 a minute a beat is 500 ms: by song time t the bass and the kick have had a note on every beat so far (the
    // sound is handed notes 150 ms ahead), the guitar one every two beats.
    const due = (every) => Math.floor((played.t + 150) / every) + 1;
    const s = played.started ?? {};
    const near = (got, want) => got !== undefined && Math.abs(got - want) <= 1;
    ok('band: bass, guitar and drums are each handed their notes as the song reaches them', played.playing && near(s.electric_bass_finger, due(500)) && near(s.drums, due(500)) && near(s.acoustic_guitar_steel, due(1000)),
      `at ${played.t} ms: ${JSON.stringify(s)} (due: bass and drums ${due(500)}, guitar ${due(1000)})`);
    // A tap on the music stops it (the bars are away while it plays).
    await page.mouse.click(195, 420); await page.waitForTimeout(600);
    const stopped = await page.evaluate(() => window.__pianoDebug.sound().playing);
    // Off: the band is not played (the piano still is). From the top again.
    await page.evaluate(() => { window.__pianoDebug.goTo(0); document.getElementById('tempo').showModal(); });
    await page.click('#t-band');
    await page.evaluate(() => document.getElementById('tempo').close());
    await page.click('#play'); await page.waitForTimeout(1500);
    const off = await page.evaluate(() => window.__pianoDebug.sound());
    await page.mouse.click(195, 420);
    if (stopped) ok('band: (the second ▶ stopped it)', false, 'still playing');
    ok('band: switched off, none of its parts is played', off.playing && Object.keys(off.started ?? {}).length === 0, JSON.stringify(off));
    ok('band: no page errors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  // Picking the parts (owner, 2026-10-15): a band file with no piano part. The sheet guesses the tune and the bass;
  // the learner ticks the rhythm guitar instead of the bass; the score is then lead and rhythm, the band bass and drums.
  {
    const { ctx, page, errors } = await fresh();
    await library(page);
    await page.setInputFiles('#lib-file', ROCK);
    await page.waitForSelector('#lib-midi[open]', { timeout: 20000 });
    await page.waitForFunction(() => /Check/.test(document.getElementById('lib-midi-facts')?.textContent ?? ''), null, { timeout: 20000 });
    const ticked = () => page.evaluate(() => [...document.querySelectorAll('#lib-midi-parts-list input')].map((x) => `${x.parentElement.querySelector('span').textContent}:${x.checked ? 'score' : 'band'}`));
    const guess = await ticked();
    const note = await page.textContent('#lib-midi-parts-note');
    ok('parts: with no piano part the sheet lists the parts and guesses the tune and the bass, saying so', JSON.stringify(guess) === JSON.stringify(['Bass:score', 'Rhythm:band', 'Lead:score']) && /no piano part/.test(note ?? ''), `${JSON.stringify(guess)} ${note}`);
    await page.locator('#lib-midi-parts-list label', { hasText: 'Bass' }).locator('input').uncheck();
    await page.waitForTimeout(1500);
    await page.locator('#lib-midi-parts-list label', { hasText: 'Rhythm' }).locator('input').check();
    await page.waitForFunction(() => /Rhythm/.test(document.getElementById('lib-midi-facts')?.textContent ?? '') === false && /Bass, Drums/.test(document.getElementById('lib-midi-facts')?.textContent ?? ''), null, { timeout: 20000 }).catch(() => {});
    const chosen = await ticked();
    const facts = await page.textContent('#lib-midi-facts');
    ok('parts: ticking converts again: the score is lead and rhythm, the band bass and drums', JSON.stringify(chosen) === JSON.stringify(['Bass:band', 'Rhythm:score', 'Lead:score']) && /BandBass, Drums: they play with the score, which is Rhythm and Lead/.test(facts ?? '') && /\(by pitch\)/.test(facts ?? ''), `${JSON.stringify(chosen)} ${(facts ?? '').slice(0, 300)}`);
    await page.click('#lib-midi button[value="add"]'); await page.waitForTimeout(1500);
    await page.locator('.lib-row', { hasText: 'rock tune' }).first().click();
    await page.waitForFunction(() => window.__pianoDebug?.state().steps > 0, null, { timeout: 30000 });
    await page.waitForTimeout(1000);
    const parts = await page.evaluate(() => document.getElementById('t-band-parts').textContent);
    await page.click('#play');
    let played = null;
    for (let i = 0; i < 20; i++) { await page.waitForTimeout(250); played = await page.evaluate(() => window.__pianoDebug.sound()); if (played.playing && played.t > 1500) break; }
    await page.mouse.click(195, 420);
    const s = played.started ?? {};
    ok('parts: the choice is kept with the piece: the band plays bass and drums only', parts === 'Bass, Drums.' && s.electric_bass_finger > 0 && s.drums > 0 && !s.acoustic_guitar_steel && !s.acoustic_guitar_nylon, `panel "${parts}"; ${JSON.stringify(s)}`);
    ok('parts: no page errors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  // --- review 2026-10-15, B7-03: ▶ before the band has loaded (S3) ------------------------------------------------------
  // The band is read from the piece's MIDI file after the score is drawn. Its bytes are held back here (Blob.arrayBuffer
  // of a MIDI blob, 2.5 s, from sessionStorage's slowMidi) and ▶ is tapped as soon as the score is drawn: the first run
  // must still have the band. Then, opened again: ▶ and a stop while the band is read: nothing starts when it arrives.
  {
    const { ctx, page, errors } = await fresh(() => {
      const read = Blob.prototype.arrayBuffer;
      window.__midiHeld = 0;
      Blob.prototype.arrayBuffer = async function () {
        const bytes = await read.call(this), slow = Number(sessionStorage.getItem('slowMidi') || 0);
        if (slow && new TextDecoder().decode(new Uint8Array(bytes, 0, Math.min(4, bytes.byteLength))) === 'MThd') { window.__midiHeld++; await new Promise((r) => setTimeout(r, slow)); }
        return bytes;
      };
    });
    await library(page);
    await page.setInputFiles('#lib-file', BAND);
    await page.waitForSelector('#lib-midi[open]', { timeout: 20000 });
    await page.waitForFunction(() => /Check/.test(document.getElementById('lib-midi-facts')?.textContent ?? ''), null, { timeout: 20000 });
    await page.click('#lib-midi button[value="add"]'); await page.waitForTimeout(1500);
    await page.evaluate(() => sessionStorage.setItem('slowMidi', '2500'));
    await page.locator('.lib-row', { hasText: 'little band' }).first().click();
    await page.waitForFunction(() => window.__pianoDebug?.state().steps > 0, null, { timeout: 30000 });
    const early = await page.evaluate(() => ({ held: window.__midiHeld, bandShown: !document.getElementById('t-band-set').hidden }));
    await page.click('#play');
    let played = { playing: false, t: 0, started: {} };
    for (let i = 0; i < 40; i++) { await page.waitForTimeout(250); played = await page.evaluate(() => window.__pianoDebug.sound()); if (played.playing && played.t > 1600) break; }
    await page.mouse.click(195, 420); await page.waitForTimeout(600);
    const s = played.started ?? {};
    const due = Math.floor((played.t + 150) / 500) + 1, near = (got, want) => got !== undefined && Math.abs(got - want) <= 1;
    ok('band first ▶ (B7-03): tapped before the band was read, the first run still plays it from the start',
      early.held > 0 && !early.bandShown && played.playing && near(s.electric_bass_finger, due) && near(s.drums, due),
      `at the tap: MIDI reads held ${early.held}, band shown ${early.bandShown}; at ${played.t} ms: ${JSON.stringify(s)} (bass and drums due ${due})`);
    // Opened again (the band read anew, held back again): ▶, then ▶ again (stop) while it is read.
    await page.reload(); await page.waitForFunction(() => window.__pianoDebug?.state().steps > 0, null, { timeout: 30000 });
    await page.click('#play'); await page.waitForTimeout(300);
    const waiting = await page.textContent('#play');
    await page.click('#play'); await page.waitForTimeout(3500);
    const after = await page.evaluate(() => ({ ...window.__pianoDebug.sound(), held: window.__midiHeld }));
    ok('band first ▶ (B7-03): a stop while the band is read is kept: nothing starts when it arrives',
      after.held > 0 && !after.playing && Object.keys(after.started ?? {}).length === 0, `button while waiting "${waiting}"; ${JSON.stringify(after)}`);
    ok('band first ▶ (B7-03): no page errors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  // P6 (test review): a split placed by hand on one line survives + line (it used to be found again for every line).
  {
    const { ctx, page, errors } = await fresh();
    await add(page, here('fixtures/pdf/simple.pdf'));
    await page.locator('.lib-row', { hasText: 'simple' }).first().click();
    await page.waitForTimeout(4000);
    await page.click('#pdf-open-adjust'); await page.waitForTimeout(3000);
    const splitsNow = () => page.evaluate(() => window.__pianoDebug.pdf().splits[0] ?? []);
    const first = await splitsNow();
    let reached = false;
    for (let i = 0; i < 40 && !reached; i++) { await page.keyboard.press('Tab'); reached = await page.evaluate(() => document.activeElement?.dataset?.key === 'split-0-0'); }
    for (let i = 0; i < 6; i++) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(300); }
    const placed = await splitsNow();
    const lines = (await splitsNow()).length;
    await page.click('#pdf-adjust-add'); await page.waitForTimeout(3000);
    const after = await splitsNow();
    const moved = reached && placed[0]?.[0] !== first[0]?.[0];
    ok('Adjust: a split placed on a line stays when + line is pressed', moved && after.length === lines + 1 && after[0]?.[0] === placed[0]?.[0],
      `reached ${reached}; line 1 split ${first[0]?.[0]?.toFixed(3)} → placed ${placed[0]?.[0]?.toFixed(3)} → after + line ${after[0]?.[0]?.toFixed(3)}; lines ${lines} → ${after.length}`);
    ok('Adjust (+ line): no page errors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  // F05: + Add tapped twice while the catalogue file is still coming (slowed 2 s).
  {
    const { ctx, page, errors } = await fresh();
    await page.route('**/catalogue/*.mxl', async (route) => { await new Promise((r) => setTimeout(r, 2000)); await route.continue(); });
    await library(page);
    await page.click('#lib-tab-catalogue'); await page.waitForTimeout(1500);
    const row = page.locator('#lib-list li.lib-item').first();
    const title = (await row.locator('.lib-tt').textContent()).trim();
    const plus = row.locator('.lib-addcat');
    await plus.click(); await page.waitForTimeout(150); await plus.click({ force: true }).catch(() => {});
    await page.waitForTimeout(5000);
    await page.evaluate(() => history.back()); await page.waitForTimeout(1000);
    await page.click('#open-songs'); await page.waitForTimeout(500);
    const count = await page.locator('#song-list li', { hasText: title }).count();
    ok('catalogue: two taps on + Add put the piece in the song list once', count === 1, `"${title}" ${count} time(s)`);
    ok('catalogue add: no page errors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  // F08: the catalogue index refused on the library's first try, then reachable.
  {
    const { ctx, page } = await fresh();
    let failing = true;
    await page.route('**/catalogue/index.json', async (route) => { if (failing) await route.abort('internetdisconnected'); else await route.continue(); });
    await library(page); await page.waitForTimeout(800);
    const first = await page.locator('#lib-tabs').isVisible();
    failing = false;
    await page.evaluate(() => history.back()); await page.waitForTimeout(800);
    await library(page); await page.waitForTimeout(800);
    const second = await page.locator('#lib-tabs').isVisible();
    ok('catalogue: unreachable once, then the library opened again shows it', !first && second, `first ${first}, then ${second}`);
    await ctx.close();
  }

  // S2 (test review): the lengths the judges are given, as the score screen decides them from what OSMD drew. A score
  // served in place of Mozart's: C plain, D staccato, E–F under a slur, G before a rest, A a half note at the end.
  {
    const { ctx, page, errors } = await fresh();
    const note = (step, extra = '', type = 'quarter', dur = 1) => `<note><pitch><step>${step}</step><octave>4</octave></pitch><duration>${dur}</duration><voice>1</voice><type>${type}</type>${extra}</note>`;
    const xml = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1">`
      + `<measure number="1"><attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes><sound tempo="120"/>`
      + note('C') + note('D', '<notations><articulations><staccato/></articulations></notations>')
      + note('E', '<notations><slur type="start" number="1"/></notations>') + note('F', '<notations><slur type="stop" number="1"/></notations>')
      + `</measure><measure number="2">` + note('G') + `<note><rest/><duration>1</duration><voice>1</voice><type>quarter</type></note>` + note('A', '', 'half', 2)
      + `</measure></part></score-partwise>`;
    await page.route('**/scores/mozart-k2.musicxml', (route) => route.fulfill({ status: 200, contentType: 'application/xml', body: xml }));
    await page.goto(`${BASE}?piece=mozart-k2`);
    await page.waitForFunction(() => window.__pianoDebug?.state().steps > 0, null, { timeout: 30000 });
    const byKey = await page.evaluate(() => {
      const d = window.__pianoDebug, out = {};
      for (let i = 0; i < d.state().steps; i++) d.struck(i).forEach((m, j) => { out[m] = d.durations(i)[j]; });
      return out;
    });
    const w = byKey[60], near = (a, b) => Math.abs(a - b) < 1;
    const want = { 62: 0, 64: w, 65: (w * 2) / 3, 67: (w * 2) / 3, 69: 2 * w };
    const pass = w > 0 && Object.entries(want).every(([k, v]) => near(byKey[k], v));
    ok('lengths judged: staccato not judged, a slur end and a note before a rest need ⅔ of their length, others all of it', pass,
      `quarter ${w}; got ${JSON.stringify(byKey)}`);
    ok('lengths judged: no page errors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  // F07: Start in Memorise while the piano is still loading (each sample slowed), Done at once, Memorise again.
  {
    const { ctx, page, errors } = await fresh();
    let started = 0, finished = 0;
    await page.route('**/splendid-grand-piano/samples/**', async (route) => { started++; await new Promise((r) => setTimeout(r, 800)); await route.continue(); finished++; });
    const settled = async () => { for (let i = 0; i < 360; i++) { await page.waitForTimeout(500); if (started > 0 && started === finished) { await page.waitForTimeout(1500); if (started === finished) return true; } } return false; };
    const memorise = async () => { await more(page); await page.click('#open-memorise'); await page.waitForTimeout(1500); };
    await memorise();
    await page.click('#memo-go'); await page.waitForTimeout(300);
    await page.click('#memo-done'); await page.waitForTimeout(800);
    await memorise();
    const done = await settled();
    const after = await page.textContent('#memo-go');
    ok('Memorise: a Start from a visit that was left does not start the next one', done && after.includes('Start'), `samples ${finished}/${started}; button "${after}"`);
    await page.click('#memo-go');
    let control = '';
    for (let i = 0; i < 40 && !control.includes('■'); i++) { await page.waitForTimeout(500); control = await page.textContent('#memo-go'); }
    ok('Memorise (control): Start in the same visit does start', control.includes('■'), `"${control}"`);
    ok('Memorise: no page errors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  // ---- Review 2026-10-15, section S2 (library, storage and PDF) -------------------------------------------------
  const idOf = (page, title) => page.evaluate((t) => window.__pianoDebug.library().items.find((i) => i.title === t)?.id, title);
  const pdfSaved = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('piano-web.pdf.v1') ?? '{}'));
  const fileKeys = (page) => page.evaluate(() => new Promise((resolve) => {
    const r = indexedDB.open('piano-library');
    r.onsuccess = () => { const db = r.result, k = db.transaction('files').objectStore('files').getAllKeys(); k.onsuccess = () => { db.close(); resolve(k.result.map(String).sort()); }; };
  }));

  // B1-01: a backup restored over records whose files were lost puts the files back (the score's, the MIDI piece's
  // and the MIDI file it was converted from); it used to put a file back only when the record was missing too.
  {
    const { ctx, page, errors } = await fresh();
    await add(page, SCORE); await add(page, MIDI);
    const had = await fileKeys(page);
    await more(page);
    const download = page.waitForEvent('download', { timeout: 8000 });
    await page.click('#backup');
    const zip = join(tmp, 'restore-me.zip');
    await (await download).saveAs(zip);
    await page.evaluate(() => new Promise((resolve) => {
      const r = indexedDB.open('piano-library');
      r.onsuccess = () => { const db = r.result, t = db.transaction('files', 'readwrite'); t.objectStore('files').clear(); t.oncomplete = () => { db.close(); resolve(); }; };
    }));
    const lost = await fileKeys(page);
    await page.reload(); await page.waitForTimeout(1500);
    await page.setInputFiles('#restore-file', zip);
    await page.waitForLoadState('load'); await page.waitForTimeout(2500); // (restoring reloads the page)
    const back = await fileKeys(page);
    ok('restore: files lost from records still there are put back, the MIDI original too', had.length === 3 && lost.length === 0 && JSON.stringify(back) === JSON.stringify(had), `before ${JSON.stringify(had)}; lost ${lost.length}; after restore ${JSON.stringify(back)}`);
    ok('restore: no page errors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  // B2-02: a tap on the music while a PDF is still opening (its bytes held back 3 s) must not save the PDF shown
  // before under the new one's name: the new one then opened with the old one's lines and tilt.
  {
    const { ctx, page, errors } = await fresh();
    await add(page, SHAPES); await add(page, BIG);
    const a = await idOf(page, 'three shapes'), b = await idOf(page, 'big scan');
    await page.locator('.lib-row', { hasText: 'three shapes' }).first().click();
    await page.waitForTimeout(4000);
    await page.evaluate(() => history.back()); await page.waitForTimeout(1000);
    await page.evaluate(() => {
      const real = Blob.prototype.arrayBuffer;
      Blob.prototype.arrayBuffer = function () { const p = real.call(this); return this.size > 100000 ? p.then((x) => new Promise((r) => setTimeout(() => r(x), 3000))) : p; };
    });
    await page.locator('.lib-row', { hasText: 'big scan' }).first().click();
    await page.waitForTimeout(600);
    const opening = await page.textContent('#pdf-status');
    const box = await page.locator('#pdf-stage').boundingBox();
    for (let i = 0; i < 2; i++) { await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.8); await page.waitForTimeout(200); }
    await page.waitForTimeout(8000);
    const saved = await pdfSaved(page), shown = await page.evaluate(() => window.__pianoDebug.pdf());
    const same = JSON.stringify(saved[b]?.cuts?.[0]) === JSON.stringify(saved[a]?.cuts?.[0]);
    ok('PDF: taps while a PDF opens do not save the one before under its name', /Opening/.test(opening ?? '') && !!saved[a] && !!saved[b] && !same && Math.abs(shown.angles[0] ?? 0) > 0.3,
      `tapped while "${opening}"; big scan page 1 cuts ${JSON.stringify(saved[b]?.cuts?.[0])} (three shapes: ${JSON.stringify(saved[a]?.cuts?.[0])}); its tilt ${shown.angles[0]}`);
    ok('PDF (taps while opening): no page errors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  // B4-01: deleting a PDF deletes its saved place and lines (piano-web.pdf.v1); another PDF's stay.
  {
    const { ctx, page, errors } = await fresh();
    await add(page, SHAPES); await add(page, here('fixtures/pdf/simple.pdf'));
    const a = await idOf(page, 'three shapes'), s = await idOf(page, 'simple');
    for (const t of ['three shapes', 'simple']) { await page.locator('.lib-row', { hasText: t }).first().click(); await page.waitForTimeout(3000); await page.evaluate(() => history.back()); await page.waitForTimeout(1000); }
    const before = await pdfSaved(page);
    await page.locator('li.lib-item', { hasText: 'three shapes' }).locator('.lib-more').click(); await page.waitForTimeout(500);
    await page.locator('#lib-page button.danger', { hasText: 'Delete' }).click(); await page.waitForTimeout(1500);
    const after = await pdfSaved(page);
    ok('delete: a PDF\'s saved place and lines go with it, another PDF\'s stay', !!before[a] && !!before[s] && !(a in after) && !!after[s], `before ${Object.keys(before).length} (${!!before[a]}, ${!!before[s]}); after: deleted one kept ${a in after}, other kept ${!!after[s]}`);
    ok('delete: no page errors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  // B2-05: in two panes (a phone sideways), the row of the piece whose page shows is the highlighted one, the first
  // time the library opens too (the list used to be drawn before the first piece was chosen).
  {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(BASE); await page.waitForTimeout(1500);
    await library(page); await page.waitForTimeout(800);
    const st = await page.evaluate(() => ({ two: window.__pianoDebug.library().twoPanes, sel: [...document.querySelectorAll('#lib-list li.sel .lib-tt')].map((e) => e.textContent), page: document.querySelector('#lib-page .lib-title')?.textContent ?? null }));
    ok('library, two panes: the highlighted row is the piece whose page shows', st.two && st.sel.length === 1 && st.sel[0] === st.page, JSON.stringify(st));
    ok('library, two panes: no page errors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  // B4-02 / B4-03: a score's file and a chart's file unreachable when the library first opens, reachable the next
  // time: the score's facts and the chart come back (they used to stay missing for the rest of the visit).
  {
    const { ctx, page, errors } = await fresh();
    let failing = true;
    const fail = async (route) => { if (failing) await route.abort('internetdisconnected'); else await route.continue(); };
    await page.route('**/scores/chopin-op28-4.musicxml', fail);
    await page.route('**/content/lab/charts/pop-c.json', fail);
    const look = () => page.evaluate(() => { const items = window.__pianoDebug.library().items; return { facts: !!items.find((i) => i.id === 'chopin-op28-4')?.facts, chart: items.some((i) => i.id === 'chart:pop-c') }; });
    await library(page); await page.waitForTimeout(800);
    const first = await look();
    failing = false;
    await page.evaluate(() => history.back()); await page.waitForTimeout(800);
    await library(page); await page.waitForTimeout(800);
    const second = await look();
    ok('library: a score file and a chart unreachable once are read the next time it opens', !first.facts && !first.chart && second.facts && second.chart, `first ${JSON.stringify(first)}, then ${JSON.stringify(second)}`);
    ok('library (unreachable once): no page errors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  // Review 2026-10-15 (practice, judging and input). A stand-in MIDI keyboard: window.__key(midi, on) plays a key.
  {
    const fakeMidi = () => {
      const input = { id: 'test-keys', name: 'Test keys', state: 'connected', onmidimessage: null };
      const access = { inputs: new Map([[input.id, input]]), outputs: new Map(), onstatechange: null };
      Object.defineProperty(Navigator.prototype, 'requestMIDIAccess', { value: async () => access, configurable: true });
      window.__key = (midi, on) => input.onmidimessage?.({ data: new Uint8Array([on ? 0x90 : 0x80, midi, on ? 90 : 0]), timeStamp: performance.now() });
    };
    async function keysAt(url = BASE, route) {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
      const page = await ctx.newPage();
      if (route) await route(page);
      await page.addInitScript(fakeMidi);
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('dialog', (d) => d.accept());
      await page.goto(url); await page.waitForTimeout(1500);
      return { ctx, page, errors };
    }
    const tap = async (page, m) => { await page.evaluate((m) => window.__key(m, true), m); await page.waitForTimeout(60); await page.evaluate((m) => window.__key(m, false), m); };
    const press = (page, sel) => page.evaluate((s) => document.querySelector(s).click(), sel); // (as Enter on a focused button: works on a faded bar)
    const entries = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('piano-web.log.v1') ?? '{"entries":[]}').entries);
    const playing = (page) => page.evaluate(() => document.getElementById('play').textContent === '⏸');

    // B2-01: Hands changed during a judged run. Played with both hands, then R: the run ends there, its summary and log
    // for both hands (before: it ran on, logged and judged as the right hand).
    {
      const { ctx, page, errors } = await keysAt();
      await page.mouse.click(200, 400); await page.waitForTimeout(300);
      await page.selectOption('#q-mode', 'along'); await press(page, '#q-hands button[data-hands="both"]');
      await press(page, '#play'); await page.waitForTimeout(800);
      for (let i = 0; i < 6; i++) { await tap(page, 60); await page.waitForTimeout(350); }
      const during = await playing(page);
      await press(page, '#q-hands button[data-hands="right"]'); await page.waitForTimeout(300);
      const after = { playing: await playing(page), summary: await page.evaluate(() => document.getElementById('summary').open) };
      const e = (await entries(page)).at(-1);
      ok('Hands mid-run: the run ends there with its summary, logged for the hands it was played with', during && !after.playing && after.summary && e?.settings.hands === 'both',
        `running before ${during}, after ${JSON.stringify(after)}, logged hands ${e?.settings.hands}`);
      ok('Hands mid-run: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
    {
      // Paused by itself (no keys), then R, then carrying on: the run is the new hands' only (before: the paused part's
      // both-hand notes were added into a run logged as the right hand).
      const { ctx, page, errors } = await keysAt();
      await page.mouse.click(200, 400); await page.waitForTimeout(300);
      await page.selectOption('#q-mode', 'along'); await press(page, '#q-hands button[data-hands="both"]');
      await press(page, '#play');
      let paused = false;
      for (let i = 0; i < 40 && !paused; i++) { await page.waitForTimeout(250); paused = /Paused/.test(await message(page)); }
      await press(page, '#q-hands button[data-hands="right"]'); await page.waitForTimeout(200);
      const from = await page.evaluate(() => window.__pianoDebug.state().step);
      await tap(page, await page.evaluate((i) => window.__pianoDebug.struck(i, 'right')[0] ?? 60, from));
      await page.waitForTimeout(1200);
      const to = await page.evaluate(() => window.__pianoDebug.state().step);
      await press(page, '#play'); await page.waitForTimeout(400);
      const rh = await page.evaluate(([a, b]) => { let n = 0; for (let i = a; i <= b; i++) n += new Set(window.__pianoDebug.struck(i, 'right')).size; return n; }, [from, to]);
      const last = (await entries(page)).at(-1);
      ok('Hands while paused: carrying on is a new run of the new hands only', paused && last?.settings.hands === 'right' && last?.result.notes === rh,
        `paused ${paused}; logged ${last?.settings.hands}, ${last?.result.notes} notes; the right hand has ${rh} from step ${from} to ${to}`);
      ok('Hands while paused: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // B1-04: a key does not start Simon or a drill set behind the Level panel (as on the score); without it, it does.
    for (const kind of ['simon', 'drills']) {
      const { ctx, page, errors } = await keysAt();
      await page.mouse.click(200, 400); await page.waitForTimeout(300);
      await more(page); await press(page, `#open-${kind}`); await page.waitForTimeout(1500);
      await press(page, '#ex-level'); await page.waitForTimeout(200);
      await tap(page, 60); await page.waitForTimeout(1000);
      const behind = await page.textContent('#ex-name');
      await page.evaluate(() => { for (const d of document.querySelectorAll('dialog[open]')) d.close(); });
      await tap(page, 60); await page.waitForTimeout(1000);
      const open = await page.textContent('#ex-name');
      ok(`${kind}: a key behind the Level panel starts nothing; with it closed a key starts`, behind === 'Ready' && open !== 'Ready', `behind "${behind}", closed "${open}"`);
      ok(`${kind}: no page errors`, errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // B1-02: an activity is logged with your runs only once its screen opened. A piece that is not there; a Simon activity
    // overtaken by opening Simon from the menu while its sets load (before: both logged your own runs as the activity).
    {
      const activity = (body) => (p) => p.route('**/content/activities/test-act.json', (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify(body) }));
      const along = async (page) => {
        await page.mouse.click(200, 400); await page.waitForTimeout(300);
        await page.selectOption('#q-mode', 'along');
        await press(page, '#play'); await page.waitForTimeout(800);
        for (let i = 0; i < 3; i++) { await tap(page, 60); await page.waitForTimeout(300); }
        await press(page, '#play'); await page.waitForTimeout(400);
        return (await entries(page)).at(-1);
      };
      let { ctx, page, errors } = await keysAt(`${BASE}?activity=test-act`, activity({ title: 'Test', screen: 'score', piece: 'no-such-piece', settings: { mode: 'along' } }));
      await page.waitForTimeout(1000);
      const said = await message(page), e1 = await along(page);
      ok('activity with a missing piece: said, and your runs are not logged as it', /no piece/.test(said) && e1 && e1.activity === undefined, `"${said}"; logged activity ${e1?.activity}`);
      await ctx.close();
      ({ ctx, page, errors } = await keysAt(`${BASE}?activity=test-act`, activity({ title: 'Test', screen: 'score', piece: 'bach-bwv514', settings: { mode: 'along' } })));
      await page.waitForTimeout(1000);
      const e2 = await along(page);
      ok('activity (control): one that opens is logged with its runs', e2?.activity === 'test-act', `logged activity ${e2?.activity}`);
      await ctx.close();
      let menu = false;
      ({ ctx, page, errors } = await keysAt(`${BASE}?activity=chords-simon`, (p) => p.route('**/content/sets/index.json', async (r) => { if (!menu) await new Promise((res) => setTimeout(res, 5000)); await r.continue(); })));
      await page.mouse.click(200, 400);
      await more(page); menu = true; await press(page, '#open-simon');
      await page.waitForTimeout(8000);
      await tap(page, 60); await page.waitForTimeout(6000); // your own game (it plays the chain first)
      await tap(page, 30); await page.waitForTimeout(300); // a miss
      await press(page, '#ex-done'); await page.waitForTimeout(300);
      const e3 = (await entries(page)).at(-1);
      ok('activity overtaken by opening Simon from the menu: your own game is not logged as it', e3?.screen === 'simon' && e3.set !== 'chords-c' && e3.activity === undefined, `set ${e3?.set}, logged activity ${e3?.activity}`);
      ok('activities: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // B2-04: a mouse pressed on an on-screen key and let go off the keyboard lets the key go (score in Wait for me, Free play, Simon).
    {
      const { ctx, page, errors } = await keysAt();
      await page.mouse.click(200, 300); await page.waitForTimeout(300);
      await page.selectOption('#q-mode', 'wait');
      await page.reload(); await page.waitForTimeout(2000); await page.mouse.click(200, 300); await page.waitForTimeout(300);
      await page.evaluate(() => { for (const id of ['top-bar', 'bottom-bar']) document.getElementById(id).classList.add('faded'); }); // (the bottom bar sits over the keys)
      const held = (sel) => page.evaluate((s) => [...document.querySelectorAll(`${s} [data-midi].pressed`)].map((k) => Number(k.dataset.midi)), sel);
      async function dragOff(sel) {
        const at = await page.evaluate((s) => { const ks = [...document.querySelectorAll(`${s} [data-midi]`)].filter((k) => k.getBoundingClientRect().width > 0); const r = ks[Math.floor(ks.length / 2)].getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height * 0.8 }; }, sel);
        await page.mouse.move(at.x, at.y); await page.mouse.down(); await page.waitForTimeout(150);
        const down = (await held(sel)).length;
        await page.mouse.move(at.x, 120, { steps: 5 }); await page.mouse.up(); await page.waitForTimeout(300);
        return { down, after: (await held(sel)).length };
      }
      const got = { score: await dragOff('#keyboard') };
      await more(page); await press(page, '#open-freeplay'); await page.waitForTimeout(800);
      got.freeplay = await dragOff('#freeplay');
      await press(page, '#fp-done'); await page.waitForTimeout(300);
      await more(page); await press(page, '#open-simon'); await page.waitForTimeout(1500);
      got.simon = await dragOff('#ex-keyboard');
      ok('on-screen keys: a mouse let go off the keyboard lets the key go (score, Free play, Simon)', Object.values(got).every((g) => g.down === 1 && g.after === 0), JSON.stringify(got));
      ok('on-screen keys: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
  }
  // ---- Owner's answer A3 (2026-10-15; B1-04): a panel opened over what is running pauses it -------------------------
  // Keys played while a panel is open count nothing, and closing it carries on: the score's judged modes (paused, the
  // run kept: your next key carries it on), Wait for me and Memorise's waiting pass (they wait at the same notes),
  // Memorise's timed pass and notes + rhythm test (they wait to start again), Simon (your turn waits; the chain being
  // given is given again), Drills (a card waits; one whose clock ran starts its try again), the lab (the round is
  // played again after a count-in); and turning the phone in Wait for me while the piano leads on. Control: Watch plays
  // on. Run against the build before (`--url`), every case but the control and the page-error ones failed. Its own
  // stand-in MIDI keyboard, as in the block above.
  {
    const fakeMidi = () => {
      const input = { id: 'test-keys', name: 'Test keys', state: 'connected', onmidimessage: null };
      const access = { inputs: new Map([[input.id, input]]), outputs: new Map(), onstatechange: null };
      Object.defineProperty(Navigator.prototype, 'requestMIDIAccess', { value: async () => access, configurable: true });
      window.__key = (midi, on) => input.onmidimessage?.({ data: new Uint8Array([on ? 0x90 : 0x80, midi, on ? 90 : 0]), timeStamp: performance.now() });
    };
    async function keysPage() {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
      const page = await ctx.newPage();
      await page.addInitScript(fakeMidi);
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('dialog', (d) => d.accept());
      await page.goto(BASE); await page.waitForTimeout(1500);
      await page.mouse.click(200, 400); await page.waitForTimeout(300); // (the first tap starts MIDI and the sound)
      return { ctx, page, errors };
    }
    const wait = (page, ms) => page.waitForTimeout(ms);
    /** Keys pressed together, then let go. */
    const chord = async (page, keys) => { await page.evaluate((ks) => { for (const k of ks) window.__key(k, true); }, keys); await wait(page, 60); await page.evaluate((ks) => { for (const k of ks) window.__key(k, false); }, keys); };
    const press = (page, sel) => page.evaluate((s) => document.querySelector(s).click(), sel);
    const closePanel = (page) => page.evaluate(() => document.querySelector('dialog[open] .dlg-x')?.click()); // its ✕
    const isOpen = (page) => page.evaluate(() => !!document.querySelector('dialog[open]'));
    const step = (page) => page.evaluate(() => window.__pianoDebug.state().step);
    const struck = (page) => page.evaluate(() => window.__pianoDebug.struck(window.__pianoDebug.state().step));
    const playing = (page) => page.evaluate(() => document.getElementById('play').textContent === '⏸');
    const msg = (page) => page.evaluate(() => document.getElementById('message')?.textContent ?? '');
    const lastEntry = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('piano-web.log.v1') ?? '{"entries":[]}').entries.at(-1));
    const until = async (page, f, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await f()) return true; await wait(page, 100); } return false; };
    const PANELS = { 'Tempo and sound': ['#open-tempo'], Display: ['#open-settings'], '⋯': ['#open-more'], 'Keyboard controls': ['#open-more', '#open-remote'], Songs: ['#open-songs'], 'ⓘ': ['#open-info'] };
    const openPanel = async (page, kind) => { for (const sel of PANELS[kind]) await press(page, sel); await wait(page, 150); };

    // The score, Play along (both hands, BWV 514): started by its first note, a panel opened, two keys the score does
    // not have played behind it, closed, carried on with the note at the marker, stopped: the run's log has no wrong keys.
    {
      const { ctx, page, errors } = await keysPage();
      await page.selectOption('#q-mode', 'along'); await press(page, '#q-hands button[data-hands="both"]');
      for (const kind of Object.keys(PANELS)) {
        await chord(page, (await struck(page)).slice(0, 1)); await wait(page, 500);
        const started = await playing(page);
        await openPanel(page, kind);
        const a = await step(page);
        for (let i = 0; i < 2; i++) { await chord(page, [30]); await wait(page, 150); }
        await wait(page, 700);
        const during = { playing: await playing(page), moved: (await step(page)) - a, open: await isOpen(page) };
        await closePanel(page); await wait(page, 200);
        const said = await msg(page);
        await chord(page, (await struck(page)).slice(0, 1)); await wait(page, 500);
        const carried = await playing(page);
        await press(page, '#play'); await wait(page, 400); // ■: the run ends with its summary
        const e = await lastEntry(page);
        await closePanel(page); await wait(page, 200); // (the summary)
        ok(`A3 score, Play along, ${kind}: paused (keys behind it not counted), carries on from a key`, started && during.open && !during.playing && during.moved === 0 && /panel/.test(said) && carried && e?.result?.wrongKeys === 0,
          `started ${started}; while open ${JSON.stringify(during)}; said "${said}"; carried on ${carried}; logged wrong keys ${e?.result?.wrongKeys}`);
      }
      ok('A3 score, Play along: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
    // Rhythm (any key is a tap) pauses the same way; Watch plays on (control: nothing is judged).
    {
      const { ctx, page, errors } = await keysPage();
      await page.selectOption('#q-mode', 'rhythm');
      await chord(page, [60]); await wait(page, 500);
      await openPanel(page, 'Tempo and sound');
      const a = await step(page);
      await chord(page, [60]); await wait(page, 800);
      const during = { playing: await playing(page), moved: (await step(page)) - a };
      await closePanel(page); await wait(page, 200);
      await chord(page, [60]); await wait(page, 400);
      const carried = await playing(page);
      await press(page, '#play'); await wait(page, 300); await closePanel(page);
      ok('A3 score, Rhythm, Tempo and sound: paused, carries on from a key', !during.playing && during.moved === 0 && carried, `while open ${JSON.stringify(during)}; carried on ${carried}`);
      await page.selectOption('#q-mode', 'watch');
      await press(page, '#play'); await wait(page, 800);
      await openPanel(page, 'Tempo and sound');
      const w = await step(page); await wait(page, 1500);
      const watch = { playing: await playing(page), moved: (await step(page)) - w };
      await closePanel(page); await press(page, '#play');
      ok('A3 score, Watch (control): a panel does not pause it', watch.playing && watch.moved > 0, JSON.stringify(watch));
      ok('A3 score, Rhythm and Watch: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
    // Wait for me: the right keys behind Display do not move the marker; closed, they do.
    {
      const { ctx, page, errors } = await keysPage();
      await page.selectOption('#q-mode', 'wait');
      await press(page, '#play'); await wait(page, 1000);
      await chord(page, await struck(page)); await wait(page, 500);
      const a = await step(page);
      await openPanel(page, 'Display');
      await chord(page, await struck(page)); await wait(page, 500);
      const behind = (await step(page)) - a;
      await closePanel(page); await wait(page, 200);
      await chord(page, await struck(page)); await wait(page, 500);
      const after = (await step(page)) - a;
      ok('A3 score, Wait for me, Display: the right keys behind it do not move the marker; closed, they do', a > 0 && behind === 0 && after > 0, `marker at ${a}; moved behind the panel ${behind}, after closing ${after}`);
      ok('A3 score, Wait for me: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
    // Memorise: a pass waiting for your notes (no hint behind Settings, the marker stays; closed, it goes on), a timed
    // pass (behind Settings it stops and waits to start again; closed, your first note starts it), and the test, notes
    // (waits, as the waiting pass) and notes + rhythm (timed: starts again), every bar marked learned beforehand.
    for (const kind of ['waiting pass', 'timed pass', 'test, notes', 'test, notes + rhythm']) {
      const { ctx, page, errors } = await keysPage();
      const timed = /timed|rhythm/.test(kind), test = /test/.test(kind);
      if (test) {
        const bars = Array.from({ length: 400 }, (_, m) => m); // (more than the piece has: all of them learned)
        await page.evaluate((b) => localStorage.setItem('piano-web.memorise.v1', JSON.stringify({ learned: { 'bach-bwv514|both': b, 'bach-bwv514|right': b, 'bach-bwv514|left': b } })), bars);
        await page.reload(); await wait(page, 1500); await page.mouse.click(200, 400); await wait(page, 300);
      }
      await press(page, '#open-more'); await press(page, '#open-memorise'); await wait(page, 1500);
      if (kind === 'timed pass') { await press(page, '#memo-settings'); await press(page, 'input[name="m-timing"][value="yes"]'); await closePanel(page); await wait(page, 300); }
      const say = () => page.evaluate(() => document.getElementById('memo-say').textContent);
      if (test) {
        await press(page, '#memo-test'); await wait(page, 300);
        await page.evaluate((r) => [...document.querySelectorAll('#memo-offers button')].find((b) => (r ? /rhythm/ : /Test: notes \(/).test(b.textContent))?.click(), timed);
      } else await press(page, '#memo-go');
      const ready = await until(page, async () => /Your turn|Test: the whole piece from memory \(/.test(await say()), 15000); // (the test: once begun, not its offer)
      await chord(page, await struck(page)); await wait(page, 600);
      const a = await step(page), going = await say();
      await press(page, '#memo-settings'); await wait(page, 150);
      if (!timed) {
        await chord(page, await struck(page)); await wait(page, 3500); // (and longer than the 3 s hint)
        const behind = { moved: (await step(page)) - a, hint: await page.evaluate(() => document.querySelectorAll('#keyboard .now-r').length + /Next:/.test(document.getElementById('memo-say').textContent)) };
        await closePanel(page); await wait(page, 200);
        await chord(page, await struck(page)); await wait(page, 500);
        const after = (await step(page)) - a;
        ok(`A3 Memorise, ${kind}, Settings: keys behind it count nothing and no hint comes; closed, it goes on`, ready && /rom memory…/.test(going) && behind.moved === 0 && !behind.hint && after > 0,
          `ready ${ready}, "${going}"; behind the panel ${JSON.stringify(behind)}; after closing moved ${after}`);
      } else {
        await wait(page, 1500);
        const behind = { playing: await page.evaluate(() => window.__pianoDebug.state().playing), say: await say() };
        await closePanel(page); await wait(page, 200);
        await chord(page, await struck(page)); await wait(page, 400);
        const after = { playing: await page.evaluate(() => window.__pianoDebug.state().playing), say: await say() };
        ok(`A3 Memorise, ${kind}, Settings: it stops and waits to start again; closed, your first note starts it`, ready && /rom memory…/.test(going) && !behind.playing && /Your turn|Test: the whole piece from memory \(/.test(behind.say) && after.playing && /rom memory…/.test(after.say),
          `ready ${ready}, "${going}"; behind the panel ${JSON.stringify(behind)}; after ${JSON.stringify(after)}`);
      }
      ok(`A3 Memorise, ${kind}: no page errors`, errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
    // Simon (five notes in C, keys lit): on your turn the wanted key behind Level counts nothing; closed, it does. The
    // next chain, being given when Level opens, is not given behind it (no turn starts); closed, it is given again.
    {
      const { ctx, page, errors } = await keysPage();
      await press(page, '#open-more'); await press(page, '#open-simon'); await wait(page, 1500);
      const wanted = () => page.evaluate(() => window.__pianoDebug.simon());
      const status = () => page.evaluate(() => document.getElementById('ex-status').textContent);
      await chord(page, [60]);
      const turn = await until(page, async () => (await wanted()).length > 0);
      const w = await wanted();
      await press(page, '#ex-level'); await wait(page, 150);
      await chord(page, w[0]); await wait(page, 400);
      const behind = { wanted: (await wanted()).length, status: await status() };
      await closePanel(page); await wait(page, 200);
      await chord(page, w[0]); await wait(page, 200);
      const done = await status();
      await press(page, '#ex-level'); await wait(page, 3000); // (the next chain is due 0.7 s after the ✓)
      const giving = { wanted: (await wanted()).length, status: await status() };
      await closePanel(page);
      const again = await until(page, async () => /Listen/.test(await status()), 2000);
      const next = await until(page, async () => (await wanted()).length === 2, 8000);
      ok('A3 Simon, Level on your turn: the wanted key behind it counts nothing; closed, it does', turn && behind.wanted === w.length && !/✓/.test(behind.status) && /✓/.test(done),
        `turn ${turn} (${JSON.stringify(w)}); behind the panel ${JSON.stringify(behind)}; after closing "${done}"`);
      ok('A3 Simon, Level while the next chain is given: no turn behind it; closed, the chain is given again', giving.wanted === 0 && again && next, `behind the panel ${JSON.stringify(giving)}; given again ${again}; your turn at chain 2 ${next}`);
      ok('A3 Simon: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
    // Drills: a notes-only card (five notes in C) played whole behind Level counts nothing, closed it does; a timed card
    // (scales, steady quavers, after a count-in) whose clock runs when Level opens does not finish behind it, and starts
    // its try again (the count-in) when it closes.
    {
      const { ctx, page, errors } = await keysPage();
      await press(page, '#open-more'); await press(page, '#open-drills'); await wait(page, 1500);
      const d = () => page.evaluate(() => window.__pianoDebug.drill());
      await page.selectOption('#ex-set', 'five-notes-c'); await wait(page, 300);
      await chord(page, [60]);
      await until(page, async () => (await d()).state === 'turn');
      const card = (await d()).steps.map((s) => s.keys);
      await press(page, '#ex-level'); await wait(page, 150);
      for (const k of card) { await chord(page, k); await wait(page, 120); }
      await wait(page, 300);
      const behind = (await d()).state;
      await closePanel(page); await wait(page, 200);
      for (const k of card) { await chord(page, k); await wait(page, 120); }
      await wait(page, 300);
      const after = { state: (await d()).state, status: await page.evaluate(() => document.getElementById('ex-status').textContent) };
      ok('A3 Drills, Level over a notes-only card: the card played behind it counts nothing; closed, it does', card.length > 0 && behind === 'turn' && after.state === 'result' && /Clean/.test(after.status),
        `${card.length} notes; behind the panel "${behind}"; after closing ${JSON.stringify(after)}`);
      await page.selectOption('#ex-set', 'scales-up'); await wait(page, 300);
      await chord(page, [60]);
      const running = await until(page, async () => { const x = await d(); return x.state === 'turn' && x.started; }, 10000);
      await press(page, '#ex-level'); await wait(page, 150);
      const t = await d();
      await wait(page, 600 + Math.max(...t.steps.map((s) => s.t)));
      const timedBehind = (await d()).state;
      await closePanel(page); await wait(page, 300);
      const timedAfter = await d();
      ok('A3 Drills, Level while a timed card\'s clock runs: it does not finish behind it; closed, its try starts again', t.timed && running && timedBehind === 'turn' && timedAfter.state === 'countin' && !timedAfter.started,
        `timed ${t.timed}, clock running ${running}; behind the panel "${timedBehind}"; after closing ${timedAfter.state}, started ${timedAfter.started}`);
      ok('A3 Drills: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
    // The lab (owner, 2026-10-15: option b): ⚙ while the band plays pauses it; keys behind it count nothing; closed, a
    // bar of count-in leads back into the start of the round it stopped in, the same run; the dropped round is not
    // counted. Accompaniment, Roots, looping bar 1 (a round is one bar), paused in the second round.
    {
      const { ctx, page, errors } = await keysPage();
      await press(page, '#open-more'); await press(page, '#open-lab'); await wait(page, 1500);
      const lab = () => page.evaluate(() => window.__pianoDebug.lab());
      if ((await lab()).role !== 'accomp') await press(page, '#lab-role-accomp');
      for (let i = 0; i < 2; i++) await page.evaluate(() => document.querySelector('#lab-grid .lab-bar').click()); // loop bar 1
      await press(page, '#lab-start');
      const inRound = await until(page, async () => { const x = await lab(); return x.running && x.where.round === 1 && x.where.pos > 300; }, 20000); // (running: the sounds may still be loading)
      const bar = (await lab()).beatMs * 4;
      await press(page, '#lab-band'); await wait(page, 300);
      const behind = await lab();
      for (const k of [48, 60, 36]) { await chord(page, [k]); await wait(page, 100); } // C, the root, behind the panel
      await wait(page, 400);
      const later = await lab();
      await closePanel(page); await wait(page, 150);
      const counting = { where: (await lab()).where, said: await page.evaluate(() => document.getElementById('lab-where').textContent) };
      const back = await until(page, async () => { const w = (await lab()).where; return w.round === 1 && w.pos >= 0 && w.pos < bar / 2; }, 6000);
      await until(page, async () => (await lab()).where.round === 2, 6000); // the replayed round, unplayed, is over
      await wait(page, 200);
      await press(page, '#lab-stop'); await wait(page, 400);
      const e = await lastEntry(page);
      const rounds = (e?.result?.rounds ?? []).map((r) => `${r.round}:${r.bars ?? ''}${r.stoppedInBar ? ' stopped' : ''}`);
      ok('A3 lab, ⚙ while the band plays: paused, keys behind it count nothing', inRound && behind.running && behind.paused === 1 && later.where.pos === behind.where.pos && later.where.round === behind.where.round,
        `in round 2 ${inRound}; with ⚙ open ${JSON.stringify({ running: behind.running, paused: behind.paused, where: behind.where })}, 0.7 s later ${JSON.stringify(later.where)}`);
      ok('A3 lab, ⚙ closed: a bar of count-in, then the round it stopped in from its start', counting.where.round === -1 && /count-in/.test(counting.said) && back,
        `after closing ${JSON.stringify(counting)}; back at the round's start ${back}`);
      ok('A3 lab, the dropped round is not counted: one run, each round once, the replayed one judged on what came after', e?.screen === 'lab' && rounds.length >= 2 && rounds[0].startsWith('1:') && rounds[1] === '2:1:miss' && new Set(rounds.map((r) => r.split(':')[0])).size === rounds.length,
        `logged rounds ${JSON.stringify(rounds)}`);
      ok('A3 lab: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
    // Wait for me, turning the phone while the piano leads on to your next notes (left hand yours, the piano plays the
    // right): the run carries on and waits at your next notes, as it does when it was waiting (before: it ended).
    {
      const { ctx, page, errors } = await keysPage();
      await page.selectOption('#q-mode', 'wait'); await press(page, '#q-hands button[data-hands="left"]');
      await press(page, '#play'); await wait(page, 1000);
      const mine = () => page.evaluate(() => window.__pianoDebug.struck(window.__pianoDebug.state().step, 'left'));
      let leading = false;
      for (let i = 0; i < 12 && !leading; i++) {
        await chord(page, await mine());
        leading = await page.evaluate(() => window.__pianoDebug.state().playing);
        if (!leading) await wait(page, 300);
      }
      await page.setViewportSize({ width: 844, height: 390 }); await wait(page, 1500);
      const after = { running: await playing(page), step: await step(page) };
      await chord(page, await mine()); await wait(page, 800);
      const moved = (await step(page)) - after.step;
      ok('A3 Wait for me, the phone turned while the piano leads on: the run carries on at your next notes', leading && after.running && moved > 0,
        `piano leading when turned ${leading}; after turning ${JSON.stringify(after)}; your notes then moved the marker ${moved}`);
      ok('A3 Wait for me, turned: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
  }
  // ---- end of A3 -------------------------------------------------------------------------------------------------
} finally {
  await browser?.close();
  stop();
}
const failed = results.filter((r) => !r).length;
console.log(failed ? `${failed} failed` : `all ${results.length} passed`);
process.exit(failed ? 1 : 0);
