// What exercises are made of (owner, 2026-10-11): sets of numbered items, each a bit of music grouped together
// (a note, an interval, a chord, an arpeggio, a block of MusicXML, or bars cut from a piece). Simon and the
// drills take any set; the content is data (public/content/sets/*.json), not part of the app. A pool adds a
// random item each round; a passage grows in its own order.
//
// A set file:
//   { "title": "Chords in C", "kind": "chords", "order": "pool" | "passage",
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
// A rhythm set (kind "rhythm", owner 2026-10-16) is rhythm alone, tapped on one pad: its cards are generated
// ("generate", exercise/rhythm.ts) or given as MusicXML items, whose pitches are not judged (read as one sound).
// A finger-number set (`"view": "fingers"`, owner 2026-10-17: lesson 1's tune by finger numbers) gives each card as its
// notes one after another, the finger for each, phrases parted by "/", and the hand once:
//   { "notes": "E4, D4, C4, D4, E4", "fingers": "3 2 1 / 2 3", "hand": "right", "name": "Right hand" }
// drawn as the numbers by phrase (no staff), played in order with no timing (Drills; docs §4, §6).
// A letter-name set (`"view": "names"`, owner's lesson 2 spec 2026-10-18: a tune by its key names) is the same card with
// each note's letter in place of its finger, phrases parted by "/" in the notes; no fingers:
//   { "notes": "E4, E4, F4, G4 / G4, F4, E4, D4", "hand": "right", "name": "Right hand" }
// Either kind may give "beats", each note's length in quarter notes ("1 1 1 1 / 1.5 0.5 2"): the card is played to you in
// that rhythm, and your try stays untimed.

import { Chord, Interval, Note } from 'tonal';
import { readRhythmSpec, rhythmPool, RHYTHM_PITCH, type RhythmSpec } from './rhythm.ts'; // (with .ts: the checks run this file in Node)
import { findPool, readFindSpec, type FindSpec } from './find.ts';

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
  /** A "find it" card (find.ts): the words that name the place, and the keys that count (any one of them). */
  find?: { words: string; keys: number[]; where?: string };
  /** A finger-number card (a set's `view: "fingers"`): the hand, and the finger for each note (one note a group) by phrase. */
  fingering?: { hand: 'right' | 'left'; phrases: number[][] };
  /** A letter-name card (a set's `view: "names"`): the hand, and each note's letter (C, F♯) by phrase. */
  lettering?: { hand: 'right' | 'left'; phrases: string[][] };
}

/** The score modes an exercise that is music can open in (Ladder needs a loop of bars, which a set does not give). */
export const PLAY_MODES = ['watch', 'wait', 'along', 'rhythm'] as const;
/** How a set's MusicXML items open on the score (review re-check 2026-10-15, V32): the score's own preset choices, as
 * an activity gives them (activity.ts), limited to the mode, the hands and the tempo; the mode Wait for me when not
 * given. Anything else is refused with the reason. */
export interface Play { mode: (typeof PLAY_MODES)[number]; hands?: 'both' | 'right' | 'left' | 'off'; tempo?: number }
export function readPlay(v: unknown): Play {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new Error('play should be an object, like { "mode": "wait" }');
  const o = v as Record<string, unknown>;
  for (const k of Object.keys(o)) if (!['mode', 'hands', 'tempo'].includes(k)) throw new Error(`play has "${k}", which is not one of mode, hands, tempo`);
  if (o.mode !== undefined && !(PLAY_MODES as readonly unknown[]).includes(o.mode)) throw new Error(`play.mode ${JSON.stringify(o.mode)} should be one of ${PLAY_MODES.join(', ')}${o.mode === 'ladder' ? ' (Ladder needs a loop of bars)' : ''}`);
  if (o.hands !== undefined && !['both', 'right', 'left', 'off'].includes(o.hands as string)) throw new Error(`play.hands ${JSON.stringify(o.hands)} should be both, right, left or off`);
  if (o.tempo !== undefined && !(typeof o.tempo === 'number' && o.tempo >= 20 && o.tempo <= 300)) throw new Error(`play.tempo ${JSON.stringify(o.tempo)} should be beats a minute, 20 to 300`);
  return { mode: (o.mode as Play['mode']) ?? 'wait', ...(o.hands ? { hands: o.hands as Play['hands'] } : {}), ...(o.tempo ? { tempo: o.tempo as number } : {}) };
}

