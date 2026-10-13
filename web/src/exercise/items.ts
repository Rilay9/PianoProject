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
// MusicXML items and passages cut from a score keep their rhythm (note lengths and rests); the others are even.
// MusicXML is read as one line of music (groupsFromXml says what it refuses). "bars" are the printed bar numbers.
// A set may give "tempo" (quarter notes a minute); a passage from a score takes the score's own, else 80.
// For the drills a set may also say how its items with no written rhythm are judged (owner, 2026-10-12):
// "rhythm": "notes" (the right notes in order, no timing; the default) or a length in quarter notes, e.g. 0.5 for
// steady quavers. Items with written rhythm (MusicXML, bars from a piece) are always judged in time.

import { Chord, Interval, Note } from 'tonal';

/** One thing to play: groups of keys in order (a chord is one group; an arpeggio or a melody is several). */
export interface Item {
  /** Its number in the set. */
  n: number;
  /** Its full name, as a name-only prompt and in feedback: "C major", "major 3rd up from C", "E4". */
  name: string;
  /** A short label for the chain: "C", "M3", "E". */
  short: string;
  /** Spelled pitches per group, in order: [["C4", "E4", "G4"]] is a chord; [["C4"], ["E4"], ["G4"]] an arpeggio; [] a rest. */
  groups: string[][];
  /** How long each group lasts, in quarter notes (missing: one each, an even rhythm). */
  beats?: number[];
  /** The bar each group stands in, in the music it came from (missing: the item is its own bar). */
  bars?: number[];
  /** Each group marked staccato (staccatissimo, spiccato) in its MusicXML: meant shorter than written (drawn with its dot; its length is not judged). */
  detached?: boolean[];
  /** A MusicXML item's own time signature and key (sharps +, flats −), drawn as it has them. */
  meter?: { beats: number; beatType: number };
  fifths?: number;
}

export interface ItemSet {
  id: string; title: string; order: 'pool' | 'passage'; items: Item[]; /** quarter notes a minute */ tempo: number;
  /** A passage from a score: its time signature and key (sharps +, flats −), drawn as the score has them. */
  meter?: { beats: number; beatType: number }; fifths?: number;
  /** Drills: how items with no written rhythm are judged: notes only, or steady beats of this many quarter notes. */
  rhythm?: 'notes' | number;
}

const TEMPO = 80; // when a set gives none: about the old app's steady pace (0.75 s a note)

interface ItemSource {
  notes?: string; chord?: string; octave?: number; arpeggio?: boolean;
  interval?: string; root?: string; together?: boolean; musicxml?: string; name?: string; short?: string;
}
interface SetFile { title: string; order?: 'pool' | 'passage'; tempo?: number; rhythm?: 'notes' | number; items?: Record<string, ItemSource>; from?: { score: string; bars?: string; staff?: number } }

export const midiOf = (spelled: string): number => Note.midi(spelled) ?? 60;
/** A spelled pitch as a learner reads it: C#4 as C♯4, Bb3 as B♭3. */
export const shown = (spelled: string): string => spelled.replace('#', '♯').replace(/^([A-G])b/, '$1♭');
const letters = (spelled: string) => shown(spelled).replace(/-?\d+$/, '');
const namesOf = (groups: string[][]) => groups.filter((g) => g.length).map((g) => g.map(shown).join(' ')).join(', ');

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

export interface Parsed { groups: string[][]; beats: number[]; bars: number[]; detached: boolean[]; tempo?: number; meter?: { beats: number; beatType: number }; fifths?: number }

/**
 * MusicXML notes (a fragment or a whole file) as one line of music: each moment's struck notes one group (a chord
 * together), a rest an empty group, each lasting until the next moment (in quarter notes), with the bar it is in.
 * Moments come from where each note really falls (durations, chords, backup and forward), so a tied note just
 * lengthens the moment it was struck in, and a new note against a held one is a moment of its own. Rests are kept,
 * at the start and end too (a melody that starts on beat 2 starts on beat 2). Grace and cue notes are left out.
 * Music with more than one line of notes (another voice or staff, unless a staff is given) or with tuplets is
 * refused with a reason rather than read wrongly. bars: printed bar numbers (the measure's number), first to last.
 * A fragment with no <divisions> counts durations in quarter notes. Also the tempo in force where it starts.
 */
