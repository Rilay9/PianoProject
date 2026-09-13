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
