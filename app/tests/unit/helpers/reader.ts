// A learner's sight-reads for the reader tests (C4), made the way the app
// makes them: the phrase a row (or a recipe) and a seed write, turned into the
// score model the engine plays (OSMD in jsdom, then `extractScoreModel`, as
// `sightReadingPromises` does), played through the real engine on a fake clock
// (`observed.ts`), measured by the record's one definition, and read by the
// evidence function with the row's own `targetSkills` — the call the Score
// screen makes at record time — and stamped as that call stamps it (C4a: the
// evidence's own version, `stampedEvidence`). What a test hands the reading
// state is a row the store would have kept, not a hand-typed guess at one.
//
// Test files that use this need `// @vitest-environment jsdom` (OSMD draws).

import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { extractScoreModel } from '../../../src/score/extractScoreModel';
import { generateSightReading, type SightReadingOptions } from '../../../src/engine/sightReading';
import { evidenceFor, stampedEvidence, type EvidenceResult } from '../../../src/evidence/evidence';
import { VOCABULARY_V0 } from '../../../src/evidence/vocabulary';
import { detect } from '../../../src/demands/detect';
import type { ScoreModel } from '../../../src/score/types';
import type { CatalogItem } from '../../../src/curriculum/types';
import type { RunResult } from '../../../src/data/progressStore';
import type { SessionRow } from '../../../src/data/db';
import { observe } from './observed';

/** The model the engine plays for a MusicXML phrase. */
export async function modelOf(musicXml: string, id: string): Promise<ScoreModel> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  try {
    const osmd = new OpenSheetMusicDisplay(container, { autoResize: false, backend: 'svg' });
    await osmd.load(musicXml);
    return extractScoreModel(osmd, { id });
  } finally {
    container.remove();
  }
}

/** The phrase these options write, as the model the engine plays. */
export async function phraseModel(options: SightReadingOptions, id: string): Promise<ScoreModel> {
  return modelOf(generateSightReading(options).musicXml, id);
}

/**
 * A reader's small unevenness: every note a little early or late, never by
 * more than 25 ms, the same for the same seed. A run played exactly on the
 * grid is a machine's, and the window it has to fall inside is ±150 ms.
 */
export function jitter(seed: number): (step: number) => number {
  return (step) => {
    const x = Math.sin((seed % 9973) * 12.9898 + step * 78.233) * 43758.5453;
    return Math.round((x - Math.floor(x) - 0.5) * 50);
  };
}

/** Every step where the melody moves by a skip (the one definition, `detect.ts`). */
export function skipSteps(model: ScoreModel): number[] {
  return [...new Set(detect(model, 'skips').at.map((at) => at.step))];
}

export interface Read {
  item: CatalogItem;
  options: SightReadingOptions;
  /** ISO date-time of the run. */
  at: string;
  /** What the phrase was written from, as the Score screen stores it (C4). */
  recipe?: SessionRow['recipe'];
  /** The steps this reader gets wrong in this phrase (the white key below, in time). */
  wrong?: (model: ScoreModel) => number[];
  tempoPct?: number;
  guide?: 'next' | 'off';
  mode?: 'tempo' | 'wait';
}

export interface ReadOut {
  model: ScoreModel;
  /** The row as the store keeps it: the observation, its evidence, the recipe. */
  row: SessionRow;
  /** The same run as the Score screen hands `recordRun`. */
  result: RunResult;
  evidence: EvidenceResult[];
}

/** One first reading of a phrase, played, measured and evidenced as the app does it. */
export async function readPhrase(read: Read): Promise<ReadOut> {
  const seed = read.options.seed ?? 1;
  const model = await phraseModel(read.options, `${read.item.id}.${String(seed)}`);
  const observation = observe(model, {
    mode: read.mode ?? 'tempo',
    tempoPct: read.tempoPct ?? 70,
    guide: read.guide ?? 'off',
    unseen: true,
    itemId: read.item.id,
    seed,
    at: read.at,
    wrongInstead: read.wrong?.(model) ?? [],
    offsetMs: jitter(seed),
  });
  const evidence = evidenceFor({
    observation,
    played: model,
    targetSkills: read.item.targetSkills ?? [],
    vocabulary: VOCABULARY_V0,
  });
  const measured = (observation as { accuracy?: unknown }).accuracy;
  const accuracy = typeof measured === 'number' ? measured : 0;
  const header = {
    ...observation,
    ...(read.recipe ? { recipe: read.recipe } : {}),
    ...stampedEvidence(evidence),
  };
  const result = {
    ...header,
    passed: accuracy >= 0.9,
    masterEligible: false,
  } as unknown as RunResult;
  const row = { ...header, at: read.at } as unknown as SessionRow;
  return { model, row, result, evidence };
}
