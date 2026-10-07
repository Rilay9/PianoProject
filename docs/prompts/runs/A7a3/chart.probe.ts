/**
 * A7a.3 probe, Station 3 (and the consumer column of Station 1's claim checks): the app's own
 * functions run on the committed / built files, outputs written to build/a7a3/app-facts.json.
 * A throwaway reader, never committed; it asserts nothing about what the outputs should be.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'vitest';
import { chartBars, chartSegments, chordMatch, readHarmony, type ChordSymbol } from '../../src/score/harmony';
import { chartBarCounts, chartTiming, tempoFieldDefault } from '../../src/score/metre';
import { toMusicXml } from '../../src/score/mxl';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..', '..');
const NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const names = (p: readonly number[]): string => [...p].sort((a, b) => a - b).map((x) => NAMES[x]).join('-');

const FILES: Record<string, { file: string; tempoBpm: number }> = {
  // tempoBpm as the main checkout's built catalog.json gives it (read separately, recorded in the report).
  'song.blues.st-james-infirmary': { file: path.join(repo, 'content/scores/pdmx/Qmdyj1mGLEBPPF13XMNXh6Z3ntb3vSMRK3hrbmSw3Bk6gs.mxl'), tempoBpm: 96 },
  'song.classical.st-louis-blues.pdmx': { file: path.join(repo, 'content/scores/pdmx/QmYutJi8H9KmexPTGDuRXTzQNkqnu1Jk8ERW1gZiMs33ZG.mxl'), tempoBpm: 96 },
  'exercise.walking-bass.c.minor-blues': { file: path.join(repo, 'build/a7a3/gen/exercise.walking-bass.c.minor-blues.mxl'), tempoBpm: 92 },
  'exercise.walking-bass.e-flat.minor-blues': { file: path.join(repo, 'build/a7a3/gen/exercise.walking-bass.e-flat.minor-blues.mxl'), tempoBpm: 92 },
};

const out: Record<string, unknown> = {};

test('station 3: chartBars against chartSegments, the timing, and chordMatch', () => {
  for (const [id, { file, tempoBpm }] of Object.entries(FILES)) {
    const xml = toMusicXml(new Uint8Array(readFileSync(file)));
    const { symbols, measures } = readHarmony(xml);
    // The screen's own measure count and call (ChordChartScreen.ts:638-639).
    const measureCount = new Set([...xml.matchAll(/<measure\b[^>]*\bnumber="([^"]+)"/g)].map((m) => m[1])).size;
    const today = chartBars(symbols, Math.max(measureCount, symbols.length));
    const { bars, report } = chartSegments(symbols, measures);
    const timing = chartTiming(chartBarCounts(measures, today.length));
    const perBar = bars.map((b, i) => {
      const segs = b.segments.map((s) => `${s.symbol?.text ?? (s.conflict ? 'CONFLICT' : '—')}@${s.start}${s.carried ? '(carried)' : ''}`);
      const written = b.segments.filter((s) => !s.carried).length;
      return { bar: i + 1, today: today[i]?.text ?? null, segments: segs, written, dropped: Math.max(0, written - 1) };
    });
    out[id] = {
      symbols: symbols.length,
      symbolPcs: symbols.map((s) => ({ m: s.measure, at: s.offset, text: s.text, pcs: names(s.pitchClasses) })),
      measures: measures.length,
      todayBars: today.length,
      segmentBars: bars.length,
      report: { merged: report.merged.length, conflicts: report.conflicts.length, outside: report.outside.length, unplaced: report.unplaced.length },
      barsWithMoreThanOneWritten: perBar.filter((r) => r.written > 1).map((r) => r.bar),
      symbolsTodayDrops: perBar.reduce((n, r) => n + r.dropped, 0),
      perBar,
      chordCount: symbols.length,
      backingOffered: timing.backingOffered,
      beatUnit: timing.beatUnit,
      defaultTempo: tempoFieldDefault(tempoBpm, timing.beatUnit),
    };
  }

  // chordMatch for the record's comps (H5). Symbols built by reading one-symbol fixtures through the app's reader.
  const sym = (root: string, alter: number, kind: string, text: string): ChordSymbol => {
    const xml = `<?xml version="1.0"?><score-partwise><part-list><score-part id="P1"><part-name>P</part-name></score-part></part-list>`
      + `<part id="P1"><measure number="1"><attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes>`
      + `<harmony><root><root-step>${root}</root-step>${alter ? `<root-alter>${alter}</root-alter>` : ''}</root><kind text="${text}">${kind}</kind></harmony>`
      + `<note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration></note></measure></part></score-partwise>`;
    const s = readHarmony(xml).symbols[0];
    if (!s) throw new Error(`no symbol for ${root} ${kind}`);
    return s;
  };
  const pc = (n: string): number => NAMES.indexOf(n);
  const cases: { label: string; symbol: ChordSymbol; played: string[] }[] = [];
  const seventh = (label: string, s: ChordSymbol, root: string, third: string, sev: string, fifth: string) => {
    cases.push({ label: `${label} root-third-seventh`, symbol: s, played: [root, third, sev] });
    cases.push({ label: `${label} third-seventh (rootless shell)`, symbol: s, played: [third, sev] });
    cases.push({ label: `${label} one bass note (root)`, symbol: s, played: [root] });
    cases.push({ label: `${label} root-fifth`, symbol: s, played: [root, fifth] });
  };
  seventh('Bb7', sym('B', -1, 'dominant', '7'), 'Bb', 'D', 'Ab', 'F');
  seventh('A7', sym('A', 0, 'dominant', '7'), 'A', 'Db', 'G', 'E');
  seventh('D7', sym('D', 0, 'dominant', '7'), 'D', 'Gb', 'C', 'A');
  seventh('F7', sym('F', 0, 'dominant', '7'), 'F', 'A', 'Eb', 'C');
  seventh('Cm7', sym('C', 0, 'minor-seventh', 'm7'), 'C', 'Eb', 'Bb', 'G');
  seventh('Fm7', sym('F', 0, 'minor-seventh', 'm7'), 'F', 'Ab', 'Eb', 'C');
  seventh('Ab7', sym('A', -1, 'dominant', '7'), 'Ab', 'C', 'Gb', 'Eb');
  seventh('G7', sym('G', 0, 'dominant', '7'), 'G', 'B', 'F', 'D');
  const dm = sym('D', 0, 'minor', 'm');
  const gm = sym('G', 0, 'minor', 'm');
  cases.push({ label: 'Dm triad', symbol: dm, played: ['D', 'F', 'A'] });
  cases.push({ label: 'Dm one bass note', symbol: dm, played: ['D'] });
  cases.push({ label: 'Gm triad', symbol: gm, played: ['G', 'Bb', 'D'] });
  cases.push({ label: 'Gm one bass note', symbol: gm, played: ['G'] });
  // A walking line's one note against the bar-1 chord (H6's consequence): the Ab7 shell judged against Cm7.
  cases.push({ label: 'Ab7 shell (Ab-C-Gb) judged against Cm7', symbol: sym('C', 0, 'minor-seventh', 'm7'), played: ['Ab', 'C', 'Gb'] });
  cases.push({ label: 'G7 shell (G-B-F) judged against Cm7', symbol: sym('C', 0, 'minor-seventh', 'm7'), played: ['G', 'B', 'F'] });
  cases.push({ label: 'Fm7 shell (F-Ab-Eb) judged against Cm7', symbol: sym('C', 0, 'minor-seventh', 'm7'), played: ['F', 'Ab', 'Eb'] });
  out.chordMatch = cases.map((c) => {
    const score = chordMatch(c.symbol, c.played.map(pc));
    return { label: c.label, symbolPcs: names(c.symbol.pitchClasses), played: c.played.join('-'), score: Math.round(score * 1000) / 1000, verdict: score >= 0.6 ? 'yes' : 'no' };
  });
  writeFileSync(path.join(repo, 'build/a7a3/app-facts.json'), JSON.stringify(out, null, 1));
});

test('the today grid past the file', () => {
  const xml = toMusicXml(new Uint8Array(readFileSync(FILES['song.blues.st-james-infirmary'].file)));
  const { symbols } = readHarmony(xml);
  const measureCount = new Set([...xml.matchAll(/<measure\b[^>]*\bnumber="([^"]+)"/g)].map((m) => m[1])).size;
  const today = chartBars(symbols, Math.max(measureCount, symbols.length));
  writeFileSync(path.join(repo, 'build/a7a3/stj-today-grid.json'), JSON.stringify({ measureCount, symbols: symbols.length, cells: today.map((s, i) => `${i + 1}:${s?.text ?? '-'}`) }));
});
