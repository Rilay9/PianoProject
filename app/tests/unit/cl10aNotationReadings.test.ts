// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { extractScoreModel } from '../../src/score/extractScoreModel';
import { detect } from '../../src/demands/detect';
import { line, phrase } from './helpers/phrase';
import { toScoreModelData, withBeatToMs } from '../../src/score/types';
import { measureImport } from '../../src/data/importStore';
import { EVIDENCE_DEFINITIONS } from '../../src/evidence/evidence';
import { installTextMeasurer } from './helpers/scoreCatalog';

function score(measures: string[]): string {
  return `<?xml version="1.0"?><score-partwise version="4.0">
    <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
    <part id="P1">${measures.map((body, i) => `<measure number="${i + 1}">${body}</measure>`).join('')}</part>
  </score-partwise>`;
}
const note = (step: string, octave: number, alter = 0) =>
  `<note><pitch><step>${step}</step>${alter ? `<alter>${alter}</alter>` : ''}<octave>${octave}</octave></pitch><duration>4</duration><type>whole</type></note>`;
const opening = (clef: 'G' | 'F') =>
  `<attributes><divisions>1</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>${clef}</sign><line>${clef === 'F' ? 4 : 2}</line></clef></attributes>`;
async function model(xml: string) {
  installTextMeasurer();
  const host = document.createElement('div');
  document.body.appendChild(host);
  try {
    const osmd = new OpenSheetMusicDisplay(host, { autoResize: false, backend: 'svg' });
    await osmd.load(xml);
    return extractScoreModel(osmd, { musicXml: xml });
  } finally {
    host.remove();
  }
}

describe('CL10a: the extracted model preserves the notation in force', () => {
  it('reads a one-staff bass-clef part as bass without inventing a treble ledger line', async () => {
    const m = await model(score([opening('F') + note('C', 3)]));
    expect(m.steps.flatMap(step => step.notes).every(n => n.staff === 1)).toBe(true);
    expect(detect(m, 'bassClef').present).toBe(true);
    expect(detect(m, 'ledgerLines').present).toBe(false);
  });
  it('reads a clef change in force rather than assigning one clef to the whole staff', async () => {
    const m = await model(score([
      opening('F') + note('C', 3),
      '<attributes><clef><sign>G</sign><line>2</line></clef></attributes>' + note('C', 5),
    ]));
    expect([...new Set(detect(m, 'bassClef').at.map(at => at.measure))]).toEqual([0]);
    expect(detect(m, 'ledgerLines').present).toBe(false);
  });
  it('makes F sharp diatonic after the change to G while preserving the opening key', async () => {
    const m = await model(score([
      opening('G') + note('C', 5),
      '<attributes><key><fifths>1</fifths></key></attributes>' + note('F', 5, 1),
    ]));
    expect(m.keySig).toBe('C major');
    expect(detect(m, 'chromatic').present).toBe(false);
    expect(detect(m, 'keySignature').present).toBe(true);
    expect([...new Set(detect(m, 'keySignature').at.map(at => at.measure))]).toEqual([1]);
  });
});

describe('CL10a: metre and the agreed share examples', () => {
  const walks = () => [{ at: 0, dur: 4, pitch: 'C5' }, ...line(['C3', 'D3', 'E3', 'G3'], 1, 2)];
  const held = () => [{ at: 0, dur: 4, pitch: 'C5' }, ...line(['C3'], 4, 2)];
  it('refuses three quarters in 6/8 as a walking bass', () => {
    const m = phrase({ time: '6/8', bars: [[
      { at: 0, dur: 3, pitch: 'C5' }, ...line(['C3', 'D3', 'E3'], 1, 2),
    ]] });
    expect(detect(m, 'walkingBass').present).toBe(false);
  });
  it('accepts the mostly-walking four-bar example and locates only its walking bars', () => {
    const m = phrase({ bars: [walks(), walks(), walks(), held()] });
    const found = detect(m, 'walkingBass');
    expect(found.present).toBe(true);
    expect([...new Set(found.at.map(at => at.measure))]).toEqual([0, 1, 2]);
  });
  it('accepts a moving accompaniment in three of four eligible bars', () => {
    const m = phrase({ bars: [walks(), walks(), walks(), held()] });
    const found = detect(m, 'leftHandPattern');
    expect(found.present).toBe(true);
    expect([...new Set(found.at.map(at => at.measure))]).toEqual([0, 1, 2]);
  });
  it('keeps the explicit two-of-three-bar walking example refused', () => {
    expect(detect(phrase({ bars: [walks(), held(), walks()] }), 'walkingBass').present).toBe(false);
  });
});


