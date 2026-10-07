/**
 * PH1's census (brief test 9), re-run with the new reader: every file in the corpus (`corpus.ts`) with a chord
 * symbol, read through the app's unzip, `readHarmony` and `chartSegments` (one bar per source measure, by the
 * source-measure ordinal; PH1a, the reviewer's `ph1-g6a-landing.md` §2), and the shared walk (`measureWalk.ts`)
 * for which part each symbol stands in. Nothing here places a symbol itself.
 *
 * Writes PIANOPATH_PH1_OUT (the per-file rows the music21 comparison reads, kept under build/) and
 * PIANOPATH_PH1_SUMMARY (the census, committed). Totals are given twice: over the source corpus (files under
 * `content/scores/`, the denominator the brief's scratch census counted) and over the bundle (files under the
 * built `app/public/content/scores/`, what the app ships); a file in both is counted in each.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { toMusicXml } from '../../../../app/src/score/mxl';
import { chartSegments, readHarmony, type ChartBar, type ChordSymbol } from '../../../../app/src/score/harmony';
import { walkMeasures } from '../../../../app/src/score/measureWalk';
import { chartMeasureCount, corpus } from './corpus';

const BLUE_BOSSA = 'QmTjGkyTi49tTTBrqFYXcTzdGaMMGrmViuc46mN7qmmGo6';
const INSENSATEZ = 'QmemwmomPM2tq51u1sTFEAPqdzPkwrJkuKCsMThnKqpvFW';

const same = (a: ChordSymbol | null | undefined, b: ChordSymbol | null | undefined): boolean =>
  !!a && !!b && a.text === b.text && a.root === b.root && a.bass === b.bass && [...a.pitchClasses].sort().join() === [...b.pitchClasses].sort().join();

interface FileRow {
  sha256: string;
  paths: string[];
  /** [written number, offset, root pc, text, staff ('' where none is written), part ordinal] in written order. */
  symbols: [number, number, number, string, string, number][];
  /** The harmony part's measures: [ordinal, written number attribute, walked, nominal, implicit, status, length]. */
  measures: [number, string, number, number | null, boolean, string, number][];
  harmonyParts: number[];
  partCount: number;
  metres: string[];
  numbering: string;
  bars: number;
  /** Today's `chartBars` count (the screen's: the distinct written numbers or the symbol count, the larger). */
  legacyBars: number;
  /** Symbols whose source measure the harmony part does not have: in no bar. */
  unplaced: number;
  splitBars: number;
  restatementOnlyBars: number;
  restatementEvents: number;
  merged: number;
  mergedKinds: string[];
  /** `bar` is the printed label, `source` the ordinal that is the bar's identity. */
  conflicts: { bar: string; source: number; offset: number; texts: string[]; kind: string }[];
  outside: { bar: string; source: number; offset: number; length: number; text: string }[];
  lateFirst: number;
  offBeat: number;
  threePlus: number;
  maxEvents: number;
  densest: { bar: number; events: number; texts: string[] }[];
  carriedDiffers: number;
  statuses: Record<string, number>;
  mismatches: { ordinal: number; number: string; walked: number; nominal: number | null; kind: string }[];
}

function numberingOf(numbers: string[]): string {
  if (numbers.every((n, i) => n === String(i + 1))) return '1..N';
  if (numbers.every((n, i) => n === String(i))) return '0..N-1 (pickup numbered 0)';
  const parsed = numbers.map((n) => Number.parseInt(n, 10));
  if (parsed.some((n) => !Number.isFinite(n))) return 'non-numeric numbers';
  if (numbers.some((n) => String(Number.parseInt(n, 10)) !== n)) return 'suffixed numbers (e.g. 7X1; the legacy chartBars folds it onto bar 7, the source-keyed bars do not)';
  if (new Set(numbers).size < numbers.length) return 'repeated numbers';
  return 'gaps or other';
}