export function groupsFromXml(xml: string, staff?: number, bars?: [number, number]): Parsed {
  const isFragment = !/<score-partwise|<score-timewise/.test(xml);
  const doc = new DOMParser().parseFromString(isFragment ? `<measure>${xml}</measure>` : xml, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('the MusicXML could not be read');
  const measures = isFragment ? [doc.documentElement] : [...(doc.querySelector('part')?.querySelectorAll(':scope > measure') ?? [])];
  const out: Parsed = { groups: [], beats: [], bars: [], detached: [] };
  type Ev = { at: number; dur: number; pitch: string | null; tied: boolean; line: string; detached: boolean };
  const evs: Ev[] = [];
  const starts: { at: number; m: number }[] = []; // where each wanted bar starts (quarter notes)
  let divisions = 1, tempo: number | undefined, firstTempo: number | undefined, started = false, start = 0;
  const num = (el: Element, m: number) => { const n = Number(el.getAttribute('number')); return isFragment || !Number.isFinite(n) ? m + 1 : n; };
  measures.forEach((measure, m) => {
    // Divisions carry on from earlier bars, so they are read even before the wanted ones.
    const d = measure.querySelector(':scope > attributes > divisions');
    if (d) divisions = Number(d.textContent) || divisions;
    const wanted = !bars || (num(measure, m) >= bars[0] && num(measure, m) <= bars[1]);
    // The tempo, time signature and key in force where the wanted bars begin.
    if (!started) {
      const sound = measure.querySelector('sound[tempo]');
      if (sound) tempo = Number(sound.getAttribute('tempo')) || tempo;
      const beatsEl = measure.querySelector(':scope > attributes > time > beats'), typeEl = measure.querySelector(':scope > attributes > time > beat-type');
      if (beatsEl && typeEl) out.meter = { beats: Number(beatsEl.textContent), beatType: Number(typeEl.textContent) };
      const fifthsEl = measure.querySelector(':scope > attributes > key > fifths');
      if (fifthsEl) out.fifths = Number(fifthsEl.textContent);
    }
    if (!wanted) return;
    if (firstTempo === undefined) firstTempo = Number(measure.querySelector('sound[tempo]')?.getAttribute('tempo')) || undefined;
    started = true;
    starts.push({ at: start, m });
    let cur = 0, len = 0, lastAt = 0;
    for (const el of measure.children) {
      const dur = Number(el.querySelector(':scope > duration')?.textContent ?? 0) / divisions;
      if (el.tagName === 'backup') { cur -= dur; continue; }
      if (el.tagName === 'forward') { cur += dur; len = Math.max(len, cur); continue; }
      if (el.tagName !== 'note' || el.querySelector(':scope > grace')) continue;
      const chord = !!el.querySelector(':scope > chord');
      const at = chord ? lastAt : cur;
      if (!chord) { lastAt = cur; cur += dur; len = Math.max(len, cur); }
      const onStaff = Number(el.querySelector(':scope > staff')?.textContent ?? 1);
      if ((staff && onStaff !== staff) || el.querySelector(':scope > cue')) continue;
      if (el.querySelector(':scope > time-modification')) throw new Error(`bar ${num(measure, m)} has a tuplet, which cannot be drawn correctly yet`);
      const pitch = el.querySelector(':scope > pitch');
      let p: string | null = null;
      if (pitch) {
        const alter = Number(pitch.querySelector('alter')?.textContent ?? 0);
        p = `${pitch.querySelector('step')!.textContent!.trim()}${alter > 0 ? '#'.repeat(alter) : 'b'.repeat(-alter)}${pitch.querySelector('octave')!.textContent!.trim()}`;
      } else if (!el.querySelector(':scope > rest')) continue;
      const tied = [...el.querySelectorAll(':scope > tie')].some((t) => t.getAttribute('type') === 'stop');
      const detached = !!el.querySelector(':scope > notations > articulations > :is(staccato, staccatissimo, spiccato)');
      evs.push({ at: start + at, dur, pitch: p, tied, line: `${onStaff}/${el.querySelector(':scope > voice')?.textContent ?? '1'}`, detached });
    }
    start += len;
  });
  out.tempo = tempo ?? firstTempo;
  // One line of music: the voice (and staff) of the first note; another line with notes in it is refused.
  const line = evs.find((e) => e.pitch)?.line;
  if (evs.some((e) => e.pitch && e.line !== line)) throw new Error(staff ? `staff ${staff} has more than one voice there; only one line of music can be read so far` : 'it has more than one voice or staff; only one line of music can be read so far (a passage can name a staff)');
  const mine = evs.filter((e) => e.line === line);
  const barAt = (at: number) => [...starts].reverse().find((s) => s.at <= at + 1e-6)?.m ?? 0;
  const ats = [...new Set(mine.map((e) => Math.round(e.at * 1e6) / 1e6))].sort((x, y) => x - y);
  const groups: { at: number; end: number; keys: string[]; detached: boolean }[] = [];
  for (const at of ats) {
    const here = mine.filter((e) => Math.abs(e.at - at) < 1e-6);
    // A tied-on note lengthens the moment it was struck in (if that is in the excerpt); otherwise it is struck here.
    const struck = here.filter((e) => e.pitch && !(e.tied && groups.some((g) => g.keys.includes(e.pitch!))));
    for (const e of here.filter((x) => x.pitch && !struck.includes(x))) {
      const g = [...groups].reverse().find((x) => x.keys.includes(e.pitch!))!;
      g.end = Math.max(g.end, at + e.dur);
    }
    if (struck.length) groups.push({ at, end: at + Math.max(...struck.map((e) => e.dur)), keys: [...new Set(struck.map((e) => e.pitch!))], detached: struck.some((e) => e.detached) });
    else if (!here.some((e) => e.pitch)) groups.push({ at, end: at + Math.max(...here.map((e) => e.dur)), keys: [], detached: false });
  }
  groups.forEach((g, k) => {
    const next = groups[k + 1]?.at ?? g.end;
    const until = Math.min(next, Math.max(g.end, g.at)); // the moment lasts to the next one, or its own end
    out.groups.push(g.keys); out.beats.push(until - g.at); out.bars.push(barAt(g.at)); out.detached.push(g.detached);
    if (next > until + 1e-6) { out.groups.push([]); out.beats.push(next - until); out.bars.push(barAt(until)); out.detached.push(false); } // silence between (a forward)
  });
  // A length the notation cannot write (DIVISIONS: 32nd notes) is refused rather than drawn wrong.
  if (out.beats.some((b) => Math.abs(b * 8 - Math.round(b * 8)) > 1e-6)) throw new Error('it has a note length shorter than a 32nd or an uneven one, which cannot be drawn yet');
  return out;
}

/** One item from its source. fetchText: for a MusicXML item given as a file. */
async function buildItem(n: number, src: ItemSource, base: string, fetchText: (url: string) => Promise<string>): Promise<Item> {
  let groups: string[][] = [], name = '', short = '', beats: number[] | undefined;
  let bars: number[] | undefined, meter: Item['meter'], fifths: number | undefined, detached: boolean[] | undefined;
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
    const parsed = groupsFromXml(xml);
    groups = parsed.groups;
    beats = parsed.beats;
    if (parsed.detached.some(Boolean)) detached = parsed.detached;
    // A whole MusicXML file keeps its bars, time signature and key (a fragment is one bar of its own).
    if (/<score-partwise|<score-timewise/.test(xml)) { bars = parsed.bars; meter = parsed.meter; fifths = parsed.fifths; }
    name = namesOf(groups);
    short = String(n);
  }
  if (!groups.some((g) => g.length) || !groups.every((g) => g.every((p) => Note.midi(p) !== null))) throw new Error(`item ${n}: no notes could be read from it`);
  return { n, name: src.name ?? name, short: src.short ?? short, groups, beats, bars, meter, fifths, ...(detached ? { detached } : {}) };
}

