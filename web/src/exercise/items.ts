// What exercises are made of (owner, 2026-10-11): sets of numbered items, each a bit of music grouped together
// (a note, an interval, a chord, an arpeggio, a block of MusicXML, or bars cut from a piece). Simon and the
// drills take any set; the content is data (public/content/sets/*.json), not part of the app. A pool adds a
// random item each round; a passage grows in its own order.
//
// A set file:
//   { "title": "Chords in C", "order": "pool" | "passage",
//     "items": { "1": <item>, "2": <item>, ... },          numbered; or, for a passage cut from a piece:
//     "from": { "score": "mozart-k2", "bars": "1-4", "staff": 1 } }
//   { "title": "Minuet K. 2", "order": "piece", "from": { "score": "mozart-k2" } }   a whole piece to memorise:
//     the learner picks the bars, the hands, and whether the chain grows by a bar or by a note
// An item is one of (name and short are optional; they are worked out when missing):
//   { "notes": "C4 E4 G4" }                 together (a chord);  "C4, E4, G4"  one after another
//   { "chord": "G7", "octave": 4, "arpeggio": false }
//   { "interval": "M3", "root": "C4", "together": true }
//   { "musicxml": "<note>...</note><note><chord/>...</note>" }   or   { "musicxml": "file.musicxml" }
//   ... plus "name": "G dominant 7th", "short": "G7"
// MusicXML items and passages cut from a score keep their rhythm (note lengths and rests); the others are even.
// A set may give "tempo" (quarter notes a minute); a passage from a score takes the score's own, else 80.

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
  /** A piece's notes as they sound (both hands overlapping), in quarter notes from the item's start. */
  events?: { t: number; midi: number; dur: number }[];
  /** How long the item lasts, in quarter notes (with events). */
  length?: number;
  /** The piece's bars it covers (file order, from 0), for showing them on the score. */
  scoreBars?: number[];
}

/** A note of a piece: when (quarter notes from the start), which key, how long, which staff, which bar. */
export interface PieceNote { t: number; midi: number; spelled: string; dur: number; staff: number; bar: number }
/** A whole piece, read once: its notes, where each bar starts, the bars' printed numbers, its tempo and file. */
export interface Piece { notes: PieceNote[]; barStarts: number[]; barNumbers: string[]; tempo: number; xml: string }

export interface ItemSet {
  id: string; title: string; order: 'pool' | 'passage'; items: Item[]; /** quarter notes a minute */ tempo: number;
  /** A passage from a score: its time signature and key (sharps +, flats −), drawn as the score has them. */
  meter?: { beats: number; beatType: number }; fifths?: number;
  /** A whole piece to memorise (order "piece"); its items are made from the learner's choices (pieceItems). */
  piece?: Piece;
}

const TEMPO = 80; // when a set gives none: about the old app's steady pace (0.75 s a note)

interface ItemSource {
  notes?: string; chord?: string; octave?: number; arpeggio?: boolean;
  interval?: string; root?: string; together?: boolean; musicxml?: string; name?: string; short?: string;
}
interface SetFile { title: string; order?: 'pool' | 'passage' | 'piece'; tempo?: number; items?: Record<string, ItemSource>; from?: { score: string; bars?: string; staff?: number } }

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

export interface Parsed { groups: string[][]; beats: number[]; bars: number[]; tempo?: number; meter?: { beats: number; beatType: number }; fifths?: number }

/**
 * MusicXML notes (a fragment or a whole file), one voice of one staff: each moment's notes one group (a chord
 * together), a rest an empty group, with how long each lasts in quarter notes (a tied note's whole length) and
 * the bar it is in; grace notes left out, rests at either end dropped. Also the first tempo written.
 */
