/**
 * A band file's parts (owner, 2026-10-15: keep the non-piano parts as MIDI and play them as the band; only the piano
 * part becomes the score). Which part is which is read from the file: each channel's General MIDI instrument (its
 * program change) and channel 10 for the drums.
 *
 * The piano part is every note on a channel set to the General MIDI piano family (programs 0-7: the pianos, electric
 * pianos, harpsichord and clavinet), on any track. Everything else is the band, a part per track and channel (a
 * format 0 file keeps every instrument in one track, told apart by channel). A channel the file never sets is
 * program 0, the piano, as General MIDI says; so a file that names no instruments is all piano, as before. A file
 * with no piano notes at all keeps every part in the score, as before, and only its drums play as the band.
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

export function partsOf(source: MidiFileContents): Parts {
  const programOf = (e: NoteEvent) => source.programs[e.channel ?? 0] ?? 0;
  const anyPiano = source.tracks.some((t) => t.events.some((e) => isPiano(programOf(e))));
  const drums: BandPart[] = source.drums.length ? [{ name: 'Drums', sound: 'drums', notes: source.drums }] : [];
  if (!anyPiano) return { piano: source.tracks, band: drums };
  const band: BandPart[] = [];
  const piano = source.tracks.map((track) => {
    const byChannel = new Map<number, NoteEvent[]>();
    for (const e of track.events) {
      if (isPiano(programOf(e))) continue;
      const list = byChannel.get(e.channel ?? 0);
      if (list) list.push(e);
      else byChannel.set(e.channel ?? 0, [e]);
    }
    for (const [channel, notes] of byChannel) {
      const program = source.programs[channel] ?? 0;
      band.push({ name: track.name ?? instrumentName(program), sound: soundOf(program), notes });
    }
    return { ...track, events: track.events.filter((e) => isPiano(programOf(e))) };
  });
  return { piano, band: [...band, ...drums] };
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
