// Keeps the screen on while you play, wait for keys, or use Free play (owner, 2026-10-11), with the browser's
// Screen Wake Lock. The browser lets go of it when the page is hidden, so it is asked for again on return.

let wanted = false;
let lock: WakeLockSentinel | null = null;

async function request(): Promise<void> {
  if (!wanted || lock || document.visibilityState !== 'visible' || !('wakeLock' in navigator)) return;
  try {
    lock = await navigator.wakeLock.request('screen');
    lock.addEventListener('release', () => { lock = null; });
  } catch { /* refused (battery saver, no permission): the screen may sleep as usual */ }
}

/** On: keep the screen awake; off: let it sleep as usual. */
export function keepAwake(on: boolean): void {
  if (on === wanted) return;
  wanted = on;
  if (on) void request();
  else { void lock?.release(); lock = null; }
}

document.addEventListener('visibilitychange', () => void request());
