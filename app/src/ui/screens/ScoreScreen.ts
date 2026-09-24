/**
 * The Score screen (docs/04-ui-spec.md §5) — the screen the app exists for.
 *
 * Structure, top to bottom: a header row (Back, the title, the app's own
 * messages), the notation, a control bar of six things and a `⋯`, and an
 * optional keyboard strip. A summary sheet covers all of it at the end of a
 * run. All the timing, judging and scheduling lives in `score/ScoreSession`;
 * this file is chrome and wiring.
 *
 * `#/score/<catalog id>` — the id is in the hash so reload and the back
 * gesture work with no extra state (docs/04 §1).
 */
import './ScoreScreen.css';
import { audioEngine } from '../../audio/AudioEngine';
import { metronomeSoundFor } from '../../audio/inputPolicy';
import { getPiano, micSource, screenKeyboardSource, webMidiSource } from '../../app/services';
import { findItem, contentUrl, loadCurriculum } from '../../curriculum/load';
import { parseFrontMatter, renderMarkdown } from '../markdown';
import { barsPerWindowFor, isTablet } from '../tablet';
import { getImport } from '../../data/importStore';
import { isSightReading } from '../../engine/drills/fromCatalog';
import { generateSightReading, type SightReadingLevel } from '../../engine/sightReading';
import type { CatalogItem, Lesson } from '../../curriculum/types';
import { lessonForItem, masteryCriteriaFor } from '../../curriculum/selectors';
import { getMidiSettings } from '../../data/midiSettings';
import {
  DEFAULT_SETTINGS,
  getSettings,
  updateSettings,
  type FollowInput,
  type KeysView,
  type PlaybackHands,
} from '../../data/settingsStore';
import {
  demandsTechniqueMeasure,
  evaluateOutcome,
  accentScore,
  techniqueMeasureFor,
} from '../../engine/Scoring';
import { nextLadderTempo } from '../../engine/PracticeEngine';
import { recordRun } from '../../data/progressStore';
import type { Mode, SessionScore } from '../../engine/types';
import type { InputNoteEvent } from '../../midi/types';
import { toMusicXml } from '../../score/mxl';
import { OsmdView } from '../../score/OsmdView';
import { ScoreSession } from '../../score/ScoreSession';
import {
  MAX_BARS_PER_WINDOW,
  MIN_BARS_PER_WINDOW,
  WindowRenderer,
  type HandsFocus,
  type ScoreLayout,
} from '../../score/WindowRenderer';
import { bpmAt, type ScoreModel } from '../../score/types';
import type { Router } from '../../router';
import { KeyboardStrip, type KeyView } from '../KeyboardStrip';
import { KeyRibbon } from '../KeyRibbon';
import { waitingForLine } from '../expectedNote';
import { stripRangeFor } from '../stripRange';
import { onScreenDispose } from '../screenLifecycle';
import { MODE_HELP, type ScoreMode } from '../help';
import { forgetUnfinished, rememberUnfinished, unfinishedFor } from '../../data/unfinishedRun';
import { createHelpStrip, maybeFirstSight, openFirstSight, type HelpStrip } from '../helpStrip';
import { openSheet } from '../widgets';
import { hasChordSymbols } from '../openItem';

/**
 * What the four modes are called on the screen (P21c B2).
 *
 * They were one word each, and the one word was a noun for the mechanism:
 * `Listen` is the app playing the piece *to* you, but in a row that also
 * carries `R`, `L` and an input setting it reads as something the app does
 * with your playing — which is why the owner asked for a way to hear the
 * piece while sitting in front of the control that does it.
 *
 * The ids do not change, so every stored mode, route and test still means
 * what it meant.
 */
const MODES: { id: Mode; label: string }[] = [
  { id: 'wait', label: 'Wait for me' },
  { id: 'tempo', label: 'Keep tempo' },
  { id: 'listen', label: 'Play it to me' },
  { id: 'free', label: 'Free play' },
];

/**
 * The same four modes, in one word each, for a bar that has run out of room.
 *
 * `Hear it` earned its place on the bar and something had to give: at 360 px
 * the row came to 392 px and wrapped onto three, which is 40 px off the music
 * and the one thing the bar may not do (`04` §5). Below 400 px the select
 * shows these; the sentences are still what the dropdown lists, and sideways
 * — where there is room — the sentences are on the bar too.
 */
const SHORT_MODES: Record<Mode, string> = {
  wait: 'Wait',
  tempo: 'Tempo',
  listen: 'Play',
  free: 'Free',
};

/**
 * How far the drawn size may be pushed either way, and by how much per press.
 *
 * These were three literals inside `setZoom` — `Math.min(2.5, Math.max(0.5,
 * …))` — and the readout beside the buttons has to know the same numbers to
 * grey a button out at the end of the range. Two copies of a limit is how a
 * control ends up claiming to be at its maximum while still moving.
 */
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.1;

/** Below this the bar cannot hold the sentences. Measured, not chosen. */
// 440, not 400: at 412 px — the other common phone width — the long mode
// labels fitted the row but not the select, which clipped "Wait for me" to
// "Wait for m" (the state gallery, size 412).
const NARROW_BAR_PX = 440;

/** The smallest a finger can reliably hit (`04` §0 R4: "about forty"). */
const TAP_MIN_PX = 40;

const INPUTS: { id: FollowInput; label: string }[] = [
  { id: 'midi', label: 'MIDI' },
  { id: 'mic', label: 'Mic' },
  { id: 'keys', label: 'Screen keys' },
  { id: 'none', label: 'None' },
];

// A letter is enough on the bar and not enough for a screen reader, which
// would say "R" and leave it there.
const HANDS: { id: HandsFocus; label: string; spoken: string }[] = [
  { id: 'R', label: 'R', spoken: 'Right hand' },
  { id: 'L', label: 'L', spoken: 'Left hand' },
  { id: 'both', label: 'Both', spoken: 'Both hands' },
];

/** The control bar hides after this long without a tap (docs/04 §5). */
export const CONTROL_BAR_HIDE_MS = 3_000;
/**
 * …and sooner at the start of a run. Sideways the bar overlays the bottom of
 * the music once the stage has taken its row, and three seconds of it over
 * the lower staff is the first bar of every piece hidden (the Twinkle
 * pictures). Long enough to see ▶ become ⏸; not long enough to matter.
 */
export const CONTROL_BAR_START_HIDE_MS = 700;

/**
 * Sight-reading is the one drill kind that is notation (docs/05 §7–§8), so it
 * opens here rather than on the drill screen. Its parameters come from the
 * catalog item, exactly as the runtime drills' do.
 *
 * A fresh exercise is generated each time the screen is opened, because the
 * whole point is material the learner has not seen. "Again" on the summary
 * sheet re-runs the *loaded* score rather than regenerating, which is what
 * docs/05 §8 means by retrying a failed sight-read identically.
 */
function generateSightReadingFor(item: CatalogItem, seed?: number): string {
  const params = item.drill?.params ?? {};
  const hands = params.hands === 'left' ? 'L' : params.hands === 'both' ? 'both' : 'R';
  const level = (typeof params.level === 'number' ? params.level : 1) as SightReadingLevel;
  return generateSightReading({
    level,
    hands,
    ...(typeof params.bars === 'number' ? { bars: params.bars } : {}),
    // Today's sight-read carries the day's seed in the route (`04` §2), so
    // the day has one phrase; every other open is fresh.
    ...(seed === undefined ? {} : { seed }),
  }).musicXml;
}

