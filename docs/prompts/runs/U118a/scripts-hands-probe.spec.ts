// U118a probe: score.run.spec.ts:248's steps, instrumented. Not for the commit.
//
// Records, per run: when the chrome folded relative to the ▶ click, when the
// Both click was attempted, what sits at the Both button's centre at that
// moment, whether the click landed, and the button's box sampled for 500 ms.
// U118A_FACE=wider forces Verdana / DejaVu Sans on every element (the
// WIDER_FACE rule of score.screen.spec.ts); U118A_CPU=<n> throttles the CPU
// through CDP; U118A_REPEAT=<n> repeats the case.
import { expect, test, type Page } from '@playwright/test';
import { pressControl, setTempoPercent, withScoreMenu } from '../../../tests/e2e/scoreControls';

const ITEM = 'song.folk.hot-cross-buns';
const WIDER_FACE = "body, body * { font-family: Verdana, 'DejaVu Sans', sans-serif !important; }";
const FACE = process.env.U118A_FACE ?? 'app';
const CPU = Number(process.env.U118A_CPU ?? 1);
const REPEAT = Number(process.env.U118A_REPEAT ?? 1);
const DELAY = Number(process.env.U118A_DELAY ?? 0);
// old: click Both straight away (the spec as it stands); learner: wait for the
// fold, tap where Both was with the mouse (a finger's tap, no actionability
// wait), then tap Both; revised: wait for the fold, then pressControl.
const STEPS = process.env.U118A_STEPS ?? 'old';

type Probe = Window & { __probe?: { t0: number; events: string[] } };

async function openAndArm(page: Page): Promise<void> {
  await page.goto(`/#/score/${ITEM}`);
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-mode', /wait|tempo/, {
    timeout: 60_000,
  });
  if (FACE === 'wider') await page.addStyleTag({ content: WIDER_FACE });
  await page.waitForFunction(
    () => {
      const svg = document.querySelector('#score-stage .is-front svg');
      return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
    },
    undefined,
    { timeout: 60_000 },
  );
  await withScoreMenu(page, async () => {
    await page.locator('#score-input').selectOption('keys');
  });
  await page.locator('#score-mode').selectOption('wait');
  await page.locator('#score-hands-R').click();
  await setTempoPercent(page, 100);
}

async function press(page: Page, midi: number): Promise<void> {
  const key = page.locator(`.keyboard-strip [data-midi="${midi}"]`);
  await key.scrollIntoViewIfNeeded();
  await key.dispatchEvent('pointerdown', { pointerId: 1, button: 0, isPrimary: true });
  await key.dispatchEvent('pointerup', { pointerId: 1, button: 0, isPrimary: true });
}

