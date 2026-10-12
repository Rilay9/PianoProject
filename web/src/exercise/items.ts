// What exercises are made of (owner, 2026-10-11): sets of numbered items, each a bit of music grouped together
// (a note, an interval, a chord, an arpeggio, a block of MusicXML, or bars cut from a piece). Simon and the
// drills take any set; the content is data (public/content/sets/*.json), not part of the app. A pool adds a
// random item each round; a passage grows in its own order.
//
// A set file:
//   { "title": "Chords in C", "order": "pool" | "passage",
//     "items": { "1": <item>, "2": <item>, ... },          numbered; or, for a passage cut from a piece:
//     "from": { "score": "mozart-k2", "bars": "1-4", "staff": 1 } }
// An item is one of (name and short are optional; they are worked out when missing):
//   { "notes": "C4 E4 G4" }                 together (a chord);  "C4, E4, G4"  one after another
//   { "chord": "G7", "octave": 4, "arpeggio": false }
//   { "interval": "M3", "root": "C4", "together": true }
//   { "musicxml": "<note>...</note><note><chord/>...</note>" }   or   { "musicxml": "file.musicxml" }
//   ... plus "name": "G dominant 7th", "short": "G7"

import { Chord, Interval, Note } from 'tonal';

/** One thing to play: groups of keys in order (a chord is one group; an arpeggio or a melody is several). */
export interface Item {
  /** Its number in the set. */
  n: number;
  /** Its full name, as a name-only prompt and in feedback: "C major", "major 3rd up from C", "E4". */
  name: string;
  /** A short label for the chain: "C", "M3", "E". */
  short: string;
  /** Spelled pitches per group, in order: [["C4", "E4", "G4"]] is a chord; [["C4"], ["E4"], ["G4"]] an arpeggio. */
  groups: string[][];
}

export interface ItemSet { id: string; title: string; order: 'pool' | 'passage'; items: Item[] }

interface ItemSource {
  notes?: string; chord?: string; octave?: number; arpeggio?: boolean;
  interval?: string; root?: string; together?: boolean; musicxml?: string; name?: string; short?: string;
}
interface SetFile { title: string; order?: 'pool' | 'passage'; items?: Record<string, ItemSource>; from?: { score: string; bars: string; staff?: number } }

export const midiOf = (spelled: string): number => Note.midi(spelled) ?? 60;
/** A spelled pitch as a learner reads it: C#4 as C♯4, Bb3 as B♭3. */
export const shown = (spelled: string): string => spelled.replace('#', '♯').replace(/^([A-G])b/, '$1♭');
const letters = (spelled: string) => shown(spelled).replace(/-?\d+$/, '');
const namesOf = (groups: string[][]) => groups.map((g) => g.map(shown).join(' ')).join(', ');

/** A chord from its name, stacked upwards from the root in the given octave. */
function chordGroups(symbol: string, octave: number): string[] {
  const out: string[] = [];
  for (const pc of Chord.get(symbol).notes) {
    let p = `${pc}${octave}`;
    while (out.length && midiOf(p) <= midiOf(out.at(-1)!)) p = Note.transpose(p, '8P');
    out.push(p);
  }
  return out;
}

function chordName(symbol: string): string {
  const c = Chord.get(symbol);
  const root = shown(c.tonic ?? '');
  const type = c.type === 'major' ? 'major' : c.type === 'minor' ? 'minor' : c.type === 'dominant seventh' ? 'dominant 7th' : c.type;
  return `${root} ${type}`.trim();
}

const QUALITY: Record<string, string> = { M: 'major', m: 'minor', P: 'perfect', d: 'diminished', A: 'augmented' };
const ORDINAL = ['', 'unison', '2nd', '3rd', '4th', '5th', '6th', '7th', 'octave'];

/** MusicXML notes (a fragment or a whole file): each moment's notes one group, rests and tied-on notes left out. */
export function groupsFromXml(xml: string, staff?: number, bars?: [number, number]): string[][] {
  const isFragment = !/<score-partwise|<score-timewise/.test(xml);
  const doc = new DOMParser().parseFromString(isFragment ? `<measure>${xml}</measure>` : xml, 'application/xml');
  const measures = isFragment ? [doc.documentElement] : [...(doc.querySelector('part')?.querySelectorAll(':scope > measure') ?? [])];
  const groups: string[][] = [];
  (bars ? measures.slice(bars[0] - 1, bars[1]) : measures).forEach((measure) => {
    for (const el of measure.querySelectorAll(':scope > note')) {
      if (staff && Number(el.querySelector('staff')?.textContent ?? 1) !== staff) continue;
      const pitch = el.querySelector('pitch');
      if (!pitch || el.querySelector('grace')) continue;
      const ties = [...el.querySelectorAll('tie')].map((t) => t.getAttribute('type'));
      if (ties.includes('stop') && !ties.includes('start')) continue;
      const alter = Number(pitch.querySelector('alter')?.textContent ?? 0);
      const p = `${pitch.querySelector('step')!.textContent!.trim()}${alter > 0 ? '#'.repeat(alter) : 'b'.repeat(-alter)}${pitch.querySelector('octave')!.textContent!.trim()}`;
      if (el.querySelector('chord') && groups.length) groups.at(-1)!.push(p);
      else groups.push([p]);
    }
  });
  return groups;
}

