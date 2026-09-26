// Minimal hash-based router.
//
// Why hash routing: the app is deployed under a sub-path on GitHub Pages
// (`/PianoProject/`) with no server-side rewrite rules available, and it is
// installed as a PWA that must keep working when opened straight from the
// home-screen icon (a fresh navigation, not a client-side push). Hash routes
// never hit the server, so there is nothing to configure or break in either
// case. History-API routing would need a Pages 404->index fallback and is
// unnecessary here since the app has no deep content to link externally.

import type { Mode } from './engine/types';
import type { HandsFocus } from './score/WindowRenderer';
import { LAB_BEDS, LAB_LOCKS, type LabBed, type LabLock } from './engine/sightReading';
import type { SlotKind } from './curriculum/session';
import type { ReadingMoves } from './data/db';

/**
 * What Today's reader moved from a reading row's own recipe, and whether the
 * phrase is the easy one on purpose (C4): `?recipe=hands:both,fifths:1,easy:1`.
 */
export interface RouteRecipe {
  moved?: ReadingMoves;
  easy?: true;
}

export const TAB_IDS = ['today', 'plan', 'library', 'progress', 'settings'] as const;
export type TabId = (typeof TAB_IDS)[number];

/**
 * Sub-screens pushed on top of a tab, addressed as `#/<tab>/<sub>`. P1 adds
 * the two MIDI screens under Settings; later phases add the Score screen the
 * same way. `sub` is absent (not null) on a plain tab route so that a route
 * object stays value-comparable with `{ tab }`.
 */
export const SUB_IDS = ['midi', 'diagnostics', 'mic', 'metronome', 'skills', 'folder', 'shelf', 'setup', 'guide'] as const;
export type SubId = (typeof SUB_IDS)[number];

/**
 * Builder-only routes, addressed as `#/dev/<id>`. They are not tabs and never
 * appear in the navigation; they exist so a builder can drive a subsystem
 * directly (docs/06-build-plan.md P2: "a dev route /dev/score"). A dev route
 * still carries a `tab` so the shell has something to highlight, but the nav
 * shows nothing as current.
 */
/**
 * The slots a Today card can open a run from (C3 item 0b, L50): the session
 * card's kinds, and the daily read beside it. `free` opens nothing, and is
 * here so the list is the session builder's own.
 */
export const TODAY_SLOTS = [
  'technique',
  'review',
  'new',
  'repertoire',
  'jam',
  'free',
  'sightreading',
  'daily-read',
] as const satisfies readonly (SlotKind | 'daily-read')[];
export type TodaySlot = (typeof TODAY_SLOTS)[number];

function isTodaySlot(value: string | null | undefined): value is TodaySlot {
  return value !== null && value !== undefined && (TODAY_SLOTS as readonly string[]).includes(value);
}

export const DEV_IDS = ['score'] as const;
export type DevId = (typeof DEV_IDS)[number];

/**
 * The Score screen, addressed as `#/score/<itemId>` (docs/04 §1: "a
 * full-screen route pushed on top; the back gesture returns").
 *
 * It carries a payload, unlike every other route, because the screen is
 * meaningless without knowing which piece — and putting the id in the hash is
 * what makes reload, back and "add to home screen on this piece" all work
 * without any extra state. Ids are `[a-z0-9.-]` by the catalog schema, so the
 * hash needs no escaping, but an unexpected one is dropped rather than trusted.
 */
export const SCORE_ID_PATTERN = /^[A-Za-z][A-Za-z0-9._-]{0,119}$/;

/** `..` never appears in a catalog id and is the one sequence worth naming. */
function looksLikeCatalogId(id: string): boolean {
  return SCORE_ID_PATTERN.test(id) && !id.includes('..');
}

/**
 * Lesson ids are `0.1` and `3.2b` on the core path, and `classical.3`,
 * `ragtime.6`, `jam` and `practice.1` on every track beside it.
 *
 * The first version of this required a leading digit, which silently made 61
 * of the 92 lesson pages unreachable by URL: `#/lesson/classical.3` parsed as
 * "no lesson" and fell back to Today, and because the Plan screen navigates
 * through the router object rather than through a link, nothing ever noticed.
 * P17 found it by adding a track whose ids start with a letter.
 */
export const LESSON_ID_PATTERN = /^[0-9a-z][0-9A-Za-z.-]{0,39}$/;

function looksLikeLessonId(id: string): boolean {
  return LESSON_ID_PATTERN.test(id) && !id.includes('..');
}

export const DEFAULT_TAB: TabId = 'today';

