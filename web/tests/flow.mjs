// Read in time's timing and judging (owner, 2026-10-18; src/flow/engine.ts): placing cards on the clock, each tap judged
// as it lands, missed notes, extra taps, wrong keys, lengths judged when asked, scores and speeding up. No page: the
// screen's glue is walked in the browser (tests/browser.mjs --only flow).
const { place, clicksBetween, FlowJudge, scoreWords, shouldSpeedUp, ON_TIME_MS } = await import('../src/flow/engine.ts');

const failures = [];
const check = (name, ok, detail = '') => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : ` — ${detail}`}`); if (!ok) failures.push(name); };

// A rhythm card: quarter, quarter, half | quarter rest, quarter, half (4/4), at 60: a quarter is 1000 ms.
const rhythmCard = { n: 1, name: 'r', short: '1', groups: [['C5'], ['C5'], ['C5'], [], ['C5'], ['C5']], beats: [1, 1, 2, 1, 1, 2], bars: [0, 0, 0, 1, 1, 1], meter: { beats: 4, beatType: 4 } };
const p = place(0, rhythmCard, 4000, 60, true);
check('a card placed from a downbeat: its notes at 4000, 5000, 6000, 9000, 10000 (a rest is no note), the end after its two bars (12000), any key (rhythm)',
  JSON.stringify(p.notes.map((n) => n.t)) === '[4000,5000,6000,9000,10000]' && p.end === 12000 && p.notes.every((n) => n.key === null) && p.notes.at(-1).last && p.beatMs === 1000 && p.barBeats === 4, JSON.stringify(p));
const p34 = place(1, { ...rhythmCard, groups: [['C5'], ['C5'], ['C5']], beats: [1, 1, 1], bars: [0, 0, 0], meter: { beats: 3, beatType: 4 } }, 0, 120, true);
check('3/4 at 120: a bar of 1500 ms, three beats', p34.end === 1500 && p34.barBeats === 3 && p34.beatMs === 500, JSON.stringify({ end: p34.end, beatMs: p34.beatMs }));
const clicks = clicksBetween(0, 4000, 1000, 4);
check('clicks: one a beat from a downbeat, the first of each bar accented', clicks.length === 4 && clicks[0].accent && !clicks[1].accent && clicks[3].t === 3000, JSON.stringify(clicks));

// Judging: on time, early, late, a tap near no note, a missed note.
{
  const j = new FlowJudge({ holds: false });
  j.add(p.notes);
  const r1 = j.tap(4000 + 40, null), r2 = j.tap(5000 - 180, null), r3 = j.tap(6000 + 150, null);
  const extra = j.tap(7500, null); // (the middle of the half note: near no note)
  const missed = j.tick(9300); // the note at 9000: its window is over
  const r5 = j.tap(10000 + 10, null);
  const s = j.score(0);
  check(`taps: within ${ON_TIME_MS} ms on time; 180 ms before early, 150 after late; a tap near no note extra; a note with no tap in its window missed (once)`,
    r1?.result.mark === 'ok' && r2?.result.mark === 'early' && r3?.result.mark === 'late' && extra === null && missed.length === 1 && missed[0].t === 9000 && j.tick(9500).length === 0 && r5?.result.mark === 'ok',
    JSON.stringify({ r1, r2, r3, extra, missed }));
  check('the card\'s score: "2 of 5 on time · 1 early · 1 late · 1 missed · 1 extra tap"', scoreWords(s) === '2 of 5 on time · 1 early · 1 late · 1 missed · 1 extra tap', scoreWords(s));
  check('a tap never counts for a note already played: two quick taps on one note, the second extra', (() => { const k = new FlowJudge(); k.add(place(0, rhythmCard, 0, 60, true).notes); k.tap(0, null); return k.tap(30, null) === null || k.tap(30, null)?.note.t !== 0; })());
}
// The window never reaches past 45 % of the gap to the next note: eighths at 120 (250 ms apart).
{
  const eighths = { n: 1, name: 'e', short: '1', groups: [['C5'], ['C5'], ['C5'], ['C5']], beats: [0.5, 0.5, 0.5, 0.5], bars: [0, 0, 0, 0], meter: { beats: 2, beatType: 4 } };
  const j = new FlowJudge();
  j.add(place(0, eighths, 0, 120, true).notes);
  const a = j.tap(105, null); // 105 ms late for the first (0): inside its window (45 % of 250), late
  const mid = j.tap(375, null); // halfway between the second (250) and third (500): in neither window, extra
  check('eighths 250 ms apart: a tap 105 ms after the first is that note, late; one halfway between two notes is extra (a window stays inside 45 % of its gap)', a?.note.t === 0 && a.result.mark === 'late' && mid === null, JSON.stringify({ a, mid }));
}
// Notes with keys: the right key on time ok; another key there wrong; a key belonging to a near note goes to it.
{
  const tune = { n: 1, name: 't', short: '1', groups: [['G4'], ['A4'], ['B4']], beats: [1, 1, 2], bars: [0, 0, 0], meter: { beats: 4, beatType: 4 } };
  const j = new FlowJudge();
  const pl = place(0, tune, 0, 60, false);
  j.add(pl.notes);
  const w = j.tap(10, 69), ok = j.tap(1005, 69), b = j.tap(2000, 71);
  check('keys: a wrong key on a note is "wrong"; the right key on time ok', pl.notes[0].key === 67 && w?.result.mark === 'wrong' && w.note.t === 0 && ok?.result.mark === 'ok' && b?.result.mark === 'ok', JSON.stringify({ w, ok, b }));
}
// Lengths judged (an option): let go before 3/4 of a note is "short"; held across the next tap fine; the card's last
// note never asked (the next card comes).
{
  const j = new FlowJudge({ holds: true });
  j.add(place(0, rhythmCard, 0, 60, true).notes);
  j.tap(0, null); const s1 = j.release(500, null); // a quarter (1000) let go at 500: short
  j.tap(1000, null); const s2 = j.release(1900, null); // let go at 900 of 1000: held
  j.tap(2000, null); j.tap(5000, null); // the half (2000 at 2000) still down when the next tap comes: held
  const s3 = j.release(5100, null);
  const off = new FlowJudge({ holds: false }); off.add(place(0, rhythmCard, 0, 60, true).notes); off.tap(0, null);
  check('lengths judged: a quarter let go at half its length "short"; at 90 % held; a note held until the next tap held; judged off: never short',
    s1?.result.mark === 'short' && s2 === null && j.results.get(j.all[2])?.mark === 'ok' && off.release(100, null) === null, JSON.stringify({ s1, s2, s3 }));
}
// Speeding up by itself: three exercises in a row at 90 % or better, no extra taps.
{
  const sc = (on, total, extra = 0) => ({ n: 0, onTime: on, total, early: 0, late: 0, missed: total - on, wrong: 0, short: 0, extra });
  check('speed up after three exercises at 90 % or better in a row; not after two, not with one at 80 %, not with an extra tap',
    shouldSpeedUp([sc(9, 10), sc(10, 10), sc(5, 5)]) && !shouldSpeedUp([sc(10, 10), sc(10, 10)]) && !shouldSpeedUp([sc(10, 10), sc(8, 10), sc(10, 10)]) && !shouldSpeedUp([sc(10, 10), sc(10, 10), sc(10, 10, 1)]));
}

console.log(failures.length ? `${failures.length} failed` : 'all passed');
process.exit(failures.length ? 1 : 0);
