/**
 * The score screen's state machine, driven one cell at a time (T31).
 *
 * `score.fuzz.spec.ts` walks random paths and checks what must hold whatever
 * happened. This is the other half: it puts the screen in a **named** state,
 * fires **one** event, and records what came back — the state line, the
 * transport button's label, and the engine's own fields through
 * `__pianopath.scoreRun()`. The table those recordings fill is
 * `docs/decisions/2026-09-23-score-state-machine.md`.
 *
 * **What is a proxy here, said out loud.** Everything below is read off the
 * DOM and off the engine's state object. That is a proxy for what a learner
 * sees and hears: nothing in this file listens to the piano, the metronome or
 * the played-back hand, and a line that is on the screen may still be too
 * small, too late or in the wrong place to be read. Where a test says "the
 * screen says X" it means "`#score-waiting` held X".
 *
 * `visibilitychange` is faked by redefining `document.visibilityState`, which
 * is the same signal the screen listens for and not the same thing as a phone
 * being locked.
 *
 * No assertion here is a number measured on this machine (`00-invariants` §2):
 * every one compares two readings taken in the same test, or compares a line
 * against the standing line the help table holds for that mode.
 */
import { expect, test, type Page } from '@playwright/test';
import { installMidiMock, type MidiMock } from './fixtures/midiMock';
import {
  closeScoreMenu,
  openScoreMenu,
  pressControl,
  revealBar,
  setTempoPercent,
  withScoreMenu,
} from './scoreControls';

const UPRIGHT = { width: 390, height: 844 };
const ITEM = 'song.folk.mary-had-a-little-lamb';
/** A key the piece never asks for. */
const WRONG_NOTE = 61;

/** The standing lines `app/src/ui/help.ts` holds, so the probe can tell one from a run's own. */
const STANDING = {
  wait: 'Play the first note. Nothing moves until you do.',
  tempo: 'The count-in clicks, then play along.',
  free: 'Play. The page follows you; nothing is marked.',
} as const;

type Run = {
  step: number;
  expected: number[];
  /** The source measure the cursor is in; 0 is printed bar 1 on this piece. */
  bar: number;
  /** The measure of the next step, or `null` on the run's last step. */
  nextBar: number | null;
  paused: boolean;
  armed: boolean;
  engineMode: string;
  input: string;
} | null;

interface Snap {
  running: boolean;
  hearing: boolean;
  /** What the mode selector says — not necessarily what the run is in. */
  mode: string;
  /** The engine's own mode, or `''` with no run. */
  engineMode: string;
  play: string;
  hear: string;
  waiting: string;
  status: string;
  loop: string;
  summary: boolean;
  run: Run;
}

async function snap(page: Page): Promise<Snap> {
  return page.evaluate(() => {
    const screen = document.querySelector<HTMLElement>('section[data-screen="score"]');
    const text = (id: string): string => document.getElementById(id)?.textContent?.trim() ?? '';
    const summaryEl = document.querySelector<HTMLElement>('#score-summary');
    const run =
      (window as unknown as { __pianopath?: { scoreRun?: () => Run } }).__pianopath?.scoreRun?.() ?? null;
    return {
      running: screen?.dataset.running === 'true',
      hearing: screen?.dataset.hearing === 'true',
      mode: screen?.dataset.mode ?? '',
      engineMode: run?.engineMode ?? '',
      play: text('score-play'),
      hear: text('score-hear'),
      waiting: text('score-waiting'),
      status: text('score-status'),
      loop: text('score-loop'),
      summary: summaryEl !== null && !summaryEl.hidden,
      run,
    };
  });
}

/**
 * Opens the piece with a MIDI piano plugged in and waits for the first engraving.
 * `query` is the rest of the route, `?performance=1` for a performance (T40).
 */
async function openScore(page: Page, query = ''): Promise<MidiMock> {
  await page.setViewportSize(UPRIGHT);
  const midi = await installMidiMock(page, { permission: 'granted' });
  await page.goto(`/#/score/${ITEM}${query}`);
  await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-mode', /wait|tempo/, {
    timeout: 60_000,
  });
  await page.waitForFunction(
    () => {
      const svg = document.querySelector('#score-stage .is-front svg');
      return svg instanceof SVGElement && svg.getBoundingClientRect().height > 20;
    },
    undefined,
    { timeout: 60_000 },
  );
  return midi;
}

async function chooseMode(page: Page, mode: string): Promise<void> {
  await revealBar(page);
  await page.locator('#score-mode').selectOption(mode);
  await page.waitForTimeout(200);
}