export interface Route {
  tab: TabId;
  sub?: SubId;
  dev?: DevId;
  /** Catalog id of the piece open on the Score screen. */
  score?: string;
  /** Import id of the PDF open in the PDF viewer (docs/04 §5b). */
  pdf?: string;
  /**
   * `#/pdf/<importId>?page=12` — the page to open at (replan §5.4).
   *
   * A shelf piece knows which page it is on, and opening the book at page one
   * and asking him to scroll would waste the one fact he took the trouble to
   * type in.
   */
  pdfPage?: number;
  /** Curriculum lesson id open on the lesson page (docs/04 §3). */
  lesson?: string;
  /** Catalog id open in the chord-chart view (docs/04 §3b). */
  chart?: string;
  /**
   * `#/chart/<id>?from=<lesson id>` — the chart's Back returns to that rung.
   *
   * The same mechanism and the same `from=` parameter as `scoreFrom`, and a
   * separate field because they are separate screens: a chart opened from the
   * Library must not inherit the Back of the score somebody was on before it,
   * and `setRoute` compares them one at a time.
   *
   * Why the chart needed it too (Entry 42's *what is unverified*, closed
   * 2026-09-22): `ChordChartScreen` had a hard-coded `← Library`, so *Chart*
   * pressed on `jazz.5`'s song row landed the learner on the Library rather
   * than on the rung whose lesson describes the chart. Only the lesson page
   * knows which rung it is, so only the lesson page writes this.
   */
  chartFrom?: string;
  /** Catalog id of the drill being run (docs/05 §7). */
  drill?: string;
  /**
   * `#/library?for=<lessonId>` — the rung an import is being made for
   * (replan §4.3).
   *
   * It rides in the hash because that is the only thing that survives the two
   * routes into Library that matter: the lesson page's "Import for this rung"
   * button, and Android's share sheet, whose service-worker redirect carries
   * the query through. Without it the assign sheet would open with nothing
   * chosen and the two taps would be four.
   */
  importFor?: string;
  /**
   * `#/paper/<bookId>/<pieceId>` — practising a piece that is on paper
   * (replan §5.3).
   *
   * Two ids rather than one composite because the screen needs the book (for
   * its title and its linked PDF) as well as the piece, and taking a slash
   * apart in the router is clearer than doing it in the screen.
   */
  paper?: { bookId: string; pieceId: string };
  /**
   * `#/score/<id>?blind=1` — play it with the score hidden (replan §8).
   *
   * The expectation is still known, so the run is judged exactly as a sighted
   * one is. Only the engraving is gone, which is the whole point: memorising
   * is a skill and it is the one the app could never test while the notes
   * were on the screen.
   */
  blind?: boolean;
  /**
   * `#/score/<id>?performance=1` — one run through, no restarts, no loop.
   *
   * Playing a piece for somebody is a different act from practising it, and
   * the flag is what lets Progress list the times he has actually done it.
   */
  performance?: boolean;
  /**
   * `#/score/<id>?ladder=1` — loop the whole item and climb it (`05` §6).
   *
   * The ladder had no address, so `04` §3d could not list it among a rung's
   * tools and seven rungs — the scales, the arpeggios, Hanon and the octaves —
   * named no mode at all. It looked circular: the ladder needs a loop and
   * clearing the loop switches it off. **The circle only exists for
   * repertoire.** On an exercise the whole item *is* the loop, so this one flag
   * sets that loop and turns the ladder on as one action, and both controls
   * then show their state — which is what `05` §6 protects. Where the loop
   * cannot be built, or the mode has no tempo to move, it does **nothing**:
   * the failure being avoided is a control acting unasked, so it fails closed.
   */
  ladder?: boolean;
  /**
   * `#/score/<id>?mode=tempo` — open already in that practice mode (`04` §5c-1,
   * the guided tour).
   *
   * The tour teaches Wait, Tempo and loops, and the only honest way to teach
   * them is on the screen they live on. The alternative was a small imitation
   * of the Score screen inside the drill, which would have drifted from the
   * real one the first time either changed. A route parameter is the same
   * mechanism `blind` and `performance` already use, and it costs the Score
   * screen one line at the point where it picks its default.
   */
  scoreMode?: Mode;
  /**
   * `#/score/<id>?loop=1-2` — arrive with those printed bars already looping.
   *
   * Printed bar numbers — the ones written on the page and on the Loop
   * control, which on a piece that opens with a pickup are one behind the
   * numbers the loop machinery counts in (`08` invariant 24). The Score screen
   * converts at the edge, the same place it already converts the other way to
   * label the control. The tour's third step is "a loop repeats a few bars",
   * and a step that opens the screen and then asks the learner to find the
   * double-tap gesture has not taught anything.
   */
  scoreLoop?: { from: number; to: number };
  /**
   * `#/score/<id>?tour=<drill id>` — Back returns to that walkthrough.
   *
   * Without it the tour is a one-way door: every exit from the Score screen
   * goes to a tab, and the learner who wanted to see the next step would have
   * to find the drill again. The id rather than a bare flag, so any future
   * walkthrough gets the same ride with no second mechanism.
   */
  tour?: string;
  /**
   * `#/score/<id>?from=<lesson id>` — Back returns to that rung.
   *
   * `leaveScore()` had exactly two answers: the tour, or `route.tab`. So a
   * learner who pressed *Play it as a duet* on `2.1`, or tapped a song in the
   * rung's own list, left the Score screen on **Plan** — the tab, at whatever
   * stage it was scrolled to — rather than on the page they were reading. The
   * rung is where the other options, the lesson and the *Know it* buttons are,
   * and it is the thing they were half way through.
   *
   * A lesson id, on the same mechanism `tour` already uses, so the two are one
   * idea with one parser rather than two. An id that is not a lesson id is
   * dropped: a Back that goes nowhere is worse than a Back that goes to the
   * tab, which is what `tour` says about itself for the same reason.
   */
  scoreFrom?: string;
  /**
   * `#/score/<id>?rung=<lesson id>` — the rung this run is for, as Today chose
   * it (C3 item 0b, L50). It judges the run as `from` does and is stored as
   * the run's rung, and it does not steer Back: a Today run's Back is
   * Today's. Its own parameter for that reason. Since C1 stopped the Score
   * screen guessing the first rung listing a piece, a Today card that named
   * no rung left its run judged by the Settings pair.
   */
  scoreRung?: string;
  /** `#/score/<id>?slot=new` — the Today slot that opened this run (L50), for the record. */
  scoreSlot?: TodaySlot;
  /**
   * `#/score/<id>?recipe=hands:both,easy:1` — the phrase's recipe, as Today's
   * reader chose it (C4): what it moved from the row's own params, and whether
   * it is the easy one on purpose. Only a generated item reads it. It rides the
   * route for the seed's reasons — a reload, *New phrase* and Blind write the
   * same kind of phrase — and the run keeps it as the recipe it was.
   */
  scoreRecipe?: RouteRecipe;
  /**
   * `#/score/<id>?seed=1234` — generate *this* exercise rather than a new one.
   *
   * Only a generated item reads it, and only one screen writes it: Today's
   * daily sight-read, whose seed is a hash of the date, so the day has one
   * phrase and tomorrow has another. It rides in the hash for the same reason
   * `blind` and `mode` do — it survives a reload, a back gesture and an icon
   * on the home screen — and because the alternative was a catalog item per
   * day, which is 365 rows a year for one number.
   *
   * Any 32-bit unsigned integer; anything else is dropped rather than carried,
   * since a generator handed rubbish would silently pick its own.
   */
  seed?: number;
  /**
   * `#/score/<id>?hands=R` — open with that hand chosen (`04` §4, Open as…).
   *
   * The hand focus is run state on the Score screen and starts at `both`,
   * which is right when the screen is opened to play a piece and useless to
   * the Library's **Duet** door: the duet is *the hand you are not playing*,
   * so with no hand chosen there is no hand for the app to take and the row
   * would open a screen where nothing happens (`04` §0 R4). The same
   * mechanism `mode`, `blind` and `loop` already use, applied at the one line
   * where this screen sets its focus.
   */
  scoreHands?: HandsFocus;
  /** The accompaniment lab (`04` §3c), addressed as `#/lab`. */
  lab?: boolean;
  /**
   * A named starting point for the lab (`04` §3c), as `#/lab?preset=blues-shuffle`.
   *
   * A route field rather than a setting, for the reason `scoreHands` is one: a
   * rung links to a preset and the learner is meant to arrive *in* it, but what
   * they change afterwards is theirs and must not become the next visit's
   * default. An id the lab does not know is dropped, like a `loop` for bars a
   * piece does not have.
   */
  labPreset?: string;
  /**
   * Which of the preset's locked pickers this visit hands back, as
   * `#/lab?preset=ballad&unlock=progression`.
   *
   * A rung says it (`curriculum.schema.json`, a `lab` tool's `unlock`), and
   * before this existed the only way to give a learner a control their rung's
   * preset had taken was a **second lab button with no preset at all** — which
   * six rungs carried and six lessons had to name (Entry 24 item 5). A name
   * the lab has no picker for is dropped, like a `preset` the lab does not
   * know.
   */
  labUnlock?: readonly LabLock[];
  /**
   * Which way round the lab opens on, as `#/lab?preset=blues-shuffle&mode=tune`.
   *
   * The preset carries a default and a preset is shared, so three rungs whose
   * lesson wants the other one had no way to say it (Entry 30 item 5). Named
   * `mode` on the tool entry and in the hash because that is what the screen's
   * own chips are; the value is a `LabBed`.
   */
  labBed?: LabBed;
  /** Free play (`04` §2b), addressed as `#/play`. */
  play?: boolean;
}

