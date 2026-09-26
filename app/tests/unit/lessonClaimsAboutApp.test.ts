// @vitest-environment node
/**
 * A lesson may not say a thing about the *app* that the app does not do.
 *
 * `lessonClaimsAboutMusic.test.ts` does this for the music — the key, the
 * metre, whether the chords are printed. This is the other half, and it is the
 * half the 2026-09-19 audit found broken in two hundred places: lessons that
 * described a feature the code half-had, because somebody wrote the sentence
 * and somebody else wrote the screen and nothing joined them.
 *
 * On 2026-09-21 the owner's answer was to **build the features and let the
 * lessons teach them again** (`docs/pending-review.md`, Entry 24). Every
 * sentence put back that day has a row here, so that the next edit to either
 * side breaks loudly instead of quietly.
 *
 * **How claims are written**, and why it is deliberately tedious: the same
 * reason the music file gives. A lesson states a claim in prose that no test
 * can parse; so the checkable ones are declared here beside the lesson they
 * come from, and adding a sentence about the app means adding a row.
 *
 * **Three sources, on purpose.** The *built* content under `public/content` is
 * what the app loads; the *source* under `app/src` is what it does; and the
 * *authored* curriculum under `content/curriculum` is what the owner wrote. A
 * row that only read one of them would be checking a copy against itself.
 *
 * The `tools` rows read the authored stage files rather than the built
 * curriculum, and that is not a shortcut: a rung's buttons are something the
 * owner writes, the build copies them, and `curriculumIntegrity.test.ts`
 * already checks that the copy matches. Reading the build here would make
 * every one of these rows a claim about whether somebody had run `build.py`
 * since the last edit — which is a true thing to want to know and is not what
 * this file is for.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  LAB_PRESETS,
  labBedFor,
  labHelp,
  labPreset,
  labProgression,
  type LabBed,
  type LabHelpLine,
} from '../../src/engine/sightReading';
import { drillFromCatalog } from '../../src/engine/drills/fromCatalog';
import { masteryCriteriaFor } from '../../src/curriculum/selectors';
import { DEFAULT_MASTERY } from '../../src/engine/Scoring';
import { nextRecommended, readingMovesFrom, readingOffer } from '../../src/curriculum/session';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import { hasChordSymbols } from '../../src/ui/openItem';
import type { CatalogItem, Curriculum, Lesson, LessonTool } from '../../src/curriculum/types';

const CONTENT = join(process.cwd(), 'public', 'content');

const AUTHORED = resolve('..', 'content', 'curriculum');

const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const curriculum = JSON.parse(readFileSync(join(CONTENT, 'curriculum.json'), 'utf8')) as Curriculum;
const byId = new Map(catalog.map((row) => [row.id, row]));

/** The stage files as the owner wrote them, before the build copies them. */
const authored: Curriculum = {
  version: 1,
  tracks: [],
  stages: readdirSync(AUTHORED)
    .filter((name) => /^stage-\d+\.json$/.test(name))
    .sort()
    .flatMap(
      (name) =>
        (JSON.parse(readFileSync(join(AUTHORED, name), 'utf8')) as Curriculum).stages ?? [],
    ),
};

function find(where: Curriculum, id: string): Lesson | undefined {
  for (const stage of where.stages) {
    for (const unit of stage.units) {
      for (const lesson of unit.lessons) if (lesson.id === id) return lesson;
    }
  }
  return undefined;
}

function rung(id: string): Lesson {
  const found = find(curriculum, id);
  if (!found) throw new Error(`no rung ${id}`);
  return found;
}

/** The rung as authored, for the fields the build only copies. */
function written(id: string): Lesson {
  const found = find(authored, id);
  if (!found) throw new Error(`no authored rung ${id}`);
  return found;
}

function item(id: string): CatalogItem {
  const row = byId.get(id);
  if (!row) throw new Error(`no catalog row ${id}`);
  return row;
}

function source(path: string): string {
  return readFileSync(resolve('src', path), 'utf8');
}

/** The line the lab prints under one of its controls (`04` §3c's table). */
function labHelpLine(id: LabHelpLine['id']): string {
  return labHelp(id);
}

/** The drill params of a catalog row, whatever they are. */
function params(id: string): Record<string, unknown> {
  return item(id).drill?.params ?? {};
}

/** The first prompt a row's drill produces, seeded so it is the same every run. */
function firstPrompt(id: string): { label: string; expected: number[] } {
  const drill = drillFromCatalog(item(id), { seed: 5 });
  const prompt = drill?.next();
  if (!prompt) throw new Error(`${id} produced no prompt`);
  return { label: prompt.label, expected: prompt.expected };
}

/** A rung's lab entries, whole. */
function labEntries(id: string): LessonTool[] {
  return (written(id).tools ?? []).filter((tool) => tool.kind === 'lab');
}

/** A rung's lab tools: the preset each button opens, `null` for a free one. */
function labTools(id: string): (string | null)[] {
  return labEntries(id).map((tool) => tool.preset ?? null);
}

/** Which pickers this rung's lab button hands back to the learner. */
function freedBy(id: string): string[] {
  const entry = labEntries(id)[0];
  return entry ? [...(entry.unlock ?? [])] : [];
}

/**
 * Which way round a rung's own lab button opens on, or `undefined`.
 *
 * The tool's own `mode` first and the preset's default second, which is the
 * order `labBedFor` applies (T16 item 5): a preset is shared between rungs and
 * the rung is the more specific answer.
 */
function bedOf(id: string): LabBed | undefined {
  for (const tool of labEntries(id)) {
    const preset = tool.preset ? (labPreset(tool.preset) ?? null) : null;
    const bed = labBedFor(preset, tool.mode);
    if (bed !== 'off' || tool.mode === 'off') return bed;
  }
  return undefined;
}

/** `[lesson, the sentence in words, the test]` */
const CLAIMS: [string, string, () => boolean][] = [
  // --- per-rung pass thresholds (item 1) ---------------------------------
  [
    '1.4',
    'this rung asks for a tempo of its own, and the scorer uses it',
    () =>
      masteryCriteriaFor(rung('1.4'), DEFAULT_MASTERY).passTempoPct ===
      rung('1.4').mastery.minTempoPct * 100,
  ],
  [
    '4.4',
    'this rung asks for more accuracy than the app-wide pass',
    () =>
      masteryCriteriaFor(rung('4.4'), DEFAULT_MASTERY).passAccuracy >
      DEFAULT_MASTERY.passAccuracy,
  ],
  [
    '2.5',
    'a rung that asks for 95 % is judged at 95 %, not at 90 %',
    () => masteryCriteriaFor(rung('2.5'), DEFAULT_MASTERY).passAccuracy === 0.95,
  ],

  // --- the technique measures (item 2) ------------------------------------
  [
    'technique.4',
    'the articulation exercises come in pairs, legato and staccato, in C and in D',
    () => {
      const ids = rung('technique.4').exerciseOptions.filter((id) => id.includes('articulation'));
      const kinds = ids.map((id) => String(params(id).articulation));
      return (
        ids.length === 4 &&
        kinds.filter((k) => k === 'legato').length === 2 &&
        kinds.filter((k) => k === 'staccato').length === 2
      );
    },
  ],
  [
    'technique.4',
    'the app measures how long you hold each key here',
    () =>
      rung('technique.4').exerciseOptions.some(
        (id) => item(id).drill?.kind === 'articulation',
      ) && source('engine/Scoring.ts').includes('articulationScore(score.notes'),
  ],
  [
    'technique.5',
    'the exercise states the distance a crescendo has to travel',
    () => {
      const id = rung('technique.5').exerciseOptions.find((x) => item(x).drill?.kind === 'shaping');
      return id !== undefined && typeof params(id).minVelocityRange === 'number';
    },
  ],
  [
    'technique.6',
    'the top note at least 1.4 times the rest — the exercise’s own number',
    () => {
      const id = rung('technique.6').exerciseOptions.find((x) => item(x).drill?.kind === 'voicing');
      return id !== undefined && params(id).topNoteRatio === 1.4;
    },
  ],

  // --- drill settings that are now read (item 3) --------------------------
  [
    '2.1',
    'the hands-together drill has a left hand in it',
    () => {
      const id = 'drill.technique.ht-holds';
      if (params(id).leftHand !== 'hold') return false;
      const held = firstPrompt(id).expected;
      const plain = firstPrompt('drill.technique.five-finger-rh').expected;
      return held.length === plain.length + 1 && held[0] === Math.min(...held);
    },
  ],
  [
    '2.5',
    'the position-shift drill moves the hand up to the fifth and plays it again',
    () => {
      const id = 'drill.technique.position-shifts';
      if (params(id).shifts !== true) return false;
      const shifted = firstPrompt(id).expected;
      const plain = firstPrompt('drill.technique.five-finger-rh').expected;
      const half = plain.length;
      return (
        shifted.length === half * 2 &&
        shifted.slice(half).every((midi, i) => midi - (shifted[i] as number) === 7)
      );
    },
  ],
  [
    'theory.4',
    'melodic dictation plays the two bars its row asks for',
    () =>
      params('drill.ear.melodic-dictation').bars === 2 &&
      firstPrompt('drill.ear.melodic-dictation').expected.length === 8,
  ],
  [
    'improv.4',
    '*Answer the phrase* is drawn from the pentatonic, so every note belongs',
    () => {
      const id = 'drill.improv.call-response';
      if (params(id).scale !== 'pentatonic') return false;
      const pentatonic = new Set([0, 2, 4, 7, 9]);
      return firstPrompt(id).expected.every((midi) => pentatonic.has(((midi % 12) + 12) % 12));
    },
  ],
  [
    'jazz.5',
    'the ii–V–I drill asks for shells: root, third and seventh, no fifth',
    () => {
      const id = 'drill.jazz.ii-v-i-shells';
      if (params(id).voicing !== 'shell') return false;
      const pitches = firstPrompt(id).expected;
      const root = Math.min(...pitches);
      const steps = pitches.map((midi) => midi - root).sort((a, b) => a - b);
      return pitches.length === 3 && !steps.includes(7) && (steps[2] as number) >= 10;
    },
  ],
  [
    'jam',
    'the form tracker shows the twelve bars and what each one is',
    () => params('drill.jam.form-tracker').chartView === true,
  ],

  // --- the dictation card (item 4) ----------------------------------------
  [
    'theory.4',
    'nothing on the card names the notes until the phrase has been answered',
    () => {
      const drill = drillFromCatalog(item('drill.ear.melodic-dictation'), { seed: 5 });
      return drill?.next()?.labelIsAnswer === true;
    },
  ],

  // --- lab presets and the rungs (item 5) ---------------------------------
  [
    '3.3',
    'the lab opens the minor vamp with its chords left to the learner',
    () => labTools('3.3').includes('minor-vamp') && freedBy('3.3').includes('progression'),
  ],
  [
    'improv.4',
    'the lab opens on I–vi–IV–V, the loop drill’s own four chords',
    () => labPreset(labTools('improv.4')[0] ?? '')?.progressionId === 'i-vi-iv-v',
  ],
  [
    'improv.4',
    '…with no right hand from the app, so that part is yours',
    () => labPreset(labTools('improv.4')[0] ?? '')?.rightHand === 'none',
  ],
  [
    'chords-pop.5',
    'the chord picker is open on this rung, so `ii7 V7 I` can be typed in',
    () =>
      labTools('chords-pop.5').includes('ballad') &&
      freedBy('chords-pop.5').includes('progression'),
  ],
  [
    'improv.6',
    'the minor vamp opens here with its chords handed back',
    () => {
      const preset = labPreset(labTools('improv.6')[0] ?? '');
      return (
        preset?.locks.includes('progression') === true &&
        freedBy('improv.6').includes('progression')
      );
    },
  ],
  [
    'chords-pop.8',
    'it opens on I–IV–V–I and leaves both the key and the chords to the learner',
    () => {
      const preset = labPreset(labTools('chords-pop.8')[0] ?? '');
      return (
        preset?.progressionId === 'i-iv-v-i' &&
        !preset.locks.includes('key') &&
        freedBy('chords-pop.8').includes('progression')
      );
    },
  ],
  [
    'improv.8',
    'it opens a ii–V–I with the chords handed back, so an approach chord can be typed in',
    () => {
      const preset = labPreset(labTools('improv.8')[0] ?? '');
      return preset?.progressionId === 'ii-v-i' && freedBy('improv.8').includes('progression');
    },
  ],
  // --- both ways round in the lab (T18) ----------------------------------
  //
  // A rung reaches a way round through the preset its `lab` tool already
  // names, because `curriculum.schema.json` closes a `tools` item to `kind`,
  // `preset`, `item` and `label`. So each row asks the same question of a
  // different rung: does the button this lesson describes open on the way
  // round the sentence promises?
  [
    'blues.9',
    'the lab opens holding the chords, so the harmony is under you',
    () => bedOf('blues.9') === 'hold',
  ],
  [
    'chords-pop.3',
    'the lab plays the harmony and the tune is the learner’s',
    () => bedOf('chords-pop.3') === 'hold',
  ],
  [
    'chords-pop.7',
    'the colours are tried over a bed that is holding the chords',
    () => bedOf('chords-pop.7') === 'hold',
  ],
  [
    'improv.4',
    'the loop holds the chords and the line is the learner’s',
    () => bedOf('improv.4') === 'hold',
  ],
  [
    'jazz.4',
    'the app takes the right hand, so the Charleston has gaps to find',
    () => bedOf('jazz.4') === 'tune',
  ],
  [
    'jazz.5',
    'there is a right hand above the shells rather than silence',
    () => bedOf('jazz.5') === 'tune',
  ],
  [
    'jazz.6',
    'the app takes the right hand and leaves the chords to the learner',
    () => bedOf('jazz.6') === 'tune',
  ],
  // Both rows below said *Play the tune* until T19, and the screen never did
  // it: `LabScreen.bedRefusal` turns that way round down when the preset's
  // right hand is `none`, and `drawBedChips` then stands the chip back to *Bed
  // only*. The ballad and the twelve-bar blues both write no right hand, so
  // the field said one thing and the button opened another — and the old rows
  // passed, because they asked the authored file rather than the rule the
  // screen applies. Both rungs now say `off`, which is what they were getting
  // and, for a rung whose learner is the one comping, what they wanted.
  [
    'chords-pop.9',
    'the ballad hands back its chords and its left hand, and opens with the bed alone because it writes no right hand to hand over',
    () => {
      const freed = freedBy('chords-pop.9');
      return (
        labTools('chords-pop.9').includes('ballad') &&
        freed.includes('progression') &&
        freed.includes('leftHand') &&
        labPreset('ballad')?.rightHand === 'none' &&
        bedOf('chords-pop.9') === 'off'
      );
    },
  ],
  [
    'jam.5',
    'the twelve-bar bed opens on bass and drums alone, because that preset has no right hand to hand over and the chords are the learner\'s',
    () => bedOf('jam.5') === 'off' && labPreset('blues-shuffle')?.rightHand === 'none',
  ],
  [
    '3.2',
    'the app takes the right hand, so the smooth voicing has to be found in time',
    () => bedOf('3.2') === 'tune',
  ],
  [
    'technique.7',
    'Play it as a duet opens the two-against-three exercise, not a Czerny etude',
    () => {
      const tool = (written('technique.7').tools ?? []).find((t) => t.kind === 'duet');
      return (
        tool?.item === 'exercise.independence.c.2v3' &&
        written('technique.7').exerciseOptions.includes('exercise.independence.c.2v3')
      );
    },
  ],

  // --- swing (item 6) -----------------------------------------------------
  [
    'blues.4',
    'two of this rung’s items carry the word, and the rest do not',
    () => {
      const rungIds = [...rung('blues.4').songOptions, ...rung('blues.4').exerciseOptions];
      return rungIds.filter((id) => byId.get(id)?.notation?.swungMark === true).length === 2;
    },
  ],
  [
    'jazz.5',
    'none of this rung’s pieces writes the word',
    () =>
      [...rung('jazz.5').songOptions, ...rung('jazz.5').exerciseOptions].every(
        (id) => byId.get(id)?.notation?.swungMark !== true,
      ),
  ],
  [
    'ragtime.5',
    'ragtime is played straight, and none of this rung’s scores says otherwise',
    () =>
      [...rung('ragtime.5').songOptions, ...rung('ragtime.5').exerciseOptions].every(
        (id) => byId.get(id)?.notation?.swungMark !== true,
      ),
  ],

  // --- the tools a rung has (item 7) --------------------------------------
  [
    'jazz.7',
    '*Accompaniment lab* opens it with nothing fixed',
    () => labTools('jazz.7').includes(null),
  ],
  [
    'theory.7',
    '*Accompaniment lab* opens it with nothing fixed',
    () => labTools('theory.7').includes(null),
  ],
  [
    'holiday.5',
    'the Ladder is a control the learner turns on, not a button this rung carries',
    () => {
      // `04` §3d: the ladder tool is for the scale and Hanon rungs, where the
      // whole item is the loop. This rung is repertoire, so the lesson sends
      // the learner to the Score screen's own two rows instead of drawing a
      // button that would loop a forty-bar carol end to end.
      const tools = written('holiday.5').tools ?? [];
      return !tools.some((tool) => tool.kind === 'ladder');
    },
  ],
  [
    'holiday.5',
    '*Loop* is a score-screen control, and double-tapping the sheet marks the bars',
    () => source('ui/screens/ScoreScreen.ts').includes('Double-tap the sheet to mark them'),
  ],
  [
    'holiday.5',
    '*Ladder* raises the tempo after a clean pass and drops it after a pass with a mistake',
    () =>
      source('ui/screens/ScoreScreen.ts').includes(
        'Each clean pass of the loop speeds up a notch; a pass with a mistake in it slows down one.',
      ),
  ],
  [
    'holiday.6',
    '*Perform* is one pass with no restarts and no loop, kept as a performance',
    () =>
      source('ui/screens/ScoreScreen.ts').includes(
        'One pass, start to finish: no restarts, no loop, and it is kept as a performance rather than practice.',
      ),
  ],
  [
    'holiday.6',
    '*Play it blind* hides the notation and keeps following you',
    () =>
      (written('holiday.6').tools ?? []).some((tool) => tool.kind === 'blind') &&
      source('ui/screens/LessonScreen.ts').includes("'Play it blind'") &&
      source('ui/screens/ScoreScreen.ts').includes(
        'Hides the notation so you play from memory. The app still follows you',
      ),
  ],
  [
    'holiday.7',
    '*Perform* is one pass, start to finish, with no restarts and no loop',
    () =>
      source('ui/screens/ScoreScreen.ts').includes(
        'One pass, start to finish: no restarts, no loop, and it is kept as a performance rather than practice.',
      ),
  ],
  [
    'holiday.7',
    '*Hands* chooses which hand the app waits for',
    () => source('ui/screens/ScoreScreen.ts').includes('Which hand the app waits for'),
  ],
  [
    'holiday.7',
    'the rotation and four-to-a-note studies are left-hand exercises',
    () =>
      item('exercise.rotation.c.left').hands === 'left' &&
      item('exercise.repeated-notes.c.4x.left').hands === 'left',
  ],
  [
    'hymns.4',
    '*Play it as a duet* opens Amazing Grace in four parts, not whichever song comes first',
    () =>
      (written('hymns.4').tools ?? []).some(
        (tool) => tool.kind === 'duet' && tool.item === 'song.folk.amazing-grace-satb.pdmx',
      ) && rung('hymns.4').songOptions.includes('song.folk.amazing-grace-satb.pdmx'),
  ],
  [
    'hymns.4',
    '…and gives you the right-hand staff while the app plays the other one',
    () =>
      source('ui/screens/LessonScreen.ts').includes("'Play it as a duet'") &&
      /'Play it as a duet',[\s\S]{0,160}?hands: 'R'/.test(source('ui/screens/LessonScreen.ts')),
  ],
  [
    'hymns.4',
    'the *Duet* row plays the hand you are not on',
    () =>
      source('ui/screens/ScoreScreen.ts').includes('`Duet: the app plays ${played}`') &&
      source('data/settingsStore.ts').includes("playbackHands: 'non-focused'"),
  ],
  [
    'hymns.4',
    '*Hands* on the score screen chooses which hand the app waits for',
    () => source('ui/screens/ScoreScreen.ts').includes('Which hand the app waits for'),
  ],
  [
    'hymns.5',
    '*Free play* prints the chord once three or more notes are down',
    () =>
      (written('hymns.5').tools ?? []).some((tool) => tool.kind === 'play') &&
      source('ui/screens/LessonScreen.ts').includes("'Free play'") &&
      source('ui/screens/FreePlayScreen.ts').includes(
        'three or more of them are named as a chord',
      ),
  ],
  [
    'hymns.6',
    '*Accompaniment lab* opens the ballad bed',
    () => labTools('hymns.6').includes('ballad'),
  ],
  [
    'hymns.6',
    '…four chords with a broken-chord left hand and no right hand at all',
    () => {
      const preset = labPreset('ballad');
      if (!preset) return false;
      return (
        preset.leftHand === 'broken' &&
        preset.rightHand === 'none' &&
        labProgression(preset.progressionId).major.length === 4
      );
    },
  ],
  [
    'hymns.6',
    '…in whatever key you pick: the preset does not lock the key',
    () => !(labPreset('ballad')?.locks ?? []).includes('key'),
  ],
  [
    'hymns.6',
    '*Perform* is one pass, start to finish, with no restarts and no loop',
    () =>
      source('ui/screens/ScoreScreen.ts').includes(
        'One pass, start to finish: no restarts, no loop, and it is kept as a performance rather than practice.',
      ),
  ],

  [
    'latin.6',
    'the Ladder is a control the learner turns on, not a button this rung carries',
    () => !(written('latin.6').tools ?? []).some((tool) => tool.kind === 'ladder'),
  ],
  [
    'latin.6',
    '*Loop* takes the bars you mark, and double-tapping the sheet marks them',
    () => source('ui/screens/ScoreScreen.ts').includes('Double-tap the sheet to mark them'),
  ],
  [
    'latin.6',
    '*Ladder* raises the tempo after a clean pass and drops it after a pass with a mistake',
    () =>
      source('ui/screens/ScoreScreen.ts').includes(
        'Each clean pass of the loop speeds up a notch; a pass with a mistake in it slows down one.',
      ),
  ],
  [
    'latin.6',
    'La Cumparsita part A is on the rung below, and part B is the one offered here',
    () =>
      rung('latin').songOptions.includes(
        'song.classical.tango-la-cumparsita-piano-solo-tutorial-parte-a.pdmx',
      ) &&
      rung('latin.6').songOptions.includes(
        'song.classical.tango-la-cumparsita-piano-solo-tutorial-parte-b.pdmx',
      ),
  ],
  [
    'latin.7',
    '*Perform* is one pass, start to finish, with no restarts and no loop',
    () =>
      source('ui/screens/ScoreScreen.ts').includes(
        'One pass, start to finish: no restarts, no loop, and it is kept as a performance rather than practice.',
      ),
  ],
  [
    'latin.7',
    '*Hands* chooses which hand the app waits for',
    () => source('ui/screens/ScoreScreen.ts').includes('Which hand the app waits for'),
  ],
  [
    'latin.7',
    'the rotation and octave studies are left-hand, the four-to-a-note one right-hand',
    () =>
      item('exercise.rotation.g.left').hands === 'left' &&
      item('exercise.octave-scale.d.1oct.left').hands === 'left' &&
      item('exercise.repeated-notes.g.4x.right').hands === 'right',
  ],

  // --- the chord chart (item 8) -------------------------------------------
  [
    'jam',
    'tap *Chart* beside a song on this page',
    () =>
      rung('jam').songOptions.some((id) => {
        const row = byId.get(id);
        return row !== undefined && hasChordSymbols(row);
      }),
  ],

  // --- the placement starts the plan (item 9) -----------------------------
  [
    '0.4',
    'your plan begins at the placed unit from then on',
    () => {
      const first = nextRecommended(curriculum, [], [])?.lesson.id;
      const placed = nextRecommended(curriculum, [], [], { startAt: '3.2' })?.lesson.id;
      return first !== placed && placed === '3.2';
    },
  ],

  // --- the names on the screen (item 10) ----------------------------------
  [
    '1.2',
    'the mode this lesson names is the one the Score screen shows',
    () => source('ui/screens/ScoreScreen.ts').includes("label: 'Keep tempo'"),
  ],
  [
    'technique.8',
    '…and so is the other one',
    () => source('ui/screens/ScoreScreen.ts').includes("label: 'Wait for me'"),
  ],
];

