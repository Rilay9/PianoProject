/**
 * One note on a staff, drawn by hand (docs/04 §5 visual language, P8).
 *
 * The obvious options were OSMD and VexFlow, and both are the wrong size for
 * this. OSMD parses MusicXML and lays out a system — about 100 ms and 400 kB
 * to draw a single crotchet, on a screen where the whole point is that the
 * next flash card appears the instant you answer. VexFlow is a smaller version
 * of the same trade. A note on a staff is five lines, an ellipse, a stem and
 * up to three ledger lines; that is 60 lines of SVG and it is exact.
 *
 * What this deliberately does *not* do is render music generally. It draws one
 * note, or a row of rhythm slashes. Anything with a key signature, a chord or
 * a second voice belongs in the Score screen, which has a real engraver.
 */

/**
 * How each pitch class is spelled: which line or space it sits on, and which
 * accidental (if any) goes in front of it.
 *
 * The spelling has to match the names the drills print, or a card reads "E♭"
 * and draws a D♯ — same key, different line, and the learner is being taught
 * the wrong thing quietly. `engine/drills/types.NOTE_NAMES` is the authority:
 * C♯ and F♯ are sharps, E♭, A♭ and B♭ are flats.
 */
const STEP_OF_PITCH_CLASS = [0, 0, 1, 2, 2, 3, 3, 4, 5, 5, 6, 6];
const ACCIDENTAL_OF_PITCH_CLASS = ['', '♯', '', '♭', '', '', '♯', '', '♭', '', '♭', ''] as const;

/**
 * The one number the whole drawing hangs off: the vertical distance of one
 * diatonic step, line to the space above it. A staff line gap is two of them.
 */
const STEP_PX = 6;
const LINE_GAP = STEP_PX * 2;
const STAFF_HEIGHT = LINE_GAP * 4;
const TOP_PAD = 46;
const BOTTOM_PAD = 46;
const WIDTH = 180;
const NOTE_X = 118;

export type Clef = 'treble' | 'bass';

/** Diatonic step number for a MIDI pitch: C4 is 4*7 = 28. */
export function diatonicStep(midi: number): number {
  const octave = Math.floor(midi / 12) - 1;
  const pitchClass = ((midi % 12) + 12) % 12;
  return octave * 7 + (STEP_OF_PITCH_CLASS[pitchClass] ?? 0);
}

/** The accidental to draw before the note head, or '' for a natural. */
export function accidentalFor(midi: number): string {
  return ACCIDENTAL_OF_PITCH_CLASS[((midi % 12) + 12) % 12] ?? '';
}

export function isSharpSpelling(midi: number): boolean {
  return accidentalFor(midi) === '♯';
}

/** MIDI and staff-line index of the note each clef is named after. */
const CLEF_ANCHOR: Record<Clef, { midi: number; lineFromTop: number }> = {
  // G4 on the second line up, which is the third line counting down.
  treble: { midi: 67, lineFromTop: 3 },
  // F3 on the second line down.
  bass: { midi: 53, lineFromTop: 1 },
};

/**
 * The y of a note, in px from the top of the drawing.
 *
 * Anchored on the clef's own note, so everything else follows from the
 * diatonic step — which is why an accidental never moves a note head.
 */
export function noteY(midi: number, clef: Clef): number {
  const anchor = CLEF_ANCHOR[clef];
  const anchorY = TOP_PAD + anchor.lineFromTop * LINE_GAP;
  return anchorY - (diatonicStep(midi) - diatonicStep(anchor.midi)) * STEP_PX;
}

/** Ledger lines needed for a note, as y positions. */
export function ledgerLines(midi: number, clef: Clef): number[] {
  const y = noteY(midi, clef);
  const lines: number[] = [];
  for (let line = TOP_PAD - LINE_GAP; line >= y - 0.5; line -= LINE_GAP) lines.push(line);
  for (let line = TOP_PAD + STAFF_HEIGHT + LINE_GAP; line <= y + 0.5; line += LINE_GAP) lines.push(line);
  return lines;
}

export interface StaffCardOptions {
  clef?: Clef;
  /** Draws the note name under the staff — Stage 0-1 help (docs/04 §7). */
  showName?: boolean;
  label?: string;
}

function svgEl(tag: string, attrs: Record<string, string | number>): SVGElement {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
}

/**
 * Draws one note. `midi` of null draws an empty staff, which is what the card
 * shows between prompts rather than flashing to nothing.
 */
