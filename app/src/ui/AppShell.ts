import { Router, TAB_IDS, type Route, type SubId, type TabId } from '../router';
import { tabIcons } from './icons';
import { disposeScreen } from './screenLifecycle';
import { TodayScreen } from './screens/TodayScreen';
import { PlanScreen } from './screens/PlanScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { ProgressScreen } from './screens/ProgressScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { MicScreen } from './screens/MicScreen';
import { MidiScreen } from './screens/MidiScreen';
import { DiagnosticsScreen } from './screens/DiagnosticsScreen';
import { MetronomeScreen } from './screens/MetronomeScreen';
import { SkillsScreen } from './screens/SkillsScreen';
import { FolderScreen } from './screens/FolderScreen';
import { ShelfScreen } from './screens/ShelfScreen';
import { PaperScreen } from './screens/PaperScreen';
import { LessonScreen } from './screens/LessonScreen';
import { ChordChartScreen } from './screens/ChordChartScreen';
import { DrillScreen } from './screens/DrillScreen';

const TAB_LABELS: Record<TabId, string> = {
  today: 'Today',
  plan: 'Plan',
  library: 'Library',
  progress: 'Progress',
  settings: 'Settings',
};

type ScreenFactory = (router: Router) => HTMLElement;

const SCREENS: Record<TabId, ScreenFactory> = {
  today: TodayScreen,
  plan: PlanScreen,
  library: LibraryScreen,
  progress: ProgressScreen,
  settings: SettingsScreen,
};

/** Sub-screens pushed on top of a tab; the tab stays highlighted in the nav. */
const SUB_SCREENS: Record<SubId, ScreenFactory> = {
  midi: MidiScreen,
  mic: MicScreen,
  diagnostics: DiagnosticsScreen,
  metronome: MetronomeScreen,
  skills: SkillsScreen,
  folder: FolderScreen,
  shelf: ShelfScreen,
};

function screenFor(route: Route): ScreenFactory {
  // The lesson page and the chord chart are full-screen routes pushed over
  // whichever tab the learner came from, so the tab stays highlighted and Back
  // returns to it. The Score screen is one too, but it is loaded on demand
  // (see `mountAppShell`) because it carries OSMD.
  if (route.lesson) {
    const lessonId = route.lesson;
    return (router) => LessonScreen(router, lessonId);
  }
  if (route.chart) {
    const chartId = route.chart;
    return (router) => ChordChartScreen(router, chartId);
  }
  if (route.drill) {
    const drillId = route.drill;
    return (router) => DrillScreen(router, drillId);
  }
  if (route.paper) {
    const { bookId, pieceId } = route.paper;
    return (router) => PaperScreen(router, bookId, pieceId);
  }
  if (route.importFor) {
    // Library, but told which rung the import is for (replan §4.3).
    const lessonId = route.importFor;
    return (router) => LibraryScreen(router, { importFor: lessonId });
  }
  return route.sub ? SUB_SCREENS[route.sub] : SCREENS[route.tab];
}

/**
 * Screens whose dependency is too large for the entry bundle, loaded on
 * demand: `/dev/score` pulls in OpenSheetMusicDisplay and the PDF viewer pulls
 * in pdfjs-dist. Both are precached, so "on demand" costs nothing offline —
 * it only keeps them out of the first parse.
 *
 * /dev/score pulls in OpenSheetMusicDisplay, which is by far the largest
 * dependency in the app; a static import would put it in the entry bundle for
 * every learner who never opens it. The placeholder keeps the shell responsive
 * while the chunk arrives.
 */
function mountLazyScreen(
  main: HTMLElement,
  setCurrent: (el: HTMLElement) => void,
  load: () => Promise<HTMLElement>,
): HTMLElement {
  const holder = document.createElement('section');
  holder.className = 'screen';
  holder.dataset.screen = 'loading';
  const card = document.createElement('div');
  card.className = 'card';
  const h1 = document.createElement('h1');
  h1.textContent = 'Loading…';
  card.appendChild(h1);
  holder.appendChild(card);

  void load().then((real) => {
    // The route may have changed while the chunk was in flight.
    if (!holder.isConnected) return;
    main.replaceChildren(real);
    setCurrent(real);
  });
  return holder;
}

/**
 * Renders the app shell (nav + content area) into `root` and wires it to the
 * router. CSS alone switches the nav between a bottom tab bar (portrait) and
 * a left rail (landscape) — see style.css — so this only needs to build one
 * DOM structure and toggle the `data-active` state.
 */
export function mountAppShell(root: HTMLElement, router: Router): void {
  root.innerHTML = '';

  const shell = document.createElement('div');
  shell.className = 'app-shell';

  const nav = document.createElement('nav');
  nav.className = 'tab-nav';
  nav.setAttribute('aria-label', 'Main navigation');

  const buttons = new Map<TabId, HTMLButtonElement>();
  for (const tab of TAB_IDS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tab-button';
    button.dataset.tab = tab;
    button.setAttribute('aria-label', TAB_LABELS[tab]);
    button.innerHTML = `<span class="tab-icon">${tabIcons[tab]}</span><span class="tab-label">${TAB_LABELS[tab]}</span>`;
    button.addEventListener('click', () => router.navigate(tab));
    nav.appendChild(button);
    buttons.set(tab, button);
  }

  const main = document.createElement('main');
  main.className = 'screen-container';

  shell.appendChild(nav);
  shell.appendChild(main);
  root.appendChild(shell);

  let currentScreen: HTMLElement | null = null;

  router.subscribe((route) => {
    for (const [tab, button] of buttons) {
      // A dev route belongs to no tab, so nothing is highlighted.
      const active = !route.dev && tab === route.tab;
      button.classList.toggle('active', active);
      button.setAttribute('aria-current', active ? 'page' : 'false');
    }
    // Screens that subscribe to long-lived services register a disposer; run
    // it before the node is discarded, or the listeners leak for the life of
    // the page (see ui/screenLifecycle.ts).
    disposeScreen(currentScreen);
    main.innerHTML = '';
    const setCurrent = (el: HTMLElement): void => {
      currentScreen = el;
    };
    if (route.dev) {
      currentScreen = mountLazyScreen(main, setCurrent, () =>
        import('./screens/DevScoreScreen').then(({ DevScoreScreen }) => DevScoreScreen(router)),
      );
    } else if (route.score) {
      // OpenSheetMusicDisplay is about a megabyte, and it was sitting in the
      // entry bundle because the Score screen imports it — so opening Today
      // waited for an engraver it does not use. Lighthouse put the cost at
      // 332 kB of unused JavaScript on first paint. Precached either way, so
      // "on demand" costs nothing offline.
      // ScoreScreen reads the open piece from `router.route.score` itself.
      currentScreen = mountLazyScreen(main, setCurrent, () =>
        import('./screens/ScoreScreen').then(({ ScoreScreen }) => ScoreScreen(router)),
      );
    } else if (route.pdf) {
      const pdfId = route.pdf;
      const page = route.pdfPage;
      currentScreen = mountLazyScreen(main, setCurrent, () =>
        import('./screens/PdfScreen').then(({ PdfScreen }) => PdfScreen(router, pdfId, page)),
      );
    } else {
      currentScreen = screenFor(route)(router);
    }
    main.appendChild(currentScreen);
  });
}