/**
 * The four practice modes, as a lookup rather than a list.
 *
 * A `Record<Mode, …>` fails to compile when a fifth mode is added and not
 * named here, which a `readonly Mode[]` would not — and a mode the router
 * silently refused would look like the Score screen ignoring the tour.
 */
const SCORE_MODES: Record<Mode, true> = { wait: true, tempo: true, listen: true, free: true };

function looksLikeMode(value: string | null | undefined): value is Mode {
  return value !== null && value !== undefined && Object.hasOwn(SCORE_MODES, value);
}

/** The three hand focuses, as a lookup, for the same reason `SCORE_MODES` is one. */
const SCORE_HANDS: Record<HandsFocus, true> = { R: true, L: true, both: true };

function looksLikeHands(value: string | null | undefined): value is HandsFocus {
  return value !== null && value !== undefined && Object.hasOwn(SCORE_HANDS, value);
}

/** `1-2`: two printed bar numbers. A pickup bar is printed 0, so 0 is allowed. */
function parseLoopParam(value: string | null | undefined): { from: number; to: number } | undefined {
  const match = value === null || value === undefined ? null : /^(\d{1,3})-(\d{1,3})$/.exec(value);
  if (!match) return undefined;
  const from = Number(match[1]);
  const to = Number(match[2]);
  // Backwards is not a range, and a screen asked for one would loop nothing
  // and say nothing about why.
  return to < from ? undefined : { from, to };
}