function rowOf(sha256: string, paths: string[], xml: string): FileRow | undefined {
  const { symbols, measures } = readHarmony(xml);
  if (symbols.length === 0) return undefined;
  const { bars, report } = chartSegments(symbols, measures);

  // Which parts hold a harmony, the metres in force, and each part's measure count: the shared walk. The symbols'
  // staff, part and measure ordinal, in readHarmony's own order and filter (a named root in a numbered measure).
  const harmonyParts = new Set<number>();
  const metres = new Set<string>();
  const partMeasures: string[][] = [];
  const where: { part: number; measure: number; staff: string }[] = [];
  walkMeasures(xml, {
    child: ({ tag, part, measure, measureAttributes, inner }) => {
      if (tag !== 'harmony' || !/<root-step>[A-Ga-g]<\/root-step>/.test(inner) || !/\bnumber="[^"]+"/.test(measureAttributes)) return;
      harmonyParts.add(part);
      where.push({ part, measure, staff: /<staff>\s*(\d+)\s*<\/staff>/.exec(inner)?.[1] ?? '' });
    },
    measureEnd: ({ part, measureAttributes, time }) => {
      (partMeasures[part] ??= []).push(/\bnumber="([^"]+)"/.exec(measureAttributes)?.[1] ?? '');
      if (time) metres.add(time.quarters === undefined ? `${time.beats.join('+')}/${time.beatTypes.join('+')} (no reading)` : `${time.beats.join('+')}/${time.beatTypes.join('+')}`);
    },
  });
  const harmonyPart = [...harmonyParts].sort((a, b) => a - b)[0] ?? 0;
  const numbers = partMeasures[harmonyPart] ?? [];
  expect(where.length).toBe(symbols.length);
  const at = (symbol: ChordSymbol) => where[symbols.indexOf(symbol)];
  // A merged duplicate: the same chord at one place, on another staff, in another part, or on the same staff.
  const mergedKinds = report.merged.map((symbol) => {
    const kept = symbols.find((s) => s !== symbol && same(s, symbol) && s.source === symbol.source && Math.max(0, s.offset) === Math.max(0, symbol.offset) && symbols.indexOf(s) < symbols.indexOf(symbol));
    const a = kept ? at(kept) : undefined;
    const b = at(symbol);
    if (!a || !b) return 'unpaired';
    if (a.part !== b.part) return 'another part';
    if (a.measure !== b.measure) return 'another measure (cannot occur: merging is by source measure)';
    return a.staff !== b.staff ? 'another staff' : 'the same staff';
  });
  // A conflict: from one source measure, or (a check that must now read zero) from several measures folded onto one bar.
  const conflictKinds = report.conflicts.map((c) => (new Set(c.symbols.map((s) => at(s)?.measure)).size > 1 ? 'measures sharing one bar number' : 'one measure'));

  const events = (bar: ChartBar) => bar.segments.filter((s) => !s.carried);
  let splitBars = 0;
  let restatementOnlyBars = 0;
  let restatementEvents = 0;
  let lateFirst = 0;
  let threePlus = 0;
  let maxEvents = 0;
  let carriedDiffers = 0;
  const densest: { bar: string; events: number; texts: string[] }[] = [];
  let previousFirst: ChordSymbol | null = null;
  for (const bar of bars) {
    const written = events(bar);
    if (written.length >= 2) splitBars += 1;
    if (written.length >= 3) threePlus += 1;
    maxEvents = Math.max(maxEvents, written.length);
    if (written.length >= 6) densest.push({ bar: bar.label ?? '', events: written.length, texts: written.map((s) => s.symbol?.text ?? `conflict(${(s.conflict ?? []).map((c) => c.text).join('|')})`) });
    if (written.length >= 1 && bar.segments[0]?.carried) lateFirst += 1;
    // A restatement: a written event whose chord is the one already sounding just before it in the bar.
    bar.segments.forEach((segment, i) => {
      if (i > 0 && !segment.carried && same(segment.symbol, bar.segments[i - 1]?.symbol)) restatementEvents += 1;
    });
    if (written.length >= 2 && written.every((s) => same(s.symbol, written[0]?.symbol))) restatementOnlyBars += 1;
    // Today's chart carries the first symbol of the last bar with one; the segments carry what was sounding.
    const first = bar.segments[0];
    if (first?.carried && bar.segments.length === 1 && previousFirst && first.symbol && !same(first.symbol, previousFirst)) carriedDiffers += 1;
    const here = symbols.find((s) => s.source === bar.source);
    if (here) previousFirst = here;
  }
  const offBeat = symbols.filter((s) => Math.abs(s.offset - Math.round(s.offset)) > 1e-6).length;
  const statuses: Record<string, number> = {};
  for (const m of measures) statuses[m.status] = (statuses[m.status] ?? 0) + 1;
  const mismatches = measures.flatMap((m, ordinal) => {
    if (m.status !== 'mismatch' && m.status !== 'incomplete' && m.status !== 'pickup') return [];
    const kind =
      m.status === 'incomplete'
        ? ordinal === 0
          ? 'explicit pickup, implicit="yes" (first bar)'
          : ordinal === measures.length - 1
            ? 'explicit incomplete, implicit="yes" (last bar)'
            : 'explicit incomplete, implicit="yes" (inside)'
        : m.status === 'pickup'
          ? 'pickup: short first bar, no implicit (notated length kept)'
          : m.walked > (m.nominal ?? 0)
            ? 'mismatch: overfull (notated length kept)'
            : ordinal === measures.length - 1
              ? 'mismatch: short last bar (metre length)'
              : 'mismatch: short inside (metre length)';
    return [{ ordinal, number: numbers[ordinal] ?? '', walked: m.walked, nominal: m.nominal, kind }];
  });
  return {
    sha256,
    paths,
    symbols: symbols.map((s, i) => [s.measure, s.offset, s.root, s.text, where[i]?.staff ?? '', where[i]?.part ?? 0]),
    measures: measures.map((m, ordinal) => [ordinal, numbers[ordinal] ?? '', m.walked, m.nominal, m.implicit, m.status, m.length]),
    harmonyParts: [...harmonyParts].sort((a, b) => a - b),
    partCount: partMeasures.length,
    metres: [...metres],
    numbering: numberingOf(numbers),
    bars: bars.length,
    legacyBars: chartMeasureCount(xml, symbols.length),
    unplaced: report.unplaced.length,
    splitBars,
    restatementOnlyBars,
    restatementEvents,
    merged: report.merged.length,
    mergedKinds,
    conflicts: report.conflicts.map((c, i) => ({ bar: c.label ?? '', source: c.source, offset: c.offset, texts: c.symbols.map((s) => s.text), kind: conflictKinds[i] ?? '' })),
    outside: report.outside.map((o) => ({ bar: o.symbol.label, source: o.symbol.source, offset: o.symbol.offset, length: o.length, text: o.symbol.text })),
    lateFirst,
    offBeat,
    threePlus,
    maxEvents,
    densest,
    carriedDiffers,
    statuses,
    mismatches,
  };
}