describe('a lesson says only what the app does', () => {
  it('has a row for each sentence put back on 2026-09-21', () => {
    // A floor, not a count of today's rows: the number grows as lessons are
    // restored, and a test that pinned it would fail on the next one.
    expect(CLAIMS.length).toBeGreaterThan(20);
    // Every one of the ten items in the build either has a row here or has a
    // not-built line in Entry 24; these are the lessons the rows cover.
    const lessons = new Set(CLAIMS.map(([lesson]) => lesson));
    expect(lessons.size).toBeGreaterThan(15);
  });

  for (const [lesson, says, holds] of CLAIMS) {
    it(`${lesson}: ${says}`, () => {
      expect(holds()).toBe(true);
    });
  }
});

describe('the presets a lesson may point at', () => {
  it('names only presets the lab has, and the free lab has no preset', () => {
    const known = new Set(LAB_PRESETS.map((preset) => preset.id));
    const wrong: string[] = [];
    for (const stage of authored.stages) {
      for (const unit of stage.units) {
        for (const lesson of unit.lessons) {
          for (const tool of lesson.tools ?? []) {
            if (tool.kind !== 'lab' || tool.preset === undefined) continue;
            if (!known.has(tool.preset)) wrong.push(`${lesson.id} → ${tool.preset}`);
          }
        }
      }
    }
    expect(wrong, `rungs pointing at a preset the lab does not have: ${wrong.join(', ')}`).toEqual(
      [],
    );
  });

  it('gives a rung with two lab buttons two different things to open', () => {
    // The whole point of the second button: a preset that locks the control
    // the lesson teaches, beside one that locks nothing. Two buttons opening
    // the same screen with the same locks would be the repetition `00` §1
    // forbids.
    const wrong: string[] = [];
    for (const stage of authored.stages) {
      for (const unit of stage.units) {
        for (const lesson of unit.lessons) {
          const labs = (lesson.tools ?? []).filter((tool) => tool.kind === 'lab');
          if (labs.length < 2) continue;
          const presets = labs.map((tool) => tool.preset ?? '');
          if (new Set(presets).size !== presets.length) wrong.push(lesson.id);
        }
      }
    }
    expect(wrong, `rungs with two identical lab buttons: ${wrong.join(', ')}`).toEqual([]);
  });

  it('never frees a picker the rung own preset does not lock', () => {
    // The same rule `validate.py`'s `tool_errors` applies, asked here against
    // the real `LAB_PRESETS` rather than against the Python's copy of the
    // locks - so a preset whose locks move in the TypeScript and not in the
    // Python is caught by whichever of the two runs first.
    const wrong: string[] = [];
    for (const stage of authored.stages) {
      for (const unit of stage.units) {
        for (const lesson of unit.lessons) {
          for (const tool of lesson.tools ?? []) {
            if (tool.kind !== 'lab' || !tool.unlock) continue;
            const locks: readonly string[] = tool.preset
              ? (labPreset(tool.preset)?.locks ?? [])
              : [];
            for (const name of tool.unlock) {
              if (!locks.includes(name)) wrong.push(`${lesson.id}: ${name}`);
            }
          }
        }
      }
    }
    expect(wrong, `unlocks naming a picker the preset leaves free: ${wrong.join(', ')}`).toEqual(
      [],
    );
  });
});

/**
 * The three rungs T14's last run built — `jazz.3`, `jam.7` and `ragtime.9`.
 *
 * A block of their own for the reason the music file's matching block gives:
 * the rows and the lesson they came from are easier to read together than
 * scattered through a table of ninety.
 *
 * Two of the three name **no mode at all**, and that is checked here rather
 * than merely described. `jazz.3` wants *Rhythm only* and *Tempo*, which are
 * score-screen controls with no address a rung can point at, so its lesson
 * names them in prose and the rung carries no tools — the shape Entry 31 and
 * Entry 36 settled for `holiday.5`, `holiday.7`, `latin.6` and `latin.7`.
 */
const T14_APP_CLAIMS: [string, string, () => boolean][] = [
  [
    'jazz.3',
    'Rhythm only judges your timing and not your notes, one tap per written note or chord',
    () =>
      source('ui/screens/GuideScreen.ts').includes(
        'judges your timing and not your notes: one tap per written note or chord, on any key at all',
      ) && source('ui/screens/ScoreScreen.ts').includes("'Rhythm only'"),
  ],
  [
    'jazz.3',
    '…and Tempo is the other control it asks for',
    () => source('ui/screens/ScoreScreen.ts').includes("openStashedSheet('Tempo'"),
  ],
  [
    'jazz.3',
    'Answer the phrase plays two bars from a five-note scale',
    () => params('drill.improv.call-response').bars === 2
      && params('drill.improv.call-response').scale === 'pentatonic',
  ],
  [
    'jazz.3',
    '…and wants them back note for note, which is imitation and not invention',
    () => {
      const factory = source('engine/drills/factories.ts');
      return factory.includes('labelIsAnswer: true') && factory.includes('ordered: true');
    },
  ],
  [
    'jazz.3',
    'no button on this rung opens anything',
    () => (written('jazz.3').tools ?? []).length === 0,
  ],

  [
    'ragtime.9',
    'Play it blind hides the notation, and the app still follows you and still marks what you play',
    () =>
      source('ui/screens/ScoreScreen.ts').includes(
        'Hides the notation so you play from memory. The app still follows you and still marks what you play.',
      ),
  ],
  [
    'ragtime.9',
    '…and that is what the button on the lesson page says',
    () => source('ui/screens/LessonScreen.ts').includes("make('Play it blind'"),
  ],
  [
    'ragtime.9',
    'Perform is one pass start to finish, no restarts and no loop, kept as a performance rather than practice',
    () =>
      source('ui/screens/ScoreScreen.ts').includes(
        'One pass, start to finish: no restarts, no loop, and it is kept as a performance rather than practice.',
      ),
  ],
  [
    'ragtime.9',
    'the rung carries the blind mode and nothing else',
    () => {
      const tools = written('ragtime.9').tools ?? [];
      return tools.length === 1 && tools[0]?.kind === 'blind';
    },
  ],

  [
    'jam.7',
    'the lab preset this rung opens is called Blues — twelve bars',
    () => labPreset('blues-shuffle')?.label === 'Blues — twelve bars',
  ],
  ['jam.7', '…and it is the one the rung points at', () => {
    const tools = labTools('jam.7');
    return tools.length === 1 && tools[0] === 'blues-shuffle';
  }],
  [
    'jam.7',
    'Jam it is what starts it, and Trading fours is a setting on it',
    () => {
      // It was its own chip group until 2026-09-22 and is now two chips in the
      // *What the app plays* row, which is the same claim: a setting on the
      // button, not a button of its own. The words are still on the screen,
      // because seven lesson sentences tell the learner to *set Trading fours*
      // by name — so what is checked is the chip the lesson points at and the
      // help line the row prints, not the call that used to draw the label.
      const lab = source('ui/screens/LabScreen.ts');
      return (
        lab.includes("'Jam it'")
        && lab.includes("'What the app plays'")
        && lab.includes('Trade ${String(count)} bars each')
        && labHelpLine('plays').includes('Trading fours')
      );
    },
  ],
  [
    'jam.7',
    '…and 2 bars each is one of the two choices it offers',
    () => source('ui/screens/LabScreen.ts').includes('TRADE_BAR_CHOICES = [2, 4]'),
  ],
  [
    'jam.7',
    'it says whether you came in inside your own bars',
    () => source('ui/screens/LabScreen.ts').includes("'In on your own bars'"),
  ],
  [
    'jam.7',
    '…and counts your notes against the blues scale, because this preset plays the twelve-bar form',
    () =>
      labPreset('blues-shuffle')?.progressionId === 'blues'
      && source('engine/tradingFours.ts').includes(
        "return progressionId === 'blues' ? 'blues' : mode;",
      ),
  ],
  [
    'jam.7',
    'nothing there is recorded and nothing can be passed or failed',
    () => source('ui/screens/LabScreen.ts').includes('nothing here can be passed or failed'),
  ],
  [
    'jam.7',
    'every option on this rung gets a Chart beside it',
    () => {
      const drawn = source('ui/screens/LessonScreen.ts').includes("button('Chart'");
      const rows = (written('jam.7').songOptions ?? []).map((id) => item(id));
      return drawn && rows.length === 5 && rows.every((row) => hasChordSymbols(row));
    },
  ],
];

describe('the three rungs T14 built last say only what the app does', () => {
  it('has a row for every sentence those lessons make about the app', () => {
    const lessons = new Set(T14_APP_CLAIMS.map(([lesson]) => lesson));
    expect(lessons.size).toBe(3);
  });

  for (const [lesson, says, holds] of T14_APP_CLAIMS) {
    it(`${lesson}: ${says}`, () => {
      expect(holds()).toBe(true);
    });
  }
});

