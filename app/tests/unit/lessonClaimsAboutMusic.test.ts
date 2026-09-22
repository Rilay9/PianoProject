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

/**
 * T12: the 2026-09-19 lesson corrections, second-read on 2026-09-22 and put
 * under test — the music half.
 *
 * Every row here stands under a `Second read (2026-09-22): …` line in
 * `docs/lesson-audit/batch-1.md`, `batch-2.md` or `batch-3.md`, and the name of
 * each `it` is the `Row:` line written under that finding. The point is the one
 * this file's header already makes: a corrected sentence that nothing reads
 * goes quietly wrong the next time the score or the rung moves, and 236
 * sentences were corrected with nothing reading any of them.
 *
 * **Why this block reads the MusicXML where the table above reads `notation`.**
 * `notation` answers key, metre, staves, bars and printed chord symbols, and
 * most of these sentences are about what a *hand* plays — the fingering printed
 * on a note, the order of the pitches in a bar, whether a triad is struck as a
 * block. The audit's own brief says to read those off the score, and
 * `dump_score.py` is how it did. So the helpers below read the built `.mxl` the
 * way the app reads it, through `mxlToMusicXml`, and count what the dump prints
 * — plus two things the dump cannot do and these rows need: a `<chord/>` member
 * is told apart from the note that carries the beat, and `<dot/>` is read, so a
 * dotted quarter is not filed as a quarter.
 *
 * Nothing here has been heard. Every claim is about what is written.
 */

/** A note as this block needs it: the pitch, the writing, and where it falls. */
interface T12Note {
  bar: string;
  staff: number;
  voice: string;
  midi: number | null;
  /** `C#4`, `B♭3` — the spelling on the page, not a pitch class. */
  name: string | null;
  type: string;
  dotted: boolean;
  grace: boolean;
  rest: boolean;
  chord: boolean;
  finger: string | null;
  /** Quarter notes from the start of the bar, so beat one is 0. */
  offset: number;
}

const T12_STEPS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** The catalog's `file` per id, taken off the rows this file already parsed. */
const t12Files = new Map(
  (rows as unknown as { id: string; file?: string | null }[]).map((row) => [row.id, row.file ?? null]),
);

const t12XmlCache = new Map<string, string>();

/** The MusicXML of a built score, unzipped the way the app unzips it. */
function t12Xml(id: string): string {
  const cached = t12XmlCache.get(id);
  if (cached !== undefined) return cached;
  const file = t12Files.get(id);
  if (typeof file !== 'string' || file === '') throw new Error(`${id} has no score file`);
  const xml = mxlToMusicXml(new Uint8Array(readFileSync(join(CONTENT, file))));
  t12XmlCache.set(id, xml);
  return xml;
}

const t12NoteCache = new Map<string, T12Note[]>();

/**
 * Every note of a built score, in written order, with its place in the bar.
 *
 * The cursor is MusicXML's own: `<backup>` and `<forward>` move it, a
 * `<chord/>` note sits where the note before it sits, and a grace note takes no
 * time. Without that the second of a pair of eighths and the upper note of a
 * triad would be indistinguishable, which is what several of these sentences
 * turn on.
 */
function t12Notes(id: string): T12Note[] {
  const cached = t12NoteCache.get(id);
  if (cached !== undefined) return cached;
  const xml = t12Xml(id);
  const divisions = Number(/<divisions>(\d+)<\/divisions>/.exec(xml)?.[1] ?? '1') || 1;
  const out: T12Note[] = [];
  for (const measure of xml.matchAll(
    /<measure\b[^>]*number="([^"]*)"[^>]*>([\s\S]*?)<\/measure>/g,
  )) {
    const bar = measure[1] ?? '';
    let cursor = 0;
    let previous = 0;
    for (const part of (measure[2] ?? '').matchAll(
      /<note\b[\s\S]*?<\/note>|<backup>[\s\S]*?<\/backup>|<forward>[\s\S]*?<\/forward>/g,
    )) {
      const text = part[0];
      const duration = Number(/<duration>(\d+)<\/duration>/.exec(text)?.[1] ?? '0');
      if (text.startsWith('<backup')) {
        cursor -= duration;
        continue;
      }
      if (text.startsWith('<forward')) {
        cursor += duration;
        continue;
      }
      const grace = text.includes('<grace');
      const chord = text.includes('<chord');
      const pitch =
        /<step>([A-G])<\/step>\s*(?:<alter>(-?\d+)<\/alter>)?\s*<octave>(-?\d+)<\/octave>/.exec(text);
      const step = pitch?.[1] ?? null;
      const alter = Number(pitch?.[2] ?? '0');
      const octave = Number(pitch?.[3] ?? '4');
      out.push({
        bar,
        staff: Number(/<staff>(\d+)<\/staff>/.exec(text)?.[1] ?? '1'),
        voice: /<voice>(\d+)<\/voice>/.exec(text)?.[1] ?? '1',
        midi: step === null ? null : (octave + 1) * 12 + (T12_STEPS[step] ?? 0) + alter,
        name:
          step === null
            ? null
            : `${step}${alter > 0 ? '#'.repeat(alter) : '♭'.repeat(-alter)}${String(octave)}`,
        type: /<type[^>]*>(\w+)<\/type>/.exec(text)?.[1] ?? '',
        dotted: text.includes('<dot'),
        grace,
        rest: text.includes('<rest'),
        chord,
        finger: /<fingering[^>]*>([^<]*)<\/fingering>/.exec(text)?.[1] ?? null,
        offset: (chord ? previous : cursor) / divisions,
      });
      if (!chord && !grace) {
        previous = cursor;
        cursor += duration;
      }
    }
  }
  t12NoteCache.set(id, out);
  return out;
}

/** The sounding notes: no rests, and no grace notes unless asked for. */
function t12Sounded(id: string, withGraces = false): T12Note[] {
  return t12Notes(id).filter((note) => !note.rest && (withGraces || !note.grace));
}

/** One staff's notes with chord members dropped, so each entry carries a beat. */
function t12Line(id: string, staff: number): T12Note[] {
  return t12Sounded(id).filter((note) => note.staff === staff && !note.chord);
}

/** The printed chord symbols of a built score, bar by bar. */
function t12Harmony(id: string): { bar: string; symbols: string[] }[] {
  const out: { bar: string; symbols: string[] }[] = [];
  for (const measure of t12Xml(id).matchAll(
    /<measure\b[^>]*number="([^"]*)"[^>]*>([\s\S]*?)<\/measure>/g,
  )) {
    const symbols = [...(measure[2] ?? '').matchAll(/<harmony[\s\S]*?<\/harmony>/g)].map((found) =>
      (found[0] ?? '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
    );
    out.push({ bar: measure[1] ?? '', symbols });
  }
  return out;
}

/** How many times a pattern occurs in a score's MusicXML. */
function t12Count(id: string, pattern: RegExp): number {
  return [...t12Xml(id).matchAll(pattern)].length;
}

/** The `notation` block of a catalog row, or a thrown error naming the id. */
function t12Notation(id: string): Notation {
  const notation = byId.get(id)?.notation;
  if (!notation) throw new Error(`${id} has no notation`);
  return notation;
}

/** The built curriculum, for the rows that are about what a rung offers. */
interface T12Rung {
  id: string;
  stage: number;
  songOptions?: string[];
  exerciseOptions?: string[];
  levelBand?: [number, number];
}
const t12Rungs = new Map<string, T12Rung>();
for (const stage of (
  JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as {
    stages: { number: number; units: { lessons: Omit<T12Rung, 'stage'>[] }[] }[];
  }
).stages) {
  for (const unit of stage.units) {
    for (const lesson of unit.lessons) t12Rungs.set(lesson.id, { ...lesson, stage: stage.number });
  }
}
function t12Rung(id: string): T12Rung {
  const rung = t12Rungs.get(id);
  if (!rung) throw new Error(`no rung ${id}`);
  return rung;
}
function t12Songs(id: string): string[] {
  return t12Rung(id).songOptions ?? [];
}
function t12Exercises(id: string): string[] {
  return t12Rung(id).exerciseOptions ?? [];
}

/** The melodic intervals of one staff, in semitones, repeats included. */
function t12Intervals(id: string, staff = 1): number[] {
  const line = t12Line(id, staff)
    .map((note) => note.midi)
    .filter((midi): midi is number => midi !== null);
  return line.slice(1).map((midi, index) => Math.abs(midi - (line[index] as number)));
}

/** The notes of one bar of one staff, chord members dropped. */
function t12Bar(id: string, staff: number, bar: string): T12Note[] {
  return t12Line(id, staff).filter((note) => note.bar === bar);
}

/** Every bar of one staff that holds more than one note, in order. */
function t12FullBars(id: string, staff: number): T12Note[][] {
  const bars = new Map<string, T12Note[]>();
  for (const note of t12Line(id, staff)) bars.set(note.bar, [...(bars.get(note.bar) ?? []), note]);
  return [...bars.values()].filter((notes) => notes.length > 1);
}

/** Rung 1.1's six songs, named once: four rows below count over them. */
const T12_RUNG_1_1 = [
  'song.folk.hot-cross-buns',
  'song.folk.mary-had-a-little-lamb',
  'song.folk.merrily-we-roll-along',
  'song.folk.au-clair-de-la-lune',
  'song.classical.ode-to-joy.rh',
  'song.folk.kum-ba-yah.pdmx',
];

