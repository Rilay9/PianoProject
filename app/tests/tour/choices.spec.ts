/**
 * The choices — the same screen shot several ways, so the owner can pick.
 *
 * The tour answers "what does it look like". This answers "which of these do
 * you want", which is the question that actually needs him: the tour turned up
 * three or four decisions that are matters of taste about *his* reading, and
 * guessing at them from here wastes his time twice — once when I guess wrong
 * and once when he has to say so.
 *
 * Each block below is one question with its options photographed side by side.
 * `build/tour/choices.html` shows them as A / B / C with a radio button and a
 * box, and prints the answers as text to send back.
 *
 *   npm run choices
 */
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { LANDSCAPE, PORTRAIT, TOUR_DIR, type Orientation } from './shoot';

const SONG = 'song.folk.suo-gan-welsh-traditional-lullaby.pdmx';

interface Option {
  label: string;
  note: string;
  file: string;
}
interface Question {
  id: string;
  ask: string;
  why: string;
  orientation: Orientation;
  options: Option[];
}

const questions: Question[] = [];

async function openScore(page: Page): Promise<void> {
  await page.goto(`/#/score/${SONG}`);
  await expect(page.locator('[data-screen="score"]')).toBeVisible({ timeout: 60_000 });
  await page.waitForFunction(
    () => {
      const svg = document.querySelector('#score-stage .is-front svg');
      return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
    },
    undefined,
    { timeout: 90_000 },
  );
}

/** Sets the window to `bars` through the buttons, as a person would. */
async function setBars(page: Page, bars: number): Promise<void> {
  for (let i = 0; i < 8; i += 1) await page.locator('#score-bars-down').click();
  for (let i = 1; i < bars; i += 1) await page.locator('#score-bars-up').click();
  await expect(page.locator('#score-bars')).toHaveText(`${String(bars)} bar${bars === 1 ? '' : 's'}`);
  await page.waitForTimeout(900);
}