export function groupsFromXml(xml: string, staff?: number, bars?: [number, number]): Parsed {
  const isFragment = !/<score-partwise|<score-timewise/.test(xml);
  const doc = new DOMParser().parseFromString(isFragment ? `<measure>${xml}</measure>` : xml, 'application/xml');
  const measures = isFragment ? [doc.documentElement] : [...(doc.querySelector('part')?.querySelectorAll(':scope > measure') ?? [])];
  const out: Parsed = { groups: [], beats: [], bars: [] };
  let divisions = 1, voice: string | null = null;
  const first = bars ? bars[0] - 1 : 0;
  measures.forEach((measure, m) => {
    // Divisions carry on from earlier bars, so they are read even before the wanted ones.
    const d = measure.querySelector(':scope > attributes > divisions');
    if (d) divisions = Number(d.textContent) || divisions;
    if (out.tempo === undefined) {
      const sound = measure.querySelector('sound[tempo]');
      if (sound) out.tempo = Number(sound.getAttribute('tempo')) || undefined;
    }
    // The time signature and key in force where the wanted bars begin.
    if (!bars || m <= first) {
      const beatsEl = measure.querySelector(':scope > attributes > time > beats'), typeEl = measure.querySelector(':scope > attributes > time > beat-type');
      if (beatsEl && typeEl) out.meter = { beats: Number(beatsEl.textContent), beatType: Number(typeEl.textContent) };
      const fifthsEl = measure.querySelector(':scope > attributes > key > fifths');
      if (fifthsEl) out.fifths = Number(fifthsEl.textContent);
    }
    if (bars && (m < first || m > bars[1] - 1)) return;
    for (const el of measure.querySelectorAll(':scope > note')) {
      if (staff && Number(el.querySelector('staff')?.textContent ?? 1) !== staff) continue;
      if (el.querySelector('grace')) continue;
      const v = el.querySelector('voice')?.textContent ?? '1';
      voice ??= el.querySelector('pitch') ? v : null;
      if (voice !== null && v !== voice) continue; // one line of music: the first voice with notes
      const beats = Number(el.querySelector('duration')?.textContent ?? divisions) / divisions;
      const pitch = el.querySelector('pitch');
      if (!pitch) {
        if (el.querySelector('rest') && !el.querySelector('chord')) { out.groups.push([]); out.beats.push(beats); out.bars.push(m); }
        continue;
      }
      const ties = [...el.querySelectorAll('tie')].map((t) => t.getAttribute('type'));
      const alter = Number(pitch.querySelector('alter')?.textContent ?? 0);
      const p = `${pitch.querySelector('step')!.textContent!.trim()}${alter > 0 ? '#'.repeat(alter) : 'b'.repeat(-alter)}${pitch.querySelector('octave')!.textContent!.trim()}`;
      if (ties.includes('stop')) {
        // A tied-on note: its length belongs to the note it continues.
        const k = out.groups.map((g) => g.includes(p)).lastIndexOf(true);
        if (k >= 0 && !el.querySelector('chord')) { out.beats[k] += beats; continue; }
        if (k >= 0) continue;
      }
      if (el.querySelector('chord') && out.groups.length) out.groups.at(-1)!.push(p);
      else { out.groups.push([p]); out.beats.push(beats); out.bars.push(m); }
    }
  });
  while (out.groups.length && !out.groups[0].length) { out.groups.shift(); out.beats.shift(); out.bars.shift(); }
  while (out.groups.length && !out.groups.at(-1)!.length) { out.groups.pop(); out.beats.pop(); out.bars.pop(); }
  return out;
}

/** One item from its source. fetchText: for a MusicXML item given as a file. */
async function buildItem(n: number, src: ItemSource, base: string, fetchText: (url: string) => Promise<string>): Promise<Item> {
  let groups: string[][] = [], name = '', short = '', beats: number[] | undefined;
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
    name = namesOf(groups);
    short = String(n);
  }
  if (!groups.some((g) => g.length) || !groups.every((g) => g.every((p) => Note.midi(p) !== null))) throw new Error(`item ${n}: no notes could be read from it`);
  return { n, name: src.name ?? name, short: src.short ?? short, groups, beats };
}

/**
 * A set from its file. scoreXml: the MusicXML of a piece by its id (for a passage cut from one); base: the file's
 * address (a MusicXML item given as a file is found next to it).
 */
export async function readSet(id: string, file: SetFile, base: string, scoreXml: (score: string) => Promise<string>, fetchText: (url: string) => Promise<string>): Promise<ItemSet> {
  if (file.order === 'piece' && file.from) {
    const piece = readPiece(await scoreXml(file.from.score));
    return { id, title: file.title, order: 'passage', items: [], tempo: file.tempo ?? piece.tempo, piece };
  }
  if (file.from) {
    const [a, b] = (file.from.bars ?? '1-4').split('-').map(Number);
    const parsed = groupsFromXml(await scoreXml(file.from.score), file.from.staff ?? 1, [a, b ?? a]);
    // One item per moment with notes; a rest after it stays with it (the chain grows by notes, the rhythm whole).
    const items: Item[] = [];
    parsed.groups.forEach((g, k) => {
      const at = { group: g, beats: parsed.beats[k], bar: parsed.bars[k] };
      if (!g.length && items.length) { const it = items.at(-1)!; it.groups.push([]); it.beats!.push(at.beats); it.bars!.push(at.bar); return; }
      if (g.length) items.push({ n: items.length + 1, name: g.map(shown).join(' '), short: letters(g[0]), groups: [g], beats: [at.beats], bars: [at.bar] });
    });
    return { id, title: file.title, order: 'passage', items, tempo: file.tempo ?? parsed.tempo ?? TEMPO, meter: parsed.meter, fifths: parsed.fifths };
  }
  const entries = Object.entries(file.items ?? {}).map(([k, v]) => [Number(k), v] as const).sort((x, y) => x[0] - y[0]);
  const items = await Promise.all(entries.map(([n, src]) => buildItem(n, src, base, fetchText)));
  return { id, title: file.title, order: file.order === 'passage' ? 'passage' : 'pool', items, tempo: file.tempo ?? TEMPO };
}

/**
 * A whole piece (its first part): every note with when it starts and how long it sounds (a tied note's whole
 * length), its staff and bar; grace notes and rests left out. Where each bar starts, the bars' printed numbers,
 * and the first tempo written (else 80).
 */