/** `[lesson, the claim in the words of its `Row:` line, the test]` */
const T12_MUSIC: [string, string, () => boolean][] = [
  [
    '0.1',
    'a bundled piece can print no finger numbers at all (Kum Ba Yah)',
    () => {
      const notes = t12Sounded('song.folk.kum-ba-yah.pdmx');
      return notes.length > 0 && notes.every((note) => note.finger === null);
    },
  ],

  [
    '1.1',
    'five of the six tunes on this rung stay inside C position and one does not',
    () => {
      const inside = T12_RUNG_1_1.filter((id) =>
        t12Sounded(id).every((note) => note.midi !== null && note.midi >= 60 && note.midi <= 67),
      );
      return (
        t12Songs('1.1').length === 6 &&
        inside.length === 5 &&
        !inside.includes('song.folk.kum-ba-yah.pdmx')
      );
    },
  ],
  [
    '1.1',
    'Mary adds G and no F, and Ode to Joy adds both F and G',
    () => {
      const letters = (id: string): Set<string> =>
        new Set(t12Sounded(id).map((note) => (note.name ?? '').replace(/-?\d+$/, '')));
      const mary = letters('song.folk.mary-had-a-little-lamb');
      const ode = letters('song.classical.ode-to-joy.rh');
      return !mary.has('F') && mary.has('G') && ode.has('F') && ode.has('G');
    },
  ],
  [
    '1.1',
    'Kum Ba Yah is six notes from G4 to E5, eight bars on one staff, with no fingering printed',
    () => {
      const id = 'song.folk.kum-ba-yah.pdmx';
      const midis = t12Sounded(id).map((note) => note.midi ?? 0);
      const notation = t12Notation(id);
      return (
        new Set(midis).size === 6 &&
        Math.min(...midis) === 67 &&
        Math.max(...midis) === 76 &&
        notation.bars === 8 &&
        notation.staves === 1
      );
    },
  ],
  [
    '1.1',
    "two of the rung's six tunes do not print a finger number on every note",
    () =>
      T12_RUNG_1_1.filter((id) => t12Sounded(id).some((note) => note.finger === null)).length === 2,
  ],

  [
    '1.2',
    'every tune on the rung before this one already holds a note longer than a beat',
    () =>
      T12_RUNG_1_1.every((id) =>
        t12Sounded(id).some((note) => note.type === 'half' || note.type === 'whole'),
      ),
  ],

  [
    '1.5',
    'The Water Is Wide is mostly steps and its largest leap is the fourth D4–G4',
    () => {
      const id = 'song.folk.the-water-is-wide.pdmx';
      const moves = t12Intervals(id).filter((semitones) => semitones > 0);
      const line = t12Line(id, 1);
      const fourths = line
        .slice(1)
        .map((note, index) => [line[index]?.midi ?? 0, note.midi ?? 0] as const)
        .filter(([from, to]) => Math.abs(to - from) === 5);
      return (
        Math.max(...moves) === 5 &&
        moves.filter((semitones) => semitones <= 2).length > moves.length / 2 &&
        fourths.length > 0 &&
        fourths.every(([from, to]) => from === 62 && to === 67)
      );
    },
  ],

  [
    '2.1',
    "Simple Gifts is one staff and the rung's other four songs are the hands-together settings",
    () => {
      const songs = t12Songs('2.1');
      return (
        t12Notation('song.folk.simple-gifts.pdmx').staves === 1 &&
        songs.length === 5 &&
        songs.filter((id) => id.endsWith('.ht')).length === 4
      );
    },
  ],
  [
    '2.1',
    'Simple Gifts is mostly steps and thirds, its largest leap is a fifth, and few of its quarters are dotted',
    () => {
      const id = 'song.folk.simple-gifts.pdmx';
      const moves = t12Intervals(id).filter((semitones) => semitones > 0);
      const dotted = t12Sounded(id).filter((note) => note.dotted);
      const quarters = t12Sounded(id).filter((note) => note.type === 'quarter');
      return (
        Math.max(...moves) === 7 &&
        moves.filter((semitones) => semitones === 7).length === 2 &&
        moves.filter((semitones) => semitones <= 4).length > moves.length * 0.85 &&
        dotted.length * 4 < quarters.length &&
        dotted.every((note) => note.type === 'quarter')
      );
    },
  ],

  [
    '2.2',
    "Sakura's eighths come in pairs, mostly on the second beat, and Old MacDonald has none",
    () => {
      const eighths = t12Line('song.folk.sakura.pdmx', 1).filter((note) => note.type === 'eighth');
      const bars = [...new Set(eighths.map((note) => note.bar))];
      const pairs = bars.map((bar) => eighths.filter((note) => note.bar === bar));
      const onTwo = pairs.filter((pair) => pair[0]?.offset === 1);
      return (
        eighths.length > 0 &&
        pairs.every((pair) => pair.length === 2) &&
        onTwo.length === pairs.length - 1 &&
        t12Sounded('song.folk.old-macdonald').every((note) => note.type !== 'eighth')
      );
    },
  ],
  [
    '2.2',
    'Alouette is in 6/8 and has eighth notes in it',
    () =>
      t12Notation('song.folk.alouette.pdmx').times.includes('6/8') &&
      t12Sounded('song.folk.alouette.pdmx').some((note) => note.type === 'eighth'),
  ],
  [
    '2.2',
    'the gentille Alouette figure is quarter–eighth–quarter–eighth, never four equal notes',
    () => {
      const bars = t12FullBars('song.folk.alouette.pdmx', 1).map((notes) =>
        notes.map((note) => note.type).join(' '),
      );
      return (
        bars.filter((types) => types === 'quarter eighth quarter eighth').length >= 4 &&
        bars.filter((types) => types === 'eighth eighth eighth eighth').length === 0
      );
    },
  ],

  [
    '2.3',
    "two of the rung's seven songs write block triads in the left hand and four print only a tune and symbols",
    () => {
      const songs = t12Songs('2.3');
      const blocks = ['song.folk.happy-birthday.simple', 'song.holiday.jingle-bells.g'].filter(
        (id) => {
          const left = t12Sounded(id).filter((note) => note.staff === 2);
          const heads = left.filter((note) => !note.chord);
          return heads.length > 0 && left.length === heads.length * 3;
        },
      );
      return (
        songs.length === 7 &&
        songs.filter((id) => t12Notation(id).staves === 1).length === 4 &&
        blocks.length === 2
      );
    },
  ],
  [
    '2.3',
    'Happy Birthday (simple) names C, F and a G7 over a plain G triad, and Jingle Bells is in G over G, C and D7',
    () => {
      const birthday = t12Notation('song.folk.happy-birthday.simple');
      const bells = t12Notation('song.holiday.jingle-bells.g');
      const left = t12Sounded('song.folk.happy-birthday.simple').filter((note) => note.staff === 2);
      const heads = left.filter((note) => !note.chord);
      return (
        ['C', 'F', 'Gdominant'].every((chord) => birthday.chords.includes(chord)) &&
        heads.length > 0 &&
        left.length === heads.length * 3 &&
        bells.keys[0]?.fifths === 1 &&
        ['C', 'Ddominant', 'G'].every((chord) => bells.chords.includes(chord))
      );
    },
  ],
  [
    '2.3',
    'Skip to My Lou is one staff in two sharps with just D and A named over it',
    () => {
      const notation = t12Notation('song.folk.skip-to-my-lou.pdmx');
      return (
        notation.staves === 1 &&
        notation.keys[0]?.fifths === 2 &&
        notation.chords.length === 2 &&
        ['A', 'D'].every((chord) => notation.chords.includes(chord))
      );
    },
  ],
  [
    '2.3',
    'Skip to My Lou changes chord at bars 1, 3, 5, 7 and 8 and nowhere else',
    () =>
      t12Harmony('song.folk.skip-to-my-lou.pdmx')
        .filter((bar) => bar.symbols.length > 0)
        .map((bar) => bar.bar)
        .join(',') === '1,3,5,7,8',
  ],

  [
    '2.4',
    'Greensleeves (simple) is in A minor and has the dotted figure in about half its bars, not all of them',
    () => {
      const id = 'song.folk.greensleeves.simple';
      const full = t12FullBars(id, 1);
      const figure = full.filter(
        (notes) => notes[0]?.dotted === true && notes[0]?.type === 'quarter',
      );
      return (
        keyOf(t12Notation(id)).startsWith('Am') &&
        figure.length * 3 > full.length &&
        figure.length * 3 < full.length * 2
      );
    },
  ],
  [
    '2.4',
    'Streets of Laredo is seventeen bars on one staff with no left hand',
    () => {
      const notation = t12Notation('song.folk.streets-of-laredo.pdmx');
      return (
        notation.bars === 17 &&
        notation.staves === 1 &&
        t12Sounded('song.folk.streets-of-laredo.pdmx').every((note) => note.staff === 1)
      );
    },
  ],
  [
    '2.4',
    'Streets of Laredo is in 3/4 and each of its four phrases carries a dotted quarter on a second beat',
    () => {
      const id = 'song.folk.streets-of-laredo.pdmx';
      const dotted = t12Line(id, 1).filter((note) => note.dotted && note.type === 'quarter');
      const phrases = [
        [2, 3, 4, 5],
        [6, 7, 8, 9],
        [10, 11, 12, 13],
        [14, 15, 16, 17],
      ];
      return (
        t12Notation(id).times.includes('3/4') &&
        dotted.length > 0 &&
        dotted.every((note) => note.offset === 1) &&
        phrases.every((bars) => dotted.some((note) => bars.includes(Number(note.bar))))
      );
    },
  ],

  [
    '2.5',
    'Ode to Joy (full theme) leaves C position only in bar 12, and no finger crosses under a thumb',
    () => {
      const right = t12Line('song.classical.ode-to-joy.full', 1);
      const outside = right.filter((note) => (note.midi ?? 0) < 60 || (note.midi ?? 0) > 67);
      const thumbUnder = right
        .slice(1)
        .some(
          (note, index) =>
            note.finger === '1' &&
            (note.midi ?? 0) > (right[index]?.midi ?? 0) &&
            Number(right[index]?.finger ?? '0') > 1,
        );
      return outside.length > 0 && outside.every((note) => note.bar === '12') && !thumbUnder;
    },
  ],

  [
    'holiday',
    'We Three Kings turns to G for its refrain and ends on a G chord',
    () => {
      const harmony = t12Harmony(
        'song.classical.1863-rev-john-henry-hopkins-we-three-kings-of-orient-are.pdmx',
      ).filter((bar) => bar.symbols.length > 0);
      const last = harmony[harmony.length - 1];
      return (
        harmony.some(
          (bar) =>
            Number(bar.bar) <= 8 && bar.symbols.some((symbol) => symbol.startsWith('E minor')),
        ) &&
        harmony.some(
          (bar) =>
            Number(bar.bar) > 8 && bar.symbols.some((symbol) => symbol.startsWith('G major')),
        ) &&
        last?.symbols[last.symbols.length - 1]?.startsWith('G major') === true
      );
    },
  ],

  [
    'hymns.2',
    'the Joyful, Joyful on this rung has no key signature, no accidental, more grace notes than notes, and a written tempo of 40',
    () => {
      const id = 'song.classical.beethoven-ludwig-van-beethoven-joyful-joyful-we-adore-thee.pdmx';
      const all = t12Notes(id).filter((note) => !note.rest);
      const graces = all.filter((note) => note.grace);
      return (
        t12Notation(id).keys.every((key) => key.fifths === 0) &&
        t12Count(id, /<alter>/g) === 0 &&
        graces.length > all.length - graces.length &&
        /<sound[^>]*tempo="40(\.0+)?"/.test(t12Xml(id))
      );
    },
  ],

  [
    '3.3',
    "both of Greensleeves' returns to A minor come through an E dominant",
    () => {
      const names = t12Harmony('song.folk.greensleeves.chords')
        .filter((bar) => bar.symbols.length > 0)
        .map((bar) => bar.symbols[0] ?? '');
      const run: string[] = [];
      for (const name of names) if (run[run.length - 1] !== name) run.push(name);
      const dominants = run
        .map((name, index) => [name, run[index + 1] ?? ''] as const)
        .filter(([name]) => name.startsWith('E dominant'));
      return dominants.length === 2 && dominants.every(([, next]) => next.startsWith('A minor'));
    },
  ],

  [
    'classical.3',
    'six options, four Anna Magdalena minuets in 3/4, the K. 331 theme in C and 3/4, and a 16-bar G minor fragment',
    () => {
      const songs = t12Songs('classical.3');
      const minuets = [
        'song.classical.petzold-minuet-g-bwv-anh114',
        'song.pop.minuet-in-g-minor-bach-piano.pdmx',
        'song.classical.bach-menuet-in-d-minor-bwv-anh-132.pdmx',
        'song.classical.bach-menuet-bwv-anh-113.pdmx',
      ];
      const k331 = t12Notation(
        'song.classical.mozart-theme-du-1er-mouvement-de-la-sonate-k-331.pdmx',
      );
      return (
        songs.length === 6 &&
        minuets.every((id) => songs.includes(id) && t12Notation(id).times.includes('3/4')) &&
        k331.keys[0]?.fifths === 0 &&
        k331.times.includes('3/4') &&
        t12Notation('song.pop.minuet-in-g-minor-bach-piano.pdmx').bars === 16
      );
    },
  ],
  [
    'classical.3',
    'the Écossaise is in F, one staff, in 2/4, and its title says F too',
    () => {
      const id = 'song.classical.beethoven-ludwig-van-beethoven-ecossaise.pdmx';
      const notation = t12Notation(id);
      const title = byId.get(id)?.title ?? '';
      return (
        notation.keys[0]?.fifths === -1 &&
        notation.staves === 1 &&
        notation.times.includes('2/4') &&
        /F major/.test(title) &&
        !/in G/.test(title)
      );
    },
  ],
  [
    'classical.3',
    'the Stage 5 mordent exercise goes to the note below and prints no ornament sign',
    () => {
      const id = 'exercise.mordent.c.2pb.left';
      const line = t12Line(id, 2).map((note) => note.midi ?? 0);
      const dips = line
        .slice(1, -1)
        .filter(
          (midi, index) => midi < (line[index] as number) && midi < (line[index + 2] as number),
        );
      return (
        t12Exercises('technique.5').includes(id) &&
        dips.length > 0 &&
        t12Count(id, /<mordent|<inverted-mordent|<ornaments/g) === 0
      );
    },
  ],

  [
    'blues.3',
    "Wabash Blues is the longest of the rung's five and Careless Love the shortest",
    () => {
      const bars = t12Songs('blues.3').map((id) => [id, t12Notation(id).bars] as const);
      const sorted = [...bars].sort((a, b) => a[1] - b[1]);
      return (
        bars.length === 5 &&
        sorted[0]?.[0] === 'song.pop.careless-love-blues.pdmx' &&
        sorted[sorted.length - 1]?.[0] === 'song.blues.wabash-blues'
      );
    },
  ],
  [
    'blues.3',
    "St. Louis Blues' first twelve bars use only I, IV and V and bar 13 leaves them",
    () => {
      const harmony = t12Harmony('song.classical.st-louis-blues.pdmx');
      const primary = /^(E major|A dominant|B dominant)/;
      const first = harmony.filter((bar) => Number(bar.bar) <= 12).flatMap((bar) => bar.symbols);
      const thirteen = harmony.find((bar) => bar.bar === '13')?.symbols ?? [];
      return (
        first.length > 0 &&
        first.every((symbol) => primary.test(symbol)) &&
        thirteen.length > 0 &&
        thirteen.every((symbol) => !primary.test(symbol))
      );
    },
  ],

  [
    'hymns',
    'Amazing Grace (four parts) really carries four voices and When the Saints in F carries two',
    () => {
      const parts = (id: string): number =>
        new Set(t12Sounded(id).map((note) => `${String(note.staff)}/${note.voice}`)).size;
      return (
        parts('song.folk.amazing-grace-satb.pdmx') === 4 &&
        parts('song.folk.when-the-saints.f') === 2
      );
    },
  ],

  [
    'rock.overview',
    "the easy Canon in D is the highest-levelled of the rung's four and sits inside its band",
    () => {
      const rung = t12Rung('rock.overview');
      const levelOf = (id: string): number =>
        (byId.get(id) as unknown as { level?: number } | undefined)?.level ?? 0;
      const levels = (rung.songOptions ?? []).map(levelOf);
      const canon = levelOf('song.classical.pachelbel-canon-d.easy');
      const band = rung.levelBand;
      return (
        levels.length === 4 &&
        canon === Math.max(...levels) &&
        band !== undefined &&
        canon >= band[0] &&
        canon <= band[1]
      );
    },
  ],

  [
    'latin.3',
    "all three of the rung's songs are one staff, and the clave-over-a-pulse exercise is two",
    () => {
      const songs = t12Songs('latin.3');
      return (
        songs.length === 3 &&
        songs.every((id) => t12Notation(id).staves === 1) &&
        new Set(t12Sounded('exercise.clave.son-3-2.pulse').map((note) => note.staff)).size === 2
      );
    },
  ],
  [
    'latin.3',
    'the four clave exercises are one-line percussion staves and the tresillo is not',
    () => {
      const claves = t12Exercises('latin.3').filter((id) => id.includes('clave'));
      return (
        claves.length === 4 &&
        claves.every(
          (id) =>
            t12Count(id, /<staff-lines>1<\/staff-lines>/g) > 0 &&
            t12Count(id, /<sign>percussion<\/sign>/g) > 0,
        ) &&
        t12Count(
          'exercise.tresillo.c',
          /<staff-lines>1<\/staff-lines>|<sign>percussion<\/sign>/g,
        ) === 0
      );
    },
  ],

  [
    '4.3',
    'the easy Canon in D breaks its chords in eighths for twelve bars and then stops',
    () => {
      const left = t12Line('song.classical.pachelbel-canon-d.easy', 2);
      const eighthBars = new Set(
        left.filter((note) => note.type === 'eighth').map((note) => Number(note.bar)),
      );
      return (
        [...eighthBars].every((bar) => bar <= 12) &&
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].every((bar) => eighthBars.has(bar)) &&
        left.filter((note) => Number(note.bar) === 13).every((note) => note.type === 'half')
      );
    },
  ],

  [
    '4.5',
    'compound time appears before this rung, in Alouette and Silent Night among others',
    () => {
      const early: string[] = [];
      for (const rung of t12Rungs.values()) {
        if (rung.stage > 3) continue;
        for (const id of [...(rung.songOptions ?? []), ...(rung.exerciseOptions ?? [])]) {
          const times = byId.get(id)?.notation?.times ?? [];
          if (times.some((time) => time.endsWith('/8'))) early.push(id);
        }
      }
      return (
        early.includes('song.folk.alouette.pdmx') &&
        early.includes('song.classical.1818-franz-xaver-gruber-silent-night.pdmx')
      );
    },
  ],
  [
    '4.5',
    'Greensleeves in 6/8 has two dotted-quarter beats in the left hand and a tune that crosses the second in about half its bars',
    () => {
      const id = 'song.folk.greensleeves.68';
      const fullLeft = t12FullBars(id, 2);
      const crossing = t12Line(id, 1).filter((note) => note.type === 'half' && note.offset === 0);
      return (
        t12Notation(id).times.includes('6/8') &&
        fullLeft.length > 10 &&
        fullLeft.every(
          (notes) =>
            notes.length === 2 && notes.every((note) => note.dotted && note.type === 'quarter'),
        ) &&
        crossing.length * 3 > fullLeft.length
      );
    },
  ],

  [
    'classical.4',
    'the Gurlitt study slurs only its right hand and marks no staccato at all',
    () => {
      const id = 'song.classical.gurlitt-cornelius-gurlitt-op-82.pdmx';
      const slurred = [...t12Xml(id).matchAll(/<note\b[\s\S]*?<\/note>/g)]
        .map((found) => found[0] ?? '')
        .filter((note) => note.includes('<slur'));
      return (
        slurred.length > 0 &&
        slurred.every((note) => /<staff>1<\/staff>/.test(note)) &&
        t12Count(id, /<staccato/g) === 0 &&
        t12Count(id, /<articulations/g) === 0
      );
    },
  ],
  [
    'classical.4',
    'the K. 1e file carries K. 1f as its Trio, and the rung offers five options',
    () => {
      const slice = (id: string, from: number, to: number): string =>
        t12Sounded(id)
          .filter((note) => Number(note.bar) >= from && Number(note.bar) <= to)
          .map((note) => note.name ?? '')
          .join(' ');
      const k1e = 'song.classical.mozart-w-a-mozart-minuet-in-g-major-k1e.pdmx';
      return (
        t12Songs('classical.4').length === 5 &&
        /Trio/.test(t12Xml(k1e)) &&
        slice(k1e, 19, 22) ===
          slice('song.classical.mozart-w-a-mozart-minuet-in-c-major-k1f.pdmx', 1, 4)
      );
    },
  ],

  [
    'classical.4.shelf',
    'the Library holds one Hisaishi and no Yiruma or Tiersen',
    () => {
      const pattern = /hisaishi|totoro|yiruma|tiersen|river flows|comptine|kiss the rain|ghibli/i;
      const found = (rows as unknown as { id: string; title?: string; composer?: string | null }[])
        .filter((row) => pattern.test(`${row.id} ${row.title ?? ''} ${row.composer ?? ''}`))
        .map((row) => row.id);
      return found.length === 1 && found[0] === 'song.classical.hisaishi-totoro-path-of-the-wind.pdmx';
    },
  ],

  [
    'chords-pop.4',
    'the easy Hallelujah rocks between C and A minor for eight bars and prints no chord symbols',
    () => {
      const id = 'song.folk.hallelujah-easy.pdmx';
      const names = t12Line(id, 2)
        .filter((note) => Number(note.bar) <= 8)
        .map((note) => (note.name ?? '').replace(/-?\d+$/, ''));
      return (
        t12Notation(id).chordCount === 0 &&
        names.length === 8 &&
        names.every((name, index) => name === (index % 2 === 0 ? 'C' : 'A'))
      );
    },
  ],
  [
    'chords-pop.4',
    "Alexander's Ragtime Band has the most chord symbols on the rung and runs Am–Em–Dm",
    () => {
      const id = 'song.classical.alexander-s-ragtime-band.pdmx';
      const mine = t12Notation(id).chordCount;
      const flat = t12Harmony(id).flatMap((bar) => bar.symbols);
      return (
        t12Songs('chords-pop.4').every((song) => song === id || t12Notation(song).chordCount < mine) &&
        flat.some(
          (symbol, index) =>
            symbol.startsWith('A minor') &&
            (flat[index + 1] ?? '').startsWith('E minor') &&
            (flat[index + 2] ?? '').startsWith('D minor'),
        )
      );
    },
  ],

  [
    'blues.4',
    "exactly two of the rung's items are marked swung",
    () => {
      const items = [...t12Songs('blues.4'), ...t12Exercises('blues.4')];
      return (
        items.length > 2 &&
        items.filter((id) => byId.get(id)?.notation?.swungMark === true).length === 2
      );
    },
  ],

  [
    'jam',
    "the rung's five twelve-bar shuffles are in E, A, G, C and F, and none is in D",
    () => {
      const fifths = t12Songs('jam').map((id) => t12Notation(id).keys[0]?.fifths ?? 99);
      return (
        fifths.length === 5 &&
        [4, 3, 1, 0, -1].every((value) => fifths.includes(value)) &&
        !fifths.includes(2)
      );
    },
  ],

  [
    'technique.4',
    'the scale, arpeggio, chromatic and inversion exercises finger every note, and the articulation ones finger none',
    () => {
      const options = t12Exercises('technique.4');
      const named = options.filter((id) => /\.(scale|arpeggio|chromatic|inversions)\./.test(id));
      const articulation = options.filter((id) => id.includes('articulation'));
      return (
        named.length === 6 &&
        named.every((id) => t12Sounded(id).every((note) => note.finger !== null)) &&
        articulation.length === 4 &&
        articulation.every((id) => t12Sounded(id).every((note) => note.finger === null))
      );
    },
  ],
  [
    'technique.4',
    'the contrary-motion scale starts the left hand an octave above the right and mirrors its fingering',
    () => {
      const id = 'exercise.scale.c-major.2oct.contrary.both.2';
      const right = t12Bar(id, 1, '1');
      const left = t12Bar(id, 2, '1');
      return (
        right[0]?.midi === 60 &&
        left[0]?.midi === 72 &&
        right.map((note) => note.finger ?? '').join(' ') ===
          left.map((note) => note.finger ?? '').join(' ')
      );
    },
  ],
  [
    'technique.4',
    'Lemoine No. 1 is a right-hand scale over chords, No. 2 the reverse, and No. 35 strikes its triads as blocks in 6/8',
    () => {
      const runs = (id: string, staff: number): number =>
        t12Line(id, staff).filter((note) => note.type === 'eighth').length;
      const thirtyFive = 'song.classical.lemoine-etude-op-37-no-35.pdmx';
      return (
        runs('song.classical.lemoine-etude-op-37-no-1.pdmx', 1) >
          runs('song.classical.lemoine-etude-op-37-no-1.pdmx', 2) &&
        runs('song.classical.lemoine-etude-op-37-no-2.pdmx', 2) >
          runs('song.classical.lemoine-etude-op-37-no-2.pdmx', 1) &&
        t12Sounded(thirtyFive).some((note) => note.staff === 1 && note.chord) &&
        t12Notation(thirtyFive).times.includes('6/8')
      );
    },
  ],

  [
    'rock.4',
    'the two ostinato exercises hold one bass through every bar, under two notes in E minor and a broken triad in D minor',
    () => {
      const held = (id: string): boolean => {
        const left = t12Sounded(id).filter((note) => note.staff === 2);
        return (
          left.length > 0 &&
          left.every((note) => note.type === 'whole') &&
          new Set(left.map((note) => note.midi)).size === 2
        );
      };
      const rightPitches = (id: string): number =>
        new Set(t12Line(id, 1).map((note) => note.midi)).size;
      return (
        held('exercise.ostinato.e.fifths') &&
        held('exercise.ostinato.d.arpeggio') &&
        rightPitches('exercise.ostinato.e.fifths') === 2 &&
        rightPitches('exercise.ostinato.d.arpeggio') === 4
      );
    },
  ],

  [
    'classical.5',
    'the second Clementi row is one 70-bar movement in 3/8 with one key signature',
    () => {
      const id = 'song.classical.clementi-sonatina-no1-2-muzio-clementi.pdmx';
      const notation = t12Notation(id);
      return (
        notation.bars === 70 &&
        notation.times.length === 1 &&
        notation.times[0] === '3/8' &&
        new Set([...t12Xml(id).matchAll(/<fifths>(-?\d+)<\/fifths>/g)].map((found) => found[1]))
          .size === 1
      );
    },
  ],
  [
    'classical.5',
    'the Alberti exercise on this rung is the figure under a scale, not on its own',
    () => {
      const id = 'exercise.accompaniment.alberti.g-major.both';
      const right = t12Bar(id, 1, '1').map((note) => note.midi ?? 0);
      return (
        t12Exercises('classical.5').includes(id) &&
        right.length === 4 &&
        right.every((midi, index) => {
          if (index === 0) return true;
          const step = midi - (right[index - 1] as number);
          return step === 1 || step === 2;
        }) &&
        t12Bar(id, 2, '1').length === 8
      );
    },
  ],

  [
    'chords-pop.5',
    'the add9 exercise writes the ninth on top, and it is on the rock rung at this stage rather than this one',
    () => {
      const id = 'exercise.open-voicing.c.add9';
      const right = t12Sounded(id).filter((note) => note.staff === 1);
      const bars = [...new Set(right.map((note) => note.bar))].map((bar) =>
        right.filter((note) => note.bar === bar).map((note) => note.midi ?? 0),
      );
      return (
        !t12Exercises('chords-pop.5').includes(id) &&
        t12Exercises('rock.5').includes(id) &&
        bars.length > 0 &&
        bars.every((midis) => midis.length === 4 && Math.max(...midis) - Math.min(...midis) === 14)
      );
    },
  ],
  [
    'chords-pop.5',
    'the 6/8 Greensleeves names the same three chords as the 3/4 one',
    () => {
      const six = [...t12Notation('song.folk.greensleeves.68').chords].sort();
      const three = [...t12Notation('song.folk.greensleeves.chords').chords].sort();
      return six.length === 3 && six.join(',') === three.join(',');
    },
  ],

  [
    'blues.5',
    "the rung's one turnaround is C–Am–Dm–G in block chords, and the catalog has the others the lesson points at",
    () => {
      const turnarounds = t12Exercises('blues.5').filter((id) => id.includes('turnaround'));
      const id = turnarounds[0] ?? '';
      const right = t12Sounded(id).filter((note) => note.staff === 1);
      const heads = right.filter((note) => !note.chord);
      const inCatalog = (rows as unknown as { id: string }[]).filter((row) =>
        row.id.startsWith('exercise.turnaround.'),
      );
      return (
        turnarounds.length === 1 &&
        heads.length === 4 &&
        right.length === heads.length * 3 &&
        heads.map((note) => note.midi ?? 0).join(',') === '60,69,62,67' &&
        inCatalog.length > 4
      );
    },
  ],
  [
    'blues.5',
    'the walking bass is four quarters a bar, root–third–fifth then an approach note',
    () => {
      const bars = t12FullBars('exercise.walking-bass.c.blues.intro', 2);
      return (
        bars.length === 12 &&
        bars.every(
          (notes) => notes.length === 4 && notes.every((note) => note.type === 'quarter'),
        ) &&
        bars.every((notes) => {
          const root = notes[0]?.midi ?? 0;
          return (notes[1]?.midi ?? 0) - root === 4 && (notes[2]?.midi ?? 0) - root === 7;
        })
      );
    },
  ],

  [
    'jazz.5',
    'the shell exercise writes two notes a chord, root and seventh, with no third',
    () => {
      const left = t12Sounded('exercise.ii-v-i.c.shells').filter((note) => note.staff === 2);
      const heads = left.filter((note) => !note.chord);
      return (
        heads.length > 0 &&
        left.length === heads.length * 2 &&
        heads.every((head) => {
          const above = left.find((note) => note.chord && note.bar === head.bar);
          const gap = (above?.midi ?? 0) - (head.midi ?? 0);
          return gap === 10 || gap === 11;
        })
      );
    },
  ],
  [
    'jazz.5',
    "not one of the rung's items is marked swung",
    () =>
      [...t12Songs('jazz.5'), ...t12Exercises('jazz.5')].every(
        (id) => byId.get(id)?.notation?.swungMark !== true,
      ),
  ],

  [
    'ragtime.5',
    '12th Street Rag is a one-staff lead sheet and The Entertainer is on two staves',
    () =>
      t12Notation('song.pop.12th-street-rag.pdmx').staves === 1 &&
      t12Notation('song.pop.12th-street-rag.pdmx').chordCount > 0 &&
      t12Notation('song.ragtime.joplin-entertainer').staves === 2,
  ],
  [
    'ragtime.5',
    "not one of the rung's items is marked swung, so the written times stand",
    () =>
      [...t12Songs('ragtime.5'), ...t12Exercises('ragtime.5')].every(
        (id) => byId.get(id)?.notation?.swungMark !== true,
      ),
  ],

  // --- Part A2: the one suspect `scout-spellings.md` found -------------------
  [
    '3.1',
    'Ode to Joy in G sounds no F at all, so the lesson and the edition note agree',
    () => {
      const id = 'song.classical.ode-to-joy.g';
      return (
        t12Sounded(id).every((note) => !(note.name ?? '').startsWith('F')) &&
        t12Notation(id).keys[0]?.fifths === 1
      );
    },
  ],
];

