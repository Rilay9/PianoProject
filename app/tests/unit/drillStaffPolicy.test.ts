/**
 * When each drill kind draws a staff (docs/04 §5c, `STAFF_POLICY`).
 *
 * The table is the decision and the screen only obeys it, so this is where the
 * decision is checked. Two kinds of claim: that **every** kind has an answer —
 * a missing row is how a new ear kind quietly starts printing its answer over
 * its question — and that the four buckets hold what they hold for the reason
 * they hold it, said against the drills themselves rather than against a
 * repeated copy of the table.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  REVEALABLE_KINDS,
  RUNTIME_DRILL_KINDS,
  STAFF_POLICY,
  drillFromCatalog,
  staffPolicy,
  type DrillKind,
  type StaffPolicy,
} from '../../src/engine/drills';
import { sheetForPrompt } from '../../src/engine/drills/answerSheet';
import type { CatalogItem } from '../../src/curriculum/types';

const catalog = JSON.parse(
  readFileSync(resolve('public/content/catalog.json'), 'utf8'),
) as CatalogItem[];

const POLICIES: StaffPolicy[] = ['never', 'on-reveal', 'after-answer', 'always'];

describe('every drill kind says when it draws a staff', () => {
  it('has a row for each kind the screen can run, and no row for anything else', () => {
    expect([...Object.keys(STAFF_POLICY)].sort()).toEqual([...RUNTIME_DRILL_KINDS].sort());
    for (const kind of RUNTIME_DRILL_KINDS) {
      expect(POLICIES, `${kind} has no policy`).toContain(staffPolicy(kind));
    }
  });
});

describe('the four buckets', () => {
  it('draws nothing for the kinds that already draw their own notes, or have none', () => {
    // note-flash puts one note on its own staff card, transposition prints the
    // four bars it is asking about, Simon fills a staff as the chain sounds —
    // a second staff saying the same thing is the repetition `00` §1 forbids.
    // Rhythm and dynamics have no pitch in them at all.
    for (const kind of ['note-flash', 'transposition', 'simon', 'rhythm', 'dynamics'] as const) {
      expect(staffPolicy(kind), kind).toBe('never');
    }
  });

  it('puts the staff behind Show me where one key, or a scale, is the answer', () => {
    // What is left in this bucket after the 2026-09-16 ruling: naming a key,
    // and the two scale kinds. Drawing the notes *is* telling the learner what
    // to play, and here it stays worth exactly what Show me costs — that
    // prompt's mark.
    for (const kind of ['find-key', 'mode', 'chord-scale'] as const) {
      expect(staffPolicy(kind), kind).toBe('on-reveal');
    }
  });

  it('waits for the answer on every kind that is heard, and on every chord read', () => {
    // Two rejected designs in one row. Never draw these *before* the answer is
    // judged: a heard progression with its notes printed under it is a reading
    // drill wearing an ear drill's name, and a chord symbol with its notes
    // printed under it is a card that cannot be got wrong. And never leave the
    // chord kinds behind *Show me* alone: a staff behind a button is a staff
    // nobody sees on the cards they got right, and the owner's point was to
    // see the chord on the page every time (2026-09-16).
    for (const kind of [
      'ear-interval',
      'ear-chord',
      'ear-progression',
      'ear-tune',
      'harmonic-dictation',
      'call-response',
      'chord',
      'inversion',
      'extended-chord',
      'roman-numeral',
    ] as const) {
      expect(staffPolicy(kind), kind).toBe('after-answer');
    }
  });

  it('still offers Show me on the chord kinds it now draws for anyway', () => {
    // Moving them to `after-answer` must not quietly take the earlier picture
    // away: before the answer the staff is still the answer, so it is still
    // behind the button and still forfeits. `REVEALABLE_KINDS` is what the
    // screen reads to offer it.
    for (const kind of ['chord', 'inversion', 'extended-chord', 'roman-numeral'] as const) {
      expect(REVEALABLE_KINDS.has(kind), kind).toBe(true);
      expect(staffPolicy(kind), kind).toBe('after-answer');
    }
  });

  it('draws from the first frame only where the notes are not what is judged', () => {
    for (const kind of ['pedal', 'backing-track'] as const) {
      expect(staffPolicy(kind), kind).toBe('always');
    }
  });

  it('never draws from the first frame on a kind that judges the notes', () => {
    // The rule behind the bucket, checked rather than restated: an `always`
    // kind must have nothing to give away. A drill whose answer is the pitches
    // cannot be one, or its score stops meaning anything.
    const judgesPitches: DrillKind[] = RUNTIME_DRILL_KINDS.filter(
      (kind) => kind !== 'pedal' && kind !== 'backing-track' && kind !== 'rhythm',
    );
    for (const kind of judgesPitches) {
      expect(staffPolicy(kind), kind).not.toBe('always');
    }
  });
});

describe('the prompts the policy is about', () => {
  it('leaves the pedal card with no other way to know the chord', () => {
    // Why `pedal` is in `always`: the card says "Chord 1" and the chord it
    // means is nowhere on the screen. If that ever stops being true — a label
    // that names the numeral — the bucket is worth revisiting.
    const item = catalog.find((entry) => entry.id === 'drill.pedal.changes');
    expect(item, 'the pedal drill has gone from the catalog').toBeDefined();
    const prompt = item ? drillFromCatalog(item)?.next() : null;
    expect(prompt?.expected.length).toBeGreaterThan(1);
    expect(prompt?.label).not.toMatch(/[IV]/);
  });

  it('gives every `always` card a progression to draw', () => {
    // The bucket is only worth having if there is something there: for each
    // `always` kind in the shipped catalog, the first card produces a sheet.
    const always = catalog.filter(
      (item) =>
        item.drill &&
        !item.file &&
        RUNTIME_DRILL_KINDS.includes(item.drill.kind as DrillKind) &&
        staffPolicy(item.drill.kind as DrillKind) === 'always',
    );
    expect(always.length).toBeGreaterThan(0);
    for (const item of always) {
      const prompt = drillFromCatalog(item)?.next();
      expect(prompt, item.id).toBeTruthy();
      expect(sheetForPrompt(prompt!), item.id).toBeTruthy();
    }
  });
});
