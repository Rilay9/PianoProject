// Browser checks of the races and recoveries ChatGPT's review of 2026-10-14 found (docs/review-2026-10-14.md), run in
// the built app at phone size. Each makes its race happen on purpose (a download slowed, a file's bytes held back, a
// storage that fails to open) and was seen to fail on the build before the fixes.
//
// usage: npm run check:browser              (builds, serves on :5194, runs every case)
//        node tests/browser.mjs --url http://localhost:5196/PianoProject/   (a build served elsewhere: no build, no server)
//        node tests/browser.mjs --only rhythm   (one section: rhythm sets in Drills; also lessons, consistency)
// PIANO_CHROMIUM names a Chromium when Playwright's own build is not installed (a cloud session: /opt/pw-browsers/chromium).
// Not here: the library store's lost update (F03; shown with the store module through the dev server, 0 of 10 before,
// 10 of 10 after) and the PDF Adjust stale draw (F04; no way found to force it).

import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const urlAt = process.argv.indexOf('--url');
// --only rhythm: just that section (2026-10-16); the others run when no --only is given.
const onlyAt = process.argv.indexOf('--only');
const only = onlyAt > 0 ? process.argv[onlyAt + 1] : null;
const PORT = Number(process.env.PIANO_PORT) || 5194; // (PIANO_PORT: another port, for a second worktree running at the same time)
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
  // Test rungs ("test": true in content/path/index.json) are hidden from the learner (2026-10-16); every context made here
  // sees them as before (window.__pianoTestContent, set before the app starts). learnerContext: a context without it.
  const learnerContext = browser.newContext.bind(browser);
  // The one-time offer to set up a keyboard's ends (2026-10-16) is put away there too (it would sit over the top of every
  // screen a stand-in keyboard is connected to); `--only consistency` checks it in a learner's context.
  browser.newContext = async (options) => { const ctx = await learnerContext(options); await ctx.addInitScript(() => { window.__pianoTestContent = true; window.__pianoNoKeyboardHint = true; }); return ctx; };

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

  // ---- Rhythm sets in Drills (owner, 2026-10-16): the pad, the one-line staff, tapping in time ------------------------
  // A plain phone tab (touch, no MIDI permission), taps by position: pointer events sent to what lies at the pad's centre
  // (document.elementFromPoint), timed in the page from the app's own schedule (debug: the card's steps, the clock now and
  // the delay it takes off for what is heard), each held most of its length. `--only rhythm` runs this section alone.
  // RHYTHM_SHOTS names a folder for the screenshots (none taken without it).
  if (!only || only === 'rhythm') {
    const SHOTS = process.env.RHYTHM_SHOTS;
    const shot = async (page, name) => { if (SHOTS) await page.screenshot({ path: join(SHOTS, `${name}.png`) }); };
    const RH_ACTS = {
      'check-rh-read': { title: 'Check: read and tap', screen: 'drills', set: 'rhythm-quarter-half', level: { rung: 3, start: 'clicks', metronome: true, onTime: 'normal', cards: 1 } },
      'check-rh-echo': { title: 'Check: hear it, pad lit', screen: 'drills', set: 'rhythm-steady-beat', level: { rung: 0, start: 'clicks', metronome: true, onTime: 'normal', cards: 1 } },
      'check-rh-first': { title: 'Check: the first tap', screen: 'drills', set: 'rhythm-quarter-half', level: { rung: 3, start: 'first', metronome: false, onTime: 'normal', cards: 2 } },
      'check-rh-keys': { title: 'Check: a set of notes', screen: 'drills', set: 'five-notes-c', level: { rung: 3, start: 'first', onTime: 'notes', cards: 1 } },
    };
    async function rhTab(viewport, init) {
      const ctx = await browser.newContext({ viewport, hasTouch: true, serviceWorkers: 'block' });
      await ctx.route(/\/content\/activities\/check-rh-[a-z]+\.json$/, (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify(RH_ACTS[r.request().url().match(/(check-rh-[a-z]+)\.json$/)[1]]) }));
      const page = await ctx.newPage();
      if (init) await page.addInitScript(init);
      const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
      return { ctx, page, errors };
    }
    const startTap = async (page) => { if (await page.evaluate(() => !document.getElementById('tap-to-start')?.hidden)) { await page.touchscreen.tap(Math.round(page.viewportSize().width / 2), 60); await page.waitForTimeout(300); } };
    const centre = (page, id) => page.evaluate((id) => { const r = document.getElementById(id).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, id);
    const padBox = (page) => page.evaluate(() => {
      const p = document.getElementById('ex-pad'), r = p.getBoundingClientRect(), k = document.getElementById('ex-keyboard').getBoundingClientRect();
      const at = (x, y) => document.elementFromPoint(x, y)?.closest('#ex-pad') === p;
      const pts = [[0.5, 0.5], [0.1, 0.2], [0.9, 0.8], [0.5, 0.95]].map(([fx, fy]) => at(r.left + fx * r.width, r.top + fy * r.height));
      return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), bottom: Math.round(r.bottom), shown: !p.hidden && r.height > 0, onTop: pts.every(Boolean), keys: Math.round(k.height), vw: innerWidth, vh: innerHeight };
    });
    /** Taps the card in the page by position at the app's own times (+ shift ms on one note), each held 90% of its room. */
    const tapCard = (page, shiftIndex = -1, shiftMs = 0, after = null) => page.evaluate(async ({ shiftIndex, shiftMs, after }) => {
      const D = window.__pianoDebug;
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      let d = null;
      const r = document.getElementById('ex-pad').getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      // Music only, counted in: the card waits to be read (owner, 2026-10-16); still waiting after 1.2 s, a tap counts it in.
      let readWaited = null;
      for (let i = 0; i < 1500; i++) {
        d = D.drill();
        if (d.state === 'read' && readWaited === null) {
          await sleep(1200); readWaited = D.drill().state === 'read';
          for (const type of ['pointerdown', 'pointerup']) document.elementFromPoint(x, y).dispatchEvent(new PointerEvent(type, { pointerId: 19, bubbles: true, cancelable: true, clientX: x, clientY: y, pointerType: 'touch', isPrimary: true }));
          continue;
        }
        if ((d.state === 'countin' && d.now < -300) || (d.state === 'turn' && !d.started)) break;
        await sleep(10);
      }
      if (!(d.state === 'countin' || d.state === 'turn')) return { error: `never your turn: ${d.state}` };
      const zero = performance.now() - d.now; // performance.now() when the card's clock reads 0
      const fire = (type, id) => { const el = document.elementFromPoint(x, y); el.dispatchEvent(new PointerEvent(type, { pointerId: id, bubbles: true, cancelable: true, clientX: x, clientY: y, pointerType: 'touch', isPrimary: true })); return el.closest('#ex-pad') ? 'pad' : el.id || el.tagName; };
      const hit = [], sounded = [];
      await Promise.all(d.steps.map((s, i) => new Promise((done) => {
        const at = zero + s.t + (after ?? d.heardDelay) + (i === shiftIndex ? shiftMs : 0); // (after: a fixed delay instead of the app's)
        const room = (d.steps[i + 1]?.t ?? s.t + s.dur) - s.t;
        setTimeout(() => {
          hit.push(fire('pointerdown', 20 + i));
          const p = D.pad(); sounded.push(p && p.sounded !== null ? Math.round((p.sounded - p.down) * 10) / 10 : null);
          setTimeout(() => { fire('pointerup', 20 + i); done(); }, Math.min(s.dur, room) * 0.9);
        }, at - performance.now());
      })));
      let status = '';
      for (let i = 0; i < 300; i++) { status = document.getElementById('ex-status').textContent; if (/✓|Not quite/.test(status)) break; await sleep(20); }
      return { hit, sounded, readWaited, notes: d.steps.length, heardDelay: d.heardDelay, status, sub: document.getElementById('ex-sub').textContent };
    }, { shiftIndex, shiftMs, after });
    /** Staff lines in the drawn card: horizontal strokes across most of it, by height (one line: 1). */
    const staffLines = (page) => page.evaluate(() => {
      const svg = document.querySelector('#ex-notation svg');
      if (!svg) return -1;
      const ys = [...svg.querySelectorAll('path, rect, line')].map((p) => p.getBBox()).filter((b) => b.height < 2 && b.width > 100).map((b) => Math.round(b.y));
      return new Set(ys).size;
    });
    const NAME = /[A-G][♯♭#b]?\d|\b[A-G][♯♭]/;

    // Upright 360×780: the pad, the keyboard gone, Level and Practise as…, a card read and tapped on the beat (clean),
    // its one-line staff, then a card with one note a quarter of a second late (marked late).
    {
      const { ctx, page, errors } = await rhTab({ width: 360, height: 780 });
      await page.goto(`${BASE}?activity=check-rh-read`); await page.waitForTimeout(2000);
      await startTap(page);
      const box = await padBox(page);
      ok(`rhythm, 360×780: the pad shown, full width, about as tall as Free play's keys (min(42vh, 360px) = ${Math.round(Math.min(0.42 * 780, 360))}), on top where a finger lands; no keyboard`, box.shown && box.w >= 340 && Math.abs(box.h - Math.min(0.42 * 780, 360)) <= 4 && box.onTop && box.keys === 0 && box.bottom <= box.vh, JSON.stringify(box));
      await page.touchscreen.tap(...await centre(page, 'ex-level')); await page.waitForTimeout(300);
      const level = await page.evaluate(() => ({ rung4: document.querySelector('#drill-dialog input[name="d-rung"][value="4"]').parentElement.hidden, notes: document.querySelector('#drill-dialog input[name="d-onTime"][value="notes"]').parentElement.hidden, rung0: document.querySelector('#drill-dialog input[name="d-rung"][value="0"]').parentElement.textContent.trim() }));
      ok('rhythm: the Level panel offers no rung 4 and no "notes only", and says the pad', level.rung4 && level.notes && /pad/.test(level.rung0), JSON.stringify(level));
      await page.keyboard.press('Escape'); await page.waitForTimeout(300);
      await page.touchscreen.tap(...await centre(page, 'ex-kind')); await page.waitForTimeout(300);
      const as = await page.evaluate(() => ({ simon: document.querySelector('#ex-as-dialog [data-as="simon"]').hidden, drills: document.querySelector('#ex-as-dialog [data-as="drill"]').hidden, why: !document.getElementById('ex-as-rhythm').hidden }));
      ok('rhythm: Practise as… offers no Simon for a rhythm set (Drills only, and says why)', as.simon && !as.drills && as.why, JSON.stringify(as));
      await page.keyboard.press('Escape'); await page.waitForTimeout(300);
      await page.touchscreen.tap(...await centre(page, 'ex-start'));
      const clean = await tapCard(page);
      ok('rhythm, rung 3 (read): a card tapped by position on the beat, holding the halves, comes out clean', !clean.error && clean.hit.every((h) => h === 'pad') && /✓ Clean/.test(clean.status), JSON.stringify(clean));
      ok('rhythm, rung 3 (read): the card waits to be read (still waiting after 1.2 s), and a tap on the pad starts its count-in (not a note)', clean.readWaited === true && clean.notes === clean.hit.length, JSON.stringify({ readWaited: clean.readWaited, notes: clean.notes, taps: clean.hit.length }));
      ok('rhythm: every tap on the pad scheduled its tap sound at once (ms from pointerdown to the sound asked for)', clean.sounded?.length === clean.notes && clean.sounded.every((x) => x !== null && x >= 0 && x < 20), JSON.stringify(clean.sounded));
      await page.waitForTimeout(200);
      const lines = await staffLines(page);
      ok('rhythm: the card is drawn on a one-line staff (one staff line in the SVG)', lines === 1, `${lines} lines`);
      await shot(page, 'r-360x780-clean');
      await ctx.close();
      // A card with its second note tapped 250 ms late (On time normal: ±100 ms).
      const late = await rhTab({ width: 360, height: 780 });
      await late.page.goto(`${BASE}?activity=check-rh-read`); await late.page.waitForTimeout(2000);
      await startTap(late.page);
      await late.page.touchscreen.tap(...await centre(late.page, 'ex-start'));
      const r = await tapCard(late.page, 1, 250);
      await late.page.waitForTimeout(600);
      const marks = await late.page.evaluate(() => [...document.querySelectorAll('#ex-notation svg [fill="#d97706"], #ex-notation svg [fill="#16a34a"]')].length);
      const lines2 = await staffLines(late.page);
      ok('rhythm: one note tapped a quarter second late is marked late ("1 note late", amber on the card), no note names', /Not quite/.test(r.status) && /1 note late/.test(r.sub) && !NAME.test(r.sub) && marks > 0 && lines2 === 1, JSON.stringify({ ...r, marks, lines2 }));
      await shot(late.page, 'r-360x780-result-late');
      ok('rhythm upright: no page errors', errors.length === 0 && late.errors.length === 0, [...errors, ...late.errors].join(' | '));
      await late.ctx.close();
    }

    // The first tap (owner, 2026-10-16: "Make sure to start on the first tap"): on Ready at rung 3, starting on your first
    // note, one tap on the pad by position starts the set and is the card's first note; the others tapped but the last
    // leave exactly one missed, the last. Then a tap on the result goes on to the next card (as the result says) and is
    // that card's first note.
    {
      const { ctx, page, errors } = await rhTab({ width: 360, height: 780 });
      await page.goto(`${BASE}?activity=check-rh-first`); await page.waitForTimeout(2000);
      await startTap(page);
      const ready = await page.evaluate(() => window.__pianoDebug.drill().state);
      const r = await page.evaluate(async () => {
        const D = window.__pianoDebug, sleep = (ms) => new Promise((res) => setTimeout(res, ms));
        const p = document.getElementById('ex-pad').getBoundingClientRect(), x = p.left + p.width / 2, y = p.top + p.height / 2;
        const fire = (type, id) => { const ev = new PointerEvent(type, { pointerId: id, bubbles: true, cancelable: true, clientX: x, clientY: y, pointerType: 'touch', isPrimary: true }); document.elementFromPoint(x, y).dispatchEvent(ev); return ev.timeStamp; };
        const T = fire('pointerdown', 40);
        let d = null;
        for (let i = 0; i < 300; i++) { d = D.drill(); if (d.state === 'turn' && d.started) break; await sleep(10); }
        const firstHold = Math.min(d.steps[0].dur, d.steps[1].t) * 0.9;
        setTimeout(() => fire('pointerup', 40), T + firstHold - performance.now());
        const startedWith = { state: d.state, started: d.started, notes: d.steps.length };
        // The others but the last, at the card's times from that first tap (its clock runs from it).
        await Promise.all(d.steps.slice(1, -1).map((s, k) => new Promise((done) => {
          const i = k + 1, room = d.steps[i + 1].t - s.t;
          setTimeout(() => { fire('pointerdown', 41 + i); setTimeout(() => { fire('pointerup', 41 + i); done(); }, Math.min(s.dur, room) * 0.9); }, T + s.t - performance.now());
        })));
        let status = '';
        for (let i = 0; i < 400; i++) { status = document.getElementById('ex-status').textContent; if (/✓|Not quite/.test(status)) break; await sleep(20); }
        const sub = document.getElementById('ex-sub').textContent;
        const missedAt = [...document.querySelectorAll('#ex-notation svg [fill="#16a34a"]')].length;
        // A tap at once on the result (a finger still on the last beat) does not skip it (0.8 s settle, 2026-10-16) ...
        fire('pointerdown', 89); await sleep(60); fire('pointerup', 89); await sleep(100);
        const early = { state: D.drill().state, card: document.getElementById('ex-left').textContent };
        // ... a tap after it: the next card, this tap its first note.
        await sleep(800);
        fire('pointerdown', 90); await sleep(60); fire('pointerup', 90);
        let next = null;
        for (let i = 0; i < 200; i++) { next = D.drill(); if (next.state === 'turn' && next.started) break; await sleep(10); }
        return { startedWith, status, sub, missedAt, early, next: { state: next.state, started: next.started }, card: document.getElementById('ex-left').textContent };
      });
      ok('rhythm, the first tap: on Ready one tap by position starts the set and the card\'s clock (rung 3, starting on your first note)', ready === 'idle' && r.startedWith.state === 'turn' && r.startedWith.started, JSON.stringify({ ready, ...r.startedWith }));
      ok('rhythm, the first tap: all notes but the last tapped from there: exactly one missed, the last ("1 note missed"), and the result says a tap goes on', /Not quite/.test(r.status) && /of \d+ on time and held · 1 note missed · a tap goes on to the next card$/.test(r.sub) && new RegExp(`^${r.startedWith.notes - 1} of ${r.startedWith.notes}`).test(r.sub), JSON.stringify(r));
      ok('rhythm, the first tap: a tap at once on the result does not skip it (the result stays on card 1)', r.early.state === 'result' && /Card 1/.test(r.early.card), JSON.stringify(r.early));
      ok('rhythm, the first tap: a tap on the result goes on to the next card (card 2), its clock started by that tap', r.next.state === 'turn' && r.next.started && /Card 2/.test(r.card), JSON.stringify(r));
      await shot(page, 'r-360x780-first-tap-next');
      ok('rhythm first tap: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // Timing calibration (owner, 2026-10-16): taps that always come 180 ms after the clock (a slow phone or headset) are
    // late by the browser's own figure; after a timing check tapped the same way, by position on its pad, a card tapped
    // 180 ms after the clock comes out clean. The check is offered once, on a rhythm set's first visit.
    {
      const SHIFT = 180;
      const before = await rhTab({ width: 360, height: 780 });
      await before.page.goto(`${BASE}?activity=check-rh-read`); await before.page.waitForTimeout(2000);
      await startTap(before.page);
      await before.page.touchscreen.tap(...await centre(before.page, 'ex-start'));
      const late = await tapCard(before.page, -1, 0, SHIFT);
      ok(`calibration: with none kept, a card tapped ${SHIFT} ms after the clock is late (the browser's figure is ${late.heardDelay} ms)`, /Not quite/.test(late.status) && /late/.test(late.sub), JSON.stringify(late));
      await before.ctx.close();
      const { ctx, page, errors } = await rhTab({ width: 360, height: 780 });
      await page.goto(`${BASE}?activity=check-rh-read`); await page.waitForTimeout(2000);
      await startTap(page);
      const offer = await page.evaluate(() => !document.getElementById('ex-calib').hidden);
      await shot(page, 'r-360x780-calibrate-offer');
      await page.touchscreen.tap(...await centre(page, 'ex-calib-go')); await page.waitForTimeout(400);
      const open = await page.evaluate(() => document.getElementById('calib-dialog').open);
      await page.touchscreen.tap(...await centre(page, 'calib-pad')); // (the starting tap: starts the clicks, not measured)
      const said = await page.evaluate(async (shift) => {
        const D = window.__pianoDebug, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
        let c = null;
        for (let i = 0; i < 300; i++) { c = D.calibration(); if (c.state === 'running') break; await sleep(10); }
        const p = document.getElementById('calib-pad').getBoundingClientRect(), x = p.left + p.width / 2, y = p.top + p.height / 2;
        const fire = (type, id) => document.elementFromPoint(x, y).dispatchEvent(new PointerEvent(type, { pointerId: id, bubbles: true, cancelable: true, clientX: x, clientY: y, pointerType: 'touch', isPrimary: true }));
        const zero = performance.now() - c.now;
        await Promise.all(c.clicks.map((t, k) => new Promise((done) => setTimeout(() => { fire('pointerdown', 60 + k); setTimeout(() => { fire('pointerup', 60 + k); done(); }, 120); }, zero + t + shift - performance.now()))));
        for (let i = 0; i < 300; i++) { c = D.calibration(); if (c.state === 'done') break; await sleep(10); }
        return { state: c.state, said: c.said, taps: c.taps.length, kept: JSON.parse(localStorage.getItem('piano-web.calibration.v1') ?? '{}').screen ?? null };
      }, SHIFT);
      await shot(page, 'r-360x780-calibrate-result');
      ok(`calibration by position: offered on the first visit; taps ${SHIFT} ms after each click kept as about ${SHIFT} ms for screen taps`, offer && open && said.state === 'done' && said.kept && Math.abs(said.kept.ms - SHIFT) <= 15, JSON.stringify(said));
      await page.keyboard.press('Escape'); await page.waitForTimeout(400);
      await page.touchscreen.tap(...await centre(page, 'ex-start'));
      const clean = await tapCard(page, -1, 0, SHIFT);
      ok(`calibration: then a card tapped ${SHIFT} ms after the clock comes out clean (the kept delay used instead of the browser's)`, /✓ Clean/.test(clean.status) && clean.heardDelay === said.kept?.ms, JSON.stringify(clean));
      const offerAgain = await page.evaluate(() => document.getElementById('ex-calib').hidden);
      ok('calibration: the offer is not made again', offerAgain);
      ok('calibration: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // Rung 0 (hear it, pad lit, no music): the steady-beat card's eight quarters light the pad eight times as they play, no
    // staff while it plays.
    {
      const { ctx, page, errors } = await rhTab({ width: 360, height: 780 });
      await page.goto(`${BASE}?activity=check-rh-echo`); await page.waitForTimeout(2000);
      await startTap(page);
      await page.touchscreen.tap(...await centre(page, 'ex-start'));
      const seen = await page.evaluate(async () => {
        const pad = document.getElementById('ex-pad'), out = { flashes: 0, staff: 0, states: new Set() };
        let was = false;
        for (let i = 0; i < 700; i++) {
          const d = window.__pianoDebug.drill();
          out.states.add(d.state);
          const lit = pad.classList.contains('lit');
          if (lit && !was) out.flashes++;
          was = lit;
          out.staff = Math.max(out.staff, document.querySelectorAll('#ex-notation svg').length);
          if (d.state === 'countin' || (d.state === 'turn' && d.started)) break;
          await new Promise((r) => setTimeout(r, 10));
        }
        return { flashes: out.flashes, staff: out.staff, states: [...out.states] };
      });
      const steps = (await page.evaluate(() => window.__pianoDebug.drill().steps.length));
      ok('rhythm, rung 0: the pad lights once for each note as the card is played (8 quarters, 8 flashes), and no staff is drawn', seen.flashes === steps && steps === 8 && seen.staff === 0, JSON.stringify({ ...seen, steps }));
      await shot(page, 'r-360x780-rung0');
      ok('rhythm rung 0: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // Sideways 844×390 and a tablet 820×1180: the pad shown, on top, a tap on it counted (pressed and sounded); the card
    // tapped by position comes out clean there too.
    for (const viewport of [{ width: 844, height: 390 }, { width: 820, height: 1180 }]) {
      const { ctx, page, errors } = await rhTab(viewport);
      await page.goto(`${BASE}?activity=check-rh-read`); await page.waitForTimeout(2000);
      await startTap(page);
      const box = await padBox(page);
      const [x, y] = await centre(page, 'ex-pad');
      await page.mouse.move(x, y); await page.mouse.down(); await page.waitForTimeout(80);
      const pressed = await page.evaluate(() => ({ pressed: document.getElementById('ex-pad').classList.contains('pressed'), tap: window.__pianoDebug.pad(), state: window.__pianoDebug.drill().state }));
      await page.mouse.up(); await page.waitForTimeout(300);
      ok(`rhythm, ${viewport.width}×${viewport.height}: the pad shown (${box.w}×${box.h}), on top where a finger lands, inside the screen, no keyboard; a tap on it presses and sounds`, box.shown && box.onTop && box.keys === 0 && box.bottom <= box.vh && box.h >= 100 && pressed.pressed && pressed.tap?.sounded != null, JSON.stringify({ box, pressed }));
      // (that tap started the set from Ready: its first card is on its way)
      const r = await tapCard(page);
      ok(`rhythm, ${viewport.width}×${viewport.height}: a card tapped by position on the beat comes out clean`, /✓ Clean/.test(r.status), JSON.stringify(r));
      await page.waitForTimeout(300);
      await shot(page, `r-${viewport.width}x${viewport.height}`);
      ok(`rhythm ${viewport.width}: no page errors`, errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // For the report (coordinator, 2026-10-16): what the on-screen keys do when tapped in Drills today. Every audio
    // source the page starts is counted; a key of a set of notes tapped by position.
    {
      const { ctx, page, errors } = await rhTab({ width: 360, height: 780 }, () => {
        window.__started = 0;
        for (const C of [AudioScheduledSourceNode, AudioBufferSourceNode, OscillatorNode, ConstantSourceNode]) {
          if (!Object.prototype.hasOwnProperty.call(C.prototype, 'start')) continue;
          const real = C.prototype.start;
          C.prototype.start = function (...a) { window.__started++; return real.apply(this, a); };
        }
      });
      await page.goto(`${BASE}?activity=check-rh-keys`); await page.waitForTimeout(2000);
      await startTap(page);
      await page.waitForTimeout(500);
      const key = await page.evaluate(() => { const k = document.querySelector('#ex-keyboard .key.white[data-midi="64"]'); const r = k.getBoundingClientRect(); return [r.left + r.width / 2, r.bottom - 12]; });
      const tapKey = async () => { const n = await page.evaluate(() => window.__started); await page.mouse.move(...key); await page.mouse.down(); await page.waitForTimeout(400); await page.mouse.up(); await page.waitForTimeout(300); return (await page.evaluate(() => window.__started)) - n; };
      // The first key loads the piano's samples (it is silent: let go before they came); later keys sound.
      const first = await tapKey();
      await page.waitForTimeout(4000);
      const second = await tapKey();
      ok('Drills (a set of notes): an on-screen key tapped by position sounds the piano (the first key of the visit fetches its samples: it sounds only if still held when they arrive)', second > 0, `audio sources started by the first key ${first}, by a key 4 s later ${second}`);
      ok('Drills keys: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
  }
  // ---- end of rhythm sets -------------------------------------------------------------------------------------------
  if (!only) {
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
    // (2026-10-15: the tabs always show, for the full PDMX set's tab; the Catalogue tab is the one that shows only with a catalogue)
    const first = await page.locator('#lib-tab-catalogue').isVisible();
    failing = false;
    await page.evaluate(() => history.back()); await page.waitForTimeout(800);
    await library(page); await page.waitForTimeout(800);
    const second = await page.locator('#lib-tab-catalogue').isVisible();
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
      // (these cases are about the test lesson: since lesson 1 shipped, Home's Up next is the path's first real lesson,
      // so a fresh tab is put on the test lesson, as a learner who had chosen it would be; 2026-10-16)
      await page.addInitScript(() => { if (!localStorage.getItem('piano-web.path.v1')) localStorage.setItem('piano-web.path.v1', JSON.stringify({ version: 1, current: 'test-minuet-opening', done: {}, tried: {} })); });
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
      // (2026-10-16, the consistency pass: the summary is the strip at the bottom, not a dialog)
      const after = { playing: await playing(page), summary: await page.evaluate(() => !document.getElementById('run-strip').hidden) };
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
      // (these cases are about the test lesson: since lesson 1 shipped, Home's Up next is the path's first real lesson,
      // so a fresh tab is put on the test lesson, as a learner who had chosen it would be; 2026-10-16)
      await page.addInitScript(() => { if (!localStorage.getItem('piano-web.path.v1')) localStorage.setItem('piano-web.path.v1', JSON.stringify({ version: 1, current: 'test-minuet-opening', done: {}, tried: {} })); });
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
        await wait(page, 900); // (the summary is the strip now, and a key starts the next run only after a moment: 2026-10-16)
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
      await press(page, '#ex-start'); // (Start: a key on Ready is now the card's first note too, owner 2026-10-16: checked in the rhythm section)
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
      // (music only with a count-in: the card waits to be read, and a key counts it in: owner, 2026-10-16)
      if (await until(page, async () => (await d()).state === 'read', 3000)) await chord(page, [60]);
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
      // (these cases are about the test lesson: since lesson 1 shipped, Home's Up next is the path's first real lesson,
      // so a fresh tab is put on the test lesson, as a learner who had chosen it would be; 2026-10-16)
      await page.addInitScript(() => { if (!localStorage.getItem('piano-web.path.v1')) localStorage.setItem('piano-web.path.v1', JSON.stringify({ version: 1, current: 'test-minuet-opening', done: {}, tried: {} })); });
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
      await page.locator('#home-body .today .btn.main').click(); await page.waitForTimeout(2500); await page.locator('#lesson-next').click(); await page.waitForTimeout(2500); // (Home’s Start opens the lesson page at the step’s part, its bar’s Start the step: 2026-10-16)
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
    // only once a later step was played. Free play (keeps no runs) is done on coming back after a key (2026-10-16). Switch: skip ahead, Path follows.
    {
      const { ctx, page, errors } = await open(`${BASE}?tab=path&page=lesson&lesson=test-chords-and-band`);
      await page.waitForTimeout(1200);
      await page.locator('.les-step[data-step="free"] .btn').click(); await page.waitForTimeout(800);
      const fp = await where(page);
      await page.locator('#freeplay .fp-keyboard .key.white').nth(3).click(); await page.waitForTimeout(200); // (visited once a key is played: the consistency pass, 2026-10-16)
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
      // (these cases are about the test lesson: since lesson 1 shipped, Home's Up next is the path's first real lesson,
      // so a fresh tab is put on the test lesson, as a learner who had chosen it would be; 2026-10-16)
      await page.addInitScript(() => { if (!localStorage.getItem('piano-web.path.v1')) localStorage.setItem('piano-web.path.v1', JSON.stringify({ version: 1, current: 'test-minuet-opening', done: {}, tried: {} })); });
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
      await page.locator('#home-body .today .btn.main').click(); await page.waitForTimeout(2500); await page.locator('#lesson-next').click(); await page.waitForTimeout(2500); // (Home’s Start opens the lesson page at the step’s part, its bar’s Start the step: 2026-10-16)
      const loop = await page.evaluate(() => window.__pianoDebug.state());
      let wrapped = false, last = loop.step;
      for (let k = 0; k < 40 && !wrapped; k++) { await playOn(page, 1); const s = await page.evaluate(() => window.__pianoDebug.state().step); if (s < last) wrapped = true; last = s; }
      await click(page, '#score-back'); await page.waitForTimeout(600);
      const full = { text: await resultText(page), done: (await progress(page)).done?.['test-minuet-opening']?.['wait-rh'] };
      await ctx.close();
      const two = await open();
      await two.page.mouse.click(200, 20); await two.page.waitForTimeout(200);
      await two.page.locator('#home-body .today .btn.main').click(); await two.page.waitForTimeout(2500); await two.page.locator('#lesson-next').click(); await two.page.waitForTimeout(2500); // (Home’s Start opens the lesson page at the step’s part, its bar’s Start the step: 2026-10-16)
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
      await page.evaluate(async () => { const idx = await (await fetch('content/path/index.json')).json(); const out = {}; for (const r of idx.rungs.filter((r) => !r.test)) for (const id of r.lessons) { const l = await (await fetch(`content/path/lessons/${id}.json`)).json(); out[id] = Object.fromEntries(l.blocks.filter((b) => b.kind === 'step').map((b) => [b.id, { at: new Date().toISOString(), how: 'opened' }])); } window.__realLessonsDone = out; });
      await page.evaluate(() => { localStorage.setItem('piano-web.path.v1', JSON.stringify({ version: 1, current: 'test-chords-and-band', done: { 'test-chords-and-band': { 'simon-chords': { at: new Date().toISOString(), how: 'target' }, 'band-roots': { at: new Date().toISOString(), how: 'target' } }, ...window.__realLessonsDone }, tried: {} })); });
      await page.reload(); await page.waitForTimeout(2000);
      await page.locator('.les-step[data-step="free"] .btn').click(); await page.waitForTimeout(800);
      await page.locator('#freeplay .fp-keyboard .key.white').nth(3).click(); await page.waitForTimeout(200); // (visited once a key is played: the consistency pass, 2026-10-16)
      await click(page, '#fp-done'); await page.waitForTimeout(600);
      const text = await resultText(page);
      const inView = await page.evaluate(() => [...document.querySelectorAll('#lesson-bar button:not([hidden])')].filter((b) => { const r = b.getBoundingClientRect(); return r.width > 0 && r.bottom <= innerHeight && r.top >= 0; }).map((b) => b.textContent.trim()));
      const state = (await progress(page)).done?.['test-chords-and-band']?.free;
      await page.evaluate(() => history.back()); await page.waitForTimeout(800);
      const after = await where(page);
      const tag = `${vp.width}×${vp.height}`;
      ok(`V18 ${tag}: a step with nothing to judge is "visited" (and counts), not "done ✓"`, state?.how === 'opened' && /visited/i.test(text) && !/done ✓/.test(text), `"${text}" ${JSON.stringify(state)}`);
      // (2026-10-16, the review ledger A3: Next is the rest of this lesson first, whose bar then offers the next lesson)
      ok(`V17 ${tag}: the lesson's last step says the lesson is done, and Next is in view`, /lesson done/i.test(text) && inView.some((t) => /^Next/.test(t)), `"${text}"; in view ${JSON.stringify(inView)}`);
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
      await page.locator('#home-body .today .btn.main').click(); await page.waitForTimeout(2500); await page.locator('#lesson-next').click(); await page.waitForTimeout(2500); // (Home’s Start opens the lesson page at the step’s part, its bar’s Start the step: 2026-10-16)
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
      // (these cases are about the test lesson: since lesson 1 shipped, Home's Up next is the path's first real lesson,
      // so a fresh tab is put on the test lesson, as a learner who had chosen it would be; 2026-10-16)
      await page.addInitScript(() => { if (!localStorage.getItem('piano-web.path.v1')) localStorage.setItem('piano-web.path.v1', JSON.stringify({ version: 1, current: 'test-minuet-opening', done: {}, tried: {} })); });
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
      await page.locator('#home-body .today .btn.main').click(); await page.waitForTimeout(2500); await page.locator('#lesson-next').click(); await page.waitForTimeout(2500); // (Home’s Start opens the lesson page at the step’s part, its bar’s Start the step: 2026-10-16)
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
      // (owner, 2026-10-16: Next is the lesson page at the part after step 1, the next step's Start below it; then Start)
      await page.locator('#lesson-bar button', { hasText: 'Next' }).click(); await page.waitForTimeout(1500);
      const part = await page.evaluate(() => {
        const body = document.getElementById('lesson-body'), card = body.querySelector('.les-step[data-step="wait-rh"]');
        const after = card?.nextElementSibling, top = body.getBoundingClientRect().top;
        return { view: !document.getElementById('lesson-body').closest('[hidden]'), url: location.search, scrolled: body.scrollTop, afterTop: after ? Math.round(after.getBoundingClientRect().top - top) : null, afterText: after?.textContent?.slice(0, 60) };
      });
      ok('result Next: the lesson page, at the part after the step (its top within 40 px of the page top), not the next step’s screen', part.view && !/step=/.test(part.url) && part.scrolled > 0 && part.afterTop !== null && part.afterTop >= 0 && part.afterTop < 40, JSON.stringify(part));
      await page.locator('.les-step[data-step="melody-cards"] .btn').click(); await page.waitForTimeout(2500);
      await reloadCheck('result Next');
      // Next lesson (lesson 1 all done but its last step), then that lesson's Start
      await page.evaluate(async () => { const idx = await (await fetch('content/path/index.json')).json(); const out = {}; for (const r of idx.rungs.filter((r) => !r.test)) for (const id of r.lessons) { const l = await (await fetch(`content/path/lessons/${id}.json`)).json(); out[id] = Object.fromEntries(l.blocks.filter((b) => b.kind === 'step').map((b) => [b.id, { at: new Date().toISOString(), how: 'opened' }])); } window.__realLessonsDone = out; });
      await page.evaluate(() => localStorage.setItem('piano-web.path.v1', JSON.stringify({ version: 1, current: 'test-chords-and-band', done: { 'test-chords-and-band': { 'simon-chords': { at: new Date().toISOString(), how: 'target' }, 'band-roots': { at: new Date().toISOString(), how: 'target' } }, ...window.__realLessonsDone }, tried: {} })));
      await page.goto(`${BASE}?page=lesson&lesson=test-chords-and-band`); await page.waitForTimeout(2000);
      await page.locator('.les-step[data-step="free"] .btn').click(); await page.waitForTimeout(800);
      await page.locator('#freeplay .fp-keyboard .key.white').nth(3).click(); await page.waitForTimeout(200); // (visited once a key is played: the consistency pass, 2026-10-16)
      await click(page, '#fp-done'); await page.waitForTimeout(600);
      await page.locator('#lesson-bar button', { hasText: 'Next' }).click(); await page.waitForTimeout(1500); // (the rest of the lesson first: A3)
      await page.locator('#lesson-bar button', { hasText: 'Next lesson' }).click(); await page.waitForTimeout(2000);
      await page.locator('.les-step[data-step="wait-rh"] .btn').click(); await page.waitForTimeout(2500);
      await reloadCheck('Next lesson, then Start');
      const step1 = (g) => g && /page=lesson/.test(g.url) && /lesson=test-minuet-opening/.test(g.url) && /step=wait-rh/.test(g.url) && g.screen === 'score' && g.c?.mode === 'wait' && g.c?.hands === 'right' && g.c?.loop === 'true' && g.back === 'v-lesson';
      for (const name of ['lesson page Start', 'Home Start', 'result Again', 'Next lesson, then Start']) ok(`V33 ${name}: a reload is the step with its choices, ← the lesson page`, step1(got[name]), JSON.stringify(got[name]));
      const n = got['result Next'];
      ok('V33 result Next, then step 2’s Start: a reload is step 2 (the melody cards), ← the lesson page', n && /page=lesson/.test(n.url) && /step=melody-cards/.test(n.url) && n.screen === 'exercise' && n.back === 'v-lesson', JSON.stringify(n));
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
  // ---- A piece that can't be drawn (review of the full set, 2026-10-15, P01) ---------------------------------------
  // The previous piece's music must never stay under the new title: on every way a piece opens, a file that can't be
  // read or drawn clears the drawing, and the screen itself says so with a way back. And the cause found upright: OSMD
  // drew bars of rests in a row as one multi-bar rest, leaving the others with no drawing, and the page layout failed
  // on them ("reading 'ParentMusicSystem'": 19 of the 300 most viewed PDMX piano files). A plain phone tab, taps by position.
  {
    const ctxs = [];
    const plain = async (init, viewport = { width: 390, height: 844 }) => {
      const ctx = await browser.newContext({ viewport, serviceWorkers: 'block' });
      ctxs.push(ctx);
      const page = await ctx.newPage();
      if (init) await init(page);
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('dialog', (d) => d.accept());
      await page.goto(BASE); await page.waitForTimeout(1500);
      return { ctx, page, errors };
    };
    const at = async (page, selector, nth = 0) => {
      const el = page.locator(selector).nth(nth);
      await el.scrollIntoViewIfNeeded({ timeout: 5000 });
      const box = await el.boundingBox();
      if (!box) throw new Error(`${selector} is not shown`);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    };
    /** What a failed draw still offers (P14): the controls that start something, shown; keys lit from the music. */
    const offered = (page) => page.evaluate(() => {
      const shown = (id) => { const e = document.getElementById(id); return !!e && !e.hidden && e.getClientRects().length > 0 && getComputedStyle(e).display !== 'none'; };
      return { bottomBar: shown('bottom-bar'), play: shown('play'), memoPanel: shown('memo-panel'), memoGo: shown('memo-go'), lit: document.querySelectorAll('#keyboard .now-r, #keyboard .now-l, #keyboard .next-r, #keyboard .next-l').length };
    });
    const screen = (page) => page.evaluate(() => ({
      svgs: document.querySelectorAll('#score svg').length, failed: document.querySelector('#score .draw-failed')?.textContent ?? '',
      title: document.getElementById('song-title')?.textContent ?? '', showing: window.__pianoDebug.showing(), notes: window.__pianoDebug.notes(),
    }));
    try {
      // The file of one of the app's pieces unreachable, then unreadable, each opened after another piece was drawn.
      // (unreachable from the start: Music reads every piece's file for its facts, and the app keeps what it read)
      let mode = 'abort';
      const { page, errors } = await plain((p) => p.route('**/scores/mozart-k2.musicxml', (route) => (mode === 'abort' ? route.abort('internetdisconnected')
        : mode === 'garbage' ? route.fulfill({ contentType: 'application/xml', body: 'this is not MusicXML' }) : route.continue())));
      await page.mouse.click(200, 20); await page.waitForTimeout(200);
      await library(page);
      await at(page, '#lib-list li[data-id="bach-bwv514"] .lib-row'); await page.waitForTimeout(2500);
      const first = await screen(page);
      await at(page, '#score-back'); await page.waitForTimeout(800);
      await at(page, '#lib-list li[data-id="mozart-k2"] .lib-row'); await page.waitForTimeout(2500);
      const unreachable = await screen(page);
      ok('a piece whose file can’t be had: the piece before is not left on screen; the screen says so', first.svgs > 0 && first.notes > 0 && unreachable.svgs === 0 && /could not be opened/.test(unreachable.failed), JSON.stringify({ first, unreachable }));
      await at(page, unreachable.failed ? '#score .draw-failed .btn' : '#score-back'); await page.waitForTimeout(800); // (the old build had no Back of its own: ← then)
      ok('… and its Back (tapped where it shows) goes back to Music', !!unreachable.failed && await page.evaluate(() => window.__pianoDebug.showing()) === 'library', await page.evaluate(() => window.__pianoDebug.showing()));
      await at(page, '#lib-list li[data-id="bach-bwv514"] .lib-row'); await page.waitForTimeout(2500);
      await at(page, '#score-back'); await page.waitForTimeout(800);
      mode = 'garbage';
      await at(page, '#lib-list li[data-id="mozart-k2"] .lib-row'); await page.waitForTimeout(2500);
      const unreadable = await screen(page);
      const onScore = await offered(page);
      ok('… and the score offers nothing to start (no ▶ or mode bar) and no keys lit from before (P14)', !onScore.bottomBar && !onScore.play && onScore.lit === 0, JSON.stringify(onScore));
      ok('a piece that can’t be drawn, opened from Music after another: no music of the other under its title; said on the screen', unreadable.svgs === 0 && /could not be drawn/.test(unreadable.failed) && unreadable.failed.includes(unreadable.title || '“'), JSON.stringify(unreadable));
      // Memorise, after the other piece was drawn again.
      await at(page, '#score-back'); await page.waitForTimeout(800);
      await at(page, '#lib-list li[data-id="bach-bwv514"] .lib-row'); await page.waitForTimeout(2500);
      await at(page, '#score-back'); await page.waitForTimeout(800);
      await at(page, '#lib-list li[data-id="mozart-k2"] .lib-more'); await page.waitForTimeout(800);
      await at(page, '#lib-page .lib-buttons .btn', 1); await page.waitForTimeout(2500); // Memorise
      const memo = await screen(page);
      const onMemo = await offered(page);
      ok('… and Memorise offers nothing to start (no panel, ▶ Start or Hear) and no keys lit from before (P14)', !onMemo.memoPanel && !onMemo.memoGo && onMemo.lit === 0, JSON.stringify(onMemo));
      ok('the same piece opened in Memorise: no music of the other; said on the screen', memo.svgs === 0 && /could not be drawn/.test(memo.failed), JSON.stringify(memo));
      // A reload straight into it (its address).
      await page.goto(`${BASE}?piece=mozart-k2`); await page.waitForTimeout(2500);
      const reload = await screen(page);
      ok('the same piece opened by its address: said on the screen, with a way back', /could not be drawn/.test(reload.failed) && reload.svgs === 0, JSON.stringify(reload));
      ok('a piece that can’t be drawn: no page errors', errors.length === 0, errors.join(' | '));

      // The cause: bars of rests in a row in both staves (OSMD drew them as one multi-bar rest) drawn upright.
      const bar = (n, notes) => `<measure number="${n}">${n === 1 ? '<attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><staves>2</staves><clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef></attributes>' : ''}${notes
        ? `<note><pitch><step>C</step><octave>5</octave></pitch><duration>4</duration><voice>1</voice><type>whole</type><staff>1</staff></note><backup><duration>4</duration></backup><note><pitch><step>C</step><octave>3</octave></pitch><duration>4</duration><voice>5</voice><type>whole</type><staff>2</staff></note>`
        : '<note><rest measure="yes"/><duration>4</duration><voice>1</voice><staff>1</staff></note><backup><duration>4</duration></backup><note><rest measure="yes"/><duration>4</duration><voice>5</voice><staff>2</staff></note>'}</measure>`;
      const xml = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><work><work-title>Rests between</work-title></work><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1">${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => bar(n, n <= 2 || n >= 7)).join('')}</part></score-partwise>`;
      const RESTS = join(tmp, 'rests between.musicxml');
      writeFileSync(RESTS, xml);
      const two = await plain();
      await two.page.mouse.click(200, 20); await two.page.waitForTimeout(200);
      await library(two.page);
      const [chooser] = await Promise.all([two.page.waitForEvent('filechooser'), at(two.page, '#lib-add')]);
      await chooser.setFiles(RESTS); await two.page.waitForTimeout(1500);
      await at(two.page, '#lib-toast .lib-toast-open'); await two.page.waitForTimeout(2500);
      const rests = await screen(two.page);
      const bars = await two.page.evaluate(() => [...new Set(window.__pianoDebug.timeline().map((s) => s[4]))].length);
      ok('a piece with bars of rests in a row in both staves draws upright, every bar its own (P01 cause)', rests.svgs > 0 && rests.notes === 8 && !rests.failed && bars === 8, JSON.stringify({ ...rests, bars }));
      ok('rests between: no page errors', two.errors.length === 0, two.errors.join(' | '));
    } catch (e) {
      ok('a piece that can’t be drawn (P01): the block ran', false, `stopped: ${String(e).split(/\r?\n/)[0]}`);
    } finally {
      for (const c of ctxs) await c.close().catch(() => {});
    }
  }

  // ---- The full PDMX set on the phone (owner, 2026-10-15; mockup web/mockups/pdmx-full.html) -----------------------
  // Uses the small sample set full_set.py's `sample` command makes (300 files a kind, zips named and split as the real
  // ones), outside the repo; never the real 2 GB. A plain phone tab: no MIDI permission, the zips picked through the
  // setup's own button (the file chooser opened by a tap where the button shows).
  const SAMPLE = process.env.PIANO_PDMX_SAMPLE ?? here('../../../catalogue-work/full-sample/');
  if (!existsSync(join(SAMPLE, 'pdmx-a1.zip'))) {
    console.log(`skip the full PDMX set block: no sample set at ${SAMPLE} (make it: python -I web/tools/catalogue/full_set.py sample <full set dir> <sample dir>, or name it in PIANO_PDMX_SAMPLE)`);
  } else {
    const zipsOf = (...names) => names.map((n) => join(SAMPLE, `pdmx-${n}.zip`));
    const sizeOf = (n) => statSync(join(SAMPLE, `pdmx-${n}.zip`)).size;
    const listOf = (kind) => { const l = JSON.parse(readFileSync(join(SAMPLE, `index-${kind}.json`), 'utf8')); const c = Object.fromEntries(l.fields.map((n, i) => [n, i])); return { ...l, c, flagsOf: (r) => (r[c.flags] || '').split(' ').filter(Boolean) }; };
    const HIDING = ['empty', 'short', 'overfull', 'test'];
    /** A plain phone tab (no permissions granted), the offline cache blocked unless asked for. */
    async function phone({ sw = false, init, viewport = { width: 390, height: 844 } } = {}) {
      const ctx = await browser.newContext({ viewport, serviceWorkers: sw ? 'allow' : 'block' });
      open.push(ctx);
      const page = await ctx.newPage();
      if (init) await page.addInitScript(init);
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('dialog', (d) => d.accept());
      await page.goto(BASE); await page.waitForTimeout(1500);
      return { ctx, page, errors };
    }
    /** A tap where the element shows (the mouse at its middle: whatever lies on top would take it, docs/tests.md). */
    async function tap(page, selector, nth = 0) {
      const el = page.locator(selector).nth(nth);
      await el.scrollIntoViewIfNeeded({ timeout: 5000 });
      const box = await el.boundingBox();
      if (!box) throw new Error(`${selector} is not shown`);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    }
    const fullTab = async (page) => { await library(page); await tap(page, '#lib-tab-full'); await page.waitForTimeout(600); };
    /** Picks zips as a learner does: the setup's button tapped, then the files chosen in the chooser it opens. */
    async function pickZips(page, files) {
      const [chooser] = await Promise.all([page.waitForEvent('filechooser', { timeout: 5000 }), tap(page, '#lib-full-setup .btn.main')]);
      await chooser.setFiles(files);
    }
    const until = async (page, fn, arg, ms = 20000) => { for (let t = 0; t < ms; t += 250) { if (await page.evaluate(fn, arg)) return true; await page.waitForTimeout(250); } return false; };
    const listed = (page) => until(page, () => { const d = window.__pianoDebug.library(); return d.tab === 'full' && !d.setup && !d.reading && d.listed > 0; });
    /** The copied zips in the app's storage (OPFS), by name: size and when written. */
    const opfs = (page) => page.evaluate(async () => {
      try {
        const d = await (await navigator.storage.getDirectory()).getDirectoryHandle('pdmx-full');
        const out = {};
        for await (const [n, h] of d.entries()) { const f = await h.getFile(); out[n] = { size: f.size, at: f.lastModified }; }
        return out;
      } catch { return null; }
    });
    const lib = (page) => page.evaluate(() => window.__pianoDebug.library());
    /** The library's records (IndexedDB piano-library): id → whether a file is kept, its origin, source, licence. */
    const records = (page) => page.evaluate(() => new Promise((resolve) => {
      const r = indexedDB.open('piano-library');
      r.onsuccess = () => { const all = r.result.transaction('items').objectStore('items').getAll(); all.onsuccess = () => resolve(Object.fromEntries(all.result.map((x) => [x.id, x.own ? { origin: x.own.origin, source: x.own.source, licence: x.own.licence, title: x.own.title } : null]))); };
      r.onerror = () => resolve({});
    }));
    const setupText = (page) => page.evaluate(() => { const s = document.getElementById('lib-full-setup'); return s.hidden ? '' : s.innerText; });
    /** Runs one case; a step that throws (a control not there, say: the build before the full set) fails it, and the run goes on. */
    const open = [];
    async function guard(name, run) {
      try { await run(); } catch (e) { ok(`full set: ${name}`, false, `stopped: ${String(e).split(/\r?\n/)[0]}`); }
      for (const c of open.splice(0)) await c.close().catch(() => {});
    }

    // Setup, the default view, flags, search, Open, + Add and Remove, in one phone's visit.
    await guard('setup, the default view, search, Open, + Add and Remove', async () => {
      const { ctx, page, errors } = await phone();
      await fullTab(page);
      const before = await setupText(page);
      await pickZips(page, zipsOf('a1', 'a2', 'a3'));
      const shown = await listed(page);
      const files = await opfs(page);
      const want = { 'pdmx-a1.zip': sizeOf('a1'), 'pdmx-a2.zip': sizeOf('a2'), 'pdmx-a3.zip': sizeOf('a3') };
      const rows = await page.locator('#lib-list .lib-item').count();
      ok('full set: before setup, the tab offers it (the two choices and Pick the zip files…)', /Piano, lead sheets and melodies/.test(before) && /Everything/.test(before) && /Pick the zip files/.test(before), before.slice(0, 120));
      ok('full set: setup copies the three pdmx-a zips whole into the app’s storage, and the tab lists rows', shown && Object.entries(want).every(([n, s]) => files?.[n]?.size === s) && rows > 0, JSON.stringify({ files, want, rows }));

      // Default: piano, most viewed first; the broken and junk ones hidden, the chip says how many; labels on rows.
      const piano = listOf('piano');
      const hiding = piano.rows.filter((r) => piano.flagsOf(r).some((x) => HIDING.includes(x)));
      let d = await lib(page);
      const views = d.shown.map((r) => r.views);
      const link = await page.locator('.lib-countline .lib-hidden').innerText();
      const chipTexts = await page.evaluate(() => [...document.querySelectorAll('#lib-chips .lib-chip')].map((c) => c.textContent).join(' | '));
      ok('full set: opens on piano, most viewed first, none of the hidden flags shown', d.kinds.join() === 'piano' && d.shown.every((r) => r.kind === 'piano') && views.every((v, i) => i === 0 || v <= views[i - 1])
        && d.shown.every((r) => !r.flags.some((x) => HIDING.includes(x))) && d.shownCount === piano.rows.length - hiding.length, JSON.stringify({ kinds: d.kinds, shownCount: d.shownCount, files: piano.rows.length, hiding: hiding.length, first: d.shown.slice(0, 3) }));
      ok('full set: the count line says how many files are hidden, as a link (owner, 2026-10-15: not a chip)', d.hidden === hiding.length && link === `${hiding.length} hidden files ›` && !/hidden/.test(chipTexts), `${link}; chips: ${chipTexts}; ${d.hidden} of ${hiding.length}`);
      // One count (P12): the tab's number is the list's with every kind and nothing filtered; thousands separated.
      await page.evaluate(() => document.querySelector('#lib-chips .lib-chip.on .lib-chip-x').click()); await listed(page); await page.waitForTimeout(500);
      const every = await page.evaluate(() => ({ badge: document.querySelector('#lib-tab-full small').textContent, count: document.querySelector('.lib-countline').textContent }));
      ok('full set: the tab’s number is the number of pieces the list shows with every kind (P12)', every.count.startsWith(`${every.badge} pieces`), JSON.stringify(every));
      // Title A–Z (P11): files with no title last.
      await tap(page, '#lib-sort'); await page.waitForTimeout(300);
      await tap(page, '#lib-sheet .lib-opt', 1); await page.waitForTimeout(800); // (Title A–Z)
      const az = await lib(page);
      const order = await page.evaluate(() => {
        const has = (t) => /[\p{L}\p{N}]/u.test(t), key = (t) => t.replace(/^[^\p{L}\p{N}]+/u, ''), c = new Intl.Collator().compare;
        const t = window.__pianoDebug.library().shown.map((r) => r.title).filter(has);
        return { first: t.slice(0, 4), sorted: t.every((x, n) => n === 0 || c(key(t[n - 1]), key(x)) <= 0), shown: [...document.querySelectorAll('#lib-list .lib-tt')].slice(0, 6).map((x) => x.textContent) };
      });
      ok('full set: Title A–Z sorts from the first letter or digit (leading punctuation skipped) and opens on a real title (P15)', order.sorted && order.shown.length > 0 && order.shown.every((x) => /[\p{L}\p{N}]/u.test(x) && x !== 'No title'), JSON.stringify(order));
      const noWord = ['piano', 'lead', 'melody', 'parts'].flatMap((k) => { const l = listOf(k); return l.rows.filter((r) => !/[\p{L}\p{N}]/u.test(r[l.c.title] ?? '')).map((r) => [r[l.c.title], l.flagsOf(r)]); });
      ok('full set: every title with no letter or digit is flagged "no title" by full_set.py (P15)', noWord.every(([, f]) => f.includes('notitle')), JSON.stringify(noWord.filter(([, f]) => !f.includes('notitle')).slice(0, 5)));
      ok('full set: Title A–Z puts files with no title last (P11)', az.firstUntitled > 0 && az.lastTitled < az.firstUntitled && az.untitled > 0, JSON.stringify({ firstUntitled: az.firstUntitled, lastTitled: az.lastTitled, untitled: az.untitled }));
      await tap(page, '#lib-sort'); await page.waitForTimeout(300);
      await tap(page, '#lib-sheet .lib-opt', 0); await page.waitForTimeout(500); // (back to most viewed)
      await tap(page, '#lib-chips .lib-chip'); await page.waitForTimeout(300);
      await tap(page, '#lib-sheet .lib-opt', 0); await page.waitForTimeout(200); // (piano again)
      await tap(page, '#lib-sheet-show'); await listed(page); await page.waitForTimeout(400);
      // A row with a labelled flag (one staff empty, notes outside the piano, no title): found by searching its title.
      const legend = piano.flags;
      const labelled = piano.rows.find((r) => { const f = piano.flagsOf(r); return f.some((x) => ['hand', 'range'].includes(x)) && !f.some((x) => HIDING.includes(x)) && r[piano.c.title]; });
      await tap(page, '#lib-search');
      await page.keyboard.type(labelled[piano.c.title]); await page.waitForTimeout(700);
      const label = await page.evaluate((id) => { const rows = [...document.querySelectorAll('#lib-list .lib-item')]; return rows.map((li) => li.querySelector('.lib-flags')?.textContent ?? '').join(' | '); }, labelled[piano.c.id]);
      const words = piano.flagsOf(labelled).filter((x) => ['hand', 'range', 'notitle'].includes(x)).map((x) => legend[x]);
      ok('full set: a row is labelled with its flags in the list’s words', words.length > 0 && words.every((w) => label.includes(w)), `${labelled[piano.c.title]}: ${label} (want ${words.join(', ')})`);
      await page.fill('#lib-search', ''); await page.waitForTimeout(500);
      // Show one hidden flag: those files come back, labelled.
      await tap(page, '.lib-countline .lib-hidden'); await page.waitForTimeout(300);
      await tap(page, '#lib-sheet .lib-opt'); await page.waitForTimeout(400); // (the first: most bars empty)
      await tap(page, '#lib-sheet-show'); await page.waitForTimeout(400);
      d = await lib(page);
      const empties = piano.rows.filter((r) => { const f = piano.flagsOf(r); return f.includes('empty') && !f.some((x) => x !== 'empty' && HIDING.includes(x)); }).length;
      const emptyLabel = await page.evaluate((w) => [...document.querySelectorAll('#lib-list .lib-flags')].some((x) => x.textContent.includes(w)), legend.empty);
      const shownLine = await page.evaluate(() => document.querySelector('.lib-countline').textContent);
      ok('full set: the link’s sheet shows a hidden flag’s files again, labelled', d.shownCount === piano.rows.length - hiding.length + empties && (empties === 0 || emptyLabel), JSON.stringify({ shownCount: d.shownCount, empties, emptyLabel }));
      ok('full set: the count line counts the flagged files shown and still hidden in files (P05)', new RegExp(`${empties} flagged files? shown, ${hiding.length - empties} hidden ›`).test(shownLine), shownLine);
      await tap(page, '.lib-countline .lib-hidden'); await page.waitForTimeout(300);
      await tap(page, '#lib-sheet-clear'); await tap(page, '#lib-sheet-show'); await page.waitForTimeout(400); // (hidden again)

      // Search: every row shown has each word at the start of a word of its title or composer, and the piece sought is there.
      const groupSize = (g) => piano.rows.filter((r) => r[piano.c.group] === g).length;
      // (a piece not in the catalogue: its + Add can only have read the copied zip)
      const catalogue = JSON.parse(readFileSync(here('../public/catalogue/index.json'), 'utf8'));
      const inCatalogue = new Set(catalogue.rows.map((r) => r[catalogue.fields.indexOf('id')]));
      const target = piano.rows.find((r) => !piano.flagsOf(r).some((x) => HIDING.includes(x)) && /^[a-z]{5,}/i.test(r[piano.c.title]) && groupSize(r[piano.c.group]) === 1 && !inCatalogue.has(r[piano.c.id]));
      const both = piano.rows.find((r) => !piano.flagsOf(r).some((x) => HIDING.includes(x)) && inCatalogue.has(r[piano.c.id]) && groupSize(r[piano.c.group]) === 1);
      const word = target[piano.c.title].slice(0, 5).toLowerCase();
      await tap(page, '#lib-search');
      await page.keyboard.type(word); await page.waitForTimeout(700);
      d = await lib(page);
      const fold = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
      const hit = (r) => fold(`${r.title} ${r.composer}`).split(/[^\p{L}\p{N}]+/u).some((w) => w.startsWith(word));
      const id = `u-${target[piano.c.id]}`;
      const expect = piano.rows.filter((r) => !piano.flagsOf(r).some((x) => HIDING.includes(x)) && hit({ title: r[piano.c.title], composer: r[piano.c.composer] ?? '' })).length;
      ok('full set: search finds the piece, and exactly the rows whose title or composer has a word starting so', d.shown.some((r) => r.id === id) && d.shown.every(hit) && d.shownCount === expect && expect < piano.rows.length,
        `“${word}”: ${d.shownCount} rows (expected ${expect}); ${JSON.stringify(d.shown.slice(0, 4).map((r) => r.title))}`);

      // Open plays it without adding it; its choices are kept by its id.
      await tap(page, `#lib-list li[data-id="${id}"] .lib-row`); await page.waitForTimeout(1500);
      const pageText = await page.evaluate(() => document.getElementById('lib-page').innerText);
      ok('full set: a row’s page has the facts, the first bars drawn, the plain note, + Add and Open', /Not picked or checked/.test(pageText) && /Views/.test(pageText) && /\+ Add/.test(pageText) && /Open/.test(pageText)
        && await page.evaluate(() => !!document.querySelector('#lib-page .lib-preview svg')), pageText.slice(0, 200));
      await tap(page, '#lib-page .lib-buttons .btn', 1); await page.waitForTimeout(2500); // Open
      const opened = await page.evaluate(() => ({ showing: window.__pianoDebug.showing(), notes: window.__pianoDebug.notes() }));
      await page.mouse.click(5, 5); await page.waitForTimeout(200);
      await tap(page, '#play');
      let playing = false;
      for (let i = 0; i < 24 && !playing; i++) { await page.waitForTimeout(250); playing = await page.evaluate(() => window.__pianoDebug.sound().playing); }
      await tap(page, '#play'); await page.waitForTimeout(300);
      await page.evaluate(() => document.getElementById('tempo').showModal()); await page.waitForTimeout(200);
      await tap(page, '#t-up'); await page.waitForTimeout(200);
      await page.evaluate(() => document.getElementById('tempo').close());
      const saved = await page.evaluate((id) => JSON.parse(localStorage.getItem('piano-web.songs.v1') ?? '{}')[id]?.speed, id); // (a song's tempo: songs.v1, by piece id)
      let recs = await records(page);
      ok('full set: Open plays it on the score screen without adding it to your library', opened.showing === 'score' && opened.notes > 0 && playing && !recs[id], JSON.stringify({ opened, playing, record: recs[id] }));
      ok('full set: its choices (a tempo changed) are kept by its id', saved > 1, `${id}: speed ${saved}`);
      await page.reload(); await page.waitForTimeout(3000);
      const back = await page.evaluate(() => ({ showing: window.__pianoDebug.showing(), notes: window.__pianoDebug.notes(), url: location.search }));
      ok('full set: a reload comes back to the piece opened from the full set', back.showing === 'score' && back.notes > 0 && back.url.includes(id), JSON.stringify(back));
      await page.mouse.click(5, 300); await page.waitForTimeout(200); // (the first tap: Tap anywhere to start)
      await tap(page, '#score-back'); await page.waitForTimeout(1200);
      const after = await page.evaluate(() => ({ showing: window.__pianoDebug.showing(), tab: window.__pianoDebug.library().tab, search: document.getElementById('lib-search').value }));
      ok('full set: after that reload, ← comes back to Full PDMX with its search (P07)', after.showing === 'library' && after.tab === 'full' && after.search === word, JSON.stringify(after));

      // + Add, tapped twice: added once, in Yours, with the catalogue's record and provenance.
      await fullTab(page);
      await listed(page);
      await page.fill('#lib-search', word); await page.waitForTimeout(700);
      const add = `#lib-list li[data-id="${id}"] .lib-addcat`;
      await tap(page, add); await page.waitForTimeout(80);
      await tap(page, add).catch(() => {}); await page.waitForTimeout(2000);
      recs = await records(page);
      const ownIds = Object.entries(recs).filter(([, v]) => v).map(([k]) => k);
      const button = await page.locator(add).innerText();
      await tap(page, '#lib-tab-yours'); await page.waitForTimeout(600);
      const yours = (await lib(page)).items.map((x) => x.id);
      ok('full set: + Add tapped twice adds it once, with the catalogue’s record (origin, PDMX source, licence)', ownIds.length === 1 && ownIds[0] === id && recs[id].origin === 'catalogue' && /PDMX/.test(recs[id].source) && recs[id].licence === target[piano.c.licence] && /Added/.test(button),
        JSON.stringify({ ownIds, rec: recs[id], button }));
      ok('full set: the added piece is in Yours, under the same id', yours.includes(id), id);
      // A piece in both the catalogue and the full set is one piece: added from the full set, the catalogue has it too.
      const bothId = `u-${both[piano.c.id]}`;
      await tap(page, '#lib-tab-full'); await page.waitForTimeout(500);
      await page.fill('#lib-search', both[piano.c.title]); await page.waitForTimeout(700);
      await tap(page, `#lib-list li[data-id="${bothId}"] .lib-addcat`); await page.waitForTimeout(2000);
      await tap(page, '#lib-tab-catalogue'); await page.waitForTimeout(500);
      await page.fill('#lib-search', both[piano.c.title]); await page.waitForTimeout(700);
      const inCat = await page.evaluate((id) => document.querySelector(`#lib-list li[data-id="${id}"] .lib-addcat`)?.textContent ?? 'not listed', bothId);
      ok('full set: a piece in both the catalogue and the full set is one piece (added from the full set, the catalogue shows it added)', /Added/.test(inCat), `${both[piano.c.title]} (${bothId}): ${inCat}`);

      // Remove (Settings → Saved for offline): its size said; gone from storage; the tab offers setup again; the added piece stays.
      await settingsPage(page); await page.waitForTimeout(500);
      const size = await page.evaluate(async () => ({ shown: !document.getElementById('set-full').hidden, text: document.getElementById('set-full-size').textContent, cleanup: document.getElementById('set-full-cleanup').hidden ? '' : document.getElementById('set-full-cleanup').textContent, persisted: await navigator.storage.persisted() }));
      ok('full set: Settings says the browser may delete the copy, while its storage is not kept safe (owner, 2026-10-15)', !size.persisted && /may delete this copy when the phone runs low on space\. Installing the app keeps it\./.test(size.cleanup), JSON.stringify(size));
      await tap(page, '#set-full-remove'); await page.waitForTimeout(800);
      const gone = await opfs(page);
      await fullTab(page);
      const again = await setupText(page);
      await tap(page, '#lib-tab-yours'); await page.waitForTimeout(500);
      const kept = (await lib(page)).items.some((x) => x.id === id);
      ok('full set: Settings says how big it is (MB) and Remove takes it off the phone', size.shown && /MB|GB/.test(size.text) && gone === null, JSON.stringify({ size, gone }));
      ok('full set: after Remove the tab offers setup again, and the piece added from it stays in Yours', /Pick the zip files/.test(again) && kept, again.slice(0, 80));
      ok('full set (setup, view, search, Open, Add, Remove): no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    });

    // Not enough room (estimate mocked): said plainly, nothing copied.
    await guard('not enough room', async () => {
      const { ctx, page, errors } = await phone({ init: () => { navigator.storage.estimate = async () => ({ quota: 4_000_000, usage: 3_000_000 }); } });
      await fullTab(page);
      await pickZips(page, zipsOf('a1', 'a2', 'a3')); await page.waitForTimeout(2000);
      const text = await setupText(page), files = await opfs(page);
      const zips = Object.keys(files ?? {}).filter((n) => n.endsWith('.zip') && files[n].size > 0);
      ok('full set: not enough room is said and nothing is copied', /Not enough room/.test(text) && /Nothing was copied/.test(text) && zips.length === 0, JSON.stringify({ text: text.slice(-200), files }));
      ok('full set (no room): no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    });

    // Music's own + Add given a zip of the set (P06): said plainly, nothing added.
    await guard('a set zip through + Add', async () => {
      const { ctx, page, errors } = await phone();
      await library(page);
      const [chooser] = await Promise.all([page.waitForEvent('filechooser', { timeout: 5000 }), tap(page, '#lib-add')]);
      await chooser.setFiles(zipsOf('a1')); await page.waitForTimeout(2000);
      const said = await page.evaluate(() => (document.getElementById('lib-added').open ? document.getElementById('lib-added').innerText : document.getElementById('lib-toast').innerText));
      ok('full set: a set zip picked with Music’s + Add says to use Full PDMX → Pick the zip files…, nothing added (P06)', /This is a Full PDMX zip: use Full PDMX → Pick the zip files…/.test(said) && Object.values(await records(page)).filter(Boolean).length === 0, said.slice(0, 200));
      ok('full set (+ Add a set zip): no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    });
    // The clean-up risk before copying, in a browser tab only (owner, 2026-10-15); the installed app's setup says nothing of it.
    await guard('the clean-up line', async () => {
      const tabSetup = await phone();
      await fullTab(tabSetup.page);
      const inTab = await setupText(tabSetup.page);
      await tabSetup.ctx.close();
      const appSetup = await phone({ init: () => { window.__pianoInstalled = true; } });
      await fullTab(appSetup.page);
      const inApp = await setupText(appSetup.page);
      const LINE = 'Your browser may delete this copy when the phone runs low on space. Installing the app keeps it.';
      ok('full set: in a browser tab the setup says the browser may delete the copy, and not that it was kept safe; the installed app’s does not say it', inTab.includes(LINE) && !/asked to be kept safe/.test(inTab) && !inApp.includes(LINE) && /Pick the zip files/.test(inApp), JSON.stringify({ inTab: inTab.slice(0, 600), inApp: inApp.slice(0, 80) }));
      await appSetup.ctx.close();
    });

    // Files the setup refuses (docs/tests.md: test the refusals): not one of the set's zips, and a several-parts zip
    // picked for piano + lead sheets + melodies. Each said; nothing copied.
    await guard('refusals', async () => {
      const { ctx, page, errors } = await phone();
      await fullTab(page);
      await pickZips(page, [SCORE, ...zipsOf('b1')]); await page.waitForTimeout(1500);
      const text = await setupText(page), files = await opfs(page);
      const zips = Object.keys(files ?? {}).filter((n) => n.endsWith('.zip') && files[n].size > 0);
      ok('full set: a small file’s size is in KB, not "1 MB" (P03)', /mozart-k2\.musicxml · \d+ KB · not copied/.test(text) && !/1 MB/.test(text), text.slice(-300));
      ok('full set: a file that is not one of the set’s zips, and a several-parts zip not chosen, are each said and not copied', /“mozart-k2\.musicxml” is not one of the full PDMX set’s zip files\./.test(text) && /pdmx-b1\.zip holds several-part scores, which you didn’t choose/.test(text) && /Nothing to copy/.test(text) && zips.length === 0,
        JSON.stringify({ text: text.slice(-300), files }));
      ok('full set (refusals): no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    });

    // A copy that fails part way: the others copied, that one left uncopied; picked again, only it is copied.
    await guard('a copy interrupted', async () => {
      const { ctx, page, errors } = await phone({ init: () => { window.__pianoCopyHold = (name, done) => { if (name === 'pdmx-a2.zip' && done > 100000 && !window.__failedOnce) { window.__failedOnce = true; throw new Error('the copy was interrupted'); } }; } });
      await fullTab(page);
      await pickZips(page, zipsOf('a1', 'a2', 'a3')); await page.waitForTimeout(3000);
      const text = await setupText(page), files = await opfs(page);
      ok('full set, a copy interrupted: said, the setup stays, the other two zips copied whole, the broken one not kept', /could not be copied/.test(text) && /Still to copy: pdmx-a2\.zip/.test(text)
        && files?.['pdmx-a1.zip']?.size === sizeOf('a1') && files?.['pdmx-a3.zip']?.size === sizeOf('a3') && (files?.['pdmx-a2.zip']?.size ?? 0) !== sizeOf('a2'), JSON.stringify({ text: text.slice(-260), files }));
      await page.waitForTimeout(50);
      await pickZips(page, zipsOf('a1', 'a2', 'a3'));
      const shown = await listed(page);
      const after = await opfs(page);
      ok('full set, resumed: picking all three again copies only the one that failed (the others untouched), then lists', shown && after['pdmx-a2.zip'].size === sizeOf('a2') && after['pdmx-a1.zip'].at === files['pdmx-a1.zip'].at && after['pdmx-a3.zip'].at === files['pdmx-a3.zip'].at,
        JSON.stringify({ before: files, after }));
      ok('full set (interrupted copy): no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    });
    // The page closed in the middle of a copy (held there), then opened again: the zip copied before is kept, the rest asked for.
    await guard('closed mid-copy', async () => {
      const { ctx, page, errors } = await phone({ init: () => { window.__pianoCopyHold = (name, done) => { if (name === 'pdmx-a2.zip' && done > 100000 && !sessionStorage.getItem('held')) { sessionStorage.setItem('held', '1'); return new Promise(() => {}); } }; } });
      await fullTab(page);
      await pickZips(page, zipsOf('a1', 'a2', 'a3'));
      const holding = await until(page, () => sessionStorage.getItem('held') === '1', null, 10000);
      await page.reload(); await page.waitForTimeout(1500);
      await fullTab(page);
      const text = await setupText(page);
      ok('full set, closed mid-copy: on opening again the first zip is kept and the other two are asked for', holding && /Copied: pdmx-a1\.zip/.test(text) && /Still to copy: pdmx-a2\.zip, pdmx-a3\.zip/.test(text), text.slice(-220));
      await pickZips(page, zipsOf('a2', 'a3'));
      const shown = await listed(page);
      ok('full set, closed mid-copy: the two picked again are copied and the tab lists rows', shown, '');
      ok('full set (closed mid-copy): no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    });

    // Offline after setup, in a browser tab (the offline cache allowed, the app not installed), the network cut.
    await guard('offline', async () => {
      const { ctx, page, errors } = await phone({ sw: true });
      await page.reload(); await page.waitForTimeout(2000); // (the second load goes through the service worker, which keeps what the page fetches)
      await fullTab(page);
      await pickZips(page, zipsOf('a1', 'a2', 'a3'));
      await listed(page);
      await tap(page, '#lib-list .lib-row'); await page.waitForTimeout(2000); // (online once: the page's drawing code fetched)
      await ctx.setOffline(true);
      await page.reload(); await page.waitForTimeout(2500);
      await fullTab(page);
      const shown = await listed(page);
      await tap(page, '#lib-list .lib-row'); await page.waitForTimeout(2500);
      const drawn = await page.evaluate(() => !!document.querySelector('#lib-page .lib-preview svg'));
      await tap(page, '#lib-page .lib-buttons .btn', 1); await page.waitForTimeout(3000);
      const opened = await page.evaluate(() => ({ online: navigator.onLine, showing: window.__pianoDebug.showing(), notes: window.__pianoDebug.notes() }));
      ok('full set offline (a tab, network cut after setup): the tab lists rows, a page draws its first bars, Open draws the score', shown && drawn && !opened.online && opened.showing === 'score' && opened.notes > 0, JSON.stringify({ shown, drawn, opened }));
      ok('full set (offline): no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    });

    // Everything (pdmx-b added later): the Kind chip offers several parts, and their page has the usual warning.
    await guard('several parts', async () => {
      const { ctx, page, errors } = await phone();
      await fullTab(page);
      await pickZips(page, zipsOf('a1', 'a2', 'a3')); await listed(page);
      await tap(page, '#lib-chips .lib-chip'); await page.waitForTimeout(300); // (the Kind sheet offers to add them)
      const kindsBefore = await page.evaluate(() => document.getElementById('lib-sheet').innerText);
      await tap(page, '#lib-sheet .lib-addparts'); await page.waitForTimeout(300);
      const adding = await setupText(page);
      await pickZips(page, zipsOf('b1', 'b2')); await listed(page);
      await tap(page, '#lib-chips .lib-chip'); await page.waitForTimeout(300);
      const options = await page.evaluate(() => [...document.querySelectorAll('#lib-sheet .lib-opt')].map((b) => b.textContent));
      await tap(page, '#lib-sheet .lib-opt.on'); await page.waitForTimeout(100); // piano off
      await tap(page, '#lib-sheet .lib-opt', 3); await page.waitForTimeout(100); // several parts on
      await tap(page, '#lib-sheet-show'); await page.waitForTimeout(1500);
      const d = await lib(page);
      await tap(page, '#lib-list .lib-row'); await page.waitForTimeout(1500);
      const warn = await page.evaluate(() => document.getElementById('lib-page').innerText);
      ok('full set: several parts added later (Add several parts… in the Kind sheet): the Kind chip offers them and lists only them', /Add several parts/.test(kindsBefore) && /several-part/.test(adding) && options.includes('several parts') && d.kinds.join() === 'parts' && d.shown.length > 0 && d.shown.every((r) => r.kind === 'parts'), JSON.stringify({ options, kinds: d.kinds, n: d.shownCount }));
      ok('full set: a several-part piece’s page has the warning (the top staff as the right hand)', /takes the top staff as your right hand/.test(warn), warn.slice(0, 200));
      ok('full set (several parts): no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    });
  }
  // ---- Fix round of the final reviews (2026-10-15; design/2026-10-15-final-review/fixes.md) -------------------------
  // Each case was run against the build before the fixes (7aba56a3, served elsewhere, --url) and failed there, then
  // passed here. Taps go by position (Playwright's click lands at the element's place and fails if something else lies
  // on top), in a plain phone tab: touch, no MIDI permission; where a keyboard is the point, the stand-in MIDI keyboard
  // (window.__key) with one input, or with none (MIDI allowed, no keyboard connected).
  {
    const fakeKeys = (n) => {
      const input = { id: 'test-keys', name: 'Test keys', state: 'connected', onmidimessage: null };
      const access = { inputs: new Map(n ? [[input.id, input]] : []), outputs: new Map(), onstatechange: null };
      Object.defineProperty(Navigator.prototype, 'requestMIDIAccess', { value: async () => access, configurable: true });
      window.__key = (midi, on) => input.onmidimessage?.({ data: new Uint8Array([on ? 0x90 : 0x80, midi, on ? 90 : 0]), timeStamp: performance.now() });
    };
    /** A phone tab at url: keys undefined, no MIDI permission (a plain tab); a number, the stand-in keyboard with that many inputs. */
    async function phone(url, { keys, viewport = { width: 390, height: 844 }, route, mobile = false } = {}) {
      const ctx = await browser.newContext({ viewport, hasTouch: true, isMobile: mobile, serviceWorkers: 'block' });
      const page = await ctx.newPage();
      if (keys !== undefined) await page.addInitScript(fakeKeys, keys);
      if (route) await route(page);
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('dialog', (d) => d.accept());
      await page.goto(url); await page.waitForTimeout(1800);
      return { ctx, page, errors };
    }
    const wait = (page, ms) => page.waitForTimeout(ms);
    const tapOn = async (page, sel, hasText) => { await page.locator(sel, hasText ? { hasText } : {}).first().click({ timeout: 8000 }); await wait(page, 400); };
    const scoreReady = (page) => page.waitForFunction(() => window.__pianoDebug?.state().steps > 0, null, { timeout: 30000 });
    /** The first tap (opened straight into a screen, nothing has been tapped: V31), on the music. */
    const firstTap = async (page) => { await page.mouse.click(195, 330); await wait(page, 400); };
    /** The score's bars back, if they faded (a tap on the music brings them). */
    const barsUp = async (page) => { if (await page.evaluate(() => document.getElementById('top-bar').classList.contains('faded'))) { await page.mouse.click(195, 330); await wait(page, 300); } };
    const where = (page) => page.evaluate(() => ({ nav: window.__pianoDebug.nav(), ...window.__pianoDebug.shell(), screen: window.__pianoDebug.showing(), url: location.search }));
    const said = (page) => page.evaluate(() => document.getElementById('message')?.textContent ?? '');
    const back = async (page) => { await page.evaluate(() => history.back()); await wait(page, 900); };
    const log = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('piano-web.log.v1') ?? '{"entries":[]}').entries);
    const chord = async (page, keys, ms = 80) => { await page.evaluate((ks) => { for (const k of ks) window.__key(k, true); }, keys); await wait(page, ms); await page.evaluate((ks) => { for (const k of ks) window.__key(k, false); }, keys); };
    const NO_KEYS = 'No MIDI keyboard found: this mode listens to one. Plug it in, or choose Wait for me to play on the keys below.'; // (one phrase family: the consistency pass, 2026-10-16)

    // F15: a step's run logged, then a reload (a phone reopening the tab), then ←: the run counts for the step.
    {
      const { ctx, page, errors } = await phone(`${BASE}?page=lesson&lesson=test-minuet-opening`, { keys: 1 });
      await tapOn(page, '.les-step[data-step="wait-rh"] .btn'); await scoreReady(page); await wait(page, 1500);
      // Wait for me round bars 1–4, right hand: its notes played until the marker goes round the loop.
      let went = false, last = await page.evaluate(() => window.__pianoDebug.state().step);
      for (let i = 0; i < 90 && !went; i++) {
        const keys = await page.evaluate(() => window.__pianoDebug.struck(window.__pianoDebug.state().step, 'right'));
        if (keys.length) await chord(page, keys);
        await wait(page, 300);
        const now = await page.evaluate(() => window.__pianoDebug.state().step);
        if (now < last) went = true;
        last = now;
      }
      await page.mouse.click(195, 330); await wait(page, 800); // a tap on the music: ■
      const logged = (await log(page)).filter((e) => e.lesson?.step === 'wait-rh');
      await page.reload(); await wait(page, 3500);
      const reopened = await where(page);
      await back(page); await wait(page, 600);
      const result = await page.evaluate(() => ({ h: document.querySelector('#lesson-body .les-result .h')?.textContent ?? '', s: [...document.querySelectorAll('#lesson-body .les-result .s')].map((e) => e.textContent).join(' | '),
        done: !!JSON.parse(localStorage.getItem('piano-web.path.v1') ?? '{}').done?.['test-minuet-opening']?.['wait-rh'] }));
      ok('F15: the run went round bars 1–4 and was logged with the step before the reload', went && logged.length === 1 && logged[0].result.rounds >= 1, JSON.stringify(logged.map((e) => e.result)));
      ok('F15: reloaded into the step, then ←: the run before the reload counts (played through, step done)', reopened.screen === 'score' && /Played through/.test(result.h) && result.done, `${JSON.stringify(reopened)}; ${JSON.stringify(result)}`);
      ok('F15: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // F08: a reload into Memorise with its score slow to arrive (held 4 s), and Back before it arrives: Memorise stays shut.
    {
      const hold = async (page) => page.route('**/scores/chopin-op28-4.musicxml', async (route) => { await new Promise((r) => setTimeout(r, 4000)); await route.continue(); });
      const { ctx, page, errors } = await phone(`${BASE}?tab=music&piece=chopin-op28-4&tool=memorise`, { route: hold });
      await back(page); // (1.8 s in: the file is still held)
      await wait(page, 5000);
      const w = await where(page), memo = await page.evaluate(() => document.body.classList.contains('memorising') || !document.getElementById('memo-head').hidden);
      ok('F08: Back while Memorise loads its piece: the Music tab shows and Memorise stays shut', w.screen !== 'memorise' && !memo && w.tab === 'music' && !w.nav.includes('memorise'), `${JSON.stringify(w)}; memorise shown ${memo}`);
      ok('F08: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // F01: Edit fingering, then Back without Done, then another piece from Music: it opens with its play controls.
    {
      const { ctx, page, errors } = await phone(`${BASE}?piece=mozart-k2`);
      await scoreReady(page); await firstTap(page); await barsUp(page);
      await tapOn(page, '#open-more'); await tapOn(page, '#edit-marks');
      const editing = await page.evaluate(() => !document.getElementById('marks-bar').hidden);
      await back(page);
      await tapOn(page, '#tabs [data-tab="music"]'); await wait(page, 1000);
      await tapOn(page, '.lib-row', 'Chorale'); await wait(page, 2500);
      const st = await page.evaluate(() => ({ title: document.getElementById('song-title').textContent, marks: !document.getElementById('marks-bar').hidden, bottom: !document.getElementById('bottom-bar').hidden }));
      ok('F01: fingering mode ends with the piece: the next piece shows its play controls, not "Tap a note, then a finger"', editing && /Chorale/.test(st.title) && !st.marks && st.bottom, `editing first ${editing}; ${JSON.stringify(st)}`);
      ok('F01: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // F9 (interfaces) and F02: two Play along runs with the stand-in keyboard. The first, stopped by a tap on the music,
    // logs the bars it went through; the second, ended by Loop while it runs (the bars are away while it plays: Loop is
    // reached as a focused button's Enter would, by its click), shows its summary and is logged too.
    {
      const { ctx, page, errors } = await phone(`${BASE}?piece=mozart-k2`, { keys: 1 });
      await scoreReady(page); await firstTap(page);
      await page.selectOption('#q-mode', 'along'); await wait(page, 400);
      const run = async (ms) => {
        await barsUp(page); await tapOn(page, '#play');
        for (let t = 0; t < ms; t += 250) { const keys = await page.evaluate(() => window.__pianoDebug.struck(window.__pianoDebug.state().step)); if (keys.length) await chord(page, keys, 60); await wait(page, 190); }
      };
      await run(5000);
      await page.mouse.click(195, 330); await wait(page, 1000); // ■ by a tap on the music
      const first = (await log(page)).filter((e) => e.screen === 'score');
      await page.evaluate(() => document.getElementById('rs-close').click()); await wait(page, 300); // (the strip: 2026-10-16)
      await run(2500);
      await page.evaluate(() => document.getElementById('q-loop').click()); await wait(page, 1000);
      const summary = await page.evaluate(() => !document.getElementById('run-strip').hidden);
      const second = (await log(page)).filter((e) => e.screen === 'score');
      const r = first[0]?.result ?? {};
      ok('F9: a Play along run with no loop logs the bars it went through (from bar 1 to the bar reached)', first.length === 1 && r.fromBar === 1 && r.toBar >= 2 && r.notes > 0, JSON.stringify({ fromBar: r.fromBar, toBar: r.toBar, notes: r.notes }));
      ok('F02: Loop tapped during a Play along run: the summary shows and the run is logged', summary && second.length === 2 && second[1].mode === 'along' && second[1].result.notes > 0, `summary ${summary}; ${second.length} entries`);
      ok('F9/F02: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // F09: a MIDI piece with a band, its file replaced by one with no band: the band goes (no reload).
    {
      const { ctx, page, errors } = await phone(`${BASE}?tab=music`);
      const addMidi = async () => { await page.waitForSelector('#lib-midi[open]', { timeout: 20000 }); await page.waitForFunction(() => /Check/.test(document.getElementById('lib-midi-facts')?.textContent ?? ''), null, { timeout: 20000 }); await tapOn(page, '#lib-midi button[value="add"]'); await wait(page, 1500); };
      const bandParts = () => page.evaluate(() => { document.getElementById('tempo').showModal(); const r = { shown: !document.getElementById('t-band-set').hidden, parts: document.getElementById('t-band-parts').textContent }; document.getElementById('tempo').close(); return r; });
      await page.setInputFiles('#lib-file', BAND); await addMidi();
      await tapOn(page, '.lib-row', 'little band'); await scoreReady(page); await wait(page, 1500);
      const before = await bandParts();
      await back(page); await wait(page, 600);
      await page.locator('#lib-list li', { hasText: 'little band' }).first().locator('.lib-more').click(); await wait(page, 600);
      const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.locator('#lib-page button', { hasText: 'Replace file' }).first().click()]);
      await chooser.setFiles(MIDI); await addMidi();
      await tapOn(page, '#lib-page .btn.main', 'Open'); await scoreReady(page); await wait(page, 2000);
      const after = await bandParts();
      ok('F09: after Replace file… with a MIDI file with no band, the piece has no band', before.shown && /Bass/.test(before.parts) && !after.shown && after.parts === '', `before ${JSON.stringify(before)}; after ${JSON.stringify(after)}`);
      ok('F09: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // F18: Memorise on an exercise score (Melody 1), then a reload: Memorise again, not "no piece".
    {
      const { ctx, page, errors } = await phone(`${BASE}?tab=practice&page=exercises`);
      await wait(page, 1000);
      await tapOn(page, '#exercises-body .li', 'Melody 1'); await scoreReady(page); await wait(page, 1200);
      await barsUp(page); await tapOn(page, '#open-more'); await tapOn(page, '#open-memorise'); await wait(page, 2000);
      const opened = await where(page);
      await page.reload(); await wait(page, 4000);
      const w = await where(page), m = await said(page);
      ok('F18: Memorise on an exercise score comes back after a reload', opened.screen === 'memorise' && w.screen === 'memorise' && !/no piece/.test(m), `${JSON.stringify(opened)} → ${JSON.stringify(w)}; "${m}"`);
      ok('F18: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // F22 and F11: a lesson step's Drills (5 cards), Practise as… Simon and back: the step's 5 cards again, and the
    // address names the way on screen; and from Practice, Practise as… Simon then a reload: Simon.
    {
      const { ctx, page, errors } = await phone(`${BASE}?page=lesson&lesson=test-minuet-opening`, { keys: 1 });
      await tapOn(page, '.les-step[data-step="melody-cards"] .btn'); await wait(page, 3000);
      const now = () => page.evaluate(() => ({ cards: document.getElementById('ex-left').textContent, kind: document.getElementById('ex-kind').textContent, url: location.search }));
      const a = await now();
      await tapOn(page, '#ex-kind'); await tapOn(page, '#ex-as-dialog [data-as="simon"]'); await wait(page, 1500);
      const b = await now();
      await tapOn(page, '#ex-kind'); await tapOn(page, '#ex-as-dialog [data-as="drill"]'); await wait(page, 1500);
      const c = await now();
      ok('F22: a step’s Drills, Practise as… Simon and back to Drills: the step’s level again (5 cards, not your 10)', /of 5/.test(a.cards) && /Simon/.test(b.kind) && /Drills/.test(c.kind) && /of 5/.test(c.cards), `${a.cards} → ${b.kind} → ${c.kind} ${c.cards}`);
      ok('F11: Practise as… changes the address with the way on screen', /tool=drill/.test(a.url) && /tool=simon/.test(b.url) && /tool=drill/.test(c.url), `${a.url} → ${b.url} → ${c.url}`);
      ok('F22/F11: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
    {
      const { ctx, page, errors } = await phone(`${BASE}?tab=practice`, { keys: 1 });
      await tapOn(page, '[data-practice="Drills"]'); await wait(page, 2500);
      await tapOn(page, '#ex-kind'); await tapOn(page, '#ex-as-dialog [data-as="simon"]'); await wait(page, 1500);
      await page.reload(); await wait(page, 3500);
      const kind = await page.evaluate(() => document.getElementById('ex-kind').textContent), w = await where(page);
      ok('F11: Practise as… Simon, then a reload: Simon again', w.screen === 'exercise' && /Simon/.test(kind), `${kind} ${JSON.stringify(w)}`);
      ok('F11 reload: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // F05 and F13 on a step's result (lesson 3's Free play step, the quickest to play).
    {
      const { ctx, page, errors } = await phone(`${BASE}?page=lesson&lesson=test-chords-and-band`);
      await tapOn(page, '.les-step[data-step="free"] .btn'); await wait(page, 1000);
      await tapOn(page, '#fp-done'); await wait(page, 1000);
      const feedback = async () => (await log(page)).filter((e) => e.screen === 'lesson' && e.lesson?.step === 'free').map((e) => e.result.feedback);
      await tapOn(page, '.fb-b[data-v="hard"]'); const hard = await feedback();
      await tapOn(page, '.fb-b[data-v="hard"]'); const unHard = await feedback();
      await page.locator('.fb-note').fill('abc'); await wait(page, 300); const note = await feedback();
      await page.locator('.fb-note').fill(''); await wait(page, 300); const noNote = await feedback();
      ok('F05: feedback cleared tap by tap leaves nothing in the log (Hard, Hard off; a note, then deleted)', JSON.stringify(hard) === '[{"effort":"hard"}]' && unHard.length === 0 && JSON.stringify(note) === '[{"note":"abc"}]' && noNote.length === 0,
        `${JSON.stringify(hard)} → ${JSON.stringify(unHard)}; ${JSON.stringify(note)} → ${JSON.stringify(noNote)}`);
      // F13: Switch… on the result, then lesson 1: it takes the lesson page's place; Back goes to where that was opened from.
      const stackBefore = (await where(page)).nav;
      await tapOn(page, '#lesson-switch'); await wait(page, 600);
      const rows = await page.evaluate(() => [...document.querySelectorAll('#switch-body .li')].map((li) => ({ t: li.querySelector('.tt')?.textContent ?? '', b: li.querySelector('button')?.textContent ?? '' })));
      const here = rows.find((r) => /chords, then the band/.test(r.t));
      await tapOn(page, '#switch-body .li button', /^(Open|Revisit|Skip ahead)$/); // (lesson 1's: the first offered)
      await wait(page, 1500);
      const chosen = await where(page);
      await back(page);
      const after = await where(page);
      ok('F13: the sheet offers no "Open" for the lesson the result belongs to', !!here && here.b === '', JSON.stringify(rows));
      ok('F13: the chosen lesson takes the lesson page’s place, and Back goes to where that page was opened from', JSON.stringify(stackBefore) === '["lesson","result"]' && JSON.stringify(chosen.nav) === '["lesson"]' && /lesson=test-minuet-opening/.test(chosen.url) && after.nav.length === 0,
        `before ${JSON.stringify(stackBefore)}; chosen ${JSON.stringify(chosen)}; Back ${JSON.stringify(after)}`);
      ok('F05/F13: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // F16: Free play's big name for two keys: C3 + E5 is "major 3rd + 2 octaves" (as the column below), C4 + C5 "octave".
    {
      const { ctx, page, errors } = await phone(`${BASE}?tab=practice`, { keys: 1 });
      await tapOn(page, '[data-practice="Free play"]'); await wait(page, 800);
      const big = async (keys) => { await page.evaluate((ks) => { for (const k of ks) window.__key(k, true); }, keys); await wait(page, 200); const t = await page.evaluate(() => document.getElementById('fp-chord').textContent); await page.evaluate((ks) => { for (const k of ks) window.__key(k, false); }, keys); await wait(page, 200); return t; };
      const tenth = await big([48, 76]), octave = await big([60, 72]), third = await big([60, 64]);
      ok('F16: two keys named as the Intervals column names them: C3+E5 "major 3rd + 2 octaves", C4+C5 "octave", C4+E4 "major 3rd"', tenth === 'major 3rd + 2 octaves' && octave === 'octave' && third === 'major 3rd', `"${tenth}", "${octave}", "${third}"`);
      ok('F16: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // F20: a set file that can't be had the first time Drills opens is there the next time.
    {
      let failing = true;
      const flaky = (page) => page.route('**/content/sets/chords-c.json', async (route) => { if (failing) await route.abort('internetdisconnected'); else await route.continue(); });
      const { ctx, page, errors } = await phone(`${BASE}?tab=practice`, { keys: 1, route: flaky });
      const sets = () => page.evaluate(() => [...document.querySelectorAll('#ex-set option')].map((o) => o.value));
      await tapOn(page, '[data-practice="Drills"]'); await wait(page, 3000);
      const first = await sets();
      failing = false;
      await back(page);
      await tapOn(page, '[data-practice="Drills"]'); await wait(page, 3000);
      const second = await sets();
      ok('F20: a set that failed to load once is read again the next time Drills opens', !first.includes('chords-c') && first.length > 0 && second.includes('chords-c'), `first ${first}; second ${second}`);
      ok('F20: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // F17: no MIDI keyboard. A plain phone tab (MIDI never allowed) and one with MIDI allowed and none connected: Play
    // along and Rhythm say so plainly and start nothing; the browser's own sentence never shows. Drills' Ready says it.
    {
      const tries = {};
      for (const [name, keys] of [['not allowed', undefined], ['none connected', 0]]) {
        const { ctx, page, errors } = await phone(`${BASE}?piece=mozart-k2`, { keys });
        await scoreReady(page); await firstTap(page);
        for (const mode of ['along', 'rhythm']) {
          await page.selectOption('#q-mode', mode); await wait(page, 400);
          await barsUp(page); await tapOn(page, '#play'); await wait(page, 4500);
          tries[`${name} ${mode}`] = { said: await said(page), button: await page.evaluate(() => document.getElementById('play').textContent) };
        }
        if (errors.length) tries[`${name} errors`] = errors;
        await ctx.close();
      }
      ok('F17: Play along and Rhythm with no keyboard (not allowed, or none connected) say so plainly and start nothing', Object.entries(tries).every(([k, v]) => !/errors/.test(k) && v.said === NO_KEYS && v.button === '▶'), JSON.stringify(tries));
      const ready = {};
      // (owner, 2026-10-15: the screen's keys play cards too, so it is said only with no keyboard and no keys shown: Nothing
      // under the music, help 3)
      const hide = () => { localStorage.setItem('piano-web.exercise-display.v1', JSON.stringify({ 'phone-upright': { under: 'nothing' } })); localStorage.setItem('piano-web.drills.v1', JSON.stringify({ level: { rung: 3 } })); };
      for (const [name, keys, init] of [['no keys shown, MIDI not allowed', undefined, hide], ['no keys shown, none connected', 0, hide], ['keys shown, no keyboard', undefined, undefined], ['no keys shown, a keyboard', 1, hide]]) {
        const { ctx, page } = await phone(`${BASE}?tab=practice`, { keys, route: init ? (p) => p.addInitScript(init) : undefined });
        await tapOn(page, '[data-practice="Drills"]'); await wait(page, 2500);
        ready[name] = await page.evaluate(() => document.getElementById('ex-status').textContent);
        await ctx.close();
      }
      const line = 'No MIDI keyboard found: choose Keyboard under the music (Level) to play on the screen, or plug one in.';
      ok('F17: Drills’ Ready says there is nothing to play on only with no keyboard and no keys on the screen (not with the keys shown, nor with a keyboard)', ready['no keys shown, MIDI not allowed'] === line && ready['no keys shown, none connected'] === line && ready['keys shown, no keyboard'] === '' && ready['no keys shown, a keyboard'] === '', JSON.stringify(ready));
    }

    // F12: the PDF reader has an address: a reload comes back to the PDF; Back from it is the Music tab.
    {
      const { ctx, page, errors } = await phone(`${BASE}?tab=music`);
      await page.setInputFiles('#lib-file', SHAPES); await wait(page, 2500);
      await tapOn(page, '.lib-row', 'three shapes'); await wait(page, 4000);
      const open = await where(page);
      await page.reload(); await wait(page, 5000);
      const again = await where(page), title = await page.evaluate(() => document.getElementById('pdf-title').textContent);
      await back(page); await wait(page, 500);
      const after = await where(page);
      ok('F12: a reload while reading a PDF comes back to it; Back is then the Music tab', open.screen === 'pdf' && /tool=pdf/.test(open.url) && again.screen === 'pdf' && /three shapes/.test(title) && after.tab === 'music' && !/tool=pdf/.test(after.url) && after.screen !== 'pdf',
        `${JSON.stringify(open)} → reload ${JSON.stringify(again)} "${title}" → Back ${JSON.stringify(after)}`);
      ok('F12: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // F14: sideways, just after + Add, the "Added" toast does not lie over the piece's page: Rename takes the tap.
    {
      const { ctx, page, errors } = await phone(`${BASE}?tab=music`, { viewport: { width: 844, height: 390 } });
      await page.setInputFiles('#lib-file', SCORE); await wait(page, 1500);
      const toast = await page.evaluate(() => !document.getElementById('lib-toast').hidden);
      const row = await page.evaluate(() => { const r = [...document.querySelectorAll('.lib-row')].find((x) => /added/.test(x.textContent)); if (!r) return null; const b = r.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
      if (row) { await page.mouse.click(row.x, row.y); await wait(page, 600); }
      const hit = await page.evaluate(() => {
        const b = [...document.querySelectorAll('#lib-page button')].find((x) => /Rename/.test(x.textContent)); if (!b) return { found: false };
        // (the page scrolled so that Rename stands at the toast's height, where the review's tap went)
        const t = document.getElementById('lib-toast').getBoundingClientRect(), r0 = b.getBoundingClientRect();
        document.getElementById('lib-page').scrollTop += (r0.top + r0.height / 2) - (t.top + t.height / 2);
        const r = b.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, top = document.elementFromPoint(x, y);
          return { found: true, onTop: top === b || b.contains(top) ? 'Rename' : `${top?.tagName}#${top?.id}.${top?.className}`, x, y, toastY: Math.round(t.top), toast: !document.getElementById('lib-toast').hidden };
      });
      if (hit.found) { await page.mouse.click(hit.x, hit.y); await wait(page, 500); }
      const dialog = await page.evaluate(() => !!document.querySelector('dialog[open]'));
      ok('F14: sideways with the "Added" toast showing, a tap on the piece’s Rename reaches it', toast && hit.found && hit.toast && hit.onTop === 'Rename' && dialog, `toast at first ${toast}; ${JSON.stringify(hit)}; dialog ${dialog}`);
      ok('F14: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // F19: a piece practised, then deleted: it leaves Home's recent list, and its old address never shows its id.
    {
      const { ctx, page, errors } = await phone(`${BASE}?tab=music`);
      const OWN = join(tmp, 'fix round piece.musicxml');
      writeFileSync(OWN, readFileSync(SCORE, 'utf8').replace('MENUETT No. 1 mit TRIO', 'Fix round piece'));
      await page.setInputFiles('#lib-file', OWN); await wait(page, 2000);
      const piece = await page.evaluate(() => window.__pianoDebug.pieces().find((p) => p.id.startsWith('u-')));
      await page.evaluate((p) => { const s = JSON.parse(localStorage.getItem('piano-web.log.v1') ?? '{"entries":[]}'); s.entries = s.entries ?? []; s.entries.push({ at: new Date().toISOString(), seconds: 30, screen: 'score', mode: 'wait', piece: p.id, title: p.title, settings: { mode: 'wait' }, result: { fromBar: 1, toBar: 2, steps: 4, rounds: 0 } }); localStorage.setItem('piano-web.log.v1', JSON.stringify(s)); }, piece);
      const home = () => page.evaluate(() => document.getElementById('home-body').textContent);
      await tapOn(page, '#tabs [data-tab="home"]'); await wait(page, 1200);
      const listed = (await home()).includes(piece.title);
      await tapOn(page, '#tabs [data-tab="music"]'); await wait(page, 1000);
      await page.locator('#lib-list li', { hasText: piece.title }).first().locator('.lib-more').click(); await wait(page, 600);
      await tapOn(page, '#lib-page button.danger', 'Delete'); await wait(page, 1500);
      await back(page); await tapOn(page, '#tabs [data-tab="home"]'); await wait(page, 1200);
      const still = (await home()).includes(piece.title);
      await page.goto(`${BASE}?piece=${piece.id}`); await wait(page, 2500);
      const m = await said(page);
      ok('F19: a deleted piece leaves Home’s recent list', listed && !still, `listed before ${listed}; after delete ${still} (${piece.title})`);
      ok('F19: its old address says it is gone without its internal id', !m.includes(piece.id) && /no longer/.test(m), `"${m}"`);
      ok('F19: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // F21: Memorise's opening line follows its Settings: "nothing" before your turn and the whole chunk.
    {
      const { ctx, page, errors } = await phone(`${BASE}?piece=mozart-k2&tool=memorise`);
      await scoreReady(page); await firstTap(page); await wait(page, 800);
      const sub = () => page.evaluate(() => document.getElementById('memo-sub').textContent);
      const first = await sub();
      if (await page.evaluate(() => document.getElementById('memo-head').classList.contains('faded'))) { await page.mouse.click(195, 330); await wait(page, 300); }
      await tapOn(page, '#memo-settings');
      await page.locator('input[name="m-before"][value="nothing"]').check(); await wait(page, 300);
      await page.locator('input[name="m-adds"][value="chunk"]').check(); await wait(page, 300);
      await page.keyboard.press('Escape'); await wait(page, 500);
      const then = await sub();
      ok('F21: Memorise’s opening line follows a Settings change (nothing before your turn)', /It plays bar 1/.test(first) && then === 'They hide and you play them from memory', `"${first}" → "${then}"`);
      ok('F21: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // Tour: BWV 514's "has 2 parts" belongs where the piece opens, not on Home and the tabs (the piece never opened).
    // As the tour ran it: a phone (isMobile), whose first layout's resize drew the first piece behind the tabs.
    {
      // Every text the message line shows is kept (a later layout clears the line, so a look at the end can miss it).
      const record = (page) => page.addInitScript(() => {
        window.__said = [];
        new MutationObserver(() => { const t = document.getElementById('message')?.textContent; if (t && window.__said.at(-1) !== t) window.__said.push(t); }).observe(document, { subtree: true, childList: true, characterData: true });
      });
      const { ctx, page, errors } = await phone(BASE, { mobile: true, route: record });
      await wait(page, 1000);
      // (and a resize once the app is up, as a phone's address bar or keyboard gives: whether the first layout's own
      // resize comes before or after the song list arrives varies run to run)
      await page.setViewportSize({ width: 390, height: 800 }); await wait(page, 1200);
      await page.setViewportSize({ width: 390, height: 844 }); await wait(page, 1200);
      let home = await said(page);
      for (const t of ['music', 'practice', 'path', 'home']) { await tapOn(page, `#tabs [data-tab="${t}"]`); await wait(page, 800); }
      home = (await page.evaluate(() => window.__said)).join(' | ');
      await ctx.close();
      // Where it opens it is said (a plain context: the phone emulation's own resize just after opening lays the music out
      // again, and a layout clears the message line, as it did before this round).
      const plain = await phone(`${BASE}?piece=bach-bwv514`);
      await scoreReady(plain.page); await wait(plain.page, 1500);
      const opened = await said(plain.page);
      errors.push(...plain.errors);
      await plain.ctx.close();
      ok('tour: the "has 2 parts" warning is not said on Home or the tabs for a piece never opened, and is where it opens', !/has 2 parts/.test(home) && /has 2 parts/.test(opened), `Home "${home}"; opened "${opened}"`);
      ok('tour warning: no page errors', errors.length === 0, errors.join(' | '));
    }

    // Tour: bar picking started by Ladder ends with a change to Play along: ▶ then a tap on the music stops, and sets no loop.
    {
      const { ctx, page, errors } = await phone(`${BASE}?piece=mozart-k2`, { keys: 1 });
      await scoreReady(page); await firstTap(page);
      await page.selectOption('#q-mode', 'ladder'); await wait(page, 500);
      const picking = await said(page);
      await page.selectOption('#q-mode', 'along'); await wait(page, 500);
      await barsUp(page); await tapOn(page, '#play'); await wait(page, 2000);
      await page.mouse.click(195, 330); await wait(page, 800);
      const st = await page.evaluate(() => ({ loop: document.getElementById('q-loop').textContent, pressed: document.getElementById('q-loop').getAttribute('aria-pressed'), msg: document.getElementById('message').textContent }));
      ok('tour: Ladder’s bar picking ends with another mode; the stop tap sets no loop', /Ladder: tap the first bar/.test(picking) && st.loop === 'Loop' && st.pressed === 'false' && !/From bar/.test(st.msg), `"${picking}"; ${JSON.stringify(st)}`);
      ok('tour picking: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // F6 (interfaces): a backup from a newer app (version 99) is refused with a plain reason, and nothing is merged.
    {
      const { ctx, page, errors } = await phone(BASE);
      await tapOn(page, '#home-settings'); await wait(page, 400);
      const future = { app: 'piano-web', version: 99, saved: new Date().toISOString(), data: { 'piano-web.future.v1': '"from the future"' }, library: [] };
      await page.setInputFiles('#restore-file', { name: 'piano-backup-future.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(future)) });
      await wait(page, 2500);
      const st = await page.evaluate(() => ({ msg: document.getElementById('message')?.textContent ?? '', merged: localStorage.getItem('piano-web.future.v1') }));
      ok('F6: a backup from a newer version of the app is refused, saying so, and nothing of it is merged', /newer version of the app/.test(st.msg) && st.merged === null, JSON.stringify(st));
      ok('F6: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
    // F04 (owner, 2026-10-15): Android Back during a Play along run leaves quietly: the run is logged, and no summary
    // opens over the tab you land on.
    {
      const { ctx, page, errors } = await phone(`${BASE}?piece=mozart-k2`, { keys: 1 });
      await scoreReady(page); await firstTap(page);
      await page.selectOption('#q-mode', 'along'); await wait(page, 400);
      await barsUp(page); await tapOn(page, '#play');
      for (let t = 0; t < 2500; t += 250) { const keys = await page.evaluate(() => window.__pianoDebug.struck(window.__pianoDebug.state().step)); if (keys.length) await chord(page, keys, 60); await wait(page, 190); }
      await back(page); await wait(page, 600);
      const st = { ...(await where(page)), summary: await page.evaluate(() => !document.getElementById('run-strip').hidden), runs: (await log(page)).filter((e) => e.screen === 'score').length };
      ok('F04: Back during a Play along run: Home, no summary over it, and the run logged', st.screen === 'shell' && st.view === 'v-home' && !st.summary && st.runs === 1, JSON.stringify(st));
      ok('F04: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // Q5 (owner, 2026-10-15), the score's side: a Play along run that reaches the piece's last note says so in the log
    // (`reachedEnd`), which is what a score step with no target counts; Melody 1, played to its end.
    {
      const { ctx, page, errors } = await phone(`${BASE}?tab=practice&page=exercises`, { keys: 1 });
      await wait(page, 1000);
      await tapOn(page, '#exercises-body .li', 'Melody 1'); await scoreReady(page); await wait(page, 1200);
      await page.selectOption('#q-mode', 'along'); await wait(page, 400);
      await barsUp(page); await tapOn(page, '#play');
      for (let t = 0; t < 30000; t += 250) {
        if ((await log(page)).some((e) => e.screen === 'score')) break;
        const keys = await page.evaluate(() => window.__pianoDebug.struck(window.__pianoDebug.state().step)); if (keys.length) await chord(page, keys, 60); await wait(page, 190);
      }
      const e = (await log(page)).filter((x) => x.screen === 'score').pop();
      ok('Q5: a Play along run played to the piece\u2019s end is logged as reaching it', e?.result.reachedEnd === true, JSON.stringify(e?.result && { fromBar: e.result.fromBar, toBar: e.result.toBar, reachedEnd: e.result.reachedEnd }));
      ok('Q5 run: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // Wait for me with the phone sideways and no MIDI keyboard (owner, 2026-10-15): one plain line, and no keys shown.
    {
      const got = {};
      for (const [name, keys] of [['not allowed', undefined], ['none connected', 0]]) {
        const { ctx, page, errors } = await phone(`${BASE}?piece=mozart-k2`, { keys, viewport: { width: 844, height: 390 } });
        await scoreReady(page); await firstTap(page);
        await page.selectOption('#q-mode', 'wait'); await wait(page, 400);
        await barsUp(page); await tapOn(page, '#play'); await wait(page, 2500);
        got[name] = { said: await said(page), keys: await page.evaluate(() => !document.getElementById('keyboard').hidden), errors: errors.length };
        await ctx.close();
      }
      ok('Wait for me sideways, no keyboard: "No MIDI keyboard found. Turn the phone upright to play on the screen\u2019s keys, or plug one in." and no keys', Object.values(got).every((g) => /^No MIDI keyboard found: turn the phone upright to play on the keys below, or plug one in\.$/.test(g.said) && !g.keys && !g.errors), JSON.stringify(got));
    }

    // Restore (owner, 2026-10-15): Memorise's learned bars of one piece and hands on both phones are joined.
    {
      const { ctx, page, errors } = await phone(BASE);
      await page.evaluate(() => localStorage.setItem('piano-web.memorise.v1', JSON.stringify({ learned: { 'mozart-k2|right': [0, 1] } })));
      await tapOn(page, '#home-settings'); await wait(page, 400);
      const theirs = { app: 'piano-web', version: 2, saved: new Date().toISOString(), data: { 'piano-web.memorise.v1': JSON.stringify({ learned: { 'mozart-k2|right': [1, 2, 3], 'chopin-op28-4|both': [0] } }) }, library: [] };
      await page.setInputFiles('#restore-file', { name: 'piano-backup-other.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(theirs)) });
      await wait(page, 4000); // (restoring reloads the app)
      const learned = await page.evaluate(() => JSON.parse(localStorage.getItem('piano-web.memorise.v1') ?? '{}').learned);
      ok('restore: Memorise bars learned on either phone for the same piece and hands are all learned', JSON.stringify(learned?.['mozart-k2|right']) === '[0,1,2,3]' && JSON.stringify(learned?.['chopin-op28-4|both']) === '[0]', JSON.stringify(learned));
      ok('restore join: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
  }
  // ---- end of the fix round -----------------------------------------------------------------------------------------
  // ---- Teaching the app (owner, 2026-10-15; docs/inputs/2026-10-15.md, design/2026-10-15-final-review/onboarding.md) --
  // The four hints, the install card on Home, How the app works, and the first message kept through a phone's first
  // layout. A plain phone tab (touch, no MIDI permission) with taps by position, unless a keyboard is the point (the
  // stand-in, window.__key). Run against the build before (52e5a51a, --url): each case failed there (the page-error
  // lines aside); this build: all pass.
  {
    const fakeKeys = (n) => {
      const input = { id: 'test-keys', name: 'Test keys', state: 'connected', onmidimessage: null };
      const access = { inputs: new Map(n ? [[input.id, input]] : []), outputs: new Map(), onstatechange: null };
      Object.defineProperty(Navigator.prototype, 'requestMIDIAccess', { value: async () => access, configurable: true });
      window.__key = (midi, on) => input.onmidimessage?.({ data: new Uint8Array([on ? 0x90 : 0x80, midi, on ? 90 : 0]), timeStamp: performance.now() });
    };
    async function phone(url, { keys, viewport = { width: 390, height: 844 }, mobile = false, init } = {}) {
      const ctx = await browser.newContext({ viewport, hasTouch: true, isMobile: mobile, serviceWorkers: 'block', acceptDownloads: true });
      const page = await ctx.newPage();
      if (keys !== undefined) await page.addInitScript(fakeKeys, keys);
      if (init) await page.addInitScript(init);
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('dialog', (d) => d.accept());
      await page.goto(url); await page.waitForTimeout(1800);
      return { ctx, page, errors };
    }
    const wait = (page, ms) => page.waitForTimeout(ms);
    // (a control that is not there, as on the build before: the step is skipped and the case's own check fails, so the
    // run carries on to the next case)
    const tapOn = async (page, sel, hasText) => { try { await page.locator(sel, hasText ? { hasText } : {}).first().click({ timeout: 8000 }); } catch { console.log(`  (not tapped: ${sel}${hasText ? ` "${hasText}"` : ''})`); } await wait(page, 400); };
    const scoreReady = (page) => page.waitForFunction(() => window.__pianoDebug?.state().steps > 0, null, { timeout: 30000 });
    const firstTap = async (page) => { await page.mouse.click(195, 330); await wait(page, 400); };
    const barsUp = async (page) => { if (await page.evaluate(() => document.getElementById('top-bar').classList.contains('faded'))) { await page.mouse.click(195, 330); await wait(page, 300); } };
    const said = (page) => page.evaluate(() => { const m = document.getElementById('message'); return m && !m.hidden ? m.textContent : ''; });
    const back = async (page) => { await page.evaluate(() => history.back()); await wait(page, 900); };
    const hints = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('piano-web.hints.v1') ?? 'null'));
    const running = (page) => page.evaluate(() => document.getElementById('play').getAttribute('aria-label') === 'Stop');
    const TIP = 'Tap the music to stop and get the controls back.';
    /** A piece opened, its first tap, then ▶ tapped where it shows: what the message line says once the bars faded. */
    async function run(page, url = `${BASE}?piece=mozart-k2`) {
      await page.goto(url); await scoreReady(page); await wait(page, 600); await firstTap(page); await barsUp(page);
      await tapOn(page, '#play'); await wait(page, 1200);
      return { said: await said(page), running: await running(page), faded: await page.evaluate(() => document.getElementById('bottom-bar').classList.contains('faded')) };
    }

    // Hint #2: the tip as the bars fade; a tap on the music (on the tip itself: it takes no tap) stops the run, and then it
    // is done for good; it comes back only with Settings → Show tips again.
    {
      const { ctx, page, errors } = await phone(BASE);
      const r1 = await run(page);
      const box = await page.evaluate(() => { const r = document.getElementById('message').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
      await page.mouse.click(box.x, box.y); await wait(page, 600); // (a tap where the tip is: the music under it takes it)
      const after = { running: await running(page), said: await said(page), bars: await page.evaluate(() => !document.getElementById('bottom-bar').classList.contains('faded')), store: await hints(page) };
      const r2 = await run(page);
      await page.mouse.click(195, 330); await wait(page, 500);
      await page.goto(`${BASE}?page=settings`); await wait(page, 1200);
      await tapOn(page, '#set-tips'); await wait(page, 300);
      const reset = { note: await page.evaluate(() => document.getElementById('set-tips-note')?.textContent ?? ''), store: await hints(page) };
      const r3 = await run(page);
      ok('hint #2: a run starts, the bars fade and the line says "Tap the music to stop and get the controls back."', r1.running && r1.faded && r1.said === TIP, JSON.stringify(r1));
      ok('hint #2: a tap where the tip shows stops the run and brings the bars back; the tip goes and is stored as used', !after.running && after.bars && after.said === '' && !!after.store?.tips?.['tap-to-stop']?.done && after.store.tips['tap-to-stop'].since === '2026-10-15', JSON.stringify(after));
      ok('hint #2: once used, the next run says nothing', r1.said === TIP && r2.running && r2.said === '', JSON.stringify({ first: r1.said, next: r2 }));
      ok('Settings → Show tips again: the tip shows again on the next run', /show again/.test(reset.note) && !reset.store?.tips && r3.said === TIP, `${JSON.stringify(reset)}; ${JSON.stringify(r3)}`);
      ok('hint #2 tap: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // Hint #2's other end: shown on 3 runs (each stopped without tapping the music: Back), then never on the 4th.
    {
      const { ctx, page, errors } = await phone(BASE);
      const got = [];
      for (let i = 0; i < 4; i++) { got.push((await run(page)).said); await back(page); }
      ok('hint #2: shown on the first 3 runs only (stopped by Back, never by a tap), not on the 4th', got.slice(0, 3).every((s) => s === TIP) && got[3] === '', JSON.stringify(got));
      ok('hint #2 runs: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // After an update only tips new in it show, once (owner): a tip already used stays used; the same tip made newer
    // (as an update that brings or changes it: window.__pianoHintSince) shows, and once used is done again.
    {
      const { ctx, page, errors } = await phone(BASE);
      const first = await run(page); await page.mouse.click(195, 330); await wait(page, 500); // (used: done at its version)
      const seen = await run(page); await page.mouse.click(195, 330); await wait(page, 500);
      await page.addInitScript(() => { window.__pianoHintSince = { 'tap-to-stop': '2099-01-01' }; });
      const updated = await run(page); await page.mouse.click(195, 330); await wait(page, 500);
      const store = await hints(page);
      const again = await run(page);
      ok('after an update: a tip shown and used is not shown again', first.said === TIP && seen.running && seen.said === '', JSON.stringify({ first, seen }));
      ok('after an update: the tip new in it (a newer version) shows; used, it is stored at the new version and shown no more', updated.said === TIP && store?.tips?.['tap-to-stop']?.since === '2099-01-01' && !!store.tips['tap-to-stop'].done && again.said === '', `${JSON.stringify(updated)}; ${JSON.stringify(store)}; ${JSON.stringify(again)}`);
      ok('after an update: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // Hint #4: what each mode is for, said every time one is picked.
    {
      const { ctx, page, errors } = await phone(`${BASE}?piece=mozart-k2`);
      await scoreReady(page); await firstTap(page); await barsUp(page);
      const got = {};
      for (const m of ['wait', 'along', 'rhythm', 'watch', 'wait', 'ladder']) { await page.selectOption('#q-mode', m); await wait(page, 400); got[m] = await said(page); }
      const want = { wait: 'Wait for me: it waits for your notes; no clock.', along: 'Play along: at tempo; the piano plays the hand you don’t; a summary at the end.', rhythm: 'Rhythm: any key counts: play the rhythm only.', watch: 'Watch: the app plays it; follow the marker.', ladder: 'Ladder: tap the first bar to practise. It goes round that loop; each clean pass a little faster, a messy one slower.' };
      ok('hint #4: picking a mode says what it is for (Watch, Wait for me, Play along, Rhythm; Ladder with no loop asks for its bars too)', Object.entries(want).every(([k, v]) => got[k] === v), JSON.stringify(got));
      ok('hint #4: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // Hint #3: the hands label, Piano: in Watch and You: in the others, at the hands and inside the screen with every
    // control of the bar, at 390×844, 320×568, 844×390 and 820×1180.
    {
      const got = {};
      let errs = 0;
      for (const [w, h] of [[390, 844], [320, 568], [844, 390], [820, 1180]]) {
        const { ctx, page, errors } = await phone(`${BASE}?piece=mozart-k2`, { viewport: { width: w, height: h } });
        await scoreReady(page); await page.mouse.click(w / 2, h / 2); await wait(page, 400);
        if (await page.evaluate(() => document.getElementById('top-bar').classList.contains('faded'))) { await page.mouse.click(w / 2, h / 2); await wait(page, 300); }
        await page.selectOption('#q-mode', 'watch'); await wait(page, 300);
        const look = () => page.evaluate(() => {
          const l = document.getElementById('q-hands-label'), r = l?.getBoundingClientRect(), hands = document.getElementById('q-hands').getBoundingClientRect();
          const inside = [...document.querySelectorAll('#bottom-bar button, #bottom-bar select, #bottom-bar output')].every((e) => { const b = e.getBoundingClientRect(); return b.left >= 0 && b.right <= innerWidth && b.top >= 0 && b.bottom <= innerHeight; });
          return { text: l?.textContent ?? '', shown: !!r && r.width > 0 && r.top >= 0 && r.bottom <= innerHeight && Math.abs(r.left - hands.left) < 60, inside, barH: Math.round(document.getElementById('bottom-bar').getBoundingClientRect().height) };
        });
        const watch = await look();
        await page.selectOption('#q-mode', 'along'); await wait(page, 300);
        got[`${w}x${h}`] = { watch, along: await look() };
        errs += errors.length;
        await ctx.close();
      }
      ok('hint #3: "Piano:" at the hands in Watch, "You:" in Play along, at 390, 320, sideways and tablet, every bar control on screen', Object.values(got).every((g) => g.watch.text === 'Piano:' && g.along.text === 'You:' && g.watch.shown && g.along.shown && g.watch.inside && g.along.inside), JSON.stringify(got));
      ok('hint #3: no page errors', errs === 0, String(errs));
    }

    // Hint #1, Simon: with no keyboard and no keys on the screen (Nothing under the music, help 3), Ready says there is
    // nothing to play on; with the keys shown, or a keyboard connected, it says nothing of the kind.
    {
      const nothing = () => { localStorage.setItem('piano-web.exercise-display.v1', JSON.stringify({ 'phone-upright': { under: 'nothing' } })); localStorage.setItem('piano-web.simon.v1', JSON.stringify({ level: { rung: 3 } })); };
      const got = {};
      let errs = 0;
      for (const [name, keys, init] of [['no keys, no keyboard', undefined, nothing], ['keys shown, no keyboard', undefined, undefined], ['no keys, a keyboard', 1, nothing]]) {
        const { ctx, page, errors } = await phone(`${BASE}?tab=practice`, { keys, init });
        await tapOn(page, '[data-practice="Simon"]'); await wait(page, 1500);
        got[name] = await page.evaluate(() => document.getElementById('ex-status').textContent);
        errs += errors.length;
        await ctx.close();
      }
      const NO = 'No MIDI keyboard found: choose Keyboard under the music (Level) to play on the screen, or plug one in.';
      ok('hint #1, Simon: Ready says there is nothing to play on only with no keyboard and no keys on the screen', got['no keys, no keyboard'] === NO && got['keys shown, no keyboard'] !== NO && got['no keys, a keyboard'] !== NO, JSON.stringify(got));
      ok('hint #1 Simon: no page errors', errs === 0, String(errs));
    }

    // Hint #1, Wait for me turned sideways during a run with no keyboard: the run started upright on the screen's keys,
    // the phone turned: it says the owner's line (it was silent); turned back, the line goes and the keys are back.
    {
      const { ctx, page, errors } = await phone(`${BASE}?piece=mozart-k2&mode=wait`);
      await scoreReady(page); await firstTap(page); await barsUp(page);
      await tapOn(page, '#play'); await wait(page, 1500);
      const started = await page.evaluate(() => !document.getElementById('keyboard').hidden) && await running(page);
      await page.setViewportSize({ width: 844, height: 390 }); await wait(page, 2500);
      const sideways = { said: await said(page), keys: await page.evaluate(() => !document.getElementById('keyboard').hidden) };
      await page.setViewportSize({ width: 390, height: 844 }); await wait(page, 2500);
      const upright = { said: await said(page), keys: await page.evaluate(() => !document.getElementById('keyboard').hidden) };
      ok('hint #1: Wait for me turned sideways mid-run with no keyboard says "No MIDI keyboard found. Turn the phone upright to play on the screen’s keys, or plug one in."; turned back, the line goes and the keys are back', started && /^No MIDI keyboard found: turn the phone upright to play on the keys below, or plug one in\.$/.test(sideways.said) && !sideways.keys && upright.keys && !/turn the phone upright/i.test(upright.said), JSON.stringify({ started, sideways, upright }));
      ok('hint #1 sideways: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // The install card: in a browser tab, Home says "Install the app to keep your files and play offline." with Chrome's
    // menu words until the browser offers its prompt, then an Install button; Install calls the prompt and, installed,
    // the card goes for good. ✕ hides it, also after a reload. In the installed app there is no card.
    {
      const card = (page) => page.evaluate(() => { const c = document.getElementById('install-card'); return c ? { text: c.textContent, install: !!c.querySelector('.btn.main') } : null; });
      const { ctx, page, errors } = await phone(BASE);
      const before = await card(page);
      await page.evaluate(() => {
        const e = new Event('beforeinstallprompt', { cancelable: true });
        e.prompt = async () => { window.__prompted = (window.__prompted ?? 0) + 1; };
        e.userChoice = Promise.resolve({ outcome: 'accepted' });
        window.dispatchEvent(e);
        window.__stopped = e.defaultPrevented;
      });
      await wait(page, 300);
      const offered = { ...(await card(page)), stopped: await page.evaluate(() => window.__stopped) };
      let prompted = 0;
      try { await tapOn(page, '#install-card .btn.main'); prompted = await page.evaluate(() => window.__prompted ?? 0); } catch { /* no button */ }
      await page.evaluate(() => window.dispatchEvent(new Event('appinstalled'))); await wait(page, 300);
      const installed = await card(page);
      await page.reload(); await wait(page, 1800);
      const reloaded = await card(page);
      ok('install card: in a tab, Home shows it with Chrome’s menu words until the browser offers to install', !!before && before.text.includes('Install the app to keep your progress and the pieces you add safe on this device, and to play offline.') && before.text.includes('Chrome menu ⋮ → Install app') && !before.install, JSON.stringify(before));
      ok('install card: beforeinstallprompt (its mini-infobar stopped) brings the Install button; a tap calls the browser’s prompt', !!offered.install && offered.stopped === true && prompted === 1, JSON.stringify({ offered, prompted }));
      ok('install card: installed (appinstalled), it goes, also after a reload', !!before && installed === null && reloaded === null, JSON.stringify({ installed, reloaded }));
      ok('install card: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }
    {
      const card = (page) => page.evaluate(() => !!document.getElementById('install-card'));
      const { ctx, page, errors } = await phone(BASE);
      const shown = await card(page);
      try { await tapOn(page, '#install-card .inst-x'); } catch { /* none */ }
      const gone = !(await card(page));
      await page.reload(); await wait(page, 1800);
      const stays = !(await card(page));
      await ctx.close();
      const app = await phone(BASE, { init: () => { window.__pianoInstalled = true; } });
      const inApp = await card(app.page);
      ok('install card: ✕ hides it, and it stays hidden after a reload', shown && gone && stays, JSON.stringify({ shown, gone, stays }));
      ok('install card: none in the installed app (and one in a tab, above)', shown && inApp === false, JSON.stringify({ tab: shown, installedApp: inApp }));
      ok('install card ✕: no page errors', errors.length === 0 && app.errors.length === 0, [...errors, ...app.errors].join(' | '));
      await app.ctx.close();
    }

    // How the app works: Settings opens it from the top with a section a screen; Back closes it and nothing else.
    {
      const { ctx, page, errors } = await phone(`${BASE}?page=settings`);
      try { await tapOn(page, '#set-help'); } catch { /* no row */ }
      const st = await page.evaluate(() => { const d = document.getElementById('help'); return { open: !!d?.open, title: document.getElementById('help-title')?.textContent ?? '', ids: [...document.querySelectorAll('#help .help-sec')].map((s) => s.dataset.help) }; });
      await back(page);
      const after = await page.evaluate(() => ({ open: !!document.getElementById('help')?.open, view: window.__pianoDebug.shell().view }));
      const want = ['home', 'path', 'score', 'memorise', 'simon', 'drills', 'lab', 'freeplay', 'metronome', 'practice', 'music', 'pdf', 'settings', 'install'];
      ok('help: Settings → How the app works opens the page with a section for each screen', st.open && st.title === 'How the app works' && want.every((w) => st.ids.includes(w)), JSON.stringify(st));
      ok('help: Back closes it and Settings is still there', st.open && !after.open && after.view === 'v-settings', JSON.stringify(after));
      ok('help Settings: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // How this screen works, from each screen: it opens that screen's section, marked and in view.
    {
      /** The help as it shows: which section is marked, and whether its title is in the page's view. */
      const shown = (page) => page.evaluate(() => {
        const d = document.getElementById('help'), here = d?.querySelector('.help-sec.here'), form = d?.querySelector('form');
        const r = here?.getBoundingClientRect(), f = form?.getBoundingClientRect();
        return { open: !!d?.open, here: here?.dataset.help ?? null, inView: !!r && !!f && r.top >= f.top - 1 && r.top < f.bottom - 40 };
      });
      const got = {};
      let errs = 0;
      const each = async (name, url, steps, want) => {
        const { ctx, page, errors } = await phone(url);
        try { await steps(page); got[name] = { ...(await shown(page)), want }; } catch (e) { got[name] = { error: String(e).slice(0, 160), want }; }
        errs += errors.length;
        await ctx.close();
      };
      const viaLink = async (page) => { const l = page.locator('.help-link:visible').first(); await l.scrollIntoViewIfNeeded({ timeout: 8000 }); await l.click({ timeout: 8000 }); await wait(page, 500); };
      await each('score (⋯)', `${BASE}?piece=mozart-k2`, async (page) => { await scoreReady(page); await firstTap(page); await barsUp(page); await tapOn(page, '#open-more'); await tapOn(page, '#more [data-help]'); }, 'score');
      await each('Memorise (Settings)', `${BASE}?piece=mozart-k2`, async (page) => { await scoreReady(page); await firstTap(page); await barsUp(page); await tapOn(page, '#open-more'); await tapOn(page, '#open-memorise'); await wait(page, 2000); await tapOn(page, '#memo-settings'); await tapOn(page, '#memo-dialog [data-help]'); }, 'memorise');
      await each('Simon (Level)', `${BASE}?tab=practice`, async (page) => { await tapOn(page, '[data-practice="Simon"]'); await wait(page, 1200); await tapOn(page, '#ex-level'); await tapOn(page, '#ex-level-dialog [data-help]'); }, 'simon');
      await each('Drills (Level)', `${BASE}?tab=practice`, async (page) => { await tapOn(page, '[data-practice="Drills"]'); await wait(page, 1200); await tapOn(page, '#ex-level'); await tapOn(page, '#drill-dialog [data-help]'); }, 'drills');
      await each('the lab (⚙)', `${BASE}?tab=practice`, async (page) => { await tapOn(page, '[data-practice="Accompaniment lab"]'); await wait(page, 1500); await tapOn(page, '#lab-band'); await tapOn(page, '#lab-band-dialog [data-help]'); }, 'lab');
      await each('Free play (Show)', `${BASE}?tab=practice`, async (page) => { await tapOn(page, '[data-practice="Free play"]'); await wait(page, 600); await tapOn(page, '#fp-show'); await tapOn(page, '#fp-show-dialog [data-help]'); }, 'freeplay');
      await each('the metronome (a link)', `${BASE}?tab=practice`, async (page) => { await tapOn(page, '[data-practice="Metronome"]'); await wait(page, 600); await tapOn(page, '#metronome [data-help]'); }, 'metronome');
      await each('the PDF reader (⚙)', `${BASE}?tab=music`, async (page) => { await wait(page, 800); await page.setInputFiles('#lib-file', SHAPES); await wait(page, 2500); await page.locator('#lib-toast').waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {}); await tapOn(page, '.lib-row', 'three shapes'); await wait(page, 2500); await tapOn(page, '#pdf-open-settings'); await tapOn(page, '#pdf-settings [data-help]'); }, 'pdf');
      await each('Music (end of the list)', `${BASE}?tab=music`, async (page) => { await wait(page, 1500); await viaLink(page); }, 'music');
      await each('Home (end of the page)', BASE, async (page) => { await viaLink(page); }, 'home');
      await each('Practice (end of the page)', `${BASE}?tab=practice`, async (page) => { await viaLink(page); }, 'practice');
      await each('Path (end of the page)', `${BASE}?tab=path`, async (page) => { await wait(page, 600); await viaLink(page); }, 'path');
      await each('a lesson page (end of the page)', `${BASE}?page=lesson&lesson=test-minuet-opening`, async (page) => { await wait(page, 800); await viaLink(page); }, 'path');
      ok('help: "How this screen works" from the score, Memorise, Simon, Drills, the lab, Free play, the metronome, the PDF reader, Music, Home, Practice, Path and a lesson opens that screen’s section, marked and in view', Object.values(got).every((g) => g.open && g.here === g.want && g.inView), JSON.stringify(got));
      ok('help from each screen: no page errors', errs === 0, String(errs));
    }
    // Back from a screen's help closes the help only: the score is still there.
    {
      const { ctx, page, errors } = await phone(`${BASE}?piece=mozart-k2`);
      await scoreReady(page); await firstTap(page); await barsUp(page);
      await tapOn(page, '#open-more');
      const had = await page.locator('#more [data-help]').count();
      if (had) await tapOn(page, '#more [data-help]');
      await back(page);
      const st = await page.evaluate(() => ({ help: !!document.getElementById('help')?.open, screen: window.__pianoDebug.showing(), nav: window.__pianoDebug.nav() }));
      ok('help over the score: Back closes the help and the score stays', had > 0 && !st.help && st.screen === 'score' && st.nav.at(-1) === 'score', JSON.stringify({ had, ...st }));
      ok('help Back: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // The hint store goes into the backup and comes back with a restore (made by the app: the tip used on a run).
    {
      const { ctx, page, errors } = await phone(BASE);
      await run(page); await page.mouse.click(195, 330); await wait(page, 500);
      const made = await hints(page);
      await page.goto(`${BASE}?page=settings`); await wait(page, 1200);
      const download = page.waitForEvent('download', { timeout: 8000 }).catch(() => null);
      await tapOn(page, '#backup');
      const d = await download;
      let inZip = null, file = null;
      if (d) { file = join(tmp, `hints-backup-${Date.now()}.zip`); await d.saveAs(file); inZip = readFileSync(file).includes(Buffer.from('piano-web.hints.v1')); }
      await page.evaluate(() => localStorage.removeItem('piano-web.hints.v1'));
      if (file) { await page.setInputFiles('#restore-file', file); await wait(page, 4000); }
      const restored = await hints(page);
      ok('backup: the hint store made by a run goes into the backup and a restore brings it back', !!made?.tips?.['tap-to-stop']?.done && inZip === true && JSON.stringify(restored) === JSON.stringify(made), JSON.stringify({ made, inZip, restored }));
      ok('hint backup: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // The loose end of today's reviews: on a phone (isMobile), the first message after a piece opens (the two-parts
    // warning; an activity's title) was cleared at once by the layout after the phone's own resize. It stays now.
    {
      const got = {};
      let errs = 0;
      for (const [name, url, want] of [['two parts', `${BASE}?piece=bach-bwv514`, /has 2 parts/], ['activity title', `${BASE}?activity=k2-wait-right`, /Minuet K\. 2, right hand, bars 1–4/]]) {
        const { ctx, page, errors } = await phone(url, { mobile: true });
        await scoreReady(page); await wait(page, 2500);
        // (and a resize once it is up, as the phone's address bar gives: whether the emulation's own first resize comes
        // before or after the drawing varies run to run, so it is made to happen after)
        await page.setViewportSize({ width: 390, height: 800 }); await wait(page, 1200);
        await page.setViewportSize({ width: 390, height: 844 }); await wait(page, 1200);
        // (an activity's title is on the score's task line since the consistency pass, 2026-10-16: it must stay there)
        const s = name === 'activity title' ? await page.evaluate(() => { const t = document.getElementById('score-task'); return t && !t.hidden ? t.textContent : ''; }) : await said(page);
        got[name] = { said: s, ok: want.test(s) };
        errs += errors.length;
        await ctx.close();
      }
      ok('a phone’s first layout keeps the first message: the two-parts warning and an activity’s title stay', Object.values(got).every((g) => g.ok), JSON.stringify(got));
      ok('first message: no page errors', errs === 0, String(errs));
    }
  }
  // ---- end of teaching the app --------------------------------------------------------------------------------------
  // ---- Reference videos as rows (owner, 2026-10-16: "all lessons should have relevant YouTube videos on the bottom. No
  // need to show them full size unless they're more than reference") -------------------------------------------------
  // The test lesson ends with two "size": "row" videos. A plain phone tab (touch, no MIDI permission), taps by position
  // (the touchscreen at the place: whatever lies on top takes it). YouTube's still and player are answered here (a tiny
  // picture, an empty page), so the checks need no network; "unreachable" aborts them. Run against the build with only
  // the reader's new field (rows drawn as full players): each case failed there; this build: all pass.
  {
    const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    async function rowsTab({ reach = true } = {}) {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, serviceWorkers: 'block' });
      await ctx.route((url) => /(^|\.)ytimg\.com$|youtube-nocookie\.com$/.test(url.hostname), (r) => (!reach ? r.abort()
        : /ytimg/.test(r.request().url()) ? r.fulfill({ contentType: 'image/png', body: PNG }) : r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>player</title>' })));
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      await page.goto(`${BASE}?page=lesson&lesson=test-minuet-opening`); await page.waitForTimeout(2000);
      if (await page.evaluate(() => !document.getElementById('tap-to-start')?.hidden)) { await page.touchscreen.tap(195, 300); await page.waitForTimeout(300); }
      return { ctx, page, errors };
    }
    /** A tap where the element shows (scrolled into view first). */
    async function tapAt(page, selector) {
      const loc = page.locator(selector).first();
      try { await loc.scrollIntoViewIfNeeded({ timeout: 3000 }); } catch { console.log(`  (not shown: ${selector})`); return; }
      const box = await loc.boundingBox();
      if (!box) { console.log(`  (no box: ${selector})`); return; }
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2); await page.waitForTimeout(500);
    }
    const ROW = '.les-videos [data-block="video"][data-size="row"]';
    /** Each row: drawn as a row, playing (its iframe's host and start), or the card. */
    const rows = (page) => page.evaluate((sel) => [...document.querySelectorAll(sel)].map((r) => {
      const f = r.querySelector('iframe'), u = f ? new URL(f.src) : null;
      return { row: !!r.querySelector('.les-vrow-open'), playing: u ? `${u.hostname} start=${u.searchParams.get('start')}` : '', card: !!r.querySelector('.les-vrow-off'), big: !!r.querySelector('.les-video-off'),
        link: r.querySelector('.les-vrow-off a')?.href ?? '', title: r.querySelector('.les-vrow-off .les-vrow-title')?.textContent ?? '', note: r.querySelector('.les-vrow-off .les-vrow-cap')?.textContent ?? '',
        img: !!r.querySelector('img'), h: Math.round(r.getBoundingClientRect().height) };
    }), ROW);

    // Drawn as rows under one heading, at the lesson's end; a tap opens one in place, ✕ Close closes it, opening the other closes the first.
    {
      const { ctx, page, errors } = await rowsTab();
      const shape = await page.evaluate(() => {
        const col = document.querySelector('.les-column'), sec = document.querySelector('.les-videos');
        const blocks = [...col.children].filter((c) => c.matches('[data-block], .les-videos, .les-vrows'));
        return { heading: sec?.querySelector('h3')?.textContent ?? '', last: blocks.at(-1) === sec, inList: sec?.querySelectorAll('.les-vrows > [data-size="row"]').length ?? 0,
          full: !!document.querySelector('.les-column > [data-block="video"] iframe') };
      });
      const r0 = await rows(page);
      ok('video rows: the lesson\'s two row videos are drawn as rows under one heading "Videos", at its end (the full video above stays a player)',
        shape.heading === 'Videos' && shape.last && shape.inList === 2 && r0.length === 2 && r0.every((r) => r.row && !r.playing && r.h >= 44 && r.h <= 110) && shape.full, JSON.stringify({ shape, r0 }));
      await tapAt(page, `${ROW} >> nth=0`);
      const r1 = await rows(page);
      ok('video rows: a tap on a row plays it in place (the privacy-enhanced player, from its start); the other stays a row',
        r1[0]?.playing === 'www.youtube-nocookie.com start=120' && r1[1]?.row && !r1[1].playing, JSON.stringify(r1));
      await tapAt(page, `${ROW} >> nth=0 >> .les-vrow-close`);
      const r2 = await rows(page);
      ok('video rows: ✕ Close turns it back into a row', r2.length === 2 && r2.every((r) => r.row && !r.playing), JSON.stringify(r2));
      await tapAt(page, `${ROW} >> nth=0`);
      await tapAt(page, `${ROW} >> nth=1`);
      const r3 = await rows(page);
      ok('video rows: opening the other closes the first (one plays at a time)', r3[0]?.row && !r3[0].playing && r3[1]?.playing === 'www.youtube-nocookie.com start=240', JSON.stringify(r3));
      ok('video rows: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // Offline, and online with YouTube unreachable: each row is the full block's title-and-link card.
    {
      const { ctx, page, errors } = await rowsTab();
      await ctx.setOffline(true);
      await page.evaluate(() => window.dispatchEvent(new Event('offline'))); await page.waitForTimeout(500);
      const off = await rows(page);
      // (compact, as a row is: one line's height, no still; coordinator 2026-10-16: a 150–200 px card per row broke "small")
      const compact = (r) => r.card && !r.big && !r.row && !r.playing && !r.img && r.h >= 44 && r.h <= 90 && /youtube\.com\/watch\?v=ZD_sAWAlWq0/.test(r.link);
      ok('video rows offline: each row stays one compact row (about a row’s height, no still): its title, a short note, its link', off.length === 2 && off.every(compact) && /internet/.test(off[0].note) && off[0].title === 'Test: the same lesson video, from 2:00', JSON.stringify(off));
      await ctx.setOffline(false);
      await page.evaluate(() => window.dispatchEvent(new Event('online'))); await page.waitForTimeout(800);
      const back = await rows(page);
      ok('video rows: online again, rows again', back.length === 2 && back.every((r) => r.row && !r.card), JSON.stringify(back));
      ok('video rows offline: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
      const un = await rowsTab({ reach: false });
      await un.page.waitForTimeout(1500);
      const blocked = await rows(un.page);
      ok('video rows, YouTube unreachable: each row stays one compact row with its title, a note and its link', blocked.length === 2 && blocked.every((r) => r.card && !r.big && !r.row && !r.img && r.h >= 44 && r.h <= 90 && /reached/.test(r.note) && /watch\?v=ZD_sAWAlWq0/.test(r.link)), JSON.stringify(blocked));
      ok('video rows unreachable: no page errors', un.errors.length === 0, un.errors.join(' | '));
      await un.ctx.close();
    }
  }
  // ---- end of video rows ------------------------------------------------------------------------------------------------

  // ---- Lesson 1's app pieces (2026-10-16): keys, no music; per-step keys; test rungs out of the learner's way ----------
  // A plain phone tab (touch, no MIDI permission), upright, taps by position as a finger lands: at a key's centre and
  // 12 px either side of it (a key about 30 px wide, the lesson plan's goal, takes a tap anywhere in its middle 24 px; on
  // the old two-octave keyboard the black keys were 14 px and the side taps landed on the white keys beside them).
  // The lesson's own content is added separately: the activities and the black-key set here are served by the check.
  {
    const L1_ACTS = {
      'check-l1-freeplay': { title: 'Check: the groups', screen: 'freeplay', keys: 'C4-E5' },
      'check-l1-simon': { title: 'Check: copy what you see and hear', screen: 'simon', set: 'check-black', level: { rung: 0, match: 'same', miss: 'tries', speed: 'steady', onMiss: 'all', onNew: 'all' }, keys: 'C4-B4' },
      'check-l1-simonnames': { title: 'Check: copy, no names', screen: 'simon', set: 'check-black', level: { rung: 0, match: 'same', miss: 'tries', speed: 'steady', onMiss: 'from-miss', onNew: 'all' }, keys: 'C4-B4' },
      'check-l1-drills': { title: 'Check: cards, no names', screen: 'drills', set: 'check-black', level: { rung: 0, start: 'first', onTime: 'notes', metronome: false, cards: 1 }, keys: 'C4-B4' },
      'check-l1-score': { title: 'Check: K. 2 with chosen keys', screen: 'score', piece: 'mozart-k2', bars: '1-4', settings: { mode: 'wait', hands: 'right' }, keys: { 'phone-upright': 'C5-B5' } },
    };
    const L1_SET = { title: 'Check: the black keys of one octave', kind: 'five-finger', order: 'pool', items: { 1: { notes: 'C#4' }, 2: { notes: 'D#4' }, 3: { notes: 'F#4' }, 4: { notes: 'G#4' }, 5: { notes: 'A#4' } } };
    async function l1Tab(viewport = { width: 360, height: 780 }, { learner = false, route } = {}) {
      const ctx = await (learner ? learnerContext : browser.newContext.bind(browser))({ viewport, hasTouch: true, serviceWorkers: 'block' });
      await ctx.route(/\/content\/activities\/check-l1-[a-z]+\.json$/, (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify(L1_ACTS[r.request().url().match(/(check-l1-[a-z]+)\.json$/)[1]]) }));
      await ctx.route(/\/content\/sets\/index\.json$/, async (r) => { const res = await r.fetch(); r.fulfill({ response: res, body: JSON.stringify([...(await res.json()), 'check-black.json']) }); });
      await ctx.route(/\/content\/sets\/check-black\.json$/, (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify(L1_SET) }));
      if (route) await route(ctx);
      const page = await ctx.newPage();
      const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
      return { ctx, page, errors };
    }
    /** Starts the app's sound with a first tap where nothing else is (Tap anywhere to start), if it asks. */
    const firstTap = async (page) => { if (await page.evaluate(() => !document.getElementById('tap-to-start')?.hidden)) { await page.touchscreen.tap(180, 60); await page.waitForTimeout(300); } };
    /** The black keys drawn in a keyboard: midi, width, and the centre of the part a finger taps. */
    const blackKeys = (page, kb) => page.evaluate((kb) => [...document.querySelectorAll(`${kb} .key.black`)].map((k) => { const r = k.getBoundingClientRect(); return { midi: Number(k.dataset.midi), w: Math.round(r.width * 10) / 10, x: r.left + r.width / 2, y: r.top + r.height / 2 }; }), kb);
    /** A finger's tap at (x, y): down, what the keyboard shows pressed while it is down, up. */
    async function press(page, kb, x, y) {
      await page.mouse.move(x, y); await page.mouse.down(); await page.waitForTimeout(60);
      const down = await page.evaluate((kb) => [...document.querySelectorAll(`${kb} .key.pressed`)].map((k) => Number(k.dataset.midi)), kb);
      await page.mouse.up(); await page.waitForTimeout(60);
      return down;
    }
    const centreOf = (page, id) => page.evaluate((id) => { const r = document.getElementById(id).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, id);
    const OFFSETS = [0, -12, 12];

    // Per-step keys, Free play C4–E5: the keys drawn, the black keys' widths, and every group of two and of three tapped.
    for (const viewport of [{ width: 360, height: 780 }, { width: 390, height: 844 }]) {
      const { ctx, page, errors } = await l1Tab(viewport);
      await page.goto(`${BASE}?activity=check-l1-freeplay`); await page.waitForTimeout(1500);
      await firstTap(page);
      const KB = '#freeplay .fp-keyboard';
      const shown = await page.evaluate((kb) => [...document.querySelectorAll(`${kb} [data-midi]`)].map((k) => Number(k.dataset.midi)), KB);
      const blacks = await blackKeys(page, KB);
      const label = await page.evaluate(() => document.getElementById('fp-range')?.textContent ?? '');
      ok(`per-step keys, Free play C4–E5 at ${viewport.width}×${viewport.height}: exactly C4–E5 drawn (17 keys), labelled so`, shown.length === 17 && shown[0] === 60 && shown.at(-1) === 76 && label === 'C4–E5', `${shown[0]}–${shown.at(-1)} (${shown.length}) "${label}"`);
      ok(`per-step keys, Free play C4–E5 at ${viewport.width}×${viewport.height}: black keys at least about 30 px wide`, blacks.length === 7 && blacks.every((b) => b.w >= 29), blacks.map((b) => `${b.midi}:${b.w}`).join(' '));
      const onTop = await page.evaluate((kb) => [...document.querySelectorAll(`${kb} .key.black`)].every((k) => { const r = k.getBoundingClientRect(); return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === k; }), KB);
      // The keyboard as tall as Free play meant it (42% of the height; it had been the strip's 108 px: fixed 2026-10-16).
      const kbH = await page.evaluate((kb) => Math.round(document.querySelector(kb)?.getBoundingClientRect().height ?? 0), KB);
      ok(`Free play's keys at ${viewport.width}×${viewport.height}: about 42% of the height tall (not 108 px)`, kbH >= 0.4 * viewport.height, `${kbH} px`);
      ok(`per-step keys, Free play at ${viewport.width}: each black key is what lies at its centre`, blacks.length === 7 && onTop);
      // Groups of two (C♯ D♯, twice) and of three (F♯ G♯ A♯), in turn, each key at its centre and 12 px either side.
      const wrong = [];
      for (const g of [[61, 63], [66, 68, 70], [73, 75]]) for (const m of g) {
        const b = blacks.find((x) => x.midi === m);
        if (!b) { wrong.push(`${m}: not drawn`); continue; }
        for (const dx of OFFSETS) { const got = await press(page, KB, b.x + dx, b.y); if (got.length !== 1 || got[0] !== m) wrong.push(`${m}${dx ? `${dx > 0 ? '+' : ''}${dx}px` : ''} → ${got.join(',') || 'nothing'}`); }
      }
      ok(`per-step keys, Free play at ${viewport.width}: every group of two and of three, tapped in turn by position (centre, ±12 px), sounds the key meant`, wrong.length === 0, wrong.slice(0, 6).join('; '));
      // ‹ › still move by an octave from there.
      await page.touchscreen.tap(...await centreOf(page, 'fp-up')); await page.waitForTimeout(300);
      const up = await page.evaluate((kb) => ({ keys: [...document.querySelectorAll(`${kb} [data-midi]`)].map((k) => Number(k.dataset.midi)), label: document.getElementById('fp-range')?.textContent }), KB);
      ok(`per-step keys, Free play at ${viewport.width}: › moves the same keys an octave up (C5–E6)`, up.keys[0] === 72 && up.keys.at(-1) === 88 && up.label === 'C5–E6', JSON.stringify({ from: up.keys[0], to: up.keys.at(-1), label: up.label }));
      ok(`per-step keys, Free play at ${viewport.width}: no page errors`, errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // Keys, no music, with per-step keys: Simon on the black keys of C4–B4. No staff at any point; the chain is heard and
    // its keys lit; a chain of 3 played back by tapping the lit keys by position.
    for (const viewport of [{ width: 360, height: 780 }, { width: 390, height: 844 }]) {
      const { ctx, page, errors } = await l1Tab(viewport);
      await page.goto(`${BASE}?activity=check-l1-simon`); await page.waitForTimeout(2000);
      await firstTap(page);
      const KB = '#ex-keyboard';
      const shown = await page.evaluate((kb) => [...document.querySelectorAll(`${kb} [data-midi]`)].map((k) => Number(k.dataset.midi)), KB);
      const blacks = await blackKeys(page, KB);
      ok(`keys, no music + per-step keys, Simon C4–B4 at ${viewport.width}×${viewport.height}: exactly C4–B4 drawn, black keys at least about 30 px`, shown[0] === 60 && shown.at(-1) === 71 && shown.length === 12 && blacks.length === 5 && blacks.every((b) => b.w >= 29), `${shown[0]}–${shown.at(-1)} (${shown.length}); ${blacks.map((b) => `${b.midi}:${b.w}`).join(' ')}`);
      const level = await page.evaluate(() => document.querySelector('#ex-level-dialog input[name="ex-rung"][value="0"]')?.parentElement?.textContent?.trim() ?? '');
      ok('keys, no music: the Level panel offers it by a plain name', /Keys \+ sound, no music/.test(level), level || 'not there');
      // Start where it shows, then watch: what is lit while it is given, and whether any staff appears.
      await page.touchscreen.tap(...await centreOf(page, 'ex-start'));
      const seen = { lit: new Set(), staff: 0 };
      const watch = async (ms) => { for (let t = 0; t < ms; t += 80) { const w = await page.evaluate((kb) => ({ lit: [...document.querySelectorAll(`${kb} .key.now-r`)].map((k) => Number(k.dataset.midi)), staff: document.querySelectorAll('#ex-notation svg').length }), KB); w.lit.forEach((m) => seen.lit.add(m)); seen.staff = Math.max(seen.staff, w.staff); await page.waitForTimeout(80); } };
      const turn = async () => { for (let i = 0; i < 80; i++) { if (/^Your turn/.test(await page.evaluate(() => document.getElementById('ex-status').textContent))) return true; await watch(80); } return false; };
      let played = 0, k = 0;
      const missed = [];
      for (let chain = 1; chain <= 3; chain++) {
        if (!await turn()) { missed.push(`chain ${chain}: no turn`); break; }
        const want = (await page.evaluate(() => window.__pianoDebug.simon())).map((g) => g[0]);
        for (const m of want) {
          if (!seen.lit.has(m)) missed.push(`${m} was never lit`);
          const b = blacks.find((x) => x.midi === m);
          if (!b) { missed.push(`${m} not drawn`); continue; }
          const got = await press(page, KB, b.x + OFFSETS[k++ % 3], b.y);
          if (got[0] !== m) missed.push(`${m} → ${got.join(',') || 'nothing'}`);
        }
        played = chain;
        await watch(400);
      }
      const after = await page.evaluate(() => ({ best: document.getElementById('ex-mid').textContent, status: document.getElementById('ex-status').textContent, staff: document.querySelectorAll('#ex-notation svg').length }));
      ok(`keys, no music at ${viewport.width}: a chain of 3 played back by tapping the lit keys by position (centre, ±12 px)`, played === 3 && missed.length === 0 && /Best 3/.test(after.best), `${missed.slice(0, 4).join('; ')} ${JSON.stringify(after)}`);
      ok(`keys, no music at ${viewport.width}: the chain's keys lit as it is given, and no staff drawn at any point`, seen.lit.size >= 1 && seen.staff === 0 && after.staff === 0, JSON.stringify({ lit: [...seen.lit], staff: seen.staff }));
      ok(`keys, no music at ${viewport.width}: no page errors`, errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // No note names at "keys, no music" (decided 2026-10-16 from lesson 1's plan: it teaches none yet): through a miss in
    // Simon (the miss line, "from where you missed", the chain's dots, the keys' octave labels) and a card with a wrong key
    // in Drills (its result, the set's results), nothing on the exercise screen is a note name (a letter and an octave,
    // or a letter with ♯ or ♭).
    {
      const NAME = /[A-G][♯♭#b]?\d|[A-G][♯♭]/;
      const text = (page) => page.evaluate(() => document.getElementById('exercise').innerText);
      const named = [];
      const look = async (page, when) => { const t = await text(page); const m = t.match(NAME); if (m) named.push(`${when}: "${m[0]}" in ${JSON.stringify(t.slice(Math.max(0, m.index - 30), m.index + 30))}`); };
      const keyAt = async (page, midi) => page.evaluate((m) => { const k = document.querySelector(`#ex-keyboard [data-midi="${m}"]`); if (!k) return null; const r = k.getBoundingClientRect(); return [r.left + r.width / 2, k.classList.contains('black') ? r.top + r.height / 2 : r.bottom - 12]; }, midi);
      const tapKey = async (page, midi) => { const at = await keyAt(page, midi); if (at) { await page.mouse.move(...at); await page.mouse.down(); await page.waitForTimeout(60); await page.mouse.up(); await page.waitForTimeout(150); } return !!at; };
      const turnNow = async (page) => { for (let i = 0; i < 80; i++) { if (/^Your turn/.test(await page.evaluate(() => document.getElementById('ex-status').textContent))) return true; await page.waitForTimeout(100); } return false; };
      const { ctx, page, errors } = await l1Tab({ width: 360, height: 780 });
      await page.goto(`${BASE}?activity=check-l1-simonnames`); await page.waitForTimeout(2000);
      await firstTap(page);
      await look(page, 'Simon ready');
      await page.touchscreen.tap(...await centreOf(page, 'ex-start'));
      let missedOne = false, status = '';
      if (await turnNow(page)) {
        for (const m of (await page.evaluate(() => window.__pianoDebug.simon())).map((g) => g[0])) await tapKey(page, m); // chain 1
        if (await turnNow(page)) {
          const want = (await page.evaluate(() => window.__pianoDebug.simon())).map((g) => g[0]);
          await tapKey(page, want[0]); await look(page, 'Simon, a dot filled'); // the first of chain 2 right
          missedOne = await tapKey(page, 62); // then D4, a white key: a miss
          status = await page.evaluate(() => document.getElementById('ex-status').textContent);
          await look(page, 'Simon, the miss');
          const outlined = await page.evaluate(() => [...document.querySelectorAll('#ex-keyboard .key.want')].map((k) => Number(k.dataset.midi)));
          if (!outlined.includes(want[1])) named.push(`the right key ${want[1]} not outlined (${outlined})`);
          await page.waitForTimeout(1200); await look(page, 'Simon, given again');
          if (await turnNow(page)) await look(page, 'Simon, your turn from the miss');
        }
      }
      ok('keys, no music, Simon: through a miss, no note name on the exercise screen; the miss says "Not that one: the right key is outlined" and the right key is outlined', missedOne && /Not that one: the right key is outlined/.test(status) && named.length === 0, `${status} | ${named.slice(0, 3).join(' ; ')}`);
      ok('keys, no music, Simon names: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
      named.length = 0;
      const d = await l1Tab({ width: 360, height: 780 });
      await d.page.goto(`${BASE}?activity=check-l1-drills`); await d.page.waitForTimeout(2000);
      await firstTap(d.page);
      await look(d.page, 'Drills ready');
      await d.page.touchscreen.tap(...await centreOf(d.page, 'ex-start'));
      let result = '';
      if (await turnNow(d.page)) {
        await tapKey(d.page, 62); // a wrong key
        await d.page.touchscreen.tap(...await centreOf(d.page, 'ex-next')); await d.page.waitForTimeout(400); // Skip
        result = await d.page.evaluate(() => document.getElementById('ex-sub').textContent);
        await look(d.page, 'Drills, the card\'s result');
        await d.page.touchscreen.tap(...await centreOf(d.page, 'ex-next')); await d.page.waitForTimeout(600); // Next: the set's results
        await look(d.page, 'Drills, the set\'s results');
      }
      const done = await d.page.evaluate(() => document.getElementById('ex-status').textContent);
      ok('keys, no music, Drills: a wrong key and the set\'s results, with no note name on the exercise screen', /wrong key/.test(result) && /Set done/.test(done) && named.length === 0, `${result} | ${done} | ${named.slice(0, 3).join(' ; ')}`);
      ok('keys, no music, Drills names: no page errors', d.errors.length === 0, d.errors.join(' | '));
      await d.ctx.close();
    }

    // Per-step keys on the score, Wait for me: K. 2's right hand, bars 1–4, keys C5–B5 upright. The range is fixed for the
    // run (decided 2026-10-16): C5–B5 with every key the right hand plays in bars 1–4, the same at the start and at the end
    // of bar 4; Play along (keys not chosen there) has the screen's own keys.
    {
      const { ctx, page, errors } = await l1Tab({ width: 360, height: 780 });
      await page.goto(`${BASE}?activity=check-l1-score`);
      await page.waitForFunction(() => window.__pianoDebug?.state().steps > 0, null, { timeout: 30000 }).catch(() => {}); // (not opened: the checks below fail)
      await page.waitForTimeout(800);
      const range = () => page.evaluate(() => { const s = window.__pianoDebug?.keysShown() ?? []; const b = [...document.querySelectorAll('#keyboard .key.black')].map((k) => k.getBoundingClientRect().width); return { lo: s[0], hi: s.at(-1), black: Math.round(Math.min(...b) * 10) / 10 }; });
      // The steps of bars 1–4 (the loop starts at the first; its four measures), and every key the right hand plays there.
      const bars = await page.evaluate(() => { const d = window.__pianoDebug; if (!d) return { steps: [], keys: [] }; const t = d.timeline(), a = d.state().step, m0 = t[a]?.[4] ?? 0; const steps = t.map((x, i) => i).filter((i) => t[i][4] >= m0 && t[i][4] < m0 + 4); return { steps, keys: steps.flatMap((i) => d.struck(i, 'right')) }; });
      const white = (m, by) => { while ([1, 3, 6, 8, 10].includes(m % 12)) m += by; return m; };
      const want = bars.keys.length ? { lo: white(Math.min(72, ...bars.keys), -1), hi: white(Math.max(83, ...bars.keys), 1) } : { lo: 72, hi: 83 };
      const start = await range();
      // (black keys as wide as chosen keys make them: here E4–B5, 12 white keys, so about 25 px: the music needs them all)
      ok('per-step keys, score Wait for me at 360×780: at the start, C5–B5 with every key the right hand plays in bars 1–4', bars.steps.length > 0 && start.lo === want.lo && start.hi === want.hi, JSON.stringify({ start, want, steps: bars.steps.length }));
      const off = [], seen = [];
      for (const i of bars.steps) {
        await page.evaluate((i) => window.__pianoDebug?.goTo(i), i); await page.waitForTimeout(100);
        const r = await page.evaluate(() => { const s = window.__pianoDebug?.keysShown() ?? []; const w = window.__pianoDebug?.struck(window.__pianoDebug.state().step, 'right') ?? []; return { lo: s[0], hi: s.at(-1), off: w.filter((m) => !s.includes(m)) }; });
        if (r.off.length) off.push(r.off);
        seen.push(`${r.lo}–${r.hi}`);
      }
      ok('per-step keys, score Wait for me: the range is the same at the start and at the end of bar 4, every key the right hand plays on it', off.length === 0 && bars.steps.length > 0 && seen.length === bars.steps.length && seen.every((x) => x === `${start.lo}–${start.hi}`), `off ${JSON.stringify(off)}; ranges ${[...new Set(seen)].join(' ')}`);
      await page.selectOption('#q-mode', 'along', { timeout: 3000 }).catch(() => {}); await page.waitForTimeout(500);
      const along = await range();
      ok('per-step keys, score: in Play along the screen\'s own keys (not the chosen ones)', along.lo !== start.lo && along.hi - along.lo > 24, JSON.stringify(along));
      ok('per-step keys, score: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    }

    // Test rungs out of the learner's way. The learner (no test flag): the shipped content shows no test rung on Path or
    // Home; with a placeholder real rung served here, and their saved "current lesson" a hidden test lesson, Home takes
    // them to the real lesson and their saved progress stays. The checks (the flag): the test rung as before.
    {
      const pathText = async (page) => { await page.goto(`${BASE}?tab=path`); await page.waitForTimeout(1500); return page.evaluate(() => document.getElementById('path-body')?.innerText ?? ''); };
      const homeText = async (page) => { await page.goto(BASE); await page.waitForTimeout(1500); return page.evaluate(() => document.getElementById('home-body')?.innerText ?? ''); };
      {
        const { ctx, page, errors } = await l1Tab({ width: 360, height: 780 }, { learner: true });
        const path = await pathText(page), home = await homeText(page);
        ok('test rungs, the learner: Path and Home show no test rung or test lesson', !/Test:/.test(path) && !/Test:/.test(home), `path: ${path.slice(0, 160).replace(/\n/g, ' / ')} | home: ${home.slice(0, 120).replace(/\n/g, ' / ')}`);
        ok('test rungs, the learner: no page errors', errors.length === 0, errors.join(' | '));
        await ctx.close();
      }
      {
        const REAL = { title: 'Check: a real lesson', blocks: [{ kind: 'text', text: 'A placeholder real lesson, served by the check.' }, { kind: 'step', id: 'play', title: 'Play', activity: { screen: 'freeplay' } }] };
        const SAVED = JSON.stringify({ version: 1, current: 'test-minuet-opening', done: { 'test-minuet-opening': { 'melody-cards': { at: '2026-10-15T10:00:00.000Z', how: 'target' } } }, tried: {} });
        const { ctx, page, errors } = await l1Tab({ width: 360, height: 780 }, {
          learner: true,
          route: async (c) => {
            await c.route(/\/content\/path\/index\.json$/, async (r) => { const res = await r.fetch(); const idx = await res.json(); r.fulfill({ response: res, body: JSON.stringify({ rungs: [...idx.rungs, { id: 'check-real', title: 'Check: a real rung', lessons: ['check-real-lesson'] }] }) }); });
            await c.route(/\/content\/path\/lessons\/check-real-lesson\.json$/, (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify(REAL) }));
            await c.addInitScript((saved) => { if (!sessionStorage.getItem('l1-seeded')) { localStorage.setItem('piano-web.path.v1', saved); sessionStorage.setItem('l1-seeded', '1'); } }, SAVED);
          },
        });
        const home = await homeText(page), path = await pathText(page);
        const saved = await page.evaluate(() => localStorage.getItem('piano-web.path.v1'));
        ok('test rungs, the learner whose saved lesson is a hidden test lesson: Home’s Up next is the first real lesson (the path’s own first since lesson 1 shipped: First sounds)', /First sounds/.test(home) && !/Test:/.test(home), home.slice(0, 200).replace(/\n/g, ' / '));
        ok('test rungs, the learner: Path shows the real rungs only', /Playing before reading/.test(path) && /Check: a real rung/.test(path) && !/Test:/.test(path), path.slice(0, 200).replace(/\n/g, ' / '));
        ok('test rungs, the learner: their saved progress stays as it was', saved === SAVED, saved ?? 'gone');
        ok('test rungs, the learner with a real rung: no page errors', errors.length === 0, errors.join(' | '));
        await ctx.close();
      }
      {
        const { ctx, page, errors } = await l1Tab({ width: 360, height: 780 });
        const path = await pathText(page);
        ok('test rungs, the checks: Path shows the test rung (its lessons folded, as a rung not being played is)', /Test: the app’s lesson pages|Test: the app's lesson pages/.test(path), path.slice(-300).replace(/\n/g, ' / '));
        ok('test rungs, the checks: no page errors', errors.length === 0, errors.join(' | '));
        await ctx.close();
      }
    }
  }

  // ---- A MIDI prompt nobody answers (ChatGPT's live review of lesson 1, 2026-10-16) ------------------------------------
  // The browser asks to allow MIDI; until it is answered requestMIDIAccess neither resolves nor fails. Simon and Drills
  // waited on it and never opened, with no word (lesson 1's copying step, and Practice → Simon). Now they open after a
  // moment, and a keyboard allowed later is still heard. Here the request is held, then answered with one keyboard.
  {
    const ctx = await learnerContext({ viewport: { width: 1363, height: 936 }, serviceWorkers: 'block' });
    await ctx.addInitScript(() => {
      const input = { id: 'late', name: 'Late keyboard', state: 'connected', onmidimessage: null };
      window.__midiInput = input;
      navigator.requestMIDIAccess = () => new Promise((resolve) => { window.__answerMidi = () => resolve({ inputs: new Map([['late', input]]), outputs: new Map(), onstatechange: null }); });
    });
    const page = await ctx.newPage();
    const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(`${BASE}?page=lesson&lesson=r1-first-sounds`); await page.waitForTimeout(2500);
    const at = await page.evaluate(() => { const b = [...document.querySelectorAll('.les-step button')].find((x) => x.closest('.les-step').textContent.includes('Copy what you see')); if (!b) return null; b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    if (at) { await page.mouse.click(at[0], at[1]); await page.waitForTimeout(3000); }
    const simonOpen = await page.evaluate(() => !document.getElementById('exercise').hidden && document.querySelector('#exercise .ex-name')?.textContent === 'Ready');
    ok('MIDI prompt unanswered: lesson 1’s copying step opens Simon (Ready) all the same', !!at && simonOpen, at ? `exercise hidden: ${await page.evaluate(() => document.getElementById('exercise').hidden)}` : 'no Start button');
    await page.evaluate(() => window.__answerMidi?.()); await page.waitForTimeout(500);
    await page.evaluate(() => window.__midiInput.onmidimessage?.({ data: new Uint8Array([0x90, 61, 100]), timeStamp: performance.now() })); await page.waitForTimeout(800);
    const after = await page.evaluate(() => document.querySelector('#exercise .ex-name')?.textContent ?? '');
    ok('MIDI prompt unanswered: allowed later, the keyboard is heard (its key starts the game)', after !== 'Ready', `name now "${after}"`);
    await page.goto(`${BASE}?tool=drill`); await page.waitForTimeout(3500);
    ok('MIDI prompt unanswered: Drills opens from its address', await page.evaluate(() => !document.getElementById('exercise').hidden && /Drills/.test(document.getElementById('ex-kind').textContent)), '');
    ok('MIDI prompt unanswered: no page errors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  } // (end of the sections run when no --only is given)
  if (!only || only === 'consistency') { // (`--only consistency` runs this section alone)
  // ---- The consistency pass (owner, 2026-10-16; docs/app-features.md §7e) --------------------------------------------
  // One set of result marks (Drills, Memorise, a score run: grey ringed missed, orange off time, the same one-line key,
  // the blue outline on the keys); the score's run strip (no dialog; a key starts the next run); the task line on every
  // screen a lesson opens and "Practice now" after a change; Back to the lesson at a step's end, by key too; the step's
  // result by the edge keys; the one-time keyboard hint; "visited" only after a key or the music heard to its end; the
  // marks' contrast measured on the screen in both themes. Plain phone tabs (touch, no MIDI permission) tapped by position,
  // and a stand-in MIDI keyboard (window.__key) where keys matter. Screenshots in web/r3shots-consistency/.
  // Run against the build before (dce50d76, --url): see the report; most cases fail there by design (no strip, no task
  // line on the score, Memorise or the lab, green outlines, visited on return).
  {
    /** A case that throws (a control not there, as on a build before) is a failure of its own, and the next case runs. */
    const guard = async (f) => { try { await f(); } catch (e) { ok('consistency: a case ran to its end', false, String(e).split(String.fromCharCode(10))[0].slice(0, 240)); } };
    const SHOTS = here('../r3shots-consistency/');
    mkdirSync(SHOTS, { recursive: true });
    const fakeKeys = (edges) => {
      const input = { id: 'test-keys', name: 'Test keys', state: 'connected', onmidimessage: null };
      const access = { inputs: new Map([[input.id, input]]), outputs: new Map(), onstatechange: null };
      Object.defineProperty(Navigator.prototype, 'requestMIDIAccess', { value: async () => access, configurable: true });
      window.__key = (midi, on) => input.onmidimessage?.({ data: new Uint8Array([on ? 0x90 : 0x80, midi, on ? 90 : 0]), timeStamp: performance.now() });
      if (edges && !localStorage.getItem('piano-web.remote.v1')) localStorage.setItem('piano-web.remote.v1', JSON.stringify({ edges: true, mash: true, low: 21, high: 108 }));
    };
    /** A phone tab: touch, no MIDI permission; keys: a stand-in MIDI keyboard (edges: its lowest and highest keys set up). */
    async function tab({ viewport = { width: 360, height: 780 }, keys = false, edges = false, dark = false, hint = false } = {}) {
      const ctx = await (hint ? learnerContext : browser.newContext)({ viewport, hasTouch: true, serviceWorkers: 'block', colorScheme: dark ? 'dark' : 'light' });
      const page = await ctx.newPage();
      if (keys) await page.addInitScript(fakeKeys, edges);
      // (hint: a learner's context, where the one-time keyboard hint shows; the others put it away: browser.newContext above)
      const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
      return { ctx, page, errors };
    }
    const wait = (page, ms) => page.waitForTimeout(ms);
    /** A tap where an element is (its centre, or off it by dx), sent to whatever lies there. */
    const tapAt = async (page, sel, dx = 0) => {
      const r = await page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return b.width ? [b.left + b.width / 2, b.top + b.height / 2] : null; }, sel);
      if (!r) { console.log(`  (not there to tap: ${sel})`); return false; }
      await page.touchscreen.tap(r[0] + dx, r[1]); await wait(page, 350); return true;
    };
    const firstTap = async (page) => { await page.touchscreen.tap(8, 400); await wait(page, 300); }; // (the browser's sound and MIDI start on a first tap)
    const key = async (page, m, ms = 120) => { await page.evaluate((m) => window.__key(m, true), m); await wait(page, ms); await page.evaluate((m) => window.__key(m, false), m); };
    const lesson = async (page, id) => { await page.goto(`${BASE}?page=lesson&lesson=${id}`); await wait(page, 2200); };
    // (a step not there, as on a build before its lesson: said, and the case's own checks fail; the run carries on)
    const startStep = async (page, step) => { try { await page.locator(`.les-step[data-step="${step}"] .btn`).click({ timeout: 8000 }); } catch { console.log(`  (no step to start: ${step})`); } await wait(page, 2200); };
    const result = (page) => page.evaluate(() => document.querySelector('.les-result')?.innerText ?? '');
    const progress = (page, l, s) => page.evaluate(([l, s]) => { const p = JSON.parse(localStorage.getItem('piano-web.path.v1') ?? '{}'); return { done: p.done?.[l]?.[s] ?? null, tried: p.tried?.[l]?.[s] ?? null }; }, [l, s]);
    const taskOf = (page, id) => page.evaluate((id) => { const t = document.getElementById(id); return t && !t.hidden ? t.innerText.trim() : ''; }, id);
    /** The marks in a drawing: notes painted grey or orange (by attribute or style), the rings, and the blue outlines on the keys. */
    const marksIn = (page, root, keys) => page.evaluate(([root, keys]) => {
      // (the score's one-line layout, a phone sideways, shows its drawing through <use> from #score-src, kept outside #score)
      const paths = [...document.querySelectorAll(root === '#score' ? '#score svg path, #score-src path' : `${root} svg path`)];
      const is = (p, hex, rgb) => (p.getAttribute('fill') ?? '').toLowerCase() === hex || p.style.fill === rgb;
      return { grey: paths.filter((p) => is(p, '#6b7280', 'rgb(107, 114, 128)')).length, orange: paths.filter((p) => is(p, '#d97706', 'rgb(217, 119, 6)')).length,
        green: paths.filter((p) => is(p, '#16a34a', 'rgb(22, 163, 74)')).length, rings: document.querySelectorAll(root === '#score' ? '#score .slip-ring, #score-src .slip-ring' : `${root} .slip-ring`).length,
        outlines: keys ? [...new Set([...document.querySelectorAll(`${keys} .key.want`)].map((k) => getComputedStyle(k).boxShadow.match(/rgb\([^)]*\)/)?.[0]))] : [] };
    }, [root, keys]);
    /** The contrast between a mark and the paper as seen on the screen: a screenshot of the notehead's box read back. */
    async function contrastOf(page, root, colour) {
      const box = await page.evaluate(([root, colour]) => {
        const head = [...document.querySelectorAll(`${root} .vf-notehead`)].find((h) => [...h.querySelectorAll('path')].some((p) => (p.getAttribute('fill') ?? '').toLowerCase() === colour || p.style.fill === colour));
        const b = head?.getBoundingClientRect();
        return b ? { x: b.left, y: b.top, w: b.width, h: b.height } : null;
      }, [root, colour]);
      if (!box) return null;
      const pad = 10, clip = { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: box.w + 2 * pad, height: box.h + 2 * pad };
      const png = await page.screenshot({ clip });
      return page.evaluate(async ([b64, inner]) => {
        const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode();
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
        const g = c.getContext('2d'); g.drawImage(img, 0, 0);
        const sx = img.width / inner.w, sy = img.height / inner.h;
        const at = (x, y) => [...g.getImageData(Math.round(x * sx), Math.round(y * sy), 1, 1).data].slice(0, 3);
        const lum = ([r, gg, b]) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(gg) + 0.0722 * f(b); };
        const mark = at(inner.cx, inner.cy), paper = at(2, 2);
        const [hi, lo] = [lum(mark), lum(paper)].sort((a, b) => b - a);
        return { mark, paper, ratio: Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100 };
      }, [png.toString('base64'), { w: clip.width, h: clip.height, cx: box.x - clip.x + box.w / 2, cy: box.y - clip.y + box.h / 2 }]);
    }

    // 1. Drills, a lesson step that hides names (test-consistency "cards-no-names": 2 cards, the first note starts the
    // clock): the first note on time, the next two late, the rest left: grey (ringed) and orange on the card, the key says
    // both, the missed keys outlined blue (none green); no note named in the words or on the keys. Plain tab, keys tapped by
    // position (off centre); then the set's end: Back to the lesson by a tap.
    for (const viewport of [{ width: 360, height: 780 }, { width: 844, height: 390 }]) await guard(async () => {
      const tag = `${viewport.width}×${viewport.height}`;
      const { ctx, page, errors } = await tab({ viewport });
      await lesson(page, 'test-consistency'); await startStep(page, 'cards-no-names');
      const task = await taskOf(page, 'ex-task');
      await firstTap(page);
      await tapAt(page, '#ex-start'); await wait(page, 600);
      const playCard = async () => {
        let d = null;
        for (let i = 0; i < 40; i++) { d = await page.evaluate(() => window.__pianoDebug.drill()); if (d.state === 'turn') break; await wait(page, 150); }
        const pos = (m) => page.evaluate((m) => { const k = document.querySelector(`#ex-keyboard .key[data-midi="${m}"]`); if (!k) return null; const r = k.getBoundingClientRect(); return [r.left + r.width / 2 + Math.min(6, r.width / 4), r.top + r.height * 0.75]; }, m);
        const steps = d.steps;
        const p0 = await pos(steps[0].keys[0]); if (p0) await page.touchscreen.tap(p0[0], p0[1]);
        const t0 = Date.now();
        for (const k of [1, 2]) {
          const due = steps[k].t + 320; // (late: past the normal ±100 ms)
          while (Date.now() - t0 < due) await wait(page, 20);
          const p = await pos(steps[k].keys[0]); if (p) await page.touchscreen.tap(p[0], p[1]);
        }
        for (let i = 0; i < 60; i++) { const s = await page.evaluate(() => document.getElementById('ex-status').textContent); if (/Not quite|✓/.test(s)) break; await wait(page, 200); }
        await wait(page, 600);
      };
      await playCard();
      const card = { ...(await marksIn(page, '#ex-notation', '#ex-keyboard')), legend: await page.evaluate(() => { const l = document.getElementById('ex-legend'); return l.hidden ? '' : l.textContent; }),
        words: await page.evaluate(() => document.getElementById('ex-sub').textContent), labels: await page.evaluate(() => [...document.querySelectorAll('#ex-keyboard .key')].map((k) => k.textContent).join('')) };
      await page.screenshot({ path: join(SHOTS, `drills-result-${tag.replace('×', 'x')}.png`) });
      ok(`consistency ${tag}: Drills, a step's card: its missed notes grey and ringed, its late ones orange, none green; the key says both`, card.grey > 0 && card.orange > 0 && card.green === 0 && card.rings > 0 && card.legend === 'grey: missed · orange: early, late or let go early', JSON.stringify(card));
      ok(`consistency ${tag}: Drills: a missed key outlined in blue (#2563eb), not green`, card.outlines.length === 1 && card.outlines[0] === 'rgb(37, 99, 235)', JSON.stringify(card.outlines));
      ok(`consistency ${tag}: Drills, names: false: no note named in the card's words or on the keys; the task line shows`, !/\b[A-G][♯♭#b]?\d?\s+(late|missed|early)/.test(card.words) && /\d+ notes? (late|missed)/.test(card.words) && card.labels === '' && /nothing names a note/.test(task), JSON.stringify({ words: card.words, labels: card.labels, task }));
      // the next card by a tap on Next, played the same; then Set done: Back to the lesson is the main button
      await tapAt(page, '#ex-next'); await wait(page, 400);
      await playCard();
      await tapAt(page, '#ex-next'); await wait(page, 1200);
      const end = await page.evaluate(() => ({ state: window.__pianoDebug.drill().state, back: !document.getElementById('ex-back').hidden && document.getElementById('ex-back').classList.contains('main'), fresh: document.getElementById('ex-fresh').classList.contains('main'), text: document.getElementById('ex-back').textContent }));
      await page.screenshot({ path: join(SHOTS, `end-back-to-lesson-${tag.replace('×', 'x')}.png`) });
      ok(`consistency ${tag}: Drills, a step's set done: "Back to the lesson ▶" is the main button (New set is not)`, end.state === 'done' && end.back && !end.fresh && /Back to the lesson/.test(end.text), JSON.stringify(end));
      await tapAt(page, '#ex-back'); await wait(page, 1200);
      const res = await result(page);
      ok(`consistency ${tag}: Back to the lesson: the step's result, played through (no pass mark: playing the whole set is the practice; 2026-10-16)`, /Played through: step done\. There is no pass mark here: playing the whole set is the practice\./.test(res), res.slice(0, 200));
      ok(`consistency ${tag}: Drills: no page errors`, errors.length === 0, errors.join(' | '));
      await ctx.close();
    });

    // 2. The score: a step's Wait for me (test-minuet-opening "wait-rh"), changed to Play along: the task line says
    // "Practice now"; a run round its loop with notes on time, late and missed; ■: the strip (no dialog), the slips marked
    // with the same marks and key; a key (stand-in) starts the next run. Then the strip's Back to the lesson: practice.
    for (const viewport of [{ width: 360, height: 780 }, { width: 844, height: 390 }]) await guard(async () => {
      const tag = `${viewport.width}×${viewport.height}`;
      const { ctx, page, errors } = await tab({ viewport, keys: true });
      await lesson(page, 'test-minuet-opening'); await startStep(page, 'wait-rh');
      await page.waitForFunction(() => window.__pianoDebug?.state().steps > 0, null, { timeout: 30000 }); await wait(page, 600);
      await firstTap(page);
      if (await page.evaluate(() => document.getElementById('top-bar').classList.contains('faded'))) await firstTap(page);
      const before = await taskOf(page, 'score-task');
      await page.selectOption('#q-mode', 'along'); await wait(page, 500);
      const after = await taskOf(page, 'score-task');
      await page.screenshot({ path: join(SHOTS, `task-line-practice-now-${tag.replace('×', 'x')}.png`) });
      ok(`consistency ${tag}: the score's task line: the step's, then "Practice now: not counted for the step (another mode)" in Play along`, /Minuet K\. 2, right hand/.test(before) && !/Practice now/.test(before) && /Practice now: not counted for the step \(another mode\)/.test(after), JSON.stringify({ before, after }));
      await tapAt(page, '#play'); await wait(page, 300);
      const t0 = Date.now();
      let n = 0;
      while (Date.now() - t0 < 11000) {
        const st = await page.evaluate(() => ({ step: window.__pianoDebug.state().step, playing: document.getElementById('play').getAttribute('aria-label') === 'Stop' }));
        const want = await page.evaluate((s) => window.__pianoDebug.struck(s, 'right'), st.step);
        if (want.length && n++ % 3 === 0) await key(page, want[0], 120); else await wait(page, 260);
      }
      await page.touchscreen.tap(viewport.width / 2, viewport.height * 0.3); await wait(page, 900); // (a tap on the music stops the run)
      const strip = { shown: await page.evaluate(() => !document.getElementById('run-strip').hidden), dialog: await page.evaluate(() => !!document.querySelector('dialog[open]')),
        legend: await page.evaluate(() => document.getElementById('rs-legend').textContent), keys: await page.evaluate(() => document.getElementById('rs-keys').textContent), back: await page.evaluate(() => !document.getElementById('rs-back').hidden),
        ...(await marksIn(page, '#score', null)) };
      await page.screenshot({ path: join(SHOTS, `score-strip-${tag.replace('×', 'x')}.png`) });
      ok(`consistency ${tag}: a score run's end: a strip at the bottom, no dialog; Back to the lesson there (a step)`, strip.shown && !strip.dialog && strip.back, JSON.stringify(strip));
      ok(`consistency ${tag}: the score run's slips on the music: grey (ringed) and orange, none green, the same key as Drills'`, strip.grey > 0 && strip.orange > 0 && strip.green === 0 && strip.rings > 0 && strip.legend === 'grey: missed · orange: early, late or let go early', JSON.stringify(strip));
      ok(`consistency ${tag}: the strip says a key starts the next run (a keyboard is connected)`, /a key starts the next run/.test(strip.keys), strip.keys);
      await wait(page, 900);
      await key(page, 30); await wait(page, 700);
      const next = await page.evaluate(() => ({ running: document.getElementById('play').getAttribute('aria-label') === 'Stop', strip: !document.getElementById('run-strip').hidden, marks: [...document.querySelectorAll('#score svg path, #score-src path')].filter((p) => p.style.fill).length }));
      ok(`consistency ${tag}: a key starts the next run: running, the strip and the marks gone`, next.running && !next.strip && next.marks === 0, JSON.stringify(next));
      await page.touchscreen.tap(viewport.width / 2, viewport.height * 0.3); await wait(page, 900);
      if (await page.evaluate(() => document.getElementById('run-strip').hidden)) await page.evaluate(() => document.getElementById('score-back').click());
      else await tapAt(page, '#rs-back');
      await wait(page, 1200);
      const res = await result(page);
      ok(`consistency ${tag}: the step's result: the Play along run is practice for a Wait for me step, said so`, /played with another mode: practice, not counted for the step/.test(res) && !/step done ✓/.test(res), res.slice(0, 260));
      ok(`consistency ${tag}: score: no page errors`, errors.length === 0, errors.join(' | '));
      await ctx.close();
    });

    // 2b. The score in the step's own mode (Wait for me round bars 1–4, the stand-in keyboard with its ends set up): stopped
    // by a tap after one round, the strip says it was played through, and the keyboard's highest key goes back to the
    // lesson (the strip's main button; any other key would start the next run): played through.
    await guard(async () => {
      const { ctx, page, errors } = await tab({ keys: true, edges: true });
      await lesson(page, 'test-minuet-opening'); await startStep(page, 'wait-rh');
      await page.waitForFunction(() => window.__pianoDebug?.state().steps > 0, null, { timeout: 30000 }); await wait(page, 600);
      await firstTap(page);
      let rounds = 0, last = -1;
      for (let i = 0; i < 80 && rounds < 1; i++) {
        const s = await page.evaluate(() => window.__pianoDebug.state().step);
        if (s < last) rounds++;
        last = s;
        const want = await page.evaluate((s) => window.__pianoDebug.struck(s, 'right'), s);
        if (want.length) await key(page, want[0], 150); else await wait(page, 200);
        await wait(page, 120);
      }
      await wait(page, 400);
      await page.touchscreen.tap(180, 230); await wait(page, 900);
      const strip = await page.evaluate(() => ({ shown: !document.getElementById('run-strip').hidden, line: document.getElementById('rs-line').textContent, keys: document.getElementById('rs-keys').textContent }));
      await wait(page, 600);
      await key(page, 108); await wait(page, 1500);
      const res = await result(page);
      ok('consistency: a Wait for me step round its bars, stopped: the strip says so; the highest key goes back to the lesson: played through', strip.shown && /Played through bars 1–4/.test(strip.line) && /highest key: back to the lesson/.test(strip.keys) && /Played through: step done./.test(res),
        JSON.stringify({ rounds, strip, res: res.slice(0, 160) }));
      ok('consistency: Wait for me step: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    });

    // 3. Memorise, a lesson step (test-consistency "memorise-rh": right hand, bars 1–2, learned after one clean pass): the
    // task line; a pass with a hint (missed) and a wrong key: grey, ringed, the same key; then clean: the chunk learned is
    // the step's end, Back to the lesson the main button, and a key does it: played through.
    for (const viewport of [{ width: 360, height: 780 }, { width: 844, height: 390 }]) await guard(async () => {
      const tag = `${viewport.width}×${viewport.height}`;
      const { ctx, page, errors } = await tab({ viewport, keys: true });
      await lesson(page, 'test-consistency'); await startStep(page, 'memorise-rh');
      await page.waitForFunction(() => window.__pianoDebug?.state().steps > 0, null, { timeout: 30000 }); await wait(page, 800);
      const task = await taskOf(page, 'memo-task');
      await firstTap(page);
      const say = () => page.evaluate(() => document.getElementById('memo-say').textContent);
      const pass = async (slip) => {
        for (let i = 0; i < 80 && !/Your turn|press ▶|Play when|From memory/.test(await say()); i++) await wait(page, 200);
        if (/press ▶/.test(await say())) { await key(page, 30); for (let i = 0; i < 80 && !/Your turn/.test(await say()); i++) await wait(page, 200); }
        for (let i = 0; i < 16; i++) {
          if (!/Your turn|From memory|Next:/.test(await say())) break;
          if (slip && i === 1) { await wait(page, 3600); await key(page, 30); } // (3 s with no key: the next note shown, a slip; then a wrong key)
          const now = await page.evaluate(() => window.__pianoDebug.struck(window.__pianoDebug.state().step, 'right'));
          if (!now.length) break;
          await page.evaluate((ks) => { for (const k of ks) window.__key(k, true); }, now); await wait(page, 200);
          await page.evaluate((ks) => { for (const k of ks) window.__key(k, false); }, now); await wait(page, 200);
        }
        await wait(page, 900);
      };
      await key(page, 30); // (Ready: a key starts it: it plays the bars, then your turn)
      await pass(true);
      const slip = { say: await say(), sub: await page.evaluate(() => document.getElementById('memo-sub').textContent), ...(await marksIn(page, '#score', null)) };
      await page.screenshot({ path: join(SHOTS, `memorise-slip-${tag.replace('×', 'x')}.png`) });
      ok(`consistency ${tag}: Memorise, a step: its task line`, /Play bars 1–2 from memory, right hand/.test(task), task);
      ok(`consistency ${tag}: Memorise's slip: the missed note grey and ringed, none green, the same key (with red for the wrong key)`, slip.grey > 0 && slip.green === 0 && slip.rings > 0 && /^grey: missed · red: a wrong key/.test(slip.sub) && /1 missed/.test(slip.say), JSON.stringify(slip));
      // again, clean, from bar 1's first note (the slip's bar): the chunk learned ends the step
      await key(page, (await page.evaluate(() => window.__pianoDebug.struck(0, 'right')))[0] ?? 77);
      await pass(false);
      for (let i = 0; i < 20 && !/step done/.test(await say()); i++) await wait(page, 250);
      const end = await page.evaluate(() => ({ say: document.getElementById('memo-say').textContent, back: !document.getElementById('memo-back').hidden, next: !document.getElementById('memo-next-chunk').hidden }));
      ok(`consistency ${tag}: Memorise, a step's chunk learned: "step done", Back to the lesson shown with Next chunk beside it`, /Chunk learned: step done/.test(end.say) && end.back && end.next, JSON.stringify(end));
      await wait(page, 900);
      await key(page, 40); await wait(page, 1500);
      const res = await result(page);
      ok(`consistency ${tag}: Memorise: a key goes back to the lesson; played through (learning a chunk is the practice; 2026-10-16)`, /Played through: step done\. There is no pass mark here: learning a chunk is the practice\./.test(res), res.slice(0, 200));
      ok(`consistency ${tag}: Memorise: no page errors`, errors.length === 0, errors.join(' | '));
      await ctx.close();
    });

    // 4. The task line on every screen a lesson opens (plain phone tab), and "Practice now" after a change that differs
    // from the step, gone when changed back: Simon (another set), Drills (the help level), the lab (the other part), Free
    // play (its task; nothing to change), and the score and Memorise above.
    await guard(async () => {
      const { ctx, page, errors } = await tab();
      const seen = {};
      await lesson(page, 'test-chords-and-band'); await startStep(page, 'simon-chords');
      seen.simon = await taskOf(page, 'ex-task');
      // (inside a lesson step the set picker lists only the lesson's sets, here one (2026-10-16, item 40): an easier help level instead)
      seen.simonSets = await page.evaluate(() => document.getElementById('ex-set').options.length);
      await page.evaluate(() => { document.getElementById('ex-level').click(); const i = document.querySelector('#ex-level-dialog input[name="ex-rung"][value="1"]'); i.checked = true; i.dispatchEvent(new Event('change', { bubbles: true })); document.getElementById('ex-level-dialog').close(); }); await wait(page, 400);
      seen.simonChanged = await taskOf(page, 'ex-task');
      await page.evaluate(() => history.back()); await wait(page, 1200);
      await lesson(page, 'test-minuet-opening'); await startStep(page, 'melody-cards');
      seen.drills = await taskOf(page, 'ex-task');
      const rung = async (r) => { await page.evaluate(() => document.getElementById('ex-level').click()); await wait(page, 300); await page.evaluate((r) => { const i = document.querySelector(`#drill-dialog input[name="d-rung"][value="${r}"]`); i.checked = true; i.dispatchEvent(new Event('change', { bubbles: true })); document.getElementById('drill-dialog').close(); }, r); await wait(page, 400); };
      await rung(1); seen.drillsChanged = await taskOf(page, 'ex-task');
      await rung(3); seen.drillsBack = await taskOf(page, 'ex-task');
      await page.evaluate(() => history.back()); await wait(page, 1200);
      await lesson(page, 'test-chords-and-band'); await startStep(page, 'band-roots');
      seen.lab = await taskOf(page, 'lab-task');
      await page.evaluate(() => document.getElementById('lab-role-lead').click()); await wait(page, 400);
      seen.labChanged = await taskOf(page, 'lab-task');
      await page.evaluate(() => history.back()); await wait(page, 1200);
      await lesson(page, 'test-chords-and-band'); await startStep(page, 'free');
      seen.free = await taskOf(page, 'fp-task');
      const styles = await page.evaluate(() => [...new Set(['score-task', 'memo-task', 'ex-task', 'fp-task', 'lab-task'].map((id) => document.getElementById(id).className.split(' ').filter((c) => c === 'step-task').join()))]);
      ok('consistency: the task line on Simon, Drills, the lab and Free play (and the score and Memorise above), one style (.step-task)', ['simon', 'drills', 'lab', 'free'].every((k) => seen[k] && !/Practice now/.test(seen[k])) && styles.join() === 'step-task', JSON.stringify({ seen, styles }));
      ok('consistency: "Practice now: not counted for the step" after an easier help level (Simon, whose picker lists the lesson’s one set), help level (Drills) and part (the lab); gone when changed back',
        /Practice now: not counted for the step \(another help level\)/.test(seen.simonChanged) && seen.simonSets === 1 && /\(another help level\)/.test(seen.drillsChanged) && !/Practice now/.test(seen.drillsBack) && /\(the lead, not the accompaniment\)/.test(seen.labChanged), JSON.stringify(seen));
      ok('consistency: task lines: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    });

    // 5. "Visited" only after a key (Free play) or the music heard to its end (Watch); Back to the lesson at Watch's end;
    // the lab's result by key: Back to the lesson is its main button. Plain phone tab; a stand-in keyboard for the lab.
    await guard(async () => {
      const { ctx, page, errors } = await tab({ keys: true });
      await lesson(page, 'test-chords-and-band'); await startStep(page, 'free');
      await page.evaluate(() => document.getElementById('fp-done').click()); await wait(page, 1000);
      const noKey = { res: await result(page), state: await progress(page, 'test-chords-and-band', 'free') };
      await page.locator('#lesson-bar button', { hasText: 'Again' }).click(); await wait(page, 1500);
      const k = await page.evaluate(() => { const e = document.querySelector('#freeplay .fp-keyboard .key.white'); const r = e.getBoundingClientRect(); return [r.left + r.width / 2 + 4, r.top + r.height * 0.8]; });
      await page.touchscreen.tap(k[0], k[1]); await wait(page, 400);
      await page.evaluate(() => document.getElementById('fp-done').click()); await wait(page, 1000);
      const withKey = { res: await result(page), state: await progress(page, 'test-chords-and-band', 'free') };
      ok('consistency: a Free play step left with no key played: "Opened, nothing played", not marked', /Opened, nothing played/.test(noKey.res) && !noKey.state.done, JSON.stringify(noKey));
      ok('consistency: a Free play step with a key tapped (by position): visited, counted', /Visited: you played here/.test(withKey.res) && withKey.state.done?.how === 'opened', JSON.stringify(withKey));
      // Watch: back at once, then heard to the end (bars 1–2 at ♩ 240)
      await lesson(page, 'test-consistency'); await startStep(page, 'listen');
      await page.waitForFunction(() => window.__pianoDebug?.state().steps > 0, null, { timeout: 30000 }); await wait(page, 500);
      await page.evaluate(() => document.getElementById('score-back').click()); await wait(page, 1200);
      const watchNo = await result(page);
      await page.locator('#lesson-bar button', { hasText: 'Again' }).click(); await wait(page, 1500);
      await page.waitForFunction(() => window.__pianoDebug?.state().steps > 0, null, { timeout: 30000 }); await wait(page, 500);
      await firstTap(page);
      if (await page.evaluate(() => document.getElementById('bottom-bar').classList.contains('faded'))) await firstTap(page);
      await tapAt(page, '#play');
      for (let i = 0; i < 60 && await page.evaluate(() => document.getElementById('run-strip').hidden); i++) await wait(page, 250);
      const watchEnd = await page.evaluate(() => ({ strip: !document.getElementById('run-strip').hidden, line: document.getElementById('rs-line').textContent, back: !document.getElementById('rs-back').hidden }));
      await tapAt(page, '#rs-back'); await wait(page, 1200);
      const watchYes = { res: await result(page), state: await progress(page, 'test-consistency', 'listen') };
      ok('consistency: a Watch step left at once: "Opened, nothing played"', /Opened, nothing played/.test(watchNo), watchNo.slice(0, 160));
      ok('consistency: a Watch step heard to the end: the strip with Back to the lesson; visited', watchEnd.strip && watchEnd.back && /Played to the end/.test(watchEnd.line) && /Visited: you heard it to its end/.test(watchYes.res) && watchYes.state.done?.how === 'opened', JSON.stringify({ watchEnd, watchYes }));
      // the lab: a key on its steps starts the count-in; ■; on the result a key (after a moment) does its main button, Back to the lesson
      await lesson(page, 'test-chords-and-band'); await startStep(page, 'band-roots');
      const say = await page.evaluate(() => document.getElementById('lab-keys-say').textContent);
      await firstTap(page);
      await key(page, 30); await wait(page, 2500);
      const running = await page.evaluate(() => window.__pianoDebug.lab().running);
      await page.evaluate(() => document.getElementById('lab-stop').click()); await wait(page, 600);
      const main = await page.evaluate(() => [...document.querySelectorAll('#lab-result .btn.main')].map((b) => b.textContent));
      await wait(page, 900);
      await key(page, 30); await wait(page, 1500);
      const labRes = await result(page);
      ok('consistency: the lab, a step: "or play any key" by ▶ Start, a key starts it; its result\'s main button is Back to the lesson, and a key does it', say === 'or play any key' && running && main.join() === 'Back to the lesson ▶' && /Step 2 · /i.test(labRes), JSON.stringify({ say, running, main, labRes: labRes.slice(0, 120) }));
      ok('consistency: visited and the lab: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    });

    // 6. The step's result page by the keyboard's edge keys (set up): the highest is Next ▶, the lowest Again; the lesson
    // page itself takes no keys.
    await guard(async () => {
      const { ctx, page, errors } = await tab({ keys: true, edges: true });
      await lesson(page, 'test-chords-and-band'); await firstTap(page);
      await key(page, 108); await wait(page, 1200);
      const onLesson = await page.evaluate(() => ({ nav: window.__pianoDebug.nav(), result: !!document.querySelector('.les-result') }));
      await startStep(page, 'free');
      await page.evaluate(() => document.getElementById('fp-done').click()); await wait(page, 1000);
      const bar = await page.evaluate(() => document.querySelector('#lesson-bar .lesson-bar-note')?.textContent ?? '');
      await key(page, 21); await wait(page, 1500);
      const again = await page.evaluate(() => window.__pianoDebug.showing());
      await page.evaluate(() => document.getElementById('fp-done').click()); await wait(page, 1000);
      await key(page, 108); await wait(page, 1500);
      const next = await page.evaluate(() => ({ nav: window.__pianoDebug.nav(), result: !!document.querySelector('.les-result') }));
      ok('consistency: a step\'s result by the edge keys: lowest Again (the step opens again), highest Next (the lesson page); the bar says so', again === 'freeplay' && next.nav.at(-1) === 'lesson' && !next.result && /highest key: Next · lowest key: Again/.test(bar), JSON.stringify({ again, next, bar }));
      ok('consistency: the lesson page itself takes no keys (the highest key there opens nothing)', onLesson.nav.at(-1) === 'lesson' && !onLesson.result, JSON.stringify(onLesson));
      ok('consistency: result keys: no page errors', errors.length === 0, errors.join(' | '));
      await ctx.close();
    });

    // 7. The one-time keyboard hint: a keyboard connects for the first time (its ends not set up): the card; Not now puts
    // it away for good; Set them up opens Keyboard controls asking for the lowest key; with no keyboard, never.
    await guard(async () => {
      const a = await tab({ keys: true, hint: true });
      await a.page.goto(BASE); await wait(a.page, 1500); await firstTap(a.page); await wait(a.page, 800);
      const shown = await a.page.evaluate(() => !document.getElementById('keys-hint').hidden);
      await a.page.screenshot({ path: join(SHOTS, 'keyboard-hint-360x780.png') });
      await tapAt(a.page, '#keys-hint-no');
      const gone = await a.page.evaluate(() => document.getElementById('keys-hint').hidden);
      await a.page.reload(); await wait(a.page, 1500); await firstTap(a.page); await wait(a.page, 800);
      const again = await a.page.evaluate(() => !document.getElementById('keys-hint').hidden);
      await a.ctx.close();
      const b = await tab({ keys: true, hint: true });
      await b.page.goto(BASE); await wait(b.page, 1500); await firstTap(b.page); await wait(b.page, 800);
      await tapAt(b.page, '#keys-hint-go');
      const setup = await b.page.evaluate(() => ({ open: document.getElementById('remote-dialog').open, says: document.getElementById('r-keys').textContent }));
      await b.ctx.close();
      const c = await tab({ hint: true });
      await c.page.goto(BASE); await wait(c.page, 1500); await firstTap(c.page); await wait(c.page, 800);
      const none = await c.page.evaluate(() => !document.getElementById('keys-hint').hidden);
      ok('consistency: the keyboard hint: shown when a keyboard first connects; Not now puts it away, also after a reload', shown && gone && !again, JSON.stringify({ shown, gone, again }));
      ok('consistency: the keyboard hint: Set them up opens Keyboard controls asking for the lowest key; no keyboard, no hint', setup.open && /lowest key/.test(setup.says) && !none, JSON.stringify({ setup, none }));
      ok('consistency: keyboard hint: no page errors', [...a.errors, ...b.errors, ...c.errors].length === 0, [...a.errors, ...b.errors, ...c.errors].join(' | '));
      await c.ctx.close();
    });

    // 8. The marks' contrast on the screen (light and dark themes: the dark theme draws the music inverted whole): a grey
    // and an orange notehead against the paper beside it, read from a screenshot of a Drills card.
    await guard(async () => {
      const got = {};
      for (const dark of [false, true]) {
        const { ctx, page } = await tab({ dark });
        await lesson(page, 'test-consistency'); await startStep(page, 'cards-no-names');
        await firstTap(page); await tapAt(page, '#ex-start'); await wait(page, 600);
        let d = null;
        for (let i = 0; i < 40; i++) { d = await page.evaluate(() => window.__pianoDebug.drill()); if (d.state === 'turn') break; await wait(page, 150); }
        const pos = (m) => page.evaluate((m) => { const k = document.querySelector(`#ex-keyboard .key[data-midi="${m}"]`); const r = k.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height * 0.75]; }, m);
        const p0 = await pos(d.steps[0].keys[0]); await page.touchscreen.tap(p0[0], p0[1]);
        const t0 = Date.now();
        while (Date.now() - t0 < d.steps[1].t + 320) await wait(page, 20);
        const p1 = await pos(d.steps[1].keys[0]); await page.touchscreen.tap(p1[0], p1[1]);
        for (let i = 0; i < 60; i++) { if (/Not quite|✓/.test(await page.evaluate(() => document.getElementById('ex-status').textContent))) break; await wait(page, 200); }
        await wait(page, 700);
        got[dark ? 'dark' : 'light'] = { grey: await contrastOf(page, '#ex-notation', '#6b7280'), orange: await contrastOf(page, '#ex-notation', '#d97706') };
        await ctx.close();
      }
      const all = [got.light?.grey, got.light?.orange, got.dark?.grey, got.dark?.orange];
      ok('consistency: the marks against the paper, measured on screen: grey and orange at least 3:1 (WCAG for graphics) in both themes', all.every((x) => x && x.ratio >= 3), JSON.stringify(got));
    });
  }
  } // (end of `--only consistency`)
  if (!only || only === 'lessons') { // (`--only lessons` runs this section alone)
  // ---- Lesson steps after the reviews of lesson 1 (owner, 2026-10-16) -------------------------------------------------
  // Free play opened by a step: the step's task on its own line, kept while a key is held; the columns hidden (Show for
  // this visit only); lesson 1's steps hide note names (keys' labels, the range, the notes held, chord and interval
  // names). Free play from Practice is as before. Simon from a step: the task above the music, and lesson 1's copying
  // game ends at a chain of 3 ("You did it"). Lesson 1's shipped content, a plain phone tab, keys tapped by position.
  {
    const ctx = await learnerContext({ viewport: { width: 360, height: 780 }, hasTouch: true, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
    const look = () => page.evaluate(() => {
      const t = document.getElementById('fp-task');
      return { task: t.hidden ? '' : t.textContent, line: document.getElementById('fp-chord').textContent, notes: document.getElementById('fp-notes').textContent,
        range: document.getElementById('fp-range').textContent, labels: [...document.querySelectorAll('#freeplay .fp-keyboard .key')].map((k) => k.textContent).join(''),
        cols: [...document.querySelectorAll('#freeplay .fp-col')].filter((c) => !c.hidden).map((c) => c.dataset.col) };
    });
    await page.goto(`${BASE}?page=lesson&lesson=r1-first-sounds`); await page.waitForTimeout(2500);
    await page.locator('.les-step[data-step="find-groups"] .btn').click(); await page.waitForTimeout(1500);
    const first = await look();
    ok('lesson Free play: the step’s task on its own line, no "Play something"', /The groups of two here/.test(first.task) && first.line === '', JSON.stringify(first));
    ok('lesson Free play: the chord, notes and interval columns start hidden', first.cols.length === 0, JSON.stringify(first.cols));
    ok('lesson 1 Free play: no note names (no key labels, no range)', first.labels === '' && first.range === '', JSON.stringify({ labels: first.labels, range: first.range }));
    // two black keys held together, by position: the task stays, and no interval or note name appears
    const two = await page.evaluate(() => [...document.querySelectorAll('#freeplay .fp-keyboard .key.black')].slice(0, 2).map((k) => { const r = k.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }));
    await page.touchscreen.tap(180, 60); await page.waitForTimeout(200); // (the first tap starts the sound, where nothing is)
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: two.map(([x, y], i) => ({ x, y, id: i })) }); await page.waitForTimeout(250);
    const held = { ...(await look()), pressed: await page.evaluate(() => document.querySelectorAll('#freeplay .fp-keyboard .key.pressed').length) };
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await page.waitForTimeout(200);
    ok('lesson 1 Free play, two keys held: the task stays in view and nothing is named', held.pressed === 2 && /The groups of two/.test(held.task) && held.line === '' && held.notes === '', JSON.stringify(held));
    await page.evaluate(() => document.getElementById('fp-show').click()); await page.waitForTimeout(300);
    await page.evaluate(() => { const box = document.querySelector('#fp-show-dialog input[value="intervals"]'); box.checked = true; box.dispatchEvent(new Event('change', { bubbles: true })); document.getElementById('fp-show-dialog').close(); });
    await page.waitForTimeout(200);
    const shownNow = await look();
    // (lesson 1's step hides names: Show offers no columns of names there, even ticked by force; 2026-10-16, item 38)
    ok('lesson Free play with names hidden: Show offers no column of names (the box disabled; ticked anyway, nothing shows)', shownNow.cols.join() === '' && await page.evaluate(() => document.querySelector('#fp-show-dialog input[value="intervals"]').disabled), JSON.stringify(shownNow.cols));
    ok('lesson Free play: your own column choice is left as it was', await page.evaluate(() => localStorage.getItem('piano-web.freeplay.v1')) === null, '');
    await page.goto(`${BASE}?tool=freeplay`); await page.waitForTimeout(1500);
    const own = await look();
    ok('Free play from Practice: "Play something", the names and all three columns, as before', own.line === 'Play something' && !own.task && own.cols.length === 3 && own.range !== '' && own.labels !== '', JSON.stringify(own));
    ok('Free play from Practice: no group outlines on the keys (off outside lessons unless turned on in Show; owner, 2026-10-17)', await page.evaluate(() => document.querySelectorAll('#freeplay .key-group').length) === 0, '');
    // Simon from lesson 1's copying step: the task above the music; copied to a chain of 3, the game ends, done.
    await page.goto(`${BASE}?page=lesson&lesson=r1-first-sounds`); await page.waitForTimeout(2500);
    await page.locator('.les-step[data-step="copy"] .btn').click(); await page.waitForTimeout(2500);
    const task = await page.evaluate(() => { const t = document.getElementById('ex-task'); return t.hidden ? '' : t.textContent; });
    ok('lesson Simon: the step’s task above the music', /black keys around middle C/i.test(task), JSON.stringify(task));
    const play = async () => {
      // On each turn, the keys Simon expects (its own hook) tapped by position, until the game ends (8 turns at most).
      for (let turn = 0; turn < 8; turn++) {
        let want = [];
        for (let i = 0; i < 150; i++) {
          const st = await page.evaluate(() => ({ want: window.__pianoDebug.simon(), status: document.getElementById('ex-status').textContent }));
          if (/You did it/.test(st.status)) return st;
          if (st.want.length) { want = st.want; break; }
          await page.waitForTimeout(100);
        }
        for (const keys of want) {
          const at = await page.evaluate((m) => { const k = document.querySelector(`#ex-keyboard .key[data-midi="${m}"]`); const r = k.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, keys[0]);
          await page.touchscreen.tap(at[0], at[1]); await page.waitForTimeout(250);
        }
        await page.waitForTimeout(300);
      }
      return page.evaluate(() => ({ status: document.getElementById('ex-status').textContent, sub: document.getElementById('ex-sub').textContent }));
    };
    await page.touchscreen.tap(180, 60); await page.waitForTimeout(200);
    await page.evaluate(() => document.getElementById('ex-start').click()); await page.waitForTimeout(300);
    const end = await play();
    ok('lesson 1 Simon: copied to a chain of 3, the game ends: "You did it"', /You did it: a pattern of 3/.test(end.status), JSON.stringify(end));
    ok('lesson steps after the reviews: no page errors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  // ChatGPT's review of lessons 1 and 2 (2026-10-16): F5, a lesson's Free play opens in the middle, not where Free play was
  // left (at ChatGPT's own window size, where lesson 1's keys are not chosen); F4, a card's missed notes grey with a key.
  {
    const ctx = await learnerContext({ viewport: { width: 1363, height: 936 }, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(`${BASE}?page=lesson&lesson=r1-first-sounds`); await page.waitForTimeout(2500);
    await page.locator('.les-step[data-step="first-sounds"] .btn').click(); await page.waitForTimeout(1500);
    for (let i = 0; i < 8; i++) { if (await page.evaluate(() => document.getElementById('fp-down').disabled)) break; await page.evaluate(() => document.getElementById('fp-down').click()); await page.waitForTimeout(150); }
    const bottom = await page.evaluate(() => document.getElementById('fp-down').disabled);
    await page.goto(`${BASE}?page=lesson&lesson=r1-first-sounds`); await page.waitForTimeout(2500);
    await page.locator('.les-step[data-step="find-groups"] .btn').click(); await page.waitForTimeout(1500);
    const next = await page.evaluate(() => ({ down: !document.getElementById('fp-down').disabled, up: !document.getElementById('fp-up').disabled }));
    ok('F5: left at the bottom of Free play, the next lesson step opens in the middle (both ‹ and › free)', bottom && next.down && next.up, JSON.stringify({ bottom, next }));
    // a reading card with nothing played: its notes grey (not green), and the key under it says so
    await page.goto(`${BASE}?page=lesson&lesson=r1-note-lengths`); await page.waitForTimeout(2500);
    await page.locator('.les-step[data-step="read-then-tap"] .btn').click(); await page.waitForTimeout(2000);
    if (await page.evaluate(() => !document.getElementById('ex-calib')?.hidden)) await page.evaluate(() => document.getElementById('ex-calib-no').click());
    await page.evaluate(() => document.getElementById('ex-start').click()); await page.waitForTimeout(1500);
    const reading = await page.evaluate(() => ({ state: window.__pianoDebug.drill().state, status: document.getElementById('ex-status').textContent, staff: !!document.querySelector('#ex-notation svg') }));
    await page.evaluate(() => document.getElementById('ex-start').click()); // Count in
    let res = null;
    for (let i = 0; i < 120; i++) { res = await page.evaluate(() => ({ status: document.getElementById('ex-status').textContent, legend: document.getElementById('ex-legend').hidden ? '' : document.getElementById('ex-legend').textContent, grey: document.querySelectorAll('#ex-notation svg [fill="#6b7280"]').length, green: document.querySelectorAll('#ex-notation svg [fill="#16a34a"]').length })); if (/Not quite|✓/.test(res.status)) break; await page.waitForTimeout(250); }
    ok('F1: a reading card is shown and waits ("Read it", the staff drawn) until Count in', reading.state === 'read' && /Read it/.test(reading.status) && reading.staff, JSON.stringify(reading));
    ok('F4: a card with nothing played: its notes grey, none green, and the key under it says "grey: missed"', res.grey > 0 && res.green === 0 && /grey: missed/.test(res.legend), JSON.stringify(res));
    ok('F1/F4/F5: no page errors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  // The review ledger (2026-10-16): A4, Lesson from a step's result comes back at that step's card, not the page's top; A3,
  // after the lesson's last step, Next is the rest of the lesson (Check yourself) with Next lesson in its bar.
  {
    const ctx = await learnerContext({ viewport: { width: 360, height: 780 }, hasTouch: true, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
    const cardTop = (id) => page.evaluate((id) => { const c = document.querySelector(`.les-step[data-step="${id}"]`); return c ? Math.round(c.getBoundingClientRect().top) : null; }, id);
    await page.goto(`${BASE}?page=lesson&lesson=r1-first-sounds`); await page.waitForTimeout(2500);
    await page.locator('.les-step[data-step="find-groups"] .btn').click(); await page.waitForTimeout(1200);
    await page.evaluate(() => document.getElementById('fp-done').click()); await page.waitForTimeout(800);
    await page.locator('#lesson-bar button', { hasText: 'Lesson' }).click(); await page.waitForTimeout(1200);
    const back = { top: await cardTop('find-groups'), scrolled: await page.evaluate(() => document.getElementById('lesson-body').scrollTop) };
    ok('A4: Lesson from a step’s result: the lesson page at that step’s card (in view), not the top', back.scrolled > 0 && back.top !== null && back.top > 0 && back.top < 700, JSON.stringify(back));
    // the last step, with the others done: Next goes to the rest of the lesson, whose bar offers the next lesson
    await page.evaluate(() => { const at = new Date().toISOString(); localStorage.setItem('piano-web.path.v1', JSON.stringify({ version: 1, current: 'r1-first-sounds', done: { 'r1-first-sounds': { 'first-sounds': { at, how: 'opened' }, 'find-groups': { at, how: 'opened' }, copy: { at, how: 'target' } } }, tried: {} })); });
    await page.goto(`${BASE}?page=lesson&lesson=r1-first-sounds`); await page.waitForTimeout(2500);
    await page.locator('.les-step[data-step="make-a-tune"] .btn').click(); await page.waitForTimeout(1200);
    await page.locator('#freeplay .fp-keyboard .key.white').nth(3).click(); await page.waitForTimeout(200); // (visited once a key is played: the consistency pass, 2026-10-16)
    await page.evaluate(() => document.getElementById('fp-done').click()); await page.waitForTimeout(800);
    const done = await page.evaluate(() => document.getElementById('lesson-body').innerText);
    await page.locator('#lesson-bar button', { hasText: 'Next' }).click(); await page.waitForTimeout(1200);
    const rest = await page.evaluate(() => { const h = [...document.querySelectorAll('#lesson-body h1, #lesson-body h2, #lesson-body h3')].find((x) => /Check yourself/.test(x.textContent)); const top = h ? Math.round(h.getBoundingClientRect().top - document.getElementById('lesson-body').getBoundingClientRect().top) : null; return { top, bar: [...document.querySelectorAll('#lesson-bar button')].map((b) => b.textContent.trim()) }; });
    ok('A3: after the lesson’s last step, Next shows the rest of the lesson (Check yourself near the top) and its bar offers Next lesson', /Lesson done/.test(done) && rest.top !== null && rest.top >= 0 && rest.top < 120 && rest.bar.some((t) => /Next lesson/.test(t)), JSON.stringify(rest));
    ok('A3/A4: no page errors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  }
  if (!only || only === 'walkfix') { // (`--only walkfix` runs this section alone)
  // ---- After the beginner walk-through (owner, 2026-10-16; design/2026-10-17-walkthrough/ledger.md) --------------------
  // The test lesson "test-walkfix" (a find-it card, fingers, Free play's click, the steady beat at help 0, by ear) in a
  // phone context with touch, taps by position; a stand-in MIDI keyboard where the keyboard's edge keys are checked.
  const WF = '?page=lesson&lesson=test-walkfix';
  async function wfTab(viewport = { width: 360, height: 780 }, init) {
    const ctx = await browser.newContext({ viewport, hasTouch: true, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    if (init) await page.addInitScript(init);
    await page.addInitScript(() => { try { localStorage.setItem('piano-web.calibration.v1', JSON.stringify({ offered: true })); } catch { /* first visit */ } });
    const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
    return { ctx, page, errors };
  }
  const tapBy = async (page, sel, dx = 0, dy = 0) => { const b = await page.locator(sel).first().boundingBox(); await page.touchscreen.tap(b.x + b.width / 2 + dx, b.y + b.height / 2 + dy); };
  const openStep = async (page, step) => { await page.goto(BASE + WF); await page.waitForTimeout(2000); await page.locator(`.les-step[data-step="${step}"] .btn`).click(); await page.waitForTimeout(1500); };
  /** Taps the card on the pad at the app's own times plus offset(i) ms (a function's source), held share of each note's room. */
  const padCard = (page, { offset = '0', share = 0.9, skip = [] } = {}) => page.evaluate(async ({ offset, share, skip }) => {
    const off = new Function('i', `return (${offset});`), D = window.__pianoDebug, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const r = document.getElementById('ex-pad').getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    // (the count-in's words sampled all the way through it, beside the taps: item 27)
    const counts = new Set();
    const sampling = (async () => { for (let i = 0; i < 1500 && D.drill().state !== 'turn' && D.drill().state !== 'result'; i++) { if (D.drill().state === 'countin' && /Count-in/.test(document.getElementById('ex-status').textContent)) counts.add(document.getElementById('ex-status').textContent); await sleep(5); } })();
    let d = null;
    for (let i = 0; i < 2000; i++) { d = D.drill(); if ((d.state === 'countin' && d.now < -300) || (d.state === 'turn' && !d.started)) break; await sleep(5); }
    if (!(d.state === 'countin' || d.state === 'turn')) return { error: d.state };
    const zero = performance.now() - d.now;
    const fire = (type, id) => document.elementFromPoint(x, y).dispatchEvent(new PointerEvent(type, { pointerId: id, bubbles: true, cancelable: true, clientX: x, clientY: y, pointerType: 'touch', isPrimary: true }));
    await Promise.all(d.steps.map((s, i) => new Promise((done) => {
      if (skip.includes(i)) { done(); return; }
      const room = (d.steps[i + 1]?.t ?? s.t + s.dur) - s.t;
      setTimeout(() => { fire('pointerdown', 40 + i); setTimeout(() => { fire('pointerup', 40 + i); done(); }, Math.min(s.dur, room) * share); }, zero + s.t + d.heardDelay + off(i) - performance.now());
    })));
    for (let i = 0; i < 200 && !['result', 'done'].includes(D.drill().state); i++) await sleep(25);
    await sampling;
    return { counts: [...counts], status: document.getElementById('ex-status').textContent, sub: document.getElementById('ex-sub').textContent, legend: document.getElementById('ex-legend').hidden ? '' : document.getElementById('ex-legend').textContent };
  }, { offset, share, skip });

  // 1. A "find it" card (item 30): its words, no note names; the starting tap is not an answer; a white key is "not that
  //    group" with the group outlined; a key of the group is clean. The set picker inside the step lists the lesson's sets.
  for (const viewport of [{ width: 360, height: 780 }, { width: 844, height: 390 }]) {
    const { ctx, page, errors } = await wfTab(viewport);
    await openStep(page, 'find');
    const sets = await page.evaluate(() => [...document.querySelectorAll('#ex-set option')].map((o) => o.value));
    ok(`walkfix ${viewport.width}: inside a lesson step the set picker lists only that lesson's sets (item 40)`, JSON.stringify(sets.sort()) === JSON.stringify(['black-keys-middle', 'rhythm-steady-beat', 'test-find-groups']), JSON.stringify(sets));
    await tapBy(page, '#ex-keyboard .key[data-midi="61"]', 0, 12); await page.waitForTimeout(500); // a key on Ready starts the set
    const shown = await page.evaluate(() => ({ name: document.getElementById('ex-name').textContent, results: document.querySelectorAll('#ex-chain .ex-result').length, state: window.__pianoDebug.drill().state, want: window.__pianoDebug.drill().steps[0]?.keys }));
    await tapBy(page, '#ex-keyboard .key[data-midi="60"]', -4, 40); await page.waitForTimeout(500);
    const miss = await page.evaluate(() => ({ status: document.getElementById('ex-status').textContent, wrong: [...document.querySelectorAll('#ex-keyboard .key.wrong')].map((k) => Number(k.dataset.midi)), want: [...document.querySelectorAll('#ex-keyboard .key.want')].map((k) => Number(k.dataset.midi)), legend: document.getElementById('ex-legend').textContent }));
    ok(`walkfix ${viewport.width}: a find-it card names its place in words (no note names), and the tap that started the set is not an answer`, /^Find a group of (two|three), (lower down|higher up)$/.test(shown.name) && shown.state === 'turn', JSON.stringify(shown));
    ok(`walkfix ${viewport.width}: a white key on a find-it card: "Not quite", the key red, the group named outlined in blue, "red: a wrong key"`, miss.status === 'Not quite' && miss.wrong.join() === '60' && JSON.stringify(miss.want) === JSON.stringify(shown.want) && /red: a wrong key/.test(miss.legend), JSON.stringify(miss));
    await tapBy(page, '#ex-again'); await page.waitForTimeout(400);
    await tapBy(page, `#ex-keyboard .key[data-midi="${shown.want.at(-1)}"]`, 3, 12); await page.waitForTimeout(400);
    ok(`walkfix ${viewport.width}: Again, then a key of the group: right on a retry`, await page.evaluate(() => /Right this time/.test(document.getElementById('ex-status').textContent)));
    await page.locator('#ex-level').click(); await page.waitForTimeout(300);
    const panel = await page.evaluate(() => ({ rungHidden: document.querySelector('#drill-dialog input[name="d-rung"]').closest('fieldset').hidden, timing: document.querySelector('#drill-dialog input[name="d-onTime"]').closest('fieldset').hidden, own: !!document.querySelector('#drill-dialog [data-own] input[value="4"]') }));
    ok(`walkfix ${viewport.width}: the Level panel of a find-it set has no help rungs or timing, and shows the step's 4 cards as a choice`, panel.rungHidden && panel.timing && panel.own, JSON.stringify(panel));
    ok(`walkfix ${viewport.width}: find-it: no page errors`, errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  // 2. The steady beat at help 0 (items 19, 20, 22, 13, 27): a card rushed 60 ms a beat: the taps on the beat line (four
  //    on time, four early in orange), "You sped up"; Again keeps "Card 1 of 3" (it said Card 2 while replaying); from the
  //    set's second card on a tap in the demo goes to the count-in; the count-in never reads 0; the set's whole list in view.
  for (const viewport of [{ width: 360, height: 780 }, { width: 844, height: 390 }]) {
    const { ctx, page, errors } = await wfTab(viewport);
    await openStep(page, 'beat');
    await tapBy(page, '#ex-pad');
    const r1 = await padCard(page, { offset: 'i * -60' });
    const line = await page.evaluate(() => { const b = document.getElementById('ex-beatline'), r = b.getBoundingClientRect(); return { shown: !b.hidden && r.height > 40, taps: b.querySelectorAll('.beatline-tap').length, off: b.querySelectorAll('.beatline-off').length, music: !document.getElementById('ex-notation').classList.contains('off') }; });
    ok(`walkfix ${viewport.width}: steady beat, no music: the taps drawn on a line of beats, the early ones orange, no staff (item 19)`, line.shown && line.taps === 8 && line.off >= 3 && !line.music, JSON.stringify(line));
    ok(`walkfix ${viewport.width}: rushing through the card is named: "You sped up" (item 20), with the marks' key`, /You sped up/.test(r1.sub) && /orange: early/.test(r1.legend), JSON.stringify(r1));
    ok(`walkfix ${viewport.width}: the count-in reads 1 to 4, never 0 (item 27)`, r1.counts.length > 0 && r1.counts.every((c) => /Count-in… [1-4]$/.test(c)), JSON.stringify(r1.counts));
    await tapBy(page, '#ex-again'); await page.waitForTimeout(300);
    const again = await page.evaluate(() => ({ left: document.getElementById('ex-left').textContent, state: window.__pianoDebug.drill().state, sub: document.getElementById('ex-sub').textContent }));
    ok(`walkfix ${viewport.width}: Again: the counter stays on the card replayed ("Card 1 of 3"; item 13), and says a tap skips to the count-in`, again.left === 'Card 1 of 3' && again.state === 'demo' && /a tap skips to the count-in/.test(again.sub), JSON.stringify(again));
    await page.waitForTimeout(1000);
    await tapBy(page, '#ex-pad'); await page.waitForTimeout(120);
    ok(`walkfix ${viewport.width}: a tap during the demo (after the first card) goes to the count-in (item 22)`, await page.evaluate(() => window.__pianoDebug.drill().state === 'countin'));
    const r2 = await padCard(page, { skip: [5] });
    const missed = await page.evaluate(() => document.querySelectorAll('#ex-beatline .beatline-missed').length);
    ok(`walkfix ${viewport.width}: a beat not tapped is ringed grey on the line, "grey: missed"`, missed === 1 && /grey: missed/.test(r2.legend), JSON.stringify({ missed, r2 }));
    await tapBy(page, '#ex-next'); await page.waitForTimeout(300);
    for (let c = 0; c < 2; c++) { await padCard(page, { skip: c ? [] : [2], share: 0.6 }); await page.waitForTimeout(1500); if (await page.evaluate(() => !document.getElementById('ex-after').hidden && !document.getElementById('ex-next').hidden)) { await tapBy(page, '#ex-next'); await page.waitForTimeout(300); } }
    await page.waitForTimeout(1500);
    const list = await page.evaluate(() => { const c = document.getElementById('ex-chain'), rows = [...c.querySelectorAll('.ex-result')], box = c.getBoundingClientRect(); return { rows: rows.length, inView: rows.every((r) => { const b = r.getBoundingClientRect(); return b.top >= box.top - 1 && b.bottom <= box.bottom + 1; }), status: document.getElementById('ex-status').textContent }; });
    ok(`walkfix ${viewport.width}: Set done: every card's line in view, not hidden in a small box (item 14)`, /Set done/.test(list.status) && list.rows === 3 && list.inView, JSON.stringify(list));
    ok(`walkfix ${viewport.width}: steady beat: no page errors`, errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  // 3. A card to read (music only): Hear it plays it, then it waits to be read again, not counted in and judged (item 17).
  {
    const { ctx, page, errors } = await wfTab();
    await ctx.route(/\/content\/activities\/check-wf-read\.json$/, (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ title: 'Check: read', screen: 'drills', set: 'rhythm-quarter-half', level: { rung: 3, start: 'clicks', metronome: true, onTime: 'normal', cards: 1 } }) }));
    await page.goto(`${BASE}?activity=check-wf-read`); await page.waitForTimeout(2000);
    if (await page.evaluate(() => !document.getElementById('tap-to-start').hidden)) { await page.touchscreen.tap(180, 400); await page.waitForTimeout(300); }
    await tapBy(page, '#ex-start'); await page.waitForTimeout(800);
    const before = await page.evaluate(() => window.__pianoDebug.drill().state);
    await tapBy(page, '#ex-hear'); await page.waitForTimeout(200);
    const during = await page.evaluate(() => window.__pianoDebug.drill().state);
    for (let i = 0; i < 100 && (await page.evaluate(() => window.__pianoDebug.drill().state)) === 'demo'; i++) await page.waitForTimeout(100);
    await page.waitForTimeout(1500);
    const after = await page.evaluate(() => ({ state: window.__pianoDebug.drill().state, status: document.getElementById('ex-status').textContent }));
    ok('walkfix: Hear it on a card to read plays it, then the card waits to be read again (was: counted in and judged at once)', before === 'read' && during === 'demo' && after.state === 'read' && after.status === 'Read it', JSON.stringify({ before, during, after }));
    ok('walkfix: reading card: no page errors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  // 4. Free play (items 30/32, 31, 38, 46, 33): the groups outlined (2 and 3), where you are on the whole piano and a word
  //    for it (the top at the top), finger numbers from the step, a pressed key cyan, Show's names off in a step that
  //    hides them, and the step's click with its toggle.
  for (const viewport of [{ width: 360, height: 780 }, { width: 844, height: 390 }]) {
    const { ctx, page, errors } = await wfTab(viewport);
    await openStep(page, 'fingers');
    const st = await page.evaluate(() => ({ groups: [...document.querySelectorAll('#freeplay .key-group')].map((g) => g.classList.contains('two') ? 2 : 3), fingers: Object.fromEntries([...document.querySelectorAll('#freeplay .key .finger')].map((f) => [f.parentElement.dataset.midi, Number(f.textContent)])), place: document.getElementById('fp-place').textContent, here: !!document.querySelector('#fp-mini .mini-here'), range: document.getElementById('fp-range').textContent }));
    ok(`walkfix ${viewport.width}: Free play shows the black keys' groups outlined, 2 and 3, and where you are ("the middle", the part shown marked on the whole piano)`, st.groups.includes(2) && st.groups.includes(3) && st.place === 'the middle' && st.here && st.range === '', JSON.stringify(st));
    ok(`walkfix ${viewport.width}: finger numbers on the keys from the step: 2-3 on a pair, 2-3-4 on a three (item 31)`, st.fingers[61] === 2 && st.fingers[63] === 3 && st.fingers[66] === 2 && st.fingers[68] === 3 && st.fingers[70] === 4 && st.fingers[60] === undefined, JSON.stringify(st.fingers));
    const b = await page.locator('#freeplay .key[data-midi="63"]').boundingBox();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b.x + b.width / 2 + 4, y: b.y + b.height * 0.6 }] }); await page.waitForTimeout(250);
    const held = await page.evaluate(() => getComputedStyle(document.querySelector('#freeplay .key[data-midi="63"]')).backgroundColor);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await page.waitForTimeout(250);
    const up = await page.evaluate(() => getComputedStyle(document.querySelector('#freeplay .key[data-midi="63"]')).backgroundColor);
    ok(`walkfix ${viewport.width}: a key held by touch looks pressed (cyan), and not once let go (item 33)`, held === 'rgb(8, 145, 178)' && up !== held, JSON.stringify({ held, up }));
    for (let i = 0; i < 8; i++) await tapBy(page, '#fp-up');
    const top = await page.evaluate(() => ({ place: document.getElementById('fp-place').textContent, up: document.getElementById('fp-up').disabled }));
    ok(`walkfix ${viewport.width}: › to the end: the word says "the top" (› had stopped there silently)`, top.place === 'the top' && top.up, JSON.stringify(top));
    await tapBy(page, '#fp-show'); await page.waitForTimeout(300);
    const show = await page.evaluate(() => ({ off: [...document.querySelectorAll('#fp-show-dialog input[name="fp-col"]')].every((b) => b.disabled && !b.checked), note: !document.getElementById('fp-cols-off').hidden, box: Math.round(document.querySelector('#fp-show-dialog input[name="fp-col"]').getBoundingClientRect().height) }));
    ok(`walkfix ${viewport.width}: Show in a step that hides names: the columns of names off and not offered, said why (item 38); its boxes 22 px (item 60)`, show.off && show.note && show.box >= 22, JSON.stringify(show));
    await page.evaluate(() => document.getElementById('fp-show-dialog').close());
    await page.evaluate(() => document.getElementById('fp-done').click()); await page.waitForTimeout(800);
    await page.locator('#lesson-bar button', { hasText: 'Lesson' }).click(); await page.waitForTimeout(800);
    await page.locator('.les-step[data-step="click"] .btn').click(); await page.waitForTimeout(1500);
    const ck = await page.evaluate(() => ({ btn: document.getElementById('fp-click').textContent, groups: document.querySelectorAll('#freeplay .key-group').length, t0: window.__pianoDebug.metronome ? 0 : 0 }));
    await tapBy(page, '#fp-click'); await page.waitForTimeout(200);
    const off = await page.evaluate(() => document.getElementById('fp-click').textContent);
    ok(`walkfix ${viewport.width}: a step's click in Free play starts with the screen (♩72), its toggle turns it off; that step's groups: false hides the groups (item 46)`, ck.btn === 'Click ♩72: on' && off === 'Click ♩72: off' && ck.groups === 0, JSON.stringify({ ck, off }));
    ok(`walkfix ${viewport.width}: Free play: no page errors`, errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  // 5. Simon by ear (item 36): wrong keys keep your turn; no heart lost or shown, nothing outlined, no note named.
  {
    const { ctx, page, errors } = await wfTab();
    await openStep(page, 'by-ear');
    await tapBy(page, '#ex-start');
    for (let i = 0; i < 80 && !(await page.evaluate(() => window.__pianoDebug.simon().length)); i++) await page.waitForTimeout(100);
    const want = (await page.evaluate(() => window.__pianoDebug.simon()))[0][0];
    for (const k of [61, 63, 66, 68, 70].filter((k) => k !== want).slice(0, 3)) { await tapBy(page, `#ex-keyboard .key[data-midi="${k}"]`, 0, 10); await page.waitForTimeout(400); }
    const s = await page.evaluate(() => ({ status: document.getElementById('ex-status').textContent, hearts: document.getElementById('ex-right').textContent, outlined: document.querySelectorAll('#ex-keyboard .key.want').length, turn: window.__pianoDebug.simon().length > 0 }));
    ok('walkfix: Simon by ear: three wrong keys keep your turn ("listen again, and try another key"), no game over, no hearts, nothing outlined, no note named', s.turn && /try another key/.test(s.status) && !/[A-G][♯#]?\d/.test(s.status) && s.hearts === '' && s.outlined === 0, JSON.stringify(s));
    ok('walkfix: by ear: no page errors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  // 6. Home's Start (item 1), Up next after a done lesson (item 2), the last lesson's bar (item 3).
  {
    const at = new Date().toISOString();
    const path = (current, done) => ({ version: 1, current, done, tried: {} });
    const steps = { 'test-walkfix': ['find', 'fingers', 'click', 'beat', 'by-ear'] };
    const { ctx, page, errors } = await wfTab({ width: 390, height: 844 });
    await page.goto(BASE); await page.waitForTimeout(500);
    await page.evaluate((p) => localStorage.setItem('piano-web.path.v1', JSON.stringify(p)), path('test-walkfix', { 'test-walkfix': { find: { at, how: 'target' } } }));
    await page.goto(BASE); await page.waitForTimeout(2000);
    const card = await page.evaluate(() => document.querySelector('#home-body .today .k')?.textContent);
    await page.locator('#home-body .today .btn.main').click(); await page.waitForTimeout(1800);
    // (the part: the heading before step 2 in view, and step 1's card scrolled away above it, as far as a short page scrolls)
    const where = await page.evaluate(() => { const b = document.getElementById('lesson-body').getBoundingClientRect(); const h = [...document.querySelectorAll('#lesson-body h3, #lesson-body h4')].find((e) => e.textContent === 'Fingers')?.getBoundingClientRect(); const s1 = document.querySelector('.les-step[data-step="find"]').getBoundingClientRect(); return { url: location.search, fp: !document.getElementById('freeplay').hidden, heading: h ? h.top >= b.top - 2 && h.bottom <= b.bottom : false, scrolled: document.getElementById('lesson-body').scrollTop > 0, s1above: s1.top < b.top + 40, bar: document.getElementById('lesson-bar').innerText }; });
    ok('walkfix: Home’s Start opens the lesson page at that step’s part (its heading at the top, "Start step 2" in the bar), not the step’s screen (item 1)', /step 2 of 5/.test(card) && /page=lesson&lesson=test-walkfix/.test(where.url) && !/tool=/.test(where.url) && !where.fp && where.heading && where.scrolled && /Start step 2/.test(where.bar), JSON.stringify({ card, where }));
    // every step done, the lesson still the current one (opened again): Up next is another lesson with steps to do
    await page.evaluate((p) => localStorage.setItem('piano-web.path.v1', JSON.stringify(p)), path('test-walkfix', { 'test-walkfix': Object.fromEntries(steps['test-walkfix'].map((s) => [s, { at, how: 'played' }])) }));
    await page.goto(BASE); await page.waitForTimeout(2000);
    const up = await page.evaluate(() => [...document.querySelectorAll('#home-body .today div')].slice(0, 3).map((d) => d.textContent).join(' | '));
    ok('walkfix: a lesson done and opened again is not Up next: Home offers the next lesson with steps to do, not "Again" (item 2)', /^Up next/.test(up) && !/the walk-through's new pieces/.test(up), up);
    // the path's every lesson done: the lesson bar says the next is not written yet, with Practice
    const all = await page.evaluate(() => fetch('content/path/index.json').then((r) => r.json()));
    const lessons = await page.evaluate(async (ids) => Object.fromEntries(await Promise.all(ids.map(async (id) => [id, (await (await fetch(`content/path/lessons/${id}.json`)).json()).blocks.filter((b) => b.kind === 'step').map((b) => b.id)]))), all.rungs.flatMap((r) => r.lessons));
    // Switch… (item 2): every lesson done but the last: from the lesson before it, the last is Open (an earlier one not done: Skip ahead)
    const allBut = Object.fromEntries(Object.entries(lessons).map(([l, ss]) => [l, Object.fromEntries(ss.map((s) => [s, { at, how: 'played' }]))]));
    const lastId = all.rungs.flatMap((r) => r.lessons).at(-1), before = all.rungs.flatMap((r) => r.lessons).at(-2);
    delete allBut[lastId];
    await page.evaluate((p) => localStorage.setItem('piano-web.path.v1', JSON.stringify(p)), path(before, allBut));
    await page.goto(`${BASE}?page=lesson&lesson=${before}`); await page.waitForTimeout(1800);
    await page.locator('#lesson-switch').click(); await page.waitForTimeout(500);
    const swOpen = await page.evaluate(() => [...document.querySelectorAll('#switch-body .li')].at(-1)?.querySelector('button')?.textContent);
    const notDone = { ...allBut }; delete notDone[all.rungs.find((r) => r.lessons.includes(lastId)).lessons[0]];
    await page.evaluate((p) => localStorage.setItem('piano-web.path.v1', JSON.stringify(p)), path(before, notDone));
    await page.goto(`${BASE}?page=lesson&lesson=${before}`); await page.waitForTimeout(1800);
    await page.locator('#lesson-switch').click(); await page.waitForTimeout(500);
    const swSkip = await page.evaluate(() => [...document.querySelectorAll('#switch-body .li')].at(-1)?.querySelector('button')?.textContent);
    ok('walkfix: Switch…: the next lesson, every earlier one done, is "Open"; with an earlier lesson not done, "Skip ahead" (item 2)', swOpen === 'Open' && swSkip === 'Skip ahead', JSON.stringify({ swOpen, swSkip }));
    await page.evaluate((p) => localStorage.setItem('piano-web.path.v1', JSON.stringify(p)), path('test-walkfix', Object.fromEntries(Object.entries(lessons).map(([l, ss]) => [l, Object.fromEntries(ss.map((s) => [s, { at, how: 'played' }]))]))));
    const last = all.rungs.flatMap((r) => r.lessons).at(-1);
    await page.goto(`${BASE}?page=lesson&lesson=${last}`); await page.waitForTimeout(1800);
    const bar = await page.evaluate(() => document.getElementById('lesson-bar').innerText.replace(/\s+/g, ' '));
    ok('walkfix: the path’s last lesson done: the bar says the next lesson is not written yet and offers Practice (item 3)', /not written yet/.test(bar) && /Practice/.test(bar) && !/Next lesson/.test(bar), bar);
    ok('walkfix: Home and the path: no page errors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  // 7. A reload inside a rhythm step: the first tap on the pad (the screen still saying "Tap anywhere to start") starts
  //    the set too, not only the sound (item 29); the words sit high, off the screen's Ready (item 43).
  {
    const { ctx, page, errors } = await wfTab({ width: 820, height: 1180 });
    await openStep(page, 'beat');
    await page.reload(); await page.waitForTimeout(2200);
    const cover = await page.evaluate(() => { const c = document.getElementById('tap-to-start'), p = c.querySelector('p').getBoundingClientRect(), r = document.getElementById('ex-name').getBoundingClientRect(); return { shown: !c.hidden, overlap: !(p.bottom <= r.top || p.top >= r.bottom) }; });
    await tapBy(page, '#ex-pad'); await page.waitForTimeout(600);
    const state = await page.evaluate(() => window.__pianoDebug.drill().state);
    ok('walkfix: after a reload the cover’s words do not sit over "Ready", and the first tap on the pad starts the set (was: only the sound)', cover.shown && !cover.overlap && state !== 'idle', JSON.stringify({ cover, state }));
    ok('walkfix: reload: no page errors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  // 8. The keyboard's lowest key at a rhythm set's end goes to a new set (item 23); a card with slips: it is Again.
  {
    const { ctx, page, errors } = await wfTab({ width: 390, height: 844 }, () => {
      const input = { id: 'k', name: 'Test keys', state: 'connected', onmidimessage: null };
      const access = { inputs: new Map([[input.id, input]]), outputs: new Map(), onstatechange: null };
      Object.defineProperty(Navigator.prototype, 'requestMIDIAccess', { value: async () => access, configurable: true });
      window.__key = (m, on) => input.onmidimessage?.({ data: new Uint8Array([on ? 0x90 : 0x80, m, on ? 90 : 0]), timeStamp: performance.now() });
      try { localStorage.setItem('piano-web.remote.v1', JSON.stringify({ low: 36, high: 96, edges: true, mash: true })); } catch { /* first visit */ }
    });
    await openStep(page, 'beat');
    const press = async (m) => { await page.evaluate((m) => window.__key(m, true), m); await page.waitForTimeout(60); await page.evaluate((m) => window.__key(m, false), m); };
    await press(60);
    await padCard(page, { skip: [2] }); await page.waitForTimeout(900);
    await press(36); await page.waitForTimeout(300);
    const again = await page.evaluate(() => ({ state: window.__pianoDebug.drill().state, left: document.getElementById('ex-left').textContent }));
    for (let c = 0; c < 3; c++) { await padCard(page); await page.waitForTimeout(1700); }
    const done = await page.evaluate(() => ({ state: window.__pianoDebug.drill().state, sub: document.getElementById('ex-sub').textContent }));
    await page.waitForTimeout(900);
    await press(36); await page.waitForTimeout(500);
    const fresh = await page.evaluate(() => ({ state: window.__pianoDebug.drill().state, left: document.getElementById('ex-left').textContent }));
    ok('walkfix: the lowest key: on a card with slips Again (the card replayed), at Set done a new set, said "lowest key: a new set"', again.state === 'demo' && again.left === 'Card 1 of 3' && done.state === 'done' && /lowest key: a new set/.test(done.sub) && fresh.state !== 'done' && fresh.left === 'Card 1 of 3', JSON.stringify({ again, done, fresh }));
    ok('walkfix: keyboard keys: no page errors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  // 9. Sizes (items 54, 56): the exercise screen's controls 44 px tall; the Level panel's radios 22 px, the panel inside the
  //    screen with its Done reachable, at 360×780 and 844×390.
  for (const viewport of [{ width: 360, height: 780 }, { width: 844, height: 390 }]) {
    const { ctx, page, errors } = await wfTab(viewport);
    await openStep(page, 'by-ear');
    const small = await page.evaluate(() => [...document.querySelectorAll('#exercise .fp-head button, #exercise .fp-head select')].filter((b) => b.offsetParent).map((b) => Math.round(b.getBoundingClientRect().height)).filter((h) => h < 44));
    await page.locator('#ex-level').click(); await page.waitForTimeout(300);
    const dlg = await page.evaluate(() => { const d = document.getElementById('ex-level-dialog'), r = d.getBoundingClientRect(); return { inside: r.top >= 0 && r.bottom <= innerHeight + 1, radio: Math.round(d.querySelector('input[type=radio]').getBoundingClientRect().height), scrolls: d.scrollHeight <= d.clientHeight + 1 || getComputedStyle(d).overflowY === 'auto' }; });
    ok(`walkfix ${viewport.width}: the exercise screen's top controls 44 px tall; the Level panel inside the screen, scrolling, radios 22 px`, small.length === 0 && dlg.inside && dlg.scrolls && dlg.radio >= 22, JSON.stringify({ small, dlg }));
    ok(`walkfix ${viewport.width}: sizes: no page errors`, errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  // 10. A tune before the staff (owner, 2026-10-17): a letters card (the test set: Merrily's first two bars, E D C D | E E
  //     E-half) drawn on the one-line rhythm staff with each note's letter under it, on the keys (no pad), at 360×780 and
  //     844×390 with no sideways scrolling (a four-bar card too); played right: clean; one wrong key: that note marked
  //     (grey, the key red, the right one outlined); the half note let go early: "let go early", the half note orange.
  {
    const letterLook = (page) => page.evaluate(() => {
      const box = document.getElementById('ex-notation'), svg = box.querySelector('svg');
      return { letters: [...box.querySelectorAll('svg text')].map((t) => t.textContent).filter((t) => /^[A-G][♯♭]?$/.test(t)).join(' '), sideways: box.scrollWidth > box.clientWidth + 1 || (svg?.getBoundingClientRect().right ?? 0) > innerWidth,
        lyric: Math.max(0, ...[...box.querySelectorAll('svg text')].filter((t) => /^[A-G]$/.test(t.textContent)).map((t) => Math.round(t.getBoundingClientRect().height))),
        keys: !document.getElementById('ex-keyboard').classList.contains('off'), pad: !document.getElementById('ex-pad').hidden, state: window.__pianoDebug.drill().state };
    });
    const keysCard = (page, { wrong = {}, short = [] } = {}) => page.evaluate(async ({ wrong, short }) => {
      const D = window.__pianoDebug, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      let d = null;
      for (let i = 0; i < 2000; i++) { d = D.drill(); if (d.state === 'read') { document.getElementById('ex-start').click(); await sleep(50); continue; } if ((d.state === 'countin' && d.now < -300) || (d.state === 'turn' && !d.started)) break; await sleep(5); }
      const zero = performance.now() - d.now;
      const fire = (type, m, id) => { const k = document.querySelector(`#ex-keyboard .key[data-midi="${m}"]`), r = k.getBoundingClientRect(), x = r.left + r.width / 2 + 3, y = r.top + r.height * 0.8; document.elementFromPoint(x, y).dispatchEvent(new PointerEvent(type, { pointerId: id, bubbles: true, cancelable: true, clientX: x, clientY: y, pointerType: 'touch', isPrimary: true })); };
      await Promise.all(d.steps.map((s, i) => new Promise((done) => {
        const m = wrong[i] ?? s.keys[0], room = (d.steps[i + 1]?.t ?? s.t + s.dur) - s.t;
        setTimeout(() => { fire('pointerdown', m, 60 + i); setTimeout(() => { fire('pointerup', m, 60 + i); done(); }, Math.min(s.dur, room) * (short.includes(i) ? 0.4 : 0.9)); }, zero + s.t + d.heardDelay - performance.now());
      })));
      for (let i = 0; i < 200 && D.drill().state !== 'result'; i++) await sleep(25);
      return { status: document.getElementById('ex-status').textContent, sub: document.getElementById('ex-sub').textContent, grey: document.querySelectorAll('#ex-notation svg [fill="#6b7280"]').length, orange: document.querySelectorAll('#ex-notation svg [fill="#d97706"]').length,
        wrongKey: [...document.querySelectorAll('#ex-keyboard .key.wrong')].map((k) => k.dataset.midi).join(), want: [...document.querySelectorAll('#ex-keyboard .key.want')].map((k) => k.dataset.midi).join() };
    }, { wrong, short });
    for (const viewport of [{ width: 360, height: 780 }, { width: 844, height: 390 }]) {
      for (const bars of [2, 4]) {
        const { ctx, page, errors } = await wfTab(viewport);
        if (bars === 4) await ctx.route(/\/content\/sets\/test-letters\.json$/, (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ title: 'Test: letters', view: 'letters', order: 'passage', tempo: 72, items: { 1: { musicxml: 'test-letters-4.musicxml' } } }) }));
        await page.goto(`${BASE}?activity=test-letters`); await page.waitForTimeout(2000);
        if (await page.evaluate(() => !document.getElementById('tap-to-start').hidden)) { await page.touchscreen.tap(viewport.width / 2, viewport.height / 2); await page.waitForTimeout(300); }
        await tapBy(page, '#ex-start'); await page.waitForTimeout(1500);
        const look = await letterLook(page);
        const want = bars === 2 ? 'E D C D E E E' : 'E D C D E E E E D C D E E E';
        ok(`walkfix ${viewport.width}: a letters card of ${bars} bars: the one-line staff with each note's letter under it (${want}), read on the keys (no pad), no sideways scrolling, letters 12 px or more`, look.letters === want && !look.sideways && look.keys && !look.pad && look.state === 'read' && look.lyric >= 12, JSON.stringify(look));
        if (bars === 2 && viewport.width === 360) {
          const right = await keysCard(page);
          ok('walkfix: the letters card played right is clean', /Clean/.test(right.status), JSON.stringify(right));
          await page.waitForTimeout(1800);
          await tapBy(page, '#ex-fresh'); await page.waitForTimeout(1500);
          const wrong = await keysCard(page, { wrong: { 3: 60 } });
          ok('walkfix: one wrong key (C for the D on beat 4): that note marked grey, "D missed · 1 wrong key", the C red, the D outlined', /D missed/.test(wrong.sub) && /1 wrong key/.test(wrong.sub) && wrong.grey >= 1 && wrong.wrongKey === '60' && wrong.want === '62', JSON.stringify(wrong));
          await tapBy(page, '#ex-again'); await page.waitForTimeout(1200);
          const short = await keysCard(page, { short: [6] });
          ok('walkfix: the right keys with the half note let go early: "E let go early", the half note orange', /E let go early/.test(short.sub) && short.orange >= 1 && short.grey === 0, JSON.stringify(short));
        }
        ok(`walkfix ${viewport.width}: letters (${bars} bars): no page errors`, errors.length === 0, errors.join(' | '));
        await ctx.close();
      }
    }
  }
  // 11. Letters view, the note values (2026-10-17): with each letter under its note, a half note still drawn open and a
  //     whole note open with no stem, told from a quarter at 360 px: the middle of each notehead sampled from the drawing
  //     (rasterised in the page): the ink inside each notehead's box, most of it for a quarter, under half for the open half and whole (the one staff line crosses each head, so its middle pixel is ink either way).
  {
    const { ctx, page, errors } = await wfTab({ width: 360, height: 780 });
    await ctx.route(/\/content\/sets\/test-letters\.json$/, (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ title: 'Test: letters', view: 'letters', order: 'passage', tempo: 72, items: { 1: { musicxml: 'test-letters-values.musicxml' } } }) }));
    await page.goto(`${BASE}?activity=test-letters`); await page.waitForTimeout(2000);
    if (await page.evaluate(() => !document.getElementById('tap-to-start').hidden)) { await page.touchscreen.tap(180, 390); await page.waitForTimeout(300); }
    await tapBy(page, '#ex-start'); await page.waitForTimeout(1500);
    const heads = await page.evaluate(async () => {
      const svg = document.querySelector('#ex-notation svg'), box = svg.getBoundingClientRect(), scale = 3;
      const xml = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      await new Promise((ok) => { img.onload = ok; img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`; });
      const c = document.createElement('canvas'); c.width = Math.round(box.width * scale); c.height = Math.round(box.height * scale);
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
      return [...svg.querySelectorAll('.vf-notehead')].map((h) => { const r = h.getBoundingClientRect(); const d = g.getImageData(Math.round((r.left - box.left) * scale), Math.round((r.top - box.top) * scale), Math.max(1, Math.round(r.width * scale)), Math.max(1, Math.round(r.height * scale))).data; let dark = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] < 300) dark++; const share = dark / (d.length / 4); return { w: Math.round(r.width), ink: Math.round(share * 100), light: share < 0.65 }; }); // (measured: quarters 76–77%, the half 56%, the whole 52%: the line through an open head inks its middle)
    });
    const letters = await page.evaluate(() => [...document.querySelectorAll('#ex-notation svg text')].map((t) => t.textContent).filter((t) => /^[A-G]$/.test(t)).join(' '));
    await page.screenshot({ path: join(tmp, 'letters-values.png') });
    ok('walkfix: letters view, quarter quarter half | whole at 360 px: the letters under them (C D E C), the quarters filled, the half and the whole open', letters === 'C D E C' && heads.length === 4 && !heads[0].light && !heads[1].light && heads[2].light && heads[3].light, JSON.stringify({ letters, heads }));
    ok('walkfix: letters (note values): no page errors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }

  // 12. A find-it card by letter (2026-10-17): opened from Practice (names shown elsewhere): no key names or octave labels
  //     on its keys, whatever the rung; the keys C3–B5 drawn whole (no ‹ › on this screen); "a D, higher up" counts D5 only.
  {
    const { ctx, page, errors } = await wfTab({ width: 360, height: 780 });
    await page.goto(`${BASE}?tool=drill&set=test-find-letters`); await page.waitForTimeout(2000);
    if (await page.evaluate(() => !document.getElementById('tap-to-start').hidden)) { await page.touchscreen.tap(180, 390); await page.waitForTimeout(300); }
    const keys = await page.evaluate(() => { const ks = [...document.querySelectorAll('#ex-keyboard .key')]; const white = ks.filter((k) => k.classList.contains('white')), black = ks.filter((k) => k.classList.contains('black')); return { labels: white.map((k) => k.textContent).join(''), lo: Number(ks[0]?.dataset.midi), hi: Number(ks.at(-1)?.dataset.midi), white: Math.round(white[0].getBoundingClientRect().width), black: Math.round(black[0].getBoundingClientRect().width) }; });
    await tapBy(page, '#ex-start'); await page.waitForTimeout(700);
    let name = '', guard = 0;
    while (!/a D, higher up/.test(name) && guard++ < 10) { name = await page.evaluate(() => document.getElementById('ex-name').textContent); if (!/a D, higher up/.test(name)) { await tapBy(page, '#ex-next'); await page.waitForTimeout(700); if (await page.evaluate(() => window.__pianoDebug.drill().state === 'result')) { await tapBy(page, '#ex-next'); await page.waitForTimeout(700); } } }
    await tapBy(page, '#ex-keyboard .key[data-midi="62"]', 0, 40); await page.waitForTimeout(500);
    const d4 = await page.evaluate(() => ({ status: document.getElementById('ex-status').textContent, want: [...document.querySelectorAll('#ex-keyboard .key.want')].map((k) => k.dataset.midi).join() }));
    ok('walkfix: a find-it card by letter: no names or octave labels on its keys (C3–B5 drawn whole at 360 px), "a D, higher up": D4 is "not that one", D5 outlined', keys.labels === '' && keys.lo === 48 && keys.hi >= 83 && /a D, higher up/.test(name) && d4.status === 'Not quite' && d4.want === '74', JSON.stringify({ keys, name, d4 }));
    ok('walkfix: find by letter: no page errors', errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
  } // (end of `--only walkfix`)
} finally {
  await browser?.close();
  stop();
}
const failed = results.filter((r) => !r).length;
console.log(failed ? `${failed} failed` : `all ${results.length} passed`);
process.exit(failed ? 1 : 0);
