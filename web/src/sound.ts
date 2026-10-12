// Sound: the piano (Splendid Grand, bundled, played by smplr) and a metronome click, scheduled on the audio
// clock a little ahead of time so a busy page or a late timer never makes them stumble. The marker reads the
// same clock (songTime), so what you hear and what you see stay together.

import { SplendidGrandPiano } from 'smplr';
import type { MidiInput } from './midi';
import type { Click } from './settings';

/** A note to play: when (ms of the song at speed 1), which key, for how long (ms at speed 1). */
export interface NoteEvent { t: number; midi: number; dur: number }
/** A metronome beat: when (ms at speed 1), and whether it starts a bar. */
export interface Beat { t: number; accent: boolean }

const LOOKAHEAD_S = 0.15; // how far ahead notes and clicks are handed to the audio clock
const TICK_MS = 25; // how often the scheduler looks
const START_LEAD_S = 0.05; // a moment to get the first notes scheduled before they are due
const VELOCITY = 80; // the scores carry no reliable loudness yet: a middle layer of the piano

export class Sound {
  private ctx: AudioContext | null = null;
  private piano: ReturnType<typeof SplendidGrandPiano> | null = null;
  private pianoGain: GainNode | null = null;
  private clickGain: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private notes: NoteEvent[] = [];
  private beats: Beat[] = [];
  private nextNote = 0;
  private nextBeat = 0;
  private anchorCtx = 0; // audio time at which the song is at anchorT
  private anchorT = 0;
  private speed = 1;
  private timer = 0;
  private click: Click = 'wood';
  private voices: { stop: (time?: number) => void; end: number }[] = [];
  private clicks: AudioScheduledSourceNode[] = [];
  playing = false;
  /** When set, piano notes go to the MIDI keyboard instead of the phone (the metronome stays on the phone). */
  keyboard: MidiInput | null = null;

  /** Starts the audio (it must follow a tap) and, unless the keyboard plays, loads the piano; resolves when ready. */
  async prepare(needPiano = true): Promise<void> {
    if (!this.ctx) {
      const ctx = new AudioContext();
      this.ctx = ctx;
      this.pianoGain = ctx.createGain();
      this.pianoGain.connect(ctx.destination);
      this.clickGain = ctx.createGain();
      this.clickGain.connect(ctx.destination);
    }
    await this.ctx.resume();
    if (!needPiano) return;
    // The samples load the first time the phone's piano is needed (not when the keyboard plays the part).
    this.piano ??= SplendidGrandPiano(this.ctx, {
      baseUrl: `${import.meta.env.BASE_URL}content/audio/splendid-grand-piano/samples`,
      destination: this.pianoGain!,
    });
    await this.piano.ready;
  }

  setVolumes(piano: number, click: number): void {
    if (this.pianoGain) this.pianoGain.gain.value = piano;
    if (this.clickGain) this.clickGain.gain.value = click;
  }

  setClick(click: Click): void { this.click = click; }

  /** Where the song is now, in ms at speed 1: the marker's clock while sound plays. */
  songTime(): number {
    if (!this.ctx) return this.anchorT;
    return this.anchorT + (this.ctx.currentTime - this.anchorCtx) * 1000 * this.speed;
  }

  /** Plays the given notes and beats from song time fromT (ms at speed 1). */
  play(notes: NoteEvent[], beats: Beat[], fromT: number, speed: number): void {
    this.stop();
    if (!this.ctx) return;
    this.notes = notes;
    this.beats = beats;
    this.speed = speed;
    this.anchorT = fromT;
    this.anchorCtx = this.ctx.currentTime + START_LEAD_S;
    this.nextNote = notes.findIndex((n) => n.t >= fromT - 1);
    if (this.nextNote < 0) this.nextNote = notes.length;
    this.nextBeat = beats.findIndex((b) => b.t >= fromT - 1);
    if (this.nextBeat < 0) this.nextBeat = beats.length;
    this.playing = true;
    this.schedule();
    this.timer = window.setInterval(() => this.schedule(), TICK_MS);
  }

