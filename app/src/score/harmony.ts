/**
 * Chord symbols out of MusicXML, for the chord-chart view (docs/04 §3b).
 *
 * `extractScoreModel` deliberately does not carry these: it models *notes*,
 * and the follow engine has no use for a chord symbol. The chart view has no
 * use for anything else, so it reads the file again for just this.
 *
 * Parsed with regexes rather than a DOM, for the same reason `score/mxl.ts`
 * is: this has to run in Node tests, and `<harmony>` is a flat, fixed shape.
 */

export interface ChordSymbol {
  /** 1-based measure number as written in the file. */
  measure: number;
  /** "C", "Am7", "G7/B" — what is printed above the stave. */
  text: string;
  /** Pitch classes 0–11 for the notes of the chord, for matching what is played. */
  pitchClasses: number[];
  root: number;
  bass?: number;
}

const STEP_TO_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/**
 * MusicXML `<kind>` -> the suffix printed and the intervals above the root.
 *
 * Not exhaustive — MusicXML defines about forty kinds and a lead sheet uses a
 * dozen. Anything unlisted keeps its own name and is matched on the triad,
 * which is better than dropping the bar.
 */
const KINDS: Record<string, { suffix: string; intervals: number[] }> = {
  major: { suffix: '', intervals: [0, 4, 7] },
  minor: { suffix: 'm', intervals: [0, 3, 7] },
  augmented: { suffix: '+', intervals: [0, 4, 8] },
  diminished: { suffix: '°', intervals: [0, 3, 6] },
  dominant: { suffix: '7', intervals: [0, 4, 7, 10] },
  'major-seventh': { suffix: 'maj7', intervals: [0, 4, 7, 11] },
  'minor-seventh': { suffix: 'm7', intervals: [0, 3, 7, 10] },
  'diminished-seventh': { suffix: '°7', intervals: [0, 3, 6, 9] },
  'half-diminished': { suffix: 'ø7', intervals: [0, 3, 6, 10] },
  'major-sixth': { suffix: '6', intervals: [0, 4, 7, 9] },
  'minor-sixth': { suffix: 'm6', intervals: [0, 3, 7, 9] },
  'suspended-fourth': { suffix: 'sus4', intervals: [0, 5, 7] },
  'suspended-second': { suffix: 'sus2', intervals: [0, 2, 7] },
  'dominant-ninth': { suffix: '9', intervals: [0, 4, 7, 10, 2] },
  power: { suffix: '5', intervals: [0, 7] },
};

function alterSymbol(alter: number): string {
  if (alter > 0) return '♯'.repeat(alter);
  if (alter < 0) return '♭'.repeat(-alter);
  return '';
}

function stepToPc(step: string, alter: number): number | null {
  const base = STEP_TO_PC[step.toUpperCase()];
  if (base === undefined) return null;
  return (((base + alter) % 12) + 12) % 12;
}

/** Every chord symbol in the file, in written order. */
export function parseHarmony(xml: string): ChordSymbol[] {
  const out: ChordSymbol[] = [];
  const measurePattern = /<measure\b[^>]*\bnumber="([^"]+)"[^>]*>([\s\S]*?)<\/measure>/g;

  for (const measureMatch of xml.matchAll(measurePattern)) {
    const measure = Number.parseInt(measureMatch[1] ?? '0', 10);
    const contents = measureMatch[2] ?? '';
    for (const harmonyMatch of contents.matchAll(/<harmony\b[^>]*>([\s\S]*?)<\/harmony>/g)) {
      const block = harmonyMatch[1] ?? '';
      const step = /<root-step>([A-Ga-g])<\/root-step>/.exec(block)?.[1];
      if (!step) continue;
      const alter = Number(/<root-alter>(-?\d+)<\/root-alter>/.exec(block)?.[1] ?? '0');
      const root = stepToPc(step, alter);
      if (root === null) continue;

      const kindMatch = /<kind\b([^>]*)>([^<]*)<\/kind>/.exec(block);
      const kindName = (kindMatch?.[2] ?? 'major').trim();
      const printed = /\btext="([^"]*)"/.exec(kindMatch?.[1] ?? '')?.[1];
      const kind = KINDS[kindName] ?? { suffix: kindName === 'none' ? '' : kindName, intervals: [0, 4, 7] };

      const bassStep = /<bass-step>([A-Ga-g])<\/bass-step>/.exec(block)?.[1];
      const bassAlter = Number(/<bass-alter>(-?\d+)<\/bass-alter>/.exec(block)?.[1] ?? '0');
      const bass = bassStep ? stepToPc(bassStep, bassAlter) : null;

      const rootName = `${step.toUpperCase()}${alterSymbol(alter)}`;
      const suffix = printed ?? kind.suffix;
      const bassName = bassStep ? `/${bassStep.toUpperCase()}${alterSymbol(bassAlter)}` : '';

      out.push({
        measure,
        text: `${rootName}${suffix}${bassName}`,
        pitchClasses: kind.intervals.map((interval) => (root + interval) % 12),
        root,
        ...(bass === null ? {} : { bass }),
      });
    }
  }
  return out;
}

/**
 * One entry per bar, so the chart is a grid and not a ragged list.
 *
 * A bar with no `<harmony>` of its own repeats the last one — which is what
 * the printed page means by leaving it blank.
 */
export function chartBars(symbols: ChordSymbol[], measureCount: number): (ChordSymbol | null)[] {
  const bars: (ChordSymbol | null)[] = [];
  let current: ChordSymbol | null = null;
  for (let measure = 1; measure <= measureCount; measure += 1) {
    const here = symbols.filter((symbol) => symbol.measure === measure);
    if (here.length > 0) current = here[0] as ChordSymbol;
    bars.push(current);
  }
  return bars;
}

/** How much of the chart chord is in what was played, 0–1. */
export function chordMatch(expected: ChordSymbol | null, playedPitchClasses: readonly number[]): number {
  if (!expected || playedPitchClasses.length === 0) return 0;
  const played = new Set(playedPitchClasses.map((pitch) => ((pitch % 12) + 12) % 12));
  const hits = expected.pitchClasses.filter((pitchClass) => played.has(pitchClass)).length;
  return hits / expected.pitchClasses.length;
}