/**
 * A set from its file. scoreXml: the MusicXML of a piece by its id (for a passage cut from one); base: the file's
 * address (a MusicXML item given as a file is found next to it).
 */
export async function readSet(id: string, file: SetFile, base: string, scoreXml: (score: string) => Promise<string>, fetchText: (url: string) => Promise<string>): Promise<ItemSet> {
  if (file.from) {
    const [a, b] = (file.from.bars ?? '1-4').split('-').map(Number);
    const parsed = groupsFromXml(await scoreXml(file.from.score), file.from.staff ?? 1, [a, b ?? a]);
    // One item per moment with notes; a rest after it stays with it (the chain grows by notes, the rhythm whole).
    const items: Item[] = [];
    parsed.groups.forEach((g, k) => {
      const at = { group: g, beats: parsed.beats[k], bar: parsed.bars[k], detached: parsed.detached[k] };
      if (!g.length && items.length) { const it = items.at(-1)!; it.groups.push([]); it.beats!.push(at.beats); it.bars!.push(at.bar); it.detached!.push(false); return; }
      if (g.length) items.push({ n: items.length + 1, name: g.map(shown).join(' '), short: letters(g[0]), groups: [g], beats: [at.beats], bars: [at.bar], detached: [at.detached] });
    });
    return { id, title: file.title, order: 'passage', items, tempo: file.tempo ?? parsed.tempo ?? TEMPO, meter: parsed.meter, fifths: parsed.fifths, rhythm: file.rhythm };
  }
  const entries = Object.entries(file.items ?? {}).map(([k, v]) => [Number(k), v] as const).sort((x, y) => x[0] - y[0]);
  const items = await Promise.all(entries.map(([n, src]) => buildItem(n, src, base, fetchText)));
  return { id, title: file.title, order: file.order === 'passage' ? 'passage' : 'pool', items, tempo: file.tempo ?? TEMPO, rhythm: file.rhythm };
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
