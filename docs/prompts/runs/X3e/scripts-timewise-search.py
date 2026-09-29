"""X3e item 4: which bundled scores are timewise. Every file under the folders given (default:
app/public/content/scores): a .mxl is unzipped and every XML member read; a .musicxml or .xml read as it
is. Prints one line per file whose root is <score-timewise>, then the counts by root."""
from __future__ import annotations

import re
import sys
import zipfile
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
ROOTS = re.compile(rb"<(score-partwise|score-timewise)[\s>]")


def roots_of(path: Path) -> list[str]:
    found: list[str] = []
    if path.suffix.lower() == ".mxl":
        with zipfile.ZipFile(path) as archive:
            for name in archive.namelist():
                if name.startswith("META-INF/") or not name.lower().endswith((".xml", ".musicxml")):
                    continue
                match = ROOTS.search(archive.read(name)[:20000])
                if match:
                    found.append(match.group(1).decode())
    else:
        match = ROOTS.search(path.read_bytes()[:20000])
        if match:
            found.append(match.group(1).decode())
    return found


def main() -> int:
    folders = [ROOT / arg for arg in sys.argv[1:]] or [ROOT / "app" / "public" / "content" / "scores"]
    counts: Counter[str] = Counter()
    files = 0
    for folder in folders:
        for path in sorted(folder.rglob("*")):
            if not path.is_file() or path.suffix.lower() not in (".mxl", ".musicxml", ".xml"):
                continue
            files += 1
            roots = roots_of(path)
            for root in roots or ["neither"]:
                counts[root] += 1
            if "score-timewise" in roots:
                print(f"timewise: {path.relative_to(ROOT).as_posix()}")
    print(f"folders: {', '.join(f.relative_to(ROOT).as_posix() for f in folders)}")
    print(f"files read: {files}")
    for root, n in sorted(counts.items()):
        print(f"{root}: {n}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
