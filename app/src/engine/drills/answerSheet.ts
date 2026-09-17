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
import {
  DIVISIONS,
  writeMusicXml,
  type NoteType,
  type WriterMeasure,
  type WriterNote,
} from '../musicXmlWriter';

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
  /**
   * The finished run these notes are the beginning of, when the same staff is
   * drawn again and again as the run grows (Simon's play-along staff, `04`
   * §5c-2).
   *
   * Three things are chosen here to fit the notes given — the key signature,
   * the clef and the note value — and all three would otherwise change under
   * the learner part-way through: a chain gains a flat at its fourth note, or
   * dips below middle C at its sixth, and the staff re-engraves itself with
   * everything already on it in a different place. A staff that does that is
   * not one building up left to right, so the three are settled once, from the
   * whole run, and only the notes drawn grow.
   *
   * It also asks for **one bar**, whatever the run reaches: past eight notes a
   * growing run is written in sixteenths rather than spread over bars of
   * quarters, because the host it is drawn into is the width of a phone card
   * and three bars wrap into two systems there — which would make the card
   * taller half way through the run, which is the one thing this staff must
   * never do.
   */
  wholeRun?: readonly number[];
}

/** MusicXML for the answer, or null when there is nothing to draw. */
export function answerSheet(options: AnswerSheetOptions): string | null {
  const notes = options.notes.filter((m) => Number.isFinite(m));
  if (notes.length === 0) return null;
  // What the page is *shaped* for, which is the whole run when there is one
  // and otherwise exactly the notes on it.
  const whole = (options.wholeRun ?? notes).filter((m) => Number.isFinite(m));
  const shape = whole.length > 0 ? whole : notes;
  const fifths = fifthsFor(shape);
  const clef: 'G' | 'F' = Math.min(...shape) < 60 ? 'F' : 'G';
  const beatsPerBar = 4;
  const barLength = DIVISIONS * beatsPerBar;

  const measures: WriterMeasure[] = [];
  if (options.ordered) {
    // Up to eight notes fit one bar as eighths, which keeps a scale on one
    // line of a phone; a longer run (two octaves) takes quarters over bars.
    let step = DIVISIONS / 2;
    let type: NoteType = 'eighth';
    if (shape.length > 8) {
      // A run drawn *as it grows* stays on one bar however long it gets:
      // sixteen sixteenths are one bar, and Simon's chain caps at twelve. The
      // alternative — quarters over three bars, which is right for a
      // two-octave scale drawn once — is three bars OSMD wraps into two or
      // three systems in a card-width host, and the card would then grow
      // taller half way through a chain and push the buttons off the screen.
      step = options.wholeRun === undefined ? DIVISIONS : DIVISIONS / 4;
      type = options.wholeRun === undefined ? 'quarter' : '16th';
    }
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
    // A run of sixteenths does not have to end on a beat — nine of them leave
    // three divisions — so the filler goes down to the value the run is in.
    [DIVISIONS / 4, '16th'],
  ] as const) {
    while (left >= size) {
      out.push({ midi: null, duration: size, type, voice: 1 });
      left -= size;
    }
  }
  return out;
}
