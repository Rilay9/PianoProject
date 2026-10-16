// The exercise screen's judges, driven as the screen drives them (keys in, the result read back), with stand-ins for
// the page (buttons, the keys under the music, the drawing, the sound) and a hand-turned clock. Review 2026-10-15:
// - Drills, name only (any octave counts) with timing: a key is matched to the written note of its letter, but how long
//   it sounded must be looked up by the key actually pressed (B3-01: a short C5 for a written C4 was "held").
// - Simon, "again from the miss": playing on from the miss finishes the chain (practice), but only the whole chain
//   played in one go, unhelped, is a best (B3-02: a replayed last item gave the whole chain as a best).
// - Drills deal a pool like a shuffled deck (owner, 2026-10-15, A1; B8-01: a set of 5 from 3 items was drawn at
//   random): every item once before any repeats, then shuffled again, never the same card twice running.
// Run: npm run check:exercise.
const timers = new Map();
let nextId = 1, clock = 0;
const later = (f, ms) => { const id = nextId++; timers.set(id, { at: clock + Math.max(0, ms ?? 0), f }); return id; };
const cancel = (id) => { timers.delete(id); };
globalThis.window = { setTimeout: later, setInterval: (f, ms) => later(f, ms), clearTimeout: cancel, clearInterval: cancel };
globalThis.clearTimeout = cancel;
globalThis.clearInterval = cancel;
const store = new Map();
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
globalThis.document = { createElement: () => ({}) };
/** Runs the timers due in the next `ms` (one-shot: an interval is not run again). */
async function pass(ms) {
  clock += ms;
  for (;;) {
    const due = [...timers].filter(([, t]) => t.at <= clock).sort((a, b) => a[1].at - b[1].at)[0];
    if (!due) break;
    timers.delete(due[0]);
    due[1].f();
    await settle();
  }
  await settle();
}
const settle = () => new Promise((r) => setImmediate(r));

const { holds } = await import('../src/holds.ts');
const { Drill } = await import('../src/exercise/drill.ts');
const { Simon } = await import('../src/exercise/simon.ts');

