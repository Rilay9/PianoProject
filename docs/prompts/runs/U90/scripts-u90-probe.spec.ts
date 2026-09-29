/**
 * U90's probe, not a test of the suite: the Skills list at 342 × 740, on the app's own font stack and
 * under a forced wide face (Verdana), read row by row; and, as the invariants' other two shapes, on the
 * stack at 115 % text and sideways at 740 × 342. For every concept row and every drill row the
 * list draws (Stage 2, then every stage with Show all pressed to the end): the title's text, whether its
 * scrollWidth exceeds its clientWidth (cut), how many lines it takes, and the boxes of the row, the
 * title, the meta line and the actions, so a wrapped title can be checked to read as one entry. The face
 * each title is actually drawn in is read from the browser (CDP `CSS.getPlatformFontsForNode`). The
 * pictures are the Skills list at Stage 2 with the beginner's leap in the middle of the screen. Run once
 * with the U90 override on port 4383 per state (`U90_LABEL=committed`, then `U90_LABEL=fixed`) and moved
 * to docs/prompts/runs/U90/ afterwards.
 */
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..', '..');
const PICTURES = path.join(ROOT, 'docs', 'prompts', 'pictures', 'u90');
const RUNS = path.join(ROOT, 'docs', 'prompts', 'runs', 'U90');
const LABEL = process.env.U90_LABEL ?? 'unlabelled';
const W = 342;
const H = 740;
/** The wide face, as `plan.spec.ts` forces it: every element, buttons included, since a system font reaches the controls as well. */
const WIDE = "body, body * { font-family: Verdana, 'DejaVu Sans', sans-serif !important; }";

interface Condition {
  name: string;
  width: number;
  height: number;
  css: string | null;
  rootFontSize: string | null;
}

const CONDITIONS: Condition[] = [
  { name: 'stack', width: W, height: H, css: null, rootFontSize: null },
  { name: 'wide', width: W, height: H, css: WIDE, rootFontSize: null },
  { name: 'stack-115', width: W, height: H, css: null, rootFontSize: '115%' },
  { name: 'stack-sideways', width: H, height: W, css: null, rootFontSize: null },
];

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

interface Box {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface RowReading {
  kind: 'concept' | 'drill';
  id: string;
  title: string;
  shows: string;
  cut: boolean;
  scrollWidth: number;
  clientWidth: number;
  lines: number;
  row: Box;
  titleBox: Box;
  meta: Box | null;
  actions: Box | null;
}

async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

async function readRows(page: Page): Promise<RowReading[]> {
  return page.evaluate(() => {
    const box = (el: Element | null): Box | null => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right) };
    };
    const out: RowReading[] = [];
    for (const row of document.querySelectorAll('#skills-list .list-row')) {
      const title = row.querySelector('.list-row__title');
      if (!(title instanceof HTMLElement)) continue;
      const concept = row.getAttribute('data-concept');
      const drill = row.getAttribute('data-skill-item');
      if (concept === null && drill === null) continue;
      const lh = parseFloat(getComputedStyle(title).lineHeight) || 1;
      // What a learner reads of a cut title: the longest prefix that fits beside the ellipsis.
      let shows = title.textContent ?? '';
      const text = title.firstChild;
      if (title.scrollWidth > title.clientWidth && text instanceof Text) {
        const probe = document.createElement('span');
        probe.textContent = '…';
        title.append(probe);
        const room = title.getBoundingClientRect().left + title.clientWidth - probe.getBoundingClientRect().width;
        probe.remove();
        const range = document.createRange();
        let k = 0;
        for (let i = 1; i <= text.length; i += 1) {
          range.setStart(text, 0);
          range.setEnd(text, i);
          if (range.getBoundingClientRect().right > room) break;
          k = i;
        }
        shows = `${text.data.slice(0, k)}…`;
      }
      out.push({
        shows,
        kind: concept !== null ? 'concept' : 'drill',
        id: concept ?? drill ?? '',
        title: title.textContent ?? '',
        cut: title.scrollWidth > title.clientWidth,
        scrollWidth: title.scrollWidth,
        clientWidth: title.clientWidth,
        lines: Math.round(title.getBoundingClientRect().height / lh),
        row: box(row) as Box,
        titleBox: box(title) as Box,
        meta: box(row.querySelector('.list-row__meta')),
        actions: box(row.querySelector('.list-row__actions')),
      });
    }
    return out;
  });
}

