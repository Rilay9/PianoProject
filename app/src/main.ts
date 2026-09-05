import './style.css';
import { Router } from './router';
import { initTheme } from './ui/theme';
import { mountAppShell } from './ui/AppShell';
import { audioEngine } from './audio/AudioEngine';
import { autoConnectMidi } from './app/services';
import { hydratePersisted, needsHydration } from './data/persist';
import { reloadSettings } from './data/settingsStore';
import { installErrorLog } from './util/errorLog';
import { installErrorBoundary } from './ui/errorBoundary';
import { showUpdateToast } from './ui/updateToast';
import { noteUpdateCheck } from './util/offlineStatus';
import { isOfflineOnly } from './util/storageReport';
import { installTestHooks } from './app/testHooks';

// Before anything else: this phone has no console open and no crash reporter,
// so an error nobody catches leaves no trace at all (docs/04 §7b).
installErrorLog(window);
// The visible half: a banner from the first error onwards, with the details
// copyable. Without it an uncaught error is a screen that quietly stops.
installErrorBoundary(document.body);

initTheme();


// Android refuses to start an AudioContext outside a user gesture, and a
// context created too late swallows the first note. Arming this at boot means
// the very first tap anywhere in the app — a tab, a button — gets audio
// running before it is needed (docs/01-architecture.md §4.4).
audioEngine.startOnFirstGesture(window);

// Reconnect the piano if permission was granted on an earlier visit — silent
// when it was, and a no-op when it was not (see app/services).
void autoConnectMidi();

const rootElement = document.getElementById('app');
if (!rootElement) {
  throw new Error('root element #app not found');
}
const root: HTMLElement = rootElement;

// The storage seam the end-to-end tests drive directly; see app/testHooks.
installTestHooks(window);

/**
 * Settings live in IndexedDB and are mirrored to localStorage so they can be
 * read synchronously (see data/persist).
 *
 * A screen reads its settings once, when it is built, so the shell must not
 * mount before the mirror is right — on a device whose localStorage was
 * cleared but whose database survived, or straight after restoring a backup,
 * mounting first shows every control at its default and quietly overwrites the
 * real value on the next change. So: reconcile first when anything is missing,
 * and only then mount. A normal launch has nothing missing and does not wait.
 */
function mount(): void {
  const router = new Router();
  mountAppShell(root, router);
}

if (needsHydration()) {
  void hydratePersisted()
    .then((restored) => {
      if (restored.length > 0) {
        reloadSettings();
        initTheme();
      }
    })
    .catch(() => undefined)
    .finally(mount);
} else {
  mount();
  // Still reconcile, so the database keeps up with what this session writes.
  void hydratePersisted().catch(() => undefined);
}

if ('serviceWorker' in navigator) {
  // Registered by vite-plugin-pwa's virtual module; see vite.config.ts.
  //
  // "Offline only" (docs/04 §7, `00` D20) still registers the worker — that is
  // what makes the app work with no network — but stops it polling for a new
  // version. On a phone that is deliberately kept off the network, a periodic
  // update check is a request that can only ever fail.
  void import('virtual:pwa-register').then(({ registerSW }) => {
    const updateServiceWorker = registerSW({
      immediate: true,
      onNeedRefresh() {
        // Never automatic: swapping the worker in mid-practice would reload
        // the page under a running session. The learner chooses the moment.
        if (isOfflineOnly()) return;
        showUpdateToast({ apply: () => void updateServiceWorker(true) });
      },
    });
    if (!isOfflineOnly()) noteUpdateCheck();
  });
}
