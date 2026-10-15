/**
 * A band file's parts (owner, 2026-10-15: keep the non-piano parts as MIDI and play them as the band; only the piano
 * part becomes the score). Which part is which is read from the file: each channel's General MIDI instrument (its
 * program change) and channel 10 for the drums.
 *
 * A part is a track's notes on one channel (a format 0 file keeps every instrument in one track, told apart by
 * channel). By default the score is every part on a channel set to the General MIDI piano family (programs 0-7: the
 * pianos, electric pianos, harpsichord and clavinet); a channel the file never sets is program 0, the piano, as General
 * MIDI says, so a file that names no instruments is all piano, as before. The learner can choose other parts on the
 * import sheet (`partsOf`'s `score`); everything not in the score, and the drums, is the band.
 *
 * Reuse: the General MIDI instrument names and families are @tonejs/midi's tables (MIT); the sounds are the FluidR3
 * set the Lab already plays (sound.ts), whose names are the General MIDI ones in snake case except for ten spellings.
 */
import { InstrumentFamilyByID, instrumentByPatchID } from '@tonejs/midi/dist/InstrumentMaps.js';
import type { MidiFileContents, MidiTrack, NoteEvent } from './readMidi.ts';
import { type Frac, ZERO, cmp, gt, toNumber } from './fraction.ts';

/** The FluidR3 set's own spelling where it is not the General MIDI name in snake case. */
const FLUIDR3_SPELLING: Record<string, string> = {
  honky_tonk_piano: 'honkytonk_piano', clavi: 'clavinet', synthstrings_1: 'synth_strings_1', synthstrings_2: 'synth_strings_2',
  synth_voice: 'synth_choir', synthbrass_1: 'synth_brass_1', synthbrass_2: 'synth_brass_2', lead_8_bass_lead: 'lead_8_bass__lead',
  fx_8_sci_fi: 'fx_8_scifi', bag_pipe: 'bagpipe',
};

/** The FluidR3 sound for a General MIDI program (sound.ts plays it by this name). */
export function soundOf(program: number): string {
  const snake = (instrumentByPatchID[program] ?? 'acoustic grand piano').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_$/, '');
  return FLUIDR3_SPELLING[snake] ?? snake;
}
/** The instrument's name as a person reads it ("Electric Bass (finger)"). */
export function instrumentName(program: number): string {
  const name = instrumentByPatchID[program] ?? 'acoustic grand piano';
  return name.charAt(0).toUpperCase() + name.slice(1);
}
/** Whether a General MIDI program is a piano (its family is the first, programs 0-7). */
export const isPiano = (program: number): boolean => InstrumentFamilyByID[Math.floor(program / 8)] === 'piano';

/** One band part: what it is called, the sound it plays on ('drums' for channel 10), and its notes. */
export interface BandPart { name: string; sound: string; notes: NoteEvent[] }

/** The file split into the piano part (as tracks, for the converter) and the band. */
export interface Parts { piano: MidiTrack[]; band: BandPart[] }

/**
 * One of the file's parts, as the import sheet lists it: a track's notes on one channel (or the drums). `key` names it
 * in a choice that is kept with the piece ("track:channel", or "drums").
 */
export interface PartInfo { key: string; name: string; instrument: string; sound: string; piano: boolean; notes: number; low: number; high: number; middle: number }

interface Group { key: string; track: MidiTrack; program: number; events: NoteEvent[] }
/** Every track's notes, a group per channel, in file order. */
function groupsOf(source: MidiFileContents): Group[] {
  const out: Group[] = [];
  for (const track of source.tracks) {
    const byChannel = new Map<number, NoteEvent[]>();
    for (const e of track.events) {
      const list = byChannel.get(e.channel ?? 0);
      if (list) list.push(e);
      else byChannel.set(e.channel ?? 0, [e]);
    }
    for (const [channel, events] of [...byChannel].sort((a, b) => a[0] - b[0])) {
      out.push({ key: `${String(track.index)}:${String(channel)}`, track, program: source.programs[channel] ?? 0, events });
    }
  }
  return out;
}
const middleOf = (events: NoteEvent[]): number => {
  const pitches = events.map((e) => e.midi).sort((a, b) => a - b);
  return pitches[Math.floor(pitches.length / 2)] ?? 60;
};
function infoOf(g: Group): PartInfo {
  const pitches = g.events.map((e) => e.midi);
  return {
    key: g.key, name: g.track.name ?? instrumentName(g.program), instrument: instrumentName(g.program), sound: soundOf(g.program),
    piano: isPiano(g.program), notes: g.events.length, low: Math.min(...pitches), high: Math.max(...pitches), middle: middleOf(g.events),
  };
}

