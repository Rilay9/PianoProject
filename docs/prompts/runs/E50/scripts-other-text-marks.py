"""
E50 item 10: every committed PDMX file (content/scores/pdmx/*.mxl, `pdmx.json`'s rows) scanned for a `<words>` direction
the door's `TEXT_MARK` reads (SMuFL's glyphs mapped, `convert.TEXT_TEMPO_MARK`), with the file's `<metronome>`s, its
`<sound tempo>`s and its first time signature beside it, so the two that print a mark beside a tempo of their own can be
compared with their sound. A reading from the notation only; nothing heard. Output: runs/E50/other-text-marks.txt.
"""
from __future__ import annotations

import io
import json
import re
import sys
import zipfile
from pathlib import Path

W = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(W / "tools" / "content"))
import convert  # noqa: E402

LOG = W / "docs" / "prompts" / "runs" / "E50" / "other-text-marks.txt"


def main() -> int:
    items = json.loads((W / "content/sources/pdmx.json").read_text(encoding="utf-8"))["items"]
    lines: list[str] = []
    scanned = 0
    for row in items:
        path = W / "content/scores/pdmx" / row["file"]
        if not path.is_file():
            continue
        scanned += 1
        with zipfile.ZipFile(io.BytesIO(path.read_bytes())) as archive:
            names = [n for n in archive.namelist() if n.lower().endswith((".xml", ".musicxml")) and not n.upper().startswith("META-INF/")]
            xml = archive.read(names[0]).decode("utf-8")
        marks = []
        for raw in re.findall(r"<words\b[^>]*>([^<]*)</words>", xml):
            text = "".join(convert.METRONOME_GLYPHS.get(c, c) for c in raw.replace("&amp;", "&")).strip(convert.JS_WHITESPACE)
            if convert.TEXT_TEMPO_MARK.match(text):
                marks.append(text)
        if not marks:
            continue
        metronomes = [re.sub(r"\s+", "", m) for m in re.findall(r"<metronome\b.*?</metronome>", xml, re.S)]
        sounds = re.findall(r'<sound[^>]*\btempo="([^"]*)"', xml)
        time = re.search(r"<beats>(\d+)</beats>\s*<beat-type>(\d+)</beat-type>", xml)
        lines.append(f"{row['id']} ({row['file']}): printed {[m.encode('ascii', 'backslashreplace').decode() for m in marks]}; "
                     f"<metronome> {metronomes[:3]}; <sound tempo> {sounds[:5]}; first time {time.group(1) + '/' + time.group(2) if time else None}; "
                     f"row tempoBpm {row['tempoBpm']}, tempoDefaulted {row['tempoDefaulted']}")
    lines.append(f"{scanned} committed PDMX files scanned; {len(lines)} print a text mark")
    LOG.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    return 0


if __name__ == "__main__":
    sys.exit(main())