export function ScoreScreen(router: Router): HTMLElement {
  const section = document.createElement('section');
  section.className = 'screen screen--score';
  section.dataset.screen = 'score';

  const itemId = router.route.score ?? '';
  /**
   * Blind mode (replan §8): the engraving is hidden, everything else runs.
   *
   * Deliberately *not* a different engine path. The model, the expectations,
   * the scoring and the keyboard strip are identical — the only difference is
   * that the SVG is not shown, so the run is judged exactly as a sighted one
   * is and the two numbers are comparable. That comparability is the feature:
   * "play it from memory at 90 % of what you got with the score" only means
   * something if both were measured the same way.
   */
  const blind = router.route.blind === true;
  /** A performance run (replan §8): one pass, no restarts, no loop. */
  const performanceRun = router.route.performance === true;
  /**
   * What a guided tour asked this screen to be (`04` §5c-1).
   *
   * The tour of the practice modes does not draw its own little score screen —
   * it opens *this* one, already in the mode the step is about, and Back
   * returns to the step after it. So three route parameters and nothing else:
   * the mode to start in, the bars to loop, and the walkthrough to go back to.
   * Read once, applied at the two points where this screen already decides
   * those things, so there is nothing new to keep in step.
   */
  const routeMode = router.route.scoreMode;
  const routeLoop = router.route.scoreLoop;
  /**
   * `?ladder=1` — open looping the whole item with the ladder on (`04` §3d).
   *
   * The rungs that ask for this are scales, arpeggios, Hanon and octaves, where
   * the whole item *is* the loop: they are short, they repeat by nature, and
   * looping one is not a choice about which bars matter. Applied at the same
   * point `?loop=` is, and fails closed — see `applyRouteLadder`.
   */
  const routeLadder = router.route.ladder === true;
  const tourId = router.route.tour;
  /**
   * The rung that opened this screen, if one did (`04` §5, `?from=`).
   *
   * Read once, like the tour, because it is a property of how the screen was
   * opened and not of anything that happens on it.
   */
  const fromRung = router.route.scoreFrom;
  /**
   * The tour's parameters, for a navigation that has to keep them.
   *
   * Blind and Perform are routes, so pressing either rebuilds the screen from
   * the hash — and without these the learner would be silently dropped out of
   * the tour by a control that has nothing to do with it. The hand rides here
   * for the same reason: a duet opened from the Library (`04` §4) would lose
   * its hand — and so the app's half of it — on a tap of Blind. And the rung,
   * for the same reason again: Blind on a piece opened from `2.1` must not
   * turn Back into a tab.
   */
  const tourRoute = {
    ...(routeMode ? { mode: routeMode } : {}),
    ...(router.route.scoreHands ? { hands: router.route.scoreHands } : {}),
    ...(routeLoop ? { loop: routeLoop } : {}),
    ...(tourId === undefined ? {} : { tour: tourId }),
    ...(fromRung === undefined ? {} : { from: fromRung }),
  };
  /**
   * Where Back goes: the tour that opened this, the rung that opened it, or
   * the tab it came from.
   *
   * All three ways off this screen — the header's Back, its twin at the bar's
   * left end when the phone is sideways, and Done on the summary sheet — go
   * through here, because a tour that can only be resumed from one of the
   * three is a tour the learner loses by finishing a run.
   *
   * **The tour wins over the rung** where both are in the hash. The tour is a
   * walkthrough with a next step in it and the learner is inside it; the rung
   * is still there when the walkthrough ends. A Back that dropped somebody out
   * of a tour is the fault `?tour=` was added to fix.
   */
  function leaveScore(): void {
    if (tourId !== undefined) router.navigateDrill(tourId);
    else if (fromRung !== undefined) router.navigateLesson(fromRung);
    else router.navigate(router.route.tab);
  }
  let item: CatalogItem | undefined;
  /**
   * The rung this piece is practised on, once the curriculum has loaded.
   *
   * Only the pass thresholds use it (`02` Part G, built 2026-09-21), and only
   * at the end of a run, which is why a failed or slow curriculum load is
   * silent: the run is still judged, against the learner's own settings, and
   * a screen that refused to open because it could not name a rung would be
   * trading the piece for the paperwork.
   */
  let rung: Lesson | undefined;
  let model: ScoreModel | null = null;
  let renderer: WindowRenderer | null = null;
  let session: ScoreSession | null = null;
  let strip: KeyView | null = null;
  /** The keys the piece uses, once it is loaded; what a keys view is built for. */
  let keysRange: { from: number; to: number } | null = null;
  let wakeLock: WakeLockSentinel | null = null;

  const settings = { ...getSettings() };
  let mode: Mode = 'wait';
  /**
   * A `Hear it` run is going (P21c B1).
   *
   * It plays the piece the way Listen mode does without *being* Listen mode:
   * the select does not move, so what the button interrupts is put back the
   * moment it stops. The owner asked "is there a way to play the notes out
   * loud to show me what it sounds like?" while sitting in front of the
   * control that does exactly that — which is the answer to whether a mode
   * in a dropdown counts as a way to do something.
   */
  let hearing = false;
  /**
   * Whether this run has already said the app is playing a hand (P21c B3).
   *
   * `playbackHands` defaults to `non-focused`, so choosing `R` means the app
   * plays the left hand under you. That is the right default and it is also a
   * sound arriving from nowhere: with no piano connected and the phone on the
   * stand it reads as a fault rather than as help. Said once when the run
   * starts, not on every render — a line that keeps reappearing is noise.
   */
  let saidPlayingHand = false;
  /**
   * Whether this visit has already said the run judges rhythm alone (T17-2).
   *
   * Once, like the hand, and reset when the `⋯` row is touched — a learner who
   * switches it on mid-visit is told the next time a run starts, and a ladder
   * restarting the run between passes says nothing at all.
   */
  let saidRhythmRun = false;
  /**
   * A bar being played back on its own (P21c B4).
   *
   * `04` §5 has listed "long-press a bar plays it" among the gestures since
   * the spec was written and it was never built. In Wait mode it is the
   * "show me what this is meant to sound like" for the bar you are stuck on.
   * Holds what the run was doing so it can be put back afterwards.
   */
  // `bar` is the preview's own single bar, so the restore can tell the loop it
  // borrowed from one the learner has changed under it (T31).
  let hearingBar: { mode: Mode; loop: { from: number; to: number } | null; bar: number } | null =
    null;
  /**
   * A run has finished by itself since the last one was started (T8). Keys do
   * not start a run then — people carry on playing after the last bar — until
   * ▶ or Space starts one. Every finish counts, not only the ones that open a
   * summary: Free, Listen and `Hear it` end without one (T8 review, M3).
   */
  let endedSinceLastStart = false;
  /** True once the screen is being torn down; see `showSummary`. */
  let leaving = false;
  /** The pending long-press, if a finger is down on the stage. */
  let pressHold: number | null = null;
  /** Where that finger went down, so a wobble can be told from a drag. */
  let pressFrom: { x: number; y: number } | null = null;
  /** Runs finished since this exercise was generated (see the summary sheet). */
  let sightReadAttempts = 0;
  let input: FollowInput = 'none';
  /**
   * Which hand the learner is playing.
   *
   * `both` unless the hash asked for one (`04` §4, the Library's Duet door),
   * and read here rather than after the load because the renderer is built
   * with it: a hand applied later would re-engrave the sheet for nothing.
   */
  let hands: HandsFocus = router.route.scoreHands ?? 'both';
  let tempoPct = settings.defaultTempoPct;
  /**
   * Seconds the page was away, while a run is paused because of it (T31).
   *
   * The sentence used to live on `#score-status`, beside a state line that
   * went on saying the mode's standing sentence -- *The count-in clicks, then
   * play along* over a run that was doing nothing of the kind. There is one
   * line for what the run is doing (`04` 5f) and this is a thing the run is
   * doing, so it goes there and `#score-status` is left for the messages that
   * are not about the transport. `null` is a pause the learner asked for.
   */
  let awaySeconds: number | null = null;
  /**
   * The last start was refused because the chosen hand has nothing to play.
   *
   * The refusal names the two hands that would work -- *choose R or Both* --
   * and pressing one of them did nothing at all, because the hand buttons only
   * start a run when one is already going and that one had just been stopped.
   * A control the screen has itself just told you to press must do something
   * (`00` 1), so a hand chosen after a refusal starts the run it asked for.
   */
  let handRefused = false;
  let metronomeOn = false;
  /**
   * Rhythm first (`04` §5, `05` §3a): tap the piece's rhythm on any key.
   *
   * A remembered preference rather than run state, so it comes back on the
   * next piece; the engine still refuses it outside Keep tempo, and a blind or
   * performance run ignores it because both are claims about the piece itself.
   */
  let rhythmOnly = settings.rhythmOnly;
  /**
   * The tempo ladder on a loop (`04` §5, `05` §6).
   *
   * Run state, deliberately, and for the same reason the loop it belongs to is
   * run state: a ladder without a loop is nothing, and a loop set on one piece
   * does not follow you to the next.
   */
  let ladderOn = false;
  /**
   * The highest tempo the learner has asked for since the ladder was switched
   * on — the ceiling, when it is above the written tempo. A ladder must not
   * undo a decision made with a hand on the slider.
   */
  let ladderCeilingPct = tempoPct;
  /**
   * What the duet plays when its row is switched back on (`04` §5).
   *
   * `playbackHands` has three values and the row is a toggle. Off writes
   * `none`; on used to write `non-focused` whatever had been there, so a
   * learner who had chosen `both` in Settings lost it on the first Off/On of
   * the row and had to go three screens back to find out why the sound had
   * changed. The value that was playing is remembered here and comes back.
   * `non-focused` is the setting's own default, and what a learner who has
   * never been to Settings gets.
   */
  let duetWhenOn: PlaybackHands =
    settings.playbackHands === 'none' ? 'non-focused' : settings.playbackHands;
  /**
   * What the run's totals stood at when the previous pass ended.
   *
   * A looping engine keeps one set of totals for the whole run, so the score
   * handed to a lap's `finished` is everything since the run started. Judging
   * the ladder on that would mean one stumble in the first pass followed the
   * learner for the rest of the session — and at the floor, where the tempo
   * stops moving and the run is never restarted, it could never be climbed out
   * of again. The pass is the difference.
   */
  let ladderPassBase = { missed: 0, wrong: 0 };
  let loopBars: { from: number; to: number } | null = null;
  let loopAnchor: number | null = null;
  let sections: { label: string; fromMeasure: number; toMeasure: number }[] = [];
  /** The section the current loop came from, so the button can name it. */
  let loopSection: { label: string; fromMeasure: number; toMeasure: number } | null = null;
  const unsubscribers: (() => void)[] = [];
  /** Closers for any open control sheet, so leaving the screen takes it too. */
  const openSheets: (() => void)[] = [];

  // --- chrome --------------------------------------------------------------
  // docs/04 §7a: a tablet gets four bars in the window by default and a side
  // panel. The phone is untouched — `isTablet` wants 900 px on the *shortest*
  // side, so a phone in landscape does not qualify.
  //
  // Four bars *were* tried for a phone held sideways, on the theory that 780 px
  // of width deserved more music. It is worse: OSMD stacks four short bars onto
  // three systems rather than one wide one, the window then overflows the
  // height, and the fit shrinks the whole sheet to compensate — smaller notes
  // using *less* of the width.
  //
  // The width is lost inside the engraving, not in the fitting: OSMD draws the
  // page the full width of the screen and then inks about 40% of it. Three of
  // its own settings were tried against that and none moved a pixel; the
  // measurements are in docs/decisions/2026-09-07-the-ux-tour.md. What fills
  // the width is *one* bar in the window, which costs all the read-ahead — so
  // it is the owner's choice to make, not a default to change from here.
  const tablet = isTablet();
  if (tablet) {
    section.dataset.tablet = 'true';
    settings.barsPerWindow = barsPerWindowFor(settings.barsPerWindow, {
      tablet: true,
      storedIsDefault: settings.barsPerWindow === DEFAULT_SETTINGS.barsPerWindow,
    });
  }

  const stage = document.createElement('div');
  stage.className = 'score-stage';
  stage.id = 'score-stage';

  /**
   * The count-in, drawn (P21c A6).
   *
   * It was clicks only. On a phone on a stand with the sound low the first
   * note therefore arrives unannounced, which is the one moment a beginner
   * most needs to know when to start. The drill screen already counts down in
   * words; this is the same idea over the notation.
   */
  const countIn = document.createElement('div');
  countIn.className = 'score-countin';
  countIn.id = 'score-countin';
  countIn.hidden = true;
  stage.appendChild(countIn);
  if (blind) {
    // Hidden, not unmounted: the renderer still needs a box to lay out into,
    // and the cursor still tracks — it is simply not drawn where he can see
    // it. `visibility` rather than `display` keeps the layout stable so the
    // keyboard strip does not jump when a run starts.
    stage.classList.add('score-stage--blind');
    stage.setAttribute('aria-hidden', 'true');
    section.dataset.blind = 'true';
  }
  section.appendChild(stage);

  /**
   * The tablet side panel (`04` §7a).
   *
   * A `<details>` rather than a bespoke drawer: it collapses, it remembers
   * nothing, and it is keyboard- and screen-reader-operable without a line of
   * code. What goes in it is the lesson text — the thing you would otherwise
   * have to leave the score to read.
   *
   * Only built on a tablet. On a phone it would be a panel with nowhere to go.
   */
  const sidePanel = document.createElement('details');
  sidePanel.className = 'score-side';
  sidePanel.id = 'score-side';
  sidePanel.open = true;
  sidePanel.hidden = true;
  section.dataset.side = 'empty';
  if (tablet) {
    const summary = document.createElement('summary');
    summary.textContent = 'Lesson notes';
    summary.id = 'score-side-summary';
    sidePanel.appendChild(summary);
    const body = document.createElement('div');
    body.className = 'score-side__body';
    body.id = 'score-side-body';
    sidePanel.appendChild(body);
    section.appendChild(sidePanel);
  }

  // Both of these are put into the header row further down; they are built
  // here because the loader below writes to them before it exists.
  const status = document.createElement('p');
  status.className = 'score-status';
  status.id = 'score-status';

  /**
   * A dot that pulses on the beat (P21c A6).
   *
   * How a player checks the tempo without hearing the click, which on a phone
   * on a stand next to a piano is most of the time. Brighter on beat 1 so the
   * bar is readable and not just the pulse. Off in Wait and Free, which have
   * no clock to show.
   */
  const beatDot = document.createElement('span');
  beatDot.className = 'score-beat';
  beatDot.id = 'score-beat';
  beatDot.hidden = true;
  beatDot.setAttribute('aria-hidden', 'true');
  status.textContent = 'Loading…';

  // Where you are in the piece as a whole — `bar 3 / 48` — which nothing else
  // on the screen says: two systems, no scrollbar, no proportion (`08` §4.4).
  const where = document.createElement('span');
  where.className = 'score-head__where';
  where.id = 'score-where';

  // Beside the status line, hidden unless the owner has asked for note names.
  const waitingLine = document.createElement('p');
  waitingLine.className = 'score-waiting';
  waitingLine.id = 'score-waiting';
  waitingLine.hidden = true;

  // Where you are, in the stage's top-right corner, for when the chrome has
  // folded away — the header upright, the bar's left end sideways — and
  // nothing else on the screen says it.
  const corner = document.createElement('span');
  corner.className = 'score-stage__corner';
  corner.id = 'score-corner';
  corner.setAttribute('aria-hidden', 'true');

  const bar = document.createElement('div');
  bar.className = 'score-bar';
  bar.id = 'score-bar';
  section.appendChild(bar);

  const stripHost = document.createElement('div');
  stripHost.className = 'score-strip';
  stripHost.id = 'score-strip';
  section.appendChild(stripHost);

  const sheet = document.createElement('div');
  sheet.className = 'summary-sheet';
  sheet.id = 'score-summary';
  sheet.hidden = true;
  section.appendChild(sheet);

  // --- header --------------------------------------------------------------

  /**
   * Back, the piece's name, the app's messages and the mic level, in one real
   * row at the top (`04` §5, B1).
   *
   * These were three absolutely-positioned lines over the notation. Held
   * sideways the title printed across bar 1; held upright the stage paid a
   * constant 3 rem of top margin whether or not anything was being said. A
   * row costs its height once, and the fit now gets a stage whose height does
   * not depend on what the status line happens to say.
   */
  const head = document.createElement('div');
  head.className = 'score-head';
  head.id = 'score-head';
  section.prepend(head);

  const back = button('← Back', () => leaveScore(), 'score-back');

  const title = document.createElement('h1');
  title.className = 'score-head__title';
  title.id = 'score-title';

  const micMeter = document.createElement('div');
  micMeter.className = 'mic-meter score-mic';
  micMeter.id = 'score-mic-meter';
  micMeter.hidden = true;
  const micFill = document.createElement('div');
  micFill.className = 'mic-meter__fill';
  micMeter.appendChild(micFill);

  /**
   * Back, the piece, the app's messages and the mic meter — one row that never
   * wraps — with the help strip and the offer to carry on under it.
   *
   * The row is its own element because the header stopped being one row on
   * 2026-09-23. Letting `.score-head` itself wrap was the obvious way to give
   * the strip a line of its own and it was wrong: a long status message mid-run
   * then pushed the mic meter onto a second line, the header grew, the stage
   * lost the height, and the sheet re-fitted — which is the one thing a run is
   * not allowed to do (`08` P21e A2, and `score.fuzz.spec.ts` seed 4 caught it:
   * *the size changed mid-run: scale 0.84 → 0.73*).
   */
  const headRow = document.createElement('div');
  headRow.className = 'score-head__row';
  headRow.append(back, title, where, status, micMeter);
  head.append(headRow);

  /**
   * What this is and what to do now, over the notation (`04` §5f).
   *
   * The mode selector on the bar says *Keep tempo*; nothing said what a Keep
   * tempo run does to you, what else this screen holds, or where the piece
   * came from (owner, 2026-09-22). One line naming the mode and saying what it
   * is, the state line under it, and a `?` holding the controls and the
   * neighbours.
   *
   * **One state line, not two.** The strip does not grow a line of its own: it
   * takes `#score-waiting`, which `drawWaitingFor` already writes from the
   * engine's signals and which the bar mirrors sideways by id. So the sentence
   * the learner reads mid-run is the same element it has always been, in the
   * same place, written by the same function — the strip only gives it a
   * standing default for the moments when the run has nothing to say.
   */
  const helpStrip: HelpStrip = createHelpStrip({
    id: 'score',
    entry: MODE_HELP.wait,
    nowElement: waitingLine,
    // `04` §0 R1: one line of explanation in the header at most, and this
    // header is over the notation. The mode's name here; its sentence in the
    // card the first time and behind the `?` after that.
    compact: true,
    reopen: {
      label: 'Show the card I saw the first time',
      onOpen: () => openFirstSight({ key: `mode:${modeKey()}`, entry: MODE_HELP[modeKey()], id: 'score' }),
    },
  });
  head.append(helpStrip.el);

  /**
   * "You stopped at bar 12 last time" — and the two things to do about it.
   *
   * Reopening a piece left half way used to start again at bar 1 with nothing
   * saying so (owner, 2026-09-22). Drawn only when there is something to say,
   * in the header, which folds away the moment a run starts — so it is an
   * offer at the top of a visit and never furniture during one (`04` §0 R4).
   */
  const resumeRow = document.createElement('div');
  resumeRow.className = 'score-resume';
  resumeRow.id = 'score-resume';
  resumeRow.hidden = true;
  head.append(resumeRow);

  /** A span of plain words inside the offer. */
  function said(className: string, text: string, id?: string): HTMLElement {
    const node = document.createElement('span');
    node.className = className;
    if (id) node.id = id;
    node.textContent = text;
    return node;
  }

  function drawResume(): void {
    resumeRow.replaceChildren();
    const left = itemId === undefined ? undefined : unfinishedFor(itemId);
    // Nothing to offer once a run is going, and nothing to offer on a mode
    // that does not have a cursor of the learner's own.
    if (!left || !model || session?.running === true || mode === 'listen') {
      resumeRow.hidden = true;
      return;
    }
    const lastBar = printedBar(model.sourceMeasureCount - 1);
    const from = Math.min(left.bar, lastBar);
    const carryOn = button(
      `Carry on from bar ${String(from)}`,
      () => {
        // A loop from there to the end: the engine starts a run at the loop's
        // first bar, which is the only way this screen can begin anywhere but
        // bar 1. It comes round again at the end rather than stopping, which
        // is what the line beside it says out loud.
        loopBars = { from, to: lastBar };
        loopSection = null;
        if (itemId !== undefined) forgetUnfinished(itemId);
        resumeRow.hidden = true;
        startRun();
        render();
      },
      'score-resume-go',
    );
    const startOver = button(
      'Start from the beginning',
      () => {
        if (itemId !== undefined) forgetUnfinished(itemId);
        resumeRow.hidden = true;
      },
      'score-resume-restart',
    );
    resumeRow.append(
      said(
        'score-resume__said',
        `You stopped at bar ${String(from)} of ${String(lastBar)} last time.`,
        'score-resume-said',
      ),
      carryOn,
      startOver,
      said('score-resume__note', 'Carrying on plays from there to the end, then round again.'),
    );
    resumeRow.hidden = false;
  }

  /**
   * Which of the seven the screen is in — the selector's four, plus the three
   * that sit alongside one rather than replacing it.
   *
   * Read in the order they override each other: a performance is a
   * performance whatever the selector says, a blind run is blind, and
   * *Rhythm only* only means anything under the clock.
   */
  function modeKey(): ScoreMode {
    if (performanceRun) return 'perform';
    if (blind) return 'blind';
    if (rhythmOnly && mode === 'tempo') return 'rhythm';
    return mode;
  }
  // On the stage, not in the header: the header is not drawn sideways and
  // the bar hides itself during a run, and the dot is the one thing that must
  // be visible while the clock runs (`08` §5.3).
  stage.appendChild(beatDot);
  stage.appendChild(corner);

  /**
   * The same three things at the bar's left end, for a phone held sideways
   * (P21d A6).
   *
   * Sideways the header row is 40 of 360 px and carries nothing you need
   * while playing, while the bar's left third is empty. So the header goes
   * and Back, the title and the status line move into that third. Mirrored
   * rather than moved: the header is still the right place upright, where the
   * bar is full, and a node can only be in one place. Two elements, kept in
   * step by watching the originals.
   */
  const barLeft = document.createElement('div');
  barLeft.className = 'score-bar__left';
  barLeft.id = 'score-bar-left';
  const backSide = button('← Back', () => leaveScore(), 'score-back-side');
  const titleSide = document.createElement('span');
  titleSide.className = 'score-bar__title';
  titleSide.id = 'score-title-side';
  const statusSide = document.createElement('span');
  statusSide.className = 'score-bar__status';
  statusSide.id = 'score-status-side';
  const whereSide = document.createElement('span');
  whereSide.className = 'score-bar__where';
  whereSide.id = 'score-where-side';
  barLeft.append(backSide, titleSide, whereSide, statusSide);
  bar.prepend(barLeft);
  const syncBarLeft = (): void => {
    titleSide.textContent = title.textContent;
    whereSide.textContent = where.textContent;
    // The waiting line is the more useful of the two when the *run* wrote it.
    // Since the help strip gave it a standing default (`04` §5f) "it has
    // something in it" stopped being the same question as "the run said
    // something", so the strip is asked which it is holding.
    const saidByTheRun = !helpStrip.isDefaultNow();
    statusSide.textContent = saidByTheRun ? waitingLine.textContent : status.textContent;
    corner.textContent = [where.textContent, saidByTheRun ? waitingLine.textContent : '']
      .filter((text) => text !== null && text !== '')
      .join(' · ');
  };
  const mirror = new MutationObserver(syncBarLeft);
  for (const node of [title, where, status, waitingLine]) {
    mirror.observe(node, { childList: true, characterData: true, subtree: true, attributes: true });
  }
  unsubscribers.push(() => mirror.disconnect());

  /**
   * Where the controls that are not on the bar live between openings.
   *
   * Parked in a hidden div and *moved* into the sheet rather than rebuilt
   * inside it: each one carries state, listeners and the id the tour and the
   * e2e suite address it by, and moving a node keeps all three where
   * rebuilding would have to wire every one of them twice.
   */
  const menuStash = document.createElement('div');
  menuStash.className = 'score-stash';
  menuStash.id = 'score-stash';
  menuStash.hidden = true;
  section.appendChild(menuStash);

  const tempoStash = document.createElement('div');
  tempoStash.className = 'score-stash';
  tempoStash.id = 'score-tempo-stash';
  tempoStash.hidden = true;
  section.appendChild(tempoStash);

  // --- control bar ---------------------------------------------------------

  /**
   * Six controls and a `⋯`, in this order and nothing else (`04` §5, B1).
   *
   * It held nineteen. Held sideways that wrapped onto three rows and took a
   * third of the screen off the notation, and the four you actually reach for
   * mid-run — play, mode, which hand, how fast — were in among Layout, Size
   * and Sound, which you set once a year. What is left is what changes during
   * a practice. Everything else is one tap behind the ellipsis, where it gets
   * its own word instead of a bare glyph.
   */
  // `Start again` lives in the ⋯ sheet, not on the bar.
  //
  // The bar holds what changes while your hands are on the keys, and at 390 px
  // it holds seven things. `Hear it` earned a place — a beginner asks to hear
  // a piece constantly — and starting over did not: `▶` from stopped already
  // starts from the beginning, so the glyph was the mid-run case only, which
  // is a deliberate and occasional act. Eight controls came to 444 px of a
  // 390 px bar and wrapped it onto a second row, taking 40 px off the music.
  const restart = button('Start again', () => startRun(), 'score-restart');

  const playPause = button('▶', () => togglePlay(), 'score-play');
  playPause.setAttribute('aria-label', 'Play');
  bar.appendChild(playPause);

  // Words, not a glyph: there is no symbol for "play it to me rather than
  // with me", and this is the one control on the bar whose whole problem was
  // that nobody could find it.
  const hearButton = button('Hear it', () => toggleHear(), 'score-hear');
  hearButton.title = 'Play the piece to you, nothing judged';
  bar.appendChild(hearButton);

  const modeSelect = select(
    MODES.map((m) => ({ value: m.id, label: m.label })),
    'score-mode',
    'Practice mode',
    (value) => {
      mode = value as Mode;
      // A mode chosen by hand is a mode met for the first time as much as one
      // arrived at by default.
      maybeFirstSight({ key: `mode:${modeKey()}`, entry: MODE_HELP[modeKey()], id: 'score' });
      if (session?.running) startRun();
      render();
    },
  );
  bar.appendChild(modeSelect);

  /**
   * Long labels where they fit, short ones where they do not.
   *
   * The text of an `<option>` is not something CSS can change, so this is the
   * one thing on the bar that has to be done in script. Only the *closed*
   * select is affected in practice — the dropdown is a list, and a list has
   * room — but both are set, because a select shows whichever it likes.
   */
  /**
   * What leaves the bar when the bar cannot afford it, and in what order.
   *
   * The row carries six controls and a 342 px phone has no forty pixels to give
   * each of them — two CI runs proved that the hard way. Finding the pixels was
   * never the answer: at this size something has to go, and the `...` sheet is
   * full-screen, explains every control it holds, and is one tap away.
   *
   * Ordered by how often a hand reaches for it *during* a session, least first.
   * Hands is a setting chosen once for a piece and it is the widest thing here,
   * so it buys the most and costs the least. Hearing the piece is occasional.
   * Play, the mode, the tempo readout and `...` itself never leave — `...` is
   * where the others go, and a gateway that could hide itself would be a trap.
   */
  const OVERFLOW_ORDER: { el: HTMLElement; label: string; hint: string }[] = [];

  /** Where each overflowed control came from, so it can go back in its place. */
  const barSlot = new Map<HTMLElement, Element | null>();
  const overflowed = new Map<HTMLElement, HTMLElement>();

  function sendToSheet(entry: { el: HTMLElement; label: string; hint: string }): void {
    if (overflowed.has(entry.el)) return;
    barSlot.set(entry.el, entry.el.nextElementSibling);
    const row = menuRow(entry.label, entry.hint, entry.el);
    menuStash.append(row);
    overflowed.set(entry.el, row);
  }

  function bringBackToBar(el: HTMLElement): void {
    const row = overflowed.get(el);
    if (!row) return;
    bar.insertBefore(el, barSlot.get(el) ?? null);
    row.remove();
    overflowed.delete(el);
  }

  /** The bar is on more than one line, or a control that stays is too small. */
  function barIsOverfull(): boolean {
    const rows = new Set(
      [...bar.children]
        .filter((k) => k.getBoundingClientRect().height > 0)
        .map((k) => Math.round(k.getBoundingClientRect().top)),
    );
    if (rows.size > 1) return true;
    for (const el of [playPause, moreButton]) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.width < TAP_MIN_PX || r.height < TAP_MIN_PX)) return true;
    }
    return false;
  }

  /**
   * Puts as much on the bar as it can hold, and the rest in the sheet.
   *
   * Everything comes back first and then leaves one at a time, so a phone
   * turned sideways gets its controls back rather than keeping whatever the
   * narrower way up decided. Skipped while the sheet is open, because the
   * stash's children are inside it then and moving them would empty it under
   * the owner's finger.
   */
  function fitBarControls(): void {
    if (document.getElementById('score-more-sheet')) return;
    for (const entry of OVERFLOW_ORDER) bringBackToBar(entry.el);
    for (const entry of OVERFLOW_ORDER) {
      if (!barIsOverfull()) return;
      sendToSheet(entry);
    }
  }

  function applyModeLabels(): void {
    const narrow = window.innerWidth < NARROW_BAR_PX;
    for (const option of [...modeSelect.options]) {
      const id = option.value as Mode;
      const long = MODES.find((m) => m.id === id)?.label ?? option.textContent ?? id;
      option.textContent = narrow ? SHORT_MODES[id] : long;
    }
  }
  applyModeLabels();
  // Re-rendered on resize too: the tempo label's width depends on it.
  window.addEventListener('resize', () => render());
  window.addEventListener('resize', applyModeLabels);
  window.addEventListener('resize', fitBarControls);
  unsubscribers.push(() => window.removeEventListener('resize', fitBarControls));
  unsubscribers.push(() => window.removeEventListener('resize', applyModeLabels));

  const handsGroup = document.createElement('div');
  handsGroup.className = 'score-group';
  // One control made of three segments, and it says so.
  //
  // `R`, `L` and `Both` are about 23 px wide each, and judged one at a time
  // they read as three tap targets far under `04` §0 R4's forty — 118 gallery
  // cells said so. They are not three targets: they are one 92 x 40 segmented
  // control, adjacent, and a slip between neighbouring segments costs a tap to
  // undo rather than doing something unexpected. Marking the group lets the
  // sweep judge what is really there, so what it still reports is real.
  handsGroup.dataset.tapGroup = '';
  for (const hand of HANDS) {
    handsGroup.appendChild(
      button(
        hand.label,
        () => {
          hands = hand.id;
          forgetPlayingHand();
          renderer?.setHandsFocus(hand.id);
          // The sentence named the hand that was refused, and the hand has
          // just changed, so it is about nothing now.
          if (handRefused) status.textContent = '';
          if (session?.running === true || handRefused) startRun();
          render();
        },
        `score-hands-${hand.id}`,
      ),
    );
    handsGroup.lastElementChild?.setAttribute('aria-label', hand.spoken);
  }
  bar.appendChild(handsGroup);

  const tempoLabel = document.createElement('span');
  tempoLabel.className = 'score-tempo-label';
  tempoLabel.id = 'score-tempo-label';
  tempoLabel.tabIndex = 0;
  tempoLabel.setAttribute('role', 'button');
  tempoLabel.title = 'Tap to set the tempo';
  tempoLabel.addEventListener('click', (event) => {
    event.stopPropagation();
    showBar();
    openStashedSheet('Tempo', 'score-tempo-sheet', tempoStash);
  });
  tempoLabel.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openStashedSheet('Tempo', 'score-tempo-sheet', tempoStash);
  });
  bar.appendChild(tempoLabel);

  const moreButton = button(
    '⋯',
    () => openStashedSheet('Controls', 'score-more-sheet', menuStash),
    'score-more',
  );
  moreButton.title = 'More controls';
  moreButton.setAttribute('aria-label', 'More controls');
  bar.appendChild(moreButton);

  OVERFLOW_ORDER.push(
    {
      el: handsGroup,
      label: 'Hands',
      hint: 'Which hand the app waits for. Chosen once for a piece, so it is the first thing to leave the bar when the screen is narrow.',
    },
    {
      el: hearButton,
      label: 'Hear it',
      hint: 'Plays the piece to you, nothing judged.',
    },
  );


  // --- the tempo sheet -----------------------------------------------------

  const tempo = document.createElement('input');
  tempo.type = 'range';
  tempo.min = '30';
  tempo.max = '130';
  // A step of 1, not 5: the slider and the bpm field are two views of the same
  // number, and a typed 30 bpm that landed on 42 % left the slider showing 40
  // while the label said 42.
  tempo.step = '1';
  tempo.id = 'score-tempo';
  tempo.setAttribute('aria-label', 'Tempo percent');
  tempo.value = String(tempoPct);
  tempo.addEventListener('input', () => {
    tempoPct = Number(tempo.value);
    raiseLadderCeiling();
    render();
  });
  /**
   * The run is re-timed when the finger comes off, not on every step (T23).
   *
   * `input` fires once per step of a drag. Each one used to call `startRun()`,
   * so a drag from 100 % to 60 % tore the engine down and built it again forty
   * times, counted the run in forty times, and — because `startRun` calls
   * `attachInput`, which disconnects before it reconnects — took the
   * microphone down and brought it back up once per step, on the one input
   * that needs a permission-checked `getUserMedia` to come back. `change`
   * fires once, when the value has settled, which is when there is a new
   * tempo to re-time to. The label still follows the finger, because that is
   * `input`'s job and `render()` is all it costs.
   */
  tempo.addEventListener('change', () => {
    tempoPct = Number(tempo.value);
    raiseLadderCeiling();
    if (session?.running) startRun();
    render();
  });

  /**
   * The typed bpm, in a field rather than a `window.prompt`.
   *
   * The prompt was a browser dialog over a full-screen app: unstyleable, not
   * photographable by the tour, and on Android it takes the page's focus for
   * as long as it is open. A number field in the same sheet as the slider
   * says the same thing and can be seen in a picture.
   */
  const bpmField = document.createElement('input');
  bpmField.type = 'number';
  bpmField.id = 'score-bpm';
  bpmField.className = 'score-bpm';
  bpmField.min = '20';
  bpmField.max = '300';
  bpmField.step = '1';
  bpmField.setAttribute('aria-label', 'Tempo in bpm');
  bpmField.addEventListener('change', () => setBpm(Number(bpmField.value)));

  tempoStash.append(
    menuRow('Speed', 'A share of the written tempo. Slower is how a hard bar becomes an easy one.', tempo),
    menuRow('Beats per minute', 'The written tempo itself.', bpmField),
  );

  // --- the ⋯ sheet ---------------------------------------------------------

  const inputSelect = select(
    INPUTS.map((i) => ({ value: i.id, label: i.label })),
    'score-input',
    'Follow input',
    (value) => {
      input = value as FollowInput;
      // Input decides what is judged, so `04` 5's rule applies to it as much
      // as to the mode and the hands: `accuracyEstimated`, `micChordLeniency`,
      // `micChordFraction`, `wrongNoteConfidence` and `latchStart` are every
      // one of them set from `input` in `startRun`, and a run that keeps the
      // old ones is scored as something it is not -- a microphone run recorded
      // as exactly measured. The sharpest case is *None* chosen while a Keep
      // tempo run is holding for its first note: nothing left can play one, so
      // the run held for ever. The microphone's own failure path has restarted
      // the run for exactly this reason since T8; this is the same rule for
      // the control that does it on purpose.
      if (session?.running === true) startRun();
      // `startRun` attaches the source itself once it has a run going, and
      // does not when it refuses one (a hand this piece has nothing for), so
      // the source chosen a moment ago would be left unattached. Attached from
      // here rather than by moving `attachInput` above that refusal, which is
      // a hang: see the note on `attachInput` in `startRun`.
      if (session?.running !== true) attachInput();
      render();
    },
  );

  /**
   * The named sections, when the piece has any (`04` §5, P18).
   *
   * Until P18 a loop could only be set by double-tapping the first and last
   * bar, which means finding them — on a phone, in a window three bars wide.
   * A rag's second strain or a minuet's second half is a thing the player
   * already has a name for, and the score already knows where it is.
   *
   * Hidden entirely for a piece with no sections rather than shown empty: a
   * disabled control is a question the screen cannot answer.
   */
  const sectionSelect = select([], 'score-section', 'Practice section', (value) => {
    if (!value) {
      clearLoop();
      return;
    }
    const chosen = sections.find((entry) => entry.label === value);
    if (!chosen || !session) return;
    // Printed bars, not model indices: a section says what is on the page.
    const range = session.loopForPrintedBars(chosen.fromMeasure, chosen.toMeasure);
    if (!range) {
      status.textContent = `${chosen.label} could not be found in this score.`;
      return;
    }
    loopBars = { from: chosen.fromMeasure, to: chosen.toMeasure };
    loopSection = chosen;
    if (session.running) startRun();
    render();
  });

  const loopButton = button('Loop', () => clearLoop(), 'score-loop');

  const metronomeButton = button(
    'Off',
    () => {
      metronomeOn = !metronomeOn;
      // The click has to be able to start *while the score is showing*, not
      // only at the top of a run: it is the thing you reach for mid-piece.
      //
      // This line used to be `if (session?.running) startRun()`, which is the
      // run again from its first bar with every mark on the page cleared and
      // another count-in — so the sentence above described the intention and
      // the code did the opposite (T23). `setMetronome` picks the click up on
      // the engine's own grid and leaves the run alone.
      session?.setMetronome(metronomeOn);
      render();
    },
    'score-metronome',
  );

  /**
   * Rhythm first (`04` §5): the piece's rhythm, tapped on any key at all.
   *
   * The smallest honest version of "learn the rhythm before the notes". It is
   * not a fifth mode and not a separate screen: Keep tempo already has the
   * timetable, the count-in, the cursor, the strip and the summary, and the
   * only thing a rhythm-first run does differently is stop asking which key.
   */
  const rhythmToggle = button(
    'Off',
    () => {
      rhythmOnly = !rhythmOnly;
      settings.rhythmOnly = rhythmOnly;
      updateSettings({ rhythmOnly });
      // Worth saying again: what the next run judges has just changed, and
      // the sentence that says so is said once per visit (T17-2).
      saidRhythmRun = false;
      // What is judged has changed, so what is being measured has changed: a
      // run cannot carry half of each.
      if (session?.running) startRun();
      render();
    },
    'score-rhythm',
  );
  const rhythmRow = menuRow(
    'Rhythm only',
    // The last sentence is the one `05` §3a calls a consequence: the first
    // strike closes the step, so a chord played where one note is written
    // leaves two strikes with no window open and both are marked as extra.
    'Tap the rhythm on any key. Early and late are marked as usual; the notes are not, and the run is not counted as playing the piece. One tap per written note or chord; extra keys are wrong.',
    rhythmToggle,
  );
  rhythmRow.id = 'score-rhythm-row';

  /**
   * The tempo ladder on a loop (`04` §5, `05` §6).
   *
   * The loop already repeats the hard bars; this is what turns repetition into
   * practice — a clean pass earns a rung, a pass with a mistake in it gives one
   * back, and the learner never has to take a hand off the keys to move the
   * slider. `nextLadderTempo` is the whole rule and it is pure; this button
   * only says whether it is being asked.
   */
  const ladderToggle = button(
    'Off',
    () => {
      ladderOn = !ladderOn;
      // From here, not from the written tempo: the ladder starts where the
      // learner already is (`05` §6).
      if (ladderOn) ladderCeilingPct = tempoPct;
      render();
    },
    'score-ladder',
  );
  const ladderRow = menuRow(
    'Ladder',
    'Each clean pass of the loop speeds up a notch; a pass with a mistake in it slows down one.',
    ladderToggle,
  );
  ladderRow.id = 'score-ladder-row';

  /**
   * The duet, where the choice is made (`04` §5).
   *
   * The app has played the other hand under the learner since P6, and nobody
   * could find it: it lives in Settings, three screens from the R/L buttons
   * that decide which hand it means. No new state and no new setting — this is
   * `playbackHands`, bound a second time where the question is actually asked,
   * and the row names the hand so the sentence answers itself.
   */
  const duetToggle = button(
    'Off',
    () => {
      const next: PlaybackHands = settings.playbackHands === 'none' ? duetWhenOn : 'none';
      if (next === 'none') duetWhenOn = settings.playbackHands;
      settings.playbackHands = next;
      updateSettings({ playbackHands: next });
      // The status line says which hand is played once per run; turning the
      // duet on mid-run should get that sentence, not silence.
      forgetPlayingHand();
      if (session?.running) startRun();
      render();
    },
    'score-duet',
  );
  const duetRow = menuRow(
    'Duet',
    'Turn it off to practise against silence.',
    duetToggle,
  );
  duetRow.id = 'score-duet-row';

  const barsDown = button('−', () => setBars(settings.barsPerWindow - 1), 'score-bars-down');
  barsDown.setAttribute('aria-label', 'One bar fewer in the window');
  const barsLabel = document.createElement('span');
  barsLabel.id = 'score-bars';
  barsLabel.className = 'score-bars';
  const barsUp = button('+', () => setBars(settings.barsPerWindow + 1), 'score-bars-up');
  barsUp.setAttribute('aria-label', 'One bar more in the window');

  /**
   * The stepper's own row, named so that it can say two things the stepper
   * cannot (T32, `04` section 5).
   *
   * **When the count is not the count drawn**, the row says so in words —
   * *4 asked, 2 shown: 4 would be too small here* — and the stepper stays
   * live, because the owner's order of the goods puts readability and the
   * look-ahead above the number and `00-invariants` section 1 forbids a
   * control that looks pressable and does nothing. Silently drawing a
   * different number is what T30 photographed 266 times.
   *
   * **In `Scroll` the row is gone**, not greyed: the whole sheet is drawn
   * there and a window has no meaning, so it was a live control over nothing
   * (`04` section 0 R4). The sentence that replaces it is on the Layout row.
   */
  const barsRow = menuRow(
    'Bars in window',
    'How much music is on the screen at once. Fewer bars means bigger notes. If the number you ask for would make the notes too small to read, the app shows fewer and says so.',
    barsDown,
    barsLabel,
    barsUp,
  );
  barsRow.id = 'score-bars-row';
  /** What the window is actually drawing, as the renderer last reported it. */
  let barsShown = settings.barsPerWindow;

  // The same glyphs as the bars stepper above, which is the point: two
  // steppers side by side in one sheet were drawn with three different
  // characters — `−` (minus) and `+` for bars, `－` and `＋` (the fullwidth
  // pair) for size — and at a glance the size row read as the smaller, lesser
  // control.
  const zoomOut = button('−', () => setZoom(settings.zoom - ZOOM_STEP), 'score-zoom-out');
  zoomOut.setAttribute('aria-label', 'Smaller notes');
  /**
   * How big the notes are now, as a percentage.
   *
   * The bars stepper says `2 bars` between its buttons and this one said
   * nothing at all, so the size control could be pressed twelve times without
   * ever saying where it had got to. That matters more here than for bars: the
   * owner's complaint is notes too big or too small, and "put it back how it
   * was" has no target without a number. It is also the only way the ends of
   * the range announce themselves — at 250 % the `+` goes dead, and a dead
   * button beside a number reads as a limit rather than as a fault.
   */
  const zoomLabel = document.createElement('span');
  zoomLabel.id = 'score-zoom-level';
  zoomLabel.className = 'score-bars';
  const zoomIn = button('+', () => setZoom(settings.zoom + ZOOM_STEP), 'score-zoom-in');
  zoomIn.setAttribute('aria-label', 'Bigger notes');

  /**
   * Layout as a two-way segment rather than a button that says the state it
   * is already in.
   *
   * `Window` on a button reads as "press to get a window", and it was the
   * label for *being* in one — so the one control on the screen with two
   * equal settings was the one you had to press to find out what it did.
   */
  const layoutGroup = document.createElement('div');
  layoutGroup.className = 'score-group';
  layoutGroup.dataset.tapGroup = '';
  layoutGroup.id = 'score-layout';
  const layoutWindow = button('Window', () => setLayout('window'), 'score-layout-window');
  const layoutScroll = button('Scroll', () => setLayout('scroll'), 'score-layout-scroll');
  layoutGroup.append(layoutWindow, layoutScroll);
  const layoutRow = menuRow(
    'Layout',
    'A screenful at a time, or one long sheet you scroll through. Bars in window applies to the Window layout.',
    layoutGroup,
  );
  layoutRow.id = 'score-layout-row';

  /**
   * Keys, ribbon or nothing (P21d A6).
   *
   * The ribbon is the strip's information at a third of the height, with the
   * wanted note's *name* over it — which is what the F♯4 evening was missing.
   * Which of the two he wants is his taste, so both are here to be tried.
   */
  const keysGroup = document.createElement('div');
  keysGroup.className = 'score-group';
  keysGroup.dataset.tapGroup = '';
  keysGroup.id = 'score-keys';
  const KEYS_CHOICES: { id: KeysView; label: string }[] = [
    { id: 'strip', label: 'Keys' },
    { id: 'ribbon', label: 'Ribbon' },
    { id: 'off', label: 'Off' },
  ];
  for (const choice of KEYS_CHOICES) {
    keysGroup.appendChild(
      button(
        choice.label,
        () => {
          settings.keys = choice.id;
          updateSettings({ keys: choice.id });
          mountKeys();
          render();
        },
        `score-keys-${choice.id}`,
      ),
    );
  }

  const destinationButton = button('🔈 Phone', () => cyclePlaybackDestination(), 'score-destination');

  // Blind and performance are *routes*, not toggles: the run has to be set up
  // that way from the start, and putting them in the hash means a blind run
  // survives a reload and can be linked to from a rung.
  const blindToggle = button(
    blind ? 'On' : 'Off',
    () => router.navigateScore(itemId, { ...tourRoute, blind: !blind, performance: performanceRun }),
    'score-blind',
  );
  blindToggle.setAttribute('aria-label', blind ? 'Show the score' : 'Hide the score');

  const performanceToggle = button(
    performanceRun ? 'On' : 'Off',
    () => router.navigateScore(itemId, { ...tourRoute, blind, performance: !performanceRun }),
    'score-performance',
  );
  performanceToggle.setAttribute(
    'aria-label',
    performanceRun ? 'Stop performing and go back to practising' : 'Play it as a performance',
  );

  const sectionRow = menuRow('Section', 'Jump to a named part of the piece.', sectionSelect);
  sectionRow.hidden = true;

  /**
   * The way into the chord chart (`04` §3b, built 2026-09-21).
   *
   * The chart screen had a route and no door: nothing in the app called
   * `router.navigateChart`, so a screen with a form tracker, a count-off and a
   * comping loop could be reached only by typing its URL. This is the door
   * from the piece itself — the place somebody looking at *Fly Me to the
   * Moon* would look for it — and the lesson page has the other one.
   *
   * Hidden until the piece is known to carry chord symbols, because a chart of
   * a piece with none is a screen of empty bars.
   */
  const chartButton = button('Open the chart', () => {
    // The rung rides on where this screen was opened from one, so the chart's
    // own Back reaches it rather than the Library (`04` §3b). Bare where there
    // is none, the way `openItem` calls `navigateScore`.
    if (fromRung === undefined) router.navigateChart(itemId);
    else router.navigateChart(itemId, { from: fromRung });
  }, 'score-chart');
  const chartRow = menuRow(
    'Chord chart',
    'The same piece as a lead sheet: one big chord symbol a bar, a form tracker and a count-off. For playing from the chords rather than reading the notes.',
    chartButton,
  );
  chartRow.hidden = true;

  menuStash.append(
    // A performance is one pass through. Offering a restart during one would
    // be offering to make it not a performance (replan §8).
    ...(performanceRun ? [] : [menuRow('Start again', 'Back to bar 1 without leaving this screen.', restart)]),
    menuRow('Input', 'What the app listens to while you play: the piano over its cable, the microphone, or nothing.', inputSelect),
    // Beside Input, because both answer the same question: what is being
    // judged. The Loop and the Ladder are the next pair, in that order.
    rhythmRow,
    sectionRow,
    chartRow,
    menuRow('Loop', 'Repeat a few bars over and over until they are yours. Double-tap the sheet to mark them.', loopButton),
    ladderRow,
    menuRow('Metronome', 'The click, on or off.', metronomeButton),
    barsRow,
    menuRow('Size', 'Bigger or smaller notes, around whatever already fits.', zoomOut, zoomLabel, zoomIn),
    layoutRow,
    menuRow('Keys', 'The keyboard under the score: the full strip, a thin ribbon that names the note, or nothing.', keysGroup),
    menuRow('Sound', 'Whether the phone or the piano plays the hand you are not practising.', destinationButton),
    // Under Sound, which is where it comes out, and next to the hand buttons'
    // consequence rather than three screens away in Settings.
    duetRow,
    menuRow('Blind', 'Hides the notation so you play from memory. The app still follows you and still marks what you play.', blindToggle),
    menuRow('Perform', 'One pass, start to finish: no restarts, no loop, and it is kept as a performance rather than practice.', performanceToggle),
  );

  // --- behaviour -----------------------------------------------------------

  function button(label: string, onClick: () => void, id: string): HTMLButtonElement {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'score-button';
    el.id = id;
    el.textContent = label;
    el.addEventListener('click', (event) => {
      event.stopPropagation();
      showBar();
      onClick();
    });
    return el;
  }

  function select(
    options: { value: string; label: string }[],
    id: string,
    label: string,
    onChange: (value: string) => void,
  ): HTMLSelectElement {
    const el = document.createElement('select');
    el.className = 'score-select';
    el.id = id;
    el.setAttribute('aria-label', label);
    for (const option of options) {
      const node = document.createElement('option');
      node.value = option.value;
      node.textContent = option.label;
      el.appendChild(node);
    }
    el.addEventListener('change', () => {
      showBar();
      onChange(el.value);
    });
    el.addEventListener('click', (event) => event.stopPropagation());
    return el;
  }

  function setBars(next: number): void {
    const wanted = Math.min(MAX_BARS_PER_WINDOW, Math.max(MIN_BARS_PER_WINDOW, Math.round(next)));
    // Already there, so there is nothing to do — and doing it anyway was not
    // free. The clamp means `−` at one bar produced one bar again, and the
    // lines below then wrote the setting, re-seated the renderer and, because
    // a re-engraving invalidates the run's judgements, **restarted the run**.
    // A tap that changes nothing threw away the pass you were in the middle
    // of. `setLayout` has always guarded this; these two never did.
    if (wanted === settings.barsPerWindow) return;
    settings.barsPerWindow = wanted;
    barsShown = wanted;
    updateSettings({ barsPerWindow: settings.barsPerWindow });
    renderer?.setBarsPerWindow(settings.barsPerWindow);
    // A re-engraving recreates every element the run's judgements are keyed
    // to, so the run restarts rather than continuing over a sheet that has
    // forgotten it (`08` §8.3).
    if (session?.running) startRun();
    render();
  }

  function setZoom(next: number): void {
    const wanted = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(next * 10) / 10));
    if (wanted === settings.zoom) return;
    settings.zoom = wanted;
    updateSettings({ zoom: settings.zoom });
    renderer?.setZoom(settings.zoom);
    render();
  }

  function setLayout(next: ScoreLayout): void {
    if (settings.layout === next) return;
    settings.layout = next;
    updateSettings({ layout: next });
    renderer?.setLayout(next);
    if (session?.running) startRun();
    render();
  }

  /**
   * One labelled row of the `⋯` sheet: the word on the left, the control on
   * the right. Every control in there gets a word — the bar was where a glyph
   * on its own had to do, and `🎵` alone is a guess.
   */
  function menuRow(label: string, hint: string, ...controls: HTMLElement[]): HTMLElement {
    const row = document.createElement('div');
    row.className = 'score-menu-row';
    const words = document.createElement('div');
    words.className = 'score-menu-row__words';
    const text = document.createElement('span');
    text.className = 'score-menu-row__label';
    text.textContent = label;
    words.append(text);
    if (hint) {
      const said = document.createElement('span');
      said.className = 'score-menu-row__hint';
      said.textContent = hint;
      words.append(said);
    }
    const holder = document.createElement('div');
    holder.className = 'score-menu-row__control';
    holder.append(...controls);
    row.append(words, holder);
    return row;
  }

  /**
   * Opens a sheet holding whatever is parked in `stash`, and parks it back
   * when the sheet goes.
   *
   * The rows are *moved*, not copied: they own their state and their ids.
   * `openSheet` closes on the Close button, on the backdrop and on Escape and
   * does not say which, so the restore watches for the sheet leaving the
   * document instead of hooking each of the three.
   */
  function openStashedSheet(heading: string, id: string, stash: HTMLElement): void {
    if (document.getElementById(id)) return;
    const sheet = openSheet(heading, { id });
    sheet.body.append(...Array.from(stash.children));
    render();
    const observer = new MutationObserver(() => {
      if (sheet.el.isConnected) return;
      observer.disconnect();
      stash.append(...Array.from(sheet.body.children));
    });
    observer.observe(document.body, { childList: true });
    openSheets.push(() => {
      observer.disconnect();
      stash.append(...Array.from(sheet.body.children));
      sheet.close();
    });
  }

  function setBpm(wanted: number): void {
    if (!Number.isFinite(wanted) || wanted <= 0) return;
    tempoPct = Math.min(130, Math.max(30, Math.round((wanted / writtenBpm()) * 100)));
    tempo.value = String(tempoPct);
    raiseLadderCeiling();
    if (session?.running) startRun();
    render();
  }

  /**
   * The ladder may climb back to wherever the learner has been, never past it.
   *
   * Called from the two places the learner sets a tempo by hand. Without it a
   * learner who dropped to 50 % for a hard bar and then asked for 110 % would
   * find the ladder quietly capping them at the written tempo, which is a
   * control overruling a person.
   */
  function raiseLadderCeiling(): void {
    ladderCeilingPct = Math.max(ladderCeilingPct, tempoPct);
  }

  function cyclePlaybackDestination(): void {
    const order = ['phone', 'piano', 'both'] as const;
    const index = order.indexOf(settings.playbackDestination);
    settings.playbackDestination = order[(index + 1) % order.length] ?? 'phone';
    updateSettings({ playbackDestination: settings.playbackDestination });
    render();
  }

  function writtenBpm(): number {
    if (!model) return 80;
    // At the cursor, so a tempo change written into the piece shows when it
    // arrives (`08` §10).
    const step = session?.state?.step ?? renderer?.stepIndex ?? 0;
    return bpmAt(model.tempoMap, model.steps[step]?.onset ?? 0);
  }

  function bpmNow(): number {
    return (writtenBpm() * tempoPct) / 100;
  }

  // --- input sources -------------------------------------------------------

  function detachInput(): void {
    while (unsubscribers.length > 0) unsubscribers.pop()?.();
    micSource.disconnect();
    micMeter.hidden = true;
  }

  /** Routes one input source into the session. Note events only — see §5. */
  function feedNote(event: InputNoteEvent): void {
    if (event.kind === 'noteOn') {
      if (session && !session.running) {
        startFromKey(event);
        return;
      }
      session?.feed(event.midi, event.velocity, event.tMs, event.confidence ?? 1);
    } else {
      session?.feedOff(event.midi, event.tMs);
    }
  }

  /**
   * The keyboard is the start button (T8): a key pressed with no run going
   * starts one, so nobody has to take a hand off the piano for a small ▶.
   *
   * With no count-in to play first — Wait, Free, or Tempo counted in from
   * nothing — the key is the run's first note and is played into it. With a
   * count-in it is the nod to the drummer: it starts the count and is not a
   * note of the piece, so it is not judged and cannot start the clock.
   *
   * Not after a run has finished, until ▶ or Space starts the next: people
   * carry on playing after the last bar, and that would restart the run under
   * them — with or without a summary on screen. Not from the microphone, which
   * hears the room. Not while `Hear it` is playing, nor under an open sheet.
   */
  /** A sheet (the ⋯ controls, the tempo) is open over the score. */
  function sheetOpen(): boolean {
    return document.querySelector('.sheet__panel[role="dialog"]') !== null;
  }

  function startFromKey(event: InputNoteEvent): void {
    if (!session || session.running || !sheet.hidden || hearing || sheetOpen()) return;
    if (endedSinceLastStart) return;
    if (input !== 'midi' && input !== 'keys') return;
    startRun();
    if (!session.running) return;
    // The key is the first note only where the learner plays first: Wait and
    // Free, or a Keep tempo run holding for them. When the app leads, the key
    // only starts it — played in, it was marked a wrong note before anything
    // had been played (T8 review 2).
    const learnerFirst = mode === 'wait' || mode === 'free' || session.armed;
    if ((session.prepared?.countInMs ?? 0) === 0 && learnerFirst) {
      session.feed(event.midi, event.velocity, event.tMs, event.confidence ?? 1);
    }
  }

  function attachInput(): void {
    detachInput();
    if (!session) return;
    if (input === 'midi') {
      unsubscribers.push(webMidiSource.onNote(feedNote));
      // The cable comes out mid-run: say so once; the keys on the screen
      // still feed the run (`08` §10).
      unsubscribers.push(
        webMidiSource.onStateChange((state) => {
          if (!state.connected && session?.running === true) {
            status.textContent = 'Piano disconnected — the keys on the screen still work';
          }
        }),
      );
      // Sustain is recorded for the pedal scorer and never blocks the run.
      unsubscribers.push(
        webMidiSource.onMessage((message) => {
          if (message.kind === 'cc' && message.cc === 64 && message.value !== undefined) {
            session?.feedSustain(message.value, message.tMs);
          }
        }),
      );
    } else if (input === 'keys') {
      unsubscribers.push(screenKeyboardSource.onNote(feedNote));
    } else if (input === 'mic') {
      micMeter.hidden = false;
      unsubscribers.push(micSource.onNote(feedNote));
      unsubscribers.push(
        micSource.onLevel((level) => {
          // peak is 0..1; the meter is a rough guide, and the useful signal is
          // "is it clipping" (docs/04 §5), which the fill colour says.
          micFill.style.width = `${Math.round(Math.min(1, level.peak) * 100)}%`;
          micFill.dataset.hot = String(level.peak > 0.98);
        }),
      );
      void micSource.connect().catch((cause: unknown) => {
        input = 'none';
        // A run already going was set up to hold for a first note the
        // microphone would have heard. With no input nothing can play it, so
        // it would hold for ever: start it again, following the clock, which
        // is what the line below promises (T8 review, M1).
        if (session?.running === true) startRun();
        status.textContent = `Microphone unavailable: ${String(cause)} — using the clock instead.`;
        render();
      });
    }
  }

  // --- run -----------------------------------------------------------------

  /**
   * `latch: false` for a restart that continues the practice rather than
   * beginning it — the ladder moving the tempo between passes. Anything else
   * that starts a run lets the session decide whether it waits for the
   * learner's first note (T8).
   */
  function startRun(options: { latch?: boolean; preview?: boolean } = {}): void {
    if (!session || !model) return;
    // A one-bar preview ends when its loop comes round, and until T31 that was
    // the *only* thing that ended it: clear the loop under it and the run goes
    // to the end of the piece instead, `onFinished` returns without ending the
    // preview, and `hearingBar` stays set for the rest of the visit -- every
    // later run a Listen run under a selector saying otherwise. Anything that
    // starts a run now gives the screen back what the preview borrowed first.
    if (hearingBar && options.preview !== true) endBarPreview();
    endedSinceLastStart = false;
    handRefused = false;
    awaySeconds = null;
    summaryUp(false);
    // A new run keeps its own totals, so the ladder's first pass is measured
    // from nought again.
    ladderPassBase = { missed: 0, wrong: 0 };
    const midi = getMidiSettings();
    // A performance is one pass through. Looping a section mid-performance is
    // practising, and the flag would then be recording something that did not
    // happen.
    // A section loop is in printed bars; a double-tapped one is in the model's
    // own measure index. They are different numbers and mixing them up would
    // loop the wrong bars on any piece with a repeat.
    // Printed bar numbers, whichever gesture set them (`08` invariant 24).
    // The double-tap used to hand its printed number to the index-based
    // builder, so double-tapping bar 3 looped bar 4.
    const loop = loopBars && !performanceRun ? session.loopForPrintedBars(loopBars.from, loopBars.to) : undefined;
    // A `Hear it` run — and a one-bar preview — is a Listen run that leaves
    // the select alone.
    const runMode: Mode = hearing || hearingBar ? 'listen' : mode;
    session.start({
      mode: runMode,
      hands,
      tempoPct,
      ...(loop ? { loop } : {}),
      strict: settings.waitStrict,
      toleranceMs: settings.toleranceMs,
      countInBars: settings.countInBars,
      inputLatencyMs: midi.inputLatencyMs,
      metronome: metronomeOn,
      metronomeSound: metronomeSoundFor(
        { micActive: input === 'mic', destination: settings.playbackDestination },
        settings.metronomeSound,
      ),
      metronomeVolume: midi.metronomeVolume,
      ...(rhythmRunFor(runMode) ? { rhythmOnly: true } : {}),
      // The score's own swing marking, measured from the file by the build
      // and read here since 2026-09-21. Not from the genre, not from the
      // title: `00` §1a. With it on, an off-beat eighth is judged where a
      // shuffle puts it rather than where it is written.
      ...(item?.notation?.swungMark === true ? { swing: true } : {}),
      playbackHands: runMode === 'listen' ? 'both' : settings.playbackHands,
      // No input, no first note: a run following nothing must keep time by
      // the clock, which is the whole point of Tempo without a piano.
      ...(input === 'none' ? { latchStart: false } : {}),
      ...(options.latch === false ? { holdAtStart: false } : {}),
      ...(input === 'mic'
        ? {
            micChordLeniency: true,
            micChordFraction: settings.micChordLeniencyPct / 100,
            accuracyEstimated: true,
            ...(settings.strictMicScoring ? { wrongNoteConfidence: 0.8 } : {}),
          }
        : {}),
    });
    // Nothing to wait for: the hand chosen has no notes in this piece, and a
    // Wait run would sit on its first step for ever (the random walk found
    // it, with L on a right-hand song).
    // Anything in the run, not at the cursor: a Tempo run starts on the run's
    // first step, and when the other hand opens the piece that step is empty
    // for the learner (T8 review, H1).
    if ((runMode === 'wait' || runMode === 'tempo') && !session.learnerHasNotes) {
      session.stop();
      handRefused = true;
      status.textContent =
        hands === 'both'
          ? 'Nothing to play in this piece'
          : `Nothing for the ${hands === 'L' ? 'left' : 'right'} hand in this piece — choose ${hands === 'L' ? 'R' : 'L'} or Both`;
      render();
      return;
    }
    sayWhatThisRunIs(runMode);
    // **After the refusal above, and it has to stay there.** `attachInput`
    // detaches the old source and subscribes a new one, and `WebMidiSource`
    // dispatches a note with `for (const l of this.noteListeners) l(e)` over a
    // live `Set` — so deleting the listener and adding it back *from inside
    // that dispatch* makes the iterator visit it a second time. It reaches
    // here from `startFromKey`, which is that dispatch, and terminates only
    // because a started run turns `session.running` true and the second visit
    // then feeds the note instead of starting another run. Moved above the
    // refusal, a start that cannot produce a run loops for ever: measured on
    // `score.fuzz` seed 2, which went from 24 s to the spec's whole 240 s
    // budget with the page unable to answer a `page.evaluate` (T31).
    attachInput();
    void requestWakeLock();
    // Starting a run is what arms the auto-hide.
    showBar(CONTROL_BAR_START_HIDE_MS);
    render();
  }

  /**
   * Whether *this* run judges the rhythm alone (`04` §5, `05` §3a).
   *
   * Three refusals, each for its own reason. Keep tempo is the only mode with
   * a timetable, so it is the only one where ignoring the pitches leaves
   * anything to judge. A **blind** run is "play it from memory", and a
   * memorised rhythm is not the claim it makes. A **performance** is the piece,
   * played through, for somebody. Both of those are settled by the route
   * rather than by a toggle, so the toggle does not get a say.
   */
  function rhythmRunFor(runMode: Mode): boolean {
    return rhythmOnly && runMode === 'tempo' && !blind && !performanceRun;
  }

  /**
   * Whether the Ladder has anything to act on: a loop, in the mode with a
   * tempo to move. A performance neither loops nor repeats.
   */
  function ladderApplies(): boolean {
    return mode === 'tempo' && loopBars !== null && !performanceRun;
  }

  /**
   * `?ladder=1`: the whole item becomes the loop and the ladder climbs it.
   *
   * The blocker looked circular — the ladder needs a loop, and clearing the
   * loop switches it off — and **the circle only exists for repertoire**. A
   * whole-piece loop is absurd on a prelude and is what a scale, an arpeggio,
   * a Hanon number and an octave study already are, which is why `04` §3d
   * permits the tool on those rungs and nowhere else. Two things on screen then
   * say what is happening: the Loop control names the bars and the Ladder row
   * shows the toggle pressed. That is the state `05` §6 wants, and the fault it
   * records is the other one — a ladder on with *nothing having asked*.
   *
   * So it **fails closed** three ways rather than turning on and hoping, and
   * each one leaves the screen exactly as it would have opened:
   *
   * - a hash that named a mode other than Tempo gets nothing. The ladder moves
   *   a clock and the others have none, so where the hash named no mode this
   *   brings Tempo with it — but only once there is a loop to climb, so a
   *   refusal below does not leave the learner in a mode they did not ask for;
   * - a performance gets nothing, being one pass by definition;
   * - a whole-item range the piece cannot loop gets nothing — not the loop,
   *   not the mode and not the ladder.
   *
   * `?loop=` beats it where both are given: bars somebody named are a stronger
   * statement about what to repeat than "all of it", and the ladder then climbs
   * those. Clearing the loop still switches the ladder off — the route gets no
   * exception from `05` §6's rule, because the exception is the fault.
   */
  function applyRouteLadder(loaded: ScoreModel): void {
    if (!routeLadder || performanceRun || !session) return;
    if (routeMode !== undefined && routeMode !== 'tempo') return;
    if (loopBars === null) {
      if (!session.loopForPrintedBars(1, loaded.sourceMeasureCount)) return;
      loopBars = { from: 1, to: loaded.sourceMeasureCount };
      loopSection = null;
    }
    mode = 'tempo';
    // The Ladder row's own condition and nothing else, so the toggle can never
    // be on underneath a row that is not drawn — which is the whole of `05` §6.
    if (!ladderApplies()) return;
    ladderOn = true;
    // From where the learner is, exactly as the toggle does (`05` §6).
    ladderCeilingPct = tempoPct;
  }

  /**
   * One pass of the loop has ended; the ladder decides the next one (`05` §6).
   *
   * Clean means nothing missed *and* nothing wrong **in this pass**: a bar
   * played at the right moments with the wrong notes in it is not a pass of
   * that bar, and the ladder is the one control that acts without being asked
   * each time, so it has to read the stricter of the two. The engine's totals
   * run for the whole run, which is why the comparison is against
   * `ladderPassBase` rather than against nought.
   *
   * The restart is deferred by a microtask. The engine emits this finish from
   * the middle of `completeLap`, and it still has the new lap's clock to rebase
   * afterwards; tearing it down from inside its own event would leave the next
   * run's cursor set from a dead engine. A microtask runs as soon as the frame
   * that emitted it is done, which is before the next one paints.
   */
  function climbLadder(score: SessionScore): void {
    // Not during a demonstration: `Hear it` judges nothing, so every lap of one
    // is trivially clean and the ladder would climb on playing nobody did.
    if (!ladderOn || hearing || !ladderApplies()) return;
    const clean =
      score.missedTotal === ladderPassBase.missed && score.wrongNotesTotal === ladderPassBase.wrong;
    ladderPassBase = { missed: score.missedTotal, wrong: score.wrongNotesTotal };
    const next = nextLadderTempo({
      enabled: true,
      tempoPct,
      startedAtPct: ladderCeilingPct,
      clean,
    });
    const verdict = clean ? 'Clean' : 'A mistake';
    status.textContent =
      next === tempoPct
        ? `${verdict} — staying at ${String(tempoPct)} %`
        : `${verdict} — ${clean ? 'up' : 'down'} to ${String(next)} %`;
    // Nothing to re-time, so the lap the engine has already begun is left to
    // run: a restart here would cost a count-in and buy an identical pass.
    if (next === tempoPct) {
      render();
      return;
    }
    tempoPct = next;
    tempo.value = String(tempoPct);
    // The practice carries on at the new tempo: no holding for a first note
    // between passes (T8), or every rung of the ladder would stop and wait.
    queueMicrotask(() => {
      if (session?.running === true) startRun({ latch: false });
    });
    render();
  }

  /**
   * Which hand the app is about to play under the learner, or nothing.
   *
   * Only when there is another hand to play: with `Both` chosen nothing is
   * played under you, and in a Listen or `Hear it` run the whole point is
   * that the app is playing, which the button already said.
   */
  function handPlayedFor(runMode: Mode): 'left' | 'right' | null {
    if (runMode === 'listen' || runMode === 'free') return null;
    if (hands === 'both') return null;
    if (settings.playbackHands !== 'non-focused') return null;
    // Only when that hand has notes: "playing the left hand for you" over a
    // right-hand tune is a sentence about nothing.
    if (model?.handsPresent[hands === 'R' ? 'L' : 'R'] !== true) return null;
    return hands === 'R' ? 'left' : 'right';
  }

  /**
   * Says, once per run, what is different about this run.
   *
   * Two things can be, and both are the same class of thing: something the
   * screen is doing that the learner did not ask for *on this screen, now*.
   * The app playing the other hand is a sound arriving from nowhere (P21c B3).
   * A **rhythm-only** run is the other one, and it was silent — the mode
   * selector on the bar reads *Keep tempo*, which is exactly what the run is
   * not, and `rhythmOnly` is a remembered setting (§5), so somebody who chose
   * it a week ago met it again with nothing in front of them saying so until
   * the summary. Two searches on 2026-09-22 found the state on the section
   * element, the row inside the `⋯` sheet and the summary's heading, and
   * nothing on the screen while the run was going (`pending-review` Entry 38,
   * FAULT 7).
   *
   * One line, because there is one status line: where both apply they are
   * joined rather than one overwriting the other, and each is said once so a
   * ladder restarting the run between passes does not repeat them.
   */
  function sayWhatThisRunIs(runMode: Mode): void {
    const parts: string[] = [];
    if (!saidRhythmRun && rhythmRunFor(runMode)) {
      // The learner's terms, and the same words the `⋯` row's hint opens
      // with, because it is the same setting said in the place it now acts.
      parts.push('Rhythm only — tap the rhythm on any key');
      saidRhythmRun = true;
    }
    const other = saidPlayingHand ? null : handPlayedFor(runMode);
    if (other !== null) {
      parts.push(`Playing the ${other} hand for you`);
      saidPlayingHand = true;
    }
    if (parts.length > 0) status.textContent = parts.join(' · ');
  }

  /** `Hear it`: start a Listen run, or stop the one this button started. */
  function toggleHear(): void {
    if (!session) return;
    // `Hear it` stops the session outright, and a stop is not a finish the
    // screen hears back, so a preview left running under it would never end.
    if (hearingBar) endBarPreview();
    if (hearing) {
      session.stop();
      hearing = false;
      clearBeat();
      render();
      return;
    }
    // During a run: the run ends and the demonstration begins (`08` §7.1).
    // It used to only stop the run, which is not what the tap asked for.
    if (session.running) session.stop();
    hearing = true;
    startRun();
  }

  /**
   * One beat: the count-in if we are still in it, and the dot either way.
   *
   * Restarting the animation needs the class off, a reflow, and the class on
   * again — re-adding a class the element already has does nothing.
   */
  function onBeat(tick: { beat: number; bar: number; isCountIn: boolean }): void {
    // The run's own mode, not the selector's: `Hear it` and the one-bar
    // preview are Listen runs under a selector that still says Wait, and the
    // dot is the one thing that must be visible while a clock runs (`08` 5.3).
    const runMode = session?.mode;
    const clocked = runMode === 'tempo' || runMode === 'listen';
    // From the run, not the piece's first bar: the engine already counts the
    // meter at the bar the run starts from, so a loop in a different meter is
    // counted in correctly (`08` §11.2), and the dots must agree with it.
    const beatsPerBar = Math.max(
      1,
      Math.round(session?.prepared?.options.beatsPerBar ?? model?.timeSigMap[0]?.beats ?? 4),
    );
    if (tick.isCountIn) {
      countIn.hidden = false;
      countIn.replaceChildren(
        ...Array.from({ length: beatsPerBar }, (_, i) => {
          const dot = document.createElement('span');
          dot.className = 'score-countin__beat';
          dot.textContent = String(i + 1);
          dot.classList.toggle('is-now', i + 1 === tick.beat);
          return dot;
        }),
      );
    } else {
      countIn.hidden = true;
      countIn.replaceChildren();
    }

    beatDot.hidden = !clocked;
    if (!clocked) return;
    beatDot.classList.remove('is-beat', 'is-downbeat');
    void beatDot.offsetWidth;
    beatDot.classList.add(tick.beat === 1 ? 'is-downbeat' : 'is-beat');
  }

  /** Nothing is counting any more. */
  function clearBeat(): void {
    countIn.hidden = true;
    countIn.replaceChildren();
    beatDot.hidden = true;
    beatDot.classList.remove('is-beat', 'is-downbeat');
  }

  function togglePlay(): void {
    if (!session) return;
    // Pressing Play during a `Hear it` run is asking for the run you chose,
    // not for the demonstration to carry on.
    if (hearing) {
      session.stop();
      hearing = false;
    }
    if (!session.running) startRun();
    else if (session.state?.paused === true) {
      awaySeconds = null;
      session.resume();
    } else session.pause();
    render();
  }

  /** Choosing a different hand makes the sentence worth saying again. */
  function forgetPlayingHand(): void {
    saidPlayingHand = false;
  }

  function clearLoop(): void {
    // Including a half-set one: *Loop start: bar 3. Double-tap the last bar.*
    // is an instruction about a loop that no longer exists (T31).
    if (loopAnchor !== null) status.textContent = '';
    loopBars = null;
    loopAnchor = null;
    loopSection = null;
    // The ladder is a property of the loop (`05` §6), and it goes with it.
    // Left on, the row disappeared from the sheet with the toggle still
    // pressed underneath, and the next loop set a week later started moving
    // the tempo by itself with nothing on screen having asked.
    ladderOn = false;
    const control = document.getElementById('score-section');
    if (control instanceof HTMLSelectElement) control.value = '';
    if (session?.running) startRun();
    render();
  }

  // --- gestures (docs/04 §5) ----------------------------------------------

  stage.addEventListener('click', (event) => {
    // Folded, a tap always brings it back — before any mode or layout decides
    // it has something else to do with the tap.
    //
    // Free play returned here without unfolding, and Scroll while stopped used
    // the tap to step. Both fold on their own during a run, once the ink
    // reaches the bar (`startRun` arms the timer whatever the mode is), so the
    // chrome could fold and the tap that is supposed to undo it did nothing.
    // It was recoverable only by tabbing to the invisible bar, which is a bug
    // of its own and is being closed in the same change — so without this the
    // fix for that one would have turned a nuisance into a dead end.
    if (section.dataset.chrome === 'folded') {
      showBar();
      return;
    }
    if (mode === 'free') return;
    // Manual tap-to-advance in Scroll layout: right half forward, left back.
    if (settings.layout === 'scroll' && !session?.running) {
      const forward = event.clientX > stage.getBoundingClientRect().width / 2;
      const step = (renderer?.stepIndex ?? 0) + (forward ? 1 : -1);
      renderer?.showStep(Math.max(0, step));
      return;
    }
    toggleBar();
  });

  /**
   * Long-press a bar to hear it (P21c B4, `04` §5).
   *
   * 400 ms, and cancelled by moving — a drag is a scroll, not a request.
   * A tap that has become a press must not also toggle the control bar, so
   * the click that follows it is swallowed.
   */
  stage.addEventListener('pointerdown', (event) => {
    cancelPress();
    const target = event.target;
    pressFrom = { x: event.clientX, y: event.clientY };
    pressHold = window.setTimeout(() => {
      pressHold = null;
      // Not during a run: demonstrating a bar would end the run, and the
      // engine keeps no state to resume it from (`08` §7.3). Stop first.
      if (session?.running === true) return;
      const measure = measureAt(target);
      if (measure !== null) hearBar(measure);
    }, 400);
  });

  // A drag is a scroll and cancels the press; a wobble is a finger and does
  // not. Without the threshold nothing was ever a long press at all — a
  // `pointermove` arrives immediately after `pointerdown`, before anything has
  // actually moved.
  stage.addEventListener('pointermove', (event) => {
    if (pressHold === null || !pressFrom) return;
    const moved = Math.hypot(event.clientX - pressFrom.x, event.clientY - pressFrom.y);
    if (moved > 12) cancelPress();
  });

  for (const kind of ['pointerup', 'pointercancel'] as const) {
    stage.addEventListener(kind, () => cancelPress());
  }

  function cancelPress(): void {
    if (pressHold !== null) window.clearTimeout(pressHold);
    pressHold = null;
    pressFrom = null;
  }

  /** Plays one bar, both hands, once, and puts the run back afterwards. */
  function hearBar(measure: number): void {
    if (!session || !model || hearingBar) return;
    const loop = session.loopForPrintedBars(measure, measure);
    if (!loop) return;
    hearingBar = { mode, loop: loopBars, bar: measure };
    loopBars = { from: measure, to: measure };
    loopSection = null;
    status.textContent = `Bar ${String(shownBar(measure))}, as written`;
    startRun({ preview: true });
  }

  /** The bar has been played once; give the screen back what it had. */
  function endBarPreview(): void {
    const was = hearingBar;
    if (!was) return;
    // A preview is a finish too: a learner who hears a bar and then plays it
    // must not start a whole run by doing so (T8 review 2, L9).
    endedSinceLastStart = true;
    // Stopped while the flag is still set, because stopping is itself a finish
    // and it arrives back through `onFinished`. Cleared first, that finish
    // looked like the end of an ordinary run and opened the summary sheet over
    // a bar nobody had played.
    session?.stop();
    hearingBar = null;
    // Only where the preview's own single bar is still the loop: something may
    // have cleared or replaced it while the bar was playing, and putting the
    // old one back over that would undo what the learner had just done.
    if (loopBars !== null && loopBars.from === was.bar && loopBars.to === was.bar) {
      loopBars = was.loop;
    }
    clearBeat();
    status.textContent = '';
    render();
  }

  stage.addEventListener('dblclick', (event) => {
    const measure = measureAt(event.target);
    if (measure === null) return;
    if (loopAnchor === null) {
      loopAnchor = measure;
      status.textContent = `Loop start: bar ${String(shownBar(measure))}. Double-tap the last bar.`;
    } else {
      loopBars = { from: Math.min(loopAnchor, measure), to: Math.max(loopAnchor, measure) };
      loopAnchor = null;
      loopSection = null;
      // The instruction has been carried out, so it stops being an
      // instruction. Nothing cleared it, and a sentence saying *Double-tap the
      // last bar* stayed on the header beside a Loop control already reading
      // `Bars 3–6` — and then stayed there through the rest of the sitting,
      // over a cleared loop, a mode change and a pause (T31, measured).
      status.textContent = '';
      if (session?.running) startRun();
    }
    render();
  });

  /**
   * Fills the side panel with the lesson text this piece belongs to.
   *
   * The first lesson that lists the piece as an option — a piece is usually an
   * option of one rung, and where it is an option of several the first is the
   * one the ladder reaches first. Failure is silent and leaves the panel out:
   * a score screen must open with or without its prose.
   */
  async function findRung(id: string): Promise<void> {
    try {
      rung = lessonForItem(await loadCurriculum(), id);
    } catch {
      // Judged against the learner's settings instead; see `rung`'s comment.
    }
  }

  async function fillSidePanel(target: CatalogItem): Promise<void> {
    const body = document.getElementById('score-side-body');
    if (!body) return;
    try {
      const curriculum = await loadCurriculum();
      const found = lessonForItem(curriculum, target.id);
      if (!found) return;
      const summary = document.getElementById('score-side-summary');
      // The rung's title alone. This is the heading over its text beside the
      // score, where the id said nothing and cost the words their room.
      if (summary) summary.textContent = found.title;
      const response = await fetch(contentUrl(found.textFile));
      if (!response.ok) throw new Error(String(response.status));
      const { body: markdown } = parseFrontMatter(await response.text());
      sidePanel.hidden = false;
      section.dataset.side = 'text';
      body.replaceChildren(renderMarkdown(markdown));
    } catch {
      sidePanel.hidden = true;
    }
  }

  /**
   * Which printed bar the pointer is over, as a **1-based** bar number.
   *
   * The units matter and were wrong. `loopFromPrintedBars` takes bar numbers
   * as printed — it looks for `sourceMeasureIndex === fromBar - 1` — while the
   * fallback here returned `currentWindow.fromMeasure`, which is a 0-based
   * index. Nothing in the DOM carries `data-measure` today, so the fallback is
   * the only path there is, and every loop it produced asked for bar −1 and
   * got nothing: double-tap-to-loop has been quietly doing nothing at all, and
   * long-pressing a bar to hear it (B4) found the same wall.
   *
   * The named attribute keeps whatever it says; the fallback now converts.
   */
  function measureAt(target: EventTarget | null): number | null {
    if (!(target instanceof Element)) return null;
    const holder = target.closest('[data-measure]');
    const raw = holder instanceof HTMLElement ? holder.dataset.measure : undefined;
    const value = Number(raw);
    if (Number.isFinite(value)) return value;
    const from = renderer?.currentWindow?.fromMeasure;
    return from === undefined ? null : from + 1;
  }

  let hideTimer: number | null = null;

  /**
   * Shows the control bar, and hides it again three seconds later — but only
   * while a run is going.
   *
   * `04` §5 says the bar auto-hides after 3 s. It means *while you are
   * playing*, which is when the notation needs the room. Hiding it while the
   * learner is still choosing a mode and a tempo makes every control a
   * two-tap affair, and hidden controls are `pointer-events: none`, so the
   * taps land on the score instead.
   */
  /**
   * Tells the stage how much room the bar is taking.
   *
   * Measured, not assumed: the bar wraps to two rows on a narrow screen, and
   * a constant would be wrong on exactly the screen where the notation cannot
   * spare the pixels.
   */
  function measureBar(): void {
    const height = bar.dataset.visible === 'true' ? bar.getBoundingClientRect().height : 0;
    section.style.setProperty('--score-bar-h', `${String(Math.round(height))}px`);
  }

  /**
   * The fade has no condition on it any more.
   *
   * It used to ask `barCostsMusicRoom()` first — is the music actually reaching
   * the bar's row — and stay put when the answer was no, on the reasoning that
   * hiding controls buys nothing over an empty third of the stage and costs a
   * hunt for them. The owner's instruction, after looking at it on the phone:
   * just always fade it. Judging "is it covering anything" from inside the app
   * kept getting the answer wrong, and a rule whose exception nobody can
   * predict is worse than a rule. One tap on the sheet brings it back, always
   * (`08` §9.34), which is what makes it safe to be unconditional.
   *
   * The measurement that used to gate it is not lost: `08` §13 records it —
   * sideways, Hot Cross Buns' music stops 67 px above the stage's bottom, which
   * is why the bar used to stay there and nowhere else.
   */

  /**
   * The chrome folds away as one: the bar, and upright the header row with
   * it — the stage takes both rows, and `bar 4 / 8` moves to the stage's
   * corner. Back is a tap on the sheet, or the tab at the foot of it.
   */
  function foldChrome(folded: boolean): void {
    bar.dataset.visible = String(!folded);
    section.dataset.chrome = folded ? 'folded' : 'open';
    // Gone, not merely invisible (`08` §9.20).
    //
    // The rule was `opacity: 0; pointer-events: none`, which stops a finger
    // and stops nothing else: every control kept its tab stop and its
    // accessible name, and because the shared button wrapper calls `showBar()`
    // before running a handler, Tab and then Enter into a bar nobody can see
    // unfolded the chrome *and* fired the button. `inert` takes the whole
    // subtree out of the tab order and out of the accessibility tree, which is
    // what "hidden" is supposed to mean here.
    bar.inert = folded;
    requestAnimationFrame(measureBar);
  }
  function showBar(hideAfterMs = CONTROL_BAR_HIDE_MS): void {
    foldChrome(false);
    if (hideTimer !== null) window.clearTimeout(hideTimer);
    if (session?.running !== true) return;
    hideTimer = window.setTimeout(() => {
      if (session?.running === true) foldChrome(true);
    }, hideAfterMs);
  }
  function toggleBar(): void {
    if (bar.dataset.visible === 'true') foldChrome(true);
    else showBar();
  }

  // --- wake lock and orientation (docs/01 §8) ------------------------------

  async function requestWakeLock(): Promise<void> {
    if (!settings.keepScreenAwake) return;
    try {
      wakeLock = (await navigator.wakeLock?.request('screen')) ?? null;
    } catch {
      // Denied, or unsupported on desktop. Not worth telling the learner.
    }
    if (settings.landscapeLock) {
      try {
        await screen.orientation?.lock?.('landscape');
      } catch {
        // Only works in an installed PWA; docs/01 §8 says to ignore failures.
      }
    }
  }

  function releaseWakeLock(): void {
    void wakeLock?.release().catch(() => {});
    wakeLock = null;
    try {
      screen.orientation?.unlock?.();
    } catch {
      /* as above */
    }
  }

  // --- summary sheet (docs/04 §5) -----------------------------------------

  function showSummary(score: SessionScore): void {
    // The run ended and the learner is being shown the result, so there is
    // nothing hanging to come back to — unless this summary is the one
    // `dispose` causes on the way out, which is the run being *left* and is
    // the case the offer exists for.
    if (itemId !== undefined && !leaving) forgetUnfinished(itemId);
    // A demonstration that has finished is over, whatever else happens next.
    hearing = false;
    clearBeat();
    // "Playing the left hand for you" must not stand over a finished run
    // (`08` §6.3).
    status.textContent = '';
    sheet.replaceChildren();
    /**
     * A rhythm run is not a run of the piece (`05` §3a).
     *
     * Read off the score rather than off the screen's own toggle, because the
     * score is what gets recorded and the toggle can have been moved since the
     * run started. The accuracy still stands — it is a true measurement of how
     * much of the piece the learner was in time for — and pass and mastery do
     * not: those are claims about playing the notes, and the notes were not
     * judged. Refused here, in one place, rather than by leaving the numbers
     * out of the history, because the practice is real and the minutes count.
     */
    const rhythmRun = score.rhythmOnly === true;
    // The rung's own pass, where this piece is on one (`02` Part G, built
    // 2026-09-21). `masteryCriteriaFor` falls back to exactly this pair for a
    // piece on no rung and for a rung that states no number of its own, so
    // the Settings pair still decides every run the curriculum is silent
    // about.
    const criteria = masteryCriteriaFor(rung, {
      passAccuracy: settings.passAccuracyPct / 100,
      passTempoPct: settings.passTempoPct,
      masterAccuracy: 0.97,
      masterTempoPct: 100,
    });
    const measured = evaluateOutcome(score, criteria);
    /**
     * The number this exercise is actually about (P12a, wired 2026-09-21).
     *
     * `articulationScore`, `voicingScore` and `shapingScore` were written and
     * had no caller, so a staccato study was judged on which notes were
     * played and not on how long they were held — the one thing it exists to
     * teach. Read off the item's own `drill` block, which is where the
     * generator wrote the target when it wrote the notes.
     *
     * A rhythm run measures none of them: it judges timing and not pitch, so
     * there is no chord to balance and no line to shape.
     */
    const technique = rhythmRun
      ? null
      : techniqueMeasureFor(
          item?.drill,
          score,
          session?.prepared?.steps ?? [],
          // The same share the notes are judged by, so "enough of them" means
          // one thing on this sheet rather than two.
          criteria.passAccuracy,
        );
    /**
     * Whether missing it can stop the pass.
     *
     * Only where the rung says so in `mastery.custom`, and none of the four
     * technique rungs does. So the measure is shown and the pass is decided
     * the way it always was — which is what those lessons now say, rather
     * than the app quietly raising the bar under them.
     */
    const techniqueBinds =
      technique !== null && demandsTechniqueMeasure(rung?.mastery.custom, technique.kind);
    const outcome = rhythmRun
      ? { ...measured, passed: false, masterEligible: false }
      : techniqueBinds && !technique.met
        ? { ...measured, passed: false, masterEligible: false }
        : measured;

    // Recorded before the sheet is drawn, and not awaited: the numbers are
    // already final, and a slow write should not delay the learner seeing
    // them. A failed write is reported on the sheet rather than swallowed —
    // practice history is the one thing here that cannot be regenerated.
    // docs/05 §7: a sight-reading drill is scored on the first attempt only.
    // After that the material has been seen, and a second run measures
    // something else entirely.
    const sightReadRepeat = item !== undefined && isSightReading(item) && sightReadAttempts > 0;
    if (sightReadRepeat) {
      status.textContent = 'Sight-reading counts on the first attempt only — this run is not recorded.';
    }
    if (item !== undefined) sightReadAttempts += 1;

    if (item && !sightReadRepeat && mode !== 'listen' && mode !== 'free') {
      void recordRun({
        itemId: item.id,
        // Which rung judged it. `SessionRow` has carried the field since the
        // store was written and nothing filled it from here, so a stored run
        // could not say which pair of numbers it had been held to.
        ...(rung === undefined ? {} : { lessonId: rung.id }),
        // The generated phrase's seed, so the store can tell Today's read
        // (the run carrying the day's seed, `04` §2) from any other run.
        ...(router.route.seed === undefined ? {} : { seed: router.route.seed }),
        mode,
        tempoPct: score.tempoPct,
        accuracy: score.accuracy,
        accuracyEstimated: score.accuracyEstimated,
        wrongNotes: score.wrongNotesTotal,
        missed: score.missedTotal,
        durationMs: score.durationMs,
        passed: outcome.passed,
        masterEligible: outcome.masterEligible,
        ...(performanceRun ? { performance: true } : {}),
        ...(rhythmRun ? { rhythmOnly: true } : {}),
      }).catch((cause: unknown) => {
        status.textContent = `Could not save this run: ${String(cause)}`;
      });
    }

    const title = document.createElement('h2');
    // Named for what it was, not for what it was not: "Run finished" over a
    // rhythm run reads as a piece that failed to pass.
    title.textContent = rhythmRun
      ? 'Rhythm run'
      : outcome.masterEligible
        ? 'Mastered'
        : outcome.passed
          ? 'Passed'
          : 'Run finished';
    sheet.appendChild(title);

    const lines = document.createElement('dl');
    lines.className = 'summary-stats';
    // Accuracy and Missed are facts about a run that played nothing: nought
    // right, everything missed, and the self-report below is what the sheet
    // offers instead of a number he did not earn.
    //
    // `Wrong notes` and `Timing` are not. Nought wrong notes out of nothing
    // played, and a mean lateness over no notes, are statistics with nothing
    // behind them — a dead control in a different coat (`04` §0 R4).
    //
    // Both counters, because the modes keep score differently: Wait counts
    // `correctSteps` and can finish a clean run with `hits` at nought, while
    // Tempo counts `hits` against the expected pitches (`engine/types.ts`).
    const heard = score.hits > 0 || score.correctSteps > 0 || score.wrongNotesTotal > 0;
    // First, so it is read before the accuracy it qualifies.
    if (rhythmRun) {
      addStat(lines, 'Judged', 'Rhythm only — the notes were not, so this does not count as playing the piece');
    }
    addStat(lines, 'Accuracy', `${Math.round(score.accuracy * 100)}%${score.accuracyEstimated === true ? ' (estimated)' : ''}`);
    addStat(lines, 'Tempo', `${Math.round(score.tempoPct)}% of written`);
    // Where the ladder got to. The Tempo line above is the tempo of the *last*
    // pass, which is the same number — said again, under its own name, because
    // "did the ladder go up or down over the session?" is the question the
    // learner switched it on to ask.
    //
    // On `ladderOn` alone, not on `ladderApplies()`: a looped run only ever
    // reaches a summary once the loop has been let go, and by then the test
    // for "is there a loop" is false while the tempo in front of the learner is
    // entirely the ladder's doing. The toggle cannot be reached without a loop
    // in the first place, so this cannot say "ended at" about a ladder that
    // never ran.
    if (ladderOn) addStat(lines, 'Ladder', `ended at ${String(tempoPct)} % of written`);
    if (heard) {
      addStat(lines, 'Wrong notes', String(score.wrongNotesTotal));
    }
    addStat(lines, 'Missed', String(score.missedTotal));
    // Beside the accuracy it is deliberately not part of, and said in words
    // rather than as a bare number: "82%" under "Legato" would be read as a
    // second accuracy, which is exactly the confusion these exist to avoid.
    if (technique) {
      addStat(
        lines,
        technique.label,
        techniqueBinds ? `${technique.text} — this rung requires it` : technique.text,
      );
    }
    // The accent, where the score prints one (T16 item 7). Only then: a piece
    // with no accent in it gains no row, which is what keeps this off a sheet
    // that `04` §0 R2 already measures on a 342 px phone. Never part of the
    // pass — nothing in `mastery.custom` names it, and a leaning that is a
    // little shy is not a wrong note.
    const accents = heard ? accentScore(score.notes, session?.prepared?.steps ?? []) : null;
    if (accents !== null && accents.judged > 0) {
      addStat(
        lines,
        'Accents',
        // "leaned on, against the rest of your playing" was read three times
        // before it parsed: the number is the share of the notes written with
        // an accent that were actually played louder than their neighbours.
        `${String(Math.round(accents.accuracy * 100))}% of the ${String(
          accents.judged,
        )} accented notes were played louder than the notes around them`,
      );
    }
    // The bars that went worst, by printed number, so the learner knows where
    // to look before choosing `Loop the weak bars` (`08` §6.2).
    const weakest = [...score.hotSpots]
      .filter((spot) => spot.misses + spot.wrongs > 0)
      .sort((a, b) => b.misses + b.wrongs - (a.misses + a.wrongs))
      .slice(0, 3)
      .map((spot) => printedBar(model?.steps.find((s) => s.measureIndex === spot.measureIndex)?.sourceMeasureIndex ?? spot.measureIndex));
    if (weakest.length > 0) addStat(lines, 'Weakest bars', [...new Set(weakest)].sort((a, b) => a - b).join(', '));
    if (score.timing && heard) {
      // "mean" is a statistician's word on a summary a learner reads after
      // playing (owner, 2026-09-22: the wording is "weird and unhelpful").
      addStat(
        lines,
        'Timing',
        `${Math.round(score.timing.meanMs)} ms off the beat on average, ${Math.round(score.timing.earlyPct)}% of them early`,
      );
    }
    sheet.appendChild(lines);

    const actions = document.createElement('div');
    actions.className = 'summary-actions';
    actions.append(
      button('Again', () => startRun(), 'summary-again'),
      button('Slower (−10%)', () => {
        tempoPct = Math.max(30, tempoPct - 10);
        tempo.value = String(tempoPct);
        startRun();
      }, 'summary-slower'),
      button('Faster (+10%)', () => {
        tempoPct = Math.min(130, tempoPct + 10);
        tempo.value = String(tempoPct);
        startRun();
      }, 'summary-faster'),
      // Only when there is something to loop. Offered unconditionally, its one
      // possible outcome on a clean run was the message "No weak bars to loop
      // — nothing went wrong", which is a button whose entire function is to
      // say it should not have been drawn. The gallery's `end-of-piece` cell
      // shows it under 100 % accuracy, zero wrong and zero missed. `weakest`
      // is the same set the `Weakest bars` stat is built from, so the button
      // appears exactly when the sheet has already named the bars it means.
      ...(weakest.length > 0
        ? [button('Loop the weak bars', () => loopWeakBars(score), 'summary-loop')]
        : []),
      button('Done', () => {
        summaryUp(false);
        leaveScore();
      }, 'summary-done'),
    );
    sheet.appendChild(actions);

    // Without a judging input there is nothing to be accurate *about*, so the
    // learner says how it went instead of being shown a number they did not earn.
    if (input === 'none' || mode === 'listen') {
      const ask = document.createElement('div');
      ask.className = 'summary-selfreport';
      ask.id = 'summary-selfreport';
      const label = document.createElement('p');
      label.textContent = 'How did it go?';
      ask.appendChild(label);
      for (const answer of ['Rough', 'OK', 'Clean']) {
        ask.appendChild(
          button(answer, () => {
            ask.dataset.answered = answer;
            status.textContent = `Recorded: ${answer}`;
          }, `summary-self-${answer.toLowerCase()}`),
        );
      }
      sheet.appendChild(ask);
    }
    summaryUp(true);
  }

  /**
   * Shows or hides the run's summary, and puts the screen behind it out of
   * reach while it is up.
   *
   * The sheet covers the control bar, the header and the strip — that is what a
   * sheet is — but covering something is not the same as disabling it, and
   * every control underneath stayed focusable and clickable through it. The
   * geometric sweep reported it as the summary's buttons overlapping the bar's
   * on 59 cells, which is the same shape of fault as the folded bar: a tap
   * landing on a control the owner cannot see. `inert` was the answer there and
   * it is the answer here.
   *
   * Only the summary. A count-in is also an overlay, and during one the bar has
   * to keep working — stopping a run that has started counting is exactly what
   * someone reaches for.
   */
  function summaryUp(open: boolean): void {
    sheet.hidden = !open;
    head.inert = open;
    bar.inert = open;
    stripHost.inert = open;
    stage.inert = open;
  }

  function addStat(list: HTMLElement, label: string, value: string): void {
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = value;
    // Addressable individually: "the summary contains 100%" is true of a run
    // at 100 % tempo whatever the accuracy was, which is not what anyone means.
    dd.dataset.stat = label.toLowerCase().replace(/[^a-z]+/g, '-');
    list.append(dt, dd);
  }

  /** docs/05 §6: build a loop from the bars with the most misses last run. */
  function loopWeakBars(score: SessionScore): void {
    const worst = [...score.hotSpots]
      .sort((a, b) => b.misses + b.wrongs - (a.misses + a.wrongs))
      .at(0);
    if (!worst || worst.misses + worst.wrongs === 0) {
      status.textContent = 'No weak bars to loop — nothing went wrong.';
      return;
    }
    // The hot spot is an unrolled measure; the loop is printed bars.
    const printed = (model?.steps.find((s) => s.measureIndex === worst.measureIndex)?.sourceMeasureIndex ?? worst.measureIndex) + 1;
    loopBars = { from: printed, to: Math.min(printed + 1, model?.sourceMeasureCount ?? printed + 1) };
    startRun();
  }

  // --- render --------------------------------------------------------------

  /**
   * Names the note being waited for, when the owner has asked for names.
   *
   * Wait mode only: in the clock-driven modes nothing is ever waited for, and
   * a line saying otherwise would be describing a different app.
   */
  function drawWaitingFor(): void {
    const named =
      getSettings().showNoteNames && mode === 'wait' && session?.running === true
        ? waitingForLine(session.expectedNow)
        : '';
    const wanted =
      pausedLine() ||
      (session?.armed === true ? firstNoteLine() : hearingLine() || named || readyLine());
    // Through the strip, which falls back to the mode's own standing line when
    // the run has nothing to say — so this line is never blank and the learner
    // is never left with a screen that says only the piece's name.
    helpStrip.setNow(wanted);
    waitingLine.hidden = false;
  }

  /**
   * A paused run says so, and says what to press (T31).
   *
   * Until this the state line went on holding the mode's **standing** line --
   * *Play the first note. Nothing moves until you do.* in Wait, *The count-in
   * clicks, then play along* in Keep tempo -- while `PracticeEngine.feed`
   * returned at `this.paused` and dropped every note played into it. The
   * screen was asking for the one thing it was ignoring, which is `00` 1's
   * dead control wearing words instead of pixels.
   *
   * It carries the away time when the pause was the page being hidden, so
   * `05` 4's sentence is said once, in the place the state line already is.
   */
  function pausedLine(): string {
    if (session?.paused !== true) return '';
    // A performance has no *Start again* row to name (`04` 5e).
    const carry = performanceRun
      ? '▶ to carry on.'
      : '▶ to carry on, or Start again in ⋯ to go back to the beginning.';
    return awaySeconds === null
      ? `Paused — ${carry}`
      : `Paused — you were away ${String(awaySeconds)} s. ${carry}`;
  }

  /**
   * A demonstration says it is one (T31).
   *
   * `Hear it` deliberately leaves the mode selector alone (`04` 5), and the
   * state line read the *selected* mode's standing sentence while the app was
   * playing the piece -- *Play the first note. Nothing moves until you do.*
   * over a run in which nothing the learner plays is looked at at all. The
   * one-bar preview is left to `#score-status`, which already names its bar.
   */
  function hearingLine(): string {
    if (!hearing || session?.running !== true) return '';
    return 'Playing it to you — nothing is judged. Hear it again to stop.';
  }

  /**
   * A run holding for the learner's first note says so (T8). Without it a
   * waiting run looks exactly like a frozen one — the state a control must
   * never be in unseen (`05` §6).
   */
  function firstNoteLine(): string {
    if (hands === 'R') return 'Your right hand starts — play its first note';
    if (hands === 'L') return 'Your left hand starts — play its first note';
    return 'Play your first note to start';
  }

  /**
   * With a piano connected, the keyboard is the start button (T8): said on
   * the ready screen, in the words that fit the count-in setting.
   *
   * MIDI only. The screen keys are on screen already, and the microphone does
   * not start runs at all. Kept to the one input where it matters because this
   * line's weight was a question put to the owner on the tour.
   */
  function readyLine(): string {
    if (!session || session.running || input !== 'midi' || !sheet.hidden || hearing) return '';
    if (endedSinceLastStart) return '';
    if (mode === 'listen') return '';
    const noCountIn = mode !== 'tempo' || settings.countInBars === 0;
    return noCountIn ? 'Play the first note to start' : 'Press any key to count in';
  }

  /** The loop's bars by source measure index, for the dimming (`08` §11.18). */
  function syncLoopDim(): void {
    if (!renderer || !model || !session || hearingBar) {
      renderer?.setLoopRange(null);
      return;
    }
    const loop = loopBars && !performanceRun ? session.loopForPrintedBars(loopBars.from, loopBars.to) : undefined;
    if (!loop) {
      renderer.setLoopRange(null);
      return;
    }
    const from = model.steps[loop.fromStep]?.sourceMeasureIndex;
    const to = model.steps[loop.toStep]?.sourceMeasureIndex;
    renderer.setLoopRange(from === undefined || to === undefined ? null : { from, to });
  }

  /**
   * The printed number of a source measure: from 1, or from 0 when the piece
   * opens with a pickup — the only measure that may be numbered 0 (`08` §10).
   * A pickup is a first measure shorter than the time signature says.
   */
  function printedBar(sourceMeasureIndex: number): number {
    if (!model) return sourceMeasureIndex + 1;
    const sig = model.timeSigMap[0];
    const barBeats = sig ? (sig.beats * 4) / sig.beatType : 4;
    let firstBarEnds = 0;
    for (const step of model.steps) {
      if (step.sourceMeasureIndex !== 0) break;
      for (const note of step.notes) firstBarEnds = Math.max(firstBarEnds, step.sourceOnset + note.duration);
    }
    const pickup = firstBarEnds > 0 && firstBarEnds < barBeats - 1e-6;
    return sourceMeasureIndex + (pickup ? 0 : 1);
  }

  /**
   * A loop's bar number, written the way the rest of the screen writes it.
   *
   * Loop ranges count from one, because `loopFromPrintedBars` matches
   * `sourceMeasureIndex === bar - 1` and everything that feeds it has to speak
   * that language. The header and the `Weakest bars` stat do not: they go
   * through `printedBar`, which follows the engraving convention and numbers an
   * incomplete first bar **0**.
   *
   * Both are right internally, and printing both was the fault. On a pickup
   * piece the header said `bar 0` while the loop control said `Bars 1–1` for
   * the very same bar, and the summary named the weakest bar 3 while `Loop the
   * weak bars` labelled itself 4. So the conversion happens at the edge: the
   * ranges keep counting from one, and every number written on the screen goes
   * through the one function that decides what a bar is called.
   */
  function shownBar(loopBarNumber: number): number {
    return printedBar(loopBarNumber - 1);
  }

  /**
   * `shownBar` the other way round: the loop number of the bar printed `bar`.
   *
   * Only the hash needs it (`?loop=1-2`, `04` §5c-1). Every other loop on this
   * screen is set by a finger on a bar the renderer already identified, so it
   * arrives counting from one and never has to be converted; a URL arrives in
   * the numbers the learner can read off the page. Without the conversion
   * `?loop=1-2` named the right bars on an ordinary piece and the bar before
   * each of them on a pickup piece — where bar 1 is printed 0, so the range
   * asked for `sourceMeasureIndex` -1 and looped nothing at all.
   */
  function loopBarForShown(bar: number): number {
    return bar + 1 - printedBar(0);
  }

  /** `bar 3 / 48`: the bar under the cursor and the piece's length. */
  function drawWhere(): void {
    if (!model || !renderer) {
      where.textContent = '';
      return;
    }
    const step = session?.state?.step ?? renderer.stepIndex;
    const bar = model.steps[step]?.sourceMeasureIndex;
    where.textContent =
      bar === undefined
        ? ''
        : `bar ${String(printedBar(bar))} / ${String(printedBar(model.sourceMeasureCount - 1))}`;
    // The status line wins the header: with both, the title was squeezed to
    // "Hot Cr…" (the gallery's blind cell). Sideways the mirror has room.
    where.hidden = status.textContent !== '' && window.innerHeight > window.innerWidth;
  }

  /** The words on one `⋯` row, when the row has something to say that changes. */
  function setRowLabel(row: HTMLElement, text: string): void {
    const label = row.querySelector('.score-menu-row__label');
    if (label) label.textContent = text;
  }

  /**
   * The three rows that come and go: Rhythm only, Ladder and Duet.
   *
   * Each is hidden when there is nothing for it to act on, which is `04` §0 R4
   * rather than tidiness — a Ladder with no loop, a Rhythm only in a mode with
   * no clock, and a Duet on a piece with one hand are all live controls over
   * nothing. The sheet is a two-column grid when the phone is sideways, so a
   * row that is not applicable has to be *gone* and not merely empty; `hidden`
   * is `display: none` app-wide, which is what takes it out of the grid.
   */
  function drawRunRows(): void {
    const rhythmAvailable = mode === 'tempo' && !blind && !performanceRun;
    rhythmRow.hidden = !rhythmAvailable;
    rhythmToggle.textContent = rhythmOnly ? 'On' : 'Off';
    rhythmToggle.classList.toggle('is-selected', rhythmOnly);
    rhythmToggle.setAttribute('aria-pressed', String(rhythmOnly));
    section.dataset.rhythm = String(rhythmAvailable && rhythmOnly);

    ladderRow.hidden = !ladderApplies();
    ladderToggle.textContent = ladderOn ? 'On' : 'Off';
    ladderToggle.classList.toggle('is-selected', ladderOn);
    ladderToggle.setAttribute('aria-pressed', String(ladderOn));
    // On the screen element, so "is the ladder climbing" can be asked without
    // opening the sheet — and so the bar's tempo label can say that a number
    // moving on its own is meant to (ScoreScreen.css).
    section.dataset.ladder = ladderOn && ladderApplies() ? 'on' : 'off';

    // The duet is the hand you are *not* practising, so with Both chosen there
    // is no such hand, and on a piece written for one hand there is no such
    // part. Either way the row would be promising something nothing can do.
    const other: 'R' | 'L' = hands === 'R' ? 'L' : 'R';
    const otherExists = hands !== 'both' && model?.handsPresent[other] === true;
    duetRow.hidden = !otherExists;
    if (otherExists) {
      const played =
        settings.playbackHands === 'both'
          ? 'both hands'
          : `the ${other === 'L' ? 'left' : 'right'} hand`;
      setRowLabel(duetRow, `Duet: the app plays ${played}`);
    }
    const duetOn = settings.playbackHands !== 'none';
    duetToggle.textContent = duetOn ? 'On' : 'Off';
    duetToggle.classList.toggle('is-selected', duetOn);
    duetToggle.setAttribute('aria-pressed', String(duetOn));
  }

  function render(): void {
    drawWaitingFor();
    // Holding for the first note (T8): the count is over, and its wash must
    // not stay over the notes the learner now has to read to start. Only a
    // beat outside the count-in cleared it before, and a run that is holding
    // sends none — so it sat there, frozen on the last number.
    if (session?.armed === true && !countIn.hidden) {
      countIn.hidden = true;
      countIn.replaceChildren();
    }
    drawWhere();
    syncLoopDim();
    // Belt and braces with the observer: every render is a moment the copy
    // in the bar must agree with the header.
    syncBarLeft();
    modeSelect.value = mode;
    inputSelect.value = input;
    tempo.value = String(tempoPct);
    // Not while it is being typed into: writing the rounded value back on
    // every render would fight the digits going in.
    if (document.activeElement !== bpmField) bpmField.value = String(Math.round(bpmNow()));
    // Below 400 px the percentage goes and the bpm stays: the bar has to be
    // one row (`04` §5), and the percentage is set in the sheet this label
    // opens, where it is written on the slider. The bpm is the number you
    // read while playing.
    tempoLabel.textContent =
      window.innerWidth < NARROW_BAR_PX
        ? `${String(Math.round(bpmNow()))} bpm`
        : `${String(tempoPct)}% · ${String(Math.round(bpmNow()))} bpm`;
    // After the label is written, because its width is part of what decides
    // whether the row still fits.
    fitBarControls();
    barsLabel.textContent = `${settings.barsPerWindow} bar${settings.barsPerWindow === 1 ? '' : 's'}`;
    // Scroll draws the whole piece and scrolls it, so there is no window for
    // the number to be about (`04` section 0 R4). The Layout row says where
    // the setting applies, so the sentence is not simply lost with the row.
    barsRow.hidden = settings.layout === 'scroll';
    setRowLabel(
      barsRow,
      barsShown < settings.barsPerWindow
        ? `Bars in window — ${String(settings.barsPerWindow)} asked, ${String(barsShown)} shown: ${
            // The reason the count fell (T34): over 100 % Size it is the size
            // asked for, not the screen being too small for the music.
            settings.zoom > 1
              ? `at ${String(Math.round(settings.zoom * 100))} % only ${String(barsShown)} of ${String(settings.barsPerWindow)} fit here`
              : `${String(settings.barsPerWindow)} would be too small here`
          }`
        : 'Bars in window',
    );
    setRowLabel(
      layoutRow,
      settings.layout === 'scroll' ? 'Layout — Bars in window applies to the Window layout' : 'Layout',
    );
    zoomLabel.textContent = `${String(Math.round(settings.zoom * 100))}%`;
    // The ends of both ranges, said rather than silently absorbed. Pressing a
    // stepper that has nowhere left to go used to look exactly like a control
    // that had stopped working.
    barsDown.disabled = settings.barsPerWindow <= MIN_BARS_PER_WINDOW;
    barsUp.disabled = settings.barsPerWindow >= MAX_BARS_PER_WINDOW;
    zoomOut.disabled = settings.zoom <= ZOOM_MIN;
    zoomIn.disabled = settings.zoom >= ZOOM_MAX;
    layoutWindow.classList.toggle('is-selected', settings.layout === 'window');
    layoutWindow.setAttribute('aria-pressed', String(settings.layout === 'window'));
    layoutScroll.classList.toggle('is-selected', settings.layout === 'scroll');
    layoutScroll.setAttribute('aria-pressed', String(settings.layout === 'scroll'));
    metronomeButton.textContent = metronomeOn ? 'On' : 'Off';
    metronomeButton.classList.toggle('is-selected', metronomeOn);
    metronomeButton.setAttribute('aria-pressed', String(metronomeOn));
    for (const choice of KEYS_CHOICES) {
      const node = document.getElementById(`score-keys-${choice.id}`);
      node?.classList.toggle('is-selected', settings.keys === choice.id);
      node?.setAttribute('aria-pressed', String(settings.keys === choice.id));
    }
    destinationButton.textContent =
      settings.playbackDestination === 'phone'
        ? '🔈 Phone'
        : settings.playbackDestination === 'piano'
          ? '🎹 Piano'
          : '🔈🎹 Both';
    // The row beside it already says "Loop", so the button says the state:
    // "Loop / Loop" read as a stutter in the sheet.
    loopButton.textContent = loopSection
      ? `${loopSection.label} ✕`
      : loopBars
        ? `Bars ${String(shownBar(loopBars.from))}–${String(shownBar(loopBars.to))} ✕`
        : 'Off';
    loopButton.classList.toggle('is-selected', loopBars !== null);
    drawRunRows();
    // The bars being looped, on the screen element, so "did it open looping"
    // is a question that can be asked without opening the ⋯ sheet first — the
    // bar folds three seconds into a run and the sheet is two taps away.
    section.dataset.loop = loopBars
      ? `${String(shownBar(loopBars.from))}-${String(shownBar(loopBars.to))}`
      : '';
    // One convention for every toggle in the sheet (P21b A2): the word is On
    // or Off and On is the highlighted one. Blind and Perform are routes
    // rather than settings, but from inside the sheet they are states of the
    // run like the rest, and were the only two naming themselves instead.
    blindToggle.classList.toggle('is-selected', blind);
    blindToggle.setAttribute('aria-pressed', String(blind));
    performanceToggle.classList.toggle('is-selected', performanceRun);
    performanceToggle.setAttribute('aria-pressed', String(performanceRun));
    for (const hand of HANDS) {
      document.getElementById(`score-hands-${hand.id}`)?.classList.toggle('is-selected', hands === hand.id);
    }
    const playing = session?.running === true && session.state?.paused !== true;
    playPause.textContent = playing ? '⏸' : '▶';
    playPause.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    stripHost.hidden = settings.keys === 'off';
    stripHost.dataset.keys = settings.keys;
    section.dataset.running = String(session?.running === true);
    // The size a run starts at is the size it keeps (P21e A2).
    renderer?.setRunning(session?.running === true);
    section.dataset.mode = mode;
    helpStrip.setEntry(MODE_HELP[modeKey()]);
    drawResume();
    // The first note the piece is asking for, marked before anything is
    // judged (`04` §5f). Only while nothing is running: once a run is going
    // the engine is the only thing that says what is wanted.
    if (session && !session.running && !hearing) {
      const loop = loopBars && !performanceRun ? session.loopForPrintedBars(loopBars.from, loopBars.to) : undefined;
      session.previewFirst({ mode, hands, ...(loop ? { loop } : {}) });
    }
    section.dataset.keysGuide = settings.keysGuide;
    // Which mode the *run* is in, when it is not the one the select shows.
    section.dataset.hearing = String(hearing);
    hearButton.textContent = hearing ? 'Stop' : 'Hear it';
    hearButton.title = hearing
      ? 'Stop playing it to you'
      : 'Play the piece to you, nothing judged';
    section.dataset.input = input;
  }

  /**
   * Builds whatever is under the score — the strip, the ribbon, or nothing —
   * from the setting, and hands it to the running session if there is one.
   *
   * The strip is tappable, because for a learner with no MIDI cable it *is*
   * the instrument (docs/04 §5): it feeds the shared ScreenKeyboardSource
   * rather than the session directly, so "screen keys" is an input like any
   * other and the engine cannot tell the difference. The ribbon is not: an
   * 8 px cell is not a key anyone can play.
   */
  function mountKeys(): KeyView | null {
    strip?.destroy();
    strip = null;
    if (!keysRange || settings.keys === 'off') {
      session?.setStrip(null);
      return null;
    }
    strip =
      settings.keys === 'ribbon'
        ? new KeyRibbon(keysRange)
        : new KeyboardStrip({
            ...keysRange,
            interactive: true,
            onNoteOn: (midi, velocity) => screenKeyboardSource.noteOn(midi, velocity),
            onNoteOff: (midi) => screenKeyboardSource.noteOff(midi),
          });
    stripHost.appendChild(strip.el);
    session?.setStrip(strip);
    return strip;
  }

  // --- load ----------------------------------------------------------------

  void (async () => {
    try {
      item = await findItem(itemId);
      if (!item) {
        status.textContent = `Unknown item “${itemId}”.`;
        // No score, no controls: a bar of live buttons over nothing is noise
        // (`08` §3.1, the state gallery's lifecycle cell).
        bar.hidden = true;
        return;
      }
      title.textContent = item.title;
      // Unconditional, unlike the side panel below, which is a tablet's
      // second column: the rung decides what this run has to reach, and that
      // cannot depend on how wide the screen is.
      void findRung(item.id);
      // Shown only where the file has chord symbols in it (`openItem.ts`).
      chartRow.hidden = !hasChordSymbols(item);
      if (tablet) void fillSidePanel(item);
      sections = item.teaching?.sections ?? [];
      if (sections.length > 0) {
        sectionSelect.replaceChildren();
        const none = document.createElement('option');
        none.value = '';
        none.textContent = 'Whole piece';
        sectionSelect.appendChild(none);
        for (const entry of sections) {
          const option = document.createElement('option');
          option.value = entry.label;
          option.textContent = `${entry.label} (${String(entry.fromMeasure)}–${String(entry.toMeasure)})`;
          sectionSelect.appendChild(option);
        }
        // Filled here, shown further down — choosing a section needs the
        // parsed score to turn printed bars into a loop, and the score is
        // still being fetched at this point. Shown any earlier the control is
        // live for a second or two while doing nothing, which on a slow phone
        // with a long piece is long enough to use it and be ignored.
      }
      if (item.kind === 'pdf') {
        // A PDF has no notes to follow; it belongs to the page viewer.
        status.textContent = `${item.title} is a PDF — open it from Library.`;
        bar.hidden = true;
        return;
      }
      const sightReading = isSightReading(item);
      if (!item.file && !item.imported && !sightReading) {
        status.textContent = `${item.title} has no notation to open. ${item.importHint ?? ''}`.trim();
        bar.hidden = true;
        return;
      }

      // Three sources, one renderer: a bundled score comes from the precache,
      // an imported one from IndexedDB (docs/04 §4), and a sight-reading drill
      // is generated here and now (docs/05 §8) — because the whole point is
      // that the learner has not seen it before.
      let musicXml: string;
      if (sightReading) {
        musicXml = generateSightReadingFor(item, router.route.seed);
      } else if (item.imported) {
        const row = await getImport(item.id);
        if (typeof row?.data !== 'string') throw new Error('the imported file is missing');
        musicXml = row.data;
      } else {
        const response = await fetch(contentUrl(item.file as string));
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        musicXml = toMusicXml(new Uint8Array(await response.arrayBuffer()));
      }

      // The model comes from an instance with no draw range: a windowed OSMD
      // clamps its cursor iterator, so extracting from the renderer's own view
      // would yield a model that stops at the end of the first window.
      const probe = new OsmdView(document.createElement('div'));
      await probe.load(musicXml);
      const loaded = probe.extractModel({ id: item.id });
      probe.dispose();
      // Nothing to play is a terminal state with a reason, not a stage with
      // nothing on it and every mode refused (`08` §10).
      if (loaded.steps.length === 0) {
        status.textContent = `${item.title} has no notes to play.`;
        bar.hidden = true;
        render();
        return;
      }
      model = loaded;

      renderer = await WindowRenderer.create({
        container: stage,
        model: loaded,
        musicXml,
        barsPerWindow: settings.barsPerWindow,
        // The third of the three goods, reported back rather than assumed:
        // when readability or the look-ahead take bars off the window, the
        // row above says so in words (T32).
        onWindow: (shown) => {
          if (shown === barsShown) return;
          barsShown = shown;
          render();
        },
        zoom: settings.zoom,
        layout: settings.layout,
        handsFocus: hands,
        drawFingerings: settings.showFingering,
        // The bar says the bpm; the mark above the first system was the
        // tallest thing above any stave, paid for by every window (P21d A6).
        drawMetronomeMarks: false,
        // The words are for singing; this screen is for the hands (`08` §3.4.1).
        drawLyrics: false,
        drawChordSymbols: settings.showChordSymbols,
      });

      if (window.__pianopath) {
        window.__pianopath.scoreFit = () => renderer?.debugFit();
        // What the run is waiting for, so a test can play a whole piece by
        // asking rather than by carrying a copy of it.
        window.__pianopath.scoreRun = () => {
          const state = session?.state;
          if (session?.running !== true || !state || !model) return null;
          return {
            step: state.step,
            expected: session.expectedNow,
            bar: model.steps[state.step]?.sourceMeasureIndex ?? 0,
            // Playing order, so a repeat's jump back is the bar a test
            // expects on the screen, not the printed one after it.
            nextBar: model.steps[state.step + 1]?.sourceMeasureIndex ?? null,
            lastBar: Math.max(0, model.sourceMeasureCount - 1),
            noteIds: (model.steps[state.step]?.notes ?? []).map((n) => n.id),
            // The step's own notes, whatever the mode expects: Free expects
            // nothing and still turns the page on these.
            pitches: [...new Set((model.steps[state.step]?.notes ?? []).map((n) => n.midi))],
            paused: state.paused,
            // Holding for the first note (T8), so a test can tell a run that
            // is waiting from one that has stopped moving.
            armed: state.armed,
            engineMode: state.mode,
            input,
          };
        };
      }

      // Draw the first window. `WindowRenderer.create` prepares its buffers but
      // does not commit to a position: the first `showStep` is what puts notes
      // on the screen, and without it the stage is two empty divs.
      renderer.showStep(0);

      // The range this piece uses, not all 88 keys. With the full keyboard
      // on a 360 px phone every key is about seven pixels, and the blue key
      // marking the note the app is waiting for is a sliver among eighty-
      // eight slivers — which is exactly how a run got stuck on an F#4 that
      // was on the screen the whole time.
      keysRange = stripRangeFor(loaded.steps.flatMap((step) => step.notes.map((note) => note.midi)));
      mountKeys()?.scrollToNote(loaded.steps[0]?.notes[0]?.midi ?? 60, 'auto');

      const context = audioEngine.contextOrNull;
      session = new ScoreSession({
        model: loaded,
        renderer,
        strip,
        stripOptions: { guide: settings.keysGuide, fingers: settings.keysFingerNumbers, flash: settings.keysFlash },
        piano: null,
        audioContext: context,
        destination: audioEngine.masterGain,
        onChange: render,
        onBeat: (tick) => onBeat(tick),
      onFinished: (score, looped) => {
        // One bar, once: the first lap of the preview loop ends it.
        // Any finish, not only the lap: with the loop cleared under it the
        // preview reaches the end of the piece instead of coming round, and
        // `hearingBar` used to stay set for the rest of the visit (T31).
        if (hearingBar) {
          endBarPreview();
          return;
        }
        // An ordinary loop run keeps going; only a real ending is a summary.
        // The ladder, though, lives exactly here: a lap boundary is the one
        // moment a pass can be judged as a whole (`05` §6).
        if (looped) {
          climbLadder(score);
          return;
        }
        endedSinceLastStart = true;
        // `Hear it` reaching the end is the end of a demonstration: nothing
        // was judged and nothing is recorded. It went to the summary, which
        // wrote a nought-accuracy run into the history under whichever mode
        // the select happened to show.
        // …and so is a Listen run chosen from the select: the app played it,
        // there is nothing to report (`08` §7.4). The status line says so.
        if (hearing || mode === 'listen') {
          hearing = false;
          clearBeat();
          status.textContent = 'Played to the end.';
          render();
          return;
        }
        // Free play judges nothing, so there is nothing to summarise: the
        // page has been turned to the end, and that is all (`08` §7.4).
        //
        // Said, though, because nothing else on the screen says it (T23). The
        // run is over, the cursor stops on the last step and keys no longer
        // turn the page — and until this line there was no sentence, so an
        // improviser whose page had stopped moving could not tell the end of
        // the piece from a run that had lost them. Listen says exactly this
        // when it reaches the end, three lines above.
        if (mode === 'free') {
          status.textContent = 'End of the piece.';
          render();
          return;
        }
        showSummary(score);
      },
      });

      // Pick the follow input the way docs/04 §7 says: first available in the
      // learner's priority order, so a connected piano is used without asking.
      // The soundfont is megabytes; attach it when it lands rather than making
      // the score wait for it.
      void getPiano()
        .then((piano) => session?.setPiano(piano))
        .catch(() => {
          /* No playback. Everything else on this screen still works. */
        });

      input = pickInput();
      mode = input === 'none' ? settings.defaultModeWithoutInput : settings.defaultModeWithInput;
      // Tempo mode, always, for a sight-read: waiting for each note is not
      // sight-reading, it is decoding (docs/05 §8).
      //
      // **After the default above, and that is the whole of the fix.** It used
      // to be set three hundred lines earlier, where the score finished
      // loading, and this line then overwrote it — so Today's daily sight-read
      // opened in Wait mode for every learner whose applicable default is Wait,
      // which `defaultModeWithInput` ships as. Entry 29 found it in passing and
      // left it named; the test that was red is the one with both defaults set
      // to Wait, because with no input attached the *other* default (Tempo) hid
      // it. The select is set from `mode` by `render()` below, so there is no
      // second assignment to keep in step any more.
      if (sightReading) mode = 'tempo';
      // …unless the hash asked for one. A tour step about Wait mode that opens
      // in whatever the learner's default happens to be is a step teaching the
      // wrong thing, and the select is still theirs to change afterwards.
      if (routeMode) mode = routeMode;
      // The first time this learner opens a piece in this mode, a card saying
      // what the mode does before the first note is judged (`04` §5f). After
      // the three lines above, so it is the mode actually about to run.
      maybeFirstSight({ key: `mode:${modeKey()}`, entry: MODE_HELP[modeKey()], id: 'score' });
      // Set here rather than at the top of the screen because the label the
      // Loop control draws goes through `shownBar`, which needs the parsed
      // model. Nothing reads `loopBars` before a run starts, so this is the
      // first moment it can be both applied and drawn correctly.
      if (routeLoop && !performanceRun) {
        // The hash speaks printed bar numbers and `loopBars` counts from one;
        // they differ by one on a pickup piece, which is why `shownBar` exists.
        const wanted = {
          from: loopBarForShown(routeLoop.from),
          to: loopBarForShown(routeLoop.to),
        };
        // ...and only if the piece has those bars. A range past the end would
        // otherwise draw a Loop control naming bars that loop nothing, which
        // is the one thing worse than opening without a loop.
        if (session.loopForPrintedBars(wanted.from, wanted.to)) {
          loopBars = wanted;
          loopSection = null;
        }
      }
      applyRouteLadder(loaded);
      // The title is in the header now. The status line is for the app's own
      // messages, and "Loading…" is finished being true.
      //
      // Except in a blind run, where the screen is an empty black rectangle
      // and nothing else on it says why: "Show the score" moved into the ⋯
      // sheet with the rest of the settings, so without this the screen looks
      // broken rather than deliberate.
      status.textContent = blind ? 'Blind — ⋯ shows the score' : '';
      if (sections.length > 0) sectionRow.hidden = false;
      // Listening before the first run, so a key can start it (T8). Not the
      // microphone: attaching it asks for permission, and opening a score
      // must not put up a prompt nobody asked for.
      if (input === 'midi' || input === 'keys') attachInput();
      showBar();
      render();
      // Now that there is a drawn sheet to measure, grow it to fill the
      // screen. Once, here — not from inside every draw, which would recreate
      // every note element mid-run.
      renderer?.fitToStage();
    } catch (cause: unknown) {
      // Every branch above that ends without a score hides the bar first: a
      // row of live buttons over nothing is noise (`08` §3.1). This one did
      // not, so a fetch that failed or a file that would not parse left a
      // count-in, a play button, a mode select and a tempo over a stage that
      // never got a score - and pressing play started a transport with no
      // notes to run. It also printed the raw error object, so the sentence a
      // person got began "Could not open this score: Error: ".
      status.textContent = `Could not open this score: ${
        cause instanceof Error ? cause.message : String(cause)
      }`;
      bar.hidden = true;
    }
  })();

  function pickInput(): FollowInput {
    for (const candidate of settings.inputPriority) {
      if (candidate === 'midi' && webMidiSource.inputs.length > 0) return 'midi';
      if (candidate === 'mic') continue; // needs a permission prompt; never automatic
      if (candidate === 'keys') return 'keys';
      if (candidate === 'none') return 'none';
    }
    return 'none';
  }

  const onResize = (): void => {
    // The bar may wrap differently, which changes how much is left for the
    // notation, so it is measured before the sheet is refitted.
    measureBar();
    renderer?.refit();
    // The refit may have engraved the sheet again; the colours are keyed by
    // note id and come back at the next paint, so ask for one now rather
    // than at the next note (`08` §9.5).
    session?.repaint();
    // Turning the phone changes how much room the keys have.
    strip?.fitKeysToWidth();
  };
  window.addEventListener('resize', onResize);

  /**
   * Leaving the page pauses a clock-driven run, and coming back says so
   * (decision 9).
   *
   * A phone call, a notification, the screen going off: the frames stop, and
   * a Tempo run that carried on regardless would be marking a page of bars
   * nobody played. Catching up silently is the one thing it must not do.
   *
   * Wait and Free have no timetable to lose, so they are left alone — the run
   * is exactly where it was when he comes back, which is the honest answer
   * for a mode that waits.
   */
  let awayFromMs: number | null = null;
  const onVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      // The run's mode, not the selector's (T31). `05` 4 is about a clock
      // that stops getting frames, and `Hear it` and the one-bar preview are
      // clock-driven Listen runs whatever the selector happens to say -- so
      // asking the selector let exactly those two carry on into a locked
      // phone, which is the one thing this handler exists to prevent.
      const runMode = session?.mode;
      const driven = runMode === 'tempo' || runMode === 'listen';
      if (!driven || session?.running !== true || session.paused) return;
      awayFromMs = Date.now();
      session.pause();
      render();
      return;
    }
    if (awayFromMs === null) return;
    const away = Math.max(1, Math.round((Date.now() - awayFromMs) / 1000));
    awayFromMs = null;
    // The engine's elapsed time already subtracts the pause, so the run's
    // recorded minutes do not count the time he was away.
    // Named, not drawn as a glyph nothing on this screen wears (T23). Two
    // searches for `⏮` — over `src/ui` and over `style.css` — returned only
    // this sentence, so it pointed at a control that does not exist; the one
    // it means is the `Start again` row inside `⋯`, and a performance does
    // not have that row at all (`Start again` is omitted while performing,
    // because offering a restart during a performance is offering to make it
    // not one).
    // On the state line, which is where what the run is doing is written
    // (`04` 5f), rather than on `#score-status` beside a state line still
    // holding the mode's standing sentence (T31).
    awaySeconds = away;
    showBar();
    render();
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

  /**
   * Space starts a run from the ready screen (T8) — the start button for a
   * laptop beside the piano, whatever the input.
   *
   * Only when nothing has focus that Space already means something to: the
   * browser presses a focused button on Space, so a handler here as well
   * would start a run twice from a focused *Start again*.
   */
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== ' ' || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('button, input, select, textarea, a, summary, details, [contenteditable], [role="button"]')) return;
    if (!session || session.running || !sheet.hidden || hearing || sheetOpen()) return;
    event.preventDefault();
    startRun();
    render();
  };
  document.addEventListener('keydown', onKeyDown);

  onScreenDispose(section, () => {
    // Stopping a session is itself a finish and comes back through
    // `onFinished`, so tearing the screen down draws a summary — which would
    // otherwise forget the very run this is about to remember.
    leaving = true;
    // Where the run was left, if it was left. Read off the same step the bar
    // readout reads, so the number the offer prints next time is the number
    // the screen was showing when the learner walked away.
    // The run's mode, not the selector's (T31, the same fault as the beat dot
    // and the page-hidden pause). `Hear it` and the one-bar preview are Listen
    // runs under a selector that still says *Wait for me*, so leaving during a
    // demonstration wrote *You stopped at bar 7 of 12 last time* — an offer to
    // carry on with a run nobody had played a note of.
    if (session?.running === true && model && itemId !== undefined && session.mode !== 'listen') {
      const step = session.state?.step ?? 0;
      const bar = model.steps[step]?.sourceMeasureIndex;
      if (bar !== undefined) {
        rememberUnfinished({
          itemId,
          bar: printedBar(bar),
          ofBars: printedBar(model.sourceMeasureCount - 1),
          at: new Date().toISOString(),
        });
      }
    }
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    document.removeEventListener('keydown', onKeyDown);
    if (hideTimer !== null) window.clearTimeout(hideTimer);
    detachInput();
    releaseWakeLock();
    session?.dispose();
    strip?.destroy();
    renderer?.dispose();
  });

  return section;
}
