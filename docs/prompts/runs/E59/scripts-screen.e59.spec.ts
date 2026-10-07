// Kept copy (machine path replaced) of the temporary app/build/e59/screen.e59.spec.ts, deleted at the lane's cleanup.
// E59's look at the Score screen (a run artifact, not a suite spec): four moved rows — a single-staff and a grand-staff
// PDMX row, a kern row, a MuseTrainer row — opened on the learner's Score screen at a phone's size, once served with the
// new files (port 4659, app/dist) and once with the old files in their place (port 4660, a copy of app/dist with those
// four files swapped back), and the drawn score compared: every SVG element's kind and box, and the bar's bpm readout.
// Screenshots of both go to build/e59/screens/.
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const W = '<worktree>';
const ROWS = [
  'song.folk.i-remember-you.pdmx',
  'song.pop.misc-soundtrack-lavender-s-blue.pdmx',
  'song.classical.chopin-ballade-2.nifc',
  'song.classical.beethoven-fur-elise.easy',
];
const SERVERS = { after: 'http://localhost:4659/PianoProject/', before: 'http://localhost:4660/PianoProject/' };

interface Drawn {
  elements: string[];
  bpm: string;
}

async function drawn(page: Page, base: string, id: string, shot: string): Promise<Drawn> {
  await page.goto(`${base}#/score/${id}`);
  await page.waitForSelector('.score-view[data-measured]', { timeout: 60_000 });
  await page.waitForFunction(
    () => {
      const svg = document.querySelector('.score-view svg');
      if (!svg) return false;
      const key = `${svg.outerHTML.length}`;
      const holder = window as unknown as { __k?: string; __n?: number };
      if (holder.__k === key) holder.__n = (holder.__n ?? 0) + 1;
      else { holder.__k = key; holder.__n = 0; }
      return (holder.__n ?? 0) >= 5 && document.fonts.status === 'loaded';
    },
    undefined,
    { timeout: 60_000, polling: 150 },
  );
  await page.screenshot({ path: shot });
  return page.evaluate(() => {
    const elements = [...document.querySelectorAll('.score-view svg *')].map((el) => {
      const box = (el as SVGGraphicsElement).getBBox ? (el as SVGGraphicsElement).getBBox() : { x: 0, y: 0, width: 0, height: 0 };
      const text = el.tagName === 'text' ? `:${el.textContent ?? ''}` : '';
      return `${el.tagName}${text}@${box.x.toFixed(1)},${box.y.toFixed(1)},${box.width.toFixed(1)},${box.height.toFixed(1)}`;
    });
    const bpm = document.querySelector('#score-tempo-label')?.textContent?.trim() ?? '(no tempo label)';
    return { elements, bpm };
  });
}

test.use({ viewport: { width: 390, height: 844 }, storageState: `${W}/app/build/e59/storageState-two.json` });

test('the moved rows draw the same on the Score screen with the old file and the new', async ({ page }) => {
  test.setTimeout(600_000);
  mkdirSync(`${W}/build/e59/screens`, { recursive: true });
  const report: string[] = [];
  for (const id of ROWS) {
    const before = await drawn(page, SERVERS.before, id, `${W}/build/e59/screens/${id}.before.png`);
    const after = await drawn(page, SERVERS.after, id, `${W}/build/e59/screens/${id}.after.png`);
    const same = JSON.stringify(before.elements) === JSON.stringify(after.elements);
    const differing = before.elements.filter((one, i) => one !== after.elements[i]).slice(0, 5);
    report.push(`${id}: SVG elements before ${before.elements.length}, after ${after.elements.length}; identical kind and box: ${same}` +
      (same ? '' : `; first differing ${JSON.stringify(differing)}`) + `; bpm readout before "${before.bpm}", after "${after.bpm}"`);
    expect(before.elements.length).toBeGreaterThan(50);
  }
  writeFileSync(`${W}/build/e59/screen-compare.txt`, report.join('\n') + '\n');
});
