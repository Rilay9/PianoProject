// The accompaniment lab (owner, 2026-10-13): play along with a small band. One question first, Lead or
// Accompaniment; then a beginner step; then, while playing, one instruction, the beat, the chord now and next, the box
// of chords and the keys to use. The band (drums, bass, chords) is a style played over the chart's chords (lab/music.ts);
// melodies are never made up. Content: public/content/lab (charts and styles; docs/app-features.md says how).
// This first version takes chord charts; songs with their own melody (lead sheets, several parts) come next.

import { touch } from '../library/store';
import type { LabPreset } from '../activity';
import { $, base, type App, type Screen, type KeyRange } from '../app';
import { holds } from '../holds';
import { addEntry, keyName as logKey, Run, setActivity, type Slip } from '../log';
import { ExerciseKeys } from '../exercise/keys';
import { barMarks, improvised, judgeHit, ON_TIME_MS, sayHit, type HitResult, type Improv, type Mark, type Press } from '../lab/judge';
import {
  ACCOMP_STEPS, bandNotes, clickBeats, formOf, hits, LEAD_STEPS, readChart, readLadder, readStyle, scalePcs, voicing,
  type AccompStep, type Chart, type ChartFile, type Form, type Hit, type LeadStep, type Style, type StyleFile,
} from '../lab/music';
import type { KeyEvent } from '../midi';
import type { Command } from '../remote';
import { currentDevice } from '../settings';
import type { NoteEvent } from '../sound';

/** open(…, activity): a chart with an activity's preset (activity.ts), in force until another chart is picked or Done. */
export type LabScreen = Screen & { open(stillWanted?: () => boolean, activity?: { chart: string; preset: LabPreset; title?: string }, chartId?: string): Promise<void>; close(): void; readonly isOpen: boolean; debug(): unknown };

type Role = 'accomp' | 'lead';
interface Stored {
  chart?: string; role: Role;
  step: Record<string, number>; // "chart|role" -> the step chosen
  clean: Record<string, number>; // "chart|role|step" -> clean rounds (accompaniment) or rounds played (lead)
  speed: Record<string, number>; // chart -> share of its tempo
  help: 'lit' | 'names' | 'symbol';
  parts: { drums: boolean; bass: boolean; chords: boolean; click: boolean };
  dropouts: 'off' | 'drums' | 'band';
}
const KEY = 'piano-web.lab.v1';
const CLEAN_FOR_NEXT = 2; // clean rounds on a step before the next is suggested (a chart or activity may say otherwise)
const SPEED_STEP = 0.05; // a clean round under the chart's own tempo moves it up this much (as Ladder does)
const ROUNDS = 40; // scheduled ahead; the run stops by itself after them (■ any time before)
const sameMeter = (s: Style, c: Chart) => s.meter.beats === c.meter.beats && s.meter.beatType === c.meter.beatType;
const LEAD_KEYS: [number, number] = [60, 83]; // improvising: C4 to B5 (two octaves the right hand plays over the band)

