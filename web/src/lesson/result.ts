// How a lesson step went, read from the practice log's entries made while it was open (log.ts tags them with the
// step). A step counts as done (owner, 2026-10-15: steps never lock; done is a record, not a gate):
//   - with a target, when one of its runs meets it, as each screen's result can tell:
//       score  onTime: a Play along or Rhythm run, or a pass round a loop, with that share of its notes on time and held
//              bpm:    a clean pass round the loop (Ladder, or a loop in Play along) at that tempo or faster
//       drills clean:  that many clean cards in one set
//       simon  chain:  a chain that long, played whole in one go without help (Simon's own "best")
//       lab    cleanRounds: that many accompaniment rounds with every bar right, in one run
//   - without a target, when a run of it ended (one log entry: a set, a game, a Memorise session); a score step's run
//     counts only in the step's own mode and when it reached the end of its bars (owner, 2026-10-15, Q5): Wait for me
//     round its loop or to the piece's end (V10), Play along, Rhythm or Ladder a pass round its loop or to the piece's
//     last note (`reachedEnd`); a Play along run stopped after two notes does not mark a Wait for me step done;
//   - a step whose screen keeps no runs (the score in Watch, Free play), when you come back from it: "visited".

import type { LogEntry } from '../log';
import type { Activity } from '../activity';
import type { Target } from './read';

const num = (v: unknown) => (typeof v === 'number' ? v : 0);
type Pass = { notes?: number; onTime?: number; clean?: boolean; bpm?: number };
type Round = { bars?: string; stoppedInBar?: number };

/** Does this run meet the target? */
export function meets(e: LogEntry, t: Target): boolean {
  const r = e.result;
  if (t.onTime !== undefined) {
    const runs: Pass[] = [...(num(r.notes) ? [{ notes: num(r.notes), onTime: num(r.onTime) }] : []), ...((r.passes as Pass[] | undefined) ?? [])];
    if (!runs.some((p) => num(p.notes) > 0 && num(p.onTime) / num(p.notes) >= t.onTime! - 1e-9)) return false;
  }
  if (t.bpm !== undefined && !((r.passes as Pass[] | undefined) ?? []).some((p) => p.clean && num(p.bpm) >= t.bpm!)) return false;
  // Full sets only, as Drills' own best (owner, 2026-10-15, F10): not "the misses again", nor a set left or stopped early.
  if (t.clean !== undefined && (num(r.clean) < t.clean || r.missesAgain === true || r.ended !== 'set done')) return false;
  if (t.chain !== undefined && num(r.longestChain) < t.chain) return false;
  if (t.cleanRounds !== undefined) {
    // A lab run that looped bars logs rounds of just those bars (`bars` on the entry): a loop is practice, as the lab
    // itself says, so only rounds over the whole chart count (final review 2026-10-15, F07).
    if (e.screen === 'lab' && e.bars) return false;
    const clean = ((r.rounds as Round[] | undefined) ?? []).filter((x) => x.stoppedInBar === undefined && typeof x.bars === 'string' && x.bars.trim() !== '' && x.bars.trim().split(/\s+/).every((b) => b.endsWith(':ok')));
    if (clean.length < t.cleanRounds) return false;
  }
  return true;
}

/**
 * Was this run played as the step sets it? '' if so, else why not, in a few words (owner, 2026-10-16, after ChatGPT's
 * review of lessons 1 and 2: a step's target counts only runs played with the step's set, its help level or a harder
 * one, its number of cards, and its timing or a stricter one; tempo is free). Other runs stay in the log as practice.
 * Harder help levels: from 0 (keys and sound) by ear (5); from 1 or 2, less help on the same music (up to 3, music only).
 */
const HARDER: Record<number, number[]> = { 0: [0, 5], 1: [1, 2, 3], 2: [2, 3], 3: [3], 4: [4], 5: [5] };
const STRICT = ['relaxed', 'normal', 'strict'];
export function playedAsSet(e: LogEntry, a: Activity): string {
  if (a.screen !== 'drills' && a.screen !== 'simon') return '';
  if (e.set !== a.set) return 'another set';
  const s = (e.settings ?? {}) as Record<string, unknown>, lv = a.level as Record<string, unknown>;
  if (typeof lv.rung === 'number' && !HARDER[lv.rung]?.includes(num(s.rung))) return 'another help level';
  if (a.screen === 'drills') {
    if (typeof lv.cards === 'number' && s.cards !== lv.cards) return 'another number of cards';
    const want = lv.onTime, got = s.onTime;
    if (typeof want === 'string' && want !== 'notes' && !(typeof got === 'string' && STRICT.indexOf(got) >= STRICT.indexOf(want))) return 'more lenient timing';
  }
  if (a.screen === 'simon' && lv.match === 'same' && s.match !== undefined && s.match !== 'same') return 'any octave allowed';
  return '';
}

/**
 * A run that ended, for a step with no target. A score run (owner, 2026-10-15, Q5) only in the step's own mode (when it
 * names one) and through to the end of its bars: Wait for me round its loop or to the piece's end (a Wait for me entry
 * from before `rounds` was logged counts); the timed modes a pass round the loop, or the piece's last note reached.
 */
