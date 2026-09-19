// @vitest-environment node
/**
 * A lesson may not say a thing about a piece that the piece does not do.
 *
 * `lessonClaims.test.ts` checks that a rung offers what its repertoire
 * paragraph names. This checks the harder half: that what the paragraph *says
 * about* those pieces is true — the key, the metre, the number of bars, whether
 * the chords are printed.
 *
 * It exists because a hand-written version of it found a real fault in one
 * second. `rock.4` said "*Bella Ciao* is in E minor and already has a repeating
 * left hand". The file has three key signatures, ends in F sharp minor and uses
 * eighteen distinct chords. It got there because the rendered preview was
 * opened before the piece was placed — and the preview is a *crop*, so bars one
 * and two showed exactly what was expected. Looking at an artifact is not proof
 * unless you look at all of it, and a machine reading `notation` looks at all
 * of it every time.
 *
 * **How claims are written.** A lesson states them in prose, which no test can
 * parse reliably. So the checkable ones are declared here, beside the lesson
 * they come from, and adding a lesson that makes a claim means adding a row.
 * That is deliberately a little tedious: the alternative is natural-language
 * matching, which this session already watched produce eight false positives
 * and nearly get silenced into meaninglessness.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const CONTENT = join(process.cwd(), 'public', 'content');

interface Notation {
  bars: number;
  staves: number;
  keys: { fifths: number; mode: string | null }[];
  times: string[];
  chordCount: number;
  chords: string[];
  finalBass: number | null;
}
interface Row {
  id: string;
  title?: string;
  notation?: Notation;
}

const rows = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as Row[];
const byId = new Map(rows.map((row) => [row.id, row]));

const MAJOR = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
const FLAT = ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];
const RELATIVE: Record<string, string> = {
  C: 'Am', G: 'Em', D: 'Bm', A: 'F#m', E: 'C#m', B: 'G#m', 'F#': 'D#m', 'C#': 'A#m',
  F: 'Dm', Bb: 'Gm', Eb: 'Cm', Ab: 'Fm', Db: 'Bbm', Gb: 'Ebm', Cb: 'Abm',
};

/** The key in words. A trailing `?` means the mode was not in the file. */
function keyOf(n: Notation): string {
  const first = n.keys[0];
  if (!first) return '?';
  const major = first.fifths >= 0 ? (MAJOR[first.fifths] ?? '?') : (FLAT[-first.fifths] ?? '?');
  if (first.mode === 'minor') return RELATIVE[major] ?? `${major}m`;
  if (first.mode === 'major') return major;
  const relative = (((7 * first.fifths) % 12) + 12 + 9) % 12;
  return n.finalBass === relative % 12 ? `${RELATIVE[major] ?? major}?` : `${major}?`;
}

/** `[lesson, the claim in words, the item it is about, the test]` */
const CLAIMS: [string, string, string, (n: Notation) => boolean][] = [
  ['rock.4', 'Greensleeves (with chords) is in A minor', 'song.folk.greensleeves.chords',
    (n) => keyOf(n).startsWith('Am')],
  ['rock.4', '…with the chord symbols printed', 'song.folk.greensleeves.chords',
    (n) => n.chordCount > 0],
  ['rock.5', "Annie's Song uses a sus4", 'song.folk.john-denver-annie-s-song.pdmx',
    (n) => n.chords.some((c) => /sus4/i.test(c))],
  ['rock.5', 'andata has suspensions', 'song.classical.sakamoto-andata.pdmx',
    (n) => n.chords.some((c) => /sus/i.test(c))],
  ['rock.6', "Chopin's Prelude No. 20 is thirteen bars", 'song.classical.chopin-prelude-op28-20.nifc',
    (n) => n.bars === 13],
  ['rock.6', 'Gnossienne No. 1 is written on two staves', 'song.classical.satie-erik-satie-gnossienne-n1.pdmx',
    (n) => n.staves >= 2],
  ['rock.6', 'Moonlight I is written on two staves', 'song.classical.beethoven-moonlight-i',
    (n) => n.staves >= 2],
  ['hymns.2', 'Oh When the Saints is hands-alternating, so two staves', 'song.folk.when-the-saints.alternating',
    (n) => n.staves >= 2],
  ['hymns.2', 'Be Thou My Vision is in 3/4', 'song.folk.be-thou-my-vision.pdmx',
    (n) => n.times.includes('3/4')],
  ['holiday.3', 'Jingle Bells is in G', 'song.holiday.jingle-bells.g',
    (n) => keyOf(n).startsWith('G')],
  ['holiday.3', '…with block chords written, so two staves', 'song.holiday.jingle-bells.g',
    (n) => n.staves >= 2],
  ['holiday.3', 'Joy to the World is in D', 'song.classical.mason-lowell-mason-handel-joy-to-the-world.pdmx',
    (n) => keyOf(n).startsWith('D')],
  ['holiday.3', 'Joy to the World is a lead sheet, so one staff', 'song.classical.mason-lowell-mason-handel-joy-to-the-world.pdmx',
    (n) => n.staves === 1],
  ['holiday.3', 'The First Noel is in D', 'song.pop.misc-christmas-traditional-music-first-noel.pdmx',
    (n) => keyOf(n).startsWith('D')],
  ['holiday.3', 'The First Noel is a lead sheet, so one staff', 'song.pop.misc-christmas-traditional-music-first-noel.pdmx',
    (n) => n.staves === 1],
  ['jam.6', 'the twelve-bar shuffle in E is twelve bars', 'exercise.blues.twelve-bar-shuffle.e',
    (n) => n.bars === 12],
];

