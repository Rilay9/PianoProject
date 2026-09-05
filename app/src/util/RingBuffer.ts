/**
 * Fixed-capacity FIFO that overwrites its oldest entry when full.
 *
 * Used for the MIDI diagnostics log (500 messages) and the render-timing log.
 * Both run for the whole life of the page while messages arrive at up to a few
 * hundred per second, so the buffer must never grow and must never allocate
 * per push — hence a pre-sized array and a moving write cursor rather than
 * `Array.prototype.shift()`.
 */
export class RingBuffer<T> {
  private readonly items: (T | undefined)[];
  private writeIndex = 0;
  private count = 0;

  constructor(readonly capacity: number) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new RangeError(`RingBuffer capacity must be a positive integer, got ${capacity}`);
    }
    this.items = new Array<T | undefined>(capacity);
  }

  push(item: T): void {
    this.items[this.writeIndex] = item;
    this.writeIndex = (this.writeIndex + 1) % this.capacity;
    if (this.count < this.capacity) this.count += 1;
  }

  /** Number of entries currently held (≤ capacity). */
  get size(): number {
    return this.count;
  }

  /** Oldest first. Allocates — call it when rendering, not per message. */
  toArray(): T[] {
    const out: T[] = new Array<T>(this.count);
    const start = (this.writeIndex - this.count + this.capacity) % this.capacity;
    for (let i = 0; i < this.count; i += 1) {
      out[i] = this.items[(start + i) % this.capacity] as T;
    }
    return out;
  }

  /** The `n` most recent entries, oldest first. */
  latest(n: number): T[] {
    const all = this.toArray();
    return n >= all.length ? all : all.slice(all.length - n);
  }

  clear(): void {
    this.items.fill(undefined);
    this.writeIndex = 0;
    this.count = 0;
  }
}
