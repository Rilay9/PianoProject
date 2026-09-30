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
 * once everything has landed? Those must be the same run. The count is an
 * integer and the comparison is exact — there is nothing here measured on this
 * machine.
 *
 * ---
 *
 * **Live since 2026-09-14** (181ab80c; `08` §13, "§3.2 the arrangement is
 * decided by a race", done). The freeze waits for the measurement, bounded
 * (`FREEZE_WAIT_FOR_MEASURE_MS`), and asks for it directly rather than leaving
 * it to idle; a pending freeze pins the count only once a note has been played.
 * What had blocked that one-line fix — Satie's Gnossienne, whose predicted stave
 * cleared the floor and whose drawn one did not, across half the width — is
 * answered by measuring after the re-engrave: a drawn stave under the floor
 * lowers the count by one and remembers it (`slotCeiling`). `score.fill.spec`
 * still holds the width floor on the dense pieces. This header said `fixme`
 * until U32a (T60), two waves after the case began to run.
 *
 * **Four bars asked (U32a; the reviewer's word on U32's question 4,
 * `responses/2f67b047.md`).** At the default two the Nocturne's window on this
 * phone is two systems both ways with no row's room below, so the race that
 * decides the greyed next row was never run. Four bars is two rows with the
 * next two greyed below them — the shape that needs the row — and the setup is
 * named here rather than inherited from a default that can change for reasons
 * of its own.
 *
 * **A long piece's eager run keeps the sheets it started with** (the reviewer's
 * condition 1 on U32, and its acceptance of U32's question 3). No sheet load
 * starts once a run is on, so a run started as the music appears on a piece
 * past the probe's reach has only the two sheets `create` made; where the
 * patient run's shape adds a greyed row on a third, the eager run draws the same
 * window without it. That one difference is the accepted trade and is asserted
 * exactly — the same systems, the same bars shown, the eager run one slot short,
 * the patient run's extra slot its greyed next row, and the eager run holding
 * fewer sheets than the patient's shape uses. Any other difference is the race
 * this spec exists for.
 */
import { expect, test, type Page } from '@playwright/test';

/** The owner's phone upright, where the wasted height was half the screen. */
const UPRIGHT = { width: 342, height: 740 };

/** Four bars asked: the shape that exercises the look-ahead race (U32a). */
const BARS = 4;

/**
 * Beginner pieces, which is where this mattered most: they are short enough
 * that the stage could hold three or four systems, so losing the race costs
 * them the most room. The Scherzo is here as the control — dense enough that
 * the window's own systems come out the same either way.
 *
 * The Nocturne op. 48 no. 1 (81 bars) joined them for U32 (class: add): a piece
 * past the probe's reach gets two sheets from `create` and, once it is
 * measured, the ones its settled shape needs (U32a), and a run started before
 * they land keeps the two it has (`08` §4.1).
 */
const PIECES = [
  'song.folk.twinkle.ht',
  'song.folk.happy-birthday.simple',
  'song.holiday.jingle-bells.g',
  'song.classical.ode-to-joy.full',
  'song.classical.chopin-nocturne-op48-1.nifc',
  'song.classical.chopin-scherzo-2.nifc',
];

interface Arrangement {
  /** `data-slots`: how many systems the stage was told to hold. */
  slots: number;
  /** The window's own systems, the bars it shows and the bars asked (`debugFit`). */
  systems: number;
  shown: number;
  asked: number;
  /** Whether a greyed next row is drawn. */
  ahead: boolean;
  /** The sheets the renderer had to draw rows into. */
  sheets: number;
  /** Whether the freeze carries the piece measurement, or was taken blind. */
  measured: boolean;
  /** The scale the cursor's system is drawn at, for the failure message. */
  scale: number;
  /** The engraving zoom that scale is in, so the drawn size can be said. */
  zoom: number;
}

interface FitNow {
  frozen?: { scale: number; piece: unknown; zoom?: number } | null;
  slotCount?: number;
  systemsPerWindow?: number;
  barsShown?: number;
  barsAsked?: number;
  sheets?: { loaded?: number };
  slots?: unknown[];
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
      systems: fit?.systemsPerWindow ?? 0,
      shown: fit?.barsShown ?? 0,
      asked: fit?.barsAsked ?? 0,
      ahead: stage?.querySelector('.score-buffer.is-front.is-ahead:not([hidden])') != null,
      sheets: fit?.sheets?.loaded ?? (Array.isArray(fit?.slots) ? fit.slots.length : 0),
      measured: (fit?.frozen?.piece ?? null) !== null,
      scale: fit?.frozen?.scale ?? 0,
      zoom: fit?.frozen?.zoom ?? 0,
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
  // The patient run gives the renderer all the time it wants — the
  // measurement, and any sheet the shape needs after it (`data-settled`; it
  // waited on `data-measured`, which a long piece's later sheets used to
  // precede and now follow, U32a); the eager one taps Play the moment there
  // is music to look at, which is what a learner who knows the piece does.
  if (patient) await page.waitForSelector('.score-view[data-settled]', { timeout: 120_000 });
  await page.locator('#score-play').click();
  return arrangementOfRun(page);
}

test('a run started at once is arranged the same as one started after the measurement', async ({
  page,
}) => {
  test.setTimeout(420_000);
  await page.addInitScript((bars) => {
    try {
      const raw = localStorage.getItem('pianopath.settings');
      const settings = raw === null ? {} : (JSON.parse(raw) as Record<string, unknown>);
      localStorage.setItem('pianopath.settings', JSON.stringify({ ...settings, barsPerWindow: bars }));
    } catch {
      /* no storage: the default count, which the assertion on the asked bars catches */
    }
  }, BARS);
  const differ: string[] = [];
  const blind: string[] = [];
  const traded: string[] = [];
  const describe = (a: Arrangement): string =>
    `${String(a.slots)} slots (${String(a.systems)} systems, ${String(a.shown)} bars${a.ahead ? ', a greyed next row' : ''}) ` +
    `on ${String(a.sheets)} sheets, drawn at ${(a.scale * a.zoom).toFixed(3)} (scale ${a.scale.toFixed(3)} at zoom ${a.zoom.toFixed(2)})`;
  for (const piece of PIECES) {
    const patient = await openAndPlay(page, piece, true);
    // A fresh page, so the next run races from cold: the probe's OSMD instance
    // holds the piece once it has loaded it, and a second run on the same page
    // would never race at all.
    await page.reload();
    const eager = await openAndPlay(page, piece, false);
    expect([patient.asked, eager.asked], `${piece}: the runs were not asked for ${String(BARS)} bars`).toEqual([BARS, BARS]);
    const trade =
      eager.slots === patient.slots - 1 &&
      eager.systems === patient.systems &&
      eager.shown === patient.shown &&
      patient.ahead &&
      !eager.ahead &&
      eager.sheets < patient.slots;
    if (trade) traded.push(`${piece}: at once ${describe(eager)}; after everything landed ${describe(patient)}`);
    else if (eager.slots !== patient.slots || eager.systems !== patient.systems || eager.shown !== patient.shown) {
      differ.push(`${piece}: ${describe(eager)} when started at once, ${describe(patient)} when started after everything landed`);
    }
    if (!eager.measured) blind.push(piece);
    await page.reload();
  }
  test.info().annotations.push({ type: 'the accepted trade (no sheet load in a run)', description: traded.join('\n') || 'none' });
  expect(
    blind,
    `these runs froze their arrangement before the piece had been measured, so the count came from nothing: ${blind.join(', ')}`,
  ).toEqual([]);
  expect(
    differ,
    `the same piece was arranged two different ways depending on how fast Play was tapped:\n${differ.join('\n')}`,
  ).toEqual([]);
});