/** One item from its source. fetchText: for a MusicXML item given as a file. */
async function buildItem(n: number, src: ItemSource, base: string, fetchText: (url: string) => Promise<string>): Promise<Item> {
  let groups: string[][] = [], name = '', short = '';
  if (src.notes) {
    groups = src.notes.includes(',') ? src.notes.split(',').map((g) => g.trim().split(/\s+/)) : [src.notes.trim().split(/\s+/)];
    name = namesOf(groups);
    short = groups.length === 1 && groups[0].length === 1 ? letters(groups[0][0]) : String(n);
  } else if (src.chord) {
    const stack = chordGroups(src.chord, src.octave ?? 4);
    groups = src.arpeggio ? stack.map((p) => [p]) : [stack];
    name = chordName(src.chord) + (src.arpeggio ? ' arpeggio' : '');
    short = src.chord.replace(/^([A-G][#b]?)M$/, '$1');
  } else if (src.interval) {
    const root = src.root ?? 'C4', top = Note.transpose(root, src.interval);
    groups = src.together === false ? [[root], [top]] : [[root, top]];
    const i = Interval.get(src.interval);
    name = `${i.num === 8 && i.q === 'P' ? 'octave' : `${QUALITY[i.q as string] ?? ''} ${ORDINAL[i.num] ?? ''}`.trim()} up from ${letters(root)}`;
    short = `${i.q}${i.num}`;
  } else if (src.musicxml) {
    const xml = /\.(musicxml|xml)$/i.test(src.musicxml.trim()) ? await fetchText(new URL(src.musicxml.trim(), base).href) : src.musicxml;
    groups = groupsFromXml(xml);
    name = namesOf(groups);
    short = String(n);
  }
  if (!groups.length || !groups.every((g) => g.length && g.every((p) => Note.midi(p) !== null))) throw new Error(`item ${n}: no notes could be read from it`);
  return { n, name: src.name ?? name, short: src.short ?? short, groups };
}

/**
 * A set from its file. scoreXml: the MusicXML of a piece by its id (for a passage cut from one); base: the file's
 * address (a MusicXML item given as a file is found next to it).
 */
export async function readSet(id: string, file: SetFile, base: string, scoreXml: (score: string) => Promise<string>, fetchText: (url: string) => Promise<string>): Promise<ItemSet> {
  if (file.from) {
    const [a, b] = file.from.bars.split('-').map(Number);
    const groups = groupsFromXml(await scoreXml(file.from.score), file.from.staff ?? 1, [a, b ?? a]);
    return { id, title: file.title, order: 'passage', items: groups.map((g, i) => ({ n: i + 1, name: g.map(shown).join(' '), short: letters(g[0]), groups: [g] })) };
  }
  const entries = Object.entries(file.items ?? {}).map(([k, v]) => [Number(k), v] as const).sort((x, y) => x[0] - y[0]);
  const items = await Promise.all(entries.map(([n, src]) => buildItem(n, src, base, fetchText)));
  return { id, title: file.title, order: file.order ?? 'pool', items };
}

/** Every set listed in content/sets/index.json; a set that cannot be read is left out and reported. */
export async function loadSets(base: string, scoreXml: (score: string) => Promise<string>): Promise<{ sets: ItemSet[]; problems: string[] }> {
  const fetchText = async (url: string) => { const r = await fetch(url); if (!r.ok) throw new Error(`${r.status} for ${url}`); return r.text(); };
  const dir = new URL(`${base}content/sets/`, location.href).href;
  const list = JSON.parse(await fetchText(dir + 'index.json')) as string[];
  const sets: ItemSet[] = [], problems: string[] = [];
  for (const name of list) {
    try {
      const file = JSON.parse(await fetchText(dir + name)) as SetFile;
      sets.push(await readSet(name.replace(/\.json$/, ''), file, dir + name, scoreXml, fetchText));
    } catch (cause) {
      problems.push(`${name}: ${cause instanceof Error ? cause.message : String(cause)}`);
    }
  }
  return { sets, problems };
}
