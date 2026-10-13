// The lab's music (owner, 2026-10-13): chord charts and styles as content (public/content/lab), read into a form (the
// bars with their chords, in time), the band's notes for it (a style played over the chords), and what each beginner
// step asks of you. Nothing here makes up a melody: the band's parts are the chords played in the style's pattern.
//
// A chart:  { "title", "meter": "4/4", "tempo": 84, "style": "shuffle",
//             "bars": ["C7", "F7 G7", ...],            one chord a bar, or chords splitting it evenly
//             "improvise": { "scale": "C blues" } }    the scale lit for improvising (Tonal's scale names)
// A style:  { "name", "meter": "4/4", "grid": 3,         steps a beat in the drum patterns (2: eighths, 3: triplets)
//             "drums": { "kick": "x.. ... x.. ...", ... }  one character a step ('x' hit, 'X' loud, 'o' soft, '.' none)
//             "bass":  [[1, "root"], [2, "fifth"], ...]    beat (1-based, may be 2.5) and chord degree
//             "chords": [[2, 0.5], [4, 0.5]]               beat and length in beats of each chord hit
//             "instruments": { "bass": "acoustic_bass", "chords": "piano" } }   General MIDI names (sound.ts)

import { Chord, Note, Scale } from 'tonal';
import type { Beat, NoteEvent } from '../sound';

export interface Meter { beats: number; beatType: number }
export interface ChartFile { title: string; meter?: string; tempo?: number; style?: string; bars: string[]; improvise?: { scale?: string } }
export interface Chart { id: string; title: string; meter: Meter; tempo: number; style: string; bars: string[][]; scale: string | null }
export interface StyleFile {
  name: string; meter?: string; grid?: number; drums?: Record<string, string>; bass?: [number, string][]; chords?: [number, number][];
  instruments?: { bass?: string; chords?: string };
}
export interface Style { id: string; name: string; meter: Meter; grid: number; drums: { midi: number; steps: number[] }[]; bass: [number, string][]; chords: [number, number][]; bassSound: string; chordSound: string }

/** A chord as the lab uses it: its symbol, root, pitch classes (0-11) and what each note is (root, 3rd, ♭5, 7th...). */
export interface ChordInfo { symbol: string; root: number; rootName: string; pcs: number[]; names: string[]; degrees: string[] }

