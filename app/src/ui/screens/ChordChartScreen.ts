/**
 * The chord-chart view (docs/04 §3b).
 *
 * A lead sheet for jamming: big chord symbols per bar, a form tracker so you
 * know where you are in the chorus, a count-off, an optional comping loop and
 * a swing toggle. Notation is not the point here — this is the view for
 * playing *from chords*, which is a different skill from reading and gets a
 * different screen rather than a mode on the Score screen.
 *
 * The input chip still works: whatever you play is compared with the chord
 * sounding as you play it (the bar's, or since PH2 the segment's, where a bar
 * holds more than one) and the cell goes amber when they disagree. That is the only judgement
 * this screen makes — there is no accuracy score, because a chart says what
 * harmony to play and nothing at all about which notes.
 *
 * **And there are keys to play it on** (added 2026-09-22, T22). Until then
 * this screen subscribed to the on-screen keyboard source and drew no
 * keyboard, which `pending-review` Entry 38 found by driving it and Entry 42
 * confirmed with two greps: the amber/green matching was a MIDI feature on the
 * one screen in the app whose subject is *play this chord*, and a phone with
 * nothing plugged in had no instrument on it at all. The strip is the same
 * `KeyboardStrip` the lab and free play draw, wired to the same shared source,
 * so a tap arrives by the path a cable's note arrives by.
 *
 * Two design questions came with it, and Entry 42 was right that they are the
 * real cost. Both are answered by what the exercise *is*:
 *
 *  - **The keys show nothing that is expected.** The lab lights the bar's
 *    chord tones; here that would answer the question the chart is already
 *    answering in letters an inch high, and a chart that fingers the chord for
 *    you is a different exercise from one that checks what you played. They
 *    light what is *held*, which is feedback and not a hint.
 *  - **They sit between the transport and the chart.** The instrument belongs
 *    with the control that starts the run, not at the foot of a form that is
 *    longer than a phone — which is the fault T17 fixed for *Count off ▶*
 *    three days earlier and would have rebuilt underneath it. They are drawn
 *    by `showTransport`, so a dead end has no keys for the same reason it has
 *    no transport (`04` §0 R4).
 */
import type { Router } from '../../router';
import { contentUrl, findItem } from '../../curriculum/load';
import { getImport } from '../../data/importStore';
import { getMidiSettings } from '../../data/midiSettings';
import { getSettings } from '../../data/settingsStore';
import { audioEngine, getPiano, screenKeyboardSource, webMidiSource } from '../../app/services';
import { Metronome, type MetronomeBeat } from '../../audio/Metronome';
import type { BarShape } from '../../audio/BeatScheduler';
import { DrumKit, barSchedule, type BackingEvent } from '../../audio/backingLoop';
import type { Piano } from '../../audio/Piano';
import { toMusicXml } from '../../score/mxl';
import { chartSegments, chordMatch, readHarmony, segmentAt, type ChartBar, type ChartSegment, type ChordSymbol } from '../../score/harmony';
import {
  UNMETRED_COUNT,
  chartTiming,
  compHoldQuarters,
  countOf,
  tempoFieldDefault,
  type BarCount,
  type ChartTiming,
} from '../../score/metre';
import { KeyboardStrip } from '../KeyboardStrip';
import { onScreenDispose, onScreenSuspend, pageHidden } from '../screenLifecycle';
import { button, chip, el } from '../widgets';
import { screenFrame, statusLine } from './screenFrame';
import { TOOL_HELP } from '../help';
import { createHelpStrip } from '../helpStrip';
import './ChordChartScreen.css';

/** How much of the chord has to be heard before the bar counts as matched. */
const MATCH_THRESHOLD = 0.6;

/** A hair of clock, so a place computed two ways is not a different place. */
const EPSILON = 1e-6;

/**
 * A split bar's symbols step down inside their boxes to this size and no further (PH2; from the pictures in
 * `docs/prompts/runs/PH2/`): smaller, the bar is drawn with each symbol placed over its beat instead, which can
 * set it at this size because it is not held to its own box's width. So a symbol in a box is never smaller than
 * the placed one would be.
 */
const MIN_BOX_TEXT_PX = 16;
/** The placed symbols' largest size, and the smallest they go to when a bar needs more than three lines of them. */
const PLACED_TEXT_PX = 16;
const MIN_SEGMENT_TEXT_PX = 12;

/**
 * The bar's one harmony when it has exactly one, written or carried, with no conflict: such a bar is drawn,
 * comped, bassed and judged exactly as before PH2 (the reviewer's rule: one-segment bars unchanged).
 */
export function singleSegment(chartBar: ChartBar | undefined): ChartSegment | null {
  const only = chartBar?.segments.length === 1 ? chartBar.segments[0] : undefined;
  return only && !only.conflict ? only : null;
}

/**
 * The chord a segment sounds, or `null` where it sounds none the app can use: nothing written yet (bar 1 before
 * its first symbol), or two different harmonies written at one place, which the chart shows and never chooses
 * between (the reviewer, `docs/review/responses/ph1-g6a-landing.md` §2 decision 4: no Comp chord, no bass root
 * from a guess, no live verdict while it lasts).
 */
function chordOf(segment: ChartSegment | undefined): ChordSymbol | null {
  return segment && !segment.conflict ? segment.symbol : null;
}

/**
 * One bar of bass and drums for a bar of several harmonies (PH2): the drums exactly as `barSchedule` plays them,
 * and each bass note `barSchedule`'s own for the harmony sounding at its beat. `lead` is the quarter notes of the
 * counted bar before the bar's notated music (a pickup's); a beat in it has no harmony, so no bass. A beat whose
 * harmony is none (nothing written yet, or a conflict) has no bass either; the drums play the bar wherever the
 * bar holds a harmony at all, as a one-chord bar's do. 4/4 only, like the one-chord bar (MT1).
 *
 * Exported for testing; `barSchedule` itself is unchanged for every caller.
 */
export function positionedBacking(chartBar: ChartBar, lead: number, swing: boolean): BackingEvent[] {
  if (!chartBar.segments.some((segment) => segment.symbol !== null || segment.conflict)) return [];
  const drums = barSchedule({ pitchClasses: [], beatsPerBar: 4, swing });
  const bassBeats = barSchedule({ pitchClasses: [0, 4, 7], beatsPerBar: 4, swing })
    .filter((event) => event.kind === 'bass')
    .map((event) => event.atBeat);
  const bass: BackingEvent[] = [];
  for (const beat of bassBeats) {
    const place = beat - lead;
    if (place < -EPSILON) continue;
    const harmony = chordOf(chartBar.segments[segmentAt(chartBar, place)]);
    if (!harmony) continue;
    const own = barSchedule({ pitchClasses: harmony.pitchClasses, beatsPerBar: 4, swing }).find((event) => event.kind === 'bass' && event.atBeat === beat);
    if (own) bass.push(own);
  }
  // Bass first at a shared beat, then sorted by beat (a stable sort), as `barSchedule` orders a bar.
  return [...bass, ...drums].sort((a, b) => a.atBeat - b.atBeat);
}

