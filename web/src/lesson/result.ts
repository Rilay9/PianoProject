// How a lesson step went, read from the practice log's entries made while it was open (log.ts tags them with the
// step). A step counts as done (owner, 2026-10-15: steps never lock; done is a record, not a gate):
//   - with a target, when one of its runs meets it, as each screen's result can tell:
//       score  onTime: a Play along or Rhythm run, or a pass round a loop, with that share of its notes on time and held
//              bpm:    a clean pass round the loop (Ladder, or a loop in Play along) at that tempo or faster
//       drills clean:  that many clean cards in one set
//       simon  chain:  a chain that long, played whole in one go without help (Simon's own "best")
//       lab    cleanRounds: that many accompaniment rounds with every bar right, in one run
//   - without a target, when a run of it ended (one log entry: a set, a game, a run, a Memorise session); Wait for me
//     ends a run only by going through: round its loop, or to the piece's end (review 2026-10-15, V10);
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
  if (t.clean !== undefined && num(r.clean) < t.clean) return false;
  if (t.chain !== undefined && num(r.longestChain) < t.chain) return false;
  if (t.cleanRounds !== undefined) {
    const clean = ((r.rounds as Round[] | undefined) ?? []).filter((x) => x.stoppedInBar === undefined && typeof x.bars === 'string' && x.bars.trim() !== '' && x.bars.trim().split(/\s+/).every((b) => b.endsWith(':ok')));
    if (clean.length < t.cleanRounds) return false;
  }
  return true;
}

/** A run that ended (a Wait for me run only once it went through its bars; one from before that rule counts). */
export function ended(e: LogEntry): boolean {
  return !(e.screen === 'score' && e.mode === 'wait') || e.result.rounds === undefined || num(e.result.rounds) >= 1;
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
      return r.roundsPlayed !== undefined ? `${num(r.roundsPlayed)} rounds played` : `${rounds.length} round${rounds.length === 1 ? '' : 's'}, ${clean} with every bar right`;
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
  const met = target ? runs.some((e) => meets(e, target)) : runs.some(ended);
  const last = runLine(runs[runs.length - 1]);
  return { runs: runs.length, done: met, met, line: runs.length > 1 ? `${last} · ${runs.length} runs` : last };
}

/** The best of a step's runs so far, in its screen's words (the most clean cards, the longest chain, the best share on
 * time, the most clean rounds; else the latest). */
export function bestLine(runs: LogEntry[]): string {
  if (!runs.length) return '';
  const score = (e: LogEntry): number => {
    const r = e.result;
    if (e.screen === 'drills') return num(r.clean);
    if (e.screen === 'simon') return num(r.longestChain);
    if (e.screen === 'lab') return ((r.rounds as Round[] | undefined) ?? []).filter((x) => typeof x.bars === 'string' && x.bars.trim().split(/\s+/).every((b) => b.endsWith(':ok'))).length;
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