/**
 * `?recipe=` — `key:value` pairs the reader writes (C4), each checked on its
 * own and dropped when it is not one the reader writes, the way a bad `rung`
 * or `tour` is: a hand, a hand position, eighths, a key within four
 * accidentals, four-four or six-eight, syncopation, and the easy flag.
 */
function parseRecipeParam(value: string | null | undefined): RouteRecipe | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const moved: ReadingMoves = {};
  let easy = false;
  for (const pair of value.split(',')) {
    const [key = '', raw = ''] = pair.split(':');
    const flag = raw === '1' ? true : raw === '0' ? false : undefined;
    if (key === 'hands' && (raw === 'right' || raw === 'left' || raw === 'both')) moved.hands = raw;
    else if (key === 'position' && flag !== undefined) moved.position = flag;
    else if (key === 'eighths' && flag !== undefined) moved.eighths = flag;
    else if (key === 'fifths' && /^-?[0-4]$/.test(raw)) moved.fifths = Number(raw);
    else if (key === 'timeSig' && (raw === '4/4' || raw === '6/8')) moved.timeSig = raw;
    else if (key === 'syncopation' && flag !== undefined) moved.syncopation = flag;
    else if (key === 'easy' && raw === '1') easy = true;
  }
  const hasMoves = Object.keys(moved).length > 0;
  if (!hasMoves && !easy) return undefined;
  return { ...(hasMoves ? { moved } : {}), ...(easy ? { easy: true as const } : {}) };
}

/** The recipe as the route writes it, in one key order so one recipe is one hash. */
function recipeParam(recipe: RouteRecipe): string {
  const moved = recipe.moved ?? {};
  const bit = (value: boolean): string => (value ? '1' : '0');
  return [
    ...(moved.hands === undefined ? [] : [`hands:${moved.hands}`]),
    ...(moved.position === undefined ? [] : [`position:${bit(moved.position)}`]),
    ...(moved.eighths === undefined ? [] : [`eighths:${bit(moved.eighths)}`]),
    ...(moved.fifths === undefined ? [] : [`fifths:${String(moved.fifths)}`]),
    ...(moved.timeSig === undefined ? [] : [`timeSig:${moved.timeSig}`]),
    ...(moved.syncopation === undefined ? [] : [`syncopation:${bit(moved.syncopation)}`]),
    ...(recipe.easy ? ['easy:1'] : []),
  ].join(',');
}

/** `?seed=` — a 32-bit unsigned integer, and nothing else. */
function parseSeedParam(value: string | null | undefined): number | undefined {
  if (value === null || value === undefined || !/^\d{1,10}$/.test(value)) return undefined;
  const seed = Number(value);
  return Number.isSafeInteger(seed) && seed <= 0xffffffff ? seed : undefined;
}

function isTabId(value: string): value is TabId {
  return (TAB_IDS as readonly string[]).includes(value);
}

function isSubId(value: string): value is SubId {
  return (SUB_IDS as readonly string[]).includes(value);
}

function isDevId(value: string): value is DevId {
  return (DEV_IDS as readonly string[]).includes(value);
}

