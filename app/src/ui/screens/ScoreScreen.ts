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
import { catalogIndex, findItem, contentUrl, loadCurriculum } from '../../curriculum/load';
import { declaredHandOption } from '../../curriculum/declaredHand';
import { verifiedHandsOption } from '../../curriculum/verifiedFacts';
import { parseFrontMatter, renderMarkdown } from '../markdown';
import { barsPerWindowFor, isTablet, sidePanelProse } from '../tablet';
import { getImport } from '../../data/importStore';
import { isSightReading } from '../../engine/drills/fromCatalog';
import { generateSightReading, SightReadingRefusal, type SightReadingOptions } from '../../engine/sightReading';
import { phraseOptions, taughtAtRung } from '../../curriculum/session';
import type { CatalogItem, Curriculum, Lesson } from '../../curriculum/types';
import { findLesson, masteryCriteriaFor, proseRungFor } from '../../curriculum/selectors';
import { skillsInForce } from '../../curriculum/skillActivation';
import { getMidiSettings } from '../../data/midiSettings';
import {
  DEFAULT_SETTINGS,
  getSettings,
  updateSettings,
  type FollowInput,
  type KeysGuide as PracticeGuide,
  type KeysView,
  type PlaybackHands,
} from '../../data/settingsStore';
import {
  demandsTechniqueMeasure,
  evaluateOutcome,
  measuresOf,
  openingThatCounts,
  techniqueMeasureFor,
  tempoCanCount,
  velocityIsFlat,
  type MasteryCriteria,
} from '../../engine/Scoring';
import { evidenceFor, isRefusal, stampedEvidence, type EvidenceResult } from '../../evidence/evidence';
import { VOCABULARY_V0 } from '../../evidence/vocabulary';
import { nextLadderTempo } from '../../engine/PracticeEngine';
import { MASTER_DAYS, dayKey, recordRun, sessionsForItem, type RunResult } from '../../data/progressStore';
import {
  OBSERVATION_DEFINITIONS,
  coversWholeItem,
  phraseVersionOf,
  type PhraseGenerator,
  type ReadingRecipe,
  type RunHeader,
  type SessionRow,
} from '../../data/db';
import { NOT_MEASURED, type Mode, type SessionScore } from '../../engine/types';
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
import type { RouteRecipe, Router } from '../../router';
import { KeyboardStrip, type KeyView } from '../KeyboardStrip';
import { KeyRibbon } from '../KeyRibbon';
import { waitingForLine, type WrittenPitch } from '../expectedNote';
import { stripRangeFor } from '../stripRange';
import { onScreenDispose } from '../screenLifecycle';
import {
  LADDER_TEXT,
  MODE_HELP,
  NOT_JUDGED_TEXT,
  OFFER_TEXT,
  PROJECT_TEXT,
  RESTARTED_WITH,
  ROW_TEXT,
  SESSION_TEXT,
  STATE_TEXT,
  SUMMARY_TEXT,
  notJudgedLines,
  readingTitle,
  type RunChangeKey,
  type ScoreMode,
} from '../help';
import { forgetUnfinished, rememberUnfinished, unfinishedFor } from '../../data/unfinishedRun';
import { createHelpStrip, maybeFirstSight, openFirstSight, type HelpStrip } from '../helpStrip';
import { openSheet } from '../widgets';
import { openProjectSheet } from '../projectSheet';
import { isProjectable } from '../../data/projectStore';
import { hasChordSymbols } from '../openItem';
import { playedMaterial, runFacts, textIdentity } from '../../curriculum/material';
import {
  familiarityIn,
  firstContactIn,
  historyFor,
  newVisitId,
  recordEncounter,
  type EncounterHistory,
  type EncounterTarget,
} from '../../data/encounterStore';
import type { EncounterKind, EncounterSource } from '../../data/db';
import type { Relationship } from '../../curriculum/transfer';
import { loadOffer, type OfferRead, type OfferRefusal } from '../../data/offerSnapshot';
import { scoreOutcome } from '../../data/sessionRun';
import { drawTransition, sessionHandle } from '../sessionRunner';
import { chromeFor, type ChromePlan } from './scoreChrome';

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

/**
 * A peek at the controls while the hands are on the keys lasts this long
 * without a tap (docs/04 §5). The fold itself has no timer since U122c: the
 * controls fold the moment a run starts or carries on, ⏸ staying in ▶'s place,
 * and come back the moment it pauses (`scoreChrome.ts`). It used to wait 0.7 s
 * after ▶ and 3 s after any tap, whatever the run was doing, and so folded a
 * paused run's ▶ away three seconds after ⏸.
 */
export const CONTROL_BAR_HIDE_MS = 3_000;

/**
 * The longest the first draw waits for the tablet side panel's decision once
 * the score is ready to draw (U80). The panel's two reads started when the
 * item was found, beside the score's own, so this is time past the score's
 * load, spent on "Loading…": long enough for a precached lesson file on a
 * slow tablet, short enough that a read that has stalled costs the learner a
 * moment rather than the score. Past it the score draws and the panel, if it
 * ever comes, arrives as a resize.
 */
export const SIDE_PANEL_WAIT_MS = 1_500;

/**
 * The longest ▶ (or Space, or `Hear it`, or any tap U105 gated) waits for the
 * sound to start (U69, G86a). Chosen, not measured. A resume is the device's audio output
 * starting, not a download, so a context the platform is willing to start
 * should answer well inside it; one that has not answered by then is being
 * refused — a phone in a call keeps the audio for the call — and the button a
 * beginner presses most must not sit doing nothing for longer than about a
 * second, where a tap that has not answered starts to read as broken. Past it,
 * with the sound still not running, the tap starts nothing and the state line
 * says the sound did not start and to tap again (G86a); the next tap asks
 * again. The bound ends the wait, not the chance of sound: it is never taken
 * as proof that there is none.
 */
export const PLAY_SOUND_WAIT_MS = 1_000;

/**
 * A control whose tap can start the sound, as it asks `withSound` (U105): the
 * element that carries `data-sound-refused` while its refusal stands, and how
 * `STATE_TEXT.soundOff` names it — the label, or its first word where the
 * label would pass the forty-odd characters the state line shows at 342 px
 * (`04` §5f).
 */
interface SoundTap {
  /** The control's id. */
  id: string;
  control: string;
  verb?: 'tap' | 'hold';
  again?: boolean;
}

/** ▶, and Space, its keyboard twin (G86a): the one tap whose wait shows on its button (U69). */
const PLAY_TAP: SoundTap = { id: 'score-play', control: '▶' };
const HEAR_TAP: SoundTap = { id: 'score-hear', control: 'Hear it' };
/**
 * A key that would start a run, on a connected piano or on the screen (U105).
 * The sentence names ▶, whose tap can start the sound, without *again*,
 * because ▶ was not what was used; ▶ carries the mark.
 */
const KEY_TAP: SoundTap = { id: 'score-play', control: '▶', again: false };
const CARRY_ON_TAP: SoundTap = { id: 'score-resume-go', control: 'Carry on' };
const RESTART_TAP: SoundTap = { id: 'score-restart', control: 'Start again' };
const TRY_AGAIN_TAP: SoundTap = { id: 'session-try-again', control: SESSION_TEXT.tryAgain };
const AGAIN_TAP: SoundTap = { id: 'summary-again', control: 'Again' };
const SLOWER_TAP: SoundTap = { id: 'summary-slower', control: 'Slower' };
const FASTER_TAP: SoundTap = { id: 'summary-faster', control: 'Faster' };
/** *Loop the weak bars*: 50 characters in full, so its first word. */
const LOOP_WEAK_TAP: SoundTap = { id: 'summary-loop', control: 'Loop' };
/** *Keep tempo at 80 %* (X46): the run *To pass* names, by its first words. */
const STANDARD_TAP: SoundTap = { id: 'summary-standard', control: 'Keep tempo' };

/**
 * Sight-reading is the one drill kind that is notation (docs/05 §7–§8), so it
 * opens here rather than on the drill screen. Its parameters come from the
 * catalog item, exactly as the runtime drills' do — all of them, through
 * `sightReadingOptionsFor` (T37): the key, the metre, the tempo and what the
 * rung promises the phrase will contain, where this used to pass the level,
 * the hands and the bars and nothing else.
 *
 * A fresh exercise is generated each time the screen is opened, because the
 * whole point is material the learner has not seen. "Again" on the summary
 * sheet re-runs the *loaded* score rather than regenerating, which is what
 * docs/05 §8 means by retrying a failed sight-read identically.
 *
 * The seed comes back with the music. Today's sight-read carries the day's
 * seed in the route (`04` §2), so the day has one phrase; every other open
 * draws one here, and the screen keeps it so the run can be recorded against
 * the phrase it was (the session row's `seed`).
 *
 * The recipe (C4) is what Today's reader moved from the row's own params
 * (`?recipe=`): the phrase is written from the row with those moves over it,
 * by the same function the reader and its tests use (`readingOptions`). And
 * the rung that opened it (C4c): the row held to what that rung has taught,
 * so 2.2's row stays inside C position until 2.5 teaches leaving it; opened
 * from nowhere, the row as it stands. Where the route names a hold (`?hold=`,
 * SR2: Today's daily read before any rung lists a reading row), the row is
 * held to what that rung has taught instead, and the judging rung still judges
 * the run. The hold is decided in `session.phraseOptions`, the one place.
 *
 * And the phrase's identity (D1a): the generator's family, the version that
 * wrote it and the seed, which the run keeps (`generator`) so the history can
 * tell version 2's phrase of a seed from version 1's; with the options it was
 * written from and its tempo, the complete identity the run keeps as its
 * `material` (D4, `material.phraseMaterial`). A phrase the generator cannot
 * write throws `SightReadingRefusal`, which the load below shows.
 */
function generateSightReadingFor(
  item: CatalogItem,
  seed: number,
  recipe: RouteRecipe | undefined,
  curriculum: Curriculum | undefined,
  rungs: { judging?: string; hold?: string },
): { musicXml: string; seed: number; generator: PhraseGenerator; options: SightReadingOptions; bpm: number } {
  const options = phraseOptions(curriculum, item, recipe, seed, rungs);
  const phrase = generateSightReading(options);
  return { musicXml: phrase.musicXml, seed: phrase.seed, generator: phrase.generator, options, bpm: phrase.bpm };
}

/**
 * The hold a run's header stores (`RunHeader.opened.hold`; SR4, the reviewer's ruling on SR3,
 * `docs/review/responses/sr3-lb1-landing.md` §3): the route's hold, where the phrase was written under it while
 * another rung judges the run, and nothing otherwise. Under it means what `phraseOptions` did with it: the
 * curriculum was read and names the hold's rung, so the phrase was held to that rung's taught set; with no
 * curriculum, or a hold the curriculum lacks, the phrase was written from the row as it stands and was held to
 * nothing. A hold equal to the judging rung is that rung's own phrase, and stores none. Decided when the phrase is
 * written, where the app knows it; never read back from the phrase against today's curriculum.
 */
export function storedHold(curriculum: Curriculum | undefined, rungs: { judging?: string; hold?: string }): string | undefined {
  const { judging, hold } = rungs;
  if (hold === undefined || judging === undefined || hold === judging || curriculum === undefined) return undefined;
  return taughtAtRung(curriculum, hold) === undefined ? undefined : hold;
}

/**
 * A phrase's seed nobody asked for: never one a stored run of the item
 * carries, nor the one on the screen (T40's *New phrase*; C4 item 2). A random
 * 32-bit seed was almost never one of them; "almost" is not what the learner
 * is told when the card says *never seen*.
 */
function freshSeed(avoid: ReadonlySet<number> = new Set()): number {
  for (;;) {
    const seed = Math.floor(Math.random() * 0xffffffff);
    if (!avoid.has(seed)) return seed;
  }
}

/**
 * How many of an item's stored runs are looked through for a phrase it has
 * already been played on. Every run of a sight-reading row is one phrase, and
 * the daily read adds one a day, so this is more than a year of them.
 */