/**
 * T12: the 2026-09-19 lesson corrections, second-read on 2026-09-22 and put
 * under test — the app half.
 *
 * Each `it` here is named by the `Row:` line written under a
 * `Second read (2026-09-22): …` verdict in `docs/lesson-audit/batch-1.md`,
 * `batch-2.md` or `batch-3.md`. The block exists for the reason the file's
 * header gives: 236 sentences were corrected and nothing read any of them, so
 * the next edit to a rung, a preset or a constant would have taken them apart
 * silently. Three of them had already come apart that way by the time this run
 * read them — `2.1`, `2.5` and `theory.4` describe drills that T10 rebuilt and
 * their lessons were never re-edited — which is the argument for the rows more
 * than any sentence in this comment is.
 *
 * **What a row may assert.** `00-invariants` §2 forbids asserting a number
 * *measured on this machine*; a constant the code declares is a different
 * thing, and the brief says so in as many words. So a row may say the ladder's
 * notch is ten, and reads it from `PracticeEngine` rather than repeating it.
 */

/** How many cards a catalog drill deals, counted by dealing them. */
function t12PromptCount(id: string): number {
  const drill = drillFromCatalog(item(id), { seed: 5 });
  if (!drill) throw new Error(`${id} builds no drill`);
  let count = 0;
  while (drill.next() !== null && count < 200) count += 1;
  return count;
}

/** A file anywhere in the repository, for the rows about the build tools. */
function t12Repo(path: string): string {
  return readFileSync(resolve('..', path), 'utf8');
}

/** Every rung in the authored curriculum, in stage order. */
function t12Walk(): { stage: number; track: string; lesson: Lesson }[] {
  const out: { stage: number; track: string; lesson: Lesson }[] = [];
  for (const stage of authored.stages) {
    for (const unit of stage.units) {
      for (const lesson of unit.lessons) {
        out.push({ stage: stage.number, track: unit.track, lesson });
      }
    }
  }
  return out;
}

/** The core track's rung ids, in order — several rows count along it. */
function t12Core(): string[] {
  return t12Walk()
    .filter((row) => row.track === 'core')
    .map((row) => row.lesson.id);
}

/** Every rung that offers an item, by id. */
function t12RungsOffering(match: (id: string) => boolean): string[] {
  return t12Walk()
    .filter((row) =>
      [...(row.lesson.songOptions ?? []), ...(row.lesson.exerciseOptions ?? [])].some(match),
    )
    .map((row) => row.lesson.id);
}

/** The catalog ids that match a test — for the "it is in the Library" rows. */
function t12CatalogIds(match: (id: string) => boolean): string[] {
  return catalog.map((row) => row.id).filter(match);
}

/** The rung's own pass, and the authored fraction it came from. */
function t12Pass(id: string): { accuracy: number; tempo: number; written: number } {
  const criteria = masteryCriteriaFor(rung(id), DEFAULT_MASTERY);
  return {
    accuracy: criteria.passAccuracy,
    tempo: criteria.passTempoPct,
    written: rung(id).mastery.minTempoPct,
  };
}

/** Every drill kind the record declares, taken off `STAFF_POLICY`. */
const T12_ALL_KINDS = Object.keys(STAFF_POLICY) as DrillKind[];

