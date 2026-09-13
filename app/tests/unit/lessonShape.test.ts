// @vitest-environment node
/**
 * What every lesson owes a learner, and the numbers it is allowed to quote.
 *
 * Two joins nothing else makes.
 *
 * **The shape.** Eighty-one of the eighty-six lessons ended by telling you how
 * to know you had got it; the five technique rungs did not, and those are the
 * rungs where self-assessment is hardest — is my scale even, is my wrist
 * collapsing — and where one lesson warns about injury outright. Found by
 * counting rather than by reading, which is the only way a gap that consistent
 * stays invisible.
 *
 * **The numbers.** A lesson that quotes a threshold is making a promise on the
 * app's behalf: "a pass is 90 % accuracy", "the top note at least 1.4 times the
 * rest", "review comes back after 1, 3, 7 and 21 days". Each of those is a
 * constant somewhere in `src`, and nothing joined the two — change the constant
 * and the prose keeps the old number for ever, teaching a standard the app no
 * longer applies. All of them were correct when this was written; that is the
 * state worth keeping.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(process.cwd(), '..');
const LESSONS = join(ROOT, 'content', 'lessons');

function bodies(): { name: string; text: string }[] {
  return readdirSync(LESSONS)
    .filter((name) => name.endsWith('.md'))
    .map((name) => ({
      name,
      text: readFileSync(join(LESSONS, name), 'utf8').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, ''),
    }));
}

/** A source constant, and the wording a lesson uses for it. */
const QUOTED: { where: string; says: RegExp; from: string; holds: RegExp }[] = [
  {
    where: '0.3.md',
    says: /pass\* is 90 % accuracy/,
    from: 'src/data/settingsStore.ts',
    holds: /passAccuracyPct:\s*90\b/,
  },
  {
    where: '0.3.md',
    says: /mastered\* is 97 %/,
    from: 'src/engine/Scoring.ts',
    holds: /masterAccuracy:\s*0\.97\b/,
  },
  {
    where: '0.3.md',
    says: /after 1, 3, 7 and 21 days/,
    from: 'src/data/progressStore.ts',
    holds: /REVIEW_INTERVALS_DAYS = \[1, 3, 7, 21\]/,
  },
  {
    where: 'technique.6.md',
    says: /at least 1\.4 times the rest/,
    from: 'src/engine/Scoring.ts',
    holds: /VOICING_MIN_RATIO = 1\.4\b/,
  },
  {
    where: '3.5.md',
    says: /no overlap longer than 120 ms/,
    from: 'src/engine/drills/special.ts',
    holds: /liftWindowMs \?\? \[0, 120\]/,
  },
  {
    where: '2.4.md',
    says: /at least 1\.6 times/,
    from: 'src/engine/drills/special.ts',
    holds: /targetRatio \?\? 1\.6\b/,
  },
  // Two lessons state the chord boundary, for the same drill, and they
  // disagreed about why. `theory.6` gave the rule the code gives. `jazz.6` said
  // 120 ms was "about four times longer than a spread chord takes", which would
  // make a rolled chord 30 ms — the "four times" had been borrowed from the
  // other side of the code's own comparison, where a quarter note at 120 is
  // 500 ms. Both are pinned here so the number cannot drift and neither
  // sentence can be reworded back into a claim the code does not make.
  {
    where: 'theory.6.md',
    says: /no new note has arrived for 120 milliseconds/,
    from: 'src/engine/drills/harmony.ts',
    holds: /CHORD_BOUNDARY_MS = 120\b/,
  },
  {
    where: 'jazz.6.md',
    says: /finished when no new note has arrived for 120 milliseconds/,
    from: 'src/engine/drills/harmony.ts',
    holds: /CHORD_BOUNDARY_MS = 120\b/,
  },
  {
    // The rung's whole standard, and it was stated at twice its value:
    // sixteenths at a quarter-note pulse of 120 are eight notes a second, not
    // sixteen. Pinned to the tempo on the exercises the learner actually plays.
    where: 'technique.8.md',
    says: /quarter-note pulse of 120\. That is eight notes a second/,
    from: '../tools/content/generate_exercises.py',
    holds: /ScaleSpec\(k, "major", "both", 4, "similar", 0\.25, 120\)/,
  },
  {
    // `theory.9` describes the level-7 sight-reading generator by three of its
    // settings. All three are real, and all three are one edit away from not
    // being — the table is a plain object literal with no test over it.
    where: 'theory.9.md',
    says: /keys with four accidentals, with triplets and a walking bass/,
    from: 'src/engine/sightReading.ts',
    holds: /maxFifths: 4,[\s\S]{0,200}?leftHand: 'walking',[\s\S]{0,120}?triplets: true,/,
  },
  {
    // Stated in figures in `0.3` and in words in `practice.3`; the figures were
    // guarded and the words were not.
    where: 'practice.3.md',
    says: /one, three, seven and twenty-one days after you passed it/,
    from: 'src/data/progressStore.ts',
    holds: /REVIEW_INTERVALS_DAYS = \[1, 3, 7, 21\]/,
  },
];

