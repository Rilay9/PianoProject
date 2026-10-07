// U80's product-look pictures (temporary; kept under docs/prompts/runs/U80/ after the run).
// One swept piece opened on a fresh load: the first frame that draws the music, and the settled
// frame, with the stage's box and the panel's state at each. U80_WHEN names the build.
//
// The first frame is taken from the compositor's own frames (a screencast from before the
// navigation), not by a screenshot after Playwright sees the music: a first try that way landed
// after the panel had arrived on every size (`pictures-before-too-late.txt`), which is the
// very frame the question is about. The page logs every animation frame with its time; the
// picture is the first screencast frame at or after the first frame that drew the music.
import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const WHEN = process.env.U80_WHEN ?? 'after';
const OUT = '../docs/prompts/pictures/u80';
const PIECE = 'song.classical.petzold-minuet-g-bwv-anh114';

type Logged = { t: number; drawn: boolean; panel: string; side: string; settled: boolean; stage: string };

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('pianopath.firstSight', '["*"]');
    const log: { t: number; drawn: boolean; panel: string; side: string; settled: boolean; stage: string }[] = [];
    (window as unknown as { __u80pics: typeof log }).__u80pics = log;
    const frame = (): void => {
      const stage = document.getElementById('score-stage');
      const panel = document.getElementById('score-side');
      const screen = document.querySelector('[data-screen="score"]');
      const svg = document.querySelector('#score-stage .is-front svg');
      const box = stage?.getBoundingClientRect();
      log.push({
        t: performance.timeOrigin + performance.now(),
        drawn: svg instanceof SVGElement && svg.getBoundingClientRect().height > 20,
        panel: panel instanceof HTMLElement && !panel.hidden && panel.getBoundingClientRect().width > 0 ? 'shown' : panel ? 'hidden' : 'absent',
        side: screen?.getAttribute('data-side') ?? '(absent)',
        settled: stage?.dataset.settled === 'true',
        stage: box ? `${String(Math.round(box.width))}x${String(Math.round(box.height))}` : '-',
      });
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
});

function facts(entry: Logged | undefined): string {
  if (!entry) return '(no frame)';
  return `stage ${entry.stage}; panel ${entry.panel}; data-side ${entry.side}; settled ${String(entry.settled)}; music drawn ${String(entry.drawn)}`;
}

async function screencast(page: Page): Promise<{ stop: () => Promise<{ t: number; data: string }[]> }> {
  const cdp = await page.context().newCDPSession(page);
  const frames: { t: number; data: string }[] = [];
  cdp.on('Page.screencastFrame', (frame) => {
    frames.push({ t: frame.metadata.timestamp === undefined ? 0 : frame.metadata.timestamp * 1000, data: frame.data });
    void cdp.send('Page.screencastFrameAck', { sessionId: frame.sessionId }).catch(() => undefined);
  });
  await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1 });
  return {
    stop: async () => {
      await cdp.send('Page.stopScreencast').catch(() => undefined);
      return frames;
    },
  };
}

for (const size of [
  { width: 1000, height: 1000 },
  { width: 1024, height: 1366 },
  { width: 1366, height: 1024 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
]) {
  test.describe(`${String(size.width)}x${String(size.height)}`, () => {
    test.use({ viewport: size });
    test(`first frame and settled (${WHEN})`, async ({ page }) => {
      test.setTimeout(120_000);
      mkdirSync(OUT, { recursive: true });
      const tag = `${String(size.width)}x${String(size.height)}`;
      await page.goto('about:blank');
      const cast = await screencast(page);
      await page.goto(`/#/score/${PIECE}`);
      await expect(page.locator('#score-stage[data-settled="true"]')).toHaveCount(1, { timeout: 60_000 });
      await page.waitForTimeout(2_500);
      await expect(page.locator('#score-stage[data-settled="true"]')).toHaveCount(1, { timeout: 60_000 });
      const frames = await cast.stop();
      const log = await page.evaluate(() => (window as unknown as { __u80pics: Logged[] }).__u80pics);
      const firstDrawn = log.find((entry) => entry.drawn);
      const firstDrawnIndex = firstDrawn ? log.indexOf(firstDrawn) : -1;
      // What changed after the first draw: every distinct (stage, panel) the music was drawn with.
      const drawnStates = [...new Set(log.filter((entry) => entry.drawn).map((entry) => `${entry.stage} panel ${entry.panel}`))];
      const panelFrame = log.findIndex((entry) => entry.panel === 'shown');
      const picked = firstDrawn ? frames.find((frame) => frame.t >= firstDrawn.t) : undefined;
      // Whether the picked picture still shows the first draw's state: it lands before the first
      // logged frame whose stage or panel differs from the first draw's.
      const nextChange = firstDrawn
        ? log.slice(firstDrawnIndex + 1).find((entry) => entry.stage !== firstDrawn.stage || entry.panel !== firstDrawn.panel)
        : undefined;
      const pictureIsFirstState = picked !== undefined && (nextChange === undefined || picked.t < nextChange.t);
      if (picked) writeFileSync(`${OUT}/${WHEN}-first-frame-${tag}.png`, Buffer.from(picked.data, 'base64'));
      const settled = log[log.length - 1];
      await page.screenshot({ path: `${OUT}/${WHEN}-settled-${tag}.png` });
      console.log(
        [
          `[${WHEN} ${tag}] first frame with the music: ${facts(firstDrawn)}${picked ? '' : ' (no screencast frame at or after it)'}`,
          `[${WHEN} ${tag}] the panel first shown: ${panelFrame < 0 ? 'never' : panelFrame < firstDrawnIndex ? 'before the first draw' : panelFrame === firstDrawnIndex ? 'in the frame of the first draw' : 'after the first draw'}`,
          `[${WHEN} ${tag}] the music was drawn with: ${drawnStates.join(' then ')}`,
          `[${WHEN} ${tag}] settled: ${facts(settled)}`,
          `[${WHEN} ${tag}] screencast frames: ${frames.length > 0 ? 'recorded' : 'none'}; the first-frame picture shows the first draw's stage and panel (lands before the next change): ${String(pictureIsFirstState)}${nextChange ? `; next change to ${nextChange.stage} panel ${nextChange.panel}` : '; no change after it'}`,
        ].join('\n'),
      );
    });
  });
}
