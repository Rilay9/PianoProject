// @vitest-environment jsdom
/**
 * One definition of each demand, run over files as the content build will run
 * it (C2 item 4; reviewer decision 4).
 *
 * The detectors read the score model, and the model is what OSMD makes of a
 * file — so "what demands does this file have?" has to mean "what the app
 * measures on it", the render check's reason for being a Playwright test
 * (`tools/content/render_check.py`). This file is the build's way in: with
 * `PIANOPATH_DEMANDS_IN` naming a JSON list of score paths and
 * `PIANOPATH_DEMANDS_OUT` a place to write, it measures each file with the
 * app's own loader, extractor and detectors and writes the demand ids per file
 * (`tools/content/demands.py` calls it). Without them it is the proof on one
 * quarried piece: Anh. 113, whose demands were read from its MusicXML by hand
 * and by an independent ElementTree pass (the C2 record lists both).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { extractScoreModel } from '../../src/score/extractScoreModel';
import { toMusicXml } from '../../src/score/mxl';
import type { ScoreModel } from '../../src/score/types';
import { measuredDemands } from '../../src/demands/detect';
import type { DemandsFile } from '../../src/demands/vocabulary';
import { installTextMeasurer } from './helpers/scoreCatalog';

const REPO = join(process.cwd(), '..');
const { demands } = JSON.parse(readFileSync(join(REPO, 'content', 'curriculum', 'vocabulary', 'demands.json'), 'utf8')) as DemandsFile;

async function modelOfFile(path: string): Promise<ScoreModel> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  try {
    const osmd = new OpenSheetMusicDisplay(container, { autoResize: false, backend: 'svg' });
    await osmd.load(toMusicXml(new Uint8Array(readFileSync(path))));
    return extractScoreModel(osmd, { id: path });
  } finally {
    container.remove();
  }
}

const IN = process.env.PIANOPATH_DEMANDS_IN;
const OUT = process.env.PIANOPATH_DEMANDS_OUT;

describe.runIf(IN !== undefined && OUT !== undefined)('the build asks for the demands of its files', () => {
  it('measures every file it is given and writes the demand ids, or why it could not', async () => {
    installTextMeasurer();
    const paths = JSON.parse(readFileSync(IN as string, 'utf8')) as string[];
    const out: Record<string, { demands: string[] } | { error: string }> = {};
    for (const path of paths) {
      try {
        out[path] = { demands: measuredDemands(await modelOfFile(path), demands) };
      } catch (error) {
        out[path] = { error: String(error).slice(0, 300) };
      }
    }
    writeFileSync(OUT as string, JSON.stringify(out, null, 2));
    expect(Object.keys(out)).toHaveLength(paths.length);
  }, 3_600_000);
});

describe.runIf(IN === undefined)('Anh. 113, a quarried piece, measured by the app’s detectors', () => {
  const FILE = join(REPO, 'content', 'scores', 'pdmx', 'QmZzbCrrGH19zjfe766mDvw9C1cXYXSa5ApF7MRnRhpqjL.mxl');

  it('finds what the page has and nothing it has not', async () => {
    installTextMeasurer();
    const found = new Set(measuredDemands(await modelOfFile(FILE), demands));
    // Read from the file: two staves, treble over bass, no clef change; F major
    // throughout, with E♭, B♮, C♯ and F♯ written in; sixteenths in bar 1;
    // twelve triplet eighths; C6 at the top of the right hand and E2 at the
    // bottom of the left; leaps to the octave; the hands together.
    for (const id of [
      'clef.bass',
      'pitch.ledger',
      'interval.step',
      'interval.skip',
      'interval.leap',
      'rhythm.eighths',
      'rhythm.shorter-than-quarter',
      'rhythm.sixteenths',
      'rhythm.triplets',
      'key.signature',
      'pitch.chromatic',
      'range.beyond-position',
      'texture.hands-together',
    ]) {
      expect(found, `Anh. 113 has ${id}`).toContain(id);
    }
    // No tie, no dotted quarter (its long notes are halves and dotted halves),
    // 3/4 throughout; no note of a beat or more off the beat and no right-hand
    // bar that opens late; and bars 12, 29, 30 and 32 give the left hand one
    // note, so neither a pattern in every bar nor a walk.
    for (const id of [
      'rhythm.ties',
      'rhythm.dotted-quarter',
      'metre.compound',
      'rhythm.syncopation',
      'texture.left-hand-pattern',
      'texture.walking-bass',
    ]) {
      expect(found, `Anh. 113 has no ${id}`).not.toContain(id);
    }
  });
});
