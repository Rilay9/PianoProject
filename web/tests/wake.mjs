// The screen wake lock (src/wake.ts; review 2026-10-14, F06): a lock granted after you left is let go at once, and
// a return to the page while a request is pending does not ask twice. The browser's API is stood in for by one whose
// requests resolve only when told, so "granted late" can be made to happen. Run: npm run check:wake.
const listeners = {};
globalThis.document = { visibilityState: 'visible', addEventListener: (type, f) => { listeners[type] = f; } };
const pending = [];
const sentinels = [];
Object.defineProperty(globalThis.navigator, 'wakeLock', {
  configurable: true,
  value: {
    request: () => new Promise((resolve) => pending.push(() => {
      const s = { released: false, release() { this.released = true; return Promise.resolve(); }, addEventListener() {} };
      sentinels.push(s);
      resolve(s);
    })),
  },
});
const { keepAwake } = await import('../src/wake.ts');
const tick = () => new Promise((r) => setTimeout(r, 0));
const failures = [];
const check = (name, ok) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`); if (!ok) failures.push(name); };

// Granted after leaving.
keepAwake(true);
keepAwake(false);
(pending.shift() ?? (() => {}))();
await tick();
check('a lock granted after you left is released at once', sentinels.length === 1 && sentinels[0].released === true);

// Asked twice while the first is pending (keepAwake, then a return to the page): one request.
keepAwake(true);
listeners.visibilitychange?.();
check('a return to the page while a request is pending does not ask again', pending.length === 1);
(pending.shift() ?? (() => {}))();
await tick();
check('the one lock granted while wanted is kept', sentinels.length === 2 && sentinels[1]?.released === false);
keepAwake(false);
check('turned off: the kept lock is released', sentinels[1]?.released === true);

console.log(failures.length ? `${failures.length} failed` : 'all passed');
process.exit(failures.length ? 1 : 0);
