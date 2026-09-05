import './style.css';
import { Router } from './router';
import { initTheme } from './ui/theme';
import { mountAppShell } from './ui/AppShell';
import { audioEngine } from './audio/AudioEngine';
import { hydratePersisted } from './data/persist';
import { reloadSettings } from './data/settingsStore';
import { installErrorLog } from './util/errorLog';
import { noteUpdateCheck } from './util/offlineStatus';
import { isOfflineOnly } from './ui/screens/SettingsScreen';
import { installTestHooks } from './app/testHooks';

// Before anything else: this phone has no console open and no crash reporter,
// so an error nobody catches leaves no trace at all (docs/04 §7b).
installErrorLog(window);

initTheme();

// Settings live in IndexedDB and are mirrored to localStorage so they can be
// read synchronously (see data/persist). On a device whose localStorage was
// cleared but whose database survived — or straight after restoring a backup —
// the mirror is empty at this point, so reconcile the two and re-read.
void hydratePersisted().then((restored) => {
  if (restored.length > 0) {
    reloadSettings();
    initTheme();
  }
});

// Android refuses to start an AudioContext outside a user gesture, and a
// context created too late swallows the first note. Arming this at boot means
// the very first tap anywhere in the app — a tab, a button — gets audio
// running before it is needed (docs/01-architecture.md §4.4).
audioEngine.startOnFirstGesture(window);

const root = document.getElementById('app');
if (!root) {
  throw new Error('root element #app not found');
}

// The storage seam the end-to-end tests drive directly; see app/testHooks.
installTestHooks(window);

const router = new Router();
mountAppShell(root, router);

if ('serviceWorker' in navigator) {
  // Registered by vite-plugin-pwa's virtual module; see vite.config.ts.
  //
  // "Offline only" (docs/04 §7, `00` D20) still registers the worker — that is
  // what makes the app work with no network — but stops it polling for a new
  // version. On a phone that is deliberately kept off the network, a periodic
  // update check is a request that can only ever fail.
  void import('virtual:pwa-register').then(({ registerSW }) => {
    const update = registerSW({ immediate: true });
    if (!isOfflineOnly()) {
      noteUpdateCheck();
      void update;
    }
  });
}
