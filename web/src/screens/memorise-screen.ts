// The Memorise screen (owner, 2026-10-12): its own header, panel and settings over the score's drawing of the music
// (a Borrower of the score screen), laid out to fit what you are memorising (no read-ahead needed). The flow itself
// (chunks, covers, passes, joining) is in memorise.ts; this is its screen.

import type { MemorisePreset } from '../activity';
import { $, type App, type Screen, type KeyRange } from '../app';
import type { StepNotes } from '../follow';
import { Memorise, type MemoHands, type MemoLook, type MemoriseOptions } from '../memorise';
import type { KeyEvent } from '../midi';
import { yours } from '../practice';
import type { Command } from '../remote';
import { currentDevice, settingsFor, type ScoreSettings } from '../settings';
import { pianoHands, SIZE_MAX, type Borrower, type ScoreScreen } from './score';

/** open(preset): an activity's preset for the piece showing (activity.ts), in force until Done. */
export type MemoriseScreen = Screen & { open(preset?: MemorisePreset, title?: string): Promise<void>; close(): void; readonly isOpen: boolean; reloadStorage(): void };

/** The score's biggest notation size (Display's slider): Memorise never draws bigger, and never stretches (owner). */
const MEMO_MAX_SIZE = SIZE_MAX;
const SWIPE = 40; // as on the score: px of travel that makes a drag rather than a tap

