/**
 * G2's judgement probe, run once as `app/tests/unit/zzG2JudgementProbe.test.ts` and removed: what the
 * ladder now says for (1) D4's pentatonic offer played at the full standard, and (2) a proficient
 * reader failing, then passing, an unfamiliar excerpt — on the real built items and the real
 * relationship function, with the facts `recordRun` writes. It prints; it asserts only that it ran.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { CatalogItem } from '../../src/curriculum/types';
import type { SessionRow } from '../../src/data/db';
import { playedCandidate } from '../../src/data/progressStore';
import { evidenceFor, stampedEvidence, type Evidence, type MeasuredEvidence } from '../../src/evidence/evidence';
import { ladderState } from '../../src/evidence/ladder';
import { storedEvidence } from '../../src/evidence/readingState';
import { VOCABULARY_V0 } from '../../src/evidence/vocabulary';
import { skillsInForce } from '../../src/curriculum/skillActivation';
import { relationshipOf, shownOnRecords } from '../../src/curriculum/transfer';
import { sparesFailure, transferReading } from '../../src/evidence/transferPolicy';
import type { Identity } from '../../src/review/record';
import { line, phrase } from './helpers/phrase';
import { observe } from './helpers/observed';

const CONTENT = join(process.cwd(), 'public', 'content');
const catalog = JSON.parse(readFileSync(join(CONTENT, 'catalog.json'), 'utf8')) as CatalogItem[];
const byId = new Map(catalog.map((item) => [item.id, item]));
const READING_ROW = 'drill.reading.sight-reading-2-right';
const BLUES_A = byId.get('exercise.pentatonic.a.blues') as CatalogItem;
const CUT = byId.get('excerpt.classical.bach-menuet-bwv-anh-113.pdmx.b25-32') as CatalogItem;
const SHIFT = phrase({ bars: [line(['C4', 'D4', 'E4', 'F4'], 1), line(['G4', 'A4', 'B4', 'C5'], 1)] });
const on = (day: number): string => new Date(2026, 9, day, 12).toISOString();
const phraseOf = (seed: number): Identity => ({ kind: 'generator', family: 'sight-reading', version: 2, seed, recipe: { level: 2, bars: 4, hands: 'R', fifths: 0, eighths: true, skips: true }, tempoBpm: 72 });

/** The seeded learner of D4's entry and `transferOffer.test.ts`: two first reads of 2.5's right-hand row, on two days, at the full standard. */
function read(day: number, seed: number): SessionRow {
  const observation = { ...observe(SHIFT, { mode: 'tempo', unseen: true, guide: 'off', itemId: READING_ROW, at: on(day), hands: 'R' }), material: phraseOf(seed) };
  const results = evidenceFor({ observation, played: SHIFT, targetSkills: ['sight-reading', 'interval-reading', 'position-shift'], vocabulary: VOCABULARY_V0 });
  return { ...observation, ...stampedEvidence(results) } as SessionRow;
}
const SHOWN = [read(10, 10), read(11, 11)];
const evidenceOf = (skill: string, extra: Evidence[] = []) => [...SHOWN.flatMap(storedEvidence).filter((e) => e.skill === skill), ...extra];
const skillOf = (id: string) => VOCABULARY_V0.skills.find((skill) => skill.id === id) as (typeof VOCABULARY_V0.skills)[number];

function attempt(skill: string, day: number, item: CatalogItem, plan: { right: number; n: number; played: 'R' | 'both'; intent?: 'transfer' }): MeasuredEvidence {
  const material = item.provenance?.identity as Identity;
  const demands = Array.isArray(item.demands) ? [...item.demands].sort() : undefined;
  const relationship = relationshipOf(skill, playedCandidate(item, { material, hands: { played: plan.played, appPlayed: 'none' } }, demands), SHOWN, byId, shownOnRecords(skill, SHOWN));
  return {
    kind: 'measured',
    skill,
    observationId: null,
    standard: 'full',
    n: plan.n,
    right: plan.right,
    at: on(day),
    context: { itemId: item.id, material, ...(plan.intent ? { intent: plan.intent } : {}), firstContact: true, relationship, ...(demands ? { demands } : {}), met: [], unattributed: 0, estimated: false },
    byDemand: [],
  } as unknown as MeasuredEvidence;
}

