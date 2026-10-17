// How a lesson step went, read from the practice log's entries made while it was open (log.ts tags them with the
// step). A step counts as done (owner, 2026-10-15: steps never lock; done is a record, not a gate):
//   - with a target, when one of its runs meets it, as each screen's result can tell:
//       score  onTime: a Play along or Rhythm run, or a pass round a loop, with that share of its notes on time and held
//              bpm:    a clean pass round the loop (Ladder, or a loop in Play along) at that tempo or faster
//       drills clean:  that many clean cards in one set
//       simon  chain:  a chain that long, played whole in one go without help (Simon's own "best")
//       lab    cleanRounds: that many accompaniment rounds with every bar right, in one run
//   - without a target, when a run of it went through the whole of what the step set ("played through"; `ended`, and
//     its words in `through`, one rule per screen; owner, 2026-10-15 Q5 and 2026-10-16): Drills its whole set; Simon a
//     game to its end; the score its bars to the end in the step's mode (Wait for me round its loop or to the piece's
//     end, V10; the timed modes a pass round the loop or the last note reached, `reachedEnd`); Memorise a chunk learned
//     (owner, 2026-10-16: "its first chunk learned"); the lab a whole round of the chart;
//   - either way, only runs played as the step sets them (playedAsSet: its set, piece or chart, its mode and hands, its
//     help level or harder…; tempo free): the others are practice, kept in the log and said so;
//   - a step whose screen keeps no runs (the score in Watch, Free play): "visited" once a key was played (Free play) or
//     the music was heard to its end (Watch), on coming back (owner, 2026-10-16); without that, "opened, nothing played".

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

/** What a run was played as: a log entry, or (the task line, lesson/task-line.ts) what a screen would play now. */
export type Played = Pick<LogEntry, 'screen' | 'settings'> & Partial<Pick<LogEntry, 'mode' | 'set' | 'piece' | 'chart' | 'bars'>>;

/**
 * Was this run played as the step sets it? '' if so, else why not, in a few words (owner, 2026-10-16, after ChatGPT's
 * review of lessons 1 and 2: a step counts only runs played with the step's set, its help level or a harder one, its
 * number of cards, and its timing or a stricter one; tempo is free). Carried to every screen in the consistency pass:
 *   - the way: Simon for a Simon step, Drills for a Drills one (Practise as… is practice);
 *   - Simon and Drills: as above;
 *   - the score: its piece; its mode (Play along and Ladder count for each other, Rhythm only for Rhythm, Wait for me
 *     only for Wait for me); its hands or more (one hand: that hand, both or Off); a loop holding its bars; its timing
 *     or stricter; tempo free (a `bpm` target is the tempo: meets() checks it);
 *   - the lab: its chart, its part, and its step or a later one;
 *   - Memorise: its piece, and its hands or both.
 * Other runs stay in the log as practice. Harder help levels: from 0 (keys and sound) by ear (5); from 1 or 2, less help
 * on the same music (up to 3, music only).
 */
