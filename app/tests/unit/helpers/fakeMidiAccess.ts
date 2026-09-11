// A hand-rolled stand-in for the browser's MIDIAccess, good enough for
// WebMidiSource's unit tests: ports can be added and removed at runtime (to
// exercise hot-plug) and messages can be injected with explicit timestamps.
//
// The Playwright equivalent lives in tests/e2e/fixtures/midiMock.ts; that one
// has to be serialisable into the page, so the two are deliberately separate.

type PortState = 'connected' | 'disconnected';
type PortConnection = 'open' | 'closed' | 'pending';
type PortType = 'input' | 'output';

export class FakePort extends EventTarget {
  state: PortState = 'connected';
  connection: PortConnection = 'open';
  version = '1.0';
  onstatechange: ((ev: Event) => unknown) | null = null;

  constructor(
    readonly id: string,
    readonly name: string,
    readonly manufacturer = 'Test',
    readonly type: PortType = 'input',
  ) {
    super();
  }

  open(): Promise<FakePort> {
    this.connection = 'open';
    return Promise.resolve(this);
  }

  close(): Promise<FakePort> {
    this.connection = 'closed';
    return Promise.resolve(this);
  }
}

export class FakeInput extends FakePort {
  private handler: ((ev: MIDIMessageEvent) => unknown) | null = null;

  constructor(id: string, name: string, manufacturer = 'Test') {
    super(id, name, manufacturer, 'input');
  }

  /**
   * A property, not a field, so the fake models the one piece of Web MIDI
   * behaviour the port lifetime turns on: **assigning a non-null
   * `onmidimessage` implicitly opens the port.** A port the browser closed
   * while its device was away delivers nothing until something assigns the
   * handler again, and assigning over a slot that already holds a function is
   * the only thing that does it.
   */
  get onmidimessage(): ((ev: MIDIMessageEvent) => unknown) | null {
    return this.handler;
  }

  set onmidimessage(fn: ((ev: MIDIMessageEvent) => unknown) | null) {
    this.handler = fn;
    if (fn) this.connection = 'open';
  }

  /** Delivers one message, exactly as `midimessage` would. */
  emit(bytes: number[], timeStamp: number): void {
    // A closed port delivers nothing, which is the whole point of the above.
    if (this.connection !== 'open') return;
    this.handler?.({
      data: Uint8Array.from(bytes),
      timeStamp,
    } as unknown as MIDIMessageEvent);
  }
}

export class FakeOutput extends FakePort {
  readonly sent: number[][] = [];

  constructor(id: string, name: string, manufacturer = 'Test') {
    super(id, name, manufacturer, 'output');
  }

  send(data: number[]): void {
    this.sent.push([...data]);
  }
}

export class FakeMidiAccess extends EventTarget {
  readonly inputs = new Map<string, FakeInput>();
  readonly outputs = new Map<string, FakeOutput>();
  sysexEnabled = false;
  onstatechange: ((ev: Event) => unknown) | null = null;

  addInput(input: FakeInput): FakeInput {
    this.inputs.set(input.id, input);
    this.onstatechange?.(new Event('statechange'));
    return input;
  }

  removeInput(id: string): void {
    this.inputs.delete(id);
    this.onstatechange?.(new Event('statechange'));
  }

  /**
   * What a real unplug does, which is *not* `removeInput`.
   *
   * The Web MIDI API keeps the `MIDIPort` in the map and sets its `state` to
   * `'disconnected'`, so the page can recognise the same device when it comes
   * back; the browser closes the port as well. Every test in this file used
   * `removeInput` — the branch the device never takes — which is why
   * `WebMidiSource` counted an unplugged piano as connected for a whole
   * session (handoff §6a).
   */
  disconnectInput(id: string): void {
    const input = this.inputs.get(id);
    if (!input) throw new Error(`fakeMidiAccess: no input ${id}`);
    input.state = 'disconnected';
    input.connection = 'closed';
    this.onstatechange?.(new Event('statechange'));
  }

  /** The cable going back in: the same port object, present and closed. */
  reconnectInput(id: string): void {
    const input = this.inputs.get(id);
    if (!input) throw new Error(`fakeMidiAccess: no input ${id}`);
    input.state = 'connected';
    this.onstatechange?.(new Event('statechange'));
  }

  disconnectOutput(id: string): void {
    const output = this.outputs.get(id);
    if (!output) throw new Error(`fakeMidiAccess: no output ${id}`);
    output.state = 'disconnected';
    output.connection = 'closed';
    this.onstatechange?.(new Event('statechange'));
  }

  addOutput(output: FakeOutput): FakeOutput {
    this.outputs.set(output.id, output);
    this.onstatechange?.(new Event('statechange'));
    return output;
  }
}

/** Narrows the fake to the shape WebMidiSource actually consumes. */
export function asMidiAccess(access: FakeMidiAccess): MIDIAccess {
  return access;
}
