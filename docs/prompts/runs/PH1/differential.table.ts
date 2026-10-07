/**
 * PH1's two differentials (brief tests 6 and 8), run once on the committed readers and once after PH1, the two
 * outputs compared byte for byte: for every file in the corpus, `tempoEvents` serialised whole, and today's
 * `chartBars` (with the chart's own bar count) serialised whole. `chartBars` entries are reduced to the fields
 * both versions carry (measure, text, pitch classes, root, bass), so PH1's added `offset` cannot show as a
 * difference here: test 6 asks whether the bars the chart shows moved, not whether a field was added.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { toMusicXml } from '../../../../app/src/score/mxl';
import { tempoEvents } from '../../../../app/src/score/tempoFromXml';
import { chartBars, parseHarmony } from '../../../../app/src/score/harmony';
import { chartMeasureCount, corpus } from './corpus';

it('writes every file’s tempo events and chart bars', () => {
  const main = process.env.PIANOPATH_PH1_MAIN ?? '';
  const out = process.env.PIANOPATH_PH1_OUT ?? '';
  const files = corpus(main, join(process.cwd(), '..'));
  expect(files.length).toBeGreaterThan(600);
  const lines: string[] = [];
  for (const file of files) {
    let xml: string;
    try {
      xml = toMusicXml(file.bytes);
    } catch (cause) {
      lines.push(JSON.stringify({ sha256: file.sha256, paths: file.paths, unreadable: String(cause) }));
      continue;
    }
    const tempo = tempoEvents(xml);
    const symbols = parseHarmony(xml);
    const bars = chartBars(symbols, chartMeasureCount(xml, symbols.length)).map((bar) =>
      bar ? { measure: bar.measure, text: bar.text, pitchClasses: bar.pitchClasses, root: bar.root, bass: bar.bass ?? null } : null,
    );
    lines.push(JSON.stringify({ sha256: file.sha256, paths: file.paths, tempo, symbols: symbols.length, bars }));
  }
  writeFileSync(out, lines.join('\n') + '\n');
});
