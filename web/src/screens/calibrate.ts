// The timing check (owner, 2026-10-16; calibration.ts holds the rule and the kept results): a panel that plays
// CALIBRATION.clicks clicks and takes your taps on its pad (or any MIDI key), then keeps the median delay for that way of
// playing on this device. Offered once when a rhythm set first opens in Drills, and in Settings (run it, see it, reset).
// The tap that starts it starts the clicks and is not one of the taps measured (owner: "start on the first tap": it is
// not swallowed, it starts the run, and the line says so).

import { $, type App } from '../app';
import { CALIBRATION, calibrationFor, judgeCalibration, resetCalibration, saveCalibration, type TapInput } from '../calibration';
import type { KeyEvent } from '../midi';
import type { Beat } from '../sound';

export interface CalibrationPanel {
  open(): void;
  /** A MIDI key while the panel is open: taken (true) or not. */
  key(e: KeyEvent): boolean;
  /** Settings' row: what is kept for each way of playing. */
  fill(): void;
  /** For checks: the clicks' times and the taps (the clock's ms) of the last run, and its result line. */
  debug(): { state: string; clicks: number[]; taps: { t: number; input: TapInput }[]; said: string; now: number };
}

const NAMES: Record<TapInput, string> = { screen: 'Screen taps', midi: 'MIDI keyboard' };
const LEAD_MS = 900; // from the starting tap to the first click: time to get ready

export function createCalibration(app: App): CalibrationPanel {
  const { sound } = app;
  const dialog = $<HTMLDialogElement>('calib-dialog'), pad = $('calib-pad'), status = $('calib-status'), sub = $('calib-sub');
  const beat = 60000 / CALIBRATION.bpm;
  const clicks = Array.from({ length: CALIBRATION.clicks }, (_, k) => k * beat);
  let state: 'ready' | 'starting' | 'running' | 'done' = 'ready';
  let taps: { t: number; input: TapInput }[] = [];
  let run = 0, timer = 0;

  const say = (a: string, b = '') => { status.textContent = a; sub.textContent = b; };
  function ready(): void {
    state = 'ready';
    taps = [];
    say('Tap the pad to start', `That tap starts it (it is not counted); then ${CALIBRATION.clicks} clicks: tap on each one, steadily.`);
  }
  async function start(): Promise<void> {
    const mine = ++run;
    state = 'starting';
    taps = [];
    say('Get ready…', 'Tap on each click');
    await sound.prepare(false).catch(() => {});
    if (mine !== run || !dialog.open) return;
    const beats: Beat[] = clicks.map((t, k) => ({ t, accent: k === 0 }));
    sound.play([], beats, -LEAD_MS, 1);
    state = 'running';
    clearTimeout(timer);
    timer = window.setTimeout(() => { if (mine === run) finish(); }, LEAD_MS + clicks.at(-1)! + 700);
  }
  function finish(): void {
    sound.stop();
    state = 'done';
    // One way of playing a run: the first tap's (taps of the other are left out).
    const input = taps.find((x) => x.t > -150)?.input ?? 'screen';
    const r = judgeCalibration(clicks, taps.filter((x) => x.input === input).map((x) => x.t));
    if (!r.ok) { say(r.reason, 'Tap the pad to try again.'); return; }
    saveCalibration(input, { ms: r.ms, at: new Date().toISOString(), taps: r.taps });
    // (your taps and the device together: the walk-through, 2026-10-16, read a beginner's own lateness called the phone's)
    say(`${NAMES[input]}: ${r.ms} ms`, `Your taps and this device together came ${Math.abs(r.ms)} ms ${r.ms >= 0 ? 'after' : 'before'} the clicks. Kept for this device, and allowed for when your taps are judged.${r.large ? ' That is large: run it again to be sure.' : ''}`);
    fill();
  }
  /** A tap or key: the one that starts a run starts the clicks (it is not measured); during a run each is measured. */
  function tap(time: number, input: TapInput): void {
    if (state === 'starting') return; // (the sound getting ready: no clicks yet to measure against)
    if (state !== 'running') { void start(); return; }
    taps.push({ t: sound.songTime() - Math.min(1000, Math.max(0, performance.now() - time)), input });
  }
  pad.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    pad.classList.add('pressed');
    sound.tapNow();
    tap(e.timeStamp, 'screen');
  });
  for (const type of ['pointerup', 'pointercancel', 'pointerleave'] as const) pad.addEventListener(type, () => pad.classList.remove('pressed'));
  $('calib-start').addEventListener('click', () => { if (state === 'ready' || state === 'done') void start(); });
  dialog.addEventListener('close', () => { run++; clearTimeout(timer); if (state === 'running') sound.stop(); state = 'ready'; });

  function fill(): void {
    const line = (input: TapInput) => { const c = calibrationFor(input); return `${NAMES[input]}: ${c ? `${c.ms} ms (checked ${new Date(c.at).toLocaleDateString()})` : 'not checked: the browser\'s own figure is used'}`; };
    $('set-calib-val').textContent = `${line('screen')} · ${line('midi')}`;
    $<HTMLButtonElement>('set-calib-reset').disabled = !calibrationFor('screen') && !calibrationFor('midi');
  }
  $('set-calib-run').addEventListener('click', () => open());
  $('set-calib-reset').addEventListener('click', () => { resetCalibration(); fill(); });

  function open(): void {
    ready();
    if (!dialog.open) dialog.showModal();
  }
  return {
    open,
    key(e: KeyEvent): boolean {
      if (!dialog.open) return false;
      if (e.on) tap(e.time, e.source === 'screen' ? 'screen' : 'midi');
      return true;
    },
    fill,
    debug: () => ({ state, clicks, taps: [...taps], said: `${status.textContent} ${sub.textContent}`.trim(), now: sound.songTime() }),
  };
}
