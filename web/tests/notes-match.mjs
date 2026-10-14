// Notes check: the pitches the app draws in each bar (spelled, sorted) are the score file's, bar by bar. Not compared:
// where in the bar a note is, its length, its staff (test review, 2026-10-14: the header said more than this checks).
// The app's side comes from what OSMD drew (window.__pianoDebug.drawnNotes); the file's side is read
// separately here with the browser's own XML parser, so a renderer or reading mistake shows up as a difference.
//
// usage: npm run check:notes            (builds, serves on :5193, checks every song in public/scores)
//        node tests/notes-match.mjs --corrupt   (changes one note in the served file: the check must fail)

import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const PORT = 5193;
const BASE = `http://localhost:${PORT}/PianoProject/`;
const corrupt = process.argv.includes('--corrupt');
const pieces = JSON.parse(readFileSync(new URL('../public/scores/index.json', import.meta.url), 'utf8'));

// Nothing may answer on the port before this run's server starts: whatever answered would be checked instead.
try {
  await fetch(BASE);
  console.error(`FAIL port ${PORT} is already serving (an earlier run's preview?): stop it and run again.`);
  process.exit(1);
} catch { /* free */ }
// Its own process group, stopped as a group: `server.kill()` stopped only the shell, and the preview went on serving
// :5193, so the next run's --strictPort failed unseen and it checked the old build (test review, 2026-10-14).
const server = spawn(`npx vite preview --port ${PORT} --strictPort`, { shell: true, stdio: 'ignore', detached: process.platform !== 'win32' });
let exited = false;
server.on('exit', () => { exited = true; });
const stop = () => {
  if (process.platform === 'win32') spawn('taskkill', ['/pid', String(server.pid), '/T', '/F']);
  else try { process.kill(-server.pid, 'SIGTERM'); } catch { /* already gone */ }
};

let failed = 0;
try {
  let up = false;
  for (let i = 0; i < 75 && !up && !exited; i++) { try { await fetch(BASE); up = true; } catch { await new Promise((r) => setTimeout(r, 200)); } }
  if (!up || exited) throw new Error(exited ? `the preview server stopped before answering: is port ${PORT} taken (an earlier run's server)?` : 'the preview server did not answer within 15 s');
  // PIANO_CHROMIUM: a Chromium to use when Playwright's own build is not installed (a cloud session's /opt/pw-browsers/chromium).
  const browser = await chromium.launch(process.env.PIANO_CHROMIUM ? { executablePath: process.env.PIANO_CHROMIUM } : {});
  const context = await browser.newContext({ viewport: { width: 390, height: 760 } });
  if (corrupt) {
    // The fooling case: the first pitched note's step moves up one letter in the copy the app gets.
    await context.route('**/scores/*.musicxml', async (route) => {
      const response = await route.fetch();
      const xml = (await response.text()).replace(/<step>([A-G])<\/step>/, (_, s) => `<step>${'CDEFGAB'[('CDEFGAB'.indexOf(s) + 1) % 7]}</step>`);
      await route.fulfill({ response, body: xml });
    });
  }
  const page = await context.newPage();
  for (const piece of pieces) {
    await page.goto(`${BASE}?piece=${piece.id}`);
    await page.waitForFunction(() => window.__pianoDebug?.state().steps > 0, null, { timeout: 30000 });
    const drawn = await page.evaluate(() => window.__pianoDebug.drawnNotes());
    // The original file from disk (not through the page, so --corrupt changes only the app's copy), read with
    // DOMParser: pitched notes (chords, grace notes and tied notes included).
    const original = readFileSync(new URL(`../public/scores/${piece.file}`, import.meta.url), 'utf8');
    const fromFile = await page.evaluate((xml) => {
      const doc = new DOMParser().parseFromString(xml, 'application/xml');
      const bars = [];
      for (const part of doc.querySelectorAll('part')) {
        [...part.querySelectorAll(':scope > measure')].forEach((measure, i) => {
          for (const note of measure.querySelectorAll('note')) {
            const pitch = note.querySelector('pitch');
            if (!pitch || note.querySelector('cue')) continue;
            const alter = Number(pitch.querySelector('alter')?.textContent ?? 0);
            const acc = alter > 0 ? '#'.repeat(alter) : 'b'.repeat(-alter);
            (bars[i] ??= []).push(`${pitch.querySelector('step').textContent}${acc}${pitch.querySelector('octave').textContent}`);
          }
        });
      }
      return bars.map((b) => (b ?? []).sort());
    }, original);
    const bars = Math.max(drawn.length, fromFile.length);
    const diffs = [];
    for (let b = 0; b < bars; b++) {
      const a = (drawn[b] ?? []).join(' '), f = (fromFile[b] ?? []).join(' ');
      if (a !== f) diffs.push(`  bar index ${b}: app [${a}] file [${f}]`);
    }
    const notes = fromFile.flat().length;
    if (diffs.length) { failed++; console.log(`FAIL ${piece.id}: ${diffs.length} of ${bars} bars differ`); console.log(diffs.slice(0, 5).join('\n')); }
    else console.log(`ok   ${piece.id}: ${notes} notes in ${bars} bars match`);
  }
  await browser.close();
} finally {
  stop();
}
if (corrupt) {
  console.log(failed ? `corrupt run: the check caught the changed note in ${failed} songs, as it should` : 'corrupt run: NOT caught - the check is broken');
  process.exit(failed ? 0 : 1);
}
process.exit(failed ? 1 : 0);
