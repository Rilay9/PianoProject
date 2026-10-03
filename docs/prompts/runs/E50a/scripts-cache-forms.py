"""
E50a: which conversions in the main checkout's cache are dated forms of the music the laptop's catalogue holds
now — a cache entry exists because a laptop build converted it that day and put it in that build's catalogue,
so an entry whose undated bytes equal a current build-converted file's undated bytes is a historical identity
of that file's music. Read in place; nothing written but the output. Output: cache-forms.txt.
"""
from __future__ import annotations

import hashlib
import io
import json
import re
import sys
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

W = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(W / "tools" / "content"))
import convert  # noqa: E402

M = Path(r"C:\Users\yalir\repos\Piano Stuff\PianoProject")
OUT = W / "docs" / "prompts" / "runs" / "E50a" / "cache-forms.txt"


def undated(raw: bytes) -> tuple[str | None, str | None]:
    """(the date, the sha256 of the file with its date removed and re-zipped as the converter zips) for a
    dated music21 .mxl; (None, None) otherwise."""
    try:
        with zipfile.ZipFile(io.BytesIO(raw)) as archive:
            entries = [(i.filename, archive.read(i.filename)) for i in archive.infolist()]
    except zipfile.BadZipFile:
        return None, None
    day = None
    out = []
    for name, data in entries:
        if convert.is_text_entry(name):
            text = data.decode("utf-8")
            found = re.search(r"<encoding>(?:(?!</encoding>).)*?<encoding-date>([^<]*)</encoding-date>", text, re.DOTALL)
            if found and "<software>music21 v." in text:
                day = found.group(1)
            data = convert.without_encoding_date(text).encode("utf-8")
        out.append((name, data))
    if day is None:
        return None, None
    return day, hashlib.sha256(convert.pinned_archive(out)).hexdigest()


def main() -> int:
    folder = M / "app" / "public" / "content"
    rows = json.loads((folder / "catalog.json").read_text(encoding="utf-8"))
    current: dict[str, tuple[str, str]] = {}
    for row in rows:
        identity = (row.get("provenance") or {}).get("identity") or {}
        if identity.get("kind") != "file" or row["provenance"]["source"] in ("pdmx", "excerpt"):
            continue
        day, key = undated((folder / row["file"]).read_bytes())
        if day is not None:
            current[key] = (row["file"], day)
    lines = [f"current build-converted files (the laptop's catalogue), by undated form: {len(current)}"]
    matches: dict[str, set[str]] = defaultdict(set)
    days_all: Counter = Counter()
    days_current: Counter = Counter()
    for payload in sorted((M / "build" / "cache" / "convert").glob("*.mxl")):
        day, key = undated(payload.read_bytes())
        if day is None:
            continue
        days_all[day] += 1
        if key in current:
            days_current[day] += 1
            matches[current[key][0]].add(day)
    lines.append("cache entries by date, all: " + ", ".join(f"{d}: {n}" for d, n in sorted(days_all.items())))
    lines.append("cache entries that are a dated form of a current file's music, by date: "
                 + ", ".join(f"{d}: {n}" for d, n in sorted(days_current.items())))
    extra = {f: sorted(ds - {current_day}) for f, ds in matches.items()
             for current_day in [next(d for k, (ff, d) in current.items() if ff == f)] if ds - {current_day}}
    lines.append(f"current files with a cached dated form on a day other than their catalogue file's: {len(extra)}")
    for f, ds in sorted(extra.items()):
        lines.append(f"   {f}: {', '.join(ds)}")
    missing = [f for k, (f, d) in current.items() if f not in matches]
    lines.append(f"current files with no dated form in the cache at all: {len(missing)}")
    for f in missing[:20]:
        lines.append(f"   {f}")
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    return 0


if __name__ == "__main__":
    sys.exit(main())
