// The MIDI converter (src/library/midi/), ported from the old app with its unit tests: the old vitest files
// (app/tests/unit/midi{Parse,HandSplit,Quantise,Rhythm,Writer,Hands,Import,Parity}.test.ts and the two swap cases
// of importSheet.test.ts, branch claude/piano-teaching-app-bo19td) as plain Node, under a tiny describe/it/expect
// shim. Run: npm run check:midi (Node 22.18+ runs the TypeScript files directly).
// Old cases that tested old-app code not ported here are listed by `skip(...)` with the reason.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  MidiReadError, barLengthOf, beatLengthOf, mergeNoteTracks, readMidi, trackWithTheNotes,
} from '../src/library/midi/readMidi.ts';
import {
  ZERO, add, eq, frac, fracToString, isZero, limitDenominator, mod, sub, toNumber,
} from '../src/library/midi/fraction.ts';
import { HAND_SPAN_SEMITONES, splitHands } from '../src/library/midi/handSplit.ts';
import { detectSwing, quantise, snap } from '../src/library/midi/quantise.ts';
import { isNotatable, notatablePieces } from '../src/library/midi/notatable.ts';
import { sliceIntoChords } from '../src/library/midi/slice.ts';
import { DIVISIONS, noteShape, spelledPitch, writeMusicXml } from '../src/library/midi/writer.ts';
import { convertMidi, readBackMusicXml, titleFromFilename } from '../src/library/midi/convert.ts';
import { checkSentence, handsSentence } from '../src/library/midi/words.ts';
import { swapHands } from '../src/library/midi/corrections.ts';
import { convert, midiConverter } from '../src/library/midi/index.ts';
import { barMap, steadyBars } from '../src/library/midi/bars.ts';

const FOUR_FOUR = steadyBars({ beats: 4, beatType: 4 }, frac(64));

// --- the shim: describe / it / expect, only the matchers these cases use ---------------------------------

const tests = [];
const skipped = [];
const stack = [];
function describe(name, body) {
  stack.push(name);
  try { body(); } catch (error) { tests.push({ name: [...stack].join(' > '), fn: () => { throw error; } }); }
  stack.pop();
}
function it(name, fn) { tests.push({ name: [...stack, name].join(' > '), fn }); }
it.skipIf = (condition) => (name, fn) => condition ? skipped.push({ name: [...stack, name].join(' > '), why: 'skipIf' }) : it(name, fn);
/** An old case not ported, and why. */
function skip(name, why) { skipped.push({ name, why }); }

const show = (v) => {
  try { return JSON.stringify(v, (_, x) => (typeof x === 'bigint' ? `${x}n` : x)); } catch { return String(v); }
};
/** vitest's toEqual: recursive, and a property that is undefined counts as absent. */
function equal(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) return a.length === b.length && a.every((x, i) => equal(x, b[i]));
  const keys = (o) => Object.keys(o).filter((k) => o[k] !== undefined);
  const ka = keys(a), kb = keys(b);
  return ka.length === kb.length && ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && equal(a[k], b[k]));
}
function thrown(fn) {
  try { fn(); } catch (error) { return { error }; }
  return null;
}
function throwMatches(error, expected) {
  if (expected === undefined) return true;
  if (typeof expected === 'function') return error instanceof expected;
  const message = error instanceof Error ? error.message : String(error);
  return expected instanceof RegExp ? expected.test(message) : message.includes(expected);
}
const MATCHERS = {
  toBe: (a, b) => [Object.is(a, b), `${show(a)} to be ${show(b)}`],
  toEqual: (a, b) => [equal(a, b), `${show(a)} to equal ${show(b)}`],
  toContain: (a, b) => [typeof a === 'string' ? a.includes(b) : Array.isArray(a) && a.includes(b), `${show(a)} to contain ${show(b)}`],
  toHaveLength: (a, n) => [a != null && a.length === n, `length ${a?.length} to be ${n}`],
  toBeNull: (a) => [a === null, `${show(a)} to be null`],
  toBeDefined: (a) => [a !== undefined, `${show(a)} to be defined`],
  toBeGreaterThan: (a, b) => [a > b, `${show(a)} > ${show(b)}`],
  toBeLessThan: (a, b) => [a < b, `${show(a)} < ${show(b)}`],
  toBeLessThanOrEqual: (a, b) => [a <= b, `${show(a)} <= ${show(b)}`],
  toBeCloseTo: (a, b, digits = 2) => [Math.abs(a - b) < 10 ** -digits / 2, `${show(a)} close to ${show(b)} (${digits} digits)`],
  toMatch: (a, re) => [typeof a === 'string' && (re instanceof RegExp ? re.test(a) : a.includes(re)), `${show(a)} to match ${String(re)}`],
  toThrow: (fn, expected) => {
    const t = thrown(fn);
    return [t !== null && throwMatches(t.error, expected), t ? `thrown ${show(t.error?.message ?? t.error)} to match ${String(expected?.name ?? expected)}` : 'a throw'];
  },
};
function expect(actual, message) {
  const build = (negate) => Object.fromEntries(Object.entries(MATCHERS).map(([name, matcher]) => [name, (...args) => {
    const [pass, said] = matcher(actual, ...args);
    if (pass === negate) throw new Error(`${message ? `${message}: ` : ''}expected ${negate ? 'not ' : ''}${said}`);
  }]));
  const out = build(false);
  out.not = build(true);
  out.rejects = {
    toThrow: async (expected) => {
      try { await actual; } catch (error) {
        if (throwMatches(error, expected)) return;
        throw new Error(`expected rejection ${show(error?.message)} to match ${String(expected?.name ?? expected)}`);
      }
      throw new Error('expected a rejection');
    },
  };
  return out;
}

const FIXTURES = fileURLToPath(new URL('./fixtures/midi/', import.meta.url));
const fixture = (name) => new Uint8Array(readFileSync(FIXTURES + name));

// --- midiParse.test.ts: the MIDI reader and the note-track merge -------------------------------------------