  /** A new speed mid-song: the clock carries on from where it is. */
  setSpeed(speed: number): void {
    if (!this.ctx || !this.playing) { this.speed = speed; return; }
    this.anchorT = this.songTime();
    this.anchorCtx = this.ctx.currentTime;
    this.speed = speed;
  }

  stop(): void {
    clearInterval(this.timer);
    const wasPlaying = this.playing;
    this.playing = false;
    const now = this.ctx?.currentTime ?? 0;
    for (const v of this.voices) if (v.end > now) v.stop(now);
    if (this.keyboard && wasPlaying) this.keyboard.silence();
    this.voices = [];
    for (const c of this.clicks) { try { c.stop(); } catch { /* already ended */ } }
    this.clicks = [];
  }

  private at(t: number): number { return this.anchorCtx + (t - this.anchorT) / 1000 / this.speed; }

  private schedule(): void {
    const ctx = this.ctx!, horizon = ctx.currentTime + LOOKAHEAD_S;
    while (this.nextNote < this.notes.length && this.at(this.notes[this.nextNote].t) < horizon) {
      const n = this.notes[this.nextNote++];
      const time = Math.max(ctx.currentTime, this.at(n.t));
      const duration = n.dur / 1000 / this.speed;
      if (this.keyboard) {
        // The MIDI clock is performance.now(); the audio clock is ctx time: the same moment in both.
        this.keyboard.play(n.midi, VELOCITY, performance.now() + (time - ctx.currentTime) * 1000, duration * 1000);
        continue;
      }
      const stop = this.piano!.start({ note: n.midi, velocity: VELOCITY, time, duration });
      this.voices.push({ stop, end: time + duration + 1 });
    }
    while (this.nextBeat < this.beats.length && this.at(this.beats[this.nextBeat].t) < horizon) {
      const b = this.beats[this.nextBeat++];
      this.clickAt(Math.max(ctx.currentTime, this.at(b.t)), b.accent);
    }
    if (this.voices.length > 200) this.voices = this.voices.filter((v) => v.end > ctx.currentTime);
    if (this.clicks.length > 50) this.clicks = this.clicks.slice(-20);
  }

  // The three click sounds are the old app's: a woodblock (a burst of noise through a narrow band-pass, which
  // carries over a piano better than a bare tone), a square-wave beep, and a high sine. The first beat of a
  // bar is higher and a little louder; the others were raised nearer to it after the owner lost them under
  // the piano (2026-10-11).
  private clickAt(when: number, accent: boolean): void {
    const ctx = this.ctx!, gain = ctx.createGain();
    gain.connect(this.clickGain!);
    let source: AudioScheduledSourceNode;
    if (this.click === 'wood') {
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = accent ? 2400 : 1600;
      filter.Q.value = 12;
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer();
      noise.connect(filter);
      filter.connect(gain);
      gain.gain.setValueAtTime(accent ? 1 : 0.85, when);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.045);
      source = noise;
    } else {
      const osc = ctx.createOscillator();
      if (this.click === 'beep') {
        osc.type = 'square';
        osc.frequency.value = accent ? 1500 : 1000;
        gain.gain.setValueAtTime(accent ? 0.5 : 0.42, when);
      } else {
        osc.type = 'sine';
        osc.frequency.value = 5000;
        gain.gain.setValueAtTime(0.0001, when);
        gain.gain.exponentialRampToValueAtTime(accent ? 0.6 : 0.5, when + 0.002);
      }
      gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.04);
      osc.connect(gain);
      source = osc;
    }
    source.start(when);
    source.stop(when + 0.06);
    source.onended = () => gain.disconnect();
    this.clicks.push(source);
  }

  private noiseBuffer(): AudioBuffer {
    if (this.noise) return this.noise;
    const ctx = this.ctx!, length = Math.ceil(ctx.sampleRate * 0.06);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    this.noise = buffer;
    return buffer;
  }
}