/** The file's parts, in file order, the drums last (never in the score: their numbers are drum sounds, not pitches). */
export function listParts(source: MidiFileContents): PartInfo[] {
  const parts = groupsOf(source).map(infoOf);
  if (source.drums.length) parts.push({ key: 'drums', name: 'Drums', instrument: 'Drums', sound: 'drums', piano: false, notes: source.drums.length, low: 0, high: 0, middle: 0 });
  return parts;
}

/**
 * Which parts make the score when nobody has chosen: the piano parts. A file with none (a band's guitars, bass and
 * voice) gets a guess the sheet says is one: the highest part, where a tune usually is, for the right hand, and the
 * bass for the left (owner, 2026-10-15: "Let me pick the parts"; before, every part went into the score).
 */
export function guessScore(parts: PartInfo[]): { keys: string[]; guessed: boolean } {
  const pitched = parts.filter((p) => p.key !== 'drums');
  const piano = pitched.filter((p) => p.piano).map((p) => p.key);
  if (piano.length || !pitched.length) return { keys: piano, guessed: false };
  const tune = [...pitched].sort((a, b) => b.middle - a.middle)[0]!;
  const bass = pitched.find((p) => /bass/.test(p.sound) && p !== tune) ?? [...pitched].sort((a, b) => a.middle - b.middle).find((p) => p !== tune);
  return { keys: [tune.key, ...(bass ? [bass.key] : [])], guessed: true };
}

/**
 * The file as the score's parts and the band: `score` names the parts written (every part named, each as its own
 * track for the converter: two are kept as the hands, the higher on the upper staff unless all are piano parts, which
 * keep the file's order), and every other part, with the drums, is the band. Without `score`, `guessScore`'s.
 */
export function partsOf(source: MidiFileContents, score?: readonly string[]): Parts {
  const groups = groupsOf(source);
  const keys = new Set(score ?? guessScore(listParts(source)).keys);
  const chosen = groups.filter((g) => keys.has(g.key));
  const allPiano = chosen.every((g) => isPiano(g.program));
  const ordered = allPiano ? chosen : [...chosen].sort((a, b) => middleOf(b.events) - middleOf(a.events));
  // Piano parts on one track stay one track (a recording of two hands on one channel each is still split by the
  // converter as before); parts chosen from a band file are a track each.
  const piano: MidiTrack[] = [];
  for (const g of ordered) {
    const same = allPiano ? piano.find((t) => t.index === g.track.index) : undefined;
    if (same) same.events = [...same.events, ...g.events].sort((a, b) => cmp(a.start, b.start) || a.midi - b.midi);
    else piano.push({ index: g.track.index, name: allPiano ? g.track.name : g.track.name ?? instrumentName(g.program), events: g.events });
  }
  const band: BandPart[] = groups.filter((g) => !keys.has(g.key)).map((g) => ({ name: g.track.name ?? instrumentName(g.program), sound: soundOf(g.program), notes: g.events }));
  if (source.drums.length) band.push({ name: 'Drums', sound: 'drums', notes: source.drums });
  return { piano, band };
}

/** Where the last band note ends (quarter notes), so the score's bars run as long as the band plays. */
export function bandEnd(band: BandPart[]): Frac {
  let end = ZERO;
  for (const part of band) for (const n of part.notes) if (gt(n.end, end)) end = n.end;
  return end;
}

/** A band note for playing: when and how long in quarter notes from the start, which key (or drum), how hard. */
export interface BandNote { q: number; len: number; midi: number; vel: number; sound: string }

/** Every band note, in time order, for the score screen to place on the score's own timeline. */
export function bandNotes(band: BandPart[]): BandNote[] {
  return band
    .flatMap((part) => part.notes.map((n) => ({ start: n.start, q: toNumber(n.start), len: toNumber(n.end) - toNumber(n.start), midi: n.midi, vel: n.velocity ?? 80, sound: part.sound })))
    .sort((a, b) => cmp(a.start, b.start))
    .map(({ start: _, ...note }) => note);
}
