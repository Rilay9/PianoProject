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
export const SUB_IDS = ['midi', 'diagnostics', 'mic'] as const;
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

export const DEFAULT_TAB: TabId = 'today';

export interface Route {
  tab: TabId;
  sub?: SubId;
  dev?: DevId;
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
      route.dev === this.current.dev
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
