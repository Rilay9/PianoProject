// @vitest-environment node
/**
 * Never teach wrong (F0, 2026-09-26): the lesson sentences a test can hold to
 * the truth, not only to the app.
 *
 * `lessonClaimsAboutApp.test.ts` and `lessonClaimsAboutMusic.test.ts` prove
 * that a lesson *agrees with the app* — its rung, its drills, its scores.
 * Agreement is not truth (the reviewer's permanent design rule, 2026-09-26,
 * matrix row M11): the rhythm lesson said the note values were each "twice the
 * one below it" over a list printed shortest first, the dotted-note lesson
 * said its rule held "for every dotted note you will ever meet", and every
 * claims row passed, because no row read either sentence against the
 * arithmetic. And the half-pedal lesson said a part-way pedal "clears the
 * treble while the bass keeps ringing", which no row could have caught
 * because the app's own drill comment says the same thing.
 *
 * So this file checks, over every lesson in `content/lessons` (the source, so
 * it needs no content build):
 *
 * 1. **The note-value arithmetic (T28, T29).** Every sentence that gives a
 *    note value a number of beats, every "twice/half the one above/below"
 *    against the list it describes, every sum written out ("2 + 1 = 3"), and
 *    no claim that the add-half rule covers every dotted note, which is false
 *    once a second dot appears (a second dot adds half of what the first one
 *    added: Hutchinson, *Music Theory for the 21st-Century Classroom*, §4.3).
 *    The beat is the quarter note, which is what the lessons that state values
 *    count in (4/4 and 3/4); the one lesson in compound time states no
 *    note-value-to-beat sum this parser reads.
 * 2. **The half pedal is partial damping, not a treble filter (T31).** A
 *    damper held part-way still touches the strings it covers and cuts the
 *    loud part of the sound short (Lehtonen, Askenfelt and Välimäki, "Analysis
 *    of the part-pedaling effect in the piano", JASA 126(2) EL49–EL54, 2009,
 *    doi:10.1121/1.3162438). No lesson may describe it as clearing the treble
 *    while the bass rings, and the half-pedal lesson has to say what the
 *    dampers do.
 * 3. **One fact, two places (T51).** The half-pedal lesson names the range
 *    the Score screen's technique measure prints, taken from the exercise's
 *    own catalog row; and the drill screen's labels for that measure name the
 *    range as a range, not as readings the player sent.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PracticeEngine } from '../../src/engine/PracticeEngine';
import { DEFAULT_HALF_PEDAL_RANGE, techniqueMeasureFor } from '../../src/engine/Scoring';
import { drillDetailLabel } from '../../src/ui/help';
import type { CatalogItem } from '../../src/curriculum/types';
import { makeModel, note } from './helpers/engineHarness';

const LESSONS = resolve('..', 'content', 'lessons');
const CONTENT = join(process.cwd(), 'public', 'content');

/** Every lesson's body, front matter dropped, emphasis marks removed, whitespace flattened. */
function lessons(): { id: string; text: string }[] {
  return readdirSync(LESSONS)
    .filter((name) => name.endsWith('.md'))
    .sort()
    .map((name) => {
      const raw = readFileSync(join(LESSONS, name), 'utf8');
      const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
      return { id: name.replace(/\.md$/, ''), text: body.replace(/\*/g, '').replace(/\s+/g, ' ') };
    });
}

