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
 *
 * **Counts as well as ids (D0).** A family contract asks for an opportunity at
 * a useful density, not only for its presence, so each file's row also carries
 * how many places each detector located (`opportunities`, the length of its
 * `at`), and the bars, steps and sounded notes of the model to divide by. The
 * same detectors produce both: the ids are `measuredDemands`, the counts are
 * `detect` over the same model, and nothing here decides a demand itself.
 *
 * **The bridge regression (D0).** The generated items pinned in
 * `tools/content/tests/fixtures/bridge_regression.json` are read here directly,
 * from the built files, and `tools/content/tests/test_measured_demands.py` sends
 * the same items through `demands.py`: both are held to the same pinned ids, so
 * the build's way in returns exactly what the detectors say.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { extractScoreModel } from '../../src/score/extractScoreModel';
import { toMusicXml } from '../../src/score/mxl';
import type { ScoreModel } from '../../src/score/types';
import { detect, measuredDemands, soundedNotes } from '../../src/demands/detect';
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

/** One file's measurement, as the build reads it back. */
interface Measured {
  demands: string[];
  /** Per vocabulary demand, how many places its detector located (0 where it located none). */
  opportunities: Record<string, number>;
  measures: number;
  steps: number;
  notes: number;
}

function measure(model: ScoreModel): Measured {
  const opportunities: Record<string, number> = {};
  for (const demand of demands) opportunities[demand.id] = detect(model, demand.detector).at.length;
  return {
    demands: measuredDemands(model, demands),
    opportunities,
    measures: model.measureCount,
    steps: model.steps.length,
    notes: soundedNotes(model).length,
  };
}

describe.runIf(IN !== undefined && OUT !== undefined)('the build asks for the demands of its files', () => {
  it('measures every file it is given and writes the demand ids, or why it could not', async () => {
    installTextMeasurer();
    const paths = JSON.parse(readFileSync(IN as string, 'utf8')) as string[];
    const out: Record<string, Measured | { error: string }> = {};
    for (const path of paths) {
      try {
        out[path] = measure(await modelOfFile(path));
      } catch (error) {
        out[path] = { error: String(error).slice(0, 300) };
      }
    }
    writeFileSync(OUT as string, JSON.stringify(out, null, 2));
    expect(Object.keys(out)).toHaveLength(paths.length);
  }, 3_600_000);
});

/**
 * The generated half of the bridge regression: the pinned items read directly,
 * from the files the content build wrote (`app/public/content/scores/generated`,
 * which CI builds before this suite runs). The Python half sends the same items
 * through `demands.py` and is held to the same ids.
 */
describe.runIf(IN === undefined)('generated items, measured directly, give the ids the bridge regression pins', () => {
  const FIXTURE = join(REPO, 'tools', 'content', 'tests', 'fixtures', 'bridge_regression.json');
  // Read only in this mode: a skipped block is still collected, and the build's run of
  // this file (the other block) must not depend on the fixture.
  const pinned = (IN === undefined ? JSON.parse(readFileSync(FIXTURE, 'utf8')) : { items: [] }) as {
    items: { id: string; demands: string[] }[];
  };
  const GENERATED = join(process.cwd(), 'public', 'content', 'scores', 'generated');

  it('pins items from more than one family', () => {
    expect(new Set(pinned.items.map((item) => item.id.split('.')[1])).size).toBeGreaterThan(4);
  });

  for (const item of pinned.items) {
    it(`${item.id}: the detectors find exactly the pinned demands`, async () => {
      const file = join(GENERATED, `${item.id}.mxl`);
      expect(existsSync(file), `${file} — run the content build first`).toBe(true);
      installTextMeasurer();
      expect(measuredDemands(await modelOfFile(file), demands)).toEqual(item.demands);
    });
  }
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
