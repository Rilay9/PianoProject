/**
 * How many systems the stage holds must not depend on who wins a race.
 *
 * The arrangement is decided from the probe's measurement of the piece, and
 * `fitSlots` will not revisit it once a run has frozen. But the probe's *load*
 * was deferred to idle, and a run freezes 150 ms after it starts, so the freeze
 * normally won: the count was pinned at the two-system default and a beginner's
 * piece upright spent the whole run with the bottom half of the phone black.
 *
 * The corpus caught it as a coincidence. Twinkle at 342x740 drew two systems
 * and left 52 % of the height empty; the *same piece* at 360x760 drew four and
 * left 16 %, because at that size the measurement happened to land one step
 * earlier. Twenty-eight of the corpus's forty-eight upright legs had frozen
 * without a measurement. Which one a learner got was chance, which is worse
 * than either answer: the same piece looked different on consecutive opens.
 *
 * So this asks the question directly, with no pixel in it: does a run started
 * the instant the music appears arrange the piece the same way as a run started
 * after the measurement has landed? Those must be the same run. The count is an
 * integer and the comparison is exact — there is nothing here measured on this
 * machine.
 *
 * ---
 *
 * **`fixme`, deliberately: the fault is real and the fix is not one line.**
 *
 * Making the freeze wait for the measurement it depends on does turn this
 * green, and it roughly doubles the music on the screen for beginner pieces at
 * the owner's geometry — Twinkle from 48 % of the height to 83 %, Ode to Joy to
 * 86 %, Greensleeves to 78 %. It also makes the densest piece worse. Satie's
 * Gnossienne goes from two systems to four, its staves land at 43 px against
 * the 40 px floor, and `score.fill.spec` catches it at 53 % of the width: a
 * column of notation too small to play from. The corpus had been hiding that by
 * losing the race.
 *
 * The reason it is not a tuning problem: `chooseSlotCount` guards readability
 * with a *predicted* drawn staff, and the prediction is wrong by up to 40 % in
 * both directions — Satie predicted 49 px and drew 43, the Petzold minuet
 * predicted 44 px and drew 74. A floor applied to a number that wrong is not a
 * floor. Deciding the arrangement honestly needs measure-decide-remeasure, not
 * a better constant. Written up in `08-score-render-states.md` under
 * "§3.2 the arrangement is decided by a race".
 *
 * A second attempt (2026-09-12) instrumented the fit and forced every count, and
 * found the blocker exactly: the honest ink measurement exists only after a slot
 * is re-engraved for the new count, and no fit happens between that re-engrave
 * and the freeze. `handoff` §5af has what each count actually draws for nine
 * pieces, and rules out three cheaper fixes by measurement rather than argument.
 * Start there.
 *
 * Remove the `fixme` when that lands. If it starts passing for any other
 * reason, that is worth knowing about too.
 */
import { expect, test, type Page } from '@playwright/test';

/** The owner's phone upright, where the wasted height was half the screen. */
const UPRIGHT = { width: 342, height: 740 };

/**
 * Beginner pieces, which is where this mattered most: they are short enough
 * that the stage could hold three or four systems, so losing the race costs
 * them the most room. The Scherzo is here as the control — it is dense enough
 * that two systems is the right answer either way, so it should be unaffected.
 */
const PIECES = [
  'song.folk.twinkle.ht',
  'song.folk.happy-birthday.simple',
  'song.holiday.jingle-bells.g',
  'song.classical.ode-to-joy.full',
  'song.classical.chopin-scherzo-2.nifc',
];

interface Arrangement {
  /** `data-slots`: how many systems the stage was told to hold. */
  slots: number;
  /** Whether the freeze carries the piece measurement, or was taken blind. */
  measured: boolean;
  /** The scale the cursor's system is drawn at, for the failure message. */
  scale: number;
}

interface FitNow {
  frozen?: { scale: number; piece: unknown } | null;
  slotCount?: number;
}

/** Waits for the sheet to be on the glass, without waiting for the measurement. */
async function waitForInk(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const svg = document.querySelector('#score-stage .score-buffer.is-front svg');
      return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
    },
    undefined,
    { timeout: 60_000 },
  );
}

/**
 * The arrangement a run settled on.
 *
 * Waits on the freeze being *taken* rather than on a duration: the freeze is
 * the event, and with the fix in place it arrives later than it used to, so a
 * fixed wait would be timing this machine (`00` §2).
 */
async function arrangementOfRun(page: Page): Promise<Arrangement> {
  await page.waitForFunction(
    () => {
      const hooked = window as unknown as { __pianopath?: { scoreFit?: () => FitNow } };
      return (hooked.__pianopath?.scoreFit?.()?.frozen ?? null) !== null;
    },
    undefined,
    { timeout: 60_000 },
  );
  return page.evaluate(() => {
    const hooked = window as unknown as { __pianopath?: { scoreFit?: () => FitNow } };
    const fit = hooked.__pianopath?.scoreFit?.();
    const stage = document.querySelector<HTMLElement>('.score-view');
    return {
      slots: Number(stage?.dataset.slots ?? '0'),
      measured: (fit?.frozen?.piece ?? null) !== null,
      scale: fit?.frozen?.scale ?? 0,
    };
  });
}

async function openAndPlay(page: Page, piece: string, patient: boolean): Promise<Arrangement> {
  await page.setViewportSize(UPRIGHT);
  await page.goto(`/#/score/${piece}`);
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-mode', /wait|tempo/, {
    timeout: 60_000,
  });
  await waitForInk(page);
  // The patient run gives the measurement all the time it wants; the eager one
  // taps Play the moment there is music to look at, which is what a learner who
  // knows the piece does.
  if (patient) await page.waitForSelector('.score-view[data-measured]', { timeout: 60_000 });
  await page.locator('#score-play').click();
  return arrangementOfRun(page);
}

test('a run started at once is arranged the same as one started after the measurement', async ({
  page,
}) => {
  test.setTimeout(300_000);
  const differ: string[] = [];
  const blind: string[] = [];
  for (const piece of PIECES) {
    const patient = await openAndPlay(page, piece, true);
    // A fresh page, so the next run races from cold: the probe's OSMD instance
    // holds the piece once it has loaded it, and a second run on the same page
    // would never race at all.
    await page.reload();
    const eager = await openAndPlay(page, piece, false);
    if (eager.slots !== patient.slots) {
      differ.push(
        `${piece}: ${String(eager.slots)} systems at scale ${eager.scale.toFixed(3)} when started at once, ` +
          `${String(patient.slots)} at ${patient.scale.toFixed(3)} when started after the measurement`,
      );
    }
    if (!eager.measured) blind.push(piece);
    await page.reload();
  }
  expect(
    blind,
    `these runs froze their arrangement before the piece had been measured, so the count came from nothing: ${blind.join(', ')}`,
  ).toEqual([]);
  expect(
    differ,
    `the same piece was arranged two different ways depending on how fast Play was tapped:\n${differ.join('\n')}`,
  ).toEqual([]);
});
