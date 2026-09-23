// @vitest-environment node
/**
 * The one table of explanations, and the spec section that prints it.
 *
 * The owner, 2026-09-22: *"there's not enough context or explanation given in
 * the modes and exercises."* `ui/help.ts` is the answer — four lines for every
 * mode, every drill kind and every practising tool — and this is what keeps it
 * honest. Three failures it is here to catch:
 *
 *  - a drill kind or a mode added with no entry, so its screen says nothing;
 *  - an entry with a blank answer, or an answer that is only the thing's own
 *    name said again;
 *  - the screen and `04` §5f drifting apart, which is what happened to every
 *    other sentence that was written twice (`labHelp.test.ts` is the same join
 *    for the lab's ten controls).
 *
 * The exhaustive-by-type records in `help.ts` already make a missing row a
 * compile error. This adds what the type cannot: that the words are there, and
 * that they are the same words the spec prints.
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DRILL_HELP,
  MODE_HELP,
  TOOL_HELP,
  drillDetailLabel,
  help,
  type HelpEntry,
} from '../../src/ui/help';
import { STAFF_POLICY, type DrillKind } from '../../src/engine/drills/types';

const SPEC = readFileSync(resolve('..', 'docs', '04-ui-spec.md'), 'utf8');

/** `04` §5f, from its heading to the next `##`. */
function sectionFiveF(): string {
  const start = SPEC.indexOf('## 5f. What every screen says about itself');
  expect(start, '`04` has no §5f under that name').toBeGreaterThan(-1);
  const end = SPEC.indexOf('\n## ', start + 1);
  return SPEC.slice(start, end === -1 ? undefined : end);
}

function every(): [string, HelpEntry][] {
  return [
    ...Object.entries(MODE_HELP).map(([key, entry]): [string, HelpEntry] => [`mode:${key}`, entry]),
    ...Object.entries(DRILL_HELP).map(([key, entry]): [string, HelpEntry] => [`drill:${key}`, entry]),
    ...Object.entries(TOOL_HELP).map(([key, entry]): [string, HelpEntry] => [`tool:${key}`, entry]),
  ];
}

describe('every mode, drill and tool says what it is', () => {
  it('has a row for every drill kind there is', () => {
    // `STAFF_POLICY` is the other table keyed by every kind, so the two are
    // checked against each other rather than against a list written here —
    // a list written here is one more place to forget a kind.
    const kinds = Object.keys(STAFF_POLICY) as DrillKind[];
    expect(kinds.length, 'there are no drill kinds at all').toBeGreaterThan(0);
    const missing = kinds.filter((kind) => DRILL_HELP[kind] === undefined);
    expect(missing, `drill kinds with no entry: ${missing.join(', ')}`).toEqual([]);
  });

  it('answers all four questions, in sentences', () => {
    for (const [key, entry] of every()) {
      expect(entry.title.trim().length, `${key} has no name`).toBeGreaterThan(0);
      for (const [question, line] of [
        ['what is this', entry.what],
        ['what do I do now', entry.now],
        ['what else is there', entry.elsewhere],
        ['what counts', entry.counts],
      ] as const) {
        expect(line.trim().length, `${key} does not answer "${question}"`).toBeGreaterThan(0);
        expect(line.trim().endsWith('.'), `${key}'s "${question}" is not a sentence: ${line}`).toBe(
          true,
        );
        expect(
          line.trim().toLowerCase() === entry.title.trim().toLowerCase(),
          `${key}'s "${question}" only says its own name again`,
        ).toBe(false);
      }
      expect(entry.controls.length, `${key} names no controls`).toBeGreaterThan(0);
      for (const control of entry.controls) {
        expect(control.name.trim().length, `${key} has a control with no name`).toBeGreaterThan(0);
        expect(
          control.does.trim().endsWith('.'),
          `${key}'s "${control.name}" does not say what it does: ${control.does}`,
        ).toBe(true);
      }
    }
  });

  it('uses the one name `04` §5 gives each mode, never the code’s', () => {
    // Entry 45 item 4: the Skills screen said *Wait mode* and *Tempo mode*
    // while the Score screen's own selector said *Wait for me* and *Keep
    // tempo*. Two names for one thing, and this table must not be a third.
    for (const [key, entry] of every()) {
      const said = [
        entry.what,
        entry.now,
        entry.counts,
        entry.elsewhere,
        ...entry.controls.map((c) => c.does),
      ];
      for (const line of said) {
        expect(/\bWait mode\b/.test(line), `${key} says "Wait mode": ${line}`).toBe(false);
        expect(/\bTempo mode\b/.test(line), `${key} says "Tempo mode": ${line}`).toBe(false);
      }
    }
  });

  it('is looked up by key, and an unknown key is blank rather than a throw', () => {
    expect(help('mode:tempo')?.title).toBe('Keep tempo');
    expect(help('drill:simon')?.title).toBe('Simon');
    expect(help('tool:lab')?.title).toBe('Accompaniment lab');
    expect(help('mode:nope' as Parameters<typeof help>[0])).toBeUndefined();
  });

  it('says on the screen exactly what `04` §5f says it says', () => {
    const section = sectionFiveF();
    const drifted: string[] = [];
    for (const [key, entry] of every()) {
      if (!section.includes(entry.what)) drifted.push(`${key} what: ${entry.what}`);
      if (!section.includes(entry.now)) drifted.push(`${key} now: ${entry.now}`);
      if (!section.includes(entry.counts)) drifted.push(`${key} counts: ${entry.counts}`);
    }
    expect(drifted, `lines the screens show that §5f does not list:\n${drifted.join('\n')}`).toEqual(
      [],
    );
  });
});

describe('a drill’s own measurements are named in words', () => {
  it('has words for every key a drill puts in `detail`', () => {
    // Read off the drills themselves rather than from a list here: a new
    // measurement that nobody named would otherwise be printed as the field
    // name, which is the fault this table exists to end.
    const sources = ['harmony.ts', 'simon.ts', 'special.ts'].map((file) =>
      readFileSync(join('src', 'engine', 'drills', file), 'utf8'),
    );
    const keys = new Set<string>();
    for (const source of sources) {
      for (const block of source.matchAll(/detail:\s*\{([\s\S]*?)\}/g)) {
        for (const field of (block[1] ?? '').matchAll(/^\s*([a-zA-Z][a-zA-Z0-9]*)\s*[:,]/gm)) {
          if (field[1]) keys.add(field[1]);
        }
      }
    }
    expect(keys.size, 'no `detail` fields were found to check').toBeGreaterThan(0);
    const unnamed = [...keys].filter((key) => drillDetailLabel(key) === key.replace(/([A-Z])/g, ' $1').toLowerCase());
    expect(unnamed, `measurements printed as their field name: ${unnamed.join(', ')}`).toEqual([]);
  });

  it('falls back to the old spacing rather than dropping an unknown one', () => {
    expect(drillDetailLabel('somethingNew')).toBe('something new');
  });
});
