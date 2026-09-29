"""Exploration: python-ly's MusicXML for one .ly, measure by measure: number, repeat barlines, endings, notes per staff/part."""
import re
import sys
from pathlib import Path

import ly.musicxml

src = Path(sys.argv[1])
writer = ly.musicxml.writer()
writer.parse_text(src.read_text(encoding="utf-8", errors="replace"))
xml = writer.musicxml().tostring().decode("utf-8")
if len(sys.argv) > 2:
    Path(sys.argv[2]).write_text(xml, encoding="utf-8")
parts = re.findall(r"<part id=\"([^\"]+)\">(.*?)</part>", xml, re.S)
print("parts", [p[0] for p in parts])
for pid, body in parts:
    measures = re.findall(r"<measure[^>]*number=\"([^\"]+)\"[^>]*>(.*?)</measure>", body, re.S)
    print(pid, "measures", len(measures))
    for number, m in measures:
        marks = re.findall(r"<repeat direction=\"(\w+)\"|<ending[^>]*number=\"([^\"]+)\"[^>]*type=\"(\w+)\"", m)
        staves = re.findall(r"<staff>(\d)</staff>", m)
        notes = len(re.findall(r"<note>|<note ", m))
        durs = re.findall(r"<backup>", m)
        if marks or len(sys.argv) > 3:
            print(f"  m{number}: notes {notes} staves {sorted(set(staves))} backups {len(durs)} marks {marks}")