describe('G2 judgement probe', () => {
  it('prints', () => {
    const out: string[] = [];
    const today = new Date(2026, 9, 20, 9);
    out.push(`the learner: ${['position-shift', 'interval-reading', 'sight-reading'].map((s) => `${s} ${ladderState({ evidence: evidenceOf(s), today }).state}`).join('; ')}`);

    // (1) D4's offer, the A blues scale, played through at the full standard.
    out.push('', '(1) the offer: exercise.pentatonic.a.blues, played at the full standard');
    out.push(`skills in force for the scale in the shipped app: ${JSON.stringify(skillsInForce(BLUES_A))}`);
    const offerRun = attempt('position-shift', 12, BLUES_A, { right: 12, n: 12, played: 'R', intent: 'transfer' });
    const rel = offerRun.context.relationship;
    out.push(`relationship (position-shift): measured ${JSON.stringify(rel?.measured.map((f) => [f.dimension, f.candidate, f.shownOn, f.differs]))}`);
    out.push(`declared ${JSON.stringify(rel?.declared)}; differsOn ${JSON.stringify(rel?.differsOn)}`);
    const established = ladderState({ evidence: evidenceOf('position-shift'), today }).established;
    const offerReading = transferReading(skillOf('position-shift'), established, offerRun);
    out.push(`policy (position-shift ${JSON.stringify(skillOf('position-shift').transfer?.dimensions)}): ${JSON.stringify(offerReading)}`);
    out.push(`ladder after it, if the scale's run were evidence: ${ladderState({ evidence: evidenceOf('position-shift', [offerRun]), today }).state}`);

    // (2) The proficient reader and Anh. 113 bars 25–32 (reading by interval).
    out.push('', '(2) a proficient reader and excerpt.classical.bach-menuet-bwv-anh-113.pdmx.b25-32, for reading by interval');
    const fail1 = attempt('interval-reading', 13, CUT, { right: 3, n: 12, played: 'both' });
    const fail2 = attempt('interval-reading', 14, CUT, { right: 2, n: 12, played: 'both' });
    const r = fail1.context.relationship;
    out.push(`relationship (interval-reading): measured ${JSON.stringify(r?.measured.map((f) => [f.dimension, f.candidate, f.shownOn, f.differs]))}; composition ${JSON.stringify(r?.composition)}`);
    const est = ladderState({ evidence: evidenceOf('interval-reading'), today }).established;
    const failReading = transferReading(skillOf('interval-reading'), est, fail1);
    out.push(`policy on the first failure: ${JSON.stringify(failReading)}; spared ${String(sparesFailure(failReading, fail1))}`);
    out.push(`ladder after two failures on it: ${ladderState({ evidence: evidenceOf('interval-reading', [fail1, fail2]), today }).state}`);
    const bare = (e: MeasuredEvidence): Evidence => ({ ...e, context: (({ relationship: _r, demands: _d, ...rest }) => rest)(e.context) }) as unknown as Evidence;
    out.push(`the same two failures without G2's facts (unknown): ${ladderState({ evidence: evidenceOf('interval-reading', [bare(fail1), bare(fail2)]), today }).state}`);
    const pass = attempt('interval-reading', 13, CUT, { right: 12, n: 12, played: 'both' });
    out.push(`a first success there instead: ${JSON.stringify(transferReading(skillOf('interval-reading'), est, pass))}`);
    const after = ladderState({ evidence: evidenceOf('interval-reading', [pass]), today });
    out.push(`ladder after the success: ${after.state}; transferScope ${JSON.stringify(after.transferScope)}`);
    writeFileSync(process.env.G2_PROBE_OUT ?? 'g2-probe.txt', `${out.join('\n')}\n`);
    expect(out.length).toBeGreaterThan(0);
  });
});