describe('CL10a: eligibility is decided before the share', () => {
  const walk = () => [{ at: 0, dur: 4, pitch: 'C5' }, ...line(['C3', 'D3', 'E3', 'G3'], 1, 2)];
  const single = () => [{ at: 0, dur: 4, pitch: 'C5' }, ...line(['C3'], 4, 2)];
  it('does not let a silent bar or accompaniment-only introduction dilute the texture', () => {
    const m = phrase({ bars: [[], line(['C3'], 4, 2), walk(), walk(), walk()] });
    expect(detect(m, 'walkingBass').present).toBe(true);
    expect(detect(m, 'leftHandPattern').present).toBe(true);
  });
  it('excludes an explicitly marked pickup without excluding a full ending', () => {
    const m = { ...phrase({ bars: [single(), walk(), walk()] }), pickup: true };
    expect(detect(m, 'walkingBass').present).toBe(true);
    expect(detect(phrase({ bars: [walk(), walk(), single()] }), 'walkingBass').present).toBe(false);
  });
  it('never calls a lower line alone a patterned accompaniment', () => {
    const m = phrase({ bars: [line(['C3', 'D3', 'E3', 'G3'], 1, 2)] });
    expect(detect(m, 'walkingBass').present).toBe(false);
    expect(detect(m, 'leftHandPattern').present).toBe(false);
  });
});

describe('CL10a: readers keep the new meaning', () => {
  it('preserves pickup eligibility through plain model serialization', () => {
    const m = withBeatToMs({ ...phrase({ bars: [line(['C5'], 1)] }), pickup: true });
    expect(toScoreModelData(m).pickup).toBe(true);
  });
  it('retires evidence derived under the previous detector definitions', () => {
    expect(EVIDENCE_DEFINITIONS).toBeGreaterThan(6);
  });
});

describe('CL10a: imported and repeated scores use the same readings', () => {
  it('establishes actual bass reading on a one-staff import without the legacy mask', async () => {
    installTextMeasurer();
    const quarters = ['C', 'D', 'E', 'F'].map(step =>
      `<note><pitch><step>${step}</step><octave>3</octave></pitch><duration>1</duration><type>quarter</type></note>`).join('');
    const xml = score([opening('F') + quarters, quarters]);
    const result = await measureImport(xml, 'cl10a-bass-import');
    expect(result.demands).toContain('clef.bass');
    expect(result.measurement.status).toBe('measured');
    if (result.measurement.status !== 'measured') return;
    expect(result.measurement.established).toContain('clef.bass');
    expect(result.measurement.misread).toBeUndefined();
  });
  it('locates played repeat notes while judging printed bars only once', () => {
    const bar = [{ at: 0, dur: 4, pitch: 'C5' }, ...line(['C3', 'D3', 'E3', 'G3'], 1, 2)];
    const m = phrase({ bars: [bar, bar] });
    m.sourceMeasureCount = 1;
    m.steps = m.steps.map(step => ({ ...step, sourceMeasureIndex: 0,
      notes: step.notes.map(n => ({ ...n, sourceMeasureIndex: 0 })) }));
    expect([...new Set(detect(m, 'walkingBass').at.map(at => at.measure))]).toEqual([0, 1]);
  });
});