describe('every lesson keeps its shape', () => {
  it('reads them all, so a wrong path cannot pass as success', () => {
    expect(bodies().length, 'no lessons were read').toBeGreaterThan(80);
  });

  it('ends each one by saying how you know you have got it', () => {
    const silent = bodies()
      .filter(({ text }) => !/how you'll know|when you have got it/i.test(text))
      .map(({ name }) => name);
    expect(
      silent,
      `lessons that never say how to know you have got it:\n${silent.join('\n')}`,
    ).toEqual([]);
  });

  it('points at other modules by their name, not by their slug', () => {
    // `00` §1 again, in prose: an internal identifier does not go in front of a
    // person. `hymns.md` read "this is voicing (see the beautiful-pieces
    // module)", and when that track was struck on 2026-09-12 the sentence
    // became a pointer to nothing — a fault the slug made possible and the
    // human name would not have: "the classical ladder" survives a rename.
    //
    // So this asks the general question rather than checking for one dead
    // name. Every track id, against every lesson body.
    const ids = (
      JSON.parse(readFileSync(join(ROOT, 'content', 'curriculum', '00-tracks.json'), 'utf8')) as {
        tracks: { id: string }[];
      }
    ).tracks
      .map((track) => track.id)
      // Single words that are also ordinary English — `classical`, `jazz`,
      // `holiday`, `practice` — are how a person would say it anyway. A slug is
      // a slug when it is hyphenated.
      .filter((id) => id.includes('-'));
    expect(ids.length, 'no hyphenated track ids were read').toBeGreaterThan(3);
    const named: string[] = [];
    for (const { name, text } of bodies()) {
      for (const id of ids) {
        if (text.includes(id)) named.push(`${name} says "${id}"`);
      }
    }
    expect(named, `lesson prose naming a module by its slug: ${named.join('; ')}`).toEqual([]);
  });

  it('does not name a field, a flag or a file at a learner', () => {
    // The third shape of the same rule. `theory.6.md` explained why a rung had
    // no repertoire with "which is what `songOptional` means on the plan" — a
    // curriculum field name, in front of somebody who has never seen the
    // curriculum file. `camelCase` is the giveaway: English does not have it,
    // so anything written that way in a lesson came out of the code.
    const named: string[] = [];
    for (const { name, text } of bodies()) {
      for (const m of text.replace(/\s+/g, ' ').matchAll(/\b[a-z]+[A-Z][A-Za-z]{2,}\b/g)) {
        named.push(`${name}: ${m[0]}`);
      }
    }
    expect(named, `lesson prose naming something from the code: ${named.join('; ')}`).toEqual([]);
  });

  it('does not cite the repository at a learner', () => {
    // Same rule, other shape. `ragtime.8.md` explained what was missing from the
    // rung with "`docs/02` names three more pieces for this rung" — true, and
    // addressed to whoever maintains the curriculum rather than to the person
    // at the piano, who has no `docs/02`. It also named the GitHub edition the
    // library was quarried from. Both are the repository talking to itself in
    // front of a learner.
    const cited: string[] = [];
    for (const { name, text } of bodies()) {
      const flat = text.replace(/\s+/g, ' ');
      for (const m of flat.matchAll(/docs?\/\d+|`\d\d` §|[a-z0-9-]+\/[a-z0-9-]+\.(?:ts|py|json)/g)) {
        cited.push(`${name}: ${m[0]}`);
      }
    }
    expect(cited, `lesson prose citing the repository: ${cited.join('; ')}`).toEqual([]);
  });

  it('states a reading time that matches the text', () => {
    // `readingTime` was written by hand and meant nothing: across the
    // eighty-six it implied anywhere from 43 to 272 words a minute, and no code
    // has ever read it. It is computed now, at the 200 wpm `03` §6 names.
    //
    // Worth a test because it rotted inside one sitting: three lessons were
    // trimmed after the times were computed and all three were immediately
    // wrong again. A number derived from a file has to be checked against that
    // file or it is decoration.
    const wrong: string[] = [];
    for (const name of readdirSync(LESSONS).filter((n) => n.endsWith('.md'))) {
      const raw = readFileSync(join(LESSONS, name), 'utf8');
      const split = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(raw);
      if (!split) continue;
      const claimed = /^readingTime:\s*(\d+)/m.exec(split[1] ?? '');
      if (!claimed) continue;
      const words = (split[2] ?? '').split(/\s+/).filter(Boolean).length;
      const want = Math.max(1, Math.ceil(words / 200));
      if (Number(claimed[1]) !== want) {
        wrong.push(`${name} says ${String(claimed[1])} min for ${String(words)} words (${String(want)})`);
      }
    }
    expect(wrong, `reading times that do not match the text: ${wrong.join('; ')}`).toEqual([]);
  });

  it('keeps a lesson to the three minutes `03` §6 asks for', () => {
    // A reading time, not a word count.
    //
    // `03` §6 said 400 words from the first commit of the repository, written
    // before a single lesson existed, with no reason beside it and nothing
    // anywhere enforcing it. Seven of the eighty-six had been over it for as
    // long as they had existed. That is a guess, not a limit.
    //
    // What it was evidently reaching for is on the line above it in the same
    // spec: `readingTime`. A lesson is read once before you play, not studied.
    // So the rule is three minutes at 200 words a minute, which is the same
    // intent measured in the unit that carries it — and it takes the exceptions
    // from seven to two, because the five in between are long paragraphs rather
    // than long lessons.
    //
    // The two that remain cover rungs that are several ideas: a whole rag with
    // a trio and a key change, and the Romantic miniature rung with
    // twenty-one pieces on it. The list is named so it cannot grow quietly.
    const MINUTES = 3;
    const WPM = 200;
    const KNOWN_LONG = new Set(['ragtime.6.md', 'classical.6.md']);
    const over = bodies()
      .map(({ name, text }) => ({
        name,
        minutes: Math.ceil(text.split(/\s+/).filter(Boolean).length / WPM),
      }))
      .filter(({ name, minutes }) => minutes > MINUTES && !KNOWN_LONG.has(name))
      .map(({ name, minutes }) => `${name} reads in ${String(minutes)} min`);
    expect(over, `lessons over ${String(MINUTES)} minutes and not on the list: ${over.join('; ')}`).toEqual(
      [],
    );
  });

  // There is deliberately no test that every lesson names a mistake.
  //
  // The first draft had one, and it failed on four technique lessons that warn
  // perfectly well — "a hand that plays every octave 1-5 will not survive D
  // flat", "if it aches, stop; there is no version of this rung worth an
  // injury", "inventing your own fingering here will cost you later". What it
  // had found was the phrasings its own regex knew. A closing self-check is a
  // convention worth holding to, because eighty-one lessons used the same six
  // words for it. Warning a learner off a trap is not a convention, it is
  // writing, and a test insisting on a vocabulary for it enforces my regex on
  // somebody's prose.
});

describe('a lesson that counts its rung’s pieces counts them right', () => {
  // Six lessons tell the learner how much is waiting — "Twelve options",
  // "Eleven options" — and then enumerate them. Two were wrong: ragtime.7 said
  // eleven and offered twelve, ragtime.8 said eight and offered twelve, because
  // pieces were wired onto the rungs afterwards and the prose was never told.
  // The failure is worse than a stale number: both lessons list the options by
  // name, so the sentence and the list under it disagreed on the same page.
  //
  // Pieces, not pieces-plus-exercises. Every one of these paragraphs is about
  // repertoire — "Twelve options, all Joplin" — and the exercises are counted
  // separately where they are counted at all.
  const WORDS: Record<string, number> = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
    nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
    fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
    twenty: 20, 'twenty-one': 21, 'twenty-two': 22, 'twenty-three': 23,
    'twenty-four': 24, 'twenty-five': 25,
  };

  /** Every rung's id, against the number of pieces offered on it. */
  function offered(): Map<string, number> {
    const counts = new Map<string, number>();
    for (const file of readdirSync(join(ROOT, 'content', 'curriculum'))) {
      if (!/^stage-\d+\.json$/.test(file)) continue;
      const doc = JSON.parse(
        readFileSync(join(ROOT, 'content', 'curriculum', file), 'utf8'),
      ) as { stages?: { units?: { lessons?: { id: string; songOptions?: string[] }[] }[] }[] };
      for (const stage of doc.stages ?? []) {
        for (const unit of stage.units ?? []) {
          for (const lesson of unit.lessons ?? []) {
            counts.set(lesson.id, (lesson.songOptions ?? []).length);
          }
        }
      }
    }
    return counts;
  }

  it('matches the rung, wherever a lesson states the number', () => {
    const counts = offered();
    expect(counts.size, 'no rungs were read').toBeGreaterThan(80);
    const spoken = Object.keys(WORDS).sort((a, b) => b.length - a.length).join('|');
    const states = new RegExp(`(${spoken}|[0-9]+) options`, 'i');
    const wrong: string[] = [];
    let checked = 0;
    for (const { name, text } of bodies()) {
      const match = states.exec(text.replace(/\s+/g, ' '));
      if (!match) continue;
      const token = (match[1] ?? '').toLowerCase();
      const claimed = WORDS[token] ?? Number.parseInt(token, 10);
      const actual = counts.get(name.replace(/\.md$/, ''));
      if (!Number.isFinite(claimed) || actual === undefined) continue;
      checked += 1;
      if (actual !== claimed) {
        wrong.push(`${name} says ${String(claimed)}, the rung offers ${String(actual)}`);
      }
    }
    expect(checked, 'no lesson stated a count — has the wording changed?').toBeGreaterThan(3);
    expect(wrong, `a lesson counting its rung wrong:\n${wrong.join('\n')}`).toEqual([]);
  });
});

describe('a lesson quoting one of the app’s numbers quotes the right one', () => {
  for (const quote of QUOTED) {
    it(`${quote.where}: ${quote.says.source}`, () => {
      // Whitespace-flattened: these sentences wrap, and a threshold that spans
      // a line break is the same promise as one that does not.
      const lesson = readFileSync(join(LESSONS, quote.where), 'utf8').replace(/\s+/g, ' ');
      expect(
        quote.says.test(lesson),
        `${quote.where} no longer says this — if the wording changed, change this test with it`,
      ).toBe(true);
      const source = readFileSync(join(process.cwd(), quote.from), 'utf8');
      expect(
        quote.holds.test(source),
        `${quote.where} promises a number ${quote.from} no longer holds`,
      ).toBe(true);
    });
  }
});
