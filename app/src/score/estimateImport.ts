/**
 * Levelling a freshly imported score (replan §4.4).
 *
 * The estimator itself is `difficulty.ts`; this is the part that gets a
 * `ScoreModel` and the coefficients in front of it. It is a module of its own,
 * and it reaches OpenSheetMusicDisplay through a dynamic import, so that
 * Library — a screen that mostly lists things — does not pull the app's
 * largest dependency into the entry bundle merely by existing.
 *
 * The build notes that this import shares a chunk with `OsmdView`'s rather
 * than getting one of its own, which is true and is fine: that chunk is
 * already lazy, so OSMD still arrives when a score does and not before.
 *
 * Everything here is best-effort by design. A file that will not parse still
 * imports; it simply arrives with no estimate, and the assign sheet says so
 * rather than showing a number nobody computed.
 */
import type { ImportRow } from '../data/db';
import { contentUrl } from '../curriculum/load';
import type { LevelModel } from './difficulty';

let modelPromise: Promise<LevelModel | null> | null = null;

/** The fitted coefficients, copied into the served content by the build. */
export function loadLevelModel(): Promise<LevelModel | null> {
  modelPromise ??= fetch(contentUrl('level-model.json'))
    .then((response) => (response.ok ? (response.json() as Promise<LevelModel>) : null))
    .catch(() => null);
  return modelPromise;
}

/**
 * An estimated level for an imported MusicXML score, or `undefined`.
 *
 * `undefined` means "could not tell", and the caller must show that rather
 * than a default: a made-up number presented as an estimate is worse than no
 * estimate, because the owner would have no reason to doubt it.
 */
export async function estimateLevelFor(row: ImportRow): Promise<number | undefined> {
  if (row.kind !== 'musicxml' || typeof row.data !== 'string') return undefined;
  try {
    const [{ OpenSheetMusicDisplay }, { extractScoreModel }, { estimate, features }, model] =
      await Promise.all([
        import('opensheetmusicdisplay'),
        import('./extractScoreModel'),
        import('./difficulty'),
        loadLevelModel(),
      ]);
    if (!model) return undefined;
    // A detached container: this parses, it never draws. OSMD needs an element
    // to be constructed with and nothing more.
    const host = document.createElement('div');
    const osmd = new OpenSheetMusicDisplay(host, { autoResize: false, drawingParameters: 'compact' });
    await osmd.load(row.data);
    const scoreModel = extractScoreModel(osmd, { id: row.id });
    return estimate(features(scoreModel), model).level;
  } catch {
    return undefined;
  }
}

/** Test hook: forgets the fetched model. */
export function resetLevelModelForTest(): void {
  modelPromise = null;
}
