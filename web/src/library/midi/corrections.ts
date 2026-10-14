// The two corrections a learner can make to a converted score: swap the hands, state the tempo. Both work on
// the MusicXML text, after conversion, as they did in the old app. Ported (2026-10-13) from branch
// claude/piano-teaching-app-bo19td: `swapHands` from src/ui/importSheet.ts (its refusal sentences inlined from
// src/ui/help.ts `IMPORT_TEXT`), `withOpeningTempo` and `STATED_TEMPO_RANGE` from src/data/importStore.ts.
// The code is unchanged.

const SWAP_REFUSED = {
  swapOneStaff: 'One staff: there is no other hand to swap with.',
  swapParts: 'The file writes its hands as separate parts; the app swaps only a piano’s two staves.',
  swapUnmarked: 'The file does not say which staff every note is on, so the app cannot swap them.',
} as const;

/**
 * A piano score with its two staves' notes exchanged: every `<note>` (and `<forward>`) on staff 1
 * moves to staff 2 and the other way round, so what the upper staff held the left hand now plays
 * and the other way round. **Each staff keeps its clef**: the clef belongs to the staff, and the
 * case this correction is for — a file whose first track was the left hand's, which the converter
 * puts on the treble staff because it keeps tracks in file order — is put right exactly by that.
 * Directions stay where they were drawn. Swapping twice gives the same bytes back.
 *
 * Refused, with the reason in the learner's words, where there is not one part on two staves with
 * every note's staff written: one staff has no other hand, separate parts are not a piano's staves,
 * and a note with no staff cannot be moved without guessing where it was.
 */
export function swapHands(xml: string): { xml: string } | { refused: string } {
  const parts = xml.match(/<part\s+id=/g)?.length ?? 0;
  if (parts > 1) return { refused: SWAP_REFUSED.swapParts };
  if (!/<staves>\s*2\s*<\/staves>/.test(xml)) return { refused: SWAP_REFUSED.swapOneStaff };
  const blocks = /<(note|forward)\b[^>]*>[\s\S]*?<\/\1>/g;
  let unmarked = false;
  const swapped = xml.replace(blocks, (block, tag: string) => {
    const staff = /<staff>\s*([12])\s*<\/staff>/.exec(block);
    if (!staff) {
      if (tag === 'note') unmarked = true;
      return block;
    }
    return block.replace(staff[0], `<staff>${staff[1] === '1' ? '2' : '1'}</staff>`);
  });
  if (unmarked) return { refused: SWAP_REFUSED.swapUnmarked };
  return { xml: swapped };
}

/** The tempos a learner can state, in quarter notes a minute. */
export const STATED_TEMPO_RANGE = { min: 20, max: 400 } as const;

const round3 = (value: number): string => String(Math.round(value * 1000) / 1000);

/**
 * The score with its opening tempo set to `bpm` quarter notes a minute, as a learner states it (E48): in
 * the first bar, every `<sound tempo>` carries it and every `<metronome>` prints it in its own note
 * (a half at half the number, a dotted quarter at two thirds); where the first bar says no tempo, a
 * `<sound tempo>` opens it, which the player reads and nothing prints. Later tempo changes are the file's.
 */
export function withOpeningTempo(xml: string, bpm: number): string {
  const first = /<measure\b[^>]*>[\s\S]*?<\/measure>/.exec(xml);
  if (!first) return xml;
  let bar = first[0]
    .replace(/(<sound\b[^>]*\btempo=")[^"]*(")/g, `$1${round3(bpm)}$2`)
    .replace(/<metronome\b[^>]*>[\s\S]*?<\/metronome>/g, (mark) => {
      const unit = /<beat-unit>\s*([a-z0-9]+)\s*<\/beat-unit>/.exec(mark)?.[1];
      const quarters = { whole: 4, half: 2, quarter: 1, eighth: 0.5, '16th': 0.25 }[unit ?? ''];
      if (quarters === undefined) return mark;
      const dotted = /<beat-unit-dot\s*\/>/.test(mark) ? 1.5 : 1;
      return mark.replace(/(<per-minute>)[^<]*(<\/per-minute>)/, `$1${round3(bpm / (quarters * dotted))}$2`);
    });
  if (!/<sound\b[^>]*\btempo="/.test(bar)) bar = bar.replace(/^(<measure\b[^>]*>)/, `$1<sound tempo="${round3(bpm)}"/>`);
  return xml.slice(0, first.index) + bar + xml.slice(first.index + first[0].length);
}
