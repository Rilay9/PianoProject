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
  swungMark: boolean;
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
  ['holiday.5', 'Carol of the Bells is in A minor', 'song.holiday.carol-of-the-bells.easy',
    (n) => keyOf(n).startsWith('Am')],
  ['holiday.5', 'Carol of the Bells is in three, forty bars', 'song.holiday.carol-of-the-bells.easy',
    (n) => n.times.includes('3/4') && n.bars === 40],
  ['holiday.5', 'We Wish You a Merry Christmas is in E major, four sharps', 'song.classical.carol-we-wish-you-a-marry-christmas-piano.pdmx',
    (n) => n.keys[0]?.fifths === 4],
  ['holiday.5', '…in three, twenty-five bars', 'song.classical.carol-we-wish-you-a-marry-christmas-piano.pdmx',
    (n) => n.times.includes('3/4') && n.bars === 25],
  ['holiday.5', '…with the chord symbols printed above it as well', 'song.classical.carol-we-wish-you-a-marry-christmas-piano.pdmx',
    (n) => n.chordCount > 0],
  ['holiday.5', 'Auld Lang Syne is in F', 'song.folk.auld-lang-syne-anonymous-traditional.pdmx',
    (n) => keyOf(n).startsWith('F')],
  ['holiday.5', 'Auld Lang Syne is in four, twenty bars', 'song.folk.auld-lang-syne-anonymous-traditional.pdmx',
    (n) => n.times.includes('4/4') && n.bars === 20],
  ['holiday.5', 'Mary Did You Know is sixty-two bars in B minor', 'song.pop.misc-christmas-mary-did-you-know.pdmx',
    (n) => n.bars === 62 && keyOf(n).startsWith('Bm')],
  ['holiday.5', 'the A minor ostinato is eight bars in A minor', 'exercise.ostinato.a.arpeggio',
    (n) => n.bars === 8 && keyOf(n).startsWith('Am')],
  ['holiday.5', 'the E major arpeggio is in E, hands together on two staves', 'exercise.arpeggio.e-major.2oct.both',
    (n) => keyOf(n).startsWith('E') && n.staves === 2],
  ['holiday.5', 'two-against-one is in C', 'exercise.independence.c.2v1',
    (n) => keyOf(n).startsWith('C')],
  ['holiday.6', 'Silent Night here is thirty bars', 'song.classical.ondrus-silent-night.pdmx',
    (n) => n.bars === 30],
  ['holiday.6', '…in A flat, four flats, in three', 'song.classical.ondrus-silent-night.pdmx',
    (n) => n.keys[0]?.fifths === -4 && n.times.includes('3/4')],
  ['holiday.6', 'Carol of the Bells here is in D minor, sixty-five bars', 'song.holiday.carol-of-the-bells',
    (n) => keyOf(n).startsWith('Dm') && n.bars === 65],
  ['holiday.6', 'O Holy Night is ninety-six bars in six-eight', 'song.folk.o-holy-night-piano-solo.pdmx',
    (n) => n.bars === 96 && n.times.includes('6/8')],
  ['holiday.6', '…starting in E major with four sharps and going to five', 'song.folk.o-holy-night-piano-solo.pdmx',
    (n) => n.keys[0]?.fifths === 4 && n.keys.some((k) => k.fifths === 5)],
  ['holiday.6', 'Joy to the World has two sharps, is in two, seventy-three bars', 'song.pop.misc-christmas-joy-to-the-world-piano-solo.pdmx',
    (n) => n.keys[0]?.fifths === 2 && n.times.includes('2/4') && n.bars === 73],
  ['holiday.6', 'the voicing exercise in D is four chords', 'exercise.voicing.d',
    (n) => keyOf(n).startsWith('D') && n.bars === 4],
  ['holiday.6', 'the held-melody exercise is in C', 'exercise.pedal.held-melody.c',
    (n) => keyOf(n).startsWith('C')],
  ['holiday.6', 'the four-octave arpeggio is in D minor, hands together on two staves', 'exercise.arpeggio.d-minor.4oct.both',
    (n) => keyOf(n).startsWith('Dm') && n.staves === 2],
  ['holiday.7', 'Waltz of the Flowers is in D, eighty bars in three', 'song.classical.tchaikovsky-waltz-flowers',
    (n) => keyOf(n).startsWith('D') && n.bars === 80 && n.times.includes('3/4')],
  ['holiday.7', 'Dance of the Sugar Plum Fairy is in E minor', 'song.classical.tchaikovsky-sugar-plum',
    (n) => keyOf(n).startsWith('Em')],
  ['holiday.7', '…in two, fifty-three bars', 'song.classical.tchaikovsky-sugar-plum',
    (n) => n.times.includes('2/4') && n.bars === 53],
  ['holiday.7', 'Skating is C major, a hundred and thirty-seven bars in three', 'song.jazz.vince-guaraldi-skating.pdmx',
    (n) => keyOf(n).startsWith('C') && n.bars === 137 && n.times.includes('3/4')],
  ['holiday.7', 'Skating is marked to be swung', 'song.jazz.vince-guaraldi-skating.pdmx',
    (n) => n.swungMark === true],
  ['holiday.7', '…with chord symbols printed over the whole of it', 'song.jazz.vince-guaraldi-skating.pdmx',
    (n) => n.chordCount > 0],
  ['holiday.7', 'the stride study is over three chords in C', 'exercise.stride.c',
    (n) => keyOf(n).startsWith('C') && n.chords.length === 3],
  ['hymns.4', 'Amazing Grace in four parts is in G, in three, nineteen bars', 'song.folk.amazing-grace-satb.pdmx',
    (n) => keyOf(n).startsWith('G') && n.times.includes('3/4') && n.bars === 19],
  ['hymns.4', 'Rock of Ages is in B flat and in six-four', 'song.classical.rock-of-ages-cleft-for-me.pdmx',
    (n) => keyOf(n).startsWith('Bb') && n.times.includes('6/4')],
  ['hymns.4', 'Abide with Me is in E flat', 'song.classical.abide-with-me-william-henry-monk.pdmx',
    (n) => keyOf(n).startsWith('Eb')],
  ['hymns.4', 'the four-part Joyful, Joyful has both hands written out', 'song.classical.beethoven-joyful-joyful-we-adore-thee.pdmx',
    (n) => n.staves === 2],
  ['hymns.4', 'O Sacred Head is forty bars with no sharps or flats', 'song.classical.bach-o-sacred-head-johann-sebastian-bach-on-a-tune-by-hans-leo-hassler.pdmx',
    (n) => n.bars === 40 && n.keys.every((k) => k.fifths === 0)],
  ['hymns.4', 'the voice-led cadence is four bars in G', 'exercise.cadence.g.voice-led',
    (n) => keyOf(n).startsWith('G') && n.bars === 4],
  ['hymns.4', 'the triad study is two bars in G', 'exercise.inversions.g-major.both',
    (n) => keyOf(n).startsWith('G') && n.bars === 2],
  ['hymns.4', 'the legato study is one scale in G', 'exercise.articulation.g.legato.right',
    (n) => keyOf(n).startsWith('G')],
  ['hymns.5', 'What a Friend We Have in Jesus is in D, on one stave', 'song.folk.what-a-friend-we-have-in-jesus.pdmx',
    (n) => keyOf(n).startsWith('D') && n.staves === 1],
  ['hymns.5', '…and names a G sharp diminished, an E major and a D seventh', 'song.folk.what-a-friend-we-have-in-jesus.pdmx',
    (n) => n.chords.includes('G#dim') && n.chords.includes('E') && n.chords.includes('D7')],
  ['hymns.5', '…and the G chord the diminished sits before', 'song.folk.what-a-friend-we-have-in-jesus.pdmx',
    (n) => n.chords.includes('G')],
  ['hymns.5', 'Down by the Riverside is a tune on one stave in F, thirty-three bars', 'song.folk.down-by-the-riverside.pdmx',
    (n) => n.staves === 1 && keyOf(n).startsWith('F') && n.bars === 33],
  ['hymns.5', '…with only three chords named over it', 'song.folk.down-by-the-riverside.pdmx',
    (n) => n.chords.length === 3],
  ['hymns.5', 'This Little Light of Mine is in B flat', 'song.folk.this-little-light-of-mine.pdmx',
    (n) => keyOf(n).startsWith('Bb')],
  ['hymns.5', '…and a B flat seventh is one of its chords', 'song.folk.this-little-light-of-mine.pdmx',
    (n) => n.chords.includes('Bb7')],
  ['hymns.5', 'Just a Closer Walk has a diminished chord among its symbols', 'song.folk.just-a-closer-walk-with-thee-easy-piano.pdmx',
    (n) => n.chords.some((c) => /°|dim/i.test(c))],
  ['hymns.5', 'As the Deer names an E major and the A minor it goes to', 'song.pop.martin-j-nystrom-as-the-deer-piano.pdmx',
    (n) => n.chords.includes('E') && n.chords.includes('Am')],
  ['hymns.5', 'the walk-up study is four bars in C over two chords', 'exercise.walkup.c',
    (n) => keyOf(n).startsWith('C') && n.bars === 4 && n.chords.length === 2],
  ['hymns.5', 'the half-step study names an E flat minor seventh and a D minor seventh', 'exercise.passing-chord.c',
    (n) => n.chords.includes('Ebminor-seventh') && n.chords.includes('Dminor-seventh')],
  ['hymns.5', '…and an A flat seven and a G seven', 'exercise.passing-chord.c',
    (n) => n.chords.includes('Abdominant') && n.chords.includes('Gdominant')],
  ['hymns.5', 'the slash-chord study is in B flat', 'exercise.slash-bass.b-flat',
    (n) => keyOf(n).startsWith('Bb')],
  ['hymns.6', 'Holy holy holy here is sixteen bars', 'song.classical.holy-holy-holy-lord-god-of-hosts-hugg-geo-c-hugg.pdmx',
    (n) => n.bars === 16],
  ['hymns.6', '…and changes from four-four into six-four', 'song.classical.holy-holy-holy-lord-god-of-hosts-hugg-geo-c-hugg.pdmx',
    (n) => n.times.includes('4/4') && n.times.includes('6/4')],
  ['hymns.6', '10,000 Reasons is in G, sixty-two bars', 'song.folk.10000-reasons-matt-redman.pdmx',
    (n) => keyOf(n).startsWith('G') && n.bars === 62],
  ['hymns.6', 'Amazing Grace in G is eighty-seven bars', 'song.folk.amazing-grace-in-g-major-for-piano-breezepiano.pdmx',
    (n) => n.bars === 87],
  ['hymns.6', '…and does not finish on its home note', 'song.folk.amazing-grace-in-g-major-for-piano-breezepiano.pdmx',
    (n) => n.keys[0]?.fifths === 1 && n.finalBass !== 7],
  ['hymns.6', 'Down by the Riverside here is sixty-six bars in cut time', 'song.folk.down-by-the-riverside.pdmx.2',
    (n) => n.bars === 66 && n.times.includes('2/2')],
  ['hymns.6', '…and is marked to be swung', 'song.folk.down-by-the-riverside.pdmx.2',
    (n) => n.swungMark === true],
  ['hymns.6', 'the voicing study is four chords in G', 'exercise.voicing.g',
    (n) => keyOf(n).startsWith('G') && n.bars === 4],
  ['hymns.6', 'the held-melody study is in G', 'exercise.pedal.held-melody.g',
    (n) => keyOf(n).startsWith('G')],
  ['hymns.6', 'the turnaround study is four chords in two bars in F', 'exercise.turnaround.f.i-vi-ii-v',
    (n) => keyOf(n).startsWith('F') && n.bars === 2 && n.chords.length === 4],
  ['latin.6', 'Por una Cabeza is sixty-six bars on two staves', 'song.folk.por-una-cabeza-carlos-gardel.pdmx',
    (n) => n.bars === 66 && n.staves === 2],
  ['latin.6', 'The Crave is in D minor', 'song.jazz.the-crave',
    (n) => keyOf(n).startsWith('Dm')],
  ['latin.6', '…and fifty-three bars long', 'song.jazz.the-crave',
    (n) => n.bars === 53],
  ['latin.6', 'La Cumparsita part B is sixteen bars in two flats', 'song.classical.tango-la-cumparsita-piano-solo-tutorial-parte-b.pdmx',
    (n) => n.bars === 16 && n.keys[0]?.fifths === -2],
  ['latin.6', 'the tumbao study is eight bars in G minor', 'exercise.tumbao.g',
    (n) => keyOf(n).startsWith('Gm') && n.bars === 8],
  ['latin.6', 'the three-note montuno study is four bars in D minor', 'exercise.montuno.d.3note.son-3-2',
    (n) => keyOf(n).startsWith('Dm') && n.bars === 4],
  ['latin.6', '…over a D minor and a G minor chord', 'exercise.montuno.d.3note.son-3-2',
    (n) => n.chords.includes('Dminor') && n.chords.includes('Gminor')],
  ['latin.6', 'the groove study is eight bars with both hands written', 'exercise.latin-groove.d.son-3-2',
    (n) => n.bars === 8 && n.staves === 2],
  ['latin.7', 'El Choclo is forty-nine bars in two-four', 'song.classical.el-choclo-piano.pdmx',
    (n) => n.bars === 49 && n.times.includes('2/4')],
  ['latin.7', '…written in two sharps', 'song.classical.el-choclo-piano.pdmx',
    (n) => n.keys[0]?.fifths === 2],
  ['latin.7', 'Asturias is a hundred and ninety-nine bars in three-four', 'song.classical.albeniz-asturias.pdmx',
    (n) => n.bars === 199 && n.times.includes('3/4')],
  ['latin.7', '…in G minor', 'song.classical.albeniz-asturias.pdmx',
    (n) => keyOf(n).startsWith('Gm')],
  ['latin.7', 'Malagueña is a hundred and forty-one bars in three-four', 'song.classical.lecuona-malaguena-by-ernesto-lecuona.pdmx',
    (n) => n.bars === 141 && n.times.includes('3/4')],
  ['latin.7', '…in C sharp minor', 'song.classical.lecuona-malaguena-by-ernesto-lecuona.pdmx',
    (n) => keyOf(n).startsWith('C#m')],
  ['latin.7', 'the four-to-a-note study is two bars in G', 'exercise.repeated-notes.g.4x.right',
    (n) => keyOf(n).startsWith('G') && n.bars === 2],
  ['latin.7', 'the rotation study is in G', 'exercise.rotation.g.left',
    (n) => keyOf(n).startsWith('G')],
  ['latin.7', 'the octave scale is in D', 'exercise.octave-scale.d.1oct.left',
    (n) => keyOf(n).startsWith('D')],
];

