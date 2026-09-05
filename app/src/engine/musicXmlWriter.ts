// A very small MusicXML writer.
//
// Enough for what the runtime sight-reading generator emits (docs/05 §8): one
// part, one or two staves, notes and rests with ties, a key, a time signature
// and a tempo. Nothing else — this is not a general exporter, and it should
// never grow into one. Anything richer belongs in the Python content pipeline,
// which has music21 and runs at build time.
//
// The output is deliberately plain: OSMD is the only consumer, and every
// element here is one it parses without complaint (verified by the e2e test
// that renders generated levels 1–4).

/** Divisions per quarter note. 12 divides by 2, 3 and 4, so eighths, triplets
 *  and sixteenths are all whole numbers. */
export const DIVISIONS = 12;

export type NoteType =
  | 'whole'
  | 'half'
  | 'quarter'
  | 'eighth'
  | '16th';

export interface WriterNote {
  /** MIDI pitch, or null for a rest. */
  midi: number | null;
  /** Length in divisions (see {@link DIVISIONS}). */
  duration: number;
  type: NoteType;
  /** 1 = upper staff, 2 = lower. Omitted entirely for a one-staff part. */
  staff?: 1 | 2;
  voice?: number;
  dotted?: boolean;
  tie?: 'start' | 'stop' | 'both';
  fingering?: number;
  /**
   * Sounds together with the previous note instead of after it. MusicXML
   * expresses a chord as consecutive `<note>` elements where all but the first
   * carry `<chord/>`; without it the bar simply gets longer, which is exactly
   * the bug this flag exists to prevent.
   */
  chord?: boolean;
}

export interface WriterMeasure {
  /** Notes for each staff, in order. A `backup` is written between staves. */
  notes: WriterNote[];
}

export interface WriterOptions {
  title: string;
  /** Sharps positive, flats negative, as in MusicXML `<fifths>`. */
  fifths: number;
  beats: number;
  beatType: number;
  bpm: number;
  staves: 1 | 2;
  measures: WriterMeasure[];
}

const STEP_NAMES = ['C', 'C', 'D', 'D', 'E', 'F', 'F', 'G', 'G', 'A', 'A', 'B'] as const;
const IS_SHARP = [false, true, false, true, false, false, true, false, true, false, true, false];

/**
 * MIDI number to `<step>`, `<alter>`, `<octave>`.
 *
 * Spelled with sharps or flats to match the key signature, so a piece in F
 * writes B flat rather than A sharp. Only the two spellings a generated
 * exercise can produce are needed; anything chromatic enough to want a
 * double accidental is beyond level 4.
 */
