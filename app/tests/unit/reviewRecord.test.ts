/**
 * The human review record, the screen's half (D2 item 2; R42, G29, Q41 cases 17 and 18).
 *
 * The cases are one fixture read by both implementations of the contract
 * (`tools/content/tests/fixtures/review_cases.json`; `test_review_record.py` reads it too):
 *
 * - a score reviewed from notation while teaching use stays `null`;
 * - a `heard` teaching-use event that leaves the score review's value and basis untouched;
 * - a later valid event superseding an earlier one on the same identity and dimension, by
 *   time and not by line order;
 * - a stale-identity event and a triage event filling neither bit;
 * - a rerun merge appending nothing, an id reused with other content refused, an item or an
 *   identity the catalogue does not have refused;
 * - a malformed line refused with its line number.
 *
 * And the two implementations held to each other on the built catalogue: the provenance
 * the build wrote from the record is what this module resolves from the same record.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BASES,
  CATEGORIES,
  DIMENSIONS,
  VALUES,
  bits,
  flagsOf,
  identityOf,
  mergeEvents,
  parseRecord,
  resolve,
  serializeEvent,
  type Decided,
  type Identity,
  type ReviewEvent,
} from '../../src/review/record';
import type { CatalogItem } from '../../src/curriculum/types';

interface Case {
  name: string;
  record: ReviewEvent[];
  current: Record<string, Record<string, { event: string; value: string; basis: string } | null>>;
  bits: Record<string, { score: boolean | null; teaching: boolean | null }>;
  status: Record<string, string>;
  flags?: string[];
}

interface Fixture {
  fields: { dimensions: string[]; values: string[]; bases: string[]; categories: Record<string, string[]> };
  identities: Record<string, Identity>;
  cases: Case[];
  malformed: { name: string; lines: string[]; valid: string[]; errorLines: number[] }[];
  merge: { name: string; existing: string[]; incoming: string[]; append: string[]; refused?: string[]; rerunAppends?: string[] }[];
  changed: Record<string, ReviewEvent>;
}

const REPO = join(process.cwd(), '..');
const FIXTURE = JSON.parse(
  readFileSync(join(REPO, 'tools', 'content', 'tests', 'fixtures', 'review_cases.json'), 'utf8'),
) as Fixture;
const identityFor = (item: string): Identity | undefined => FIXTURE.identities[item];

function summary(decided: Decided | undefined): Record<string, { event: string; value: string; basis: string } | null> {
  const out: Record<string, { event: string; value: string; basis: string } | null> = {};
  for (const dimension of DIMENSIONS) {
    const event = decided?.[dimension];
    out[dimension] = event ? { event: event.event, value: event.value, basis: event.basis } : null;
  }
  return out;
}

describe('one vocabulary for both implementations', () => {
  it('the fields are the fixture’s', () => {
    expect([...DIMENSIONS]).toEqual(FIXTURE.fields.dimensions);
    expect([...VALUES]).toEqual(FIXTURE.fields.values);
    expect([...BASES]).toEqual(FIXTURE.fields.bases);
    expect(Object.fromEntries(Object.entries(CATEGORIES).map(([k, v]) => [k, [...v]]))).toEqual(FIXTURE.fields.categories);
  });
});

describe('current values, per item and per dimension', () => {
  for (const one of FIXTURE.cases) {
    it(one.name, () => {
      const text = one.record.map((event) => JSON.stringify(event)).join('\n');
      const { events, errors } = parseRecord(text);
      expect(errors).toEqual([]);
      const { decided, status } = resolve(events.map((line) => line.event), identityFor);
      for (const [item, expected] of Object.entries(one.current)) {
        expect(summary(decided.get(item)), item).toEqual(expected);
      }
      for (const [item, expected] of Object.entries(one.bits)) {
        expect(bits(decided.get(item)), item).toEqual(expected);
      }
      expect(Object.fromEntries(status)).toEqual(one.status);
      if (one.flags) expect(flagsOf(events.map((line) => line.event), identityFor).map((e) => e.event)).toEqual(one.flags);
    });
  }
});

describe('a malformed line is refused with its line number', () => {
  for (const one of FIXTURE.malformed) {
    it(one.name, () => {
      const { events, errors } = parseRecord(one.lines.join('\n'));
      expect(errors.map((error) => error.line)).toEqual(one.errorLines);
      expect(events.map((line) => line.event.event)).toEqual(one.valid);
    });
  }
});

describe('the merge', () => {
  const pool = new Map<string, ReviewEvent>();
  for (const one of FIXTURE.cases) for (const event of one.record) pool.set(event.event, event);
  for (const [key, event] of Object.entries(FIXTURE.changed)) pool.set(key, event);
  const take = (ids: string[]): ReviewEvent[] => ids.map((id) => pool.get(id)!);

  for (const one of FIXTURE.merge) {
    it(one.name, () => {
      const result = mergeEvents(take(one.existing), take(one.incoming), identityFor);
      expect(result.append.map((event) => event.event)).toEqual(one.append);
      // By the event id each refused line carries (`ev-case2-a-changed` reuses `ev-case2-a`).
      expect(result.refused.map((row) => row.event)).toEqual(take(one.refused ?? []).map((event) => event.event));
      if (one.rerunAppends) {
        const again = mergeEvents([...take(one.existing), ...result.append], take(one.incoming), identityFor);
        expect(again.append.map((event) => event.event)).toEqual(one.rerunAppends);
        expect(again.refused).toEqual([]);
      }
    });
  }

  it('an exported line reads back as the event it was', () => {
    const event = FIXTURE.cases[1]!.record[1]!;
    const line = serializeEvent(event);
    expect(line).not.toContain('\n');
    const { events, errors } = parseRecord(line);
    expect(errors).toEqual([]);
    expect(events[0]!.event).toEqual(event);
  });
});

describe('identity', () => {
  it('a generated item is its generator and recipe, whatever its file; a notated item its file; none without one', () => {
    const generated = {
      id: 'exercise.tumbao.c',
      file: 'scores/generated/exercise.tumbao.c.mxl',
      hands: 'left',
      tempoBpm: 88,
      drill: { kind: 'tumbao', params: { key: 'C', offsets: [1.5, 3.0], bars: 8 }, generator: { family: 'tumbao', version: 1, seed: null } },
    } as unknown as CatalogItem;
    expect(identityOf(generated, 'f'.repeat(64))).toEqual(FIXTURE.identities['exercise.tumbao.c']);
    const notated = { id: 'song.folk.hot-cross-buns', file: 'scores/authored/hot-cross-buns.musicxml', hands: 'right' } as unknown as CatalogItem;
    expect(identityOf(notated, '1'.repeat(64))).toEqual(FIXTURE.identities['song.folk.hot-cross-buns']);
    const runtime = { id: 'drill.reading.sight-reading-1', file: null, hands: 'right', drill: { kind: 'sight-reading' } } as unknown as CatalogItem;
    expect(identityOf(runtime, null).kind).toBe('none');
  });
});

describe('held to the build on the built catalogue', () => {
  const content = join(process.cwd(), 'public', 'content');
  const record = join(REPO, 'content', 'review', 'decisions.jsonl');

  it('every item’s review bits are what this module resolves from the record', () => {
    const catalog = JSON.parse(readFileSync(join(content, 'catalog.json'), 'utf8')) as CatalogItem[];
    const text = existsSync(record) ? readFileSync(record, 'utf8') : '';
    const { events, errors } = parseRecord(text);
    expect(errors).toEqual([]);
    const byId = new Map(catalog.map((item) => [item.id, item]));
    const identities = new Map<string, Identity>();
    const current = (id: string): Identity | undefined => {
      const cached = identities.get(id);
      if (cached) return cached;
      const item = byId.get(id);
      if (!item) return undefined;
      const path = item.file ? join(content, item.file) : null;
      const sha = path && existsSync(path) ? createHash('sha256').update(readFileSync(path)).digest('hex') : null;
      const identity = identityOf(item, sha);
      identities.set(id, identity);
      return identity;
    };
    const { decided } = resolve(events.map((line) => line.event), current);
    const faults: string[] = [];
    for (const item of catalog) {
      const want = bits(decided.get(item.id));
      const have = item.provenance?.review;
      if (have?.score !== want.score || have.teaching !== want.teaching) {
        faults.push(`${item.id}: built ${JSON.stringify(have)}, resolved ${JSON.stringify(want)}`);
      }
    }
    expect(faults).toEqual([]);
  });
});