/** `[lesson, the claim in the words of its `Row:` line, the test]` */
const T12_APP: [string, string, () => boolean][] = [
  // --- batch 1 -------------------------------------------------------------
  [
    '0.2',
    'a missed find-key card is held for the two-second pause, not the 450 ms one',
    () =>
      REVEALABLE_KINDS.has('find-key') &&
      feedbackDelayMs('find-key', false) === MISS_PAUSE_MS &&
      feedbackDelayMs('rhythm', false) === FEEDBACK_MS,
  ],
  ['0.2', 'the find-key drill serves ten cards a set', () => t12PromptCount('drill.reading.find-key') === 10],
  [
    '0.3',
    'the two modes this lesson names are what the mode picker calls them',
    () => {
      const screen = source('ui/screens/ScoreScreen.ts');
      return (
        screen.includes("label: 'Wait for me'") &&
        screen.includes("label: 'Keep tempo'") &&
        !screen.includes("label: 'Tempo mode'")
      );
    },
  ],
  [
    '0.3',
    'the metronome is off until it is switched on, and it lives on a ⋯ row',
    () => {
      const screen = source('ui/screens/ScoreScreen.ts');
      return (
        screen.includes('let metronomeOn = false') &&
        screen.includes("menuRow('Metronome'") &&
        source('score/ScoreSession.ts').includes('run.metronome === true')
      );
    },
  ],
  // Replaced 2026-09-25 (T37). The row said "a Wait for me run is scored and
  // can pass, the same as a Keep tempo one", and it was true of the code: a
  // Wait run passed on the tempo slider's value, a tempo nobody played to. The
  // lesson now says what the app measures — both modes score the notes, only
  // Keep tempo measures tempo, so a pass is played in Keep tempo — and this row
  // holds the app to that sentence.
  [
    '0.3',
    'both modes score the notes, and only a Keep tempo run measures tempo and can pass',
    () => {
      const outcome = (mode: string) =>
        evaluateOutcome({ mode, accuracy: 0.95, tempoPct: 85 } as unknown as Parameters<
          typeof evaluateOutcome
        >[0]);
      return (
        !outcome('wait').passed &&
        !outcome('wait').tempoMeasured &&
        outcome('tempo').passed &&
        outcome('tempo').tempoMeasured &&
        !outcome('listen').passed &&
        !outcome('free').passed
      );
    },
  ],
  // Replaced 2026-09-25 (T37). The row said "the second day only has to be a
  // pass" and read `row.passedOn.length >= 2` out of the store's source, which
  // is the store granting mastery on one master-standard run plus any earlier
  // pass. Part G and now the lesson say the master standard on two different
  // days; the store keeps those days apart (`masteredOn`) and
  // `progressStore.test.ts` drives it.
  [
    '0.3',
    'mastery is 97 % at full tempo, on two different days',
    () =>
      DEFAULT_MASTERY.masterAccuracy === 0.97 &&
      DEFAULT_MASTERY.masterTempoPct === 100 &&
      /export const MASTER_DAYS = 2;/.test(source('data/progressStore.ts')) &&
      !source('data/progressStore.ts').includes('row.passedOn.length >= 2'),
  ],
  [
    '0.3',
    'Duet is on out of the box, so choosing a hand does not silence the other',
    () => DEFAULT_SETTINGS.playbackHands === 'non-focused',
  ],
  [
    '0.3',
    'most drill kinds hold a missed card for the long pause, and a few do not',
    () => {
      const long = T12_ALL_KINDS.filter((kind) => feedbackDelayMs(kind, false) === MISS_PAUSE_MS);
      const drawn = T12_ALL_KINDS.filter(
        (kind) => REVEALABLE_KINDS.has(kind) || STAFF_POLICY[kind] === 'after-answer',
      );
      const short = T12_ALL_KINDS.filter((kind) => !drawn.includes(kind));
      return (
        long.length > short.length &&
        short.length > 0 &&
        ['rhythm', 'dynamics', 'transposition', 'pedal', 'backing-track', 'simon'].every((kind) =>
          short.includes(kind as DrillKind),
        )
      );
    },
  ],
  [
    '0.4',
    "the placement test's items are in the order the lesson prints, chords fourth and the scale seventh",
    () => {
      const items = params('drill.placement.stage-0').items as { text: string }[] | undefined;
      return (
        items !== undefined &&
        items.length === 8 &&
        /I–IV–V in G/.test(items[3]?.text ?? '') &&
        /C major scale/.test(items[6]?.text ?? '')
      );
    },
  ],
  [
    '0.4',
    'a placement start holds the rungs behind it back and gives them back when nothing is left in front',
    () => {
      const plain = nextRecommended(curriculum, [], [], {});
      const placed = nextRecommended(curriculum, [], [], { startAt: '3.1' });
      const core = t12Core();
      return (
        plain !== undefined &&
        placed !== undefined &&
        placed.lesson.id === '3.1' &&
        core.indexOf(plain.lesson.id) < core.indexOf('3.1')
      );
    },
  ],
  [
    '1.1',
    "this rung's own pass is the 90 % and 80 % the lesson quotes",
    () => {
      const pass = t12Pass('1.1');
      return pass.accuracy === 0.9 && pass.tempo === pass.written * 100 && pass.tempo === 80;
    },
  ],
  [
    '1.2',
    'nothing on this rung asks for a held-length measure, so the lesson is right that the app does not score it',
    () => {
      const options = [...rung('1.2').songOptions, ...rung('1.2').exerciseOptions];
      return (
        options.length > 0 && options.every((id) => item(id).drill?.kind !== 'articulation')
      );
    },
  ],
  [
    '1.3',
    "this rung's own pass is the 90 % and 80 % the lesson quotes",
    () => {
      const pass = t12Pass('1.3');
      return pass.accuracy === 0.9 && pass.tempo === pass.written * 100 && pass.tempo === 80;
    },
  ],
  [
    '1.4',
    'the left-hand sight-reading drill is on this rung and the treble one is on the next',
    () => {
      const left = t12RungsOffering((id) => id === 'drill.reading.sight-reading-1-left');
      const treble = t12RungsOffering((id) => id === 'drill.reading.sight-reading-1');
      const core = t12Core();
      return (
        left.includes('1.4') &&
        treble.length === 1 &&
        treble[0] === '1.5' &&
        core.indexOf('1.5') === core.indexOf('1.4') + 1
      );
    },
  ],
  [
    '1.4',
    'this rung asks for 85 % of tempo, which is what its lesson now quotes',
    () => {
      const pass = t12Pass('1.4');
      return pass.tempo === pass.written * 100 && pass.tempo !== DEFAULT_MASTERY.passTempoPct;
    },
  ],
  [
    'practice.1',
    'the rhythm drill this rung offers is not a card drill, so it gets no going-over',
    () => {
      const drills = rung('practice.1').exerciseOptions.filter((id) => id.startsWith('drill.'));
      return (
        drills.length === 1 &&
        drills[0] === 'drill.rhythm.mixed-values' &&
        !(drillFromCatalog(item('drill.rhythm.mixed-values'), { seed: 5 }) instanceof PromptDrill) &&
        drillFromCatalog(item('drill.reading.find-key'), { seed: 5 }) instanceof PromptDrill
      );
    },
  ],
  [
    'practice.2',
    'the Ladder moves one notch a pass and stops at the written tempo unless the learner set it higher',
    () => {
      const step = (tempoPct: number, clean: boolean, startedAtPct = 100): number =>
        nextLadderTempo({ enabled: true, tempoPct, startedAtPct, clean });
      return (
        step(70, true) === 70 + LADDER_NOTCH_PCT &&
        step(70, false) === 70 - LADDER_NOTCH_PCT &&
        step(LADDER_CEILING_PCT, true) === LADDER_CEILING_PCT &&
        step(120, true, 120) === 120
      );
    },
  ],
  [
    '2.1',
    'the hands-together drill puts a low C under the walk and asks for it to be held',
    () => {
      const held = firstPrompt('drill.technique.ht-holds');
      const plain = firstPrompt('drill.technique.five-finger-rh');
      return (
        params('drill.technique.ht-holds').leftHand === 'hold' &&
        held.expected.length === plain.expected.length + 1 &&
        held.expected[0] === (plain.expected[0] as number) - 12 &&
        /hold the low/i.test(
          drillFromCatalog(item('drill.technique.ht-holds'), { seed: 5 })?.promptText ?? '',
        )
      );
    },
  ],
  [
    '2.1',
    "the duet button opens the rung's first playable song with the right hand chosen",
    () => {
      const tools = written('2.1').tools ?? [];
      const screen = source('ui/screens/LessonScreen.ts');
      return (
        tools.length === 1 &&
        tools[0]?.kind === 'duet' &&
        screen.includes("make('Play it as a duet'") &&
        // The mode and the hand, and whatever else the call carries: T17-2
        // added `from: rung.id` so Back returns to the rung (`04` §5), and an
        // exact-string match would have read that as the duet breaking. The
        // claim is the mode and the hand; it is not the argument list.
        /navigateScore\(id, \{ mode: 'tempo', hands: 'R'/.test(screen) &&
        screen.includes('setDuetPlayback()')
      );
    },
  ],
  [
    '2.1',
    "this rung's own pass is the 90 % and 80 % the lesson quotes",
    () => {
      const pass = t12Pass('2.1');
      return pass.accuracy === 0.9 && pass.tempo === pass.written * 100 && pass.tempo === 80;
    },
  ],
  [
    '2.2',
    'the sight-reading drill on this rung has eighths in its pool from the first phrase',
    () => {
      const row = params('drill.reading.sight-reading-2-right');
      const phrases = [1, 2, 3, 4, 5, 6].map((seed) =>
        generateSightReading({ level: 2, bars: 4, hands: 'R', seed }),
      );
      return (
        row.level === 2 &&
        row.hands === 'right' &&
        phrases.some((phrase) => /<type>eighth<\/type>/.test(phrase.musicXml))
      );
    },
  ],
  [
    '2.3',
    'the chord drill takes the three notes one at a time as readily as together',
    () => {
      const drill = drillFromCatalog(item('drill.chord.c-f-g'), { seed: 5 });
      const prompt = drill?.next();
      if (!drill || !prompt) return false;
      // One at a time, each a second apart: if the drill were checking that
      // they arrived together this could not pass.
      prompt.expected.forEach((midi, index) => {
        drill.feed({ kind: 'noteOn', midi, velocity: 80, tMs: index * 1000 });
      });
      const answers = drill.result().answers;
      return answers.length === 1 && answers[0]?.correct === true;
    },
  ],
  [
    '2.3',
    'the rolled-chord count is computed and shown on no screen',
    () =>
      source('engine/PracticeEngine.ts').includes('rolledChordSteps') &&
      source('engine/Scoring.ts').includes('rolledChordSteps') &&
      t12ScreenSources().every((text) => !text.includes('rolledChord')),
  ],
  [
    '2.3',
    "the chord drill is ten cards, so the rung's twenty changes is two sets",
    () => t12PromptCount('drill.chord.c-f-g') === 10,
  ],
  [
    '2.5',
    'the position-shift drill walks the home position and then the same walk from the fifth',
    () => {
      const shifted = firstPrompt('drill.technique.position-shifts').expected;
      const plain = firstPrompt('drill.technique.five-finger-rh').expected;
      const half = plain.length;
      return (
        params('drill.technique.position-shifts').shifts === true &&
        shifted.length === half * 2 &&
        shifted.slice(half).every((midi, index) => midi - (shifted[index] as number) === 7)
      );
    },
  ],
  [
    '2.5',
    'Ode to Joy in G is on the very next core rung, and this rung already carries a G setting',
    () => {
      const core = t12Core();
      const inG = t12RungsOffering((id) => id === 'song.classical.ode-to-joy.g');
      return (
        inG.includes('3.1') &&
        core.indexOf('3.1') === core.indexOf('2.5') + 1 &&
        rung('2.5').songOptions.includes('song.classical.beethoven-ode-to-joy.easy')
      );
    },
  ],
  [
    '2.5',
    'the right-hand sight-reading drill was last seen three core rungs ago',
    () => {
      const on = t12RungsOffering((id) => id === 'drill.reading.sight-reading-2-right');
      const core = t12Core();
      return (
        on.length === 2 &&
        on.includes('2.2') &&
        on.includes('2.5') &&
        core.indexOf('2.5') - core.indexOf('2.2') === 3
      );
    },
  ],
  [
    'hymns.2',
    'the symbol-flash drill draws minors and sevenths, and no card times out',
    () => {
      const drill = drillFromCatalog(item('drill.chord.symbol-flash'), { seed: 5 });
      const labels: string[] = [];
      let next = drill?.next() ?? null;
      while (next !== null && labels.length < 40) {
        labels.push(next.label);
        next = drill?.next() ?? null;
      }
      const source_ = source('engine/drills/PromptDrill.ts');
      return (
        labels.length > 0 &&
        labels.some((label) => /m(?!aj)/.test(label)) &&
        labels.some((label) => /7/.test(label)) &&
        !source_.includes('setTimeout') &&
        !source_.includes('timeout')
      );
    },
  ],
  [
    '3.1',
    'only the right-hand G and F scales are on this rung, and the left-hand ones are in the catalog',
    () => {
      const scales = rung('3.1').exerciseOptions.filter((id) => id.includes('exercise.scale.'));
      return (
        scales.length === 2 &&
        scales.every((id) => id.endsWith('.similar.right.2')) &&
        ['g-major', 'f-major'].every((key) =>
          t12CatalogIds((id) => id === `exercise.scale.${key}.1oct.similar.left.2`).length === 1,
        )
      );
    },
  ],

  // --- batch 2 -------------------------------------------------------------
  [
    '3.2',
    'the rung has one root-position cadence, in G, three smooth ones, and a drill over all three keys',
    () => {
      const cadences = rung('3.2').exerciseOptions.filter((id) => id.includes('exercise.cadence.'));
      const root = cadences.filter((id) => id.endsWith('.root'));
      const drill = params('drill.chord.primary-c-g-f');
      return (
        root.length === 1 &&
        root[0] === 'exercise.cadence.g.root' &&
        cadences.filter((id) => id.endsWith('.voice-led')).length === 3 &&
        JSON.stringify(drill.keys) === JSON.stringify(['C', 'G', 'F']) &&
        JSON.stringify(drill.degrees) === JSON.stringify(['I', 'IV', 'V7'])
      );
    },
  ],
  [
    '3.2',
    'the lab preset this rung opens plays a plain V where the rung teaches V7',
    () => {
      const preset = labPreset(labTools('3.2')[0] ?? '');
      return (
        preset?.id === 'primary-chords' &&
        labProgression(preset.progressionId).major.includes('V') &&
        !labProgression(preset.progressionId).major.includes('V7')
      );
    },
  ],
  [
    '3.3',
    "the rung's only A harmonic minor scale is the hands-together one",
    () => {
      const scales = rung('3.3').exerciseOptions.filter((id) => id.includes('a-harmonic-minor'));
      return (
        scales.length === 1 &&
        scales[0] === 'exercise.scale.a-harmonic-minor.1oct.similar.both.2' &&
        t12CatalogIds((id) => id.startsWith('exercise.scale.a-harmonic-minor.1oct')).length === 4
      );
    },
  ],
  [
    '3.3',
    'the lab opens the minor vamp in A minor with the key locked and the chord picker freed',
    () => {
      const entry = labEntries('3.3')[0];
      const preset = labPreset(entry?.preset ?? '');
      const locked = labLocksFor(preset, entry?.unlock);
      return (
        preset?.id === 'minor-vamp' &&
        preset.keyId === 'a-minor' &&
        locked.has('key') &&
        !locked.has('progression')
      );
    },
  ],
  // Deleted (C4): "the daily read is the right-hand level-2 phrase at Stage 3
  // and the two-hand one at Stage 4". It re-implemented the stage rule (the
  // hardest reading row with `item.level <= stageNumber`) instead of calling
  // the app, and C4 retires that rule: the daily read comes from the reader.
  // Its lesson sentence was rewritten with it; this row is the new sentence's.
  [
    '3.4',
    'the daily read starts from this rung’s two-hand phrase, and what it can move here is its key or how far it ranges',
    () => {
      const position = nextRecommended(curriculum, [], ['core'], { startAt: '3.4' });
      const offer = readingOffer({ curriculum, items: catalog, position, activeTracks: ['core'], rows: [], today: new Date(2026, 9, 1), purpose: 'daily' });
      // The moves whose demands the curriculum has taught by 3.4 (the
      // vocabulary's `taughtAt`, in the curriculum's own order).
      const order = curriculum.stages.flatMap((stage) => stage.units.flatMap((unit) => unit.lessons.map((lesson) => lesson.id)));
      const taught = (demand: string): boolean => {
        const rung = VOCABULARY_V0.demands.find((d) => d.id === demand)?.taughtAt;
        return rung !== null && rung !== undefined && order.indexOf(rung) <= order.indexOf('3.4');
      };
      const moves = readingMovesFrom(item('drill.reading.sight-reading-2'), { row: 'drill.reading.sight-reading-2' }).filter(
        (move) => move.direction === 'down' || move.demands.every(taught),
      );
      return (
        offer?.item.id === 'drill.reading.sight-reading-2' &&
        item(offer.item.id).hands === 'both' &&
        JSON.stringify(offer.recipe) === JSON.stringify({ row: 'drill.reading.sight-reading-2' }) &&
        moves.length > 0 &&
        moves.every((move) => move.dimension === 'key' || move.dimension === 'range')
      );
    },
  ],
  [
    '3.4',
    'the level-2 phrase spans middle C to the C above and no further',
    () => {
      const melodies = [1, 2, 3, 4, 5, 6, 7, 8].flatMap(
        (seed) => generateSightReading({ level: 2, bars: 4, hands: 'R', seed }).melody,
      );
      return (
        melodies.length > 0 && melodies.every((midi) => midi >= 60 && midi <= 72)
      );
    },
  ],
  [
    '3.6',
    'exactly one accompaniment exercise on this rung is hands together, and it is the broken one in A minor',
    () => {
      const both = rung('3.6')
        .exerciseOptions.filter((id) => id.includes('exercise.accompaniment.'))
        .filter((id) => id.endsWith('.both'));
      return both.length === 1 && both[0] === 'exercise.accompaniment.broken.a-minor.both';
    },
  ],
  [
    '3.6',
    "the lab's Broken left hand is the Alberti order in quarters, not root–third–fifth–third",
    () => {
      const chord = { roman: 'I', label: 'C', pitchClasses: [0, 4, 7] };
      const bar = (leftHand: 'alberti' | 'broken'): string[] =>
        [
          ...buildLabExercise({
            title: 'row',
            fifths: 0,
            harmony: [chord],
            leftHand,
            rightHand: 'none',
            seed: 1,
          }).musicXml.matchAll(/<note\b[\s\S]*?<\/note>/g),
        ]
          .map((found) => found[0] ?? '')
          .filter((note) => /<staff>2<\/staff>/.test(note) && !note.includes('<rest'))
          .map(
            (note) =>
              `${/<step>([A-G])<\/step>/.exec(note)?.[1] ?? '?'}${
                /<octave>(-?\d+)<\/octave>/.exec(note)?.[1] ?? '?'
              }/${/<type[^>]*>(\w+)<\/type>/.exec(note)?.[1] ?? '?'}`,
          );
      const alberti = bar('alberti');
      const broken = bar('broken');
      return (
        alberti.length === 8 &&
        broken.length === 4 &&
        alberti.every((note) => note.endsWith('/eighth')) &&
        broken.every((note) => note.endsWith('/quarter')) &&
        broken.map((note) => note.split('/')[0]).join(' ') ===
          alberti
            .slice(0, 4)
            .map((note) => note.split('/')[0])
            .join(' ')
      );
    },
  ],
  [
    '3.6',
    'the lab offers six left hands and no waltz, and writes 4/4',
    () => {
      const screen = source('ui/screens/LabScreen.ts');
      const block = /const LEFT_HANDS[\s\S]*?\n\];/.exec(screen)?.[0] ?? '';
      const written_ = buildLabExercise({
        title: 'row',
        fifths: 0,
        harmony: [{ roman: 'I', label: 'C', pitchClasses: [0, 4, 7] }],
        leftHand: 'chord',
        rightHand: 'none',
        seed: 1,
      }).musicXml;
      return (
        [...block.matchAll(/value: '/g)].length === 6 &&
        !/waltz/i.test(block) &&
        !/timeSig/.test(screen) &&
        /<beats>4<\/beats>/.test(written_) &&
        /<beat-type>4<\/beat-type>/.test(written_)
      );
    },
  ],
  [
    'chords-pop.3',
    'the primary-chords preset fixes the chords and the left hand and leaves the key free',
    () => {
      const preset = labPreset('primary-chords');
      return (
        preset !== null &&
        preset.locks.length === 2 &&
        preset.locks.includes('progression') &&
        preset.locks.includes('leftHand') &&
        LAB_LOCKS.filter((lock) => !preset.locks.includes(lock)).includes('key')
      );
    },
  ],
  [
    'blues.3',
    'the rung carries two tool buttons, the lab and Simon, and Rhythm only is not one of them',
    () => {
      const tools = written('blues.3').tools ?? [];
      return (
        tools.length === 2 &&
        tools.some((tool) => tool.kind === 'lab' && tool.preset === 'blues-shuffle') &&
        tools.some((tool) => tool.kind === 'simon') &&
        source('ui/screens/ScoreScreen.ts').includes("menuRow(\n    'Rhythm only'")
      );
    },
  ],
  [
    'theory.3',
    'the cadence ear drill first appears on the next theory rung, at Stage 4',
    () => {
      const on = t12Walk().filter((row) =>
        (row.lesson.exerciseOptions ?? []).includes('drill.ear.cadences'),
      );
      const theory = t12Walk()
        .filter((row) => row.lesson.id.startsWith('theory.'))
        .map((row) => row.lesson.id);
      return (
        on.length > 0 &&
        on.every((row) => row.stage >= 4) &&
        on.some((row) => row.lesson.id === 'theory.4') &&
        theory.indexOf('theory.4') === theory.indexOf('theory.3') + 1
      );
    },
  ],
  [
    'theory.3',
    'a Simon chain of eight is what counts as having got it, five is only the pass',
    () => SIMON_MASTER_CHAIN === 8 && SIMON_PASS_CHAIN === 5 && SIMON_MASTER_CHAIN > SIMON_PASS_CHAIN,
  ],
  [
    'improv.3',
    "the loop is this rung's own backing-track drill, four bars of C then two each of F and G at 72",
    () => {
      const row = params('drill.improv.loop-i-iv-v');
      return (
        rung('improv.3').exerciseOptions.includes('drill.improv.loop-i-iv-v') &&
        (written('improv.3').tools ?? []).length === 0 &&
        JSON.stringify(row.progression) === JSON.stringify(['C', 'C', 'C', 'C', 'F', 'F', 'G', 'G']) &&
        row.bpm === 72
      );
    },
  ],
  [
    'hymns',
    // Rewritten 2026-09-23. This row used to pin the *fault*: the filter drew
    // `el('option', { value: track, text: track })`, so it offered
    // `hymns-gospel` where the Plan screen's Tracks sheet offered *Hymns &
    // gospel* — two names for one thing and an internal id on a screen
    // (`00-invariants` §1; Entry 45 item 5). The filter reads the curriculum's
    // own title now, so the claim is the other way up. The lesson never quoted
    // a label and still does not; it names songs, and the second half of this
    // row is what it depends on.
    'the Library’s track filter prints the track’s title, and the hymn settings the lesson names are on that track',
    () =>
      source('ui/screens/LibraryScreen.ts').includes('trackTitles.get(track) ?? track') &&
      !source('ui/screens/LibraryScreen.ts').includes("el('option', { value: track, text: track })") &&
      ['song.folk.be-thou-my-vision.pdmx', 'song.folk.anonymous-swing-low-sweet-chariot.pdmx'].every(
        (id) => item(id).tracks.includes('hymns-gospel'),
      ),
  ],
  [
    '4.1',
    'four keys similar over two octaves, C alone in contrary, and the missing ones exist in the catalog',
    () => {
      const options = rung('4.1').exerciseOptions;
      const similar = options.filter((id) => id.includes('.2oct.similar.both.'));
      const contrary = options.filter((id) => id.includes('.contrary.'));
      return (
        similar.length === 4 &&
        ['c-major', 'g-major', 'd-major', 'a-major'].every((key) =>
          similar.some((id) => id.includes(key)),
        ) &&
        contrary.every((id) => id.includes('c-major')) &&
        ['g-major', 'd-major', 'a-major'].every(
          (key) => t12CatalogIds((id) => id === `exercise.scale.${key}.2oct.contrary.both.2`).length === 1,
        )
      );
    },
  ],
  [
    '4.2',
    'one contrary scale on the rung, the rest in the catalog, and no contrary melodic minor anywhere',
    () => {
      const contrary = rung('4.2').exerciseOptions.filter((id) => id.includes('.contrary.'));
      const all = t12CatalogIds((id) => id.startsWith('exercise.scale.') && id.includes('.contrary.'));
      return (
        contrary.length === 1 &&
        contrary[0] === 'exercise.scale.a-harmonic-minor.1oct.contrary.both.2' &&
        ['f-major', 'b-flat-major', 'e-flat-major', 'd-harmonic-minor', 'e-harmonic-minor'].every(
          (key) => all.some((id) => id.includes(key)),
        ) &&
        all.every((id) => !id.includes('melodic'))
      );
    },
  ],
  [
    '4.3',
    'the inversion drill deals ten cards and nothing times them',
    () =>
      t12PromptCount('drill.chord.inversions') === 10 &&
      !/timeLimit|deadline|limitMs|secondsPer|timeoutMs/.test(source('engine/drills/PromptDrill.ts')),
  ],
  [
    '4.4',
    'Hanon 1–5 are on the rung and 6–10 exist in the catalog for the Library to find',
    () => {
      const options = rung('4.4').exerciseOptions;
      return (
        options.length === 5 &&
        ['01', '02', '03', '04', '05'].every((number) =>
          options.includes(`exercise.hanon.${number}.both`),
        ) &&
        ['06', '07', '08', '09', '10'].every(
          (number) => t12CatalogIds((id) => id === `exercise.hanon.${number}.both`).length === 1,
        )
      );
    },
  ],
  [
    '4.5',
    'the blues track starts at Stage 3 and its first rung already carries the shuffle',
    () => {
      const tracks = JSON.parse(t12Repo('content/curriculum/00-tracks.json')) as
        | { tracks?: { id: string; startsAtStage: number }[] }
        | { id: string; startsAtStage: number }[];
      const list = Array.isArray(tracks) ? tracks : (tracks.tracks ?? []);
      const blues = list.find((track) => track.id === 'blues-boogie');
      const first = t12Walk().find((row) => row.lesson.id === 'blues.3');
      return (
        blues?.startsAtStage === 3 &&
        first?.stage === 3 &&
        (first.lesson.exerciseOptions ?? []).includes('exercise.rhythm.shuffle-eighths.4bar')
      );
    },
  ],
  [
    '4.5',
    'Rhythm only judges one tap per written note or chord, on any key',
    () => source('ui/screens/ScoreScreen.ts').includes('One tap per written note or chord'),
  ],

  // --- batch 3 -------------------------------------------------------------
  [
    '4.6',
    'this is the second-to-last core rung and 4.7 is the last',
    () => {
      const core = t12Core();
      return core[core.length - 1] === '4.7' && core[core.length - 2] === '4.6';
    },
  ],
  [
    '4.6',
    "the rung's one tool is Play it blind and it opens a piece with the notation hidden",
    () => {
      const tools = written('4.6').tools ?? [];
      const screen = source('ui/screens/LessonScreen.ts');
      return (
        tools.length === 1 &&
        tools[0]?.kind === 'blind' &&
        screen.includes("make('Play it blind'") &&
        // The blind flag, and whatever else the call carries: T17-2 added
        // `from: rung.id` so Back returns to the rung (`04` §5).
        /navigateScore\(id, \{ blind: true/.test(screen)
      );
    },
  ],
  [
    '4.6',
    'Perform removes the restart and the loop and does not change the practice mode',
    () => {
      const screen = source('ui/screens/ScoreScreen.ts');
      const lines = screen.split('\n').filter((line) => line.includes('performanceRun'));
      return (
        screen.includes(
          'One pass, start to finish: no restarts, no loop, and it is kept as a performance rather than practice.',
        ) &&
        lines.length > 4 &&
        lines.every((line) => !/(^|[^.\w])mode\s*=[^=]/.test(line))
      );
    },
  ],
  [
    '4.6',
    'one Für Elise setting is on the rung and the beginner one is only in the catalog',
    () => {
      const onRung = rung('4.6').songOptions.filter((id) => id.includes('fur-elise'));
      return (
        onRung.length === 1 &&
        onRung[0] === 'song.classical.beethoven-fur-elise.easy' &&
        t12CatalogIds((id) => id === 'song.classical.beethoven-fur-elise.beginner').length === 1
      );
    },
  ],
  [
    '4.7',
    'Blind is an unconditional toggle with no prior pass required',
    () => {
      const screen = source('ui/screens/ScoreScreen.ts');
      const toggle = /const blindToggle = button\([\s\S]*?\);/.exec(screen)?.[0] ?? '';
      return (
        toggle.includes('blind: !blind') &&
        !/passed|progress|record/i.test(toggle)
      );
    },
  ],
  [
    '4.7',
    'blind hides the score and the cursor and leaves the count-in and the beat dot',
    () => {
      const css = t12Repo('app/src/style.css');
      const shown = /\.score-stage--blind \.score-countin,[\s\S]*?\{/.exec(css)?.[0] ?? '';
      return (
        css.includes('.score-stage--blind {\n  visibility: hidden;\n}') &&
        css.includes('.score-stage--blind .score-buffer') &&
        shown.includes('.score-countin') &&
        shown.includes('.score-beat') &&
        !shown.includes('.score-cursor')
      );
    },
  ],
  [
    '4.7',
    "the rung's blind rule is a string nothing measures, and completion is one pass",
    () => {
      const mastery = rung('4.7').mastery;
      return (
        mastery.songsRequired === 1 &&
        typeof mastery.custom === 'string' &&
        demandsMeasuredAccuracy(rung('4.7')) &&
        source('curriculum/selectors.ts').includes('/[<>]=?\\s*\\d/.test(custom)')
      );
    },
  ],
  [
    'classical.4.shelf',
    'four Chopin préludes and one Chopin waltz are on the shelf',
    () => {
      const shelf = rung('classical.4.shelf').songOptions;
      return (
        shelf.filter((id) => id.includes('chopin-prelude')).length === 4 &&
        shelf.filter((id) => id.includes('chopin-waltz')).length === 1
      );
    },
  ],
  [
    'classical.4.shelf',
    'the three pieces named as Stage 8 are at level 8 and the easy nocturne is not',
    () =>
      ['song.classical.chopin-nocturne-20.alt', 'song.classical.chopin-waltz-op64-2', 'song.classical.schubert-liszt-standchen'].every(
        (id) => Math.floor(item(id).level) === 8,
      ) && Math.floor(item('song.classical.chopin-nocturne-op9-2.easy').level) === 6,
  ],
  [
    'classical.4.shelf',
    'the Passacaglia on the shelf is a Stage 6 piece, not one of the Stage 8 ones',
    () =>
      Math.floor(item('song.classical.handel-passacaglia-handel-halvorsen-piano-solo.pdmx').level) ===
      6,
  ],
  [
    'classical.4.shelf',
    'every composer the lesson names among the personal-build pieces is on the shelf',
    () => {
      const composers = rung('classical.4.shelf')
        .songOptions.map((id) => (item(id).composer ?? '').toLowerCase())
        .join(' | ');
      return [
        'elgar',
        'puccini',
        'mascagni',
        'holst',
        'mahler',
        'rachmaninoff',
        'einaudi',
        'zimmer',
        'sakamoto',
        'uematsu',
        'djawadi',
        'hurwitz',
        'glass',
        'senneville',
        'clayderman',
      ].every((name) => composers.includes(name));
    },
  ],
  [
    'classical.4.shelf',
    'beyond the named composers, exactly seven non-public-domain rows are left',
    () => {
      const named =
        /elgar|puccini|mascagni|holst|mahler|rachmaninoff|einaudi|zimmer|sakamoto|salamoto|uematsu|djawadi|hurwitz|glass|senneville|clayderman/i;
      const rest = rung('classical.4.shelf')
        .songOptions.map((id) => item(id))
        .filter((row) => row.compositionStatus !== 'pd' && row.compositionStatus !== undefined)
        .filter((row) => !named.test(row.composer ?? ''));
      return rest.length === 7;
    },
  ],
  [
    'classical.4.shelf',
    'the nocturne on the shelf is the alternative edition and its first edition is not on it',
    () => {
      const shelf = rung('classical.4.shelf').songOptions;
      return (
        shelf.includes('song.classical.chopin-nocturne-20.alt') &&
        !shelf.includes('song.classical.chopin-nocturne-20') &&
        t12CatalogIds((id) => id === 'song.classical.chopin-nocturne-20').length === 1
      );
    },
  ],
  [
    'classical.4.shelf',
    "the placeholder's hint says to import your own copy and does not say where to get one",
    () => {
      const importer = t12Repo('tools/content/import_pdmx.py');
      const hint = /IMPORT_HINT = \([\s\S]*?\)\r?\n/.exec(importer)?.[0] ?? '';
      return (
        hint.includes('import your own') &&
        !/buy|shop|publisher|https?:/i.test(hint)
      );
    },
  ],
  [
    'blues.4',
    "the rung's two tools are the blues lab with a locked walking bass and the duet button",
    () => {
      const tools = written('blues.4').tools ?? [];
      const preset = labPreset('blues-shuffle');
      return (
        tools.length === 2 &&
        tools.some((tool) => tool.kind === 'lab' && tool.preset === 'blues-shuffle') &&
        tools.some((tool) => tool.kind === 'duet') &&
        preset?.leftHand === 'walking' &&
        preset.locks.includes('leftHand')
      );
    },
  ],
  [
    'theory.4',
    'the dictation phrase is eight notes and its names are withheld until it is answered',
    () => {
      const prompt = drillFromCatalog(item('drill.ear.melodic-dictation'), { seed: 5 })?.next();
      return (
        params('drill.ear.melodic-dictation').bars === 2 &&
        prompt?.expected.length === 8 &&
        prompt.labelIsAnswer === true
      );
    },
  ],
  [
    'theory.4',
    'the inversion drill prints a slash chord and plays nothing',
    () => {
      const prompt = drillFromCatalog(item('drill.chord.inversions'), { seed: 5 })?.next();
      return (
        /^[A-G][^/]*\/[A-G]/.test(prompt?.label ?? '') &&
        (prompt?.playback === undefined || prompt.playback.length === 0)
      );
    },
  ],
  [
    'improv.4',
    'Answer the phrase draws two bars from the pentatonic and wants them back in order',
    () => {
      const prompt = drillFromCatalog(item('drill.improv.call-response'), { seed: 5 })?.next();
      const pentatonic = new Set([0, 2, 4, 7, 9]);
      return (
        params('drill.improv.call-response').bars === 2 &&
        prompt?.expected.length === 8 &&
        prompt.ordered === true &&
        prompt.expected.every((midi) => pentatonic.has(((midi % 12) + 12) % 12))
      );
    },
  ],
  [
    'improv.4',
    'the lab opens I–vi–IV–V with a broken left hand, no right hand, holding the chords',
    () => {
      const preset = labPreset(labTools('improv.4')[0] ?? '');
      return (
        preset?.progressionId === 'i-vi-iv-v' &&
        preset.leftHand === 'broken' &&
        preset.rightHand === 'none' &&
        bedOf('improv.4') === 'hold'
      );
    },
  ],
  [
    'improv.4',
    'the four-chord loop changes every bar and the I–IV–V loop three times in eight',
    () => {
      const four = params('drill.improv.loop-four-chord').progression as string[] | undefined;
      const three = params('drill.improv.loop-i-iv-v').progression as string[] | undefined;
      const changes = (bars: string[]): number =>
        bars.filter((bar, index) => index > 0 && bar !== bars[index - 1]).length;
      return (
        four !== undefined &&
        three !== undefined &&
        four.length === 4 &&
        changes(four) === 3 &&
        three.length === 8 &&
        changes(three) === 2
      );
    },
  ],
  [
    'jam',
    'the form-tracker row asks for a chart, the drill reads it, and the loop is twelve bars in E',
    () => {
      const row = params('drill.jam.form-tracker');
      const keys = row.keys as string[] | undefined;
      return (
        row.chartView === true &&
        row.form === '12-bar' &&
        keys?.[0] === 'E' &&
        source('engine/drills/fromCatalog.ts').includes('chart: p.chartView === true')
      );
    },
  ],
  [
    'technique.4',
    "the four articulation exercises state their own held-length target and the rung's other nine do not",
    () => {
      const options = rung('technique.4').exerciseOptions;
      const articulation = options.filter((id) => item(id).drill?.kind === 'articulation');
      return (
        options.length === 13 &&
        articulation.length === 4 &&
        articulation.every((id) => {
          const p = params(id);
          return typeof p.heldFractionMin === 'number' || typeof p.heldFractionMax === 'number';
        }) &&
        options
          .filter((id) => !articulation.includes(id))
          .every((id) => item(id).drill?.kind !== 'articulation')
      );
    },
  ],
  [
    'classical.5',
    "the written-out mordent is a Stage 5 rung's and the trill a Stage 6 rung's",
    () => {
      const at = (needle: string): number[] =>
        t12Walk()
          .filter((row) =>
            [...(row.lesson.songOptions ?? []), ...(row.lesson.exerciseOptions ?? [])].some((id) =>
              id.includes(needle),
            ),
          )
          .map((row) => row.stage);
      const mordent = at('mordent');
      const trill = at('trill');
      return (
        mordent.length > 0 &&
        trill.length > 0 &&
        Math.min(...mordent) === 5 &&
        Math.min(...trill) === 6
      );
    },
  ],
  [
    'classical.5',
    'a clean pass takes the ladder up one notch and a pass with a mistake takes it down one',
    () =>
      nextLadderTempo({ enabled: true, tempoPct: 70, startedAtPct: 100, clean: true }) === 80 &&
      nextLadderTempo({ enabled: true, tempoPct: 70, startedAtPct: 100, clean: false }) === 60,
  ],
  [
    'chords-pop.5',
    'the ballad opens with a broken left hand, a free key and the chord picker handed back',
    () => {
      const entry = labEntries('chords-pop.5')[0];
      const preset = labPreset(entry?.preset ?? '');
      const locked = labLocksFor(preset, entry?.unlock);
      return (
        preset?.id === 'ballad' &&
        preset.leftHand === 'broken' &&
        !locked.has('key') &&
        !locked.has('progression') &&
        locked.has('leftHand')
      );
    },
  ],
  [
    'jazz.5',
    'the ii–V–I drill asks for root, third and seventh in the four keys the lesson names',
    () => {
      const row = params('drill.jazz.ii-v-i-shells');
      const pitches = firstPrompt('drill.jazz.ii-v-i-shells').expected;
      const root = Math.min(...pitches);
      const steps = pitches.map((midi) => midi - root).sort((a, b) => a - b);
      return (
        row.voicing === 'shell' &&
        JSON.stringify(row.keys) === JSON.stringify(['C', 'F', 'B-', 'G']) &&
        pitches.length === 3 &&
        !steps.includes(7) &&
        (steps[2] as number) >= 10
      );
    },
  ],
  [
    'jazz.5',
    "the rung's lab is the two-five-one preset, walking bass locked, key free",
    () => {
      const preset = labPreset(labTools('jazz.5')[0] ?? '');
      return (
        preset?.id === 'jazz-comping' &&
        preset.label === 'Jazz — two five one' &&
        preset.leftHand === 'walking' &&
        preset.locks.includes('leftHand') &&
        !preset.locks.includes('key') &&
        JSON.stringify(labProgression(preset.progressionId).major) ===
          JSON.stringify(['ii', 'V7', 'I', 'I'])
      );
    },
  ],
  [
    'ragtime.5',
    "the rung's one tool is the duet button and it opens the waltz-bass Greensleeves",
    () => {
      const tools = written('ragtime.5').tools ?? [];
      return (
        tools.length === 1 &&
        tools[0]?.kind === 'duet' &&
        rung('ragtime.5').songOptions[0] === 'song.folk.greensleeves.waltz' &&
        item('song.folk.greensleeves.waltz').type === 'song'
      );
    },
  ],

  // --- Part A2: the scouts' 40 exercise-title suspects, now repaired --------
  [
    'scout-surfaces',
    'no boogie or stride exercise title names one hand while its row says both',
    () => {
      const rowsOf = catalog.filter(
        (row) => row.id.startsWith('exercise.boogie.') || row.id.startsWith('exercise.stride.'),
      );
      return (
        rowsOf.length === 40 &&
        rowsOf.every((row) => row.hands === 'both') &&
        rowsOf.every((row) => !/left hand|right hand/i.test(row.title))
      );
    },
  ],
];

describe('the 2026-09-19 lesson corrections, second-read and under test: the app', () => {
  it('carries a row for each of the three batches the second read covered', () => {
    expect(T12_APP.length).toBeGreaterThan(50);
  });

  for (const [lesson, says, holds] of T12_APP) {
    it(`${lesson}: ${says}`, () => {
      expect(holds()).toBe(true);
    });
  }
});

/** Every screen's source, for the rows that assert a name reaches no screen. */
function t12ScreenSources(): string[] {
  const dir = resolve('src', 'ui', 'screens');
  return readdirSync(dir)
    .filter((name) => name.endsWith('.ts'))
    .map((name) => readFileSync(join(dir, name), 'utf8'));
}

// Appended with the block above in one edit, so a later run for batches 4 and 5
// can append its own without touching anything here. ES modules hoist their
// imports, so these read exactly as they would at the top of the file.
import { PromptDrill } from '../../src/engine/drills/PromptDrill';
import {
  FEEDBACK_MS,
  MISS_PAUSE_MS,
  REVEALABLE_KINDS,
  feedbackDelayMs,
} from '../../src/engine/drills/feedback';
import { STAFF_POLICY, type DrillKind } from '../../src/engine/drills/types';
import { DEFAULT_SETTINGS } from '../../src/data/settingsStore';
import { evaluateOutcome } from '../../src/engine/Scoring';
import { LADDER_CEILING_PCT, LADDER_NOTCH_PCT, nextLadderTempo } from '../../src/engine/PracticeEngine';
import { SIMON_MASTER_CHAIN, SIMON_PASS_CHAIN } from '../../src/engine/drills/simon';
import { demandsMeasuredAccuracy } from '../../src/curriculum/selectors';
import {
  LAB_LOCKS,
  buildLabExercise,
  generateSightReading,
  labLocksFor,
} from '../../src/engine/sightReading';

/**
 * T12, second run: the batch-4 and batch-5 corrections second-read on
 * 2026-09-22 and put under test — the app half.
 *
 * Each `it` here is named by the `Row:` line written under a
 * `Second read (2026-09-22): …` verdict in `docs/lesson-audit/batch-4.md` or
 * `batch-5.md`. Entry 39 left these two batches without rows and said so; this
 * is that gap closed.
 *
 * **What this pass found that the rows are the argument for.** Eleven of the
 * ninety-two sentences had been rebuilt under the fix pass by a later build —
 * `technique.5` and `technique.6`'s scorers were wired, `technique.7` got the
 * Duet tool `validate.py` used to refuse, and six rungs' lab buttons grew an
 * `unlock` so the lesson could stop sending the learner to the Library. Every
 * one of those lessons now says something true that it did not say on
 * 2026-09-19, and nothing was reading any of it.
 *
 * **What a row may assert.** `00-invariants` §2 forbids a number measured on
 * this machine; a constant the code declares is a different thing. So the
 * ladder row reads `LADDER_NOTCH_PCT`, the voicing row reads the exercise's own
 * `topNoteRatio`, and the half-pedal row reads the exercise's own `ccRange`.
 */

/** A rung's tools, whatever kinds they are. */
function t12bTools(id: string): LessonTool[] {
  return [...(written(id).tools ?? [])];
}

/** The kinds a rung's tool row draws, in order. */
function t12bToolKinds(id: string): string[] {
  return t12bTools(id).map((tool) => tool.kind);
}

/** A recorded run, for the scorers that take one. */
function t12bRun(velocities: readonly number[]): { notes: { midi: number; velocity: number; tMs: number }[] } {
  return {
    notes: velocities.map((velocity, at) => ({ midi: 60 + at, velocity, tMs: at * 250 })),
  };
}

/** The catalog row's own fields the `CatalogItem` type does not carry here. */
function t12bFields(id: string): { tags: string[]; compositionStatus?: string; level?: number } {
  const row = item(id) as unknown as {
    tags?: string[];
    compositionStatus?: string;
    level?: number;
  };
  return { tags: row.tags ?? [], compositionStatus: row.compositionStatus, level: row.level };
}

/** `[lesson, the claim in the words of its `Row:` line, the test]` */
const T12B_APP: [string, string, () => boolean][] = [
  // --- batch 4 -------------------------------------------------------------
  [
    'theory.5',
    "the every-key chain starts at Stage 4, and Stage 3's chain is the white-key one",
    () => {
      const chromatic = 'drill.ear.simon-chromatic';
      const white = 'drill.ear.simon-c-major';
      const holds = (rungId: string, drillId: string): boolean =>
        (rung(rungId).exerciseOptions ?? []).includes(drillId);
      return (
        holds('theory.4', chromatic) &&
        holds('theory.5', chromatic) &&
        holds('theory.3', white) &&
        holds('1.5', white) &&
        simonForStage(4) === chromatic &&
        simonForStage(3) === white &&
        params(chromatic).steps === 'chromatic'
      );
    },
  ],
  [
    'improv.5',
    "Listen back is a tapped button that replays each note's own velocity at one fixed length",
    () => {
      const screen = source('ui/screens/DrillScreen.ts');
      return (
        screen.includes("button('Listen back'") &&
        screen.includes('lastRecording.length > 0') &&
        screen.includes('drill instanceof BackingTrackDrill') &&
        screen.includes('durationSec: 0.9') &&
        screen.includes('velocity: note.velocity')
      );
    },
  ],
  [
    'latin',
    'both La Cumparsita parts, El Choclo, Carioquinha and Malagueña are under Latin in the Library',
    () =>
      [
        'song.classical.tango-la-cumparsita-piano-solo-tutorial-parte-a.pdmx',
        'song.classical.tango-la-cumparsita-piano-solo-tutorial-parte-b.pdmx',
        'song.classical.el-choclo-piano.pdmx',
        'song.folk.carioquinha.pdmx',
        'song.classical.lecuona-malaguena-by-ernesto-lecuona.pdmx',
      ].every((id) => (item(id).tracks ?? []).includes('latin')),
  ],
  [
    'technique.5',
    'the shaping exercise is measured against its own minVelocityRange, and the sheet line says the distance travelled and the share in the right direction',
    () => {
      const id = 'exercise.shaping.a.crescendo';
      const asked = params(id).minVelocityRange;
      const measure = techniqueMeasureFor(
        item(id).drill ?? null,
        t12bRun([40, 50, 60, 70, 80, 90]) as never,
        [] as never,
      );
      return (
        asked === 30 &&
        measure?.label === 'Crescendo' &&
        measure.text.includes(`of the ${String(asked)} asked for`) &&
        measure.text.includes('in the right direction') &&
        measure.met
      );
    },
  ],
  [
    'technique.5',
    'exactly one exercise on this rung asks to be scored on a slope',
    () =>
      (rung('technique.5').exerciseOptions ?? []).filter(
        (id) => item(id).drill?.kind === 'shaping',
      ).length === 1,
  ],
  [
    'technique.5',
    'a flat line that jumps at the end passes the slope rule, and a line that only rises a little does not',
    () =>
      shapingScore(t12bRun([40, 40, 40, 40, 40, 90]).notes as never, 'crescendo', 30).passed &&
      !shapingScore(t12bRun([40, 42, 44, 46, 48, 50]).notes as never, 'crescendo', 30).passed,
  ],
  [
    'technique.5',
    'the slope is reported beside the accuracy and this rung does not make it a condition of passing',
    () =>
      rung('technique.5').mastery.custom === undefined &&
      !demandsTechniqueMeasure(rung('technique.5').mastery.custom, 'shaping') &&
      source('ui/screens/ScoreScreen.ts').includes('demandsTechniqueMeasure('),
  ],
  [
    'jam.5',
    'the Charleston is written in E and A, and the off-beat and anticipated figures in G and D',
    () => {
      const shape = (id: string): string =>
        `${String(params(id).key)}:${String(params(id).pattern)}`;
      return (
        shape('exercise.comping.e.charleston.intro') === 'E:charleston' &&
        shape('exercise.comping.a.charleston.intro') === 'A:charleston' &&
        shape('exercise.comping.g.off-beats.intro') === 'G:off-beats' &&
        shape('exercise.comping.d.anticipated.intro') === 'D:anticipated' &&
        ['exercise.comping.e.charleston.intro', 'exercise.comping.a.charleston.intro'].every(
          (id) => (rung('jam.5').exerciseOptions ?? []).includes(id),
        )
      );
    },
  ],
  [
    'ragtime.6',
    "the score's tempo comes from the file, and the app's own default is used only when the file states none",
    () => {
      const extract = source('score/extractScoreModel.ts');
      return (
        extract.includes('const bpm = it.CurrentBpm;') &&
        extract.includes('tempoMap.push({ atBeat: onset, bpm })') &&
        extract.includes('tempoMap.length === 0') &&
        extract.includes('options.defaultBpm ?? DEFAULT_BPM')
      );
    },
  ],
  [
    'ragtime.6',
    'a clean pass moves the ladder up one notch and a pass with a mistake moves it down one, and it needs a loop in Keep tempo',
    () => {
      const pass = (clean: boolean): number =>
        nextLadderTempo({ enabled: true, tempoPct: 60, startedAtPct: 100, clean });
      return (
        pass(true) === 60 + LADDER_NOTCH_PCT &&
        pass(false) === 60 - LADDER_NOTCH_PCT &&
        source('ui/screens/ScoreScreen.ts').includes(
          "mode === 'tempo' && loopBars !== null && !performanceRun",
        )
      );
    },
  ],
  [
    'technique.6',
    "the 1.4 in the prose is the voicing exercise's own topNoteRatio, and the sheet line counts chords against it",
    () => {
      const id = 'exercise.voicing.a';
      const ratio = params(id).topNoteRatio;
      // Two chords, the top note of each twice the rest: the sheet has to name
      // the exercise's own ratio in the line it writes, not the constant's.
      const struck = [
        { midi: 60, velocity: 40, tMs: 0 },
        { midi: 64, velocity: 40, tMs: 10 },
        { midi: 67, velocity: 90, tMs: 20 },
      ];
      const measure = techniqueMeasureFor(
        item(id).drill ?? null,
        { notes: struck } as never,
        [] as never,
      );
      return (
        ratio === 1.4 &&
        measure?.label === 'Top note' &&
        measure.text.includes(`at least ${String(ratio)} times the rest`) &&
        measure.judged > 0 &&
        (rung('technique.6').exerciseOptions ?? []).filter(
          (option) => item(option).drill?.kind === 'voicing',
        ).length === 1
      );
    },
  ],
  [
    'blues.6',
    "Pinetop's Boogie Woogie is levelled above every other option on the rung and still inside the rung's band",
    () => {
      const options = [
        ...(rung('blues.6').songOptions ?? []),
        ...(rung('blues.6').exerciseOptions ?? []),
      ];
      const pinetop = t12bFields('song.folk.boogie-woogie.pdmx').level ?? 0;
      const band = rung('blues.6').levelBand;
      const others = options
        .filter((id) => id !== 'song.folk.boogie-woogie.pdmx')
        .map((id) => t12bFields(id).level ?? 0);
      return (
        others.length === 7 &&
        others.every((level) => level < pinetop) &&
        band !== undefined &&
        pinetop >= band[0] &&
        pinetop <= band[1]
      );
    },
  ],
  [
    'chords-pop.6',
    "the rung's lab preset is the ballad, whose progression is I–vi–IV–V and locked, and whose key is not",
    () => {
      const preset = labPreset('ballad');
      return (
        labTools('chords-pop.6').join(',') === 'ballad' &&
        preset?.progressionId === 'i-vi-iv-v' &&
        preset.locks.includes('progression') &&
        !preset.locks.includes('key') &&
        labLocksFor(preset, freedBy('chords-pop.6')).has('progression')
      );
    },
  ],
  [
    'theory.6',
    "F aeolian is a card this rung's mode drill can deal, and the answer sheet engraves it in four flats with no accidental",
    () => {
      const drill = params('drill.theory.modes');
      const roots = drill.roots as string[] | undefined;
      const modes = drill.modes as string[] | undefined;
      // F aeolian: F G Ab Bb C Db Eb, from F3 up.
      const fAeolian = [53, 55, 56, 58, 60, 61, 63];
      return (
        (rung('theory.6').exerciseOptions ?? []).includes('drill.theory.modes') &&
        (roots ?? []).includes('F') &&
        (modes ?? []).includes('aeolian') &&
        !(roots ?? []).includes('B-') &&
        fifthsFor(fAeolian) === -4
      );
    },
  ],
  [
    'improv.6',
    'the rung frees the minor vamp\'s progression so ii7 V7 I can be typed there, and leaves its key locked',
    () => {
      const preset = labPreset('minor-vamp');
      const locked = labLocksFor(preset, freedBy('improv.6'));
      return (
        labTools('improv.6').join(',') === 'minor-vamp' &&
        preset?.locks.includes('progression') === true &&
        !locked.has('progression') &&
        locked.has('key')
      );
    },
  ],
  [
    'improv.6',
    'ii7 and V7 are built with a third and a seventh and I is built as a plain triad',
    () => {
      const shape = (roman: string): string =>
        (romanToChord(roman, 0, 60)?.pitches ?? [])
          .map((midi) => midi - (romanToChord(roman, 0, 60)?.root ?? 0))
          .join(',');
      return shape('ii7') === '0,3,7,10' && shape('V7') === '0,4,7,10' && shape('I') === '0,4,7';
    },
  ],
  [
    'rock.6',
    "Duet chooses what to play by hand and not by voice, so Moonlight's right-hand melody and arpeggio go together",
    () => {
      const model = {
        steps: [
          {
            notes: [
              { midi: 68, hand: 'R' },
              { midi: 61, hand: 'R' },
              { midi: 37, hand: 'L' },
            ],
          },
        ],
      };
      const forRight = appPitches(model as never, 0, 'non-focused', 'R');
      const forLeft = appPitches(model as never, 0, 'non-focused', 'L');
      return (
        forRight.join(',') === '37' &&
        forLeft.slice().sort((a, b) => a - b).join(',') === '61,68' &&
        appPitches(model as never, 0, 'none', 'R').length === 0
      );
    },
  ],
  [
    'rock.6',
    'three of the four exercises are levelled below every song on the rung and the half-pedal one is above all of them',
    () => {
      const songs = (rung('rock.6').songOptions ?? []).map((id) => t12bFields(id).level ?? 0);
      const exercises = rung('rock.6').exerciseOptions ?? [];
      const halfPedal = t12bFields('exercise.pedal.half-pedal.a').level ?? 0;
      const others = exercises
        .filter((id) => id !== 'exercise.pedal.half-pedal.a')
        .map((id) => t12bFields(id).level ?? 0);
      return (
        exercises.length === 4 &&
        songs.length === 3 &&
        others.every((level) => level < Math.min(...songs)) &&
        halfPedal > Math.max(...songs)
      );
    },
  ],
  [
    'jam.6',
    'a line of single notes names nothing and three notes held together name a chord, and an octave doubling is not a third note',
    () =>
      nameHeldChord([60]) === null &&
      nameHeldChord([60, 64]) === null &&
      nameHeldChord([60, 64, 72]) === null &&
      nameHeldChord([60, 64, 67]) !== null,
  ],
  [
    'jam.6',
    "the twelve-bar preset writes a walking left hand, Jam it's bass is root then fifth, and E, A and D are settable keys",
    () => {
      const preset = labPreset('blues-shuffle');
      const bass = barSchedule({ pitchClasses: [0, 4, 7], beatsPerBar: 4 }).filter(
        (event) => event.kind === 'bass',
      );
      const keys = LAB_KEYS.map((key) => key.id);
      return (
        preset?.leftHand === 'walking' &&
        bass.length === 2 &&
        bass[0]?.atBeat === 0 &&
        bass[1]?.atBeat === 2 &&
        (bass[1]?.midi ?? 0) - (bass[0]?.midi ?? 0) === 7 &&
        ['e-major', 'a-major', 'd-major'].every((id) => keys.includes(id))
      );
    },
  ],
  [
    'classical.7',
    'no nocturne is on the rung and several are in the Library under Classical',
    () => {
      const nocturnes = catalog.filter((row) => /Nocturne/i.test(row.title ?? ''));
      return (
        nocturnes.length > 5 &&
        nocturnes.every((row) => (row.tracks ?? []).includes('classical')) &&
        !(rung('classical.7').songOptions ?? []).some((id) => /Nocturne/i.test(item(id).title ?? ''))
      );
    },
  ],
  [
    'classical.7',
    'the rung offers two inventions and no waltz or nocturne, and the Library holds more of all three',
    () => {
      const songs = rung('classical.7').songOptions ?? [];
      const titled = (test: RegExp): string[] =>
        catalog.filter((row) => test.test(row.title ?? '')).map((row) => row.id);
      const inventions = titled(/Invention/i);
      const waltzes = titled(/Waltz/i).filter((id) => id.includes('chopin'));
      const nocturnes = titled(/Nocturne/i);
      const onRung = (ids: string[]): number => ids.filter((id) => songs.includes(id)).length;
      return (
        songs.length === 6 &&
        onRung(inventions) === 2 &&
        inventions.length > 2 &&
        onRung(waltzes) === 0 &&
        waltzes.length > 0 &&
        onRung(nocturnes) === 0 &&
        nocturnes.length > 0
      );
    },
  ],

  // --- batch 5 -------------------------------------------------------------
  [
    'ragtime.7',
    "the Library holds two Maple Leaf editions, the rung's and the Humdrum one",
    () => {
      const editions = catalog.filter((row) => /^Maple Leaf Rag$/i.test(row.title ?? ''));
      const songs = rung('ragtime.7').songOptions ?? [];
      return (
        editions.length === 2 &&
        editions.filter((row) => songs.includes(row.id)).length === 1 &&
        editions.some((row) => row.id.endsWith('.kern'))
      );
    },
  ],
  [
    'technique.7',
    'the half-pedal exercise is measured on its own ccRange and the sheet reports the share of messages inside it',
    () => {
      const id = 'exercise.pedal.half-pedal.a';
      const range = params(id).ccRange as number[] | undefined;
      const measure = techniqueMeasureFor(
        item(id).drill ?? null,
        { notes: [], pedal: [40, 50, 60, 127] } as never,
        [] as never,
      );
      return (
        (range ?? []).join(',') === '32,96' &&
        measure?.label === 'Half pedal' &&
        measure.text.includes('between 32 and 96') &&
        halfPedalScore([40, 50, 60, 127], [32, 96]).share === 0.75
      );
    },
  ],
  [
    'technique.7',
    'a pedal that only ever sends 0 and 127 is named as a switch rather than scored',
    () => {
      const measure = techniqueMeasureFor(
        item('exercise.pedal.half-pedal.a').drill ?? null,
        { notes: [], pedal: [0, 127, 0, 127] } as never,
        [] as never,
      );
      return (
        halfPedalScore([0, 127, 0, 127], [32, 96]).binaryPedal &&
        measure?.text.includes('this pedal is a switch') === true &&
        !demandsTechniqueMeasure(rung('technique.7').mastery.custom, 'half-pedal')
      );
    },
  ],
  [
    'technique.7',
    'the Duet button here opens the two-against-three exercise, which has a hand for the app to take',
    () => {
      const duet = t12bTools('technique.7').find((tool) => tool.kind === 'duet');
      const target = duet?.item ?? '';
      return (
        target === 'exercise.independence.c.2v3' &&
        (rung('technique.7').exerciseOptions ?? []).includes(target) &&
        // Both hands, from the item's own params rather than its staff count:
        // a duet needs a hand to take, and this exercise states two per beat in
        // one hand against three in the other.
        params(target).rightPerBeat === 2 &&
        params(target).leftPerBeat === 3 &&
        t12Repo('tools/content/validate.py').includes('may be a song or an exercise')
      );
    },
  ],
  [
    'jazz.7',
    'this rung\'s lab button fixes nothing, and both ii7 V7 I and ii7 ♭II7 I parse as typed numerals',
    () => {
      const key = labKey('c-major');
      const parses = (roman: string): boolean => romanToLabChord(roman, key) !== null;
      return (
        t12bToolKinds('jazz.7').join(',') === 'play,duet,lab' &&
        labEntries('jazz.7').length === 1 &&
        labTools('jazz.7').join(',') === '' &&
        labLocksFor(null, freedBy('jazz.7')).size === 0 &&
        ['ii7', 'V7', 'I', '♭II7', 'bII7'].every(parses)
      );
    },
  ],
  [
    'blues.7',
    'Rhythm only is a Keep-tempo score setting and is not one of the rung\'s tools',
    () =>
      source('ui/screens/ScoreScreen.ts').includes(
        "mode === 'tempo' && !blind && !performanceRun",
      ) &&
      source('ui/screens/ScoreScreen.ts').includes("'Rhythm only'") &&
      !t12bToolKinds('blues.7').includes('rhythm'),
  ],
  [
    'chords-pop.7',
    'the ninth drill deals only ninths, minor ninths and major ninths, and it is a kind that draws Show me and Hear it',
    () => {
      const qualities = params('drill.jazz.extended-chords').qualities as string[] | undefined;
      return (
        (rung('chords-pop.7').exerciseOptions ?? []).includes('drill.jazz.extended-chords') &&
        (qualities ?? []).join(',') === '9,m9,maj9' &&
        REVEALABLE_KINDS.has('extended-chord')
      );
    },
  ],
  [
    'chords-pop.7',
    'the rung\'s two tools are Free play and the ballad lab, which opens holding the chords and reports a count without recording it',
    () => {
      const lab = source('ui/screens/LabScreen.ts');
      return (
        t12bToolKinds('chords-pop.7').join(',') === 'play,lab' &&
        labTools('chords-pop.7').join(',') === 'ballad' &&
        bedOf('chords-pop.7') === 'hold' &&
        lab.includes('in the ${currentTradeScaleName()} scale') &&
        lab.includes('Hold the chords')
      );
    },
  ],
  [
    'theory.7',
    'the chord-scale drill names ionian for a major seventh and accepts only that scale, and three of its nine chords are major sevenths',
    () => {
      const chords = params('drill.jazz.chord-scale').chords as string[] | undefined;
      const majorSevenths = (chords ?? []).filter((chord) => /maj7$/i.test(chord));
      return (
        CHORD_SCALES.maj7 === 'ionian' &&
        chordScaleFor('Cmaj7')?.mode === 'ionian' &&
        (chords ?? []).length === 9 &&
        majorSevenths.length === 3 &&
        source('engine/drills/harmony.ts').includes('ordered: true')
      );
    },
  ],
  [
    'theory.7',
    'the rung\'s lab button fixes nothing, and V/V in C parses as a D chord',
    () => {
      const chord = romanToLabChord('V/V', labKey('c-major'));
      return (
        t12bToolKinds('theory.7').join(',') === 'simon,lab' &&
        labTools('theory.7').join(',') === '' &&
        labLocksFor(null, freedBy('theory.7')).size === 0 &&
        chord !== null &&
        chord.pitchClasses.slice().sort((a, b) => a - b).join(',') === '2,6,9'
      );
    },
  ],
  [
    'rock.7',
    'the Rachmaninoff is the only one of the rung\'s three songs a public build cannot bundle',
    () => {
      const songs = rung('rock.7').songOptions ?? [];
      const personal = songs.filter((id) => t12bFields(id).tags.includes('personal-build'));
      return (
        songs.length === 3 &&
        personal.length === 1 &&
        (personal[0] ?? '').includes('rachmaninoff') &&
        t12bFields(personal[0] ?? '').compositionStatus === 'in-copyright'
      );
    },
  ],
  [
    'classical.8',
    'the ladder\'s notch is a tenth of the written tempo each way and it stops at the written tempo',
    () =>
      LADDER_NOTCH_PCT === 10 &&
      LADDER_CEILING_PCT === 100 &&
      nextLadderTempo({ enabled: true, tempoPct: 95, startedAtPct: 100, clean: true }) ===
        LADDER_CEILING_PCT &&
      nextLadderTempo({ enabled: true, tempoPct: 80, startedAtPct: 100, clean: true }) ===
        80 + LADDER_NOTCH_PCT,
  ],
  [
    'classical.8',
    'a loop is set in whole printed bars, and the shortest one the screen can make is a single bar',
    () => {
      const screen = source('ui/screens/ScoreScreen.ts');
      const session = source('score/ScoreSession.ts');
      const calls = [...screen.matchAll(/session\.loopForPrintedBars\(/g)].length;
      return (
        calls >= 5 &&
        screen.includes('session.loopForPrintedBars(measure, measure)') &&
        session.includes('loopForPrintedBars(fromBar: number, toBar: number)') &&
        screen.includes('Repeat a few bars over and over')
      );
    },
  ],
  [
    'ragtime.8',
    'Euphonic Sounds is in no catalog row, and the rung\'s five Joplin rags all come from the same non-public-domain edition',
    () => {
      const songs = rung('ragtime.8').songOptions ?? [];
      const joplin = songs.filter((id) => id.includes('joplin-'));
      return (
        catalog.filter((row) => /euphonic/i.test(`${row.id} ${row.title ?? ''}`)).length === 0 &&
        t12Repo('content/sources/kern.json').includes('joplin/euphonic') &&
        joplin.length === 5 &&
        joplin.every((id) => t12bFields(id).tags.includes('nc-personal-build'))
      );
    },
  ],
  [
    'blues.8',
    "Pinetop's Boogie Woogie is on this rung and on blues.6, and not on blues.7 in between",
    () => {
      const id = 'song.folk.boogie-woogie.pdmx';
      return (
        (rung('blues.8').songOptions ?? []).includes(id) &&
        (rung('blues.6').songOptions ?? []).includes(id) &&
        !(rung('blues.7').songOptions ?? []).includes(id)
      );
    },
  ],
  [
    'blues.8',
    "the twelve-bar preset's every chord is a seventh and its form is locked, while its key is not; three typed numerals would rotate instead",
    () => {
      const preset = labPreset('blues-shuffle');
      const progression = labProgression(preset?.progressionId ?? '');
      const romans = [...(progression.major ?? [])];
      return (
        labTools('blues.8').join(',') === 'blues-shuffle' &&
        romans.length === 12 &&
        romans.every((roman) => roman.includes('7')) &&
        labLocksFor(preset, freedBy('blues.8')).has('progression') &&
        !labLocksFor(preset, freedBy('blues.8')).has('key') &&
        source('ui/screens/LabScreen.ts').includes('typed[bar % typed.length]')
      );
    },
  ],
  [
    'chords-pop.8',
    "the rung opens the one-four-five preset with its progression freed, so the chords and the key are both the learner's",
    () => {
      const preset = labPreset('primary-chords');
      const locked = labLocksFor(preset, freedBy('chords-pop.8'));
      return (
        labTools('chords-pop.8').join(',') === 'primary-chords' &&
        preset?.progressionId === 'i-iv-v-i' &&
        preset.locks.includes('progression') &&
        !locked.has('progression') &&
        !locked.has('key')
      );
    },
  ],
  [
    'improv.8',
    'the rung opens the two-five-one preset with its progression freed, so a secondary dominant can be typed into it',
    () => {
      const preset = labPreset('jazz-comping');
      const locked = labLocksFor(preset, freedBy('improv.8'));
      const secondary = romanToLabChord('V7/vi', labKey('c-major'));
      return (
        labTools('improv.8').join(',') === 'jazz-comping' &&
        preset?.progressionId === 'ii-v-i' &&
        !locked.has('progression') &&
        secondary !== null
      );
    },
  ],
  [
    'chords-pop.9',
    'the rung frees the ballad\'s progression and left hand and opens it on the bed alone, so a chart can be typed and three left hands tried over it',
    () => {
      const preset = labPreset('ballad');
      const locked = labLocksFor(preset, freedBy('chords-pop.9'));
      return (
        labTools('chords-pop.9').join(',') === 'ballad' &&
        !locked.has('progression') &&
        !locked.has('leftHand') &&
        locked.has('rightHand') &&
        // T19: `tune` here was refused by the screen, because the ballad's
        // right hand is `none` and locked. `off` is what the button did and
        // what the lesson now says.
        bedOf('chords-pop.9') === 'off' &&
        preset?.bed === 'hold'
      );
    },
  ],
  [
    'jazz.9',
    'a blind run still follows and marks the player, and it is the one thing that hides Rhythm only',
    () => {
      const screen = source('ui/screens/ScoreScreen.ts');
      return (
        screen.includes('The app still follows you and still marks what you play.') &&
        screen.includes("mode === 'tempo' && !blind && !performanceRun") &&
        t12bToolKinds('jazz.9').includes('blind')
      );
    },
  ],
  [
    'blues.9',
    'the blues track has seven rungs, so this one is the point of six others',
    () => {
      const blues = t12Walk().filter((row) => /^blues\.\d+$/.test(row.lesson.id));
      return (
        blues.length === 7 &&
        blues.every((row) => row.track === 'blues-boogie') &&
        blues.some((row) => row.lesson.id === 'blues.9') &&
        Math.max(...blues.map((row) => row.stage)) === 9
      );
    },
  ],
];

describe('the batch-4 and batch-5 corrections, second-read and under test: the app', () => {
  it('carries a row for each of the two batches this run second-read', () => {
    expect(T12B_APP.length).toBeGreaterThan(40);
  });

  for (const [lesson, says, holds] of T12B_APP) {
    it(`${lesson}: ${says}`, () => {
      expect(holds()).toBe(true);
    });
  }
});

// Appended with the block above in one edit, so neither of the two earlier
// blocks had to be touched. ES modules hoist their imports, so these read
// exactly as they would at the top of the file.
import {
  demandsTechniqueMeasure,
  halfPedalScore,
  shapingScore,
  techniqueMeasureFor,
} from '../../src/engine/Scoring';
import { LAB_KEYS, labKey, romanToLabChord } from '../../src/engine/sightReading';
import { CHORD_SCALES, chordScaleFor, nameHeldChord, romanToChord } from '../../src/engine/drills/theory';
import { simonForStage } from '../../src/engine/drills/simon';
import { fifthsFor } from '../../src/engine/drills/answerSheet';
import { barSchedule } from '../../src/audio/backingLoop';
import { appPitches } from '../../src/score/ScoreSession';

// --- T19: every lesson names the modes its rung has -------------------------
//
// Entry 40 found six lessons whose *Tools for this rung* paragraph named fewer
// tools than the rung carried, one of them none and one with no paragraph at
// all. The owner's test is two-sided: a lesson may never say a rung offers
// something it does not, and it should say what it does. The first four rows
// below are that test made mechanical over all 109 lessons, so the next rung
// that gains a tool and loses its sentence fails here rather than in a reading.
//
// The rest are the individual sentences this pass wrote: what each button
// opens, and which way round the lab comes up. They are hard-coded on the
// lesson's side on purpose — the sentence is the constant, and the app's
// answer is what has to agree with it.

const T19_LESSONS = resolve('..', 'content', 'lessons');

/** The label `LessonScreen.toolButton` draws for each kind. */
const T19_LABELS: Record<string, string> = {
  lab: 'Accompaniment lab',
  play: 'Free play',
  simon: 'Simon',
  duet: 'Play it as a duet',
  blind: 'Play it blind',
  ladder: 'Climb the ladder',
};

/** Every authored rung, in file order. */
function t19Rungs(): Lesson[] {
  const out: Lesson[] = [];
  for (const stage of authored.stages) {
    for (const unit of stage.units) for (const lesson of unit.lessons) out.push(lesson);
  }
  return out;
}

/** A lesson's whole body, whitespace flattened so a wrapped label still matches. */
function t19Text(lesson: Lesson): string {
  const name = lesson.textFile.split('/').pop() ?? `${lesson.id}.md`;
  return readFileSync(join(T19_LESSONS, name), 'utf8').replace(/\s+/g, ' ');
}

/** The *Tools for this rung* paragraph onwards, or '' where there is none. */
function t19Para(lesson: Lesson): string {
  const text = t19Text(lesson);
  const at = text.indexOf('**Tools for this rung');
  return at < 0 ? '' : text.slice(at);
}

/** What a `duet` or `blind` with no `item` opens: the rung's first playable song. */
function t19FirstSong(id: string): string | null {
  return (
    rung(id).songOptions.find((option) => {
      const row = byId.get(option);
      return row !== undefined && row.type === 'song' && targetFor(row) !== 'none';
    }) ?? null
  );
}

/** What `ladder` opens: the rung's first exercise that is notation. */
function t19Ladder(id: string): string | null {
  return (
    rung(id).exerciseOptions.find((option) => {
      const row = byId.get(option);
      return row !== undefined && targetFor(row) === 'score';
    }) ?? null
  );
}

/** The `item` a rung's tool of this kind names, if it names one. */
function t19Item(id: string, kind: string): string | undefined {
  return (written(id).tools ?? []).find((tool) => tool.kind === kind)?.item;
}

/** How many staves the catalog measured in a row's file. */
function t19Staves(id: string): number | undefined {
  return (item(id).notation as { staves?: number } | undefined)?.staves;
}

/** The kinds a rung carries, in order. */
function t19Kinds(id: string): string[] {
  return (written(id).tools ?? []).map((tool) => tool.kind);
}

const T19_APP: [string, string, () => boolean][] = [
  // --- the two-sided rule, over every lesson -------------------------------
  [
    'every rung',
    'a rung that carries tools has a Tools for this rung paragraph that names every one of them, by the label the page draws',
    () => {
      const silent: string[] = [];
      for (const lesson of t19Rungs()) {
        const kinds = (lesson.tools ?? []).map((tool) => tool.kind);
        if (kinds.length === 0) continue;
        const para = t19Para(lesson).toLowerCase();
        if (para === '') silent.push(`${lesson.id}: no paragraph`);
        for (const kind of kinds) {
          const label = (T19_LABELS[kind] ?? kind).toLowerCase();
          if (!para.includes(label)) silent.push(`${lesson.id}: ${kind}`);
        }
      }
      return silent.length === 0;
    },
  ],
  [
    'every rung',
    'no lesson names a button its own rung does not draw',
    () => {
      // Two lessons name a label for a kind their rung lacks, and both say in
      // the same sentence where that thing actually is: `1.5` lists the Simon
      // drill among its own exercises and opens it from that row, and `3.6`
      // says outright that the accompaniment lab is not this rung's button and
      // lives on the Library's line of doors. `0.3` is the third: its tour of
      // the app names the lab and says in the same sentence that it is under
      // Library (Entry 55 found it as the one lesson still calling it *Lab*).
      const allowed = new Set(['1.5:simon', '3.6:lab', '0.3:lab']);
      const wrong: string[] = [];
      for (const lesson of t19Rungs()) {
        const kinds = new Set<string>((lesson.tools ?? []).map((tool) => tool.kind));
        const text = t19Text(lesson).toLowerCase();
        for (const [kind, label] of Object.entries(T19_LABELS)) {
          if (kinds.has(kind)) continue;
          if (text.includes(label.toLowerCase()) && !allowed.has(`${lesson.id}:${kind}`)) {
            wrong.push(`${lesson.id}:${kind}`);
          }
        }
      }
      return wrong.length === 0;
    },
  ],
  [
    'every rung',
    'a lab tool that opens on Play the tune names a preset that has a right hand to hand over',
    () => {
      // The fault this pass found: `LabScreen.bedRefusal` turns *Play the tune*
      // down when the right hand is `none`, and `drawBedChips` stands the chip
      // back to *Bed only* — so `jam.5` and `chords-pop.9` each carried a
      // `mode` the screen never honoured while their lessons promised it.
      const wrong: string[] = [];
      for (const lesson of t19Rungs()) {
        for (const tool of lesson.tools ?? []) {
          if (tool.kind !== 'lab') continue;
          const preset = tool.preset ? labPreset(tool.preset) : null;
          if (labBedFor(preset, tool.mode) === 'tune' && preset?.rightHand === 'none') {
            wrong.push(`${lesson.id}: ${String(tool.preset)}`);
          }
        }
      }
      return wrong.length === 0;
    },
  ],
  [
    'every rung',
    'a lab tool that opens on Hold the chords names a preset with a left-hand pattern to comp in',
    () => {
      const wrong: string[] = [];
      for (const lesson of t19Rungs()) {
        for (const tool of lesson.tools ?? []) {
          if (tool.kind !== 'lab') continue;
          const preset = tool.preset ? labPreset(tool.preset) : null;
          if (labBedFor(preset, tool.mode) === 'hold' && preset?.leftHand === 'none') {
            wrong.push(`${lesson.id}: ${String(tool.preset)}`);
          }
        }
      }
      return wrong.length === 0;
    },
  ],

  // --- what Climb the ladder opens, per rung -------------------------------
  [
    '4.1',
    'the ladder opens the two-octave C major scale hands together',
    () => t19Ladder('4.1') === 'exercise.scale.c-major.2oct.similar.both.2',
  ],
  [
    '4.2',
    'the ladder opens the two-octave F major scale hands together — the one whose thumb waits for the fourth finger',
    () => t19Ladder('4.2') === 'exercise.scale.f-major.2oct.similar.both.2',
  ],
  [
    '4.3',
    'the flash cards are a prompt loop with no notation, so the ladder skips them and takes the written-out inversions',
    () =>
      rung('4.3').exerciseOptions[0] === 'drill.chord.inversions' &&
      targetFor(item('drill.chord.inversions')) === 'drill' &&
      t19Ladder('4.3') === 'exercise.inversions.c-major.both',
  ],
  [
    '4.4',
    'the ladder opens Hanon No. 1 hands together, and a pass of it is about sixty beats',
    () => {
      const id = t19Ladder('4.4');
      const bars = (item(id ?? '').notation as { bars?: number } | undefined)?.bars;
      return id === 'exercise.hanon.01.both' && bars === 30;
    },
  ],
  [
    'technique.4',
    'the ladder opens the legato phrase in C, which is the first of this rung’s written-out exercises',
    () => t19Ladder('technique.4') === 'exercise.articulation.c.legato.right',
  ],
  [
    'technique.6',
    'the ladder opens the four-octave A flat arpeggio hands together',
    () => t19Ladder('technique.6') === 'exercise.arpeggio.a-flat-major.4oct.both',
  ],
  [
    'technique.7',
    'the ladder opens the broken-octave study in A, left hand — not the octave scale the paragraph used to name',
    () =>
      t19Ladder('technique.7') === 'exercise.broken-octaves.a.1oct.left' &&
      rung('technique.7').exerciseOptions.includes('exercise.octave-scale.a.1oct.both'),
  ],

  // --- what a duet or a blind opens, per rung ------------------------------
  [
    '2.1',
    'the duet opens a hands-together tune',
    () => t19FirstSong('2.1') === 'song.classical.ode-to-joy.ht',
  ],
  [
    '3.5',
    'the duet opens the easy Canon in D',
    () => t19FirstSong('3.5') === 'song.classical.pachelbel-canon-d.easy',
  ],
  [
    '3.6',
    'the duet opens Greensleeves with its waltz bass',
    () => t19FirstSong('3.6') === 'song.folk.greensleeves.waltz',
  ],
  [
    'hymns',
    'the duet opens When the Saints, which is why the lesson sends you to Amazing Grace from its own row',
    () =>
      t19FirstSong('hymns') === 'song.folk.when-the-saints.f' &&
      rung('hymns').songOptions.includes('song.folk.amazing-grace-satb.pdmx'),
  ],
  [
    'rock.overview',
    'the duet opens the easy Canon in D',
    () => t19FirstSong('rock.overview') === 'song.classical.pachelbel-canon-d.easy',
  ],
  [
    '4.7',
    'the blind button opens the easy Für Elise, first of the rung’s three',
    () =>
      t19FirstSong('4.7') === 'song.classical.beethoven-fur-elise.easy' &&
      rung('4.7').songOptions.length === 3,
  ],
  [
    'classical.4',
    'the duet opens the Sonatina in G, first of the rung’s five',
    () =>
      t19FirstSong('classical.4') === 'song.pop.sonatina-in-g.pdmx' &&
      rung('classical.4').songOptions.length === 5,
  ],
  [
    'classical.5',
    'the duet opens the Clementi first movement',
    () =>
      t19FirstSong('classical.5') ===
      'song.classical.clementi-sonatina-no-1-muzio-clementi.pdmx',
  ],
  [
    'classical.6',
    'the duet opens the Bach prelude, and the rung draws no blind button — which is why the lesson sends Blind to the ⋯ menu',
    () =>
      t19FirstSong('classical.6') === 'song.classical.bach-wtc1-prelude-1' &&
      t19Kinds('classical.6').join(',') === 'duet',
  ],
  [
    'classical.7',
    'the duet names Invention No. 1, which is one of the rung’s own songs and opens as notation',
    () => {
      const named = t19Item('classical.7', 'duet');
      return (
        named === 'song.classical.bach-invention-no-1-in-c-major-bwv-772.pdmx' &&
        rung('classical.7').songOptions.includes(named) &&
        targetFor(item(named)) === 'score' &&
        t19FirstSong('classical.7') === 'song.classical.mozart-k545-i'
      );
    },
  ],
  [
    'classical.8',
    'both buttons take the Rondo alla turca, first of the six',
    () => t19FirstSong('classical.8') === 'song.classical.mozart-rondo-alla-turca',
  ],
  [
    'classical.9',
    'the one button is blind, and it opens the first Ballade',
    () =>
      t19Kinds('classical.9').join(',') === 'blind' &&
      t19FirstSong('classical.9') === 'song.classical.chopin-ballade-1',
  ],
  [
    'ragtime.6',
    'the one button is a duet, and it opens School of Ragtime',
    () =>
      t19Kinds('ragtime.6').join(',') === 'duet' &&
      t19FirstSong('ragtime.6') === 'song.ragtime.joplin-school-of-ragtime',
  ],
  [
    'ragtime.7',
    'both buttons take Maple Leaf Rag, and Solace is on the rung but not what they open',
    () =>
      t19FirstSong('ragtime.7') === 'song.ragtime.joplin-maple-leaf-rag' &&
      rung('ragtime.7').songOptions.some((id) => /solace/.test(id)),
  ],
  [
    'ragtime.8',
    'the one button is blind, and it opens Pine Apple Rag — first of the rung’s six',
    () =>
      t19Kinds('ragtime.8').join(',') === 'blind' &&
      t19FirstSong('ragtime.8') === 'song.ragtime.joplin-pine-apple-rag' &&
      rung('ragtime.8').songOptions.length === 6,
  ],
  [
    'blues.5',
    'the blind button opens Blues My Naughty Sweetie Gives to Me, first of the rung’s six',
    () =>
      t19FirstSong('blues.5') ===
        'song.classical.1919-blues-my-naughty-sweetie-gives-to-me.pdmx' &&
      rung('blues.5').songOptions.length === 6,
  ],
  [
    'blues.6',
    'the duet opens the easy Boogie',
    () => t19FirstSong('blues.6') === 'song.pop.boogie-easy-for-beginners.pdmx',
  ],
  [
    'blues.7',
    'the duet and the blind button both take the easy Boogie, first of the rung’s three',
    () =>
      t19FirstSong('blues.7') === 'song.pop.boogie-easy-for-beginners.pdmx' &&
      rung('blues.7').songOptions.length === 3,
  ],
  [
    'blues.8',
    'the blind button opens Pinetop’s Boogie Woogie, first of the rung’s three',
    () =>
      t19FirstSong('blues.8') === 'song.folk.boogie-woogie.pdmx' &&
      rung('blues.8').songOptions.length === 3,
  ],
  [
    'blues.9',
    'the blind button opens Stumbling, first of the rung’s three',
    () =>
      t19FirstSong('blues.9') === 'song.jazz.stumbling' &&
      rung('blues.9').songOptions.length === 3,
  ],
  [
    'chords-pop.8',
    'the blind button opens Isabella’s Lullaby, first of the rung’s six',
    () =>
      (t19FirstSong('chords-pop.8') ?? '').includes('isabella-s-lullaby') &&
      rung('chords-pop.8').songOptions.length === 6,
  ],
  [
    'chords-pop.9',
    'the blind button opens Le Festin, first of the rung’s six',
    () =>
      (t19FirstSong('chords-pop.9') ?? '').includes('le-festin') &&
      rung('chords-pop.9').songOptions.length === 6,
  ],
  [
    'holiday.6',
    'the blind button takes Carol of the Bells and not Silent Night, which the list above names first',
    () =>
      t19FirstSong('holiday.6') === 'song.holiday.carol-of-the-bells' &&
      rung('holiday.6').songOptions.some((id) => /silent-night/.test(id)) &&
      rung('holiday.6').songOptions.length === 4,
  ],
  [
    'jazz.6',
    'the duet opens Bye Bye Blackbird',
    () => t19FirstSong('jazz.6') === 'song.pop.ray-henderson-bye-bye-blackbird.pdmx',
  ],
  [
    'jazz.7',
    'the duet opens the jazz setting of Jingle Bells',
    () =>
      t19FirstSong('jazz.7') === 'song.jazz.james-pierpont-jingle-bells-jazz-piano.pdmx',
  ],
  [
    'jazz.9',
    'the blind button opens Take Five, first of the rung’s six',
    () =>
      t19FirstSong('jazz.9') === 'song.jazz.the-dave-brubeck-quartet-take-five.pdmx' &&
      rung('jazz.9').songOptions.length === 6,
  ],

  // --- three duets that now name an exercise, because the songs cannot ------
  [
    'latin.3',
    'the duet names the son clave over a quarter-note pulse — the one option here with two staves — because all three of the rung’s songs are printed on one',
    () => {
      const named = t19Item('latin.3', 'duet');
      const songs = rung('latin.3').songOptions;
      return (
        named === 'exercise.clave.son-3-2.pulse' &&
        rung('latin.3').exerciseOptions.includes(named) &&
        t19Staves(named) === 2 &&
        songs.length === 3 &&
        songs.every((id) => t19Staves(id) === 1)
      );
    },
  ],
  [
    'latin',
    'the duet names the tumbao-and-montuno exercise, because five of the rung’s six songs are printed on one staff',
    () => {
      const named = t19Item('latin', 'duet');
      const songs = rung('latin').songOptions;
      return (
        named === 'exercise.latin-groove.c.son-3-2' &&
        rung('latin').exerciseOptions.includes(named) &&
        t19Staves(named) === 2 &&
        songs.filter((id) => t19Staves(id) === 1).length === 5
      );
    },
  ],
  [
    'technique.5',
    'the duet names the two-against-one exercise, where the right hand is the moving one and the left is the steady one',
    () => {
      const named = t19Item('technique.5', 'duet');
      const settings = params(named ?? '');
      return (
        named === 'exercise.independence.c.2v1' &&
        rung('technique.5').exerciseOptions.includes(named) &&
        settings.rightPerBeat === 2 &&
        settings.leftPerBeat === 1
      );
    },
  ],

  // --- which way round the lab opens ---------------------------------------
  [
    '2.3',
    'the lab opens playing the tune, so the three chords under it are the learner’s — which is what this rung is marked on',
    () =>
      bedOf('2.3') === 'tune' &&
      labPreset('primary-chords')?.rightHand === 'melody' &&
      labTools('2.3').join(',') === 'primary-chords',
  ],
  [
    'chords-pop.4',
    'the four-chord preset carries no way round of its own, and this rung — its only one — opens it playing the tune',
    () =>
      labPreset('pop-four-chord')?.bed === undefined &&
      labPreset('pop-four-chord')?.rightHand === 'melody' &&
      bedOf('chords-pop.4') === 'tune',
  ],
  [
    'jam',
    'the lab opens on the bed alone — bass and drums, no chords — because comping is what this rung is for',
    () => bedOf('jam') === 'off' && labTools('jam').join(',') === 'blues-shuffle',
  ],
  [
    'holiday',
    'the lab opens holding the chords, so the tune over them is the learner’s',
    () => bedOf('holiday') === 'hold' && labPreset('primary-chords')?.bed === 'hold',
  ],
  [
    'improv.6',
    'the minor vamp opens holding the chords with its progression handed back, so a typed two-five-one runs underneath',
    () =>
      bedOf('improv.6') === 'hold' &&
      freedBy('improv.6').includes('progression') &&
      labTools('improv.6').join(',') === 'minor-vamp',
  ],
  [
    'jam.6',
    'the twelve-bar preset walks a bass and, holding the chords, comps on the backbeat rather than laying a second walking line over the first',
    () => {
      const preset = labPreset('blues-shuffle');
      return (
        bedOf('jam.6') === 'hold' &&
        preset?.leftHand === 'walking' &&
        source('audio/backingLoop.ts').includes("case 'walking':")
      );
    },
  ],

  // --- Simon: what the button opens, and whether the rung lists it ----------
  [
    'theory.3',
    'Simon opens the white-key chain around middle C, which this rung lists as an exercise',
    () =>
      simonForStage(3) === 'drill.ear.simon-c-major' &&
      rung('theory.3').exerciseOptions.includes('drill.ear.simon-c-major'),
  ],
  [
    'theory.4',
    'from Stage 4 up Simon opens the every-key chain, and this rung lists it',
    () =>
      simonForStage(4) === 'drill.ear.simon-chromatic' &&
      rung('theory.4').exerciseOptions.includes('drill.ear.simon-chromatic'),
  ],
  [
    'theory.5',
    'Simon opens the every-key chain, and this rung lists it',
    () =>
      simonForStage(5) === 'drill.ear.simon-chromatic' &&
      rung('theory.5').exerciseOptions.includes('drill.ear.simon-chromatic'),
  ],
  [
    'theory.6',
    'Simon opens the every-key chain, and this rung lists it',
    () =>
      simonForStage(6) === 'drill.ear.simon-chromatic' &&
      rung('theory.6').exerciseOptions.includes('drill.ear.simon-chromatic'),
  ],
  [
    'theory.7',
    'Simon opens the every-key chain, which this rung does not list among its five exercises — the lesson says so rather than implying it is one',
    () =>
      simonForStage(7) === 'drill.ear.simon-chromatic' &&
      !rung('theory.7').exerciseOptions.includes('drill.ear.simon-chromatic') &&
      rung('theory.7').exerciseOptions.length === 5,
  ],
  [
    'theory.8',
    'the one button is Simon, opening the every-key chain, which is not one of this rung’s five exercises',
    () =>
      t19Kinds('theory.8').join(',') === 'simon' &&
      simonForStage(8) === 'drill.ear.simon-chromatic' &&
      !rung('theory.8').exerciseOptions.includes('drill.ear.simon-chromatic') &&
      rung('theory.8').exerciseOptions.length === 5,
  ],
  [
    'theory.9',
    'the one button is Simon, and the sight-reading the lesson names is an exercise of the rung rather than a button',
    () =>
      t19Kinds('theory.9').join(',') === 'simon' &&
      simonForStage(9) === 'drill.ear.simon-chromatic' &&
      rung('theory.9').exerciseOptions.some((id) => id.startsWith('drill.reading.sight-reading')),
  ],
  [
    'improv.5',
    'Simon here names the blues-scale chain, which is one of the rung’s own exercises, and it lights the keys only after a miss',
    () => {
      const named = t19Item('improv.5', 'simon');
      return (
        named === 'drill.ear.simon-blues-c' &&
        rung('improv.5').exerciseOptions.includes(named) &&
        params(named).help === 'keys-after-miss'
      );
    },
  ],
  [
    'blues.3',
    'Simon here names the same blues-scale chain, and the lab opens the twelve bars holding the changes',
    () =>
      t19Item('blues.3', 'simon') === 'drill.ear.simon-blues-c' &&
      bedOf('blues.3') === 'hold' &&
      labTools('blues.3').join(',') === 'blues-shuffle',
  ],

  // --- Free play, which six lessons now describe the same way ---------------
  [
    '3.2',
    'Free play names three or more notes held together and says which one is in the bass',
    () => {
      const first = nameHeldChord([60, 64, 67]);
      const inverted = nameHeldChord([64, 67, 72]);
      return (
        t19Kinds('3.2').includes('play') &&
        nameHeldChord([60, 64]) === null &&
        (first?.label ?? '') === 'C major' &&
        (inverted?.label ?? '').includes(' / ')
      );
    },
  ],
  [
    '3.3',
    'Free play is on this rung, and an E7 without its raised third is a different chord to it',
    () => {
      const withSharp = nameHeldChord([52, 56, 59, 62]);
      const without = nameHeldChord([52, 55, 59, 62]);
      return (
        t19Kinds('3.3').includes('play') &&
        withSharp !== null &&
        without !== null &&
        withSharp.label !== without.label
      );
    },
  ],
  [
    'improv.7',
    'the one button is Free play, and a stack of fourths is not a chord the namer has a word for',
    () =>
      t19Kinds('improv.7').join(',') === 'play' &&
      nameHeldChord([62, 67, 72, 77]) === null,
  ],
  [
    'improv.9',
    'the one button is Free play, and the rung offers no song for any other to open',
    () =>
      t19Kinds('improv.9').join(',') === 'play' && rung('improv.9').songOptions.length === 0,
  ],
  [
    'jazz.8',
    'the lab opens playing the tune and Free play is the other button, so a voicing with the root taken out can be held and named',
    () =>
      t19Kinds('jazz.8').includes('play') &&
      bedOf('jazz.8') === 'tune' &&
      labPreset('jazz-comping')?.rightHand === 'chord-tones',
  ],

  // --- trading fours, where three more lessons now send the learner ---------
  [
    'improv.5',
    'trading fours is a setting on Jam it and turns the way round off, so the bed does not hold the chords through the learner’s bars',
    () => {
      // One row since 2026-09-22, so the exclusion is no longer two lines
      // pointing at each other: pressing a trade sets `bed = 'off'` and
      // pressing a way round sets `trading = false`, in the one handler.
      const screen = source('ui/screens/LabScreen.ts');
      return (
        screen.includes("bed = 'off';") &&
        screen.includes('trading = false;') &&
        screen.includes('trading = true;') &&
        labTools('improv.5').join(',') === 'blues-shuffle'
      );
    },
  ],
  [
    'improv.6',
    'the trade counts the learner’s notes against the key’s own scale here, because the twelve-bar form is the only one counted against the blues scale',
    () =>
      labPreset('minor-vamp')?.progressionId === 'i-v-vi-iv' &&
      labPreset('blues-shuffle')?.progressionId === 'blues' &&
      source('engine/tradingFours.ts').includes('blues'),
  ],
  [
    'blues.9',
    'the trade chips offer four bars each as well as two',
    () => source('ui/screens/LabScreen.ts').includes('TRADE_BAR_CHOICES = [2, 4]'),
  ],
];

describe('T19: every lesson names the modes its rung has', () => {
  it('carries a row for each of the sentences this pass wrote', () => {
    expect(T19_APP.length).toBeGreaterThan(40);
  });

  for (const [lesson, says, holds] of T19_APP) {
    it(`${lesson}: ${says}`, () => {
      expect(holds()).toBe(true);
    });
  }
});

import { targetFor } from '../../src/ui/openItem';
