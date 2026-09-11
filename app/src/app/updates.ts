// Service-worker registration, update checks and the update prompt.
//
// This lived inline at the foot of `main.ts`, where nothing could reach it: the
// module has side effects from its first line, so a test that imports it starts
// the whole app. The rules it enforces are worth a test each —
//
// * **Never automatic.** A worker that swapped itself in mid-practice would
//   reload the page under a running session, and the one moment this app must
//   not interrupt is someone playing a piece (`00` D20, `01` §7). The new
//   worker waits, the toast says so, the learner picks the moment.
// * **"Offline only" means do not poll** (`04` §7, `00` D20). On a phone
//   deliberately kept off the network an update check is a request that can
//   only fail, so it is not made and no toast is offered.
// * **A check is only "done" when it reached the server.** `noteUpdateCheck()`
//   used to be called on the line after `registerSW()` returned — no request,
//   no answer — so Diagnostics' "Last update check" read *a moment ago* on a
//   phone that had been offline for a month. That line's entire job is to say
//   how stale the app might be, and it was reporting when the app was opened.
// * **A worker already waiting when the page loads still has to be offered.**
//   `onNeedRefresh` fires for a worker that arrives *during* a page's life. Tap
//   *Later* once, or have "offline only" swallow the toast, and the installed
//   version waits behind a prompt that is never shown again.

/** The shape of `registerSW` from `virtual:pwa-register`, narrowed to what is used. */
export type RegisterSW = (options: {
  immediate?: boolean;
  onRegisteredSW?: (swScriptUrl: string, registration?: ServiceWorkerRegistration) => void;
  onNeedRefresh?: () => void;
}) => (reloadPage?: boolean) => Promise<void>;

export interface UpdateWiring {
  registerSW: RegisterSW;
  /** `util/storageReport.isOfflineOnly` in the app. */
  offlineOnly: () => boolean;
  /** `navigator.onLine` in the app, read at check time rather than captured. */
  online: () => boolean;
  /** `ui/updateToast.showUpdateToast` in the app. */
  showToast: (prompt: { apply: () => void }) => unknown;
  /** `util/offlineStatus.noteUpdateCheck` in the app. */
  noteCheck: () => void;
}

export function wireServiceWorkerUpdates(deps: UpdateWiring): void {
  // A declaration, not an arrow in a `const`: it is only ever *called* from a
  // button tap, long after `registerSW` has returned, so `onRegisteredSW` can
  // hand it to the toast without reading `apply` before it is bound.
  function applyUpdate(): void {
    void updateServiceWorker(true);
  }

  const updateServiceWorker = deps.registerSW({
    immediate: true,
    onRegisteredSW(_swScriptUrl, registration) {
      if (!registration) return;
      if (registration.waiting && !deps.offlineOnly()) deps.showToast({ apply: applyUpdate });
      if (deps.offlineOnly() || !deps.online()) return;
      void registration
        .update()
        .then(() => {
          deps.noteCheck();
        })
        .catch(() => undefined);
    },
    onNeedRefresh() {
      if (deps.offlineOnly()) return;
      deps.showToast({ apply: applyUpdate });
    },
  });
}
