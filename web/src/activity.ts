// Activities (owner, 2026-10-13): one format every screen opens, so a lesson (or a link: ?activity=<id>, a file in
// public/content/activities/) can start a mode with its content and preset choices. The content decides what is
// played; presets are the learner's choices set for the activity: in force while it lasts, changeable, never saved
// over the learner's own. docs/app-features.md §8b describes the format.

import type { SimonLevel } from './exercise/simon';
import type { DrillLevel } from './exercise/drill';
import type { MemoriseOptions } from './memorise';
import type { ClickOn, Hands, Mode, OnTime } from './settings';

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

export type Activity = { id: string; title: string } & (
  | { screen: 'score'; piece: string; bars?: [number, number]; settings: ScorePreset }
  | { screen: 'memorise'; piece: string; settings: MemorisePreset }
  | { screen: 'simon'; set: string; level: Partial<SimonLevel> }
  | { screen: 'drills'; set: string; level: Partial<DrillLevel> }
  | { screen: 'lab'; chart: string; preset: LabPreset }
  | { screen: 'freeplay' }
);

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
  type Rule = readonly (string | number)[] | 'bool' | 'name' | { min: number; max: number };
  const say = (r: Rule) => (r === 'bool' ? 'true or false' : r === 'name' ? 'a name' : Array.isArray(r) ? r.join(' / ') : `${(r as { min: number }).min} to ${(r as { max: number }).max}`);
  const check = <T extends object>(o: Record<string, unknown>, rules: Record<string, Rule>, what: string): T => {
    for (const [k, v] of Object.entries(o)) {
      const r = rules[k];
      if (!r) throw new Error(`${what} has "${k}", which is not one of ${Object.keys(rules).join(', ')}`);
      const ok = r === 'bool' ? typeof v === 'boolean' : r === 'name' ? typeof v === 'string' && v.length > 0
        : Array.isArray(r) ? r.includes(v as string | number)
        : typeof v === 'number' && v >= (r as { min: number }).min && v <= (r as { max: number }).max;
      if (!ok) throw new Error(`${what}.${k} is ${JSON.stringify(v)}; it should be ${say(r)}`);
    }
    return o as T;
  };
  const range = (min: number, max: number) => ({ min, max });
  const screen = f.screen;
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
      return { id, title, screen, piece: str(f.piece, 'piece'), bars, settings };
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
        rung: [1, 2, 3, 4, 5], match: ['same', 'octave', 'inversion'], miss: ['tries', 'over', 'endless'], speed: ['up', 'steady'],
        onMiss: ['all', 'from-miss'], onNew: ['all', 'new'],
      }, 'level');
      return { id, title, screen, set: str(f.set, 'set'), level };
    }
    case 'drills': {
      const level = check<Partial<DrillLevel>>(obj(f.level, 'level'), {
        rung: [1, 2, 3, 4, 5], start: ['clicks', 'first'], metronome: 'bool', onTime: ['relaxed', 'normal', 'strict', 'notes'], cards: range(0, 100),
      }, 'level');
      return { id, title, screen, set: str(f.set, 'set'), level };
    }
    case 'lab': {
      const p = obj(f.preset, 'preset');
      const { parts, steps, ...rest } = p;
      // (style: a style's id, checked against the styles when the lab opens; steps: kinds checked by lab/music.ts readLadder)
      const preset = check<LabPreset>(rest, {
        role: ['accomp', 'lead'], step: ['roots', 'beat1', 'style', 'own', 'root', 'tones', 'scale', 'answer', 'free'], style: 'name', dropouts: ['off', 'drums', 'band'], cleanForNext: range(1, 10),
      }, 'preset');
      if (parts !== undefined) preset.parts = check(obj(parts, 'preset.parts'), { drums: 'bool', bass: 'bool', chords: 'bool', click: 'bool' }, 'preset.parts');
      if (steps !== undefined) preset.steps = obj(steps, 'preset.steps') as LabPreset['steps'];
      return { id, title, screen, chart: str(f.chart, 'chart'), preset };
    }
    case 'freeplay':
      return { id, title, screen };
    default:
      throw new Error(`screen "${String(screen)}" is not one of score, memorise, simon, drills, lab, freeplay`);
  }
}
