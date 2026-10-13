// Sound: the piano (Splendid Grand, bundled, played by smplr) and a metronome click, scheduled on the audio
// clock a little ahead of time so a busy page or a late timer never makes them stumble. The marker reads the
// same clock (songTime), so what you hear and what you see stay together.

import { DrumMachine, Soundfont, SplendidGrandPiano } from 'smplr';
import type { MidiInput } from './midi';
import type { Click } from './settings';

/**
 * A note to play: when (ms of the song at speed 1), which key, for how long (ms at speed 1), how hard (1-127), and on
 * what: the piano (the default), 'drums' (midi is then a General MIDI drum number), or a General MIDI instrument by
 * its FluidR3 name ('acoustic_bass', 'acoustic_guitar_steel', ...).
 */
export interface NoteEvent { t: number; midi: number; dur: number; vel: number; part?: string }

/**
 * The band's instruments kept in the app for offline (web/public/content/audio/band, from the FluidR3 General MIDI
 * set, CC BY 3.0, via midi-js-soundfonts); any other General MIDI instrument is fetched from that set online.
 */
export const BUNDLED_PARTS = ['acoustic_bass', 'electric_bass_finger', 'acoustic_guitar_nylon', 'acoustic_guitar_steel', 'electric_guitar_clean'];
/** General MIDI drum numbers to the LM-2 kit's samples (a LinnDrum; public domain; web/public/content/audio/band/lm-2). */
const GM_DRUMS: Record<number, string> = {
  35: 'kick-alt', 36: 'kick', 37: 'stick-m', 38: 'snare-m', 39: 'clap', 40: 'snare-h', 41: 'tom-ll', 42: 'hhclosed', 43: 'tom-l',
  44: 'hhclosed-short', 45: 'tom-m', 46: 'hhopen', 47: 'tom-m', 48: 'tom-h', 49: 'crash', 50: 'tom-hh', 51: 'ride', 52: 'crash',
  53: 'ride', 54: 'tambourine', 55: 'crash', 56: 'cowbell', 57: 'crash', 59: 'ride', 62: 'conga-h', 63: 'conga-m', 64: 'conga-l',
  69: 'cabasa', 70: 'cabasa',
};
type Player = { start(e: { note: string | number; velocity?: number; time?: number; duration?: number }): (time?: number) => void; load: Promise<unknown> };
/** A metronome beat: when (ms at speed 1), and whether it starts a bar. */
export interface Beat { t: number; accent: boolean }

