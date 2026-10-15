// The metronome on its own, with no score (owner, 2026-10-15: Practice → Metronome). It is the app's own click, as
// the score and the drills use it (Sound.play with beats only: the same sound, volume and scheduling on the audio
// clock); this screen only chooses the tempo and the beats in a bar, and starts and stops it. Nothing is judged or
// logged. The tempo and beats are kept (piano-web.metronome.v1).

import { $, type App, type Screen } from '../app';
import { savePieceSetting, settingsFor, type Click } from '../settings';

const KEY = 'piano-web.metronome.v1';
const BEATS_AHEAD = 20000; // beats handed to the clock at a start: hours at any tempo
interface Stored { bpm: number; beats: number }

export function createMetronomeScreen(app: App, closed: () => void) {
  const { sound } = app;
  let isOpen = false, running = false, frame = 0, taps: number[] = [];
  const read = (): Stored => { try { const s = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Stored>; return { bpm: s.bpm ?? 80, beats: s.beats ?? 4 }; } catch { return { bpm: 80, beats: 4 }; } };
  let st = read();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch { /* this visit only */ } };

  function fill(): void {
    $<HTMLOutputElement>('metro-bpm').value = `♩ ${st.bpm}`;
    $<HTMLInputElement>('metro-range').value = String(st.bpm);
    $<HTMLSelectElement>('metro-beats').value = String(st.beats);
    $('metro-go').textContent = running ? '■ Stop' : '▶ Start';
    const click = settingsFor('').click;
    for (const b of document.querySelectorAll<HTMLButtonElement>('[data-mclick]')) b.setAttribute('aria-pressed', String(b.dataset.mclick === click));
    const dots = $('metro-dots');
    if (dots.childElementCount !== st.beats) dots.replaceChildren(...Array.from({ length: st.beats }, (_, i) => Object.assign(document.createElement('i'), { textContent: String(i + 1) })));
  }
  function setBpm(bpm: number): void {
    st.bpm = Math.round(Math.min(300, Math.max(20, bpm)));
    save();
    if (running) sound.setSpeed(st.bpm / 60); // (the clock carries on from where it is: no jump)
    fill();
  }
  async function start(): Promise<void> {
    running = true;
    fill();
    await sound.prepare(false);
    if (!running || !isOpen) return;
    app.appSound();
    // One beat a second at speed 1, so the speed is the tempo / 60; the first of each bar accented.
    sound.play([], Array.from({ length: BEATS_AHEAD }, (_, k) => ({ t: k * 1000, accent: k % st.beats === 0 })), 0, st.bpm / 60);
    app.stayAwake();
    const tick = () => {
      if (!running) return;
      const beat = Math.floor(sound.songTime() / 1000);
      const dots = $('metro-dots').children;
      for (let i = 0; i < dots.length; i++) dots[i].classList.toggle('on', beat >= 0 && beat % st.beats === i);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  }
  function stop(): void {
    if (!running) return;
    running = false;
    cancelAnimationFrame(frame);
    sound.stop();
    for (const d of $('metro-dots').children) d.classList.remove('on');
    fill();
    app.stayAwake();
  }
  // Its sound: the app's click (one setting for the app, as in ⚙ and the Tempo panel); heard from the next click.
  for (const b of document.querySelectorAll<HTMLButtonElement>('[data-mclick]')) b.addEventListener('click', () => { savePieceSetting('', 'click', b.dataset.mclick as Click); app.appSound(); fill(); });
  $('metro-go').addEventListener('click', () => (running ? stop() : void start()));
  $('metro-slower').addEventListener('click', () => setBpm(st.bpm - 5));
  $('metro-faster').addEventListener('click', () => setBpm(st.bpm + 5));
  $<HTMLInputElement>('metro-range').addEventListener('input', (e) => setBpm(Number((e.target as HTMLInputElement).value)));
  $<HTMLSelectElement>('metro-beats').addEventListener('change', (e) => {
    st.beats = Number((e.target as HTMLSelectElement).value);
    save();
    const was = running;
    stop();
    fill();
    if (was) void start(); // the accents moved: started again on beat 1
  });
  // Tap tempo: the tempo of the last few taps (as the score's Tempo panel does).
  $('metro-tap').addEventListener('click', () => {
    const now = performance.now();
    taps = [...taps.filter((t) => now - t < 3000), now].slice(-5);
    if (taps.length >= 2) setBpm(60000 / ((taps[taps.length - 1] - taps[0]) / (taps.length - 1)));
  });
  $('metro-done').addEventListener('click', () => { close(); closed(); });

  function open(): void {
    isOpen = true;
    st = read();
    $('metronome').hidden = false;
    fill();
  }
  function close(): void {
    stop();
    isOpen = false;
    $('metronome').hidden = true;
  }

  const screen: Screen = {
    key: () => {}, // your keys are not judged here
    // The keyboard remote: the highest key starts, the lowest stops; a mash stops.
    command: (c) => { if (c === 'high' && !running) void start(); else if (c === 'low' || c === 'mash') stop(); },
    musicRange: () => null,
    resized: () => {},
    get busy() { return running; },
  };
  return { screen, open, close, get isOpen() { return isOpen; }, debug: () => ({ running, bpm: st.bpm, beats: st.beats, t: sound.songTime() }) };
}
export type MetronomeScreen = ReturnType<typeof createMetronomeScreen>;