/** Pure function: hash string -> Route. Unknown/empty hashes fall back to the default tab. */
export function parseHash(hash: string): Route {
  const withQuery = hash.replace(/^#\/?/, '').trim();
  // `#/library?for=2.1`. Split the query off before anything else looks at the
  // path, so every existing route keeps parsing exactly as it did.
  const queryAt = withQuery.indexOf('?');
  const cleaned = queryAt === -1 ? withQuery : withQuery.slice(0, queryAt);
  const query = queryAt === -1 ? '' : withQuery.slice(queryAt + 1);
  let importFor: string | undefined;
  const params = query ? new URLSearchParams(query) : null;
  const blind = params?.get('blind') === '1';
  const performance = params?.get('performance') === '1';
  const ladder = params?.get('ladder') === '1';
  const wantedMode = params?.get('mode');
  const scoreMode = looksLikeMode(wantedMode) ? wantedMode : undefined;
  const wantedHands = params?.get('hands');
  const scoreHands = looksLikeHands(wantedHands) ? wantedHands : undefined;
  const scoreLoop = parseLoopParam(params?.get('loop'));
  const seed = parseSeedParam(params?.get('seed'));
  const wantedTour = params?.get('tour');
  // An unrecognised one is dropped rather than carried: it would only ever be
  // used as a navigation target, and a Back that goes nowhere is worse than a
  // Back that goes to the tab.
  const tour =
    wantedTour !== null && wantedTour !== undefined && looksLikeCatalogId(wantedTour)
      ? wantedTour
      : undefined;
  const wantedFrom = params?.get('from');
  // Dropped rather than carried, for the reason `tour` above is: it is only
  // ever a navigation target. One parser for both screens that take a `from=`
  // — the Score screen and the chord chart — because one spelling of "the rung
  // that opened this" is what keeps the two Backs the same idea.
  const fromLesson =
    wantedFrom !== null && wantedFrom !== undefined && looksLikeLessonId(wantedFrom)
      ? wantedFrom
      : undefined;
  // The rung and slot a Today card chose (L50), each dropped when it is not
  // one: a rung that is no lesson id judges nothing, and a slot Today does not
  // have is not a slot.
  const wantedRung = params?.get('rung');
  const scoreRung =
    wantedRung !== null && wantedRung !== undefined && looksLikeLessonId(wantedRung) ? wantedRung : undefined;
  const wantedSlot = params?.get('slot');
  const scoreSlot = isTodaySlot(wantedSlot) ? wantedSlot : undefined;
  const scoreRecipe = parseRecipeParam(params?.get('recipe'));
  if (query) {
    const value = new URLSearchParams(query).get('for');
    // A lesson id, or nothing. An unrecognised one is dropped rather than
    // carried into the assign sheet, where it would select no rung and look
    // like a bug in the sheet.
    if (value && looksLikeLessonId(value)) importFor = value;
  }
  if (cleaned === '') return { tab: DEFAULT_TAB };
  const [tab = '', sub = ''] = cleaned.split('/');
  if (tab === 'score') {
    let id: string;
    try {
      id = decodeURIComponent(sub);
    } catch {
      // A malformed escape in the hash is not an id.
      return { tab: DEFAULT_TAB };
    }
    if (!looksLikeCatalogId(id)) return { tab: DEFAULT_TAB };
    return {
      tab: DEFAULT_TAB,
      score: id,
      ...(blind ? { blind: true } : {}),
      ...(performance ? { performance: true } : {}),
      ...(ladder ? { ladder: true } : {}),
      ...(scoreMode ? { scoreMode } : {}),
      ...(scoreHands ? { scoreHands } : {}),
      ...(scoreLoop ? { scoreLoop } : {}),
      ...(tour === undefined ? {} : { tour }),
      ...(fromLesson === undefined ? {} : { scoreFrom: fromLesson }),
      ...(scoreRung === undefined ? {} : { scoreRung }),
      ...(scoreSlot === undefined ? {} : { scoreSlot }),
      ...(scoreRecipe === undefined ? {} : { scoreRecipe }),
      ...(seed === undefined ? {} : { seed }),
    };
  }
  // The accompaniment lab (`04` §3c). Not a tab and not a sub-screen of one:
  // it is opened from Library and from a lesson's finder, and it keeps
  // whichever tab the learner came from highlighted, exactly as the lesson
  // page and the chord chart do.
  if (tab === 'lab') {
    const preset = params?.get('preset') ?? undefined;
    // Each name checked on its own and the unknown ones dropped, rather than
    // the whole list refused: a rung that frees two pickers and misspells one
    // should still free the other, and `validate.py` refuses the misspelling
    // before it is ever written.
    const unlock = (params?.get('unlock') ?? '')
      .split(',')
      .filter((name): name is LabLock => (LAB_LOCKS as readonly string[]).includes(name));
    const mode = params?.get('mode') ?? '';
    const bed = (LAB_BEDS as readonly string[]).includes(mode) ? (mode as LabBed) : undefined;
    return {
      tab: 'library',
      lab: true,
      ...(preset ? { labPreset: preset } : {}),
      ...(unlock.length > 0 ? { labUnlock: unlock } : {}),
      ...(bed ? { labBed: bed } : {}),
    };
  }
  // Free play (`04` §2b), pushed over Today the way the lab is pushed over
  // Library: it is reached from Today's tools and is not a tab of its own.
  if (tab === 'play') return { tab: 'today', play: true };
  if (tab === 'paper') {
    // `#/paper/book.czerny-599/no-1`. A book id contains no slash and a piece
    // id contains no slash, so the split is unambiguous.
    const parts = cleaned.split('/');
    let bookId: string;
    let pieceId: string;
    try {
      bookId = decodeURIComponent(parts[1] ?? '');
      pieceId = decodeURIComponent(parts[2] ?? '');
    } catch {
      return { tab: DEFAULT_TAB };
    }
    if (!looksLikeCatalogId(bookId) || !looksLikeCatalogId(pieceId)) return { tab: DEFAULT_TAB };
    return { tab: 'library', paper: { bookId, pieceId } };
  }
  if (tab === 'library' && importFor) {
    return { tab: 'library', importFor };
  }
  if (tab === 'pdf') {
    // A PDF is pixels, not notes, so it gets its own route rather than a mode
    // on the Score screen (docs/04 §5b).
    let id: string;
    try {
      id = decodeURIComponent(sub);
    } catch {
      return { tab: DEFAULT_TAB };
    }
    if (!looksLikeCatalogId(id)) return { tab: DEFAULT_TAB };
    const wanted = query ? Number(new URLSearchParams(query).get('page')) : Number.NaN;
    const page = Number.isFinite(wanted) && wanted >= 1 ? Math.floor(wanted) : undefined;
    return page === undefined ? { tab: 'library', pdf: id } : { tab: 'library', pdf: id, pdfPage: page };
  }
  if (tab === 'drill') {
    // A drill is a prompt loop, not notation, so it gets its own route rather
    // than a mode on the Score screen (docs/05 §7).
    let id: string;
    try {
      id = decodeURIComponent(sub);
    } catch {
      return { tab: DEFAULT_TAB };
    }
    return looksLikeCatalogId(id) ? { tab: DEFAULT_TAB, drill: id } : { tab: DEFAULT_TAB };
  }
  if (tab === 'chart') {
    let id: string;
    try {
      id = decodeURIComponent(sub);
    } catch {
      return { tab: DEFAULT_TAB };
    }
    if (!looksLikeCatalogId(id)) return { tab: DEFAULT_TAB };
    return {
      tab: 'library',
      chart: id,
      ...(fromLesson === undefined ? {} : { chartFrom: fromLesson }),
    };
  }
  if (tab === 'lesson') {
    let id: string;
    try {
      id = decodeURIComponent(sub);
    } catch {
      return { tab: DEFAULT_TAB };
    }
    return looksLikeLessonId(id) ? { tab: 'plan', lesson: id } : { tab: DEFAULT_TAB };
  }
  if (tab === 'dev') {
    return isDevId(sub) ? { tab: DEFAULT_TAB, dev: sub } : { tab: DEFAULT_TAB };
  }
  if (!isTabId(tab)) return { tab: DEFAULT_TAB };
  // An unknown sub-route degrades to the tab itself rather than to Today: the
  // user asked for Settings, and dropping them somewhere else would be worse
  // than dropping the part we could not resolve.
  if (sub !== '' && isSubId(sub)) return { tab, sub };
  return { tab };
}

export function routeToHash(route: Route): string {
  if (route.lab) {
    const parts = [
      ...(route.labPreset ? [`preset=${encodeURIComponent(route.labPreset)}`] : []),
      ...(route.labUnlock && route.labUnlock.length > 0
        ? [`unlock=${route.labUnlock.join(',')}`]
        : []),
      ...(route.labBed ? [`mode=${route.labBed}`] : []),
    ];
    return parts.length > 0 ? `#/lab?${parts.join('&')}` : '#/lab';
  }
  if (route.play) return '#/play';
  if (route.paper) {
    return `#/paper/${encodeURIComponent(route.paper.bookId)}/${encodeURIComponent(route.paper.pieceId)}`;
  }
  if (route.importFor) return `#/library?for=${encodeURIComponent(route.importFor)}`;
  if (route.score) {
    const flags = [
      ...(route.blind ? ['blind=1'] : []),
      ...(route.performance ? ['performance=1'] : []),
      ...(route.ladder ? ['ladder=1'] : []),
      ...(route.scoreMode ? [`mode=${route.scoreMode}`] : []),
      ...(route.scoreHands ? [`hands=${route.scoreHands}`] : []),
      ...(route.scoreLoop
        ? [`loop=${String(route.scoreLoop.from)}-${String(route.scoreLoop.to)}`]
        : []),
      ...(route.tour === undefined ? [] : [`tour=${encodeURIComponent(route.tour)}`]),
      ...(route.scoreFrom === undefined ? [] : [`from=${encodeURIComponent(route.scoreFrom)}`]),
      ...(route.scoreRung === undefined ? [] : [`rung=${encodeURIComponent(route.scoreRung)}`]),
      ...(route.scoreSlot === undefined ? [] : [`slot=${route.scoreSlot}`]),
      ...(route.scoreRecipe === undefined ? [] : [`recipe=${encodeURIComponent(recipeParam(route.scoreRecipe))}`]),
      ...(route.seed === undefined ? [] : [`seed=${String(route.seed >>> 0)}`]),
    ];
    const base = `#/score/${encodeURIComponent(route.score)}`;
    return flags.length ? `${base}?${flags.join('&')}` : base;
  }
  if (route.pdf) {
    const base = `#/pdf/${encodeURIComponent(route.pdf)}`;
    return route.pdfPage === undefined ? base : `${base}?page=${String(route.pdfPage)}`;
  }
  if (route.lesson) return `#/lesson/${encodeURIComponent(route.lesson)}`;
  if (route.chart) {
    const base = `#/chart/${encodeURIComponent(route.chart)}`;
    return route.chartFrom === undefined ? base : `${base}?from=${encodeURIComponent(route.chartFrom)}`;
  }
  if (route.drill) return `#/drill/${encodeURIComponent(route.drill)}`;
  if (route.dev) return `#/dev/${route.dev}`;
  return route.sub ? `#/${route.tab}/${route.sub}` : `#/${route.tab}`;
}

export type RouteListener = (route: Route) => void;

export class Router {
  private listeners = new Set<RouteListener>();
  private current: Route;

  constructor(private readonly win: Pick<Window, 'location' | 'addEventListener'> = window) {
    this.current = parseHash(this.win.location.hash);
    this.win.addEventListener('hashchange', () => {
      this.setRoute(parseHash(this.win.location.hash));
    });
  }

  get route(): Route {
    return this.current;
  }

  /**
   * Navigates to a tab. Updates `location.hash` (so back/forward and
   * reload keep working) and applies the new route immediately rather than
   * waiting for the browser's `hashchange` event, which fires on a later
   * task. `setRoute` is the single place that decides whether anything
   * actually changed, so the `hashchange` listener re-deriving the same
   * route afterwards is a harmless no-op instead of a duplicate notification.
   */
  navigate(tab: TabId, sub?: SubId): void {
    const route: Route = sub ? { tab, sub } : { tab };
    this.win.location.hash = routeToHash(route);
    this.setRoute(route);
  }

  /**
   * Opens Library ready to import for one rung (`#/library?for=<lessonId>`).
   *
   * The second half of the two-tap path: Library sees the rung in the route,
   * opens the picker, and pre-selects that rung in the assign sheet.
   */
  navigateImportFor(lessonId: string): void {
    const route: Route = { tab: 'library', importFor: lessonId };
    this.win.location.hash = routeToHash(route);
    this.setRoute(route);
  }

  /** Opens the paper-practice screen for one book piece (replan §5.3). */
  navigatePaper(bookId: string, pieceId: string): void {
    const route: Route = { tab: 'library', paper: { bookId, pieceId } };
    this.win.location.hash = routeToHash(route);
    this.setRoute(route);
  }

  /** Opens the Score screen on a catalog item (`#/score/<itemId>`). */
  navigateScore(
    itemId: string,
    options: {
      blind?: boolean;
      performance?: boolean;
      /** Loop the whole item and climb the tempo ladder (`05` §6). */
      ladder?: boolean;
      /** Open in this practice mode rather than the learner's default. */
      mode?: Mode;
      /** Open with this hand chosen rather than both (the Duet door, `04` §4). */
      hands?: HandsFocus;
      /** Open with these printed bars already looping. */
      loop?: { from: number; to: number };
      /** The walkthrough that opened it, which Back returns to. */
      tour?: string;
      /** The rung that opened it, which Back returns to (`04` §5). */
      from?: string;
      /** The rung a Today card chose, which judges the run and does not steer Back (L50). */
      rung?: string;
      /** The Today slot that opened it (L50). */
      slot?: TodaySlot;
      /** Generate this exercise rather than a new one (Today's daily read). */
      seed?: number;
      /** The phrase's recipe, as Today's reader chose it (C4). */
      recipe?: RouteRecipe;
    } = {},
  ): void {
    const route: Route = {
      tab: this.current.tab,
      score: itemId,
      ...(options.blind ? { blind: true } : {}),
      ...(options.performance ? { performance: true } : {}),
      ...(options.ladder ? { ladder: true } : {}),
      ...(options.mode ? { scoreMode: options.mode } : {}),
      ...(options.hands ? { scoreHands: options.hands } : {}),
      ...(options.loop ? { scoreLoop: options.loop } : {}),
      ...(options.tour === undefined ? {} : { tour: options.tour }),
      ...(options.from === undefined ? {} : { scoreFrom: options.from }),
      ...(options.rung === undefined ? {} : { scoreRung: options.rung }),
      ...(options.slot === undefined ? {} : { scoreSlot: options.slot }),
      ...(options.recipe === undefined || recipeParam(options.recipe) === '' ? {} : { scoreRecipe: options.recipe }),
      ...(options.seed === undefined ? {} : { seed: options.seed }),
    };
    this.win.location.hash = routeToHash(route);
    this.setRoute(route);
  }

  /** Opens an imported PDF in the PDF viewer (`#/pdf/<importId>`). */
  navigatePdf(importId: string, page?: number): void {
    const route: Route =
      page === undefined
        ? { tab: 'library', pdf: importId }
        : { tab: 'library', pdf: importId, pdfPage: page };
    this.win.location.hash = routeToHash(route);
    this.setRoute(route);
  }

  /** Opens a curriculum lesson page (`#/lesson/<lessonId>`). */
  navigateLesson(lessonId: string): void {
    const route: Route = { tab: 'plan', lesson: lessonId };
    this.win.location.hash = routeToHash(route);
    this.setRoute(route);
  }

  /** Runs a drill (`#/drill/<itemId>`). */
  navigateDrill(itemId: string): void {
    const route: Route = { tab: this.current.tab, drill: itemId };
    this.win.location.hash = routeToHash(route);
    this.setRoute(route);
  }

  /**
   * Opens the accompaniment lab (`#/lab`, `04` §3c), optionally in a preset and
   * optionally with some of that preset's pickers handed back or a way round
   * chosen (`04` §3c, T16).
   */
  navigateLab(
    preset?: string,
    options: { unlock?: readonly LabLock[]; mode?: LabBed } = {},
  ): void {
    const route: Route = {
      tab: 'library',
      lab: true,
      ...(preset ? { labPreset: preset } : {}),
      ...(options.unlock && options.unlock.length > 0 ? { labUnlock: options.unlock } : {}),
      ...(options.mode ? { labBed: options.mode } : {}),
    };
    this.win.location.hash = routeToHash(route);
    this.setRoute(route);
  }

  /** Opens free play (`#/play`, `04` §2b). */
  navigatePlay(): void {
    const route: Route = { tab: 'today', play: true };
    this.win.location.hash = routeToHash(route);
    this.setRoute(route);
  }

  /**
   * Opens an item in the chord-chart view (`#/chart/<itemId>`).
   *
   * `from` is the rung that opened it, and the chart's Back returns there
   * instead of to the Library (`04` §3b). Only the lesson page passes it: the
   * Library's own door and the Score screen's ⋯ sheet open a chart from
   * somewhere that is not a rung.
   */
  navigateChart(itemId: string, options: { from?: string } = {}): void {
    const route: Route = {
      tab: 'library',
      chart: itemId,
      ...(options.from === undefined ? {} : { chartFrom: options.from }),
    };
    this.win.location.hash = routeToHash(route);
    this.setRoute(route);
  }

  /** Navigates to a builder-only route (`#/dev/<id>`). */
  navigateDev(dev: DevId): void {
    const route: Route = { tab: DEFAULT_TAB, dev };
    this.win.location.hash = routeToHash(route);
    this.setRoute(route);
  }

  subscribe(listener: RouteListener): () => void {
    this.listeners.add(listener);
    listener(this.current);
    return () => this.listeners.delete(listener);
  }

  private setRoute(route: Route): void {
    /**
     * Two routes that write the same hash are the same screen.
     *
     * Every `navigate*` below sets `location.hash` and then applies the route
     * itself, so the browser's `hashchange` arrives a task later with the
     * *same* URL re-parsed. The field comparison underneath is meant to make
     * that echo a no-op, and for a tab route it does — but a **pushed** route
     * writes no tab into the hash, so `parseHash` has to guess one, and the
     * two guesses do not agree: `navigateScore` keeps the tab the learner was
     * on, while `parseHash('#/score/…')` answers `DEFAULT_TAB`. From Today
     * those are the same word and the echo is swallowed; from **Plan or
     * Library they are not**, so opening a piece from a rung's option row, or
     * from the Library, emitted the route twice and built the Score screen
     * **twice**.
     *
     * Nothing about that is cosmetic. The second build replaces the first in
     * the DOM, but `mountLazyScreen` calls the screen factory before it checks
     * whether its holder is still connected — so the first screen's `load()`
     * runs to the end, creates a `ScoreSession`, and subscribes it to the
     * shared MIDI source. Both screens are then listening: the one on the
     * glass is the one the learner presses ▶ on, and the invisible one starts
     * a run of its own on the first note it hears, at the tempo the piece
     * opened at. Both finish, both call `recordRun`, and because the second
     * write starts from the same unread row it overwrites the first — so a
     * flawless run recorded at 100 % of tempo was stored as `started`, at the
     * default tempo, with a wrong note in it, and the rung never went green.
     * `first-day.spec.ts` is the run that found it.
     *
     * The hash is the app's own serialisation of "which screen, with what",
     * and it deliberately leaves the tab out of a pushed route because the tab
     * is only which nav item is lit. Comparing on it is therefore the question
     * this guard has always been trying to ask.
     */
    if (routeToHash(route) === routeToHash(this.current)) return;
    if (
      route.tab === this.current.tab &&
      route.sub === this.current.sub &&
      route.dev === this.current.dev &&
      route.score === this.current.score &&
      route.pdf === this.current.pdf &&
      route.pdfPage === this.current.pdfPage &&
      route.blind === this.current.blind &&
      route.performance === this.current.performance &&
      route.ladder === this.current.ladder &&
      route.scoreMode === this.current.scoreMode &&
      route.scoreHands === this.current.scoreHands &&
      route.tour === this.current.tour &&
      // Where Back goes is part of which screen this is: the same piece opened
      // from a rung and opened from the Library are two routes, and leaving
      // this out would have the second one silently keep the first one's Back.
      route.scoreFrom === this.current.scoreFrom &&
      // The rung a run is judged by and the slot it is for are part of which
      // run this is, for the reason `from` is (L50).
      route.scoreRung === this.current.scoreRung &&
      route.scoreSlot === this.current.scoreSlot &&
      // By value, as the loop is: the same recipe is the same phrase (C4).
      (route.scoreRecipe === undefined ? '' : recipeParam(route.scoreRecipe)) ===
        (this.current.scoreRecipe === undefined ? '' : recipeParam(this.current.scoreRecipe)) &&
      route.seed === this.current.seed &&
      route.lab === this.current.lab &&
      route.labPreset === this.current.labPreset &&
      // By value: two routes freeing the same pickers are the same route, and
      // comparing the arrays would remount the lab on every repeat.
      (route.labUnlock ?? []).join(',') === (this.current.labUnlock ?? []).join(',') &&
      route.labBed === this.current.labBed &&
      route.play === this.current.play &&
      // By value: two loop ranges naming the same bars are the same route, and
      // comparing the objects would remount the Score screen on every repeat
      // of a navigation that changed nothing.
      route.scoreLoop?.from === this.current.scoreLoop?.from &&
      route.scoreLoop?.to === this.current.scoreLoop?.to &&
      route.importFor === this.current.importFor &&
      // By value for the same reason, and for a sharper one: `paper` and
      // `importFor` both ride on `tab: 'library'` with every other field
      // absent, so leaving them out of this comparison made three different
      // navigations no-ops. Tapping the Library tab from `#/paper/<book>/<no>`
      // changed the hash and left the Paper screen standing; the second piece
      // of a book never replaced the first; and a second `Import for this rung`
      // opened the picker on the rung before it.
      route.paper?.bookId === this.current.paper?.bookId &&
      route.paper?.pieceId === this.current.paper?.pieceId &&
      route.lesson === this.current.lesson &&
      route.chart === this.current.chart &&
      // Where Back goes is part of which screen this is, exactly as
      // `scoreFrom` is above: the same chart opened from a rung and from the
      // Library are two routes, and the second would otherwise keep the
      // first one's Back and never redraw.
      route.chartFrom === this.current.chartFrom &&
      route.drill === this.current.drill
    ) {
      return;
    }
    this.current = route;
    this.emit();
  }

  private emit(): void {
    for (const l of this.listeners) l(this.current);
  }
}
