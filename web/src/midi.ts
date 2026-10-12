// MIDI input: the keys pressed on a connected keyboard (Web MIDI: Chrome and Android, not Safari).
// Every connected input is listened to, including ones plugged in later.

export interface KeyEvent { midi: number; on: boolean; velocity: number; time: number } // time: performance.now() ms

export class MidiInput {
  private access: MIDIAccess | null = null;
  readonly down = new Set<number>();
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

  private message(m: MIDIMessageEvent): void {
    const data = m.data;
    if (!data || data.length < 3) return;
    const kind = data[0] & 0xf0, midi = data[1], velocity = data[2];
    // Note on with velocity 0 is the usual way keyboards send a note off.
    if (kind === 0x90 && velocity > 0) { this.down.add(midi); this.onKey({ midi, on: true, velocity, time: m.timeStamp }); }
    else if (kind === 0x80 || kind === 0x90) { this.down.delete(midi); this.onKey({ midi, on: false, velocity, time: m.timeStamp }); }
  }
}