export function staffCard(midi: number | null, options: StaffCardOptions = {}): SVGSVGElement {
  const clef = options.clef ?? (midi !== null && midi < 60 ? 'bass' : 'treble');
  const height = TOP_PAD + STAFF_HEIGHT + BOTTOM_PAD;
  const svg = svgEl('svg', {
    viewBox: `0 0 ${String(WIDTH)} ${String(height)}`,
    class: 'staff-card',
    role: 'img',
    'aria-label': options.label ?? (midi === null ? 'Empty staff' : `Note on the ${clef} staff`),
  }) as SVGSVGElement;

  for (let line = 0; line < 5; line += 1) {
    const y = TOP_PAD + line * LINE_GAP;
    svg.append(svgEl('line', { x1: 16, x2: WIDTH - 12, y1: y, y2: y, class: 'staff-line' }));
  }

  // The clef glyphs are the Unicode musical symbols; they are in every Android
  // system font and cost nothing, where a music font would be another
  // download to precache.
  const clefGlyph = svgEl('text', {
    x: 20,
    y: clef === 'treble' ? TOP_PAD + LINE_GAP * 3.8 : TOP_PAD + LINE_GAP * 2.6,
    class: 'staff-clef',
    'font-size': clef === 'treble' ? 62 : 44,
  });
  clefGlyph.textContent = clef === 'treble' ? '\u{1D11E}' : '\u{1D122}';
  svg.append(clefGlyph);

  if (midi === null) return svg;

  const y = noteY(midi, clef);
  for (const line of ledgerLines(midi, clef)) {
    svg.append(
      svgEl('line', {
        x1: NOTE_X - 13,
        x2: NOTE_X + 13,
        y1: line,
        y2: line,
        class: 'staff-line staff-ledger',
      }),
    );
  }

  const accidental = accidentalFor(midi);
  if (accidental) {
    const glyph = svgEl('text', { x: NOTE_X - 34, y: y + 6, class: 'staff-accidental' });
    glyph.textContent = accidental;
    svg.append(glyph);
  }

  svg.append(
    svgEl('ellipse', { cx: NOTE_X, cy: y, rx: 8, ry: 6, class: 'staff-note', 'data-midi': midi }),
  );
  // Stem up below the middle line, down above it — the ordinary rule, and the
  // reason a high note does not run off the top of the card.
  const middle = TOP_PAD + LINE_GAP * 2;
  const stemUp = y >= middle;
  svg.append(
    svgEl('line', {
      x1: NOTE_X + (stemUp ? 8 : -8),
      x2: NOTE_X + (stemUp ? 8 : -8),
      y1: y,
      y2: y + (stemUp ? -34 : 34),
      class: 'staff-stem',
    }),
  );

  if (options.showName) {
    const name = svgEl('text', { x: NOTE_X, y: TOP_PAD + STAFF_HEIGHT + 34, class: 'staff-name' });
    name.textContent = options.label ?? '';
    svg.append(name);
  }
  return svg;
}

export interface RhythmRowOptions {
  /** Beat positions of each tap. */
  beats: number[];
  /** Beats in the whole row, so the spacing is right. */
  totalBeats: number;
  beatsPerBar: number;
  /** Index of the next tap to hit, for the highlight. */
  activeIndex?: number;
  /** Taps already matched, drawn filled. */
  hit?: readonly boolean[];
}

/**
 * The rhythm drill's one-line staff (docs/05 §7: "shows a rhythm on one line").
 *
 * One line and note heads, not full notation: the drill judges onsets, so
 * anything more would be drawing information it does not use, and a learner
 * reading stems here would be reading a promise the scoring does not keep.
 */
export function rhythmRow(options: RhythmRowOptions): SVGSVGElement {
  const width = 320;
  const height = 76;
  const left = 14;
  const right = width - 14;
  const y = 40;
  const svg = svgEl('svg', {
    viewBox: `0 0 ${String(width)} ${String(height)}`,
    class: 'rhythm-row',
    role: 'img',
    'aria-label': `${String(options.beats.length)} taps`,
  }) as SVGSVGElement;

  svg.append(svgEl('line', { x1: left, x2: right, y1: y, y2: y, class: 'staff-line' }));

  const span = Math.max(1, options.totalBeats);
  const xOf = (beat: number): number => left + ((right - left) * beat) / span;

  for (let bar = options.beatsPerBar; bar < span; bar += options.beatsPerBar) {
    svg.append(
      svgEl('line', { x1: xOf(bar), x2: xOf(bar), y1: y - 14, y2: y + 14, class: 'rhythm-barline' }),
    );
  }

  options.beats.forEach((beat, index) => {
    const node = svgEl('ellipse', {
      cx: xOf(beat),
      cy: y,
      rx: 7,
      ry: 5,
      class: 'rhythm-tap',
      'data-tap': index,
      'data-state': options.hit?.[index] ? 'hit' : index === options.activeIndex ? 'next' : 'waiting',
    });
    svg.append(node);
  });
  return svg;
}
