import { Router, TAB_IDS, type TabId } from '../router';
import { tabIcons } from './icons';
import { TodayScreen } from './screens/TodayScreen';
import { PlanScreen } from './screens/PlanScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { ProgressScreen } from './screens/ProgressScreen';
import { SettingsScreen } from './screens/SettingsScreen';

const TAB_LABELS: Record<TabId, string> = {
  today: 'Today',
  plan: 'Plan',
  library: 'Library',
  progress: 'Progress',
  settings: 'Settings',
};

const SCREENS: Record<TabId, () => HTMLElement> = {
  today: TodayScreen,
  plan: PlanScreen,
  library: LibraryScreen,
  progress: ProgressScreen,
  settings: SettingsScreen,
};

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

  router.subscribe((route) => {
    for (const [tab, button] of buttons) {
      const active = tab === route.tab;
      button.classList.toggle('active', active);
      button.setAttribute('aria-current', active ? 'page' : 'false');
    }
    main.innerHTML = '';
    main.appendChild(SCREENS[route.tab]());
  });
}
