// Exercise notation: items drawn on a staff with OSMD from a little MusicXML written here. Notes keep the
// lengths their item has (MusicXML items and passages from a score; the rest are even quarter notes), rests
// included; bar lines where the music they came from had them, otherwise each item its own bar (a passage
// with no bars of its own: bars of four). One staff, treble or bass for the range, or both staves split at
// middle C when it spans them. A highlighted item is drawn blue.
// A rhythm card (owner, 2026-10-16) is drawn on a one-line rhythm staff instead (rhythmXml): a percussion clef, its time
// signature and bar lines, notes with no pitch on the line, eighth pairs beamed, rests. A letters card (owner, 2026-10-17:
// a tune before the staff, as the method books print it) is drawn the same way with each note's letter under it, as a
// lyric (OSMD draws lyrics in their own line under the notes, legible at 360 px; inside a notehead there is no room).

import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { midiOf, clefOf, CHORD_SYMBOL, type Item } from './items';

import { MARK, ringMissed } from '../result-marks';

const SPLIT = 60; // middle C: lower notes go to the bass staff
const DIVISIONS = 8; // per quarter note: a 32nd note is one
/** The letters in the noteheads: a colour that stands out on a black head, a hollow one and the marks' blue and green. */
const LETTER_INK = '#f97316';
const letterText = (p: string) => p.replace(/-?\d+$/, '').replace('#', '♯').replace(/^([A-G])b/, '$1♭');

/** The written notes for a length in quarter notes: one note if it is one, otherwise notes tied together (a half tied to an eighth). */
const VALUES: [number, string, boolean][] = [[4, 'whole', false], [3, 'half', true], [2, 'half', false], [1.5, 'quarter', true], [1, 'quarter', false],
  [0.75, 'eighth', true], [0.5, 'eighth', false], [0.375, '16th', true], [0.25, '16th', false], [0.125, '32nd', false]];
function values(beats: number): { beats: number; type: string; dot: boolean }[] {
  const out: { beats: number; type: string; dot: boolean }[] = [];
  let left = Math.max(0.125, Math.round(beats * DIVISIONS) / DIVISIONS); // items.ts refuses lengths that are not whole 32nds
  while (left > 1e-6) {
    const v = VALUES.find((x) => x[0] <= left + 1e-6) ?? VALUES.at(-1)!;
    out.push({ beats: v[0], type: v[1], dot: v[2] });
    left -= v[0];
  }
  return out;
}

