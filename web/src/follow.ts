// Following: the song laid out so the next music is always in view while a marker moves through it.
//
// When a song opens, the whole play order is worked out first (OSMD's cursor, which follows repeats): for every
// step, when it sounds (with the score's tempo changes) and which bar and beat it is. Then:
// - Slot layouts (Turn, Rolling): the music is cut into chunks (Lines: auto = as many of the page's lines as fit
//   in a slot; the file's lines; or 1/2/3/4/6 bars), and each chunk is drawn on its own by OSMD (only its bars),
//   once. Slots split the screen evenly and show their chunk centred. A chunk never wraps: when its bars do not
//   fit across, it is drawn as one line and shrunk to fit (owner, 2026-10-11).
// - One-line layouts (Smooth, Glide): the song is drawn once as a single line and scrolled sideways.
// Playback reads the step list from one clock; nothing is redrawn while the marker moves.

import { ChordSymbolContainer, OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { osmdOptions, prepareXml, SIDE_MARGIN_SHARE } from './scoreView';
import type { Layout, Marker, MarkerFollows, ScoreSettings } from './settings';
import type { Beat, NoteEvent } from './sound';

const SVGNS = 'http://www.w3.org/2000/svg';
const UNIT = 10; // OSMD draws 10 px per staff space at zoom 1
const GLIDE_AT = 0.7; // still-then-glide: reaching 70% across starts the glide...
const GLIDE_TO = 0.2; // ...which brings the marker back to 20% across...
const GLIDE_MS = 300; // ...in this long (owner: faster than the first 600 ms)
const TAP_REACH = 24; // screen px, about a fingertip: how far from a note a tap still picks it

export const isStrip = (l: Layout) => l === 'smooth' || l === 'glide';

/** Where a step's notes are, in the pixels of the drawing they belong to. */
/** One staff's (one hand's) notes starting at a step: where they are, their SVG ids, and how long they last. */
interface StaffPos { staff: number; left: number; right: number; top: number; height: number; ids: string[]; len: number; notes: Pitch[]; chords: string[] }
/**
 * A sounding pitch: MIDI number, written name (letters + octave, middle C = C4), its plain spelling (F#4), and
 * how long it sounds in whole notes (tied notes added up; 0 for the later notes of a tie and for grace notes,
 * which the piano does not strike).
 */
export interface Pitch { midi: number; name: string; spelled: string; len: number; x?: number; y?: number }
/**
 * For the strip under the music: per staff (0 = top staff, right hand), what sounds now and what starts next,
 * and the chord symbol the file gives for this moment, if any.
 */
export interface StepNotes { now: Pitch[][]; next: Pitch[][]; fileChord: string }

/**
 * How loud each written dynamic plays (MIDI velocity): MuseScore's playback defaults, the usual reference in
 * notation software. Marks not listed (sfz, fp, ...) use OSMD's own value.
 */
// Keyed by OSMD's DynamicEnum (not exported): ppp = 3, pp = 4, p = 5, mp = 6, mf = 7, f = 8, ff = 9, fff = 10.
const DYNAMIC_VELOCITY: Record<number, number> = { 3: 16, 4: 33, 5: 49, 6: 64, 7: 80, 8: 96, 9: 112, 10: 126 };
const DEFAULT_VELOCITY = 80; // mf, before the first dynamic

const LETTERS: Record<number, string> = { 0: 'C', 2: 'D', 4: 'E', 5: 'F', 7: 'G', 9: 'A', 11: 'B' };
const ACCIDENTALS: Record<number, string> = { [-2]: '𝄫', [-1]: '♭', 0: '', 1: '♯', 2: '𝄪' };
const PLAIN_ACCIDENTALS: Record<number, string> = { [-2]: 'bb', [-1]: 'b', 0: '', 1: '#', 2: '##' };

/** OSMD pitches count octaves from middle C = octave 1, letters as 0-11 semitones, accidentals in semitones. */
function pitchOf(p: { FundamentalNote: number; AccidentalHalfTones: number; Octave: number }, len: number): Pitch {
  return {
    len,
    midi: (p.Octave + 4) * 12 + p.FundamentalNote + p.AccidentalHalfTones,
    name: `${LETTERS[p.FundamentalNote] ?? '?'}${ACCIDENTALS[p.AccidentalHalfTones] ?? ''}${p.Octave + 3}`,
    spelled: `${LETTERS[p.FundamentalNote] ?? '?'}${PLAIN_ACCIDENTALS[p.AccidentalHalfTones] ?? ''}${p.Octave + 3}`,
  };
}
/** Where a step's notes are, in the pixels of the drawing they belong to: all staves together, and each staff. */
interface Pos { left: number; right: number; top: number; height: number; ids: string[]; staves: StaffPos[] }
/** held[staff] = the step whose note that staff is sounding at this step (it may have started earlier). */
interface Step { t: number; ts: number; bpm: number; m: number; rel: number; vels: number[]; chunk: number; occ: number; pos: Pos; held: number[]; fileChord: string }
/** A slot's drawing; all in screen px. staffTop/staffBottom: from the first staff's top line to the last staff's bottom line. */
interface Chunk { svg: SVGSVGElement; w: number; top: number; h: number; staffTop: number; staffBottom: number }
interface Slot { el: HTMLDivElement; piece: HTMLDivElement; o: number; h: number }
type O = OpenSheetMusicDisplay;

export class FollowView {
  private readonly source: HTMLDivElement; // off-screen: where OSMD draws
  private layout: Layout = 'turn';
  private marker: Marker = 'bar';
  private markerFollows: MarkerFollows = 'split';
  private zoom = 1;
  private chunks: Chunk[] = [];
  private steps: Step[] = [];
  private occ: number[] = []; // play-order occurrences of chunks: occ[q] = the chunk shown for occurrence q
  private current = 0;
  private stripW = 0;
  private stripH = 0;
  private slots: Slot[] = [];
  private turn = { top: 0, bottom: 1, k: 1 };
  private roll: number[] = [];
  private browsing = -1; // paged by swiping while paused: the first occurrence shown; -1 = following the marker
  private scroller: HTMLDivElement | null = null;
  private colored: SVGElement[] = [];
  private tween = 0;
  private generation = 0;
  private startPerf = 0; // performance.now() at which step 0 would have sounded, at the current speed
  private frame = 0;
  private speed = 1;
  private endT = 0; // ms at speed 1 when the song's last note ends
  private measures: { beats: number; beatLen: number; dur: number; pickup: boolean; num: number }[] = [];
  /** While sound plays, the marker follows its clock (song ms at speed 1) instead of its own. */
  songClock: (() => number) | null = null;
  private glideUntil = 0; // performance.now() when the running glide finishes
  playing = false;
  onStop: () => void = () => {};
  /** Called when play(untilStep) gets there. */
  onReached: () => void = () => {};
  private untilStep = -1;
  /** Called whenever the marker moves: the notes for the strip under the music. */
  onStep: (notes: StepNotes) => void = () => {};

  /** Every pitch in the song (for the keyboard's range). */
  get songPitches(): number[] {
    return [...new Set(this.steps.flatMap((s) => s.pos.staves.flatMap((st) => st.notes.map((n) => n.midi))))];
  }

  constructor(private readonly host: HTMLElement, private readonly onError: (message: string) => void) {
    this.source = document.createElement('div');
    this.source.className = 'osmd-source';
    this.source.setAttribute('aria-hidden', 'true');
    document.body.append(this.source);
  }

  /** The song's first tempo (beats per minute), before the speed setting. */
  get baseBpm(): number { return this.steps[0]?.bpm ?? 80; }
  /** Where the marker is, as a timestamp that survives a re-layout. */
  get position(): number | undefined { return this.steps[this.current]?.ts; }

  // ---- opening a song --------------------------------------------------------------------------------

  /** Lays a song out. ready() runs once the steps are known, before the first marker is drawn. */
  async show(xml: string, s: ScoreSettings, keepTs?: number, ready: () => void = () => {}): Promise<void> {
    const generation = ++this.generation; // a newer call wins over an older one
    this.pause();
    this.layout = s.layout;
    this.marker = s.marker;
    this.markerFollows = s.markerFollows;
    this.speed = s.speed;
    this.zoom = s.size;
    const strip = isStrip(s.layout);
    const drawn: ScoreSettings = { ...s, lines: strip ? 'auto' : s.lines };
    try {
      this.source.replaceChildren();
      this.source.style.width = `${this.host.clientWidth}px`;
      const o = new OpenSheetMusicDisplay(this.source, osmdOptions(drawn, strip ? 'strip' : 'page'));
      await o.load(prepareXml(xml, drawn));
      if (generation !== this.generation) return;
      o.zoom = this.zoom;
      const margin = (this.host.clientWidth * SIDE_MARGIN_SHARE) / (UNIT * this.zoom);
      o.EngravingRules.PageLeftMargin = margin;
      o.EngravingRules.PageRightMargin = margin;
      o.render();
      const raw = this.playOrder(o);
      this.measures = o.Sheet.SourceMeasures.map((sm) => ({
        beats: sm.ActiveTimeSignature?.Numerator ?? 4,
        beatLen: 1 / (sm.ActiveTimeSignature?.Denominator ?? 4),
        dur: sm.Duration.RealValue,
        pickup: sm.ImplicitMeasure,
        num: sm.MeasureNumber,
      }));
      const where = new Map<string, Pos>(); // the same bar and beat comes round again in repeats
      const key = (m: number, rel: number) => `${m}:${rel}`;
      const chunkOf: number[] = [];
      this.chunks = [];
      if (strip) {
        const svg = this.source.querySelector('svg')!;
        svg.id = 'score-src';
        const box = svg.getBoundingClientRect();
        this.stripW = box.width;
        this.stripH = box.height;
        for (const r of raw) if (!where.has(key(r.m, r.rel))) where.set(key(r.m, r.rel), this.locate(o, r.m, r.rel));
      } else {
        const ranges = this.chunkRanges(o, s, this.host.clientHeight / s.slots);
        const rules = o.EngravingRules;
        ranges.forEach(([a, b], i) => {
          rules.MinMeasureToDrawIndex = a;
          rules.MaxMeasureToDrawIndex = b;
          // With a pickup bar, OSMD's render() takes the range from the bar-number rules instead (pickup = bar 0).
          rules.MinMeasureToDrawNumber = a;
          rules.MaxMeasureToDrawNumber = b;
          rules.StretchLastSystemLine = i < ranges.length - 1; // a full-width line, as on the page; the song's last line as drawn
          rules.RenderSingleHorizontalStaffline = false;
          o.render();
          if (s.lines !== 'auto' && o.GraphicSheet.MusicPages[0].MusicSystems.length > 1) {
            rules.RenderSingleHorizontalStaffline = true; // never wrap: one line, shrunk to fit in fill()
            rules.StretchLastSystemLine = false; // otherwise the one line is stretched to OSMD's maximum width
            o.render();
          }
          const svg = this.source.querySelector('svg')!.cloneNode(true) as SVGSVGElement;
          const systems = o.GraphicSheet.MusicPages[0].MusicSystems;
          const boxes = systems.map((sys) => this.systemBox(sys));
          const firstStaff = systems[0].StaffLines[0], lastStaff = systems[systems.length - 1].StaffLines.at(-1)!;
          const staffTop = this.px(firstStaff.PositionAndShape.AbsolutePosition.y);
          const staffBottom = this.px(lastStaff.PositionAndShape.AbsolutePosition.y + rules.StaffHeight);
          const top = Math.min(...boxes.map((x) => x.top));
          const h = Math.max(...boxes.map((x) => x.top + x.height)) - top;
          // A one-line drawing is as wide as its music (plus the side margin), not the whole drawing area.
          const right = Math.max(...(o.GraphicSheet.MeasureList[b] ?? []).filter(Boolean)
            .map((gm) => this.px(gm.PositionAndShape.AbsolutePosition.x + gm.PositionAndShape.BorderRight + margin)));
          const w = Math.max(this.host.clientWidth, right);
          // Made ready for a slot now, so playing never builds a drawing. A copy of OSMD's <svg> keeps its inner
          // units, which are unzoomed (OSMD applies the notation size as the SVG's scale): the view is cut in
          // screen px / size.
          const z = this.zoom;
          svg.setAttribute('viewBox', `0 ${top / z} ${w / z} ${h / z}`);
          svg.setAttribute('width', String(w));
          svg.setAttribute('height', String(h));
          svg.style.width = `${w}px`;
          svg.style.height = `${h}px`;
          this.chunks.push({ svg, w, top, h, staffTop, staffBottom });
          for (let m = a; m <= b; m++) chunkOf[m] = i;
          for (const r of raw) if (r.m >= a && r.m <= b && !where.has(key(r.m, r.rel))) where.set(key(r.m, r.rel), this.locate(o, r.m, r.rel));
        });
        this.source.replaceChildren(); // each slot has its own copy now
      }
      // Loudness from the written dynamics: the last dynamic before a note, or along a crescendo / diminuendo a
      // ramp to the next written dynamic after it ends. Each hand follows the dynamics written on its own
      // staff; until a staff has one of its own, it follows the other's (so dynamics written once apply to both).
      type Mark = { ts: number; staff: number; vel: number };
      type Ramp = { from: number; to: number; staff: number };
      const marks: Mark[] = [], ramps: Ramp[] = [];
      for (const sm of o.Sheet.SourceMeasures) sm.StaffLinkedExpressions.forEach((exprs, staff) => {
        for (const me of exprs) {
          const ts = me.AbsoluteTimestamp.RealValue;
          const inst = me.InstantaneousDynamic;
          if (inst) marks.push({ ts, staff, vel: DYNAMIC_VELOCITY[inst.DynEnum] ?? Math.round(inst.MidiVolume) });
          const ramp = me.StartingContinuousDynamic;
          if (ramp?.EndMultiExpression) ramps.push({ from: ts, to: ramp.EndMultiExpression.AbsoluteTimestamp.RealValue, staff });
        }
      });
      marks.sort((a, b) => a.ts - b.ts);
      const velocityAt = (ts: number, staff: number): number => {
        const own = marks.filter((d) => d.staff === staff);
        const useOwn = own.some((d) => d.ts <= ts + 1e-9);
        const pool = useOwn ? own : marks;
        const before = [...pool].reverse().find((d) => d.ts <= ts + 1e-9);
        const v0 = before?.vel ?? DEFAULT_VELOCITY;
        const ramp = ramps.find((r) => (useOwn ? r.staff === staff : true) && ts > r.from + 1e-9 && ts < r.to - 1e-9 && (!before || before.ts <= r.from + 1e-9));
        if (!ramp) return v0;
        const target = pool.find((d) => d.ts >= ramp.to - 1e-9);
        if (!target) return v0;
        return Math.round(v0 + ((target.vel - v0) * (ts - ramp.from)) / (target.ts - ramp.from));
      };
      // When each step sounds at speed 1: from the next step's timestamp (whole notes) and the tempo in force.
      let t = 0, q = -1, prev = -1;
      this.occ = [];
      this.steps = raw.map((r, i) => {
        const chunk = chunkOf[r.m] ?? 0;
        if (chunk !== prev) { this.occ.push(chunk); q++; prev = chunk; }
        const step = { t, ts: r.ts, bpm: r.bpm, m: r.m, rel: r.rel, vels: [0, 1, 2, 3].map((staff) => velocityAt(o.Sheet.SourceMeasures[r.m].AbsoluteTimestamp.RealValue + r.rel, staff)), chunk, occ: q, pos: where.get(key(r.m, r.rel))!, held: [] as number[], fileChord: '' };
        const nextTs = i + 1 < raw.length ? raw[i + 1].ts : r.ts + r.len;
        t += Math.max(30, ((nextTs - r.ts) * 4 * 60000) / r.bpm);
        return step;
      });
      this.endT = t; // when the last note ends
      // Which note each staff is sounding at each step: its latest note that has not yet ended.
      const last: number[] = [];
      let chord = '';
      this.steps.forEach((step, i) => {
        // A chord symbol holds until the next one.
        const symbols = step.pos.staves.flatMap((st) => st.chords);
        if (symbols.length) chord = symbols.join(' ');
        step.fileChord = chord;
        for (const st of step.pos.staves) last[st.staff] = i;
        last.forEach((j, staff) => {
          const st = this.steps[j].pos.staves.find((x) => x.staff === staff)!;
          if (this.steps[j].ts + st.len > step.ts + 1e-9) step.held[staff] = j;
        });
      });
      this.build(s.slots);
      ready();
      this.current = keepTs === undefined ? 0 : this.nearestStep(keepTs);
      this.update();
    } catch (cause) {
      if (generation !== this.generation) return;
      this.onError(cause instanceof Error ? cause.message : String(cause));
    }
  }

  private px(v: number): number { return v * UNIT * this.zoom; }

  /** Top and height of a system (a line), with a little room. */
  private systemBox(sys: { PositionAndShape: { AbsolutePosition: { y: number }; BorderMarginTop: number; BorderMarginBottom: number } }) {
    const b = sys.PositionAndShape;
    const top = Math.max(0, this.px(b.AbsolutePosition.y + b.BorderMarginTop) - 2);
    return { top, height: this.px(b.AbsolutePosition.y + b.BorderMarginBottom) + 2 - top };
  }

  /** Where the notes sounding at bar m, beat rel are in the current drawing. */
  private locate(o: O, m: number, rel: number): Pos {
    const staves = o.GraphicSheet.MeasureList[m] ?? [];
    let left = Infinity, right = -Infinity;
    const ids: string[] = [];
    const perStaff: StaffPos[] = [];
    let sys = staves.find(Boolean)?.ParentMusicSystem;
    staves.forEach((gm, staff) => {
      if (!gm) return;
      // This staff's own box: its five lines, stretched to take in notes above or below them.
      const lineY = gm.ParentStaffLine.PositionAndShape.AbsolutePosition.y;
      const st: StaffPos = { staff, left: Infinity, right: -Infinity, top: this.px(lineY), height: 0, ids: [], len: 0, notes: [], chords: [] };
      let bottom = this.px(lineY + o.EngravingRules.StaffHeight);
      for (const se of gm.staffEntries) {
        if (Math.abs(se.relInMeasureTimestamp.RealValue - rel) > 1e-6) continue;
        sys = gm.ParentMusicSystem;
        for (const c of se.sourceStaffEntry?.ChordContainers ?? []) {
          st.chords.push(ChordSymbolContainer.calculateChordText(c, 0, undefined as never));
        }
        for (const gve of se.graphicalVoiceEntries) for (const n of gve.notes) {
          const b = n.PositionAndShape;
          st.left = Math.min(st.left, this.px(b.AbsolutePosition.x + b.BorderLeft));
          st.right = Math.max(st.right, this.px(b.AbsolutePosition.x + b.BorderRight));
          st.top = Math.min(st.top, this.px(b.AbsolutePosition.y + b.BorderTop));
          bottom = Math.max(bottom, this.px(b.AbsolutePosition.y + b.BorderBottom));
          st.len = Math.max(st.len, n.sourceNote.Length.RealValue);
          const pitch = n.sourceNote.Pitch; // none for a rest
          if (pitch && !n.sourceNote.isRest()) {
            const note = n.sourceNote, tie = note.NoteTie;
            const len = note.IsGraceNote || (tie && tie.StartNote !== note) ? 0 : (tie ? tie.Duration : note.Length).RealValue;
            st.notes.push({ ...pitchOf(pitch, len), x: this.px(b.AbsolutePosition.x), y: this.px(b.AbsolutePosition.y) });
          }
          const id = (n as unknown as { getSVGGElement?: () => SVGGElement | null }).getSVGGElement?.()?.id;
          if (id) { ids.push(id); st.ids.push(id); }
        }
      }
      if (!isFinite(st.left)) return; // nothing starts in this staff here
      st.top -= 4;
      st.height = bottom + 4 - st.top;
      left = Math.min(left, st.left);
      right = Math.max(right, st.right);
      perStaff.push(st);
    });
    if (!isFinite(left)) { // nothing found at that beat: the start of the bar
      const b = staves.find(Boolean)?.PositionAndShape;
      left = b ? this.px(b.AbsolutePosition.x) : 0;
      right = left + 10;
    }
    const box = sys ? this.systemBox(sys) : { top: 0, height: 0 };
    return { left, right, top: box.top, height: box.height, ids, staves: perStaff };
  }

  /** The play order: every step's bar, beat, timestamp and tempo, from OSMD's cursor (which follows repeats). */
  private playOrder(o: O) {
    const cursor = o.cursor;
    cursor.show();
    cursor.hide(); // only its iterator is used; the marker is drawn here
    cursor.reset();
    const raw: { ts: number; bpm: number; m: number; rel: number; len: number }[] = [];
    for (let guard = 0; !cursor.Iterator.EndReached && guard < 20000; guard++) {
      const it = cursor.Iterator;
      // len: the longest note starting here (whole notes), which is how long the song's last step lasts.
      const len = Math.max(0, ...cursor.NotesUnderCursor().map((n) => n.Length.RealValue));
      raw.push({ ts: it.CurrentEnrolledTimestamp.RealValue, bpm: it.CurrentBpm || 80, m: it.CurrentMeasureIndex, rel: it.CurrentRelativeInMeasureTimestamp.RealValue, len });
      cursor.next();
    }
    cursor.reset();
    return raw;
  }

  /** Bar ranges [first, last] for the slots. */
  private chunkRanges(o: O, s: ScoreSettings, slotH: number): [number, number][] {
    const measures = o.Sheet.SourceMeasures;
    const starts: number[] = [0];
    if (s.lines === 'auto') {
      // As many of the page's lines as fit in one slot (at least one).
      const systems = o.GraphicSheet.MusicPages[0].MusicSystems;
      const boxes = systems.map((sys) => this.systemBox(sys));
      const firstOf = systems.map(() => -1);
      o.GraphicSheet.MeasureList.forEach((staves, i) => {
        const k = systems.indexOf(staves.find(Boolean)!.ParentMusicSystem);
        if (k >= 0 && firstOf[k] < 0) firstOf[k] = i;
      });
      let from = 0;
      for (let k = 1; k < systems.length; k++) {
        if (boxes[k].top + boxes[k].height - boxes[from].top > slotH) { starts.push(firstOf[k]); from = k; }
      }
    } else {
      // A new chunk at each line break in the drawn copy: the file's own, or prepareXml's (bars 1 + n, 1 + 2n, ...).
      measures.forEach((sm, i) => { if (i > 0 && sm.printNewSystemXml) starts.push(i); });
    }
    return starts.map((st, i) => [st, (starts[i + 1] ?? measures.length) - 1]);
  }

  private nearestStep(ts: number): number {
    let best = 0;
    for (let i = 0; i < this.steps.length; i++) if (Math.abs(this.steps[i].ts - ts) < Math.abs(this.steps[best].ts - ts)) best = i;
    return best;
  }

  // ---- slots and the one-line strip -----------------------------------------------------------------

  private build(slotCount: number): void {
    this.host.replaceChildren();
    this.slots = [];
    this.scroller = null;
    this.browsing = -1;
    this.host.classList.toggle('strip', isStrip(this.layout));
    if (!isStrip(this.layout)) {
      const h = this.host.clientHeight / slotCount;
      for (let i = 0; i < slotCount; i++) {
        const el = document.createElement('div');
        el.className = 'slot';
        el.style.top = `${i * h}px`;
        el.style.height = `${h}px`;
        const piece = document.createElement('div');
        piece.className = 'piece';
        el.append(piece);
        this.host.append(el);
        this.slots.push({ el, piece, o: -1, h });
      }
      this.resetSlots();
    } else {
      const sc = document.createElement('div');
      sc.className = 'scroller';
      const inner = document.createElement('div');
      inner.className = 'inner';
      inner.style.width = `${this.stripW}px`;
      inner.style.height = `${this.stripH}px`;
      inner.style.marginTop = `${Math.max(0, (this.host.clientHeight - this.stripH) / 2)}px`;
      const svg = document.createElementNS(SVGNS, 'svg') as SVGSVGElement;
      const use = document.createElementNS(SVGNS, 'use');
      use.setAttribute('href', '#score-src');
      svg.append(use);
      // <use> shows OSMD's whole <svg> at its own (already sized) width and height, so this view is in screen px.
      svg.setAttribute('viewBox', `0 0 ${this.stripW} ${this.stripH}`);
      svg.setAttribute('width', String(this.stripW));
      svg.setAttribute('height', String(this.stripH));
      inner.append(svg);
      sc.append(inner);
      this.host.append(sc);
      this.scroller = sc;
      if (this.layout === 'glide') {
        const zone = document.createElement('div');
        zone.className = 'glide-zone';
        zone.style.left = `${GLIDE_AT * 100}%`;
        this.host.append(zone);
      }
    }
  }

  /** Slots start over from the marker: every slot filled with what comes next. */
  private resetSlots(): void {
    const k = this.slots.length / 2;
    this.turn = { k, top: -999, bottom: -999 };
    this.roll = this.slots.map(() => Number.MAX_SAFE_INTEGER);
  }

  /** Which occurrence each slot holds, for the current step. */
  private assign(q: number): number[] {
    const last = this.occ.length - 1;
    if (this.layout === 'turn') {
      const t = this.turn, k = t.k;
      const inTop = q >= t.top && q < t.top + k, inBottom = q >= t.bottom && q < t.bottom + k;
      if (inBottom && t.top < t.bottom && t.bottom + k <= last) t.top = t.bottom + k;
      else if (inTop && t.bottom < t.top && t.top + k <= last) t.bottom = t.top + k;
      else if (!inTop && !inBottom) {
        const start = Math.max(0, Math.min(q, this.occ.length - 2 * k)); // jumped: restart with every slot filled
        t.top = start; t.bottom = start + k;
      }
      return [...Array(k).keys()].map((i) => t.top + i).concat([...Array(k).keys()].map((i) => t.bottom + i));
    }
    const n = this.roll.length;
    for (let j = 0; j < n; j++) {
      let s = this.roll[j];
      if (s > q + n - 1) s = q + (((j - q) % n) + n) % n;               // jumped back: refill from here
      if (s < q) { const next = s + n * Math.ceil((q - s) / n); if (next <= last) s = next; } // finished: the next unseen
      this.roll[j] = s;
    }
    return this.roll.slice();
  }

  /** Puts chunk c into a slot: its own drawing, centred, made smaller only if it would not fit. */
  private fill(slot: Slot, c: number): void {
    const ch = this.chunks[c];
    const width = this.host.clientWidth;
    const scale = Math.min(1, slot.h / ch.h, width / ch.w);
    // The drawing made ready when the song opened; a copy only if another slot shows it (the same music twice).
    const svg = ch.svg.isConnected ? (ch.svg.cloneNode(true) as SVGSVGElement) : ch.svg;
    slot.piece.replaceChildren(svg);
    slot.piece.style.width = `${ch.w}px`;
    slot.piece.style.height = `${ch.h}px`;
    slot.piece.style.left = `${(width - ch.w * scale) / 2}px`;
    // Centred on the staves, not on everything drawn, so the staves sit at the same height in every slot
    // whatever marks are above or below them; moved only as far as needed to keep all of it in the slot.
    const centre = slot.h / 2 - ((ch.staffTop + ch.staffBottom) / 2 - ch.top) * scale;
    const room = Math.max(0, slot.h - ch.h * scale); // spare height around the whole drawing
    slot.piece.style.top = `${Math.min(room, Math.max(0, centre))}px`;
    slot.piece.style.transform = scale < 1 ? `scale(${scale})` : '';
  }

  private placeSlots(q: number): void {
    const want = this.browsing >= 0 ? this.slots.map((_, i) => this.browsing + i) : this.assign(q);
    this.slots.forEach((slot, i) => {
      const o = want[i] ?? -1;
      if (o < 0 || o >= this.occ.length) { // past the end: keep what it shows (an empty slot only when browsing)
        if (slot.o < 0 || this.browsing >= 0) { slot.piece.replaceChildren(); slot.o = -1; }
        return;
      }
      if (slot.o === o) return;
      if (slot.o < 0 || this.occ[slot.o] !== this.occ[o] || !slot.piece.firstChild) this.fill(slot, this.occ[o]);
      slot.o = o;
    });
  }

  private glideTo(target: number, ms: number): void {
    const sc = this.scroller!;
    target = Math.max(0, Math.min(sc.scrollWidth - sc.clientWidth, target));
    cancelAnimationFrame(this.tween);
    const from = sc.scrollLeft;
    if (Math.abs(target - from) < 1) return;
    if (ms <= 0) { sc.scrollLeft = target; return; }
    const start = performance.now();
    const stepFrame = (now: number) => {
      const f = Math.min(1, (now - start) / ms);
      const e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2; // ease in and out
      sc.scrollLeft = from + (target - from) * e;
      if (f < 1) this.tween = requestAnimationFrame(stepFrame);
    };
    this.tween = requestAnimationFrame(stepFrame);
  }

  private followStrip(p: Pos): void {
    const w = this.host.clientWidth, sl = this.scroller!.scrollLeft;
    if (this.layout === 'smooth') { if (!this.playing) this.glideTo(p.left - w / 3, 300); }
    else if (performance.now() < this.glideUntil && p.left >= sl && p.right <= sl + w) return; // let a running glide finish
    else if (p.right > sl + w * GLIDE_AT || p.left < sl) { this.glideTo(p.left - w * GLIDE_TO, GLIDE_MS); this.glideUntil = performance.now() + GLIDE_MS; }
  }

  // ---- showing a step ---------------------------------------------------------------------------------

  private update(): void {
    const s = this.steps[this.current];
    if (!s) return;
    if (this.slots.length) this.placeSlots(s.occ);
    else this.followStrip(s.pos);
    this.drawMarker(s);
    const staffNotes = (pick: (staff: number) => Pitch[]) => [0, 1, 2, 3].map(pick).slice(0, Math.max(s.held.length, 2));
    const nextStep = this.steps[this.current + 1];
    this.onStep({
      now: staffNotes((staff) => {
        const j = s.held[staff];
        return j === undefined ? [] : this.steps[j].pos.staves.find((x) => x.staff === staff)!.notes;
      }),
      next: staffNotes((staff) => nextStep?.pos.staves.find((x) => x.staff === staff)?.notes ?? []),
      fileChord: s.fileChord,
    });
  }

  setMarker(marker: Marker, follows: MarkerFollows): void { this.marker = marker; this.markerFollows = follows; this.update(); }

  /**
   * The marker, as chosen (owner, 2026-10-11): split = one per staff (hand), on the note that staff is sounding
   * now for as long as it lasts; ahead = one across the staves at the newest notes; behind = one across the
   * staves at the oldest note still sounding.
   */
  private drawMarker(s: Step): void {
    this.host.querySelectorAll('.mark').forEach((m) => m.remove());
    for (const el of this.colored) { el.style.removeProperty('fill'); el.style.removeProperty('stroke'); }
    this.colored = [];
    const held = s.held.flatMap((j, staff) => (j === undefined ? [] : [{ from: this.steps[j], st: this.steps[j].pos.staves.find((x) => x.staff === staff)! }]));
    let bars: { from: Step; left: number; right: number; top: number; height: number }[];
    let lit: { from: Step; ids: string[] }[];
    if (this.markerFollows === 'split') {
      bars = held.map(({ from, st }) => ({ from, left: st.left, right: st.right, top: st.top, height: st.height }));
      lit = held.map(({ from, st }) => ({ from, ids: st.ids }));
    } else if (this.markerFollows === 'ahead' || !held.length) {
      bars = [{ from: s, left: s.pos.left, right: s.pos.right, top: s.pos.top, height: s.pos.height }];
      lit = [{ from: s, ids: s.pos.ids }];
    } else {
      const oldest = held.reduce((a, b) => (b.from.t < a.from.t ? b : a));
      bars = [{ from: oldest.from, left: oldest.st.left, right: oldest.st.right, top: oldest.from.pos.top, height: oldest.from.pos.height }];
      lit = held.map(({ from, st }) => ({ from, ids: st.ids }));
    }
    // Each goes in the drawing its note is in: the slot showing its occurrence, or the one-line drawing.
    const place = (from: Step) => {
      const slot = this.slots.find((x) => x.o === from.occ);
      if (this.slots.length && !slot) return null;
      const holder = slot ? slot.piece : (this.scroller?.firstElementChild as HTMLElement | null);
      return holder && { holder, root: (slot ? slot.piece : this.source) as ParentNode, top: slot ? this.chunks[from.chunk].top : 0 };
    };
    if (this.marker !== 'notes') for (const b of bars) {
      const at = place(b.from);
      if (!at) continue;
      const m = document.createElement('div');
      m.className = 'mark';
      m.style.left = `${b.left - 4}px`;
      m.style.width = `${b.right - b.left + 8}px`;
      m.style.top = `${b.top - at.top}px`;
      m.style.height = `${b.height}px`;
      at.holder.append(m);
    }
    if (this.marker !== 'bar') for (const l of lit) {
      const at = place(l.from);
      if (!at) continue;
      for (const id of l.ids) {
        const g = at.root.querySelector(`[id="${CSS.escape(id)}"]`);
        if (g) for (const path of g.querySelectorAll('path')) {
          (path as SVGElement).style.fill = 'var(--mark-edge)';
          (path as SVGElement).style.stroke = 'var(--mark-edge)';
          this.colored.push(path as SVGElement);
        }
      }
    }
  }

  // ---- moving around while paused ---------------------------------------------------------------------

  /** Pages the slots forward (1) or back (-1) by a screenful, without moving the marker. */
  browse(dir: 1 | -1): void {
    if (this.playing || !this.slots.length) return;
    const n = this.slots.length;
    const shown = this.slots.map((x) => x.o).filter((o) => o >= 0);
    const from = this.browsing >= 0 ? this.browsing : shown.length ? Math.min(...shown) : 0;
    const next = Math.max(0, Math.min(from + dir * n, Math.max(0, this.occ.length - 1)));
    if (next === from && this.browsing >= 0) return;
    this.browsing = next;
    this.update();
  }

  /** The step whose notes are under a tap at screen point (x, y), or -1. */
  hit(x: number, y: number): number {
    let best = -1, bestDist = Infinity;
    const consider = (i: number, px: number, py: number, scale: number) => {
      const p = this.steps[i].pos;
      if (py < p.top || py > p.top + p.height) return;
      const d = (px < p.left ? p.left - px : px > p.right ? px - p.right : 0) * scale;
      if (d <= TAP_REACH && d < bestDist) { best = i; bestDist = d; }
    };
    if (this.slots.length) {
      for (const slot of this.slots) {
        const r = slot.el.getBoundingClientRect();
        if (slot.o < 0 || y < r.top || y > r.bottom) continue;
        const ch = this.chunks[this.occ[slot.o]];
        const pr = slot.piece.getBoundingClientRect();
        const scale = pr.width / ch.w;
        const px = (x - pr.left) / scale, py = (y - pr.top) / scale + ch.top;
        this.steps.forEach((s, i) => { if (s.occ === slot.o) consider(i, px, py, scale); });
      }
    } else if (this.scroller) {
      const r = (this.scroller.firstElementChild as HTMLElement).getBoundingClientRect();
      this.steps.forEach((_, i) => consider(i, x - r.left, y - r.top, 1));
    }
    return best;
  }

  /** Marks: the note nearest a tap at screen point (x, y) within reach: its bar, beat and key, or null. */
  hitNote(x: number, y: number): { m: number; rel: number; midi: number; label: string } | null {
    let best: { m: number; rel: number; midi: number; label: string } | null = null, bestD = Infinity;
    const consider = (s: Step, px: number, py: number, scale: number) => {
      for (const st of s.pos.staves) for (const n of st.notes) {
        if (n.x === undefined || n.y === undefined) continue;
        const d = Math.hypot(n.x - px, n.y - py) * scale;
        if (d <= TAP_REACH && d < bestD) { bestD = d; best = { m: s.m, rel: s.rel, midi: n.midi, label: `${n.name}, bar ${this.measures[s.m]?.num ?? s.m}` }; }
      }
    };
    if (this.slots.length) {
      for (const slot of this.slots) {
        const r = slot.el.getBoundingClientRect();
        if (slot.o < 0 || y < r.top || y > r.bottom) continue;
        const ch = this.chunks[this.occ[slot.o]];
        const pr = slot.piece.getBoundingClientRect();
        const scale = pr.width / ch.w;
        for (const s of this.steps) if (s.occ === slot.o) consider(s, (x - pr.left) / scale, (y - pr.top) / scale + ch.top, scale);
      }
    } else if (this.scroller) {
      const r = (this.scroller.firstElementChild as HTMLElement).getBoundingClientRect();
      for (const s of this.steps) consider(s, x - r.left, y - r.top, 1);
    }
    return best;
  }

  goTo(i: number): void {
    this.current = Math.max(0, Math.min(this.steps.length - 1, i));
    if (this.browsing >= 0) { this.browsing = -1; this.resetSlots(); }
    if (this.playing) this.startPerf = performance.now() - this.steps[this.current].t / this.speed;
    this.update();
  }

  // ---- the clock --------------------------------------------------------------------------------------

  /**
   * Plays from the marker. untilStep: stop moving on reaching that step (Wait for me: run through the piano's
   * notes up to your next ones) and call onReached instead of onStop.
   */
  play(untilStep = -1): void {
    if (!this.steps.length) return;
    if (this.browsing >= 0) { this.browsing = -1; this.resetSlots(); this.update(); }
    if (untilStep < 0 && this.current >= this.steps.length - 1) { this.current = 0; this.update(); }
    this.untilStep = untilStep;
    this.playing = true;
    this.startPerf = performance.now() - this.steps[this.current].t / this.speed;
    this.frame = requestAnimationFrame((now) => this.tick(now));
  }

  pause(): void {
    if (!this.playing) return;
    this.playing = false;
    cancelAnimationFrame(this.frame);
    this.onStop();
  }

  setSpeed(speed: number): void {
    const now = performance.now();
    const elapsed = this.playing ? (now - this.startPerf) * this.speed : 0;
    this.speed = speed;
    if (this.playing) this.startPerf = now - elapsed / speed;
  }

  private tick(now: number): void {
    if (!this.playing) return;
    const elapsed = this.songClock ? this.songClock() : (now - this.startPerf) * this.speed;
    let moved = false;
    while (this.current + 1 < this.steps.length && this.steps[this.current + 1].t <= elapsed && this.current !== this.untilStep) { this.current++; moved = true; }
    if (moved) this.update();
    if (this.layout === 'smooth' && this.scroller) {
      // A steady glide: the marker's position between this note and the next, kept a third from the left.
      const s = this.steps[this.current], n = this.steps[this.current + 1];
      let x = s.pos.left;
      if (n && n.pos.left > s.pos.left) x = s.pos.left + (n.pos.left - s.pos.left) * Math.min(1, (elapsed - s.t) / (n.t - s.t));
      this.scroller.scrollLeft = Math.max(0, x - this.host.clientWidth / 3);
    }
    if (this.untilStep >= 0 && this.current === this.untilStep) {
      this.playing = false;
      if (moved) this.update();
      this.onReached();
      return;
    }
    if (this.current >= this.steps.length - 1 && elapsed >= this.endT) { this.pause(); return; }
    this.frame = requestAnimationFrame((t) => this.tick(t));
  }

  /** Where the marker is, in song ms at speed 1. */
  get currentT(): number { return this.steps[this.current]?.t ?? 0; }
  get index(): number { return this.current; }
  get stepCount(): number { return this.steps.length; }
  stepT(i: number): number { return this.steps[i]?.t ?? this.endT; }
  /** The song's time now (ms at speed 1): the sound's clock while it plays, otherwise the marker's own. */
  songNow(): number { return this.songClock ? this.songClock() : this.playing ? (performance.now() - this.startPerf) * this.speed : this.currentT; }

  /** The keys struck at step i by the given hands (tied-on and grace notes left out). */
  struckAt(i: number, hands: 'both' | 'right' | 'left'): number[] {
    return (this.steps[i]?.pos.staves ?? [])
      .filter((st) => (hands === 'right' ? st.staff === 0 : hands === 'left' ? st.staff !== 0 : true))
      .flatMap((st) => st.notes.filter((n) => n.len > 0).map((n) => n.midi));
  }

  /** The notes to play from here on, for the chosen hands (right = top staff, left = the others). */
  noteEvents(hands: 'both' | 'right' | 'left'): NoteEvent[] {
    const out: NoteEvent[] = [];
    for (const s of this.steps) for (const st of s.pos.staves) {
      if (hands === 'right' ? st.staff !== 0 : hands === 'left' ? st.staff === 0 : false) continue;
      for (const n of st.notes) if (n.len > 0) out.push({ t: s.t, midi: n.midi, dur: (n.len * 4 * 60000) / s.bpm, vel: s.vels[st.staff] ?? s.vels[0] });
    }
    return out;
  }

  /**
   * Metronome beats in play order: each bar's beats from its time signature (one click per bottom-number
   * note) or every quarter or eighth note as chosen, the first of each full bar accented; a pickup bar gets
   * only the clicks of the grid that fall in it.
   */
  beats(on: 'beats' | 'quarters' | 'eighths' = 'beats'): Beat[] {
    const out: Beat[] = [];
    let lastStart = NaN;
    for (const s of this.steps) {
      const start = s.ts - s.rel; // where this bar begins in the song (whole notes)
      if (Math.abs(start - lastStart) < 1e-9) continue;
      lastStart = start;
      const bar = this.measures[s.m];
      if (!bar) continue;
      const m = on === 'beats' ? bar : { ...bar, beatLen: on === 'quarters' ? 1 / 4 : 1 / 8 };
      if (m.pickup) {
        // The beats of the bar's grid that fall inside the pickup, counted back from where bar 1 begins.
        for (let p = m.dur - m.beatLen; p >= -1e-9; p -= m.beatLen) out.push({ t: this.timeAt(start + p), accent: false });
        out.sort((a, b) => a.t - b.t);
      } else {
        for (let k = 0; k * m.beatLen < m.dur - 1e-9; k++) out.push({ t: this.timeAt(start + k * m.beatLen), accent: k === 0 });
      }
    }
    return out;
  }

  /** Song ms at speed 1 for a timestamp (whole notes), from the steps around it and the tempo in force. */
  private timeAt(ts: number): number {
    let i = 0;
    while (i + 1 < this.steps.length && this.steps[i + 1].ts <= ts + 1e-9) i++;
    const s = this.steps[i];
    return s.t + ((ts - s.ts) * 4 * 60000) / s.bpm;
  }

  /** For checks: every note the app read from its drawing, per bar (in file order), written as F#4. */
  drawnNotes(): string[][] {
    const seen = new Set<string>(), bars: string[][] = [];
    for (const s of this.steps) {
      if (seen.has(`${s.m}:${s.rel}`)) continue; // a repeat plays the same bar again
      seen.add(`${s.m}:${s.rel}`);
      (bars[s.m] ??= []).push(...s.pos.staves.flatMap((st) => st.notes.map((n) => n.spelled)));
    }
    return bars.map((b) => (b ?? []).sort());
  }

  /** For checks: each step's timestamp (whole notes), start (ms at speed 1) and tempo. */
  timeline() { return this.steps.map((s) => [s.ts, Math.round(s.t), s.bpm, s.vels[0], s.m, s.vels[1]]); }

  /** For checks: what is on screen. */
  state() {
    return {
      layout: this.layout, playing: this.playing, step: this.current, steps: this.steps.length, browsing: this.browsing,
      lastT: Math.round(this.steps.at(-1)?.t ?? 0), endT: Math.round(this.endT), lastBpm: this.steps.at(-1)?.bpm,
      occ: this.steps[this.current]?.occ ?? -1, occs: this.occ.length, chunks: this.chunks.map((c) => ({ h: Math.round(c.h), w: Math.round(c.w) })),
      slots: this.slots.map((x) => ({ o: x.o, chunk: x.o >= 0 ? this.occ[x.o] : -1, h: x.h, transform: x.piece.style.transform })),
      marks: this.host.querySelectorAll('.mark').length, scrollLeft: this.scroller?.scrollLeft ?? 0,
    };
  }
}
