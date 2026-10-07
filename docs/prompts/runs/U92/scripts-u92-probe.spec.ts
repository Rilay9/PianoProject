/**
 * U92's probe, not a test of the suite: the Skills list at 342 × 740, on the app's own font stack and
 * under U90's forced wide face (Verdana, or DejaVu Sans), read row by row. For every concept row and
 * every drill row the list draws over every stage (Show all pressed to the end), the detail line's
 * text, whether anything of it is cut (`scrollWidth` beyond `clientWidth`, or `scrollHeight` beyond
 * `clientHeight`), what a learner reads of it (each character most of which is in view, " / " where a
 * line breaks, the ellipsis where the line draws one), whether its first token (the count, on a
 * concept row) is wholly inside the line's visible box and clear of the ellipsis, how many lines it
 * takes, and the row's height. The pictures are "Shifting position" at Stage 2 and "Primary chords
 * with the dominant seventh" over every stage, each in the middle of the screen: the rows U90
 * pictured.
 *
 * It writes only under `build/u92-probe/<label>/` (ignored); the pictures are copied to
 * `docs/prompts/pictures/u92/` by hand. Run with `U92_LABEL=<state>` through
 * `playwright.u92-4423.config.ts`, and moved to `docs/prompts/runs/U92/` afterwards.
 */
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..', '..');
const LABEL = process.env.U92_LABEL ?? 'unlabelled';
const OUT = path.join(ROOT, 'build', 'u92-probe', LABEL);
const W = 342;
const H = 740;
/** The wide face exactly as `plan.spec.ts`'s F2b describe forces it. */
const WIDE = "body, body * { font-family: Verdana, 'DejaVu Sans', sans-serif !important; }";

const FACES = [
  { name: 'stack', css: null },
  { name: 'wide', css: WIDE },
] as const;

test.use({ viewport: { width: W, height: H } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-fresh') === null) {
      sessionStorage.setItem('e2e-fresh', '1');
      indexedDB.deleteDatabase('pianopath');
      localStorage.setItem('pianopath.firstSight', '["*"]');
    }
  });
});

interface Reading {
  kind: 'concept' | 'drill';
  id: string;
  meta: string;
  reads: string;
  cut: boolean;
  cutAcross: boolean;
  cutDown: boolean;
  scrollWidth: number;
  clientWidth: number;
  ellipsis: boolean;
  firstToken: string;
  firstTokenWhole: boolean;
  metaLines: number;
  titleLines: number;
  rowHeight: number;
}

async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

async function readRows(page: Page): Promise<Reading[]> {
  return page.evaluate(() => {
    const out: Reading[] = [];
    for (const row of document.querySelectorAll('#skills-list .list-row')) {
      const concept = row.getAttribute('data-concept');
      const drill = row.getAttribute('data-skill-item');
      if (concept === null && drill === null) continue;
      const line = row.querySelector('.list-row__metatext');
      const meta = row.querySelector('.list-row__meta');
      const title = row.querySelector('.list-row__title');
      if (!(line instanceof HTMLElement) || !(meta instanceof HTMLElement) || !(title instanceof HTMLElement)) continue;
      const text = line.firstChild;
      const data = line.textContent ?? '';
      const style = getComputedStyle(line);
      const ellipsis = style.textOverflow === 'ellipsis';
      // Where the line draws an ellipsis, it covers the end of the room.
      const mark = document.createElement('span');
      mark.textContent = '…';
      line.append(mark);
      const markWidth = mark.getBoundingClientRect().width;
      mark.remove();
      // The characters where they are laid out, not where the ellipsis collapses the ones it hides:
      // read with the ellipsis off, then put it back.
      line.style.textOverflow = 'clip';
      // The visible box, in fractions of a pixel: the line's own (it has no border or padding), inside
      // the meta line, which clips as well. `scrollWidth` rounds, and a line over its box by less than
      // half a pixel still draws the ellipsis.
      const lb = line.getBoundingClientRect();
      const mb = meta.getBoundingClientRect();
      const clip = {
        left: Math.max(lb.left, mb.left),
        right: Math.min(lb.right, mb.right),
        top: Math.max(lb.top, mb.top),
        bottom: Math.min(lb.bottom, mb.bottom),
      };
      const all = document.createRange();
      all.selectNodeContents(line);
      const allRects = [...all.getClientRects()].filter((r) => r.width > 0);
      const cutAcross = line.scrollWidth > line.clientWidth || allRects.some((r) => r.right > clip.right + 0.02);
      const cutDown = line.scrollHeight > line.clientHeight + 1 || allRects.some((r) => r.bottom > clip.bottom + 0.5);
      const cut = cutAcross || cutDown;
      const room = clip.right - (cutAcross && ellipsis ? markWidth : 0);
      const end = data.indexOf(' · ') < 0 ? data.length : data.indexOf(' · ');
      let whole = false;
      let reads = data;
      if (text instanceof Text) {
        const range = document.createRange();
        range.setStart(text, 0);
        range.setEnd(text, end);
        const rects = [...range.getClientRects()].filter((r) => r.width > 0);
        whole =
          rects.length > 0 &&
          rects.every((r) => r.left >= clip.left - 0.5 && r.right <= room + 0.5 && r.top >= clip.top - 0.5 && r.bottom <= clip.bottom + 0.5);
        // What a learner reads: each character most of which is in view, a new line marked " / ".
        let shown = '';
        let lastTop: number | null = null;
        for (let i = 0; i < text.length; i += 1) {
          range.setStart(text, i);
          range.setEnd(text, i + 1);
          const r = [...range.getClientRects()].find((x) => x.width > 0);
          if (!r) continue;
          const midX = (r.left + r.right) / 2;
          const midY = (r.top + r.bottom) / 2;
          if (midX > room || midX < clip.left || midY > clip.bottom || midY < clip.top) continue;
          if (lastTop !== null && r.top - lastTop > r.height / 2) shown = `${shown.trimEnd()} / `;
          lastTop = r.top;
          shown += data[i] ?? '';
        }
        reads = `${shown.trimEnd()}${cutAcross && ellipsis ? '…' : ''}`;
      }
      line.style.textOverflow = '';
      const lh = parseFloat(style.lineHeight) || 1;
      const tlh = parseFloat(getComputedStyle(title).lineHeight) || 1;
      out.push({
        kind: concept !== null ? 'concept' : 'drill',
        id: concept ?? drill ?? '',
        meta: data,
        reads,
        cut,
        cutAcross,
        cutDown,
        scrollWidth: line.scrollWidth,
        clientWidth: line.clientWidth,
        ellipsis,
        firstToken: data.slice(0, end),
        firstTokenWhole: whole,
        metaLines: Math.round(lb.height / lh),
        titleLines: Math.round(title.getBoundingClientRect().height / tlh),
        rowHeight: Math.round(row.getBoundingClientRect().height),
      });
    }
    return out;
  });
}

