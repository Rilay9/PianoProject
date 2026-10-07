/**
 * PH2's denominators: every catalogue item the Chord chart opens from the bundle (a `file` the build measured
 * with chord symbols), read as the screen now reads it (`toMusicXml`, `readHarmony`, `chartSegments`,
 * `countOf`), and counted for the design and the differential:
 *
 * - bars by segment count, and the items whose bars are all one segment at 0 (the one-chord charts);
 * - the densest bars (most segments), with their texts and widths, for the look;
 * - the narrowest segments (smallest share of their bar) with their text;
 * - pickups (the lead before the notated pickup on the clock), conflicts, and segments that start at or past
 *   the clock bar's end (an overfull bar: never reached by the count);
 * - how many bars the legacy grid drew (`chartBars`' count) against the source measures now drawn.
 *
 * Writes PIANOPATH_PH2_OUT. Nothing here places a symbol: the app's readers do.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { toMusicXml } from '../../../../app/src/score/mxl';
import { chartSegments, readHarmony, type ChartSegment } from '../../../../app/src/score/harmony';
import { countOf } from '../../../../app/src/score/metre';

interface Item {
  id: string;
  title: string;
  file: string | null;
  notation?: { chordCount?: number } | null;
}

const textOf = (s: ChartSegment): string => (s.conflict ? s.conflict.map((c) => c.text).join('|') : (s.symbol?.text ?? '—'));

it('reads every chart the bundle opens', () => {
  const app = join(__dirname, '..', '..', '..', '..', 'app');
  const content = join(app, 'public', 'content');
  const catalog = JSON.parse(readFileSync(join(content, 'catalog.json'), 'utf8')) as Item[];
  const items = catalog.filter((item) => item.file && (item.notation?.chordCount ?? 0) > 0);
  const rows: string[] = [];
  let oneChordCharts = 0;
  let splitCharts = 0;
  let conflictItems = 0;
  let pickupItems = 0;
  let pastClock = 0;
  let read = 0;
  const bySegments = new Map<number, number>();
  const dense: { n: number; line: string }[] = [];
  const narrow: { share: number; line: string }[] = [];
  const longest: { width: number; line: string }[] = [];
  const legacyExtra: string[] = [];
  const oneChordFourFour: string[] = [];
  const splitIds: string[] = [];
  for (const item of items) {
    const xml = toMusicXml(new Uint8Array(readFileSync(join(content, item.file as string))));
    const { symbols, measures } = readHarmony(xml);
    if (symbols.length === 0) continue;
    read += 1;
    const { bars, report } = chartSegments(symbols, measures);
    const legacyCount = Math.max(new Set([...xml.matchAll(/<measure\b[^>]*\bnumber="([^"]+)"/g)].map((m) => m[1])).size, symbols.length);
    if (legacyCount !== bars.length) legacyExtra.push(`${item.id}: legacy ${String(legacyCount)} bars, source measures ${String(bars.length)}`);
    let split = false;
    bars.forEach((bar, index) => {
      const n = bar.segments.length;
      bySegments.set(n, (bySegments.get(n) ?? 0) + 1);
      if (n > 1 || bar.segments[0]?.conflict) split = true;
      const signature = measures[index]?.signature;
      const metre = signature ? `${signature.beats.join('+')}/${signature.beatTypes.join('+')}` : 'no metre';
      const texts = bar.segments.map((s) => `${textOf(s)}${s.carried ? '(carried)' : ''}@${String(s.start)}+${String(s.duration)}`);
      if (n >= 3) dense.push({ n, line: `${item.id} bar ${String(index + 1)} (${metre}, length ${String(bar.length)}): ${texts.join('  ')}` });
      if (n > 1) {
        for (const s of bar.segments) {
          narrow.push({ share: s.duration / bar.length, line: `${item.id} bar ${String(index + 1)}: "${textOf(s)}" ${String(s.duration)} of ${String(bar.length)}` });
          longest.push({ width: textOf(s).length, line: `${item.id} bar ${String(index + 1)}: "${textOf(s)}" ${String(s.duration)} of ${String(bar.length)}` });
        }
      }
      const count = countOf(signature);
      const lead = index === 0 && (bar.status === 'pickup' || bar.status === 'incomplete') ? count.barQuarters - bar.length : 0;
      for (const s of bar.segments) {
        if (lead + s.start >= count.barQuarters - 1e-6) {
          pastClock += 1;
          rows.push(`past the clock bar: ${item.id} bar ${String(index + 1)} segment @${String(s.start)} (clock ${String(count.barQuarters)}, length ${String(bar.length)}, status ${bar.status})`);
        }
      }
    });
    if (split) {
      splitCharts += 1;
      splitIds.push(item.id);
    } else {
      oneChordCharts += 1;
      // A one-chord chart the before/after differential can use: 4/4 throughout, no pickup, the legacy grid's
      // bar count equal to the source measures (so nothing about it changes but the code reading it).
      const allFourFour = measures.every((m) => m.signature?.quarters === 4 && m.signature.beats.join() === '4' && m.signature.beatTypes.join() === '4');
      if (allFourFour && legacyCount === bars.length && bars.every((b) => b.status === 'full')) oneChordFourFour.push(`${item.id} (${String(bars.length)} bars)`);
    }
    if (report.conflicts.length > 0) {
      conflictItems += 1;
      rows.push(`conflicts: ${item.id}: ${report.conflicts.map((c) => `bar ${String(bars.findIndex((b) => b.source === c.source) + 1)} @${String(c.offset)} ${c.symbols.map((s) => s.text).join('|')}`).join('; ')}`);
    }
    const first = bars[0];
    if (first && (first.status === 'pickup' || first.status === 'incomplete')) {
      pickupItems += 1;
      const count = countOf(measures[0]?.signature);
      rows.push(`pickup: ${item.id}: notated ${String(first.length)} of ${String(count.barQuarters)} quarters, lead ${String(count.barQuarters - first.length)}; segments ${first.segments.map((s) => `${textOf(s)}${s.carried ? '(carried)' : ''}@${String(s.start)}`).join(' ')}`);
    }
  }
  dense.sort((a, b) => b.n - a.n);
  narrow.sort((a, b) => a.share - b.share);
  longest.sort((a, b) => b.width - a.width);
  const out = [
    '# PH2: the charts the bundle opens, read as the screen now reads them (charts.table.ts)',
    '',
    `catalogue items with a bundled file and a measured chord count: ${String(items.length)}; with a symbol the reader names: ${String(read)}`,
    `one-chord charts (every bar one segment, no conflict): ${String(oneChordCharts)}; charts with a split or conflicted bar: ${String(splitCharts)}`,
    `bars by segment count: ${[...bySegments.entries()].sort((a, b) => a[0] - b[0]).map(([n, c]) => `${String(n)}: ${String(c)}`).join(', ')}`,
    `items with a conflict: ${String(conflictItems)}; items opening on a pickup: ${String(pickupItems)}; segments at or past the clock bar's end: ${String(pastClock)}`,
    `items whose legacy grid drew a different bar count from the source measures: ${String(legacyExtra.length)}`,
    '',
    '## Bars of three or more segments (densest first)',
    ...dense.map((d) => d.line),
    '',
    '## The thirty narrowest segments (share of the bar)',
    ...narrow.slice(0, 30).map((n) => `${n.share.toFixed(4)}  ${n.line}`),
    '',
    '## The thirty longest texts in split bars',
    ...longest.slice(0, 30).map((n) => n.line),
    '',
    '## Pickups, conflicts, segments past the clock',
    ...rows,
    '',
    '## Legacy bar counts that differ',
    ...legacyExtra,
    '',
    `## One-chord 4/4 charts with every bar full and the legacy bar count unchanged (${String(oneChordFourFour.length)})`,
    ...oneChordFourFour,
    '',
  ].join('\n');
  writeFileSync(process.env.PIANOPATH_PH2_OUT ?? join(app, '..', 'build', 'ph2', 'charts.txt'), out);
  // The charts with a split or conflicted bar, for the browser's legibility census (build/ph2/pictures).
  writeFileSync(join(app, '..', 'build', 'ph2', 'split-charts.json'), JSON.stringify(splitIds));
  expect(read).toBeGreaterThan(0);
});