/** Plays the step the run is waiting for, so a Wait run moves on. */
async function playExpected(page: Page, midi: MidiMock): Promise<void> {
  const before = await snap(page);
  for (const n of before.run?.expected ?? []) await midi.noteOn(n, 80);
  await page.waitForTimeout(80);
  for (const n of before.run?.expected ?? []) await midi.noteOff(n);
  await page.waitForTimeout(150);
}

/** The screen's own visibility handler, driven directly. Not a locked phone. */
async function setHidden(page: Page, hidden: boolean): Promise<void> {
  await page.evaluate((value) => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => (value ? 'hidden' : 'visible'),
    });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
  await page.waitForTimeout(250);
}

/** The bar the header says the cursor is in: `bar 2 / 8` gives 2. */
async function whereBar(page: Page): Promise<number> {
  const said = (await page.locator('#score-where').textContent()) ?? '';
  const bar = Number(/bar (\d+)/.exec(said)?.[1]);
  expect(Number.isFinite(bar), `no bar in "${said}"`).toBe(true);
  return bar;
}

/** Plays whatever the run asks for until it ends by itself. */
async function playToTheEnd(page: Page, midi: MidiMock): Promise<void> {
  for (let i = 0; i < 120; i += 1) {
    const s = await snap(page);
    if (s.summary || !s.running) return;
    await playExpected(page, midi);
  }
  throw new Error('the run never reached its end');
}

/** The words on the `⋯` row that holds `control` — where a row says why it is refused. */
function rowLabel(page: Page, control: string) {
  return page
    .locator('.score-menu-row', { has: page.locator(control) })
    .locator('.score-menu-row__label');
}

