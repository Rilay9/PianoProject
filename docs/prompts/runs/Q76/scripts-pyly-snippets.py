"""Exploration: python-ly's writer on small two-voice snippets, printing each note's voice, staff, duration and backups."""
import sys
from xml.etree import ElementTree as ET

import ly.musicxml

SNIPPETS = {
    "voices-then-notes": r"""\version "2.18.2"
\score { \new PianoStaff << \new Staff = "up" { \time 2/4 c''4 d''4 | << { e''8 f''8 g''8 a''8 } \\ { c''2 } >> | b''2 | c''4 d''4 | } \new Staff = "down" { \clef bass \time 2/4 c4 d4 | e4 f4 | g4 a4 | b4 c'4 | } >> }
""",
    "short-lower-voice": r"""\version "2.18.2"
\score { \new PianoStaff << \new Staff = "up" { \time 2/4 c''4 << { f''16 e''16 f''16 g''16 } \\ { bes'4 } >> | a''2 | << { c''4 d''4 } \\ { e'2 } >> | g''2 | } \new Staff = "down" { \clef bass \time 2/4 c4 d4 | e4 f4 | g4 a4 | b4 c'4 | } >> }
""",
}
for name, text in SNIPPETS.items():
    writer = ly.musicxml.writer()
    writer.parse_text(text)
    root = ET.fromstring(writer.musicxml().tostring())
    print("==", name)
    for m in root.iter("measure"):
        row = []
        for el in m:
            if el.tag == "note":
                p = el.find("pitch")
                pitch = (p.findtext("step") + p.findtext("octave")) if p is not None else "r"
                row.append(f"{pitch}/v{el.findtext('voice')}/s{el.findtext('staff')}/d{el.findtext('duration')}{'+' if el.find('chord') is not None else ''}")
            elif el.tag in ("backup", "forward"):
                row.append(f"<{el.tag} {el.findtext('duration')}>")
        print(f"  m{m.get('number')}: " + " ".join(row))
