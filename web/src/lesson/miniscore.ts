// A lesson's little playable score (owner, 2026-10-15): a short excerpt drawn with the app's own renderer (OSMD, as
// the score and the exercise cards draw), with ▶ to hear it on the app's piano (Sound) while OSMD's own cursor moves
// over the notes being played and, if wanted, the keys light on a small keyboard (UnderStrip, the score's keys). This
// is also the lesson's "animation" of music: the marker moving and the keys lighting as it plays.
//
// The music: bars cut from a piece (excerptXml: the bars kept with the clefs, key, time and divisions in force where
// they start; repeats and endings taken out so it plays once through), a set's item (exercise/notation.ts writes
// it), or MusicXML given in the lesson.

import type { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import type { NoteEvent, Sound } from '../sound';
import { UnderStrip } from '../strip';

/** The bars a..b (printed numbers) of a one-part score, as a score of their own. Throws a sentence when it can't. */
export function excerptXml(xml: string, a: number, b: number): string {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('the score could not be read');
  const parts = [...doc.querySelectorAll('score-partwise > part')];
  if (!parts.length) throw new Error('the score has no part (only score-partwise files are read)');
  if (parts.length > 1) throw new Error(`the score has ${parts.length} parts; an excerpt is cut from a one-part (piano) score`);
  const part = parts[0];
  // What is in force where the excerpt starts: the last of each attribute before it.
  const kept: Record<string, Element> = {};
  const clefs = new Map<string, Element>();
  let first: Element | null = null;
  const inRange = (m: Element) => { const n = Number(m.getAttribute('number')); return Number.isInteger(n) && n >= a && n <= b; };
  for (const m of [...part.querySelectorAll(':scope > measure')]) {
    if (!first && inRange(m)) first = m;
    if (first) break;
    for (const at of m.querySelectorAll(':scope > attributes')) {
      for (const k of ['divisions', 'key', 'time', 'staves']) { const e = at.querySelector(`:scope > ${k}`); if (e) kept[k] = e.cloneNode(true) as Element; }
      for (const c of at.querySelectorAll(':scope > clef')) clefs.set(c.getAttribute('number') ?? '1', c.cloneNode(true) as Element);
    }
  }
  if (!first) throw new Error(`the score has no bar ${a}`);
  for (const m of [...part.querySelectorAll(':scope > measure')]) if (!inRange(m)) m.remove();
  // The excerpt's first bar starts with everything in force (its own attributes, if any, still follow and win).
  const head = doc.createElement('attributes');
  for (const k of ['divisions', 'key', 'time', 'staves']) if (kept[k]) head.append(kept[k]);
  for (const c of [...clefs.values()].sort((x, y) => (x.getAttribute('number') ?? '1').localeCompare(y.getAttribute('number') ?? '1'))) head.append(c);
  if (head.childElementCount) first.prepend(head);
  // Once through: no repeats or endings; no page or line breaks from the full score; no pickup marked implicit.
  for (const e of [...part.querySelectorAll('barline > repeat, barline > ending')]) e.remove();
  for (const e of [...part.querySelectorAll('print')]) e.remove();
  first.removeAttribute('implicit');
  for (const e of [...doc.querySelectorAll('credit, work, movement-title, identification')]) e.remove();
  return new XMLSerializer().serializeToString(doc);
}

type Osmd = OpenSheetMusicDisplay;
interface Step { t: number; midis: number[] }

let playingNow: MiniScore | null = null;

/** A little score in a lesson: drawn, played with the cursor moving, and the keys lit if it has a keyboard. */
export class MiniScore {
  private osmd: Osmd | null = null;
  private loaded = false;
  private steps: Step[] = [];
  private events: NoteEvent[] = [];
  private end = 0;
  private frame = 0;
  private at = -1;
  private strip: UnderStrip | null = null;
  private width = 0;
  onState: (playing: boolean) => void = () => {};

  constructor(private readonly box: HTMLElement, private readonly sound: Sound, private readonly prepare: () => Promise<void>, keyboard?: HTMLElement) {
    if (keyboard) this.strip = new UnderStrip(keyboard, keyboard, document.createElement('div'));
    new ResizeObserver(() => { if (this.loaded && this.box.clientWidth && Math.abs(this.box.clientWidth - this.width) > 4) this.render(); }).observe(box);
    // Turned: the room's height changed (drawn again; a block no longer on the page lets go of the window).
    // The page's room changed (a message came or went, the phone turned): drawn again to fit it.
    let roomH = 0;
    queueMicrotask(() => { const body = box.closest<HTMLElement>('.view-body'); if (body) new ResizeObserver(() => { if (this.loaded && body.clientHeight && Math.abs(body.clientHeight - roomH) > 8) { roomH = body.clientHeight; this.render(); } }).observe(body); });
    const turned = () => { if (!this.box.isConnected) { window.removeEventListener('resize', turned); return; } if (this.loaded && this.box.clientWidth) this.render(); };
    window.addEventListener('resize', turned);
  }

  /** Draws the music (MusicXML of the excerpt); tempo: quarter notes a minute (else the score's own, else 80). */
  async load(xml: string, tempo?: number): Promise<void> {
    const { OpenSheetMusicDisplay } = await import('opensheetmusicdisplay');
    this.osmd = new OpenSheetMusicDisplay(this.box, {
      autoResize: false, backend: 'svg', drawTitle: false, drawSubtitle: false, drawComposer: false, drawLyricist: false, drawCredits: false,
      drawPartNames: false, drawMeasureNumbers: true, drawingParameters: 'compacttight', followCursor: false,
    });
    await this.osmd.load(xml);
    this.loaded = true;
    this.render();
    this.timeline(tempo);
    this.window = null;
    this.follow(0);
  }

  /**
   * Drawn to its box (review 2026-10-15, V14, V15): a short line is drawn larger to fill a fair share of the width (up
   * to the score's biggest size); and the music, with its play bar and keys, fits the room between the lesson's header
   * and bottom bar (a phone sideways), drawn smaller if need be, so the marker and the lit keys are seen together.
   */
  private render(): void {
    const o = this.osmd!;
    this.width = this.box.clientWidth;
    let zoom = this.width < 420 ? 0.75 : 0.95;
    o.zoom = zoom;
    o.render();
    const svg = () => this.box.querySelector('svg');
    const content = () => { const g = svg(); if (!g) return { w: 0, h: 0 }; const b = g.getBBox(); return { w: b.width * zoom / o.zoom, h: g.getBoundingClientRect().height }; };
    const c = content();
    if (c.w > 0 && c.w < this.width * 0.55) { zoom = Math.min(1.6, zoom * (this.width * 0.7) / c.w); o.zoom = zoom; o.render(); }
    // The room: the page's scrolling body, less the play bar and the keys under the music.
    const body = this.box.closest<HTMLElement>('.view-body'), playBar = this.box.parentElement?.querySelector<HTMLElement>('.les-score-bar');
    const keys = this.box.parentElement?.querySelector<HTMLElement>('.les-keys');
    const room = (body?.clientHeight ?? window.innerHeight - 110) - (playBar?.offsetHeight ?? 52) - (keys?.offsetHeight ?? 0) - 20;
    const h = svg()?.getBoundingClientRect().height ?? 0;
    if (room > 60 && h > room) { zoom = Math.max(0.4, zoom * room / h); o.zoom = zoom; o.render(); }
    if (this.at >= 0) { this.at = -1; } // (a redraw puts the cursor back; the next frame finds its place again)
  }

  /** Every moment a note starts, in ms at the tempo, from OSMD's cursor (ties are one note; grace notes left out). */
  private timeline(tempo?: number): void {
    const o = this.osmd!, cursor = o.cursor;
    cursor.show();
    cursor.reset();
    const raw: { ts: number; notes: { midi: number; len: number }[] }[] = [];
    let bpm = 0;
    for (let guard = 0; !cursor.Iterator.EndReached && guard < 5000; guard++) {
      const it = cursor.Iterator;
      if (!bpm && it.CurrentBpm) bpm = it.CurrentBpm;
      const notes: { midi: number; len: number }[] = [];
      for (const n of cursor.NotesUnderCursor()) {
        const p = n.Pitch, tie = n.NoteTie;
        if (!p || n.isRest() || n.IsGraceNote || (tie && tie.StartNote !== n)) continue;
        notes.push({ midi: (p.Octave + 4) * 12 + p.FundamentalNote + p.AccidentalHalfTones, len: (tie ? tie.Duration : n.Length).RealValue });
      }
      raw.push({ ts: it.CurrentEnrolledTimestamp.RealValue, notes });
      cursor.next();
    }
    cursor.reset();
    cursor.hide();
    const q = tempo ?? (bpm || 80), wholeMs = (4 * 60000) / q;
    this.steps = raw.map((r) => ({ t: r.ts * wholeMs, midis: r.notes.map((n) => n.midi) }));
    this.events = raw.flatMap((r) => r.notes.map((n) => ({ t: r.ts * wholeMs, dur: Math.max(60, n.len * wholeMs - 20), midi: n.midi, vel: 80 })));
    this.end = Math.max(0, ...this.events.map((e) => e.t + e.dur));
  }

  /**
   * The keys follow the notes (owner, 2026-10-15): only the range in use, a little wider (whole octaves, C to C, two at
   * least), moving when the music moves out of it: the notes now and in the next few moments are always on the keys.
   */
  private window: { lo: number; hi: number } | null = null;
  private follow(k: number): void {
    if (!this.strip) return;
    const near = this.steps.slice(k, k + 4).flatMap((s) => s.midis);
    if (!near.length) return;
    const lo = Math.min(...near), hi = Math.max(...near);
    if (this.window && lo >= this.window.lo && hi <= this.window.hi) return;
    this.strip.setSong([lo, hi]); // (whole octaves around them, two at least: the strip's own rule)
    this.window = this.strip.shown;
  }

  get playing(): boolean { return playingNow === this; }

  async play(): Promise<void> {
    if (!this.osmd || !this.events.length) return;
    playingNow?.stop();
    playingNow = this;
    this.onState(true);
    await this.prepare();
    if (playingNow !== this) return; // stopped while the piano got ready
    this.sound.play(this.events, [], -200, 1);
    this.at = -1;
    this.osmd.cursor.reset();
    this.osmd.cursor.show();
    const tick = () => {
      if (playingNow !== this) return;
      const t = this.sound.songTime();
      if (t > this.end + 150 || !this.sound.playing) { this.stop(); return; }
      let k = this.at < 0 ? 0 : this.at;
      while (k + 1 < this.steps.length && this.steps[k + 1].t <= t) k++;
      if (t >= 0 && k !== this.at) {
        if (this.at < 0 || k < this.at) { this.osmd!.cursor.reset(); for (let i = 0; i < k; i++) this.osmd!.cursor.next(); }
        else for (let i = this.at; i < k; i++) this.osmd!.cursor.next();
        this.at = k;
        this.follow(k);
        this.strip?.markKeys('now-r', this.steps[k].midis);
      }
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  stop(): void {
    if (playingNow !== this) return;
    playingNow = null;
    cancelAnimationFrame(this.frame);
    this.sound.stop();
    this.at = -1;
    try { this.osmd?.cursor.reset(); this.osmd?.cursor.hide(); } catch { /* not drawn */ }
    this.strip?.markKeys('now-r', []);
    this.window = null;
    this.follow(0);
    this.onState(false);
  }

  /** For checks: the moments it plays (ms) and their keys. */
  debug(): Step[] { return this.steps; }
}

/** Whatever little score is playing stops (the page is left). */
export function stopMiniScores(): void { playingNow?.stop(); }