for (const face of FACES) {
  test(`Skills details at ${String(W)} × ${String(H)}, ${face.name}`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/#/plan/skills');
    await expect(page.locator('#skills-list .list-row').first()).toBeVisible();
    if (face.css !== null) await page.addStyleTag({ content: face.css });
    mkdirSync(OUT, { recursive: true });

    await page.locator('#skills-stage').selectOption('2');
    const shifting = page.locator('#skills-list .list-row[data-concept="position-shift"]');
    await expect(shifting).toBeVisible();
    await shifting.evaluate((node) => node.scrollIntoView({ block: 'center' }));
    await settle(page);
    const stage2 = await readRows(page);
    await page.screenshot({ path: path.join(OUT, `${LABEL}-${face.name}-shifting-${String(W)}x${String(H)}.png`) });

    await page.locator('#skills-stage').selectOption('all');
    const showAll = page.locator('#skills-show-all');
    for (let i = 0; i < 12 && (await showAll.count()) > 0; i += 1) await showAll.click();
    await expect(showAll).toHaveCount(0);
    const longest = page.locator('#skills-list .list-row[data-concept="I-IV-V7"]');
    await longest.evaluate((node) => node.scrollIntoView({ block: 'center' }));
    await settle(page);
    const every = await readRows(page);
    await page.screenshot({ path: path.join(OUT, `${LABEL}-${face.name}-longest-${String(W)}x${String(H)}.png`) });

    const concepts = every.filter((r) => r.kind === 'concept');
    const drills = every.filter((r) => r.kind === 'drill');
    writeFileSync(
      path.join(OUT, `probe-${LABEL}-${face.name}.json`),
      JSON.stringify(
        {
          label: LABEL,
          face: face.name,
          viewport: `${String(W)}x${String(H)}`,
          stage2: stage2.filter((r) => r.kind === 'concept').map((r) => `${r.id}: reads "${r.reads}"${r.cut ? ' (cut)' : ''}`),
          everyStage: {
            concepts: concepts.length,
            drills: drills.length,
            conceptsCut: concepts.filter((r) => r.cut).length,
            conceptsCutAcross: concepts.filter((r) => r.cutAcross).length,
            conceptsCutDown: concepts.filter((r) => r.cutDown).length,
            conceptsCutWithoutMark: concepts.filter((r) => r.cut && !r.ellipsis).length,
            conceptsFirstTokenNotWhole: concepts.filter((r) => !r.firstTokenWhole).map((r) => `${r.id}: "${r.meta}" reads "${r.reads}"`),
            drillsCut: drills.filter((r) => r.cut).length,
            drillsFirstTokenNotWhole: [...new Set(drills.filter((r) => !r.firstTokenWhole).map((r) => `${r.id}: "${r.meta}" reads "${r.reads}"`))],
            conceptsMetaOverOneLine: concepts.filter((r) => r.metaLines > 1).length,
            conceptsMetaLines: [...new Set(concepts.map((r) => r.metaLines))].sort(),
            conceptsLineWithoutAllThreeFacts: concepts.filter((r) => r.meta.split(' · ').length < 3).map((r) => `${r.id}: "${r.meta}"`),
            tallestConceptRow: Math.max(...concepts.map((r) => r.rowHeight)),
            conceptRowHeights: concepts.reduce((sum, r) => sum + r.rowHeight, 0),
          },
          rows: every,
        },
        null,
        2,
      ),
    );
  });
}