function summarise(label: string, rows: FileRow[]): string[] {
  const sum = (pick: (r: FileRow) => number): number => rows.reduce((total, r) => total + pick(r), 0);
  const count = (test: (r: FileRow) => boolean): number => rows.filter(test).length;
  const tally = (values: string[]): string =>
    Object.entries(values.reduce<Record<string, number>>((acc, v) => ({ ...acc, [v]: (acc[v] ?? 0) + 1 }), {}))
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} ${String(v)}`)
      .join('; ');
  const statusTotals: Record<string, number> = {};
  for (const r of rows) for (const [k, v] of Object.entries(r.statuses)) statusTotals[k] = (statusTotals[k] ?? 0) + v;
  const mismatchKinds = rows.flatMap((r) => r.mismatches.map((m) => m.kind));
  return [
    `## ${label}`,
    `files with a chord symbol the reader names: ${String(rows.length)}; symbols: ${String(sum((r) => r.symbols.length))}; chart bars: ${String(sum((r) => r.bars))}`,
    `bars with two or more written events (split bars): ${String(sum((r) => r.splitBars))} in ${String(count((r) => r.splitBars > 0))} files`,
    `  of which every event restates one chord (kept, classified): ${String(sum((r) => r.restatementOnlyBars))} bars; restatement events (a written event equal to the harmony just before it in its bar): ${String(sum((r) => r.restatementEvents))}`,
    `bars with three or more written events: ${String(sum((r) => r.threePlus))} in ${String(count((r) => r.threePlus > 0))} files; files with a bar of six or more: ${String(count((r) => r.maxEvents >= 6))} (most in one bar: ${String(Math.max(0, ...rows.map((r) => r.maxEvents)))})`,
    `late first symbols (a bar opening on a carried segment before its first written symbol): ${String(sum((r) => r.lateFirst))} bars in ${String(count((r) => r.lateFirst > 0))} files`,
    `symbols off a quarter-note beat: ${String(sum((r) => r.offBeat))} in ${String(count((r) => r.offBeat > 0))} files`,
    `exact duplicates at one offset merged: ${String(sum((r) => r.merged))} in ${String(count((r) => r.merged > 0))} files; the duplicate stood on: ${tally(rows.flatMap((r) => r.mergedKinds)) || 'none'}`,
    `different harmonies at one offset (conflicts, listed below): ${String(sum((r) => r.conflicts.length))} in ${String(count((r) => r.conflicts.length > 0))} files; from: ${tally(rows.flatMap((r) => r.conflicts.map((c) => c.kind))) || 'none'}`,
    `positions outside the bar (before 0, or at or after its length; listed below): ${String(sum((r) => r.outside.length))} in ${String(count((r) => r.outside.length > 0))} files`,
    `whole-bar carries whose harmony differs from today's chartBars carry (a bar after a split bar now carries the last chord, not the first): ${String(sum((r) => r.carriedDiffers))} in ${String(count((r) => r.carriedDiffers > 0))} files`,
    `bar statuses (harmony part, every measure): ${Object.entries(statusTotals).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${String(v)}`).join('; ')}`,
    `  incomplete and mismatched bars by kind: ${tally(mismatchKinds) || 'none'}`,
    `bar numbering of the harmony part: ${tally(rows.map((r) => r.numbering))}`,
    `bars drawn past the last source measure by chartSegments: ${String(sum((r) => Math.max(0, r.bars - r.measures.length)))} (one bar per source measure); symbols whose source measure the harmony part lacks, in no bar: ${String(sum((r) => r.unplaced))}`,
    `files where today's chartBars count (ChordChartScreen's max of the distinct measure numbers and the symbol count; the screen, unchanged) exceeds the source measures: ${String(count((r) => r.legacyBars > r.measures.length))}, drawing ${String(sum((r) => Math.max(0, r.legacyBars - r.measures.length)))} bars past the last measure (recorded, not PH1's)`,
    `files with chord symbols in more than one part: ${String(count((r) => r.harmonyParts.length > 1))}; files with more than one part: ${String(count((r) => r.partCount > 1))}`,
    `metres (files whose harmony part writes each; a file can write several): ${tally(rows.flatMap((r) => r.metres))}`,
    `files not in 4/4 alone: ${String(count((r) => !(r.metres.length === 1 && r.metres[0] === '4/4')))}`,
    '',
  ];
}