/** One lesson's body with its paragraphs kept, emphasis marks removed. */
function paragraphs(id: string): string[] {
  const raw = readFileSync(join(LESSONS, `${id}.md`), 'utf8').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
  return raw
    .split(/\r?\n\s*\r?\n/)
    .map((para) => para.replace(/\*/g, '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

// --- 1. the note-value arithmetic ------------------------------------------

/** Beats in a note value, counting the quarter note as the beat. */
const BEATS: Record<string, number> = { whole: 4, half: 2, quarter: 1, eighth: 0.5, sixteenth: 0.25 };
const DOTS: Record<string, number> = { '': 1, 'dotted ': 1.5, 'double-dotted ': 1.75 };

/** A number of beats as a lesson writes it. */
const NUMBER =
  '(\\d+(?:\\.\\d+)?[½¼¾]?|[½¼¾]|one and a half|two and a half|three and a half|half a|a quarter of a|one|two|three|four|six|eight)';
const WORD_VALUE: Record<string, number> = {
  'one and a half': 1.5,
  'two and a half': 2.5,
  'three and a half': 3.5,
  'half a': 0.5,
  'a quarter of a': 0.25,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  six: 6,
  eight: 8,
};

function numberOf(token: string): number {
  const word = WORD_VALUE[token.toLowerCase()];
  if (word !== undefined) return word;
  const fraction = { '½': 0.5, '¼': 0.25, '¾': 0.75 } as Record<string, number>;
  const last = token.slice(-1);
  if (fraction[last] !== undefined) {
    const whole = token.slice(0, -1);
    return (whole === '' ? 0 : Number(whole)) + (fraction[last] ?? 0);
  }
  return Number(token);
}

const VALUE = '(double-dotted |dotted )?(whole|half|quarter|eighth|sixteenth)';

/**
 * The two shapes a lesson uses to give a value its beats: a verb ("a dotted
 * half note lasts three beats", "a dotted quarter is one and a half beats",
 * "a quarter note — a filled head — lasts one beat"), and the list form
 * ("Half note — hollow head, stem: 2 beats").
 */
const STATES = [
  new RegExp(`\\b${VALUE}(?: note)?\\s*(?:—[^—.]{0,60}—\\s*)?(?:lasts|is|gets|takes)\\s+${NUMBER}\\s+beats?\\b`, 'gi'),
  new RegExp(`\\b${VALUE}(?: note)?\\s*—[^.:—]{0,40}:\\s*${NUMBER}\\s+beats?\\b`, 'gi'),
];

interface Stated {
  lesson: string;
  at: number;
  said: string;
  beats: number;
  want: number;
}

function statedValues(id: string, text: string): Stated[] {
  const out: Stated[] = [];
  for (const pattern of STATES) {
    for (const found of text.matchAll(pattern)) {
      const dots = (found[1] ?? '').toLowerCase();
      const value = (found[2] ?? '').toLowerCase();
      out.push({
        lesson: id,
        at: found.index ?? 0,
        said: found[0],
        beats: numberOf(found[3] ?? ''),
        want: (BEATS[value] ?? Number.NaN) * (DOTS[dots] ?? Number.NaN),
      });
    }
  }
  return out.sort((a, b) => a.at - b.at);
}

/** "2 + 1 = 3", "2 + 1 + ½ = 3½": every written sum, evaluated. */
function writtenSums(text: string): { said: string; holds: boolean }[] {
  const term = '(\\d+(?:\\.\\d+)?[½¼¾]?|[½¼¾])';
  const sum = new RegExp(`${term}((?:\\s*\\+\\s*${term})+)\\s*=\\s*${term}`, 'g');
  return [...text.matchAll(sum)].map((found) => {
    const terms = found[0]
      .split('=')[0]
      ?.split('+')
      .map((part) => numberOf(part.trim())) ?? [];
    const total = numberOf((found[0].split('=')[1] ?? '').trim());
    return { said: found[0], holds: Math.abs(terms.reduce((a, b) => a + b, 0) - total) < 1e-9 };
  });
}

/**
 * "each is twice the one above it", "twice as long as the one above it", "half
 * the one below": the relation, checked against the run of stated values it
 * follows in the same lesson — the list it is describing.
 */
function relations(id: string, text: string): { said: string; holds: boolean }[] {
  const stated = statedValues(id, text);
  const out: { said: string; holds: boolean }[] = [];
  for (const found of text.matchAll(/\b(twice|half)(?: as long as)? the one (above|below)\b/gi)) {
    const at = found.index ?? 0;
    const before = stated.filter((s) => s.at < at).slice(-3).map((s) => s.beats);
    if (before.length < 2) {
      out.push({ said: `${found[0]} (no list of values before it)`, holds: false });
      continue;
    }
    const twice = (found[1] ?? '').toLowerCase() === 'twice';
    const above = (found[2] ?? '').toLowerCase() === 'above';
    // Each item compared with its neighbour in the direction the sentence names.
    const ratio = twice === above ? 2 : 0.5;
    const holds = before.slice(1).every((beats, index) => beats === (before[index] ?? 0) * ratio);
    out.push({ said: `${found[0]} over [${before.join(', ')}]`, holds });
  }
  return out;
}

describe('every lesson that states a note value states it right (T28, T29)', () => {
  const all = lessons();

  it('reads the lessons the finding was about, so the sweep is not vacuous', () => {
    const byId = new Map(all.map((lesson) => [lesson.id, lesson.text]));
    // The rhythm lesson lists three values and relates them; the dotted-note
    // lesson states a dotted value; the eighth-note lesson states the eighth.
    expect(statedValues('1.2', byId.get('1.2') ?? '').length).toBeGreaterThanOrEqual(3);
    expect(relations('1.2', byId.get('1.2') ?? '').length).toBeGreaterThanOrEqual(1);
    expect(statedValues('1.4', byId.get('1.4') ?? '').some((s) => /dotted/i.test(s.said))).toBe(true);
    expect(statedValues('2.2', byId.get('2.2') ?? '').some((s) => /eighth/i.test(s.said))).toBe(true);
  });

  it('gives every value the beats it has, a dot adding half and a second dot a quarter', () => {
    const wrong = all
      .flatMap(({ id, text }) => statedValues(id, text))
      .filter((s) => s.beats !== s.want)
      .map((s) => `${s.lesson}: "${s.said}" says ${String(s.beats)}, the value is ${String(s.want)}`);
    expect(wrong, wrong.join('\n')).toEqual([]);
  });

  it('writes every sum correctly', () => {
    const wrong = all.flatMap(({ id, text }) =>
      writtenSums(text)
        .filter((sum) => !sum.holds)
        .map((sum) => `${id}: "${sum.said}"`),
    );
    expect(wrong, wrong.join('\n')).toEqual([]);
  });

  it('relates each value to its neighbour in the direction the list is printed', () => {
    const wrong = all.flatMap(({ id, text }) =>
      relations(id, text)
        .filter((relation) => !relation.holds)
        .map((relation) => `${id}: "${relation.said}"`),
    );
    expect(wrong, wrong.join('\n')).toEqual([]);
  });

  it('never says the add-half rule covers every dotted note — a second dot adds a quarter', () => {
    const wrong: string[] = [];
    for (const { id } of all) {
      for (const para of paragraphs(id)) {
        const universal = /\b(every|any|all) dotted notes?\b/i.exec(para);
        if (!universal) continue;
        if (/\b(second dot|two dots|double[- ]dot)/i.test(para)) continue;
        wrong.push(`${id}: "${universal[0]}" with no word about a second dot`);
      }
    }
    expect(wrong, wrong.join('\n')).toEqual([]);
  });
});

// --- 2. the half pedal ------------------------------------------------------

describe('no lesson teaches the half pedal as a treble filter (T31)', () => {
  it('never describes a part-way pedal as clearing the treble while the bass rings', () => {
    const wrong: string[] = [];
    for (const { id, text } of lessons()) {
      for (const sentence of text.split(/(?<=[.!?])\s+/)) {
        if (!/pedal|damper|part[- ]way/i.test(sentence) && !/clears the treble/i.test(sentence)) continue;
        if (/clears? the treble|treble clears/i.test(sentence) || (/\btreble\b/i.test(sentence) && /\bbass\b/i.test(sentence))) {
          wrong.push(`${id}: "${sentence}"`);
        }
      }
    }
    expect(wrong, wrong.join('\n')).toEqual([]);
  });

  it('says what the dampers do when the pedal is part-way: they still touch the strings', () => {
    const para = paragraphs('technique.7').find((p) => p.startsWith('Half pedal.')) ?? '';
    expect(para, 'technique.7 has no Half pedal paragraph').not.toBe('');
    expect(para).toMatch(/dampers?\b[^.]*\b(touch|brush|rest)\w*[^.]*\bstrings?\b/i);
  });
});

// --- 3. one fact, two places (T51) -------------------------------------------

const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];

/** The range the half-pedal exercise on technique.7 asks for, from its own row. */
function halfPedalRange(): [number, number] {
  const row = catalog.find((item) => item.id === 'exercise.pedal.half-pedal.a');
  const asked = row?.drill?.params?.ccRange;
  return Array.isArray(asked) && asked.length === 2 ? [Number(asked[0]), Number(asked[1])] : DEFAULT_HALF_PEDAL_RANGE;
}

describe('the half-pedal lesson and the measure say the same thing (T51)', () => {
  it('names the range the Score screen prints, and the ends of the pedal it is measured between', () => {
    const [low, high] = halfPedalRange();
    // The measure's own sentence for a run held part-way, built by the code
    // that prints it on the Score screen.
    const model = makeModel([
      { onset: 0, notes: [note({ midi: 60 })] },
      { onset: 1, notes: [note({ midi: 62 })] },
    ]);
    const engine = new PracticeEngine(model, { mode: 'tempo', countInBars: 0 });
    engine.start();
    for (const [index, value] of [0, 60, 64, 70, 0].entries()) {
      engine.feed({ kind: 'cc', cc: 64, value, tMs: index * 100 });
    }
    const row = catalog.find((item) => item.id === 'exercise.pedal.half-pedal.a');
    const measure = techniqueMeasureFor(row?.drill ?? null, engine.state.score, []);
    expect(measure?.text).toContain(`between ${String(low)} and ${String(high)}`);
    expect(measure?.text).toContain('with the pedal down');

    const para = paragraphs('technique.7').find((p) => p.startsWith('Half pedal.')) ?? '';
    expect(para).toContain(`between ${String(low)} and ${String(high)}`);
    expect(para).toMatch(/\b0\b[^.]*\bup\b/);
    expect(para).toMatch(/\b127\b[^.]*\bdown\b/);
    expect(para).toMatch(/pedal was down|pedal is down|with the pedal down/);
  });

  it('labels the range on the drill screen as a range, and two different counts differently', () => {
    // `halfPedalLow` and `halfPedalHigh` carry the exercise's range, not a
    // reading the player sent (`special.ts` PedalDrill.halfPedalResult).
    for (const key of ['halfPedalLow', 'halfPedalHigh']) {
      expect(drillDetailLabel(key), key).not.toMatch(/reading/i);
    }
    // `inRange` counts readings inside the range; `partialPedalMessages`
    // counts every reading neither fully up nor fully down. Two numbers, so
    // two labels.
    expect(drillDetailLabel('inRange')).not.toBe(drillDetailLabel('partialPedalMessages'));
  });
});