async function faceOf(page: Page, selector: string): Promise<string[]> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector });
  const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
  await cdp.detach();
  return fonts.map((f) => `${f.familyName} (${String(f.glyphCount)} glyphs)`);
}

for (const c of CONDITIONS) {
  const face = c.name;
  test(`Skills at ${String(c.width)} × ${String(c.height)}, ${face}`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: c.width, height: c.height });
    await page.goto('/#/plan/skills');
    await expect(page.locator('#skills-list .list-row').first()).toBeVisible();
    if (c.css !== null) await page.addStyleTag({ content: c.css });
    const rootFontSize = c.rootFontSize;
    if (rootFontSize !== null) {
      await page.evaluate((size) => {
        document.documentElement.style.fontSize = size;
      }, rootFontSize);
    }
    await page.locator('#skills-stage').selectOption('2');
    const beginner = page.locator('#skills-list .list-row[data-concept="leap"]');
    await expect(beginner).toBeVisible();
    await settle(page);

    const leapFace = await faceOf(page, '#skills-list .list-row[data-concept="leap"] .list-row__title');
    const buttonFace = await faceOf(page, '#skills-list .list-row[data-concept="leap"] .list-row__actions button');
    const stage2 = await readRows(page);

    await beginner.evaluate((node) => node.scrollIntoView({ block: 'center' }));
    await settle(page);
    mkdirSync(PICTURES, { recursive: true });
    await page.screenshot({ path: path.join(PICTURES, `${LABEL}-${face}-stage2-${String(c.width)}x${String(c.height)}.png`) });

    // Every stage, every page.
    await page.locator('#skills-stage').selectOption('all');
    const showAll = page.locator('#skills-show-all');
    for (let i = 0; i < 12 && (await showAll.count()) > 0; i += 1) await showAll.click();
    await expect(showAll).toHaveCount(0);
    await settle(page);
    const every = await readRows(page);

    // The longest name on a row that carries both Drill it and Find more, where the words have least room.
    const longest = page.locator('#skills-list .list-row[data-concept="I-IV-V7"]');
    await longest.evaluate((node) => node.scrollIntoView({ block: 'center' }));
    await settle(page);
    await page.screenshot({ path: path.join(PICTURES, `${LABEL}-${face}-longest-${String(c.width)}x${String(c.height)}.png`) });

    mkdirSync(RUNS, { recursive: true });
    writeFileSync(
      path.join(RUNS, `probe-${LABEL}-${face}.json`),
      JSON.stringify(
        {
          label: LABEL,
          face,
          viewport: `${String(c.width)}x${String(c.height)}`,
          rootFontSize: c.rootFontSize,
          leapTitleDrawnIn: leapFace,
          leapButtonDrawnIn: buttonFace,
          stage2: {
            concepts: stage2.filter((r) => r.kind === 'concept').length,
            drills: stage2.filter((r) => r.kind === 'drill').length,
            cut: stage2.filter((r) => r.cut).map((r) => `${r.kind} ${r.id}: reads "${r.shows}"`),
            leap: stage2.find((r) => r.kind === 'concept' && r.id === 'leap'),
          },
          everyStage: {
            concepts: every.filter((r) => r.kind === 'concept').length,
            drills: every.filter((r) => r.kind === 'drill').length,
            cutConcepts: every.filter((r) => r.cut && r.kind === 'concept').map((r) => `${r.id}: reads "${r.shows}"`),
            cutDrills: [...new Set(every.filter((r) => r.cut && r.kind === 'drill').map((r) => `${r.id}: reads "${r.shows}"`))],
            wrappedConcepts: every.filter((r) => r.kind === 'concept' && r.lines > 1).map((r) => `${r.id}: ${r.title} (${String(r.lines)} lines)`),
            // A wrapped row reads as one entry: the meta line directly under the title, inside the row,
            // and the actions inside the row's box.
            brokenRows: every
              .filter((r) => r.kind === 'concept')
              .filter(
                (r) =>
                  (r.meta !== null && (r.meta.top < r.titleBox.bottom - 1 || r.meta.bottom > r.row.bottom)) ||
                  (r.actions !== null && (r.actions.top < r.row.top || r.actions.bottom > r.row.bottom || r.actions.right > r.row.right)),
              )
              .map((r) => `${r.id}: ${r.title}`),
            tallestConceptRow: Math.max(...every.filter((r) => r.kind === 'concept').map((r) => r.row.bottom - r.row.top)),
          },
          rows: every,
        },
        null,
        2,
      ),
    );
  });
}
