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
  ['jazz.4', 'the Charleston exercise is C, F and G minor, triads only', 'exercise.comping.f.charleston.intro',
    (n) => n.chords.length === 3 && ['C', 'F', 'Gminor'].every((c) => n.chords.includes(c))],
  ['jazz.4', 'the Charleston exercise is in the key of F', 'exercise.comping.f.charleston.intro',
    (n) => keyOf(n).startsWith('F')],
  ['jazz.4', 'the off-beats exercise is C, F and G minor, triads only', 'exercise.comping.f.off-beats.intro',
    (n) => n.chords.length === 3 && ['C', 'F', 'Gminor'].every((c) => n.chords.includes(c))],
  ['jazz.4', 'the off-beats exercise is in the key of F', 'exercise.comping.f.off-beats.intro',
    (n) => keyOf(n).startsWith('F')],
  ['jazz.4', 'the four-to-the-bar exercise is C, F and G minor, triads only', 'exercise.comping.f.four-on-the-floor.intro',
    (n) => n.chords.length === 3 && ['C', 'F', 'Gminor'].every((c) => n.chords.includes(c))],
  ['jazz.4', 'the four-to-the-bar exercise is in the key of F', 'exercise.comping.f.four-on-the-floor.intro',
    (n) => keyOf(n).startsWith('F')],
  ['jazz.4', 'the shuffle-eighths exercise is four bars of rhythm and nothing else', 'exercise.rhythm.shuffle-eighths.4bar',
    (n) => n.bars === 4 && n.chordCount === 0],
  ['jazz.4', 'Avalon is in two', 'song.pop.avalon.pdmx',
    (n) => n.times.includes('2/2')],
  ['jazz.4', 'Avalon is in F', 'song.pop.avalon.pdmx',
    (n) => keyOf(n).startsWith('F')],
  ['jazz.4', 'the songs\' symbols have C7 and B flat minor 6 in them (Avalon)', 'song.pop.avalon.pdmx',
    (n) => n.chords.includes('C7') && n.chords.includes('Bbm6')],
  ['jazz.4', 'Whispering is in E flat', 'song.pop.whispering.pdmx',
    (n) => keyOf(n).startsWith('Eb')],
  ['jazz.4', 'the songs\' symbols have Cm7 in them (Whispering)', 'song.pop.whispering.pdmx',
    (n) => n.chords.includes('Cm7')],
  ['jazz.4', 'Margie has the same one flat', 'song.pop.margie.pdmx',
    (n) => n.keys[0]?.fifths === -1],
  ['jazz.4', 'a lead sheet: a tune with chord symbols printed over it', 'song.pop.avalon.pdmx',
    (n) => n.staves === 1 && n.chordCount > 0],
  ['jazz.4', 'a lead sheet: a tune with chord symbols printed over it', 'song.pop.whispering.pdmx',
    (n) => n.staves === 1 && n.chordCount > 0],
  ['jazz.4', 'a lead sheet: a tune with chord symbols printed over it', 'song.pop.margie.pdmx',
    (n) => n.staves === 1 && n.chordCount > 0],
  ['rock.overview', 'Ode to Joy (full) is the tune and a bass under C and G symbols', 'song.classical.ode-to-joy.full',
    (n) => n.staves === 2 && n.chords.length === 2 && n.chords.includes('C') && n.chords.includes('G')],
  ['rock.overview', 'Greensleeves with chords has a left hand', 'song.folk.greensleeves.chords',
    (n) => n.staves === 2],
  ['rock.overview', 'Scarborough Fair is the tune and its symbols, one staff', 'song.folk.scarborough-fair.pdmx',
    (n) => n.staves === 1 && n.chordCount > 0],
  ['rock.overview', 'Scarborough Fair is E minor with a C sharp: two sharps, ends on E, an A major chord', 'song.folk.scarborough-fair.pdmx',
    (n) => n.keys[0]?.fifths === 2 && n.finalBass === 4 && n.chords.includes('A') && n.chords.includes('Em')],
  ['holiday', 'Jingle Bells hands together has just the roots C, F and G under it', 'song.holiday.jingle-bells.ht',
    (n) => n.staves === 2 && n.chords.length === 3 && ['C', 'F', 'G'].every((c) => n.chords.includes(c))],
  ['holiday', 'Jingle Bells right hand alone is one staff', 'song.holiday.jingle-bells.rh',
    (n) => n.staves === 1],
  ['holiday', 'Silent Night (melody) is in C over C, F, G and a G7', 'song.classical.1818-franz-xaver-gruber-silent-night.pdmx',
    (n) => keyOf(n).startsWith('C') && ['C', 'F', 'G', 'G7'].every((c) => n.chords.includes(c))],
  ['holiday', 'Silent Night (melody) is written in 6/8', 'song.classical.1818-franz-xaver-gruber-silent-night.pdmx',
    (n) => n.times.includes('6/8')],
  ['holiday', 'Jolly Old Saint Nicholas has no chord symbols', 'song.pop.misc-christmas-traditional-music-jolly-old-saint-nicholas.pdmx',
    (n) => n.chordCount === 0],
  ['holiday', 'Jolly Old Saint Nicholas is in B flat, two flats', 'song.pop.misc-christmas-traditional-music-jolly-old-saint-nicholas.pdmx',
    (n) => n.keys[0]?.fifths === -2 && keyOf(n).startsWith('Bb')],
  ['holiday', 'Good King Wenceslas is in G', 'song.pop.misc-christmas-good-king-wenceslas.pdmx',
    (n) => keyOf(n).startsWith('G')],
  ['holiday', 'Good King Wenceslas has E minor, D7 and B7 in its symbols', 'song.pop.misc-christmas-good-king-wenceslas.pdmx',
    (n) => ['Em', 'D7', 'B7'].every((c) => n.chords.includes(c))],
  ['holiday', 'We Three Kings is in E minor', 'song.classical.1863-rev-john-henry-hopkins-we-three-kings-of-orient-are.pdmx',
    (n) => keyOf(n).startsWith('Em')],
  ['holiday', 'We Three Kings is in 6/8', 'song.classical.1863-rev-john-henry-hopkins-we-three-kings-of-orient-are.pdmx',
    (n) => n.times.includes('6/8')],
  ['holiday.4', 'Silent Night is in C', 'song.pop.misc-christmas-silent-night.pdmx',
    (n) => keyOf(n).startsWith('C')],
  ['holiday.4', 'Silent Night is in 3/4 this time', 'song.pop.misc-christmas-silent-night.pdmx',
    (n) => n.times.includes('3/4')],
  ['holiday.4', 'We Wish You a Merry Christmas is in F', 'song.folk.we-wish-you-a-merry-christmas.pdmx',
    (n) => keyOf(n).startsWith('F')],
  ['holiday.4', 'Deck the Halls is in C', 'song.folk.deck-the-halls.pdmx',
    (n) => keyOf(n).startsWith('C')],
  ['holiday.4', 'Away in a Manger is in F', 'song.classical.away-in-a-manger.pdmx',
    (n) => keyOf(n).startsWith('F')],
  ['holiday.4', 'the broken-chord exercise in C is in C', 'exercise.accompaniment.broken.c-major.both',
    (n) => keyOf(n).startsWith('C')],
  ['holiday.4', 'the broken-chord exercise in F is in F', 'exercise.accompaniment.broken.f-major.both',
    (n) => keyOf(n).startsWith('F')],
  ['holiday.4', 'the oom-pah bass is in F', 'exercise.oompah.f.octave',
    (n) => keyOf(n).startsWith('F')],
];