function pitchXml(p: string): string {
  const m = /^([A-G])(#+|b+)?(-?\d+)$/.exec(p);
  if (!m) return '';
  const alter = m[2] ? (m[2][0] === '#' ? m[2].length : -m[2].length) : 0;
  return `<pitch><step>${m[1]}</step>${alter ? `<alter>${alter}</alter>` : ''}<octave>${m[3]}</octave></pitch>`;
}


/** The notes of one group on one staff (a rest if none fall there), lasting `beats` quarter notes; colorOf: a note's own colour; staccato: drawn with its dot; named: its letters under it. */
/** A chord symbol over the music (MusicXML harmony): C, Am, G7, Cmaj7, F♯m7. */
function harmonyXml(name: string, staff: number): string {
  const m = CHORD_SYMBOL.exec(name);
  if (!m) return '';
  const alter = m[2] === '#' || m[2] === '♯' ? 1 : m[2] === 'b' || m[2] === '♭' ? -1 : 0;
  const kind = { '': 'major', m: 'minor', '7': 'dominant', m7: 'minor-seventh', maj7: 'major-seventh' }[m[3] ?? ''];
  return `<harmony print-frame="no"><root><root-step>${m[1]}</root-step>${alter ? `<root-alter>${alter}</root-alter>` : ''}</root><kind>${kind}</kind><staff>${staff}</staff></harmony>`;
}

function groupXml(group: string[], beats: number, staff: number, color: string | null, colorOf: (p: string) => string | null = () => null, staccato = false, named = false, chordName: string | null = null): string {
  const parts = values(beats);
  return parts.map((v, k) => {
    const first = k === 0, last = k === parts.length - 1;
    const ties = group.length ? `${first ? '' : '<tie type="stop"/>'}${last ? '' : '<tie type="start"/>'}` : '';
    const marks = (group.length && parts.length > 1 ? `${first ? '' : '<tied type="stop"/>'}${last ? '' : '<tied type="start"/>'}` : '') +
      (group.length && staccato && first ? '<articulations><staccato/></articulations>' : '');
    const tied = marks ? `<notations>${marks}</notations>` : '';
    const tail = `<duration>${Math.round(v.beats * DIVISIONS)}</duration>${ties}<voice>${staff}</voice><type>${v.type}</type>${v.dot ? '<dot/>' : ''}`;
    if (!group.length) return `<note><rest/>${tail}<staff>${staff}</staff></note>`;
    // (a chord's letters, low to high, under its first note: one lyric a note would be drawn on top of each other)
    const symbol = named && first && chordName ? harmonyXml(chordName, staff) : '';
    return symbol + group.map((p, i) => {
      const c = colorOf(p) ?? color;
      return `<note${c ? ` color="${c}"` : ''}>${i ? '<chord/>' : ''}${pitchXml(p)}${tail}` +
        `${c ? `<notehead color="${c}">normal</notehead>` : ''}<staff>${staff}</staff>${tied}</note>`;
    }).join('');
  }).join('');
}

/**
 * MusicXML for these items, items `lit` drawn blue. passage: one run of music (bars as it had them); meter and
 * fifths: its time signature and key, drawn (otherwise each bar is as long as what is in it, no signature shown).
 */
/** named: the groups (numbered across all the items, as marks are) whose letters are written under them, or 'all'. */
/** named: the groups (numbered across the items, as marks are) whose chord names are written over them, or 'all'. */
export function itemsXml(items: Item[], lit: number[] = [], passage = false, meter?: { beats: number; beatType: number }, fifths = 0, marks: Record<string, string> = {}, named: Set<number> | 'all' = new Set()): string {
  let gi = 0; // each group's number across all the items, for marks ("group:midi" -> colour)
  const groups = items.flatMap((it, i) => it.groups.map((g, k) => ({
    g, beats: it.beats?.[k] ?? 1, bar: it.bars?.[k], color: lit.includes(i) ? MARK.want : null, item: i, gi: gi++, staccato: !!it.detached?.[k], chord: it.chordNames?.[k] ?? null,
  })));
  const clef = clefOf(items), grand = clef === 'grand', treble = clef === 'treble';
  const bars: (typeof groups)[] = [];
  if (passage && groups.every((x) => x.bar !== undefined)) {
    for (const x of groups) { if (!bars.length || bars.at(-1)![0].bar !== x.bar) bars.push([]); bars.at(-1)!.push(x); }
  } else if (passage) for (let i = 0; i < groups.length; i += 4) bars.push(groups.slice(i, i + 4));
  else items.forEach((_, i) => bars.push(groups.filter((x) => x.item === i)));
  const measures = bars.map((bar, n) => {
    // The bar is as long as what is in it (a cut-out bar may be part of one); its time signature is not shown.
    const length = Math.max(1, bar.reduce((t, x) => t + values(x.beats).reduce((n, v) => n + Math.round(v.beats * DIVISIONS), 0), 0));
    const real = passage && meter;
    const time = real
      ? (n === 0 ? `<time><beats>${meter.beats}</beats><beat-type>${meter.beatType}</beat-type></time>` : '')
      : `<time print-object="no"><beats>${length}</beats><beat-type>32</beat-type></time>`;
    const key = real ? `<key><fifths>${fifths}</fifths></key>` : '<key print-object="no"><fifths>0</fifths></key>';
    const attrs = n === 0
      ? `<attributes><divisions>${DIVISIONS}</divisions>${key}${time}` +
        (grand ? '<staves>2</staves><clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef>'
          : treble ? '<clef><sign>G</sign><line>2</line></clef>' : '<clef><sign>F</sign><line>4</line></clef>') + '</attributes>'
      : time ? `<attributes>${time}</attributes>` : '';
    const staff = (k: number, pick: (m: number) => boolean) => bar.map((x) => groupXml(x.g.filter((p) => pick(midiOf(p))), x.beats, k, x.color, (p) => marks[`${x.gi}:${midiOf(p)}`] ?? null, x.staccato, named === 'all' || named.has(x.gi), x.chord && (k === 1 || !x.g.some((p) => midiOf(p) >= SPLIT)) ? x.chord : null)).join(''); // (a chord's name once, over its top staff)
    const body = grand
      ? staff(1, (m) => m >= SPLIT) + `<backup><duration>${length}</duration></backup>` + staff(2, (m) => m < SPLIT)
      : staff(1, () => true);
    return `<measure number="${n + 1}">${attrs}${body}</measure>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><part-list><score-part id="P1"><part-name print-object="no">x</part-name></score-part></part-list><part id="P1">${measures}</part></score-partwise>`;
}

/**
 * A rhythm card on a one-line staff (owner, 2026-10-16): the percussion clef, the time signature (when the item has
 * one), bar lines where its bars are, every note on the line (unpitched, E4 on a one-line staff, stems up), an eighth
 * pair within a beat beamed, rests as written; lengths the notation has no one value for are tied, as itemsXml does.
 * marks: "group:midi" -> colour, as itemsXml (a rhythm card's notes all have the one pitch they sound on).
 */
export function rhythmXml(item: Item, marks: Record<string, string> = {}, letters = false): string {
  const meter = item.meter;
  const groups = item.groups.map((g, gi) => ({ g, gi, beats: item.beats?.[gi] ?? 1, bar: item.bars?.[gi] ?? 0 }));
  const bars: (typeof groups)[] = [];
  for (const x of groups) { if (!bars.length || bars.at(-1)![0].bar !== x.bar) bars.push([]); bars.at(-1)!.push(x); }
  const unpitched = '<unpitched><display-step>E</display-step><display-octave>4</display-octave></unpitched>';
  const measures = bars.map((bar, n) => {
    const time = meter ? `<time><beats>${meter.beats}</beats><beat-type>${meter.beatType}</beat-type></time>` : '';
    const attrs = n === 0 ? `<attributes><divisions>${DIVISIONS}</divisions><key print-object="no"><fifths>0</fifths></key>${time}<clef><sign>percussion</sign></clef><staff-details><staff-lines>1</staff-lines></staff-details></attributes>` : '';
    let at = 0; // quarter notes from the bar's start
    const body = bar.map((x, i) => {
      const parts = values(x.beats);
      const start = at;
      at += x.beats;
      // An eighth on a beat with the next eighth after it in the same beat: the two beamed.
      const eighth = parts.length === 1 && parts[0].type === 'eighth' && !parts[0].dot && x.g.length > 0;
      const next = bar[i + 1], prev = bar[i - 1];
      const begins = eighth && Math.abs(start - Math.round(start)) < 1e-6 && next?.g.length && next.beats === 0.5;
      const ends = eighth && Math.abs(start - 0.5 - Math.floor(start)) < 1e-6 && prev?.g.length && prev.beats === 0.5;
      return parts.map((v, k) => {
        const tail = `<duration>${Math.round(v.beats * DIVISIONS)}</duration>`;
        const type = `<voice>1</voice><type>${v.type}</type>${v.dot ? '<dot/>' : ''}`;
        if (!x.g.length) return `<note><rest/>${tail}${type}</note>`;
        const first = k === 0, last = k === parts.length - 1;
        const c = marks[`${x.gi}:${midiOf(x.g[0])}`] ?? null;
        const ties = parts.length > 1 ? `${first ? '' : '<tie type="stop"/>'}${last ? '' : '<tie type="start"/>'}` : '';
        const tied = parts.length > 1 ? `<notations>${first ? '' : '<tied type="stop"/>'}${last ? '' : '<tied type="start"/>'}</notations>` : '';
        const beam = begins ? '<beam number="1">begin</beam>' : ends ? '<beam number="1">end</beam>' : '';
        // (the letter under the note's first part: C, D, E, F♯, B♭; in the note's own colour when it is marked)
        const letter = letters && first ? `<lyric number="1"><syllabic>single</syllabic><text>${x.g[0].replace(/-?\d+$/, '').replace('#', '♯').replace(/^([A-G])b/, '$1♭')}</text></lyric>` : '';
        return `<note${c ? ` color="${c}"` : ''}>${unpitched}${tail}${ties}${type}<stem>up</stem>${c ? `<notehead color="${c}">normal</notehead>` : ''}${beam}${tied}${letter}</note>`;
      }).join('');
    }).join('');
    return `<measure number="${n + 1}">${attrs}${body}</measure>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><part-list><score-part id="P1"><part-name print-object="no">x</part-name></score-part></part-list><part id="P1">${measures}</part></score-partwise>`;
}

/**
 * Draws exercise notation into a box; each show() replaces what was there. The music keeps one size (the chosen
 * one) and builds from the left: a chain longer than the room wraps onto more lines, and when the lines are taller
 * than the room the box scrolls, keeping the item being given in view (owner, 2026-10-12: fixed size, wrap and
 * scroll, never shrinking on and on).
 */
export class ExerciseNotation {
  private readonly osmd: OpenSheetMusicDisplay;
  private readonly small: HTMLDivElement; // items drawn from the MusicXML written here
  private request = 0;
  private zoom = 1;
  private loaded = false;
  private width = 0; // the room's width at the last drawing: a new width lays the lines out again
  /**
   * build (Simon): one size, from the left, wrapping as the chain grows. card (Drills, owner 2026-10-12): a card
   * never grows, so it is drawn on one line, centred and as big as the room allows (never past the score's
   * biggest size), times `share` (A−/A+).
   */
  private mode: 'build' | 'card' = 'build';
  private share = 1;
  private line = false; // build mode on one line that scrolls sideways (Simon, a phone on its side)
  /** Height at the bottom of the room covered by what floats over it (the frosted panel). */
  reserve: () => number = () => 0;
  /** Music came on screen (true) or went. */
  onShown: (on: boolean) => void = () => {};
  /** Card mode: drawn as big as the room allows (A+ can do no more). */
  filled = false;

  constructor(private readonly box: HTMLElement) {
    this.small = document.createElement('div');
    box.append(this.small);
    new ResizeObserver(() => {
      if (!this.loaded || this.box.clientWidth <= 0) return;
      if (this.mode === 'card') { if (this.box.clientWidth !== this.width) this.draw(); else this.fitCard(); } // (a new width: one line or two chosen again)
      else if (this.box.clientWidth !== this.width) this.draw();
    }).observe(box);
    this.osmd = new OpenSheetMusicDisplay(this.small, {
      autoResize: false, backend: 'svg', drawTitle: false, drawSubtitle: false, drawComposer: false, drawLyricist: false,
      drawPartNames: false, drawMeasureNumbers: false, drawingParameters: 'compacttight', autoBeam: true,
    });
  }

  /** rhythm: the first item as a rhythm card on a one-line staff (rhythmXml); letters: with each note's letter under it. */
  async show(items: Item[], lit: number[] = [], passage = false, meter?: { beats: number; beatType: number }, fifths = 0, marks: Record<string, string> = {}, rhythm = false, letters = false, named: Set<number> | 'all' = new Set()): Promise<void> {
    const request = ++this.request;
    // (one item of notes: its named groups' letters written in their noteheads after each drawing)
    this.labelsFor = !rhythm && items.length === 1 && (named === 'all' || named.size) ? { item: items[0], named } : null;
    if (!items.length) { this.clear(); return; }
    this.box.classList.remove('off');
    this.onShown(true);
    await this.osmd.load(rhythm ? rhythmXml({ ...items[0], meter: meter ?? items[0].meter }, marks, letters) : itemsXml(items, lit, passage, meter, fifths, marks, named));
    if (request !== this.request) return; // a newer picture was asked for meanwhile
    this.loaded = true;
    this.draw();
    if (!lit.length) this.box.scrollTop = 0;
  }

  /** How big the music is drawn, 1 = its own size (exercise/display.ts); drawn again at once. */
  setZoom(zoom: number): void {
    this.zoom = zoom;
    if (this.loaded) this.draw();
  }

  /** Build mode on one line, scrolling sideways to keep the lit item in view. */
  setLine(on: boolean): void {
    if (on === this.line) return;
    this.line = on;
    this.box.classList.toggle('line', on);
    if (this.loaded && this.mode === 'build') this.draw();
  }

  setMode(mode: 'build' | 'card'): void {
    this.mode = mode;
    this.box.classList.toggle('card', mode === 'card');
    if (mode === 'build') { this.box.style.paddingBottom = ''; this.small.style.width = ''; }
  }
  /** Card mode: the share of the biggest size the card is drawn at (1 = that; above 1, tablets: on up to filling the room). */
  setShare(share: number): void { this.share = share; if (this.loaded && this.mode === 'card') this.fitCard(); }
  /** Something floating over the bottom changed height: fit the card again. */
  refit(): void { if (this.loaded && this.mode === 'card') this.fitCard(); }

  private labelsFor: { item: Item; named: Set<number> | 'all' } | null = null;
  /**
   * Letters in the noteheads (owner, 2026-10-18: "just put them smaller in a standout color in the regular sized note
   * heads … Worst comes to worst I can't read them"): each named group's notes get their letter, small, in orange, in
   * the head as drawn; the music keeps its size and place. A note is matched to its group by when it starts (a tied-on
   * part is not lettered); a chord's heads, lowest first, to its notes, lowest first.
   */
  private labelNotes(): void {
    const spec = this.labelsFor, svg = this.small.querySelector('svg');
    if (!spec || !svg) return;
    const { item, named } = spec;
    const beats = item.beats ?? item.groups.map(() => 1);
    const starts: number[] = [];
    beats.reduce((at, b) => { starts.push(at); return at + b; }, 0);
    type GNote = { sourceNote: { isRest(): boolean; halfTone: number; NoteTie?: { StartNote: unknown } }; getSVGGElement?(): SVGGElement | undefined };
    type Entry = { relInMeasureTimestamp: { RealValue: number }; graphicalVoiceEntries: { notes: GNote[] }[] };
    type Measure = { parentSourceMeasure: { AbsoluteTimestamp: { RealValue: number } }; staffEntries: Entry[] };
    const sheet = (this.osmd as unknown as { GraphicSheet?: { MeasureList: Measure[][] } }).GraphicSheet;
    for (const row of sheet?.MeasureList ?? []) for (const m of row) {
      if (!m) continue;
      for (const e of m.staffEntries) {
        const q = (m.parentSourceMeasure.AbsoluteTimestamp.RealValue + e.relInMeasureTimestamp.RealValue) * 4;
        const gi = starts.findIndex((x) => Math.abs(x - q) < 1e-3);
        if (gi < 0 || !(named === 'all' || named.has(gi))) continue;
        for (const ve of e.graphicalVoiceEntries) {
          const notes = ve.notes.filter((n) => !n.sourceNote.isRest() && (!n.sourceNote.NoteTie || n.sourceNote.NoteTie.StartNote === n.sourceNote));
          const g = notes[0]?.getSVGGElement?.();
          if (!g) continue;
          const heads = [...g.querySelectorAll<SVGGraphicsElement>('.vf-notehead')].map((h) => h.getBBox()).filter((b) => b.height > 0).sort((a, b) => b.y - a.y);
          [...notes].sort((a, b) => a.sourceNote.halfTone - b.sourceNote.halfTone).forEach((n, k) => {
            const b = heads[k], spelled = item.groups[gi].find((p) => midiOf(p) === n.sourceNote.halfTone + 12);
            if (!b || !spelled) return;
            const text = letterText(spelled);
            const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            t.setAttribute('x', String(b.x + b.width / 2));
            t.setAttribute('y', String(b.y + b.height / 2));
            t.setAttribute('text-anchor', 'middle');
            t.setAttribute('dominant-baseline', 'central');
            t.setAttribute('font-family', 'system-ui, sans-serif');
            t.setAttribute('font-weight', '800');
            t.setAttribute('font-size', String(b.height * (text.length > 1 ? 0.62 : 0.82)));
            t.setAttribute('fill', LETTER_INK);
            t.setAttribute('pointer-events', 'none');
            t.classList.add('note-letter');
            t.textContent = text;
            svg.append(t);
          });
        }
      }
    }
  }

  /** Lays the music out at the chosen size across the room's width, then brings the lit item into view. */
  private draw(): void {
    if (this.mode === 'card') { this.drawCard(); return; }
    this.width = this.box.clientWidth;
    this.osmd.zoom = 1.1 * this.zoom; // 1.1: the size it has always been drawn at
    // The frosted panel floats over the bottom of the box: room to scroll the last line above it, and the lit
    // item is brought into view above it, not under it.
    const reserve = this.reserve();
    this.box.style.paddingBottom = `${reserve}px`;
    this.osmd.EngravingRules.RenderSingleHorizontalStaffline = this.line;
    this.small.style.flex = this.line ? 'none' : '';
    this.osmd.render(); ringMissed(this.small); this.labelNotes(); // (missed notes ringed as well as grey: result-marks.ts)
    const lit = [...this.small.querySelectorAll<SVGElement>('[fill="#2563eb"]')];
    if (!lit.length) { if (this.line) this.box.scrollLeft = this.box.scrollWidth; return; } // the newest end in view
    const box = this.box.getBoundingClientRect();
    if (this.line) {
      const left = Math.min(...lit.map((e) => e.getBoundingClientRect().left)), right = Math.max(...lit.map((e) => e.getBoundingClientRect().right));
      if (left - 40 < box.left) this.box.scrollLeft -= box.left - (left - 40);
      else if (right + 40 > box.right) this.box.scrollLeft += right + 40 - box.right;
      return;
    }
    const top = Math.min(...lit.map((e) => e.getBoundingClientRect().top)), bottom = Math.max(...lit.map((e) => e.getBoundingClientRect().bottom));
    const margin = 40; // the staff around the lit notes
    if (top - margin < box.top) this.box.scrollTop -= box.top - (top - margin);
    else if (bottom + margin > box.bottom - reserve) this.box.scrollTop += bottom + margin - (box.bottom - reserve);
  }

  /**
   * A card: drawn on one line (a wide page), cropped to the music, then scaled to the room. A card of two bars or more
   * is also drawn with its bars on two lines, and the way that comes out bigger in the room is kept (owner, 2026-10-17:
   * a four-bar line was small on a phone upright; two lines of two there, one line sideways).
   */
  private drawCard(): void {
    this.width = this.box.clientWidth;
    const bars = this.osmd.Sheet?.SourceMeasures.length ?? 0;
    const one = this.renderCard(0);
    if (bars >= 2 && one) {
      // (a page about the width of half the line: OSMD spreads each line to the page's width)
      const two = this.renderCard(Math.ceil(bars / 2), Math.ceil(one.w * 0.55) + 40);
      if (two && this.scaleFor(two.w, two.h) > this.scaleFor(one.w, one.h) * 1.05) { this.fitCard(); return; } // (5%: not for a hair)
      this.renderCard(0);
    }
    this.fitCard();
  }

  /** Renders the card with this many bars a line (0: all on one), cropped to the music; its size before scaling. */
  private renderCard(perLine: number, page = 4000): { w: number; h: number } | null {
    this.osmd.EngravingRules.RenderSingleHorizontalStaffline = false;
    this.osmd.EngravingRules.RenderXMeasuresPerLineAkaSystem = perLine;
    this.small.style.width = `${page}px`; // (4000: wide enough that a card's bars stay on one line)
    this.small.style.flex = 'none'; // (a flex item would shrink back to the room's width and wrap the card)
    this.osmd.zoom = 1.1;
    this.osmd.render(); ringMissed(this.small); this.labelNotes(); // (missed notes ringed as well as grey: result-marks.ts)
    this.osmd.EngravingRules.RenderXMeasuresPerLineAkaSystem = 0; // (Simon's build mode wraps by width as before)
    const svg = this.small.querySelector('svg');
    this.small.style.width = '';
    this.small.style.flex = '';
    if (!svg) return null;
    const r = svg.getBBox();
    if (!(r.width > 0 && r.height > 0)) return null;
    const pad = 4;
    svg.setAttribute('viewBox', `${r.x - pad} ${r.y - pad} ${r.width + 2 * pad} ${r.height + 2 * pad}`);
    svg.dataset.w = String(r.width + 2 * pad);
    svg.dataset.h = String(r.height + 2 * pad);
    return { w: r.width + 2 * pad, h: r.height + 2 * pad };
  }

  /** The scale a card of this size is drawn at in the room (the room above what floats over the bottom). */
  private scaleFor(w: number, h: number): number {
    const room = { w: this.box.clientWidth - 16, h: this.box.clientHeight - this.reserve() - 8 };
    // Drawn at OSMD zoom 1.1 = 11 px a staff space. A card fills its room up to 3 (30 px a staff space; owner, 2026-10-18:
    // "I'll be making the music bigger anyways. Idk why you have it that small": it stopped at the score's 1.8).
    const most = 3 / 1.1;
    const fit = Math.min(room.w / w, room.h / h);
    return Math.max(0.1, this.share > 1 ? Math.min(fit, most * this.share) : Math.min(fit, most) * this.share);
  }

  private fitCard(): void {
    const svg = this.small.querySelector('svg');
    if (!svg?.dataset.w) return;
    const w = Number(svg.dataset.w), h = Number(svg.dataset.h);
    this.box.style.paddingBottom = `${this.reserve()}px`; // centred in the room above what floats over the bottom
    const room = { w: this.box.clientWidth - 16, h: this.box.clientHeight - this.reserve() - 8 };
    const scale = this.scaleFor(w, h);
    this.filled = scale >= Math.min(room.w / w, room.h / h) - 1e-6;
    svg.setAttribute('width', String(w * scale));
    svg.setAttribute('height', String(h * scale));
  }

  clear(): void {
    this.request++;
    this.loaded = false;
    this.small.replaceChildren();
    this.box.classList.add('off');
    this.onShown(false);
  }
}
