"""E59: how music21 (the pinned version) exports a metronome mark built with `number=96`, with the `numberSounding=96`
keyword and with the `numberSounding` attribute set. Output: runs/E59/probe-mark.txt (`python scripts-probe-mark.py`)."""
from music21 import __version__, stream, tempo, note
from music21.musicxml.m21ToXml import GeneralObjectExporter

print(__version__)
for label, mark in (("number", tempo.MetronomeMark(number=96)),
                    ("numberSounding kw", tempo.MetronomeMark(numberSounding=96)),
                    ("attr", (lambda m: (setattr(m, "numberSounding", 96), m)[1])(tempo.MetronomeMark()))):
    print(label, mark.number, mark.numberSounding, mark.getQuarterBPM(), mark.text, repr(mark.referent))
    s = stream.Score()
    p = stream.Part()
    m = stream.Measure(number=1)
    m.insert(0, mark)
    m.append(note.Note("C4", type="whole"))
    p.append(m)
    s.insert(0, p)
    xml = GeneralObjectExporter(s).parse().decode("utf-8")
    i = xml.find("<direction")
    print(xml[i:xml.find("</direction>", i) + 12])