const HARDER: Record<number, number[]> = { 0: [0, 5], 1: [1, 2, 3], 2: [2, 3], 3: [3], 4: [4], 5: [5] };
const STRICT = ['relaxed', 'normal', 'strict'];
const MODE_COUNTS: Record<string, string[]> = { along: ['along', 'ladder'], ladder: ['ladder', 'along'], rhythm: ['rhythm'], wait: ['wait'], watch: ['watch'] };
const HANDS_COUNT: Record<string, string[]> = { right: ['right', 'both', 'off'], left: ['left', 'both', 'off'], both: ['both', 'off'], off: ['off', 'both'] };
const LAB_STEPS: Record<string, readonly string[]> = { accomp: ['roots', 'beat1', 'style', 'own'], lead: ['root', 'tones', 'scale', 'answer', 'free'] };
/** "3-6" (printed bars) as numbers. */
const barsOf = (v: unknown): [number, number] | null => { const m = /^(\d+)(?:-(\d+))?$/.exec(String(v ?? '')); return m ? [Number(m[1]), Number(m[2] ?? m[1])] : null; };
export function playedAsSet(e: Played, a: Activity): string {
  if (a.screen === 'freeplay') return '';
  if (e.screen !== a.screen) return e.screen === 'simon' ? 'Simon, not Drills' : e.screen === 'drills' ? 'Drills, not Simon' : 'another screen';
  const s = (e.settings ?? {}) as Record<string, unknown>;
  switch (a.screen) {
    case 'drills':
    case 'simon': {
      if (e.set !== a.set) return 'another set';
      const lv = a.level as Record<string, unknown>;
      if (typeof lv.rung === 'number' && !HARDER[lv.rung]?.includes(num(s.rung))) return 'another help level';
      if (a.screen === 'drills') {
        if (typeof lv.cards === 'number' && s.cards !== lv.cards) return 'another number of cards';
        const want = lv.onTime, got = s.onTime;
        if (typeof want === 'string' && want !== 'notes' && !(typeof got === 'string' && STRICT.indexOf(got) >= STRICT.indexOf(want))) return 'more lenient timing';
      }
      if (a.screen === 'simon' && lv.match === 'same' && s.match !== undefined && s.match !== 'same') return 'any octave allowed';
      return '';
    }
    case 'score': {
      if (e.piece !== undefined && e.piece !== a.piece) return 'another piece';
      const want = a.settings, mode = String(e.mode ?? s.mode ?? '');
      if (want.mode && mode && !MODE_COUNTS[want.mode]?.includes(mode)) return 'another mode';
      if (want.hands && typeof s.hands === 'string' && !HANDS_COUNT[want.hands]?.includes(s.hands)) return 'other hands';
      if (a.bars) {
        // A loop must hold the step's bars (a run over the whole piece holds them too).
        const loop = barsOf(s.loop), [lo, hi] = a.bars;
        if (loop && (loop[0] > lo || loop[1] < hi)) return 'other bars';
      }
      if (want.onTime && typeof s.onTime === 'string' && STRICT.indexOf(s.onTime) < STRICT.indexOf(want.onTime)) return 'more lenient timing';
      return '';
    }
    case 'lab': {
      if (e.chart !== undefined && e.chart !== a.chart) return 'another chart';
      const p = a.preset;
      if (p.role && typeof s.role === 'string' && s.role !== p.role) return p.role === 'lead' ? 'the accompaniment, not the lead' : 'the lead, not the accompaniment';
      if (p.step && typeof s.step === 'string') {
        // (the activity's own ladder, if it has one, else the lab's: what comes later in it is harder)
        const own = p.role === 'lead' ? p.steps?.lead : p.steps?.accompaniment;
        const list = own ? (own as unknown[]).map((x) => (typeof x === 'string' ? x : (x as { kind?: string })?.kind ?? '')) : LAB_STEPS[p.role ?? 'accomp'] ?? [];
        if (list.indexOf(s.step) < list.indexOf(p.step)) return 'an earlier step';
      }
      if (e.bars) return 'some bars looped'; // (a loop is practice, as the lab says: only rounds of the whole chart count)
      return '';
    }
    case 'memorise': {
      if (e.piece !== undefined && e.piece !== a.piece) return 'another piece';
      const want = a.settings.hands;
      if (want && typeof s.hands === 'string' && s.hands !== want && s.hands !== 'both') return 'other hands';
      return '';
    }
  }
  return '';
}

/**
 * What "played through" means on each screen (owner, 2026-10-16: one table, one set of words for the result card and
 * the step list): the reason the result card gives for a step with no target.
 */
export function through(a: Activity): string {
  // (in the learner's words, not the builder's: the walk-through, 2026-10-16, read "(no target: … is what counts)")
  switch (a.screen) {
    case 'drills': return 'playing the whole set';
    case 'simon': return 'playing a game to its end';
    case 'score': return a.settings.mode === 'watch' ? 'hearing the music to its end' : a.bars ? `playing ${range(a.bars[0], a.bars[1])} to the end` : 'playing it to the end';
    case 'memorise': return 'learning a chunk';
    case 'lab': return 'playing a whole round of the chart';
    case 'freeplay': return 'playing a key';
  }
  return '';
}

/**
 * A run that went through the whole of what its screen plays, for a step with no target (one rule a screen; its words:
 * `through`). The step's own mode, set and the rest are playedAsSet's (outcome asks both). A score run (owner, 2026-10-15,
 * Q5) through to the end of its bars: Wait for me round its loop or to the piece's end (a Wait for me entry from before
 * `rounds` was logged counts); the timed modes a pass round the loop, or the piece's last note reached.
 */
