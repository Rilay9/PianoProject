// Minimal hash-based router.
//
// Why hash routing: the app is deployed under a sub-path on GitHub Pages
// (`/PianoProject/`) with no server-side rewrite rules available, and it is
// installed as a PWA that must keep working when opened straight from the
// home-screen icon (a fresh navigation, not a client-side push). Hash routes
// never hit the server, so there is nothing to configure or break in either
// case. History-API routing would need a Pages 404->index fallback and is
// unnecessary here since the app has no deep content to link externally.

export const TAB_IDS = ['today', 'plan', 'library', 'progress', 'settings'] as const;
export type TabId = (typeof TAB_IDS)[number];

/**
 * Sub-screens pushed on top of a tab, addressed as `#/<tab>/<sub>`. P1 adds
 * the two MIDI screens under Settings; later phases add the Score screen the
 * same way. `sub` is absent (not null) on a plain tab route so that a route
 * object stays value-comparable with `{ tab }`.
 */
export const SUB_IDS = ['midi', 'diagnostics', 'mic', 'metronome', 'skills', 'folder', 'shelf'] as const;
export type SubId = (typeof SUB_IDS)[number];

/**
 * Builder-only routes, addressed as `#/dev/<id>`. They are not tabs and never
 * appear in the navigation; they exist so a builder can drive a subsystem
 * directly (docs/06-build-plan.md P2: "a dev route /dev/score"). A dev route
 * still carries a `tab` so the shell has something to highlight, but the nav
 * shows nothing as current.
 */
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
    };
  }
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
    return looksLikeCatalogId(id) ? { tab: 'library', chart: id } : { tab: DEFAULT_TAB };
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
  if (route.paper) {
    return `#/paper/${encodeURIComponent(route.paper.bookId)}/${encodeURIComponent(route.paper.pieceId)}`;
  }
  if (route.importFor) return `#/library?for=${encodeURIComponent(route.importFor)}`;
  if (route.score) {
    const flags = [
      ...(route.blind ? ['blind=1'] : []),
      ...(route.performance ? ['performance=1'] : []),
    ];
    const base = `#/score/${encodeURIComponent(route.score)}`;
    return flags.length ? `${base}?${flags.join('&')}` : base;
  }
  if (route.pdf) {
    const base = `#/pdf/${encodeURIComponent(route.pdf)}`;
    return route.pdfPage === undefined ? base : `${base}?page=${String(route.pdfPage)}`;
  }
  if (route.lesson) return `#/lesson/${encodeURIComponent(route.lesson)}`;
  if (route.chart) return `#/chart/${encodeURIComponent(route.chart)}`;
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
  navigateScore(itemId: string, options: { blind?: boolean; performance?: boolean } = {}): void {
    const route: Route = {
      tab: this.current.tab,
      score: itemId,
      ...(options.blind ? { blind: true } : {}),
      ...(options.performance ? { performance: true } : {}),
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

  /** Opens an item in the chord-chart view (`#/chart/<itemId>`). */
  navigateChart(itemId: string): void {
    const route: Route = { tab: 'library', chart: itemId };
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
    if (
      route.tab === this.current.tab &&
      route.sub === this.current.sub &&
      route.dev === this.current.dev &&
      route.score === this.current.score &&
      route.pdf === this.current.pdf &&
      route.pdfPage === this.current.pdfPage &&
      route.blind === this.current.blind &&
      route.performance === this.current.performance &&
      route.lesson === this.current.lesson &&
      route.chart === this.current.chart &&
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
