/**
 * The answer to a drill prompt, as a line of notation.
 *
 * Behind *Show me* on the drill screen (docs/04 §5c): a name, eight lit keys
 * on the strip and eight notes on a staff are the same fact three ways, and
 * the staff is the one that shows the *shape* — the half-steps sit where the
 * accidentals do. Nothing here decides whether to show it; the screen does,
 * and forfeits the prompt's mark when it does.
 *
 * A scale is written as eighths in one bar (quarters over several when it
 * is longer than eight notes); a chord as one whole note. The key signature is chosen to fit the notes: for a mode that is its
 * parent major key, so B♭ aeolian prints five flats and no accidentals, which
 * is the honest picture of why it sounds the way it does. An answer that
 * sits below middle C is written in the bass clef.
 */
import { DIVISIONS, writeMusicXml, type WriterMeasure, type WriterNote } from '../musicXmlWriter';

/** Pitch classes of the major scale whose key signature has `fifths`. */
function majorPitchClasses(fifths: number): Set<number> {
  const tonic = (((fifths * 7) % 12) + 12) % 12;
  return new Set([0, 2, 4, 5, 7, 9, 11].map((step) => (tonic + step) % 12));
}

/**
 * The key signature that leaves the fewest accidentals, nearest to C on a tie.
 *
 * Exported for the test: a seven-note mode always has a signature that fits
 * every note, and a triad has several, of which C is the plainest.
 */
export function fifthsFor(midis: readonly number[]): number {
  const classes = new Set(midis.map((m) => ((m % 12) + 12) % 12));
  let best = 0;
  let bestScore = -1;
  for (const fifths of [0, -1, 1, -2, 2, -3, 3, -4, 4, -5, 5, -6, 6]) {
    const scale = majorPitchClasses(fifths);
    let inKey = 0;
    for (const pc of classes) if (scale.has(pc)) inKey += 1;
    if (inKey > bestScore) {
      bestScore = inKey;
      best = fifths;
    }
  }
  return best;
}

export interface AnswerSheetOptions {
  title: string;
  /** The notes to draw, in the order they are played when `ordered`. */
  notes: readonly number[];
  /** A scale or arpeggio (one note after another) rather than a chord. */
  ordered: boolean;
}

/** MusicXML for the answer, or null when there is nothing to draw. */
export function answerSheet(options: AnswerSheetOptions): string | null {
  const notes = options.notes.filter((m) => Number.isFinite(m));
  if (notes.length === 0) return null;
  const fifths = fifthsFor(notes);
  const clef: 'G' | 'F' = Math.min(...notes) < 60 ? 'F' : 'G';
  const beatsPerBar = 4;
  const barLength = DIVISIONS * beatsPerBar;

  const measures: WriterMeasure[] = [];
  if (options.ordered) {
    // Up to eight notes fit one bar as eighths, which keeps a scale on one
    // line of a phone; a longer run (two octaves) takes quarters over bars.
    const step = notes.length <= 8 ? DIVISIONS / 2 : DIVISIONS;
    const type = notes.length <= 8 ? 'eighth' : 'quarter';
    const perBar = barLength / step;
    for (let at = 0; at < notes.length; at += perBar) {
      const played: WriterNote[] = notes
        .slice(at, at + perBar)
        .map((midi) => ({ midi, duration: step, type, voice: 1 }));
      const short = barLength - played.length * step;
      if (short > 0) played.push(...rests(short));
      measures.push({ notes: played });
    }
  } else {
    const sorted = [...new Set(notes)].sort((a, b) => a - b);
    measures.push({
      notes: sorted.map((midi, index) => ({
        midi,
        duration: barLength,
        type: 'whole',
        voice: 1,
        ...(index > 0 ? { chord: true } : {}),
      })),
    });
  }
  return writeMusicXml({
    title: options.title,
    fifths,
    beats: beatsPerBar,
    beatType: 4,
    bpm: 80,
    staves: 1,
    clef,
    measures,
  });
}

/** Rests that fill `duration` divisions, largest first. */
function rests(duration: number): WriterNote[] {
  const out: WriterNote[] = [];
  let left = duration;
  for (const [size, type] of [
    [DIVISIONS * 4, 'whole'],
    [DIVISIONS * 2, 'half'],
    [DIVISIONS, 'quarter'],
    [DIVISIONS / 2, 'eighth'],
  ] as const) {
    while (left >= size) {
      out.push({ midi: null, duration: size, type, voice: 1 });
      left -= size;
    }
  }
  return out;
}
