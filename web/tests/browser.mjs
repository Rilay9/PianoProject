// Browser checks of the races and recoveries ChatGPT's review of 2026-10-14 found (docs/review-2026-10-14.md), run in
// the built app at phone size. Each makes its race happen on purpose (a download slowed, a file's bytes held back, a
// storage that fails to open) and was seen to fail on the build before the fixes.
//
// usage: npm run check:browser              (builds, serves on :5194, runs every case)
//        node tests/browser.mjs --url http://localhost:5196/PianoProject/   (a build served elsewhere: no build, no server)
// PIANO_CHROMIUM names a Chromium when Playwright's own build is not installed (a cloud session: /opt/pw-browsers/chromium).
// Not here: the library store's lost update (F03; shown with the store module through the dev server, 0 of 10 before,
// 10 of 10 after) and the PDF Adjust stale draw (F04; no way found to force it).

import { spawn } from 'node:child_process';
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
  if (process.platform === 'win32') spawn('taskkill', ['/pid', String(server.pid), '/T', '/F']);
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
} finally {
  await browser?.close();
  stop();
}
const failed = results.filter((r) => !r).length;
console.log(failed ? `${failed} failed` : `all ${results.length} passed`);
process.exit(failed ? 1 : 0);