export function ended(e: LogEntry, a?: Activity): boolean {
  // A Drills step with no target (an introduction) is done when its whole set is played through, any result: real
  // practice, no pass mark (owner, 2026-10-16: one card "how do they learn anything from that?"); a set left part way is
  // tried (ChatGPT's review, F6: "left" had been called "played through"). A Simon game logs only once something was played.
  if (e.screen === 'drills') return e.result.ended === 'set done';
  if (e.screen !== 'score') return true;
  const mode = a?.screen === 'score' ? a.settings.mode : undefined;
  if (mode && e.mode !== mode) return false;
  const r = e.result;
  if (e.mode === 'wait') return r.rounds === undefined || num(r.rounds) >= 1;
  return (Array.isArray(r.passes) && r.passes.length > 0) || r.reachedEnd === true;
}
/** "bars 1–4" that never breaks after its dash. */
const range = (a: unknown, b: unknown) => (String(a) === String(b) ? `bar ${String(a)}` : `bars ${String(a)}–⁠${String(b)}`);

/** A screen (or mode) that keeps no runs: its step is done on coming back. */
export function keepsNoRuns(a: Activity): boolean {
  return a.screen === 'freeplay' || (a.screen === 'score' && a.settings.mode === 'watch');
}

/** One line on how a run went, in the words its screen uses. */
export function runLine(e: LogEntry): string {
  const r = e.result;
  const pct = (a: number, b: number) => `${Math.round((a / Math.max(1, b)) * 100)}%`;
  switch (e.screen) {
    case 'drills': return `${num(r.clean)} of ${num(r.of)} cards clean${r.ended === 'set done' ? '' : ` (${String(r.ended)})`}`;
    case 'simon': return `Longest chain ${num(r.longestChain)}${num(r.helpedChains) ? ` · ${num(r.helpedChains)} helped` : ''}`;
    case 'lab': {
      const rounds = (r.rounds as Round[] | undefined) ?? [];
      const clean = rounds.filter((x) => typeof x.bars === 'string' && x.bars.trim() !== '' && x.bars.trim().split(/\s+/).every((b) => b.endsWith(':ok'))).length;
      const loop = e.bars ? ` (looping ${range(e.bars.split('-')[0], e.bars.split('-')[1] ?? e.bars.split('-')[0])}: practice)` : '';
      return r.roundsPlayed !== undefined ? `${num(r.roundsPlayed)} rounds played${loop}` : `${rounds.length} round${rounds.length === 1 ? '' : 's'}, ${clean} with every bar right${loop}`;
    }
    case 'memorise': {
      const passes = (r.passes as { clean?: boolean }[] | undefined) ?? [];
      return `${passes.length} pass${passes.length === 1 ? '' : 'es'}, ${passes.filter((p) => p.clean).length} clean${r.mark ? ` · ${String(r.mark)}` : ''}`;
    }
    case 'score': {
      if (num(r.notes)) return `${num(r.onTime)} of ${num(r.notes)} notes on time and held (${pct(num(r.onTime), num(r.notes))})`;
      const passes = (r.passes as Pass[] | undefined) ?? [];
      if (passes.length) {
        const clean = passes.filter((p) => p.clean);
        return `${passes.length} pass${passes.length === 1 ? '' : 'es'}, ${clean.length} clean${clean.length ? ` (best ♩ ${Math.max(...clean.map((p) => num(p.bpm)))})` : ''}`;
      }
      if (r.rounds !== undefined) return num(r.rounds) >= 1 ? `Played through ${range(r.fromBar, r.toBar)}${num(r.rounds) > 1 ? ` ${num(r.rounds)} times` : ''}` : `Started: up to ${range(r.fromBar, r.toBar)}, not through yet`;
      if (r.fromBar !== undefined) return `Waited through ${range(r.fromBar, r.toBar)}`;
      return 'Played';
    }
    default: return '';
  }
}

export interface StepOutcome { runs: number; done: boolean; met: boolean; line: string }

/** How the step went: its runs while it was open, whether the target (or a run) makes it done, and a line to show. */
export function outcome(runs: LogEntry[], a: Activity, target: Target | undefined, returned: boolean): StepOutcome {
  if (!runs.length) {
    const done = returned && keepsNoRuns(a);
    return { runs: 0, done, met: false, line: done ? (a.screen === 'freeplay' ? 'Free play: visited' : 'Watched') : 'Nothing played' };
  }
  const met = target ? runs.some((e) => meets(e, target) && !playedAsSet(e, a)) : runs.some((e) => ended(e, a));
  const last = runLine(runs[runs.length - 1]);
  // A run that would have met the target with other settings: said, as practice (not counted).
  const other = target && !met ? runs.map((e) => (meets(e, target) ? playedAsSet(e, a) : '')).find(Boolean) : '';
  const line = runs.length > 1 ? `${last} · ${runs.length} runs` : last;
  return { runs: runs.length, done: met, met, line: other ? `${line} · played with ${other}: practice, not counted for the target` : line };
}

/** The best of a step's runs so far, in its screen's words (the most clean cards, the longest chain, the best share on
 * time, the most clean rounds; else the latest). */
export function bestLine(runs: LogEntry[]): string {
  if (!runs.length) return '';
  const score = (e: LogEntry): number => {
    const r = e.result;
    if (e.screen === 'drills') return num(r.clean);
    if (e.screen === 'simon') return num(r.longestChain);
    if (e.screen === 'lab') return e.bars ? 0 : ((r.rounds as Round[] | undefined) ?? []).filter((x) => typeof x.bars === 'string' && x.bars.trim().split(/\s+/).every((b) => b.endsWith(':ok'))).length;
    if (e.screen === 'score') {
      const runs: Pass[] = [...(num(r.notes) ? [{ notes: num(r.notes), onTime: num(r.onTime) }] : []), ...((r.passes as Pass[] | undefined) ?? [])];
      return Math.max(0, ...runs.map((p) => num(p.onTime) / Math.max(1, num(p.notes))));
    }
    return 0;
  };
  let best = runs[runs.length - 1];
  for (const e of runs) if (score(e) > score(best)) best = e;
  return runLine(best);
}