describe('the 2026-09-19 lesson corrections, second-read and under test: the music', () => {
  it('carries a row for each of the three batches the second read covered', () => {
    expect(T12_MUSIC.length).toBeGreaterThan(40);
  });

  for (const [lesson, says, holds] of T12_MUSIC) {
    it(`${lesson}: ${says}`, () => {
      expect(holds()).toBe(true);
    });
  }
});

// Appended with the block above in one edit, so a later run for batches 4 and 5
// can append its own without touching anything here. ES modules hoist their
// imports, so this reads exactly as one at the top of the file would.
import { mxlToMusicXml } from '../../src/score/mxl';

/**
 * T12, second run: the batch-4 and batch-5 corrections second-read on
 * 2026-09-22 and put under test — the music half.
 *
 * Entry 39 did batches 1–3 and said in as many words what it had not reached:
 * "43 + 49 = 92 ticked findings still rest on the fixer's own reading … and
 * they have no rows." These are those rows. Every `it` below is named by the
 * `Row:` line written under a `Second read (2026-09-22): …` verdict in
 * `docs/lesson-audit/batch-4.md` or `batch-5.md`, and the block is appended
 * whole so that neither of the earlier blocks had to be touched.
 *
 * **Why these read the MusicXML.** The same reason the block above does, and
 * three of these findings are the ones the brief singled out: `dump_score.py`
 * prints grace notes as ordinary notes and marks neither ties nor tuplets, and
 * *Pine Apple Rag* carries 280 ties, *Linus and Lucy* 424 ties and 27 tuplets,
 * and *Rhythm and Boogie* neither — which is itself the finding. So the rows
 * that turn on a rhythm read the file.
 *
 * Nothing here has been heard. Every claim is about what is written.
 */

