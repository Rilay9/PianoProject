// Read in time: the screen (flow/engine.ts says what it is and why; flow/view.ts draws it). A rhythm set is tapped on
// one big pad (or any key); a set of melodies is played on the keys (or a MIDI keyboard). One bar counts in, then the
// exercises follow one another on a click that never stops: a rhythm's straight after the last, a melody's after one bar
// to look at it (the card shows as that bar starts; one line only, since 2026-10-18). Each tap is marked as it lands; each exercise gets a line
// of score; Stop (or nothing played for two bars) ends the session with its summary, Keep going, and in a lesson step
// Back to the lesson. Choices: Tap along / Read, tempo − +, Speed up by itself, Loop this one, Judge note lengths.
// Starting (owner, 2026-10-18: "start the drill at any time by pressing the first key in the sequence I dont want to have
// to wait"): the first card's first note (a rhythm card: any tap) starts it there and then, as its first note, the click
// following from it; another key is named against that note and starts nothing; Start gives a bar of count-in instead.

import { $, type App, type KeyRange, type Screen } from '../app';
import type { FlowPreset } from '../activity';
import { allSets } from '../lesson/path';
import { fillTaskLine } from '../lesson/task-line';
import { addEntry, Run, stepFor, activityTag, type ActivityTag } from '../log';
import { ExerciseKeys } from '../exercise/keys';
import { RhythmPad } from '../exercise/pad';
import type { Item, ItemSet } from '../exercise/items';
import { RHYTHM_MIDI } from '../exercise/rhythm';
import { shuffled } from '../exercise/drill';
import { keyboardConnected } from '../key-words';
import type { KeyEvent } from '../midi';
import type { Command } from '../remote';
import type { NoteEvent, Beat } from '../sound';
import type { TapInput } from '../calibration';
import { clicksBetween, FlowJudge, place, scoreWords, shouldSpeedUp, TEMPO_MAX, TEMPO_MIN, TEMPO_STEP, WINDOW_MS, type ExerciseScore, type FlowNote, type NoteResult, type Placed } from '../flow/engine';
import { FlowView, clefOf as flowClef } from '../flow/view';
import { wrongWords } from '../staff-words';
import { midiOf } from '../exercise/items';

export type FlowScreen = Screen & { open(stillWanted?: () => boolean, activity?: { set: string; settings: FlowPreset; title?: string }, setId?: string): Promise<void>; close(): void; readonly isOpen: boolean; debug(): unknown };

interface Stored { tempo: Record<string, number>; mode: 'along' | 'read'; autoSpeed: boolean; holds: boolean }
const KEY = 'piano-web.flow.v1';
/** A session is counted (a lesson step's "played") after this many exercises. */
export const ROUND = 8;
const AHEAD = 3; // exercises placed on the clock ahead of the one being played
const IDLE_BARS = 2; // nothing played for this long: the session stops by itself

