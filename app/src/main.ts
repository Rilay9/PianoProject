import './style.css';
import { Router } from './router';
import { initTheme } from './ui/theme';
import { mountAppShell } from './ui/AppShell';
import { audioEngine } from './audio/AudioEngine';
import { autoConnectMidi } from './app/services';
import { hydratePersisted, needsHydration } from './data/persist';
import { reloadSettings } from './data/settingsStore';
import { reloadSetup, setupStatus } from './data/setupStore';
import { loadLevelOverrides } from './data/levelOverrides';
import { installErrorLog } from './util/errorLog';
import { installErrorBoundary } from './ui/errorBoundary';
import { showUpdateToast } from './ui/updateToast';
import { noteUpdateCheck } from './util/offlineStatus';
import { isOfflineOnly } from './util/storageReport';
import { installTestHooks } from './app/testHooks';
import { wireServiceWorkerUpdates } from './app/updates';
import { bootShell } from './app/boot';

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
  // The first launch, and only a launch: a fresh install opened from the
  // icon — an address with no route in it — lands on the setup tour
  // (docs/04 §7d). Anything addressed, `#/today` included, is left alone;
  // the tour is one row in Settings then.
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (hash === '' && setupStatus() === 'never') router.navigate('settings', 'setup');
}

// The owner's own difficulty numbers (replan §1.4). Not awaited: every screen
// works from the catalog's levels until this lands, and it tells the catalog
// index to rebuild if it found any — so the cost of a cold read is a redraw,
// not a delayed first paint.
void loadLevelOverrides().catch(() => undefined);

// `bootShell` is what decides whether `mount()` waits on `hydratePersisted()`
// and, if it does, how long — see `app/boot.ts`. It lived here until a boot
// that could hang forever (a blocked IndexedDB open behind a version bump,
// most plausibly right after the reload a service-worker update itself
// performs) turned out to mean the tab bar, built inside `mount()`, never
// existed at all, and nothing here could be reached by a test that proved it.
bootShell({
  needsHydration,
  hydratePersisted,
  onRestored: () => {
    reloadSettings();
    reloadSetup();
    initTheme();
  },
  mount,
  after: (ms, cb) => setTimeout(cb, ms),
});

if ('serviceWorker' in navigator) {
  // Registered by vite-plugin-pwa's virtual module; see vite.config.ts.
  //
  // "Offline only" (docs/04 §7, `00` D20) still registers the worker — that is
  // what makes the app work with no network — but stops it polling for a new
  // version. On a phone that is deliberately kept off the network, a periodic
  // update check is a request that can only ever fail.
  void import('virtual:pwa-register')
    .then(({ registerSW }) => {
      wireServiceWorkerUpdates({
        registerSW,
        offlineOnly: isOfflineOnly,
        online: () => navigator.onLine,
        showToast: showUpdateToast,
        noteCheck: noteUpdateCheck,
      });
    })
    // A failed dynamic import here is an unhandled rejection, and
    // `installErrorLog` turns that into the red banner across the bottom of a
    // working app: "Failed to fetch dynamically imported module". An app with
    // no service worker is an app that needs the network — worth saying on
    // Diagnostics (see `util/offlineStatus`), not worth saying over the score.
    .catch(() => undefined);
}
