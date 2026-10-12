// Exercise notation: items drawn on a staff with OSMD from a little MusicXML written here. Notes keep the
// lengths their item has (MusicXML items and passages from a score; the rest are even quarter notes), rests
// included; bar lines where the music they came from had them, otherwise each item its own bar (a passage
// with no bars of its own: bars of four). One staff, treble or bass for the range, or both staves split at
// middle C when it spans them. A highlighted item is drawn blue.

import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { midiOf, type Item } from './items';

const SPLIT = 60; // middle C: lower notes go to the bass staff
const DIVISIONS = 8; // per quarter note: a 32nd note is one

/** The written note for a length in quarter notes: its type and whether it is dotted (the nearest if odd). */
const VALUES: [number, string, boolean][] = [[4, 'whole', false], [3, 'half', true], [2, 'half', false], [1.5, 'quarter', true], [1, 'quarter', false],
  [0.75, 'eighth', true], [0.5, 'eighth', false], [0.375, '16th', true], [0.25, '16th', false], [0.125, '32nd', false]];
function value(beats: number): { type: string; dot: boolean } {
  const best = VALUES.reduce((a, b) => (Math.abs(b[0] - beats) < Math.abs(a[0] - beats) ? b : a));
  return { type: best[1], dot: best[2] };
}

function pitchXml(p: string): string {
  const m = /^([A-G])(#+|b+)?(-?\d+)$/.exec(p);
  if (!m) return '';
  const alter = m[2] ? (m[2][0] === '#' ? m[2].length : -m[2].length) : 0;
  return `<pitch><step>${m[1]}</step>${alter ? `<alter>${alter}</alter>` : ''}<octave>${m[3]}</octave></pitch>`;
}

/** The notes of one group on one staff (a rest if none fall there), lasting `beats` quarter notes. */
function groupXml(group: string[], beats: number, staff: number, color: string | null): string {
  const duration = Math.max(1, Math.round(beats * DIVISIONS));
  const { type, dot } = value(beats);
  const tail = `<duration>${duration}</duration><voice>${staff}</voice><type>${type}</type>${dot ? '<dot/>' : ''}`;
  if (!group.length) return `<note><rest/>${tail}<staff>${staff}</staff></note>`;
  return group.map((p, i) => `<note${color ? ` color="${color}"` : ''}>${i ? '<chord/>' : ''}${pitchXml(p)}${tail}` +
    `${color ? `<notehead color="${color}">normal</notehead>` : ''}<staff>${staff}</staff></note>`).join('');
}

/**
 * MusicXML for these items, items `lit` drawn blue. passage: one run of music (bars as it had them); meter and
 * fifths: its time signature and key, drawn (otherwise each bar is as long as what is in it, no signature shown).
 */
export function itemsXml(items: Item[], lit: number[] = [], passage = false, meter?: { beats: number; beatType: number }, fifths = 0): string {
  const groups = items.flatMap((it, i) => it.groups.map((g, k) => ({
    g, beats: it.beats?.[k] ?? 1, bar: it.bars?.[k], color: lit.includes(i) ? '#2563eb' : null, item: i,
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
    const length = Math.max(1, bar.reduce((t, x) => t + Math.max(1, Math.round(x.beats * DIVISIONS)), 0));
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
    const staff = (k: number, pick: (m: number) => boolean) => bar.map((x) => groupXml(x.g.filter((p) => pick(midiOf(p))), x.beats, k, x.color)).join('');
    const body = grand
      ? staff(1, (m) => m >= SPLIT) + `<backup><duration>${length}</duration></backup>` + staff(2, (m) => m < SPLIT)
      : staff(1, () => true);
    return `<measure number="${n + 1}">${attrs}${body}</measure>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><part-list><score-part id="P1"><part-name print-object="no">x</part-name></score-part></part-list><part id="P1">${measures}</part></score-partwise>`;
}

/** Draws exercise notation into a box; each show() replaces what was there. */
export class ExerciseNotation {
  private readonly osmd: OpenSheetMusicDisplay;
  private readonly small: HTMLDivElement; // items drawn from the MusicXML written here
  private request = 0;
  private zoom = 1;

  constructor(private readonly box: HTMLElement) {
    this.small = document.createElement('div');
    box.append(this.small);
    // Shrunk to fit again whenever the room changes (turning the phone, the window resized).
    new ResizeObserver(() => this.fit()).observe(box);
    this.osmd = new OpenSheetMusicDisplay(this.small, {
      autoResize: false, backend: 'svg', drawTitle: false, drawSubtitle: false, drawComposer: false, drawLyricist: false,
      drawPartNames: false, drawMeasureNumbers: false, drawingParameters: 'compacttight', autoBeam: true,
    });
  }

  async show(items: Item[], lit: number[] = [], passage = false, meter?: { beats: number; beatType: number }, fifths = 0): Promise<void> {
    const request = ++this.request;
    if (!items.length) { this.clear(); return; }
    this.box.classList.remove('off');
    await this.osmd.load(itemsXml(items, lit, passage, meter, fifths));
    if (request !== this.request) return; // a newer picture was asked for meanwhile
    this.osmd.zoom = 1.1;
    this.osmd.render();
    // OSMD redraws into the same svg: the last drawing's crop would stay on it.
    const svg = this.small.querySelector('svg');
    if (svg) { svg.removeAttribute('viewBox'); delete svg.dataset.w; delete svg.dataset.h; }
    this.fit();
  }

  /** How big the music is drawn, 1 = its own size (exercise/display.ts); drawn again at once. */
  setZoom(zoom: number): void {
    this.zoom = zoom;
    this.fit();
  }

  /**
   * The drawing at the chosen size, building from the left, or smaller when it no longer fits the room: long
   * chains and big chunks shrink rather than run off the screen, in any orientation (its viewBox keeps its own
   * coordinates).
   */
  private fit(): void {
    const svg = this.small.querySelector('svg');
    if (!svg) return;
    if (!svg.dataset.w) {
      // OSMD draws on a page as wide as the room with the music at its left: keep just the music (plus a margin),
      // so the size and the fit go by the music itself.
      const r = svg.getBBox();
      if (!(r.width > 0 && r.height > 0)) return;
      const pad = 4;
      svg.setAttribute('viewBox', `${r.x - pad} ${r.y - pad} ${r.width + 2 * pad} ${r.height + 2 * pad}`);
      svg.dataset.w = String(r.width + 2 * pad);
      svg.dataset.h = String(r.height + 2 * pad);
    }
    const w = Number(svg.dataset.w), h = Number(svg.dataset.h);
    const scale = Math.min(this.zoom, this.box.clientWidth / w, this.box.clientHeight / h);
    svg.setAttribute('width', String(w * scale));
    svg.setAttribute('height', String(h * scale));
  }

  clear(): void {
    this.request++;
    this.small.replaceChildren();
    this.box.classList.add('off');
  }
}
