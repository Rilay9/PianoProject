// Minimal AudioWorkletGlobalScope declarations.
//
// TypeScript's DOM library describes the *main thread* side of Web Audio and
// has nothing for the worklet's own global scope, so `pitchProcessor.ts` would
// not compile against it. `@types/audioworklet` exists but replaces the whole
// DOM lib, which the rest of the app needs; these four declarations are all the
// processor uses.

declare const sampleRate: number;
declare const currentTime: number;

declare class AudioWorkletProcessor {
  readonly port: MessagePort;
  constructor();
}

declare function registerProcessor(
  name: string,
  processorCtor: new () => AudioWorkletProcessor & {
    process(
      inputs: Float32Array[][],
      outputs: Float32Array[][],
      parameters: Record<string, Float32Array>,
    ): boolean;
  },
): void;
