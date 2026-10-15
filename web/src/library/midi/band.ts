/**
 * A band file's parts (owner, 2026-10-15: keep the non-piano parts as MIDI and play them as the band; only the piano
 * part becomes the score). Which part is which is read from the file: each channel's General MIDI instrument (its
 * program change) and channel 10 for the drums.
 *
 * A part is a track's notes on one channel and instrument (a format 0 file keeps every instrument in one track, told
 * apart by channel; a channel can change instrument partway, and each note is the instrument in force where it starts:
 * review 2026-10-15, B7-01). By default the score is every part on a channel set to the General MIDI piano family (programs 0-7: the
 * pianos, electric pianos, harpsichord and clavinet); a channel the file never sets is program 0, the piano, as General
 * MIDI says, so a file that names no instruments is all piano, as before. The learner can choose other parts on the
 * import sheet (`partsOf`'s `score`); everything not in the score, and the drums, is the band.
 *
 * Reuse: the General MIDI instrument names and families are @tonejs/midi's tables (MIT); the sounds are the FluidR3
 * set the Lab already plays (sound.ts), whose names are the General MIDI ones in snake case except for ten spellings.
 */
import { InstrumentFamilyByID, instrumentByPatchID } from '@tonejs/midi/dist/InstrumentMaps.js';
import type { MidiFileContents, MidiTrack, NoteEvent } from './readMidi.ts';
import { type Frac, ZERO, add, cmp, frac, gt, isZero, lt, lte, sub, toNumber } from './fraction.ts';
import { barMap } from './bars.ts';

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

/** channelKey: the whole channel on its track ("track:channel"), which a choice saved before a channel could change instrument names. */
interface Group { key: string; channelKey: string; name: string; track: MidiTrack; channel: number; program: number; events: NoteEvent[] }
type Changes = MidiFileContents['programChanges'];
/**
 * The instrument a note on a channel plays: the last change on the channel at or before it starts (one at the same moment
 * counts). Before any, 0, the piano, as General MIDI says a channel starts.
 */
function programAt(changes: Changes, start: Frac): number {
  let program = 0;
  for (const c of changes) {
    if (gt(c.at, start)) break;
    program = c.program;
  }
  return program;
}
/**
 * Every track's notes, a group per channel and instrument, in file order (by channel, then by each instrument's first
 * note). Its key is "track:channel", or "track:channel:program" where the channel changes instrument on the track. Its
 * name is the track's when the track holds one part; a track holding several (a one-track file, named for the song) names
 * each by its instrument, and by its channel too where two play the same one (review 2026-10-15, B7-02).
 */