export function createMemoriseScreen(app: App, scoreScreen: ScoreScreen): MemoriseScreen {
  const { view, strip, sound, midi, practice } = app;
  const currentPiece = () => app.currentPiece();
  const memoDialog = $<HTMLDialogElement>('memo-dialog');
  let isOpen = false;
  let memoFit = 1; // a phone on its side: the share of the biggest size at which the one line fits the height

  const memorise = new Memorise({
    view, sound, practice,
    settings: () => memoSettings(),
    pieceId: () => currentPiece().id,
    pieceTitle: () => currentPiece().title,
    pianoHands: (s) => pianoHands(s),
    replayKey: (key) => practice.key({ midi: key, on: true, velocity: 100, time: performance.now() }),
    changed: () => fillMemo(),
    anyKeyDown: () => midi.down.size > 0,
  });
  practice.onPassEnd = () => memorise.passEnded();

  /** What the Memorise screen draws and plays with: the score's look for this piece, laid out for memorising, and Memorise's own size, keyboard, hands and tempo. */
  function memoSettings(): ScoreSettings {
    const piece = currentPiece().id, device = currentDevice(), look = memorise.look(device);
    const sideways = device === 'phone-sideways';
    return {
      ...settingsFor(piece), mode: 'memorise',
      // Upright: pages of lines as big as the score ever draws (about a bar across a phone), turning as you go,
      // the spare lines showing what follows faded. Sideways: one line as tall as the room allows.
      layout: sideways ? 'smooth' : 'rolling', slots: 1, lines: 'auto',
      size: MEMO_MAX_SIZE * look.size * (sideways ? memoFit : 1),
      under: look.under, hands: memorise.hands(piece), speed: memorise.speed(piece), musicWhilePlaying: true,
      metronome: memorise.optionsNow.metronome, onTime: memorise.optionsNow.onTime,
    };
  }

  /** The sound ready (and MIDI listening) before Memorise first plays: browsers allow sound only after a tap. */
  let memoPreparing = false;
  let memoProblem = ''; // no MIDI keyboard to listen to: said in Memorise's own message line (the main one is hidden there)
  let visit = 0; // each opening of Memorise: a start got ready in an earlier visit does not run in this one
  async function memoGo(then: () => void): Promise<void> {
    if (memoPreparing) return;
    memoPreparing = true;
    const mine = visit;
    try {
      const onScreen = memorise.look(currentDevice()).under === 'keyboard'
        ? 'Play on the keys below.' : 'Play on a MIDI keyboard, or show the keyboard in Settings.';
      memoProblem = await midi.startSoon().then((names) => (names.length ? '' : `No MIDI keyboard is connected. ${onScreen}`),
        () => `This browser has no MIDI. ${onScreen}`);
      const s = memoSettings();
      sound.keyboard = s.pianoOut === 'keyboard' && midi.canPlay ? midi : null;
      await sound.prepare(!sound.keyboard).catch(() => {});
    } finally {
      memoPreparing = false;
    }
    if (!isOpen || mine !== visit) return; // left (and perhaps came back) while it got ready (review 2026-10-14)
    then();
    fillMemo();
  }
  // Chained, not replaced: the exercise screen listens too (its keyboard list comes from here once MIDI is allowed late).
  const devicesBefore = midi.onDevices;
  midi.onDevices = (names) => { devicesBefore(names); if (names.length && memoProblem) { memoProblem = ''; fillMemo(); } };

  /** A key on the Memorise screen (nothing playing): starts it, starts your pass, or goes again after a slip. */
  function memoKey(e: KeyEvent): void {
    const ph = memorise.phase;
    if (memorise.waitRelease) return; // the note that ended the pass is still down
    if (ph === 'off' || ph === 'done') { void memoGo(() => memorise.start()); return; }
    if (ph === 'review') { memorise.resumeWith(e.midi); return; }
    if (ph !== 'ready') return;
    // Your first note starts the pass (any key if your part starts on a rest); another key is said, and it waits.
    const first = view.struckAt(view.index, yours(memoSettings()));
    if (first.length && !first.includes(e.midi)) { memorise.notFirst(); return; }
    memorise.begin(e.midi);
  }

  function fillMemo(): void {
    if (!isOpen) return;
    const sideways = currentDevice() === 'phone-sideways';
    // Sideways the panel is one row of buttons and what it says sits in the header (owner, 2026-10-12).
    const info = $('memo-info');
    if (sideways && info.parentElement !== $('memo-head-info')) $('memo-head-info').append(info);
    if (!sideways && info.parentElement !== $('memo-panel')) $('memo-panel').prepend(info);
    document.body.classList.toggle('memo-sideways', sideways);
    $('memo-label').textContent = memorise.label;
    $('memo-dots').replaceChildren(...memorise.dots.map((d) => Object.assign(document.createElement('span'), { className: `dot ${d}` })));
    $('memo-clean').textContent = memorise.cleanText;
    const m = memorise.message;
    $('memo-say').textContent = m.text;
    $('memo-say').className = `memo-say ${m.kind}`;
    $('memo-sub').textContent = memoProblem || m.sub;
    $('memo-choices').hidden = !memorise.choosing;
    // The test (owner, 2026-10-13): its choices, Test once every bar is learned, Stuck during it (no Hear or Peek then).
    const offers = memorise.offers;
    $('memo-offers').hidden = !offers.length;
    $('memo-offers').replaceChildren(...offers.map((o) => {
      const b = Object.assign(document.createElement('button'), { type: 'button', className: `btn${o.main ? ' main' : ''}`, textContent: o.label });
      b.addEventListener('click', () => void memoGo(() => memorise.act(o.id)));
      return b;
    }));
    $('memo-test').hidden = !memorise.canTest;
    $('memo-countin').hidden = !memorise.canCountIn; // in time: start after a bar of clicks (or just play the first note)
    $('memo-stuck').hidden = !memorise.canStick;
    $('memo-hear').hidden = memorise.testingNow || memorise.phase === 'offer';
    $('memo-peek').hidden = memorise.testingNow || memorise.phase === 'offer';
    for (const id of ['memo-chunk-prev', 'memo-chunk-next']) $(id).hidden = !memorise.onChunks;
    if (memorise.choosing) {
      const c = memorise.joinChoices;
      $('memo-join-previous').textContent = c.previous;
      $('memo-join-all').textContent = c.all;
      $('memo-join-next').textContent = c.next;
    }
    $('memo-next-chunk').hidden = !memorise.waitingForNext;
    const running = memorise.active && memorise.phase !== 'done' && !memorise.waitingForNext; // waiting for Next chunk: ▶ goes on
    $('memo-go').textContent = running ? '■' : '▶ Start';
    $('memo-go').setAttribute('aria-label', running ? 'Stop memorising' : 'Start memorising');
    $<HTMLButtonElement>('memo-peek').disabled = !memorise.covering;
    $('memo-pick').hidden = !memorise.canPickBar;
    $('memo-from').textContent = `Bar ${memorise.fromNumber}`;
    $('memo-ctl').hidden = (memorise.choosing || offers.length > 0) && sideways; // sideways the choices take the row
    app.stayAwake();
    if (memorise.phase !== 'turn') strip.markKeys('now-r', []); // a hint lasts only while your pass waits
    strip.markKeys('wrong', memorise.phase === 'review' ? memorise.wrongKeys : []); // the slip's wrong keys in red
    // Sideways the height is short: the header and buttons fade while it plays or you play, so the music (laid out
    // for the whole height) shows whole; they come back when it needs you, or on a tap (owner, 2026-10-12).
    const phaseChanged = memorise.phase !== memoFadePhase;
    if (phaseChanged) { memoFadePhase = memorise.phase; memoShown = false; }
    const fade = sideways && (memorise.phase === 'hear' || memorise.phase === 'turn') && !memoShown && !memoProblem; // (no keyboard to play on: it stays up, saying so)
    for (const id of ['memo-head', 'memo-panel']) $(id).classList.toggle('faded', fade);
    document.body.style.setProperty('--memo-h', `${$('memo-panel').offsetHeight}px`);
    document.body.style.setProperty('--memo-head-h', `${$('memo-head').offsetHeight}px`);
    // Sideways, a slip and the join question show with the header and buttons up: the line fits between them, the
    // bars being learned from the left edge (owner, 2026-10-12); otherwise it has the whole height.
    const framed = sideways && (memorise.phase === 'review' || memorise.phase === 'ask' || memorise.phase === 'offer');
    view.setBand(framed ? $('memo-head').offsetHeight : 0, framed ? $('memo-panel').offsetHeight : 0);
    if (framed && phaseChanged) view.revealBar(memorise.slipView.bar, memorise.phase === 'review' || memorise.phase === 'offer' ? memorise.slipView.step : -1);
  }
  let memoFadePhase = '', memoShown = false; // a tap brings the faded header and buttons back until the next step

  // What the score's drawing asks of Memorise while it has it.
  const borrower: Borrower = {
    settings: () => memoSettings(),
    get fit() { return memoFit; },
    set fit(f: number) { memoFit = f; },
    beforeShow: () => fillMemo(),
    afterShow: () => { if (memorise.active) memorise.relaidOut(); else memorise.preview(); },
    get keepPosition() { return memorise.active; },
    loopEnded: () => { if (memorise.active) memorise.passEnded(); },
    // Under the music: lit keys only while it plays the bars to you (it works by bar, and lit keys would give covered bars away).
    stepNotes: (notes: StepNotes) => (memorise.phase !== 'hear' ? { now: [], next: [], fileChord: '' } : notes),
    keySeen: (e: KeyEvent) => {
      if (e.on) { strip.markKeys('now-r', []); memorise.unhint(); } // a key puts away Memorise's hint
      if (!e.on && midi.down.size === 0) memorise.released();
    },
    keyToStart: (e: KeyEvent) => memoKey(e),
    tap: (e: PointerEvent, dx: number, dy: number) => {
      if (Math.abs(dx) > SWIPE / 4 || Math.abs(dy) > SWIPE / 4) return; // a drag: the one-line layout scrolls
      // Faded (sideways, while it plays or you play): the first tap only brings the controls back (owner, 2026-10-12).
      if ($('memo-head').classList.contains('faded')) { memoShown = true; fillMemo(); return; }
      const bar = view.hitBar(e.clientX, e.clientY);
      if (bar >= 0 && memorise.canPickBar) { memorise.setFrom(bar); return; }
      memoShown = !memoShown || $('memo-head').classList.contains('faded'); // sideways: a tap brings them back (or lets them fade)
      fillMemo();
    },
    // No keys under the music: the hint names the notes instead (owner, 2026-10-12).
    hint: (keys: number[]) => {
      if (memoSettings().under === 'nothing') memorise.hint(view.namesAt(view.index, yours(memoSettings())).filter((n) => keys.includes(n.midi)).map((n) => n.name));
    },
    stop: () => { if (memorise.active) memorise.stop(); },
    get busy() { return memorise.active; },
  };

  async function open(preset?: MemorisePreset, title?: string): Promise<void> {
    if (preset) { const { hands, tempo, ...options } = preset; memorise.setPreset({ piece: currentPiece().id, options, hands, tempo }); }
    else memorise.setPreset(null);
    scoreScreen.lend(borrower);
    isOpen = true;
    visit += 1;
    memoFit = 1;
    document.body.classList.add('memorising');
    $('memo-head').hidden = false;
    $('memo-panel').hidden = false;
    $('memo-piece').textContent = currentPiece().title;
    app.showMessage('');
    await scoreScreen.draw();
    if (title) memorise.note(title); // an activity's own words, in Memorise's message line
  }

  function close(): void {
    memorise.leave();
    memorise.setPreset(null); // an activity's preset ends with it
    isOpen = false;
    document.body.classList.remove('memorising', 'memo-sideways');
    $('memo-head').hidden = true;
    $('memo-panel').hidden = true;
    document.body.style.setProperty('--memo-h', '0px');
    document.body.style.setProperty('--memo-head-h', '0px');
    scoreScreen.lend(null);
    app.stayAwake();
    void scoreScreen.draw(true);
  }

  $('memo-done').addEventListener('click', close);
  $('memo-go').addEventListener('click', () => {
    if (memorise.waitingForNext) memorise.nextChunk(1);
    else if (memorise.active && memorise.phase !== 'done') memorise.stop();
    else void memoGo(() => memorise.start());
  });
  // Hear: a tap plays the bar you are on (or the slip's); held, everything you are learning (owner, 2026-10-12).
  const HOLD_MS = 500; // about the phone's own long-press time, as on the music
  let hearTimer = 0, hearHeld = false;
  $('memo-hear').addEventListener('pointerdown', (e) => {
    $('memo-hear').setPointerCapture(e.pointerId);
    hearHeld = false;
    hearTimer = window.setTimeout(() => { hearHeld = true; void memoGo(() => memorise.hearAll()); }, HOLD_MS);
  });
  $('memo-hear').addEventListener('pointerup', () => { clearTimeout(hearTimer); if (!hearHeld) void memoGo(() => memorise.hearBar()); });
  for (const ev of ['pointerleave', 'pointercancel']) $('memo-hear').addEventListener(ev, () => clearTimeout(hearTimer));
  $('memo-hear').addEventListener('contextmenu', (e) => e.preventDefault());
  const peek = (on: boolean) => () => memorise.peek(on);
  $('memo-peek').addEventListener('pointerdown', (e) => { $('memo-peek').setPointerCapture(e.pointerId); memorise.peek(true); });
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) $('memo-peek').addEventListener(ev, peek(false));
  // A held button is a hold, not the start of a long press (which would select text or open the copy menu).
  for (const id of ['memo-peek', 'memo-hear']) $(id).addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
  $('memo-peek').addEventListener('contextmenu', (e) => e.preventDefault());
  $('memo-from-prev').addEventListener('click', () => memorise.stepFrom(-1));
  $('memo-from-next').addEventListener('click', () => memorise.stepFrom(1));
  $('memo-chunk-prev').addEventListener('click', () => memorise.nextChunk(-1));
  $('memo-chunk-next').addEventListener('click', () => memorise.nextChunk(1));
  $('memo-next-chunk').addEventListener('click', () => memorise.nextChunk(1));
  $('memo-test').addEventListener('click', () => memorise.openTest());
  $('memo-countin').addEventListener('click', () => void memoGo(() => memorise.countIn()));
  $('memo-stuck').addEventListener('click', () => memorise.stuck());
  for (const choice of ['previous', 'all', 'next'] as const) {
    $(`memo-join-${choice}`).addEventListener('click', () => memorise.choose(choice, $<HTMLInputElement>('memo-always').checked));
  }

  // Its settings: hands, tempo, size and keyboard (kept for Memorise), then the memorising options.
  function fillMemoSettings(): void {
    const o = memorise.optionsNow, piece = currentPiece().id, look = memorise.look(currentDevice());
    const values: Record<string, string> = {
      'm-chunk': String(o.chunk), 'm-adds': o.adds, 'm-learnedAfter': String(o.learnedAfter), 'm-timing': o.timing ? 'yes' : 'no',
      'm-carryFrom': o.carryFrom, 'm-before': o.before, 'm-next': o.next, 'm-join': o.join, 'm-hands': memorise.hands(piece), 'm-under': look.under,
      'm-metronome': o.metronome ? 'yes' : 'no', 'm-onTime': o.onTime,
    };
    $('m-ontime-set').hidden = !o.timing; // On time only matters when a pass is in time
    for (const [name, value] of Object.entries(values)) for (const r of memoDialog.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`)) r.checked = r.value === value;
    $<HTMLOutputElement>('m-bpm').value = `♩ ${Math.round(view.baseBpm * memorise.speed(piece))}`;
    $<HTMLOutputElement>('m-size').value = `${Math.round(look.size * 100)}%`;
  }
  $('memo-settings').addEventListener('click', () => { fillMemoSettings(); memoDialog.showModal(); });
  memoDialog.addEventListener('change', (e) => {
    const r = e.target as HTMLInputElement, piece = currentPiece().id, device = currentDevice();
    if (r.name === 'm-hands') memorise.setPiece(piece, { hands: r.value as MemoHands });
    else if (r.name === 'm-under') { memorise.setLook(device, { under: r.value as MemoLook['under'] }); memoFit = 1; void scoreScreen.draw(); }
    else {
      const key = r.name.slice(2) as keyof MemoriseOptions;
      const value = key === 'chunk' || key === 'learnedAfter' ? Number(r.value) : key === 'timing' || key === 'metronome' ? r.value === 'yes' : r.value;
      memorise.setOptions({ [key]: value } as Partial<MemoriseOptions>);
    }
    fillMemoSettings();
  });
  const memoTempo = (delta: number) => {
    const piece = currentPiece().id, bpm = Math.max(5, Math.round(view.baseBpm * memorise.speed(piece)) + delta);
    memorise.setPiece(piece, { speed: bpm / view.baseBpm });
    view.setSpeed(bpm / view.baseBpm);
    sound.setSpeed(bpm / view.baseBpm);
    fillMemoSettings();
  };
  $('m-slower').addEventListener('click', () => memoTempo(-5));
  $('m-faster').addEventListener('click', () => memoTempo(5));
  // Size: a share of the biggest the score draws (100% = that); half of it is about the score's usual size.
  const memoSize = (delta: number) => {
    const device = currentDevice(), size = Math.round(Math.min(1, Math.max(0.5, memorise.look(device).size + delta)) * 100) / 100;
    memorise.setLook(device, { size });
    memoFit = 1;
    fillMemoSettings();
    void scoreScreen.draw();
  };
  $('m-smaller').addEventListener('click', () => memoSize(-0.1));
  $('m-larger').addEventListener('click', () => memoSize(0.1));

  return {
    open,
    close,
    get isOpen() { return isOpen; },
    reloadStorage: () => memorise.reload(),
    key: (e: KeyEvent) => scoreScreen.key(e), // the score's drawing takes the keys and passes them on (Borrower)
    // The keyboard remote in Memorise: a mash stops; the lowest key is Hear (held: Peek); the highest starts, goes
    // again after a slip, or on to the next chunk.
    command(c: Command): void {
      if (c === 'mash') { if (memorise.active) { memorise.stop(); memorise.note('Stopped by a mash'); } }
      else if (c === 'low') void memoGo(() => memorise.hearBar());
      else if (c === 'peek-on' || c === 'peek-off') memorise.peek(c === 'peek-on');
      else if (memorise.canCountIn) void memoGo(() => memorise.countIn()); // highest key, in time and waiting: the count-in
      else if (memorise.waitingForNext) memorise.nextChunk(1);
      else if (memorise.phase === 'review') memorise.goAgain();
      else if (!memorise.active || memorise.phase === 'done') void memoGo(() => memorise.start());
    },
    musicRange: (): KeyRange | null => scoreScreen.musicRange(),
    resized: () => scoreScreen.resized(),
    panel: (open: boolean) => { if (isOpen) memorise.panel(open); },
    get busy() { return isOpen && memorise.active; },
  };
}