/**
 * The bar and chorus a beat lands on.
 *
 * Exported for testing: `beatBar` (`MetronomeBeat.bar`) is 1-based and counts
 * up for ever, the chart wraps at `barsLength`, and the chorus is derived
 * from the same division rather than incremented on a "wrapped to bar 0"
 * guess — a one-bar chart wraps to 0 on *every* beat, so an increment that
 * only fires when the bar index changes never fires there at all.
 */
export function barAt(beatBar: number, barsLength: number): { bar: number; chorus: number } {
  const length = Math.max(1, barsLength);
  const musicBar = beatBar - 1;
  return { bar: musicBar % length, chorus: Math.floor(musicBar / length) + 1 };
}

export function ChordChartScreen(router: Router, itemId: string): HTMLElement {
  const { section, header, body } = screenFrame('chart', 'Chord chart');
  const status = statusLine('chart-status');
  /**
   * The rung that opened this chart, if one did (`04` §3b, `?from=`).
   *
   * Read once, like the Score screen's, because it is a property of how the
   * screen was opened and not of anything that happens on it. Entry 42 gave
   * the Score screen this mechanism and recorded that the chart had the same
   * fault one screen over: a hard-coded `← Library`, so *Chart* on `jazz.5`'s
   * song row came out on the Library rather than on the rung whose lesson
   * describes the chart, and whose other songs are the ones to try next.
   */
  const fromRung = router.route.chartFrom;
  /** Back: the rung that opened this, or the Library it is a view of. */
  function leaveChart(): void {
    if (fromRung === undefined) router.navigate('library');
    else router.navigateLesson(fromRung);
  }
  header.prepend(
    // The label still says where it goes (`00` §1: a control says what it
    // does). It names the screen rather than the rung, because a rung is an
    // id and an id in a label is room the words need.
    button(fromRung === undefined ? '← Library' : '← Lesson', leaveChart, {
      variant: 'quiet',
      id: 'chart-back',
    }),
  );

  const grid = el('div.chart-grid', { id: 'chart-grid' });
  const form = el('div.chart-form', { id: 'chart-form' });
  const controls = el('div.row', { id: 'chart-controls' });
  /** The keys, once there is a chart to play against (see `showTransport`). */
  const stripHost = el('div.chart-strip', { id: 'chart-strip' });
  let strip: KeyboardStrip | null = null;
  let piano: Piano | null = null;
  let pianoAsked = false;
  /**
   * The transport above the chart, not under it (`04` §0 R1, R3; T17).
   *
   * The whole form is printed at once, which is what a lead sheet is — and on
   * a 342 px phone a thirty-two bar tune is more than a screenful of chord
   * cells, so *Count off ▶* opened hundreds of pixels below the fold and the
   * learner had to scroll past the chart to start it. Worse once it was
   * running: scrolling back to watch the sounding bar took *Stop* off the
   * screen with it. It is the same ranking the lab's two buttons were given
   * over its pickers (§3c) and the one Today's *Start session* has — the
   * control that starts the thing goes above the thing.
   *
   * The status line stays under the chart, where the message about the chart
   * belongs (R6); `deadEnd` still lifts it above the controls when there is no
   * chart for it to sit under.
   */
  /**
   * What a chord chart is, and what to do with it (`04` §5f).
   *
   * Above the transport, because it is the caption over the whole screen; the
   * status line under the chart keeps saying what the *run* is doing, which is
   * a different question and belongs beside the thing it is about (R6).
   */
  const helpStrip = createHelpStrip({ id: 'chart', entry: TOOL_HELP.chart, hideWhat: true });
  body.append(helpStrip.el, form, controls, stripHost, grid, status);

  /**
   * The chart: one bar per measure of the score, in the score's order (PH2; the reviewer, `docs/review/responses/
   * ph1-g6a-landing.md` §2 decision 3 and `mt1-g6b-pf1-landing.md` §1), each an ordered list of the harmonies
   * written in it (`chartSegments`). The printed bar number is never the key: no bar is drawn past the last
   * measure, and a pickup is bar 1.
   */
  let bars: ChartBar[] = [];
  /** The current bar's segment sounding now: its mark on the grid, and what a note is judged against when the run is not going. */
  let seg = 0;
  /** The audio clock the run's events are placed on (`audioEngine.ensureStarted()`'s). */
  let clock: { readonly currentTime: number } | null = null;
  /**
   * The current bar's positioned timeline (PH2), for a bar of several harmonies or a pickup:
   *
   * - `shift`: how far ahead of its click the bar's accompaniment runs. The beat callback comes a look-ahead
   *   before the click, and the bar's first comp and its bass and drums are placed from that moment (as they
   *   always were); every later change in the bar is placed the same distance ahead of its own beat, so the
   *   bar's chords keep their written places relative to each other and to its first.
   * - `lead`: quarter notes of the counted bar before its notated music: a pickup's notated length sounds at
   *   the end of its counted bar, so it leads into bar 2's downbeat (`leadOf`).
   * - `changes[i]`: segment i's start on the audio clock, once its beat has come round.
   */
  interface BarClock {
    bar: number;
    shift: number;
    lead: number;
    changes: (number | undefined)[];
    timers: ReturnType<typeof setTimeout>[];
  }
  let barClock: BarClock | null = null;
  /** Comp strikes placed ahead on the audio clock, each with its own stop, so a Stop, a hidden page or Comp off cancels them. */
  let pendingComp: { at: number; stop: () => void }[] = [];
  /** Refits the split bars when the grid's width changes (`fitSplitCells`). */
  let gridObserver: ResizeObserver | null = null;
  /**
   * How each bar is counted, in its written metre (MT1; `score/metre.ts`): the click, the tracker and the comp
   * follow it, the tempo field counts bar 1's beat, and Bass + drums is offered only where every bar is 4/4.
   * Until a chart loads it is today's four quarters, which is also what a file with no time signature gets.
   */
  let timing: ChartTiming = chartTiming([]);
  let bar = 0;
  let chorus = 1;
  /**
   * Has the first real beat of this run been seen yet?
   *
   * `onBeat` used to decide "a new bar started" by comparing the derived bar
   * index against the last one drawn, but bar 1 beat 1 derives to the same
   * index (`0`) that `bar` is initialised to — so the comparison was already
   * false on the very first beat of every run, and the first bar played with
   * no comp, no backing loop and no fresh `markMatch`. On a one-bar chart
   * (a vamp, a single held chord) the derived index is `0` on *every* beat
   * for ever, so this was not just a first-bar quirk there: nothing after the
   * initial draw ever ran again, comping included, and the chorus counter
   * never moved no matter how many times the loop went round.
   */
  let barStarted = false;
  let bpm = 100;
  let swing = false;
  let comping = false;
  /** Bass and drums under the comp (`04` §3b, P18). */
  let backing = false;
  let metronome: Metronome | null = null;
  let kit: DrumKit | null = null;
  let running = false;
  /**
   * Hidden mid-run (X15): silent, with the bar held. `running` stays true —
   * the run is not over, and *Stop* still ends it.
   */
  let suspended = false;
  /**
   * The bar of the run (0-based, from the top) that the metronome's bar 1
   * lands on: 0 from *Count off ▶*, the held bar after a hidden page.
   * The metronome numbers from bar 1 on every `start()`.
   */
  let barOffset = 0;
  /** Bumped by every start, stop and suspension, so a slow resume cannot land late. */
  let resumeSeq = 0;
  /** The piano the comp plays on, so hiding can silence a chord still ringing. */
  let compPiano: Piano | null = null;
  const held = new Set<number>();
  let disposed = false;
  /** The piece's title, once found: what a refusal names. */
  let title = 'This piece';

  // --- grid ---------------------------------------------------------------

  function drawGrid(): void {
    grid.replaceChildren();
    bars.forEach((chartBar, index) => {
      const only = singleSegment(chartBar);
      if (only) {
        // One harmony from the bar's start: the cell it always was, its text and nothing inside.
        grid.append(
          el('div.chart-cell', {
            'data-bar': index + 1,
            'data-current': index === bar,
            text: only.symbol?.text ?? '—',
          }),
        );
        return;
      }
      grid.append(splitCell(chartBar, index));
    });
    fitSplitCells();
  }

  /**
   * A bar of several harmonies (PH2; the reviewer, `docs/review/responses/g6-ph-briefs-cb1.md` §3): one box per
   * segment, in order, each as wide as its share of the bar (its duration over the bar's length), a thin line at
   * each change. Each box holds its chord symbol; a conflict (two harmonies written at one place) holds every one
   * of them, stacked, and the chart chooses none. `fitSplitCells` sizes the symbols to their boxes, or, where a
   * box is too narrow for its symbol at a legible size, sets each symbol over the place its chord starts and
   * shrinks the boxes to a rule that still shows how long each chord lasts.
   */
  function splitCell(chartBar: ChartBar, index: number): HTMLElement {
    const boxes = el('div.chart-segs');
    const line = el('div.chart-seq');
    chartBar.segments.forEach((segment, i) => {
      const box = el('div.chart-seg', {
        'data-seg': i,
        'data-start': segment.start,
        'data-duration': segment.duration,
        'data-carried': segment.carried,
        'data-conflict': segment.conflict ? true : undefined,
        'data-sounding': index === bar && i === seg,
      });
      box.style.flexGrow = String(segment.duration);
      box.append(segmentLabel(segment, i, index === bar && i === seg));
      boxes.append(box);
    });
    return el(
      'div.chart-cell',
      { 'data-bar': index + 1, 'data-current': index === bar, 'data-split': true, 'data-layout': 'fit' },
      boxes,
      line,
    );
  }

  /** A segment's chord symbol, whole; for a conflict, each of them, stacked. */
  function segmentLabel(segment: ChartSegment, i: number, sounding: boolean): HTMLElement {
    const label = el('span.chart-seg-label', { 'data-seg': i, 'data-sounding': sounding, 'data-conflict': segment.conflict ? true : undefined });
    for (const symbol of segment.conflict ?? [segment.symbol]) label.append(el('span.chart-chord', { text: symbol?.text ?? '—' }));
    return label;
  }

  /**
   * Sizes each split bar's symbols to their boxes (PH2): the cell's own size where every symbol fits its box,
   * else a pixel smaller at a time, the whole bar at one size, down to `MIN_BOX_TEXT_PX`. A bar whose symbols do
   * not fit their boxes even then has each symbol placed over its beat (`placeLabels`): no symbol is ever cut,
   * shortened, wrapped or clipped. Measured, so it runs once the grid is laid out, again when the web font
   * arrives, and again whenever the grid's width changes; where nothing is laid out (no width to measure) the
   * bars keep the proportional boxes.
   */
  function fitSplitCells(): void {
    const refit = (): void => {
      if (disposed || grid.clientWidth === 0 || grid.hidden) return;
      for (const cell of grid.querySelectorAll<HTMLElement>('.chart-cell[data-split="true"]')) {
        if (!fitCell(cell)) {
          tooDense(Number(cell.dataset.bar));
          return;
        }
      }
    };
    if (typeof ResizeObserver !== 'undefined' && !gridObserver) {
      let width = -1;
      gridObserver = new ResizeObserver(() => {
        if (grid.clientWidth === width) return;
        width = grid.clientWidth;
        refit();
      });
      gridObserver.observe(grid);
      // The symbols' widths change when the web font arrives: measured again then.
      if ('fonts' in document) void document.fonts.ready.then(refit);
    }
    refit();
  }

  /** Lays one split bar out; `false` where no layout can show where each of its chords starts. */
  function fitCell(cell: HTMLElement): boolean {
    const boxes = [...cell.querySelectorAll<HTMLElement>('.chart-seg')];
    const labels = [...cell.querySelectorAll<HTMLElement>('.chart-seg-label')].sort((a, b) => Number(a.dataset.seg) - Number(b.dataset.seg));
    const line = cell.querySelector<HTMLElement>('.chart-seq');
    // One symbol in each box, at the cell's own size.
    const toBoxes = (): void => {
      cell.dataset.layout = 'fit';
      cell.style.removeProperty('--chart-seg-size');
      line?.style.removeProperty('height');
      for (const leaders of cell.querySelectorAll('.chart-leaders')) leaders.remove();
      labels.forEach((label, i) => {
        label.style.removeProperty('left');
        label.style.removeProperty('top');
        boxes[i]?.append(label);
      });
    };
    toBoxes();
    const full = Number.parseFloat(getComputedStyle(cell).fontSize);
    if (!Number.isFinite(full) || cell.clientWidth === 0 || !line) return true;
    const boxesFit = (from: number, to: number): boolean => {
      for (let size = from; size >= to; size -= 1) {
        cell.style.setProperty('--chart-seg-size', `${String(size)}px`);
        const fits = labels.every((label, i) => {
          const box = boxes[i];
          return !!box && label.scrollWidth <= box.clientWidth + 0.5 && label.offsetHeight <= box.clientHeight + 0.5;
        });
        if (fits) return true;
      }
      return false;
    };
    // Every tier keeps each chord's place (`PH2-position-preserving-fallback`): boxes at the cell's size down to
    // 16px; symbols on stems on one or two lines; boxes at 15px down to the smallest; symbols on stems on more
    // lines; and where none of them can be drawn, `false`.
    if (boxesFit(Math.floor(full), MIN_BOX_TEXT_PX)) return true;
    if (placeLabels(cell, boxes, labels, line, 'few')) return true;
    toBoxes();
    if (boxesFit(MIN_BOX_TEXT_PX - 1, MIN_SEGMENT_TEXT_PX)) return true;
    return placeLabels(cell, boxes, labels, line, 'many');
  }

  /**
   * Too dense for the boxes at a legible size (PH2; the reviewer's `PH2-position-preserving-fallback`,
   * `docs/review/responses/ph2-look.md` §2: every layout keeps when each symbol begins). The boxes become a rule
   * beneath, still in proportion, and each symbol has a leader, a hairline from its foot to the rule at the exact
   * place its chord starts (`data-layout="placed"`): straight down where the symbol stands over its start, at a
   * slant where the cell's edges or its neighbours put it to one side. The symbols take lines in turn from the
   * top (first, second, ..., first again) where that works, else the first line that does, and no arrangement is
   * accepted in which the symbols do not start left to right in the order their chords come, two symbols on a
   * line touch, a leader passes through another symbol, or two leaders cross. `depth` 'few': one line down to 14px, then two down to
   * 13px; 'many' (after the boxes' own last sizes, `fitCell`): three or more down to `MIN_SEGMENT_TEXT_PX`, a
   * staircase of one symbol a line at most; the largest size within each line count. `false` where none can be
   * drawn.
   */
  function placeLabels(cell: HTMLElement, boxes: HTMLElement[], labels: HTMLElement[], line: HTMLElement, depth: 'few' | 'many'): boolean {
    cell.dataset.layout = 'placed';
    for (const label of labels) line.append(label);
    const length = boxes.reduce((sum, box) => sum + Number(box.dataset.duration), 0) || 1;
    const inset = 6;
    const inner = Math.max(1, line.clientWidth - 2 * inset);
    /** Where each chord starts on the rule, in the line's own pixels (the rule shares its inset). */
    const stems = labels.map((_, i) => inset + (inner * Number(boxes[i]?.dataset.start ?? 0)) / length);
    // The verdict's ✓ or ✗ is drawn in the segment's block of the rule here, not after the symbol, so a symbol
    // needs no room beyond its own width.
    interface Placed {
      label: HTMLElement;
      left: number;
      right: number;
      row: number;
      /** Where the leader leaves the symbol (the foot of its line) and where it meets the rule (the chord's start). */
      ax: number;
      ay: number;
      sx: number;
    }
    const arrange = (lines: number, height: number, free: boolean): Placed[] | null => {
      const ruleTop = lines * height + 4;
      const widths = labels.map((label) => label.getBoundingClientRect().width);
      // A conflict's stacked symbols make its line taller than a single symbol: each leader leaves its own foot.
      const heights = labels.map((label) => label.getBoundingClientRect().height);
      // A symbol wider than the cell cannot be drawn at this size.
      if (widths.some((width) => width > inner + 0.5)) return null;
      /**
       * Where a symbol may stand on its line: beginning at its chord's start, or ending there, or as near it as
       * the cell's edges allow; then at either edge of the cell, its leader running at a slant to the start. The
       * leader drops straight down wherever the start lies under the symbol.
       */
      const candidates = (i: number): number[] => {
        const width = widths[i] ?? 0;
        const stem = stems[i] ?? inset;
        const lo = inset;
        const hi = inset + inner - width;
        const fit = (x: number): number => Math.max(lo, Math.min(hi, x));
        return [...new Set([fit(stem), fit(stem - width), lo, hi].map((x) => Math.round(x * 100) / 100))];
      };
      const footOf = (left: number, width: number, stem: number): number => Math.max(left, Math.min(left + width, stem));
      /** The leader's x at height y, on its straight line from the symbol's foot to the rule. */
      const xAt = (p: Placed, y: number): number => p.ax + ((p.sx - p.ax) * (y - p.ay)) / (ruleTop - p.ay);
      const covers = (p: Placed, q: Placed): boolean => {
        // Does p's leader pass through q's symbol? Only lines below p's own are crossed on the way down.
        if (q.row <= p.row) return false;
        const top = q.row * height;
        const bottom = top + height;
        const x1 = xAt(p, Math.max(top, p.ay));
        const x2 = xAt(p, bottom);
        return Math.max(x1, x2) > q.left - 2 && Math.min(x1, x2) < q.right + 2;
      };
      const leadersCross = (p: Placed, q: Placed): boolean => {
        // Two leaders crossing make two places ambiguous: compared over the heights both span.
        const top = Math.max(p.ay, q.ay);
        if (top >= ruleTop) return false;
        const d1 = xAt(p, top) - xAt(q, top);
        const d2 = p.sx - q.sx;
        return d1 * d2 < 0;
      };
      const placed: Placed[] = [];
      let budget = 20_000;
      const fits = (p: Placed): boolean =>
        // Left to right is the order the chords come in, whatever line each is on: each symbol starts visibly to
        // the right of every symbol before it, and so does its leader's foot.
        placed.every((q) => q.left + 3 <= p.left && q.ax <= p.ax) &&
        placed.every((q) => {
          if (q.row === p.row && p.left < q.right + 3 && q.left < p.right + 3) return false;
          return !covers(p, q) && !covers(q, p) && !leadersCross(p, q);
        });
      const place = (i: number): boolean => {
        if (i === labels.length) return true;
        if ((budget -= 1) < 0) return false;
        const label = labels[i];
        const width = widths[i] ?? 0;
        const stem = stems[i] ?? inset;
        if (!label) return false;
        // In turn (first, second, ...) unless `free`, when any line will do.
        const order = free ? [i % lines, ...Array.from({ length: lines }, (_, r) => r).filter((r) => r !== i % lines)] : [i % lines];
        for (const row of order) {
          for (const left of candidates(i)) {
            const p: Placed = { label, left, right: left + width, row, ax: footOf(left, width, stem), ay: row * height + (heights[i] ?? height), sx: stem };
            if (!fits(p)) continue;
            placed.push(p);
            if (place(i + 1)) return true;
            placed.pop();
          }
        }
        return false;
      };
      return place(0) ? placed : null;
    };
    // Each line count is tried with the lines taken strictly in turn first, at every size, and only then freely.
    const tries: [number, number, boolean][] = [];
    const sizes = (from: number, to: number): number[] => Array.from({ length: from - to + 1 }, (_, i) => from - i);
    const counts = depth === 'few' ? [1, 2] : Array.from({ length: Math.max(0, labels.length - 2) }, (_, i) => i + 3);
    for (const count of counts) {
      const from = count === 1 ? PLACED_TEXT_PX : count === 2 ? PLACED_TEXT_PX : 14;
      const to = count === 1 ? 14 : count === 2 ? 13 : MIN_SEGMENT_TEXT_PX;
      for (const free of count === 1 ? [false] : [false, true]) for (const size of sizes(from, to)) tries.push([count, size, free]);
    }
    for (const [count, size, free] of tries) {
      if (count > labels.length) continue;
      cell.style.setProperty('--chart-seg-size', `${String(size)}px`);
      const height = Math.ceil(Math.max(...labels.map((label) => label.getBoundingClientRect().height)));
      const chosen = arrange(count, height, free);
      if (!chosen) continue;
      line.style.height = `${String(count * height)}px`;
      // The leaders: one hairline per symbol, from its foot to the rule at the place its chord starts.
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.classList.add('chart-leaders');
      svg.setAttribute('aria-hidden', 'true');
      chosen.forEach(({ label, left, row, ax, ay, sx }, i) => {
        label.style.left = `${String(left)}px`;
        label.style.top = `${String(row * height)}px`;
        const leader = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        leader.classList.add('chart-stem');
        leader.setAttribute('data-seg', String(i));
        leader.setAttribute('x1', String(ax));
        leader.setAttribute('y1', String(ay));
        leader.setAttribute('x2', String(sx));
        leader.setAttribute('y2', String(count * height + 4));
        svg.append(leader);
      });
      line.append(svg);
      return true;
    }
    return false;
  }

  /**
   * A bar this screen cannot draw with each chord at its place (PH2, `PH2-position-preserving-fallback`): the chart
   * fails closed for this piece at this width rather than showing chords whose places in the bar cannot be read.
   * The reason is the bar itself, measured on this screen; no count of chords decides it. The way on is the
   * Score screen, where the same music is written out.
   */
  function tooDense(barNumber: number): void {
    if (disposed || grid.hidden) return;
    if (running) stop();
    deadEnd(
      `${title} has more chord changes in bar ${String(barNumber)} than this screen is wide enough to show at their places in the bar.`,
      'Open on the Score screen',
      () => {
        if (fromRung === undefined) router.navigateScore(itemId);
        else router.navigateScore(itemId, { from: fromRung });
      },
      'chart-open-score',
    );
    body.querySelector('#chart-backing-note')?.remove();
    strip?.destroy();
    strip = null;
    stripHost.replaceChildren();
    section.dataset.refused = 'too-dense';
  }

  function drawForm(): void {
    form.textContent = `Bar ${String(bar + 1)} of ${String(bars.length)} · chorus ${String(chorus)}`;
    for (const cell of grid.children) {
      if (cell instanceof HTMLElement) {
        cell.dataset.current = String(Number(cell.dataset.bar) === bar + 1);
      }
    }
    drawSegmentMarks();
  }

  /** The sounding segment's mark (PH2): on the current bar's segment `seg`, and on no other. */
  function drawSegmentMarks(): void {
    for (const node of grid.querySelectorAll<HTMLElement>('.chart-seg, .chart-seg-label')) {
      const cell = node.closest<HTMLElement>('.chart-cell');
      node.dataset.sounding = String(Number(cell?.dataset.bar) === bar + 1 && Number(node.dataset.seg) === seg);
    }
  }

  function markMatch(): void {
    // What is held, on the keys as well as on the cell. It is feedback and not
    // a hint: nothing on this strip is ever `expected`, because the chart is
    // already printing the chord and a strip that fingered it would answer the
    // question instead of asking it.
    strip?.setState({ pressed: [...held] });
    const cell = grid.children[bar];
    if (!(cell instanceof HTMLElement)) return;
    const chartBar = bars[bar];
    const only = singleSegment(chartBar);
    if (only) {
      const score = chordMatch(only.symbol, [...held]);
      // Amber when what is played disagrees with the chart; nothing at all when
      // no keys are down, because silence is not a mistake.
      cell.dataset.match = held.size === 0 ? 'idle' : score >= MATCH_THRESHOLD ? 'yes' : 'no';
      return;
    }
    // Several harmonies (PH2): judged against the one sounding at this instant on the audio clock, and the
    // verdict belongs to that segment. A conflict has none: the chart does not know which chord it is.
    followClock();
    const segment = chartBar?.segments[seg];
    const verdict =
      held.size === 0 || segment?.conflict ? 'idle' : chordMatch(segment?.symbol ?? null, [...held]) >= MATCH_THRESHOLD ? 'yes' : 'no';
    for (const node of cell.querySelectorAll<HTMLElement>(`.chart-seg[data-seg="${String(seg)}"], .chart-seg-label[data-seg="${String(seg)}"]`)) {
      node.dataset.match = verdict;
    }
    // The bar's own verdict is its sounding segment's, so "the sounding bar answers what is played" holds for
    // every bar alike.
    cell.dataset.match = verdict;
  }

  // --- the bar's positioned timeline (PH2) ---------------------------------------------------------------------

  /** Quarter notes of bar `index`'s counted length before its notated music: a pickup's lead into bar 2. */
  function leadOf(index: number): number {
    const chartBar = bars[index];
    if (index !== 0 || !chartBar || (chartBar.status !== 'pickup' && chartBar.status !== 'incomplete')) return 0;
    return Math.max(0, countAt(index).barQuarters - chartBar.length);
  }

  /** A bar the old one-chord path cannot play: several harmonies, a conflict, or a pickup's notated length. */
  function positioned(index: number): boolean {
    return !singleSegment(bars[index]) || leadOf(index) > 0;
  }

  /** Seconds in a quarter note at the field's tempo (the field counts the chart's beat, MT1). */
  function secondsPerQuarter(): number {
    return 60 / bpm / timing.beatUnit;
  }

  /** A new bar: its first segment sounds, and the last bar's changes still to come are dropped with it. */
  function beginBar(beat: MetronomeBeat): void {
    clearChanges();
    seg = 0;
    const now = clock?.currentTime ?? beat.timeSec;
    barClock = { bar, shift: Math.max(0, beat.timeSec - now), lead: leadOf(bar), changes: [now], timers: [] };
  }

  function clearChanges(): void {
    for (const timer of barClock?.timers ?? []) clearTimeout(timer);
    barClock = null;
  }

  /** Cancels every comp strike placed ahead that has not sounded yet. */
  function cancelPendingComp(): void {
    const now = clock?.currentTime ?? 0;
    for (const strike of pendingComp) if (strike.at > now) strike.stop();
    pendingComp = [];
  }

  /**
   * At each beat of a positioned bar, the changes that fall inside it (PH2): each one's start on the audio clock
   * (the beat's own time, less the bar's `shift`, plus its distance past the beat at the tempo the beat was
   * counted at, so a tempo changed mid-bar places what follows by the new tempo), a timer for its mark and its
   * re-judgement, and, with Comp on, its strike. A change whose beat never came (a stalled timer dropped it) is
   * marked when the next beat comes, and not struck late. A change at or past the counted bar's end (an overfull
   * bar, longer than its time signature) is never reached.
   */
  function scheduleBeat(beat: MetronomeBeat): void {
    const timeline = barClock;
    const chartBar = bars[bar];
    if (!timeline || !chartBar || suspended || !running) return;
    const count = countAt(bar);
    const from = (beat.beatInBar - 1) * count.beatQuarters;
    const to = Math.min(from + count.beatQuarters, count.barQuarters);
    const perQuarter = secondsPerQuarter();
    const now = clock?.currentTime ?? beat.timeSec;
    chartBar.segments.forEach((segment, i) => {
      const at = timeline.lead + segment.start;
      // A later beat's, or past the counted bar.
      if (at >= to - EPSILON) return;
      if (i === 0) {
        // Its mark came with the bar, and so did its strike, except a pickup's: struck on the beat it falls in.
        if (timeline.lead > 0 && at >= from - EPSILON && comping) strike(segment, beat.timeSec - timeline.shift + (at - from) * perQuarter, perQuarter);
        return;
      }
      if (timeline.changes[i] !== undefined) return;
      const late = at < from - EPSILON;
      const t = late ? now : beat.timeSec - timeline.shift + (at - from) * perQuarter;
      timeline.changes[i] = t;
      armChange(timeline, t);
      if (comping && !late) strike(segment, t, perQuarter);
    });
  }

  /** The bar's first segment, struck as its bar begins (or where its pickup begins), when Comp is on. */
  function compFirst(): void {
    const timeline = barClock;
    const segment = bars[bar]?.segments[0];
    if (!timeline || !segment || timeline.lead > 0) return;
    strike(segment, timeline.changes[0] ?? 0, secondsPerQuarter());
  }

  /** At `t` the next segment sounds: its mark moves, and what is held is judged against it. */
  function armChange(timeline: BarClock, t: number): void {
    const fire = (): void => {
      if (barClock !== timeline || !running || suspended) return;
      const now = clock?.currentTime ?? t;
      // A timer can wake a little before the audio clock gets there: wait the rest.
      if (now + EPSILON < t) {
        timeline.timers.push(setTimeout(fire, Math.max(1, (t - now) * 1000)));
        return;
      }
      const before = seg;
      followClock();
      if (seg !== before) markMatch();
    };
    timeline.timers.push(setTimeout(fire, Math.max(0, (t - (clock?.currentTime ?? t)) * 1000)));
  }

  /** Moves the mark to the segment sounding now on the audio clock, if the clock has passed a change. */
  function followClock(): void {
    const timeline = barClock;
    const now = clock?.currentTime;
    if (!running || suspended || !timeline || timeline.bar !== bar || now === undefined) return;
    let next = seg;
    timeline.changes.forEach((t, i) => {
      if (t !== undefined && t <= now + EPSILON && i > next) next = i;
    });
    if (next !== seg) {
      seg = next;
      drawSegmentMarks();
    }
  }

  /**
   * A segment's chord on the piano at `t` (PH2): the comp's block voicing, held three quarters of the segment so
   * it ends before the next change (a one-chord bar holds three quarters of its bar, MT1). None for a segment
   * with no chord to strike. At or before now it sounds at once, as the one-chord comp does; later it is placed
   * on the audio clock with its own stop.
   */
  function strike(segment: ChartSegment, t: number, perQuarter: number): void {
    const symbol = chordOf(segment);
    if (!symbol) return;
    const midis = symbol.pitchClasses.map((pitchClass) => 48 + pitchClass);
    const hold = 0.75 * segment.duration * perQuarter;
    const seq = resumeSeq;
    void getPiano().then((piano) => {
      compPiano = piano;
      if (disposed || suspended || !running || seq !== resumeSeq || !comping) return;
      const now = clock?.currentTime ?? t;
      if (t <= now + EPSILON) {
        piano.playChord(midis, hold);
        return;
      }
      pendingComp = pendingComp.filter((pending) => pending.at > now - 1);
      for (const midi of midis) pendingComp.push({ at: t, stop: piano.start({ midi, velocity: 90, timeSec: t, durationSec: hold }) });
    });
  }

  // --- transport ----------------------------------------------------------

  function onBeat(beat: MetronomeBeat): void {
    if (disposed || beat.isCountIn) return;
    const { bar: nextBar, chorus: nextChorus } = barAt(beat.bar + barOffset, bars.length);
    if (!barStarted || nextBar !== bar || nextChorus !== chorus) {
      barStarted = true;
      bar = nextBar;
      chorus = nextChorus;
      beginBar(beat);
      drawForm();
      markMatch();
      // The two are independent (CB1): the comp voices the chord on the piano,
      // the bass and drums follow the chart's own bar, so a learner can comp
      // over the app's rhythm section, or have it without the comp.
      if (comping) {
        if (positioned(bar)) compFirst();
        else compBar();
      }
      if (backing) scheduleBacking();
    }
    if (positioned(bar)) scheduleBeat(beat);
  }

  /** Bar `index`'s count (0-based, in the chart's order); today's four quarters past the end. */
  function countAt(index: number): BarCount {
    return timing.counts[index] ?? UNMETRED_COUNT;
  }

  /**
   * The metronome's bar `n` as a shape (MT1): `n` is 1-based from the bar this run starts on, and its count-in
   * asks for bar 1, so a count-in is in the metre of the bar it leads into. The chart bar is the one `onBeat`
   * draws for it, wrapped round the chorus the same way; each beat's length is relative to bar 1's beat, which is
   * what the tempo field counts (1 wherever the chart keeps one beat unit, every bundled chart).
   */
  function shapeOf(metronomeBar: number): BarShape {
    const count = countAt(barAt(Math.max(1, metronomeBar) + barOffset, bars.length).bar);
    return { beats: count.beats, beatScale: count.beatQuarters / timing.beatUnit };
  }

  /** A one-chord bar's comp, exactly as before PH2. */
  function compBar(): void {
    const symbol = singleSegment(bars[bar])?.symbol;
    if (!symbol) return;
    // A plain block voicing in the middle of the keyboard: enough to hear the
    // harmony, quiet enough to play over.
    const midis = symbol.pitchClasses.map((pitchClass) => 48 + pitchClass);
    // Three quarters of the bar (MT1): 4/4's three beats exactly as before, and in every other metre the chord
    // ends before the next downbeat (a 3/4 bar's three beats would have rung into it).
    const hold = (60 / bpm / timing.beatUnit) * compHoldQuarters(countAt(bar));
    void getPiano().then((piano) => {
      compPiano = piano;
      if (!disposed && !suspended) piano.playChord(midis, hold);
    });
  }

  /**
   * The bar's bass and drums, scheduled on the audio clock (`04` §3b).
   *
   * Scheduled from the beat callback rather than being its own loop: the
   * metronome already owns the clock, and a second scheduler would drift
   * against it — which on a backing track is the one fault nobody can play
   * through.
   */
  function scheduleBacking(): void {
    const context = audioEngine.contextOrNull;
    // 4/4 only (MT1): `barSchedule`'s pattern is the one groove with a contract, and it is 4/4's.
    if (!timing.backingOffered) return;
    const chartBar = bars[bar];
    if (!chartBar || !backing || !kit || !context) return;
    const secondsPerBeat = 60 / bpm;
    // A hair ahead, so the first event of the bar is scheduled rather than
    // being already in the past by the time this runs.
    const barStart = context.currentTime + 0.02;
    // One chord from the bar's start: the bar it always was. Several (PH2): each bass note takes the harmony
    // sounding at its beat, the drums unchanged.
    const only = positioned(bar) ? null : singleSegment(chartBar);
    const pitchClasses = only?.symbol?.pitchClasses;
    if (only && !pitchClasses) return;
    const events = pitchClasses ? barSchedule({ pitchClasses, beatsPerBar: 4, swing }) : positionedBacking(chartBar, leadOf(bar), swing);
    for (const event of events) {
      kit.play(event, barStart + event.atBeat * secondsPerBeat);
    }
  }

  async function start(): Promise<void> {
    const context = await audioEngine.ensureStarted();
    clock = context;
    // A new run: nothing of the last one's bar is still to come.
    cancelPendingComp();
    clearChanges();
    seg = 0;
    metronome ??= new Metronome(context, {
      ...(audioEngine.masterGain ? { destination: audioEngine.masterGain } : {}),
    });
    metronome.setBpm(bpm);
    // Each bar in its own metre (MT1), from the top: the offset first, because the shape reads it as the
    // metronome starts. The metronome asks for each bar's count itself as the bar before ends, so a late timer
    // that drops a bar's last click cannot leave the next bar in the old count (`chartMetre.test.ts`).
    barOffset = 0;
    metronome.setBeatsPerBar(countAt(0).beats);
    metronome.setBarShape(shapeOf);
    metronome.setCountInBars(getSettings().countInBars);
    metronome.setVolume(getMidiSettings().metronomeVolume);
    metronome.setSound(getSettings().metronomeSound);
    metronome.onTick(onBeat);
    // Under the metronome's own volume setting: the loop is accompaniment,
    // and accompaniment that drowns the piano is worse than none.
    kit ??= new DrumKit(context, audioEngine.masterGain ?? undefined);
    kit.setVolume(getMidiSettings().metronomeVolume);
    metronome.start();
    running = true;
    suspended = false;
    resumeSeq += 1;
    bar = 0;
    chorus = 1;
    barStarted = false;
    drawForm();
    section.dataset.running = 'true';
    status.textContent = swing ? 'Swing the eighths.' : '';
    // The page hid while the audio was starting: held from the top, as if it
    // had hidden a moment later (X15).
    if (pageHidden()) suspend();
  }

  /**
   * The page went hidden mid-run (X15, Part 19): the click, the bass and drums
   * and the comp go silent, and the chart keeps the bar that was sounding.
   * Not `stop()`: that ends the run.
   */
  function suspend(): void {
    if (!running || suspended) return;
    suspended = true;
    resumeSeq += 1;
    // Before the first downbeat the offset already says where it was to begin.
    if (barStarted) barOffset = (chorus - 1) * Math.max(1, bars.length) + bar;
    metronome?.stop();
    kit?.dispose();
    kit = null;
    // The changes still to come in this bar (PH2): not struck, not marked. The bar restarts from its first on return.
    cancelPendingComp();
    clearChanges();
    compPiano?.stop();
  }

  /**
   * The page is back: count in again, as *Count off ▶* does, and carry on from
   * the downbeat of the bar that was sounding — not ahead of it, which would
   * count time nobody heard, and not from bar 1, which is what calling
   * `start()` here would do (it resets `bar`, `chorus` and `barStarted`).
   */
  async function resume(): Promise<void> {
    if (!suspended || disposed) return;
    const seq = resumeSeq;
    // The platform suspends the audio context on a locked phone.
    const context = await audioEngine.ensureStarted();
    if (disposed || !suspended || seq !== resumeSeq || pageHidden()) return;
    suspended = false;
    kit = new DrumKit(context, audioEngine.masterGain ?? undefined);
    kit.setVolume(getMidiSettings().metronomeVolume);
    // So the resumed bar's first beat draws and comps, as bar 1's does.
    barStarted = false;
    metronome?.start();
  }

  function stop(): void {
    suspended = false;
    resumeSeq += 1;
    // A change placed ahead in the bar (PH2) is not struck after Stop, and its mark does not move.
    cancelPendingComp();
    clearChanges();
    metronome?.stop();
    // Scheduled drum hits outlive the transport otherwise: everything is
    // queued a bar ahead on the audio clock, so leaving the screen with the
    // loop running would keep playing into whatever came next.
    kit?.dispose();
    kit = null;
    running = false;
    section.dataset.running = 'false';
  }

  // --- controls -----------------------------------------------------------

  const bpmInput = el('input', {
    type: 'number',
    id: 'chart-bpm',
    value: String(bpm),
    min: '40',
    max: '240',
    'aria-label': 'Tempo',
  }) as HTMLInputElement;
  bpmInput.addEventListener('change', () => {
    bpm = Math.min(240, Math.max(40, Number(bpmInput.value) || bpm));
    bpmInput.value = String(bpm);
    metronome?.setBpm(bpm);
  });

  const swingChip = chip('Swing', {
    id: 'chart-swing',
    onClick: () => {
      swing = !swing;
      swingChip.setAttribute('aria-pressed', String(swing));
      section.dataset.swing = String(swing);
      // The click stays straight: a swung metronome is a metronome you cannot
      // check your own time against. The toggle is a reminder and a flag the
      // comping reads.
      status.textContent = swing ? 'Swing the eighths — the click stays straight.' : '';
    },
  });

  const compChip = chip('Comp', {
    id: 'chart-comp',
    onClick: () => {
      comping = !comping;
      compChip.setAttribute('aria-pressed', String(comping));
      // Off: a chord placed ahead in this bar (PH2) is not struck after all.
      if (!comping) cancelPendingComp();
    },
  });

  const backingChip = chip('Bass + drums', {
    id: 'chart-backing',
    onClick: () => {
      backing = !backing;
      backingChip.setAttribute('aria-pressed', String(backing));
      section.dataset.backing = String(backing);
    },
  });

  /**
   * The transport, once there is something for it to run.
   *
   * It used to be appended here, on the way past, before the item had been
   * found or the file read. So for as long as the load took — a fetch, on a
   * phone — a count-off, a stop, a bpm field and three live toggles sat over a
   * chart that did not exist yet and might never: `deadEnd` replaced the whole
   * row when the answer came back, so a control could be under a finger one
   * moment and gone the next. `04` §0 R4 is that a screen offers the one
   * control that does what it suggests, and a transport suggests something to
   * play.
   */
  function showTransport(): void {
    controls.append(
      button('Count off ▶', () => void start(), { id: 'chart-start', variant: 'primary' }),
      button('Stop', stop, { id: 'chart-stop' }),
      // The field counts the chart's beat (MT1): "bpm" in a quarter-note beat, as always; the unit named
      // otherwise, because "54" alone on a 6/8 chart would read as 54 quarter notes.
      el('label', { htmlFor: 'chart-bpm', text: timing.tempoLabel }),
      bpmInput,
      swingChip,
      compChip,
      backingChip,
    );
    if (!timing.backingOffered) refuseBacking();
    showKeys();
  }

  /**
   * Bass + drums, refused where the chart is not in 4/4 (MT1; the reviewer's ruling,
   * `docs/review/responses/ph1-g6a-landing.md` §4): its one pattern is 4/4's, and no cited groove exists for
   * any other metre, so it is disabled rather than played as a guess. The sentence sits right under the row,
   * beside the chip it explains, and says what does work here; the status line under the chart is the run's.
   */
  function refuseBacking(): void {
    const metres = timing.refusedBy;
    const list = metres.length > 1 ? `${metres.slice(0, -1).join(', ')} and ${metres[metres.length - 1] ?? ''}` : (metres[0] ?? '');
    const oneMetre = metres.length === 1 && timing.counts.every((count) => count.written === metres[0]);
    const note = el('p.muted', {
      id: 'chart-backing-note',
      text: oneMetre
        ? `Bass + drums plays only in 4/4, and this chart is in ${list}. Count off for the click and turn on Comp for the chords: both follow the ${list}.`
        : `Bass + drums plays only in 4/4, and this chart has bars in ${list}. Count off for the click and turn on Comp for the chords: both follow each bar’s time signature.`,
    });
    backing = false;
    backingChip.disabled = true;
    backingChip.setAttribute('aria-disabled', 'true');
    backingChip.setAttribute('aria-pressed', 'false');
    backingChip.setAttribute('aria-describedby', 'chart-backing-note');
    // `.chip` has no disabled look of its own and `style.css` is outside this change: dimmed here, as `.button:disabled` is.
    backingChip.style.opacity = '0.5';
    body.insertBefore(note, stripHost);
  }

  /**
   * The instrument, drawn beside the transport (T22).
   *
   * Through `screenKeyboardSource` rather than straight into `held`, so a tap
   * and a cable's note arrive by one path and the matching below cannot tell
   * them apart — the shape `FreePlayScreen` and the lab already use.
   */
  function showKeys(): void {
    if (strip) return;
    strip = new KeyboardStrip({
      interactive: true,
      showOctaveLabels: true,
      onNoteOn: (midi, velocity) => {
        screenKeyboardSource.noteOn(midi, velocity);
        sound(midi, velocity);
      },
      onNoteOff: (midi) => {
        screenKeyboardSource.noteOff(midi);
        piano?.stop(midi);
      },
    });
    stripHost.append(strip.el);
    // After a paint, for the reason `fitKeysToWidth` waits for one: the screen
    // is built before the shell puts it in the document, so until the next
    // frame every key is at offset 0 and "scroll to middle C" resolves to the
    // left end of an 88-key strip.
    requestAnimationFrame(() => {
      if (!disposed) strip?.scrollToMiddleC('auto');
    });
  }

  /**
   * A tapped key sounds; a note over MIDI does not get an echo.
   *
   * The same trade the other two strips make: a tap on a picture of a key that
   * stays silent is what makes a strip read as a diagram, and doubling a note
   * that has already been played on a real instrument would be the app playing
   * along uninvited. The samples are asked for on the first tap, so that first
   * note is silent — a missed note beats a throw inside an input handler.
   */
  function sound(midi: number, velocity: number): void {
    if (!pianoAsked) {
      pianoAsked = true;
      void getPiano()
        .then((loaded) => {
          if (!disposed) piano = loaded;
        })
        .catch(() => {
          /* No samples, no sound. The matching below still works. */
        });
    }
    piano?.start({ midi, velocity });
  }

  // --- input --------------------------------------------------------------

  const stopMidi = webMidiSource.onNote((event) => {
    if (event.kind === 'noteOn') held.add(event.midi);
    else held.delete(event.midi);
    markMatch();
  });
  const stopKeys = screenKeyboardSource.onNote((event) => {
    if (event.kind === 'noteOn') held.add(event.midi);
    else held.delete(event.midi);
    markMatch();
  });

  // --- load ---------------------------------------------------------------

  /**
   * The way out a dead end offers: back to the rung, where one opened this.
   *
   * Same reasoning as the header's Back. A learner who pressed *Chart* on a
   * rung and met "there are no chord symbols in this" wants that rung back —
   * its other songs are the ones to try next — rather than a library to find
   * their way through again. With no rung in the route each branch keeps the
   * offer it had, which is why the label and the action are arguments and not
   * a constant: *Import a copy* is the right words for the unbundled case and
   * the wrong ones for the rung.
   */
  function wayOut(label: string, act: () => void, id: string): [string, () => void, string] {
    if (fromRung === undefined) return [label, act, id];
    return ['Back to the lesson', () => { router.navigateLesson(fromRung); }, 'chart-open-lesson'];
  }

  /**
   * The sentence, then the one control that does what it suggests (`04` §0 R4).
   *
   * Every way this screen can fail ends here, because every one of them ends
   * with no chart: the four empty bars, the count-off, the stop, the bpm field
   * and the three live toggles were drawn over an unknown item, over a piece
   * with no file, and over a fetch that threw, exactly as they were over a
   * piece with no harmony in it. Only the no-chords branch had ever been
   * cured; the others still offered a transport with nothing to run.
   *
   * Reason, then remedy: the status line lives under the chart while there is
   * a chart, which is right, so with no chart it moves above the row it
   * explains.
   */
  function deadEnd(sentence: string, label: string, act: () => void, id: string): void {
    status.textContent = sentence;
    form.hidden = true;
    grid.hidden = true;
    // `04` §0 R4: the sentence and the one control it suggests, and nothing
    // else. A `?` offering to explain a chord chart, over a screen where there
    // is no chord chart, is furniture for a thing that is not there. Removed
    // rather than hidden, because `empty-states.spec.ts` counts the screen's
    // buttons and a hidden one is still one.
    helpStrip.el.remove();
    bars = [];
    drawGrid();
    body.insertBefore(status, controls);
    controls.replaceChildren(button(label, act, { id, variant: 'primary' }));
  }

  void (async () => {
    try {
      const item = await findItem(itemId);
      if (!item) {
        deadEnd(
          `There is nothing in the library called “${itemId}”.`,
          ...wayOut('Open the library', () => { router.navigate('library'); }, 'chart-open-library'),
        );
        return;
      }
      (header.querySelector('h1') as HTMLElement).textContent = item.title;
      title = item.title;

      let xml: string;
      if (item.imported) {
        const row = await getImport(item.id);
        if (typeof row?.data !== 'string') throw new Error('the imported file is missing');
        xml = row.data;
      } else if (item.file) {
        const response = await fetch(contentUrl(item.file));
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        xml = toMusicXml(new Uint8Array(await response.arrayBuffer()));
      } else {
        // Not bundled: the catalog row is a placeholder and the owner's own
        // copy is the only way to get the notes — and therefore the chords.
        deadEnd(
          `${item.title} is not bundled, so there is no file to read chords from — import your own copy.`,
          ...wayOut('Import a copy', () => { router.navigate('library'); }, 'chart-open-library'),
        );
        return;
      }

      const { symbols, measures } = readHarmony(xml);
      // One bar per measure, in the score's order, each its segments (PH2), and each counted in the time signature
      // in force over that measure (MT1). The printed number keys nothing: MT1's lookup by it is gone.
      bars = chartSegments(symbols, measures).bars;
      timing = chartTiming(measures.map((measure) => countOf(measure.signature)));
      bpmInput.setAttribute('aria-label', timing.tempoName);
      if (symbols.length === 0) {
        // It used to say the screen could not work and then draw a
        // working-looking one: four empty bars with dashes, a count-off, a
        // stop, a bpm field and three live toggles, over a piece with no
        // harmony in it and no way to act on the advice.
        deadEnd(
          `${item.title} has no chord symbols in it.`,
          'Open on the Score screen',
          // The rung rides on, so Back from *that* screen comes here as well
          // rather than dropping the learner on a tab (`04` §5).
          () => {
            if (fromRung === undefined) router.navigateScore(itemId);
            else router.navigateScore(itemId, { from: fromRung });
          },
          'chart-open-score',
        );
        return;
      }
      if (item.tempoBpm) {
        // Clamped the same way a manual edit is (`bpmInput`'s own `change`
        // handler, above): the catalog carries real pieces down to 31 bpm and
        // up to 264, both outside the field's declared 40–240 and outside
        // what `BeatScheduler` was sized for, and an unclamped value here
        // disagreed with the field's own `min`/`max` the moment the chart
        // loaded, before anyone had touched it.
        // In the chart's beat (MT1): the catalog's quarter notes a minute over the beat's length in quarters, so
        // the bar lasts as long as it did; a quarter-note beat gives exactly the old value.
        bpm = tempoFieldDefault(item.tempoBpm, timing.beatUnit);
        bpmInput.value = String(bpm);
      }
      drawGrid();
      // Laid out at once where the screen is already on the page: a bar that cannot show its chords' places has
      // refused the chart, and a refused chart offers no transport (`tooDense`).
      if (section.dataset.refused) return;
      drawForm();
      showTransport();
    } catch (cause) {
      deadEnd(
        `That chart could not be opened: ${cause instanceof Error ? cause.message : String(cause)}`,
        ...wayOut('Open the library', () => { router.navigate('library'); }, 'chart-open-library'),
      );
      status.classList.add('status--error');
    }
  })();

  onScreenSuspend(section, {
    onHidden: suspend,
    onVisible: () => {
      // No audio on return is a reason to stay held, not to throw: *Count off ▶* is still there.
      void resume().catch(() => undefined);
    },
  });

  onScreenDispose(section, () => {
    disposed = true;
    if (running) stop();
    gridObserver?.disconnect();
    metronome?.dispose();
    stopMidi();
    stopKeys();
    strip?.destroy();
  });

  return section;
}
