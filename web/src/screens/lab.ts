// The accompaniment lab (owner, 2026-10-13): play along with a small band. One question first, Lead or
// Accompaniment; then a beginner step; then, while playing, one instruction, the beat, the chord now and next, the box
// of chords and the keys to use. The band (drums, bass, chords) is a style played over the chart's chords (lab/music.ts);
// melodies are never made up. Content: public/content/lab (charts and styles; docs/app-features.md says how).
// This first version takes chord charts; songs with their own melody (lead sheets, several parts) come next.

import { $, base, type App, type Screen, type KeyRange } from '../app';
import { ExerciseKeys } from '../exercise/keys';
import { barMarks, improvised, judgeHit, ON_TIME_MS, sayHit, type HitResult, type Mark, type Press } from '../lab/judge';
import {
  ACCOMP_STEPS, bandNotes, clickBeats, formOf, hits, LEAD_STEPS, readChart, readStyle, scalePcs, voicing,
  type AccompStep, type Chart, type ChartFile, type Form, type Hit, type LeadStep, type Style, type StyleFile,
} from '../lab/music';
import type { KeyEvent } from '../midi';
import type { Command } from '../remote';
import type { NoteEvent } from '../sound';

export type LabScreen = Screen & { open(): Promise<void>; close(): void; readonly isOpen: boolean; debug(): unknown };

type Role = 'accomp' | 'lead';
interface Stored {
  chart?: string; role: Role;
  step: Record<string, number>; // "chart|role" -> the step chosen
  clean: Record<string, number>; // "chart|role|step" -> clean rounds (accompaniment) or rounds played (lead)
  speed: Record<string, number>; // chart -> share of its tempo
  help: 'lit' | 'names' | 'symbol';
  parts: { drums: boolean; bass: boolean; chords: boolean; click: boolean };
  style: Record<string, string>; // chart -> the style chosen
  dropouts: 'off' | 'drums' | 'band';
}
const KEY = 'piano-web.lab.v1';
const CLEAN_FOR_NEXT = 2; // clean rounds on a step before the next is suggested
const SPEED_STEP = 0.05; // a clean round under the chart's own tempo moves it up this much (as Ladder does)
const ROUNDS = 40; // scheduled ahead; ■ stops it