export function createLabScreen(app: App, closed: () => void): LabScreen {
  const { sound, midi } = app;
  const keys = new ExerciseKeys($('lab-keyboard'), sound);
  let stored = read();
  let charts: Chart[] = [], styles: Style[] = [], loadProblems = '';
  let chart: Chart | null = null, form: Form | null = null, style: Style | null = null;
  let isOpen = false;
  // A run: rounds of the form from t = 0 (after a bar of count-in); round 0 is "Show me" when asked for.
  // session: each start, stop or change of what is chosen makes a new one, so a start still getting the band ready
  // when something else happens never goes on to play.
  let running = false, starting = false, session = 0, demo = false, ticker = 0, roundNow = -1, judged = new Set<string>();
  // A press: its round, and when it went down (performance.now()) to ask how long it sounded (holds.ts).
  let presses: (Press & { round: number; at: number })[] = [], held = new Map<number, Press & { round: number; at: number }>();
  let unavailable: string[] = []; // band parts whose sounds could not be loaded this run
  let gridKey = ''; // what the box of chords last showed (drawn again only when that changes)
  // The last round's result, with what it was a result of (ctx) and, when ■ came in the middle of it, the bar it stopped in.
  let results: HitResult[] = [], lastRound: { ctx: string; marks: Map<number, Mark>; results: HitResult[]; improv?: Improv; stoppedBar?: number } | null = null;
  let roundsDone = 0, roundsPlayed = 0, loopBars: [number, number] | null = null, picking: number | null = null;

  // An activity's preset (owner, 2026-10-13): its choices in force while it lasts (changed there if you change them),
  // never saved over yours; its ladder and style are content. Over when another chart is picked, or on Done.
  let preset: LabPreset | null = null;
  const role = () => preset?.role ?? stored.role;
  const setRole = (r: Role) => { if (preset?.role !== undefined) preset.role = r; else { stored.role = r; save(); } };
  const stepKey = () => `${chart?.id}|${role()}`;
  /** The ladder: the activity's, the chart's, or the built-in one. */
  const steps = () => {
    const mine = role() === 'accomp' ? preset?.steps?.accompaniment : preset?.steps?.lead;
    if (mine) return readLadder(mine, role());
    return (role() === 'accomp' ? chart?.ladder.accomp : chart?.ladder.lead) ?? (role() === 'accomp' ? ACCOMP_STEPS : LEAD_STEPS);
  };
  const stepIndex = () => {
    const list = steps(), want = preset?.step !== undefined ? list.findIndex((s) => s.id === preset!.step) : -1;
    return want >= 0 ? want : Math.min(stored.step[stepKey()] ?? 0, list.length - 1);
  };
  const setStep = (i: number) => {
    const list = steps();
    if (preset?.step !== undefined && list.some((s) => s.id === preset!.step)) preset.step = list[i].id;
    else { stored.step[stepKey()] = i; save(); }
  };
  const stepNow = () => steps()[stepIndex()];
  const accompStep = (): AccompStep => (role() === 'accomp' ? stepNow().id as AccompStep : 'roots');
  const leadStep = (): LeadStep => (role() === 'lead' ? stepNow().id as LeadStep : 'root');
  const cleanForNext = () => preset?.cleanForNext ?? chart?.cleanForNext ?? CLEAN_FOR_NEXT;
  const parts = () => ({ ...stored.parts, ...preset?.parts });
  const dropouts = () => preset?.dropouts ?? stored.dropouts;
  const speed = () => stored.speed[chart?.id ?? ''] ?? 1;
  const bpm = () => Math.round((chart?.tempo ?? 90) * speed());
  const tol = () => ON_TIME_MS * speed(); // the on-time window in the chart's time (the same real time at any speed)
  /** What a result belongs to: the chart, the part, the step and the bars looped. */
  const ctx = () => `${chart?.id}|${role()}|${stepIndex()}|${loopBars}`;

  async function load(): Promise<void> {
    if (charts.length) return;
    charts = []; styles = []; // (a load where every chart failed is tried again from nothing)
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
    // A chart is played in its style (content: owner, 2026-10-13), which must be there and in its metre; a chart
    // naming none plays the first style in its metre. One that cannot be played is left out with the reason.
    charts = charts.filter((c) => {
      if (c.style ? styles.some((s) => s.id === c.style && sameMeter(s, c)) : styles.some((s) => sameMeter(s, c))) return true;
      problems.push(c.style ? `${c.title}: no style "${c.style}" in ${c.meter.beats}/${c.meter.beatType}` : `${c.title}: no style in ${c.meter.beats}/${c.meter.beatType}`);
      return false;
    });
    loadProblems = problems.length ? `Some lab content could not be read: ${problems.join('; ')}` : '';
  }

  /** remember: the chart you chose (not an activity's), opened next time. The style is the activity's or the chart's. */
  function choose(id: string, remember = true): void {
    chart = charts.find((c) => c.id === id) ?? charts[0];
    if (remember) { stored.chart = chart.id; save(); touch(`chart:${chart.id}`); } // (the library's Recently opened)
    const fits = styles.filter((s) => sameMeter(s, chart!));
    style = fits.find((s) => s.id === (preset?.style ?? chart!.style)) ?? fits[0];
    loopBars = null;
    picking = null;
    rebuildForm();
  }
  function rebuildForm(): void {
    if (!chart) return;
    const c = loopBars ? { ...chart, bars: chart.bars.slice(loopBars[0], loopBars[1] + 1) } : chart;
    form = formOf(c);
    // The keys: the chords' voicings (accompaniment) or the improvising range, in whole octaves; only these are the
    // music's, so the keyboard's edge keys outside them stay the remote's.
    keys.setRange(role() === 'accomp' ? form.spans.flatMap((s) => voicing(s.chord)) : LEAD_KEYS);
  }
  /** Something chosen changed while the band was getting ready: that start is dropped. */
  function cancelStart(): void { if (starting) { stopRun(); feedback(''); } }

  // ---- the opening ----------------------------------------------------------------------------------------------

  function fillOpen(): void {
    if (!chart || !style) return;
    $('lab-title').textContent = chart.title;
    $('lab-meta').textContent = `${style.name} · ♩ ${bpm()}${speed() !== 1 ? ` (its own: ${chart.tempo})` : ''}${chart.scale ? ` · improvise: ${chart.scale}` : ''}`;
    $('lab-role-lead').classList.toggle('on', role() === 'lead');
    $('lab-role-accomp').classList.toggle('on', role() === 'accomp');
    $('lab-role-lead').setAttribute('aria-pressed', String(role() === 'lead'));
    $('lab-role-accomp').setAttribute('aria-pressed', String(role() === 'accomp'));
    $('lab-steps').replaceChildren(...steps().map((s, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      const done = (stored.clean[`${stepKey()}|${s.id}`] ?? 0) >= cleanForNext();
      b.className = `lab-step${i === stepIndex() ? ' on' : ''}${done ? ' done' : ''}`;
      if (i === stepIndex()) b.setAttribute('aria-current', 'step');
      b.innerHTML = `<i></i><span><b></b> <small></small></span>`;
      b.querySelector('i')!.textContent = done ? '✓' : String(i + 1);
      b.querySelector('b')!.textContent = s.name;
      b.querySelector('small')!.textContent = `— ${s.detail}`;
      b.addEventListener('click', () => { cancelStart(); setStep(i); fill(); });
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
    const p = parts(), out: string[] = [];
    if (p.drums) out.push('drums');
    if (p.bass) out.push('bass');
    if (p.chords && role() === 'lead') out.push('chords');
    return out;
  }
  /** The band line: who plays, and any part whose sound could not be loaded. */
  function bandLine(extra = ''): string {
    const missing = unavailable.map((p) => (p === 'drums' ? 'drums' : p === style?.bassSound ? 'bass' : p === style?.chordSound ? 'chords' : p));
    return `The band: ${bandList().join(' · ') || 'the click'}${extra}${missing.length ? ` · could not load: ${missing.join(', ')} (playing without)` : ''}`;
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
    cancelStart();
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
    const f = form!, s = style!, p = parts();
    const playing = { drums: p.drums, bass: p.bass, chords: p.chords && role() === 'lead' };
    // Drop-outs (owner): the drums (or the band) leave out their notes in the 5th and 6th bar of every 8 of the form,
    // from the second round on (the third after Show me); written into the band's notes, so they go exactly at the bars.
    const outParts = dropouts() === 'off' ? [] : dropouts() === 'drums' ? ['drums'] : ['drums', s.bassSound, s.chordSound];
    const notes = bandNotes(f, s, playing, ROUNDS).filter((n) => !(outParts.includes(n.part ?? '') && droppedAt(n.t, withDemo)));
    // Show me: round 0 also has your part, played for you.
    if (withDemo && role() === 'accomp') notes.push(...bandNotes(f, s, { drums: false, bass: false, chords: false }, 1, accompStep()));
    // Call and answer: the band calls in the first two of every four bars played (the chord's notes, up), you answer in
    // the next two; counted through the rounds, so a loop of one or two bars takes turns too.
    if (role() === 'lead' && leadStep() === 'answer') {
      for (let r = 0; r < ROUNDS; r++) for (const sp of f.spans) {
        if (!calling(r, Math.floor(sp.at / f.barBeats + 1e-9))) continue;
        const notesUp = voicing(sp.chord, 60);
        for (let k = 0; k < Math.floor(sp.beats * 2); k++) notes.push({ t: r * roundMs() + (sp.at + k / 2) * f.beatMs, midi: notesUp[k % notesUp.length], dur: f.beatMs * 0.45, vel: 85, part: 'piano' });
      }
    }
    // A bar of count-in clicks, then the click on every beat if chosen (the drums keep time too).
    const countIn = Array.from({ length: f.barBeats }, (_, k) => ({ t: (k - f.barBeats) * f.beatMs, accent: k === 0 }));
    return { notes: notes.sort((a, b) => a.t - b.t), beats: [...countIn, ...(p.click || !p.drums ? clickBeats(f, s, ROUNDS) : [])] };
  }

  /** Whether a moment of the run (ms from its start) is in a drop-out. */
  function droppedAt(t: number, withDemo: boolean): boolean {
    if (dropouts() === 'off' || !form || t < 0) return false;
    const r = Math.floor(t / roundMs()), bar = Math.floor((t - r * roundMs()) / (form.barBeats * form.beatMs) + 1e-9) % 8;
    return r >= (withDemo ? 2 : 1) && (bar === 4 || bar === 5);
  }
  /** Call and answer: whether a bar of a round is the band's call (the first two of every four bars played). */
  const calling = (round: number, bar: number) => (round * form!.chart.bars.length + bar) % 4 < 2;

  async function start(withDemo: boolean): Promise<void> {
    if (!form || !style || running || starting) return;
    stopRun();
    const mine = ++session;
    starting = true;
    startButtons();
    feedback('Getting the band ready…');
    const p = parts(), sounds = ['piano', ...(p.drums ? ['drums'] : []), ...(p.bass ? [style.bassSound] : []), ...(p.chords && role() === 'lead' ? [style.chordSound] : [])];
    await midi.start().catch(() => {});
    sound.keyboard = null; // the band plays on the phone
    // Each sound loads on its own: one that fails leaves the others to finish before the band starts.
    const loaded = await Promise.allSettled(sounds.map((s) => sound.preparePart(s)));
    if (mine !== session || !isOpen) return; // stopped, closed or changed while it got ready
    starting = false;
    unavailable = sounds.filter((_, i) => loaded[i].status === 'rejected');
    const { notes, beats } = events(withDemo);
    app.appSound();
    sound.mute([]);
    sound.play(notes, beats, -form.barBeats * form.beatMs, speed());
    running = true; demo = withDemo; presses = []; held = new Map(); roundNow = -1; judged = new Set(); results = []; roundsDone = 0; roundsPlayed = 0; lastRound = null;
    logRun = { run: new Run(), rounds: [] };
    startButtons();
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
    session++;
    starting = false;
    clearInterval(ticker);
    if (running) sound.stop();
    sound.mute([]);
    running = false;
    keys.clearMarks();
    startButtons();
  }
  function startButtons(): void {
    $<HTMLButtonElement>('lab-start').disabled = starting;
    $<HTMLButtonElement>('lab-show').disabled = starting;
    $('lab').classList.toggle('stopped', !running); // (sideways the keys make room for the opening while stopped: style.css)
  }

  /** Where the clock is (or was at song time t): the round (0, 1, ...) and the time in it (ms at the chart's tempo; before 0: the count-in). */
  function where(t = sound.songTime()): { round: number; pos: number } {
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
    if (round >= ROUNDS) { stop(); feedback(`The band stopped after ${ROUNDS} rounds`); return; } // the notes scheduled ran out
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
    // The chord now and the next two (docs §5b); close to the change, how many beats to it as well.
    const soon = toNext <= 2 ? `in ${Math.max(1, toNext)} beat${Math.max(1, toNext) === 1 ? '' : 's'} · ` : '';
    $('lab-next').append('next ', Object.assign(document.createElement('b'), { textContent: next.chord.symbol }), document.createElement('br'), `${soon}then ${after.chord.symbol}`);
    // What to do now.
    const st = steps()[stepIndex()];
    const answering = role() === 'lead' && leadStep() === 'answer';
    const callBars = answering && pos >= 0 && calling(round, bar);
    $('lab-do').textContent = !yourTurn ? 'Listen: your part, played for you' : answering ? (callBars ? 'Listen: the band calls…' : 'Your answer: two bars') : st.doing;
    // The keys to light.
    const lookAhead = f.beatMs * 0.5; // the next chord shows a half beat early
    const lit = pos < 0 ? f.spans[0] : f.spans.find((s) => pos + lookAhead >= s.at * f.beatMs && pos + lookAhead < (s.at + s.beats) * f.beatMs) ?? span;
    lightKeys(lit.chord, yourTurn);
    // Drop-outs: the notes are left out already (events); this says so.
    const out = droppedAt(sound.songTime(), demo);
    $('lab-band-line').textContent = bandLine(out ? ` · ${dropouts() === 'drums' ? 'drums' : 'band'} out: keep going` : '');
    if (yourTurn && round >= 0) judgeHits(round, pos);
    fillGrid(role() === 'accomp' ? barMarks(results) : undefined, pos < 0 ? -1 : bar + (loopBars?.[0] ?? 0));
    // The bar you are in: its line fills as the bar goes (the mockup's).
    const nowBar = $('lab-grid').querySelector<HTMLElement>('.lab-bar.now');
    if (nowBar) nowBar.style.setProperty('--p', String(pos < 0 ? 0 : (pos / (f.barBeats * f.beatMs)) % 1));
    if (role() === 'lead' && yourTurn && round >= 0) {
      const im = improvised(f, presses.filter((p) => p.round === round), guideOf, tol(), pos);
      if (im.notes) feedback(`This round: ${im.changes ? `on the chord at ${im.landed} of ${im.changes} changes · ` : ''}${Math.round((im.fromGuide / im.notes) * 100)}% ${guideWords()}`);
    }
  }

  /** Accompaniment: each hit is judged once its time is past (pos: where the round is; Infinity: it is over). */
  function judgeHits(round: number, pos: number): void {
    if (role() !== 'accomp' || !form || !style || (demo && round === 0)) return;
    for (const h of hits(form, style, accompStep())) {
      const id = `${h.t}`;
      if (judged.has(id) || pos < h.until) continue;
      judged.add(id);
      // How long each sounded, in the chart's time (still sounding: not known yet, so not held against it).
      const mine = presses.filter((p) => p.round === round).map((p) => {
        const ms = holds.heldFor(p.midi, p.at);
        return ms === Infinity ? p : { ...p, end: p.t + ms * speed() };
      });
      const r = judgeHit(h, mine, accompStep(), tol());
      results.push(r);
      if (r.mark !== 'ok') feedback(sayHit(r, accompStep(), loopBars?.[0] ?? 0));
    }
  }

  /** The keys lit: accompaniment, the chord as the step plays it (help: keys lit); improvising, the step's guide. */
  function lightKeys(c: Hit['chord'], yourTurn: boolean): void {
    const range = Array.from({ length: LEAD_KEYS[1] - LEAD_KEYS[0] + 1 }, (_, k) => LEAD_KEYS[0] + k);
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
  /** Improvising: the notes the step lights for a chord (counted as "from the lit keys"); Free lights none, and counts the chord's and the scale's. */
  function guideOf(chordPcs: number[]): number[] {
    const step = leadStep();
    if (step === 'root') return chordPcs.slice(0, 1);
    if (step === 'tones') return chordPcs;
    return [...chordPcs, ...scalePcs(chart!.scale)];
  }
  const guideWords = () => (leadStep() === 'free' ? `of notes in the chord${chart?.scale ? ' or the scale' : ''}` : 'of notes from the lit keys');

  /**
   * A round is over (stoppedAt: ■ came this far into it). Only a whole round counts toward a step's ✓, and only over
   * every bar (a loop is practice); a stopped one shows what was played of it. Improvising counts a round as played
   * when you played in at least half its bars (listening alone is not playing it).
   */
  // ---- the practice log (log.ts; owner, 2026-10-13): one entry per run, Start to ■ ----------------------------------
  let logRun: { run: Run; rounds: Record<string, unknown>[] } | null = null;
  /** A round in the log: its bars' marks (accompaniment) or how it went (lead), and each slip (bar, chord, what). */
  function logRound(r: number, stoppedBar: number | undefined, improv?: Improv): void {
    if (!logRun || logRun.rounds.length >= 200) return;
    const off = loopBars?.[0] ?? 0, step = role() === 'accomp' ? accompStep() : leadStep();
    if (improv) { logRun.rounds.push({ round: r + 1, step, ...(stoppedBar !== undefined ? { stoppedInBar: stoppedBar + 1 + off } : {}), notes: improv.notes, fromGuide: improv.fromGuide, barsPlayedIn: improv.bars, changes: improv.changes, playedAtChanges: improv.playedAt, landedOnChord: improv.landed }); return; }
    const marks = barMarks(results);
    logRun.rounds.push({ round: r + 1, step, ...(stoppedBar !== undefined ? { stoppedInBar: stoppedBar + 1 + off } : {}), bars: [...marks].sort((a, b) => a[0] - b[0]).map(([bar, m]) => `${bar + 1 + off}:${m}`).join(' ') });
    for (const x of results) {
      if (x.mark === 'ok') continue;
      const what: Slip['what'] = x.wrong.length ? 'wrong key' : x.short ? 'let go early' : x.mark === 'late' ? 'late' : 'missed';
      const detail = x.wrong.length ? ` ${x.wrong.map(logKey).join(' ')}` : x.missing.length ? ` needs ${x.missing.map((p) => x.hit.chord.names[x.hit.chord.pcs.indexOf(p)]).join(' ')}` : x.apart ? ' (notes apart)' : '';
      logRun.run.slip({ bar: x.hit.bar + 1 + off, note: `${x.hit.chord.symbol}${detail}`, what });
    }
  }
  function endLog(): void {
    const l = logRun;
    logRun = null;
    if (!l || !l.rounds.length || !chart) return;
    addEntry({
      at: l.run.at, seconds: l.run.seconds, screen: 'lab', chart: chart.id, title: chart.title,
      ...(loopBars ? { bars: `${loopBars[0] + 1}-${loopBars[1] + 1}` } : {}),
      settings: { role: role(), step: role() === 'accomp' ? accompStep() : leadStep(), style: style?.id ?? '', bpm: bpm(), help: stored.help, dropouts: dropouts() },
      result: { rounds: l.rounds, wholeRounds: roundsDone, ...(role() === 'lead' ? { roundsPlayed } : {}), slips: l.run.slips, slipCount: l.run.slipCount },
    });
  }

  function roundEnded(r: number, stoppedAt = Infinity): void {
    if (demo && r === 0) return; // Show me: nothing of yours to judge
    const f = form!, stopped = stoppedAt !== Infinity, stoppedBar = stopped ? Math.floor(stoppedAt / (f.barBeats * f.beatMs)) : undefined;
    const key = `${stepKey()}|${role() === 'accomp' ? accompStep() : leadStep()}`;
    if (role() === 'accomp') {
      if (stopped && !results.length) return; // stopped before anything was due: the last whole round stays the result
      const marks = barMarks(results);
      lastRound = { ctx: ctx(), marks, results: [...results], stoppedBar };
      logRound(r, stoppedBar);
      if (stopped) return;
      roundsDone++;
      if (f.chart.bars.every((_, i) => marks.get(i) === 'ok')) {
        if (!loopBars) stored.clean[key] = (stored.clean[key] ?? 0) + 1;
        // Slow + loop (owner): a clean round under the chart's own tempo goes up a step.
        if (speed() < 1) { stored.speed[chart!.id] = Math.min(1, Math.round((speed() + SPEED_STEP) * 100) / 100); sound.setSpeed(speed()); feedback(`Clean round: up to ♩ ${bpm()}`); }
      }
    } else {
      if (stopped && stoppedAt < f.barBeats * f.beatMs) return; // not a bar of it yet
      const improv = improvised(f, presses.filter((p) => p.round === r), guideOf, tol(), stoppedAt);
      lastRound = { ctx: ctx(), marks: new Map(), results: [], improv, stoppedBar };
      logRound(r, stoppedBar, improv);
      if (stopped) return;
      roundsDone++;
      if (improv.bars * 2 >= f.chart.bars.length) {
        roundsPlayed++;
        if (!loopBars) stored.clean[key] = (stored.clean[key] ?? 0) + 1;
      }
    }
    save();
    fillBottom();
  }

  /** ■: the run ends and how it went shows (a round stopped in the middle shows as far as it went, and does not count). */
  function stop(): void {
    if (!running) return;
    const { round, pos } = where();
    if (round >= 0 && !(demo && round === 0)) { judgeHits(round, pos); roundEnded(round, pos); }
    stopRun();
    endLog();
    showResult();
    app.stayAwake();
  }

  /** Sideways, how it went sits down the left (with the choices: what to do next), the box of chords on the right; otherwise under the box. */
  function placeResult(): void {
    const box = $('lab-result'), home = currentDevice() === 'phone-sideways' ? document.querySelector('#lab .lab-side')! : document.querySelector('#lab .lab-main')!;
    if (box.parentElement !== home) home.append(box);
  }
  function showResult(): void {
    placeResult();
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
    const off = loopBars?.[0] ?? 0, total = form!.chart.bars.length;
    const stoppedIn = lastRound?.stoppedBar !== undefined ? `Stopped in bar ${lastRound.stoppedBar + 1 + off}` : '';
    if (!lastRound) { add('lab-r-head', 'Not a bar of it played yet'); fillGrid(); }
    else if (role() === 'accomp') {
      const m = lastRound.marks, n = stoppedIn ? m.size : total;
      const right = [...m.values()].filter((x) => x !== 'miss').length, onBeat = [...m.values()].filter((x) => x === 'ok').length;
      add('lab-r-head', `${stoppedIn ? `${stoppedIn}: ` : ''}${right} of ${n} bar${n === 1 ? '' : 's'} right · ${onBeat} on the beat${!stoppedIn && roundsDone > 1 ? ` (last of ${roundsDone} rounds)` : ''}`);
      if (stoppedIn) add('lab-r-line', roundsDone ? `A round stopped in the middle does not count (${roundsDone} whole round${roundsDone === 1 ? '' : 's'} before it).` : 'A round stopped in the middle does not count.');
      for (const r of lastRound.results.filter((x) => x.mark !== 'ok').slice(0, 3)) add('lab-r-line', sayHit(r, accompStep(), off));
      fillGrid(m);
    } else {
      const im = lastRound.improv!;
      add('lab-r-head', roundsDone ? `${roundsDone} round${roundsDone === 1 ? '' : 's'} · you played in ${roundsPlayed}` : stoppedIn);
      const head = stoppedIn ? 'That round so far (stopped: not counted)' : 'Last round';
      add('lab-r-line', im.notes
        ? `${head}: ${im.notes} notes in ${im.bars} of ${stoppedIn ? lastRound.stoppedBar! + 1 : total} bars, ${Math.round((im.fromGuide / im.notes) * 100)}% ${guideWords()}${im.changes ? `; you played at ${im.playedAt} of ${im.changes} chord changes, on a chord note at ${im.landed}` : ''}.`
        : `${head}: no notes played.`);
      add('lab-r-line', 'Improvising is not marked: this is just how it went. A round counts as played when you play in at least half its bars.');
      fillGrid();
    }
    if (loopBars && lastRound) add('lab-r-line', "Looping bars is practice: the step's ✓ comes from rounds over every bar.");
    // What next: the next step after enough clean rounds (or rounds played, improvising).
    const done = (stored.clean[key] ?? 0) >= cleanForNext(), i = stepIndex();
    const buttons = document.createElement('div');
    buttons.className = 'lab-r-buttons';
    const btn = (text: string, main: boolean, run: () => void) => { const b = Object.assign(document.createElement('button'), { type: 'button', className: `btn${main ? ' main' : ''}`, textContent: text }); b.addEventListener('click', run); buttons.append(b); };
    if (done && i + 1 < steps().length) {
      add('lab-r-next', `Next: step ${i + 2}, ${steps()[i + 1].name.toLowerCase()} · ${role() === 'accomp' ? `${cleanForNext()} clean rounds` : `${cleanForNext()} rounds`} on this one`);
      btn(`Step ${i + 2} ▶`, true, () => { setStep(i + 1); void start(false); });
    }
    btn('Again ▶', !(done && i + 1 < steps().length), () => void start(false));
    const worst = lastRound?.results.find((r) => r.mark === 'miss');
    if (worst && !loopBars) btn(`Loop bars ${worst.hit.bar + 1}–${Math.min(chart!.bars.length, worst.hit.bar + 2)}`, false, () => { loopBars = [worst.hit.bar, Math.min(chart!.bars.length - 1, worst.hit.bar + 1)]; rebuildForm(); backToOpen(); });
    btn(role() === 'accomp' ? 'Try the lead' : 'Try the accompaniment', false, () => { setRole(role() === 'accomp' ? 'lead' : 'accomp'); rebuildForm(); backToOpen(); });
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
  /** The opening (or the result) drawn again; the last result's marks only where it is a result of what is chosen now. */
  function fill(): void { fillOpen(); fillGrid(lastRound && !running && lastRound.ctx === ctx() ? lastRound.marks : undefined); fillBottom(); $('lab-band-line').textContent = bandLine(); }

  // ---- the controls ------------------------------------------------------------------------------------------------

  $('lab-role-lead').addEventListener('click', () => { cancelStart(); setRole('lead'); rebuildForm(); fill(); });
  $('lab-role-accomp').addEventListener('click', () => { cancelStart(); setRole('accomp'); rebuildForm(); fill(); });
  $('lab-start').addEventListener('click', () => void start(false));
  $('lab-show').addEventListener('click', () => void start(true));
  $('lab-stop').addEventListener('click', stop);
  $('lab-done').addEventListener('click', () => close());
  // The chart: a list of what the lab has.
  const pickDialog = $<HTMLDialogElement>('lab-pick-dialog');
  $('lab-change').addEventListener('click', () => {
    cancelStart();
    $('lab-pick-list').replaceChildren(...charts.map((c) => {
      const b = Object.assign(document.createElement('button'), { type: 'button', className: c.id === chart?.id ? 'current' : '' });
      b.innerHTML = '<strong></strong><small></small>';
      b.querySelector('strong')!.textContent = c.title;
      b.querySelector('small')!.textContent = `${c.bars.length} bars · ${c.meter.beats}/${c.meter.beatType} · ♩ ${c.tempo}`;
      b.addEventListener('click', () => { pickDialog.close(); preset = null; setActivity(null); choose(c.id); lastRound = null; feedback(''); fill(); }); // another chart: the activity is over
      const li = document.createElement('li');
      li.append(b);
      return li;
    }));
    pickDialog.showModal();
  });
  // ⚙ The band: which parts play, the click, drop-outs (the style is the chart's: content, owner 2026-10-13).
  const bandDialog = $<HTMLDialogElement>('lab-band-dialog');
  function fillBand(): void {
    const p = parts();
    $<HTMLInputElement>('lab-p-drums').checked = p.drums;
    $<HTMLInputElement>('lab-p-bass').checked = p.bass;
    $<HTMLInputElement>('lab-p-chords').checked = p.chords;
    $<HTMLInputElement>('lab-p-click').checked = p.click;
    $('lab-p-chords-label').hidden = role() === 'accomp';
    for (const r of bandDialog.querySelectorAll<HTMLInputElement>('input[name="lab-dropouts"]')) r.checked = r.value === dropouts();
  }
  $('lab-band').addEventListener('click', () => { if (running) stop(); else cancelStart(); fillBand(); bandDialog.showModal(); });
  bandDialog.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    // An activity's preset choice changes for the activity; the rest are yours, saved.
    if (t.name === 'lab-dropouts') { if (preset?.dropouts !== undefined) preset.dropouts = t.value as Stored['dropouts']; else stored.dropouts = t.value as Stored['dropouts']; }
    else if (t.id.startsWith('lab-p-')) {
      const k = t.id.slice(6) as keyof Stored['parts'];
      if (preset?.parts && k in preset.parts) preset.parts = { ...preset.parts, [k]: t.checked }; else stored.parts = { ...stored.parts, [k]: t.checked };
    }
    save();
    fill();
  });

  // Keys: from the MIDI keyboard and the screen's keys, timed on the band's clock at the moment the key moved (the
  // keyboard's own time, not when the page got round to it). A key's release is kept: a chord is its notes held together.
  keys.onKey = (m, on, time) => {
    if (!running) return;
    const songT = sound.songTime() - Math.min(1000, Math.max(0, performance.now() - time)) * speed();
    if (!on) { const p = held.get(m); if (p) { p.off = songT - p.round * roundMs(); held.delete(m); } return; }
    let { round } = where(songT);
    // A shade before the next round (or the count-in's end) is the next round's first chord, played a little early.
    if (round < 0 || songT - round * roundMs() > roundMs() - tol()) round++;
    const p = { midi: m, t: songT - round * roundMs(), round, at: time };
    presses.push(p);
    held.set(m, p);
  };

  /** chartId: a chart chosen in the library (remembered, as one chosen with Change). */
  async function open(stillWanted: () => boolean = () => true, activity?: { chart: string; preset: LabPreset; title?: string }, chartId?: string): Promise<void> {
    await load();
    if (!stillWanted()) return;
    if (!charts.length || !styles.length) { app.showMessage(loadProblems || 'The lab has no charts or styles to play.'); return; }
    if (activity) {
      // The activity's content must be there: its chart, its style (in the chart's metre) and its ladder.
      const c = charts.find((x) => x.id === activity.chart);
      const problem = !c ? `no chart "${activity.chart}"${loadProblems ? ` (${loadProblems})` : ''}`
        : activity.preset.style && !styles.some((s) => s.id === activity.preset.style && sameMeter(s, c)) ? `no style "${activity.preset.style}" in ${c.meter.beats}/${c.meter.beatType}`
        : ladderProblem(activity.preset);
      if (problem) { app.showMessage(`This activity cannot open: ${problem}`); return; }
    }
    preset = activity ? structuredClone(activity.preset) : null;
    isOpen = true;
    $('lab').hidden = false;
    choose(activity?.chart ?? chartId ?? stored.chart ?? charts[0].id, !activity);
    backToOpen();
    feedback(loadProblems || activity?.title || ''); // (an activity's own words)
    app.stayAwake();
  }
  /** An activity's ladder that cannot be read: why (none: fine). */
  function ladderProblem(p: LabPreset): string {
    try { if (p.steps?.accompaniment) readLadder(p.steps.accompaniment, 'accomp'); if (p.steps?.lead) readLadder(p.steps.lead, 'lead'); return ''; }
    catch (e) { return e instanceof Error ? e.message : String(e); }
  }
  function close(): void {
    if (running) stop(); // (the run is logged)
    stopRun();
    endLog();
    preset = null; // an activity's preset ends with it
    isOpen = false;
    keys.release();
    $('lab').hidden = true;
    app.stayAwake();
    closed();
  }

  function read(): Stored {
    const empty: Stored = { role: 'accomp', step: {}, clean: {}, speed: {}, help: 'lit', parts: { drums: true, bass: true, chords: true, click: false }, dropouts: 'off' };
    try { const s = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Stored>; return { ...empty, ...s, parts: { ...empty.parts, ...s.parts } }; } catch { return empty; }
  }
  function save(): void { try { localStorage.setItem(KEY, JSON.stringify(stored)); } catch { /* this visit only */ } }

  return {
    open,
    close,
    get isOpen() { return isOpen; },
    key: (e: KeyEvent) => keys.midiKey(e.midi, e.on, midi.down, e.time),
    // The keyboard remote: a mash stops; the highest key starts (or Again); the lowest goes back to the opening. The
    // edge keys come here only when stopped: while the band plays every key is music (musicRange below), so a mash
    // is the only way to stop from the keyboard then (review 2026-10-14: a "lowest stops" branch here never ran).
    command(c: Command): void {
      if (c === 'mash') { if (running) { stop(); feedback('Stopped by a mash'); } }
      else if (c === 'high') { if (!running) void start(false); }
      else if (c === 'low') { if (!running) backToOpen(); }
    },
    // The keys the music uses (the remote's edge keys outside them are commands). While the band plays any octave
    // counts (chords any voicing, roots any octave, improvising anywhere), so every key is music then; stopped, the lit range.
    musicRange: (): KeyRange | null => (running ? { lo: 0, hi: 127 } : keys.span),
    resized: () => placeResult(),
    get busy() { return isOpen; },
    debug: () => ({ running, demo, role: role(), step: role() === 'accomp' ? accompStep() : leadStep(), where: where(), results: results.map((r) => ({ bar: r.hit.bar, mark: r.mark, t: r.hit.t, until: r.hit.until, chord: r.hit.chord.symbol, pcs: r.hit.chord.pcs })), hits: form && style ? hits(form, style, accompStep()).map((h) => ({ t: h.t, until: h.until, bar: h.bar, voicing: voicing(h.chord), root: voicing(h.chord)[0] })) : [], beatMs: form?.beatMs, roundMs: roundMs(), speed: speed(), lastRound: lastRound ? { marks: [...lastRound.marks], improv: lastRound.improv } : null }),
  };
}

