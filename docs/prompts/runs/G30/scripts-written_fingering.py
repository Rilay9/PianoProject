"""Counts the `<fingering>` elements in every generated file the build wrote, per family: what reaches the screen.

usage: python docs/prompts/runs/G30/scripts-written_fingering.py <content-dir> <out.txt>
Reads `<content-dir>/catalog.json`, opens each generated row's `.mxl` (a zip) and counts `<fingering>` in its
MusicXML. The renderer draws whatever `<fingering>` a file carries (`OsmdView.ts`'s `drawFingerings`), and the
keyboard strip shows the same numbers on the marked keys (`ScoreSession.fingersOf`), so this is the page's count.
"""
from __future__ import annotations

import json
import re
import sys
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

FINGERING = re.compile(rb"<fingering[ >]")


def main() -> None:
    content = Path(sys.argv[1])
    catalog = json.loads((content / "catalog.json").read_text(encoding="utf-8"))
    counts: dict[str, Counter] = defaultdict(Counter)
    for row in catalog:
        generator = (row.get("drill") or {}).get("generator")
        if not generator or not row.get("file"):
            continue
        family = generator["family"]
        with zipfile.ZipFile(content / row["file"]) as archive:
            found = sum(len(FINGERING.findall(archive.read(name))) for name in archive.namelist()
                        if name.endswith((".xml", ".musicxml")) and not name.startswith("META-INF"))
        counts[family]["items"] += 1
        counts[family]["fingerings"] += found
        counts[family]["items printing"] += bool(found)
    lines = ["family | items | items whose file prints a finger | <fingering> elements"]
    for family in sorted(counts):
        c = counts[family]
        lines.append(f"{family} | {c['items']} | {c['items printing']} | {c['fingerings']}")
    printing = sorted(f for f, c in counts.items() if c["fingerings"])
    lines += ["", f"families whose files print fingering: {len(printing)}: {', '.join(printing)}"]
    Path(sys.argv[2]).write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(lines[-1])


if __name__ == "__main__":
    main()
