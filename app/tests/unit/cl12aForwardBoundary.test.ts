import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { nextRecommended } from '../../src/curriculum/session';
import type { Curriculum } from '../../src/curriculum/types';
import type { RungReading, RungStates } from '../../src/evidence/rungState';

const curriculum = JSON.parse(readFileSync(resolve('public/content/curriculum.json'), 'utf8')) as Curriculum;
const lessons = curriculum.stages.flatMap(stage => stage.units.filter(unit => unit.track === 'core').flatMap(unit => unit.lessons));
const first = lessons[0];
const last = lessons.at(-1);
if (!first || !last || first.id === last.id) throw new Error('Forward-boundary fixture needs two core lessons');

function states(overrides: Record<string, Partial<RungReading>> = {}): RungStates {
  return { byRung: new Map(lessons.map(rung => [rung.id, {
    rung, status: 'met', judged: true, requirements: [], carried: false,
    ...overrides[rung.id],
  } as RungReading])) };
}

describe('CL12a: a bypassed lesson is not automatic debt', () => {
  it('returns nothing behind a placement when authored work ahead is met', () => {
    const reading = states({ [first.id]: { status: 'not started' } });
    expect(nextRecommended(curriculum, reading, ['core'], { startAt: last.id })).toBeUndefined();
    expect(reading.byRung.get(first.id)?.status).toBe('not started');
  });
  it('does not repay legacy carry-over as a recommendation or rewrite evidence', () => {
    const reading = states({ [first.id]: { status: 'not started', carried: true } });
    expect(nextRecommended(curriculum, reading, ['core'])).toBeUndefined();
    expect(reading.byRung.get(first.id)).toMatchObject({ status: 'not started', carried: true });
  });
  it('an unknown placement holds nothing back', () => {
    const reading = states({ [first.id]: { status: 'not started' } });
    expect(nextRecommended(curriculum, reading, ['core'], { startAt: 'no-such-rung' })?.lesson.id).toBe(first.id);
  });
  it('preserves the strict blocked-ahead position, without paying its bypassed prerequisite', () => {
    const copy = structuredClone(curriculum);
    const target = copy.stages.flatMap(stage => stage.units.flatMap(unit => unit.lessons)).find(rung => rung.id === last.id);
    if (!target) throw new Error('Missing locked-ahead fixture lesson');
    target.prerequisites = [first.id];
    const reading = states({ [first.id]: { status: 'not started' }, [last.id]: { status: 'not started' } });
    expect(nextRecommended(copy, reading, ['core'], { startAt: last.id, strictPrerequisites: true })?.lesson.id).toBe(last.id);
  });
  it('keeps genuine core exhaustion empty', () => {
    expect(nextRecommended(curriculum, states(), ['core'])).toBeUndefined();
  });
});
