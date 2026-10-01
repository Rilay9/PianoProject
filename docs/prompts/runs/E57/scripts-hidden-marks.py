"""
E57: whether any committed PDMX row's raw upload marks a tempo direction as not printed. The marks E57 keeps are written
as the upload writes them; a `<metronome>` the upload hid (`print-object="no"`) would be drawn by the converted file.

    python scripts-hidden-marks.py

Reads every raw upload in build/e57/pdmx/raw (scripts-pdmx-raw.py). Output: runs/E57/hidden-marks.txt.
"""
from __future__ import annotations

import io
import re
import sys
import zipfile
from pathlib import Path

W = Path(__file__).resolve().parents[4]


def main() -> int:
    raws = sorted((W / "build/e57/pdmx/raw").glob("*.mxl"))
    files = directions = hidden_files = hidden = 0
    for path in raws:
        with zipfile.ZipFile(io.BytesIO(path.read_bytes())) as archive:
            names = [n for n in archive.namelist() if n.lower().endswith((".xml", ".musicxml")) and not n.upper().startswith("META-INF/")]
            text = archive.read(names[0]).decode("utf-8", "replace")
        blocks = [b for b in re.findall(r"<direction\b.*?</direction>", text, re.S) if "<sound tempo" in b or "<metronome" in b]
        marked = [b for b in blocks if 'print-object="no"' in b]
        files += 1
        directions += len(blocks)
        hidden_files += bool(marked)
        hidden += len(marked)
    line = (f"{files} raw uploads read; {directions} tempo directions (a <metronome> or a <sound tempo>); "
            f"marked print-object=\"no\": {hidden} in {hidden_files} upload(s)")
    (W / "docs/prompts/runs/E57/hidden-marks.txt").write_text(line + "\n", encoding="utf-8")
    print(line)
    return 0


if __name__ == "__main__":
    sys.exit(main())