const PHRASE_HISTORY = 500;

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
   * The rung a Today card chose for this run, and the slot it filled (C3 item
   * 0b, L50): `?rung=` and `?slot=`, apart from `from` because they judge and
   * record the run and do not steer Back. Read once, like `from`.
   */
  const todayRung = router.route.scoreRung;
  const todaySlot = router.route.scoreSlot;
  /** The phrase's recipe, where Today's reader named one (C4, `?recipe=`). */
  const routeRecipe = router.route.scoreRecipe;
  /** The rung whose taught set holds a generated phrase where it is not the judging rung's (SR2, `?hold=`). */
  const routeHold = router.route.scoreHold;
  /**
   * Today's session activity this run is, where the runner opened it (X1, `?session=`): the screen reports
   * its lifecycle through the handle — opened, attempted, completed, visible time — and the summary's closing
   * action becomes the transition to the next activity. It reads no encounter history and chooses no next
   * activity itself. None: an ordinary screen.
   */
  const sessionRun = sessionHandle(router.route.session);
  /** Visible time on this screen, for the session (X1): a hidden page accrues nothing; stopped when the screen goes. */
  const stopSessionClock = sessionRun?.startClock();
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
    // A Today run toggled into Blind is still that Today run (L50).
    ...(todayRung === undefined ? {} : { rung: todayRung }),
    ...(todaySlot === undefined ? {} : { slot: todaySlot }),
    // And the same kind of phrase (C4): *New phrase* and Blind keep the recipe, and the hold (SR2).
    ...(routeRecipe === undefined ? {} : { recipe: routeRecipe }),
    ...(routeHold === undefined ? {} : { hold: routeHold }),
    // A transfer offer's run toggled into Blind is still that offer's run (D4).
    ...(router.route.scoreIntent === undefined ? {} : { intent: router.route.scoreIntent }),
    // And a session's activity is still that activity (X1): Blind, Perform and *New phrase* keep its token.
    ...(router.route.session === undefined ? {} : { session: router.route.session }),
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
   * A tap is waiting for the sound to start — ▶'s or Space's (U69), or
   * `Hear it`'s (U67), or any other U105 put through the gate — so a second
   * tap in that moment starts nothing, and no control starts anything while
   * another's tap is waiting. Always
   * cleared when the wait ends, however it ends (G86a): a `Hear it` start that
   * never answered used to leave it set, and every later ▶ returned before
   * asking.
   */
  let startingSound = false;
  /** ▶'s own tap is the one waiting (U69): what `drawPlayHold` shows on the button. */
  let playWaiting = false;
  /**
   * The tap whose wait ended with the sound still not running (G86a), or the
   * key refused at once (U105): nothing started, and the state line says so
   * and names that tap's control. Cleared by the next tap that asks, by a
   * start that makes ▶ read ⏸ (`startRun`, U105), and by the sound starting by
   * any path — `soundOffLine` reads the engine too, so a line that has stopped
   * being true is never drawn. Nothing records the engine as unavailable:
   * every tap asks.
   */
  let soundRefusedBy: SoundTap | null = null;
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
  /**
   * The late answer (G86a): a start that answers after its tap was refused
   * starts nothing — a run beginning by itself after the learner was told it
   * had not would be a surprise of its own — but the sentence goes, because it
   * is no longer true. The same where the sound starts some other way while
   * the sentence stands. The engine publishes here both a start's answer and
   * the context's own state changes. Unsubscribed by the disposer, not through
   * `unsubscribers`, which `attachInput` empties.
   */
  const stopWatchingSound = audioEngine.onStateChange((state) => {
    if (state !== 'running' || soundRefusedBy === null || leaving) return;
    soundRefusedBy = null;
    render();
  });
  /** The pending long-press, if a finger is down on the stage. */
  let pressHold: number | null = null;
  /** Where that finger went down, so a wobble can be told from a drag. */
  let pressFrom: { x: number; y: number } | null = null;
  /** Runs finished since this exercise was generated (see the summary sheet). */
  let sightReadAttempts = 0;
  /** The generated phrase's seed, on a sight-reading item (T37). */
  let phraseSeed: number | undefined;
  /** The generated phrase's identity — family, version, seed — which the run keeps (D1a). */
  let phraseGenerator: PhraseGenerator | undefined;
  /**
   * The options the phrase was written from and its tempo: with the generator, the phrase's complete
   * identity, which the run keeps as its `material` (D4; `material.runFacts`). Any other item's run keeps
   * its catalogue row's `provenance.identity` — an excerpt's is its cut's (E1 item 7), the build's hash
   * of the bytes this screen plays.
   */
  let phraseWritten: { options: SightReadingOptions; bpm: number } | undefined;
  /** The hold the phrase on the screen was written under (`storedHold`, SR4): the run header's `opened.hold`. */
  let phraseHold: string | undefined;
  /**
   * Opened from Today's transfer offer (D4, `?intent=transfer&skill=&offer=`): the run keeps the intent
   * and the relationship the offer was made on, together, or neither (D4a; the reviewer's required
   * change on D4, `docs/review/responses/9193261.md`).
   *
   * D4 computed the relationship here, from the stored runs, in a read nothing waited for: a run
   * finished before it landed was stored with the intent and no relationship, and one after it with a
   * relationship recomputed at opening rather than the card's. Now Today keeps the offer it showed
   * (`data/offerSnapshot.ts`) and this screen reads it as it opens, before play:
   *
   * - `pending`: the read is out. ▶ is disabled, no run can start (`startRun`), and a finish that
   *   somehow came would store nothing — a pending read is never a completed practice run;
   * - `kept`: the snapshot is this route's offer (its token, this item, this skill, today): the run's
   *   facts carry `intent` and the snapshot's relationship, byte for byte, and nothing recomputes it;
   * - `refused`: missing, superseded, another item, skill or day, corrupt or unreadable: the item opens
   *   as practice, one line under the header says so (`OFFER_TEXT`), and the run carries neither.
   *
   * No transfer route, no read: `none`.
   */
  type OfferState =
    | { kind: 'none' }
    | { kind: 'pending' }
    | { kind: 'kept'; relationship: Relationship }
    | { kind: 'refused'; why: OfferRefusal };
  const transferIntent = router.route.scoreIntent;
  let offer: OfferState = transferIntent === undefined ? { kind: 'none' } : { kind: 'pending' };
  /** Started as the screen is built, beside the score's own fetch, and awaited before play. */
  const offerRead: Promise<OfferRead> | undefined =
    transferIntent === undefined
      ? undefined
      : loadOffer({ token: transferIntent.offer, itemId, skill: transferIntent.skill, today: dayKey(new Date()) });
  /** The read has not answered: nothing may start and nothing may be stored. */
  function offerPending(): boolean {
    return offer.kind === 'pending';
  }
  /**
   * A stored run already carries this phrase's seed (T37), under the version
   * that wrote this phrase (D1a).
   *
   * "First attempt" was a counter that started at nought on every visit, so
   * re-opening today's read regenerated the identical phrase and recorded its
   * first run as a first attempt again. The seed is on the session row now, so
   * a retry on the same music is told from a new phrase across visits too. A
   * seed names one phrase per generator version (G21): a run of the same seed
   * under another version — or with no version on it, version 1's — read
   * other music, so it does not make this phrase met.
   */
  let phraseSeen = false;
  /**
   * Every seed a stored run of this item carries (C4 item 2), so a phrase the
   * screen draws for itself — a fresh open, *New phrase* — is never one the
   * learner has played or heard. Filled as the item's rows are read.
   *
   * Every seed, whatever version wrote its phrase (D1a): the question here is
   * which seed may be drawn, and avoiding one read under another version costs
   * nothing in a 32-bit space, while drawing it again could hand back the very
   * notes read before — many seeds write the same phrase at both versions.
   */
  const seedsOnRecord = new Set<number>();
  /**
   * The app has played this phrase to the learner (T40): `Hear it`, a bar held
   * down, or *Play it to me* — any Listen run on it, before a run or during
   * one. A sight-read of music already heard is not a first reading, whenever
   * the hearing came. T33 caught it part way through a run, from `heardAt`,
   * which every fresh start empties; played before ▶, the run that followed
   * went on the record as the first reading. One phrase per visit, so it is
   * never cleared.
   *
   * Since G1 it is the fast path within the visit, for any item: the hearing
   * is also written as an encounter (`recordEncounter`), which is what
   * survives the visit, and a later visit reads it back (`history`).
   */
  let phraseHeard = false;
  /**
   * This opening of the screen (G1; the reviewer's constraint,
   * `docs/review/responses/7863bee.md`): every encounter written here names
   * it, and first contact compares visits, never times. The viewing the
   * reading needs is this visit's and does not count against it; one from any
   * other visit — before a reload, before Back and a return, in another tab —
   * is prior contact.
   */
  const visit = newVisitId();
  /**
   * What this visit is about once the score is loaded (G1): the item, the
   * material a run of it plays (`playedMaterial` — the phrase's identity, an
   * import's loaded bytes, else the row's), and its length in bars.
   */
  let encounterTarget: EncounterTarget | null = null;
  /**
   * What the learner had met of it when the screen opened (G1 item 4): its
   * encounters, the passages around it, the runs and the summaries of pruned
   * runs, read before play (`historyFor`) — so nothing can start before it has
   * answered — and read again before a run claiming first contact is stored,
   * in case another tab met it meanwhile. Null where it could not be read: the
   * visit's own flags then decide, as they did before G1.
   */
  let history: EncounterHistory | null = null;
  let historyRead: Promise<EncounterHistory | null> | null = null;
  /** The notation has been drawn for the learner on this visit and the viewing written (G1). */
  let viewingWritten = false;
  /** An import's file identity: the sha256 of the text this screen loaded (G1), which its runs carry. */
  let loadedIdentity: Awaited<ReturnType<typeof textIdentity>>;
  /**
   * The run waiting for its *How did it go?* answer (T37).
   *
   * Without a judging input the sheet asks, and said `Recorded: Clean` while
   * nothing was stored: the run was written before the question was drawn and
   * the answer never reached it. So the run is held here and written with the
   * answer. Since T40 the sheet asks where the app heard nothing, and a run
   * left unanswered is let go, not written: it has no evidence.
   */
  let pendingRecord: ((report?: 'rough' | 'ok' | 'clean') => void) | null = null;
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
   * What the state line says about a pause the learner did not make with ⏸
   * (T33): the run back from under a demonstration (*Paused at bar 12 — ▶ to
   * carry on*, C1) or restarted by an option changed while paused
   * (*Restarted at bar 1 with the left hand — ▶ when ready*, C2). `null` is
   * the learner's own pause, which `pausedLine` already words.
   */
  let pauseNote: string | null = null;
  /**
   * What the screen keeps for the run set aside under a demonstration (T33,
   * C1) — the session keeps the run itself. The ladder's pass base, because
   * the demonstration's start resets it and the run's next lap is judged
   * against it; and the bar, for the state line.
   */
  let setAside: { ladderPassBase: { missed: number; wrong: number; early: number }; bar: number } | null =
    null;
  /**
   * An option that restarts the run was changed while a demonstration played
   * over a run set aside: that run is not the one now asked for, so it is
   * dropped, and when the demonstration ends the run restarts, paused, with
   * this said (T33, C1 with C2).
   */
  let restartAfterDemo: string | null = null;
  /**
   * What changed during the run the summary will be about, per setting, and
   * the bar it changed at (T33, C5); and what was changed after it, while its
   * summary was up. Emptied by every start the learner asks for, and by a
   * start that is refused, so it covers the run the summary reports and the
   * option restarts that led to it.
   */
  const changedDuring = new Map<RunChangeKey, { from: string; to: string; bar: number | null }>();
  const changedAfter = new Map<RunChangeKey, { from: string; to: string; bar: number | null }>();
  /** The bars the run was at when the piece was played to the learner (C1, C5). */
  let heardAt: number[] = [];
  /** The summary's *Changed* line while the summary is up, so a change after the run can add to it. */
  let changedLine: { dt: HTMLElement; dd: HTMLElement } | null = null;
  /** The tempo the run was started at, which the slider's `input` has already moved past by its `change`. */
  let tempoApplied = settings.defaultTempoPct;
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
  let ladderPassBase = { missed: 0, wrong: 0, early: 0 };
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
   * words; this is the same idea.
   *
   * **Beside ⏸, in the row, never over the notes (U122c).** It was drawn over
   * the stage under a wash, and the numerals sat on the very notes the learner
   * reads to come in (walk finding 8; in Moonlight on a dozen note heads). The
   * controls fold to ⏸ the moment a run starts, which leaves the row's room
   * empty, so the count is drawn there, right of ⏸, at the row's own height.
   * Put into the bar once the bar exists (below).
   */
  const countIn = document.createElement('div');
  countIn.className = 'score-countin';
  countIn.id = 'score-countin';
  countIn.hidden = true;
  countIn.setAttribute('aria-hidden', 'true');
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
   *
   * **When it is decided is marked (U80).** `data-side` is absent until the
   * panel is decided, then `text` (the lesson's words are in it) or `empty`
   * (left out: a piece on no rung, a lesson that will not read), once per
   * opening — every opening builds a new screen, so the next piece starts
   * undecided. It read `empty` from the moment the screen was built, which is
   * also what a panel left out reads, so nothing could tell "not decided yet"
   * from "no panel" and a test reading the panel as the screen appeared read
   * whichever the race gave it. On a phone there is no panel, so it is decided
   * here and nothing waits for it. The word is `empty` because the
   * stylesheet's one-column rule is keyed on it.
   */
  const sidePanel = document.createElement('details');
  sidePanel.className = 'score-side';
  sidePanel.id = 'score-side';
  sidePanel.open = true;
  sidePanel.hidden = true;
  // Held here rather than found by id when the lesson lands: a lesson that
  // lands after the learner has opened another piece belongs to this screen's
  // panel, and the other piece's panel has the same ids.
  const sideSummary = document.createElement('summary');
  const sideBody = document.createElement('div');
  if (tablet) {
    sideSummary.textContent = 'Lesson notes';
    sideSummary.id = 'score-side-summary';
    sidePanel.appendChild(sideSummary);
    sideBody.className = 'score-side__body';
    sideBody.id = 'score-side-body';
    sidePanel.appendChild(sideBody);
    section.appendChild(sidePanel);
  } else {
    section.dataset.side = 'empty';
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
   *
   * **Beside `bar n / m`, not on the music (U122c).** It sat in the stage's
   * top-left corner, on the first system's clef upright. It is drawn in the
   * surface that names the bar: the header row upright and on a tablet, the
   * top line sideways (`placeBeatDot`). Neither folds away during a run.
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

  // The stage's corner chip (`bar n / m` over the music while the chrome was
  // folded) is gone (U122c): upright and on a tablet the header keeps its box
  // through a run and says `bar n / m` where it said it at rest; sideways the
  // top line does (`topLine`, below). Nothing else said where you were, then.

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

  /**
   * The summary's own line for a tap on it whose sound did not start (U105a,
   * the reviewer's required change on U105, `responses/f51e8010.md`).
   *
   * The state line that says so lives in the header, and sideways the header
   * is not drawn: the line is mirrored into the bar, and the summary sheet is
   * over the bar. So a refused *Again* sideways showed nothing, and the
   * control looked dead. The bar is not lifted over the sheet — it would bring
   * back six controls meant to be out of reach while the summary is up — and
   * the header is not either: the sheet says it itself, first on the sheet, in
   * the sentence the state line says (`soundOffLine`, drawn in
   * `drawWaitingFor`). Painted only where the header is not drawn (sideways;
   * `style.css` decides, by the query that hides the header), so the learner
   * reads it once; where the header's line shows it above the sheet, this copy
   * is not painted and stays a status a screen reader is told of, which the
   * inert head behind the sheet never allows. Empty otherwise.
   */
  const summaryRefusal = document.createElement('p');
  summaryRefusal.className = 'summary-refusal';
  summaryRefusal.id = 'summary-refusal';
  summaryRefusal.setAttribute('role', 'status');

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

  /**
   * "This offer is no longer on today's card; opened as practice" (D4a): a transfer route whose offer
   * the snapshot does not name, said once, in the header that folds away when a run starts — so the
   * learner knows the run is practice before playing it, and it is never furniture during one.
   */
  const offerNote = document.createElement('p');
  offerNote.className = 'score-offer-note';
  offerNote.id = 'score-offer-note';
  offerNote.hidden = true;
  head.append(offerNote);

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
        // Through the sound's gate, the whole of it (U105): refused, the offer
        // and the record stay and no loop is set, so the tap can be made again.
        withSound(() => {
          // The offer may have gone while the sound was asked for.
          if (session?.running === true || resumeRow.hidden) return;
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
        }, CARRY_ON_TAP);
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
    // The row is drawn again on every render, after ▶'s hold: a refused
    // *Carry on* keeps its mark on the button drawn now (U105).
    markRefused();
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
  /**
   * The phone held sideways (`04` §0 R5), the same query the stylesheet keys
   * the sideways Score on. Read where the script has to place a node the
   * stylesheet cannot: the beat dot, which belongs to whichever surface names
   * the bar.
   */
  // Absent where there is no layout to ask (the unit tests' document): the header then holds the dot.
  const sidewaysQuery =
    typeof window.matchMedia === 'function' ? window.matchMedia('(orientation: landscape) and (max-height: 500px)') : null;

  /**
   * The top line, for a phone held sideways (U122c; c6, `docs/design/score-bar-layout.md` §8.7,
   * §9.1, §10.3): the piece's name on the left and `bar n / m` on the right, in one thin line above
   * the music.
   *
   * Sideways the header is not drawn (R5), and the name and `bar n / m` used to share the bottom row
   * with Back, the status line and every control, where neither had room: the name was cut to its
   * first letters at rest and not drawn at all while paused, and a refusal's sentence, squeezed in
   * beside them, grew the row past the top of the window (U120). At the top they cost the music
   * nothing during a run: the line lies over the band at the stage's top that a run keeps for it,
   * and the sliding sheet sits below that band from the run's start (`style.css`), so starting,
   * pausing and the fold move nothing. At rest the line is as tall as that band, so ▶ moves nothing
   * either.
   *
   * **The moment's sentence takes the name's place while it stands** (`topLineSays`): a sound
   * refusal, the refused start, the first-note cue, the paused notes that carry a cause, and while
   * the hands are on the keys the run's own line. `bar n / m` stays beside it, and yields, whole,
   * only when a refusal cannot fit beside it (`responses/e070d238.md`: "`bar n / m` may yield before
   * the message"). The chip that used to say `bar n / m` over the music while the chrome was folded
   * is this line's folded form: the same box, with the name not drawn.
   *
   * Upright and on a tablet the header says all of this, and this line is not drawn.
   */
  const topLine = document.createElement('div');
  topLine.className = 'score-top';
  topLine.id = 'score-top';
  const titleSide = document.createElement('span');
  titleSide.className = 'score-top__title';
  titleSide.id = 'score-title-side';
  const topSay = document.createElement('span');
  topSay.className = 'score-top__say';
  topSay.id = 'score-top-say';
  const whereSide = document.createElement('span');
  whereSide.className = 'score-top__where';
  whereSide.id = 'score-where-side';
  topLine.append(titleSide, topSay, whereSide);
  section.insertBefore(topLine, stage);

  /** The beat dot where the bar is named: the top line sideways, the header row otherwise. */
  function placeBeatDot(): void {
    if (sidewaysQuery?.matches === true) {
      if (beatDot.parentElement !== topLine) topLine.prepend(beatDot);
    } else if (beatDot.parentElement !== headRow) {
      headRow.insertBefore(beatDot, where);
    }
  }
  placeBeatDot();
  sidewaysQuery?.addEventListener('change', placeBeatDot);
  unsubscribers.push(() => sidewaysQuery?.removeEventListener('change', placeBeatDot));

  /**
   * Back and the ordinary status line at the bottom row's left end, for a phone held sideways
   * (P21d A6; since U122c the name and `bar n / m` are in the top line).
   *
   * Mirrored rather than moved: the header is still the right place upright, where the bar is
   * full, and a node can only be in one place. Kept in step by watching the originals.
   */
  const barLeft = document.createElement('div');
  barLeft.className = 'score-bar__left';
  barLeft.id = 'score-bar-left';
  const backSide = button('← Back', () => leaveScore(), 'score-back-side');
  const statusSide = document.createElement('span');
  statusSide.className = 'score-bar__status';
  statusSide.id = 'score-status-side';
  barLeft.append(backSide, statusSide);
  bar.prepend(barLeft);

  /**
   * What the top line says in the name's place, and what kind of sentence it is; empty for the name.
   *
   * From the signals that make each sentence, never from its words (`responses/e070d238.md`: "Keep
   * this boundary semantic, not string-based"):
   * - a tap whose sound did not start (`soundOffLine`, G86a, U105), whatever the run is doing;
   * - the refused start, a hand with nothing to play (`handRefused`, R19), which the status line says;
   * - paused, only a pause that carries a cause: an option restarted the run or a demonstration
   *   handed it back (`pauseNote`, T33 C1/C2), or the page went away (`awaySeconds`, said without
   *   the pointer to *Start again*, which is one tap away in `⋯`). A pause the learner made with ⏸
   *   says nothing here: the stopped music, the open row and ▶ already say it;
   * - while the hands are on the keys, the run's own line, as the folded chip said it: the
   *   first-note cue, a demonstration's line, the note Wait for me waits for.
   */
  function topLineSays(): { text: string; kind: 'refusal' | 'note' | 'run' | '' } {
    // The summary up: its own first line says a refusal of a tap on it (U105a), and the sentence twice
    // on one screen reads as a glitch. The top line keeps the name.
    if (!sheet.hidden) return { text: '', kind: '' };
    const refused = soundOffLine();
    if (refused !== '') return { text: refused, kind: 'refusal' };
    if (handRefused && (status.textContent ?? '') !== '') return { text: status.textContent ?? '', kind: 'refusal' };
    if (session?.running === true && session.paused) {
      if (pauseNote !== null) return { text: pauseNote, kind: 'note' };
      if (awaySeconds !== null) return { text: STATE_TEXT.away(awaySeconds, true), kind: 'note' };
      return { text: '', kind: '' };
    }
    if (session?.running === true && !helpStrip.isDefaultNow()) return { text: waitingLine.textContent ?? '', kind: 'run' };
    return { text: '', kind: '' };
  }

  const syncSideways = (): void => {
    titleSide.textContent = title.textContent;
    whereSide.textContent = where.textContent;
    const says = topLineSays();
    topSay.textContent = says.text;
    if (says.kind === '') delete topLine.dataset.says;
    else topLine.dataset.says = says.kind;
    // The row's status slot: what the app says (a loop being marked, the ladder's verdict, *Played
    // to the end*), and at rest what the run is waiting for. Never the refusal or the refused start,
    // which the top line says, and never a pause's line, which the row's own ▶ says.
    const atRest = session?.running !== true;
    statusSide.textContent = handRefused
      ? ''
      : (status.textContent ?? '') !== ''
        ? status.textContent
        : atRest && says.kind === '' && !helpStrip.isDefaultNow()
          ? waitingLine.textContent
          : '';
    // `bar n / m` yields to a refusal that cannot fit beside it, whole: never a cut number that reads
    // as another bar (U119a).
    delete topLine.dataset.whereYields;
    if (says.kind === 'refusal' && topLine.getClientRects().length > 0 && topSay.scrollWidth > topSay.clientWidth + 0.5) {
      topLine.dataset.whereYields = 'true';
    }
  };
  const mirror = new MutationObserver(syncSideways);
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
  const restart = button(
    'Start again',
    () =>
      // Through the sound's gate, the whole of it (U105): refused, a
      // demonstration playing goes on and nothing restarts.
      withSound(() => {
        // During a demonstration it is the learner's run that is asked for
        // again, from the top — not the demonstration, which is what it used to
        // restart (the decision document's §3, R15 + *Start again*), and not a
        // run set aside under it, which *again* means starting over (T33).
        if (hearing) {
          hearing = false;
          restartAfterDemo = null;
          clearBeat();
        }
        startRun();
      }, RESTART_TAP),
    'score-restart',
  );

  const playPause = button('▶', () => togglePlay(), 'score-play');
  playPause.setAttribute('aria-label', 'Play');
  // Held while a transfer offer's snapshot is unread (D4a): `render` keeps it in step.
  playPause.disabled = offerPending();
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
      const was = mode;
      mode = value as Mode;
      // A mode chosen by hand is a mode met for the first time as much as one
      // arrived at by default.
      maybeFirstSight({ key: `mode:${modeKey()}`, entry: MODE_HELP[modeKey()], id: 'score' });
      noteChange('mode', modeLabel(was), modeLabel(mode));
      restartForOption(RESTARTED_WITH.mode(modeLabel(mode)));
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

  /**
   * The bar is on more than one line, or a control that stays is too small.
   *
   * The lines are the controls' (U119a): the left group, sideways, is not
   * counted. A second line is a control that starts below another's foot, not
   * one whose top differs: under `align-items: center` a shorter control's top
   * is lower on the same line, and at 90 % text the tempo label (36 px) read as
   * a line of its own beside 40-px buttons, sending Hands and `Hear it` behind
   * `⋯` on every screen, a tablet's included (U122c's matrix). The tap minimum
   * is read in the pixels it is drawn in (U124): `TAP_MIN_PX` against a floor
   * written `max(2.5rem, 40px)` in both dimensions.
   */
  function barIsOverfull(): boolean {
    const boxes = [...bar.children]
      .filter((k) => k !== barLeft && k !== countIn && k.getBoundingClientRect().height > 0)
      .map((k) => k.getBoundingClientRect());
    const firstFoot = Math.min(...boxes.map((b) => b.bottom));
    if (boxes.some((b) => b.top >= firstFoot - 1)) return true;
    for (const el of [playPause, moreButton]) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.width < TAP_MIN_PX - 0.5 || r.height < TAP_MIN_PX - 0.5)) return true;
    }
    return false;
  }

  /**
   * Sideways, Back does not fit in the room the controls leave the left group
   * (U119a, `responses/fa4563d1.md`: a control goes behind `⋯` "before Back
   * ... is clipped"). Since U122c `bar n / m` is on the top line, where it
   * never yields to a control, so Back is the group's one fixed text; the
   * status line gives its room first and ends at its own ellipsis. Upright the
   * group is not drawn, and nothing is cut.
   */
  function leftGroupIsCut(): boolean {
    if (barLeft.getClientRects().length === 0) return false;
    return backSide.getBoundingClientRect().right > barLeft.getBoundingClientRect().right + 0.5;
  }

  /**
   * The words the row draws: the mode's sentence or its word, the tempo with
   * or without its percentage (U122 §3.1–3.3, the chooser U122c builds).
   */
  let labels: { mode: 'long' | 'short'; tempo: 'long' | 'short' } = { mode: 'long', tempo: 'long' };

  /**
   * The width an item takes at its widest content, laid out unseen in the
   * bar under the bar's own rules, so its price never depends on what it says
   * now: a mode chosen or a tempo changed never moves the row.
   */
  function widestIn(el: HTMLElement, texts: readonly string[]): number {
    const copy = el.cloneNode(false) as HTMLElement;
    copy.removeAttribute('id');
    Object.assign(copy.style, { position: 'absolute', visibility: 'hidden', width: 'auto', minWidth: '0', maxWidth: 'none', flex: 'none' });
    bar.appendChild(copy);
    let widest = 0;
    for (const text of texts) {
      if (copy instanceof HTMLSelectElement) {
        const option = document.createElement('option');
        option.textContent = text;
        copy.replaceChildren(option);
      } else {
        copy.textContent = text;
      }
      widest = Math.max(widest, copy.getBoundingClientRect().width);
    }
    copy.remove();
    return Math.ceil(widest);
  }

  /**
   * The mode select in the form chosen, at the widest of its four labels in
   * that form (U121: the selected mode is whole; U122 S14). It had a floor
   * under every label and an id that outranked the sideways `flex: none`, so
   * it was the item that gave silently: *Wa* for *Wait*, *Ke* for *Keep
   * tempo*, upright *Tempo* cut too.
   */
  function applyModeLabels(): void {
    const words = MODES.map((m) => (labels.mode === 'short' ? SHORT_MODES[m.id] : m.label));
    for (const option of [...modeSelect.options]) {
      const id = option.value as Mode;
      option.textContent = labels.mode === 'short' ? SHORT_MODES[id] : (MODES.find((m) => m.id === id)?.label ?? id);
    }
    Object.assign(modeSelect.style, { flex: '0 0 auto', minWidth: '0', maxWidth: 'none', width: `${String(widestIn(modeSelect, words))}px` });
  }

  /** The tempo label's words in the form chosen: the bpm is what is read while playing (`04` §5). */
  function tempoText(): string {
    const bpm = String(Math.round(bpmNow()));
    return labels.tempo === 'short' ? `${bpm} bpm` : `${String(tempoPct)}% · ${bpm} bpm`;
  }

  /** The tempo label at the widest it can read in this form: the slider's top, as many digits as the piece's bpm there. */
  function applyTempoLabel(): void {
    const top = Number(tempo.max);
    const eights = '8'.repeat(String(Math.round((bpmNow() / Math.max(1, tempoPct)) * top)).length);
    const widest = labels.tempo === 'short' ? `${eights} bpm` : `${String(top)}% · ${eights} bpm`;
    tempoLabel.textContent = tempoText();
    Object.assign(tempoLabel.style, { flex: '0 0 auto', width: `${String(widestIn(tempoLabel, [widest, tempoLabel.textContent]))}px` });
    // `Hear it` at the wider of its two words: during a demonstration it reads *Stop* and is the one
    // control drawn, at the floor, and the row does not move when it changes (U122 §3.1).
    hearButton.style.minWidth = `max(2.5rem, 40px, ${String(widestIn(hearButton, ['Hear it', 'Stop']))}px)`;
  }

  /**
   * The control a standing sentence names, which must not be the one sent
   * behind `⋯` while the sentence stands (`responses/759596b4.md` 3(b): "a
   * visible recovery/refusal instruction must never direct the learner to a
   * control that the same layout has just hidden"): `Hear it` refused, or a
   * hand, refused or named by the refused start (*choose L or Both*).
   */
  function namedByASentence(): HTMLElement | null {
    const refused = refusedNow();
    if (refused?.id === 'score-hear') return hearButton;
    if (refused?.id.startsWith('score-hands-') === true || handRefused) return handsGroup;
    return null;
  }

  /**
   * **Hands at the tap floor, where it keeps its place (U122c).** Each of `R`, `L` and `Both` meets the
   * floor a sentence's control must meet (U124, widened by U122b), which makes the three about half as
   * wide again. On a narrow upright row (342 × 740, 360 × 780) that width sends Hands behind `⋯` where
   * it sat on the row: a control leaving the screen, which is a product trade, not this lane's to choose
   * (`responses/adb0873a.md` §1). So the floor is given wherever Hands keeps its place with it, and where
   * only the floor would send it away it keeps today's width (`data-floor='false'`) and the trade goes to
   * the reviewer. Sideways and on a tablet, in every cell measured, it keeps its place at the floor.
   */
  /** What the last fit was for, so a render that changes none of it measures nothing. */
  let fittedFor = '';

  /**
   * Today's row (before U122c), as a fallback upright: the mode's sentence or word by the window's width
   * (440 px), the select and the tempo label free to give their room, Hands and `Hear it` at their own
   * widths, a control leaving only when the row wraps. Returns what it keeps on the row.
   *
   * **Upright the chooser's whole words cost a control** (U122c's matrix): the mode priced at its widest
   * label and the bpm never cut leave a 342 or 360 px row no room for Hands where today's row, its mode
   * cut, kept it. U122 put *a whole mode label before Hands* to the reviewer as a choice (§5.4) and it was
   * never ruled; a control leaving the screen is a product trade (`responses/adb0873a.md` §1), so upright
   * today's row stands wherever the chooser would keep less of it (`data-row='today'`), and the trade is
   * reported. Sideways the chooser governs (U121 is settled there, and Hands keeps its place in every
   * cell measured); on a tablet there is room for both.
   */
  function fitToday(): Set<HTMLElement> {
    for (const entry of OVERFLOW_ORDER) bringBackToBar(entry.el);
    handsGroup.dataset.floor = 'false';
    const narrow = window.innerWidth < 440;
    labels = { mode: narrow ? 'short' : 'long', tempo: narrow ? 'short' : 'long' };
    for (const option of [...modeSelect.options]) {
      const id = option.value as Mode;
      option.textContent = labels.mode === 'short' ? SHORT_MODES[id] : (MODES.find((m) => m.id === id)?.label ?? id);
    }
    Object.assign(modeSelect.style, { flex: '', minWidth: '', maxWidth: '', width: '' });
    tempoLabel.textContent = tempoText();
    Object.assign(tempoLabel.style, { flex: '0 1 auto', width: '' });
    hearButton.style.minWidth = '';
    for (const entry of OVERFLOW_ORDER) {
      if (!barIsOverfull() && !leftGroupIsCut()) break;
      sendToSheet(entry);
    }
    return new Set(OVERFLOW_ORDER.map((entry) => entry.el).filter((el) => el.parentElement === bar));
  }

  /**
   * Puts as much on the bar as it can hold, and the rest in the sheet: U122's
   * chooser (`docs/design/score-bar-layout.md` §3.3), smaller since U122c
   * (§8.7): the first configuration that fits, in the order things give —
   * the tempo's percentage, then the mode's sentence, then Hands behind `⋯`,
   * then `Hear it`. ▶, `⋯`, the mode's word, the bpm and Back never give.
   * A control a standing sentence names is the last to leave.
   *
   * Everything comes back first, so a phone turned sideways gets its controls
   * back rather than keeping whatever the narrower way up decided. Skipped
   * while the sheet is open, because the stash's children are inside it then
   * and moving them would empty it under the owner's finger.
   */
  function fitBarControls(): void {
    if (document.getElementById('score-more-sheet')) return;
    const named = namedByASentence();
    const key = [
      window.innerWidth,
      window.innerHeight,
      getComputedStyle(document.documentElement).fontSize,
      getComputedStyle(bar).fontFamily,
      String(Math.round(bpmNow())).length,
      named?.className ?? '',
      bar.clientWidth,
    ].join('|');
    if (key === fittedFor) {
      tempoLabel.textContent = tempoText();
      return;
    }
    const today = sidewaysQuery?.matches === true ? null : fitToday();
    for (const entry of OVERFLOW_ORDER) bringBackToBar(entry.el);
    const order = [...OVERFLOW_ORDER].sort((a, b) => Number(a.el === named) - Number(b.el === named));
    const forms: ['long' | 'short', 'long' | 'short'][] = [
      ['long', 'long'],
      ['long', 'short'],
      ['short', 'long'],
      ['short', 'short'],
    ];
    fit: for (let leave = 0; leave <= order.length; leave += 1) {
      if (leave > 0) sendToSheet(order[leave - 1]!);
      // Hands at the tap floor first; at its own width only where the floor alone would send it
      // behind `⋯` (the trade described above `fittedFor`, left as it was until it is decided).
      for (const floor of handsGroup.parentElement === bar ? [true, false] : [true]) {
        handsGroup.dataset.floor = String(floor);
        for (const [mode, tempoForm] of forms) {
          labels = { mode, tempo: tempoForm };
          applyModeLabels();
          applyTempoLabel();
          if (!barIsOverfull() && !leftGroupIsCut()) break fit;
        }
      }
    }
    if (handsGroup.parentElement !== bar) handsGroup.dataset.floor = 'true';
    delete bar.dataset.row;
    if (today !== null && [...today].some((el) => el.parentElement !== bar)) {
      fitToday();
      bar.dataset.row = 'today';
    }
    fittedFor = key;
    // The row's height is the stage's reserve; it changes only with what is on it.
    measureBar();
  }

  window.addEventListener('resize', () => render());
  window.addEventListener('resize', fitBarControls);
  unsubscribers.push(() => window.removeEventListener('resize', fitBarControls));

  const handsGroup = document.createElement('div');
  handsGroup.className = 'score-group';
  // One control made of three segments, and it says so.
  //
  // `R`, `L` and `Both` were about 20 px wide each, defended as one 92 x 40
  // segmented control where a slip costs a tap to undo. A sentence names each
  // of them on its own — *choose L or Both*, *tap R again* — so each is a
  // target the learner is told to hit, and since U122c each meets the floor
  // (U124, widened by U122b, `responses/e070d238.md`: every control a
  // learner-facing sentence names), `style.css`. The group mark stays for the
  // sweep, which reads the three as one control.
  handsGroup.dataset.tapGroup = '';
  for (const hand of HANDS) {
    handsGroup.appendChild(
      button(
        hand.label,
        () => {
          // The hand already chosen, pressed again: nothing changes, so nothing
          // is restarted (T33). It used to start the run again from bar 1 —
          // the pass under the learner thrown away by a tap that asked for
          // nothing, the fault `setBars` closed for its own `−` at one bar.
          if (hands === hand.id && !handRefused) {
            render();
            return;
          }
          // After *Nothing for the … hand* no run is going and this tap starts
          // one: through the sound's gate, the whole of it (U105), so a refusal
          // leaves the hand as it was. Any other change of hand restarts a run
          // already going, or none, and asks for nothing.
          if (handRefused && session?.running !== true) {
            withSound(() => {
              if (handRefused && session?.running !== true) chooseHand(hand);
            }, { id: `score-hands-${hand.id}`, control: hand.label });
            return;
          }
          chooseHand(hand);
        },
        `score-hands-${hand.id}`,
      ),
    );
    handsGroup.lastElementChild?.setAttribute('aria-label', hand.spoken);
  }
  bar.appendChild(handsGroup);

  /** A different hand chosen: the run restarts with it, or after a refusal a run starts (T33). */
  function chooseHand(hand: (typeof HANDS)[number]): void {
    const was = hands;
    hands = hand.id;
    forgetPlayingHand();
    renderer?.setHandsFocus(hand.id);
    // The sentence named the hand that was refused, and the hand has
    // just changed, so it is about nothing now.
    if (handRefused) status.textContent = '';
    noteChange('hands', was === 'both' ? 'Both' : was, hand.label);
    if (handRefused && session?.running !== true) startRun();
    else restartForOption(RESTARTED_WITH.hands(hand.id));
    render();
  }

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
  // The count-in, in the row beside ⏸ (U122c): placed by `drawChrome` once ⏸ is where it stays.
  bar.appendChild(countIn);

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
    // From the tempo the run has, not from `tempoPct`: the drag's `input`
    // events have already moved that to where the finger came off.
    noteChange('tempo', String(tempoApplied), String(tempoPct));
    restartForOption(RESTARTED_WITH.tempo(tempoPct));
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
      const was = input;
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
      noteChange('input', inputLabel(was), inputLabel(input));
      restartForOption(input === 'none' ? RESTARTED_WITH.noInput : RESTARTED_WITH.input(inputSaid(input)));
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
    const was = loopLabel();
    loopBars = { from: chosen.fromMeasure, to: chosen.toMeasure };
    loopSection = chosen;
    noteChange('loop', was, loopLabel());
    restartForOption(RESTARTED_WITH.loop(loopLabel()));
    render();
  });

  const loopButton = button('Loop', () => clearLoop(), 'score-loop');

  const metronomeButton = button(
    'Off',
    () => {
      metronomeOn = !metronomeOn;
      // Live: the run goes on, and the summary says where the click changed
      // so its numbers are read against it (T33, C5).
      noteChange('metronome', metronomeOn ? 'off' : 'on', metronomeOn ? 'on' : 'off');
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
      noteChange('rhythm', rhythmOnly ? 'off' : 'on', rhythmOnly ? 'on' : 'off');
      restartForOption(RESTARTED_WITH.rhythm(rhythmOnly));
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
      noteChange('duet', next === 'none' ? 'on' : 'off', next === 'none' ? 'off' : 'on');
      restartForOption(RESTARTED_WITH.duet(next === 'none' ? null : duetPlays(next)));
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
   * The three rows whose control can be refused, named so the refusal can be
   * said on them (T33): the Metronome in Free play (C3), and Blind and
   * Perform while a run is going (C4). On the label, not the hint, because
   * sideways the sheet hides every hint.
   */
  const metronomeRow = menuRow('Metronome', 'The click, on or off.', metronomeButton);
  metronomeRow.id = 'score-metronome-row';
  const blindRow = menuRow(
    'Blind',
    'Hides the notation so you play from memory. The app still follows you and still marks what you play.',
    blindToggle,
  );
  blindRow.id = 'score-blind-row';
  const performanceRow = menuRow(
    'Perform',
    'One pass, start to finish: no restarts, no loop, and it is kept as a performance rather than practice.',
    performanceToggle,
  );
  performanceRow.id = 'score-performance-row';

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
    metronomeRow,
    barsRow,
    menuRow('Size', 'Bigger or smaller notes, around whatever already fits.', zoomOut, zoomLabel, zoomIn),
    layoutRow,
    menuRow('Keys', 'The keyboard under the score: the full strip, a thin ribbon that names the note, or nothing.', keysGroup),
    menuRow('Sound', 'Whether the phone or the piano plays the hand you are not practising.', destinationButton),
    // Under Sound, which is where it comes out, and next to the hand buttons'
    // consequence rather than three screens away in Settings.
    duetRow,
    blindRow,
    performanceRow,
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
    restartForOption(RESTARTED_WITH.bars(settings.barsPerWindow));
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
    restartForOption(RESTARTED_WITH.layout(next === 'scroll'));
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
   *
   * None of the three is leaving the screen (G86). The sheet sits on `body`,
   * outside the `main` the app shell empties on a route change, and it puts
   * everything else on `body` out of reach until it closes, so Back with it
   * open left it over the next screen and that screen inert beneath it. Its
   * closer goes on `openSheets`, which the screen's disposer drains, and comes
   * off again when the sheet goes by any of its own three paths, so the list
   * holds the open sheets and nothing else.
   */
  function openStashedSheet(heading: string, id: string, stash: HTMLElement): void {
    if (document.getElementById(id)) return;
    const sheet = openSheet(heading, { id });
    sheet.body.append(...Array.from(stash.children));
    render();
    const restore = (): void => {
      observer.disconnect();
      stash.append(...Array.from(sheet.body.children));
      const at = openSheets.indexOf(closer);
      if (at >= 0) openSheets.splice(at, 1);
    };
    const observer = new MutationObserver(() => {
      if (sheet.el.isConnected) return;
      restore();
    });
    observer.observe(document.body, { childList: true });
    const closer = (): void => {
      restore();
      if (sheet.el.isConnected) sheet.close();
    };
    openSheets.push(closer);
  }

  function setBpm(wanted: number): void {
    if (!Number.isFinite(wanted) || wanted <= 0) return;
    tempoPct = Math.min(130, Math.max(30, Math.round((wanted / writtenBpm()) * 100)));
    tempo.value = String(tempoPct);
    raiseLadderCeiling();
    noteChange('tempo', String(tempoApplied), String(tempoPct));
    restartForOption(RESTARTED_WITH.tempo(tempoPct));
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
      // A note into a judging run (Wait for me has no count-in to pass): the activity is attempted (X1).
      if (session?.running === true && (session.mode === 'wait' || session.mode === 'tempo')) sessionRun?.attempted();
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
   *
   * **Where the sound is not running (U105; the reviewer's correction in
   * `responses/questions-bd7d303e.md`).** With it running, or with no Web
   * Audio, the key starts the run at once, exactly as before. Otherwise the two
   * keys are different events:
   *
   * - A key on a **connected piano** is a Web MIDI message, not a user
   *   activation, so it cannot be what lets the sound start. It asks nothing,
   *   starts nothing, is not kept to be played later, and the state line says
   *   to tap ▶, whose tap can.
   * - A key on the **screen** is a tap, so it asks through `withSound` like any
   *   other. Where the answer comes after the key's own moment — the wait is up
   *   to `PLAY_SOUND_WAIT_MS` — the run starts and the key is not played into
   *   it: its time is from before the run began, and a first note timed then
   *   would set the run's clock back (a Keep tempo run holding for it takes
   *   its clock from it). The run then waits for the first note, as after ▶.
   */
  /** A sheet (the ⋯ controls, the tempo) is open over the score. */
  function sheetOpen(): boolean {
    return document.querySelector('.sheet__panel[role="dialog"]') !== null;
  }

  /** Whether a key may start a run now (T8): checked at the key, and again when the sound has started. */
  function keyMayStart(): boolean {
    if (!session || session.running || !sheet.hidden || hearing || sheetOpen()) return false;
    if (endedSinceLastStart) return false;
    return input === 'midi' || input === 'keys';
  }

  function startFromKey(event: InputNoteEvent): void {
    if (!keyMayStart()) return;
    // Another tap is already waiting for the sound: this key adds nothing.
    if (startingSound) return;
    if (event.source !== 'screen' && audioEngine.supported && audioEngine.state !== 'running') {
      soundRefusedBy = KEY_TAP;
      render();
      return;
    }
    // True for as long as this key's own event is being handled: `withSound`
    // runs its act inside it where the sound is already running.
    let inTheKeysMoment = true;
    withSound(() => {
      if (!keyMayStart() || !session) return;
      startRun();
      if (!session.running) return;
      // Started after the key's moment: not played in, never back-dated.
      if (!inTheKeysMoment) return;
      // The key is the first note only where the learner plays first: Wait and
      // Free, or a Keep tempo run holding for them. When the app leads, the key
      // only starts it — played in, it was marked a wrong note before anything
      // had been played (T8 review 2).
      const learnerFirst = mode === 'wait' || mode === 'free' || session.armed;
      if ((session.prepared?.countInMs ?? 0) === 0 && learnerFirst) {
        session.feed(event.midi, event.velocity, event.tMs, event.confidence ?? 1);
      }
    }, KEY_TAP);
    inTheKeysMoment = false;
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
        // is what the line below promises (T8 review, M1). Paused, it restarts
        // paused, like any option changed while paused (T33, C2).
        noteChange('input', inputLabel('mic'), inputLabel('none'));
        restartForOption(RESTARTED_WITH.noInput);
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
  function startRun(
    options: {
      latch?: boolean;
      preview?: boolean;
      /**
       * `false` for a start the learner did not ask for as a new run: an
       * option restarting the run, the ladder, a demonstration. Those carry
       * the list of what changed on to the run the summary will report (T33,
       * C5); every other start begins it again.
       */
      fresh?: boolean;
      /** Start held paused, for an option changed while paused (T33, C2). */
      paused?: boolean;
    } = {},
  ): void {
    if (!session || !model) return;
    // A transfer route whose offer is not yet read starts nothing (D4a): every start comes here — ▶,
    // a key, a restart, the ladder, a demonstration — so this is the one gate.
    if (offerPending()) return;
    // The last run's question, if it was never answered: let go (T37, T40).
    flushPendingRecord();
    if (options.fresh !== false) resetChanges();
    // A one-bar preview ends when its loop comes round, and until T31 that was
    // the *only* thing that ended it: clear the loop under it and the run goes
    // to the end of the piece instead, `onFinished` returns without ending the
    // preview, and `hearingBar` stays set for the rest of the visit -- every
    // later run a Listen run under a selector saying otherwise. Anything that
    // starts a run now gives the screen back what the preview borrowed first.
    if (hearingBar && options.preview !== true) endBarPreview();
    // Only a demonstration plays over a run set aside (T33, C1); any other
    // start is the run the learner has now asked for, and replaces it.
    if (!hearing && session.hasSuspended) {
      session.dropSuspended();
      setAside = null;
    }
    endedSinceLastStart = false;
    handRefused = false;
    awaySeconds = null;
    pauseNote = null;
    tempoApplied = tempoPct;
    summaryUp(false);
    changedLine = null;
    // A new run keeps its own totals, so the ladder's first pass is measured
    // from nought again.
    ladderPassBase = { missed: 0, wrong: 0, early: 0 };
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
      // And nothing to judge (L42, `05` §3): the clock moves the cursor and no
      // note is marked, where every window used to close red as a miss behind
      // a sheet saying the run was not measured.
      judging: listening(),
      ...(options.latch === false ? { holdAtStart: false } : {}),
      ...(options.paused === true ? { startPaused: true } : {}),
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
      // No run, so no run for a summary to be about: what changed is
      // nothing's, and the start that follows the refusal begins afresh.
      resetChanges();
      status.textContent =
        hands === 'both'
          ? 'Nothing to play in this piece'
          : `Nothing for the ${hands === 'L' ? 'left' : 'right'} hand in this piece — choose ${hands === 'L' ? 'R' : 'L'} or Both`;
      render();
      return;
    }
    // The standing refusal (U105): its sentence never stands while ▶ reads ⏸.
    // A start that makes ▶ read ⏸ lets it go, here, where every start passes;
    // one held paused, or a demonstration, where ▶ still reads ▶, keeps it,
    // still true. A tap through the gate has already cleared it as it asked.
    if (playReadsPause()) soundRefusedBy = null;
    // The app is about to play the music to the learner (T40): a sight-read
    // of it is no longer a first reading, whatever run comes next.
    if (runMode === 'listen') {
      phraseHeard = true;
      // …and it is written down (G1), as the learner asked for it: `Hear it`
      // and a bar held down are the app demonstrating, *Play it to me* is a
      // hearing — one playback, one row, one kind — over the bars the loop
      // confines it to, or the whole.
      noteHearing(hearing || hearingBar ? 'demonstrated' : 'heard', loop === undefined || loopBars === null ? undefined : [loopBars.from, loopBars.to]);
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
    // A run's start is a moment of its own: whatever peek was open closes, and
    // `render` folds the controls to ⏸ in ▶'s place (U122c).
    endPeek();
    render();
  }

  /**
   * ▶ reads ⏸: a run going and not paused. Not during a demonstration (T33):
   * ▶ then ends it and starts or carries on the learner's own run, which is
   * not playing, so the button says ▶. It said ⏸, and pressing it did not
   * pause anything. Also what lets a standing refusal go (`startRun`, U105).
   */
  function playReadsPause(): boolean {
    return session?.running === true && !session.paused && !hearing;
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
   * Whether any input is listening to the run: the one fact behind `judging`
   * on its start (L42) and the ladder's hold at a lap (T42). Choosing an
   * input restarts the run, so at a lap boundary this is still the input the
   * lap was judged by.
   */
  function listening(): boolean {
    return input !== 'none';
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
   * **A pass nothing judged holds** (T42). With no input listening no miss is
   * counted (L42), so the comparison above reads such a pass as clean, and
   * the ladder climbed to the written tempo on passes nobody played — before
   * L42 it walked down on misses nobody made. Neither is a verdict on the
   * learner, so the tempo is left where it is and the line says why.
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
    // An early note is a mistake in a pass too (T37): it used to arrive here
    // as a wrong note and a miss, and counting it once must not make it none.
    const clean =
      score.missedTotal === ladderPassBase.missed &&
      score.wrongNotesTotal === ladderPassBase.wrong &&
      (score.early ?? 0) === ladderPassBase.early;
    ladderPassBase = {
      missed: score.missedTotal,
      wrong: score.wrongNotesTotal,
      early: score.early ?? 0,
    };
    if (!listening()) {
      status.textContent = LADDER_TEXT.line(LADDER_TEXT.nothingListening, tempoPct, tempoPct);
      render();
      return;
    }
    const next = nextLadderTempo({
      enabled: true,
      tempoPct,
      startedAtPct: ladderCeilingPct,
      clean,
    });
    status.textContent = LADDER_TEXT.line(clean ? LADDER_TEXT.clean : LADDER_TEXT.mistake, tempoPct, next);
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
      if (session?.running === true) startRun({ latch: false, fresh: false });
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

  /**
   * `Hear it`, pressed: the sound started inside the tap, then the toggle (U67).
   *
   * Where the context is not running yet (the first tap after a reload on a
   * phone, which will not start audio without one) the tap awaits the engine's
   * start before anything is scheduled, as the microscope does, so the piece is
   * not timed on a clock that has not begun. Where it is running, or there is
   * no Web Audio to start, the toggle runs at once as it always did. A stop
   * needs no sound and never waits.
   *
   * Through ▶'s gate (G86a, the reviewer's word in
   * `responses/questions-ecccffb7.md`): its own wait was unbounded and shared
   * `startingSound`, so a start that never answered left every later ▶
   * returning before it asked. Bounded now, and a wait that ends with the
   * sound still off starts no demonstration and says so. With no Web Audio at
   * all, where no tap could ever start a sound, the demonstration still
   * moves, silent, as it did before.
   */
  function toggleHear(): void {
    if (!session) return;
    if (hearing) {
      toggleHearNow();
      return;
    }
    withSound(toggleHearNow, HEAR_TAP);
  }

  /** `Hear it`: start a Listen run, or stop the one this button started. */
  function toggleHearNow(): void {
    if (!session) return;
    // `Hear it` stops the session outright, and a stop is not a finish the
    // screen hears back, so a preview left running under it would never end.
    if (hearingBar) endBarPreview();
    if (hearing) {
      endDemonstration('stop');
      return;
    }
    // During a run: the run is set aside, paused, the piece is played, and
    // the run comes back where it was when the playing stops (T33, C1). It
    // used to be stopped — the middle of a run thrown away, with nothing
    // said, by the control a beginner presses most — and before that it was
    // only stopped (`08` §7.1).
    if (session.running) {
      const bar = runBar();
      const base = ladderPassBase;
      if (session.suspend()) {
        setAside = { ladderPassBase: base, bar: bar ?? 1 };
        if (bar !== null && !heardAt.includes(bar)) heardAt.push(bar);
      }
    }
    hearing = true;
    // Not a fresh start: a run set aside keeps what changed during it.
    startRun({ fresh: false });
  }

  /**
   * The demonstration is over — stopped by `Hear it`, played to its end, or
   * ended by ▶ — and the screen goes back to what it interrupted (T33, C1).
   *
   * With a run set aside under it, that run comes back where it was, paused,
   * and the state line says where and what to press; ▶ carries it straight
   * on. Where a restarting option was changed while it played, the run under
   * it was dropped and it restarts instead, paused (C2), or playing for ▶.
   * With no run under it, the demonstration simply ends, as it always did.
   */
  function endDemonstration(how: 'stop' | 'end' | 'play'): void {
    if (!session) return;
    hearing = false;
    clearBeat();
    const restart = restartAfterDemo;
    restartAfterDemo = null;
    if (restart !== null) {
      session.stop();
      if (how === 'play') startRun({ fresh: false });
      else restartPaused(restart);
      showBar();
      render();
      return;
    }
    if (session.hasSuspended) {
      const kept = setAside;
      setAside = null;
      session.restoreSuspended();
      if (kept) ladderPassBase = kept.ladderPassBase;
      // The click may have been switched while the piece played; the run
      // carries the setting the row shows now, and picks it up on its resume.
      session.setMetronome(metronomeOn);
      if (how === 'play') {
        awaySeconds = null;
        session.resume();
      } else {
        pauseNote = STATE_TEXT.pausedAt(runBar() ?? kept?.bar ?? 1);
      }
      showBar();
      render();
      return;
    }
    if (how === 'end') status.textContent = 'Played to the end.';
    else session.stop();
    if (how === 'play') startRun();
    render();
  }

  /**
   * An option that changes what is judged, changed with a run going (`04` §5,
   * T33): the run restarts, because it cannot carry half of each.
   *
   * **Paused, it restarts paused** (C2). A learner who pauses and then
   * reaches for a hand has not asked for the music to start; the restart goes
   * back to the run's first bar and waits for ▶, and the state line says what
   * changed. Under a demonstration with a run set aside, the run set aside is
   * not the one now asked for: it is dropped, the demonstration goes on with
   * the new setting, and the restart comes when the demonstration ends. With
   * no run, nothing starts (principle 1 of the decision document).
   */
  function restartForOption(what: string): void {
    if (!session) return;
    if (hearing && (session.hasSuspended || restartAfterDemo !== null)) {
      session.dropSuspended();
      setAside = null;
      restartAfterDemo = what;
      startRun({ fresh: false });
      return;
    }
    if (session.running !== true) return;
    if (session.paused && !hearing && hearingBar === null) {
      restartPaused(what);
      return;
    }
    startRun({ fresh: false });
  }

  /** The run again from its first bar, held paused, saying why (T33, C2). */
  function restartPaused(what: string): void {
    startRun({ fresh: false, paused: true });
    // Refused — a hand with nothing to play — and the refusal has said so.
    if (session?.running !== true) return;
    pauseNote = STATE_TEXT.restarted(runBar() ?? 1, what);
    // Three seconds before the chrome folds, as after any pause, rather than
    // the 0.7 s a run gets when it starts playing: nothing is playing, and the
    // line saying why the cursor went back to bar 1 is in the header.
    showBar();
    render();
  }

  /**
   * The printed bar the learner's run is at: the run set aside under a
   * demonstration, or the run going. `null` with no run of the learner's —
   * nothing going, or only a demonstration.
   */
  function runBar(): number | null {
    if (!session || !model) return null;
    const step = session.hasSuspended
      ? session.suspendedStep
      : session.running && !hearing && hearingBar === null
        ? (session.state?.step ?? null)
        : null;
    if (step === null) return null;
    const measure = model.steps[step]?.sourceMeasureIndex;
    return measure === undefined ? null : printedBar(measure);
  }

  /**
   * Remembers what changed during the run for the summary (T33, C5): the
   * setting, where it started from, what it became, and the bar the run was
   * at. A change and its undoing cancel out. With the summary up it is a
   * change after the run, said as such; with no run at all it is a setting,
   * not a change to anything.
   */
  function noteChange(key: RunChangeKey, from: string, to: string): void {
    if (from === to) return;
    const after = !sheet.hidden;
    const bar = after ? null : runBar();
    if (!after && bar === null) return;
    const into = after ? changedAfter : changedDuring;
    const first = into.get(key)?.from ?? from;
    if (first === to) into.delete(key);
    else into.set(key, { from: first, to, bar });
    if (after) drawChanged();
  }

  function resetChanges(): void {
    changedDuring.clear();
    changedAfter.clear();
    heardAt = [];
  }

  /** The summary's *Changed* line, from what was noted (T33, C5). */
  function changedText(): string {
    const said: string[] = [];
    for (const [key, change] of changedDuring) {
      said.push(
        SUMMARY_TEXT.changed(key, change.to, SUMMARY_TEXT.atBar(change.bar ?? 1), change.from),
      );
    }
    if (heardAt.length > 0) said.push(SUMMARY_TEXT.heard(heardAt));
    for (const [key, change] of changedAfter) {
      said.push(SUMMARY_TEXT.changed(key, change.to, SUMMARY_TEXT.afterTheRun, change.from));
    }
    return said.join('; ');
  }

  function drawChanged(): void {
    if (!changedLine) return;
    const text = changedText();
    changedLine.dd.textContent = text;
    changedLine.dt.hidden = text === '';
    changedLine.dd.hidden = text === '';
  }

  /** What the mode selector calls a mode, in the words the summary uses. */
  function modeLabel(id: Mode): string {
    return MODES.find((m) => m.id === id)?.label ?? id;
  }

  /** The Input row's own word for an input. */
  function inputLabel(id: FollowInput): string {
    return INPUTS.find((i) => i.id === id)?.label ?? id;
  }

  /** What the run listens to, in a sentence (C2). */
  function inputSaid(id: FollowInput): string {
    if (id === 'midi') return 'the piano';
    if (id === 'mic') return 'the microphone';
    if (id === 'keys') return 'the screen keys';
    return 'nothing';
  }

  /** The loop as the summary names it: `off`, or the bars or the section. */
  function loopLabel(): string {
    if (loopSection) return loopSection.label;
    if (loopBars) return `bars ${String(shownBar(loopBars.from))}–${String(shownBar(loopBars.to))}`;
    return 'off';
  }

  /** Which hand the duet plays, in the words its row uses. */
  function duetPlays(which: PlaybackHands): string {
    if (which === 'both') return 'both hands';
    return `the ${hands === 'R' ? 'left' : 'right'} hand`;
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
      placeCount();
    } else {
      countIn.hidden = true;
      countIn.replaceChildren();
      // The count-in is over and a judging run is on: the session's activity is attempted (X1).
      if (runMode === 'wait' || runMode === 'tempo') sessionRun?.attempted();
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

  /**
   * ▶: a pause at once, and anything that makes a sound through `withSound`
   * (U69) — a new run, a paused run carried on, the run asked for over a
   * demonstration.
   */
  function togglePlay(): void {
    if (!session) return;
    // A pause needs no sound and never waits.
    if (!hearing && session.running && !session.paused) {
      session.pause();
      render();
      return;
    }
    withSound(playNow);
  }

  /**
   * ▶'s branches that make a sound, against the screen as it is when they run
   * — at once, or when `withSound`'s wait is over, by which time a key may
   * have started a run or the demonstration have played to its end. Never a
   * pause: the tap asked for the music.
   */
  function playNow(): void {
    if (!session) return;
    // Pressing Play during a `Hear it` run is asking for the run you chose,
    // not for the demonstration to carry on — and where a run was set aside
    // under it, that run, carried on from where it was (T33, C1).
    if (hearing) {
      endDemonstration('play');
      return;
    }
    if (!session.running) startRun();
    else if (session.paused) {
      awaySeconds = null;
      pauseNote = null;
      session.resume();
    }
    render();
  }

  /**
   * Runs `act` with the sound asked to start inside the tap (U69), and only
   * once it has started (G86a).
   *
   * The engine's first-gesture start (`startOnFirstGesture`) is one-shot: it
   * went with the visit's first tap. When the platform suspends the context
   * later — the screen locked, a call — nothing on ▶'s path started it again,
   * and the run went on against a suspended context, silent. `ensureStarted()`
   * is only honoured inside a user activation (`AudioEngine.ts`, Android), so
   * it is called here, in the tap, rather than on the page coming back into
   * view, which is not one. The tap then waits for it, at most
   * `PLAY_SOUND_WAIT_MS`, with ▶ held and saying it is busy when the tap was
   * ▶'s.
   *
   * **One check where the wait ends** (G86a, the reviewer's ruling in
   * `responses/970fd770.md`). Whichever comes first — the bound, the start
   * answering, the start failing — `act` runs only where the engine then reads
   * `running`. U69 ran it however the wait ended, so a start that never
   * answered, failed, or answered with the context still suspended started or
   * carried on a run nobody could hear, with ▶ reading ⏸: the failure this
   * wait exists to prevent, made quieter. The engine's state is the one fact
   * those three share (`AudioEngine.state` reads anything but a running
   * context as `suspended`). Otherwise nothing starts, carries on or ends — no
   * run, no resume, no demonstration ended or begun, no stop, no navigation —
   * the flags clear so the next tap asks again inside itself, and the state
   * line says the sound did not start and names the control to tap
   * (`soundOffLine`). A start answering later starts nothing either; its
   * answer only takes the sentence away (`stopWatchingSound`).
   *
   * A second tap in the wait does nothing; leaving the screen or a new session
   * cancels. Where the sound is running, or there is no Web Audio to start —
   * no tap could ever start that sound, so a sentence asking for one would be
   * false — `act` runs at once, exactly as before.
   *
   * **Every tap that can start the sound comes here (U105)**, each with its
   * whole handler as `act`, so a refusal leaves everything the tap would have
   * changed as it was: *Carry on*, *Start again*, a hand after *Nothing for
   * the … hand*, a bar held down, *Try again*, the summary's *Again*, *Slower*,
   * *Faster* and *Loop the weak bars*, and a key on the screen. Each act checks
   * again, when it runs, that its tap still applies. `tap` names the control
   * for the sentence and its mark; only ▶'s own tap shows that it waits.
   */
  function withSound(act: () => void, tap: SoundTap = PLAY_TAP): void {
    if (!audioEngine.supported || audioEngine.state === 'running') {
      soundRefusedBy = null;
      act();
      return;
    }
    if (startingSound) return;
    startingSound = true;
    playWaiting = tap === PLAY_TAP;
    // This tap asks again: the last refusal's sentence goes while it waits.
    const wasRefused = soundRefusedBy !== null;
    soundRefusedBy = null;
    if (wasRefused) drawWaitingFor();
    drawPlayHold();
    const tapped = session;
    let settled = false;
    const settle = (): void => {
      if (settled) return;
      settled = true;
      window.clearTimeout(bound);
      startingSound = false;
      playWaiting = false;
      if (leaving || session !== tapped) {
        drawPlayHold();
        return;
      }
      if (audioEngine.state !== 'running') {
        soundRefusedBy = tap;
        render();
        return;
      }
      drawPlayHold();
      act();
    };
    const bound = window.setTimeout(settle, PLAY_SOUND_WAIT_MS);
    // A failure is an answer like any other: the check above decides.
    void audioEngine.ensureStarted().then(settle, settle);
  }

  /**
   * ▶ held: while a transfer offer's snapshot is unread (D4a), and while its
   * tap waits for the sound (U69), when it also says it is busy. And the tap
   * whose sound did not start, marked on its own control while the state line
   * says so (G86a, U105), for a spec that meets a refusal to say so.
   */
  function drawPlayHold(): void {
    playPause.disabled = offerPending() || playWaiting;
    if (playWaiting) {
      playPause.setAttribute('aria-busy', 'true');
      playPause.dataset.startingSound = 'true';
    } else {
      playPause.removeAttribute('aria-busy');
      delete playPause.dataset.startingSound;
    }
    markRefused();
  }

  /**
   * `data-sound-refused` on the control whose tap did not start the sound, and
   * on nothing else, while that is still true (G86a, U105). By id, because
   * some of those controls are drawn again while the refusal stands (the
   * offer to carry on, on every render) and some live in a sheet on `body`.
   */
  function markRefused(): void {
    const refused = refusedNow();
    for (const marked of document.querySelectorAll<HTMLElement>('[data-sound-refused]')) {
      if (marked.id !== refused?.id) delete marked.dataset.soundRefused;
    }
    const control = refused === null ? null : document.getElementById(refused.id);
    if (control) control.dataset.soundRefused = 'true';
  }

  /** The tap whose sound did not start (G86a), while that is still true. */
  function refusedNow(): SoundTap | null {
    return soundRefusedBy !== null && audioEngine.state !== 'running' ? soundRefusedBy : null;
  }

  /** Choosing a different hand makes the sentence worth saying again. */
  function forgetPlayingHand(): void {
    saidPlayingHand = false;
  }

  function clearLoop(): void {
    // Including a half-set one: *Loop start: bar 3. Double-tap the last bar.*
    // is an instruction about a loop that no longer exists (T31).
    if (loopAnchor !== null) status.textContent = '';
    const was = loopLabel();
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
    noteChange('loop', was, 'off');
    if (was !== 'off') restartForOption(RESTARTED_WITH.noLoop);
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
    const at = { x: event.clientX, y: event.clientY };
    pressFrom = at;
    pressHold = window.setTimeout(() => {
      pressHold = null;
      // Not during a run (`08` §7.3). The reason written here was that the
      // engine keeps no state to resume a run from; since T33 the session can
      // set a run aside under a demonstration, as `Hear it` does, and the
      // long-press does not use it yet — a press mid-run is still ignored.
      if (session?.running === true) return;
      // Where the finger went down: the bar under it (LB1).
      const measure = measureAt(target, at.x, at.y);
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

  /**
   * A bar held down asks for the sound through the gate, the whole preview its
   * act (U105), so a refusal sets no loop and says to hold the bar again. The
   * ask comes from the press's timer, 400 ms after `pointerdown` and before a
   * touch lifts: whether a platform takes that as the tap is inferred, and the
   * gate reads the engine at the end, so what it says is true either way.
   * Nothing is asked where the preview would not play.
   */
  function hearBar(measure: number): void {
    if (!session || !model || hearingBar) return;
    if (!session.loopForPrintedBars(measure, measure)) return;
    withSound(
      () => {
        if (session?.running === true) return;
        hearBarNow(measure);
      },
      { id: 'score-stage', control: `bar ${String(shownBar(measure))}`, verb: 'hold' },
    );
  }

  /** Plays one bar, both hands, once, and puts the run back afterwards. */
  function hearBarNow(measure: number): void {
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
    const measure = measureAt(event.target, event.clientX, event.clientY);
    if (measure === null) return;
    if (loopAnchor === null) {
      loopAnchor = measure;
      status.textContent = `Loop start: bar ${String(shownBar(measure))}. Double-tap the last bar.`;
    } else {
      const was = loopLabel();
      loopBars = { from: Math.min(loopAnchor, measure), to: Math.max(loopAnchor, measure) };
      loopAnchor = null;
      loopSection = null;
      // The instruction has been carried out, so it stops being an
      // instruction. Nothing cleared it, and a sentence saying *Double-tap the
      // last bar* stayed on the header beside a Loop control already reading
      // `Bars 3–6` — and then stayed there through the rest of the sitting,
      // over a cleared loop, a mode change and a pause (T31, measured).
      status.textContent = '';
      noteChange('loop', was, loopLabel());
      restartForOption(RESTARTED_WITH.loop(loopLabel()));
    }
    render();
  });

  /**
   * The rung this run is judged by (T37, the reviewer's D2 step; C1).
   *
   * The one that opened the screen (`?from=`), and no other. It was always the
   * first listing: the minuet opened from `classical.3` was held to 3.4's
   * numbers and stored as 3.4's run. T37 made the opening rung win, and kept
   * the first listing for a screen nothing opened — a rung nobody chose, whose
   * prose the learner never read, standing in for "no rung". A run from
   * nowhere now records no rung and is judged by Part G's defaults, the
   * learner's own pair from Settings (design §10 C1). A `?from=` naming no
   * rung the curriculum has is nowhere too.
   *
   * Or the rung a Today card chose (`?rung=`, C3 item 0b, L50), which wins
   * where both are named: it is the rung this run was asked for. Today used to
   * name none, so since C1 every Today run was judged by the defaults.
   */
  function judgingRungId(): string | undefined {
    return todayRung ?? fromRung;
  }
  function judgingRung(curriculum: Curriculum): Lesson | undefined {
    const id = judgingRungId();
    return id === undefined ? undefined : findLesson(curriculum, id);
  }

  /**
   * Finds the rung the run is judged by; see `judgingRung`. Failure is silent:
   * the run is then judged against the learner's settings (see `rung`).
   */
  async function findRung(): Promise<void> {
    try {
      rung = judgingRung(await loadCurriculum());
    } catch {
      // Judged against the learner's settings instead; see `rung`'s comment.
    }
  }

  /**
   * What this run is held to: the rung's own pass, where this piece is on one
   * (`02` Part G, built 2026-09-21). `masteryCriteriaFor` falls back to exactly
   * the Settings pair for a piece on no rung and for a rung that states no
   * number of its own, so the Settings pair still decides every run the
   * curriculum is silent about. One reading for the summary that judges a run
   * and the opening that decides whether one can count (X46).
   */
  function judgingCriteria(): MasteryCriteria {
    return masteryCriteriaFor(rung, {
      passAccuracy: settings.passAccuracyPct / 100,
      passTempoPct: settings.passTempoPct,
      masterAccuracy: 0.97,
      masterTempoPct: 100,
    });
  }

  /**
   * Fills the side panel with the lesson text of the rung the run is judged
   * by, so the prose beside the piece and the numbers it is held to are one
   * rung's. Opened from nowhere there is no such rung (C1), and the panel
   * shows the first rung listing the piece as reading, as it always did.
   * Failure is silent and leaves the panel out: a score screen must open with
   * or without its prose.
   *
   * Every way out decides the panel, once (`decideSidePanel`): `text` with the
   * words in it, `empty` for a piece on no rung or a lesson that will not
   * read. It used to mark only `text`, so a panel left out was never decided.
   */
  async function fillSidePanel(target: CatalogItem): Promise<void> {
    try {
      const curriculum = await loadCurriculum();
      // The prose beside the piece: the rung that judges the run, whole, and
      // where nothing opened the screen the first rung listing it — its
      // teaching, without the paragraph that states its pass, which is not the
      // pass this run is held to: that is the Settings pair (C1; C4 item 6).
      const judging = judgingRung(curriculum);
      const found = judging ?? proseRungFor(curriculum, target.id);
      if (!found) {
        decideSidePanel('empty');
        return;
      }
      // The rung's title alone. This is the heading over its text beside the
      // score, where the id said nothing and cost the words their room.
      sideSummary.textContent = found.title;
      const response = await fetch(contentUrl(found.textFile));
      if (!response.ok) throw new Error(String(response.status));
      const { body: markdown } = parseFrontMatter(await response.text());
      sideBody.replaceChildren(renderMarkdown(sidePanelProse(markdown, judging !== undefined)));
      decideSidePanel('text');
    } catch {
      decideSidePanel('empty');
    }
  }

  /** The panel shown or left out, and `data-side` saying which: once per opening. */
  function decideSidePanel(side: 'text' | 'empty'): void {
    if (section.dataset.side !== undefined) return;
    sidePanel.hidden = side !== 'text';
    section.dataset.side = side;
  }

  /**
   * Which bar the pointer is over, in the loop's unit: the source measure
   * index plus one, which `loopFromPrintedBars` matches and `shownBar` turns
   * into the number the bar counter prints (a pickup is 0 there).
   *
   * The history, because it explains the shape. The fallback once returned
   * `currentWindow.fromMeasure`, a 0-based index, so every loop asked for
   * bar −1 and got nothing; converting it made the double-tap mark the
   * window's first bar wherever the finger landed, because nothing in the page
   * carried `data-measure` and the fallback was the only path there was. The
   * lessons that say "double-tap the first bar, then the last" (latin.4, 6
   * and 7) could not be done as written, and long-pressing a bar to hear it
   * (B4) played the window's first bar the same way (Entry 261).
   *
   * Since LB1 the renderer writes `data-measure` on every drawn bar's
   * `.vf-measure` group (`stampMeasures`), and the bar is found in three
   * steps: the group the tapped stroke is drawn in; else the bar whose staff
   * lines are under the point (`barUnderPoint`), since a finger on the white
   * between the lines hits the page rather than any stroke; and only where the
   * point is beside every bar, the window's first bar, as before.
   */
  function measureAt(target: EventTarget | null, x: number, y: number): number | null {
    if (!(target instanceof Element)) return null;
    const holder = target.closest('[data-measure]');
    const value = Number(holder?.getAttribute('data-measure') ?? Number.NaN);
    if (holder && Number.isFinite(value) && value >= 1) return value;
    const under = barUnderPoint(x, y);
    if (under !== null) return under;
    const from = renderer?.currentWindow?.fromMeasure;
    return from === undefined ? null : from + 1;
  }

  /**
   * The bar whose staff lines lie under a point on the screen, or `null`.
   *
   * Read from the sheets on the screen (`.is-front`; the probe and a hidden
   * spare are never under a finger), each stamped bar's staff lines — the thin
   * horizontal strokes drawn directly in its `.vf-measure` group, the same
   * strokes the specs read as the five lines — joined across the staves of a
   * grand staff, so the gap between them belongs to the bar too. A point above
   * or below a bar's lines counts as that bar within one staff's height (a
   * finger on a ledger-line note); past that it is beside every bar and the
   * caller falls back. Where two bars could claim the point, the nearer one.
   */
  function barUnderPoint(x: number, y: number): number | null {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    const boxes = new Map<string, { bar: number; left: number; right: number; top: number; bottom: number; staff: number }>();
    const sheets = stage.querySelectorAll<HTMLElement>('.score-buffer.is-front:not(.score-probe)');
    for (const [sheetIndex, sheet] of [...sheets].entries()) {
      if (sheet.hidden) continue;
      for (const group of sheet.querySelectorAll<SVGGElement>('g.vf-measure[data-measure]')) {
        const bar = Number(group.getAttribute('data-measure'));
        if (!Number.isFinite(bar) || bar < 1) continue;
        let left = Number.POSITIVE_INFINITY;
        let right = Number.NEGATIVE_INFINITY;
        let top = Number.POSITIVE_INFINITY;
        let bottom = Number.NEGATIVE_INFINITY;
        for (const line of group.querySelectorAll(':scope > path')) {
          const r = line.getBoundingClientRect();
          if (!(r.width > 0) || r.height > r.width / 8) continue;
          left = Math.min(left, r.left);
          right = Math.max(right, r.right);
          top = Math.min(top, r.top);
          bottom = Math.max(bottom, r.bottom);
        }
        if (!(right > left) || !(bottom > top)) continue;
        // One box per bar per sheet: a bar is drawn once in a sheet, on one row.
        const key = `${String(sheetIndex)}:${String(bar)}`;
        const was = boxes.get(key);
        const staff = bottom - top;
        if (!was) {
          boxes.set(key, { bar, left, right, top, bottom, staff });
          continue;
        }
        was.left = Math.min(was.left, left);
        was.right = Math.max(was.right, right);
        was.top = Math.min(was.top, top);
        was.bottom = Math.max(was.bottom, bottom);
        was.staff = Math.min(was.staff, staff);
      }
    }
    let best: { bar: number; distance: number } | null = null;
    for (const box of boxes.values()) {
      if (x < box.left || x > box.right) continue;
      const distance = y < box.top ? box.top - y : y > box.bottom ? y - box.bottom : 0;
      if (distance > box.staff) continue;
      if (!best || distance < best.distance) best = { bar: box.bar, distance };
    }
    return best?.bar ?? null;
  }

  /** The timer that ends a peek (`peek`). */
  let peekTimer: number | null = null;
  /** A tap asked to see the controls while the hands are on the keys, and its few seconds are not over. */
  let peeking = false;
  /** What the chrome showed at the last draw (`chromeFor`). */
  let chrome: ChromePlan = { handsOnKeys: false, folded: false, direct: null };

  /**
   * Tells the stage how much room the bar is taking.
   *
   * Measured, not assumed: the bar wraps to two rows on a narrow screen, and
   * a constant would be wrong on exactly the screen where the notation cannot
   * spare the pixels. **The row's own height, folded or not (U122c):** folded,
   * its controls are hidden in their places and the row keeps its box, so the
   * stage's reserve does not change with the moment, and upright and on a
   * tablet, where the stage keeps that reserve through a run, the music never
   * moves (`docs/design/score-bar-layout.md` §10.4–10.5).
   */
  function measureBar(): void {
    const height = bar.hidden ? 0 : bar.getBoundingClientRect().height;
    section.style.setProperty('--score-bar-h', `${String(Math.round(height))}px`);
  }

  /**
   * The chrome as the moment asks (U122c, `scoreChrome.ts`): while the hands
   * are on the keys the controls fold to the one direct control in its own
   * place — ⏸, or *Stop* under a demonstration — and paused, refused, at rest
   * or finished nothing folds. A pause used to fold three seconds after ⏸,
   * because the fold asked whether a run existed and a paused run does: the
   * screen said *▶ to carry on* with no ▶ on it (walk finding 5). While the
   * hands are on the keys the fold is still unconditional, as the owner asked
   * after looking at it on the phone ("just always fade it"): nothing judges
   * whether the controls cover anything (`08` §13 keeps the measurement that
   * used to).
   *
   * Folded, the hidden controls are gone, not merely invisible (`08` §9.20):
   * `inert` takes each out of the tab order and the accessibility tree, all
   * but the direct one. Where each device draws the rest — the header's Back
   * and name upright, the top line's name sideways — is the stylesheet's,
   * keyed on `data-chrome`.
   */
  function drawChrome(): void {
    chrome = chromeFor({
      running: session?.running === true,
      paused: session?.paused === true,
      hearing,
      hearOnRow: hearButton.parentElement === bar,
      finished: !sheet.hidden,
      peeking,
    });
    bar.dataset.visible = String(!chrome.folded);
    section.dataset.chrome = chrome.folded ? 'folded' : 'open';
    if (chrome.direct === null) delete bar.dataset.direct;
    else bar.dataset.direct = chrome.direct;
    for (const child of bar.children) {
      if (child instanceof HTMLElement) child.inert = chrome.folded && child.id !== chrome.direct;
    }
    // Upright, at rest, the status line wins the header over `bar n / m`: with both, the name was
    // squeezed to "Hot Cr…" (the gallery's blind cell), and before a run the bar is bar 1. During a run
    // the bar is what the learner needs to find their place, and since the corner chip went (U122c) the
    // header is the one place that says it: a standing status (a blind run's, the duet's) would hide it
    // for the whole run. So during a run `bar n / m` stays, and the name gives its room (folded it is
    // not drawn at all).
    where.hidden = (status.textContent ?? '') !== '' && window.innerHeight > window.innerWidth && session?.running !== true;
    placeCount();
  }

  /**
   * The count-in right of the direct control, in the room the folded row
   * leaves (U122c): placed from where ⏸ is, which the fold never moves.
   */
  function placeCount(): void {
    if (countIn.hidden) return;
    const direct = chrome.direct === 'score-hear' ? hearButton : playPause;
    countIn.style.left = `${String(Math.round(direct.offsetLeft + direct.offsetWidth))}px`;
  }

  /** A peek: every control for a few seconds, while the hands are on the keys (`08` §9.34). */
  function peek(): void {
    peeking = true;
    if (peekTimer !== null) window.clearTimeout(peekTimer);
    peekTimer = window.setTimeout(() => {
      peekTimer = null;
      peeking = false;
      drawChrome();
    }, CONTROL_BAR_HIDE_MS);
  }

  /** The peek is over: a run started, or the moment changed under it. */
  function endPeek(): void {
    if (peekTimer !== null) window.clearTimeout(peekTimer);
    peekTimer = null;
    peeking = false;
  }

  /**
   * The learner is using the controls: while the hands are on the keys that
   * keeps them shown for a few seconds more (a peek), and otherwise they are
   * shown anyway. Called by every control on the bar before it acts, and by
   * the moments that hand the run back to the learner.
   */
  function showBar(): void {
    if (chromeFor({ running: session?.running === true, paused: session?.paused === true, hearing, hearOnRow: true, finished: !sheet.hidden, peeking: false }).handsOnKeys) peek();
    drawChrome();
  }

  /** A tap on the music: folded, a peek; peeking, the fold again. Nothing folds in any other moment. */
  function toggleBar(): void {
    if (!chrome.handsOnKeys) return;
    if (chrome.folded) peek();
    else endPeek();
    drawChrome();
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

  /**
   * What the run was, as this screen knew it (C1; design §3): the header half
   * of the observation, beside the measures `measuresOf` gives.
   *
   * The engine reports what it judged under (`judgedUnder`); the screen adds
   * what only it knows — what opened it, the tempo the percentage is of, what
   * the app played beside the learner, what the keys showed, the input. What
   * neither knows is stored as not measured, never guessed: the Today slot
   * where the route carries none (only a Today card names one, L50), and
   * anything the engine did not report.
   */
  function runHeader(score: SessionScore, first: { firstContact: boolean; unseen?: boolean; recipe?: ReadingRecipe }, demonstrated: boolean): RunHeader {
    const under = score.judgedUnder;
    // Whether the run covered the whole item (RG1): the run's own prepared session holds both the
    // span it judged and the item's whole step sequence (the cut's, for an excerpt), read here at
    // the run's end, where `judgedUnder` is read, before anything restarts the session.
    const prepared = session?.prepared;
    const base = model?.tempoMap[0];
    const judgedBy = judgingRungId();
    // The hand the engine judged, which is the run's; the screen's own
    // `hands` can have moved since, with the sheet up.
    const played = under?.hands ?? hands;
    const other = played === 'R' ? 'L' : 'R';
    const appPlayed =
      settings.playbackHands === 'both'
        ? ('both hands' as const)
        : settings.playbackHands === 'non-focused' && played !== 'both' && model?.handsPresent[other] === true
          ? ('other hand' as const)
          : ('none' as const);
    return {
      definitions: OBSERVATION_DEFINITIONS,
      ...(under ? { range: { fromMeasure: under.fromMeasure, toMeasure: under.toMeasure } } : {}),
      ...(prepared ? { wholeItem: coversWholeItem(prepared) } : {}),
      opened: {
        tab: router.route.tab,
        ...(judgedBy === undefined ? {} : { rung: judgedBy }),
        ...(tourId === undefined ? {} : { tour: tourId }),
        slot: todaySlot ?? NOT_MEASURED,
        // The hold the phrase was written under, as the screen knew it then (SR4); never inferred later.
        ...(phraseHold === undefined ? {} : { hold: phraseHold }),
      },
      baseTempo: base
        ? { bpm: base.bpm, source: item?.tags?.includes('tempo-defaulted') === true ? 'defaulted' : 'written' }
        : NOT_MEASURED,
      hands: { played, appPlayed },
      keys: keysShown(),
      graceNotes: under?.graceNotes ?? NOT_MEASURED,
      input: {
        source: input,
        toleranceMs: under?.toleranceMs ?? NOT_MEASURED,
        latencyMs: under?.inputLatencyMs ?? NOT_MEASURED,
      },
      ...first,
      demonstrated,
    };
  }

  /**
   * What the phrase on the screen was written from (C4): the row, what the
   * route's recipe moved, and whether it is the easy one on purpose. The row's
   * own recipe where nothing moved it, so the reader always knows the last
   * recipe a learner read.
   */
  function phraseRecipe(row: string): ReadingRecipe {
    const moved = routeRecipe?.moved;
    return {
      row,
      ...(moved !== undefined && Object.keys(moved).length > 0 ? { moved } : {}),
      ...(routeRecipe?.easy === true ? { easy: true as const } : {}),
    };
  }

  /**
   * Whether the run about to be summarised is a sight-read of a phrase met
   * before — read already, on the record or this visit, or played to the
   * learner (T37, T33, T40). Read before `sightReadAttempts` counts this run.
   *
   * Since G1 the record includes what no run left: a hearing or a
   * demonstration on any visit, a viewing on another visit, a run of the same
   * phrase under another row (`historyFirstContact`). The phrase is judged
   * whole: a bar of it heard is the phrase heard, as within the visit.
   */
  function firstReadingRefused(): boolean {
    if (item === undefined || !isSightReading(item)) return false;
    return sightReadAttempts > 0 || phraseSeen || phraseHeard || !historyFirstContact(undefined);
  }

  /**
   * First contact by the history read when the screen opened (G1 item 4), over
   * `bars` of the item (printed positions; absent, the whole). True where no
   * history could be read: the visit's own flags then decide, as before G1.
   */
  function historyFirstContact(bars: readonly [number, number] | undefined, from: EncounterHistory | null = history): boolean {
    if (!encounterTarget || !from) return true;
    return firstContactIn({ ...encounterTarget, ...(bars === undefined ? {} : { bars }) }, from, visit);
  }

  /**
   * First contact for a run of anything but a phrase (G1 item 4; the
   * reviewer's answer 3): no run of it on this visit before this one, no
   * playback of it this visit, and nothing in the history over the bars the
   * run covered. An audit fact, written on the run, gating nothing: a piece
   * played again passes as it always did.
   */
  function firstContactOfRun(bars: readonly [number, number] | undefined): boolean {
    return sightReadAttempts === 0 && !phraseHeard && historyFirstContact(bars);
  }

  /** The printed bars a run covered (1-based positions), from what the engine judged under. */
  function barsOfRun(range: { fromMeasure: number; toMeasure: number } | undefined): [number, number] | undefined {
    return range === undefined ? undefined : [range.fromMeasure + 1, range.toMeasure + 1];
  }

  /** What opened this screen, as an encounter keeps it (G1): the run header's `opened`, in its own shape. */
  function encounterSource(): EncounterSource {
    const rungId = judgingRungId();
    return {
      tab: router.route.tab,
      ...(todaySlot === undefined ? {} : { slot: todaySlot }),
      ...(rungId === undefined ? {} : { rung: rungId }),
      ...(tourId === undefined ? {} : { tour: tourId }),
      ...(transferIntent === undefined ? {} : { intent: 'transfer' as const }),
    };
  }

  /**
   * The notation has been drawn for the learner: one viewing, once a visit
   * (G1). Never in Blind, where the engraving is hidden — toggling Blind off
   * opens the screen again, a new visit that draws it.
   */
  function noteViewing(): void {
    if (viewingWritten || blind || !item || !encounterTarget) return;
    viewingWritten = true;
    void recordEncounter({ kind: 'viewed', itemId: item.id, material: encounterTarget.material, source: encounterSource(), visit });
  }

  /** A playback to the learner, by the kind their action was (G1). */
  function noteHearing(kind: Exclude<EncounterKind, 'viewed'>, bars: readonly [number, number] | undefined): void {
    if (!item || !encounterTarget) return;
    void recordEncounter({
      kind,
      itemId: item.id,
      material: encounterTarget.material,
      source: encounterSource(),
      visit,
      ...(bars === undefined ? {} : { bars }),
    });
  }

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
    // First on the sheet: why a tap on it did not start, when one did not (U105a).
    sheet.replaceChildren(summaryRefusal);
    /**
     * The sheet in two parts, in its own order: the outcome and the figures, then what to do next
     * (U122c). Drawn as one column everywhere (`display: contents`) but on a phone held sideways, where
     * the sheet's 72 % ends above the actions and the learner met the figures and not the next step
     * (U122b, `responses/e070d238.md`): there the two parts stand side by side, so the outcome and the
     * recommended action are both in the first view. Nothing is reordered or reworded (X46).
     */
    const sheetMain = document.createElement('div');
    sheetMain.className = 'summary-main';
    const sheetNext = document.createElement('div');
    sheetNext.className = 'summary-side';
    sheet.append(sheetMain, sheetNext);
    /** Where the session's transition is drawn (X1, `drawNext`); on the sheet only where the run is a session's activity. */
    const nextHost = document.createElement('div');
    nextHost.className = 'session-next';
    nextHost.id = 'session-next';
    nextHost.hidden = true;
    /** The sheet's closing action where no session step replaces it. */
    const doneButton = button('Done', () => {
      flushPendingRecord();
      summaryUp(false);
      leaveScore();
    }, 'summary-done');
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
    // The rung's own pass, where this piece is on one (`judgingCriteria`).
    const criteria = judgingCriteria();
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
     * Only where the rung requires it (a `measure` requirement, C5), and none of the four
     * technique rungs does. So the measure is shown and the pass is decided
     * the way it always was — which is what those lessons now say, rather
     * than the app quietly raising the bar under them.
     */
    const techniqueBinds =
      technique !== null && demandsTechniqueMeasure(rung?.requirements, technique.kind);
    const outcome = rhythmRun
      ? { ...measured, passed: false, masterEligible: false }
      : techniqueBinds && !technique.met
        ? { ...measured, passed: false, masterEligible: false }
        : measured;
    // A phrase met before is not a first reading (see `sightReadRepeat`
    // below), so it cannot be the reading drill's pass: refused here, so the
    // heading does not say *Passed* over a run the record keeps as practice.
    const judged = firstReadingRefused() ? { ...outcome, passed: false, masterEligible: false } : outcome;

    // docs/05 §7: a sight-reading drill is scored on the first attempt only.
    // After that the material has been seen, and a second run measures
    // something else entirely. Per phrase, not per visit (T37): a phrase whose
    // seed is already on a stored run has been seen, however the screen was
    // reached again.
    //
    // And not a run the phrase was played to the learner part way through
    // (T33): with `Hear it` setting a run aside rather than ending it, a
    // sight-read can now carry on after the phrase has been heard, and a
    // reading of heard music is not the first reading the record would claim.
    // Nor one the phrase was played to the learner *before* (T40): the reason
    // is the same, and `phraseHeard` holds it for the phrase, not the run.
    const sightReading = item !== undefined && isSightReading(item);
    // What the history holds of the phrase (G1), for the sentence that says
    // why a reading is refused: a run of it, a playback, or a viewing on
    // another visit.
    const metBefore = sightReading && encounterTarget && history ? familiarityIn(encounterTarget, history, { visit }) : null;
    const ranBefore = metBefore !== null && (metBefore.attempted !== null || metBefore.partly.attempted !== null);
    const heardBefore = phraseHeard || (metBefore !== null && (metBefore.heard !== null || metBefore.partly.heard !== null));
    const alreadyMet = sightReadAttempts > 0 || phraseSeen || ranBefore;
    // One rule, read once more before this run is counted: `judged` above
    // asked the same question.
    const sightReadRepeat = firstReadingRefused();
    // First contact (G1 item 4; G1a item 1): the encounter relation of what
    // this run played — a phrase whole, anything else over the bars the run
    // covered — read before this run is counted, and written on every run as
    // `firstContact`.
    const firstContact = sightReading ? !sightReadRepeat : firstContactOfRun(barsOfRun(score.judgedUnder));
    // Sight-reading's condition, a phrase's only (G1a item 2): derived from
    // that relation and the visit rule, which today give the same value — one
    // derivation with two names, so a change to the visit rule moves `unseen`
    // here and leaves the fact alone.
    const unseen = firstContact;
    if (item !== undefined) sightReadAttempts += 1;
    // Such a run is recorded (C1, reviewer decision 3): it is practice, and
    // its minutes, its attempt and its row are kept. It is not a reading, so
    // it passes nothing — the reading drill's pass is the claim that the
    // learner read the phrase — and the store refuses it the day's tick.

    /**
     * Whether the app heard anything at all (T40).
     *
     * `score.notes` is every note the engine took, from whichever source fed
     * it — MIDI, a microphone estimate, a screen key — so it is read here and
     * not the input selector: a learner with a piano selected can still play
     * nothing. With nothing heard there is no accuracy, no miss and no weak
     * bar, only a clock that ran; the sheet says the run was not measured and
     * asks how it went (`02` Part G), and nothing is recorded but the answer.
     * On the screen as it stands, the one way here is a run with nothing
     * listening: with an input chosen, a run holds for its first note.
     */
    const heard = score.notes.length > 0;
    // The answer is the only evidence such a run has, so it is asked exactly
    // there, and written with the run.
    const askSelfReport = !heard;
    // A performance the piece was played to the learner in the middle of
    // (T40). `heardAt` is the bars of this run's demonstrations (T33, C5), so
    // one heard before the take began is preparation, not help inside it.
    const demonstrated = heardAt.length > 0;
    const demonstratedTake = performanceRun && demonstrated;
    // What the run measured, by the record's one definition (C1), read once:
    // the record keeps it, and the sheet's *Accents* line reads the same value
    // so the two cannot disagree (U46).
    /** The generated phrase the run played, for its material (D4), where it was one; an import's loaded bytes (G1). */
    const playedPhrase = {
      ...(phraseGenerator !== undefined && phraseWritten !== undefined ? { phrase: { generator: phraseGenerator, ...phraseWritten } } : {}),
      ...(loadedIdentity === undefined ? {} : { loaded: loadedIdentity }),
    };
    const measures = measuresOf(score, {
      heard,
      technique,
      pedalMeasurable: input === 'midi',
      steps: session?.prepared?.steps ?? [],
    });
    const title = document.createElement('h2');
    /** The heading, with what kept a performance from being one said after it. */
    const setHeading = (text: string): void => {
      title.textContent = demonstratedTake ? `${text} — ${SUMMARY_TEXT.demonstratedTake}` : text;
    };
    // Every run of a judging mode leaves a record (C1): a sight-read met before
    // is kept as practice, flagged `unseen: false`, where T37 and T40 dropped
    // it with its minutes. Listen and Free judge nothing and record nothing.
    // Nor does a run on a transfer route whose offer is still unread (D4a):
    // none can start (`startRun`), and should one finish anyway it is not
    // written as practice in the offer's place.
    const run: RunResult | null =
      item && mode !== 'listen' && mode !== 'free' && !offerPending()
        ? {
            itemId: item.id,
            // Which rung judged it: the one that opened the screen, where one
            // did (`judgingRung`), and none otherwise.
            ...(rung === undefined ? {} : { lessonId: rung.id }),
            // The generated phrase's seed, so the store can tell Today's read
            // (the run carrying the day's seed, `04` §2) from any other run,
            // and a retry on the same music from a new phrase (T37).
            ...(phraseSeed === undefined ? {} : { seed: phraseSeed }),
            // And which generator wrote it (D1a): a seed names one phrase per
            // version, so the history compares the version beside the seed.
            ...(phraseGenerator === undefined ? {} : { generator: phraseGenerator }),
            // What was played and why (D4): the exact material — the phrase's complete identity, or the
            // row's (an excerpt's cut, never the parent: E1 item 7) — the item's role, and, where the
            // run came from a transfer offer whose snapshot this route named, the intent and that
            // offer's relationship as one fact (D4a): never one without the other.
            ...runFacts(item, offer.kind === 'kept' ? { ...playedPhrase, intent: 'transfer', relationship: offer.relationship } : playedPhrase),
            mode,
            tempoPct: score.tempoPct,
            // Nothing heard, nothing measured (T40, C1): not a zero.
            accuracy: heard ? score.accuracy : NOT_MEASURED,
            accuracyEstimated: score.accuracyEstimated,
            wrongNotes: heard ? score.wrongNotesTotal : NOT_MEASURED,
            missed: heard ? score.missedTotal : NOT_MEASURED,
            durationMs: score.durationMs,
            passed: judged.passed,
            // A generated phrase carries no mastery (C5, S8): a first reading
            // is evidence of reading, never a mastery run of the row.
            masterEligible: judged.masterEligible && !sightReading,
            // What the run observed about tempo (T37): nothing in Wait, and
            // nothing where nothing was heard, whatever the slider said.
            tempoMeasured: outcome.tempoMeasured && heard,
            // A performance is a take nobody helped with (T40): one the piece
            // was played to the learner part way through is kept as practice,
            // and off the performances list, which reads this flag.
            ...(demonstratedTake ? {} : performanceRun ? { performance: true } : {}),
            ...(rhythmRun ? { rhythmOnly: true } : {}),
            // What the run was and what it measured, by its own definitions,
            // with every channel it did not measure marked so (C1).
            // First contact on every run (G1, G1a): the relation as
            // `firstContact`; a phrase's run carries sight-reading's `unseen`
            // and its recipe beside it, a piece's, an excerpt's or an import's
            // the relation alone.
            ...runHeader(score, sightReading ? { firstContact, unseen, recipe: phraseRecipe(item.id) } : { firstContact }, demonstrated),
            ...measures,
          }
        : null;

    /**
     * What a run is evidence of, and what it is not (C3's function; C4 item 0):
     * computed here, where the played model is in hand, and kept on the row,
     * because nothing later has the phrase to compute it from. The sheet's *Not
     * judged* lines read the same results. None for an item whose declared skills
     * are not in force (`skillActivation.ts`, D0): as shipped, the reading rows.
     */
    const skills = skillsInForce(item);
    const evidenceOf = (observation: RunResult): EvidenceResult[] | undefined =>
      model && skills.length > 0
        ? evidenceFor({ observation, played: model, targetSkills: skills, vocabulary: VOCABULARY_V0 })
        : undefined;
    const runEvidence = run ? evidenceOf(run) : undefined;

    // Written before the sheet is drawn where there is nothing to ask, and not
    // awaited: the numbers are already final, and a slow write should not
    // delay the learner seeing them. A failed write is reported on the sheet
    // rather than swallowed — practice history is the one thing here that
    // cannot be regenerated.
    function save(result: RunResult, then?: () => void): void {
      if (phraseSeed !== undefined) seedsOnRecord.add(phraseSeed);
      /** The run as stored, after the recheck: what the session's completion reads (X1). */
      let stored: RunResult = result;
      void confirmFirstContact(result)
        .then((checked) => {
          stored = checked;
          // The run as answered is another observation (a self-report): its
          // evidence is its own — and so is a run another tab's encounter
          // turned from a first contact (G1).
          const evidence = checked === run ? runEvidence : evidenceOf(checked);
          // Stamped with the evidence's own version (C4a, L66), not the observation's.
          return recordRun(evidence === undefined ? checked : { ...checked, ...stampedEvidence(evidence) });
        })
        .then((row) => {
          // The heading follows the store (T37): a master-standard run reads
          // *Passed* until the row it was written into says what it came to,
          // so the sheet can never say *Mastered* before the store does. Nor a
          // count past it (E50c): a row the store did not make mastered holds
          // fewer than MASTER_DAYS days that count, though `masteredOn` keeps
          // every date — an old day a tempo repair made incomparable among them.
          if (result.masterEligible && !rhythmRun) {
            const days = Math.min(MASTER_DAYS - 1, row.masteredOn?.length ?? 1);
            setHeading(
              row.status === 'mastered'
                ? 'Mastered'
                : `Mastery run ${String(days)} of ${String(MASTER_DAYS)}`,
            );
          }
          then?.();
          // Stored: the session's activity completes with what the stored run measured (X1: the protocol's
          // `completed`, never self-report as a measured pass), and the closing action is drawn from the record
          // the completion wrote.
          if (sessionRun) {
            const sessionOutcome = scoreOutcome(stored);
            // Except a run its own settings could not count, on an activity whose rung asks for one that can
            // (X46, `responses/9e14839e.md` §2 points 4 and 5): a Wait for me or a rhythm run the learner chose
            // is practice on the way to the attempt. It completed the activity, the card marked it done and
            // the session moved on before the learner chose anything, and a pass played next on this screen
            // was refused as another activity's. The activity stays where it is: *Start* moves on from it,
            // said as played, and a run that can count completes it.
            const practice =
              sessionOutcome === 'unknown' &&
              todayRung !== undefined &&
              rung !== undefined &&
              !sightReading &&
              heard &&
              (rhythmRun || !tempoCanCount(score.mode, score.tempoPct, criteria));
            if (practice) drawNext();
            else void sessionRun.completed(sessionOutcome).then(drawNext, drawNext);
          }
        })
        .catch((cause: unknown) => {
          status.textContent = `Could not save this run: ${String(cause)}`;
          // Nothing stored, nothing completed: the transition still offers the way on, from the record.
          drawNext();
        });
    }

    /**
     * The transition (X1; `04` §5): where the run is a session's activity, the sheet's closing action becomes
     * the next step — *Start* and *Skip or change*, or *Try again* and *Move on anyway* after a measured
     * failure, or *Done* after the last — drawn from the stored record, with the composition's own words for
     * the next slot. Done gives way to it; where the record says nothing (another session's token, a closed
     * one) Done stays.
     */
    function drawNext(): void {
      if (!sessionRun) return;
      void drawTransition(nextHost, {
        router,
        handle: sessionRun,
        button: (label, onClick, id, primary) => {
          const made = button(label, onClick, id);
          if (primary) made.classList.add('score-button--primary');
          return made;
        },
        tryAgain: () => fromTheSummary(() => startRun(), TRY_AGAIN_TAP),
        beforeLeaving: () => {
          flushPendingRecord();
          summaryUp(false);
        },
      }).then((kind) => {
        doneButton.hidden = kind !== 'none' && kind !== 'closed';
      });
    }

    /**
     * A run about to be stored as a first contact is read against the history
     * once more (G1; the visit id's two-tab case): a viewing or a playback
     * another tab wrote after this screen read it is prior contact too. Only
     * ever turns a first contact into none; where the run was a reading, the
     * sheet says so, as it would have had the history shown it at the start.
     *
     * It asks the relation, which every run carries (G1a): a piece's run has no
     * `unseen` to ask. A phrase's condition goes with its relation, as it was
     * derived from it.
     */
    async function confirmFirstContact(result: RunResult): Promise<RunResult> {
      if (result.firstContact !== true || !encounterTarget) return result;
      const target = encounterTarget;
      const fresh = await historyFor(target, history?.byId === undefined ? {} : { byId: history.byId }).catch(() => null);
      if (fresh === null) return result;
      const bars = sightReading ? undefined : barsOfRun(result.range);
      if (historyFirstContact(bars, fresh)) return result;
      if (!sightReading) return { ...result, firstContact: false };
      const now = familiarityIn(target, fresh, { visit });
      const sentence =
        now.attempted !== null || now.partly.attempted !== null
          ? SUMMARY_TEXT.sightReadRepeat
          : now.heard !== null || now.partly.heard !== null
            ? SUMMARY_TEXT.sightReadHeard
            : SUMMARY_TEXT.sightReadSeen;
      if (title.textContent === 'Passed') setHeading('Run finished');
      let note = sheet.querySelector<HTMLElement>('#summary-note');
      if (!note) {
        note = document.createElement('p');
        note.className = 'summary-note';
        note.id = 'summary-note';
        title.after(note);
      }
      note.textContent = [note.textContent, sentence].filter((part) => part !== null && part !== '').join(' ');
      return { ...result, firstContact: false, unseen: false, passed: false, masterEligible: false };
    }
    if (run && askSelfReport) {
      pendingRecord = (report) => {
        pendingRecord = null;
        // Left unanswered — another run, Done, leaving the screen — a run the
        // app heard nothing of has no evidence at all, and is not written
        // (T40). T37 wrote it without an answer, as accuracy 0 and every note
        // missed, which the history printed as "0%": a measurement nobody took.
        if (report === undefined) return;
        // "Clean" is a pass in the learner's own judgement, which is what
        // Part G makes a run without MIDI; anything else is practice that
        // happened. Never a master-standard run: nothing measured one. And
        // never a pass of the piece from a rhythm run, whatever the answer
        // (`05` §3a): the answer replaced `passed` and gave it one (T40).
        const selfPassed = report === 'clean' && !rhythmRun;
        save(
          {
            ...run,
            selfReport: report,
            passed: selfPassed,
            ...(selfPassed ? { selfPassed: true } : {}),
            masterEligible: false,
          },
          () => {
            status.textContent = selfPassed
              ? SUMMARY_TEXT.selfReportClean
              : SUMMARY_TEXT.selfReportOther(report);
          },
        );
      };
    } else if (run) {
      save(run);
    }

    // Named for what it was, not for what it was not: "Run finished" over a
    // rhythm run reads as a piece that failed to pass, and over a Wait for me
    // run whose notes were right it reads as a failure the learner did not
    // have (T37): that run had every note it needed and nothing it could pass
    // on, so it is headed for the half it did. A run the app heard nothing of
    // is headed for exactly that (T40), before anything else it might be.
    const notesReady =
      mode === 'wait' && !judged.passed && score.accuracy >= criteria.passAccuracy;
    setHeading(
      !heard
        ? SUMMARY_TEXT.notMeasuredHeading
        : rhythmRun
          ? 'Rhythm run'
          : judged.passed
            ? 'Passed'
            : notesReady
              ? SUMMARY_TEXT.waitNotesReady
              : 'Run finished',
    );
    sheetMain.appendChild(title);

    // What the run is, in sentences, under the heading (T40): why a run has no
    // numbers, and why one is not on the record. The second used to go to
    // `#score-status`, the header's line, which the sheet covers and which is
    // cut after twenty-odd characters at 342 px — seen on the glass, nobody
    // could read it.
    const said: string[] = [];
    if (!heard) {
      said.push(SUMMARY_TEXT.notMeasured);
      if (input === 'none') said.push(SUMMARY_TEXT.notMeasuredNoInput);
    }
    // Why a reading is refused, in the learner's words: read before, heard
    // (on any visit), or looked at on an earlier visit (G1).
    if (sightReadRepeat) said.push(alreadyMet ? SUMMARY_TEXT.sightReadRepeat : heardBefore ? SUMMARY_TEXT.sightReadHeard : SUMMARY_TEXT.sightReadSeen);
    if (said.length > 0) {
      const note = document.createElement('p');
      note.className = 'summary-note';
      note.id = 'summary-note';
      note.textContent = said.join(' ');
      sheetMain.appendChild(note);
    }
    // The session's next step, under the result and above the numbers (X1): at the piano the heading and
    // "Next: …" are what is read; the numbers are there to scroll to. Hidden until the record answers.
    if (sessionRun) sheetMain.appendChild(nextHost);

    const lines = document.createElement('dl');
    lines.className = 'summary-stats';
    // With nothing heard, none of the numbers below was measured (T40): not
    // the accuracy, not the misses, not the tempo nobody played to, not the
    // bars that "went worst". Only the *Changed* line stands — it is about the
    // settings, not the playing.
    //
    // `Wrong notes` and `Timing` also wait for something heard: nought wrong
    // notes out of nothing played, and a mean lateness over no notes, are
    // statistics with nothing behind them (`04` §0 R4).
    // First, so it is read before the accuracy it qualifies.
    if (rhythmRun && heard) {
      addStat(lines, 'Judged', 'Rhythm only — the notes were not, so this does not count as playing the piece');
    }
    // What changed during the run, in one line, before the numbers it
    // qualifies (T33, C5): a hand or a tempo changed part way restarted the
    // run, and the click or a demonstration came in the middle of it, so the
    // numbers below are read against the run that produced them. Drawn empty
    // and hidden when nothing changed, so a change made while the sheet is up
    // can still be said on it (§7's own case: the sheet over settings that
    // have moved since).
    changedLine = addStat(lines, SUMMARY_TEXT.changedLabel, '');
    drawChanged();
    if (heard) {
      addStat(lines, 'Accuracy', `${Math.round(score.accuracy * 100)}%${score.accuracyEstimated === true ? ' (estimated)' : ''}`);
    }
    // The tempo is a measurement only where the run kept one (T37). In Wait
    // for me the slider is a setting nobody played to, and it used to be
    // printed as "70% of written" and passed on; now the line says what the
    // mode does not judge, and where a pass is played. A piece whose tempo the
    // converter made up (`tempo-defaulted`) is a share of that suggestion, not
    // of anything written.
    const ofWhat = item?.tags?.includes('tempo-defaulted') === true ? 'of the suggested tempo' : 'of written';
    if (heard) {
      addStat(
        lines,
        'Tempo',
        outcome.tempoMeasured ? `${String(Math.round(score.tempoPct))}% ${ofWhat}` : SUMMARY_TEXT.waitTempo,
      );
    }
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
    if (ladderOn && heard) addStat(lines, 'Ladder', `ended at ${String(tempoPct)} % ${ofWhat}`);
    // What a pass needed, where this run did not meet it (X46, `responses/9e14839e.md` §2 points 2 and 5):
    // the standard that judged it, in the lesson page's words. A clean Keep tempo run at 70 % was headed
    // *Run finished* with no sentence naming the 80 % it was short of. Not over a rhythm run (its own line
    // says it never counts as playing the piece) or a sight-read (the reader's evidence decides those), and
    // not where the notes and the tempo met it and something else stopped the pass (the technique line says
    // so, or the reading refusal does).
    const judgedMode = score.mode === 'wait' || score.mode === 'tempo';
    const missedStandard = heard && judgedMode && !rhythmRun && !sightReading && !measured.passed;
    if (missedStandard) {
      addStat(lines, SUMMARY_TEXT.toPassLabel, SUMMARY_TEXT.toPass(criteria.passAccuracy, criteria.passTempoPct, ofWhat !== 'of written'));
    }
    if (heard) {
      addStat(lines, 'Wrong notes', String(score.wrongNotesTotal));
      addStat(lines, 'Missed', String(score.missedTotal));
    }
    // A right note that came before its beat is its own observation (T37): it
    // used to be a wrong note *and* a miss, and neither line said "early".
    const early = score.early ?? 0;
    if (early > 0) {
      addStat(lines, 'Early', `${String(early)} right note${early === 1 ? '' : 's'} played too soon`);
    }
    // Beside the accuracy it is deliberately not part of, and said in words
    // rather than as a bare number: "82%" under "Legato" would be read as a
    // second accuracy, which is exactly the confusion these exist to avoid.
    if (technique && heard) {
      addStat(
        lines,
        technique.label,
        techniqueBinds ? `${technique.text} — this rung requires it` : technique.text,
      );
    }
    // The accent, where the score prints one (T16 item 7). Only then: a piece
    // with no accent in it gains no row, which is what keeps this off a sheet
    // that `04` §0 R2 already measures on a 342 px phone. Never part of the
    // pass — no `measure` requirement names it, and a leaning that is a
    // little shy is not a wrong note.
    //
    // Read from the measures the record keeps (U46): over notes that all
    // arrived at one loudness — the screen keys — the record says not
    // measured, and the sheet printed a share of them anyway. Where the record
    // says not measured the sheet says not judged, and why.
    const accents = heard ? measures.accents : undefined;
    if (accents !== undefined) {
      const line = addStat(
        lines,
        'Accents',
        accents === NOT_MEASURED
          ? velocityIsFlat(score.notes)
            ? NOT_JUDGED_TEXT.accentsFlat
            : NOT_JUDGED_TEXT.accentsNone
          : // "leaned on, against the rest of your playing" was read three times
            // before it parsed: the number is the share of the notes written with
            // an accent that were actually played louder than their neighbours.
            `${String(Math.round((accents.right / accents.of) * 100))}% of the ${String(
              accents.of,
            )} accented notes were played louder than the notes around them`,
      );
      if (accents === NOT_MEASURED) line.dd.dataset.cites = 'accents';
    }
    // The bars that went worst, by printed number, so the learner knows where
    // to look before choosing `Loop the weak bars` (`08` §6.2). None where
    // nothing was heard: every bar "missed" by a run nobody listened to is not
    // a bar that went badly (T40).
    const weakest = [...(heard ? score.hotSpots : [])]
      .filter((spot) => spotDamage(spot) > 0)
      .sort((a, b) => spotDamage(b) - spotDamage(a))
      .slice(0, 3)
      .map((spot) => printedBar(model?.steps.find((s) => s.measureIndex === spot.measureIndex)?.sourceMeasureIndex ?? spot.measureIndex));
    if (weakest.length > 0) addStat(lines, 'Weakest bars', [...new Set(weakest)].sort((a, b) => a - b).join(', '));
    // Only where timing was measured (T37). Wait for me keeps none — the
    // engine writes a note's lateness only on the clock — and the line used to
    // print "0 ms off the beat on average" over every clean Wait run, which a
    // learner reads as perfect timing nobody listened for.
    if (heard && score.timing.n > 0) {
      // "mean" is a statistician's word on a summary a learner reads after
      // playing (owner, 2026-09-22: the wording is "weird and unhelpful").
      addStat(
        lines,
        'Timing',
        `${Math.round(score.timing.meanMs)} ms off the beat on average, ${Math.round(score.timing.earlyPct)}% of them early`,
      );
    }
    // What the run could not judge of the skills its item declares, and why
    // (C3 item 6): one line per reason, each from a refusal of the evidence
    // function over this run's own record, citing the fields it read. Where
    // nothing was heard the heading already says so, and nothing is added.
    if (run && heard && model && runEvidence) {
      const refusals = runEvidence.filter(isRefusal);
      // A run of part of the piece says "in the bars you played", read off the
      // run's own range rather than the loop control, which is let go before a
      // looped run can end.
      const looped =
        run.range !== undefined && (run.range.fromMeasure > 0 || run.range.toMeasure < model.sourceMeasureCount - 1);
      for (const said of notJudgedLines(refusals, VOCABULARY_V0.skills, {
        ...(run.hands ? { hands: run.hands } : {}),
        looped,
      })) {
        addStat(lines, NOT_JUDGED_TEXT.label, said.text).dd.dataset.cites = said.cites.join(' ');
      }
    }
    sheetMain.appendChild(lines);

    // A piece the project sheet can be opened for (G1b): a song, never a phrase or a drill.
    const projectPiece = item !== undefined && isProjectable(item) ? item : undefined;
    const actions = document.createElement('div');
    actions.className = 'summary-actions';
    // The run *To pass* names, one tap away, where this run's own mode or tempo could not count (X46,
    // `responses/9e14839e.md` §2 point 5): the sheet said "to pass, play it in Keep tempo" and offered no
    // control that did it — *Again* restarted the same Wait run, and Keep tempo had to be found on the bar
    // mid-run, which stamped the run "Changed" before a note. First, because it is what the sheet recommends;
    // a fresh run, so nothing is stamped. Not where accuracy alone was short: *Again* is that retry.
    const standardTempo = Math.ceil(criteria.passTempoPct);
    const toTheStandard =
      missedStandard && !tempoCanCount(score.mode, score.tempoPct, criteria)
        ? [
            button(
              SUMMARY_TEXT.toTheStandard(standardTempo),
              () =>
                fromTheSummary(() => {
                  if (mode !== 'tempo') {
                    mode = 'tempo';
                    // A mode chosen here is met for the first time as much as one chosen on the bar.
                    maybeFirstSight({ key: `mode:${modeKey()}`, entry: MODE_HELP[modeKey()], id: 'score' });
                  }
                  tempoPct = standardTempo;
                  tempo.value = String(tempoPct);
                  render();
                  startRun();
                }, STANDARD_TAP),
              'summary-standard',
            ),
          ]
        : [];
    actions.append(
      ...toTheStandard,
      // Each through the sound's gate, the whole of it (U105): a refused
      // *Slower* or *Faster* leaves the tempo, so the tap made again moves it
      // once, and the summary stays up for it.
      button('Again', () => fromTheSummary(() => startRun(), AGAIN_TAP), 'summary-again'),
      button('Slower (−10%)', () => fromTheSummary(() => {
        tempoPct = Math.max(30, tempoPct - 10);
        tempo.value = String(tempoPct);
        startRun();
      }, SLOWER_TAP), 'summary-slower'),
      button('Faster (+10%)', () => fromTheSummary(() => {
        tempoPct = Math.min(130, tempoPct + 10);
        tempo.value = String(tempoPct);
        startRun();
      }, FASTER_TAP), 'summary-faster'),
      // A phrase nobody has heard (T40), on the sheet that says why this one
      // no longer counts: after a first reading, a repeat or a phrase played
      // to the learner, a new one is the only way to a first reading again.
      // The same row, a fresh seed in the route — the route is what makes the
      // screen draw one — and the same way back. It is not Today's read: the
      // day's phrase is the day's seed (`04` §2).
      ...(sightReading
        ? [
            button('New phrase', () => {
              flushPendingRecord();
              summaryUp(false);
              // The same rung's reading, and not the day's read: that is the
              // day's seed, so a fresh phrase drops the daily-read slot (L50).
              const { slot: _slot, ...sameRoute } = tourRoute;
              router.navigateScore(itemId, {
                ...(todaySlot === 'daily-read' ? sameRoute : tourRoute),
                ...(blind ? { blind: true } : {}),
                ...(performanceRun ? { performance: true } : {}),
                seed: freshSeed(new Set([...seedsOnRecord, ...(phraseSeed === undefined ? [] : [phraseSeed])])),
              });
            }, 'summary-new-phrase'),
          ]
        : []),
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
      // What next with this piece? (G1b item 5): the project sheet's first door, at the moment the
      // question is natural. A piece only — a generated phrase or a drill is none (C5, S8) — and it
      // opens the sheet, which makes nothing until the learner chooses an action there. The material
      // is what this visit played: an import's loaded bytes, else the row's (G1).
      ...(projectPiece
        ? [
            button(PROJECT_TEXT.door, () => {
              openProjectSheet({
                item: projectPiece,
                material: encounterTarget?.material ?? playedMaterial(projectPiece, loadedIdentity === undefined ? {} : { loaded: loadedIdentity }),
                ...(model ? { bars: model.sourceMeasureCount } : {}),
                owner: section,
              });
            }, 'summary-project'),
          ]
        : []),
      // The Done button is X1's (the session's transition takes its place when a session runs).
      doneButton,
    );
    sheetNext.appendChild(actions);
    // A stored run completes the activity first and draws the transition when it has (`save`); with nothing
    // to store — a run waiting for *How did it go?*, a Listen or Free run — it is drawn from the record now.
    if (sessionRun && !(run && !askSelfReport)) drawNext();

    // With nothing heard there is nothing to be accurate *about*, so the
    // learner says how it went instead of being shown a number they did not
    // earn — and the answer is recorded with the run, as self-assessed (`02`
    // Part G, T37). Only where there is a run to record it with, which since
    // C1 is every run of a judging mode.
    if (askSelfReport && pendingRecord) {
      const ask = document.createElement('div');
      ask.className = 'summary-selfreport';
      ask.id = 'summary-selfreport';
      const label = document.createElement('p');
      label.textContent = 'How did it go?';
      ask.appendChild(label);
      const answers: { label: string; report: 'rough' | 'ok' | 'clean' }[] = [
        { label: 'Rough', report: 'rough' },
        { label: 'OK', report: 'ok' },
        { label: 'Clean', report: 'clean' },
      ];
      const choices: HTMLButtonElement[] = [];
      for (const answer of answers) {
        const choice = button(answer.label, () => {
          if (!pendingRecord) return;
          ask.dataset.answered = answer.label;
          // One answer per run: the others go quiet once it is written.
          for (const other of choices) other.disabled = true;
          pendingRecord(answer.report);
        }, `summary-self-${answer.report}`);
        choices.push(choice);
        ask.appendChild(choice);
      }
      sheetNext.appendChild(ask);
    }
    drawSummaryRefusal();
    summaryUp(true);
  }

  /**
   * Lets go of a run still waiting for its self-report (T37, T40).
   *
   * Called wherever the sheet is left — another run, Done, leaving the screen.
   * T37 wrote the run here without an answer; since T40 a run waits for an
   * answer only when the app heard nothing of it, and unanswered it has no
   * evidence to write, so it is not recorded (`02` Part G).
   */
  function flushPendingRecord(): void {
    const flush = pendingRecord;
    pendingRecord = null;
    flush?.();
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

  function addStat(list: HTMLElement, label: string, value: string): { dt: HTMLElement; dd: HTMLElement } {
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = value;
    // Addressable individually: "the summary contains 100%" is true of a run
    // at 100 % tempo whatever the accuracy was, which is not what anyone means.
    dd.dataset.stat = label.toLowerCase().replace(/[^a-z]+/g, '-');
    list.append(dt, dd);
    return { dt, dd };
  }

  /** What went wrong in a bar: missed, wrong and early notes alike (T37). */
  function spotDamage(spot: SessionScore['hotSpots'][number]): number {
    return spot.misses + spot.wrongs + (spot.early ?? 0);
  }

  /** docs/05 §6: build a loop from the bars with the most misses last run. */
  function loopWeakBars(score: SessionScore): void {
    const worst = [...score.hotSpots]
      .sort((a, b) => spotDamage(b) - spotDamage(a))
      .at(0);
    if (!worst || spotDamage(worst) === 0) {
      status.textContent = 'No weak bars to loop — nothing went wrong.';
      return;
    }
    // The hot spot is an unrolled measure; the loop is printed bars.
    const printed = (model?.steps.find((s) => s.measureIndex === worst.measureIndex)?.sourceMeasureIndex ?? worst.measureIndex) + 1;
    // Through the sound's gate (U105): refused, no loop is set.
    fromTheSummary(() => {
      loopBars = { from: printed, to: Math.min(printed + 1, model?.sourceMeasureCount ?? printed + 1) };
      startRun();
    }, LOOP_WEAK_TAP);
  }

  /**
   * A tap on the summary that starts a run (U105): through the sound's gate,
   * and only while the summary is still up with no sheet over it when the
   * sound has started, as it was when the tap was made.
   */
  function fromTheSummary(act: () => void, tap: SoundTap): void {
    withSound(() => {
      if (sheet.hidden || sheetOpen()) return;
      act();
    }, tap);
  }

  // --- render --------------------------------------------------------------

  /**
   * The notes the run is waiting for, as the score writes them (T41).
   *
   * `expectedNow` is MIDI numbers, and a number is a key, not a note: the
   * line named every black key from it as a sharp. The prepared step keeps
   * the ids of the notes each expected key stands for (`noteIdsByMidi`, after
   * the hand filter and the grace-note rule), and those lead back to the
   * model's notes, which carry the notation's own spelling.
   */
  function writtenNow(): WrittenPitch[] {
    const prepared = session?.prepared;
    const at = session?.state?.step;
    const step = prepared && at !== undefined ? prepared.steps[at] : undefined;
    if (!prepared || !step) return [];
    const ids = new Set([...step.noteIdsByMidi.values()].flat());
    return (prepared.model.steps[step.index]?.notes ?? []).filter((note) => ids.has(note.id));
  }

  /**
   * Names the note being waited for, when the owner has asked for names.
   *
   * Wait mode only: in the clock-driven modes nothing is ever waited for, and
   * a line saying otherwise would be describing a different app.
   */
  function drawWaitingFor(): void {
    const named =
      getSettings().showNoteNames && mode === 'wait' && session?.running === true
        ? waitingForLine(writtenNow())
        : '';
    // A tap whose sound did not start comes first (G86a): over *Paused — ▶ to
    // carry on*, over *Playing it to you*, over everything, because it is why
    // what the learner just asked for is not happening.
    const wanted =
      soundOffLine() ||
      pausedLine() ||
      (session?.armed === true ? firstNoteLine() : hearingLine() || named || readyLine());
    // Through the strip, which falls back to the mode's own standing line when
    // the run has nothing to say — so this line is never blank and the learner
    // is never left with a screen that says only the piece's name.
    helpStrip.setNow(wanted);
    // The mode's standing line, not something the run said: not drawn while
    // the hands are on the keys (U122c, `style.css`), as the chip never said it.
    waitingLine.dataset.standing = String(wanted === '');
    waitingLine.hidden = false;
    drawSummaryRefusal();
  }

  /**
   * The summary's own line (U105a): the refusal's sentence where the refused
   * control is on the summary, and nothing otherwise — a refusal standing for
   * a control behind the sheet (inert while it is up) is the state line's
   * alone, so the sheet never names a control it does not hold. Drawn with the
   * state line, so the two never disagree: a tap asking again clears both, a
   * refusal sets both, the sound starting by any path clears both.
   */
  function drawSummaryRefusal(): void {
    const refused = refusedNow();
    const control = refused === null ? null : document.getElementById(refused.id);
    summaryRefusal.textContent = control !== null && sheet.contains(control) ? soundOffLine() : '';
  }

  /**
   * A tap asked for the sound and the sound did not start (G86a): nothing
   * started, and the line says so and which control asks again — ▶ (Space's
   * refusal too, ▶'s keyboard twin), or `Hear it`, whose tap wanted the
   * demonstration and not a run. Since U105 every control whose tap can start
   * the sound is named the same way, and a key names ▶ (`KEY_TAP`). Only while
   * the engine still reads not running (`refusedNow`), so a line that has
   * stopped being true is dropped at the next redraw however the sound came on.
   */
  function soundOffLine(): string {
    const refused = refusedNow();
    if (refused === null) return '';
    return STATE_TEXT.soundOff(refused.control, refused);
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
    // A pause the learner did not make with ⏸ says what made it (T33): the
    // run back from under a demonstration, or restarted by an option.
    if (pauseNote !== null) return pauseNote;
    // A performance has no *Start again* row to name (`04` 5e).
    if (awaySeconds !== null) return STATE_TEXT.away(awaySeconds, performanceRun);
    return performanceRun ? STATE_TEXT.pausedPerforming : STATE_TEXT.paused;
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
    // With the learner's run set aside under it, the line says the run is
    // kept, and where (T33, C1): the old demonstration threw it away unsaid.
    if (setAside !== null) return STATE_TEXT.hearingOverRun(setAside.bar);
    return STATE_TEXT.hearing;
  }

  /**
   * A run holding for the learner's first note says so (T8). Without it a
   * waiting run looks exactly like a frozen one — the state a control must
   * never be in unseen (`05` §6).
   */
  function firstNoteLine(hand: HandsFocus = hands): string {
    if (hand === 'R') return 'Your right hand starts — play its first note';
    if (hand === 'L') return 'Your left hand starts — play its first note';
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
    // Whether it is drawn beside a status line is the moment's (`drawChrome`).
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

  /**
   * The Metronome row, refused where it cannot act and saying when it will
   * where it is only waiting (T33, C3).
   *
   * **Free play is refused.** The engine never clicks in it — `start` and
   * `setMetronome` both refuse, because there is no timetable to click
   * against (`05` §3b) — and the row went on reading *On*: a control over
   * nothing, which `04` §0 R4 forbids. It reads *Off*, is disabled while the
   * reason holds and says the reason on its label; the learner's choice is
   * kept and comes back with a mode that has a clock.
   *
   * **The other three refusals are waits, not refusals**, and are said as
   * such: with no run going, paused, or holding for the first note, the
   * setting is honoured the moment the run moves (the start, the resume, the
   * latch each start the click). Disabling the row there would have made the
   * click impossible to set before pressing ▶, which is when it is wanted.
   */
  function drawMetronomeRow(): void {
    const runMode = session?.running === true ? session.mode : mode;
    const clockless = runMode === 'free';
    const shownOn = metronomeOn && !clockless;
    metronomeButton.disabled = clockless;
    metronomeButton.textContent = shownOn ? 'On' : 'Off';
    metronomeButton.classList.toggle('is-selected', shownOn);
    metronomeButton.setAttribute('aria-pressed', String(shownOn));
    let why: string | null = null;
    if (clockless) why = ROW_TEXT.metronomeNoClock;
    else if (metronomeOn && session?.running !== true) why = ROW_TEXT.metronomeWithRun;
    else if (metronomeOn && session?.paused === true) why = ROW_TEXT.metronomeOnResume;
    else if (metronomeOn && session?.armed === true) why = ROW_TEXT.metronomeOnFirstNote;
    setRowLabel(metronomeRow, why === null ? 'Metronome' : `Metronome — ${why}`);
  }

  /**
   * Blind and Perform, refused while a run is going (T33, C4).
   *
   * Both are routes: the screen is built again with the run set up that way
   * from its start, so pressing either mid-run lost the run, and a performance
   * or a blind run cannot be made out of a practice already under way. They
   * are live again once the run is paused — the one way this screen has of
   * stopping a run short of its end, and what the reason on the row says to
   * do — and the run left paused is offered back from its bar on the rebuilt
   * screen (`rememberUnfinished`), which is the net for every way out.
   */
  function drawRouteRows(): void {
    const going =
      session?.running === true && !session.paused && !hearing && hearingBar === null;
    blindToggle.disabled = going;
    performanceToggle.disabled = going;
    setRowLabel(blindRow, going ? `Blind — ${ROW_TEXT.pauseFirst}` : 'Blind');
    setRowLabel(performanceRow, going ? `Perform — ${ROW_TEXT.pauseFirst}` : 'Perform');
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
    // Belt and braces with the observer: every render is a moment the copies
    // sideways must agree with the header.
    syncSideways();
    modeSelect.value = mode;
    inputSelect.value = input;
    tempo.value = String(tempoPct);
    // Not while it is being typed into: writing the rounded value back on
    // every render would fight the digits going in.
    if (document.activeElement !== bpmField) bpmField.value = String(Math.round(bpmNow()));
    // The row's words and what is on it (the tempo label's among them: the
    // bpm is the number read while playing, its percentage the first word to
    // give), `fitBarControls`.
    fitBarControls();
    barsLabel.textContent = `${settings.barsPerWindow} bar${settings.barsPerWindow === 1 ? '' : 's'}`;
    // Scroll draws the whole piece and scrolls it, so there is no window for
    // the number to be about (`04` section 0 R4). The Layout row says where
    // the setting applies, so the sentence is not simply lost with the row.
    barsRow.hidden = settings.layout === 'scroll';
    {
      // The reason the count fell, as the renderer priced it (T38,
      // `data-window-why` on the stage). Sideways it is the room across at the
      // size the height gives — nothing would be drawn smaller, so "too small"
      // was false there. Over 100 % Size it is the size asked for (T34);
      // upright, more bars would put the staff under the floor.
      const asked = String(settings.barsPerWindow);
      const shown = String(barsShown);
      const why = stage.dataset.windowWhy ?? (settings.zoom > 1 ? 'size' : 'floor');
      const percent = String(Math.round(settings.zoom * 100));
      // **Compact where the sheet is two columns** (the stylesheet's
      // `max-height: 520px` rule, a phone held sideways): each row's words get
      // about 150 px beside their control, the hints are hidden, and a label
      // past two lines makes the row taller than its stepper — at 780 x 360 the
      // full sentence took four lines and put the sheet 26 px behind a scroll
      // (18 on CI's fonts), which `08` §7.2 forbids. Two lines cost the row
      // nothing. The count and the reason stay; the words shrink.
      const compact = window.innerHeight <= 520;
      setRowLabel(
        barsRow,
        barsShown < settings.barsPerWindow
          ? compact
            ? `Bars — ${asked} asked, ${shown} shown${
                why === 'across' ? ': fits across' : why === 'size' ? ` at ${percent} %` : ': too small'
              }`
            : `Bars in window — ${asked} asked, ${shown} shown: ${
                why === 'across'
                  ? `about ${shown} fit across at this size`
                  : why === 'size'
                    ? `at ${percent} % only ${shown} of ${asked} fit here`
                    : `${asked} would be too small here`
              }`
          : // The greyed next row, when it is wider than the stage at the
            // window's size (T38, `data-ahead`): the window keeps its size and
            // the row says what became of the next bar. Only where there is a
            // look-ahead row, which a phone held sideways never has.
            stage.dataset.ahead === 'continues'
            ? compact
              ? 'Bars — next bar runs on'
              : 'Bars in window — the next bar continues past the edge'
            : stage.dataset.ahead === 'start'
              ? compact
                ? 'Bars — part of next bar'
                : 'Bars in window — only the start of the next bar fits'
              : 'Bars in window',
      );
    }
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
    drawMetronomeRow();
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
    drawRouteRows();
    for (const hand of HANDS) {
      document.getElementById(`score-hands-${hand.id}`)?.classList.toggle('is-selected', hands === hand.id);
    }
    const playing = playReadsPause();
    playPause.textContent = playing ? '⏸' : '▶';
    playPause.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    // Nothing starts while a transfer offer's snapshot is unread (D4a), or while
    // ▶'s tap is waiting for the sound (U69); a refused tap is marked (G86a).
    drawPlayHold();
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
    section.dataset.keysGuide = guideFor();
    // Which mode the *run* is in, when it is not the one the select shows.
    section.dataset.hearing = String(hearing);
    hearButton.textContent = hearing ? 'Stop' : 'Hear it';
    hearButton.title = hearing
      ? 'Stop playing it to you'
      : 'Play the piece to you, nothing judged';
    section.dataset.input = input;
    // Last, from the moment as this render leaves it (U122c).
    drawChrome();
  }

  /**
   * What the keys guide is for this item (C1, reviewer decision 5): a
   * sight-reading drill has a default of its own, off, because a phrase read
   * with the next key lit is a phrase followed on the keys. The learner's
   * `keysGuide` governs everything else, and both are theirs in Settings.
   */
  function guideFor(): PracticeGuide {
    return item !== undefined && isSightReading(item) ? settings.keysGuideSightReading : settings.keysGuide;
  }

  /**
   * What the keys under the score showed during the run, as the record keeps
   * it (C1): what was on the glass, so a view that was off shows no guide and
   * no numbers whatever the settings said. A note's name was shown where the
   * ribbon labels its lit cell, or where Wait's line names the note.
   */
  function keysShown(): NonNullable<RunHeader['keys']> {
    const view = settings.keys;
    const guide = view === 'off' ? 'off' : guideFor();
    return {
      view,
      guide,
      fingers: guide !== 'off' && settings.keysFingerNumbers,
      names: (view === 'ribbon' && guide !== 'off') || (settings.showNoteNames && mode === 'wait'),
    };
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
      // A reading row whose recipe moved the hands says the hands it plays (C4).
      title.textContent = isSightReading(item) ? readingTitle(item.title, item.hands, routeRecipe) : item.title;
      // Unconditional, unlike the side panel below, which is a tablet's
      // second column: the rung decides what this run has to reach, and that
      // cannot depend on how wide the screen is. Kept, so the opening of a run
      // Today chose for its rung can wait for it (X46, below); it never rejects.
      const rungFound = findRung();
      // Shown only where the file has chord symbols in it (`openItem.ts`).
      chartRow.hidden = !hasChordSymbols(item);
      // Started now, beside the score's own reads; the first draw waits for
      // it further down (U80).
      const sideDecided = tablet ? fillSidePanel(item) : null;
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
        // The item's stored runs: a run already on this phrase makes the next
        // one a retry, not a first attempt (T37), and a phrase drawn here is
        // never one of them (C4 item 2). Where the route names the seed (the
        // daily read, Today's slot, *New phrase*) the phrase is drawn at once
        // and the answer comes in while it is engraved; where it does not, the
        // seed waits for the answer, which is one index walk.
        const history = sessionsForItem(item.id, PHRASE_HISTORY).catch((): SessionRow[] => []);
        const remember = (rows: readonly SessionRow[]): void => {
          for (const row of rows) if (row.seed !== undefined) seedsOnRecord.add(row.seed);
        };
        const named = router.route.seed;
        if (named === undefined) remember(await history);
        // The rung the run is for holds the phrase to what it has taught (C4c), or the route's hold (SR2).
        const judging = judgingRungId();
        const rungs = { ...(judging === undefined ? {} : { judging }), ...(routeHold === undefined ? {} : { hold: routeHold }) };
        const holding =
          rungs.hold === undefined && rungs.judging === undefined ? undefined : await loadCurriculum().catch((): undefined => undefined);
        let phrase: ReturnType<typeof generateSightReadingFor>;
        try {
          phrase = generateSightReadingFor(item, named ?? freshSeed(seedsOnRecord), routeRecipe, holding, rungs);
        } catch (cause: unknown) {
          if (!(cause instanceof SightReadingRefusal)) throw cause;
          // No phrase the generator checked (D1a): a terminal state with its
          // reason, as a score with no notes is — never the draw it could not
          // check, and nothing recorded, because nothing was read. The header
          // line says what happened, in words short enough to fit beside the
          // title (with the title in it, the news was cut off at 342 px); the
          // reason, a few sentences, goes where the music would have been.
          status.textContent = 'No phrase could be written';
          const reason = document.createElement('p');
          reason.className = 'score-refusal';
          reason.id = 'score-refusal';
          reason.textContent = cause.message;
          stage.replaceChildren(reason);
          bar.hidden = true;
          render();
          return;
        }
        musicXml = phrase.musicXml;
        phraseSeed = phrase.seed;
        phraseGenerator = phrase.generator;
        phraseWritten = { options: phrase.options, bpm: phrase.bpm };
        phraseHold = storedHold(holding, rungs);
        const seen = phrase.generator;
        void history.then((rows) => {
          remember(rows);
          if (rows.some((row) => row.seed === seen.seed && phraseVersionOf(row) === seen.version)) phraseSeen = true;
        });
      } else if (item.imported) {
        const row = await getImport(item.id);
        if (typeof row?.data !== 'string') throw new Error('the imported file is missing');
        musicXml = row.data;
        // An import is its stored bytes (G1): hashed here, where they are in
        // hand, so a duplicate import under a new id is the same material.
        loadedIdentity = await textIdentity(musicXml);
      } else {
        const response = await fetch(contentUrl(item.file as string));
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        const bytes = new Uint8Array(await response.arrayBuffer());
        musicXml = toMusicXml(bytes);
      }
      // What a run of this item plays, and what the learner had met of it
      // before this visit (G1): read beside the engraving, answered before play.
      encounterTarget = {
        itemId: item.id,
        material: playedMaterial(item, {
          ...(phraseGenerator !== undefined && phraseWritten !== undefined ? { phrase: { generator: phraseGenerator, ...phraseWritten } } : {}),
          ...(loadedIdentity === undefined ? {} : { loaded: loadedIdentity }),
        }),
        idNamesMaterial: !sightReading,
      };
      const target = encounterTarget;
      // The session's activity is open, and this is what it plays (X1): the runner marks it active and
      // rechecks a first-contact assumption through G2's adapter, this visit's own viewing aside.
      void sessionRun?.opened({ itemId: item.id, ...(target.material === undefined ? {} : { material: target.material }), visit });
      historyRead = catalogIndex()
        .then((index) => index.byId, () => undefined)
        .then((byId) => historyFor(target, byId === undefined ? {} : { byId }))
        .catch(() => null);
      // The model comes from an instance with no draw range: a windowed OSMD
      // clamps its cursor iterator, so extracting from the renderer's own view
      // would yield a model that stops at the end of the first window.
      const probe = new OsmdView(document.createElement('div'));
      await probe.load(musicXml);
      // The row's declared hand where it is authoritative (HD1): a one-staff left-hand cut is the left
      // hand's, though OSMD numbers its staff 1. A phrase and an import declare none (`declaredHand.ts`).
      const loaded = probe.extractModel({ id: item.id, ...declaredHandOption(item), ...verifiedHandsOption(item) });
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
      // The whole of it, in printed bars, which a run over every bar covers (G1).
      encounterTarget = { ...encounterTarget, extent: loaded.sourceMeasureCount };

      // The side panel decided before the stage is priced (U80). On a tablet
      // its column is part of the stage's width, and the renderer fits the
      // score to the stage it is handed — so a panel that arrives after the
      // first draw narrows the stage under music already drawn, and the sheet
      // is fitted again, smaller. Measured on the served build (Entry 125),
      // every piece `side-panel-prose.spec.ts` sweeps was first drawn before
      // its panel was decided, at every tablet size tried, and refitted
      // narrower where the column takes width from the stage. The panel's
      // reads (the curriculum and the lesson file, both precached) have run
      // beside the score's since the item was found, so the wait is only what
      // the panel takes past the score's own load. Bounded all the same,
      // because the lesson's fetch has no timeout of its own and a score must
      // open with or without its prose: past the bound the stage is priced
      // undecided — which on a tablet keeps the column's track, so a panel
      // that then arrives with text moves nothing, and one left out gives the
      // stage its width back as an ordinary resize.
      if (sideDecided) {
        let bound: number | undefined;
        await Promise.race([
          sideDecided,
          new Promise<void>((resolve) => {
            bound = window.setTimeout(resolve, SIDE_PANEL_WAIT_MS);
          }),
        ]);
        window.clearTimeout(bound);
      }

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
        // No folded band (U118's `foldedReserve`): the chip it priced is not
        // drawn since U122c, so the stacked slots start at the stage's top in
        // every moment and the music never moves under a fold.
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
      // The notation is on the screen: this visit's viewing (G1).
      noteViewing();

      // The range this piece uses, not all 88 keys. With the full keyboard
      // on a 360 px phone every key is about seven pixels, and the blue key
      // marking the note the app is waiting for is a sliver among eighty-
      // eight slivers — which is exactly how a run got stuck on an F#4 that
      // was on the screen the whole time.
      keysRange = stripRangeFor(loaded.steps.flatMap((step) => step.notes.map((note) => note.midi)));
      mountKeys()?.scrollToNote(loaded.steps[0]?.notes[0]?.midi ?? 60, 'auto');

      session = new ScoreSession({
        model: loaded,
        renderer,
        strip,
        stripOptions: { guide: guideFor(), fingers: settings.keysFingerNumbers, flash: settings.keysFlash },
        piano: null,
        // Asked at every start, frame, latch and resume, not taken now (U67):
        // this runs as the piece loads, which on a reload or a link straight to
        // a piece is before any tap, when the engine has no context and no
        // master gain, and a pair fixed here was none for the whole visit. The
        // engine stays the one owner of the context; this only reads it.
        audio: () => ({ context: audioEngine.contextOrNull, destination: audioEngine.masterGain }),
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
        //
        // A demonstration over a run set aside puts that run back (T33, C1),
        // and that is deferred by a microtask for the reason `climbLadder`
        // gives: this finish is emitted from inside the demonstration's own
        // engine, and restoring the run from here would set the session going
        // again under the frame that is still unwinding.
        if (hearing) {
          if (session?.hasSuspended === true || restartAfterDemo !== null) {
            queueMicrotask(() => {
              if (hearing) endDemonstration('end');
            });
            return;
          }
          endDemonstration('end');
          return;
        }
        if (mode === 'listen') {
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

      // A transfer route's offer (D4a), read before anything can start: until it answers the screen
      // is still loading — no bar, no keys listening, ▶ disabled — and a read that never answers
      // leaves it so, never a practice run in the offer's place. Started when the screen was built,
      // beside the score's own fetch.
      if (offerRead) settleOffer(await offerRead);
      // And what the learner had met of it (G1), before anything can start:
      // a run's first contact is judged against it.
      history = historyRead === null ? null : await historyRead;

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
      // A run Today chose for its rung (`?rung=`, a session's activity or a card row) is what the lesson
      // asks for, so it opens where it can count (X46, `responses/9e14839e.md` §2 point 3,
      // `responses/43045ffb.md` §4: the item's role is a criterion attempt). It opened in the learner's
      // defaults, Wait for me at 70 %, on a rung that counts only Keep tempo at 80 %, and the learner met
      // the rule by failing it twice. Not a sight-read (the reader's own tempo and evidence), not a route
      // that names its mode, and not with nothing to listen (nothing measured can count): there the defaults
      // stand. The select and the tempo stay the learner's to change.
      else if (!sightReading && todayRung !== undefined && input !== 'none') {
        await rungFound;
        const opening = openingThatCounts({ mode, tempoPct }, judgingCriteria());
        mode = opening.mode;
        tempoPct = opening.tempoPct;
        tempoApplied = tempoPct;
        // Rhythm only, a preference remembered from another screen, would make this Keep tempo run one that
        // never counts as playing the piece; off here, and kept as the learner set it everywhere else.
        rhythmOnly = false;
      }
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

  /**
   * What the offer's snapshot said (D4a): the offer's relationship for the run, or practice and the
   * line that says so. Before the bar is shown and the sheet fitted, so the line's room is counted.
   */
  function settleOffer(read: OfferRead): void {
    if (read.kind === 'kept') {
      offer = { kind: 'kept', relationship: read.snapshot.relationship };
      return;
    }
    offer = { kind: 'refused', why: read.why };
    offerNote.textContent = read.why === 'corrupt' || read.why === 'unreadable' ? OFFER_TEXT.unreadable : OFFER_TEXT.gone;
    offerNote.hidden = false;
  }

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
   *
   * ▶'s keyboard twin, and a user activation like it, so it asks the sound to
   * start the same way (U69), and starts only if the screen still may when
   * the wait is over and the sound is running (G86a). Its refusal is ▶'s,
   * and says to tap ▶.
   */
  const spaceMayStart = (): boolean =>
    session !== null && !session.running && sheet.hidden && !hearing && !sheetOpen();
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== ' ' || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('button, input, select, textarea, a, summary, details, [contenteditable], [role="button"]')) return;
    if (!spaceMayStart()) return;
    event.preventDefault();
    withSound(() => {
      if (!spaceMayStart()) return;
      startRun();
      render();
    });
  };
  document.addEventListener('keydown', onKeyDown);

  onScreenDispose(section, () => {
    // Stopping a session is itself a finish and comes back through
    // `onFinished`, so tearing the screen down draws a summary — which would
    // otherwise forget the very run this is about to remember.
    leaving = true;
    // The ⋯ and tempo sheets go with the screen (G86), first, so nothing below
    // can leave them behind: each sits on `body`, outside what the app shell
    // clears, with the rest of the page inert until it closes. Their rows go
    // back to the stash as they close.
    for (const close of openSheets.splice(0)) close();
    // A late answer to a refused tap redraws nothing on a screen that has gone (G86a).
    stopWatchingSound();
    // A run still waiting for *How did it go?* is let go: it is a run the app
    // heard nothing of, and unanswered it has no evidence to write (T40; T37
    // wrote it as it stood).
    flushPendingRecord();
    // Where the run was left, if it was left. Read off the same step the bar
    // readout reads, so the number the offer prints next time is the number
    // the screen was showing when the learner walked away.
    // The run's mode, not the selector's (T31, the same fault as the beat dot
    // and the page-hidden pause). `Hear it` and the one-bar preview are Listen
    // runs under a selector that still says *Wait for me*, so leaving during a
    // demonstration wrote *You stopped at bar 7 of 12 last time* — an offer to
    // carry on with a run nobody had played a note of.
    // And the run set aside under a demonstration, which is the learner's run
    // whatever is playing over it (T33, C1): Back, Blind or Perform pressed
    // while the piece is being played to them leaves that run half way.
    const leftStep = session?.hasSuspended
      ? session.suspendedStep
      : session?.running === true && session.mode !== 'listen'
        ? (session.state?.step ?? 0)
        : null;
    if (leftStep !== null && leftStep !== undefined && model && itemId !== undefined) {
      const step = leftStep;
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
    endPeek();
    // The session's clock writes what it holds; a screen left before its summary leaves the activity as it
    // was — active, for *Continue* — and never completes it (X1: interrupted).
    stopSessionClock?.();
    detachInput();
    releaseWakeLock();
    session?.dispose();
    strip?.destroy();
    renderer?.dispose();
  });

  return section;
}
