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
  // (2026-10-15: the app opens to Home; the library is the Music tab, backup in Settings, the tools in Practice.)
  /** Back to the tabs (from a piece or a tool), then a tab. */
  const toTab = async (page, tab) => {
    for (let i = 0; i < 4 && await page.evaluate(() => document.getElementById('shell').hidden || document.getElementById('shell').classList.contains('no-tabs')); i++) { await page.evaluate(() => history.back()); await page.waitForTimeout(500); }
    await page.evaluate((t) => document.querySelector(`#tabs [data-tab="${t}"]`).click(), tab); await page.waitForTimeout(300);
  };
  const library = async (page) => { await toTab(page, 'music'); await page.waitForTimeout(600); };
  const settingsPage = async (page) => { await toTab(page, 'home'); await page.evaluate(() => document.getElementById('home-settings').click()); await page.waitForTimeout(300); };
  /** A tool from Practice (Simon, Drills, Accompaniment lab, Free play, Metronome). */
  const practice = async (page, name) => { await toTab(page, 'practice'); await page.evaluate((n) => document.querySelector(`[data-practice="${n}"]`).click(), name); };
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
    await settingsPage(page);
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
    // (drawn, and its MIDI read under way and held back: since 2026-10-15 nothing is drawn before, and the two land together)
    await page.waitForFunction(() => window.__pianoDebug?.state().steps > 0 && window.__midiHeld > 0, null, { timeout: 30000 });
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
    await page.mouse.click(5, 5); await page.waitForTimeout(200); // (opened straight into the piece: the first tap, "Tap anywhere to start", re-check V31)
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
    // (The song list went, 2026-10-15: the pieces it listed are the app's pieces, which every screen takes.)
    const count = await page.evaluate((t) => window.__pianoDebug.pieces().filter((p) => p.title === t).length, title);
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
    await page.goto(`${BASE}?piece=bach-bwv514`); await page.waitForTimeout(1500); // (the first piece, as the app opened before 2026-10-15)
    const memorise = async () => { await page.evaluate(() => document.getElementById('more').showModal()); await page.click('#open-memorise'); await page.waitForTimeout(1500); };
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
    await settingsPage(page);
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
    // (Failing from the page's start: since 2026-10-15 Home reads the charts for its recent list before Music opens.)
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
    let failing = true;
    const fail = async (route) => { if (failing) await route.abort('internetdisconnected'); else await route.continue(); };
    await page.route('**/scores/chopin-op28-4.musicxml', fail);
    await page.route('**/content/lab/charts/pop-c.json', fail);
    await page.goto(BASE); await page.waitForTimeout(1500);
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
    async function keysAt(url = `${BASE}?piece=bach-bwv514`, route) { // (the first piece, as the app opened before 2026-10-15)
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
      await practice(page, kind === 'simon' ? 'Simon' : 'Drills'); await page.waitForTimeout(1500);
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
      const said = await message(page);
      // (2026-10-15: Home stays; a piece opened from Music, as the score stood behind before)
      await library(page); await page.locator('.lib-row', { hasText: 'Chorale' }).first().click(); await page.waitForTimeout(400);
      if (await page.locator('#lib-page .btn.main', { hasText: 'Open' }).isVisible()) await page.locator('#lib-page .btn.main', { hasText: 'Open' }).click();
      await page.waitForTimeout(1500);
      const e1 = await along(page);
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
      menu = true; await practice(page, 'Simon');
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
      await practice(page, 'Free play'); await page.waitForTimeout(800);
      got.freeplay = await dragOff('#freeplay');
      await press(page, '#fp-done'); await page.waitForTimeout(300);
      await practice(page, 'Simon'); await page.waitForTimeout(1500);
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
      await page.goto(`${BASE}?piece=bach-bwv514`); await page.waitForTimeout(1500); // (the first piece, as the app opened before 2026-10-15)
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
    // (2026-10-15: Keyboard controls moved to Settings and the song list went, so neither opens over a piece any more.)
    const PANELS = { 'Tempo and sound': ['#open-tempo'], Display: ['#open-settings'], '⋯': ['#open-more'], 'ⓘ': ['#open-info'] };
    const practice = async (page, name) => { await page.evaluate(() => history.back()); await wait(page, 500); await page.evaluate(() => document.querySelector('#tabs [data-tab="practice"]').click()); await page.evaluate((n) => document.querySelector(`[data-practice="${n}"]`).click(), name); };
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
      await practice(page, 'Simon'); await wait(page, 1500);
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
      await practice(page, 'Drills'); await wait(page, 1500);
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
      await practice(page, 'Accompaniment lab'); await wait(page, 1500);
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

  // ---- Home, the tabs, Path and lessons (owner, 2026-10-15) ------------------------------------------------------------
  // Where things are and how you get back: the app opens to Home; ← (or Done) and Android Back (history) go back to the
  // tab or the lesson page a screen was opened from; links with ?piece= / ?activity= open over Home; a reload stays on
  // its tab. A lesson step opens its activity tagged with the step, comes back to the lesson page with how it went and
  // the feedback taps, which reach the practice log's export. Its own stand-in MIDI keyboard, as above.
  {
    const fakeMidi = () => {
      const input = { id: 'test-keys', name: 'Test keys', state: 'connected', onmidimessage: null };
      const access = { inputs: new Map([[input.id, input]]), outputs: new Map(), onstatechange: null };
      Object.defineProperty(Navigator.prototype, 'requestMIDIAccess', { value: async () => access, configurable: true });
      window.__key = (midi, on) => input.onmidimessage?.({ data: new Uint8Array([on ? 0x90 : 0x80, midi, on ? 90 : 0]), timeStamp: performance.now() });
    };
    async function open(url = BASE, viewport = { width: 390, height: 844 }) {
      const ctx = await browser.newContext({ viewport, serviceWorkers: 'block' });
      const page = await ctx.newPage();
      await page.addInitScript(fakeMidi);
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('dialog', (d) => d.accept());
      await page.goto(url); await page.waitForTimeout(1800);
      return { ctx, page, errors };
    }
    const where = (page) => page.evaluate(() => ({ nav: window.__pianoDebug.nav(), ...window.__pianoDebug.shell(), screen: window.__pianoDebug.showing(), url: location.search }));
    const click = async (page, sel) => { await page.evaluate((s) => document.querySelector(s).click(), sel); await page.waitForTimeout(500); };
    const back = async (page) => { await page.evaluate(() => history.back()); await page.waitForTimeout(700); };
    const tap = async (page, m) => { await page.evaluate((m) => window.__key(m, true), m); await page.waitForTimeout(60); await page.evaluate((m) => window.__key(m, false), m); };
    const log = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('piano-web.log.v1') ?? '{"entries":[]}').entries);

    // Opens to Home; tabs at the bottom upright, a rail on the left sideways and on a tablet.
    {
      const box = async (vp) => {
        const { ctx, page, errors } = await open(BASE, vp);
        const r = await page.evaluate(() => { const b = document.getElementById('tabs').getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; });
        const w = await where(page);
        await ctx.close();
        return { r, w, errors };
      };
      const up = await box({ width: 390, height: 844 }), side = await box({ width: 844, height: 390 }), tab = await box({ width: 820, height: 1180 });
      ok('opens to Home (no piece drawn, the tabs showing)', up.w.screen === 'shell' && up.w.view === 'v-home' && up.w.nav.length === 0, JSON.stringify(up.w));
      ok('tabs: at the bottom upright; a rail on the left sideways and on a tablet', up.r.y > 760 && up.r.w > 380 && side.r.x === 0 && side.r.h > 380 && side.r.w < 100 && tab.r.x === 0 && tab.r.w < 100,
        `upright ${JSON.stringify(up.r)}, sideways ${JSON.stringify(side.r)}, tablet ${JSON.stringify(tab.r)}`);
      ok('tabs: no page errors', [...up.errors, ...side.errors, ...tab.errors].length === 0, [...up.errors, ...side.errors, ...tab.errors].join(' | '));
    }

    // Music → a piece → ← back to Music; again with Android Back; Back on Music → Home; a reload on Path stays there.
    {
      const { ctx, page, errors } = await open();
      await click(page, '#tabs [data-tab="music"]'); await page.waitForTimeout(800);
      const music = await where(page);
      await page.locator('.lib-row', { hasText: 'Minuet' }).first().click(); await page.waitForTimeout(1500); // (upright, a row's tap opens it)
      const piece = await where(page);
      const drawn = await page.evaluate(() => window.__pianoDebug.state().steps > 0 && document.getElementById('score').getBoundingClientRect().height > 600);
      await click(page, '#score-back');
      const afterArrow = await where(page);
      await page.locator('.lib-row', { hasText: 'Minuet' }).first().click(); await page.waitForTimeout(1200);
      await back(page);
      const afterBack = await where(page);
      await back(page);
      const home = await where(page);
      ok('Music → a piece (no tabs, the score its full height) → ← back to Music', music.screen === 'library' && piece.screen === 'score' && piece.view === null && piece.url.includes('piece=mozart-k2') && drawn && afterArrow.screen === 'library' && afterArrow.tab === 'music',
        `music ${JSON.stringify(music)}; piece ${JSON.stringify(piece)} drawn ${drawn}; after ← ${JSON.stringify(afterArrow)}`);
      ok('Android Back: the piece back to Music, Music back to Home', afterBack.screen === 'library' && home.view === 'v-home' && home.nav.length === 0 && home.url === '', `${JSON.stringify(afterBack)} then ${JSON.stringify(home)}`);
      await click(page, '#tabs [data-tab="path"]');
      await page.reload(); await page.waitForTimeout(1800);
      const reloaded = await where(page);
      await back(page);
      ok('a reload on Path stays on Path; Back from it is Home', reloaded.view === 'v-path' && reloaded.tab === 'path' && (await where(page)).view === 'v-home', `${JSON.stringify(reloaded)}`);
      ok('Music and Back: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // ?piece= and ?activity= open over Home; Back comes to Home. Practice → Simon → Done back to Practice.
    {
      let { ctx, page, errors } = await open(`${BASE}?piece=chopin-op28-4`);
      const p = await where(page);
      await back(page);
      const h = await where(page);
      ok('?piece= opens the piece over Home; Back is Home', p.screen === 'score' && p.nav.join() === 'score' && h.view === 'v-home' && h.nav.length === 0, `${JSON.stringify(p)} then ${JSON.stringify(h)}`);
      await ctx.close();
      ({ ctx, page, errors } = await open(`${BASE}?activity=chords-simon`));
      await page.waitForTimeout(1500);
      const a = await where(page);
      await click(page, '#ex-done');
      const h2 = await where(page);
      ok('?activity= opens it over Home; Done is Home', a.screen === 'exercise' && h2.view === 'v-home' && h2.nav.length === 0, `${JSON.stringify(a)} then ${JSON.stringify(h2)}`);
      await click(page, '#tabs [data-tab="practice"]');
      await click(page, '[data-practice="Simon"]'); await page.waitForTimeout(1200);
      const s = await where(page);
      await click(page, '#ex-done');
      const pr = await where(page);
      ok('Practice → Simon → Done back to Practice', s.screen === 'exercise' && pr.view === 'v-practice' && pr.tab === 'practice', `${JSON.stringify(s)} then ${JSON.stringify(pr)}`);
      ok('links and Practice: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // A lesson step from Home: its activity opens (the score in Wait for me), played, Back to the lesson page with how it
    // went; the step marked played; Hard tapped and a note typed reach the export with the step, lesson and rung.
    {
      const { ctx, page, errors } = await open();
      await page.mouse.click(200, 20); await page.waitForTimeout(200); // (the first tap starts MIDI: on Home's header, where nothing opens)
      await page.locator('#home-body .today .btn.main').click(); await page.waitForTimeout(2500);
      const at = await where(page);
      for (let k = 0; k < 4; k++) { const keys = await page.evaluate(() => window.__pianoDebug.struck(window.__pianoDebug.state().step, 'right')); for (const m of keys) await tap(page, m); await page.waitForTimeout(400); }
      await click(page, '#score-back'); await page.waitForTimeout(800);
      const res = await where(page);
      const line = await page.evaluate(() => document.querySelector('.les-result .h')?.textContent ?? '');
      const run = (await log(page)).filter((e) => e.screen === 'score').at(-1);
      await page.locator('.fb-b', { hasText: 'Hard' }).click();
      await page.fill('.fb-note', 'test note'); await page.waitForTimeout(200);
      const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('piano-web.path.v1')));
      await click(page, '#lesson-back');
      await click(page, '#home-settings');
      const download = page.waitForEvent('download', { timeout: 8000 });
      await click(page, '#export-log');
      const file = join(tmp, 'log.json');
      await (await download).saveAs(file);
      const exported = JSON.parse(readFileSync(file, 'utf8')).entries;
      const fb = exported.find((e) => e.screen === 'lesson');
      ok('a step from Home opens its activity (the score, tagged with the step) and comes back to the lesson page', at.screen === 'score' && at.nav.join() === 'lesson,score' && res.view === 'v-lesson'
        && run?.activity === 'k2-wait-right' && run?.lesson?.step === 'wait-rh' && run?.lesson?.rung === 'test-app' && /This time: (Played through|Started)/.test(line), `${JSON.stringify(at)}; back ${JSON.stringify(res)}; "${line}"; run ${JSON.stringify(run?.lesson)} ${run?.activity}`);
      // (four of the loop's notes: a start, not a pass round it, so the step is tried; a whole pass is the V10 case below)
      ok('the step is recorded from its logged run (tried, or played through)', !!progress?.tried?.['test-minuet-opening']?.['wait-rh'] || progress?.done?.['test-minuet-opening']?.['wait-rh']?.how === 'played', JSON.stringify(progress));
      ok('feedback after the step reaches the export with the step, lesson and rung', fb?.result?.feedback?.effort === 'hard' && fb.result.feedback.note === 'test note' && fb.lesson?.lesson === 'test-minuet-opening' && fb.lesson.step === 'wait-rh' && fb.lesson.rung === 'test-app',
        JSON.stringify(fb));
      ok('lesson step: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // Steps never lock: step 2 started first (from the lesson page), left unplayed (nothing marked), step 1 then "skipped"
    // only once a later step was played. Free play (keeps no runs) is done on coming back. Switch: skip ahead, Path follows.
    {
      const { ctx, page, errors } = await open(`${BASE}?tab=path&page=lesson&lesson=test-chords-and-band`);
      await page.waitForTimeout(1200);
      await page.locator('.les-step[data-step="free"] .btn').click(); await page.waitForTimeout(800);
      const fp = await where(page);
      await click(page, '#fp-done'); await page.waitForTimeout(500);
      const state = await page.evaluate(() => ({ line: document.querySelector('.les-result .h')?.textContent, done: JSON.parse(localStorage.getItem('piano-web.path.v1')).done }));
      await page.locator('#lesson-bar button[aria-label="Back to the lesson"]').click(); await page.waitForTimeout(800);
      const words = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('.les-step')].map((c) => [c.dataset.step, c.querySelector('.les-step-state').textContent])));
      ok('steps never lock: the last step opened first, visited (and counted) on coming back (Free play keeps no runs); earlier ones show "skipped"', fp.screen === 'freeplay' && state.done?.['test-chords-and-band']?.free?.how === 'opened'
        && /^skipped/.test(words['simon-chords']) && /^visited/.test(words.free), `${JSON.stringify(fp)}; ${JSON.stringify(state)}; ${JSON.stringify(words)}`);
      await click(page, '#lesson-switch');
      const sheet = await page.evaluate(() => [...document.querySelectorAll('#switch-body .li')].map((li) => li.textContent));
      await page.locator('#switch-body .li', { hasText: 'Minuet' }).locator('.btn').click(); await page.waitForTimeout(1200);
      const switched = await where(page);
      await click(page, '#lesson-back');
      const pathCard = await page.evaluate(() => document.querySelector('#path-body .today .h')?.textContent);
      ok('Switch… opens another lesson in the page\'s place, and it becomes the one you are on (Path follows)', switched.view === 'v-lesson' && switched.nav.join() === 'tab,lesson' && /Minuet/.test(pathCard ?? ''),
        `sheet ${JSON.stringify(sheet)}; ${JSON.stringify(switched)}; Path "${pathCard}"`);
      ok('steps and Switch: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // Exercises: one tap opens a set in its kind's way (scales: Drills); Practise as… → Simon (same place); ← to Exercises.
    // The metronome: Start clicks, Done stops and comes back. Settings: the theme. A little score: ▶ plays, keys light.
    {
      const { ctx, page, errors } = await open();
      await click(page, '#tabs [data-tab="practice"]'); await click(page, '[data-practice="Exercises"]'); await page.waitForTimeout(1500);
      await click(page, '[data-exercise="scales-up"]'); await page.waitForTimeout(1500);
      const ex = await page.evaluate(() => ({ kind: document.getElementById('ex-kind').textContent, set: document.getElementById('ex-set').value, nav: window.__pianoDebug.nav() }));
      await click(page, '#ex-kind'); await page.locator('#ex-as-dialog [data-as="simon"]').click(); await page.waitForTimeout(1200);
      const as = await page.evaluate(() => ({ kind: document.getElementById('ex-kind').textContent, set: document.getElementById('ex-set').value, nav: window.__pianoDebug.nav() }));
      await click(page, '#ex-done');
      const backTo = await where(page);
      ok('Exercises: one tap opens it in its default way; Practise as… switches, same set; Done back to Exercises', /Drills/.test(ex.kind) && ex.set === 'scales-up' && /Simon/.test(as.kind) && as.set === 'scales-up' && as.nav.join() === ex.nav.join() && backTo.view === 'v-exercises',
        `${JSON.stringify(ex)} → ${JSON.stringify(as)} → ${JSON.stringify(backTo)}`);
      await back(page);
      await click(page, '[data-practice="Metronome"]');
      await click(page, '#metro-go'); await page.waitForTimeout(1500);
      const m = await page.evaluate(() => window.__pianoDebug.metronome());
      await click(page, '#metro-done');
      const m2 = await page.evaluate(() => ({ ...window.__pianoDebug.metronome(), sound: window.__pianoDebug.sound().playing }));
      ok('Metronome: Start clicks (the app\'s clock runs), Done stops it and comes back to Practice', m.running && m.t > 500 && !m2.running && !m2.sound && (await where(page)).view === 'v-practice', `${JSON.stringify(m)} then ${JSON.stringify(m2)}`);
      await click(page, '#tabs [data-tab="home"]'); await click(page, '#home-settings');
      await click(page, '#v-settings [data-theme-pick="dark"]');
      const theme = await page.evaluate(() => document.documentElement.dataset.theme);
      await click(page, '#v-settings [data-theme-pick="system"]');
      ok('Settings: the theme is app-wide and applies at once', theme === 'dark', `data-theme ${theme}`);
      await page.goto(`${BASE}?page=lesson&lesson=test-minuet-opening`); await page.waitForTimeout(3000);
      await page.mouse.click(200, 120);
      await page.locator('[data-block="score"] .les-play').click();
      let lit = 0, playing = false;
      for (let i = 0; i < 20 && !lit; i++) { await page.waitForTimeout(250); ({ lit, playing } = await page.evaluate(() => ({ lit: document.querySelectorAll('[data-block="score"] .key.now-r').length, playing: window.__pianoDebug.sound().playing }))); }
      ok('a lesson\'s little score: ▶ plays it and its keys light as it goes', playing && lit > 0, `playing ${playing}, keys lit ${lit}`);
      ok('Exercises, metronome, Settings, little score: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // Offline: a lesson's video is a card with its title and link, not a blank box; the rest of the page is there.
    {
      const { ctx, page, errors } = await open(`${BASE}?page=lesson&lesson=test-minuet-opening`);
      await ctx.setOffline(true);
      await page.evaluate(() => window.dispatchEvent(new Event('offline'))); await page.waitForTimeout(500);
      const v = await page.evaluate(() => ({ card: !!document.querySelector('[data-block="video"] .les-video-off'), frame: !!document.querySelector('[data-block="video"] iframe'), steps: document.querySelectorAll('.les-step').length }));
      ok('offline: the video block is a card with its title and link; the steps are there', v.card && !v.frame && v.steps === 2, JSON.stringify(v));
      ok('offline lesson: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
  }

  // ---- The visual review of the new top level (2026-10-15, design/2026-10-15-home/visual-review.md) -------------------
  // Each case was seen failing on the build before its fix (run with --url against it), then passing.
  {
    const fakeMidi = () => {
      const input = { id: 'test-keys', name: 'Test keys', state: 'connected', onmidimessage: null };
      const access = { inputs: new Map([[input.id, input]]), outputs: new Map(), onstatechange: null };
      Object.defineProperty(Navigator.prototype, 'requestMIDIAccess', { value: async () => access, configurable: true });
      window.__key = (midi, on) => input.onmidimessage?.({ data: new Uint8Array([on ? 0x90 : 0x80, midi, on ? 90 : 0]), timeStamp: performance.now() });
    };
    async function open(url = BASE, viewport = { width: 390, height: 844 }, init) {
      const ctx = await browser.newContext({ viewport, serviceWorkers: 'block' });
      const page = await ctx.newPage();
      await page.addInitScript(fakeMidi);
      if (init) await page.addInitScript(init);
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('dialog', (d) => d.accept());
      await page.goto(url); await page.waitForTimeout(1800);
      return { ctx, page, errors };
    }
    const where = (page) => page.evaluate(() => ({ nav: window.__pianoDebug.nav(), ...window.__pianoDebug.shell(), screen: window.__pianoDebug.showing(), url: location.search }));
    const click = async (page, sel) => { await page.evaluate((s) => document.querySelector(s).click(), sel); await page.waitForTimeout(500); };
    const tap = async (page, m) => { await page.evaluate((m) => window.__key(m, true), m); await page.waitForTimeout(60); await page.evaluate((m) => window.__key(m, false), m); };
    const progress = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('piano-web.path.v1') ?? '{}'));
    const resultText = (page) => page.evaluate(() => document.querySelector('.les-result')?.textContent ?? '');
    /** Plays your (right-hand) notes at the marker, n times. */
    async function playOn(page, n) {
      for (let k = 0; k < n; k++) {
        const keys = await page.evaluate(() => window.__pianoDebug.struck(window.__pianoDebug.state().step, 'right'));
        for (const m of keys) await tap(page, m);
        await page.waitForTimeout(350);
      }
    }

    // V10: the Wait for me step (bars 1–4 looped): a whole pass round the loop is "played through" and marks the step
    // done; one note logs a start, not a pass, and the step is only "tried". (Before: a whole pass logged nothing and
    // said "Nothing played"; one note marked the step done.)
    {
      const { ctx, page, errors } = await open();
      await page.mouse.click(200, 20); await page.waitForTimeout(200);
      await page.locator('#home-body .today .btn.main').click(); await page.waitForTimeout(2500);
      const loop = await page.evaluate(() => window.__pianoDebug.state());
      let wrapped = false, last = loop.step;
      for (let k = 0; k < 40 && !wrapped; k++) { await playOn(page, 1); const s = await page.evaluate(() => window.__pianoDebug.state().step); if (s < last) wrapped = true; last = s; }
      await click(page, '#score-back'); await page.waitForTimeout(600);
      const full = { text: await resultText(page), done: (await progress(page)).done?.['test-minuet-opening']?.['wait-rh'] };
      await ctx.close();
      const two = await open();
      await two.page.mouse.click(200, 20); await two.page.waitForTimeout(200);
      await two.page.locator('#home-body .today .btn.main').click(); await two.page.waitForTimeout(2500);
      await playOn(two.page, 1);
      await click(two.page, '#score-back'); await two.page.waitForTimeout(600);
      const one = { text: await resultText(two.page), p: await progress(two.page) };
      ok('V10 Wait for me step: a whole pass round the loop is played through and marks the step done', wrapped && /played through/i.test(full.text) && full.done?.how === 'played', `wrapped ${wrapped}; "${full.text}"; ${JSON.stringify(full.done)}`);
      ok('V10 Wait for me step: one note is a start, not a pass: the step is tried, not done', !one.p.done?.['test-minuet-opening']?.['wait-rh'] && !!one.p.tried?.['test-minuet-opening']?.['wait-rh'] && /not through/i.test(one.text), `"${one.text}"; ${JSON.stringify(one.p)}`);
      ok('V10: no page errors', [...errors, ...two.errors].length === 0, [...errors, ...two.errors].join(' | '));
      await two.ctx.close();
    }

    // V12, V17, V18, V28: after a step: Back goes to the lesson page; the last step says the lesson is done and offers the
    // next lesson; a step with nothing to judge is "visited"; the buttons are in view at 320×568 and sideways.
    for (const vp of [{ width: 320, height: 568 }, { width: 844, height: 390 }]) {
      const { ctx, page, errors } = await open(`${BASE}?page=lesson&lesson=test-chords-and-band`, vp);
      // (steps 1 and 2 done before, so Free play is the last one to do)
      await page.evaluate(() => { localStorage.setItem('piano-web.path.v1', JSON.stringify({ version: 1, current: 'test-chords-and-band', done: { 'test-chords-and-band': { 'simon-chords': { at: new Date().toISOString(), how: 'target' }, 'band-roots': { at: new Date().toISOString(), how: 'target' } } }, tried: {} })); });
      await page.reload(); await page.waitForTimeout(2000);
      await page.locator('.les-step[data-step="free"] .btn').click(); await page.waitForTimeout(800);
      await click(page, '#fp-done'); await page.waitForTimeout(600);
      const text = await resultText(page);
      const inView = await page.evaluate(() => [...document.querySelectorAll('#lesson-bar button:not([hidden])')].filter((b) => { const r = b.getBoundingClientRect(); return r.width > 0 && r.bottom <= innerHeight && r.top >= 0; }).map((b) => b.textContent.trim()));
      const state = (await progress(page)).done?.['test-chords-and-band']?.free;
      await page.evaluate(() => history.back()); await page.waitForTimeout(800);
      const after = await where(page);
      const tag = `${vp.width}×${vp.height}`;
      ok(`V18 ${tag}: a step with nothing to judge is "visited" (and counts), not "done ✓"`, state?.how === 'opened' && /visited/i.test(text) && !/done ✓/.test(text), `"${text}" ${JSON.stringify(state)}`);
      ok(`V17 ${tag}: the lesson's last step says the lesson is done and offers the next lesson`, /lesson done/i.test(text) && inView.some((t) => /Next lesson/.test(t)), `"${text}"; in view ${JSON.stringify(inView)}`);
      ok(`V28 ${tag}: Again and the way on are in view without scrolling`, inView.some((t) => /Again/.test(t)) && inView.some((t) => /Next/.test(t)), JSON.stringify(inView));
      ok(`V12 ${tag}: Back from the result is the lesson page`, after.view === 'v-lesson' && after.nav.join() === 'lesson' && !(await page.evaluate(() => !!document.querySelector('.les-result'))), JSON.stringify(after));
      ok(`after-step ${tag}: no page errors`, errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // V19: Back with the Switch sheet open closes the sheet only (Path stays).
    {
      const { ctx, page, errors } = await open(`${BASE}?tab=path`);
      await page.locator('#path-body .today .btn', { hasText: 'Switch' }).click(); await page.waitForTimeout(500);
      await page.evaluate(() => history.back()); await page.waitForTimeout(700);
      const w = await where(page), sheet = await page.evaluate(() => document.getElementById('switch-sheet').open);
      ok('V19 Back with Switch… open closes the sheet only', !sheet && w.view === 'v-path' && w.tab === 'path', `sheet open ${sheet}; ${JSON.stringify(w)}`);
      // V30: from lesson 2, lesson 1 (behind it, not started) is "Open", not "Skip ahead".
      await page.goto(`${BASE}?page=lesson&lesson=test-chords-and-band`); await page.waitForTimeout(1800);
      await click(page, '#lesson-switch');
      const label = await page.locator('#switch-body .li', { hasText: 'Minuet' }).locator('.btn').textContent();
      ok('V30 Switch: an earlier lesson not started is "Open", not "Skip ahead"', label.trim() === 'Open', `"${label}"`);
      ok('V19/V30: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // V21: a reload inside a lesson's step comes back to the step with its choices (Wait for me, right hand, bars 1–4),
    // and ← still goes to the lesson page; a reload in a tool opened from Practice comes back to it, ← to Practice.
    {
      const { ctx, page, errors } = await open();
      await page.locator('#home-body .today .btn.main').click(); await page.waitForTimeout(2500);
      await page.reload(); await page.waitForTimeout(3000);
      const back = await page.evaluate(() => ({ mode: document.getElementById('q-mode').value, hands: document.querySelector('#q-hands [aria-pressed="true"]')?.dataset.hands, loop: document.getElementById('q-loop').getAttribute('aria-pressed') }));
      const w = await where(page);
      await click(page, '#score-back'); await page.waitForTimeout(500);
      const w2 = await where(page);
      ok('V21 a reload in a lesson step: back in the step with its choices, ← to the lesson page', w.screen === 'score' && back.mode === 'wait' && back.hands === 'right' && back.loop === 'true' && w2.view === 'v-lesson',
        `${JSON.stringify(back)} ${JSON.stringify(w)} → ${JSON.stringify(w2)}`);
      await page.goto(`${BASE}?tab=practice`); await page.waitForTimeout(1500);
      await click(page, '[data-practice="Simon"]'); await page.waitForTimeout(1500);
      await page.reload(); await page.waitForTimeout(3000);
      const s = await where(page);
      await click(page, '#ex-done');
      const s2 = await where(page);
      ok('V21 a reload in Simon (from Practice): back in Simon, ← to Practice', s.screen === 'exercise' && s2.view === 'v-practice', `${JSON.stringify(s)} → ${JSON.stringify(s2)}`);
      ok('V21: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // V27: Carry on opens with the mode and tempo of the run it names (and its loop).
    {
      const seed = () => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('piano-web.log.v1', JSON.stringify({ autoDelete: true, entries: [{ at: new Date(Date.now() - 86400000).toISOString(), seconds: 90, screen: 'score', mode: 'along', piece: 'mozart-k2', title: 'Minuet in F K. 2', settings: { mode: 'along', hands: 'right', bpm: 100, loop: '5-8' }, result: { passes: [{ pass: 1, notes: 10, onTime: 6, clean: false, bpm: 100 }] } }] })); } };
      const { ctx, page, errors } = await open(BASE, undefined, seed);
      await page.locator('#home-body .rc, #home-body .li').first().click(); await page.waitForTimeout(2500);
      const got = await page.evaluate(() => ({ mode: document.getElementById('q-mode').value, bpm: document.getElementById('q-bpm').textContent, loop: document.getElementById('q-loop').getAttribute('aria-pressed') }));
      ok('V27 Carry on: the run\'s mode, tempo and loop', got.mode === 'along' && /100/.test(got.bpm) && got.loop === 'true', JSON.stringify(got));
      ok('V27: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // V11: a video that cannot load while online (YouTube blocked) is the title-and-link card, not a black box.
    {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
      await ctx.route((url) => !url.hostname.includes('localhost'), (r) => r.abort());
      const page = await ctx.newPage();
      const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
      await page.goto(`${BASE}?page=lesson&lesson=test-minuet-opening`); await page.waitForTimeout(12000);
      const v = await page.evaluate(() => ({ online: navigator.onLine, card: !!document.querySelector('[data-block="video"] .les-video-off'), frame: !!document.querySelector('[data-block="video"] iframe') }));
      ok('V11 a video that cannot load while online: the card with its title and link', v.online && v.card && !v.frame, JSON.stringify(v));
      ok('V11: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // Owner, 2026-10-15: an exercise that is MusicXML opens straight on the score; tools have ← top left.
    {
      const { ctx, page, errors } = await open(`${BASE}?tab=practice&page=exercises`);
      await page.waitForTimeout(1500);
      const row = page.locator('#exercises-body .li', { hasText: 'Melody 1' }).first();
      const has = await row.count();
      if (has) { await row.click(); await page.waitForTimeout(2500); }
      const w = await where(page);
      ok('owner: a MusicXML exercise (Melody 1) opens straight on the score', has && w.screen === 'score' && w.nav.at(-1) === 'score', `row ${has}; ${JSON.stringify(w)}`);
      const tools = [];
      for (const [name, sel] of [['Simon', '#ex-done'], ['Accompaniment lab', '#lab-done'], ['Free play', '#fp-done'], ['Metronome', '#metro-done']]) {
        await page.goto(`${BASE}?tab=practice`); await page.waitForTimeout(1300);
        await click(page, `[data-practice="${name}"]`); await page.waitForTimeout(1200);
        tools.push(await page.evaluate((s) => { const b = document.querySelector(s), r = b.getBoundingClientRect(); return { s, text: b.textContent.trim(), left: r.left < 60, first: b.parentElement.firstElementChild === b }; }, sel));
      }
      ok('owner: every tool\'s way out is ← at the top left', tools.every((t) => t.text === '←' && t.left && t.first), JSON.stringify(tools));
      ok('owner answers: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
  }

  // ---- The re-check of the fix round (2026-10-15, visual-review.md "Re-check"): V31, V32, V33 -------------------------
  // Each case failed on the build before its fix (run with --url), then passed.
  {
    const fakeMidi = () => {
      const input = { id: 'test-keys', name: 'Test keys', state: 'connected', onmidimessage: null };
      const access = { inputs: new Map([[input.id, input]]), outputs: new Map(), onstatechange: null };
      Object.defineProperty(Navigator.prototype, 'requestMIDIAccess', { value: async () => access, configurable: true });
      window.__key = (midi, on) => input.onmidimessage?.({ data: new Uint8Array([on ? 0x90 : 0x80, midi, on ? 90 : 0]), timeStamp: performance.now() });
    };
    async function open(url = BASE, viewport = { width: 390, height: 844 }) {
      const ctx = await browser.newContext({ viewport, serviceWorkers: 'block' });
      const page = await ctx.newPage();
      await page.addInitScript(fakeMidi);
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('dialog', (d) => d.accept());
      await page.goto(url); await page.waitForTimeout(1800);
      return { ctx, page, errors };
    }
    const where = (page) => page.evaluate(() => ({ nav: window.__pianoDebug.nav(), ...window.__pianoDebug.shell(), screen: window.__pianoDebug.showing(), url: location.search }));
    const click = async (page, sel) => { await page.evaluate((s) => document.querySelector(s).click(), sel); await page.waitForTimeout(500); };
    const choices = (page) => page.evaluate(() => ({ mode: document.getElementById('q-mode').value, hands: document.querySelector('#q-hands [aria-pressed="true"]')?.dataset.hands, loop: document.getElementById('q-loop').getAttribute('aria-pressed') }));

    // V33: every way into a lesson step gives the address and state Start ▶ gives: the lesson page's Start, Home's Start,
    // the result's Again and Next, Next lesson then Start. After each, a reload is the step again (Wait for me, right hand,
    // looped, for step 1) and ← is the lesson page.
    {
      const { ctx, page, errors } = await open();
      const got = {};
      const reloadCheck = async (name) => {
        await page.reload(); await page.waitForTimeout(3000);
        await page.mouse.click(200, 400); await page.waitForTimeout(300); // (the first tap: V31)
        const w = await where(page);
        const c = w.screen === 'score' ? await choices(page) : null;
        await page.evaluate(() => history.back()); await page.waitForTimeout(800);
        const b = await where(page);
        got[name] = { url: w.url, screen: w.screen, c, back: b.view };
        return w;
      };
      // the lesson page's Start (step 1)
      await page.goto(`${BASE}?page=lesson&lesson=test-minuet-opening`); await page.waitForTimeout(2000);
      await page.locator('.les-step[data-step="wait-rh"] .btn').click(); await page.waitForTimeout(2500);
      await reloadCheck('lesson page Start');
      // Home's Start
      await page.goto(BASE); await page.waitForTimeout(2000);
      await page.locator('#home-body .today .btn.main').click(); await page.waitForTimeout(2500);
      await reloadCheck('Home Start');
      // the result's Again (after leaving step 1 with nothing played)
      await page.goto(`${BASE}?page=lesson&lesson=test-minuet-opening`); await page.waitForTimeout(2000);
      await page.locator('.les-step[data-step="wait-rh"] .btn').click(); await page.waitForTimeout(2500);
      await click(page, '#score-back'); await page.waitForTimeout(600);
      await page.locator('#lesson-bar button', { hasText: 'Again' }).click(); await page.waitForTimeout(2500);
      await reloadCheck('result Again');
      // the result's Next (step 1's result → step 2)
      await page.goto(`${BASE}?page=lesson&lesson=test-minuet-opening`); await page.waitForTimeout(2000);
      await page.locator('.les-step[data-step="wait-rh"] .btn').click(); await page.waitForTimeout(2500);
      await click(page, '#score-back'); await page.waitForTimeout(600);
      await page.locator('#lesson-bar button', { hasText: 'Next' }).click(); await page.waitForTimeout(2500);
      await reloadCheck('result Next');
      // Next lesson (lesson 1 all done but its last step), then that lesson's Start
      await page.evaluate(() => localStorage.setItem('piano-web.path.v1', JSON.stringify({ version: 1, current: 'test-chords-and-band', done: { 'test-chords-and-band': { 'simon-chords': { at: new Date().toISOString(), how: 'target' }, 'band-roots': { at: new Date().toISOString(), how: 'target' } } }, tried: {} })));
      await page.goto(`${BASE}?page=lesson&lesson=test-chords-and-band`); await page.waitForTimeout(2000);
      await page.locator('.les-step[data-step="free"] .btn').click(); await page.waitForTimeout(800);
      await click(page, '#fp-done'); await page.waitForTimeout(600);
      await page.locator('#lesson-bar button', { hasText: 'Next lesson' }).click(); await page.waitForTimeout(2000);
      await page.locator('.les-step[data-step="wait-rh"] .btn').click(); await page.waitForTimeout(2500);
      await reloadCheck('Next lesson, then Start');
      const step1 = (g) => g && /page=lesson/.test(g.url) && /lesson=test-minuet-opening/.test(g.url) && /step=wait-rh/.test(g.url) && g.screen === 'score' && g.c?.mode === 'wait' && g.c?.hands === 'right' && g.c?.loop === 'true' && g.back === 'v-lesson';
      for (const name of ['lesson page Start', 'Home Start', 'result Again', 'Next lesson, then Start']) ok(`V33 ${name}: a reload is the step with its choices, ← the lesson page`, step1(got[name]), JSON.stringify(got[name]));
      const n = got['result Next'];
      ok('V33 result Next: a reload is step 2 (the melody cards), ← the lesson page', n && /page=lesson/.test(n.url) && /step=melody-cards/.test(n.url) && n.screen === 'exercise' && n.back === 'v-lesson', JSON.stringify(n));
      ok('V33: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // V31: opened straight into a step (a reload, a link) the keys wait for a first tap (the browser starts the sound and
    // the MIDI keyboard only after one): until then the screen says to tap to start, and keys play nothing; after the tap
    // the words go and your keys move the marker.
    {
      const { ctx, page, errors } = await open(`${BASE}?page=lesson&lesson=test-minuet-opening&piece=mozart-k2&step=wait-rh`);
      await page.waitForTimeout(1500);
      const tapWords = () => page.evaluate(() => { const t = document.getElementById('tap-to-start'); return t && !t.hidden ? t.textContent : ''; });
      const before = await tapWords();
      const s0 = await page.evaluate(() => window.__pianoDebug.state().step);
      const play = async () => { const keys = await page.evaluate(() => window.__pianoDebug.struck(window.__pianoDebug.state().step, 'right')); for (const m of keys) { await page.evaluate((m) => window.__key(m, true), m); await page.waitForTimeout(60); await page.evaluate((m) => window.__key(m, false), m); } await page.waitForTimeout(400); };
      await play();
      const s1 = await page.evaluate(() => window.__pianoDebug.state().step);
      await page.mouse.click(200, 400); await page.waitForTimeout(500);
      const after = await tapWords();
      await play();
      const s2 = await page.evaluate(() => window.__pianoDebug.state().step);
      ok('V31 before the first tap: the screen says to tap to start (and keys play nothing)', /tap/i.test(before) && s1 === s0, `"${before}"; marker ${s0} → ${s1}`);
      ok('V31 after the tap: the words go and your keys move the marker', !after && s2 > s1, `"${after}"; marker ${s1} → ${s2}`);
      ok('V31: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // V32: a MusicXML exercise opens where you play: Wait for me (its set's default unless it names another), and its
    // row says so.
    {
      const { ctx, page, errors } = await open(`${BASE}?tab=practice&page=exercises`);
      await page.waitForTimeout(1500);
      const row = page.locator('#exercises-body .li', { hasText: 'Melody 1' }).first();
      const words = await row.textContent();
      await row.click(); await page.waitForTimeout(2500);
      const c = await choices(page);
      ok('V32 a MusicXML exercise opens in Wait for me, and its row says so', c.mode === 'wait' && /Wait for me/.test(words) && /opens on the score in Wait for me/.test(words), `"${words}"; ${JSON.stringify(c)}`);
      ok('V32: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
  }

  // Wait for me on the keys under the music, on a phone with no MIDI (owner, 2026-10-15: tapping the lit key did
  // nothing). No MIDI permission, as a phone that has none or was never asked; taps go by position (the mouse at the
  // key's place), so whatever lies on top of the keys gets them, as a finger's would. Right hand: the first tap on the
  // lit key, with the bottom bar still showing, starts the run and moves the marker on, and the reason is said.
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(`${BASE}?piece=mozart-k2`);
    await page.waitForFunction(() => window.__pianoDebug?.state().steps > 0, null, { timeout: 30000 });
    await page.mouse.click(195, 300); await page.waitForTimeout(400); // the first tap (Tap anywhere to start)
    await page.selectOption('#q-mode', 'wait'); await page.waitForTimeout(400);
    await page.evaluate(() => [...document.querySelectorAll('#bottom-bar button')].find((b) => b.textContent.trim() === 'R').click());
    await page.waitForTimeout(600);
    const key = await page.evaluate(() => {
      const k = document.querySelector('#keyboard .key.now-r'); if (!k) return null;
      const r = k.getBoundingClientRect(), x = r.left + r.width / 2, y = r.bottom - 6;
      const top = document.elementFromPoint(x, y);
      return { midi: k.dataset.midi, x, y, barShowing: !document.getElementById('bottom-bar').classList.contains('faded'), onTop: top === k || k.contains(top) ? 'the key' : `${top?.tagName}#${top?.id}.${top?.className}` };
    });
    ok('Wait for me, keys under the music: with the bottom bar showing, the lit key is on top where a finger taps', !!key && key.barShowing && key.onTop === 'the key', JSON.stringify(key));
    if (key) { await page.mouse.click(key.x, key.y); await page.waitForTimeout(1200); }
    const after = await page.evaluate(() => ({ step: window.__pianoDebug.state().step, message: document.querySelector('.message:not([hidden])')?.textContent ?? '' }));
    ok('Wait for me with no MIDI allowed: tapping the lit key starts the run and moves the marker on, and says to play on the keys', after.step > 0 && /play on the keys below/.test(after.message), JSON.stringify(after));
    ok('Wait for me on the keys: no page errors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  // Both hands on the keys (owner, 2026-10-15: K. 2 begins with F3 and F5 together, and the keys showed C3–C5, so F5
  // could not be tapped): every key wanted now is on the keys, and the two pressed together (two fingers, each sent to
  // whatever lies at its place) move the marker on.
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(`${BASE}?piece=mozart-k2`);
    await page.waitForFunction(() => window.__pianoDebug?.state().steps > 0, null, { timeout: 30000 });
    await page.mouse.click(195, 300); await page.waitForTimeout(400);
    await page.selectOption('#q-mode', 'wait'); await page.waitForTimeout(400);
    await page.evaluate(() => [...document.querySelectorAll('#bottom-bar button')].find((b) => b.textContent.trim() === 'Both').click());
    await page.waitForTimeout(600);
    const wanted = await page.evaluate(() => ({ shown: window.__pianoDebug.keysShown(), lit: [...document.querySelectorAll('#keyboard .now-l, #keyboard .now-r')].map((k) => Number(k.dataset.midi)) }));
    ok('Wait for me, Both: F3 and F5 (wanted at the start) are both on the keys and lit', [53, 77].every((m) => wanted.shown.includes(m) && wanted.lit.includes(m)), `shown ${Math.min(...wanted.shown)}–${Math.max(...wanted.shown)}, lit ${wanted.lit}`);
    const press = (type) => page.evaluate((type) => {
      for (const [m, id] of [[53, 11], [77, 12]]) {
        const k = document.querySelector(`#keyboard [data-midi="${m}"]`); if (!k) continue;
        const r = k.getBoundingClientRect(), x = r.left + r.width / 2, y = r.bottom - 6;
        document.elementFromPoint(x, y)?.dispatchEvent(new PointerEvent(type, { pointerId: id, bubbles: true, clientX: x, clientY: y, pointerType: 'touch' }));
      }
    }, type);
    await press('pointerdown'); await page.waitForTimeout(1500); await press('pointerup'); await page.waitForTimeout(400);
    const step = await page.evaluate(() => window.__pianoDebug.state().step);
    ok('Wait for me, Both, on the keys: F3 and F5 pressed together move the marker on', step > 0, `step ${step}`);
    // During the run the keys follow the music (two octaves on a phone upright): at every step of bars 1–8, every
    // key wanted now is on the keys.
    const missing = [];
    for (let i = 0; i < 24; i++) {
      const at = await page.evaluate(() => { const shown = window.__pianoDebug.keysShown(); const lit = [...document.querySelectorAll('#keyboard .now-l, #keyboard .now-r')].map((k) => Number(k.dataset.midi)); return { step: window.__pianoDebug.state().step, shown: `${Math.min(...shown)}–${Math.max(...shown)}`, n: shown.length, lit, want: window.__pianoDebug.struck ? window.__pianoDebug.struck(window.__pianoDebug.state().step) : [] }; });
      const off = at.want.filter((m) => !at.lit.includes(m));
      if (off.length) missing.push(`step ${at.step}: ${off} not on ${at.shown}`);
      await page.evaluate(() => window.__pianoDebug.goTo(window.__pianoDebug.state().step + 1)); await page.waitForTimeout(150);
    }
    ok('Wait for me, Both, during a run: every note wanted now is on the keys (24 steps of K. 2)', missing.length === 0, missing.slice(0, 4).join('; '));
    ok('Wait for me, Both, on the keys: no page errors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  // Offline only for the installed app (owner, 2026-10-15: a visitor in a browser tab downloads nothing extra). With
  // the service worker allowed: a tab starts no save (no message, no catalogue file kept, no saved mark, Settings says
  // to install); the same page run as the installed app (window.__pianoInstalled) starts saving.
  {
    const visit = async (asApp) => {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await ctx.newPage();
      if (asApp) await page.addInitScript(() => { window.__pianoInstalled = true; });
      const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
      await page.goto(BASE);
      let saving = false;
      for (let i = 0; i < 16 && !saving; i++) { await page.waitForTimeout(500); saving = await page.evaluate(() => /Saving the app for offline|Saved for offline/.test(document.body.innerText)); }
      const kept = await page.evaluate(async () => { const c = await caches.open('piano-web-v1'); return (await c.keys()).filter((r) => r.url.includes('/catalogue/')).length; });
      const mark = await page.evaluate(() => localStorage.getItem('piano-web.offline.v1'));
      await page.evaluate(() => document.getElementById('home-settings').click()); await page.waitForTimeout(300);
      const said = await page.evaluate(() => document.getElementById('set-offline').textContent);
      await ctx.close();
      return { saving, kept, mark, said, errors };
    };
    const tab = await visit(false);
    ok('offline: a browser tab starts no save (no message, no catalogue file kept, no saved mark)', !tab.saving && tab.kept === 0 && !tab.mark, JSON.stringify({ ...tab, said: undefined }));
    ok('offline: in a tab, Settings says to install the app to use it offline', /Install the app/.test(tab.said), tab.said);
    const app = await visit(true);
    ok('offline: the installed app starts saving', app.saving, JSON.stringify({ ...app, said: undefined }));
    ok('offline (tab and app): no page errors', !tab.errors.length && !app.errors.length, [...tab.errors, ...app.errors].join(' | '));
  }

  // A lesson or activity naming a catalogue piece (owner, 2026-10-15): the test lesson's step names "u-de5f6a78874c" (Mary
  // Had A Little Lamb in the catalogue). With fresh storage, Start adds it to your library as + Add does (record,
  // provenance) and opens it; online and offline (the catalogue saved for offline, the network then cut); two Starts at
  // once add it once (the file held back 2 s, so both are under way together) and the step still gets its result; the
  // piece is listed in Music afterwards, and deleted there, the next Start adds it again. A score block naming it adds it
  // too. A u- id in neither the library nor the catalogue, and a catalogue file that can't be had, are said, open
  // nothing and mark nothing.
  {
    const CAT = 'u-de5f6a78874c', LESSON = `${BASE}?page=lesson&lesson=test-catalogue-piece`;
    async function openCat(url, { sw = false, init } = {}) {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: sw ? 'allow' : 'block' });
      const page = await ctx.newPage();
      if (init) await init(page);
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('dialog', (d) => d.accept());
      if (url) { await page.goto(url); await page.waitForTimeout(1800); }
      return { ctx, page, errors };
    }
    // The library's records and stored files for the piece, read from its own database.
    const stored = (page) => page.evaluate((id) => new Promise((resolve) => {
      const r = indexedDB.open('piano-library');
      r.onsuccess = () => {
        const t = r.result.transaction(['items', 'files']);
        const items = t.objectStore('items').getAll(), files = t.objectStore('files').getAllKeys();
        t.oncomplete = () => { const rec = items.result.filter((x) => x.id === id); resolve({ records: rec.length, own: rec[0]?.own ? { origin: rec[0].own.origin, title: rec[0].own.title, source: rec[0].own.source, licence: rec[0].own.licence } : null, files: files.result.filter((k) => k === id).length }); r.result.close(); };
      };
      r.onerror = () => resolve({ records: -1 });
    }), CAT);
    const state = (page) => page.evaluate((id) => ({ screen: window.__pianoDebug.showing(), nav: window.__pianoDebug.nav().join(), url: location.search, pieces: window.__pianoDebug.pieces().filter((p) => p.id === id).length,
      notes: window.__pianoDebug.showing() === 'score' ? window.__pianoDebug.notes() : 0, message: document.getElementById('message').hidden ? '' : document.getElementById('message').textContent,
      what: document.querySelector('.les-step[data-step="catalogue-piece"] .les-step-what')?.textContent ?? '' }), CAT);
    const progress = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('piano-web.path.v1') ?? '{}'));
    // (clicked in the page, so a button missing on the build before the change is a failed case, not a stopped run)
    const domClick = (page, sel, text = '') => page.evaluate(([s, t]) => { const e = [...document.querySelectorAll(s)].find((x) => x.textContent.includes(t)); e?.click(); return !!e; }, [sel, text]);
    const startStep = (page) => domClick(page, '.les-step[data-step="catalogue-piece"] .btn');
    const opened = (s) => s.screen === 'score' && s.nav === 'lesson,score' && s.url.includes(`piece=${CAT}`) && s.url.includes('step=catalogue-piece') && s.pieces === 1 && s.notes > 0;

    // Online, fresh storage.
    {
      const { ctx, page, errors } = await openCat(LESSON);
      const before = { ...(await state(page)), db: await stored(page) };
      await startStep(page); await page.waitForTimeout(3000);
      const after = { ...(await state(page)), db: await stored(page) };
      ok('catalogue step, online: before Start the piece is not in the library, and the step names it by its title', before.pieces === 0 && before.db.records === 0 && /Mary Had A Little Lamb/.test(before.what), JSON.stringify(before));
      ok('catalogue step, online: Start adds it as + Add does (one record, its file, origin catalogue, PDMX source, CC0) and opens it on the score, tagged with the step', opened(after)
        && after.db.records === 1 && after.db.files === 1 && after.db.own?.origin === 'catalogue' && after.db.own.title === 'Mary Had A Little Lamb' && after.db.own.source === 'PDMX (an upload to MuseScore)' && after.db.own.licence === 'CC0',
        JSON.stringify(after));
      ok('catalogue step, online: one line says it was added to your library', /Added “Mary Had A Little Lamb” to your library/.test(after.message), `"${after.message}"`);
      // Listed in Music afterwards (Yours).
      await domClick(page, '#score-back'); await page.waitForTimeout(800);
      await page.goto(`${BASE}?tab=music`); await page.waitForTimeout(2000);
      const rows = await page.locator('.lib-row', { hasText: 'Mary Had A Little Lamb' }).count();
      ok('catalogue step: the piece is listed in Music (Yours) afterwards', rows === 1, `${rows} rows`);
      // Deleted in Music, a later Start adds it again, fresh.
      await domClick(page, '.lib-more[aria-label="About Mary Had A Little Lamb"]'); await page.waitForTimeout(800);
      await domClick(page, '#lib-page button.danger', 'Delete'); await page.waitForTimeout(1500);
      const gone = await stored(page);
      await page.goto(LESSON); await page.waitForTimeout(1800);
      await startStep(page); await page.waitForTimeout(3000);
      const again = { ...(await state(page)), db: await stored(page) };
      ok('catalogue step: deleted in Music, the next Start adds it again', gone.records === 0 && opened(again) && again.db.records === 1, `after delete ${JSON.stringify(gone)}; again ${JSON.stringify(again)}`);
      ok('catalogue step, online: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // Two Starts at once: the file held back 2 s, so the second Start comes while the first is adding.
    {
      let fetched = 0;
      // (saving for offline is stopped here, at the list of piano samples, so the only fetch of the file is an add's)
      const { ctx, page, errors } = await openCat(LESSON, { init: async (p) => {
        await p.route('**/samples/files.json', (route) => route.abort('failed'));
        await p.route('**/catalogue/de5f6a78874c.mxl', async (route) => { fetched++; await new Promise((r) => setTimeout(r, 2000)); await route.continue(); });
      } });
      await startStep(page); await page.waitForTimeout(150); await startStep(page);
      await page.waitForTimeout(4500);
      const s = { ...(await state(page)), db: await stored(page) };
      ok('catalogue step, two Starts at once: the file fetched once, one library record, one piece, one screen open, "added" said once', fetched === 1 && s.db.records === 1 && s.db.files === 1 && opened(s)
        && (s.message.match(/Added “/g) ?? []).length === 1, `fetched ${fetched}; ${JSON.stringify(s)}`);
      await domClick(page, '#score-back'); await page.waitForTimeout(1000);
      const res = await page.evaluate(() => ({ view: window.__pianoDebug.shell().view, result: document.querySelector('.les-result .h')?.textContent ?? '' }));
      ok('catalogue step, two Starts at once: ← comes back to the step\'s result (the step was not lost)', res.view === 'v-lesson' && /This time/.test(res.result), JSON.stringify(res));
      ok('catalogue step, two Starts: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // Offline: the app saved for offline first (with the catalogue), then the network cut, then the lesson's step.
    {
      // (main saves for offline only in the installed app, owner 2026-10-15: checks mark the page as installed with this
      // flag; the base this was written on ignores it)
      const { ctx, page, errors } = await openCat(BASE, { sw: true, init: (p) => p.addInitScript(() => { window.__pianoInstalled = true; }) });
      let saved = false;
      for (let i = 0; i < 240 && !saved; i++) { await page.waitForTimeout(500); saved = await page.evaluate(() => !!localStorage.getItem('piano-web.offline.v1')); }
      const db0 = await stored(page);
      await ctx.setOffline(true);
      await page.goto(LESSON); await page.waitForTimeout(2500);
      await startStep(page); await page.waitForTimeout(3500);
      const s = { ...(await state(page)), db: await stored(page), online: await page.evaluate(() => navigator.onLine) };
      ok('catalogue step, offline: saved for offline, then with the network cut Start adds the piece and opens it', saved && !s.online && db0.records === 0 && opened(s) && s.db.records === 1 && s.db.own?.origin === 'catalogue', `saved ${saved}; ${JSON.stringify(s)}`);
      ok('catalogue step, offline: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // A score block naming the catalogue piece (the lesson swapped in): drawn, and the piece added.
    {
      const lesson = JSON.parse(readFileSync(here('../public/content/path/lessons/test-catalogue-piece.json'), 'utf8'));
      lesson.blocks = [{ kind: 'score', piece: CAT, bars: '1-2', caption: 'Test' }];
      const { ctx, page, errors } = await openCat(LESSON, { init: (p) => p.route('**/content/path/lessons/test-catalogue-piece.json', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(lesson) })) });
      await page.waitForTimeout(2500);
      const s = await page.evaluate(() => ({ drawn: document.querySelectorAll('[data-block="score"] svg').length, bad: document.querySelector('[data-block="score"] .les-bad')?.textContent ?? '', play: !document.querySelector('[data-block="score"] .les-play')?.disabled }));
      const db = await stored(page);
      ok('catalogue score block: the piece is added and its bars drawn, ▶ ready', s.drawn > 0 && !s.bad && s.play && db.records === 1 && db.own?.origin === 'catalogue', `${JSON.stringify(s)}; ${JSON.stringify(db)}`);
      ok('catalogue score block: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // Missing: a u- id in neither the library nor the catalogue; the catalogue's file unreachable. Said; nothing opened or marked.
    {
      const lesson = JSON.parse(readFileSync(here('../public/content/path/lessons/test-catalogue-piece.json'), 'utf8'));
      lesson.blocks[1].activity.piece = 'u-000000000000';
      let { ctx, page, errors } = await openCat(LESSON, { init: (p) => p.route('**/content/path/lessons/test-catalogue-piece.json', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify(lesson) })) });
      await startStep(page); await page.waitForTimeout(2000);
      let s = await state(page), p = await progress(page);
      ok('catalogue step, unknown u- id: "there is no piece" said, the lesson page stays, the step marks nothing', /there is no piece "u-000000000000"/.test(s.message) && s.screen === 'shell' && s.nav === 'lesson'
        && !p.done?.['test-catalogue-piece'] && !p.tried?.['test-catalogue-piece'], `${JSON.stringify(s)}; ${JSON.stringify(p)}`);
      ok('catalogue step, unknown id: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
      // (saving for offline stopped at its list, as above: its own failure to save that file would be said over this)
      ({ ctx, page, errors } = await openCat(LESSON, { init: async (p) => {
        await p.route('**/samples/files.json', (route) => route.abort('failed'));
        await p.route('**/catalogue/de5f6a78874c.mxl', (route) => route.abort('internetdisconnected'));
      } }));
      await startStep(page); await page.waitForTimeout(2500);
      s = { ...(await state(page)), db: await stored(page) }; p = await progress(page);
      ok('catalogue step, its file unreachable: said ("could not be added"), nothing added or opened, the step marks nothing', /could not be added/.test(s.message) && s.screen === 'shell' && s.nav === 'lesson' && s.db.records === 0 && s.pieces === 0
        && !p.done?.['test-catalogue-piece'] && !p.tried?.['test-catalogue-piece'], `${JSON.stringify(s)}; ${JSON.stringify(p)}`);
      ok('catalogue step, file unreachable: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
  }
} finally {
  await browser?.close();
  stop();
}
const failed = results.filter((r) => !r).length;
console.log(failed ? `${failed} failed` : `all ${results.length} passed`);
process.exit(failed ? 1 : 0);
