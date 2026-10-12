// Exercise notation: items drawn on a staff with OSMD from a little MusicXML written here. Each item is a bar
// (or a passage in bars of four), every group a quarter note (a chord stacked); one staff, treble or bass for
// the range, or both staves split at middle C when it spans them. A highlighted item is drawn blue.

import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { midiOf, type Item } from './items';

const SPLIT = 60; // middle C: lower notes go to the bass staff

function pitchXml(p: string): string {
  const m = /^([A-G])(#+|b+)?(-?\d+)$/.exec(p);
  if (!m) return '';
  const alter = m[2] ? (m[2][0] === '#' ? m[2].length : -m[2].length) : 0;
  return `<pitch><step>${m[1]}</step>${alter ? `<alter>${alter}</alter>` : ''}<octave>${m[3]}</octave></pitch>`;
}

/** The notes of one group on one staff as MusicXML (a rest if none fall there). */
function groupXml(group: string[], staff: number, color: string | null): string {
  if (!group.length) return `<note><rest/><duration>1</duration><voice>${staff}</voice><type>quarter</type><staff>${staff}</staff></note>`;
  return group.map((p, i) => `<note${color ? ` color="${color}"` : ''}>${i ? '<chord/>' : ''}${pitchXml(p)}<duration>1</duration>` +
    `<voice>${staff}</voice><type>quarter</type>${color ? `<notehead color="${color}">normal</notehead>` : ''}<staff>${staff}</staff></note>`).join('');
}

/**
 * MusicXML for these items: bars of their groups, items `lit` drawn blue. passage: the items run on in bars
 * of four groups (a melody); otherwise each item is its own bar.
 */
export function itemsXml(items: Item[], lit: number[] = [], passage = false): string {
  const groups = items.flatMap((it, i) => it.groups.map((g) => ({ g, color: lit.includes(i) ? '#2563eb' : null, item: i })));
  const all = groups.flatMap((x) => x.g.map(midiOf));
  const low = Math.min(...all, 72), high = Math.max(...all, 48);
  const grand = low < SPLIT - 5 && high > SPLIT + 7; // both staves only when the notes really spread across them
  const treble = !grand && (low >= SPLIT - 5 || (low + high) / 2 >= SPLIT);
  const bars: (typeof groups)[] = [];
  if (passage) for (let i = 0; i < groups.length; i += 4) bars.push(groups.slice(i, i + 4));
  else items.forEach((_, i) => bars.push(groups.filter((x) => x.item === i)));
  const measures = bars.map((bar, n) => {
    const beats = Math.max(1, bar.length);
    const attrs = n === 0
      ? `<attributes><divisions>1</divisions><key print-object="no"><fifths>0</fifths></key><time print-object="no"><beats>${beats}</beats><beat-type>4</beat-type></time>` +
        (grand ? '<staves>2</staves><clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef>'
          : treble ? '<clef><sign>G</sign><line>2</line></clef>' : '<clef><sign>F</sign><line>4</line></clef>') + '</attributes>'
      : `<attributes><time print-object="no"><beats>${beats}</beats><beat-type>4</beat-type></time></attributes>`;
    const staff = (k: number, pick: (m: number) => boolean) => bar.map((x) => groupXml(x.g.filter((p) => pick(midiOf(p))), k, x.color)).join('');
    const body = grand
      ? staff(1, (m) => m >= SPLIT) + `<backup><duration>${beats}</duration></backup>` + staff(2, (m) => m < SPLIT)
      : staff(1, () => true);
    return `<measure number="${n + 1}">${attrs}${body}</measure>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><part-list><score-part id="P1"><part-name print-object="no">x</part-name></score-part></part-list><part id="P1">${measures}</part></score-partwise>`;
}

/** Draws exercise notation into a box; each show() replaces what was there. */
export class ExerciseNotation {
  private readonly osmd: OpenSheetMusicDisplay;
  private request = 0;

  constructor(private readonly box: HTMLElement) {
    this.osmd = new OpenSheetMusicDisplay(box, {
      autoResize: false, backend: 'svg', drawTitle: false, drawSubtitle: false, drawComposer: false, drawLyricist: false,
      drawPartNames: false, drawMeasureNumbers: false, drawingParameters: 'compacttight',
    });
  }

  async show(items: Item[], lit: number[] = [], passage = false): Promise<void> {
    const request = ++this.request;
    if (!items.length) { this.clear(); return; }
    this.box.classList.remove('off');
    await this.osmd.load(itemsXml(items, lit, passage));
    if (request !== this.request) return; // a newer picture was asked for meanwhile
    this.osmd.zoom = 1.1;
    this.osmd.render();
  }

  clear(): void { this.request++; this.box.replaceChildren(); this.box.classList.add('off'); }
}
