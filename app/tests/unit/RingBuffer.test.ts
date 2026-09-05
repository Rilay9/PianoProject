import { describe, expect, it } from 'vitest';
import { RingBuffer } from '../../src/util/RingBuffer';

describe('RingBuffer', () => {
  it('returns entries oldest-first while under capacity', () => {
    const buf = new RingBuffer<number>(4);
    buf.push(1);
    buf.push(2);
    expect(buf.toArray()).toEqual([1, 2]);
    expect(buf.size).toBe(2);
  });

  it('overwrites the oldest entry once full', () => {
    const buf = new RingBuffer<number>(3);
    for (const n of [1, 2, 3, 4, 5]) buf.push(n);
    expect(buf.toArray()).toEqual([3, 4, 5]);
    expect(buf.size).toBe(3);
  });

  it('wraps correctly over many multiples of the capacity', () => {
    const buf = new RingBuffer<number>(5);
    for (let i = 0; i < 103; i += 1) buf.push(i);
    expect(buf.toArray()).toEqual([98, 99, 100, 101, 102]);
  });

  it('latest(n) returns the n most recent entries, oldest-first', () => {
    const buf = new RingBuffer<number>(10);
    for (let i = 0; i < 8; i += 1) buf.push(i);
    expect(buf.latest(3)).toEqual([5, 6, 7]);
    expect(buf.latest(100)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('clear() empties it and resets the write cursor', () => {
    const buf = new RingBuffer<number>(3);
    buf.push(1);
    buf.push(2);
    buf.clear();
    expect(buf.toArray()).toEqual([]);
    buf.push(9);
    expect(buf.toArray()).toEqual([9]);
  });

  it('rejects a non-positive capacity', () => {
    expect(() => new RingBuffer<number>(0)).toThrow(RangeError);
    expect(() => new RingBuffer<number>(1.5)).toThrow(RangeError);
  });
});