it('writes the census', () => {
  const main = process.env.PIANOPATH_PH1_MAIN ?? '';
  const out = process.env.PIANOPATH_PH1_OUT ?? '';
  const summary = process.env.PIANOPATH_PH1_SUMMARY ?? '';
  const files = corpus(main, join(process.cwd(), '..'), true);
  const rows: FileRow[] = [];
  for (const file of files) {
    const xml = toMusicXml(file.bytes);
    const row = rowOf(file.sha256, file.paths, xml);
    if (row) rows.push(row);
  }
  writeFileSync(out, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');

  const content = rows.filter((r) => r.paths.some((p) => p.startsWith('content/')));
  const bundle = rows.filter((r) => r.paths.some((p) => p.startsWith('bundle/')));
  const name = (r: FileRow): string => r.paths.filter((p) => !p.startsWith('fixtures/')).join(' = ') || r.paths.join(' = ');
  const lines = [
    '# PH1 census: positioned harmony, read by the new reader',
    '',
    `Corpus: ${String(files.length)} distinct MusicXML contents (content/scores, the built bundle, the test fixtures, the PDMX quarry dumps; corpus.ts), ${String(rows.length)} with a chord symbol the reader names (quarry-only: ${String(rows.filter((r) => r.paths.every((p) => p.startsWith('quarry/'))).length)}, read for the music21 witness, not counted below). Read through toMusicXml, readHarmony and chartSegments (one bar per source measure, keyed by the source-measure ordinal, not the written number); census.table.ts.`,
    '',
    ...summarise('Source corpus (content/scores/)', content),
    ...summarise('Bundle (built app/public/content/scores/)', bundle),
    '## The two A7b.1 charts',
    ...[BLUE_BOSSA, INSENSATEZ].flatMap((id) => {
      const row = rows.find((r) => r.paths.some((p) => p.includes(id) && p.startsWith('content/')));
      return row
        ? [`${id}: ${String(row.symbols.length)} symbols, ${String(row.splitBars)} split bars, outside ${String(row.outside.length)}, conflicts ${String(row.conflicts.length)}, merged ${String(row.merged)}, statuses ${JSON.stringify(row.statuses)}, numbering ${row.numbering}, metres ${row.metres.join(',')}`]
        : [`${id}: NOT FOUND`];
    }),
    '',
    '## Files with chord symbols in more than one part',
    ...rows.filter((r) => r.harmonyParts.length > 1).map((r) => `${name(r)}: parts ${r.harmonyParts.join(',')} of ${String(r.partCount)}`),
    '',
    '## Every conflict (different harmonies at one offset), by file',
    ...rows.filter((r) => r.conflicts.length > 0).flatMap((r) => [`${name(r)} (harmony parts ${r.harmonyParts.join(',')} of ${String(r.partCount)})`, ...r.conflicts.map((c) => `  bar ${String(c.bar)} @${String(c.offset)}: ${c.texts.join(' | ')} (${c.kind})`)]),
    '',
    '## Every position outside its bar, by file',
    ...rows.filter((r) => r.outside.length > 0).flatMap((r) => [name(r), ...r.outside.map((o) => `  bar ${String(o.bar)} @${String(o.offset)} (bar length ${String(o.length)}): ${o.text}`)]),
    '',
    '## Bars of six or more written events, by file',
    ...rows.filter((r) => r.densest.length > 0).flatMap((r) => [name(r), ...r.densest.map((d) => `  bar ${String(d.bar)}: ${String(d.events)} events: ${d.texts.join(' ')}`)]),
    '',
    '## Pickups without implicit, and mismatched bars, by file',
    ...rows
      .filter((r) => r.mismatches.some((m) => !m.kind.startsWith('explicit')))
      .flatMap((r) => [name(r), ...r.mismatches.filter((m) => !m.kind.startsWith('explicit')).map((m) => `  ordinal ${String(m.ordinal)} (number ${m.number}): walked ${String(m.walked)}, nominal ${String(m.nominal)}: ${m.kind}`)]),
    '',
  ];
  writeFileSync(summary, lines.join('\n'));
  expect(rows.length).toBeGreaterThan(90);
});