test.describe('the score screen, one state and one event at a time', () => {
  /**
   * A paused run must say it is paused.
   *
   * While paused, `PracticeEngine.feed` returns at `this.paused` — every note
   * the learner plays is dropped — and `readyLine()` returns `''` because
   * `session.running` is still true, so the help strip falls back to the
   * mode's **standing** line. A Wait run therefore reads *Play the first note.
   * Nothing moves until you do.* while playing a note does nothing at all,
   * which is the screen telling the learner to do the one thing it is
   * ignoring (`00` §1: a control that looks live and is not is a bug).
   */
  test('a paused run says it is paused, in Wait', async ({ page }) => {
    const midi = await openScore(page);
    await chooseMode(page, 'wait');
    await pressControl(page, '#score-play');
    await page.waitForTimeout(400);
    const running = await snap(page);
    expect(running.running, 'the run started').toBe(true);

    await pressControl(page, '#score-play');
    await page.waitForTimeout(300);
    const paused = await snap(page);
    expect(paused.run?.paused, 'the engine is paused').toBe(true);

    // The note is swallowed: this is what makes the standing line a lie.
    const step = paused.run?.step ?? -1;
    await playExpected(page, midi);
    const after = await snap(page);
    expect(after.run?.step, 'a paused run does not move on a note').toBe(step);

    expect(
      after.waiting,
      `a paused run showed the mode's standing line: "${after.waiting}"`,
    ).not.toBe(STANDING.wait);
    expect(after.waiting.toLowerCase()).toContain('paused');
  });

  test('a paused run says it is paused, in Keep tempo', async ({ page }) => {
    await openScore(page);
    await chooseMode(page, 'tempo');
    await pressControl(page, '#score-play');
    await page.waitForTimeout(600);
    await pressControl(page, '#score-play');
    await page.waitForTimeout(300);
    const paused = await snap(page);
    expect(paused.run?.paused, 'the engine is paused').toBe(true);
    expect(
      paused.waiting,
      `a paused run showed the mode's standing line: "${paused.waiting}"`,
    ).not.toBe(STANDING.tempo);
    expect(paused.waiting.toLowerCase()).toContain('paused');
  });

  /**
   * A one-bar preview (long-press a bar) ends when its loop comes round.
   * Anything that removes the loop under it — clearing the loop, or `Hear it`,
   * which stops the session outright — leaves `hearingBar` set for ever: the
   * mode selector says one thing and every later run is a Listen run, and the
   * loop the learner had set has been replaced by the single bar.
   */
  test('a bar preview cannot strand the screen in Listen', async ({ page }) => {
    await openScore(page);
    await chooseMode(page, 'wait');
    // Long-press a bar: 400 ms is the gesture's own threshold (`04` §5).
    const stage = page.locator('#score-stage');
    const box = await stage.boundingBox();
    expect(box, 'the stage is on the screen').not.toBeNull();
    await page.mouse.move((box?.x ?? 0) + 60, (box?.y ?? 0) + 60);
    await page.mouse.down();
    await page.waitForTimeout(700);
    await page.mouse.up();
    await page.waitForTimeout(300);

    const preview = await snap(page);
    expect(preview.running, 'the preview is running').toBe(true);
    expect(preview.engineMode, 'a preview is a Listen run').toBe('listen');
    expect(preview.hearing, 'the preview is not `Hear it`').toBe(false);

    // Stop it the way a restless learner does: ask to hear the whole piece.
    await pressControl(page, '#score-hear');
    await page.waitForTimeout(400);
    await pressControl(page, '#score-hear');
    await page.waitForTimeout(400);

    // And now start an ordinary run.
    await pressControl(page, '#score-play');
    await page.waitForTimeout(600);
    const after = await snap(page);
    expect(after.running, 'a run started').toBe(true);
    expect(
      after.engineMode,
      `the selector says ${after.mode} and the run is ${after.engineMode}`,
    ).toBe(after.mode);
  });

  /**
   * Input decides what is judged — `accuracyEstimated`, `micChordLeniency`,
   * `micChordFraction`, `wrongNoteConfidence` and `latchStart` are all set
   * from it in `startRun` — so `04` §5's rule applies: a control that changes
   * what is judged restarts the run. It did not, and the sharpest consequence
   * is a Keep tempo run **holding for a first note** when the input that
   * could have played one has just been taken away.
   */
  test('taking the input away does not leave a run holding for ever', async ({ page }) => {
    await openScore(page);
    await chooseMode(page, 'tempo');
    await pressControl(page, '#score-play');
    // Held for the first note once the count-in is over; how long that takes is
    // the piece's own tempo, so it is waited for rather than assumed.
    await page.waitForFunction(
      () =>
        (window as unknown as { __pianopath?: { scoreRun?: () => { armed: boolean } | null } }).__pianopath
          ?.scoreRun?.()?.armed === true,
      undefined,
      { timeout: 30_000 },
    );
    const armed = await snap(page);
    expect(armed.run?.armed, 'the run is holding for the first note').toBe(true);

    await withScoreMenu(page, async () => {
      await page.locator('#score-input').selectOption('none');
    });
    await page.waitForTimeout(1_500);
    const after = await snap(page);
    expect(
      after.run?.armed !== true || after.running !== true,
      'the run is still holding for a note nothing can play',
    ).toBe(true);
  });

  /**
   * `05` §4: a running Tempo or Listen run pauses when the page is hidden.
   * `onVisibilityChange` asked the **selector** instead of the run, so a
   * `Hear it` demonstration started from Wait or Free was not a run it knew
   * about.
   */
  test('hiding the page pauses a Hear it run', async ({ page }) => {
    await openScore(page);
    await chooseMode(page, 'wait');
    await pressControl(page, '#score-hear');
    await page.waitForTimeout(600);
    const hearing = await snap(page);
    expect(hearing.running, 'the demonstration is running').toBe(true);
    expect(hearing.engineMode).toBe('listen');

    await setHidden(page, true);
    const hidden = await snap(page);
    expect(hidden.run?.paused, 'a hidden clock-driven run is paused').toBe(true);
    await setHidden(page, false);
  });

  /**
   * The screen told the learner which button to press; the button must work.
   *
   * *Mary had a little lamb* is written for one hand, so a run asked for with
   * `L` is refused with *Nothing for the left hand in this piece — choose R or
   * Both*. Pressing `Both` then did nothing: the hand buttons only start a run
   * when one is already going, and the refusal had just stopped the only one
   * there was. The sentence stayed on the header for the rest of the sitting
   * as well, naming a hand nobody had chosen any more.
   */
  test('a hand chosen after a refusal starts the run the refusal asked for', async ({ page }) => {
    await openScore(page);
    await chooseMode(page, 'wait');
    await pressControl(page, '#score-play');
    await page.waitForTimeout(400);
    expect((await snap(page)).running, 'the run started').toBe(true);

    await pressControl(page, '#score-hands-L');
    await page.waitForTimeout(400);
    const refused = await snap(page);
    expect(refused.running, 'a hand with nothing to play is refused').toBe(false);
    expect(refused.status).toContain('choose R or Both');

    await pressControl(page, '#score-hands-both');
    await page.waitForTimeout(600);
    const after = await snap(page);
    expect(after.running, 'the hand the refusal named starts a run').toBe(true);
    expect(after.status, 'the refusal is about a hand nobody has chosen now').not.toContain(
      'choose R or Both',
    );
  });

  /**
   * *Double-tap the last bar* is an instruction, and an instruction that has
   * been carried out stops being one. Nothing cleared it, so it sat on the
   * header beside a Loop control already naming the bars it had asked for —
   * and went on sitting there through a cleared loop and a mode change.
   */
  test('the loop prompt goes when the loop it asks for is set', async ({ page }) => {
    await openScore(page);
    await chooseMode(page, 'wait');
    const stage = page.locator('#score-stage');
    await stage.dispatchEvent('dblclick');
    await page.waitForTimeout(200);
    const half = await snap(page);
    expect(half.status, 'the first tap asks for the second').toContain('Double-tap the last bar');

    await stage.dispatchEvent('dblclick');
    await page.waitForTimeout(400);
    const set = await snap(page);
    expect(set.loop, 'the loop control names the bars').not.toBe('Off');
    expect(set.status, 'the instruction has been carried out').not.toContain(
      'Double-tap the last bar',
    );
  });

  /**
   * Leaving during a demonstration is not a run left half way.
   *
   * The offer in the header (`04` §5) is written on the way out by
   * `rememberUnfinished`, which skipped Listen by asking the **mode
   * selector** — and `Hear it` deliberately leaves that alone. So walking out
   * of a demonstration wrote *You stopped at bar 7 of 12 last time*, an offer
   * to carry on with a run the learner had not played a note of. The same
   * fault as the beat dot and the page-hidden pause, in a third place.
   */
  test('leaving during a demonstration leaves nothing to carry on from', async ({ page }) => {
    await openScore(page);
    await chooseMode(page, 'wait');
    await pressControl(page, '#score-hear');
    await page.waitForTimeout(1_500);
    const hearing = await snap(page);
    expect(hearing.engineMode, 'a demonstration is a Listen run').toBe('listen');

    await pressControl(page, '#score-back');
    await page.waitForTimeout(500);
    await page.goto(`/#/score/${ITEM}`);
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute(
      'data-mode',
      /wait|tempo/,
      { timeout: 60_000 },
    );
    await page.waitForTimeout(1_500);
    await expect(
      page.locator('#score-resume'),
      'nothing was played, so there is nothing to carry on from',
    ).toBeHidden();
  });

  /**
   * The probe: named states, one event each, recorded rather than asserted.
   *
   * Printed as a table so the decision document's cells can say which of them
   * were measured and which were read out of the code.
   */
  test('probe: what each event does in each state', async ({ page }) => {
    test.setTimeout(300_000);
    const midi = await openScore(page);
    const rows: string[] = [];
    const record = async (state: string, event: string): Promise<void> => {
      const s = await snap(page);
      rows.push(
        [
          state,
          event,
          `running=${String(s.running)}`,
          `select=${s.mode}`,
          `engine=${s.engineMode || '-'}`,
          `paused=${String(s.run?.paused ?? false)}`,
          `armed=${String(s.run?.armed ?? false)}`,
          `play=${s.play}`,
          `hear=${s.hear}`,
          `loop=${s.loop}`,
          `input=${s.run?.input ?? '-'}`,
      `summary=${String(s.summary)}`,
          `line=${JSON.stringify(s.waiting)}`,
          `status=${JSON.stringify(s.status)}`,
        ].join(' | '),
      );
    };

    // --- idle at bar 1, one mode at a time ----------------------------------
    await chooseMode(page, 'wait');
    await record('idle', 'mode->wait');
    await chooseMode(page, 'tempo');
    await record('idle', 'mode->tempo');
    await chooseMode(page, 'free');
    await record('idle', 'mode->free');
    await chooseMode(page, 'listen');
    await record('idle', 'mode->listen');
    await chooseMode(page, 'wait');

    // --- the keys are the start button (T8) ---------------------------------
    await midi.noteOn(60, 80);
    await page.waitForTimeout(400);
    await midi.noteOff(60);
    await record('idle/wait', 'MIDI note');

    // --- running Wait -------------------------------------------------------
    await playExpected(page, midi);
    await record('running/wait', 'right note');
    await midi.noteOn(61, 80);
    await page.waitForTimeout(200);
    await midi.noteOff(61);
    await record('running/wait', 'wrong note');

    // --- paused -------------------------------------------------------------
    await pressControl(page, '#score-play');
    await page.waitForTimeout(300);
    await record('running/wait', 'pause');
    await playExpected(page, midi);
    await record('paused/wait', 'right note');
    await withScoreMenu(page, async () => {
      await page.locator('#score-metronome').click();
    });
    await record('paused/wait', 'metronome on');
    // The hand already chosen: nothing changes, so nothing restarts (T33).
    await pressControl(page, '#score-hands-both');
    await page.waitForTimeout(400);
    await record('paused/wait', 'hands->both (already chosen)');
    // C2 (T33): a restarting option while paused restarts paused.
    await pressControl(page, '#score-hands-R');
    await page.waitForTimeout(400);
    await record('paused/wait', 'hands->R (C2)');
    await pressControl(page, '#score-play');
    await page.waitForTimeout(300);
    await record('restarted+paused/wait', 'resume');
    await pressControl(page, '#score-play');
    await page.waitForTimeout(300);
    await record('running/wait', 'pause (2)');
    await pressControl(page, '#score-play');
    await page.waitForTimeout(300);
    await record('paused/wait', 'resume');

    // --- a hand the piece has nothing for -----------------------------------
    await pressControl(page, '#score-hands-L');
    await page.waitForTimeout(400);
    await record('running/wait', 'hands->L (refused)');
    await pressControl(page, '#score-hands-both');
    await page.waitForTimeout(400);
    await record('refused', 'hands->both');

    // --- input, mid-run -----------------------------------------------------
    await withScoreMenu(page, async () => {
      await page.locator('#score-input').selectOption('keys');
    });
    await page.waitForTimeout(500);
    await record('running/wait', 'input->screen keys');
    await withScoreMenu(page, async () => {
      await page.locator('#score-input').selectOption('midi');
    });
    await page.waitForTimeout(500);

    // --- Hear it, over a run (C1, T33) --------------------------------------
    await playExpected(page, midi);
    await playExpected(page, midi);
    await pressControl(page, '#score-hear');
    await page.waitForTimeout(700);
    await record('running/wait', 'Hear it (C1: run set aside)');
    await pressControl(page, '#score-hear');
    await page.waitForTimeout(400);
    await record('hearing over a run', 'Hear it again (C1: run back)');
    await pressControl(page, '#score-hear');
    await page.waitForTimeout(700);
    await record('paused/wait', 'Hear it (C1: set aside again)');
    await setHidden(page, true);
    await record('hearing over a run', 'page hidden');
    await setHidden(page, false);
    await record('hearing over a run+hidden', 'page shown');
    await pressControl(page, '#score-play');
    await page.waitForTimeout(600);
    await record('hearing over a run', 'play (C1: the run carries on)');

    // --- the page goes away in Wait -----------------------------------------
    await setHidden(page, true);
    await record('running/wait', 'page hidden');
    await setHidden(page, false);
    await record('hidden/wait', 'page shown');

    // --- Keep tempo: count-in, holding, the first note ----------------------
    await chooseMode(page, 'tempo');
    await page.waitForTimeout(500);
    await record('running/tempo', 'mode->tempo (restart)');
    await page.waitForFunction(
      () =>
        (window as unknown as { __pianopath?: { scoreRun?: () => { armed: boolean } | null } }).__pianopath
          ?.scoreRun?.()?.armed === true,
      undefined,
      { timeout: 30_000 },
    );
    await record('armed/tempo', 'count-in ended');
    await setHidden(page, true);
    await record('armed/tempo', 'page hidden');
    await setHidden(page, false);
    await record('armed+hidden/tempo', 'page shown');
    await pressControl(page, '#score-play');
    await page.waitForTimeout(400);
    await record('armed+paused/tempo', 'resume');
    await playExpected(page, midi);
    await record('armed/tempo', 'first note');

    // --- a loop, and clearing it --------------------------------------------
    const stage = page.locator('#score-stage');
    await stage.dispatchEvent('dblclick');
    await stage.dispatchEvent('dblclick');
    await page.waitForTimeout(500);
    await record('running/tempo', 'loop set');
    await withScoreMenu(page, async () => {
      await page.locator('#score-loop').click();
    });
    await page.waitForTimeout(500);
    await record('running/tempo+loop', 'clear loop');

    // --- free play ----------------------------------------------------------
    await chooseMode(page, 'free');
    await page.waitForTimeout(500);
    await record('running/free', 'mode->free (restart)');
    await pressControl(page, '#score-play');
    await page.waitForTimeout(300);
    await record('running/free', 'pause');
    await pressControl(page, '#score-play');
    await page.waitForTimeout(300);
    await record('paused/free', 'resume');

    console.log(`\nT31 probe, ${String(rows.length)} cells:\n${rows.join('\n')}\n`);
    expect(rows.length).toBeGreaterThan(0);
  });
});

