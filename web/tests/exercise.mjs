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
const el = () => ({ textContent: '', className: '', hidden: false, innerHTML: '', value: '', addEventListener() {}, replaceChildren() {}, prepend() {}, after() {}, classList: { toggle() {}, add() {}, remove() {} } });
const parts = () => Object.fromEntries(['set', 'left', 'mid', 'right', 'name', 'chain', 'status', 'sub', 'start', 'hear', 'help', 'after', 'again', 'next', 'misses', 'fresh', 'finish', 'back'].map((k) => [k, el()]));
const keysStub = () => ({ onKey: null, down: new Set(), setRange() {}, choose() {}, clearMarks() {}, light() {}, wrong() {}, want() {}, release() {} });
const notation = { show: async () => {}, clear() {} };
const sound = { keyboard: null, songTime: () => 0, heardDelayMs: () => 0, play() {}, stop() {}, prepare: async () => {} };

// ---- Drills: name only, timed ---------------------------------------------------------------------------------------
// One card: C4 as a half note at 80 bpm (1500 ms; held ¾ of it: 1125 ms). Your first note starts the card's clock.
{
  const set = { id: 't-drill', title: 'test', order: 'pool', tempo: 80, items: [{ n: 1, name: 'C', short: 'C', groups: [['C4']], beats: [2] }] };
  let at = 100000;
  async function card(pressed, heldMs, rung = 4) {
    const ui = parts(), d = new Drill(ui, keysStub(), notation, sound);
    d.open([set]);
    d.setLevel({ rung, start: 'first', onTime: 'normal', metronome: false, cards: 10 });
    await d.begin(); // (Start: a key on Ready would also be the card's first note, checked below)
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
      await d.begin(); // (Start, and at the set's end New set)
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
// Played as a lesson step's activity, then another set chosen from the menu or the level changed: the part played is
// logged as what it was played as (its set, title, level and the step's tag), and each item with its number in the set,
// so two items sharing a name can be told apart. (Since the consistency pass, 2026-10-16, another set no longer ends the
// step: what is played next is still kept with the step, as practice: lesson/result.ts playedAsSet.)
{
  const { setStep, endStep } = await import('../src/log.ts');
  const setActivity = (a) => (a ? setStep(a) : endStep());
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
  d.chooseSet('set-b'); // (as the set menu does: your own choice; the step stays in force)
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
  check('Drills, the level changed part way: logged at the level played, still with the step (another set: practice for it)', level?.set === 'set-b' && level.settings.rung === before && level.activity === 'step-drill', fmt(level));
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

// ---- "Keys, no music" (help rung 0; lesson 1, 2026-10-16) ------------------------------------------------------------
// Before the staff is taught: the item is heard and its keys light, and no staff is drawn at any point (given, your turn,
// a miss, Hear again; a drill card's result too). Simon on the black keys of one octave, chain 3 played back.
{
  const { endStep } = await import('../src/log.ts');
  const setActivity = () => endStep();
  const black = [['C#4', 61], ['D#4', 63], ['F#4', 66], ['G#4', 68], ['A#4', 70]];
  const set = { id: 't-black', title: 'test', order: 'pool', tempo: 80, items: black.map(([n], i) => ({ n: i + 1, name: n, short: n, groups: [[n]] })) };
  const seen = { drawn: 0, lit: [], played: 0 };
  const watchNotation = { show: async () => { seen.drawn++; }, clear() {} };
  const watchKeys = { ...keysStub(), light(ms) { if (ms.length) seen.lit.push(...ms); } };
  const watchSound = { ...sound, play(events) { if (events.length) seen.played++; } };
  store.clear();
  const s = new Simon(parts(), watchKeys, watchNotation, watchSound);
  s.open([set], { set: 't-black', level: { rung: 0, match: 'same', miss: 'endless', speed: 'steady', onMiss: 'all', onNew: 'all' } });
  const tap = async (m) => { s.key(m, true); s.key(m, false); await settle(); };
  await tap(61); // starts the game
  const wait = async (ms) => { for (let t = 0; t < ms; t += 250) await pass(250); }; // (timers set during a pass run in the next)
  for (let n = 1; n <= 3; n++) { await wait(5000); for (const g of s.expected()) await tap(g[0]); }
  const best = s.best[s.bestKey()] ?? 0;
  await wait(6000);
  await tap(s.expected()[0][0] === 72 ? 73 : 72); // a miss (C5, not in the set)
  await wait(4000);
  await s['hearAgain']();
  await wait(4000);
  check('keys, no music (Simon): chain 3 played back, a best of 3', best >= 3, `best ${best}`);
  check('keys, no music (Simon): heard (the chain played each round) and its keys lit, all black keys of the set', seen.played >= 3 && seen.lit.length >= 3 && seen.lit.every((m) => black.some(([, k]) => k === m)), JSON.stringify(seen));
  check('keys, no music (Simon): no staff drawn at any point (given, your turn, a miss, Hear again)', seen.drawn === 0, `drawn ${seen.drawn} times`);
  s.close();
  setActivity(null);

  const d0 = { drawn: 0, lit: [], played: 0 };
  const d = new Drill(parts(), { ...keysStub(), light(ms) { if (ms.length) d0.lit.push(...ms); } }, { show: async () => { d0.drawn++; }, clear() {} }, { ...sound, play(events) { if (events.length) d0.played++; } });
  d.open([set], { set: 't-black', level: { rung: 0, start: 'first', onTime: 'notes', metronome: false, cards: 10 } });
  d.key(61, true, 1); await settle(); // starts the set
  await wait(3000); // the card is played to you, its key lit, then your turn
  const want = d.debug().steps[0]?.keys[0];
  d.key(want, true, 2); await settle(); // right
  await wait(3000); // the next card
  const want2 = d.debug().steps[0]?.keys[0];
  d.key(want2 === 72 ? 73 : 72, true, 3); await settle(); // wrong, then Skip
  d.skip(); await settle();
  check('keys, no music (Drills): the card is heard and its key lit', d0.played >= 1 && d0.lit.includes(want), JSON.stringify(d0));
  check('keys, no music (Drills): no staff drawn, not even with the result', d0.drawn === 0, `drawn ${d0.drawn} times`);
  d.close();
  setActivity(null);
}

// ---- Rhythm sets (owner, 2026-10-16): generated cards, dealt and judged -------------------------------------------------
// The generator's cards are checked by a reader of their own here (not the generator's code): each card read back from
// the item Drills plays (its groups, lengths and bars) into note values, every bar adding up to its metre, only the
// set's values, the feature in every card, a note first; 500 cards of each shipped set and of hand-made specs, dealt by
// Drills as it deals any pool (no card twice running). Then a card judged as tapped: on time, early, late, missed,
// extra taps, a half and a whole let go early, any key counting, and no note name in what it says.
{
  const { readFileSync } = await import('node:fs');
  const { readSet } = await import('../src/exercise/items.ts');
  const { cardItem } = await import('../src/exercise/rhythm.ts');
  const { PAD_KEY } = await import('../src/exercise/pad.ts');
  const METER_BEATS = { '4/4': 4, '3/4': 3, '2/4': 2 };
  /** A card read back into its note values, bar by bar, or the reason it is not a good card. */
  function readBack(item, meterBeats) {
    const bars = [];
    for (let i = 0; i < item.groups.length; i++) {
      const g = item.groups[i], b = item.beats[i], bar = item.bars[i];
      (bars[bar] ??= { values: [], sum: 0 });
      const at = bars[bar].sum;
      let v;
      if (!g.length) v = { 1: 'quarter-rest', 2: 'half-rest', 4: 'whole-rest' }[b];
      else if (b === 0.5) {
        const next = item.groups[i + 1], nb = item.beats[i + 1];
        if (!(next?.length && nb === 0.5 && item.bars[i + 1] === bar && Number.isInteger(at))) return { bad: `an eighth at beat ${at + 1} of bar ${bar + 1} is not the first of a pair on a beat` };
        v = 'eighths';
        i++;
        bars[bar].sum += 0.5;
      } else v = { 1: 'quarter', 2: 'half', 3: 'dotted-half', 4: 'whole' }[b];
      if (!v) return { bad: `a ${g.length ? 'note' : 'rest'} of ${b} beats` };
      if (at + (v === 'eighths' ? 1 : b) > meterBeats + 1e-9) return { bad: `${v} at beat ${at + 1} of bar ${bar + 1} is longer than what is left of the bar` };
      bars[bar].values.push(v);
      bars[bar].sum += b;
    }
    const off = bars.findIndex((x) => !x || Math.abs(x.sum - meterBeats) > 1e-9);
    if (off >= 0) return { bad: `bar ${off + 1} adds up to ${bars[off]?.sum ?? 0}, not ${meterBeats}` };
    return { bars: bars.map((x) => x.values) };
  }
  function cardProblem(item, spec) {
    const r = readBack(item, METER_BEATS[spec.meter]);
    if (r.bad) return r.bad;
    if (r.bars.length !== spec.bars) return `${r.bars.length} bars, not ${spec.bars}`;
    const all = r.bars.flat();
    const odd = all.find((v) => !spec.values.includes(v));
    if (odd) return `${odd} is not one of the set's values`;
    if (spec.feature && !all.includes(spec.feature)) return `no ${spec.feature} (the feature)`;
    if (all[0].endsWith('-rest')) return 'it starts with a rest';
    if (item.meter?.beats !== METER_BEATS[spec.meter]) return `its metre is ${JSON.stringify(item.meter)}`;
    return '';
  }
  /** 500 cards dealt by Drills from the set's pool, as a learner gets them (endless set, each card skipped). */
  async function deal500(set) {
    store.clear();
    const d = new Drill(parts(), keysStub(), notation, sound), cards = [];
    d.open([set]);
    d.setLevel({ rung: 3, start: 'first', onTime: 'normal', metronome: false, cards: 0 });
    await d.begin();
    while (d.state === 'turn' && cards.length < 500) { cards.push(d.card.item); d.skip(); d.nextCard(); await settle(); }
    d.close();
    return cards;
  }
  const shipped = JSON.parse(readFileSync(new URL('../public/content/sets/index.json', import.meta.url), 'utf8')).filter((f) => f.startsWith('rhythm-'));
  const specs = shipped.map((f) => [f.replace(/\.json$/, ''), JSON.parse(readFileSync(new URL(`../public/content/sets/${f}`, import.meta.url), 'utf8'))]);
  specs.push(
    ['hand: eighths and rests in 3/4, 4 bars', { title: 't', kind: 'rhythm', generate: { values: ['quarter', 'eighths', 'half', 'dotted-half', 'quarter-rest', 'half-rest'], meter: '3/4', bars: 4, feature: 'eighths' } }],
    ['hand: 2/4, half rest the feature, 2 bars', { title: 't', kind: 'rhythm', generate: { values: ['quarter', 'half', 'half-rest'], meter: '2/4', bars: 2, feature: 'half-rest' } }],
    ['hand: every value in 4/4, 1 bar, whole rest not possible as a feature', { title: 't', kind: 'rhythm', generate: { values: ['whole', 'half', 'quarter', 'eighths', 'dotted-half', 'quarter-rest', 'half-rest', 'whole-rest'], meter: '4/4', bars: 1, feature: 'dotted-half' } }],
    ['hand: whole rest the feature, 4/4, 2 bars', { title: 't', kind: 'rhythm', generate: { values: ['quarter', 'whole-rest'], meter: '4/4', bars: 2, feature: 'whole-rest' } }],
  );
  const samples = [];
  for (const [name, file] of specs) {
    const set = await readSet(name, file, 'file:///x/', async () => '', async () => '');
    const spec = file.generate;
    const cards = await deal500(set);
    const bad = cards.map((c) => [c, cardProblem(c, spec)]).find(([, p]) => p);
    const twice = cards.findIndex((c, i) => i > 0 && c.name === cards[i - 1].name);
    const distinct = new Set(cards.map((c) => c.name)).size;
    check(`rhythm ${name}: 500 cards dealt, every bar adds up, only its values, ${spec.feature ? `${spec.feature} in every card, ` : ''}a note first`, cards.length === 500 && !bad, bad ? `${bad[1]}: ${bad[0].name}` : `${cards.length} cards`);
    check(`rhythm ${name}: never the same card twice running (${distinct} different in the pool)`, set.items.length === 1 ? distinct === 1 : twice < 0, twice >= 0 ? `card ${twice}: ${cards[twice].name}` : `${distinct} different`);
    samples.push(`${name} (${set.items.length} in the pool):\n${cards.slice(0, 5).map((c) => `    ${c.name}`).join('\n')}`);
  }
  console.log(`     five cards of each, as dealt:\n  ${samples.join('\n  ')}`);
  const steady = await readSet('s', { title: 't', kind: 'rhythm', generate: { values: ['quarter'], meter: '4/4', bars: 2 } }, 'file:///x/', async () => '', async () => '');
  check('rhythm: quarters alone give the one steady-beat card', steady.items.length === 1 && steady.items[0].name === 'quarter quarter quarter quarter | quarter quarter quarter quarter', steady.items.map((i) => i.name).join(' / '));
  // The checker itself, on cards it must refuse (a bar short, a rest first, an eighth off the beat, a value not allowed).
  const fool = [
    ['a bar a beat short', { groups: [['C5'], ['C5'], ['C5']], beats: [1, 1, 1], bars: [0, 0, 0], meter: { beats: 4, beatType: 4 } }, { values: ['quarter'], meter: '4/4', bars: 1 }],
    ['a rest first', { groups: [[], ['C5'], ['C5'], ['C5']], beats: [1, 1, 1, 1], bars: [0, 0, 0, 0], meter: { beats: 4, beatType: 4 } }, { values: ['quarter', 'quarter-rest'], meter: '4/4', bars: 1 }],
    ['an eighth pair off the beat', { groups: [['C5'], ['C5'], ['C5'], ['C5'], ['C5']], beats: [0.5, 1, 0.5, 1, 1], bars: [0, 0, 0, 0, 0], meter: { beats: 4, beatType: 4 } }, { values: ['quarter', 'eighths'], meter: '4/4', bars: 1 }],
    ['a half where only quarters are allowed', { groups: [['C5'], ['C5']], beats: [2, 2], bars: [0, 0], meter: { beats: 4, beatType: 4 } }, { values: ['quarter'], meter: '4/4', bars: 1 }],
    ['no feature', { groups: [['C5'], ['C5'], ['C5'], ['C5']], beats: [1, 1, 1, 1], bars: [0, 0, 0, 0], meter: { beats: 4, beatType: 4 } }, { values: ['quarter', 'half'], meter: '4/4', bars: 1, feature: 'half' }],
  ];
  const missed = fool.filter(([, item, spec]) => !cardProblem(item, spec)).map(([n]) => n);
  check('rhythm: the card reader refuses a bar a beat short, a rest first, eighths off the beat, a value not allowed, no feature', missed.length === 0, `let through: ${missed.join(', ')}`);
  // Refusals, with their reasons (the app's reader: a set that cannot be read is listed with its reason, never loaded).
  const refused = async (generate, extra = {}) => { try { await readSet('t', { title: 't', kind: 'rhythm', ...extra, ...(generate ? { generate } : {}) }, 'file:///x/', async () => '', async () => ''); return 'ACCEPTED'; } catch (e) { return e.message; } };
  for (const [what, gen, want, extra] of [
    ['an unknown value', { values: ['quarter', 'sixteenth'], meter: '4/4', bars: 2 }, /"sixteenth" is not one of whole, half, quarter, eighths/],
    ['a whole in 3/4', { values: ['quarter', 'whole'], meter: '3/4', bars: 2 }, /whole \(4 beats\) does not fit a bar of 3\/4/],
    ['a dotted half in 2/4', { values: ['quarter', 'dotted-half'], meter: '2/4', bars: 2 }, /dotted-half \(3 beats\) does not fit a bar of 2\/4/],
    ['a feature not in the values', { values: ['quarter', 'half'], meter: '4/4', bars: 2, feature: 'whole' }, /feature "whole" should be one of its values/],
    ['bars 0', { values: ['quarter'], meter: '4/4', bars: 0 }, /bars 0 should be a whole number 1 to 4/],
    ['bars 5', { values: ['quarter'], meter: '4/4', bars: 5 }, /bars 5 should be a whole number 1 to 4/],
    ['a metre not offered', { values: ['quarter'], meter: '6/8', bars: 2 }, /meter "6\/8" should be one of 4\/4, 3\/4, 2\/4/],
    ['a misspelt field', { values: ['quarter'], meter: '4/4', bars: 2, featured: 'quarter' }, /generate has "featured"/],
    ['rests only', { values: ['quarter-rest'], meter: '4/4', bars: 2 }, /only rests/],
    ['halves alone in 3/4 (a bar cannot be filled)', { values: ['half'], meter: '3/4', bars: 1 }, /cannot fill a bar of 3\/4/],
    ['a whole rest as the feature of a 1-bar card (it starts with a note)', { values: ['quarter', 'whole-rest'], meter: '4/4', bars: 1, feature: 'whole-rest' }, /feature whole-rest cannot be placed in 1 bar/],
    ['generate on a set that is not rhythm', { values: ['quarter'], meter: '4/4', bars: 2 }, /"generate" is for rhythm sets/, { kind: 'melodies' }],
    ['a rhythm set with notes items', null, /a rhythm set's items are MusicXML patterns/, { items: { 1: { notes: 'C4' } } }],
    ['a rhythm set with neither', null, /should give either "generate" or "items"/],
  ]) {
    const said = await refused(gen, extra);
    check(`rhythm refuses ${what}, with its reason`, want.test(said), said);
  }

  // Judging a card as tapped: quarter quarter half | whole at 72 (a quarter 833 ms). The first tap starts the card's
  // clock (on time by definition); the others at the clock's times as given. Holds: every tap held to the next unless
  // said; a tap is any key (the pad, or MIDI keys 60, 61, 99).
  const item = cardItem(1, [['quarter', 'quarter', 'half'], ['whole']], '4/4');
  const set = { id: 't-rhythm', title: 'test', kind: 'rhythm', order: 'pool', tempo: 72, items: [item] };
  let clock = 0;
  const clockSound = { ...sound, songTime: () => clock };
  async function tapCard(taps, { lag = 0, metronome = false } = {}) {
    store.clear();
    const s = { ...clockSound, heardDelayMs: () => lag };
    const d = new Drill(parts(), keysStub(), notation, s);
    d.open([set]);
    d.setLevel({ rung: 3, start: 'first', onTime: 'normal', metronome, cards: 10 });
    await d.begin(); // (Start)
    const base = 1e9 + Math.random() * 1e8; // (the taps' own times: later than now, so none is taken as arriving late)
    for (const [t, held, key = PAD_KEY] of taps) {
      clock = t;
      holds.key(key, true, base + t);
      d.key(key, true, base + t);
      holds.key(key, false, base + t + held);
    }
    const steps = d.debug().steps;
    d.finish();
    const r = d.results.at(-1);
    d.close();
    return { text: r?.text ?? '(no result)', steps };
  }
  const Q = 60000 / 72;
  const onBeat = [[0, Q - 20], [Q, Q - 20], [2 * Q, 2 * Q - 20], [4 * Q, 4 * Q - 20]];
  const NAME = /[A-G][♯♭#b]?\d|\b[A-G][♯♭]/;
  const results = [];
  const judged = async (what, taps, want, opts) => { const r = await tapCard(taps, opts); results.push(r.text); check(`rhythm judged: ${what}`, want.test(r.text), r.text); return r; };
  const first = await judged('every tap on time and held: clean', onBeat, /^clean$/);
  check('rhythm judged: the card\'s steps are its four notes at 0, 833, 1667, 3333 ms, their lengths to hold 833, 833, 1667, 3333 (¾ of each asked)', JSON.stringify(first.steps.map((s) => [Math.round(s.t), Math.round(s.hold)])) === JSON.stringify([[0, 833], [833, 833], [1667, 1667], [3333, 3333]]), JSON.stringify(first.steps));
  await judged('the second tap 150 ms late: 1 note late', [onBeat[0], [Q + 150, Q - 170], onBeat[2], onBeat[3]], /3 of 4 on time and held · 1 note late$/);
  await judged('the third tap 150 ms early: 1 note early', [onBeat[0], onBeat[1], [2 * Q - 150, 2 * Q], onBeat[3]], /1 note early$/);
  await judged('the whole note not tapped: 1 note missed', onBeat.slice(0, 3), /1 note missed$/);
  await judged('an extra tap between beats: 1 extra tap', [onBeat[0], [Q / 2, 100, 62], onBeat[1], onBeat[2], onBeat[3]], /^4 of 4 on time and held · 1 extra tap$/);
  await judged('the half let go after 600 ms: 1 note let go early', [onBeat[0], onBeat[1], [2 * Q, 600], onBeat[3]], /1 note let go early$/);
  await judged('the whole let go after 1000 ms: 1 note let go early', [onBeat[0], onBeat[1], onBeat[2], [4 * Q, 1000]], /1 note let go early$/);
  await judged('the half held 1300 ms (more than ¾ of 1667): clean', [onBeat[0], onBeat[1], [2 * Q, 1300], onBeat[3]], /^clean$/);
  await judged('any MIDI key counts (60, 61, 99 and the pad): clean', [[0, Q - 20, 60], [Q, Q - 20, 61], [2 * Q, 2 * Q - 20, 99], [4 * Q, 4 * Q - 20]], /^clean$/);
  check('rhythm judged: no note name in anything it said', results.every((t) => !NAME.test(t)) && !results.some((t) => /wrong key/.test(t)), results.join(' | '));

  // The first tap (owner, 2026-10-16: "Make sure to start on the first tap"): on Ready, at rung 3 starting on your first
  // note, the tap that starts the set is the card's first note, on time, the clock running from it; tapping the other
  // notes but the last leaves just the last missed. Then a tap on the result goes on to the next card, as its first note.
  {
    store.clear();
    const d = new Drill(parts(), keysStub(), notation, clockSound);
    d.open([set]);
    d.setLevel({ rung: 3, start: 'first', onTime: 'normal', metronome: false, cards: 10 });
    const base = 2e9;
    clock = 0;
    holds.key(PAD_KEY, true, base); d.key(PAD_KEY, true, base); holds.key(PAD_KEY, false, base + Q - 20); // (on Ready)
    await settle();
    const started = { state: d.state, started: d.started, played: d.played.length };
    for (const [t, h] of onBeat.slice(1, 3)) { clock = t; holds.key(PAD_KEY, true, base + t); d.key(PAD_KEY, true, base + t); holds.key(PAD_KEY, false, base + t + h); }
    d.finish();
    const text = d.results.at(-1)?.text ?? '';
    const missedMark = d.debug().steps.length;
    check("the first tap: on Ready it starts the set and is the card's first note (the clock running)", started.state === 'turn' && started.started && started.played === 1, JSON.stringify(started));
    check('the first tap: the next two notes tapped, the last not: exactly one missed (the last)', /^3 of 4 on time and held · 1 note missed$/.test(text), text);
    const before = d.results.length, cardBefore = d.card;
    clock = 0;
    d.key(PAD_KEY, true, base + 20000); await settle();
    check('the first tap: a tap on the result goes on to the next card and is its first note', d.card !== cardBefore && d.state === 'turn' && d.started && d.played.length === 1 && d.results.length === before, JSON.stringify({ state: d.state, started: d.started, played: d.played.length, steps: missedMark }));
    d.close();
  }

  // The clock as heard (2026-10-16): the clicks reach the ear 120 ms after the clock (a stand-in latency). Taps with what
  // is heard come 120 ms after the clock's beat: on time with the metronome (the clicks are heard), late without the
  // delay taken off.
  const heard = onBeat.map(([t, h], i) => [i ? t + 120 : t, h]);
  await judged('heard 120 ms late, metronome on: taps at the clock + 120 ms are on time', heard, /^clean$/, { lag: 120, metronome: true });
  await judged('the same taps with no delay (nothing heard late): 3 notes late', heard, /3 notes late$/, { lag: 0, metronome: true });
  await judged('metronome off (nothing heard to play with): no delay taken off, taps at the clock on time', onBeat, /^clean$/, { lag: 120, metronome: false });
}

// ---- The clock as heard (sound.ts heardDelayMs, 2026-10-16) -------------------------------------------------------------
{
  const { Sound } = await import('../src/sound.ts');
  const s = new Sound();
  const none = s.heardDelayMs();
  s.ctx = { baseLatency: 0.01, outputLatency: 0.05, currentTime: 0 };
  const phone = [s.heardDelayMs(), s.heardDelayMs('clicks')];
  s.keyboard = {};
  const keyboard = [s.heardDelayMs(), s.heardDelayMs('clicks')];
  s.keyboard = null;
  s.ctx = { currentTime: 0 };
  const missing = s.heardDelayMs();
  s.ctx = { baseLatency: 0.01, currentTime: 0 };
  const baseOnly = s.heardDelayMs();
  check('heardDelayMs: no sound yet 0; base 10 + output 50 ms = 60 for the piano and the clicks on the phone', none === 0 && phone.every((x) => Math.abs(x - 60) < 1e-9), JSON.stringify({ none, phone }));
  check('heardDelayMs: the piano on the MIDI keyboard 0, the clicks (always on the phone) still 60', keyboard[0] === 0 && Math.abs(keyboard[1] - 60) < 1e-9, JSON.stringify(keyboard));
  check('heardDelayMs: neither latency given 0; only baseLatency given counts it (10)', missing === 0 && Math.abs(baseOnly - 10) < 1e-9, JSON.stringify({ missing, baseOnly }));
}

// ---- Timing calibration (owner, 2026-10-16; src/calibration.ts) ------------------------------------------------------------
// The run's rule (8 clicks at 80, the first two left out, the median of the taps' delays; too few or too spread taps, or
// a result outside -100…+400 ms, refused) and which delay a judge then takes off.
{
  const { judgeCalibration, saveCalibration, resetCalibration, calibrationFor, TRY_AGAIN } = await import('../src/calibration.ts');
  const { Sound } = await import('../src/sound.ts');
  const clicks = Array.from({ length: 8 }, (_, k) => k * 750);
  const run = (offsets) => judgeCalibration(clicks, offsets.map((o, k) => (o === null ? null : clicks[k] + o)).filter((x) => x !== null));
  const steady = run([90, 95, 80, 85, 78, 82, 88, 79]);
  check('calibration: taps 78–88 ms after the clicks: the median of the six counted (80, 85, 78, 82, 88, 79 → 81)', steady.ok && steady.ms === 81 && steady.taps === 6 && !steady.large, JSON.stringify(steady));
  const firstTwo = run([400, -140, 80, 85, 78, 82, 88, 79]);
  check('calibration: the first two clicks left out (taps there far off change nothing)', firstTwo.ok && firstTwo.ms === 81, JSON.stringify(firstTwo));
  const stray = run([80, 80, 80, 85, 75, 90, 70, 250]);
  check('calibration: one stray tap among six is allowed (median 82.5 → 83)', stray.ok && stray.ms === 83, JSON.stringify(stray));
  const few = run([80, 80, 80, 85, null, null, null, 70]);
  check('calibration refuses too few taps (3 of 6), saying try again', !few.ok && few.reason.startsWith(TRY_AGAIN), JSON.stringify(few));
  const spread = run([0, 0, 0, 200, 50, 150, 100, 20]);
  check('calibration refuses taps spread too widely (0 to 200 ms), saying try again', !spread.ok && spread.reason.startsWith(TRY_AGAIN) && /apart/.test(spread.reason), JSON.stringify(spread));
  const late = run([450, 450, 450, 455, 445, 450, 452, 448]);
  check('calibration refuses a median above +400 ms', !late.ok && /outside/.test(late.reason), JSON.stringify(late));
  const early = run([-120, -120, -120, -125, -115, -120, -118, -122]);
  check('calibration refuses a median below -100 ms', !early.ok && /outside/.test(early.reason), JSON.stringify(early));
  const big = run([200, 200, 200, 205, 195, 200, 210, 190]);
  check('calibration: 200 ms is kept, marked large (beyond ±150: run it again)', big.ok && big.ms === 200 && big.large, JSON.stringify(big));
  const extra = judgeCalibration(clicks, [...clicks.map((c) => c + 80), ...clicks.map((c) => c + 300)]);
  check('calibration: a second tap on a click is extra, the first counts', extra.ok && extra.ms === 80, JSON.stringify(extra));
  // Which delay applies: the browser's figure (60 ms here) unless a calibration is kept for the way of playing.
  store.clear();
  const snd = new Sound();
  snd.ctx = { baseLatency: 0.01, outputLatency: 0.05, currentTime: 0 };
  const none = [snd.heardDelayMs('clicks', 'screen'), snd.heardDelayMs('clicks', 'midi'), snd.heardDelayMs('clicks')];
  saveCalibration('screen', { ms: 150, at: '2026-10-16T00:00:00Z', taps: 6 });
  const kept = [snd.heardDelayMs('clicks', 'screen'), snd.heardDelayMs('clicks', 'midi'), snd.heardDelayMs('clicks'), snd.heardDelayMs('piano', 'screen')];
  snd.keyboard = {};
  const keyboard = [snd.heardDelayMs('piano', 'screen'), snd.heardDelayMs('clicks', 'screen')];
  snd.keyboard = null;
  resetCalibration('screen');
  const after = [snd.heardDelayMs('clicks', 'screen'), calibrationFor('screen')];
  check('calibration applies: none kept, the browser\'s 60 ms for both ways of playing', none.every((x) => Math.abs(x - 60) < 1e-9), JSON.stringify(none));
  check('calibration applies: 150 kept for screen taps is used for screen taps only (MIDI keys and no input: 60)', kept[0] === 150 && Math.abs(kept[1] - 60) < 1e-9 && Math.abs(kept[2] - 60) < 1e-9 && kept[3] === 150, JSON.stringify(kept));
  check('calibration applies: the piano on the MIDI keyboard: 0 (no phone sound), the clicks still the kept 150', keyboard[0] === 0 && keyboard[1] === 150, JSON.stringify(keyboard));
  check('calibration applies: reset, back to the browser\'s figure', Math.abs(after[0] - 60) < 1e-9 && after[1] === null, JSON.stringify(after));
}

// ---- The consistency pass (owner, 2026-10-16) ------------------------------------------------------------------------
// One set of result marks: the colours result-marks.ts draws the music with are style.css's tokens (keys and legends).
{
  const { MARK, legendLine, kindsOf } = await import('../src/result-marks.ts');
  const { readFileSync } = await import('node:fs');
  const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
  const token = (n) => new RegExp(`--mark-${n}:\\s*(#[0-9a-f]{6})`).exec(css)?.[1];
  const pairs = { missed: token('missed'), timing: token('timing'), wrong: token('wrong'), want: token('want') };
  check('marks: style.css --mark-* tokens are result-marks.ts MARK (grey, orange, red, the blue outline)', Object.entries(pairs).every(([k, v]) => v === MARK[k]) && MARK.want !== '#16a34a', JSON.stringify({ pairs, MARK }));
  check('marks: the key says only the kinds present',
    legendLine(kindsOf([{ kind: 'missed' }])) === 'grey: missed' && legendLine(kindsOf([{ kind: 'late' }, { kind: 'short' }])) === 'orange: early, late or let go early'
    && legendLine(kindsOf([{ kind: 'missed' }, { kind: 'early' }], 1)) === 'grey: missed · orange: early, late or let go early · red: a wrong key' && legendLine(kindsOf([])) === '',
    legendLine(kindsOf([{ kind: 'missed' }, { kind: 'early' }], 1)));
}
// A lesson step's set done: "Back to the lesson ▶" shows, and a key does it (not in its first moment); outside a step, a
// key at Set done does nothing (New set is a tap).
{
  const set = { id: 't-end', title: 'test', order: 'pool', tempo: 80, items: ['C4', 'D4'].map((n, i) => ({ n: i + 1, name: n, short: n, groups: [[n]] })) };
  async function endOfSet(inStep) {
    store.clear();
    const ui = parts(), d = new Drill(ui, keysStub(), notation, sound);
    let back = 0;
    d.inStep = () => inStep;
    d.back = () => { back++; };
    d.open([set]);
    d.setLevel({ rung: 3, start: 'first', onTime: 'notes', metronome: false, cards: 2 });
    await d.begin(); await settle();
    while (d.state === 'turn') { d.skip(); d.nextCard(); await settle(); }
    const shown = { state: d.state, back: !ui.back.hidden, sub: ui.sub.textContent };
    const t = performance.now();
    d.key(60, true, t); await settle(); // (at once: the last card's keys)
    const early = back;
    d.key(60, true, t + 900); await settle();
    d.close();
    return { ...shown, early, late: back };
  }
  const step = await endOfSet(true), own = await endOfSet(false);
  check('Drills, a lesson step\'s set done: Back to the lesson shows; a key does it after a moment, not at once', step.state === 'done' && step.back && step.early === 0 && step.late === 1, JSON.stringify(step));
  check('Drills, your own set done: no Back to the lesson, and a key does nothing', own.state === 'done' && !own.back && own.late === 0, JSON.stringify(own));
}
// Simon: a mash during a game ends it with what it reached (as Drills keeps a set's results), not back to Ready.
{
  store.clear();
  const set = { id: 't-mash', title: 'test', order: 'passage', tempo: 80, items: ['C4', 'D4', 'E4'].map((n, i) => ({ n: i + 1, name: n, short: n, groups: [[n]] })) };
  const ui = parts(), s = new Simon(ui, keysStub(), notation, sound);
  s.open([set], { set: 't-mash', level: { rung: 3, match: 'same', miss: 'tries', speed: 'steady', onMiss: 'all', onNew: 'all' } });
  const tap = async (m) => { s.key(m, true); s.key(m, false); await settle(); };
  await tap(60); await settle(); // starts: chain 1
  await tap(60); await pass(1000); // chain 1 right; chain 2 given
  s.command('mash');
  const log = JSON.parse(store.get('piano-web.log.v1') ?? '{"entries":[]}').entries;
  check('Simon, a mash: the game ends showing its longest chain (1), logged as stopped, Again offered', s.state === 'over' && /Stopped by a mash: longest chain 1/.test(ui.status.textContent) && log.at(-1)?.result.ended === 'stopped' && ui.start.textContent === 'Again' && !ui.start.hidden,
    JSON.stringify({ state: s.state, status: ui.status.textContent, ended: log.at(-1)?.result.ended }));
  s.close();
}

// ---- After the beginner walk-through (owner, 2026-10-16) ---------------------------------------------------------------
// Rushing and dragging named (drift.ts): a straight line through the taps' times; named at 5% or more, when the line
// accounts for at least half of how the taps moved; never from too few taps.
{
  const { drift, DRIFT_SHARE } = await import('../src/drift.ts');
  const beat = 833, due = Array.from({ length: 8 }, (_, i) => i * beat);
  const taps = (f) => due.map((d, i) => ({ due: d, at: f(d, i) }));
  const wobble = [30, -40, 25, -35, 40, -20, 35, -30];
  const cases = {
    steady: drift(taps((d) => d), beat),
    'steady with ±40 ms wobble': drift(taps((d, i) => d + wobble[i]), beat),
    'sped up 7% (each beat 58 ms sooner)': drift(taps((d) => d * 0.93), beat),
    'slowed down 7%': drift(taps((d) => d * 1.07), beat),
    'sped up 3% (under the line)': drift(taps((d) => d * 0.97), beat),
    'sped up 7% with ±40 ms wobble': drift(taps((d, i) => d * 0.93 + wobble[i]), beat),
    'one late tap at the end only (not a trend over the card: the line explains little)': drift(taps((d, i) => d + (i === 7 ? 250 : 0) + wobble[i]), beat),
    'three taps': drift(taps((d) => d * 0.9).slice(0, 3), beat),
  };
  check('drift: steady and wobbly playing is not named; 7% faster is "faster", 7% slower "slower"; 3% is not; three taps say nothing',
    cases.steady === null && cases['steady with ±40 ms wobble'] === null && cases['sped up 7% (each beat 58 ms sooner)'] === 'faster' && cases['slowed down 7%'] === 'slower'
    && cases['sped up 3% (under the line)'] === null && cases['sped up 7% with ±40 ms wobble'] === 'faster' && cases['three taps'] === null && DRIFT_SHARE === 0.05,
    JSON.stringify(cases));
  check('drift: a single late tap at the end is not called slowing down', cases['one late tap at the end only (not a trend over the card: the line explains little)'] === null, JSON.stringify(cases));
}
// "Find it" sets (find.ts): the cards made from the keys; refusals.
{
  const { readFindSpec, findPool, groupsOn } = await import('../src/exercise/find.ts');
  const pool = findPool(readFindSpec({ keys: 'C3-B4', groups: ['two', 'three'], places: ['lower', 'higher', 'any'] }));
  const byName = Object.fromEntries(pool.map((it) => [it.name, it.find.keys.join(' ')]));
  check('find: C3–B4, two and three, lower / higher / any: 6 cards, each group the right keys, "any" both groups',
    pool.length === 6 && byName['a group of two, lower down'] === '49 51' && byName['a group of two, higher up'] === '61 63' && byName['a group of three, lower down'] === '54 56 58'
    && byName['a group of three, higher up'] === '66 68 70' && byName['a group of two'] === '49 51 61 63' && pool.every((it) => !/[A-G]\d/.test(it.name)), JSON.stringify(byName));
  check('find: a group cut off by the range is not one of them (C4–E5 holds two pairs and one three)', JSON.stringify(groupsOn(60, 76).map((g) => g.kind)) === '["two","three","two"]', JSON.stringify(groupsOn(60, 76)));
  const refused = (spec) => { try { readFindSpec(spec); return ''; } catch (e) { return e.message; } };
  const bad = {
    'keys on a black key': refused({ keys: 'C#3-B4', groups: ['two'], places: ['any'] }),
    'a place misspelt': refused({ keys: 'C3-B4', groups: ['two'], places: ['top'] }),
    'middle with two groups': refused({ keys: 'C3-B4', groups: ['two'], places: ['middle'] }),
    'higher with one three': refused({ keys: 'C4-E5', groups: ['three'], places: ['higher'] }),
    'a field misspelt': refused({ keys: 'C3-B4', groups: ['two'], places: ['any'], place: 'x' }),
    'groups twice': refused({ keys: 'C3-B4', groups: ['two', 'two'], places: ['any'] }),
  };
  check('find: refused with a reason: keys on a black key, an unknown place, "middle" without an odd number, "higher" with one group, a misspelt field, a group twice', Object.values(bad).every(Boolean), JSON.stringify(bad));
  // letters (2026-10-17, the C-D-E lesson): "a D, higher up", any key of that letter in that part of the keyboard
  const lp = findPool(readFindSpec({ keys: 'C3-B5', letters: ['C', 'D', 'E'], places: ['lower', 'middle', 'higher', 'any'] }));
  const lw = Object.fromEntries(lp.map((it) => [it.name, it.find.keys.join(' ')]));
  check('find by letter: C3–B5, C D E at lower / middle / higher / any: 12 cards, "a D, higher up" is D5 (74), "an E, lower down" E3 (52), "a C" any of the three',
    lp.length === 12 && lw['a D, higher up'] === '74' && lw['an E, lower down'] === '52' && lw['a C, in the middle'] === '60' && lw['a C'] === '48 60 72', JSON.stringify(lw));
  const lbad = { 'a black key letter': refused({ keys: 'C3-B4', letters: ['C#'], places: ['any'] }), 'middle with two Ds': refused({ keys: 'C3-B4', letters: ['D'], places: ['middle'] }), 'neither groups nor letters': refused({ keys: 'C3-B4', places: ['any'] }) };
  check('find by letter: refused: a letter that is not a white key\'s, "middle" with two of it, neither groups nor letters', Object.values(lbad).every(Boolean), JSON.stringify(lbad));
  const middle = findPool(readFindSpec({ keys: 'C3-B5', groups: ['three'], places: ['middle'] }));
  check('find: "middle" of three groups of three is the middle one', middle.length === 1 && middle[0].find.keys.join(' ') === '66 68 70', JSON.stringify(middle));
}
// A "find it" card in Drills: the key that starts the set is not an answer; a wrong key, then the right group; untimed.
{
  store.clear();
  const { findPool, readFindSpec } = await import('../src/exercise/find.ts');
  const spec = readFindSpec({ keys: 'C3-B4', groups: ['three'], places: ['higher'] });
  const set = { id: 't-find', title: 'test', kind: 'find', order: 'pool', tempo: 80, items: findPool(spec), find: spec };
  const marks = { wrong: [], want: [] };
  const ui = parts(), d = new Drill(ui, { ...keysStub(), wrong(ms) { marks.wrong = ms; }, want(ms) { marks.want = ms; } }, notation, sound);
  d.open([set], { set: 't-find', level: { cards: 2 } });
  d.key(60, true, 1000); await settle(); await pass(100); // a key on Ready starts the set: the card is shown, not answered
  const shown = { state: d.state, name: ui.name.textContent, results: d.results.length };
  d.key(60, true, 2000); await settle(); // a white key: not that group
  const miss = { status: ui.status.textContent, wrong: marks.wrong, want: marks.want, text: d.results.at(-1)?.text };
  ui.again; d.command('low'); await settle(); await pass(100); // Again (the lowest key): the card again
  d.key(68, true, 4000); await settle();
  const hit = { text: d.results.at(-1)?.text, clean: d.results.at(-1)?.clean, n: d.results.length };
  check('find card: the starting key is not an answer; a white key is "not that group" (red, the group outlined); Again then a key of the group: right on a retry',
    shown.state === 'turn' && shown.name === 'Find a group of three, higher up' && shown.results === 0 && miss.status === 'Not quite' && miss.wrong.join() === '60' && miss.want.join() === '66,68,70' && hit.text === 'right on a retry' && hit.n === 1,
    JSON.stringify({ shown, miss, hit }));
  d.close();
}
// The letters view (owner, 2026-10-17): a set's `view: "letters"` is read; refused: another value, on a rhythm or find set,
// with "play", and a card without written rhythm.
{
  const { readSet } = await import('../src/exercise/items.ts');
  const read = async (f) => { try { return await readSet('l', { title: 't', ...f }, 'file:///x/', async () => '', async () => ''); } catch (e) { return e.message; } };
  const bad = {
    'view "staff"': await read({ view: 'staff', items: { 1: { notes: 'C4' } } }),
    'on a rhythm set': await read({ kind: 'rhythm', view: 'letters', generate: { values: ['quarter'], meter: '4/4', bars: 1 } }),
    'with play': await read({ view: 'letters', play: { mode: 'wait' }, items: { 1: { notes: 'C4' } } }),
    'a card without written rhythm': await read({ view: 'letters', items: { 1: { notes: 'E4, D4, C4' } } }),
  };
  check('letters view: refused with a reason: another view, on a rhythm set, with "play", a card with no written rhythm',
    /should be "letters"/.test(bad['view "staff"']) && /has no "view"/.test(bad['on a rhythm set']) && /played in Drills/.test(bad['with play']) && /needs written rhythm/.test(bad['a card without written rhythm']), JSON.stringify(bad));
}
// Simon by ear (help 5): a miss plays the note again and you keep trying; no try lost, nothing named, no game over.
{
  store.clear();
  const set = { id: 't-ear', title: 'test', order: 'passage', tempo: 80, items: ['C#4', 'D#4', 'F#4'].map((n, i) => ({ n: i + 1, name: n, short: n, groups: [[n]] })) };
  const played = [], marks = { wrong: [], want: [] };
  const ui = parts(), s = new Simon(ui, { ...keysStub(), wrong(ms) { marks.wrong = ms; }, want(ms) { marks.want = ms; } }, notation, { ...sound, play(events) { if (events.length) played.push(events.map((e) => e.midi).join()); } });
  s.open([set], { set: 't-ear', level: { rung: 5, match: 'same', miss: 'tries', speed: 'steady', onMiss: 'all', onNew: 'all' } });
  const tap = async (m) => { s.key(m, true); s.key(m, false); await settle(); };
  await tap(61); await pass(3000); // starts: chain 1 heard, your turn
  for (const k of [63, 66, 68, 70]) await tap(k); // four wrong keys
  const after = { state: s.state, status: ui.status.textContent, hearts: ui.right.textContent, want: marks.want.length, replayed: played.filter((p) => p === '61').length };
  await tap(61); await pass(200);
  const found = ui.status.textContent;
  check('Simon by ear: four wrong keys keep your turn (no game over, no heart shown or lost), nothing outlined, no note named, the note played again each time; the right key then: found by trying, not a best',
    after.state === 'turn' && /listen again, and try another key/.test(after.status) && !/[A-G][♯#]?\d/.test(after.status) && after.hearts === '' && after.want === 0 && after.replayed >= 5 && /Found by trying keys/.test(found),
    JSON.stringify({ after, found }));
  s.close();
}

console.log(failures.length ? `${failures.length} failed` : 'all passed');
process.exit(failures.length ? 1 : 0);
