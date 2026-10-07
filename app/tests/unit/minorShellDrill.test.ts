/**
 * CK-6, the app half: the minor ii-V-i shell drill asks what music21 says it should (A7b.1, G6a).
 *
 * `drill.jazz.minor-ii-v-i-shells` carries nine cases as data — iiø7, V7 and the tonic the chart
 * prints, in C minor (Cm6), A minor (Am7) and G minor (Gm7) — and asks each as a three-note shell
 * named by its symbol. `tools/content/tests/fixtures/ck6_minor_shells.json` is music21's reading
 * of those nine (written and held by `tools/content/tests/test_ck6_minor_shells.py`); here the
 * **built** row's prompts are held to it: the pitch classes, three notes, no fifth, the label
 * naming the symbol, the numeral and the key, and the answer staff behind *Show me* spelling each
 * member as music21 spells it. The app's output is the thing tested, never the witness.
 *
 * The checker is a pair of plain functions so that every adversary the brief names can be run
 * through it and seen to go red: today's major-scale construction (C-E-B for the C minor tonic),
 * a natural-minor dominant, a sharp where the flat side wants a flat, an m7 shell where the chart
 * prints Cm6, a case list of eight.
 *
 * Reads `public/content/catalog.json`: rebuild content before this sees a row edit.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { drillFromCatalog } from '../../src/engine/drills/fromCatalog';
import { answerSheet, sheetForPrompt } from '../../src/engine/drills/answerSheet';
import type { CatalogItem } from '../../src/curriculum/types';
import type { DrillPrompt } from '../../src/engine/drills/types';

const ID = 'drill.jazz.minor-ii-v-i-shells';

interface Spelled {
  name: string;
  step: string;
  alter: number;
  pc: number;
}

interface FixtureCase {
  key: string;
  numeral: string;
  symbol: string;
  symbol_root: Spelled;
  fifth: Spelled | null;
  shell: Spelled[];
  shell_pcs: number[];
  /** music21's `key.Key(tonic).sharps` for the key the prompt names (G6b). */
  key_sharps: number;
  /** The accidental each shell member is written with against that signature; null when it gives it. */
  shell_accidentals: ('flat' | 'natural' | 'sharp' | null)[];
}

const fixture = JSON.parse(
  readFileSync(join(process.cwd(), '..', 'tools', 'content', 'tests', 'fixtures', 'ck6_minor_shells.json'), 'utf8'),
) as { item: string; cases: FixtureCase[] };

const catalog = JSON.parse(readFileSync(resolve('public/content/catalog.json'), 'utf8')) as CatalogItem[];

function builtRow(): CatalogItem {
  const item = catalog.find((entry) => entry.id === ID);
  expect(item, `${ID} is not in the built catalogue`).toBeDefined();
  return item as CatalogItem;
}

function withParams(params: Record<string, unknown>): CatalogItem {
  const row = builtRow();
  return { ...row, drill: { ...(row.drill as NonNullable<CatalogItem['drill']>), params } };
}

function promptsOf(item: CatalogItem, seed?: number): DrillPrompt[] {
  const drill = drillFromCatalog(item, seed === undefined ? {} : { seed });
  expect(drill, `${item.id} builds no drill`).not.toBeNull();
  const out: DrillPrompt[] = [];
  for (let prompt = drill?.next() ?? null; prompt; prompt = drill?.next() ?? null) out.push(prompt);
  return out;
}

