// MIDI: the keys pressed on a connected keyboard, and (if chosen) the app's piano part sent to the keyboard
// to play through its own speakers (Web MIDI: Chrome and Android, not Safari). Every connected input is
// listened to, including ones plugged in later.

export interface KeyEvent { midi: number; on: boolean; velocity: number; time: number } // time: performance.now() ms

export class MidiInput {
  private access: MIDIAccess | null = null;
  readonly down = new Set<number>();
  private silenceTimer = 0;
  onKey: (e: KeyEvent) => void = () => {};
  /** The sustain pedal (controller 64) went down or up; time: performance.now() ms. */
  onPedal: (down: boolean, time: number) => void = () => {};
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

  /**
   * Starts a note on the keyboard at performance.now() time `at` (ms). The note's end is sent by the
   * caller nearer the time (noteOff), so a stop never leaves note-offs queued that could cut the next play.
   */
  noteOn(midi: number, velocity: number, at: number): void {
    clearTimeout(this.silenceTimer); // playing again: the delayed All Notes Off of a stop must not cut in
    this.access?.outputs.forEach((o) => o.send([0x90, midi, velocity], at));
  }

  noteOff(midi: number, at: number): void {
    this.access?.outputs.forEach((o) => o.send([0x80, midi, 0], at));
  }

  /**
   * Silences everything the app sent: drops what is still queued (where the browser can), then All Notes
   * Off now and again once the notes already handed over (up to the sound's lookahead) would have started.
   */
  silence(): void {
    const off = () => this.access?.outputs.forEach((o) => o.send([0xb0, 123, 0]));
    // MIDIOutput.clear() is in the Web MIDI spec but not every browser has it; the note
    // ends are no longer queued ahead, so what remains queued is at most the sound's 150 ms lookahead.
    this.access?.outputs.forEach((o) => { try { (o as MIDIOutput & { clear?: () => void }).clear?.(); } catch { /* not supported */ } });
    off();
    clearTimeout(this.silenceTimer);
    this.silenceTimer = window.setTimeout(off, 250);
  }

  private message(m: MIDIMessageEvent): void {
    const data = m.data;
    if (!data || data.length < 3) return;
    const kind = data[0] & 0xf0, midi = data[1], velocity = data[2];
    // Notes the app sends the keyboard are not filtered out here: keyboards normally do not send back what
    // they are sent, and a filter by key and time also dropped your own notes in unison with the app's.
    // Note on with velocity 0 is the usual way keyboards send a note off.
    if (kind === 0x90 && velocity > 0) { this.down.add(midi); this.onKey({ midi, on: true, velocity, time: m.timeStamp }); }
    else if (kind === 0x80 || kind === 0x90) { this.down.delete(midi); this.onKey({ midi, on: false, velocity, time: m.timeStamp }); }
    else if (kind === 0xb0 && midi === 64) this.onPedal(velocity >= 64, m.timeStamp); // controller 64: down from 64 up
  }
}
