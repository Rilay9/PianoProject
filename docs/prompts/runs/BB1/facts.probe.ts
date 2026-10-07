/**
 * A7b.1 probe, Stations 2-4: the app's own functions run, their outputs written to
 * build/A7b1-probe/app-facts.json for the music21 comparison (Python) and the report.
 * A throwaway reader, never committed; it asserts nothing about what the outputs should be.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'vitest';
import { romanToChord, shellChord, nameHeldChord } from '../../src/engine/drills/theory';
import { drillFromCatalog } from '../../src/engine/drills/fromCatalog';
import {
  LAB_KEYS,
  LAB_PRESETS,
  labProgression,
  romanToLabChord,
  chordsForProgression,
  buildLabExercise,
  parseRomanList,
  labKey,
  type LabLeftHand,
} from '../../src/engine/sightReading';
import { parseHarmony, chartBars, chordMatch } from '../../src/score/harmony';
import { toMusicXml } from '../../src/score/mxl';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..', '..');
const out: Record<string, unknown> = {};
const NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const pcs = (midis: readonly number[]): number[] => [...new Set(midis.map((m) => ((m % 12) + 12) % 12))].sort((a, b) => a - b);
const names = (p: readonly number[]): string => p.map((x) => NAMES[x]).join('-');

test('station 3: shellChord and romanToChord over five minor keys', () => {
  const keys: Record<string, number> = { c: 0, g: 7, d: 2, f: 5, a: 9 };
  const rows: unknown[] = [];
  for (const [k, tonic] of Object.entries(keys)) {
    for (const fig of ['iiø7', 'V7', 'i']) {
      const shell = shellChord(fig, tonic);
      const full = romanToChord(fig, tonic);
      rows.push({ key: k, figure: fig, shell: shell ? pcs(shell.pitches) : null, shellMidi: shell?.pitches,
        full: full ? pcs(full.pitches) : null });
    }
  }
  out.station3 = rows;
  // The catalogue row as it is, and the same row asked for in minor keys (no mode parameter exists).
  const catalog = JSON.parse(readFileSync(path.join(repo, 'content', 'catalog.static.json'), 'utf-8'));
  const items = Array.isArray(catalog) ? catalog : catalog.items;
  const row = items.find((i: { id: string }) => i.id === 'drill.jazz.ii-v-i-shells');
  const prompts = (d: unknown) =>
    ((d as { prompts: { label: string; expected: number[] }[] }).prompts).map((p) => ({ label: p.label, expected: names(pcs(p.expected)) }));
  out.catalogRow = row.drill;
  out.catalogDrill = prompts(drillFromCatalog(row));
  const minorTry = { ...row, id: 'probe.minor', drill: { kind: 'chord', params: { progression: 'iiø7-V7-i', keys: ['C', 'G', 'D'], voicing: 'shell' } } };
  out.minorTryDrill = prompts(drillFromCatalog(minorTry));
  const ninePrompts = { ...row, id: 'probe.nine', drill: { kind: 'chord', params: { progression: 'iiø7-V7-i', keys: ['C', 'G', 'D'], voicing: 'shell' } } };
  out.minorTryDrill9 = prompts(drillFromCatalog(ninePrompts, { count: 9 }));
});

test('station 4: the Lab', () => {
  const minors = LAB_KEYS.filter((k) => k.mode === 'minor');
  const prog = labProgression('ii-v-i');
  out.labMinorRow = prog.minor;
  out.labMajorRow = prog.major;
  out.labKeys = minors.map((k) => ({ id: k.id, tonic: k.tonic, fifths: k.fifths,
    chords: prog.minor.map((r) => { const c = romanToLabChord(r, k); return c ? { roman: r, label: c.label, pcs: c.pitchClasses } : null; }) }));
  out.labPresets = LAB_PRESETS.map((p) => ({ id: p.id, keyId: p.keyId, progressionId: p.progressionId, leftHand: p.leftHand, rightHand: p.rightHand, bed: p.bed, locks: p.locks }));
  out.ii7V7I_inC = parseRomanList('ii7 V7 I').map((r) => { const c = romanToLabChord(r, labKey('c-major')); return c && { roman: r, label: c.label, pcs: names([...c.pitchClasses].sort((a, b) => a - b)) }; });
  out.ii7V7I_inAminor = parseRomanList('ii7 V7 I').map((r) => { const c = romanToLabChord(r, labKey('a-minor')); return c && { roman: r, label: c.label, pcs: names([...c.pitchClasses].sort((a, b) => a - b)) }; });
  const harmony = chordsForProgression(prog.minor, labKey('c-minor')).filter((c): c is NonNullable<typeof c> => c !== null);
  const written: Record<string, unknown> = {};
  for (const lh of ['whole', 'chord', 'alberti', 'broken', 'walking', 'none'] as LabLeftHand[]) {
    const ex = buildLabExercise({ title: 'probe', fifths: -3, harmony, leftHand: lh, rightHand: 'chord-tones', seed: 1 });
    const xml = ex.musicXml;
    const bars: unknown[] = [];
    for (const m of xml.matchAll(/<measure\b[^>]*number="(\d+)"[^>]*>([\s\S]*?)<\/measure>/g)) {
      const body = m[2] ?? '';
      const labels = [...body.matchAll(/<harmony[\s\S]*?<\/harmony>|<words[^>]*>([^<]*)<\/words>/g)].map((h) => h[1] ?? h[0].replace(/\s+/g, ' ').slice(0, 160));
      const staffNotes: Record<string, string[]> = { '1': [], '2': [] };
      for (const n of body.matchAll(/<note>([\s\S]*?)<\/note>/g)) {
        const nb = n[1] ?? '';
        const step = /<step>([A-G])<\/step>/.exec(nb)?.[1];
        if (!step) continue;
        const alter = Number(/<alter>(-?\d+)<\/alter>/.exec(nb)?.[1] ?? '0');
        const oct = /<octave>(\d)<\/octave>/.exec(nb)?.[1];
        const staff = /<staff>(\d)<\/staff>/.exec(nb)?.[1] ?? '1';
        const chord = nb.includes('<chord') ? '+' : ' ';
        staffNotes[staff]?.push(`${chord}${step}${alter > 0 ? '#'.repeat(alter) : 'b'.repeat(-alter)}${oct}`);
      }
      bars.push({ bar: m[1], labels, rh: staffNotes['1']?.join(''), lh: staffNotes['2']?.join('') });
    }
    written[lh] = bars;
  }
  out.labWritten = written;
});

test('station 2 and 4: the chart reader, chartBars, chordMatch', () => {
  const files: Record<string, string> = {
    blueBossa: path.join(repo, 'content', 'scores', 'pdmx', 'QmTjGkyTi49tTTBrqFYXcTzdGaMMGrmViuc46mN7qmmGo6.mxl'),
    insensatez: path.join(repo, 'content', 'scores', 'pdmx', 'QmemwmomPM2tq51u1sTFEAPqdzPkwrJkuKCsMThnKqpvFW.mxl'),
  };
  const shells: Record<string, number[]> = {
    'D-F-C': [50, 53, 60], 'G-B-F': [55, 59, 65], 'C-Eb-A': [48, 51, 57], 'C-Eb-Bb': [48, 51, 58],
    'B-D-A': [47, 50, 57], 'E-G#-D': [52, 56, 62], 'A-C-G': [45, 48, 55], 'D-F-Ab-C': [50, 53, 56, 60],
  };
  for (const [label, file] of Object.entries(files)) {
    const xml = toMusicXml(new Uint8Array(readFileSync(file)));
    const symbols = parseHarmony(xml);
    const measureCount = new Set([...xml.matchAll(/<measure\b[^>]*\bnumber="([^"]+)"/g)].map((m) => m[1])).size;
    const bars = chartBars(symbols, Math.max(measureCount, symbols.length));
    out[`${label}Symbols`] = symbols.map((s) => ({ measure: s.measure, text: s.text, pcs: names([...s.pitchClasses].sort((a, b) => a - b)), n: s.pitchClasses.length }));
    out[`${label}ChartBars`] = bars.map((s, i) => `${i + 1}:${s?.text ?? '—'}`);
    const match: Record<string, Record<string, number>> = {};
    for (const s of symbols) {
      const key = `${s.measure}:${s.text}`;
      match[key] = {};
      for (const [sh, midis] of Object.entries(shells)) match[key][sh] = Math.round(chordMatch(s, midis) * 1000) / 1000;
      const root = s.root;
      match[key]['root-fifth bass'] = Math.round(chordMatch(s, [36 + root, 43 + root]) * 1000) / 1000;
    }
    out[`${label}ChordMatch`] = match;
  }
});

test('free play: nameHeldChord on the shells', () => {
  const held: Record<string, number[]> = {
    'D-F-C': [50, 53, 60], 'D-F-Ab-C': [50, 53, 56, 60], 'D-F-A-C': [50, 53, 57, 60], 'G-B-F': [55, 59, 65],
    'C-Eb-A': [48, 51, 57], 'C-Eb-Bb': [48, 51, 58], 'C-Eb-G-A': [48, 51, 55, 57],
  };
  out.nameHeldChord = Object.fromEntries(Object.entries(held).map(([k, v]) => [k, nameHeldChord(v)]));
  writeFileSync(path.join(repo, 'build', 'A7b1-probe', 'app-facts.json'), JSON.stringify(out, null, 1));
});
