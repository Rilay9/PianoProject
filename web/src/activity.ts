// Activities (owner, 2026-10-13): one format every screen opens, so a lesson (or a link: ?activity=<id>, a file in
// public/content/activities/) can start a mode with its content and preset choices. The content decides what is
// played; presets are the learner's choices set for the activity: in force while it lasts, changeable, never saved
// over the learner's own. docs/app-features.md §8b describes the format.

import type { SimonLevel } from './exercise/simon';
import type { DrillLevel } from './exercise/drill';
import type { MemoriseOptions } from './memorise';
import type { ClickOn, Device, Hands, Mode, OnTime } from './settings';
import { readLadder } from './lab/music.ts'; // (with .ts: the checks run this file in Node)

/** The score's playing choices an activity can preset (tempo in beats a minute; the rest as the Tempo panel's). */
export interface ScorePreset { mode?: Mode; hands?: Hands; tempo?: number; metronome?: boolean; clickOn?: ClickOn; onTime?: OnTime; ladderStep?: number }
/** Memorise's choices an activity can preset: its options, the hands and the tempo (beats a minute). */
export type MemorisePreset = Partial<MemoriseOptions> & { hands?: 'both' | 'right' | 'left'; tempo?: number };
/** A step of the lab's ladder: its kind (what the app judges) and, if wanted, its own words. */
export interface StepSpec { kind: string; name?: string; detail?: string; doing?: string }
export interface LabPreset {
  role?: 'accomp' | 'lead'; step?: string; style?: string; dropouts?: 'off' | 'drums' | 'band';
  parts?: Partial<{ drums: boolean; bass: boolean; chords: boolean; click: boolean }>;
  /** The ladder for this activity (by role), and the clean rounds (rounds played, lead) before the next step. */
  steps?: { accompaniment?: StepSpec[]; lead?: StepSpec[] }; cleanForNext?: number;
}

/** A range of keys, lowest and highest (MIDI numbers, both white keys, both shown). */
export interface KeyRange { lo: number; hi: number }
/**
 * The keys the on-screen keyboard shows (2026-10-16, owner: "what keys are visible and how wide they are per screen to
 * make playing easier"): a range per kind of screen; a screen left out keeps the screen's own keys.
 */
export type ChosenKeys = Partial<Record<Device, KeyRange>>;
export const DEVICES: Device[] = ['phone-upright', 'phone-sideways', 'tablet'];

export type Activity = { id: string; title: string } & (
  | { screen: 'score'; piece: string; bars?: [number, number]; settings: ScorePreset; keys?: ChosenKeys }
  | { screen: 'memorise'; piece: string; settings: MemorisePreset }
  | { screen: 'simon'; set: string; level: Partial<SimonLevel>; keys?: ChosenKeys }
  | { screen: 'drills'; set: string; level: Partial<DrillLevel>; keys?: ChosenKeys }
  | { screen: 'lab'; chart: string; preset: LabPreset }
  | { screen: 'freeplay'; keys?: ChosenKeys }
);