function varlen(value) {
  const out = [value & 0x7f];
  let rest = value >> 7;
  while (rest > 0) {
    out.unshift((rest & 0x7f) | 0x80);
    rest >>= 7;
  }
  return out;
}
function chunk(name, body) {
  const id = [...name].map((c) => c.charCodeAt(0));
  const n = body.length;
  return [...id, (n >> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff, ...body];
}
function buildMidiTracks(tracks, division = 480, format = 1) {
  const header = chunk('MThd', [0, format, 0, tracks.length, (division >> 8) & 0xff, division & 0xff]);
  const bodies = tracks.flatMap((events) =>
    chunk('MTrk', [...events.flatMap((event) => [...varlen(event.delta), ...event.bytes]), ...varlen(0), 0xff, 0x2f, 0x00]),
  );
  return new Uint8Array([...header, ...bodies]);
}
const trackName = (name) => [0xff, 0x03, name.length, ...[...name].map((c) => c.charCodeAt(0))];
const setTempo = (micros) => [0xff, 0x51, 0x03, (micros >> 16) & 0xff, (micros >> 8) & 0xff, micros & 0xff];
const timeSignature = (beats, power) => [0xff, 0x58, 0x04, beats, power, 24, 8];
const keySignature = (sharps) => [0xff, 0x59, 0x02, sharps & 0xff, 0];
const noteOn = (midi, velocity = 64) => [0x90, midi, velocity];
const noteOff = (midi) => [0x80, midi, 0];
const starts = (events) => events.map((event) => fracToString(event.start));

describe('the MIDI reader', () => {
  const file = buildMidiTracks([
    [
      { delta: 0, bytes: trackName('conductor') },
      { delta: 0, bytes: setTempo(500_000) },
      { delta: 0, bytes: timeSignature(3, 2) },
      { delta: 0, bytes: keySignature(-2) },
    ],
    [
      { delta: 0, bytes: trackName('the music') },
      { delta: 0, bytes: noteOn(60) },
      { delta: 480, bytes: noteOff(60) },
      { delta: 0, bytes: noteOn(62) },
      { delta: 240, bytes: noteOn(62, 0) },
      { delta: 0, bytes: noteOn(64) },
      { delta: 480, bytes: noteOn(64) },
      { delta: 480, bytes: noteOff(64) },
      { delta: 0, bytes: noteOn(67) },
    ],
  ]);

  it('reads onsets and releases in quarter notes, not in ticks', () => {
    const events = readMidi(file).tracks[1]?.events ?? [];
    expect(starts(events)).toEqual(['0', '1', '3/2', '5/2', '7/2']);
    expect(events.map((event) => event.midi)).toEqual([60, 62, 64, 64, 67]);
    expect(events.map((event) => fracToString(event.end))).toEqual(['1', '3/2', '5/2', '7/2', '15/4']);
  });

  it('takes the tempo, the metre and the key signature from the conductor track', () => {
    const contents = readMidi(file);
    expect(contents.tempo).toBe(120);
    expect(contents.timeSignature).toEqual({ beats: 3, beatType: 4 });
    expect(contents.hadTimeSignature).toBe(true);
    expect(contents.keySignatures).toEqual(['2 flats']);
    expect(contents.tracks[0]?.name).toBe('conductor');
    expect(contents.tracks[1]?.name).toBe('the music');
  });

  it('names the one track with the notes in it', () => {
    expect(trackWithTheNotes(readMidi(file))).toBe(1);
    expect(readMidi(file).tracks[0]?.events).toEqual([]);
  });

  it('gives a note still down at the end of the track a length rather than dropping it', () => {
    const last = readMidi(file).tracks[1]?.events.at(-1);
    expect(last?.midi).toBe(67);
    expect(toNumber(sub(last?.end ?? frac(0), last?.start ?? frac(0)))).toBeCloseTo(0.25, 9);
  });

  it('follows running status, where a message leaves its status byte out', () => {
    const running = buildMidiTracks([
      [
        { delta: 0, bytes: noteOn(60) },
        { delta: 240, bytes: [62, 64] },
        { delta: 240, bytes: [60, 0] },
        { delta: 0, bytes: [62, 0] },
      ],
    ]);
    const events = readMidi(running).tracks[0]?.events ?? [];
    expect(events.map((event) => event.midi)).toEqual([60, 62]);
    expect(starts(events)).toEqual(['0', '1/2']);
  });

  it('skips a SysEx block by its own length instead of reading it as notes', () => {
    const sysex = buildMidiTracks([
      [
        { delta: 0, bytes: [0xf0, 0x04, 0x7e, 0x7f, 0x09, 0x01] },
        { delta: 0, bytes: noteOn(72) },
        { delta: 480, bytes: noteOff(72) },
      ],
    ]);
    expect((readMidi(sysex).tracks[0]?.events ?? []).map((event) => event.midi)).toEqual([72]);
  });

  it('says what is wrong with a file that is not MIDI at all', () => {
    const text = new TextEncoder().encode('this is not a MIDI file, it is a sentence.');
    expect(() => readMidi(text)).toThrow(MidiReadError);
    expect(() => readMidi(text)).toThrow(/does not start with a MIDI header/);
  });

  it('tells a truncated MIDI file apart from a file that is not MIDI', () => {
    const header = new Uint8Array([0x4d, 0x54, 0x68, 0x64]);
    expect(() => readMidi(header)).toThrow(/stops inside its header/);
    expect(() => readMidi(header)).toThrow(/copy it again/);
  });

  it('assumes four four when the file states no metre, and says it assumed', () => {
    const bare = buildMidiTracks([[{ delta: 0, bytes: noteOn(60) }, { delta: 480, bytes: noteOff(60) }]]);
    const contents = readMidi(bare);
    expect(contents.hadTimeSignature).toBe(false);
    expect(contents.timeSignature).toEqual({ beats: 4, beatType: 4 });
    expect(contents.tempo).toBeNull();
  });

  it('measures a bar and a beat the way music21 does, compound metres included', () => {
    expect(fracToString(barLengthOf({ beats: 4, beatType: 4 }))).toBe('4');
    expect(fracToString(beatLengthOf({ beats: 4, beatType: 4 }))).toBe('1');
    expect(fracToString(barLengthOf({ beats: 6, beatType: 8 }))).toBe('3');
    expect(fracToString(beatLengthOf({ beats: 6, beatType: 8 }))).toBe('3/2');
    expect(fracToString(beatLengthOf({ beats: 7, beatType: 8 }))).toBe('1/2');
    expect(fracToString(beatLengthOf({ beats: 2, beatType: 2 }))).toBe('2');
  });
});

describe('merging the note tracks', () => {
  const twoHands = buildMidiTracks([
    [{ delta: 0, bytes: timeSignature(4, 2) }],
    [
      { delta: 0, bytes: trackName('Right hand') },
      { delta: 0, bytes: noteOn(72) },
      { delta: 240, bytes: noteOff(72) },
      { delta: 0, bytes: noteOn(74) },
      { delta: 240, bytes: noteOff(74) },
    ],
    [
      { delta: 0, bytes: trackName('Left hand') },
      { delta: 0, bytes: noteOn(48) },
      { delta: 480, bytes: noteOff(48) },
    ],
  ]);

  it('keeps every note of every track and orders them by onset', () => {
    const merged = mergeNoteTracks(readMidi(twoHands));
    expect(merged.merged).toBe(2);
    expect(merged.names).toEqual(['Right hand', 'Left hand']);
    expect(merged.events).toHaveLength(3);
    expect(merged.events.map((event) => event.midi)).toEqual([48, 72, 74]);
    expect(starts(merged.events)).toEqual(['0', '0', '1/2']);
  });

  it('is the only reading that merges: the tracks on their own are still two', () => {
    const contents = readMidi(twoHands);
    const withNotes = contents.tracks.filter((track) => track.events.length > 0);
    expect(withNotes.map((track) => track.events.length)).toEqual([2, 1]);
    expect(trackWithTheNotes(contents)).toBe(-1);
  });

  it('leaves a single note track alone and says nothing was merged', () => {
    const one = buildMidiTracks([
      [{ delta: 0, bytes: timeSignature(4, 2) }],
      [{ delta: 0, bytes: noteOn(60) }, { delta: 480, bytes: noteOff(60) }],
    ]);
    const merged = mergeNoteTracks(readMidi(one));
    expect(merged.merged).toBe(1);
    expect(merged.events).toHaveLength(1);
    expect(merged.name).toBe('Part 2');
  });

  it('keeps the file order of two notes struck at the same instant on the same pitch', () => {
    const doubled = buildMidiTracks([
      [{ delta: 0, bytes: noteOn(60) }, { delta: 480, bytes: noteOff(60) }],
      [{ delta: 0, bytes: noteOn(60) }, { delta: 240, bytes: noteOff(60) }],
    ]);
    const merged = mergeNoteTracks(readMidi(doubled));
    expect(merged.events).toHaveLength(2);
    expect(merged.events.map((event) => fracToString(event.end))).toEqual(['1', '1/2']);
  });
});

// --- midiHandSplit.test.ts: the hand split -------------------------------------------------------------------

const ev = (start, end, midi, velocity = 64) => ({
  start: limitDenominator(start, 1000),
  end: limitDenominator(end, 1000),
  midi,
  velocity,
});
const at = (start, midi) => `${fracToString(limitDenominator(start, 1000))}:${String(midi)}`;
const placed = (events) => events.map((event) => `${fracToString(event.start)}:${String(event.midi)}`);
function crossingLines() {
  const events = [];
  for (let i = 0; i < 24; i += 1) {
    events.push(ev(i * 0.5, i * 0.5 + 0.4, 48 + i));
    events.push(ev(i * 0.5 + 0.25, i * 0.5 + 0.65, 72 - i));
  }
  return events;
}

describe('the hand split', () => {
  it('lands every note in exactly one hand', () => {
    const events = [];
    for (let i = 0; i < 40; i += 1) events.push(ev(i * 0.5, i * 0.5 + 0.5, 48 + ((i * 5) % 40)));
    const split = splitHands(events);
    expect([...placed(split.right), ...placed(split.left)].sort()).toEqual(placed(events).sort());
  });

  it('moves the boundary, which a fixed middle C cannot', () => {
    const events = [];
    for (let i = 0; i < 16; i += 1) {
      events.push(ev(i * 0.5, i * 0.5 + 0.5, 48 + i));
      events.push(ev(i * 0.5, i * 0.5 + 0.5, 72 + i));
    }
    const split = splitHands(events);
    const boundaries = new Set(split.boundary.map(([, value]) => fracToString(value)));
    expect(boundaries.size).toBeGreaterThan(1);
    expect(split.right.every((event) => event.midi >= 72)).toBe(true);
    expect(split.left.every((event) => event.midi < 72)).toBe(true);
  });

  it('keeps each crossing line in its hand until they meet', () => {
    const left = new Set(placed(splitHands(crossingLines()).left));
    for (let i = 0; i < 12; i += 1) {
      expect(left.has(at(i * 0.5, 48 + i))).toBe(true);
      expect(left.has(at(i * 0.5 + 0.25, 72 - i))).toBe(false);
    }
  });

  it('where it fails: the two lines swap hands at the crossing', () => {
    const left = new Set(placed(splitHands(crossingLines()).left));
    for (let i = 13; i < 24; i += 1) {
      expect(left.has(at(i * 0.5, 48 + i))).toBe(false);
      expect(left.has(at(i * 0.5 + 0.25, 72 - i))).toBe(true);
    }
  });

  it('where it fails: a simultaneous crossing takes the lower as the left', () => {
    const events = [];
    for (let i = 0; i < 12; i += 1) {
      events.push(ev(i * 0.5, i * 0.5 + 0.5, 54 + i));
      events.push(ev(i * 0.5, i * 0.5 + 0.5, 66 - i));
    }
    const split = splitHands(events);
    for (const onset of new Set(events.map((event) => fracToString(event.start)))) {
      const left = split.left.filter((e) => fracToString(e.start) === onset).map((e) => e.midi);
      const right = split.right.filter((e) => fracToString(e.start) === onset).map((e) => e.midi);
      if (left.length > 0 && right.length > 0) expect(Math.max(...left)).toBeLessThan(Math.min(...right));
    }
    // (and the split is a split: both hands have notes, or the check above would hold of nothing)
    expect(split.left.length).toBeGreaterThan(0);
    expect(split.right.length).toBeGreaterThan(0);
  });

  it('does not ask a hand to span more than its reach', () => {
    const split = splitHands([48, 55, 60, 64, 67].map((midi) => ev(0, 1, midi)));
    for (const side of [split.left, split.right]) {
      const pitches = side.map((event) => event.midi);
      if (pitches.length > 0) expect(Math.max(...pitches) - Math.min(...pitches)).toBeLessThanOrEqual(HAND_SPAN_SEMITONES);
    }
    expect(split.left.length).toBeGreaterThan(0);
    expect(split.right.length).toBeGreaterThan(0);
  });

  it('pays the reach penalty rather than take the closer cut', () => {
    const split = splitHands([40, 60, 62, 64, 66].map((midi) => ev(0, 1, midi)));
    expect(split.left.map((event) => event.midi)).toEqual([40]);
    expect(split.right.map((event) => event.midi)).toEqual([60, 62, 64, 66]);
  });
});

// --- midiQuantise.test.ts: the quantisation policy -----------------------------------------------------------

describe('snapping', () => {
  it('puts a value on the nearest multiple of the unit, halves going up', () => {
    expect(fracToString(snap(frac(7, 24), frac(1, 4)))).toBe('1/4');
    expect(fracToString(snap(frac(1, 8), frac(1, 4)))).toBe('1/4');
    expect(fracToString(snap(frac(5, 3), frac(1, 3)))).toBe('5/3');
    expect(fracToString(snap(frac(0), frac(1, 4)))).toBe('0');
  });
});

describe('the quantise policy', () => {
  it('chooses one grid per bar, not one per note and not one per piece', () => {
    const events = [];
    for (let i = 0; i < 6; i += 1) events.push(ev(i / 3, i / 3 + 0.3, 60 + i));
    events.push(ev(1.98, 2.3, 72));
    for (let i = 0; i < 16; i += 1) events.push(ev(4 + i / 4, 4 + i / 4 + 0.2, 60 + i));
    const report = quantise(events, { bars: FOUR_FOUR, beat: frac(1), divisors: [4, 3], swing: false });
    expect(fracToString(report.gridByBar[0] ?? frac(0))).toBe('1/3');
    expect(fracToString(report.gridByBar[1] ?? frac(0))).toBe('1/4');
    for (const event of report.events) {
      const bar = Math.floor(Number(event.start.n) / Number(event.start.d) / 4);
      const unit = report.gridByBar[bar] ?? frac(1, 4);
      expect(isZero(mod(event.start, unit))).toBe(true);
    }
  });

  it('gives a note shorter than the grid one unit rather than dropping it', () => {
    const report = quantise([ev(0, 0.02, 60)], { bars: FOUR_FOUR, beat: frac(1), divisors: [4], swing: false });
    const kept = report.events[0];
    expect(kept && fracToString(kept.end)).toBe('1/4');
  });

  it('detects swung eighths and writes them straight', () => {
    const events = [];
    for (let beat = 0; beat < 8; beat += 1) {
      events.push(ev(beat, beat + 0.6, 60));
      events.push(ev(beat + 2 / 3, beat + 1, 64));
    }
    expect(detectSwing(events, frac(1)).swung).toBe(true);
    const report = quantise(events, { bars: FOUR_FOUR, beat: frac(1), divisors: [4, 3], swing: null });
    const offbeats = report.events.map((event) => mod(event.start, frac(1))).filter((position) => !isZero(position));
    expect(offbeats.length).toBeGreaterThan(0);
    for (const position of offbeats) expect(fracToString(position)).toBe('1/2');
  });

  it('does not call a straight run swung', () => {
    const events = [];
    for (let beat = 0; beat < 8; beat += 1) {
      events.push(ev(beat, beat + 0.5, 60));
      events.push(ev(beat + 0.5, beat + 1, 64));
    }
    expect(detectSwing(events, frac(1)).swung).toBe(false);
  });

  it('pulls apart two strikes of one pitch the grid put on one onset', () => {
    const report = quantise([ev(0, 0.24, 60), ev(0.05, 0.9, 60)], { bars: FOUR_FOUR, beat: frac(1), divisors: [4], swing: false });
    expect(report.events).toHaveLength(2);
    expect(report.events.map((event) => fracToString(event.start)).sort()).toEqual(['0', '1/4']);
  });

  it('reports the furthest an onset was moved', () => {
    const report = quantise([ev(0, 1, 60), ev(1.1, 2, 62)], { bars: FOUR_FOUR, beat: frac(1), divisors: [4], swing: false });
    expect(fracToString(report.moved)).toBe('1/10');
  });
});

// --- midiRhythm.test.ts: durations that are rhythms, and the slices built from them ----------------------------

const total = (pieces) => pieces.reduce((sum, piece) => add(sum, piece), ZERO);

describe('what one note-head can carry', () => {
  it('admits a dotted eighth and a triplet eighth', () => {
    expect(isNotatable(frac(3, 4))).toBe(true);
    expect(isNotatable(frac(1, 3))).toBe(true);
    expect(isNotatable(frac(1, 12))).toBe(true);
  });
  it('refuses five twelfths and five sixteenths', () => {
    expect(isNotatable(frac(5, 12))).toBe(false);
    expect(isNotatable(frac(5, 16))).toBe(false);
  });
  it('refuses a length with two dots, and a zero or negative one', () => {
    expect(isNotatable(frac(7, 2))).toBe(false);
    expect(isNotatable(frac(0))).toBe(false);
    expect(isNotatable(frac(-1))).toBe(false);
  });
  it('admits the long values a whole bar can need', () => {
    expect(isNotatable(frac(4))).toBe(true);
    expect(isNotatable(frac(6))).toBe(true);
    expect(isNotatable(frac(3))).toBe(true);
  });
});

describe('cutting a length into rhythms', () => {
  it('loses nothing, and every piece is a rhythm', () => {
    const cases = [
      [frac(0), frac(5, 12), frac(1, 12)],
      [frac(1, 4), frac(5, 16), frac(1, 4)],
      [frac(1, 2), frac(7, 12), frac(1, 12)],
    ];
    for (const [start, length, unit] of cases) {
      const pieces = notatablePieces(start, length, unit, frac(1));
      expect(fracToString(total(pieces))).toBe(fracToString(length));
      for (const piece of pieces) expect(isNotatable(piece)).toBe(true);
    }
  });
  it('cuts at the next beat first, because a note tied across a beat reads', () => {
    const pieces = notatablePieces(frac(3, 4), frac(5, 4), frac(1, 4), frac(1));
    expect(pieces.map(fracToString)).toEqual(['1/4', '1']);
    expect(eq(total(pieces), frac(5, 4))).toBe(true);
  });
  it('hands back a length the grid cannot express rather than altering it', () => {
    const pieces = notatablePieces(frac(0), frac(5, 7), frac(1, 7), frac(1));
    expect(pieces.map(fracToString)).toEqual(['5/7']);
    expect(isNotatable(pieces[0] ?? frac(0))).toBe(false);
  });
});

describe('cutting the line into chords', () => {
  it('cuts a held note on a triplet grid into rhythms and ties them', () => {
    expect(isNotatable(frac(5, 3))).toBe(false);
    const events = [ev(0, 5 / 3, 48), ev(5 / 3, 7 / 3, 55)];
    const line = sliceIntoChords(events, FOUR_FOUR, () => frac(1, 3));
    expect(line.length).toBeGreaterThan(events.length);
    expect(fracToString(total(line.map((slice) => slice.length)))).toBe('7/3');
    for (const slice of line) expect(isNotatable(slice.length)).toBe(true);
  });
  it('ties the pieces of one held note and leaves a struck one alone', () => {
    const line = sliceIntoChords([ev(0, 5 / 3, 48), ev(5 / 3, 7 / 3, 55)], FOUR_FOUR, () => frac(1, 3));
    const held = line.filter((slice) => slice.notes.some((note) => note.midi === 48));
    expect(held.length).toBeGreaterThan(1);
    expect(held[0]?.notes[0]?.tie).toBe('start');
    expect(held.at(-1)?.notes[0]?.tie).toBe('stop');
    const struck = line.filter((slice) => slice.notes.some((note) => note.midi === 55));
    expect(struck.every((slice) => slice.notes.every((note) => note.tie !== 'stop'))).toBe(true);
  });
  it('puts a barline between two slices rather than letting a chord cross one', () => {
    const line = sliceIntoChords([ev(3, 5, 60)], FOUR_FOUR, () => frac(1, 4));
    expect(line.map((slice) => fracToString(slice.at))).toEqual(['3', '4']);
    expect(line[0]?.notes[0]?.tie).toBe('start');
    expect(line[1]?.notes[0]?.tie).toBe('stop');
  });
});

// --- midiWriter.test.ts: what the MusicXML writer had to grow for the import ------------------------------------

const wnote = (over = {}) => ({ midi: 60, duration: DIVISIONS, type: 'quarter', ...over });

describe('a note-head for a length', () => {
  it('names the plain values', () => {
    expect(noteShape(DIVISIONS * 4)).toEqual({ type: 'whole', dotted: false });
    expect(noteShape(DIVISIONS)).toEqual({ type: 'quarter', dotted: false });
    expect(noteShape(DIVISIONS / 4)).toEqual({ type: '16th', dotted: false });
  });
  it('names the dotted ones', () => {
    expect(noteShape(DIVISIONS * 1.5)).toEqual({ type: 'quarter', dotted: true });
    expect(noteShape(DIVISIONS * 0.75)).toEqual({ type: 'eighth', dotted: true });
  });
  it('names a triplet with the claim that makes it one', () => {
    expect(noteShape(DIVISIONS / 3)).toEqual({ type: 'eighth', dotted: false, tuplet: { actual: 3, normal: 2 } });
    expect(noteShape(DIVISIONS / 12)).toEqual({ type: '32nd', dotted: false, tuplet: { actual: 3, normal: 2 } });
    expect(noteShape(DIVISIONS / 8)).toEqual({ type: '32nd', dotted: false });
    expect(noteShape(DIVISIONS / 6)).toEqual({ type: '16th', dotted: false, tuplet: { actual: 3, normal: 2 } });
  });
  it('answers null for a length no note-head carries', () => {
    expect(noteShape(5)).toBeNull();
    expect(noteShape(DIVISIONS * 7)).toBeNull();
  });
});

describe('spelling a pitch class', () => {
  it('sets the octave from the letter, not from the MIDI number', () => {
    expect(spelledPitch(60, { step: 'B', alter: 1 })).toEqual({ step: 'B', alter: 1, octave: 3 });
    expect(spelledPitch(60, { step: 'C', alter: 0 })).toEqual({ step: 'C', alter: 0, octave: 4 });
    expect(spelledPitch(59, { step: 'C', alter: -1 })).toEqual({ step: 'C', alter: -1, octave: 4 });
  });
  it('writes the spelling the key asked for, whatever the signature says', () => {
    const xml = writeMusicXml({
      title: 'spelling', fifths: 0, beats: 4, beatType: 4, bpm: 120, staves: 1,
      spelling: { 3: { step: 'E', alter: -1 }, 6: { step: 'F', alter: 1 } },
      measures: [{ notes: [wnote({ midi: 63 }), wnote({ midi: 66 })] }],
    });
    expect(xml).toContain('<step>E</step>');
    expect(xml).toContain('<alter>-1</alter>');
    expect(xml).toContain('<step>F</step>');
    expect(xml).toContain('<alter>1</alter>');
  });
});

describe('a two-staff part', () => {
  const xml = writeMusicXml({
    title: 'two hands', partName: 'Piano', composer: 'Nobody in particular',
    fifths: -1, beats: 3, beatType: 4, bpm: null, staves: 2,
    measures: [
      {
        notes: [
          wnote({ midi: 72, staff: 1, tie: 'start', duration: DIVISIONS * 3, type: 'half', dotted: true }),
          wnote({ midi: 48, staff: 2, voice: 2 }),
          wnote({ midi: 52, staff: 2, voice: 2, chord: true }),
          wnote({ midi: null, staff: 2, voice: 2, duration: DIVISIONS * 2, type: 'half' }),
        ],
      },
      {
        notes: [
          wnote({ midi: 72, staff: 1, tie: 'stop', duration: DIVISIONS * 3, type: 'half', dotted: true }),
          wnote({ midi: 48, staff: 2, voice: 2, duration: DIVISIONS * 3, type: 'half', dotted: true }),
        ],
      },
    ],
  });
  it('is one instrument on two staves, which is what a piano is', () => {
    expect(xml.match(/<score-part /g)).toHaveLength(1);
    expect(xml).toContain('<staves>2</staves>');
    expect(xml).toContain('<clef number="2"><sign>F</sign><line>4</line></clef>');
  });
  it('goes back to the other staff by exactly what the first one used', () => {
    expect(xml).toContain(`<backup><duration>${String(DIVISIONS * 3)}</duration></backup>`);
  });
  it('writes both halves of a tie, the sound and the engraving', () => {
    expect(xml).toContain('<tie type="start"/>');
    expect(xml).toContain('<tied type="start"/>');
    expect(xml).toContain('<tie type="stop"/>');
    expect(xml).toContain('<tied type="stop"/>');
  });
  it('writes no tempo when the source states none, and does name the composer', () => {
    expect(xml).not.toContain('<sound tempo=');
    expect(xml).not.toContain('<metronome>');
    expect(xml).toContain('<creator type="composer">Nobody in particular</creator>');
  });
});

// --- midiHands.test.ts: which hand a note is in, and who decided -------------------------------------------------

const CROSSED = fixture('crossed-hands.mid');
const TOP_OF_THE_CROSSING = 81;
const UNDER_THE_CROSSING = 52;

function convertFixture(bytes, hands) {
  const conversion = convertMidi(bytes, { title: 'fixture', ...(hands === undefined ? {} : { hands }) });
  const read = readBackMusicXml(conversion.xml, barLengthOf(readMidi(bytes).timeSignature));
  const staffOf = (midi) => read.notes.find((note) => note.midi === midi)?.part;
  return { ...conversion, staffOf };
}
function noteTrack(name, notes) {
  const stamped = [];
  for (const [onset, length, midi] of notes) {
    stamped.push([Math.round(onset * 480), [0x90, midi, 72]]);
    stamped.push([Math.round((onset + length) * 480), [0x80, midi, 0]]);
  }
  stamped.sort((a, b) => a[0] - b[0]);
  const body = [...varlen(0), 0xff, 0x03, name.length, ...[...name].map((c) => c.charCodeAt(0))];
  let now = 0;
  for (const [when, bytes] of stamped) {
    body.push(...varlen(when - now), ...bytes);
    now = when;
  }
  body.push(...varlen(0), 0xff, 0x2f, 0x00);
  return chunk('MTrk', body);
}
function buildMidi(tracks) {
  const conductor = chunk('MTrk', [...varlen(0), 0xff, 0x58, 0x04, 4, 2, 24, 8, ...varlen(0), 0xff, 0x2f, 0x00]);
  const header = chunk('MThd', [0, 1, 0, tracks.length + 1, (480 >> 8) & 0xff, 480 & 0xff]);
  return new Uint8Array([...header, ...conductor, ...tracks.flat()]);
}

describe('two note tracks — the arrangement already said which hand', () => {
  it('keeps the file’s own tracks, first as the upper staff and second as the lower', () => {
    const { report, staffOf } = convertFixture(CROSSED);
    expect(report.noteTracks).toBe(2);
    expect(report.noteTrackNames).toEqual(['Piano', 'Piano']);
    expect(report.hands).toBe('2 as recorded');
    expect(report.parts).toEqual(['Piano', 'Piano']);
    expect(staffOf(TOP_OF_THE_CROSSING)).toBe(1);
    expect(staffOf(UNDER_THE_CROSSING)).toBe(0);
  });
  it('is a different answer from the split, on this same file', () => {
    const { report, staffOf } = convertFixture(CROSSED, 'split');
    expect(report.hands).toBe('split into two');
    expect(report.parts).toEqual(['Right hand', 'Left hand']);
    expect(staffOf(TOP_OF_THE_CROSSING)).toBe(0);
    expect(staffOf(UNDER_THE_CROSSING)).toBe(1);
  });
  it('loses no note either way, and every bar still adds up', () => {
    for (const hands of ['auto', 'split']) {
      const { report } = convertFixture(CROSSED, hands);
      expect(report.notesIn).toBe(18);
      expect(report.lost).toEqual([]);
      expect(report.added).toEqual([]);
      expect(report.brokenBars).toEqual([]);
      expect(report.passed).toBe(true);
    }
  });
  it('says so on the sheet, in the words "as recorded"', () => {
    const sentence = handsSentence(convertFixture(CROSSED).report);
    expect(sentence).toContain('kept as recorded');
    expect(sentence).toContain('the arrangement’s own answer');
    expect(sentence).not.toContain('merged');
    expect(sentence).not.toContain('shape of the lines');
    expect(sentence).not.toContain('crossing');
  });
});

describe('one note track — nobody has said which hand', () => {
  const oneTrack = buildMidi([
    noteTrack('Piano', [[0, 1, 72], [0, 4, 48], [1, 1, 74], [2, 1, 76], [3, 1, 77], [4, 4, 43], [4, 2, 79], [6, 2, 76]]),
  ]);
  it('splits it by the shape of the lines', () => {
    const { report } = convertFixture(oneTrack);
    expect(report.noteTracks).toBe(1);
    expect(report.hands).toBe('split into two');
    expect(report.parts).toEqual(['Right hand', 'Left hand']);
    expect(report.handMedian.left).toBeLessThan(report.handMedian.right ?? 0);
  });
  it('says on the sheet that the app decided, and where it is most often wrong', () => {
    const sentence = handsSentence(convertFixture(oneTrack).report);
    expect(sentence).toContain('shape of the lines');
    expect(sentence).toContain('crossing of the hands');
    expect(sentence).not.toContain('merged');
  });
});

describe('three or more note tracks — a voice per track, not a hand', () => {
  const threeTracks = buildMidi([
    noteTrack('Melody', [[0, 1, 76], [1, 1, 77], [2, 2, 79], [4, 4, 76]]),
    noteTrack('Inner', [[0, 2, 64], [2, 2, 65], [4, 4, 67]]),
    noteTrack('Bass', [[0, 4, 48], [4, 4, 43]]),
  ]);
  it('merges them and then splits, because the writer writes a piano', () => {
    const { report } = convertFixture(threeTracks);
    expect(report.noteTracks).toBe(3);
    expect(report.noteTrackNames).toEqual(['Melody', 'Inner', 'Bass']);
    expect(report.hands).toBe('split into two');
    expect(report.parts).toEqual(['Right hand', 'Left hand']);
    expect(report.passed).toBe(true);
  });
  it('says on the sheet that they were merged, and why', () => {
    const sentence = handsSentence(convertFixture(threeTracks).report);
    expect(sentence).toContain('3 tracks with notes in them (Melody, Inner, Bass)');
    expect(sentence).toContain('more than a piano’s two staves');
    expect(sentence).toContain('merged into one line first');
  });
  it('refuses rather than writing three staves when the caller insists on keeping them', () => {
    expect(() => convertFixture(threeTracks, 'keep')).toThrow(/two staves/);
  });
});

// --- midiImport.test.ts: a MIDI file picked from the app, at the converter's level --------------------------------
// The old cases went through importStore.addImport (IndexedDB, the import row, the in-memory conversion note).
// Here they go through what the library calls: `convert` and `midiConverter` (src/library/midi/index.ts).

const TWO_HANDS = fixture('two-hands.mid');

describe('importing a MIDI file', () => {
  it('writes the MusicXML a score is, titled from the file name', () => {
    const { xml } = convert(TWO_HANDS, { title: titleFromFilename('two-hands.mid') });
    expect(titleFromFilename('two-hands.mid')).toBe('two hands');
    expect(xml).toContain('<work-title>two hands</work-title>');
    expect(xml).toContain('<score-partwise');
    expect(xml).toContain('<staves>2</staves>');
    expect(xml.match(/<score-part /g)).toHaveLength(1);
  });
  it('leaves a note saying what the converter decided', () => {
    const { report, guessed } = convert(TWO_HANDS);
    expect(report.passed).toBe(true);
    expect(checkSentence(report)).toMatch(/^Checked: all \d+ notes/);
    expect(guessed.check.sentence).toContain('every bar adds up');
    expect(report.notesIn).toBe(16);
    expect(report.lost).toEqual([]);
    expect(report.added).toEqual([]);
    expect(report.brokenBars).toEqual([]);
  });
  it('keeps the two tracks the file was written with as the two hands', () => {
    const { report } = convert(TWO_HANDS);
    expect(report.noteTracks).toBe(2);
    expect(report.noteTrackNames).toEqual(['Right hand', 'Left hand']);
    expect(report.hands).toBe('2 as recorded');
    expect(report.parts).toEqual(['Right hand', 'Left hand']);
  });
  it('says on the sheet that the hands came from the file, not from the app', () => {
    const sentence = handsSentence(convert(TWO_HANDS).report);
    expect(sentence).toContain('kept as recorded');
    expect(sentence).toContain('the arrangement’s own answer');
    expect(sentence).not.toContain('merged into one line first');
  });
  it('reads the metre and the tempo out of the file', () => {
    const { report, xml } = convert(TWO_HANDS);
    expect(report.timeSignature).toBe('4/4');
    expect(xml).toContain('<beats>4</beats>');
    expect(xml).toContain('<sound tempo=');
  });
  it('says what is wrong with a MIDI file that has no notes in it', async () => {
    const header = [0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 1, 0, 1, 1, 0xe0];
    const track = [0x4d, 0x54, 0x72, 0x6b, 0, 0, 0, 0x0b, 0x00, 0xff, 0x51, 0x03, 0x07, 0xa1, 0x20, 0x00, 0xff, 0x2f, 0x00];
    const bytes = new Uint8Array([...header, ...track]);
    await expect(midiConverter(bytes.buffer, 'silent.mid')).rejects.toThrow(/silent\.mid: this MIDI file has no notes in it/);
    await expect(midiConverter(bytes.buffer, 'silent.mid')).rejects.toThrow(/Export it again with the piano part in it/);
  });
  it('refuses a file that is not MIDI, with a sentence', async () => {
    const bytes = new TextEncoder().encode('not a MIDI file at all');
    await expect(midiConverter(bytes.buffer, 'wrong.mid')).rejects.toThrow(/wrong\.mid: this file does not start with a MIDI header/);
  });
});
skip('the picker > offers .mid and .midi beside the score formats', 'old importStore.IMPORT_ACCEPT; the new library\'s picker is files.ts (ACCEPT), not this module');
skip('the picker > knows a MIDI file by either spelling of its extension', 'old importStore.kindForFilename; files.ts recognises a file by its bytes (MThd), not its name');
skip('importing a MIDI file > is in the Library at once', 'old importStore state (importsAddedSinceLoad); library storage is not this module');
skip('importing a MIDI file > stores nothing when the conversion refuses the file (the storage half)', 'storage is files.ts/store.ts; the refusal half is ported above');

// --- importSheet.test.ts, "swapping the hands" (the two cases that are about the converted score) -------------------

function twoStaves() {
  const note = (step, octave, staff) =>
    `<note><pitch><step>${step}</step><octave>${String(octave)}</octave></pitch><duration>4</duration><voice>${staff === 1 ? '1' : '5'}</voice><type>whole</type><staff>${String(staff)}</staff></note>`;
  const attributes =
    '<attributes><divisions>1</divisions><key><fifths>1</fifths></key>' +
    '<time><beats>4</beats><beat-type>4</beat-type></time><staves>2</staves>' +
    '<clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef></attributes>';
  const bar = (n) =>
    `<measure number="${String(n)}">${n === 1 ? attributes : ''}${note('E', 4, 1)}<backup><duration>4</duration></backup>${note('C', 3, 2)}</measure>`;
  return (
    '<?xml version="1.0" encoding="UTF-8"?><score-partwise version="4.0"><work><work-title>Two staves</work-title></work>' +
    '<identification><creator type="composer">A. Composer</creator></identification>' +
    `<part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1">${bar(1)}${bar(2)}</part></score-partwise>`
  );
}

describe('swapping the hands', () => {
  it('exchanges the two staves’ notes, keeps each staff’s clef, and swapping twice gives the file back', () => {
    const { xml } = convertMidi(fixture('left-hand-first.mid'), { title: 'Left hand first' });
    const swapped = swapHands(xml);
    if (!('xml' in swapped)) throw new Error(`refused: ${swapped.refused}`);
    const staves = (source) => [...source.matchAll(/<note>[\s\S]*?<\/note>/g)].map((n) => /<staff>(\d)<\/staff>/.exec(n[0])?.[1] ?? '');
    expect(staves(swapped.xml)).toEqual(staves(xml).map((staff) => (staff === '1' ? '2' : '1')));
    const clefs = (source) => [...source.matchAll(/<clef[^>]*>[\s\S]*?<\/clef>/g)].map((clef) => clef[0]);
    expect(clefs(swapped.xml)).toEqual(clefs(xml));
    const back = swapHands(swapped.xml);
    expect('xml' in back ? back.xml : back.refused).toBe(xml);
  });
  it('refuses what it cannot swap, and says why', () => {
    const oneStaff = twoStaves().replace('<staves>2</staves>', '').replace(/<staff>\d<\/staff>/g, '');
    expect(swapHands(oneStaff)).toEqual({ refused: 'One staff: there is no other hand to swap with.' });
    const twoParts = twoStaves().replace('</part></score-partwise>', '</part><part id="P2"></part></score-partwise>');
    expect(swapHands(twoParts)).toEqual({ refused: 'The file writes its hands as separate parts; the app swaps only a piano’s two staves.' });
    const unmarked = twoStaves().replace('<staff>2</staff></note>', '</note>');
    expect(swapHands(unmarked)).toEqual({ refused: 'The file does not say which staff every note is on, so the app cannot swap them.' });
  });
});
skip('importSheet.test.ts: every other case', 'the old import sheet UI, correctImportHands and stateImportTempo storage: old-app code not ported');

// --- new: the library's account of what was guessed (src/library/midi/index.ts) -----------------------------------

describe('what the library is told was guessed', () => {
  it('says where each answer came from: hands kept, tempo and metre from the file, key estimated', () => {
    const { guessed } = convert(TWO_HANDS);
    expect(guessed.hands.method).toBe('kept');
    expect(guessed.hands.swapped).toBe(false);
    expect(guessed.tempo.from).toBe('file');
    expect(guessed.time).toEqual({ beats: 4, beatType: 4, from: 'file', changes: 0, pickup: false });
    expect(guessed.key.from).toBe('estimated from the notes');
  });
  it('swaps the hands on request: the same bytes as swapHands on the plain conversion, and says so', () => {
    const plain = convert(fixture('left-hand-first.mid'));
    const swapped = convert(fixture('left-hand-first.mid'), { swapHands: true });
    const direct = swapHands(plain.xml);
    expect('xml' in direct ? direct.xml : direct.refused).toBe(swapped.xml);
    expect(swapped.guessed.hands.swapped).toBe(true);
    expect(swapped.guessed.hands.sentence).toContain('swapped');
  });
  it('a stated tempo replaces the file’s in what the player reads and what is printed; out of range is refused', () => {
    const { xml, guessed } = convert(TWO_HANDS, { bpm: 72 });
    expect(xml).toContain('<sound tempo="72"/>');
    expect(xml).toContain('<per-minute>72</per-minute>');
    expect(guessed.tempo).toEqual({ bpm: 72, from: 'stated' });
    expect(() => convert(TWO_HANDS, { bpm: 5 })).toThrow(/between 20 and 400/);
  });
  it('a swap with only one staff is refused and said, not silently ignored', () => {
    // One track kept as it is (the converter's `hands: 'keep'`): one staff. (Left to `auto`, one track is split.)
    const oneStaff = buildMidi([noteTrack('Piano', [[0, 1, 72], [1, 1, 74], [2, 2, 76]])]);
    const { guessed } = convert(oneStaff, { swapHands: true, convert: { hands: 'keep' } });
    expect(guessed.hands.method).toBe('kept');
    expect(guessed.hands.swapped).toBe(false);
    expect(guessed.hands.swapRefused).toBe('One staff: there is no other hand to swap with.');
  });
});

// --- midiParity.test.ts: the port against the Python converter's recorded answers ----------------------------------
// The references are the JSON files tools/midi-cleanup/tests/parity_reference.py wrote into build/midi-parity/
// (2026-09-29), copied to fixtures/midi/parity/ for the files committed to the old branch and the two rendered
// exercise files. The Python itself is not run here.

const PARITY = [
  ['two-hands', 'two-hands.mid'],
  ['crossed-hands', 'crossed-hands.mid'],
  ['one-track-two-hands', 'one-track-two-hands.mid'],
  ['rendered-clean', 'parity/rendered-clean.mid'],
  ['rendered-jitter35', 'parity/rendered-jitter35.mid'],
].map(([name, midi]) => ({ name, reference: JSON.parse(readFileSync(`${FIXTURES}parity/${name}.json`, 'utf8')), midi: fixture(midi) }));
const eventsOf = (events) => events.map((event) => [fracToString(event.start), fracToString(event.end), event.midi, event.velocity]);

describe('the port agrees with the Python converter', () => {
  it('has a reference to compare against', () => {
    expect(PARITY.length, 'no parity reference').toBeGreaterThan(0);
  });
  for (const { name, reference, midi } of PARITY) {
    describe(name, () => {
      const contents = readMidi(midi);
      const ts = { beats: reference.timeSignature[0], beatType: reference.timeSignature[1] };
      const barLength = barLengthOf(contents.timeSignature);
      const beat = beatLengthOf(contents.timeSignature);
      const flat = contents.tracks.filter((track) => track.events.length > 0).flatMap((track) => track.events);
      const report = quantise(flat, { bars: steadyBars(contents.timeSignature, frac(4096)), beat, divisors: [4, 3], swing: null });

      it('reads the same tracks, note for note', () => {
        expect(contents.tracks.map((track) => track.events.length)).toEqual(reference.tracks.map((track) => track.noteCount));
        expect(contents.tracks.map((track) => track.name)).toEqual(reference.tracks.map((track) => track.name));
        for (const [index, track] of contents.tracks.entries()) expect(eventsOf(track.events)).toEqual(reference.tracks[index]?.events ?? []);
      });
      it('reads the same metre, tempo and key signatures', () => {
        expect(contents.timeSignature).toEqual(ts);
        expect(contents.hadTimeSignature).toBe(reference.hadTimeSignature);
        if (reference.tempo === null) expect(contents.tempo).toBeNull();
        else expect(contents.tempo).toBeCloseTo(reference.tempo, 6);
        expect(contents.keySignatures).toEqual(reference.keySignatures);
      });
      it('chooses the same grid for every bar', () => {
        expect(report.gridByBar.map(fracToString)).toEqual(reference.gridByBar);
      });
      it('reaches the same verdict on swing, by the same counts', () => {
        expect(report.swing.swung).toBe(reference.swing.swung);
        expect(report.swing.nearSwung).toBe(reference.swing.near_swung);
        expect(report.swing.nearStraight).toBe(reference.swing.near_straight);
        expect(report.swing.onBeatShare).toBeCloseTo(reference.swing.on_beat_share, 9);
      });
      it('quantises every onset and release to the same place', () => {
        expect(eventsOf(report.events)).toEqual(reference.quantised);
        expect(fracToString(report.moved)).toBe(reference.moved);
      });

      const conversion = convertMidi(midi, { title: name, divisors: [4, 3], hands: reference.hands, respell: reference.respell, swing: null });

      it('decides the hands the same way, and says the same thing about them', () => {
        expect(conversion.report.hands).toBe(reference.handsReport);
        expect(conversion.report.parts).toEqual(reference.parts.map((part) => part.name));
      });
      it('estimates the same key and writes the same one', () => {
        expect(conversion.report.estimatedKey).toBe(reference.estimatedKey);
        expect(conversion.report.key).toBe(reference.key);
      });
      it('passes the same self-check: nothing lost, nothing added, every bar adding up', () => {
        expect(conversion.report.lost).toEqual(reference.lost);
        expect(conversion.report.added).toEqual(reference.added);
        expect(conversion.report.brokenBars).toEqual(reference.brokenBars);
        expect(conversion.report.unwritable).toEqual([]);
        expect(conversion.report.notesIn).toBe(reference.notesIn);
        expect(conversion.report.passed).toBe(true);
      });
      it('writes the same notes, in the same hands, for the same durations', () => {
        const read = readBackMusicXml(conversion.xml, barLength);
        const mine = read.notes.map((note) => [note.part, fracToString(note.at), note.midi, fracToString(note.length)]);
        expect(mine).toEqual(reference.sounding.map((row) => [row[0], row[1], row[2], row[3]]));
      });
      it.skipIf(reference.handSplit === null)('splits the hands the same way', () => {
        const split = splitHands(report.events);
        expect(eventsOf(split.right)).toEqual(reference.handSplit?.right ?? []);
        expect(eventsOf(split.left)).toEqual(reference.handSplit?.left ?? []);
        expect(split.boundary.map(([b, value]) => [fracToString(b), fracToString(value)])).toEqual(reference.handSplit?.boundary ?? []);
      });
    });
  }
});
skip('parity: the three MAESTRO performances (bach-bwv885, grieg-op38-7, scarlatti-k525)', 'recordings the old project deliberately never committed (build/midi-real, gitignored); not copied into web/');

// --- new (2026-10-14): bars from every time signature, not the first (src/library/midi/bars.ts) ---------------------
// Notation programs export a pickup as a short bar in its own metre (1/8, then 2/4), and pieces change metre. The
// converter used to lay the whole piece out in the first metre: ASAP's score MIDI of Beethoven Op. 111 i came out as
// 13,000 bars of 1/16.

describe('the bar map', () => {
  const q = (n, d = 1) => frac(n, d);
  it('makes a pickup written as its own short metre a short first bar, and calls it a pickup', () => {
    const bars = barMap([{ at: q(0), time: { beats: 1, beatType: 8 } }, { at: q(1, 2), time: { beats: 2, beatType: 4 } }], q(10));
    expect(bars.bars.slice(0, 3).map((b) => [fracToString(b.start), fracToString(b.length)])).toEqual([['0', '1/2'], ['1/2', '2'], ['5/2', '2']]);
    expect(bars.pickup).toBe(true);
    expect([bars.indexAt(q(0)), bars.indexAt(q(1, 2)), bars.indexAt(q(5, 2)), bars.indexAt(q(4))]).toEqual([0, 1, 2, 2]);
  });
  it('ends a bar where a metre change arrives inside it, and goes on in the new metre', () => {
    const bars = barMap([{ at: q(0), time: { beats: 4, beatType: 4 } }, { at: q(6), time: { beats: 3, beatType: 4 } }], q(12));
    expect(bars.bars.slice(0, 4).map((b) => [fracToString(b.start), fracToString(b.length)])).toEqual([['0', '4'], ['4', '2'], ['6', '3'], ['9', '3']]);
    expect(bars.pickup).toBe(false);
  });
  it('counts on in the last metre past the bars built, and gives 4/4 when the file states none', () => {
    const bars = barMap([{ at: q(0), time: { beats: 6, beatType: 8 } }], q(3));
    expect(bars.indexAt(q(30))).toBe(10);
    expect(fracToString(bars.bar(10).start)).toBe('30');
    expect(fracToString(bars.bar(10).beat)).toBe('3/2');
    expect(fracToString(barMap([], q(4)).bar(0).length)).toBe('4');
  });
});

describe('a file with a pickup bar and a later change of metre, converted', () => {
  // Conductor: 1/8 at 0 (the pickup), 2/4 from the eighth, 3/4 after two bars of 2/4.
  const file = buildMidiTracks([
    [
      { delta: 0, bytes: timeSignature(1, 3) },
      { delta: 240, bytes: timeSignature(2, 2) },
      { delta: 1920, bytes: timeSignature(3, 2) },
    ],
    [
      { delta: 0, bytes: noteOn(64) }, { delta: 240, bytes: noteOff(64) },
      ...[60, 62, 64, 65].flatMap((m) => [{ delta: 0, bytes: noteOn(m) }, { delta: 480, bytes: noteOff(m) }]),
      ...[67, 65, 64].flatMap((m) => [{ delta: 0, bytes: noteOn(m) }, { delta: 480, bytes: noteOff(m) }]),
    ],
  ]);
  const { xml, report } = convertMidi(file, { title: 'pickup' });
  it('reads every time signature with where it falls', () => {
    expect(readMidi(file).timeSignatures.map((t) => [fracToString(t.at), t.time.beats, t.time.beatType])).toEqual([['0', 1, 8], ['1/2', 2, 4], ['9/2', 3, 4]]);
  });
  it('writes the pickup as bar 0, implicit, in the metre of the bars after it', () => {
    expect(xml).toContain('<measure number="0" implicit="yes">');
    expect(/<time><beats>(\d+)<\/beats><beat-type>(\d+)<\/beat-type><\/time>/.exec(xml)?.slice(1)).toEqual(['2', '4']);
    expect(xml.includes('<beats>1</beats><beat-type>8</beat-type>')).toBe(false);
  });
  it('writes the 3/4 where it starts, and the converter’s own check passes', () => {
    const third = /<measure number="3"[^>]*>([\s\S]*?)<\/measure>/.exec(xml)?.[1] ?? '';
    expect(third).toContain('<time><beats>3</beats><beat-type>4</beat-type></time>');
    expect(report.brokenBars).toEqual([]);
    expect(report.lost).toEqual([]);
    expect(report.passed).toBe(true);
    expect(report.timeSignature).toBe('2/4 (changes 1 time) (with a pickup)');
  });
  it('puts each note in the bar and at the beat the file has it (read by the test’s own parser)', () => {
    expect(barsOf(xml).map((bar) => bar.map((n) => `${n.name}@${n.at}`).sort())).toEqual([
      ['E4@0'], ['C4@0', 'D4@1'], ['E4@0', 'F4@1'], ['E4@2', 'F4@1', 'G4@0'],
    ]);
  });
});

// --- new (2026-10-14): where every note lands, checked against the file as built ---------------------------------
// The converter's own check compares the score with the notes after it placed them, so it cannot see a note in the
// wrong place: with every note shifted an eighth late, all of its asserts still passed (test review, 2026-10-14).
// These read the written MusicXML with a parser of their own and compare each bar with what the file was built to
// hold: a pickup, 3/4, then 2/4; G major, then B♭ major; two hands; a run of 32nds.

/** Each bar's struck notes: staff, name (B♭4 as "Bb4"), onset and sounding length in quarters (ties joined). */
function barsOf(xml) {
  const divisions = Number(/<divisions>(\d+)<\/divisions>/.exec(xml)?.[1]);
  const q = (n) => { const g = (a, b) => (b ? g(b, a % b) : a); const d = g(n, divisions); return d === divisions ? String(n / divisions) : `${n / d}/${divisions / d}`; };
  const out = [];
  const open = new Map(); // staff:midi -> the note a tie carries on
  let barStart = 0;
  for (const [, body] of xml.matchAll(/<measure\b[^>]*>([\s\S]*?)<\/measure>/g)) {
    const bar = [];
    let pos = 0, last = 0, length = 0;
    for (const [whole] of body.matchAll(/<note>[\s\S]*?<\/note>|<backup>[\s\S]*?<\/backup>|<forward>[\s\S]*?<\/forward>/g)) {
      const dur = Number(/<duration>(\d+)<\/duration>/.exec(whole)?.[1] ?? 0);
      if (whole.startsWith('<backup>')) { pos -= dur; continue; }
      if (whole.startsWith('<forward>')) { pos += dur; length = Math.max(length, pos); continue; }
      const chord = whole.includes('<chord/>');
      const at = chord ? last : pos;
      if (!chord) { last = pos; pos += dur; length = Math.max(length, pos); }
      if (whole.includes('<rest/>')) continue;
      const step = /<step>([A-G])<\/step>/.exec(whole)[1], alter = Number(/<alter>(-?\d)<\/alter>/.exec(whole)?.[1] ?? 0);
      const octave = Number(/<octave>(\d)<\/octave>/.exec(whole)[1]), staff = Number(/<staff>(\d)<\/staff>/.exec(whole)?.[1] ?? 1);
      const voice = Number(/<voice>(\d+)<\/voice>/.exec(whole)?.[1] ?? 1), stem = /<stem>(\w+)<\/stem>/.exec(whole)?.[1];
      const name = `${step}${alter > 0 ? '#'.repeat(alter) : 'b'.repeat(-alter)}${octave}`;
      const key = `${staff}:${voice}:${name}`;
      if (whole.includes('<tie type="stop"/>') && open.has(key)) {
        const held = open.get(key);
        held.ticks += dur;
        held.len = q(held.ticks);
        if (!whole.includes('<tie type="start"/>')) open.delete(key);
        continue;
      }
      const note = { staff, voice, stem, name, at: q(at), ticks: dur, len: q(dur), absolute: barStart + at };
      bar.push(note);
      if (whole.includes('<tie type="start"/>')) open.set(key, note);
    }
    out.push(bar);
    barStart += length;
  }
  return out;
}

describe('a two-hand file with a pickup, metre and key changes and 32nds, converted', () => {
  const T = 480; // ticks a quarter
  const notes = (list) => {
    const ev = [];
    for (const [midi, from, to] of list) ev.push([from, noteOn(midi)], [to, noteOff(midi)]);
    ev.sort((a, b) => a[0] - b[0] || (a[1][0] === 0x80 ? -1 : 1));
    let now = 0;
    return ev.map(([at, bytes]) => { const delta = at - now; now = at; return { delta, bytes }; });
  };
  // Bar 0 is the eighth before bar 1; bars 1–2 are 3/4 (1440 ticks), bar 3 is 2/4.
  const b1 = T / 2, b2 = b1 + 3 * T, b3 = b2 + 3 * T;
  const file = buildMidiTracks([
    [
      { delta: 0, bytes: timeSignature(1, 3) }, { delta: 0, bytes: [0xff, 0x59, 0x02, 1, 0] },
      { delta: b1, bytes: timeSignature(3, 2) },
      { delta: b3 - b1, bytes: timeSignature(2, 2) }, { delta: 0, bytes: [0xff, 0x59, 0x02, 0xfe, 0] },
    ],
    [{ delta: 0, bytes: trackName('Right') }, ...notes([
      [74, 0, b1], // D5, the pickup
      [79, b1, b1 + T], [81, b1 + T, b1 + T + 60], [83, b1 + T + 60, b1 + T + 120], [84, b1 + T + 120, b1 + T + 180], [86, b1 + T + 180, b1 + 2 * T],
      [88, b1 + 2 * T, b1 + 2 * T + T / 2], [78, b1 + 2 * T + T / 2, b2 + T / 2], // E6 an eighth on beat 3, F♯5 across the barline
      [79, b2 + T / 2, b3],
      [70, b3, b3 + T], [75, b3 + T, b3 + 2 * T], // B♭4, E♭5
    ])],
    [{ delta: 0, bytes: trackName('Left') }, ...notes([
      [55, b1, b1 + 2 * T], [50, b1 + 2 * T, b2], [43, b2, b3], [46, b3, b3 + 2 * T],
    ])],
  ]);
  const { xml } = convertMidi(file, { title: 'built' });
  const bars = barsOf(xml);
  const show = (bar) => bar.map((n) => `${n.staff}:${n.name}@${n.at}/${n.len}`).sort();
  it('writes every note in its bar, staff, beat and length, spelled from the key in force', () => {
    expect(bars.map(show)).toEqual([
      ['1:D5@0/1/2'],
      ['1:A5@1/1/8', '1:B5@9/8/1/8', '1:C6@5/4/1/8', '1:D6@11/8/5/8', '1:E6@2/1/2', '1:F#5@5/2/1', '1:G5@0/1', '2:D3@2/1', '2:G3@0/2'],
      ['1:G5@1/2/5/2', '2:G2@0/3'],
      ['1:Bb4@0/1', '1:Eb5@1/1', '2:Bb2@0/2'],
    ]);
  });
  it('has nothing in the score the file did not have, and every note of the file', () => {
    expect(bars.flat().length).toBe(15);
  });
  it('writes the pickup implicit, 3/4 and G major first, then 2/4 and B♭ major at bar 3', () => {
    expect(xml).toContain('<measure number="0" implicit="yes">');
    const first = /<measure number="0"[^>]*>([\s\S]*?)<\/measure>/.exec(xml)?.[1] ?? '';
    expect(first).toContain('<key><fifths>1</fifths></key>');
    expect(first).toContain('<time><beats>3</beats><beat-type>4</beat-type></time>');
    const third = /<measure number="3"[^>]*>([\s\S]*?)<\/measure>/.exec(xml)?.[1] ?? '';
    expect(third).toContain('<key><fifths>-2</fifths></key>');
    expect(third).toContain('<time><beats>2</beats><beat-type>4</beat-type></time>');
  });
});

// --- new (2026-10-14): a melody over moving notes in one hand, written as two voices ------------------------------
// Before, every staff was one line of chords: the half-note melody here came out cut into eighths and tied, with the
// tune inside the chords (as Chopin's Op. 10 No. 3 did).

describe('a melody held over moving notes in one hand, converted', () => {
  const T = 480;
  const line = (list, shift = () => 0) => {
    const ev = [];
    list.forEach(([midi, from, to], i) => { ev.push([from + shift(i), [0x90, midi, 64]], [to + shift(i), [0x80, midi, 0]]); });
    ev.sort((a, b) => a[0] - b[0] || (a[1][0] === 0x80 ? -1 : 1));
    let now = 0;
    return ev.map(([at, bytes]) => { const delta = Math.max(0, at - now); now = Math.max(now, at); return { delta, bytes }; });
  };
  const right = [
    [76, 0, 2 * T], [74, 2 * T, 4 * T], // the melody: E5, D5, half notes
    ...[67, 69, 67, 69, 67, 69, 67, 69].map((m, i) => [m, i * T / 2, (i + 1) * T / 2]), // under it: G4 A4 eighths
    [72, 4 * T, 5 * T], [76, 4 * T, 5 * T], [72, 5 * T, 6 * T], [76, 5 * T, 6 * T], [71, 6 * T, 8 * T], [74, 6 * T, 8 * T], // bar 2: chords only
  ];
  const left = [[48, 0, 4 * T], [43, 4 * T, 8 * T]];
  const build = (shift) => buildMidiTracks([[{ delta: 0, bytes: timeSignature(4, 2) }], [{ delta: 0, bytes: trackName('Right') }, ...line(right, shift)], [{ delta: 0, bytes: trackName('Left') }, ...line(left, shift)]]);
  const { xml, report } = convertMidi(build(), { title: 'voices' });
  const bars = barsOf(xml);
  it('writes the melody as one voice, stems up, with no ties', () => {
    const top = bars[0].filter((n) => n.staff === 1 && n.voice === 1);
    expect(top.map((n) => `${n.name}@${n.at}/${n.len}:${n.stem}`)).toEqual(['E5@0/2:up', 'D5@2/2:up']);
    expect(xml.slice(0, xml.indexOf('<measure number="2"')).includes('<tie type="start"/>')).toBe(false);
  });
  it('writes the moving notes under it as a second voice, stems down', () => {
    const under = bars[0].filter((n) => n.staff === 1 && n.voice === 3);
    expect(under.map((n) => `${n.name}@${n.at}/${n.len}:${n.stem}`)).toEqual(['G4@0/1/2:down', 'A4@1/2/1/2:down', 'G4@1/1/2:down', 'A4@3/2/1/2:down', 'G4@2/1/2:down', 'A4@5/2/1/2:down', 'G4@3/1/2:down', 'A4@7/2/1/2:down']);
  });
  it('keeps chords whose notes end together as one voice, and leaves the second voice out of that bar', () => {
    expect(bars[1].filter((n) => n.staff === 1).map((n) => `${n.voice}:${n.name}@${n.at}`).sort()).toEqual(['1:B4@2', '1:C5@0', '1:C5@1', '1:D5@2', '1:E5@0', '1:E5@1']);
    const second = /<measure number="2"[^>]*>([\s\S]*?)<\/measure>/.exec(xml)?.[1] ?? '';
    expect(second.includes('<voice>3</voice>')).toBe(false);
  });
  it('every voice of every bar adds up, and the converter’s check passes', () => {
    expect(report.brokenBars).toEqual([]);
    expect(report.passed).toBe(true);
  });
  it('gives a note held under a moving melody a third voice, leaving the moving notes theirs (owner: up to 3)', () => {
    // Bar 1 of Chopin's Op. 10 No. 3 in small: melody E4 D♯4 E4 then F♯4 held; a D♯4 held under it from beat 2;
    // sixteenths G♯3 B3 underneath all bar.
    const three = buildMidiTracks([[{ delta: 0, bytes: timeSignature(2, 2) }], [{ delta: 0, bytes: trackName('Right') }, ...line([
      [64, 0, T / 2], [63, T / 2, 3 * T / 4], [64, 3 * T / 4, T], [66, T, 7 * T / 4], // the melody (F♯4 let go before the bar ends)
      [63, T, 2 * T], // held under it to the barline: another length, so not one chord with the F♯4
      ...[56, 59, 56, 59, 57, 59, 57, 59].map((m, i) => [m, i * T / 4, (i + 1) * T / 4]),
    ])], [{ delta: 0, bytes: trackName('Left') }, ...line([[40, 0, 2 * T]])]]);
    const b = barsOf(convertMidi(three, { title: 'three' }).xml)[0].filter((n) => n.staff === 1);
    const voiceOf = (name, at) => b.find((n) => n.name === name && n.at === at)?.voice;
    expect([voiceOf('E4', '0'), voiceOf('D#4', '1/2'), voiceOf('F#4', '1')]).toEqual([1, 1, 1]);
    expect(voiceOf('D#4', '1')).toBe(5);
    expect(new Set(b.filter((n) => /^(G#3|A3|B3)$/.test(n.name)).map((n) => n.voice))).toEqual(new Set([3]));
  });
  it('keeps one voice a staff for a played file (its lengths are its touch, not the music’s)', () => {
    const played = convertMidi(build((i) => [13, -9, 17, -11, 7, -15, 11, -7][i % 8]), { title: 'played' });
    expect(played.report.onGrid).toBeLessThan(0.25);
    expect(played.xml.includes('<voice>3</voice>')).toBe(false);
  });
});

// --- new (2026-10-14): the key signatures the file states, and where they change -----------------------------------
// The converter used to estimate the key from the notes and drop the file's: on ASAP's score MIDI files the
// opening key was wrong on 21 of 180, and no key change was ever written.

describe('the key the file states', () => {
  const keyEvent = (sharps, minor) => [0xff, 0x59, 0x02, sharps & 0xff, minor ? 1 : 0];
  const line = (midis) => midis.flatMap((m) => [{ delta: 0, bytes: noteOn(m) }, { delta: 480, bytes: noteOff(m) }]);
  const convertWith = (conductor, midis) =>
    convertMidi(buildMidiTracks([[{ delta: 0, bytes: timeSignature(4, 2) }, ...conductor], line(midis)]), { title: 'key' });

  it('is the key written, named with its mode, when the file states one', () => {
    // G minor's notes, stated as G minor (two flats, the minor byte set).
    const { xml: written, report } = convertWith([{ delta: 0, bytes: keyEvent(-2, true) }], [67, 70, 74, 72, 70, 69, 66, 67]);
    const xml = written.replace(/\s+/g, '');
    expect(report.keyFrom).toBe('the file');
    expect(report.key).toBe('G minor');
    expect(xml).toContain('<key><fifths>-2</fifths></key>');
    expect(xml).toContain('<step>B</step><alter>-1</alter>');
    expect(xml).toContain('<step>F</step><alter>1</alter>');
  });
  it('is taken for a default when the file states only C major and the notes say otherwise', () => {
    // D major's notes with C major stated, as a sequencer writes when nobody set a key.
    const { report } = convertWith([{ delta: 0, bytes: keyEvent(0, false) }], [62, 64, 66, 67, 69, 71, 73, 74, 69, 66, 62, 62]);
    expect(report.keyFrom).toBe('estimated from the notes');
    expect(report.key).toBe('D major');
  });
  it('changes at the bar the file changes it, and the notes after it are spelled from the new key', () => {
    // C major for a bar, then A major (three sharps) from bar 2.
    const { xml, report } = convertWith(
      [{ delta: 0, bytes: keyEvent(0, false) }, { delta: 1920, bytes: keyEvent(3, false) }],
      [60, 64, 67, 72, 69, 73, 76, 68],
    );
    expect(report.keyFrom).toBe('the file');
    expect(report.keyChanges).toBe(1);
    const second = (/<measure number="2"[^>]*>([\s\S]*?)<\/measure>/.exec(xml)?.[1] ?? '').replace(/\s+/g, '');
    expect(second).toContain('<key><fifths>3</fifths></key>');
    expect(second).toContain('<step>C</step><alter>1</alter>');
    expect(second).toContain('<step>G</step><alter>1</alter>');
    expect(second.includes('<step>A</step><alter>-1</alter>')).toBe(false);
  });
});

describe('a played file is told apart from a written one', () => {
  // The same exercise written out exactly, and played with up to 35 ms of jitter on every note.
  const clean = convertMidi(fixture('parity/rendered-clean.mid'), { title: 'clean' }).report;
  const played = convertMidi(fixture('parity/rendered-jitter35.mid'), { title: 'played' }).report;
  it('measures how many onsets were already on the grid', () => {
    expect(clean.onGrid).toBe(1);
    expect(played.onGrid).toBeLessThan(0.25);
  });
  it('says the bars and rhythms are a guess for the played one, and nothing of the kind for the written one', () => {
    expect(checkSentence(played)).toMatch(/^The timing looks played rather than written/);
    expect(checkSentence(clean)).toMatch(/^Checked: all \d+ notes the reader found are in the score, at the times the file gives them/);
  });
});

// --- run -------------------------------------------------------------------------------------------------------

let passed = 0;
const failed = [];
for (const test of tests) {
  try {
    await test.fn();
    passed += 1;
  } catch (error) {
    failed.push({ name: test.name, error });
  }
}
for (const { name, error } of failed) console.log(`FAIL ${name}\n     ${error instanceof Error ? error.message : String(error)}`);
for (const { name, why } of skipped) console.log(`skip ${name}${why === 'skipIf' ? ' (no hand split in this reference: kept as recorded)' : ` — ${why}`}`);
console.log(`\n${passed} passed, ${failed.length} failed, ${skipped.length} skipped`);
process.exit(failed.length > 0 ? 1 : 0);
