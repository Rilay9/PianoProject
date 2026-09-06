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
export const SUB_IDS = ['midi', 'diagnostics', 'mic', 'metronome', 'skills', 'folder'] as const;
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

/** Lesson ids are `0.1`, `3.2b` and the like — digits, dots, a letter. */
export const LESSON_ID_PATTERN = /^[0-9][0-9A-Za-z.-]{0,39}$/;

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
  /** Curriculum lesson id open on the lesson page (docs/04 §3). */
  lesson?: string;
  /** Catalog id open in the chord-chart view (docs/04 §3b). */
  chart?: string;
  /** Catalog id of the drill being run (docs/05 §7). */
  drill?: string;
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
  const cleaned = hash.replace(/^#\/?/, '').trim();
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
    return looksLikeCatalogId(id) ? { tab: DEFAULT_TAB, score: id } : { tab: DEFAULT_TAB };
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
    return looksLikeCatalogId(id) ? { tab: 'library', pdf: id } : { tab: DEFAULT_TAB };
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
  if (route.score) return `#/score/${encodeURIComponent(route.score)}`;
  if (route.pdf) return `#/pdf/${encodeURIComponent(route.pdf)}`;
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

  /** Opens the Score screen on a catalog item (`#/score/<itemId>`). */
  navigateScore(itemId: string): void {
    const route: Route = { tab: this.current.tab, score: itemId };
    this.win.location.hash = routeToHash(route);
    this.setRoute(route);
  }

  /** Opens an imported PDF in the PDF viewer (`#/pdf/<importId>`). */
  navigatePdf(importId: string): void {
    const route: Route = { tab: 'library', pdf: importId };
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
