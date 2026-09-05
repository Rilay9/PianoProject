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
    return Promise.resolve(this);
  }

  close(): Promise<FakePort> {
    return Promise.resolve(this);
  }
}

export class FakeInput extends FakePort {
  onmidimessage: ((ev: MIDIMessageEvent) => unknown) | null = null;

  constructor(id: string, name: string, manufacturer = 'Test') {
    super(id, name, manufacturer, 'input');
  }

  /** Delivers one message, exactly as `midimessage` would. */
  emit(bytes: number[], timeStamp: number): void {
    this.onmidimessage?.({
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