export function ended(e: LogEntry): boolean {
  const r = e.result;
  switch (e.screen) {
    // A Drills step with no target (an introduction) is done when its whole set is played through, any result: real
    // practice, no pass mark (owner, 2026-10-16: one card "how do they learn anything from that?"); a set left part way
    // is tried (ChatGPT's review, F6: "left" had been called "played through").
    // "The misses again" is practice, not the set (owner, 2026-10-16, after the walk-through).
    case 'drills': return r.ended === 'set done' && r.missesAgain !== true;
    // A Simon game logs only once something was played: game over, all played or its goal is through; left part way, tried.
    case 'simon': return r.ended !== 'stopped';
    // Memorise (owner, 2026-10-16): a chunk learned (its clean passes), or a whole-piece test with every bar clean.
    case 'memorise': return (Array.isArray(r.learned) && r.learned.some((x) => String(x).startsWith('chunk:'))) || (Array.isArray(r.tests) && (r.tests as { clean?: boolean }[]).some((t) => t.clean === true));
    // The lab: a whole round of the chart (not one stopped part way, nor a loop of some bars); improvising, a round played
    // in (at least half its bars: the lab's own count).
    case 'lab': {
      if (e.bars) return false;
      if (r.roundsPlayed !== undefined) return num(r.roundsPlayed) >= 1;
      return ((r.rounds as Round[] | undefined) ?? []).some((x) => x.stoppedInBar === undefined);
    }
    // The score: through to the end of its bars (in the step's mode: playedAsSet, so another mode's run through is said
    // to be practice).
    case 'score': {
      if (e.mode === 'wait') return r.rounds === undefined || num(r.rounds) >= 1;
      return (Array.isArray(r.passes) && r.passes.length > 0) || r.reachedEnd === true;
    }
    default: return true;
  }
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
    // (the misses again: said as practice, never "stopped early": the walk-through, 2026-10-16)
    case 'drills': return `${num(r.clean)} of ${num(r.of)} cards clean${r.missesAgain === true ? ' (the misses again: practice)' : r.ended === 'set done' ? '' : ` (${String(r.ended)})`}`;
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

/**
 * How the step went: its runs while it was open, whether the target (or a run through) makes it done, and a line to
 * show. evidence: for a step that keeps no runs, whether a key was played (Free play) or the music heard to its end
 * (Watch) while it was open (log.ts takeEvidence).
 */
export function outcome(runs: LogEntry[], a: Activity, target: Target | undefined, returned: boolean, evidence = false): StepOutcome {
  if (!runs.length) {
    const done = returned && keepsNoRuns(a) && evidence;
    const line = done ? (a.screen === 'freeplay' ? 'You played in Free play' : 'Watched to the end') : keepsNoRuns(a) ? 'Opened, nothing played' : 'Nothing counted yet'; // (not "Nothing played": a key while it plays to you counts nothing, but was played; the walk-through, 2026-10-16)
    return { runs: 0, done, met: false, line };
  }
  const counts = (e: LogEntry) => !playedAsSet(e, a);
  const met = target ? runs.some((e) => meets(e, target) && counts(e)) : runs.some((e) => ended(e) && counts(e));
  // The headline: the best whole run played as the step sets it (owner, 2026-10-16, after the walk-through: "Longest
  // chain 0 · 2 runs" beside "Target met" told of the last runs only); Simon's best chain. With none, the last run.
  const shown = runs.filter((e) => counts(e) && whole(e));
  const head = shown.length ? bestLine(shown) : runLine(runs[runs.length - 1]);
  const practice = runs.length - shown.length;
  // A run that would have counted had it been played as the step sets it: said, as practice (not counted).
  const other = !met ? runs.map((e) => ((target ? meets(e, target) : ended(e)) ? playedAsSet(e, a) : '')).find(Boolean) : '';
  const again = runs.some((e) => e.screen === 'drills' && e.result.missesAgain === true);
  const line = [head, shown.length > 1 ? `the best of ${shown.length} runs` : '', shown.length && practice ? `and ${practice} ${practice === 1 ? 'run' : 'runs'} of practice${again ? ' (the misses again)' : ''}` : '']
    .filter(Boolean).join(' · ');
  return { runs: runs.length, done: met, met, line: other ? `${line} · played with ${other}: practice, not counted for the step` : line };
}

/** A run of the whole of what its screen sets, to be the headline: a full Drills set (not the misses again); any other run. */
function whole(e: LogEntry): boolean {
  if (e.screen === 'drills') return e.result.ended === 'set done' && e.result.missesAgain !== true;
  return true;
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