export function readPiece(xml: string): Piece {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const measures = [...(doc.querySelector('part')?.querySelectorAll(':scope > measure') ?? [])];
  const notes: PieceNote[] = [], barStarts: number[] = [], barNumbers: string[] = [];
  let divisions = 1, start = 0, tempo: number | undefined;
  measures.forEach((measure, m) => {
    barStarts.push(start);
    barNumbers.push(measure.getAttribute('number') ?? String(m + 1));
    let pos = 0, most = 0, chordAt = 0;
    for (const el of measure.children) {
      if (el.tagName === 'attributes') divisions = Number(el.querySelector('divisions')?.textContent ?? divisions) || divisions;
      else if (el.tagName === 'backup') pos -= Number(el.querySelector('duration')?.textContent ?? 0);
      else if (el.tagName === 'forward') { pos += Number(el.querySelector('duration')?.textContent ?? 0); most = Math.max(most, pos); }
      else if (el.tagName === 'direction' || el.tagName === 'sound') {
        const t = (el.tagName === 'sound' ? el : el.querySelector('sound'))?.getAttribute('tempo');
        if (t && tempo === undefined) tempo = Number(t) || undefined;
      } else if (el.tagName === 'note') {
        if (el.querySelector('grace')) continue;
        const isChord = !!el.querySelector('chord');
        const at = isChord ? chordAt : pos;
        const len = Number(el.querySelector('duration')?.textContent ?? 0);
        if (!isChord) { chordAt = pos; pos += len; most = Math.max(most, pos); }
        const pitch = el.querySelector('pitch');
        if (!pitch) continue;
        const alter = Number(pitch.querySelector('alter')?.textContent ?? 0);
        const spelled = `${pitch.querySelector('step')!.textContent!.trim()}${alter > 0 ? '#'.repeat(alter) : 'b'.repeat(-alter)}${pitch.querySelector('octave')!.textContent!.trim()}`;
        const midi = midiOf(spelled), t = start + at / divisions, dur = len / divisions;
        const staff = Number(el.querySelector('staff')?.textContent ?? 1);
        if ([...el.querySelectorAll('tie')].some((x) => x.getAttribute('type') === 'stop')) {
          // A tied-on note: it lengthens the note it continues (the same key ending where this one starts).
          const prev = [...notes].reverse().find((n) => n.midi === midi && Math.abs(n.t + n.dur - t) < 1e-6);
          if (prev) { prev.dur += dur; continue; }
        }
        notes.push({ t, midi, spelled, dur, staff, bar: m });
      }
    }
    start += most / divisions;
  });
  return { notes, barStarts, barNumbers, tempo: tempo ?? TEMPO, xml };
}

export type Hands = 'right' | 'left' | 'both';

/**
 * Items to memorise from a piece: bars from..to (file order, from 0), one hand or both (right = the top staff),
 * growing by a bar or by a note (each moment where a note starts, both hands together). Each item keeps the
 * notes as they sound, so it plays like the piece.
 */
export function pieceItems(piece: Piece, from: number, to: number, hands: Hands, unit: 'bar' | 'note'): Item[] {
  const picked = piece.notes.filter((n) => n.bar >= from && n.bar <= to && (hands === 'both' || (hands === 'right' ? n.staff === 1 : n.staff !== 1)));
  const onsets = [...new Set(picked.map((n) => n.t))].sort((a, b) => a - b);
  const groupAt = (t: number) => picked.filter((n) => Math.abs(n.t - t) < 1e-6).sort((a, b) => a.midi - b.midi);
  const endOf = (bar: number) => piece.barStarts[bar + 1] ?? Math.max(...picked.map((n) => n.t + n.dur), piece.barStarts[bar]);
  if (unit === 'bar') {
    const items: Item[] = [];
    for (let bar = from; bar <= to; bar++) {
      const inBar = onsets.filter((t) => groupAt(t)[0].bar === bar);
      if (!inBar.length) continue;
      const start = piece.barStarts[bar];
      items.push({
        n: items.length + 1, name: `Bar ${piece.barNumbers[bar]}`, short: piece.barNumbers[bar],
        groups: inBar.map((t) => groupAt(t).map((n) => n.spelled)),
        events: inBar.flatMap((t) => groupAt(t).map((n) => ({ t: n.t - start, midi: n.midi, dur: n.dur }))),
        length: endOf(bar) - start, scoreBars: [bar],
      });
    }
    return items;
  }
  return onsets.map((t, i) => {
    const g = groupAt(t);
    const next = onsets[i + 1] ?? Math.max(...g.map((n) => n.t + n.dur));
    return {
      n: i + 1, name: g.map((n) => shown(n.spelled)).join(' '), short: letters(g.at(-1)!.spelled),
      groups: [g.map((n) => n.spelled)], events: g.map((n) => ({ t: 0, midi: n.midi, dur: n.dur })), length: next - t, scoreBars: [g[0].bar],
    };
  });
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
