// Deleting a piece you added also deletes what the app kept for it (owner, 2026-10-13): its playing choices, its
// look per screen, your fingering and its Memorise place, bars learned and memorized mark. The formats are the
// owners' (settings.ts, marks.ts, memorise.ts); this only removes the piece's entries from them.

const edit = (key: string, f: (v: Record<string, unknown>) => void) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const v = JSON.parse(raw) as Record<string, unknown>;
    f(v);
    localStorage.setItem(key, JSON.stringify(v));
  } catch { /* unreadable or full: nothing to remove, or nothing more to do */ }
};
const mine = (id: string) => (k: string) => k === id || k.startsWith(`${id}|`);
const drop = (o: unknown, test: (k: string) => boolean) => { if (o && typeof o === 'object') for (const k of Object.keys(o)) if (test(k)) delete (o as Record<string, unknown>)[k]; };

export function forgetPiece(id: string): void {
  edit('piano-web.songs.v1', (v) => { delete v[id]; });
  edit('piano-web.settings.v2', (v) => { for (const d of Object.values(v)) drop((d as { pieces?: unknown })?.pieces, (k) => k === id); });
  edit('piano-web.marks.v1', (v) => { delete v[id]; });
  edit('piano-web.memorise.v1', (v) => {
    for (const part of ['progress', 'learned', 'marks']) drop(v[part], mine(id));
    drop(v.pieces, (k) => k === id);
  });
}