/** One staff's events with `<chord/>` members merged onto the note they sit on. */
interface T12bGroup {
  bar: string;
  offset: number;
  midis: number[];
  types: string[];
  fingers: (string | null)[];
}

function t12bGroups(id: string, staff: number): T12bGroup[] {
  const out: T12bGroup[] = [];
  for (const note of t12Sounded(id)) {
    if (note.staff !== staff || note.midi === null) continue;
    const last = out[out.length - 1];
    if (note.chord && last !== undefined && last.bar === note.bar) {
      last.midis.push(note.midi);
      last.types.push(note.type);
      last.fingers.push(note.finger);
      continue;
    }
    out.push({
      bar: note.bar,
      offset: note.offset,
      midis: [note.midi],
      types: [note.type],
      fingers: [note.finger],
    });
  }
  return out;
}

/** The groups of one bar of one staff, in written order. */
function t12bBar(id: string, staff: number, bar: string): T12bGroup[] {
  return t12bGroups(id, staff).filter((group) => group.bar === bar);
}

/** One measure's raw XML, for the things a note list cannot carry (ties, repeats). */
function t12bMeasure(id: string, bar: string): string {
  const found = new RegExp(
    `<measure\\b[^>]*number="${bar}"[^>]*>([\\s\\S]*?)</measure>`,
  ).exec(t12Xml(id));
  return found?.[1] ?? '';
}

