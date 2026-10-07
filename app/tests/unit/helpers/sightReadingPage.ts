// Phrases for the scorer's tests (D1): built from a line of note names, for
// the parts' constructed cases (`sightReadingScore.test.ts`), and read back
// out of the MusicXML the generator writes, for the distribution suite
// (`sightReadingDistribution.test.ts`) — so the suite measures what is on the
// page, and would measure the committed generator's pages the same way.

import { DIVISIONS } from '../../../src/engine/musicXmlWriter';
import { phraseModel, type Metre, type PhraseModel, type WrittenNote } from '../../../src/engine/sightReadingScore';

const LENGTHS: Record<string, number> = {
  w: DIVISIONS * 4,
  'h.': DIVISIONS * 3,
  h: DIVISIONS * 2,
  'q.': DIVISIONS * 1.5,
  q: DIVISIONS,
  'e.': (DIVISIONS * 3) / 4,
  e: DIVISIONS / 2,
  s: DIVISIONS / 4,
  /** A triplet eighth. */
  t: DIVISIONS / 3,
};

const STEPS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** `C4`, `F#4`, `Bb3` → MIDI. */
export function midiOf(name: string): number {
  const match = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!match) throw new Error(`not a pitch: ${name}`);
  const alter = match[2] === '#' ? 1 : match[2] === 'b' ? -1 : 0;
  return (Number(match[3]) + 1) * 12 + (STEPS[match[1] as string] as number) + alter;
}

/**
 * One bar from `"C4q D4e E4e r-q G4h~"`: a pitch and a length (`w h. h q. q
 * e. e s t`), `r-` for a rest, `~` for a tie into the next note (which is then
 * written as the tie's stop).
 */
export function barOf(text: string, tiedIn = false): { notes: WrittenNote[]; tiesOut: boolean } {
  const notes: WrittenNote[] = [];
  let pendingStop = tiedIn;
  let tiesOut = false;
  for (const token of text.trim().split(/\s+/)) {
    const tie = token.endsWith('~');
    const body = tie ? token.slice(0, -1) : token;
    const match = /^(r-|[A-G][#b]?-?\d)(w|h\.|h|q\.|q|e\.|e|s|t)$/.exec(body);
    if (!match) throw new Error(`not a note: ${token}`);
    const pitch = match[1] as string;
    const length = LENGTHS[match[2] as string] as number;
    const midi = pitch === 'r-' ? null : midiOf(pitch);
    const tieMark: WrittenNote['tie'] = pendingStop && tie ? 'both' : pendingStop ? 'stop' : tie ? 'start' : undefined;
    notes.push({ midi, duration: length, ...(tieMark ? { tie: tieMark } : {}), ...(match[2] === 't' ? { tuplet: true } : {}) });
    pendingStop = tie;
    tiesOut = tie;
  }
  return { notes, tiesOut };
}

/** A phrase from one string per bar, with the harmony under each bar given as scale degrees (0 = I). */
export function phraseFrom(options: {
  bars: readonly string[];
  level?: number;
  fifths?: number;
  metre?: Metre;
  harmony?: readonly (number | null)[];
  maxLeap?: number;
  restsAllowed?: boolean;
}): PhraseModel {
  let tied = false;
  const melody = options.bars.map((text) => {
    const bar = barOf(text, tied);
    tied = bar.tiesOut;
    return bar.notes;
  });
  const model = phraseModel({
    level: options.level ?? 3,
    fifths: options.fifths ?? 0,
    metre: options.metre ?? { beats: 4, beatType: 4 },
    melody,
    maxLeap: options.maxLeap ?? 3,
    restsAllowed: options.restsAllowed ?? true,
  });
  return { ...model, harmony: options.harmony ?? model.harmony };
}

const PITCH_CLASS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** What the written page says, one line per staff. */
export interface WrittenPhrase {
  fifths: number;
  metre: Metre;
  staves: 1 | 2;
  /** `lines[0]` is the treble staff's bars, `lines[1]` the bass staff's. */
  lines: [WrittenNote[][], WrittenNote[][]];
}

/**
 * Reads a generated phrase's MusicXML back into its lines.
 *
 * By pattern, not by a DOM: the writer (`musicXmlWriter.ts`) emits one fixed,
 * plain shape, and jsdom's XML parser cost tens of milliseconds a phrase, which
 * over the distribution suite's thousands of phrases was most of its budget.
 * The patterns read exactly the elements the writer writes; a phrase they could
 * not read would come back with no notes and fail the suite's own checks.
 */
export function readWritten(xml: string): WrittenPhrase {
  const first = (pattern: RegExp, fallback: string): string => pattern.exec(xml)?.[1] ?? fallback;
  const lines: [WrittenNote[][], WrittenNote[][]] = [[], []];
  for (const measure of xml.matchAll(/<measure\b[^>]*>([\s\S]*?)<\/measure>/g)) {
    const bar: [WrittenNote[], WrittenNote[]] = [[], []];
    for (const found of (measure[1] ?? '').matchAll(/<note>([\s\S]*?)<\/note>/g)) {
      const note = found[1] ?? '';
      const staff = /<staff>2<\/staff>/.test(note) ? 1 : 0;
      const step = /<step>([A-G])<\/step>/.exec(note)?.[1];
      const midi =
        step === undefined
          ? null
          : (Number(/<octave>(-?\d+)<\/octave>/.exec(note)?.[1] ?? 4) + 1) * 12 +
            (PITCH_CLASS[step] ?? 0) +
            Number(/<alter>(-?\d+)<\/alter>/.exec(note)?.[1] ?? 0);
      const start = /<tie type="start"\/>/.test(note);
      const stop = /<tie type="stop"\/>/.test(note);
      const tie: WrittenNote['tie'] = start && stop ? 'both' : start ? 'start' : stop ? 'stop' : undefined;
      bar[staff].push({
        midi,
        duration: Number(/<duration>(\d+)<\/duration>/.exec(note)?.[1] ?? 0),
        ...(tie ? { tie } : {}),
        ...(/<time-modification>/.test(note) ? { tuplet: true } : {}),
        ...(/<chord\/>/.test(note) ? { chord: true } : {}),
      });
    }
    lines[0].push(bar[0]);
    lines[1].push(bar[1]);
  }
  return {
    fifths: Number(first(/<fifths>(-?\d+)<\/fifths>/, '0')),
    metre: { beats: Number(first(/<beats>(\d+)<\/beats>/, '4')), beatType: Number(first(/<beat-type>(\d+)<\/beat-type>/, '4')) },
    staves: first(/<staves>(\d+)<\/staves>/, '1') === '2' ? 2 : 1,
    lines,
  };
}

/**
 * The phrase as the scorer reads it, from the page: the melody on the treble
 * staff (on the bass staff where the left hand reads the tune alone, level 1),
 * and the bass staff's chords under it where it accompanies.
 */
export function phraseFromXml(
  xml: string,
  rules: { level: number; maxLeap: number; restsAllowed: boolean; leftHandMelody: boolean },
): PhraseModel {
  const page = readWritten(xml);
  const melody = rules.leftHandMelody ? page.lines[1] : page.lines[0];
  // A treble staff of whole-bar rests under a left hand alone is no melody.
  const sounding = melody.some((bar) => bar.some((note) => note.midi !== null));
  return phraseModel({
    level: rules.level,
    fifths: page.fifths,
    metre: page.metre,
    melody: sounding ? melody : melody.map(() => []),
    left: rules.leftHandMelody || page.staves === 1 ? null : page.lines[1],
    maxLeap: rules.maxLeap,
    restsAllowed: rules.restsAllowed,
  });
}