/** What kind of exercise a set is (owner, 2026-10-15: Exercises lists them by kind). */
export const EXERCISE_KINDS = ['scales', 'five-finger', 'arpeggios', 'chords', 'intervals', 'cadences', 'melodies', 'rhythm', 'find'] as const;
export type ExerciseKind = (typeof EXERCISE_KINDS)[number];

export interface ItemSet {
  id: string; title: string; order: 'pool' | 'passage'; items: Item[]; /** quarter notes a minute */ tempo: number;
  /** Its kind of exercise, as the file says (none: listed under "Other" in Exercises). */
  kind?: ExerciseKind;
  /** A passage from a score: its time signature and key (sharps +, flats −), drawn as the score has them. */
  meter?: { beats: number; beatType: number }; fifths?: number;
  /** Drills: how items with no written rhythm are judged: notes only, or steady beats of this many quarter notes. */
  rhythm?: 'notes' | number;
  /** A rhythm set's cards generated from these values (its items are then the generated pool). */
  generate?: RhythmSpec;
  /** A "find it" set's keys and what it asks for (find.ts; its items are the cards made from it). */
  find?: FindSpec;
  /** "letters" (owner, 2026-10-17: a tune before the staff, as the method books show it): its cards drawn on the one-line
   * rhythm staff with each note's letter under it, played on the keys and judged for keys and timing (docs §4, §6).
   * "fingers" (owner, 2026-10-17): each card its finger numbers by phrase, no staff, played in order with no timing.
   * "names" (owner, 2026-10-18): the same card with each note's letter name in place of its finger. */
  view?: 'letters' | 'fingers' | 'names';
}

const TEMPO = 80; // when a set gives none: about the old app's steady pace (0.75 s a note)

interface ItemSource {
  notes?: string; chord?: string; octave?: number; arpeggio?: boolean;
  interval?: string; root?: string; together?: boolean; musicxml?: string; name?: string; short?: string;
  /** A finger-number card's (view "fingers"): a finger 1–5 for each note, "/" between phrases; and the hand. */
  fingers?: string; hand?: string;
  /** A finger-number or letter-name card's note lengths in quarter notes, one a note ("/" between phrases allowed). */
  beats?: string;
}
interface SetFile { title: string; kind?: string; play?: unknown; order?: 'pool' | 'passage'; tempo?: number; rhythm?: 'notes' | number; items?: Record<string, ItemSource>; from?: { score: string; bars?: string; staff?: number }; generate?: unknown; find?: unknown; view?: unknown }

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
    // (a note past the keyboard has no key: refused, never stacked for ever; interfaces review 2026-10-15, F1)
    while (out.length && Note.midi(p) !== null && Note.midi(p)! <= midiOf(out.at(-1)!)) p = Note.transpose(p, '8P');
    if (Note.midi(p) === null) throw new Error(`${symbol} in octave ${octave} goes past the keyboard`);
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
  const parts = doc.querySelectorAll('part').length;
  if (parts > 1) throw new Error(`it has ${parts} parts; only one part (one line of music) can be read so far`);
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
    // Repeats and 1st/2nd endings would be read straight through, in the wrong order: refused (review, 2026-10-13).
    if (measure.querySelector(':scope > barline > repeat, :scope > barline > ending')) throw new Error(`bar ${num(measure, m)} has a repeat or an ending, which cannot be read in order yet`);
    if (firstTempo === undefined) firstTempo = Number(measure.querySelector('sound[tempo]')?.getAttribute('tempo')) || undefined;
    started = true;
    starts.push({ at: start, m });
    let cur = 0, len = 0, lastAt = 0;
    for (const el of measure.children) {
      const dur = Number(el.querySelector(':scope > duration')?.textContent ?? 0) / divisions;
      if (el.tagName === 'backup') { cur -= dur; continue; }
      if (el.tagName === 'forward') { cur += dur; len = Math.max(len, cur); continue; }
      if (el.tagName !== 'note') continue;
      const chord = !!el.querySelector(':scope > chord');
      const at = chord ? lastAt : cur;
      if (!chord) { lastAt = cur; cur += dur; len = Math.max(len, cur); }
      const onStaff = Number(el.querySelector(':scope > staff')?.textContent ?? 1);
      if ((staff && onStaff !== staff) || el.querySelector(':scope > cue')) continue;
      if (el.querySelector(':scope > grace')) throw new Error(`bar ${num(measure, m)} has a grace note, which an exercise cannot draw yet`);
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
  // Silence before the first moment or after the last, written with <forward> rather than a rest, is kept too (review
  // 2026-10-15, B3-06: it was dropped, so a passage that waits a beat started at once). `start` is the excerpt's length.
  if (groups.length) {
    const first = groups[0]!.at, last = groups[groups.length - 1]!, end = Math.max(last.end, last.at);
    if (first > 1e-6) { out.groups.unshift([]); out.beats.unshift(first); out.bars.unshift(barAt(0)); out.detached.unshift(false); }
    if (start > end + 1e-6) { out.groups.push([]); out.beats.push(start - end); out.bars.push(barAt(end)); out.detached.push(false); }
  }
  // A length the notation cannot write (DIVISIONS: 32nd notes) is refused rather than drawn wrong.
  if (out.beats.some((b) => Math.abs(b * 8 - Math.round(b * 8)) > 1e-6)) throw new Error('it has a note length shorter than a 32nd or an uneven one, which cannot be drawn yet');
  return out;
}

