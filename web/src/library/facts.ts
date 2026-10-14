// What the library says about a score, read from its own notes (owner, 2026-10-13: never a catalogue's guess as fact).
// The kind comes from the parts, staves and chord symbols written in it; the key is the key signature (major or minor
// only where the file says which); the bars are as printed. Nothing here guesses a level or a genre.

/** score: a score whose file could not be read (its kind is unknown). */
export type Kind = 'piano' | 'melody' | 'lead' | 'parts' | 'chart' | 'pdf' | 'score';
export const KIND_NAMES: Record<Kind, string> = { piano: 'piano', melody: 'melody', lead: 'lead sheet', parts: 'several parts', chart: 'chord chart', pdf: 'PDF', score: 'score' };

export interface Facts {
  kind: Kind;
  parts: number;
  staves: number;
  /** The key signature: sharps (+) or flats (−); mode only when the file states it. */
  fifths: number | null;
  mode: 'major' | 'minor' | null;
  /** The key signature changes later. */
  keyChanges: boolean;
  /** The first part is written for a transposing instrument: its key is as written, not as it sounds. */
  transposing: boolean;
  /** The first time signature ("3/4"), and whether it changes later. */
  time: string | null;
  timeChanges: boolean;
  /** Bars as printed: a bar split around a repeat sign (an implicit measure after the first) is not counted twice. */
  bars: number;
  /** Lowest and highest written note (MIDI numbers; none for several parts, where it would mix instruments). */
  low: number | null;
  high: number | null;
  /** Chord symbols written in it. */
  chords: boolean;
}

export interface ReadScore { title: string; composer: string; facts: Facts }

const STEP: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const text = (el: Element | null | undefined) => el?.textContent?.trim() ?? '';

/** Reads a MusicXML text. Throws, in a sentence, when it is not MusicXML with notes. */
export function readScore(xml: string, fileName = ''): ReadScore {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.querySelector('parsererror') || !/^score-(partwise|timewise)$/.test(doc.documentElement.nodeName)) throw new Error('This file is not MusicXML.');
  if (doc.documentElement.nodeName === 'score-timewise') throw new Error('This MusicXML is in the "timewise" layout, which the app cannot read.');
  const parts = [...doc.querySelectorAll('score > part, score-partwise > part')];
  if (!doc.querySelector('note pitch')) throw new Error('This MusicXML has no notes.');
  const first = parts[0];
  const staves = Math.max(1, ...[...(first?.querySelectorAll('attributes > staves') ?? [])].map((e) => Number(e.textContent) || 1));
  const chords = !!doc.querySelector('harmony');
  const partCount = Math.max(parts.length, doc.querySelectorAll('part-list > score-part').length);
  const kind: Kind = partCount > 1 || staves > 2 ? 'parts' : staves === 2 ? 'piano' : chords ? 'lead' : 'melody';

  const keys = [...(first?.querySelectorAll('attributes > key') ?? [])];
  const key = keys[0];
  const fifthsText = text(key?.querySelector('fifths'));
  const modeText = text(key?.querySelector('mode'));
  const times = [...(first?.querySelectorAll('attributes > time') ?? [])].filter((t) => t.querySelector('beats'))
    .map((t) => `${text(t.querySelector('beats'))}/${text(t.querySelector('beat-type'))}`);
  const measures = [...(first?.querySelectorAll(':scope > measure') ?? [])];
  const bars = measures.filter((m, i) => i === 0 || m.getAttribute('implicit') !== 'yes').length;

  let low: number | null = null, high: number | null = null;
  for (const p of kind === 'parts' ? [] : doc.querySelectorAll('note > pitch')) {
    const step = STEP[text(p.querySelector('step'))];
    if (step === undefined) continue;
    const midi = 12 * (Number(text(p.querySelector('octave'))) + 1) + step + (Number(text(p.querySelector('alter'))) || 0);
    if (!Number.isFinite(midi)) continue;
    low = low === null ? midi : Math.min(low, midi);
    high = high === null ? midi : Math.max(high, midi);
  }

  // The printed title first: MuseScore keeps an old work-title when the title on the page is edited.
  const title = credit(doc, 'title') || text(doc.querySelector('work > work-title')) || text(doc.querySelector('movement-title'))
    || fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Untitled';
  // (First line only: the printed credit often adds dates or "arr." on the next.)
  const composer = (text(doc.querySelector('identification > creator[type="composer"]')) || credit(doc, 'composer')).split(/\r?\n/)[0].trim();
  return {
    title, composer,
    facts: {
      kind, parts: partCount, staves,
      fifths: fifthsText !== '' && Number.isFinite(Number(fifthsText)) ? Number(fifthsText) : null,
      mode: modeText === 'major' || modeText === 'minor' ? modeText : null,
      keyChanges: new Set(keys.map((k) => text(k.querySelector('fifths')))).size > 1,
      transposing: !!first?.querySelector('attributes > transpose'),
      time: times[0] ?? null, timeChanges: new Set(times).size > 1,
      bars, low, high, chords,
    },
  };
}

/** The words of the credit (the printed text on the page) of that type: "title", "composer". */
function credit(doc: Document, type: string): string {
  for (const c of doc.querySelectorAll('credit')) if ([...c.querySelectorAll('credit-type')].some((t) => text(t) === type)) return text(c.querySelector('credit-words')).split(/\r?\n/)[0].trim();
  return '';
}

/** "1♯", "2♭", "no ♯/♭" (and "G major" only where the file says which). */
export function keyText(f: Pick<Facts, 'fifths' | 'mode'>, long = false): string {
  if (f.fifths === null) return '';
  const sig = f.fifths === 0 ? 'no ♯/♭' : `${Math.abs(f.fifths)}${f.fifths > 0 ? '♯' : '♭'}`;
  if (!long || !f.mode) return sig;
  const majors = ['C♭', 'G♭', 'D♭', 'A♭', 'E♭', 'B♭', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'C♯'];
  const minors = ['A♭', 'E♭', 'B♭', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'C♯', 'G♯', 'D♯', 'A♯'];
  const name = (f.mode === 'major' ? majors : minors)[f.fifths + 7];
  return name ? `${sig} (${name} ${f.mode}: the file says)` : sig;
}

export function noteName(m: number): string {
  return `${['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'][((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`;
}
