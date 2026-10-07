"""Exploration: python-ly's writer on a .ly, printing the named measures note by note (pitch/voice/staff/duration, backups)."""
import sys
from pathlib import Path
from xml.etree import ElementTree as ET

import ly.musicxml

writer = ly.musicxml.writer()
writer.parse_text(Path(sys.argv[1]).read_text(encoding="utf-8", errors="replace"))
root = ET.fromstring(writer.musicxml().tostring())
wanted = {s for s in sys.argv[2].split(",")}
for m in root.iter("measure"):
    if m.get("number") not in wanted:
        continue
    row = []
    for el in m:
        if el.tag == "note":
            p = el.find("pitch")
            pitch = (p.findtext("step") + (p.findtext("alter") or "") + p.findtext("octave")) if p is not None else "r"
            tie = "~" if el.find("tie[@type='start']") is not None else ""
            row.append(f"{pitch}{tie}/v{el.findtext('voice')}/s{el.findtext('staff')}/d{el.findtext('duration')}{'+' if el.find('chord') is not None else ''}")
        elif el.tag in ("backup", "forward"):
            row.append(f"<{el.tag} {el.findtext('duration')}>")
    print(f"m{m.get('number')}: " + " ".join(row))