const LOOKAHEAD_S = 0.15; // how far ahead notes and clicks are handed to the audio clock
const TICK_MS = 25; // how often the scheduler looks
const START_LEAD_S = 0.05; // a moment to get the first notes scheduled before they are due

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
  private keyOffs: { midi: number; time: number }[] = []; // keyboard note ends still to send (audio time)
  private parts = new Map<string, Player>(); // the band's instruments, loaded when first wanted
  private partGains = new Map<string, GainNode>();
  private muted = new Set<string>(); // parts silenced for now (drop-outs)
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

  /**
   * Gets a band instrument ready ('drums', or a General MIDI name; 'piano' is the piano): the kept ones load from the
   * app, others from the FluidR3 set online. Rejects if it cannot be loaded (offline, for one not kept).
   */
  async preparePart(part: string): Promise<void> {
    await this.prepare(part === 'piano');
    if (part === 'piano') return;
    let player = this.parts.get(part);
    if (!player) {
      const ctx = this.ctx!, gain = ctx.createGain();
      gain.connect(ctx.destination);
      this.partGains.set(part, gain);
      const base = `${import.meta.env.BASE_URL}content/audio/band`;
      if (part === 'drums') player = DrumMachine(ctx, { url: `${base}/lm-2/dm.json`, destination: gain }) as unknown as Player;
      else {
        const format = canPlayOgg() ? 'ogg' : 'mp3';
        const url = BUNDLED_PARTS.includes(part) ? `${base}/fluidr3/${part}-${format}.js` : `https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/${part}-${format}.js`;
        player = Soundfont(ctx, { instrumentUrl: url, destination: gain }) as unknown as Player;
      }
      this.parts.set(part, player);
      player.load.catch(() => this.parts.delete(part)); // a failed load is tried again next time
    }
    await player.load;
  }

  /** A band part's volume (0 to 1; the piano's is setVolumes'). */
  setPartVolume(part: string, volume: number): void { const g = this.partGains.get(part); if (g) g.gain.value = volume; }
  /** Silence parts for a while (drop-outs): their notes are skipped until unmuted. */
  mute(parts: string[]): void { this.muted = new Set(parts); }

  /** Free play: a note on the phone's piano now, sounding until the returned function is called. */
  async noteNow(midi: number, velocity = 90, stillDown: () => boolean = () => true): Promise<() => void> {
    await this.prepare(true);
    if (!stillDown()) return () => {}; // let go while the piano was loading: no late blip
    const stop = this.piano!.start({ note: midi, velocity });
    return () => stop();
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

  /**
   * Plays the given notes and beats from song time fromT (ms at speed 1). With keepSounding, notes already
   * sounding ring on to their written end (Wait for me: the piano's held notes are not cut by your next ones).
   * now: begun by a key you just played, so the song is at fromT this very moment (no start delay, which
   * would judge every later note of yours early by that much).
   */
  play(notes: NoteEvent[], beats: Beat[], fromT: number, speed: number, keepSounding = false, now = false): void {
    if (keepSounding) clearInterval(this.timer);
    else this.stop();
    if (!this.ctx) return;
    this.notes = notes;
    this.beats = beats;
    this.speed = speed;
    this.anchorT = fromT;
    this.anchorCtx = this.ctx.currentTime + (now ? 0 : START_LEAD_S);
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
    this.keyOffs = [];
    this.voices = [];
    for (const c of this.clicks) { try { c.stop(); } catch { /* already ended */ } }
    this.clicks = [];
  }

  /** The MIDI clock is performance.now() ms; the audio clock is ctx seconds: the same moment in both. */
  private midiTime(time: number): number { return performance.now() + (time - this.ctx!.currentTime) * 1000; }

  private at(t: number): number { return this.anchorCtx + (t - this.anchorT) / 1000 / this.speed; }

  private schedule(): void {
    const ctx = this.ctx!, horizon = ctx.currentTime + LOOKAHEAD_S;
    while (this.nextNote < this.notes.length && this.at(this.notes[this.nextNote].t) < horizon) {
      const n = this.notes[this.nextNote++];
      const time = Math.max(ctx.currentTime, this.at(n.t));
      const duration = n.dur / 1000 / this.speed;
      if (n.part && n.part !== 'piano') { // a band instrument: always on the phone
        if (this.muted.has(n.part)) continue;
        const player = this.parts.get(n.part);
        const note = n.part === 'drums' ? GM_DRUMS[n.midi] : n.midi;
        if (!player || note === undefined) continue;
        const stop = player.start({ note, velocity: n.vel, time, duration });
        this.voices.push({ stop, end: time + duration + 1 });
        continue;
      }
      if (this.muted.has('piano')) continue;
      if (this.keyboard) {
        this.keyboard.noteOn(n.midi, n.vel, this.midiTime(time));
        this.keyOffs.push({ midi: n.midi, time: time + duration });
        continue;
      }
      const stop = this.piano!.start({ note: n.midi, velocity: n.vel, time, duration });
      this.voices.push({ stop, end: time + duration + 1 });
    }
    if (this.keyboard && this.keyOffs.length) {
      const due = this.keyOffs.filter((k) => k.time < horizon);
      this.keyOffs = this.keyOffs.filter((k) => k.time >= horizon);
      for (const k of due) this.keyboard.noteOff(k.midi, this.midiTime(Math.max(ctx.currentTime, k.time)));
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

/** Whether this browser plays Ogg (the band's sounds come as Ogg, or MP3 where it cannot: Safari). */
function canPlayOgg(): boolean {
  const ua = navigator.userAgent;
  const safari = ua.includes('Safari') && !ua.includes('Chrome') && !ua.includes('Chromium');
  return !safari && ['probably', 'maybe'].includes(document.createElement('audio').canPlayType('audio/ogg'));
}
