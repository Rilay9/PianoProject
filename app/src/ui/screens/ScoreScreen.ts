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
import { audioEngine } from '../../audio/AudioEngine';
import { metronomeSoundFor } from '../../audio/inputPolicy';
import { getPiano, micSource, screenKeyboardSource, webMidiSource } from '../../app/services';
import { findItem, contentUrl, loadCurriculum } from '../../curriculum/load';
import { parseFrontMatter, renderMarkdown } from '../markdown';
import { barsPerWindowFor, isTablet } from '../tablet';
import { getImport } from '../../data/importStore';
import { isSightReading } from '../../engine/drills/fromCatalog';
import { generateSightReading, type SightReadingLevel } from '../../engine/sightReading';
import type { CatalogItem } from '../../curriculum/types';
import { getMidiSettings } from '../../data/midiSettings';
import {
  DEFAULT_SETTINGS,
  getSettings,
  updateSettings,
  type FollowInput,
  type KeysView,
} from '../../data/settingsStore';
import { evaluateOutcome } from '../../engine/Scoring';
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
import { openSheet } from '../widgets';

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

/** Below this the bar cannot hold the sentences. Measured, not chosen. */
// 440, not 400: at 412 px — the other common phone width — the long mode
// labels fitted the row but not the select, which clipped "Wait for me" to
// "Wait for m" (the state gallery, size 412).
const NARROW_BAR_PX = 440;

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
function generateSightReadingFor(item: CatalogItem): string {
  const params = item.drill?.params ?? {};
  const hands = params.hands === 'left' ? 'L' : params.hands === 'both' ? 'both' : 'R';
  const level = (typeof params.level === 'number' ? params.level : 1) as SightReadingLevel;
  return generateSightReading({
    level,
    hands,
    ...(typeof params.bars === 'number' ? { bars: params.bars } : {}),
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
  let item: CatalogItem | undefined;
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
   * A bar being played back on its own (P21c B4).
   *
   * `04` §5 has listed "long-press a bar plays it" among the gestures since
   * the spec was written and it was never built. In Wait mode it is the
   * "show me what this is meant to sound like" for the bar you are stuck on.
   * Holds what the run was doing so it can be put back afterwards.
   */
  let hearingBar: { mode: Mode; loop: { from: number; to: number } | null } | null = null;
  /** The pending long-press, if a finger is down on the stage. */
  let pressHold: number | null = null;
  /** Where that finger went down, so a wobble can be told from a drag. */
  let pressFrom: { x: number; y: number } | null = null;
  /** Runs finished since this exercise was generated (see the summary sheet). */
  let sightReadAttempts = 0;
  let input: FollowInput = 'none';
  let hands: HandsFocus = 'both';
  let tempoPct = settings.defaultTempoPct;
  let metronomeOn = false;
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

  const back = button('← Back', () => router.navigate(router.route.tab), 'score-back');

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

  head.append(back, title, where, status, waitingLine, micMeter);
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
  const backSide = button('← Back', () => router.navigate(router.route.tab), 'score-back-side');
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
    // The waiting line is the more useful of the two when it has something.
    statusSide.textContent = waitingLine.hidden ? status.textContent : waitingLine.textContent;
    corner.textContent = [where.textContent, waitingLine.hidden ? '' : waitingLine.textContent]
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
  unsubscribers.push(() => window.removeEventListener('resize', applyModeLabels));

  const handsGroup = document.createElement('div');
  handsGroup.className = 'score-group';
  for (const hand of HANDS) {
    handsGroup.appendChild(
      button(
        hand.label,
        () => {
          hands = hand.id;
          forgetPlayingHand();
          renderer?.setHandsFocus(hand.id);
          if (session?.running) startRun();
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
      attachInput();
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
      if (session?.running) startRun();
      render();
    },
    'score-metronome',
  );

  const barsDown = button('−', () => setBars(settings.barsPerWindow - 1), 'score-bars-down');
  barsDown.setAttribute('aria-label', 'One bar fewer in the window');
  const barsLabel = document.createElement('span');
  barsLabel.id = 'score-bars';
  barsLabel.className = 'score-bars';
  const barsUp = button('+', () => setBars(settings.barsPerWindow + 1), 'score-bars-up');
  barsUp.setAttribute('aria-label', 'One bar more in the window');

  const zoomOut = button('－', () => setZoom(settings.zoom - 0.1), 'score-zoom-out');
  zoomOut.setAttribute('aria-label', 'Smaller notes');
  const zoomIn = button('＋', () => setZoom(settings.zoom + 0.1), 'score-zoom-in');
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
  layoutGroup.id = 'score-layout';
  const layoutWindow = button('Window', () => setLayout('window'), 'score-layout-window');
  const layoutScroll = button('Scroll', () => setLayout('scroll'), 'score-layout-scroll');
  layoutGroup.append(layoutWindow, layoutScroll);

  /**
   * Keys, ribbon or nothing (P21d A6).
   *
   * The ribbon is the strip's information at a third of the height, with the
   * wanted note's *name* over it — which is what the F♯4 evening was missing.
   * Which of the two he wants is his taste, so both are here to be tried.
   */
  const keysGroup = document.createElement('div');
  keysGroup.className = 'score-group';
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
    () => router.navigateScore(itemId, { blind: !blind, performance: performanceRun }),
    'score-blind',
  );
  blindToggle.setAttribute('aria-label', blind ? 'Show the score' : 'Hide the score');

  const performanceToggle = button(
    performanceRun ? 'On' : 'Off',
    () => router.navigateScore(itemId, { blind, performance: !performanceRun }),
    'score-performance',
  );
  performanceToggle.setAttribute(
    'aria-label',
    performanceRun ? 'Stop performing and go back to practising' : 'Play it as a performance',
  );

  const sectionRow = menuRow('Section', 'Jump to a named part of the piece.', sectionSelect);
  sectionRow.hidden = true;

  menuStash.append(
    // A performance is one pass through. Offering a restart during one would
    // be offering to make it not a performance (replan §8).
    ...(performanceRun ? [] : [menuRow('Start again', 'Back to bar 1 without leaving this screen.', restart)]),
    menuRow('Input', 'What the app listens to while you play: the piano over its cable, the microphone, or nothing.', inputSelect),
    sectionRow,
    menuRow('Loop', 'Repeat a few bars over and over until they are yours. Double-tap the sheet to mark them.', loopButton),
    menuRow('Metronome', 'The click, on or off.', metronomeButton),
    menuRow('Bars in window', 'How much music is on the screen at once. Fewer bars means bigger notes.', barsDown, barsLabel, barsUp),
    menuRow('Size', 'Bigger or smaller notes, around whatever already fits.', zoomOut, zoomIn),
    menuRow('Layout', 'A screenful at a time, or one long sheet you scroll through.', layoutGroup),
    menuRow('Keys', 'The keyboard under the score: the full strip, a thin ribbon that names the note, or nothing.', keysGroup),
    menuRow('Sound', 'Whether the phone or the piano plays the hand you are not practising.', destinationButton),
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
    settings.barsPerWindow = Math.min(MAX_BARS_PER_WINDOW, Math.max(MIN_BARS_PER_WINDOW, Math.round(next)));
    updateSettings({ barsPerWindow: settings.barsPerWindow });
    renderer?.setBarsPerWindow(settings.barsPerWindow);
    // A re-engraving recreates every element the run's judgements are keyed
    // to, so the run restarts rather than continuing over a sheet that has
    // forgotten it (`08` §8.3).
    if (session?.running) startRun();
    render();
  }

  function setZoom(next: number): void {
    settings.zoom = Math.min(2.5, Math.max(0.5, Math.round(next * 10) / 10));
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
    if (session?.running) startRun();
    render();
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
      session?.feed(event.midi, event.velocity, event.tMs, event.confidence ?? 1);
    } else {
      session?.feedOff(event.midi, event.tMs);
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
        status.textContent = `Microphone unavailable: ${String(cause)} — using the clock instead.`;
        input = 'none';
        render();
      });
    }
  }

  // --- run -----------------------------------------------------------------

  function startRun(): void {
    if (!session || !model) return;
    sheet.hidden = true;
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
      playbackHands: runMode === 'listen' ? 'both' : settings.playbackHands,
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
    if ((runMode === 'wait' || runMode === 'tempo') && session.expectedNow.length === 0) {
      session.stop();
      status.textContent =
        hands === 'both'
          ? 'Nothing to play in this piece'
          : `Nothing for the ${hands === 'L' ? 'left' : 'right'} hand in this piece — choose ${hands === 'L' ? 'R' : 'L'} or Both`;
      render();
      return;
    }
    sayWhichHandIsPlayed(runMode);
    attachInput();
    void requestWakeLock();
    // Starting a run is what arms the auto-hide.
    showBar(CONTROL_BAR_START_HIDE_MS);
    render();
  }

  /**
   * Says, once per run, that the sound is the app playing the other hand.
   *
   * Only when there is another hand to play: with `Both` chosen nothing is
   * played under you, and in a Listen or `Hear it` run the whole point is
   * that the app is playing, which the button already said.
   */
  function sayWhichHandIsPlayed(runMode: Mode): void {
    if (saidPlayingHand) return;
    if (runMode === 'listen' || runMode === 'free') return;
    if (hands === 'both') return;
    if (settings.playbackHands !== 'non-focused') return;
    // Only when that hand has notes: "playing the left hand for you" over a
    // right-hand tune is a sentence about nothing.
    if (model?.handsPresent[hands === 'R' ? 'L' : 'R'] !== true) return;
    const other = hands === 'R' ? 'left' : 'right';
    status.textContent = `Playing the ${other} hand for you`;
    saidPlayingHand = true;
  }

  /** `Hear it`: start a Listen run, or stop the one this button started. */
  function toggleHear(): void {
    if (!session) return;
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
    const clocked = mode === 'tempo' || mode === 'listen' || hearing;
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
    else if (session.state?.paused === true) session.resume();
    else session.pause();
    render();
  }

  /** Choosing a different hand makes the sentence worth saying again. */
  function forgetPlayingHand(): void {
    saidPlayingHand = false;
  }

  function clearLoop(): void {
    loopBars = null;
    loopAnchor = null;
    loopSection = null;
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
    hearingBar = { mode, loop: loopBars };
    loopBars = { from: measure, to: measure };
    loopSection = null;
    status.textContent = `Bar ${String(measure)}, as written`;
    startRun();
  }

  /** The bar has been played once; give the screen back what it had. */
  function endBarPreview(): void {
    const was = hearingBar;
    if (!was) return;
    // Stopped while the flag is still set, because stopping is itself a finish
    // and it arrives back through `onFinished`. Cleared first, that finish
    // looked like the end of an ordinary run and opened the summary sheet over
    // a bar nobody had played.
    session?.stop();
    hearingBar = null;
    loopBars = was.loop;
    clearBeat();
    status.textContent = '';
    render();
  }

  stage.addEventListener('dblclick', (event) => {
    const measure = measureAt(event.target);
    if (measure === null) return;
    if (loopAnchor === null) {
      loopAnchor = measure;
      status.textContent = `Loop start: bar ${measure}. Double-tap the last bar.`;
    } else {
      loopBars = { from: Math.min(loopAnchor, measure), to: Math.max(loopAnchor, measure) };
      loopAnchor = null;
      loopSection = null;
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
  async function fillSidePanel(target: CatalogItem): Promise<void> {
    const body = document.getElementById('score-side-body');
    if (!body) return;
    try {
      const curriculum = await loadCurriculum();
      let found: { id: string; title: string; textFile: string } | null = null;
      for (const stage of curriculum.stages) {
        for (const unit of stage.units) {
          for (const lesson of unit.lessons) {
            if (found) break;
            if (
              lesson.songOptions.includes(target.id) ||
              lesson.exerciseOptions.includes(target.id)
            ) {
              found = { id: lesson.id, title: lesson.title, textFile: lesson.textFile };
            }
          }
        }
      }
      if (!found) return;
      const summary = document.getElementById('score-side-summary');
      if (summary) summary.textContent = `${found.id} · ${found.title}`;
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
    // A demonstration that has finished is over, whatever else happens next.
    hearing = false;
    clearBeat();
    // "Playing the left hand for you" must not stand over a finished run
    // (`08` §6.3).
    status.textContent = '';
    sheet.replaceChildren();
    const outcome = evaluateOutcome(score, {
      passAccuracy: settings.passAccuracyPct / 100,
      passTempoPct: settings.passTempoPct,
      masterAccuracy: 0.97,
      masterTempoPct: 100,
    });

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
      }).catch((cause: unknown) => {
        status.textContent = `Could not save this run: ${String(cause)}`;
      });
    }

    const title = document.createElement('h2');
    title.textContent = outcome.masterEligible ? 'Mastered' : outcome.passed ? 'Passed' : 'Run finished';
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
    addStat(lines, 'Accuracy', `${Math.round(score.accuracy * 100)}%${score.accuracyEstimated === true ? ' (estimated)' : ''}`);
    addStat(lines, 'Tempo', `${Math.round(score.tempoPct)}% of written`);
    if (heard) {
      addStat(lines, 'Wrong notes', String(score.wrongNotesTotal));
    }
    addStat(lines, 'Missed', String(score.missedTotal));
    // The bars that went worst, by printed number, so the learner knows where
    // to look before choosing `Loop the weak bars` (`08` §6.2).
    const weakest = [...score.hotSpots]
      .filter((spot) => spot.misses + spot.wrongs > 0)
      .sort((a, b) => b.misses + b.wrongs - (a.misses + a.wrongs))
      .slice(0, 3)
      .map((spot) => printedBar(model?.steps.find((s) => s.measureIndex === spot.measureIndex)?.sourceMeasureIndex ?? spot.measureIndex));
    if (weakest.length > 0) addStat(lines, 'Weakest bars', [...new Set(weakest)].sort((a, b) => a - b).join(', '));
    if (score.timing && heard) {
      addStat(lines, 'Timing', `${Math.round(score.timing.meanMs)} ms mean, ${Math.round(score.timing.earlyPct)}% early`);
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
      button('Loop the weak bars', () => loopWeakBars(score), 'summary-loop'),
      button('Done', () => {
        sheet.hidden = true;
        router.navigate(router.route.tab);
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
    sheet.hidden = false;
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
    const wanted =
      getSettings().showNoteNames && mode === 'wait' && session?.running === true
        ? waitingForLine(session.expectedNow)
        : '';
    waitingLine.textContent = wanted;
    waitingLine.hidden = wanted === '';
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

  function render(): void {
    drawWaitingFor();
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
    barsLabel.textContent = `${settings.barsPerWindow} bar${settings.barsPerWindow === 1 ? '' : 's'}`;
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
        ? `Bars ${loopBars.from}–${loopBars.to} ✕`
        : 'Off';
    loopButton.classList.toggle('is-selected', loopBars !== null);
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
        musicXml = generateSightReadingFor(item);
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
            engineMode: state.mode,
            input,
          };
        };
      }

      // Draw the first window. `WindowRenderer.create` prepares its buffers but
      // does not commit to a position: the first `showStep` is what puts notes
      // on the screen, and without it the stage is two empty divs.
      renderer.showStep(0);

      if (sightReading) {
        // Tempo mode, always: waiting for each note is not sight-reading, it
        // is decoding (docs/05 §8).
        mode = 'tempo';
        const modeSelect = document.getElementById('score-mode');
        if (modeSelect instanceof HTMLSelectElement) modeSelect.value = 'tempo';
      }

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
        if (hearingBar) {
          if (looped) endBarPreview();
          return;
        }
        // An ordinary loop run keeps going; only a real ending is a summary.
        if (looped) return;
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
        if (mode === 'free') {
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
      // The title is in the header now. The status line is for the app's own
      // messages, and "Loading…" is finished being true.
      //
      // Except in a blind run, where the screen is an empty black rectangle
      // and nothing else on it says why: "Show the score" moved into the ⋯
      // sheet with the rest of the settings, so without this the screen looks
      // broken rather than deliberate.
      status.textContent = blind ? 'Blind — ⋯ shows the score' : '';
      if (sections.length > 0) sectionRow.hidden = false;
      showBar();
      render();
      // Now that there is a drawn sheet to measure, grow it to fill the
      // screen. Once, here — not from inside every draw, which would recreate
      // every note element mid-run.
      renderer?.fitToStage();
    } catch (cause: unknown) {
      status.textContent = `Could not open this score: ${String(cause)}`;
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
      const driven = mode === 'tempo' || mode === 'listen';
      if (!driven || session?.running !== true || session.state?.paused === true) return;
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
    status.textContent = `Paused — you were away ${String(away)} s. ▶ to carry on, ⏮ to start again.`;
    showBar();
    render();
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

  onScreenDispose(section, () => {
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    if (hideTimer !== null) window.clearTimeout(hideTimer);
    detachInput();
    releaseWakeLock();
    session?.dispose();
    strip?.destroy();
    renderer?.dispose();
  });

  return section;
}