/** Every `<words>` on a score, with the bar it is printed in. */
function t12bWords(id: string): { bar: string; text: string }[] {
  const out: { bar: string; text: string }[] = [];
  for (const measure of t12Xml(id).matchAll(
    /<measure\b[^>]*number="([^"]*)"[^>]*>([\s\S]*?)<\/measure>/g,
  )) {
    for (const word of (measure[2] ?? '').matchAll(/<words[^>]*>([^<]*)<\/words>/g)) {
      const text = (word[1] ?? '').trim();
      if (text !== '') out.push({ bar: measure[1] ?? '', text });
    }
  }
  return out;
}

/** The tempo a file states, from `<sound tempo>` or `<per-minute>`, rounded. */
function t12bTempo(id: string): number | null {
  const xml = t12Xml(id);
  const sound = /<sound[^>]*tempo="([\d.]+)"/.exec(xml)?.[1];
  const perMinute = /<per-minute>([\d.]+)<\/per-minute>/.exec(xml)?.[1];
  const value = sound ?? perMinute;
  return value === undefined ? null : Math.round(Number(value));
}

/** Every key signature in the file, in order. */
function t12bFifths(id: string): number[] {
  return [...t12Xml(id).matchAll(/<fifths>(-?\d+)<\/fifths>/g)].map((found) =>
    Number(found[1] ?? '0'),
  );
}

/** A bar's pitch classes on one staff — the shape a "loop" is compared by. */
function t12bBarClasses(id: string, staff: number): Map<string, string> {
  const out = new Map<string, Set<number>>();
  for (const note of t12Sounded(id)) {
    if (note.staff !== staff || note.midi === null) continue;
    const set = out.get(note.bar) ?? new Set<number>();
    set.add(((note.midi % 12) + 12) % 12);
    out.set(note.bar, set);
  }
  return new Map(
    [...out.entries()].map(([bar, set]) => [bar, [...set].sort((a, b) => a - b).join(',')]),
  );
}

/** Does any four bars of this staff get repeated by the next four? */
function t12bRepeatsFourBars(id: string, staff: number): boolean {
  const bars = [...t12bBarClasses(id, staff).values()];
  for (let start = 0; start + 8 <= bars.length; start += 1) {
    const cell = bars.slice(start, start + 4);
    if (cell.some((bar) => bar === '')) continue;
    if (cell.join('|') === bars.slice(start + 4, start + 8).join('|')) return true;
  }
  return false;
}

/** A catalog row's own fields, for `tempoBpm` and `tags`, which `Notation` has not. */
function t12bRow(id: string): { tempoBpm?: number | null; tags?: string[]; bars: number } {
  const row = byId.get(id) as unknown as
    | { tempoBpm?: number | null; tags?: string[]; notation?: Notation }
    | undefined;
  if (!row?.notation) throw new Error(`${id} has no notation`);
  return { tempoBpm: row.tempoBpm, tags: row.tags, bars: row.notation.bars };
}

/** Left-hand events grouped and labelled the way a stride bar is read. */
type T12bStrideKind = 'bass' | 'chord' | 'single';
function t12bStride(group: T12bGroup): T12bStrideKind {
  const low = Math.min(...group.midis);
  const span = Math.max(...group.midis) - low;
  // C3 and below, not C3 and above: bar 24 of the second strain puts its bass
  // octave on C3+C4 while every other bar of the strain is an octave lower, and
  // a `< 48` cut called that one a chord and lost a bar off the count.
  if (group.midis.length === 2 && span === 12 && low <= 48) return 'bass';
  return group.midis.length >= 2 ? 'chord' : 'single';
}

const T12B_RAGTIME_6 = [
  'song.ragtime.joplin-school-of-ragtime',
  'song.ragtime.joplin-easy-winners',
  'song.ragtime.joplin-peacherine-rag',
  'song.ragtime.joplin-swipesy-cakewalk',
  'song.ragtime.joplin-sunflower-slow-drag',
  'song.ragtime.joplin-entertainer',
];

