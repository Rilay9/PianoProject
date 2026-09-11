/**
 * Rendered PDF pages kept in memory, bounded — but never evicting a page the
 * viewer is showing right now (docs/04 §5b).
 *
 * A plain `Map` evicted in insertion order works only while the number of
 * pages needed on screen at once is smaller than the cache. `PdfScreen` reads
 * one page for the system being played and as many "coming next" pages as
 * fit under it (`followCount`), and that count is not bounded by anything —
 * a piece with small systems (a hymn, a one-line lead sheet) on a tall stage
 * can fit read-ahead spanning four or five pages. A cache sized for "the
 * current page plus one neighbour" would insert the current page first,
 * insert three more while still fetching them, and evict the current page
 * before the fetch finished — blanking exactly what the reader is looking
 * at. `set` is told which pages must survive this insert and only evicts
 * pages outside that set; if more pages are wanted at once than the cache's
 * target size, the cache grows rather than dropping one of them.
 */
export class BoundedPageCache<T> {
  private readonly map = new Map<number, T>();

  constructor(private readonly targetSize: number) {}

  get size(): number {
    return this.map.size;
  }

  has(page: number): boolean {
    return this.map.has(page);
  }

  get(page: number): T | undefined {
    return this.map.get(page);
  }

  clear(): void {
    this.map.clear();
  }

  /**
   * Stores `value` for `page`, then evicts the oldest entries down to the
   * target size — skipping every page in `keep` (and `page` itself, which is
   * always kept since it was just asked for).
   */
  set(page: number, value: T, keep: Iterable<number> = []): void {
    this.map.set(page, value);
    const keepSet = new Set(keep);
    keepSet.add(page);
    for (const cached of this.map.keys()) {
      if (this.map.size <= this.targetSize) break;
      if (keepSet.has(cached)) continue;
      this.map.delete(cached);
    }
  }
}
