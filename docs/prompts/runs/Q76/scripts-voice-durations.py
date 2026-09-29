"""Exploration: python-ly's MusicXML for a (preprocessed) .ly, the measures where a voice's summed duration differs from the bar's."""
import re
import sys
from fractions import Fraction
from pathlib import Path
from xml.etree import ElementTree as ET

import ly.musicxml

src = Path(sys.argv[1])
writer = ly.musicxml.writer()
writer.parse_text(src.read_text(encoding="utf-8", errors="replace"))
root = ET.fromstring(writer.musicxml().tostring())
divisions = None
beats = Fraction(2)
shown = 0
for part in root.iter("part"):
    for measure in part.iter("measure"):
        attrs = measure.find("attributes")
        if attrs is not None:
            if attrs.find("divisions") is not None:
                divisions = int(attrs.find("divisions").text)
            t = attrs.find("time")
            if t is not None:
                beats = Fraction(int(t.find("beats").text) * 4, int(t.find("beat-type").text))
        voices = {}
        for el in measure:
            if el.tag == "note":
                if el.find("chord") is not None or el.find("grace") is not None:
                    continue
                v = el.findtext("voice") or "1"
                staff = el.findtext("staff") or "1"
                d = Fraction(int(el.findtext("duration") or 0), divisions)
                voices[(staff, v)] = voices.get((staff, v), Fraction(0)) + d
        bad = {k: str(v) for k, v in voices.items() if v != beats}
        if bad and shown < int(sys.argv[2] if len(sys.argv) > 2 else 40):
            shown += 1
            print(f"m{measure.get('number')}: bar {beats} quarters; voices {bad}")