/** One item from its source. fetchText: for a MusicXML item given as a file. */
async function buildItem(n: number, src: ItemSource, base: string, fetchText: (url: string) => Promise<string>): Promise<Item> {
  // Its fields: one kind of source (notes, chord, interval or musicxml) and that kind's options; anything else is refused.
  const allowed = ['notes', 'chord', 'octave', 'arpeggio', 'interval', 'root', 'together', 'musicxml', 'name', 'short', 'fingers', 'hand', 'beats'];
  const odd = Object.keys(src).find((k) => !allowed.includes(k));
  if (odd) throw new Error(`item ${n}: "${odd}" is not one of ${allowed.join(', ')}`);
  const kinds = (['notes', 'chord', 'interval', 'musicxml'] as const).filter((k) => src[k] !== undefined);
  if (kinds.length !== 1) throw new Error(`item ${n}: it should give one of notes, chord, interval or musicxml${kinds.length ? ` (it gives ${kinds.join(' and ')})` : ''}`);
  // A pitch's letter as a capital (c4 is C4; the notation needs it so).
  const cap = (p: string) => p.charAt(0).toUpperCase() + p.slice(1);
  if (src.notes) src = { ...src, notes: src.notes.split(/(\s+|,)/).map((t) => (/^[a-g]/.test(t) ? cap(t) : t)).join('') };
  if (src.root) src = { ...src, root: cap(src.root) };
  let groups: string[][] = [], name = '', short = '', beats: number[] | undefined;
  let bars: number[] | undefined, meter: Item['meter'], fifths: number | undefined, detached: boolean[] | undefined;
  if (src.notes) {
    groups = src.notes.includes(',') ? src.notes.split(',').map((g) => g.trim().split(/\s+/)) : [src.notes.trim().split(/\s+/)];
    name = namesOf(groups);
    short = groups.length === 1 && groups[0].length === 1 ? letters(groups[0][0]) : String(n);
  } else if (src.chord) {
    // A whole number 0 to 7 (anything else hung the app: interfaces review 2026-10-15, F1).
    if (src.octave !== undefined && !(Number.isInteger(src.octave) && src.octave >= 0 && src.octave <= 7)) throw new Error(`item ${n}: octave ${JSON.stringify(src.octave)} should be a whole number 0 to 7`);
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
  // The file's fields and values, checked (a typo is refused with the reason, never quietly read as something else).
  const fields = ['title', 'kind', 'play', 'order', 'tempo', 'rhythm', 'items', 'from', 'generate', 'find', 'view'];
  const odd = Object.keys(file).find((k) => !fields.includes(k));
  if (odd) throw new Error(`"${odd}" is not one of ${fields.join(', ')}`);
  if (typeof file.title !== 'string' || !file.title) throw new Error('it needs a "title"');
  if (file.kind !== undefined && !(EXERCISE_KINDS as readonly string[]).includes(file.kind)) throw new Error(`kind ${JSON.stringify(file.kind)} should be one of ${EXERCISE_KINDS.join(', ')}`);
  const kind = file.kind as ExerciseKind | undefined;
  if (file.play !== undefined) readPlay(file.play);
  if (file.order !== undefined && file.order !== 'pool' && file.order !== 'passage') throw new Error(`order "${file.order}" should be pool or passage`);
  if (file.tempo !== undefined && !(typeof file.tempo === 'number' && file.tempo >= 20 && file.tempo <= 300)) throw new Error(`tempo ${file.tempo} should be a number of beats a minute, 20 to 300`);
  if (file.rhythm !== undefined && file.rhythm !== 'notes' && !(typeof file.rhythm === 'number' && file.rhythm > 0)) throw new Error(`rhythm ${JSON.stringify(file.rhythm)} should be "notes" or a length in quarter notes (1, 0.5…)`);
  // The letters view (owner, 2026-10-17): only "letters"; not on a rhythm or find set (they have their own); checked on the
  // items below (written rhythm, one note at a time).
  if (file.view !== undefined) {
    if (file.view !== 'letters' && file.view !== 'fingers' && file.view !== 'names') throw new Error(`view ${JSON.stringify(file.view)} should be "letters", "fingers" or "names" (or left out)`);
    if (kind === 'rhythm' || kind === 'find') throw new Error(`a ${kind} set has no "view" (it is drawn its own way)`);
    if (file.play !== undefined) throw new Error(`a ${file.view} set is played in Drills: "play" is for sets of music opened on the score`);
  }
  // Finger-number cards (2026-10-17): untimed (no "rhythm"), each card notes + fingers + hand (fingeringOf checks them).
  const phrased = file.view === 'fingers' || file.view === 'names';
  if (phrased) {
    if (file.from) throw new Error(`a ${file.view} set gives its cards as "items" (notes${file.view === 'fingers' ? ', fingers' : ''} and hand), not "from"`);
    if (file.rhythm !== undefined) throw new Error(`a ${file.view} set is played in order with no timing: leave "rhythm" out`);
    const other = Object.entries(file.items ?? {}).find(([, it]) => typeof it !== 'object' || it === null || it.notes === undefined);
    if (other) throw new Error(file.view === 'fingers' ? `item ${other[0]}: a finger-number card gives "notes" (one after another), "fingers" and "hand"` : `item ${other[0]}: a letter-name card gives "notes" (one after another, "/" between phrases) and "hand"`);
  }
  const fingerItems = Object.entries(file.items ?? {}).filter(([, it]) => typeof it === 'object' && it !== null && (it.fingers !== undefined || it.hand !== undefined || it.beats !== undefined));
  if (!phrased && fingerItems.length) throw new Error(`item ${fingerItems[0][0]}: "fingers", "hand" and "beats" are for a set with "view": "fingers" (or "hand" and "beats" with "view": "names")`);
  if (file.view === 'names') { const f = Object.entries(file.items ?? {}).find(([, it]) => it.fingers !== undefined); if (f) throw new Error(`item ${f[0]}: a letter-name card shows letters, not fingers: leave "fingers" out (or use "view": "fingers")`); }
  // A "find it" set (owner, 2026-10-16): its cards made from the keys and what it asks for; untimed, in words.
  if (kind === 'find') {
    const other = (['items', 'from', 'generate', 'rhythm', 'play', 'order'] as const).find((k) => file[k] !== undefined);
    if (other) throw new Error(`a "find" set gives "find" only (its cards are made from it), not "${other}"`);
    if (file.find === undefined) throw new Error('a "find" set needs "find": { "keys", "groups", "places" }');
    const spec = readFindSpec(file.find);
    return { id, title: file.title, kind, order: 'pool', items: findPool(spec), tempo: file.tempo ?? TEMPO, find: spec };
  } else if (file.find !== undefined) throw new Error('"find" is for "find" sets (kind "find")');
  // A rhythm set (2026-10-16): its cards generated, or MusicXML items (written patterns); tapped, so no pitch is judged.
  if (kind === 'rhythm') {
    if (file.from) throw new Error('a rhythm set gives "generate" or MusicXML "items", not "from"');
    if (file.rhythm !== undefined) throw new Error('a rhythm set is always judged in time: "rhythm" is for sets of notes');
    if (file.play !== undefined) throw new Error('a rhythm set is played in Drills: "play" is for sets of music opened on the score');
    if (!!file.generate === !!file.items) throw new Error('a rhythm set should give either "generate" or "items" (MusicXML patterns)');
    if (file.generate) {
      if (file.order !== undefined) throw new Error('a generated rhythm set is always a pool: leave "order" out');
      const spec = readRhythmSpec(file.generate);
      return { id, title: file.title, kind, order: 'pool', items: rhythmPool(spec), tempo: file.tempo ?? TEMPO, generate: spec };
    }
    const odd = Object.entries(file.items ?? {}).find(([, it]) => typeof it !== 'object' || it === null || it.musicxml === undefined);
    if (odd) throw new Error(`item ${odd[0]}: a rhythm set's items are MusicXML patterns ("musicxml")`);
  } else if (file.generate !== undefined) throw new Error('"generate" is for rhythm sets (kind "rhythm")');
  if (!!file.from === !!file.items) throw new Error('it should give either "items" or "from" (a passage of a score)');
  if (file.from) {
    const m = /^(\d+)(?:-(\d+))?$/.exec(file.from.bars ?? '1-4');
    if (!m) throw new Error(`from.bars "${file.from.bars}" should be like "5-8" (printed bar numbers)`);
    const [a, b] = [Number(m[1]), Number(m[2] ?? m[1])];
    if (b < a) throw new Error(`from.bars "${file.from.bars}" end before they start`);
    const parsed = groupsFromXml(await scoreXml(file.from.score), file.from.staff ?? 1, [a, b]);
    if (!parsed.groups.some((g) => g.length)) throw new Error(`bars ${a}–${b} of "${file.from.score}" have no notes on staff ${file.from.staff ?? 1} (or are not in it)`);
    // One item per moment with notes; a rest after it stays with it (the chain grows by notes, the rhythm whole).
    const items: Item[] = [];
    parsed.groups.forEach((g, k) => {
      const at = { group: g, beats: parsed.beats[k], bar: parsed.bars[k], detached: parsed.detached[k] };
      if (!g.length && items.length) { const it = items.at(-1)!; it.groups.push([]); it.beats!.push(at.beats); it.bars!.push(at.bar); it.detached!.push(false); return; }
      if (g.length) items.push({ n: items.length + 1, name: g.map(shown).join(' '), short: letters(g[0]), groups: [g], beats: [at.beats], bars: [at.bar], detached: [at.detached] });
    });
    return lettersChecked({ id, title: file.title, kind, order: 'passage', items, tempo: file.tempo ?? parsed.tempo ?? TEMPO, meter: parsed.meter, fifths: parsed.fifths, rhythm: file.rhythm, ...(file.view ? { view: 'letters' as const } : {}) });
  }
  // A letter-name card's phrases are parted by "/" in its notes: read without them, their lengths kept.
  const phraseLengths = new Map<number, number[]>();
  const entries = Object.entries(file.items ?? {}).map(([k, v]) => {
    if (file.view !== 'names' || typeof v.notes !== 'string') return [Number(k), v] as const;
    const parts = v.notes.split('/').map((p) => p.trim().replace(/^,|,$/g, '').trim());
    if (parts.some((p) => !p)) throw new Error(`item ${k}: "notes" has an empty phrase (a "/" at an end, or two together)`);
    phraseLengths.set(Number(k), parts.map((p) => p.split(',').filter((x) => x.trim()).length));
    return [Number(k), { ...v, notes: parts.join(', ') }] as const;
  }).sort((x, y) => x[0] - y[0]);
  let items = await Promise.all(entries.map(([n, src]) => buildItem(n, src, base, fetchText)));
  // A rhythm set's written patterns sound on one pitch and are named by number, not by their notes (no note names).
  if (kind === 'rhythm') items = items.map((it) => ({ ...it, groups: it.groups.map((g) => (g.length ? [RHYTHM_PITCH] : [])), name: entries.find(([n]) => n === it.n)?.[1].name ?? `Pattern ${it.n}` }));
  if (file.view === 'fingers') items = items.map((it) => { const src = entries.find(([n]) => n === it.n)![1]; const fingering = fingeringOf(it, src); return { ...it, fingering, name: src.name ?? `${fingering.hand === 'right' ? 'Right' : 'Left'} hand` }; });
  if (file.view === 'names') items = items.map((it) => { const src = entries.find(([n]) => n === it.n)![1]; const lettering = letteringOf(it, src, phraseLengths.get(it.n)!); return { ...it, lettering, name: src.name ?? `${lettering.hand === 'right' ? 'Right' : 'Left'} hand` }; });
  if (phrased) items = items.map((it) => { const src = entries.find(([n]) => n === it.n)![1]; return src.beats === undefined ? it : { ...it, beats: beatsOf(it, src.beats) }; });
  return lettersChecked({ id, title: file.title, kind, order: file.order === 'passage' ? 'passage' : 'pool', items, tempo: file.tempo ?? TEMPO, rhythm: file.rhythm, ...(file.view ? { view: file.view } : {}) });
}

/**
 * A finger-number card's fingering (owner, 2026-10-17): `notes` one after another (no chords, no MusicXML: a card is
 * played in order, untimed), `fingers` a finger 1–5 for each note with "/" between phrases (no phrase empty), and
 * `hand` "right" or "left". Refused with the reason otherwise.
 */
function fingeringOf(it: Item, src: ItemSource): NonNullable<Item['fingering']> {
  const at = `item ${it.n}`;
  if (src.notes === undefined) throw new Error(`${at}: a finger-number card gives "notes" (one after another), "fingers" and "hand"`);
  if (it.groups.some((g) => g.length !== 1)) throw new Error(`${at}: a finger-number card plays one note at a time (no chords): "E4, D4, C4"`);
  if (src.hand !== 'right' && src.hand !== 'left') throw new Error(`${at}: "hand" should be "right" or "left"`);
  if (typeof src.fingers !== 'string' || !src.fingers.trim()) throw new Error(`${at}: "fingers" should be the finger for each note, like "3 2 1 / 2 3"`);
  const phrases = src.fingers.split('/').map((p) => p.trim());
  if (phrases.some((p) => !p)) throw new Error(`${at}: "fingers" has an empty phrase (a "/" at an end, or two together)`);
  const out = phrases.map((p) => p.split(/\s+/).map((f) => { if (!/^[1-5]$/.test(f)) throw new Error(`${at}: "${f}" in "fingers" is not a finger 1 to 5`); return Number(f); }));
  const n = out.flat().length;
  if (n !== it.groups.length) throw new Error(`${at}: "fingers" gives ${n} fingers for ${it.groups.length} notes (one each)`);
  return { hand: src.hand, phrases: out };
}

/** A letter-name card's letters (owner's lesson 2 spec, 2026-10-18): `notes` one after another, phrases of the lengths
 * given, and `hand` "right" or "left". */
function letteringOf(it: Item, src: ItemSource, lengths: number[]): NonNullable<Item['lettering']> {
  const at = `item ${it.n}`;
  if (it.groups.some((g) => g.length !== 1)) throw new Error(`${at}: a letter-name card plays one note at a time (no chords): "E4, D4, C4"`);
  if (src.hand !== 'right' && src.hand !== 'left') throw new Error(`${at}: "hand" should be "right" or "left"`);
  const names = it.groups.map((g) => letters(g[0]));
  const phrases: string[][] = [];
  let k = 0;
  for (const n of lengths) { phrases.push(names.slice(k, k + n)); k += n; }
  return { hand: src.hand, phrases };
}

/** A card's note lengths ("1 1 1.5 0.5 2", "/" between phrases allowed): one a note, each a positive number of quarter notes. */
function beatsOf(it: Item, v: unknown): number[] {
  const at = `item ${it.n}`;
  if (typeof v !== 'string' || !v.trim()) throw new Error(`${at}: "beats" should be each note's length in quarter notes, like "1 1 0.5 0.5 2"`);
  const out = v.replace(/\//g, ' ').trim().split(/\s+/).map((b) => { const x = Number(b); if (!(x > 0 && x <= 16)) throw new Error(`${at}: "${b}" in "beats" is not a length in quarter notes (0.25 to 16)`); return x; });
  if (out.length !== it.groups.length) throw new Error(`${at}: "beats" gives ${out.length} lengths for ${it.groups.length} notes (one each)`);
  return out;
}

/** A letters set's cards: each with written rhythm (MusicXML, or bars from a piece) and one note at a time (a letter under
 * each note; a chord would stack its letters). Refused with the reason otherwise. */
function lettersChecked(set: ItemSet): ItemSet {
  if (set.view !== 'letters') return set;
  for (const it of set.items) {
    if (!it.beats) throw new Error(`item ${it.n}: a letters card needs written rhythm (a MusicXML item, or bars from a piece)`);
    if (it.groups.some((g) => g.length > 1)) throw new Error(`item ${it.n}: a letters card holds one note at a time (no chords)`);
  }
  return set;
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