async function shootOption(
  page: Page,
  question: Question,
  label: string,
  note: string,
): Promise<void> {
  const slug = `${question.id}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const file = join(TOUR_DIR, 'choices', `${slug}.png`);
  mkdirSync(dirname(file), { recursive: true });
  await page.screenshot({ path: file, animations: 'disabled' });
  question.options.push({ label, note, file: `choices/${slug}.png` });
}

test.describe('choices', () => {
  test.use({ viewport: LANDSCAPE });

  test('how much music in the window, landscape', async ({ page }) => {
    const question: Question = {
      id: 'bars-landscape',
      ask: 'Held sideways, how much music do you want on the screen at once?',
      why:
        'Landscape is short, so the app shrinks the sheet to fit whatever it is asked to draw. ' +
        'More bars means smaller notes and, oddly, *less* of the width used — the sheet is scaled ' +
        'down as a whole. Fewer bars means bigger notes and less to read ahead into.',
      orientation: 'landscape',
      options: [],
    };
    await openScore(page);
    for (const bars of [1, 2, 4]) {
      await setBars(page, bars);
      await shootOption(
        page,
        question,
        `${String(bars)} bar${bars === 1 ? '' : 's'}`,
        bars === 2 ? 'What it does today.' : '',
      );
    }
    questions.push(question);
  });
});

test.describe('choices, portrait', () => {
  test.use({ viewport: PORTRAIT });

  test('how much music in the window, portrait', async ({ page }) => {
    const question: Question = {
      id: 'bars-portrait',
      ask: 'Held upright, how much music do you want on the screen at once?',
      why:
        'Portrait has height to spare, so more bars costs less here than it does sideways. ' +
        'Two is what it does today.',
      orientation: 'portrait',
      options: [],
    };
    await openScore(page);
    for (const bars of [1, 2, 4]) {
      await setBars(page, bars);
      await shootOption(
        page,
        question,
        `${String(bars)} bar${bars === 1 ? '' : 's'}`,
        bars === 2 ? 'What it does today.' : '',
      );
    }
    questions.push(question);
  });

  test('the keyboard strip', async ({ page }) => {
    const question: Question = {
      id: 'strip',
      ask: 'Do you want the on-screen keys under the music while you play?',
      why:
        'With the piano plugged in they are only a picture of what you played — the strip lights ' +
        'up but you are not touching it. They cost about a fifth of the height. Off, the sheet ' +
        'gets that back.',
      orientation: 'portrait',
      options: [],
    };
    await openScore(page);
    await shootOption(page, question, 'Keys showing', 'What it does today.');
    await page.locator('#score-strip-toggle').click();
    await page.waitForTimeout(900);
    await shootOption(page, question, 'Keys hidden', '');
    questions.push(question);
  });

  test('note names', async ({ page }) => {
    const question: Question = {
      id: 'note-names',
      ask: 'Should the app name the note it is waiting for?',
      why:
        'Off by default today; the setting is in Settings → Display. It appears under the title ' +
        'in Wait mode only. This is the thing that would have saved you forty seconds hunting ' +
        'for that F♯.',
      orientation: 'portrait',
      options: [],
    };
    await openScore(page);
    await page.locator('#score-mode').selectOption('wait');
    await page.locator('#score-input').selectOption('keys');
    await page.locator('#score-play').click();
    await page.waitForTimeout(600);
    await shootOption(page, question, 'No name', 'What it does today.');

    await page.goto('/#/settings');
    await page.locator('#set-notenames').click();
    await openScore(page);
    await page.locator('#score-mode').selectOption('wait');
    await page.locator('#score-input').selectOption('keys');
    await page.locator('#score-play').click();
    await page.waitForTimeout(600);
    await shootOption(page, question, 'Named', '');
    questions.push(question);
  });
});

test.afterAll(() => {
  if (questions.length === 0) return;
  const blocks = questions
    .map(
      (q, index) => `<section>
  <h2><span class="n">${String(index + 1)}</span> ${q.ask}</h2>
  <p class="why">${q.why}</p>
  <div class="row">
    ${q.options
      .map(
        (o, i) => `<label class="opt">
      <input type="radio" name="${q.id}" value="${o.label}"${i === 0 ? '' : ''}>
      <span class="cap">${String.fromCharCode(65 + i)} · ${o.label}${o.note ? ` <em>${o.note}</em>` : ''}</span>
      <img src="${o.file}" alt="${o.label}">
    </label>`,
      )
      .join('\n')}
  </div>
  <textarea data-q="${q.id}" placeholder="anything else about this one"></textarea>
</section>`,
    )
    .join('\n');

  const html = `<!doctype html>
<meta charset="utf-8">
<title>PianoPath — pick one</title>
<style>
  :root { color-scheme: dark; }
  body { background:#0f1115; color:#e8eaed; font:15px/1.5 system-ui, sans-serif; margin:0 auto; padding:2rem; max-width:1200px; }
  section { border-top:1px solid #2a2f3a; padding:1.5rem 0; }
  h2 { font-size:1.05rem; display:flex; gap:.5rem; align-items:center; }
  .n { background:#2a2f3a; border-radius:999px; padding:.1rem .55rem; font-size:.85rem; }
  .why { color:#9aa0a6; margin:.2rem 0 1rem; max-width:70ch; }
  .row { display:flex; gap:1.25rem; flex-wrap:wrap; }
  .opt { display:block; cursor:pointer; }
  .opt img { display:block; max-height:460px; border:2px solid transparent; border-radius:8px; margin-top:.4rem; }
  .opt input:checked ~ img { border-color:#8ab4f8; }
  .cap { font-size:.9rem; }
  em { color:#9aa0a6; font-style:normal; }
  textarea { width:100%; min-height:3rem; margin-top:1rem; background:#171a21; color:#e8eaed;
             border:1px solid #2a2f3a; border-radius:8px; padding:.6rem; font:inherit; }
  #out { min-height:10rem; }
  button { background:#8ab4f8; color:#0f1115; border:0; border-radius:8px; padding:.6rem 1rem; font:inherit; font-weight:600; cursor:pointer; }
</style>
<h1>Pick one of each</h1>
<p class="why">Galaxy S25. Click the picture you want, add a note if you like, then press
<b>Collect</b> and send me the text.</p>
${blocks}
<section>
  <h2>Your answers</h2>
  <button onclick="collect()">Collect</button>
  <textarea id="out"></textarea>
</section>
<script>
function collect() {
  const out = [];
  for (const s of document.querySelectorAll('section')) {
    const radio = s.querySelector('input:checked');
    const note = s.querySelector('textarea[data-q]');
    if (!radio && !(note && note.value.trim())) continue;
    const q = (radio && radio.name) || (note && note.dataset.q);
    out.push('## ' + q + '\\n' + (radio ? 'choice: ' + radio.value : '(no choice)') +
      (note && note.value.trim() ? '\\nnote: ' + note.value.trim() : ''));
  }
  document.getElementById('out').value = out.join('\\n\\n') || '(nothing picked yet)';
}
</script>
`;
  mkdirSync(TOUR_DIR, { recursive: true });
  writeFileSync(join(TOUR_DIR, 'choices.html'), html, 'utf8');
});