function groupsOf(source: MidiFileContents): Group[] {
  const byChannel = new Map<number, Changes>();
  for (const c of source.programChanges) byChannel.set(c.channel, [...(byChannel.get(c.channel) ?? []), c]);
  const out: Group[] = [];
  for (const track of source.tracks) {
    const parts = new Map<string, Group>();
    for (const e of track.events) {
      const channel = e.channel ?? 0, program = programAt(byChannel.get(channel) ?? [], e.start);
      const id = `${String(channel)}:${String(program)}`;
      const group = parts.get(id);
      if (group) group.events.push(e);
      else parts.set(id, { key: '', channelKey: `${String(track.index)}:${String(channel)}`, name: '', track, channel, program, events: [e] });
    }
    const groups = [...parts.values()].sort((a, b) => a.channel - b.channel);
    for (const g of groups) {
      g.key = groups.filter((o) => o.channel === g.channel).length > 1 ? `${g.channelKey}:${String(g.program)}` : g.channelKey;
      g.name = groups.length === 1 ? track.name ?? instrumentName(g.program)
        : groups.filter((o) => o.program === g.program).length > 1 ? `${instrumentName(g.program)}, channel ${String(g.channel + 1)}` : instrumentName(g.program);
    }
    out.push(...groups);
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
    key: g.key, name: g.name, instrument: instrumentName(g.program), sound: soundOf(g.program),
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
  const inScore = (g: Group): boolean => keys.has(g.key) || keys.has(g.channelKey);
  const chosen = groups.filter(inScore);
  const allPiano = chosen.every((g) => isPiano(g.program));
  const ordered = allPiano ? chosen : [...chosen].sort((a, b) => middleOf(b.events) - middleOf(a.events));
  // Piano parts on one track stay one track (a recording of two hands on one channel each is still split by the
  // converter as before); parts chosen from a band file are a track each.
  const piano: MidiTrack[] = [];
  for (const g of ordered) {
    const same = allPiano ? piano.find((t) => t.index === g.track.index) : undefined;
    if (same) same.events = [...same.events, ...g.events].sort((a, b) => cmp(a.start, b.start) || a.midi - b.midi);
    else piano.push({ index: g.track.index, name: allPiano ? g.track.name : g.name, events: g.events });
  }
  const band: BandPart[] = groups.filter((g) => !inScore(g)).map((g) => ({ name: g.name, sound: soundOf(g.program), notes: g.events }));
  if (source.drums.length) band.push({ name: 'Drums', sound: 'drums', notes: source.drums });
  return { piano, band };
}

/**
 * The file without the whole bars of silence before its first note (piano or band): a sequencer's count-in. The
 * owner's Warmness on the Soul opened with three empty bars that the published arrangement does not have
 * (2026-10-15). Everything moves back by the same whole bars, the metre and key in force there kept from the start.
 * The converter and the score screen's band both read the file through this, so they stay together.
 */
export function trimLeadIn(file: MidiFileContents): MidiFileContents {
  let first: Frac | null = null;
  for (const e of [...file.tracks.flatMap((t) => t.events), ...file.drums]) if (first === null || lt(e.start, first)) first = e.start;
  if (first === null || isZero(first)) return file;
  const bars = barMap(file.timeSignatures, add(first, frac(64)));
  const lead = bars.bar(bars.indexAt(first)).start;
  if (isZero(lead)) return file;
  const move = (e: NoteEvent): NoteEvent => ({ ...e, start: sub(e.start, lead), end: sub(e.end, lead) });
  const from = <T extends { at: Frac }>(list: T[]): T[] => {
    const before = list.filter((x) => lte(x.at, lead));
    const kept = before.length ? [{ ...before[before.length - 1]!, at: ZERO }] : [];
    return [...kept, ...list.filter((x) => gt(x.at, lead)).map((x) => ({ ...x, at: sub(x.at, lead) }))];
  };
  return {
    ...file,
    tracks: file.tracks.map((t) => ({ ...t, events: t.events.map(move) })),
    drums: file.drums.map(move),
    // The pedal as it stands where the music starts (pressed in the count-in: down from the start), then its changes.
    pedal: [
      ...[...new Set(file.pedal.map((p) => p.channel))].flatMap((channel) => {
        const before = file.pedal.filter((p) => p.channel === channel && lt(p.at, lead));
        return before.length && before[before.length - 1]!.down ? [{ channel, at: ZERO, down: true }] : [];
      }),
      ...file.pedal.filter((p) => !lt(p.at, lead)).map((p) => ({ ...p, at: sub(p.at, lead) })),
    ],
    timeSignatures: from(file.timeSignatures),
    keyChanges: from(file.keyChanges),
    // Each channel's instrument as it stands where the music starts, then its changes (B7-01).
    programChanges: [
      ...[...new Set(file.programChanges.map((c) => c.channel))].flatMap((channel) => {
        const before = file.programChanges.filter((c) => c.channel === channel && lte(c.at, lead));
        return before.length ? [{ ...before[before.length - 1]!, at: ZERO }] : [];
      }),
      ...file.programChanges.filter((c) => gt(c.at, lead)).map((c) => ({ ...c, at: sub(c.at, lead) })),
    ],
  };
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