/** Claims that compare several pieces, which do not fit the table above. */
const COMPARISONS: [string, string, () => boolean][] = [
  ['hymns.2', 'Swing Low is the only one of the four with its chords printed', () => {
    const four = [
      'song.folk.when-the-saints.alternating',
      'song.folk.be-thou-my-vision.pdmx',
      'song.classical.beethoven-ludwig-van-beethoven-joyful-joyful-we-adore-thee.pdmx',
      'song.folk.anonymous-swing-low-sweet-chariot.pdmx',
    ];
    const printed = four.filter((id) => (byId.get(id)?.notation?.chordCount ?? 0) > 0);
    return printed.length === 1 && (printed[0] ?? '').includes('swing-low');
  }],
  ['holiday.3', 'Hark! has the most chord changes of the four', () => {
    const four = [
      'song.holiday.jingle-bells.g',
      'song.classical.mason-lowell-mason-handel-joy-to-the-world.pdmx',
      'song.pop.misc-christmas-traditional-music-first-noel.pdmx',
      'song.classical.mendelssohn-felix-mendelssohn-hark-the-herald-angels-sing.pdmx',
    ];
    const ranked = four
      .map((id) => [id, byId.get(id)?.notation?.chordCount ?? 0] as const)
      .sort((a, b) => b[1] - a[1]);
    return (ranked[0]?.[0] ?? '').includes('hark');
  }],
];

describe('a lesson tells the truth about the music it names', () => {
  it('states nothing about a piece that the piece does not do', () => {
    const wrong: string[] = [];
    for (const [lesson, claim, id, test] of CLAIMS) {
      const notation = byId.get(id)?.notation;
      if (!notation) {
        wrong.push(`${lesson}: "${claim}" — ${id} has no notation to check it against`);
        continue;
      }
      if (!test(notation)) {
        wrong.push(
          `${lesson}: "${claim}" is false — ${id} is ${keyOf(notation)}, ` +
            `${notation.times.join(',') || 'no metre'}, ${String(notation.staves)} staves, ` +
            `${String(notation.bars)} bars, ${String(notation.chordCount)} chord symbols`,
        );
      }
    }
    for (const [lesson, claim, test] of COMPARISONS) {
      if (!test()) wrong.push(`${lesson}: "${claim}" is false`);
    }
    expect(CLAIMS.length, 'the claim table has emptied out').toBeGreaterThan(10);
    expect(wrong, `lessons claiming things their music does not do:\n${wrong.join('\n')}`).toEqual([]);
  });

  it('names only pieces that are still in the catalog', () => {
    // A claim about an item that has been removed passes vacuously above if the
    // guard there is ever relaxed; this says it out loud.
    const missing = [...new Set(CLAIMS.map(([, , id]) => id))].filter((id) => !byId.has(id));
    expect(missing, `claims about items no longer in the catalog: ${missing.join(', ')}`).toEqual([]);
  });
});