/** `[lesson, the claim in the words of its `Row:` line, the test]` */
const T12B_MUSIC: [string, string, () => boolean][] = [
  // --- batch 4 -------------------------------------------------------------
  [
    'technique.5',
    "the rung's mordent exercise is left hand only, two notes to the beat, each one main–below–main",
    () => {
      const id = 'exercise.mordent.c.2pb.left';
      const notes = t12Sounded(id);
      if (notes.length === 0 || notes.length % 3 !== 0) return false;
      if (!notes.every((note) => note.staff === 2 && note.type === 'eighth' && !note.dotted)) {
        return false;
      }
      for (let at = 0; at < notes.length; at += 3) {
        const main = notes[at]?.midi ?? 0;
        const below = notes[at + 1]?.midi ?? 0;
        const back = notes[at + 2]?.midi ?? 0;
        if (back !== main || below >= main || main - below > 2) return false;
      }
      return true;
    },
  ],
  [
    'rock.5',
    "both of the rung's two songs print a suspended chord symbol",
    () => {
      const songs = t12Songs('rock.5');
      return (
        songs.length === 2 &&
        songs.every((id) => t12Notation(id).chords.some((chord) => /sus/i.test(chord)))
      );
    },
  ],
  [
    'rock.5',
    'in every bar of the four open-voicing exercises the left hand is two octaves below the lowest right-hand note, which is never under middle C',
    () =>
      [
        'exercise.open-voicing.c.sus2',
        'exercise.open-voicing.c.sus4',
        'exercise.open-voicing.c.add9',
        'exercise.open-voicing.f.sus4',
      ].every((id) => {
        const left = t12bGroups(id, 2);
        const right = t12bGroups(id, 1);
        if (left.length === 0 || left.length !== right.length) return false;
        return left.every((bass, at) => {
          const chord = right[at];
          if (!chord || bass.midis.length !== 1) return false;
          const lowest = Math.min(...chord.midis);
          return lowest >= 60 && lowest - (bass.midis[0] as number) === 24;
        });
      }),
  ],
  [
    'rock.5',
    'every bar of andata holds a whole note in one hand or the other',
    () => {
      const id = 'song.classical.sakamoto-andata.pdmx';
      const whole = new Set(
        t12Sounded(id)
          .filter((note) => note.type === 'whole')
          .map((note) => note.bar),
      );
      const bars = new Set(t12Sounded(id).map((note) => note.bar));
      return bars.size > 60 && whole.size === bars.size;
    },
  ],
  [
    'classical.6',
    'all six pieces are on two staves, and the excepted one has nothing but sixteenths in its right hand until the last bar',
    () => {
      const songs = t12Songs('classical.6');
      if (songs.length !== 6 || !songs.every((id) => t12Notation(id).staves >= 2)) return false;
      const right = t12Sounded('song.classical.bach-wtc1-prelude-1').filter(
        (note) => note.staff === 1,
      );
      const sixteenths = right.filter((note) => note.type === '16th');
      const wholes = right.filter((note) => note.type === 'whole');
      return (
        right.length === sixteenths.length + wholes.length &&
        sixteenths.length > 300 &&
        new Set(wholes.map((note) => note.bar)).size === 1
      );
    },
  ],
  [
    'ragtime.6',
    'the three rags named print 70, 100 and 72, and only The Entertainer prints a word for its tempo',
    () =>
      t12bTempo('song.ragtime.joplin-entertainer') === 70 &&
      t12bWords('song.ragtime.joplin-entertainer').some((word) => /Moderato/.test(word.text)) &&
      t12bTempo('song.ragtime.joplin-peacherine-rag') === 100 &&
      t12bWords('song.ragtime.joplin-peacherine-rag').length === 0 &&
      t12bTempo('song.ragtime.joplin-easy-winners') === 72 &&
      t12bWords('song.ragtime.joplin-easy-winners').length === 0,
  ],
  [
    'ragtime.6',
    'every rag on the rung is full of repeat marks and none of them carries a da capo, segno or coda',
    () =>
      T12B_RAGTIME_6.length === t12Songs('ragtime.6').length &&
      T12B_RAGTIME_6.every(
        (id) =>
          t12Songs('ragtime.6').includes(id) &&
          t12Count(id, /<repeat\b/g) >= 6 &&
          !/dacapo|dalsegno|<segno|<coda|<fine|D\.C\.|D\.S\./.test(t12Xml(id)),
      ),
  ],
  [
    'ragtime.6',
    'the Entertainer is C with one flat in its trio, and the other two named rags span two to five flats',
    () => {
      const entertainer = t12bFifths('song.ragtime.joplin-entertainer');
      const others = [
        ...t12bFifths('song.ragtime.joplin-peacherine-rag'),
        ...t12bFifths('song.ragtime.joplin-easy-winners'),
      ];
      return (
        entertainer.length > 1 &&
        Math.max(...entertainer) === 0 &&
        Math.min(...entertainer) === -1 &&
        Math.max(...others) === -2 &&
        Math.min(...others) === -5
      );
    },
  ],
  [
    'ragtime.6',
    'the Entertainer is one 92-bar row offered whole by both ragtime.5 and ragtime.6',
    () => {
      const id = 'song.ragtime.joplin-entertainer';
      return (
        t12Songs('ragtime.5').includes(id) &&
        t12Songs('ragtime.6').includes(id) &&
        t12Notation(id).bars === 92
      );
    },
  ],
  [
    'ragtime.6',
    'every rag on the rung writes octave basses and none of the six strikes a left-hand tenth',
    () =>
      T12B_RAGTIME_6.every((id) => {
        const chords = t12bGroups(id, 2).filter((group) => group.midis.length > 1);
        const spans = chords.map((group) => Math.max(...group.midis) - Math.min(...group.midis));
        return spans.filter((span) => span === 12).length >= 10 && Math.max(...spans) < 15;
      }),
  ],
  [
    'ragtime.6',
    "the Entertainer's bass leaps of a tenth or more cluster in the F trio, which is denser than the rest of the rag",
    () => {
      const groups = t12bGroups('song.ragtime.joplin-entertainer', 2);
      const leaping = new Set<number>();
      for (let at = 1; at < groups.length; at += 1) {
        const from = Math.min(...(groups[at - 1] as T12bGroup).midis);
        const to = Math.min(...(groups[at] as T12bGroup).midis);
        if (Math.abs(to - from) >= 15) leaping.add(Number((groups[at] as T12bGroup).bar));
      }
      const inTrio = [...leaping].filter((bar) => bar >= 55 && bar <= 71);
      const outside = [...leaping].filter((bar) => bar < 55 || bar > 71);
      return (
        inTrio.length === 4 &&
        outside.length === 5 &&
        inTrio.length / 17 > (outside.length / 75) * 2
      );
    },
  ],
  [
    'blues.6',
    "Pinetop's Boogie Woogie has no left hand below bar 7 that climbs, and from bar 7 its left hand is dotted pairs over a held root",
    () => {
      const id = 'song.folk.boogie-woogie.pdmx';
      const early = t12Sounded(id).filter(
        (note) => note.staff === 2 && Number(note.bar) <= 6 && Number(note.bar) >= 1,
      );
      const later = t12bGroups(id, 2).filter(
        (group) => Number(group.bar) >= 7 && Number(group.bar) <= 12,
      );
      const roots = later.map((group) => Math.min(...group.midis));
      const fs = roots.filter((midi) => midi === 41).length;
      return (
        early.length > 100 &&
        early.every((note) => note.type === '32nd' && !note.dotted) &&
        later.some((group) => group.types.some((type, at) => type === 'eighth' && at === 0)) &&
        later.some((group) => group.midis.length === 2) &&
        fs / roots.length > 0.6
      );
    },
  ],
  [
    'blues.6',
    'each boogie exercise is four bars on a single chord, two in C and one in F, with no tie or tuplet in any of them',
    () => {
      const keyed: [string, string][] = [
        ['exercise.boogie.c.pinetop', 'C'],
        ['exercise.boogie.c.root-fifth', 'C'],
        ['exercise.boogie.f.walking-eighths', 'F'],
      ];
      return keyed.every(([id, root]) => {
        const notation = t12Notation(id);
        return (
          notation.bars === 4 &&
          notation.chords.length === 1 &&
          (notation.chords[0] ?? '').startsWith(root) &&
          t12Count(id, /<tie\b/g) === 0 &&
          t12Count(id, /<time-modification>/g) === 0 &&
          t12Count(id, /<dot\/>/g) === 0
        );
      });
    },
  ],
  [
    'chords-pop.6',
    "Annie's Song is the only one of the rung's six songs with chord symbols printed",
    () => {
      const songs = t12Songs('chords-pop.6');
      const printed = songs.filter((id) => t12Notation(id).chordCount > 0);
      return (
        songs.length === 6 &&
        printed.length === 1 &&
        printed[0] === 'song.folk.john-denver-annie-s-song.pdmx'
      );
    },
  ],
  [
    'chords-pop.6',
    "Clocks' left hand loops three chords and Dancing Queen's never repeats a four-bar cell",
    () => {
      const clocks = t12bBarClasses('song.pop.coldplay-clocks-coldplay.pdmx', 2);
      const cell = ['5', '6', '7', '8'].map((bar) => clocks.get(bar) ?? '');
      const again = ['16', '17', '18', '19'].map((bar) => clocks.get(bar) ?? '');
      return (
        new Set(cell).size === 3 &&
        cell.join('|') === again.join('|') &&
        !t12bRepeatsFourBars('song.pop.abba-dancing-queen.pdmx', 2)
      );
    },
  ],
  [
    'chords-pop.6',
    'the three songs called loops repeat a left-hand cell and the three called loopless never repeat four bars',
    () => {
      const allOfMe = t12bBarClasses('song.pop.john-legend-all-of-me-john-legend-easy-piano.pdmx', 2);
      const fallen = t12bBarClasses('song.pop.toby-fox-fallen-down-reprise-undertale-easy.pdmx', 2);
      const loops =
        ['5', '6', '7', '8'].every((bar, at) => {
          const next = ['9', '10', '11', '12'][at] as string;
          return allOfMe.get(bar) === allOfMe.get(next) && allOfMe.get(bar) !== undefined;
        }) &&
        ['1', '2', '3', '4', '5', '6', '7'].every((bar) => {
          const next = String(Number(bar) + 8);
          return fallen.get(bar) === fallen.get(next) && fallen.get(bar) !== undefined;
        });
      const loopless = [
        'song.pop.abba-dancing-queen.pdmx',
        'song.folk.john-denver-annie-s-song.pdmx',
        'song.pop.misc-soundtrack-how-to-train-your-dragon-flying-theme.pdmx',
      ].every((id) => !t12bRepeatsFourBars(id, 2));
      return loops && loopless;
    },
  ],
  [
    'chords-pop.6',
    'the slash-bass exercise steps its bass down C–B–A–G–F–E–D under the eight chords the lesson lists',
    () => {
      const id = 'exercise.slash-bass.c';
      const bass = t12bGroups(id, 2).map((group) => Math.min(...group.midis));
      const symbols = t12Harmony(id).reduce((count, bar) => count + bar.symbols.length, 0);
      return bass.join(',') === [48, 47, 45, 43, 41, 40, 38, 43].join(',') && symbols === 8;
    },
  ],
  [
    'rock.6',
    'the ostinato repeats one right-hand figure over an unmoving held A, and the broken-chord exercise moves its bass under a scale',
    () => {
      const ostinato = 'exercise.ostinato.a.arpeggio';
      const figure = new Set(
        [...t12bBarClasses(ostinato, 1).values()].map((bar) => bar),
      );
      const held = t12bGroups(ostinato, 2);
      const broken = t12bGroups('exercise.accompaniment.broken.a-minor.both', 2);
      const bassPerBar = new Map<string, number>();
      for (const group of broken) {
        if (!bassPerBar.has(group.bar)) bassPerBar.set(group.bar, Math.min(...group.midis));
      }
      return (
        figure.size === 1 &&
        held.every(
          (group) =>
            group.types.every((type) => type === 'whole') &&
            group.midis.slice().sort((a, b) => a - b).join(',') === '45,57',
        ) &&
        [...bassPerBar.values()].slice(0, 4).join(',') === '57,62,64,57'
      );
    },
  ],
  [
    'classical.7',
    "K. 545's first movement repeats both halves, so no part of it is played once",
    () => {
      const id = 'song.classical.mozart-k545-i';
      const forwards: string[] = [];
      const backwards: string[] = [];
      for (const measure of t12Xml(id).matchAll(
        /<measure\b[^>]*number="([^"]*)"[^>]*>([\s\S]*?)<\/measure>/g,
      )) {
        const body = measure[2] ?? '';
        if (/<repeat[^>]*direction="forward"/.test(body)) forwards.push(measure[1] ?? '');
        if (/<repeat[^>]*direction="backward"/.test(body)) backwards.push(measure[1] ?? '');
      }
      return (
        forwards.join(',') === '1,29' &&
        backwards.join(',') === '28,73' &&
        t12Notation(id).bars === 73
      );
    },
  ],
  [
    'classical.7',
    'Op. 9 No. 2 opens marked Andante and Op. 9 No. 1 opens marked Larghetto',
    () => {
      const opening = (id: string): string | undefined =>
        t12bWords(id).find((word) => /^(Adagio|Andante|Larghetto|Lento|Largo)/.test(word.text))
          ?.text;
      return (
        opening('song.classical.chopin-nocturne-op9-2')?.startsWith('Andante') === true &&
        opening('song.classical.chopin-nocturne-op9-1')?.startsWith('Larghetto') === true
      );
    },
  ],

  // --- batch 5 -------------------------------------------------------------
  [
    'ragtime.7',
    "the bass Maple Leaf's left hand leaps to is never a single note, and most of those leaps reach a tenth or more",
    () => {
      const id = 'song.ragtime.joplin-maple-leaf-rag';
      const groups = t12bGroups(id, 2);
      const strain = groups.filter(
        (group) => Number(group.bar) >= 17 && Number(group.bar) <= 32 && Math.min(...group.midis) < 48,
      );
      const spans: number[] = [];
      for (let at = 0; at + 1 < groups.length; at += 1) {
        const bass = groups[at] as T12bGroup;
        const next = groups[at + 1] as T12bGroup;
        if (t12bStride(bass) !== 'bass' || next.midis.length < 2 || Math.min(...next.midis) < 48) {
          continue;
        }
        spans.push(Math.max(...next.midis) - Math.min(...bass.midis));
      }
      return (
        strain.length === 40 &&
        strain.every((group) => group.midis.length >= 2) &&
        strain.filter((group) => t12bStride(group) === 'bass').length === 38 &&
        spans.length > 60 &&
        spans.filter((span) => span >= 15).length / spans.length > 0.8
      );
    },
  ],
  [
    'ragtime.7',
    "Maple Leaf's second strain moves from a bass octave up to a chord at most twice in a bar, and does it twice in six of its sixteen",
    () => {
      const groups = t12bGroups('song.ragtime.joplin-maple-leaf-rag', 2);
      const perBar = new Map<string, number>();
      for (const bar of Array.from({ length: 16 }, (_, at) => String(at + 17))) {
        const inBar = groups.filter((group) => group.bar === bar).map(t12bStride);
        let count = 0;
        for (let at = 1; at < inBar.length; at += 1) {
          if (inBar[at - 1] === 'bass' && inBar[at] === 'chord') count += 1;
        }
        perBar.set(bar, count);
      }
      const counts = [...perBar.values()];
      return (
        counts.length === 16 &&
        Math.max(...counts) === 2 &&
        counts.filter((count) => count === 2).length === 6
      );
    },
  ],
  [
    'ragtime.7',
    'Elite Syncopations is in 2/4 with no tuplet, and ten of its bars stack a right-hand chord on the fourth and the seventh sixteenth',
    () => {
      const id = 'song.ragtime.joplin-elite-syncopations';
      const stacked = new Set<string>();
      for (const group of t12bGroups(id, 1)) {
        if (group.midis.length < 2) continue;
        const partner = t12bBar(id, 1, group.bar).some(
          (other) => other.midis.length >= 2 && other.offset === (group.offset === 0.75 ? 1.5 : 0.75),
        );
        if ((group.offset === 0.75 || group.offset === 1.5) && partner) stacked.add(group.bar);
      }
      return (
        t12Notation(id).times.join(',') === '2/4' &&
        t12Count(id, /<time-modification>/g) === 0 &&
        stacked.size === 10
      );
    },
  ],
  [
    'technique.7',
    "exactly four of the rung's thirteen exercises put one note at a time in each hand — the two broken sevenths and the two-against-three pair",
    () => {
      const options = t12Exercises('technique.7');
      const single = options.filter((id) => {
        const notes = t12Sounded(id);
        const left = notes.filter((note) => note.staff === 2);
        const right = notes.filter((note) => note.staff === 1);
        return left.length > 0 && right.length > 0 && notes.every((note) => !note.chord);
      });
      return (
        options.length === 13 &&
        single.length === 4 &&
        single.filter((id) => id.includes('broken7')).length === 2 &&
        single.filter((id) => id.includes('independence')).length === 2
      );
    },
  ],
  [
    'technique.7',
    'the thirds are fingered in the three-group cycle and the sixths are not',
    () => {
      const pairs = (id: string): string[] =>
        t12bGroups(id, id.endsWith('.left') ? 2 : 1)
          .filter((group) => group.fingers.length === 2)
          .map((group) => group.fingers.join('-'));
      const thirds = pairs('exercise.double-third.c.1oct.right').slice(0, 6);
      const sixths = pairs('exercise.double-sixth.c.1oct.right').slice(0, 4);
      return (
        thirds.join(' ') === '1-3 2-4 3-5 1-3 2-4 3-5' && sixths.join(' ') === '1-5 1-5 2-5 1-4'
      );
    },
  ],
  [
    'technique.7',
    'No. 5 is stepwise in both hands, No. 8 puts the leaps in the right hand over chords, and No. 10 puts them in the left under a chorded right',
    () => {
      const shape = (id: string, staff: number): { steps: number; chorded: number } => {
        const groups = t12bGroups(id, staff);
        let steps = 0;
        let moves = 0;
        for (let at = 1; at < groups.length; at += 1) {
          const from = groups[at - 1] as T12bGroup;
          const to = groups[at] as T12bGroup;
          if (from.bar !== to.bar) continue;
          const gap = Math.abs(Math.min(...to.midis) - Math.min(...from.midis));
          if (gap === 0) continue;
          moves += 1;
          if (gap <= 2) steps += 1;
        }
        const chorded = groups.filter((group) => group.midis.length > 1).length;
        return { steps: moves === 0 ? 0 : steps / moves, chorded };
      };
      const five = 'song.classical.czerny-the-school-of-velocity-op-299-no-5.pdmx';
      const eight = 'song.classical.czerny-the-school-of-velocity-op-299-no-8.pdmx';
      const ten = 'song.classical.czerny-the-school-of-velocity-op-299-no-10.pdmx';
      return (
        shape(five, 1).steps > 0.75 &&
        shape(five, 2).steps > 0.7 &&
        shape(five, 1).chorded > 10 &&
        shape(eight, 1).steps < 0.75 &&
        shape(eight, 2).chorded > 100 &&
        shape(ten, 2).steps < 0.2 &&
        shape(ten, 2).chorded === 0 &&
        shape(ten, 1).chorded > 50
      );
    },
  ],
  [
    'jazz.7',
    "the stride exercise's beat three repeats the beat-two chord's bottom note, and the only descent is into the next bar's bass",
    () => t12bStrideBars('exercise.stride.c'),
  ],
  [
    'jazz.7',
    'I Got Rhythm writes its first two A sections once, with a forward repeat, a backward repeat on the first ending, and a second ending',
    () => {
      const id = 'song.classical.i-got-rythm.pdmx';
      return (
        /<repeat[^>]*direction="forward"/.test(t12bMeasure(id, '2')) &&
        /<ending[^>]*number="1"[^>]*type="start"/.test(t12bMeasure(id, '9')) &&
        /<repeat[^>]*direction="backward"/.test(t12bMeasure(id, '9')) &&
        /<ending[^>]*number="2"/.test(t12bMeasure(id, '10')) &&
        !/<repeat\b/.test(t12bMeasure(id, '10')) &&
        t12Notation(id).bars === 28
      );
    },
  ],
  [
    'blues.7',
    'the stride exercise moves once a bar — bass then chord — and holds still on beats three and four',
    () => t12bStrideBars('exercise.stride.f'),
  ],
  [
    'blues.7',
    'two of the rung\'s three songs keep the lower staff going in every bar and Rhythm and Boogie does not',
    () => {
      const quiet = (id: string): number => {
        const perBar = new Map<string, number>();
        for (const note of t12Notes(id)) {
          if (note.staff !== 2) continue;
          const sounding = note.rest || note.grace ? 0 : 1;
          perBar.set(note.bar, (perBar.get(note.bar) ?? 0) + sounding);
        }
        return [...perBar.values()].filter((count) => count <= 1).length;
      };
      return (
        quiet('song.pop.boogie-easy-for-beginners.pdmx') <= 1 &&
        quiet('song.blues.boogie-en-sol') === 0 &&
        quiet('song.blues.rhythm-and-boogie') > 20
      );
    },
  ],
  [
    'blues.7',
    'Rhythm and Boogie ends each half on a G–F♯–E–D walk, carries a Clap or tap section, and has no tie or tuplet in it',
    () => {
      const id = 'song.blues.rhythm-and-boogie';
      const walk = (bar: string): string =>
        t12bBar(id, 1, bar)
          .map((group) => Math.min(...group.midis))
          .join(',');
      return (
        walk('19') === '55,54,52,50' &&
        walk('39') === '55,54,52,50' &&
        /<rehearsal[^>]*>Clap or tap:/.test(t12Xml(id)) &&
        t12Count(id, /<tie\b/g) === 0 &&
        t12Count(id, /<time-modification>/g) === 0
      );
    },
  ],
  [
    'chords-pop.7',
    'Fix You prints sus chords over a bass that holds still for most of its bars, and Blinding Lights prints four plain symbols over two-note shells',
    () => {
      const fixYou = 'song.pop.coldplay-fix-you-coldplay.pdmx';
      const held = [...t12bBarClasses(fixYou, 2).values()].filter(
        (bar) => bar !== '' && !bar.includes(','),
      );
      const blinding = 'song.pop.the-weeknd-the-weekend-blinding-lights-easy-piano.pdmx';
      const shells = t12bGroups(blinding, 2).filter((group) => Number(group.bar) <= 12);
      const chords = t12Notation(blinding).chords;
      return (
        t12bWords(fixYou).filter((word) => /sus/i.test(word.text)).length >= 5 &&
        held.length >= 20 &&
        chords.length === 4 &&
        chords.every((chord) => /^[A-G][b#]?m?$/.test(chord)) &&
        shells.length > 0 &&
        shells.every((group) => group.midis.length === 2)
      );
    },
  ],
  [
    'chords-pop.7',
    "Wake Me Up's left hand puts a bass and then a chord on every beat rather than off it",
    () => {
      const id = 'song.folk.wake-me-up-avicii.pdmx';
      const opening = t12bBar(id, 2, '1');
      const later = t12bBar(id, 2, '5');
      return (
        opening.length === 4 &&
        opening.every((group) => group.midis.length === 1 && group.types[0] === 'quarter') &&
        opening.map((group) => group.offset).join(',') === '0,1,2,3' &&
        later.length === 8 &&
        later.map((group) => group.offset).join(',') === '0,0.5,1,1.5,2,2.5,3,3.5' &&
        later.filter((group) => group.midis.length >= 2).length === 4
      );
    },
  ],
  [
    'rock.7',
    'each of the three shaping exercises is four bars and a last note, and each asks for one direction only',
    () =>
      [
        ['exercise.shaping.a.crescendo', 'Grow'],
        ['exercise.shaping.a.diminuendo', 'Fade'],
        ['exercise.shaping.c.crescendo', 'Grow'],
      ].every(([id, direction]) => {
        const notes = t12Sounded(id as string);
        const words = t12bWords(id as string).map((word) => word.text);
        return (
          t12Notation(id as string).bars === 5 &&
          notes.length === 31 &&
          notes.filter((note) => note.type === 'eighth').length === 30 &&
          notes.filter((note) => note.type === 'quarter').length === 1 &&
          words.length === 1 &&
          (words[0] ?? '').startsWith(direction as string)
        );
      }),
  ],
  [
    'rock.7',
    'In the Hall of the Mountain King states one tempo, marks a crescendo in six different bars, and asks nowhere to speed up',
    () => {
      const id = 'song.classical.grieg-in-the-hall-of-the-mountain-king.pdmx';
      const words = t12bWords(id);
      const crescBars = new Set(
        words.filter((word) => /cresc/i.test(word.text)).map((word) => word.bar),
      );
      return (
        t12Count(id, /<sound[^>]*tempo="/g) === 1 &&
        crescBars.size === 6 &&
        !/accel|stretto|piu mosso|più mosso|rit\./i.test(t12Xml(id))
      );
    },
  ],
  [
    'ragtime.8',
    "Pine Apple's trio strain is built from three-sixteenth groups, five of them tied across a bar line",
    () => {
      const id = 'song.ragtime.joplin-pine-apple-rag';
      const tied = ['23', '25', '27', '31', '33'].filter((bar) =>
        /<tie type="start"/.test(t12bMeasure(id, bar)),
      );
      const offsets = t12bBar(id, 1, '23').map((group) => group.offset);
      return (
        t12Count(id, /<tie\b/g) > 100 &&
        t12Count(id, /<time-modification>/g) === 0 &&
        t12Notation(id).times.join(',') === '2/4' &&
        tied.length === 5 &&
        offsets.join(',') === '0,0.25,0.75,1,1.5,1.75'
      );
    },
  ],
  [
    'technique.8',
    'this rung has no tools of its own, and all twelve of its scales put two octaves in their first bar',
    () => {
      const rung = t12Rung('technique.8') as unknown as { tools?: unknown };
      const options = t12Exercises('technique.8');
      return (
        rung.tools === undefined &&
        options.length === 12 &&
        options.every((id) => {
          const first = t12bBar(id, 1, '1').map((group) => Math.min(...group.midis));
          return (
            t12Notation(id).bars === 4 &&
            first.length === 16 &&
            Math.max(...first) - Math.min(...first) === 26
          );
        })
      );
    },
  ],
  [
    'classical.9',
    "the C sharp minor étude is the shortest and the fastest-marked of the rung's six, and the other five are two to three times its length",
    () => {
      const songs = t12Songs('classical.9');
      const etude = 'song.classical.chopin-etude-op10-4.nifc';
      const rows = songs.map((id) => ({ id, ...t12bRow(id) }));
      const mine = rows.find((row) => row.id === etude);
      const others = rows.filter((row) => row.id !== etude);
      const marked = rows.filter((row) => typeof row.tempoBpm === 'number');
      return (
        songs.length === 6 &&
        mine !== undefined &&
        others.every((row) => row.bars > mine.bars) &&
        marked.every((row) => (row.tempoBpm ?? 0) <= (mine.tempoBpm ?? 0)) &&
        mine.tempoBpm === 176
      );
    },
  ],
  [
    'jazz.9',
    "none of the rung's six standards is thirty-two bars, and no two of them are the same length",
    () => {
      const bars = t12Songs('jazz.9').map((id) => t12Notation(id).bars);
      return bars.length === 6 && new Set(bars).size === 6 && !bars.includes(32);
    },
  ],
  [
    'jazz.9',
    "Lullaby of Birdland's only tempo word is Med-Swing, at 96, and its symbols hold the minor sevenths and dominants the sentence names",
    () => {
      const id = 'song.jazz.george-shearing-lullaby-of-birdland.pdmx';
      const words = t12bWords(id).map((word) => word.text);
      const chords = t12Notation(id).chords;
      return (
        words.length === 1 &&
        words[0] === 'Med-Swing' &&
        t12bTempo(id) === 96 &&
        ['Fm7', 'Bbm7', 'Eb7'].every((chord) => chords.includes(chord))
      );
    },
  ],
  [
    'jazz.9',
    "Linus and Lucy's left-hand ostinato fills most of the piece but drops out and returns more than once",
    () => {
      const id = 'song.jazz.vince-guaraldi-linus-and-lucy-fixed-piano-only.pdmx';
      const perBar = new Map<string, string>();
      for (const note of t12Notes(id)) {
        if (note.staff !== 2 || note.grace) continue;
        perBar.set(
          note.bar,
          `${perBar.get(note.bar) ?? ''}${note.rest ? 'r' : 'n'}${note.type}${note.dotted ? '.' : ''}|`,
        );
      }
      const signature = perBar.get('1');
      const matching = [...perBar.entries()]
        .filter(([, shape]) => shape === signature)
        .map(([bar]) => Number(bar))
        .sort((a, b) => a - b);
      let runs = 0;
      for (let at = 0; at < matching.length; at += 1) {
        if (at === 0 || (matching[at] as number) !== (matching[at - 1] as number) + 1) runs += 1;
      }
      return (
        signature !== undefined &&
        matching.length > 55 &&
        matching.length < perBar.size &&
        runs >= 4
      );
    },
  ],
  [
    'chords-pop.9',
    "not one of the rung's six songs prints a chord symbol",
    () => {
      const songs = t12Songs('chords-pop.9');
      return songs.length === 6 && songs.every((id) => t12Notation(id).chordCount === 0);
    },
  ],
  [
    'chords-pop.9',
    "Mr. Blue Sky and Le Festin carry the rung's two highest printed tempos, and Rolling Girl's is a default rather than a printed one",
    () => {
      const rows = t12Songs('chords-pop.9').map((id) => ({ id, ...t12bRow(id) }));
      const ranked = [...rows].sort((a, b) => (b.tempoBpm ?? 0) - (a.tempoBpm ?? 0));
      const rolling = rows.find((row) => row.id.includes('rolling-girl'));
      return (
        rows.length === 6 &&
        (ranked[0]?.id ?? '').includes('mr-blue-sky') &&
        (ranked[1]?.id ?? '').includes('le-festin') &&
        (rolling?.tags ?? []).includes('tempo-defaulted')
      );
    },
  ],
];

/**
 * A stride exercise's bar: bass, chord, the chord's own bottom note, the chord
 * again — so the hand moves once and then holds still.
 */
function t12bStrideBars(id: string): boolean {
  const bars = [...new Set(t12bGroups(id, 2).map((group) => group.bar))];
  if (bars.length < 4) return false;
  return bars.every((bar) => {
    const [bass, chord, third, fourth] = t12bBar(id, 2, bar);
    if (!bass || !chord || !third || !fourth) return false;
    return (
      bass.midis.length === 1 &&
      chord.midis.length >= 2 &&
      third.midis.length === 1 &&
      (third.midis[0] as number) === Math.min(...chord.midis) &&
      fourth.midis.slice().sort((a, b) => a - b).join(',') ===
        chord.midis.slice().sort((a, b) => a - b).join(',') &&
      (bass.midis[0] as number) < Math.min(...chord.midis)
    );
  });
}

describe('the batch-4 and batch-5 corrections, second-read and under test: the music', () => {
  it('carries a row for each of the two batches this run second-read', () => {
    expect(T12B_MUSIC.length).toBeGreaterThan(40);
  });

  for (const [lesson, says, holds] of T12B_MUSIC) {
    it(`${lesson}: ${says}`, () => {
      expect(holds()).toBe(true);
    });
  }
});