for (let i = 0; i < REPEAT; i += 1) {
  test(`hands change mid-run, face ${FACE}, cpu ×${String(CPU)}, delay ${String(DELAY)}, steps ${STEPS}, #${String(i)}`, async ({ page }, info) => {
    test.setTimeout(120_000);
    // Every timer armed for 700 ms (the run's start fold) or 3000 ms (the fold
    // after a tap), with the page time it was armed at.
    await page.addInitScript(() => {
      const native = window.setTimeout.bind(window);
      const armed: { at: number; ms: number }[] = [];
      (window as unknown as { __armed: typeof armed }).__armed = armed;
      window.setTimeout = ((fn: TimerHandler, ms?: number, ...rest: unknown[]) => {
        if (ms === 700 || ms === 3000) armed.push({ at: performance.now(), ms });
        return native(fn, ms, ...rest);
      }) as typeof window.setTimeout;
    });
    if (CPU > 1) {
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
    }
    await openAndArm(page);
    await page.evaluate(() => {
      const w = window as Probe;
      const probe = { t0: 0, events: [] as string[] };
      w.__probe = probe;
      const section = document.querySelector<HTMLElement>('section[data-screen="score"]');
      const log = (what: string): void => {
        probe.events.push(`${(performance.now() - probe.t0).toFixed(0)} ms ${what}`);
      };
      new MutationObserver((records) => {
        for (const r of records) {
          if (r.attributeName === 'data-chrome' || r.attributeName === 'data-running') {
            log(`${r.attributeName}=${section?.getAttribute(r.attributeName) ?? ''}`);
          }
        }
      }).observe(section as Node, { attributes: true });
      // Every write that changes a slot's box (packSlots' top and height, the
      // fit's transform): a loop would show as writes that never stop.
      const stageEl = document.querySelector('#score-stage');
      if (stageEl) {
        new MutationObserver((records) => {
          for (const r of records) {
            const el = r.target as HTMLElement;
            if (!el.classList.contains('score-buffer')) continue;
            log(`slot${el.dataset.slot ?? '?'} style top=${el.style.top} height=${el.style.height}`);
          }
        }).observe(stageEl, { attributes: true, attributeFilter: ['style'], subtree: true });
      }
      document.addEventListener(
        'click',
        (e) => {
          const id = e.target instanceof Element ? e.target.id : '?';
          if (id === 'score-play') probe.t0 = performance.now();
          log(`click #${id}`);
        },
        true,
      );
      document.addEventListener(
        'pointerdown',
        (e) => {
          const t = e.target instanceof Element ? (e.target.getAttribute('data-midi') ?? e.target.id) : '?';
          log(`pointerdown ${t}`);
        },
        true,
      );
    });
    const wall0 = Date.now();
    await page.locator('#score-play').click();
    const wallPlay = Date.now();
    await press(page, 64);
    await press(page, 62);
    if (DELAY > 0) await page.waitForTimeout(DELAY);
    const wallBefore = Date.now();
    const before = await page.evaluate(() => {
      const w = window as Probe;
      const b = document.querySelector<HTMLElement>('#score-hands-both');
      const r = b?.getBoundingClientRect();
      const x = r ? r.left + r.width / 2 : 0;
      const y = r ? r.top + r.height / 2 : 0;
      const hit = document.elementFromPoint(x, y);
      const section = document.querySelector<HTMLElement>('section[data-screen="score"]');
      return {
        sincePlay: (performance.now() - (w.__probe?.t0 ?? 0)).toFixed(0),
        chrome: section?.dataset.chrome ?? null,
        running: section?.dataset.running ?? null,
        box: r ? [r.left, r.top, r.width, r.height].map((v) => Math.round(v)) : null,
        hit: hit ? `${hit.tagName.toLowerCase()}#${hit.id}.${String(hit.className).slice(0, 40)}` : null,
        viewport: [window.innerWidth, window.innerHeight],
        stage: (() => {
          const s = document.querySelector<HTMLElement>('#score-stage')?.dataset ?? {};
          return `slots=${s.slots ?? ''} ahead=${s.ahead ?? ''} fit=${s.fit ?? ''} bars=${s.windowBars ?? ''} settled=${s.settled ?? ''}`;
        })(),
        barLeftOverflowX: getComputedStyle(document.querySelector('#score-bar-left') as Element).overflowX,
      };
    });
    let clicked = 'landed';
    let afterLearnerTap: string | null = null;
    try {
      if (STEPS === 'old') {
        await page.locator('#score-hands-both').click({ timeout: 4_000 });
      } else {
        await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-chrome', 'folded');
        if (STEPS === 'learner') {
          const box = await page.locator('#score-hands-both').boundingBox();
          if (box) await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
          await page.waitForTimeout(150);
          afterLearnerTap = await page.evaluate(() => {
            const section = document.querySelector<HTMLElement>('section[data-screen="score"]');
            const stage = document.querySelector<HTMLElement>('#score-stage');
            return `chrome=${section?.dataset.chrome ?? ''} hands=${stage?.dataset.hands ?? ''}`;
          });
          await page.locator('#score-hands-both').click({ timeout: 4_000 });
        } else {
          await pressControl(page, '#score-hands-both');
        }
      }
    } catch (error) {
      clicked = `failed: ${String(error).split('\n')[0]}`;
    }
    await page.waitForTimeout(500);
    const after = await page.evaluate(() => {
      type Hooked = Window & { __pianopath?: { scoreRun?: () => { step: number; armed: boolean } | null } };
      const section = document.querySelector<HTMLElement>('section[data-screen="score"]');
      const stage = document.querySelector<HTMLElement>('#score-stage');
      const run = (window as Hooked).__pianopath?.scoreRun?.() ?? null;
      return `running=${section?.dataset.running ?? ''} hands=${stage?.dataset.hands ?? ''} step=${String(run?.step)} armed=${String(run?.armed)} summaryHidden=${String(document.querySelector<HTMLElement>('#score-summary')?.hidden ?? 'none')}`;
    });
    const boxes = await page.evaluate(async () => {
      const b = document.querySelector<HTMLElement>('#score-hands-both');
      const out: string[] = [];
      for (let k = 0; k < 25; k += 1) {
        const r = b?.getBoundingClientRect();
        out.push(r ? `${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.width)}x${Math.round(r.height)}` : 'none');
        await new Promise((res) => setTimeout(res, 20));
      }
      return out;
    });
    const events = await page.evaluate(() => (window as Probe).__probe?.events ?? []);
    const armed = await page.evaluate(() => {
      const t0 = (window as Probe).__probe?.t0 ?? 0;
      const list = (window as unknown as { __armed?: { at: number; ms: number }[] }).__armed ?? [];
      return list.filter((a) => a.at >= t0).map((a) => `${(a.at - t0).toFixed(0)}+${String(a.ms)}`);
    });
    const distinct = [...new Set(boxes)];
    const record = {
      face: FACE,
      cpu: CPU,
      playClickMs: wallPlay - wall0,
      playToBeforeBothMs: wallBefore - wallPlay,
      before,
      clicked,
      afterLearnerTap,
      after,
      boxesDistinct: distinct,
      armed,
      events,
    };
    console.log(`PROBE ${info.title} ${JSON.stringify(record)}`);
  });
}