/** The three hymn rungs' song options, named once for the comparisons below. */
const HYMNS_4 = [
  'song.folk.amazing-grace-satb.pdmx',
  'song.classical.rock-of-ages-cleft-for-me.pdmx',
  'song.classical.abide-with-me-william-henry-monk.pdmx',
  'song.classical.beethoven-joyful-joyful-we-adore-thee.pdmx',
  'song.classical.bach-o-sacred-head-johann-sebastian-bach-on-a-tune-by-hans-leo-hassler.pdmx',
];
const HYMNS_5 = [
  'song.folk.what-a-friend-we-have-in-jesus.pdmx',
  'song.folk.down-by-the-riverside.pdmx',
  'song.folk.this-little-light-of-mine.pdmx',
  'song.folk.just-a-closer-walk-with-thee-easy-piano.pdmx',
  'song.pop.martin-j-nystrom-as-the-deer-piano.pdmx',
];
const LATIN_6 = [
  'song.classical.tango-la-cumparsita-piano-solo-tutorial-parte-b.pdmx',
  'song.folk.por-una-cabeza-carlos-gardel.pdmx',
  'song.jazz.the-crave',
];
const LATIN_7 = [
  'song.classical.el-choclo-piano.pdmx',
  'song.classical.albeniz-asturias.pdmx',
  'song.classical.lecuona-malaguena-by-ernesto-lecuona.pdmx',
];
const HYMNS_6 = [
  'song.classical.holy-holy-holy-lord-god-of-hosts-hugg-geo-c-hugg.pdmx',
  'song.folk.10000-reasons-matt-redman.pdmx',
  'song.folk.amazing-grace-in-g-major-for-piano-breezepiano.pdmx',
  'song.folk.down-by-the-riverside.pdmx.2',
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
  ['holiday.5', 'all four have both hands written out: two staves', () =>
    ['song.holiday.carol-of-the-bells.easy', 'song.folk.auld-lang-syne-anonymous-traditional.pdmx',
      'song.pop.misc-christmas-mary-did-you-know.pdmx',
      'song.classical.carol-we-wish-you-a-marry-christmas-piano.pdmx']
      .every((id) => byId.get(id)?.notation?.staves === 2)],
  ['holiday.5', 'Mary Did You Know is the long one of the four', () => {
    const bars = (id: string): number => byId.get(id)?.notation?.bars ?? 0;
    const mary = bars('song.pop.misc-christmas-mary-did-you-know.pdmx');
    return mary > 0 && ['song.holiday.carol-of-the-bells.easy',
      'song.folk.auld-lang-syne-anonymous-traditional.pdmx',
      'song.classical.carol-we-wish-you-a-marry-christmas-piano.pdmx']
      .every((id) => bars(id) < mary);
  }],
  ['holiday.6', 'Silent Night is the short one of the four', () => {
    const bars = (id: string): number => byId.get(id)?.notation?.bars ?? 0;
    const silent = bars('song.classical.ondrus-silent-night.pdmx');
    return silent > 0 && ['song.holiday.carol-of-the-bells',
      'song.folk.o-holy-night-piano-solo.pdmx',
      'song.pop.misc-christmas-joy-to-the-world-piano-solo.pdmx']
      .every((id) => bars(id) > silent);
  }],
  ['holiday.6', 'Carol of the Bells here is in a different key from the setting on the rung below', () => {
    const here = byId.get('song.holiday.carol-of-the-bells')?.notation?.keys[0]?.fifths;
    const below = byId.get('song.holiday.carol-of-the-bells.easy')?.notation?.keys[0]?.fifths;
    return here !== undefined && below !== undefined && here !== below;
  }],
  ['holiday.7', 'each of the three has its left hand written out: two staves', () =>
    ['song.classical.tchaikovsky-waltz-flowers', 'song.classical.tchaikovsky-sugar-plum',
      'song.jazz.vince-guaraldi-skating.pdmx']
      .every((id) => byId.get(id)?.notation?.staves === 2)],
  ['holiday.7', 'Skating is by far the longest of the three', () => {
    const bars = (id: string): number => byId.get(id)?.notation?.bars ?? 0;
    const skating = bars('song.jazz.vince-guaraldi-skating.pdmx');
    return skating > 0 && ['song.classical.tchaikovsky-waltz-flowers',
      'song.classical.tchaikovsky-sugar-plum'].every((id) => bars(id) < skating);
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
  ['hymns.4', 'not one of the five prints a chord symbol', () =>
    HYMNS_4.every((id) => byId.get(id)?.notation?.chordCount === 0)],
  ['hymns.4', 'each of the five is written on two staves', () =>
    HYMNS_4.every((id) => byId.get(id)?.notation?.staves === 2)],
  ['hymns.4', 'O Sacred Head is by far the longest of the five', () => {
    const bars = (id: string): number => byId.get(id)?.notation?.bars ?? 0;
    const bach = bars('song.classical.bach-o-sacred-head-johann-sebastian-bach-on-a-tune-by-hans-leo-hassler.pdmx');
    return bach > 0 && HYMNS_4.filter((id) => !id.includes('bach')).every((id) => bars(id) * 2 <= bach);
  }],
  ['hymns.4', 'the Joyful, Joyful here has parts the Stage 2 one has not: one stave there, two here', () => {
    const here = byId.get('song.classical.beethoven-joyful-joyful-we-adore-thee.pdmx')?.notation?.staves;
    const below = byId.get('song.classical.beethoven-ludwig-van-beethoven-joyful-joyful-we-adore-thee.pdmx')
      ?.notation?.staves;
    return here === 2 && below === 1;
  }],
  ['hymns.5', 'all five have their chords named above the stave', () =>
    HYMNS_5.every((id) => (byId.get(id)?.notation?.chordCount ?? 0) > 0)],
  ['hymns.5', 'As the Deer is the fullest of the five', () => {
    const count = (id: string): number => byId.get(id)?.notation?.chordCount ?? 0;
    const deer = count('song.pop.martin-j-nystrom-as-the-deer-piano.pdmx');
    return deer > 0 && HYMNS_5.filter((id) => !id.includes('as-the-deer')).every((id) => count(id) < deer);
  }],
  ['hymns.6', 'not one of the four prints a chord symbol', () =>
    HYMNS_6.every((id) => byId.get(id)?.notation?.chordCount === 0)],
  ['hymns.6', 'Holy holy holy is the short one of the four', () => {
    const bars = (id: string): number => byId.get(id)?.notation?.bars ?? 0;
    const hugg = bars('song.classical.holy-holy-holy-lord-god-of-hosts-hugg-geo-c-hugg.pdmx');
    return hugg > 0 && HYMNS_6.filter((id) => !id.includes('hugg')).every((id) => bars(id) > hugg);
  }],
  ['hymns.6', 'Amazing Grace here is far longer than the four-part setting two rungs below', () => {
    const bars = (id: string): number => byId.get(id)?.notation?.bars ?? 0;
    return bars('song.folk.amazing-grace-in-g-major-for-piano-breezepiano.pdmx') >
      bars('song.folk.amazing-grace-satb.pdmx') * 4;
  }],
  ['hymns.6', 'Down by the Riverside here has two staves where the lead sheet below has one', () => {
    const here = byId.get('song.folk.down-by-the-riverside.pdmx.2')?.notation?.staves;
    const below = byId.get('song.folk.down-by-the-riverside.pdmx')?.notation?.staves;
    return here === 2 && below === 1;
  }],
  ['latin.6', 'all three are written on two staves', () =>
    LATIN_6.every((id) => byId.get(id)?.notation?.staves === 2)],
  ['latin.6', 'La Cumparsita part B is the shortest of the three', () => {
    const bars = (id: string): number => byId.get(id)?.notation?.bars ?? 0;
    const partB = bars('song.classical.tango-la-cumparsita-piano-solo-tutorial-parte-b.pdmx');
    return partB > 0 && LATIN_6.filter((id) => !id.endsWith('parte-b.pdmx')).every((id) => bars(id) > partB);
  }],
  ['latin.6', 'part B prints no chord symbols where part A on the rung below prints some', () => {
    const count = (id: string): number => byId.get(id)?.notation?.chordCount ?? -1;
    return (
      count('song.classical.tango-la-cumparsita-piano-solo-tutorial-parte-b.pdmx') === 0 &&
      count('song.classical.tango-la-cumparsita-piano-solo-tutorial-parte-a.pdmx') > 0
    );
  }],
  ['latin.7', 'not one of the three prints a chord symbol', () =>
    LATIN_7.every((id) => byId.get(id)?.notation?.chordCount === 0)],
  ['latin.7', 'Asturias is the longest of the three', () => {
    const bars = (id: string): number => byId.get(id)?.notation?.bars ?? 0;
    const asturias = bars('song.classical.albeniz-asturias.pdmx');
    return asturias > 0 && LATIN_7.filter((id) => !id.includes('asturias')).every((id) => bars(id) < asturias);
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

/**
 * The three rungs T14's last run built — `jazz.3`, `jam.7` and `ragtime.9`.
 *
 * Kept in a block of their own rather than folded into `CLAIMS` above so that
 * the rows and the lessons they came from land together and can be read as one
 * thing. What they check is the same: a sentence in the lesson, against the
 * `notation` block the build read out of the MusicXML.
 *
 * **Several sentences in those three lessons cannot be checked here and are not
 * pretended to be.** "Eleven of its sixteen bars have a run of eighths", "a
 * bass doubled at the octave in seventy-three of ninety bars", and every
 * quotation of a direction printed on a score — *Solos at "C"*, *Slow March
 * Tempo*, *Break 1 Bar* — come from counting passes over the MusicXML and from
 * `dump_score.py`. `notation` holds key, metre, staves, bars and chord symbols
 * and nothing else, so a wrong count in one of those sentences would pass this
 * file. `pending-review.md` Entry 37 says so in the same words.
 */
const JAZZ_3 = [
  'song.folk.anonymous-swing-low-sweet-chariot.pdmx',
  'song.pop.ray-henderson-bye-bye-blackbird.pdmx',
  'song.classical.alexander-s-ragtime-band.pdmx',
  'song.blues.ole-miss',
];
const RAGTIME_9 = [
  'song.ragtime.joplin-original-rags',
  'song.ragtime.joplin-breeze-from-alabama',
  'song.ragtime.joplin-chrysanthemum',
  'song.classical.joplin-search-light-rag.pdmx',
];
const JAM_7 = [
  'song.pop.after-you-ve-gone.pdmx',
  'song.blues.jazz-me-blues',
  'song.blues.weary-blues',
  'song.blues.riverside-blues',
  'song.blues.storyville-blues',
];

/** `[lesson, the claim in words, the item, the test]` — the same shape as above. */
const T14_CLAIMS: [string, string, string, (n: Notation) => boolean][] = [
  ['jazz.3', 'Swing Low, Sweet Chariot is in G', 'song.folk.anonymous-swing-low-sweet-chariot.pdmx',
    (n) => keyOf(n).startsWith('G')],
  ['jazz.3', '…sixteen bars of it', 'song.folk.anonymous-swing-low-sweet-chariot.pdmx',
    (n) => n.bars === 16],
  ['jazz.3', '…over three chords', 'song.folk.anonymous-swing-low-sweet-chariot.pdmx',
    (n) => n.chords.length === 3],
  ['jazz.3', "Alexander's Ragtime Band is thirty-three bars", 'song.classical.alexander-s-ragtime-band.pdmx',
    (n) => n.bars === 33],
  ['jazz.3', 'Bye Bye Blackbird has fifty-seven chord symbols in sixty-three bars',
    'song.pop.ray-henderson-bye-bye-blackbird.pdmx',
    (n) => n.bars === 63 && n.chordCount === 57],
  ['jazz.3', 'Ole Miss is sixty-four bars', 'song.blues.ole-miss', (n) => n.bars === 64],

  ['ragtime.9', 'Original Rags is a hundred and nine bars', 'song.ragtime.joplin-original-rags',
    (n) => n.bars === 109],
  ['ragtime.9', '…across three key signatures', 'song.ragtime.joplin-original-rags',
    (n) => n.keys.length === 3],
  ['ragtime.9', 'A Breeze from Alabama opens with no sharps or flats', 'song.ragtime.joplin-breeze-from-alabama',
    (n) => n.keys[0]?.fifths === 0],
  ['ragtime.9', '…and one of its three key signatures is four flats', 'song.ragtime.joplin-breeze-from-alabama',
    (n) => n.keys.length === 3 && n.keys.some((k) => k.fifths === -4)],
  ['ragtime.9', 'The Chrysanthemum is a hundred and four bars', 'song.ragtime.joplin-chrysanthemum',
    (n) => n.bars === 104],
  ['ragtime.9', '…in three key signatures', 'song.ragtime.joplin-chrysanthemum',
    (n) => n.keys.length === 3],
  ['ragtime.9', 'Search-Light Rag is ninety bars', 'song.classical.joplin-search-light-rag.pdmx',
    (n) => n.bars === 90],
  ['ragtime.9', '…in two keys rather than three', 'song.classical.joplin-search-light-rag.pdmx',
    (n) => n.keys.length === 2],

  ['jam.7', "After You've Gone is thirty-six bars", 'song.pop.after-you-ve-gone.pdmx', (n) => n.bars === 36],
  ['jam.7', 'Weary Blues is the one that changes key', 'song.blues.weary-blues', (n) => n.keys.length === 2],
  ['jam.7', '…and the one written with a sharp in the signature', 'song.blues.weary-blues',
    (n) => (n.keys[0]?.fifths ?? 0) > 0],
  ['jam.7', 'Storyville Blues is fifty-six bars', 'song.blues.storyville-blues', (n) => n.bars === 56],
  ['jam.7', '…in four flats', 'song.blues.storyville-blues', (n) => n.keys[0]?.fifths === -4],
  ['jam.7', '…with seventy-five chord changes', 'song.blues.storyville-blues', (n) => n.chordCount === 75],
];

/** `[lesson, the claim in words, the test]` — claims over a whole rung. */
const T14_COMPARISONS: [string, string, () => boolean][] = [
  ['jazz.3', 'every one a melody on a single stave', () =>
    JAZZ_3.every((id) => byId.get(id)?.notation?.staves === 1)],
  ['jazz.3', 'all four tunes print chord symbols', () =>
    JAZZ_3.every((id) => (byId.get(id)?.notation?.chordCount ?? 0) > 0)],
  ['jazz.3', 'Bye Bye Blackbird is the one with the most chord changes over it', () => {
    const count = (id: string): number => byId.get(id)?.notation?.chordCount ?? 0;
    const blackbird = count('song.pop.ray-henderson-bye-bye-blackbird.pdmx');
    return blackbird > 0 && JAZZ_3.filter((id) => !id.includes('blackbird')).every((id) => count(id) < blackbird);
  }],
  ['ragtime.9', 'all four in two-four', () =>
    RAGTIME_9.every((id) => byId.get(id)?.notation?.times.includes('2/4') === true)],
  ['ragtime.9', 'none of them printing a single chord symbol', () =>
    RAGTIME_9.every((id) => byId.get(id)?.notation?.chordCount === 0)],
  ['ragtime.9', 'a rag is two staves, so every option here is', () =>
    RAGTIME_9.every((id) => byId.get(id)?.notation?.staves === 2)],
  ['ragtime.9', 'Original Rags is the longest of the four', () => {
    const bars = (id: string): number => byId.get(id)?.notation?.bars ?? 0;
    const longest = bars('song.ragtime.joplin-original-rags');
    return longest > 0 && RAGTIME_9.filter((id) => !id.includes('original')).every((id) => bars(id) < longest);
  }],
  ['ragtime.9', 'Search-Light Rag is the short one', () => {
    const bars = (id: string): number => byId.get(id)?.notation?.bars ?? 0;
    const shortest = bars('song.classical.joplin-search-light-rag.pdmx');
    return shortest > 0 && RAGTIME_9.filter((id) => !id.includes('search-light')).every((id) => bars(id) > shortest);
  }],
  ['jam.7', 'every one a lead sheet on a single stave', () =>
    JAM_7.every((id) => byId.get(id)?.notation?.staves === 1)],
  ['jam.7', '…with its chords printed, which is what puts a Chart on every row', () =>
    JAM_7.every((id) => (byId.get(id)?.notation?.chordCount ?? 0) > 0)],
  ['jam.7', "After You've Gone is the shortest of the five", () => {
    const bars = (id: string): number => byId.get(id)?.notation?.bars ?? 0;
    const shortest = bars('song.pop.after-you-ve-gone.pdmx');
    return shortest > 0 && JAM_7.filter((id) => !id.includes('after-you')).every((id) => bars(id) > shortest);
  }],
  ['jam.7', 'four of these five sit in flat keys', () =>
    JAM_7.filter((id) => (byId.get(id)?.notation?.keys[0]?.fifths ?? 0) < 0).length === 4],
  ['jam.7', 'Storyville Blues is the biggest of the five', () => {
    const count = (id: string): number => byId.get(id)?.notation?.chordCount ?? 0;
    const bars = (id: string): number => byId.get(id)?.notation?.bars ?? 0;
    const others = JAM_7.filter((id) => !id.includes('storyville'));
    return others.every((id) => bars(id) < bars('song.blues.storyville-blues'))
      && others.every((id) => count(id) < count('song.blues.storyville-blues'));
  }],
];

describe('the three rungs T14 built last tell the truth about their music', () => {
  it('states nothing about a piece that the piece does not do', () => {
    const wrong: string[] = [];
    for (const [lesson, claim, id, test] of T14_CLAIMS) {
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
    for (const [lesson, claim, test] of T14_COMPARISONS) {
      if (!test()) wrong.push(`${lesson}: "${claim}" is false`);
    }
    expect(wrong, `lessons claiming things their music does not do:\n${wrong.join('\n')}`).toEqual([]);
  });

  it('names only pieces that are still in the catalog', () => {
    const named = [...JAZZ_3, ...RAGTIME_9, ...JAM_7, ...T14_CLAIMS.map(([, , id]) => id)];
    const missing = [...new Set(named)].filter((id) => !byId.has(id));
    expect(missing, `options no longer in the catalog: ${missing.join(', ')}`).toEqual([]);
  });
});
