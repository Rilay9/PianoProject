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
import { LAB_PRESETS, labPreset } from '../../src/engine/sightReading';
import { drillFromCatalog } from '../../src/engine/drills/fromCatalog';
import { masteryCriteriaFor } from '../../src/curriculum/selectors';
import { DEFAULT_MASTERY } from '../../src/engine/Scoring';
import { nextRecommended } from '../../src/curriculum/session';
import { hasChordSymbols } from '../../src/ui/openItem';
import type { CatalogItem, Curriculum, Lesson } from '../../src/curriculum/types';

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

/** A rung's lab tools: the preset each button opens, `null` for the free one. */
function labTools(id: string): (string | null)[] {
  return (written(id).tools ?? [])
    .filter((tool) => tool.kind === 'lab')
    .map((tool) => tool.preset ?? null);
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
    'one lab button opens the minor vamp, the other fixes nothing',
    () => {
      const tools = labTools('3.3');
      return tools.includes('minor-vamp') && tools.includes(null);
    },
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
    '*Lab — your own chords* takes a typed `ii7 V7 I`',
    () => labTools('chords-pop.5').includes(null),
  ],
  [
    'improv.6',
    'the preset button fixes the progression and the other one does not',
    () => {
      const tools = labTools('improv.6');
      const preset = labPreset(tools.find((id): id is string => id !== null) ?? '');
      return preset?.locks.includes('progression') === true && tools.includes(null);
    },
  ],
  [
    'chords-pop.8',
    'one button loops I–IV–V–I and the other lets the song’s changes be typed',
    () => {
      const tools = labTools('chords-pop.8');
      return (
        labPreset(tools.find((id): id is string => id !== null) ?? '')?.progressionId ===
          'i-iv-v-i' && tools.includes(null)
      );
    },
  ],
  [
    'improv.8',
    'the preset button is a fixed ii–V–I and the other takes typed numerals',
    () => {
      const tools = labTools('improv.8');
      return (
        labPreset(tools.find((id): id is string => id !== null) ?? '')?.progressionId ===
          'ii-v-i' && tools.includes(null)
      );
    },
  ],
  [
    'chords-pop.9',
    'the ballad’s chords and left hand are fixed, so the chart goes in the other one',
    () => {
      const tools = labTools('chords-pop.9');
      const ballad = labPreset('ballad');
      return (
        tools.includes('ballad') &&
        tools.includes(null) &&
        ballad?.locks.includes('progression') === true &&
        ballad.locks.includes('leftHand')
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
});