const DEGREE: Record<string, string> = { '1P': 'root', '2M': '2nd', '3m': '3rd', '3M': '3rd', '4P': '4th', '5d': '♭5', '5P': '5th', '5A': '♯5', '6M': '6th', '7d': '7th', '7m': '7th', '7M': '7th', '9m': '♭9', '9M': '9th', '9A': '♯9', '11P': '11th', '11A': '♯11', '13M': '13th' };
const pc = (n: string) => ((Note.chroma(n) ?? 0) + 12) % 12;
const show = (n: string) => n.replace(/#/g, '♯').replace(/([A-G])b/g, '$1♭');

export function chordInfo(symbol: string): ChordInfo {
  const c = Chord.get(symbol);
  if (c.empty || !c.tonic) throw new Error(`"${symbol}" is not a chord symbol the lab can read`);
  return { symbol, root: pc(c.tonic), rootName: show(c.tonic), pcs: c.notes.map(pc), names: c.notes.map(show), degrees: c.intervals.map((i) => DEGREE[i] ?? i) };
}

function meterOf(text: string | undefined): Meter {
  const m = /^(\d+)\/(\d+)$/.exec(text ?? '4/4');
  if (!m) throw new Error(`metre "${text}" should be like 4/4`);
  return { beats: Number(m[1]), beatType: Number(m[2]) };
}

export function readChart(id: string, f: ChartFile): Chart {
  if (!Array.isArray(f.bars) || !f.bars.length) throw new Error('it has no bars');
  const bars = f.bars.map((b) => b.trim().split(/\s+/));
  for (const bar of bars) for (const s of bar) chordInfo(s); // every symbol readable, or the chart is refused
  if (f.improvise?.scale && Scale.get(f.improvise.scale).empty) throw new Error(`"${f.improvise.scale}" is not a scale name the lab can read`);
  return { id, title: f.title, meter: meterOf(f.meter), tempo: f.tempo ?? 90, style: f.style ?? '', bars, scale: f.improvise?.scale ?? null };
}

/** General MIDI drum numbers by the names styles use. */
const DRUMS: Record<string, number> = { kick: 36, snare: 38, rim: 37, clap: 39, hihat: 42, 'hihat-open': 46, ride: 51, crash: 49, 'tom-low': 45, 'tom-high': 48, tambourine: 54, cowbell: 56 };

export function readStyle(id: string, f: StyleFile): Style {
  const meter = meterOf(f.meter), grid = f.grid ?? 2, steps = meter.beats * grid;
  const drums = Object.entries(f.drums ?? {}).map(([name, pattern]) => {
    const midi = DRUMS[name];
    if (midi === undefined) throw new Error(`drum "${name}" is not one of ${Object.keys(DRUMS).join(', ')}`);
    const cells = pattern.replace(/\s+/g, '');
    if (cells.length !== steps) throw new Error(`the ${name} pattern has ${cells.length} steps; a bar of ${f.meter ?? '4/4'} at ${grid} a beat has ${steps}`);
    return { midi, steps: [...cells].map((ch) => (ch === 'X' ? 115 : ch === 'x' ? 90 : ch === 'o' ? 60 : 0)) };
  });
  const degrees = ['root', 'third', 'fifth', 'sixth', 'seventh', 'octave', 'approach'];
  for (const [, d] of f.bass ?? []) if (!degrees.includes(d)) throw new Error(`bass degree "${d}" is not one of ${degrees.join(', ')}`);
  return { id, name: f.name, meter, grid, drums, bass: f.bass ?? [], chords: f.chords ?? [], bassSound: f.instruments?.bass ?? 'acoustic_bass', chordSound: f.instruments?.chords ?? 'piano' };
}

/** A chord in the form: where it starts and how long it lasts (in beats from the start of the form), and its bar. */
export interface Span { bar: number; at: number; beats: number; chord: ChordInfo }
export interface Form { chart: Chart; beatMs: number; barBeats: number; spans: Span[]; length: number /* beats in one time round */ }

/** The chart in time at its own tempo (speed is the clock's business). */
export function formOf(chart: Chart): Form {
  const barBeats = chart.meter.beats, spans: Span[] = [];
  chart.bars.forEach((symbols, bar) => {
    const each = barBeats / symbols.length;
    symbols.forEach((s, k) => spans.push({ bar, at: bar * barBeats + k * each, beats: each, chord: chordInfo(s) }));
  });
  // A beat is the metre's beat (a quarter in 4/4); tempo is quarter notes a minute.
  const beatMs = (60000 / chart.tempo) * (4 / chart.meter.beatType);
  return { chart, beatMs, barBeats, spans, length: chart.bars.length * barBeats };
}

/** Where a position in beats falls in time; in a swung style (triplet grid) an offbeat half sits on the third triplet. */
export function beatT(form: Form, style: Style, beats: number): number {
  const whole = Math.floor(beats), frac = beats - whole;
  const swung = style.grid === 3 && Math.abs(frac - 0.5) < 1e-6 ? 2 / 3 : frac;
  return (whole + swung) * form.beatMs;
}

/** Root position chords from about F3 up, the bass around the second octave: what the band plays and the keys lit. */
export function voicing(c: ChordInfo, low = 53): number[] {
  let root = 48 + c.root;
  if (root < low) root += 12; // the root between F3 and E4
  const out = [root];
  for (const p of c.pcs.slice(1)) { let m = root + ((p - c.root + 12) % 12); while (m <= out[out.length - 1]) m += 12; out.push(m); }
  return out;
}
function bassNote(c: ChordInfo, degree: string, next: ChordInfo | undefined): number {
  const root = 36 + c.root; // C2..B2
  const at = (semis: number) => root + semis;
  const third = c.degrees.includes('3rd') ? (c.pcs[c.degrees.indexOf('3rd')] - c.root + 12) % 12 : 4;
  const fifthIdx = c.degrees.findIndex((d) => d === '5th' || d === '♭5' || d === '♯5');
  const fifth = fifthIdx >= 0 ? (c.pcs[fifthIdx] - c.root + 12) % 12 : 7;
  const seventhIdx = c.degrees.indexOf('7th');
  const seventh = seventhIdx >= 0 ? (c.pcs[seventhIdx] - c.root + 12) % 12 : 10;
  switch (degree) {
    case 'third': return at(third);
    case 'fifth': return at(fifth);
    case 'sixth': return at(9);
    case 'seventh': return at(seventh);
    case 'octave': return at(12);
    case 'approach': { const target = 36 + (next ?? c).root; return target - 1; } // a half step below the next root
    default: return root;
  }
}

/** The band's parts to play. */
export interface Parts { drums: boolean; bass: boolean; chords: boolean }

/**
 * The band's notes for `rounds` times round the form, from t = 0 (ms at speed 1); the chords on its chord sound, the
 * bass on its bass sound, the drums on the kit. youChords: the chords as one of the beginner steps play them (to hear
 * your part first), instead of the style's.
 */
export function bandNotes(form: Form, style: Style, parts: Parts, rounds: number, yourStep?: AccompStep): NoteEvent[] {
  const out: NoteEvent[] = [];
  const roundMs = (r: number) => r * form.length * form.beatMs;
  for (let r = 0; r < rounds; r++) {
    const t0 = roundMs(r);
    for (let bar = 0; bar < form.chart.bars.length; bar++) {
      const barAt = bar * form.barBeats;
      if (parts.drums) for (const d of style.drums) d.steps.forEach((vel, k) => {
        if (vel) out.push({ t: t0 + beatT(form, style, barAt + k / style.grid), midi: d.midi, dur: 200, vel, part: 'drums' });
      });
    }
    form.spans.forEach((sp, i) => {
      const next = form.spans[i + 1]?.chord ?? form.spans[0].chord;
      const barStart = Math.floor(sp.at / form.barBeats + 1e-9) * form.barBeats;
      // A style's beat (1-based in the bar) belongs to this chord if it falls within it.
      const inSpan = (beat: number) => { const abs = barStart + beat - 1; return abs >= sp.at - 1e-6 && abs < sp.at + sp.beats - 1e-6; };
      if (parts.bass) for (const [beat, degree] of style.bass) if (inSpan(beat)) {
        out.push({ t: t0 + beatT(form, style, barStart + beat - 1), midi: bassNote(sp.chord, degree, next), dur: form.beatMs * 0.9, vel: 85, part: style.bassSound });
      }
      if (parts.chords && !yourStep) for (const [beat, len] of style.chords) if (inSpan(beat)) {
        for (const m of voicing(sp.chord)) out.push({ t: t0 + beatT(form, style, barStart + beat - 1), midi: m, dur: len * form.beatMs * 0.95, vel: 70, part: style.chordSound });
      }
    });
    if (yourStep) for (const h of hits(form, style, yourStep)) {
      const notes = yourStep === 'roots' ? [voicing(h.chord)[0]] : voicing(h.chord);
      for (const m of notes) out.push({ t: t0 + h.t, midi: m, dur: Math.max(200, h.until - h.t) * 0.9, vel: 80, part: 'piano' });
    }
  }
  return out;
}

/** The metronome's beats for the rounds (the drums keep time too; this is the click, or the count-in). */
export function clickBeats(form: Form, style: Style, rounds: number): Beat[] {
  const out: Beat[] = [];
  for (let b = 0; b < rounds * form.length; b++) out.push({ t: beatT(form, style, b), accent: b % form.barBeats === 0 });
  return out;
}

// ---- what you play: the beginner steps -------------------------------------------------------------------------

/** Accompaniment steps (owner, 2026-10-13): the root on beat 1, the chord on beat 1, the style's rhythm, your own way. */
export type AccompStep = 'roots' | 'beat1' | 'style' | 'own';
export const ACCOMP_STEPS: { id: AccompStep; name: string; detail: string; doing: string }[] = [
  { id: 'roots', name: 'Roots', detail: 'one note a chord, on its first beat', doing: 'Play the root of each chord on its first beat' },
  { id: 'beat1', name: 'Chords on the beat', detail: 'the whole chord, held', doing: 'Play the chord on its first beat · hold it' },
  { id: 'style', name: "The style's rhythm", detail: 'the chord where the band plays it', doing: 'Play the chord in the rhythm shown' },
  { id: 'own', name: 'Your own way', detail: 'any voicing, any rhythm', doing: 'Play each chord your way: its notes, any time in it' },
];
/** Lead steps over a chord chart (improvising; told plainly how it went, not marked). */
export type LeadStep = 'root' | 'tones' | 'scale' | 'free' | 'answer';
export const LEAD_STEPS: { id: LeadStep; name: string; detail: string; doing: string }[] = [
  { id: 'root', name: 'Roots in rhythm', detail: 'one note, with the drums', doing: 'Play the lit root, in rhythm with the drums' },
  { id: 'tones', name: 'Chord notes', detail: 'the lit notes of each chord', doing: 'Play any lit key · change with the chord' },
  { id: 'scale', name: 'The scale', detail: 'the lit scale; land on a chord note', doing: 'Play any lit key · land on a dark one when the chord changes' },
  { id: 'answer', name: 'Call and answer', detail: 'the band plays two bars, you answer two', doing: 'Listen for two bars · answer in the next two' },
  { id: 'free', name: 'Free', detail: 'nothing lit; just play', doing: 'Play over the band, your way' },
];

/** A moment you are to play (accompaniment): its time in the round (ms at speed 1), until when, its chord and bar. */
export interface Hit { t: number; until: number; chord: ChordInfo; bar: number; span: number }

/** The hits a step asks for in one round. */
export function hits(form: Form, style: Style, step: AccompStep): Hit[] {
  const out: Hit[] = [];
  form.spans.forEach((sp, i) => {
    const end = (sp.at + sp.beats) * form.beatMs;
    if (step === 'style') {
      const barStart = Math.floor(sp.at / form.barBeats + 1e-9) * form.barBeats;
      const ins = style.chords.filter(([beat]) => barStart + beat - 1 >= sp.at - 1e-6 && barStart + beat - 1 < sp.at + sp.beats - 1e-6);
      ins.forEach(([beat], k) => {
        const t = beatT(form, style, barStart + beat - 1);
        const nextT = k + 1 < ins.length ? beatT(form, style, barStart + ins[k + 1][0] - 1) : end;
        out.push({ t, until: nextT, chord: sp.chord, bar: sp.bar, span: i });
      });
      if (!ins.length) out.push({ t: sp.at * form.beatMs, until: end, chord: sp.chord, bar: sp.bar, span: i });
      return;
    }
    out.push({ t: sp.at * form.beatMs, until: end, chord: sp.chord, bar: sp.bar, span: i });
  });
  return out;
}

/** The pitch classes of a scale by Tonal's name ("C blues"), or none. */
export function scalePcs(name: string | null): number[] { return name ? Scale.get(name).notes.map(pc) : []; }
