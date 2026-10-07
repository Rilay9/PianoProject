/**
 * A7a.1 probe, Stations 2-3: the app's own functions run, outputs written to
 * build/A7a1-probe/app-facts.json (repo root build/). A throwaway reader, never part of a suite;
 * it asserts nothing about what the outputs should be.
 *  - Station 2 item 4: chordMatch on the C shuffle's chart (readHarmony + chartBars on the built
 *    file) for the left hand's figure notes alone and together, and for one riff note with each
 *    figure note, per bar (inputs from shuffle.json and events-by-role.json).
 *  - Station 3: the Lab's blues progression in C (romansForProgression, chordsForProgression),
 *    tradeScale and its name, the blues-shuffle preset, labBedFor.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'vitest';
import {
  LAB_PRESETS,
  labProgression,
  romansForProgression,
  chordsForProgression,
  labKey,
  labBedFor,
} from '../../src/engine/sightReading';
import { tradeScale, tradeScaleName } from '../../src/engine/tradingFours';
import { readHarmony, chartBars, chordMatch, parseHarmony } from '../../src/score/harmony';
import { toMusicXml } from '../../src/score/mxl';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..', '..');
const probe = path.join(repo, 'build', 'A7a1-probe');
const NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const pcName = (p: number): string => NAMES[((p % 12) + 12) % 12] as string;
const PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const pcOf = (head: string): number => {
  const s = head.replace(/[0-9]/g, '');
  return (((PC[s[0] as string] as number) + (s.match(/#/g) ?? []).length - (s.slice(1).match(/b/g) ?? []).length) % 12 + 12) % 12;
};
const out: Record<string, unknown> = {};
const THRESHOLD = 0.6; // ChordChartScreen.ts MATCH_THRESHOLD

test('station 2 item 4: chordMatch on the C shuffle chart', () => {
  const file = path.join(repo, 'app', 'public', 'content', 'scores', 'authored', 'exercise.blues.twelve-bar-shuffle.c.mxl');
  const xml = toMusicXml(new Uint8Array(readFileSync(file)));
  const symbols = parseHarmony(xml);
  const { measures } = readHarmony(xml);
  const bars = chartBars(symbols, measures.length || 12);
  const shuffle = JSON.parse(readFileSync(path.join(probe, 'shuffle.json'), 'utf-8'));
  const riff = JSON.parse(readFileSync(path.join(probe, 'events-by-role.json'), 'utf-8')).roles.riff;
  const rows: unknown[] = [];
  let yesCount = 0;
  let total = 0;
  for (let b = 1; b <= bars.length; b += 1) {
    const chord = bars[b - 1];
    const staves = shuffle.bars[String(b)]?.staves ?? {};
    const lower: number[] = [];
    for (const voice of Object.values(staves['2'] ?? {}) as { midi: number[] }[][]) for (const n of voice) lower.push(...n.midi);
    const lhPcs = [...new Set(lower.map((m) => ((m % 12) + 12) % 12))];
    const riffPcs = [...new Set(((riff[String(b)] ?? []) as { head: string }[]).map((e) => pcOf(e.head)))];
    const single = Object.fromEntries(lhPcs.map((p) => [pcName(p), chordMatch(chord ?? null, [p])]));
    const together = chordMatch(chord ?? null, lhPcs);
    const pairs: Record<string, number> = {};
    for (const l of lhPcs) {
      for (const r of riffPcs) {
        const s = chordMatch(chord ?? null, [l, r]);
        pairs[`${pcName(l)}+${pcName(r)}`] = s;
        total += 1;
        if (s >= THRESHOLD) yesCount += 1;
      }
    }
    const riffAlone = Object.fromEntries(riffPcs.map((p) => [pcName(p), chordMatch(chord ?? null, [p])]));
    rows.push({ bar: b, chart: chord?.text ?? chord?.label ?? null, chordPcs: chord?.pitchClasses.map(pcName),
      lhPcs: lhPcs.map(pcName), lhEachAlone: single, lhAllTogether: together, riffPcs: riffPcs.map(pcName),
      riffAlone, lhPlusRiffPairs: pairs });
  }
  out.chart = { symbols: symbols.map((s) => ({ measure: s.measure, pcs: s.pitchClasses.map(pcName),
    text: (s as unknown as { text?: string }).text })), rows, pairsAtOrAboveThreshold: yesCount, pairsTotal: total };
});

test('station 3: the Lab blues preset in C', () => {
  const preset = LAB_PRESETS.find((p) => p.id === 'blues-shuffle');
  const key = labKey('c-major');
  const romans = romansForProgression(labProgression('blues'), key.mode, 12);
  const chords = chordsForProgression(romans, key);
  out.lab = {
    preset,
    bedOpens: labBedFor(preset ?? null, undefined),
    key,
    romans,
    chords: chords.map((c, i) => ({ bar: i + 1, label: (c as unknown as { label?: string })?.label,
      pcs: c?.pitchClasses.map(pcName) })),
    scaleName: tradeScaleName('blues', key.mode),
    scale: tradeScale({ progressionId: 'blues', tonic: key.tonic, mode: key.mode }).map(pcName),
    eOverC7: tradeScale({ progressionId: 'blues', tonic: key.tonic, mode: key.mode }).includes(4),
  };
});

test('write', () => {
  writeFileSync(path.join(probe, 'app-facts.json'), JSON.stringify(out, null, 1));
});
