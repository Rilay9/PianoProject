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
  NOT_JUDGED_TEXT,
  RESTARTED_WITH,
  ROW_TEXT,
  STATE_TEXT,
  SUMMARY_TEXT,
  TOOL_HELP,
  drillDetailLabel,
  help,
  EVIDENCE_EXCLUSION_WORDS,
  RUNG_TEXT,
  SLOT_TEXT,
  SKILL_TEXT,
  evidenceJobLine,
  skillMoveWords,
  requirementState,
  swapTierWords,
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
      // G86a: a tap whose sound did not start, named by the control that asks again.
      STATE_TEXT.soundOff('▶'),
      STATE_TEXT.soundOff('Hear it'),
      // U105: every other control whose tap can start the sound, and a key, which names ▶.
      STATE_TEXT.soundOff('Carry on'),
      STATE_TEXT.soundOff('Start again'),
      STATE_TEXT.soundOff('L'),
      STATE_TEXT.soundOff('bar N', { verb: 'hold' }),
      STATE_TEXT.soundOff('Try again'),
      STATE_TEXT.soundOff('Again'),
      STATE_TEXT.soundOff('Slower'),
      STATE_TEXT.soundOff('Faster'),
      STATE_TEXT.soundOff('Loop'),
      STATE_TEXT.soundOff('▶', { again: false }),
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
      // G1: a phrase looked at on an earlier visit.
      SUMMARY_TEXT.sightReadSeen,
      // T40: the sheet of a run the app heard nothing of, the repeat sentence
      // moved onto the sheet from the header, and a performance helped part way.
      SUMMARY_TEXT.notMeasuredHeading,
      SUMMARY_TEXT.notMeasured,
      SUMMARY_TEXT.notMeasuredNoInput,
      SUMMARY_TEXT.sightReadRepeat,
      SUMMARY_TEXT.demonstratedTake,
      // C3 item 6: what a run could not judge of the skills its item declares,
      // and the *Accents* line where the record says not measured (U46).
      NOT_JUDGED_TEXT.label,
      NOT_JUDGED_TEXT.timingWait,
      NOT_JUDGED_TEXT.timingUntimed,
      NOT_JUDGED_TEXT.notesRhythm,
      NOT_JUDGED_TEXT.oneHand('R'),
      NOT_JUDGED_TEXT.keepTempo,
      NOT_JUDGED_TEXT.unseen,
      NOT_JUDGED_TEXT.guideOff,
      NOT_JUDGED_TEXT.noOpportunity(false),
      NOT_JUDGED_TEXT.noOpportunity(true),
      NOT_JUDGED_TEXT.precision,
      NOT_JUDGED_TEXT.accentsFlat,
      NOT_JUDGED_TEXT.accentsNone,
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

// Added (C5): what the lesson page says about a rung — its state, *What the app
// counts*, the learner's word and the carry-over — and the storage report's
// line about the evidence job, are the sentences `04` §3f prints.
describe('the rung sentences are the ones `04` §3f prints', () => {
  const flat = (text: string): string => text.replace(/\s+/g, ' ');
  function sectionThreeF(): string {
    const start = SPEC.indexOf('### 3f. What the app counts for a rung');
    expect(start, '`04` has no §3f under that name').toBeGreaterThan(-1);
    const end = SPEC.indexOf('\n### ', start + 1);
    return SPEC.slice(start, end === -1 ? undefined : end);
  }

  it('lists every fixed sentence and word the page, Plan and the storage report say', () => {
    const section = flat(sectionThreeF());
    const said: string[] = [
      ...Object.values(RUNG_TEXT),
      ...Object.values(EVIDENCE_EXCLUSION_WORDS),
      'by your word',
      evidenceJobLine({ state: 'waiting', current: 0, recomputed: 0, pending: 0, excluded: {}, normalised: 0, carried: 0 }),
    ];
    const missing = said.filter((line) => !section.includes(flat(line)));
    expect(missing, `rung sentences §3f does not print:\n${missing.join('\n')}`).toEqual([]);
  });

  // Added (C5, found in the pictures): a skill requirement not yet shown read
  // "(not yet — now not shown yet)" on 2.2's page. It says what the reads show,
  // once: "(not shown yet)", "(tried, not yet shown)", and "(counted — familiar)"
  // when it holds.
  it('says what the reads show for a skill, once', () => {
    const skill = { kind: 'skill', skill: 'subdivision', state: 'familiar' } as const;
    const titleOf = (id: string): string => id;
    const reading = (holds: boolean, state: 'not introduced' | 'practised' | 'familiar') =>
      ({ requirement: skill, holds, have: holds ? 1 : 0, need: 1, state, items: [] });
    expect(requirementState(reading(false, 'not introduced'), titleOf)).toBe('not shown yet');
    expect(requirementState(reading(false, 'practised'), titleOf)).toBe('tried, not yet shown');
    expect(requirementState(reading(true, 'familiar'), titleOf)).toBe('counted — familiar');
  });
});