export function createLabScreen(app: App, closed: () => void): LabScreen {
  const { sound, midi } = app;
  const keys = new ExerciseKeys($('lab-keyboard'), sound);
  let stored = read();
  let charts: Chart[] = [], styles: Style[] = [], loadProblems = '';
  let chart: Chart | null = null, form: Form | null = null, style: Style | null = null;
  let isOpen = false;
  // A run: rounds of the form from t = 0 (after a bar of count-in); round 0 is "Show me" when asked for.
  let running = false, demo = false, ticker = 0, presses: (Press & { round: number })[] = [], roundNow = -1, judged = new Set<string>();
  let gridKey = ''; // what the box of chords last showed (drawn again only when that changes)
  let results: HitResult[] = [], lastRound: { marks: Map<number, Mark>; results: HitResult[]; improv?: ReturnType<typeof improvised> } | null = null;
  let roundsDone = 0, loopBars: [number, number] | null = null, picking: number | null = null;

  const role = () => stored.role;
  const stepKey = () => `${chart?.id}|${role()}`;
  const stepIndex = () => stored.step[stepKey()] ?? 0;
  const accompStep = (): AccompStep => ACCOMP_STEPS[Math.min(stepIndex(), ACCOMP_STEPS.length - 1)].id;
  const leadStep = (): LeadStep => LEAD_STEPS[Math.min(stepIndex(), LEAD_STEPS.length - 1)].id;
  const steps = () => (role() === 'accomp' ? ACCOMP_STEPS : LEAD_STEPS);
  const speed = () => stored.speed[chart?.id ?? ''] ?? 1;
  const bpm = () => Math.round((chart?.tempo ?? 90) * speed());

  async function load(): Promise<void> {
    if (charts.length) return;
    const dir = `${base}content/lab/`;
    const problems: string[] = [];
    try {
      const index = await (await fetch(`${dir}index.json`)).json() as { charts: string[]; styles: string[] };
      for (const f of index.styles) {
        try { styles.push(readStyle(f.replace(/^.*\/|\.json$/g, ''), await (await fetch(dir + f)).json() as StyleFile)); } catch (e) { problems.push(`${f}: ${e instanceof Error ? e.message : e}`); }
      }
      for (const f of index.charts) {
        try { charts.push(readChart(f.replace(/^.*\/|\.json$/g, ''), await (await fetch(dir + f)).json() as ChartFile)); } catch (e) { problems.push(`${f}: ${e instanceof Error ? e.message : e}`); }
      }
    } catch (e) { problems.push(`index.json: ${e instanceof Error ? e.message : e}`); }
    loadProblems = problems.length ? `Some lab content could not be read: ${problems.join('; ')}` : '';
  }

  function choose(id: string): void {
    chart = charts.find((c) => c.id === id) ?? charts[0];
    stored.chart = chart.id;
    save();
    const styleId = stored.style[chart.id] ?? chart.style;
    style = styles.find((s) => s.id === styleId) ?? styles.find((s) => s.id === chart!.style) ?? styles[0];
    loopBars = null;
    rebuildForm();
  }
  function rebuildForm(): void {
    if (!chart) return;
    const c = loopBars ? { ...chart, bars: chart.bars.slice(loopBars[0], loopBars[1] + 1) } : chart;
    form = formOf(c);
    // The keys: whole octaves around the chords' voicings and the improvising range.
    keys.setRange([...form.spans.flatMap((s) => voicing(s.chord)), 48, 84]);
  }

  // ---- the opening ----------------------------------------------------------------------------------------------

  function fillOpen(): void {
    if (!chart || !style) return;
    $('lab-title').textContent = chart.title;
    $('lab-meta').textContent = `${style.name} · ♩ ${bpm()}${speed() !== 1 ? ` (its own: ${chart.tempo})` : ''}${chart.scale ? ` · improvise: ${chart.scale}` : ''}`;
    $('lab-role-lead').classList.toggle('on', role() === 'lead');
    $('lab-role-accomp').classList.toggle('on', role() === 'accomp');
    $('lab-steps').replaceChildren(...steps().map((s, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      const done = (stored.clean[`${stepKey()}|${s.id}`] ?? 0) >= CLEAN_FOR_NEXT;
      b.className = `lab-step${i === stepIndex() ? ' on' : ''}${done ? ' done' : ''}`;
      b.innerHTML = `<i></i><span><b></b> <small></small></span>`;
      b.querySelector('i')!.textContent = done ? '✓' : String(i + 1);
      b.querySelector('b')!.textContent = s.name;
      b.querySelector('small')!.textContent = `— ${s.detail}`;
      b.addEventListener('click', () => { stored.step[stepKey()] = i; save(); fill(); });
      return b;
    }));
    const st = steps()[stepIndex()];
    const band = bandList().join(', ') || 'nothing (you alone, with the click)';
    $('lab-say').innerHTML = '<b></b><span></span>';
    $('lab-say').querySelector('b')!.textContent = `Your part: ${st.doing.charAt(0).toLowerCase()}${st.doing.slice(1)}.`;
    $('lab-say').querySelector('span')!.textContent = ` The band plays ${band}.${role() === 'accomp' && stored.help === 'lit' ? ' The keys to press light up.' : ''}`;
    $('lab-show').hidden = role() === 'lead'; // improvising has no written part to play for you
  }
  function bandList(): string[] {
    const p = stored.parts, out: string[] = [];
    if (p.drums) out.push('drums');
    if (p.bass) out.push('bass');
    if (p.chords && role() === 'lead') out.push('chords');
    return out;
  }

  // ---- the box of chords ----------------------------------------------------------------------------------------

  function fillGrid(marks?: Map<number, Mark>, now = -1): void {
    if (!chart) return;
    const k = `${chart.id}|${now}|${picking}|${loopBars}|${marks ? [...marks].join() : ''}`;
    if (k === gridKey) return;
    gridKey = k;
    const cols = chart.bars.length % 4 === 0 || chart.bars.length < 6 ? 4 : 6;
    $('lab-grid').style.setProperty('--cols', String(Math.min(cols, chart.bars.length)));
    $('lab-grid').replaceChildren(...chart.bars.map((symbols, i) => {
      const d = document.createElement('button');
      d.type = 'button';
      const inLoop = !loopBars || (i >= loopBars[0] && i <= loopBars[1]);
      const m = marks?.get(i - (loopBars?.[0] ?? 0));
      d.className = `lab-bar${inLoop ? '' : ' out'}${m ? ` ${m}` : ''}${i === now ? ' now' : ''}${picking === i ? ' pick' : ''}`;
      d.innerHTML = '<small></small><b></b>';
      d.querySelector('small')!.textContent = String(i + 1);
      d.querySelector('b')!.textContent = symbols.join(' ');
      d.addEventListener('click', () => pickBar(i));
      return d;
    }));
  }
  /** Loop some bars (owner: slow + loop bars): tap the first and last while stopped; tap again to play them all. */
  function pickBar(i: number): void {
    if (running || !chart) return;
    if (loopBars && picking === null) { loopBars = null; rebuildForm(); feedback('Playing every bar'); fill(); return; }
    if (picking === null) { picking = i; feedback(`From bar ${i + 1}: tap the last bar to loop (or the same one)`); fillGrid(); return; }
    loopBars = [Math.min(picking, i), Math.max(picking, i)];
    picking = null;
    rebuildForm();
    feedback(`Looping bars ${loopBars[0] + 1}–${loopBars[1] + 1} · tap a bar to play them all again`);
    fill();
  }

  // ---- playing ----------------------------------------------------------------------------------------------------

  const roundMs = () => (form ? form.length * form.beatMs : 1);
  function events(withDemo: boolean): { notes: NoteEvent[]; beats: { t: number; accent: boolean }[] } {
    const f = form!, s = style!, p = stored.parts;
    const parts = { drums: p.drums, bass: p.bass, chords: p.chords && role() === 'lead' };
    const notes = bandNotes(f, s, parts, ROUNDS);
    // Show me: round 0 also has your part, played for you.
    if (withDemo && role() === 'accomp') notes.push(...bandNotes(f, s, { drums: false, bass: false, chords: false }, 1, accompStep()));
    // Call and answer: the band calls in the first two bars of every four (the chord's notes, up), you answer in the next two.
    if (role() === 'lead' && leadStep() === 'answer') {
      for (let r = 0; r < ROUNDS; r++) for (const sp of f.spans) {
        if (Math.floor(sp.at / f.barBeats) % 4 >= 2) continue;
        const notesUp = voicing(sp.chord, 60);
        for (let k = 0; k < Math.floor(sp.beats * 2); k++) notes.push({ t: r * roundMs() + (sp.at + k / 2) * f.beatMs, midi: notesUp[k % notesUp.length], dur: f.beatMs * 0.45, vel: 85, part: 'piano' });
      }
    }
    // A bar of count-in clicks, then the click on every beat if chosen (the drums keep time too).
    const countIn = Array.from({ length: f.barBeats }, (_, k) => ({ t: (k - f.barBeats) * f.beatMs, accent: k === 0 }));
    return { notes: notes.sort((a, b) => a.t - b.t), beats: [...countIn, ...(p.click || !p.drums ? clickBeats(f, s, ROUNDS) : [])] };
  }

  async function start(withDemo: boolean): Promise<void> {
    if (!form || !style || running) return;
    stopRun();
    feedback('Getting the band ready…');
    const parts = ['piano', ...(stored.parts.drums ? ['drums'] : []), ...(stored.parts.bass ? [style.bassSound] : []), ...(stored.parts.chords && role() === 'lead' ? [style.chordSound] : [])];
    try {
      await midi.start().catch(() => {});
      sound.keyboard = null; // the band plays on the phone
      await Promise.all(parts.map((p) => sound.preparePart(p)));
    } catch (e) {
      feedback(`A sound could not be loaded (${e instanceof Error ? e.message : e}); the band plays without it.`);
    }
    if (!isOpen) return;
    const { notes, beats } = events(withDemo);
    sound.setVolumes(0.8, 0.6);
    sound.mute([]);
    sound.play(notes, beats, -form.barBeats * form.beatMs, speed());
    running = true; demo = withDemo; presses = []; roundNow = -1; judged = new Set(); results = []; roundsDone = 0; lastRound = null;
    $('lab-open').hidden = true;
    $('lab-result').hidden = true;
    $('lab-play').hidden = false;
    $('lab-actions').hidden = true;
    $('lab-stop').hidden = false;
    feedback('');
    clearInterval(ticker);
    ticker = window.setInterval(tick, 30);
    tick();
    app.stayAwake();
  }

  function stopRun(): void {
    clearInterval(ticker);
    if (running) sound.stop();
    sound.mute([]);
    running = false;
    keys.clearMarks();
  }

  /** Where the clock is: the round (0, 1, ...) and the time in it (ms at the chart's tempo; before 0: the count-in). */
  function where(): { round: number; pos: number } {
    const t = sound.songTime();
    if (t < 0) return { round: -1, pos: t };
    const round = Math.floor(t / roundMs());
    return { round, pos: t - round * roundMs() };
  }

  function tick(): void {
    if (!running || !form || !style) return;
    const { round, pos } = where();
    const f = form;
    if (round !== roundNow) {
      if (roundNow >= 0) { judgeHits(roundNow, Infinity); roundEnded(roundNow); } // the round's last chord too
      roundNow = round;
      if (round >= 0) { results = []; judged = new Set(); }
    }
    const yourTurn = !(demo && round === 0);
    // The beat and where you are.
    const beat = pos < 0 ? Math.floor((pos + f.barBeats * f.beatMs) / f.beatMs) : Math.floor(pos / f.beatMs);
    const inBar = ((beat % f.barBeats) + f.barBeats) % f.barBeats;
    $('lab-beat-dots').replaceChildren(...Array.from({ length: f.barBeats }, (_, k) => Object.assign(document.createElement('i'), { textContent: String(k + 1), className: k === inBar ? 'hit' : k < inBar ? 'past' : '' })));
    const bar = pos < 0 ? -1 : Math.floor(beat / f.barBeats);
    const span = pos < 0 ? f.spans[0] : f.spans.find((s) => pos >= s.at * f.beatMs && pos < (s.at + s.beats) * f.beatMs) ?? f.spans[0];
    const si = f.spans.indexOf(span);
    const next = f.spans[(si + 1) % f.spans.length], after = f.spans[(si + 2) % f.spans.length];
    const toNext = Math.max(0, Math.round(((span.at + span.beats) * f.beatMs - Math.max(0, pos)) / f.beatMs));
    $('lab-where').textContent = pos < 0 ? `count-in · ${f.barBeats - inBar}` : `bar ${bar + 1 + (loopBars?.[0] ?? 0)} of ${chart!.bars.length}${round > 0 ? ` · round ${round + 1}` : ''}${!yourTurn ? ' · listen' : ''}`;
    $('lab-now').textContent = pos < 0 ? span.chord.symbol : span.chord.symbol;
    $('lab-next').innerHTML = '';
    $('lab-next').append('next ', Object.assign(document.createElement('b'), { textContent: next.chord.symbol }), document.createElement('br'), toNext <= 2 ? `in ${Math.max(1, toNext)} beat${Math.max(1, toNext) === 1 ? '' : 's'}` : `then ${after.chord.symbol}`);
    // What to do now.
    const st = steps()[stepIndex()];
    const answering = role() === 'lead' && leadStep() === 'answer';
    const callBars = answering && pos >= 0 && Math.floor(bar % 4) < 2;
    $('lab-do').textContent = !yourTurn ? 'Listen: your part, played for you' : answering ? (callBars ? 'Listen: the band calls…' : 'Your answer: two bars') : st.doing;
    // The keys to light.
    const lookAhead = f.beatMs * 0.5; // the next chord shows a half beat early
    const lit = pos < 0 ? f.spans[0] : f.spans.find((s) => pos + lookAhead >= s.at * f.beatMs && pos + lookAhead < (s.at + s.beats) * f.beatMs) ?? span;
    lightKeys(lit.chord, yourTurn);
    // Drop-outs (owner): in the 5th and 6th bar of every 8, the drums (or the band) go quiet from the second round on.
    const soon = Math.floor((pos + 250) / (f.beatMs * f.barBeats));
    const out = stored.dropouts !== 'off' && round >= (demo ? 2 : 1) && (soon % 8 === 4 || soon % 8 === 5);
    sound.mute(out ? (stored.dropouts === 'drums' ? ['drums'] : ['drums', style.bassSound, style.chordSound]) : []);
    $('lab-band-line').textContent = `The band: ${bandList().join(' · ') || 'the click'}${out ? ` · ${stored.dropouts === 'drums' ? 'drums' : 'band'} out: keep going` : ''}`;
    if (yourTurn && round >= 0) judgeHits(round, pos);
    fillGrid(role() === 'accomp' ? barMarks(results) : undefined, pos < 0 ? -1 : bar + (loopBars?.[0] ?? 0));
    if (role() === 'lead' && yourTurn && round >= 0) {
      const im = improvised(f, presses.filter((p) => p.round === round), guideOf);
      if (im.notes) feedback(`This round: ${im.changes ? `landed on the chord ${im.landed} of ${im.changes} changes · ` : ''}${Math.round((im.fromGuide / im.notes) * 100)}% of notes from the lit keys`);
    }
  }

  /** Accompaniment: each hit is judged once its time is past (pos: where the round is; Infinity: it is over). */
  function judgeHits(round: number, pos: number): void {
    if (role() !== 'accomp' || !form || !style || (demo && round === 0)) return;
    for (const h of hits(form, style, accompStep())) {
      const id = `${h.t}`;
      if (judged.has(id) || pos < h.until) continue;
      judged.add(id);
      const r = judgeHit(h, presses.filter((p) => p.round === round), accompStep());
      results.push(r);
      if (r.mark !== 'ok') feedback(sayHit(r, accompStep(), loopBars?.[0] ?? 0));
    }
  }

  /** The keys lit: accompaniment, the chord as the step plays it (help: keys lit); improvising, the step's guide. */
  function lightKeys(c: Hit['chord'], yourTurn: boolean): void {
    const range = Array.from({ length: 49 }, (_, k) => 36 + k);
    if (role() === 'accomp') {
      const on = stored.help === 'lit' || !yourTurn;
      keys.light(on ? (accompStep() === 'roots' ? [voicing(c)[0]] : voicing(c)) : []);
      keys.want([]);
      $('lab-names').textContent = stored.help !== 'symbol' ? `${c.symbol} = ${c.names.join(' ')}` : '';
      return;
    }
    const step = leadStep();
    const scale = scalePcs(chart!.scale);
    const dark = step === 'root' ? [c.root] : step === 'free' ? [] : c.pcs;
    const pale = step === 'scale' || step === 'answer' ? scale.filter((p) => !dark.includes(p)) : [];
    keys.light(range.filter((m) => (step === 'root' ? m >= 60 && m < 72 : true) && dark.includes(m % 12)));
    keys.mark('next-r', range.filter((m) => pale.includes(m % 12)));
    $('lab-names').textContent = step === 'free' ? '' : step === 'root' ? `${c.symbol}: root ${c.rootName}` : `${c.symbol} = ${c.names.join(' ')}${pale.length ? ` · ${chart!.scale}` : ''}`;
  }
  /** Improvising: the notes the step lights for a chord (counted as "from the lit keys"). */
  function guideOf(chordPcs: number[]): number[] {
    const step = leadStep();
    if (step === 'root') return chordPcs.slice(0, 1);
    if (step === 'tones') return chordPcs;
    return [...chordPcs, ...scalePcs(chart!.scale)];
  }

  function roundEnded(r: number): void {
    if (demo && r === 0) return; // Show me: nothing of yours to judge
    roundsDone++;
    const key = `${stepKey()}|${role() === 'accomp' ? accompStep() : leadStep()}`;
    if (role() === 'accomp') {
      const marks = barMarks(results);
      lastRound = { marks, results: [...results] };
      const clean = form!.chart.bars.every((_, i) => marks.get(i) === 'ok');
      if (clean) {
        stored.clean[key] = (stored.clean[key] ?? 0) + 1;
        // Slow + loop (owner): a clean round under the chart's own tempo goes up a step.
        if (speed() < 1) { stored.speed[chart!.id] = Math.min(1, Math.round((speed() + SPEED_STEP) * 100) / 100); sound.setSpeed(speed()); feedback(`Clean round: up to ♩ ${bpm()}`); }
      }
      save();
    } else {
      lastRound = { marks: new Map(), results: [], improv: improvised(form!, presses.filter((p) => p.round === r), guideOf) };
      stored.clean[key] = (stored.clean[key] ?? 0) + 1;
      save();
    }
    fillBottom();
  }

  /** ■: the run ends and how it went shows (the round in progress counts if you played most of it). */
  function stop(): void {
    if (!running) return;
    const { round, pos } = where();
    if (round >= 0 && !(demo && round === 0) && pos > roundMs() * 0.6) roundEnded(round);
    stopRun();
    showResult();
    app.stayAwake();
  }

  function showResult(): void {
    feedback('');
    $('lab-play').hidden = true;
    $('lab-stop').hidden = true;
    $('lab-result').hidden = false;
    $('lab-actions').hidden = true;
    const box = $('lab-result');
    box.replaceChildren();
    const add = (cls: string, text: string) => box.append(Object.assign(document.createElement('div'), { className: cls, textContent: text }));
    const st = steps()[stepIndex()];
    const key = `${stepKey()}|${st.id}`;
    if (!lastRound) { add('lab-r-head', 'Not a whole round yet'); fillGrid(); }
    else if (role() === 'accomp') {
      const m = lastRound.marks, n = loopBars ? loopBars[1] - loopBars[0] + 1 : chart!.bars.length;
      const right = [...m.values()].filter((x) => x !== 'miss').length, onBeat = [...m.values()].filter((x) => x === 'ok').length;
      add('lab-r-head', `${right} of ${n} bars right · ${onBeat} on the beat${roundsDone > 1 ? ` (last of ${roundsDone} rounds)` : ''}`);
      for (const r of lastRound.results.filter((x) => x.mark !== 'ok').slice(0, 3)) add('lab-r-line', sayHit(r, accompStep(), loopBars?.[0] ?? 0));
      fillGrid(m);
    } else {
      const im = lastRound.improv!;
      add('lab-r-head', `${roundsDone} round${roundsDone === 1 ? '' : 's'} played`);
      add('lab-r-line', im.notes ? `Last round: ${im.notes} notes, ${Math.round((im.fromGuide / im.notes) * 100)}% from the lit keys${im.changes ? `; landed on the chord ${im.landed} of ${im.changes} times it changed` : ''}.` : 'Last round: no notes played.');
      add('lab-r-line', 'Improvising is not marked: this is just how it went.');
      fillGrid();
    }
    // What next: the next step after enough clean rounds (or rounds played, improvising).
    const done = (stored.clean[key] ?? 0) >= CLEAN_FOR_NEXT, i = stepIndex();
    const buttons = document.createElement('div');
    buttons.className = 'lab-r-buttons';
    const btn = (text: string, main: boolean, run: () => void) => { const b = Object.assign(document.createElement('button'), { type: 'button', className: `btn${main ? ' main' : ''}`, textContent: text }); b.addEventListener('click', run); buttons.append(b); };
    if (done && i + 1 < steps().length) {
      add('lab-r-next', `Next: step ${i + 2}, ${steps()[i + 1].name.toLowerCase()} · ${role() === 'accomp' ? `${CLEAN_FOR_NEXT} clean rounds` : `${CLEAN_FOR_NEXT} rounds`} on this one`);
      btn(`Step ${i + 2} ▶`, true, () => { stored.step[stepKey()] = i + 1; save(); void start(false); });
    }
    btn('Again ▶', !(done && i + 1 < steps().length), () => void start(false));
    const worst = lastRound?.results.find((r) => r.mark === 'miss');
    if (worst && !loopBars) btn(`Loop bars ${worst.hit.bar + 1}–${Math.min(chart!.bars.length, worst.hit.bar + 2)}`, false, () => { loopBars = [worst.hit.bar, Math.min(chart!.bars.length - 1, worst.hit.bar + 1)]; rebuildForm(); backToOpen(); });
    btn(role() === 'accomp' ? 'Try the lead' : 'Try the accompaniment', false, () => { stored.role = role() === 'accomp' ? 'lead' : 'accomp'; save(); backToOpen(); });
    btn('Back', false, backToOpen);
    box.append(buttons);
  }

  function backToOpen(): void {
    stopRun();
    $('lab-play').hidden = true;
    $('lab-result').hidden = true;
    $('lab-open').hidden = false;
    $('lab-actions').hidden = false;
    $('lab-stop').hidden = true;
    fill();
  }

  // ---- the bottom row: tempo and help --------------------------------------------------------------------------

  function fillBottom(): void {
    $<HTMLOutputElement>('lab-bpm').value = `♩ ${bpm()}`;
    $<HTMLSelectElement>('lab-help').value = stored.help;
    $('lab-help').hidden = role() !== 'accomp';
  }
  const setSpeed = (s: number) => {
    if (!chart) return;
    stored.speed[chart.id] = Math.max(0.4, Math.min(1.5, Math.round(s * 100) / 100));
    save();
    if (running) sound.setSpeed(speed());
    fillBottom();
    if (!running) fillOpen();
  };
  $('lab-slower').addEventListener('click', () => setSpeed(speed() - SPEED_STEP));
  $('lab-faster').addEventListener('click', () => setSpeed(speed() + SPEED_STEP));
  $<HTMLSelectElement>('lab-help').addEventListener('change', (e) => { stored.help = (e.target as HTMLSelectElement).value as Stored['help']; save(); fill(); });

  function feedback(text: string): void { $('lab-feedback').textContent = text; }
  function fill(): void { fillOpen(); fillGrid(lastRound && !running ? lastRound.marks : undefined); fillBottom(); $('lab-band-line').textContent = `The band: ${bandList().join(' · ') || 'the click'}`; }

  // ---- the controls ------------------------------------------------------------------------------------------------

  $('lab-role-lead').addEventListener('click', () => { stored.role = 'lead'; save(); fill(); });
  $('lab-role-accomp').addEventListener('click', () => { stored.role = 'accomp'; save(); fill(); });
  $('lab-start').addEventListener('click', () => void start(false));
  $('lab-show').addEventListener('click', () => void start(true));
  $('lab-stop').addEventListener('click', stop);
  $('lab-done').addEventListener('click', () => close());
  // The chart: a list of what the lab has.
  const pickDialog = $<HTMLDialogElement>('lab-pick-dialog');
  $('lab-change').addEventListener('click', () => {
    $('lab-pick-list').replaceChildren(...charts.map((c) => {
      const b = Object.assign(document.createElement('button'), { type: 'button', className: c.id === chart?.id ? 'current' : '' });
      b.innerHTML = '<strong></strong><small></small>';
      b.querySelector('strong')!.textContent = c.title;
      b.querySelector('small')!.textContent = `${c.bars.length} bars · ${c.meter.beats}/${c.meter.beatType} · ♩ ${c.tempo}`;
      b.addEventListener('click', () => { pickDialog.close(); choose(c.id); lastRound = null; fill(); });
      const li = document.createElement('li');
      li.append(b);
      return li;
    }));
    pickDialog.showModal();
  });
  // ⚙ The band: which parts play, the click, the style, drop-outs.
  const bandDialog = $<HTMLDialogElement>('lab-band-dialog');
  function fillBand(): void {
    const p = stored.parts;
    $<HTMLInputElement>('lab-p-drums').checked = p.drums;
    $<HTMLInputElement>('lab-p-bass').checked = p.bass;
    $<HTMLInputElement>('lab-p-chords').checked = p.chords;
    $<HTMLInputElement>('lab-p-click').checked = p.click;
    $('lab-p-chords-label').hidden = role() === 'accomp';
    $('lab-styles').replaceChildren(...styles.map((s) => {
      const l = document.createElement('label');
      l.append(Object.assign(document.createElement('input'), { type: 'radio', name: 'lab-style', value: s.id, checked: s.id === style?.id }), ` ${s.name}`);
      return l;
    }));
    for (const r of bandDialog.querySelectorAll<HTMLInputElement>('input[name="lab-dropouts"]')) r.checked = r.value === stored.dropouts;
  }
  $('lab-band').addEventListener('click', () => { if (running) stop(); fillBand(); bandDialog.showModal(); });
  bandDialog.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.name === 'lab-style' && chart) { stored.style[chart.id] = t.value; style = styles.find((s) => s.id === t.value) ?? style; }
    else if (t.name === 'lab-dropouts') stored.dropouts = t.value as Stored['dropouts'];
    else if (t.id.startsWith('lab-p-')) stored.parts = { ...stored.parts, [t.id.slice(6)]: t.checked };
    save();
    fill();
  });

  // Keys: from the MIDI keyboard and the screen's keys, timed on the band's clock.
  keys.onKey = (m, on) => {
    if (!on || !running) return;
    const { round, pos } = where();
    // A shade before the next round (or the count-in's end) is the next round's first chord, played a little early.
    if (pos > roundMs() - ON_TIME_MS || round < 0) presses.push({ midi: m, t: pos - (round < 0 ? 0 : roundMs()), round: round + 1 });
    else presses.push({ midi: m, t: pos, round });
  };

  async function open(): Promise<void> {
    await load();
    if (!charts.length || !styles.length) { app.showMessage(loadProblems || 'The lab has no charts or styles to play.'); return; }
    isOpen = true;
    $('lab').hidden = false;
    choose(stored.chart ?? charts[0].id);
    backToOpen();
    feedback(loadProblems);
    app.stayAwake();
  }
  function close(): void {
    stopRun();
    isOpen = false;
    keys.release();
    $('lab').hidden = true;
    app.stayAwake();
    closed();
  }

  function read(): Stored {
    const empty: Stored = { role: 'accomp', step: {}, clean: {}, speed: {}, help: 'lit', parts: { drums: true, bass: true, chords: true, click: false }, style: {}, dropouts: 'off' };
    try { const s = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Stored>; return { ...empty, ...s, parts: { ...empty.parts, ...s.parts } }; } catch { return empty; }
  }
  function save(): void { try { localStorage.setItem(KEY, JSON.stringify(stored)); } catch { /* this visit only */ } }

  return {
    open,
    close,
    get isOpen() { return isOpen; },
    key: (e: KeyEvent) => keys.midiKey(e.midi, e.on, midi.down),
    // The keyboard remote: a mash stops; the highest key starts (or Again); the lowest goes back to the opening.
    command(c: Command): void {
      if (c === 'mash') { if (running) { stop(); feedback('Stopped by a mash'); } }
      else if (c === 'high') { if (!running) void start(false); }
      else if (c === 'low') { if (running) stop(); else backToOpen(); }
    },
    musicRange: (): KeyRange | null => keys.span,
    resized: () => {},
    get busy() { return isOpen; },
    debug: () => ({ running, demo, role: role(), step: role() === 'accomp' ? accompStep() : leadStep(), where: where(), results: results.map((r) => ({ bar: r.hit.bar, mark: r.mark, t: r.hit.t, until: r.hit.until, chord: r.hit.chord.symbol, pcs: r.hit.chord.pcs })), hits: form && style ? hits(form, style, accompStep()).map((h) => ({ t: h.t, until: h.until, bar: h.bar, voicing: voicing(h.chord), root: voicing(h.chord)[0] })) : [], beatMs: form?.beatMs, roundMs: roundMs(), speed: speed(), lastRound: lastRound ? { marks: [...lastRound.marks], improv: lastRound.improv } : null }),
  };
}

