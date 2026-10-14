// The tiny describe / it / expect the Node checks run under (midi.mjs, pdf.mjs): only the matchers their cases use.
// One copy (test review 2026-10-14, M7: it was copied into both files, and the copies had drifted apart).


const tests = [];
const skipped = [];
const stack = [];
function describe(name, body) {
  stack.push(name);
  try { body(); } catch (error) { tests.push({ name: [...stack].join(' > '), fn: () => { throw error; } }); }
  stack.pop();
}
function it(name, fn) { tests.push({ name: [...stack, name].join(' > '), fn }); }
it.skipIf = (condition) => (name, fn) => condition ? skipped.push({ name: [...stack, name].join(' > '), why: 'skipIf' }) : it(name, fn);
/** An old case not ported, and why. */
function skip(name, why) { skipped.push({ name, why }); }

const show = (v) => {
  try { return JSON.stringify(v, (_, x) => (typeof x === 'bigint' ? `${x}n` : x)); } catch { return String(v); }
};
/** vitest's toEqual: recursive, and a property that is undefined counts as absent. */
function equal(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) return a.length === b.length && a.every((x, i) => equal(x, b[i]));
  const keys = (o) => Object.keys(o).filter((k) => o[k] !== undefined);
  const ka = keys(a), kb = keys(b);
  return ka.length === kb.length && ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && equal(a[k], b[k]));
}
function thrown(fn) {
  try { fn(); } catch (error) { return { error }; }
  return null;
}
function throwMatches(error, expected) {
  if (expected === undefined) return true;
  if (typeof expected === 'function') return error instanceof expected;
  const message = error instanceof Error ? error.message : String(error);
  return expected instanceof RegExp ? expected.test(message) : message.includes(expected);
}
const MATCHERS = {
  toBe: (a, b) => [Object.is(a, b), `${show(a)} to be ${show(b)}`],
  toEqual: (a, b) => [equal(a, b), `${show(a)} to equal ${show(b)}`],
  toContain: (a, b) => [typeof a === 'string' ? a.includes(b) : Array.isArray(a) && a.includes(b), `${show(a)} to contain ${show(b)}`],
  toHaveLength: (a, n) => [a != null && a.length === n, `length ${a?.length} to be ${n}`],
  toBeNull: (a) => [a === null, `${show(a)} to be null`],
  toBeDefined: (a) => [a !== undefined, `${show(a)} to be defined`],
  toBeGreaterThan: (a, b) => [a > b, `${show(a)} > ${show(b)}`],
  toBeGreaterThanOrEqual: (a, b) => [a >= b, `${show(a)} >= ${show(b)}`],
  toBeLessThan: (a, b) => [a < b, `${show(a)} < ${show(b)}`],
  toBeLessThanOrEqual: (a, b) => [a <= b, `${show(a)} <= ${show(b)}`],
  toBeCloseTo: (a, b, digits = 2) => [Math.abs(a - b) < 10 ** -digits / 2, `${show(a)} close to ${show(b)} (${digits} digits)`],
  toMatch: (a, re) => [typeof a === 'string' && (re instanceof RegExp ? re.test(a) : a.includes(re)), `${show(a)} to match ${String(re)}`],
  toThrow: (fn, expected) => {
    const t = thrown(fn);
    return [t !== null && throwMatches(t.error, expected), t ? `thrown ${show(t.error?.message ?? t.error)} to match ${String(expected?.name ?? expected)}` : 'a throw'];
  },
};
function expect(actual, message) {
  const build = (negate) => Object.fromEntries(Object.entries(MATCHERS).map(([name, matcher]) => [name, (...args) => {
    const [pass, said] = matcher(actual, ...args);
    if (pass === negate) throw new Error(`${message ? `${message}: ` : ''}expected ${negate ? 'not ' : ''}${said}`);
  }]));
  const out = build(false);
  out.not = build(true);
  out.rejects = {
    toThrow: async (expected) => {
      try { await actual; } catch (error) {
        if (throwMatches(error, expected)) return;
        throw new Error(`expected rejection ${show(error?.message)} to match ${String(expected?.name ?? expected)}`);
      }
      throw new Error('expected a rejection');
    },
  };
  return out;
}

/** Runs every case, prints the failures and the skipped (with why), and exits 1 if any failed. */
export async function run({ skipIfWhy = 'skipIf' } = {}) {
  let passed = 0;
  const failed = [];
  for (const test of tests) {
    try {
      await test.fn();
      passed += 1;
    } catch (error) {
      failed.push({ name: test.name, error });
    }
  }
  for (const { name, error } of failed) console.log(`FAIL ${name}\n     ${error instanceof Error ? error.message : String(error)}`);
  for (const { name, why } of skipped) console.log(`skip ${name}${why === 'skipIf' ? ` (${skipIfWhy})` : ` — ${why}`}`);
  console.log(`\n${passed} passed, ${failed.length} failed, ${skipped.length} skipped`);
  process.exit(failed.length > 0 ? 1 : 0);
}

export { describe, it, skip, expect };
