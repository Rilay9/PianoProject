// What the keys do, said one way on every screen (owner, 2026-10-16: "make that clear that they can use the keys too if
// they have the MIDI keyboard attached … we don't really want to have them take their hands off"). Said only when a
// MIDI keyboard is connected; the keyboard's lowest and highest keys (remote.ts) only once they have been set up.
// main.ts tells it what is connected and what the edge keys are.

let connected = false;
let edgeSource: () => { low?: number; high?: number; edges: boolean } = () => ({ edges: false });

export function setKeyboards(names: string[]): void { connected = names.length > 0; }
export function setEdgeSource(f: typeof edgeSource): void { edgeSource = f; }
/** A MIDI keyboard is connected now. */
export const keyboardConnected = (): boolean => connected;
/** The keyboard's lowest and highest keys are set up and on (Settings → Keyboard controls). */
export const edgesReady = (): boolean => { const e = edgeSource(); return connected && e.edges && e.low !== undefined && e.high !== undefined; };

/** Ready: "Press Start" and, with a keyboard, "or play any key". */
export function startWords(base = 'Press Start'): string { return connected ? `${base} or play any key` : base; }
/** On a result or an end: "a key <does it>", with a keyboard; '' without. */
export function keyDoes(what: string): string { return connected ? `a key ${what}` : ''; }
/** The edge keys' jobs here, once set up: "highest key: Next · lowest key: Again"; '' otherwise. */
export function edgeWords(jobs: { high?: string; low?: string }): string {
  if (!edgesReady()) return '';
  return [jobs.high ? `highest key: ${jobs.high}` : '', jobs.low ? `lowest key: ${jobs.low}` : ''].filter(Boolean).join(' · ');
}
/** Every "no keyboard" sentence, one phrase family: "No MIDI keyboard found: <what to do>." */
export function noKeyboard(fix: string): string { return `No MIDI keyboard found: ${fix}.`; }
/** Words joined with " · ", the empty ones left out. */
export const joinWords = (...parts: (string | false | null | undefined)[]): string => parts.filter(Boolean).join(' · ');
