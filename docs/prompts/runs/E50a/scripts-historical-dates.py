"""
E50a: the evidence for the former-identity set's two bounds (the reviewer's rule of questions-71bd6cee.md,
which replaced the build-day-plus-14 window): which conversion days the dated files music21 wrote carry, in
every catalogue this machine holds that could have been installed, read in place and never written.

- The laptop's deployable catalogues: the main checkout's `app/public/content` (what the build wrote) and
  `app/dist/content` (what `vite preview` serves to the phone, D25), each catalogue row's file read from its
  own folder and checked against the row's identity.
- The main checkout's conversion cache (`build/cache/convert/*.mxl`): every conversion a build can serve on a
  hit; an entry dated before the converter's last move (2026-09-16) belongs to an older fingerprint and can
  never be served again.
- This lane's before build (the base, built with the main checkout's cache), for comparison.

Output: historical-dates.txt.
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
M = Path(r"C:\Users\yalir\repos\Piano Stuff\PianoProject")
OUT = W / "docs" / "prompts" / "runs" / "E50a" / "historical-dates.txt"
lines: list[str] = []


def say(text: str) -> None:
    lines.append(text)
    print(text, flush=True)


def encoding_of(raw: bytes) -> tuple[str | None, str | None]:
    """(software, date) of the score entry's `<encoding>`, or Nones."""
    try:
        with zipfile.ZipFile(io.BytesIO(raw)) as archive:
            names = [n for n in archive.namelist() if n.lower().endswith((".xml", ".musicxml")) and not n.upper().startswith("META-INF/")]
            text = archive.read(names[0]).decode("utf-8") if names else ""
    except zipfile.BadZipFile:
        return None, None
    block = re.search(r"<encoding>(.*?)</encoding>", text, re.DOTALL)
    if not block:
        return None, None
    software = re.search(r"<software>([^<]*)</software>", block.group(1))
    day = re.search(r"<encoding-date>([^<]*)</encoding-date>", block.group(1))
    return (software.group(1) if software else None), (day.group(1) if day else None)


def catalogue(folder: Path, label: str) -> dict[str, tuple[str, str]]:
    """Per build-converted row's file: (its date, its sha256). Prints the dates by class."""
    rows = json.loads((folder / "catalog.json").read_text(encoding="utf-8"))
    by_class: dict[str, Counter] = defaultdict(Counter)
    found: dict[str, tuple[str, str]] = {}
    mismatched = 0
    for row in rows:
        identity = (row.get("provenance") or {}).get("identity") or {}
        if identity.get("kind") != "file":
            continue
        raw = (folder / row["file"]).read_bytes()
        sha = hashlib.sha256(raw).hexdigest()
        if sha != identity["sha256"]:
            mismatched += 1
        software, day = encoding_of(raw)
        source = row["provenance"]["source"]
        if software and software.startswith("music21 v.") and day:
            klass = "committed PDMX copy (music21, dated)" if source == "pdmx" else "build-converted (music21, dated)"
            by_class[klass][day] += 1
            if source != "pdmx":
                found[row["file"]] = (day, sha)
        elif software and software.startswith("music21 v."):
            by_class["music21, undated"]["-"] += 1
        else:
            by_class[f"not music21 ({source})"][day or "no date"] += 1
    say(f"## {label}: {folder}")
    say(f"   {len(rows)} rows; file identities whose sha256 is not the file's: {mismatched}")
    for klass, days in sorted(by_class.items()):
        say(f"   {klass}: {sum(days.values())} — " + ", ".join(f"{d}: {n}" for d, n in sorted(days.items())))
    return found


def main() -> int:
    public = catalogue(M / "app" / "public" / "content", "the laptop's built catalogue")
    dist_folder = M / "app" / "dist" / "content"
    dist = catalogue(dist_folder, "the laptop's served catalogue (app/dist)") if (dist_folder / "catalog.json").is_file() else {}
    same = public == dist
    say(f"   app/dist's build-converted identities equal app/public's: {same}")
    before = catalogue(W / "build" / "e50a" / "before" / "content", "this lane's before build (the base, the main checkout's cache)")
    say(f"   the before build's build-converted identities equal the laptop's: {before == public}"
        f" ({sum(1 for k in public if before.get(k) == public[k])} of {len(public)} files the same)")

    cache = M / "build" / "cache" / "convert"
    days: Counter = Counter()
    other: Counter = Counter()
    for payload in sorted(cache.glob("*.mxl")):
        software, day = encoding_of(payload.read_bytes())
        if software and software.startswith("music21 v.") and day:
            days[day] += 1
        else:
            other[software or "unreadable"] += 1
    say(f"## the main checkout's conversion cache: {cache}")
    say(f"   {sum(days.values())} dated music21 entries — " + ", ".join(f"{d}: {n}" for d, n in sorted(days.items())))
    if other:
        say(f"   other entries: {dict(other)}")

    proven = sorted({day for day, _ in public.values()} | {day for day, _ in dist.values()})
    say("## the proven conversion days of build-converted files in the laptop's deployable catalogues")
    say("   " + ", ".join(proven))
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
