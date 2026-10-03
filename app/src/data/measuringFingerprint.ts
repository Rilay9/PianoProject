/**
 * The app's measuring fingerprint (E40): what decides a stored import's measurement, as sixteen hex
 * digits — so a change to the detectors, the density file or the vocabulary re-measures every stored
 * import once on the next launch (`importStore.measurementDue`), as the content build re-measures a
 * bundled score when `tools/content/demands.py`'s `definition_fingerprint()` moves.
 *
 * **What it covers**, each file by its path and its text with line endings normalised (the build's
 * rule, so a checkout's line endings never move it; the two JSON files by their parsed content): the
 * detectors (`demands/detect.ts`); the model they
 * read and how a file becomes one (`score/extractScoreModel.ts`, `score/types.ts`, `score/mxl.ts`); the
 * vocabulary that names the demands and their detectors (`vocabulary/demands.json`); the density file
 * that decides which measured demands a score establishes (`opportunity-density.json`: the build derives
 * `established` afresh on every build, a stored import keeps it on the row); and the engraver's release
 * that reads the file (OpenSheetMusicDisplay's `package.json`, where the build hashes the lockfile that
 * pins it). `appFingerprintCoversTheBuilds` in `importMeasuredTruth.test.ts` holds that every file the
 * build's fingerprint names and the app's measurement reads is here.
 *
 * **Who owns what.** This module owns the list and the value; `importStore` writes the value into an
 * import's `facts.measuredUnder` beside the converter version whenever the detectors measure a score,
 * and compares it on the launch. The build's fingerprint stays the build's, keyed to its own cache: the
 * two are different hashes over overlapping files and are never compared with each other.
 *
 * Loaded on demand (`import('./measuringFingerprint')`) where a score is measured, so the Library's
 * path never carries these sources.
 */
import detect from '../demands/detect.ts?raw';
import extractScoreModel from '../score/extractScoreModel.ts?raw';
import scoreTypes from '../score/types.ts?raw';
import mxl from '../score/mxl.ts?raw';
import osmdPackage from 'opensheetmusicdisplay/package.json?raw';
// The two content files as the app already bundles them (parsed JSON: the dev server and the unit runner
// serve no raw file from outside `app/`), hashed by their serialised content — what they say, whatever
// their formatting.
import demands from '../../../content/curriculum/vocabulary/demands.json';
import density from '../../../content/sources/opportunity-density.json';

/** The files the fingerprint covers, by their repository paths, in a fixed order. */
export const MEASURING_DEFINITIONS: readonly (readonly [path: string, text: string])[] = [
  ['app/src/demands/detect.ts', detect],
  ['app/src/score/extractScoreModel.ts', extractScoreModel],
  ['app/src/score/types.ts', scoreTypes],
  ['app/src/score/mxl.ts', mxl],
  ['content/curriculum/vocabulary/demands.json', JSON.stringify(demands)],
  ['content/sources/opportunity-density.json', JSON.stringify(density)],
  ['app/node_modules/opensheetmusicdisplay/package.json', osmdPackage],
];

/** FNV-1a over the UTF-8 bytes, 64 bits: a change detector, never a security hash, and runs anywhere. */
function fnv1a64(text: string): string {
  let hash = 0xcbf29ce484222325n;
  for (const byte of new TextEncoder().encode(text)) {
    hash ^= BigInt(byte);
    hash = (hash * 0x100000001b3n) & 0xffffffffffffffffn;
  }
  return hash.toString(16).padStart(16, '0');
}

/** The fingerprint of the given definitions: each path and its LF-normalised text, in order. */
export function fingerprintOf(definitions: readonly (readonly [string, string])[]): string {
  return fnv1a64(definitions.map(([path, text]) => `${path}\n${text.replace(/\r\n/g, '\n')}\n`).join('\u0000'));
}

let cached: string | undefined;

/** The measuring fingerprint of this build of the app. */
export function measuringFingerprint(): string {
  cached ??= fingerprintOf(MEASURING_DEFINITIONS);
  return cached;
}