// Added (C6): the words each slot's line is drawn from, and the swap sheet's tier words, are the
// ones `04` §2 prints — one fact in the code and the spec, joined.
describe('the slot sentences are the ones `04` §2 prints', () => {
  const flat = (text: string): string => text.replace(/\s+/g, ' ');
  function sectionTwo(): string {
    const start = SPEC.indexOf('## 2. Today');
    expect(start, '`04` has no §2 under that name').toBeGreaterThan(-1);
    const end = SPEC.indexOf('\n## 2a.', start + 1);
    return SPEC.slice(start, end === -1 ? undefined : end);
  }

  it('lists every fixed piece of a slot’s line, and every tier the swap sheet names', () => {
    const section = flat(sectionTwo());
    const said = [
      ...Object.values(SLOT_TEXT),
      swapTierWords('lesson'),
      swapTierWords('alternative'),
      // Revised (E0): the tiers the gate turned on state what the option also practises; old words
      // "Trains the same skill" and "Carries the same demand" said only that something was shared.
      'Also trains',
      'Also practises',
      'with the other demands you have met',
      swapTierWords('kind'),
    ];
    const missing = said.filter((line) => !section.includes(flat(line)));
    expect(missing, `slot words §2 does not print:\n${missing.join('\n')}`).toEqual([]);
  });
});

// Added (C7): what the Skills screen and Progress say about a skill — the
// ladder's states in words, "not shown in 4 weeks", *not judged by the app*
// with where it is taught, and how a skill moved — are the words `04` §3a
// and §6 print.
describe('the skill words are the ones `04` §3a and §6 print', () => {
  const flat = (text: string): string => text.replace(/\s+/g, ' ');
  function between(start: string, next: string): string {
    const from = SPEC.indexOf(start);
    expect(from, `\`04\` has no section "${start}"`).toBeGreaterThan(-1);
    const end = SPEC.indexOf(next, from + start.length);
    return SPEC.slice(from, end === -1 ? undefined : end);
  }

  it('§3a lists every fixed word the Skills screen and Progress say', () => {
    const section = flat(between('### 3a. Skills review', '\n### '));
    const missing = Object.values(SKILL_TEXT).filter((line) => !section.includes(flat(line)));
    expect(missing, `skill words §3a does not print:\n${missing.join('\n')}`).toEqual([]);
  });

  it('§6 prints how a move is said, as the function says it', () => {
    const section = flat(between('## 6. Progress', '\n## 7.'));
    const today = new Date('2026-10-29T12:00:00');
    const reading = (state: 'practised' | 'familiar', notShownRecently = false) =>
      // G2: a reading also carries its scope and what established it; none here.
      ({ state, transfer: false, retained: false, notShownRecently, selfAssessed: [], transferScope: [], established: [], establishing: [] });
    const said = [
      skillMoveWords({ kind: 'up', then: reading('practised'), now: reading('familiar') }, today),
      skillMoveWords({ kind: 'unshown', then: reading('familiar'), now: reading('familiar', true), lastSupport: '2026-10-01T12:00:00' }, today),
      skillMoveWords({ kind: 'shown again', then: reading('familiar', true), now: reading('familiar') }, today),
      SKILL_TEXT.nothingMoved,
      SKILL_TEXT.review,
    ];
    expect(said.slice(0, 3)).toEqual(['tried, not yet shown → familiar', 'familiar · not shown in 4 weeks', 'familiar · shown again']);
    const missing = said.filter((line) => !section.includes(flat(line)));
    expect(missing, `§6 does not print:\n${missing.join('\n')}`).toEqual([]);
  });
});
