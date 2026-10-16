// Exercise notation: items drawn on a staff with OSMD from a little MusicXML written here. Notes keep the
// lengths their item has (MusicXML items and passages from a score; the rest are even quarter notes), rests
// included; bar lines where the music they came from had them, otherwise each item its own bar (a passage
// with no bars of its own: bars of four). One staff, treble or bass for the range, or both staves split at
// middle C when it spans them. A highlighted item is drawn blue.
// A rhythm card (owner, 2026-10-16) is drawn on a one-line rhythm staff instead (rhythmXml): a percussion clef, its time
// signature and bar lines, notes with no pitch on the line, eighth pairs beamed, rests.

import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { midiOf, type Item } from './items';

const SPLIT = 60; // middle C: lower notes go to the bass staff
const DIVISIONS = 8; // per quarter note: a 32nd note is one

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

/** The notes of one group on one staff (a rest if none fall there), lasting `beats` quarter notes; colorOf: a note's own colour; staccato: drawn with its dot. */
function groupXml(group: string[], beats: number, staff: number, color: string | null, colorOf: (p: string) => string | null = () => null, staccato = false): string {
  const parts = values(beats);
  return parts.map((v, k) => {
    const first = k === 0, last = k === parts.length - 1;
    const ties = group.length ? `${first ? '' : '<tie type="stop"/>'}${last ? '' : '<tie type="start"/>'}` : '';
    const marks = (group.length && parts.length > 1 ? `${first ? '' : '<tied type="stop"/>'}${last ? '' : '<tied type="start"/>'}` : '') +
      (group.length && staccato && first ? '<articulations><staccato/></articulations>' : '');
    const tied = marks ? `<notations>${marks}</notations>` : '';
    const tail = `<duration>${Math.round(v.beats * DIVISIONS)}</duration>${ties}<voice>${staff}</voice><type>${v.type}</type>${v.dot ? '<dot/>' : ''}`;
    if (!group.length) return `<note><rest/>${tail}<staff>${staff}</staff></note>`;
    return group.map((p, i) => {
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
export function itemsXml(items: Item[], lit: number[] = [], passage = false, meter?: { beats: number; beatType: number }, fifths = 0, marks: Record<string, string> = {}): string {
  let gi = 0; // each group's number across all the items, for marks ("group:midi" -> colour)
  const groups = items.flatMap((it, i) => it.groups.map((g, k) => ({
    g, beats: it.beats?.[k] ?? 1, bar: it.bars?.[k], color: lit.includes(i) ? '#2563eb' : null, item: i, gi: gi++, staccato: !!it.detached?.[k],
  })));
  const all = groups.flatMap((x) => x.g.map(midiOf));
  const low = Math.min(...all, 72), high = Math.max(...all, 48);
  const grand = low < SPLIT - 5 && high > SPLIT + 7; // both staves only when the notes really spread across them
  const treble = !grand && (low >= SPLIT - 5 || (low + high) / 2 >= SPLIT);
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
    const staff = (k: number, pick: (m: number) => boolean) => bar.map((x) => groupXml(x.g.filter((p) => pick(midiOf(p))), x.beats, k, x.color, (p) => marks[`${x.gi}:${midiOf(p)}`] ?? null, x.staccato)).join('');
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
export function rhythmXml(item: Item, marks: Record<string, string> = {}): string {
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
        return `<note${c ? ` color="${c}"` : ''}>${unpitched}${tail}${ties}${type}<stem>up</stem>${c ? `<notehead color="${c}">normal</notehead>` : ''}${beam}${tied}</note>`;
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
      if (this.mode === 'card') this.fitCard();
      else if (this.box.clientWidth !== this.width) this.draw();
    }).observe(box);
    this.osmd = new OpenSheetMusicDisplay(this.small, {
      autoResize: false, backend: 'svg', drawTitle: false, drawSubtitle: false, drawComposer: false, drawLyricist: false,
      drawPartNames: false, drawMeasureNumbers: false, drawingParameters: 'compacttight', autoBeam: true,
    });
  }

  /** rhythm: the first item as a rhythm card on a one-line staff (rhythmXml). */
  async show(items: Item[], lit: number[] = [], passage = false, meter?: { beats: number; beatType: number }, fifths = 0, marks: Record<string, string> = {}, rhythm = false): Promise<void> {
    const request = ++this.request;
    if (!items.length) { this.clear(); return; }
    this.box.classList.remove('off');
    this.onShown(true);
    await this.osmd.load(rhythm ? rhythmXml({ ...items[0], meter: meter ?? items[0].meter }, marks) : itemsXml(items, lit, passage, meter, fifths, marks));
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
    this.osmd.render();
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

  /** A card: drawn once on one line (a wide page), cropped to the music, then scaled to the room. */
  private drawCard(): void {
    this.osmd.EngravingRules.RenderSingleHorizontalStaffline = false;
    this.small.style.width = '4000px'; // wide enough that a card's bars stay on one line
    this.small.style.flex = 'none'; // (a flex item would shrink back to the room's width and wrap the card)
    this.osmd.zoom = 1.1;
    this.osmd.render();
    const svg = this.small.querySelector('svg');
    this.small.style.width = '';
    this.small.style.flex = '';
    if (!svg) return;
    const r = svg.getBBox();
    if (!(r.width > 0 && r.height > 0)) return;
    const pad = 4;
    svg.setAttribute('viewBox', `${r.x - pad} ${r.y - pad} ${r.width + 2 * pad} ${r.height + 2 * pad}`);
    svg.dataset.w = String(r.width + 2 * pad);
    svg.dataset.h = String(r.height + 2 * pad);
    this.fitCard();
  }

  private fitCard(): void {
    const svg = this.small.querySelector('svg');
    if (!svg?.dataset.w) return;
    const w = Number(svg.dataset.w), h = Number(svg.dataset.h);
    const reserve = this.reserve();
    this.box.style.paddingBottom = `${reserve}px`; // centred in the room above what floats over the bottom
    const room = { w: this.box.clientWidth - 16, h: this.box.clientHeight - reserve - 8 };
    // Drawn at OSMD zoom 1.1 = 11 px a staff space; the score's biggest size is 1.8 (18 px): never bigger.
    const most = 1.8 / 1.1;
    const fit = Math.min(room.w / w, room.h / h);
    const scale = Math.max(0.1, this.share > 1 ? Math.min(fit, most * this.share) : Math.min(fit, most) * this.share);
    this.filled = scale >= fit - 1e-6;
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
