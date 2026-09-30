"""The catalogue facts F3a's sentences rest on, read from a built catalog.json."""
import json
import sys
from pathlib import Path

WT = Path(__file__).resolve().parents[2]
path = Path(sys.argv[1]) if len(sys.argv) > 1 else WT / "app" / "public" / "content" / "catalog.json"
cat = json.loads(path.read_text(encoding="utf-8"))
by = {r["id"]: r for r in cat}
print(f"catalog: {path} ({len(cat)} rows)")
IDS = [
    "song.folk.the-water-is-wide.pdmx",
    "song.ragtime.joplin-easy-winners",
    "song.ragtime.joplin-peacherine-rag",
    "song.ragtime.joplin-entertainer",
    "song.ragtime.joplin-sugar-cane",
    "song.ragtime.joplin-maple-leaf-rag",
    "song.folk.boogie-woogie.pdmx",
    "song.folk.old-french-song.pdmx",
    "song.classical.schumann-schumann-album-for-the-young-op-68-no-16-first-grief.pdmx",
    "exercise.trill.c.4pb.left",
    "exercise.boogie.c.pinetop",
]
for i in IDS:
    r = by.get(i)
    if not r:
        print(i, "MISSING")
        continue
    n = r.get("notation") or {}
    print(f"{i}\n  title={r.get('title')!r} composer={r.get('composer')!r} level={r.get('level')} tempoBpm={r.get('tempoBpm')}")
    print(f"  tags={r.get('tags')}\n  keys={n.get('keys')} bars={n.get('bars')} file={r.get('file')}")
    print(f"  source={r.get('source')!r} license={r.get('license')!r}")
    extra = {k: v for k, v in r.items() if k in ("year", "publishedYear", "attribution", "sourceUrl", "facts", "editionNotes", "provenance")}
    if extra:
        print("  extra=", json.dumps(extra, ensure_ascii=False)[:1200])
    print("  fields=", sorted(r.keys()))