/**
 * The five choices the state-machine document left for the owner (§7 of
 * `docs/decisions/2026-09-23-score-state-machine.md`), decided on 2026-09-23
 * and built by T33. Each test drives the state the choice is about and reads
 * what a learner meets: whether the run is still there, where it is, what the
 * state line says, what a `⋯` row says and whether it can be pressed, and what
 * the summary sheet says. The same proxy caveat as the file's opening applies:
 * nothing here is heard.
 */
test.describe('the five choices, decided (T33)', () => {
  /**
   * C1. `Hear it` pressed during a run used to end the run: the middle of a
   * good run thrown away, silently, by the control a beginner presses most.
   * Now the run is set aside, paused, while the piece is played, and comes
   * back where it was.
   */
  test('C1: Hear it during a run puts the run back where it was, paused', async ({ page }) => {
    const midi = await openScore(page);
    await chooseMode(page, 'wait');
    await pressControl(page, '#score-play');
    await page.waitForTimeout(300);
    // Something to lose: a wrong note, then on into the second bar.
    await midi.noteOn(WRONG_NOTE, 80);
    await page.waitForTimeout(80);
    await midi.noteOff(WRONG_NOTE);
    for (let i = 0; i < 4; i += 1) await playExpected(page, midi);
    const before = await snap(page);
    const bar = await whereBar(page);
    expect(before.engineMode, 'a Wait run is going').toBe('wait');

    await pressControl(page, '#score-hear');
    await expect
      .poll(async () => (await snap(page)).engineMode, { timeout: 5_000 })
      .toBe('listen');
    // Stopped early, the way a learner who has heard enough stops it.
    await pressControl(page, '#score-hear');
    await page.waitForTimeout(300);

    const back = await snap(page);
    expect(back.running, 'the run is still there').toBe(true);
    expect(back.engineMode, 'the run, not the demonstration').toBe('wait');
    expect(back.run?.paused, 'back where it was, paused').toBe(true);
    expect(back.run?.step, 'on the step it was on').toBe(before.run?.step);
    expect(back.play, 'the transport offers to carry on').toBe('▶');
    expect(back.waiting).toContain(`Paused at bar ${String(bar)}`);

    // ▶ carries on, and the run's own record comes with it: the wrong note
    // played before the demonstration is on the sheet at the end.
    await pressControl(page, '#score-play');
    await playToTheEnd(page, midi);
    await expect(page.locator('#score-summary')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#score-summary dd[data-stat="wrong-notes"]')).toHaveText('1');
  });

  test('C1: a demonstration that plays to its end puts the run back too', async ({ page }) => {
    test.setTimeout(150_000);
    const midi = await openScore(page);
    await chooseMode(page, 'wait');
    await setTempoPercent(page, 130);
    await pressControl(page, '#score-play');
    await page.waitForTimeout(300);
    for (let i = 0; i < 4; i += 1) await playExpected(page, midi);
    const before = await snap(page);

    await pressControl(page, '#score-hear');
    const screen = page.locator('section[data-screen="score"]');
    await expect(screen).toHaveAttribute('data-hearing', 'true', { timeout: 5_000 });
    await expect(screen).toHaveAttribute('data-hearing', 'false', { timeout: 90_000 });
    await page.waitForTimeout(300);

    const back = await snap(page);
    expect(back.running, 'the run is still there').toBe(true);
    expect(back.engineMode, 'the run, not the demonstration').toBe('wait');
    expect(back.run?.paused, 'back where it was, paused').toBe(true);
    expect(back.run?.step, 'on the step it was on').toBe(before.run?.step);
  });

  /**
   * T40 (the reviewer, 2026-09-25): a performance with a demonstration inside
   * it is not an undemonstrated performance. `Hear it` is not refused during
   * one — the run is set aside and put back as C1 does — but the take is kept
   * as practice, the heading says so, and Progress, which reads the flag,
   * lists no performance.
   */
  test('T40: a performance with Hear it inside it is kept as practice', async ({ page }) => {
    test.setTimeout(150_000);
    const midi = await openScore(page, '?performance=1');
    await chooseMode(page, 'wait');
    await pressControl(page, '#score-play');
    // **Revised by T41 (class: revise):** the two 300 ms waits in this test
    // became waits on the state each was standing in for — the run going in
    // Wait, and the demonstration over — rather than a time assumed to cover
    // it. They were never about the fit.
    await expect
      .poll(async () => (await snap(page)).run?.engineMode ?? '', { timeout: 5_000 })
      .toBe('wait');
    for (let i = 0; i < 4; i += 1) await playExpected(page, midi);
    const bar = await whereBar(page);

    await pressControl(page, '#score-hear');
    await expect
      .poll(async () => (await snap(page)).engineMode, { timeout: 5_000 })
      .toBe('listen');
    await pressControl(page, '#score-hear');
    await expect.poll(async () => (await snap(page)).hearing, { timeout: 5_000 }).toBe(false);
    await pressControl(page, '#score-play');
    await playToTheEnd(page, midi);

    const sheet = page.locator('#score-summary');
    await expect(sheet).toBeVisible({ timeout: 10_000 });
    const sessions = (): Promise<{ itemId: string; performance?: boolean }[]> =>
      page.evaluate(async () => {
        const hooks = (window as unknown as {
          __pianopath: { exportAll: () => Promise<{ stores: Record<string, unknown[]> }> };
        }).__pianopath;
        return (await hooks.exportAll()).stores.sessions as { itemId: string; performance?: boolean }[];
      });
    await expect.poll(async () => (await sessions()).length, { timeout: 10_000 }).toBe(1);
    const [row] = await sessions();
    expect(row?.performance, 'a demonstrated take went on the performances list').toBeUndefined();
    await expect(sheet.locator('h2')).toContainText('kept as practice');
    await expect(sheet.locator('dd[data-stat="changed"]')).toContainText(
      `heard it played at bar ${String(bar)}`,
    );

    await page.locator('#summary-done').click();
    await page.goto('/#/progress');
    await expect(page.locator('#progress-performances')).toContainText('No performances yet', {
      timeout: 30_000,
    });
    await expect(page.locator('#progress-history')).toContainText('Mary Had a Little Lamb');
  });

  test('C1: ▶ during the demonstration carries the run on from where it was', async ({ page }) => {
    const midi = await openScore(page);
    await chooseMode(page, 'wait');
    await pressControl(page, '#score-play');
    await page.waitForTimeout(300);
    for (let i = 0; i < 4; i += 1) await playExpected(page, midi);
    const before = await snap(page);

    await pressControl(page, '#score-hear');
    await expect
      .poll(async () => (await snap(page)).engineMode, { timeout: 5_000 })
      .toBe('listen');
    await pressControl(page, '#score-play');
    await page.waitForTimeout(300);

    const after = await snap(page);
    expect(after.engineMode, 'the run, not the demonstration').toBe('wait');
    expect(after.run?.paused, 'carried on, as ▶ asked').toBe(false);
    expect(after.run?.step, 'from where it was, not from bar 1').toBe(before.run?.step);
  });

  /**
   * C2. An option that restarts the run, changed while the run was paused,
   * used to restart it *playing*: the learner paused, reached for a hand, and
   * the run was going again under them. Now it restarts at the top and waits.
   */
  test('C2: a hand changed while paused restarts at bar 1 and stays paused', async ({ page }) => {
    const midi = await openScore(page);
    await chooseMode(page, 'wait');
    await pressControl(page, '#score-play');
    await page.waitForTimeout(300);
    for (let i = 0; i < 4; i += 1) await playExpected(page, midi);
    await pressControl(page, '#score-play');
    await page.waitForTimeout(300);
    const paused = await snap(page);
    expect(paused.run?.paused, 'paused part way').toBe(true);

    // The hand already chosen changes nothing, so nothing restarts: this
    // press used to throw the pass away and start playing (T31's probe,
    // *paused/wait | hands->both*, measured it going again from bar 1).
    await pressControl(page, '#score-hands-both');
    await page.waitForTimeout(400);
    const same = await snap(page);
    expect(same.run?.paused, 'still paused').toBe(true);
    expect(same.run?.step, 'still where it was').toBe(paused.run?.step);

    await pressControl(page, '#score-hands-R');
    await page.waitForTimeout(400);
    const after = await snap(page);
    expect(after.running, 'a run is there').toBe(true);
    expect(after.run?.paused, 'the restart waits for the learner').toBe(true);
    expect(after.run?.bar, 'at the top of the piece').toBe(0);
    expect(after.play, 'the transport says ▶').toBe('▶');
    expect(after.waiting).toContain('Restarted at bar 1');
    expect(after.waiting).toContain('right hand');

    // Nothing moves until ▶: a note played now is not the run's.
    await playExpected(page, midi);
    expect((await snap(page)).run?.step, 'a paused run does not move on a note').toBe(after.run?.step);
    await pressControl(page, '#score-play');
    await page.waitForTimeout(300);
    expect((await snap(page)).run?.paused, '▶ carries on').toBe(false);
  });

  test('C2: the tempo changed while paused restarts and names the new tempo', async ({ page }) => {
    await openScore(page);
    await chooseMode(page, 'tempo');
    await pressControl(page, '#score-play');
    await page.waitForTimeout(500);
    await pressControl(page, '#score-play');
    await page.waitForTimeout(300);
    expect((await snap(page)).run?.paused, 'paused').toBe(true);

    await setTempoPercent(page, 80);
    await page.waitForTimeout(400);
    const after = await snap(page);
    expect(after.running, 'a run is there').toBe(true);
    expect(after.run?.paused, 'the restart waits for the learner').toBe(true);
    expect(after.waiting).toContain('Restarted at bar 1');
    expect(after.waiting).toContain('80 %');
  });

  /**
   * C3. The engine refuses the click in Free play — there is no timetable to
   * click against — and the row went on reading *On*. A refused control reads
   * as refused; a click that is only waiting for the run says when it comes.
   */
  test('C3: the metronome reads refused in Free play, and says when its click comes elsewhere', async ({
    page,
  }) => {
    await openScore(page);
    await chooseMode(page, 'tempo');
    const metronome = page.locator('#score-metronome');
    await openScoreMenu(page);
    await metronome.click();
    await expect(metronome).toHaveText('On');
    await closeScoreMenu(page);

    await chooseMode(page, 'free');
    await openScoreMenu(page);
    await expect(metronome, 'Free play has no clock to click against').toHaveText('Off');
    await expect(metronome).toBeDisabled();
    await expect(metronome).toHaveAttribute('aria-pressed', 'false');
    await expect(rowLabel(page, '#score-metronome')).toContainText('no clock in Free play');
    await closeScoreMenu(page);

    // The learner's choice comes back when the reason stops holding, and with
    // nothing running the row says when the click will be heard.
    await chooseMode(page, 'tempo');
    await openScoreMenu(page);
    await expect(metronome).toHaveText('On');
    await expect(metronome).toBeEnabled();
    await expect(rowLabel(page, '#score-metronome')).toContainText('starts with the run');
    await closeScoreMenu(page);

    // Paused, the click is on and silent, and the row says until when.
    await pressControl(page, '#score-play');
    await page.waitForTimeout(500);
    await pressControl(page, '#score-play');
    await page.waitForTimeout(300);
    expect((await snap(page)).run?.paused, 'paused').toBe(true);
    await openScoreMenu(page);
    await expect(metronome).toHaveText('On');
    await expect(rowLabel(page, '#score-metronome')).toContainText('when you carry on');
    await closeScoreMenu(page);
  });

  /**
   * C4. Blind and Perform are routes: pressing either rebuilt the screen and
   * the run went with it. Refused while a run is going, with the reason on
   * the row; live once it is paused, with the offer to carry on as the net.
   */
  test('C4: Blind and Perform are refused while a run is going, and live once it is paused', async ({
    page,
  }) => {
    const midi = await openScore(page);
    await chooseMode(page, 'wait');
    await pressControl(page, '#score-play');
    await page.waitForTimeout(300);
    for (let i = 0; i < 4; i += 1) await playExpected(page, midi);
    const bar = await whereBar(page);
    await openScoreMenu(page);
    for (const id of ['#score-blind', '#score-performance']) {
      await expect(page.locator(id), `${id} while the run is going`).toBeDisabled();
      await expect(rowLabel(page, id)).toContainText('pause the run first');
    }
    await closeScoreMenu(page);

    await pressControl(page, '#score-play');
    await page.waitForTimeout(300);
    expect((await snap(page)).run?.paused, 'paused').toBe(true);
    await openScoreMenu(page);
    await expect(page.locator('#score-blind')).toBeEnabled();
    await expect(rowLabel(page, '#score-blind')).not.toContainText('pause the run first');
    await page.locator('#score-blind').click();
    // The route rebuilds the screen; the run left paused is offered back.
    await expect(page.locator('section[data-screen="score"]')).toHaveAttribute('data-blind', 'true', {
      timeout: 60_000,
    });
    await expect(page.locator('#score-resume-said')).toContainText(`bar ${String(bar)}`, {
      timeout: 60_000,
    });
  });

  /**
   * C5. The summary is the record of the run that produced it. A hand chosen
   * mid-run restarts the run and the metronome switched on mid-run does not;
   * both are said on the sheet, so its numbers are read against that run.
   */
  test('C5: the summary names what changed during the run', async ({ page }) => {
    const midi = await openScore(page);
    await chooseMode(page, 'wait');
    await pressControl(page, '#score-play');
    await page.waitForTimeout(300);
    for (let i = 0; i < 4; i += 1) await playExpected(page, midi);
    const bar = await whereBar(page);

    await pressControl(page, '#score-hands-R');
    await page.waitForTimeout(400);
    await withScoreMenu(page, async () => {
      await page.locator('#score-metronome').click();
    });
    await playToTheEnd(page, midi);
    const changed = page.locator('#score-summary dd[data-stat="changed"]');
    await expect(changed).toContainText(`hands changed to R at bar ${String(bar)}`, { timeout: 10_000 });
    await expect(changed).toContainText('metronome on at bar 1');
  });

  test('C5: and what was changed after it, while the summary was up', async ({ page }) => {
    const midi = await openScore(page);
    await chooseMode(page, 'wait');
    await pressControl(page, '#score-play');
    await page.waitForTimeout(300);
    for (let i = 0; i < 120; i += 1) {
      const s = await snap(page);
      if (s.run?.nextBar === null) break;
      await playExpected(page, midi);
    }
    // The last note played with the `⋯` sheet open: the run ends under it,
    // and the sheet's controls are still there to be changed.
    await openScoreMenu(page);
    await playExpected(page, midi);
    await expect
      .poll(async () => (await snap(page)).summary, { timeout: 10_000 })
      .toBe(true);
    await page.locator('#score-input').selectOption('keys');
    await closeScoreMenu(page);
    await expect(page.locator('#score-summary dd[data-stat="changed"]')).toContainText(
      'input changed to Screen keys after the run',
    );
  });
});
