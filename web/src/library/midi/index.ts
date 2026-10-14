// The MIDI converter as the library calls it (2026-10-13). The converter itself (convert.ts and the files it
// imports) is the old app's, ported unchanged; this file only gathers what it already reports into one account
// of what came from the file and what was guessed, and applies the two corrections (corrections.ts) the old
// import sheet offered: swap the hands, state the tempo. Nothing here decides anything about the music.

import { ConvertError, convertMidi, titleFromFilename, type ConversionReport, type ConvertOptions } from './convert.ts';
import { MidiReadError, readMidi } from './readMidi.ts';
import { STATED_TEMPO_RANGE, swapHands, withOpeningTempo } from './corrections.ts';
import { checkSentence, handsSentence } from './words.ts';

export { ConvertError, MIDI_CONVERTER_VERSION, titleFromFilename, type ConversionReport } from './convert.ts';
export { MidiReadError } from './readMidi.ts';
export { STATED_TEMPO_RANGE, swapHands, withOpeningTempo } from './corrections.ts';
export { checkSentence, handsSentence } from './words.ts';

export interface MidiOptions {
  /** What the score is called; the library passes `titleFromFilename(file name)`. Default "Untitled". */
  title?: string;
  /** Exchange the two staves after converting (`swapHands`): the "Swap hands" fix. */
  swapHands?: boolean;
  /** The learner's tempo in quarter notes a minute (`withOpeningTempo`), 20–400. */
  bpm?: number;
  /** The converter's own options, for a test or a later need; the library passes none. */
  convert?: Omit<ConvertOptions, 'title'>;
}

/** What was read from the file and what the converter (or the learner) supplied. */
export interface Guessed {
  hands: {
    /** `kept`: the file's two tracks as recorded; `split`: one line split by voice-leading;
     *  `merged then split`: three or more tracks made one line, then split. */
    method: 'kept' | 'split' | 'merged then split';
    noteTracks: number;
    trackNames: string[];
    /** The staves' names, upper first, as the converter wrote them (before any swap). */
    parts: string[];
    swapped: boolean;
    /** Why a swap that was asked for was not made (one staff, …). */
    swapRefused?: string;
    sentence: string;
  };
  tempo: { bpm: number | null; from: 'file' | 'stated' | 'none in the file' };
  key: { name: string; from: 'estimated from the notes' | 'chosen'; fileSignatures: string[] };
  time: { beats: number; beatType: number; from: 'file' | 'assumed' | 'chosen' };
  check: { passed: boolean; sentence: string };
}

export interface MidiConversion {
  xml: string;
  report: ConversionReport;
  guessed: Guessed;
}

/**
 * One MIDI file as MusicXML, with what was guessed. Throws `MidiReadError` or `ConvertError` with a sentence a
 * learner can act on (a file that is not MIDI, has no notes, …), or `ConvertError` for a stated tempo out of range.
 * To swap the hands or state a tempo, call again on the same bytes with `swapHands` / `bpm`: the conversion is
 * deterministic, so everything else comes out the same.
 */
export function convert(data: ArrayBuffer | Uint8Array, options: MidiOptions = {}): MidiConversion {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  if (options.bpm !== undefined && !(Number.isFinite(options.bpm) && options.bpm >= STATED_TEMPO_RANGE.min && options.bpm <= STATED_TEMPO_RANGE.max)) {
    throw new ConvertError(`A tempo is between ${String(STATED_TEMPO_RANGE.min)} and ${String(STATED_TEMPO_RANGE.max)} quarter notes a minute; ${String(options.bpm)} is not.`);
  }
  const { xml: converted, report } = convertMidi(bytes, { ...options.convert, title: options.title ?? 'Untitled' });
  // The file's tempo and metre as the converter read them (it writes the tempo but does not report it).
  const source = readMidi(bytes);
  const fileTempo = source.tempo;
  const chosenTime = options.convert?.timeSignature ?? null;
  const time = chosenTime ?? source.timeSignature;

  let xml = converted;
  let swapped = false;
  let swapRefused: string | undefined;
  if (options.swapHands) {
    const result = swapHands(xml);
    if ('xml' in result) { xml = result.xml; swapped = true; } else swapRefused = result.refused;
  }
  if (options.bpm !== undefined) xml = withOpeningTempo(xml, options.bpm);

  const split = report.hands === 'split into two';
  let sentence = handsSentence(report);
  if (swapped) sentence += ' Then the hands were swapped: what that put on the upper staff is now on the lower, and the other way round.';
  const guessed: Guessed = {
    hands: {
      method: !split ? 'kept' : report.noteTracks > 2 ? 'merged then split' : 'split',
      noteTracks: report.noteTracks,
      trackNames: report.noteTrackNames,
      parts: report.parts,
      swapped,
      ...(swapRefused === undefined ? {} : { swapRefused }),
      sentence,
    },
    tempo: options.bpm !== undefined
      ? { bpm: Math.round(options.bpm * 1000) / 1000, from: 'stated' }
      : fileTempo === null ? { bpm: null, from: 'none in the file' } : { bpm: Math.round(fileTempo * 1000) / 1000, from: 'file' },
    key: { name: report.key, from: report.keyFrom, fileSignatures: report.midiKeySignatures },
    time: { beats: time.beats, beatType: time.beatType, from: chosenTime ? 'chosen' : source.hadTimeSignature ? 'file' : 'assumed' },
    check: { passed: report.passed, sentence: checkSentence(report) },
  };
  return { xml, report, guessed };
}

/** What was guessed, in a few sentences, for the library's "converted" line. */
export function guessedWords(g: Guessed): string {
  const tempo = g.tempo.from === 'stated' ? `Tempo ${String(g.tempo.bpm)} a minute, as you stated it.`
    : g.tempo.from === 'file' ? `Tempo ${String(g.tempo.bpm)} a minute, from the file.`
    : 'The file states no tempo; the app’s default is used.';
  const key = g.key.from === 'chosen' ? `Key ${g.key.name}, as chosen.`
    : `Key ${g.key.name}, estimated from the notes${g.key.fileSignatures.length > 0 ? ` (the file’s own signature: ${g.key.fileSignatures.join(', ')})` : ''}.`;
  const metre = `${String(g.time.beats)}/${String(g.time.beatType)}`;
  const time = g.time.from === 'assumed' ? `Time ${metre}, assumed: the file states none.`
    : g.time.from === 'chosen' ? `Time ${metre}, as chosen.` : `Time ${metre}, from the file.`;
  return [g.hands.sentence, ...(g.hands.swapRefused ? [g.hands.swapRefused] : []), tempo, key, time, g.check.sentence].join(' ');
}

/**
 * The shape `library/files.ts` takes (`Converter`): bytes and the file's name in, MusicXML and the guessed words
 * out. Errors become one sentence naming the file, as the old import did.
 */
export async function midiConverter(data: ArrayBuffer, name: string, options: Omit<MidiOptions, 'title'> = {}): Promise<{ xml: string; guessed: string; account: Guessed }> {
  try {
    const { xml, guessed } = convert(data, { ...options, title: titleFromFilename(name) });
    return { xml, guessed: guessedWords(guessed), account: guessed };
  } catch (cause) {
    throw new Error(cause instanceof MidiReadError || cause instanceof ConvertError ? `${name}: ${cause.message}` : `${name} could not be converted from MIDI.`);
  }
}
