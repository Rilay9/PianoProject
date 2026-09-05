// @vitest-environment jsdom
//
// Tests that assert *broken* upstream behaviour on purpose.
//
// Each one documents a defect in OpenSheetMusicDisplay 2.1.2 that the app has
// to work around. They are written to fail when the defect is fixed, so a
// version bump tells us the workaround can go instead of the workaround
// quietly outliving its reason.

import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { EDGE_DIR, loadFixture } from './helpers/fixtures';
import { extractScoreModel } from '../../src/score/extractScoreModel';

const KNOWN_ISSUES_DIR = join(EDGE_DIR, 'known-issues');

describe('OSMD 2.1.2: a sixteenth-note grace truncates its measure', () => {
  /**
   * The fixture is one 3/4 bar of three quarter notes with a sixteenth grace
   * before the second. OSMD reads the bar's duration as a single quarter and
   * its iterator stops after the first entry — no exception, just two thirds
   * of the bar missing. With an eighth-note grace the same bar parses fully,
   * which is the workaround used in edge/pickup-grace.musicxml.
   *
   * Consequence for the app: the content pipeline (P4/P5) must normalise grace
   * `<type>` on imported MusicXML, or this silently drops notes from real
   * repertoire — sixteenth graces are everywhere in classical piano music.
   */
  it('still loses the rest of the bar (remove this test when it starts failing)', async () => {
    const osmd = await loadFixture(join(KNOWN_ISSUES_DIR, 'grace-sixteenth-truncation.musicxml'));

    const measureDuration = osmd.Sheet.SourceMeasures[0]?.Duration.RealValue;
    // 3/4 should be 0.75 of a whole note; OSMD reports a single quarter.
    expect(measureDuration).toBe(0.25);

    const model = extractScoreModel(osmd);
    // Only the first quarter survives; E5 and F5 are gone.
    expect(model.steps).toHaveLength(1);
    expect(model.steps[0]?.notes.map((n) => n.midi)).toEqual([72]);
  });

  it('parses the same bar correctly when the grace is an eighth', async () => {
    const osmd = await loadFixture(join(EDGE_DIR, 'pickup-grace.musicxml'));
    expect(osmd.Sheet.SourceMeasures[1]?.Duration.RealValue).toBe(0.75);
    const model = extractScoreModel(osmd);
    expect(model.steps).toHaveLength(4);
  });
});
