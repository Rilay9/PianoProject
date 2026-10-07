/**
 * G101's look, not a test: the four *Twinkle* rows at 342 × 740 at 100 % and 115 % text, pictured and
 * measured (what each title shows, line by line), and every Library row drawn and measured (how many
 * lines each title needs, and how many are cut). Each on the app's font stack and on the wider face
 * `plan.spec.ts` uses for the runner's (Verdana, U90), which is a stand-in for the runner's font, not
 * the runner's font. `G101_PHASE` names the build (before, after, mutant). Not for the commit: moved to
 * docs/prompts/runs/G101/ after the runs.
 */
import { expect, test } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'docs', 'prompts', 'pictures', 'g101');
const PHASE = process.env.G101_PHASE ?? 'unnamed';
/** The titles that differ from another only by their ending (`build/g101/siblings.py`). */
const SIBLINGS = (JSON.parse(
  readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'build', 'g101', 'siblings.json'), 'utf8'),
) as { ids: string[] }).ids;
const FACES = [
  { name: 'stack', css: null },
  { name: 'wide', css: "body, body * { font-family: Verdana, 'DejaVu Sans', sans-serif !important; }" },
] as const;

test.use({ viewport: { width: 342, height: 740 } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
    }
  });
});

for (const face of FACES) {
  for (const size of [100, 115]) {
    test(`the Twinkle rows and every row at ${String(size)} % text, ${face.name}`, async ({ page }) => {
      test.setTimeout(240_000);
      if (size !== 100) {
        await page.addInitScript((percent) => {
          document.addEventListener('DOMContentLoaded', () => {
            document.documentElement.style.fontSize = `${String(percent)}%`;
          });
        }, size);
      }
      mkdirSync(OUT, { recursive: true });
      await page.goto('/#/library');
      await expect(page.locator('#library-count')).toContainText(/of \d+ items/);
      if (face.css !== null) await page.addStyleTag({ content: face.css });
      await page.evaluate(() => document.fonts.ready);
      await page.locator('#library-search').fill('twinkle');
      await expect(page.locator('#library-list .list-row')).toHaveCount(4);

      const twinkle = await page.evaluate(() => {
        return [...document.querySelectorAll<HTMLElement>('#library-list .list-row')].map((row) => {
          const title = row.querySelector<HTMLElement>('.list-row__title');
          if (title === null) throw new Error('no title');
          const text = title.firstChild;
          const box = title.getBoundingClientRect();
          const bottom = box.top + title.clientHeight + 0.5;
          // Each word's box: the line it sits on, and whether that line is inside the title's box.
          const words: { word: string; top: number; shown: boolean }[] = [];
          if (text !== null && text.nodeType === Node.TEXT_NODE) {
            const value = text.textContent ?? '';
            const re = /\S+/g;
            let m: RegExpExecArray | null;
            while ((m = re.exec(value)) !== null) {
              const range = document.createRange();
              range.setStart(text, m.index);
              range.setEnd(text, m.index + m[0].length);
              const rect = range.getBoundingClientRect();
              words.push({ word: m[0], top: Math.round(rect.top - box.top), shown: rect.bottom <= bottom });
            }
          }
          const lines: string[] = [];
          let last = Number.NaN;
          for (const w of words) {
            if (w.top !== last) lines.push('');
            last = w.top;
            const now = lines[lines.length - 1] ?? '';
            lines[lines.length - 1] = `${now}${now ? ' ' : ''}${w.word}${w.shown ? '' : ' [hidden]'}`;
          }
          const style = getComputedStyle(title);
          const line = Number.parseFloat(style.lineHeight);
          const rect = row.getBoundingClientRect();
          return {
            id: row.dataset.item ?? '',
            lines,
            linesNeeded: Math.round(title.scrollHeight / line),
            linesShown: Math.round(title.clientHeight / line),
            clamp: style.getPropertyValue('-webkit-line-clamp'),
            clipped: title.scrollWidth > title.clientWidth || title.scrollHeight > title.clientHeight,
            client: `${String(title.clientWidth)}x${String(title.clientHeight)}`,
            scroll: `${String(title.scrollWidth)}x${String(title.scrollHeight)}`,
            row: `${rect.width.toFixed(1)}x${rect.height.toFixed(1)}`,
            titleColumn: row.querySelector('.list-row__text')?.getBoundingClientRect().width.toFixed(1),
            actions: row.querySelector('.list-row__actions')?.getBoundingClientRect().width.toFixed(1),
            rootFont: getComputedStyle(document.documentElement).fontSize,
          };
        });
      });
      const name = `${PHASE}-twinkle-${String(size)}-${face.name}-342x740`;
      await page.locator('#library-list').screenshot({ path: path.join(OUT, `${name}.png`), animations: 'disabled' });

      // The sibling groups with the longest endings, and the longest title, as a learner finds them.
      for (const [slug, query] of [
        ['k545', 'K. 545, I. Allegro'],
        ['study-2-4', 'Study in C major in 2/4'],
        ['longest', 'This Country of Mine'],
      ] as const) {
        await page.locator('#library-search').fill(query);
        await expect(page.locator('#library-list .list-row').first()).toBeVisible();
        await page.locator('#library-list').screenshot({ path: path.join(OUT, `${PHASE}-${slug}-${String(size)}-${face.name}-342x740.png`), animations: 'disabled' });
      }

      // Every row: the search cleared, every page drawn, then measured.
      await page.locator('#library-search').fill('');
      await expect(page.locator('#library-count')).toContainText(/of \d+ items/);
      const all = await page.evaluate((siblingIds) => {
        const siblingSet = new Set(siblingIds);
        for (let guard = 0; guard < 200; guard += 1) {
          const more = document.getElementById('library-more');
          if (more === null) break;
          more.click();
        }
        const rows = [...document.querySelectorAll<HTMLElement>('#library-list .list-row')];
        const byLines: Record<string, number> = {};
        const titleWidths: Record<string, number> = {};
        let cut = 0;
        const beyondThree: string[] = [];
        const sideways: string[] = [];
        const siblingLines: Record<string, number> = {};
        const siblingsBeyondThree: { lines: number; title: string }[] = [];
        const everyTitle: { lines: number; title: string; height: number }[] = [];
        for (const row of rows) {
          const title = row.querySelector<HTMLElement>('.list-row__title');
          if (title === null) continue;
          const line = Number.parseFloat(getComputedStyle(title).lineHeight);
          const lines = Math.round(title.scrollHeight / line);
          byLines[String(lines)] = (byLines[String(lines)] ?? 0) + 1;
          titleWidths[String(title.clientWidth)] = (titleWidths[String(title.clientWidth)] ?? 0) + 1;
          if (title.scrollWidth > title.clientWidth || title.scrollHeight > title.clientHeight) cut += 1;
          if (lines > 3) beyondThree.push(`${String(lines)} lines at ${String(title.clientWidth)} px: ${title.textContent ?? ''}`);
          if (title.scrollWidth > title.clientWidth) sideways.push(`${String(title.scrollWidth)} px of words in ${String(title.clientWidth)}: ${title.textContent ?? ''}`);
          everyTitle.push({ lines, title: title.textContent ?? '', height: Math.round(row.getBoundingClientRect().height) });
          if (siblingSet.has(row.dataset.item ?? '')) {
            siblingLines[String(lines)] = (siblingLines[String(lines)] ?? 0) + 1;
            if (lines > 3) siblingsBeyondThree.push({ lines, title: title.textContent ?? '' });
          }
        }
        siblingsBeyondThree.sort((a, b) => b.lines - a.lines || a.title.localeCompare(b.title));
        const longest = [...everyTitle].sort((a, b) => b.title.length - a.title.length).slice(0, 12);
        const tallest = [...everyTitle].sort((a, b) => b.height - a.height).slice(0, 5);
        return {
          count: document.getElementById('library-count')?.textContent ?? '',
          rows: rows.length,
          byLines,
          titleWidths,
          cut,
          beyondThree,
          sideways,
          siblings: { count: siblingIds.length, drawn: Object.values(siblingLines).reduce((a, b) => a + b, 0), byLines: siblingLines, beyondThree: siblingsBeyondThree.map((one) => `${String(one.lines)}: ${one.title}`) },
          longest: longest.map((one) => `${String(one.lines)} lines, row ${String(one.height)} px: ${one.title}`),
          tallest: tallest.map((one) => `row ${String(one.height)} px, ${String(one.lines)} lines: ${one.title}`),
        };
      }, SIBLINGS);
      writeFileSync(
        path.join(OUT, `${PHASE}-facts-${String(size)}-${face.name}.json`),
        `${JSON.stringify({ phase: PHASE, size, face: face.name, viewport: '342x740', twinkle, all }, null, 2)}\n`,
      );
    });
  }
}
