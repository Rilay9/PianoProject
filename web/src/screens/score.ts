// The score screen (owner, 2026-10-11): the piece's music laid out to keep what comes next in view, the bars over it
// (song and Display on top; play, mode, loop, tempo, hands and size at the bottom), the modes that play and judge
// (Watch, Wait for me, Play along, Ladder, Rhythm: practice.ts), loops, the Tempo, Display, songs and info panels,
// the summary, and editing fingering. Its drawing of the music is lent to Memorise (a Borrower) while that is open.

import { $, type App, type Piece, type Screen, type KeyRange } from '../app';
import { isStrip } from '../follow';
import { addFingerings, fingeringsFor, sameNote, setFingering } from '../marks';
import type { KeyEvent } from '../midi';
import { yours } from '../practice';
import type { Command } from '../remote';
import type { StepNotes } from '../follow';
import {
  currentDevice, DEVICE_NAMES, hasPieceOverride, LAYOUT_NAMES, LAYOUTS, makeDefaults, resetPiece, savePieceSetting, settingsFor,
  slotChoices, type BarNumbers, type Layout, type Lines, type Marker, type MarkerFollows, type ScoreSettings, type Spacing, type Theme, type Under, type Hands, type Click, type ClickOn, type Mode, type OnTime, type PianoOut,
} from '../settings';

export const SIZE_MIN = 0.6; // same range as the Display panel's slider
export const SIZE_MAX = 1.8;

/** The modes that judge your playing against the score as it goes by. */
export const judged = (mode: Mode) => mode === 'along' || mode === 'ladder' || mode === 'rhythm';
/** The hands the piano plays: in Watch the bar's choice; in Wait and Play along the ones you are not playing. */
export function pianoHands(s: ScoreSettings): 'both' | 'right' | 'left' | null {
  if (s.mode === 'watch') return s.hands === 'off' ? null : s.hands;
  return s.hands === 'left' ? 'right' : s.hands === 'right' ? 'left' : null;
}

/**
 * A screen drawn with the score's drawing of the piece and nothing else of the score screen (Memorise): it says how
 * the music is laid out and played, and takes the drawing's events while it is open.
 */
export interface Borrower {
  /** What to draw, play and judge with. */
  settings(): ScoreSettings;
  /** A phone on its side: the share of the biggest size at which the one line fills the height. */
  fit: number;
  /** Before the music is laid out (its panel's height decides the room). */
  beforeShow(): void;
  /** Laid out (again): carry on or show the start. */
  afterShow(): void;
  /** Laid out again mid-way: keep the marker where it is. */
  readonly keepPosition: boolean;
  /** The music reached the end of what was played. */
  loopEnded(): void;
  /** Keys still to come in the strip under the music (it may hide them). */
  stepNotes(notes: StepNotes): StepNotes;
  /** A key, before the judge sees it; and a key while nothing is playing (it may start something). */
  keySeen(e: KeyEvent): void;
  keyToStart(e: KeyEvent): void;
  /** A tap on the music (dx, dy: how far the finger moved). */
  tap(e: PointerEvent, dx: number, dy: number): void;
  /** No key for a while: these keys are wanted next (the hint). */
  hint(keys: number[]): void;
  /** Stop what it runs. */
  stop(): void;
  readonly busy: boolean;
}

export type ScoreScreen = Screen & {
  /** Lays the song out again; keep: stay where the marker is. */
  draw(keep?: boolean): Promise<void>;
  openSong(id: string): Promise<void>;
  /** Memorise (or another) takes the drawing; null: back to the score. */
  lend(b: Borrower | null): void;
  /** Stops whatever runs (the score's own, or the borrower's). */
  stopAll(): void;
  /** A run that paused by itself is over (another screen opened). */
  forgetRun(): void;
  fillBars(): void;
  showBars(): void;
  /** Edit fingering: on, with fingering shown. */
  editFingering(): void;
  /** The Tempo panel, at the metronome. */
  openMetronome(): void;
  /** The light or dark theme (app-wide) applied. */
  applyTheme(): void;
  /** A tap on the music happened here and now (its click is not passed on to what appears under the finger). */
  readonly lastTap: { x: number; y: number; t: number };
};

