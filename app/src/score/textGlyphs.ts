/**
 * The private-use glyphs an edition's text can carry, and what each one is (E31, E32).
 *
 * MuseScore's text fonts (MScore Text, MuseJazz Text and their kin) follow SMuFL, which puts an
 * accidental or a metronome note at a private-use code point: an edition that spells a chord symbol's
 * flat as a glyph of that font writes U+E260 into a `<words>` direction, and a metronome mark written as
 * text writes U+ECA5 for its quarter note. No system font draws those code points, so the renderer drew a
 * box ("E6 □ 13" in I Got Rhythm, parent and cut). SMuFL fixes the meaning of each code point whatever
 * the font, so the map is by code point: the renderer shows the Unicode character (`OsmdView.load`), and
 * the import reads a metronome mark's note value off it (`importStore`). Only the code points SMuFL
 * assigns to these glyphs are mapped; any other private-use character is left as the file wrote it.
 */

/** SMuFL's accidentals (U+E260–U+E264) as the Unicode accidentals. */
const ACCIDENTALS: Readonly<Record<string, string>> = {
  '\uE260': '\u266D', // accidentalFlat → ♭
  '\uE261': '\u266E', // accidentalNatural → ♮
  '\uE262': '\u266F', // accidentalSharp → ♯
  '\uE263': '\u{1D12A}', // accidentalDoubleSharp → 𝄪
  '\uE264': '\u{1D12B}', // accidentalDoubleFlat → 𝄫
};

/** SMuFL's metronome notes (U+ECA2–U+ECAA) and augmentation dot (U+ECB7) as the Unicode note symbols. */
const METRONOME_NOTES: Readonly<Record<string, string>> = {
  '\uECA2': '\u{1D15D}', // metNoteWhole → whole note
  '\uECA3': '\u{1D15E}', // metNoteHalfUp → half note
  '\uECA4': '\u{1D15E}', // metNoteHalfDown
  '\uECA5': '\u2669', // metNoteQuarterUp → ♩
  '\uECA6': '\u2669', // metNoteQuarterDown
  '\uECA7': '\u266A', // metNote8thUp → ♪
  '\uECA8': '\u266A', // metNote8thDown
  '\uECA9': '\u{1D161}', // metNote16thUp → sixteenth note
  '\uECAA': '\u{1D161}', // metNote16thDown
  '\uECB7': '.', // metAugmentationDot
};

const GLYPHS: Readonly<Record<string, string>> = { ...ACCIDENTALS, ...METRONOME_NOTES };
const GLYPH = /[\uE260-\uE264\uECA2-\uECAA\uECB7]/g;

/** The text with every SMuFL accidental and metronome glyph as the Unicode character it stands for. */
export function mapTextGlyphs(text: string): string {
  return text.replace(GLYPH, (glyph) => GLYPHS[glyph] ?? glyph);
}

/**
 * A metronome note's length in quarter notes, by the Unicode character (after `mapTextGlyphs`): the
 * whole note is four, the eighth a half. `undefined` for anything that is not a note symbol.
 */
export function noteLengthInQuarters(symbol: string): number | undefined {
  switch (symbol) {
    case '\u{1D15D}':
      return 4;
    case '\u{1D15E}':
      return 2;
    case '\u2669':
    case '\u{1D15F}':
      return 1;
    case '\u266A':
    case '\u{1D160}':
      return 0.5;
    case '\u{1D161}':
      return 0.25;
    default:
      return undefined;
  }
}