/** music21's `E-` and `G#` as a chord symbol prints them. */
function display(name: string): string {
  return name.replace(/-/g, '♭').replace(/#/g, '♯');
}

/** The symbol as the lesson and the record write it, its root spelled as music21 spells it. */
function displaySymbol(fc: FixtureCase): string {
  const quality = fc.symbol.replace(/^[A-G][#-]?/, '').replace(/b(?=\d)/g, '♭').replace(/#(?=\d)/g, '♯');
  return `${display(fc.symbol_root.name)}${quality}`;
}

const pcOf = (midi: number): number => ((midi % 12) + 12) % 12;

const STEP_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Every `<pitch>` on a staff, as step and alter. */
function staffPitches(xml: string): { step: string; alter: number; pc: number }[] {
  const out: { step: string; alter: number; pc: number }[] = [];
  for (const match of xml.matchAll(/<pitch>\s*<step>([A-G])<\/step>\s*(?:<alter>(-?\d+)<\/alter>\s*)?<octave>/g)) {
    const step = match[1] as string;
    const alter = Number(match[2] ?? 0);
    out.push({ step, alter, pc: pcOf((STEP_PC[step] ?? 0) + alter) });
  }
  return out;
}

/** The staff's `<fifths>`, or null when it writes none. */
function staffFifths(xml: string): number | null {
  const match = /<fifths>(-?\d+)<\/fifths>/.exec(xml);
  return match ? Number(match[1]) : null;
}

/** What a key signature of `fifths` does to each letter: −1, 0 or +1. */
function signatureAlter(fifths: number, step: string): number {
  if (fifths > 0) return 'FCGDAEB'.slice(0, fifths).includes(step) ? 1 : 0;
  if (fifths < 0) return 'BEADGCF'.slice(0, -fifths).includes(step) ? -1 : 0;
  return 0;
}

/** The accidental a written pitch needs under the signature, as engraving reads it; null when none. */
function impliedAccidental(fifths: number, pitch: { step: string; alter: number }): 'flat' | 'natural' | 'sharp' | null {
  if (pitch.alter === signatureAlter(fifths, pitch.step)) return null;
  return pitch.alter < 0 ? 'flat' : pitch.alter > 0 ? 'sharp' : 'natural';
}

type Sheet = (prompt: DrillPrompt) => string | null;
const realSheet: Sheet = (prompt) => sheetForPrompt(prompt);

/** What is wrong with one prompt as the ask for one case; empty when nothing is. */
function caseFaults(prompt: DrillPrompt, fc: FixtureCase, sheet: Sheet = realSheet): string[] {
  const out: string[] = [];
  const name = `${fc.symbol} in ${fc.key}`;
  if (prompt.expected.length !== 3) out.push(`${name}: ${prompt.expected.length} notes, not three`);
  const pcs = [...new Set(prompt.expected.map(pcOf))].sort((a, b) => a - b);
  if (JSON.stringify(pcs) !== JSON.stringify(fc.shell_pcs)) {
    out.push(`${name}: asks pitch classes ${JSON.stringify(pcs)}, music21's shell is ${JSON.stringify(fc.shell_pcs)}`);
  }
  if (fc.fifth && pcs.includes(fc.fifth.pc)) out.push(`${name}: the fifth (${fc.fifth.name}) is asked`);
  const symbol = displaySymbol(fc);
  if (!prompt.label.includes(symbol)) out.push(`${name}: label "${prompt.label}" does not name ${symbol}`);
  if (!prompt.label.includes(fc.numeral)) out.push(`${name}: label "${prompt.label}" does not name ${fc.numeral}`);
  const keyName = display(fc.key);
  if (!prompt.label.includes(keyName)) out.push(`${name}: label "${prompt.label}" does not name ${keyName}`);
  const xml = sheet(prompt);
  if (xml === null) {
    out.push(`${name}: no answer staff`);
  } else {
    const written = staffPitches(xml);
    const fifths = staffFifths(xml);
    if (fifths !== fc.key_sharps) {
      out.push(`${name}: the staff's signature is ${String(fifths)} fifths, ${fc.key} is ${fc.key_sharps}`);
    }
    fc.shell.forEach((member, at) => {
      const want = fc.shell_accidentals[at] ?? null;
      for (const pitch of written.filter((p) => p.pc === member.pc)) {
        const got = fifths === null ? null : impliedAccidental(fifths, pitch);
        if (got !== want) out.push(`${name}: ${display(member.name)} is written with ${String(got)}, music21 says ${String(want)}`);
      }
    });
    for (const member of fc.shell) {
      const on = written.filter((pitch) => pitch.pc === member.pc);
      if (on.length === 0) out.push(`${name}: ${display(member.name)} is not on the answer staff`);
      for (const pitch of on) {
        if (pitch.step !== member.step || pitch.alter !== member.alter) {
          out.push(`${name}: the staff writes ${pitch.step}${pitch.alter > 0 ? '♯' : pitch.alter < 0 ? '♭' : ''} where music21 spells ${display(member.name)}`);
        }
      }
    }
  }
  return out;
}

/** The run as a whole: ten prompts, the nine cases in order once each, the tenth the first again. */
function runFaults(prompts: DrillPrompt[], cases: FixtureCase[], sheet: Sheet = realSheet): string[] {
  const out: string[] = [];
  if (prompts.length !== 10) out.push(`${prompts.length} prompts, not the default ten`);
  cases.forEach((fc, index) => {
    const prompt = prompts[index];
    if (!prompt) out.push(`no prompt ${index + 1} for ${fc.symbol} in ${fc.key}`);
    else out.push(...caseFaults(prompt, fc, sheet));
  });
  const first = cases[0];
  const tenth = prompts[9];
  if (first && tenth) {
    const again = caseFaults(tenth, first, sheet);
    if (again.length > 0) out.push(`prompt 10 is not case 1 again: ${again.join('; ')}`);
  }
  if (new Set(prompts.slice(0, 9).map((p) => p.label)).size !== 9) out.push('the first nine labels are not nine distinct cases');
  return out;
}

describe('CK-6: the built row asks music21’s nine shells', () => {
  it('the fixture is this item’s and holds the nine settled cases', () => {
    expect(fixture.item).toBe(ID);
    expect(fixture.cases.map((fc) => `${fc.numeral} ${fc.symbol} ${fc.key}`)).toEqual([
      'iiø7 Dm7b5 C minor',
      'V7 G7 C minor',
      'i Cm6 C minor',
      'iiø7 Bm7b5 A minor',
      'V7 E7 A minor',
      'i Am7 A minor',
      'iiø7 Am7b5 G minor',
      'V7 D7 G minor',
      'i Gm7 G minor',
    ]);
  });

  it('the row carries the fixture’s cases, as shells', () => {
    const params = builtRow().drill?.params ?? {};
    expect(params.voicing).toBe('shell');
    expect(
      (params.cases as { key: string; numeral: string; symbol: string }[]).map((c) => [c.key, c.numeral, c.symbol]),
    ).toEqual(fixture.cases.map((fc) => [fc.key, fc.numeral, fc.symbol]));
  });

  it('every prompt agrees with music21: members, three notes, no fifth, the symbol named, the staff spelled', () => {
    expect(runFaults(promptsOf(builtRow()), fixture.cases)).toEqual([]);
  });

  it('the answer staff is written in the key the prompt names (G6b; the reviewer’s ph1-g6a-landing §3)', () => {
    // Pinned as literals as well as against the fixture: three flats for C minor, none for A
    // minor, two flats for G minor; the chromatic members carry their accidentals against that
    // signature (G7's B natural, Cm6's A natural, E7's G sharp, D7's F sharp) and nothing else does.
    const want: [string, number, string[]][] = [
      ['Dm7♭5 — iiø7 in C minor', -3, []],
      ['G7 — V7 in C minor', -3, ['B natural']],
      ['Cm6 — i in C minor', -3, ['A natural']],
      ['Bm7♭5 — iiø7 in A minor', 0, []],
      ['E7 — V7 in A minor', 0, ['G sharp']],
      ['Am7 — i in A minor', 0, []],
      ['Am7♭5 — iiø7 in G minor', -2, []],
      ['D7 — V7 in G minor', -2, ['F sharp']],
      ['Gm7 — i in G minor', -2, []],
    ];
    const got = promptsOf(builtRow())
      .slice(0, 9)
      .map((prompt): [string, number, string[]] => {
        const xml = sheetForPrompt(prompt) ?? '';
        const fifths = staffFifths(xml) ?? Number.NaN;
        const marked = staffPitches(xml)
          .map((pitch) => [pitch.step, impliedAccidental(fifths, pitch)] as const)
          .filter(([, accidental]) => accidental !== null)
          .map(([step, accidental]) => `${step} ${String(accidental)}`);
        return [prompt.label, fifths, marked];
      });
    expect(got).toEqual(want);
    expect(fixture.cases.map((fc) => fc.key_sharps)).toEqual(want.map(([, fifths]) => fifths));
  });

  it('boundary, expected green: Am7♭5’s shell is Am7’s (the ♭5 is the omitted member)', () => {
    const prompts = promptsOf(builtRow());
    const pcs = (index: number) => [...new Set((prompts[index] as DrillPrompt).expected.map(pcOf))].sort((a, b) => a - b);
    expect(prompts[6]?.label).toContain('Am7♭5');
    expect(prompts[5]?.label).toContain('Am7');
    expect(pcs(6)).toEqual(pcs(5));
  });
});

describe('population and count (the completion rule in the design ruling §1 reads this)', () => {
  const message =
    'the case list, the count or the cycling changed: re-read docs/review/responses/a7b1-bluebossa-design.md §1 before this goes green again';

  it('ten prompts; 1-9 are the nine cases once each in order; 10 is case 1', () => {
    expect(runFaults(promptsOf(builtRow()), fixture.cases), message).toEqual([]);
  });

  it('the order does not depend on the seed, so *Again* asks the same nine', () => {
    const labels = (seed?: number) => promptsOf(builtRow(), seed).map((p) => p.label);
    expect(labels(1), message).toEqual(labels());
    expect(labels(99), message).toEqual(labels());
  });
});

// Revised (G6b): G6a's test pinned the item to no stage file until G6b placed it; it is on jazz.6 now and on
// no other stage file. The rung's options and requirement are `jazz6MinorShellCompletion.test.ts`'s.
describe('placed on jazz.6 alone (G6b)', () => {
  it('stage-6.json lists the item and no other stage file does', () => {
    const dir = resolve('..', 'content', 'curriculum');
    for (const file of readdirSync(dir).filter((name) => /^stage-.*\.json$/.test(name))) {
      expect(readFileSync(join(dir, file), 'utf8').includes(ID), `${file} and ${ID}`).toBe(file === 'stage-6.json');
    }
  });
});

describe('every adversary goes red', () => {
  it('today’s machinery (keys, progression ii-V-i, shell) asks C-E-B for the C minor tonic', () => {
    const prompts = promptsOf(withParams({ keys: ['C', 'A', 'G'], progression: 'ii-V-i', voicing: 'shell' }));
    const faults = runFaults(prompts, fixture.cases);
    expect(faults.some((fault) => fault.startsWith('Cm6 in C minor: asks pitch classes [0,4,11]'))).toBe(true);
  });

  it('a major-seventh tonic (C-E-B) in place of Cm6', () => {
    const prompt: DrillPrompt = { index: 2, label: 'Cm6 — i in C minor', expected: [60, 64, 71] };
    expect(caseFaults(prompt, fixture.cases[2] as FixtureCase).length).toBeGreaterThan(0);
  });

  it('a natural-minor dominant (G-B♭-F) in C minor', () => {
    const prompt: DrillPrompt = { index: 1, label: 'G7 — V7 in C minor', expected: [67, 70, 77] };
    expect(caseFaults(prompt, fixture.cases[1] as FixtureCase).length).toBeGreaterThan(0);
  });

  it('a sharp where the flat side wants a flat: D♯ for Cm6’s third, A♯ for Gm7’s', () => {
    const sharpSheet: Sheet = (prompt) =>
      answerSheet({
        title: prompt.label,
        notes: prompt.expected,
        ordered: false,
        spelling: { fifths: 0, blackKeys: { 3: 'sharp', 10: 'sharp' } },
      });
    const prompts = promptsOf(builtRow());
    for (const index of [2, 8]) {
      const faults = caseFaults(prompts[index] as DrillPrompt, fixture.cases[index] as FixtureCase, sharpSheet);
      expect(faults.some((fault) => fault.includes('the staff writes')), `case ${index + 1}`).toBe(true);
    }
  });

  it('the signature chosen from the notes (the staff before G6b): Cm6 under two flats, E7 under three sharps, D7 under one sharp', () => {
    const nearestSheet: Sheet = (prompt) => answerSheet({ title: prompt.label, notes: prompt.expected, ordered: false });
    const prompts = promptsOf(builtRow());
    for (const index of [2, 4, 7]) {
      const faults = caseFaults(prompts[index] as DrillPrompt, fixture.cases[index] as FixtureCase, nearestSheet);
      expect(faults.some((fault) => fault.includes('signature')), `case ${index + 1}`).toBe(true);
    }
    // D7 in G minor under two flats with no spelling of its own: the black key follows the flat
    // signature and F sharp comes out G flat.
    const flatSide: Sheet = (prompt) =>
      answerSheet({ title: prompt.label, notes: prompt.expected, ordered: false, spelling: { fifths: -2 } });
    const faults = caseFaults(prompts[7] as DrillPrompt, fixture.cases[7] as FixtureCase, flatSide);
    expect(faults.some((fault) => fault.includes('the staff writes G♭')), faults.join('; ')).toBe(true);
  });

  it('the accidental check bites: G7 in C minor held to “no accidental” fails on its B natural', () => {
    const prompts = promptsOf(builtRow());
    const noNatural = { ...(fixture.cases[1] as FixtureCase), shell_accidentals: [null, null, null] };
    const faults = caseFaults(prompts[1] as DrillPrompt, noNatural);
    expect(faults.some((fault) => fault.includes('B is written with natural')), faults.join('; ')).toBe(true);
  });

  it('a root spelled as its enharmonic sharp on the label', () => {
    const prompts = promptsOf(builtRow());
    const prompt = { ...(prompts[2] as DrillPrompt), label: 'B♯m6 — i in C minor' };
    expect(caseFaults(prompt, fixture.cases[2] as FixtureCase).length).toBeGreaterThan(0);
  });

  it('an m7 shell (C-E♭-B♭) configured where the chart prints Cm6', () => {
    const params = builtRow().drill?.params ?? {};
    const cases = (params.cases as { key: string; numeral: string; symbol: string }[]).map((c, index) =>
      index === 2 ? { ...c, symbol: 'Cm7' } : c,
    );
    const faults = runFaults(promptsOf(withParams({ ...params, cases })), fixture.cases);
    expect(faults.some((fault) => fault.startsWith('Cm6 in C minor: asks pitch classes [0,3,10]'))).toBe(true);
  });

  it('a case list of eight fails the population check', () => {
    const params = builtRow().drill?.params ?? {};
    const cases = (params.cases as unknown[]).filter((_, index) => index !== 5);
    expect(runFaults(promptsOf(withParams({ ...params, cases })), fixture.cases).length).toBeGreaterThan(0);
  });
});