export function createScoreScreen(app: App): ScoreScreen {
  const { view, strip, sound, midi, practice, score } = app;
  const showMessage = (text: string, info = false, action?: { label: string; run: () => void }) => app.showMessage(text, info, action);
  const currentPiece = () => app.currentPiece();
  const settingsDialog = $<HTMLDialogElement>('settings');
  const songsDialog = $<HTMLDialogElement>('songs');
  const infoDialog = $<HTMLDialogElement>('info');
  const tempoDialog = $<HTMLDialogElement>('tempo');
  const summaryDialog = $<HTMLDialogElement>('summary');
  let borrower: Borrower | null = null;
  app.playSettings = () => (borrower ? borrower.settings() : settingsFor(currentPiece().id));
  // Under the music: the notes now and next (a borrower may hide them: Memorise's covered bars).
  view.onStep = (notes) => strip.show(borrower ? borrower.stepNotes(notes) : notes);

  /** Light, dark, or as the phone is (app-wide): the stylesheet reads data-theme on the page. */
  function applyTheme(): void {
    const theme = settingsFor('').theme; // app-wide: the same for every song
    if (theme === 'system') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
  }
  /** "bar 3" or "bars 3–6". */
  const barsLabel = (a: number, b: number) => (a === b ? `bar ${a}` : `bars ${a}–${b}`);

  /** Lays the song out again; keep = stay where the marker is (a setting changed), otherwise start at the top. */
  let drawRequest = 0;
  async function draw(keep = false): Promise<void> {
    const request = ++drawRequest; // a newer draw (another song picked while this one downloads) wins
    const piece = currentPiece();
    showMessage('');
    fillBars();
    try {
      const xml = await app.xmlFor(piece);
      if (request !== drawRequest) return;
      const s = borrower ? borrower.settings() : scoreSettings(piece.id);
      // Upright and on a tablet the music starts below the top bar, so pausing (the bars back) covers none of it
      // (owner, 2026-10-12); sideways it has the whole height and the bars float over it.
      document.body.style.setProperty('--score-top', currentDevice() === 'phone-sideways' ? '0px' : `${bars[0].offsetHeight}px`);
      document.body.style.setProperty('--bottom-bar-h', `${bars[1].offsetHeight}px`);
      // Laid out again mid-Memorise (turned, resized, its size or keys changed): it carries on where it was (owner, 2026-10-12).
      const at = keep || borrower?.keepPosition ? view.position : undefined;
      warnAboutHands(piece, xml);
      // The strip takes its height at the bottom first, so the slots are laid out in the room left above it.
      document.body.style.setProperty('--under-h', `${strip.setMode(s.under)}px`);
      borrower?.beforeShow(); // the borrower's panel height too
      await view.show(addFingerings(xml, fingeringsFor(piece.id)), s, at, () => strip.setSong(view.songPitches));
      if (request !== drawRequest) return;
      if (currentDevice() === 'phone-sideways') {
        // One line as tall as the room allows (never above the biggest size): drawn again once at the size that fits
        // (Memorise, and the score's own size, where 100% is that fit: owner, 2026-10-12).
        const was = borrower ? borrower.fit : sideFit;
        const fit = Math.min(1, was * (score.clientHeight / Math.max(1, view.drawnHeight)));
        if (Math.abs(fit - was) > 0.02) {
          if (borrower) borrower.fit = fit; else sideFit = fit;
          await view.show(addFingerings(xml, fingeringsFor(piece.id)), borrower ? borrower.settings() : scoreSettings(piece.id), view.position, () => strip.setSong(view.songPitches));
        }
      }
      borrower?.afterShow();
    } catch (cause) {
      showMessage(`Could not load ${piece.title}: ${cause instanceof Error ? cause.message : String(cause)}`);
    }
    fillBars(); // the tempo shown comes from the song
  }

  /** The app takes the top staff as the right hand and the rest as the left (solo piano): said once if a file has other parts. */
  const warned = new Set<string>();
  function warnAboutHands(piece: Piece, xml: string): void {
    if (warned.has(piece.id)) return;
    warned.add(piece.id);
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const parts = doc.querySelectorAll('part-list > score-part').length;
    const staves = Math.max(1, ...[...doc.querySelectorAll('attributes > staves')].map((e) => Number(e.textContent) || 1));
    if (parts > 1 || staves > 2) showMessage(`${piece.title} has ${parts > 1 ? `${parts} parts` : `${staves} staves`}: the app takes the top staff as the right hand and the rest as the left, which may be wrong here.`, true);
  }

  /**
   * What the score is drawn with: its settings, except that on a phone held sideways the size is a share of the size
   * at which the one line fills the height (100% = it fills it; owner, 2026-10-12).
   */
  let sideFit = 1;
  function scoreSettings(pieceId: string): ScoreSettings {
    const s = settingsFor(pieceId);
    return currentDevice() === 'phone-sideways' ? { ...s, size: SIZE_MAX * Math.min(1, s.size) * sideFit } : s;
  }

  async function openSong(id: string): Promise<void> {
    forgetRun();
    sideFit = 1;
    app.currentId = id;
    const url = new URL(location.href);
    url.searchParams.set('piece', id);
    history.replaceState(null, '', url);
    picking = 0;
    view.setLoop(null);
    showBars();
    await draw();
  }

  // Bars: the song's name on top; the playing controls and the notation size at the bottom (the rest of the
  // song's look is in Display; size is here too so the music can be seen changing).

  function fillBars(): void {
    const piece = currentPiece();
    if (!piece) return;
    const s = settingsFor(piece.id);
    $('song-title').textContent = piece.title;
    $('song-composer').textContent = piece.composer;
    $('q-bpm').textContent = String(Math.round(view.baseBpm * s.speed));
    const running = view.playing || practice.active || !!borrower?.busy;
    app.stayAwake();
    // Blind: the music hides while you play (Display → Show → Music while playing off) and comes back on stopping.
    // Not for a borrower: Memorise's covers do that bar by bar, and it has to show the bars it lets you hear.
    score.classList.toggle('blind', running && !borrower && !s.musicWhilePlaying);
    $('play').textContent = running ? '⏸' : '▶';
    $('play').setAttribute('aria-label', running ? 'Stop' : 'Play');
    $<HTMLSelectElement>('q-mode').value = s.mode;
    const [lo, hi] = sizeRange(), size = Math.min(hi, s.size);
    $<HTMLOutputElement>('q-size').value = `${Math.round(size * 100)}%`;
    $<HTMLButtonElement>('q-smaller').disabled = size <= lo + 1e-9;
    $<HTMLButtonElement>('q-larger').disabled = size >= hi - 1e-9;
    const loop = view.looped;
    const [la, lb] = loop ? [view.barNumber(loop.a), view.barNumber(loop.b)] : [0, 0];
    $('q-loop').textContent = picking ? 'Cancel' : loop ? `Loop ${la === lb ? la : `${la}–${lb}`}` : 'Loop';
    $('q-loop').setAttribute('aria-pressed', String(!!loop));
    $('q-hands').setAttribute('aria-label', s.mode === 'watch' ? 'Hands the piano plays' : 'Hands you play');
    for (const b of document.querySelectorAll<HTMLButtonElement>('#q-hands button')) b.setAttribute('aria-pressed', String(b.dataset.hands === s.hands));
  }

  function change<K extends keyof ScoreSettings>(key: K, value: ScoreSettings[K]): void {
    savePieceSetting(currentPiece().id, key, value);
    fillPanel();
    void draw(true);
  }

  $('q-smaller').addEventListener('click', () => stepSize(-0.1));
  $('q-larger').addEventListener('click', () => stepSize(0.1));
  function stepSize(delta: number): void {
    const size = settingsFor(currentPiece().id).size, [lo, hi] = sizeRange();
    change('size', Math.round(Math.min(hi, Math.max(lo, size + delta)) * 100) / 100);
  }
  /** The size's range: sideways a share of filling the height (half of it to all of it), otherwise 60% to 180%. */
  const sizeRange = (): [number, number] => (currentDevice() === 'phone-sideways' ? [0.5, 1] : [SIZE_MIN, SIZE_MAX]);

  function makeCurrentDefault(): void {
    makeDefaults(currentPiece().id);
    fillPanel();
    fillBars();
  }

  // Showing and hiding: both bars show when a song opens and on a tap on the music; a tap hides them
  // again, and they also fade on their own after a few seconds idle. They stay while a panel is open
  // or one of their controls has focus.

  const bars = [$('top-bar'), $('bottom-bar')];
  const IDLE_MS = 5000; // the owner asked for a couple of seconds longer than the first 3
  let fadeTimer = 0;
  // Only a focused drop-down counts as in use: a tapped button keeps focus, and would otherwise hold the bars up for good.
  const barHasFocus = () => document.activeElement instanceof HTMLSelectElement && bars.some((b) => b.contains(document.activeElement));

  function hideBars(): void {
    clearTimeout(fadeTimer);
    for (const b of bars) b.classList.add('faded');
  }

  function showBars(): void {
    for (const b of bars) b.classList.remove('faded');
    clearTimeout(fadeTimer);
    fadeTimer = window.setTimeout(() => (app.dialogOpen() || barHasFocus() ? showBars() : hideBars()), IDLE_MS);
  }

  for (const b of bars) {
    b.addEventListener('pointerdown', showBars);
    b.addEventListener('focusin', showBars);
    b.addEventListener('change', showBars);
  }
  for (const d of document.querySelectorAll('dialog')) d.addEventListener('close', () => { if (!marking && !borrower) showBars(); });

  // Playing: the bars go while the music plays; a tap on the music pauses and brings them back (owner, 2026-10-11).
  // With the piano or the metronome on, the sound's clock drives the marker so the two stay together.
  let starting = false;
  /**
   * Starts playing from the marker. fromKey: begun by playing your first note (no count-in; that key counts as
   * played on its note). After a pause by itself, the same run carries on.
   */
  async function play(fromKey?: number): Promise<void> {
    if (starting) return;
    if (marking) setMarking(false);
    const s = settingsFor(currentPiece().id);
    if (s.mode === 'ladder' && !view.looped) { startPicking('Ladder: tap the first bar to practise'); return; }
    starting = true;
    if (app.messageIsNews) showMessage(''); // "Paused… play to carry on" and the like are done with
    // Begun from a key: it counts as your first note only where you have notes at the marker (in Rhythm: a beat to tap there).
    const startKeyCounts = fromKey !== undefined && view.struckAt(view.index, yours(s)).length > 0;
    $('play').textContent = '…'; // the piano loads on the first play; MIDI may ask to be allowed
    try {
      if (s.mode !== 'watch' || s.pianoOut === 'keyboard') await midi.start();
      // The piano part goes to the keyboard when chosen and one is connected that can play; otherwise the phone.
      sound.keyboard = s.pianoOut === 'keyboard' && midi.canPlay ? midi : null;
      if (s.pianoOut === 'keyboard' && !sound.keyboard) showMessage('No MIDI keyboard to play through: the piano plays on the phone.');
      // The phone's piano samples load only when the phone plays piano notes (not for the metronome alone).
      if (pianoHands(s) || s.metronome || view.looped) await sound.prepare(!!pianoHands(s) && !sound.keyboard);
    } catch (cause) {
      showMessage(cause instanceof Error ? cause.message : String(cause));
      starting = false;
      fillBars();
      if (s.mode !== 'watch') return; // no keyboard: nothing to wait for or score
    }
    starting = false;
    sound.setVolumes(s.pianoVolume, s.clickVolume);
    sound.setClick(s.click);
    hideBars();
    pass = 0;
    const loop = view.looped, continuing = resumable;
    resumable = false;
    if (s.mode === 'wait') {
      view.songClock = null;
      if (loop && (view.index < loop.a || view.index > loop.b)) view.goTo(loop.a);
      practice.startWait();
    } else if (loop) {
      startLoopPass(fromKey !== undefined || continuing, continuing, fromKey !== undefined);
    } else {
      startSound(view.currentT, fromKey !== undefined);
      view.play();
      if (judged(s.mode)) practice.startAlong(continuing);
    }
    if (startKeyCounts && judged(s.mode)) practice.startedBy(fromKey!);
    fillBars();
  }

  // Starting with a key (owner, 2026-10-11): while paused, playing your first note starts the song from the
  // marker (any key, if none of your notes are there, and always in Rhythm); in Wait for me any key starts it.
  let resumable = false; // paused by itself: the next start carries on the same run
  /** Another song, mode, loop or screen: a run that paused by itself is over. */
  function forgetRun(): void { resumable = false; practice.forgetRun(); }
  let mashedAt = -Infinity;
  const SETTLE_MS = 1000; // after a pause for mashing, keys still landing from the same burst do not start it again
  async function startFromKey(e: KeyEvent): Promise<void> {
    if (view.playing || practice.active || starting || marking || picking || app.dialogOpen()) return;
    if (e.time - mashedAt < SETTLE_MS) return;
    if (borrower) { borrower.keyToStart(e); return; }
    const s = settingsFor(currentPiece().id);
    if (s.mode === 'watch' || (s.mode === 'ladder' && !view.looped)) return;
    if (s.mode === 'wait') {
      practice.pressedBefore(e.midi); // that key counts for the first notes, held or not
      await play();
      return;
    }
    const mine = view.struckAt(view.index, yours(s));
    if (s.mode !== 'rhythm' && mine.length && !mine.includes(e.midi)) return; // not your note: wait for it
    await play(e.midi);
  }
  practice.onAutoPause = (reason, step) => {
    if (reason === 'mash') mashedAt = performance.now();
    pauseRun(step, reason === 'silence' ? 'Paused: no keys for a few seconds. Play to carry on.' : 'Paused: lots of keys at once. Play to carry on.');
  };
  /** Paused by itself (silence, mashing, the phone turned): the run is kept, and the next start carries it on. */
  function pauseRun(step: number, text: string): void {
    practice.suspend();
    view.pause();
    view.goTo(step);
    resumable = true;
    pausedMessage(text);
  }
  // Or stop here and see how it went (owner, 2026-10-12).
  const pausedMessage = (text: string) => showMessage(text, true, { label: 'See how it went', run: () => { resumable = false; showMessage(''); practice.finishRun(); fillBars(); showBars(); } });
  /** (Re)starts the sound at song time t with the current choices; the marker then follows its clock. now: begun by a key just played. */
  function startSound(t: number, now = false): void {
    const s = settingsFor(currentPiece().id);
    const piano = pianoHands(s);
    sound.setVolumes(s.pianoVolume, s.clickVolume);
    sound.setClick(s.click);
    if (!piano && !s.metronome) { sound.stop(); view.songClock = null; return; }
    sound.play(piano ? view.noteEvents(piano) : [], s.metronome ? view.beats(s.clickOn) : [], t, s.speed, false, now);
    view.songClock = () => sound.songTime();
  }
  // Loop and Ladder (owner, 2026-10-11): the Loop button, then a tap on the first and the last bar. Each pass
  // starts with a bar of clicks. Play along and Ladder say after each pass how it went; Ladder then moves the
  // tempo up a step after a clean pass (every note on time, nothing wrong; never past the song's own tempo)
  // and down a step after a messy one. Wait for me goes round the loop with no clicks (it keeps no tempo).
  let picking: 0 | 1 | 2 = 0;
  let pickFrom = -1;
  let pass = 0;
  const SPEED_MIN = 0.25; // the Tempo panel's slider goes down to 25%
  function startPicking(text: string): void {
    if (view.playing || practice.active) stopAll();
    picking = 1;
    showMessage(text, true);
    hideBars();
    fillBars();
  }
  function pickBar(x: number, y: number): void {
    const step = view.hit(x, y);
    if (step < 0) { showMessage('Tap on the notes of a bar', true); return; }
    if (picking === 1) {
      pickFrom = step;
      picking = 2;
      view.setLoop(view.loopRange(step, step));
      showMessage(`From bar ${view.barNumber(step)}: now tap the last bar (or the same one again)`, true);
      return;
    }
    picking = 0;
    const range = view.loopRange(pickFrom, step);
    view.setLoop(range);
    if (view.index < range.a || view.index > range.b) view.goTo(range.a);
    showMessage(`Looping ${barsLabel(view.barNumber(range.a), view.barNumber(range.b))}: press ▶`, true);
    fillBars();
    showBars();
  }
  $('q-loop').addEventListener('click', () => {
    forgetRun();
    if (picking) { picking = 0; view.setLoop(null); showMessage(''); fillBars(); return; }
    if (view.looped) { if (view.playing || practice.active) stopAll(); view.setLoop(null); showMessage(''); fillBars(); return; }
    startPicking('Loop: tap the first bar');
  });
  practice.loop = () => {
    const span = view.loopSpan();
    return span && { a: span.a, b: span.b, t1: span.t1 };
  };
  /** One pass round the loop: a bar of clicks, then its bars, with the piano and metronome as chosen. */
  function startLoopPass(fromMarker = false, continuing = false, now = false): void {
    const s = settingsFor(currentPiece().id);
    const span = view.loopSpan();
    if (!span) return;
    const piano = pianoHands(s);
    // Begun from a key (or carrying on after a pause): from the marker, with no count-in.
    if (!fromMarker || view.index < span.a || view.index > span.b) view.goTo(span.a);
    const from = fromMarker ? view.currentT : span.t0;
    sound.setVolumes(s.pianoVolume, s.clickVolume);
    sound.setClick(s.click);
    const clicks = s.metronome ? view.beats(s.clickOn).filter((b) => b.t >= from - 1 && b.t < span.t1) : [];
    sound.play(piano ? view.notesBetween(piano, from, span.t1) : [], [...(fromMarker ? [] : span.countIn), ...clicks], fromMarker ? from : span.from, s.speed, false, now);
    view.songClock = () => sound.songTime();
    view.play(-1, span.t1);
    if (judged(s.mode)) practice.startAlong(continuing);
  }
  view.onLoopEnd = () => {
    if (borrower) { borrower.loopEnded(); return; }
    const s = settingsFor(currentPiece().id);
    if (s.mode === 'wait') { practice.loopBack(); return; }
    if (judged(s.mode)) {
      const r = practice.passResult();
      pass++;
      const clean = r.total > 0 && r.onTime === r.total && r.wrong === 0;
      let line = `Pass ${pass}: ${r.onTime}/${r.total} on time${r.wrong ? `, ${r.wrong} ${r.rhythm ? 'extra' : 'wrong'}` : ''}`;
      if (s.mode === 'ladder') {
        const next = clean ? (s.speed < 1 ? Math.min(1, s.speed + s.ladderStep) : s.speed) : Math.max(SPEED_MIN, s.speed - s.ladderStep);
        const rounded = Math.round(next * 100) / 100;
        if (rounded !== s.speed) setSpeed(rounded);
        const bpm = Math.round(view.baseBpm * rounded);
        line += clean
          ? rounded > s.speed ? ` — clean, up to ${bpm} bpm` : ` — clean, at ${bpm} bpm`
          : rounded < s.speed ? ` — down to ${bpm} bpm` : ` — staying at ${bpm} bpm`;
      }
      showMessage(line, true);
    }
    startLoopPass();
  };

  /** Stops whatever is running: playing, waiting for your keys, or playing along (which then shows the summary). */
  function stopAll(): void {
    if (borrower) { borrower.stop(); return; }
    if (view.playing) view.pause();
    else { sound.stop(); practice.stop(!view.looped); fillBars(); showBars(); }
  }
  view.onStop = () => {
    sound.stop();
    if (borrower) return; // a borrower stops the music itself (memorise.ts); nothing here stops it
    practice.stop(!view.looped);
    fillBars();
    showBars();
  };
  practice.onHint = (keys) => {
    strip.markKeys('now-r', keys);
    borrower?.hint(keys);
  };

  $('play').addEventListener('click', () => (view.playing || practice.active ? stopAll() : void play()));

  // Mode: Watch / Wait for me / Play along, saved per song (owner, 2026-10-11).
  $<HTMLSelectElement>('q-mode').addEventListener('change', (e) => {
    if (view.playing || practice.active) stopAll();
    forgetRun();
    savePieceSetting(currentPiece().id, 'mode', (e.target as HTMLSelectElement).value as Mode);
    fillBars();
    if (settingsFor(currentPiece().id).mode === 'ladder' && !view.looped) startPicking('Ladder: tap the first bar to practise');
  });

  // The keys under the music play, and count as your playing, where timing isn't tight: Memorise and Wait for me
  // (owner, 2026-10-12); in the timed modes they only show. They sound on the phone and join the MIDI keys held,
  // going the way every key goes (main.ts: the keyboard remote first, then the screen showing).
  const touchKeys = new Map<number, { midi: number; stop: Promise<() => void> }>();
  const touchPlays = () => !!borrower || settingsFor(currentPiece().id).mode === 'wait';
  $('keyboard').addEventListener('pointerdown', (e) => {
    const key = (e.target as HTMLElement).closest<HTMLElement>('[data-midi]');
    if (!key || !touchPlays()) return;
    e.preventDefault();
    const m = Number(key.dataset.midi), id = e.pointerId;
    touchKeys.set(id, { midi: m, stop: sound.noteNow(m, 90, () => touchKeys.get(id)?.midi === m) });
    midi.down.add(m);
    midi.onKey({ midi: m, on: true, velocity: 90, time: performance.now() });
  });
  const liftKey = (e: PointerEvent) => {
    const t = touchKeys.get(e.pointerId);
    if (!t) return;
    touchKeys.delete(e.pointerId);
    void t.stop.then((stop) => stop());
    if ([...touchKeys.values()].some((x) => x.midi === t.midi)) return;
    midi.down.delete(t.midi);
    midi.onKey({ midi: t.midi, on: false, velocity: 0, time: performance.now() });
  };
  for (const ev of ['pointerup', 'pointercancel'] as const) $('keyboard').addEventListener(ev, liftKey);
  $('keyboard').addEventListener('contextmenu', (e) => e.preventDefault());

  practice.onDone = () => { fillBars(); showBars(); };
  practice.onSummary = (r) => {
    if (!r.total) return;
    const pct = (n: number) => `${Math.round((n / r.total) * 100)}%`;
    $('summary-body').textContent = r.rhythm
      ? `${r.total} beats to tap: ${r.onTime} on time (${pct(r.onTime)}, within ±${r.tolerance} ms), ${r.early} early, ${r.late} late, ` +
        `${r.missed} missed. ${r.wrong} extra tap${r.wrong === 1 ? '' : 's'}.`
      : `${r.total} notes: ${r.onTime} on time (${pct(r.onTime)}, within ±${r.tolerance} ms), ${r.early} early, ${r.late} late, ` +
        `${r.missed} missed. ${r.wrong} key${r.wrong === 1 ? '' : 's'} the score did not ask for.`;
    // The weakest stretches, each a button that loops it (the summary's "loop the weak bars").
    $('summary-weak').replaceChildren(...r.weak.map((w) => {
      const b = document.createElement('button');
      b.type = 'button';
      const label = barsLabel(view.barNumber(w.a), view.barNumber(w.b));
      b.textContent = `Loop ${label} (${w.count} off)`;
      b.addEventListener('click', () => {
        summaryDialog.close();
        view.setLoop({ a: w.a, b: w.b });
        view.goTo(w.a);
        showMessage(`Looping ${label}: press ▶`, true);
        fillBars();
      });
      return b;
    }));
    summaryDialog.showModal();
  };

  // Hands: L | R | Both | Off in the bottom bar, saved per song; a change while playing is heard at once.
  for (const b of document.querySelectorAll<HTMLButtonElement>('#q-hands button')) {
    b.addEventListener('click', () => {
      savePieceSetting(currentPiece().id, 'hands', b.dataset.hands as Hands);
      fillBars();
      if (view.playing && sound.playing && !practice.active) startSound(sound.songTime());
    });
  }

  // Taps and swipes on the music. Playing: a tap pauses. Paused: a long press on a note moves the marker there
  // and stays paused (owner, 2026-10-11); a tap shows or hides the bars; a swipe up or down pages through the
  // slots (the one-line layouts scroll sideways by themselves).
  const SWIPE = 40; // px of travel that makes a swipe rather than a tap
  const LONG_PRESS_MS = 500; // about the phone's own long-press time (Android: 400-500 ms)
  let down: { x: number; y: number } | null = null;
  let pressTimer = 0;
  let pressed = false; // the long press happened: the finger lifting does nothing more
  const lastTap = { x: 0, y: 0, t: -Infinity };
  score.addEventListener('pointerdown', (e) => {
    down = { x: e.clientX, y: e.clientY };
    pressed = false;
    clearTimeout(pressTimer);
    if (view.playing || practice.active || marking || picking || borrower) return; // Memorise works by bar: no long press
    pressTimer = window.setTimeout(() => {
      if (!down) return;
      const step = view.hit(down.x, down.y);
      if (step >= 0) { pressed = true; view.goTo(step); }
    }, LONG_PRESS_MS);
  });
  score.addEventListener('pointermove', (e) => {
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > SWIPE / 4) clearTimeout(pressTimer); // moving: not a press
  });
  score.addEventListener('pointercancel', () => { down = null; clearTimeout(pressTimer); });
  score.addEventListener('contextmenu', (e) => e.preventDefault()); // a long press must not open the browser's menu
  score.addEventListener('pointerup', (e) => {
    clearTimeout(pressTimer);
    if (!down) return;
    Object.assign(lastTap, { x: e.clientX, y: e.clientY, t: performance.now() });
    const dx = e.clientX - down.x, dy = e.clientY - down.y;
    down = null;
    if (pressed) return;
    if (borrower) { borrower.tap(e, dx, dy); return; }
    if (marking) { pickNote(e.clientX, e.clientY); return; }
    if (picking && Math.abs(dx) < SWIPE / 4 && Math.abs(dy) < SWIPE / 4) { pickBar(e.clientX, e.clientY); return; }
    if (view.playing || practice.active) { stopAll(); return; }
    if (Math.abs(dy) > SWIPE && Math.abs(dy) > Math.abs(dx)) { view.browse(dy < 0 ? 1 : -1); return; }
    if (Math.abs(dx) > SWIPE / 4 || Math.abs(dy) > SWIPE / 4) return; // a drag: the one-line layouts scroll
    if (bars[0].classList.contains('faded')) showBars();
    else hideBars();
  });

  // Fingering (⋯ → Edit fingering): tap a note, then a finger.
  let marking = false;
  let picked: { m: number; rel: number; midi: number; staff: number; label: string } | null = null;
  function setMarking(on: boolean): void {
    marking = on;
    picked = null;
    $('marks-bar').hidden = !on;
    $('marks-note').textContent = 'Tap a note, then a finger';
    if (on) { if (view.playing || practice.active) stopAll(); hideBars(); } else showBars();
  }
  function pickNote(x: number, y: number): void {
    picked = view.hitNote(x, y);
    const current = picked && fingeringsFor(currentPiece().id).find((f) => sameNote(f, picked!));
    $('marks-note').textContent = picked ? `${picked.label}${current ? ` (now ${current.finger})` : ''}` : 'No note there: tap closer to a note';
  }
  for (const b of document.querySelectorAll<HTMLButtonElement>('#finger-pick button')) {
    b.addEventListener('click', () => {
      if (!picked) return;
      setFingering(currentPiece().id, picked, Number(b.dataset.finger));
      $('marks-note').textContent = `${picked.label}: ${b.dataset.finger === '0' ? 'removed' : `finger ${b.dataset.finger}`}`;
      picked = null;
      void draw(true); // the score is drawn again with it
    });
  }
  $('marks-done').addEventListener('click', () => setMarking(false));

  // Tempo: a slider for the speed, or the beats per minute typed exactly (owner, 2026-10-11).
  function fillTempo(): void {
    const s = settingsFor(currentPiece().id);
    $<HTMLInputElement>('t-speed').value = String(Math.round(s.speed * 100));
    $<HTMLOutputElement>('t-speed-out').value = `${Math.round(s.speed * 100)}%`;
    $<HTMLInputElement>('t-bpm').value = String(Math.round(view.baseBpm * s.speed));
    $('t-note').textContent = `The song's own tempo: ♩ = ${Math.round(view.baseBpm)}.`;
    $<HTMLInputElement>('t-piano-vol').value = String(Math.round(s.pianoVolume * 100));
    $<HTMLInputElement>('t-click-vol').value = String(Math.round(s.clickVolume * 100));
    $<HTMLInputElement>('t-metronome').checked = s.metronome;
    for (const r of tempoDialog.querySelectorAll<HTMLInputElement>('input[name="click"]')) r.checked = r.value === s.click;
    for (const r of tempoDialog.querySelectorAll<HTMLInputElement>('input[name="clickOn"]')) r.checked = r.value === s.clickOn;
    for (const r of tempoDialog.querySelectorAll<HTMLInputElement>('input[name="onTime"]')) r.checked = r.value === s.onTime;
    for (const r of tempoDialog.querySelectorAll<HTMLInputElement>('input[name="pianoOut"]')) r.checked = r.value === s.pianoOut;
    for (const r of tempoDialog.querySelectorAll<HTMLInputElement>('input[name="ladderStep"]')) r.checked = Math.abs(Number(r.value) - s.ladderStep) < 1e-9;
    // Each mode shows only its own settings (owner, 2026-10-12).
    $('t-ladder').hidden = s.mode !== 'ladder';
    $('t-ontime').hidden = !judged(s.mode);
  }
  function setSpeed(speed: number): void {
    if (!(speed > 0)) { fillTempo(); return; } // nothing sensible typed: the field shows the tempo again
    const slider = $<HTMLInputElement>('t-speed');
    speed = Math.min(Number(slider.max) / 100, Math.max(Number(slider.min) / 100, speed)); // within the slider's range
    savePieceSetting(currentPiece().id, 'speed', speed);
    view.setSpeed(speed);
    sound.setSpeed(speed);
    fillTempo();
    fillBars();
  }
  // Sound choices in the panel: saved per song; volumes and the click sound apply at once, the metronome
  // switch at the next play (or straight away if playing).
  function soundChange<K extends 'metronome' | 'click' | 'clickOn' | 'pianoVolume' | 'clickVolume'>(key: K, value: ScoreSettings[K]): void {
    savePieceSetting(currentPiece().id, key, value);
    const s = settingsFor(currentPiece().id);
    sound.setVolumes(s.pianoVolume, s.clickVolume);
    sound.setClick(s.click);
    if ((key === 'metronome' || key === 'clickOn') && view.playing && sound.playing) startSound(sound.songTime());
  }
  $<HTMLInputElement>('t-piano-vol').addEventListener('input', (e) => soundChange('pianoVolume', Number((e.target as HTMLInputElement).value) / 100));
  $<HTMLInputElement>('t-click-vol').addEventListener('input', (e) => soundChange('clickVolume', Number((e.target as HTMLInputElement).value) / 100));
  $<HTMLInputElement>('t-metronome').addEventListener('change', (e) => soundChange('metronome', (e.target as HTMLInputElement).checked));
  for (const r of tempoDialog.querySelectorAll<HTMLInputElement>('input[name="click"]')) r.addEventListener('change', () => soundChange('click', r.value as Click));
  for (const r of tempoDialog.querySelectorAll<HTMLInputElement>('input[name="clickOn"]')) r.addEventListener('change', () => soundChange('clickOn', r.value as ClickOn));
  for (const r of tempoDialog.querySelectorAll<HTMLInputElement>('input[name="onTime"]')) r.addEventListener('change', () => savePieceSetting(currentPiece().id, 'onTime', r.value as OnTime));
  for (const r of tempoDialog.querySelectorAll<HTMLInputElement>('input[name="ladderStep"]')) r.addEventListener('change', () => savePieceSetting(currentPiece().id, 'ladderStep', Number(r.value)));
  // Where the piano plays: applies from the next ▶.
  for (const r of tempoDialog.querySelectorAll<HTMLInputElement>('input[name="pianoOut"]')) r.addEventListener('change', () => savePieceSetting(currentPiece().id, 'pianoOut', r.value as PianoOut));
  // −5 / +5 beats per minute, and tap tempo: the speed that matches the last few taps (old app's controls).
  const bpmNow = () => view.baseBpm * settingsFor(currentPiece().id).speed;
  $('t-down').addEventListener('click', () => setSpeed(Math.max(5, Math.round(bpmNow()) - 5) / view.baseBpm));
  $('t-up').addEventListener('click', () => setSpeed((Math.round(bpmNow()) + 5) / view.baseBpm));
  let taps: number[] = [];
  $('t-tap').addEventListener('click', () => {
    const now = performance.now();
    taps = [...taps.filter((t) => now - t < 3000), now].slice(-5); // taps more than 3 s ago start a new count
    if (taps.length < 2) return;
    const beatMs = (taps[taps.length - 1] - taps[0]) / (taps.length - 1);
    setSpeed(60000 / beatMs / view.baseBpm);
  });
  $('open-tempo').addEventListener('click', () => { fillTempo(); tempoDialog.showModal(); });
  $<HTMLInputElement>('t-speed').addEventListener('input', (e) => setSpeed(Number((e.target as HTMLInputElement).value) / 100));
  $<HTMLInputElement>('t-bpm').addEventListener('change', (e) => setSpeed(Number((e.target as HTMLInputElement).value) / view.baseBpm));
  $('t-reset').addEventListener('click', () => setSpeed(1));

  // Resizing and rotating: a change of device type (phone turned sideways) brings that device's settings;
  // otherwise the slots are laid out again for the new size. Either way the marker stays where it was.
  let lastDevice = currentDevice();
  let lastSize = '';
  let resizeTimer = 0;
  function resized(): void {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const size = `${score.clientWidth}x${score.clientHeight}`;
      if (currentDevice() === lastDevice && size === lastSize) return;
      lastDevice = currentDevice();
      lastSize = size;
      // Playing when the phone turns: it pauses where it was (the run kept: play to carry on) rather than ending it.
      const turned = 'Paused while the music was laid out again. Play to carry on.';
      const along = view.playing && !borrower && practice.active && judged(settingsFor(currentPiece().id).mode);
      if (along) pauseRun(view.index, turned);
      else if (view.playing && !borrower) view.pause();
      void draw(true).then(() => { if (along && resumable) pausedMessage(turned); }); // (drawing clears messages)
    }, 150);
  }

  // Panels: songs, info, display.

  function fillSongs(): void {
    const list = $<HTMLUListElement>('song-list');
    list.replaceChildren(...app.pieces.map((p) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = p.id === app.currentId ? 'current' : '';
      button.innerHTML = `<strong></strong><small></small>`;
      button.querySelector('strong')!.textContent = p.title;
      button.querySelector('small')!.textContent = p.composer;
      button.addEventListener('click', () => { songsDialog.close(); void openSong(p.id); });
      item.append(button);
      return item;
    }));
  }

  function fillInfo(): void {
    const piece = currentPiece();
    $('info-title').textContent = piece.title;
    const body = $('info-body');
    body.replaceChildren(
      `${piece.composer}. From ${piece.source.dataset} (“${piece.source.uploadTitle}”), licence `,
      Object.assign(document.createElement('a'), { href: piece.licenseUrl, target: '_blank', rel: 'noopener', textContent: piece.license }),
      `. ${piece.status[0].toUpperCase()}${piece.status.slice(1)}.`,
    );
  }

  function radio(name: string, value: string, text: string): HTMLLabelElement {
    const label = document.createElement('label');
    label.append(Object.assign(document.createElement('input'), { type: 'radio', name, value }), ` ${text}`);
    return label;
  }

  function fillPanel(): void {
    const piece = currentPiece();
    const s = settingsFor(piece.id);
    const device = currentDevice();
    const legendOf = (id: string) => $(id).querySelector('legend')!;
    $('layout-choices').replaceChildren(legendOf('layout-choices'), ...LAYOUTS[device].map((l) => radio('layout', l, LAYOUT_NAMES[l])));
    $('slot-choices').replaceChildren(legendOf('slot-choices'), ...slotChoices(s.layout).map((n) => radio('slots', String(n), String(n))));
    $('slot-choices').hidden = $('lines-choices').hidden = isStrip(s.layout);
    for (const input of settingsDialog.querySelectorAll<HTMLInputElement>('input[name="slots"]')) input.checked = input.value === String(s.slots);
    const [lo, hi] = sizeRange(), size = Math.min(hi, s.size);
    Object.assign($<HTMLInputElement>('s-size'), { min: String(lo), max: String(hi) });
    $<HTMLInputElement>('s-size').value = String(size);
    $<HTMLOutputElement>('s-size-out').value = `${Math.round(size * 100)}%`;
    for (const name of ['spacing', 'layout', 'barNumbers', 'marker', 'markerFollows', 'under', 'theme'] as const) {
      for (const input of settingsDialog.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`)) {
        input.checked = input.value === s[name];
      }
    }
    $<HTMLInputElement>('s-tempoMarks').checked = s.tempoMarks;
    $<HTMLInputElement>('s-musicWhilePlaying').checked = s.musicWhilePlaying;
    $<HTMLInputElement>('s-fingering').checked = s.fingering;
    $<HTMLInputElement>('s-lyrics').checked = s.lyrics;
    for (const input of settingsDialog.querySelectorAll<HTMLInputElement>('input[name="lines"]')) input.checked = input.value === String(s.lines);
    const where = DEVICE_NAMES[device];
    $<HTMLParagraphElement>('override-note').textContent = hasPieceOverride(piece.id)
      ? `${piece.title} has its own settings on a ${where}.`
      : `Using the default settings for a ${where}.`;
  }

  $<HTMLInputElement>('s-size').addEventListener('input', (e) => {
    $<HTMLOutputElement>('s-size-out').value = `${Math.round(Number((e.target as HTMLInputElement).value) * 100)}%`;
  });
  $<HTMLInputElement>('s-size').addEventListener('change', (e) => change('size', Number((e.target as HTMLInputElement).value)));
  settingsDialog.addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement;
    if (input.name === 'spacing') change('spacing', input.value as Spacing);
    else if (input.name === 'layout') change('layout', input.value as Layout);
    else if (input.name === 'slots') change('slots', Number(input.value));
    else if (input.name === 'marker' || input.name === 'markerFollows') {
      savePieceSetting(currentPiece().id, input.name, input.value as Marker & MarkerFollows);
      const s = settingsFor(currentPiece().id);
      view.setMarker(s.marker, s.markerFollows);
      fillPanel();
      fillBars();
    }
    else if (input.name === 'under') change('under', input.value as Under);
    else if (input.name === 'theme') { savePieceSetting(currentPiece().id, 'theme', input.value as Theme); applyTheme(); }
    else if (input.name === 'barNumbers') change('barNumbers', input.value as BarNumbers);
    else if (input.name === 'lines') change('lines', (/^\d+$/.test(input.value) ? Number(input.value) : input.value) as Lines);
    else if (input.id === 's-tempoMarks') change('tempoMarks', input.checked);
    else if (input.id === 's-fingering') change('fingering', input.checked);
    else if (input.id === 's-lyrics') change('lyrics', input.checked);
    else if (input.id === 's-musicWhilePlaying') { savePieceSetting(currentPiece().id, 'musicWhilePlaying', input.checked); fillPanel(); fillBars(); }
  });
  $('make-default').addEventListener('click', makeCurrentDefault);
  $('reset-piece').addEventListener('click', () => { resetPiece(currentPiece().id); fillPanel(); void draw(); });
  $('open-settings').addEventListener('click', () => { fillPanel(); settingsDialog.showModal(); });
  $('open-songs').addEventListener('click', () => { fillSongs(); songsDialog.showModal(); });
  $('open-info').addEventListener('click', () => { fillInfo(); infoDialog.showModal(); });

  // The keyboard remote on the score (remote.ts): a mash pauses or stops; the lowest key goes back to the loop's
  // or the bar's start (already there: the bar before); the highest plays.
  function command(c: Command): void {
    const s = settingsFor(currentPiece().id), running = view.playing || practice.active;
    if (c === 'mash') {
      if (practice.active && judged(s.mode)) practice.onAutoPause('mash', view.index); // as before: paused, carry on from a key
      else if (running) { stopAll(); showMessage('Stopped by a mash', true); }
    } else if (c === 'low') {
      if (running) stopAll();
      const loop = view.looped, bar = view.barOf(view.index), first = view.firstStepOfBar(bar);
      view.goTo(loop ? loop.a : first === view.index && bar > 0 ? view.firstStepOfBar(bar - 1) : first);
    } else if (c === 'high' && !running) void play();
  }

  return {
    key(e: KeyEvent): void {
      borrower?.keySeen(e);
      practice.key(e);
      if (e.on) void startFromKey(e);
    },
    command,
    musicRange(): KeyRange | null {
      const ps = view.songPitches;
      return ps.length ? { lo: Math.min(...ps), hi: Math.max(...ps) } : null;
    },
    resized,
    get busy() { return !borrower && (view.playing || practice.active); },
    draw,
    openSong,
    lend(b: Borrower | null): void {
      if (b) { stopAll(); forgetRun(); if (marking) setMarking(false); picking = 0; }
      borrower = b;
      for (const bar of bars) bar.hidden = !!b;
      if (!b) { view.setBand(0, 0); showBars(); }
    },
    stopAll,
    forgetRun,
    fillBars,
    showBars,
    editFingering(): void {
      // Fingering only shows when Display shows fingering: turn it on for this song if it is off.
      if (!settingsFor(currentPiece().id).fingering) change('fingering', true);
      setMarking(true);
    },
    openMetronome(): void {
      fillTempo();
      tempoDialog.showModal();
      $('t-metronome-set').scrollIntoView({ block: 'start' });
    },
    applyTheme,
    lastTap,
  };
}