const failures = [];
const check = (name, ok, detail = '') => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : ` — ${detail}`}`); if (!ok) failures.push(name); };
const el = () => ({ textContent: '', className: '', hidden: false, innerHTML: '', value: '', addEventListener() {}, replaceChildren() {}, prepend() {}, after() {} });
const parts = () => Object.fromEntries(['set', 'left', 'mid', 'right', 'name', 'chain', 'status', 'sub', 'start', 'hear', 'help', 'after', 'again', 'next', 'misses', 'fresh', 'finish'].map((k) => [k, el()]));
const keysStub = () => ({ onKey: null, down: new Set(), setRange() {}, clearMarks() {}, light() {}, wrong() {}, want() {}, release() {} });
const notation = { show: async () => {}, clear() {} };
const sound = { keyboard: null, songTime: () => 0, play() {}, stop() {}, prepare: async () => {} };

// ---- Drills: name only, timed ---------------------------------------------------------------------------------------
// One card: C4 as a half note at 80 bpm (1500 ms; held ¾ of it: 1125 ms). Your first note starts the card's clock.
{
  const set = { id: 't-drill', title: 'test', order: 'pool', tempo: 80, items: [{ n: 1, name: 'C', short: 'C', groups: [['C4']], beats: [2] }] };
  let at = 100000;
  async function card(pressed, heldMs, rung = 4) {
    const ui = parts(), d = new Drill(ui, keysStub(), notation, sound);
    d.open([set]);
    d.setLevel({ rung, start: 'first', onTime: 'normal', metronome: false, cards: 10 });
    d.key(60, true, at); // (the idle screen: any key starts the set)
    await settle();
    at += 10000;
    holds.key(pressed, true, at);
    d.key(pressed, true, at);
    holds.key(pressed, false, at + heldMs);
    d.finish(); // (the card's own end: its time and the hold are past)
    const r = d.results.at(-1);
    d.close();
    return r?.text ?? '(no result)';
  }
  const shortOctave = await card(72, 100);
  check('name only, timed: C5 for a written C4 let go after 100 ms is let go early', /let go early/.test(shortOctave), shortOctave);
  const heldOctave = await card(72, 1400);
  check('name only, timed: C5 for a written C4 held 1400 ms is clean', heldOctave === 'clean', heldOctave);
  const shortSame = await card(60, 100);
  check('name only, timed: C4 let go after 100 ms is let go early (same octave)', /let go early/.test(shortSame), shortSame);
  const heldSame = await card(60, 1400);
  check('name only, timed: C4 held 1400 ms is clean (same octave)', heldSame === 'clean', heldSame);
  const otherRung = await card(72, 1400, 3);
  check('music only (rung 3): C5 for a written C4 is still a wrong key and a miss', /wrong key/.test(otherRung) && /missed/.test(otherRung), otherRung);
}

// ---- Simon: again from the miss ---------------------------------------------------------------------------------------
// A passage of five single notes, read from the music (rung 3: no playing first), three tries.
{
  const notes = ['C4', 'D4', 'E4', 'F4', 'G4'], midi = [60, 62, 64, 65, 67];
  const set = { id: 't-simon', title: 'test', order: 'passage', tempo: 80, items: notes.map((n, i) => ({ n: i + 1, name: n, short: n, groups: [[n]] })) };
  async function game(onMiss) {
    store.clear();
    const keys = keysStub(), s = new Simon(parts(), keys, notation, sound);
    s.open([set]);
    s.setLevel({ rung: 3, match: 'same', miss: 'tries', speed: 'steady', onMiss, onNew: 'all' });
    const tap = async (m) => { s.key(m, true); s.key(m, false); await settle(); };
    await tap(60); // starts the game: chain 1
    await settle();
    const best = () => s.best[s.bestKey()] ?? 0;
    const seen = [];
    for (let n = 1; n <= 3; n++) { for (const m of midi.slice(0, n)) await tap(m); seen.push(best()); await pass(1000); } // chains 1-3 played whole
    // Chain 4: three right, then a wrong key at the fourth.
    for (const m of midi.slice(0, 3)) await tap(m);
    await tap(71);
    await pass(2000); // it gives the chain again (from the miss, or whole)
    const expected = s.expected().map((g) => g[0]);
    for (const m of expected) await tap(m);
    seen.push(best(), s.game?.longest ?? -1);
    await pass(1000); // chain 5, played whole
    for (const m of midi) await tap(m);
    seen.push(best());
    s.close();
    return { seen, expected };
  }
  const fromMiss = await game('from-miss');
  check('from the miss: the replay asks for the missed item on (suffix practice kept)', JSON.stringify(fromMiss.expected) === '[65]', JSON.stringify(fromMiss.expected));
  check('from the miss: chains 1-3 played whole are bests 1, 2, 3', fromMiss.seen.slice(0, 3).join() === '1,2,3', fromMiss.seen.join());
  check('from the miss: finishing chain 4 from its last item is not a best of 4, nor the game’s longest', fromMiss.seen[3] === 3 && fromMiss.seen[4] === 3, `best ${fromMiss.seen[3]}, longest ${fromMiss.seen[4]}`);
  check('from the miss: chain 5 then played whole is a best of 5', fromMiss.seen[5] === 5, String(fromMiss.seen[5]));
  const whole = await game('all');
  check('the whole chain again: chain 4 replayed whole after the miss is a best of 4', JSON.stringify(whole.expected) === '[60,62,64,65]' && whole.seen[3] === 4 && whole.seen[4] === 4, `${JSON.stringify(whole.expected)} best ${whole.seen[3]}, longest ${whole.seen[4]}`);
}

// ---- Drills: a pool dealt like a shuffled deck (A1) -----------------------------------------------------------------
// Three notes-only cards (no timing); each card is skipped with Next, and the cards dealt are read off as they come.
{
  const set = { id: 't-deck', title: 'test', order: 'pool', tempo: 80, items: ['C4', 'D4', 'E4'].map((n, i) => ({ n: i + 1, name: n, short: n, groups: [[n]] })) };
  async function deal(cards, sets = 1) {
    store.clear();
    const d = new Drill(parts(), keysStub(), notation, sound), names = [];
    d.open([set]);
    d.setLevel({ rung: 3, start: 'first', onTime: 'notes', metronome: false, cards });
    for (let k = 0; k < sets; k++) {
      if (k === 0) d.key(60, true, 1); // (Ready: any key starts a set)
      else await d.begin(); // (the set's end: New set)
      await settle();
      const one = [];
      while (d.state === 'turn' && one.length < (cards || 300)) { one.push(d.card.item.name); d.skip(); d.nextCard(); await settle(); }
      names.push(one);
    }
    d.close();
    return names;
  }
  const counts = (xs) => ['C4', 'D4', 'E4'].map((n) => xs.filter((x) => x === n).length).join();
  const twiceRunning = (xs) => xs.findIndex((x, i) => i > 0 && x === xs[i - 1]);
  // Many sets, since a random draw passes a single set by chance (5 from 3 holds all 3 about half the time).
  const fives = await deal(5, 40), sixes = await deal(6, 40);
  const badFive = fives.find((s) => counts(s).split(',').includes('0'));
  check('a set of 5 from 3 items holds all 3 (40 sets)', !badFive && fives.every((s) => s.length === 5), JSON.stringify(badFive ?? fives.find((s) => s.length !== 5)));
  const badSix = sixes.find((s) => counts(s) !== '2,2,2');
  check('a set of 6 from 3 items holds each twice (40 sets)', !badSix, JSON.stringify(badSix));
  const [endless] = await deal(0);
  const notDeck = [...Array(Math.floor(endless.length / 3)).keys()].find((k) => counts(endless.slice(3 * k, 3 * k + 3)) !== '1,1,1');
  check('endless: every three cards in turn are the three items (300 cards)', endless.length === 300 && notDeck === undefined, `${endless.length} cards; deal ${notDeck}: ${JSON.stringify(endless.slice(3 * notDeck, 3 * notDeck + 3))}`);
  const run = twiceRunning(endless);
  check('endless: never the same card twice running, across every reshuffle', run < 0, `card ${run}: ${JSON.stringify(endless.slice(run - 1, run + 1))}`);
  const across = [...fives, ...sixes].findIndex((s, i, all) => i > 0 && i !== 40 && s[0] === all[i - 1].at(-1));
  check('a new set never starts with the card the last one ended on', across < 0, `set ${across}`);
}

// ---- The log: a set or game left part way (final review 2026-10-15, F06; interfaces review F10) -------------------------
// Played as a lesson step's activity, then another set chosen from the menu (which ends the activity) or the level
// changed: the part played is logged as what it was played as (its set, title, level and the step's tag), and each item
// with its number in the set, so two items sharing a name can be told apart.
{
  const { setActivity } = await import('../src/log.ts');
  const lesson = { rung: 'r1', lesson: 'l1', step: 's1' };
  const A = { id: 'set-a', title: 'Set A', order: 'passage', tempo: 80, items: ['C4', 'D4'].map((n, i) => ({ n: i + 1, name: 'same name', short: n, groups: [[n]] })) };
  const B = { id: 'set-b', title: 'Set B', order: 'passage', tempo: 80, items: [{ n: 1, name: 'E4', short: 'E4', groups: [['E4']] }] };
  const log = () => JSON.parse(store.get('piano-web.log.v1') ?? '{"entries":[]}').entries;
  const fmt = (e) => JSON.stringify(e && { set: e.set, title: e.title, settings: e.settings, activity: e.activity, lesson: e.lesson, n: (e.result.cards ?? e.result.misses ?? []).map((c) => c.n) });
  // Drills: the step's set at its level (5 cards), two cards played (skipped), then set B chosen from the menu.
  store.clear();
  const d = new Drill(parts(), keysStub(), notation, sound);
  d.open([A, B], { set: 'set-a', level: { rung: 3, start: 'first', onTime: 'notes', metronome: false, cards: 5 } });
  setActivity({ id: 'step-drill', screen: 'drills', lesson });
  d.key(60, true, 1); await settle();
  for (let k = 0; k < 2; k++) { d.skip(); d.nextCard(); await settle(); }
  d.chooseSet('set-b'); // (as the set menu does: your own choice, which ends the activity)
  const left = log().at(-1);
  check('Drills, another set chosen part way: logged as set A at the step’s level, with the step’s tag', left?.set === 'set-a' && left.title === 'Set A' && left.settings.cards === 5
    && left.activity === 'step-drill' && left.lesson?.step === 's1', fmt(left));
  check('Drills: each card logged with its item number', JSON.stringify(left?.result.cards.map((c) => c.n)) === '[1,2]', fmt(left));
  // Your own set B: a card played, then the level changed: logged at the level it was played at.
  const before = d.levelNow.rung;
  d.key(64, true, 2); await settle();
  d.skip(); await settle();
  d.setLevel({ rung: before === 2 ? 3 : 2 });
  const level = log().at(-1);
  check('Drills, the level changed part way: logged at the level played (and untagged: no activity then)', level?.set === 'set-b' && level.settings.rung === before && level.activity === undefined, fmt(level));
  d.close();
  setActivity(null);
  // Simon: the step's set, chain 1 played, a wrong key in chain 2, then set B chosen.
  store.clear();
  const s = new Simon(parts(), keysStub(), notation, sound);
  s.open([A, B], { set: 'set-a', level: { rung: 3, match: 'same', miss: 'tries', speed: 'steady', onMiss: 'all', onNew: 'all' } });
  setActivity({ id: 'step-simon', screen: 'simon', lesson });
  const tap = async (m) => { s.key(m, true); s.key(m, false); await settle(); };
  await tap(60); await settle(); // starts: chain 1
  await tap(60); await pass(1000); // chain 1 right; chain 2 given
  await tap(60); await tap(71); // chain 2: C4 right, then a wrong key for item 2
  s.chooseSet('set-b');
  const game = log().at(-1);
  check('Simon, another set chosen part way: logged as set A with the step’s tag', game?.set === 'set-a' && game.title === 'Set A' && game.activity === 'step-simon' && game.lesson?.step === 's1', fmt(game));
  check('Simon: a miss logged with its item’s number', JSON.stringify(game?.result.misses?.map((m) => m.n)) === '[2]', fmt(game));
  s.close();
  setActivity(null);
}

console.log(failures.length ? `${failures.length} failed` : 'all passed');
process.exit(failures.length ? 1 : 0);
