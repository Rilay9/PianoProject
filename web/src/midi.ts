// MIDI: the keys pressed on a connected keyboard, and (if chosen) the app's piano part sent to the keyboard
// to play through its own speakers (Web MIDI: Chrome and Android, not Safari). Every connected input is
// listened to, including ones plugged in later.

export interface KeyEvent { midi: number; on: boolean; velocity: number; time: number } // time: performance.now() ms

export class MidiInput {
  private access: MIDIAccess | null = null;
  readonly down = new Set<number>();
  private sent = new Map<number, number>(); // key -> performance.now() it is due to sound on the keyboard
  private silenceTimer = 0;
  onKey: (e: KeyEvent) => void = () => {};
  onDevices: (names: string[]) => void = () => {};

  static get supported(): boolean { return typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator; }

  /** Asks the browser for MIDI (it may ask you to allow it) and starts listening. */
  async start(): Promise<string[]> {
    if (!MidiInput.supported) throw new Error('This browser has no MIDI support (Safari does not; Chrome does).');
    if (!this.access) {
      this.access = await navigator.requestMIDIAccess();
      this.access.onstatechange = () => this.listen();
    }
    return this.listen();
  }

  private listen(): string[] {
    const names: string[] = [];
    this.access?.inputs.forEach((input) => {
      input.onmidimessage = (m) => this.message(m);
      if (input.state === 'connected') names.push(input.name ?? 'MIDI keyboard');
    });
    this.onDevices(names);
    return names;
  }

  /** Is a keyboard connected that the app can play through? */
  get canPlay(): boolean {
    let any = false;
    this.access?.outputs.forEach((o) => { if (o.state === 'connected') any = true; });
    return any;
  }

  /** Plays a note on the keyboard at performance.now() time `at` (ms) for `ms` milliseconds. */
  play(midi: number, velocity: number, at: number, ms: number): void {
    clearTimeout(this.silenceTimer); // playing again: the delayed All Notes Off of a stop must not cut in
    this.access?.outputs.forEach((o) => {
      o.send([0x90, midi, velocity], at);
      o.send([0x80, midi, 0], at + ms);
    });
    this.sent.set(midi, at);
  }

  /** Silences everything the app sent (All Notes Off), also once the notes already queued have started. */
  silence(): void {
    const off = () => this.access?.outputs.forEach((o) => o.send([0xb0, 123, 0]));
    off();
    clearTimeout(this.silenceTimer);
    this.silenceTimer = window.setTimeout(off, 250);
    this.sent.clear();
  }

  private message(m: MIDIMessageEvent): void {
    const data = m.data;
    if (!data || data.length < 3) return;
    const kind = data[0] & 0xf0, midi = data[1], velocity = data[2];
    // Some keyboards pass on what they are sent: a key the app itself just played is not you playing.
    // (100 ms is a guess at how soon such an echo comes back.)
    const sentAt = this.sent.get(midi);
    if (sentAt !== undefined && Math.abs(m.timeStamp - sentAt) < 100) return;
    // Note on with velocity 0 is the usual way keyboards send a note off.
    if (kind === 0x90 && velocity > 0) { this.down.add(midi); this.onKey({ midi, on: true, velocity, time: m.timeStamp }); }
    else if (kind === 0x80 || kind === 0x90) { this.down.delete(midi); this.onKey({ midi, on: false, velocity, time: m.timeStamp }); }
  }
}
