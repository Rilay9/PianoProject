// Your marks on the music: fingering for now (owner, 2026-10-11). Kept on this device, per song, and written
// into the score as MusicXML <fingering> so OSMD draws it like printed fingering and an exported score
// opens in MuseScore with it.

/**
 * A finger number on one note: bar index (file order), beat in the bar (whole notes), key, staff (counted
 * from 0 across the whole score, so both hands playing the same key at once stay apart), finger 1-5.
 * Marks saved before the staff was recorded have none and match the key on any staff.
 */
export interface Fingering { m: number; rel: number; midi: number; staff?: number; finger: number }
type NoteRef = { m: number; rel: number; midi: number; staff?: number };

const KEY = 'piano-web.marks.v1';
type Stored = Record<string, { fingerings: Fingering[] }>;

function read(): Stored {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Stored; } catch { return {}; }
}

export function fingeringsFor(pieceId: string): Fingering[] { return read()[pieceId]?.fingerings ?? []; }

/** Is this mark on that note? */
export const sameNote = (a: NoteRef, b: NoteRef) => a.m === b.m && Math.abs(a.rel - b.rel) < 1e-6 && a.midi === b.midi
  && (a.staff === undefined || b.staff === undefined || a.staff === b.staff);

/** Sets (finger 1-5) or removes (finger 0) the fingering on a note. */
export function setFingering(pieceId: string, note: NoteRef, finger: number): void {
  const stored = read();
  const list = (stored[pieceId]?.fingerings ?? []).filter((f) => !sameNote(f, note));
  if (finger > 0) list.push({ m: note.m, rel: note.rel, midi: note.midi, staff: note.staff, finger });
  stored[pieceId] = { fingerings: list };
  try { localStorage.setItem(KEY, JSON.stringify(stored)); } catch { /* storage unavailable: this visit only */ }
}

const STEPS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/**
 * The score with your fingerings written in: each note found by its bar (in file order), where it starts in
 * the bar (from the durations, chords, backups and forwards before it), its staff and its pitch. A finger
 * written in the file on that note is replaced; placement above for the top staff, below for the others.
 */
export function addFingerings(xml: string, fingerings: Fingering[]): string {
  if (!fingerings.length) return xml;
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  let firstStaff = 0; // the score-wide number of this part's first staff
  for (const part of doc.querySelectorAll('part')) {
    let divisions = 1, staves = 1;
    [...part.querySelectorAll(':scope > measure')].forEach((measure, m) => {
      const wanted = fingerings.filter((f) => f.m === m);
      let pos = 0, chordStart = 0;
      for (const el of measure.children) {
        if (el.tagName === 'attributes') {
          divisions = Number(el.querySelector('divisions')?.textContent ?? divisions);
          staves = Math.max(staves, Number(el.querySelector('staves')?.textContent ?? 1));
        }
        else if (el.tagName === 'backup') pos -= Number(el.querySelector('duration')?.textContent ?? 0);
        else if (el.tagName === 'forward') pos += Number(el.querySelector('duration')?.textContent ?? 0);
        else if (el.tagName === 'note') {
          const isChord = !!el.querySelector('chord'), isGrace = !!el.querySelector('grace');
          const start = isChord ? chordStart : pos;
          if (!isChord) chordStart = pos;
          if (!isChord && !isGrace) pos += Number(el.querySelector('duration')?.textContent ?? 0);
          const pitch = el.querySelector('pitch');
          if (!pitch || !wanted.length) continue;
          const midi = (Number(pitch.querySelector('octave')!.textContent) + 1) * 12
            + STEPS[pitch.querySelector('step')!.textContent!.trim()] + Number(pitch.querySelector('alter')?.textContent ?? 0);
          const staff = firstStaff + Number(el.querySelector('staff')?.textContent ?? 1) - 1;
          const mark = wanted.find((f) => sameNote(f, { m, rel: start / divisions / 4, midi, staff }));
          if (mark) writeFinger(doc, el, mark.finger);
        }
      }
    });
    firstStaff += staves;
  }
  return new XMLSerializer().serializeToString(doc);
}

function writeFinger(doc: XMLDocument, note: Element, finger: number): void {
  const make = (tag: string, parent: Element) => {
    let child = parent.querySelector(`:scope > ${tag}`);
    if (!child) {
      child = doc.createElementNS(note.namespaceURI, tag);
      // MusicXML keeps <notations> before any <lyric> in a note.
      const lyric = parent === note ? note.querySelector(':scope > lyric') : null;
      if (lyric) parent.insertBefore(child, lyric); else parent.append(child);
    }
    return child;
  };
  const technical = make('technical', make('notations', note));
  technical.querySelectorAll(':scope > fingering').forEach((f) => f.remove());
  const fingering = doc.createElementNS(note.namespaceURI, 'fingering');
  fingering.textContent = String(finger);
  const staff = Number(note.querySelector('staff')?.textContent ?? 1);
  fingering.setAttribute('placement', staff === 1 ? 'above' : 'below');
  technical.append(fingering);
}
