// Keeps the screen on while you play, wait for keys, or use Free play (owner, 2026-10-11), with the browser's
// Screen Wake Lock. The browser lets go of it when the page is hidden, so it is asked for again on return.

let wanted = false;
let lock: WakeLockSentinel | null = null;
let asking = false; // one request at a time (keepAwake and a return to the page can both ask)

async function request(): Promise<void> {
  if (!wanted || lock || asking || document.visibilityState !== 'visible' || !('wakeLock' in navigator)) return;
  asking = true;
  try {
    const got = await navigator.wakeLock.request('screen');
    // Granted after you left (keepAwake(false) found nothing to release then): let it go at once (review 2026-10-14).
    if (!wanted || lock) { void got.release(); return; }
    lock = got;
    got.addEventListener('release', () => { if (lock === got) lock = null; });
  } catch { /* refused (battery saver, no permission): the screen may sleep as usual */ } finally {
    asking = false;
  }
}

/** On: keep the screen awake; off: let it sleep as usual. */
export function keepAwake(on: boolean): void {
  if (on === wanted) return;
  wanted = on;
  if (on) void request();
  else { void lock?.release(); lock = null; }
}

document.addEventListener('visibilitychange', () => void request());