const LETTER: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const isBlackKey = (m: number) => [1, 3, 6, 8, 10].includes(m % 12);
/** "C4" → 60 ("F#3", "Bb4"); null when it is not a note so written. */
function pitch(s: string): number | null {
  const m = /^([A-G])(#|b)?(\d)$/.exec(s);
  return m ? (Number(m[3]) + 1) * 12 + LETTER[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) : null;
}
/**
 * A range of keys, "C4-E5": its lowest and highest key, both shown. Refused: not so written, off a piano's 88 keys
 * (A0–C8), the highest not above the lowest, or a black key at either end (it would hang off the keyboard's edge).
 */
export function readKeyRange(v: unknown, what: string): KeyRange {
  const parts = typeof v === 'string' ? v.split('-') : [];
  const [lo, hi] = parts.length === 2 ? parts.map(pitch) : [null, null];
  if (lo === null || hi === null) throw new Error(`${what} is ${JSON.stringify(v)}; it should be a range of keys like "C4-E5" (a letter, # or b if wanted, an octave digit)`);
  if (lo < 21 || hi > 108) throw new Error(`${what} "${v}" goes off the piano's keys (A0 to C8)`);
  if (hi <= lo) throw new Error(`${what} "${v}" should go from lower to higher`);
  if (isBlackKey(lo) || isBlackKey(hi)) throw new Error(`${what} "${v}" starts or ends on a black key; start and end on white keys`);
  return { lo, hi };
}
/** The activity's "keys": one range for every screen, or { "phone-upright", "phone-sideways", "tablet" } each a range. */
export function readChosenKeys(v: unknown): ChosenKeys {
  if (typeof v === 'string') { const r = readKeyRange(v, 'keys'); return Object.fromEntries(DEVICES.map((d) => [d, r])); }
  if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new Error(`keys should be a range like "C4-E5", or { ${DEVICES.map((d) => `"${d}"`).join(', ')} } each a range`);
  const out: ChosenKeys = {};
  for (const [k, r] of Object.entries(v)) {
    if (!DEVICES.includes(k as Device)) throw new Error(`keys has "${k}", which is not one of ${DEVICES.join(', ')}`);
    out[k as Device] = readKeyRange(r, `keys.${k}`);
  }
  if (!Object.keys(out).length) throw new Error("keys is empty; leave it out to keep the screen's own keys");
  return out;
}
/**
 * The keys to draw: the chosen range on this screen, grown only as far as needed to hold every key the music asks
 * for (to the next white key, so no black key hangs off an edge); null where nothing was chosen for this screen.
 */
export function keysToShow(chosen: ChosenKeys | null | undefined, device: Device, needed: number[] = []): KeyRange | null {
  const r = chosen?.[device];
  if (!r) return null;
  let lo = Math.min(r.lo, ...needed), hi = Math.max(r.hi, ...needed);
  while (isBlackKey(lo)) lo--;
  while (isBlackKey(hi)) hi++;
  return { lo, hi };
}

/** Reads an activity file, or says what is wrong with it (nothing is guessed). */
export function readActivity(id: string, f: Record<string, unknown>): Activity {
  const title = typeof f.title === 'string' && f.title ? f.title : id;
  const obj = (v: unknown, what: string): Record<string, unknown> => {
    if (v === undefined) return {};
    if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new Error(`${what} should be an object`);
    return v as Record<string, unknown>;
  };
  const str = (v: unknown, what: string): string => { if (typeof v !== 'string' || !v) throw new Error(`it needs "${what}"`); return v; };
  // Each preset key: one of its allowed values, a number in range, true/false or a name; unknown keys are refused,
  // so a typo never passes silently.
  type Rule = readonly (string | number)[] | 'bool' | 'name' | { min: number; max: number; whole?: boolean };
  const say = (r: Rule) => (r === 'bool' ? 'true or false' : r === 'name' ? 'a name' : Array.isArray(r) ? r.join(' / ')
    : `${(r as { whole?: boolean }).whole ? 'a whole number, ' : ''}${(r as { min: number }).min} to ${(r as { max: number }).max}`);
  /** keysOnly: only the keys are checked (the values are checked elsewhere). */
  const check = <T extends object>(o: Record<string, unknown>, rules: Record<string, Rule>, what: string, keysOnly = false): T => {
    for (const [k, v] of Object.entries(o)) {
      const r = rules[k];
      if (!r) throw new Error(`${what} has "${k}", which is not one of ${Object.keys(rules).join(', ')}`);
      if (keysOnly) continue;
      const ok = r === 'bool' ? typeof v === 'boolean' : r === 'name' ? typeof v === 'string' && v.length > 0
        : Array.isArray(r) ? r.includes(v as string | number)
        : typeof v === 'number' && v >= (r as { min: number }).min && v <= (r as { max: number }).max && (!(r as { whole?: boolean }).whole || Number.isInteger(v));
      if (!ok) throw new Error(`${what}.${k} is ${JSON.stringify(v)}; it should be ${say(r)}`);
    }
    return o as T;
  };
  const range = (min: number, max: number) => ({ min, max });
  const whole = (min: number, max: number) => ({ min, max, whole: true });
  const screen = f.screen;
  // The file's own fields, by screen: anything else (a misspelt "setting", Memorise "bars") is refused, not ignored.
  const fields: Record<string, string[]> = {
    score: ['piece', 'bars', 'settings', 'keys'], memorise: ['piece', 'settings'], simon: ['set', 'level', 'keys'], drills: ['set', 'level', 'keys'], lab: ['chart', 'preset'], freeplay: ['keys'],
  };
  if (typeof screen === 'string' && fields[screen]) {
    for (const k of Object.keys(f)) {
      if (k === 'title' || k === 'screen' || fields[screen].includes(k)) continue;
      throw new Error(k === 'bars' && screen === 'memorise' ? 'Memorise takes the whole piece (bars are not offered yet)' : `"${k}" is not a field of a ${screen} activity (${['title', 'screen', ...fields[screen]].join(', ')})`);
    }
  }
  const keys = f.keys === undefined || typeof screen !== 'string' || !fields[screen] ? undefined : readChosenKeys(f.keys);
  const withKeys = keys ? { keys } : {};
  switch (screen) {
    case 'score': {
      let bars: [number, number] | undefined;
      if (f.bars !== undefined) {
        const m = /^(\d+)(?:-(\d+))?$/.exec(String(f.bars));
        if (!m) throw new Error(`bars "${f.bars}" should be like "5-8" (printed bar numbers)`);
        bars = [Number(m[1]), Number(m[2] ?? m[1])];
        if (bars[1] < bars[0]) throw new Error(`bars "${f.bars}" end before they start`);
      }
      const settings = check<ScorePreset>(obj(f.settings, 'settings'), {
        mode: ['watch', 'wait', 'along', 'ladder', 'rhythm'], hands: ['both', 'right', 'left', 'off'], tempo: range(20, 300),
        metronome: 'bool', clickOn: ['beats', 'quarters', 'eighths'], onTime: ['relaxed', 'normal', 'strict'], ladderStep: [0.02, 0.05, 0.1],
      }, 'settings');
      if (settings.mode === 'ladder' && !bars) throw new Error('Ladder needs "bars" (it goes round a loop)');
      // (the keys under the music play only in Wait for me: chosen keys with another mode would do nothing)
      if (keys && settings.mode && settings.mode !== 'wait') throw new Error(`keys are for Wait for me (the mode whose keys you play), but settings.mode is "${settings.mode}"`);
      return { id, title, screen, piece: str(f.piece, 'piece'), bars, settings, ...withKeys };
    }
    case 'memorise': {
      const settings = check<MemorisePreset>(obj(f.settings, 'settings'), {
        hands: ['both', 'right', 'left'], tempo: range(20, 300), chunk: [2, 4, 8], adds: ['bar', 'chunk'], learnedAfter: [1, 2, 3],
        carryFrom: ['bar', 'start'], before: ['new', 'all', 'nothing'], next: ['auto', 'tap'], timing: 'bool',
        join: ['ask', 'previous', 'all', 'none'], metronome: 'bool', onTime: ['relaxed', 'normal', 'strict'],
      }, 'settings');
      return { id, title, screen, piece: str(f.piece, 'piece'), settings };
    }
    case 'simon': {
      const level = check<Partial<SimonLevel>>(obj(f.level, 'level'), {
        rung: [0, 1, 2, 3, 4, 5], match: ['same', 'octave', 'inversion'], miss: ['tries', 'over', 'endless'], speed: ['up', 'steady'],
        onMiss: ['all', 'from-miss'], onNew: ['all', 'new'],
      }, 'level');
      return { id, title, screen, set: str(f.set, 'set'), level, ...withKeys };
    }
    case 'drills': {
      const level = check<Partial<DrillLevel>>(obj(f.level, 'level'), {
        rung: [0, 1, 2, 3, 4, 5], start: ['clicks', 'first'], metronome: 'bool', onTime: ['relaxed', 'normal', 'strict', 'notes'], cards: whole(0, 100),
      }, 'level');
      return { id, title, screen, set: str(f.set, 'set'), level, ...withKeys };
    }
    case 'lab': {
      const p = obj(f.preset, 'preset');
      const { parts, steps, ...rest } = p;
      // (style: a style's id, checked against the styles when the lab opens; steps: kinds checked by lab/music.ts readLadder)
      const preset = check<LabPreset>(rest, {
        role: ['accomp', 'lead'], step: ['roots', 'beat1', 'style', 'own', 'root', 'tones', 'scale', 'answer', 'free'], style: 'name', dropouts: ['off', 'drums', 'band'], cleanForNext: whole(1, 10),
      }, 'preset');
      if (parts !== undefined) preset.parts = check(obj(parts, 'preset.parts'), { drums: 'bool', bass: 'bool', chords: 'bool', click: 'bool' }, 'preset.parts');
      if (steps !== undefined) {
        // The ladder: "accompaniment" and/or "lead", each a list of that role's step kinds (read as the lab reads them).
        const st = check<NonNullable<LabPreset['steps']>>(obj(steps, 'preset.steps'), { accompaniment: 'name', lead: 'name' } as Record<string, Rule>, 'preset.steps', true);
        if (st.accompaniment !== undefined) readLadder(st.accompaniment, 'accomp');
        if (st.lead !== undefined) readLadder(st.lead, 'lead');
        preset.steps = st;
      }
      // A step belongs to a part: given with the other part it is refused; given alone it says which part.
      const leadKinds = ['root', 'tones', 'scale', 'answer', 'free'];
      if (preset.step) {
        const its = leadKinds.includes(preset.step) ? 'lead' : 'accomp';
        if (preset.role && preset.role !== its) throw new Error(`preset.step "${preset.step}" is a ${its === 'lead' ? 'lead' : 'accompaniment'} step, but preset.role is "${preset.role}"`);
        preset.role = its;
        const ladder = its === 'lead' ? preset.steps?.lead : preset.steps?.accompaniment;
        if (ladder && !(ladder as unknown[]).some((x) => (typeof x === 'string' ? x : (x as StepSpec)?.kind) === preset.step)) throw new Error(`preset.step "${preset.step}" is not in its ladder (preset.steps)`);
      }
      return { id, title, screen, chart: str(f.chart, 'chart'), preset };
    }
    case 'freeplay':
      return { id, title, screen, ...withKeys };
    default:
      throw new Error(`screen "${String(screen)}" is not one of score, memorise, simon, drills, lab, freeplay`);
  }
}