export function createFlowScreen(app: App, closed: () => void): FlowScreen {
  const { sound, midi } = app;
  const view = new FlowView($('fl-music'));
  const keys = new ExerciseKeys($('fl-keyboard'), sound);
  const pad = new RhythmPad($('fl-pad'), sound);
  // Sideways the music itself is the pad (owner, 2026-10-18), and with a keyboard connected there is no pad at all (any
  // key taps: "Don't bother with the tap if a midi keyboard is connected").
  const sidewaysQuery = window.matchMedia('(max-height: 599px) and (orientation: landscape)');
  const musicPad = new RhythmPad($('fl-music'), sound);
  sidewaysQuery.addEventListener?.('change', () => { if (isOpen) tools(); });
  let stored = read();
  let sets: ItemSet[] = [], set: ItemSet | null = null, preset: FlowPreset | null = null;
  let isOpen = false, running = false, session = 0, ticker = 0;
  let judge = new FlowJudge();
  let placed: Placed[] = []; // on the clock: the one being played first
  let deck: Item[] = [], lastItem: Item | null = null, loopItem: Item | null = null, firstItem: Item | null = null, counter = 0;
  let scores: ExerciseScore[] = [], streak = 0, bestStreak = 0, tempo = 80, run: Run | null = null, tag: ActivityTag = null;
  let countInEnd = 0, shownEx = -1, summary = '';
  let ending: Placed[] = []; // off the screen, their scores to come

  // ---- choices ---------------------------------------------------------------------------------------------------
  const mode = () => preset?.mode ?? stored.mode;
  const autoSpeed = () => preset?.autoSpeed ?? stored.autoSpeed;
  const holdsOn = () => preset?.holds ?? stored.holds;
  const rhythm = () => set?.kind === 'rhythm';
  const gapBars = () => (rhythm() ? 0 : 1);
  function setChoice<K extends keyof FlowPreset & keyof Stored>(k: K, v: Stored[K]): void {
    if (preset && preset[k] !== undefined) (preset as Record<string, unknown>)[k] = v;
    else { (stored as unknown as Record<string, unknown>)[k] = v; save(); }
    tools();
  }

  // ---- the session -----------------------------------------------------------------------------------------------
  function nextItem(): Item {
    if (loopItem) return loopItem;
    if (firstItem) { lastItem = firstItem; firstItem = null; return lastItem; } // (the card shown before Start)
    if (!deck.length) deck = shuffled(set!.items, lastItem);
    lastItem = deck.shift()!;
    return lastItem;
  }
  /** Places exercises from t (a downbeat) until AHEAD are waiting. */
  function fill(from: number): void {
    let t = from;
    while (placed.length < AHEAD + 1) {
      const p = place(counter++, nextItem(), t, tempo, rhythm());
      judge.add(p.notes, { ex: p.n, t0: p.t0, end: p.end });
      placed.push(p);
      t = p.end + gapBars() * p.beatMs * p.barBeats;
    }
  }
  /** The sound for what is placed (from the clock now on): the clicks throughout, and in Tap along the notes too. */
  function schedule(): void {
    const beats: Beat[] = [];
    // (the count-in while the first card is still to come; then each card's own clicks from its start, through its gap:
    // a card placed at another tempo has its own beat)
    const first = placed[0];
    if (first.n === 0) beats.push(...clicksBetween(0, countInEnd, first.beatMs, first.barBeats));
    for (const p of placed) beats.push(...clicksBetween(p.t0, p.end + gapBars() * p.beatMs * p.barBeats, p.beatMs, p.barBeats));
    const notes: NoteEvent[] = mode() === 'along' ? placed.flatMap((p) => p.notes.map((n) => ({ t: n.t, midi: n.key ?? RHYTHM_MIDI, dur: n.dur * 0.85, vel: 62 }))) : [];
    sound.play(notes, beats, sound.songTime(), 1, true, true);
  }

  /** first: the first card's first note, played to start (no count-in: the clock runs from it, and it is judged on time). */
  async function start(first?: { key: number | null; time: number }): Promise<void> {
    if (!set || running) return;
    const mine = ++session;
    await sound.prepare(!sound.keyboard).catch(() => {});
    if (!isOpen || mine !== session) return;
    running = true;
    judge = new FlowJudge({ holds: holdsOn() });
    placed = []; ending = []; scores = []; streak = 0; bestStreak = 0; counter = 0; deck = []; loopItem = null; summary = '';
    tempo = preset?.tempo ?? stored.tempo[set.id] ?? set.tempo ?? 80;
    run = new Run();
    tag = activityTag('flow');
    // One bar of count-in from 0, then the first exercise.
    const meter = set.items[0]?.meter ?? set.meter ?? { beats: 4, beatType: 4 };
    const beatMs = (60000 / tempo) * (4 / meter.beatType);
    countInEnd = first ? 0 : beatMs * meter.beats;
    fill(countInEnd);
    // (the clock from just before the count-in; schedule() gives it the clicks. Started on the first note: the clock as
    // if that note fell on 0, however long getting the sound ready took, up to a second)
    if (first) sound.play([], [], Math.min(1000, Math.max(0, performance.now() - first.time)), 1); else sound.play([], [], -150, 1);
    schedule();
    if (first) { const r = judge.tap(0, first.key); if (r) marked(r.note, r.result); }
    shownEx = -1;
    showCards();
    $('fl-result').hidden = true;
    tools();
    clearInterval(ticker);
    ticker = window.setInterval(tick, 15);
  }

  /** The clock moves: the count, the moving line, missed notes, the next card, idle stop. */
  function tick(): void {
    if (!running) return;
    const now = sound.songTime() - sound.heardDelayMs('clicks');
    if (now < countInEnd) {
      const p = placed[0], beat = Math.floor((now + p.beatMs * p.barBeats - countInEnd) / p.beatMs) + 1;
      say(beat >= 1 ? `${beat}` : '', 'Count in', 'count');
    }
    for (const n of judge.tick(now)) marked(n, { mark: 'missed' });
    // An exercise over: the next on screen, one line only (owner, 2026-10-18: "the line should be much larger, why do we
    // need to see the next exercise"). A tune's comes as the bar between them starts (a bar to read it); a rhythm's, with
    // no bar between, a beat before it. Its score waits until its last note's window has closed too (a late last note,
    // or an extra tap in its last beat, still counts for it).
    while (placed.length && now >= placed[0].end - (gapBars() ? 0 : placed[0].beatMs)) {
      ending.push(placed.shift()!);
      fill(placed.at(-1)!.end + gapBars() * placed.at(-1)!.beatMs * placed.at(-1)!.barBeats);
      schedule();
      showCards();
    }
    while (ending.length && now >= ending[0].end + WINDOW_MS) {
      exerciseDone(ending.shift()!);
      if (!running) return;
    }
    view.cursor(now);
    // Nothing played for IDLE_BARS bars while there were notes to play: stopped.
    const p = placed[0];
    if (p && now > countInEnd + p.beatMs * p.barBeats * IDLE_BARS && now - Math.max(judge.lastTap, countInEnd) > p.beatMs * p.barBeats * IDLE_BARS) stop('Stopped: nothing played for two bars');
  }

  function showCards(): void {
    const [a, b] = placed;
    if (a && a.n !== shownEx) {
      view.show(a, b ?? null, rhythm());
      shownEx = a.n;
      // (the keys for this card's notes only: a set for either hand would draw four octaves, too small on a phone;
      // they change in the bar between cards)
      if (!rhythm()) keys.setRange(a.notes.map((n) => n.key ?? 60));
      // (marks already given on this card, put back: a card shown late, or drawn again on a turn)
      for (const n of a.notes) { const r = judge.results.get(n); if (r) view.mark(n, r); }
    }
  }
  view.onRedraw = () => { const a = placed[0]; if (a) for (const n of a.notes) { const r = judge.results.get(n); if (r) view.mark(n, r); } };

  function marked(n: FlowNote, r: NoteResult): void {
    view.mark(n, r);
    if (r.mark === 'ok') { streak++; bestStreak = Math.max(bestStreak, streak); } else streak = 0;
    status();
  }

  function exerciseDone(p: Placed): void {
    const s = judge.score(p.n);
    scores.push(s);
    $('fl-last').textContent = scoreWords(s);
    if (autoSpeed() && !loopItem && shouldSpeedUp(scores) && tempo < TEMPO_MAX) {
      // (three good exercises in a row: faster, from the exercises not yet begun; then three more before the next)
      tempo = Math.min(TEMPO_MAX, tempo + TEMPO_STEP);
      scores.push({ ...s, total: 0 }); // (a break in the run of good ones)
      replanFrom();
      flash(`Faster: ♩ = ${tempo}`);
    }
    status();
    judge.forget(Math.min(p.t0, placed[0]?.t0 ?? p.t0) - 1);
  }
  /** A new tempo (or Loop): the exercises not yet begun placed again from the end of the one being played. */
  function replanFrom(): void {
    if (!placed.length) return;
    const cur = placed[0], waiting = placed.slice(1);
    placed = [cur];
    const keepItems = waiting.map((p) => p.item);
    const left = new Set(waiting.flatMap((p) => p.notes));
    judge = rebuildJudge(left);
    let t = cur.end + gapBars() * cur.beatMs * cur.barBeats;
    for (const it of loopItem ? [] : keepItems) {
      const p = place(counter++, it, t, tempo, rhythm());
      judge.add(p.notes, { ex: p.n, t0: p.t0, end: p.end });
      placed.push(p);
      t = p.end + gapBars() * p.beatMs * p.barBeats;
    }
    fill(t);
    schedule();
    shownEx = -1;
    showCards();
  }
  /** The judge with the notes no longer wanted taken out (their placing changed). */
  function rebuildJudge(drop: Set<FlowNote>): FlowJudge {
    const j = new FlowJudge({ holds: holdsOn() });
    const keep = judge.all.filter((n) => !drop.has(n));
    j.add(keep);
    for (const n of keep) { const r = judge.results.get(n); if (r) j.results.set(n, r); }
    j.extras = judge.extras;
    return j;
  }

  function stop(why = ''): void {
    if (!running) return;
    running = false;
    session++;
    clearInterval(ticker);
    sound.stop();
    pad.release(); musicPad.release();
    keys.release();
    view.cursor(-1);
    for (const p of ending) { judge.tick(Infinity); exerciseDone(p); }
    ending = [];
    const played = scores.filter((s) => s.total > 0);
    const on = played.reduce((a, s) => a + s.onTime, 0), total = played.reduce((a, s) => a + s.total, 0);
    const pct = total ? Math.round((on / total) * 100) : 0;
    summary = played.length ? `${played.length} ${played.length === 1 ? 'exercise' : 'exercises'} · ${pct}% on time · best run ${bestStreak} notes · ♩ ${tempo}` : 'Nothing played yet';
    if (run && played.length && set) {
      addEntry({
        at: run.at, seconds: run.seconds, screen: 'flow', set: set.id, title: set.title,
        settings: { bpm: tempo, mode: mode(), holds: holdsOn(), autoSpeed: autoSpeed() },
        result: { exercises: played.length, onTime: on, notes: total, percent: pct, bestStreak, ended: played.length >= ROUND ? 'round played' : 'stopped early', scores: played.map((s) => scoreWords(s)) },
      }, tag);
    }
    run = null;
    showResult(why);
    tools();
  }

  function showResult(why: string): void {
    const box = $('fl-result');
    box.hidden = false;
    const step = !!stepFor('flow')?.lesson;
    const played = scores.filter((s) => s.total > 0).length;
    $('fl-result-line').textContent = summary;
    $('fl-result-sub').textContent = [why, played >= ROUND ? '' : `${ROUND} exercises make a round`].filter(Boolean).join(' · ');
    $('fl-keep').textContent = played ? 'Keep going' : 'Start';
    $('fl-back').hidden = !step;
    say('', '', '');
  }

  // ---- input -----------------------------------------------------------------------------------------------------
  /** A key or a pad tap at `time` (performance.now()), as heard: the clock less the sound's delay for this input. */
  function input(key: number | null, down: boolean, time: number, how: TapInput): void {
    if (!running) {
      if (!down || !isOpen || !$('fl-result').hidden || !firstItem) return;
      // The first card's first note starts it (a rhythm card: any tap); another key is named, and nothing starts.
      const want = place(0, firstItem, 0, 60, rhythm()).notes[0];
      if (!want || key === null || want.key === null || key === want.key) { void start({ key, time }); return; }
      const pitch = firstItem.groups.find((g) => g.length)!;
      const w = wrongWords(key, [pitch[0]], (flowClef(place(0, firstItem, 0, 60, false), false) as 'treble' | 'bass'), midiOf);
      say(w.head, `The first note is ${w.sub.replace(/^This note is /, '')} · or Start for a bar of count-in`, 'wrong');
      return;
    }
    const t = sound.songTime() - Math.min(1000, Math.max(0, performance.now() - time)) - sound.heardDelayMs('clicks', how);
    if (!down) { const r = judge.release(t, key); if (r) marked(r.note, r.result); return; }
    if (t < countInEnd - (placed[0]?.beatMs ?? 500) * 0.5) return; // (a tap in the count-in is not a note)
    const r = judge.tap(t, key);
    if (r) marked(r.note, r.result);
    // A wrong key, named as it lands (owner, 2026-10-18): what you played and the note it was, for a moment.
    if (r?.result.mark === 'wrong' && key !== null) {
      const p = [...placed, ...ending].find((x) => x.n === r.note.ex), pitch = p?.item.groups[r.note.i]?.[0];
      if (pitch) { const w = wrongWords(key, [pitch], null, midiOf); say(w.head, `${w.sub.replace(/^This note is /, 'That note is ')}`, 'wrong'); clearTimeout(sayTimer); sayTimer = window.setTimeout(() => { if (running) status(); }, 1800); }
    }
    else { view.extra(t, judge.extras.at(-1)?.ex ?? -1); streak = 0; status(); }
  }
  pad.onKey = (down, time) => { if (isOpen && rhythm()) input(null, down, time, 'screen'); };
  musicPad.onKey = (down, time) => { if (isOpen && rhythm() && sidewaysQuery.matches && !keyboardConnected()) input(null, down, time, 'screen'); };
  keys.onKey = (m, down, time, how) => { if (isOpen) input(rhythm() ? null : m, down, time, how); };

  // ---- what it says ----------------------------------------------------------------------------------------------
  function say(big: string, small: string, cls: string): void {
    const s = $('fl-say');
    s.className = `fl-say ${cls}`;
    $('fl-say-big').textContent = big;
    $('fl-say-small').textContent = small;
  }
  let flashTimer = 0, sayTimer = 0;
  function flash(text: string): void { clearTimeout(flashTimer); $('fl-flash').textContent = text; flashTimer = window.setTimeout(() => { $('fl-flash').textContent = ''; }, 2500); }
  function status(): void {
    const played = scores.filter((s) => s.total > 0);
    const on = played.reduce((a, s) => a + s.onTime, 0), total = played.reduce((a, s) => a + s.total, 0);
    $('fl-acc').textContent = total ? `${Math.round((on / total) * 100)}% on time` : '';
    $('fl-streak').textContent = streak > 1 ? `${streak} in a row` : '';
    $('fl-count').textContent = running ? `Exercise ${played.length + 1}` : '';
    if (running && sound.songTime() >= countInEnd) say('', '', ''); // (the switch says Tap along or Read: nothing to repeat)
  }
  function tools(): void {
    $('fl-bpm').textContent = `♩ ${preset?.tempo !== undefined && !running ? preset.tempo : running ? tempo : stored.tempo[set?.id ?? ''] ?? set?.tempo ?? 80}`;
    for (const b of document.querySelectorAll<HTMLButtonElement>('#fl-mode button')) b.setAttribute('aria-pressed', String(b.dataset.mode === mode()));
    $('fl-auto').setAttribute('aria-pressed', String(autoSpeed()));
    $('fl-loop').setAttribute('aria-pressed', String(!!loopItem));
    $('fl-holds').setAttribute('aria-pressed', String(holdsOn()));
    $('fl-holds').hidden = false;
    $('fl-go').textContent = running ? '■ Stop' : '▶ Start';
    $('fl-loop').hidden = !running;
    $('fl-pad').hidden = !rhythm() || keyboardConnected();
    $('fl-keyboard').hidden = rhythm();
    $('fl-help').textContent = rhythm()
      ? `${keyboardConnected() ? 'Play any key' : 'Tap the pad'} for each note. Dots: green on time, orange early ← or late →, grey missed.`
      : 'Play each note in time with the click. Dots: green on time, orange early ← or late →, red a wrong key, grey missed.';
  }
  function changeTempo(d: number): void {
    tempo = Math.max(TEMPO_MIN, Math.min(TEMPO_MAX, (running ? tempo : preset?.tempo ?? stored.tempo[set!.id] ?? set!.tempo ?? 80) + d));
    if (preset?.tempo !== undefined) preset.tempo = tempo; else { stored.tempo[set!.id] = tempo; save(); }
    if (running) replanFrom();
    tools();
  }

  $('fl-done').addEventListener('click', () => { if (isOpen) close(); });
  $('fl-go').addEventListener('click', () => { if (!isOpen) return; if (running) stop('Stopped'); else void start(); });
  $('fl-keep').addEventListener('click', () => { if (isOpen && !running) void start(); });
  $('fl-back').addEventListener('click', () => { if (isOpen) close(); });
  $('fl-slower').addEventListener('click', () => { if (isOpen) changeTempo(-TEMPO_STEP); });
  $('fl-faster').addEventListener('click', () => { if (isOpen) changeTempo(TEMPO_STEP); });
  for (const b of document.querySelectorAll<HTMLButtonElement>('#fl-mode button')) b.addEventListener('click', () => { if (!isOpen) return; setChoice('mode', b.dataset.mode as 'along' | 'read'); if (running) schedule(); });
  $('fl-more').addEventListener('click', () => { const on = $('flow').classList.toggle('more'); $('fl-more').setAttribute('aria-expanded', String(on)); });
  // (the ⋯ choices close on a tap anywhere else)
  document.addEventListener('pointerdown', (e) => { if ($('flow').classList.contains('more') && !(e.target as HTMLElement).closest?.('.fl-tools')) { $('flow').classList.remove('more'); $('fl-more').setAttribute('aria-expanded', 'false'); } });
  $('fl-auto').addEventListener('click', () => { if (isOpen) setChoice('autoSpeed', !autoSpeed()); });
  $('fl-holds').addEventListener('click', () => { if (isOpen && !running) setChoice('holds', !holdsOn()); else if (running) flash('Stop first to change this'); });
  $('fl-loop').addEventListener('click', () => {
    if (!isOpen || !running || !placed.length) return;
    loopItem = loopItem ? null : placed[0].item;
    replanFrom();
    tools();
  });

  // ---- opening and closing ---------------------------------------------------------------------------------------
  async function open(stillWanted: () => boolean = () => true, activity?: { set: string; settings: FlowPreset; title?: string }, setId?: string): Promise<void> {
    const got = await allSets(app).catch(() => ({ sets: [] as ItemSet[], problems: ['the sets could not be read'] }));
    if (!stillWanted()) return;
    sets = got.sets.filter((s) => s.kind === 'rhythm' || s.items.some((i) => i.beats));
    const want = activity?.set ?? setId;
    set = sets.find((s) => s.id === want) ?? null;
    if (!set) { app.showMessage(`Read in time: no set "${want ?? ''}" to play${got.problems.length ? ` (${got.problems.join('; ')})` : ''}`); return; }
    preset = activity ? { ...activity.settings } : null;
    isOpen = true;
    $('flow').hidden = false;
    $('fl-title').textContent = activity?.title ?? set.title;
    fillTaskLine($('fl-task'), 'flow');
    if ($('fl-task').textContent === $('fl-title').textContent) $('fl-task').hidden = true; // (the title says it already: the room is the music's)
    keys.setNames(false);
    view.clear();
    // The first card shown before Start, to read (and played first).
    placed = [];
    firstItem = set.items[Math.floor(Math.random() * set.items.length)];
    const first = place(0, firstItem, 0, preset?.tempo ?? stored.tempo[set.id] ?? set.tempo ?? 80, rhythm());
    keys.setRange(rhythm() ? [60, 72] : first.notes.map((n) => n.key ?? 60));
    view.show(first, null, rhythm());
    shownEx = -1;
    scores = []; streak = 0;
    $('fl-result').hidden = true;
    $('fl-last').textContent = '';
    status();
    say('', rhythm() ? `${keyboardConnected() ? 'Any key' : sidewaysQuery.matches ? 'A tap on the music' : 'A tap on the pad'} for its first note starts it there; Start gives a bar of count-in first` : 'Its first note starts it there; Start gives a bar of count-in first', '');
    tools();
    app.stayAwake();
  }
  function close(): void {
    if (running) stop();
    session++;
    clearInterval(ticker);
    isOpen = false;
    preset = null;
    keys.release();
    pad.release(); musicPad.release();
    $('flow').hidden = true;
    app.stayAwake();
    closed();
  }

  function read(): Stored {
    const empty: Stored = { tempo: {}, mode: 'along', autoSpeed: false, holds: false };
    try { return { ...empty, ...(JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Stored>) }; } catch { return empty; }
  }
  function save(): void { try { localStorage.setItem(KEY, JSON.stringify(stored)); } catch { /* this visit only */ } }

  return {
    open,
    close,
    get isOpen() { return isOpen; },
    key: (e: KeyEvent) => keys.midiKey(e.midi, e.on, midi.down, e.time),
    command(c: Command): void {
      if (c === 'mash') { if (running) stop('Stopped by a mash'); }
      else if (c === 'high') { if (!running) void start(); }
    },
    musicRange: (): KeyRange | null => (running ? { lo: 0, hi: 127 } : null),
    resized: () => { if (isOpen) tools(); },
    panel: (opened: boolean) => { if (opened && running) stop('Stopped'); },
    get busy() { return running; },
    debug: () => ({
      running, tempo, mode: mode(), holds: holdsOn(), autoSpeed: autoSpeed(), loop: !!loopItem, countInEnd,
      placed: placed.map((p) => ({ n: p.n, t0: p.t0, end: p.end, notes: p.notes.map((n) => ({ t: n.t, dur: n.dur, key: n.key })) })),
      scores: scores.map((s) => ({ ...s })), marks: view.marks(), streak, bestStreak, summary, now: sound.songTime(), heard: sound.heardDelayMs('clicks', 'screen'),
    }),
  };
}
