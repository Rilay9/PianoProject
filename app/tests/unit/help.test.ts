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
  RESTARTED_WITH,
  ROW_TEXT,
  STATE_TEXT,
  SUMMARY_TEXT,
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

/**
 * The run's own sentences — the state line, the refused `⋯` rows, the
 * summary's *Changed* line (T31, T33) — are printed in `04` §5f as well, and
 * this is the join. Whitespace is compared loosely because §5f wraps its
 * lines and the table does not; every word has to be the same.
 */
describe('the Score screen’s run sentences are the ones `04` §5f prints', () => {
  const flat = (text: string): string => text.replace(/\s+/g, ' ');

  it('lists every sentence the state line, the rows and the summary say about a run', () => {
    const section = flat(sectionFiveF());
    const said: string[] = [
      STATE_TEXT.paused,
      STATE_TEXT.pausedPerforming,
      STATE_TEXT.away('N', false),
      STATE_TEXT.hearing,
      STATE_TEXT.hearingOverRun('N'),
      STATE_TEXT.pausedAt('N'),
      STATE_TEXT.restarted('N', RESTARTED_WITH.hands('L')),
      RESTARTED_WITH.mode('Keep tempo'),
      RESTARTED_WITH.hands('both'),
      RESTARTED_WITH.tempo(80),
      RESTARTED_WITH.loop('bars 3–4'),
      RESTARTED_WITH.noLoop,
      RESTARTED_WITH.input('the microphone'),
      RESTARTED_WITH.noInput,
      RESTARTED_WITH.rhythm(true),
      RESTARTED_WITH.rhythm(false),
      RESTARTED_WITH.duet('the left hand'),
      RESTARTED_WITH.duet(null),
      RESTARTED_WITH.bars(3),
      RESTARTED_WITH.layout(true),
      RESTARTED_WITH.layout(false),
      `Metronome — ${ROW_TEXT.metronomeNoClock}`,
      ROW_TEXT.metronomeWithRun,
      ROW_TEXT.metronomeOnResume,
      ROW_TEXT.metronomeOnFirstNote,
      `Blind — ${ROW_TEXT.pauseFirst}`,
      `Perform — ${ROW_TEXT.pauseFirst}`,
      SUMMARY_TEXT.changedLabel,
      SUMMARY_TEXT.changed('mode', 'Keep tempo', SUMMARY_TEXT.atBar(5)),
      SUMMARY_TEXT.changed('hands', 'R', SUMMARY_TEXT.atBar(3)),
      SUMMARY_TEXT.changed('tempo', '80', SUMMARY_TEXT.atBar(5), '70'),
      SUMMARY_TEXT.changed('loop', 'bars 3–4', SUMMARY_TEXT.atBar(2)),
      SUMMARY_TEXT.changed('loop', 'off', SUMMARY_TEXT.atBar(6)),
      SUMMARY_TEXT.changed('input', 'Mic', SUMMARY_TEXT.atBar(4)),
      SUMMARY_TEXT.changed('rhythm', 'on', SUMMARY_TEXT.atBar(2)),
      SUMMARY_TEXT.changed('duet', 'off', SUMMARY_TEXT.atBar(2)),
      SUMMARY_TEXT.changed('metronome', 'on', SUMMARY_TEXT.atBar(1)),
      SUMMARY_TEXT.heard([2]),
      SUMMARY_TEXT.afterTheRun,
      SUMMARY_TEXT.sightReadHeard,
    ];
    const missing = said.filter((line) => !section.includes(flat(line)));
    expect(missing, `run sentences §5f does not print:\n${missing.join('\n')}`).toEqual([]);
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
