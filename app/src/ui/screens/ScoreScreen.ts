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
import { KeyboardStrip } from '../KeyboardStrip';
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
  let strip: KeyboardStrip | null = null;
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

  // Beside the status line, hidden unless the owner has asked for note names.
  const waitingLine = document.createElement('p');
  waitingLine.className = 'score-waiting';
  waitingLine.id = 'score-waiting';
  waitingLine.hidden = true;

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

  head.append(back, beatDot, title, status, waitingLine, micMeter);

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

  tempoStash.append(menuRow('Speed', tempo), menuRow('Beats per minute', bpmField));

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

  const stripButton = button(
    'Off',
    () => {
      settings.keyboardStrip = !settings.keyboardStrip;
      updateSettings({ keyboardStrip: settings.keyboardStrip });
      render();
    },
    'score-strip-toggle',
  );

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

  const sectionRow = menuRow('Section', sectionSelect);
  sectionRow.hidden = true;

  menuStash.append(
    // A performance is one pass through. Offering a restart during one would
    // be offering to make it not a performance (replan §8).
    ...(performanceRun ? [] : [menuRow('Start again', restart)]),
    menuRow('Input', inputSelect),
    sectionRow,
    menuRow('Loop', loopButton),
    menuRow('Metronome', metronomeButton),
    menuRow('Bars in window', barsDown, barsLabel, barsUp),
    menuRow('Size', zoomOut, zoomIn),
    menuRow('Layout', layoutGroup),
    menuRow('Keys', stripButton),
    menuRow('Sound', destinationButton),
    menuRow('Blind', blindToggle),
    menuRow('Perform', performanceToggle),
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
    render();
  }

  /**
   * One labelled row of the `⋯` sheet: the word on the left, the control on
   * the right. Every control in there gets a word — the bar was where a glyph
   * on its own had to do, and `🎵` alone is a guess.
   */
  function menuRow(label: string, ...controls: HTMLElement[]): HTMLElement {
    const row = document.createElement('div');
    row.className = 'score-menu-row';
    const text = document.createElement('span');
    text.className = 'score-menu-row__label';
    text.textContent = label;
    const holder = document.createElement('div');
    holder.className = 'score-menu-row__control';
    holder.append(...controls);
    row.append(text, holder);
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
    return model ? bpmAt(model.tempoMap, 0) : 80;
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
    const loop =
      loopBars && !performanceRun
        ? loopSection
          ? session.loopForPrintedBars(loopBars.from, loopBars.to)
          : session.loopForMeasures(loopBars.from, loopBars.to)
        : undefined;
    // A `Hear it` run is a Listen run that leaves the select alone.
    const runMode: Mode = hearing ? 'listen' : mode;
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
    sayWhichHandIsPlayed(runMode);
    attachInput();
    void requestWakeLock();
    // Starting a run is what arms the auto-hide.
    showBar();
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
    const other = hands === 'R' ? 'left' : 'right';
    status.textContent = `Playing the ${other} hand for you`;
    saidPlayingHand = true;
  }

  /** `Hear it`: start a Listen run, or stop the one this button started. */
  function toggleHear(): void {
    if (!session) return;
    if (hearing || session.running) {
      session.stop();
      hearing = false;
      clearBeat();
      render();
      return;
    }
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
    // From the piece, not a guess: a count-in of four over a 3/4 waltz would
    // be counting a bar that does not exist.
    const beatsPerBar = Math.max(1, Math.round(model?.timeSigMap[0]?.beats ?? 4));
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

  function measureAt(target: EventTarget | null): number | null {
    if (!(target instanceof Element)) return null;
    const holder = target.closest('[data-measure]');
    const raw = holder instanceof HTMLElement ? holder.dataset.measure : undefined;
    const value = Number(raw);
    return Number.isFinite(value) ? value : (renderer?.currentWindow?.fromMeasure ?? null);
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
   * Whether hiding the bar would give the notation anything (decision 5).
   *
   * The stage reserves the bar's height rather than being covered by it, so
   * the bar is never literally on top of a note. What "would otherwise
   * overlap" means in that layout is: the engraving has been fitted to a
   * stage that the bar is taking a strip off, and it used all of it. Held
   * upright, with a third of the stage empty under the sheet, it has not —
   * and hiding the controls buys nothing but a hunt for them.
   *
   * One measurement, when the timer fires. Nothing here runs per frame.
   */
  function barCostsMusicRoom(): boolean {
    // The ink, not the SVG element. The element is the page OSMD laid the
    // window out on — taller than the music and, since the fit anchors the
    // ink's top-left in the stage's, hanging off the edge on purpose. Asking
    // the element whether the music reached the bottom of the stage answered
    // yes when it had not, and the bar hid itself for nothing.
    const music = renderer?.inkRect();
    if (!music) return false;
    if (music.bottom - music.top < 20) return false;
    const box = stage.getBoundingClientRect();
    // Within a line's height of the bottom edge: the fit ran out of stage.
    return music.bottom >= box.bottom - 24;
  }

  function showBar(): void {
    bar.dataset.visible = 'true';
    requestAnimationFrame(measureBar);
    if (hideTimer !== null) window.clearTimeout(hideTimer);
    if (session?.running !== true) return;
    hideTimer = window.setTimeout(() => {
      if (session?.running === true && barCostsMusicRoom()) {
        bar.dataset.visible = 'false';
        requestAnimationFrame(measureBar);
      }
    }, CONTROL_BAR_HIDE_MS);
  }
  function toggleBar(): void {
    if (bar.dataset.visible === 'true') {
      bar.dataset.visible = 'false';
      requestAnimationFrame(measureBar);
    } else showBar();
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
    title.textContent = outcome.passed ? 'Passed' : 'Run finished';
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
    loopBars = { from: worst.measureIndex, to: worst.measureIndex + 1 };
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

  function render(): void {
    drawWaitingFor();
    modeSelect.value = mode;
    inputSelect.value = input;
    tempo.value = String(tempoPct);
    // Not while it is being typed into: writing the rounded value back on
    // every render would fight the digits going in.
    if (document.activeElement !== bpmField) bpmField.value = String(Math.round(bpmNow()));
    tempoLabel.textContent = `${tempoPct}% · ${Math.round(bpmNow())} bpm`;
    barsLabel.textContent = `${settings.barsPerWindow} bar${settings.barsPerWindow === 1 ? '' : 's'}`;
    layoutWindow.classList.toggle('is-selected', settings.layout === 'window');
    layoutWindow.setAttribute('aria-pressed', String(settings.layout === 'window'));
    layoutScroll.classList.toggle('is-selected', settings.layout === 'scroll');
    layoutScroll.setAttribute('aria-pressed', String(settings.layout === 'scroll'));
    metronomeButton.textContent = metronomeOn ? 'On' : 'Off';
    metronomeButton.classList.toggle('is-selected', metronomeOn);
    metronomeButton.setAttribute('aria-pressed', String(metronomeOn));
    stripButton.textContent = settings.keyboardStrip ? 'On' : 'Off';
    stripButton.classList.toggle('is-selected', settings.keyboardStrip);
    stripButton.setAttribute('aria-pressed', String(settings.keyboardStrip));
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
    stripHost.hidden = !settings.keyboardStrip;
    section.dataset.running = String(session?.running === true);
    section.dataset.mode = mode;
    // Which mode the *run* is in, when it is not the one the select shows.
    section.dataset.hearing = String(hearing);
    hearButton.textContent = hearing ? 'Stop' : 'Hear it';
    hearButton.title = hearing
      ? 'Stop playing it to you'
      : 'Play the piece to you, nothing judged';
    section.dataset.input = input;
  }

  // --- load ----------------------------------------------------------------

  void (async () => {
    try {
      item = await findItem(itemId);
      if (!item) {
        status.textContent = `Unknown item “${itemId}”.`;
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
        return;
      }
      const sightReading = isSightReading(item);
      if (!item.file && !item.imported && !sightReading) {
        status.textContent = `${item.title} has no notation to open. ${item.importHint ?? ''}`.trim();
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
      });

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

      if (settings.keyboardStrip) {
        // Tappable, because for a learner with no MIDI cable this strip *is*
        // the instrument (docs/04 §5). It feeds the shared ScreenKeyboardSource
        // rather than the session directly, so "screen keys" is an input like
        // any other and the engine cannot tell the difference.
        // The range this piece uses, not all 88 keys. With the full keyboard
        // on a 360 px phone every key is about seven pixels, and the blue key
        // marking the note the app is waiting for is a sliver among eighty-
        // eight slivers — which is exactly how a run got stuck on an F#4 that
        // was on the screen the whole time.
        const range = stripRangeFor(
          loaded.steps.flatMap((step) => step.notes.map((note) => note.midi)),
        );
        strip = new KeyboardStrip({
          ...range,
          interactive: true,
          onNoteOn: (midi, velocity) => screenKeyboardSource.noteOn(midi, velocity),
          onNoteOff: (midi) => screenKeyboardSource.noteOff(midi),
        });
        stripHost.appendChild(strip.el);
        strip.scrollToNote(loaded.steps[0]?.notes[0]?.midi ?? 60, 'auto');
      }

      const context = audioEngine.contextOrNull;
      session = new ScoreSession({
        model: loaded,
        renderer,
        strip,
        piano: null,
        audioContext: context,
        destination: audioEngine.masterGain,
        onChange: render,
        onBeat: (tick) => onBeat(tick),
      onFinished: (score) => showSummary(score),
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