export function midiToPitch(
  midi: number,
  preferFlats: boolean,
): { step: string; alter: number; octave: number } {
  const pitchClass = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  if (!IS_SHARP[pitchClass]) {
    return { step: STEP_NAMES[pitchClass] ?? 'C', alter: 0, octave };
  }
  if (preferFlats) {
    // Spell as the flat of the note above: C# -> Db.
    const above = (pitchClass + 1) % 12;
    return { step: STEP_NAMES[above] ?? 'C', alter: -1, octave: above === 0 ? octave + 1 : octave };
  }
  return { step: STEP_NAMES[pitchClass] ?? 'C', alter: 1, octave };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function noteXml(note: WriterNote, preferFlats: boolean, indent: string): string {
  const lines: string[] = [];
  lines.push(`${indent}<note>`);
  // <chord/> must come before <pitch>, per the MusicXML DTD.
  if (note.chord) lines.push(`${indent}  <chord/>`);
  if (note.midi === null) {
    lines.push(`${indent}  <rest/>`);
  } else {
    const { step, alter, octave } = midiToPitch(note.midi, preferFlats);
    lines.push(`${indent}  <pitch>`);
    lines.push(`${indent}    <step>${step}</step>`);
    if (alter !== 0) lines.push(`${indent}    <alter>${alter}</alter>`);
    lines.push(`${indent}    <octave>${octave}</octave>`);
    lines.push(`${indent}  </pitch>`);
  }
  lines.push(`${indent}  <duration>${note.duration}</duration>`);
  // Ties come in two halves: <tie> is the sounding instruction, <tied> the
  // engraved slur. MusicXML wants both, and OSMD reads the latter.
  if (note.tie === 'start' || note.tie === 'both') {
    lines.push(`${indent}  <tie type="start"/>`);
  }
  if (note.tie === 'stop' || note.tie === 'both') {
    lines.push(`${indent}  <tie type="stop"/>`);
  }
  lines.push(`${indent}  <voice>${note.voice ?? 1}</voice>`);
  lines.push(`${indent}  <type>${note.type}</type>`);
  if (note.dotted) lines.push(`${indent}  <dot/>`);
  if (note.staff !== undefined) lines.push(`${indent}  <staff>${note.staff}</staff>`);
  const notations: string[] = [];
  if (note.tie === 'stop' || note.tie === 'both') notations.push(`<tied type="stop"/>`);
  if (note.tie === 'start' || note.tie === 'both') notations.push(`<tied type="start"/>`);
  if (note.fingering !== undefined) {
    notations.push(`<technical><fingering>${note.fingering}</fingering></technical>`);
  }
  if (notations.length > 0) {
    lines.push(`${indent}  <notations>${notations.join('')}</notations>`);
  }
  lines.push(`${indent}</note>`);
  return lines.join('\n');
}

/**
 * Renders a whole part to MusicXML.
 *
 * Notes are grouped by staff within each measure and separated by `<backup>`,
 * which is how MusicXML expresses "now go back and fill the other staff".
 */
export function writeMusicXml(options: WriterOptions): string {
  const preferFlats = options.fifths < 0;
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(
    '<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" ' +
      '"http://www.musicxml.org/dtds/partwise.dtd">',
  );
  lines.push('<score-partwise version="3.1">');
  lines.push(`  <work><work-title>${escapeXml(options.title)}</work-title></work>`);
  lines.push('  <part-list>');
  lines.push('    <score-part id="P1"><part-name>Piano</part-name></score-part>');
  lines.push('  </part-list>');
  lines.push('  <part id="P1">');

  options.measures.forEach((measure, index) => {
    lines.push(`    <measure number="${index + 1}">`);
    if (index === 0) {
      lines.push('      <attributes>');
      lines.push(`        <divisions>${DIVISIONS}</divisions>`);
      lines.push(`        <key><fifths>${options.fifths}</fifths></key>`);
      lines.push(
        `        <time><beats>${options.beats}</beats><beat-type>${options.beatType}</beat-type></time>`,
      );
      if (options.staves === 2) {
        lines.push('        <staves>2</staves>');
        lines.push('        <clef number="1"><sign>G</sign><line>2</line></clef>');
        lines.push('        <clef number="2"><sign>F</sign><line>4</line></clef>');
      } else {
        lines.push('        <clef><sign>G</sign><line>2</line></clef>');
      }
      lines.push('      </attributes>');
      // Wrapped in <direction>: a bare <sound tempo> sets OSMD's sheet default
      // but creates no tempo expression, so a tempo *change* would be lost.
      lines.push('      <direction placement="above">');
      lines.push('        <direction-type>');
      lines.push(
        `          <metronome><beat-unit>quarter</beat-unit><per-minute>${options.bpm}</per-minute></metronome>`,
      );
      lines.push('        </direction-type>');
      lines.push(`        <sound tempo="${options.bpm}"/>`);
      lines.push('      </direction>');
    }

    const byStaff = new Map<number, WriterNote[]>();
    for (const note of measure.notes) {
      const staff = note.staff ?? 1;
      const bucket = byStaff.get(staff);
      if (bucket) bucket.push(note);
      else byStaff.set(staff, [note]);
    }
    const staves = [...byStaff.keys()].sort((a, b) => a - b);
    staves.forEach((staff, i) => {
      if (i > 0) {
        const previous = byStaff.get(staves[i - 1] ?? 1) ?? [];
        // A chord member adds no time, so it must not be counted here or the
        // backup overshoots and the staves drift apart.
        const back = previous.reduce((sum, n) => sum + (n.chord ? 0 : n.duration), 0);
        if (back > 0) lines.push(`      <backup><duration>${back}</duration></backup>`);
      }
      for (const note of byStaff.get(staff) ?? []) {
        lines.push(noteXml(note, preferFlats, '      '));
      }
    });

    lines.push('    </measure>');
  });

  lines.push('  </part>');
  lines.push('</score-partwise>');
  return `${lines.join('\n')}\n`;
}

/** Duration in divisions -> the `<type>` and whether it needs a dot. */
export function durationToType(duration: number): { type: NoteType; dotted: boolean } {
  const table: { divisions: number; type: NoteType; dotted: boolean }[] = [
    { divisions: DIVISIONS * 4, type: 'whole', dotted: false },
    { divisions: DIVISIONS * 3, type: 'half', dotted: true },
    { divisions: DIVISIONS * 2, type: 'half', dotted: false },
    { divisions: DIVISIONS * 1.5, type: 'quarter', dotted: true },
    { divisions: DIVISIONS, type: 'quarter', dotted: false },
    { divisions: DIVISIONS * 0.75, type: 'eighth', dotted: true },
    { divisions: DIVISIONS / 2, type: 'eighth', dotted: false },
    { divisions: DIVISIONS / 4, type: '16th', dotted: false },
  ];
  const match = table.find((entry) => entry.divisions === duration);
  if (match) return { type: match.type, dotted: match.dotted };
  // Fall back to the longest type that fits, so an odd duration still renders
  // as *something* rather than throwing in the middle of a practice session.
  const fallback = table.find((entry) => entry.divisions <= duration) ?? table[table.length - 1];
  return { type: fallback?.type ?? 'quarter', dotted: fallback?.dotted ?? false };
}