/** Claims that compare several pieces, which do not fit the table above. */
const COMPARISONS: [string, string, () => boolean][] = [
  ['holiday.4', 'each of the four has its left hand written out: two staves', () =>
    ['song.pop.misc-christmas-silent-night.pdmx', 'song.folk.we-wish-you-a-merry-christmas.pdmx',
      'song.folk.deck-the-halls.pdmx', 'song.classical.away-in-a-manger.pdmx']
      .every((id) => byId.get(id)?.notation?.staves === 2)],
  ['holiday.4', 'Silent Night here is the same key as the melody on the first carol rung', () => {
    const arranged = byId.get('song.pop.misc-christmas-silent-night.pdmx')?.notation?.keys[0]?.fifths;
    const melody = byId.get('song.classical.1818-franz-xaver-gruber-silent-night.pdmx')?.notation?.keys[0]?.fifths;
    return arranged !== undefined && arranged === melody;
  }],
  ['jazz.4', 'Avalon is the shortest of the three', () => {
    const bars = (id: string): number => byId.get(id)?.notation?.bars ?? 0;
    const avalon = bars('song.pop.avalon.pdmx');
    return avalon > 0 && avalon < bars('song.pop.whispering.pdmx') && avalon < bars('song.pop.margie.pdmx');
  }],
  ['jazz.4', 'all three songs are from 1920', () =>
    ['song.pop.avalon.pdmx', 'song.pop.whispering.pdmx', 'song.pop.margie.pdmx'].every((id) => (byId.get(id)?.title ?? '').includes('1920'))],
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
