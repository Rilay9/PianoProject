// The score screen (owner, 2026-10-11): the piece's music laid out to keep what comes next in view, the bars over it
// (song and Display on top; play, mode, loop, tempo, hands and size at the bottom), the modes that play and judge
// (Watch, Wait for me, Play along, Ladder, Rhythm: practice.ts), loops, the Tempo, Display, songs and info panels,
// the summary, and editing fingering. Its drawing of the music is lent to Memorise (a Borrower) while that is open.

import { fileOf, load as loadLibrary, midiKey, record } from '../library/store';
import type { BandNote } from '../library/midi/band';
import type { NoteEvent } from '../sound';
import { $, type App, type Piece, type Screen, type KeyRange } from '../app';
import { isStrip } from '../follow';
import { addFingerings, fingeringsFor, sameNote, setFingering } from '../marks';
import { addEntry, keyName, Run, setActivity, type Slip } from '../log';
import type { KeyEvent } from '../midi';
import { yours } from '../practice';
import type { Command } from '../remote';
import type { StepNotes } from '../follow';
import type { ScorePreset } from '../activity';
import {
  clearPreset, currentDevice, DEVICE_NAMES, hasPieceOverride, LAYOUT_NAMES, LAYOUTS, makeDefaults, presetPiece, resetPiece, savePieceSetting, setPreset, settingsFor,
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
  /** A score activity (activity.ts): the piece with its preset playing choices (for the activity only) and bars looped. */
  openActivity(a: { title: string; piece: string; bars?: [number, number]; settings: ScorePreset }): Promise<void>;
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
  const infoDialog = $<HTMLDialogElement>('info');
  const tempoDialog = $<HTMLDialogElement>('tempo');
  const summaryDialog = $<HTMLDialogElement>('summary');
  let borrower: Borrower | null = null;
  app.playSettings = () => (borrower ? borrower.settings() : settingsFor(currentPiece().id));
  // Under the music: the notes now and next (a borrower may hide them: Memorise's covered bars).
  view.onStep = (notes) => {
    trackWait();
    // Upright where touch keys play (Wait for me, Memorise), the keys follow the music two octaves at a time.
    strip.follow(notes.now.flat().map((p) => p.midi), notes.next.flat().map((p) => p.midi));
    strip.show(borrower ? borrower.stepNotes(notes) : notes);
  };

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
    document.body.classList.remove('draw-failed'); // (the bars come back to be measured; a failure hides them again)
    showMessage('');
    fillBars();
    view.title = piece.title;
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
      placeBottomBar();
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
      void loadBand(piece).then(() => { if (request === drawRequest) fillTempo(); });
    } catch (cause) {
      const why = cause instanceof Error ? cause.message : String(cause);
      // (its file could not be read: the music of the piece before is not left under this title, P01)
      if (request === drawRequest) view.fail(`“${piece.title}” could not be opened: ${why}`);
      showMessage(`Could not load ${piece.title}: ${why}`);
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
    endRun();
    startRequest++; // a start still getting ready is dropped
    starting = false;
    if (presetPiece() !== id) { clearPreset(); setActivity(null); } // another song: an activity (its preset, its log tag) is over
    forgetRun();
    sideFit = 1;
    app.currentId = id; // (the address names the piece where it is opened: main.ts, nav.ts)
    picking = 0;
    view.setLoop(null);
    showBars();
    await draw();
  }

  async function openActivity(a: { title: string; piece: string; bars?: [number, number]; settings: ScorePreset }): Promise<void> {
    const { tempo, ...choices } = a.settings;
    setPreset(a.piece, choices); // first, so it is drawn with them
    await openSong(a.piece);
    // The tempo in beats a minute is a share of the song's own (known once it is read).
    if (tempo) { const speed = tempo / view.baseBpm; setPreset(a.piece, { ...choices, speed }); view.setSpeed(speed); }
    if (a.bars) {
      const at = (n: number) => { for (let m = 0; m < view.barCount; m++) { const i = view.firstStepOfBar(m); if (i >= 0 && view.barNumber(i) === n) return i; } return -1; };
      const i = at(a.bars[0]), j = at(a.bars[1]);
      if (i < 0 || j < 0) { fillBars(); showMessage(`${a.title}: this piece has no bar ${i < 0 ? a.bars[0] : a.bars[1]}`); return; }
      const range = view.loopRange(i, j);
      view.setLoop(range);
      view.goTo(range.a);
    }
    fillBars();
    showMessage(a.title, true);
  }

  // Bars: the song's name on top; the playing controls and the notation size at the bottom (the rest of the
  // song's look is in Display; size is here too so the music can be seen changing).

  /** Wait for me with the keys under the music: the bottom bar sits above the keys, not over them, so they can be
   * tapped while it shows (owner, 2026-10-15: taps on the keys landed on the bar; Memorise's panel already does this). */
  function placeBottomBar(): void {
    const piece = currentPiece();
    document.body.classList.toggle('keys-play', !!piece && !borrower && settingsFor(piece.id).mode === 'wait' && !$('keyboard').hidden);
    if (!borrower) strip.refollow(); // (Wait for me chosen: the keys narrow to the music now, not at the first move)
  }

  function fillBars(): void {
    const piece = currentPiece();
    if (!piece) return;
    const s = settingsFor(piece.id);
    placeBottomBar();
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
  // A start waits for MIDI permission and the piano's samples; another song, mode or hands, a stop, or another screen
  // in the meantime drops it (ChatGPT's review, 2026-10-13), rather than starting what is no longer chosen.
  let startRequest = 0;
  const startShape = () => { const s = settingsFor(currentPiece().id); return `${currentPiece().id}|${s.mode}|${s.hands}|${!!borrower}`; };
  async function play(fromKey?: number, fromAt?: number): Promise<void> {
    if (starting) return;
    if (marking) setMarking(false);
    const s = settingsFor(currentPiece().id);
    if (s.mode === 'ladder' && !view.looped) { startPicking('Ladder: tap the first bar to practise'); return; }
    starting = true;
    const request = ++startRequest, shape = startShape();
    if (app.messageIsNews) showMessage(''); // "Paused… play to carry on" and the like are done with
    // Begun from a key: it counts as your first note only where you have notes at the marker (in Rhythm: a beat to tap there).
    const startKeyCounts = fromKey !== undefined && view.struckAt(view.index, yours(s)).length > 0;
    $('play').textContent = '…'; // the piano loads on the first play; MIDI may ask to be allowed
    const bandReady = loadBand(currentPiece()); // read beside the rest; awaited before the band is asked for (B7-03)
    try {
      // Wait for me can be played on the keys under the music, so it starts without waiting for MIDI: a browser
      // without it, one not allowed it, or one still asking you to allow it (owner, 2026-10-15: the touch keys did
      // nothing on a phone with no keyboard). A keyboard allowed later plays in as it comes. The timed modes need one.
      const touchOnly = s.mode === 'wait' && !$('keyboard').hidden && s.pianoOut !== 'keyboard'; // (the keys are showing)
      if (touchOnly) void midi.start().then((names) => names.length ? undefined : 'No MIDI keyboard is connected', () => 'No MIDI keyboard here')
        .then((why) => { if (why && request === startRequest && !app.messageText) showMessage(`${why}: play on the keys below.`, true); });
      else if (s.mode !== 'watch' || s.pianoOut === 'keyboard') await midi.start();
      // The piano part goes to the keyboard when chosen and one is connected that can play; otherwise the phone.
      sound.keyboard = s.pianoOut === 'keyboard' && midi.canPlay ? midi : null;
      if (s.pianoOut === 'keyboard' && !sound.keyboard) showMessage('No MIDI keyboard to play through: the piano plays on the phone.');
      // The phone's piano samples load only when the phone plays piano notes (not for the metronome alone).
      if (pianoHands(s) || s.metronome || view.looped) await sound.prepare(!!pianoHands(s) && !sound.keyboard);
      await bandReady;
      if (bandOn(s)) await prepareBand(s);
    } catch (cause) {
      if (request !== startRequest) return; // dropped meanwhile (a tap on … or another choice): say nothing
      showMessage(cause instanceof Error ? cause.message : String(cause));
      starting = false;
      fillBars();
      if (s.mode !== 'watch') return; // no keyboard: nothing to wait for or score
    }
    if (request !== startRequest) return; // dropped meanwhile: whatever came after is in charge now
    starting = false;
    if (startShape() !== shape) { fillBars(); return; } // something else was chosen meanwhile
    sound.setVolumes(s.pianoVolume, s.clickVolume);
    sound.setClick(s.click);
    hideBars();
    pass = 0;
    const loop = view.looped, continuing = resumable;
    // The practice log (owner, 2026-10-13): a run from here to its stop (carrying on after a pause is the same run).
    if (s.mode !== 'watch' && !(continuing && logRun)) logRun = { run: new Run(), mode: s.mode, fromStep: view.index, passes: [], steps: 0, rounds: 0, furthest: view.index, at: view.index };
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
    if (startKeyCounts && judged(s.mode)) practice.startedBy(fromKey!, fromAt);
    fillBars();
  }

  // Starting with a key (owner, 2026-10-11): while paused, playing your first note starts the song from the
  // marker (any key, if none of your notes are there, and always in Rhythm); in Wait for me any key starts it.
  let resumable = false; // paused by itself: the next start carries on the same run
  /** Another song, mode, loop or screen: a run that paused by itself is over. */
  function forgetRun(): void { endRun(); resumable = false; practice.forgetRun(); }

  // ---- the practice log (log.ts): one entry per run --------------------------------------------------------------
  /** A run being logged. Wait for me (review 2026-10-15, V10): `steps` your notes the marker moved on from, `rounds`
   * the times it went round the loop (or reached the piece's end): what says the bars were played through. */
  let logRun: { run: Run; mode: string; fromStep: number; passes: Record<string, unknown>[]; steps: number; rounds: number; furthest: number; at: number } | null = null;
  const WHAT: Record<string, Slip['what']> = { missed: 'missed', early: 'early', late: 'late', short: 'let go early' };
  /** A run's slips: each note not on time and held (bar, note as written, what), and each key the score did not ask for. */
  function logSlips(r: { slips: { step: number; midi: number; kind: string }[]; extra: { step: number; midi: number }[] }): void {
    if (!logRun) return;
    const s = settingsFor(currentPiece().id), hand = yours(s);
    for (const x of r.slips) logRun.run.slip({ bar: view.barNumber(x.step), note: view.namesAt(x.step, hand).find((n) => n.midi === x.midi)?.name ?? keyName(x.midi), what: WHAT[x.kind] ?? 'missed' });
    for (const x of r.extra) logRun.run.slip({ bar: view.barNumber(x.step), note: keyName(x.midi), what: 'wrong key' });
  }
  function logSettings(): Record<string, string | number | boolean> {
    const s = settingsFor(currentPiece().id), loop = view.loopSpan();
    return { mode: s.mode, hands: s.hands, bpm: Math.round(view.baseBpm * s.speed), onTime: s.onTime, metronome: s.metronome, ...(loop ? { loop: `${view.barNumber(loop.a)}-${view.barNumber(loop.b)}` } : {}) };
  }
  /** The run is over: written to the log if anything was played (a summary, loop passes, or bars waited through). */
  function endRun(result?: Record<string, unknown>): void {
    const lr = logRun;
    logRun = null;
    if (!lr || borrower) return;
    const piece = currentPiece();
    const base = { at: lr.run.at, seconds: lr.run.seconds, screen: 'score' as const, mode: lr.mode, piece: piece.id, title: piece.title, settings: logSettings() };
    const slips = { slips: lr.run.slips, slipCount: lr.run.slipCount };
    if (result) addEntry({ ...base, result: { ...result, ...slips } });
    else if (lr.passes.length) addEntry({ ...base, result: { passes: lr.passes, ...slips } });
    else if (lr.mode === 'wait' && lr.steps > 0) {
      // Wait for me (review 2026-10-15, V10): what was played, measured by the notes the marker moved on from and the
      // rounds (a loop gone round, or the piece's end reached), not by where the marker stopped (a loop gone round
      // ends where it began; one note ends past it).
      const loop = view.loopSpan();
      const fromBar = view.barNumber(loop && lr.rounds ? loop.a : lr.fromStep), toBar = view.barNumber(loop && lr.rounds ? loop.b : lr.furthest);
      addEntry({ ...base, result: { fromBar, toBar, steps: lr.steps, rounds: lr.rounds } });
    }
  }
  /** Wait for me: the marker moved (your notes, or the piano leading on); a move back is the loop going round. */
  function trackWait(): void {
    const lr = logRun;
    if (!lr || lr.mode !== 'wait' || borrower || !practice.active) return;
    if (view.index > lr.at) { lr.steps += view.index - lr.at; lr.furthest = Math.max(lr.furthest, view.index); }
    lr.at = view.index;
  }
  practice.onLoopRound = () => { if (logRun?.mode === 'wait' && !borrower) { trackWait(); logRun.steps += 1; logRun.rounds += 1; logRun.at = view.loopSpan()?.a ?? 0; } };
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
    await play(e.midi, e.time);
  }
  practice.onAutoPause = (reason, step) => {
    if (reason === 'mash') { mashedAt = performance.now(); practice.forgetMash(mashedAt); }
    pauseRun(step, reason === 'silence' ? 'Paused: no keys for a few seconds. Play to carry on.' : 'Paused: lots of keys at once. Play to carry on.');
  };
  /** Paused by itself (silence, mashing, the phone turned): the run is kept, and the next start carries it on. */
  function pauseRun(step: number, text: string): void {
    practice.suspend(step); // (it carries on from `step`: those notes are scored in the next part)
    view.pause();
    view.goTo(step);
    resumable = true;
    pausedMessage(text);
  }
  // Or stop here and see how it went (owner, 2026-10-12).
  const pausedMessage = (text: string) => showMessage(text, true, { label: 'See how it went', run: () => { resumable = false; showMessage(''); practice.finishRun(); fillBars(); showBars(); } });
  // The band (owner, 2026-10-15): a MIDI file's parts that are not piano (library/midi/band.ts), read from the MIDI
  // kept with the piece and played with the score on its own timeline, in every mode that keeps time (not Wait for me).
  let band: { id: string; notes: BandNote[]; names: string[] } | null = null;
  // The piece whose band is read, or being read, and that read: ▶ waits for it (review 2026-10-15, B7-03: a ▶ tapped
  // while it was still being read played the first run without the band). It never fails; a read that could not be
  // done is forgotten, so the next draw or ▶ tries again.
  let bandRead: { id: string; done: Promise<void> } | null = null;
  const bandFailed = new Set<string>(); // sounds that would not load (fetched online, and offline): left out
  function loadBand(piece: Piece): Promise<void> {
    if (bandRead?.id === piece.id) return bandRead.done;
    band = null;
    const read = { id: piece.id, done: Promise.resolve() };
    const forget = () => { if (bandRead === read) bandRead = null; };
    read.done = (async () => {
      if (!piece.id.startsWith('u-')) return;
      const blob = await fileOf(midiKey(piece.id)).catch(() => null);
      if (blob === null) { forget(); return; }
      if (!blob) return;
      try {
        const [{ readMidi }, { partsOf, bandNotes, trimLeadIn }] = await Promise.all([import('../library/midi/readMidi'), import('../library/midi/band')]);
        await loadLibrary().catch(() => {});
        // The parts chosen for the score on the import sheet; the rest are the band.
        const parts = partsOf(trimLeadIn(readMidi(new Uint8Array(await blob.arrayBuffer()))), record(piece.id)?.own?.scoreParts).band;
        // Another piece open by now: not kept, and forgotten, so coming back to this one reads it again.
        if (currentPiece().id !== piece.id) forget();
        else if (parts.length) band = { id: piece.id, notes: bandNotes(parts), names: parts.map((part) => part.name) };
      } catch { forget(); /* a MIDI file that no longer reads: the score plays without a band */ }
    })();
    bandRead = read;
    return read.done;
  }
  const bandOn = (s: ScoreSettings): boolean => !!band && band.id === currentPiece().id && s.band && s.mode !== 'wait';
  /** The band's notes on the song's timeline (ms at speed 1), those whose sound loaded. */
  function bandEvents(): NoteEvent[] {
    if (!band) return [];
    const times = view.songTimes(band.notes);
    return band.notes.flatMap((n, i) => (bandFailed.has(n.sound) ? [] : [{ t: times[i]!.t, dur: times[i]!.dur, midi: n.midi, vel: n.vel, part: n.sound }]));
  }
  /** Gets the band's instruments ready; one that cannot load (offline, for a sound fetched online) is left out, and said. */
  async function prepareBand(s: ScoreSettings): Promise<void> {
    if (!band) return;
    const sounds = [...new Set(band.notes.map((n) => n.sound))];
    bandFailed.clear();
    await Promise.all(sounds.map((part) => sound.preparePart(part).catch(() => { bandFailed.add(part); })));
    for (const part of sounds) sound.setPartVolume(part, s.bandVolume);
    if (bandFailed.size) showMessage(`The band plays without ${[...bandFailed].map((x) => x.replace(/_/g, ' ')).join(', ')}: ${bandFailed.size === 1 ? 'its sound' : 'their sounds'} could not be loaded (offline?).`, true);
  }
  /** The piano's notes (if it plays) and the band's (if on), in time order, as the sound plays them. */
  function songNotes(s: ScoreSettings, piano: ReturnType<typeof pianoHands>, from = -Infinity, to = Infinity): NoteEvent[] {
    const notes = [
      ...(piano ? (to === Infinity ? view.noteEvents(piano) : view.notesBetween(piano, from, to)) : []),
      ...(bandOn(s) ? bandEvents().filter((n) => n.t >= from - 1 && n.t < to).map((n) => ({ ...n, dur: Math.min(n.dur, to - n.t) })) : []),
    ];
    return notes.sort((a, b) => a.t - b.t);
  }
  /** (Re)starts the sound at song time t with the current choices; the marker then follows its clock. now: begun by a key just played. */
  function startSound(t: number, now = false): void {
    const s = settingsFor(currentPiece().id);
    const piano = pianoHands(s);
    sound.setVolumes(s.pianoVolume, s.clickVolume);
    sound.setClick(s.click);
    if (!piano && !s.metronome && !bandOn(s)) { sound.stop(); view.songClock = null; return; }
    sound.play(songNotes(s, piano), s.metronome ? view.beats(s.clickOn) : [], t, s.speed, false, now);
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
    sound.play(songNotes(s, piano, from, span.t1), [...(fromMarker ? [] : span.countIn), ...clicks], fromMarker ? from : span.from, s.speed, false, now);
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
      if (logRun) { logRun.passes.push({ pass, notes: r.total, onTime: r.onTime, early: r.early, late: r.late, missed: r.missed, letGoEarly: r.short, wrongKeys: r.wrong, clean, bpm: Math.round(view.baseBpm * s.speed) }); logSlips(r); }
      let line = `Pass ${pass}: ${r.onTime}/${r.total} on time${r.short ? `, ${r.short} let go early` : ''}${r.wrong ? `, ${r.wrong} ${r.rhythm ? 'extra' : 'wrong'}` : ''}`;
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
    startRequest++; // a start still getting ready is dropped
    starting = false;
    if (borrower) { borrower.stop(); return; }
    if (view.playing) view.pause();
    else { sound.stop(); practice.stop(!view.looped); fillBars(); showBars(); }
    if (!resumable) endRun(); // (a run paused by itself is not over: it carries on, or See how it went ends it)
  }
  view.onStop = () => {
    sound.stop();
    if (borrower || holding) return; // a borrower stops the music itself (memorise.ts); nothing here stops it
    practice.stop(!view.looped);
    fillBars();
    showBars();
  };
  practice.onHint = (keys) => {
    strip.markKeys('now-r', keys);
    borrower?.hint(keys);
  };

  // A panel over the score (owner, 2026-10-15, A3): what you play pauses, and keys don't count while it is open
  // (main.ts). Play along, Ladder and Rhythm pause as they do by themselves (the run kept, "Play to carry on": your next
  // key carries it on from where it stopped); Wait for me has no clock: the piano leading on to your next notes stops,
  // and when the panel closes it waits at them again. A start still getting ready is dropped. Watch plays on (nothing
  // is judged, and changing tempo or volume while listening is the point).
  let holding = false; // stopping the view for a panel: Wait for me is not over
  let panelPaused = false, heldWait = '';
  const PANEL_PAUSED = 'Paused while a panel was open. Play to carry on.';
  function panel(open: boolean): void {
    const s = settingsFor(currentPiece().id);
    if (!open) {
      const paused = panelPaused, held = heldWait;
      panelPaused = false;
      heldWait = '';
      if (borrower) return; // (Memorise opened from ⋯ meanwhile: its run is over)
      if (paused && resumable) pausedMessage(PANEL_PAUSED); // (a redraw meanwhile clears messages)
      if (held === currentPiece().id && practice.active && s.mode === 'wait') practice.release();
      return;
    }
    if (borrower || s.mode === 'watch') return; // (Memorise has its own: memorise-screen.ts)
    if (starting) { stopAll(); return; }
    if (!practice.active) return;
    if (judged(s.mode) && view.playing) { pauseRun(view.index, PANEL_PAUSED); panelPaused = true; }
    else if (s.mode === 'wait') {
      holding = true;
      view.pause();
      holding = false;
      sound.stop();
      practice.hold();
      heldWait = currentPiece().id;
    }
  }

  // ▶ / ⏸; while a start is still getting ready (…), a tap drops it.
  $('play').addEventListener('click', () => (view.playing || practice.active || starting ? stopAll() : void play()));

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
  strip.narrow = () => currentDevice() === 'phone-upright' && touchPlays(); // (owner, 2026-10-13: wide enough to tap)
  $('keyboard').addEventListener('pointerdown', (e) => {
    const key = (e.target as HTMLElement).closest<HTMLElement>('[data-midi]');
    if (!key || !touchPlays()) return;
    e.preventDefault();
    const m = Number(key.dataset.midi), id = e.pointerId;
    try { $('keyboard').setPointerCapture(id); } catch { /* not a live pointer */ } // (lets go off the keys too: review, 2026-10-15)
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
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) $('keyboard').addEventListener(ev, liftKey);
  $('keyboard').addEventListener('contextmenu', (e) => e.preventDefault());

  practice.onDone = () => { if (logRun?.mode === 'wait') { trackWait(); logRun.steps += 1; logRun.rounds += 1; } endRun(); fillBars(); showBars(); };
  practice.onSummary = (r) => {
    if (!r.total) return;
    // The log: the run's counts and slips (owner, 2026-10-13).
    logSlips(r);
    endRun({ notes: r.total, onTime: r.onTime, early: r.early, late: r.late, missed: r.missed, letGoEarly: r.short, wrongKeys: r.wrong, toleranceMs: r.tolerance,
      weakBars: r.weak.map((w) => `${view.barNumber(w.a)}-${view.barNumber(w.b)}`) });
    const pct = (n: number) => `${Math.round((n / r.total) * 100)}%`;
    $('summary-body').textContent = r.rhythm
      ? `${r.total} beats to tap: ${r.onTime} on time and held (${pct(r.onTime)}, within ±${r.tolerance} ms), ${r.short} let go early, ${r.early} early, ` +
        `${r.late} late, ${r.missed} missed. ${r.wrong} extra tap${r.wrong === 1 ? '' : 's'}.`
      : `${r.total} notes: ${r.onTime} on time and held (${pct(r.onTime)}, within ±${r.tolerance} ms), ${r.short} let go early, ${r.early} early, ` +
        `${r.late} late, ${r.missed} missed. ${r.wrong} key${r.wrong === 1 ? '' : 's'} the score did not ask for.`;
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

  // Hands: L | R | Both | Off in the bottom bar, saved per song; a change while playing is heard at once (Watch).
  // In the modes where you play, a change ends the run there, as a change of mode does (review, 2026-10-15): its
  // summary and log are for the hands it was played with, never a mix; the next ▶ or key starts one with the new hands.
  for (const b of document.querySelectorAll<HTMLButtonElement>('#q-hands button')) {
    b.addEventListener('click', () => {
      const was = settingsFor(currentPiece().id);
      if (was.mode !== 'watch' && b.dataset.hands !== was.hands) { if (view.playing || practice.active) stopAll(); forgetRun(); }
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
    const hasBand = !!band && band.id === currentPiece().id;
    $('t-band-set').hidden = !hasBand;
    $('t-band-vol-row').hidden = !hasBand;
    $<HTMLInputElement>('t-band').checked = s.band;
    $<HTMLInputElement>('t-band-vol').value = String(Math.round(s.bandVolume * 100));
    $('t-band-parts').textContent = hasBand ? `${band!.names.join(', ')}${s.mode === 'wait' ? '. Not in Wait for me, which keeps no tempo.' : '.'}` : '';
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
  function soundChange<K extends 'metronome' | 'band' | 'click' | 'clickOn' | 'pianoVolume' | 'clickVolume' | 'bandVolume'>(key: K, value: ScoreSettings[K]): void {
    savePieceSetting(currentPiece().id, key, value);
    const s = settingsFor(currentPiece().id);
    sound.setVolumes(s.pianoVolume, s.clickVolume);
    sound.setClick(s.click);
    if (band) for (const part of new Set(band.notes.map((n) => n.sound))) sound.setPartVolume(part, s.bandVolume);
    if (key === 'band' && value && view.playing && sound.playing) { void prepareBand(s).then(() => { if (view.playing && sound.playing) startSound(sound.songTime()); }); return; }
    if ((key === 'metronome' || key === 'clickOn' || key === 'band') && view.playing && sound.playing) startSound(sound.songTime());
  }
  $<HTMLInputElement>('t-piano-vol').addEventListener('input', (e) => soundChange('pianoVolume', Number((e.target as HTMLInputElement).value) / 100));
  $<HTMLInputElement>('t-click-vol').addEventListener('input', (e) => soundChange('clickVolume', Number((e.target as HTMLInputElement).value) / 100));
  $<HTMLInputElement>('t-metronome').addEventListener('change', (e) => soundChange('metronome', (e.target as HTMLInputElement).checked));
  $<HTMLInputElement>('t-band').addEventListener('change', (e) => soundChange('band', (e.target as HTMLInputElement).checked));
  $<HTMLInputElement>('t-band-vol').addEventListener('input', (e) => soundChange('bandVolume', Number((e.target as HTMLInputElement).value) / 100));
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
      // Wait for me with the piano leading on to your next notes: it stops without ending the run, and waits at them
      // once laid out again (2026-10-15: it ended the run, though turning while it waited for you kept it).
      const waiting = view.playing && !borrower && practice.active && settingsFor(currentPiece().id).mode === 'wait';
      if (along) pauseRun(view.index, turned);
      else if (waiting) { holding = true; view.pause(); holding = false; sound.stop(); }
      else if (view.playing && !borrower) view.pause();
      void draw(true).then(() => {
        if (along && resumable) pausedMessage(turned); // (drawing clears messages)
        if (waiting && practice.active) practice.carryOn();
      });
    }, 150);
  }

  // Panels: info, display.

  function fillInfo(): void {
    const piece = currentPiece();
    $('info-title').textContent = piece.title;
    const body = $('info-body');
    // (Each part only if the song list gives it: an entry without a source or status still opens.)
    const from = piece.source?.dataset ? ` From ${piece.source.dataset}${piece.source.uploadTitle ? ` (“${piece.source.uploadTitle}”)` : ''}.` : '';
    const licence = piece.license ? [' Licence ', piece.licenseUrl ? Object.assign(document.createElement('a'), { href: piece.licenseUrl, target: '_blank', rel: 'noopener', textContent: piece.license }) : piece.license, '.'] : [];
    const status = piece.status ? ` ${piece.status.charAt(0).toUpperCase()}${piece.status.slice(1)}.` : '';
    body.replaceChildren(`${piece.composer ?? ''}.${from}`, ...licence, status);
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
      if (view.failed) return; // (a piece that could not be drawn: nothing to start or judge, P14)
      borrower?.keySeen(e);
      // Wait for me starting from a key: the rest of a chord, pressed while it starts, counts for the first notes as
      // the key that started it does (owner, 2026-10-15: F3 and F5 together started it with F3 alone).
      if (e.on && starting && !borrower && settingsFor(currentPiece().id).mode === 'wait') practice.pressedBefore(e.midi);
      practice.key(e);
      if (e.on) void startFromKey(e);
    },
    command,
    musicRange(): KeyRange | null {
      const ps = view.songPitches;
      return ps.length ? { lo: Math.min(...ps), hi: Math.max(...ps) } : null;
    },
    resized,
    panel,
    get busy() { return !borrower && (view.playing || practice.active); },
    draw,
    openSong,
    openActivity,
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
